@echo off
title Sistema de Contingencia - Evolution API
color 0A

echo ========================================
echo   SISTEMA DE CONTINGENCIA
echo   Evolution API - Lanchonete
echo ========================================
echo.

cd /d "%~dp0"

echo [INFO] Verificando Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERRO] Node.js nao encontrado!
    echo Por favor instale o Node.js antes de continuar.
    pause
    exit /b 1
)

echo [OK] Node.js detectado
echo.

echo [INFO] Iniciando servidor...
echo.

node src\server.js

pause
