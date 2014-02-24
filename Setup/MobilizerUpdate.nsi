; Script generated by the HM NIS Edit Script Wizard.

; HM NIS Edit Wizard helper defines
!define PRODUCT_NAME "Forerunner Mobilizer for SQL Server Reporting Services"
!define PRODUCT_VERSION "1.0 Update"
!define PRODUCT_PUBLISHER "Forerunner Software"
!define PRODUCT_UNINST_ROOT_KEY "HKLM"
!define COPYRIGHT "Copyright � Forerunner Software 2014"
!define DESCRIPTION "Forerunner Mobilizer for SQL Server Reporting Services"
!define VI_PRODUCT_NAME "Mobilizer 1.0 Update"
!define COMPANY_NAME "Forerunner Software"
!define /file BUILD_VERSION ..\build.txt

; LOCAL ADDRESS DEFINE
!define LOCALROOT ".\build"
!define RESOURCEROOT ".\Resource"

; MUI2
!include MUI2.nsh
; Word Function
!include WordFunc.nsh

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
!define MUI_PAGE_CUSTOMFUNCTION_LEAVE "CheckSelectedDir"
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
  ;Detect whether LogFiles folder exist or not.
  Push "$INSTDIR"
  Call GetParent
  Pop $R0
  IfFileExists $R0\LogFiles\*.* 0 +2
  Goto +2
  CreateDirectory "$R0\LogFiles"

  SetOutPath "$INSTDIR\bin"
  SetOverwrite ifnewer
  File "${LOCALROOT}\bin\Forerunner.ReportManager.dll"
  File "${LOCALROOT}\bin\Forerunner.SQLReporting.dll"
  File "${LOCALROOT}\bin\Forerunner.Json.dll"
  File "${LOCALROOT}\bin\Forerunner.Thumbnail.exe"

  SetOutPath "$INSTDIR\sdk"
  File "${LOCALROOT}\sdk\ReportManagerController.cs"
  File "${LOCALROOT}\sdk\ReportViewerController.cs"
  File "${LOCALROOT}\sdk\CustomAPIFilters.cs"
  File "${LOCALROOT}\sdk\readme.docx"

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
  SetOutPath "$INSTDIR\Forerunner\Lib\jQuery\js"
  File "${LOCALROOT}\Forerunner\Lib\jQuery\js\jquery-ui-1.10.3.forerunner.js"
  SetOutPath "$INSTDIR\Forerunner\Lib\jQuery\css"
  File "${LOCALROOT}\Forerunner\Lib\jQuery\css\jquery-ui-1.10.3.forerunner.css"
  SetOutPath "$INSTDIR\Forerunner\Lib\Misc\js"
  File "${LOCALROOT}\Forerunner\Lib\Misc\js\scroll-startstop.events.jquery.js"
  File "${LOCALROOT}\Forerunner\Lib\Misc\js\jquery.hammer.min.js"
  File "${LOCALROOT}\Forerunner\Lib\Misc\js\jquery.lazyload.min.js"
  File "${LOCALROOT}\Forerunner\Lib\Misc\js\Placeholders.min.js"
  File "${LOCALROOT}\Forerunner\Lib\Misc\js\json2.js"
  File "${LOCALROOT}\Forerunner\Lib\Misc\js\css3-mediaqueries.js"
  File "${LOCALROOT}\Forerunner\Lib\Misc\js\moment.min.js"
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
  File "${LOCALROOT}\Forerunner\ReportViewer\css\ManageParamSets.css"
  File "${LOCALROOT}\Forerunner\ReportViewer\css\ReportParameter.css"
  File "${LOCALROOT}\Forerunner\ReportViewer\css\ReportDocumentMap.css"
  File "${LOCALROOT}\Forerunner\ReportViewer\css\PageNav.css"
  SetOutPath "$INSTDIR\Forerunner\ReportViewer\Images"
  File "${LOCALROOT}\Forerunner\ReportViewer\Images\page-loading.gif"

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
  
  SetOutPath "$INSTDIR\Scripts\App"
  File "${LOCALROOT}\Scripts\App\router.js"
  SetOutPath "$INSTDIR\Views\Home"
  File "${LOCALROOT}\Views\Home\Index.cshtml"
  SetOutPath "$INSTDIR\Views\Login"
  File "${LOCALROOT}\Views\Login\Login.cshtml"
  SetOutPath "$INSTDIR\Controllers"
  File "${LOCALROOT}\Controllers\LoginController.cs"
  SetOutPath "$INSTDIR\Views\Shared"
  File "${LOCALROOT}\Views\Shared\Error.cshtml"
  File "${LOCALROOT}\Views\Shared\_RMLayout.cshtml"
  File "${LOCALROOT}\Views\Shared\_Layout.cshtml"
  SetOutPath "$INSTDIR\Views"
  File "${LOCALROOT}\Views\_ViewStart.cshtml"
  SetOutPath "$INSTDIR\SSRSExtension"
  File "${LOCALROOT}\SSRSExtension\Forerunner.RenderingExtensions.dll"
  File "${LOCALROOT}\SSRSExtension\Forerunner.Json.dll"
  File "${LOCALROOT}\bin\Forerunner.Thumbnail.exe"
  SetOutPath "$INSTDIR\Config"
  File "${LOCALROOT}\Config\MobilizerConfigTool.exe"
  File "${LOCALROOT}\Config\ValidateLicense.exe"
  File "${LOCALROOT}\Config\Mobilizer 1 License.rtf"
  SetOutPath "$INSTDIR\Custom"
  File "${LOCALROOT}\Custom\Explorer.css"
  File "${LOCALROOT}\Custom\Explorer_Examples.css"
  File "${LOCALROOT}\Custom\ExplorerSettings.txt"
  File "${LOCALROOT}\Custom\ExplorerSettings_Examples.txt"
  SetOutPath "$INSTDIR\Config"

  SetOutPath "$INSTDIR"
  File "${RESOURCEROOT}\InstallInstructions.rtf"

SectionEnd

Function .onInit
   System::Call 'kernel32::CreateMutexA(i 0, i 0, t "myMutex") i .r1 ?e'
   Pop $R0
 
   StrCmp $R0 0 +3
   MessageBox MB_OK|MB_ICONEXCLAMATION "Installer is already running."
   Abort

   Call IsMobilizerInstalled
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

Function IsMobilizerInstalled
	Push $0
	
	ReadRegStr $0 HKLM "Software\Microsoft\Windows\CurrentVersion\App Paths\Forerunner\MobilizerV1" ""
	StrCmp $0 "" 0 +3
	MessageBox MB_OK "Mobilizer is not found, please install Mobilizer first then do update!"
	Abort
	;Verify it is old version or new version, if it's new version $1 will be 1:not found
	${WordReplace} "$0" "\ForerunnerMobilizer" "" "E-1" $1
	
	StrCmp $1 1 0 +3
           StrCpy $INSTDIR $0 ; ForerunnerMobilizer not found - new build
           goto +2
           StrCpy $INSTDIR $1 ; old build
	
	Pop $0
FunctionEnd

Function IsDotNETInstalled
	Push $0
	
    ReadRegDWORD $0 HKEY_LOCAL_MACHINE "Software\Microsoft\NET Framework Setup\NDP\v3.5" "Install"
    StrCmp $0 "1" 0 noNotNET35

    ;detect .net framework 4.5
    ReadRegDWORD $0 HKLM "SOFTWARE\Microsoft\NET Framework Setup\NDP\v4\Full" "Install"
    ;firstly detect v4\Full install=1
    StrCmp $0 "1" +1 noNotNET45

    ;detect .net framework 4.5
    ReadRegDWORD $0 HKLM "SOFTWARE\Microsoft\NET Framework Setup\NDP\v4\Full" "Release"
    ;secondly detect release node exist in v4\Full
    StrCmp $0 "" noNotNET45 Continue

    noNotNET35:
        MessageBox MB_OKCANCEL|MB_ICONSTOP "To work with this software, you will need .NET Framework 3.5 or above on your machine. Installtion will abort.$\n$\nIf you don't have it on your PC,click OK to download it from official website. click Cancel to abort the installation." IDOK Download35
        abort
    noNotNET45:
        MessageBox MB_YESNOCANCEL|MB_ICONQUESTION ".Net Framework 4.5 is not found on your computer. Mobilizer requires .Net Framework 4.5 to function. Do you want to continue? $\n$\nClick Yes to continue the installation without installing .Net Framework 4.5 first.$\n$\nClick No to take you to Microsoft to download .Net Framework 4.5 and install it before you re-run the Mobilizer setup.$\n$\nClick Cancel to exit." IDYES Continue IDNO Download45
        abort
    Download35:
        ExecShell open "http://www.microsoft.com/en-us/download/details.aspx?id=21"
        abort
    Download45:
        ExecShell open "http://www.microsoft.com/en-us/download/details.aspx?id=30653"
        abort
    Continue:
	
	Pop $0
FunctionEnd

Function GetParent
   Exch $R0
   Push $R1
   Push $R2
   Push $R3

   StrCpy $R1 0
   StrLen $R2 $R0

   loop:
     IntOp $R1 $R1 + 1
     IntCmp $R1 $R2 get 0 get
     StrCpy $R3 $R0 1 -$R1
     StrCmp $R3 "\" get
     Goto loop

   get:
     StrCpy $R0 $R0 -$R1

     Pop $R3
     Pop $R2
     Pop $R1
     Exch $R0
FunctionEnd

Function CheckSelectedDir
    IfFileExists $INSTDIR\bin\Forerunner.ReportManager.dll 0 +2
	goto +3
	MessageBox MB_OK "Path $INSTDIR is not correct"
	Abort
FunctionEnd
