REM VBS script to run start.bat in hidden mode
REM This is used by Task Scheduler to launch the app without showing a console window

Set objShell = CreateObject("WScript.Shell")
objShell.Run "cmd /c start.bat", 0
