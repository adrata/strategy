@echo off
REM Tauri Build Script for Windows
REM This script builds the Tauri application for Windows

setlocal enabledelayedexpansion

REM Colors for output (Windows doesn't support colors in batch, so we'll use echo)
set "INFO=[INFO]"
set "SUCCESS=[SUCCESS]"
set "WARNING=[WARNING]"
set "ERROR=[ERROR]"

REM Function to print status
:print_status
echo %INFO% %~1
goto :eof

:print_success
echo %SUCCESS% %~1
goto :eof

:print_warning
echo %WARNING% %~1
goto :eof

:print_error
echo %ERROR% %~1
goto :eof

REM Function to check if command exists
:command_exists
where %1 >nul 2>&1
if %errorlevel% equ 0 (
    exit /b 0
) else (
    exit /b 1
)

REM Function to check prerequisites
:check_prerequisites
call :print_status "Checking prerequisites..."

REM Check Node.js
call :command_exists node
if %errorlevel% neq 0 (
    call :print_error "Node.js is not installed. Please install Node.js 18 or later."
    exit /b 1
)

REM Check npm
call :command_exists npm
if %errorlevel% neq 0 (
    call :print_error "npm is not installed. Please install npm."
    exit /b 1
)

REM Check Rust
call :command_exists cargo
if %errorlevel% neq 0 (
    call :print_error "Rust is not installed. Please install Rust from https://rustup.rs/"
    exit /b 1
)

REM Check Tauri CLI
call :command_exists tauri
if %errorlevel% neq 0 (
    call :print_warning "Tauri CLI not found. Installing..."
    cargo install tauri-cli
)

call :print_success "All prerequisites are installed."
goto :eof

REM Function to install dependencies
:install_dependencies
call :print_status "Installing dependencies..."

REM Install frontend dependencies
npm ci
if %errorlevel% neq 0 (
    call :print_error "Failed to install frontend dependencies."
    exit /b 1
)

REM Install Rust dependencies
cd src-tauri
cargo fetch
if %errorlevel% neq 0 (
    call :print_error "Failed to fetch Rust dependencies."
    exit /b 1
)
cd ..

call :print_success "Dependencies installed successfully."
goto :eof

REM Function to run tests
:run_tests
call :print_status "Running tests..."

REM Run frontend tests
npm run test
if %errorlevel% neq 0 (
    call :print_error "Frontend tests failed."
    exit /b 1
)

REM Run Rust tests
cd src-tauri
cargo test
if %errorlevel% neq 0 (
    call :print_error "Rust tests failed."
    exit /b 1
)
cd ..

call :print_success "All tests passed."
goto :eof

REM Function to build frontend
:build_frontend
call :print_status "Building frontend..."

npm run build
if %errorlevel% neq 0 (
    call :print_error "Frontend build failed."
    exit /b 1
)

call :print_success "Frontend built successfully."
goto :eof

REM Function to build Tauri app
:build_tauri
set "platform=%~1"
if "%platform%"=="" set "platform=windows"

call :print_status "Building Tauri app for %platform%..."

cd src-tauri

if "%platform%"=="windows" (
    cargo tauri build
) else if "%platform%"=="linux" (
    cargo tauri build --target x86_64-unknown-linux-gnu
) else if "%platform%"=="all" (
    cargo tauri build
    cargo tauri build --target x86_64-unknown-linux-gnu
) else (
    call :print_error "Unknown platform: %platform%"
    exit /b 1
)

if %errorlevel% neq 0 (
    call :print_error "Tauri build failed."
    exit /b 1
)

cd ..

call :print_success "Tauri app built successfully for %platform%."
goto :eof

REM Function to create release
:create_release
set "version=%~1"
if "%version%"=="" (
    call :print_error "Version is required for release command."
    exit /b 1
)

call :print_status "Creating release for version %version%..."

REM Create release directory
if not exist "releases\%version%" mkdir "releases\%version%"

REM Copy built applications
xcopy "src-tauri\target\release\bundle\*" "releases\%version%\" /E /I /Y

call :print_success "Release created successfully."
goto :eof

REM Function to clean build artifacts
:clean
call :print_status "Cleaning build artifacts..."

REM Clean frontend
if exist ".next" rmdir /s /q ".next"
if exist "out" rmdir /s /q "out"

REM Clean Rust
cd src-tauri
cargo clean
cd ..

REM Clean releases
if exist "releases" rmdir /s /q "releases"

call :print_success "Build artifacts cleaned."
goto :eof

REM Function to show help
:show_help
echo Tauri Build Script for Windows
echo.
echo Usage: %0 [COMMAND] [OPTIONS]
echo.
echo Commands:
echo   build [PLATFORM]    Build the Tauri app for specified platform
echo                        Platforms: windows, linux, all
echo   test                Run all tests
echo   clean               Clean build artifacts
echo   release [VERSION]   Create a release package
echo   dev                 Start development server
echo   help                Show this help message
echo.
echo Examples:
echo   %0 build windows     Build for Windows
echo   %0 build all         Build for all platforms
echo   %0 test              Run tests
echo   %0 release v1.0.0    Create release v1.0.0
echo   %0 clean             Clean build artifacts
goto :eof

REM Main script logic
set "command=%~1"
set "option=%~2"

if "%command%"=="build" (
    call :check_prerequisites
    call :install_dependencies
    call :build_frontend
    call :build_tauri %option%
) else if "%command%"=="test" (
    call :check_prerequisites
    call :install_dependencies
    call :run_tests
) else if "%command%"=="clean" (
    call :clean
) else if "%command%"=="release" (
    call :check_prerequisites
    call :install_dependencies
    call :build_frontend
    call :build_tauri all
    call :create_release %option%
) else if "%command%"=="dev" (
    call :check_prerequisites
    call :install_dependencies
    call :print_status "Starting development server..."
    npm run dev
) else if "%command%"=="help" (
    call :show_help
) else if "%command%"=="--help" (
    call :show_help
) else if "%command%"=="-h" (
    call :show_help
) else if "%command%"=="" (
    call :show_help
) else (
    call :print_error "Unknown command: %command%"
    call :show_help
    exit /b 1
)

endlocal
