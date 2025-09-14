#!/bin/bash

# 🍎 BUILD NOTARIZED MACOS APP
# This script builds and notarizes the macOS app for distribution

set -e

echo "🍎 Building Notarized macOS App"
echo "==============================="
echo ""

# Configuration
APP_NAME="Adrata"
BUNDLE_ID="com.adrata.desktop"
DEVELOPER_ID="Developer ID Application"
NOTARIZATION_PROFILE="adrata-notarization"

# Check if we're on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "❌ This script only works on macOS"
    exit 1
fi

# Check for demo mode
DEMO_MODE=""
if [[ "$1" == "demo" ]]; then
    DEMO_MODE="demo"
    echo "🎭 Demo mode enabled"
    echo ""
fi

# Function to check prerequisites
check_prerequisites() {
    echo "🔍 Checking prerequisites..."
    
    # Check for Xcode Command Line Tools
    if ! xcode-select -p &> /dev/null; then
        echo "❌ Xcode Command Line Tools not installed"
        echo "   Run: xcode-select --install"
        exit 1
    fi
    
    # Check for signing identity
    if ! security find-identity -v -p codesigning | grep -q "$DEVELOPER_ID"; then
        echo "⚠️  Developer ID not found - app will not be signed"
        echo "   Install your Developer ID certificate in Keychain"
    else
        echo "✅ Code signing identity found"
    fi
    
    # Check for notarization profile
    if ! xcrun notarytool store-credentials --list | grep -q "$NOTARIZATION_PROFILE"; then
        echo "⚠️  Notarization profile not found - app will not be notarized"
        echo "   Run: xcrun notarytool store-credentials"
    else
        echo "✅ Notarization profile found"
    fi
    
    echo "✅ Prerequisites check completed"
    echo ""
}

# Function to clean previous builds
clean_build() {
    echo "🧹 Cleaning previous builds..."
    
    npm run clean:full
    
    echo "✅ Build cleaned"
    echo ""
}

# Function to build the app
build_app() {
    echo "🔨 Building application..."
    
    if [[ "$DEMO_MODE" == "demo" ]]; then
        npm run desktop:build:demo
    else
        npm run desktop:build
    fi
    
    echo "✅ Application built"
    echo ""
}

# Function to sign the app
sign_app() {
    echo "🔐 Signing application..."
    
    # Find the app bundle
    APP_PATH=""
    if [[ "$DEMO_MODE" == "demo" ]]; then
        APP_PATH=$(find src-tauri/target -name "*.app" -path "*/demo/*" | head -n 1)
    else
        APP_PATH=$(find src-tauri/target -name "*.app" | head -n 1)
    fi
    
    if [[ -z "$APP_PATH" ]]; then
        echo "❌ App bundle not found"
        exit 1
    fi
    
    echo "📍 Found app: $APP_PATH"
    
    # Sign the app
    if security find-identity -v -p codesigning | grep -q "$DEVELOPER_ID"; then
        echo "🔐 Signing with Developer ID..."
        
        codesign --force --options runtime --deep --sign "$DEVELOPER_ID" "$APP_PATH"
        
        # Verify signature
        codesign --verify --verbose "$APP_PATH"
        
        echo "✅ Application signed successfully"
    else
        echo "⚠️  Skipping signing - no Developer ID found"
    fi
    
    echo ""
}

# Function to create DMG
create_dmg() {
    echo "📦 Creating DMG..."
    
    # Run DMG creation fixes
    npm run postdesktop:build
    
    echo "✅ DMG created"
    echo ""
}

# Function to notarize the app
notarize_app() {
    echo "📋 Notarizing application..."
    
    # Find the DMG
    DMG_PATH=$(find src-tauri/target -name "*.dmg" | head -n 1)
    
    if [[ -z "$DMG_PATH" ]]; then
        echo "⚠️  DMG not found - skipping notarization"
        return
    fi
    
    echo "📍 Found DMG: $DMG_PATH"
    
    # Check if notarization profile exists
    if xcrun notarytool store-credentials --list | grep -q "$NOTARIZATION_PROFILE"; then
        echo "📋 Submitting for notarization..."
        
        # Submit for notarization
        SUBMISSION_ID=$(xcrun notarytool submit "$DMG_PATH" --keychain-profile "$NOTARIZATION_PROFILE" --wait --output-format json | jq -r '.id')
        
        if [[ "$SUBMISSION_ID" != "null" && -n "$SUBMISSION_ID" ]]; then
            echo "✅ Notarization submitted: $SUBMISSION_ID"
            
            # Wait for notarization to complete
            echo "⏳ Waiting for notarization to complete..."
            xcrun notarytool wait "$SUBMISSION_ID" --keychain-profile "$NOTARIZATION_PROFILE"
            
            # Staple the notarization
            echo "📎 Stapling notarization..."
            xcrun stapler staple "$DMG_PATH"
            
            echo "✅ Application notarized and stapled successfully"
        else
            echo "❌ Notarization submission failed"
            exit 1
        fi
    else
        echo "⚠️  Skipping notarization - no profile found"
    fi
    
    echo ""
}

# Function to validate the final build
validate_build() {
    echo "🔍 Validating final build..."
    
    # Find the final DMG
    DMG_PATH=$(find src-tauri/target -name "*.dmg" | head -n 1)
    
    if [[ -n "$DMG_PATH" ]]; then
        echo "✅ Final DMG: $DMG_PATH"
        
        # Get file size
        DMG_SIZE=$(du -h "$DMG_PATH" | cut -f1)
        echo "📦 DMG Size: $DMG_SIZE"
        
        # Check signature
        if codesign -v "$DMG_PATH" 2>/dev/null; then
            echo "✅ DMG is properly signed"
        else
            echo "⚠️  DMG is not signed"
        fi
        
        # Check notarization
        if spctl -a -t open --context context:primary-signature -v "$DMG_PATH" 2>/dev/null; then
            echo "✅ DMG is notarized"
        else
            echo "⚠️  DMG is not notarized"
        fi
        
        # Copy to desktop for easy access
        DESKTOP_PATH="$HOME/Desktop/$(basename "$DMG_PATH")"
        cp "$DMG_PATH" "$DESKTOP_PATH"
        echo "📋 Copied to Desktop: $DESKTOP_PATH"
        
    else
        echo "❌ No DMG found"
        exit 1
    fi
    
    echo ""
}

# Main execution
main() {
    check_prerequisites
    clean_build
    build_app
    sign_app
    create_dmg
    notarize_app
    validate_build
    
    echo "🎉 NOTARIZED BUILD COMPLETE!"
    echo "==========================="
    echo ""
    echo "✅ Your notarized Adrata app is ready for distribution"
    echo "📦 DMG location: Desktop"
    echo ""
    echo "🚀 Ready to distribute to users!"
}

# Run main function
main "$@"
