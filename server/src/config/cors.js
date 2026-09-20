"use strict";
// src/config/cors.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.isOriginAllowed = exports.ALLOWED_ORIGINS = void 0;
exports.ALLOWED_ORIGINS = process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
    : [
        'https://bot.bigviewbot.online',
        'https://server.bigviewbot.online',
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:5173'
    ];
const isOriginAllowed = (origin) => {
    if (!origin)
        return true; // Allow non-browser requests (Postman, cURL, server-to-server)
    const isVercelDomain = origin.endsWith('.vercel.app');
    const isExplicitlyAllowed = exports.ALLOWED_ORIGINS.includes(origin);
    return isExplicitlyAllowed || isVercelDomain;
};
exports.isOriginAllowed = isOriginAllowed;
