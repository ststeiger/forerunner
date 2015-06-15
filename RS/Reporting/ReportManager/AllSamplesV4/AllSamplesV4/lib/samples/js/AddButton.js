var allSamples = allSamples || {};

$(function () {
    allSamples.addButton = {
        init: function (target) {
            var $target = $("#" + target);
            var $reportArea = $target.find(".as-sample");
            if ($reportArea.length === 0) {
                $reportArea = $("<div class='as-sample'></div>")
                $target.html($reportArea);

                // reportViewerEZ will create a number of child widgets. The children can
                // be obtained by calls on reportViewerEZ, see below...
                $reportViewerEZ = $reportArea.reportViewerEZ({
                    isReportManager: false,
                    isFullScreen: false
                });

                // Get the reportViewer and toolbar widgets
                $reportViewer = $reportViewerEZ.reportViewerEZ("getReportViewer");
                $toolbar = $reportViewerEZ.reportViewerEZ("getToolbar");

                // Load the new report
                $reportViewer.reportViewer("loadReport", "/AdventureWorks 2008 Sample Reports/Product Line Sales 2008");

                // Create a new button for home. It will be visible on the page as a yellow colored home icon
                var myBtn = {
                    toolType: "button",
                    selectorClass: "myNewHome",
                    sharedClass: "fr-toolbase-no-disable-id",
                    imageClass: "as-icon24x24-home",
                    iconClass: "as-icon24x24",
                    tooltip: "foo dee doo",
                    events: {
                        click: function (e) {
                            alert('myButton');
                        }
                    }
                };

                // Finally add the button
                $toolbar.toolbar("addTools", 3, true, [myBtn]);
            }
        }
    }
});  // function()
