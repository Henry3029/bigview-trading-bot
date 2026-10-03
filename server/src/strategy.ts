export function calculateDynamicAmount(
  exchange: any, 
  asset: string, 
  currentPrice: number, 
  targetMarginUSD: number, 
  leverage: number
): number {
  const totalBuyingPower = targetMarginUSD * leverage;
  const rawTokenAmount = totalBuyingPower / currentPrice;
  const precisionAmountStr = exchange.amountToPrecision(asset, rawTokenAmount);
  return parseFloat(precisionAmountStr);
}