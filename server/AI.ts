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

// Diagnostics
console.log("===[ ENV DIAGNOSTICS ]===");
console.log("API Key loaded:", process.env.WEEX_API_KEY ? "YES (Length: " + process.env.WEEX_API_KEY.length + ")" : "NO/UNDEFINED");
console.log("Secret loaded:", process.env.WEEX_SECRET_KEY ? "YES" : "NO/UNDEFINED");
console.log("Passphrase loaded:", process.env.WEEX_PASSPHRASE ? "YES" : "NO/UNDEFINED");
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
// GLOBAL ECOSYSTEM STATE TRACKER
// ==========================================
let isGlobalMarketBullish = false;

async function runTradingEngine(
  engineName: string,
  exchange: any,
  assetPool: string[],
  marginAllocationRatio: number
) {
  let currentAssetIndex = 0;
  let peakAvailableUSDT = 0;

  let position: ExtendedPositionState = createInitialPositionState();

  console.log(`🚀 [${engineName}] Engine Initialized across pool: ${assetPool.join(', ')}`);
  emitSystemLog(engineName, 'INFO', `Engine initialized across pool: ${assetPool.join(', ')}`);

  while (true) {
    try {
      // -------------------------------------------------------------
      // STEP 1: RE-SYNC EXCHANGE POSITIONS ON STARTUP
      // -------------------------------------------------------------
      if (!position.isHoldingPosition && !CONFIG.DRY_RUN) {
        const syncedPosition = await syncOpenExchangePosition(exchange, assetPool);
        if (syncedPosition) {
          position = syncedPosition;
          
          if (engineName === 'ENGINE_1') {
            isGlobalMarketBullish = true;
            console.log(`⚡ [GLOBAL TRIGGER] ENGINE_1 active trade synced on startup. Ecosystem UNLOCKED!`);
          }
        }
      }

      const activeAsset = position.isHoldingPosition ? position.activeAsset : assetPool[currentAssetIndex];

      // -------------------------------------------------------------
      // STEP 2: TICKER FETCH & LIVE BROADCAST
      // -------------------------------------------------------------
      const ticker = await exchange.fetchTicker(activeAsset);
      const currentPrice = ticker.last as number;

      emitEngineState(engineName, {
        currentAsset: activeAsset,
        currentPrice: currentPrice,
        pnlPercentage: position.isHoldingPosition ? calculateLivePnL(position, currentPrice) : 0,
        status: position.isHoldingPosition ? 'IN_POSITION' : (isGlobalMarketBullish || engineName === 'ENGINE_1' ? 'BUYING' : 'STANDBY')
      });

      // -------------------------------------------------------------
      // MODE A: MONITORING ACTIVE POSITION (Managing Exits & Rotation)
      // -------------------------------------------------------------
      if (position.isHoldingPosition) {
        // EMERGENCY ECOSYSTEM SELL: If Engine 1 exited/dropped, secondary engines MUST SELL IMMEDIATELY
        if (engineName !== 'ENGINE_1' && !isGlobalMarketBullish) {
          console.log(`🚨 [ECOSYSTEM DUMP EMERGENCY] Engine 1 collapsed! ${engineName} selling ${position.activeAsset} immediately!`);
          emitSystemLog(engineName, 'STOP_LOSS', `Emergency sell triggered on ${position.activeAsset} due to Engine 1 collapse.`);

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

        // Process active trade
        position = await processActivePosition(exchange, position, currentPrice, io, engineName);

        // Handle Exit State & Selective Rotation
        if (wasHoldingBefore && !position.isHoldingPosition) {
          const exitReason = position.lastExitReason || '';

          // ROTATE ONLY ON INTERNAL HARD STOP LOSS (-1.00%)
          if (exitReason === 'HARD_STOP_LOSS_HIT' || exitReason === 'ENGINE_1_MINUS_1_PCT_CUT') {
            const previousAsset = assetPool[currentAssetIndex];
            currentAssetIndex = (currentAssetIndex + 1) % assetPool.length;
            const nextAsset = assetPool[currentAssetIndex];

            console.log(`🔄 [${engineName} ROTATION] Hard Stop Loss hit on ${previousAsset}. Rotating to next asset: ${nextAsset}`);
            emitSystemLog(engineName, 'INFO', `Hard stop hit. Rotated asset from ${previousAsset} to ${nextAsset}`);
          } else {
            console.log(`📌 [${engineName} NO ROTATION] Trade closed via (${exitReason}). Remaining on current asset: ${assetPool[currentAssetIndex]}`);
          }

          // IF ENGINE_1 CLOSED (STOP LOSS OR TAKE PROFIT), LOCK GLOBAL ECOSYSTEM
          if (engineName === 'ENGINE_1') {
            isGlobalMarketBullish = false;
            console.log(`🛑 [GLOBAL TRIGGER] ENGINE_1 exited position. Locking ecosystem & signaling secondary engines to liquidate!`);
            emitSystemLog('GLOBAL', 'INFO', 'BTC trade closed. Secondary engines instructed to sell immediately.');
          }
        }

      } else {
        // -------------------------------------------------------------
        // MODE B: IMMEDIATE MARKET BUY
        // -------------------------------------------------------------

        // Gatekeeper check: Secondary engines wait for ENGINE_1
        if (engineName !== 'ENGINE_1' && !isGlobalMarketBullish) {
          await new Promise(resolve => setTimeout(resolve, CONFIG.POLL_INTERVAL_MS));
          continue;
        }

        console.log(`⚡ [${engineName}] Triggering IMMEDIATE MARKET BUY for ${activeAsset}...`);

        let fetchedBalance = 0;
        try {
          const balance = await exchange.fetchBalance();
          fetchedBalance = parseFloat(balance.USDT?.free || 0);
        } catch (balErr: any) {
          console.warn(`⚠️ [${engineName}] Balance fetch failed: ${balErr.message}`);
        }

        const currentAvailableUSDT = fetchedBalance > 0 ? fetchedBalance : (CONFIG.DRY_RUN ? 20000 : 0);

        if (currentAvailableUSDT > peakAvailableUSDT) {
          peakAvailableUSDT = currentAvailableUSDT;
        }

        const effectiveCapitalBase = peakAvailableUSDT > 0 ? peakAvailableUSDT : currentAvailableUSDT;
        const dynamicMargin = effectiveCapitalBase * marginAllocationRatio;

        if (dynamicMargin < 1) {
          console.log(`⚠️ [${engineName}] Insufficient margin ($${dynamicMargin.toFixed(2)}). Waiting...`);
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
          console.warn(`⚠️️ [${engineName}] Calculated trade amount <= 0 for ${activeAsset}. Waiting...`);
          await new Promise(resolve => setTimeout(resolve, CONFIG.POLL_INTERVAL_MS));
          continue;
        }

        let tradeAmount = parseFloat(exchange.amountToPrecision(activeAsset, rawTradeAmount));
        const entryPrice = currentPrice;

        let orderSuccessful = false;

        if (!CONFIG.DRY_RUN) {
          try {
            console.log(`📡 [${engineName}] Market Order Fired: Buying ${tradeAmount} units of ${activeAsset} @ ~$${entryPrice}`);
            await exchange.createMarketBuyOrder(activeAsset, tradeAmount, { 'positionSide': 'LONG' });
            orderSuccessful = true;
          } catch (tradeError: any) {
            console.error(`❌ [${engineName} ORDER REJECTED] Primary buy failed: ${tradeError.message}`);
            
            try {
              console.log(`🔄 [${engineName}] Retrying order without positionSide parameter...`);
              await exchange.createMarketBuyOrder(activeAsset, tradeAmount);
              orderSuccessful = true;
            } catch (fallbackError: any) {
              console.error(`❌ [${engineName} FALLBACK REJECTED] ${fallbackError.message}`);
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
            console.log(`🚀 [GLOBAL TRIGGER] ENGINE_1 bought BTC! Instantly launching ENGINES 2-5!`);
            emitSystemLog('GLOBAL', 'INFO', 'BTC trade opened! Secondary engines unlocked for immediate execution.');
          }

          emitSystemLog(engineName, 'BUY', `Bought ${tradeAmount} ${activeAsset} at $${entryPrice}`);
        } else {
          console.warn(`⚠️ [${engineName}] Order execution failed. State untouched. Retrying on next loop tick...`);
        }
      }
    } catch (networkError: any) {
      console.warn(`[${engineName} Network Warning] ${networkError.message}`);
    }

    await new Promise(resolve => setTimeout(resolve, CONFIG.POLL_INTERVAL_MS));
  }
}

// Master Launcher
async function startTradingEngine() {
  const exchange = new ccxt.weex({
    'apiKey': process.env.WEEX_API_KEY,
    'secret': process.env.WEEX_SECRET_KEY,
    'password': process.env.WEEX_PASSPHRASE,
    'timeout': 10000,
    'enableRateLimit': true,
    'options': { 'defaultType': 'swap' }
  });

  try {
    console.log("╔════════════════════════════════════════════════════════╗");
    console.log("║              WEEX DUAL AI ENGINE ACTIVATED             ║");
    console.log("╚════════════════════════════════════════════════════════╝");

    await exchange.loadMarkets();

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
        await exchange.setLeverage(CONFIG.LEVERAGE_LIMIT, asset);
        console.log(`✔️ Leverage set to ${CONFIG.LEVERAGE_LIMIT}x for ${asset}`);
      } catch (err: any) {
        console.warn(`⚠️ [API Skip] Could not set leverage for ${asset}: ${err.message}`);
      }
    }

    startSelfPinger();

    // Launch engines concurrently
    await Promise.all([
      runTradingEngine("ENGINE_1", exchange, CONFIG.ENGINE_ONE, 0.20),
      runTradingEngine("ENGINE_2", exchange, CONFIG.ENGINE_TWO, 0.10),
      runTradingEngine("ENGINE_3", exchange, CONFIG.ENGINE_THREE, 0.10),
      runTradingEngine("ENGINE_4", exchange, CONFIG.ENGINE_FOUR, 0.10),
      runTradingEngine("ENGINE_5", exchange, CONFIG.ENGINE_FIVE, 0.10)
    ]);

  } catch (criticalError: any) {
    console.error("❌ CRITICAL: Engine initialization failed:", criticalError.message);
    process.exit(1);
  }
}

startTradingEngine();
