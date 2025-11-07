# Environment Setup for Buyer Group V2

## Required Environment Variables

Add these environment variables to your `.env` file:

```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/adrata"

# Buyer Group V2 API Keys (Required)
CORESIGNAL_API_KEY="your_coresignal_api_key_here"
ANTHROPIC_API_KEY="your_anthropic_api_key_here"

# Voice Recognition (Required for voice features)
NEXT_PUBLIC_DEEPGRAM_API_KEY="your_deepgram_api_key_here"

# Text-to-Speech (Optional)
NEXT_PUBLIC_ELEVEN_LABS_API_KEY="your_elevenlabs_api_key_here"

# AI Web Search (Required for AI to access real-time web information)
PERPLEXITY_API_KEY="your_perplexity_api_key_here"

# Alternative Search APIs (Optional)
GOOGLE_SEARCH_API_KEY="your_google_api_key_here"
GOOGLE_SEARCH_ENGINE_ID="your_search_engine_id_here"
SERP_API_KEY="your_serp_api_key_here"

# Optional: Webhook Configuration
CORESIGNAL_WEBHOOK_SECRET="your_webhook_secret_here"

# Optional: Feature Flags
BUYER_GROUP_SAMPLING=true
REAL_TIME_UPDATES=true

# Optional: Processing Limits
MAX_COMPANIES_PER_REQUEST=50
MAX_EMPLOYEES_PER_COMPANY=200
MAX_BUYER_GROUP_SIZE=18
REQUEST_DELAY_MS=1000
BATCH_DELAY_MS=3000
```

## API Key Setup

### Coresignal API Key
1. Sign up at [Coresignal](https://coresignal.com)
2. Get your API key from the dashboard
3. Add it to your `.env` file as `CORESIGNAL_API_KEY`

### Anthropic API Key
1. Sign up at [Anthropic](https://console.anthropic.com)
2. Create an API key
3. Add it to your `.env` file as `ANTHROPIC_API_KEY`

### Deepgram API Key (Voice Recognition)
1. Sign up at [Deepgram](https://console.deepgram.com)
2. Get $200 free credit
3. Create an API key from the dashboard
4. Add it to your `.env` file as `NEXT_PUBLIC_DEEPGRAM_API_KEY`
5. Pricing: $0.0043/minute (pay-as-you-go)

### ElevenLabs API Key (Optional - Text-to-Speech)
1. Sign up at [ElevenLabs](https://elevenlabs.io)
2. Create an API key
3. Add it to your `.env` file as `NEXT_PUBLIC_ELEVEN_LABS_API_KEY`
4. Free tier includes 10,000 characters/month

### Perplexity API Key (AI Web Search)
1. Sign up at [Perplexity](https://www.perplexity.ai/settings/api)
2. Create an API key
3. Add it to your `.env` file as `PERPLEXITY_API_KEY`
4. Enables AI to search web for real-time information
5. Required for queries like "latest news about X"

## Webhook Setup (Optional)

For real-time updates:
1. Set up a webhook endpoint in your Coresignal dashboard
2. Use the URL: `https://yourdomain.com/api/intelligence/buyer-group-v2/webhooks/coresignal`
3. Add the webhook secret to your `.env` file as `CORESIGNAL_WEBHOOK_SECRET`

## Testing Configuration

To test your configuration:

```typescript
import { buyerGroupV2Config } from '@/platform/intelligence/buyer-group-v2/config';

// Initialize and validate
const config = buyerGroupV2Config.initialize();

// Test API keys
const health = await buyerGroupV2Config.validateApiKeys();
console.log('API Health:', health);
```
