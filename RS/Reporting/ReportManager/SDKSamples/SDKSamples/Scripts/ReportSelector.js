$(function () {
    var view = "catalog";
    var reportManagerAPI = forerunner.config.forerunnerAPIBase() + "ReportManager/";
    var $reportListContainer = null;

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

    var render = function ($element, path) {
        var items = getItems(view, path);
        $.each(items, function (index, item) {
            if (item.Type === itemType.folder) {
                // Add a folder element into the DOM and hook up the event
                var $folder = $("<div class='report-list-catalog-container'><p class='report-list-catalog'>" + item.Name + "</p></div>");
                $element.append($folder);
                $folder.on("click", null, item, onClickFolder);
            } else if (item.Type === itemType.report) {
                // Add a report element into the DOM and hook up the event
                var $report = $("<li class='report-list-item'>" + item.Name + "</li>");
                $element.append($report);
                $report.on("click", null, item, onClickReport);
            }
        });
    }

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

        // Remove the report viewer element
        $("#reportViewID").remove();
    };

    var onClickReport = function (e) {
        // Get the report item from the event data
        var item = e.data;

        // Remove the report viewer element
        $("#reportViewID").remove();

        // Create a new reportViewerEZ
        var $viewContainer = "<div id='reportViewID' class='report-view-container'></div>";
        var $reportCell = $("." + "report-view-cell");
        $reportCell.html($viewContainer);
        $('#reportViewID').reportViewerEZ({
            DefaultAppTemplate: null,
            path: item.Path,
            navigateTo: null,
            historyBack: null,
            isReportManager: false,
            isFullScreen: false
        });
    };

    $(document).ready(function () {

        $reportListContainer = $(".report-list-container");
        render($reportListContainer, "/");
    });
});
