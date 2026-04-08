# Quick Installation Guide - Wardrobe Label Print Server v1.1.0

## For Windows Computers with Node.js Already Installed

**Node.js Version:** 18 LTS or higher (tested with Node.js 22)

### 5-Minute Installation

1. **Copy application folder to target computer**
   ```
   C:\Apps\WLPS\
   ```

2. **Configure credentials:**
   ```powershell
   Copy-Item .env.example .env
   # Edit .env with your database password and printer IP
   ```

3. **Install as Windows Service (Requires Admin):**
   ```powershell
   # Right-click PowerShell → "Run as administrator"
   
   # STEP A: Allow script execution
   Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process
   # Type: Y and press Enter when prompted
   
   # STEP B: Run the installation script (NSSM version - recommended for Node.js 22)
   .\install-service-nssm.ps1
   ```
   
   ⚠️ **Note:** This uses NSSM (Non-Sucking Service Manager) which is more reliable and has no Node.js version conflicts.

4. **Verify service is running:**
   ```powershell
   Get-Service -Name WardrobleLabelPrintServer
   # Should show: Status = Running, Startup Type = Automatic
   ```

### That's it! Your service will:
- ✅ Start automatically when Windows boots
- ✅ Run continuously in the background
- ✅ Restart itself if it crashes
- ✅ Poll database every 5 seconds
- ✅ Print labels to the thermal printer

## What Gets Installed

```
C:\Apps\WLPS\
├── src/
│   └── app.js (main application)
├── services/
│   ├── databaseService.js (SQL connection)
│   └── printerService.js (printer communication)
├── utils/
│   └── logger.js (logging)
├── node_modules/ (dependencies)
├── logs/
│   ├── combined.log (all activity)
│   └── error.log (errors only)
├── .env (your credentials - DO NOT SHARE)
├── install-service.ps1 (installation script)
├── uninstall-service.ps1 (removal script)
├── DEPLOYMENT.md (detailed guide)
└── VERSION_HISTORY.md (release notes)
```

## Configuration (.env file)

```
# Database connection
WLPS_DB_SERVER=av-sql2
WLPS_DB_DATABASE=Wardrobe01Prod
WLPS_DB_USERNAME=Wardrobe
WLPS_DB_PASSWORD=your-password-here

# Printer connection
PRINTER_IP=10.2.1.61
PRINTER_PORT=9100

# Application settings
NODE_ENV=production
LOG_LEVEL=info
POLLING_INTERVAL=5000
```

## Common Commands

```powershell
# Check if service is running
Get-Service -Name WardrobleLabelPrintServer

# Stop the service
Stop-Service -Name WardrobleLabelPrintServer

# Start the service
Start-Service -Name WardrobleLabelPrintServer

# View recent logs
Get-Content logs/combined.log -Tail 20

# Test database connection
node test_connection.js

# Test printer connectivity
node test_print.js

# Uninstall service (if needed)
.\uninstall-service.ps1
```

## Troubleshooting

### Service won't start?
```powershell
Get-Content logs/error.log -Tail 20
```

### Can't connect to database?
```powershell
node test_connection.js
# Check .env credentials
```

### Printer not printing?
```powershell
node test_print.js
# Verify printer is at 10.2.1.61:9100
# Check network connectivity
```

## Updating the Application

When you have new version with label positioning updates:

1. Stop service: `Stop-Service -Name WardrobleLabelPrintServer`
2. Replace application files (keep `.env` and `logs/` folder)
3. `npm install` (to get any new dependencies)
4. Start service: `Start-Service -Name WardrobleLabelPrintServer`

## Documentation

- **DEPLOYMENT.md** - Complete deployment guide with detailed troubleshooting
- **VERSION_HISTORY.md** - What's new in this version
- **README.md** - Project overview and architecture

---

**Need Help?** See DEPLOYMENT.md for troubleshooting and advanced configuration.
