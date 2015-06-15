var allSamples = allSamples || {};

$(function () {
    var view = "catalog";
    var reportManagerAPI = forerunner.config.forerunnerAPIBase() + "ReportManager/";
    var $reportListContainer = null;

    // getItems will return back an array of CatalogItem objects where:
    //
    // var = CatalogItem {
    //          ID: string,     - GUID
    //          Name: string,   - Item Name
    //          Path: string,   - Item Path
    //          Type: number,   - itemType (see below)
    // }
    var getItems = function (view, path) {
        var me = this;
        var items = null;

        forerunner.ajax.ajax({
            dataType: "json",
            url: reportManagerAPI + "GetItems",
            async: false,
            data: {
                view: view,
                path: path
            },
            success: function (data) {
                items = data;
            },
            error: function (data) {
                console.log(data);
                forerunner.dialog.showMessageBox($('body'), "Catalogs Failed to Load");
            }
        });

        return items;
    };

    // itemType is the number returned in the CatalogItem.Type member
    var itemType = {
        unknown: 0,
        folder: 1,
        report: 2,
        resource: 3,
        linkedReport: 4,
        dataSource: 5,
        model: 6,
        site: 7
    };

    // render will add the ui elements for either a folder or report item type.
    var render = function ($element, path) {
        var items = getItems(view, path);
        $.each(items, function (index, item) {
            if (item.Type === itemType.folder) {
                // Add a folder element into the DOM and hook up the event
                var $folder = $("<div class='rs-report-list-catalog-container'><p class='rs-report-list-catalog'>" + item.Name + "</p></div>");
                $element.append($folder);
                $folder.on("click", null, item, onClickFolder);
            } else if (item.Type === itemType.report) {
                // Add a report element into the DOM and hook up the event
                var $report = $("<li class='rs-report-list-item'>" + item.Name + "</li>");
                $element.append($report);
                $report.on("click", null, item, onClickReport);
            }
        });
    }

    // onClickFolder will toggle the visibility of the individual report items
    // within the given folder. It will then remove any existing report.
    var onClickFolder = function (e) {
        // Get the catalog item from the event data
        var item = e.data;

        $(".report-list-list").each(function (index, element) {
            // Hide other report lists
            if (element.id !== item.ID) {
                $(element).hide();
            }
        });

        var $reportList = $reportListContainer.find("#" + item.ID);
        if ($reportList.length > 0) {
            // Hide or show the target report list
            $reportList.toggle();
        } else {
            // Create the report list using the catalog item ID as the list id
            var $catalogContainer = $(e.currentTarget);
            $reportList = $("<ul class='report-list-list' id='" + item.ID + "'></ul>");
            $catalogContainer.after($reportList);
            render($reportList, item.Path);
        }
    };

    // We only need to create the reportViewerEZ one time then we can hold onto a reference.
    // Note that reportViewerEZ creates reportViewer and a number of other widget. All widgets
    // that reportViewerEZ creates can be obtained by calls on reportViewerEZ such as
    // "getReportViewer"
    var $reportViewerEZ = null;
    var $reportViewer = null;

    // onClickReport will remove any existing report and create a new report viewer for
    // the given report path.
    var onClickReport = function (e) {
        // Get the report item from the event data
        var item = e.data;

        if (!$reportViewerEZ) {
            // Create the reportViewerEZ if need be
            $reportViewerEZ = $('#reportViewID').reportViewerEZ({
                navigateTo: null,
                historyBack: null,
                isReportManager: false,
                isFullScreen: false
            });
            // Get a reference to the reportViewer widget
            $reportViewer = $reportViewerEZ.reportViewerEZ("getReportViewer");
        }

        // Load the new report
        $reportViewer.reportViewer("loadReport", item.Path);
    };

    allSamples.selector = {
        init: function (target) {
            if (allSamples.sampleExists(target)) {
                // Only create the sample once
                return;
            }
            var $sampleArea = allSamples.getSampleArea(target);

            $sampleArea.html($(
                "<div class='rs-sample-container'>" +
                    "<table class='rs-sample-table'>" +
                        "<tbody>" +
                            "<tr class='rs-sample-row'>" +
                                "<td class='rs-report-list-cell'>" +
                                    "<div class='report-list-container'></div>" +
                                "</td>" +
                                "<td class='rs-report-view-cell'>" +
                                    "<div class='rs-report-view-container'>" +
                                        "<div id='reportViewID' class='rs-report-view'></div>" +
                                    "</div>" +
                                "</td>" +
                            "</tr>" +
                        "</tbody>" +
                    "</table>" +
                "</div>" 
            ));

            $reportListContainer = $sampleArea.find(".report-list-container");
            render($reportListContainer, "/");
        }  // init
    }  // allSamples.selector
});  // function()
