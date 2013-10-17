@echo off
setlocal enabledelayedexpansion

%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe -Command $sb=[scriptblock]::Create((gc %~dp0sign.ps1 ^| out-string)); ^& $sb -SignToolPath """%SIGNTOOL_EXE%""" -KeyFilePath %CODESIGN_KEYDIR%\%CODESIGN_KEYFILE% -KeyFilePasswordPath %SECRETS_ROOT%\%CODESIGN_KEYFILE%.credentials.xml -TargetFile %1
exit /b %ERRORLEVEL%
