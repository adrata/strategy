#!/bin/bash

# Cloudflare API Token
CF_API_TOKEN="8APGEqEzvZpNDem8pDiMB1Id5gCnA0HpVQllNix2"

# Vercel IP addresses for A records
VERCEL_IPS=("76.76.19.61" "76.223.126.88")

# Function to get zone ID for domain
get_zone_id() {
    local domain=$1
    case $domain in
        "adrata.com") echo "da96b028a84fa3d4bfaa7f90efaf3613" ;;
        "getadrata.com") echo "03b97cf31223f6d82691a7192923615f" ;;
        "goadrata.com") echo "8beb441b643fcf6c9b9bc784e4b7a35f" ;;
        "tryadrata.com") echo "b1d80202bfa785a52bd5e45cf0ddda86" ;;
        *) echo "" ;;
    esac
}

# Function to delete existing records
delete_existing_records() {
    local zone_id=$1
    local domain=$2
    
    echo "🧹 Cleaning existing records for $domain..."
    
    # Get existing records
    records=$(curl -s -X GET "https://api.cloudflare.com/client/v4/zones/$zone_id/dns_records" \
        -H "Authorization: Bearer $CF_API_TOKEN" \
        -H "Content-Type: application/json" | jq -r '.result[] | select(.name == "'$domain'" or .name == "www.'$domain'" or .name == "action.'$domain'" or .name == "demo.'$domain'") | .id')
    
    # Delete each record
    for record_id in $records; do
        if [ ! -z "$record_id" ]; then
            curl -s -X DELETE "https://api.cloudflare.com/client/v4/zones/$zone_id/dns_records/$record_id" \
                -H "Authorization: Bearer $CF_API_TOKEN" > /dev/null
            echo "   ✅ Deleted record: $record_id"
        fi
    done
}

# Function to create DNS records
create_dns_records() {
    local domain=$1
    local zone_id=$(get_zone_id $domain)
    
    if [ -z "$zone_id" ]; then
        echo "❌ Unknown domain: $domain"
        return 1
    fi
    
    echo "🚀 Creating DNS records for $domain..."
    
    # Delete existing records first
    delete_existing_records $zone_id $domain
    
    # Create A records for root domain (Vercel IPs)
    for ip in "${VERCEL_IPS[@]}"; do
        response=$(curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$zone_id/dns_records" \
            -H "Authorization: Bearer $CF_API_TOKEN" \
            -H "Content-Type: application/json" \
            --data '{
                "type": "A",
                "name": "'$domain'",
                "content": "'$ip'",
                "ttl": 1,
                "priority": 10,
                "proxied": true
            }')
        
        if echo "$response" | jq -e '.success' > /dev/null; then
            echo "   ✅ Created A record: $domain -> $ip"
        else
            echo "   ❌ Failed to create A record: $domain -> $ip"
            echo "      Error: $(echo "$response" | jq -r '.errors[0].message // "Unknown error"')"
        fi
    done
    
    # Create CNAME record for www subdomain
    response=$(curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$zone_id/dns_records" \
        -H "Authorization: Bearer $CF_API_TOKEN" \
        -H "Content-Type: application/json" \
        --data '{
            "type": "CNAME",
            "name": "www.'$domain'",
            "content": "cname.vercel-dns.com",
            "ttl": 1,
            "proxied": false
        }')
    
    if echo "$response" | jq -e '.success' > /dev/null; then
        echo "   ✅ Created CNAME record: www.$domain -> cname.vercel-dns.com"
    else
        echo "   ❌ Failed to create CNAME record for www.$domain"
        echo "      Error: $(echo "$response" | jq -r '.errors[0].message // "Unknown error"')"
    fi
    
    # Create CNAME record for action subdomain (for platform access)
    response=$(curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$zone_id/dns_records" \
        -H "Authorization: Bearer $CF_API_TOKEN" \
        -H "Content-Type: application/json" \
        --data '{
            "type": "CNAME",
            "name": "action.'$domain'",
            "content": "cname.vercel-dns.com",
            "ttl": 1,
            "proxied": false
        }')
    
    if echo "$response" | jq -e '.success' > /dev/null; then
        echo "   ✅ Created CNAME record: action.$domain -> cname.vercel-dns.com"
    else
        echo "   ❌ Failed to create CNAME record for action.$domain"
        echo "      Error: $(echo "$response" | jq -r '.errors[0].message // "Unknown error"')"
    fi
    
    # Create CNAME record for demo subdomain
    response=$(curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$zone_id/dns_records" \
        -H "Authorization: Bearer $CF_API_TOKEN" \
        -H "Content-Type: application/json" \
        --data '{
            "type": "CNAME",
            "name": "demo.'$domain'",
            "content": "cname.vercel-dns.com",
            "ttl": 1,
            "proxied": false
        }')
    
    if echo "$response" | jq -e '.success' > /dev/null; then
        echo "   ✅ Created CNAME record: demo.$domain -> cname.vercel-dns.com"
    else
        echo "   ❌ Failed to create CNAME record for demo.$domain"
        echo "      Error: $(echo "$response" | jq -r '.errors[0].message // "Unknown error"')"
    fi
    
    echo ""
}

# Main execution
echo "🌐 Updating DNS records for all Adrata domains..."
echo "================================================="

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo "❌ jq is required but not installed. Installing with brew..."
    brew install jq
fi

# List of domains to update
DOMAINS=("adrata.com" "getadrata.com" "goadrata.com" "tryadrata.com")

# Update DNS records for each domain
for domain in "${DOMAINS[@]}"; do
    create_dns_records "$domain"
done

echo "🎉 DNS update complete!"
echo ""
echo "📋 Summary of created records:"
echo "================================"
for domain in "${DOMAINS[@]}"; do
    echo "🔗 $domain:"
    echo "   • Root domain: A records -> Vercel IPs (proxied)"
    echo "   • www.$domain: CNAME -> cname.vercel-dns.com"
    echo "   • action.$domain: CNAME -> cname.vercel-dns.com"
    echo "   • demo.$domain: CNAME -> cname.vercel-dns.com"
    echo ""
done

echo "⚠️  Next steps:"
echo "1. Add these domains to your Vercel project settings"
echo "2. Configure domain redirects in Vercel if needed"
echo "3. Wait 5-10 minutes for DNS propagation"
echo "4. Test each domain to ensure they're working" 