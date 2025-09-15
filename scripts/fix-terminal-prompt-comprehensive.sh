#!/bin/bash

# 🎨 COMPREHENSIVE TERMINAL PROMPT FIX
# This script fixes the prompt by checking all possible configuration files

echo "🎨 Comprehensive Terminal Prompt Fix..."
echo "======================================="

# Check what shell we're using
echo "🔍 Current shell: $SHELL"

# Check current PS1
echo "🔍 Current PS1: $PS1"

# Backup all possible config files
echo "📋 Backing up configuration files..."
cp ~/.zshrc ~/.zshrc.backup.$(date +%Y%m%d_%H%M%S) 2>/dev/null || echo "No .zshrc found"
cp ~/.zprofile ~/.zprofile.backup.$(date +%Y%m%d_%H%M%S) 2>/dev/null || echo "No .zprofile found"
cp ~/.bash_profile ~/.bash_profile.backup.$(date +%Y%m%d_%H%M%S) 2>/dev/null || echo "No .bash_profile found"

# Remove PS1 from all config files
echo "🧹 Removing PS1 from all config files..."
sed -i '' '/export PS1=/d' ~/.zshrc 2>/dev/null
sed -i '' '/export PS1=/d' ~/.zprofile 2>/dev/null
sed -i '' '/export PS1=/d' ~/.bash_profile 2>/dev/null

# Add the prompt to the most likely file
echo "✨ Adding clean prompt to .zshrc..."
echo '' >> ~/.zshrc
echo '# Custom prompt for Adrata project' >> ~/.zshrc
echo 'export PS1="adrata %% "' >> ~/.zshrc

# Also add to .zprofile (often loaded after .zshrc)
echo "✨ Adding clean prompt to .zprofile..."
echo '' >> ~/.zprofile
echo '# Custom prompt for Adrata project' >> ~/.zprofile
echo 'export PS1="adrata %% "' >> ~/.zprofile

# Force reload
echo "🔄 Force reloading configuration..."
exec zsh

echo "✅ Script completed!"
echo "🎯 Your prompt should now show: adrata % "



