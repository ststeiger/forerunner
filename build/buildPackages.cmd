@echo off

:: This is a test file that will call createForerunnerSDK.cmd in the same
:: way that build does. It is not part of the "real" build

call %~dp0variables.cmd
if exist %DROP_ROOT% (
	rmdir /s /q %DROP_ROOT%
)
mkdir %DROP_ROOT%

set BUILD_MAJOR=
set BUILD_MINOR=
set BUILD_BUILD=
set BUILD_REVISON=
for /F "tokens=1-4 delims=." %%i in (%~dp0\..\build.txt) do (
	set BUILD_MAJOR=%%i
	set BUILD_MINOR=%%j
	set BUILD_BUILD=%%k
	set BUILD_REVISION=%%l
)

::set /A BUILD_BUILD+=1
set BUILD_RELEASE=%DROP_ROOT%\%BUILD_MAJOR%.%BUILD_MINOR%.%BUILD_BUILD%.%BUILD_REVISION%

if not exist "%BUILD_RELEASE%" (
	mkdir "%BUILD_RELEASE%"
)
if not exist "%SECRETS_ROOT%" (
	mkdir "%SECRETS_ROOT%"
)
set BUILD_LOG=%BUILD_RELEASE%\build.log
echo %DATE% >> %BUILD_LOG%
echo %TIME% >> %BUILD_LOG%
echo %PROJECT_NAME% >> %BUILD_LOG%
echo Syncing Tree from [%GITHUBSSH%] >> %BUILD_LOG%
echo USERNAME [%USERNAME%] >> %BUILD_LOG%
echo USERDOMAIN [%USERDOMAIN%] >> %BUILD_LOG%
echo USERPROFILE [%USERPROFILE%] >> %BUILD_LOG%
echo HOMEDRIVE [%HOMEDRIVE%] >> %BUILD_LOG%
echo HOMEPATH [%HOMEPATH%] >> %BUILD_LOG%
echo HOME [%HOME%] >> %BUILD_LOG%
echo SPSITE [%SPSITE%] >> %BUILD_LOG%
echo SPRELEASE [%SPRELEASE%] >> %BUILD_LOG%
echo SECRETS_ROOT [%SECRETS_ROOT%] >> %BUILD_LOG%
echo GITHUBSSH [%GITHUBSSH%] >> %BUILD_LOG%
set SPBUILD_RELEASE=%SPRELEASE%/%BUILD_MAJOR%.%BUILD_MINOR%.%BUILD_BUILD%.%BUILD_REVISION%
set SPBUILD_URL=%SPSITE%%SPBUILD_RELEASE%
set UPLOADER=%~dp0tools\SharepointUploader\bin\Debug\SharepointUploader.exe
set ZIPPER=%~dp0tools\Zipper\bin\Debug\Zipper.exe
echo Cleaning Build Files... >> %BUILD_LOG%
echo Cleaning Setup Build Files... >> %BUILD_LOG%
rmdir /s /q %~dp0..\Setup\Build >> %BUILD_LOG% 2>&1

echo %BUILD_MAJOR%.%BUILD_MINOR%.%BUILD_BUILD%.%BUILD_REVISION%> %~dp0\..\build.txt

pushd %~dp0\..

echo Running createForerunnerSDK >> %BUILD_LOG%
call %~dp0createForerunnerSDK.cmd %BUILD_RELEASE% %BUILD_LOG%
if ERRORLEVEL 1 (
	goto :Error
)

echo Running createGettingStartedV4 >> %BUILD_LOG%
call %~dp0createGettingStartedV4.cmd %BUILD_RELEASE% %BUILD_LOG%
if ERRORLEVEL 1 (
	goto :Error
)

echo Running createAllSamplesV4 >> %BUILD_LOG%
call %~dp0createAllSamplesV4.cmd %BUILD_RELEASE% %BUILD_LOG%
if ERRORLEVEL 1 (
	goto :Error
)
exit /b 0

:InitError
echo The Build Failed to initialize. >> %BUILD_LOG%
echo There was an issue with GIT. >> %BUILD_LOG%
exit /b 1

:Error
echo The Build Failed. >> %BUILD_LOG%
exit /b 1
