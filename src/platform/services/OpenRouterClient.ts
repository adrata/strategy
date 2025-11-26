/**
 * OpenRouter Client for Vercel AI SDK
 * 
 * Uses the official @openrouter/ai-sdk-provider for native Vercel AI SDK integration.
 * This provides optimized streaming, built-in retries, and Edge compatibility.
 * 
 * @see https://github.com/OpenRouterTeam/ai-sdk-provider
 */

import { createOpenRouter } from '@openrouter/ai-sdk-provider';

// Create the OpenRouter provider instance
// This is compatible with Vercel AI SDK's streamText, generateText, etc.
export const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY || '',
});

// Model constants for easy reference
export const OPENROUTER_MODELS = {
  // Fast/cheap models for simple queries
  HAIKU: 'anthropic/claude-3-haiku',
  GPT4O_MINI: 'openai/gpt-4o-mini',
  GEMINI_FLASH: 'google/gemini-2.0-flash-exp',
  
  // Standard models for typical queries
  SONNET: 'anthropic/claude-sonnet-4',
  GPT4O: 'openai/gpt-4o',
  GPT5: 'openai/gpt-5',
  
  // Complex models for advanced reasoning
  OPUS: 'anthropic/claude-opus-4',
  GPT45_PREVIEW: 'openai/gpt-4.5-preview',
  
  // Research model with web search
  PERPLEXITY: 'perplexity/llama-3.1-sonar-large-128k-online',
} as const;

// Model chains for failover (from simple to complex)
export const MODEL_CHAINS = {
  simple: [OPENROUTER_MODELS.GPT4O_MINI, OPENROUTER_MODELS.HAIKU, OPENROUTER_MODELS.GEMINI_FLASH],
  standard: [OPENROUTER_MODELS.SONNET, OPENROUTER_MODELS.GPT4O, OPENROUTER_MODELS.GEMINI_FLASH],
  complex: [OPENROUTER_MODELS.OPUS, OPENROUTER_MODELS.GPT45_PREVIEW, OPENROUTER_MODELS.SONNET],
  research: [OPENROUTER_MODELS.PERPLEXITY, OPENROUTER_MODELS.SONNET, OPENROUTER_MODELS.GPT4O],
} as const;

// Helper to get model by complexity
export function getModelForComplexity(complexity: 'simple' | 'standard' | 'complex' | 'research'): string {
  return MODEL_CHAINS[complexity][0];
}

// Type for model IDs
export type OpenRouterModelId = typeof OPENROUTER_MODELS[keyof typeof OPENROUTER_MODELS];

