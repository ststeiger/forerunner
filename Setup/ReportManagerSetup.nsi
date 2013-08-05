; Script generated by the HM NIS Edit Script Wizard.

; HM NIS Edit Wizard helper defines
!define PRODUCT_NAME "Forerunner Report Manager"
!define PRODUCT_VERSION "1.0"
!define PRODUCT_PUBLISHER "Forerunner Software"
!define PRODUCT_DIR_REGKEY "Software\Microsoft\Windows\CurrentVersion\App Paths\ForerunnerReportManager"
!define PRODUCT_UNINST_KEY "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCT_NAME}"
!define PRODUCT_UNINST_ROOT_KEY "HKLM"

; LOCAL ADDRESS DEFINE
!define LOCALROOT ".\build"

; MUI2
!include MUI2.nsh

; MUI Settings
!define MUI_ABORTWARNING
!define MUI_ICON "${LOCALROOT}\ForerunnerSetup.ico"
!define MUI_UNICON "${NSISDIR}\Contrib\Graphics\Icons\modern-uninstall.ico"

/*
!include "ApplicationConfig.nsdinc"
!include "WebServerConfig.nsdinc"
!include "RunRegister.nsh"

!include "RunConfigTool.nsdinc"
!include "RunConfigTool.nsh"
*/

; Welcome page
!insertmacro MUI_PAGE_WELCOME
; Directory page
!insertmacro MUI_PAGE_DIRECTORY
; Instfiles page
!insertmacro MUI_PAGE_INSTFILES

/*
; Set Application Config page
Page custom fnc_ApplicationConfig_Show fnc_ApplicationConfig_Leave
; Update Web.config file
Page custom fun_ApplicationConfig_RunRegister
; Set Web Server Config page
Page custom fnc_WebServerConfig_Show fnc_WebServerConfig_Leave
; Run Deploy Script if user choose to config it

Page custom fnc_RunConfigTool_Show */

; Finish page
!define MUI_FINISHPAGE_RUN "$INSTDIR\ReportManagerConfigTool.exe"
!define MUI_FINISHPAGE_RUN_TEXT "Run Report Manager Config Tool"
!insertmacro MUI_PAGE_FINISH

; Language files
!insertmacro MUI_LANGUAGE "English"

; Uninstaller pages
!insertmacro MUI_UNPAGE_INSTFILES
; MUI end ------

Name "${PRODUCT_NAME} ${PRODUCT_VERSION}"
OutFile "ForerunnerReportManagerSetup.exe"
InstallDir "$PROGRAMFILES\Forerunner Report Manager"
InstallDirRegKey HKLM "${PRODUCT_DIR_REGKEY}" ""
ShowInstDetails show
ShowUnInstDetails show

Section "ReportManager" SEC01
  SetOutPath "$INSTDIR\bin"
  SetOverwrite ifnewer
  File "${LOCALROOT}\bin\WebGrease.dll"
  File "${LOCALROOT}\bin\System.Web.WebPages.Razor.dll"
  File "${LOCALROOT}\bin\System.Web.WebPages.dll"
  File "${LOCALROOT}\bin\System.Web.WebPages.Deployment.dll"
  File "${LOCALROOT}\bin\System.Web.Razor.dll"
  File "${LOCALROOT}\bin\System.Web.Providers.dll"
  File "${LOCALROOT}\bin\System.Web.Optimization.dll"
  File "${LOCALROOT}\bin\System.Web.Mvc.dll"
  File "${LOCALROOT}\bin\System.Web.Http.WebHost.dll"
  File "${LOCALROOT}\bin\System.Web.Http.dll"
  File "${LOCALROOT}\bin\System.Web.Helpers.dll"
  File "${LOCALROOT}\bin\System.Net.Http.WebRequest.dll"
  File "${LOCALROOT}\bin\System.Net.Http.Formatting.dll"
  File "${LOCALROOT}\bin\System.Net.Http.dll"
  File "${LOCALROOT}\bin\Forerunner.ReportManager.dll"
  File "${LOCALROOT}\bin\Newtonsoft.Json.dll"
  File "${LOCALROOT}\bin\Microsoft.Web.Infrastructure.dll"
  File "${LOCALROOT}\bin\Forerunner.SQLReporting.dll"
  File "${LOCALROOT}\bin\Forerunner.Json.dll"
  File "${LOCALROOT}\bin\EntityFramework.dll"
  File "${LOCALROOT}\bin\Antlr3.Runtime.dll"  
  SetOutPath "$INSTDIR\CSS"
  File "${LOCALROOT}\CSS\ReportManager.css"
  SetOutPath "$INSTDIR\Forerunner\Common\css"
  File "${LOCALROOT}\Forerunner\Common\css\ToolBase.css"
  File "${LOCALROOT}\Forerunner\Common\css\Forerunner-core.css"
  File "${LOCALROOT}\Forerunner\Common\css\Forerunner-all.css"
  SetOutPath "$INSTDIR\Forerunner\Lib\jQuery\css\images"
  File "${LOCALROOT}\Forerunner\Lib\jQuery\css\images\ui-icons_cd0a0a_256x240.png"
  File "${LOCALROOT}\Forerunner\Lib\jQuery\css\images\ui-icons_888888_256x240.png"
  File "${LOCALROOT}\Forerunner\Lib\jQuery\css\images\ui-icons_454545_256x240.png"
  File "${LOCALROOT}\Forerunner\Lib\jQuery\css\images\ui-icons_222222_256x240.png"
  File "${LOCALROOT}\Forerunner\Lib\jQuery\css\images\ui-icons_2e83ff_256x240.png"
  File "${LOCALROOT}\Forerunner\Lib\jQuery\css\images\ui-bg_highlight-soft_75_cccccc_1x100.png"
  File "${LOCALROOT}\Forerunner\Lib\jQuery\css\images\ui-bg_glass_95_fef1ec_1x400.png"
  File "${LOCALROOT}\Forerunner\Lib\jQuery\css\images\ui-bg_glass_75_e6e6e6_1x400.png"
  File "${LOCALROOT}\Forerunner\Lib\jQuery\css\images\ui-bg_glass_75_dadada_1x400.png"
  File "${LOCALROOT}\Forerunner\Lib\jQuery\css\images\ui-bg_glass_65_ffffff_1x400.png"
  File "${LOCALROOT}\Forerunner\Lib\jQuery\css\images\ui-bg_glass_55_fbf9ee_1x400.png"
  File "${LOCALROOT}\Forerunner\Lib\jQuery\css\images\ui-bg_flat_75_ffffff_40x100.png"
  File "${LOCALROOT}\Forerunner\Lib\jQuery\css\images\ui-bg_flat_0_aaaaaa_40x100.png"
  SetOutPath "$INSTDIR\Forerunner\Lib\jQuery\css"
  File "${LOCALROOT}\Forerunner\Lib\jQuery\css\jquery-ui.min.css"
  File "${LOCALROOT}\Forerunner\Lib\jQuery\css\jquery.ui.datepicker.min.css"
  File "${LOCALROOT}\Forerunner\Lib\jQuery\css\jquery.ui.core.min.css"
  SetOutPath "$INSTDIR\Forerunner\Lib\jQuery\js"
  File "${LOCALROOT}\Forerunner\Lib\jQuery\js\jquery-ui-1.10.3.custom.min.js"
  File "${LOCALROOT}\Forerunner\Lib\jQuery\js\jquery-ui.js"
  File "${LOCALROOT}\Forerunner\Lib\jQuery\js\jquery-1.9.1.min.js"
  File "${LOCALROOT}\Forerunner\Lib\jQuery\js\jquery-1.9.1.js"
  File "${LOCALROOT}\Forerunner\Lib\jQuery\js\jquery.watermark.min.js"
  File "${LOCALROOT}\Forerunner\Lib\jQuery\js\jquery.validate1.11.1.min.js"
  SetOutPath "$INSTDIR\Forerunner\Lib\Misc\js"
  File "${LOCALROOT}\Forerunner\Lib\Misc\js\scroll-startstop.events.jquery.js"
  File "${LOCALROOT}\Forerunner\Lib\Misc\js\jquery.touchSwipe.min.js"
  SetOutPath "$INSTDIR\Forerunner\ReportExplorer\css"
  File "${LOCALROOT}\Forerunner\ReportExplorer\css\ReportExplorer.css"
  SetOutPath "$INSTDIR\Forerunner\ReportExplorer\images"
  File "${LOCALROOT}\Forerunner\ReportExplorer\images\star_fav_icon.png"
  File "${LOCALROOT}\Forerunner\ReportExplorer\images\sq_plus_icon.png"
  File "${LOCALROOT}\Forerunner\ReportExplorer\images\sq_minus_icon.png"
  File "${LOCALROOT}\Forerunner\ReportExplorer\images\Report-icon.png"
  File "${LOCALROOT}\Forerunner\ReportExplorer\images\heroAccent.png"
  File "${LOCALROOT}\Forerunner\ReportExplorer\images\Folder-icon.png"
  File "${LOCALROOT}\Forerunner\ReportExplorer\images\clock_icon.png"
  File "${LOCALROOT}\Forerunner\ReportExplorer\images\bullet.png"
  File "${LOCALROOT}\Forerunner\ReportExplorer\images\accent.png"
  SetOutPath "$INSTDIR\Forerunner\ReportViewer\css"
  File "${LOCALROOT}\Forerunner\ReportViewer\css\ToolPane.css"
  File "${LOCALROOT}\Forerunner\ReportViewer\css\Toolbar.css"
  File "${LOCALROOT}\Forerunner\ReportViewer\css\ReportViewerEZ.css"
  File "${LOCALROOT}\Forerunner\ReportViewer\css\ReportViewer-all.css"
  File "${LOCALROOT}\Forerunner\ReportViewer\css\ReportViewer.css"
  File "${LOCALROOT}\Forerunner\ReportViewer\css\ReportRender.css"
  File "${LOCALROOT}\Forerunner\ReportViewer\css\ReportParameter.css"
  File "${LOCALROOT}\Forerunner\ReportViewer\css\ReportDocumentMap.css"
  File "${LOCALROOT}\Forerunner\ReportViewer\css\PageNav.css"
  /*SetOutPath "$INSTDIR\Forerunner\ReportViewer\Images\Toolbar"
  File "${LOCALROOT}\Forerunner\ReportViewer\Images\Toolbar\XML.jpg"
  File "${LOCALROOT}\Forerunner\ReportViewer\Images\Toolbar\Word.png"
  File "${LOCALROOT}\Forerunner\ReportViewer\Images\Toolbar\tiff.jpg"
  File "${LOCALROOT}\Forerunner\ReportViewer\Images\Toolbar\Thumbs.db"
  File "${LOCALROOT}\Forerunner\ReportViewer\Images\Toolbar\playback_rew_icon.png"
  File "${LOCALROOT}\Forerunner\ReportViewer\Images\Toolbar\playback_reload_icon.png"
  File "${LOCALROOT}\Forerunner\ReportViewer\Images\Toolbar\playback_prev_icon.png"
  File "${LOCALROOT}\Forerunner\ReportViewer\Images\Toolbar\playback_next_icon.png"
  File "${LOCALROOT}\Forerunner\ReportViewer\Images\Toolbar\playback_ff_icon.png"
  File "${LOCALROOT}\Forerunner\ReportViewer\Images\Toolbar\PDF.jpg"
  File "${LOCALROOT}\Forerunner\ReportViewer\Images\Toolbar\page_layout_icon.png"
  File "${LOCALROOT}\Forerunner\ReportViewer\Images\Toolbar\MHT.jpg"
  File "${LOCALROOT}\Forerunner\ReportViewer\Images\Toolbar\list_bullets_icon.png"
  File "${LOCALROOT}\Forerunner\ReportViewer\Images\Toolbar\home_icon.png"
  File "${LOCALROOT}\Forerunner\ReportViewer\Images\Toolbar\export.jpg"
  File "${LOCALROOT}\Forerunner\ReportViewer\Images\Toolbar\Excel.png"
  File "${LOCALROOT}\Forerunner\ReportViewer\Images\Toolbar\CSV.png"
  File "${LOCALROOT}\Forerunner\ReportViewer\Images\Toolbar\CSV.jpg"
  File "${LOCALROOT}\Forerunner\ReportViewer\Images\Toolbar\burst_icon.png"
  File "${LOCALROOT}\Forerunner\ReportViewer\Images\Toolbar\arrow_left_icon.png"
  File "${LOCALROOT}\Forerunner\ReportViewer\Images\Toolbar\align_just_icon.png"
  SetOutPath "$INSTDIR\Forerunner\ReportViewer\Images"
  File "${LOCALROOT}\Forerunner\ReportViewer\Images\SortDecending.gif"
  File "${LOCALROOT}\Forerunner\ReportViewer\Images\SortAccending.gif"
  File "${LOCALROOT}\Forerunner\ReportViewer\Images\Parameter_Expand.png"
  File "${LOCALROOT}\Forerunner\ReportViewer\Images\Parameter_Collapse.png"
  File "${LOCALROOT}\Forerunner\ReportViewer\Images\OpenDropDown.png"
  File "${LOCALROOT}\Forerunner\ReportViewer\Images\NotSorted.gif"
  File "${LOCALROOT}\Forerunner\ReportViewer\Images\EmptyIndent.gif"
  File "${LOCALROOT}\Forerunner\ReportViewer\Images\Drilldown_Expand.gif"
  File "${LOCALROOT}\Forerunner\ReportViewer\Images\Drilldown_Collapse.gif"
  File "${LOCALROOT}\Forerunner\ReportViewer\Images\DocMap_Expand.png"
  File "${LOCALROOT}\Forerunner\ReportViewer\Images\DocMap_Collapse.png"
  File "${LOCALROOT}\Forerunner\ReportViewer\Images\ajax-loader1.gif"
  */
  SetOutPath "$INSTDIR\Forerunner\ReportViewer\Loc"
  File "${LOCALROOT}\Forerunner\ReportViewer\Loc\ReportViewer-zh-cn.txt"
  File "${LOCALROOT}\Forerunner\ReportViewer\Loc\ReportViewer-en-us.txt"
  SetOutPath "$INSTDIR\Forerunner"
  File "${LOCALROOT}\Forerunner\Forerunner-all.min.js"
  SetOutPath "$INSTDIR\Scripts\App"
  File "${LOCALROOT}\Scripts\App\router.js"
  SetOutPath "$INSTDIR\Scripts\Util"
  File "${LOCALROOT}\Scripts\Util\underscore.js"
  File "${LOCALROOT}\Scripts\Util\modernizr-2.5.3.js"
  File "${LOCALROOT}\Scripts\Util\laconic.js"
  File "${LOCALROOT}\Scripts\Util\json2.js"
  File "${LOCALROOT}\Scripts\Util\jquery.touchSwipe.js"
  File "${LOCALROOT}\Scripts\Util\collection_view.js"
  File "${LOCALROOT}\Scripts\Util\backbone_ui.js"
  File "${LOCALROOT}\Scripts\Util\backbone.js"
  File "${LOCALROOT}\Scripts\Util\_references.js"
  SetOutPath "$INSTDIR\Views\Debug"
  File "${LOCALROOT}\Views\Debug\Index.cshtml"
  SetOutPath "$INSTDIR\Views\Home"
  File "${LOCALROOT}\Views\Home\Index.cshtml"
  SetOutPath "$INSTDIR\Views\Shared"
  File "${LOCALROOT}\Views\Shared\Error.cshtml"
  File "${LOCALROOT}\Views\Shared\_RMLayout.cshtml"
  File "${LOCALROOT}\Views\Shared\_Layout.cshtml"
  SetOutPath "$INSTDIR\Views"
  File "${LOCALROOT}\Views\Web.config"
  File "${LOCALROOT}\Views\_ViewStart.cshtml"
  SetOutPath "$INSTDIR"
  File "${LOCALROOT}\Web.config"
  File "${LOCALROOT}\ReportManagerConfigTool.exe"
  ;CreateShortCut "$DESKTOP\ReportManager.lnk" "$INSTDIR\ReportManagerResigter.exe"
  File "${LOCALROOT}\Readme.txt"
  File "${LOCALROOT}\packages.config"
  File "${LOCALROOT}\Global.asax"
  File "${LOCALROOT}\ForerunnerSetup.ico"
SectionEnd

Section -AdditionalIcons
  CreateDirectory "$SMPROGRAMS\ForerunnerReportManager"
  CreateShortCut "$SMPROGRAMS\ForerunnerReportManager\Uninstall.lnk" "$INSTDIR\uninst.exe"
SectionEnd

Section -Post
  WriteUninstaller "$INSTDIR\uninst.exe"
  WriteRegStr HKLM "${PRODUCT_DIR_REGKEY}" "" "$INSTDIR\ForerunnerReportManager"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "DisplayName" "$(^Name)"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "UninstallString" "$INSTDIR\uninst.exe"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "DisplayIcon" "$INSTDIR\ForerunnerReportManager"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "DisplayVersion" "${PRODUCT_VERSION}"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "Publisher" "${PRODUCT_PUBLISHER}"
SectionEnd

;Detect .Net Framework before install
Function .onInit
  Call IsDotNETInstalled
  Pop $0
  StrCmp $0 1 found noFound
  found:
    Goto +4
  noFound:
    MessageBox MB_OK|MB_ICONSTOP ".Net Framework is needed before install"
    Abort
FunctionEnd

Function un.onUninstSuccess
  HideWindow
  MessageBox MB_ICONINFORMATION|MB_OK "$(^Name) was successfully removed from your computer."
FunctionEnd

Function un.onInit
  MessageBox MB_ICONQUESTION|MB_YESNO|MB_DEFBUTTON2 "Are you sure you want to completely remove $(^Name) and all of its components?" IDYES +2
  Abort
FunctionEnd

Function IsDotNETInstalled
   Push $0
   Push $1
   Push $2
   Push $3
   Push $4

   ReadRegStr $4 HKEY_LOCAL_MACHINE \
     "Software\Microsoft\.NETFramework" "InstallRoot"
   # �Ƴ��˸��
   Push $4
   Exch $EXEDIR
   Exch $EXEDIR
   Pop $4

   IfFileExists $4 0 noDotNET

   StrCpy $0 0

   EnumStart:

     EnumRegKey $2 HKEY_LOCAL_MACHINE \
       "Software\Microsoft\.NETFramework\Policy"  $0
     IntOp $0 $0 + 1
     StrCmp $2 "" noDotNET

     StrCpy $1 0

     EnumPolicy:

       EnumRegValue $3 HKEY_LOCAL_MACHINE \
         "Software\Microsoft\.NETFramework\Policy\$2" $1
       IntOp $1 $1 + 1
        StrCmp $3 "" EnumStart
         IfFileExists "$4\$2.$3" foundDotNET EnumPolicy

   noDotNET:
     StrCpy $0 0
     Goto done

   foundDotNET:
     StrCpy $0 1

   done:
     Pop $4
     Pop $3
     Pop $2
     Pop $1
     Exch $0
FunctionEnd

Function IsIISInstalled
  ClearErrors
  ReadRegDWORD $0 HKLM "SOFTWARE\Microsoft\InetStp" "MajorVersion"

  IfErrors 0 +2
    MessageBox MB_OK|MB_ICONSTOP "IIS Server not found, please install IIS first! Installer will abort."
    Abort
FunctionEnd

Function IsUWSInstalled
  ClearErrors
  ReadRegDWORD $0 HKLM "SYSTEM\CurrentControlSet\services\UltiDev Web Server Pro" "Start"

  IfErrors 0 +2
    MessageBox MB_OK|MB_ICONSTOP "UWS Server not found, please install UWS first! Installer will abort."
    Abort
FunctionEnd



Section Uninstall
  Delete "$INSTDIR\config.ini"
  Delete "$INSTDIR\uninst.exe"
  Delete "$INSTDIR\ForerunnerSetup.ico"
  Delete "$INSTDIR\Global.asax"
  Delete "$INSTDIR\packages.config"
  Delete "$INSTDIR\Readme.txt"
  Delete "$INSTDIR\ReportManagerConfigTool.exe"
  Delete "$INSTDIR\Web.config"
  Delete "$INSTDIR\CSS\ReportManager.css"
  Delete "$INSTDIR\Views\_ViewStart.cshtml"
  Delete "$INSTDIR\Views\Web.config"
  Delete "$INSTDIR\Views\Shared\_Layout.cshtml"
  Delete "$INSTDIR\Views\Shared\_RMLayout.cshtml"
  Delete "$INSTDIR\Views\Shared\Error.cshtml"
  Delete "$INSTDIR\Views\Home\Index.cshtml"
  Delete "$INSTDIR\Views\Debug\Index.cshtml"
  Delete "$INSTDIR\Scripts\App\router.js"
  Delete "$INSTDIR\Scripts\Util\backbone.js"
  Delete "$INSTDIR\Scripts\Util\_references.js"
  Delete "$INSTDIR\Scripts\Util\backbone_ui.js"
  Delete "$INSTDIR\Scripts\Util\collection_view.js"
  Delete "$INSTDIR\Scripts\Util\jquery.touchSwipe.js"
  Delete "$INSTDIR\Scripts\Util\json2.js"
  Delete "$INSTDIR\Scripts\Util\modernizr-2.5.3.js"
  Delete "$INSTDIR\Scripts\Util\laconic.js"
  Delete "$INSTDIR\Scripts\Util\underscore.js"
  Delete "$INSTDIR\Forerunner\Forerunner-all.min.js"
  Delete "$INSTDIR\Forerunner\ReportViewer\Loc\ReportViewer-en-us.txt"
  Delete "$INSTDIR\Forerunner\ReportViewer\Loc\ReportViewer-zh-cn.txt"
  Delete "$INSTDIR\Forerunner\ReportViewer\Images\ajax-loader1.gif"
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
  Delete "$INSTDIR\Forerunner\ReportViewer\Images\SortDecending.gif"
  Delete "$INSTDIR\Forerunner\ReportViewer\css\PageNav.css"
  Delete "$INSTDIR\Forerunner\ReportViewer\css\ReportDocumentMap.css"
  Delete "$INSTDIR\Forerunner\ReportViewer\css\ReportParameter.css"
  Delete "$INSTDIR\Forerunner\ReportViewer\css\ReportRender.css"
  Delete "$INSTDIR\Forerunner\ReportViewer\css\ReportViewer.css"
  Delete "$INSTDIR\Forerunner\ReportViewer\css\ReportViewer-all.css"
  Delete "$INSTDIR\Forerunner\ReportViewer\css\ReportViewerEZ.css"
  Delete "$INSTDIR\Forerunner\ReportViewer\css\Toolbar.css"
  Delete "$INSTDIR\Forerunner\ReportViewer\css\ToolPane.css"
  Delete "$INSTDIR\Forerunner\ReportExplorer\images\accent.png"
  Delete "$INSTDIR\Forerunner\ReportExplorer\images\bullet.png"
  Delete "$INSTDIR\Forerunner\ReportExplorer\images\clock_icon.png"
  Delete "$INSTDIR\Forerunner\ReportExplorer\images\Folder-icon.png"
  Delete "$INSTDIR\Forerunner\ReportExplorer\images\heroAccent.png"
  Delete "$INSTDIR\Forerunner\ReportExplorer\images\Report-icon.png"
  Delete "$INSTDIR\Forerunner\ReportExplorer\images\sq_minus_icon.png"
  Delete "$INSTDIR\Forerunner\ReportExplorer\images\sq_plus_icon.png"
  Delete "$INSTDIR\Forerunner\ReportExplorer\images\star_fav_icon.png"
  Delete "$INSTDIR\Forerunner\ReportExplorer\css\ReportExplorer.css"
  Delete "$INSTDIR\Forerunner\Lib\Misc\js\jquery.touchSwipe.min.js"
  Delete "$INSTDIR\Forerunner\Lib\Misc\js\scroll-startstop.events.jquery.js"
  Delete "$INSTDIR\Forerunner\Lib\jQuery\js\jquery.validate1.11.1.min.js"
  Delete "$INSTDIR\Forerunner\Lib\jQuery\js\jquery.watermark.min.js"
  Delete "$INSTDIR\Forerunner\Lib\jQuery\js\jquery-1.9.1.js"
  Delete "$INSTDIR\Forerunner\Lib\jQuery\js\jquery-1.9.1.min.js"
  Delete "$INSTDIR\Forerunner\Lib\jQuery\js\jquery-ui.js"
  Delete "$INSTDIR\Forerunner\Lib\jQuery\js\jquery-ui-1.10.3.custom.min.js"
  Delete "$INSTDIR\Forerunner\Lib\jQuery\css\jquery.ui.core.min.css"
  Delete "$INSTDIR\Forerunner\Lib\jQuery\css\jquery.ui.datepicker.min.css"
  Delete "$INSTDIR\Forerunner\Lib\jQuery\css\jquery-ui.min.css"
  Delete "$INSTDIR\Forerunner\Lib\jQuery\css\images\ui-bg_flat_0_aaaaaa_40x100.png"
  Delete "$INSTDIR\Forerunner\Lib\jQuery\css\images\ui-bg_flat_75_ffffff_40x100.png"
  Delete "$INSTDIR\Forerunner\Lib\jQuery\css\images\ui-bg_glass_55_fbf9ee_1x400.png"
  Delete "$INSTDIR\Forerunner\Lib\jQuery\css\images\ui-bg_glass_65_ffffff_1x400.png"
  Delete "$INSTDIR\Forerunner\Lib\jQuery\css\images\ui-bg_glass_75_dadada_1x400.png"
  Delete "$INSTDIR\Forerunner\Lib\jQuery\css\images\ui-bg_glass_75_e6e6e6_1x400.png"
  Delete "$INSTDIR\Forerunner\Lib\jQuery\css\images\ui-bg_glass_95_fef1ec_1x400.png"
  Delete "$INSTDIR\Forerunner\Lib\jQuery\css\images\ui-bg_highlight-soft_75_cccccc_1x100.png"
  Delete "$INSTDIR\Forerunner\Lib\jQuery\css\images\ui-icons_2e83ff_256x240.png"
  Delete "$INSTDIR\Forerunner\Lib\jQuery\css\images\ui-icons_222222_256x240.png"
  Delete "$INSTDIR\Forerunner\Lib\jQuery\css\images\ui-icons_454545_256x240.png"
  Delete "$INSTDIR\Forerunner\Lib\jQuery\css\images\ui-icons_888888_256x240.png"
  Delete "$INSTDIR\Forerunner\Lib\jQuery\css\images\ui-icons_cd0a0a_256x240.png"
  Delete "$INSTDIR\Forerunner\Common\css\Forerunner-all.css"
  Delete "$INSTDIR\Forerunner\Common\css\Forerunner-core.css"
  Delete "$INSTDIR\Forerunner\Common\css\ToolBase.css"
  Delete "$INSTDIR\bin\Antlr3.Runtime.dll"
  Delete "$INSTDIR\bin\EntityFramework.dll"
  Delete "$INSTDIR\bin\Forerunner.Json.dll"
  Delete "$INSTDIR\bin\Forerunner.SQLReporting.dll"
  Delete "$INSTDIR\bin\Microsoft.Web.Infrastructure.dll"
  Delete "$INSTDIR\bin\Newtonsoft.Json.dll"
  Delete "$INSTDIR\bin\Forerunner.ReportManager.dll"
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
  Delete "$INSTDIR\ReportManagerConfigTool.exe"

  Delete "$SMPROGRAMS\ReportManager\Uninstall.lnk"
  Delete "$DESKTOP\ReportManager.lnk"

  RMDir "$SMPROGRAMS\ReportManager"
  RMDir "$INSTDIR\Forerunner\ReportViewer\Loc"
  RMDir "$INSTDIR\Views\Shared"
  RMDir "$INSTDIR\Views\Home"
  RMDir "$INSTDIR\Views\Debug"
  RMDir "$INSTDIR\Views"
  RMDir "$INSTDIR\CSS"
  RMDir "$INSTDIR\Scripts\Util"
  RMDir "$INSTDIR\Scripts\App"
  RMDir "$INSTDIR\Scripts"
  RMDir "$INSTDIR\Forerunner\Common"
  RMDir "$INSTDIR\Forerunner\ReportViewer\Loc"
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
  RMDir "$INSTDIR\Forerunner\Common"
  RMDir "$INSTDIR\Forerunner"
  RMDir "$INSTDIR\bin"
  RMDir "$INSTDIR"

  DeleteRegKey ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}"
  DeleteRegKey HKLM "${PRODUCT_DIR_REGKEY}"
  SetAutoClose true
SectionEnd


