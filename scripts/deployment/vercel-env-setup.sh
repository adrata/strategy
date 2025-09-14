#!/bin/bash

# VERCEL ENVIRONMENT VARIABLE SETUP COMMANDS
# Run these commands to set production environment variables

echo "🔧 Setting up Vercel environment variables..."

# Pusher Configuration (Critical for Ross-Dan chat)
echo "Setting Pusher variables..."
vercel env add PUSHER_APP_ID production <<< "2014946"
vercel env add PUSHER_KEY production <<< "1c5e2d82c19e713c07ff"
vercel env add PUSHER_SECRET production <<< "446caa0d73c1cbff6e97"
vercel env add PUSHER_CLUSTER production <<< "us3"
vercel env add NEXT_PUBLIC_PUSHER_KEY production <<< "1c5e2d82c19e713c07ff"
vercel env add NEXT_PUBLIC_PUSHER_CLUSTER production <<< "us3"

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