# Wardrobe Label Print Server - Standalone Launcher (PowerShell)
# This script starts the application directly (not as a service)

$scriptPath = Split-Path -Parent -Path $MyInvocation.MyCommand.Definition

# Verify .env exists
$envPath = Join-Path $scriptPath ".env"
if (-not (Test-Path $envPath)) {
    Write-Host "ERROR: .env file not found" -ForegroundColor Red
    Write-Host "Please copy .env.example to .env and configure your credentials" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if node_modules exists, if not install
$nodeModulesPath = Join-Path $scriptPath "node_modules"
if (-not (Test-Path $nodeModulesPath)) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    Push-Location $scriptPath
    npm install --omit=dev
    Pop-Location
}

# Start the application
Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "Wardrobe Label Print Server - Starting" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop the application" -ForegroundColor Yellow
Write-Host ""

Push-Location $scriptPath
node src/app.js
