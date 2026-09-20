"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const User_1 = __importDefault(require("@/models/User"));
const mongodb_1 = require("@/lib/mongodb");
const auth_middleware_js_1 = require("../middleware/auth.middleware.js");
const router = express_1.default.Router();
// -------------------------------------------------------------
// GET CURRENT USER PROFILE (/api/user/me)
// -------------------------------------------------------------
router.get('/me', auth_middleware_js_1.authenticateToken, async (req, res) => {
    try {
        await (0, mongodb_1.connectToDatabase)();
        const user = await User_1.default.findById(req.userId).select('-passwordHash');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        return res.json({
            user: {
                id: user._id,
                email: user.email,
                freeUsdtBalance: user.freeUsdtBalance,
                createdAt: user.createdAt,
            },
        });
    }
    catch (err) {
        return res.status(500).json({ error: err.message });
    }
});
exports.default = router;
