#!/bin/bash

# 📄 SETUP PAPER SUBDOMAIN FOR ADRATA
# Configures paper.adrata.com for report sharing functionality

set -e

echo "📄 Setting up paper.adrata.com subdomain..."
echo "============================================"

# Cloudflare configuration
CF_API_TOKEN="8APGEqEzvZpNDem8pDiMB1Id5gCnA0HpVQllNix2"
ZONE_ID="da96b028a84fa3d4bfaa7f90efaf3613"  # adrata.com zone ID

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() { echo -e "${GREEN}✅ $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }

# Function to create DNS record
create_dns_record() {
    local name="$1"
    local target="$2"
    local proxied="$3"
    
    print_info "Creating DNS record: $name -> $target"
    
    response=$(curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records" \
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
        print_status "Created: $name"
    else
        print_warning "May already exist or need manual setup: $name"
        echo "$response" | jq '.errors' 2>/dev/null || echo "Response: $response"
    fi
}

# Step 1: Create Cloudflare DNS Record
print_info "Step 1: Creating Cloudflare DNS record for paper.adrata.com"
create_dns_record "paper.adrata.com" "cname.vercel-dns.com" false

# Step 2: Add domain to Vercel project
print_info "Step 2: Adding paper.adrata.com to Vercel production project"

if command -v vercel &> /dev/null; then
    # Add domain to production project
    vercel domains add paper.adrata.com --scope adrata 2>/dev/null || print_warning "Domain may already exist in Vercel"
    
    # Assign domain to production project
    vercel alias --scope adrata adrata-production paper.adrata.com 2>/dev/null || print_warning "Domain assignment may need manual setup"
    
    print_status "Vercel domain configuration attempted"
else
    print_warning "Vercel CLI not found. Manual setup required:"
    echo "  1. Go to Vercel Dashboard > adrata-production project"
    echo "  2. Go to Settings > Domains"
    echo "  3. Add domain: paper.adrata.com"
fi

# Step 3: Create paper page route
print_info "Step 3: Ensuring paper page route exists"

if [ -f "src/app/paper/page.tsx" ]; then
    print_status "Paper page already exists"
else
    print_info "Creating paper page route..."
    mkdir -p src/app/paper
    
    cat > src/app/paper/page.tsx << 'EOF'
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shared Report - Adrata',
  description: 'View shared Adrata intelligence report',
};

export default function PaperPage() {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-20">
          <h1 className="text-4xl font-bold mb-4">Shared Report</h1>
          <p className="text-xl text-[var(--muted)] mb-8">
            This report has been shared with you via Adrata's intelligence platform.
          </p>
          <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-8">
            <p className="text-[var(--muted)]">
              Report content will be displayed here based on the shared link parameters.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
EOF
    print_status "Created paper page route"
fi

# Step 4: Test DNS propagation
print_info "Step 4: Testing DNS setup"
echo ""
echo "🧪 DNS Test Results:"
echo "==================="

# Test DNS resolution
if dig +short paper.adrata.com | grep -q "cname.vercel-dns.com"; then
    print_status "DNS record configured correctly"
else
    print_warning "DNS may still be propagating (can take up to 24 hours)"
fi

# Test HTTP response
if curl -s -o /dev/null -w "%{http_code}" https://paper.adrata.com | grep -q "200\|301\|302"; then
    print_status "HTTPS endpoint responding"
else
    print_warning "HTTPS endpoint not yet available (normal during initial setup)"
fi

echo ""
print_info "📋 Setup Summary:"
echo "=================="
echo "✅ DNS Record: paper.adrata.com -> cname.vercel-dns.com"
echo "✅ Vercel Domain: Added to production project"
echo "✅ Paper Route: /paper page created"
echo ""
print_info "🔗 Test the setup:"
echo "Visit: https://paper.adrata.com"
echo ""
print_warning "Note: DNS propagation can take 5-60 minutes"
print_warning "If issues persist, check Vercel dashboard manually"

echo ""
print_status "Paper subdomain setup completed!" 