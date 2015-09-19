/**
 * @file Contains the page navigation widget.
 *
 */

// Assign or create the single globally scoped variable
var forerunner = forerunner || {};

// Forerunner SQL Server Reports
forerunner.ssr = forerunner.ssr || {};

$(function () {
    var widgets = forerunner.ssr.constants.widgets;
    var events = forerunner.ssr.constants.events;
    var locData = forerunner.localize;


    /**
     * Widget used to show page navigation
     *
     * @namespace $.forerunner.pageNav
     * @prop {Object} options - The options for pageNav
     * @prop {Object} options.$reportViewer - Report viewer widget
     * @prop {String} options.rsInstance - Report service instance name
     * @example
     * $("#pageNavContainer").pageNav({
     *  $reportViewer: me.$reportViewer,
     *  $appContainer: me.$appContainer,
     *  rsInstance: rsInstance,
     * });
     */
    $.widget(widgets.getFullname(widgets.pageNav), /** @lends $.forerunner.pageNav */ {
        options: {
            $reportViewer: null,
            $appContainer: null,
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
            me._ScrolltoPage();

            $li = me.listItems[me.currentPageNum - 1];
            $li.addClass("fr-nav-selected");
            $li.find("img").addClass("fr-nav-page-thumb-selected");
        },
        _ScrolltoPage: function () {
            var me = this;

            if (me.currentPageNum > me._maxNumPages && me.options.$reportViewer.reportViewer("getNumPages") === 0) {
                for (var i = me._maxNumPages + 1 ; i <= me.currentPageNum; i++)
                    me._renderListItem(i, me.$list);

                me._maxNumPages = me.currentPageNum;
            }
            if (me.currentPageNum && !forerunner.device.isElementInViewport(me.listItems[me.currentPageNum - 1].get(0))) {
                var left = me.$ul.scrollLeft() + me.listItems[me.currentPageNum - 1].position().left;
                me.$ul.scrollLeft(left);
            }
        },
        _maxNumPages: null,
        _renderListItem: function (i, $list, isAppend) {
            var me = this;

            var sessionID = me.options.$reportViewer.reportViewer("getSessionID");
            var reportViewerAPI = me.options.$reportViewer.reportViewer("getReportViewerAPI");
            var reportPath = me.options.$reportViewer.reportViewer("getReportPath");
            var url = reportViewerAPI + "/Thumbnail/?ReportPath="
                        + encodeURIComponent(reportPath) + "&SessionID=" + sessionID + "&PageNumber=" + i;
            if (me.options.rsInstance)
                url += "&instance=" + me.options.rsInstance;
            var $listItem = new $("<LI />");

            if (isAppend && me.$loadMore) {
                $listItem.insertBefore(me.$loadMore);
            }
            else {
                $list.append($listItem);
            }

            me.listItems[i - 1] = $listItem;            
            var $caption = new $("<DIV class='fr-nav-centertext'>" + i.toString() + "</DIV>");
            var $thumbnail = new $("<IMG />");
            $thumbnail.addClass("fr-nav-page-thumb");
            // Instead of stating the src, use data-original and add the lazy class so that
            // we will use lazy loading.
            $thumbnail.addClass("lazy");
            $thumbnail.attr("src", forerunner.config.forerunnerFolder() + "reportviewer/Images/page-loading.gif");
            $thumbnail.attr("data-src", url);
            $thumbnail.data("pageNumber", i);
            this._on($thumbnail, {
                click: function (event) {
                    me.options.$reportViewer.reportViewer("navToPage", $(event.currentTarget).data("pageNumber"));
                    //check $slider container instead, we can sure it's open
                    //me.options.$reportviewer may hide so its width is 0
                    //if (forerunner.device.isSmall(me.$slider))
                    if (forerunner.device.isSmall(me.options.$appContainer))
                        me.options.$reportViewer.reportViewer("showNav");                        
                },
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

            if (me._maxNumPages !== me.options.$reportViewer.reportViewer("getNumPages")) {
                var $loadMore = new $("<LI />");
                $loadMore.addClass("fr-nav-loadmore");
                $loadMore.addClass("fr-nav-item");
                $loadMore.addClass("fr-core-cursorpointer");
                $loadMore.on("click", function () {
                    var i;

                    if (me.options.$reportViewer.reportViewer("getNumPages") === 0) {
                        for (i = me._maxNumPages + 1; i <= me._maxNumPages + me._batchSize; i++) {
                            me._renderListItem(i, me.$list, true);
                        }
                        me._maxNumPages += me._batchSize;
                    } else {
                        var realMax = me.options.$reportViewer.reportViewer("getNumPages");
                        if (realMax !== me._maxNumPages) {
                            for (i = me._maxNumPages + 1; i <= realMax; i++) {
                                me._renderListItem(i, me.$list, true);
                            }
                            me._maxNumPages = realMax;
                        }

                        $loadMore.remove();
                    }

                    me._fullScreenCheck();

                    var $container = $("ul.fr-nav-container", $(me.element));
                    $(".lazy", me.$list).lazyload({
                        $container: $container,
                        onError: function (element) {
                            if ($loadMore) 
                                $loadMore.remove();
                            element.data.parent().remove();
                        },
                    });
                });

                var $loadMoreSpan = new $("<Div />");
                $loadMoreSpan.addClass("fr-nav-loadmore-text");    
                $loadMore.append($loadMoreSpan);

                $list.append($loadMore);
                me.$loadMore = $loadMore;
            }
            var $spacer = new $("<LI />");
            $spacer.addClass("fr-nav-li-spacer");

            return $list.append($spacer);
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
            me.$slider = $slider;

            var $close = $("<DIV />");
            $close.addClass("fr-nav-close-container");

            var $span = $("<SPAN>" + locData.getLocData().paramPane.cancel + "</SPAN>");
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
                $(window).off("resize", me._fullScreenCheckCall);
            }
            else {
                me._fullScreenCheck.call(me, 0);
                me.element.fadeIn("fast");
                me._ScrolltoPage();
                $(window).on("resize", { me: me }, me._fullScreenCheckCall);
            }
        },
        //wrapper function used to register window resize event
        _fullScreenCheckCall : function(event){
            var me = event.data.me;
            me._fullScreenCheck.call(me, 100);
        },
        resizeTimer: null,
        //check screen size to decide navigation mode
        _fullScreenCheck: function (delay) {
            var me = this;
            
            if (me.resizeTimer) {
                clearTimeout(me.resizeTimer);
                me.resizeTimer = null;
            }

            me.resizeTimer = setTimeout(function () {
                var $container = me.element.find(".fr-nav-container");
                var $items = me.element.find(".fr-nav-item");
                var $spacer = me.element.find(".fr-nav-li-spacer");
                var $closeButton = me.element.find(".fr-nav-close-container");

                //if (forerunner.device.isSmall(me.$slider.is(":visible") ? me.$slider : me.options.$reportViewer)) {
                //we should used visible area to indicate full screen mode
                if (forerunner.device.isSmall(me.options.$appContainer)) {
                    me.element.addClass("fr-nav-container-full");
                    $container.addClass("fr-nav-container-full");
                    $items.addClass("fr-nav-item-full");
                    $spacer.addClass("fr-nav-li-spacer-full");
                    $closeButton.addClass("fr-nav-close-container-full");
                }
                else {
                    me.element.removeClass("fr-nav-container-full");
                    $container.removeClass("fr-nav-container-full");
                    $items.removeClass("fr-nav-item-full");
                    $spacer.removeClass("fr-nav-li-spacer-full");
                    $closeButton.removeClass("fr-nav-close-container-full");
                }

                me.resizeTimer = null;
            }, delay);
            
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
                var $container = $("ul.fr-nav-container", $(me.element));
                $(".lazy", me.$list).lazyload({
                    $container: $container,
                    onError: function (element) {
                        if (me.$loadMore)
                            me.$loadMore.remove();

                        element.data.parent().remove();
                    },
                });
            }

            me._makeVisible(!me.element.is(":visible"));
            $(".fr-nav-container", $(me.element)).css("position", me.element.css("position"));
           
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