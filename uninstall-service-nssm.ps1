# Wardrobe Label Print Server - Service Uninstall (NSSM)

# Enforce admin mode
if (-not ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "ERROR: This script must be run as Administrator" -ForegroundColor Red
    exit 1
}

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "Wardrobe Label Print Server - Service Uninstall" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

$scriptPath = Split-Path -Parent -Path $MyInvocation.MyCommand.Definition
$nssmPath = Join-Path $scriptPath "nssm.exe"
$serviceName = "WardrobleLabelPrintServer"

# Check if NSSM exists
if (-not (Test-Path $nssmPath)) {
    Write-Host "ERROR: nssm.exe not found at $nssmPath" -ForegroundColor Red
    exit 1
}

# Check if service exists
$service = Get-Service -Name $serviceName -ErrorAction SilentlyContinue
if (-not $service) {
    Write-Host "Service is not installed" -ForegroundColor Yellow
    exit 0
}

Write-Host "Service found: $serviceName" -ForegroundColor Yellow
Write-Host ""

# Stop service if running
if ($service.Status -eq "Running") {
    Write-Host "Stopping service..." -ForegroundColor Yellow
    & $nssmPath stop $serviceName
    Start-Sleep -Seconds 2
    Write-Host "Service stopped" -ForegroundColor Green
}

# Remove service
Write-Host ""
Write-Host "Removing service..." -ForegroundColor Yellow
& $nssmPath remove $serviceName confirm

# Verify
$service = Get-Service -Name $serviceName -ErrorAction SilentlyContinue
if (-not $service) {
    Write-Host "Service removed" -ForegroundColor Green
}
else {
    Write-Host "WARNING: Service still exists" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host "Uninstallation Complete!" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""
