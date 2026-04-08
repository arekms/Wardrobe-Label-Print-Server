# Wardrobe Label Print Server - Windows Service Installation (NSSM)
# NSSM is a reliable service manager that works with any Node.js version

# Enforce admin mode
if (-not ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "ERROR: This script must be run as Administrator" -ForegroundColor Red
    exit 1
}

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "Wardrobe Label Print Server - Service Installation (NSSM)" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

$scriptPath = Split-Path -Parent -Path $MyInvocation.MyCommand.Definition
$nssmPath = Join-Path $scriptPath "nssm.exe"

# Step 1: Verify Node.js
Write-Host "Step 1: Verifying Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "Node.js $nodeVersion found" -ForegroundColor Green
}
catch {
    Write-Host "ERROR: Node.js not found" -ForegroundColor Red
    exit 1
}

# Step 2: Verify .env
Write-Host ""
Write-Host "Step 2: Verifying configuration (.env)..." -ForegroundColor Yellow
$envPath = Join-Path $scriptPath ".env"
if (-not (Test-Path $envPath)) {
    Write-Host "ERROR: .env file not found" -ForegroundColor Red
    exit 1
}
Write-Host "Configuration file found" -ForegroundColor Green

# Step 3: Install npm dependencies
Write-Host ""
Write-Host "Step 3: Installing dependencies..." -ForegroundColor Yellow
Push-Location $scriptPath
try {
    npm install --omit=dev
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: npm install failed" -ForegroundColor Red
        exit 1
    }
    Write-Host "Dependencies installed" -ForegroundColor Green
}
finally {
    Pop-Location
}

# Step 4: Download NSSM if not present
Write-Host ""
Write-Host "Step 4: Checking for NSSM service manager..." -ForegroundColor Yellow

if (-not (Test-Path $nssmPath)) {
    Write-Host "Downloading NSSM (this may take a moment)..." -ForegroundColor Gray
    
    # Try multiple URLs for NSSM
    $nssmUrls = @(
        "https://nssm.cc/download/nssm-2.24-101-g897c7ad.zip",
        "https://github.com/nssm-mirror/nssm/releases/download/2.24-101-g897c7ad/nssm-2.24-101-g897c7ad.zip"
    )
    
    $nssmZip = Join-Path $scriptPath "nssm.zip"
    $downloaded = $false
    
    foreach ($url in $nssmUrls) {
        try {
            Write-Host "Trying: $url" -ForegroundColor Gray
            [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
            Invoke-WebRequest -Uri $url -OutFile $nssmZip -UseBasicParsing -ErrorAction Stop
            $downloaded = $true
            Write-Host "Downloaded successfully" -ForegroundColor Green
            break
        }
        catch {
            Write-Host "Failed: $($_.Exception.Message)" -ForegroundColor Gray
        }
    }
    
    if (-not $downloaded) {
        Write-Host ""
        Write-Host "ERROR: Could not download NSSM automatically" -ForegroundColor Red
        Write-Host ""
        Write-Host "Manual Setup Required:" -ForegroundColor Yellow
        Write-Host "1. Download NSSM from: https://nssm.cc/download" -ForegroundColor Gray
        Write-Host "2. Extract the ZIP file" -ForegroundColor Gray
        Write-Host "3. Copy nssm.exe (from win64 or win32 folder) to: $scriptPath" -ForegroundColor Gray
        Write-Host "4. Run this script again" -ForegroundColor Gray
        exit 1
    }
    
    try {
        Write-Host "Extracting NSSM..." -ForegroundColor Gray
        Expand-Archive -Path $nssmZip -DestinationPath $scriptPath -Force
        
        # Find nssm.exe in extracted folder (supports both 32-bit and 64-bit)
        $nssmExe = Get-ChildItem -Path $scriptPath -Filter "nssm.exe" -Recurse | Select-Object -First 1
        if ($nssmExe) {
            Copy-Item -Path $nssmExe.FullName -Destination $nssmPath -Force
            Write-Host "NSSM ready" -ForegroundColor Green
        }
        else {
            Write-Host "ERROR: Could not find nssm.exe in archive" -ForegroundColor Red
            exit 1
        }
        
        Remove-Item -Path $nssmZip -Force
    }
    catch {
        Write-Host "ERROR: Failed to extract NSSM: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
}
else {
    Write-Host "NSSM already installed" -ForegroundColor Green
}

# Step 5: Install the service
Write-Host ""
Write-Host "Step 5: Installing Windows service..." -ForegroundColor Yellow

$serviceName = "WardrobleLabelPrintServer"
$nodeExe = (Get-Command node).Path
$appJs = Join-Path $scriptPath "src\app.js"

# Check if service already exists
$existingService = Get-Service -Name $serviceName -ErrorAction SilentlyContinue
if ($existingService) {
    Write-Host "Service already exists, removing old version..." -ForegroundColor Gray
    & $nssmPath stop $serviceName
    Start-Sleep -Seconds 2
    & $nssmPath remove $serviceName confirm
    Start-Sleep -Seconds 2
}

# Install the service
& $nssmPath install $serviceName $nodeExe $appJs
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to install service" -ForegroundColor Red
    exit 1
}

# Configure service
& $nssmPath set $serviceName AppDirectory $scriptPath
& $nssmPath set $serviceName AppStdout (Join-Path $scriptPath "logs\service.log")
& $nssmPath set $serviceName AppStderr (Join-Path $scriptPath "logs\service.log")
& $nssmPath set $serviceName AppRestartDelay 5000

Write-Host "Service installed" -ForegroundColor Green

# Step 6: Start the service
Write-Host ""
Write-Host "Step 6: Starting service..." -ForegroundColor Yellow
& $nssmPath start $serviceName
Start-Sleep -Seconds 3

# Verify
$service = Get-Service -Name $serviceName -ErrorAction SilentlyContinue
if ($service -and $service.Status -eq "Running") {
    Write-Host "Service is running" -ForegroundColor Green
}
else {
    Write-Host "WARNING: Service may not have started" -ForegroundColor Yellow
}

# Summary
Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host "Installation Complete!" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Service Name: $serviceName" -ForegroundColor Yellow
Write-Host "Service Status: $($service.Status)" -ForegroundColor Yellow
Write-Host ""
Write-Host "Common Commands:" -ForegroundColor Yellow
Write-Host "  Check status: Get-Service -Name $serviceName" -ForegroundColor Gray
Write-Host "  View logs: Get-Content logs/service.log -Tail 20" -ForegroundColor Gray
Write-Host "  Stop service: Stop-Service -Name $serviceName" -ForegroundColor Gray
Write-Host "  Start service: Start-Service -Name $serviceName" -ForegroundColor Gray
Write-Host "  Uninstall: .\uninstall-service-nssm.ps1" -ForegroundColor Gray
Write-Host ""
