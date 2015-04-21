# This script will deploy all RDLE files as well as the associated javascript file
#


# First publis all the .rdle files
$rdleFolder = [System.IO.Path]::GetDirectoryName($myInvocation.MyCommand.Definition)
$projFolder = (Join-Path -Path $rdleFolder -ChildPath '..\')
$rptProj = (Join-Path -Path $projFolder -ChildPath 'ForerunnerSwBI.rptproj')
echo ""
echo "Publishing .rdle files..."
Publish-FRExtension -i $rdleFolder -p $rptProj

# Now publish the associated script file(s)
$ms = 'C:\Program Files (x86)\Forerunner\MobilizerV3\Scripts'
$fs = (Join-Path -Path $rdleFolder -Child "ForerunnerSwBI.js")
echo ""
echo "copying file $fs"
Copy-Item $fs $ms

echo ""
echo "Deploy-All.ps1 - complete"
