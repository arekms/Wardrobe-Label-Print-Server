# Deployment Package Manifest - Wardrobe Label Print Server v1.1.0

This document describes the complete installation package for deploying the application to a new Windows computer.

## Package Contents

### Source Code
- ✅ `src/app.js` - Main application entry point
- ✅ `services/databaseService.js` - SQL Server connection management
- ✅ `services/printerService.js` - Thermal printer communication
- ✅ `utils/logger.js` - Logging configuration

### Dependencies & Configuration
- ✅ `package.json` - Node.js dependencies (v1.1.0)
- ✅ `package-lock.json` - Locked dependency versions
- ✅ `.env.example` - Configuration template (safe to share)
- ✅ `.gitignore` - Git configuration

### Installation Scripts
- ✅ `install-service.ps1` - Windows service installation (Admin required)
- ✅ `uninstall-service.ps1` - Windows service removal (Admin required)

### Documentation
- ✅ `README.md` - Project overview and architecture
- ✅ `DEPLOYMENT.md` - Complete deployment guide ⭐ START HERE
- ✅ `INSTALL_QUICK_START.md` - Quick 5-minute reference guide
- ✅ `VERSION_HISTORY.md` - Release notes and version information
- ✅ `MANIFEST.md` - This file

### Testing & Diagnostics
- ✅ `test_connection.js` - Database connectivity test
- ✅ `test_print.js` - Printer connectivity and label generation test
- ✅ `test_app_env.js` - Environment variable verification

### Important Directories
- ✅ `config/` - Configuration files directory
- ✅ `logs/` - Application logs (created automatically)

### NOT Included (Security)
- ❌ `.env` - **Never include** your real credentials
  - Users must create from `.env.example`
  - Contains database passwords and sensitive data

### NOT Included (Generated)
- ❌ `node_modules/` - Dependencies installed by npm
  - Will be automatically installed by `install-service.ps1`
- ❌ `logs/` - Application logs
  - Generated at runtime

## Package Size

Approximate sizes:
- Source code: ~150 KB
- Documentation: ~100 KB
- Scripts: ~50 KB
- **Total (without node_modules): ~300 KB**
- node_modules/: ~150 MB (installed during setup)

## Total Package Size for Distribution

**With node_modules pre-installed: ~150 MB**
**Without node_modules (recommended): ~300 KB**

### Recommendation

For distribution, use **smallest package** (without node_modules):
1. Reduce file size for email/shared drive transfer
2. Script automatically installs latest compatible versions
3. Minimal security risk during transfer
4. Users always get fresh dependencies

## Creating the Deployment Package

### Option 1: Minimal Package (Recommended)

```powershell
# Create deployment folder
New-Item -ItemType Directory -Path WLPS-deployment-1.1.0

# Copy source files
Copy-Item src WLPS-deployment-1.1.0 -Recurse
Copy-Item services WLPS-deployment-1.1.0 -Recurse
Copy-Item utils WLPS-deployment-1.1.0 -Recurse
Copy-Item config WLPS-deployment-1.1.0 -Recurse

# Copy scripts and config
Copy-Item package.json WLPS-deployment-1.1.0
Copy-Item package-lock.json WLPS-deployment-1.1.0
Copy-Item .env.example WLPS-deployment-1.1.0
Copy-Item .gitignore WLPS-deployment-1.1.0
Copy-Item install-service.ps1 WLPS-deployment-1.1.0
Copy-Item uninstall-service.ps1 WLPS-deployment-1.1.0

# Copy documentation
Copy-Item README.md WLPS-deployment-1.1.0
Copy-Item DEPLOYMENT.md WLPS-deployment-1.1.0
Copy-Item INSTALL_QUICK_START.md WLPS-deployment-1.1.0
Copy-Item VERSION_HISTORY.md WLPS-deployment-1.1.0
Copy-Item MANIFEST.md WLPS-deployment-1.1.0

# Copy test files
Copy-Item test_*.js WLPS-deployment-1.1.0

# Create ZIP file
Compress-Archive -Path WLPS-deployment-1.1.0 -DestinationPath WLPS-deployment-1.1.0.zip

# Verify
(Get-Item WLPS-deployment-1.1.0.zip).Length / 1MB # Show size in MB
```

### Option 2: Full Package (With node_modules)

If pre-installing dependencies:

```powershell
# Inside WLPS-deployment-1.1.0 folder, run:
npm install --production

# Then create ZIP:
Compress-Archive -Path WLPS-deployment-1.1.0 -DestinationPath WLPS-deployment-1.1.0-full.zip
```

## Deployment Checklist

Before sharing deployment package, verify:

- [ ] `.env` file is NOT included (check for actual credentials)
- [ ] `.env.example` IS included (with placeholder values)
- [ ] `install-service.ps1` is present and readable
- [ ] `INSTALL_QUICK_START.md` is included
- [ ] `DEPLOYMENT.md` is included
- [ ] All source files in `src/`, `services/`, `utils/` directories
- [ ] `package.json` and `package-lock.json` present
- [ ] Test files (`test_*.js`) included for diagnostics
- [ ] No unnecessary files (git history, IDE configs, debug files)

## Installation on Target Computer

On the target Windows computer:

```powershell
# 1. Extract ZIP file to desired location
#    Example: C:\Apps\WLPS\

# 2. Read INSTALL_QUICK_START.md (5 minute guide)

# 3. Or read DEPLOYMENT.md (comprehensive guide)

# 4. Copy .env.example to .env and configure

# 5. Run installation script
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process
.\install-service.ps1

# 6. Verify service
Get-Service -Name WardrobleLabelPrintServer
```

## Version Information

- **Application:** Wardrobe Label Print Server
- **Version:** 1.1.0
- **Release Date:** 2026-04-08
- **Node.js Required:** 12.14.0 or higher
- **OS:** Windows only

## What Changed in v1.1.0

- ✅ Windows service installation support
- ✅ Label positioning refinements
- ✅ Security hardening (removed hardcoded credentials)
- ✅ Comprehensive deployment documentation
- ✅ Installation automation scripts

## Support & Documentation

1. **Quick Start:** See `INSTALL_QUICK_START.md` (5 minutes)
2. **Complete Guide:** See `DEPLOYMENT.md` (detailed)
3. **Troubleshooting:** See `DEPLOYMENT.md` troubleshooting section
4. **Version Info:** See `VERSION_HISTORY.md`

## Package Distribution

### Recommended Way to Share

1. Create ZIP file (minimal package recommended)
2. Include in email, shared drive, or file transfer service
3. Recipient should:
   - Extract to `C:\Apps\WLPS` (or preferred location)
   - Read `INSTALL_QUICK_START.md`
   - Follow installation steps

### Security Note

- Never modify `.env.example` to include real credentials
- Always have recipients create their own `.env` file
- `.env` file should never be shared or committed to version control
- Credentials are unique per deployment location

---

**Ready to deploy?** See `INSTALL_QUICK_START.md` for 5-minute installation guide.

For detailed information, see `DEPLOYMENT.md`.
