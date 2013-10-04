:: copy necessary install files to build folder
@echo off
set Source="%~dp0ReportManager\ReportManagerMVC\ReportManager"
set Destination="%~dp0..\..\Setup\Build"

if [%2]==[] (
	set LOGFILE="%TEMP%\copy.log"
) else (
	set LOGFILE=%2
)

robocopy %Source% %Destination% /LOG+:%LOGFILE% /S /XD %Source%\App_Data %Source%\App_Start %Source%\aspnet_client %Source%\Controllers %Source%\obj %Source%\Properties %Source%\Util %Source%\Forerunner\Common\js %Source%\Forerunner\ReportExplorer\js %Source%\Forerunner\ReportViewer\js /XF *.cd *.bundle *.map *.orig *.gitignore *.csproj *.user *.Debug.config *.Release.config *.pdb *.xml *.exe.config *.cmd *.log
if ERRORLEVEL 8 (
	goto :Error
)

robocopy /LOG+:%LOGFILE% "%~dp0..\..\\RS\Reporting\ReportViewer\Rendering Extension\JSONRenderingExtension\bin\Release" %Destination%\SSRSExtension 
if ERRORLEVEL 8 (
	goto :Error
)

robocopy /LOG+:%LOGFILE% "%~dp0..\..\\RS\Reporting\ReportManager\ReportManagerMVC\ReportMannagerConfigTool\bin\Release" %Destination%\Config
if ERRORLEVEL 8 (
	goto :Error
)

robocopy /LOG+:%LOGFILE% "%~dp0..\..\\utilities\SetupUtil\SetupUtil\bin\Release" %Destination%\Register
if ERRORLEVEL 8 (
	goto :Error
)

exit /b 0
:Error

echo CopyFiles FAILED. See %LOGFILE% for more info.
exit /b 1