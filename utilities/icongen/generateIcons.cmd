@echo off

setlocal

set basePath=%~dp0%

set cssFilename=icons24x24.css
set iconFilename=icons24x24.png

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
echo Copying file: %cssFilename%
copy %outPath%\%cssFilename% %copyCSSPath%\%cssFilename%
echo.

echo Copying file: %iconFilename%
copy %outPath%\%iconFilename% %copyImagesPath%\%iconFilename%
echo.
