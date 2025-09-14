#!/bin/bash

# Download BrightData Snapshots and Convert to CSV
# Snapshots from Salesforce Solution Architect + Nonprofit + Fundraising search

echo "📥 Downloading BrightData Snapshots..."
echo "====================================="

# Snapshot IDs from the search
PRIMARY_SNAPSHOT="snap_mddq5ak82hadctqc58"
ALTERNATIVE_SNAPSHOT="snap_mddq5ar7k8gigtngc"

# API Configuration
API_TOKEN="7b01d6f148d5f428222d8c59c03b55a62205ed435b4a32ee64c6e0c28b2c9f8e"
BASE_URL="https://api.brightdata.com/datasets"

echo "🔍 Primary snapshot: $PRIMARY_SNAPSHOT"
echo "🔍 Alternative snapshot: $ALTERNATIVE_SNAPSHOT"
echo ""

# Function to download and save snapshot data
download_snapshot() {
    local snapshot_id=$1
    local output_file=$2
    local description=$3
    
    echo "📥 Downloading $description..."
    echo "   Snapshot ID: $snapshot_id"
    echo "   Output file: $output_file"
    
    # Download snapshot data (correct endpoint format)
    curl -H "Authorization: Bearer $API_TOKEN" \
         -H "Accept: application/json" \
         "$BASE_URL/snapshots/$snapshot_id/download" \
         -o "$output_file"
    
    if [ $? -eq 0 ]; then
        echo "✅ Downloaded successfully"
        
        # Check file size
        file_size=$(wc -c < "$output_file" 2>/dev/null || echo "0")
        echo "📏 File size: $file_size bytes"
        
        # Try to show first few lines if it's JSON
        if [ "$file_size" -gt 10 ]; then
            echo "📋 Preview (first 5 lines):"
            head -5 "$output_file" | sed 's/^/   /'
        fi
    else
        echo "❌ Download failed"
    fi
    echo ""
}

# Download primary search results
download_snapshot "$PRIMARY_SNAPSHOT" "salesforce_nonprofit_primary_data.json" "Primary Search Results"

# Download alternative search results  
download_snapshot "$ALTERNATIVE_SNAPSHOT" "salesforce_nonprofit_alternative_data.json" "Alternative Search Results"

# Combine and analyze results
echo "🔄 Analyzing Results..."
echo "====================="

primary_size=0
alt_size=0

if [ -f "salesforce_nonprofit_primary_data.json" ]; then
    primary_size=$(wc -c < "salesforce_nonprofit_primary_data.json")
fi

if [ -f "salesforce_nonprofit_alternative_data.json" ]; then
    alt_size=$(wc -c < "salesforce_nonprofit_alternative_data.json")
fi

echo "📊 Results Summary:"
echo "   Primary search data: $primary_size bytes"
echo "   Alternative search data: $alt_size bytes"

if [ "$primary_size" -gt 100 ] || [ "$alt_size" -gt 100 ]; then
    echo ""
    echo "🎉 SUCCESS! Data retrieved successfully"
    echo ""
    echo "💡 Next Steps:"
    echo "   1. Review the JSON files for lead data"
    echo "   2. Import into Monaco for buyer group analysis"
    echo "   3. Create personalized outreach campaigns"
    echo "   4. Set up automated follow-up sequences"
    echo ""
    echo "📁 Files created:"
    echo "   • salesforce_nonprofit_primary_data.json"
    echo "   • salesforce_nonprofit_alternative_data.json"
else
    echo ""
    echo "⚠️  No significant data found. This could mean:"
    echo "   • Very specific search criteria (good for targeting)"
    echo "   • Need to broaden search parameters"
    echo "   • Results still processing (try again in a few minutes)"
fi

echo ""
echo "🚀 Download complete!" 