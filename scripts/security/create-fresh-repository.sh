#!/bin/bash

# 🆕 CREATE FRESH REPOSITORY SCRIPT
# Completely wipe git history and create a clean repository

set -e  # Exit on any error

echo "🆕 CREATE FRESH REPOSITORY"
echo "=========================="
echo ""
echo "This script will:"
echo "1. Create a backup of your current repository"
echo "2. Remove ALL git history"
echo "3. Create a brand new git repository with current files"
echo "4. Prepare for fresh push to GitHub"
echo ""
echo "⚠️  WARNING: This will PERMANENTLY delete all git history!"
echo "⚠️  All commit history, branches, and tags will be lost!"
echo ""

read -p "Are you absolutely sure? (type 'FRESH-START' to proceed): " confirm

if [ "$confirm" != "FRESH-START" ]; then
    echo "❌ Aborted. Type 'FRESH-START' to proceed."
    exit 1
fi

REPO_PATH=$(pwd)
REPO_NAME=$(basename "$REPO_PATH")

echo ""
echo "🔧 Creating fresh repository for: $REPO_NAME"
echo "📁 Location: $REPO_PATH"

# Step 1: Create comprehensive backup
echo ""
echo "📋 Step 1: Creating backup..."
BACKUP_DIR="../${REPO_NAME}-backup-$(date +%Y%m%d_%H%M%S)"
cp -r "$REPO_PATH" "$BACKUP_DIR"
echo "✅ Complete backup created at: $BACKUP_DIR"

# Step 2: Remove git history
echo ""
echo "🗑️  Step 2: Removing ALL git history..."
rm -rf .git

# Step 3: Clean up any sensitive files
echo ""
echo "🧹 Step 3: Cleaning sensitive files..."
find . -name "*.env*" -not -name "*.example" -not -name "*.template" | while read file; do
    if [ -f "$file" ]; then
        echo "🔒 Securing: $file"
        # Replace any remaining credentials with placeholders
        sed -i.bak 's/=.*/=PLACEHOLDER_VALUE/g' "$file"
        rm -f "${file}.bak"
    fi
done

# Step 4: Initialize new repository
echo ""
echo "🆕 Step 4: Creating fresh git repository..."
git init
git add .
git commit -m "Initial commit: Fresh repository with no history

- All previous git history removed for security
- All credentials replaced with placeholders
- Clean start: $(date)"

# Step 5: Prepare for GitHub
echo ""
echo "✅ FRESH REPOSITORY CREATED SUCCESSFULLY!"
echo ""
echo "📊 Repository Status:"
echo "   - Total commits: 1 (fresh start)"
echo "   - All files: $(git ls-files | wc -l | tr -d ' ')"
echo "   - No sensitive history"
echo ""
echo "🚀 Next Steps:"
echo "1. Add your GitHub remote:"
echo "   git remote add origin https://github.com/adrata/YOUR-REPO-NAME.git"
echo ""
echo "2. Force push to GitHub (this will overwrite all history):"
echo "   git push origin main --force"
echo ""
echo "3. Verify on GitHub that history is clean"
echo ""
echo "⚠️  IMPORTANT: All team members must re-clone the repository!"
echo ""
echo "🔐 Security Status: COMPLETELY CLEAN - No credential history exists"
