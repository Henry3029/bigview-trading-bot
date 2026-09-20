"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const EngineAllocationSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    engineName: {
        type: String,
        enum: ['MAJOR_ENGINE', 'ALT_ENGINE', 'MEME_ENGINE'],
        required: true
    },
    allocatedUsdt: { type: Number, default: 0.0 },
    status: { type: String, enum: ['ACTIVE', 'PAUSED'], default: 'ACTIVE' },
}, { timestamps: true });
// Enforce unique combination of userId and engineName (like @@unique in Prisma)
EngineAllocationSchema.index({ userId: 1, engineName: 1 }, { unique: true });
const EngineAllocation = mongoose_1.models.EngineAllocation || (0, mongoose_1.model)('EngineAllocation', EngineAllocationSchema);
exports.default = EngineAllocation;
