#!/bin/bash

# Script to update database credentials across all environment files
# Run this AFTER creating new database user in Neon Console

echo "🔐 DATABASE CREDENTIAL UPDATE SCRIPT"
echo "===================================="
echo ""

# SECURITY: Never hardcode credentials in scripts
# Get credentials from environment variables or prompt user
if [ -z "$NEW_DATABASE_USERNAME" ] || [ -z "$NEW_DATABASE_PASSWORD" ]; then
    echo "❌ ERROR: NEW_DATABASE_USERNAME and NEW_DATABASE_PASSWORD must be set as environment variables"
    echo "Usage: NEW_DATABASE_USERNAME=username NEW_DATABASE_PASSWORD=password ./update-database-credentials.sh"
    exit 1
fi

NEW_USERNAME="$NEW_DATABASE_USERNAME"
NEW_PASSWORD="$NEW_DATABASE_PASSWORD"

# Get database host from environment or use default
DB_HOST="${DATABASE_HOST:-ep-damp-math-a8ht5oj3.eastus2.azure.neon.tech}"
DB_NAME="${DATABASE_NAME:-neondb}"

# Construct new DATABASE_URL
NEW_DATABASE_URL="postgresql://${NEW_USERNAME}:${NEW_PASSWORD}@${DB_HOST}/${DB_NAME}?sslmode=require&pgbouncer=true&connection_limit=20&pool_timeout=20&statement_timeout=30000"

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
