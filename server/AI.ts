import 'dotenv/config';

import https from 'https';
import { systemLogsStore, engineStatesStore } from './src/store/engineStore';
import { IncomingMessage } from 'http';
import ccxt from 'ccxt';
import mongoose from 'mongoose';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { isOriginAllowed } from './src/config/cors';

import { CONFIG } from './src/config';
import { calculateDynamicAmount } from './src/strategy';
import { createInitialPositionState, processActivePosition, executeSell } from './src/tradeManager';
import { ExtendedPositionState } from './src/tradeManager';
import { decrypt } from './src/utils/crypto.utils';
import User from './src/models/User';

// Diagnostics
console.log("===[ ENV DIAGNOSTICS ]===");
console.log("Server environment loaded successfully.");
console.log("=========================");

// Initialize MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/weex_bot';
mongoose.connect(MONGODB_URI)
  .then(() => console.log('🍃 [Database] MongoDB connected successfully'))
  .catch((err) => console.error('❌ [Database] Connection error:', err.message));

const PORT = Number(process.env.PORT) || 3001;
const httpServer = createServer();

const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        callback(null, true);
      } else {
        callback(new Error('CORS Policy: Request origin blocked.'));
      }
    },
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  },
});

io.on('connection', (socket) => {
  console.log(`⚡ [Trading WebSocket] Client connected to Bot Engine: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`🔌 [Trading WebSocket] Client disconnected: ${socket.id}`);
  });
});

export function emitSystemLog(engine: string, type: 'BUY' | 'TAKE_PROFIT' | 'STOP_LOSS' | 'INFO', message: string) {
  const logEntry = {
    id: Date.now().toString(),
    engine,
    type,
    message,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };

  systemLogsStore.unshift(logEntry);
  if (systemLogsStore.length > 50) systemLogsStore.pop();

  io.emit('engine_log', logEntry);
}

export function emitEngineState(engineId: string, payload: any) {
  engineStatesStore[engineId] = {
    ...engineStatesStore[engineId],
    ...payload
  };

  io.emit('engine_state_update', {
    engineId,
    ...payload
  });
}

function calculateLivePnL(position: ExtendedPositionState, currentPrice: number): number {
  if (!position.isHoldingPosition || !position.entryPrice) return 0;
  const pnl = ((currentPrice - position.entryPrice) / position.entryPrice) * 100;
  return parseFloat(pnl.toFixed(2));
}

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 [Server] Express & Socket.IO server active on http://0.0.0.0:${PORT}`);
});

function startSelfPinger() {
  setInterval(() => {
    if (CONFIG.RENDER_URL.includes('your-app-name')) return;
    console.log(`[Pinger] Firing self-ping...`);
    https.get(CONFIG.RENDER_URL, (res: IncomingMessage) => {
      console.log(`[Pinger] Response status: ${res.statusCode}`);
    }).on('error', (err: Error) => {
      console.error(`[Pinger] Ping failed:`, err.message);
    });
  }, 600000);
}

// Helper to check if the kill switch was triggered from the API
async function checkKillSwitchFromDB(): Promise<boolean> {
  try {
    const config = await mongoose.connection.collection('system_config').findOne({ key: 'ecosystem_state' });
    return config ? !!config.killSwitchActive : false;
  } catch (err) {
    return false;
  }
}

async function syncOpenExchangePosition(exchange: any, assetPool: string[]): Promise<ExtendedPositionState | null> {
  try {
    const positions = await exchange.fetchPositions();
    if (!positions || !Array.isArray(positions)) return null;

    const active = positions.find((p: any) => {
      const size = parseFloat(p.contracts || p.size || p.amount || 0);
      return size > 0 && assetPool.includes(p.symbol);
    });

    if (active) {
      const symbol = active.symbol;
      const entryPrice = parseFloat(active.entryPrice || active.price || 0);
      const units = parseFloat(active.contracts || active.size || active.amount || 0);

      if (entryPrice > 0 && units > 0) {
        console.log(`\n🔍 [EXCHANGE SYNC] Found active live trade: ${units} units of ${symbol} @ $${entryPrice}`);
        return {
          isHoldingPosition: true,
          activeAsset: symbol,
          entryPrice: entryPrice,
          takeProfitPrice: entryPrice * 1.0200,
          stopLossPrice: entryPrice * 0.9900,
          tradeAmountUnits: units,
          entryTime: Date.now(),
          hasTakenPartialProfit: false,
          highestPriceSinceEntry: entryPrice,
          tierTargetLocked: false,
          lockedProfitPct: 0
        };
      }
    }
  } catch (err: any) {
    console.warn(`[Sync Check Warning] Could not sync positions: ${err.message}`);
  }
  return null;
}

// ==========================================
// TRADING ENGINE CORE LOOP (Per User)
// ==========================================
async function runTradingEngine(
  userId: string,
  engineName: string,
  exchange: any,
  assetPool: string[],
  marginAllocationRatio: number
) {
  let currentAssetIndex = 0;
  let peakAvailableUSDT = 0;
  let isGlobalMarketBullish = false;

  let position: ExtendedPositionState = createInitialPositionState();

  console.log(`🚀 [User ${userId} - ${engineName}] Engine Initialized across pool: ${assetPool.join(', ')}`);

  while (true) {
    try {
      const isKillSwitchActive = await checkKillSwitchFromDB();
      if (isKillSwitchActive) {
        if (position.isHoldingPosition && !CONFIG.DRY_RUN) {
          try {
            const ticker = await exchange.fetchTicker(position.activeAsset);
            await executeSell(exchange, position.activeAsset, position.tradeAmountUnits, ticker.last, 'API_KILL_SWITCH');
            position = createInitialPositionState();
          } catch (e: any) {
            console.error(`❌ Kill switch liquidation error for user ${userId}: ${e.message}`);
          }
        }
        await new Promise(resolve => setTimeout(resolve, 5000));
        continue;
      }
    
      if (!position.isHoldingPosition && !CONFIG.DRY_RUN) {
        const syncedPosition = await syncOpenExchangePosition(exchange, assetPool);
        if (syncedPosition) {
          position = syncedPosition;
          if (engineName === 'ENGINE_1') {
            isGlobalMarketBullish = true;
          }
        }
      }

      const activeAsset = position.isHoldingPosition ? position.activeAsset : assetPool[currentAssetIndex];

      const ticker = await exchange.fetchTicker(activeAsset);
      const currentPrice = ticker.last as number;

      emitEngineState(`${userId}_${engineName}`, {
        currentAsset: activeAsset,
        currentPrice: currentPrice,
        pnlPercentage: position.isHoldingPosition ? calculateLivePnL(position, currentPrice) : 0,
        status: position.isHoldingPosition ? 'IN_POSITION' : (isGlobalMarketBullish || engineName === 'ENGINE_1' ? 'BUYING' : 'STANDBY')
      });

      if (position.isHoldingPosition) {
        if (engineName !== 'ENGINE_1' && !isGlobalMarketBullish) {
          const soldSuccessfully = await executeSell(
            exchange, 
            position.activeAsset, 
            position.tradeAmountUnits, 
            currentPrice, 
            'ENGINE_1_COLLAPSE_EMERGENCY_SELL'
          );

          if (soldSuccessfully) {
            position = createInitialPositionState();
            position.lastExitReason = 'ENGINE_1_COLLAPSE_EMERGENCY_SELL';
            continue;
          }
        }

        const wasHoldingBefore = position.isHoldingPosition;
        position = await processActivePosition(exchange, position, currentPrice, io, engineName);

        if (wasHoldingBefore && !position.isHoldingPosition) {
          const exitReason = position.lastExitReason || '';

          if (exitReason === 'HARD_STOP_LOSS_HIT' || exitReason === 'ENGINE_1_MINUS_1_PCT_CUT') {
            currentAssetIndex = (currentAssetIndex + 1) % assetPool.length;
          }

          if (engineName === 'ENGINE_1') {
            isGlobalMarketBullish = false;
          }
        }

      } else {
        if (engineName !== 'ENGINE_1' && !isGlobalMarketBullish) {
          await new Promise(resolve => setTimeout(resolve, CONFIG.POLL_INTERVAL_MS));
          continue;
        }

        let fetchedBalance = 0;
        try {
          const balance = await exchange.fetchBalance();
          fetchedBalance = parseFloat(balance.USDT?.free || 0);
        } catch (balErr: any) {
          console.warn(`⚠️ [User ${userId} - ${engineName}] Balance fetch failed: ${balErr.message}`);
        }

        const currentAvailableUSDT = fetchedBalance > 0 ? fetchedBalance : (CONFIG.DRY_RUN ? 20000 : 0);

        if (currentAvailableUSDT > peakAvailableUSDT) {
          peakAvailableUSDT = currentAvailableUSDT;
        }

        const effectiveCapitalBase = peakAvailableUSDT > 0 ? peakAvailableUSDT : currentAvailableUSDT;
        const dynamicMargin = effectiveCapitalBase * marginAllocationRatio;

        if (dynamicMargin < 1) {
          await new Promise(resolve => setTimeout(resolve, CONFIG.POLL_INTERVAL_MS));
          continue;
        }

        let rawTradeAmount = calculateDynamicAmount(
          exchange, 
          activeAsset, 
          currentPrice, 
          dynamicMargin, 
          CONFIG.LEVERAGE_LIMIT
        );

        if (rawTradeAmount <= 0) {
          await new Promise(resolve => setTimeout(resolve, CONFIG.POLL_INTERVAL_MS));
          continue;
        }

        let tradeAmount = parseFloat(exchange.amountToPrecision(activeAsset, rawTradeAmount));
        const entryPrice = currentPrice;
        let orderSuccessful = false;

        if (!CONFIG.DRY_RUN) {
          try {
            await exchange.createMarketBuyOrder(activeAsset, tradeAmount, { 'positionSide': 'LONG' });
            orderSuccessful = true;
          } catch (tradeError: any) {
            try {
              await exchange.createMarketBuyOrder(activeAsset, tradeAmount);
              orderSuccessful = true;
            } catch (fallbackError: any) {
              orderSuccessful = false;
            }
          }
        } else {
          orderSuccessful = true;
        }

        if (orderSuccessful) {
          position = {
            isHoldingPosition: true,
            activeAsset,
            entryPrice,
            takeProfitPrice: entryPrice * 1.0200,
            stopLossPrice: entryPrice * 0.9900,
            tradeAmountUnits: tradeAmount,
            entryTime: Date.now(),
            hasTakenPartialProfit: false,
            highestPriceSinceEntry: entryPrice,
            tierTargetLocked: false,
            lockedProfitPct: 0
          };

          if (engineName === 'ENGINE_1') {
            isGlobalMarketBullish = true;
          }
        }
      }
    } catch (networkError: any) {
      console.warn(`[User ${userId} - ${engineName} Network Warning] ${networkError.message}`);
    }

    await new Promise(resolve => setTimeout(resolve, CONFIG.POLL_INTERVAL_MS));
  }
}

// ==========================================
// MASTER MULTI-USER WORKER LAUNCHER
// ==========================================
const activeUserWorkers = new Set<string>();

async function startMultiUserTradingSystem() {
  console.log("╔════════════════════════════════════════════════════════╗");
  console.log("║         WEEX MULTI-USER AI ENGINE WORKER ACTIVE        ║");
  console.log("╚════════════════════════════════════════════════════════╝");

  startSelfPinger();
  
  // Keep track of active worker threads globally so we can kill them if turned off
  const activeUserWorkers = new Map<string, AbortController>();

  // Inside your continuous discovery `while (true)` loop:
  while (true) {
    try {
      // 1. Fetch ALL users who have keys saved
      const registeredUsers = await User.find({ 
        weexApiKey: { $ne: null }, 
        weexSecretKey: { $ne: null } 
      });

      const activeUserIds = new Set<string>();

      for (const user of registeredUsers) {
        const userIdStr = user._id.toString();

        // Check if user wants the bot active AND has keys
        if (user.isBotActive) {
          activeUserIds.add(userIdStr);

          // If their worker isn't running yet, spin it up!
          if (!activeUserWorkers.has(userIdStr)) {
            const abortController = new AbortController();
            activeUserWorkers.set(userIdStr, abortController);

            // Spin up asynchronously
            (async () => {
              try {
                console.log(`🔑 [Multi-User Engine] Starting bot for user: ${userIdStr}`);
                
                const decryptedSecret = decrypt(user.weexSecretKey);
                const decryptedPassphrase = user.weexPassphrase ? decrypt(user.weexPassphrase) : undefined;

                const userExchange = new ccxt.weex({
                  apiKey: user.weexApiKey,
                  secret: decryptedSecret,
                  password: decryptedPassphrase,
                  timeout: 10000,
                  enableRateLimit: true,
                  options: { defaultType: 'swap' }
                });

                await userExchange.loadMarkets();

                const allAssets = Array.from(
                  new Set([
                    ...CONFIG.ENGINE_ONE,
                    ...CONFIG.ENGINE_TWO,
                    ...CONFIG.ENGINE_THREE,
                    ...CONFIG.ENGINE_FOUR,
                    ...CONFIG.ENGINE_FIVE
                  ])
                );

                for (const asset of allAssets) {
                  try {
                    await userExchange.setLeverage(CONFIG.LEVERAGE_LIMIT, asset);
                  } catch (err: any) {
                    // Skip if leverage setup fails for a specific asset
                  }
                }

                // Run engines concurrently for this user
                await Promise.all([
                  runTradingEngine(userIdStr, "ENGINE_1", userExchange, CONFIG.ENGINE_ONE, 0.20),
                  runTradingEngine(userIdStr, "ENGINE_2", userExchange, CONFIG.ENGINE_TWO, 0.10),
                  runTradingEngine(userIdStr, "ENGINE_3", userExchange, CONFIG.ENGINE_THREE, 0.10),
                  runTradingEngine(userIdStr, "ENGINE_4", userExchange, CONFIG.ENGINE_FOUR, 0.10),
                  runTradingEngine(userIdStr, "ENGINE_5", userExchange, CONFIG.ENGINE_FIVE, 0.10)
                ]);

              } catch (userEngineErr: any) {
                console.error(`❌ Engine failure for user ${userIdStr}:`, userEngineErr.message);
                activeUserWorkers.delete(userIdStr);
              }
            })();
          }
        }
      }

      // 2. Shut down workers for users who turned their bot OFF
      for (const [userIdStr, controller] of activeUserWorkers.entries()) {
        if (!activeUserIds.has(userIdStr)) {
          console.log(`🛑 [Multi-User Engine] User ${userIdStr} turned off their bot. Stopping worker...`);
          activeUserWorkers.delete(userIdStr);
        }
      }

    } catch (pollErr: any) {
      console.error(`❌ User discovery loop error:`, pollErr.message);
    }

    // Check every 1 minute for toggle updates
    await new Promise(resolve => setTimeout(resolve, 60 * 1000));
  }
} // <-- Closing bracket for startMultiUserTradingSystem function

// Start the multi-user ecosystem daemon
startMultiUserTradingSystem();
