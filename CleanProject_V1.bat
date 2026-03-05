@echo off
title Expo Android Dev Tool - PRO
color 0A
setlocal enabledelayedexpansion

:: Detect package manager
if exist yarn.lock (
    set PM=yarn
    set INSTALL_CMD=yarn install
) else (
    set PM=npm
    set INSTALL_CMD=npm install
)

:: Check Android emulator/device
:checkDevice
adb devices > temp.txt 2>&1
findstr "device" temp.txt > nul
if %errorlevel%==0 (
    set DEVICE_STATUS=Device detected
) else (
    set DEVICE_STATUS=No device/emulator detected
)
del temp.txt > nul 2>&1
goto menu

:menu
cls
echo ==============================================
echo      EXPO DEV CLIENT - ANDROID PRO TOOL
echo ==============================================
echo Package Manager: %PM%
echo Device Status  : %DEVICE_STATUS%
echo ==============================================
echo.
echo 1 - Limpeza LEVE (Expo cache + Gradle clean)
echo 2 - Limpeza MEDIA (Rebuild android)
echo 3 - Limpeza NUCLEAR (Full reset)
echo 4 - Run Android
echo 5 - EAS Dev Build (cloud --clear-cache)
echo 6 - Verificar dispositivo novamente
echo 7 - Sair
echo.
set /p choice=Escolhe uma opcao (1-7): 

if "%choice%"=="1" goto light
if "%choice%"=="2" goto medium
if "%choice%"=="3" goto nuclear
if "%choice%"=="4" goto run
if "%choice%"=="5" goto eas
if "%choice%"=="6" goto checkDevice
if "%choice%"=="7" exit

goto menu

:light
cls
echo ===== LIMPEZA LEVE =====
npx expo start -c

if exist android (
    cd android
    call gradlew clean
    cd ..
)

echo.
echo Concluido!
pause
goto menu

:medium
cls
echo ===== LIMPEZA MEDIA =====

if exist android (
    rmdir /s /q android
)

npx expo prebuild
npx expo run:android

echo.
echo Rebuild concluido!
pause
goto menu

:nuclear
cls
echo ===== LIMPEZA NUCLEAR =====

if exist node_modules rmdir /s /q node_modules
if exist android rmdir /s /q android
if exist package-lock.json del /f /q package-lock.json

npm cache clean --force

%INSTALL_CMD%

npx expo prebuild
npx expo run:android

echo.
echo FULL RESET COMPLETO!
pause
goto menu

:run
cls
echo ===== RUN ANDROID =====
npx expo run:android
pause
goto menu

:eas
cls
echo ===== EAS DEVELOPMENT BUILD =====
eas build --profile development --platform android --clear-cache
pause
goto menu