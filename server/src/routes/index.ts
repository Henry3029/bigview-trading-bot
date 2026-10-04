import express from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import engineRoutes from './engine.routes.js';
import tradeRoutes from './trade.routes.js';
import killSwitchRoutes from './kill-switch.routes.js'; // Renamed file to camelCase
import botRoutes from './bot.routes.js';

const router = express.Router();

router.use('/auth', authRoutes);   
router.use('/user', userRoutes);    
router.use('/engine', engineRoutes); 
router.use('/trade', tradeRoutes);
router.use('/kill-switch', killSwitchRoutes); // Changed path to lowercase kebab-case
router.use('/bot', botRoutes);

export default router;