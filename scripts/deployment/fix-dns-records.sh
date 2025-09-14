#!/bin/bash

# 🔧 Fix Adrata DNS Records for Vercel + Cloudflare
# This fixes the specific CNAME record issues causing SSL Error 525

set -e

echo "🔧 Fixing DNS Records for adrata.com..."
echo "======================================"

CF_API_TOKEN="8APGEqEzvZpNDem8pDiMB1Id5gCnA0HpVQllNix2"
ZONE_ID="da96b028a84fa3d4bfaa7f90efaf3613"
DOMAIN="adrata.com"

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() { echo -e "${GREEN}✅ $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }

# Function to get record ID by name and type
get_record_id() {
    local name="$1"
    local type="$2"
    
    curl -s -X GET "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records?name=$name&type=$type" \
        -H "Authorization: Bearer $CF_API_TOKEN" \
        -H "Content-Type: application/json" | \
        jq -r '.result[0].id // empty'
}

# Function to update a CNAME record
update_cname_record() {
    local name="$1"
    local target="$2"
    local proxied="$3"
    
    print_info "Updating CNAME record: $name -> $target (Proxied: $proxied)"
    
    record_id=$(get_record_id "$name" "CNAME")
    
    if [ -n "$record_id" ]; then
        response=$(curl -s -X PUT "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records/$record_id" \
            -H "Authorization: Bearer $CF_API_TOKEN" \
            -H "Content-Type: application/json" \
            --data "{
                \"type\": \"CNAME\",
                \"name\": \"$name\",
                \"content\": \"$target\",
                \"proxied\": $proxied,
                \"ttl\": 1
            }")
        
        if echo "$response" | grep -q '"success":true'; then
            print_status "Updated: $name"
        else
            print_warning "Failed to update: $name"
            echo "$response" | jq '.errors'
        fi
    else
        print_warning "Record not found: $name"
    fi
}

print_info "🎯 Fixing the specific DNS issues causing SSL Error 525..."
echo ""

# Fix 1: Root domain CNAME - disable proxy
print_info "1. Fixing root domain (adrata.com) CNAME record..."
update_cname_record "$DOMAIN" "cname.vercel-dns.com" "false"

# Fix 2: WWW CNAME - disable proxy  
print_info "2. Fixing www subdomain CNAME record..."
update_cname_record "www.$DOMAIN" "cname.vercel-dns.com" "false"

# Fix 3: Action subdomain CNAME - disable proxy
print_info "3. Fixing action subdomain CNAME record..."
update_cname_record "action.$DOMAIN" "cname.vercel-dns.com" "false"

# Fix 4: Demo subdomain CNAME - disable proxy
print_info "4. Fixing demo subdomain CNAME record..."
update_cname_record "demo.$DOMAIN" "cname.vercel-dns.com" "false"

# Fix 5: Sandbox subdomain CNAME - disable proxy
print_info "5. Fixing sandbox subdomain CNAME record..."
update_cname_record "sandbox.$DOMAIN" "cname.vercel-dns.com" "false"

echo ""
print_status "🎉 DNS records updated!"
echo ""
print_info "📋 Changes made:"
echo "• Root domain: adrata.com -> cname.vercel-dns.com (DNS only)"
echo "• WWW: www.adrata.com -> cname.vercel-dns.com (DNS only)"  
echo "• Action: action.adrata.com -> cname.vercel-dns.com (DNS only)"
echo "• Demo: demo.adrata.com -> cname.vercel-dns.com (DNS only)"
echo "• Sandbox: sandbox.adrata.com -> cname.vercel-dns.com (DNS only)"
echo ""
print_warning "⏱️  Wait 2-5 minutes for DNS propagation, then test:"
echo "• https://adrata.com"
echo "• https://www.adrata.com"
echo "• https://action.adrata.com"
echo ""
print_info "🔒 This fixes SSL Error 525 by:"
echo "• Using proper Vercel CNAME target (cname.vercel-dns.com)"
echo "• Disabling Cloudflare proxy to prevent SSL conflicts"
echo "• Allowing direct SSL connection to Vercel" 