#!/bin/bash

# Script to fix duplicate dynamic configurations in API routes

echo "🔧 Fixing duplicate dynamic configurations..."

# Find all route.ts files and fix them
find src/app/api -name "route.ts" -not -path "*/complete-backup" -not -path "*/comprehensive-backup" | while read file; do
  # Check if file has duplicate dynamic exports
  if grep -q "export const dynamic.*export const dynamic" "$file"; then
    echo "Fixing: $file"
    
    # Create a temporary file with the fixed content
    temp_file=$(mktemp)
    
    # Process the file line by line
    in_imports=true
    dynamic_added=false
    
    while IFS= read -r line; do
      # If we're still in imports and hit a non-import line, add dynamic config
      if [ "$in_imports" = true ] && [[ ! "$line" =~ ^import ]] && [[ ! "$line" =~ ^$ ]] && [[ ! "$line" =~ ^// ]]; then
        if [ "$dynamic_added" = false ]; then
          echo "" >> "$temp_file"
          echo "// Required for static export compatibility" >> "$temp_file"
          echo "export const dynamic = \"force-static\";" >> "$temp_file"
          echo "" >> "$temp_file"
          dynamic_added=true
        fi
        in_imports=false
      fi
      
      # Skip duplicate dynamic exports
      if [[ "$line" =~ "export const dynamic" ]] && [ "$dynamic_added" = true ]; then
        continue
      fi
      
      echo "$line" >> "$temp_file"
    done < "$file"
    
    # Replace the original file
    mv "$temp_file" "$file"
  fi
done

echo "✅ Fixed duplicate dynamic configurations"
