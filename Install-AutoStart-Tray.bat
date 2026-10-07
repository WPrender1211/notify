@echo off
title Install CallNotify Windows Tray to Startup
echo Adding CallNotify System Tray App to Windows Startup...

set "TARGET_DIR=%~dp0"
set "SHORTCUT_PATH=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\CallNotifyTray.lnk"
set "BAT_PATH=%TARGET_DIR%Start-Tray-App.bat"

powershell -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut('%SHORTCUT_PATH%'); $s.TargetPath = '%BAT_PATH%'; $s.WorkingDirectory = '%TARGET_DIR%'; $s.WindowStyle = 7; $s.Save()"

echo.
echo [SUCCESS] CallNotify System Tray App is now installed to Windows Startup!
echo It will run quietly in your taskbar system tray every time Windows starts.
echo.
echo Starting tray app now...
start "" "%BAT_PATH%"
pause
