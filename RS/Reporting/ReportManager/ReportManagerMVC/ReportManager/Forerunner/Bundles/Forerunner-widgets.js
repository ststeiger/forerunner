///#source 1 1 /Forerunner/ReportViewer/js/ReportViewer.js
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
            me.reportStates = { toggleStates: new forerunner.ssr.map(), sortStates: [] };
            
            var isTouch = forerunner.device.isTouch();
            // For touch device, update the header only on scrollstop.
            if (isTouch) {
                $(window).on("scrollstop", function () { me._updateTableHeaders(me); });
            } else {
                $(window).on("scroll", function () { me._updateTableHeaders(me); });
            }
            //load the report Page requested
            me.element.append(me.$reportContainer);
            me._addLoadingIndicator();
            //me._loadParameters(me.options.pageNum);
            me.hideDocMap();
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
                //212 is static value for loading indicator width
                var scrollLeft = me.$reportContainer.width() - 212;

                me.$loadingIndicator.css("top", me.$reportContainer.scrollTop() + 100 + "px")
                    .css("left", scrollLeft > 0 ? scrollLeft / 2 : 0 + "px");

                me.$reportContainer.css({ opacity: 0.5 });
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
            me.loadLock = 0;
            me.$reportContainer.css({ opacity: 1 });
            me.$loadingIndicator.hide();
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
        refreshReport: function () {
            // Remove all cached data on the report and re-run
            var me = this;
            var paramList = null;

            if (me.lock === 1)
                return;

            me.sessionID = "";
            me.lock = 1;
            me._revertUnsubmittedParameters();

            if (me.paramLoaded === true) {                
                paramList = me.options.paramArea.reportParameter("getParamsList");
            }
            me._resetViewer(true);
            me._loadPage(1, false, null, paramList,true);            
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
                    url: me.options.reportViewerAPI + "/GetReportJSON/",
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
                },
                function () {
                    console.log("error"); me.removeLoadingIndicator();
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
                        me.backupCurPage();
                        if (data.NewPage !== undefined && data.NewPage > 0) {
                            me._loadPage(data.NewPage, false, bookmarkID);
                        } else {
                            // BUGBUG:  It looks like a lot of the error messages are not yet localized.
                            forerunner.dialog.showMessageBox(me.options.$appContainer, me.locData.messages.bookmarkNotFound);
                        }
                    }
                },
                function () { console.log("error"); me.removeLoadingIndicator(); }
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
                function () { console.log("error"); me.removeLoadingIndicator(); }
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
                function () { console.log("error"); me.removeLoadingIndicator(); }
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
                ScrollLeft: left, FlushCache: flushCache, paramLoaded: me.paramLoaded, savedParams: savedParams, reportStates: me.reportStates
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
                $(window).scrollTop($nextWord.offset().top - 150);
                $(window).scrollLeft($nextWord.offset().left - 250);
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
                $(window).scrollTop($item.offset().top - 150);
                $(window).scrollLeft($item.offset().left - 250);
                //window.scrollTo($item.offset().left - 100, $item.offset().top - 100);
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
            forerunner.dialog.showReportPrintDialog(me.options.$appContainer);
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
        _setPrint: function (pageLayout) {
            var me = this;
            var $dlg = me.options.$appContainer.find(".fr-layout-printsection");
            $dlg.reportPrint("setPrint", pageLayout);
        },
       
        //Page Loading
        _loadParameters: function (pageNum, savedParamFromHistory) {
            var me = this;
            var savedParams = savedParamFromHistory ? savedParamFromHistory :
                (me.options.loadParamsCallback ? me.options.loadParamsCallback(me.options.reportPath) : null);
            
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
            forerunner.ajax.getJSON(
                    me.options.reportViewerAPI + "/ParameterJSON/",
                    {
                        ReportPath: me.options.reportPath,
                        SessionID: me.getSessionID()
                    },
                    function (data) {
                        if (data.SessionID)
                            me.sessionID = data.SessionID;
                        me._addLoadingIndicator();
                        me._showParameters(pageNum, data);
                    },
                    function (data) {
                        console.log("error");
                        me.removeLoadingIndicator();
                    });
        },
        _showParameters: function (pageNum, data) {
            var me = this;
            
            if (data.Type === "Parameters") {
                me._removeParameters();
                
                var $paramArea = me.options.paramArea;
                if ($paramArea) {
                    $paramArea.reportParameter({ $reportViewer: this });
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
                    url: me.options.reportViewerAPI + "/ParameterJSON?ReportPath=" + me.options.reportPath + "&SessionID=" + me.getSessionID() + "&paramList=" + paramList,
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
            if (!isSameReport)
                me.paramLoaded = false;
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
            me._loadParameters(pageNum);            
            
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
            forerunner.ajax.getJSON(me.options.reportViewerAPI + "/ReportJSON/",
                {
                    ReportPath: me.options.reportPath,
                    SessionID: me.sessionID,
                    PageNumber: newPageNum,
                    ParameterList: paramList
                },
                function (data) {
                    me._writePage(data, newPageNum, loadOnly);
                    if (data.ReportContainer) {
                        me._setPrint(data.ReportContainer.Report.PageContent.PageLayoutStart);
                    }

                    if (!me.element.is(":visible") && !loadOnly)
                        me.element.show();  //scrollto does not work with the slide in functions:(
                    if (bookmarkID)
                        me._navToLink(bookmarkID);
                    if (!loadOnly && flushCache !== true)
                        me._cachePages(newPageNum);
                },
                function () { console.log("error"); me.removeLoadingIndicator(); }
            );
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
            $report.reportRender({ reportViewer: me, responsive: responsiveUI });

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
                $(document).scrollTop($(navTo).offset().top - 100);  //Should account for floating headers and toolbar height need to be a calculation
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
        }
    });  // $.widget
});   // $(function



///#source 1 1 /Forerunner/Common/js/Toolbase.js
/**
 * @file Contains the toolBase widget.
 *
 */

var forerunner = forerunner || {};
forerunner.ssr = forerunner.ssr || {};

$(function () {
    var widgets = forerunner.ssr.constants.widgets;
    var toolTypes = forerunner.ssr.constants.toolTypes;

    var dropdownContainerClass = "fr-toolbase-dropdown-container";

    /**
     * The toolBase widget is used as a base namespace for toolbars and the toolPane
     *
     * @namespace $.forerunner.toolBase
     * @prop {object} options - The options for toolBase
     * @prop {String} options.toolClass - The top level class for this tool (E.g., fr-toolbar)
     * @example
     * var widgets = {@link forerunner.ssr.constants.widgets};
     * $.widget(widgets.getFullname(widgets.toolbar), $.forerunner.toolBase, {
     *  options: {
     *      $reportViewer: null,
     *      toolClass: "fr-toolbar"
     *  },
     * });
     */
    $.widget(widgets.getFullname(widgets.toolBase), /** @lends $.forerunner.toolBase */ {
        options: {
            toolClass: null
        },

        /**
         * Add tools starting at index, enabled or disabled based upon the given tools array.
         * @function $.forerunner.toolBase#addTools
         *
         * @param {int} index - 1 based index of where to insert the button array.
         * @param {bool} enabled - true = enabled, false = disabled
         * @param {array} tools - array containing the collection of tool information objects.
         * @example
         * var toolTypes = {@link forerunner.ssr.constants.toolTypes};
         * 
         * var btnMenu = {
         *  toolType: toolTypes.button,
         *  selectorClass: "fr-toolbar-menu-button",
         *  imageClass: "fr-icons24x24-menu",
         *  events: {
         *      click: function (e) {
         *          e.data.me._trigger(events.menuClick, null, {});
         *      }
         *  }
         * };
         * 
         * this.element.html("&lt;div class='" + me.options.toolClass + "'/>");
         * this.addTools(1, true, [btnMenu]);
         *
         *  Notes:
         *      Any events property that is of type function, e.g., "click" above will be interpreted
         *      as a event handler. The event, i.e., the name of the property will be bound to the button
         *      when the button is enabled and removed when the button is disabled.
         */
        addTools: function (index, enabled, tools) {
            var me = this;
            var $toolbar = me.element.find("." + me.options.toolClass);
            me._addChildTools($toolbar, index, enabled, tools);

            if (enabled) {
                me.enableTools(tools);
            }
            else {
                me.disableTools(tools);
            }
        },
        _addChildTools: function ($parent, index, enabled, tools) {
            var me = this;
            me.allTools = me.allTools || {};

            var $firstTool = $(me._getToolHtml(tools[0]));

            if (index <= 1) {
                $parent.prepend($firstTool);
            }
            else if (index > $parent.children().length) {
                $parent.append($firstTool);
            }
            else {
                var selector = ":nth-child(" + index + ")";
                var $child = $parent.children(selector);
                $child.before($firstTool);
            }

            var $tool = $firstTool;
            me._addChildTool($tool, tools[0], enabled);
            for (var i = 1; i < tools.length; i++) {
                var toolInfo = tools[i];
                $tool.after(me._getToolHtml(toolInfo));
                $tool = $tool.next();
                me._addChildTool($tool, toolInfo, enabled);
            }
        },
        _addChildTool: function ($tool, toolInfo, enabled) {
            var me = this;
            me.allTools[toolInfo.selectorClass] = toolInfo;
            if (toolInfo.toolType === toolTypes.toolGroup && toolInfo.tools) {
                me._addChildTools($tool, 1, enabled, toolInfo.tools);      // Add the children of a tool group
            }

            if (toolInfo.sharedClass) {
                $tool.addClass(toolInfo.sharedClass);
            }

            if (toolInfo.tooltip) {
                $tool.attr("title", toolInfo.tooltip);
            }

            if (toolInfo.dropdown) {
                me._createDropdown($tool, toolInfo);
            }

            if (toolInfo.visible === false) {
                $tool.hide();
            }
        },
        _createDropdown: function($tool, toolInfo) {
            var me = this;

            // Create the dropdown
            toolInfo.$dropdown = $("<div class='" + dropdownContainerClass + "'/>");
            toolInfo.$dropdown.toolDropdown({ $reportViewer: me.options.$reportViewer });
            toolInfo.$dropdown.toolDropdown("addTools", 1, true, toolInfo.tools);

            $tool.append(toolInfo.$dropdown);
            var $dropdown = $tool.find("." + dropdownContainerClass);
            var selectorClass = toolInfo.selectorClass;
            var imageClass = toolInfo.imageClass;

            // tool click event handler
            $tool.on("click", { toolInfo: toolInfo, $tool: $tool }, function (e) {
                $dropdown.css("left", e.data.$tool.filter(":visible").offset().left - e.data.$tool.filter(":visible").offsetParent().offset().left);
                //$dropdown.css("top", e.data.$tool.filter(":visible").offset().top + e.data.$tool.height());
                $dropdown.css("top", e.data.$tool.height());
                $dropdown.toggle();
            });

            // dropdown dismiss handler
            $(document).on("click", function (e) {
                if ($dropdown.is(":visible") && !$(e.target).hasClass(selectorClass) && !$(e.target).hasClass(imageClass)) {
                    $dropdown.toggle();
                }
            });
        },


        /**
       * Return the tool object
       * @function $.forerunner.toolBase#getTool
       */
        getTool: function (selectorClass) {
            var me = this;
            return me.allTools[selectorClass];
        },


        /**
        * Make tool visible
        * @function $.forerunner.toolBase#hideTool
        */
        showTool: function(selectorClass){
            var me = this;
            if (me.allTools[selectorClass]) {
                // NOTE: that you cannot know when hiding a tool if it should be made
                // visible in the showTool function. So the strategy here is to remove
                // the display style on the element and thereby revert the visibility
                // back to the style sheet definition.
                var $toolEl = me.element.find("." + selectorClass);
                $toolEl.css({"display": ""});
            }
        },
        /**
         * Make all tools visible
         * @function $.forerunner.toolBase#showAllTools
         */
        showAllTools: function () {
            var me = this;

            $.each(me.allTools, function (Index, Obj) {
                if (Obj.selectorClass)
                    me.showTool(Obj.selectorClass);
            });

        },
        /**
        * Make tool hidden
        * @function $.forerunner.toolBase#hideTool
        */
        hideTool: function (selectorClass) {
            var me = this;
            if (me.allTools[selectorClass]) {
                // NOTE: that you cannot know when hiding a tool if it should be made
                // visible in the showTool function. That is because a resize / orientation
                // change may happen that changes which buttons should be visible at the 
                // time showTool is called.
                var $toolEl = me.element.find("." + selectorClass);
                $toolEl.hide();
            }
        },

        /**
         * Make all tools hidden
         * @function $.forerunner.toolBase#hideAllTools
         */
        hideAllTools: function (){
            var me = this;

            $.each(me.allTools, function (Index, Obj) {
                if (Obj.selectorClass)
                    me.hideTool(Obj.selectorClass);
            });

        },
        freezeEnableDisable: function (freeze) {
            var me = this;
            me.frozen = freeze;
        },
        /**
         * Enable the given tools
         * @function $.forerunner.toolBase#enableTools
         * @param {Array} tools - Array of tools to enable
         */
        enableTools: function (tools) {
            var me = this;

            if (me.frozen === true) {
                return;
            }

            $.each(tools, function (index, toolInfo) {
                var $toolEl = me.element.find("." + toolInfo.selectorClass);
                $toolEl.removeClass("fr-toolbase-disabled");
                if (toolInfo.events) {
                    $toolEl.addClass("fr-core-cursorpointer");
                    me._removeEvent($toolEl, toolInfo);   // Always remove any existing event, this will avoid getting two accidentally
                    me._addEvents($toolEl, toolInfo);
                }
                if (toolInfo.toolType === toolTypes.toolGroup && toolInfo.tools) {
                    me.enableTools(toolInfo.tools);
                }
            });
        },
        /**
         * disable the given tools
         * @function $.forerunner.toolBase#disableTools
         * @param {Array} tools - Array of tools to enable
         */
        disableTools: function (tools) {
            var me = this;

            if (me.frozen === true) {
                return;
            }

            $.each(tools, function (index, toolInfo) {
                var $toolEl = me.element.find("." + toolInfo.selectorClass);
                $toolEl.addClass("fr-toolbase-disabled");
                if (toolInfo.events) {
                    $toolEl.removeClass("fr-core-cursorpointer");
                    me._removeEvent($toolEl, toolInfo);
                }
                if (toolInfo.toolType === toolTypes.toolGroup && toolInfo.tools) {
                    me.disableTools(toolInfo.tools);
                }
            });
        },
        /**
        * Make all tools enable that where enabled before disable
        * @function $.forerunner.toolBase#enableAllTools
        */
        enableAllTools: function () {
            var me = this;

            $.each(me.allTools, function (Index, Tools) {
                if (Tools.selectorClass && me.allTools[Tools.selectorClass].isEnable) {
                    me.enableTools([Tools]);
                }
            });
        },
        /**
        * Make all tools disable and remember which ones where enabled
        * @function $.forerunner.toolBase#disableAllTools
        */
        disableAllTools: function () {
            var me = this;

            $.each(me.allTools, function (Index, Tools) {
                if (Tools.selectorClass) {
                    var $toolEl = me.element.find("." + Tools.selectorClass);
                    if (!$toolEl.hasClass("fr-toolbase-no-disable-id")) {
                        me.allTools[Tools.selectorClass].isEnable = !$toolEl.hasClass("fr-toolbase-disabled");
                        me.disableTools([Tools]);
                    }
                }
            });
        },
        _getToolHtml: function (toolInfo) {
            var me = this;

            // Get class string options
            var toolStateClass = me._getClassValue(toolInfo.toolStateClass, "fr-toolbase-state ");
            var iconClass = me._getClassValue(toolInfo.iconClass, "fr-icons24x24");
            var toolContainerClass = me._getClassValue(toolInfo.toolContainerClass, "fr-toolbase-toolcontainer");
            var groupContainerClass = me._getClassValue(toolInfo.groupContainerClass, "fr-toolbase-groupcontainer");
            var itemContainerClass = me._getClassValue(toolInfo.itemContainerClass, "fr-toolbase-itemcontainer");
            var itemTextContainerClass = me._getClassValue(toolInfo.itemTextContainerClass, "fr-toolbase-item-text-container");
            var itemTextClass = me._getClassValue(toolInfo.itemTextClass, "fr-toolbase-item-text");

            if (toolInfo.toolType === toolTypes.button) {
                return "<div class='" + toolContainerClass + " " + toolStateClass + toolInfo.selectorClass + "'>" +
                            "<div class='" + iconClass + " " + toolInfo.imageClass + "' />" +
                        "</div>";
            }
            else if (toolInfo.toolType === toolTypes.input) {
                var type = "";
                if (toolInfo.inputType) {
                    type = " type='" + toolInfo.inputType + "'";
                }
                return "<input class='" + toolInfo.selectorClass + "'" + type + " />";
            }
            else if (toolInfo.toolType === toolTypes.textButton) {
                return "<div class='" + toolContainerClass + " " + toolStateClass + toolInfo.selectorClass + "'>" + me._getText(toolInfo) + "</div>";
            }
            else if (toolInfo.toolType === toolTypes.plainText) {
                return "<span class='" + toolInfo.selectorClass + "'> " + me._getText(toolInfo) + "</span>";
            }
            else if (toolInfo.toolType === toolTypes.containerItem) {
                var text = "";
                if (toolInfo.text) {
                    text = me._getText(toolInfo);
                }

                var imageClass = me._getClassValue(toolInfo.imageClass, "");
                var rightImageDiv = "";
                if (toolInfo.rightImageClass) {
                    rightImageDiv = "<div class='fr-toolbase-rightimage " + toolInfo.rightImageClass + "'></div>";
                }
                var html = "<div class='" + itemContainerClass + " " + toolStateClass + toolInfo.selectorClass + "'>" +
                            "<div class='" + iconClass + " " + imageClass + "'></div>" +
                            "<div class='" + itemTextContainerClass + "'>" +
                                "<div class='" + itemTextClass + "'>" + text + "</div>" +
                            "</div>" +
                            rightImageDiv +
                            "</div>";
                return html;
            }
            else if (toolInfo.toolType === toolTypes.toolGroup) {
                return "<div class='" + groupContainerClass + " " + toolInfo.selectorClass + "'></div>";
            }
        },
        _getClassValue: function (textValue, defaultValue) {
            var returnText = defaultValue;
            if (typeof (textValue) !== "undefined") {
                returnText = "";
                if (textValue !== false && textValue !== null) {
                    returnText = textValue;
                }
            }
            return returnText;
        },
        _getText: function (toolInfo) {
            var text;
            var me = this;

            if (typeof toolInfo.text === "function")
                text = toolInfo.text({ $reportViewer: me.options.$reportViewer });
            else
                text = toolInfo.text;
            return text;
        },
        _removeEvent: function ($toolEl, toolInfo) {
            var me = this;
            for (var key in toolInfo.events) {
                if (typeof toolInfo.events[key] === "function") {
                    $toolEl.off(key);
                }
            }
        },
        _addEvents: function ($toolEl, toolInfo) {
            var me = this;
            for (var key in toolInfo.events) {
                if (typeof toolInfo.events[key] === "function") {
                    $toolEl.on(key, null, { me: me, $reportViewer: me.options.$reportViewer }, toolInfo.events[key]);
                }
            }
        },
        _destroy: function () {
        },
        _create: function () {
        },
    });  // $.widget

    // popup widget used with the showDrowpdown method
    $.widget("frInternal.toolDropdown", $.forerunner.toolBase, {
        options: {
            $reportViewer: null,
            toolClass: "fr-toolbase-dropdown"
        },
        _init: function () {
            var me = this;
            me.element.html("<div class='" + me.options.toolClass + "'/>");
        },
    });  // $widget
});  // function()

///#source 1 1 /Forerunner/Common/js/MessageBox.js
/**
 * @file Contains the messgae box widget.
 *
 */

// Assign or create the single globally scoped variable
var forerunner = forerunner || {};

// Forerunner SQL Server Reports
forerunner.ssr = forerunner.ssr || {};

$(function () {
    var widgets = forerunner.ssr.constants.widgets;
    var events = forerunner.ssr.constants.events;

    /**
     * Widget used display the message box dialog
     *
     * @namespace $.forerunner.messageBox
     * @prop {object} options - The options for Message Box
     * @prop {String} options.msg - The messgae to display
     * @example
     * $("#messageBoxId").messageBox({
        msg: "Display this text"
     * });
     */
    $.widget(widgets.getFullname(widgets.messageBox), {
        options: {
        },
        _create: function () {
            
        },
        _init: function () {
            var me = this;

            var locData = forerunner.localize.getLocData(forerunner.config.forerunnerFolder() + "/ReportViewer/loc/ReportViewer");
            $messageBox = new $("<div class='fr-messagebox-innerpage fr-core-dialog-layout'>" +
                "<div class='fr-messagebox-header fr-core-dialog-header'><div class='fr-messagebox-title'>" + locData.dialog.title + "</div></div>" +
                "<div class='fr-messagebox-content'><span class='fr-messagebox-msg'/></div>" +
                "<div class='fr-messagebox-buttongroup'>" +
                "<input class='fr-messagebox-button fr-messagebox-close fr-core-dialog-button' name='close' type='button' value='" + locData.dialog.close + "' />" +
                "</div>");

            me.element.append($messageBox);

            me.element.find(".fr-messagebox-close").on("click", function () {
                me.closeDialog();
            });
        },
        /**
         * @function $.forerunner.messageBox#openDialog
         */
        openDialog: function (msg) {
            var me = this;

            forerunner.dialog.showModalDialog(me.element, function () {
                $(".fr-messagebox-msg").html(msg);
                me.element.css("display", "inline-block");
            });
        },
        /**
         * @function $.forerunner.messageBox#closeDialog
         */
        closeDialog: function () {
            var me = this;

            forerunner.dialog.closeModalDialog(me.element, function () {
                $(".fr-messagebox-msg").val();
                me.element.css("display", "");
            });
        }

    }); //$.widget
}); // $(function ()
///#source 1 1 /Forerunner/Common/js/DefaultAppTemplate.js
// Assign or create the single globally scoped variable
var forerunner = forerunner || {};

// Forerunner SQL Server Reports
forerunner.ssr = forerunner.ssr || {};

$(function () {
    var ssr = forerunner.ssr;
    var toolTypes = ssr.constants.toolTypes;
    var events = forerunner.ssr.constants.events;

    // This class provides the default app template for our app.
    // The EZ Viewer widget should use this template
    // This is an internal class right now.
    ssr.DefaultAppTemplate = function (options) {
        var me = this;
        me.options = {
            $container: null,
            isFullScreen: true,
        };

        // Merge options with the default settings
        if (options) {
            $.extend(this.options, options);
        }
    };

    ssr.DefaultAppTemplate.prototype = {
        render: function () {
            var me = this;
            var $container = me.options.$container;
            $container.addClass("fr-layout-container");
            me.$container = $container;
            var $leftpane = new $("<div />");
            $leftpane.addClass("fr-layout-leftpane");
            me.$leftpane = $leftpane;
            var $leftheader = new $("<div />");
            $leftheader.addClass("fr-layout-leftheader");
            me.$leftheader = $leftheader;
            var $leftheaderspacer = new $("<div />");
            $leftheaderspacer.addClass("fr-layout-leftheaderspacer");
            me.$leftheaderspacer = $leftheaderspacer;
            var $leftpanecontent = new $("<div />");
            $leftpanecontent.addClass("fr-layout-leftpanecontent");
            me.$leftpanecontent = $leftpanecontent;
            $leftpane.append($leftheader);
            $leftpane.append($leftheaderspacer);
            $leftpane.append($leftpanecontent);
            $container.append($leftpane);
            //main view port
            var $mainviewport = new $("<div />");
            $mainviewport.addClass("fr-layout-mainviewport");
            me.$mainviewport = $mainviewport;
            $container.append($mainviewport);
            //top div
            var $topdiv = new $("<div />");
            $topdiv.addClass("fr-layout-topdiv");
            me.$topdiv = $topdiv;
            $mainviewport.append($topdiv);
            var $mainheadersection = new $("<div />");
            $mainheadersection.addClass("fr-layout-mainheadersection");
            me.$mainheadersection = $mainheadersection;
            $topdiv.append($mainheadersection);
            var $topdivspacer = new $("<div />");
            $topdivspacer.addClass("fr-layout-topdivspacer");
            me.$topdivspacer = $topdivspacer;
            $mainviewport.append($topdivspacer);
            // Page section
            var $pagesection = new $("<div />");
            $pagesection.addClass("fr-layout-pagesection");
            me.$pagesection = $pagesection;
            $mainviewport.append($pagesection);
            me.$mainsection = new $("<div />");
            me.$mainsection.addClass("fr-layout-mainsection");
            me.$pagesection.append(me.$mainsection);
            me.$docmapsection = new $("<div />");
            me.$docmapsection.addClass("fr-layout-docmapsection");
            me.$pagesection.append(me.$docmapsection);
            //bottom div
            var $bottomdiv = new $("<div />");
            $bottomdiv.addClass("fr-layout-bottomdiv");
            me.$bottomdiv = $bottomdiv;
            $mainviewport.append($bottomdiv);
            var $bottomdivspacer = new $("<div />");
            $bottomdivspacer.addClass("fr-layout-bottomdivspacer");
            me.$bottomdivspacer = $bottomdivspacer;
            $mainviewport.append($bottomdivspacer);
            //right pane
            var $rightpane = new $("<div />");
            $rightpane.addClass("fr-layout-rightpane");
            me.$rightpane = $rightpane;
            var $rightheader = new $("<div />");
            $rightheader.addClass("fr-layout-rightheader");
            me.$rightheader = $rightheader;
            var $rightheaderspacer = new $("<div />");
            $rightheaderspacer.addClass("fr-layout-rightheaderspacer");
            me.$rightheaderspacer = $rightheaderspacer;
            var $rightpanecontent = new $("<div />");
            $rightpanecontent.addClass("fr-layout-rightpanecontent");
            me.$rightpanecontent = $rightpanecontent;
            $rightpane.append($rightheader);
            $rightpane.append($rightheaderspacer);
            $rightpane.append($rightpanecontent);
            $container.append($rightpane);

            if (!me.options.isFullScreen) {
                me._makePositionAbsolute();
            }
            me.bindEvents();

            //Cannot get zoom event so fake it

            setInterval(function () {
                me.toggleZoom();
            }, 100);
            return this;
        },

        _makePositionAbsolute: function () {
            var me = this;
            me.$topdiv.addClass("fr-layout-position-absolute");
            me.$leftheader.addClass("fr-layout-position-absolute");
            me.$rightheader.addClass("fr-layout-position-absolute");
            me.$leftpane.addClass("fr-layout-position-absolute");
            me.$rightpane.addClass("fr-layout-position-absolute");
            me.$leftpanecontent.addClass("fr-layout-position-absolute");
            me.$rightpanecontent.addClass("fr-layout-position-absolute");
        },

        _makePositionFixed: function () {
            var me = this;
            me.$topdiv.removeClass("fr-layout-position-absolute");
            me.$leftheader.removeClass("fr-layout-position-absolute");
            me.$rightheader.removeClass("fr-layout-position-absolute");
            me.$leftpane.removeClass("fr-layout-position-absolute");
            me.$rightpane.removeClass("fr-layout-position-absolute");
            me.$leftpanecontent.removeClass("fr-layout-position-absolute");
            me.$rightpanecontent.removeClass("fr-layout-position-absolute");
        },

        bindEvents: function () {
            var me = this;
            var events = forerunner.ssr.constants.events;

            var $mainheadersection = $(".fr-layout-mainheadersection", me.$container);
            $mainheadersection.on(events.toolbarMenuClick(), function (e, data) { me.showSlideoutPane(true); });
            $mainheadersection.on(events.toolbarParamAreaClick(), function (e, data) { me.showSlideoutPane(false); });
            $(".fr-layout-rightpanecontent", me.$container).on(events.reportParameterRender(), function (e, data) { me.showSlideoutPane(false); });
            $(".fr-layout-leftheader", me.$container).on(events.toolbarMenuClick(), function (e, data) { me.hideSlideoutPane(true); });

            $(".fr-layout-rightheader", me.$container).on(events.toolbarParamAreaClick(), function (e, data) { me.hideSlideoutPane(false); });
            $(".fr-layout-leftpanecontent", me.$container).on(events.toolPaneActionStarted(), function (e, data) { me.hideSlideoutPane(true); });
            $(".fr-layout-rightpanecontent", me.$container).on(events.reportParameterSubmit(), function (e, data) { me.hideSlideoutPane(false); });
            $(".fr-layout-rightpanecontent", me.$container).on(events.reportParameterCancel(), function (e, data) { me.hideSlideoutPane(false); });

            me.$container.on(events.showModalDialog, function () {
                //me.$viewer.reportViewer("allowZoom", true);
                me.$container.addClass("fr-layout-container-noscroll");
                me.$pagesection.addClass("fr-layout-pagesection-noscroll");
                me.showModal = true;
                me.$container.css("overflow", "hidden").mask();
                //this field is to remove the conflict of restore scroll invoke list
                //made by left pane and modal dialog.
                me.scrollLock = true;
                me.scrollToPosition(me.getOriginalPosition());
            });

            me.$container.on(events.closeModalDialog, function () {
                //me.$viewer.reportViewer("allowZoom", false);
                me.showModal = false;
                me.$container.removeClass("fr-layout-container-noscroll");
                me.$pagesection.removeClass("fr-layout-pagesection-noscroll");
                me.$container.css("overflow", "").unmask();
                me.scrollLock = false;
                me.restoreScroll();
            });

            var isTouch = forerunner.device.isTouch();
            if (!me.options.isFullScreen) {
                // For touch device, update the header only on scrollstop.
                if (isTouch) {
                    $(me.$container).hammer({ stop_browser_behavior: { userSelect: false }, swipe_max_touches: 22, drag_max_touches: 2 }).on("touch release",
                    function (ev) {
                        if (!ev.gesture) return;
                        switch (ev.type) {
                            // Hide the header on touch
                            case "touch":
                                if (me._containElement(ev.target, "fr-layout-topdiv") || me.$container.hasClass("fr-layout-container-noscroll"))
                                    return;
                                me.$topdiv.hide();
                                break;
                                // Use the swipe and drag events because the swipeleft and swiperight doesn"t seem to fire

                            case "release":
                                if (ev.gesture.velocityX === 0 && ev.gesture.velocityY === 0) {
                                    me._updateTopDiv(me);
                                }
                                break;
                        }
                    });
                    $(me.$container).on("scrollstop", function () {
                        me._updateTopDiv(me);
                    });
                }  
            }

            $(me.$container).on('touchmove', function (e) {
                if (me.$container.hasClass('fr-layout-container-noscroll')) {

                    var isScrollable = me._containElement(e.target, 'fr-layout-leftpane')
                        || me._containElement(e.target, 'fr-layout-rightpane') || me._containElement(e.target, 'fr-print-form');

                    if (!isScrollable)
                        e.preventDefault();
                }
            });

            $(window).resize(function () {
                me.ResetSize();

                me._updateTopDiv(me);
                me.setBackgroundLayout();
            });

            if (!me.options.isFullScreen && !isTouch) {
                $(window).on("scroll", function () {
                    me._updateTopDiv(me);
                });
                me.$container.on("scroll", function () {
                    me._updateTopDiv(me);
                });
            }
        },

        _containElement: function(element , className) {
            var isContained = false;
            if ($(element).hasClass(className)) {
                isContained = true;
            } else {
                var parent = element.parentElement;
                while (parent !== undefined && parent !== null) {
                    if ($(parent).hasClass(className)) {
                        isContained = true;
                        break;
                    }
                    parent = parent.parentElement;
                }
            }

            return isContained;
        },
        

        _updateTopDiv: function (me) {
            if (me.options.isFullScreen)
                return;
            if (me.$leftpane.is(":visible")) {
                me.$leftpane.css("top", me.$container.scrollTop());
            } else if (me.$rightpane.is(":visible")) {
                me.$rightpane.css("top", me.$container.scrollTop());
            }
            me.$topdiv.css("top", me.$container.scrollTop());
            me.$topdiv.css("left", me.$container.scrollLeft());
            if (!me.isZoomed()) {
                me.$topdiv.show();
            }
        },
        
        toggleZoom: function () {
            var me = this;
            var ratio = forerunner.device.zoomLevel();
            
            if (me.isZoomed() && !me.wasZoomed) {
                //fadeout->fadeIn toolbar immediately to make android browser re-calculate toolbar layout
                //to fill the full width
                if (forerunner.device.isAndroid() && me.$topdiv.is(":visible")) {
                    me.$topdiv.css("width", "100%");
                    me.$topdiv.css("width", "device-width");
                }
                me.wasZoomed = true;
                return;
            }

            if (!me.isZoomed() && me.wasZoomed) {
                var $viewer = $(".fr-layout-reportviewer", me.$container);
                $viewer.reportViewer("allowZoom", false);
                me.wasZoomed = false;
                if (forerunner.device.isAndroid()) {
                    me.$topdiv.css("width", "100%");
                    me.$topdiv.fadeOut(10).fadeIn(10);
                }
            }
        },
        wasZoomed: false,
        isZoomed: function(){
            var ratio = forerunner.device.zoomLevel();

            if (ratio > 1.15 || ratio < 0.985)
                return true;
            else
                return false;
        },
        getHeightValues: function () {
            var me = this;
            var values = {};
            values.windowHeight = $(window).height();  // PC case
            values.containerHeight = me.$container.height();

            // Start out by adding the height of the location bar to the height
            if (forerunner.device.isiOS()) {
                // iOS reliably returns the innerWindow size for documentElement.clientHeight
                // but window.innerHeight is sometimes the wrong value after rotating the orientation
                values.windowHeight = document.documentElement.clientHeight;

                // Only add extra padding to the height on iphone / ipod, since the ipad browser
                // doesn't scroll off the location bar.
                if (forerunner.device.isiPhone() && !forerunner.device.isiPhoneFullscreen() && !forerunner.device.isStandalone()) {
                    values.windowHeight += 60;
                    values.containerHeight += 60;
                }
            } else if (forerunner.device.isAndroid()) {
                values.windowHeight = window.innerHeight;
            }

            values.max = Math.max(values.windowHeight, values.containerHeight);
            values.paneHeight = values.windowHeight - 38; /* 38 because $leftPaneContent.offset().top, doesn't work on iPhone*/

            return values;
        },
        ResetSize: function () {
            var me = this;
            var heightValues = me.getHeightValues();

            // Setting the min-height allows the iPhone to scroll the left and right panes
            // properly even when the report has not been loaded due to paramters not being
            // entered or is very small
            if (forerunner.device.isiPhone()) {
                $("body").css({ minHeight: heightValues.max });
            }
            me.$leftpanecontent.css({ height: heightValues.paneHeight });
            me.$rightpanecontent.css({ height: heightValues.paneHeight });
            me.$leftpane.css({ height: heightValues.max });
            me.$rightpane.css({ height: heightValues.max });
            //me.$mainviewport.css({ height: "100%" });
            $(".fr-param-container", me.$container).css({ height: "100%" });
            $('.fr-toolpane', me.$container).css({ height: '100%' });
        },

        bindViewerEvents: function () {
            var me = this;
            var events = forerunner.ssr.constants.events;

            var $viewer = $(".fr-layout-reportviewer", me.$container);
            me.$viewer = $viewer;
            $viewer.on(events.reportViewerDrillBack(), function (e, data) { me.hideSlideoutPane(false); });
            $viewer.on(events.reportViewerDrillThrough(), function (e, data) { me.hideSlideoutPane(true); me.hideSlideoutPane(false); });
            $viewer.on(events.reportViewerShowNav(), function (e, data) {
                var $spacer = me.$bottomdivspacer;

                if (!data.open) {
                    $spacer.hide();
                    me.$pagesection.show();
                }
                else {
                    $spacer.show();
                    if (forerunner.device.isSmall())
                        me.$pagesection.hide();
                }

            });
            $viewer.on(events.reportViewerShowDocMap(), function (e, data) {
                me.scrollToPosition(me.getOriginalPosition());
            });

            $viewer.on(events.reportViewerHideDocMap(), function (e, data) {
                me.restoreScrollPosition();
            });

            $viewer.on(events.reportViewerallowZoom(), function (e, data) {
                if (data.isEnabled === true) {
                    me.$topdiv.hide();
                    $viewer.reportViewer("option", "toolbarHeight", 0);
                }
                else {
                    me.$topdiv.show();
                    $viewer.reportViewer("option", "toolbarHeight", me.$topdiv.outerHeight());
                }
            });

            $viewer.on(events.reportViewerSetPageDone(), function (e, data) {
                me.setBackgroundLayout();
            });

            //  Just in case it is hidden
            $viewer.on(events.reportViewerChangePage(), function (e, data) {
                me.$pagesection.show();
            });

            var isTouch = forerunner.device.isTouch();
            // For touch device, update the header only on scrollstop.
            if (isTouch && !me.options.isFullScreen) {
                me.$pagesection.on("scrollstop", function () { me._updateTopDiv(me); });
            }

            var onInputFocus = function () {
                if (me.options.isFullScreen)
                    me._makePositionAbsolute();

                $(window).scrollTop(0);
                $(window).scrollLeft(0);
            };

            var onInputBlur = function () {
                if (me.options.isFullScreen)
                    me._makePositionFixed();

                $(window).scrollTop(0);
                $(window).scrollLeft(0);
            };

            $viewer.reportViewer("option", "onInputFocus", onInputFocus);
            $viewer.reportViewer("option", "onInputBlur", onInputBlur);
        },
        getScrollPosition: function () {
            var me = this;
            var position = {};
            position.left = $(window).scrollLeft();
            position.top = $(window).scrollTop();
            position.innerLeft = me.$container.scrollLeft();
            position.innerTop = me.$container.scrollTop();
            return position;
        },
        getOriginalPosition: function () {
            var me = this;
            return { left: me.$container.offset().left > 100 ? me.$container.offset().left : 0, top: 0, innerLeft: 0, innerTop: 0 };
        },
        scrollToPosition: function (position) {
            var me = this;
            if (!me.savePosition)
                me.savePosition = me.getScrollPosition();
            if (position.left !== null)
                $(window).scrollLeft(position.left);
            if (position.top !== null)
                $(window).scrollTop(position.top);
            if (position.innerLeft !== null)
                me.$container.scrollLeft(position.innerLeft);
            if (position.innerTop !== null)
                me.$container.scrollTop(position.innerTop);
        },
        restoreScrollPosition: function () {
            var me = this;
            if (me.savePosition && !me.scrollLock) {
                $(window).scrollLeft(me.savePosition.left);
                $(window).scrollTop(me.savePosition.top);
                me.$container.scrollLeft(me.savePosition.innerLeft);
                me.$container.scrollTop(me.savePosition.innerTop);
                me.savePosition = null;
            }
        },
        hideAddressBar: function (isLeftPane) {
            var me = this;
            var containerPosition = me.getOriginalPosition();
            if (!isLeftPane) containerPosition.left = null;

            if (document.height <= window.outerHeight + 10) {
                setTimeout(function () { me.scrollToPosition(containerPosition); }, 50);
            }
            else {
                setTimeout(function () { me.scrollToPosition(containerPosition); }, 0);
            }
        },
        restoreScroll: function () {
            var me = this;
            if (document.height <= window.outerHeight + 10) {
                setTimeout(function () { me.restoreScrollPosition(); }, 50);
            }
            else {
                setTimeout(function () { me.restoreScrollPosition(); }, 0);
            }
        },
        hideSlideoutPane: function (isLeftPane) {
            var me = this;
            var className = isLeftPane ? "fr-layout-mainViewPortShiftedRight" : "fr-layout-mainViewPortShiftedLeft";
            var mainViewPort = me.$mainviewport;
            var slideoutPane = isLeftPane ? me.$leftpane : me.$rightpane;
            var topdiv = me.$topdiv;
            var delay = Number(200);
            if (slideoutPane.is(":visible")) {
                if (isLeftPane) {
                    slideoutPane.slideLeftHide(delay * 0.5);
                } else {
                    slideoutPane.slideRightHide(delay * 0.5);
                }
                topdiv.removeClass(className, delay);
                me.$mainheadersection.toolbar("showAllTools");
            }
            if (me.showModal !== true) {
                me.$pagesection.removeClass("fr-layout-pagesection-noscroll");
                me.$container.removeClass("fr-layout-container-noscroll");
            }

            if (forerunner.device.isAndroid() && !forerunner.device.isChrome())
                me.$pagesection.addClass('fr-layout-android');

            // Make sure the scroll position is restored after the call to hideAddressBar
            me.restoreScroll();
            if (me.$viewer !== undefined && me.$viewer.is(":visible")) {
                if (!forerunner.device.isAllowZoom()) {
                    me.$viewer.reportViewer('allowSwipe', true);
                }
                me.$viewer.reportViewer('triggerEvent', events.hidePane);
            }
        },
        showSlideoutPane: function (isLeftPane) {
            var me = this;

            if (me.$viewer !== undefined) {
                me.$viewer.reportViewer('allowZoom', false);
                me.$viewer.reportViewer('allowSwipe', false);
            } else {
                forerunner.device.allowZoom(false);
            }

            var className = isLeftPane ? "fr-layout-mainViewPortShiftedRight" : "fr-layout-mainViewPortShiftedLeft";
            var mainViewPort = me.$mainviewport;
            var slideoutPane = isLeftPane ? me.$leftpane : me.$rightpane;
            var topdiv = me.$topdiv;
            var delay = Number(200);
            if (!slideoutPane.is(":visible")) {
                slideoutPane.css({ height: Math.max($(window).height(), mainViewPort.height()) });
                if (isLeftPane) {
                    slideoutPane.css({ top: me.$container.scrollTop()});
                    slideoutPane.slideLeftShow(delay);
                } else {
                    slideoutPane.css({ top: me.$container.scrollTop()});
                    slideoutPane.slideRightShow(delay);
                }
                
                topdiv.addClass(className, delay);
                me.$mainheadersection.toolbar("hideAllTools");

                if (me.$viewer !== undefined) {
                    me.$viewer.reportViewer('allowZoom', false);
                    me.$viewer.reportViewer('allowSwipe', false);
                } else {
                    forerunner.device.allowZoom(false);
                }
            }

            me.$container.addClass("fr-layout-container-noscroll");
            me.$pagesection.addClass("fr-layout-pagesection-noscroll");
            
            // Make sure the address bar is not showing when a side out pane is showing
            me.hideAddressBar(isLeftPane);
            me.$container.resize();

            if (me.$viewer !== undefined && me.$viewer.is(":visible")) {
                me.$viewer.reportViewer('triggerEvent', events.showPane);
            }
        },
        toggleSlideoutPane: function (isLeftPane) {
            var me = this;
            var slideoutPane = isLeftPane ? me.$leftpane : me.$rightpane;
            if (slideoutPane.is(":visible")) {
                this.hideSlideoutPane(isLeftPane);
            } else {
                this.showSlideoutPane(isLeftPane);
            }
        },
        setBackgroundLayout: function () {
            var me = this;
            var reportArea = $('.fr-report-areacontainer', me.$container);
            var containerHeight = me.$container.height();
            var containerWidth = me.$container.width();
            
            if (reportArea.height() > (containerHeight - 38) || reportArea.width() > containerWidth) {// 38 is toolbar height
                $(".fr-render-bglayer", me.$container).css("position", "absolute").
                    css("height", Math.max(reportArea.height(), (containerHeight - 38)))
                    .css("width", Math.max(reportArea.width(), containerWidth));
            }
            else {
                $(".fr-render-bglayer", me.$container).css("position", "absolute")
                    .css("height", (containerHeight - 38)).css("width", containerWidth);
            }
        },
        cleanUp: function () {
            var me = this;

            me.hideSlideoutPane(true);
            me.hideSlideoutPane(false);
            me.$bottomdiv.hide();
            me.$bottomdivspacer.hide();
            //make sure container can scrollable when click phycial back button 
            //when modal dialog show up which disable scroll and not restore.
            me.$container.css("overflow", "");
        },
        _selectedItemPath: null,
    };
});  // $(function ()

///#source 1 1 /Forerunner/ReportViewer/js/Toolbar.js
/**
 * @file Contains the toolbar widget.
 *
 */

var forerunner = forerunner || {};
forerunner.ssr = forerunner.ssr || {};
forerunner.ssr.tools = forerunner.ssr.tools || {};
forerunner.ssr.tools.toolbar = forerunner.ssr.tools.toolbar || {};
forerunner.ssr.tools.groups = forerunner.ssr.tools.groups || {};

$(function () {
    // Useful namespaces
    var widgets = forerunner.ssr.constants.widgets;
    var events = forerunner.ssr.constants.events;
    var tb = forerunner.ssr.tools.toolbar;
    var tg = forerunner.ssr.tools.groups;


    /**
     * Toobar widget used by the reportViewer
     *
     * @namespace $.forerunner.toolbar
     * @prop {object} options - The options for toolbar
     * @prop {Object} options.$reportViewer - The report viewer widget
     * @prop {String} options.toolClass - The top level class for this tool (E.g., fr-toolbar)
     * @example
     * $("#toolbarId").toolbar({
     *  $reportViewer: $viewer,
     *  toolClass: "fr-toolbar"
	 * });
     *
     * Note:
     *  Toolbar can be extended by calling the addTools method defined by {@link $.forerunner.toolBase}
     */
    $.widget(widgets.getFullname(widgets.toolbar), $.forerunner.toolBase, /** @lends $.forerunner.toolbar */ {
        options: {
            $reportViewer: null,
            toolClass: "fr-toolbar"
        },
        _initCallbacks: function () {
            var me = this;

            // Hook up any / all custom events that the report viewer may trigger
            me.options.$reportViewer.on(events.reportViewerSetPageDone(), function (e, data) {
                $("input.fr-toolbar-reportpage-textbox", me.element).val(data.newPageNum);
                var maxNumPages = me.options.$reportViewer.reportViewer("getNumPages");

                if (data.renderError === true) {
                    me.enableTools([tb.btnMenu, tb.btnReportBack, tb.btnRefresh]);
                }
                else {
                    me.enableTools(me._viewerButtons());
                    me._updateBtnStates(data.newPageNum, maxNumPages);

                    if (data.numOfVisibleParameters === 0)
                        me.disableTools([tb.btnParamarea]);
                }
            });

            me.options.$reportViewer.on(events.reportViewerDrillBack(), function (e, data) {
                me._clearBtnStates();
            });

            me.options.$reportViewer.on(events.reportViewerShowParamArea(), function (e, data) {
                me.enableTools([tb.btnParamarea]);
            });

            me.options.$reportViewer.on(events.reportViewerShowDocMap(), function (e, data) {
                me.disableAllTools();
                me.enableTools([tb.btnDocumentMap, tb.btnMenu, tb.btnReportBack]);
            });

            me.options.$reportViewer.on(events.reportViewerHideDocMap(), function (e, data) {
                me.enableAllTools();
            });

            me.options.$reportViewer.on(events.reportViewerShowNav(), function (e, data) {
                if (data.open) {
                    me.disableAllTools();
                    me.enableTools([tb.btnNav, tb.btnMenu]);
                    me.freezeEnableDisable(true);
                }
                else {
                    me.freezeEnableDisable(false);
                    me.enableAllTools();
                }
            });

            // Hook up the toolbar element events
            //me.enableTools([tb.btnNav, tb.btnRefresh, tb.btnFirstPage, tb.btnPrev, tb.btnNext,
            //                   tb.btnLastPage, tb.btnDocumentMap, tb.btnFind, tb.btnZoom, tg.btnExportDropdown, tb.btnPrint]);
            //me.enableTools([tb.btnMenu, tb.btnReportBack]);
        },
        _init: function () {
            var me = this;

            // TODO [jont]
            //
            ///////////////////////////////////////////////////////////////////////////////////////////////
            //// if me.element contains or a a child contains the options.toolClass don't replace the html
            ///////////////////////////////////////////////////////////////////////////////////////////////

            me.element.html("<div class='" + me.options.toolClass + "'/>");
           
            me.addTools(1, false, me._viewerButtons());
            me.addTools(1, false, [tb.btnParamarea]);
            if (me.options.$reportViewer) {
                me._initCallbacks();
            }
        },
        _viewerButtons: function () {
            var listOfButtons = [tb.btnMenu, tb.btnReportBack, tb.btnNav, tb.btnRefresh, tb.btnDocumentMap, tg.btnExportDropdown, tg.btnVCRGroup, tg.btnFindGroup, tb.btnZoom, tb.btnPrint];
            // For Windows 8 with touch, windows phone and the default Android browser, skip the zoom button.
            // We don't zoom in default android browser and Windows 8 always zoom anyways.
            if (forerunner.device.isMSIEAndTouch() || forerunner.device.isWindowsPhone() || (forerunner.device.isAndroid() && !forerunner.device.isChrome())) {
                listOfButtons = [tb.btnMenu, tb.btnReportBack, tb.btnNav, tb.btnRefresh, tb.btnDocumentMap, tg.btnExportDropdown, tg.btnVCRGroup, tg.btnFindGroup, tb.btnPrint];
            }

            return listOfButtons;
        },
        _updateBtnStates: function (curPage, maxPage) {
            var me = this;

            me.element.find(".fr-toolbar-numPages-button").html(maxPage);
            me.element.find(".fr-toolbar-reportpage-textbox").attr({ max: maxPage, min: 1 });

            if (me.options.$reportViewer.reportViewer("getHasDocMap"))
                me.enableTools([tb.btnDocumentMap]);
            else
                me.disableTools([tb.btnDocumentMap]);

            if (curPage <= 1) {
                me.disableTools([tb.btnPrev, tb.btnFirstPage]);
            }
            else {
                me.enableTools([tb.btnPrev, tb.btnFirstPage]);
            }

            if (curPage >= maxPage) {
                me.disableTools([tb.btnNext, tb.btnLastPage]);
            }
            else {
                me.enableTools([tb.btnNext, tb.btnLastPage]);
            }
            if (maxPage ===1 )
                me.disableTools([tb.btnNav]);
            else
                me.enableTools([tb.btnNav]);
        },
        _clearBtnStates: function () {
            var me = this;
            me.element.find(".fr-toolbar-keyword-textbox").val("");
        },
        _destroy: function () {
        },

        _create: function () {
            var me = this;
        },
    });  // $.widget
});  // function()

///#source 1 1 /Forerunner/ReportViewer/js/ToolPane.js
/**
 * @file Contains the toolPane widget.
 *
 */

var forerunner = forerunner || {};
forerunner.ssr = forerunner.ssr || {};

$(function () {
    var widgets = forerunner.ssr.constants.widgets;
    var events = forerunner.ssr.constants.events;
    var tp = forerunner.ssr.tools.toolpane;
    var tg = forerunner.ssr.tools.groups;

    /**
     * ToolPane widget used with the reportViewer
     *
     * @namespace $.forerunner.toolPane
     * @prop {object} options - The options for toolPane
     * @prop {Object} options.$reportViewer - The report viewer widget
     * @prop {String} options.toolClass - The top level class for this tool (E.g., fr-toolpane)
     * @example
     * $("#toolPaneId").toolPane({
     *  $reportViewer: $viewer,
     *  toolClass: "fr-toolpane"
	 * });
     *
     * Note:
     *  ToolPane can be extended by calling the addTools method defined by {@link $.forerunner.toolBase}
     */
    $.widget(widgets.getFullname(widgets.toolPane), $.forerunner.toolBase, {
        options: {
            $reportViewer: null,
            toolClass: "fr-toolpane"
        },
        _initCallbacks: function () {
            var me = this;

            // Hook up any / all custom events that the report viewer may trigger
            me.options.$reportViewer.on(events.reportViewerSetPageDone(), function (e, data) {
                $("input.fr-item-textbox-reportpage", me.element).val(data.newPageNum);
                var maxNumPages = me.options.$reportViewer.reportViewer("getNumPages");

                if (data.renderError === true) {
                    me.enableTools([tp.itemReportBack, tp.itemRefresh]);
                }
                else {
                    me.enableTools(me._viewerItems());
                    me._updateItemStates(data.newPageNum, maxNumPages);
                }
                
            });

            me.options.$reportViewer.on(events.reportViewerDrillBack(), function (e, data) {
                me._clearItemStates();
            });

            me.options.$reportViewer.on(events.reportViewerShowDocMap(), function (e, data) {
                me.disableAllTools();
                me.enableTools([tp.itemDocumentMap, tp.itemReportBack]);
            });

            me.options.$reportViewer.on(events.reportViewerHideDocMap(), function (e, data) {
                me.enableAllTools();
            });

            me.options.$reportViewer.on(events.reportViewerShowNav(), function (e, data) {
                if (data.open) {
                    me.disableAllTools();
                    me.enableTools([tp.itemNav]);
                    me.freezeEnableDisable(true);
                }
                else {
                    me.freezeEnableDisable(false);
                    me.enableAllTools();
                }
            });

            // Hook up the toolbar element events
            //me.enableTools([tp.itemFirstPage, tp.itemPrev, tp.itemNext, tp.itemLastPage, tp.itemNav,
            //                tp.itemReportBack, tp.itemRefresh, tp.itemDocumentMap, tp.itemFind]);
        },
        _init: function () {
            var me = this;
            // TODO [jont]
            //
            ///////////////////////////////////////////////////////////////////////////////////////////////
            //// if me.element contains or a a child contains the options.toolClass don"t replace the html
            ///////////////////////////////////////////////////////////////////////////////////////////////

            me.element.html("");
            $toolpane = new $("<div />");
            $toolpane.addClass(me.options.toolClass);
            $(me.element).append($toolpane);

          
            me.addTools(1, false, me._viewerItems());
            // Need to add this to work around the iOS7 footer.
            // It has to be added to the scrollable area for it to scroll up.
            // Bottom padding/border or margin won't be rendered in some cases.
            $spacerdiv = new $("<div />");
            $spacerdiv.attr("style", "height:65px");
            $toolpane.append($spacerdiv);
            if (me.options.$reportViewer) {
                me._initCallbacks();
            }
        },
        _viewerItems: function () {
            var listOfItems = [tg.itemVCRGroup, tp.itemNav, tp.itemReportBack, tp.itemRefresh, tp.itemDocumentMap, tp.itemZoom, tp.itemExport, tg.itemExportGroup, tp.itemPrint, tg.itemFindGroup];
            // For Windows 8 with touch, windows phone and the default Android browser, skip the zoom button.
            // We don't zoom in default android browser and Windows 8 always zoom anyways.
            if (forerunner.device.isMSIEAndTouch() || forerunner.device.isWindowsPhone() || (forerunner.device.isAndroid() && !forerunner.device.isChrome())) {
                listOfItems = [tg.itemVCRGroup, tp.itemNav, tp.itemReportBack, tp.itemRefresh, tp.itemDocumentMap, tp.itemExport, tg.itemExportGroup, tp.itemPrint, tg.itemFindGroup];
            }

            return listOfItems;
        },
        _updateItemStates: function (curPage, maxPage) {
            var me = this;
            me.element.find(".fr-toolbar-numPages-button").html(maxPage);
            me.element.find(".fr-item-textbox-reportpage").attr({ max: maxPage, min: 1 });

            me.options.$reportViewer.reportViewer("getNumPages", curPage);
            if (me.options.$reportViewer.reportViewer("getHasDocMap"))
                me.enableTools([tp.itemDocumentMap]);
            else
                me.disableTools([tp.itemDocumentMap]);

            if (curPage > 1) {
                me.enableTools([tp.itemPrev, tp.itemFirstPage]);
            }
            else {
                me.disableTools([tp.itemPrev, tp.itemFirstPage]);
            }

            if (curPage < maxPage) {
                me.enableTools([tp.itemNext, tp.itemLastPage]);
            }
            else {
                me.disableTools([tp.itemNext, tp.itemLastPage]);
            }
            if (maxPage === 1)
                me.disableTools([tp.itemNav]);
            else
                me.enableTools([tp.itemNav]);
        },
        _clearItemStates: function () {
            var me = this;
            me.element.find(".fr-item-textbox-keyword").val("");
        },
    });  // $.widget
});  // function()

///#source 1 1 /Forerunner/ReportViewer/js/PageNav.js
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
        // Constructor
        _create: function () {

        },
        _setCurrentPage: function (currentPageNum) {
            var me = this;

            if (me.currentPageNum !== null && me.currentPageNum !== currentPageNum) {
                var $li = me.listItems[me.currentPageNum - 1];
                $li.removeClass("fr-nav-selected");
                $li.find("img").removeClass("fr-nav-page-thumb-selected");
            }

            me.currentPageNum = currentPageNum;
            me._ScrolltoPage();

            var $li = me.listItems[me.currentPageNum - 1];
            $li.addClass("fr-nav-selected");
            $li.find("img").addClass("fr-nav-page-thumb-selected");
        },
        _ScrolltoPage: function () {
            var me = this;

            if (me.currentPageNum && !forerunner.device.isElementInViewport(me.listItems[me.currentPageNum - 1].get(0))) {
                var left = me.$ul.scrollLeft() + me.listItems[me.currentPageNum - 1].position().left;
                me.$ul.scrollLeft(left);
            }
        },
        _renderList: function () {
            var me = this;
            var isTouch = forerunner.device.isTouch();
            var $list;
            
            $list = new $("<UL />");
            $list.addClass("fr-nav-container");
            me.$ul = $list;
 
            var maxNumPages = me.options.$reportViewer.reportViewer("getNumPages");
            var sessionID = me.options.$reportViewer.reportViewer("getSessionID");
            var reportViewerAPI = me.options.$reportViewer.reportViewer("getReportViewerAPI");
            var reportPath = me.options.$reportViewer.reportViewer("getReportPath");
            
            me.listItems = new Array(maxNumPages);

            for (var i = 1; i <= maxNumPages; i++) {
                var url = reportViewerAPI + "/GetThumbnail/?ReportPath="
                        + reportPath + "&SessionID=" + sessionID + "&PageNumber=" + i;
                var $listItem = new $("<LI />");
                $list.append($listItem);
                me.listItems[i - 1] = $listItem;
                var $caption = new $("<DIV class='fr-nav-centertext'>" + i.toString() + "</DIV>");
                var $thumbnail = new $("<IMG />");
                $thumbnail.addClass("fr-nav-page-thumb");
                // Instead of stating the src, use data-original and add the lazy class so that
                // we will use lazy loading.
                $thumbnail.addClass("lazy");
                $thumbnail.attr("data-original", url);
                $thumbnail.data("pageNumber", i);
                this._on($thumbnail, {
                    click: function (event) {
                        me.options.$reportViewer.reportViewer("navToPage", $(event.currentTarget).data("pageNumber"));
                        if (forerunner.device.isSmall())
                            me.options.$reportViewer.reportViewer("showNav");
                    }
                });
                // Need to add onclick
                $listItem.addClass("fr-nav-item");
                $listItem.append($caption);
                $listItem.append($thumbnail);
            }
            
            return $list.append($("<LI />").addClass("fr-nav-li-spacer"));
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
 
            var $list = me._renderList();
            me.$list = $list;

            $slider.append($list);
            me.element.css("display", "block");
            
            me.element.append($slider);
            //me.element.html($slider.html());
            
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
                me._ScrolltoPage();
            }
        },
        showNav: function () {
            var me = this;
            if (!me.isRendered) {
                me._render();
                me.isRendered = true;
            }
            me._makeVisible(!me.element.is(":visible"));

            $('.fr-nav-container', $(me.element)).css("position", me.element.css("position"));
            $container = $('ul.fr-nav-container', $(me.element));
            $(".lazy", me.$list).lazyload({ container: $container });
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
///#source 1 1 /Forerunner/ReportExplorer/js/ReportExplorerToolbar.js
/**
 * @file Contains the reportExplorerToolbar widget.
 *
 */

var forerunner = forerunner || {};

// Forerunner SQL Server Reports
forerunner.ssr = forerunner.ssr || {};
forerunner.ssr.tools = forerunner.ssr.tools || {};
forerunner.ssr.tools.reportExplorerToolbar = forerunner.ssr.tools.reportExplorerToolbar || {};

$(function () {
    var widgets = forerunner.ssr.constants.widgets;
    var tb = forerunner.ssr.tools.reportExplorerToolbar;
    var btnActiveClass = "fr-toolbase-persistent-active-state";

    /**
     * Toolbar widget used by the Report Explorer
     *
     * @namespace $.forerunner.reportExplorerToolbar
     * @prop {object} options - The options for toolbar
     * @prop {Object} options.navigateTo - Callback function used to navigate to a specific page
     * @prop {String} options.toolClass - The top level class for this tool (E.g., fr-toolbar)
     * @example
     * $("#reportExplorerToolbarId").reportExplorerToolbar({
     *  navigateTo: navigateTo
     * });
     */
    $.widget(widgets.getFullname(widgets.reportExplorerToolbar), $.forerunner.toolBase, /** @lends $.forerunner.reportExplorerToolbar */ {
        options: {
            navigateTo: null,
            toolClass: "fr-toolbar"
        },
        setFolderBtnActive: function (selectorClass) {
            var me = this;
            me._clearFolderBtnState();
            if (selectorClass) {
                var $btn = me.element.find("." + selectorClass);
                $btn.addClass(btnActiveClass);
            }
        },
        _clearFolderBtnState: function () {
            var me = this;
            $.each(me.folderBtns, function (index, $btn) {
                $btn.removeClass(btnActiveClass);
            });
        },
        _initCallbacks: function () {
            var me = this;
            // Hook up any / all custom events that the report viewer may trigger

            // Hook up the toolbar element events
            me.enableTools([tb.btnHome, tb.btnBack, tb.btnFav, tb.btnRecent]);
        },
        _init: function () {
            var me = this;

            // TODO [jont]
            //
            ///////////////////////////////////////////////////////////////////////////////////////////////
            //// if me.element contains or a a child contains the options.toolClass don't replace the html
            ///////////////////////////////////////////////////////////////////////////////////////////////
            
            me.element.empty();
            me.element.append($("<div/>").addClass(me.options.toolClass));
            me.addTools(1, true, [tb.btnBack, tb.btnSetup, tb.btnHome, tb.btnRecent, tb.btnFav]);
            me._initCallbacks();

            // Hold onto the folder buttons for later
            var $btnHome = me.element.find("." + tb.btnHome.selectorClass);
            var $btnRecent = me.element.find("." + tb.btnRecent.selectorClass);
            var $btnFav = me.element.find("." + tb.btnFav.selectorClass);
            me.folderBtns = [$btnHome, $btnRecent, $btnFav];
        },

        _destroy: function () {
        },

        _create: function () {
            var me = this;
        },
    });  // $.widget
});  // function()

///#source 1 1 /Forerunner/ReportExplorer/js/ReportExplorer.js
/**
 * @file Contains the reportExplorer widget.
 *
 */

var forerunner = forerunner || {};
forerunner.ssr = forerunner.ssr || {};

$(function () {
    var widgets = forerunner.ssr.constants.widgets;
    var locData = forerunner.localize.getLocData(forerunner.config.forerunnerFolder() + '/ReportViewer/loc/ReportViewer');
    /**
     * Widget used to explore available reports and launch the Report Viewer
     *
     * @namespace $.forerunner.reportExplorer
     * @prop {object} options - The options for toolbar
     * @prop {String} options.reportManagerAPI - Path to the report manager REST API calls
     * @prop {String} options.forerunnerPath - Path to the top level folder for the SDK
     * @prop {String} options.path - Path passed to the GetItems REST call
     * @prop {String} options.view - View passed to the GetItems REST call
     * @prop {String} options.selectedItemPath - Set to select an item in the explorer
     * @prop {Object} options.$scrollBarOwner - Used to determine the scrollTop position
     * @prop {Object} options.navigateTo - Callback function used to navigate to a slected report
     * @example
     * $("#reportExplorerId").reportExplorer({
     *  reportManagerAPI: "./api/ReportManager",
     *  forerunnerPath: "./forerunner",
     *  path: "/",
     *  view: "catalog",
     *  navigateTo: navigateTo
     * });
     */
    $.widget(widgets.getFullname(widgets.reportExplorer), /** @lends $.forerunner.reportExplorer */ {
        options: {
            reportManagerAPI: forerunner.config.forerunnerAPIBase() + "ReportManager",
            forerunnerPath: forerunner.config.forerunnerFolder(),
            path: null,
            view: null,
            selectedItemPath: null,
            $scrollBarOwner: null,
            navigateTo: null,
            $appContainer: null
        },
        /**
         * Add tools starting at index, enabled or disabled based upon the given tools array.
         * @function $.forerunner.reportExplorer#saveUserSettings
         *
         * @param {Object} settings - Settings object
         */
        saveUserSettings: function (settings) {
            var me = this;

            var stringified = JSON.stringify(settings);

            var url = forerunner.config.forerunnerAPIBase() + "ReportManager" + "/SaveUserSettings?settings=" + stringified;
            forerunner.ajax.ajax({
                url: url,
                dataType: "json",
                async: false,
                success: function (data) {
                },
                error: function (data) {
                    console.log(data);
                }
            });

        },
        /**
         * Get the user settings.
         * @function $.forerunner.reportExplorer#getUserSettings
         *
         * @param {bool} forceLoadFromServer - if true, always load from the server
         */
        getUserSettings: function (forceLoadFromServer) {
            var me = this;

            if (forceLoadFromServer !== true && me.userSettings) {
                return me.userSettings;
            }

            var settings;
            var url = forerunner.config.forerunnerAPIBase() + "ReportManager" + "/GetUserSettings";
            forerunner.ajax.ajax({
                url: url,
                dataType: "json",
                async: false,
                success: function (data) {
                    settings = data;
                }
            });

            if (settings) {
                me.userSettings = settings;
            }

            return me.userSettings;
        },
        _generatePCListItem: function (catalogItem, isSelected) {
            var me = this; 
            var reportThumbnailPath = me.options.reportManagerAPI
              + "/GetThumbnail/?ReportPath=" + encodeURIComponent(catalogItem.Path) + "&DefDate=" + catalogItem.ModifiedDate;

            //Item
            var $item = new $("<div />");
            $item.addClass("fr-explorer-item");
            if (isSelected)
                $item.addClass("fr-explorer-item-selcted");

            var $anchor = new $("<a />");
            //action
            var action = catalogItem.Type === 1 ? "explore" : "browse";
            $anchor.on("click", function (event) {
                if (me.options.navigateTo) {
                    me.options.navigateTo(action, catalogItem.Path);
                }
            });
            $item.append($anchor);


            //Image Block
            var $imageblock = new $("<div />");
            $imageblock.addClass("fr-report-item-image-block");
            $anchor.append($imageblock);
            var outerImage = new $("<div />");            
            $imageblock.append(outerImage);
           

            //Images
            if (catalogItem.Type === 1)
                if (isSelected)
                    outerImage.addClass("fr-explorer-folder-selected");
                else
                    outerImage.addClass("fr-explorer-folder");
            else {
                
                var innerImage = new $("<img />");                
                $imageblock.append(innerImage);
                var EarImage = new $("<div />");
                $imageblock.append(EarImage);
                imageSrc =  reportThumbnailPath;
                innerImage.addClass("fr-report-item-inner-image");
                innerImage.addClass("fr-report-item-image-base");
                outerImage.addClass("fr-report-item-image-base");
                EarImage.addClass("fr-report-item-image-base");
                if (isSelected) {
                    outerImage.addClass("fr-report-item-outer-image-selected");
                    EarImage.addClass("fr-explorer-item-ear-selcted");                   
                }
                else {
                    outerImage.addClass("fr-report-item-outer-image");                    
                    EarImage.addClass("fr-report-item-ear-image");
                }
               
                innerImage.attr("src", imageSrc);
                innerImage.error(function () {
                    $(this).attr("src", me.options.forerunnerPath + "/ReportExplorer/images/Report-icon.png");
                });
                
                innerImage.removeAttr("height"); //JQuery adds height for IE8, remove.
            }
            if (isSelected)
                me.$selectedItem = $item;

            
            
            //Caption
            var $caption = new $("<div />");
            $caption.addClass("fr-explorer-caption");
            var $captiontext = new $("<div />");
            $captiontext.addClass("fr-explorer-item-title");
            $captiontext.html(catalogItem.Name);
            $caption.append($captiontext);
            $item.append($caption);            
           
            return $item;
        },
        _renderPCView: function (catalogItems) {
            var me = this;

            me.$UL = me.element.find(".fr-report-explorer");
            var decodedPath = me.options.selectedItemPath ? decodeURIComponent(me.options.selectedItemPath) : null;
            me.rmListItems = new Array(catalogItems.length);
            for (var i = 0; i < catalogItems.length; i++) {
                var catalogItem = catalogItems[i];
                var isSelected = false;
                if (decodedPath && decodedPath === decodeURIComponent(catalogItem.Path)) {
                    me.selectedItem = i;
                    isSelected = true;
                }
                me.rmListItems[i] = me._generatePCListItem(catalogItem, isSelected);
                me.$UL.append(me.rmListItems[i]);
            }
        },
        _render: function (catalogItems) {
            var me = this;
            me.element.html("<div class='fr-report-explorer'>" +
                                "</div>");
            me._renderPCView(catalogItems);
            if (me.$selectedItem) {
                setTimeout(function () { me.$explorer.scrollTop(me.$selectedItem.offset().top - 50) }, 100);  //This is a hack for now
                setTimeout(function () { me.$explorer.scrollLeft(me.$selectedItem.offset().left - 20) }, 100);  //This is a hack for now
            }
        },
      
        _fetch: function (view,path) {
            var me = this;
            forerunner.ajax.ajax({
                dataType: "json",
                url: me.options.reportManagerAPI + "/GetItems",
                async: false,
                data: {
                    view: view,
                    path: path                    
                },
                success: function (data) {
                    me._render(data);
                },
                error: function (data) {
                    console.log(data);
                    forerunner.dialog.showMessageBox(me.options.$appContainer, locData.messages.catalogsLoadFailed);
                }
            });
        },
        _initCallbacks: function () {
            var me = this;
            // Hook up any / all custom events that the report viewer may trigger
        },
        _init: function () {
            var me = this;
            me.$RMList = null;
            me.$UL = null;
            me.rmListItems = null;
            me.selectedItem = 0;
            me.isRendered = false;
            me.$explorer = me.options.$scrollBarOwner ? me.options.$scrollBarOwner : $(window);
            me.$selectedItem = null;
            me._fetch(me.options.view, me.options.path);

            me.userSettings = {
                responsiveUI: false
            };
            me.getUserSettings(true);

            var $dlg = me.options.$appContainer.find(".fr-us-layout-section");
            if ($dlg.length === 0) {
                $dlg = $("<div class='fr-dialog fr-us-layout-section'/>");
                $dlg.userSettings({
                    $appContainer: me.options.$appContainer,
                    $reportExplorer: me.element
                });
                me.options.$appContainer.append($dlg);
            }
        }
    });  // $.widget
});  // function()
///#source 1 1 /Forerunner/ReportExplorer/js/UserSettings.js
/**
 * @file Contains the user settings widget.
 *
 */

// Assign or create the single globally scoped variable
var forerunner = forerunner || {};

// Forerunner SQL Server Reports
forerunner.ssr = forerunner.ssr || {};

$(function () {
    var widgets = forerunner.ssr.constants.widgets;
    var events = forerunner.ssr.constants.events;

    /**
     * Widget used to manage user settings
     *
     * @namespace $.forerunner.userSettings
     * @prop {object} options - The options for userSettings
     * @prop {Object} options.$reportExplorer - The report explorer widget
     * @example
     * $("#userSettingsId").userSettings({
     *  $reportExplorer: me.$reportExplorer
     * });
     */
    $.widget(widgets.getFullname(widgets.userSettings), {
        options: {
            $reportExplorer: null,
        },
        _create: function () {
            
        },
        _init: function () {
            var me = this;
            var locData = forerunner.localize.getLocData(forerunner.config.forerunnerFolder() + "/ReportViewer/loc/ReportViewer");
            var userSettings = locData.userSettings;
            var unit = locData.unit;

            me.element.html("");

            var $theForm = new $(
            "<div class='fr-us-page'>" +
                // Header
                "<div class='fr-us-innerPage fr-us-layout fr-core-dialog-layout'>" +
                    "<div class='fr-us-header fr-core-dialog-header'>" +
                        "<div class='fr-us-print-icon-container'>" +
                            "<div class='fr-icons24x24 fr-icons24x24-setup fr-us-align-middle'>" +
                            "</div>" +
                        "</div>" +
                        "<div class='fr-us-title-container'>" +
                            "<div class='fr-us-title'>" +
                                userSettings.title +
                            "</div>" +
                        "</div>" +
                        "<div class='fr-us-cancel-container'>" +
                            "<input type='button' class='fr-us-cancel' value='" + userSettings.cancel + "'/>" +
                        "</div>" +
                    "</div>" +
                    // form
                    "<form class='fr-us-form'>" +
                        "<div class='fr-us-setting-container'>" +
                            "<label class='fr-us-label'>" + userSettings.ResponsiveUI + "</label>" +
                            "<input class='fr-us-responsive-ui-id fr-us-checkbox'  name='ResponsiveUI' type='checkbox'/>" +
                        "</div>" +
                        "<div class='fr-us-submit-container'>" +
                            "<div class='fr-us-submit-inner'>" +
                            "<input name='submit' type='button' class='fr-us-submit fr-core-dialog-button' value='" + userSettings.submit + "'/>" +
                        "</div>" +
                    "</form>" +
                "</div>" +
            "</div>");

            me.element.append($theForm);

            me.element.find(".fr-us-submit").on("click", function (e) {
                me._saveSettings();
                me.closeDialog();
            });

            me.element.find(".fr-us-cancel").on("click", function (e) {
                me.closeDialog();
            });

        },
        _getSettings: function () {
            var me = this;
            me.settings = me.options.$reportExplorer.reportExplorer("getUserSettings", true);
            me.$resposiveUI = me.element.find(".fr-us-responsive-ui-id");
            var responsiveUI = me.settings.responsiveUI;
            me.$resposiveUI.prop("checked", responsiveUI);
        },
        _saveSettings: function () {
            var me = this;
            me.settings.responsiveUI = me.$resposiveUI.prop("checked");

            me.options.$reportExplorer.reportExplorer("saveUserSettings", me.settings);
        },
        /**
         * @function $.forerunner.userSettings#openDialog
         */
        openDialog: function () {
            var me = this;

            me._getSettings();
            forerunner.dialog.showModalDialog(me.options.$appContainer, function () {
                me.element.css("display", "inline-block");
            });
        },
        /**
         * @function $.forerunner.userSettings#closeDialog
         */
        closeDialog: function () {
            var me = this;

            forerunner.dialog.closeModalDialog(me.options.$appContainer, function () {
                me.element.css("display", "");
            });
        }
    }); //$.widget
});
///#source 1 1 /Forerunner/ReportViewer/js/ReportRender.js
// Assign or create the single globally scoped variable
var forerunner = forerunner || {};

// Forerunner SQL Server Reports
forerunner.ssr = forerunner.ssr || {};

$(function () {
    var widgets = forerunner.ssr.constants.widgets;
   
    //  The ReportIemContext simplifies the signature for all of the functions to pass context around
    function reportItemContext(RS, CurrObj, CurrObjIndex, CurrObjParent, $HTMLParent, Style, CurrLocation) {
        this.RS = RS;
        this.CurrObj = CurrObj;
        this.CurrObjIndex = CurrObjIndex;
        this.CurrObjParent = CurrObjParent;
        this.$HTMLParent = $HTMLParent;
        this.Style = Style;
        this.CurrLocation = CurrLocation;
    }
    function layout() {
        this.ReportItems = {};
        this.Height = 0;
        this.LowestIndex = null;
    }
    // Temp measurement mimics the server measurement object
    function tempMeasurement(height, width) {
        this.Height = height;
        this.Width = width;
    }
    //  Report Item Location is used my the layout to absolute position objects in a rectangle/section/column
    function reportItemLocation(index) {
        this.TopDelta = 0;
        this.Height = 0;
        this.Left = 0;
        this.Index = index;
        this.IndexAbove = null;
        this.NewHeight = null;
        this.NewTop = null;
    }
    // The Floating header object holds pointers to the tablix and its row and col header objects
    function floatingHeader($tablix, $rowHeader, $colHeader) {
        this.$tablix = $tablix;
        this.$rowHeader = $rowHeader;
        this.$colHeader = $colHeader;
    }
    // report render widget
    $.widget(widgets.getFullname(widgets.reportRender), {
        // Default options
        options: {
            reportViewer: null,
            responsive: false,
        },
        // Constructor
        _create: function () {
        },
         
        render: function (reportObj) {
            var me = this;
            var reportDiv = me.element;
            var reportViewer = me.options.reportViewer;
             
           $.each(reportObj.ReportContainer.Report.PageContent.Sections, function (Index, Obj) {
                me._writeSection(new reportItemContext(reportViewer, Obj, Index, reportObj.ReportContainer.Report.PageContent, reportDiv, ""));
            });
           me._addPageStyle(reportViewer, reportObj.ReportContainer.Report.PageContent.PageLayoutStart.PageStyle, reportObj);
        },
        _addPageStyle: function (reportViewer, pageStyle, reportObj) {
            var me = this;

            var style = me._getStyle(reportViewer, pageStyle);
            var bgLayer = new $("<div class='fr-render-bglayer'></div>");
            bgLayer.attr("style", style);

            if (reportObj.ReportContainer.Trial ===1) {                
                me.element.append(me._getWatermark());
            }

            
            me.element.append(bgLayer);
        },
        _getWatermark: function () {

            var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            svg.setAttribute("xlink", "http://www.w3.org/1999/xlink");
            svg.setAttribute("width", "100%");
            svg.setAttribute("height", "100%");
            svg.setAttribute("pointer-events", "none");


            var wstyle = "opacity:0.10;color: #d0d0d0;font-size: 120pt;position: absolute; width: 100%; height: 100%; margin: 0;z-index: 1000;left:0px;top:40px; pointer-events: none;";
            //wstyle += "-webkit-transform: rotate(-45deg);-moz-transform: rotate(-45deg);-ms-transform: rotate(-45deg);transform: rotate(-45deg);"
            svg.setAttribute("style", wstyle);

            /*
            var rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            rect.setAttribute("width", "187");
            rect.setAttribute("height", "234");
            rect.setAttribute("fill", "#fff");
            rect.setAttribute("stroke", "#000");
            rect.setAttribute("stroke-width", "2");
            rect.setAttribute("rx", "7");
            */

            var text = document.createElementNS("http://www.w3.org/2000/svg", "text");
            text.setAttribute("x", "10");
            text.setAttribute("y", "160");
            text.setAttribute("fill", "#000");
            text.textContent = "E" + "val" + "ua" + "tion";

            //svg.appendChild(rect);
            svg.appendChild(text);

            return svg;
        },

        writeError: function (errorData) {
            var me = this;
            var errorTag = me.options.reportViewer.locData.errorTag;
            var $cell;

            if (errorData.Exception.Type === "LicenseException") {
                //Reason: Expired,MachineMismatch,TimeBombMissing,SetupError
                me.element.html($("<div class='Page' >" +
                    "<div class='fr-render-error-license Page'>" +
                    "<div class='fr-render-error-license-container'>"+
                    "<div class='fr-render-error-license-title'></div><br/>" +
                    "<div class='fr-render-error-license-content'></div>" +
                    "</div></div>"));
                if (me.options.reportViewer) {
                    $cell = me.element.find(".fr-render-error-license-title");
                    $cell.html(errorTag.licenseErrorTitle);
                    $cell = me.element.find(".fr-render-error-license-content");
                    $cell.html(errorTag.licenseErrorContent);
                }                

            }
            else {
                me.element.html($("<div class='Page' >" +
               "<div class='fr-render-error-message'></div></br>" +
               "<div class='fr-render-error-details'>" + errorTag.moreDetail + "</div>" +
               "<div class='fr-render-error'><h3>" + errorTag.serverError + "</h3>" +
               "<div class='fr-render-error fr-render-error-DetailMessage'></div>" +
               "<div class='fr-render-error fr-render-error-type'></div>" +
               "<div class='fr-render-error fr-render-error-targetsite'></div>" +
               "<div class='fr-render-error fr-render-error-source'></div>" +
               "<div class='fr-render-error fr-render-error-stacktrace'></div>" +
               "</div></div>"));

                if (me.options.reportViewer) {
                    $cell = me.element.find(".fr-render-error");
                    $cell.hide();

                    $cell = me.element.find(".fr-render-error-details");
                    $cell.on("click", { $Detail: me.element.find(".fr-render-error") }, function (e) { e.data.$Detail.show(); $(e.target).hide(); });

                    $cell = me.element.find(".fr-render-error-DetailMessage");
                    $cell.append("<h4>" + errorTag.message + ":</h4>" + errorData.Exception.DetailMessage);

                    $cell = me.element.find(".fr-render-error-type");
                    $cell.append("<h4>" + errorTag.type + ":</h4>" + errorData.Exception.Type);

                    $cell = me.element.find(".fr-render-error-targetsite");
                    $cell.html("<h4>" + errorTag.targetSite + ":</h4>" + errorData.Exception.TargetSite);

                    $cell = me.element.find(".fr-render-error-source");
                    $cell.html("<h4>" + errorTag.source + ":</h4>" + errorData.Exception.Source);

                    $cell = me.element.find(".fr-render-error-message");
                    $cell.html(errorData.Exception.Message);

                    $cell = me.element.find(".fr-render-error-stacktrace");
                    $cell.html("<h4>" + errorTag.stackTrace + ":</h4>" + errorData.Exception.StackTrace);
                }
            }
        },
        _writeSection: function (RIContext) {
            var me = this;
            var $newObj = me._getDefaultHTMLTable();
            var $sec = $("<TR/>");
            var loc;

            //Need to determine Header and footer Index
            var headerIndex;
            var footerIndex;
            var bodyIndex;

            var sectionMeasurement;
            if (RIContext.CurrObj.Measurement)
                sectionMeasurement = RIContext.CurrObj.Measurement;
            else
                sectionMeasurement = RIContext.CurrObjParent.Measurement;
            
            for (var i = 0; i < sectionMeasurement.Count; i++) {
                if (sectionMeasurement.Measurements[i].Type === "PageHeader")
                    headerIndex = i;
                if (sectionMeasurement.Measurements[i].Type === "PageFooter")
                    footerIndex = i;
                if (sectionMeasurement.Measurements[i].Type === "BodyArea")
                    bodyIndex = i;
            }

            loc = bodyIndex >= 0 ? me._getMeasurmentsObj(RIContext.CurrObj, bodyIndex) : me._getMeasurmentsObj(RIContext.CurrObjParent, RIContext.CurrObjIndex);
          
            //Page Header
            if (RIContext.CurrObj.PageHeader)
                $newObj.append(me._writeHeaderFooter(RIContext, "PageHeader", headerIndex));
            //Page Header on PageContent
            if (RIContext.CurrObjParent.PageHeader)
                $newObj.append(me._writeHeaderFooter(new reportItemContext(RIContext.RS, RIContext.CurrObjParent, null, null, null, null, null), "PageHeader", headerIndex));
            
            $sec.attr("Style", "width:" + me._getWidth(loc.Width) + "mm;");

            //Columns
            $newObj.append($sec);
            $.each(RIContext.CurrObj.Columns, function (index, obj) {
                var $col = new $("<TD/>");
                $col.append(me._writeRectangle(new reportItemContext(RIContext.RS, obj, index, RIContext.CurrObj, new $("<Div/>"), null, loc)));
                $sec.append($col);
            });

            //Page Footer
            if (RIContext.CurrObj.PageFooter)
                $newObj.append(me._writeHeaderFooter(RIContext, "PageFooter", footerIndex));
            //Page Footer on PageContent
            if (RIContext.CurrObjParent.PageFooter)
                $newObj.append(me._writeHeaderFooter(new reportItemContext(RIContext.RS, RIContext.CurrObjParent, null, null, null, null, null), "PageFooter", footerIndex));

            RIContext.$HTMLParent.append($newObj);
        },
        _writeHeaderFooter: function (RIContext, HeaderOrFooter, Index) {
            var me = this;
            //Page Header
            if (RIContext.CurrObj[HeaderOrFooter]) {
                var $header = $("<TR/>");
                var $headerTD = $("<TD/>");
                $header.append($headerTD);
                var headerLoc = me._getMeasurmentsObj(RIContext.CurrObj, Index);

                $header.attr("Style", "width:" + me._getWidth(headerLoc.Width) + "mm;");

                $headerTD.append(me._writeRectangle(new reportItemContext(RIContext.RS, RIContext.CurrObj[HeaderOrFooter], Index, RIContext.CurrObj, new $("<DIV/>"), null, headerLoc)));
                return $header;
            }
        },
        _writeRectangle: function (RIContext) {
            var $RI;        //This is the ReportItem Object
            var $LocDiv;    //This DIV will have the top and left location set, location is not set anywhere else
            var Measurements;
            var RecLayout;
            var Style;
            var me = this;

            Measurements = RIContext.CurrObj.Measurement.Measurements;
            RecLayout = me._getRectangleLayout(Measurements);

            $.each(RIContext.CurrObj.ReportItems, function (Index, Obj) {
        
                Style = "";
                if (Obj.Type !== "Line") {
                    Style = "display:table;border-collapse:collapse;";
                    Style += me._getFullBorderStyle(Obj);
                }

                $RI = me._writeReportItems(new reportItemContext(RIContext.RS, Obj, Index, RIContext.CurrObj, new $("<Div/>"), Style, Measurements[Index]));
                       
                $LocDiv = new $("<Div/>");
                $LocDiv.append($RI);
                Style = "";

                //Determin height and location
                if (Obj.Type === "Image" || Obj.Type === "Chart" || Obj.Type === "Gauge" || Obj.Type === "Map" || Obj.Type === "Line")
                    RecLayout.ReportItems[Index].NewHeight = Measurements[Index].Height;
                else
                    RecLayout.ReportItems[Index].NewHeight = me._getHeight($RI);

                if (RecLayout.ReportItems[Index].IndexAbove === null)
                    RecLayout.ReportItems[Index].NewTop = Measurements[Index].Top;
                else
                    RecLayout.ReportItems[Index].NewTop = parseFloat(RecLayout.ReportItems[RecLayout.ReportItems[Index].IndexAbove].NewTop) + parseFloat(RecLayout.ReportItems[RecLayout.ReportItems[Index].IndexAbove].NewHeight) + parseFloat(RecLayout.ReportItems[Index].TopDelta);
                Style += "position:absolute;top:" + RecLayout.ReportItems[Index].NewTop + "mm;left:" + RecLayout.ReportItems[Index].Left + "mm;";

                //Background color goes on container
                if (RIContext.CurrObj.ReportItems[Index].Element && RIContext.CurrObj.ReportItems[Index].Elements.SharedElements.Style && RIContext.CurrObj.ReportItems[Index].Elements.SharedElements.Style.BackgroundColor)
                    Style += "background-color:" + RIContext.CurrObj.ReportItems[Index].Elements.SharedElements.Style.BackgroundColor + ";";
                else if (RIContext.CurrObj.ReportItems[Index].Element  && RIContext.CurrObj.ReportItems[Index].Elements.NonSharedElements.Style && RIContext.CurrObj.ReportItems[Index].Elements.NonSharedElements.Style.BackgroundColor)
                    Style += "background-color:" + RIContext.CurrObj.ReportItems[Index].Elements.NonSharedElements.Style.BackgroundColor + ";";
        
                $LocDiv.attr("Style", Style);
                $LocDiv.append($RI);
                RIContext.$HTMLParent.append($LocDiv);
            });

            Style = "position:relative;" + me._getElementsStyle(RIContext.RS, RIContext.CurrObj.Elements);
            Style += me._getFullBorderStyle(RIContext.CurrObj);

            if (RIContext.CurrLocation) {
                Style += "width:" + me._getWidth(RIContext.CurrLocation.Width) + "mm;";
                if (RIContext.CurrObj.ReportItems.length === 0)
                    Style += "height:" + (RIContext.CurrLocation.Height + 1) + "mm;";
                else {
                    var parentHeight = parseFloat(RecLayout.ReportItems[RecLayout.LowestIndex].NewTop) +
                                       parseFloat(RecLayout.ReportItems[RecLayout.LowestIndex].NewHeight) +
                                       (parseFloat(RIContext.CurrLocation.Height) -
                                            (parseFloat(Measurements[RecLayout.LowestIndex].Top) +
                                            parseFloat(Measurements[RecLayout.LowestIndex].Height))) +
                                       1;
                    Style += "height:" + parentHeight + "mm;";
                }
        
            }
            RIContext.$HTMLParent.attr("Style", Style);
            if (RIContext.CurrObj.Elements.NonSharedElements.UniqueName)
                me._writeUniqueName(RIContext.$HTMLParent, RIContext.CurrObj.Elements.NonSharedElements.UniqueName);
            me._writeBookMark(RIContext);
            return RIContext.$HTMLParent;
        },
        _getRectangleLayout: function (Measurements) {
            var l = new layout();
            var me = this;

            $.each(Measurements, function (Index, Obj) {
                l.ReportItems[Index] = new reportItemLocation(Index);
                var curRI = l.ReportItems[Index];
                curRI.Left = Obj.Left;

                if (me.isNull(l.LowestIndex))
                    l.LowestIndex = Index;
                else if (Obj.Top + Obj.Height > Measurements[l.LowestIndex].Top + Measurements[l.LowestIndex].Height)
                    l.LowestIndex = Index;

                for (var i = 0; i < Measurements.length; i++) {
                    var bottom =  Measurements[i].Top + Measurements[i].Height;
                    if (Obj.Top > bottom)           
                    {
                        if (!curRI.IndexAbove){
                            curRI.IndexAbove = i;
                            curRI.TopDelta = Obj.Top - bottom;
                        }
                        else if (bottom > Measurements[curRI.IndexAbove].Top + Measurements[curRI.IndexAbove].Height){
                            curRI.IndexAbove = i;
                            curRI.TopDelta = Obj.Top - bottom;
                        }
                    }
                }
               
            });
    
            if (me.options.responsive)
                return me._getResponsiveRectangleLayout(Measurements,l);
            return l;
        },
        _getResponsiveRectangleLayout: function (Measurements,layout) {           
            var me = this;

            var viewerWidth = me._convertToMM(me.options.reportViewer.element.width()+"px");
            var anyMove = false;

            $.each(Measurements, function (Index, Obj) {               
                var curRI = layout.ReportItems[Index];                
                curRI.OrgBottom = Obj.Top + Obj.Height;
                curRI.OrgRight = Obj.Left + Obj.Width;
                curRI.OrgIndexAbove = curRI.IndexAbove;
                var bottompMove = false;
                
                var topMove = false;

                if (curRI.OrgRight > viewerWidth) {
                    curRI.Left = 0;

                    //Measurements.length
                    for (var i = 0; i < Measurements.length; i++) {
                        var bottom = Measurements[i].Top + Measurements[i].Height;
                        var right = Measurements[i].Left + Measurements[i].Width;

                        //Above
                        //&& (layout.ReportItems[i].Left < Obj.Width)
                        if (!topMove && (Index !== i) && (Obj.Top < Measurements[i].Top) && (curRI.OrgBottom > Measurements[i].Top) ) {
                            layout.ReportItems[i].IndexAbove = Index;
                            layout.ReportItems[i].TopDelta = 1;
                            if (Index === layout.LowestIndex)
                                layout.LowestIndex = layout.ReportItems[i].Index;                            
                            anyMove = true;
                            topMove = true;
                        }
                        //Below
                        //&& (layout.ReportItems[i].Left < Obj.Width)
                        if ((Index !== i) && (Obj.Top >= Measurements[i].Top) && (Obj.Top < bottom) && Index > i ) {
                            //Not below if there is another one lower
                            if (curRI.IndexAbove === null || layout.ReportItems[curRI.IndexAbove].OrgBottom < layout.ReportItems[i].OrgBottom) {
                                curRI.IndexAbove = i;
                                curRI.TopDelta = 1;
                                if (i === layout.LowestIndex)
                                    layout.LowestIndex = Index;
                                bottompMove = true;
                                anyMove = true;
                            }
                        }

                        
                    }
                }

                if ( anyMove || (Index === Measurements.length - 1)) {
                    for (var j = 0; j < curRI.Index ; j++) {
                        // if I have the same index above and I did not move but you did more then I have to move down
                        if (curRI.IndexAbove === layout.ReportItems[j].IndexAbove && curRI.OrgRight <= viewerWidth && layout.ReportItems[j].OrgRight > viewerWidth)
                            curRI.IndexAbove = j;
                        // if you moved or I moved
                        if (layout.ReportItems[j].OrgRight > viewerWidth || curRI.OrgRight > viewerWidth) {
                            //if my index above is the same as yours then move me down
                            if (curRI.IndexAbove === layout.ReportItems[j].IndexAbove)
                                curRI.IndexAbove = layout.ReportItems[j].Index;
                            // else if your origional index above is my new index above then you move down
                            else if (layout.ReportItems[j].OrgIndexAbove === curRI.IndexAbove && j > curRI.Index)
                                layout.ReportItems[j].IndexAbove = curRI.Index;                        
                        }
                        // If we now overlap move me down
                        if (curRI.IndexAbove === layout.ReportItems[j].IndexAbove && curRI.Left >= Measurements[j].Left && curRI.Left <= layout.ReportItems[j].Left + Measurements[j].Width)
                            curRI.IndexAbove = layout.ReportItems[j].Index;
                    }
                }
                

            });

            return layout;
        },
        _writeReportItems: function (RIContext) {
            var me = this;

            switch (RIContext.CurrObj.Type) {
                case "RichTextBox":
                    return me._writeRichText(RIContext);
                    //break;
                case "Image":
                case "Chart":
                case "Gauge":
                case "Map":
                    return me._writeImage(RIContext);
                    //break;
                case "Tablix":
                    return me._writeTablix(RIContext);
                    //break;
                case "Rectangle":
                    return me._writeRectangle(RIContext);
                    //break;
                case "SubReport":
                    return me._writeSubreport(RIContext);
                    //break;
                case "Line":
                    return me._writeLine(RIContext);
                    //break;
            }
        },
        _writeRichText: function (RIContext) {
            var Style = RIContext.Style;
            var $TextObj = $("<div/>");
            var $Sort = null;
            var me = this;

            Style += "display:table;";
            if (me._getMeasurements(me._getMeasurmentsObj(RIContext.CurrObjParent, RIContext.CurrObjIndex), true) !== "")
                Style += me._getMeasurements(me._getMeasurmentsObj(RIContext.CurrObjParent, RIContext.CurrObjIndex), true);
            Style += me._getElementsNonTextStyle(RIContext.RS, RIContext.CurrObj.Elements);
            Style += "position:relative;";
            RIContext.$HTMLParent.attr("Style", Style);

            if (RIContext.CurrObj.Elements.SharedElements.IsToggleParent === true || RIContext.CurrObj.Elements.NonSharedElements.IsToggleParent === true) {
                var $Drilldown = $("<div/>");
                $Drilldown.attr("id", RIContext.CurrObj.Elements.NonSharedElements.UniqueName);
                $Drilldown.html("&nbsp");

                if (RIContext.CurrObj.Elements.NonSharedElements.ToggleState !== undefined && RIContext.CurrObj.Elements.NonSharedElements.ToggleState === true)
                    $Drilldown.addClass("fr-render-drilldown-collapse");
                else
                    $Drilldown.addClass("fr-render-drilldown-expand");

                $Drilldown.on("click", {ToggleID: RIContext.CurrObj.Elements.NonSharedElements.UniqueName }, function (e) { me.options.reportViewer.toggleItem(e.data.ToggleID); });
                $Drilldown.addClass("fr-core-cursorpointer");
                RIContext.$HTMLParent.append($Drilldown);
            }
            if (RIContext.CurrObj.Elements.SharedElements.CanSort !== undefined) {
                $Sort = $("<div/>");
                $Sort.html("&nbsp");
                var Direction = "None";
                var sortDirection = forerunner.ssr.constants.sortDirection;

                if (RIContext.CurrObj.Elements.NonSharedElements.SortState === 2) {
                    $Sort.attr("class", "fr-render-sort-descending");
                    Direction = sortDirection.desc;
                }
                else if (RIContext.CurrObj.Elements.NonSharedElements.SortState === 1) {
                    $Sort.attr("class", "fr-render-sort-ascending");
                    Direction = sortDirection.asc;
                }
                else
                    $Sort.attr("class", "fr-render-sort-unsorted");

                $Sort.on("click", { Viewer: RIContext.RS, SortID: RIContext.CurrObj.Elements.NonSharedElements.UniqueName, Direction: Direction, Clear: !me.shiftKeyDown }, function (e) { e.data.Viewer.sort(e.data.Direction, e.data.SortID, !e.shiftKey); });
                RIContext.$HTMLParent.append($Sort);
            }
            me._writeActions(RIContext, RIContext.CurrObj.Elements.NonSharedElements, $TextObj);
            if (RIContext.CurrObj.Elements.NonSharedElements.UniqueName)
                me._writeUniqueName($TextObj, RIContext.CurrObj.Elements.NonSharedElements.UniqueName);

            Style = "white-space:pre-wrap;word-break:break-word;word-wrap:break-word;";
            Style += "margin:0;display: table-cell;";            
            
            var dirClass =me._getTextDirection(RIContext.CurrObj.Elements);
            if (dirClass !== "") {
                Style += "width:" + RIContext.CurrLocation.Height + "mm;height:" + me._getWidth(RIContext.CurrLocation.Width) + "mm;";
                Style += "position:absolute;";
                var nTop = -(me._getWidth(RIContext.CurrLocation.Width) - RIContext.CurrLocation.Height) / 2;
                var nLeft = -(RIContext.CurrLocation.Height - me._getWidth(RIContext.CurrLocation.Width)) / 2;
                Style += "left:" + nLeft + "mm;top:" + nTop + "mm;";
                $TextObj.addClass(dirClass);
            }
            else
                Style += "width:100%;height:100%;";

            if (RIContext.CurrObj.Paragraphs.length === 0) {
                if (RIContext.CurrObj.Elements.SharedElements.Value) {
                    //$TextObj.html(RIContext.CurrObj.Elements.SharedElements.Value);
                    $TextObj.text(RIContext.CurrObj.Elements.SharedElements.Value);
                    Style += me._getElementsTextStyle(RIContext.CurrObj.Elements);
                }
                else if (RIContext.CurrObj.Elements.NonSharedElements.Value) {
                    //$TextObj.html(RIContext.CurrObj.Elements.NonSharedElements.Value);
                    $TextObj.text(RIContext.CurrObj.Elements.NonSharedElements.Value);
                    Style += me._getElementsTextStyle(RIContext.CurrObj.Elements);
                }
                else
                    $TextObj.html("&nbsp");
            }
            else {
                //Handle each paragraphs
                var LowIndex = null;
                var ParentName = {};
                var ParagraphContainer = {};
                ParagraphContainer.Root = "";
                Style += "float: right";  //fixed padding problem in table cells
                Style += me._getElementsTextStyle(RIContext.CurrObj.Elements);
                //Build paragraph tree
    
                $.each(RIContext.CurrObj.Paragraphs, function (Index, Obj) {

                    if (LowIndex === null)
                        LowIndex = Obj.Paragraph.SharedElements.ListLevel;
                    if (!ParagraphContainer[Obj.Paragraph.SharedElements.ListLevel])
                        ParagraphContainer[Obj.Paragraph.SharedElements.ListLevel] = [];
                    ParentName[Obj.Paragraph.SharedElements.ListLevel] = Obj.Paragraph.NonSharedElements.UniqueName;

                    var item;
                    if (!ParentName[Obj.Paragraph.SharedElements.ListLevel - 1])
                        item = "Root";
                    else
                        item = ParentName[Obj.Paragraph.SharedElements.ListLevel - 1];
                    item = { Parent: item, Value: Obj };
                    ParagraphContainer[Obj.Paragraph.SharedElements.ListLevel].push(item);
                });

                me._writeRichTextItem(RIContext, ParagraphContainer, LowIndex, "Root", $TextObj);
            }
            me._writeBookMark(RIContext);            
            $TextObj.attr("Style", Style);

            //RIContext.$HTMLParent.append(ParagraphContainer["Root"]);
           
            RIContext.$HTMLParent.append($TextObj);
            if ($Sort) RIContext.$HTMLParent.append($Sort);
            return RIContext.$HTMLParent;
        },
        _writeRichTextItem: function (RIContext, Paragraphs, Index, ParentName, ParentContainer) {
            var $ParagraphList = null;
            var me = this;

            $.each(Paragraphs[Index], function (SubIndex, Obj) {
                if (Obj.Parent === ParentName) {
                    var $ParagraphItem;
                    var ParagraphStyle = "font-size:small;"; //needed for paragraph spacing 
                    Obj = Obj.Value;

                    if (Obj.Paragraph.SharedElements.ListStyle === 1) {
                        if (!$ParagraphList || !$ParagraphList.is("ol"))
                            $ParagraphList = new $("<OL />");
                        $ParagraphList.addClass(me._getListStyle(1, Obj.Paragraph.SharedElements.ListLevel));
                        $ParagraphItem = new $("<LI />");
                    }
                    else if (Obj.Paragraph.SharedElements.ListStyle === 2) {
                        if (!$ParagraphList || !$ParagraphList.is("ul"))
                            $ParagraphList = new $("<UL />");
                        $ParagraphList.addClass(me._getListStyle(2, Obj.Paragraph.SharedElements.ListLevel));
                        $ParagraphItem = new $("<LI />");
                    }
                    else {
                        if (!$ParagraphList || !$ParagraphList.is("div"))
                            $ParagraphList = new $("<DIV />");
                        $ParagraphItem = new $("<DIV />");
                    }

                    
                    ParagraphStyle += me._getMeasurements(me._getMeasurmentsObj(Obj, Index));
                    ParagraphStyle += me._getElementsStyle(RIContext.RS, Obj.Paragraph);
                    $ParagraphItem.attr("Style", ParagraphStyle);
                    $ParagraphItem.attr("name", Obj.Paragraph.NonSharedElements.UniqueName);

                    //Handle each TextRun
                    for (var i = 0; i < Obj.TextRunCount; i++) {
                        var $TextRun;
                        var flag = true;
                        //With or without Action in TextRun
                        if (!Obj.TextRuns[i].Elements.NonSharedElements.ActionInfo) {
                            $TextRun = new $("<SPAN />");
                        }
                        else {
                            $TextRun = new $("<A />");
                            me._writeActions(RIContext, Obj.TextRuns[i].Elements.NonSharedElements, $TextRun);
                        }

                        if (Obj.TextRuns[i].Elements.SharedElements.Value && Obj.TextRuns[i].Elements.SharedElements.Value !== "") {
                            $TextRun.text(Obj.TextRuns[i].Elements.SharedElements.Value);
                        }
                        else if (Obj.TextRuns[i].Elements.NonSharedElements.Value && Obj.TextRuns[i].Elements.NonSharedElements.Value !== "") {
                            $TextRun.text(Obj.TextRuns[i].Elements.NonSharedElements.Value);
                        }
                        else {
                            $TextRun.html("&nbsp");
                            flag = false;
                        }

                        $TextRun.attr("Name", Obj.TextRuns[i].Elements.NonSharedElements.UniqueName);

                        if (flag) {
                            var TextRunStyle = "";
                            TextRunStyle += me._getMeasurements(me._getMeasurmentsObj(Obj.TextRuns[i], i));
                            TextRunStyle += me._getElementsTextStyle(Obj.TextRuns[i].Elements);
                            $TextRun.attr("Style", TextRunStyle);
                        }

                        $ParagraphItem.append($TextRun);
                    }
            
                    if (Paragraphs[Index + 1])
                        me._writeRichTextItem(RIContext, Paragraphs, Index + 1, Obj.Paragraph.NonSharedElements.UniqueName, $ParagraphItem);

                    $ParagraphList.attr("style","width:100%;height:100%;");
                    $ParagraphList.append($ParagraphItem);
                    ParentContainer.append($ParagraphList);
                }
            }); 
        },
        _writeUniqueName: function($item,uniqueName){
            
            $item.attr("name",uniqueName);
           
        },
        _getImageURL: function (RS, ImageName) {
            var me = this;

            var Url = me.options.reportViewer.options.reportViewerAPI + "/GetImage/?";
            Url += "SessionID=" + me.options.reportViewer.sessionID;
            Url += "&ImageID=" + ImageName;
            Url += "#" + new Date().getTime();
            return Url;
        },
        _writeImage: function (RIContext) {
            var NewImage = new Image();
            var me = this;

            var Style = RIContext.Style + "display:block;max-height:100%;max-width:100%;" + me._getElementsStyle(RIContext.RS, RIContext.CurrObj.Elements);
            Style += me._getMeasurements(me._getMeasurmentsObj(RIContext.CurrObjParent, RIContext.CurrObjIndex), true);
            Style += "overflow:hidden;";

            var ImageName;
            var sizingType = RIContext.CurrObj.Elements.SharedElements.Sizing;

            if (RIContext.CurrObj.Type === "Image")
                ImageName = RIContext.CurrObj.Elements.NonSharedElements.ImageDataProperties.ImageName;
            else
                ImageName = RIContext.CurrObj.Elements.NonSharedElements.StreamName;
                        
            if (RIContext.CurrObj.Elements.NonSharedElements.ActionImageMapAreas) {
                NewImage.useMap = "#Map_" + RIContext.RS.sessionID + "_" + RIContext.CurrObj.Elements.NonSharedElements.UniqueName;
            }
            NewImage.onload = function () {
                var naturalSize = me._getNatural(this);
                me._writeActionImageMapAreas(RIContext, NewImage.width, NewImage.height);
                
                me._resizeImage(this, sizingType, naturalSize.height, naturalSize.width, RIContext.CurrLocation.Height, RIContext.CurrLocation.Width);
            };
            NewImage.alt = me.options.reportViewer.locData.messages.imageNotDisplay;
            $(NewImage).attr("style", "display:block;" );

            NewImage.src = this._getImageURL(RIContext.RS, ImageName);

            me._writeActions(RIContext, RIContext.CurrObj.Elements.NonSharedElements, $(NewImage));
            me._writeBookMark(RIContext);
            if (RIContext.CurrObj.Elements.NonSharedElements.UniqueName)
                me._writeUniqueName($(NewImage), RIContext.CurrObj.Elements.NonSharedElements.UniqueName);
  
            RIContext.$HTMLParent.attr("style", Style);
            me._writeBookMark(RIContext);
            RIContext.$HTMLParent.append(NewImage);
            return RIContext.$HTMLParent;
        },
        _writeActions: function (RIContext, Elements, $Control) {
            if (Elements.ActionInfo)
                for (var i = 0; i < Elements.ActionInfo.Count; i++) {
                    this._writeAction(RIContext, Elements.ActionInfo.Actions[i], $Control);
                }
        },
        _writeAction: function (RIContext, Action, Control) {
            var me = this;
            if (Action.HyperLink) {
                Control.attr("href", Action.HyperLink);
            }
            else if (Action.BookmarkLink) {
                //HRef needed for ImageMap, Class needed for non image map
                Control.attr("href", "#");
                Control.addClass("fr-core-cursorpointer");
                Control.on("click", {BookmarkID: Action.BookmarkLink }, function (e) {
                    me._stopDefaultEvent(e);
                    me.options.reportViewer.navigateBookmark(e.data.BookmarkID);
                });
            }
            else {
                //HRef needed for ImageMap, Class needed for non image map
                Control.addClass("fr-core-cursorpointer");
                Control.attr("href", "#");
                Control.on("click", { DrillthroughId: Action.DrillthroughId }, function (e) {
                    me._stopDefaultEvent(e);
                    me.options.reportViewer.navigateDrillthrough(e.data.DrillthroughId);
                });
            }
        },
        _writeActionImageMapAreas: function (RIContext, width, height) {
            var actionImageMapAreas = RIContext.CurrObj.Elements.NonSharedElements.ActionImageMapAreas;
            var me = me;

            if (actionImageMapAreas) {
                var $map = $("<MAP/>");
                $map.attr("name", "Map_" + RIContext.RS.sessionID + "_" + RIContext.CurrObj.Elements.NonSharedElements.UniqueName);
                $map.attr("id", "Map_" + RIContext.RS.sessionID + "_" + RIContext.CurrObj.Elements.NonSharedElements.UniqueName);

                for (var i = 0; i < actionImageMapAreas.Count; i++) {
                    var element = actionImageMapAreas.ActionInfoWithMaps[i];

                    for (var j = 0; j < element.ImageMapAreas.Count; j++) {
                        var $area = $("<AREA />");
                        $area.attr("tabindex", i + 1);
                        $area.attr("style", "text-decoration:none");
                        $area.attr("alt", element.ImageMapAreas.ImageMapArea[j].Tooltip);
                        if (element.Actions) {
                            this._writeAction(RIContext, element.Actions[0], $area);
                        }

                        var shape;
                        var coords = "";
                        switch (element.ImageMapAreas.ImageMapArea[j].ShapeType) {
                            case 0:
                                shape = "rect";
                                coords = parseInt(element.ImageMapAreas.ImageMapArea[j].Coordinates[0] * width / 100, 10) + "," +
                                            parseInt(element.ImageMapAreas.ImageMapArea[j].Coordinates[1] * height / 100, 10) + "," +
                                            parseInt(element.ImageMapAreas.ImageMapArea[j].Coordinates[2] * width / 100, 10) + "," +
                                            parseInt(element.ImageMapAreas.ImageMapArea[j].Coordinates[3] * height / 100, 10);
                                break;
                            case 1:
                                shape = "poly";
                                var coorCount = element.ImageMapAreas.ImageMapArea[j].CoorCount;
                                for (var k = 0; k < coorCount; k++) {
                                    if (k % 2 === 0) {
                                        coords += parseInt(element.ImageMapAreas.ImageMapArea[j].Coordinates[k] * width / 100, 10);
                                    }
                                    else {
                                        coords += parseInt(element.ImageMapAreas.ImageMapArea[j].Coordinates[k] * height / 100, 10);
                                    }
                                    if (k < coorCount - 1) {
                                        coords += ",";
                                    }
                                }
                                break;
                            case 2:
                                shape = "circ";
                                coords = parseInt(element.ImageMapAreas.ImageMapArea[j].Coordinates[0] * width / 100, 10) + "," +
                                    parseInt(element.ImageMapAreas.ImageMapArea[j].Coordinates[1] * height / 100, 10) + "," +
                                    parseInt(element.ImageMapAreas.ImageMapArea[j].Coordinates[2] * width / 100, 10);
                                break;
                        }
                        $area.attr("shape", shape);
                        $area.attr("coords", coords);
                        $map.append($area);
                    }
                }
                RIContext.$HTMLParent.append($map);
            }
        },
        _resizeImage: function (img, sizingType, height, width, maxHeight, maxWidth) {
            var ratio = 0;
            var me = this;

            height = me._convertToMM(height + "px");
            width = me._convertToMM(width + "px");
            if (height !== 0 && width !== 0) {
                switch (sizingType) {
                    case 0://AutoSize
                        $(img).css("height", height + "mm");
                        $(img).css("width", width + "mm");
                        break;
                    case 1://Fit
                        $(img).css("height", maxHeight + "mm");
                        $(img).css("width", maxWidth + "mm");
                        break;
                    case 2://Fit Proportional
                        if (height / maxHeight > 1 || width / maxWidth > 1) {
                            if ((height / maxHeight) >= (width / maxWidth)) {
                                ratio = maxHeight / height;

                                $(img).css("height", maxHeight + "mm");
                                $(img).css("width", width * ratio + "mm");
                                $(img).css("max-height", maxHeight + "mm");
                                $(img).css("max-width", width * ratio + "mm");
                                $(img).css("min-height", maxHeight + "mm");
                                $(img).css("min-width", width * ratio + "mm");
                            }
                            else {
                                ratio = maxWidth / width;

                                $(img).css("width", maxWidth + "mm");
                                $(img).css("height", height * ratio + "mm");
                                $(img).css("max-width", maxWidth + "mm");
                                $(img).css("max-height", height * ratio + "mm");
                                $(img).css("min-width", maxWidth + "mm");
                                $(img).css("min-height", height * ratio + "mm");
                            }
                        }
                        break;
                    case 3://Clip
                        var naturalSize = me._getNatural(img);
                        $(img).css("height", me._convertToMM(naturalSize.height + "px") + "mm");
                        $(img).css("width", me._convertToMM(naturalSize.width + "px") + "mm");
                        $(img).css("max-height", me._convertToMM(naturalSize.height + "px") + "mm");
                        $(img).css("max-width", me._convertToMM(naturalSize.width + "px") + "mm");
                        //Also add style overflow:hidden to it's parent container
                        break;
                    default:
                        break;
                }
            }
        },
        _writeBookMark: function (RIContext) {
            var $node = $("<a/>");
            //var me = this;

            if (RIContext.CurrObj.Elements.SharedElements.Bookmark) {
                $node.attr("name", RIContext.CurrObj.Elements.SharedElements.Bookmark);
                $node.attr("id", RIContext.CurrObj.Elements.SharedElements.Bookmark);
            }
            else if (RIContext.CurrObj.Elements.NonSharedElements.Bookmark) {
                $node.attr("name", RIContext.CurrObj.Elements.NonSharedElements.Bookmark);
                $node.attr("id", RIContext.CurrObj.Elements.NonSharedElements.Bookmark);
            }
            if ($node.attr("id"))
                RIContext.$HTMLParent.append($node);
        },
        _writeTablixCell: function (RIContext, Obj, Index, BodyCellRowIndex) {
            var $Cell = new $("<TD/>");
            var Style = "";
            var width;
            var height;
            //var hbordersize = 0;
            //var wbordersize = 0;
            var me = this;
    
            Style = "vertical-align:top;padding:0;margin:0;-webkit-box-sizing:border-box;-moz-box-sizing:border-box;box-sizing:border-box;-ms-box-sizing: border-box;";
            Style += me._getFullBorderStyle(Obj.Cell.ReportItem);
            var ColIndex = Obj.ColumnIndex;

            var RowIndex;
            if (me.isNull(BodyCellRowIndex))
                RowIndex = Obj.RowIndex;
            else
                RowIndex = BodyCellRowIndex;

            width = me._getWidth(RIContext.CurrObj.ColumnWidths.Columns[ColIndex].Width);
            height = RIContext.CurrObj.RowHeights.Rows[RowIndex].Height;
            Style += "overflow:hidden;width:" + width + "mm;" + "max-width:" + width + "mm;"  ;

            //MSIE Hack
            if (forerunner.device.isMSIE() )
                Style +=  "min-height:" + height + "mm;";
            else
                Style += "height:" + height + "mm;";
            
            //Row and column span
            if (Obj.RowSpan !== undefined)
                $Cell.attr("rowspan", Obj.RowSpan);
            if (Obj.ColSpan !== undefined) {
                $Cell.attr("colspan", Obj.ColSpan);
                
            }
               
            //Background color goes on the cell
            if ((Obj.Cell.ReportItem.Elements.SharedElements.Style) && Obj.Cell.ReportItem.Elements.SharedElements.Style.BackgroundColor)
                Style += "background-color:" + Obj.Cell.ReportItem.Elements.SharedElements.Style.BackgroundColor + ";";
            else if (Obj.Cell.ReportItem.Elements.NonSharedElements.Style && Obj.Cell.ReportItem.Elements.NonSharedElements.Style.BackgroundColor)
                Style += "background-color:" + Obj.Cell.ReportItem.Elements.NonSharedElements.Style.BackgroundColor + ";";

            $Cell.attr("Style", Style);
            $Cell.append(me._writeReportItems(new reportItemContext(RIContext.RS, Obj.Cell.ReportItem, Index, RIContext.CurrObj, new $("<Div/>"), "margin:0;overflow:hidden;width:100%;height:100%;", new tempMeasurement(height, width))));
            return $Cell;
        },
        _writeTablix: function (RIContext) {
            var me = this;
            var $Tablix = me._getDefaultHTMLTable();
            var Style = "border-collapse:collapse;padding:0;margin:0;";
            var $Row;
            var LastRowIndex = 0;
            var $FixedColHeader = new $("<TABLE/>").css({ display: "table", position: "absolute", top: "0px", left: "0px", padding: "0", margin: "0", "border-collapse": "collapse" });
            var $FixedRowHeader = new $("<TABLE/>").css({ display: "table", position: "absolute", top: "0px", left: "0px", padding: "0", margin: "0", "border-collapse": "collapse" });
            $FixedRowHeader.attr("CELLSPACING", 0);
            $FixedRowHeader.attr("CELLPADDING", 0);
            var LastObjType = "";
            var HasFixedRows = false;
            var HasFixedCols = false;
            

            Style += me._getMeasurements(me._getMeasurmentsObj(RIContext.CurrObjParent, RIContext.CurrObjIndex));
            Style += me._getElementsStyle(RIContext.RS, RIContext.CurrObj.Elements);
            Style += me._getFullBorderStyle(RIContext.CurrObj);
            $Tablix.attr("Style", Style);

            var colgroup = $("<colgroup/>");
            for (var cols = 0; cols < RIContext.CurrObj.ColumnWidths.ColumnCount;cols++ ){
                colgroup.append($("<col/>").css("width", me._getWidth(RIContext.CurrObj.ColumnWidths.Columns[cols].Width) + "mm"));
            }
            $Tablix.append(colgroup);
            if (!forerunner.device.isFirefox()) {
                $FixedColHeader.append(colgroup.clone(true,true));  //Need to allign fixed header on chrome, makes FF fail
                $FixedRowHeader.append(colgroup.clone(true, true));  //Need to allign fixed header on chrome, makes FF fail
            }

            $Row = new $("<TR/>");
            $.each(RIContext.CurrObj.TablixRows, function (Index, Obj) {

                if (Obj.RowIndex !== LastRowIndex) {
                    $Tablix.append($Row);

                    //Handle fixed col header
                    if (RIContext.CurrObj.RowHeights.Rows[Obj.RowIndex - 1].FixRows === 1)
                        $FixedColHeader.append($Row.clone(true, true));

                    $Row = new $("<TR/>");

                    //Handle missing rows
                    for (var ri = LastRowIndex+1; ri < Obj.RowIndex ; ri++) {
                        $Tablix.append($Row);
                        $Row = new $("<TR/>");
                    }
                    LastRowIndex = Obj.RowIndex;
                }

                if (Obj.UniqueName)
                    me._writeUniqueName($Row, Obj.UniqueName);

                //Handle fixed row header
                if (Obj.Type !== "Corner" && LastObjType === "Corner") {
                    $FixedRowHeader.append($Row.clone(true, true));
                }
                if (Obj.Type !== "RowHeader" && LastObjType === "RowHeader") {
                    $FixedRowHeader.append($Row.clone(true, true));
                }
                if (RIContext.CurrObj.RowHeights.Rows[Obj.RowIndex].FixRows === 1)
                    HasFixedRows = true;
                if (Obj.Type !== "BodyRow" && RIContext.CurrObj.ColumnWidths.Columns[Obj.ColumnIndex].FixColumn === 1)
                    HasFixedCols = true;

                if (Obj.Type === "BodyRow") {
                    $.each(Obj.Cells, function (BRIndex, BRObj) {
                        $Row.append(me._writeTablixCell(RIContext, BRObj, BRIndex, Obj.RowIndex));
                    });
                }
                else {
                    if (Obj.Cell)
                        $Row.append(me._writeTablixCell(RIContext, Obj, Index));
                }
                LastObjType = Obj.Type;
            });
            $Tablix.append($Row);

            if (HasFixedRows) {
                $FixedColHeader.hide();
            }
            else
                $FixedColHeader = null;

            if (HasFixedCols) {
                $FixedRowHeader.hide();
            }
            else
                $FixedRowHeader = null;

            var ret = $("<div style='position:relative'></div");
            $Tablix.append($FixedColHeader);
            $Tablix.append($FixedRowHeader);
            if (RIContext.CurrObj.Elements.NonSharedElements.UniqueName)
                me._writeUniqueName($Tablix, RIContext.CurrObj.Elements.NonSharedElements.UniqueName);
            RIContext.$HTMLParent = ret;
            me._writeBookMark(RIContext);
            ret.append($Tablix);
            RIContext.RS.floatingHeaders.push(new floatingHeader(ret, $FixedColHeader, $FixedRowHeader));
            return ret;
        },
        _writeSubreport: function (RIContext) {
            var me = this;
            RIContext.Style += me._getElementsStyle(RIContext.RS, RIContext.CurrObj.SubReportProperties);
            RIContext.CurrObj = RIContext.CurrObj.BodyElements;
            me._writeBookMark(RIContext);
            return me._writeRectangle(RIContext);
    
        },
        _writeLine: function (RIContext) {
            var me = this;
            var measurement = me._getMeasurmentsObj(RIContext.CurrObjParent, RIContext.CurrObjIndex);
            var Style = "position:relative;width:" + measurement.Width + "mm;height:" + measurement.Height + "mm;";
            
            if (measurement.Width === 0 || measurement.Height === 0)
                Style += me._getFullBorderStyle(RIContext.CurrObj);
            else {
                var $line = $("<Div/>");
                var newWidth = Math.sqrt(Math.pow(measurement.Height, 2) + Math.pow(measurement.Width, 2));
                var rotate = Math.atan(measurement.Height / measurement.Width);
                var newTop = (newWidth / 2) * Math.sin(rotate);
                var newLeft = (newWidth / 2) - Math.sqrt(Math.pow(newWidth / 2, 2) + Math.pow(newTop, 2));
                if (!(RIContext.CurrObj.Elements.SharedElements.Slant === undefined || RIContext.CurrObj.Elements.SharedElements.Slant === 0))
                    rotate = rotate - (2 * rotate);

                var lineStyle = "position:absolute;top:" + newTop + "mm;left:" + newLeft + "mm;";
                lineStyle += me._getFullBorderStyle(RIContext.CurrObj);
                lineStyle += "width:" + newWidth + "mm;height:0;";
                lineStyle += "-moz-transform: rotate(" + rotate + "rad);";
                lineStyle += "-webkit-transform: rotate(" + rotate + "rad);";
                lineStyle += "-ms-transform: rotate(" + rotate + "rad);";
                lineStyle += "transform: rotate(" + rotate + "rad);";
                $line.attr("Style", lineStyle);

                RIContext.$HTMLParent.append($line);
            }

            

            me._writeBookMark(RIContext);

            RIContext.$HTMLParent.attr("Style", Style + RIContext.Style);
            return RIContext.$HTMLParent;

        },
        //Helper fucntions
        _getHeight: function ($obj) {
            var me = this;
            var height;

            var $copiedElem = $obj.clone()
                                .css({
                                    visibility: "hidden"
                                });

            $copiedElem.find("img").remove();

            $("body").append($copiedElem);
            height = $copiedElem.outerHeight() + "px";

            $copiedElem.remove();

            //Return in mm
            return me._convertToMM(height);

        },
        _getElementsStyle: function (RS, CurrObj) {
            var Style = "";
            var me = this;

            Style += me._getStyle(RS, CurrObj.SharedElements.Style, CurrObj.NonSharedElements);
            Style += me._getStyle(RS, CurrObj.NonSharedElements.Style, CurrObj.NonSharedElements);
            return Style;
        },
        _getElementsTextStyle: function (CurrObj) {
            var Style = "";
            var me = this;

            Style += me._getTextStyle(CurrObj.SharedElements.Style, CurrObj.NonSharedElements);
            Style += me._getTextStyle(CurrObj.NonSharedElements.Style, CurrObj.NonSharedElements);
            return Style;
        },
        _getElementsNonTextStyle: function (RS, CurrObj) {
            var Style = "";
            var me = this;

            Style += me._getNonTextStyle(RS, CurrObj.SharedElements.Style, CurrObj.NonSharedElements);
            Style += me._getNonTextStyle(RS, CurrObj.NonSharedElements.Style, CurrObj.NonSharedElements);
            return Style;
        },
        _getBorderSize: function (CurrObj, Side) {
            var me = this;
            var Obj;
            var DefaultStyle;
            var SideStyle;
            var DefaultSize;
            var SideSize;

            //Need left, top, right bottom border
            Obj = CurrObj.Elements.SharedElements.Style;
            if (Obj) {
                DefaultStyle = Obj.BorderStyle;
                SideStyle = Obj["BorderStyle" + Side];
                DefaultSize = Obj.BorderWidth;
                SideSize = Obj["BorderWidth" + Side];
            }
            else {
                Obj = CurrObj.Elements.NonSharedElements.Style;
                if (Obj) {
                    DefaultStyle = Obj.BorderStyle;
                    SideStyle = Obj["BorderStyle" + Side];
                    DefaultSize = Obj.BorderWidth;
                    SideSize = Obj["BorderWidth" + Side];
                }
            }
    
            if (!SideStyle && DefaultStyle === 0)
                return 0;
            if (SideStyle === 0)
                return 0;
            if (!SideSize)
                return me._convertToMM(DefaultSize);
            else
                return me._convertToMM(SideSize);
        },
        _getPaddingSize: function (CurrObj, Side) {
            var me = this;
            var Obj;
            var SideSize;

    
            Obj = CurrObj.Elements.SharedElements.Style;
            if (Obj) {
                SideSize = Obj["Padding" + Side];
            }
            else {
                Obj = CurrObj.Elements.NonSharedElements.Style;
                if (Obj) {
                    SideSize = Obj["Padding" + Side];
                }
            }
            return me._convertToMM(SideSize);
        },
        _getFullBorderStyle: function (CurrObj) {
            var me = this;
            var Style = "";
            var Obj;

            if (!CurrObj.Elements)
                return "";

            //Need left, top, right bottom border
            Obj = CurrObj.Elements.SharedElements.Style;
            if (Obj !== undefined) {
                if (Obj.BorderStyle !== undefined && Obj.BorderStyle !==0 )
                    Style += "border:" + Obj.BorderWidth + " " + me._getBorderStyle(Obj.BorderStyle) + " " + Obj.BorderColor + ";";
                if (Obj.BorderStyleLeft !== undefined || Obj.BorderWidthLeft !== undefined || Obj.BorderColorLeft !== undefined)
                    Style += "border-left:" + ((Obj.BorderWidthLeft === undefined) ? Obj.BorderWidth : Obj.BorderWidthLeft) + " " + ((Obj.BorderStyleLeft === undefined) ? me._getBorderStyle(Obj.BorderStyle) : me._getBorderStyle(Obj.BorderStyleLeft)) + " " + ((Obj.BorderColorLeft === undefined) ? Obj.BorderColor : Obj.BorderColorLeft) + ";";
                if (Obj.BorderStyleRight !== undefined || Obj.BorderWidthRight !== undefined || Obj.BorderColorRight !== undefined)
                    Style += "border-right:" + ((Obj.BorderWidthRight === undefined) ? Obj.BorderWidth : Obj.BorderWidthRight) + " " + ((Obj.BorderStyleRight === undefined) ? me._getBorderStyle(Obj.BorderStyle) : me._getBorderStyle(Obj.BorderStyleRight)) + " " + ((Obj.BorderColorRight === undefined) ? Obj.BorderColr : Obj.BorderColorRight) + ";";
                if (Obj.BorderStyleTop !== undefined || Obj.BorderWidthTop !== undefined || Obj.BorderColorTop !== undefined)
                    Style += "border-top:" + ((Obj.BorderWidthTop === undefined) ? Obj.BorderWidth : Obj.BorderWidthTop) + " " + ((Obj.BorderStyleTop === undefined) ? me._getBorderStyle(Obj.BorderStyle) : me._getBorderStyle(Obj.BorderStyleTop)) + " " + ((Obj.BorderColorTop === undefined) ? Obj.BorderColor : Obj.BorderColorTop) + ";";
                if (Obj.BorderStyleBottom !== undefined || Obj.BorderWidthBottom !== undefined || Obj.BorderColorBottom !== undefined)
                    Style += "border-bottom:" + ((Obj.BorderWidthBottom === undefined) ? Obj.BorderWidth : Obj.BorderWidthBottom) + " " + ((Obj.BorderStyleBottom === undefined) ? me._getBorderStyle(Obj.BorderStyle) : me._getBorderStyle(Obj.BorderStyleBottom)) + " " + ((Obj.BorderColorBottom === undefined) ? Obj.BorderColor : Obj.BorderColorBottom) + ";";
            }
            Obj = CurrObj.Elements.NonSharedElements.Style;
            if (Obj !== undefined) {
                if (Obj.BorderStyle !== undefined && Obj.BorderStyle !== 0)
                    Style += "border:" + Obj.BorderWidth + " " + me._getBorderStyle(Obj.BorderStyle) + " " + Obj.BorderColor + ";";
                if (Obj.BorderStyleLeft !== undefined || Obj.BorderWidthLeft !== undefined || Obj.BorderColorLeft !== undefined)
                    Style += "border-left:" + ((Obj.BorderWidthLeft === undefined) ? Obj.BorderWidth : Obj.BorderWidthLeft) + " " + ((Obj.BorderStyleLeft === undefined) ? me._getBorderStyle(Obj.BorderStyle) : me._getBorderStyle(Obj.BorderStyleLeft)) + " " + ((Obj.BorderColorLeft === undefined) ? Obj.BorderColor : Obj.BorderColorLeft) + ";";
                if (Obj.BorderStyleRight !== undefined || Obj.BorderWidthRight !== undefined || Obj.BorderColorRight !== undefined)
                    Style += "border-right:" + ((Obj.BorderWidthRight === undefined) ? Obj.BorderWidth : Obj.BorderWidthRight) + " " + ((Obj.BorderStyleRight === undefined) ? me._getBorderStyle(Obj.BorderStyle) : me._getBorderStyle(Obj.BorderStyleRight)) + " " + ((Obj.BorderColorRight === undefined) ? Obj.BorderColr : Obj.BorderColorRight) + ";";
                if (Obj.BorderStyleTop !== undefined || Obj.BorderWidthTop !== undefined || Obj.BorderColorTop !== undefined)
                    Style += "border-top:" + ((Obj.BorderWidthTop === undefined) ? Obj.BorderWidth : Obj.BorderWidthTop) + " " + ((Obj.BorderStyleTop === undefined) ? me._getBorderStyle(Obj.BorderStyle) : me._getBorderStyle(Obj.BorderStyleTop)) + " " + ((Obj.BorderColorTop === undefined) ? Obj.BorderColor : Obj.BorderColorTop) + ";";
                if (Obj.BorderStyleBottom !== undefined || Obj.BorderWidthBottom !== undefined || Obj.BorderColorBottom !== undefined)
                    Style += "border-bottom:" + ((Obj.BorderWidthBottom === undefined) ? Obj.BorderWidth : Obj.BorderWidthBottom) + " " + ((Obj.BorderStyleBottom === undefined) ? me._getBorderStyle(Obj.BorderStyle) : me._getBorderStyle(Obj.BorderStyleBottom)) + " " + ((Obj.BorderColorBottom === undefined) ? Obj.BorderColor : Obj.BorderColorBottom) + ";";
            }

            return Style;
        },
        _getMeasurementsInvert: function (CurrObj) {
            var me = this;
            var Style = "";
            //TODO:  zIndex

            if (!CurrObj)
                return "";

            //Top and left are set in set location, height is not set becasue differnt browsers measure and break words differently
            if (CurrObj.Width !== undefined) {
                Style += "height:" + CurrObj.Width + "mm;";
                Style += "min-height:" + CurrObj.Width + "mm;";
                Style += "max-height:" + (CurrObj.Width) + "mm;";
            }

            if (CurrObj.Height !== undefined) {
                Style += "width:" + CurrObj.Height + "mm;";
                Style += "min-width:" + CurrObj.Height + "mm;";
                Style += "max-width:" + (CurrObj.Height) + "mm;";
            }

            return Style;
        },
        _getMeasurements: function (CurrObj, includeHeight) {
            var me = this;
            var Style = "";
            //TODO:  zIndex

            if (!CurrObj)
                return "";

            //Top and left are set in set location, height is not set becasue differnt browsers measure and break words differently
            if (CurrObj.Width !== undefined) {
                Style += "width:" + me._getWidth(CurrObj.Width) + "mm;";
                Style += "min-width:" + me._getWidth(CurrObj.Width ) + "mm;";
                Style += "max-width:" + me._getWidth(CurrObj.Width) + "mm;";
            }

            if (includeHeight && CurrObj.Height !== undefined){
                Style += "height:" + CurrObj.Height + "mm;";
                Style += "min-height:" + CurrObj.Height + "mm;";
                Style += "max-height:" + (CurrObj.Height) + "mm;";
            }

            return Style;
        },
        _getStyle: function (RS, CurrObj, TypeCodeObj) {
            var me = this;
            var Style = "";

            if (!CurrObj)
                return Style;

            Style += me._getNonTextStyle(RS, CurrObj, TypeCodeObj);
            Style += me._getTextStyle(CurrObj, TypeCodeObj);

            return Style;
        },
        _backgroundRepeatTypesMap: function () {
            return {
                0: "repeat",    // Repeat
                1: "no-repeat", // Clip
                2: "repeat-x",  // RepeatX
                3: "repeat-y"   // RepeatY
            };
        },
        _getImageStyleURL: function (RS, ImageName) {
            var me = this;
            return "url(" + me._getImageURL(RS, ImageName) + ")";
        },
        _getNonTextStyle: function (RS, CurrObj, TypeCodeObj) {
            var me = this;
            var Style = "";

            if (!CurrObj)
                return Style;

            if (CurrObj.BackgroundColor)
                Style += "background-color:" + CurrObj.BackgroundColor + ";";
            if (CurrObj.BackgroundImage)
                Style += "background-image:" + me._getImageStyleURL(RS, CurrObj.BackgroundImage.ImageName) + ";";
            if (CurrObj.BackgroundRepeat !== undefined && me._backgroundRepeatTypesMap()[CurrObj.BackgroundRepeat])
                Style += "background-repeat:" + me._backgroundRepeatTypesMap()[CurrObj.BackgroundRepeat] + ";";

            return Style;
        },
        _getTextDirection:function(CurrObj){
            var Dirclass = "";

            if (CurrObj.SharedElements.Style && CurrObj.SharedElements.Style.WritingMode !== undefined){
                if (CurrObj.SharedElements.Style.WritingMode === 1)
                    Dirclass = "fr-rotate-90";
                if (CurrObj.SharedElements.Style.WritingMode === 2)
                    Dirclass = "fr-rotate-270";
            }
            if (CurrObj.NonSharedElements.Style && CurrObj.NonSharedElements.Style.WritingMode !== undefined) {
                if (CurrObj.NonSharedElements.Style.WritingMode === 1)
                    Dirclass = "fr-rotate-90";
                if (CurrObj.NonSharedElements.Style.WritingMode === 2)
                    Dirclass = "fr-rotate-270";
            }
            return Dirclass;

          
        },
        _getTextStyle: function (CurrObj, TypeCodeObj) {
            var me = this;
            var Style = "";

            if (!CurrObj)
                return Style;

            if (CurrObj.PaddingBottom !== undefined)
                Style += "padding-bottom:" + CurrObj.PaddingBottom + ";";
            if (CurrObj.PaddingLeft !== undefined)
                Style += "padding-left:" + CurrObj.PaddingLeft + ";";
            if (CurrObj.PaddingRight !== undefined)
                Style += "padding-right:" + CurrObj.PaddingRight + ";";
            if (CurrObj.PaddingTop !== undefined)
                Style += "padding-top:" + CurrObj.PaddingTop + ";";
            if (CurrObj.UnicodeBiDi !== undefined)
                Style += "unicode-bidi:" + me._getBiDi(CurrObj.UnicodeBiDi) + ";";
            if (CurrObj.VerticalAlign !== undefined)
                Style += "vertical-align:" + me._getVAligh(CurrObj.VerticalAlign) + ";";
            //if (CurrObj.WritingMode !== undefined)
            //    Style += "layout-flow:" + me._getLayoutFlow(CurrObj.WritingMode) + ";";
            if (CurrObj.Direction !== undefined)
                Style += "Direction:" + me._getDirection(CurrObj.Direction) + ";";

            if (CurrObj.TextAlign !== undefined)
                Style += "text-align:" + me._getTextAlign(CurrObj.TextAlign, TypeCodeObj) + ";";
            if (CurrObj.FontStyle !== undefined)
                Style += "font-style:" + me._getFontStyle(CurrObj.FontStyle) + ";";
            if (CurrObj.FontWeight !== undefined)
                Style += "font-weight:" + me._getFontWeight(CurrObj.FontWeight) + ";";
            if (CurrObj.FontFamily !== undefined)
                Style += "font-family:" + CurrObj.FontFamily + ";";
            if (CurrObj.FontSize !== undefined)
                Style += "font-size:" + CurrObj.FontSize + ";";
            if (CurrObj.TextDecoration !== undefined)
                Style += "text-decoration:" + me._getTextDecoration(CurrObj.TextDecoration) + ";";
            if (CurrObj.Color !== undefined)
                Style += "color:" + CurrObj.Color + ";";
            //   if (CurrObj.Calendar !== undefined)
            //       Style += "calendar:" + GetCalendar(CurrObj.Calendar) + ";";
            //writing-mode:lr-tb;?
            return Style;

        },
        _getCalendar: function (RPLCode) {
            switch (RPLCode) {
                case 0:
                    return "Gregorian";
                case 1:
                    return "GregorianArabic";
                case 2:
                    return "GregorianMiddleEastFrench";
                case 3:
                    return "GregorianTransliteratedEnglish";
                case 4:
                    return "GregorianTransliteratedFrench";
                case 5:
                    return "GregorianUSEnglish";
                case 6:
                    return "Hebrew";
                case 7:
                    return "Hijri";
                case 9:
                    return "Korean";
                case 10:
                    return "Julian";
                case 11:
                    return "Taiwan";
                case 12:
                    return "ThaiBuddist";
            }
            return "Gregorian";
        },
        _getTextDecoration: function (RPLCode) {
            switch (RPLCode) {
                case 0:
                    return "None";
                case 1:
                    return "Underline";
                case 2:
                    return "Overline";
                case 3:
                    return "LineThrough";
            }
            return "None";
        },
        _getFontWeight: function (RPLCode) {
            switch (RPLCode) {
                case 0:
                    return "Normal";
                case 1:
                    return "Thin";
                case 2:
                    return "ExtraLight";
                case 3:
                    return "Light";
                case 4:
                    return "Medium";
                case 5:
                    return "SemiBold";
                case 6:
                    return "Bold";
                case 7:
                    return "ExtraBold";
                case 8:
                    return "Heavy";
            }
            return "General";
        },
        _getFontStyle: function (RPLCode) {
            switch (RPLCode) {
                case 0:
                    return "Normal";
                case 1:
                    return "Italic";
            }
            return "Normal";
        },
        _getTextAlign: function (RPLCode, TypeCodeObj) {
            switch (RPLCode) {
                case 0:
                    //Default is string, need to handle direction, 15 seems to be decimal not datetime
                    if (TypeCodeObj.TypeCode === undefined)
                        return "Left";
                    switch (TypeCodeObj.TypeCode) {
                        case 3:
                        case 6:
                        case 7:
                        case 9:
                        case 11:
                        case 12:
                        case 13:
                        case 14:
                        case 15:
                        case 16:
                            return "Right";
                        case 4:
                        case 17:
                        case 18:
                            return "Left";
                        default:
                            return "Left";
                    }

                    break;
                case 1:
                    return "Left";
                case 2:
                    return "Center";
                case 3:
                    return "Right";
            }

        },
        _getDirection: function (RPLCode) {
            switch (RPLCode) {
                case 0:
                    return "LTR";
                case 1:
                    return "RTL";

            }
            return "LTR";
        },
        _getLayoutFlow: function (RPLCode) {
            switch (RPLCode) {
                case 0:
                    return "Horizontal";
                case 1:
                    return "Vertical";
                case 2:
                    return "Rotate270";
            }
            return "Horizontal";
        },
        _getVAligh: function (RPLCode) {
            switch (RPLCode) {
                case 0:
                    return "Top";
                case 1:
                    return "Middle";
                case 2:
                    return "Bottom";
            }
            return "Top";
        },
        _getBiDi: function (RPLCode) {
            switch (RPLCode) {
                case 0:
                    return "normal";
                case 1:
                    return "embed";
                case 2:
                    return "BiDiOverride";
            }
            return "normal";
        },
        _getDefaultHTMLTable: function () {
            var $newObj = $("<Table/>");

            $newObj.attr("CELLSPACING", 0);
            $newObj.attr("CELLPADDING", 0);
            return $newObj;
        },
        _getBorderStyle: function (RPLStyle) {
            switch (RPLStyle) {
                case 0:
                    return "None";
                case 1:
                    return "Dotted";
                case 2:
                    return "Dashed";
                case 3:
                    return "Solid";
                case 4:
                    return "Double";
            }
            return "None";
        },
        _getMeasurmentsObj: function (CurrObj, Index) {
            var retval = null;

            if (CurrObj.Measurement)
                retval = CurrObj.Measurement.Measurements[Index];
            return retval;
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
        _getListStyle: function (Style, Level) {
            var ListStyle;
            //Numbered
            if (Style === 1) {
                switch (Level % 3) {
                    case 1:
                        ListStyle = "decimal";
                        break;
                    case 2:
                        ListStyle = "lower-roman";
                        break;
                    case 0:
                        ListStyle = "lower-latin";
                        break;
                }
            }
                //Bulleted
            else if (Style === 2) {
                switch (Level % 3) {
                    case 0:
                        ListStyle = "square";
                        break;
                    case 1:
                        ListStyle = "disc";
                        break;
                    case 2:
                        ListStyle = "circle";
                        break;
                }
            }
            return "fr-render-list-" + ListStyle;
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
        _getNatural: function (domElement) {
            if (domElement.naturalWidth !== undefined && domElement.naturalHeight !== undefined) {
                return { width: domElement.naturalWidth, height: domElement.naturalHeight };
            }
            else {
                var img = new Image();
                img.src = domElement.src;
                return { width: img.width, height: img.height };
            }
        },
        isNull: function (val) {
            if (val === null || val === undefined)
                return true;
            else
                return false;
        },
        _getWidth: function (val) {
            // might be usfull for text sizing issues between browsers
            return val ;
        }
    });  // $.widget
});
///#source 1 1 /Forerunner/ReportViewer/js/ReportParameter.js
/**
 * @file Contains the parameter widget.
 *
 */

// Assign or create the single globally scoped variable
var forerunner = forerunner || {};

// Forerunner SQL Server Reports
forerunner.ssr = forerunner.ssr || {};

$(function () {
    var widgets = forerunner.ssr.constants.widgets;
    var events = forerunner.ssr.constants.events;
    var paramContainerClass = "fr-param-container";
    /**
     * report parameter widget used with the reportViewer
     *
     * @namespace $.forerunner.reportParameter
     * @prop {object} options - The options for report parameter
     * @prop {Object} options.$reportViewer - The report viewer widget
     * @example
     * $paramArea.reportParameter({ $reportViewer: this });
     * $("#paramArea").reportParameter({
     *  $reportViewer: $viewer
	 * });    
     */
    $.widget(widgets.getFullname(widgets.reportParameter), {
        options: {
            $reportViewer: null,
            pageNum: null,
            $appContainer: null
        },

        $params: null,
        _formInit: false,
        _paramCount: 0,
        _defaultValueExist: false,
        _loadedForDefault: true,
        _reportDesignError: null,

        _init: function () {
            var me = this;
            me.element.html(null);
        },
        _destroy: function () {

        },
        _render: function () {
            var me = this;

            me.element.html(null);
            var $params = new $("<div class=" + paramContainerClass + ">" +
                "<form class='fr-param-form' onsubmit='return false'>" +
                   "<div class='fr-param-element-border'><input type='text' style='display:none'></div>" +
                   "<div>" +
                       "<div class='fr-param-submit-container'>" +
                          "<input name='Parameter_ViewReport' type='button' class='fr-param-viewreport' value='" + me.options.$reportViewer.locData.paramPane.viewReport + "'/>" +
                       "</div>" +
                       "<div class='fr-param-cancel-container'>" +
                          "<input type='button' class='fr-param-cancel' value='" + me.options.$reportViewer.locData.paramPane.cancel + "'/>" +
                       "</div>" +
                    "</div>" +
                "</form>" +
                "<div style='height:65px;'/>" +
                "</div>");
            me.element.css("display", "block");
            me.element.html($params);
            me.$params = $params;
            me._formInit = true;
        },

        /**
         * @function $.forerunner.reportParameter#getNumOfVisibleParameters
         * @return {int} The number of visible parameters.
         */
        getNumOfVisibleParameters: function () {
            var me = this;
            if (me.$numVisibleParams !== undefined)
                return me.$numVisibleParams;
            return 0;
        },
    
        _parameterDefinitions: {},
        _hasPostedBackWithoutSubmitForm : false,
        /**
         * @function $.forerunner.reportParameter#updateParameterPanel
         * @Update an existing parameter panel by posting back current selected values to update casacade parameters.
         * @param {String} data - original data get from server client
         * @param {boolean} submitForm - submit form when parameters are satisfied.
         * @param {boolean} Whether to make parameter area visible.
         */
        updateParameterPanel: function (data, submitForm, pageNum, renderParamArea) {
            this.removeParameter();
            this._hasPostedBackWithoutSubmitForm = true;
            this.writeParameterPanel(data, pageNum, submitForm, renderParamArea);
        },

        /**
         * @function $.forerunner.reportParameter#writeParameterPanel
         * @Generate parameter html code and append to the dom tree
         * @param {String} data - original data get from server client
         * @param {int} pageNum - current page num
         * @param {boolean} submitForm - whether to submit form if all parameters are satisfied.
         * @param {boolean} Whether to make parameter area visible.
         */
        writeParameterPanel: function (data, pageNum, submitForm, renderParamArea) {
            var me = this;
            if (me.$params === null) me._render();

            me.options.pageNum = pageNum;
            me._paramCount = parseInt(data.Count, 10);

            me._defaultValueExist = data.DefaultValueExist;
            me._loadedForDefault = true;
            me._render();
            me.$numVisibleParams = 0;

            var $eleBorder = $(".fr-param-element-border", me.$params);
            $.each(data.ParametersList, function (index, param) {
                me._parameterDefinitions[param.Name] = param;
                if (param.Prompt !== "") {
                    $eleBorder.append(me._writeParamControl(param, new $("<div />"), pageNum));
                    me.$numVisibleParams += 1;
                }
                else
                    me._checkHiddenParam(param);
            });

            if (me._reportDesignError !== null)
                me._reportDesignError += me.options.$reportViewer.locData.messages.contactAdmin;

            me._resetLabelWidth();
            me.resetValidateMessage();
            $(".fr-param-form", me.$params).validate({
                errorPlacement: function (error, element) {
                    if ($(element).is(":radio"))
                        error.appendTo(element.parent("div").next("span"));
                    else {
                        if ($(element).attr("IsMultiple") === "True")
                            error.appendTo(element.parent("div").next("span"));
                        else
                            error.appendTo(element.nextAll(".fr-param-error-placeholder"));
                    }
                },
                highlight: function (element) {
                    if ($(element).is(":radio"))
                        $(element).parent("div").addClass("fr-param-error");
                    else
                        $(element).addClass("fr-param-error");
                },
                unhighlight: function (element) {
                    if ($(element).is(":radio"))
                        $(element).parent("div").removeClass("fr-param-error");
                    else
                        $(element).removeClass("fr-param-error");
                }
            });
            $(".fr-param-viewreport", me.$params).on("click", function () {
                me._submitForm(pageNum);
            });
            $(".fr-param-cancel", me.$params).on("click", function () {
                me._cancelForm();
            });

            if (submitForm !== false) {
                if (me._paramCount === data.DefaultValueCount && me._loadedForDefault)
                    me._submitForm(pageNum);
                else {
                    if (renderParamArea !== false)
                        me._trigger(events.render);
                    me.options.$reportViewer.removeLoadingIndicator();
                }
            } else {
                if (renderParamArea !== false)
                    me._trigger(events.render);
                me.options.$reportViewer.removeLoadingIndicator();
            }

            //jquery adds height, remove it
            var pc = me.element.find("." + paramContainerClass);
            pc.removeAttr("style");

            me._setDatePicker();
            $(document).on("click", function (e) { me._checkExternalClick(e); });


            $(":text", me.$params).each(
                function (index) {
                    var textinput = $(this);
                    textinput.on("blur", function () { me.options.$reportViewer.onInputBlur(); });
                    textinput.on("focus", function () { me.options.$reportViewer.onInputFocus(); });
                }
            );
        },

        _submittedParamsList: null,

        _submitForm: function (pageNum) {
            var me = this;
            me._closeAllDropdown();

            if (me._reportDesignError !== null) {
                forerunner.dialog.showMessageBox(me.options.$appContainer, me._reportDesignError);
                return;
            }

            var paramList = me.getParamsList();
            if (paramList) {
                me.options.$reportViewer.loadReportWithNewParameters(paramList, pageNum);
                me._submittedParamsList = paramList;
                me._trigger(events.submit);
            }
            me._hasPostedBackWithoutSubmitForm = false;
        },
        /**
         * @function $.forerunner.reportParameter#revertParameters
         * @Revert any unsubmitted parameters.  Called in two scenario:  when cancelling out from parameter area or 
         *  before submitting an action when the set of parameters for the session does not match the loaded report.
         */
        revertParameters: function () {
            var me = this;
            if (me.getParamsList() === me._submittedParamsList) {
                return;
            }
            if (me._submittedParamsList !== null) {
                if (me._hasPostedBackWithoutSubmitForm) {
                    me.refreshParameters(me._submittedParamsList);
                    me._hasPostedBackWithoutSubmitForm = false;

                    me.options.$reportViewer.invalidateReportContext();
                }
                var submittedParameters = JSON.parse(me._submittedParamsList);
                var list = submittedParameters.ParamsList;
                var $control;
                for (var i = 0; i < list.length; i++) {
                    var savedParam = list[i];
                    var paramDefinition = me._parameterDefinitions[savedParam.Parameter];
                    if (paramDefinition.MultiValue) {
                        if (paramDefinition.ValidValues !== "") {
                            $control = $(".fr-paramname-" + paramDefinition.Name + "-dropdown-cb", me.$params);
                            me._setCheckBoxes($control, savedParam.Value);
                            me._setMultipleInputValues(paramDefinition);
                        } else {
                            $control = $(".fr-paramname-" + paramDefinition.Name);
                            var $dropdownText = $(".fr-paramname-" + paramDefinition.Name + "-dropdown-textArea");
                            $dropdownText.val(me._getTextAreaValue(savedParam.Value, true));
                            $control.val(me._getTextAreaValue(savedParam.Value, false));
                            $control.attr("jsonValues", JSON.stringify(savedParam.Value));
                        }
                    } else {
                        $control = $(".fr-paramname-" + paramDefinition.Name, me.$params);
                        if (paramDefinition.ValidValues !== "") {
                            me._setSelectedIndex($control, savedParam.Value);
                        } else if (paramDefinition.Type === "Boolean") {
                            me._setRadioButton($control, savedParam.Value);
                        } else {
                            $control.val(savedParam.Value);
                        }
                    }
                }
            }
        },
        _cancelForm: function () {
            var me = this;
            me._closeAllDropdown();
            me.revertParameters();
            me._trigger(events.cancel, null, {});
        },
        _setDatePicker: function () {
            var me = this;

            $.each(me.element.find(".hasDatepicker"), function (index, datePicker) {
                $(datePicker).datepicker("option", "buttonImage", forerunner.config.forerunnerFolder() + "/reportviewer/Images/calendar.png");
                $(datePicker).datepicker("option", "buttonImageOnly", true);
                $(datePicker).datepicker("option", "buttonText", me.options.$reportViewer.locData.paramPane.datePicker);
            });
        },
        _getPredefinedValue: function (param) {
            var me = this;
            if (me._hasDefaultValue(param)) {
                if (param.MultiValue === false)
                    return param.DefaultValues[0];
                else
                    return param.DefaultValues;
            }

            return null;
        },
        _writeParamControl: function (param, $parent, pageNum) {
            var me = this;
            var $label = new $("<div class='fr-param-label'>" + param.Name + "</div>");
            var bindingEnter = true;
            var dependenceDisable = me._checkDependencies(param);

            //If the control have valid values, then generate a select control
            var $container = new $("<div class='fr-param-item-container'></div>");
            var $errorMsg = new $("<span class='fr-param-error-placeholder'/>");
            var $element = null;

            if (param.MultiValue === true) { // Allow multiple values in one textbox

                if (param.ValidValues !== "") { // Dropdown with checkbox
                    $element = me._writeDropDownWithCheckBox(param, dependenceDisable);
                }
                else {//if (param.DefaultValues !== "") { // Dropdown with editable textarea
                    bindingEnter = false;
                    $element = me._writeDropDownWithTextArea(param, dependenceDisable);
                }
            }
            else { // Only one value allowed

                if (param.ValidValues !== "") { // Dropdown box
                    $element = me._writeDropDownControl(param, dependenceDisable, pageNum);
                }
                else if (param.Type === "Boolean") {
                    //Radio Button, RS will return MultiValue false even set it to true
                    $element = me._writeRadioButton(param, dependenceDisable, pageNum);
                }
                else { // Textbox
                    $element = me._writeTextArea(param, dependenceDisable, pageNum);
                }
            }

            if ($element !== undefined && bindingEnter) {
                $element.on("keydown", function (e) {
                    if (e.keyCode === 13) {
                        me._submitForm(pageNum);
                    } // Enter
                });
            }

            $container.append($element).append(me._addNullableCheckBox(param, $element)).append($errorMsg);
            $parent.append($label).append($container);

            return $parent;
        },
        _getParameterControlProperty: function (param, $control) {
            var me = this;
            $control.attr("AllowBlank", param.AllowBlank);
            if (param.Nullable === false && param.AllowBlank === false) {
                $control.attr("required", "true").watermark(me.options.$reportViewer.locData.paramPane.required);
            }
            $control.attr("ErrorMessage", param.ErrorMessage);
        },
        _addNullableCheckBox: function (param, $control) {
            var me = this;
            if (param.Nullable === true) {
                var $nullableSpan = new $("<Span />");

                var $checkbox = new $("<Input type='checkbox' class='fr-param-checkbox' name='" + param.Name + "' />");

                //if (me._hasDefaultValue(param) && param.DefaultValues[0] === "")
                //    $checkbox.attr('checked', 'true');

                $checkbox.on("click", function () {
                    if ($checkbox.attr("checked") === "checked") {
                        $checkbox.removeAttr("checked");
                        if (param.Type === "Boolean")
                            $(".fr-param-radio." + param.Name).removeAttr("disabled");
                        else
                            $control.removeAttr("disabled").removeClass("fr-param-disable").addClass("fr-param-enable");
                    }
                    else {
                        $checkbox.attr("checked", "true");
                        if (param.Type === "Boolean")
                            $(".fr-param-radio." + param.Name).attr("disabled", "true");
                        else
                            $control.attr("disabled", "true").removeClass("fr-param-enable").addClass("fr-param-disable");
                    }
                });

                var $nullableLable = new $("<Label class='fr-param-label-null' />");
                $nullableLable.html(me.options.$reportViewer.locData.paramPane.nullField);

                $nullableSpan.append($checkbox).append($nullableLable);
                return $nullableSpan;
            }
            else
                return null;
        },
        _setRadioButton: function (s, v) {
            for (var i = 0; i < s.length; i++) {
                if (s[i].value === v) {
                    s[i].checked = true;
                } else {
                    s[i].checked = false;
                }
            }
        },
        _writeRadioButton: function (param, dependenceDisable, pageNum) {
            var me = this;
            var predefinedValue = me._getPredefinedValue(param);
            var paramPane = me.options.$reportViewer.locData.paramPane;
            var radioValues = [];
            radioValues[0] = { display: paramPane.isTrue, value: "True" };
            radioValues[1] = { display: paramPane.isFalse, value: "False" };

            var $control = me._createDiv("fr-param-checkbox-container");
            $control.attr("ismultiple", param.MultiValue);
            $control.attr("datatype", param.Type);

            for (var i = 0; i < radioValues.length; i++) {
                var $radioItem = new $("<input type='radio' class='fr-param fr-param-radio fr-paramname-" + param.Name + "' name='" + param.Name + "' value='" + radioValues[i].value +
                    "' datatype='" + param.Type + "' />");
                if (dependenceDisable) {
                    me._disabledSubSequenceControl($control);
                }
                else {
                    me._getParameterControlProperty(param, $radioItem);

                    if (predefinedValue) {
                        if (param.Nullable === true)
                            $radioItem.attr("disabled", "true");
                        else if (predefinedValue === radioValues[i].value)
                            $radioItem.attr("checked", "true");
                    }

                    if (me._paramCount === 1)
                        $radioItem.on("click", function () { me._submitForm(pageNum); });
                }
                var $label = new $("<label class='fr-param-radio-label'>" + radioValues[i].display + "</label>");

                $control.append($radioItem);
                $control.append($label);
            }

            return $control;
        },
        _writeTextArea: function (param, dependenceDisable, pageNum) {
            var me = this;
            var predefinedValue = me._getPredefinedValue(param);
            var $control = new $("<input class='fr-param fr-paramname-" + param.Name + "' name='" + param.Name + "' type='text' size='100' ismultiple='"
                + param.MultiValue + "' datatype='" + param.Type + "' />");

            if (dependenceDisable) {
                me._disabledSubSequenceControl($control);
                return $control;
            }

            me._getParameterControlProperty(param, $control);
            switch (param.Type) {
                case "DateTime":
                    $control.datepicker({
                        showOn: "button",
                        dateFormat: "yy-mm-dd", //Format: ISO8601
                        changeMonth: true,
                        changeYear: true,
                        showButtonPanel: true,
                        gotoCurrent: true,
                        closeText: "Close",
                        onClose: function () {
                            $control.removeAttr("disabled");
                            $(".fr-paramname-" + param.Name, me.$params).valid();
                            if (me._paramCount === 1)
                                me._submitForm(pageNum);
                        },
                        beforeShow: function () {
                            $control.attr("disabled", true);
                        },
                    });
                    $control.attr("dateISO", "true");

                    if (predefinedValue)
                        $control.datepicker("setDate", me._getDateTimeFromDefault(predefinedValue));
                    break;
                case "Integer":
                case "Float":
                    $control.attr("number", "true");
                    if (predefinedValue) {
                        $control.val(predefinedValue);
                    }
                    break;
                case "String":
                    if (predefinedValue) {
                        $control.val(predefinedValue);
                    }
                    //if (param.DefaultValues[0] === "")                        
                    //    $control.attr("disabled", "true").removeClass("fr-param-enable").addClass("fr-param-disable");
                    break;
            }

            return $control;
        },
        _setSelectedIndex: function (s, v) {
            var options = s[0];
            for ( var i = 0; i < options.length; i++ ) {
                if (options[i].value === v) {
                    options[i].selected = true;
                    return;
                }
            }
        },
        _writeDropDownControl: function (param, dependenceDisable, pageNum) {
            var me = this;
            var canLoad = false;
            var predefinedValue = me._getPredefinedValue(param);
            var $control = new $("<select class='fr-param fr-param-select fr-paramname-" + param.Name + "' name='" + param.Name + "' ismultiple='" +
                param.MultiValue + "' datatype='" + param.Type + "' readonly='true'>");

            if (dependenceDisable) {
                me._disabledSubSequenceControl($control);
                return $control;
            }

            me._getParameterControlProperty(param, $control);
            var $defaultOption = new $("<option value=''>&#60Select a Value&#62</option>");
            $control.append($defaultOption);

            for (var i = 0; i < param.ValidValues.length; i++) {
                var optionValue = param.ValidValues[i].Value;
                var $option = new $("<option value='" + optionValue + "'>" + param.ValidValues[i].Key + "</option>");

                if (predefinedValue && predefinedValue === optionValue) {
                    $option.attr("selected", "true");
                    canLoad = true;
                }

                $control.append($option);
            }
            if (!canLoad) me._loadedForDefault = false;

            if (me._paramCount === 1) {
                $control.on("change", function () { me._submitForm(pageNum); });
            }

            return $control;
        },
        _createInput : function(param, type, readonly, listOfClasses) {
            var $input = new $("<Input />");
            $input.attr("type", type);
            $input.attr("name", param.Name);
            $input.attr("ismultiple", param.MultiValue);
            $input.attr("datatype", param.Type);
            if (readonly) {
                $input.attr("readonly", true);
            }
            for (var i = 0; i < listOfClasses.length; i++) {
                $input.addClass(listOfClasses[i]);
            }
            return $input;
        },
        _createDiv : function(listOfClasses) {
            var $div = new $("<div />");
            for (var i = 0; i < listOfClasses.length; i++) {
                $div.addClass(listOfClasses[i]);
            }
            return $div;
        },
        _createLabel: function (listOfClasses) {
            var $label = new $("<label />");
            for (var i = 0; i < listOfClasses.length; i++) {
                $label.addClass(listOfClasses[i]);
            }
            return $label;
        },
        _writeDropDownWithCheckBox: function (param, dependenceDisable) {
            var me = this;
            var predefinedValue = me._getPredefinedValue(param);
            var $control = me._createDiv(["fr-param-element-container"]);

            var $multipleCheckBox = me._createInput(param, "text", true, ["fr-param-client", "fr-param-dropdown-textbox", "fr-paramname-" + param.Name]);

            var $openDropDown = me._createDiv(["fr-param-dropdown-iconcontainer", "fr-core-cursorpointer"]);
            var $dropdownicon = me._createDiv(["fr-param-dropdown-icon"]);
            $openDropDown.append($dropdownicon);

            if (dependenceDisable) {
                me._disabledSubSequenceControl($multipleCheckBox);
                $control.append($multipleCheckBox).append($openDropDown);
                return $control;
            }

            me._getParameterControlProperty(param, $multipleCheckBox);
            var $hiddenCheckBox = me._createInput(param, "hidden", false, ["fr-param", "fr-paramname-" + param.Name + "-hidden"]);
           
            $openDropDown.on("click", function () { me._popupDropDownPanel(param); });
            $multipleCheckBox.on("click", function () { me._popupDropDownPanel(param); });

            var $dropDownContainer = me._createDiv(["fr-param-dropdown", "fr-paramname-" + param.Name + "-dropdown-container"]);
            $dropDownContainer.attr("value", param.Name);

            var $table = me._getDefaultHTMLTable();
            param.ValidValues.push({ Key: "Select All", Value: "Select All" });

            var keys = "";
            var values = "";
            for (var i = 0; i < param.ValidValues.length; i++) {
                var key;
                var value;
                if (i === 0) {
                    var SelectAll = param.ValidValues[param.ValidValues.length - 1];
                    key = SelectAll.Key;
                    value = SelectAll.Value;
                }
                else {
                    key = param.ValidValues[i - 1].Key;
                    value = param.ValidValues[i - 1].Value;
                }

                var $row = new $("<TR />");
                var $col = new $("<TD/>");

                var $span = new $("<Span />");
                var $checkbox = me._createInput(param, "checkbox", false, ["fr-param-dropdown-checkbox", "fr-paramname-" + param.Name + "-dropdown-cb"]);
                $checkbox.attr("value", value);

                if (predefinedValue && me._contains(predefinedValue, value)) {
                    $checkbox.attr("checked", "true");
                    keys += key + ",";
                    values += value + ",";
                }

                $checkbox.on("click", function () {
                    if (this.value === "Select All") {
                        if (this.checked === true) {
                            $(".fr-paramname-" + param.Name + "-dropdown-cb", me.$params).each(function () {
                                this.checked = true;
                            });
                        }
                        if (this.checked === false) {
                            $(".fr-paramname-" + param.Name + "-dropdown-cb", me.$params).each(function () {
                                this.checked = false;
                            });
                        }
                    }
                });

                var $label = me._createLabel(["fr-param-dropdown-label", "fr-paramname-" + param.Name + "-dropdown-" + i.toString() + "-label"]);
                $label.attr("for", param.Name + "_DropDown_" + i.toString());
                $label.attr("value", value);

                $label.html(key);

                $span.append($checkbox).append($label);
                $col.append($span);
                $row.append($col);
                $table.append($row);
            }
            $dropDownContainer.append($table);

            if (predefinedValue) {
                $multipleCheckBox.val(keys.substr(0, keys.length - 1));
                $hiddenCheckBox.val(JSON.stringify(predefinedValue));
            }

            $control.append($multipleCheckBox).append($hiddenCheckBox).append($openDropDown).append($dropDownContainer);

            return $control;
        },
        _writeDropDownWithTextArea: function (param, dependenceDisable) {
            var me = this;
            var predefinedValue = me._getPredefinedValue(param);
            //me._getTextAreaValue(predefinedValue);
            var $control = me._createDiv(["fr-param-element-container"]);

            var $multipleTextArea = me._createInput(param, "text", true, ["fr-param", "fr-param-dropdown-textbox", "fr-paramname-" + param.Name]);
            var $openDropDown = me._createDiv(["fr-param-dropdown-iconcontainer", "fr-core-cursorpointer"]);
            var $dropdownicon = me._createDiv(["fr-param-dropdown-icon"]);
            $openDropDown.append($dropdownicon);

            if (dependenceDisable) {
                me._disabledSubSequenceControl($multipleTextArea);
                $control.append($multipleTextArea).append($openDropDown);
                return $control;
            }
            me._getParameterControlProperty(param, $multipleTextArea);
            $multipleTextArea.on("click", function () { me._popupDropDownPanel(param); });
            $openDropDown.on("click", function () { me._popupDropDownPanel(param); });

            var $dropDownContainer = me._createDiv(["fr-param-dropdown", "fr-paramname-" + param.Name + "-dropdown-container"]);
            $dropDownContainer.attr("value", param.Name);

            var $textarea = new $("<textarea class='fr-param-dropdown-textarea fr-paramname-" + param.Name + "-dropdown-textArea' />");

            if (predefinedValue) {
                $textarea.val(me._getTextAreaValue(predefinedValue, true));
                $multipleTextArea.val(me._getTextAreaValue(predefinedValue, false));
                $multipleTextArea.attr("jsonValues", JSON.stringify(predefinedValue));
            }

            $dropDownContainer.append($textarea);
            $control.append($multipleTextArea).append($openDropDown).append($dropDownContainer);
            return $control;
        },
        _getTextAreaValue: function (predifinedValue, forArea) {
            var result = "";
            if (forArea) {
                for (var i = 0; i < predifinedValue.length; i++) {
                    result += predifinedValue[i] + "\n";
                }
                result = result.substr(0, result.length - 1);
            }
            else {
                for (var j = 0; j < predifinedValue.length; j++) {
                    result += predifinedValue[j] + ",";
                }
                result = result.substr(0, result.length - 1);
            }
            return result;
        },
        _setCheckBoxes: function (s, valueList) {
            for (var i = 0; i < s.length; i++) {
                if ($.inArray(s[i].value, valueList) >= 0) {
                    s[i].checked = true;
                } else {
                    s[i].checked = false;
                }
            }
        },
        _setMultipleInputValues: function (param) {
            var me = this;
            var newValue, oldValue;
            var target = $(".fr-paramname-" + param.Name, me.$params).filter(":visible");
            oldValue = target.val();

            if (target.hasClass("fr-param-client")) {
                var showValue = "";
                var hiddenValue = [];

                $(".fr-paramname-" + param.Name + "-dropdown-cb", me.$params).each(function (index) {
                    if (this.checked && this.value !== "Select All") {
                        showValue += $(".fr-paramname-" + param.Name + "-dropdown-" + index.toString() + "-label", me.$params).html() + ",";
                        hiddenValue.push( this.value );
                    }
                });

                newValue = showValue.substr(0, showValue.length - 1);
                $(".fr-paramname-" + param.Name, me.$params).val(newValue);
                $(".fr-paramname-" + param.Name + "-hidden", me.$params).val(JSON.stringify(hiddenValue));
            }
            else {
                newValue = $(".fr-paramname-" + param.Name + "-dropdown-textArea", me.$params).val();
                var listOfValues = newValue.split("\n");
                newValue = newValue.replace(/\n+/g, ",");
                
                if (newValue.charAt(newValue.length - 1) === ",") {
                    newValue = newValue.substr(0, newValue.length - 1);
                }
                target.val(newValue);
                target.attr("jsonValues", JSON.stringify(listOfValues));
            }

            if (oldValue !== newValue)
                target.change();
        },
        _popupDropDownPanel: function (param) {
            var me = this;
            var isVisible = $(".fr-paramname-" + param.Name + "-dropdown-container", me.$params).is(":visible");
            me._closeAllDropdown();

            if (!isVisible) {
                var $container = me.$params;
                var $dropDown = $(".fr-paramname-" + param.Name + "-dropdown-container", me.$params);
                var $multipleControl = $(".fr-paramname-" + param.Name, me.$params);
                var positionTop = $multipleControl.offset().top;

                $multipleControl.parent().css("z-index", 1);

                if ($container.height() - positionTop - $multipleControl.height() < $dropDown.height()) {
                    //popup at above, 4 is margin top
                    $dropDown.css("top", (($dropDown.height() +10) * -1) + 4);
                }
                else {//popup at bottom, 15 is margin + padding + border
                    $dropDown.css("top", $multipleControl.height() + 15);
                }

                if ($dropDown.is(":hidden")) {
                    $dropDown.width($multipleControl.width() + 20).addClass("fr-param-dropdown-show").show(10);
                }
                else {
                    me._closeDropDownPanel(param);
                }
            }
        },
        _closeDropDownPanel: function (param) {
            var me = this;
            me._setMultipleInputValues(param);            
            $(".fr-paramname-" + param.Name + "-dropdown-container", me.$params).removeClass("fr-param-dropdown-show").hide();

            //for dropdown textbox do focus->blur->focus to re-validate, also reset its parent container's z-index property
            $(".fr-paramname-" + param.Name, me.$params).focus().blur().parent().css("z-index", "inherit");
        },
        _closeAllDropdown: function () {
            var me = this;
            $(".fr-param-dropdown-show", me.$params).filter(":visible").each(function (index, param) {
                me._closeDropDownPanel({ Name: $(param).attr("value") });
            });
        },
        _checkExternalClick: function (e) {
            var me = this;
            var $target = $(e.target);

            if (!$target.hasClass("fr-param-dropdown-img") &&
                !$target.hasClass("fr-param-dropdown-textbox") &&
                !$target.hasClass("fr-param-dropdown") &&
                !$target.hasClass("fr-param-dropdown-label") &&
                !$target.hasClass("fr-param-dropdown-checkbox") &&
                !$target.hasClass("fr-param-dropdown-icon") &&
                !$target.hasClass("fr-param-dropdown-textarea")) {
                me._closeAllDropdown();
            }
        },
        /**
         * @function $.forerunner.reportParameter#getParamList
         * @generate parameter list base on the user input and return
         */
        getParamsList: function (noValid) {
            var me = this;
            var i;
            if (noValid || ($(".fr-param-form", me.$params).length !== 0 && $(".fr-param-form", me.$params).valid() === true)) {
                var a = [];
                //Text
                $(".fr-param", me.$params).filter(":text").each(function () {
                    if ($(this).attr("ismultiple") === "false") {
                        a.push({ Parameter: this.name, IsMultiple: $(this).attr("ismultiple"), Type: $(this).attr("datatype"), Value: me._isParamNullable(this) });
                    } else {
                        var jsonValues = $(this).attr("jsonValues");
                        a.push({ Parameter: this.name, IsMultiple: $(this).attr("ismultiple"), Type: $(this).attr("datatype"), Value: JSON.parse(jsonValues ? jsonValues : null) });
                    }
                });
                //Hidden
                $(".fr-param", me.$params).filter("[type='hidden']").each(function () {
                    if ($(this).attr("ismultiple") === "false") {
                        a.push({ Parameter: this.name, IsMultiple: $(this).attr("ismultiple"), Type: $(this).attr("datatype"), Value: me._isParamNullable(this) });
                    } else {
                        a.push({ Parameter: this.name, IsMultiple: $(this).attr("ismultiple"), Type: $(this).attr("datatype"), Value: JSON.parse(me._isParamNullable(this)) });
                    }
                });
                //dropdown
                $(".fr-param", me.$params).filter("select").each(function () {
                    a.push({ Parameter: this.name, IsMultiple: $(this).attr("ismultiple"), Type: $(this).attr("datatype"), Value: me._isParamNullable(this) });
                });
                var radioList = {};
                //radio-group by radio name, default value: null
                $(".fr-param", me.$params).filter(":radio").each(function () {
                    if (!(this.name in radioList)) {
                        radioList[this.name] = null;
                    }
                    if (this.checked === true) {
                        radioList[this.name] = me._isParamNullable(this);
                    }
                });
                for (var radioName in radioList) {
                    a.push({ Parameter: radioName, IsMultiple: "", Type: "Boolean", Value: radioList[radioName] });
                }
                //combobox - multiple values
                //var tempCb = "";
                //$(".fr-param", me.$params).filter(":checkbox").filter(":checked").each(function () {
                //    if (tempCb.indexOf(this.name) === -1) {
                //        tempCb += this.name + ",";
                //    }
                //});
                //if (tempCb !== "") {
                //    var cbArray = tempCb.split(",");
                //    var cbName = "";
                //    var cbValue = "";
                //    for (i = 0; i < cbArray.length - 1; i++) {
                //        cbName = cbArray[i];
                //        var $target = $("input[name='" + cbArray[i] + "']:checked", me.$params);
                //        var cbValueLength = $target.length;

                //        $target.each(function (i) {
                //            if (i === cbValueLength - 1)
                //                cbValue += this.value;
                //            else
                //                cbValue += this.value + ",";

                //        });
                //        a.push({ name: cbName, ismultiple: $(this).attr("ismultiple"), type: $(this).attr("datatype"), value: cbValue });
                //    }
                //}

                //Combined to JSON String, format as below
                //var parameterList = '{ "ParamsList": [{ "Parameter": "CategoryID","IsMultiple":"True", "Value":"'+ $("#CategoryID").val()+'" }] }';

                var paramsObject = { "ParamsList": a };
                return JSON.stringify(paramsObject);
            } else {
                return null;
            }
        },
        _isParamNullable: function (param) {
            var cb = $(".fr-param-checkbox", this.$params).filter(".fr-paramname-" + param.Name).first();
            if (cb.attr("checked") === "checked" || param.value === "")
                return null;
            else
                return param.value;
        },
        _resetLabelWidth: function () {
            var max = 0;
            $(".fr-param-label", this.$params).each(function (index, obj) {
                if ($(obj).width() > max) max = $(obj).width();
            });
            $(".fr-param-label", this.$params).each(function (index, obj) {
                $(obj).width(max);
            });
        },
        /**
        * @function $.forerunner.reportParameter#resetValidateMessage
        * @customize jquery.validate message
        */
        resetValidateMessage: function () {
            var me = this;
            var error = me.options.$reportViewer.locData.validateError;

            jQuery.extend(jQuery.validator.messages, {
                required: error.required,
                remote: error.remote,
                email: error.email,
                url: error.url,
                date: error.date,
                dateISO: error.dateISO,
                number: error.number,
                digits: error.digits,
                maxlength: $.validator.format(error.maxlength),
                minlength: $.validator.format(error.minlength),
                rangelength: $.validator.format(error.rangelength),
                range: $.validator.format(error.range),
                max: $.validator.format(error.max),
                min: $.validator.format(error.min)
            });
        },
        /**
        * @function $.forerunner.reportParameter#removeParameter
        * @remove parameter element form the dom tree
        */
        removeParameter: function () {
            var me = this;
            me._formInit = false;
            me.$params = null;
            $("." + paramContainerClass, me.element).detach();
            me._parameterDefinitions = {};
        },
        _getDefaultHTMLTable: function () {
            var $newObj = $("<Table cellspacing='0' cellpadding='0'/>");
            return $newObj;
        },
        _contains: function (array, keyword) {
            var i = array.length;
            while (i--) {
                if (array[i] === keyword)
                    return true;
            }
            return false;
        },
        _hasDefaultValue: function (param) {
            var me = this;
            return me._defaultValueExist && $.isArray(param.DefaultValues);//&& param.DefaultValues[0];
        },
        _getDateTimeFromDefault: function (defaultDatetime) {
            if (!defaultDatetime || defaultDatetime.length < 9)
                return null;

            //dateISO: yyyy-mm-dd
            if (/^(\d{4})-(0\d{1}|1[0-2])-(0\d{1}|[12]\d{1}|3[01])$/.test(defaultDatetime))
                return defaultDatetime;

            var date = new Date(defaultDatetime.substr(0, defaultDatetime.indexOf(" ")));

            return date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate();
        },
        _checkDependencies: function (param) {
            var me = this;
            var disabled = false;

            if ($.isArray(param.Dependencies) && param.Dependencies.length) {
                $.each(param.Dependencies, function (index, dependence) {
                    var $targetElement = $(".fr-paramname-" + dependence, me.$params);
                    $targetElement.change(function () { me.refreshParameters(); });
                    //if dependence control don't have any value then disabled current one
                    if ($targetElement.val() === "") disabled = true;
                });
            }

            return disabled;
        },
        refreshParameters: function (savedParams) {
            var me = this;
            //set false not to do form validate.
            var paramList = savedParams ? savedParams : me.getParamsList(true);
            if (paramList) {
                // Ask viewer to refresh parameter, but not automatically post back
                // if all parameters are satisfied.
                me.options.$reportViewer.refreshParameters(paramList, false, -1, false);
            }
        },
        _disabledSubSequenceControl: function ($control) {
            $control.attr("disabled", true).addClass("fr-param-disable");
        },
        _checkHiddenParam: function (param) {
            var me = this;
            //if (param.QueryParameter) {
            //when no default value exist, it will set it as the first valid value
            //if no valid value exist, will popup error.
            if (!me._hasDefaultValue(param)) {
                if (me._reportDesignError === null) {
                    me._reportDesignError = "";
                }
                me._reportDesignError += param.Name + "' " + me.options.$reportViewer.locData.messages.paramFieldEmpty + " </br>";
            }
            //}
        },
    });  // $.widget
});
///#source 1 1 /Forerunner/ReportViewer/js/ReportDocumentMap.js
/**
 * @file Contains the document map widget.
 *
 */

// Assign or create the single globally scoped variable
var forerunner = forerunner || {};

// Forerunner SQL Server Reports
forerunner.ssr = forerunner.ssr || {};

/**
     * documenet map widget used with the reportViewer
     *
     * @namespace $.forerunner.reportDocumentMap
     * @prop {object} options - The options for document map
     * @prop {Object} options.$reportViewer - The report viewer widget     
     * @example
     *   $("#docMap").reportDocumentMap({ 
     *      $reportViewer: $viewer 
     *   });   
     */
$(function () {
    var widgets = forerunner.ssr.constants.widgets;

    $.widget(widgets.getFullname(widgets.reportDocumentMap), {
        options: {
            $reportViewer: null,
        },
        _create: function () {
        },
        _init: function () {

        },
        /**
        * @function $.forerunner.reportDocumentMap#write
        * @Generate document map html code and append to the dom tree
        * @param {String} docMapData - original data get from server client
        */
        write: function (docMapData) {
            var me = this;
            this.element.html("");

            var $docMapPanel = new $("<DIV />");
            $docMapPanel.addClass("fr-docmap-panel").addClass("fr-docmap-panel-layout");
            $docMapPanel.append(me._writeDocumentMapItem(docMapData.DocumentMap, 0));
            me.element.append($docMapPanel);
        },

        _writeDocumentMapItem: function (docMap, level) {
            var me = this;
            var $docMap = new $("<div />");
            if (level !== 0)
                $docMap.css("margin-left", "34px");

            var $mapNode = new $("<div />");
            $mapNode.addClass("fr-docmap-item").attr("title", "Navigate to " + docMap.Label).html(docMap.Label);
            $mapNode.on("click", { UniqueName: docMap.UniqueName }, function (e) {
                me.options.$reportViewer.navigateDocumentMap(e.data.UniqueName);
            });

            if (docMap.Children) {
                var $header = new $("<DIV />");
                $header.addClass("fr-docmap-parent-container");
                me._setFocus($header);

                var $rightImage = new $("<div class='fr-docmap-icon'/>");

                if (level === 0)
                    $rightImage.addClass("fr-docmap-icon-up");
                else
                    $rightImage.addClass("fr-docmap-icon-down");

                $rightImage.on("click", function () {
                    var childPanel = $docMap.find("[level='" + level + "']");
                    if (childPanel.is(":visible")) {
                        //$docMap.find("[level='" + level + "']").hide();
                        $docMap.find("[level='" + level + "']").slideUpHide();
                        $rightImage.removeClass("fr-docmap-icon-up").addClass("fr-docmap-icon-down");
                    }
                    else {
                        $docMap.find("[level='" + level + "']").slideUpShow();
                        //$docMap.find("[level='" + level + "']").show();
                        $rightImage.removeClass("fr-docmap-icon-down").addClass("fr-docmap-icon-up");
                    }
                });

                $mapNode.addClass("fr-docmap-item-root");
                $header.append($rightImage);
                $header.append($mapNode);
                $docMap.append($header);

                var $children = new $("<div level='" + level + "'>");
                $.each(docMap.Children, function (Index, Obj) {
                    $children.append(me._writeDocumentMapItem(Obj, level + 1));
                });

                $docMap.append($children);

                //expand the first root node
                if (level !== 0)
                    $children.hide();
            }
            else {
                $docMap.addClass("fr-docmap-item-container");
                me._setFocus($docMap);
                $docMap.append($mapNode);
            }

            return $docMap;
        },
        _setFocus: function ($focus) {
            $focus.hover(function () { $(this).addClass("fr-docmap-item-highlight"); }, function () { $(this).removeClass("fr-docmap-item-highlight"); });
        }
    });  // $.widget

});  // $(function ()

///#source 1 1 /Forerunner/ReportViewer/js/ReportPrint.js
/**
 * @file Contains the print widget.
 *
 */

// Assign or create the single globally scoped variable
var forerunner = forerunner || {};

// Forerunner SQL Server Reports
forerunner.ssr = forerunner.ssr || {};

$(function () {
    var widgets = forerunner.ssr.constants.widgets;
    var events = forerunner.ssr.constants.events;

    $.widget(widgets.getFullname(widgets.reportPrint), {
        options: {
            $reportViewer: null,
            $appContainer: null
        },
        _create: function () {
            
        },
        _init: function () {
            var me = this;
            me.locData = forerunner.localize.getLocData(forerunner.config.forerunnerFolder() + "/ReportViewer/loc/ReportViewer");
        },
        /**
         * @function $.forerunner.reportPrint#setPrint
         * @Generate print pane html code and append to the dom tree
         * @param {String} pageLayout - default loaded page layout data from RPL
         */
        setPrint: function (pageLayout) {
            var me = this;
            var print = me.locData.print;
            var unit = print.unit;

            me.element.html("");

            var $printForm = new $(
            "<div class='fr-print-page'>" +
                // Header
                "<div class='fr-print-innerPage fr-print-layout fr-core-dialog-layout'>" +
                    "<div class='fr-print-header fr-core-dialog-header'>" +
                        "<div class='fr-print-print-icon-container'>" +
                            "<div class='fr-icons24x24 fr-icons24x24-printreport fr-print-align-middle'>" +
                            "</div>" +
                        "</div>" +
                        "<div class='fr-print-title-container'>" +
                            "<div class='fr-print-title'>" +
                                print.title +
                            "</div>" +
                        "</div>" +
                        "<div class='fr-print-cancel-container'>" +
                            "<input type='button' class='fr-print-cancel' value='" + print.cancel + "'/>" +
                        "</div>" +
                    "</div>" +
                    // form
                    "<form class='fr-print-form'>" +
                        "<div class='fr-print-options-label'>" +
                            "<div>" +
                                print.pageLayoutOptions +
                            "</div>" +
                        "</div>" +
                        // Height / Width
                        "<div class='fr-print-settings-pair-container'>" +
                            "<div class='fr-print-setting'>" +
                                "<label class='fr-print-label'>" + print.pageHeight + "</label>" +
                                "<input class='fr-print-text'  name='PageHeight' type='text' value='" + me._unitConvert(pageLayout.PageHeight) + "'/>" +
                                "<label class='fr-print-unit-label'>" + unit + "</label>" +
                            "</div>" +
                            "<div class='fr-print-setting'>" +
                                "<label class='fr-print-label'>" + print.pageWidth + "</label>" +
                                "<input class='fr-print-text'  name='PageWidth' type='text' value='" + me._unitConvert(pageLayout.PageWidth) + "'/>" +
                                "<label class='fr-print-unit-label'>" + unit + "</label>" +
                            "</div>" +
                        "</div>" +
                        // Orientation
                        "<div class='fr-print-orientation-container'>" +
                            "<div class='fr-print-portrait'></div>" +
                            "<div class='fr-print-landscape'></div>" +
                        "</div>" +
                        "<div class='fr-print-margins-label'>" +
                            print.margin +
                        "</div>" +
                        // Top / Bottom
                        "<div class='fr-print-settings-pair-container'>" +
                            "<div class='fr-print-setting'>" +
                                "<label class='fr-print-label'>" + print.marginTop + "</label>" +
                                "<input class='fr-print-text'  name='MarginTop' type='text' value='" + me._unitConvert(pageLayout.MarginTop) + "'/>" +
                                "<label class='fr-print-unit-label'>" + unit + "</label>" +
                            "</div>" +
                            "<div class='fr-print-setting'>" +
                                "<label class='fr-print-label'>" + print.marginBottom + "</label>" +
                                "<input class='fr-print-text'  name='MarginBottom' type='text' value='" + me._unitConvert(pageLayout.MarginBottom) + "'/>" +
                                "<label class='fr-print-unit-label'>" + unit + "</label>" +
                            "</div>" +
                        "</div>" +
                        // Left / Right
                        "<div class='fr-print-settings-pair-container'>" +
                            "<div class='fr-print-setting'>" +
                                "<label class='fr-print-label'>" + print.marginLeft + "</label>" +
                                "<input class='fr-print-text'  name='MarginLeft' type='text' value='" + me._unitConvert(pageLayout.MarginLeft) + "'/>" +
                                "<label class='fr-print-unit-label'>" + unit + "</label>" +
                            "</div>" +
                            "<div class='fr-print-setting'>" +
                                "<label class='fr-print-label'>" + print.marginRight + "</label>" +
                                "<input class='fr-print-text'  name='MarginRight' type='text' value='" + me._unitConvert(pageLayout.MarginRight) + "'/>" +
                                "<label class='fr-print-unit-label'>" + unit + "</label>" +
                            "</div>" +
                            "</div>" +
                                "<div class='fr-print-submit-container'>" +
                                    "<div class='fr-print-submit-inner'>" +
                                    "<input name='submit' type='button' class='fr-print-submit fr-core-dialog-button' value='" + print.print + "'/>" +
                            "</div>" +
                        "</div>" +
                    "</form>" +
                "</div>" +
            "</div>");

            //var $maskDiv = $("<div class='fr-print-mask'></div>").css({ width: me.element.width(), height: me.element.height() });

            me.element.append($printForm);

            me.element.find(".fr-print-text").each(function () {
                $(this).attr("required", "true").attr("number", "true");
                $(this).parent().addClass("fr-print-item").append($("<span class='fr-print-error-span'/>").clone());
            });

            me._resetValidateMessage();
            me._validateForm(me.element.find(".fr-print-form"));

            me.element.find(".fr-print-submit").on("click", function (e) {
                var printPropertyList = me._generatePrintProperty();
                if (printPropertyList !== null) {
                    me.options.$reportViewer.reportViewer("printReport", printPropertyList);
                    me.closeDialog();
                }
            });

            me.element.find(".fr-print-cancel").on("click", function (e) {
                me.closeDialog();
            });

            me.$pageWidth = me.element.find("[name=PageWidth]");
            me.$pageHeight = me.element.find("[name=PageHeight]");

            me.$pageWidth.on("change", function (e) {
                me._setOrientationIconState.call(me);
            });

            me.$pageHeight.on("change", function (e) {
                me._setOrientationIconState.call(me);
            });

            me.$printPortrait = me.element.find(".fr-print-portrait");
            me.$printLandscape = me.element.find(".fr-print-landscape");

            me.$printPortrait.on("click", function (e) {
                if (!me._isPortrait()) {
                    me._swapWidthHeight();
                }
            });

            me.$printLandscape.on("click", function (e) {
                if (me._isPortrait()) {
                    me._swapWidthHeight();
                }
            });

            me._setOrientationIconState();

            $(":text", me.element).each(
                function (index) {
                    var textinput = $(this);
                    textinput.on("blur", function () {
                        me.options.$reportViewer.reportViewer("onInputBlur");
                    });
                    textinput.on("focus", function () {
                        me.options.$reportViewer.reportViewer("onInputFocus");
                    });
                }
            );
        },
        _isPortrait: function () {
            var me = this;
            if (Number(me.$pageWidth.val()) > Number(me.$pageHeight.val())) {
                return false;
            }
            return true;
        },
        _swapWidthHeight: function () {
            var me = this;

            var width = me.$pageWidth.val();
            me.$pageWidth.val(me.$pageHeight.val());
            me.$pageHeight.val(width);

            me._setOrientationIconState();
        },
        _setOrientationIconState: function () {
            var me = this;

            if (Number(me.$pageWidth.val()) > Number(me.$pageHeight.val())) {
                // Landscape
                me.$printLandscape.removeClass("fr-core-cursorpointer");
                me.$printLandscape.removeClass("fr-print-landscape-icon");
                me.$printLandscape.addClass("fr-print-landscape-icon-active");
                
                me.$printPortrait.removeClass("fr-print-portrait-icon-active");
                me.$printPortrait.addClass("fr-core-cursorpointer");
                me.$printPortrait.addClass("fr-print-portrait-icon");
            }
            else {
                // Portrait
                me.$printLandscape.addClass("fr-core-cursorpointer");
                me.$printLandscape.removeClass("fr-print-landscape-icon-active");
                me.$printLandscape.addClass("fr-print-landscape-icon");

                me.$printPortrait.removeClass("fr-print-portrait-icon");
                me.$printPortrait.removeClass("fr-core-cursorpointer");
                me.$printPortrait.addClass("fr-print-portrait-icon-active");
            }
        },
        /**
         * @function $.forerunner.userSettings#openDialog
         */
        openDialog: function () {
            var me = this;
            forerunner.dialog.showModalDialog(me.options.$appContainer, function () {
                me.element.css("display", "inline-block");
            });
        },
        /**
         * @function $.forerunner.userSettings#openDialog
         */
        closeDialog: function () {
            var me = this;
            forerunner.dialog.closeModalDialog(me.options.$appContainer, function () {
                me.element.css("display", "");
            });
        },
        _validateForm: function (form) {
            form.validate({
                errorPlacement: function (error, element) {
                    error.appendTo($(element).parent().find("span"));
                },
                highlight: function (element) {
                    $(element).parent().find("span").addClass("fr-print-error-position");
                    $(element).addClass("fr-print-error");
                },
                unhighlight: function (element) {
                    $(element).parent().find("span").removeClass("fr-print-error-position");
                    $(element).removeClass("fr-print-error");
                }
            });
        },
        _generatePrintProperty: function () {
            var me = this;
            var a = [];
            if (me.element.find(".fr-print-form").valid() === true) {

                me.element.find(".fr-print-text").each(function () {
                    a.push({ key: this.name, value: me._generateUnitConvert(this.value) });
                });

                var printObject = { "PrintPropertyList": a };
                return JSON.stringify(printObject);
            }
            else {
                return null;
            }
        },
        _resetValidateMessage: function () {
            var me = this;
            var error = me.locData.validateError;

            jQuery.extend(jQuery.validator.messages, {
                required: error.required,
                number: error.number,
                digits: error.digits
            });
        },
        //milimeter is the unit of the RPL, inch is the format unit for PDF
        _unitConvert: function (milimeter) {
            var me = this;
            //if inch is the country's culture unit then convert milimeter to inch
            if (me.locData.print.unit === "in") {
                return Math.round(milimeter / 25.4 * 100) / 100;
            }
            else {
                return milimeter;
            }
        },
        //if inch is the country's culture unit then the source should be inch, otherwise it should be mm (RPL Default).
        _generateUnitConvert: function (source) {
            var me = this;
            if (me.locData.print.unit === "mm") {
                return Math.round(source / 25.4 * 100) / 100;
            }
            else {
                return source;
            }
        },
    }); //$.widget
});
///#source 1 1 /Forerunner/ReportViewer/js/ReportViewerInitializer.js
// Assign or create the single globally scoped variable
var forerunner = forerunner || {};

// Forerunner SQL Server Reports
forerunner.ssr = forerunner.ssr || {};

$(function () {
    var ssr = forerunner.ssr;
    var events = forerunner.ssr.constants.events;
    var toolTypes = ssr.constants.toolTypes;
    var locData = forerunner.localize.getLocData(forerunner.config.forerunnerFolder() + "/ReportViewer/loc/ReportViewer");

    // This is the helper class that would initialize a viewer.
    // This is currently private.  But this could be turned into a sample.
    ssr.ReportViewerInitializer = function (options) {
        this.options = {
            $toolbar: null,
            $toolPane: null,
            $viewer: null,
            $nav: null,
            $paramarea: null,
            $lefttoolbar: null,
            $righttoolbar: null,
            $docMap: null,
            ReportViewerAPI: forerunner.config.forerunnerAPIBase() + "ReportViewer",
            ReportManagerAPI: forerunner.config.forerunnerAPIBase() + "ReportManager",
            ReportPath: null,
            toolbarHeight: null,
            navigateTo: null,
            isReportManager: false,
            userSettings: null,
            $appContainer: null
        };

        // Merge options with the default settings
        if (options) {
            $.extend(this.options, options);
        }
    };

    ssr.ReportViewerInitializer.prototype = {
        render: function () {
            var me = this;
            var $viewer = me.options.$viewer;

            me.options.$docMap.hide();
            $viewer.reportViewer({
                reportViewerAPI: me.options.ReportViewerAPI,
                reportPath: me.options.ReportPath,
                pageNum: 1,
                docMapArea: me.options.$docMap,
                loadParamsCallback: me.getSavedParameters,
                userSettings: me.options.userSettings,
                $appContainer: me.options.$appContainer
            });

            // Create / render the toolbar
            var $toolbar = me.options.$toolbar;
            $toolbar.toolbar({ $reportViewer: $viewer, $ReportViewerInitializer: this, $appContainer: me.options.$appContainer });

            var tb = forerunner.ssr.tools.mergedButtons;
            if (me.options.isReportManager) {
                $toolbar.toolbar("addTools", 12, true, [tb.btnHome, tb.btnRecent, tb.btnFavorite]);
                $toolbar.toolbar("addTools", 4, true, [tb.btnFav]);
                $toolbar.toolbar("disableTools", [tb.btnFav]);
            }

            // Let the report viewer know the height of the toolbar
            $viewer.reportViewer("option", "toolbarHeight", $toolbar.outerHeight());

            var $lefttoolbar = me.options.$lefttoolbar;
            if ($lefttoolbar !== null) {
                $lefttoolbar.toolbar({ $reportViewer: $viewer, $ReportViewerInitializer: this, toolClass: "fr-toolbar-slide", $appContainer: me.options.$appContainer });
            }

            var $righttoolbar = me.options.$righttoolbar;
            if ($righttoolbar !== null) {
                $righttoolbar.toolbar({ $reportViewer: $viewer, $ReportViewerInitializer: this, toolClass: "fr-toolbar-slide", $appContainer: me.options.$appContainer });
            }

            if (me.options.isReportManager) {
                $righttoolbar.toolbar("addTools", 2, true, [tb.btnSavParam]);
            }

            // Create / render the menu pane
            var tp = forerunner.ssr.tools.mergedItems;
            var $toolPane = me.options.$toolPane.toolPane({ $reportViewer: $viewer, $ReportViewerInitializer: this, $appContainer: me.options.$appContainer });
            if (me.options.isReportManager) {
                $toolPane.toolPane("addTools", 2, true, [tp.itemHome]);

                $toolPane.toolPane("addTools", 4, true, [tp.itemFav]);
                $toolPane.toolPane("disableTools", [tp.itemFav]);
                $viewer.on(events.reportViewerChangePage(), function (e, data) {
                    $toolPane.toolPane("enableTools", [tp.itemFav]);
                    $toolbar.toolbar("enableTools", [tb.btnFav]);
                });

                $viewer.on(events.reportViewerDrillThrough(), function (e, data) {
                    me.setFavoriteState($viewer.reportViewer("option", "reportPath"));
                });
                $viewer.on(events.reportViewerDrillBack(), function (e, data) {
                    me.setFavoriteState($viewer.reportViewer("option", "reportPath"));
                });
               

            }

            var $nav = me.options.$nav;
            if ($nav !== null) {
                $nav.pageNav({ $reportViewer: $viewer });
                $viewer.reportViewer("option", "pageNavArea", $nav);
            }
            
            var $paramarea = me.options.$paramarea;
            if ($paramarea !== null) {
                $paramarea.reportParameter({ $reportViewer: $viewer });
                $viewer.reportViewer("option", "paramArea", $paramarea);
            }

            var $dlg = me.options.$appContainer.find(".fr-layout-printsection");
            if ($dlg.length === 0) {
                $dlg = $("<div class='fr-dialog fr-layout-printsection'/>");
                $dlg.reportPrint({
                    $appContainer: me.options.$appContainer,
                    $reportViewer: $viewer
                });
                me.options.$appContainer.append($dlg);
            }

            if (me.options.isReportManager) {
                me.setFavoriteState(me.options.ReportPath);
            }

            $viewer.reportViewer("loadReport", me.options.ReportPath, 1);
        },
        setFavoriteState: function (path) {
            var me = this;
            me.$btnFavorite = null;
            if (me.options.$toolbar !== null) {
                me.$btnFavorite = me.options.$toolbar.find(".fr-button-update-fav").find("div");
            }
            me.$itemFavorite = null;
            if (me.options.$toolPane !== null) {
                me.$itemFavorite = me.options.$toolPane.find(".fr-item-update-fav").find("div");
            }
            forerunner.ajax.ajax({
                url: me.options.ReportManagerAPI + "/isFavorite?path=" + path,
                dataType: "json",
                async: true,
                success: function (data) {
                    me.updateFavoriteState(data.IsFavorite);
                },
                fail: function () {
                    if (me.$btnFavorite) {
                        me.$btnFavorite.hide();
                    }
                    if (me.$itemFavorite) {
                        me.$itemFavorite.hide();
                    }
                }
            });
        },
        onClickBtnFavorite: function (e) {
            var me = this;
            var $toolbar = e.data.me;

            var action = "add";
            if (me.$btnFavorite.hasClass("fr-icons24x24-favorite-minus")) {
                action = "delete";
            }

            forerunner.ajax.getJSON(me.options.ReportManagerAPI + "/UpdateView",
                {
                    view: "favorites",
                    action: action,
                    path: $toolbar.options.$reportViewer.reportViewer("option", "reportPath")
                },
                function (data) {
                    me.updateFavoriteState.call(me, action === "add");
                },
                function () {
                    forerunner.dialog.showMessageBox(me.options.$appContainer, locData.messages.favoriteFailed);
                }
            );
        },
        onClickItemFavorite: function (e) {
            var me = this;
            var $toolpane = e.data.me;

            var action = "add";
            if (me.$itemFavorite.hasClass("fr-icons24x24-favorite-minus")) {
                action = "delete";
            }

            $toolpane._trigger(events.actionStarted, null, $toolpane.allTools["fr-item-update-fav"]);
            forerunner.ajax.getJSON(me.options.ReportManagerAPI + "/UpdateView",
                {
                    view: "favorites",
                    action: action,
                    path: me.options.ReportPath
                },
                function (data) {
                    me.updateFavoriteState.call(me, action === "add");
                },
                function () {
                    forerunner.dialog.showMessageBox(me.options.$appContainer, locData.messages.favoriteFailed);
                }
            );
        },
        updateFavoriteState: function (isFavorite) {
            var me = this;
            if (isFavorite) {
                if (me.$btnFavorite) {
                    me.$btnFavorite.addClass("fr-icons24x24-favorite-minus");
                    me.$btnFavorite.removeClass("fr-icons24x24-favorite-plus");
                }
                if (me.$itemFavorite) {
                    me.$itemFavorite.addClass("fr-icons24x24-favorite-minus");
                    me.$itemFavorite.removeClass("fr-icons24x24-favorite-plus");
                }
            }
            else {
                if (me.$btnFavorite) {
                    me.$btnFavorite.removeClass("fr-icons24x24-favorite-minus");
                    me.$btnFavorite.addClass("fr-icons24x24-favorite-plus");
                }
                if (me.$itemFavorite) {
                    me.$itemFavorite.removeClass("fr-icons24x24-favorite-minus");
                    me.$itemFavorite.addClass("fr-icons24x24-favorite-plus");
                }
            }
        },
        getSavedParameters: function (reportPath) {
            var savedParams;
            var url = forerunner.config.forerunnerAPIBase() + "ReportManager" + "/GetUserParameters?reportPath=" + reportPath;
            forerunner.ajax.ajax({
                url: url,
                dataType: "json",
                async: false,
                success: function (data) {
                    if (data.ParamsList !== undefined) {
                        savedParams = data;
                    }
                }
            });
            return savedParams ? JSON.stringify(savedParams) : null;
        }
    };
});  // $(function ()

///#source 1 1 /Forerunner/ReportViewer/js/ReportViewerEZ.js
// Assign or create the single globally scoped variable
var forerunner = forerunner || {};

// Forerunner SQL Server Reports
forerunner.ssr = forerunner.ssr || {};

$(function () {
    var widgets = forerunner.ssr.constants.widgets;

    
     /**
     * Widget used to view a report
     *
     * @namespace $.forerunner.reportViewerEZ
     * @prop {Object} options - The options for reportViewerEZ
     * @prop {Object} options.DefaultAppTemplate -- The helper class that creates the app template.  If it is null, the widget will create its own.
     * @prop {String} options.path - Path of the report
     * @prop {Object} options.navigateTo - Callback function used to navigate to a selected report.  Only needed if isReportManager == true.
     * @prop {Object} options.historyBack - Callback function used to go back in browsing history.  Only needed if isReportManager == true.
     * @prop {bool} options.isReportManager - A flag to determine whether we should render report manager integration items.  Defaults to false.
     * @example
     * $("#reportExplorerEZId").reportExplorerEZ({
     *  DefaultAppTemplate: null,
     *  path: path,
     *  navigateTo: me.navigateTo,
     *  historyBack: me.historyBack
     *  isReportManager: false
     * });
     */
    $.widget(widgets.getFullname(widgets.reportViewerEZ), $.forerunner.toolBase, {
        options: {
            DefaultAppTemplate: null,
            path: null,
            navigateTo: null,
            historyBack: null,
            isReportManager: false,
            isFullScreen: true,
            userSettings: null
        },
        _render: function () {
            var me = this;
            var layout = me.DefaultAppTemplate;
            var path = me.options.path;
            forerunner.device.allowZoom(false);
            layout.$bottomdivspacer.addClass("fr-nav-spacer").hide();
            layout.$bottomdiv.addClass("fr-nav-container").hide();
            layout.$bottomdiv.css("position", me.options.isFullScreen ? "fixed" : "absolute");

            if (path !== null) {
                path = String(path).replace(/%2f/g, "/");
            } else {
                path = "/";
            }

            //layout.$mainviewport.css({ width: "100%", height: "100%" });
            layout.$mainsection.html(null);
            var $viewer = new $("<DIV />");
            $viewer.addClass("fr-layout-reportviewer");
            layout.$mainsection.append($viewer);

            var initializer = new forerunner.ssr.ReportViewerInitializer({
                $toolbar: layout.$mainheadersection,
                $toolPane: layout.$leftpanecontent,
                $viewer: $viewer,
                $nav: layout.$bottomdiv,
                $paramarea: layout.$rightpanecontent,
                $lefttoolbar: layout.$leftheader,
                $righttoolbar: layout.$rightheader,
                $docMap: layout.$docmapsection,
                ReportViewerAPI: forerunner.config.forerunnerAPIBase() + "/ReportViewer",
                ReportPath: path,
                navigateTo: me.options.navigateTo,
                isReportManager: me.options.isReportManager,
                userSettings: me.options.userSettings,
                $appContainer: layout.$container
            });

            initializer.render();

            $viewer.on("reportviewerback", function (e, data) {
                layout._selectedItemPath = data.path;
                if (me.options.historyBack) {
                    me.options.historyBack();
                }
            });

            me.DefaultAppTemplate.bindViewerEvents();

            layout.$rightheaderspacer.height(layout.$topdiv.height());
            layout.$leftheaderspacer.height(layout.$topdiv.height());
        },
        _init: function () {
            var me = this;
            if (me.options.DefaultAppTemplate === null) {
                me.DefaultAppTemplate = new forerunner.ssr.DefaultAppTemplate({ $container: me.element, isFullScreen: me.options.isFullScreen }).render();
            } else {
                me.DefaultAppTemplate = me.options.DefaultAppTemplate;
            }
            me._render();
        },
    });  // $.widget
});  // function()
///#source 1 1 /Forerunner/ReportExplorer/js/ReportExplorerEZ.js
/**
 * @file Contains the reportExplorer widget.
 *
 */

var forerunner = forerunner || {};
forerunner.ssr = forerunner.ssr || {};
forerunner.ssr.tools = forerunner.ssr.tools || {};
forerunner.ssr.tools.reportExplorerToolbar = forerunner.ssr.tools.reportExplorerToolbar || {};

$(function () {
    var widgets = forerunner.ssr.constants.widgets;
    var rtb = forerunner.ssr.tools.reportExplorerToolbar;
    var viewToBtnMap = {
        catalog: rtb.btnHome.selectorClass,
        favorites: rtb.btnFav.selectorClass,
        recent: rtb.btnRecent.selectorClass,
    };

    /**
     * Widget used to explore available reports and launch the Report Viewer
     *
     * @namespace $.forerunner.reportExplorerEZ
     * @prop {object} options - The options for reportExplorerEZ
     * @prop {Object} options.navigateTo - Callback function used to navigate to a selected report
     * @prop {Object} options.historyBack - Callback function used to go back in browsing history.
     * @example
     * $("#reportExplorerEZId").reportExplorerEZ({
     *  navigateTo: me.navigateTo,
     *  historyBack: me.historyBack
     * });
     */
    $.widget(widgets.getFullname(widgets.reportExplorerEZ), /** @lends $.forerunner.reportExplorerEZ */ {
        options: {
            navigateTo: null,
            historyBack: null,
            isFullScreen: true
        },
        /**
         * Transition to ReportManager view.
         *
         * @function $.forerunner.reportExplorerEZ#transitionToReportManager
         * @param {String} path - The explorer path to display.  Null for favorites and recent views.
         * @param {String} view - The view to display.  Valid values are null, favorites and recent.  Null is simply the report manager.
         */
        transitionToReportManager: function (path, view) {
            var me = this;
            var path0 = path;
            var layout = me.DefaultAppTemplate;
            forerunner.device.allowZoom(false);
            forerunner.dialog.closeAllModalDialogs();
            layout.cleanUp();
          
            //layout.$mainviewport.css({ width: "100%", height: "100%"});

            if (!path) 
                path = "/";
            if (!view)
                view = "catalog";
           
            var currentSelectedPath = layout._selectedItemPath;// me._selectedItemPath;
            layout.$mainsection.html(null);
            layout.$mainsection.show();
            layout.$docmapsection.hide();
            me.$reportExplorer = layout.$mainsection.reportExplorer({
                reportManagerAPI: forerunner.config.forerunnerAPIBase() + "ReportManager",
                forerunnerPath: forerunner.config.forerunnerFolder() ,
                path: path,
                view: view,
                selectedItemPath: currentSelectedPath,
                navigateTo: me.options.navigateTo,
                $appContainer: layout.$container
            });            
            var $toolbar = layout.$mainheadersection;
            $toolbar.reportExplorerToolbar({
                navigateTo: me.options.navigateTo,
                $appContainer: layout.$container
        });
            $toolbar.reportExplorerToolbar("setFolderBtnActive", viewToBtnMap[view]);

            layout.$rightheader.height(layout.$topdiv.height());
            layout.$leftheader.height(layout.$topdiv.height());
            layout.$rightheaderspacer.height(layout.$topdiv.height());
            layout.$leftheaderspacer.height(layout.$topdiv.height());

            layout._selectedItemPath=path0; //me._selectedItemPath = path0;
            me.element.addClass("fr-Explorer-background");
        },
        /**
         * Transition to ReportViewer view
         *
         * @function $.forerunner.reportExplorerEZ#transitionToReportView
         * @param {String} path - The report path to display.
         */
        transitionToReportViewer: function (path) {
            var me = this;
            me.DefaultAppTemplate._selectedItemPath = null;
            me.DefaultAppTemplate.$mainviewport.reportViewerEZ({
                DefaultAppTemplate: me.DefaultAppTemplate,
                path: path,
                navigateTo: me.options.navigateTo,
                historyBack: me.options.historyBack,
                isReportManager: true,
                userSettings: me.$reportExplorer ? me.$reportExplorer.reportExplorer("getUserSettings") : null
            });

            me.element.addClass("fr-Explorer-background");
            me.element.removeClass("fr-Explorer-background");
        },
        _init: function () {
            var me = this;
            me.DefaultAppTemplate = new forerunner.ssr.DefaultAppTemplate({ $container: me.element, isFullScreen: me.isFullScreen }).render();
        }
    });  // $.widget
});  // function()
