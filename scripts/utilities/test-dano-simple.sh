#!/bin/bash

echo "🧪 DANO NOTARY EVERYDAY - SIMPLE STEP BY STEP TEST"
echo "=================================================="
echo "User: dano"
echo "Workspace: notary-everyday"
echo ""

# STEP 1: Health Check
echo "🏥 STEP 1: API HEALTH CHECK"
echo "---------------------------"
HEALTH_RESPONSE=$(curl -s -X GET http://localhost:3000/api/intelligence)
echo "Response: $HEALTH_RESPONSE"

if echo "$HEALTH_RESPONSE" | grep -q "operational"; then
    echo "✅ API is healthy"
else
    echo "❌ API health check failed"
    echo "💡 Make sure the development server is running: npm run dev"
    exit 1
fi

echo ""
echo ""

# STEP 2: Context Loading
echo "📊 STEP 2: CONTEXT LOADING FOR DANO"
echo "------------------------------------"
echo "Loading context for user: dano in workspace: notary-everyday"

CONTEXT_RESPONSE=$(curl -s -X POST http://localhost:3000/api/intelligence \
  -H "Content-Type: application/json" \
  -d '{"userId": "dano", "workspaceId": "notary-everyday"}')

echo "Response: $CONTEXT_RESPONSE"

if echo "$CONTEXT_RESPONSE" | grep -q "success.*true"; then
    echo "✅ Context loading successful"
    
    # Extract key information
    if echo "$CONTEXT_RESPONSE" | grep -q "hasProfile.*true"; then
        echo "   ✅ Dano has user profile"
    else
        echo "   ❌ Dano missing user profile"
    fi
    
    if echo "$CONTEXT_RESPONSE" | grep -q "hasProducts.*true"; then
        echo "   ✅ Dano has product portfolio"
    else
        echo "   ❌ Dano missing product portfolio"
    fi
    
else
    echo "❌ Context loading failed"
    if echo "$CONTEXT_RESPONSE" | grep -q "error"; then
        echo "   Error details in response above"
    fi
    echo "💡 May need to set up Dano's profile in notary-everyday workspace"
    exit 1
fi

echo ""
echo ""

# STEP 3: Single Account Test
echo "🏢 STEP 3: SINGLE ACCOUNT BUYER GROUP TEST"
echo "-------------------------------------------"
echo "Testing buyer group for: First American Title"

BUYER_GROUP_RESPONSE=$(curl -s -X POST http://localhost:3000/api/intelligence \
  -H "Content-Type: application/json" \
  -d '{"userId": "dano", "workspaceId": "notary-everyday", "targetCompany": "First American Title"}')

echo "Response: $BUYER_GROUP_RESPONSE"

if echo "$BUYER_GROUP_RESPONSE" | grep -q "buyerGroup"; then
    echo "✅ Buyer group analysis successful"
    
    # Extract buyer group info
    if echo "$BUYER_GROUP_RESPONSE" | grep -q "companyName"; then
        echo "   ✅ Company identified"
    fi
    
    if echo "$BUYER_GROUP_RESPONSE" | grep -q "roles"; then
        echo "   ✅ Buyer roles identified"
    fi
    
else
    echo "❌ Buyer group analysis failed"
    if echo "$BUYER_GROUP_RESPONSE" | grep -q "missing"; then
        echo "   ⚠️ Missing context - need to complete seller profile"
    fi
fi

echo ""
echo ""

# STEP 4: Bulk Test Info
echo "📦 STEP 4: BULK DISCOVERY INFO"
echo "------------------------------"
BULK_INFO_RESPONSE=$(curl -s -X GET http://localhost:3000/api/intelligence/buyer-group-bulk)
echo "Bulk endpoint info: $BULK_INFO_RESPONSE"

if echo "$BULK_INFO_RESPONSE" | grep -q "Bulk Buyer Group Discovery"; then
    echo "✅ Bulk discovery endpoint available"
    echo "💡 Ready to test bulk discovery with multiple title companies"
else
    echo "❌ Bulk discovery endpoint not available"
fi

echo ""
echo "🏁 SIMPLE TEST COMPLETE!"
echo ""
echo "📋 NEXT STEPS:"
echo "1. If context loading failed, set up Dano's profile in notary-everyday workspace"
echo "2. If buyer group failed, complete seller product portfolio"
echo "3. If all passed, ready for bulk testing with 150 accounts"
