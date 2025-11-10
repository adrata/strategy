#!/bin/bash

# 🔐 SETUP GITHUB SECRETS FOR ADRATA
# This script helps you configure all required GitHub secrets to eliminate workflow warnings

set -e

echo "🔐 GitHub Secrets Setup for Adrata"
echo "===================================="

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }

# Check if GitHub CLI is installed and authenticated
check_gh_cli() {
    if ! command -v gh &> /dev/null; then
        print_error "GitHub CLI is not installed. Please install it first:"
        echo "brew install gh"
        echo "# or"
        echo "curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg"
        exit 1
    fi
    
    if ! gh auth status &> /dev/null; then
        print_error "GitHub CLI is not authenticated. Please run:"
        echo "gh auth login"
        exit 1
    fi
    
    print_success "GitHub CLI is ready"
}

# Set a secret with confirmation
set_secret() {
    local secret_name=$1
    local secret_value=$2
    local description=$3
    
    print_info "Setting secret: $secret_name"
    echo "Description: $description"
    
    if [ -n "$secret_value" ]; then
        echo "$secret_value" | gh secret set "$secret_name"
        print_success "Set $secret_name"
    else
        print_warning "Skipping $secret_name (no value provided)"
    fi
    echo ""
}

# Main setup function
setup_secrets() {
    print_info "Setting up required GitHub secrets..."
    echo ""
    
    # Vercel Configuration
    print_info "🌐 VERCEL CONFIGURATION"
    echo "========================="
    
    # SECURITY: Never hardcode credentials in scripts
    # These values should be read from environment variables or secure vault
    print_warning "⚠️  This script requires credentials to be provided via environment variables"
    print_info "Set the following environment variables before running:"
    echo "  - VERCEL_ORG_ID"
    echo "  - VERCEL_TOKEN"
    echo "  - VERCEL_PROJECT_ID (and variants)"
    echo "  - DATABASE_URL (and variants)"
    echo ""
    
    # Vercel Configuration - read from environment
    if [ -n "$VERCEL_ORG_ID" ]; then
        set_secret "VERCEL_ORG_ID" "$VERCEL_ORG_ID" "Vercel Organization ID"
    else
        print_warning "VERCEL_ORG_ID not set, skipping..."
    fi
    
    if [ -n "$VERCEL_TOKEN" ]; then
        set_secret "VERCEL_TOKEN" "$VERCEL_TOKEN" "Vercel API Token for deployments"
    else
        print_warning "VERCEL_TOKEN not set, skipping..."
    fi
    
    # Project IDs - read from environment
    for env_var in "VERCEL_PROJECT_ID" "VERCEL_PROJECT_ID_PRODUCTION" "VERCEL_PROJECT_ID_STAGING" "VERCEL_PROJECT_ID_DEMO" "VERCEL_PROJECT_ID_DEVELOPMENT" "VERCEL_PROJECT_ID_SANDBOX"; do
        if [ -n "${!env_var}" ]; then
            set_secret "$env_var" "${!env_var}" "$env_var"
        fi
    done
    
    # Database Configuration
    print_info "🗄️  DATABASE CONFIGURATION"
    echo "============================"
    
    # Database URLs - read from environment
    for env_var in "DATABASE_URL" "DATABASE_URL_PRODUCTION" "DATABASE_URL_DEMO" "DATABASE_URL_STAGING" "DATABASE_URL_DEVELOPMENT" "DATABASE_URL_SANDBOX"; do
        if [ -n "${!env_var}" ]; then
            set_secret "$env_var" "${!env_var}" "$env_var"
        else
            print_warning "$env_var not set, skipping..."
        fi
    done
    
    # Authentication
    print_info "🔑 AUTHENTICATION CONFIGURATION"
    echo "================================="
    
    set_secret "NEXTAUTH_SECRET" "adrata-github-actions-secret-32-characters-minimum-secure-2024" "NextAuth.js secret for session encryption"
    set_secret "NEXTAUTH_URL" "https://action.adrata.com" "NextAuth.js URL for production"
    
    # API Keys
    print_info "🤖 API KEYS CONFIGURATION"
    echo "=========================="
    
    # API Keys - read from environment variables
    if [ -n "$OPENAI_API_KEY" ]; then
        set_secret "OPENAI_API_KEY" "$OPENAI_API_KEY" "OpenAI API Key"
    fi
    
    if [ -n "$ANTHROPIC_API_KEY" ]; then
        set_secret "ANTHROPIC_API_KEY" "$ANTHROPIC_API_KEY" "Anthropic Claude API Key"
    fi
    
    if [ -n "$BRIGHTDATA_API_KEY" ]; then
        set_secret "BRIGHTDATA_API_KEY" "$BRIGHTDATA_API_KEY" "BrightData API Key"
    fi
    
    # Optional Services
    print_info "📞 OPTIONAL SERVICES"
    echo "===================="
    
    if [ -n "$TWILIO_ACCOUNT_SID" ]; then
        set_secret "TWILIO_ACCOUNT_SID" "$TWILIO_ACCOUNT_SID" "Twilio Account SID"
    fi
    
    if [ -n "$MAILGUN_API_KEY" ]; then
        set_secret "MAILGUN_API_KEY" "$MAILGUN_API_KEY" "Mailgun API Key"
    fi
    set_secret "MAILGUN_DOMAIN" "mail.adrata.com" "Mailgun Domain"
    
    print_success "🎉 All secrets have been configured!"
}

# Verify secrets are set
verify_secrets() {
    print_info "🔍 Verifying secrets are set correctly..."
    
    local required_secrets=(
        "VERCEL_ORG_ID"
        "VERCEL_TOKEN"
        "VERCEL_PROJECT_ID"
        "DATABASE_URL"
        "NEXTAUTH_SECRET"
    )
    
    local missing_secrets=()
    
    for secret in "${required_secrets[@]}"; do
        if gh secret list | grep -q "$secret"; then
            print_success "$secret is set"
        else
            print_error "$secret is missing"
            missing_secrets+=("$secret")
        fi
    done
    
    if [ ${#missing_secrets[@]} -eq 0 ]; then
        print_success "🎉 All required secrets are configured!"
        print_info "Your GitHub Actions workflow warnings should now be resolved."
    else
        print_error "❌ Missing secrets: ${missing_secrets[*]}"
        print_warning "Please set these secrets manually using:"
        for secret in "${missing_secrets[@]}"; do
            echo "gh secret set $secret"
        done
    fi
}

# Main execution
main() {
    echo ""
    print_info "This script will set up all required GitHub secrets for your Adrata project."
    print_warning "This will use the production credentials from your codebase."
    echo ""
    
    read -p "Do you want to continue? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        check_gh_cli
        setup_secrets
        verify_secrets
        
        echo ""
        print_success "🎯 Next steps:"
        echo "1. Push your updated workflow file to GitHub"
        echo "2. Check that the warnings are gone in your workflow"
        echo "3. Test a deployment to verify everything works"
        echo ""
        print_info "You can view your secrets at: https://github.com/$(gh repo view --json owner,name -q '.owner.login + \"/\" + .name')/settings/secrets/actions"
    else
        print_info "Setup cancelled. You can run this script again anytime."
    fi
}

main "$@" 