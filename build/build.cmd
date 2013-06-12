@echo off
REM 
REM Syncs the build and increments the build version
REM
call %~dp0variables.cmd
if not exist %DROP_ROOT% (
	mkdir %DROP_ROOT%
)

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

set /A BUILD_REVISION+=1
set BUILD_RELEASE=%DROP_ROOT%\%BUILD_MAJOR%.%BUILD_MINOR%.%BUILD_BUILD%.%BUILD_REVISION%
mkdir %BUILD_RELEASE%
set BUILD_LOG=%BUILD_RELEASE%\build.log
echo %DATE% >> %BUILD_LOG%
echo %TIME% >> %BUILD_LOG%
echo %PROJECT_NAME% >> %BUILD_LOG%
echo Syncing Tree from [%GITHUBSSH%] >> %BUILD_LOG%
git pull %GITHUBSSH% >> %BUILD_LOG%
if ERRORLEVEL 1 (
	goto :Error
)

echo %BUILD_MAJOR%.%BUILD_MINOR%.%BUILD_BUILD%.%BUILD_REVISION% > %~dp0\..\build.txt
git commit %~dp0\..\build.txt -n -m "Official Build" >> %BUILD_LOG%
if ERRORLEVEL 1 (
	goto :Error
)

git push %GITHUBSSH% >> %BUILD_LOG%
if ERRORLEVEL 1 (
	goto :Error
)

pushd %~dp0\..
echo Cleaning Tree >> %BUILD_LOG%
msbuild dirs.proj /t:Clean /flp:LogFile=%BUILD_LOG%;Append=True /flp1:warningsonly;logfile=%BUILD_RELEASE%\build.wrn;Append=True /flp2:errorsonly;LogFile=%BUILD_RELEASE%\build.err
if ERRORLEVEL 1 (
	goto :Error
)
echo Building Tree >> %BUILD_LOG%
msbuild dirs.proj /flp:LogFile=%BUILD_LOG%;Append=True /flp1:warningsonly;logfile=%BUILD_RELEASE%\build.wrn;Append=True /flp2:errorsonly;LogFile=%BUILD_RELEASE%\build.err 
if ERRORLEVEL 1 (
	goto :Error
)

call %~dp0\SendMail.cmd "BUILD PASSED: %PROJECT_NAME% %BUILD_MAJOR%.%BUILD_MINOR%.%BUILD_BUILD%.%BUILD_REVISION%" "The build succeeded. Drop location: %BUILD_RELEASE%. See %BUILD_LOG% for more details."
exit /b 0


:Error
echo The Build Failed. >> %BUILD_LOG%
call %~dp0\SendMail.cmd "BUILD FAILED: %PROJECT_NAME% %BUILD_MAJOR%.%BUILD_MINOR%.%BUILD_BUILD%.%BUILD_REVISION%" "The build failed. See %BUILD_LOG% for more details." -Attachments %BUILD_RELEASE%\build.err
exit /b 1
