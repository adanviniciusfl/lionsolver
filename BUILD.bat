@echo off
setlocal enabledelayedexpansion
title LionSolver - Build Desktop

REM Navigate to the folder where this BAT file is located
cd /d "%~dp0"

echo.
echo  ================================================
echo   LIONSOLVER - Build Desktop Windows
echo  ================================================
echo   Pasta do projeto: %cd%
echo  ================================================
echo.

echo [1/5] Verificando Node.js...
where node >nul 2>nul
if !ERRORLEVEL! neq 0 (
    echo   ERRO: Node.js nao encontrado!
    echo   Baixe em: https://nodejs.org/
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do echo   Node.js %%i - OK
echo.

echo [2/5] Verificando Rust...
where rustc >nul 2>nul
if !ERRORLEVEL! neq 0 (
    echo   Rust nao encontrado. Instalando...
    powershell -Command "Invoke-WebRequest -Uri 'https://win.rustup.rs/x86_64' -OutFile '%TEMP%\rustup-init.exe'"
    if exist "%TEMP%\rustup-init.exe" (
        "%TEMP%\rustup-init.exe" -y --default-toolchain stable
        set "PATH=%USERPROFILE%\.cargo\bin;!PATH!"
        echo   Rust instalado - OK
    ) else (
        echo   ERRO: Instale Rust manualmente em https://rustup.rs/
        pause
        exit /b 1
    )
) else (
    for /f "tokens=*" %%i in ('rustc --version') do echo   %%i - OK
)
echo.

echo [3/5] Instalando dependencias npm...
echo   Rodando npm install em: %cd%
call npm install
if !ERRORLEVEL! neq 0 (
    echo   ERRO: npm install falhou.
    echo   Verifique se o package.json existe em: %cd%
    pause
    exit /b 1
)
echo   Dependencias OK
echo.

echo [4/5] Gerando icones...
if not exist "src-tauri\icons\icon.ico" (
    call npx tauri icon src-tauri\icons\icon.svg >nul 2>nul
)
echo   Icones OK
echo.

echo [5/5] Compilando LionSolver...
echo   Primeira vez: 5-10 min. Proximas: 2-3 min.
echo.
call npx tauri build
if !ERRORLEVEL! neq 0 (
    echo.
    echo   ERRO na compilacao.
    echo   Verifique se tem Visual Studio Build Tools:
    echo   https://visualstudio.microsoft.com/visual-cpp-build-tools/
    pause
    exit /b 1
)

echo.
echo  ================================================
echo   BUILD CONCLUIDO!
echo   Instalador em: src-tauri\target\release\bundle\nsis\
echo   Arquivo: LionSolver_1.0.0_x64-setup.exe
echo  ================================================
echo.

if exist "src-tauri\target\release\bundle\nsis" (
    explorer "src-tauri\target\release\bundle\nsis"
)

pause
