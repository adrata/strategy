# API Keys Setup Guide

## Required Environment Variables

To use the AI services, you need to set the following environment variables:

### OpenRouter API Key
```
OPENROUTER_API_KEY=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
```

### Anthropic Claude API Key
```
ANTHROPIC_API_KEY=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
```

## Setup Instructions

### For Local Development

1. Create a `.env.local` file in the project root (if it doesn't exist)
2. Add the environment variables above
3. Restart your dev server

### For Production

Set these as environment variables in your deployment platform (Vercel, etc.)

## Testing

Run the test script to verify the API keys work:
```bash
node scripts/test-api-keys.js
```

## Model Configuration

- **OpenRouter**: Uses `anthropic/claude-sonnet-4.5` model
- **Anthropic Direct**: Uses `claude-sonnet-4-5` model (configured in ClaudeAIService.ts)

## Notes

- OpenRouter is the primary service (intelligent routing with failover)
- Anthropic is the fallback service when OpenRouter fails
- Both services should be configured for best reliability

