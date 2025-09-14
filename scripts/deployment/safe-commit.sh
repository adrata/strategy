#!/bin/bash

# 🛡️ SAFE GIT COMMIT SCRIPT
# Prevents quote/escaping issues by using file-based commits
# Usage: ./safe-commit.sh "Your commit message here"

set -e

# Create temporary file for commit message
COMMIT_MSG_FILE=$(mktemp)

# Function to cleanup on exit
cleanup() {
    rm -f "$COMMIT_MSG_FILE"
}
trap cleanup EXIT

# Check if message provided
if [ $# -eq 0 ]; then
    echo "❌ Error: Please provide a commit message"
    echo "Usage: $0 \"Your commit message here\""
    exit 1
fi

# Write commit message to temporary file
echo "$1" > "$COMMIT_MSG_FILE"

echo "📝 Commit message:"
echo "==================="
cat "$COMMIT_MSG_FILE"
echo "==================="
echo ""

# Ask for confirmation
read -p "🤔 Proceed with commit? (y/N): " -r
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Commit cancelled"
    exit 1
fi

# Commit using file (avoids all quote issues)
echo "💾 Committing changes..."
git commit -F "$COMMIT_MSG_FILE"

echo "✅ Commit successful!"

# Ask about pushing
read -p "🚀 Push to GitHub? (y/N): " -r
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📤 Pushing to GitHub..."
    git push
    echo "✅ Push successful!"
else
    echo "ℹ️  You can push later with: git push"
fi 