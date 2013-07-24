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
echo USERNAME [%USERNAME%] >> %BUILD_LOG%
echo USERDOMAIN [%USERDOMAIN%] >> %BUILD_LOG%
echo USERPROFILE [%USERPROFILE%] >> %BUILD_LOG%
echo HOMEDRIVE [%HOMEDRIVE%] >> %BUILD_LOG%
echo HOMEPATH [%HOMEPATH%] >> %BUILD_LOG%
echo HOME [%HOME%] >> %BUILD_LOG%
echo SPSITE [%SPSITE%] >> %BUILD_LOG%
echo SPRELEASE [%SPRELEASE%] >> %BUILD_LOG%
set SPBUILD_RELEASE=%SPRELEASE%/%BUILD_MAJOR%.%BUILD_MINOR%.%BUILD_BUILD%.%BUILD_REVISION%
set SPBUILD_URL=%SPSITE%/%SPBUILD_RELEASE%
set UPLOADER=%~dp0tools\SharepointUploader\bin\Debug\SharepointUploader.exe
git pull %GITHUBSSH% >> %BUILD_LOG%
if ERRORLEVEL 1 (
	goto :Error
)

echo %BUILD_MAJOR%.%BUILD_MINOR%.%BUILD_BUILD%.%BUILD_REVISION% > %~dp0\..\build.txt
git commit %~dp0\..\build.txt -n -m "Official Build" >> %BUILD_LOG%
if ERRORLEVEL 1 (
	goto :Error
)

echo %PROJECT_NAME% Warnings... >> %BUILD_RELEASE%\build.wrn
echo %PROJECT_NAME% Code Analysis Warnings... >> %BUILD_RELEASE%\codeanalysis.wrn
echo %PROJECT_NAME% Code Analysis Errors... >> %BUILD_RELEASE%\codeanalysis.err

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

echo Running Code Analysis >> %BUILD_LOG%
msbuild dirs.proj /flp:LogFile=%BUILD_LOG%;Append=True /flp1:warningsonly;logfile=%BUILD_RELEASE%\codeanalysis.wrn;Append=True /flp2:errorsonly;LogFile=%BUILD_RELEASE%\codeanalysis.err /t:CodeAnalysisRebuild
if ERRORLEVEL 1 (
	goto :Error
)

%UPLOADER% -s %SPSITE% -c %~dp0\Credentials.xml %BUILD_RELEASE% "%SPBUILD_RELEASE%"
call %~dp0\SendMail.cmd "BUILD PASSED: %PROJECT_NAME% %BUILD_MAJOR%.%BUILD_MINOR%.%BUILD_BUILD%.%BUILD_REVISION%" "The build succeeded. Drop location: %SPBUILD_URL%. See build.log for more details." -Attachments "@("""%BUILD_RELEASE%\build.wrn""","""%BUILD_RELEASE%\codeanalysis.wrn""")"
exit /b 0


:Error
echo The Build Failed. >> %BUILD_LOG%
%UPLOADER% -s %SPSITE% -c %~dp0\Credentials.xml %BUILD_RELEASE% "%SPBUILD_RELEASE%"
call %~dp0\SendMail.cmd "BUILD FAILED: %PROJECT_NAME% %BUILD_MAJOR%.%BUILD_MINOR%.%BUILD_BUILD%.%BUILD_REVISION%" "The build failed. See %SPBUILD_URL%/build.log or %BUILD_LOG% for more details." -Attachments "@("""%BUILD_RELEASE%\build.err""","""%BUILD_RELEASE%\build.wrn""","""%BUILD_RELEASE%\codeanalysis.err""","""%BUILD_RELEASE%\codeanalysis.wrn""")"
exit /b 1
