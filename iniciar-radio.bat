@echo off
title TIMIUSIC Radio
cd /d "%~dp0"

if not exist "node_modules" (
  echo Instalando dependencias...
  call npm install
  if errorlevel 1 (
    echo No se pudieron instalar las dependencias.
    pause
    exit /b 1
  )
)

start "TIMIUSIC Dev Server" cmd /k "cd /d "%~dp0" && npm run dev"

echo Esperando a que la app inicie...
timeout /t 6 /nobreak >nul

start "" "http://localhost:3000/index"
