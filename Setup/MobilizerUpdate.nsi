; Script generated by the HM NIS Edit Script Wizard.

; HM NIS Edit Wizard helper defines
!define PRODUCT_NAME "Forerunner Mobilizer for SQL Server Reporting Services"
!define PRODUCT_VERSION "2.0 Update"
!define PRODUCT_PUBLISHER "Forerunner Software"
!define PRODUCT_DIR_REGKEY "Software\Microsoft\Windows\CurrentVersion\App Paths\Forerunner\MobilizerV2"
!define PRODUCT_UNINST_KEY "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCT_NAME}"
!define PRODUCT_UNINST_ROOT_KEY "HKLM"
!define COPYRIGHT "Copyright � Forerunner Software 2014"
!define DESCRIPTION "Forerunner Mobilizer for SQL Server Reporting Services"
!define VI_PRODUCT_NAME "Mobilizer 2.0 Update"
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
InstallDir "$PROGRAMFILES\Forerunner\MobilizerV2\" ; add '\' at the end to prevent MobilizerV* append to the end of user custom select path
OutFile "ForerunnerMobilizerUpdate.exe"
InstallDirRegKey HKLM "${PRODUCT_DIR_REGKEY}" ""
ShowInstDetails show

!macro VerifyUserIsAdmin
UserInfo::GetAccountType
Pop $0
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
  AccessControl::GrantOnFile  "$R0\LogFiles" "(S-1-1-0)" "GenericWrite"

  SetOutPath "$INSTDIR\bin"
  SetOverwrite ifdiff
  File "${LOCALROOT}\bin\Forerunner.ReportManager.dll"
  File "${LOCALROOT}\bin\Forerunner.SQLReporting.dll"
  File "${LOCALROOT}\bin\Forerunner.Json.dll"
  File "${LOCALROOT}\bin\Forerunner.Thumbnail.exe"
  
  SetOutPath "$INSTDIR\sdk"
  File "${LOCALROOT}\sdk\ReportManagerController.cs"
  File "${LOCALROOT}\sdk\ReportViewerController.cs"
  File "${LOCALROOT}\sdk\CustomAPIFilters.cs"
  File "${LOCALROOT}\sdk\readme.docx"
  
  SetOutPath "$INSTDIR\Forerunner"
  File "${LOCALROOT}\Forerunner\version.txt"
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
  SetOutPath "$INSTDIR\Forerunner\Common\Images"
  File "${LOCALROOT}\Forerunner\Common\Images\icons24x24.png"
  File "${LOCALROOT}\Forerunner\Common\images\icons25x31.png"
  SetOutPath "$INSTDIR\Forerunner\Lib\jQuery\js"
  File "${LOCALROOT}\Forerunner\Lib\jQuery\js\jquery-ui-1.10.3.forerunner.js"
  File "${LOCALROOT}\Forerunner\Lib\jQuery\js\jquery-1.11.0.MIN.JS"
  File "${LOCALROOT}\Forerunner\Lib\jQuery\js\jquery-1.11.0.js"
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
  File "${LOCALROOT}\Forerunner\ReportExplorer\css\ManageSubscription.css"
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
  File "${LOCALROOT}\Forerunner\ReportViewer\css\DSCredential.css"
  SetOutPath "$INSTDIR\Forerunner\ReportViewer\Images"
  File "${LOCALROOT}\Forerunner\ReportViewer\Images\NavigationClose.png"
  File "${LOCALROOT}\Forerunner\ReportViewer\Images\page-loading.gif"
  File "${LOCALROOT}\Forerunner\ReportViewer\Images\ajax-loader1.gif"

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
  File "${LOCALROOT}\Config\Mobilizer License.rtf"
 

  SetOutPath "$INSTDIR\Custom"
  File "${LOCALROOT}\Custom\Explorer.css"
  File "${LOCALROOT}\Custom\Explorer_Examples.css"
  File "${LOCALROOT}\Custom\MobilizerSettings.txt"
  File "${LOCALROOT}\Custom\MobilizerSettings_Examples.txt"

  SetOutPath "$INSTDIR"
  File "${RESOURCEROOT}\InstallInstructions.rtf"


;This must be the last line of the config tool will not work after install
 SetOutPath "$INSTDIR\Config"
 
SectionEnd

Section -AdditionalIcons
  CreateDirectory "$SMPROGRAMS\ForerunnerMobilizerV2"
  CreateShortCut "$SMPROGRAMS\ForerunnerMobilizerV2\Uninstall.lnk" "$INSTDIR\uninst.exe"
  SetOutPath "$INSTDIR\Config"
  CreateShortCut "$SMPROGRAMS\ForerunnerMobilizerV2\MobilizerConfigTool.lnk" "$INSTDIR\Config\MobilizerConfigTool.exe"
SectionEnd

Section -Post
  WriteUninstaller "$INSTDIR\uninst.exe"
  ;Delete privious one
  DeleteRegKey ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}"
  DeleteRegKey HKLM "${PRODUCT_DIR_REGKEY}"

  WriteRegStr HKLM "${PRODUCT_DIR_REGKEY}" "" "$INSTDIR"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "DisplayName" "$(^Name)"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "UninstallString" "$INSTDIR\uninst.exe"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "DisplayIcon" "$INSTDIR\ForerunnerMobilizer"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "DisplayVersion" "${PRODUCT_VERSION}"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "Publisher" "${PRODUCT_PUBLISHER}"
SectionEnd

Function .onInit
   System::Call 'kernel32::CreateMutexA(i 0, i 0, t "myMutex") i .r1 ?e'
   Pop $R0
 
   StrCmp $R0 0 +3
   MessageBox MB_OK|MB_ICONEXCLAMATION "Installer is already running."
   Abort

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

;To call function in uninstall section function must prefixed with un. 
;so we have two GetParent methods here even they have same code.
Function un.GetParent
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
	IfFileExists $INSTDIR\bin\Forerunner.ReportManager.dll Installed NoInstalled
		Installed:
			Call VersionDetect
			Goto Continue
		NoInstalled:
			MessageBox MB_OK "Path $INSTDIR is not correct, mobilizer is not found on your selected folder."
			Abort
		Continue:
FunctionEnd

Function VersionDetect   
    Push $R0
	Push $R1
    
	Call GetVersion
	Pop $R0
	
	StrCmp $R0 "" VersionEmpty Compare
		
		VersionEmpty: ; no exist version build
			Goto Continue
		Compare:
			Push "$R0" ; installer build version number
			Push "${BUILD_VERSION}" ; setup build version number
			Call VersionCompare
			Pop $R1
			
			IntCmp $R1 1 is1 is0 is2
				is0: ; equal
					Goto done		
				is1: ; exist build number newer
					MessageBox MB_ICONSTOP "Forerunner Mobilizer ${BUILD_VERSION} Update can't apply to a higher build $R0, installer will quit"
					Quit
				is2: ; setup build number newer
					Goto done
				done:
			Goto Continue
		Continue:
	
	Pop $R1
	Pop $R0
FunctionEnd

Function GetVersion
    Push $0
	Push $1
	Push $2
	
	IfFileExists $INSTDIR\Forerunner\version.txt Exist Error	
	Exist:
		ClearErrors
		FileOpen $0 $INSTDIR\Forerunner\version.txt r
		IfErrors Error 0
		FileRead $0 $1
		StrCpy $2 $1 -2
		Goto Final
	Error:
		StrCpy $2 ""
		Goto Final
	Final:
		FileClose $0
	
	Exch
	Pop $1
	Exch
	Pop $0
	Exch $2
FunctionEnd

Function VersionCompare
	Exch $1 ; keep version 1
	Exch
	Exch $0 ; keep version 2
	Exch
	Push $2
	Push $3
	Push $4
	Push $5
	Push $6
	Push $7
 
	begin:
	StrCpy $2 -1
	IntOp $2 $2 + 1
	StrCpy $3 $0 1 $2
	StrCmp $3 '' +2
	StrCmp $3 '.' 0 -3 ; loop -> back
	StrCpy $4 $0 $2
	IntOp $2 $2 + 1
	StrCpy $0 $0 '' $2
 
	StrCpy $2 -1
	IntOp $2 $2 + 1
	StrCpy $3 $1 1 $2
	StrCmp $3 '' +2
	StrCmp $3 '.' 0 -3
	StrCpy $5 $1 $2
	IntOp $2 $2 + 1
	StrCpy $1 $1 '' $2
 
	StrCmp $4$5 '' equal
 
	StrCpy $6 -1
	IntOp $6 $6 + 1
	StrCpy $3 $4 1 $6
	StrCmp $3 '0' -2
	StrCmp $3 '' 0 +2
	StrCpy $4 0
 
	StrCpy $7 -1
	IntOp $7 $7 + 1
	StrCpy $3 $5 1 $7
	StrCmp $3 '0' -2
	StrCmp $3 '' 0 +2
	StrCpy $5 0
 
	StrCmp $4 0 0 +2
	StrCmp $5 0 begin newer2
	StrCmp $5 0 newer1
	IntCmp $6 $7 0 newer1 newer2
 
	StrCpy $4 '1$4'
	StrCpy $5 '1$5'
	IntCmp $4 $5 begin newer2 newer1
 
	equal:
	StrCpy $0 0
	goto end
	newer1:
	StrCpy $0 1
	goto end
	newer2:
	StrCpy $0 2
 
	end:
	Pop $7
	Pop $6
	Pop $5
	Pop $4
	Pop $3
	Pop $2
	Pop $1
	Exch $0
FunctionEnd

Section Uninstall
  Delete "$INSTDIR\config.ini"
  Delete "$INSTDIR\uninst.exe"
  Delete "$INSTDIR\ForerunnerSetup.ico"
  Delete "$INSTDIR\Global.asax"
  Delete "$INSTDIR\packages.config"
  Delete "$INSTDIR\Web.config"
  Delete "$INSTDIR\iPhoneMobilizer.png"
  Delete "$INSTDIR\TextWriterOutput.log"  
  Delete "$INSTDIR\Views\_ViewStart.cshtml"
  Delete "$INSTDIR\Views\Web.config"
  Delete "$INSTDIR\Views\Shared\_Layout.cshtml"
  Delete "$INSTDIR\Views\Shared\_RMLayout.cshtml"
  Delete "$INSTDIR\Views\Shared\Error.cshtml"
  Delete "$INSTDIR\Views\Home\Index.cshtml"
  Delete "$INSTDIR\Views\Login\Login.cshtml"
  Delete "$INSTDIR\Controllers\LoginController.cs"
  Delete "$INSTDIR\Scripts\App\router.js"
  Delete "$INSTDIR\Scripts\Util\backbone.js"
  Delete "$INSTDIR\Scripts\Util\_references.js"
  Delete "$INSTDIR\Scripts\Util\backbone_ui.js"
  Delete "$INSTDIR\Scripts\Util\collection_view.js"
  Delete "$INSTDIR\Scripts\Util\modernizr-2.5.3.js"
  Delete "$INSTDIR\Scripts\Util\laconic.js"
  Delete "$INSTDIR\Scripts\Util\underscore.js"

  Delete "$INSTDIR\sdk\ReportManagerController.cs"
  Delete "$INSTDIR\sdk\ReportViewerController.cs"
  Delete "$INSTDIR\sdk\CustomAPIFilters.cs"
  Delete "$INSTDIR\sdk\readme.docx"

  Delete "$INSTDIR\Forerunner\version.txt"
  Delete "$INSTDIR\Forerunner\Bundles\forerunner.min.js"
  Delete "$INSTDIR\Forerunner\Bundles\forerunner-tools.js"
  Delete "$INSTDIR\Forerunner\Bundles\forerunner-tools.min.js"
  Delete "$INSTDIR\Forerunner\Bundles\forerunner-widgets.min.js"
  Delete "$INSTDIR\Forerunner\ReportViewer\Loc\ReportViewer-en-us.txt"
  Delete "$INSTDIR\Forerunner\ReportViewer\Loc\ReportViewer-en.txt"
  Delete "$INSTDIR\Forerunner\ReportViewer\Loc\ReportViewer-zh-cn.txt"
  Delete "$INSTDIR\Forerunner\ReportViewer\Loc\ReportViewer-zh-hk.txt"
  Delete "$INSTDIR\Forerunner\ReportViewer\Loc\ReportViewer-zh-tw.txt"
  Delete "$INSTDIR\Forerunner\ReportViewer\Loc\ReportViewer-zh.txt"  
  Delete "$INSTDIR\Forerunner\ReportViewer\Loc\ReportViewer-de.txt"
  Delete "$INSTDIR\Forerunner\ReportViewer\Loc\ReportViewer-es.txt"
  Delete "$INSTDIR\Forerunner\ReportViewer\Loc\ReportViewer-fr.txt"
  Delete "$INSTDIR\Forerunner\ReportViewer\Loc\ReportViewer-ga.txt"
  Delete "$INSTDIR\Forerunner\ReportViewer\Loc\ReportViewer-is.txt"  
  Delete "$INSTDIR\Forerunner\ReportViewer\Loc\ReportViewer-it.txt"
  Delete "$INSTDIR\Forerunner\ReportViewer\Loc\ReportViewer-ja.txt"
  Delete "$INSTDIR\Forerunner\ReportViewer\Loc\ReportViewer-pt.txt"
  Delete "$INSTDIR\Forerunner\ReportViewer\Loc\ReportViewer-ro.txt"
  Delete "$INSTDIR\Forerunner\ReportViewer\Loc\ReportViewer-ru.txt"
  Delete "$INSTDIR\Forerunner\ReportViewer\Loc\ReportViewer-sv.txt"
  Delete "$INSTDIR\Forerunner\ReportViewer\Images\toolpane\sq_br_down_icon16.png"
  Delete "$INSTDIR\Forerunner\ReportViewer\Images\toolpane\sq_br_up_icon16.png"
  Delete "$INSTDIR\Forerunner\ReportViewer\Images\ajax-loader1.gif"
  Delete "$INSTDIR\Forerunner\ReportViewer\Images\page-loading.gif"
  Delete "$INSTDIR\Forerunner\ReportViewer\Images\DocMap_Collapse.png"
  Delete "$INSTDIR\Forerunner\ReportViewer\Images\DocMap_Expand.png"
  Delete "$INSTDIR\Forerunner\ReportViewer\Images\Drilldown_Collapse.gif"
  Delete "$INSTDIR\Forerunner\ReportViewer\Images\Drilldown_Expand.gif"
  Delete "$INSTDIR\Forerunner\ReportViewer\Images\EmptyIndent.gif"
  Delete "$INSTDIR\Forerunner\ReportViewer\Images\NotSorted.gif"
  Delete "$INSTDIR\Forerunner\ReportViewer\Images\OpenDropDown.png"
  Delete "$INSTDIR\Forerunner\ReportViewer\Images\Parameter_Collapse.png"
  Delete "$INSTDIR\Forerunner\ReportViewer\Images\Parameter_Expand.png"
  Delete "$INSTDIR\Forerunner\ReportViewer\Images\SortAccending.gif"
  Delete "$INSTDIR\Forerunner\ReportViewer\Images\search.png"
  Delete "$INSTDIR\Forerunner\ReportViewer\Images\SortDecending.gif"
  Delete "$INSTDIR\Forerunner\ReportViewer\Images\calendar.png"
  Delete "$INSTDIR\Forerunner\ReportViewer\Images\print_landscape.png"
  Delete "$INSTDIR\Forerunner\ReportViewer\Images\print_landscape_1.png"
  Delete "$INSTDIR\Forerunner\ReportViewer\Images\print_portrait.png"
  Delete "$INSTDIR\Forerunner\ReportViewer\Images\print_portrait_1.png"
  Delete "$INSTDIR\Forerunner\ReportViewer\Images\NavigationClose.png"
  Delete "$INSTDIR\Forerunner\ReportViewer\Images\toolbar\bkg_toolbar.jpg"
  Delete "$INSTDIR\Forerunner\ReportViewer\css\PageNav.css"
  Delete "$INSTDIR\Forerunner\ReportViewer\css\ReportDocumentMap.css"
  Delete "$INSTDIR\Forerunner\ReportViewer\css\ReportParameter.css"
  Delete "$INSTDIR\Forerunner\ReportViewer\css\ReportRender.css"
  Delete "$INSTDIR\Forerunner\ReportViewer\css\ReportViewer.css"
  Delete "$INSTDIR\Forerunner\ReportViewer\css\ReportPrint.css"
  Delete "$INSTDIR\Forerunner\ReportViewer\css\ManageParamSets.css"
  Delete "$INSTDIR\Forerunner\ReportViewer\css\ReportViewer-all.css"
  Delete "$INSTDIR\Forerunner\ReportViewer\css\ReportViewerEZ.css"
  Delete "$INSTDIR\Forerunner\ReportViewer\css\Toolbar.css"
  Delete "$INSTDIR\Forerunner\ReportViewer\css\ToolPane.css"
  Delete "$INSTDIR\Forerunner\ReportViewer\css\DSCredential.css"
  Delete "$INSTDIR\Forerunner\ReportExplorer\images\accent.png"
  Delete "$INSTDIR\Forerunner\ReportExplorer\images\bullet.png"
  Delete "$INSTDIR\Forerunner\ReportExplorer\images\Folder-icon.png"
  Delete "$INSTDIR\Forerunner\ReportExplorer\images\heroAccent.png"
  Delete "$INSTDIR\Forerunner\ReportExplorer\images\Report-icon.png"
  Delete "$INSTDIR\Forerunner\ReportExplorer\images\report_ear_selected.png"
  Delete "$INSTDIR\Forerunner\ReportExplorer\images\report_ear.png"
  Delete "$INSTDIR\Forerunner\ReportExplorer\images\report_bkg.png"
  Delete "$INSTDIR\Forerunner\ReportExplorer\images\folder.png"
  Delete "$INSTDIR\Forerunner\ReportExplorer\images\folder_selected.png"

  Delete "$INSTDIR\Forerunner\ReportExplorer\css\ReportExplorer-all.css"
  Delete "$INSTDIR\Forerunner\ReportExplorer\css\ReportExplorer.css"
  Delete "$INSTDIR\Forerunner\ReportExplorer\css\UserSettings.css"
  Delete "$INSTDIR\Forerunner\ReportExplorer\css\ManageSubscription.css"
  Delete "$INSTDIR\Forerunner\Lib\Misc\js\jquery.hammer.min.js"
  Delete "$INSTDIR\Forerunner\Lib\Misc\js\jquery.lazyload.min.js"
  Delete "$INSTDIR\Forerunner\Lib\Misc\js\scroll-startstop.events.jquery.js"
  Delete "$INSTDIR\Forerunner\Lib\Misc\js\Placeholders.min.js"
  Delete "$INSTDIR\Forerunner\Lib\Misc\js\json2.js"
  Delete "$INSTDIR\Forerunner\Lib\Misc\js\css3-mediaqueries.js"
  Delete "$INSTDIR\Forerunner\Lib\Misc\js\moment.min.js"
  Delete "$INSTDIR\Forerunner\Lib\jQuery\js\jquery.validate1.11.1.min.js"
  Delete "$INSTDIR\Forerunner\Lib\jQuery\js\jquery.watermark.min.js"
  Delete "$INSTDIR\Forerunner\Lib\jQuery\js\jquery-1.11.0.js"
  Delete "$INSTDIR\Forerunner\Lib\jQuery\js\jquery-1.11.0.min.js"
  Delete "$INSTDIR\Forerunner\Lib\jQuery\js\jquery-ui-1.10.3.forerunner.js"
  Delete "$INSTDIR\Forerunner\Lib\jQuery\css\jquery-ui-1.10.3.forerunner.css"
  Delete "$INSTDIR\Forerunner\Lib\jQuery\css\images\animated-overlay.gif"
  Delete "$INSTDIR\Forerunner\Lib\jQuery\css\images\ui-bg_flat_0_aaaaaa_40x100.png"
  Delete "$INSTDIR\Forerunner\Lib\jQuery\css\images\ui-bg_flat_75_416ca3_40x100.png"
  Delete "$INSTDIR\Forerunner\Lib\jQuery\css\images\ui-bg_flat_75_ffffff_40x100.png"
  Delete "$INSTDIR\Forerunner\Lib\jQuery\css\images\ui-bg_glass_55_fbf9ee_1x400.png"
  Delete "$INSTDIR\Forerunner\Lib\jQuery\css\images\ui-bg_glass_65_ffffff_1x400.png"
  Delete "$INSTDIR\Forerunner\Lib\jQuery\css\images\ui-bg_glass_75_dadada_1x400.png"
  Delete "$INSTDIR\Forerunner\Lib\jQuery\css\images\ui-bg_glass_75_e6e6e6_1x400.png"
  Delete "$INSTDIR\Forerunner\Lib\jQuery\css\images\ui-bg_glass_95_fef1ec_1x400.png"
  Delete "$INSTDIR\Forerunner\Lib\jQuery\css\images\ui-bg_highlight-soft_75_527db4_1x100.png"
  Delete "$INSTDIR\Forerunner\Lib\jQuery\css\images\ui-bg_highlight-soft_75_cccccc_1x100.png"
  Delete "$INSTDIR\Forerunner\Lib\jQuery\css\images\ui-icons_222222_256x240.png"
  Delete "$INSTDIR\Forerunner\Lib\jQuery\css\images\ui-icons_2e83ff_256x240.png"
  Delete "$INSTDIR\Forerunner\Lib\jQuery\css\images\ui-icons_454545_256x240.png"
  Delete "$INSTDIR\Forerunner\Lib\jQuery\css\images\ui-icons_888888_256x240.png"
  Delete "$INSTDIR\Forerunner\Lib\jQuery\css\images\ui-icons_cd0a0a_256x240.png"
  Delete "$INSTDIR\Forerunner\Common\css\Forerunner-all.css"
  Delete "$INSTDIR\Forerunner\Common\css\Forerunner-core.css"
  Delete "$INSTDIR\Forerunner\Common\css\ToolBase.css"
  Delete "$INSTDIR\Forerunner\Common\css\icons24x24.css"
  Delete "$INSTDIR\Forerunner\Common\css\icons25x31.css"
  Delete "$INSTDIR\Forerunner\Common\css\ReportManager.css"
  Delete "$INSTDIR\Forerunner\Common\css\Login.css"
  Delete "$INSTDIR\Forerunner\Common\css\MessageBox.css"
  Delete "$INSTDIR\Forerunner\Common\css\DefaultAppTemplate.css"
  Delete "$INSTDIR\Forerunner\Common\images\icons24x24.png"
  Delete "$INSTDIR\Forerunner\Common\images\icons25x31.png"
  Delete "$INSTDIR\Forerunner\Common\images\ForerunnerLogo.png"
  
  Delete "$INSTDIR\Custom\Explorer.css"
  Delete "$INSTDIR\Custom\Explorer_Examples.css"
  Delete "$INSTDIR\Custom\MobilizerSettings.txt"
  Delete "$INSTDIR\Custom\MobilizerSettings_Examples.txt"
  
  Delete "$INSTDIR\bin\Antlr3.Runtime.dll"
  Delete "$INSTDIR\bin\EntityFramework.dll"
  Delete "$INSTDIR\bin\Forerunner.Json.dll"
  Delete "$INSTDIR\bin\Forerunner.SQLReporting.dll"
  Delete "$INSTDIR\bin\Microsoft.Web.Infrastructure.dll"
  Delete "$INSTDIR\bin\Newtonsoft.Json.dll"
  Delete "$INSTDIR\bin\Forerunner.ReportManager.dll"
  Delete "$INSTDIR\bin\Forerunner.Thumbnail.exe"
  Delete "$INSTDIR\bin\System.Net.Http.dll"
  Delete "$INSTDIR\bin\System.Net.Http.Formatting.dll"
  Delete "$INSTDIR\bin\System.Net.Http.WebRequest.dll"
  Delete "$INSTDIR\bin\System.Web.Helpers.dll"
  Delete "$INSTDIR\bin\System.Web.Http.dll"
  Delete "$INSTDIR\bin\System.Web.Http.WebHost.dll"
  Delete "$INSTDIR\bin\System.Web.Mvc.dll"
  Delete "$INSTDIR\bin\System.Web.Optimization.dll"
  Delete "$INSTDIR\bin\System.Web.Providers.dll"
  Delete "$INSTDIR\bin\System.Web.Razor.dll"
  Delete "$INSTDIR\bin\System.Web.WebPages.Deployment.dll"
  Delete "$INSTDIR\bin\System.Web.WebPages.dll"
  Delete "$INSTDIR\bin\System.Web.WebPages.Razor.dll"
  Delete "$INSTDIR\bin\WebGrease.dll"
  Delete "$INSTDIR\SSRSExtension\Forerunner.RenderingExtensions.dll"
  Delete "$INSTDIR\SSRSExtension\Forerunner.Json.dll"
  Delete "$INSTDIR\SSRSExtension\Forerunner.Thumbnail.exe"
  Delete "$INSTDIR\Config\MobilizerConfigTool.exe"
  Delete "$INSTDIR\Config\ValidateLicense.exe"
  Delete "$INSTDIR\Config\MobilizerConfigTool.exe.config"
  Delete "$INSTDIR\Config\Manual Activation.rtf"
  Delete "$INSTDIR\Config\Mobilizer License.rtf"
  Delete "$INSTDIR\Config\Mobilizer 1 License.rtf"
  Delete "$INSTDIR\Config\UltiDev.WebServer.msi"
  Delete "$INSTDIR\InstallInstructions.rtf"

  Delete "$SMPROGRAMS\ForerunnerMobilizerV2\Uninstall.lnk"
  Delete "$SMPROGRAMS\ForerunnerMobilizerV2\MobilizerConfigTool.lnk"
  RMDir "$SMPROGRAMS\ForerunnerMobilizerV2"
  
  RMDir "$INSTDIR\Forerunner\ReportViewer\Loc"
  RMDir "$INSTDIR\Views\Shared"
  RMDir "$INSTDIR\Views\Home"
  RMDir "$INSTDIR\Views\Debug"
  RMDir "$INSTDIR\Views\Login"
  RMDir "$INSTDIR\Views"  
  RMDir "$INSTDIR\Scripts\Util"
  RMDir "$INSTDIR\Scripts\App"
  RMDir "$INSTDIR\Scripts"
  RMDir "$INSTDIR\Forerunner\ReportViewer\Loc"
  RMDir "$INSTDIR\Forerunner\ReportViewer\Images\toolpane"
  RMDir "$INSTDIR\Forerunner\ReportViewer\images\toolbar"
  RMDir "$INSTDIR\Forerunner\ReportViewer\Images"
  RMDir "$INSTDIR\Forerunner\ReportViewer\css"
  RMDir "$INSTDIR\Forerunner\ReportViewer"
  RMDir "$INSTDIR\Forerunner\ReportExplorer\images"
  RMDir "$INSTDIR\Forerunner\ReportExplorer\css"
  RMDir "$INSTDIR\Forerunner\ReportExplorer"
  RMDir "$INSTDIR\Forerunner\Lib\Misc\js"
  RMDir "$INSTDIR\Forerunner\Lib\jQuery\js"
  RMDir "$INSTDIR\Forerunner\Lib\jQuery\css\images"
  RMDir "$INSTDIR\Forerunner\Lib\jQuery\css"
  RMDir "$INSTDIR\Forerunner\Lib\jQuery"
  RMDir "$INSTDIR\Forerunner\Lib\Misc"
  RMDir "$INSTDIR\Forerunner\Lib"
  RMDir "$INSTDIR\Forerunner\Common\css"
  RMDir "$INSTDIR\Forerunner\Common\images"
  RMDir "$INSTDIR\Forerunner\Common"
  RMDir "$INSTDIR\Forerunner\Bundles"
  RMDir "$INSTDIR\Forerunner\Controllers"
  RMDir "$INSTDIR\Forerunner"
  RMDir "$INSTDIR\Controllers"
  RMDir "$INSTDIR\bin"
  RMDir "$INSTDIR\SSRSExtension"
  RMDir "$INSTDIR\Config"
  RMDir "$INSTDIR\Custom"
  RMDir "$INSTDIR\sdk"
   ;$INSTDIR is the folder where uninst.exe belong to which is Molibizer
  RMDir "$INSTDIR"
  
  ;Here is to get Mobilizer parent folder
  Push "$INSTDIR"
  Call un.GetParent
  Pop $R0
  ;Recursive delete the LogFiles folder
  RMDir /r "$R0\LogFiles"
  ;We can't delete the root folder, it may delete system folder.
  ;RMDir "$R0"

  DeleteRegKey ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}"
  DeleteRegKey HKLM "${PRODUCT_DIR_REGKEY}"
  SetAutoClose true
SectionEnd
