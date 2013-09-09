@echo off
rem This is only for SDK 1.4 and not a best practice to detect DevFabric.
if ("%WA_CONTAINER_SID%") == ("") goto Exit

echo Installing Web-Mgmt-Service
start /w pkgmgr /iu:"IIS-ManagementService" /norestart /quiet /l:"%~dp0PackageManager"
echo Configuring Web-Mgmt-Service
sc config wmsvc start= auto 
net stop wmsvc
echo Setting the registry key
%windir%\regedit /s EnableRemoteManagement.reg

echo Installing WebDeploy
"%~dp0Webpicmd.exe" /install /products:WDeployNoSMO /AcceptEula /Log:"%~dp0WebPI.log"

echo Configuring WebDeploy
sc config msdepsvc start= auto 
net stop msdepsvc

echo Starting required services
net start wmsvc
net start msdepsvc
exit /b 0

:Exit
echo Running on DevFabric. No action taken.
