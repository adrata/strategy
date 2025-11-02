#!/bin/bash

# 🔧 Fix Tauri DMG Bundling Issue
# This script fixes the "Not enough arguments" error in Tauri's DMG creation

echo "🔧 Tauri DMG Bundling Fix"
echo "========================"
echo ""

PROJECT_ROOT="/Users/rosssylvester/Development/adrata"
BUNDLE_DIR="$PROJECT_ROOT/src-desktop/target/universal-apple-darwin/release/bundle"
DMG_DIR="$BUNDLE_DIR/dmg"
MACOS_DIR="$BUNDLE_DIR/macos"
APP_NAME="Adrata.app"

# Check if build exists
if [ ! -d "$MACOS_DIR/$APP_NAME" ]; then
    echo "❌ App not found. Run 'npm run desktop:build' first"
    exit 1
fi

echo "✅ Found app bundle: $MACOS_DIR/$APP_NAME"
echo ""

# The issue: Tauri's bundle_dmg.sh script expects arguments but doesn't get them
# Solution: Run the script with proper arguments manually

echo "🔍 Diagnosing DMG bundling issue..."

if [ -f "$DMG_DIR/bundle_dmg.sh" ]; then
    echo "✅ Found bundle_dmg.sh script"
    
    # Check if script is executable
    if [ -x "$DMG_DIR/bundle_dmg.sh" ]; then
        echo "✅ Script is executable"
    else
        echo "⚠️  Making script executable..."
        chmod +x "$DMG_DIR/bundle_dmg.sh"
    fi
    
    echo ""
    echo "🔧 Running DMG creation with proper arguments..."
    
    cd "$DMG_DIR"
    
    # Create DMG with proper arguments that Tauri should have provided
    ./bundle_dmg.sh \
        --volname "Adrata WebRTC v1.0.2" \
        --volicon "icon.icns" \
        --window-size 600 400 \
        --icon-size 100 \
        --icon "$APP_NAME" 150 200 \
        --app-drop-link 450 200 \
        "Adrata_WebRTC_v1.0.2_Fixed.dmg" \
        "$MACOS_DIR"
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ DMG created successfully!"
        echo "📍 Location: $DMG_DIR/Adrata_WebRTC_v1.0.2_Fixed.dmg"
        
        # Copy to desktop for easy access
        cp "Adrata_WebRTC_v1.0.2_Fixed.dmg" ~/Desktop/
        echo "📋 Copied to Desktop: ~/Desktop/Adrata_WebRTC_v1.0.2_Fixed.dmg"
        
        # Show file info
        echo ""
        echo "📊 DMG Info:"
        ls -lh "Adrata_WebRTC_v1.0.2_Fixed.dmg"
        
        echo ""
        echo "🎉 DMG bundling issue FIXED!"
        echo ""
        echo "🚀 To prevent this issue in future builds:"
        echo "1. Use this script after each build"
        echo "2. Or use the simple hdiutil method: hdiutil create -srcfolder Adrata.app Adrata.dmg"
        echo ""
        
        # Open DMG for verification
        echo "🔍 Opening DMG for verification..."
        open ~/Desktop/Adrata_WebRTC_v1.0.2_Fixed.dmg
        
    else
        echo "❌ DMG creation failed"
        echo ""
        echo "💡 Alternative solution: Use simple hdiutil method"
        echo "cd ~/Desktop"
        echo "hdiutil create -srcfolder Adrata.app -volname 'Adrata WebRTC v1.0.2' Adrata_Simple.dmg"
    fi
    
else
    echo "❌ bundle_dmg.sh script not found"
    echo "💡 This means the build didn't reach the DMG bundling stage"
fi

echo ""
echo "🎯 Your WebRTC calling app is ready to test!"
echo "• App: ~/Desktop/Adrata.app"
echo "• DMG: ~/Desktop/Adrata_WebRTC_v1.0.2.dmg"
echo "• Fixed DMG: ~/Desktop/Adrata_WebRTC_v1.0.2_Fixed.dmg (if created)" 