@echo off
setlocal
echo ========================================================
echo   Launching NodePilot...
echo ========================================================

set "TEMP=e:\Envision\.tmp"
set "TMP=e:\Envision\.tmp"
set "PATH=C:\Users\jaison\.cargo\bin;C:\nvm4w\nodejs;C:\Users\jaison\AppData\Local\nvm;%PATH%"

cd /d "e:\Envision\nvmgui"

npm run tauri dev
