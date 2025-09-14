#!/bin/bash

# 📋 NOTARIZE APP
# This script notarizes the built macOS application

set -e

echo "📋 Notarizing macOS Application"
echo "==============================="
echo ""

# Check if we're on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "❌ This script only works on macOS"
    exit 1
fi

# Configuration
NOTARIZATION_PROFILE="adrata-notarization"
APP_NAME="Adrata"

# Function to find the app or DMG to notarize
find_artifact() {
    echo "🔍 Looking for artifact to notarize..."
    
    # Look for DMG first (preferred for notarization)
    DMG_PATHS=(
        "src-tauri/target/universal-apple-darwin/release/bundle/dmg/*.dmg"
        "src-tauri/target/release/bundle/dmg/*.dmg"
        "src-tauri/target/aarch64-apple-darwin/release/bundle/dmg/*.dmg"
        "src-tauri/target/x86_64-apple-darwin/release/bundle/dmg/*.dmg"
    )
    
    for pattern in "${DMG_PATHS[@]}"; do
        for dmg in $pattern; do
            if [[ -f "$dmg" ]]; then
                echo "✅ Found DMG: $dmg"
                ARTIFACT_PATH="$dmg"
                ARTIFACT_TYPE="dmg"
                return 0
            fi
        done
    done
    
    # Look for app bundle as fallback
    APP_PATHS=(
        "src-tauri/target/universal-apple-darwin/release/bundle/macos/Adrata.app"
        "src-tauri/target/release/bundle/macos/Adrata.app"
        "src-tauri/target/aarch64-apple-darwin/release/bundle/macos/Adrata.app"
        "src-tauri/target/x86_64-apple-darwin/release/bundle/macos/Adrata.app"
    )
    
    for app in "${APP_PATHS[@]}"; do
        if [[ -d "$app" ]]; then
            echo "✅ Found app bundle: $app"
            ARTIFACT_PATH="$app"
            ARTIFACT_TYPE="app"
            return 0
        fi
    done
    
    echo "❌ No artifact found to notarize"
    echo "   Run 'npm run desktop:build' first"
    return 1
}

# Function to check prerequisites
check_prerequisites() {
    echo "🔍 Checking prerequisites..."
    
    # Check for notarytool
    if ! command -v xcrun >/dev/null 2>&1; then
        echo "❌ xcrun not available"
        echo "   Install Xcode Command Line Tools: xcode-select --install"
        exit 1
    fi
    
    # Check for notarization profile
    if ! xcrun notarytool store-credentials --list | grep -q "$NOTARIZATION_PROFILE"; then
        echo "❌ Notarization profile '$NOTARIZATION_PROFILE' not found"
        echo ""
        echo "💡 To fix this:"
        echo "  1. Run 'bash scripts/setup-apple-auth.sh'"
        echo "  2. Or manually create profile:"
        echo "     xcrun notarytool store-credentials $NOTARIZATION_PROFILE \\"
        echo "       --apple-id your@email.com \\"
        echo "       --password your-app-specific-password \\"
        echo "       --team-id YOUR_TEAM_ID"
        exit 1
    fi
    
    echo "✅ Prerequisites check passed"
    echo ""
}

# Function to verify signing before notarization
verify_signing() {
    echo "🔐 Verifying code signature..."
    
    if [[ "$ARTIFACT_TYPE" == "app" ]]; then
        # For app bundles, verify deep signature
        if codesign --verify --deep --verbose "$ARTIFACT_PATH" 2>&1; then
            echo "✅ App bundle is properly signed"
        else
            echo "❌ App bundle signature verification failed"
            echo "   The app must be signed before notarization"
            exit 1
        fi
    elif [[ "$ARTIFACT_TYPE" == "dmg" ]]; then
        # For DMG files, verify signature
        if codesign --verify --verbose "$ARTIFACT_PATH" 2>&1; then
            echo "✅ DMG is properly signed"
        else
            echo "❌ DMG signature verification failed"
            echo "   The DMG must be signed before notarization"
            exit 1
        fi
    fi
    
    echo ""
}

# Function to submit for notarization
submit_for_notarization() {
    echo "📋 Submitting for notarization..."
    echo "Artifact: $ARTIFACT_PATH"
    echo "Type: $ARTIFACT_TYPE"
    echo ""
    
    # Submit the artifact
    echo "⏳ Uploading to Apple's notarization service..."
    
    SUBMISSION_OUTPUT=$(xcrun notarytool submit "$ARTIFACT_PATH" \
        --keychain-profile "$NOTARIZATION_PROFILE" \
        --output-format json \
        --wait)
    
    if [[ $? -eq 0 ]]; then
        echo "✅ Submission completed"
        
        # Parse the submission ID and status
        SUBMISSION_ID=$(echo "$SUBMISSION_OUTPUT" | grep -o '"id": "[^"]*"' | cut -d'"' -f4)
        STATUS=$(echo "$SUBMISSION_OUTPUT" | grep -o '"status": "[^"]*"' | cut -d'"' -f4)
        
        echo "📋 Submission ID: $SUBMISSION_ID"
        echo "📊 Status: $STATUS"
        
        if [[ "$STATUS" == "Accepted" ]]; then
            echo "🎉 Notarization successful!"
            return 0
        else
            echo "❌ Notarization failed with status: $STATUS"
            
            # Get detailed log
            echo ""
            echo "📋 Getting detailed log..."
            xcrun notarytool log "$SUBMISSION_ID" --keychain-profile "$NOTARIZATION_PROFILE"
            
            return 1
        fi
    else
        echo "❌ Submission failed"
        return 1
    fi
}

# Function to staple the notarization
staple_notarization() {
    echo ""
    echo "📎 Stapling notarization..."
    
    if xcrun stapler staple "$ARTIFACT_PATH"; then
        echo "✅ Notarization stapled successfully"
        
        # Verify the stapling
        if xcrun stapler validate "$ARTIFACT_PATH"; then
            echo "✅ Stapling validation successful"
        else
            echo "⚠️  Stapling validation failed"
        fi
    else
        echo "❌ Stapling failed"
        echo "   The notarization is still valid, but users will need internet to verify"
        return 1
    fi
}

# Function to verify final result
verify_notarization() {
    echo ""
    echo "🔍 Verifying final notarization..."
    
    # Test with spctl (System Policy Control)
    if spctl --assess --type execute --verbose "$ARTIFACT_PATH" 2>&1; then
        echo "✅ Final verification successful"
        
        # Check if it shows as notarized
        if spctl --assess --type execute --verbose "$ARTIFACT_PATH" 2>&1 | grep -q "source=Notarized"; then
            echo "🏆 Artifact is properly notarized and will run without warnings"
        else
            echo "⚠️  Artifact may still show warnings (check notarization status)"
        fi
    else
        echo "❌ Final verification failed"
        return 1
    fi
}

# Function to show distribution info
show_distribution_info() {
    echo ""
    echo "📦 Distribution Information"
    echo "=========================="
    echo ""
    echo "✅ Your notarized artifact is ready for distribution!"
    echo ""
    echo "📍 Location: $ARTIFACT_PATH"
    
    # Get file size
    if [[ -f "$ARTIFACT_PATH" ]]; then
        FILE_SIZE=$(du -h "$ARTIFACT_PATH" | cut -f1)
        echo "📦 Size: $FILE_SIZE"
    fi
    
    echo ""
    echo "🚀 Distribution options:"
    echo "  • Upload to your website for direct download"
    echo "  • Distribute through Mac App Store (requires additional steps)"
    echo "  • Share with beta testers"
    echo "  • Create installer packages"
    echo ""
    echo "💡 Users can now install and run your app without security warnings!"
    
    # Copy to desktop for easy access
    DESKTOP_PATH="$HOME/Desktop/$(basename "$ARTIFACT_PATH")"
    if cp "$ARTIFACT_PATH" "$DESKTOP_PATH" 2>/dev/null; then
        echo "📋 Copied to Desktop: $DESKTOP_PATH"
    fi
}

# Function to handle errors
handle_error() {
    echo ""
    echo "❌ Notarization process failed"
    echo ""
    echo "🔧 Troubleshooting steps:"
    echo "  1. Verify your Apple ID credentials are correct"
    echo "  2. Check that your app-specific password is valid"
    echo "  3. Ensure your Apple Developer account is in good standing"
    echo "  4. Verify the app is properly signed"
    echo "  5. Check Apple's system status: https://developer.apple.com/system-status/"
    echo ""
    echo "💡 Common solutions:"
    echo "  • Re-run 'bash scripts/setup-apple-auth.sh' to refresh credentials"
    echo "  • Ensure you're using an app-specific password, not your Apple ID password"
    echo "  • Wait a few minutes and try again (Apple's servers may be busy)"
}

# Main execution
main() {
    if ! find_artifact; then
        echo ""
        echo "💡 To build and notarize your app:"
        echo "  1. Run 'npm run desktop:build' to build the app"
        echo "  2. Then run this script to notarize it"
        echo "  3. Or use 'npm run desktop:build:notarized' for both steps"
        exit 1
    fi
    
    check_prerequisites
    verify_signing
    
    if submit_for_notarization; then
        staple_notarization
        verify_notarization
        show_distribution_info
        
        echo ""
        echo "🎉 Notarization completed successfully!"
    else
        handle_error
        exit 1
    fi
}

# Run main function
main "$@"
