import { AssetRule, TradeConfig } from '../types';

export interface ValidationResult {
  valid: boolean;
  reason?: string;
}

/**
 * Validates position size against asset rules and leverage against the config limit.
 * @param symbol  - Base asset symbol e.g. "BTC"
 * @param units   - Proposed position size in base units
 * @param leverage - Proposed leverage multiplier
 * @param config  - TradeConfig containing ASSET_RULES and LEVERAGE_LIMIT
 */
export function validateTrade(
  symbol: string,
  units: number,
  leverage: number,
  config: TradeConfig
): ValidationResult {
  if (leverage < 1 || leverage > config.LEVERAGE_LIMIT) {
    return { valid: false, reason: `Leverage ${leverage}x exceeds limit of ${config.LEVERAGE_LIMIT}x` };
  }

  const rules: AssetRule =
    config.ASSET_RULES?.[symbol] ?? config.ASSET_RULES?.['DEFAULT'] ?? { minLot: 0.001, integerOnly: false };

  if (units < rules.minLot) {
    return { valid: false, reason: `Position size ${units} is below minimum lot ${rules.minLot} for ${symbol}` };
  }

  if (rules.integerOnly && !Number.isInteger(units)) {
    return { valid: false, reason: `${symbol} requires integer position size, got ${units}` };
  }

  return { valid: true };
}
