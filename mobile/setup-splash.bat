@echo off
REM Setup script for Defendish Animated Splash Screen
REM This script helps verify the splash screen setup

echo ====================================
echo Defendish Animated Splash Screen
echo Setup & Verification Script
echo ====================================
echo.

REM Check if we're in the mobile directory
if not exist "components\AnimatedSplash.tsx" (
    echo Error: This script must be run from the mobile/ directory
    pause
    exit /b 1
)

echo ✓ AnimatedSplash component found
echo.

REM Check if logo exists
if exist "assets\defendish-logo.png" (
    echo ✓ Logo file found: assets\defendish-logo.png
    echo ✓ Splash screen is ready!
    echo.
    echo Next step: Start the app with 'npm start' or 'expo start'
) else (
    echo ✗ Logo file NOT found at: assets\defendish-logo.png
    echo.
    echo SETUP REQUIRED:
    echo ================
    echo.
    echo Please save the Defendish logo image as:
    echo   assets\defendish-logo.png
    echo.
    echo Image Requirements:
    echo   - Format: PNG
    echo   - Minimum size: 400x400 pixels
    echo   - Recommended: 800x800+ for crisp display
    echo.
    echo After saving the image, run: npm start
    echo.
)

echo.
echo Key Files:
echo   - Component: components\AnimatedSplash.tsx
echo   - Usage: app\index.tsx
echo   - Logo: assets\defendish-logo.png (needs to be added)
echo   - Documentation: SPLASH_SETUP.md
echo.

pause
