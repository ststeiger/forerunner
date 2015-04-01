@echo off

:: Runs Postbuild actions.

setlocal

set BUILD_RELEASE=%1
set BUILD_LOG=%2
set POSTBUILD_LOG=%BUILD_RELEASE%\postbuild.log

echo Executing Postbuild... >> %POSTBUILD_LOG%
echo %DATE% >> %POSTBUILD_LOG% 
echo %TIME% >> %POSTBUILD_LOG%

:: The following actions are mandatory and must complete in order for any other
:: actions to proceed
::
if not exist "%BUILD_RELEASE%\Setup" (
	mkdir "%BUILD_RELEASE%\Setup"
)

copy %~dp0..\build.txt "%BUILD_RELEASE%\build.txt"
if ERRORLEVEL 1 (
	goto :Error
)

echo Copying Files for Setup... >> %POSTBUILD_LOG%
call %~dp0..\RS\Reporting\CopyFiles.cmd %BUILD_RELEASE% %POSTBUILD_LOG%
if ERRORLEVEL 1 (
	goto :Error
)

echo Copying setup manifest... >> %POSTBUILD_LOG%
robocopy %~dp0..\Setup %BUILD_RELEASE%\Setup * /E /R:0
if ERRORLEVEL 8 (
	goto :Error
)

:: The next actions may fail and log errors but any other optional actions
:: should run anyway
::
call %~dp0CreateMobilizerSetup.cmd %BUILD_RELEASE% %POSTBUILD_LOG%
if ERRORLEVEL 1 (
	goto :Error
)

call %~dp0CreateMobilizerUpdateSetup.cmd %BUILD_RELEASE% %POSTBUILD_LOG%
if ERRORLEVEL 1 (
	goto :Error
)

call %~dp0createForerunnerSDK.cmd %BUILD_RELEASE% %POSTBUILD_LOG%
if ERRORLEVEL 1 (
	goto :Error
)

call %~dp0createGettingStartedSDK.cmd %BUILD_RELEASE% %POSTBUILD_LOG%
if ERRORLEVEL 1 (
	goto :Error
)

echo PostBuild SUCCEEDED. >> %POSTBUILD_LOG%
type %POSTBUILD_LOG% >> %BUILD_LOG%
exit /b 0

:Error
echo PostBuild FAILED. >> %POSTBUILD_LOG%
type %POSTBUILD_LOG% >> %BUILD_LOG%
exit /b 1
