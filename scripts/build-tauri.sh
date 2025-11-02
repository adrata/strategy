#!/bin/bash

# Tauri Build Script
# This script builds the Tauri application for all platforms

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check Node.js
    if ! command_exists node; then
        print_error "Node.js is not installed. Please install Node.js 18 or later."
        exit 1
    fi
    
    # Check npm
    if ! command_exists npm; then
        print_error "npm is not installed. Please install npm."
        exit 1
    fi
    
    # Check Rust
    if ! command_exists cargo; then
        print_error "Rust is not installed. Please install Rust from https://rustup.rs/"
        exit 1
    fi
    
    # Check Tauri CLI
    if ! command_exists tauri; then
        print_warning "Tauri CLI not found. Installing..."
        cargo install tauri-cli
    fi
    
    print_success "All prerequisites are installed."
}

# Function to install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    
    # Install frontend dependencies
    npm ci
    
    # Install Rust dependencies
    cd src-desktop
    cargo fetch
    cd ..
    
    print_success "Dependencies installed successfully."
}

# Function to run tests
run_tests() {
    print_status "Running tests..."
    
    # Run frontend tests
    npm run test
    
    # Run Rust tests
    cd src-desktop
    cargo test
    cd ..
    
    print_success "All tests passed."
}

# Function to build frontend
build_frontend() {
    print_status "Building frontend..."
    
    npm run build
    
    print_success "Frontend built successfully."
}

# Function to build Tauri app
build_tauri() {
    local platform=$1
    
    print_status "Building Tauri app for $platform..."
    
    cd src-desktop
    
    case $platform in
        "linux")
            cargo tauri build
            ;;
        "windows")
            cargo tauri build --target x86_64-pc-windows-msvc
            ;;
        "macos")
            cargo tauri build --target x86_64-apple-darwin
            ;;
        "all")
            cargo tauri build
            cargo tauri build --target x86_64-pc-windows-msvc
            cargo tauri build --target x86_64-apple-darwin
            ;;
        *)
            print_error "Unknown platform: $platform"
            exit 1
            ;;
    esac
    
    cd ..
    
    print_success "Tauri app built successfully for $platform."
}

# Function to create release
create_release() {
    local version=$1
    
    print_status "Creating release for version $version..."
    
    # Create release directory
    mkdir -p releases/$version
    
    # Copy built applications
    cp -r src-desktop/target/release/bundle/* releases/$version/
    
    # Create checksums
    cd releases/$version
    find . -name "*.deb" -o -name "*.msi" -o -name "*.dmg" -o -name "*.app" | while read file; do
        sha256sum "$file" > "$file.sha256"
    done
    cd ../..
    
    print_success "Release created successfully."
}

# Function to clean build artifacts
clean() {
    print_status "Cleaning build artifacts..."
    
    # Clean frontend
    rm -rf .next
    rm -rf out
    
    # Clean Rust
    cd src-desktop
    cargo clean
    cd ..
    
    # Clean releases
    rm -rf releases
    
    print_success "Build artifacts cleaned."
}

# Function to show help
show_help() {
    echo "Tauri Build Script"
    echo ""
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  build [PLATFORM]    Build the Tauri app for specified platform"
    echo "                       Platforms: linux, windows, macos, all"
    echo "  test                Run all tests"
    echo "  clean               Clean build artifacts"
    echo "  release [VERSION]   Create a release package"
    echo "  dev                 Start development server"
    echo "  help                Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 build linux      Build for Linux"
    echo "  $0 build all        Build for all platforms"
    echo "  $0 test             Run tests"
    echo "  $0 release v1.0.0   Create release v1.0.0"
    echo "  $0 clean            Clean build artifacts"
}

# Main script logic
main() {
    local command=$1
    local option=$2
    
    case $command in
        "build")
            check_prerequisites
            install_dependencies
            build_frontend
            build_tauri ${option:-linux}
            ;;
        "test")
            check_prerequisites
            install_dependencies
            run_tests
            ;;
        "clean")
            clean
            ;;
        "release")
            if [ -z "$option" ]; then
                print_error "Version is required for release command."
                exit 1
            fi
            check_prerequisites
            install_dependencies
            build_frontend
            build_tauri all
            create_release $option
            ;;
        "dev")
            check_prerequisites
            install_dependencies
            print_status "Starting development server..."
            npm run dev
            ;;
        "help"|"--help"|"-h")
            show_help
            ;;
        "")
            show_help
            ;;
        *)
            print_error "Unknown command: $command"
            show_help
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"
