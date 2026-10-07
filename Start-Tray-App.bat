@echo off
title CallNotify System Tray App
start "" powershell -WindowStyle Hidden -ExecutionPolicy Bypass -File "%~dp0desktop-tray\CallNotifierTray.ps1"
exit
