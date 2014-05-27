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
     * @prop {Function} options.onInputBlur - Callback function used to handle input blur event
     * @prop {Function} options.onInputFocus -Callback function used to handle input focus event 
     * @prop {Object} options.$appContainer - Report container
     * @prop {Object} options.parameterModel - Parameter model
     * @prop {Object} options.savePosition - Saved report page scroll position 
     * @prop {String} options.viewerID - Current report viewer id.
     * @prop {String} options.rsInstance - Report service instance name
     * @example
     * $("#reportViewerId").reportViewer();
     * $("#reportViewerId").reportViewer("loadReport", reportPath, 1, true, savedParameters);
     */
    $.widget(widgets.getFullname(widgets.reportViewer), /** @lends $.forerunner.reportViewer */ {
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
            isAdmin: false,
        },

        _destroy: function () {
            var me = this;
            //This needs to be changed to only remove the view function
            //Baotong update it on 22-05-2014
            $(window).off("resize", me._ReRenderCall);
        },

        // Constructor
        _create: function () {
            var me = this;
            setInterval(function () { me._sessionPing(); }, me.options.pingInterval);

            // ReportState
            me.locData = forerunner.localize.getLocData(forerunner.config.forerunnerFolder() + "ReportViewer/loc/ReportViewer");
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
            me.paramDefs = null;
            me.credentialDefs = null;
            me.datasourceCredentials = null;
            me.viewerID = me.options.viewerID ? me.options.viewerID : Math.floor((Math.random() * 100) + 1);
            me.SaveThumbnail = false;
            me.RDLExtProperty = null;            

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

            //$(window).resize(function () { me._ReRender.call(me); });
            $(window).on("resize", { me: me }, me._ReRenderCall);

            //load the report Page requested
            me.element.append(me.$reportContainer);
            //me._addLoadingIndicator();
            me.hideDocMap();

            if (me.options.parameterModel) {
                me.options.parameterModel.on(events.parameterModelSetChanged(), function (e, args) {
                    me._onModelSetChanged.call(me, e, args);
                });
            }
        },
        /**
         * Get current user settings
         *
         * @function $.forerunner.reportViewer#getUserSettings
         * @return {Object} - Current user settings
         */
        getUserSettings: function () {
            return this.options.userSettings;
        },
        /**
         * Get current page number
         *
         * @function $.forerunner.reportViewer#getCurPage
         * @return {Integer} - Current page number
         */
        getCurPage: function () {
            var me = this;
            return me.curPage;
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
         * @return {Boolean} - true if there is a document map
         */
        getHasDocMap: function () {
            var me = this;
            return me.hasDocMap;
        },
        /**
         * Get datasource credentials' data
         *
         * @function $.forerunner.reportViewer#getDataSourceCredential
         * @return {Object} datasource credential if saved datasource credential exist; return null if not
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
         * @paran {String} eventName - event name
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
        _addLoadingIndicator: function () {
            var me = this;
            if (me.loadLock === 0) {
                me.loadLock = 1;
                setTimeout(function () { me.showLoadingIndictator(); }, 500);
            }
        },
        /**
         * Shows the loading Indicator
         *
         * @function $.forerunner.reportViewer#showLoadingIndictator
         *
         * @param {Boolean} force - Force show loading indicator if it's true
         */
        showLoadingIndictator: function (force) {
            var me = this;
            if (me.loadLock === 1 || force===true) {
                var $mainviewport = me.options.$appContainer.find(".fr-layout-mainviewport");
                $mainviewport.addClass("fr-layout-mainviewport-fullheight");
                //212 is static value for loading indicator width
                var scrollLeft = me.$reportContainer.width() - 212;

                if (force === true) {
                    me.$loadingIndicator.css("top",$(window).scrollTop() + 100 + "px")
                     .css("left", scrollLeft > 0 ? scrollLeft / 2 : 0 + "px");
                }
                else {
                    me.$loadingIndicator.css("top", me.$reportContainer.scrollTop() + 100 + "px")
                        .css("left", scrollLeft > 0 ? scrollLeft / 2 : 0 + "px");
                }

                me.$reportContainer.addClass("fr-report-container-translucent");
                me.$loadingIndicator.show();
            }
        },
        /**
         * Removes the loading Indicator
         *
         * @function $.forerunner.reportViewer#removeLoadingIndicator
         *
         * @param {Boolean} force - Force remove loading indicator if it's true
         */
        removeLoadingIndicator: function (force) {
            var me = this;
            if (me.loadLock === 1 || force === true) {
                me.loadLock = 0;
                var $mainviewport = me.options.$appContainer.find(".fr-layout-mainviewport");
                $mainviewport.removeClass("fr-layout-mainviewport-fullheight");

                me.$reportContainer.removeClass("fr-report-container-translucent");
                me.$loadingIndicator.hide();
            }
        },
        _ReRender: function (force) {
            var me = this;

            if (me.options.userSettings && me.options.userSettings.responsiveUI === true) {
                $.each(me.pages, function (index, page) {
                    page.needsLayout = true;
                });                
                me._reLayoutPage(me.curPage, force);
                
            }
        },
        //Wrapper function, used to resigter window resize event
        _ReRenderCall: function (event) {
            var me = event.data.me;
            me._ReRender.call(me);
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
                me.$reportAreaContainer.append(me._getPageContainer(pageNum));
                me._touchNav();
                me._removeDocMap();
            }
            else {
                me.$reportAreaContainer.find(".Page").detach();
                me.$reportAreaContainer.append(me._getPageContainer(pageNum));
               
            }

            me._removeCSS();

            if (!$.isEmptyObject(me.pages[pageNum].CSS))
                me.pages[pageNum].CSS.appendTo("head");

            //relayout page if needed
            me._reLayoutPage(pageNum);

            if (!me.renderError) {
                me.curPage = pageNum;
                me._trigger(events.changePage, null, { newPageNum: pageNum, paramLoaded: me.paramLoaded, numOfVisibleParameters: me.$numOfVisibleParameters, renderError: me.renderError, credentialRequired: me.credentialDefs ? true : false });
            }
            $(window).scrollLeft(me.scrollLeft);
            $(window).scrollTop(me.scrollTop);
            me.removeLoadingIndicator();
            me.lock = 0;

            if (typeof (me._setPageCallback) === "function") {
                me._setPageCallback();
                me._setPageCallback = null;
            }
            
            // Trigger the change page event to allow any widget (E.g., toolbar) to update their view
            me._trigger(events.setPageDone, null, { newPageNum: me.curPage, paramLoaded: me.paramLoaded, numOfVisibleParameters: me.$numOfVisibleParameters, renderError: me.renderError, credentialRequired: me.credentialDefs ? true : false });
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
        // Windows Phones need to be reloaded in order to change their viewport settings
        // so what we will do in this case is to set our state into the sessionStorage
        // and reload the page. Then in the loadPage function we will check if this is
        // a reload page case so as to set the zoom
        _allowZoomWindowsPhone: function (isEnabled) {
            var me = this;

            // Save a copy of the page into the action history
            me.backupCurPage(true);

            // Make the action history ready to stringify (I.e., remove any unneeded object references)
            $.each(me.actionHistory, function (index, actionItem) {
                $.each(actionItem.reportPages, function (index, reportPage) {
                    reportPage.$container = null;
                    reportPage.CSS = null;
                    reportPage.isRendered = false;
                });
            });

            // Save the action history into the session storage
            sessionStorage.forerunner_zoomReload_actionHistory = JSON.stringify({ actionHistory: me.actionHistory });

            // Save the reuested zoom state
            sessionStorage.forerunner_zoomReload_userZoom = JSON.stringify({ userZoom: isEnabled ? "zoom" : "fixed" });

            // Now reload the page from the saved state
            window.location.reload();
        },
        /**
         * Set zoom enable or disable
         *
         * @function $.forerunner.reportViewer#allowZoom
         *
         * @param {Boolean} isEnabled - True to enable zoom, False to disable
         */
        allowZoom: function (isEnabled) {
            var me = this;

            if (forerunner.device.isWindowsPhone()) {
                me._allowZoomWindowsPhone(isEnabled);
                return;
            }

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
        /**
         * Function execute when input element blur
         *
         * @function $.forerunner.reportViewer#onInputBlur
         */
        onInputBlur: function () {
            var me = this;
            if (me.options.onInputBlur)
                me.options.onInputBlur();
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
         *
         * @param {Ingeter} newPageNum - Page number to navigate to
         */
        navToPage: function (newPageNum) {
            var me = this;
            if (newPageNum === me.curPage || me.lock === 1)
                return;
            me._resetContextIfInvalid();
            me.scrollLeft = 0;
            me.scrollTop = 0;

            if (newPageNum > me.numPages && me.numPages !==0 ) {
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

            me.savedTop = 0;
            me.savedLeft = 0;

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
                        instance: me.options.rsInstance,
                    },
                    dataType: "json",
                    async: false,
                    success: function (data) {
                        me.docMapData = data;
                        docMap.reportDocumentMap("write", data);
                    },
                    fail: function () { me._showMessageBox(me.locData.messages.docmapShowFailed); }
                });
            }

            me.savedTop = $(window).scrollTop();
            me.savedLeft = $(window).scrollLeft();

            me.element.mask();
            docMap.slideUpShow();
            me._trigger(events.showDocMap);

            //if doc map opened from toolpane, DefaultAppTemplate will pass savePosition here.
            setTimeout(function () {
                if (me.options.savePosition) {
                    me.savedTop = me.options.savePosition.top;
                    me.savedLeft = me.options.savePosition.left;
                    me.options.savePosition = null;
                }
            }, 100);
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
                        me.options.paramArea.reportParameter({ $reportViewer: me, $appContainer: me.options.$appContainer });
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
                me._loadPage(action.CurrentPage, false, null, null, false, me.pages[me.curPage].Replay);
                me._trigger(events.actionHistoryPop, null, { path: me.reportPath });
            }
            else {
                me.flushCache();
                me._resetViewer(false);
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
            me._resetContextIfInvalid();
            if (me.pageNavOpen) {//close nav
                me.pageNavOpen = false;
                if (window.removeEventListener) {
                    window.removeEventListener("orientationchange", me._handleOrientation, false);
                }
                else {
                    window.detachEvent("orientationchange", me._handleOrientation);
                }
                me.element.unmask(function() { me.showNav.call(me);});
            }
            else {//open nav
                me.pageNavOpen = true;
                if (window.addEventListener) {
                    window.addEventListener("orientationchange", me._handleOrientation, false);
                } else {
                    window.attachEvent("orientationchange", me._handleOrientation);
                }
                me.element.mask(function() { me.showNav.call(me);});
            }

            if (me.options.pageNavArea){
                me.options.pageNavArea.pageNav("showNav");
            }
            me._trigger(events.showNav, null, { newPageNum: me.curPage, path: me.reportPath, open: me.pageNavOpen });
            me._reLayoutPage(me.curPage);
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
                    async: true,
                    success: function (data) {
                        //console.log("Saved");
                    }

                });
            }
        },
        _prepareAction: function () {
            var me = this;

            if (me.togglePageNum !== me.curPage || me.togglePageNum  === 0) {
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
                    async: false,
                    success: function (data) {
                        me.togglePageNum = me.curPage;
                    },
                    fail: function () { me._showMessageBox(me.locData.messages.prepareActionFailed); }
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
                    ClearExistingSort: clear,
                    instance: me.options.rsInstance,
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
                    ClearExistingSort: clear,
                    instance: me.options.rsInstance,
                },
                function (data) {
                    me.scrollLeft = $(window).scrollLeft();
                    me.scrollTop = $(window).scrollTop();

                    me.numPages = data.NumPages;
                    me.renderTime = new Date().getTime();
                    me._loadPage(data.NewPage, false, null, null, true);
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
                        ReportPath: me.reportPath,
                        SessionID: me.sessionID,
                        PageNumber: me.getCurPage(),
                        ParameterList: paramList,
                        instance: me.options.rsInstance,
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
                    UniqueID: toggleID,
                    instance: me.options.rsInstance,
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
         * Toggle specify item of the report
         *
         * @function $.forerunner.reportViewer#toggleItem
         *
         * @param {String} toggleID - Id of the item to toggle
         */
        toggleItem: function (toggleID,scrollID) {
            var me = this;
            if (me.lock === 1)
                return;
            me.lock = 1;

            me._addLoadingIndicator();
            me._resetContextIfInvalid();
            me._prepareAction();
            
            me._callToggle(toggleID, scrollID);
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
                        me.scrollLeft = $(window).scrollLeft();
                        me.scrollTop = $(window).scrollTop();

                        var replay = me.pages[me.curPage].Replay

                        me.pages[me.curPage] = null;
                        me._loadPage(me.curPage, false, undefined, undefined, undefined, replay, scrollID);
                        
                    }
                    else
                        me.lock = 0;
                },
                function (jqXHR, textStatus, errorThrown, request) { me.lock = 0; me._writeError(jqXHR, textStatus, errorThrown, request); }
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
         *
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
                            me._showMessageBox(me.locData.messages.bookmarkNotFound);
                            me.lock = 0;
                        }
                    }
                },
                function (jqXHR, textStatus, errorThrown, request) { me.lock = 0; me._writeError(jqXHR, textStatus, errorThrown, request); }
            );
        },

        /**
         * Determines if the current report being viewed is the result of a drillthough action
         *
         * @function $.forerunner.reportViewer#isDrillThoughReport
         *
         * @return {Boolean} - True if current report is the result of a drillthough action, false else
         */
        isDrillThoughReport: function () {
            var me = this;
            if (me.origionalReportPath === me.reportPath)
                return true;
            else
                return false;
        },
        /**
         * Navigate to the given drill through item
         *
         * @function $.forerunner.reportViewer#navigateDrillthrough
         *
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
                        if (me.origionalReportPath === "")
                            me.origionalReportPath = me.reportPath;
                        me.reportPath = data.ReportPath;
                        if (me.options.parameterModel)
                            me.options.parameterModel.parameterModel("getCurrentParameterList", me.reportPath);

                        me._trigger(events.drillThrough, null, { path: data.ReportPath });
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
            me._resetContextIfInvalid();
            forerunner.ajax.getJSON(me.options.reportViewerAPI + "/NavigateTo/",
                {
                    NavType: navigateType.docMap,
                    SessionID: me.sessionID,
                    UniqueID: docMapID,
                    instance: me.options.rsInstance,
                },
                function (data) {
                    me.backupCurPage(false,true);
                    me.hideDocMap();
                    me._loadPage(data.NewPage, false, docMapID);
                },
                function (jqXHR, textStatus, errorThrown, request) { me.lock = 0; me._writeError(jqXHR, textStatus, errorThrown, request); }
            );
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
                top = $(window).scrollTop();
                left = $(window).scrollLeft();
            }

            if (me.paramLoaded) {
                var $paramArea = me.options.paramArea;
                //get current parameter list without validate
                savedParams = $paramArea.reportParameter("getParamsList", true);
            }

            if (me.options.parameterModel)
                parameterModel = me.options.parameterModel.parameterModel("getModel");

            me.actionHistory.push({
                ReportPath: me.reportPath, SessionID: me.sessionID, CurrentPage: me.curPage, ScrollTop: top,
                ScrollLeft: left, FlushCache: flushCache, paramLoaded: me.paramLoaded, savedParams: savedParams,
                reportStates: me.reportStates, renderTime: me.renderTime, reportPages: me.pages, paramDefs: me.paramDefs,
                credentialDefs: me.credentialDefs, savedCredential: me.datasourceCredentials, renderError: me.renderError,
                parameterModel: parameterModel
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
         * Find the given keyword. Find will always find the first matched
         *
         * @function $.forerunner.reportViewer#find
         *
         * @param {String} keyword - Keyword to find
         * @param {Integer} startPage - Starting page of the search range
         * @param {Integer} endPage - Ending page of the search range
         * @param {Boolean} findInNewPage - Find in new page not current
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
                    me._showMessageBox(me.locData.messages.completeFind, me._findDone);
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
                                    me._showMessageBox(me.locData.messages.completeFind, me._findDone);
                                else
                                    me._showMessageBox(me.locData.messages.keyNotFound, me._findDone);
                                me.resetFind();
                            }
                        }
                    },
                    function (jqXHR, textStatus, errorThrown, request) { me._writeError(jqXHR, textStatus, errorThrown, request); }
                );
            }
        },
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
                    me._showMessageBox(me.locData.messages.completeFind, me._findDone);
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
                        me._showMessageBox(me.locData.messages.completeFind, me._findDone);
                        me.resetFind();
                    }
                    else {
                        me.find(keyword, 1, me.findEndPage, true);
                    }
                }
                else {
                    me._showMessageBox(me.locData.messages.completeFind, me._findDone);
                    me.resetFind();
                }
            }
        },       
        _setFindHighlight: function (keyword) {
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
         * Export the report in the given format
         *
         * @function $.forerunner.reportViewer#exportReport
         *
         * @param {String} exportType - Export format
         * @see forerunner.ssr.constants
         */
        exportReport: function (exportType) {
            var me = this;
            me._resetContextIfInvalid();
            var url = me.options.reportViewerAPI + "/ExportReport/?ReportPath=" + me.getReportPath() + "&SessionID=" + me.getSessionID() + "&ExportType=" + exportType;
            if (me.options.rsInstance) url += "&instance=" + me.options.rsInstance;
            window.open(url);
        },       
        /**
         * Show print dialog, close it if opened
         *
         * @function $.forerunner.reportViewer#showPrint
         */
        showPrint: function () {
            var me = this;
            if (me.$printDialog) {
                me.$printDialog.reportPrint("openDialog");
            }
        },
        /**
         * Print current reprot in PDF format
         *
         * @function $.forerunner.reportViewer#printReport
         *
         * @param {String} printPropertyList - Page layout option
         */
        printReport: function (printPropertyList) {
            var me = this;
            me._resetContextIfInvalid();
            var url = me.options.reportViewerAPI + "/PrintReport/?ReportPath=" + me.getReportPath() + "&SessionID=" + me.getSessionID() + "&PrintPropertyString=" + printPropertyList;
            if (me.options.rsInstance) url += "&instance=" + me.options.rsInstance;

            if ((forerunner.device.isFirefox() && forerunner.config.getCustomSettingsValue("FirefoxPDFbug", "on").toLowerCase() === "on") || forerunner.device.isMobile()) {
                window.open(url);
            }
            else {
                var pif = me.element.find(".fr-print-iframe");
                if (pif.length === 1) pif.detach();

                var pif = $("<iframe/>");
                pif.addClass("fr-print-iframe");
                pif.attr("name", me.viewerID);
                pif.attr("src", url);
                pif.hide();
                me.element.append(pif);
            }
        },
        _setPrint: function (pageLayout) {
            var me = this;
            me.$printDialog = me.options.$appContainer.find(".fr-print-section");
            me.$printDialog.reportPrint("setPrint", pageLayout);
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
            var savedParams = me._getSavedParams([savedParamFromHistory, me.savedParameters, 
                me.options.parameterModel ? me.options.parameterModel.parameterModel("getCurrentParameterList", me.reportPath) : null]);

            if (submitForm === undefined)
                submitForm = true;

            if (savedParams) {
                if (me.options.paramArea) {
                    me.options.paramArea.reportParameter({
                        $reportViewer: this,
                        $appContainer: me.options.$appContainer
                    });
                    
                    if (submitForm === false) {
                        me._loadPage(pageNum, false, null, null, false);
                        me.options.paramArea.reportParameter("setsubmittedParamsList", savedParams);
                    }
                    else
                        me.refreshParameters(savedParams, submitForm, pageNum, false);
                        
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
                    ReportPath: me.reportPath,
                    SessionID: me.getSessionID(),
                    ParameterList: null,
                    DSCredentials: me.getDataSourceCredential(),
                    instance: me.options.rsInstance,
                },
                dataType: "json",
                async: false,
                done: function (data) {
                    if (data.Exception) {
                        me._renderPageError(me.$reportContainer, data);
                        me.removeLoadingIndicator();
                    } else {
                        if (data.SessionID)
                            me.sessionID = data.SessionID;
                        me._addLoadingIndicator();
                        me._showParameters(pageNum, data);
                    }
                },
                fail: function (jqXHR, textStatus, errorThrown, request) {
                    me._writeError(jqXHR, textStatus, errorThrown, request);                                        
                }
            });
        },

        _showParameters: function (pageNum, data) {
            var me = this;
            
            if (data.Type === "Parameters") {
                me._removeParameters();
                me.$reportContainer.find(".Page").detach();
                
                var $paramArea = me.options.paramArea;
                if ($paramArea) {
                    me.paramDefs = data;
                    $paramArea.reportParameter({ $reportViewer: this, $appContainer: me.options.$appContainer });
                    $paramArea.reportParameter("writeParameterPanel", data, pageNum);
                    me.$numOfVisibleParameters = $paramArea.reportParameter("getNumOfVisibleParameters");
                    if (me.$numOfVisibleParameters > 0)
                        me._trigger(events.showParamArea, null, { reportPath: me.reportPath});

                    me.paramLoaded = true;
                    me.$paramarea = me.options.paramArea;
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
         *
         * @param {String} Parameter list.
         * @param {Boolean} Submit form if the parameters are satisfied.
         * @param {Integer} The page to load.  Specify -1 to load the current page.
         * @param {Boolean} Whether to trigger show parameter area event if there are visible parameters.
         * @param {Boolean} Indicate it's a cascading refresh or whole refresh
         */
        refreshParameters: function (paramList, submitForm, pageNum, renderParamArea, isCascading) {
            var me = this;
            if (pageNum === -1) {
                pageNum = me.getCurPage();
            }
            if (paramList) {
                forerunner.ajax.ajax({
                    type: "POST",
                    url: me.options.reportViewerAPI + "/ParameterJSON",
                    data : {
                        ReportPath: me.reportPath,
                        SessionID: me.getSessionID(),
                        ParameterList: paramList,
                        DSCredentials: me.getDataSourceCredential(),
                        instance: me.options.rsInstance,
                    },
                    dataType: "json",
                    async: false,
                    success: function (data) {
                        if (data.Exception) {
                            me._renderPageError(me.$reportContainer, data);
                            me.removeLoadingIndicator();
                        } else {
                            if (data.SessionID)
                                me.sessionID = data.SessionID;
                            me._updateParameterData(data, submitForm, pageNum, renderParamArea, isCascading);
                        }
                    }
                });
            }
        },
        _updateParameterData: function (paramData, submitForm, pageNum, renderParamArea, isCascading) {
            var me = this;
            if (paramData) {
                me.paramDefs = paramData;
                me.options.paramArea.reportParameter("updateParameterPanel", paramData, submitForm, pageNum, renderParamArea, isCascading);
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
                me._removeAutoRefreshTimeout();
                me.SaveThumbnail = false;
                me.RDLExtProperty = null;
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
        _reloadFromSessionStorage: function () {
            var me = this;
            if (sessionStorage.forerunner_zoomReload_actionHistory) {
                var zoomReloadStringData = sessionStorage.forerunner_zoomReload_actionHistory;
                delete sessionStorage.forerunner_zoomReload_actionHistory;
                var zoomReloadData = JSON.parse(zoomReloadStringData);
                if (zoomReloadData.actionHistory) {
                    me.actionHistory = zoomReloadData.actionHistory;
                    me.back();
                    return true;
                }
            }
            return false;
        },
        /**
         * Load the given report
         *
         * @function $.forerunner.reportViewer#loadReport
         *
         * @param {String} reportPath - Path to the specific report
         * @param {Integer} pageNum - Starting page number
         * @param {Object} savedParameters - Saved parameters
         */
        loadReport: function (reportPath, pageNum, savedParameters) {
            var me = this;

            me._trigger(events.preLoadReport, null, { viewer: me, oldPath: me.reportPath, newPath: reportPath, pageNum: pageNum });

            if (me._reloadFromSessionStorage()) {
                me._trigger(events.afterLoadReport, null, { viewer: me, reportPath: me.getReportPath(), sessionID: me.getSessionID() });
                return;
            }

            if (me.reportPath && me.reportPath !== reportPath) {
                //Do some clean work if it's a new report
                me.backupCurPage(true);
                me.sessionID = "";
                me.flushCache();
                me.hideDocMap();
                me.element.unmask();
            }
            
            me._resetViewer();
            
            me.reportPath = reportPath ? reportPath : "/";
            me.pageNum = pageNum ? pageNum : 1;
            me.savedParameters = savedParameters ? savedParameters : null;

            //See if we have RDL extensions
            me._getRDLExtProp();

            if (me.options.jsonPath) {
                me._renderJson();
            } else {
                me._loadParameters(me.pageNum);
            }

            me._addSetPageCallback(function () {
                //_loadPage is designed to async so trigger afterloadreport event as set page down callback
                me._trigger(events.afterLoadReport, null, { viewer: me, reportPath: me.getReportPath(), sessionID: me.getSessionID() });
            });
        },
        _getRDLExtProp: function () {
            var me = this;

            forerunner.ajax.ajax(
               {
                   type: "GET",
                   dataType: "json",
                   url: forerunner.config.forerunnerAPIBase() + "ReportManager/ReportProperty/",
                   data: {
                       path: me.reportPath,
                       propertyName: "ForerunnerRDLExt",
                       instance: me.options.rsInstance,
                   },
                   success: function (data) {
                       me.RDLExtProperty = data;
                   },
                   async: false
               });
        },
        /**
         * Load current report with the given parameter list
         *
         * @function $.forerunner.reportViewer#loadReportWithNewParameters
         *
         * @param {Object} paramList - Parameter list object
         * @param {Integer} pageNum - The page to load
         */
        loadReportWithNewParameters: function (paramList, pageNum) {
            var me = this;
           
            me._resetViewer(true);
            me.renderTime = new Date().getTime();
            if (!pageNum) {
                pageNum = 1;
            }
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

            me._addLoadingIndicator();
            me.togglePageNum = newPageNum;
            forerunner.ajax.ajax(
                {
                    type: "GET",
                    dataType: "json",
                    url: me.options.jsonPath,
                    async: false,
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
        _loadPage: function (newPageNum, loadOnly, bookmarkID, paramList, flushCache, respToggleReplay, scrollID) {
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
                            el = me.element.find("div[data-uniqName=\"" + scrollID + "\"]")
                            if (el.length ===1)
                                $('html, body').animate({ scrollTop: el.offset().top }, 500);
                        }

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
                        ReportPath: me.reportPath,
                        SessionID: me.sessionID,
                        PageNumber: newPageNum,
                        ParameterList: paramList,
                        DSCredentials: me.getDataSourceCredential(),
                        instance: me.options.rsInstance,
                    }, 
                    async: true,
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

                            //$(window).scrollLeft(me.scrollLeft);
                            //$(window).scrollTop(me.scrollTop);
                            if (scrollID) {
                                el = me.element.find("div[data-uniqName=\"" + scrollID + "\"]")
                                if (el.length === 1)
                                    $('html, body').animate({ scrollTop: el.offset().top-50 }, 500);
                            }
                            me._updateTableHeaders(me);
                            me._saveThumbnail();
                        }
                    },
                    fail: function (jqXHR, textStatus, errorThrown, request) { me._writeError(jqXHR, textStatus, errorThrown, request); }
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
            //Error, need to handle this better
            if (!data) return;
            
            if (data.CredentialsRequired) {
                me._writeDSCredential(data);
                return;
            }

            if (!loadOnly && data.ReportContainer && data.ReportContainer.Report.AutoRefresh) {
                me._addSetPageCallback(function () {
                    me._setAutoRefresh(data.ReportContainer.Report.AutoRefresh);
                });
            }

            if (!me.pages[newPageNum]) {
                me.pages[newPageNum] = new reportPage(data);
            }
            else {
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

        _reLayoutPage: function(pageNum,force){
            var me = this;
            if (me.pages[pageNum] && me.pages[pageNum].needsLayout) {
                me.pages[pageNum].needsLayout =  me.pages[pageNum].$container.reportRender("layoutReport", true,force,me.getRDLExt());                
            }
        },
        _renderPage: function (pageNum) {
            //Write Style
            var me = this;
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

                me._getPageContainer(pageNum).reportRender("render", me.pages[pageNum],false, me.RDLExtProperty);       
                me.pages[pageNum].needsLayout= true;
            }

            me.pages[pageNum].isRendered = true;
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
         * Show datasource dialog, close if opened
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
                        var containerTop = me.options.$appContainer.scrollTop();
                        var containerLeft = me.options.$appContainer.scrollLeft();
                        var windowTop = $(window).scrollTop();
                        var windowLeft = $(window).scrollLeft();
                        
                        me._addSetPageCallback(function () {
                            me.options.$appContainer.scrollTop(containerTop).scrollLeft(containerLeft);
                            $(window).scrollTop(windowTop).scrollLeft(windowLeft);
                        });

                        //close all opened dialog before report start refresh
                        forerunner.dialog.closeAllModalDialogs(me.options.$appContainer);

                        me.refreshReport(me.getCurPage());
                        //console.log("report: " + me.getReportPath() + " refresh at:" + new Date());
                    }

                    me.autoRefreshID = null;
                }, period * 1000);

                //console.log('add settimeout, period: ' + period + "s");
            }
        },
        showRDLExtDialog: function () {
            var me = this;

            var dlg = $(".fr-rdl-section",me.element).first();

            if (dlg.length ===0) {
                dlg = $("<div class='fr-rdl-section fr-dialog-id fr-core-dialog-layout fr-core-widget'/>");
                me.options.$appContainer.append(dlg);
                dlg.reportRDLExt({ reportViewer: me });
            }
            dlg.reportRDLExt("openDialog");
            
        },
        getRDLExt: function () {
            var me = this;

            return me.RDLExtProperty;

        },
        saveRDLExt: function (RDL) {
            var me = this;

            try {
                if (RDL.trim() !== "")
                    me.RDLExtProperty = jQuery.parseJSON(RDL);
                else
                    me.RDLExtProperty = {};
            }
            catch (e) {
                forerunner.dialog.showMessageBox(me.options.$appContainer, e.message,"Error Saving");                
                return false;
            }

            return forerunner.ajax.ajax(
               {
                   type: "POST",
                   dataType: "text",
                   url: forerunner.config.forerunnerAPIBase() + "ReportManager/SaveReportProperty/",
                   data: {
                       value:RDL,
                       path: me.reportPath,
                       propertyName: "ForerunnerRDLExt",
                       instance: me.options.rsInstance,
                   },
                   success: function (data) {
                       me._ReRender(true);
                       return true;
                   },
                   fail: function (data){
                       return false;
                   },
                   async: false
               });
            

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
         * @function $.forerunner.dsCredential#destroy
         */
        destroy: function () {
            var me = this;

            me._removeAutoRefreshTimeout();
            me.autoRefreshID = undefined;

            if (me.$credentialDialog)
                me.$credentialDialog.dsCredential("destroy");

            if (me.$printDialog)
                me.$printDialog.reportPrint("destroy");

            if (me.$paramarea) {
                me.$paramarea.reportParameter("destroy");
            }
            if (me.$RDLExtDialog) {
                me.$RDLExtDialog.reportRDLExt("destroy");
            }
            
            //console.log('report viewer destory is invoked')

            //comment from MSDN: http://msdn.microsoft.com/en-us/library/hh404085.aspx
            // if using jQuery UI 1.8.x
            //$.Widget.prototype.destroy.call(this);
            // if using jQuery UI 1.9.x
            this._destroy();
        },
    });  // $.widget

});   // $(function


