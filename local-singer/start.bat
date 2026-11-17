@echo off
title Musikstudio - Lokale KI-Singstimme
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js fehlt. Bitte zuerst Node.js LTS installieren: https://nodejs.org/
  pause
  exit /b 1
)
if not exist node_modules (
  echo Installiere die lokale Verbindung...
  call npm install
  if errorlevel 1 pause & exit /b 1
)
echo.
echo Lokale Singstimmen-Verbindung startet auf http://127.0.0.1:3031
echo Dieses Fenster offen lassen, waehrend du dein Musikstudio benutzt.
echo.
npm start
pause
