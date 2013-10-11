@echo off
@echo buildDocs.cmd - %date% %time%, Start

setlocal

set _basepath=%~dp0
set _JSDocPath=%_basepath%..\..\..\..\..\..\build\tools\JSDoc3\
set _WebsitePath=%_basepath%..\..\..\..\..\..\ForerunnerSW\ForerunnerSW\
set path=%path%;%_JSDocPath%

rd /s /q %_basepath%Docs 2> nul
rd /s /q %_WebsitePath%Docs 2> nul

if /I "%1" EQU "-d" goto debug

call jsdoc -c %_basepath%conf.json

echo/
echo Copying files from:
echo %_basepath%Docs
echo to:
echo %_WebsitePath%Docs
echo/
xcopy %_basepath%Docs %_WebsitePath%Docs /S /I /R /Q
echo/
goto end

:debug
echo Starting the debug version of JSDoc...
call jsdoc --debug -c %_basepath%conf.json

:end
@echo buildDocs.cmd - %date% %time%, End
