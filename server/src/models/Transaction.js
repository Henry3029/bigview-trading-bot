"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const TransactionSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
        type: String,
        enum: ['DEPOSIT', 'WITHDRAWAL', 'ALLOCATION', 'PROFIT_PAYOUT'],
        required: true
    },
    amount: { type: Number, required: true },
    status: {
        type: String,
        enum: ['PENDING', 'COMPLETED', 'FAILED'],
        default: 'COMPLETED'
    },
    reference: { type: String, default: null },
    createdAt: { type: Date, default: Date.now },
});
const Transaction = mongoose_1.models.Transaction || (0, mongoose_1.model)('Transaction', TransactionSchema);
exports.default = Transaction;
