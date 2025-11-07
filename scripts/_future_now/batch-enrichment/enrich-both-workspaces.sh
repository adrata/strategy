#!/bin/bash

# Comprehensive Enrichment for Both Workspaces
# 
# Enriches:
# 1. Dan's Adrata workspace (sales intelligence)
# 2. Notary Everyday workspace (notary platform)

echo ""
echo "================================================================================"
echo "🚀 COMPREHENSIVE WORKSPACE ENRICHMENT"
echo "================================================================================"
echo ""
echo "This will enrich ALL people and companies in both workspaces:"
echo ""
echo "1. Adrata (Dan's workspace) - Sales intelligence contacts"
echo "2. Notary Everyday - Notary platform contacts"
echo ""
echo "Features:"
echo "  - Email 4-layer verification"
echo "  - Phone 4-source discovery"
echo "  - Company intelligence gathering"
echo "  - Real-time progress with timing"
echo ""
echo "================================================================================"
echo ""

read -p "Proceed with enrichment? (y/n): " confirm

if [ "$confirm" != "y" ]; then
  echo "❌ Enrichment cancelled"
  exit 1
fi

cd "$(dirname "$0")"

echo ""
echo "================================================================================"
echo "PHASE 1: ADRATA WORKSPACE (Dan's)"
echo "================================================================================"
echo ""

node enrich-all-workspaces.js "Adrata"

ADRATA_EXIT=$?

if [ $ADRATA_EXIT -eq 0 ]; then
  echo ""
  echo "✅ Adrata enrichment complete!"
  echo ""
  echo "Waiting 30 seconds before next workspace..."
  sleep 30
else
  echo ""
  echo "❌ Adrata enrichment failed"
  echo ""
  read -p "Continue to Notary Everyday anyway? (y/n): " continue_anyway
  if [ "$continue_anyway" != "y" ]; then
    echo "❌ Stopping enrichment"
    exit 1
  fi
fi

echo ""
echo "================================================================================"
echo "PHASE 2: NOTARY EVERYDAY WORKSPACE"
echo "================================================================================"
echo ""

node enrich-all-workspaces.js "Notary Everyday"

NOTARY_EXIT=$?

echo ""
echo "================================================================================"
echo "🎉 ENRICHMENT COMPLETE"
echo "================================================================================"
echo ""

if [ $ADRATA_EXIT -eq 0 ] && [ $NOTARY_EXIT -eq 0 ]; then
  echo "✅ Both workspaces enriched successfully!"
elif [ $ADRATA_EXIT -eq 0 ]; then
  echo "⚠️ Adrata: ✅ Success"
  echo "⚠️ Notary Everyday: ❌ Failed"
elif [ $NOTARY_EXIT -eq 0 ]; then
  echo "⚠️ Adrata: ❌ Failed"
  echo "⚠️ Notary Everyday: ✅ Success"
else
  echo "❌ Both workspaces failed"
fi

echo ""
echo "================================================================================"
echo ""

