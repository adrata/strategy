#!/bin/bash

# 🚨 PIPELINE CREDENTIAL CLEANUP SCRIPT
# Clean remaining credentials from adrata-pipeline-deploy directory in git history

set -e  # Exit on any error

echo "🚨 PIPELINE CREDENTIAL CLEANUP"
echo "=============================="
echo ""
echo "This script will:"
echo "1. Remove remaining AWS credentials from adrata-pipeline-deploy/ directory history"
echo "2. Replace credential strings with CREDENTIAL_REMOVED_FOR_SECURITY"
echo ""
echo "⚠️  WARNING: This will rewrite git history!"
echo ""

read -p "Are you sure you want to continue? (type 'PIPELINE' to proceed): " confirm

if [ "$confirm" != "PIPELINE" ]; then
    echo "❌ Aborted. Type 'PIPELINE' to proceed."
    exit 1
fi

echo ""
echo "🔧 Starting pipeline credential cleanup..."

# Backup current state
echo "📋 Creating backup of current repository state..."
BACKUP_DIR="pipeline-cleanup-backup-$(date +%Y%m%d_%H%M%S)"
mkdir -p "../$BACKUP_DIR"
cp -r .git "../$BACKUP_DIR/"
echo "✅ Backup created at ../$BACKUP_DIR/"

# Remove specific credential strings from all files
echo ""
echo "🔐 Removing credential strings from git history..."

# Create expressions file for git-filter-repo
cat > /tmp/pipeline-credential-expressions.txt << 'EOF'
AKIAZD7QCO47FUMHRP73
Dz85bwYPCd4tSMi7AKz6OHF/TxFDkDWz9ceHdem8
EOF

# Replace credentials with placeholder text
while IFS= read -r credential; do
    if [ -n "$credential" ]; then
        echo "🔒 Removing credential: ${credential:0:10}..."
        git filter-repo --replace-text <(echo "$credential==>CREDENTIAL_REMOVED_FOR_SECURITY") --force
    fi
done < /tmp/pipeline-credential-expressions.txt

# Clean up temp file
rm /tmp/pipeline-credential-expressions.txt

echo ""
echo "✅ Pipeline credential cleanup completed!"
echo ""
echo "🔍 Verification: Checking for any remaining credentials..."
REMAINING=$(git log --all -p -- adrata-pipeline-deploy/ | grep -E "(AKIAZD7QCO47FUMHRP73|Dz85bwYPCd4tSMi7AKz6OHF)" | wc -l)
if [ "$REMAINING" -eq 0 ]; then
    echo "✅ No credentials found in pipeline directory history!"
else
    echo "⚠️  Warning: $REMAINING potential credential references still found"
fi

echo ""
echo "🚀 Next steps:"
echo "1. Force push to GitHub: git push origin main --force"
echo "2. Verify cleanup on GitHub"
echo ""
echo "🔐 Pipeline cleanup completed successfully!"
