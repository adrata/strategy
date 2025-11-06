#!/bin/bash

# Generate Vercel CLI commands for setting environment variables
# This helps automate setting environment variables in Vercel

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}Vercel Environment Variables Setup${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo -e "${YELLOW}⚠️  .env.local not found. Please run setup script first.${NC}"
    exit 1
fi

# Read values from .env.local
GMAIL_ID=$(grep "^NANGO_GMAIL_INTEGRATION_ID=" .env.local 2>/dev/null | cut -d '=' -f2 | tr -d '"' || echo "google-mail")
CALENDAR_ID=$(grep "^NANGO_GOOGLE_CALENDAR_INTEGRATION_ID=" .env.local 2>/dev/null | cut -d '=' -f2 | tr -d '"' || echo "google-calendar")

echo -e "${BLUE}Environment Variables to Set:${NC}"
echo ""
echo "  NANGO_GMAIL_INTEGRATION_ID=${GMAIL_ID}"
echo "  NANGO_GOOGLE_CALENDAR_INTEGRATION_ID=${CALENDAR_ID}"
echo ""

echo -e "${BLUE}Vercel CLI Commands (Production):${NC}"
echo ""
echo -e "${CYAN}# Set Gmail Integration ID${NC}"
echo "vercel env add NANGO_GMAIL_INTEGRATION_ID production"
echo "  # When prompted, enter: ${GMAIL_ID}"
echo ""
echo -e "${CYAN}# Set Google Calendar Integration ID${NC}"
echo "vercel env add NANGO_GOOGLE_CALENDAR_INTEGRATION_ID production"
echo "  # When prompted, enter: ${CALENDAR_ID}"
echo ""

echo -e "${BLUE}Or use these commands directly:${NC}"
echo ""
echo -e "${GREEN}vercel env add NANGO_GMAIL_INTEGRATION_ID production <<< '${GMAIL_ID}'${NC}"
echo -e "${GREEN}vercel env add NANGO_GOOGLE_CALENDAR_INTEGRATION_ID production <<< '${CALENDAR_ID}'${NC}"
echo ""

echo -e "${YELLOW}Note: You'll need to verify NANGO_SECRET_KEY is already set in Vercel.${NC}"
echo -e "${YELLOW}If not, set it with: vercel env add NANGO_SECRET_KEY production${NC}"
echo ""

echo -e "${BLUE}After setting variables:${NC}"
echo "  1. Redeploy: vercel --prod"
echo "  2. Or trigger a new deployment in Vercel dashboard"
echo ""

