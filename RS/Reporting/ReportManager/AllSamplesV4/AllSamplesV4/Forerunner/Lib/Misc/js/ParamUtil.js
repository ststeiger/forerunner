// Parameter Utility Dialog
//
// This dialog is designed to work on a page that contains a report explorer ez widget (E.g., Mobilizer)
// or a page that directly contains a report viewer widget ez (customer application).
//
// Remember to include a reference to this .js file as well as the .css file on your page.
//
var forerunner = forerunner || {};
forerunner.ssr = forerunner.ssr || {};

$(function () {
    var widgets = forerunner.ssr.constants.widgets;
    var events = forerunner.ssr.constants.events;

    var methodOpts = {
        loadReport: "reportViewer.loadReport",
        refreshParameters: "reportViewer.refreshParameters",
        extendParameters: "reportViewer.extendParameters",
        setParametersAndUpdate: "reportParameter.setParametersAndUpdate"
    };

    $.widget(widgets.getFullname("paramUtil"), $.forerunner.dialogBase, /** @lends $.forerunner.uploadFile */ {
        options: {
            title: "Parameter Utility",
            iconClass: "fr-icons24x24-paramarea",
            $appContainer: null,
            $reportViewerEZ: null,
            $reportParameter: null,
            reportPath: "",
            paramListObj: {}
        },
        _init: function () {
            var me = this;
            me._super();

            var $main = new $(
                    // Report path
                    "<p>Report Path:" + "</p>" +
                    "<span class='fr-putil-normal-text'>" + me.options.reportPath + "</span>" +
                    "<p>&nbsp;</p>" +
                    // Parameter List Text
                    "<p>ParamList</p>" +
                    "<div class='fr-putil-plist'>" +
                      "<textarea name='plist' wrap='soft' class='fr-putil-plist-textarea-id fr-putil-normal-text'>" + JSON.stringify(me.options.paramListObj) + "</textarea>" +
                    "</div>" +
                    // Method call option
                    "<p>Method:</p>" +
                    "<select class='fr-putil-methods'>" +
                    "</select>");

            me.$formMain.html("");
            me.$formMain.append($main);

            // Add the method options
            me.$methodSelect = me.$form.find(".fr-putil-methods");
            for (var member in methodOpts) {
                me.$methodSelect.append($("<option value=" + member + ">" + methodOpts[member] +"</option>"));
            }

            //disable form auto submit when click enter on the keyboard
            me.$form.on("submit", function () { return false; });
            me._resetValidateMessage();
        },
        _submit: function () {
            var me = this;

            var $reportViewer = me.options.$reportViewerEZ.reportViewerEZ("getReportViewer");
            var $textArea = me.element.find(".fr-putil-plist-textarea-id");
            var paramList = $textArea.val();

            if (me.$methodSelect.val() === "loadReport") {
                // loadReport: function (reportPath, pageNum, parameters,sessionID)
                $reportViewer.reportViewer("loadReport", me.options.reportPath, 1, paramList);
            } else if (me.$methodSelect.val() === "refreshParameters") {
                // refreshParameters: function (paramList, submitForm, pageNum, renderParamArea, isCascading)
                $reportViewer.reportViewer("refreshParameters", paramList);
            } else if (me.$methodSelect.val() === "extendParameters") {
                // extendParameters: function (paramsArray, submitForm)
                $reportViewer.reportViewer("extendParameters", paramList, false);
            } else if (me.$methodSelect.val() === "setParametersAndUpdate") {
                // setParametersAndUpdate: function (paramDefs, savedParams, pageNum)
                var paramDefs = $reportViewer.reportViewer("getParamDefs");
                var curPage = $reportViewer.reportViewer("getCurPage");
                me.options.$reportParameter.reportParameter("setParametersAndUpdate", paramDefs, paramList, curPage);
            } else {
                alert("Error - Unrecognized method: " + me.$methodSelect.val());
            }

            me.closeDialog();
        }
    }); //$.widget

    // Document Ready
    //
    // Add the Param Util button to the right toolbar
    //
    $(document).ready(function (e) {
        var reportExplorerEZSelector = ".fr-layout-container";
        var $reportExplorerEZ = $(document).find(reportExplorerEZSelector);
        var isReportExplorerEZ = widgets.hasWidget($reportExplorerEZ, widgets.reportExplorerEZ);
        var isReportViewerEZ = widgets.hasWidget($(".fr-layout-mainviewport"), widgets.reportViewerEZ);

        if (!isReportExplorerEZ && !isReportViewerEZ) {
            console.log("ParamUtil failed - unable to find a Report Explorer EZ or Report Viewer EX widget on this page");
            return;
        }

        var findDialog = function ($container, dialogClass) {
            var me = this;

            var $dlg = $container.find("." + dialogClass);
            if ($dlg.length === 0) {
                $dlg = new $("<div class='fr-dialog-id fr-core-dialog-layout fr-core-widget'/>");
                $dlg.addClass(dialogClass);
                $container.append($dlg);
            }

            return $dlg;
        }

        var onAfterTransition = function (e, data) {
            if (data.type !== "ReportViewer") {
                // Only process this if we are transitioning to a report viewer
                return;
            }

            // Add the new button to the right toolbar for all report viewers
            var $reportViewerEZ = $(".fr-layout-mainviewport");
            var $rightToolbar = $reportViewerEZ.reportViewerEZ("getRightToolbar");
            var $reportParameter = $reportViewerEZ.reportViewerEZ("getReportParameter");
            var $reportViewer = $reportViewerEZ.reportViewerEZ("getReportViewer");
            var reportPath = $reportViewer.reportViewer("getReportPath");

            var btnGetParameters = {
                toolType: "button",
                selectorClass: "fr-putil-getparams-id",
                imageClass: "fr-putil-getparams-btn",
                iconClass: "fr-putil-getparams24x24",
                tooltip: "Parameters Utility",
                events: {
                    click: function (e) {
                        var paramList = $reportParameter.reportParameter("getParamsList");
                        if (paramList === null) {
                            console.log("ParamUtil - getParamsList returned null");
                            return;
                        }
                        var paramListObj = JSON.parse(paramList);
                        var $pUtilDlg = findDialog($reportViewerEZ, "fr-putil-section")
                        $pUtilDlg.paramUtil({
                            $appContainer: $reportViewerEZ,
                            $reportViewerEZ: $reportViewerEZ,
                            $reportParameter: $reportParameter,
                            reportPath: reportPath,
                            paramListObj: paramListObj
                        });
                        $pUtilDlg.paramUtil("openDialog");
                    }
                }
            }
            $rightToolbar.rightToolbar("addTools", 2, true, [btnGetParameters]);
        }

        if (isReportExplorerEZ) {
            // We need to add the right toolbar button in response to the After Transition event
            // if this page has a Report Explorer widget
            $reportExplorerEZ.off(events.reportExplorerEZAfterTransition(), onAfterTransition);
            $reportExplorerEZ.on(events.reportExplorerEZAfterTransition(), onAfterTransition);
        } else {
            // If this page just has a viewer, then make the call right away.
            onAfterTransition(null, { type: "ReportViewer" });
        }
    });  // document ready

});  // $(function()

