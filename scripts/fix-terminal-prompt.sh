#!/bin/bash

# 🎨 FIX TERMINAL PROMPT SCRIPT
# This script sets up a clean "adrata % " prompt permanently

echo "🎨 Fixing Terminal Prompt..."
echo "============================="

# Backup the current .zshrc file
echo "📋 Backing up current .zshrc..."
cp ~/.zshrc ~/.zshrc.backup.$(date +%Y%m%d_%H%M%S)

# Remove any existing PS1 exports
echo "🧹 Removing existing PS1 settings..."
sed -i '' '/export PS1=/d' ~/.zshrc

# Add the clean prompt at the end
echo "✨ Adding clean 'adrata % ' prompt..."
echo '' >> ~/.zshrc
echo '# Custom prompt for Adrata project' >> ~/.zshrc
echo 'export PS1="adrata %% "' >> ~/.zshrc

# Reload the configuration
echo "🔄 Reloading shell configuration..."
source ~/.zshrc

echo ""
echo "✅ Terminal prompt fixed!"
echo "🎯 Your prompt should now show: adrata % "
echo ""
echo "📝 Changes made:"
echo "   - Removed duplicate PS1 settings"
echo "   - Added clean 'adrata % ' prompt"
echo "   - Reloaded shell configuration"
echo ""
echo "💡 To test: Open a new terminal or run 'source ~/.zshrc'"
echo "🔄 Backup saved as: ~/.zshrc.backup.$(date +%Y%m%d_%H%M%S)"







