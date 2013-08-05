:: copy necessary install files to build folder
@echo off
set Source="D:\Sql Report\Forerunner\RS\Reporting\ReportManager\ReportManagerMVC\ReportManager"
set Destination="D:\CopyTest"

robocopy %Source% %Destination% /S /XD %Source%\App_Data %Source%\App_Start %Source%\aspnet_client %Source%\Controllers %Source%\obj %Source%\Properties %Source%\Util %Source%\Forerunner\Common\js Controllers %Source%\Forerunner\ReportExplorer\js %Source%\Forerunner\ReportViewer\js /XF Forerunner-all.js *.cd *.bundle *.map *.orig *.gitignore *.cs *.csproj *.user *.Debug.config *.Release.config *.pdb *.xml *.exe.config *.cmd

pause
echo Press any key to exit...