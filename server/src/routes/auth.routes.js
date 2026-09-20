"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const ethers_1 = require("ethers");
const crypto = __importStar(require("crypto"));
const ccxt_1 = __importDefault(require("ccxt"));
const mongodb_1 = require("@/lib/mongodb");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("@/models/User"));
const router = express_1.default.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your_fallback_jwt_secret';
// USER VERIFICATION SIGNATURE
router.post('/verify', async (req, res) => {
    try {
        await (0, mongodb_1.connectToDatabase)();
        const { walletAddress, signature } = req.body;
        if (!walletAddress || !signature) {
            return res.status(400).json({ error: 'Wallet address and signature required' });
        }
        const normalizedAddress = walletAddress.toLowerCase();
        const user = await User_1.default.findOne({ walletAddress: normalizedAddress });
        if (!user) {
            return res.status(404).json({ error: 'User not found. Request a nonce first.' });
        }
        // Verify Signature
        const expectedMessage = `Sign this message to authenticate with WEEX Bot: ${user.nonce}`;
        const recoveredAddress = ethers_1.ethers.verifyMessage(expectedMessage, signature);
        if (recoveredAddress.toLowerCase() !== normalizedAddress) {
            return res.status(401).json({ error: 'Invalid signature verification failed' });
        }
        // Invalidate Nonce after successful login (prevents replay attacks)
        user.nonce = crypto.randomBytes(16).toString('hex');
        await user.save();
        // Issue standard JWT token
        const token = jsonwebtoken_1.default.sign({ userId: user._id, walletAddress: user.walletAddress }, JWT_SECRET, { expiresIn: '7d' });
        res.json({
            token,
            user: {
                id: user._id,
                walletAddress: user.walletAddress,
                freeUsdtBalance: user.freeUsdtBalance,
            },
        });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// -------------------------------------------------------------
// 2. USER REGISTER
// -------------------------------------------------------------
router.post('/register', async (req, res) => {
    try {
        await (0, mongodb_1.connectToDatabase)();
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password required' });
        }
        const existingUser = await User_1.default.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }
        const passwordHash = await bcrypt_1.default.hash(password, 10);
        const user = await User_1.default.create({
            email,
            passwordHash,
        });
        const token = jsonwebtoken_1.default.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });
        res.json({
            token,
            user: {
                id: user._id,
                email: user.email,
                freeUsdtBalance: user.freeUsdtBalance,
            },
        });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// -------------------------------------------------------------
// 3. USER LOGIN
// -------------------------------------------------------------
router.post('/login', async (req, res) => {
    try {
        await (0, mongodb_1.connectToDatabase)();
        const { email, password } = req.body;
        const user = await User_1.default.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }
        const validPassword = await bcrypt_1.default.compare(password, user.passwordHash);
        if (!validPassword) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }
        const token = jsonwebtoken_1.default.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });
        res.json({
            token,
            user: {
                id: user._id,
                email: user.email,
                freeUsdtBalance: user.freeUsdtBalance,
            },
        });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// 2. Define the EXACT endpoint your frontend fetch call hits
router.post('/weex-keys', async (req, res) => {
    const { apiKey, apiSecret, passphrase } = req.body;
    // Basic validation
    if (!apiKey || !apiSecret) {
        return res.status(400).json({
            error: 'API Key and Secret Key are required.'
        });
    }
    try {
        // 3. Test the WEEX credentials using CCXT
        const exchange = new ccxt_1.default.weex({
            apiKey: apiKey,
            secret: apiSecret,
            password: passphrase, // WEEX passphrase if configured
            enableRateLimit: true,
        });
        // Verify keys by fetching account balance
        const balance = await exchange.fetchBalance();
        // 1. Safely extract USDT free balance (casting through unknown avoids the TS overlap error)
        const freeBalances = balance?.free;
        const usdtBalance = freeBalances ? Number(freeBalances['USDT'] ?? 0) : 0;
        // 2. Send back response
        return res.status(200).json({
            message: 'WEEX connection successful!',
            user: {
                username: 'WEEX Trader',
                apiKey: apiKey,
            },
            balance: usdtBalance,
            token: JWT_SECRET
        });
    }
    catch (error) {
        console.error('WEEX Auth Error:', error.message);
        return res.status(401).json({
            error: 'Failed to authenticate with WEEX. Invalid API credentials.'
        });
    }
});
exports.default = router;
