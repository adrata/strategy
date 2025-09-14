#!/bin/bash

# Monitor Targeted Salesforce + Nonprofit + Fundraising Searches
# Tracks the 5 specific searches for exact experience combinations

echo "📊 Monitoring Targeted Salesforce Solution Architect Searches"
echo "=============================================================="

# Snapshot IDs from targeted searches
TARGETED_SNAPSHOTS=(
    "snap_mddqcgg9236gz48m7x:Search 1 - Exact Phrase + Nonprofit + Fundraising"
    "snap_mddqcgqh14twwjfxei:Search 2 - Individual AND Terms"
    "snap_mddqch1424iqzh916:Search 3 - Exact Phrase + Nonprofit Cloud"
    "snap_mddqchbmqolif67zz:Search 4 - Architects at Nonprofit Orgs"
    "snap_mddqchon19nr50k14a:Search 5 - OR Logic Comprehensive"
)

# API Configuration
API_TOKEN="7b01d6f148d5f428222d8c59c03b55a62205ed435b4a32ee64c6e0c28b2c9f8e"
BASE_URL="https://api.brightdata.com/datasets"

echo "🔍 Monitoring ${#TARGETED_SNAPSHOTS[@]} targeted searches..."
echo "⏰ Check interval: 30 seconds"
echo "📋 Max monitoring time: 10 minutes"
echo ""

# Function to check and download if ready
check_and_download() {
    local snapshot_info=$1
    local snapshot_id=$(echo "$snapshot_info" | cut -d':' -f1)
    local description=$(echo "$snapshot_info" | cut -d':' -f2-)
    local output_file="targeted_${snapshot_id}.json"
    
    echo "📊 Checking: $description"
    echo "   Snapshot: $snapshot_id"
    
    # Check status
    status_response=$(curl -s -H "Authorization: Bearer $API_TOKEN" \
                           -H "Accept: application/json" \
                           "$BASE_URL/snapshots/$snapshot_id")
    
    # Parse status (looking for "ready" status)
    if echo "$status_response" | grep -q '"status":"ready"'; then
        echo "   ✅ Status: READY - Downloading..."
        
        # Download the data
        curl -s -H "Authorization: Bearer $API_TOKEN" \
             -H "Accept: application/json" \
             "$BASE_URL/snapshots/$snapshot_id/download" \
             -o "$output_file"
        
        if [ $? -eq 0 ]; then
            file_size=$(wc -c < "$output_file" 2>/dev/null || echo "0")
            echo "   📥 Downloaded: $file_size bytes"
            
            # Quick preview if substantial data
            if [ "$file_size" -gt 100 ]; then
                record_count=$(grep -o '"' "$output_file" | wc -l 2>/dev/null || echo "0")
                echo "   📋 Estimated records: $((record_count / 20))"
                echo "   📄 Preview:"
                head -2 "$output_file" | sed 's/^/      /'
            elif [ "$file_size" -gt 10 ]; then
                echo "   📄 Content: $(cat "$output_file")"
            fi
            return 0
        else
            echo "   ❌ Download failed"
            return 1
        fi
    elif echo "$status_response" | grep -q '"status":"processing"\|"status":"scheduled"'; then
        status=$(echo "$status_response" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
        echo "   🔄 Status: $status"
        return 2
    elif echo "$status_response" | grep -q '"status":"failed"'; then
        echo "   💥 Status: FAILED"
        echo "   ❌ Error: $status_response"
        return 3
    else
        echo "   ⚠️  Status: UNKNOWN"
        echo "   📄 Response: $status_response"
        return 2
    fi
}

# Main monitoring loop
completed_searches=0
max_attempts=20  # 10 minutes at 30-second intervals
attempt=1

while [ $attempt -le $max_attempts ] && [ $completed_searches -lt ${#TARGETED_SNAPSHOTS[@]} ]; do
    echo ""
    echo "🔍 Check $attempt/$max_attempts ($(date '+%H:%M:%S'))"
    echo "============================================"
    
    current_completed=0
    
    for snapshot_info in "${TARGETED_SNAPSHOTS[@]}"; do
        snapshot_id=$(echo "$snapshot_info" | cut -d':' -f1)
        output_file="targeted_${snapshot_id}.json"
        
        # Skip if already downloaded
        if [ -f "$output_file" ] && [ $(wc -c < "$output_file") -gt 50 ]; then
            current_completed=$((current_completed + 1))
            continue
        fi
        
        check_and_download "$snapshot_info"
        result=$?
        
        if [ $result -eq 0 ]; then
            current_completed=$((current_completed + 1))
        fi
        
        echo ""
    done
    
    completed_searches=$current_completed
    
    if [ $completed_searches -eq ${#TARGETED_SNAPSHOTS[@]} ]; then
        echo "🎉 All searches completed!"
        break
    fi
    
    echo "📊 Progress: $completed_searches/${#TARGETED_SNAPSHOTS[@]} searches completed"
    
    if [ $attempt -lt $max_attempts ]; then
        echo "⏳ Waiting 30 seconds for next check..."
        sleep 30
    fi
    
    attempt=$((attempt + 1))
done

# Final summary
echo ""
echo "📋 FINAL RESULTS SUMMARY"
echo "========================"

total_records=0
successful_searches=0

for snapshot_info in "${TARGETED_SNAPSHOTS[@]}"; do
    snapshot_id=$(echo "$snapshot_info" | cut -d':' -f1)
    description=$(echo "$snapshot_info" | cut -d':' -f2-)
    output_file="targeted_${snapshot_id}.json"
    
    if [ -f "$output_file" ]; then
        file_size=$(wc -c < "$output_file")
        if [ "$file_size" -gt 50 ]; then
            echo "✅ $description"
            echo "   📁 File: $output_file ($file_size bytes)"
            
            # Estimate record count
            if [ "$file_size" -gt 200 ]; then
                estimated_records=$(grep -o '{' "$output_file" 2>/dev/null | wc -l || echo "0")
                echo "   📊 Estimated records: $estimated_records"
                total_records=$((total_records + estimated_records))
            fi
            successful_searches=$((successful_searches + 1))
        else
            echo "⚠️  $description (minimal data)"
        fi
    else
        echo "❌ $description (not completed)"
    fi
done

echo ""
echo "🎯 SEARCH SUCCESS SUMMARY:"
echo "=========================="
echo "✅ Successful searches: $successful_searches/${#TARGETED_SNAPSHOTS[@]}"
echo "📊 Total estimated records: $total_records"
echo "📁 Files created: targeted_snap_*.json"

if [ $successful_searches -gt 0 ]; then
    echo ""
    echo "💡 NEXT STEPS:"
    echo "=============="
    echo "1. Review the downloaded JSON files"
    echo "2. Combine and deduplicate leads"
    echo "3. Import into Monaco for buyer group analysis"
    echo "4. Create personalized outreach campaigns"
    echo "5. Set up automated follow-up sequences"
    echo ""
    echo "📧 Target Profile Summary:"
    echo "• Salesforce Solution Architects"
    echo "• Nonprofit Cloud experience"
    echo "• Fundraising experience"
    echo "• US-based professionals"
    echo "• Ready for immediate outreach"
else
    echo ""
    echo "⚠️  No successful searches completed"
    echo "   • Searches may still be processing"
    echo "   • Try running monitor again in a few minutes"
    echo "   • Check BrightData account status"
fi

echo ""
echo "🚀 Monitoring complete!" 