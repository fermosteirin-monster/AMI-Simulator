@echo off
title AMI Simulator - Edesur
color 0B

echo.
echo  ================================================
echo   AMI Simulator - Edesur Financial Model
echo   Vite + React + TypeScript
echo  ================================================
echo.

set NODE_DIR=C:\Users\florg\.gemini\antigravity\nodejs\node-v22.16.0-win-x64
set PATH=%NODE_DIR%;%PATH%

echo  [1/2] Verificando Node.js...
node --version
if errorlevel 1 (
    echo  ERROR: No se encontro Node.js en %NODE_DIR%
    pause
    exit /b 1
)

echo.
echo  [2/2] Iniciando servidor de desarrollo...
echo.
echo  La aplicacion abrira en: http://localhost:5173
echo  Presiona Ctrl+C para detener el servidor.
echo.

:: Abrir el navegador automaticamente despues de 3 segundos
start "" /B cmd /C "timeout /t 3 /nobreak > nul && start http://localhost:5173"

:: Iniciar Vite
npm.cmd run dev
