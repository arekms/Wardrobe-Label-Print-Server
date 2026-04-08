# Wardrobe Label Print Server - Windows Service Installation Script

# Enforce script execution in admin mode
if (-not ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "ERROR: This script must be run as Administrator" -ForegroundColor Red
    Write-Host "Please right-click PowerShell and select Run as administrator" -ForegroundColor Yellow
    exit 1
}

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "Wardrobe Label Print Server - Service Installation" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Get the directory where this script is located
$scriptPath = Split-Path -Parent -Path $MyInvocation.MyCommand.Definition
Write-Host "Installation directory: $scriptPath" -ForegroundColor Gray

# Step 1: Verify Node.js is installed
Write-Host ""
Write-Host "Step 1: Verifying Node.js installation..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "Node.js $nodeVersion found" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Node.js not found in PATH" -ForegroundColor Red
    Write-Host "Please install Node.js 12.x or higher and ensure it's in your system PATH" -ForegroundColor Yellow
    exit 1
}

# Step 2: Verify .env file exists
Write-Host ""
Write-Host "Step 2: Verifying configuration (.env file)..." -ForegroundColor Yellow
$envPath = Join-Path $scriptPath ".env"
if (-not (Test-Path $envPath)) {
    Write-Host "ERROR: .env file not found at $envPath" -ForegroundColor Red
    Write-Host "Please copy .env.example to .env and configure your database credentials" -ForegroundColor Yellow
    exit 1
}
Write-Host "Configuration file found" -ForegroundColor Green

# Step 3: Install npm dependencies
Write-Host ""
Write-Host "Step 3: Installing Node.js dependencies..." -ForegroundColor Yellow

# For older Node.js versions, delete package-lock.json to avoid version conflicts
if (Test-Path "$scriptPath\package-lock.json") {
    Write-Host "Removing incompatible package-lock.json..." -ForegroundColor Gray
    Remove-Item "$scriptPath\package-lock.json" -Force
}

Push-Location $scriptPath
try {
    npm install --production --no-save
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: npm install failed" -ForegroundColor Red
        exit 1
    }
    Write-Host "Dependencies installed" -ForegroundColor Green
} finally {
    Pop-Location
}

# Step 4: Install node-windows globally if not already installed
Write-Host ""
Write-Host "Step 4: Installing Windows service wrapper (node-windows)..." -ForegroundColor Yellow
try {
    npm install -g node-windows 2>&1 | Out-Null
    Write-Host "node-windows ready" -ForegroundColor Green
} catch {
    Write-Host "Warning: Could not verify node-windows installation" -ForegroundColor Yellow
}

# Step 5: Create the service installer script
Write-Host ""
Write-Host "Step 5: Creating service installer..." -ForegroundColor Yellow

$serviceInstaller = @"
const Service = require('node-windows').Service;
const path = require('path');

// Service configuration
const svc = new Service({
  name: 'WardrobleLabelPrintServer',
  description: 'Prints warehouse labels continuously to thermal printer',
  script: path.join(__dirname, 'src', 'app.js'),
  nodeOptions: '--max-old-space-size=512',
  workingDirectory: __dirname,
  wait: 2,
  grow: 0.25,
  maxRestarts: 5,
  maxRestartInterval: 60000,
  stopOnUninstall: true
});

svc.on('install', () => {
  console.log('Service installed successfully');
  svc.start();
});

svc.on('start', () => {
  console.log('Service started');
});

svc.on('error', (err) => {
  console.error('Service error:', err.message);
  process.exit(1);
});

// Install and start the service
svc.install();
"@

$installerPath = Join-Path $scriptPath "install-service-helper.js"
Set-Content -Path $installerPath -Value $serviceInstaller -Encoding UTF8
Write-Host "Service installer created" -ForegroundColor Green

# Step 6: Run the service installer
Write-Host ""
Write-Host "Step 6: Registering Windows service..." -ForegroundColor Yellow
Push-Location $scriptPath
try {
    node install-service-helper.js
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Service installation failed" -ForegroundColor Red
        exit 1
    }
} finally {
    Pop-Location
}

# Clean up helper script
Remove-Item -Path $installerPath -Force -ErrorAction SilentlyContinue

# Step 7: Verify service is running
Write-Host ""
Write-Host "Step 7: Verifying service registration..." -ForegroundColor Yellow
Start-Sleep -Seconds 2
$service = Get-Service -Name 'WardrobleLabelPrintServer' -ErrorAction SilentlyContinue
if ($service) {
    Write-Host "Service registered: $($service.Name)" -ForegroundColor Green
    Write-Host "  Status: $($service.Status)" -ForegroundColor Gray
    Write-Host "  Start Type: $($service.StartType)" -ForegroundColor Gray
} else {
    Write-Host "WARNING: Service may not have registered properly" -ForegroundColor Yellow
}

# Final summary
Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "Installation Complete!" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Service Information:" -ForegroundColor Yellow
Write-Host "  Name: WardrobleLabelPrintServer" -ForegroundColor Gray
Write-Host "  Type: Windows Service (auto-start)" -ForegroundColor Gray
Write-Host "  Start Type: Automatic" -ForegroundColor Gray
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  1. The service should be starting now (may take 10-20 seconds)" -ForegroundColor Gray
Write-Host "  2. Check service status: services.msc (Windows Services)" -ForegroundColor Gray
Write-Host "  3. View logs: Get-Content logs/combined.log -Tail 20" -ForegroundColor Gray
Write-Host "  4. To stop the service: Stop-Service -Name WardrobleLabelPrintServer" -ForegroundColor Gray
Write-Host "  5. To uninstall: .\uninstall-service.ps1" -ForegroundColor Gray
Write-Host ""
Write-Host "Troubleshooting:" -ForegroundColor Yellow
Write-Host "  - Check database connectivity: node test_connection.js" -ForegroundColor Gray
Write-Host "  - Check printer connectivity: node test_print.js" -ForegroundColor Gray
Write-Host "  - View error logs: Get-Content logs/error.log -Tail 50" -ForegroundColor Gray
Write-Host ""
