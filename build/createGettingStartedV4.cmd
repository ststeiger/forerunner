@echo off

:: Runs createGettingStartedV4 actions.
::
:: The NuGet package will be created via the "convention based working directory"
:: instructions found here:
::     http://docs.nuget.org/Create/Creating-and-Publishing-a-Package#from-a-convention-based-working-directory

setlocal

set BUILD_RELEASE=%1
set BUILD_LOG=%2
set /p BUILD_NUMBER=<"%~dp0..\build.txt"
set NUGET_PACKAGE_LOG=%BUILD_RELEASE%\createGettingStartedV4.log

set NUGET_TOOL=%~dp0tools\nuget\nuget.exe

:: We need to remove the "..\" so that the "/XD" robocopy switch used below will work properly
call %~dp0getFullyQualifiedFilePath.cmd "%~dp0..\RS\Reporting\ReportManager\GettingStartedV4\GettingStartedV4" SRC_GETTING_STARTED_V4

set SRC_NUGET="%~dp0tools\nuget"

set DEST="%BUILD_RELEASE%_GettingStartedV4"
set DEST_CONTENT="%DEST%\content"
set DEST_TOOLS="%DEST%\tools"

echo Executing createGettingStartedV4... >> %NUGET_PACKAGE_LOG%
echo Executing createGettingStartedV4... >> %BUILD_LOG%
echo %DATE% >> %NUGET_PACKAGE_LOG% 
echo %TIME% >> %NUGET_PACKAGE_LOG%

if exist "%DEST%" (
	rmdir /s /q "%DEST%"
)
mkdir "%DEST%"

echo Copying GettingStartedV4 files... >> %NUGET_PACKAGE_LOG%

:: \
robocopy %SRC_GETTING_STARTED_V4% %DEST% GettingStartedV4.nuspec readme.txt /LOG+:%NUGET_PACKAGE_LOG%
if ERRORLEVEL 8 (
	goto :Error
)

:: \Content
robocopy %SRC_GETTING_STARTED_V4% %DEST_CONTENT% Web.config.transform Global.asax Global.asax.cs /LOG+:%NUGET_PACKAGE_LOG%
if ERRORLEVEL 8 (
	goto :Error
)

:: \Content\App_Start
robocopy %SRC_GETTING_STARTED_V4%\App_Start %DEST_CONTENT%\App_Start /S /LOG+:%NUGET_PACKAGE_LOG%
if ERRORLEVEL 8 (
	goto :Error
)

:: \Content\Controllers
robocopy %SRC_GETTING_STARTED_V4%\Controllers %DEST_CONTENT%\Controllers /S /LOG+:%NUGET_PACKAGE_LOG%
if ERRORLEVEL 8 (
	goto :Error
)

:: \Content\Views
robocopy %SRC_GETTING_STARTED_V4%\Views %DEST_CONTENT%\Views /S /LOG+:%NUGET_PACKAGE_LOG%
if ERRORLEVEL 8 (
	goto :Error
)

:: Create the package
set PKG_FILE=Forerunner_GettingStartedV4.%BUILD_NUMBER%.nupkg
echo Creating %PKG_FILE%... >> %NUGET_PACKAGE_LOG%
pushd %DEST%
%NUGET_TOOL% pack GettingStartedV4.nuspec -Version %BUILD_NUMBER% >> %NUGET_PACKAGE_LOG%
if ERRORLEVEL 1 (
  popd
	goto :Error
)
popd

:: Copy the package to the release bin folder
robocopy %DEST% %BUILD_RELEASE%\bin\Release %PKG_FILE% /LOG+:%NUGET_PACKAGE_LOG% >> NUL
if ERRORLEVEL 8 (
	goto :Error
)

echo createGettingStartedV4 SUCCEEDED. >> %NUGET_PACKAGE_LOG%
echo createGettingStartedV4 SUCCEEDED. >> %BUILD_LOG%
exit /b 0

:Error
echo createGettingStartedV4 FAILED. >> %NUGET_PACKAGE_LOG%
echo createGettingStartedV4 FAILED. >> %BUILD_LOG%
exit /b 1
