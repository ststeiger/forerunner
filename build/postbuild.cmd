@echo off
REM
REM Runs Postbuild actions.
REM
set BUILD_RELEASE=%1
set BUILD_LOG=%2
set POSTBUILD_LOG=%BUILD_RELEASE%\postbuild.log
echo Executing Postbuild... >> %POSTBUILD_LOG%
echo %DATE% >> %POSTBUILD_LOG% 
echo %TIME% >> %POSTBUILD_LOG%

if "%NSIS_TOOL%"=="" (
	REM echo "NSIS is not installed. Go install it and then set NSIS_TOOL var in %~dp0\%COMPUTERNAME%.cmd" >> %POSTBUILD_LOG%
	goto :Error
)

if not exist "%BUILD_RELEASE%\Setup" (
	mkdir "%BUILD_RELEASE%\Setup"
)

echo Copying setup manifest... >> %POSTBUILD_LOG%
robocopy %~dp0..\Setup %BUILD_RELEASE%\Setup * /E /R:0
if ERRORLEVEL 8 (
	goto :Error
)

echo Copying Files for Setup... >> %POSTBUILD_LOG%
call %~dp0..\RS\Reporting\CopyFiles.cmd %BUILD_RELEASE% %POSTBUILD_LOG%
if ERRORLEVEL 1 (
	goto :Error
)

echo Compiling Setup Packages... >> %POSTBUILD_LOG%
"%NSIS_TOOL%" /O%BUILD_RELEASE%\NSIS.log %BUILD_RELEASE%\Setup\ReportManagerSetup.nsi
if ERRORLEVEL 1 (
	type %BUILD_RELEASE%\NSIS.log >> %POSTBUILD_LOG%
	goto :Error 
)

type %BUILD_RELEASE%\NSIS.log >> %POSTBUILD_LOG%
echo PostBuild SUCCEEDED. >> %BUILD_LOG%
type %POSTBUILD_LOG% >> %BUILD_LOG%
exit /b 0

:Error
echo PostBuild FAILED. >> %BUILD_LOG%
type %POSTBUILD_LOG% >> %BUILD_LOG%
exit /b 1
