# Wardrobe Label Print Server - Windows Service Uninstall Script

# Enforce script execution in admin mode
if (-not ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "ERROR: This script must be run as Administrator" -ForegroundColor Red
    Write-Host "Please right-click PowerShell and select Run as administrator" -ForegroundColor Yellow
    exit 1
}

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "Wardrobe Label Print Server - Service Uninstall" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Get the directory where this script is located
$scriptPath = Split-Path -Parent -Path $MyInvocation.MyCommand.Definition

# Check if service exists
Write-Host "Checking for existing service..." -ForegroundColor Yellow
$service = Get-Service -Name 'WardrobleLabelPrintServer' -ErrorAction SilentlyContinue

if (-not $service) {
    Write-Host "⚠ Service 'WardrobleLabelPrintServer' is not installed" -ForegroundColor Yellow
    exit 0
}

Write-Host "Service found" -ForegroundColor Green
Write-Host ""

# Stop the service if running
if ($service.Status -eq 'Running') {
    Write-Host "Stopping service..." -ForegroundColor Yellow
    Stop-Service -Name 'WardrobleLabelPrintServer' -Force
    Start-Sleep -Seconds 2
    Write-Host "Service stopped" -ForegroundColor Green
} else {
    Write-Host "Service is already stopped" -ForegroundColor Gray
}

Write-Host ""
Write-Host "Uninstalling service..." -ForegroundColor Yellow

# Create uninstaller script
$uninstaller = @"
const Service = require('node-windows').Service;
const path = require('path');

const svc = new Service({
  name: 'WardrobleLabelPrintServer',
  script: path.join(__dirname, 'src', 'app.js')
});

svc.on('uninstall', () => {
  console.log('Service uninstalled successfully');
  process.exit(0);
});

svc.on('error', (err) => {
  console.error('Uninstall error:', err.message);
  process.exit(1);
});

// Uninstall the service
svc.uninstall();
"@

$uninstallerPath = Join-Path $scriptPath "uninstall-service-helper.js"
Set-Content -Path $uninstallerPath -Value $uninstaller -Encoding UTF8

# Run uninstaller
Push-Location $scriptPath
try {
    node uninstall-service-helper.js
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Service uninstalled" -ForegroundColor Green
    }
} finally {
    Pop-Location
}

# Clean up helper script
Remove-Item -Path $uninstallerPath -Force -ErrorAction SilentlyContinue

# Final confirmation
Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "Uninstallation Complete!" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "The service has been removed from Windows Services." -ForegroundColor Gray
Write-Host ""
Write-Host "To reinstall the service, run: .\install-service.ps1" -ForegroundColor Yellow
Write-Host ""
