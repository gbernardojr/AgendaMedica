@echo off
chcp 65001 >nul
title Klinis - Parar Servicos
color 0A

echo ==========================================
echo    PARAR SERVICOS KLINIS
echo ==========================================
echo.

set KLINIS_ROOT=C:\Sistema

echo [*] Parando Frontend (Nginx)...
net stop KlinisFrontend 2>nul
if errorlevel 1 (
    echo    Servico Frontend nao esta em execucao.
) else (
    echo    Frontend parado.
)

echo [*] Parando Backend...
net stop KlinisBackend 2>nul
if errorlevel 1 (
    echo    Servico Backend nao esta em execucao.
) else (
    echo    Backend parado.
)

echo.
echo ==========================================
echo    SERVICOS PARADOS!
echo ==========================================
echo.
pause