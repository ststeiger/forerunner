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

:: Some files will go into common
set commonCSSPath=%basePath%..\..\RS\Reporting\ReportManager\ReportManagerMVC\ReportManager\Forerunner\Common\css
set commonImagesPath=%basePath%..\..\RS\Reporting\ReportManager\ReportManagerMVC\ReportManager\Forerunner\Common\images

:: Other to report exploer
set explorerCSSPath=%basePath%..\..\RS\Reporting\ReportManager\ReportManagerMVC\ReportManager\Forerunner\ReportExplorer\css
set explorerImagesPath=%basePath%..\..\RS\Reporting\ReportManager\ReportManagerMVC\ReportManager\Forerunner\ReportExplorer\images

:: run icongen and test the result
%icongenExe% -o %outPath% -s %cssPath% -i %inputPath% -c %configPath%
if errorlevel 0 goto docopies
exit /b 2

:docopies
echo Copying common css files
copy %outPath%\icons24x24.css %commonCSSPath%\
copy %outPath%\icons25x31.css %commonCSSPath%\

echo Copying Report Explorer css files
copy %outPath%\icons128x128.css %explorerCSSPath%\
echo.

echo Copying common composite png files
copy %outPath%\icons24x24.png %commonImagesPath%\
copy %outPath%\icons25x31.png %commonImagesPath%\

echo Copying Report Explorer composite png files
copy %outPath%\icons128x128.png %explorerImagesPath%\
echo.
