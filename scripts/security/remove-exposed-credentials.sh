#!/bin/bash

# Emergency script to remove exposed credentials from git history
# WARNING: This will rewrite git history - coordinate with team first

echo "🚨 EMERGENCY: Removing exposed credentials from git history"
echo "⚠️  WARNING: This will rewrite git history and require force push"
echo ""

read -p "Are you sure you want to continue? This cannot be undone. (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Aborted."
    exit 1
fi

echo "🔧 Removing .env.backup.20250822_163704 from git history..."

# Use git filter-repo to remove the file from all history
git filter-repo --path .env.backup.20250822_163704 --invert-paths

echo "✅ File removed from git history"
echo ""
echo "🚀 Next steps:"
echo "1. Force push to all remotes: git push --force-with-lease --all"
echo "2. Notify all team members to re-clone the repository"
echo "3. Update all environment variables immediately"
echo ""
echo "⚠️  CRITICAL: All team members must re-clone the repo after force push"
