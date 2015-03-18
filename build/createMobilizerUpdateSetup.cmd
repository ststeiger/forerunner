@echo off

:: Runs CreateMobilizerUpdateSetup actions.

setlocal

set BUILD_RELEASE=%1
set BUILD_LOG=%2
set MOBILIZER_UPDATE_SETUP_LOG=%BUILD_RELEASE%\CreateMobilizerUpdateSetup.log

echo Executing CreateMobilizerUpdateSetup... >> %MOBILIZER_UPDATE_SETUP_LOG%
echo Executing CreateMobilizerUpdateSetup... >> %BUILD_LOG%
echo %DATE% >> %MOBILIZER_UPDATE_SETUP_LOG% 
echo %TIME% >> %MOBILIZER_UPDATE_SETUP_LOG%


echo Compiling MobilizerUpdate.nsi... >> %MOBILIZER_UPDATE_SETUP_LOG%
"%NSIS_TOOL%" /O%BUILD_RELEASE%\NSIS.log %BUILD_RELEASE%\Setup\MobilizerUpdate.nsi
if ERRORLEVEL 1 (
	type %BUILD_RELEASE%\NSIS.log >> %MOBILIZER_UPDATE_SETUP_LOG%
	goto :Error 
)

type %BUILD_RELEASE%\NSIS.log >> %MOBILIZER_UPDATE_SETUP_LOG%

echo Code Signing Update Packages... >> %MOBILIZER_UPDATE_SETUP_LOG%
%~dp0sign.cmd %BUILD_RELEASE%\Setup\ForerunnerMobilizerUpdate.exe >> %MOBILIZER_UPDATE_SETUP_LOG%
if ERRORLEVEL 1 (
	goto :Error
)


echo CreateMobilizerUpdateSetup SUCCEEDED. >> %MOBILIZER_UPDATE_SETUP_LOG%
echo CreateMobilizerUpdateSetup SUCCEEDED. >> %BUILD_LOG%
exit /b 0

:Error
echo CreateMobilizerUpdateSetup FAILED. >> %MOBILIZER_UPDATE_SETUP_LOG%
echo CreateMobilizerUpdateSetup FAILED. >> %BUILD_LOG%
exit /b 1
