:: copy necessary install files to build folder
@echo off
set Source=".\Reporting\ReportManager\ReportManagerMVC\ReportManager"
set Destination="..\..\\Setup\Build"

rmdir /s /q %Destination%

robocopy ..\Reporting\ReportManager\ReportManagerMVC\ReportManager %Destination% /S /XD %Source%\App_Data %Source%\App_Start %Source%\aspnet_client %Source%\Controllers %Source%\obj %Source%\Properties %Source%\Util %Source%\Forerunner\Common\js Controllers %Source%\Forerunner\ReportExplorer\js %Source%\Forerunner\ReportViewer\js /XF Forerunner-all.js *.cd *.bundle *.map *.orig *.gitignore *.cs *.csproj *.user *.Debug.config *.Release.config *.pdb *.xml *.exe.config *.cmd
robocopy "..\..\\RS\Reporting\ReportViewer\Rendering Extension\JSONRenderingExtension\bin\Release" %Destination%\SSRSExtension 
robocopy "..\..\\RS\Reporting\ReportManager\ReportManagerMVC\ReportMannagerConfigTool\bin\Release" %Destination%
robocopy "..\..\\utilities\SetupUtil\SetupUtil\bin\Release" %Destination%\Register

pause
echo Press any key to exit...