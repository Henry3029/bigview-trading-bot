import express from 'express';
import User from '../models/User';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.middleware'; // Use your actual auth middleware

const router = express.Router();

// Toggle Bot Status Endpoint
router.post('/toggle', async (req: any, res: any) => {
  try {
    const userId = req.user.id; // Assumes your auth middleware attaches the logged-in user
    const { activate } = req.body; // Expects true or false from the frontend

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Safety check: Don't let them turn it on if they haven't saved their keys yet!
    if (activate && (!user.weexApiKey || !user.weexSecretKey)) {
      return res.status(400).json({ error: 'Please save your WEEX API keys before starting the bot.' });
    }

    user.isBotActive = Boolean(activate);
    await user.save();

    return res.json({ 
      success: true, 
      isBotActive: user.isBotActive,
      message: user.isBotActive ? 'Trading bot activated successfully.' : 'Trading bot paused.' 
    });

  } catch (err: any) {
    console.error('Bot toggle error:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
