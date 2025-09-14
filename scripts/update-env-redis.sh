#!/bin/bash

# Script to update .env file with Upstash Redis credentials
# Run this script to automatically update your .env file

echo "🔧 Updating .env file with Upstash Redis credentials..."

# Backup existing .env
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
echo "✅ Backed up existing .env file"

# Update the .env file
sed -i '' 's|UPSTASH_REDIS_REST_URL=.*|UPSTASH_REDIS_REST_URL="https://flexible-bluegill-57912.upstash.io"|' .env
sed -i '' 's|UPSTASH_REDIS_REST_TOKEN=.*|UPSTASH_REDIS_REST_TOKEN="AeI4AAIncDEyYTI4ZmNhYjNmNGI0NjljOTQzZjRjNTk2ZDQwNmRjMXAxNTc5MTI"|' .env

echo "✅ Updated .env file with Upstash Redis credentials"
echo ""
echo "🚀 Next steps:"
echo "1. Restart your development server: npm run dev"
echo "2. Check for Redis connection logs"
echo "3. Test caching performance"
echo ""
echo "Expected logs:"
echo "- 🔧 [REDIS] Using Upstash REST API (no client needed)"
echo "- 💾 [UPSTASH SET] unified-... in XXXms"
echo "- 🎯 [UPSTASH HIT] unified-... in XXXms"
