@echo off
chcp 65001 >nul
title Klinis - Status dos Servicos
color 0A

set KLINIS_ROOT=C:\Sistema

echo ==========================================
echo    STATUS DOS SERVICOS KLINIS
echo ==========================================
echo.

echo.
echo [*] Backend (KlinisBackend):
sc query KlinisBackend

echo.
echo [*] Frontend (KlinisFrontend):
sc query KlinisFrontend

echo.
echo ==========================================
echo    TESTANDO ENDPOINTS
echo ==========================================
echo.

echo [*] Testando Backend API...
curl -s -o nul -w "   Backend (http://localhost:5000): HTTP %%{http_code}\n" http://localhost:5000/api/agendamentos

echo [*] Testando Frontend...
curl -s -o nul -w "   Frontend (http://localhost:8080): HTTP %%{http_code}\n" http://localhost:8080

echo.
echo ==========================================
echo    PORTAS EM USO
echo ==========================================
echo.

netstat -ano | findstr ":5000 :8080"

echo.
pause