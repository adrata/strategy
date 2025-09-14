#!/bin/bash

# 🔧 ADD ENRICHMENT API KEYS TO VERCEL
# This script adds the missing API keys needed for our enrichment pipeline

echo "🔧 Adding enrichment API keys to Vercel..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

# Function to add environment variable to Vercel
add_vercel_env() {
    local key=$1
    local value=$2
    local env=$3
    
    echo "⏳ Adding $key to $env environment..."
    
    # Try to add the environment variable
    if echo "$value" | vercel env add "$key" "$env" 2>/dev/null; then
        echo "✅ Added $key to $env"
    else
        echo "⚠️  $key might already exist in $env, trying to update..."
        # Remove and re-add to update
        vercel env rm "$key" "$env" --yes 2>/dev/null || true
        if echo "$value" | vercel env add "$key" "$env" 2>/dev/null; then
            echo "✅ Updated $key in $env"
        else
            echo "❌ Failed to add/update $key in $env"
        fi
    fi
}

# API Keys to add (you'll need to replace these with actual values)
echo "📋 API Keys needed for enrichment pipeline:"
echo "   - LUSHA_API_KEY (for phone number lookup)"
echo "   - PROSPEO_API_KEY (for email finding and verification)"  
echo "   - ZEROBOUNCE_API_KEY (for email verification)"
echo "   - PERPLEXITY_API_KEY (for AI validation)"
echo ""

# Check if API keys are provided as environment variables
if [ -z "$LUSHA_API_KEY" ] && [ -z "$PROSPEO_API_KEY" ] && [ -z "$ZEROBOUNCE_API_KEY" ] && [ -z "$PERPLEXITY_API_KEY" ]; then
    echo "❌ No API keys found in environment variables."
    echo "Please set the API keys as environment variables before running this script:"
    echo ""
    echo "export LUSHA_API_KEY='your_lusha_api_key_here'"
    echo "export PROSPEO_API_KEY='your_prospeo_api_key_here'"
    echo "export ZEROBOUNCE_API_KEY='your_zerobounce_api_key_here'"
    echo "export PERPLEXITY_API_KEY='your_perplexity_api_key_here'"
    echo ""
    echo "Then run this script again."
    exit 1
fi

# Add API keys to all environments (production, preview, development)
environments=("production" "preview" "development")

for env in "${environments[@]}"; do
    echo ""
    echo "🌍 Setting up $env environment..."
    
    if [ -n "$LUSHA_API_KEY" ]; then
        add_vercel_env "LUSHA_API_KEY" "$LUSHA_API_KEY" "$env"
    fi
    
    if [ -n "$PROSPEO_API_KEY" ]; then
        add_vercel_env "PROSPEO_API_KEY" "$PROSPEO_API_KEY" "$env"
    fi
    
    if [ -n "$ZEROBOUNCE_API_KEY" ]; then
        add_vercel_env "ZEROBOUNCE_API_KEY" "$ZEROBOUNCE_API_KEY" "$env"
    fi
    
    if [ -n "$PERPLEXITY_API_KEY" ]; then
        add_vercel_env "PERPLEXITY_API_KEY" "$PERPLEXITY_API_KEY" "$env"
    fi
done

echo ""
echo "✅ Enrichment API keys setup complete!"
echo ""
echo "📊 Summary of what was added:"
echo "   - LUSHA_API_KEY: ${LUSHA_API_KEY:+SET}"
echo "   - PROSPEO_API_KEY: ${PROSPEO_API_KEY:+SET}"
echo "   - ZEROBOUNCE_API_KEY: ${ZEROBOUNCE_API_KEY:+SET}"
echo "   - PERPLEXITY_API_KEY: ${PERPLEXITY_API_KEY:+SET}"
echo ""
echo "🚀 Your enrichment pipeline is now ready to use these APIs!"
echo "💡 Note: TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN are already configured in Vercel"
