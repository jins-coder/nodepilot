Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  Launching NodePilot..." -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Cyan

if (-not (Test-Path "e:\Envision\.tmp")) { New-Item -ItemType Directory -Path "e:\Envision\.tmp" -Force | Out-Null }
$env:TEMP = "e:\Envision\.tmp"
$env:TMP = "e:\Envision\.tmp"
$env:PATH = "C:\Users\jaison\.cargo\bin;C:\nvm4w\nodejs;C:\Users\jaison\AppData\Local\nvm;$env:PATH"

Set-Location "e:\Envision\nvmgui"
npm run tauri dev
