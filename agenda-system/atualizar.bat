@echo off
chcp 65001 >nul
title Klinis - Atualizar Sistema
color 0B

echo ==========================================
echo    ATUALIZAR SISTEMA - KLINIS
echo ==========================================
echo.

REM ============================================
REM   CONFIGURACAO
REM ============================================
REM ONDE ESTA A INSTALACAO ATUAL NO SERVIDOR
set DESTINO=C:\Sistema\AgendaMedica\agenda-system

REM DADOS PARA BACKUP DO BANCO (OPCIONAL)
REM Deixe DB_PASS vazio para pular o backup automatico
set DB_SERVER=localhost
set DB_USER=sa
set DB_PASS=

REM ONDE ESTA O PACOTE NOVO (padrao: mesma pasta deste script)
set NOVO=%~dp0
if "%NOVO:~-1%"=="\" set NOVO=%NOVO:~0,-1%

set TS=%date:~6,4%%date:~3,2%%date:~0,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set TS=%TS: =0%
set BACKUP_DIR=%DESTINO%\backup_atualizacao_%TS%

echo Destino: %DESTINO%
echo Origem : %NOVO%
echo.

echo ==========================================
echo    VALIDANDO PACOTE NOVO
echo ==========================================
echo.

if not exist "%NOVO%\dist\index.html" (
    echo ERRO: Frontend novo nao encontrado em: %NOVO%\dist\index.html
    echo Copie a pasta do projeto ATUALIZADO junto com este script.
    pause
    exit /b 1
)

if not exist "%NOVO%\backend\publish\AgendaMedica.exe" (
    echo ERRO: Backend novo nao encontrado em: %NOVO%\backend\publish\AgendaMedica.exe
    echo Execute o publicar.bat na maquina de desenvolvimento antes de copiar.
    pause
    exit /b 1
)

echo [*] Pacote novo OK.

if not exist "%DESTINO%\dist\index.html" (
    echo ERRO: Instalacao atual nao encontrada em: %DESTINO%
    echo Confirme o caminho no topo deste script (variavel DESTINO).
    pause
    exit /b 1
)

echo [*] Instalacao atual localizada.

echo.
echo ==========================================
echo    BACKUP DO BANCO (OPCIONAL)
echo ==========================================
echo.

if "%DB_PASS%"=="" (
    echo [*] Backup do banco desabilitado (DB_PASS vazio).
    echo     IMPORTANTE: faca backup manual se necessario.
) else (
    echo [*] Fazendo backup do banco klinis...
    sqlcmd -S %DB_SERVER% -U %DB_USER% -P %DB_PASS% -Q "BACKUP DATABASE klinis TO DISK='C:\Backup\klinis_%TS%.bak'"
    if errorlevel 1 (
        echo    AVISO: falha no backup do banco. Continuando mesmo assim?
    )
)

echo.
echo ==========================================
echo    PARANDO SERVICOS
echo ==========================================
echo.

echo [*] Parando Frontend (KlinisFrontend)...
net stop KlinisFrontend 2>nul
if errorlevel 1 echo    AVISO: servico nao estava em execucao ou nao existe.

echo [*] Parando Backend (KlinisBackend)...
net stop KlinisBackend 2>nul
if errorlevel 1 echo    AVISO: servico nao estava em execucao ou nao existe.

echo.
echo ==========================================
echo    FAZENDO BACKUP DA INSTALACAO ATUAL
echo ==========================================
echo.

mkdir "%BACKUP_DIR%\publish" 2>nul
mkdir "%BACKUP_DIR%\dist" 2>nul

REM Preserva configuracao do cliente (se existir)
if exist "%DESTINO%\backend\publish\appsettings.json" (
    echo [*] Salvando appsettings.json do cliente...
    copy /y "%DESTINO%\backend\publish\appsettings.json" "%BACKUP_DIR%\appsettings.json" >nul
)

xcopy /E /Y /Q "%DESTINO%\backend\publish\*" "%BACKUP_DIR%\publish\" >nul
xcopy /E /Y /Q "%DESTINO%\dist\*" "%BACKUP_DIR%\dist\" >nul

echo [*] Backup salvo em: %BACKUP_DIR%

echo.
echo ==========================================
echo    COPIANDO ARQUIVOS NOVOS
echo ==========================================
echo.

echo [*] Atualizando backend em %DESTINO%\backend\publish...
xcopy /E /Y /Q "%NOVO%\backend\publish\*" "%DESTINO%\backend\publish\" >nul
if errorlevel 1 (
    echo ERRO ao copiar backend.
    pause
    exit /b 1
)

echo [*] Atualizando frontend em %DESTINO%\dist...
xcopy /E /Y /Q "%NOVO%\dist\*" "%DESTINO%\dist\" >nul
if errorlevel 1 (
    echo ERRO ao copiar frontend.
    pause
    exit /b 1
)

REM Restaura configuracao do cliente (se havia backup)
if exist "%BACKUP_DIR%\appsettings.json" (
    echo [*] Restaurando appsettings.json do cliente...
    copy /y "%BACKUP_DIR%\appsettings.json" "%DESTINO%\backend\publish\appsettings.json" >nul
)

echo [*] Arquivos atualizados.

echo.
echo ==========================================
echo    INICIANDO SERVICOS
echo ==========================================
echo.

echo [*] Iniciando Backend...
net start KlinisBackend 2>nul
if errorlevel 1 (
    echo    ERRO ao iniciar Backend. Verifique os logs.
)

echo [*] Iniciando Frontend...
net start KlinisFrontend 2>nul
if errorlevel 1 (
    echo    ERRO ao iniciar Frontend. Verifique os logs.
)

echo.
echo ==========================================
echo    VERIFICANDO STATUS
echo ==========================================
echo.

sc query KlinisBackend | findstr /C:"STATE"
sc query KlinisFrontend | findstr /C:"STATE"

echo.
echo [*] Testando endpoints...
curl -s -o nul -w "   Backend (5000): HTTP %%{http_code}\n" http://localhost:5000/api/agendamentos
curl -s -o nul -w "   Frontend (8080): HTTP %%{http_code}\n" http://localhost:8080

echo.
echo ==========================================
echo    ATUALIZACAO CONCLUIDA!
echo ==========================================
echo.
echo Backup da versao anterior: %BACKUP_DIR%
echo Acesse: http://localhost:8080
echo.
echo IMPORTANTE: se algo falhar, restaure copiando a pasta
echo %BACKUP_DIR%\publish  -^>  %DESTINO%\backend\publish
echo %BACKUP_DIR%\dist     -^>  %DESTINO%\dist
echo e reinicie os servicos.
echo.
pause
