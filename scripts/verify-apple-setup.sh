#!/bin/bash

# 🔍 VERIFY APPLE SETUP
# This script verifies Apple Developer authentication setup

set -e

echo "🔍 Verifying Apple Developer Setup"
echo "=================================="
echo ""

# Check if we're on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "❌ This script only works on macOS"
    exit 1
fi

# Function to check code signing certificates
check_certificates() {
    echo "🔐 Checking Code Signing Certificates"
    echo "------------------------------------"
    
    # Check for Developer ID Application
    DEV_ID_APP=$(security find-identity -v -p codesigning | grep "Developer ID Application")
    
    if [[ -n "$DEV_ID_APP" ]]; then
        echo "✅ Developer ID Application certificate found:"
        echo "$DEV_ID_APP" | while read line; do
            echo "   $line"
        done
        
        # Extract the identity for testing
        IDENTITY=$(echo "$DEV_ID_APP" | head -n 1 | sed 's/.*") \(.*\) ".*/\1/')
        echo "   Using identity: $IDENTITY"
        
        # Test signing capability
        echo ""
        echo "🧪 Testing signing capability..."
        
        # Create a temporary file to test signing
        TEMP_FILE=$(mktemp)
        echo "test" > "$TEMP_FILE"
        
        if codesign --sign "$IDENTITY" "$TEMP_FILE" 2>/dev/null; then
            echo "✅ Code signing test successful"
            
            # Verify the signature
            if codesign --verify --verbose "$TEMP_FILE" 2>/dev/null; then
                echo "✅ Signature verification successful"
            else
                echo "❌ Signature verification failed"
            fi
        else
            echo "❌ Code signing test failed"
        fi
        
        # Clean up
        rm -f "$TEMP_FILE"
        
    else
        echo "❌ No Developer ID Application certificate found"
        echo ""
        echo "💡 To fix this:"
        echo "  1. Run 'bash scripts/setup-apple-auth.sh'"
        echo "  2. Or manually install your certificate from Apple Developer Portal"
    fi
    
    echo ""
}

# Function to check notarization setup
check_notarization() {
    echo "📋 Checking Notarization Setup"
    echo "------------------------------"
    
    # Check if notarytool is available
    if command -v xcrun >/dev/null 2>&1; then
        echo "✅ xcrun (notarytool) is available"
        
        # Check for stored credentials
        PROFILES=$(xcrun notarytool store-credentials --list 2>/dev/null || echo "")
        
        if [[ -n "$PROFILES" ]]; then
            echo "✅ Notarization profiles found:"
            echo "$PROFILES" | grep -v "^$" | while read line; do
                echo "   $line"
            done
            
            # Test a specific profile if it exists
            if echo "$PROFILES" | grep -q "adrata-notarization"; then
                echo ""
                echo "🧪 Testing notarization profile..."
                
                # Create a simple test file
                TEMP_FILE=$(mktemp -d)/test.txt
                echo "test file for notarization" > "$TEMP_FILE"
                
                # Try to get submission history (this tests the credentials without actually submitting)
                if xcrun notarytool history --keychain-profile "adrata-notarization" >/dev/null 2>&1; then
                    echo "✅ Notarization credentials are valid"
                else
                    echo "⚠️  Notarization credentials may be invalid or expired"
                fi
                
                # Clean up
                rm -rf "$(dirname "$TEMP_FILE")"
            fi
        else
            echo "❌ No notarization profiles found"
            echo ""
            echo "💡 To fix this:"
            echo "  1. Run 'bash scripts/setup-apple-auth.sh'"
            echo "  2. Or run 'xcrun notarytool store-credentials' manually"
        fi
    else
        echo "❌ xcrun not available"
    fi
    
    echo ""
}

# Function to check Xcode and tools
check_xcode_tools() {
    echo "🛠️ Checking Xcode and Tools"
    echo "---------------------------"
    
    # Check Xcode Command Line Tools
    if xcode-select -p >/dev/null 2>&1; then
        XCODE_PATH=$(xcode-select -p)
        echo "✅ Xcode Command Line Tools installed at: $XCODE_PATH"
    else
        echo "❌ Xcode Command Line Tools not installed"
        echo "   Run: xcode-select --install"
    fi
    
    # Check for full Xcode installation
    if [[ -d "/Applications/Xcode.app" ]]; then
        XCODE_VERSION=$(defaults read /Applications/Xcode.app/Contents/Info.plist CFBundleShortVersionString 2>/dev/null || echo "Unknown")
        echo "✅ Xcode.app found (version: $XCODE_VERSION)"
    else
        echo "⚠️  Xcode.app not found (Command Line Tools only)"
    fi
    
    # Check specific tools
    TOOLS=("codesign" "security" "xcrun" "notarytool")
    
    for tool in "${TOOLS[@]}"; do
        if command -v "$tool" >/dev/null 2>&1; then
            VERSION=$($tool --version 2>/dev/null | head -n 1 || echo "Available")
            echo "✅ $tool: $VERSION"
        else
            echo "❌ $tool: Not found"
        fi
    done
    
    echo ""
}

# Function to check environment configuration
check_environment() {
    echo "🌍 Checking Environment Configuration"
    echo "-----------------------------------"
    
    # Check for .env.apple file
    if [[ -f ".env.apple" ]]; then
        echo "✅ .env.apple configuration file found"
        
        # Show configuration (without sensitive data)
        while IFS= read -r line; do
            if [[ "$line" =~ ^[A-Z_]+=.* ]] && [[ ! "$line" =~ PASSWORD|SECRET|KEY ]]; then
                echo "   $line"
            fi
        done < .env.apple
    else
        echo "⚠️  .env.apple configuration file not found"
        echo "   Run 'bash scripts/setup-apple-auth.sh' to create it"
    fi
    
    # Check relevant environment variables
    ENV_VARS=("APPLE_SIGNING_IDENTITY" "APPLE_CERTIFICATE_NAME" "APPLE_NOTARIZATION_PROFILE")
    
    for var in "${ENV_VARS[@]}"; do
        if [[ -n "${!var}" ]]; then
            echo "✅ $var is set"
        else
            echo "⚠️  $var is not set"
        fi
    done
    
    echo ""
}

# Function to test build preparation
test_build_preparation() {
    echo "🏗️ Testing Build Preparation"
    echo "----------------------------"
    
    # Check if Tauri is properly configured
    if [[ -f "src-tauri/tauri.conf.json" ]]; then
        echo "✅ Tauri configuration found"
        
        # Check bundle identifier
        BUNDLE_ID=$(grep -o '"identifier": "[^"]*"' src-tauri/tauri.conf.json | cut -d'"' -f4)
        if [[ -n "$BUNDLE_ID" ]]; then
            echo "✅ Bundle identifier: $BUNDLE_ID"
        else
            echo "⚠️  Bundle identifier not found in Tauri config"
        fi
    else
        echo "❌ Tauri configuration not found"
    fi
    
    # Check for required build scripts
    BUILD_SCRIPTS=("desktop:build" "desktop:build:notarized")
    
    if [[ -f "package.json" ]]; then
        for script in "${BUILD_SCRIPTS[@]}"; do
            if grep -q "\"$script\":" package.json; then
                echo "✅ Build script '$script' found"
            else
                echo "⚠️  Build script '$script' not found"
            fi
        done
    else
        echo "❌ package.json not found"
    fi
    
    echo ""
}

# Function to generate verification report
generate_report() {
    echo "📋 Apple Setup Verification Report"
    echo "=================================="
    echo ""
    
    # Summary of checks
    CHECKS=(
        "Code Signing Certificates"
        "Notarization Setup"
        "Xcode and Tools"
        "Environment Configuration"
        "Build Preparation"
    )
    
    echo "📊 Verification Summary:"
    
    # Re-run quick checks for summary
    if security find-identity -v -p codesigning | grep -q "Developer ID Application"; then
        echo "✅ Code Signing: Ready"
    else
        echo "❌ Code Signing: Not Ready"
    fi
    
    if xcrun notarytool store-credentials --list 2>/dev/null | grep -q "adrata-notarization"; then
        echo "✅ Notarization: Ready"
    else
        echo "❌ Notarization: Not Ready"
    fi
    
    if xcode-select -p >/dev/null 2>&1; then
        echo "✅ Xcode Tools: Ready"
    else
        echo "❌ Xcode Tools: Not Ready"
    fi
    
    if [[ -f ".env.apple" ]]; then
        echo "✅ Environment: Configured"
    else
        echo "⚠️  Environment: Needs Setup"
    fi
    
    if [[ -f "src-tauri/tauri.conf.json" ]]; then
        echo "✅ Build Config: Ready"
    else
        echo "❌ Build Config: Missing"
    fi
    
    echo ""
    echo "🚀 Next Steps:"
    echo "  • If all checks pass: Run 'npm run desktop:build:notarized'"
    echo "  • If issues found: Run 'bash scripts/setup-apple-auth.sh'"
    echo "  • For signing issues: Check Keychain Access"
    echo "  • For notarization issues: Verify Apple ID credentials"
    echo ""
}

# Main execution
main() {
    check_certificates
    check_notarization
    check_xcode_tools
    check_environment
    test_build_preparation
    generate_report
    
    echo "✅ Apple setup verification completed!"
}

# Run main function
main "$@"
