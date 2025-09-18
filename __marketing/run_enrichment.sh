#!/bin/bash

# TOP Engineers Plus Data Enrichment Runner
# This script runs the migration and data enrichment for TOP Engineers Plus workspace

set -e

echo "🚀 Starting TOP Engineers Plus Data Enrichment..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Check if Prisma is available
if ! command -v npx &> /dev/null; then
    echo "❌ Error: npx is not available. Please install Node.js and npm"
    exit 1
fi

echo "📋 Step 1: Running Prisma migration..."
npx prisma migrate dev --name add_top_engineers_plus_context_fields

echo "📋 Step 2: Generating Prisma client..."
npx prisma generate

echo "📋 Step 3: Running data enrichment..."
echo "   Note: You'll need to run the SQL file manually against your database"
echo "   File: __marketing/top_engineers_plus_data_enrichment.sql"
echo "   Command: psql -d your_database_name -f __marketing/top_engineers_plus_data_enrichment.sql"

echo "✅ Migration completed successfully!"
echo ""
echo "📝 Next steps:"
echo "   1. Run the data enrichment SQL file against your database"
echo "   2. Verify the data in Prisma Studio: npx prisma studio"
echo "   3. Test Adrata AI responses to ensure they reflect TOP's context"
echo ""
echo "🎯 TOP Engineers Plus workspace ID: 01K5D01YCQJ9TJ7CT4DZDE79T1"
echo "📄 Documentation: __marketing/README_DATA_ENRICHMENT.md"
