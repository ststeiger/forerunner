# Usage
#
# Import-Module MobilizerConfig.ps1
# Set-FRConfig -WebConfigPath $mobilizerWebConfig


$mobilizerConfig = [System.IO.Path]::GetDirectoryName($myInvocation.MyCommand.Definition)
$mobilizerInstalled = (Join-Path -Path $mobilizerConfig -ChildPath "..\")
$mobilizerWebConfig = (Join-Path -Path $mobilizerInstalled -ChildPath "web.config")
$mobilizerLoaded = Get-Module Forerunner.SDK.ConfigTool.dll

if (!$mobilizerLoaded)
{
        Import-Module (Join-Path $mobilizerConfig Forerunner.SDK.ConfigTool.dll)
}
