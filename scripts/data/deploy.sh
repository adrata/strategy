#!/bin/bash

# Adrata Lead Data Import Deployment Script
# Handles both development and production environments
# 
# Usage:
#   ./deploy.sh dev     # Deploy to local development
#   ./deploy.sh prod    # Deploy to production

set -e  # Exit on any error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if environment is provided
if [ $# -eq 0 ]; then
    print_error "Please specify environment: dev or prod"
    echo "Usage: ./deploy.sh [dev|prod]"
    exit 1
fi

ENVIRONMENT=$1

# Validate environment
if [ "$ENVIRONMENT" != "dev" ] && [ "$ENVIRONMENT" != "prod" ]; then
    print_error "Invalid environment: $ENVIRONMENT"
    echo "Valid environments: dev, prod"
    exit 1
fi

print_status "🚀 Starting deployment to $ENVIRONMENT environment..."

# Set database URLs based on environment
if [ "$ENVIRONMENT" = "dev" ]; then
    DATABASE_URL="postgresql://rosssylvester:Themill08!@localhost:5432/magic"
    WORKSPACE_ID="c854dff0-27db-4e79-a47b-787b0618a353"
    USER_ID="6e90c006-12e3-4c4e-84fb-94cc2383585a"
    print_status "🔧 Configured for local development database"
elif [ "$ENVIRONMENT" = "prod" ]; then
    DATABASE_URL="postgresql://neondb_owner:npg_DtnFYHvWj6m8@ep-damp-math-a8ht5oj3.eastus2.azure.neon.tech/neondb?sslmode=require"
    WORKSPACE_ID="6c224ee0-2484-4af1-ab42-918e4546e0f0"
    USER_ID="2feca06d-5e57-4eca-b44e-0947f755a930"
    print_status "☁️  Configured for production database (Neon)"
fi

# Export database URL for Prisma
export DATABASE_URL=$DATABASE_URL

print_status "📋 Configuration Summary:"
echo "  Environment: $ENVIRONMENT"
echo "  Workspace ID: $WORKSPACE_ID"
echo "  User ID: $USER_ID"
echo "  Database: ${DATABASE_URL%%@*}@[REDACTED]"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run from the project root directory."
    exit 1
fi

# Check if lead data file exists
if [ ! -f "data/raw/lead-data-full.csv" ]; then
    print_error "Lead data file not found: data/raw/lead-data-full.csv"
    exit 1
fi

print_status "📊 Checking lead data file..."
LEAD_COUNT=$(tail -n +2 data/raw/lead-data-full.csv | wc -l | tr -d ' ')
print_success "Found $LEAD_COUNT leads in CSV file"

# Test database connection
print_status "🔌 Testing database connection..."
if npx prisma db execute --stdin <<< "SELECT 1;" > /dev/null 2>&1; then
    print_success "Database connection successful"
else
    print_error "Database connection failed"
    print_warning "Please check your database credentials and network connection"
    exit 1
fi

# Check if workspace and user exist
print_status "🔍 Verifying workspace and user..."
WORKSPACE_CHECK=$(npx prisma db execute --stdin <<< "SELECT COUNT(*) FROM \"Workspace\" WHERE id = '$WORKSPACE_ID';" 2>/dev/null | tail -1 | tr -d ' ')
USER_CHECK=$(npx prisma db execute --stdin <<< "SELECT COUNT(*) FROM \"User\" WHERE id = '$USER_ID';" 2>/dev/null | tail -1 | tr -d ' ')

if [ "$WORKSPACE_CHECK" = "1" ]; then
    print_success "Workspace verified"
else
    print_error "Workspace $WORKSPACE_ID not found in database"
    exit 1
fi

if [ "$USER_CHECK" = "1" ]; then
    print_success "User verified"
else
    print_error "User $USER_ID not found in database"
    exit 1
fi

# Check current lead count before import
print_status "📈 Checking current lead count..."
CURRENT_LEADS=$(npx prisma db execute --stdin <<< "SELECT COUNT(*) FROM \"Lead\" WHERE \"workspaceId\" = '$WORKSPACE_ID';" 2>/dev/null | tail -1 | tr -d ' ')
print_status "Current leads in workspace: $CURRENT_LEADS"

# Confirm import for production
if [ "$ENVIRONMENT" = "prod" ]; then
    print_warning "⚠️  You are about to import $LEAD_COUNT leads to PRODUCTION!"
    print_warning "Current production lead count: $CURRENT_LEADS"
    echo ""
    read -p "Are you sure you want to continue? (yes/no): " CONFIRM
    if [ "$CONFIRM" != "yes" ]; then
        print_status "Import cancelled by user"
        exit 0
    fi
fi

# Install dependencies if needed
print_status "📦 Checking dependencies..."
if [ ! -d "data/scripts/node_modules" ]; then
    print_status "Installing import script dependencies..."
    cd data/scripts
    npm install
    cd ../..
else
    print_success "Dependencies already installed"
fi

# Run Prisma migrations if needed (only for dev)
if [ "$ENVIRONMENT" = "dev" ]; then
    print_status "🔄 Applying database migrations..."
    if npx prisma migrate deploy; then
        print_success "Migrations applied successfully"
    else
        print_error "Migration failed"
        exit 1
    fi
fi

# Generate Prisma client
print_status "🔨 Generating Prisma client..."
if npx prisma generate; then
    print_success "Prisma client generated"
else
    print_error "Prisma client generation failed"
    exit 1
fi

# Create backup before import (production only)
if [ "$ENVIRONMENT" = "prod" ]; then
    print_status "💾 Creating backup before import..."
    BACKUP_FILE="backup-$(date +%Y%m%d-%H%M%S).sql"
    # Note: This would require pg_dump access to production
    print_warning "Manual backup recommended before production import"
fi

# Run the import
print_status "🚀 Starting lead data import..."
print_status "This may take several minutes for large datasets..."

if cd data/scripts && node import-lead-data.js $ENVIRONMENT; then
    cd ../..
    print_success "Import completed successfully!"
    
    # Check final lead count
    print_status "📊 Checking final lead count..."
    FINAL_LEADS=$(npx prisma db execute --stdin <<< "SELECT COUNT(*) FROM \"Lead\" WHERE \"workspaceId\" = '$WORKSPACE_ID';" 2>/dev/null | tail -1 | tr -d ' ')
    IMPORTED_COUNT=$((FINAL_LEADS - CURRENT_LEADS))
    
    print_success "Final Results:"
    echo "  Previous leads: $CURRENT_LEADS"
    echo "  Final leads: $FINAL_LEADS"
    echo "  Leads imported: $IMPORTED_COUNT"
    
    # Deployment complete
    print_success "🎉 Deployment to $ENVIRONMENT completed successfully!"
    
    if [ "$ENVIRONMENT" = "prod" ]; then
        print_status "🔗 You can now view the leads at: https://adrata.com/aos"
    else
        print_status "🔗 You can now view the leads at: http://localhost:3000/aos"
    fi
    
else
    cd ../..
    print_error "Import failed!"
    exit 1
fi 