var allSamples = allSamples || {};

$(function () {
    allSamples.removeButton = {
        init: function (target) {
            var $target = $("#" + target);
            var $reportArea = $target.find(".as-sample");
            if ($reportArea.length === 0) {
                $reportArea = $("<div class='as-sample'></div>")
                $target.html($reportArea);

                // Create the reportViewerEZ widget and hold onto a reference
                var $reportViewerEZ = $reportArea.reportViewerEZ({
                    isReportManager: false,
                    isFullScreen: false
                });

                // Get the reportViewer widget from reportViewerEZ and load the report
                var $reportViewer = $reportViewerEZ.reportViewerEZ("getReportViewer");
                $reportViewer.reportViewer("loadReport", "/AdventureWorks 2008 Sample Reports/Product Line Sales 2008");

                // Remove the export button from the report viewer tool pane
                var $toolPane = $reportViewerEZ.reportViewerEZ("getToolPane");
                var toolpane = forerunner.ssr.tools.toolpane;
                var $itemExport = $toolPane.find("." + toolpane.itemExport.selectorClass);
                $itemExport.hide();

                // Remove the export from the report viewer toolbar. Remember that the report viewer toolbar
                // is not the same as the report explorer toolbar
                var $toolbar = $reportViewerEZ.reportViewerEZ("getToolbar");
                var groups = forerunner.ssr.tools.groups;
                var $btnExport = $toolbar.find("." + groups.btnExportDropdown.selectorClass);
                $btnExport.addClass("as-hidden");
            }
        }
    }
});  // function()
