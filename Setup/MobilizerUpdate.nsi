; Script generated by the HM NIS Edit Script Wizard.

; HM NIS Edit Wizard helper defines
!define PRODUCT_NAME "Forerunner Mobilizer for SQL Server Reporting Services"
!define PRODUCT_VERSION "1.0 Update"
!define PRODUCT_PUBLISHER "Forerunner Software"
!define PRODUCT_UNINST_ROOT_KEY "HKLM"
!define COPYRIGHT "Copyright � Forerunner Software 2013"
!define DESCRIPTION "Forerunner Mobilizer for SQL Server Reporting Services"
!define VI_PRODUCT_NAME "Mobilizer 1.0 Update"
!define COMPANY_NAME "Forerunner Software"
!define /file BUILD_VERSION ..\build.txt

; LOCAL ADDRESS DEFINE
!define LOCALROOT ".\build"
!define RESOURCEROOT ".\Resource"

; MUI2
!include MUI2.nsh

; MUI Settings
!define MUI_ABORTWARNING
!define MUI_ICON "${RESOURCEROOT}\Mobilizer_32.ico"
!define MUI_UNICON "${NSISDIR}\Contrib\Graphics\Icons\modern-uninstall.ico"


; Welcome page
!define MUI_WELCOMEPAGE_TITLE_3LINES
!define MUI_FINISHPAGE_TITLE_3LINES
!define MUI_WELCOMEFINISHPAGE_BITMAP "${RESOURCEROOT}\Mobilizer_Setup.bmp"
!insertmacro MUI_PAGE_WELCOME

; Directory page
!insertmacro MUI_PAGE_DIRECTORY
; Install files page
!insertmacro MUI_PAGE_INSTFILES
; Add registry key
;Page custom fun_ApplicationConfig_RunRegister

; Finish page
!define MUI_FINISHPAGE_RUN "$INSTDIR\Config\MobilizerConfigTool.exe"
!define MUI_FINISHPAGE_RUN_TEXT "Run Mobilizer Config Tool"
!insertmacro MUI_PAGE_FINISH

; Language files
!insertmacro MUI_LANGUAGE "English"
; Uninstaller pages
!insertmacro MUI_UNPAGE_INSTFILES
; MUI end ------

RequestExecutionLevel admin

!ifdef DESCRIPTION
    VIAddVersionKey FileDescription "${DESCRIPTION}"
!endif

!ifdef COPYRIGHT
    VIAddVersionKey LegalCopyright "${COPYRIGHT}"
!endif

!ifdef COMPANY_NAME
    VIAddVersionKey CompanyName "${COMPANY_NAME}"
!endif

!ifdef VI_PRODUCT_NAME
    VIAddVersionKey ProductName "${VI_PRODUCT_NAME}"
!endif

!ifdef BUILD_VERSION
    VIAddVersionKey FileVersion "${BUILD_VERSION}"
    VIAddVersionKey ProductVersion "${BUILD_VERSION}"
    VIProductVersion "${BUILD_VERSION}"
!endif

Name "${PRODUCT_NAME} ${PRODUCT_VERSION}"
OutFile "ForerunnerMobilizerUpdate.exe"
InstallDir "$PROGRAMFILES\Forerunner\MobilizerV1"
InstallDirRegKey HKLM "${PRODUCT_DIR_REGKEY}" ""
ShowInstDetails show

!macro VerifyUserIsAdmin
UserInfo::GetAccountType
pop $0
${If} $0 != "admin" ;Require admin rights on NT4+
        MessageBox MB_OK|MB_ICONSTOP "Administrator rights required!"
        setErrorLevel 740 ;ERROR_ELEVATION_REQUIRED
        quit
${EndIf}
!macroend

Section "ReportManager" SEC01
  SetOutPath "$INSTDIR\bin"
  SetOverwrite ifnewer
  File "${LOCALROOT}\bin\Forerunner.ReportManager.dll"
  File "${LOCALROOT}\bin\Forerunner.SQLReporting.dll"
  File "${LOCALROOT}\bin\Forerunner.Json.dll"
  SetOutPath "$INSTDIR\Forerunner\Common\css"
  File "${LOCALROOT}\Forerunner\Common\css\Login.css"
  File "${LOCALROOT}\Forerunner\Common\css\ReportManager.css"
  File "${LOCALROOT}\Forerunner\Common\css\ToolBase.css"
  File "${LOCALROOT}\Forerunner\Common\css\MessageBox.css"
  File "${LOCALROOT}\Forerunner\Common\css\Forerunner-core.css"
  File "${LOCALROOT}\Forerunner\Common\css\Forerunner-all.css"
  File "${LOCALROOT}\Forerunner\Common\css\icons24x24.css"
  File "${LOCALROOT}\Forerunner\Common\css\icons25x31.css"
  File "${LOCALROOT}\Forerunner\Common\css\DefaultAppTemplate.css"

  SetOutPath "$INSTDIR\Forerunner\Lib\Misc\js"
  File "${LOCALROOT}\Forerunner\Lib\Misc\js\scroll-startstop.events.jquery.js"
  File "${LOCALROOT}\Forerunner\Lib\Misc\js\jquery.hammer.min.js"
  File "${LOCALROOT}\Forerunner\Lib\Misc\js\jquery.lazyload.min.js"
  File "${LOCALROOT}\Forerunner\Lib\Misc\js\Placeholders.min.js"
  File "${LOCALROOT}\Forerunner\Lib\Misc\js\json2.js"
  SetOutPath "$INSTDIR\Forerunner\ReportExplorer\css"
  File "${LOCALROOT}\Forerunner\ReportExplorer\css\ReportExplorer.css"
  File "${LOCALROOT}\Forerunner\ReportExplorer\css\UserSettings.css"
  File "${LOCALROOT}\Forerunner\ReportExplorer\css\ReportExplorer-all.css"
  SetOutPath "$INSTDIR\Forerunner\ReportViewer\css"
  File "${LOCALROOT}\Forerunner\ReportViewer\css\ToolPane.css"
  File "${LOCALROOT}\Forerunner\ReportViewer\css\Toolbar.css"
  File "${LOCALROOT}\Forerunner\ReportViewer\css\ReportViewerEZ.css"
  File "${LOCALROOT}\Forerunner\ReportViewer\css\ReportViewer-all.css"
  File "${LOCALROOT}\Forerunner\ReportViewer\css\ReportViewer.css"
  File "${LOCALROOT}\Forerunner\ReportViewer\css\ReportRender.css"
  File "${LOCALROOT}\Forerunner\ReportViewer\css\ReportPrint.css"
  File "${LOCALROOT}\Forerunner\ReportViewer\css\ReportParameter.css"
  File "${LOCALROOT}\Forerunner\ReportViewer\css\ReportDocumentMap.css"
  File "${LOCALROOT}\Forerunner\ReportViewer\css\PageNav.css"

  SetOutPath "$INSTDIR\Forerunner\ReportViewer\Loc"
  File "${LOCALROOT}\Forerunner\ReportViewer\Loc\ReportViewer-zh-cn.txt"
  File "${LOCALROOT}\Forerunner\ReportViewer\Loc\ReportViewer-zh-hk.txt"
  File "${LOCALROOT}\Forerunner\ReportViewer\Loc\ReportViewer-zh-tw.txt"
  File "${LOCALROOT}\Forerunner\ReportViewer\Loc\ReportViewer-zh.txt"
  File "${LOCALROOT}\Forerunner\ReportViewer\Loc\ReportViewer-en-us.txt"
  File "${LOCALROOT}\Forerunner\ReportViewer\Loc\ReportViewer-en.txt"  
  File "${LOCALROOT}\Forerunner\ReportViewer\Loc\ReportViewer-de.txt"
  File "${LOCALROOT}\Forerunner\ReportViewer\Loc\ReportViewer-es.txt"
  File "${LOCALROOT}\Forerunner\ReportViewer\Loc\ReportViewer-fr.txt"
  File "${LOCALROOT}\Forerunner\ReportViewer\Loc\ReportViewer-ga.txt"
  File "${LOCALROOT}\Forerunner\ReportViewer\Loc\ReportViewer-is.txt"
  File "${LOCALROOT}\Forerunner\ReportViewer\Loc\ReportViewer-it.txt"
  File "${LOCALROOT}\Forerunner\ReportViewer\Loc\ReportViewer-ja.txt"
  File "${LOCALROOT}\Forerunner\ReportViewer\Loc\ReportViewer-pt.txt"
  File "${LOCALROOT}\Forerunner\ReportViewer\Loc\ReportViewer-ro.txt"
  File "${LOCALROOT}\Forerunner\ReportViewer\Loc\ReportViewer-ru.txt"
  File "${LOCALROOT}\Forerunner\ReportViewer\Loc\ReportViewer-sv.txt"
  
  
  SetOutPath "$INSTDIR\Forerunner\Bundles"
  File "${LOCALROOT}\Forerunner\Bundles\forerunner.min.js"
  File "${LOCALROOT}\Forerunner\Bundles\forerunner-tools.js"
  File "${LOCALROOT}\Forerunner\Bundles\forerunner-tools.min.js"
  File "${LOCALROOT}\Forerunner\Bundles\forerunner-widgets.min.js"
  
  SetOutPath "$INSTDIR\Forerunner\Controllers"
  File "${LOCALROOT}\Forerunner\Controllers\ReportManagerController.cs"
  File "${LOCALROOT}\Forerunner\Controllers\ReportViewerController.cs"
  
  SetOutPath "$INSTDIR\Scripts\App"
  File "${LOCALROOT}\Scripts\App\router.js"
  SetOutPath "$INSTDIR\Views\Home"
  File "${LOCALROOT}\Views\Home\Index.cshtml"
  SetOutPath "$INSTDIR\Views\Login"
  File "${LOCALROOT}\Views\Login\Login.cshtml"
  SetOutPath "$INSTDIR\Views\Shared"
  File "${LOCALROOT}\Views\Shared\Error.cshtml"
  File "${LOCALROOT}\Views\Shared\_RMLayout.cshtml"
  File "${LOCALROOT}\Views\Shared\_Layout.cshtml"
  SetOutPath "$INSTDIR\Views"
  File "${LOCALROOT}\Views\_ViewStart.cshtml"
  SetOutPath "$INSTDIR\SSRSExtension"
  File "${LOCALROOT}\SSRSExtension\Forerunner.RenderingExtensions.dll"
  File "${LOCALROOT}\SSRSExtension\Forerunner.Json.dll"
  SetOutPath "$INSTDIR\Config"
  File "${LOCALROOT}\Config\MobilizerConfigTool.exe"
  File "${LOCALROOT}\Config\Mobilizer 1 License.rtf"
  SetOutPath "$INSTDIR\Config"

SectionEnd


Function .onInit
  ;Verify admin right before install
  !insertmacro VerifyUserIsAdmin
  ;Verify .net framework 4 is installed.
  Call IsDotNETInstalled
FunctionEnd

Function un.onUninstSuccess
  HideWindow
  MessageBox MB_ICONINFORMATION|MB_OK "$(^Name) was successfully removed from your computer."
FunctionEnd

Function un.onInit
  ;Verify admin right before install
  !insertmacro VerifyUserIsAdmin
  
  MessageBox MB_ICONQUESTION|MB_YESNO|MB_DEFBUTTON2 "Are you sure you want to completely remove $(^Name) and all of its components?" IDYES +2
  Abort
FunctionEnd

Function IsDotNETInstalled
    ReadRegDWORD $0 HKEY_LOCAL_MACHINE "Software\Microsoft\NET Framework Setup\NDP\v3.5" "Install"
    StrCmp $0 "1" 0 noNotNET35

    ;detect .net framework 4.5
    ReadRegDWORD $0 HKLM "SOFTWARE\Microsoft\NET Framework Setup\NDP\v4\Full" "Release"	
    StrCmp $0 "378389" Continue noNotNET45

    noNotNET35:
        MessageBox MB_OKCANCEL|MB_ICONSTOP "To work with this software, you will need .NET Framework 3.5 or above on your machine. Installtion will abort.$\n$\nIf you don't have it on your PC,click OK to download it from official website. click Cancel to abort the installation." IDOK Download
        abort
    noNotNET45:
        MessageBox MB_YESNOCANCEL|MB_ICONQUESTION ".Net Framework 4.5 is not found on your computer. Mobilizer requires .Net Framework 4.5 to function. Do you want to continue? $\n$\nClick Yes to continue the installation without installing .Net Framework 4.5 first.$\n$\nClick No to take you to Microsoft to download .Net Framework 4.5 and install it before you re-run the Mobilizer setup.$\n$\nClick Cancel to exit." IDYES Continue IDNO Download
        abort
    Download:
        ExecShell open "http://www.microsoft.com/en-us/download/details.aspx?id=30653"
        abort
    Continue:
FunctionEnd

