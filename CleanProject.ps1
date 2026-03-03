param(
    [string]$Command
)

Clear-Host
Write-Host "==============================================" -ForegroundColor Green
Write-Host "     EXPO DEV CLIENT - ANDROID DEVTOOL PRO" -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor Green

# Detect package manager
if (Test-Path "yarn.lock") {
    $PM = "yarn"
    $InstallCmd = "yarn install"
} else {
    $PM = "npm"
    $InstallCmd = "npm install"
}

Write-Host "Package Manager: $PM" -ForegroundColor Cyan

# -----------------------------
# DEVICE CHECK
# -----------------------------
function Check-Device {
    try {
        $devices = adb devices | Select-String "device$"
        if ($devices) { return "Device detected" }
        else { return "No device/emulator detected" }
    } catch {
        return "ADB not found"
    }
}

# -----------------------------
# ENVIRONMENT DIAGNOSIS
# -----------------------------
function Get-NodeVersion {
    try { return node -v }
    catch { return "Node not found" }
}

function Get-JavaVersion {
    try { return (java -version 2>&1 | Select-String "version").ToString() }
    catch { return "Java not found" }
}

function Get-ExpoSDK {
    if (Test-Path "app.json") {
        try {
            $json = Get-Content app.json | ConvertFrom-Json
            return $json.expo.sdkVersion
        } catch {
            return "Could not parse app.json"
        }
    }
    return "app.json not found"
}

function Get-AndroidHome {
    if ($env:ANDROID_HOME) {
        if (Test-Path $env:ANDROID_HOME) { return $env:ANDROID_HOME }
        return "ANDROID_HOME set but path invalid"
    }
    return "ANDROID_HOME not set"
}

function Environment-Diagnosis {
    Write-Host "`n===== ENVIRONMENT DIAGNOSIS =====" -ForegroundColor Cyan
    Write-Host "Node Version : $(Get-NodeVersion)"
    Write-Host "Java Version : $(Get-JavaVersion)"
    Write-Host "ANDROID_HOME : $(Get-AndroidHome)"
    Write-Host "Expo SDK     : $(Get-ExpoSDK)"
    Write-Host "ADB Status   : $(Check-Device)"
    Write-Host "==================================" -ForegroundColor Cyan
}

# -----------------------------
# SMART CACHE CHECK
# -----------------------------
function Smart-Check {
    Write-Host "`n===== SMART CACHE CHECK =====" -ForegroundColor Yellow

    if (!(Test-Path "node_modules")) {
        Write-Host "node_modules missing -> installing..."
        Invoke-Expression $InstallCmd
    } else {
        Write-Host "node_modules OK"
    }

    if (!(Test-Path "android")) {
        Write-Host "android folder missing -> running prebuild..."
        npx expo prebuild
    } else {
        Write-Host "android folder OK"
    }

    Write-Host "Smart check complete."
}

# -----------------------------
# PROCESS CLEANUP
# -----------------------------
function Kill-Processes {
    Write-Host "Stopping blocking processes..." -ForegroundColor DarkYellow
    Get-Process node, adb, java -ErrorAction SilentlyContinue | Stop-Process -Force
}

# -----------------------------
# ASK BUILD
# -----------------------------
function Ask-Build {
    Write-Host ""
    $answer = Read-Host "Deseja compilar agora? (s/n)"
    if ($answer -eq "s") {
        Run-Android
    } else {
        Write-Host "A voltar ao menu..." -ForegroundColor Yellow
    }
}

# -----------------------------
# CLEAN LEVELS
# -----------------------------
function Light-Clean {
    Write-Host "`n===== LIMPEZA LEVE =====" -ForegroundColor Green
    npx expo start -c

    if (Test-Path "android") {
        Push-Location android
        ./gradlew clean
        Pop-Location
    }

    Ask-Build
}

function Medium-Clean {
    Write-Host "`n===== LIMPEZA MEDIA =====" -ForegroundColor Green

    if (Test-Path "android") {
        Remove-Item android -Recurse -Force
    }

    npx expo prebuild

    Ask-Build
}

function Nuclear-Clean {
    Write-Host "`n===== LIMPEZA NUCLEAR EXTREMA =====" -ForegroundColor Red
    
    Kill-Processes
    gradle --stop 2>$null

    if (Test-Path "node_modules") {
        Remove-Item node_modules -Recurse -Force
    }

    if (Test-Path "android") {
        Remove-Item android -Recurse -Force
    }

    if (Test-Path "package-lock.json") {
        Remove-Item package-lock.json -Force
    }

    npm cache clean --force

    $GradleCache = "$env:USERPROFILE\.gradle\caches"
    if (Test-Path $GradleCache) {
        Write-Host "Cleaning global Gradle cache..."
        Remove-Item $GradleCache -Recurse -Force
    }

    Invoke-Expression $InstallCmd
    npx expo prebuild

    Ask-Build
}

function Run-Android {
    Environment-Diagnosis
    Smart-Check
    Write-Host "`nStarting Android build..." -ForegroundColor Green
    npx expo run:android
}

function EAS-Build {
    Environment-Diagnosis
    eas build --profile development --platform android --clear-cache
}

# -----------------------------
# DIRECT COMMAND MODE
# -----------------------------
switch ($Command) {
    "light" { Light-Clean; exit }
    "medium" { Medium-Clean; exit }
    "nuclear" { Nuclear-Clean; exit }
    "run" { Run-Android; exit }
    "eas" { EAS-Build; exit }
}

# -----------------------------
# INTERACTIVE MENU
# -----------------------------
while ($true) {
    Write-Host ""
    Write-Host "1 - Limpeza LEVE"
    Write-Host "2 - Limpeza MEDIA"
    Write-Host "3 - Limpeza NUCLEAR EXTREMA"
    Write-Host "4 - Run Android (Smart Mode)"
    Write-Host "5 - EAS Dev Build"
    Write-Host "6 - Environment Diagnosis"
    Write-Host "7 - Sair"
    Write-Host ""

    $choice = Read-Host "Escolhe uma opcao (1-7)"

    switch ($choice) {
        "1" { Light-Clean }
        "2" { Medium-Clean }
        "3" { Nuclear-Clean }
        "4" { Run-Android }
        "5" { EAS-Build }
        "6" { Environment-Diagnosis }
        "7" { 
            Write-Host "`nA sair do DevTool..." -ForegroundColor Yellow
            exit 
        }
        default { Write-Host "Opcao invalida" -ForegroundColor Red }
    }
}