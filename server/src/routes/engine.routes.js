"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const EngineAllocation_1 = __importDefault(require("@/models/EngineAllocation"));
const engineStore_1 = require("@/store/engineStore");
const mongodb_1 = require("@/lib/mongodb");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("@/models/User"));
const mongoose_1 = __importDefault(require("mongoose"));
const router = express_1.default.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your_fallback_jwt_secret';
// GET ACTIVE ENGINE STATES & ALLOCATIONS
router.get('/status', async (req, res) => {
    try {
        await (0, mongodb_1.connectToDatabase)();
        // 1. Extract optional userId
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        let userId = null;
        if (token) {
            try {
                const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
                userId = decoded.userId;
            }
            catch (e) { }
        }
        // 2. Fetch allocations for logged-in user
        let userAllocations = {};
        if (userId) {
            const allocations = await EngineAllocation_1.default.find({ userId, status: 'ACTIVE' });
            allocations.forEach((alloc) => {
                userAllocations[alloc.engineName] = alloc.allocatedUsdt;
            });
        }
        // 3. Get latest logs from memory store
        const formattedLogs = engineStore_1.systemLogsStore.slice(0, 20);
        // 4. Build live engine array reading from memory store
        const engines = [
            {
                id: 'MAJOR_ENGINE',
                name: 'Major Assets Engine',
                focusAssets: ['BTC/USDT', 'ETH/USDT', 'BNB/USDT'],
                currentAsset: engineStore_1.engineStatesStore['MAJOR_ENGINE']?.currentAsset || 'BTC/USDT',
                status: engineStore_1.engineStatesStore['MAJOR_ENGINE']?.status || 'HUNTING',
                pnlPercentage: engineStore_1.engineStatesStore['MAJOR_ENGINE']?.pnlPercentage || 0.00,
                currentPrice: engineStore_1.engineStatesStore['MAJOR_ENGINE']?.currentPrice || 0.00,
                allocatedCapital: userAllocations['MAJOR_ENGINE'] || 0
            },
            {
                id: 'ALT_ENGINE',
                name: 'Altcoin Engine',
                focusAssets: ['DOGE/USDT', 'XRP/USDT', 'AVAX/USDT', 'ZEC/USDT'],
                currentAsset: engineStore_1.engineStatesStore['ALT_ENGINE']?.currentAsset || 'DOGE/USDT',
                status: engineStore_1.engineStatesStore['ALT_ENGINE']?.status || 'HUNTING',
                pnlPercentage: engineStore_1.engineStatesStore['ALT_ENGINE']?.pnlPercentage || 0.00,
                currentPrice: engineStore_1.engineStatesStore['ALT_ENGINE']?.currentPrice || 0.00,
                allocatedCapital: userAllocations['ALT_ENGINE'] || 0
            },
            {
                id: 'MEME_ENGINE',
                name: 'Meme/High-Vol Engine',
                focusAssets: ['BTW/USDT'],
                currentAsset: engineStore_1.engineStatesStore['MEME_ENGINE']?.currentAsset || 'BTW/USDT',
                status: engineStore_1.engineStatesStore['MEME_ENGINE']?.status || 'HUNTING',
                pnlPercentage: engineStore_1.engineStatesStore['MEME_ENGINE']?.pnlPercentage || 0.00,
                currentPrice: engineStore_1.engineStatesStore['MEME_ENGINE']?.currentPrice || 0.00,
                allocatedCapital: userAllocations['MEME_ENGINE'] || 0
            }
        ];
        res.json({ engines, logs: formattedLogs });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// -------------------------------------------------------------
// 4. ALLOCATE CAPITAL TO ENGINE (Atomic Mongoose Transaction)
// -------------------------------------------------------------
router.post('/allocate', async (req, res) => {
    await (0, mongodb_1.connectToDatabase)();
    if (!req.body.amountUsdt || req.body.amountUsdt <= 0) {
        return res.status(400).json({ error: 'Invalid allocation amount' });
    }
    const session = await mongoose_1.default.startSession();
    try {
        let result;
        await session.withTransaction(async () => {
            const { userId, engineName, amountUsdt } = req.body;
            // Deduct balance atomically if balance >= amountUsdt
            const updatedUser = await User_1.default.findOneAndUpdate({ _id: userId, freeUsdtBalance: { $gte: amountUsdt } }, { $inc: { freeUsdtBalance: -amountUsdt } }, { new: true, session });
            if (!updatedUser) {
                throw new Error('Insufficient free USDT balance or user not found');
            }
            // Upsert allocation for the engine
            const allocation = await EngineAllocation_1.default.findOneAndUpdate({ userId, engineName }, { $inc: { allocatedUsdt: amountUsdt }, status: 'ACTIVE' }, { upsert: true, new: true, session });
            result = {
                freeBalance: updatedUser.freeUsdtBalance,
                allocation,
            };
        });
        res.json({ success: true, ...(result || {}) });
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
    finally {
        await session.endSession();
    }
});
exports.default = router; // export it
