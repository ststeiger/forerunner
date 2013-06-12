@echo off
setlocal enabledelayedexpansion

if %2==-File (
  goto :ElseBlock
  )
%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe -Command $sb=[scriptblock]::Create((gc %~dp0sendmail.ps1 ^| out-string)); ^& $sb -ConfigFile %~dp0smtp.config.xml -Subject """%~1""" -Body """%~2""" %3 %4 %5 %6 
goto :CommonEnd
:ElseBlock
%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe -Command $sb=[scriptblock]::Create((gc %~dp0sendmail.ps1 ^| out-string)); ^& $sb -ConfigFile %~dp0smtp.config.xml -Subject """%~1""" -BodyFile %3 %4 %5 %6

:CommonEnd
exit /b %ERRORLEVEL%
