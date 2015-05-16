# This script will deploy all RDLE files as well as the associated javascript file
#


# First publis all the .rdle files
$rdleFolder = [System.IO.Path]::GetDirectoryName($myInvocation.MyCommand.Definition)
$projFolder = (Join-Path $rdleFolder '..\')
$rptProj = (Join-Path $projFolder 'ForerunnerSwBI.rptproj')
echo ""
echo "Publishing .rdle files..."
Publish-FRExtension -i $rdleFolder -p $rptProj

# Now publish the associated script file(s)
$m = 'C:\Program Files (x86)\Forerunner\MobilizerV3'
$ms = (Join-Path $m 'Scripts')
$fn = "ForerunnerSwBI.js"
$fs = (Join-Path $rdleFolder $fn)
echo ""
echo "copying file $fs"
Copy-Item $fs $ms

# Finally make sure the script is referenced
$cs = (Join-Path $m 'Views\Home\Index.cshtml')
$js = '~/Scripts/' + $fn
echo ""
echo "Updating the script reference '$js', in file: '$cs'"
Add-FRScriptRef -c $cs -j $js

echo ""
echo "Deploy-All.ps1 - complete"
