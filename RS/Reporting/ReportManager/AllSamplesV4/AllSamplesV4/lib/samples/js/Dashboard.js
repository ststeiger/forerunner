var allSamples = allSamples || {};

$(function () {
    allSamples.dashboard = {
        init: function (target) {
            var $target = $("#" + target);
            var $reportArea = $target.find(".as-sample");
            if ($reportArea.length === 0) {
                $reportArea = $("<div class='as-sample'></div>")
                $reportArea.html($(
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

                $target.html($reportArea);
            }

            var $reportViewerEZ1 = $target.find(".report1-id").reportViewerEZ({
                isFullScreen: false
            });
            var $reportViewer1 = $reportViewerEZ1.reportViewerEZ("getReportViewer");

            $reportViewer1.reportViewer("loadReport", "/AdventureWorks 2008 Sample Reports/Employee Sales Summary 2008");

            var $reportViewerEZ2 = $target.find(".report2-id").reportViewerEZ({
                isFullScreen: false
            });
            var $reportViewer2 = $reportViewerEZ2.reportViewerEZ("getReportViewer");
            $reportViewer2.reportViewer("loadReport", "/AdventureWorks 2008 Sample Reports/Sales Order Detail 2008");

            var $reportViewerEZ3 = $target.find(".report3-id").reportViewerEZ({
                isFullScreen: false
            });
            var $reportViewer3 = $reportViewerEZ3.reportViewerEZ("getReportViewer");
            $reportViewer3.reportViewer("loadReport", "/AdventureWorks 2008 Sample Reports/Sales Trend 2008");

        }
    }
});  // function()
