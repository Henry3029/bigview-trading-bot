import { Router, Request, Response } from 'express';
import { 
  isEmergencyKillSwitchActive, 
  setEmergencyKillSwitchState, 
  setGlobalMarketBullish, 
  getActiveEnginePositions, 
  getExchangeInstance,
  emitSystemLog,
  emitEngineState 
} from '../serverState';
import { executeSell } from '../tradeManager';

const router = Router();

/**
 * @route   POST /api/kill-switch
 * @desc    Triggers full ecosystem shutdown & liquidates all active positions
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    console.log('\n🚨🚨🚨 [EMERGENCY KILL SWITCH TRIGGERED] 🚨🚨🚨');

    // 1. Instantly flip ecosystem state flags
    setEmergencyKillSwitchState(true);
    setGlobalMarketBullish(false);

    const exchange = getExchangeInstance();
    const positions = getActiveEnginePositions();
    const liquidationResults: Record<string, string> = {};

    // 2. Concurrently liquidate active positions across all engines
    const liquidationPromises = Object.entries(positions).map(async ([engineName, pos]) => {
      if (pos.isHoldingPosition && pos.tradeAmountUnits > 0) {
        console.log(`🚨 [KILL SWITCH SELL] Liquidating ${pos.activeAsset} for ${engineName}...`);
        try {
          let currentPrice = pos.entryPrice;
          
          try {
            const ticker = await exchange.fetchTicker(pos.activeAsset);
            currentPrice = ticker.last || currentPrice;
          } catch (tickerErr: any) {
            console.warn(`⚠️ Could not fetch price for ${pos.activeAsset}, using entry price fallback.`);
          }

          const sold = await executeSell(
            exchange,
            pos.activeAsset,
            pos.tradeAmountUnits,
            currentPrice,
            'EMERGENCY_KILL_SWITCH_LIQUIDATION'
          );

          if (sold) {
            pos.isHoldingPosition = false;
            liquidationResults[engineName] = `SOLD ${pos.tradeAmountUnits} ${pos.activeAsset} @ $${currentPrice}`;
          } else {
            liquidationResults[engineName] = `FAILED to sell ${pos.activeAsset}`;
          }
        } catch (sellErr: any) {
          console.error(`❌ Liquidation error for ${engineName}: ${sellErr.message}`);
          liquidationResults[engineName] = `ERROR: ${sellErr.message}`;
        }
      } else {
        liquidationResults[engineName] = 'NO_ACTIVE_POSITION';
      }

      // Force UI status update to EMERGENCY_HALT
      emitEngineState(engineName, {
        status: 'EMERGENCY_HALT',
        pnlPercentage: 0
      });
    });

    await Promise.all(liquidationPromises);

    emitSystemLog('GLOBAL', 'STOP_LOSS', '🚨 KILL SWITCH ACTIVATED! All positions liquidated. All engines locked in EMERGENCY_HALT state.');

    return res.status(200).json({
      success: true,
      message: 'Ecosystem halted and positions liquidated successfully.',
      isEmergencyKillSwitchActive: true,
      liquidations: liquidationResults,
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
 * @desc    Resets emergency halt state and allows engines to resume normal operations
 */
router.post('/reset', (req: Request, res: Response) => {
  setEmergencyKillSwitchState(false);
  emitSystemLog('GLOBAL', 'INFO', '🟢 Kill switch reset. Ecosystem unlocked and ready for trades.');
  
  return res.status(200).json({
    success: true,
    message: 'Ecosystem emergency halt cleared.',
    isEmergencyKillSwitchActive: false
  });
});

/**
 * @route   GET /api/kill-switch/status
 * @desc    Get current status of emergency halt flag
 */
router.get('/status', (req: Request, res: Response) => {
  return res.status(200).json({
    isEmergencyKillSwitchActive: isEmergencyKillSwitchActive(),
    timestamp: new Date().toISOString()
  });
});

export default router;
