#!/bin/bash

# 🧹 Simple Git History Cleanup Script
# 
# This script removes sensitive data from Git history using git filter-branch
# ⚠️  WARNING: This will rewrite Git history - make sure to coordinate with your team!

echo "🧹 Git History Cleanup - Remove Sensitive Data (Simple Method)"
echo "============================================================="
echo ""
echo "⚠️  WARNING: This will rewrite Git history!"
echo "⚠️  Make sure all team members are aware before proceeding."
echo ""

# List of sensitive patterns to remove
SENSITIVE_PATTERNS=(
    # Database URLs
    "postgresql://neondb_owner:npg_DtnFYHvWj6m8@ep-damp-math-a8ht5oj3.eastus2.azure.neon.tech/neondb"
    "postgresql://neondb_owner:r8l48vRPdacb@ep-damp-math-a8ht5oj3.eastus2.azure.neon.tech/neondb"
    "postgresql://neondb_owner:npg_xsDd5H6NUtSm@ep-tiny-sky-a8zvnemb.eastus2.azure.neon.tech/neondb"
    "postgresql://neondb_owner:npg_jdnNpCH0si6T@ep-yellow-butterfly-a8jr2jxz.eastus2.azure.neon.tech/neondb"
    "postgresql://neondb_owner:npg_VKvSsd4Ay5ah@ep-twilight-flower-a84fjbo5.eastus2.azure.neon.tech/neondb"
    "postgresql://rosssylvester:Themill08!@localhost:5432/adrata-local"
    
    # API Keys
    "CREDENTIAL_REMOVED_FOR_SECURITY"
    "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"
    "brd-customer-hl_5f8c5b8b-zone-datacenter_proxy1-country-us"
    "7b01d6f148d5f428222d8c59c03b55a62205ed435b4a32ee64c6e0c28b2c9f8e"
    "kQ4dvYc6FsziGfyyi2guBL9t"
    "623e10c8-f2b4dee4"
    "CREDENTIAL_REMOVED_FOR_SECURITY"
    "CREDENTIAL_REMOVED_FOR_SECURITY"
    
    # Vercel IDs
    "team_2gElE5Xr5RnI4KCjMhqA4O2C"
    "prj_XCF7tJDVK9P4dH5kq8bNgI1mZ6wA"
    "prj_YBH8uKEWL0Q5eI6lr9cOhJ2nA7xB"
    "prj_ZCI9vLFXM1R6fJ7ms0dPiK3oB8yC"
    "prj_ADJ0wMGYN2S7gK8nt1eQjL4pC9zD"
    
    # Secrets
    "adrata-production-secret-2025-ultra-secure"
    "adrata-jwt-production-2025-ultra-secure"
    "adrata-encryption-production-key-32"
)

echo "🔍 The following sensitive patterns will be removed from Git history:"
echo "   - Database URLs with credentials"
echo "   - API keys (OpenAI, Anthropic, BrightData, etc.)"
echo "   - Vercel tokens and project IDs"
echo "   - Authentication secrets"
echo ""

read -p "❓ Do you want to proceed with cleaning Git history? (y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Cleanup cancelled"
    exit 0
fi

echo ""
echo "🚀 Starting Git history cleanup..."
echo ""

# Step 1: Create a backup branch
echo "📦 Creating backup branch..."
git branch backup-before-cleanup-$(date +%Y%m%d-%H%M%S) 2>/dev/null || echo "Backup branch already exists"
echo "✅ Created backup branch"
echo ""

# Step 2: Create sed script for replacements
echo "📝 Creating replacement script..."
SED_SCRIPT="/tmp/git-cleanup-sed-script"
echo "#!/bin/sed -f" > "$SED_SCRIPT"

for pattern in "${SENSITIVE_PATTERNS[@]}"; do
    # Escape special characters for sed
    escaped_pattern=$(echo "$pattern" | sed 's/[[\.*^$()+?{|]/\\&/g')
    echo "s|$escaped_pattern|[REDACTED]|g" >> "$SED_SCRIPT"
done

chmod +x "$SED_SCRIPT"

# Step 3: Use git filter-branch to clean history
echo "🧹 Cleaning Git history (this may take a while)..."
git filter-branch --tree-filter "
    find . -type f -name '*.js' -o -name '*.ts' -o -name '*.sh' -o -name '*.json' -o -name '*.md' | 
    xargs -I {} sed -i.bak -f '$SED_SCRIPT' {} 2>/dev/null || true
    find . -name '*.bak' -delete 2>/dev/null || true
" --prune-empty -- --all

echo ""
echo "🔄 Cleaning up Git references..."
git for-each-ref --format='delete %(refname)' refs/original | git update-ref --stdin
git reflog expire --expire=now --all
git gc --prune=now --aggressive

echo ""
echo "✅ Git history cleanup completed!"
echo ""
echo "📋 Next steps:"
echo "   1. Review the changes: git log --oneline -10"
echo "   2. Test your application to ensure everything works"
echo "   3. Force push to update remote: git push --force-with-lease origin main"
echo "   4. Notify team members to re-clone the repository"
echo "   5. Rotate any exposed API keys and credentials"
echo ""
echo "⚠️  Important: All team members must re-clone the repository!"
echo "⚠️  Old clones will have the sensitive data in their history."
echo ""

# Cleanup
rm -f "$SED_SCRIPT"

echo "🎉 Cleanup script completed!"
echo ""
echo "🔍 Checking for any remaining sensitive data..."
echo "Searching for database URLs..."
git log --all -S "postgresql://" --oneline | head -5
echo ""
echo "Searching for API keys..."
git log --all -S "sk-proj-" --oneline | head -5
git log --all -S "sk-ant-" --oneline | head -5

echo ""
echo "If you see any results above, some sensitive data may still be present."
echo "You may need to run additional cleanup or use more advanced tools."
