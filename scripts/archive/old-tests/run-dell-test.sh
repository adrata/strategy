#!/bin/bash

# 🎯 QUICK DELL BUYER GROUP TEST SCRIPT
# Multiple test modes for different scenarios

set -e

echo "🎯 DELL BUYER GROUP INTELLIGENCE TEST"
echo "======================================"

# Source environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Validate API key
if [ -z "$CORESIGNAL_API_KEY" ]; then
    echo "❌ CORESIGNAL_API_KEY not found in environment"
    echo "Please ensure your .env file contains the CoreSignal API key"
    exit 1
fi

echo "✅ CoreSignal API key configured"
echo ""

# Parse command line arguments
MODE=${1:-"dry-run"}
PROFILE=${2:-"dell-na-enterprise-250k"}
COLLECTS=${3:-100}

case $MODE in
    "dry-run")
        echo "🧪 DRY RUN MODE - Cost estimation only"
        npx tsx scripts/run-dell-buyer-group-comprehensive.ts \
            --company="Dell Technologies" \
            --profile="$PROFILE" \
            --max-collects=$COLLECTS \
            --mode=balanced \
            --dry-run
        ;;
    
    "conservative")
        echo "🔒 CONSERVATIVE MODE - Minimal credits (~$20-40)"
        npx tsx scripts/run-dell-buyer-group-comprehensive.ts \
            --company="Dell Technologies" \
            --profile="$PROFILE" \
            --max-collects=50 \
            --mode=conservative
        ;;
    
    "balanced")
        echo "⚖️ BALANCED MODE - Standard analysis (~$50-100)"
        npx tsx scripts/run-dell-buyer-group-comprehensive.ts \
            --company="Dell Technologies" \
            --profile="$PROFILE" \
            --max-collects=$COLLECTS \
            --mode=balanced \
            --enable-llm
        ;;
    
    "aggressive")
        echo "🚀 AGGRESSIVE MODE - Comprehensive analysis (~$100-200)"
        npx tsx scripts/run-dell-buyer-group-comprehensive.ts \
            --company="Dell Technologies" \
            --profile="$PROFILE" \
            --max-collects=200 \
            --mode=aggressive \
            --enable-llm
        ;;
    
    "live")
        echo "🔥 LIVE MODE - Full production analysis"
        echo "⚠️  This will consume real CoreSignal credits!"
        read -p "Continue? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            npx tsx scripts/run-dell-buyer-group-comprehensive.ts \
                --company="Dell Technologies" \
                --profile="$PROFILE" \
                --max-collects=$COLLECTS \
                --mode=balanced \
                --enable-llm
        else
            echo "Cancelled."
            exit 0
        fi
        ;;
    
    *)
        echo "Usage: $0 [mode] [profile] [max_collects]"
        echo ""
        echo "Modes:"
        echo "  dry-run      - Cost estimation only (FREE)"
        echo "  conservative - Minimal credits, ~50 profiles (~$20-40)"
        echo "  balanced     - Standard analysis, ~100 profiles (~$50-100)"
        echo "  aggressive   - Comprehensive, ~200 profiles (~$100-200)"
        echo "  live         - Production analysis with confirmation"
        echo ""
        echo "Profiles:"
        echo "  dell-na-enterprise-250k  - Dell North America Enterprise (recommended)"
        echo "  buyer-group-intelligence - Generic B2B profile"
        echo ""
        echo "Examples:"
        echo "  $0 dry-run                           # Free cost estimation"
        echo "  $0 conservative                      # Minimal cost test"
        echo "  $0 balanced dell-na-enterprise-250k # Standard Dell analysis"
        echo "  $0 live                             # Full production run"
        exit 1
        ;;
esac

echo ""
echo "✅ Dell analysis complete!"
echo "📁 Check data/production/dell-analysis/ for all raw data"
echo "📊 Summary report available in the latest session folder"
