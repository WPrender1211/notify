@echo off
title Remove CallNotify Tray from Startup
set "SHORTCUT_PATH=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\CallNotifyTray.lnk"

if exist "%SHORTCUT_PATH%" (
    del /f /q "%SHORTCUT_PATH%"
    echo [SUCCESS] CallNotify removed from Windows Startup.
) else (
    echo CallNotify was not in Windows Startup.
)
pause
