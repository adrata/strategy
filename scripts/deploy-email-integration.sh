#!/bin/bash

# 🚀 Deploy Grand Central Email Integration to Production
# This script deploys the email integration with all required configurations

echo "🚀 Deploying Grand Central Email Integration to Production..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Please install it first:"
    echo "   npm i -g vercel"
    exit 1
fi

# Check if user is logged in to Vercel
if ! vercel whoami &> /dev/null; then
    echo "❌ Not logged in to Vercel. Please run: vercel login"
    exit 1
fi

echo "✅ Prerequisites check passed"

# Step 1: Validate environment variables
echo ""
echo "🔍 Step 1: Validating environment variables..."
node scripts/validate-environment.js

if [ $? -ne 0 ]; then
    echo "❌ Environment validation failed. Please fix missing variables first."
    echo ""
    echo "Required environment variables:"
    echo "  NANGO_SECRET_KEY"
    echo "  NANGO_PUBLIC_KEY"
    echo "  NANGO_WEBHOOK_SECRET"
    echo "  MICROSOFT_CLIENT_SECRET"
    echo "  GOOGLE_CLIENT_SECRET"
    echo "  OAUTH_REDIRECT_BASE_URL"
    echo ""
    echo "To add variables to Vercel:"
    echo "  vercel env add NANGO_SECRET_KEY"
    echo "  vercel env add NANGO_PUBLIC_KEY"
    echo "  # ... etc"
    exit 1
fi

echo "✅ Environment validation passed"

# Step 2: Run production tests
echo ""
echo "🧪 Step 2: Running production tests..."
node scripts/test-email-integration-production.js

if [ $? -ne 0 ]; then
    echo "❌ Production tests failed. Please fix issues before deploying."
    exit 1
fi

echo "✅ Production tests passed"

# Step 3: Build the application
echo ""
echo "🏗️ Step 3: Building application..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

echo "✅ Build successful"

# Step 4: Deploy to Vercel
echo ""
echo "🚀 Step 4: Deploying to Vercel..."
vercel --prod

if [ $? -ne 0 ]; then
    echo "❌ Deployment failed"
    exit 1
fi

echo "✅ Deployment successful"

# Step 5: Post-deployment verification
echo ""
echo "🔍 Step 5: Post-deployment verification..."

# Get the deployment URL
DEPLOYMENT_URL=$(vercel ls --prod | grep -o 'https://[^[:space:]]*' | head -1)

if [ -z "$DEPLOYMENT_URL" ]; then
    echo "⚠️ Could not determine deployment URL"
    DEPLOYMENT_URL="https://action.adrata.com"
fi

echo "🌐 Deployment URL: $DEPLOYMENT_URL"

# Test health check
echo "Testing health check endpoint..."
HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$DEPLOYMENT_URL/api/health/email-sync")

if [ "$HEALTH_RESPONSE" = "200" ]; then
    echo "✅ Health check passed"
else
    echo "⚠️ Health check returned status: $HEALTH_RESPONSE"
fi

# Test webhook endpoint
echo "Testing webhook endpoint..."
WEBHOOK_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$DEPLOYMENT_URL/api/webhooks/nango/email")

if [ "$WEBHOOK_RESPONSE" = "200" ]; then
    echo "✅ Webhook endpoint accessible"
else
    echo "⚠️ Webhook endpoint returned status: $WEBHOOK_RESPONSE"
fi

# Step 6: Configuration reminders
echo ""
echo "📋 Step 6: Post-deployment configuration required:"
echo "=================================================="
echo ""
echo "1. 🔗 Configure Nango integrations:"
echo "   - Log into your Nango dashboard"
echo "   - Configure Microsoft Outlook integration"
echo "   - Configure Google Workspace integration"
echo "   - Set webhook URL: $DEPLOYMENT_URL/api/webhooks/nango/email"
echo ""
echo "2. 🔐 Configure OAuth providers:"
echo "   - Azure AD: Add redirect URI: $DEPLOYMENT_URL/outlook/auth_callback/"
echo "   - Google Cloud: Add redirect URI: $DEPLOYMENT_URL/api/auth/oauth/callback"
echo ""
echo "3. 📧 Test email integration:"
echo "   - Connect a test email account in Grand Central"
echo "   - Verify email sync works"
echo "   - Check email linking to people/companies"
echo ""
echo "4. 📊 Monitor deployment:"
echo "   - Health check: $DEPLOYMENT_URL/api/health/email-sync"
echo "   - Check Vercel function logs"
echo "   - Monitor email sync statistics"
echo ""

# Step 7: Success message
echo "🎉 Grand Central Email Integration deployed successfully!"
echo ""
echo "📈 Next steps:"
echo "  1. Complete the configuration steps above"
echo "  2. Test with real user accounts"
echo "  3. Monitor performance and errors"
echo "  4. Gradually roll out to all users"
echo ""
echo "🔗 Useful URLs:"
echo "  - Application: $DEPLOYMENT_URL"
echo "  - Health Check: $DEPLOYMENT_URL/api/health/email-sync"
echo "  - Grand Central: $DEPLOYMENT_URL/[workspace]/grand-central"
echo ""
echo "📚 Documentation:"
echo "  - Production Audit: docs/grand-central-production-audit.md"
echo "  - Email Integration: docs/email-integration-architecture.md"
echo ""
echo "✅ Deployment complete!"
