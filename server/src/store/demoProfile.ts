import { registerEnginePosition, setGlobalMarketBullish } from '../serverState';
// Import your systemLogsStore if you have it in another store file, 
// or export a shared log array from serverState.ts
import { systemLogsStore } from './engineStore'; 

export interface DemoUserMetrics {
  id: string;
  email: string;
  name: string;
  accountTier: string;
  portfolioValueUsd: number;
  availableBalanceUsd: number;
  unrealizedPnlUsd: number;
  totalTradesExecuted: number;
  winRatePercentage: number;
  activeEnginesCount: number;
}

export const DEMO_JUDGE_USER: DemoUserMetrics = {
  id: 'judge-demo-2026',
  email: 'judge_demo@example.com',
  name: 'Hackathon Judge Evaluator',
  accountTier: 'Hackathon VIP Access',
  portfolioValueUsd: 12450.80,
  availableBalanceUsd: 3820.30,
  unrealizedPnlUsd: 630.50,
  totalTradesExecuted: 142,
  winRatePercentage: 68.4,
  activeEnginesCount: 5
};

export function seedDemoData(): void {
  console.log('🌱 Seeding demo metrics and history for hackathon evaluation...');

  // 1. Set Ecosystem Market State
  setGlobalMarketBullish(true);

  // 2. Pre-populate Active Engine Positions
  registerEnginePosition('ENGINE_1', {
    activeAsset: 'BTC/USDT',
    isHoldingPosition: true,
    entryPrice: 64250.50,
    tradeAmountUnits: 0.05,
    stopLossPrice: 62000.00,
    takeProfitPrice: 68000.00,
    highestPriceSinceEntry: 65100.00
  } as any);

  registerEnginePosition('ENGINE_2', {
    activeAsset: 'ETH/USDT',
    isHoldingPosition: true,
    entryPrice: 3450.20,
    tradeAmountUnits: 0.8,
    stopLossPrice: 3300.00,
    takeProfitPrice: 3750.00,
    highestPriceSinceEntry: 3520.00
  } as any);

  registerEnginePosition('ENGINE_3', {
    activeAsset: 'SOL/USDT',
    isHoldingPosition: true,
    entryPrice: 145.10,
    tradeAmountUnits: 15.0,
    stopLossPrice: 138.00,
    takeProfitPrice: 160.00,
    highestPriceSinceEntry: 151.00
  } as any);

  registerEnginePosition('ENGINE_4', {
    activeAsset: 'PEPE/USDT',
    isHoldingPosition: false,
    entryPrice: 0,
    tradeAmountUnits: 0,
    stopLossPrice: 0,
    takeProfitPrice: 0,
    highestPriceSinceEntry: 0
  } as any);

  registerEnginePosition('ENGINE_5', {
    activeAsset: 'DOGE/USDT',
    isHoldingPosition: true,
    entryPrice: 0.125,
    tradeAmountUnits: 2500,
    stopLossPrice: 0.118,
    takeProfitPrice: 0.140,
    highestPriceSinceEntry: 0.131
  } as any);

  // 3. Pre-populate Historical Execution Logs
  if (Array.isArray(systemLogsStore)) {
    const mockLogs = [
      {
      	id: 'log-1',
        engine: 'ENGINE_1',
        type: 'BUY',
        message: 'Executed BUY order for 0.05 BTC/USDT @ $64,250.50 [Strategy Trigger: Bullish Alignment]',
        timestamp: new Date(Date.now() - 1000 * 60 * 180).toLocaleTimeString()
      },
      {
      	id: 'log-2',
        engine: 'ENGINE_3',
        type: 'TAKE_PROFIT',
        message: 'Partial Take-Profit executed on SOL/USDT (+4.1% gain reached)',
        timestamp: new Date(Date.now() - 1000 * 60 * 120).toLocaleTimeString()
      },
      {
      	id: 'log-3',
        engine: 'ENGINE_2',
        type: 'BUY',
        message: 'Executed BUY order for 0.8 ETH/USDT @ $3,450.20',
        timestamp: new Date(Date.now() - 1000 * 60 * 45).toLocaleTimeString()
      },
      {
      	id: 'log-4',
        engine: 'GLOBAL',
        type: 'INFO',
        message: 'Ecosystem health check passed. All 5 engines operating normally.',
        timestamp: new Date(Date.now() - 1000 * 60 * 10).toLocaleTimeString()
      }
    ];

    systemLogsStore.length = 0;
    systemLogsStore.push(...mockLogs);
  }

  console.log('✅ Demo metrics and trade history successfully seeded.');
}
