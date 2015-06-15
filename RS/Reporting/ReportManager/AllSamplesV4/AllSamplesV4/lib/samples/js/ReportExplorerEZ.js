var allSamples = allSamples || {};

$(function () {
    allSamples.reportExplorerEZ = {
        init: function (target) {
            var $sampleArea = null;
            if (allSamples.sampleExists(target)) {
                    $sampleArea = allSamples.getSampleArea(target);
                    var $reportExplorer = $sampleArea.reportExplorerEZ("getReportExplorer");
                    if (!$reportExplorer) {
                        $sampleArea.reportExplorerEZ("transitionToReportManager", "/", "catalog");
                    }
                    return;
            }
            $sampleArea = allSamples.getSampleArea(target);

            // Create the report explorer widget
            $sampleArea.reportExplorerEZ({
                isFullScreen: false
            });

            var events = forerunner.ssr.constants.events;
            $sampleArea.on(events.reportExplorerEZAfterTransition(), function (e, data) {
                // Note that code to remove buttons must be inside of the after transition event. This is because the
                // transitionTo... functions create the widgets (E.g., reportExplorerToolbar) in response to a timer
                // callback, so these calls cannot be synchronous
                if (data.type === "ReportManager") {
                    // Remove the logout button from the report explorer toolbar
                    var $reportExplorerToolbar = $sampleArea.reportExplorerEZ("getReportExplorerToolbar");
                    var toolbarTools = forerunner.ssr.tools.reportExplorerToolbar;
                    $reportExplorerToolbar.reportExplorerToolbar("hideTool", toolbarTools.btnLogOff.selectorClass);

                    // Remove the logout button from the report explorer toolbar
                    var $reportExplorerToolpane = $sampleArea.reportExplorerEZ("getReportExplorerToolpane");
                    var toolpaneTools = forerunner.ssr.tools.reportExplorerToolpane;
                    $reportExplorerToolpane.reportExplorerToolpane("hideTool", toolpaneTools.itemLogOff.selectorClass);

                } else if (data.type === "ReportViewer") {
                    // Remove the logout button from the report viewer tool pane
                    var $reportViewerEZ = $sampleArea.find(".fr-layout-mainviewport");
                    var $toolPane = $reportViewerEZ.reportViewerEZ("getToolPane");
                    var mergedItems = forerunner.ssr.tools.mergedItems;
                    $toolPane.toolPane("hideTool", mergedItems.itemLogOff.selectorClass);

                    // Remove the logout from the report viewer toolbar. Remember that the report viewer toolbar
                    // is not the same as the report explorer toolbar
                    var $toolbar = $reportViewerEZ.reportViewerEZ("getToolbar");
                    var mergedButtons = forerunner.ssr.tools.mergedButtons;
                    $toolbar.toolbar("hideTool", mergedButtons.btnLogOff.selectorClass);
                }
            });  // $sampleArea.on
        }  // init
    }  // allSamples.reportExplorerEZ

    // The reportExplorerEZ needs to be initialize at start up so it can start forerunner.history and listen to route events
    allSamples.reportExplorerEZ.init("as-explorer");

});  // function()
