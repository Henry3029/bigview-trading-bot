import express from 'express';
import mongoose from 'mongoose';
import User from '@/models/User';
import { connectToDatabase } from '@/lib/mongodb';
import { Request, Response, NextFunction } from 'express';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.middleware.js';

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

export default router;
