///#source 1 1 /Forerunner/Common/js/forerunner.js
/**
 * @file
 *  Defines forerunner SDK specific namespaces
 *
 */

/** 
 * Alias used for the jquery namespace
 * @namespace $
 */

/**
 * Defines all jquery based, forerunner widgets
 * @namespace $.forerunner
 */

/**
 * Top level object that defines the forerunner SDK
 *
 * @namespace
 */
var forerunner = forerunner || {};

/**
 * Contains the SQL Server Report data
 *
 * @namespace
 */
forerunner.ssr = forerunner.ssr || {};

jQuery.fn.extend({
    slideRightShow: function (delay) {
        return this.each(function () {
            $(this).show("slide", { direction: "right", easing: "easeInCubic" }, delay);
        });
    },
    slideLeftHide: function (delay) {
        return this.each(function () {
            $(this).hide("slide", { direction: "left", easing: "easeOutCubic" }, delay);
        });
    },
    slideRightHide: function (delay) {
        return this.each(function () {
            $(this).hide("slide", { direction: "right", easing: "easeOutCubic" }, delay);
        });
    },
    slideLeftShow: function (delay) {
        return this.each(function () {
            $(this).show("slide", { direction: "left", easing: "easeInCubic" }, delay);
        });
    }    
});
$(function () {
    /**
     * Defines all the constants needed to use the ssr SDK.
     *
     * @namespace
     */
    forerunner.ssr.constants = {
        /**
         * Defines all the widget names available in the ssr SDK
         *
         * @namespace
         */
        widgets: {
            /** @constant */
            reportExplorer: "reportExplorer",
            /** @constant */
            reportExplorerToolbar: "reportExplorerToolbar",
            /** @constant */
            pageNav: "pageNav",
            /** @constant */
            reportDocumentMap: "reportDocumentMap",
            /** @constant */
            reportParameter: "reportParameter",
            /** @constant */
            reportRender: "reportRender",
            /** @constant */
            reportViewer: "reportViewer",
            /** @constant */
            reportViewerEZ: "reportViewerEZ",
            /** @constant */
            toolbar: "toolbar",
            /** @constant */
            toolBase: "toolBase",
            /** @constant */
            toolPane: "toolPane",

            /** @constant */
            namespace: "forerunner",

            /**
             * @param {String} name of the widget.
             * @return {String} The fully qualified widget name (I.e., namespace.widgetname)
             */
            getFullname: function (name) {
                return this.namespace + "." + name;
            }
        },
        /** 
         * Defines the event name constant used to trigger the event as well as the fully qualified event name
         * function (widget + event, lowercase). The fully qualified name is used to bind to the event.
         *
         * @namespace
         */
        events: {
            /** @constant */
            actionStarted: "actionstarted",
            /** widget + event, lowercase */
            toolPaneActionStarted: function () { return forerunner.ssr.constants.widgets.toolPane.toLowerCase() + this.actionStarted; },

            /** @constant */
            menuClick: "menuclick",
            /** widget + event, lowercase */
            toolbarMenuClick: function () { return (forerunner.ssr.constants.widgets.toolbar + this.menuClick).toLowerCase(); },

            /** @constant */
            paramAreaClick: "paramareaclick",
            /** widget + event, lowercase */
            toolbarParamAreaClick: function () { return (forerunner.ssr.constants.widgets.toolbar + this.paramAreaClick).toLowerCase(); },

            /** @constant */
            setPageDone: "setPageDone",
            /** widget + event, lowercase */
            reportViewerSetPageDone: function () { return (forerunner.ssr.constants.widgets.reportViewer + this.setPageDone).toLowerCase(); },

            /** @constant */
            changePage: "changepage",
            /** widget + event, lowercase */
            reportViewerChangePage: function () { return (forerunner.ssr.constants.widgets.reportViewer + this.changePage).toLowerCase(); },

            /** @constant */
            drillBack: "drillback",
            /** widget + event, lowercase */
            reportViewerDrillBack: function () { return (forerunner.ssr.constants.widgets.reportViewer + this.drillBack).toLowerCase(); },

            /** @constant */
            back: "back",
            /** widget + event, lowercase */
            reportViewerBack: function () { return (forerunner.ssr.constants.widgets.reportViewer + this.back).toLowerCase(); },

            /** @constant */
            showNav: "showNav",
            /** widget + event, lowercase */
            reportViewerShowNav: function () { return (forerunner.ssr.constants.widgets.reportViewer + this.showNav).toLowerCase(); },

            /** @constant */
            showParamArea: "showparamarea",
            /** widget + event, lowercase */
            reportViewerShowParamArea: function () { return (forerunner.ssr.constants.widgets.reportViewer + this.showParamArea).toLowerCase(); },

            /** @constant */
            render: "render",
            /** widget + event, lowercase */
            reportParameterRender: function () { return (forerunner.ssr.constants.widgets.reportParameter + this.render).toLowerCase(); },

            /** @constant */
            submit: "submit",
            /** widget + event, lowercase */
            reportParameterSubmit: function () { return (forerunner.ssr.constants.widgets.reportParameter + this.submit).toLowerCase(); },
        },
        /**
         * Tool types used by the Toolbase widget {@link $.forerunner.toolBase}
         *
         * @readonly
         * @enum {String}
         */
        toolTypes: {
            button: "button",
            input: "input",
            textButton: "textbutton",
            plainText: "plaintext",
            containerItem: "containeritem",
            toolGroup: "toolgroup"
        },
        /**
         * sort order used in the Report Viewer sort() method.
         *
         * @readonly
         * @enum {String}
         */
        sortDirection: {
            desc: "Descending",
            asc: "Ascending"
        },
        /**
         * Navigate type used in the REST end point NavigateTo
         *
         * @readonly
         * @enum {String}
         */
        navigateType: {
            toggle: "toggle",
            bookmark: "bookmark",
            drillThrough: "drillthrough",
            docMap: "documentMap",
        },
    };

    /**
     * Defines useful global varibles to use the SDK
     *
     * @namespace
     */
    forerunner.init = {
        forerunnerFolder: "../forerunner",
    }
    /**
     * Defines the methods used to localize string data in the SDK.
     *
     * @namespace
     */
    forerunner.localize = {
        _locData: {},

        /**
         * Returns the language specific data.
         *
         * @param {String} locFileLocation - The localization file location without the language qualifier
         *
         * @return {object} Localization data
         */
        getLocData: function(locFileLocation){
            var lang = navigator.language || navigator.userLanguage;
            var langData = this._loadFile(locFileLocation, lang);

            if (langData === null)
                langData = this._loadFile(locFileLocation, "en-us");

            return langData;
            
        },
        _loadFile: function (locFileLocation, lang) {
            var me = this;
            if (me._locData[locFileLocation] === undefined)
                me._locData[locFileLocation] = {};
            if (me._locData[locFileLocation][lang] === undefined) {
                $.ajax({
                    url: locFileLocation + "-" + lang + ".txt",
                    dataType: "json",
                    async: false,
                    success: function (data) {
                        me._locData[locFileLocation][lang] = data;
                    },
                    fail: function () {
                        me._locData[locFileLocation][lang] = null;
                    }
                });

            }
            return me._locData[locFileLocation][lang];
        },

    };
    /**
     * Contains device specific methods.
     *
     * @namespace
     */
    forerunner.device = {
        /** @return {bool} Returns a boolean that indicates if the device is a touch device */
        isTouch: function () {
            var ua = navigator.userAgent;
            return !!("ontouchstart" in window) // works on most browsers
                || !!("onmsgesturechange" in window) || ua.match(/(iPhone|iPod|iPad)/)
                || ua.match(/BlackBerry/) || ua.match(/Android/); // works on ie10
        },
        allowZoom: function (flag) {
            if (flag === true) {
                $('head meta[name=viewport]').remove();
                $('head').prepend('<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=10.0, minimum-scale=0, user-scalable=1" />');
            } else {
                $('head meta[name=viewport]').remove();
                $('head').prepend('<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=1" />');
            }
        },
        isElementInViewport: function (el) {
            var rect = el.getBoundingClientRect();

            return (
                rect.top >= 0 &&
                rect.left >= 0 &&
                rect.bottom <= (window.innerHeight || document. documentElement.clientHeight) && /*or $(window).height() */
                rect.right <= (window.innerWidth || document. documentElement.clientWidth) /*or $(window).width() */
                );
        },
        isSmall: function () {
            if ($(window).width() < 400 || $(window).height() < 400)
                return true;
            else
                return false;
        },
    };
    
});

///#source 1 1 /Forerunner/ReportViewer/js/ReportViewer.js
// Assign or create the single globally scoped variable
var forerunner = forerunner || {};

// Forerunner SQL Server Reports
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

    // report viewer widget
    $.widget(widgets.getFullname(widgets.reportViewer), {
        // Default options
        options: {
            reportViewerAPI: "./api/ReportViewer",
            forerunnerPath: "./forerunner",
            reportPath: null,
            pageNum: 1,
            pingInterval: 300000,
            toolbarHeight: 0,
            setPageDone: null,
            pageNav: null,
            paramArea: null
        },

        _destroy: function () {
        },

        // Constructor
        _create: function () {
            var me = this;

            setInterval(function () { me._sessionPing(); }, this.options.pingInterval);

            // ReportState
            me.locData = forerunner.localize.getLocData(me.options.forerunnerPath + "/ReportViewer/loc/ReportViewer");
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
            me.togglePageNum = 0;
            me.findKeyword = null;
            me.element.append(me.$loadingIndicator);
  
            $(window).scroll(function () { me._updateTableHeaders(me); });

            //Log in screen if needed

            //load the report Page requested
            me.element.append(me.$reportContainer);
            me._addLoadingIndicator();
            me._loadParameters(me.options.pageNum);
        },
        getCurPage: function () {
            var me = this;
            return me.curPage;
        },
        getNumPages: function () {
            var me = this;
            return me.numPages;
        },
        getReportViewerAPI: function () {
            var me = this;
            return me.options.reportViewerAPI;
        },
        getReportPath: function () {
            var me = this;
            return me.options.reportPath;
        },
        getSessionID: function () {
            var me = this;
            return me.sessionID;
        },
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
                    if (phase === "move")
                        me._updateTableHeaders(me);
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
        showDocMap: function () {
            if ($(".fr-docmap-panel").length > 0)
                $(".fr-docmap-panel").animate({ height: "toggle" }, 100, function () {
                    $(".fr-docmap-border").css("height", document.body.clientHeight - $(".fr-docmap-panel").offset().top);
                });
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
        back: function () {
            var me = this;
            var action = me.actionHistory.pop();
            if (action) {
                me._resetViewer();
                me.options.reportPath = action.ReportPath;
                me.sessionID = action.SessionID;
                me.scrollLeft = action.ScrollLeft;
                me.scrollTop = action.ScrollTop;
                
                me._trigger(events.drillBack);
                me._removeParameters();
                me._loadPage(action.CurrentPage, false, null, null, true);
            }
            else {
                me._trigger(events.back, null, { path: me.options.reportPath });
            }
        },
        showNav: function () {
            var me = this;
            if (me.options.pageNav){
                me.options.pageNav.pageNav("showNav");
            }
            me._trigger(events.showNav, null, { path: me.options.reportPath });
        },
        flushCache: function () {
            var me = this;
            me.pages = {};
            if (me.options.pageNav)
                me.options.pageNav.pageNav("reset");
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
        sort: function (direction, id) {
            //Go the other dirction from current
            var me = this;
            var newDir;
            var sortDirection = forerunner.ssr.constants.sortDirection;

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
                me._loadPage((data.NewPage), false, null, null, true);
            })
            .fail(function () { console.log("error"); me.removeLoadingIndicator(); });
        },
        toggleItem: function (toggleID) {
            var me = this;
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
        navigateBookmark: function (bookmarkID) {
            var me = this;
            me._prepareAction();
            $.getJSON(me.options.reportViewerAPI + "/NavigateTo/", {
                NavType: navigateType.bookmark,
                SessionID: me.sessionID,
                UniqueID: bookmarkID
            }).done(function (data) {
                if (data.NewPage === me.curPage) {
                    me._navToLink(bookmarkID);
                } else {
                    me.backupCurPage();
                    me._loadPage(data.NewPage, false, bookmarkID);
                }
            })
           .fail(function () { console.log("error"); me.removeLoadingIndicator(); });
        },
        navigateDrillthrough: function (drillthroughID) {
            var me = this;
            me._prepareAction();
            $.getJSON(me.options.reportViewerAPI + "/NavigateTo/", {
                NavType: navigateType.drillThrough,
                SessionID: me.sessionID,
                UniqueID: drillthroughID
            }).done(function (data) {
                me.backupCurPage();
                if (data.Exception)
                    me.$reportAreaContainer.find(".Page").reportRender("writeError", data);
                else {
                    me.sessionID = data.SessionID;
                    me.options.reportPath = data.ReportPath;
                    
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
        navigateDocumentMap: function (docMapID) {
            var me = this;
            $.getJSON(me.options.reportViewerAPI + "/NavigateTo/", {
                NavType: navigateType.docMap,
                SessionID: me.sessionID,
                UniqueID: docMapID
            }).done(function (data) {
                me.backupCurPage();
                me._loadPage(data.NewPage, false, null);
            })
           .fail(function () { console.log("error"); me.removeLoadingIndicator(); });
        },
        backupCurPage: function () {
            var me = this;
            me.actionHistory.push({ ReportPath: me.options.reportPath, SessionID: me.sessionID, CurrentPage: me.curPage, ScrollTop: $(window).scrollTop(), ScrollLeft: $(window).scrollLeft() });
        },
        _setScrollLocation: function (top, left) {
            var me = this;
            me.scrollLeft(left);
            me.scrollTop(top);
        },
        find: function (keyword,startPage, endPage) {
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
        resetFind: function () {
            var me = this;
            me.finding = false;
            me.findStartPage = null;
            me.findKeyword = null;
        },
        showExport: function () {
            if ($(".fr-render-export-panel").is(":hidden")) {
                var $export = $(".fr-button-export").filter(":visible");
                $(".fr-render-export-panel").css("left", $export.offset().left);
            }
            $(".fr-render-export-panel").toggle();
        },
        exportReport: function (exportType) {
            var me = this;
            $(".fr-render-export-panel").toggle();
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
            me.togglePageNum = 0;
            me.findKeyword = null;
        },
        loadReport: function (reportPath,pageNum) {
            var me = this;

            me._resetViewer();            
            me.options.reportPath = reportPath;
            me.options.pageNum = pageNum;
            me._loadParameters(pageNum);            
            
        },
        loadReportWithNewParameters: function(paramList){
            var me = this;
           
            me._resetViewer(true);            
            me._loadPage(1, false, null, paramList, true);
        },
        _loadPage: function (newPageNum, loadOnly, bookmarkID, paramList, flushCache) {
            var me = this;

            if (flushCache !== undefined && flushCache)
                me.flushCache();

            if (me.pages[newPageNum])
                if (me.pages[newPageNum].$container) {
                    if (!loadOnly) {
                        me._setPage(newPageNum);
                        me._cachePages(newPageNum);
                    }
                    return;
                }
            if (!paramList) paramList = "";

            if (!loadOnly) {
                me._addLoadingIndicator();
            }
            me.togglePageNum = newPageNum;
            me.lock = 1;
            $.getJSON(me.options.reportViewerAPI + "/ReportJSON/", {
                ReportPath: me.options.reportPath,
                SessionID: me.sessionID,
                PageNumber: newPageNum,
                ParameterList: paramList
            })
            .done(function (data) {
                me._writePage(data, newPageNum, loadOnly);
                me.lock = 0;
                if (bookmarkID)
                    me._navToLink(bookmarkID);

                if (!loadOnly) me._cachePages(newPageNum);
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
            if (data.ReportContainer.NumPages === undefined)
                me.numPages = 0;
            else
                me.numPages = data.ReportContainer.NumPages;

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
            $(document).scrollTop($("#" + elementID).offset().top - 85);
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

        allTools: {},

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
         *  selectorClass: "fr-button-menu",
         *  imageClass: "fr-image-menu",
         *  events: {
         *      click: function (e) {
         *          e.data.me._trigger(events.menuClick, null, {});
         *      }
         *  }
         * };
         * 
         * this.element.html("<div class='" + me.options.toolClass + "'/>");
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

            me.allTools[tools[0].selectorClass] = tools[0];
            if (tools[0].toolType === toolTypes.toolGroup && tools[0].tools) {
                me._addChildTools($firstTool, 1, enabled, tools[0].tools);      // Add the children of a tool group
            }

            var $tool = $firstTool;
            for (var i = 1; i < tools.length; i++) {
                var toolInfo = tools[i];
                $tool.after(me._getToolHtml(toolInfo));
                $tool = $tool.next();
                me.allTools[toolInfo.selectorClass] = toolInfo;

                if (toolInfo.toolType === toolTypes.toolGroup && toolInfo.tools) {
                    me._addChildTools($tool, 1, enabled, toolInfo.tools);      // Add the children of a tool group
                }
            }
        },
        /**
         * Make all tools hidden
         * @function $.forerunner.toolBase#hideTools
         */
        hideTools: function (){
            var me = this;

            $.each(me.allTools, function (Index, Obj) {
                if (Obj.selectorClass) {
                    var $toolEl = $("." + Obj.selectorClass, me.element);
                    Obj.Display = $toolEl.is(":visible");
                    $toolEl.fadeOut();
                }
            });

        },
        /**
         * Make all tools visible
         * @function $.forerunner.toolBase#showTools
         */
        showTools: function () {
            var me = this;

            $.each(me.allTools, function (Index, Obj) {
                if (Obj.selectorClass) {
                    var $toolEl = $("." + Obj.selectorClass, me.element);
                    if (Obj.Display)
                        $toolEl.fadeIn();
                }
            });

        },
        /**
         * Enable the given tools
         * @function $.forerunner.toolBase#enableTools
         * @param {Array} tools - Array of tools to enable
         */
        enableTools: function (tools) {
            var me = this;
            $.each(tools, function (index, toolInfo) {
                var $toolEl = $("." + toolInfo.selectorClass, me.element);
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
            $.each(tools, function (index, toolInfo) {
                var $toolEl = $("." + toolInfo.selectorClass, me.element);
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
        _getToolHtml: function (toolInfo) {
            var me = this;
            if (toolInfo.toolType === toolTypes.button) {
                return "<div class='fr-toolbase-toolcontainer fr-toolbase-state " + toolInfo.selectorClass + "'>" +
                            "<div class='fr-toolbase-icon " + toolInfo.imageClass + "' />" +
                        "</div>";
            }
            else if (toolInfo.toolType === toolTypes.input) {
                var type = "";
                if (toolInfo.inputType) {
                    type = ", type='" + toolInfo.inputType + "'";
                }
                return "<input class='" + toolInfo.selectorClass + "'" + type + " />";
            }
            else if (toolInfo.toolType === toolTypes.textButton) {
                return "<div class='fr-toolbase-toolcontainer fr-toolbase-state " + toolInfo.selectorClass + "'>" + me._getText(toolInfo) + "</div>";
            }
            else if (toolInfo.toolType === toolTypes.plainText) {
                return "<span class='" + toolInfo.selectorClass + "'> " + me._getText(toolInfo) + "</span>";
                }
            else if (toolInfo.toolType === toolTypes.containerItem) {
                var text = "";
                if (toolInfo.text) {
                    text = me._getText(toolInfo);
                }
                return "<div class='fr-toolbase-itemcontainer fr-toolbase-state " + toolInfo.selectorClass + "'>" +
                            "<div class='fr-toolbase-icon " + toolInfo.imageClass + "' />" +
                            text +
                        "</div>";
            }
            else if (toolInfo.toolType === toolTypes.toolGroup) {
                return "<div class='fr-toolbase-groupcontainer " + toolInfo.selectorClass + "'></div>";
            }
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
        _destroy: function () {
        },

        _create: function () {
           
        },
    });  // $.widget
});  // function()

///#source 1 1 /Forerunner/ReportViewer/js/Toolbar.js
// Assign or create the single globally scoped variable
// Assign or create the single globally scoped variable
var forerunner = forerunner || {};

// Forerunner SQL Server Reports
forerunner.ssr = forerunner.ssr || {};

$(function () {
    var widgets = forerunner.ssr.constants.widgets;
    var events = forerunner.ssr.constants.events;
    var toolTypes = forerunner.ssr.constants.toolTypes;
    var locData = forerunner.localize.getLocData(forerunner.init.forerunnerFolder + "/ReportViewer/loc/ReportViewer");

    // Tool Info data
    var btnReportBack = {
        toolType: toolTypes.button,
        selectorClass: "fr-button-reportback",
        imageClass: "fr-image-reportback",
        events: {
            click: function (e) {
                e.data.$reportViewer.reportViewer("back");
            }
        }
    };
    var btnMenu = {
        toolType: toolTypes.button,
        selectorClass: "fr-button-menu",
        imageClass: "fr-image-menu",
        events: {
            click: function (e) {
                e.data.me._trigger(events.menuClick, null, {});
            }
        }
    };
    var btnNav = {
        toolType: toolTypes.button,
        selectorClass: "fr-button-nav",
        imageClass: "fr-image-nav",
        events: {
            click: function (e) {
                e.data.$reportViewer.reportViewer("showNav");
            }
        }
    };
    var btnParamarea = {
        toolType: toolTypes.button,
        selectorClass: "fr-button-paramarea",
        imageClass: "fr-image-paramarea",
        events: {
            click: function (e) {
                e.data.me._trigger(events.paramAreaClick, null, {});
            }
        }
    };
   
    var btnRefresh = {
        toolType: toolTypes.button,
        selectorClass: "fr-button-refresh",
        imageClass: "fr-image-refresh",
        events: {
            click: function (e) {
                e.data.$reportViewer.reportViewer("refreshReport");
            }
        }
    };
    var btnFirstPage = {
        toolType: toolTypes.button,
        selectorClass: "fr-button-firstpage",
        imageClass: "fr-image-firstpage",
        events: {
            click: function (e) {
                e.data.$reportViewer.reportViewer("navToPage", 1);
            }
        }
    };
    var btnPrev = {
        toolType: toolTypes.button,
        selectorClass: "fr-button-prev",
        imageClass: "fr-image-prev",
        events: {
            click: function (e) {
                e.data.$reportViewer.reportViewer("navToPage", e.data.$reportViewer.reportViewer("getCurPage") - 1);
            }
        }
    };
    var btnReportPage = {
        toolType: toolTypes.input,
        selectorClass: "fr-toolbar-reportpage-textbox",
        inputType: "number",
        events: {
            keypress: function (e) {
                if (e.keyCode === 13) {
                    e.data.$reportViewer.reportViewer("navToPage", this.value);
                }
            },
            click: function (e) {
                e.target.select();
            }
        }
    };
    var btnPageOf = {
        toolType: toolTypes.plainText,
        selectorClass: "fr-pageOf",
        text: locData.toolbar.pageOf
    };
    var btnNumPages = {
        toolType: toolTypes.plainText,
        selectorClass: "fr-num-pages",
        text: "0"
    };
    var btnNext = {
        toolType: toolTypes.button,
        selectorClass: "fr-button-next",
        imageClass: "fr-image-next",
        events: {
            click: function (e) {
                e.data.$reportViewer.reportViewer("navToPage", e.data.$reportViewer.reportViewer("getCurPage") + 1);
            }
        }
    };
    var btnLastPage = {
        toolType: toolTypes.button,
        selectorClass: "fr-button-lastpage",
        imageClass: "fr-image-lastpage",
        events: {
            click: function (e) {
                e.data.$reportViewer.reportViewer("navToPage", e.data.$reportViewer.reportViewer("getNumPages"));
            }
        }
    };
    var btnVCRGroup = {
        toolType: toolTypes.toolGroup,
        selectorClass: "fr-btn-VCRgroup-id",
        tools: [btnFirstPage, btnPrev, btnReportPage, btnPageOf, btnNumPages, btnNext, btnLastPage]
    };
    var btnDocumentMap = {
        toolType: toolTypes.button,
        selectorClass: "fr-button-documentmap",
        imageClass: "fr-image-documentmap",
        events: {
            click: function (e) {
                e.data.$reportViewer.reportViewer("showDocMap");
            }
        }
    };
    var btnKeyword = {
        toolType: toolTypes.input,
        selectorClass: "fr-textbox-keyword",
        events: {
            keypress: function (e) {
                if (e.keyCode === 13) {
                    e.data.$reportViewer.reportViewer("find", $.trim(this.value));
                }
            }
        }
    };
    var btnFind = {
        toolType: toolTypes.plainText,
        selectorClass: "fr-button-find",
        text: locData.toolbar.find,
        events: {
            click: function (e) {
                var value = $.trim(e.data.me.element.find(".fr-textbox-keyword").val());
                e.data.$reportViewer.reportViewer("find", value);
            }
        }
    };
    var btnSeparator = {
        toolType: toolTypes.plainText,
        selectorClass: "fr-span-sparator",
        text: "|&nbsp"
    };
    var btnFindNext = {
        toolType: toolTypes.plainText,
        selectorClass: "fr-button-findnext",
        text: locData.toolbar.next,
        events: {
            click: function (e) {
                var value = $.trim(e.data.me.element.find(".fr-textbox-keyword").val());
                e.data.$reportViewer.reportViewer("findNext", value);
            }
        }
    };
    var btnSeparator2 = {
        toolType: toolTypes.plainText,
        selectorClass: "fr-span-sparator",
        text: "|&nbsp"
    };
    var btnExport = {
        toolType: toolTypes.plainText,
        selectorClass: "fr-button-export",
        //imageClass: "fr-image-export",
        text: locData.toolbar.exportMenu,
        events: {
            click: function (e) {
                e.data.$reportViewer.reportViewer("showExport");
            }
        }
    };
    var btnFindGroup = {
        toolType: toolTypes.toolGroup,
        selectorClass: "fr-toolbar-findgroup-id",
        tools: [btnKeyword, btnFind, btnSeparator, btnFindNext]
    };

    // Toolbar widget
    $.widget(widgets.getFullname(widgets.toolbar), $.forerunner.toolBase, {
        options: {
            $reportViewer: null,
            toolClass: "fr-toolbar"
        },
        _initCallbacks: function () {
            var me = this;

            // Hook up any / all custom events that the report viewer may trigger
            me.options.$reportViewer.on(events.reportViewerChangePage(), function (e, data) {
                $("input.fr-toolbar-reportpage-textbox", me.$el).val(data.newPageNum);
                var maxNumPages = me.options.$reportViewer.reportViewer("getNumPages");
                me._updateBtnStates(data.newPageNum, maxNumPages);
                
                if (data.paramLoaded === false)
                    me.disableTools([btnParamarea]);
               
            });

            me.options.$reportViewer.on(events.reportViewerDrillBack(), function (e, data) {
                me._clearBtnStates();
            });

            me.options.$reportViewer.on(events.reportViewerShowParamArea(), function (e, data) {
                me.enableTools([btnParamarea]);
            });

            // Hook up the toolbar element events
            me.enableTools([btnMenu, btnParamarea, btnNav, btnReportBack,
                               btnRefresh, btnFirstPage, btnPrev, btnNext,
                               btnLastPage, btnDocumentMap, btnFind, btnFindNext]);
        },
        _init: function () {
            var me = this;

            // TODO [jont]
            //
            ///////////////////////////////////////////////////////////////////////////////////////////////
            //// if me.element contains or a a child contains the options.toolClass don't replace the html
            ///////////////////////////////////////////////////////////////////////////////////////////////

            me.element.html("<div class='" + me.options.toolClass + "'/>");
            me.addTools(1, true, [btnMenu, btnReportBack, btnNav, btnRefresh, btnVCRGroup, btnDocumentMap, btnFindGroup, btnSeparator2, btnExport, btnParamarea]);
            if (me.options.$reportViewer) {
                me._initCallbacks();
            }
        },
        _updateBtnStates: function (curPage, maxPage) {
            var me = this;

            me.element.find(".fr-num-pages").html(maxPage);
            me.element.find(".fr-toolbar-reportpage-textbox").attr({ max: maxPage, min: 1 });

            if (me.options.$reportViewer.reportViewer("getHasDocMap"))
                me.enableTools([btnDocumentMap]);
            else
                me.disableTools([btnDocumentMap]);

            if (curPage <= 1) {
                me.disableTools([btnPrev, btnFirstPage]);
            }
            else {
                me.enableTools([btnPrev, btnFirstPage]);
            }

            if (curPage >= maxPage) {
                me.disableTools([btnNext, btnLastPage]);
            }
            else {
                me.enableTools([btnNext, btnLastPage]);
            }
            if (maxPage ===1 )
                me.disableTools([btnNav]);
            else
                me.enableTools([btnNav]);
        },
        _clearBtnStates: function () {
            var me = this;
            me.element.find(".fr-textbox-keyword").val("");
        },
        _destroy: function () {
        },

        _create: function () {
            var me = this;
        },
    });  // $.widget
});  // function()

///#source 1 1 /Forerunner/ReportViewer/js/ToolPane.js
// Assign or create the single globally scoped variable
var forerunner = forerunner || {};

// Forerunner SQL Server Reports
forerunner.ssr = forerunner.ssr || {};

$(function () {
    var widgets = forerunner.ssr.constants.widgets;
    var events = forerunner.ssr.constants.events;
    var toolTypes = forerunner.ssr.constants.toolTypes;
    var locData = forerunner.localize.getLocData( forerunner.init.forerunnerFolder + "/ReportViewer/loc/ReportViewer");

    // Tool Info data
    var itemNav = {
        toolType: toolTypes.containerItem,
        selectorClass: "fr-id-nav",
        imageClass: "fr-image-nav",
        text: locData.toolPane.navigation,
        events: {
            click: function (e) {
                e.data.$reportViewer.reportViewer("showNav");
                e.data.me._trigger(events.actionStarted, null, e.data.me.allTools["fr-id-nav"]);
            }
        }
    };
    var itemReportBack = {
        toolType: toolTypes.containerItem,
        selectorClass: "fr-id-reportback",
        imageClass: "fr-image-reportback",
        text: locData.toolPane.back,
        events: {
            click: function (e) {
                e.data.$reportViewer.reportViewer("back");
                e.data.me._trigger(events.actionStarted, null, e.data.me.allTools["fr-id-reportback"]);
            }
        }
    };
    var itemRefresh = {
        toolType: toolTypes.containerItem,
        selectorClass: "fr-id-refresh",
        imageClass: "fr-image-refresh",
        text: locData.toolPane.refresh,
        events: {
            click: function (e) {
                e.data.$reportViewer.reportViewer("refreshReport");
                e.data.me._trigger(events.actionStarted, null, e.data.me.allTools["fr-id-refresh"]);
            }
        }
    };
    var itemFirstPage = {
        toolType: toolTypes.button,
        selectorClass: "fr-id-firstpage",
        imageClass: "fr-image-firstpage",
        events: {
            click: function (e) {
                e.data.$reportViewer.reportViewer("navToPage", 1);
                e.data.me._trigger(events.actionStarted, null, e.data.me.allTools["fr-id-firstpage"]);
            }
        }
    };
    var itemPrev = {
        toolType: toolTypes.button,
        selectorClass: "fr-id-prev",
        imageClass: "fr-image-prev",
        events: {
            click: function (e) {
                e.data.$reportViewer.reportViewer("navToPage", e.data.$reportViewer.reportViewer("getCurPage") - 1);
                e.data.me._trigger(events.actionStarted, null, e.data.me.allTools["fr-id-prev"]);
            }
        }
    };
    var itemReportPage = {
        toolType: toolTypes.input,
        selectorClass: "fr-item-textbox-reportpage",
        inputType: "number",
        events: {
            keypress: function (e) {
                if (e.keyCode === 13) {
                    e.data.$reportViewer.reportViewer("navToPage", this.value);
                }
            }
        }
    };
    var itemPageOf = {
        toolType: toolTypes.plainText,
        selectorClass: "fr-pageOf",
        text: locData.toolPane.pageOf
    };
    var itemNumPages = {
        toolType: toolTypes.plainText,
        selectorClass: "fr-num-pages",
        text: ""
    };
    var itemNext = {
        toolType: toolTypes.button,
        selectorClass: "fr-id-next",
        imageClass: "fr-image-next",
        events: {
            click: function (e) {
                e.data.$reportViewer.reportViewer("navToPage", e.data.$reportViewer.reportViewer("getCurPage") + 1);
                e.data.me._trigger(events.actionStarted, null, e.data.me.allTools["fr-id-next"]);
            }
        }
    };
    var itemLastPage = {
        toolType: toolTypes.button,
        selectorClass: "fr-id-lastpage",
        imageClass: "fr-image-lastpage",
        events: {
            click: function (e) {
                e.data.$reportViewer.reportViewer("navToPage", e.data.$reportViewer.reportViewer("getNumPages"));
                e.data.me._trigger(events.actionStarted, null, e.data.me.allTools["fr-id-lastpage"]);
            }
        }
    };
    var itemVCRGroup = {
        toolType: toolTypes.toolGroup,
        selectorClass: "fr-item-VCRgroup",
        tools: [itemFirstPage, itemPrev, itemReportPage, itemPageOf, itemNumPages, itemNext, itemLastPage]
    };
    var itemDocumentMap = {
        toolType: toolTypes.containerItem,
        selectorClass: "fr-id-documentmap",
        imageClass: "fr-image-documentmap",
        text: locData.toolPane.docMap,
        events: {
            click: function (e) {
                e.data.$reportViewer.reportViewer("showDocMap");
                e.data.me._trigger(events.actionStarted, null, e.data.me.allTools["fr-id-documentmap"]);
            }
        }
    };
    var itemKeyword = {
        toolType: toolTypes.input,
        selectorClass: "fr-item-textbox-keyword",
        events: {
            keypress: function (e) {
                if (e.keyCode === 13) {
                    e.data.$reportViewer.reportViewer("find", $.trim(this.value));
                    e.data.me._trigger(events.actionStarted, null, e.data.me.allTools["fr-item-find"]);
                }
            }
        }
    };
    var itemFind = {
        toolType: toolTypes.textButton,
        selectorClass: "fr-item-find",
        text: locData.toolPane.find,
        events: {
            click: function (e) {
                var value = $.trim(e.data.me.element.find(".fr-item-textbox-keyword").val());
                e.data.$reportViewer.reportViewer("find", value);
                e.data.me._trigger(events.actionStarted, null, e.data.me.allTools["fr-item-find"]);
            }
        }
    };
    var itemSeparator = {
        toolType: toolTypes.plainText,
        selectorClass: "fr-item-span-sparator",
        text: "|&nbsp"
    };
    var itemFindNext = {
        toolType: toolTypes.textButton,
        selectorClass: "fr-item-findnext",
        text: locData.toolPane.next,
        events: {
            click: function (e) {
                var value = $.trim(e.data.me.element.find(".fr-item-textbox-keyword").val());
                e.data.$reportViewer.reportViewer("findNext", value);
                e.data.me._trigger(events.actionStarted, null, e.data.me.allTools["fr-item-findnext"]);
            }
        }
    };
    var itemFindGroup = {
        toolType: toolTypes.toolGroup,
        selectorClass: "fr-item-findgroup",
        tools: [itemKeyword, itemFind, itemSeparator, itemFindNext]
    };

    // Toolbar widget
    $.widget(widgets.getFullname(widgets.toolPane), $.forerunner.toolBase, {
        options: {
            $reportViewer: null,
            toolClass: "fr-toolpane"
        },
        _initCallbacks: function () {
            var me = this;

            // Hook up any / all custom events that the report viewer may trigger
            me.options.$reportViewer.on(events.reportViewerChangePage(), function (e, data) {
                $("input.fr-item-textbox-reportpage", me.$el).val(data.newPageNum);
                var maxNumPages = me.options.$reportViewer.reportViewer("getNumPages");
                me._updateItemStates(data.newPageNum, maxNumPages);
                
            });

            me.options.$reportViewer.on(events.reportViewerDrillBack(), function (e, data) {
                me._clearItemStates();
            });

            // Hook up the toolbar element events
            me.enableTools([itemFirstPage, itemPrev, itemNext, itemLastPage, itemNav,
                            itemReportBack, itemRefresh, itemDocumentMap, itemFind, itemFindNext]);
        },
        _init: function () {
            var me = this;
            // TODO [jont]
            //
            ///////////////////////////////////////////////////////////////////////////////////////////////
            //// if me.element contains or a a child contains the options.toolClass don"t replace the html
            ///////////////////////////////////////////////////////////////////////////////////////////////

            me.element.html("<div class='" + me.options.toolClass + "'/>");
            me.addTools(1, true, [itemVCRGroup, itemNav, itemReportBack, itemRefresh, itemDocumentMap, itemFindGroup]);

            if (me.options.$reportViewer) {
                me._initCallbacks();
            }
        },
        _updateItemStates: function (curPage, maxPage) {
            var me = this;
            me.element.find(".fr-num-pages").html(maxPage);
            me.element.find(".fr-item-textbox-reportpage").attr({ max: maxPage, min: 1 });

            me.options.$reportViewer.reportViewer("getNumPages", curPage);
            if (me.options.$reportViewer.reportViewer("getHasDocMap"))
                me.enableTools([itemDocumentMap]);
            else
                me.disableTools([itemDocumentMap]);

            if (curPage > 1) {
                me.enableTools([itemPrev, itemFirstPage]);
            }
            else {
                me.disableTools([itemPrev, itemFirstPage]);
            }

            if (curPage < maxPage) {
                me.enableTools([itemNext, itemLastPage]);
            }
            else {
                me.disableTools([itemNext, itemLastPage]);
            }
            if (maxPage === 1)
                me.disableTools([itemNav]);
            else
                me.enableTools([itemNav]);
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
                me.listItems[me.currentPageNum - 1].removeClass("fr-nav-selected");
            }

            me.currentPageNum = currentPageNum;
            me._ScrolltoPage();
            me.listItems[me.currentPageNum - 1].addClass("fr-nav-selected");
        },
        _ScrolltoPage: function () {
            var me = this;

            if (me.currentPageNum && !forerunner.device.isElementInViewport(me.listItems[me.currentPageNum - 1].get(0))) {
                var left = me.$ul.scrollLeft() + me.listItems[me.currentPageNum - 1].position().left
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
// Assign or create the single globally scoped variable
var forerunner = forerunner || {};

// Forerunner SQL Server Reports
forerunner.ssr = forerunner.ssr || {};

$(function () {
    var toolTypes = forerunner.ssr.constants.toolTypes;
    var widgets = forerunner.ssr.constants.widgets;

    // Toolbar widget
    $.widget(widgets.getFullname(widgets.reportExplorerToolbar), $.forerunner.toolBase, {
        options: {
            navigateTo: null,
            toolClass: "fr-toolbar"
        },
        // Button Info
        btnHome: {
            toolType: toolTypes.button,
            selectorClass: "fr-rm-button-home",
            imageClass: "fr-image-home",
            events: {
                click: function (e) {
                    e.data.me.options.navigateTo("home", null);
                }
            }
        },
        btnBack: {
            toolType: toolTypes.button,
            selectorClass: "fr-button-back",
            imageClass: "fr-image-back",
            events: {
                click: function (e) {
                    e.data.me.options.navigateTo("back", null);
                }
            }
        },
        btnFav: {
            toolType: toolTypes.button,
            selectorClass: "fr-rm-button-fav",
            imageClass: "fr-image-fav",
            events: {
                click: function (e) {
                    e.data.me.options.navigateTo("favorites", null);
                }
            }
        },
        btnRecent: {
            toolType: toolTypes.button,
            selectorClass: "fr-rm-button-recent",
            imageClass: "fr-image-recent",
            events: {
                click: function (e) {
                    e.data.me.options.navigateTo("recent", null);
                }
            }
        },
        

        _initCallbacks: function () {
            var me = this;
            // Hook up any / all custom events that the report viewer may trigger

            // Hook up the toolbar element events
            me.enableTools([me.btnHome, me.btnBack, me.btnFav, me.btnRecent]);
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
            me.addTools(1, true, [me.btnBack, me.btnHome, me.btnFav, me.btnRecent]);
            me._initCallbacks();
        },

        _destroy: function () {
        },

        _create: function () {
            var me = this;
        },
    });  // $.widget
});  // function()

///#source 1 1 /Forerunner/ReportExplorer/js/ReportExplorer.js
// Assign or create the single globally scoped variable
var forerunner = forerunner || {};

// Forerunner SQL Server Reports
forerunner.ssr = forerunner.ssr || {};

$(function () {
    var widgets = forerunner.ssr.constants.widgets;

    $.widget(widgets.getFullname(widgets.reportExplorer), {
        options: {
            reportManagerAPI: "../api/ReportManager",
            forerunnerPath: "../forerunner",
            path: null,
            view: null,
            selectedItemPath: null,
            $scrollBarOwner: null,
            navigateTo: null
        },
        _generatePCListItem: function (catalogItem, isSelected) {
            var me = this; 
            var reportThumbnailPath = me.options.reportManagerAPI
              + "/GetThumbnail/?ReportPath=" + catalogItem.Path + "&DefDate=" + catalogItem.ModifiedDate;
            var $item = new $("<div />");
            if (isSelected) {
                $item.addClass("fr-explorer-item-selected");
                me.$selectedItem = $item;
            }
            $item.addClass("fr-explorer-item");            
            var $caption = new $("<div />");
            $caption.addClass("fr-explorer-item-center");
            $item.append($caption);
            var $captiontext = new $("<h3 />");
            $captiontext.addClass("fr-explorer-item-centertext");
            $captiontext.html(catalogItem.Name);
            $caption.append($captiontext);
            var $imageblock = new $("<div />");
            $imageblock.addClass("fr-report-item-image-block");
            $item.append($imageblock);
            var imageSrc;
            var $anchor = new $("<a />");
            var $img = new $("<img />");
            $img.addClass("fr-explorer-item-width");
            $img.addClass("fr-explorer-item-center");            
            if (catalogItem.Type === 1) 
                imageSrc = me.options.forerunnerPath + "/ReportExplorer/images/folder-icon.png";
            else                
                imageSrc = reportThumbnailPath;            

            var action = catalogItem.Type === 1 ? "explore" : "browse";
            $img.attr("src", imageSrc);
            $img.error(function () {
                $(this).attr("src", me.options.forerunnerPath + "/ReportExplorer/images/Report-icon.png");
            });
            $img.removeAttr("height"); //JQuery adds height for IE8, remove.
            $anchor.on("click", function (event) {
                if (me.options.navigateTo) {
                    me.options.navigateTo(action, catalogItem.Path);
                }
            });
            var $reflection = new $("<div />");
            $reflection.addClass("fr-report-item-reflection");
            var $reflImg = $img.clone();
            $reflImg.addClass("fr-report-item-reflection");
            $reflImg.error(function () {
                $(this).attr("src", me.options.forerunnerPath + "/ReportExplorer/images/Report-icon.png");
            });
            $reflection.append($reflImg);

            $anchor.append($img);
            $anchor.append($reflection);
            $imageblock.append($anchor);
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
                $(window).scrollTop(me.$selectedItem.offset().top - 50);  //This is a hack for now
                $(window).scrollLeft(me.$selectedItem.offset().left - 20);  //This is a hack for now
            }
            //me._initscrollposition();
        },
        _setSelectionFromScroll: function () {
            var me = this;
            var position = me.$explorer.scrollTop();
            var closest = 0;
            var lastDistance = 0;
            var closestDistance = Math.abs(position - me.rmListItems[0].position().top);
            for (var i = 1; i < me.rmListItems.length; i++) {
                var distance = Math.abs(position - me.rmListItems[i].position().top);
                if (distance < closestDistance) {
                    closest = i;
                    closestDistance = distance;
                } else if (lastDistance !== 0 && distance > lastDistance) {
                    // If closetst is no longer 0 and we are no longer approaching the closest break
                    break;
                }
                lastDistance = distance;
            }
            me.selectedItem = closest;
        },

        _fetch: function (view,path) {
            var me = this;
            $.ajax({
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
                    alert("Failed to load the catalogs from the server.  Please try again.");
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
        }
    });  // $.widget
});  // function()
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
        },
        // Constructor
        _create: function () {
            
        },

        render: function (reportObj) {
            var me = this;
            var reportDiv = me.element;
            var reportViewer = me.options.reportViewer;
            

            me._writeExportPanel();

            reportDiv.attr("Style", me._getStyle(reportViewer, reportObj.ReportContainer.Report.PageContent.PageStyle));
            $.each(reportObj.ReportContainer.Report.PageContent.Sections, function (Index, Obj) { me._writeSection(new reportItemContext(reportViewer, Obj, Index, reportObj.ReportContainer.Report.PageContent, reportDiv, "")); });
        },
        writeError: function (errorData) {
            var me = this;
            //var errorTag = forerunner.ssr.constants.errorTag;
            var errorTag = me.options.reportViewer.locData.errorTag;

            me.element.html($(
                "<div class='fr-render-error-message'></div>" +
                "<div class='fr-render-error-details'>" + errorTag.moreDetail + "</div>" +
                "<div class='fr-render-error'><h3>" + errorTag.serverError + "</h3>" +
                "<div class='fr-render-error fr-render-error-type'></div>" +
                "<div class='fr-render-error fr-render-error-targetsite'></div>" +
                "<div class='fr-render-error fr-render-error-source'></div>" +
                "<div class='fr-render-error fr-render-error-stacktrace'></div>" +
                "</div>"));

            if (me.options.reportViewer) {
                var $cell;

                $cell = me.element.find(".fr-render-error");
                $cell.hide();

                $cell = me.element.find(".fr-render-error-details");
                $cell.on("click", { $Detail: me.element.find(".fr-render-error") }, function (e) { e.data.$Detail.show(); $(e.target).hide(); });

                $cell = me.element.find(".fr-render-error-type");
                $cell.append("<h4>" + errorTag.type + ":</h4>" + errorData.Exception.Type);

                $cell = me.element.find(".fr-render-error-targetsite");
                $cell.html("<h4>" + errorTag.targetSite + ":</h4>" + errorData.Exception.TargetSite);

                $cell = me.element.find(".fr-render-error-source");
                $cell.html("<h4>" + errorTag.source + ":</h4>" + errorData.Exception.Source);

                $cell = me.element.find(".fr-render-error-message");
                $cell.html("<h4>" + errorTag.message + ":</h4>" + errorData.Exception.Message);

                $cell = me.element.find(".fr-render-error-stacktrace");
                $cell.html("<h4>" + errorTag.stackTrace + ":</h4>" + errorData.Exception.StackTrace);
            }
        },

        _writeSection: function (RIContext) {
            var me = this;
            var $newObj = me._getDefaultHTMLTable();
            var $sec = $("<TR/>");
            var location = me._getMeasurmentsObj(RIContext.CurrObjParent, RIContext.CurrObjIndex);

            //Need to determine Header and footer Index
            var headerIndex;
            var footerIndex;
            if (RIContext.CurrObj.PageFooter) {
                footerIndex = RIContext.CurrObj.Columns.length;
                headerIndex = footerIndex + 1;
            }
            else
                headerIndex = RIContext.CurrObj.Columns.length;


            //Page Header
            if (RIContext.CurrObj.PageHeader) {
                var $header = $("<TR/>");
                var $headerTD = $("<TD/>");
                $header.append($headerTD);
                var headerLoc = me._getMeasurmentsObj(RIContext.CurrObj, headerIndex);
                $header.attr("Style", "width:" + headerLoc.Width + "mm;");
                $headerTD.append(me._writeRectangle(new reportItemContext(RIContext.RS, RIContext.CurrObj.PageHeader, headerIndex, RIContext.CurrObj, new $("<DIV/>"), null, headerLoc)));
                $newObj.append($header);
            }
            
            $sec.attr("Style", "width:" + location.Width + "mm;");
            //Columns
            $newObj.append($sec);
            $.each(RIContext.CurrObj.Columns, function (index, obj) {
                var $col = new $("<TD/>");
                $col.append(me._writeRectangle(new reportItemContext(RIContext.RS, obj, index, RIContext.CurrObj, new $("<Div/>"), null, location)));
                $sec.append($col);
            });

            //Page Footer
            if (RIContext.CurrObj.PageFooter) {
                var $footer = $("<TR/>");
                var $footerTD = $("<TD/>");
                $footer.append($footerTD);
                var footerLoc = me._getMeasurmentsObj(RIContext.CurrObj, footerIndex);
                $footer.attr("Style", "width:" + footerLoc.Width + "mm;");
                $footerTD.append(me._writeRectangle(new reportItemContext(RIContext.RS, RIContext.CurrObj.PageFooter, footerIndex, RIContext.CurrObj, new $("<DIV/>"), "", footerLoc)));
                $newObj.append($footer);
            }


            RIContext.$HTMLParent.append($newObj);
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
                Style += "position:absolute;top:" + RecLayout.ReportItems[Index].NewTop + "mm;left:" + Measurements[Index].Left + "mm;";

                //Background color and border go on container
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
                Style += "width:" + RIContext.CurrLocation.Width + "mm;";
                if (RIContext.CurrObj.ReportItems.length === 0)
                    Style += "height:" + RIContext.CurrLocation.Height + "mm;";
                else {
                    var parentHeight = parseFloat(RecLayout.ReportItems[RecLayout.LowestIndex].NewTop) + parseFloat(RecLayout.ReportItems[RecLayout.LowestIndex].NewHeight) + (parseFloat(RIContext.CurrLocation.Height) - (parseFloat(Measurements[RecLayout.LowestIndex].Top) + parseFloat(Measurements[RecLayout.LowestIndex].Height)));
                    Style += "height:" + parentHeight + "mm;";
                }
        
            }
            RIContext.$HTMLParent.attr("Style", Style);

            return RIContext.$HTMLParent;
        },
        _getRectangleLayout: function (Measurements) {
            var l = new layout();
            var me = this;

            $.each(Measurements, function (Index, Obj) {
                l.ReportItems[Index] = new reportItemLocation(Index);
                var curRI = l.ReportItems[Index];

                if (me.isNull(l.LowestIndex))
                    l.LowestIndex = Index;
                else if (Obj.Top + Obj.Height > Measurements[l.LowestIndex].Top + Measurements[l.LowestIndex].Height)
                    l.LowestIndex = Index;

                for (var i = 0; i < Measurements.length; i++) {
                    var bottom =  Measurements[i].Top + Measurements[i].Height;
                    //var right = Measurements[i].Left + Measurements[i].Width;
                    if ((Obj.Top > bottom) //&& (
                        //    ((Obj.Left > Measurements[i].Left) && (Obj.Left < right)) ||
                        //     ((Obj.Left + Obj.Width > Measurements[i].Left) && (Obj.Left + Obj.Width < right)) ||
                        //     ((Obj.Left < Measurements[i].Left) && (Obj.Left + Obj.Width > right))
                        // )
                        )
            
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
    
            return l;
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

                $Sort.on("click", { Viewer:  RIContext.RS, SortID: RIContext.CurrObj.Elements.NonSharedElements.UniqueName, Direction: Direction }, function (e) { e.data.Viewer.sort(e.data.Direction, e.data.SortID); });
                RIContext.$HTMLParent.append($Sort);
            }
            me._writeActions(RIContext, RIContext.CurrObj.Elements.NonSharedElements, $TextObj);

            Style = "display: table-cell;white-space:pre-wrap;word-break:break-word;word-wrap:break-word;";
            Style += me._getElementsTextStyle(RIContext.CurrObj.Elements);
            $TextObj.attr("Style", Style);

            if (RIContext.CurrObj.Paragraphs.length === 0) {
                if (RIContext.CurrObj.Elements.SharedElements.Value)
                    $TextObj.html(RIContext.CurrObj.Elements.SharedElements.Value);
                else if (RIContext.CurrObj.Elements.NonSharedElements.Value)
                    $TextObj.html(RIContext.CurrObj.Elements.NonSharedElements.Value);
                else
                    $TextObj.html("&nbsp");
            }
            else {
                //Handle each paragraphs
                var LowIndex = null;
                var ParentName = {};
                var ParagraphContainer = {};
                ParagraphContainer.Root = "";

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
                    Obj = Obj.Value;
                    if (Obj.Paragraph.SharedElements.ListStyle === 1) {
                        if (!$ParagraphList || !$ParagraphList.is("ol")) $ParagraphList = new $("<OL />");
                        $ParagraphList.addClass(me._getListStyle(1, Obj.Paragraph.SharedElements.ListLevel));

                        $ParagraphItem = new $("<LI />");
                    }
                    else if (Obj.Paragraph.SharedElements.ListStyle === 2) {
                        if (!$ParagraphList || !$ParagraphList.is("ul")) $ParagraphList = new $("<UL />");
                        $ParagraphList.addClass(me._getListStyle(2, Obj.Paragraph.SharedElements.ListLevel));

                        $ParagraphItem = new $("<LI />");
                    }
                    else {
                        if (!$ParagraphList || !$ParagraphList.is("div")) $ParagraphList = new $("<DIV />");
                        $ParagraphItem = new $("<DIV />");
                    }

                    var ParagraphStyle = "";
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
                            $TextRun.html(Obj.TextRuns[i].Elements.SharedElements.Value);
                        }
                        else if (Obj.TextRuns[i].Elements.NonSharedElements.Value && Obj.TextRuns[i].Elements.NonSharedElements.Value !== "") {
                            $TextRun.html(Obj.TextRuns[i].Elements.NonSharedElements.Value);
                        }
                        else {
                            $TextRun.html("&nbsp");
                            flag = false;
                        }

                        $TextRun.attr("Name", Obj.TextRuns[i].Elements.NonSharedElements.UniqueName);

                        if (flag) {
                            var TextRunStyle = "";
                            TextRunStyle += me._getMeasurements(me._getMeasurmentsObj(Obj.TextRuns[i], i));
                            TextRunStyle += me._getElementsStyle(RIContext.RS, Obj.TextRuns[i].Elements);
                            $TextRun.attr("Style", TextRunStyle);
                        }

                        $ParagraphItem.append($TextRun);
                    }
            
                    if (Paragraphs[Index + 1])
                        me._writeRichTextItem(RIContext, Paragraphs, Index + 1, Obj.Paragraph.NonSharedElements.UniqueName, $ParagraphItem);

                    $ParagraphList.append($ParagraphItem);
                    ParentContainer.append($ParagraphList);
                }
            }); 
        },
        _getImageURL: function (RS, ImageName) {
            var me = this;

            var Url = me.options.reportViewer.options.reportViewerAPI + "/GetImage/?";
            Url += "SessionID=" + me.options.reportViewer.sessionID;
            Url += "&ImageID=" + ImageName;
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
                me._writeActionImageMapAreas(RIContext, $(NewImage).width(), $(NewImage).height());
                var naturalSize = me._getNatural(this);
                
                me._resizeImage(this, sizingType, naturalSize.height, naturalSize.width, RIContext.CurrLocation.Height, RIContext.CurrLocation.Width);
            };
            NewImage.alt = me.options.reportViewer.locData.messages.imageNotDisplay;
            $(NewImage).attr("style", "display:block;" );

            NewImage.src = this._getImageURL(RIContext.RS, ImageName);

            this._writeActions(RIContext, RIContext.CurrObj.Elements.NonSharedElements, $(NewImage));
            this._writeBookMark(RIContext);
  
            RIContext.$HTMLParent.attr("style", Style);
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

            width = RIContext.CurrObj.ColumnWidths.Columns[ColIndex].Width;
            height = RIContext.CurrObj.RowHeights.Rows[RowIndex].Height;
            Style += "overflow:hidden;width:" + width + "mm;" + "max-width:" + width + "mm;"  + "height:" + height + "mm;";

            //Row and column span
            if (Obj.RowSpan !== undefined)
                $Cell.attr("rowspan", Obj.RowSpan);
            if (Obj.ColSpan !== undefined)
                $Cell.attr("colspan", Obj.ColSpan);

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
            var $FixedColHeader = new $("<DIV/>").css({ display: "table", position: "absolute", top: "0px", left: "0px",padding: "0",margin:"0", "border-collapse": "collapse"});
            var $FixedRowHeader = new $("<TABLE/>").css({ position: "absolute", top: "0px", left: "0px", padding: "0", margin: "0", "border-collapse": "collapse" });
            $FixedRowHeader.attr("CELLSPACING", 0);
            $FixedRowHeader.attr("CELLPADDING", 0);
            var LastObjType = "";
            var HasFixedRows = false;
            var HasFixedCols = false;
            

            Style += me._getMeasurements(me._getMeasurmentsObj(RIContext.CurrObjParent, RIContext.CurrObjIndex));
            Style += me._getElementsStyle(RIContext.RS, RIContext.CurrObj.Elements);
            $Tablix.attr("Style", Style);
    
            $Row = new $("<TR/>");
            $.each(RIContext.CurrObj.TablixRows, function (Index, Obj) {


                if (Obj.RowIndex !== LastRowIndex) {
                    $Tablix.append($Row);

                    //Handle fixed col header
                    if (RIContext.CurrObj.RowHeights.Rows[Obj.RowIndex - 1].FixRows === 1)
                        $FixedColHeader.append($Row.clone(true, true));

                    $Row = new $("<TR/>");
                    LastRowIndex = Obj.RowIndex;
                }

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
                    if (Obj.Cell) $Row.append(me._writeTablixCell(RIContext, Obj, Index));
                }
                LastObjType = Obj.Type;
            });
            $Tablix.append($Row);

            if (HasFixedRows) {
                $FixedColHeader.hide();
                // $Tablix.append($FixedColHeader);
            }
            else
                $FixedColHeader = null;

            if (HasFixedCols) {
                $FixedRowHeader.hide();
                //$Tablix.append($FixedRowHeader);
            }
            else
                $FixedRowHeader = null;

            var ret = $("<div style='position:relative'></div");
            ret.append($FixedColHeader);
            ret.append($FixedRowHeader);
            ret.append($Tablix);
            RIContext.RS.floatingHeaders.push(new floatingHeader(ret, $FixedColHeader, $FixedRowHeader));
            return ret;
        },
        _writeSubreport: function (RIContext) {
            var me = this;
            RIContext.Style += me._getElementsStyle(RIContext.RS, RIContext.CurrObj.SubReportProperties);
            RIContext.CurrObj = RIContext.CurrObj.BodyElements;
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
        _writeExportPanel: function () {
            var me = this;
            var $ExportPanel = $("<div class='fr-render-export-panel'></div>");
            var exportType = me.options.reportViewer.locData.exportType;

            var ExportList = [];
            ExportList.push({ Name: exportType.xml, Type: "XML" });
            ExportList.push({ Name: exportType.csv, Type: "CSV" });
            ExportList.push({ Name: exportType.pdf, Type: "PDF" });
            ExportList.push({ Name: exportType.mhtml, Type: "MHTML" });
            ExportList.push({ Name: exportType.excel, Type: "EXCELOPENXML" });
            ExportList.push({ Name: exportType.tiff, Type: "IMAGE" });
            ExportList.push({ Name: exportType.word, Type: "WORDOPENXML" });

            $.each(ExportList, function (Index, ExportObj) {
                $ExportPanel.append(me._getExportItem(ExportObj));
            });

            $(document).on("click", function (e) {
                if (!$(e.target).hasClass("fr-render-export-panel") && !$(e.target).hasClass("fr-button-export") && $ExportPanel.is(":visible")) {
                    $ExportPanel.toggle();
                }
            });

            $(".fr-button-export").filter(":visible").append($ExportPanel);
        },
        _getExportItem: function (ExportObj) {
            var me = this;
            var $ExportItem = $("<div class='fr-render-export-item'></div>");

            $ExportItem.hover(function () {
                $ExportItem.addClass("fr-render-export-hover");
            },
            function () {
                $ExportItem.removeClass("fr-render-export-hover");
            });

            var $ExportLink = $("<a class='fr-render-export-link' value='" + ExportObj.Type + "' href='javascript:void(0)'>" + ExportObj.Name + "</a>");
            $ExportLink.on("click", function () {
                me.options.reportViewer.exportReport(ExportObj.Type);
            });

            $ExportItem.append($ExportLink);
            return $ExportItem;
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
            height = $copiedElem.height() + "px";

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
                if (Obj.BorderStyle !== undefined)
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
                if (Obj.BorderStyle !== undefined)
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
        _getMeasurements: function (CurrObj, includeHeight) {
            var me = this;
            var Style = "";
            //TODO:  zIndex

            if (!CurrObj)
                return "";

            //Top and left are set in set location, height is not set becasue differnt browsers measure and break words differently
            if (CurrObj.Width !== undefined) {
                Style += "width:" + CurrObj.Width + "mm;";
                Style += "min-width:" + CurrObj.Width + "mm;";
                Style += "max-width:" + (CurrObj.Width) + "mm;";
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
            if (CurrObj.WritingMode !== undefined)
                Style += "layout-flow:" + me._getLayoutFlow(CurrObj.WritingMode) + ";";
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
            return ListStyle;
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
    });  // $.widget
});
///#source 1 1 /Forerunner/ReportViewer/js/ReportParameter.js
// Assign or create the single globally scoped variable
var forerunner = forerunner || {};

// Forerunner SQL Server Reports
forerunner.ssr = forerunner.ssr || {};

$(function () {
    var widgets = forerunner.ssr.constants.widgets;
    var events = forerunner.ssr.constants.events;
    var paramContainerClass = "fr-param-container";

    $.widget(widgets.getFullname(widgets.reportParameter), {
        options: {
            $reportViewer: null,
            pageNum: null,
        },
        _formInit: false,
        _paramCount: 0,
        _defaultValueExist: false,
        _loadedForDefault:true,

        _init: function () {
            var me = this;
            me.element.html(null);
        },
        _destroy: function() {
        },
        _render: function () {
            var me = this;
            
            me.element.html(null);
            var $params = new $("<div class=" + paramContainerClass + ">" +
                "<form name='ParameterForm' onsubmit='return false'>" +
                   "<div class='fr-param-element-border'><input type='text' style='display:none'></div>" +
                   "<div class='fr-param-submit-container'>" +
                      "<input name='Parameter_ViewReport' type='button' class='fr-param-viewreport' value='" + me.options.$reportViewer.locData.paramPane.viewReport + "'/>" +
                   "</div>" +
                "</form></div>");
            me.element.css("display", "block");
            me.element.html($params);

            me._formInit = true;
        },
        writeParameterPanel: function(data, rs, pageNum, loadOnly) {
            var me = this;
            me.options.pageNum = pageNum;
            me._paramCount = parseInt(data.Count,10);
            me._defaultValueExist = data.DefaultValueExist;
            me._loadedForDefault = true;

            me._render();

            var $eleBorder = $(".fr-param-element-border");
            $.each(data.ParametersList, function (index, param) {
                $eleBorder.append(me._writeParamControl(param, new $("<div />")));
            });
            
            me._resetLabelWidth();
            me.resetValidateMessage();
            $("[name='ParameterForm']").validate({
                errorPlacement: function (error, element) {
                    if ($(element).is(":radio"))
                        error.appendTo(element.parent("div").next("span"));
                    else {
                        if ($(element).attr("IsMultiple") === "True")
                            error.appendTo(element.parent("div").next("span"));
                        else
                            error.appendTo(element.next("span"));
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
            $(".fr-param-viewreport").on("click", function () {
                me._submitForm();
            });

            if (me._paramCount === data.DefaultValueCount && me._loadedForDefault)
                me._submitForm();
            else
                me._trigger(events.render);

            me.options.$reportViewer.removeLoadingIndicator();
        },
        _submitForm: function () {
            var me = this;

            me._closeAllDropdown();
            var paramList = me.getParamsList();
            if (paramList) {                
                me.options.$reportViewer.loadReportWithNewParameters(paramList);
                me._trigger(events.submit);
            }
        },
        _writeParamControl: function (param, $parent) {
            var me = this;
            var $lable = new $("<div class='fr-param-label'>" + param.Name + "</div>");
            
            //If the control have valid values, then generate a select control
            var $container = new $("<div class='fr-param-item-container'></div>");
            var $errorMsg = new $("<span class='fr-param-error-placeholder'/>");
            var $element = null;

            if (param.ValidValues !== "") {
                //dropdown with checkbox
                if (param.MultiValue === "True") {
                    $element = me._writeDropDownWithCheckBox(param);
                }
                else {
                    $element = me._writeDropDownControl(param);
                }
            }
            else {
                if (param.Type === "Boolean")
                    $element = me._writeRadioButton(param);
                else
                    $element = me._writeTextArea(param);
            }

            $element.on("keypress", function (e) {
                if (e.keyCode === 13) {
                    me._submitForm();
                } // Enter
            });

            $container.append($element).append(me._addNullableCheckBox(param, $element)).append($errorMsg);
            $parent.append($lable).append($container);

            return $parent;
        },
        _getParameterControlProperty: function (param, $control) {
            var me = this;
            $control.attr("AllowBlank", param.AllowBlank);
            if (param.Nullable !== "True") {
                $control.attr("required", "true").watermark(me.options.$reportViewer.locData.paramPane.required);
            }
            $control.attr("ErrorMessage", param.ErrorMessage);
        },
        _addNullableCheckBox: function (param, $control) {
            var me = this;
            if (param.Nullable === "True") {
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
        _writeRadioButton: function (param) {
            var me = this;
            var paramPane = me.options.$reportViewer.locData.paramPane;
            var radioValues = [];
            radioValues[0] = paramPane.isTrue;
            radioValues[1] = paramPane.isFalse;

            var $control = new $("<div class='fr-param-checkbox-container' ismultiple='" + param.MultiValue + "' datatype='" + param.Type + "' ></div>");

            for (var i = 0; i < radioValues.length; i++) {
                var $radioItem = new $("<input type='radio' class='fr-param fr-param-radio " + param.Name + "' name='" + param.Name + "' value='" + radioValues[i] +
                    "' id='" + param.Name + "_radio" + "_" + radioValues[i] + "' datatype='" + param.Type + "' />");
                me._getParameterControlProperty(param, $radioItem);

                if (me._hasDefaultValue(param)) {
                    if (param.Nullable === "True")
                        $radioItem.attr("disabled", "true");
                    else if (param.DefaultValues[0] === radioValues[i])
                        $radioItem.attr("checked", "true");
                }

                if (me._paramCount === 1)
                    $radioItem.on("click", function () { me._submitForm(); });

                var $label = new $("<label class='fr-param-radio-label' for='" + param.Name + "_radio" + "_" + radioValues[i] + "'>" + radioValues[i] + "</label>");

                $control.append($radioItem);
                $control.append($label);
            }

            return $control;
        },
        _writeTextArea: function (param) {
            var me = this;
            var $control = new $("<input class='fr-param' type='text' size='30' ismultiple='" + param.MultiValue + "' datatype='" + param.Type + "'  name='" + param.Name + "'/>");
            me._getParameterControlProperty(param, $control);

            switch (param.Type) {
                case "DateTime":
                    //$control.attr("readonly", "true");
                    $control.datepicker({
                        dateFormat: "yy-mm-dd", //Format: ISO8601
                        changeMonth: true,
                        changeYear: true,
                        onClose: function () {
                            $("[name='" + param.Name + "']").valid();
                            if (me._paramCount === 1)
                                me._submitForm();
                        },
                    });
                    $control.attr("dateISO","true");

                    if(me._hasDefaultValue(param))
                        $control.datepicker("setDate", me._getDateTimeFromDefault(param.DefaultValues[0]));
                    break;
                case "Integer":
                case "Float":
                    $control.attr("number", "true");
                    if (me._hasDefaultValue(param)) { $control.val(param.DefaultValues[0]); }
                    break;
                case "String":
                    if (me._hasDefaultValue(param)) { $control.val(param.DefaultValues[0]); }
                    //if (param.DefaultValues[0] === "")                        
                    //    $control.attr("disabled", "true").removeClass("fr-param-enable").addClass("fr-param-disable");
                    break;
            }

            return $control;
        },
        _writeDropDownControl: function (param) {
            var me = this;
            var canLoad = false;
            var $control = $("<select class='fr-param fr-param-select' ismultiple='" + param.MultiValue + "' name='" + param.Name + "' datatype='" + param.Type + "' readonly='true'>");
            me._getParameterControlProperty(param, $control);

            var $defaultOption = new $("<option value=''>&#60Select a Value&#62</option>");
            $control.append($defaultOption);

            for (var i = 0; i < param.ValidValues.length;i++) {
                var optionValue = param.ValidValues[i].Value;
                var $option = new $("<option value='" + optionValue + "'>" + param.ValidValues[i].Key + "</option>");
                
                if (me._hasDefaultValue(param) && param.DefaultValues[0] === optionValue) {
                    $option.attr("selected", "true");
                    canLoad = true;
                }

                $control.append($option);
            }
            if (!canLoad) me._loadedForDefault = false;

            if (me._paramCount === 1) {
                $control.on("change", function () { me._submitForm(); });
            }
            
            return $control;
        },
        _writeDropDownWithCheckBox: function(param) {
            var me = this;
            var $control = new $("<div style='display:inline-block;'/>");

            var $multipleCheckBox = new $("<Input type='text' class='fr-param-client' id='" + param.Name + "_fore' name='" + param.Name + "' readonly='true' ismultiple='" + param.MultiValue + "' datatype='" + param.Type + "'/>");
            me._getParameterControlProperty(param, $multipleCheckBox);
            $multipleCheckBox.on("click", function () { me._popupDropDownPanel(param); });

            var $hiddenCheckBox = new $("<Input id='" + param.Name + "_hidden' class='fr-param' type='hidden' name='" + param.Name + "' ismultiple='" + param.MultiValue + "' datatype='" + param.Type + "'/>");

            var $openDropDown = new $("<Img alt='Open DropDown List' src='../../Forerunner/ReportViewer/images/OpenDropDown.png' name='" + param.Name + "OpenDropDown' />");
            $openDropDown.on("click", function () { me._popupDropDownPanel(param); });

            var $dropDownContainer = new $("<div class='fr-param-dropdown fr-param-dropdown-hidden' name='" + param.Name + "_DropDownContainer' value='" + param.Name + "' />");

            $(document).on("click", function (e) {
                if ($(e.target).hasClass("ViewReport")) return;

                if (!($(e.target).hasClass("fr-param-dropdown") || $(e.target).hasClass("fr-param-client") || $(e.target).hasClass(param.Name + "_DropDown_CB") || $(e.target).hasClass(param.Name + "_DropDown_lable"))) {
                    if ($(e.target).attr("name") !== param.Name + "OpenDropDown") {
                        me._closeDropDownPanel(param);
                    }
                }
            });

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
                var $checkbox = new $("<input type='checkbox' class='" + param.Name + "_DropDown_CB' id='" + param.Name + "_DropDown_" + value + "' value='" + value + "' />");

                if (me._hasDefaultValue(param) && me._contains(param.DefaultValues, value)) {
                    $checkbox.attr("checked", "true");
                    keys += key + ",";
                    values += value + ",";
                }

                $checkbox.on("click", function () {
                    if (this.value === "Select All") {
                        if (this.checked === true) {
                            $("." + param.Name + "_DropDown_CB").each(function () {
                                this.checked = true;
                            });
                        }
                        if (this.value === "Select All" && this.checked === false) {
                            $("." + param.Name + "_DropDown_CB").each(function () {
                                this.checked = false;
                            });
                        }
                    }
                });

                var $label = new $("<label for='" + param.Name + "_DropDown_" + value + "' class='" + param.Name + "_DropDown_lable" + "' name='"
                    + param.Name + "_DropDown_" + value + "_lable" + "'/>");
                $label.html(key);

                $span.append($checkbox).append($label);
                $col.append($span);
                $row.append($col);
                $table.append($row);
            }
            $dropDownContainer.append($table);

            if (me._hasDefaultValue(param)) {
                $multipleCheckBox.val(keys.substr(0, keys.length - 1));
                $hiddenCheckBox.val(values.substr(0, values.length - 1));
            }

            $control.append($multipleCheckBox).append($hiddenCheckBox).append($openDropDown).append($dropDownContainer);

            return $control;
        },
        _setMultipleInputValues: function (param) {
            var showValue = "";
            var hiddenValue = "";
            $("." + param.Name + "_DropDown_CB").each(function () {
                if (this.checked && this.value !== "Select All") {
                    showValue += $("[name='" + param.Name + "_DropDown_" + this.value + "_lable']").html() + ",";
                    hiddenValue += this.value + ",";
                }
            });
            $("#" + param.Name + "_fore").val(showValue.substr(0, showValue.length - 1));
            $("#" + param.Name + "_hidden").val(hiddenValue.substr(0, hiddenValue.length - 1));
        },
        _popupDropDownPanel: function(param) {
            var me = this;
            
            var $dropDown = $("[name='" + param.Name + "_DropDownContainer']");
            var $multipleControl = $("[name='" + param.Name + "']");
            var $multipleControlParent = $multipleControl.parent();
            var $paramContainer = me.element.find("." + paramContainerClass);
            var positionTop = $multipleControlParent.position().top + $paramContainer.scrollTop();

            if ($paramContainer.height() - positionTop < $dropDown.height() + $multipleControlParent.height()) {
                $dropDown.css("top", positionTop - $dropDown.height());
            }
            else {
                $dropDown.css("top", positionTop + $multipleControlParent.height());
            }

            if ($dropDown.hasClass("fr-param-dropdown-hidden")) {
                $dropDown.width($multipleControl.width()).fadeOut("fast").removeClass("fr-param-dropdown-hidden").addClass("fr-param-dropdown-show");
            }
            else {
                me._closeDropDownPanel(param);
            }
        },
        _closeDropDownPanel: function (param) {
            var me = this;
            if ($("[name='" + param.Name + "_DropDownContainer']").hasClass("fr-param-dropdown-show")) {
                $("[name='" + param.Name + "_DropDownContainer']").fadeIn("fast", function () {
                    me._setMultipleInputValues(param);
                });
                $("[name='" + param.Name + "_DropDownContainer']").addClass("fr-param-dropdown-hidden").removeClass("fr-param-dropdown-show");
                $("[name='" + param.Name + "']").focus().blur().focus();
            }

        },
        _closeAllDropdown: function () {
            var me = this;
            $(".fr-param-dropdown").each(function (index, param) {
                me._closeDropDownPanel({ Name: $(param).attr("value") });
            });
        },
        getParamsList: function() {
            var me = this;
            var i;
            if ($("[name='ParameterForm']").length !== 0 && $("[name='ParameterForm']").valid() === true) {
                var a = [];
                //Text
                $(".fr-param").filter(":text").each(function () {
                    a.push({ name: this.name, ismultiple: $(this).attr("ismultiple"), type: $(this).attr("datatype"), value: me._isParamNullable(this) });
                });
                //Hidden
                $(".fr-param").filter("[type='hidden']").each(function () {
                    a.push({ name: this.name, ismultiple: $(this).attr("ismultiple"), type: $(this).attr("datatype"), value: me._isParamNullable(this) });
                });
                //dropdown
                $(".fr-param").filter("select").each(function () {
                    a.push({ name: this.name, ismultiple: $(this).attr("ismultiple"), type: $(this).attr("datatype"), value: me._isParamNullable(this) });
                });
                var radioList = {};
                //radio-group by radio name, default value: null
                $(".fr-param").filter(":radio").each(function () {
                    if (!(this.name in radioList)) {
                        radioList[this.name] = null;
                    }
                    if (this.checked === true) {
                        radioList[this.name] = me._isParamNullable(this);
                    }
                });
                for (var radioName in radioList) {
                    a.push({ name: radioName, ismultiple: "", type: "Boolean", value: radioList[radioName] });
                }
                //combobox - multiple values
                var tempCb = "";
                $(".fr-param").filter(":checkbox").filter(":checked").each(function () {
                    if (tempCb.indexOf(this.name) === -1) {
                        tempCb += this.name + ",";
                    }
                });
                var cbArray = tempCb.split(",");
                var cbName = "";
                var cbValue = "";
                for (i = 0; i < cbArray.length - 1; i++) {
                    cbName = cbArray[i];
                    var cbValueLength = $("input[name='" + cbArray[i] + "']:checked").length;
                    $("input[name='" + cbArray[i] + "']:checked").each(function (i) {
                        if (i === cbValueLength - 1)
                            cbValue += this.value;
                        else
                            cbValue += this.value + ",";

                    });
                    a.push({ name: cbName, ismultiple: $(this).attr("ismultiple"), type: $(this).attr("datatype"), value: cbValue });
                }

                //Combined to JSON String, format as below
                //var parameterList = '{ "ParamsList": [{ "Parameter": "CategoryID","IsMultiple":"True", "Value":"'+ $("#CategoryID").val()+'" }] }';
                var tempJson = "[";
                for (i = 0; i < a.length; i++) {
                    if (i !== a.length - 1) {
                        tempJson += "{'Parameter':'" + a[i].name + "','IsMultiple':'" + a[i].ismultiple + "','Type':'" + a[i].type + "','Value':'" + a[i].value + "'},";
                    }
                    else {
                        tempJson += "{'Parameter':'" + a[i].name + "','IsMultiple':'" + a[i].ismultiple + "','Type':'" + a[i].type + "','Value':'" + a[i].value + "'}";
                    }
                }
                tempJson += "]";
                return "{'ParamsList':" + tempJson + "}";
            } else {
                return null;
            }
        },
        _isParamNullable: function(param) {
            var cb = $(".fr-param-checkbox").filter("[name='" + param.name + "']").first();
            if (cb.attr("checked") === "checked" || param.value === "")
                return null;
            else
                return param.value;
        },
        _resetLabelWidth: function () {
            var max = 0;
            $(".fr-param-label").each(function (index, obj) {
                if ($(obj).width() > max) max = $(obj).width();
            });
            $(".fr-param-label").each(function (index, obj) {
                $(obj).width(max);
            });
        },
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
        removeParameter: function () {
            var me = this;
            me._formInit = false;
            $(".fr-param-container", this.element).detach();
        },
        _getDefaultHTMLTable: function() {
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
            return me._defaultValueExist && $.isArray(param.DefaultValues) && param.DefaultValues[0];
        },
        _getDateTimeFromDefault: function (defaultDatetime) {
            if (!defaultDatetime || defaultDatetime.length < 9)
                return null;

            var date = defaultDatetime.substr(0, defaultDatetime.indexOf(" "));

            var datetime = date.substring(0, date.indexOf("/")) + "-" +
                           date.substring(date.indexOf("/") + 1, date.lastIndexOf("/")) + "-" +
                           date.substring(date.lastIndexOf("/") + 1, defaultDatetime.indexOf(" "));
            return datetime;
        },
    });  // $.widget
});
///#source 1 1 /Forerunner/ReportViewer/js/ReportDocumentMap.js
// Assign or create the single globally scoped variable
var forerunner = forerunner || {};

// Forerunner SQL Server Reports
forerunner.ssr = forerunner.ssr || {};

$(function () {
    var widgets = forerunner.ssr.constants.widgets;

    $.widget(widgets.getFullname(widgets.reportDocumentMap), {
        options: {
            reportViewer: null,
        },
        _create: function () {
                this.element = $("<div class='fr-docmap-panel'><div class='fr-docmap-border'><table class='fr-docmap-table'>" +
                "<tr><td nowrap><div class='fr-docmap-header'><div class='fr-docmap-bar'> Document Map </div></div></td></tr>" +
                "<tr><td class='fr-docmap-content-cell'><div class='fr-docmap-item-container'></div></td></tr></table></div></div>");
            
                this.options.reportViewer.$reportContainer.append(this.element);
                
                $(".fr-docmap-panel").resizable({
                    resize: function (event, ui) {
                        $(".fr-docmap-border").css("width", ui.size.width);
                        $(".fr-docmap-header").css("width", ui.size.width);
                        $(".fr-docmap-item-container").css("width", ui.size.width);
                    }
                });

                var clientHeight = document.documentElement.clientHeight === 0 ? document.body.clientHeight : document.documentElement.clientHeight;
                window.onresize = function () { $(".fr-docmap-border").css("height", clientHeight - $(".fr-docmap-panel").offset().top); };

                $(window).scroll(function () { $(".fr-docmap-border").css("top", $(window).scrollTop()); });
                //trigger the onresize event, fix Compatibility issue in IE and FF
                $(window).resize();
                $(".fr-docmap-panel").toggle("fast");
        },
        writeDocumentMap: function (pageNum) {
            var me = this;
            var $cell;
            $cell = $(".fr-docmap-item-container");
            $cell.append(me._writeDocumentMapItem(this.options.reportViewer.pages[pageNum].reportObj.Report.DocumentMap, 0));
        },
        _writeDocumentMapItem: function (docMap, level) {
            var me = this;
            var $docMap = new $("<DIV />");
            $docMap.css("margin-left", 18 * level + "px");

            var $icon = new $("<DIV />");
            
            if (!docMap.Children) {
                $docMap.attr("level", level);
                $icon.addClass("fr-docmap-indent");
            }
            else {
                $icon.addClass("fr-docmap-spliter");
                $icon.on("click", function () {
                    if ($icon.hasClass("fr-docmap-spliter")) {
                        $icon.removeClass("fr-docmap-spliter").addClass("fr-docmap-expand");
                        $("[level='" + (level) + "']").addClass("fr-docmap-hidden");
                    }
                    else {
                        $icon.addClass("fr-docmap-spliter").removeClass("fr-docmap-expand");
                        $("[level='" + (level) + "']").removeClass("fr-docmap-hidden");
                    }
                });
            }
            $docMap.append($icon);

            var $mapNode = new $("<A />");
            $mapNode.addClass("fr-docmap-item").attr("title", "Navigate to " + docMap.Label).html(docMap.Label);
            $mapNode.on("click", { UniqueName: docMap.UniqueName }, function (e) {
                me.options.reportViewer.navigateDocumentMap(e.data.UniqueName);
            });
            $mapNode.hover(function () { $mapNode.addClass("fr-docmap-item-highlight"); }, function () { $mapNode.removeClass("fr-docmap-item-highlight"); });
            $docMap.append($mapNode);

            if (docMap.Children) {
                level++;
                $.each(docMap.Children, function (Index, Obj) {
                    $docMap.append(me._writeDocumentMapItem(Obj, level));
                });
            }
            return $docMap;
        }
    });  // $.widget
});  // $(function ()
