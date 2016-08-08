/**
 * @file Contains the reportViewer widget.
 *
 */

var forerunner = forerunner || {};
forerunner.ssr = forerunner.ssr || {};

$(function () {
    var widgets = forerunner.ssr.constants.widgets;
    var events = forerunner.ssr.constants.events;
    var navigateType = forerunner.ssr.constants.navigateType;

    // The Floating header object holds pointers to the tablix and its row and col header objects
    function floatingHeader($tablix, $rowHeader, $colHeader) {
        this.$tablix = $tablix;
        this.$rowHeader = $rowHeader;
        this.$colHeader = $colHeader;
    }

    // The page object holds the data for each page
    function reportPage(reportObj) {
        this.reportObj = reportObj;
        this.isRendered = false;
    }

    /**
     * Widget used to view a report
     *
     * @namespace $.forerunner.reportViewer
     * @prop {Object} options - The options for reportViewer
     * @prop {String} options.reportViewerAPI - Path to the REST calls for the reportViewer
     * @prop {Integer} options.pingInterval - Interval to ping the server. Used to keep the sessions active
     * @prop {Number} options.toolbarHeight - Height of the toolbar.
     * @prop {Object} options.pageNavArea - jQuery selector object that will the page navigation widget
     * @prop {Object} options.paramArea - jQuery selector object that defineds the report parameter widget
     * @prop {Object} options.DocMapArea - jQuery selector object that defineds the Document Map widget
     * @prop {Object} options.userSettings - User settings used for user specific options
     * @prop {Function} options.onInputBlur - Callback function used to handle input blur event
     * @prop {Function} options.onInputFocus - Callback function used to handle input focus event 
     * @prop {Object} options.$appContainer - Report container
     * @prop {Object} options.parameterModel - Parameter model
     * @prop {Object} options.savePosition - Saved report page scroll position 
     * @prop {String} options.viewerID - Current report viewer id.
     * @prop {String} options.rsInstance - Report service instance name
     * @prop {String} options.showSubscriptionUI - Show Subscription UI if the user has permissions.  Default to false.
     * @prop {String} options.zoom - Zoom factor, default to 100.
     * @prop {function (url)} options.exportCallback - call back function for all exports, will call instead of window.open
     * @prop {function (url)} options.printCallback - call back function for print, will call instead of window.open
     * @prop {Boolean} options.isFullScreen - is the viewer in full screen mode, viewer will handle window scroll
     * @example
     * $("#reportViewerId").reportViewer();
     * $("#reportViewerId").reportViewer("loadReport", reportPath, 1, parameters);
     */
    $.widget(widgets.getFullname(widgets.reportViewer), $.forerunner.viewerBase, /** @lends $.forerunner.reportViewer */ {
        // Default options
        options: {
            reportViewerAPI: forerunner.config.forerunnerAPIBase() + "ReportViewer",
            //reportPath: null,
            //pageNum: 1,
            pingInterval: 300000,
            toolbarHeight: 0,
            pageNavArea: null,
            paramArea: null,
            DocMapArea: null,
            userSettings: null,
            //savedParameters: null,
            onInputBlur: null,
            onInputFocus: null,
            $appContainer: null,
            parameterModel: null,
            savePosition: null,
            viewerID: null,
            rsInstance: null,
            showSubscriptionUI: false,
            zoom: "100",
            exportCallback: undefined,
            $ReportViewerInitializer: null,
            isFullScreen: true
        },

        // Constructor
        _create: function () {
            var me = this;
            forerunner.ssr._internal.init();

            // Make sure the viewerBase _create gets called
            me._super();

            setInterval(function () { me._sessionPing(); }, me.options.pingInterval);

            // ReportState
            me.actionHistory = [];
            me.curPage = 0;
            me.pages = {};
            me.reportPath = "";
            me.pageNum = 0;
            me.savedParameters = null;
            me.sessionID = "";
            me.numPages = 0;
            me.lock = 0;
            me.$reportContainer = new $("<DIV class='fr-report-container'/>");
            me.$reportAreaContainer = null;            
            me.floatingHeaders = [];
            me.paramLoaded = false;
            me.scrollTop = 0;
            me.scrollLeft = 0;
            me.finding = false;
            me.findStartPage = null;
            me.findEndPage = null;
            me.findKeyword = null;
            me.hasDocMap = false;
            me.docMapData = null;
            me.togglePageNum = 0;
            me.pageNavOpen = false;
            me.savedTop = 0;
            me.savedLeft = 0;
            me.origionalReportPath = "";
            me._setPageCallback = null;
            me.renderError = false;
            me.autoRefreshID = null;
            me.reportStates = { toggleStates: new forerunner.ssr.map(), sortStates: [] };
            me.renderTime = new Date().getTime();
            me.paramDefs = null;
            me.credentialDefs = null;
            me.datasourceCredentials = null;
            me.viewerID = me.options.viewerID ? me.options.viewerID : Math.floor((Math.random() * 100) + 1);
            me.SaveThumbnail = false;
            me.RDLExtProperty = null;
            me.isDebug = (forerunner.config.getCustomSettingsValue("Debug", "off") === "on" ? true : false);            
            me.zoomState = true;
            me.allowZoom(me.zoomState);

            me.locData = forerunner.localize;

            var isTouch = forerunner.device.isTouch();
            // For touch device, update the header only on scrollstop.
            if (isTouch) {
                $(window).on("scrollstop", function () { me._updateTableHeaders(me); });                
            } else {                
                $(window).on("scroll", function () { me._updateTableHeaders(me); });
            }

            //setup orientation change
            if (!forerunner.device.isMSIE8())
                window.addEventListener("orientationchange", function () {
                    me._ReRender.call(me);
                }, false);

            //load the report Page requested
            me.element.append(me.$reportContainer);
            //me._addLoadingIndicator();
            me.hideDocMap();

            if (me.options.parameterModel) {
                me.options.parameterModel.on(events.parameterModelSetChanged(), function (e, args) {
                    me._onModelSetChanged.call(me, e, args);
                });
            }

            if (me.options.showSubscriptionOnOpen) {
                var subscriptionID = me.options.showSubscriptionOnOpen;
                $(me.element).on(events.reportViewerSetPageDone(), function (e, data) {
                    if (me.options.showSubscriptionOnOpen) {
                        delete me.options.showSubscriptionOnOpen;
                        me.editEmailSubscription(subscriptionID);
                    }
                });
            }
        },
        _init: function () {
            var me = this;
            me._super(me.$reportContainer);

            me.options.$appContainer.off(events.saveRDLDone);
            me.options.$appContainer.on(events.saveRDLDone, function (e, data) {
                me._updateRDLExt(data);
            });

            me.options.$appContainer.off(events.renameItem);
            me.options.$appContainer.on(events.renameItem, function (e, data) {
                me.reportPath = data.newPath || me.reportPath;
            });
        },
        _checkPermission: function (path,done) {
            var me = this;
            //Create Subscription: create subscription
            //update properties: update report properties (tags)
            //for more properties, add to the list
            var permissionList = ["Create Subscription", "Update Properties"];
            
            if (me.dynamicReport === true) {
                //Set permissions to something
                if (done)
                    done();
                return;
            }
            else {
                me.permissions = forerunner.ajax.hasPermission(path, permissionList.join(","), me.options.rsInstance, function (permission) {
                    me.permissions = permission;
                    if (done)
                        done();
                });
            }
        },
        /**
         * Get current user permission
         *
         * @function $.forerunner.reportViewer#getPermission
         * 
         * @return {Object} - permission jQuery object
         */
        getPermissions: function () {
            var me = this;

            return me.permissions;
        },
        /**
         * Get current user settings
         *
         * @function $.forerunner.reportViewer#getUserSettings
         *
         * @return {Object} - Current user settings
         */
        getUserSettings: function () {
            return this.options.userSettings;
        },
        /**
         * Get the flag to indicate whether to show subscription UI
         *
         * @function $.forerunner.reportViewer#showSubscriptionUI
         * @return {Boolean} - Flag to indicate whether to show subscription UI
         */
        showSubscriptionUI: function() {
            return this.options.showSubscriptionUI;
        },
        /**
         * Get current page number
         *
         * @function $.forerunner.reportViewer#getCurPage
         * @return {Integer} - Current page number
         */
        getCurPage: function () {
            var me = this;
            return parseInt(me.curPage, 10);
        },
        /**
         * Get current number of pages
         *
         * @function $.forerunner.reportViewer#getNumPages
         * @return {Integer} - Current number of pages
         */
        getNumPages: function () {
            var me = this;
            return me.numPages;
        },
        /**
         * Get report viewer API path
         *
         * @function $.forerunner.reportViewer#getReportViewerAPI
         * @return {String} - Path to the report viewer API
         */
        getReportViewerAPI: function () {
            var me = this;
            return me.options.reportViewerAPI;
        },
        /**
         * Get current report path
         *
         * @function $.forerunner.reportViewer#getReportPath
         * @return {String} - Path to current report path
         */
        getReportPath: function () {
            var me = this;
            return me.reportPath;
        },
        /**
         * Get current report session ID
         *
         * @function $.forerunner.reportViewer#getSessionID
         * @return {String} - Session ID
         */
        getSessionID: function () {
            var me = this;
            return me.sessionID;
        },
        /**
         * Get current report contain document map or not
         *
         * @function $.forerunner.reportViewer#getHasDocMap
         * @return {Boolean} - Whether document map exist
         */
        getHasDocMap: function () {
            var me = this;
            return me.hasDocMap;
        },
        /**
         * Get datasource credentials data
         *
         * @function $.forerunner.reportViewer#getDataSourceCredential
         * @return {Object} Datasource credential if saved datasource credential exist; return null if not
         */
        getDataSourceCredential: function () {
            var me = this;
            return me.datasourceCredentials ? me.datasourceCredentials : null;
        },
        /**
         * Trigger an report viewer event
         *
         * @function $.forerunner.reportViewer#triggerEvent
         *
         * @paran {String} eventName - Event name
         * @paran {Object} eventData - Data pass with event
         */
        triggerEvent: function (eventName,eventData) {
            var me = this;
            return me._trigger(eventName,null,eventData);
        },
        _setColHeaderOffset: function ($tablix, $colHeader) {
            //Update floating column headers
            //var me = this;

            if (!$colHeader)
                return;

            var offset = $tablix.offset();
            var scrollLeft = $(window).scrollLeft();
            if ((scrollLeft > offset.left) && (scrollLeft < offset.left + $tablix.width())) {
                //$colHeader.css("top", $tablix.offset.top);
                $colHeader.css("left", Math.min(scrollLeft - offset.left, $tablix.width() - $colHeader.width()) + "px");
                $colHeader.css("visibility", "visible");
            }
            else {
                $colHeader.css("visibility", "hidden");                
            }
        },
        _setRowHeaderOffset: function ($tablix, $rowHeader) {
            //  Update floating row headers
            var me = this;
            if (!$rowHeader)
                return;

            var offset = $tablix.offset();
            var scrollTop = $(window).scrollTop();            
            if ((scrollTop > offset.top) && (scrollTop < offset.top + $tablix.innerHeight())) {
                $rowHeader.css("top", (Math.min((scrollTop - offset.top), ($tablix.height() - $rowHeader.innerHeight())) + me.options.toolbarHeight) + "px");
                $rowHeader.css("visibility", "visible");
            }
            else {
                $rowHeader.css("visibility", "hidden");
            }
        },
        _ReRender: function (force) {
            var me = this;
           
            if (me.options.userSettings && me.options.userSettings.responsiveUI === true) {
                $.each(me.pages, function (index, page) {
                    if (page) page.needsLayout = true;
                });

                me._reLayoutPage(me.curPage, force);                
            }
        },
        /**
         * Switch the responsive UI status
         *
         * @function $.forerunner.reportViewer#toggleResponseUI
         */
        toggleResponseUI: function() {
            var me = this;

            me.layoutReport(!me.options.responsiveLayout);
        },
        /**
         * Re-layout the current report, with the given responsive layour directive
         *
         * @function $.forerunner.reportViewer#LayoutReport
         *
         * @param {Boolean} responsive - Layout with responsive or not.
         */
        layoutReport: function (responsive) {
            var me = this;

            me.options.responsiveLayout = responsive;

            $.each(me.pages, function (index, page) {
                if (page) page.needsLayout = true;
            });

            me._reLayoutPage(me.curPage);

        },
        /**
       * Get current Scroll Position
       *
       * @function $.forerunner.reportViewer#getScrollPosition
       */
        getScrollPosition: function () {
            var me = this;
            var position = {};

            if (me._ScrollInner) {
                position.left = me.$reportAreaContainer.scrollLeft();
                position.top = me.$reportAreaContainer.scrollTop();
            }
            else if ($(me.element).css("overflow-y") === "scroll" || $(me.element).css("overflow-y") === "auto") {
                position.left = $(me.element).scrollLeft();
                position.top = $(me.element).scrollTop();
            }
            else {
                position.left = $(window).scrollLeft();
                position.top = $(window).scrollTop();
            }
            return position;
        },

        /**
        * Save Scroll Position
        *
        * @function $.forerunner.reportViewer#saveScrollPosition
        */
        saveScrollPosition: function () {
            var me = this;

            var pos = me.getScrollPosition();

            me.scrollLeft = pos.left;
            me.scrollTop = pos.top;

        },

        /**
         * Re-layout the report
         *
         * @function $.forerunner.reportViewer#windowResize
         */
        windowResize: function () {
            var me = this;

            //If not full screen app needs to handle
            if (me.options.isFullScreen) {
                me.saveScrollPosition();

                me._ReRender.call(me);
                me.scrollReportTo();
            }
            
        },
        _removeCSS: function () {
            var me = this;

            var sty = $("head").find("style");
            for (var i = 0; i < sty.length; i++) {
                if (sty[i].id === me.viewerID.toString()) {
                    var e = sty[i];
                    e.parentNode.removeChild(e);
                }
            }
        },


        /**
        * This is a total hack to get IOS and fixed headers to work correctly
        * Currently this needs to be called on iOS8 when in full screen viewer mode
        *
        * @function $.forerunner.reportViewer#scrollReportBody
        */
        scrollReportBody: function () {
            var me = this;

            //This is only called in full screen on IOS.
            if (!forerunner.device.isChrome() && forerunner.config.getCustomSettingsValue("AppleFixedToolbarBug", "on") === "on") {
                if (me.$reportAreaContainer) {
                    me.$reportAreaContainer.css("display", "block");
                    // me.$reportAreaContainer.css("width", me._getPageSizeObject().width());
                    //me.$reportAreaContainer.css("width", $(window).width());
                    me.$reportAreaContainer.css("height", $(window).height() - me.options.toolbarHeight );                     
                    me.$reportAreaContainer.css("overflow", "auto");
                    
                    me._ScrollInner = true;
                }
            }
            else {
                if (me.$reportAreaContainer) {
                    me.$reportAreaContainer.css("display", "table-cell");
                    me.$reportAreaContainer.css("overflow", "");

                    me._ScrollInner = false;
                }
            }

  
        },
        /**       
       * Scolls the report ot the current set locaion or position specified        
       *
       * @function $.forerunner.reportViewer#scrollReportTo
       * @param {object} position - optional position object with top and left
       */
        scrollReportTo: function (position) {
            var me = this;

            if (!position) {
                position = {};
                position.left = me.scrollLeft;
                position.top = me.scrollTop;
            }

            if (me._ScrollInner) {
                me.$reportAreaContainer.scrollLeft(position.left);
                me.$reportAreaContainer.scrollTop(position.top);
            }
            else {
                $(window).scrollLeft($(me.element).offset().left + position.left);

                if (me.options.paramArea && me.options.paramArea.reportParameter("option", "isTopParamLayout")) {
                    $(window).scrollTop($(me.element).offset().top + position.top - me.options.toolbarHeight - $(me.options.paramArea).height());
                } else {
                    $(window).scrollTop($(me.element).offset().top + position.top - me.options.toolbarHeight);
                }
            }

        },

        _setPage: function (pageNum) {
            //  Load a new page into the screen and udpate the toolbar
            var me = this;

            if (!me.pages[pageNum].isRendered)
                me._renderPage(pageNum);
            

            if ($(".fr-report-areacontainer", me.$reportContainer).length === 0) {
                var errorpage = me.$reportContainer.find(".Page");
                if (errorpage)
                    errorpage.detach();
                me.$reportAreaContainer = $("<Div/>");
                me.$reportAreaContainer.addClass("fr-report-areacontainer");
                me.$reportContainer.append(me.$reportAreaContainer);
              
                me._touchNav();
                me._removeDocMap();
            }
            else {
                me.$reportAreaContainer.find(".Page").detach();                  
            }          
            
            me.$reportAreaContainer.append(me._getPageContainer(pageNum));            
            me._removeCSS();

            if (!$.isEmptyObject(me.pages[pageNum].CSS))
                me.pages[pageNum].CSS.appendTo("head");
           
            if (!me.renderError) {
                //relayout page if needed
                me._reLayoutPage(pageNum);

                me.curPage = pageNum;
                me._trigger(events.changePage, null, { newPageNum: pageNum, paramLoaded: me.paramLoaded, numOfVisibleParameters: me.$numOfVisibleParameters, renderError: me.renderError, credentialRequired: me.credentialDefs ? true : false });
            }

            //If not full screen app needs to handle
            if (me.options.isFullScreen) {
                me.scrollReportTo();
            }

            me.removeLoadingIndicator();
            me.lock = 0;

            if (typeof (me._setPageCallback) === "function") {
                me._setPageCallback();
                me._setPageCallback = null;
            }
            
            // Make sure each new page has the zoom factor applied or options zoom
            //me.zoomToPercent();
            me._setOptionsZoom();

            // Trigger the change page event to allow any widget (E.g., toolbar) to update their view
            me._trigger(events.setPageDone, null, { newPageNum: me.curPage, paramLoaded: me.paramLoaded, numOfVisibleParameters: me.$numOfVisibleParameters, renderError: me.renderError, credentialRequired: me.credentialDefs ? true : false });
        },
        /**
         * Get the current zoom factor
         *
         * @function $.forerunner.reportViewer#getZoomFactor
         */
        getZoomFactor: function () {
            var me = this;
            if (!me._zoomFactor) {
                me._zoomFactor = 100;
            }
            return me._zoomFactor;
        },
        /**
         * Zoom to the specified percent value
         *
         * @function $.forerunner.reportViewer#zoomToPercent
         *
         * @param {number} percent - percentage (I.e., 100 = 100%)
         *
         * @return {bool} - true = zoom factor change, false = percent not a number
         */
        zoomToPercent: function (percent,isPageOption) {
            var me = this;
            var zoomFactor;

            if (me.zooming === true)
                return;

            me.zooming = true;

            if (!percent) {
                // Reset the zoom. This happens during a page change
                zoomFactor = me.getZoomFactor();
            } else {
                // Set a new percent factor
                zoomFactor = parseFloat(percent);
                if (isNaN(zoomFactor)) {
                    me._trigger(events.zoomChange, null, { zoomFactor: me._zoomFactor, $reportViewer: me.element });
                    me.zooming = false;
                    return false;
                }
            }

            me._zoomFactor = zoomFactor;
            var page = me.$reportAreaContainer.find(".Page");

            if (forerunner.device.isFirefox() === true) {
                var scaleFactor = me._zoomFactor / 100.0;
                page.css("transform", "scale(" + scaleFactor + "," + scaleFactor + ")");
                page.css("transform-origin", "left top");
            } else {
                page.css("zoom", " " + me._zoomFactor + "%");
            }

            me._trigger(events.zoomChange, null, { zoomFactor: me._zoomFactor, $reportViewer: me.element });
            me.element.hide().show(0);
            if (isPageOption !== true)
                me.options.zoom = percent;
            me.zooming = false;
            return true;
        },
        /**
         * Toggles the Zoom To Page width on or off
         *
         * @function $.forerunner.reportViewer#toggleZoomPageWidth
         */
        toggleZoomPageWidth: function () {
            var me = this;
            if (!me._zoomFactor) {
                me._zoomFactor = 100;
            }

            if (me.options.zoom === "page width")
            {
                me.zoomToPercent(100);
                me.options.zoom = "100";
            } else {
                me.zoomToPageWidth();
            }
        },
        /**
         * Zoom To Page width
         *
         * @function $.forerunner.reportViewer#zoomToPageWidth
         */
        zoomToPageWidth : function() {
            var me = this;
            var page = me._getPageSizeObject();
            var pageWidthZoom = (me.element.visibleSize().width / page.width()) * 100;
            me.zoomToPercent(pageWidthZoom,true);
            me.options.zoom = "page width";
        },

        /**
         * Zoom To show the whole page
         *
         * @function $.forerunner.reportViewer#zoomToWhoePage
         */
        zoomToWholePage: function () {
            var me = this;
            var page = me._getPageSizeObject();
            var vSize = me.element.visibleSize();
            var heightScale = (vSize.height / page.height());
            var widthScale = (vSize.width / page.width());

            var pageWholePageZoom = Math.min(widthScale * 100, heightScale * 100);
            me.zoomToPercent(pageWholePageZoom, true);
            me.options.zoom = "whole page";
        },

        _addSetPageCallback: function (func) {
            if (typeof (func) !== "function") return;

            var me = this;
            var priorCallback = me._setPageCallback;

            if (priorCallback === null) {
                me._setPageCallback = func;
            } else {
                me._setPageCallback = function () {
                    priorCallback();
                    func();
                };
            }
        },

        //This is needed for the IOS hack workaround.  Get the table in the page to get real size
        _getPageSizeObject: function () {
            var me = this;

            var page = me.$reportAreaContainer.find(".Page");
           
            return page.children("table");

        },
        
        // Windows Phones need to be reloaded in order to change their viewport settings
        // so what we will do in this case is to set our state into the sessionStorage
        // and reload the page. Then in the loadPage function we will check if this is
        // a reload page case so as to set the zoom
        _allowZoomWindowsPhone: function (isEnabled) {
            var me = this;

            //Turn this off, just leave zoom on.

            return;
            //if (!me.reportPath || me.reportPath === "")
            //    return;

            //// Save a copy of the page into the action history
            //me.backupCurPage(true);

            //// Make the action history ready to stringify (I.e., remove any unneeded object references)
            //$.each(me.actionHistory, function (index, actionItem) {
            //    $.each(actionItem.reportPages, function (index, reportPage) {
            //        reportPage.$container = null;
            //        reportPage.CSS = null;
            //        reportPage.isRendered = false;
            //    });
            //});

            //// Save the action history into the session storage
            //sessionStorage.forerunner_zoomReload_actionHistory = JSON.stringify({ actionHistory: me.actionHistory });

            //// Save the reuested zoom state
            //sessionStorage.forerunner_zoomReload_userZoom = JSON.stringify({ userZoom: isEnabled ? "zoom" : "fixed" });

            //// Now reload the page from the saved state
            //window.location.reload();
        },

        /**
         * Show or hide the toolbar for zooming
         *
         * @function $.forerunner.reportViewer#showToolbar
         *
         * @param {Boolean} isVisible - true to show toolbar, false to hide
         */
        showToolbar: function (isVisible) {
            var me = this;
            me._trigger(events.allowZoom, null, { isEnabled: !isVisible });
        },

        /**
         * Set zoom enable or disable
         *
         * @function $.forerunner.reportViewer#allowZoom
         *
         * @param {Boolean} isEnabled - True to enable zoom, False to disable
         */
        allowZoom: function (isEnabled,hideToolBar) {
            var me = this;

            if (forerunner.device.isWindowsPhone() && !forerunner.device.isWindowsPhone81()) {
                me._allowZoomWindowsPhone(isEnabled);
                return;
            }

            if (isEnabled === true) {
                forerunner.device.allowZoom(true);
                me.allowSwipe(false);
            }
            else {
                forerunner.device.allowZoom(false);
                me.allowSwipe(true);
            }

        },
        /**
         * Function execute when input element blur
         *
         * @function $.forerunner.reportViewer#onInputBlur
         */
        onInputBlur: function () {
            var me = this;
            if (me.options.onInputBlur)
                me.options.onInputBlur.call(me);
        },
        /**
         * Function execute when input element focus
         *
         * @function $.forerunner.reportViewer#onInputFocus
         */
        onInputFocus: function () {
            var me = this;

            if (me.options.onInputFocus)
                me.options.onInputFocus();
        },

        _allowSwipe: true,
        /**
         * Set swipe enable or disable
         *
         * @function $.forerunner.reportViewer#allowSwipe
         *
         * @param {Boolean} isEnabled - True to enable swipe, False to disable
         */
        allowSwipe: function(isEnabled){
            var me = this;
            me._allowSwipe = isEnabled;
        },
        _navToPage: function (newPageNum) {
            var me = this;
            if (me._allowSwipe === true) {
                me.navToPage(newPageNum);
            }
        },
        _touchNav: function () {
            
            var me = this;          

            $(me.element).hammer({ stop_browser_behavior: { userSelect: false }, swipe_max_touches: 2, drag_max_touches: 2 }).on("touch release",
                function (ev) {
                    if (!ev.gesture) return;
                    switch (ev.type) {
                        // Hide the header on touch
                        case "touch":
                            me._hideTableHeaders();
                            break;

                            // Show the header on release only if this is not scrolling.
                            // If it is scrolling, we will let scrollstop handle that.
                        case "release":
                            var swipeNav = false;
                            if (ev.gesture.touches.length > 1) {
                                swipeNav = true;
                            }
                            if (ev.gesture.velocityX === 0 && ev.gesture.velocityY === 0)
                                me._updateTableHeaders(me);
                            
                            if (forerunner.device.isTouch() && forerunner.config.getCustomSettingsValue("EnableGestures", "off") === "on") {
                                if ((ev.gesture.direction === "left" || ev.gesture.direction === "up") && swipeNav) {
                                    ev.gesture.preventDefault();
                                    me._navToPage(me.curPage + 1);
                                    break;
                                }

                                if ((ev.gesture.direction === "right" || ev.gesture.direction === "down") && swipeNav) {
                                    ev.gesture.preventDefault();
                                    me._navToPage(me.curPage - 1);
                                    break;
                                }
                            }

                    }
                }
            );
        },

        _resetExecution: function(done){
            var me = this;

            forerunner.ajax.ajax({
                url: me.options.reportViewerAPI + "/ResetExecution/",
                data: {
                    SessionID: me.sessionID,
                    instance: me.options.rsInstance,
                },
                dataType: "json",
                success: function (data) {                   
                    done();
                },
                fail: function () {
                    //This should not happen;
                    //ToDo Show error
                }
            });

        },
        /**
         * Refreshes current report
         *
         * @function $.forerunner.reportViewer#refreshReport
         *
         * @param {Integer} curPage - Current page number
         */
        refreshReport: function (curPage) {
            // Remove all cached data on the report and re-run
            var me = this;
            var paramList = null;

            if (me.lock === 1)
                return;

            if (curPage === undefined)
                curPage = 1;

            
            me.renderTime = new Date().getTime();

            me.lock = 1;
            me._revertUnsubmittedParameters();

            if (me.paramLoaded === true) {                
                paramList = me.options.paramArea.reportParameter("getParamsList");
            }
            me._resetViewer(true);
            me._trigger(events.refresh);

            me._resetExecution(function () {
                me._loadPage(curPage, false, null, paramList, true);
            });
        },
        /**
         * Navigates to the given page
         *
         * @function $.forerunner.reportViewer#navToPage
         *
         * @param {Ingeter} newPageNum - Page number to navigate to
         */
        navToPage: function (newPageNum) {
            var me = this;

            //Go to last page
            if (newPageNum === 0)
                newPageNum = 1000000;

            if (newPageNum === me.curPage || me.lock === 1)
                return;
            me._resetContextIfInvalid(function () {
                me.scrollLeft = 0;
                me.scrollTop = 0;

                if (newPageNum > me.numPages && me.numPages !== 0) {
                    newPageNum = 1;
                }
                if (newPageNum < 1) {
                    newPageNum = me.numPages;
                }

                if (newPageNum !== me.curPage) {
                    if (me.lock === 0) {
                        me.lock = 1;
                        me._loadPage(newPageNum, false);
                    }
                }
            });
        },
        _hideDocMap: function() {
            var me = this;
            var docMap = me.options.docMapArea;

            me.savedTop = 0;
            me.savedLeft = 0;

            docMap.hide();
            me.element.unmask();
            me._trigger(events.hideDocMap);
        },
        _showDocMap: function () {
            var me = this;

            //do this after get data
            var done = function () {
                var pos = me.getScrollPosition();

                me.savedTop = pos.top;
                me.savedLeft = pos.left;

                me.element.mask();
                me.options.docMapArea.slideUpShow();
                me._trigger(events.showDocMap);

                //if doc map opened from toolpane, DefaultAppTemplate will pass savePosition here.
                setTimeout(function () {
                    if (me.options.savePosition) {
                        me.savedTop = me.options.savePosition.top;
                        me.savedLeft = me.options.savePosition.left;
                        me.options.savePosition = null;
                    }
                }, 100);
            };


            me._resetContextIfInvalid(function () {
                var docMap = me.options.docMapArea;
                docMap.reportDocumentMap({ $reportViewer: me });

                //get the doc map
                if (!me.docMapData) {
                    forerunner.ajax.ajax({
                        url: me.options.reportViewerAPI + "/DocMapJSON/",
                        data: {
                            SessionID: me.sessionID,
                            instance: me.options.rsInstance,
                        },
                        dataType: "json",      
                        success: function (data) {
                            me.docMapData = data;
                            docMap.reportDocumentMap("write", data);
                            done();
                        },                        
                        fail: function () { me._showMessageBox(me.locData.getLocData().messages.docmapShowFailed); }
                    });
                }
                else
                    done();
                
            });
        },
        _removeDocMap: function () {
            //Verify whether document map code exist in previous report
            var me = this;

            if ($(".fr-docmap-panel").length !== 0) {
                me.hideDocMap();
                me.docMapData = null;
                $(".fr-docmap-panel").remove();
            }
        },
        /**
         * Hides the Document Map if it is visible
         *
         * @function $.forerunner.reportViewer#hideDocMap
         */
        hideDocMap: function () {
            var me = this;
            var docMap = me.options.docMapArea;

            if (!me.hasDocMap || !docMap)
                return;

            if (docMap.is(":visible")) {
                me._hideDocMap();
            }
        },
        /**
         * Shows Document Map
         *
         * @function $.forerunner.reportViewer#showDocMap
         */
        showDocMap: function () {
            var me = this;
            var docMap = me.options.docMapArea;

            if (!me.hasDocMap || !docMap)
                return;

            if (docMap.is(":visible")) {
                me._hideDocMap();
                return;
            }
            me._showDocMap();
        },
        _cachePages: function (initPage) {
            var me = this;
             
            initPage = parseInt(initPage, 10);
            
            var low = initPage - 1;
            var high = initPage + 1;
            if (low < 1) low = 1;
            if (high > me.numPages && me.numPages !== 0 )
                high = me.numPages;

            for (var i = low; i <= high; i++) {
                if (!me.pages[i])
                    if (i !== initPage)
                        me._loadPage(i, true);
            }

        },

        /**
         * Returns the number of actions in history for the back event
         *
         * @function $.forerunner.reportViewer#actionHistoryDepth
         *
         * @return {Integer} - Action history length
         */
        actionHistoryDepth:function(){
            return this.actionHistory.length;
        },

        /**
         * Returns the action history stack
         *
         * @function $.forerunner.reportViewer#getActionHistory
         *
         * @return {array} - Action history 
         */
        getActionHistory: function () {
            return this.actionHistory;
        },

        /**
      * Plays an antion from the action history stack
      *
      * @function $.forerunner.reportViewer#playActionHistory
      *      
      */
        playActionHistory: function (action) {
            var me = this;

            if (action) {
                me._clearReportViewerForDrill();

                me.reportPath = action.ReportPath;
                me.sessionID = action.SessionID;
                me.curPage = action.CurrentPage;

                me.hideDocMap();
                me.scrollLeft = action.ScrollLeft;
                me.scrollTop = action.ScrollTop;
                me.reportStates = action.reportStates;
                me.renderTime = action.renderTime;
                me.renderError = action.renderError;
                me.paramMetadata = action.paramMetadata;
                me.isDrillThrough = action.isDrillThrough;

                if (action.credentialDefs !== null) {
                    me.credentialDefs = action.credentialDefs;
                    me.datasourceCredentials = action.savedCredential;

                    if (!me.$credentialDialog)
                        me.$credentialDialog = me.options.$appContainer.find(".fr-dsc-section");

                    me.$credentialDialog.dsCredential("resetSavedCredential", me.credentialDefs.CredentialsList, me.datasourceCredentials);
                }

                //Trigger Change Report, disables buttons.  Differnt than pop
                me._trigger(events.changeReport, null, { path: me.reportPath, credentialRequired: me.credentialDefs ? true : false });

                //This means we changed reports
                if (action.FlushCache) {
                    me._removeParameters();
                    me.flushCache();
                    me.pages = action.reportPages;
                    me.paramDefs = action.paramDefs;

                    me.numPages = action.reportPages[action.CurrentPage].reportObj.ReportContainer.NumPages ? action.reportPages[action.CurrentPage].reportObj.ReportContainer.NumPages : 0;

                    if (action.paramDefs) {
                        me.options.paramArea.reportParameter({
                            $reportViewer: me,
                            $appContainer: me.options.$appContainer,
                            $ReportViewerInitializer: me.options.$ReportViewerInitializer,
                            RDLExt: me.getRDLExt()
                        });
                        me.options.paramArea.reportParameter("setParametersAndUpdate", action.paramDefs, action.savedParams, action.CurrentPage);
                        me.$numOfVisibleParameters = me.options.paramArea.reportParameter("getNumOfVisibleParameters");
                        if (me.$numOfVisibleParameters > 0) {
                            me._trigger(events.showParamArea, null, { reportPath: me.reportPath });
                        }
                        me.paramLoaded = true;
                        me.$paramarea = me.options.paramArea;
                    }

                    // Restore the parameterModel state from the action history
                    if (me.options.parameterModel && action.parameterModel)
                        me.options.parameterModel.parameterModel("setModel", action.parameterModel);
                }
                me._loadPage(action.CurrentPage, false, null, null, false, me.pages[me.curPage].Replay, null, true);
            }

        },

        /**
         * Loads and pops the page on the action history stack and triggers a drillBack event or triggers a back event if no action history
         *
         * @function $.forerunner.reportViewer#back
         *
         * @fires reportviewerdrillback
         * @fires reportviewerback
         * @see forerunner.ssr.constants.events
         */
        back: function () {
            var me = this;

            var action = me.actionHistory.pop();
            if (action) {
                me.playActionHistory(action);
                me._trigger(events.actionHistoryPop, null, { path: me.reportPath });
            }
            else {
                me.flushCache();
                me._resetViewer(false);
                //when exit the report we need to set allowZoom to back manually here
                //if nto the onRoute event handler will execute window.history.reload before 
                //reset the allowZoom to false. so page reload and page lost the previous state
                //fixed #1349 by baotong.wang
                forerunner.device.allowZoom(false);

                me._trigger(events.back, null, { path: me.reportPath });
            }
        },
        /**
         * Shows the page navigation pane
         *
         * @function $.forerunner.reportViewer#showNav
         *
         * @fires reportviewershowNav
         * @see forerunner.ssr.constants.events
         */
        showNav: function () {
            var me = this;
            me._resetContextIfInvalid(function () {
                if (me.pageNavOpen) {//close nav
                    me.pageNavOpen = false;
                    if (window.removeEventListener) {
                        window.removeEventListener("orientationchange", me._handleOrientation, false);
                    }
                    else {
                        window.detachEvent("orientationchange", me._handleOrientation);
                    }
                    me.element.unmask(function () { me.showNav.call(me); });
                }
                else {//open nav
                    me.pageNavOpen = true;
                    if (window.addEventListener) {
                        window.addEventListener("orientationchange", me._handleOrientation, false);
                    } else {
                        window.attachEvent("orientationchange", me._handleOrientation);
                    }
                    me.element.mask(function () { me.showNav.call(me); });
                }

                if (me.options.pageNavArea) {
                    me.options.pageNavArea.pageNav("showNav");
                }
                me._trigger(events.showNav, null, { newPageNum: me.curPage, path: me.reportPath, open: me.pageNavOpen });
                me._reLayoutPage(me.curPage);
            });
        },
        _handleOrientation: function () {
            var me = this;
            var pageSection = $(".fr-layout-pagesection");
            if (forerunner.device.isSmall(me.element)) {//big screen, height>=768
                //portrait
                if (pageSection.is(":visible"))
                    pageSection.hide();
            }
            else {//small screen, height<768
                if (pageSection.is(":hidden"))
                    pageSection.show();
            }
        },

        /**
         * Resets the Page Navigation cache
         *
         * @function $.forerunner.reportViewer#flushCache
         */
        flushCache: function () {
            var me = this;
            me.pages = {};
            if (me.options.pageNavArea)
                me.options.pageNavArea.pageNav("reset");
        },
        _saveThumbnail: function () {
            var me = this;
            var url = forerunner.config.forerunnerAPIBase() + "ReportManager" + "/SaveThumbnail";
            if (me.getCurPage() === 1 && !me.SaveThumbnail) {
                me.SaveThumbnail = true;
                forerunner.ajax.ajax({
                    type: "GET",
                    url: url,
                    data: {
                        ReportPath: me.reportPath,
                        SessionID: me.sessionID,
                        Instance: me.options.rsInstance,
                    },
                    success: function (data) {
                        //console.log("Saved");
                    }
                });
            }
        },
        _prepareAction: function (done) {
            var me = this;

            if (me.togglePageNum !== me.curPage || me.togglePageNum === 0) {                
                forerunner.ajax.ajax({
                    type: "POST",
                    url: me.options.reportViewerAPI + "/ReportJSON/",
                    data: {
                        ReportPath: me.reportPath,
                        SessionID: me.sessionID,
                        PageNumber: me.curPage,
                        ParameterList: "",
                        instance: me.options.rsInstance,
                    },
                    dataType: "json",                    
                    success: function (data) {                        
                     
                        me.togglePageNum = me.curPage;
                    },
                    done: function(){
                        if (done)
                            done();
                    },
                    fail: function () { me._showMessageBox(me.locData.getLocData().messages.prepareActionFailed); }
                });
            }
            else if (done)
                done();
                
        },
        _updateSortState: function (id, direction, clear) {
            var me = this;
            if (clear !== false)
                me.reportStates.sortStates = [];
            me.reportStates.sortStates.push({ id: id, direction: direction });
        },
        _getSortResult: function (id, direction, clear) {
            var me = this;
            return forerunner.ajax.ajax({
                dataType: "json",
                url: me.options.reportViewerAPI + "/SortReport/",
                data: {
                    SessionID: me.sessionID,
                    SortItem: id,
                    Direction: direction,
                    ClearExistingSort: clear,
                    instance: me.options.rsInstance,
                },

            });
        },

        _replaySortStates: function () {
            var me = this;
            // Must synchronously replay one-by-one
            var list = me.reportStates.sortStates;
            for (var i = 0; i < list.length; i++) {
                // Only clear it for the first item
                me._getSortResult(list[i].id, list[i].direction, i === 0);
            }
        },
        /**
         * Sorts the current report
         *
         * @function $.forerunner.reportViewer#sort
         *
         * @param {String} direction - Sort direction
         * @param {String} id - Sort item id
         * @param {Boolean} clear - Clear existing sort flag
         * @see forerunner.ssr.constants.sortDirection
         */
        sort: function (direction, id, clear) {
            //Go the other dirction from current
            var me = this;
            var newDir;
            var sortDirection = forerunner.ssr.constants.sortDirection;

            if (me.lock === 1)
                return;
            me.lock = 1;
            me._resetContextIfInvalid(function () {

                if (direction === sortDirection.asc)
                    newDir = sortDirection.desc;
                else
                    newDir = sortDirection.asc;

                me._callSort(id, newDir, clear);
            });
        },

        _callSort: function (id, newDir, clear) {
            var me = this;
            me._updateSortState(id, newDir);
            forerunner.ajax.getJSON(me.options.reportViewerAPI + "/SortReport/",
                {
                    SessionID: me.sessionID,
                    SortItem: id,
                    Direction: newDir,
                    ClearExistingSort: clear,
                    instance: me.options.rsInstance,
                },
                function (data) {
                    me.saveScrollPosition();

                    me.numPages = data.NumPages;
                    me.renderTime = new Date().getTime();
                    var replay = me.pages[me.curPage].Replay;

                    me._loadPage(data.NewPage, false, null, null, true,replay);

                },
                function (jqXHR, textStatus, errorThrown, request) { me._writeError(jqXHR, textStatus, errorThrown, request); }
            );
        },
        
        _isReportContextValid: true,
        /**
         * Set isReportContextValid to false
         *
         * @function $.forerunner.reportViewer#invalidateReportContext
         */
        invalidateReportContext : function() {
            this._isReportContextValid = false;
        },
        _callGetReportJSON: function (done) {
            var me = this;
            var paramList = null;
            if (me.paramLoaded) {
                var $paramArea = me.options.paramArea;
                //get current parameter list without validate
                paramList = $paramArea.reportParameter("getParamsList", true);
            }
            forerunner.ajax.ajax(
                {
                    type: "POST",
                    dataType: "json",
                    url: me.options.reportViewerAPI + "/ReportJSON/",
                    data: {
                        ReportPath: me.reportPath,
                        SessionID: me.sessionID,
                        PageNumber: me.getCurPage(),
                        ParameterList: paramList,
                        instance: me.options.rsInstance,
                    },
                    success: function (data) {
                        me._isReportContextValid = true;
                    },
                    done: function ()
                    {
                        if (done)
                            done();
                    }
                });           

        },
        _updateToggleState: function (toggleID) {
            var me = this;
            if (me.reportStates.toggleStates.has(toggleID)) {
                me.reportStates.toggleStates.remove(toggleID);
            } else {
                me.reportStates.toggleStates.add(toggleID);
            }
        },

        _getToggleResult: function (toggleID,done) {
            var me = this;
            return forerunner.ajax.ajax({
                dataType: "json",
                url : me.options.reportViewerAPI + "/NavigateTo/",
                data: {
                    NavType: navigateType.toggle,
                    SessionID: me.sessionID,
                    UniqueID: toggleID,
                    instance: me.options.rsInstance,
                },

            });
        },
        
        _replayToggleStates : function() {
            var me = this;
            // Must synchronously replay one-by-one
            var keys = me.reportStates.toggleStates.keys();
            for (var i = 0; i < keys.length; i++) {
                //Made async, should queue in order.  If nat may need to change
                me._getToggleResult(keys[i]);
            }
        },
        /**
         * Toggle specify item of the report
         *
         * @function $.forerunner.reportViewer#toggleItem
         *
         * @param {String} toggleID - Id of the item to toggle
         * @param {String} scrollID - The element to scroll to after the toggle
         */
        toggleItem: function (toggleID,scrollID) {
            var me = this;
            if (me.lock === 1)
                return;
            me.lock = 1;

            me.showLoadingIndictator();
            me._resetContextIfInvalid(function () {
                me._prepareAction(function () {
                    me._callToggle(toggleID, scrollID);
                });
            });
            
            
        },
        
        _callToggle: function (toggleID, scrollID) {
            var me = this;
            me._updateToggleState(toggleID);
            forerunner.ajax.getJSON(me.options.reportViewerAPI + "/NavigateTo/",
                {
                    NavType: navigateType.toggle,
                    SessionID: me.sessionID,
                    UniqueID: toggleID,
                    instance: me.options.rsInstance,
                },
                function (data) {
                    if (data.Result === true) {
                        me.saveScrollPosition();

                        var replay = me.pages[me.curPage].Replay;
                        me.renderTime = new Date().getTime();
                        me.pages[me.curPage] = null;
                        me._loadPage(me.curPage, false, null, null, true, replay, scrollID);                        
                    }
                    else
                        me.lock = 0;
                },
                function (jqXHR, textStatus, errorThrown, request) { me.lock = 0; me._writeError(jqXHR, textStatus, errorThrown, request); }
            );
        },

        _resetContextIfInvalid: function (done) {
            var me = this;
            me._revertUnsubmittedParameters();
            if (!me._isReportContextValid) {
                me._callGetReportJSON(function () {
                    // Replay sort states
                    me._replaySortStates(function () {
                        // Replay toggle states
                        me._replayToggleStates(function () {
                            if (done)
                                done();
                        });
                    });
                });
            }
            else if (done)
                done();
                
            
        },

        _revertUnsubmittedParameters: function () {
            var me = this;
            if (me.paramLoaded) {
                var $paramArea = me.options.paramArea;
                //get current parameter list without validate
                return $paramArea.reportParameter("revertParameters");
            }
        },
        /**
         * Navigate to the given bookmark
         *
         * @function $.forerunner.reportViewer#navigateBookmark
         *
         * @param {String} bookmarkID - Id of the bookmark
         */
        navigateBookmark: function (bookmarkID) {
            var me = this;
            if (me.lock === 1)
                return;
            me.lock = 1;
            me._resetContextIfInvalid(function () {
                me._prepareAction(function () {
                    forerunner.ajax.getJSON(me.options.reportViewerAPI + "/NavigateTo/",
                        {
                            NavType: navigateType.bookmark,
                            SessionID: me.sessionID,
                            UniqueID: bookmarkID,
                            instance: me.options.rsInstance,
                        },
                        function (data) {
                            if (data.NewPage === me.curPage) {
                                me._navToLink(bookmarkID);
                                me.lock = 0;
                            } else {
                                if (data.NewPage !== undefined && data.NewPage > 0) {
                                    me.backupCurPage();
                                    me._loadPage(data.NewPage, false, bookmarkID);
                                } else {
                                    me._showMessageBox(me.locData.getLocData().messages.bookmarkNotFound);
                                    me.lock = 0;
                                }
                            }
                        },
                        function (jqXHR, textStatus, errorThrown, request) { me.lock = 0; me._writeError(jqXHR, textStatus, errorThrown, request); }
                    );
                });
            });
        },

        /**
         * Determines if the current report being viewed is the result of a drillthrough action
         *
         * @function $.forerunner.reportViewer#isDrillThroughReport
         *
         * @return {Boolean} - True if current report is the result of a drillthrough action, false else
         */
        isDrillThroughReport: function () {
            var me = this;

            return me.isDrillThrough;
        },
        /**
         * Navigate to the given drill through item
         *
         * @function $.forerunner.reportViewer#navigateDrillthrough
         *
         * @param {String} drillthroughID - Id of the drill through item
         */
        navigateDrillthrough: function (drillthroughID) {
            var me = this;
            if (me.lock === 1)
                return;
            me.lock = 1;
            me.showLoadingIndictator();
            me._resetContextIfInvalid(function () {
                me._prepareAction(function () {
                    if (me.isDebug) {
                        console.log("DrillThough", { session: me.sessionID, drillThrough: drillthroughID });
                    }
                    forerunner.ajax.getJSON(me.options.reportViewerAPI + "/NavigateTo/",
                        {
                            NavType: navigateType.drillThrough,
                            SessionID: me.sessionID,
                            UniqueID: drillthroughID,
                            instance: me.options.rsInstance,
                        },
                        function (data) {
                            me.backupCurPage(true);
                            if (data.Exception) {
                                me._renderPageError(me.$reportAreaContainer.find(".Page"), data);
                                me.removeLoadingIndicator();
                                me.lock = 0;
                            }
                            else {
                                me.renderError = false;
                                me.sessionID = data.SessionID;
                                me.RDLExtProperty = null;
                                me.isDrillThrough = true;
                                if (me.origionalReportPath === "")
                                    me.origionalReportPath = me.reportPath;
                                me.reportPath = data.ReportPath;
                                if (me.options.parameterModel)
                                    me.options.parameterModel.parameterModel("getCurrentParameterList", me.reportPath, true);

                                me._trigger(events.drillThrough, null, { path: data.ReportPath });
                                if (me.isDebug) {
                                    console.log("DrillThough", { drillReport: data.ReportPath, data: data });
                                }
                                if (data.CredentialsRequired) {
                                    me.$reportAreaContainer.find(".Page").detach();
                                    me._setScrollLocation(0, 0);
                                    me._writeDSCredential(data.Credentials);
                                }
                                else if (data.ParametersRequired) {
                                    me.$reportAreaContainer.find(".Page").detach();
                                    me._setScrollLocation(0, 0);
                                    me._showParameters(1, data.Parameters);
                                }
                                else {
                                    me._setScrollLocation(0, 0);
                                    me._loadPage(1, false, null, null, true);
                                }
                            }
                        },
                        function (jqXHR, textStatus, errorThrown, request) { me.lock = 0; me._writeError(jqXHR, textStatus, errorThrown, request); }
                    );
                });
            });
        },
        /**
         * Navigate to the Document Map
         *
         * @function $.forerunner.reportViewer#navigateDocumentMap
         *
         * @param {String} docMapID - Id of the document map
         */
        navigateDocumentMap: function (docMapID) {
            var me = this;
            if (me.lock === 1)
                return;
            me.lock = 1;
            me._resetContextIfInvalid(function () {
                forerunner.ajax.getJSON(me.options.reportViewerAPI + "/NavigateTo/",
                    {
                        NavType: navigateType.docMap,
                        SessionID: me.sessionID,
                        UniqueID: docMapID,
                        instance: me.options.rsInstance,
                    },
                    function (data) {
                        me.backupCurPage(false, true);
                        me.hideDocMap();
                        me._loadPage(data.NewPage, false, docMapID);
                    },
                    function (jqXHR, textStatus, errorThrown, request) { me.lock = 0; me._writeError(jqXHR, textStatus, errorThrown, request); }
                );
            });
        },
        /**
         * Push the current page into the action history stack
         *
         * @function $.forerunner.reportViewer#backupCurPage
         *
         * @param {Boolean} flushCache - Specify flushCache status
         * @param {Boolean} useSavedLocation - Whether used saved location
         */
        backupCurPage: function (flushCache,useSavedLocation) {
            var me = this;

            var top, left, savedParams;
            var parameterModel = null;

            if (flushCache !== true)
                flushCache = false;

            if (useSavedLocation === true) {
                top = me.savedTop;
                left = me.savedLeft;
            }
            else {
                var pos = me.getScrollPosition();
                top = pos.top;
                left = pos.left;
            }

            if (me.paramLoaded) {
                var $paramArea = me.options.paramArea;
                //get current parameter list without validate
                savedParams = $paramArea.reportParameter("getParamsList", true);
            }

            if (me.options.parameterModel)
                parameterModel = me.options.parameterModel.parameterModel("getModel");

            me.actionHistory.push({
                ReportPath: me.reportPath,
                SessionID: me.sessionID,
                CurrentPage: me.curPage,
                ScrollTop: top,
                ScrollLeft: left,
                FlushCache: flushCache,
                paramLoaded: me.paramLoaded,
                savedParams: savedParams,
                reportStates: me.reportStates,
                renderTime: me.renderTime,
                reportPages: me.pages,
                paramDefs: me.paramDefs,
                credentialDefs: me.credentialDefs,
                savedCredential: me.datasourceCredentials,
                renderError: me.renderError,
                parameterModel: parameterModel,
                paramMetadata: me.paramMetadata,
                isDrillThrough : me.isDrillThrough
            });

            me._clearReportViewerForDrill();
            me._trigger(events.actionHistoryPush, null, { path: me.reportPath });
        },
        _clearReportViewerForDrill: function () {
            //clean current report's property that not all reports have
            //when drill to another report or drill back
            var me = this;

            me.datasourceCredentials = null;
            me.credentialDefs = null;
        },
        _setScrollLocation: function (top, left) {
            var me = this;
            me.scrollLeft = left;
            me.scrollTop = top;
        },
        /**
         * Find the given keyword
         *
         * @function $.forerunner.reportViewer#find
         *
         * @param {String} keyword - Keyword to find
         * @param {Integer} startPage - Starting page of the search range
         * @param {Integer} endPage - Ending page of the search range
         * @param {Boolean} findInNewPage - Find in new page or current page
         */
        find: function (keyword, startPage, endPage, findInNewPage) {
            var me = this;

            if (keyword === "")
                return;

            if (forerunner.dialog.isMessageBoxVisible())
                return;

            me._resetContextIfInvalid(function () {
                //input new keyword
                if (!me.findKeyword || me.findKeyword !== keyword) {
                    me.resetFind();
                    me.findKeyword = keyword;
                }

                me._trigger(events.find);

                if (me.finding && !findInNewPage) {
                    me._findNext(keyword);
                }
                else {
                    if (startPage === undefined)
                        startPage = me.getCurPage();

                    if (endPage === undefined)
                        endPage = me.getNumPages() === 0 ? 2147483647 : me.getNumPages(); //if page number === 0 then set Int32.MaxValue in C# to it

                    if (startPage > endPage) {
                        me.resetFind();
                        me._showMessageBox(me.locData.getLocData().messages.completeFind, undefined, me._findDone);
                        return;
                    }

                    //markup find start page
                    if (me.findStartPage === null)
                        me.findStartPage = startPage;

                    forerunner.ajax.getJSON(me.options.reportViewerAPI + "/FindString/",
                        {
                            SessionID: me.sessionID,
                            StartPage: startPage,
                            EndPage: endPage,
                            FindValue: keyword,
                            instance: me.options.rsInstance,
                        },
                        function (data) {
                            if (data.NewPage !== 0) {//keyword exist
                                me.finding = true;
                                if (data.NewPage !== me.getCurPage()) {
                                    me._addSetPageCallback(function () { me._setFindHighlight(keyword); });
                                    me.pages[data.NewPage] = null;
                                    me._loadPage(data.NewPage, false);
                                } else {
                                    me._setFindHighlight(keyword);
                                }
                            }
                            else {//keyword not exist
                                if (me.findStartPage !== 1) {
                                    me.findEndPage = me.findStartPage - 1;
                                    me.find(keyword, 1, me.findEndPage, true);
                                    me.findStartPage = 1;
                                }
                                else {
                                    if (me.finding === true)
                                        me._showMessageBox(me.locData.getLocData().messages.completeFind, undefined, me._findDone);
                                    else
                                        me._showMessageBox(me.locData.getLocData().messages.keyNotFound, undefined, me._findDone);
                                    me.resetFind();
                                }
                            }
                        },
                        function (jqXHR, textStatus, errorThrown, request) { me._writeError(jqXHR, textStatus, errorThrown, request); }
                    );
                }
            });
        },
        _findNext: function (keyword) {
            var me = this;

            me.$keywords.filter(".fr-render-find-highlight").first().removeClass("fr-render-find-highlight");

            var $nextWord = me.$keywords.filter(":visible").filter(".Unread").first();
            if ($nextWord.length > 0) {
                $nextWord.removeClass("Unread").addClass("fr-render-find-highlight").addClass("Read");
                me._trigger(events.navToPosition, null, { top: $nextWord.position().top - 150, left: $nextWord.position().left - 250 });
            }
            else {
                if (me.getNumPages() === 1) {
                    me._showMessageBox(me.locData.getLocData().messages.completeFind,undefined, me._findDone);
                    me.resetFind();
                    return;
                }
                var endPage = me.findEndPage ? me.findEndPage : me.getNumPages() === 0 ? 2147483647 : me.getNumPages(); //if page number === 0 then set Int32.MaxValue in C# to it;

                if (me.getCurPage() + 1 <= endPage){
                    me.find(keyword, me.getCurPage() + 1, endPage, true);
                }
                else if (me.findStartPage > 1) {
                    me.findEndPage = me.findStartPage - 1;
                    if (me.getCurPage() === me.findEndPage) {
                        me._showMessageBox(me.locData.getLocData().messages.completeFind, undefined, me._findDone);
                        me.resetFind();
                    }
                    else {
                        me.find(keyword, 1, me.findEndPage, true);
                    }
                }
                else {
                    me._showMessageBox(me.locData.getLocData().messages.completeFind, undefined, me._findDone);
                    me.resetFind();
                }
            }
        },       
        _setFindHighlight: function (keyword) {
            var me = this;
            me._clearHighLightWord();
            me._highLightWord(me.$reportContainer[0], keyword);

            me.$keywords = me.$reportContainer.find("span.fr-render-find-keyword");

            //Highlight the first match.
            var $item = me.$keywords.filter(":visible").filter(".Unread").first();
            if ($item.length > 0) {
                $item.removeClass("Unread").addClass("fr-render-find-highlight").addClass("Read");
                me._trigger(events.navToPosition, null, { top: $item.position().top - 150, left: $item.position().left - 250 });
            }
        },
        _findDone: function (me) {
            me._trigger(events.findDone);
        },
        _showMessageBox: function (message, preFunc, afterFunc) {
            var me = this;

            if (typeof preFunc === "function") {
                preFunc(me);
            }

            forerunner.dialog.showMessageBox(me.options.$appContainer, message);

            if (typeof afterFunc === "function") {
                afterFunc(me);
            }
        },
        /**
         * Resets the find state
         *
         * @function $.forerunner.reportViewer#resetFind
         */
        resetFind: function () {
            var me = this;
            me.finding = false;
            me.findKeyword = null;
            me.findStartPage = null;
            me.findEndPage = null;
        },
        /**
         * Export the report in a specify format
         *
         * @function $.forerunner.reportViewer#exportReport
         *
         * @param {String} exportType - Export format
         * @see forerunner.ssr.constants
         */
        exportReport: function (exportType) {
            var me = this;
            me._resetContextIfInvalid(function () {
                var url = me.options.reportViewerAPI + "/ExportReport/?ReportPath=" + encodeURIComponent(me.getReportPath()) + "&SessionID=" + me.getSessionID() + "&ExportType=" + exportType;
                if (me.options.rsInstance) url += "&instance=" + me.options.rsInstance;

                if (me.options.exportCallback !== undefined)
                    me.options.exportCallback(url);
                else {
                    var w = window.open(url);
                    //meeded for IE8.
                    w.location.href = url;
                }

            });
        },       
        /**
         * Show print dialog, close it if opened
         *
         * @function $.forerunner.reportViewer#showPrint
         */
        showPrint: function () {
            var me = this;
            if (forerunner.config.getCustomSettingsValue("FastPrint", "on").toLowerCase() === "on") {
                me.printReport("");
            }
            else {
                if (me.$printDialog) {
                    me.$printDialog.reportPrint("openDialog");
                }
            }
        },
        /**
         * Edit email subscription
         *
         * @function $.forerunner.reportViewer#editEmailSubscription
         *
         * @param {String} subscriptionID - subscription ID
         */
        editEmailSubscription : function(subscriptionID) {
            var me = this;
            if (!me.showSubscriptionUI()) return;
            me._setEmailSubscriptionUI();
            if (me.$emailSub) {
                me.$emailSub.emailSubscription("option", "reportPath", me.getReportPath());

                var paramList = null;
                if (me.paramLoaded) {
                    var $paramArea = me.options.paramArea;
                    //get current parameter list without validate
                    paramList = $paramArea.reportParameter("getParamsList", true);
                }
                
                //need to always set paramList event it's null to clear cache    
                me.$emailSub.emailSubscription("option", "paramList", paramList);
                me.$emailSub.emailSubscription("loadSubscription", subscriptionID);
                me.$emailSub.emailSubscription("openDialog");
            }
        },
        /**
         * Show email subscription dialog
         *
         * @function $.forerunner.reportViewer#showEmailSubscription
         *
         * @param {String} subscriptionID - subscription ID
         */
        showEmailSubscription : function (subscriptionID) {
            var me = this;
            if (!me.showSubscriptionUI()) return;
            me._setEmailSubscriptionUI();
            if (me.$emailSub) {
                me.$emailSub.emailSubscription("option", "reportPath", me.getReportPath());
                $.when(me.$emailSub.emailSubscription("getSubscriptionList"))
                    .done(function (data) {

                        if (forerunner.config.getCustomSettingsValue("ManageSubscriptionUI", "default") === "always") {
                            me.manageSubscription();
                        }
                        else if (data.length === 0) {
                            me.editEmailSubscription(null);
                        } else if (data.length === 1) {
                            me.editEmailSubscription(data[0].SubscriptionID);
                        } else {
                            me.manageSubscription();
                        }
                    })
                    .fail(function() { me._showEmailSubscriptionDialog(null); });
            }
        },
        /**
         * Show manage subscription dialog
         *
         * @function $.forerunner.reportViewer#manageSubscription
         */
        manageSubscription : function() {
            var me = this;
            if (!me.showSubscriptionUI()) return;
            me._setManageSubscriptionUI();
            if (me.$manageSub) {
                me.$manageSub.manageSubscription("option", "reportPath", me.getReportPath());
                me.$manageSub.manageSubscription("listSubscriptions", null);
                me.$manageSub.manageSubscription("openDialog");
            }
        },
        /**
         * Show report print layout in PDF viewer and do print on that
         *
         * @function $.forerunner.reportViewer#printReport
         *
         * @param {String} printPropertyList - Page layout option
         */
        printReport: function (printPropertyList) {
            var me = this;
            me._resetContextIfInvalid(function () {
                var url = me.options.reportViewerAPI + "/PrintReport/?ReportPath=" + me.getReportPath() + "&SessionID=" + me.getSessionID() + "&PrintPropertyString=" + printPropertyList;
                if (me.options.rsInstance) url += "&instance=" + me.options.rsInstance;

                if (me.options.printCallback !== undefined)
                    me.options.printCallback(url);
                else {
                    if ((forerunner.device.isFirefox() && forerunner.config.getCustomSettingsValue("FirefoxPDFbug", "on").toLowerCase() === "on") || forerunner.device.isMobile()) {
                        window.open(url);
                    }
                    else {
                        var pif = me.element.find(".fr-print-iframe");
                        if (pif.length === 1) pif.detach();

                        pif = $("<iframe/>");
                        pif.addClass("fr-print-iframe");
                        pif.attr("name", me.viewerID);
                        pif.attr("src", url);
                        pif.hide();
                        me.element.append(pif);
                    }
                }
             });           
           
        },
        _setPrint: function (pageLayout) {
            var me = this;
            me.$printDialog = me.options.$appContainer.find(".fr-print-section");
            if (widgets.hasWidget(me.$printDialog, widgets.reportPrint)) {
                me.$printDialog.reportPrint("setPrint", pageLayout);
            }
        },
        _setEmailSubscriptionUI : function() {
            var me = this;
            if (!me.$emailSub)
                me.$emailSub = me.options.$appContainer.find(".fr-emailsubscription-section");
        },
        _setManageSubscriptionUI: function () {
            var me = this;
            if (!me.$manageSub)
                me.$manageSub = me.options.$appContainer.find(".fr-managesubscription-section");
        },
       
        //Page Loading
        _onModelSetChanged: function (e, savedParams) {
            var me = this;
            //since we load a new page we should change page number to 1
            //var pageNum = me.getCurPage();
            if (savedParams) {
                me.refreshParameters(savedParams, true, 1);
            }
        },
        _getSavedParams : function(orderedList) {
            for(var i = 0; i < orderedList.length; i++) {
                    if (orderedList[i]) return orderedList[i];
                }
            return null;
        },
        _loadParameters: function (pageNum, savedParamFromHistory, submitForm) {
            var me = this;

            var subscriptionParameters = null;
            if (me.options.showSubscriptionOnOpen) {
                subscriptionParameters = me._loadSubscriptionParameters(me.options.showSubscriptionOnOpen);
            }

            var savedParams = me._getSavedParams([subscriptionParameters, savedParamFromHistory, me.savedParameters,
                me.options.parameterModel ? me.options.parameterModel.parameterModel("getCurrentParameterList", me.reportPath) : null]);
            var savedParamsObj = null;
            if (savedParams) {
                savedParamsObj =forerunner.helper.JSONParse(savedParams);
            }
            if (submitForm === undefined)
                submitForm = true;

            if (savedParamsObj && savedParamsObj.ParamsList && savedParamsObj.ParamsList.length > 0) {
                if (me.options.paramArea) {
                    me.options.paramArea.reportParameter({
                        $reportViewer: this,
                        $appContainer: me.options.$appContainer,
                        $ReportViewerInitializer: me.options.$ReportViewerInitializer,
                        RDLExt: me.getRDLExt()
                    });
                    
                    if (submitForm === false) {
                        me._loadPage(pageNum, false, null, null, false);
                        me.options.paramArea.reportParameter("setsubmittedParamsList", savedParams);
                    }
                    else
                        me.refreshParameters(savedParams, submitForm, pageNum, false);
                }
            } else {
                me._loadDefaultParameters(pageNum, me._showParameterCallback);
            }
        },
        _paramsToString: function (a) {
            return JSON.stringify(a);
        },
        _loadSubscriptionParameters: function (subscriptionID) {
            var me = this;
            me._setEmailSubscriptionUI();
            if (me.$emailSub) {
                var subscriptionInfo = me.$emailSub.emailSubscription("getSubscriptionInfo", subscriptionID);
                var parameters = subscriptionInfo.Parameters;
                var transformedParams = [];
                for (var i = 0; i < parameters.length; i++) {
                    transformedParams.push({ "Parameter": parameters[i].Name, "Value": parameters[i].Value, "IsMultiple": "false", Type: "" });
                }

                return JSON.stringify({ "ParamsList": transformedParams });
            }
            return null;
        },
        _loadDefaultParameters: function (pageNum, success) {
            var me = this;
            forerunner.ajax.ajax({
                type: "POST",
                url: me.options.reportViewerAPI + "/ParameterJSON/",
                data: {
                    ReportPath: me.reportPath,
                    SessionID: me.getSessionID(),
                    ParameterList: null,
                    DSCredentials: me.getDataSourceCredential(),
                    instance: me.options.rsInstance,
                },
                dataType: "json",
                done: function (data) {
                    if (data.Debug) {
                        // Fix up the ReportPath and SessionID if this data is from customer data
                        data.ReportPath = me.reportPath;
                        data.SessionID = me.getSessionID();
                    }

                    if (typeof success === "function") {
                        success.call(me, data, pageNum);
                    }
                },
                fail: function (jqXHR, textStatus, errorThrown, request) {
                    me._writeError(jqXHR, textStatus, errorThrown, request);                                        
                }
            });
        },
        _showParameterCallback: function(data, pageNum){
            var me = this;

            if (data.Exception) {
                me._renderPageError(me.$reportContainer, data);
                me.removeLoadingIndicator();
            } else {
                if (data.SessionID)
                    me.sessionID = data.SessionID;
                me.removeLoadingIndicator();
                me._showParameters(pageNum, data);
            }
        },
        _getParameterMetadata: function(data){
            var me = this;

            if (data.Exception) {
                me.paramMetadata = null;
            }
            else {
                me.paramMetadata = data;
            }
        },
        _showParameters: function (pageNum, data) {
            var me = this;
            
            if (me.isDebug) {
                console.log("showParameters", { loadPage: pageNum,data:data });
            }
            if (data.Type === "Parameters") {
                me._removeParameters();
                me.$reportContainer.find(".Page").detach();
                
                var $paramArea = me.options.paramArea;
                if (me.isDebug) {
                    console.log("showParameters", { paramArea: $paramArea });
                }
                if ($paramArea) {
                    me.paramDefs = data;

                    $paramArea.reportParameter({
                        $reportViewer: this,
                        $appContainer: me.options.$appContainer,
                        $ReportViewerInitializer: me.options.$ReportViewerInitializer,
                        RDLExt: me.getRDLExt()
                    });

                    $paramArea.reportParameter("writeParameterPanel", data, pageNum);
                    me.$numOfVisibleParameters = $paramArea.reportParameter("getNumOfVisibleParameters");

                    if (me.isDebug) {
                        console.log("showParameters", { numOfVisibleParameters: me.$numOfVisibleParameters });
                    }
                    if (me.$numOfVisibleParameters > 0) {
                        me._trigger(events.showParamArea, null, { reportPath: me.reportPath });
                    }
                   
                    me.paramLoaded = true;
                    me.$paramarea = me.options.paramArea;
                }
            }
            else if (data.Exception) {
                me._renderPageError(me.$reportContainer, data);
                me.removeLoadingIndicator();
            }
            else {
                me._loadPage(pageNum, false, null, null, true);
            }
        },
        /**
         * Returns the parameter definitions. The paramsDef is needed in the call to setParametersAndUpdate
         * defined by the report parameter widget.
         *
         * @function $.forerunner.reportViewer#getParamsDef
         *
         * @param {function} done(Object) - callback function, if specified this function is async
         */
        getParamDefs: function (done) {
            var me = this;
            var paramDefs = null;
            var doAsync = false;

            if (done)
                doAsync = true;

            forerunner.ajax.ajax({
                type: "POST",
                url: me.options.reportViewerAPI + "/ParameterJSON",
                data: {
                    ReportPath: me.reportPath,
                    SessionID: me.getSessionID(),
                    ParameterList: null,
                    DSCredentials: me.getDataSourceCredential(),
                    instance: me.options.rsInstance,
                },
                dataType: "json",
                async: doAsync,
                success: function (data) {
                    if (data.Exception) {
                        console.log("getParamsDef - failed:");
                        console.log(data);
                    } else {
                        paramDefs = data;
                    }
                    if (done)
                        done(paramDefs);
                }             
            });
            
        },
        /**
         * Will merge the existing parameter list by the given mergeParamsList. This will enable
         * you to add one or more new parameter values without having to worry about the entire
         * parameter list.
         *
         * This method is provided as an easier way to call refreshParameters.
         *
         * @function $.forerunner.reportViewer#setParamsdata
         *
         * @param {Object} paramList - Parameter list (type may be string or object).
         * @param {Boolean} submitForm - Submit form if the parameters are satisfied.
         */
        extendParameters: function (mergeParamsList, submitForm) {
            var me = this;

            var newParamsList = typeof (mergeParamsList) === "string" ? JSON.parse(mergeParamsList) : mergeParamsList;
            var param;

            // Convert the given array into a map
            var newParamsMap = {};
            for (var i = 0; i < newParamsList.ParamsList.length; i++) {
                param = newParamsList.ParamsList[i];
                newParamsMap[param.Parameter] = param;
            }

            // Next get the parameter list data
            var paramsList = JSON.parse(me.options.paramArea.reportParameter("getParamsList"));
            if (paramsList === null || paramsList.ParamsList === null) {
                paramsList = {
                    ParamsList: []
                };
            }

            // Convert the ParamsList into a map
            var paramsMap = {};
            for ( i = 0; i < paramsList.ParamsList.length; i++) {
                param = paramsList.ParamsList[i];
                paramsMap[param.Parameter] = param;
            }

            // Extend the two maps
            $.extend(true, paramsMap, newParamsMap);

            // Put the extended map back into the paramsList array
            paramsList.ParamsList = [];
            for (param in paramsMap) {
                paramsList.ParamsList.push(paramsMap[param]);
            }

            // Refresh the report
            me.refreshParameters(paramsList, submitForm);
        },
        /**
         * Refresh the parameter using the given list
         *
         * @function $.forerunner.reportViewer#refreshParameters
         *
         * @param {Object} paramList - Parameter list (type may be string or object).
         * @param {Boolean} submitForm - Submit form if the parameters are satisfied.
         * @param {Integer} pageNum - The page to load.  Specify -1 to load the current page.
         * @param {Boolean} renderParamArea - Whether to trigger show parameter area event if there are visible parameters.
         * @param {Boolean} isCascading - Indicate it's a cascading refresh or whole refresh
         */
        refreshParameters: function (paramList, submitForm, pageNum, renderParamArea, isCascading) {
            var me = this;
            if (pageNum === -1) {
                pageNum = me.getCurPage();
            }

            //for the parameter report which has saved parameter, we need to get a original parameter copy
            if (!me.paramMetadata) {
                me._loadDefaultParameters(pageNum, me._getParameterMetadata);
            }

            if (paramList) {
                forerunner.ajax.ajax({
                    type: "POST",
                    url: me.options.reportViewerAPI + "/ParameterJSON",
                    data : {
                        ReportPath: me.reportPath,
                        SessionID: me.getSessionID(),
                        ParameterList: typeof(paramList) === "string" ? paramList : JSON.stringify(paramList),
                        DSCredentials: me.getDataSourceCredential(),
                        instance: me.options.rsInstance,
                    },
                    dataType: "json",
            
                    success: function (data) {
                        if (data.Exception) {
                            me._renderPageError(me.$reportContainer, data);
                            me.removeLoadingIndicator();
                        } else {
                            
                            if (me.isDebug) {
                                console.log("refreshParameters", {
                                    ReportPath: me.reportPath,
                                    SessionID: me.getSessionID(),
                                    ParameterList: paramList,
                                    DSCredentials: me.getDataSourceCredential(),
                                    instance: me.options.rsInstance,
                                    data: data
                                });
                            }
                            if (data.SessionID)
                                me.sessionID = data.SessionID;
                            me._updateParameterData(data, submitForm, pageNum, renderParamArea, isCascading, paramList);
                        }
                    }
                });
            }
        },
        _updateParameterData: function (paramData, submitForm, pageNum, renderParamArea, isCascading, savedParam) {
            var me = this;
            if (paramData) {
                me.paramDefs = paramData;
                me.options.paramArea.reportParameter("updateParameterPanel", paramData, submitForm, pageNum, renderParamArea, isCascading, savedParam, me.paramMetadata);
                me.$numOfVisibleParameters = me.options.paramArea.reportParameter("getNumOfVisibleParameters");
                if (me.$numOfVisibleParameters > 0) {
                    me._trigger(events.showParamArea, null, { reportPath: me.reportPath });
                }
                me.paramLoaded = true;
                me.$paramarea = me.options.paramArea;
            }
        },
        _removeParameters: function () {
            var me = this;
            var $paramArea = me.options.paramArea;
            if ($paramArea) {
                $paramArea.reportParameter("removeParameter");
                me.paramLoaded = false;
                me.$numOfVisibleParameters = 0;
            }
        },
        _resetViewer: function(isSameReport){
            var me = this;

            //me.sessionID = "";
            me.numPages = 0;
            me.floatingHeaders = [];
            if (!isSameReport) {
                me.paramLoaded = false;
                me._removeAutoRefreshTimeout();
                me.SaveThumbnail = false;                
                me.paramMetadata = null;
            }
            me.scrollTop = 0;
            me.scrollLeft = 0;
            me.finding = false;
            me.findStartPage = null;
            me.hasDocMap = false;
            me.docMapData = null;
            me.togglePageNum = 0;
            me.findKeyword = null;
            me.origionalReportPath = "";
            me.renderError = false;
            me.reportStates = { toggleStates: new forerunner.ssr.map(), sortStates: [] };

            if (!isSameReport) {
                me._removeParameters();
            }
        },
        _reloadFromSessionStorage: function () {
            var me = this;
            if (sessionStorage.forerunner_zoomReload_actionHistory) {
                var zoomReloadStringData = sessionStorage.forerunner_zoomReload_actionHistory;
                delete sessionStorage.forerunner_zoomReload_actionHistory;
                var zoomReloadData = JSON.parse(zoomReloadStringData);
                if (zoomReloadData.actionHistory && zoomReloadData.actionHistory[0].ReportPath !== "") {
                    me.actionHistory = zoomReloadData.actionHistory;
                    me.back();
                    return true;
                }
            }
            return false;
        },

        /**
         * Load a dynamicly created report
         *
         * @function $.forerunner.reportViewer#loadDynamicReport
         *
         * @param {String} reportName - Name of Dynamic Report
         * @param {Object} sessionID -  SessionID for existing execution
         * @param {Integer} pageNum - Starting page number
         * @param {Object} parameters - Optional parameters  (type may be string or object)
         * @param {Object} RDLExt - Optional RDLExt  (type may be string or object) 
         */
        loadDynamicReport: function (reportName,sessionID, pageNum, parameters, RDLExt) {
            var me = this;

            me.dynamicReport = true;
            if (RDLExt)
                me.RDLExtProperty = forerunner.helper.JSONParse(RDLExt);
            me._loadReport(reportName, pageNum, parameters, sessionID);
        },

        /**
         * Load report with pass path, page number and parameters
         *
         * @function $.forerunner.reportViewer#loadReport
         *
         * @param {String} reportPath - Path to the specific report
         * @param {Integer} pageNum - Starting page number
         * @param {Object} parameters - Optional parameters  (type may be string or object)
         * @param {Object} sessionID - Optional SessionID for existing execution
         */
        loadReport: function (reportPath, pageNum, parameters, sessionID) {
            var me = this;

            me.dynamicReport = false;
            me._loadReport(reportPath, pageNum, parameters, sessionID);
        },
        
        _loadReport: function (reportPath, pageNum, parameters,sessionID) {
            var me = this;

            // For each new report we reset the zoom factor back to 100%
            me._zoomFactor = 100;
           
            me._checkPermission(reportPath, function () {
                me._trigger(events.preLoadReport, null, { viewer: me, oldPath: me.reportPath, newPath: reportPath, pageNum: pageNum });

                if (me._reloadFromSessionStorage()) {
                    me._trigger(events.afterLoadReport, null, { viewer: me, reportPath: me.getReportPath(), sessionID: me.getSessionID() });
                    return;
                }

                if ((me.reportPath && me.reportPath !== "" && me.reportPath !== reportPath) || me.dynamicReport === true) {
                    //Do some clean work if it's a new report
                    me.backupCurPage(true);
                    me.sessionID = "";
                    me.flushCache();
                    me.hideDocMap();
                    me.element.unmask();
                }
                if (sessionID)
                    me.sessionID = sessionID;

                me._resetViewer();

                me.reportPath = reportPath ? reportPath : "/";
                me.pageNum = pageNum ? pageNum : 1;
                me.savedParameters = parameters ? parameters : null;

                //See if we have RDL extensions
                me._getRDLExtProp(function () {

                    if (me.RDLExtProperty.DefaultZoom)
                        me.options.zoom = me.RDLExtProperty.DefaultZoom;

                    if (me.options.jsonPath) {
                        me._renderJson();
                        me._addSetPageCallback(function () {
                            //_loadPage is designed to async so trigger afterloadreport event as set page down callback
                            me._trigger(events.afterLoadReport, null, { viewer: me, reportPath: me.getReportPath(), sessionID: me.getSessionID(), RDLExtProperty: me.RDLExtProperty });
                            me._setOptionsZoom();
                        });
                    } else {
                        //Need to call get parameter list to load parameters before calling loadParameters
                        //This shoule get refactored
                        if (me.options.parameterModel && me.dynamicReport !== true) {
                            me.options.parameterModel.parameterModel("getCurrentParameterList", me.reportPath, undefined, function () {
                                me._loadParameters(me.pageNum);
                                me._addSetPageCallback(function () {
                                    //_loadPage is designed to async so trigger afterloadreport event as set page down callback
                                    me._trigger(events.afterLoadReport, null, { viewer: me, reportPath: me.getReportPath(), sessionID: me.getSessionID(), RDLExtProperty: me.RDLExtProperty });
                                    me._setOptionsZoom();

                                });
                            });
                        }
                        else {
                            me._loadParameters(me.pageNum);
                            me._addSetPageCallback(function () {
                                //_loadPage is designed to async so trigger afterloadreport event as set page down callback
                                me._trigger(events.afterLoadReport, null, { viewer: me, reportPath: me.getReportPath(), sessionID: me.getSessionID(), RDLExtProperty: me.RDLExtProperty });
                                me._setOptionsZoom();

                            });
                        }

                    }

                 
                    
                });
            });
        },

        _setOptionsZoom: function () {
            var me = this;

            if (me.options.zoom) {
                if (me.options.zoom === "page width")
                    me.zoomToPageWidth();
                else if (me.options.zoom === "whole page")
                    me.zoomToWholePage();
                else {
                    try {
                        var zoomLevel = parseFloat(me.options.zoom);
                        me.zoomToPercent(zoomLevel);
                    } catch (e) {
                    }
                }
            }
        },
        _getRDLExtProp: function (done) {
            var me = this;

            if (me.dynamicReport === true) {
                if (!me.RDLExtProperty)
                    me.RDLExtProperty = {};

                if (done)
                    done();
                return;
            }
            me.property = forerunner.cache.itemProperty[me.reportPath];

            if (me.property) {
                me.RDLExtProperty = forerunner.helper.JSONParse(me.property.ForerunnerRDLExt) || {};
                if (done)
                    done();
                return;
            }

            forerunner.ajax.ajax({
                type: "GET",
                dataType: "json",                
                url: forerunner.config.forerunnerAPIBase() + "ReportManager/ReportProperty/",
                data: {
                    path: me.reportPath,
                    propertyName: "ForerunnerRDLExt",
                    instance: me.options.rsInstance,
                },
                success: function (data) {
                    if (!forerunner.cache.itemProperty[me.reportPath])
                        forerunner.cache.itemProperty[me.reportPath] = {};

                    if (data && JSON.stringify(data) !== "{}") {
                        forerunner.cache.itemProperty[me.reportPath].ForerunnerRDLExt = forerunner.helper.JSONParse(data);
                    }
                    else
                        forerunner.cache.itemProperty[me.reportPath].ForerunnerRDLExt = {};

                    me.RDLExtProperty = forerunner.cache.itemProperty[me.reportPath].ForerunnerRDLExt;
                    
                    if (done)
                        done();
                },

            });
        },
        /**
        * Get RDL Extension
        *
        * @function $.forerunner.reportViewer#getRDLExt
        * @return {Object} RDL extension object for current report
        */
        getRDLExt: function () {
            var me = this;

            return me.RDLExtProperty;

        },
        _updateRDLExt: function (data) {
            var me = this;

            if (me.isDestroy === true) {
                return;
            }

            try {
                if ($.trim(data.newRDL) !== "") {
                    me.RDLExtProperty = jQuery.parseJSON(data.newRDL);
                }
                else {
                    me.RDLExtProperty = {};
                }

                me._ReRender(true);
            }
            catch (e) {
                forerunner.dialog.showMessageBox(me.options.$appContainer, e.message, "Error Saving");
                return false;
            }
        },
        /**
         * Load current report with the given parameter list
         *
         * @function $.forerunner.reportViewer#loadReportWithNewParameters
         *
         * @param {Object} paramList - Parameter list object
         * @param {Integer} pageNum - The page to load
         * @param {Boolean} useDefaultValue - Whether use default parameter value on server side
         */
        loadReportWithNewParameters: function (paramList, pageNum, useDefaultValue) {
            var me = this;

            if (me.isDebug) {
                console.log("loadReportWithNewParameters", {
                    paramList: paramList
                });
            }

            if (useDefaultValue) {
                me.sessionID = "";
            }
            
            me._resetViewer(true);
            me.renderTime = new Date().getTime();
            if (!pageNum || parseInt(pageNum, 10) !== pageNum) {
                pageNum = 1;
            }
            if (paramList && typeof paramList === "object")
                paramList =JSON.stringify(paramList);

            me._loadPage(pageNum, false, null, paramList, true);
        },
        /**
        * Load current report with the given datasource credential list
        *
        * @function $.forerunner.reportViewer#loadReportWithCustomDSCredential
        *
        * @param {Object} credentialList - datasource credential list object
        */
        loadReportWithCustomDSCredential: function (credentialList) {
            var me = this;

            if (me.getDataSourceCredential()) {
                //reset current credential before next load
                me._resetDSCredential();
            }
            me.datasourceCredentials = credentialList;

            if (me.paramLoaded) {
                var paramList = me.options.paramArea.reportParameter("getParamsList");
                me._loadPage(1, false, null, paramList, true);
            }
            else {
                me.loadReport(me.getReportPath(), 1);
            }
        },
        _resetDSCredential: function () {
            var me = this;
            me.flushCache();
            
            me.sessionID = null;

            var errorpage = me.$reportContainer.find(".Page");
            if (errorpage)
                errorpage.detach();

            me._trigger(events.resetCredential, null, { paramLoaded: me.paramLoaded });
        },
        _renderJson : function () {
            var me = this;
            var newPageNum = 1;
            var loadOnly = false;

            if (!me.element.is(":visible") && !loadOnly)
                me.element.show(); //scrollto does not work with the slide in functions:(

            me.showLoadingIndictator();
            me.togglePageNum = newPageNum;
            forerunner.ajax.ajax(
                {
                    type: "GET",
                    dataType: "json",
                    url: me.options.jsonPath,                    
                    done: function (data) {
                        me._writePage(data, newPageNum, loadOnly);
                        if (!loadOnly) {
                            if (data.ReportContainer) {
                                me._setPrint(data.ReportContainer.Report.PageContent.PageLayoutStart);
                            }

                            if (!me.element.is(":visible"))
                                me.element.show();  //scrollto does not work with the slide in functions:(                            

                            me._updateTableHeaders(me);
                        }
                    },
                    fail: function (jqXHR, textStatus, errorThrown, request) { me._writeError(jqXHR, textStatus, errorThrown, request); }
                });
        },
        _loadPage: function (newPageNum, loadOnly, bookmarkID, paramList, flushCache, respToggleReplay, scrollID, shouldScroll) {
            var me = this;

            if (flushCache === true)
                me.flushCache();

            if (me.pages[newPageNum])
                if (me._getPageContainer(newPageNum)) {
                    if (!loadOnly) {                        
                        me._setPage(newPageNum);
                        if (!me.element.is(":visible") && !loadOnly)
                            me.element.show(0); //scrollto does not work with the slide in functions:(                        
                        if (bookmarkID)
                            me._navToLink(bookmarkID);
                        if (me.pages[newPageNum].reportObj.ReportContainer && me.pages[newPageNum].reportObj.ReportContainer.Report.AutoRefresh) // reset auto refresh if exist.
                            me._setAutoRefresh(me.pages[newPageNum].reportObj.ReportContainer.Report.AutoRefresh);
                        if (flushCache !== true)
                            me._cachePages(newPageNum);
                        if (scrollID) {
                            var el = me.element.find("div[data-uniqName=\"" + scrollID + "\"]");
                            if (el.length ===1)
                                $("html, body").animate({ scrollTop: el.position().top }, 500);
                        } else if (shouldScroll) {
                            me.scrollReportTo();
                        }

                    }
                    return;
                }
            if (!paramList) paramList = "";

            if (!loadOnly) {
                me.showLoadingIndictator();
            }
            me.togglePageNum = newPageNum;

            var dsCredentials = me.getDataSourceCredential();
            var reportJSONData = {
                ReportPath: me.reportPath,
                SessionID: me.sessionID,
                PageNumber: newPageNum,
                ParameterList: paramList,
                DSCredentials: dsCredentials,
                instance: me.options.rsInstance
            };

            if (me.isDebug) {
                console.log("LoadPage", {
                    ReportPath: me.reportPath,
                    SessionID: me.sessionID,
                    PageNumber: newPageNum,
                    ParameterList: paramList,
                    DSCredentials: me.getDataSourceCredential(),
                    instance: me.options.rsInstance,
                });
            }
            // Allow a handler to change the post data before we load the page
            me._trigger(events.preLoadPage, null, {
                viewer: me,
                reportJSONData: reportJSONData
            });

            //If not loaded load RDLExt
            
                me._getRDLExtProp(function () {

                    forerunner.ajax.ajax(
                        {
                            type: "POST",
                            dataType: "json",
                            url: me.options.reportViewerAPI + "/ReportJSON/",
                            data: reportJSONData,                            
                            done: function (data) {

                                me._writePage(data, newPageNum, loadOnly);
                                if (!loadOnly) {
                                    if (data.ReportContainer) {
                                        me._setPrint(data.ReportContainer.Report.PageContent.PageLayoutStart);
                                    }

                                    if (!me.element.is(":visible"))
                                        me.element.show();  //scrollto does not work with the slide in functions:(                            
                                    if (bookmarkID)
                                        me._navToLink(bookmarkID);
                                    if (flushCache !== true)
                                        me._cachePages(newPageNum);
                                    if (respToggleReplay)
                                        me._getPageContainer(newPageNum).reportRender("replayRespTablix", respToggleReplay);

                                    if (scrollID) {
                                        el = me.element.find("div[data-uniqName=\"" + scrollID + "\"]");
                                        if (el.length === 1)
                                            $("html, body").animate({ scrollTop: el.position().top - 50 }, 500);
                                    } else if (me.isDrillThrough || shouldScroll) {
                                        me.scrollReportTo();
                                    }
                                    me._updateTableHeaders(me);
                                    me._saveThumbnail();
                                }
                            },
                            fail: function (jqXHR, textStatus, errorThrown, request) {
                                me._writeError(jqXHR, textStatus, errorThrown, request);
                            }
                        });
                });
        },
        _writeError: function (jqXHR, textStatus, errorThrown,request) {
            var me = this;
            var data = { Exception: 
                {
                    DetailMessage: errorThrown,
                    Type: "Error",
                    TargetSite: request.url,
                    Source: "" ,
                    Message: textStatus,
                    StackTrace: JSON.stringify(request)
                }                        
            };

            me._renderPageError(me.$reportContainer, data);
        },
        _getPageContainer: function(pageNum) {
            var me = this;
            if (!me.pages[pageNum].$container) {
                me.pages[pageNum].$container = $("<div class='Page'/>");
                var responsiveUI = false;
                if (me.options.userSettings && me.options.userSettings.responsiveUI === true) {
                    responsiveUI = true;
                }
                me.pages[pageNum].$container.reportRender({ reportViewer: me, responsive: responsiveUI, renderTime: me.renderTime });
            }

            return me.pages[pageNum].$container;
        },
        _writePage: function (data, newPageNum, loadOnly) {
            var me = this;

            if (me.isDebug) {
                console.log("writePage", {
                    data:data
                });
            }
            //Error, need to handle this better
            if (!data || (data.Exception && loadOnly))
                return;
            
            if (data.CredentialsRequired) {
                me._writeDSCredential(data);
                return;
            }

            if (!loadOnly && data.ReportContainer && data.ReportContainer.Report.AutoRefresh) {
                me._addSetPageCallback(function () {
                    me._setAutoRefresh(data.ReportContainer.Report.AutoRefresh);
                });
            }
             
            if (!data.SessionID)
                me.sessionID = "";
            else
                me.sessionID = data.SessionID;

            try {
                if (data.ReportContainer.NumPages === undefined)
                    me.numPages = 0;
                else
                    me.numPages = data.ReportContainer.NumPages;
            }
            catch (error) {
                me.numPages = 0;
            } 

            if (me.numPages !== 0 && newPageNum > me.numPages) {
                newPageNum = me.numPages;
            }

            if (!me.pages[newPageNum]) {
                me.pages[newPageNum] = new reportPage(data);
            }
            else {
                me.pages[newPageNum].reportObj = data;
            }

            if (!loadOnly) {

                if (me.isDebug) {
                    console.log("WritePage", {
                        renderPage: newPageNum
                    });
                }
                me._renderPage(newPageNum);

                if (me.isDebug) {
                    console.log("WritePage", {                      
                        setPage: newPageNum,
                        pages:me.pages
                    });
                }
                me._setPage(newPageNum);
                if (data.Exception)
                    me.pages[newPageNum] = null;
            }
        },

        _reLayoutPage: function(pageNum,force){
            var me = this;

            if (me.pages[pageNum] && me.pages[pageNum].needsLayout) {
                me.pages[pageNum].needsLayout = me.pages[pageNum].$container.reportRender("layoutReport", true, force, me.getRDLExt());
            }
        },
        _renderPage: function (pageNum) {
            //Write Style
            var me = this;

            if (me.isDebug) {
                console.log("RenderPage", {                  
                    page: me.pages[pageNum]
                });
            }

            if (me.pages[pageNum] && me.pages[pageNum].isRendered === true)
                return;

            if (me.pages[pageNum].reportObj.Exception) {
                me._renderPageError(me._getPageContainer(pageNum), me.pages[pageNum].reportObj);
            }
            else {
                me.renderError = false;
                me.hasDocMap = me.pages[pageNum].reportObj.HasDocMap;

                //Render responsive if set
                var responsiveUI = false;
                if (me.options.userSettings && me.options.userSettings.responsiveUI === true) {
                    responsiveUI = true;
                }

                me._getPageContainer(pageNum).reportRender("render", me.pages[pageNum], false, me.RDLExtProperty);
               
                me.pages[pageNum].needsLayout= true;
            }

            me.pages[pageNum].isRendered = true;
            if (me.isDebug) {
                console.log("RenderPagePost", {
                    page: me.pages[pageNum]
                });
            }
        },
        _renderPageError: function ($container, errorData) {
            var me = this;
            var pageNum = me.getCurPage();

            me.renderError = true;
            if (me.pages[pageNum])
                me.pages[pageNum].isRendered = false;

            $container.reportRender({ reportViewer: me });
            $container.reportRender("writeError", errorData);
            me.removeLoadingIndicator();
            me._trigger(events.renderError, null, errorData);
        },
        _writeDSCredential: function (data) {
            var me = this;
            me.flushCache();
            me._resetViewer(false);
            me.datasourceCredentials = null;
            me.credentialDefs = data;

            me.sessionID = data.SessionID;
            me.numPages = data.NumPages;
            me.curPage = 1;

            me.$credentialDialog = me.options.$appContainer.find(".fr-dsc-section");
            me.$credentialDialog.dsCredential("writeDialog", data.CredentialsList);
            me.showDSCredential();

            me._trigger(events.showCredential);
            me.removeLoadingIndicator();
        },
        /**
         * Show datasource credential dialog
         *
         * @function $.forerunner.reportViewer#showDSCredential
         */
        showDSCredential: function () {
            var me = this;
            me.$credentialDialog.dsCredential("openDialog");
        },
        _sessionPing: function () {
            // Ping each report so that the seesion does not expire on the report server
            var me = this;

            if (me._sessionPingPost(me.sessionID) === false)
                me.sessionID = "";

            $.each(me.actionHistory, function (index, obj) {
                me._sessionPingPost(obj.SessionID);
            });

            },
        _sessionPingPost: function (sessionID) {
            var me = this;
            if (sessionID && sessionID !== "")
                forerunner.ajax.getJSON(me.options.reportViewerAPI + "/PingSession",
                    {
                        PingSessionID: sessionID,
                        instance: me.options.rsInstance,
                    },
                    function (data) {
                        if (data.Status === "Fail") {
                            return false;
                        }
                        else
                            return true;
                    },
                    function () { console.log("ping error"); }
                );
            },
        _updateTableHeaders: function (me) {
            // Update the floating headers in this viewer
            // Update the toolbar
            $.each(me.floatingHeaders, function (index, obj) {
                me._setRowHeaderOffset(obj.$tablix, obj.$rowHeader);
                me._setColHeaderOffset(obj.$tablix, obj.$colHeader);
            });
        },
        _hideTableHeaders: function () {
            // On a touch device hide the headers during a scroll if possible
            var me = this;
            $.each(me.floatingHeaders, function (index, obj) {
                if (obj.$rowHeader) obj.$rowHeader.css("visibility", "hidden");
                if (obj.$colHeader) obj.$colHeader.css("visibility", "hidden");
            });
            if (me.$floatingToolbar) me.$floatingToolbar.hide();
        },
        _navToLink: function (elementID) {
            var me = this;
            var navTo = me.element.find("[data-uniqName='" + elementID + "']")[0];
            if (navTo !== undefined) {
                //Should account for floating headers and toolbar height need to be a calculation
                var bookmarkPosition = { top: $(navTo).position().top - 100, left: $(navTo).position().left };
                
                //$(window).scrollTop(bookmarkPosition.top).scrollLeft(bookmarkPosition.left);
                //me.options.$appContainer.scrollTop(bookmarkPosition.top).scrollLeft(bookmarkPosition.left);
            
                me._trigger(events.navToPosition, null, bookmarkPosition);
            }
        },
        _stopDefaultEvent: function (e) {
            //IE
            if (window.ActiveXObject)
                window.event.returnValue = false;
            else {
                e.preventDefault();
                e.stopPropagation();
            }
        },
        _getHeight: function ($obj) {
            var height;

            var $copiedElem = $obj.clone()
                                .css({
                                    visibility: "hidden"
                                });

            //Image size cannot change so do not load.
            //$copiedElem.find("img").removeAttr("src");
            //$copiedElem.find("img").removeAttr("onload");
            //$copiedElem.find("img").removeAttr("alt");
            $copiedElem.find("img").remove();

            $("body").append($copiedElem);
            height = $copiedElem.height() + "px";

            $copiedElem.remove();

            //Return in mm
            return this._convertToMM(height);

        },
        _convertToMM: function (convertFrom) {

            if (!convertFrom)
                return 0;

            var unit = convertFrom.match(/\D+$/);  // get the existing unit
            var value = convertFrom.match(/\d+/);  // get the numeric component

            if (unit.length === 1) unit = unit[0];
            if (value.length === 1) value = value[0];

            switch (unit) {
                case "px":
                    return value / 3.78;
                case "pt":
                    return value * 0.352777777778;
                case "in":
                    return value * 25.4;
                case "mm":
                    return value;
                case "cm":
                    return value * 10;
                case "em":
                    return value * 4.2175176;
            }

            //This is an error
            return value;
        },
        _highLightWord: function (element, keyword) {
            var me = this;

            if (!keyword || keyword === "") {
                return;
            }
            else {
                $.each(element.childNodes, function (i, node) {
                    //nodetype=3 : text node
                    if (node.nodeType === 3) {
                        var searchnode = node;
                        try {
                            var pos = searchnode.data.toUpperCase().indexOf(keyword.toUpperCase());

                            while (pos < searchnode.data.length) {
                                if (pos >= 0) {
                                    //create a new span node with matched keyword text
                                    var spannode = document.createElement("span");
                                    spannode.className = "fr-render-find-keyword Unread";

                                    //split the match node
                                    var middlebit = searchnode.splitText(pos);
                                    searchnode = middlebit.splitText(keyword.length);

                                    //replace keyword text with span node 
                                    var middleclone = middlebit.cloneNode(true);
                                    spannode.appendChild(middleclone);
                                    node.parentNode.replaceChild(spannode, middlebit);
                                }
                                else {
                                    break;
                                }
                                pos = searchnode.data.toUpperCase().indexOf(keyword.toUpperCase());
                            }
                        } catch (error) { }
                    }
                    else {
                        me._highLightWord(node, keyword);
                    }
                });
            }
        },
        _clearHighLightWord: function () {
            var me = this;

            if (!me.$keywords) return;

            me.$keywords.each(function (index, keywordSpan) {
                var parent = keywordSpan.parentNode;
                var textNode = document.createTextNode(keywordSpan.firstChild.nodeValue);

                parent.replaceChild(textNode, keywordSpan);

                //normalize the textnode that search split
                if (forerunner.device.isMSIE()) {
                    me._frSearchNormalize(parent);
                } else {
                    parent.normalize();
                }
            });

            me.$keywords = null;
        },
        _joinAdjacentTextnodes: function (textNode) {// textNode is a DOM text node
            // while there are text siblings, concatenate them into the first   
            while (textNode.nextSibling) {
                var next = textNode.nextSibling;

                if (next.nodeType === 3 || next.nodeType === 4) {
                    textNode.nodeValue += next.nodeValue;
                    textNode.parentNode.removeChild(next);
                    // Stop if not a text node
                } else {
                    return;
                }
            }
        },
        //normalize textnode, used by join the text node split by report viewer find
        _frSearchNormalize: function (element) {// element is a DOM element
            var me = this;
            var node = element.firstChild;

            // Traverse siblings, call normalise for elements and 
            // collectTextNodes for text nodes   
            while (node && node.nextSibling) {
                if (node.nodeType === 1) {
                    me._frSearchNormalize(node);

                } else if (node.nodeType === 3) {
                    me._joinAdjacentTextnodes(node);
                }
                node = node.nextSibling;
            }
        },
        _setAutoRefresh: function (period) {
            var me = this;
            
            //me.autoRefreshID will be set to undefined when report viewer destory.
            if (me.autoRefreshID !== undefined) {
                //one report viewer should has only one auto refresh, so clear previous setTimeout when new one come
                if (me.autoRefreshID !== null) {
                    me._removeAutoRefreshTimeout();
                    
                }
                me.autoRefreshID = setTimeout(function () {
                    if (me.lock === 1) {
                        //if report viewer is lock then set it again.
                        me._setAutoRefresh(period);
                        return;
                    }
                    else {
                        //restore privious scroll position
                        //var containerTop = me.options.$appContainer.scrollTop();
                        //var containerLeft = me.options.$appContainer.scrollLeft();
                        var pos = me.getScrollPosition();

                        me._addSetPageCallback(function () {
                            //me.options.$appContainer.scrollTop(containerTop).scrollLeft(containerLeft);
                            me.scrollReportTo(pos);
                        });

                        //close all opened dialog before report start refresh
                        forerunner.dialog.closeAllModalDialogs(me.options.$appContainer);
                        me.refreshReport(me.getCurPage());                        
                    }

                    me.autoRefreshID = null;
                }, period * 1000);

                //console.log('add settimeout, period: ' + period + "s");
            }
        },       
        _removeAutoRefreshTimeout: function () {
            var me = this;

            if (me.autoRefreshID !== null) {
                clearTimeout(me.autoRefreshID);
                //console.log('remove settimeout');
            }
            me.autoRefreshID = null;
        },        
        /**
         * Removes the reportViewer functionality completely. This will return the element back to its pre-init state.
         *
         * @function $.forerunner.reportViewer#destroy
         */
        destroy: function () {
            var me = this;

            me.isDestroy = true;

            me._removeAutoRefreshTimeout();
            me.autoRefreshID = undefined;

            if (me.$credentialDialog)
                me.$credentialDialog.dsCredential("destroy");

            if (me.$printDialog)
                me.$printDialog.reportPrint("destroy");

            if (me.$emailSub)
                me.$emailSub.emailSubscription("destroy");
            if (me.$paramarea) {
                me.$paramarea.reportParameter("destroy");
            }

            //off gloabl event bind from appContainer
            me.options.$appContainer.off(events.saveRDLDone);
            
            //console.log('report viewer destory is invoked')

            //comment from MSDN: http://msdn.microsoft.com/en-us/library/hh404085.aspx
            // if using jQuery UI 1.8.x
            //$.Widget.prototype.destroy.call(this);
            // if using jQuery UI 1.9.x
            this._destroy();
        },
    });  // $.widget

});   // $(function


