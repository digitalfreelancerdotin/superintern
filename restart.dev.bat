@echo off
echo Stopping any running Node processes...
taskkill /F /IM node.exe

echo Cleaning up files...
rmdir /s /q node_modules
del package-lock.json

echo Installing dependencies...
npm install --legacy-peer-deps
