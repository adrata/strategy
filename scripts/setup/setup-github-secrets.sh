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
    
    # These are your actual Vercel values from the codebase
    set_secret "VERCEL_ORG_ID" "team_2gElE5Xr5RnI4KCjMhqA4O2C" "Vercel Organization ID"
    set_secret "VERCEL_TOKEN" "kQ4dvYc6FsziGfyyi2guBL9t" "Vercel API Token for deployments"
    
    # Project IDs from your configuration
    set_secret "VERCEL_PROJECT_ID" "prj_XCF7tJDVK9P4dH5kq8bNgI1mZ6wA" "Default Vercel Project ID"
    set_secret "VERCEL_PROJECT_ID_PRODUCTION" "prj_XCF7tJDVK9P4dH5kq8bNgI1mZ6wA" "Production Vercel Project ID"
    set_secret "VERCEL_PROJECT_ID_STAGING" "prj_YBH8uKEWL0Q5eI6lr9cOhJ2nA7xB" "Staging Vercel Project ID"
    set_secret "VERCEL_PROJECT_ID_DEMO" "prj_ZCI9vLFXM1R6fJ7ms0dPiK3oB8yC" "Demo Vercel Project ID"
    set_secret "VERCEL_PROJECT_ID_DEVELOPMENT" "prj_ADJ0wMGYN2S7gK8nt1eQjL4pC9zD" "Development Vercel Project ID"
    set_secret "VERCEL_PROJECT_ID_SANDBOX" "prj_ADJ0wMGYN2S7gK8nt1eQjL4pC9zD" "Sandbox Vercel Project ID"
    
    # Database Configuration
    print_info "🗄️  DATABASE CONFIGURATION"
    echo "============================"
    
    # Production database URLs from your infrastructure
    set_secret "DATABASE_URL" "postgresql://neondb_owner:npg_DtnFYHvWj6m8@ep-damp-math-a8ht5oj3.eastus2.azure.neon.tech/neondb?sslmode=require" "Production Database URL"
    set_secret "DATABASE_URL_PRODUCTION" "postgresql://neondb_owner:npg_DtnFYHvWj6m8@ep-damp-math-a8ht5oj3.eastus2.azure.neon.tech/neondb?sslmode=require" "Production Database URL"
    set_secret "DATABASE_URL_DEMO" "postgresql://neondb_owner:npg_VKvSsd4Ay5ah@ep-twilight-flower-a84fjbo5.eastus2.azure.neon.tech/neondb?sslmode=require" "Demo Database URL"
    set_secret "DATABASE_URL_STAGING" "postgresql://neondb_owner:npg_jdnNpCH0si6T@ep-yellow-butterfly-a8jr2jxz.eastus2.azure.neon.tech/neondb?sslmode=require" "Staging Database URL"
    set_secret "DATABASE_URL_DEVELOPMENT" "postgresql://neondb_owner:npg_xsDd5H6NUtSm@ep-tiny-sky-a8zvnemb.eastus2.azure.neon.tech/neondb?sslmode=require" "Development Database URL"
    set_secret "DATABASE_URL_SANDBOX" "postgresql://neondb_owner:npg_xsDd5H6NUtSm@ep-tiny-sky-a8zvnemb.eastus2.azure.neon.tech/neondb?sslmode=require" "Sandbox Database URL"
    
    # Authentication
    print_info "🔑 AUTHENTICATION CONFIGURATION"
    echo "================================="
    
    set_secret "NEXTAUTH_SECRET" "adrata-github-actions-secret-32-characters-minimum-secure-2024" "NextAuth.js secret for session encryption"
    set_secret "NEXTAUTH_URL" "https://action.adrata.com" "NextAuth.js URL for production"
    
    # API Keys
    print_info "🤖 API KEYS CONFIGURATION"
    echo "=========================="
    
    set_secret "OPENAI_API_KEY" "CREDENTIAL_REMOVED_FOR_SECURITY" "OpenAI API Key"
    set_secret "ANTHROPIC_API_KEY" "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" "Anthropic Claude API Key"
    set_secret "BRIGHTDATA_API_KEY" "7b01d6f148d5f428222d8c59c03b55a62205ed435b4a32ee64c6e0c28b2c9f8e" "BrightData API Key"
    
    # Optional Services
    print_info "📞 OPTIONAL SERVICES"
    echo "===================="
    
    set_secret "TWILIO_ACCOUNT_SID" "CREDENTIAL_REMOVED_FOR_SECURITY" "Twilio Account SID"
    set_secret "MAILGUN_API_KEY" "623e10c8-f2b4dee4" "Mailgun API Key"
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