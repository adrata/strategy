#!/bin/bash

# Script to update database credentials across all environment files
# Run this AFTER creating new database user in Neon Console

echo "🔐 DATABASE CREDENTIAL UPDATE SCRIPT"
echo "===================================="
echo ""

# Use the new secure credentials
NEW_USERNAME="adrata"
NEW_PASSWORD="npg_F4Y0IJrNUjEv"

# Construct new DATABASE_URL
NEW_DATABASE_URL="postgresql://${NEW_USERNAME}:${NEW_PASSWORD}@ep-damp-math-a8ht5oj3.eastus2.azure.neon.tech/neondb?sslmode=require&pgbouncer=true&connection_limit=20&pool_timeout=20&statement_timeout=30000"

echo ""
echo "🔧 Updating database credentials in all .env files..."

# Find all .env files and update DATABASE_URL
find . -name "*.env*" -not -name "*.example" -not -name "*.template" | while read file; do
    if [ -f "$file" ] && grep -q "DATABASE_URL" "$file"; then
        echo "📝 Updating: $file"
        # Create backup
        cp "$file" "${file}.backup.$(date +%Y%m%d_%H%M%S)"
        # Update DATABASE_URL
        sed -i.tmp "s|DATABASE_URL=.*|DATABASE_URL=\"${NEW_DATABASE_URL}\"|g" "$file"
        rm -f "${file}.tmp"
    fi
done

echo ""
echo "✅ Database credentials updated in all .env files!"
echo ""
echo "🧪 NEXT STEPS:"
echo "1. Test the connection: node scripts/security/test-new-database-user.js"
echo "2. Start your application and verify it works"
echo "3. If everything works, delete the old database user in Neon Console"
echo ""
echo "🔐 Database security upgrade completed!"
