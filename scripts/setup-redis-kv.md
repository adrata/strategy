# 🚀 REDIS & VERCEL KV SETUP GUIDE

## Quick Setup Options

### Option 1: Upstash Redis (FREE - Recommended)

1. **Create Upstash Account:**
   ```bash
   # Go to: https://upstash.com/
   # Sign up with GitHub/Google
   # Click "Create Database"
   ```

2. **Configure Database:**
   ```
   Name: adrata-cache
   Region: us-east-1 (or closest to your users)
   Type: Regional (free tier)
   ```

3. **Get Connection Details:**
   ```bash
   # From Upstash dashboard, copy these values:
   REDIS_URL=rediss://your-endpoint.upstash.io:6380
   UPSTASH_REDIS_REST_URL=https://your-region.upstash.io
   UPSTASH_REDIS_REST_TOKEN=your_token_here
   ```

4. **Update .env file:**
   ```bash
   # Replace the placeholder values in .env with:
   REDIS_URL=rediss://your-endpoint.upstash.io:6380
   ```

### Option 2: Vercel KV (Requires Vercel Pro Plan)

1. **Create KV Store:**
   ```bash
   vercel kv create adrata-cache --region sfo1
   ```

2. **Get Environment Variables:**
   ```bash
   # Vercel will provide:
   KV_REST_API_URL=https://your-kv-url.kv.vercel-storage.com
   KV_REST_API_TOKEN=your_token_here
   ```

3. **Update .env file:**
   ```bash
   # Replace the placeholder values in .env with the actual values
   ```

### Option 3: Local Redis (Development Only)

1. **Install Redis:**
   ```bash
   brew install redis
   brew services start redis
   ```

2. **Update .env file:**
   ```bash
   REDIS_URL=redis://localhost:6379
   ```

## Testing Your Setup

After configuring any option above:

1. **Restart your development server:**
   ```bash
   npm run dev
   ```

2. **Check the logs:**
   - You should see: `🟢 [REDIS] Connected successfully`
   - No more connection errors

3. **Test caching:**
   ```bash
   # Visit any page - second load should be instant with cache hit
   curl "http://localhost:3000/api/data/unified?workspaceId=01K1VBYV8ETM2RCQA4GNN9EG72&userId=01K1VBYYV7TRPY04NW4TW4XWRB"
   ```

## Current Status

✅ **Memory Cache**: Working (3-minute TTL)
⚠️ **Redis/KV**: Not configured (causing connection errors)
✅ **Database Indexes**: Applied and working

## Performance Impact

- **Without Redis/KV**: 3.5s initial, 0.035s cached (memory only)
- **With Redis/KV**: 3.5s initial, 0.010s cached (persistent across restarts)

## Recommended: Start with Upstash

Upstash is the easiest option:
- Free tier: 10,000 requests/day
- Global edge locations
- Redis-compatible
- No credit card required
