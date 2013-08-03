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
            reportViewerAPI: "../api/ReportViewer",
            reportPath: null,
            pageNum: 1,
            pingInterval: 300000,
            toolbarHeight: 0,
            pageNavArea: null,
            paramArea: null,
            DocMapArea: null,

        },

        _destroy: function () {
        },

        // Constructor
        _create: function () {
            var me = this;

            setInterval(function () { me._sessionPing(); }, this.options.pingInterval);

            // ReportState
            me.locData = forerunner.localize.getLocData(forerunner.config.forerunnerFolder + "/ReportViewer/loc/ReportViewer");
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
            me.hasDocMap = false;
            me.docMapData = null;
            me.togglePageNum = 0;
            me.findKeyword = null;
            me.element.append(me.$loadingIndicator);
            me.pageNavOpen = false;
            me.savedTop = 0;
            me.savedLeft = 0;
  
            $(window).scroll(function () { me._updateTableHeaders(me); });

            //Log in screen if needed

            //load the report Page requested
            me.element.append(me.$reportContainer);
            me._addLoadingIndicator();
            me._loadParameters(me.options.pageNum);
            me.hideDocMap();
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
           
            me.loadLock = 1;
            setTimeout(function () { me.showLoadingIndictator(me); }, 500);
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
            if (!me.$reportAreaContainer) {
                me.$reportAreaContainer = $("<Div/>");
                me.$reportAreaContainer.addClass("fr-report-areacontainer");
                me.$reportContainer.append(me.$reportAreaContainer);
                me.$reportAreaContainer.append(me.pages[pageNum].$container);
                me._touchNav();
                me.pages[pageNum].$container.fadeIn();
                me._removeDocMap();
            }
            else {
                me.$reportAreaContainer.find(".Page").detach();
                me.$reportAreaContainer.append(me.pages[pageNum].$container);

                if (me.curPage !== null && me.curPage > pageNum) {
                    me.pages[pageNum].$container.show();
                } else {
                    me.pages[pageNum].$container.show();
                }

            }
                       
            me.curPage = pageNum;
            me._trigger(events.changePage, null, { newPageNum: pageNum, paramLoaded: me.paramLoaded });

            $(window).scrollLeft(me.scrollLeft);
            $(window).scrollTop(me.scrollTop);

            // Trigger the change page event to allow any widget (E.g., toolbar) to update their view
            if (me.options.setPageDone) {
                me._trigger(events.setPageDone);
                me.options.setPageDone = null;
            }
            me.lock = 0;
        },
        _touchNav: function () {
            // Touch Events
            var me = this;
            $(me.element).swipe({
                fallbackToMouseEvents: false,
                allowPageScroll: "auto",
                swipe: function (event, direction, distance, duration, fingerCount) {            
                    if (direction === "left" || direction === "up")
                        me.navToPage(me.curPage + 1);
                    else
                        me.navToPage(me.curPage - 1);
                },
                swipeStatus: function (event, phase, direction, distance) {
                    if (phase === "start")
                        me._hideTableHeaders();                   
                    if (phase === "end")
                        me._updateTableHeaders(me);
                },
                tap: function (event, target) {
                    $(target).trigger("click");
                },
                longTapThreshold: 1000,
                //threshold: 0,
            });
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
            me.element.show();
            me._trigger(events.hideDocMap);
        },
        _showDocMap: function () {
            var me = this;
            var docMap = me.options.docMapArea;
            docMap.reportDocumentMap({ $reportViewer: me });

            //get the doc map
            if (!me.docMapData) {
                $.ajax({
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
                    fail: function () { alert("Fail"); }
                });
            }

            me.savedTop = $(window).scrollTop();
            me.savedLeft = $(window).scrollLeft();
            me.savedTop = $(window).scrollTop();
            me.element.hide();
            docMap.slideUpShow();
            me._trigger(events.showDocMap);
        },
        _removeDocMap: function () {
            //Verify whether document map code exist in previous report
            if ($(".fr-docmap-panel").length !== 0) {
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
                //me._resetViewer();
                me.options.reportPath = action.ReportPath;
                me.sessionID = action.SessionID;
                
                me._trigger(events.drillBack);
                me._removeParameters();
                me.scrollLeft = action.ScrollLeft;
                me.scrollTop = action.ScrollTop;
                me._loadPage(action.CurrentPage, false, null, null, action.FlushCache);

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
            if (me.pageNavOpen) 
                me.pageNavOpen = false;
            else
                me.pageNavOpen = true;

            if (me.options.pageNavArea){
                me.options.pageNavArea.pageNav("showNav");
            }
            //me._trigger(events.showNav, null, { path: me.options.reportPath, open: me.pageNavOpen });
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
                $.ajax({
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
                    fail: function () { alert("Fail"); }
                });
            }
        },
        /**
         * Sorts the current report
         *
         * @function $.forerunner.reportViewer#sort
         * @param {String} direction - sort direction
         * @param {String} id - Session ID
         * @see forerunner.ssr.constants
         */
        sort: function (direction, id) {
            //Go the other dirction from current
            var me = this;
            var newDir;
            var sortDirection = forerunner.ssr.constants.sortDirection;

            if (me.lock === 1)
                return;
            me.lock = 1;

            if (direction === sortDirection.asc)
                newDir = sortDirection.desc;
            else
                newDir = sortDirection.asc;

            $.getJSON(me.options.reportViewerAPI + "/SortReport/", {
                SessionID: me.sessionID,
                SortItem: id,
                Direction: newDir
            }).done(function (data) {
                me.numPages = data.NumPages;
                me._loadPage(data.NewPage, false, null, null, true);
            })
            .fail(function () { console.log("error"); me.removeLoadingIndicator(); });
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

            me._prepareAction();

            $.getJSON(me.options.reportViewerAPI + "/NavigateTo/", {
                NavType: navigateType.toggle,
                SessionID: me.sessionID,
                UniqueID: toggleID
            }).done(function (data) {
                if (data.Result === true) {
                    me.scrollLeft = $(window).scrollLeft();
                    me.scrollTop = $(window).scrollTop();

                    me.pages[me.curPage] = null;
                    me._loadPage(me.curPage, false);
                }
            })
           .fail(function () { console.log("error"); me.removeLoadingIndicator(); });
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

            me._prepareAction();
            $.getJSON(me.options.reportViewerAPI + "/NavigateTo/", {
                NavType: navigateType.bookmark,
                SessionID: me.sessionID,
                UniqueID: bookmarkID
            }).done(function (data) {
                if (data.NewPage === me.curPage) {
                    me._navToLink(bookmarkID);
                    me.lock = 0;
                } else {
                    me.backupCurPage();
                    me._loadPage(data.NewPage, false, bookmarkID);
                }
            })
           .fail(function () { console.log("error"); me.removeLoadingIndicator(); });
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

            me._prepareAction();
            $.getJSON(me.options.reportViewerAPI + "/NavigateTo/", {
                NavType: navigateType.drillThrough,
                SessionID: me.sessionID,
                UniqueID: drillthroughID
            }).done(function (data) {
                me.backupCurPage(true);
                if (data.Exception)
                    me.$reportAreaContainer.find(".Page").reportRender("writeError", data);
                else {
                    me.sessionID = data.SessionID;
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

            })
           .fail(function () { console.log("error"); me.removeLoadingIndicator(); });
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

            $.getJSON(me.options.reportViewerAPI + "/NavigateTo/", {
                NavType: navigateType.docMap,
                SessionID: me.sessionID,
                UniqueID: docMapID
            }).done(function (data) {
                me.backupCurPage(false,true);
                me.hideDocMap();
                me._loadPage(data.NewPage, false, docMapID);
            })
           .fail(function () { console.log("error"); me.removeLoadingIndicator(); });
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

            if (flushCache !== true)
                flushCache = false;
            if (useSavedLocation === true) {
                top = me.savedTop;
                left = me.savedLeft;
            }

            me.actionHistory.push({ ReportPath: me.options.reportPath, SessionID: me.sessionID, CurrentPage: me.curPage, ScrollTop: top , ScrollLeft: left, FlushCache: flushCache });
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
        find: function (keyword, startPage, endPage) {
            var me = this;
            if (keyword === "") return;

            if (!me.findKeyword || me.findKeyword !== keyword) {
                me.findKeyword = keyword;
                me.findStartPage = null;
            }

            if (startPage === undefined)
                startPage = me.getCurPage();

            if (endPage === undefined)
                endPage = me.getNumPages();

            if (startPage > endPage) {
                me.resetFind();
                alert(me.locData.messages.completeFind);
                return;
            }

            if (me.findStartPage === null)
                me.findStartPage = startPage;

            $.getJSON(me.options.reportViewerAPI + "/FindString/", {
                SessionID: me.sessionID,
                StartPage: startPage,
                EndPage: endPage,
                FindValue: keyword
            }).done(function (data) {
                if (data.NewPage !== 0) {
                    me.finding = true;
                    if (data.NewPage !== me.curPage) {
                        me.options.setPageDone = function () { me.setFindHighlight(keyword); };
                        me.pages[data.NewPage] = null;
                        me._loadPage(data.NewPage, false);
                    } else {
                        me.setFindHighlight(keyword);
                    }
                }
                else {
                    if (me.findStartPage !== 1) {
                        me.find(keyword, 1, me.findStartPage - 1);
                        me.findStartPage = 1;
                    }
                    else {
                        if (me.finding === true)
                            alert(me.locData.messages.completeFind);
                        else
                            alert(me.locData.messages.keyNotFound);
                        me.resetFind();
                    }
                }
            })
          .fail(function () { console.log("error"); me.removeLoadingIndicator(); });
        },
        /**
         * Find the next occurance of the given keyword
         *
         * @function $.forerunner.reportViewer#findNext
         * @param {String} keyword - Keyword to find
         */
        findNext: function (keyword) {
            var me = this;
            $(".fr-render-find-keyword").filter(".fr-render-find-highlight").first().removeClass("fr-render-find-highlight");

            var $nextWord = $(".fr-render-find-keyword").filter(":visible").filter(".Unread").first();
            if ($nextWord.length > 0) {
                $nextWord.removeClass("Unread").addClass("fr-render-find-highlight").addClass("Read");
                $(window).scrollTop($nextWord.offset().top - 150);
                $(window).scrollLeft($nextWord.offset().left - 250);
                
                //window.scrollTo($nextWord.offset().left, $nextWord.offset().top - 100);
            }
            else {
                if (me.getNumPages() === 1) {
                    alert(me.locData.messages.completeFind);
                    me.resetFind();
                    return;
                }

                if (me.getCurPage() + 1 <= me.getNumPages())
                    me.find(keyword, me.getCurPage() + 1);
                else if (me.findStartPage > 1)
                    me.find(keyword, 1, me.findStartPage - 1);
                else {
                    alert(me.locData.messages.completeFind);
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
            me.findStartPage = null;
            me.findKeyword = null;
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
            var url = me.options.reportViewerAPI + "/ExportReport/?ReportPath=" + me.getReportPath() + "&SessionID=" + me.getSessionID() + "&ParameterList=&ExportType=" + exportType;
            window.open(url);
        },

        //Page Loading
        _loadParameters: function (pageNum) {
            var me = this;
            $.getJSON(me.options.reportViewerAPI + "/ParameterJSON/", {
                ReportPath: me.options.reportPath
            })
           .done(function (data) {
               me._addLoadingIndicator();
               me._showParameters(pageNum, data);
           })
           .fail(function () {
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
                    me._trigger(events.showParamArea);
                    $paramArea.reportParameter({ $reportViewer: this });
                    $paramArea.reportParameter("writeParameterPanel", data, me, pageNum, false);
                    me.paramLoaded = true;
                }
            }
            else if (data.Exception) {
                me.$reportContainer.reportRender({ reportViewer: this });
                me.$reportContainer.reportRender("writeError", data);
                me.removeLoadingIndicator();
            }
            else {
                me._loadPage(pageNum, false);
            }
        },
        _removeParameters: function () {
            var me = this;
            if (me.paramLoaded === true) {
                var $paramArea = me.options.paramArea;
                if ($paramArea) {
                    $paramArea.reportParameter("removeParameter");
                    me.paramLoaded = false;
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
         */
        loadReportWithNewParameters: function (paramList) {
            var me = this;
           
            me._resetViewer(true);            
            me._loadPage(1, false, null, paramList, true);
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
            $.getJSON(me.options.reportViewerAPI + "/ReportJSON/", {
                ReportPath: me.options.reportPath,
                SessionID: me.sessionID,
                PageNumber: newPageNum,
                ParameterList: paramList
            })
            .done(function (data) {
                me._writePage(data, newPageNum, loadOnly);                
                if (!me.element.is(":visible") && !loadOnly)
                    me.element.show();  //scrollto does not work with the slide in functions:(
                if (bookmarkID)
                    me._navToLink(bookmarkID);
                if (!loadOnly && flushCache !== true)
                    me._cachePages(newPageNum);
            })
            .fail(function () { console.log("error"); me.removeLoadingIndicator(); });
        },
        
        _writePage: function (data, newPageNum, loadOnly) {
            var me = this;
            var $report = $("<Div/>");
            $report.addClass("Page");

            //Error, need to handle this better
            if (!data) return;

            $report.reportRender({ reportViewer: me });

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
                me.removeLoadingIndicator();
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
                me.pages[pageNum].$container.reportRender("writeError", me.pages[pageNum].reportObj);
            me.pages[pageNum].isRendered = true;
        },
                
        _sessionPing: function () {
            // Ping each report so that the seesion does not expire on the report server
            var me = this;
            if (me.sessionID && me.sessionID !== "")
                $.getJSON(me.options.reportViewerAPI + "/PingSession", {
                    PingSessionID: me.sessionID
                })
                .done(function (data) {
                    if (data.Status === "Fail") {
                        me.sessionID = "";                       
                    }
                })
                .fail(function () { console.log("ping error"); });

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
            var navTo = me.element.find("[name='" + elementID + "']");

            $(document).scrollTop(navTo.offset().top - 100);  //Should account for floating headers and toolbar height need to be a calculation
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


