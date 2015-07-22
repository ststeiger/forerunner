param($installPath, $toolsPath, $package)

$env:frToolsPath = $toolsPath
$env:frConfigToolModule = "forerunner.sdk.configtool"
$env:frConfigToolDLL = $env:frConfigToolModule + ".dll"
$env:frConfigToolPath = join-path -path $env:frToolsPath -childpath $env:frConfigToolDLL

import-module $env:frConfigToolPath
