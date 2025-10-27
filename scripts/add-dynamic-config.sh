#!/bin/bash

# Script to add dynamic configuration to all API routes that don't have it

echo "🔧 Adding dynamic configuration to API routes..."

# Find all route.ts files that don't have dynamic configuration
files=$(find src/app/api -name "route.ts" -not -path "*/complete-backup" -not -path "*/comprehensive-backup" -exec grep -L "export const dynamic" {} \;)

count=0
for file in $files; do
  # Add the dynamic configuration after the imports
  sed -i '' '/^import.*$/a\
\
// Required for static export compatibility\
export const dynamic = "force-static";' "$file"
  
  count=$((count + 1))
done

echo "✅ Added dynamic configuration to $count API route files"
