set DROP_ROOT=C:\Code\Release\%PROJECT_NAME%
if [%HOME%]==[] (
  set HOME=C:\Users\%USERNAME%
)

set SECRETS_ROOT=%HOME%\%PROJECT_NAME%
set NSIS_TOOL=%ProgramFiles(x86)%\NSIS\MAKENSIS.exe

