@echo off
REM
REM Runs Postbuild2 actions.
REM
set BUILD_RELEASE=%1
set BUILD_LOG=%2
set POSTBUILD_LOG=%BUILD_RELEASE%\postbuild2.log
echo Executing Postbuild... >> %POSTBUILD_LOG%
echo %DATE% >> %POSTBUILD_LOG% 
echo %TIME% >> %POSTBUILD_LOG%


echo Compiling Update Packages... >> %POSTBUILD_LOG%
"%NSIS_TOOL%" /O%BUILD_RELEASE%\NSIS.log %BUILD_RELEASE%\Setup\MobilizerUpdate.nsi
if ERRORLEVEL 1 (
	type %BUILD_RELEASE%\NSIS.log >> %POSTBUILD_LOG%
	goto :Error 
)

type %BUILD_RELEASE%\NSIS.log >> %POSTBUILD_LOG%


echo Code Signing Update Packages... >> %POSTBUILD_LOG%
%~dp0sign.cmd %BUILD_RELEASE%\Setup\ForerunnerMobilizerUpdate.exe >> %POSTBUILD_LOG%
if ERRORLEVEL 1 (
	goto :Error
)


echo PostBuild SUCCEEDED. >> %BUILD_LOG%
type %POSTBUILD_LOG% >> %BUILD_LOG%
exit /b 0

:Error
echo PostBuild FAILED. >> %BUILD_LOG%
type %POSTBUILD_LOG% >> %BUILD_LOG%
exit /b 1
