var allSamples = allSamples || {};

$(function () {
    allSamples.dashboard = {
        init: function (target) {
            if (allSamples.sampleExists(target)) {
                // Only create the sample once
                return;
            }
            var $sampleArea = allSamples.getSampleArea(target);
            $sampleArea.html($(
                "<table>" +
                    "<tr>" +
                        "<td class='as-report-cell'>" +
                            "<div class='report1-id as-report-container' />" +
                        "</td>" +
                        "<td class='as-report-cell'>" +
                            "<div class='report2-id as-report-container' />" +
                        "</td>" +
                    "</tr>" +
                    "<tr>" +
                        "<td colspan='2' class='as-report-cell'>" +
                            "<div class='report3-id as-report-container' />" +
                        "</td>" +
                    "</tr>" +
                "</table>"
            ));

            var $reportViewerEZ1 = $sampleArea.find(".report1-id").reportViewerEZ({
                isFullScreen: false
            });
            var $reportViewer1 = $reportViewerEZ1.reportViewerEZ("getReportViewer");

            $reportViewer1.reportViewer("loadReport", allSamples.settings.reportPath1);

            var $reportViewerEZ2 = $sampleArea.find(".report2-id").reportViewerEZ({
                isFullScreen: false
            });
            var $reportViewer2 = $reportViewerEZ2.reportViewerEZ("getReportViewer");
            $reportViewer2.reportViewer("loadReport", allSamples.settings.reportPath2);

            var $reportViewerEZ3 = $sampleArea.find(".report3-id").reportViewerEZ({
                isFullScreen: false
            });
            var $reportViewer3 = $reportViewerEZ3.reportViewerEZ("getReportViewer");
            $reportViewer3.reportViewer("loadReport", allSamples.settings.reportPath3);

        }  // init
    }  // allSamples.dashboard
});  // function()
