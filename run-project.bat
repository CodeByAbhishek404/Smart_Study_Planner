@echo off
title Smart Study Planner Launcher
echo ====================================================
echo Starting Smart Study Planner Launcher...
echo ====================================================
powershell.exe -ExecutionPolicy Bypass -File "%~dp0run-project.ps1"
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Failed to execute launch script.
    pause
)
