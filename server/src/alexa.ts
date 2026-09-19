import * as Alexa from 'ask-sdk-core';
import { ExpressAdapter } from 'ask-sdk-express-adapter';

// Handler 1: "Alexa, what is the status of Engine 1?"
const EngineStatusHandler = {
  canHandle(handlerInput: any) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === 'EngineStatusIntent'
    );
  },
  handle(handlerInput: any) {
    // Read state directly from your running engine memory or DB
    const speechText = "Engine 1 is currently active, scanning WEEX meme pairs with 100% uptime.";

    return handlerInput.responseBuilder
      .speak(speechText)
      .getResponse();
  }
};


// Build the skill & Express adapter
const skillBuilder = Alexa.SkillBuilders.custom()
  .addRequestHandlers(EngineStatusHandler, StopLossHandler);

const skill = skillBuilder.create();
export const alexaAdapter = new ExpressAdapter(skill, false, false);
