// import OpenAI from 'openai';
import { env } from './env.js';

export const aiConfig = Object.freeze({
  model: env.ai.model,
  maxTokens: env.ai.maxTokens,
});

let client = null;

/** Lazily create the OpenAI client. Returns null when no API key is configured. */
export function getAIClient() {
  if (client) return client;
  if (!env.ai.apiKey) return null;
  // client = new OpenAI({ apiKey: env.ai.apiKey, timeout: env.ai.timeoutMs, maxRetries: 2 });
  return client;
}

/** Test hook: inject a fake client. */
export function setAIClient(fake) {
  client = fake;
}
