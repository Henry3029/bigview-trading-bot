import express from 'express';
import { alexaAdapter } from '../alexa';

const router = express.Router();

// Match the root path of this router
router.post('/', alexaAdapter.getRequestHandlers());

export default router;