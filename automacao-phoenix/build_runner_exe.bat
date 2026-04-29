@echo off
setlocal
cd /d "%~dp0"

where py >nul 2>nul
if %errorlevel%==0 (
    set PYTHON_CMD=py -3
) else (
    set PYTHON_CMD=python
)

echo Instalando dependencias do runner...
%PYTHON_CMD% -m pip install -r requirements.txt
if errorlevel 1 goto :erro

echo Instalando PyInstaller...
%PYTHON_CMD% -m pip install pyinstaller
if errorlevel 1 goto :erro

echo Gerando executavel...
%PYTHON_CMD% -m PyInstaller --clean --noconfirm phoenix_runner.spec
if errorlevel 1 goto :erro

echo.
echo Build concluido com sucesso.
echo Executavel gerado em:
echo %~dp0dist\PalSysRunnerPhoenix.exe
echo.
pause
exit /b 0

:erro
echo.
echo Falha ao gerar o executavel do runner.
echo Revise as mensagens acima.
echo.
pause
exit /b 1
