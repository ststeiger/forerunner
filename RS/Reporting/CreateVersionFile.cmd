:: Create the version.json file
@echo off
set Destination="%~dp0..\..\Setup\Build"

set versionFile=%Destination%\Forerunner\version.json
set buildFile="%~dp0..\..\build.txt"

if exist %versionFile% del %versionFile%
set /P buildVersion=<%buildFile%
@echo {"buildVersion":^"%buildVersion%^"}>%versionFile%
