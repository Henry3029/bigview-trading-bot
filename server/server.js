"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const cors_1 = __importDefault(require("cors"));
const cors_2 = require("./src/config/cors");
const express_1 = __importDefault(require("express"));
const index_js_1 = __importDefault(require("./src/routes/index.js"));
const mongoose_1 = __importDefault(require("mongoose"));
// ==========================================
// 1. DATABASE CONNECTION SETUP
// ==========================================
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/weex_bot';
mongoose_1.default.connect(MONGODB_URI)
    .then(async () => {
    console.log('🍃 [Database] MongoDB connected successfully');
    // 🛠️ One-time drop for old walletAddress index to fix E11000 duplicate error
    try {
        await mongoose_1.default.connection.collection('users').dropIndex('walletAddress_1');
        console.log('✅ [Database] Old walletAddress_1 index dropped successfully');
    }
    catch (err) {
        // Safe to ignore if the index was already dropped or doesn't exist
    }
})
    .catch((err) => console.error('❌ [Database] Connection error:', err.message));
// ==========================================
// 2. EXPRESS SETUP
// ==========================================
const app = (0, express_1.default)();
const SERVER_PORT = Number(process.env.SERVER_PORT) || 3002;
// Mount CORS middleware first
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if ((0, cors_2.isOriginAllowed)(origin)) {
            callback(null, true);
        }
        else {
            callback(new Error('CORS Policy: Request origin blocked.'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express_1.default.json());
// Catch-all for malformed JSON payloads
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && 'body' in err) {
        return res.status(400).json({ success: false, error: 'Invalid JSON payload' });
    }
    next();
});
// ==========================================
// 4. MOUNT API ROUTES
// ==========================================
app.use('/api', index_js_1.default);
app.get('/', (req, res) => {
    res.json({ status: "online", engine: "WEEX Dual AI Engine Active" });
});
// ==========================================
// 5. START SERVER
// ==========================================
app.listen(SERVER_PORT, '0.0.0.0', () => {
    console.log(`🚀 [Server] Express server active on http://0.0.0.0:${SERVER_PORT}`);
});
