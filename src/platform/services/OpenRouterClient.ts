/**
 * OpenRouter Client for Vercel AI SDK
 * 
 * Uses the official @openrouter/ai-sdk-provider for native Vercel AI SDK integration.
 * This provides optimized streaming, built-in retries, and Edge compatibility.
 * 
 * @see https://github.com/OpenRouterTeam/ai-sdk-provider
 */

import { createOpenRouter } from '@openrouter/ai-sdk-provider';

// Create a function that returns the OpenRouter provider with the API key
// This is necessary because env vars may not be available at module load time on Vercel serverless
// We create the provider lazily to ensure the API key is available
let _openrouterInstance: ReturnType<typeof createOpenRouter> | null = null;

function getOpenRouterInstance() {
  if (!_openrouterInstance) {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      console.error('[OpenRouter] CRITICAL: OPENROUTER_API_KEY not found in environment');
    }
    _openrouterInstance = createOpenRouter({
      apiKey: apiKey || '',
    });
  }
  return _openrouterInstance;
}

// Export as a callable that returns the provider with the model
// Usage: openrouter('model-id') returns the model instance for streamText
export const openrouter = (modelId: string) => {
  const instance = getOpenRouterInstance();
  return instance(modelId);
};

// Model constants for easy reference
// Using VERIFIED OpenRouter model IDs - see https://openrouter.ai/models
// Important: Use base model IDs without version suffixes for best routing
export const OPENROUTER_MODELS = {
  // Fast/cheap models for simple queries - MOST RELIABLE
  HAIKU: 'anthropic/claude-3-haiku',
  GPT4O_MINI: 'openai/gpt-4o-mini',
  GEMINI_FLASH: 'google/gemini-flash-1.5',
  
  // Standard models for typical queries
  SONNET: 'anthropic/claude-3.5-sonnet',
  GPT4O: 'openai/gpt-4o',
  GEMINI_PRO: 'google/gemini-pro-1.5',
  
  // Complex models for advanced reasoning
  OPUS: 'anthropic/claude-3-opus',
  GPT4_TURBO: 'openai/gpt-4-turbo',
  
  // Research model with web search
  PERPLEXITY: 'perplexity/llama-3.1-sonar-large-128k-online',
} as const;

// Model chains for failover (from simple to complex)
export const MODEL_CHAINS = {
  simple: [OPENROUTER_MODELS.GPT4O_MINI, OPENROUTER_MODELS.HAIKU, OPENROUTER_MODELS.GEMINI_FLASH],
  standard: [OPENROUTER_MODELS.SONNET, OPENROUTER_MODELS.GPT4O, OPENROUTER_MODELS.GPT4O_MINI],
  complex: [OPENROUTER_MODELS.OPUS, OPENROUTER_MODELS.GPT4_TURBO, OPENROUTER_MODELS.SONNET],
  research: [OPENROUTER_MODELS.PERPLEXITY, OPENROUTER_MODELS.SONNET, OPENROUTER_MODELS.GPT4O],
} as const;

// Helper to get model by complexity
export function getModelForComplexity(complexity: 'simple' | 'standard' | 'complex' | 'research'): string {
  return MODEL_CHAINS[complexity][0];
}

// Type for model IDs
export type OpenRouterModelId = typeof OPENROUTER_MODELS[keyof typeof OPENROUTER_MODELS];

