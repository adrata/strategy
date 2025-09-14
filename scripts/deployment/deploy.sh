#!/bin/bash

# Adrata Deployment Pipeline
# Use this script to deploy through your environments safely

echo "🚀 Adrata Deployment Pipeline"
echo "Current branch: $(git branch --show-current)"
echo "Latest commit: $(git log -1 --oneline)"
echo ""

# Check if there are uncommitted changes
if ! git diff-index --quiet HEAD --; then
    echo "❌ You have uncommitted changes. Please commit first:"
    git status --short
    exit 1
fi

echo "📋 Available deployment options:"
echo "1. Development (testing)"
echo "2. Staging (pre-production)" 
echo "3. Production (live)"
echo "4. Demo (client presentations)"
echo "5. Sandbox (experiments)"
echo "6. Full Pipeline (dev → staging → production)"
echo ""

read -p "Choose deployment target (1-6): " choice

case $choice in
    1)
        echo "📦 Deploying to DEVELOPMENT..."
        git push development main
        echo "✅ Deployed to: https://adrata-development-adrata.vercel.app"
        ;;
    2)
        echo "🎯 Deploying to STAGING..."
        git push staging main
        echo "✅ Deployed to: https://adrata-staging-adrata.vercel.app"
        ;;
    3)
        echo "🔥 Deploying to PRODUCTION..."
        read -p "⚠️  Are you sure you want to deploy to PRODUCTION? (y/n): " confirm
        if [[ $confirm == "y" ]]; then
            git push origin main
            echo "✅ Deployed to: https://adrata-production-adrata.vercel.app"
        else
            echo "❌ Production deployment cancelled"
        fi
        ;;
    4)
        echo "🎭 Deploying to DEMO..."
        git push demo main
        echo "✅ Deployed to: https://adrata-demo-adrata.vercel.app"
        ;;
    5)
        echo "🧪 Deploying to SANDBOX..."
        git push sandbox main:sandbox
        git push sandbox main
        echo "✅ Deployed to: https://sandbox-n9jn4m9e6-adrata.vercel.app"
        ;;
    6)
        echo "🌊 Starting FULL PIPELINE deployment..."
        echo ""
        
        # Development
        echo "📦 Step 1: Deploying to DEVELOPMENT..."
        git push development main
        echo "✅ Development deployed"
        echo ""
        
        read -p "Development looks good? Continue to STAGING? (y/n): " staging_ok
        if [[ $staging_ok != "y" ]]; then
            echo "❌ Pipeline stopped at development"
            exit 1
        fi
        
        # Staging
        echo "🎯 Step 2: Deploying to STAGING..."
        git push staging main
        echo "✅ Staging deployed"
        echo ""
        
        read -p "Staging approved? Continue to PRODUCTION? (y/n): " prod_ok
        if [[ $prod_ok != "y" ]]; then
            echo "❌ Pipeline stopped at staging"
            exit 1
        fi
        
        # Production
        echo "🔥 Step 3: Deploying to PRODUCTION..."
        git push origin main
        echo "✅ Production deployed"
        
        # Demo (automatic)
        echo "🎭 Step 4: Updating DEMO..."
        git push demo main
        echo "✅ Demo updated"
        
        echo ""
        echo "🎉 FULL PIPELINE COMPLETE!"
        echo "📊 All environments updated:"
        echo "  - Development: https://adrata-development-adrata.vercel.app"
echo "  - Staging: https://adrata-staging-adrata.vercel.app"  
        echo "  - Production: https://adrata-production-adrata.vercel.app"
        echo "  - Demo: https://adrata-demo-adrata.vercel.app"
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "🎯 Deployment complete!" 