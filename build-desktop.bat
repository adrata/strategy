@echo off
echo ========================================
echo Adrata Desktop App Builder
echo ========================================
echo.

echo This script will build the Adrata desktop app for Windows.
echo.

echo Available build options:
echo 1. Full build and deploy (recommended)
echo 2. Simple build
echo 3. Tauri-only build
echo 4. Install Visual Studio Build Tools
echo 5. Exit
echo.

set /p choice="Enter your choice (1-5): "

if "%choice%"=="1" (
    echo.
    echo Running full build and deploy...
    call scripts\build\build-and-deploy-desktop.bat
) else if "%choice%"=="2" (
    echo.
    echo Running simple build...
    call scripts\build\build-simple.bat
) else if "%choice%"=="3" (
    echo.
    echo Running Tauri-only build...
    call scripts\build\build-tauri-only.bat
) else if "%choice%"=="4" (
    echo.
    echo Installing Visual Studio Build Tools...
    call scripts\build\install-build-tools.bat
) else if "%choice%"=="5" (
    echo.
    echo Exiting...
    exit /b 0
) else (
    echo.
    echo Invalid choice. Please run the script again.
    pause
    exit /b 1
)

echo.
echo Build process completed!
pause
