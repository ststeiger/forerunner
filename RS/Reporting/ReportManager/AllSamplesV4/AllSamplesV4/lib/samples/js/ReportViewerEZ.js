var allSamples = allSamples || {};

$(function () {
    allSamples.reportViewerEZ = {
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
            }
        }
    }
});  // function()
