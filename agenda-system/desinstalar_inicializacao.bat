@echo off
chcp 65001 >nul
title Agenda Médica - Remover Inicialização Automática
color 0C

echo ==========================================
echo    REMOVER INICIALIZAÇÃO AUTOMÁTICA
echo ==========================================
echo.

schtasks /delete /tn "AgendaMedica_Backend" /f 2>nul
schtasks /delete /tn "AgendaMedica_Frontend" /f 2>nul

echo [*] Tarefas removidas com sucesso!
echo.
pause
