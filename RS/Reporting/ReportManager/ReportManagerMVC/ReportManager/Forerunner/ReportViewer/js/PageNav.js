// Assign or create the single globally scoped variable
var forerunner = forerunner || {};

// Forerunner SQL Server Reports
forerunner.ssr = forerunner.ssr || {};

$(function () {
    var widgets = forerunner.ssr.constants.widgets;
    var events = forerunner.ssr.constants.events;

    // Toolbar widget
    $.widget(widgets.getFullname(widgets.pageNav), {
        options: {
            $reportViewer: null
        },
        _setCurrentPage: function (currentPageNum) {
            var me = this;

            if (me.currentPageNum !== null && me.currentPageNum !== currentPageNum) {
                me.listItems[me.currentPageNum - 1].removeClass("fr-nav-selected");
            }
            me.$ul.scrollLeft(me.listItems[currentPageNum - 1].position().left);
            me.currentPageNum = currentPageNum;
            me.listItems[me.currentPageNum - 1].addClass("fr-nav-selected");
        },
        _renderList: function () {
            var me = this;
            var isTouch = forerunner.device.isTouch();
            var $list;
            
            $list = new $("<UL />");
            $list.addClass("horizontal");
            me.$ul = $list;
 
            var maxNumPages = me.options.$reportViewer.reportViewer("getNumPages");
            var sessionID = me.options.$reportViewer.reportViewer("getSessionID");
            var reportServerURL = me.options.$reportViewer.reportViewer("getReportServerURL");
            var reportViewerAPI = me.options.$reportViewer.reportViewer("getReportViewerAPI");
            var reportPath = me.options.$reportViewer.reportViewer("getReportPath");
            
            me.listItems = new Array(maxNumPages);

            for (var i = 1; i <= maxNumPages; i++) {
                var url = reportViewerAPI + "/GetThumbnail/?ReportServerURL=" + reportServerURL + "&ReportPath="
                        + reportPath + "&SessionID=" + sessionID + "&PageNumber=" + i;
                var $listItem = new $("<LI />");
                $list.append($listItem);
                me.listItems[i - 1] = $listItem;
                var $caption = new $("<DIV />");
                $caption.html("<h3 class='fr-report-centertext'>" + i.toString() + "</h3>");
                $caption.addClass("fr-report-center");
                var $thumbnail = new $("<IMG />");
                $thumbnail.addClass("fr-nav-page-thumb");
                $thumbnail.attr("src", url);
                $thumbnail.data("pageNumber", i);
                this._on($thumbnail, {
                    click: function (event) {
                        me.options.$reportViewer.reportViewer("navToPage", $(event.currentTarget).data("pageNumber"));
                    }
                });
                // Need to add onclick
                $listItem.append($caption);
                $listItem.append($thumbnail);
            }

            return $list;
        },

        reset: function () {
            var me = this;
            me.element.hide();
            me.isRendered = false;
        },
        _render: function () {
            var me = this;
            me.element.html("");
            var isTouch = forerunner.device.isTouch();
            var $slider = new $("<DIV />");
            
            $slider.addClass("fr-nav-container");
 
            var $sliderWrapper = new $("<DIV />");
            
            $slider.append($sliderWrapper);


            var $list = me._renderList();

            $sliderWrapper.append($list);
            me.element.css("display", "block");
            me.element.html($slider);
            
            me.element.hide();
            me._initCallbacks();
            me._setCurrentPage(me.options.$reportViewer.reportViewer("getCurPage"));
        },
        _makeVisible: function (flag) {
            var me = this;
            if (!flag) {
                me.element.fadeOut("fast");
            }
            else {
                me.element.fadeIn("fast");
            }
        },
        showNav: function () {
            var me = this;
            if (!me.isRendered) {
                me._render();
                me.isRendered = true;
            }
            me._makeVisible(!me.element.is(":visible"));
        },
        _initCallbacks: function () {
            var me = this;
            // Hook up any / all custom events that the report viewer may trigger
            me.options.$reportViewer.on(events.reportViewerChangePage(), function (e, data) {
                me._setCurrentPage(data.newPageNum);
            });
        },
        _init: function () {
            var me = this;
            me.listItems = null;
            me.$ul = null;
            me.currentPageNum = null;
            me.isRendered = false;
        },
    });  // $.widget
});  // function()