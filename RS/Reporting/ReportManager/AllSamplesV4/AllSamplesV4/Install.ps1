param($installPath, $toolsPath, $package, $project)

#Make sure the windows authentication is enabled in the project properties-window
$project.Properties.Item("WebApplication.WindowsAuthenticationEnabled").Value = $true
