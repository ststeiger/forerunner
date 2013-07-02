// Assign or create the single globally scoped variable
var forerunner = forerunner || {};

$(function () {
    // Toolbar widget
    $.widget("Forerunner.pagenav", {
        options: {
            $reportViewer: null
        },
        _setCurrentPage: function (currentPageNum) {
            var me = this;
            if (me.$carousel) {
                me.$carousel.select(currentPageNum - 1, 1);
                me.currentPageNum = currentPageNum;
            } else {
                if (me.currentPageNum !== null && me.currentPageNum !== currentPageNum) {
                    me.listItems[me.currentPageNum - 1].removeClass("selected");
                }
                me.$ul.scrollLeft(me.listItems[currentPageNum - 1].position().left);
                me.currentPageNum = currentPageNum;
                me.listItems[me.currentPageNum - 1].addClass("selected");
            }
        },
        _renderList: function () {
            var me = this;
            var isTouch = forerunner.device.isTouch();
            var $list;
            if (!isTouch) {
                $list = new $("<UL />");
                $list.addClass("sky-carousel-container");
            } else {
                $list = new $("<UL />");
                $list.addClass("horizontal");
                me.$ul = $list;
            }
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
                $caption.html("<h3 class='centertext'>" + i.toString() + "</h3>");
                $caption.addClass("center");
                var $thumbnail = new $("<IMG />");
                $thumbnail.addClass(isTouch ?  "navlithumb" : "pagethumb");
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
            if (!isTouch) {
                $slider.attr("class", "sky-carousel");
                $slider.attr("style", "height: 150px;"); // Need to make this none
            } else {
                $slider.addClass("navcontainer");
            }
            var $sliderWrapper = new $("<DIV />");
            if (!isTouch) {
                $sliderWrapper.attr("class", "sky-carousel-wrapper");
            }
            $slider.append($sliderWrapper);


            var $list = me._renderList();

            $sliderWrapper.append($list);
            me.element.css("display", "block");
            me.element.html($slider);
            if (!isTouch) {
                var carousel = $slider.carousel({
                    itemWidth: 120,
                    itemHeight: 120,
                    distance: 8,
                    selectedItemDistance: 25,
                    selectedItemZoomFactor: 1,
                    unselectedItemZoomFactor: 0.67,
                    unselectedItemAlpha: 0.6,
                    motionStartDistance: 85,
                    topMargin: 30,
                    gradientStartPoint: 0.35,
                    gradientOverlayColor: "#f5f5f5",
                    gradientOverlaySize: 95,
                    reflectionDistance: 1,
                    reflectionAlpha: 0.35,
                    reflectionVisible: true,
                    reflectionSize: 35,
                    selectByClick: true
                });
                me.$carousel = carousel;
            }
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
            me.options.$reportViewer.on("reportviewerchangepage", function (e, data) {
                me._setCurrentPage(data.newPageNum);
            });
        },
        _init: function () {
            var me = this;
            me.$carousel = null;
            me.listItems = null;
            me.$ul = null;
            me.currentPageNum = null;
            me.isRendered = false;
        },
    });  // $.widget
});  // function()