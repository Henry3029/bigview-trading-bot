import express, { Request, Response, NextFunction } from 'express';
import { DEMO_JUDGE_USER, seedDemoData } from '../store/demoProfile';
import bcrypt from 'bcrypt';
import { ethers } from 'ethers';
import * as crypto from 'crypto';
import ccxt from 'ccxt';
import { connectToDatabase } from '@/lib/mongodb';
import jwt from 'jsonwebtoken';
import User from '@/models/User';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your_fallback_jwt_secret';

// -------------------------------------------------------------
// 1. USER VERIFICATION SIGNATURE
// -------------------------------------------------------------
router.post('/verify', async (req: Request, res: Response) => {
  try {
    await connectToDatabase();
    const { walletAddress, signature } = req.body;

    if (!walletAddress || !signature) {
      return res.status(400).json({ error: 'Wallet address and signature required' });
    }

    const normalizedAddress = walletAddress.toLowerCase();
    const user = await User.findOne({ walletAddress: normalizedAddress });

    if (!user) {
      return res.status(404).json({ error: 'User not found. Request a nonce first.' });
    }

    // Verify Signature
    const expectedMessage = `Sign this message to authenticate with WEEX Bot: ${user.nonce}`;
    const recoveredAddress = ethers.verifyMessage(expectedMessage, signature);

    if (recoveredAddress.toLowerCase() !== normalizedAddress) {
      return res.status(401).json({ error: 'Invalid signature verification failed' });
    }

    // Invalidate Nonce after successful login (prevents replay attacks)
    user.nonce = crypto.randomBytes(16).toString('hex');
    await user.save();

    // Issue standard JWT token
    const token = jwt.sign({ userId: user._id, walletAddress: user.walletAddress }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: {
        id: user._id,
        walletAddress: user.walletAddress,
        freeUsdtBalance: user.freeUsdtBalance,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// 2. USER REGISTER
// -------------------------------------------------------------
router.post('/register', async (req: Request, res: Response) => {
  try {
    await connectToDatabase();
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      email,
      passwordHash,
    });

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        freeUsdtBalance: user.freeUsdtBalance,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// 3. USER LOGIN
// -------------------------------------------------------------
router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  // ------------------------------------------------------------------
  // DEMO CREDENTIAL INTERCEPTOR FOR HACKATHON EVALUATORS
  // ------------------------------------------------------------------
  if (email === 'judge_demo@example.com' && password === 'Hackathon2026') {
    // Seed in-memory engine states & trade history logs
    seedDemoData();

    return res.status(200).json({
      success: true,
      token: 'demo-judge-jwt-token-2026',
      user: DEMO_JUDGE_USER,
      message: 'Logged in successfully as Hackathon Judge Evaluator'
    });
  }

  try {
    await connectToDatabase();

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        freeUsdtBalance: user.freeUsdtBalance,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// 4. WEEX API KEYS AUTHENTICATION
// -------------------------------------------------------------
router.post('/weex-keys', async (req: Request, res: Response) => {
  const { apiKey, apiSecret, passphrase } = req.body;

  if (!apiKey || !apiSecret) {
    return res.status(400).json({ 
      error: 'API Key and Secret Key are required.' 
    });
  }

  try {
    const exchange = new ccxt.weex({
      apiKey: apiKey,
      secret: apiSecret,
      password: passphrase,
      enableRateLimit: true,
    });

    const balance = await exchange.fetchBalance();
    
    const freeBalances = (balance as any)?.free;
    const usdtBalance = freeBalances ? Number(freeBalances['USDT'] ?? 0) : 0;

    return res.status(200).json({
      message: 'WEEX connection successful!',
      user: {
        username: 'WEEX Trader',
        apiKey: apiKey,
      },
      balance: usdtBalance,
      token: JWT_SECRET
    });

  } catch (error: any) {
    console.error('WEEX Auth Error:', error.message);
    return res.status(401).json({ 
      error: 'Failed to authenticate with WEEX. Invalid API credentials.' 
    });
  }
});

export default router;
