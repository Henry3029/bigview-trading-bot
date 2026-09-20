"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emitSystemLog = emitSystemLog;
exports.emitEngineState = emitEngineState;
require("dotenv/config");
const https_1 = __importDefault(require("https"));
const express_1 = __importDefault(require("express"));
const alexa_1 = require("./src/alexa");
const engineStore_1 = require("./src/store/engineStore");
const ccxt_1 = __importDefault(require("ccxt"));
const mongoose_1 = __importDefault(require("mongoose"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const cors_1 = require("./src/config/cors");
const config_1 = require("./src/config");
const strategy_1 = require("./src/strategy");
const tradeManager_1 = require("./src/tradeManager");
const logger_1 = require("./src/utils/logger");
// Diagnostics
console.log("===[ ENV DIAGNOSTICS ]===");
console.log("API Key loaded:", process.env.WEEX_API_KEY ? "YES (Length: " + process.env.WEEX_API_KEY.length + ")" : "NO/UNDEFINED");
console.log("Secret loaded:", process.env.WEEX_SECRET_KEY ? "YES" : "NO/UNDEFINED");
console.log("Passphrase loaded:", process.env.WEEX_PASSPHRASE ? "YES" : "NO/UNDEFINED");
console.log("=========================");
// Initialize MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/weex_bot';
mongoose_1.default.connect(MONGODB_URI)
    .then(() => console.log('🍃 [Database] MongoDB connected successfully'))
    .catch((err) => console.error('❌ [Database] Connection error:', err.message));
// 3. Initialize Express App
const app = (0, express_1.default)();
app.use(express_1.default.json()); // Essential middleware for handling JSON payloads
// 4. Mount the Alexa Webhook Endpoint
app.post('/api/alexa', alexa_1.alexaAdapter.getRequestHandlers());
const PORT = Number(process.env.PORT) || 3001;
const httpServer = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: (origin, callback) => {
            if ((0, cors_1.isOriginAllowed)(origin)) {
                callback(null, true);
            }
            else {
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
function emitSystemLog(engine, type, message) {
    const logEntry = {
        id: Date.now().toString(),
        engine,
        type,
        message,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    engineStore_1.systemLogsStore.unshift(logEntry);
    if (engineStore_1.systemLogsStore.length > 50)
        engineStore_1.systemLogsStore.pop();
    io.emit('engine_log', logEntry);
}
function emitEngineState(engineId, payload) {
    engineStore_1.engineStatesStore[engineId] = {
        ...engineStore_1.engineStatesStore[engineId],
        ...payload
    };
    io.emit('engine_state_update', {
        engineId,
        ...payload
    });
}
function calculateLivePnL(position, currentPrice) {
    if (!position.isHoldingPosition || !position.entryPrice)
        return 0;
    const pnl = ((currentPrice - position.entryPrice) / position.entryPrice) * 100;
    return parseFloat(pnl.toFixed(2));
}
// ==========================================
// 4. START THE HTTP SERVER (NOT app.listen!)
// ==========================================
httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 [Server] Express & Socket.IO server active on http://0.0.0.0:${PORT}`);
});
// Self-Pinger
function startSelfPinger() {
    setInterval(() => {
        if (config_1.CONFIG.RENDER_URL.includes('your-app-name'))
            return;
        console.log(`[Pinger] Firing self-ping...`);
        https_1.default.get(config_1.CONFIG.RENDER_URL, (res) => {
            console.log(`[Pinger] Response status: ${res.statusCode}`);
        }).on('error', (err) => {
            console.error(`[Pinger] Ping failed:`, err.message);
        });
    }, 600000);
}
/**
 * HELPER: Exchange Position Syncing filtered specifically to an Engine's Asset Pool
 */
async function syncOpenExchangePosition(exchange, assetPool) {
    try {
        const positions = await exchange.fetchPositions();
        if (!positions || !Array.isArray(positions))
            return null;
        const active = positions.find((p) => {
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
                    takeProfitPrice: entryPrice * 1.0200, // Re-establish TP (+2.00%)
                    stopLossPrice: entryPrice * 0.9900, // Re-establish SL (-1.00%)
                    tradeAmountUnits: units,
                    entryTime: Date.now()
                };
            }
        }
    }
    catch (err) {
        console.warn(`[Sync Check Warning] Could not sync positions: ${err.message}`);
    }
    return null;
}
/**
 * CORE REUSABLE TRADING ENGINE
 */
async function runTradingEngine(engineName, exchange, assetPool, marginAllocationRatio) {
    let currentAssetIndex = 0;
    let closePrices = [];
    let assetStartTime = Date.now();
    const THREE_HOURS_MS = 24 * 60 * 60 * 1000;
    // High-Water Mark tracker to prevent position shrinkage during drawdowns
    let peakAvailableUSDT = 0;
    let position = (0, tradeManager_1.createInitialPositionState)();
    console.log(`🚀 [${engineName}] Engine Initialized. Assets: ${assetPool.join(', ')}`);
    emitSystemLog(engineName, 'INFO', `Engine initialized across pool: ${assetPool.join(', ')}`);
    while (true) {
        try {
            // --- STEP 1: RE-SYNC EXCHANGE POSITIONS IF LOCAL STATE IS EMPTY ---
            if (!position.isHoldingPosition && !config_1.CONFIG.DRY_RUN) {
                const syncedPosition = await syncOpenExchangePosition(exchange, assetPool);
                if (syncedPosition) {
                    position = syncedPosition;
                    const matchingIndex = assetPool.findIndex(a => a === position.activeAsset);
                    if (matchingIndex !== -1) {
                        currentAssetIndex = matchingIndex;
                    }
                    emitSystemLog(engineName, 'INFO', `Synced active trade on ${position.activeAsset} @ $${position.entryPrice}`);
                }
            }
            const activeAsset = position.isHoldingPosition ? position.activeAsset : assetPool[currentAssetIndex];
            const elapsed = Date.now() - assetStartTime;
            // --- STEP 2: PIVOT CONTROL ---
            if (elapsed >= THREE_HOURS_MS && !position.isHoldingPosition) {
                console.log(`\n🔄 [${engineName} Pivot] Window elapsed! Switching asset focus...`);
                currentAssetIndex = (currentAssetIndex + 1) % assetPool.length;
                closePrices = [];
                assetStartTime = Date.now();
                emitSystemLog(engineName, 'INFO', `Rotated focus to ${assetPool[currentAssetIndex]}`);
                continue;
            }
            else if (elapsed >= THREE_HOURS_MS && position.isHoldingPosition) {
                console.log(`⚠️ [${engineName} Pivot Postponed] Holding active trade on ${activeAsset}.`);
            }
            // --- STEP 3: TICKER FETCH ---
            const ticker = await exchange.fetchTicker(activeAsset);
            const currentPrice = ticker.last;
            closePrices.push(currentPrice);
            if (closePrices.length > 50)
                closePrices.shift();
            // Emit live price & engine state to React clients every tick
            emitEngineState(engineName, {
                currentAsset: activeAsset,
                currentPrice: currentPrice,
                pnlPercentage: position.isHoldingPosition ? calculateLivePnL(position, currentPrice) : 0,
                status: position.isHoldingPosition ? 'IN_POSITION' : 'HUNTING'
            });
            // --- MODE A: MONITORING ACTIVE POSITION ---
            if (position.isHoldingPosition) {
                const wasHoldingBefore = position.isHoldingPosition;
                position = await (0, tradeManager_1.processActivePosition)(exchange, position, currentPrice, io);
                const isHardStop = position.lastExitReason === "HARD_STOP_LOSS_HIT";
                const isStagnant = position.lastExitReason === "3H_STAGNANT_TIMEOUT" || position.lastExitReason === "24H_STAGNANT_TIMEOUT";
                if (wasHoldingBefore && !position.isHoldingPosition && (isHardStop || isStagnant)) {
                    const reasonText = isHardStop ? "crashed into Hard Stop Loss (-1.00%)" : "stagnated for 24 hours";
                    console.log(`\n🛑 [${engineName} IMMEDIATE PIVOT] Asset ${activeAsset} ${reasonText}. Abandoning & pivoting!`);
                    // Emit Stop Loss event to React clients
                    emitSystemLog(engineName, 'STOP_LOSS', `Trade exited on ${activeAsset} (${reasonText}). Switched focus.`);
                    currentAssetIndex = (currentAssetIndex + 1) % assetPool.length;
                    closePrices = [];
                    assetStartTime = Date.now();
                    continue;
                }
            }
            // --- MODE B: HUNTING FOR STRATEGY CROSSOVER ---
            else {
                const minsRemaining = Math.max(0, ((THREE_HOURS_MS - elapsed) / 60000)).toFixed(1);
                console.log(`[${engineName} Hunting: ${activeAsset}] Price: ${currentPrice} | Window: ${closePrices.length}/50 | Next shift: ${minsRemaining} mins`);
                const signal = (0, strategy_1.evaluateStrategy)(closePrices, activeAsset);
                if (signal.isSignal) {
                    const entryPrice = currentPrice;
                    let fetchedBalance = 0;
                    try {
                        const balanceStructure = await exchange.fetchBalance({ 'type': 'swap' });
                        fetchedBalance = balanceStructure.free?.['USDT'] || balanceStructure.total?.['USDT'] || 0;
                    }
                    catch (balErr) {
                        console.warn(`⚠️ [${engineName}] Could not fetch balance: ${balErr.message}`);
                    }
                    const currentAvailableUSDT = fetchedBalance > 0 ? fetchedBalance : (config_1.CONFIG.DRY_RUN ? 20000 : 0);
                    // --- HIGH-WATER MARK CAPITAL SIZING ---
                    if (currentAvailableUSDT > peakAvailableUSDT) {
                        peakAvailableUSDT = currentAvailableUSDT;
                    }
                    const effectiveCapitalBase = peakAvailableUSDT > 0 ? peakAvailableUSDT : currentAvailableUSDT;
                    const dynamicMargin = effectiveCapitalBase * marginAllocationRatio;
                    if (dynamicMargin < 1) {
                        console.log(`⚠️ [${engineName}] Dynamic margin ($${dynamicMargin.toFixed(2)}) below safety limit ($1.00). Skipping.`);
                        await new Promise(resolve => setTimeout(resolve, config_1.CONFIG.POLL_INTERVAL_MS));
                        continue;
                    }
                    // Calculate raw trade amount based on dynamic margin
                    let rawTradeAmount = (0, strategy_1.calculateDynamicAmount)(exchange, activeAsset, currentPrice, dynamicMargin, config_1.CONFIG.LEVERAGE_LIMIT);
                    if (rawTradeAmount === 0)
                        continue;
                    // 1. Ensure markets are loaded
                    if (!exchange.markets || Object.keys(exchange.markets).length === 0) {
                        await exchange.loadMarkets();
                    }
                    const market = exchange.market(activeAsset);
                    // 2. Asset rules fallback check
                    const rules = config_1.CONFIG.ASSET_RULES || {};
                    const ruleKey = Object.keys(rules).find(key => activeAsset.includes(key)) || 'DEFAULT';
                    const assetRule = rules[ruleKey] || { minLot: 0.001, integerOnly: false };
                    // 3. Format amount using CCXT amountToPrecision
                    let tradeAmount = parseFloat(exchange.amountToPrecision(activeAsset, rawTradeAmount));
                    if (assetRule.integerOnly) {
                        tradeAmount = Math.floor(tradeAmount);
                    }
                    // 4. Validate against minimum thresholds
                    const ccxtMin = market?.limits?.amount?.min || 0;
                    const effectiveMinAmount = ccxtMin > 0 ? ccxtMin : assetRule.minLot;
                    if (tradeAmount < effectiveMinAmount) {
                        console.log(`⚠️ [${engineName}] Skipping ${activeAsset}: Formatted size (${tradeAmount}) below required minimum (${effectiveMinAmount}).`);
                        await new Promise(resolve => setTimeout(resolve, config_1.CONFIG.POLL_INTERVAL_MS));
                        continue;
                    }
                    let liveOrderId = "SIMULATED_ID";
                    if (!config_1.CONFIG.DRY_RUN) {
                        try {
                            console.log(`📡 [${engineName}] Executing BUY on ${activeAsset}: ${tradeAmount} units @ ~$${entryPrice}`);
                            const order = await exchange.createMarketBuyOrder(activeAsset, tradeAmount, {
                                'positionSide': 'LONG'
                            });
                            liveOrderId = order.id;
                        }
                        catch (tradeError) {
                            console.error(`❌ [${engineName} REJECTION] Order failed:`, tradeError.message);
                            continue;
                        }
                    }
                    position = {
                        isHoldingPosition: true,
                        activeAsset,
                        entryPrice,
                        takeProfitPrice: entryPrice * 1.0200,
                        stopLossPrice: entryPrice * 0.9900,
                        tradeAmountUnits: tradeAmount,
                        entryTime: Date.now()
                    };
                    // Emit Buy Order event to React clients
                    emitSystemLog(engineName, 'BUY', `EMA Crossover buy order executed for ${activeAsset} at $${entryPrice}`);
                    (0, logger_1.logAIDecision)('EMA_CROSSOVER_BUY', signal.reason, {
                        mode: config_1.CONFIG.DRY_RUN ? "DRY_RUN" : "LIVE",
                        asset: activeAsset,
                        action: 'BUY',
                        executionPrice: entryPrice,
                        indicators: {
                            fastEma: String(signal.fastEma ?? '0'),
                            slowEma: String(signal.slowEma ?? '0'),
                            rsi: String(signal.rsi ?? '0')
                        },
                        status: 'EXECUTED'
                    });
                }
            }
        }
        catch (networkError) {
            console.warn(`[${engineName} Network Warning] ${networkError.message}`);
        }
        await new Promise(resolve => setTimeout(resolve, config_1.CONFIG.POLL_INTERVAL_MS));
    }
}
// Master Launcher
async function startTradingEngine() {
    const exchange = new ccxt_1.default.weex({
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
        const allAssets = Array.from(new Set([...config_1.CONFIG.MAJOR_ASSETS, ...config_1.CONFIG.ALT_ASSETS]));
        for (const asset of allAssets) {
            try {
                await exchange.setLeverage(config_1.CONFIG.LEVERAGE_LIMIT, asset);
                console.log(`✔️ Leverage set to ${config_1.CONFIG.LEVERAGE_LIMIT}x for ${asset}`);
            }
            catch (err) {
                console.warn(`⚠️ [API Skip] Could not set leverage for ${asset}: ${err.message}`);
            }
        }
        //  startSelfPinger();
        // Launch engines concurrently
        await Promise.all([
            runTradingEngine("ENGINE_1", exchange, config_1.CONFIG.MAJOR_ASSETS, 0.30),
            runTradingEngine("ENGINE_2", exchange, config_1.CONFIG.ALT_ASSETS, 0.30)
        ]);
    }
    catch (criticalError) {
        console.error("❌ CRITICAL: Engine initialization failed:", criticalError.message);
        process.exit(1);
    }
}
startTradingEngine();
