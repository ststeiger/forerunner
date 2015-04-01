@echo off

:: Runs createForerunnerSDK actions.
::
:: The NuGet package will be created via the "convention based working directory"
:: instructions found here:
::     http://docs.nuget.org/Create/Creating-and-Publishing-a-Package#from-a-convention-based-working-directory

setlocal

set BUILD_RELEASE=%1
set BUILD_LOG=%2
set /p BUILD_NUMBER=<"%~dp0..\build.txt"
set NUGET_PACKAGE_LOG=%BUILD_RELEASE%\createForerunnerSDK.log

set NUGET_TOOL=%~dp0tools\nuget\nuget.exe

:: We need to remove the "..\" so that the "/XD" robocopy switch used below will work properly
call %~dp0getFullyQualifiedFilePath.cmd "%~dp0..\RS\Reporting\ReportManager\ReportManagerMVC\ReportManager" SRC_REPORT_MANAGER
call %~dp0getFullyQualifiedFilePath.cmd "%~dp0..\RS\Reporting\ReportManager\ReportManagerMVC\Forerunner.SDK.ConfigTool" SRC_FRCONFIG

set SRC_FORERUNNER="%SRC_REPORT_MANAGER%\Forerunner"
set SRC_SDK="%SRC_REPORT_MANAGER%\sdk"
set SRC_CUSTOM="%SRC_REPORT_MANAGER%\Custom"
set SRC_LIB="%SRC_REPORT_MANAGER%\bin"
set SRC_NUGET="%~dp0tools\nuget"
set SRC_THUMBNAIL="%~dp0..\RS\Reporting\ReportViewer\ReportViewer\Forerunner.Thumbnail\bin\Release"
set SRC_FRCONFIG_BIN=%SRC_FRCONFIG%\bin\Release

set DEST="%BUILD_RELEASE%_ForerunnerSDK"
set DEST_CONTENT="%DEST%\content"
set DEST_LIB="%DEST%\lib"
set DEST_TOOLS="%DEST%\tools"

echo Executing createForerunnerSDK... >> %NUGET_PACKAGE_LOG%
echo Executing createForerunnerSDK... >> %BUILD_LOG%
echo %DATE% >> %NUGET_PACKAGE_LOG% 
echo %TIME% >> %NUGET_PACKAGE_LOG%

if exist "%DEST%" (
	rmdir /s /q "%DEST%"
)
mkdir "%DEST%"

echo Copying forerunner sdk files... >> %NUGET_PACKAGE_LOG%

:: \ForerunnerSDK.nuspec
robocopy %SRC_NUGET% %DEST% ForerunnerSDK.nuspec /S /LOG+:%NUGET_PACKAGE_LOG%
if ERRORLEVEL 8 (
	goto :Error
)

:: \readme.txt
robocopy %SRC_SDK% %DEST% readme.txt /S /LOG+:%NUGET_PACKAGE_LOG%
if ERRORLEVEL 8 (
	goto :Error
)

:: Content\Forerunner
robocopy %SRC_FORERUNNER% %DEST_CONTENT%\Forerunner /S /LOG+:%NUGET_PACKAGE_LOG% /XF forerunner.js Forerunner-widgets.js *.bundle *.map /XD %SRC_FORERUNNER%\Common\js %SRC_FORERUNNER%\Dashboard\js  %SRC_FORERUNNER%\ReportExplorer\js  %SRC_FORERUNNER%\ReportViewer\js >> NUL
if ERRORLEVEL 8 (
	goto :Error
)

:: Content\sdk
robocopy %SRC_SDK% %DEST_CONTENT%\sdk /LOG+:%NUGET_PACKAGE_LOG% >> NUL
if ERRORLEVEL 8 (
	goto :Error
)

:: Content\Custom
robocopy %SRC_CUSTOM% %DEST_CONTENT%\Custom /LOG+:%NUGET_PACKAGE_LOG% >> NUL
if ERRORLEVEL 8 (
	goto :Error
)

:: Content\bin\Forerunner.Thumbnail.exe
robocopy %SRC_THUMBNAIL% %DEST_CONTENT%\bin Forerunner.Thumbnail.exe /LOG+:%NUGET_PACKAGE_LOG% >> NUL
if ERRORLEVEL 8 (
	goto :Error
)

:: Content/lib
robocopy %SRC_LIB% %DEST_LIB% Forerunner.Json.dll Forerunner.SQLReporting.dll PdfSharp.dll /LOG+:%NUGET_PACKAGE_LOG% >> NUL
if ERRORLEVEL 8 (
	goto :Error
)

:: tools
robocopy %SRC_FRCONFIG_BIN% %DEST_TOOLS% Forerunner.SDK.ConfigTool.dll UWS.Configuration.dll /LOG+:%NUGET_PACKAGE_LOG% >> NUL
if ERRORLEVEL 8 (
	goto :Error
)

robocopy %SRC_FRCONFIG% %DEST_TOOLS% Forerunner.SDK.ConfigTool.Help.xml /LOG+:%NUGET_PACKAGE_LOG% >> NUL
if ERRORLEVEL 8 (
	goto :Error
)

:: The cmdlet help editor named the help file incorrectly so I rename it here
rename %DEST_TOOLS%\Forerunner.SDK.ConfigTool.Help.xml Forerunner.SDK.ConfigTool-Help.xml

robocopy %SRC_NUGET% %DEST_TOOLS% init.ps1 install.ps1 uninstall.ps1 /LOG+:%NUGET_PACKAGE_LOG% >> NUL
if ERRORLEVEL 8 (
	goto :Error
)

:: Create the package
echo Creating ForerunnerSDK.%BUILD_NUMBER%.nupkg... >> %NUGET_PACKAGE_LOG%
pushd %DEST%
%NUGET_TOOL% pack %DEST%\ForerunnerSDK.nuspec -Version %BUILD_NUMBER% >> %NUGET_PACKAGE_LOG%
if ERRORLEVEL 1 (
  popd
	goto :Error
)
popd

:: Copy the package to the release bin folder
set PKG_FILE=ForerunnerSDK.%BUILD_NUMBER%.nupkg
robocopy %DEST% %BUILD_RELEASE%\bin\Release %PKG_FILE% /LOG+:%NUGET_PACKAGE_LOG% >> NUL
if ERRORLEVEL 8 (
	goto :Error
)

echo createForerunnerSDK SUCCEEDED. >> %NUGET_PACKAGE_LOG%
echo createForerunnerSDK SUCCEEDED. >> %BUILD_LOG%
exit /b 0

:Error
echo createForerunnerSDK FAILED. >> %NUGET_PACKAGE_LOG%
echo createForerunnerSDK FAILED. >> %BUILD_LOG%
exit /b 1
