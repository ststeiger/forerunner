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
    function reportPage($container, reportObj) {
        this.reportObj = reportObj;
        this.$container = $container;
        this.isRendered = false;
    }

    /**
     * The main toobar used for the reportViewer
     *
     * @namespace $.forerunner.reportViewer
     * @prop {object} options - The options for reportViewer
     * @prop {String} options.reportViewerAPI - Path to the REST calls for the reportViewer
     * @prop {String} options.reportPath - Path to the specific report
     * @prop {String} options.pageNum - Starting page number
     * @prop {String} options.pingInterval - Interval to ping the server. Used to keep the sessions active
     * @prop {String} options.toolbarHeight - Height of the toolbar.
     * @prop {String} options.pageNavArea - jQuery selector object that will the page navigation widget
     * @prop {String} options.paramArea - jQuery selector object that defineds the report parameter widget
     * @prop {String} options.DocMapArea - jQuery selector object that defineds the Document Map widget
     * @example
     * $("#reportViewerId").reportViewer({
     *  reportPath: "/Northwind Test Reports/bar chart"
	 * });
     */
    $.widget(widgets.getFullname(widgets.reportViewer), /** @lends $.forerunner.reportViewer */ {
        // Default options
        options: {
            reportViewerAPI: forerunner.config.forerunnerAPIBase() + "ReportViewer",
            reportPath: null,
            pageNum: 1,
            pingInterval: 300000,
            toolbarHeight: 0,
            pageNavArea: null,
            paramArea: null,
            DocMapArea: null,
            userSettings: null,
            onInputBlur: null,
            onInputFocus: null,
            $appContainer: null
        },

        _destroy: function () {
        },

        // Constructor
        _create: function () {
            var me = this;

            setInterval(function () { me._sessionPing(); }, this.options.pingInterval);

            // ReportState
            me.locData = forerunner.localize.getLocData(forerunner.config.forerunnerFolder() + "/ReportViewer/loc/ReportViewer");
            me.actionHistory = [];
            me.curPage = 0;
            me.pages = {};
            me.sessionID = "";
            me.numPages = 0;
            me.lock = 0;
            me.$reportContainer = new $("<DIV class='fr-report-container'/>");
            me.$reportAreaContainer = null;            
            me.$loadingIndicator = new $("<div class='fr-report-loading-indicator' ></div>").text(me.locData.messages.loading);
            me.floatingHeaders = [];
            me.paramLoaded = false;
            me.scrollTop = 0;
            me.scrollLeft = 0;
            me.loadLock = 0;
            me.finding = false;
            me.findStartPage = null;
            me.findEndPage = null;
            me.findKeyword = null;
            me.hasDocMap = false;
            me.docMapData = null;
            me.togglePageNum = 0;
            me.element.append(me.$loadingIndicator);
            me.pageNavOpen = false;
            me.savedTop = 0;
            me.savedLeft = 0;
            me.origionalReportPath = "";
            me._setPageCallback = null;
            me.renderError = false;
            me.autoRefreshID = null;
            me.reportStates = { toggleStates: new forerunner.ssr.map(), sortStates: [] };
            me.renderTime = new Date().getTime();
            
            var isTouch = forerunner.device.isTouch();
            // For touch device, update the header only on scrollstop.
            if (isTouch) {
                $(window).on("scrollstop", function () { me._updateTableHeaders(me); });
            } else {
                $(window).on("scroll", function () { me._updateTableHeaders(me); });
            }

            //setup orientation change
            if (!forerunner.device.isMSIE8())
                window.addEventListener("orientationchange", function() { me._ReRender.call(me);},false);

            //load the report Page requested
            me.element.append(me.$reportContainer);
            me._addLoadingIndicator();
            me.hideDocMap();

            if (me.options.parameterModel) {
                me.options.parameterModel.on(events.parameterModelSetChanged(), function (e, args) {
                    me._onModelSetChanged.call(me, e, args);
                });
            }
        },
        /**
         * @function $.forerunner.reportViewer#getUserSettings
         * @return {Object} Current user settings
         */
        getUserSettings: function () {
            return this.options.userSettings;
        },
        /**
         * @function $.forerunner.reportViewer#getCurPage
         * @return {int} Current page number
         */
        getCurPage: function () {
            var me = this;
            return me.curPage;
        },
        /**
         * @function $.forerunner.reportViewer#getNumPages
         * @return {int} Current number of pages
         */
        getNumPages: function () {
            var me = this;
            return me.numPages;
        },
        /**
         * @function $.forerunner.reportViewer#getReportViewerAPI
         * @return {String} Path to the report viewer API
         */
        getReportViewerAPI: function () {
            var me = this;
            return me.options.reportViewerAPI;
        },
        /**
         * @function $.forerunner.reportViewer#getReportPath
         * @return {String} Path to current report path
         */
        getReportPath: function () {
            var me = this;
            return me.options.reportPath;
        },
        /**
         * @function $.forerunner.reportViewer#getSessionID
         * @return {String} Session ID
         */
        getSessionID: function () {
            var me = this;
            return me.sessionID;
        },
        /**
         * @function $.forerunner.reportViewer#getHasDocMap
         * @return {bool} true if there is a document map
         */
        getHasDocMap: function () {
            var me = this;
            return me.hasDocMap;
        },
        /**
         * @function $.forerunner.reportViewer#triggerEvent
         * @Triggers an event
         */
        triggerEvent: function (eventName) {
            var me = this;
            return me._trigger(eventName);
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
                $colHeader.fadeIn("fast");
            }
            else {
                $colHeader.hide();

            }
        },
        _setRowHeaderOffset: function ($tablix, $rowHeader) {
            //  Update floating row headers
            var me = this;
            if (!$rowHeader)
                return;

            var offset = $tablix.offset();
            var scrollTop = $(window).scrollTop();            
            if ((scrollTop > offset.top) && (scrollTop < offset.top + $tablix.height())) {
                $rowHeader.css("top", (Math.min((scrollTop - offset.top), ($tablix.height() - $rowHeader.height())) + me.options.toolbarHeight) + "px");                
                $rowHeader.fadeIn("fast");
            }
            else {
                $rowHeader.hide();
            }
        },
        _addLoadingIndicator: function () {
            var me = this;
            if (me.loadLock === 0) {
                me.loadLock = 1;
                setTimeout(function () { me.showLoadingIndictator(me); }, 500);
            }
        },
        /**
         * Shows the loading Indicator
         *
         * @function $.forerunner.reportViewer#showLoadingIndictator
         */
        showLoadingIndictator: function (me) {
            if (me.loadLock === 1) {
                var $mainviewport = me.options.$appContainer.find(".fr-layout-mainviewport");
                $mainviewport.addClass("fr-layout-mainviewport-fullheight");
                //212 is static value for loading indicator width
                var scrollLeft = me.$reportContainer.width() - 212;

                me.$loadingIndicator.css("top", me.$reportContainer.scrollTop() + 100 + "px")
                    .css("left", scrollLeft > 0 ? scrollLeft / 2 : 0 + "px");

                me.$reportContainer.addClass("fr-report-container-translucent");
                me.$loadingIndicator.show();
            }
        },
        /**
         * Removes the loading Indicator
         *
         * @function $.forerunner.reportViewer#removeLoadingIndicator
         */
        removeLoadingIndicator: function () {
            var me = this;
            if (me.loadLock === 1) {
                me.loadLock = 0;
                var $mainviewport = me.options.$appContainer.find(".fr-layout-mainviewport");
                $mainviewport.removeClass("fr-layout-mainviewport-fullheight");

                me.$reportContainer.removeClass("fr-report-container-translucent");
                me.$loadingIndicator.hide();
            }
        },
        _ReRender: function () {
            var me = this;

            if (me.options.userSettings && me.options.userSettings.responsiveUI === true) {                
                for (var i = 1; i <= forerunner.helper.objectSize(me.pages); i++) {
                    me.pages[i].isRendered = false;
                    me.pages[i].$container.html("");
                }
                me._setPage(me.curPage);
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
                me.$reportAreaContainer.append(me.pages[pageNum].$container);
                me._touchNav();
                me._removeDocMap();
            }
            else {
                me.$reportAreaContainer.find(".Page").detach();
                me.$reportAreaContainer.append(me.pages[pageNum].$container);
            }
                       
            me.curPage = pageNum;
            me._trigger(events.changePage, null, { newPageNum: pageNum, paramLoaded: me.paramLoaded, numOfVisibleParameters: me.$numOfVisibleParameters, renderError: me.renderError });

            $(window).scrollLeft(me.scrollLeft);
            $(window).scrollTop(me.scrollTop);
            me.removeLoadingIndicator();
            me.lock = 0;

            if (typeof (me._setPageCallback) === "function") {
                me._setPageCallback();
                me._setPageCallback = null;
            }
            
            // Trigger the change page event to allow any widget (E.g., toolbar) to update their view
            me._trigger(events.setPageDone, null, { newPageNum: pageNum, paramLoaded: me.paramLoaded, numOfVisibleParameters: me.$numOfVisibleParameters, renderError: me.renderError });
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
        allowZoom: function (isEnabled) {
            var me = this;


            if (isEnabled === true){
                forerunner.device.allowZoom(true);
                me.allowSwipe(false);
            }
            else{
                forerunner.device.allowZoom(false);
                me.allowSwipe(true);
            }
            me._trigger(events.allowZoom, null, { isEnabled: isEnabled });

        },

        onInputBlur: function () {
            var me = this;
            if (me.options.onInputBlur)
                me.options.onInputBlur();
        },

        onInputFocus: function () {
            var me = this;
            if (me.options.onInputFocus)
                me.options.onInputFocus();
        },

        _allowSwipe: true,
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
            if (!forerunner.device.isTouch())
                return;
            // Touch Events
            var me = this;
            $(me.element).hammer({ stop_browser_behavior: { userSelect: false }, swipe_max_touches: 2, drag_max_touches: 2 }).on("swipe drag touch release",
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
                            

                            if (ev.gesture.velocityX === 0 && ev.gesture.velocityY === 0)
                                me._updateTableHeaders(me);
                            break;
                    }
                   
                }
            );
        },
        /**
         * Refreshes the current report
         *
         * @function $.forerunner.reportViewer#refreshReport
         */
        refreshReport: function (curPage) {
            // Remove all cached data on the report and re-run
            var me = this;
            var paramList = null;

            if (me.lock === 1)
                return;

            if (curPage === undefined)
                curPage = 1;

            me.sessionID = "";
            me.renderTime = new Date().getTime();

            me.lock = 1;
            me._revertUnsubmittedParameters();

            if (me.paramLoaded === true) {                
                paramList = me.options.paramArea.reportParameter("getParamsList");
            }
            me._resetViewer(true);
            me._loadPage(curPage, false, null, paramList,true);
        },
        /**
         * Navigates to the given page
         *
         * @function $.forerunner.reportViewer#navToPage
         * @param {int} newPageNum - Page number to navigate to
         */
        navToPage: function (newPageNum) {
            var me = this;
            if (newPageNum === me.curPage || me.lock === 1)
                return;
            me._resetContextIfInvalid();
            me.scrollLeft = 0;
            me.scrollTop = 0;

            if (newPageNum > me.numPages) {
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
        },
        _hideDocMap: function() {
            var me = this;
            var docMap = me.options.docMapArea;
            docMap.hide();
            me.element.unmask();
            me._trigger(events.hideDocMap);
        },
        _showDocMap: function () {
            var me = this;
            me._resetContextIfInvalid();
            var docMap = me.options.docMapArea;
            docMap.reportDocumentMap({ $reportViewer: me });

            //get the doc map
            if (!me.docMapData) {
                forerunner.ajax.ajax({
                    url: me.options.reportViewerAPI + "/DocMapJSON/",
                    data: {
                        SessionID: me.sessionID,
                    },
                    dataType: "json",
                    async: false,
                    success: function (data) {
                        me.docMapData = data;
                        docMap.reportDocumentMap("write", data);
                    },
                    fail: function () { forerunner.dialog.showMessageBox(me.options.$appContainer, me.locData.messages.docmapShowFailed); }
                });
            }

            me.element.mask();
            docMap.slideUpShow();
            me._trigger(events.showDocMap);
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
         * Shows the visibility of the Document Map
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
            
            //me._trigger(events.showNav, null, { path: me.options.reportPath, open: me.pageNavOpen });

        },
        _cachePages: function (initPage) {
            var me = this;
             
            initPage = parseInt(initPage, 10);
            
            var low = initPage - 1;
            var high = initPage + 1;
            if (low < 1) low = 1;
            if (high > me.numPages) high = me.numPages;

            for (var i = low; i <= high; i++) {
                if (!me.pages[i])
                    if (i !== initPage)
                        me._loadPage(i, true);
            }

        },
        /**
         * Either:
         *  Loads and pops the page on the action history stack and triggers a drillBack event or triggers a back event
         *
         * @function $.forerunner.reportViewer#back
         * @fires reportviewerdrillback
         * @fires reportviewerback
         * @see forerunner.ssr.constants.events
         */
        back: function () {
            var me = this;
            var action = me.actionHistory.pop();
            if (action) {
                me.options.reportPath = action.ReportPath;
                me.sessionID = action.SessionID;
                
                me._trigger(events.drillBack);
                me._removeParameters();
                me.hideDocMap();
                me.scrollLeft = action.ScrollLeft;
                me.scrollTop = action.ScrollTop;
                me.reportStates = action.reportStates;
                me.renderTime = action.renderTime;
                if (action.FlushCache) {
                    me.flushCache();
                }

                me._loadParameters(action.CurrentPage, action.savedParams);
            }
            else {
                me._trigger(events.back, null, { path: me.options.reportPath });
            }
        },
        /**
         * Shows the Page =igation pane
         *
         * @function $.forerunner.reportViewer#showNav
         */
        showNav: function () {
            var me = this;
            me._resetContextIfInvalid();
            if (me.pageNavOpen) {//close nav
                me.pageNavOpen = false;
                if (window.removeEventListener) {
                    window.removeEventListener("orientationchange", me._handleOrientation, false);
                }
                else {
                    window.detachEvent("orientationchange", me._handleOrientation);
                }
                me.options.$appContainer.css("overflow", "");
                me.element.unmask();
            }
            else {//open nav
                me.pageNavOpen = true;
                if (window.addEventListener) {
                    window.addEventListener("orientationchange", me._handleOrientation, false);
                } else {
                    window.attachEvent("orientationchange", me._handleOrientation);
                }
                me.options.$appContainer.css("overflow", "hidden");
                me.element.mask();
            }

            if (me.options.pageNavArea){
                me.options.pageNavArea.pageNav("showNav");
            }
            me._trigger(events.showNav, null, { path: me.options.reportPath, open: me.pageNavOpen });
        },
        _handleOrientation: function () {
            var pageSection = $(".fr-layout-pagesection");
            if (forerunner.device.isSmall()) {//big screen, height>=768
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
        _prepareAction: function () {
            var me = this;

            if (me.togglePageNum !== me.curPage || me.togglePageNum  === 0) {
                forerunner.ajax.ajax({
                    type: "POST",
                    url: me.options.reportViewerAPI + "/ReportJSON/",
                    data: {
                        ReportPath: me.options.reportPath,
                        SessionID: me.sessionID,
                        PageNumber: me.curPage,
                        ParameterList: ""
                    },
                    dataType: "json",
                    async: false,
                    success: function (data) {
                        me.togglePageNum = me.curPage;
                    },
                    fail: function () { forerunner.dialog.showMessageBox(me.options.$appContainer, me.locData.messages.prepareActionFailed); }
                });
            }
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
                    ClearExistingSort: clear
                },
                async: false,
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
         * @param {String} direction - sort direction
         * @param {String} id - sort item id
         * @param {Boolean} clear - clear existing sort flag
         * @see forerunner.ssr.constants
         */
        sort: function (direction, id, clear) {
            //Go the other dirction from current
            var me = this;
            var newDir;
            var sortDirection = forerunner.ssr.constants.sortDirection;

            if (me.lock === 1)
                return;
            me.lock = 1;
            me._resetContextIfInvalid();

            if (direction === sortDirection.asc)
                newDir = sortDirection.desc;
            else
                newDir = sortDirection.asc;

            me._callSort(id, newDir, clear);
        },

        _callSort: function (id, newDir, clear) {
            var me = this;
            me._updateSortState(id, newDir);
            forerunner.ajax.getJSON(me.options.reportViewerAPI + "/SortReport/",
                {
                    SessionID: me.sessionID,
                    SortItem: id,
                    Direction: newDir,
                    ClearExistingSort: clear
                },
                function (data) {
                    me.scrollLeft = $(window).scrollLeft();
                    me.scrollTop = $(window).scrollTop();

                    me.numPages = data.NumPages;
                    me.renderTime = new Date().getTime();
                    me._loadPage(data.NewPage, false, null, null, true);
                },
                function () { console.log("error"); me.removeLoadingIndicator(); }
            );
        },
        
        _isReportContextValid: true,
        invalidateReportContext : function() {
            this._isReportContextValid = false;
        },
        _callGetReportJSON: function () {
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
                        ReportPath: me.options.reportPath,
                        SessionID: me.sessionID,
                        PageNumber: me.getCurPage(),
                        ParameterList: paramList
                    },
                    success: function (data) {
                        me._isReportContextValid = true;
                    },
                    async: false
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

        _getToggleResult: function (toggleID) {
            var me = this;
            return forerunner.ajax.ajax({
                dataType: "json",
                url : me.options.reportViewerAPI + "/NavigateTo/",
                data: {
                    NavType: navigateType.toggle,
                    SessionID: me.sessionID,
                    UniqueID: toggleID
                },
                async: false,
            });
        },
        
        _replayToggleStates : function() {
            var me = this;
            // Must synchronously replay one-by-one
            var keys = me.reportStates.toggleStates.keys();
            for (var i = 0; i < keys.length; i++) {
                me._getToggleResult(keys[i]);
            }
        },
        /**
         * Sorts the current report
         *
         * @function $.forerunner.reportViewer#toggleItem
         * @param {String} toggleID - Id of the item to toggle
         */
        toggleItem: function (toggleID) {
            var me = this;
            if (me.lock === 1)
                return;
            me.lock = 1;

            me._addLoadingIndicator();
            me._resetContextIfInvalid();
            me._prepareAction();
            
            me._callToggle(toggleID);
        },

        
        _callToggle : function(toggleID) {
            var me = this;
            me._updateToggleState(toggleID);
            forerunner.ajax.getJSON(me.options.reportViewerAPI + "/NavigateTo/",
                {
                    NavType: navigateType.toggle,
                    SessionID: me.sessionID,
                    UniqueID: toggleID
                },
                function (data) {
                    if (data.Result === true) {
                        me.scrollLeft = $(window).scrollLeft();
                        me.scrollTop = $(window).scrollTop();

                        me.pages[me.curPage] = null;
                        me._loadPage(me.curPage, false);
                    }
                    else
                        me.lock = 0;
                },
                function () {
                    me.lock = 0;
                    console.log("error");
                    me.removeLoadingIndicator();
                }
            );
        },

        _resetContextIfInvalid: function () {
            var me = this;
            me._revertUnsubmittedParameters();
            if (!me._isReportContextValid) {
                me._callGetReportJSON();
                // Replay sort states
                me._replaySortStates();
                // Replay toggle states
                me._replayToggleStates();
            }
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
         * @param {String} bookmarkID - Id of the bookmark
         */
        navigateBookmark: function (bookmarkID) {
            var me = this;
            if (me.lock === 1)
                return;
            me.lock = 1;
            me._resetContextIfInvalid();
            me._prepareAction();
            forerunner.ajax.getJSON(me.options.reportViewerAPI + "/NavigateTo/",
                {
                    NavType: navigateType.bookmark,
                    SessionID: me.sessionID,
                    UniqueID: bookmarkID
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
                            forerunner.dialog.showMessageBox(me.options.$appContainer, me.locData.messages.bookmarkNotFound);
                            me.lock = 0;
                        }
                    }
                },
                function () {
                    me.lock = 0;
                    console.log("error");
                    me.removeLoadingIndicator();
                }
            );
        },

        /**
         * Determines if the current report being viewed is the result of a drillthough action
         *
         * @function $.forerunner.reportViewer#isDrillThoughReport
         */
        isDrillThoughReport: function()
        {
            var me = this;
            if (me.origionalReportPath === me.options.reportPath)
                return true;
            else
                return false;
        },
        /**
         * Navigate to the given drill through item
         *
         * @function $.forerunner.reportViewer#navigateDrillthrough
         * @param {String} drillthroughID - Id of the item
         */
        navigateDrillthrough: function (drillthroughID) {
            var me = this;
            if (me.lock === 1)
                return;
            me.lock = 1;
            me._addLoadingIndicator();
            me._resetContextIfInvalid();
            me._prepareAction();
            forerunner.ajax.getJSON(me.options.reportViewerAPI + "/NavigateTo/",
                {
                    NavType: navigateType.drillThrough,
                    SessionID: me.sessionID,
                    UniqueID: drillthroughID
                },
                function (data) {
                    me.backupCurPage(true);
                    if (data.Exception) {
                        me._renderPageError(me.$reportAreaContainer.find(".Page"), data);
                        me.removeLoadingIndicator();
                        me.lock = 0;
                    }
                    else {
                        me.sessionID = data.SessionID;
                        if (me.origionalReportPath === "")
                            me.origionalReportPath = me.options.reportPath;
                        me.options.reportPath = data.ReportPath;
                        me._trigger(events.drillThrough, null, { path: data.ReportPath });
                        if (data.ParametersRequired) {
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
                function () {
                    me.lock = 0;
                    console.log("error");
                    me.removeLoadingIndicator();
                }
            );
        },
        /**
         * Navigate to the Document Map
         *
         * @function $.forerunner.reportViewer#navigateDocumentMap
         * @param {String} docMapID - Id of the document map
         */
        navigateDocumentMap: function (docMapID) {
            var me = this;
            if (me.lock === 1)
                return;
            me.lock = 1;
            me._resetContextIfInvalid();
            forerunner.ajax.getJSON(me.options.reportViewerAPI + "/NavigateTo/",
                {
                    NavType: navigateType.docMap,
                    SessionID: me.sessionID,
                    UniqueID: docMapID
                },
                function (data) {
                    me.backupCurPage(false,true);
                    me.hideDocMap();
                    me._loadPage(data.NewPage, false, docMapID);
                },
                function () {
                    me.lock = 0;
                    console.log("error");
                    me.removeLoadingIndicator();
                }
            );
        },
        /**
         * Push the current page onto the action history stack
         *
         * @function $.forerunner.reportViewer#backupCurPage
         */
        backupCurPage: function (flushCache,useSavedLocation) {
            var me = this;

            var top = $(window).scrollTop();
            var left = $(window).scrollLeft();
            var savedParams;

            if (flushCache !== true)
                flushCache = false;
            if (useSavedLocation === true) {
                top = me.savedTop;
                left = me.savedLeft;
            }

            if (me.paramLoaded) {
                var $paramArea = me.options.paramArea;
                //get current parameter list without validate
                savedParams = $paramArea.reportParameter("getParamsList", true);
            }

            me.actionHistory.push({
                ReportPath: me.options.reportPath, SessionID: me.sessionID, CurrentPage: me.curPage, ScrollTop: top,
                ScrollLeft: left, FlushCache: flushCache, paramLoaded: me.paramLoaded, savedParams: savedParams, reportStates: me.reportStates,renderTime : me.renderTime
            });
        },
        _setScrollLocation: function (top, left) {
            var me = this;
            me.scrollLeft = left;
            me.scrollTop = top;
        },
        /**
         * Find the given keyword. Find will always find the first occurance
         *
         * @function $.forerunner.reportViewer#find
         * @param {String} keyword - Keyword to find
         * @param {int} startPage - Starting page of the search range
         * @param {int} endPage - Ending page of the search range
         */
        find: function (keyword, startPage, endPage, findInNewPage) {
            var me = this;
            if (keyword === "") return;
            me._resetContextIfInvalid();
            //input new keyword
            if (!me.findKeyword || me.findKeyword !== keyword) {
                me.resetFind();
                me.findKeyword = keyword;
            }

            if (me.finding && !findInNewPage) {
                me._findNext(keyword);
            }
            else {
                if (startPage === undefined)
                    startPage = me.getCurPage();

                if (endPage === undefined)
                    endPage = me.getNumPages();

                if (startPage > endPage) {
                    me.resetFind();
                    forerunner.dialog.showMessageBox(me.options.$appContainer, me.locData.messages.completeFind);
                    return;
                }

                //mark up find start page
                if (me.findStartPage === null)
                    me.findStartPage = startPage;

                forerunner.ajax.getJSON(me.options.reportViewerAPI + "/FindString/",
                    {
                        SessionID: me.sessionID,
                        StartPage: startPage,
                        EndPage: endPage,
                        FindValue: keyword
                    },
                    function (data) {
                        if (data.NewPage !== 0) {//keyword exist
                            me.finding = true;
                            if (data.NewPage !== me.getCurPage()) {
                                me._addSetPageCallback(function () { me.setFindHighlight(keyword); });
                                me.pages[data.NewPage] = null;
                                me._loadPage(data.NewPage, false);
                            } else {
                                me.setFindHighlight(keyword);
                            }
                        }
                        else {//keyword not exist
                            if (me.findStartPage !== 1) {
                                me.find(keyword, 1, me.findStartPage - 1);
                                me.findStartPage = 1;
                            }
                            else {
                                if (me.finding === true)
                                    forerunner.dialog.showMessageBox(me.options.$appContainer, me.locData.messages.completeFind);
                                else
                                    forerunner.dialog.showMessageBox(me.options.$appContainer, me.locData.messages.keyNotFound);
                                me.resetFind();
                            }
                        }
                    },
                    function () { console.log("error"); me.removeLoadingIndicator(); }
                );
            }
        },
        /**
         * Find the next occurance of the given keyword
         *
         * @function $.forerunner.reportViewer#findNext
         * @param {String} keyword - Keyword to find
         */
        _findNext: function (keyword) {
            var me = this;
            $(".fr-render-find-keyword").filter(".fr-render-find-highlight").first().removeClass("fr-render-find-highlight");

            var $nextWord = $(".fr-render-find-keyword").filter(":visible").filter(".Unread").first();
            if ($nextWord.length > 0) {
                $nextWord.removeClass("Unread").addClass("fr-render-find-highlight").addClass("Read");
                me._trigger(events.navToPosition, null, { top: $nextWord.offset().top - 150, left: $nextWord.offset().left - 250 });
            }
            else {
                if (me.getNumPages() === 1) {
                    forerunner.dialog.showMessageBox(me.options.$appContainer, me.locData.messages.completeFind);
                    me.resetFind();
                    return;
                }
                var endPage = me.findEndPage ? me.findEndPage : me.getNumPages();

                if (me.getCurPage() + 1 <= endPage){
                    me.find(keyword, me.getCurPage() + 1, undefined, true);
                }
                else if (me.findStartPage > 1) {
                    me.findEndPage = me.findStartPage - 1;
                    if (me.getCurPage() === me.findEndPage) {
                        forerunner.dialog.showMessageBox(me.options.$appContainer, me.locData.messages.completeFind);
                        me.resetFind();
                    }
                    else {
                        me.find(keyword, 1, me.findStartPage - 1, true);
                    }
                }
                else {
                    forerunner.dialog.showMessageBox(me.options.$appContainer, me.locData.messages.completeFind);
                    me.resetFind();
                }
            }
        },
        /**
         * Highlights the first matched keyword
         *
         * @function $.forerunner.reportViewer#setFindHighlight
         * @param {String} keyword - Keyword to highlight
         */
        setFindHighlight: function (keyword) {
            var me = this;
            me._clearHighLightWord();
            me._highLightWord(me.$reportContainer, keyword);

            //Highlight the first match.
            var $item = me.$reportContainer.find(".fr-render-find-keyword").filter(":visible").filter(".Unread").first();
            if ($item.length > 0) {
                $item.removeClass("Unread").addClass("fr-render-find-highlight").addClass("Read");
                me._trigger(events.navToPosition, null, { top: $item.offset().top - 150, left: $item.offset().left - 250 });
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
         * Export the report in the given format
         *
         * @function $.forerunner.reportViewer#exportReport
         * @param {String} exportType - Export format
         * @see forerunner.ssr.constants
         */
        exportReport: function (exportType) {
            var me = this;
            me._resetContextIfInvalid();
            var url = me.options.reportViewerAPI + "/ExportReport/?ReportPath=" + me.getReportPath() + "&SessionID=" + me.getSessionID() + "&ParameterList=&ExportType=" + exportType;
            window.open(url);
        },       
        /**
         * show print modal dialog, close it if opened
         *
         * @function $.forerunner.reportViewer#showPrint
         */
        showPrint: function () {
            var me = this;
            me._printDialog.reportPrint("openDialog");
            //forerunner.dialog.showReportPrintDialog(me.options.$appContainer);
        },
        /**
        * print current reprot in custom PDF format
        *
        * @function $.forerunner.reportViewer#printReport         
        * @param {function} printPropertyList - custom print page layout option
        */
        printReport: function (printPropertyList) {
            var me = this;
            me._resetContextIfInvalid();
            var url = me.options.reportViewerAPI + "/PrintReport/?ReportPath=" + me.getReportPath() + "&SessionID=" + me.getSessionID() + "&ParameterList=&PrintPropertyString=" + printPropertyList;
            window.open(url);
        },

        _printDialog : null,
        _setPrint: function (pageLayout) {
            var me = this;
            var $dlg = me.options.$appContainer.find(".fr-print-section");
            $dlg.reportPrint("setPrint", pageLayout);
            me._printDialog = $dlg;
        },
       
        //Page Loading
        _onModelSetChanged: function (e, savedParams) {
            var me = this;
            var pageNum = me.getCurPage();
            if (savedParams) {
                me.refreshParameters(savedParams, true, pageNum);
            }
        },
        _loadParameters: function (pageNum, savedParamFromHistory) {
            var me = this;
            var savedParams = savedParamFromHistory ? savedParamFromHistory :
                (me.options.parameterModel ? me.options.parameterModel.parameterModel("getCurrentParameterList", me.options.reportPath) : null);

            if (savedParams) {
                if (me.options.paramArea) {
                    me.options.paramArea.reportParameter({
                        $reportViewer: this,
                        $appContainer: me.options.$appContainer
                    });
                    me.refreshParameters(savedParams, true, pageNum);
                }
            } else {
                me._loadDefaultParameters(pageNum);
            }
        },
        _paramsToString: function (a) {
            return JSON.stringify(a);
        },
        _loadDefaultParameters: function (pageNum) {
            var me = this;
            forerunner.ajax.ajax({
                type: "POST",
                url: me.options.reportViewerAPI + "/ParameterJSON/",
                data: {
                    ReportPath: me.options.reportPath,
                    SessionID: me.getSessionID(),
                    ParameterList: null
                },
                dataType: "json",
                async: true,
                success: function (data) {
                    if (data.SessionID)
                        me.sessionID = data.SessionID;
                    me._addLoadingIndicator();
                    me._showParameters(pageNum, data);
                },
                error: function (data) {
                    console.log("error");
                    me.removeLoadingIndicator();
                }
            });
        },
        _showParameters: function (pageNum, data) {
            var me = this;
            
            if (data.Type === "Parameters") {
                me._removeParameters();
                
                var $paramArea = me.options.paramArea;
                if ($paramArea) {
                    $paramArea.reportParameter({ $reportViewer: this, $appContainer: me.options.$appContainer });
                    $paramArea.reportParameter("writeParameterPanel", data, pageNum);
                    me.$numOfVisibleParameters = $paramArea.reportParameter("getNumOfVisibleParameters");
                    if (me.$numOfVisibleParameters > 0)
                        me._trigger(events.showParamArea, null, { reportPath: me.options.reportPath});

                    me.paramLoaded = true;
                }
            }
            else if (data.Exception) {
                me._renderPageError(me.$reportContainer, data);
                me.removeLoadingIndicator();
            }
            else {
                me._loadPage(pageNum, false);
            }
        },
        /**
         * Refresh the parameter using the given list
         *
         * @function $.forerunner.reportViewer#refreshParameters
         * @param {string} The JSON string for the list of parameters.
         * @param {boolean} Submit form if the parameters are satisfied.
         * @param {int} The page to load.  Specify -1 to load the current page.
         * @param {boolean} Whether to trigger show parameter area event if there are visible parameters.
         */
        refreshParameters: function (paramList, submitForm, pageNum, renderParamArea) {
            var me = this;
            if (pageNum === -1) {
                pageNum = me.getCurPage();
            }
            if (paramList) {
                forerunner.ajax.ajax({
                    type: "POST",
                    url: me.options.reportViewerAPI + "/ParameterJSON",
                    data : {
                        ReportPath: me.options.reportPath,
                        SessionID: me.getSessionID(),
                        ParameterList: paramList
                    },
                    dataType: "json",
                    async: false,
                    success: function (data) {
                        if (data.SessionID)
                            me.sessionID = data.SessionID;

                        if (data.ParametersList) {
                            me.options.paramArea.reportParameter("updateParameterPanel", data, submitForm, pageNum, renderParamArea);
                            me.$numOfVisibleParameters = me.options.paramArea.reportParameter("getNumOfVisibleParameters");
                            if (me.$numOfVisibleParameters > 0) { 
                                me._trigger(events.showParamArea, null, { reportPath: me.options.reportPath });
                            }
                            me.paramLoaded = true;
                        }
                    }
                });
            }
        },
        _removeParameters: function () {
            var me = this;
            if (me.paramLoaded === true) {
                var $paramArea = me.options.paramArea;
                if ($paramArea) {
                    $paramArea.reportParameter("removeParameter");
                    me.paramLoaded = false;
                    me.$numOfVisibleParameters = 0;
                }
            }
        },
        _resetViewer: function(isSameReport){
            var me = this;

            //me.sessionID = "";
            me.numPages = 0;
            me.floatingHeaders = [];
            if (!isSameReport) {
                me.paramLoaded = false;
                me._removeSetTimeout();
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
            
        },
        /**
         * Load the given report
         *
         * @function $.forerunner.reportViewer#loadReport
         * @param {String} reportPath - Path to the specific report
         * @param {int} pageNum - starting page number
         */
        loadReport: function (reportPath, pageNum) {
            var me = this;

            me._resetViewer();            
            me.options.reportPath = reportPath;
            me.options.pageNum = pageNum;

            if (me.options.jsonPath) {
                me._renderJson();
            } else {
                me._loadParameters(pageNum);
            }
        },
        /**
         * Load current report with the given parameter list
         *
         * @function $.forerunner.reportViewer#loadReportWithNewParameters
         * @param {Object} paramList - Paramter list object
         * @param {int} pageNum - The page to load
         */
        loadReportWithNewParameters: function (paramList, pageNum) {
            var me = this;
           
            me._resetViewer(true);
            if (!pageNum) {
                pageNum = 1;
            }
            me._loadPage(pageNum, false, null, paramList, true);
        },
        _renderJson : function () {
            var me = this;
            var newPageNum = 1;
            var loadOnly = false;

            if (!me.element.is(":visible") && !loadOnly)
                me.element.show(); //scrollto does not work with the slide in functions:(

            me._addLoadingIndicator();
            me.togglePageNum = newPageNum;
            forerunner.ajax.ajax(
                {
                    type: "GET",
                    dataType: "json",
                    url: me.options.jsonPath,
                    async: false,
                    success: function (data) {
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
                    error: function () { console.log("error"); me.removeLoadingIndicator(); }
                });
        },
        _loadPage: function (newPageNum, loadOnly, bookmarkID, paramList, flushCache) {
            var me = this;

            if (flushCache === true)
                me.flushCache();

            if (me.pages[newPageNum])
                if (me.pages[newPageNum].$container) {
                    if (!loadOnly) {
                        me._setPage(newPageNum);
                        if (!me.element.is(":visible") && !loadOnly)
                            me.element.show(); //scrollto does not work with the slide in functions:(
                        if (bookmarkID)
                            me._navToLink(bookmarkID);
                        if (me.pages[newPageNum].reportObj.ReportContainer && me.pages[newPageNum].reportObj.ReportContainer.Report.AutoRefresh) // reset auto refresh if exist.
                            me._setAutoRefresh(me.pages[newPageNum].reportObj.ReportContainer.Report.AutoRefresh);
                        if (flushCache !== true)
                            me._cachePages(newPageNum);
                    }
                    return;
                }
            if (!paramList) paramList = "";

            if (!loadOnly) {
                me._addLoadingIndicator();
            }
            me.togglePageNum = newPageNum;            
            forerunner.ajax.ajax(
                {
                    type: "POST",
                    dataType: "json",
                    url: me.options.reportViewerAPI + "/ReportJSON/",
                    data: {
                        ReportPath: me.options.reportPath,
                        SessionID: me.sessionID,
                        PageNumber: newPageNum,
                        ParameterList: paramList
                    },
                    async: true,
                    success: function (data) {
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

                            me._updateTableHeaders(me);
                        }
                    },
                    error: function () { console.log("error"); me.removeLoadingIndicator(); }
                });
        },
        
        _writePage: function (data, newPageNum, loadOnly) {
            var me = this;
            var $report = $("<Div/>");
            $report.addClass("Page");
            //Error, need to handle this better
            if (!data) return;
            
            var responsiveUI = false;
            if (me.options.userSettings && me.options.userSettings.responsiveUI === true) {
                responsiveUI = true;
            }
            $report.reportRender({ reportViewer: me, responsive: responsiveUI, renderTime: me.renderTime });

            if (!loadOnly && !data.Exception && data.ReportContainer.Report.AutoRefresh) {
                me._addSetPageCallback(function () {
                    me._setAutoRefresh(data.ReportContainer.Report.AutoRefresh);
                });
            }

            if (!me.pages[newPageNum])
                me.pages[newPageNum] = new reportPage($report, data);
            else {
                me.pages[newPageNum].$container = $report;
                me.pages[newPageNum].reportObj = data;
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

            if (!loadOnly) {
                me._renderPage(newPageNum);
                me._setPage(newPageNum);
            }
        },
        _renderPage: function (pageNum) {
            //Write Style
            var me = this;
            if (me.pages[pageNum] && me.pages[pageNum].isRendered === true)
                return;

            if (!me.pages[pageNum].reportObj.Exception) {
                me.hasDocMap = me.pages[pageNum].reportObj.HasDocMap;

                //Render responsive if set
                var responsiveUI = false;
                if (me.options.userSettings && me.options.userSettings.responsiveUI === true) {
                    responsiveUI = true;
                }

                me.pages[pageNum].$container.reportRender({ reportViewer: me, responsive: responsiveUI, renderTime: me.renderTime });
                me.pages[pageNum].$container.reportRender("render", me.pages[pageNum].reportObj);
            }
            else
                me._renderPageError(me.pages[pageNum].$container, me.pages[pageNum].reportObj);

            me.pages[pageNum].isRendered = true;
        },
        _renderPageError: function ($container, errorData) {
            var me = this;

            me.renderError = true;
            $container.reportRender({ reportViewer: me });
            $container.reportRender("writeError", errorData);
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
                        PingSessionID: sessionID
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
                if (obj.$rowHeader) obj.$rowHeader.hide();
                if (obj.$colHeader) obj.$colHeader.hide();
            });
            if (me.$floatingToolbar) me.$floatingToolbar.hide();
        },
        _navToLink: function (elementID) {
            var me = this;
            var navTo = me.element.find("[name='" + elementID + "']")[0];
            if (navTo !== undefined) {
                //Should account for floating headers and toolbar height need to be a calculation
                var bookmarkPosition = { top: $(navTo).offset().top - 100, left: $(navTo).offset().left };
                
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
        _highLightWord: function ($element, keyword) {
            if (!keyword || keyword === "") {
                return;
            }
            else {
                var me = this;
                $($element).each(function () {
                    var elt = $(this).get(0);
                    elt.normalize();
                    $.each(elt.childNodes, function (i, node) {
                        //nodetype=3 : text node
                        if (node.nodeType === 3) {
                            var searchnode = node;
                            try{
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
                            me._highLightWord($(node), keyword);
                        }
                    });
                });
            }
            return $(this);
        },
        _clearHighLightWord: function () {
            $(".fr-render-find-keyword").each(function () {
                var text = document.createTextNode($(this).text());
                $(this).replaceWith($(text));
            });
        },
        _setAutoRefresh: function (period) {
            var me = this;
            
            //me.autoRefreshID will be set to undefined when report viewer destory.
            if (me.autoRefreshID !== undefined) {
                //one report viewer should has only one auto refresh, so clear previous setTimeout when new one come
                if (me.autoRefreshID !== null) me._removeSetTimeout();

                me.autoRefreshID = setTimeout(function () {
                    if (me.lock === 1) {
                        //if report viewer is lock then set it again.
                        me._setAutoRefresh(period);
                        return;
                    }
                    else {
                        //restore privious scroll position
                        var containerTop = me.options.$appContainer.scrollTop();
                        var containerLeft = me.options.$appContainer.scrollLeft();
                        var windowTop = $(window).scrollTop();
                        var windowLeft = $(window).scrollLeft();
                        
                        me._addSetPageCallback(function () {
                            me.options.$appContainer.scrollTop(containerTop).scrollLeft(containerLeft);
                            $(window).scrollTop(windowTop).scrollLeft(windowLeft);
                        });

                        me.refreshReport(me.getCurPage());
                        //console.log("report: " + me.getReportPath() + " refresh at:" + new Date());
                    }
                }, period * 1000);

                //console.log('add settimeout, period: ' + period + "s");
            }
        },
        _removeSetTimeout: function () {
            var me = this;

            if (me.autoRefreshID !== null) {
                clearTimeout(me.autoRefreshID);
                //console.log('remove settimeout');
            }
            me.autoRefreshID = null;
        },
        destroy: function () {
            var me = this;

            me._removeSetTimeout();
            me.autoRefreshID = undefined;
            //console.log('report viewer destory is invoked')

            //comment from MSDN: http://msdn.microsoft.com/en-us/library/hh404085.aspx
            // if using jQuery UI 1.8.x
            //$.Widget.prototype.destroy.call(this);
            // if using jQuery UI 1.9.x
            this._destroy();
        },
    });  // $.widget
});   // $(function


