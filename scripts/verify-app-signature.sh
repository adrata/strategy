#!/bin/bash

# 🔍 VERIFY APP SIGNATURE
# This script verifies the code signature of the built application

set -e

echo "🔍 Verifying App Signature"
echo "=========================="
echo ""

# Check if we're on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "❌ This script only works on macOS"
    exit 1
fi

# Function to find the app bundle
find_app_bundle() {
    echo "🔍 Looking for app bundle..."
    
    # Possible locations for the app bundle
    POSSIBLE_PATHS=(
        "src-tauri/target/universal-apple-darwin/release/bundle/macos/Adrata.app"
        "src-tauri/target/release/bundle/macos/Adrata.app"
        "src-tauri/target/aarch64-apple-darwin/release/bundle/macos/Adrata.app"
        "src-tauri/target/x86_64-apple-darwin/release/bundle/macos/Adrata.app"
    )
    
    for path in "${POSSIBLE_PATHS[@]}"; do
        if [[ -d "$path" ]]; then
            echo "✅ Found app bundle: $path"
            APP_PATH="$path"
            return 0
        fi
    done
    
    echo "❌ No app bundle found"
    echo "   Run 'npm run desktop:build' first"
    return 1
}

# Function to verify basic signature
verify_basic_signature() {
    echo ""
    echo "🔐 Basic Signature Verification"
    echo "------------------------------"
    
    if [[ ! -d "$APP_PATH" ]]; then
        echo "❌ App bundle not found"
        return 1
    fi
    
    echo "📍 Verifying: $APP_PATH"
    
    # Basic codesign verification
    if codesign --verify --verbose "$APP_PATH" 2>&1; then
        echo "✅ Basic signature verification passed"
        return 0
    else
        echo "❌ Basic signature verification failed"
        return 1
    fi
}

# Function to verify deep signature
verify_deep_signature() {
    echo ""
    echo "🔍 Deep Signature Verification"
    echo "-----------------------------"
    
    # Deep verification checks all nested components
    if codesign --verify --deep --verbose "$APP_PATH" 2>&1; then
        echo "✅ Deep signature verification passed"
        return 0
    else
        echo "❌ Deep signature verification failed"
        return 1
    fi
}

# Function to display signature information
display_signature_info() {
    echo ""
    echo "📋 Signature Information"
    echo "-----------------------"
    
    # Display signing information
    echo "🔍 Signature details:"
    codesign --display --verbose=4 "$APP_PATH" 2>&1 | while read line; do
        echo "   $line"
    done
    
    echo ""
    echo "🔍 Certificate chain:"
    codesign --display --verbose=2 "$APP_PATH" 2>&1 | grep "Authority=" | while read line; do
        echo "   $line"
    done
}

# Function to check entitlements
check_entitlements() {
    echo ""
    echo "📜 Entitlements Check"
    echo "--------------------"
    
    # Extract and display entitlements
    ENTITLEMENTS=$(codesign --display --entitlements - "$APP_PATH" 2>/dev/null)
    
    if [[ -n "$ENTITLEMENTS" ]]; then
        echo "✅ Entitlements found:"
        echo "$ENTITLEMENTS" | while read line; do
            echo "   $line"
        done
    else
        echo "⚠️  No entitlements found (may be normal for simple apps)"
    fi
}

# Function to verify against Gatekeeper
verify_gatekeeper() {
    echo ""
    echo "🛡️ Gatekeeper Verification"
    echo "-------------------------"
    
    # Test if the app would pass Gatekeeper
    if spctl --assess --type execute --verbose "$APP_PATH" 2>&1; then
        echo "✅ Gatekeeper verification passed"
        echo "   App can run on other Macs without warnings"
        return 0
    else
        echo "❌ Gatekeeper verification failed"
        echo "   App may show security warnings on other Macs"
        return 1
    fi
}

# Function to check notarization status
check_notarization() {
    echo ""
    echo "📋 Notarization Status"
    echo "---------------------"
    
    # Check if the app is notarized
    if spctl --assess --type execute --verbose "$APP_PATH" 2>&1 | grep -q "source=Notarized"; then
        echo "✅ App is notarized"
        
        # Get notarization info
        echo "🔍 Notarization details:"
        codesign --display --verbose "$APP_PATH" 2>&1 | grep -i notarization | while read line; do
            echo "   $line"
        done
    else
        echo "⚠️  App is not notarized"
        echo "   Users may see security warnings"
        echo "   Run 'npm run desktop:build:notarized' for notarized build"
    fi
}

# Function to verify app bundle structure
verify_bundle_structure() {
    echo ""
    echo "📁 Bundle Structure Verification"
    echo "-------------------------------"
    
    # Check essential bundle components
    REQUIRED_ITEMS=(
        "Contents/Info.plist"
        "Contents/MacOS"
        "Contents/Resources"
    )
    
    for item in "${REQUIRED_ITEMS[@]}"; do
        if [[ -e "$APP_PATH/$item" ]]; then
            echo "✅ $item: Found"
        else
            echo "❌ $item: Missing"
        fi
    done
    
    # Check Info.plist
    if [[ -f "$APP_PATH/Contents/Info.plist" ]]; then
        BUNDLE_ID=$(defaults read "$APP_PATH/Contents/Info.plist" CFBundleIdentifier 2>/dev/null || echo "Unknown")
        VERSION=$(defaults read "$APP_PATH/Contents/Info.plist" CFBundleShortVersionString 2>/dev/null || echo "Unknown")
        
        echo "📋 Bundle Info:"
        echo "   Bundle ID: $BUNDLE_ID"
        echo "   Version: $VERSION"
    fi
}

# Function to test app execution
test_app_execution() {
    echo ""
    echo "🚀 App Execution Test"
    echo "--------------------"
    
    # Find the main executable
    EXECUTABLE="$APP_PATH/Contents/MacOS/Adrata"
    
    if [[ -x "$EXECUTABLE" ]]; then
        echo "✅ Main executable found and is executable"
        
        # Test if we can get version info (without actually launching the GUI)
        if "$EXECUTABLE" --version 2>/dev/null || "$EXECUTABLE" --help 2>/dev/null; then
            echo "✅ Executable responds to command line arguments"
        else
            echo "⚠️  Executable doesn't respond to --version or --help"
            echo "   (This may be normal for GUI apps)"
        fi
    else
        echo "❌ Main executable not found or not executable"
    fi
}

# Function to generate verification report
generate_verification_report() {
    echo ""
    echo "📋 App Signature Verification Report"
    echo "===================================="
    echo ""
    
    if [[ -z "$APP_PATH" ]]; then
        echo "❌ No app bundle found to verify"
        echo ""
        echo "💡 To fix this:"
        echo "  1. Run 'npm run desktop:build' to build the app"
        echo "  2. Then run this script again"
        return 1
    fi
    
    echo "📍 Verified app: $APP_PATH"
    echo ""
    
    # Run all verification checks
    local basic_ok=false
    local deep_ok=false
    local gatekeeper_ok=false
    local notarized=false
    
    if verify_basic_signature >/dev/null 2>&1; then
        basic_ok=true
    fi
    
    if verify_deep_signature >/dev/null 2>&1; then
        deep_ok=true
    fi
    
    if verify_gatekeeper >/dev/null 2>&1; then
        gatekeeper_ok=true
    fi
    
    if spctl --assess --type execute --verbose "$APP_PATH" 2>&1 | grep -q "source=Notarized"; then
        notarized=true
    fi
    
    echo "📊 Verification Summary:"
    echo "  Basic Signature: $([ "$basic_ok" = true ] && echo "✅ Valid" || echo "❌ Invalid")"
    echo "  Deep Signature: $([ "$deep_ok" = true ] && echo "✅ Valid" || echo "❌ Invalid")"
    echo "  Gatekeeper: $([ "$gatekeeper_ok" = true ] && echo "✅ Passes" || echo "❌ Fails")"
    echo "  Notarization: $([ "$notarized" = true ] && echo "✅ Notarized" || echo "⚠️  Not Notarized")"
    echo ""
    
    if [[ "$basic_ok" = true && "$deep_ok" = true && "$gatekeeper_ok" = true ]]; then
        echo "🎉 App signature verification successful!"
        echo "Your app is properly signed and ready for distribution."
        
        if [[ "$notarized" = true ]]; then
            echo "🏆 App is also notarized - users won't see any security warnings."
        else
            echo "💡 Consider notarizing for the best user experience."
        fi
    else
        echo "⚠️  App signature verification found issues."
        echo "Please review the detailed output above."
    fi
    
    return 0
}

# Main execution
main() {
    if find_app_bundle; then
        verify_basic_signature
        verify_deep_signature
        display_signature_info
        check_entitlements
        verify_gatekeeper
        check_notarization
        verify_bundle_structure
        test_app_execution
        generate_verification_report
    else
        echo ""
        echo "💡 To build and verify your app:"
        echo "  1. Run 'npm run desktop:build' (for unsigned build)"
        echo "  2. Or 'npm run desktop:build:notarized' (for signed & notarized)"
        echo "  3. Then run this script again"
        exit 1
    fi
}

# Run main function
main "$@"
