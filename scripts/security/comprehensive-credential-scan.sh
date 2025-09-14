#!/bin/bash

# 🔍 COMPREHENSIVE CREDENTIAL SCAN SCRIPT
# Scan for ALL sensitive environment variables in git history

echo "🔍 COMPREHENSIVE CREDENTIAL SECURITY SCAN"
echo "========================================="
echo ""

# Define all sensitive variables to check
CREDENTIALS=(
    "DATABASE_URL"
    "NEXTAUTH_URL"
    "NEXTAUTH_SECRET"
    "JWT_SECRET"
    "NEXT_PUBLIC_WORKSPACE_ID"
    "DEFAULT_WORKSPACE_ID" 
    "DEFAULT_USER_ID"
    "PUSHER_APP_ID"
    "PUSHER_KEY"
    "PUSHER_SECRET"
    "PUSHER_CLUSTER"
    "NEXT_PUBLIC_PUSHER_KEY"
    "NEXT_PUBLIC_PUSHER_CLUSTER"
    "TWILIO_ACCOUNT_SID"
    "TWILIO_AUTH_TOKEN"
    "TWILIO_API_KEY"
    "TWILIO_API_SECRET"
    "TWILIO_PHONE_NUMBER"
    "SMTP_HOST"
    "SMTP_PORT"
    "SMTP_USER"
    "SMTP_PASS"
    "ZOHO_CLIENT_ID"
    "ZOHO_CLIENT_SECRET"
    "ZOHO_ORG_ID"
    "PERPLEXITY_API_KEY"
    "CORESIGNAL_API_KEY"
    "ZEROBOUNCE_API_KEY"
    "PROSPEO_API_KEY"
    "LUSHA_API_KEY"
    "MYEMAILVERIFIER_API_KEY"
    "DROPCONTACT_API_KEY"
    "OPENAI_API_KEY"
    "NEXT_PUBLIC_ELEVEN_LABS_API_KEY"
    "AWS_ACCESS_KEY_ID"
    "AWS_SECRET_ACCESS_KEY"
    "AWS_DEFAULT_REGION"
    "UPSTASH_REDIS_REST_URL"
    "UPSTASH_REDIS_REST_TOKEN"
    "KV_REST_API_URL"
    "KV_REST_API_TOKEN"
    "REDIS_URL"
)

REPO_PATH=$(pwd)
echo "📁 Scanning repository: $REPO_PATH"
echo ""

TOTAL_FOUND=0
PROBLEMATIC_VARS=()

for var in "${CREDENTIALS[@]}"; do
    echo -n "🔍 Checking $var... "
    
    # Count occurrences in git history (excluding safe placeholder text)
    COUNT=$(git log --all -p | grep -E "^[\+\-].*$var=" | grep -v "CREDENTIAL_REMOVED_FOR_SECURITY" | grep -v "your-.*-here" | grep -v "example" | wc -l | tr -d ' ')
    
    if [ "$COUNT" -gt 0 ]; then
        echo "❌ FOUND $COUNT instances"
        TOTAL_FOUND=$((TOTAL_FOUND + COUNT))
        PROBLEMATIC_VARS+=("$var:$COUNT")
    else
        echo "✅ Clean"
    fi
done

echo ""
echo "📊 SCAN RESULTS:"
echo "==============="
echo "Total problematic instances found: $TOTAL_FOUND"

if [ "$TOTAL_FOUND" -gt 0 ]; then
    echo ""
    echo "🚨 PROBLEMATIC VARIABLES:"
    for item in "${PROBLEMATIC_VARS[@]}"; do
        echo "   - ${item/:/ (} instances)"
    done
    echo ""
    echo "⚠️  RECOMMENDATION: Clean these variables from git history"
else
    echo "✅ ALL CLEAR: No problematic credentials found in git history"
fi

echo ""
echo "🔐 Scan completed for: $REPO_PATH"
