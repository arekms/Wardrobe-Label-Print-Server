# Quick Start - Standalone Deployment (Firewall Workaround)

**Use this if you cannot download NSSM due to firewall policies.**

## Setup (One-Time)

1. **Copy application to target computer**
   ```
   C:\Apps\WLPS\
   ```

2. **Configure credentials**
   ```powershell
   Copy-Item .env.example .env
   # Edit .env with your database password and printer IP
   ```

3. **Install dependencies**
   ```powershell
   cd C:\Apps\WLPS
   npm install --omit=dev
   ```

## Run the Application

### Option A: Double-Click (Simplest)

Simply **double-click**: `C:\Apps\WLPS\start.bat`

The application will:
- Install dependencies if needed
- Connect to database and printer
- Start printing labels
- Show a console window with logs

### Option B: PowerShell

```powershell
cd C:\Apps\WLPS
.\start.ps1
```

### Option C: Direct Command

```powershell
cd C:\Apps\WLPS
node src/app.js
```

**Press Ctrl+C to stop**

---

## Auto-Start on Boot (Optional)

To have the app **start automatically when Windows starts**:

**See: [STANDALONE_DEPLOYMENT.md](STANDALONE_DEPLOYMENT.md) → "Auto-Start with Windows Task Scheduler"**

Gets running with just a few clicks in Task Scheduler.

---

## Verify It's Working

1. **Watch the console** - You'll see:
   ```
   INFO: Starting Wardrobe Label Print Server
   INFO: Connected to SQL Server database
   INFO: Connected to printer at 10.2.1.61:9100
   INFO: Polling started. Interval: 5000ms
   ```

2. **Check logs**
   ```powershell
   Get-Content logs/combined.log -Tail 20
   ```

3. **Test connectivity**
   ```powershell
   node test_connection.js
   node test_print.js
   ```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| .env not found | Run: `Copy-Item .env.example .env` |
| npm install fails | Delete `node_modules`, try again |
| Can't connect to DB | Run: `node test_connection.js` |
| Printer not printing | Run: `node test_print.js` |
| Slow startup | First run installs dependencies (~30 seconds) |

---

## Files to Use

- **`start.bat`** ← Most reliable, just double-click
- **`start.ps1`** ← PowerShell version if you prefer
- **`run-hidden.vbs`** ← For Task Scheduler (runs hidden)
- **`STANDALONE_DEPLOYMENT.md`** ← Full guide with auto-start setup

---

**That's it!** The app will run continuously, poll the database every 5 seconds, and print labels.

For detailed configuration and auto-start setup, see: **STANDALONE_DEPLOYMENT.md**
