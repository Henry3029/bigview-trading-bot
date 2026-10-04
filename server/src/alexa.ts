import * as Alexa from 'ask-sdk-core';
import { ExpressAdapter } from 'ask-sdk-express-adapter';
import ccxt from 'ccxt';
import { 
  getActiveEnginePositions, 
  isEmergencyKillSwitchActive, 
  isGlobalMarketBullish, 
  setEmergencyKillSwitchState, 
  setGlobalMarketBullish 
} from './serverState';
import { connectToDatabase } from '@/lib/mongodb';
import mongoose from 'mongoose';
import { DEMO_JUDGE_USER } from './store/demoProfile';
import { systemLogsStore } from './store/engineStore';

// Helper to check if the user's device has a display
function supportsAPL(handlerInput: any): boolean {
  const supportedInterfaces =
    handlerInput.requestEnvelope.context?.System?.device?.supportedInterfaces;
  return !!supportedInterfaces?.['Alexa.Presentation.APL'];
}


// Helper to instantiate CCXT for live exchange market queries
const exchange = new ccxt.weex({
  apiKey: process.env.WEEX_API_KEY,
  secret: process.env.WEEX_SECRET_KEY,
  password: process.env.WEEX_PASSPHRASE,
  options: { defaultType: 'swap' }
});

// Helper: Normalize slot values (e.g. "bitcoin" -> "BTC", "solana" -> "SOL")
function normalizeSymbol(rawCoin: string): string {
  if (!rawCoin) return 'BTC/USDT';
  const clean = rawCoin.toUpperCase().trim();
  const map: Record<string, string> = {
    BITCOIN: 'BTC',
    ETHEREUM: 'ETH',
    SOLANA: 'SOL',
    DOGECOIN: 'DOGE',
    PEPE: 'PEPE',
    SHIBA: 'SHIB'
  };

  const symbol = map[clean] || clean;
  return symbol.includes('/') ? symbol : `${symbol}/USDT`;
}


// Helper to timeout async operations safely
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timeoutHandle: NodeJS.Timeout;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutHandle = setTimeout(() => reject(new Error('Operation timed out')), ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeoutHandle));
}


// Standard APL visual card layout for Echo Show displays
const DASHBOARD_APL_DOCUMENT = {
  type: 'APL',
  version: '2023.3',
  theme: 'dark',
  mainTemplate: {
    parameters: ['payload'],
    items: [
      {
        type: 'Container',
        width: '100vw',
        height: '100vh',
        paddingLeft: '5vw',
        paddingRight: '5vw',
        justifyContent: 'center',
        items: [
          {
            type: 'Text',
            text: '${payload.title}',
            style: 'textStyleHeader',
            fontSize: '28dp',
            color: '#AAAAAA',
            marginBottom: '10dp'
          },
          {
            type: 'Text',
            text: '${payload.primaryMetric}',
            fontSize: '48dp',
            fontWeight: 'bold',
            color: '#FFFFFF',
            marginBottom: '15dp'
          },
          {
            type: 'Text',
            text: '${payload.statusText}',
            fontSize: '20dp',
            color: '${payload.statusColor}',
            fontWeight: '600',
            marginBottom: '20dp'
          }
        ]
      }
    ]
  }
};


// =========================================================================
// STANDARD BUILT-IN ALEXA HANDLERS
// =========================================================================

const LaunchRequestHandler = {
  canHandle(handlerInput: any) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
  },
  handle(handlerInput: any) {
    const speechText = "WEEX Trading Engine online. You can ask for portfolio balance, asset prices, bot status, or trigger emergency controls.";
    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .getResponse();
  }
};

const HelpIntentHandler = {
  canHandle(handlerInput: any) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent'
    );
  },
  handle(handlerInput: any) {
    const speechText = "You can say 'What's my portfolio balance?', 'Check bot status', 'What is the price of Bitcoin?', or 'Pause trading'.";
    return handlerInput.responseBuilder.speak(speechText).reprompt(speechText).getResponse();
  }
};

const CancelAndStopIntentHandler = {
  canHandle(handlerInput: any) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
      (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent' ||
       Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent')
    );
  },
  handle(handlerInput: any) {
    return handlerInput.responseBuilder.speak("Trading Voice Assistant signing off.").getResponse();
  }
};

// =========================================================================
// CATEGORY A: PORTFOLIO & BALANCE QUERIES (LIVE DATA)
// =========================================================================

export const GetPortfolioBalanceIntentHandler = {
  canHandle(handlerInput: any) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === 'GetPortfolioBalanceIntent'
    );
  },
  async handle(handlerInput: any) {
    // 1. Extract the unique Amazon User ID from the incoming voice request
    const alexaUserId = handlerInput.requestEnvelope.context?.System?.user?.userId;

    let totalUsdt = "0.00";
    let freeUsdt = "0.00";
    let winRate = DEMO_JUDGE_USER.winRatePercentage.toString();
    let activeCount = DEMO_JUDGE_USER.activeEnginesCount;
    let welcomeName = "Judge";

    try {
      // 2. Connect to your production MongoDB Atlas cluster
      await connectToDatabase();
      const usersCollection = mongoose.connection.collection('users');

      // 3. Search for a user whose document has this alexaUserId linked
      const dbUser = await usersCollection.findOne({ alexaUserId });

      if (dbUser) {
        // Real Linked User Found in MongoDB!
        welcomeName = dbUser.name || dbUser.email?.split('@')[0] || "Trader";
        totalUsdt = (dbUser.portfolioValueUsd || 1000.00).toFixed(2);
        freeUsdt = (dbUser.availableBalanceUsd || 500.00).toFixed(2);
      } else {
        // Fallback: If no account is linked yet (e.g. the Judge testing), use demo data
        welcomeName = "Judge";
        totalUsdt = DEMO_JUDGE_USER.portfolioValueUsd.toFixed(2);
        freeUsdt = DEMO_JUDGE_USER.availableBalanceUsd.toFixed(2);
      }
    } catch (err) {
      console.error("❌ Database lookup failed in Alexa handler, using demo fallback:", err);
      totalUsdt = DEMO_JUDGE_USER.portfolioValueUsd.toFixed(2);
      freeUsdt = DEMO_JUDGE_USER.availableBalanceUsd.toFixed(2);
    }

    const isPaused = isEmergencyKillSwitchActive();
    const speechText = `Welcome ${welcomeName}. Your portfolio valuation is $${totalUsdt} USDT, with $${freeUsdt} USDT available.`;

    const responseBuilder = handlerInput.responseBuilder.speak(speechText);

    // If device has a screen (Echo Show / Developer Console Simulator)
    if (supportsAPL(handlerInput)) {
      responseBuilder.addDirective({
        type: 'Alexa.Presentation.APL.RenderDocument',
        token: 'portfolioBalanceToken',
        document: DASHBOARD_APL_DOCUMENT,
        datasources: {
          payload: {
            title: 'Portfolio Overview',
            primaryMetric: `${totalUsdt} USDT`,
            statusText: isPaused ? 'PAUSED (Kill Switch)' : `ACTIVE (${activeCount} Engines Running)`,
            statusColor: isPaused ? '#FF3333' : '#00FF66',
            items: [
              { primaryText: `Available Balance: $${freeUsdt} USDT` },
              { primaryText: `Win Rate: ${winRate}%` },
              { primaryText: `Active Engines: ${activeCount}` }
            ]
          }
        }
      });
    }

    return responseBuilder.getResponse();
  }
};


const GetAssetAllocationIntentHandler = {
  canHandle(handlerInput: any) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === 'GetAssetAllocationIntent'
    );
  },
  handle(handlerInput: any) {
    const positions = getActiveEnginePositions();
    const activeAssets = Object.entries(positions)
      .filter(([_, pos]) => pos.isHoldingPosition)
      .map(([engine, pos]) => `${engine} holding ${pos.activeAsset}`);

    let speechText = "All trading engines are currently in cash with no active positions.";
    if (activeAssets.length > 0) {
      speechText = `Your active positions are currently: ${activeAssets.join(', ')}.`;
    }

    return handlerInput.responseBuilder.speak(speechText).getResponse();
  }
};

// =========================================================================
// CATEGORY B: BOT STATUS & ENGINE CONTROLS
// =========================================================================

const GetBotStatusIntentHandler = {
  canHandle(handlerInput: any) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === 'GetBotStatusIntent'
    );
  },
  handle(handlerInput: any) {
    if (isEmergencyKillSwitchActive()) {
      return handlerInput.responseBuilder
        .speak("The trading ecosystem is currently in EMERGENCY HALT state. All trading loops are locked.")
        .getResponse();
    }

    const marketState = isGlobalMarketBullish() ? "bullish and active" : "standby";
    const positions = getActiveEnginePositions();
    const activeCount = Object.values(positions).filter(p => p.isHoldingPosition).length;

    const speechText = `The trading engine is online. Market ecosystem state is ${marketState}. You currently have ${activeCount} active positions open across all 5 engines.`;
    return handlerInput.responseBuilder.speak(speechText).getResponse();
  }
};

// 1. Initial Trigger: Asks for confirmation (keeps session open)
export const ToggleTradingEngineIntentHandler = {
  canHandle(handlerInput: any) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === 'ToggleTradingEngineIntent'
    );
  },
  handle(handlerInput: any) {
    const currentState = isEmergencyKillSwitchActive();
    const action = currentState ? 'resume' : 'pause';

    // Store pending action in Session Attributes
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    sessionAttributes.pendingAction = 'TOGGLE_KILL_SWITCH';
    handlerInput.attributesManager.setSessionAttributes(sessionAttributes);

    const speechText = `Are you sure you want to ${action} all 5 trading engines on WEEX?`;
    const repromptText = `Please say yes to ${action} trading, or no to cancel.`;

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(repromptText)
      .getResponse();
  }
};


// Multi-Turn Confirmation Handler (Handles "Yes" or "No" responses)
export const ConfirmActionIntentHandler = {
  canHandle(handlerInput: any) {
    const request = handlerInput.requestEnvelope.request;
    if (request.type !== 'IntentRequest') return false;

    const intentName = request.intent.name;
    return intentName === 'AMAZON.YesIntent' || intentName === 'AMAZON.NoIntent';
  },
  handle(handlerInput: any) {
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    const intentName = Alexa.getIntentName(handlerInput.requestEnvelope);

    // Check if user is confirming the Emergency Kill Switch
    if (sessionAttributes.pendingAction === 'TOGGLE_KILL_SWITCH') {
      delete sessionAttributes.pendingAction;
      handlerInput.attributesManager.setSessionAttributes(sessionAttributes);

      if (intentName === 'AMAZON.YesIntent') {
        const currentState = isEmergencyKillSwitchActive();
        const newState = !currentState;
        
        // Mutate global state across all 5 engines
        setEmergencyKillSwitchState(newState);

        const speechText = newState
          ? 'Emergency Kill Switch activated. All 5 trading engines are now paused.'
          : 'Ecosystem resumed. All 5 trading engines are back online.';

        const responseBuilder = handlerInput.responseBuilder.speak(speechText);

        // Render APL Card on Echo Show / Simulator
        if (supportsAPL(handlerInput)) {
          responseBuilder.addDirective({
            type: 'Alexa.Presentation.APL.RenderDocument',
            token: 'toggleStateToken',
            document: DASHBOARD_APL_DOCUMENT,
            datasources: {
              payload: {
                title: 'Ecosystem Control Center',
                primaryMetric: newState ? 'SYSTEM PAUSED' : 'SYSTEM OPERATIONAL',
                statusText: newState ? 'KILL SWITCH ACTIVE' : 'RUNNING',
                statusColor: newState ? '#FF3333' : '#00FF66',
                items: [
                  { primaryText: newState ? 'Market orders halted across all engines.' : 'Engines 1-5 scanning for trade setups.' },
                  { primaryText: 'Action Source: Alexa Voice Confirmation' }
                ]
              }
            }
          });
        }

        return responseBuilder.getResponse();
      } else {
        return handlerInput.responseBuilder
          .speak('Action cancelled. All 5 trading engines remain unchanged.')
          .getResponse();
      }
    }

    return handlerInput.responseBuilder
      .speak('I did not catch what you wanted to confirm.')
      .getResponse();
  }
};



// =========================================================================
// CATEGORY C: MARKET DATA & ASSET ANALYTICS (LIVE CCXT QUERIES)
// =========================================================================

const GetAssetPriceIntentHandler = {
  canHandle(handlerInput: any) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === 'GetAssetPriceIntent'
    );
  },
  async handle(handlerInput: any) {
    const rawCoin = Alexa.getSlotValue(handlerInput.requestEnvelope, 'Coin');
    const pair = normalizeSymbol(rawCoin);

    try {
      // 5-second timeout safeguard so it never hangs indefinitely
      const ticker: any = await withTimeout(exchange.fetchTicker(pair), 5000);
      const price = ticker.last;

      const speechText = `${pair.split('/')[0]} is currently trading at ${price} USDT on WEEX.`;
      return handlerInput.responseBuilder.speak(speechText).getResponse();
    } catch (err: any) {
      return handlerInput.responseBuilder
        .speak(`Sorry, I couldn't fetch live ticker data for ${rawCoin || 'that asset'}.`)
        .getResponse();
    }
  }
};

const GetAssetPerformanceIntentHandler = {
  canHandle(handlerInput: any) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === 'GetAssetPerformanceIntent'
    );
  },
  async handle(handlerInput: any) {
    const rawCoin = Alexa.getSlotValue(handlerInput.requestEnvelope, 'Coin');
    const pair = normalizeSymbol(rawCoin);

    try {
      // 5-second timeout safeguard
      const ticker: any = await withTimeout(exchange.fetchTicker(pair), 5000);
      const change = ticker.percentage ? ticker.percentage.toFixed(2) : '0';
      const isPositive = parseFloat(change) >= 0;

      const speechText = `${pair.split('/')[0]} is ${isPositive ? 'up' : 'down'} ${Math.abs(parseFloat(change))}% in the last 24 hours.`;
      return handlerInput.responseBuilder.speak(speechText).getResponse();
    } catch (err: any) {
      return handlerInput.responseBuilder
        .speak(`I couldn't retrieve performance statistics for ${rawCoin || 'the asset'}.`)
        .getResponse();
    }
  }
};

// =========================================================================
// CATEGORY D: TRADE HISTORY & ACTIVITY LOGS (LIVE SYSTEM STORES)
// =========================================================================

const GetRecentTradesIntentHandler = {
  canHandle(handlerInput: any) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === 'GetRecentTradesIntent'
    );
  },
  handle(handlerInput: any) {
    const tradeLogs = systemLogsStore.filter(log => log.type === 'BUY' || log.type === 'TAKE_PROFIT' || log.type === 'STOP_LOSS');

    if (tradeLogs.length === 0) {
      return handlerInput.responseBuilder
        .speak("No trades have been recorded since the bot was started.")
        .getResponse();
    }

    const latest = tradeLogs[0];
    const speechText = `The last recorded trade was on ${latest.engine}: ${latest.message} at ${latest.timestamp}.`;

    return handlerInput.responseBuilder.speak(speechText).getResponse();
  }
};

const GetEngineLogsIntentHandler = {
  canHandle(handlerInput: any) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === 'GetEngineLogsIntent'
    );
  },
  handle(handlerInput: any) {
    if (systemLogsStore.length === 0) {
      return handlerInput.responseBuilder
        .speak("The system log buffer is currently empty.")
        .getResponse();
    }

    const latestLog = systemLogsStore[0];
    const speechText = `Latest engine log from ${latestLog.engine}: ${latestLog.message}`;

    return handlerInput.responseBuilder.speak(speechText).getResponse();
  }
};

// Error Handler to catch voice pipeline failures
const ErrorHandler = {
  canHandle() { return true; },
  handle(handlerInput: any, error: any) {
    console.error(`❌ Alexa Pipeline Error: ${error.message}`);
    return handlerInput.responseBuilder
      .speak("Sorry, I encountered an error executing that voice command.")
      .getResponse();
  }
};

// =========================================================================
// SKILL BUILDER REGISTRATION & EXPRESS ADAPTER EXPORT
// =========================================================================

const skillBuilder = Alexa.SkillBuilders.custom()
  .addRequestHandlers(
    LaunchRequestHandler,
    HelpIntentHandler,
    CancelAndStopIntentHandler,
    GetPortfolioBalanceIntentHandler,
    GetAssetAllocationIntentHandler,
    GetBotStatusIntentHandler,
    ToggleTradingEngineIntentHandler,
    ConfirmActionIntentHandler,
    GetAssetPriceIntentHandler,
    GetAssetPerformanceIntentHandler,
    GetRecentTradesIntentHandler,
    GetEngineLogsIntentHandler
  )
  .addErrorHandlers(ErrorHandler);

const skill = skillBuilder.create();
export const alexaAdapter = new ExpressAdapter(skill, false, false);
