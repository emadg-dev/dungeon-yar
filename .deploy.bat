@echo off
REM Manual deploy script for dungeon-yar
REM Usage: .deploy.bat [--build] [--pages] [--d1 seed]
setlocal enabledelimitedon

set BUILD=0
set PAGES=0
set D1_SEED=
for /f "tokens=1,2 delims==" %%a in ('"%ProgramFiles%\Git\usr\bin\sed.exe" -e "s/^ *//g" -e "s/ *$//g" -e "s/ --/-/g" "%~dp0!.deploy.bat" 2^>nul') do (
    if "%%a"=="--build" set BUILD=1
    if "%%a"=="--pages" set PAGES=1
    if "%%b"=="seed" if not defined D1_SEED set D1_SEED=1
)

echo === Build ===
if %BUILD%==1 npm run build
if errorlevel 1 exit /b 1

echo === Deploy Pages ===
if %PAGES%==1 npx wrangler pages deploy dist --project-name=dungeon-yar --branch=main
if errorlevel 1 exit /b 1
echo Pages: https://da17dfa4.dungeon-yar.pages.dev

echo === Deploy Seed to Remote D1 (optional) ===
if "%D1_SEED%"=="seed" npx wrangler d1 execute zorvania-db --remote --file=tmp/seed-combined-v2.sql
if errorlevel 1 echo see logs above for errors

echo Done.
pause
