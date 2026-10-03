import { ExtendedPositionState } from './tradeManager';

// Internal global state flags
let globalKillSwitchState = false;
let globalBullishState = false;
let globalExchange: any = null;

// Registry to track active positions across Engine 1 to 5
const enginePositions: Record<string, ExtendedPositionState> = {};

// Helper functions for Kill Switch state
export function isEmergencyKillSwitchActive(): boolean {
  return globalKillSwitchState;
}

export function setEmergencyKillSwitchState(active: boolean): void {
  globalKillSwitchState = active;
}

// Helper functions for Ecosystem Bullish state
export function isGlobalMarketBullish(): boolean {
  return globalBullishState;
}

export function setGlobalMarketBullish(bullish: boolean): void {
  globalBullishState = bullish;
}

// Exchange instance getter & setter
export function setExchangeInstance(exchange: any): void {
  globalExchange = exchange;
}

export function getExchangeInstance(): any {
  return globalExchange;
}

// Position tracking per engine
export function registerEnginePosition(engineName: string, position: ExtendedPositionState): void {
  enginePositions[engineName] = position;
}

export function getActiveEnginePositions(): Record<string, ExtendedPositionState> {
  return enginePositions;
}

// Dynamic socket relays initialized during server startup
export let emitSystemLog = (engine: string, type: string, message: string) => {};
export let emitEngineState = (engineId: string, payload: any) => {};

export function initializeStateRelays(logFn: any, stateFn: any) {
  emitSystemLog = logFn;
  emitEngineState = stateFn;
}
