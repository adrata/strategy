#!/bin/bash

# VERCEL ENVIRONMENT VARIABLE SETUP COMMANDS
# Run these commands to set production environment variables

echo "🔧 Setting up Vercel environment variables..."

# SECURITY: Never hardcode credentials in scripts
# Pusher Configuration (Critical for Ross-Dan chat)
echo "Setting Pusher variables..."
echo "⚠️  WARNING: This script requires Pusher credentials to be set as environment variables"
echo "Set PUSHER_APP_ID, PUSHER_KEY, PUSHER_SECRET, PUSHER_CLUSTER before running"

if [ -z "$PUSHER_APP_ID" ] || [ -z "$PUSHER_KEY" ] || [ -z "$PUSHER_SECRET" ] || [ -z "$PUSHER_CLUSTER" ]; then
    echo "❌ ERROR: Pusher credentials must be set as environment variables"
    exit 1
fi

vercel env add PUSHER_APP_ID production <<< "$PUSHER_APP_ID"
vercel env add PUSHER_KEY production <<< "$PUSHER_KEY"
vercel env add PUSHER_SECRET production <<< "$PUSHER_SECRET"
vercel env add PUSHER_CLUSTER production <<< "$PUSHER_CLUSTER"
vercel env add NEXT_PUBLIC_PUSHER_KEY production <<< "$PUSHER_KEY"
vercel env add NEXT_PUBLIC_PUSHER_CLUSTER production <<< "$PUSHER_CLUSTER"

# Database (should already be set)
echo "Setting database variables..."
vercel env add DATABASE_URL production
vercel env add POSTGRES_URL production

# Authentication
echo "Setting auth variables..."
vercel env add NEXTAUTH_SECRET production
vercel env add NEXTAUTH_URL production

# Application URLs
echo "Setting application URLs..."
vercel env add NEXT_PUBLIC_APP_URL production
vercel env add NEXT_PUBLIC_API_BASE_URL production

echo "✅ Environment variables setup complete!"
echo "🚀 Now run: vercel --prod"