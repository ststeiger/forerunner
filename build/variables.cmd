@echo off
REM
REM Set Project specific variables here.
REM
set PATH=%PATH%;%windir%\Microsoft.Net\Framework\v4.0.30319
set EnableNuGetPackageRestore=true
set GITHUBSSH=git@github.com:forerunnersw/Forerunner.git
set PROJECT_NAME=Forerunner
set HOME=%HOMEDRIVE%%HOMEPATH%
call %~dp0%COMPUTERNAME%.cmd
