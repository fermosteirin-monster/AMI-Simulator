# dev.ps1 - Script de desarrollo para AMI Simulator
# Uso: .\dev.ps1

$NODE_DIR = "C:\Users\florg\.gemini\antigravity\nodejs\node-v22.16.0-win-x64"
$NPM_CMD  = "$NODE_DIR\npm.cmd"
$DIR      = Split-Path -Parent $MyInvocation.MyCommand.Definition

# Inyectar Node en el PATH de esta sesión
$env:PATH = "$NODE_DIR;$env:PATH"

Set-Location $DIR

Write-Host "🚀 AMI Simulator - Iniciando servidor de desarrollo..." -ForegroundColor Cyan
Write-Host "   Node.js: $(& node --version)" -ForegroundColor Gray
Write-Host "   URL:     http://localhost:5173" -ForegroundColor Green
Write-Host ""

& $NPM_CMD run dev
