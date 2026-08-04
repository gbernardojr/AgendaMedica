@echo off
chcp 65001 >nul
title Klinis - Desinstalar Servicos
color 0C

echo ==========================================
echo    DESINSTALAR SERVICOS KLINIS
echo ==========================================
echo.
echo ATENCAO: Este script remove os servicos Windows!
echo.
set /p CONFIRMAR="Digite SIM para confirmar: "

if /i not "%CONFIRMAR%"=="SIM" (
    echo Operacao cancelada.
    pause
    exit /b
)

set KLINIS_ROOT=C:\Sistema

echo.
echo [*] Parando servicos...
net stop KlinisFrontend 2>nul
net stop KlinisBackend 2>nul

echo [*] Removendo servico Frontend...
"%KLINIS_ROOT%\nssm\nssm.exe" remove KlinisFrontend confirm 2>nul

echo [*] Removendo servico Backend...
"%KLINIS_ROOT%\nssm\nssm.exe" remove KlinisBackend confirm 2>nul

echo.
echo ==========================================
echo    SERVICOS REMOVIDOS!
echo ==========================================
echo.
pause