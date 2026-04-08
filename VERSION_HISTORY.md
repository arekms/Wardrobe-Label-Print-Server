# Wardrobe Label Print Server - Version History

## Version 1.1.0 (2026-04-08)

### New Features
- **Windows Service Installation:** Application can be installed as a Windows service with auto-start capability (via NSSM)
- **Standalone Deployment:** Alternative lightweight deployment method (BAT file) for firewall-restricted environments
- **Installation Scripts:** Multiple installation options for different scenarios

### Installation Methods Available
1. **Windows Service (NSSM)** - Recommended for production
   - Auto-start with Windows
   - Runs in background
   - Service management via Services.msc
   
2. **Standalone** - Firewall-friendly alternative
   - Simple BAT file launcher
   - Optional Task Scheduler auto-start
   - Visible console for monitoring
   - Perfect for testing and firewall-restricted environments

### Improvements
- **Label Positioning:** Refined text positioning on printed thermal labels for better alignment
- **Security Hardening:** All database credentials removed from code, now requires .env configuration
- **Documentation:** Multiple deployment guides for different scenarios

### Documentation Added
- `DEPLOYMENT.md` - Windows service installation guide
- `STANDALONE_DEPLOYMENT.md` - Standalone app deployment with Task Scheduler auto-start
- `STANDALONE_QUICK_START.md` - Quick reference for firewall workarounds
- `INSTALL_QUICK_START.md` - Service installation quick start
- `install-service-nssm.ps1` - Service installation script
- `uninstall-service-nssm.ps1` - Service removal script
- `start.bat` / `start.ps1` - Standalone launcher scripts

### Node.js Compatibility
- Tested with Node.js 22 (LTS)
- Also compatible with Node.js 18+ 
- Firewall-friendly alternative for locked-down environments

---

## Version 1.0.0 (2026-04-07)

### Initial Release
- Core application functionality:
  - Continuous polling of SQL Server LabelPrintQueue table
  - ZPL thermal label generation
  - TCP socket communication with GoDexRT700i printer
  - Winston logging framework
  - SQL Server connection pooling

### Features
- Stores credentials in `.env` file with namespaced variables (WLPS_* prefix)
- Environment variable validation
- Graceful shutdown handling
- Comprehensive error logging
- Test utilities for database and printer connectivity

### Components
- `src/app.js` - Main application orchestrator
- `services/databaseService.js` - SQL Server connection and stored procedure execution
- `services/printerService.js` - Thermal printer communication and ZPL generation
- `utils/logger.js` - Winston logging configuration
- Test files: `test_connection.js`, `test_print.js`, `test_app_env.js`

---

## Deployment Instructions

### For v1.1.0 (Windows Service)

**New Computer Installation:**
```powershell
# 1. Copy application to target computer
# 2. Configure .env file with credentials
# 3. Run installation script
.\install-service.ps1
```

See `DEPLOYMENT.md` for detailed instructions.

### For v1.0.0 (Manual Execution)

```bash
npm install
node src/app.js
```

---

## License
ISC

## Support
For deployment issues, refer to DEPLOYMENT.md troubleshooting section.
