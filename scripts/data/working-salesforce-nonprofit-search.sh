#!/bin/bash

# Working Salesforce Nonprofit Search - Based on Proven Pattern
# Uses the exact field structure that successfully processes

echo "🎯 Working Salesforce Nonprofit Search"
echo "======================================"
echo "📊 Records Limit: 250"
echo "🔍 Strategy: Build from proven working pattern"
echo ""

# Working pattern: country_code + current_company_name + position fields
# Search 1: Salesforce professionals with nonprofit experience
echo "🔄 Search 1: Salesforce Solution Architects..."

curl -H "Authorization: Bearer 7b01d6f148d5f428222d8c59c03b55a62205ed435b4a32ee64c6e0c28b2c9f8e" \
     -H "Content-Type: application/json" \
     -d '{
       "dataset_id": "gd_l1viktl72bvl7bjuj0",
       "records_limit": 250,
       "filter": {
         "operator": "and",
         "filters": [
           {
             "name": "country_code",
             "value": "US",
             "operator": "="
           },
           {
             "operator": "or",
             "filters": [
               {
                 "name": "current_company_name",
                 "value": "Salesforce",
                 "operator": "includes"
               },
               {
                 "name": "position",
                 "value": "Salesforce Solution Architect",
                 "operator": "includes"
               },
               {
                 "name": "position",
                 "value": "Salesforce Architect",
                 "operator": "includes"
               }
             ]
           },
           {
             "operator": "or",
             "filters": [
               {
                 "name": "position",
                 "value": "nonprofit",
                 "operator": "includes"
               },
               {
                 "name": "position",
                 "value": "fundraising",
                 "operator": "includes"
               }
             ]
           }
         ]
       }
     }' \
     "https://api.brightdata.com/datasets/filter" > salesforce_nonprofit_working_1.json

echo "✅ Search 1 completed. Response saved to: salesforce_nonprofit_working_1.json"
echo ""

# Search 2: Broader Salesforce + nonprofit combination
echo "🔄 Search 2: Broader Salesforce + nonprofit professionals..."

curl -H "Authorization: Bearer 7b01d6f148d5f428222d8c59c03b55a62205ed435b4a32ee64c6e0c28b2c9f8e" \
     -H "Content-Type: application/json" \
     -d '{
       "dataset_id": "gd_l1viktl72bvl7bjuj0", 
       "records_limit": 250,
       "filter": {
         "operator": "and",
         "filters": [
           {
             "name": "country_code",
             "value": "US",
             "operator": "="
           },
           {
             "name": "position",
             "value": "salesforce",
             "operator": "includes"
           },
           {
             "operator": "or",
             "filters": [
               {
                 "name": "current_company_name",
                 "value": "nonprofit",
                 "operator": "includes"
               },
               {
                 "name": "current_company_name",
                 "value": "foundation",
                 "operator": "includes"
               },
               {
                 "name": "current_company_name",
                 "value": "charity",
                 "operator": "includes"
               }
             ]
           }
         ]
       }
     }' \
     "https://api.brightdata.com/datasets/filter" > salesforce_nonprofit_working_2.json

echo "✅ Search 2 completed. Response saved to: salesforce_nonprofit_working_2.json"
echo ""

# Search 3: Solution Architects at nonprofit organizations
echo "🔄 Search 3: Solution Architects at nonprofit organizations..."

curl -H "Authorization: Bearer 7b01d6f148d5f428222d8c59c03b55a62205ed435b4a32ee64c6e0c28b2c9f8e" \
     -H "Content-Type: application/json" \
     -d '{
       "dataset_id": "gd_l1viktl72bvl7bjuj0",
       "records_limit": 250, 
       "filter": {
         "operator": "and",
         "filters": [
           {
             "name": "country_code",
             "value": "US",
             "operator": "="
           },
           {
             "operator": "and",
             "filters": [
               {
                 "name": "position",
                 "value": "solution architect",
                 "operator": "includes"
               },
               {
                 "name": "position",
                 "value": "salesforce",
                 "operator": "includes"
               }
             ]
           },
           {
             "operator": "or",
             "filters": [
               {
                 "name": "current_company_name",
                 "value": "united way",
                 "operator": "includes"
               },
               {
                 "name": "current_company_name",
                 "value": "red cross",
                 "operator": "includes"
               },
               {
                 "name": "current_company_name",
                 "value": "salvation army",
                 "operator": "includes"
               }
             ]
           }
         ]
       }
     }' \
     "https://api.brightdata.com/datasets/filter" > salesforce_nonprofit_working_3.json

echo "✅ Search 3 completed. Response saved to: salesforce_nonprofit_working_3.json"
echo ""

# Check all responses
echo "📋 SEARCH SUMMARY"
echo "================"

for i in {1..3}; do
    file="salesforce_nonprofit_working_${i}.json"
    if [ -f "$file" ]; then
        size=$(wc -c < "$file")
        echo "Search $i: $size bytes"
        
        # Check if we got a snapshot ID
        if grep -q "snapshot_id" "$file"; then
            snapshot_id=$(grep -o '"snapshot_id":"[^"]*"' "$file" | cut -d'"' -f4)
            echo "   ✅ Snapshot created: $snapshot_id"
        else
            echo "   ⚠️  Response: $(cat "$file")"
        fi
    fi
done

echo ""
echo "💡 Next Steps:"
echo "   1. Monitor snapshots for completion (they should process successfully now)"
echo "   2. Download data when ready"
echo "   3. Import into Monaco for buyer group analysis"
echo ""
echo "🚀 Working search complete!" 