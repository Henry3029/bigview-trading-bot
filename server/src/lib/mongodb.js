"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectToDatabase = connectToDatabase;
const mongoose_1 = __importDefault(require("mongoose"));
let cached = global.mongooseCache || { conn: null, promise: null };
if (!global.mongooseCache) {
    global.mongooseCache = cached;
}
async function connectToDatabase() {
    if (cached.conn) {
        return cached.conn;
    }
    const MONGODB_URI = process.env.MONGODB_URI;
    if (!MONGODB_URI) {
        throw new Error('Please define the MONGODB_URI environment variable inside .env');
    }
    if (!cached.promise) {
        cached.promise = mongoose_1.default.connect(MONGODB_URI, {
            bufferCommands: false,
        });
    }
    try {
        cached.conn = await cached.promise;
        console.log('🍃 [Database] MongoDB connected successfully');
    }
    catch (e) {
        cached.promise = null;
        throw e;
    }
    return cached.conn;
}
