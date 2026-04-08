# Wardrobe Label Print Server - Windows Deployment Guide

This guide explains how to install and deploy the Wardrobe Label Print Server as a Windows Service on a new computer.

## System Requirements

- **Operating System:** Windows Server 2012 R2+ or Windows 7+
- **Node.js:** Version 18 LTS or higher (tested with Node.js 22)
- **RAM:** Minimum 512MB available for Node.js process
- **Network:** Access to SQL Server (av-sql2) and printer (10.2.1.61:9100)

## Pre-Installation Checklist

Before running the installation script, ensure:

- [ ] Node.js is installed and in system PATH (verify: `node --version`)
- [ ] You have Administrator privileges on the target computer
- [ ] `.env` file is configured with database credentials (see Configuration section)
- [ ] SQL Server connectivity is confirmed
- [ ] Printer is on the network and accessible at 10.2.1.61:9100

## Installation Steps

### Step 1: Prepare the Installation Package

1. Copy the entire `WLPS` folder to the target computer (e.g., `C:\Apps\WLPS`)
2. Navigate to that folder in PowerShell or File Explorer

### Step 2: Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```powershell
   Copy-Item .env.example .env
   ```

2. Edit `.env` with your database credentials:
   ```
   WLPS_DB_SERVER=av-sql2
   WLPS_DB_DATABASE=Wardrobe01Prod
   WLPS_DB_USERNAME=Wardrobe
   WLPS_DB_PASSWORD=your-secure-password
   WLPS_DB_ENCRYPT=false
   WLPS_DB_TRUST_CERT=true
   WLPS_DB_CONNECT_TIMEOUT=30000
   
   PRINTER_IP=10.2.1.61
   PRINTER_PORT=9100
   
   NODE_ENV=production
   LOG_LEVEL=info
   POLLING_INTERVAL=5000
   ```

### Step 3: Run the Installation Script

1. **Open PowerShell as Administrator:**
   - Press `Win+X` and select "Windows PowerShell (Admin)"
   - Or right-click PowerShell and select "Run as administrator"

2. **Allow script execution** (STEP A - Do this first):
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process
   ```
   
   PowerShell will prompt: **"Do you want to change the execution policy?"**
   
   Response options: `Yes`, `Yes to All`, `No`, `No to All`, `Suspend`
   
   Type: **`Y`** and press **Enter** to continue, then wait for the prompt to return.

3. **Run the installation script** (STEP B - After STEP A completes):
   ```powershell
   cd C:\Apps\WLPS
   .\install-service.ps1
   ```
   
   ⚠️ **Important:** Complete Step A and wait for the prompt to return before running Step B. These are two separate commands that must be executed sequentially.

The script will:
- ✓ Verify Node.js installation
- ✓ Verify `.env` configuration exists
- ✓ Install npm dependencies (`npm install --production`)
- ✓ Install node-windows package
- ✓ Register the service with Windows
- ✓ Start the service automatically

### Step 4: Verify Service Installation

After installation completes:

1. **Check service status:**
   ```powershell
   Get-Service -Name WardrobleLabelPrintServer
   ```

2. **Open Windows Services (services.msc):**
   - Press `Win+R`
   - Type `services.msc`
   - Look for "WardrobleLabelPrintServer"
   - It should show: **Status = Running**, **Startup Type = Automatic**

3. **Check service logs:**
   ```powershell
   Get-Content logs/combined.log -Tail 20
   ```

## Testing Connectivity

Before deploying, test the connections:

```powershell
# Test database connection
node test_connection.js

# Test printer connectivity and label generation
node test_print.js
```

## Service Management

### View Service Status
```powershell
Get-Service -Name WardrobleLabelPrintServer
```

### Start Service
```powershell
Start-Service -Name WardrobleLabelPrintServer
```

### Stop Service
```powershell
Stop-Service -Name WardrobleLabelPrintServer
```

### View Recent Logs
```powershell
# Last 20 lines of combined log
Get-Content logs/combined.log -Tail 20

# All errors
Get-Content logs/error.log
```

### Monitor Service in Real-Time
```powershell
# Watch the combined log file
Get-Content -Path logs/combined.log -Wait
```

## Troubleshooting

### Service Won't Start

**Check logs for errors:**
```powershell
Get-Content logs/error.log -Tail 50
```

**Common issues:**
- `.env` file missing or improperly configured
- Database credentials incorrect (test with `node test_connection.js`)
- Printer not accessible on network
- Port 9100 blocked by firewall

### Database Connection Failed

1. Verify SQL Server is running: `ping av-sql2`
2. Test connection: `node test_connection.js`
3. Check credentials in `.env` file
4. Verify user account has database permissions

### Printer Connection Failed

1. Verify printer is on: `ping 10.2.1.61`
2. Test printer connectivity: `node test_print.js`
3. Check network configuration
4. Verify port 9100 is not blocked by firewall

### Service Appears Running but Getting No Output

The Windows service runs in the background. Check logs:
```powershell
Get-Content logs/combined.log -Tail 30
```

### Node.js Version Issues

If you need to update Node.js:

1. Download and install newer LTS version from nodejs.org
2. Uninstall current service: `.\uninstall-service.ps1`
3. Update Node.js
4. Reinstall service: `.\install-service.ps1`

## Uninstalling the Service

To completely remove the service:

```powershell
.\uninstall-service.ps1
```

This will:
- Stop the running service
- Unregister from Windows
- Remove all service configuration

The application files remain and can be manually deleted if needed.

## Updating the Application

To deploy a new version:

1. **Stop the service:**
   ```powershell
   Stop-Service -Name WardrobleLabelPrintServer
   ```

2. **Replace the application files** (excluding `.env` and `logs/` folder):
   - Copy new source files
   - Update `node_modules` if dependencies changed

3. **Start the service:**
   ```powershell
   Start-Service -Name WardrobleLabelPrintServer
   ```

4. **Verify it's running:**
   ```powershell
   Get-Content logs/combined.log -Tail 10
   ```

## Important Notes

- **The `.env` file contains sensitive credentials** - do not commit to version control or share publicly
- **Logs are stored in `logs/` folder** - monitor these for issues and performance
- **Polling interval is 5 seconds by default** - can be adjusted via `POLLING_INTERVAL` in `.env`
- **Service auto-restarts on failure** - up to 5 times within 60 seconds
- **Memory limit is 512MB** - increase via `--max-old-space-size` if needed

## Support

For issues or questions:
1. Check the logs in `logs/error.log`
2. Run connectivity tests: `node test_connection.js` and `node test_print.js`
3. Review this deployment guide for common solutions

---

**Service Name:** WardrobleLabelPrintServer  
**Entry Point:** `src/app.js`  
**Polling Interval:** 5 seconds (configurable)  
**Auto-Start:** Yes  
**Auto-Restart:** Yes (up to 5 attempts per minute)
