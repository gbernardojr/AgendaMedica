@echo off
title Agenda Médica - Klinis
color 0A

echo ==========================================
echo    SISTEMA DE AGENDA MEDICA - KLINIS
echo ==========================================
echo.

cd /d "%~dp0"

echo [*] Iniciando Backend (Flask)...
start "Backend - Flask" cmd /k "cd %~dp0backend && python app.py"

timeout /t 3 /nobreak >nul

echo [*] Iniciando Frontend (React)...
start "Frontend - React" cmd /k "cd %~dp0frontend && npm run dev"

timeout /t 2 /nobreak >nul

echo.
echo ==========================================
echo    SERVIDORES INICIADOS COM SUCESSO!
echo ==========================================
echo.
echo    Backend:  http://127.0.0.1:5000
echo    Frontend: http://localhost:5173
echo.
echo    Login padrao: admin / admin123
echo ==========================================
echo.
echo Pressione qualquer tecla para abrir o navegador...
pause >nul

start http://localhost:5173

exit
