Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "powershell -WindowStyle Hidden -NoProfile -ExecutionPolicy Bypass -Command ""Invoke-Expression (Get-Content -Raw 'CallNotify-Tray-Companion.bat')""", 0, False
