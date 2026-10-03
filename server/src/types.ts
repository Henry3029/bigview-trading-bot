export interface AssetRule {
  minLot: number;
  integerOnly: boolean;
}

export interface PositionState {
  isHoldingPosition: boolean;
  activeAsset: string;
  entryPrice: number;
  takeProfitPrice: number;
  stopLossPrice: number;
  tradeAmountUnits: number;
  entryTime: number; // Added for Time-Based Exits
  lastExitReason?: string; // Tracks why trade exited ("HARD_STOP_LOSS_HIT", "24H_STAGNANT_TIMEOUT", etc.)
}

export interface TradeConfig {
  ENGINE_ONE: string[];
  ENGINE_TWO: string[];
  ENGINE_THREE: string[];
  ENGINE_FOUR: string[];
  ENGINE_FIVE: string[];
  ASSET_RULES?: Record<string, AssetRule>;
  LEVERAGE_LIMIT: number;
  POLL_INTERVAL_MS: number;
  RENDER_URL: string;
  DRY_RUN: boolean;
}

