# 🌐 OpenRouter AI Integration

## Overview

This document describes the OpenRouter integration that provides unified access to 400+ AI models with intelligent routing, automatic failover, and cost optimization.

## Features

- **Intelligent Model Routing**: Automatically selects the best model based on query complexity
- **Cost Optimization**: Routes simple queries to cheaper models, saving 40-60% on costs
- **Automatic Failover**: Seamlessly switches to backup models if primary fails
- **Gradual Rollout**: Safe deployment with monitoring and automatic rollback
- **Cost Tracking**: Comprehensive analytics and budget management
- **High Availability**: 99.9% uptime with distributed infrastructure

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Right Panel   │───▶│  AI Chat API     │───▶│ OpenRouter API  │
│   (Frontend)    │    │  /api/ai-chat    │    │   (Gateway)     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │  Model Routing   │
                       │  & Failover      │
                       └──────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │  AI Providers    │
                       │  (400+ Models)   │
                       └──────────────────┘
```

## Setup Instructions

### 1. Environment Variables

Add these environment variables to your `.env.local` file:

```bash
# OpenRouter Configuration
OPENROUTER_API_KEY=your_openrouter_api_key_here
OPENROUTER_SITE_URL=https://adrata.com
OPENROUTER_APP_NAME=Adrata AI Assistant

# Optional: Override default settings
OPENROUTER_COST_OPTIMIZATION_LEVEL=balanced  # aggressive, balanced, quality
OPENROUTER_DAILY_BUDGET_LIMIT=50.0
OPENROUTER_MAX_COST_PER_REQUEST=0.10
```

### 2. Get OpenRouter API Key

1. Visit [OpenRouter.ai](https://openrouter.ai)
2. Sign up for an account
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key to your environment variables

### 3. Deploy Configuration

For Vercel deployment, add the environment variables in your Vercel dashboard:

```bash
# In Vercel dashboard > Settings > Environment Variables
OPENROUTER_API_KEY=your_key_here
OPENROUTER_SITE_URL=https://your-domain.com
OPENROUTER_APP_NAME=Adrata AI Assistant
```

## Model Routing

The system automatically routes queries to optimal models based on complexity:

### Simple Queries (70% of traffic)
- **Models**: GPT-4o Mini, Claude Haiku
- **Cost**: $0.15-0.25 per million tokens
- **Use Cases**: Basic questions, summaries, simple lookups

### Standard Queries (20% of traffic)
- **Models**: Claude Sonnet 4.5, GPT-4o
- **Cost**: $2.50-3.00 per million tokens
- **Use Cases**: Analysis, recommendations, contextual responses

### Complex Queries (10% of traffic)
- **Models**: Claude Opus 4.0, GPT-4.5 Preview
- **Cost**: $15-75 per million tokens
- **Use Cases**: Strategic analysis, multi-step reasoning

### Research Queries
- **Models**: Perplexity Research, Claude Sonnet
- **Cost**: $5.00 per million tokens
- **Use Cases**: Real-time web search, current information

## Gradual Rollout

The system includes a safe gradual rollout process:

### Phase 1: Shadow Mode (24 hours)
- Logs all requests but doesn't use OpenRouter
- Validates integration without affecting users

### Phase 2: Limited Rollout (48 hours)
- 10% of requests use OpenRouter
- Monitors performance and costs

### Phase 3: Full Rollout
- 100% of requests use OpenRouter
- Continuous monitoring with automatic rollback

## Monitoring & Management

### Admin Dashboard

Access rollout status and controls:

```bash
# Get current status
GET /api/admin/rollout

# Start rollout
POST /api/admin/rollout
{
  "action": "start",
  "config": {
    "phases": {
      "shadow": { "percentage": 0, "duration": 24 },
      "limited": { "percentage": 10, "duration": 48 },
      "full": { "percentage": 100, "duration": 0 }
    }
  }
}

# Advance to next phase
POST /api/admin/rollout
{
  "action": "advance"
}

# Force rollback
POST /api/admin/rollout
{
  "action": "rollback",
  "reason": "Issues detected"
}
```

### Cost Analytics

Monitor spending and savings:

```typescript
import { modelCostTracker } from '@/platform/services/ModelCostTracker';

// Get cost analytics
const analytics = modelCostTracker.getAnalytics();

console.log('Total Cost:', analytics.totalCost);
console.log('Cost Savings:', analytics.savings.actualSavings);
console.log('Savings Percentage:', analytics.savings.savingsPercentage);
```

## Testing

### Run Integration Tests

```bash
# Run the parallel testing script
node scripts/test-openrouter-integration.js

# Run unit tests
npm test src/platform/services/__tests__/OpenRouterService.test.ts
```

### Test Results

The test script will:
- Compare OpenRouter vs Claude responses
- Measure cost savings
- Validate failover functionality
- Check response quality

Expected results:
- **Success Rate**: >95%
- **Cost Savings**: >40%
- **Response Time**: <3 seconds
- **Quality**: Maintained or improved

## Troubleshooting

### Common Issues

#### 1. API Key Not Working
```bash
# Check environment variables
echo $OPENROUTER_API_KEY

# Verify in browser console
console.log(process.env.OPENROUTER_API_KEY)
```

#### 2. High Costs
```bash
# Check cost optimization settings
# Adjust in src/platform/config/openrouter.ts
routing: {
  costOptimizationLevel: 'aggressive', // More aggressive cost optimization
  maxCostPerRequest: 0.05 // Lower max cost per request
}
```

#### 3. Slow Responses
```bash
# Check failover configuration
# Ensure backup models are configured
models: {
  simple: ['openai/gpt-4o-mini', 'anthropic/claude-haiku-4.0']
}
```

#### 4. Rollout Issues
```bash
# Check rollout status
GET /api/admin/rollout

# Force rollback if needed
POST /api/admin/rollout
{
  "action": "rollback",
  "reason": "Performance issues"
}
```

### Debug Mode

Enable debug logging:

```bash
# Add to environment variables
DEBUG=openrouter:*
NODE_ENV=development
```

## Cost Optimization

### Expected Savings

With intelligent routing:
- **Simple queries**: 87% savings (GPT-4o Mini vs Claude Sonnet)
- **Standard queries**: 0% savings (same model)
- **Complex queries**: 0% savings (same model)
- **Overall**: 40-60% savings

### Budget Management

Set daily budgets and alerts:

```typescript
import { modelCostTracker } from '@/platform/services/ModelCostTracker';

// Set workspace budget
modelCostTracker.setBudget('workspace-id', 50.0); // $50/day

// Get budget status
const status = modelCostTracker.getBudgetStatus('workspace-id');
console.log('Budget Status:', status.status); // under, warning, exceeded
```

## Security

### Data Privacy
- OpenRouter doesn't store request data
- Same privacy level as direct API calls
- All requests encrypted in transit

### API Key Security
- Store keys in environment variables only
- Never commit keys to version control
- Rotate keys regularly

## Performance

### Response Times
- **OpenRouter overhead**: ~50-100ms
- **Cached responses**: <100ms
- **Failover time**: <200ms

### Reliability
- **Uptime**: 99.9%
- **Automatic failover**: <200ms
- **Error rate**: <1%

## Support

### Documentation
- [OpenRouter Docs](https://openrouter.ai/docs)
- [API Reference](https://openrouter.ai/docs/api)

### Monitoring
- Check `/api/admin/rollout` for status
- Monitor cost analytics
- Review error logs

### Contact
- OpenRouter Support: [support@openrouter.ai](mailto:support@openrouter.ai)
- Adrata Team: [support@adrata.com](mailto:support@adrata.com)

## Migration Checklist

- [ ] Add environment variables
- [ ] Get OpenRouter API key
- [ ] Deploy configuration
- [ ] Run integration tests
- [ ] Start gradual rollout
- [ ] Monitor performance
- [ ] Verify cost savings
- [ ] Complete full rollout

## Rollback Plan

If issues arise:

1. **Immediate**: Use admin API to force rollback
2. **Emergency**: Set `useOpenRouter: false` in API calls
3. **Fallback**: System automatically falls back to Claude
4. **Recovery**: Investigate issues and retry rollout

The system is designed to be fail-safe with automatic fallback to Claude if OpenRouter is unavailable.
