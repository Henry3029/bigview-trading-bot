import express from 'express';
import { alexaAdapter } from '../alexa';

const router = express.Router();

// Spread the middleware array directly so Express processes each handler in order
router.post('/', ...alexaAdapter.getRequestHandlers());

// 2. Optional GET Endpoint (Useful for health checks / browser testing)
router.get('/', (req, res) => {
  res.status(200).json({
    status: 'ONLINE',
    service: 'Alexa Skill Endpoint',
    timestamp: new Date().toISOString()
  });
});

export default router;
