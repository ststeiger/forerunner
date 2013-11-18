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

set /A BUILD_BUILD+=1
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
echo SECRETS_ROOT [%SECRETS_ROOT%] >> %BUILD_LOG%
set SPBUILD_RELEASE=%SPRELEASE%/%BUILD_MAJOR%.%BUILD_MINOR%.%BUILD_BUILD%.%BUILD_REVISION%
set SPBUILD_URL=%SPSITE%%SPBUILD_RELEASE%
set UPLOADER=%~dp0tools\SharepointUploader\bin\Debug\SharepointUploader.exe
set ZIPPER=%~dp0tools\Zipper\bin\Debug\Zipper.exe
echo Cleaning Build Files... >> %BUILD_LOG%
echo Cleaning Setup Build Files... >> %BUILD_LOG%
rmdir /s /q %~dp0..\Setup\Build >> %BUILD_LOG%
echo Running git clean >> %BUILD_LOG%
git clean -f -x >> %BUILD_LOG%
echo Resetting Local Changes... >> %BUILD_LOG%
git reset --hard >> %BUILD_LOG%
echo Syncing Files From Remote... >> %BUILD_LOG%
git pull %GITHUBSSH% >> %BUILD_LOG%
if ERRORLEVEL 1 (
	goto :InitError
)

echo %BUILD_MAJOR%.%BUILD_MINOR%.%BUILD_BUILD%.%BUILD_REVISION%> %~dp0\..\build.txt
git commit %~dp0\..\build.txt -n -m "Official Build" >> %BUILD_LOG%
if ERRORLEVEL 1 (
	goto :InitError
)

echo %PROJECT_NAME% Warnings... >> %BUILD_RELEASE%\build.wrn
echo %PROJECT_NAME% Code Analysis Warnings... >> %BUILD_RELEASE%\codeanalysis.wrn
echo %PROJECT_NAME% Code Analysis Errors... >> %BUILD_RELEASE%\codeanalysis.err

git push %GITHUBSSH% master:%BRANCH% >> %BUILD_LOG%
if ERRORLEVEL 1 (
	goto :Error
)

pushd %~dp0\..
echo Cleaning Tree >> %BUILD_LOG%
msbuild dirs.proj /t:Clean /flp:LogFile=%BUILD_LOG%;Append=True /flp1:warningsonly;logfile=%BUILD_RELEASE%\build.wrn;Append=True /flp2:errorsonly;LogFile=%BUILD_RELEASE%\build.err /property:Configuration=Release
if ERRORLEVEL 1 (
	goto :Error
)
echo Building Tree >> %BUILD_LOG%
msbuild dirs.proj /flp:LogFile=%BUILD_LOG%;Append=True /flp1:warningsonly;logfile=%BUILD_RELEASE%\build.wrn;Append=True /flp2:errorsonly;LogFile=%BUILD_RELEASE%\build.err /property:Configuration=Release
if ERRORLEVEL 1 (
	goto :Error
)

echo Running Code Analysis >> %BUILD_LOG%
msbuild dirs.proj /flp:LogFile=%BUILD_LOG%;Append=True /flp1:warningsonly;logfile=%BUILD_RELEASE%\codeanalysis.wrn;Append=True /flp2:errorsonly;LogFile=%BUILD_RELEASE%\codeanalysis.err /t:CodeAnalysisRebuild /property:Configuration=Release
if ERRORLEVEL 1 (
	goto :Error
)

echo Running PostBuild >> %BUILD_LOG%
call %~dp0postbuild.cmd %BUILD_RELEASE% %BUILD_LOG%
if ERRORLEVEL 1 (
	goto :Error
)
echo Running PostBuild2 >> %BUILD_LOG%
call %~dp0postbuild2.cmd %BUILD_RELEASE% %BUILD_LOG%
if ERRORLEVEL 1 (
	goto :Error
)

mkdir %BUILD_RELEASE%_Upload
robocopy %BUILD_RELEASE% %BUILD_RELEASE%_Upload *.log *.err *.wrn /R:0
%ZIPPER% %BUILD_RELEASE%\bin\Release %BUILD_RELEASE%_Upload\Release.zip
robocopy %BUILD_RELEASE%\Setup %BUILD_RELEASE%\Setup_Upload *.exe /R:0
%ZIPPER% %BUILD_RELEASE%\Setup_Upload %BUILD_RELEASE%_Upload\ForerunnerMobilizer.zip
%UPLOADER% -s %SPSITE% -c %SECRETS_ROOT%\Credentials.xml %BUILD_RELEASE%_Upload "%SPBUILD_RELEASE%"
set MailSubject="BUILD PASSED: %PROJECT_NAME% %BUILD_MAJOR%.%BUILD_MINOR%.%BUILD_BUILD%.%BUILD_REVISION%"
call %~dp0\buildpassed.htm.template.cmd %BUILD_RELEASE%\buildpassed.htm %MailSubject% %PROJECT_NAME% %BUILD_MAJOR%.%BUILD_MINOR%.%BUILD_BUILD%.%BUILD_REVISION% "%SPBUILD_URL%"
call %~dp0\SendMail.cmd %MailSubject% -File %BUILD_RELEASE%\buildpassed.htm -BodyAsHtml -Attachments "@("""%BUILD_RELEASE%\build.wrn""","""%BUILD_RELEASE%\codeanalysis.wrn""")"
exit /b 0

:InitError
echo The Build Failed to initialize. >> %BUILD_LOG%
echo There was an issue with GIT. >> %BUILD_LOG%
call %~dp0\SendMail.cmd "BUILD INIT FAILED: %PROJECT_NAME% %BUILD_MAJOR%.%BUILD_MINOR%.%BUILD_BUILD%.%BUILD_REVISION%" "The build failed to initialize. See attached build.log or %BUILD_LOG% for more details." -Attachments "@("""%BUILD_RELEASE%\build.log""")"
exit /b 1

:Error
echo The Build Failed. >> %BUILD_LOG%
mkdir %BUILD_RELEASE%_Upload
robocopy %BUILD_RELEASE% %BUILD_RELEASE%_Upload *.log *.err *.wrn /R:0
%ZIPPER% %BUILD_RELEASE%\Symbols %BUILD_RELEASE%_Upload\Symbols.zip
%UPLOADER% -s %SPSITE% -c %~dp0\Credentials.xml %BUILD_RELEASE%_Upload "%SPBUILD_RELEASE%"
set MailSubject="BUILD FAILED: %PROJECT_NAME% %BUILD_MAJOR%.%BUILD_MINOR%.%BUILD_BUILD%.%BUILD_REVISION%"
call %~dp0\buildfailed.htm.template.cmd %BUILD_RELEASE%\buildfailed.htm %MailSubject% %PROJECT_NAME% %BUILD_MAJOR%.%BUILD_MINOR%.%BUILD_BUILD%.%BUILD_REVISION% "%SPBUILD_URL%"
call %~dp0\SendMail.cmd %MailSubject% -File %BUILD_RELEASE%\buildfailed.htm -BodyAsHtml -Attachments "@("""%BUILD_RELEASE%\build.err""","""%BUILD_RELEASE%\build.wrn""","""%BUILD_RELEASE%\codeanalysis.err""","""%BUILD_RELEASE%\codeanalysis.wrn""")"
exit /b 1
