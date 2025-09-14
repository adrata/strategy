#!/bin/bash

# Targeted Salesforce Solution Architect + Nonprofit Cloud + Fundraising Experience
# Focuses on exact work experience combinations requested

echo "🎯 Targeted Salesforce Solution Architect + Nonprofit Cloud + Fundraising"
echo "========================================================================"
echo "📊 Records Limit: 250 per search"
echo "🔍 Target: Exact experience combinations"
echo ""

# Search 1: "salesforce solution architect" AND "nonprofit" AND "fundraising"
echo "🔄 Search 1: Salesforce Solution Architect + Nonprofit + Fundraising..."

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
             "value": "salesforce solution architect",
             "operator": "includes"
           },
           {
             "operator": "and",
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
     "https://api.brightdata.com/datasets/filter" > targeted_search_1.json

echo "✅ Search 1 completed. Response: $(cat targeted_search_1.json)"
echo ""

# Search 2: Individual terms AND logic in position field
echo "🔄 Search 2: Salesforce + Solution + Architect + Nonprofit + Fundraising..."

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
                 "value": "salesforce",
                 "operator": "includes"
               },
               {
                 "name": "position",
                 "value": "solution",
                 "operator": "includes"
               },
               {
                 "name": "position",
                 "value": "architect",
                 "operator": "includes"
               }
             ]
           },
           {
             "operator": "and",
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
     "https://api.brightdata.com/datasets/filter" > targeted_search_2.json

echo "✅ Search 2 completed. Response: $(cat targeted_search_2.json)"
echo ""

# Search 3: Salesforce Solution Architect + Nonprofit Cloud (specific)
echo "🔄 Search 3: Salesforce Solution Architect + Nonprofit Cloud..."

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
                 "value": "salesforce solution architect",
                 "operator": "includes"
               },
               {
                 "name": "position",
                 "value": "nonprofit cloud",
                 "operator": "includes"
               }
             ]
           }
         ]
       }
     }' \
     "https://api.brightdata.com/datasets/filter" > targeted_search_3.json

echo "✅ Search 3 completed. Response: $(cat targeted_search_3.json)"
echo ""

# Search 4: Broader approach - Use current_company_name for nonprofit targeting
echo "🔄 Search 4: Salesforce Architects at Nonprofit Organizations..."

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
                 "value": "salesforce",
                 "operator": "includes"
               },
               {
                 "name": "position",
                 "value": "architect",
                 "operator": "includes"
               }
             ]
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
                 "value": "united way",
                 "operator": "includes"
               },
               {
                 "name": "current_company_name",
                 "value": "american red cross",
                 "operator": "includes"
               },
               {
                 "name": "current_company_name",
                 "value": "feeding america",
                 "operator": "includes"
               }
             ]
           }
         ]
       }
     }' \
     "https://api.brightdata.com/datasets/filter" > targeted_search_4.json

echo "✅ Search 4 completed. Response: $(cat targeted_search_4.json)"
echo ""

# Search 5: Alternative OR logic approach
echo "🔄 Search 5: OR Logic - Either exact match OR component match..."

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
                 "operator": "and",
                 "filters": [
                   {
                     "name": "position",
                     "value": "salesforce solution architect",
                     "operator": "includes"
                   },
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
               },
               {
                 "operator": "and",
                 "filters": [
                   {
                     "name": "position",
                     "value": "salesforce",
                     "operator": "includes"
                   },
                   {
                     "name": "position",
                     "value": "solution",
                     "operator": "includes"
                   },
                   {
                     "name": "position",
                     "value": "architect",
                     "operator": "includes"
                   },
                   {
                     "name": "position",
                     "value": "nonprofit",
                     "operator": "includes"
                   },
                   {
                     "name": "position",
                     "value": "cloud",
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
         ]
       }
     }' \
     "https://api.brightdata.com/datasets/filter" > targeted_search_5.json

echo "✅ Search 5 completed. Response: $(cat targeted_search_5.json)"
echo ""

# Summary of all searches
echo "📋 TARGETED SEARCH SUMMARY"
echo "=========================="

for i in {1..5}; do
    file="targeted_search_${i}.json"
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
echo "🎯 SEARCH STRATEGY BREAKDOWN:"
echo "=============================="
echo "Search 1: Exact phrase 'salesforce solution architect' + nonprofit + fundraising"
echo "Search 2: Individual AND terms: salesforce + solution + architect + nonprofit + fundraising"
echo "Search 3: Exact phrase + 'nonprofit cloud' (specific)"
echo "Search 4: Salesforce architects working AT nonprofit organizations"
echo "Search 5: OR logic combining both exact and component approaches"
echo ""
echo "💡 Next Steps:"
echo "   1. Monitor snapshots for completion"
echo "   2. Download data when ready"
echo "   3. Combine results and deduplicate"
echo "   4. Import qualified leads into Monaco"
echo ""
echo "🚀 Targeted experience search complete!" 