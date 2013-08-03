@echo off
@echo buildDocs.cmd - %date% %time%, Start

setlocal

set _basepath=%~dp0
set _JSDocPath=%_basepath%..\..\..\..\..\..\build\tools\JSDoc3
set path=%path%;%_JSDocPath%

rd /s /q %_basepath%Docs 2> nul

call jsdoc -c %_basepath%conf.json

@echo buildDocs.cmd - %date% %time%, End
