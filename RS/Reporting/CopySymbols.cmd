@echo off
REM
REM Copies PDB files from individual projects for archiving with build.
REM PDBs are not included in setup, so they are copied to a different place.
REM
set Source="%~dp0ReportManager\ReportManagerMVC\ReportManager"
set TARGET_ROOT=%1\Symbols
if [%2]==[] (
	set LOGFILE="%TEMP%\copy.log"
) else (
	set LOGFILE=%2
)

robocopy %Source% %TARGET_ROOT%\Release\Forerunner *.pdb /LOG+:%LOGFILE% /S /XD %Source%\App_Data %Source%\App_Start %Source%\aspnet_client %Source%\obj %Source%\Properties %Source%\Util %Source%\Forerunner\Common\js %Source%\Forerunner\ReportExplorer\js %Source%\Forerunner\ReportViewer\js
if ERRORLEVEL 8 (
	goto :Error
)

robocopy /LOG+:%LOGFILE% "%~dp0..\..\\RS\Reporting\ReportViewer\Rendering Extension\JSONRenderingExtension\bin\Release" %TARGET_ROOT%\Release\JSONRenderingExtension *.pdb 
if ERRORLEVEL 8 (
	goto :Error
)

robocopy /LOG+:%LOGFILE% "%~dp0..\..\\RS\Reporting\ReportManager\ReportManagerMVC\ReportMannagerConfigTool\bin\Release" %TARGET_ROOT%\Release\ReportMannagerConfigTool *.pdb
if ERRORLEVEL 8 (
	goto :Error
)

robocopy /LOG+:%LOGFILE% "%~dp0..\..\\utilities\SetupUtil\SetupUtil\bin\Release" %TARGET_ROOT%\Release\SetupUtil *.pdb
if ERRORLEVEL 8 (
	goto :Error
)

exit /b 0
:Error

echo CopySymbols FAILED. See %LOGFILE% for more info.
exit /b 1

