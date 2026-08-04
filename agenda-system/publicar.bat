@echo off
REM ============================================
REM Script de Publicacao - Agenda Medica
REM ============================================

echo.
echo ========================================
echo   PUBLICACAO - AGENDA MEDICA
echo ========================================
echo.

REM Verificar .NET
dotnet --version >nul 2>&1
if errorlevel 1 (
    echo ERRO: .NET nao encontrado. Instale o .NET SDK 8.0 ou superior.
    pause
    exit /b 1
)

echo [1/4] Verificando dependencias do frontend...
cd /d "%~dp0frontend"
if not exist "node_modules" (
    echo        Instalando dependencias npm...
    call npm install
) else (
    echo        OK - dependencias ja instaladas
)

echo.
echo [2/4] Compilando frontend...
call npm run build
if errorlevel 1 (
    echo ERRO ao compilar frontend
    pause
    exit /b 1
)
echo        Frontend compilado com sucesso!

echo.
echo [3/4] Publicando backend...
cd /d "%~dp0backend"
call dotnet publish -c Release -o ./publish
if errorlevel 1 (
    echo ERRO ao publicar backend
    pause
    exit /b 1
)
echo        Backend publicado com sucesso!

echo.
echo [4/4] Copiando arquivos para pasta de distribuicao...
if not exist "%~dp0dist" mkdir "%~dp0dist"
xcopy /E /Y "%~dp0frontend\dist\*" "%~dp0dist\"
xcopy /E /Y "%~dp0backend\publish\*" "%~dp0dist\backend\"
echo        Arquivos copiados!

echo.
echo ========================================
echo   PUBLICACAO CONCLUIDA COM SUCESSO!
echo ========================================
echo.
echo Pasta de destino: %~dp0dist
echo.
echo Para executar o sistema:
echo   cd %~dp0dist\backend
echo   dotnet AgendaMedica.dll
echo.
echo O frontend estarah disponivel na pasta dist
echo Configure um servidor web (nginx/iis) para servir
echo.
pause