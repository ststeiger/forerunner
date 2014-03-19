// Assign or create the single globally scoped variable
var forerunner = forerunner || {};

// Forerunner SQL Server Reports
forerunner.ssr = forerunner.ssr || {};

$(function () {
    var widgets = forerunner.ssr.constants.widgets;
    var events = forerunner.ssr.constants.events;
    var locData = forerunner.localize.getLocData(forerunner.config.forerunnerFolder() + "ReportViewer/loc/ReportViewer");

    /**
     * Widget used to show page navigation
     *
     * @namespace $.forerunner.pageNav
     * @prop {Object} options - The options for pageNav
     * @prop {String} options.$reportViewer - Report viewer widget
     * @prop {String} options.rsInstance - Report service instance name
     * @example
     * $("#pageNavContainer").pageNav({
     *  $reportViewer: me.$reportViewer
     * });
     */
    $.widget(widgets.getFullname(widgets.pageNav), {
        options: {
            $reportViewer: null,
            rsInstance: null,
        },
        // Constructor
        _create: function () {

        },
        _setCurrentPage: function (currentPageNum) {
            var me = this;
            var $li;

            if (me.currentPageNum !== null && me.currentPageNum !== currentPageNum) {
                $li = me.listItems[me.currentPageNum - 1];
                $li.removeClass("fr-nav-selected");
                $li.find("img").removeClass("fr-nav-page-thumb-selected");
            }

            me.currentPageNum = currentPageNum;
            // If there is still no max page count, increment it by _batchSize
            if (me.options.$reportViewer.reportViewer("getNumPages") === 0) {
                if (me.currentPageNum >= me._maxNumPages) {
                    for (var i = me._maxNumPages + 1; i <= me._maxNumPages + me._batchSize; i++) {
                        me._renderListItem(i, me.$list);
                    }
                    me._maxNumPages += me._batchSize;
                }
            } else {
                var realMax = me.options.$reportViewer.reportViewer("getNumPages");
                if (realMax !== me._maxNumPages) {
                    for (var i = me._maxNumPages + 1; i <= realMax; i++) {
                        me._renderListItem(i, me.$list);
                    }
                    if (realMax < me._maxNumPages) {
                        for (var i = me._maxNumPages; i >= realMax + 1; i--) {
                            $listItem = me.listItems.pop();
                            $listItem.remove();
                        }
                    }                    
                    me._maxNumPages = realMax;
                }
            }
            me._ScrolltoPage();

            // Reset Lazy load to load new images
            var $container = $("ul.fr-nav-container", $(me.element));
            $(".lazy", me.$list).lazyload({ container: $container, threshold: 200 });

            $li = me.listItems[me.currentPageNum - 1];
            $li.addClass("fr-nav-selected");
            $li.find("img").addClass("fr-nav-page-thumb-selected");
        },
        _ScrolltoPage: function () {
            var me = this;

            if (me.currentPageNum > me._maxNumPages && me.options.$reportViewer.reportViewer("getNumPages") === 0) {
                for (var i = me._maxNumPages + 1 ; i <= me.currentPageNum; i++)
                    me._renderListItem(i, me.$list);
                $(".lazy", me.$list).lazyload("update");
                me._maxNumPages = me.currentPageNum;
            }
            if (me.currentPageNum && !forerunner.device.isElementInViewport(me.listItems[me.currentPageNum - 1].get(0))) {
                var left = me.$ul.scrollLeft() + me.listItems[me.currentPageNum - 1].position().left;
                me.$ul.scrollLeft(left);
            }
        },
        _maxNumPages: null,
        _renderListItem: function (i, $list) {
            var me = this;

            var sessionID = me.options.$reportViewer.reportViewer("getSessionID");
            var reportViewerAPI = me.options.$reportViewer.reportViewer("getReportViewerAPI");
            var reportPath = me.options.$reportViewer.reportViewer("getReportPath");
            var url = reportViewerAPI + "/Thumbnail/?ReportPath="
                        + reportPath + "&SessionID=" + sessionID + "&PageNumber=" + i;
            if (me.options.rsInstance)
                url += "&instance=" + me.options.rsInstance;
            var $listItem = new $("<LI />");
            $list.append($listItem);
            me.listItems[i - 1] = $listItem;
            var $caption = new $("<DIV class='fr-nav-centertext'>" + i.toString() + "</DIV>");
            var $thumbnail = new $("<IMG />");
            $thumbnail.addClass("fr-nav-page-thumb");
            // Instead of stating the src, use data-original and add the lazy class so that
            // we will use lazy loading.
            $thumbnail.addClass("lazy");
            $thumbnail.attr("src", forerunner.config.forerunnerFolder() + "reportviewer/Images/page-loading.gif");
            $thumbnail.attr("data-original", url);
            $thumbnail.data("pageNumber", i);
            this._on($thumbnail, {
                click: function (event) {
                    me.options.$reportViewer.reportViewer("navToPage", $(event.currentTarget).data("pageNumber"));
                    if (forerunner.device.isSmall())
                        me.options.$reportViewer.reportViewer("showNav");                        
                },
            });
  
            $thumbnail.error(function () {
                $(this).hide();
            });
                
            $listItem.addClass("fr-nav-item");
            $listItem.append($caption);
            $listItem.append($thumbnail);
        },
        _batchSize : 10,
        _renderList: function () {
            var me = this;
            var isTouch = forerunner.device.isTouch();
            var $list;
            
            $list = new $("<ul class='fr-nav-container fr-core-widget' />");
            me.$ul = $list;
 
            me._maxNumPages = me.options.$reportViewer.reportViewer("getNumPages");            
            if (me._maxNumPages === 0)
                me._maxNumPages = me._batchSize;

            me.listItems = new Array(me._maxNumPages);

            for (var i = 1; i <= me._maxNumPages; i++) {
                me._renderListItem(i, $list);
            }
             
            return $list.append($("<LI />").addClass("fr-nav-li-spacer"));
        },

        /**
         * Reset page navigation status
         * 
         * @function $.forerunner.pageNav#reset
         */
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

            var $close = $("<DIV />");
            $close.addClass("fr-nav-close-container");

            var $span = $("<SPAN>" + locData.paramPane.cancel + "</SPAN>");
            $span.addClass("fr-nav-close");
            $close.append($span);

            $close.on("click", function () {
                me.options.$reportViewer.reportViewer("showNav");
            });

            $slider.append($close);
            
            me.currentPageNum = me.options.$reportViewer.reportViewer("getCurPage");
            var $list = me._renderList();
            me.$list = $list;

            $slider.append($list);
            me.element.css("display", "block");
            
            me.element.append($slider);
            //me.element.html($slider.html());

            me.element.hide();
            me._initCallbacks();
            me._setCurrentPage(me.currentPageNum);
        },
        _makeVisible: function (flag) {
            var me = this;
            if (!flag) {
                me.element.fadeOut("fast");
            }
            else {
                me.element.fadeIn("fast");
                me._ScrolltoPage();
            }
        },
        /**
         * Show page navigation
         *
         * @function $.forerunner.pageNav#showNav
         */
        showNav: function () {
            var me = this;
            if (!me.isRendered) {
                me._render();
                me.isRendered = true;
            }

            me._makeVisible(!me.element.is(":visible"));
            $(".fr-nav-container", $(me.element)).css("position", me.element.css("position"));
            var $container = $("ul.fr-nav-container", $(me.element));
            $(".lazy", me.$list).lazyload({ container: $container, threshold : 200});
            if (forerunner.device.isMSIE()) {
                me._ScrolltoPage();
            }
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