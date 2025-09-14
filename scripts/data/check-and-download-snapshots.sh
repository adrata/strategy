#!/bin/bash

# Check Snapshot Status and Download When Ready
# Automatically waits for BrightData snapshots to complete processing

echo "⏳ Checking BrightData Snapshot Status..."
echo "========================================"

# Snapshot IDs from the search
PRIMARY_SNAPSHOT="snap_mddq5ak82hadctqc58"
ALTERNATIVE_SNAPSHOT="snap_mddq5ar7k8gigtngc"

# API Configuration
API_TOKEN="7b01d6f148d5f428222d8c59c03b55a62205ed435b4a32ee64c6e0c28b2c9f8e"
BASE_URL="https://api.brightdata.com/datasets"

echo "🔍 Primary snapshot: $PRIMARY_SNAPSHOT"
echo "🔍 Alternative snapshot: $ALTERNATIVE_SNAPSHOT"
echo ""

# Function to check snapshot status
check_snapshot_status() {
    local snapshot_id=$1
    local description=$2
    
    echo "📊 Checking status: $description"
    echo "   Snapshot ID: $snapshot_id"
    
    # Check snapshot status
    status_response=$(curl -s -H "Authorization: Bearer $API_TOKEN" \
                           -H "Accept: application/json" \
                           "$BASE_URL/snapshots/$snapshot_id")
    
    echo "   Raw response: $status_response"
    
    # Parse status from response (basic approach)
    if echo "$status_response" | grep -q "ready"; then
        echo "✅ Status: READY"
        return 0
    elif echo "$status_response" | grep -q "processing\|running"; then
        echo "🔄 Status: PROCESSING"
        return 1
    elif echo "$status_response" | grep -q "failed\|error"; then
        echo "❌ Status: FAILED"
        return 2
    else
        echo "⚠️  Status: UNKNOWN ($status_response)"
        return 1
    fi
}

# Function to download snapshot when ready
download_when_ready() {
    local snapshot_id=$1
    local output_file=$2
    local description=$3
    
    echo ""
    echo "📥 Downloading $description..."
    
    # Download the data
    curl -H "Authorization: Bearer $API_TOKEN" \
         -H "Accept: application/json" \
         "$BASE_URL/snapshots/$snapshot_id/download" \
         -o "$output_file"
    
    if [ $? -eq 0 ]; then
        file_size=$(wc -c < "$output_file" 2>/dev/null || echo "0")
        echo "✅ Downloaded: $file_size bytes"
        
        # Show preview if substantial data
        if [ "$file_size" -gt 50 ]; then
            echo "📋 Preview:"
            head -3 "$output_file" | sed 's/^/   /'
            echo "   ..."
        fi
        return 0
    else
        echo "❌ Download failed"
        return 1
    fi
}

# Function to wait for snapshot with retries
wait_for_snapshot() {
    local snapshot_id=$1
    local description=$2
    local max_attempts=15
    local wait_time=60  # 1 minute between checks
    
    echo ""
    echo "⏳ Waiting for $description to complete..."
    echo "   Will check every $wait_time seconds (max $max_attempts attempts)"
    
    for ((attempt=1; attempt<=max_attempts; attempt++)); do
        echo ""
        echo "🔍 Check $attempt/$max_attempts..."
        
        check_snapshot_status "$snapshot_id" "$description"
        status_result=$?
        
        if [ $status_result -eq 0 ]; then
            echo "🎉 Snapshot ready! Downloading now..."
            
            # Determine output file name
            if echo "$description" | grep -q "Primary"; then
                output_file="salesforce_nonprofit_primary_data.json"
            else
                output_file="salesforce_nonprofit_alternative_data.json"
            fi
            
            download_when_ready "$snapshot_id" "$output_file" "$description"
            return $?
        elif [ $status_result -eq 2 ]; then
            echo "💥 Snapshot failed permanently"
            return 2
        else
            if [ $attempt -lt $max_attempts ]; then
                echo "⏳ Still processing... waiting $wait_time seconds"
                sleep $wait_time
            fi
        fi
    done
    
    echo "⏰ Timeout: Snapshot not ready after $max_attempts attempts"
    return 1
}

# Main execution
echo "🚀 Starting snapshot monitoring..."
echo ""

# Track results
primary_success=false
alternative_success=false

# Wait for primary snapshot
wait_for_snapshot "$PRIMARY_SNAPSHOT" "Primary Search"
if [ $? -eq 0 ]; then
    primary_success=true
fi

# Wait for alternative snapshot
wait_for_snapshot "$ALTERNATIVE_SNAPSHOT" "Alternative Search"
if [ $? -eq 0 ]; then
    alternative_success=true
fi

# Final summary
echo ""
echo "📋 FINAL RESULTS"
echo "================"

if [ "$primary_success" = true ]; then
    echo "✅ Primary search: SUCCESS"
    primary_size=$(wc -c < "salesforce_nonprofit_primary_data.json" 2>/dev/null || echo "0")
    echo "   File size: $primary_size bytes"
else
    echo "❌ Primary search: FAILED/TIMEOUT"
fi

if [ "$alternative_success" = true ]; then
    echo "✅ Alternative search: SUCCESS"
    alt_size=$(wc -c < "salesforce_nonprofit_alternative_data.json" 2>/dev/null || echo "0")
    echo "   File size: $alt_size bytes"
else
    echo "❌ Alternative search: FAILED/TIMEOUT"
fi

if [ "$primary_success" = true ] || [ "$alternative_success" = true ]; then
    echo ""
    echo "🎉 SUCCESS! At least one search completed"
    echo ""
    echo "💡 Next Steps:"
    echo "   1. Review the JSON data files"
    echo "   2. Import leads into Monaco for analysis"
    echo "   3. Create buyer group profiles"
    echo "   4. Launch targeted outreach campaigns"
    echo ""
    echo "📁 Files to review:"
    [ "$primary_success" = true ] && echo "   • salesforce_nonprofit_primary_data.json"
    [ "$alternative_success" = true ] && echo "   • salesforce_nonprofit_alternative_data.json"
else
    echo ""
    echo "⚠️  Both searches failed or timed out"
    echo "   • Try running again in a few minutes"
    echo "   • Consider broadening search criteria"
    echo "   • Check BrightData API status"
fi

echo ""
echo "🚀 Monitoring complete!" 