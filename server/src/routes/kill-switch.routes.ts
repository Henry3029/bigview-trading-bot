import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';

const router = Router();

/**
 * @route   POST /api/kill-switch
 * @desc    Triggers full ecosystem shutdown via database flag
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    console.log('🚨 [API] Emergency Kill Switch signal received.');

    // Update system state in MongoDB so the Engine process detects it instantly
    await mongoose.connection.collection('system_config').updateOne(
      { key: 'ecosystem_state' },
      { $set: { killSwitchActive: true, updatedAt: new Date() } },
      { upsert: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Emergency Kill Switch signal sent to trading engines.',
      isEmergencyKillSwitchActive: true,
      timestamp: new Date().toISOString()
    });

  } catch (err: any) {
    console.error(`❌ Critical error in Kill Switch route: ${err.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to complete emergency shutdown process.',
      error: err.message
    });
  }
});

/**
 * @route   POST /api/kill-switch/reset
 * @desc    Resets emergency halt state
 */
router.post('/reset', async (req: Request, res: Response) => {
  try {
    await mongoose.connection.collection('system_config').updateOne(
      { key: 'ecosystem_state' },
      { $set: { killSwitchActive: false, updatedAt: new Date() } },
      { upsert: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Ecosystem emergency halt cleared.',
      isEmergencyKillSwitchActive: false
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * @route   GET /api/kill-switch/status
 * @desc    Get current status of emergency halt flag from DB
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    const config = await mongoose.connection.collection('system_config').findOne({ key: 'ecosystem_state' });
    const isActive = config ? !!config.killSwitchActive : false;

    return res.status(200).json({
      isEmergencyKillSwitchActive: isActive,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
