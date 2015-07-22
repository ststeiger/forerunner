param($installPath, $toolsPath, $package)

$env:asToolsPath = $toolsPath
$env:asConfigToolModule = "Forerunner.AS.ConfigTool"
$env:asConfigToolDLL = $env:asConfigToolModule + ".dll"
$env:asConfigToolPath = join-path -path $env:asToolsPath -childpath $env:asConfigToolDLL

import-module $env:asConfigToolPath
