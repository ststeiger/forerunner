; Script generated by the HM NIS Edit Script Wizard.

; HM NIS Edit Wizard helper defines
!define PRODUCT_NAME "Forerunner Mobilizer for SQL Server Reporting Services"
!define PRODUCT_VERSION "1.0"
!define PRODUCT_PUBLISHER "Forerunner Software"
!define PRODUCT_DIR_REGKEY "Software\Microsoft\Windows\CurrentVersion\App Paths\ForerunnerMobilizer"
!define PRODUCT_UNINST_KEY "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCT_NAME}"
!define PRODUCT_UNINST_ROOT_KEY "HKLM"

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

; License Page
!define MUI_LICENSEPAGE_CHECKBOX
!insertmacro MUI_PAGE_LICENSE "${RESOURCEROOT}\License.rtf"
; Directory page
!insertmacro MUI_PAGE_DIRECTORY
; Install files page
!insertmacro MUI_PAGE_INSTFILES
; Add registry key
Page custom fun_ApplicationConfig_RunRegister

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

Name "${PRODUCT_NAME} ${PRODUCT_VERSION}"
OutFile "ForerunnerMobilizerSetup.exe"
InstallDir "$PROGRAMFILES\Forerunner Mobilizer"
InstallDirRegKey HKLM "${PRODUCT_DIR_REGKEY}" ""
ShowInstDetails show
ShowUnInstDetails show

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
  File "${LOCALROOT}\CSS\Login.css"
  File "${LOCALROOT}\CSS\ReportManager.css"
  SetOutPath "$INSTDIR\Forerunner\Common\css"
  File "${LOCALROOT}\Forerunner\Common\css\ToolBase.css"
  File "${LOCALROOT}\Forerunner\Common\css\Forerunner-core.css"
  File "${LOCALROOT}\Forerunner\Common\css\Forerunner-all.css"
  File "${LOCALROOT}\Forerunner\Common\css\icons24x24.css"
  File "${LOCALROOT}\Forerunner\Common\css\icons25x31.css"
  SetOutPath "$INSTDIR\Forerunner\Common\images"
  File "${LOCALROOT}\Forerunner\Common\images\icons24x24.png"
  File "${LOCALROOT}\Forerunner\Common\images\icons25x31.png"
  File "${LOCALROOT}\Forerunner\Common\images\ForerunnerLogo.png"
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
  File "${LOCALROOT}\Forerunner\Lib\Misc\js\jquery.hammer.min.js"
  File "${LOCALROOT}\Forerunner\Lib\Misc\js\jquery.lazyload.min.js"
  File "${LOCALROOT}\Forerunner\Lib\Misc\js\Placeholders.min.js"
  SetOutPath "$INSTDIR\Forerunner\ReportExplorer\css"
  File "${LOCALROOT}\Forerunner\ReportExplorer\css\ReportExplorer.css"
  SetOutPath "$INSTDIR\Forerunner\ReportExplorer\images"
  File "${LOCALROOT}\Forerunner\ReportExplorer\images\Report-icon.png"
  File "${LOCALROOT}\Forerunner\ReportExplorer\images\report_ear_selected.png"
  File "${LOCALROOT}\Forerunner\ReportExplorer\images\report_ear.png"
  File "${LOCALROOT}\Forerunner\ReportExplorer\images\report_bkg.png"
  File "${LOCALROOT}\Forerunner\ReportExplorer\images\folder.png"
  File "${LOCALROOT}\Forerunner\ReportExplorer\images\folder_selected.png"
  File "${LOCALROOT}\Forerunner\ReportExplorer\images\heroAccent.png"
  File "${LOCALROOT}\Forerunner\ReportExplorer\images\Folder-icon.png"
  File "${LOCALROOT}\Forerunner\ReportExplorer\images\bullet.png"
  File "${LOCALROOT}\Forerunner\ReportExplorer\images\accent.png"
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
  File "${LOCALROOT}\Forerunner\ReportViewer\css\DefaultAppTemplate.css"
  SetOutPath "$INSTDIR\Forerunner\ReportViewer\Images\toolpane"
  File "${LOCALROOT}\Forerunner\ReportViewer\Images\toolpane\sq_br_down_icon16.png"
  File "${LOCALROOT}\Forerunner\ReportViewer\Images\toolpane\sq_br_up_icon16.png"
  SetOutPath "$INSTDIR\Forerunner\ReportViewer\Images"
  File "${LOCALROOT}\Forerunner\ReportViewer\Images\search.png"
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
  File "${LOCALROOT}\Forerunner\ReportViewer\Images\calendar.gif"

  SetOutPath "$INSTDIR\Forerunner\ReportViewer\Images\toolbar"
  File "${LOCALROOT}\Forerunner\ReportViewer\Images\toolbar\bkg_toolbar.jpg"
  
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
  File "${LOCALROOT}\Forerunner\ReportViewer\Loc\ReportViewer-sw.txt"
  
  
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
  SetOutPath "$INSTDIR\Scripts\Util"
  File "${LOCALROOT}\Scripts\Util\underscore.js"
  File "${LOCALROOT}\Scripts\Util\modernizr-2.5.3.js"
  File "${LOCALROOT}\Scripts\Util\laconic.js"
  File "${LOCALROOT}\Scripts\Util\json2.js"
  File "${LOCALROOT}\Scripts\Util\jquery.hammer.min.js"
  File "${LOCALROOT}\Scripts\Util\collection_view.js"
  File "${LOCALROOT}\Scripts\Util\backbone_ui.js"
  File "${LOCALROOT}\Scripts\Util\backbone.js"
  File "${LOCALROOT}\Scripts\Util\_references.js"
  SetOutPath "$INSTDIR\Views\Home"
  File "${LOCALROOT}\Views\Home\Index.cshtml"
  SetOutPath "$INSTDIR\Views\Login"
  File "${LOCALROOT}\Views\Login\Login.cshtml"
  SetOutPath "$INSTDIR\Views\Shared"
  File "${LOCALROOT}\Views\Shared\Error.cshtml"
  File "${LOCALROOT}\Views\Shared\_RMLayout.cshtml"
  File "${LOCALROOT}\Views\Shared\_Layout.cshtml"
  SetOutPath "$INSTDIR\Views"
  File "${LOCALROOT}\Views\Web.config"
  File "${LOCALROOT}\Views\_ViewStart.cshtml"
  SetOutPath "$INSTDIR\SSRSExtension"
  File "${LOCALROOT}\SSRSExtension\Forerunner.RenderingExtensions.dll"
  File "${LOCALROOT}\SSRSExtension\Forerunner.Json.dll"
  SetOutPath "$INSTDIR\Config"
  File "${LOCALROOT}\Register\SetupUtil.exe"
  File "${LOCALROOT}\Config\MobilizerConfigTool.exe"
  File "${LOCALROOT}\Config\MobilizerConfigTool.exe.config"
  File "${LOCALROOT}\Config\Manual Activation.rtf"
  File "${RESOURCEROOT}\UltiDev.WebServer.msi"
  SetOutPath "$INSTDIR"
  File "${LOCALROOT}\iPhoneMobilizer.png"
  File /oname=Web.config "${RESOURCEROOT}\Web.config.setup"
  File "${LOCALROOT}\packages.config"
  File "${LOCALROOT}\Global.asax"

SectionEnd

Section -AdditionalIcons
  CreateDirectory "$SMPROGRAMS\ForerunnerMobilizer"
  CreateShortCut "$SMPROGRAMS\ForerunnerMobilizer\Uninstall.lnk" "$INSTDIR\uninst.exe"
  SetOutPath "$INSTDIR\Config"
  CreateShortCut "$SMPROGRAMS\ForerunnerMobilizer\MobilizerConfigTool.lnk" "$INSTDIR\Config\MobilizerConfigTool.exe"
SectionEnd

Section -Post
  WriteUninstaller "$INSTDIR\uninst.exe"
  WriteRegStr HKLM "${PRODUCT_DIR_REGKEY}" "" "$INSTDIR\ForerunnerMobilizer"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "DisplayName" "$(^Name)"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "UninstallString" "$INSTDIR\uninst.exe"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "DisplayIcon" "$INSTDIR\ForerunnerMobilizer"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "DisplayVersion" "${PRODUCT_VERSION}"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "Publisher" "${PRODUCT_PUBLISHER}"
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
        MessageBox MB_YESNOCANCEL|MB_ICONQUESTION ".Net Framework 4.5 is not found in your machine, component Moblizier will not work, do you want to continue? $\n$\nClick Yes to continue,click No download it from official website, click Cancel to abort the installation." IDYES Continue IDNO Download
        abort
    Download:
        ExecShell open "http://www.microsoft.com/download/en/details.aspx?id=24872"
        abort
    Continue:
FunctionEnd

Function fun_ApplicationConfig_RunRegister
  ExecWait "$INSTDIR\Config\SetupUtil.exe"
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
  Delete "$INSTDIR\CSS\ReportManager.css"
  Delete "$INSTDIR\CSS\Login.css"
  Delete "$INSTDIR\Views\_ViewStart.cshtml"
  Delete "$INSTDIR\Views\Web.config"
  Delete "$INSTDIR\Views\Shared\_Layout.cshtml"
  Delete "$INSTDIR\Views\Shared\_RMLayout.cshtml"
  Delete "$INSTDIR\Views\Shared\Error.cshtml"
  Delete "$INSTDIR\Views\Home\Index.cshtml"
  Delete "$INSTDIR\Views\Login\Login.cshtml"
  Delete "$INSTDIR\Scripts\App\router.js"
  Delete "$INSTDIR\Scripts\Util\backbone.js"
  Delete "$INSTDIR\Scripts\Util\_references.js"
  Delete "$INSTDIR\Scripts\Util\backbone_ui.js"
  Delete "$INSTDIR\Scripts\Util\collection_view.js"
  Delete "$INSTDIR\Scripts\Util\jquery.hammer.min.js"
  Delete "$INSTDIR\Scripts\Util\json2.js"
  Delete "$INSTDIR\Scripts\Util\modernizr-2.5.3.js"
  Delete "$INSTDIR\Scripts\Util\laconic.js"
  Delete "$INSTDIR\Scripts\Util\underscore.js"
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
  Delete "$INSTDIR\Forerunner\ReportViewer\Loc\ReportViewer-sw.txt"
  Delete "$INSTDIR\Forerunner\ReportViewer\Images\toolpane\sq_br_down_icon16.png"
  Delete "$INSTDIR\Forerunner\ReportViewer\Images\toolpane\sq_br_up_icon16.png"
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
  Delete "$INSTDIR\Forerunner\ReportViewer\Images\search.png"
  Delete "$INSTDIR\Forerunner\ReportViewer\Images\SortDecending.gif"
  Delete "$INSTDIR\Forerunner\ReportViewer\Images\calendar.gif"
  Delete "$INSTDIR\Forerunner\ReportViewer\Images\toolbar\bkg_toolbar.jpg"
  Delete "$INSTDIR\Forerunner\ReportViewer\css\PageNav.css"
  Delete "$INSTDIR\Forerunner\ReportViewer\css\ReportDocumentMap.css"
  Delete "$INSTDIR\Forerunner\ReportViewer\css\ReportParameter.css"
  Delete "$INSTDIR\Forerunner\ReportViewer\css\ReportRender.css"
  Delete "$INSTDIR\Forerunner\ReportViewer\css\ReportViewer.css"
  Delete "$INSTDIR\Forerunner\ReportViewer\css\ReportPrint.css"
  Delete "$INSTDIR\Forerunner\ReportViewer\css\ReportViewer-all.css"
  Delete "$INSTDIR\Forerunner\ReportViewer\css\ReportViewerEZ.css"
  Delete "$INSTDIR\Forerunner\ReportViewer\css\Toolbar.css"
  Delete "$INSTDIR\Forerunner\ReportViewer\css\ToolPane.css"
  Delete "$INSTDIR\Forerunner\ReportViewer\css\DefaultAppTemplate.css"
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

  Delete "$INSTDIR\Forerunner\ReportExplorer\css\ReportExplorer.css"
  Delete "$INSTDIR\Forerunner\Lib\Misc\js\jquery.hammer.min.js"
  Delete "$INSTDIR\Forerunner\Lib\Misc\js\jquery.lazyload.min.js"
  Delete "$INSTDIR\Forerunner\Lib\Misc\js\scroll-startstop.events.jquery.js"
  Delete "$INSTDIR\Forerunner\Lib\Misc\js\Placeholders.min.js"
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
  Delete "$INSTDIR\Forerunner\Common\css\icons24x24.css"
  Delete "$INSTDIR\Forerunner\Common\css\icons25x31.css"
  Delete "$INSTDIR\Forerunner\Common\images\icons24x24.png"
  Delete "$INSTDIR\Forerunner\Common\images\icons25x31.png"
  Delete "$INSTDIR\Forerunner\Common\images\ForerunnerLogo.png"
  
  Delete "$INSTDIR\\Forerunner\Controllers\ReportManagerController.cs"
  Delete "$INSTDIR\Forerunner\Controllers\ReportViewerController.cs"
  
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
  Delete "$INSTDIR\SSRSExtension\Forerunner.RenderingExtensions.dll"
  Delete "$INSTDIR\SSRSExtension\Forerunner.Json.dll"
  Delete "$INSTDIR\Config\SetupUtil.exe"
  Delete "$INSTDIR\Config\MobilizerConfigTool.exe"
  Delete "$INSTDIR\Config\MobilizerConfigTool.exe.config"
  Delete "$INSTDIR\Config\Manual Activation.rtf"
  Delete "$INSTDIR\Config\UltiDev.WebServer.msi"

  Delete "$SMPROGRAMS\ForerunnerMobilizer\Uninstall.lnk"
  Delete "$SMPROGRAMS\ForerunnerMobilizer\MobilizerConfigTool.lnk"
  RMDir "$SMPROGRAMS\ForerunnerMobilizer"
  
  RMDir "$INSTDIR\Forerunner\ReportViewer\Loc"
  RMDir "$INSTDIR\Views\Shared"
  RMDir "$INSTDIR\Views\Home"
  RMDir "$INSTDIR\Views\Debug"
  RMDir "$INSTDIR\Views\Login"
  RMDir "$INSTDIR\Views"
  RMDir "$INSTDIR\CSS"
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
  RMDir "$INSTDIR\bin"
  RMDir "$INSTDIR\SSRSExtension"
  RMDir "$INSTDIR\Config"
  RMDir "$INSTDIR"

  DeleteRegKey ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}"
  DeleteRegKey HKLM "${PRODUCT_DIR_REGKEY}"
  SetAutoClose true
SectionEnd


