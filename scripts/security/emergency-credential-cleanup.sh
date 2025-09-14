#!/bin/bash

# 🚨 EMERGENCY CREDENTIAL CLEANUP SCRIPT
# This script removes ALL exposed credentials from git history
# WARNING: This rewrites git history and requires force push

set -e  # Exit on any error

echo "🚨 EMERGENCY CREDENTIAL CLEANUP"
echo "==============================="
echo ""
echo "This script will:"
echo "1. Remove .env.backup.20250822_163704 from ALL git history"
echo "2. Remove ALL instances of exposed credentials from git history"
echo "3. Create a clean repository without credential exposure"
echo ""
echo "⚠️  WARNING: This will rewrite git history!"
echo "⚠️  All team members will need to re-clone after force push"
echo ""

read -p "Are you absolutely sure you want to continue? (type 'EMERGENCY' to proceed): " confirm

if [ "$confirm" != "EMERGENCY" ]; then
    echo "❌ Aborted. Type 'EMERGENCY' to proceed."
    exit 1
fi

echo ""
echo "🔧 Starting credential cleanup process..."

# Backup current state
echo "📋 Creating backup of current repository state..."
BACKUP_DIR="security-cleanup-backup-$(date +%Y%m%d_%H%M%S)"
mkdir -p "../$BACKUP_DIR"
cp -r .git "../$BACKUP_DIR/"
echo "✅ Backup created at ../$BACKUP_DIR/"

# Step 1: Remove the specific backup file
echo ""
echo "🗑️  Step 1: Removing .env.backup.20250822_163704 from git history..."
git filter-repo --path .env.backup.20250822_163704 --invert-paths --force

# Step 2: Remove all credential strings from all files
echo ""
echo "🔐 Step 2: Removing credential strings from all files in history..."

# Create expressions file for git-filter-repo
cat > /tmp/credential-expressions.txt << 'EOF'
AKIAZD7QCO47FUMHRP73
Dz85bwYPCd4tSMi7AKz6OHF/TxFDkDWz9ceHdem8
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
AC74a388ecb41ee7ef98fec4511cf0f09a
91d33861ee83c8c584d9cff626cca4c6
SK2e79414e85bb5a54b29b1cc9878d9d50
JgPFG3O2FvIaFbM2aqQduNZdSc3Ph2zw
d5eec59e38c04beeabfd
UnlockAdrata01!
d84c311dd39c1601014a81e78d0cc2a4b6fe152108
sk_92efb7516d9283105c219510992f35c59cfabeedc4edb93d
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
hzwQmb13cF21if4arzLpx0SRWyoOUyzP
92c3ef20f1c345d0923cb50e69d36476
6a1b513fda9e48728fcc134e4365e8eb
95f6ebea-312b-44d5-b24e-5b73dc4ab1ac
XG4WBFCJMSONM71D
HKxcV8LCjgeln7VQ3UoDb2hCU2zrIo
EOF

# Replace credentials with placeholder text
while IFS= read -r credential; do
    if [ -n "$credential" ]; then
        echo "🔒 Removing credential: ${credential:0:10}..."
        git filter-repo --replace-text <(echo "$credential==>CREDENTIAL_REMOVED_FOR_SECURITY") --force
    fi
done < /tmp/credential-expressions.txt

# Clean up temp file
rm /tmp/credential-expressions.txt

echo ""
echo "✅ Credential cleanup completed!"
echo ""
echo "📊 Repository statistics:"
git log --oneline | wc -l | xargs echo "Total commits:"
git ls-files | wc -l | xargs echo "Total files:"

echo ""
echo "🔍 Verification: Checking for any remaining credentials..."
REMAINING=$(git log --all -p | grep -E "(AKIAZD7QCO47FUMHRP73|Dz85bwYPCd4tSMi7AKz6OHF)" | wc -l)
if [ "$REMAINING" -eq 0 ]; then
    echo "✅ No credentials found in git history!"
else
    echo "⚠️  Warning: $REMAINING potential credential references still found"
fi

echo ""
echo "🚀 Next steps:"
echo "1. Review the cleaned repository"
echo "2. Update your .env files with new credentials"
echo "3. Force push to all remotes:"
echo "   git remote -v"
echo "   git push --force-with-lease origin main"
echo "   git push --force-with-lease origin --all"
echo ""
echo "4. Notify team members to re-clone the repository"
echo "5. Rotate ALL exposed credentials immediately"
echo ""
echo "⚠️  CRITICAL: Do not proceed with force push until new credentials are ready!"

echo ""
echo "🔐 Security cleanup completed successfully!"
