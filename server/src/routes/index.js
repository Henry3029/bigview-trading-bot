"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_routes_js_1 = __importDefault(require("./auth.routes.js"));
const user_routes_js_1 = __importDefault(require("./user.routes.js"));
const engine_routes_js_1 = __importDefault(require("./engine.routes.js"));
const trade_routes_js_1 = __importDefault(require("./trade.routes.js"));
const router = express_1.default.Router();
router.use('/auth', auth_routes_js_1.default);
router.use('/user', user_routes_js_1.default);
router.use('/engine', engine_routes_js_1.default);
router.use('/trade', trade_routes_js_1.default);
exports.default = router;
