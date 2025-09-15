#!/bin/bash

# 🎨 FINAL TERMINAL PROMPT FIX
# This script checks for themes and system overrides

echo "🎨 Final Terminal Prompt Fix..."
echo "==============================="

# Check for Oh My Zsh
if [ -d "$HOME/.oh-my-zsh" ]; then
    echo "🔍 Found Oh My Zsh installation"
    echo "📝 You may need to set a custom theme or override the prompt"
fi

# Check for other prompt themes
echo "🔍 Checking for prompt themes..."
ls -la ~/.zsh* 2>/dev/null | grep -E "(theme|prompt)"

# Check what's actually setting the prompt
echo "🔍 Checking prompt functions..."
type precmd 2>/dev/null || echo "No precmd function found"
type prompt 2>/dev/null || echo "No prompt function found"

# Force override with a more aggressive approach
echo "🧹 Force overriding prompt..."
cat >> ~/.zshrc << 'EOF'

# Force custom prompt (overrides everything)
autoload -U promptinit; promptinit
export PS1="adrata %% "
export PROMPT="adrata %% "
export RPROMPT=""

# Override any theme functions
precmd() {
    export PS1="adrata %% "
    export PROMPT="adrata %% "
}
EOF

# Also try setting it in the current session
export PS1="adrata %% "
export PROMPT="adrata %% "

echo "✅ Force override applied!"
echo "🎯 Your prompt should now show: adrata % "
echo ""
echo "💡 If it still doesn't work, try:"
echo "   1. Restart VS Code completely"
echo "   2. Open a new terminal window"
echo "   3. Run: source ~/.zshrc"



