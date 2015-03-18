@echo off

:: Runs CreateMobilizerSetup actions.

setlocal

set BUILD_RELEASE=%1
set BUILD_LOG=%2
set MOBILIZER_SETUP_LOG=%BUILD_RELEASE%\createMobilizerSetup.log

echo Executing CreateMobilizerSetup... >> %MOBILIZER_SETUP_LOG%
echo Executing CreateMobilizerSetup... >> %BUILD_LOG%
echo %DATE% >> %MOBILIZER_SETUP_LOG% 
echo %TIME% >> %MOBILIZER_SETUP_LOG%

if "%NSIS_TOOL%"=="" (
	REM echo "NSIS is not installed. Go install it and then set NSIS_TOOL var in %~dp0\%COMPUTERNAME%.cmd" >> %MOBILIZER_SETUP_LOG%
	goto :Error
)

echo Compiling ReportManagerSetup.nsi... >> %MOBILIZER_SETUP_LOG%
"%NSIS_TOOL%" /O%BUILD_RELEASE%\NSIS.log %BUILD_RELEASE%\Setup\ReportManagerSetup.nsi
if ERRORLEVEL 1 (
	type %BUILD_RELEASE%\NSIS.log >> %MOBILIZER_SETUP_LOG%
	goto :Error 
)

type %BUILD_RELEASE%\NSIS.log >> %MOBILIZER_SETUP_LOG%

echo Code Signing Setup ForerunnerMobilizerSetup.exe... >> %MOBILIZER_SETUP_LOG%
%~dp0sign.cmd %BUILD_RELEASE%\Setup\ForerunnerMobilizerSetup.exe >> %MOBILIZER_SETUP_LOG%
if ERRORLEVEL 1 (
	goto :Error
)


echo CreateMobilizerSetup SUCCEEDED. >> %MOBILIZER_SETUP_LOG%
echo CreateMobilizerSetup SUCCEEDED. >> %BUILD_LOG%
exit /b 0

:Error
echo CreateMobilizerSetup FAILED. >> %MOBILIZER_SETUP_LOG%
echo CreateMobilizerSetup FAILED. >> %BUILD_LOG%
exit /b 1
