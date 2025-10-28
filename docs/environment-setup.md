# Environment Setup for Buyer Group V2

## Required Environment Variables

Add these environment variables to your `.env` file:

```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/adrata"

# Buyer Group V2 API Keys (Required)
CORESIGNAL_API_KEY="your_coresignal_api_key_here"
ANTHROPIC_API_KEY="your_anthropic_api_key_here"

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
