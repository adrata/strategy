#!/bin/bash

# 🚀 ADRATA VERCEL ENVIRONMENT SETUP SCRIPT
# Pushes all necessary API keys and environment variables to Vercel production

echo "🚀 Setting up Adrata environment variables in Vercel..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to add environment variable to Vercel
add_env_var() {
    local key=$1
    local value=$2
    local description=$3
    
    echo -e "${BLUE}📝 Adding ${key}...${NC}"
    
    # Use printf to handle the input automatically
    printf "%s\n%s\n%s\n" "$value" "y" "y" | vercel env add "$key" --scope=production --force 2>/dev/null
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ ${key} added successfully${NC}"
    else
        echo -e "${RED}❌ Failed to add ${key}${NC}"
    fi
}

echo -e "${YELLOW}🎤 VOICE INTEGRATION SETUP${NC}"
echo "=================================="

# Eleven Labs Voice API
add_env_var "NEXT_PUBLIC_ELEVEN_LABS_API_KEY" "CREDENTIAL_REMOVED_FOR_SECURITY" "Eleven Labs TTS API for French/Irish voices"

echo ""
echo -e "${YELLOW}🔑 CORE API KEYS${NC}"
echo "=================================="

# OpenAI API (if not already set)
if [ ! -z "$OPENAI_API_KEY" ]; then
    add_env_var "OPENAI_API_KEY" "$OPENAI_API_KEY" "OpenAI API for chat functionality"
else
    echo -e "${YELLOW}⚠️ OPENAI_API_KEY not found in local environment${NC}"
fi

# Database URL (if not already set)
if [ ! -z "$DATABASE_URL" ]; then
    add_env_var "DATABASE_URL" "$DATABASE_URL" "PostgreSQL database connection"
else
    echo -e "${YELLOW}⚠️ DATABASE_URL not found in local environment${NC}"
fi

# NextAuth Secret (if not already set)
if [ ! -z "$NEXTAUTH_SECRET" ]; then
    add_env_var "NEXTAUTH_SECRET" "$NEXTAUTH_SECRET" "NextAuth.js secret for authentication"
else
    echo -e "${YELLOW}⚠️ NEXTAUTH_SECRET not found in local environment${NC}"
fi

echo ""
echo -e "${YELLOW}📱 OPTIONAL INTEGRATIONS${NC}"
echo "=================================="

# Twilio (if available)
if [ ! -z "$TWILIO_ACCOUNT_SID" ]; then
    add_env_var "TWILIO_ACCOUNT_SID" "$TWILIO_ACCOUNT_SID" "Twilio account SID for calling features"
fi

if [ ! -z "$TWILIO_AUTH_TOKEN" ]; then
    add_env_var "TWILIO_AUTH_TOKEN" "$TWILIO_AUTH_TOKEN" "Twilio auth token for calling features"
fi

# CoreSignal (if available)
if [ ! -z "$CORESIGNAL_API_KEY" ]; then
    add_env_var "CORESIGNAL_API_KEY" "$CORESIGNAL_API_KEY" "CoreSignal API for data enrichment"
fi

# Resend (if available)
if [ ! -z "$RESEND_API_KEY" ]; then
    add_env_var "RESEND_API_KEY" "$RESEND_API_KEY" "Resend API for email functionality"
fi

echo ""
echo -e "${GREEN}🎉 DEPLOYMENT COMPLETE!${NC}"
echo "=================================="
echo -e "${GREEN}✅ Voice integration ready for production${NC}"
echo -e "${GREEN}✅ French voice (default): FpvROcY4IGWevepmBWO2${NC}"
echo -e "${GREEN}✅ Irish voice (alternative): wo6udizrrtpIxWGp2qJk${NC}"
echo ""
echo -e "${BLUE}🚀 Next steps:${NC}"
echo "1. Deploy to production: ${YELLOW}vercel --prod${NC}"
echo "2. Test voice functionality on live site"
echo "3. Users can now use voice commands like 'show me my calendar'"
echo ""
echo -e "${BLUE}📋 Voice Commands Available:${NC}"
echo "• 'Show me my calendar' → Calendar view"
echo "• 'Show me leads' → Leads section"
echo "• 'Show me prospects' → Speedrun prospects"
echo "• 'Show me [person name]' → Person profile"
echo ""
echo -e "${GREEN}Voice integration deployment complete! 🎤✨${NC}"
