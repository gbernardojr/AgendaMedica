@echo off
chcp 65001 >nul
title Klinis - Instalar Serviços Windows
color 0A

echo ==========================================
echo    INSTALAR SERVIÇOS WINDOWS - KLINIS
echo ==========================================
echo.

set SCRIPT_DIR=%~dp0
set KLINIS_ROOT=C:\Sistema
set AGENDA_ROOT=%KLINIS_ROOT%\AgendaMedica\agenda-system

echo [*] Verificando estrutura de pastas...
if not exist "%AGENDA_ROOT%\backend\publish\AgendaMedica.exe" (
    echo ERRO: Backend nao encontrado em: %AGENDA_ROOT%\backend\publish\
    echo Copie a pasta agenda-system para C:\Klinis\
    pause
    exit /b 1
)

echo [*] Pasta do projeto encontrada.

echo.
echo ==========================================
echo    DOWNLOAD E INSTALACAO DO NSSM
echo ==========================================
echo.

if not exist "%KLINIS_ROOT%\nssm\nssm.exe" (
    echo [*] Baixando NSSM...
    powershell -Command "Invoke-WebRequest -Uri 'https://nssm.cc/release/nssm-2.24.zip' -OutFile '%KLINIS_ROOT%\nssm.zip'"
    
    echo [*] Extraindo NSSM...
    powershell -Command "Expand-Archive -Path '%KLINIS_ROOT%\nssm.zip' -DestinationPath '%KLINIS_ROOT%\nssm_temp' -Force"
    
    copy "%KLINIS_ROOT%\nssm_temp\nssm-2.24\win64\nssm.exe" "%KLINIS_ROOT%\nssm\nssm.exe" >nul
    
    rmdir /s /q "%KLINIS_ROOT%\nssm_temp"
    del /f /q "%KLINIS_ROOT%\nssm.zip"
    
    echo [*] NSSM instalado com sucesso.
) else (
    echo [*] NSSM ja instalado.
)

echo.
echo ==========================================
echo    CRIANDO DIRETORIOS
echo ==========================================
echo.

if not exist "%KLINIS_ROOT%\servicos" mkdir "%KLINIS_ROOT%\servicos"
if not exist "%KLINIS_ROOT%\nginx\logs" mkdir "%KLINIS_ROOT%\nginx\logs"

echo.
echo ==========================================
echo    INSTALANDO SERVICO BACKEND
echo ==========================================
echo.

echo [*] Removendo servico anterior (se houver)...
"%KLINIS_ROOT%\nssm\nssm.exe" remove KlinisBackend confirm 2>nul

echo [*] Criando servico do Backend...
"%KLINIS_ROOT%\nssm\nssm.exe" install KlinisBackend "%AGENDA_ROOT%\backend\publish\AgendaMedica.exe"
"%KLINIS_ROOT%\nssm\nssm.exe" set KlinisBackend AppDirectory "%AGENDA_ROOT%\backend\publish"
"%KLINIS_ROOT%\nssm\nssm.exe" set KlinisBackend DisplayName "Klinis Backend API"
"%KLINIS_ROOT%\nssm\nssm.exe" set KlinisBackend Description "API do Sistema de Agenda Medica Klinis"
"%KLINIS_ROOT%\nssm\nssm.exe" set KlinisBackend Start SERVICE_AUTO_START
"%KLINIS_ROOT%\nssm\nssm.exe" set KlinisBackend AppRestartDelay 5000
"%KLINIS_ROOT%\nssm\nssm.exe" set KlinisBackend AppExitCode 0
"%KLINIS_ROOT%\nssm\nssm.exe" set KlinisBackend AppThrottleDelay 1000

echo.
echo ==========================================
echo    INSTALANDO SERVICO NGINX (FRONTEND)
echo ==========================================
echo.

if not exist "%KLINIS_ROOT%\nginx\nginx.exe" (
    echo [*] Nginx nao encontrado. Baixando...
    powershell -Command "Invoke-WebRequest -Uri 'https://nginx.org/download/nginx-1.26.2.zip' -OutFile '%KLINIS_ROOT%\nginx.zip'"
    
    echo [*] Extraindo Nginx...
    powershell -Command "Expand-Archive -Path '%KLINIS_ROOT%\nginx.zip' -DestinationPath '%KLINIS_ROOT%\nginx_temp' -Force"
    
    xcopy /e /y "%KLINIS_ROOT%\nginx_temp\nginx-1.26.2" "%KLINIS_ROOT%\nginx\" >nul
    rmdir /s /q "%KLINIS_ROOT%\nginx_temp"
    del /f /q "%KLINIS_ROOT%\nginx.zip"
)

echo [*] Removendo servico anterior (se houver)...
"%KLINIS_ROOT%\nssm\nssm.exe" remove KlinisFrontend confirm 2>nul

echo [*] Criando servico do Frontend...
"%KLINIS_ROOT%\nssm\nssm.exe" install KlinisFrontend "%KLINIS_ROOT%\nginx\nginx.exe"
"%KLINIS_ROOT%\nssm\nssm.exe" set KlinisFrontend AppDirectory "%KLINIS_ROOT%\nginx"
"%KLINIS_ROOT%\nssm\nssm.exe" set KlinisFrontend DisplayName "Klinis Frontend Web"
"%KLINIS_ROOT%\nssm\nssm.exe" set KlinisFrontend Description "Frontend Web do Sistema de Agenda Medica"
"%KLINIS_ROOT%\nssm\nssm.exe" set KlinisFrontend Start SERVICE_AUTO_START
"%KLINIS_ROOT%\nssm\nssm.exe" set KlinisFrontend AppParameters "-c %KLINIS_ROOT%\nginx\conf\nginx.conf"

echo.
echo ==========================================
echo    COPIANDO ARQUIVOS DE CONFIGURACAO
echo ==========================================
echo.

if not exist "%KLINIS_ROOT%\nginx\conf\nginx.conf" (
    echo [*] Criando nginx.conf...
    
    (
        echo worker_processes 1;
        echo error_log logs/error.log;
        echo pid logs/nginx.pid;
        echo.
        echo events {
        echo     worker_connections 1024;
        echo }
        echo.
        echo http {
        echo     include mime.types;
        echo     default_type application/octet-stream;
        echo.
        echo     access_log logs/access.log;
        echo.
        echo     sendfile on;
        echo     keepalive_timeout 65;
        echo.
        echo     server {
        echo         listen 8080;
        echo         server_name localhost;
        echo.
        echo         root %AGENDA_ROOT%\dist;
        echo         index index.html;
        echo.
        echo         location / {
        echo             try_files $uri $uri/ /index.html;
        echo         }
        echo.
        echo         location /api/ {
        echo             proxy_pass http://localhost:5000/api/;
        echo             proxy_http_version 1.1;
        echo             proxy_set_header Host $host;
        echo             proxy_set_header X-Real-IP $remote_addr;
        echo             proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        echo         }
        echo.
        echo         location /login {
        echo             proxy_pass http://localhost:5000/login;
        echo             proxy_http_version 1.1;
        echo             proxy_set_header Host $host;
        echo         }
        echo     }
        echo }
    ) > "%KLINIS_ROOT%\nginx\conf\nginx.conf"
    
    echo [*] nginx.conf criado.
)

echo.
echo ==========================================
echo    COPIANDO SCRIPTS DE CONTROLE
echo ==========================================
echo.

copy /y "%SCRIPT_DIR%iniciar_servicos.bat" "%KLINIS_ROOT%\servicos\" >nul
copy /y "%SCRIPT_DIR%parar_servicos.bat" "%KLINIS_ROOT%\servicos\" >nul
copy /y "%SCRIPT_DIR%status_servicos.bat" "%KLINIS_ROOT%\servicos\" >nul

echo.
echo ==========================================
echo    INSTALACAO CONCLUIDA!
echo ==========================================
echo.
echo Para iniciar os servicos, execute:
echo   %KLINIS_ROOT%\servicos\iniciar_servicos.bat
echo.
echo O sistema estara disponivel em:
echo   http://localhost:8080
echo.
echo Scripts de controle:
echo   %KLINIS_ROOT%\servicos\iniciar_servicos.bat
echo   %KLINIS_ROOT%\servicos\parar_servicos.bat
echo   %KLINIS_ROOT%\servicos\status_servicos.bat
echo.
pause