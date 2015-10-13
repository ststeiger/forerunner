@echo off

:: Runs createAllSamplesV4 actions.
::
:: The NuGet package will be created via the "convention based working directory"
:: instructions found here:
::     http://docs.nuget.org/Create/Creating-and-Publishing-a-Package#from-a-convention-based-working-directory

setlocal

set BUILD_RELEASE=%1
set BUILD_LOG=%2
set /p BUILD_NUMBER=<"%~dp0..\build.txt"
set NUGET_PACKAGE_LOG=%BUILD_RELEASE%\createAllSamplesV4.log

set NUGET_TOOL=%~dp0tools\nuget\nuget.exe

:: We need to remove the "..\" so that the "/XD" robocopy switch used below will work properly
call %~dp0getFullyQualifiedFilePath.cmd "%~dp0..\RS\Reporting\ReportManager\AllSamplesV4\AllSamplesV4" SRC_ALL_SAMPLES_V4
call %~dp0getFullyQualifiedFilePath.cmd "%~dp0..\RS\Reporting\ReportManager\AllSamplesV4\SetASConfig" SRC_ASCONFIG

set SRC_NUGET="%~dp0tools\nuget"

set DEST="%BUILD_RELEASE%_AllSamplesV4"
set DEST_CONTENT="%DEST%\content"
set DEST_TOOLS="%DEST%\tools"
set SRC_ASCONFIG_BIN=%SRC_ASCONFIG%\bin\Release

echo Executing createAllSamplesV4... >> %NUGET_PACKAGE_LOG%
echo Executing createAllSamplesV4... >> %BUILD_LOG%
echo %DATE% >> %NUGET_PACKAGE_LOG% 
echo %TIME% >> %NUGET_PACKAGE_LOG%

if exist "%DEST%" (
	rmdir /s /q "%DEST%"
)
mkdir "%DEST%"

echo Copying AllSamplesV4 files... >> %NUGET_PACKAGE_LOG%

:: \
robocopy %SRC_ALL_SAMPLES_V4% %DEST% AllSamplesV4.nuspec readme.txt /LOG+:%NUGET_PACKAGE_LOG%
if ERRORLEVEL 8 (
	goto :Error
)

:: \Content
robocopy %SRC_ALL_SAMPLES_V4% %DEST_CONTENT% Web.config.install.xdt /LOG+:%NUGET_PACKAGE_LOG%
if ERRORLEVEL 8 (
	goto :Error
)

:: \Content\Controllers
robocopy %SRC_ALL_SAMPLES_V4%\Controllers %DEST_CONTENT%\Controllers /S /LOG+:%NUGET_PACKAGE_LOG%
if ERRORLEVEL 8 (
	goto :Error
)

:: \Content\Areas
robocopy %SRC_ALL_SAMPLES_V4%\Areas %DEST_CONTENT%\Areas /S /LOG+:%NUGET_PACKAGE_LOG%
if ERRORLEVEL 8 (
	goto :Error
)

:: \Content\lib
robocopy %SRC_ALL_SAMPLES_V4%\lib %DEST_CONTENT%\lib /S /LOG+:%NUGET_PACKAGE_LOG%
if ERRORLEVEL 8 (
	goto :Error
)

:: \Content\Views\Home
robocopy %SRC_ALL_SAMPLES_V4%\Views\Home %DEST_CONTENT%\Views\Home /S /LOG+:%NUGET_PACKAGE_LOG%
if ERRORLEVEL 8 (
	goto :Error
)

:: \Content\Views\Shared
robocopy %SRC_ALL_SAMPLES_V4%\Views\Shared %DEST_CONTENT%\Views\Shared /S /LOG+:%NUGET_PACKAGE_LOG%
if ERRORLEVEL 8 (
	goto :Error
)

:: tools
robocopy %SRC_ASCONFIG_BIN% %DEST_TOOLS% Forerunner.AS.ConfigTool.dll Forerunner.AS.ConfigTool.pdb /LOG+:%NUGET_PACKAGE_LOG% >> NUL
if ERRORLEVEL 8 (
	goto :Error
)
robocopy %SRC_ALL_SAMPLES_V4% %DEST_TOOLS% Init.ps1 Install.ps1 /LOG+:%NUGET_PACKAGE_LOG% >> NUL
if ERRORLEVEL 8 (
	goto :Error
)

:: Create the package
set PKG_FILE=Forerunner_AllSamplesV4.%BUILD_NUMBER%.nupkg
echo Creating %PKG_FILE%... >> %NUGET_PACKAGE_LOG%
pushd %DEST%
%NUGET_TOOL% pack AllSamplesV4.nuspec -Version %BUILD_NUMBER% >> %NUGET_PACKAGE_LOG%
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

echo createAllSamplesV4 SUCCEEDED. >> %NUGET_PACKAGE_LOG%
echo createAllSamplesV4 SUCCEEDED. >> %BUILD_LOG%
exit /b 0

:Error
echo createAllSamplesV4 FAILED. >> %NUGET_PACKAGE_LOG%
echo createAllSamplesV4 FAILED. >> %BUILD_LOG%
exit /b 1
