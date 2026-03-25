@echo off
cd /d "%~dp0frontend"
echo Instalando dependências do frontend...
npm install --legacy-peer-deps
echo.
echo Instalando ESLint 8 (compatibilidade)...
npm install eslint@8.57.1 --save-dev --legacy-peer-deps
echo.
echo Instalacao concluida!
pause
