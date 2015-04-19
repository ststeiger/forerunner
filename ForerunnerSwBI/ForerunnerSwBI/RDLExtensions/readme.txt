Getting Started:

1) Install some tools
  - Add the following line to your PowerShell $profile file
      Import-Module 'C:\Program Files (x86)\Forerunner\MobilizerV3\Config\PublishFRExtension.dll'
  - Install some external Visual Studio Tools as follows:
      - Title: Publish All
      - Command: PowerShell.exe
      - Arguments: -command ". 'C:\Users\Jon\Documents\GitHub\Forerunner\ForerunnerSwBI\ForerunnerSwBI\RDLExtensions\Deploy-All.ps1'"
      - Check the "Use Output window" box

      - Title: Publish RDLE File
      - Command: PowerShell.exe
      - Arguments: -command "Publish-FRExtension -i '$(ItemPath)' -p 'C:\Users\Jon\Documents\GitHub\Forerunner\ForerunnerSwBI\ForerunnerSwBI\ForerunnerSwBI.rptproj'"
      - Check the "Use Output window" box
2) Deploy all reports
3) Run the external command "Publish All"
4) Add the <script> reference to the file ForerunnerSwBI.js into the file: "C:\Program Files (x86)\Forerunner\MobilizerV3\Views\Home\Index.cshtml" as follows:
  - <script type="text/javascript" src="~/Scripts/ForerunnerSwBI.js"></script>

Your done, enjoy!
