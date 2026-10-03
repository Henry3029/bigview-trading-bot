import { TradeConfig } from './types';

export const CONFIG: TradeConfig = {
  ENGINE_ONE: [
    'BTC/USDT:USDT'
  ],
  ENGINE_TWO: [
    'ETH/USDT:USDT',
    'AVAX/USDT:USDT'
  ],
  ENGINE_THREE: [
    '1000PEPE/USDT:USDT',
    'BNB/USDT:USDT'
  ],
  ENGINE_FOUR: [
    'DOGE/USDT:USDT',
    'XRP/USDT:USDT'
  ],
  ENGINE_FIVE: [
    'SOL/USDT:USDT',
    'ZEC/USDT:USDT' // Added ZEC/USDT:USDT to complete the pair
  ],

  // Market Floor & Minimum Precision Registry
  ASSET_RULES: {
    'ZEC': { minLot: 0.1, integerOnly: false },
    'BTW': { minLot: 100.0, integerOnly: true },
    '1000PEPE': { minLot: 1.0, integerOnly: true },
    'DEFAULT': { minLot: 0.001, integerOnly: false }
  },

  LEVERAGE_LIMIT: 20,
  POLL_INTERVAL_MS: 3000,
  RENDER_URL: 'https://weex-ai-wars.onrender.com',
  DRY_RUN: false
};
