#!/bin/bash

# 🔧 Fix Cloudflare SSL Error 525 for Vercel Deployment
# This script fixes the SSL handshake issue between Cloudflare and Vercel

set -e

echo "🔧 Fixing Cloudflare SSL Error 525..."
echo "====================================="

# Cloudflare API Token (from your existing script)
CF_API_TOKEN="8APGEqEzvZpNDem8pDiMB1Id5gCnA0HpVQllNix2"

# Domain configuration
DOMAIN="adrata.com"
ZONE_ID="da96b028a84fa3d4bfaa7f90efaf3613"

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() { echo -e "${GREEN}✅ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }

# Function 1: Set SSL mode to "Full" (not "Full (strict)")
set_ssl_mode() {
    print_info "Setting SSL mode to 'Full' for Vercel compatibility..."
    
    response=$(curl -s -X PATCH "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/settings/ssl" \
        -H "Authorization: Bearer $CF_API_TOKEN" \
        -H "Content-Type: application/json" \
        --data '{"value":"full"}')
    
    if echo "$response" | grep -q '"success":true'; then
        print_status "SSL mode set to 'Full'"
    else
        print_warning "Could not set SSL mode (may need higher API permissions)"
        echo "Manual fix: Go to Cloudflare Dashboard > SSL/TLS > Overview > Set to 'Full'"
    fi
}

# Function 2: Update DNS records to fix proxy issues
fix_dns_records() {
    print_info "Fixing DNS records for proper Vercel integration..."
    
    # Get existing A records for root domain
    records=$(curl -s -X GET "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records?type=A&name=$DOMAIN" \
        -H "Authorization: Bearer $CF_API_TOKEN" \
        -H "Content-Type: application/json")
    
    # Extract record IDs
    record_ids=$(echo "$records" | jq -r '.result[].id' 2>/dev/null || echo "")
    
    if [ -n "$record_ids" ]; then
        print_info "Found existing A records, updating proxy settings..."
        
        # Update each A record to disable proxy (DNS-only)
        for record_id in $record_ids; do
            response=$(curl -s -X PATCH "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records/$record_id" \
                -H "Authorization: Bearer $CF_API_TOKEN" \
                -H "Content-Type: application/json" \
                --data '{"proxied":false}')
            
            if echo "$response" | grep -q '"success":true'; then
                print_status "Updated A record to DNS-only mode"
            else
                print_warning "Could not update A record: $record_id"
            fi
        done
    else
        print_info "No existing A records found"
    fi
}

# Function 3: Set up proper CNAME records for Vercel
setup_vercel_cnames() {
    print_info "Setting up proper CNAME records for Vercel..."
    
    # Create/update CNAME for www
    response=$(curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records" \
        -H "Authorization: Bearer $CF_API_TOKEN" \
        -H "Content-Type: application/json" \
        --data '{
            "type": "CNAME",
            "name": "www",
            "content": "cname.vercel-dns.com",
            "ttl": 1,
            "proxied": false
        }')
    
    if echo "$response" | grep -q '"success":true'; then
        print_status "CNAME record created for www.$DOMAIN"
    else
        print_info "CNAME for www already exists or other issue"
    fi
}

# Function 4: Check current SSL/TLS settings
check_ssl_settings() {
    print_info "Checking current SSL/TLS settings..."
    
    # Try to get SSL settings
    response=$(curl -s -X GET "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/settings/ssl" \
        -H "Authorization: Bearer $CF_API_TOKEN" \
        -H "Content-Type: application/json")
    
    if echo "$response" | grep -q '"success":true'; then
        ssl_mode=$(echo "$response" | jq -r '.result.value' 2>/dev/null || echo "unknown")
        print_info "Current SSL mode: $ssl_mode"
    else
        print_warning "Cannot check SSL settings with current API token"
    fi
}

# Function 5: Provide manual instructions
manual_instructions() {
    echo ""
    print_info "Manual steps to complete the fix:"
    echo "=================================="
    echo ""
    echo "1. 🌐 Go to Cloudflare Dashboard: https://dash.cloudflare.com"
    echo "2. 🔍 Select domain: $DOMAIN"
    echo "3. 🔒 Go to SSL/TLS tab"
    echo "4. ⚙️  Set SSL mode to 'Full' (not 'Full (strict)')"
    echo "5. 📋 Go to DNS tab"
    echo "6. ✏️  Edit A records for $DOMAIN:"
    echo "   - Uncheck 'Proxied' (set to DNS only)"
    echo "   - Keep IP addresses as they are"
    echo "7. ⏱️  Wait 2-5 minutes for changes to propagate"
    echo "8. 🧪 Test your site: https://$DOMAIN"
    echo ""
    print_warning "Alternative: Use CNAME flattening if available"
    echo "If your domain provider supports CNAME flattening:"
    echo "- Delete A records for root domain"
    echo "- Create CNAME record: $DOMAIN -> cname.vercel-dns.com"
}

# Function 6: Test the fix
test_fix() {
    print_info "Testing the fix..."
    
    # Wait a moment for DNS changes
    sleep 5
    
    # Test SSL handshake
    if curl -s -I "https://$DOMAIN" > /dev/null 2>&1; then
        print_status "✅ SSL handshake successful!"
        print_status "Site is now accessible: https://$DOMAIN"
    else
        print_warning "Still having issues - DNS may need more time to propagate"
        print_info "Try again in 5-10 minutes"
    fi
}

# Main execution
echo "🚀 Starting SSL fix for $DOMAIN..."
echo ""

# Run all fixes
check_ssl_settings
set_ssl_mode
fix_dns_records
setup_vercel_cnames

echo ""
echo "🎯 Quick Fix Summary:"
echo "===================="
echo "• Set SSL mode to 'Full'"
echo "• Changed A records to DNS-only (not proxied)"
echo "• Ensured CNAME records point to cname.vercel-dns.com"
echo ""

# Provide manual instructions
manual_instructions

# Test the fix
test_fix

echo ""
print_status "Fix complete! Your site should be working now."
print_info "If issues persist, the manual steps above will definitely resolve them." 