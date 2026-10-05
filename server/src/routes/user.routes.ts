import express from 'express';
import mongoose from 'mongoose';
import User from '@/models/User';
import { connectToDatabase } from '@/lib/mongodb';
import { Request, Response, NextFunction } from 'express';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.middleware.js';
import ccxt from 'ccxt';

const router = express.Router();

// -------------------------------------------------------------
// GET CURRENT USER PROFILE (/api/user/me)
// -------------------------------------------------------------
router.get('/me', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    await connectToDatabase();

    // Select fields, keeping sensitive keys out while including status flags
    const user = await User.findById(req.userId).select('-passwordHash -weexSecretKey -weexPassphrase');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({
      user: {
        id: user._id,
        email: user.email,
        username: user.username, // Include username if you have it in your schema
        freeUsdtBalance: user.freeUsdtBalance,
        isBotActive: user.isBotActive || false, // <-- Critical for the toggle state
        hasConnectedKeys: !!(user.weexApiKey && user.weexApiKey.trim().length > 0), // <-- Critical for key status
        createdAt: user.createdAt,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});



router.post('/link-alexa', authenticateToken, async (req: any, res: any) => {
  try {
    const { alexaUserId } = req.body;
    
    // The userId is automatically extracted from the verified JWT by your middleware!
    const userId = req.user?.userId; 

    if (!alexaUserId || !userId) {
      return res.status(400).json({ success: false, error: 'Missing alexaUserId or user token data' });
    }

    await connectToDatabase();
    const usersCollection = mongoose.connection.collection('users');

    // Bind the Amazon Alexa ID to the MongoDB user document
    const result = await usersCollection.updateOne(
      { _id: new mongoose.Types.ObjectId(userId) },
      { $set: { alexaUserId: alexaUserId } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, error: 'User not found in database' });
    }

    return res.json({ success: true, message: 'Alexa account successfully linked!' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/balance', authenticateToken, async (req: AuthenticatedRequest, res: any) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || !user.weexApiKey || !user.weexSecretKey) {
      return res.status(400).json({ error: 'Exchange API keys not connected' });
    }

    // Initialize WEEX exchange instance dynamically for this user
    const exchange = new ccxt.weex({
      apiKey: user.weexApiKey,
      secret: user.weexSecretKey,
      // Add passphrase if WEEX requires it
      password: user.weexPassphrase || undefined,
      enableRateLimit: true,
    });

    // Fetch account balance from the exchange
    const balance = await exchange.fetchBalance();
    
    // Safely cast through unknown to satisfy TypeScript's strict rules
    const freeBalances = balance.free as unknown as Record<string, number>;
    const totalBalances = balance.total as unknown as Record<string, number>;

    const freeUsdt = freeBalances['USDT'] || 0;
    const totalUsdt = totalBalances['USDT'] || 0;



    return res.json({
      success: true,
      free: freeUsdt,
      total: totalUsdt,
    });

  } catch (err: any) {
    console.error('Failed to fetch balance:', err.message);
    return res.status(500).json({ error: 'Failed to fetch live balance from exchange' });
  }
});

export default router;
