@echo off

setlocal

set basePath=%~dp0%

set icongenExe=%basePath%bin\Debug\icongen.exe
if exist %icongenExe% goto continue
echo Error - You must build the Debug version of icongen before running this command file
exit /b 2

:continue

set inputPath=%basePath%images
set configPath=%basePath%config.xml

set outPath=%basePath%output
set cssPath=%basePath%output

set copyCSSPath=%basePath%..\..\RS\Reporting\ReportManager\ReportManagerMVC\ReportManager\Forerunner\Common\css
set copyImagesPath=%basePath%..\..\RS\Reporting\ReportManager\ReportManagerMVC\ReportManager\Forerunner\Common\images

:: run icongen and test the result
%icongenExe% -o %outPath% -s %cssPath% -i %inputPath% -c %configPath%
if errorlevel 0 goto docopies
exit /b 2

:docopies
echo Copying css files
copy %outPath%\*.css %copyCSSPath%\
echo.

echo Copying composite png files
copy %outPath%\*.png %copyImagesPath%\
echo.
