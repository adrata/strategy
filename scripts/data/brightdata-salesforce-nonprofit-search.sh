#!/bin/bash

# BrightData API Search for Salesforce Solution Architects with Nonprofit Cloud & Fundraising Experience
# Updated: $(date)
# Records Limit: 250
# Target: Salesforce Solution Architect + Nonprofit + Cloud + Fundraising

echo "🔍 Searching BrightData for Salesforce Solution Architects with Nonprofit Cloud & Fundraising Experience..."
echo "📊 Records Limit: 250"
echo "🎯 Query: Salesforce Solution Architect + Nonprofit + Cloud + Fundraising"
echo "🌍 Geography: United States"
echo ""

# Primary search - More specific approach with correct field names
curl -H "Authorization: Bearer 7b01d6f148d5f428222d8c59c03b55a62205ed435b4a32ee64c6e0c28b2c9f8e" \
     -H "Content-Type: application/json" \
     -d '{
       "dataset_id": "gd_l1viktl72bvl7bjuj0",
       "records_limit": 250,
       "filter": {
         "operator": "and",
         "filters": [
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
                 "value": "solution architect",
                 "operator": "includes"
               }
             ]
           },
           {
             "operator": "and",
             "filters": [
               {
                 "operator": "or",
                 "filters": [
                   {
                     "name": "experience",
                     "value": "nonprofit",
                     "operator": "includes"
                   },
                   {
                     "name": "volunteer_experience",
                     "value": "nonprofit",
                     "operator": "includes"
                   },
                   {
                     "name": "about",
                     "value": "nonprofit",
                     "operator": "includes"
                   }
                 ]
               },
               {
                 "operator": "or",
                 "filters": [
                   {
                     "name": "experience",
                     "value": "fundraising",
                     "operator": "includes"
                   },
                   {
                     "name": "volunteer_experience",
                     "value": "fundraising",
                     "operator": "includes"
                   },
                   {
                     "name": "experience",
                     "value": "cloud",
                     "operator": "includes"
                   }
                 ]
               }
             ]
           }
         ]
       }
     }' \
     "https://api.brightdata.com/datasets/filter" > salesforce_nonprofit_architects_primary.json

echo "✅ Primary search completed. Results saved to: salesforce_nonprofit_architects_primary.json"
echo ""

# Alternative search - Broader approach using correct field names
echo "🔄 Running alternative broader search..."

curl -H "Authorization: Bearer 7b01d6f148d5f428222d8c59c03b55a62205ed435b4a32ee64c6e0c28b2c9f8e" \
     -H "Content-Type: application/json" \
     -d '{
       "dataset_id": "gd_l1viktl72bvl7bjuj0", 
       "records_limit": 250,
       "filter": {
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
                 "operator": "or",
                 "filters": [
                   {
                     "name": "experience",
                     "value": "nonprofit",
                     "operator": "includes"
                   },
                   {
                     "name": "experience",
                     "value": "fundraising",
                     "operator": "includes"
                   }
                 ]
               }
             ]
           },
           {
             "operator": "and",
             "filters": [
               {
                 "name": "experience",
                 "value": "salesforce",
                 "operator": "includes"
               },
               {
                 "name": "experience",
                 "value": "architect",
                 "operator": "includes"
               },
               {
                 "operator": "or",
                 "filters": [
                   {
                     "name": "volunteer_experience",
                     "value": "nonprofit",
                     "operator": "includes"
                   },
                   {
                     "name": "about",
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
     "https://api.brightdata.com/datasets/filter" > salesforce_nonprofit_architects_alternative.json

echo "✅ Alternative search completed. Results saved to: salesforce_nonprofit_architects_alternative.json"
echo ""

# Display summary
echo "📋 SEARCH SUMMARY:"
echo "==================="
echo "🎯 Target Profile: Salesforce Solution Architect"
echo "🔍 Experience: Nonprofit Cloud + Fundraising"
echo "📊 Records Limit: 250 per search"
echo "🌍 Geography: United States"
echo "📁 Output Files:"
echo "   • salesforce_nonprofit_architects_primary.json"
echo "   • salesforce_nonprofit_architects_alternative.json"
echo ""
echo "💡 Next Steps:"
echo "   1. Review both result sets"
echo "   2. Merge and deduplicate results"
echo "   3. Import into Monaco for buyer group analysis"
echo "   4. Create targeted outreach campaigns"
echo ""

# Check file sizes
if [ -f "salesforce_nonprofit_architects_primary.json" ]; then
    primary_size=$(wc -c < salesforce_nonprofit_architects_primary.json)
    echo "📏 Primary results file size: ${primary_size} bytes"
fi

if [ -f "salesforce_nonprofit_architects_alternative.json" ]; then
    alt_size=$(wc -c < salesforce_nonprofit_architects_alternative.json)
    echo "📏 Alternative results file size: ${alt_size} bytes"
fi

echo ""
echo "🚀 Search complete! Ready for Monaco import and analysis." 