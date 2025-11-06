#!/bin/bash

# Setup Gmail and Google Calendar Nango Integration
# This script helps set up environment variables and verify configuration

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}Gmail & Google Calendar Nango Setup${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo -e "${YELLOW}⚠️  .env.local not found. Creating from .env.example if it exists...${NC}"
    if [ -f .env.example ]; then
        cp .env.example .env.local
        echo -e "${GREEN}✓ Created .env.local${NC}"
    else
        echo -e "${YELLOW}⚠️  .env.example not found. You'll need to create .env.local manually.${NC}"
    fi
fi

echo ""
echo -e "${BLUE}Step 1: Environment Variables Setup${NC}"
echo ""

# Check current values
echo "Current environment variables:"
if grep -q "NANGO_GMAIL_INTEGRATION_ID" .env.local 2>/dev/null; then
    CURRENT_GMAIL=$(grep "NANGO_GMAIL_INTEGRATION_ID" .env.local | cut -d '=' -f2)
    echo -e "  ${CYAN}NANGO_GMAIL_INTEGRATION_ID${NC} = ${CURRENT_GMAIL}"
else
    echo -e "  ${YELLOW}NANGO_GMAIL_INTEGRATION_ID${NC} = (not set)"
fi

if grep -q "NANGO_GOOGLE_CALENDAR_INTEGRATION_ID" .env.local 2>/dev/null; then
    CURRENT_CALENDAR=$(grep "NANGO_GOOGLE_CALENDAR_INTEGRATION_ID" .env.local | cut -d '=' -f2)
    echo -e "  ${CYAN}NANGO_GOOGLE_CALENDAR_INTEGRATION_ID${NC} = ${CURRENT_CALENDAR}"
else
    echo -e "  ${YELLOW}NANGO_GOOGLE_CALENDAR_INTEGRATION_ID${NC} = (not set)"
fi

if grep -q "NANGO_SECRET_KEY" .env.local 2>/dev/null; then
    SECRET_KEY=$(grep "NANGO_SECRET_KEY" .env.local | cut -d '=' -f2)
    if [ -n "$SECRET_KEY" ]; then
        echo -e "  ${GREEN}NANGO_SECRET_KEY${NC} = ${SECRET_KEY:0:12}... (set)"
    else
        echo -e "  ${YELLOW}NANGO_SECRET_KEY${NC} = (empty)"
    fi
else
    echo -e "  ${RED}NANGO_SECRET_KEY${NC} = (not set) ${RED}⚠️ REQUIRED${NC}"
fi

echo ""
echo -e "${BLUE}Step 2: Configuration Values${NC}"
echo ""

# Prompt for Gmail Integration ID
read -p "Enter Gmail Integration ID from Nango dashboard (default: google-mail): " GMAIL_ID
GMAIL_ID=${GMAIL_ID:-google-mail}

# Prompt for Google Calendar Integration ID
read -p "Enter Google Calendar Integration ID from Nango dashboard (default: google-calendar): " CALENDAR_ID
CALENDAR_ID=${CALENDAR_ID:-google-calendar}

echo ""
echo -e "${BLUE}Step 3: Updating .env.local${NC}"
echo ""

# Function to set or update env var
set_env_var() {
    local var_name=$1
    local var_value=$2
    
    if grep -q "^${var_name}=" .env.local 2>/dev/null; then
        # Update existing
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            sed -i '' "s|^${var_name}=.*|${var_name}=${var_value}|" .env.local
        else
            # Linux
            sed -i "s|^${var_name}=.*|${var_name}=${var_value}|" .env.local
        fi
        echo -e "  ${GREEN}✓ Updated ${var_name}${NC}"
    else
        # Add new
        echo "${var_name}=${var_value}" >> .env.local
        echo -e "  ${GREEN}✓ Added ${var_name}${NC}"
    fi
}

# Update environment variables
set_env_var "NANGO_GMAIL_INTEGRATION_ID" "$GMAIL_ID"
set_env_var "NANGO_GOOGLE_CALENDAR_INTEGRATION_ID" "$CALENDAR_ID"

echo ""
echo -e "${GREEN}✓ Environment variables updated in .env.local${NC}"
echo ""

# Check if NANGO_SECRET_KEY is set
if ! grep -q "^NANGO_SECRET_KEY=" .env.local 2>/dev/null || [ -z "$(grep "^NANGO_SECRET_KEY=" .env.local | cut -d '=' -f2)" ]; then
    echo -e "${YELLOW}⚠️  NANGO_SECRET_KEY is not set or is empty.${NC}"
    echo -e "${YELLOW}   You need to set this in Vercel environment variables for production.${NC}"
    echo ""
    read -p "Do you want to set NANGO_SECRET_KEY now? (y/n): " SET_SECRET
    if [ "$SET_SECRET" = "y" ] || [ "$SET_SECRET" = "Y" ]; then
        read -sp "Enter NANGO_SECRET_KEY (from Nango dashboard → Environment Settings): " SECRET_KEY
        echo ""
        set_env_var "NANGO_SECRET_KEY" "$SECRET_KEY"
        echo -e "${GREEN}✓ NANGO_SECRET_KEY set${NC}"
    fi
fi

echo ""
echo -e "${BLUE}Step 4: Verification${NC}"
echo ""

# Run verification script if it exists
if [ -f "scripts/verify-gmail-calendar-nango-config.js" ]; then
    echo -e "${CYAN}Running verification script...${NC}"
    echo ""
    node scripts/verify-gmail-calendar-nango-config.js
else
    echo -e "${YELLOW}⚠️  Verification script not found. Skipping.${NC}"
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Setup Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo ""
echo "1. Update Google Cloud Console OAuth consent screen:"
echo "   - Go to https://console.cloud.google.com"
echo "   - APIs & Services → OAuth consent screen"
echo "   - Change 'App name' to production name"
echo ""
echo "2. Create/Update OAuth 2.0 Credentials:"
echo "   - APIs & Services → Credentials"
echo "   - Create OAuth client ID (Web application)"
echo "   - Redirect URI: https://api.nango.dev/oauth/callback"
echo ""
echo "3. Update Nango Dashboard:"
echo "   - Go to https://app.nango.dev (prod environment)"
echo "   - Integrations → Gmail: Use production Client ID/Secret"
echo "   - Integrations → Google Calendar: Use production Client ID/Secret"
echo ""
echo "4. Set Environment Variables in Vercel:"
echo "   - Go to Vercel → Your Project → Settings → Environment Variables"
echo "   - Set NANGO_GMAIL_INTEGRATION_ID=${GMAIL_ID}"
echo "   - Set NANGO_GOOGLE_CALENDAR_INTEGRATION_ID=${CALENDAR_ID}"
echo "   - Verify NANGO_SECRET_KEY is set (prod environment)"
echo ""
echo "5. Redeploy application in Vercel"
echo ""
echo -e "${CYAN}For detailed instructions, see:${NC}"
echo "  - docs/gmail-calendar-nango-configuration-checklist.md"
echo "  - docs/fix-gmail-google-calendar-oauth-consent-screen.md"
echo ""

