# Standalone Deployment - Wardrobe Label Print Server v1.1.0

## Quick Start - Manual Launch

### Option 1: Batch File (Simplest)
```powershell
# In PowerShell or Command Prompt, navigate to C:\Apps\WLPS and run:
start.bat
```

### Option 2: PowerShell
```powershell
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process
.\start.ps1
```

### Option 3: Direct Node.js
```powershell
npm install --omit=dev    # Install dependencies if needed
node src/app.js           # Start the app
```

The application will:
- ✅ Connect to SQL Server database
- ✅ Connect to thermal printer
- ✅ Start polling every 5 seconds
- ✅ Print labels continuously
- ✅ Log all activity to logs/combined.log

**Press Ctrl+C to stop the application**

---

## Auto-Start with Windows Task Scheduler

To have the application **start automatically when Windows boots**, follow these steps:

### Step 1: Create a VBS wrapper (optional but recommended)

This creates a hidden launcher so the console window doesn't show.

**Create file: `C:\Apps\WLPS\run-hidden.vbs`**

```vbscript
Set objShell = CreateObject("WScript.Shell")
objShell.Run "cmd /c start.bat", 0
```

### Step 2: Open Task Scheduler

1. Press `Win+R`
2. Type: `taskschd.msc`
3. Press Enter

Or:
- Search for "Task Scheduler" in Windows Start menu
- Open "Task Scheduler"

### Step 3: Create New Task

1. In Task Scheduler, click **"Create Task"** (right side)
2. **General tab:**
   - Name: `WardrobleLabelPrintServer`
   - Description: `Wardrobe Label Print Server - Continuous polling service`
   - Check: "Run whether user is logged in or not"
   - Check: "Run with highest privileges"

3. **Triggers tab:**
   - Click "New"
   - **Begin the task:** "At startup"
   - Check: "Enabled"
   - Click OK

4. **Actions tab:**
   - Click "New"
   - **Action:** "Start a program"
   - **Program/script:** `C:\Apps\WLPS\start.bat`
   - **Start in:** `C:\Apps\WLPS`
   - Click OK

5. **Conditions tab:**
   - Uncheck "Stop the task if it runs longer than: 3 days" (if visible)
   - Check "Wake the computer to run this task"

6. **Settings tab:**
   - Check: "Allow task to be run on demand"
   - Check: "If the task fails, restart every: 1 minute"
   - Set: "Attempt to restart up to: 10 times"
   - Check: "If the task is already running, then the following rule applies:"
   - Select: "Do not start a new instance"

7. Click **OK** to save

### Step 4: Test the Task

1. In Task Scheduler, find your task: `WardrobleLabelPrintServer`
2. Right-click and select "Run"
3. Check that the application starts and connects successfully
4. Stop it (Ctrl+C or close the window)

### Step 5: Restart to Verify Auto-Start

Restart your computer and verify the application starts automatically.

---

## Management Commands

### View Application Logs (While Running)

While the app is running in the window, you can see logs directly.

### View Logs After App Closes

```powershell
Get-Content logs/combined.log -Tail 30
```

### Check Recent Errors

```powershell
Get-Content logs/error.log -Tail 50
```

### Monitor Logs Live

```powershell
Get-Content logs/combined.log -Wait
```

### Stop Auto-Start Task

1. Open Task Scheduler
2. Find: `WardrobleLabelPrintServer`
3. Right-click and select "Disable"
4. Or click "Delete" to remove completely

### Remove From Auto-Start

```powershell
schtasks /delete /tn WardrobleLabelPrintServer /f
```

---

## File Structure

```
C:\Apps\WLPS\
├── src/
│   └── app.js (main application)
├── services/
│   ├── databaseService.js
│   └── printerService.js
├── utils/
│   └── logger.js
├── node_modules/ (dependencies)
├── logs/
│   ├── combined.log
│   └── error.log
├── .env (your credentials)
├── start.bat (⭐ Click to run)
├── start.ps1 (PowerShell version)
├── run-hidden.vbs (for Task Scheduler)
└── package.json
```

---

## Troubleshooting

### Application won't start?

Check the error:

```powershell
# Run from PowerShell in the WLPS folder
node src/app.js
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
```

### Task won't auto-start?

1. Verify task in Task Scheduler is "Enabled"
2. Right-click task → "Run" to test it works manually
3. Check Application Event Log for errors:
   - Press `Win+R` → `eventvwr.msc` → Windows Logs → Application

### Want to see what's running?

```powershell
tasklist | findstr node
```

---

## Updating the Application

1. **Stop the running application** (Ctrl+C if manually started)
2. **Copy new application files** to `C:\Apps\WLPS` (keep `.env` and `logs/`)
3. **Run the app again:**
   - Double-click `start.bat`, or
   - Run `.\start.ps1` in PowerShell

If you set up Task Scheduler auto-start:
- It will automatically restart after stopping
- Or restart the computer for a clean start

---

## Comparison: Standalone vs Service

| Feature | Standalone | Windows Service |
|---------|-----------|-----------------|
| Ease of Setup | ✅ Very Easy | More Complex |
| Visible Console | ✅ Yes | Run in Background |
| Auto-Start | Via Task Scheduler | Native |
| Monitoring | Easy (watch console) | Check logs |
| Firewall Issues | None | Potentially |
| Best For | Testing, Debugging | Production |

**For your situation:** The standalone mode is perfect for deployment when firewall restricts downloads.

---

**Support Files:**
- `start.bat` - Batch launcher (Windows Command Prompt)
- `start.ps1` - PowerShell launcher
- `run-hidden.vbs` - VBS wrapper for hidden console (optional)
- `logs/combined.log` - All application activity
- `logs/error.log` - Errors only

**Status Check:**
```powershell
# Check if Node.js process is running
Get-Process node -ErrorAction SilentlyContinue
```
