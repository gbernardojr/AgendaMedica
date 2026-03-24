@echo off
chcp 65001 >nul
title Agenda Médica - Configurar Inicialização Automática
color 0A

echo ==========================================
echo    CONFIGURAR INICIALIZAÇÃO AUTOMÁTICA
echo ==========================================
echo.

set SCRIPT_DIR=%~dp0

echo [*] Removendo tarefas anteriores (se houver)...
schtasks /delete /tn "AgendaMedica_Backend" /f 2>nul
schtasks /delete /tn "AgendaMedica_Frontend" /f 2>nul

echo [*] Criando tarefa para Backend...
schtasks /create /tn "AgendaMedica_Backend" /tr "cmd /k cd /d \"%SCRIPT_DIR%backend && python app.py\"" /sc onlogon /rl limited /f

echo [*] Criando tarefa para Frontend...
schtasks /create /tn "AgendaMedica_Frontend" /tr "cmd /k cd /d \"%SCRIPT_DIR%frontend && npm run dev\"" /sc onlogon /rl limited /f

echo.
echo ==========================================
echo    CONFIGURAÇÃO CONCLUÍDA!
echo ==========================================
echo.
echo Os servidores serão iniciados automaticamente
echo quando você fizer login no Windows.
echo.
echo Para testar agora, execute:
echo   iniciar_agenda.bat
echo.
echo Para remover a inicialização automática:
echo   desinstalar_inicializacao.bat
echo ==========================================
pause
