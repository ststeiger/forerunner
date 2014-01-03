:: Create the version json file
@echo off
set Destination="%~dp0..\..\Setup\Build"

set versionFile=%Destination%\Forerunner\version.txt
set buildFile="%~dp0..\..\build.txt"

if exist %versionFile% del %versionFile%
copy %buildFile% %versionFile%
