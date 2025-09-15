#!/bin/bash

# 🔧 INSTALL NVM AND FIX NODE.JS VERSION
echo "🔧 Installing NVM and fixing Node.js version..."

# Install nvm if not present
if ! command -v nvm &> /dev/null; then
    echo "📦 Installing nvm..."
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
    
    # Reload shell configuration
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
    
    echo "✅ nvm installed"
else
    echo "✅ nvm already installed"
fi

# Install and use Node.js 18.20.4
echo "📋 Installing Node.js 18.20.4..."
nvm install 18.20.4
nvm use 18.20.4
nvm alias default 18.20.4

echo "✅ Node.js version fixed!"
echo "Current Node.js version: $(node --version)"

# Test npm
echo "📦 npm version: $(npm --version)"

echo "🎉 Setup complete! Restart your terminal or VS Code/Cursor."

