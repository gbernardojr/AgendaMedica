@echo off
chcp 65001 >nul
title Klinis - Iniciar Servicos
color 0A

echo ==========================================
echo    INICIAR SERVICOS KLINIS
echo ==========================================
echo.

set KLINIS_ROOT=C:\Sistema

echo [*] Iniciando Backend...
net start KlinisBackend 2>nul
if errorlevel 1 (
    echo    ERRO ao iniciar Backend. Verifique se o servico foi instalado.
)

echo [*] Iniciando Frontend (Nginx)...
net start KlinisFrontend 2>nul
if errorlevel 1 (
    echo    ERRO ao iniciar Frontend. Verifique se o servico foi instalado.
)

echo.
echo ==========================================
echo    VERIFICANDO STATUS
echo ==========================================
echo.

echo [*] Backend:
sc query KlinisBackend | findstr /C:"STATE"

echo [*] Frontend:
sc query KlinisFrontend | findstr /C:"STATE"

echo.
echo [*] Testando endpoints...

curl -s -o nul -w "Backend (5000): HTTP %%{http_code}\n" http://localhost:5000/api/agendamentos
curl -s -o nul -w "Frontend (8080): HTTP %%{http_code}\n" http://localhost:8080

echo.
echo ==========================================
echo    SERVICOS INICIADOS!
echo ==========================================
echo.
echo Acesse: http://localhost:8080
echo.
pause