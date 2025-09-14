#!/bin/bash

# 🍎 SETUP APPLE AUTHENTICATION
# This script sets up Apple Developer authentication for code signing and notarization

set -e

echo "🍎 Setting up Apple Developer Authentication"
echo "==========================================="
echo ""

# Check if we're on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "❌ This script only works on macOS"
    exit 1
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
    
    echo "✅ Xcode Command Line Tools installed"
    echo ""
}

# Function to setup code signing
setup_code_signing() {
    echo "🔐 Setting up Code Signing"
    echo "--------------------------"
    
    # Check for existing certificates
    echo "🔍 Checking for existing certificates..."
    
    DEVELOPER_ID_APP=$(security find-identity -v -p codesigning | grep "Developer ID Application" | head -n 1)
    DEVELOPER_ID_INSTALLER=$(security find-identity -v -p codesigning | grep "Developer ID Installer" | head -n 1)
    
    if [[ -n "$DEVELOPER_ID_APP" ]]; then
        echo "✅ Developer ID Application certificate found:"
        echo "   $DEVELOPER_ID_APP"
    else
        echo "⚠️  No Developer ID Application certificate found"
        echo ""
        echo "📋 To add your certificate:"
        echo "1. Download your Developer ID Application certificate from Apple Developer Portal"
        echo "2. Double-click the .cer file to install it in Keychain"
        echo "3. Re-run this script"
        echo ""
    fi
    
    if [[ -n "$DEVELOPER_ID_INSTALLER" ]]; then
        echo "✅ Developer ID Installer certificate found:"
        echo "   $DEVELOPER_ID_INSTALLER"
    else
        echo "⚠️  No Developer ID Installer certificate found"
        echo "   (Optional - only needed for .pkg installers)"
    fi
    
    echo ""
}

# Function to setup notarization
setup_notarization() {
    echo "📋 Setting up Notarization"
    echo "-------------------------"
    
    # Check if notarization profile exists
    PROFILE_NAME="adrata-notarization"
    
    if xcrun notarytool store-credentials --list | grep -q "$PROFILE_NAME"; then
        echo "✅ Notarization profile '$PROFILE_NAME' already exists"
    else
        echo "⚠️  Notarization profile not found"
        echo ""
        echo "🔧 Setting up notarization profile..."
        echo "You'll need your Apple ID and app-specific password"
        echo ""
        
        read -p "Enter your Apple ID email: " APPLE_ID
        
        if [[ -n "$APPLE_ID" ]]; then
            echo ""
            echo "📱 Creating app-specific password:"
            echo "1. Go to https://appleid.apple.com/account/manage"
            echo "2. Sign in with your Apple ID"
            echo "3. Go to 'App-Specific Passwords'"
            echo "4. Generate a new password for 'Adrata Notarization'"
            echo ""
            
            read -p "Enter your app-specific password: " -s APP_PASSWORD
            echo ""
            
            if [[ -n "$APP_PASSWORD" ]]; then
                echo "🔧 Storing notarization credentials..."
                
                xcrun notarytool store-credentials "$PROFILE_NAME" \
                    --apple-id "$APPLE_ID" \
                    --password "$APP_PASSWORD" \
                    --team-id "$(security find-identity -v -p codesigning | grep "Developer ID Application" | head -n 1 | sed 's/.*(\([^)]*\)).*/\1/')"
                
                if [[ $? -eq 0 ]]; then
                    echo "✅ Notarization profile created successfully"
                else
                    echo "❌ Failed to create notarization profile"
                fi
            else
                echo "⚠️  App-specific password not provided - skipping notarization setup"
            fi
        else
            echo "⚠️  Apple ID not provided - skipping notarization setup"
        fi
    fi
    
    echo ""
}

# Function to test the setup
test_setup() {
    echo "🧪 Testing Setup"
    echo "---------------"
    
    # Test code signing
    if security find-identity -v -p codesigning | grep -q "Developer ID Application"; then
        echo "✅ Code signing identity available"
    else
        echo "❌ No code signing identity found"
    fi
    
    # Test notarization
    if xcrun notarytool store-credentials --list | grep -q "adrata-notarization"; then
        echo "✅ Notarization profile available"
    else
        echo "❌ No notarization profile found"
    fi
    
    echo ""
}

# Function to create environment file
create_env_file() {
    echo "📝 Creating Environment Configuration"
    echo "-----------------------------------"
    
    ENV_FILE=".env.apple"
    
    # Get the signing identity
    SIGNING_IDENTITY=$(security find-identity -v -p codesigning | grep "Developer ID Application" | head -n 1 | sed 's/.*") \(.*\) ".*/\1/')
    
    if [[ -n "$SIGNING_IDENTITY" ]]; then
        cat > "$ENV_FILE" << EOF
# Apple Developer Configuration
# Generated by setup-apple-auth.sh

# Code Signing
APPLE_SIGNING_IDENTITY="$SIGNING_IDENTITY"
APPLE_CERTIFICATE_NAME="Developer ID Application"

# Notarization
APPLE_NOTARIZATION_PROFILE="adrata-notarization"

# Build Configuration
APPLE_SIGN_BUILDS=true
APPLE_NOTARIZE_BUILDS=true
EOF
        
        echo "✅ Created $ENV_FILE with your configuration"
        echo "   Add this to your .gitignore file"
    else
        echo "⚠️  No signing identity found - cannot create environment file"
    fi
    
    echo ""
}

# Function to show next steps
show_next_steps() {
    echo "🚀 Next Steps"
    echo "============"
    echo ""
    echo "✅ Apple authentication setup complete!"
    echo ""
    echo "📋 What you can do now:"
    echo "  • Run 'npm run desktop:build:notarized' to build and notarize"
    echo "  • Run 'bash scripts/verify-apple-setup.sh' to verify everything works"
    echo "  • Run 'bash scripts/build-notarized.sh' for full notarized build"
    echo ""
    echo "🔧 Troubleshooting:"
    echo "  • If builds fail, check your certificates in Keychain Access"
    echo "  • Ensure your Apple Developer account is in good standing"
    echo "  • Verify your app-specific password is correct"
    echo ""
}

# Main execution
main() {
    check_prerequisites
    setup_code_signing
    setup_notarization
    test_setup
    create_env_file
    show_next_steps
}

# Run main function
main "$@"
