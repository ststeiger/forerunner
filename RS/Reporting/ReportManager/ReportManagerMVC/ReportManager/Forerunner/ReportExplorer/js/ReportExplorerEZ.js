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
    var events = forerunner.ssr.constants.events;
    var rtb = forerunner.ssr.tools.reportExplorerToolbar;
    var rtp = forerunner.ssr.tools.reportExplorerToolpane;
    var helper = forerunner.helper;
    var constants = forerunner.ssr.constants;
    var propertyEnums = forerunner.ssr.constants.properties;
    var locData = forerunner.localize.getLocData(forerunner.config.forerunnerFolder() + "ReportViewer/loc/ReportViewer");
    var viewToBtnMap = {
        catalog: rtb.btnHome.selectorClass,
        favorites: rtb.btnFav.selectorClass,
        recent: rtb.btnRecent.selectorClass,
    };

    var viewToItemMap = {
        catalog: rtp.itemHome.selectorClass,
        favorites: rtp.itemFav.selectorClass,
        recent: rtp.itemRecent.selectorClass,
    };

    var propertyListMap = {
        // Normal explorer folder and resource files except search folder
        normal: [propertyEnums.description, propertyEnums.tags],
        // Report/Linked Report
        report: [propertyEnums.description, propertyEnums.tags, propertyEnums.rdlExtension],
        // Search Folder
        searchFolder: [propertyEnums.searchFolder, propertyEnums.description],
    };

    /**
     * Widget used to explore available reports and launch the Report Viewer
     *
     * @namespace $.forerunner.reportExplorerEZ
     * @prop {Object} options - The options for reportExplorerEZ
     * @prop {Object} options.navigateTo - Optional, Callback function used to navigate to a selected report
     * @prop {Object} options.historyBack - Optional,Callback function used to go back in browsing history
	 * @prop {Boolean} options.isFullScreen - Optional,Indicate is full screen mode default by true
     * @prop {Boolean} options.showBreadCrumb - A flag to determine whether show breadcrumb navigation in the report
     *                                          viewer toolbar. Defaults to true.
	 * @prop {Object} options.explorerSettings - Optional,Object that stores custom explorer style settings
     * @prop {String} options.rsInstance - Optional,Report service instance name
     * @example
     * $("#reportExplorerEZId").reportExplorerEZ();
     */
    $.widget(widgets.getFullname(widgets.reportExplorerEZ), /** @lends $.forerunner.reportExplorerEZ */ {
        options: {
            navigateTo: null,
            historyBack: null,
            isFullScreen: true,
            showBreadCrumb: true,
            explorerSettings: null,
            rsInstance: null,
        },
        _createReportExplorer: function (path, view, showmainesection) {
            var me = this;
            var path0 = path;
            var layout = me.DefaultAppTemplate;

            if (!path) {// root page
                path = "/";
            }
            if (!view) {// general catalog page
                view = "catalog";
                me._setPropertiesTabs(path, propertyListMap.normal);
            }
            else if (view === "searchfolder") {
                me._setPropertiesTabs(path, propertyListMap.searchFolder);
            }

            var currentSelectedPath = layout._selectedItemPath;// me._selectedItemPath;
            layout.$mainsection.html(null);
            if (showmainesection)
                layout.$mainsection.show();
            else
                layout.$mainsection.hide();
            layout.$docmapsection.hide();
            me.$reportExplorer = layout.$mainsection.reportExplorer({
                reportManagerAPI: forerunner.config.forerunnerAPIBase() + "ReportManager",
                forerunnerPath: forerunner.config.forerunnerFolder(),
                path: path,
                view: view,
                selectedItemPath: currentSelectedPath,
                navigateTo: me.options.navigateTo,
                $appContainer: layout.$container,
                explorerSettings: me.options.explorerSettings,
                rsInstance: me.options.rsInstance,
                onInputFocus: layout.onInputFocus,
                onInputBlur: layout.onInputBlur,
                userSettings: me._getUserSettings()
            });
        },

        // Initalize our internal navigateTo processing
        _initNavigateTo: function () {
            var me = this;

            // Assign the default navigateTo handler
            me.options.navigateTo = function (action, path) {
                me._navigateTo.apply(me, arguments);
            };

            // Create the forerunner router widget
            me.router = $({}).router({
                routes: {
                    "": "transitionToReportManager",
                    "explore/:path": "transitionToReportManager",
                    "browse/:path": "transitionToReportViewer",
                    "view/?:args": "transitionToReportViewerWithRSURLAccess",
                    "open/:path": "transitionToOpenResource",
                    "openDashboard/:path": "transitionToOpenDashboard",
                    "search/:keyword": "transitionToSearch",
                    "favorites": "transitionToFavorites",
                    "recent": "transitionToRecent",
                    "editDashboard/:path": "transitionToEditDashboard",
                    "searchfolder/:path": "transitionToSearchFolder"
                }
            });

            // Hook the router route event
            me.router.on(events.routerRoute(), function (event, data) {
                me._generateRouteLink.apply(me, arguments);
                me._onRoute.apply(me, arguments);
            });

            if (!me.options.historyBack) {
                // Assign the default history back handler
                me.options.historyBack = function () {
                    window.history.back();
                };
            }

            forerunner.history.history("start");


        },
        _onRoute: function (event, data) {
            var me = this;

            if (forerunner.device.isAllowZoom()) {
                forerunner.device.allowZoom(false);
                window.location.reload();
                return;
            }

            var path, args, keyword, name;
            path = args = keyword = name = data.args[0];

            if (data.name === "transitionToReportManager") {
                me.transitionToReportManager(path, null);
            } else if (data.name === "transitionToReportViewer") {
                var parts = path.split("?");
                path = parts[0];
                data.args[0] = path;
                var params = parts.length > 1 ? forerunner.ssr._internal.getParametersFromUrl(parts[1]) : null;
                var options = parts.length > 1 ? forerunner.ssr._internal.getOptionsFromURL(parts[1]) : null;
                if (params) params = JSON.stringify({ "ParamsList": params });
                me.transitionToReportViewer(path, params, options);
            } else if (data.name === "transitionToReportViewerWithRSURLAccess") {
                var startParam = args.indexOf("&");
                var reportPath = startParam > 0 ? args.substring(0, startParam) : args;
                var RSURLParams = startParam > 0 ? args.substring(startParam + 1) : null;
                var options = (RSURLParams) ? forerunner.ssr._internal.getOptionsFromURL(RSURLParams) : null;
                if (RSURLParams) RSURLParams = RSURLParams.length > 0 ? forerunner.ssr._internal.getParametersFromUrl(RSURLParams) : null;
                if (RSURLParams) RSURLParams = JSON.stringify({ "ParamsList": RSURLParams });
                me.transitionToReportViewer(reportPath, RSURLParams, options);
            } else if (data.name === "transitionToOpenResource") {
                me.transitionToReportManager(path, "resource");
            } else if (data.name === "transitionToSearch") {
                me.transitionToReportManager(keyword, "search");
            } else if (data.name === "transitionToFavorites") {
                me.transitionToReportManager(null, "favorites");
            } else if (data.name === "transitionToRecent") {
                me.transitionToReportManager(null, "recent");
            } else if (data.name === "transitionToSearchFolder") {
                me.transitionToReportManager(path, "searchfolder");
            } else if (data.name === "transitionToEditDashboard") {
                me.transitionToEditDashboard(path);
            } else if (data.name === "transitionToOpenDashboard") {
                me.transitionToOpenDashboard(path);
            }
        },
        _lastAction: null,
        _navigateTo: function (action, path) {
            var me = this;
            
            if (path !== null) {
                path = encodeURIComponent(path);
            }

            if (action === "home") {
                me.router.router("navigate", "#", { trigger: true, replace: false });
            } else if (action === "back") {
                me.options.historyBack();
            } else if (action === "favorites") {
                me.router.router("navigate", "#favorites", { trigger: true, replace: false });
            } else if (action === "recent") {
                me.router.router("navigate", "#recent", { trigger: true, replace: false });
            } else {
                var targetUrl = "#" + action + "/" + path;
                me.router.router("navigate", targetUrl, { trigger: true, replace: false });
            }
            me._lastAction = action;
        },
        _generateRouteLink: function (event, data) {
            var me = this;

            var $linksection = me.DefaultAppTemplate.$linksection;
            //clear prior route link
            $linksection.html("");

            var path = data.args[0];
            me._getLink(path, $linksection, 0, data.name);
            $linksection.show();

            me._linkResize($linksection);
        },
        _getLink: function (path, $container, index, transitionName) {
            var me = this,
                parentPath = (path === "/" ? null : forerunner.helper.getParentPath(path)),
                name = (forerunner.helper.getCurrentItemName(path) || locData.toolbar.home),
                $link = new $("<span />"),
                $arrowTag,
                $forerunnerViewLink,
                forerunerViewText;

            $link.addClass("fr-location-link");
            index++;
            if (parentPath === null) {
                $link.text(locData.toolbar.home);
                $link.on("click", function () { me._navigateTo("home"); });
                $container.append($link);

                //show forerunner view name in breadcrumb, search/favorite/recent
                switch (transitionName) {
                    case "transitionToSearch":
                        forerunerViewText = locData.toolbar.search;
                        break;
                    case "transitionToFavorites":
                        forerunerViewText = locData.toolbar.favorites;
                        break;
                    case "transitionToRecent":
                        forerunerViewText = locData.toolbar.recent;
                        break;
                }

                if (forerunerViewText) {
                    $arrowTag = new $("<span/>");
                    $arrowTag.text(" > ");
                    $container.append($arrowTag);
                    //Add special handle for search, favorite, recent views
                    $forerunnerViewLink = new $("<span />");
                    $forerunnerViewLink.addClass("fr-location-link-last");

                    $forerunnerViewLink.text(forerunerViewText);
                    $container.append($forerunnerViewLink);
                }
                
                return;
            }
            else {
                me._getLink(parentPath, $container, index, transitionName);
            }

            $arrowTag = new $("<span/>");
            $arrowTag.text(" > ");

            $link.text(name);
            if (index !== 1) {
                $link.on("click", function () {
                    //only report folder can be selected in the path, so always pass explore to do the route
                    me._navigateTo("explore", path);
                });
            }
            else {
                $link.addClass("fr-location-link-last");
            }

            $container.append($arrowTag).append($link);
        },
        //compare link section and container width, ellipsis long word to only keep 10 characters.
        _linkResize: function ($linksection) {
            var me = this;
            var $lastLink = $linksection.find(".fr-location-link-last"),
                text,
                newText;

            if ($lastLink.length && ($lastLink.offset().left + $lastLink.width()) > $linksection.width()) {
                //get the last not ellipsis link
                var $link = $linksection.find(".fr-location-link:not(.fr-link-ellipsis):last");
                if ($link.length === 0) return;//stop ellisis if all links have been ellipsis

                text = $link.text();
                if (text.length > 10) {
                    newText = text.substring(0, 10) + "..";
                }
                $link.addClass("fr-link-ellipsis").text(newText);

                me._linkResize($linksection);
            }
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
            if (layout.$mainsection.html() !== "" && layout.$mainsection.html() !== null) {
                layout.$mainsection.html("");
                layout.$mainsection.hide();
            }
            
            layout.cleanUp();
            forerunner.dialog.closeAllModalDialogs(layout.$container);

            //Android and iOS need some time to clean prior scroll position, I gave it a 50 milliseconds delay
            //To resolved bug 494 on android
            var timeout = forerunner.device.isWindowsPhone() ? 500 : forerunner.device.isTouch() ? 50 : 0;
            setTimeout(function () {
                me._createReportExplorer(path, view, true);

                var $toolbar = layout.$mainheadersection;
                //add this class to distinguish explorer toolbar and viewer toolbar
                $toolbar.addClass("fr-explorer-tb").removeClass("fr-viewer-tb");
                $toolbar.reportExplorerToolbar({
                    navigateTo: me.options.navigateTo,
                    $appContainer: layout.$container,
                    $reportExplorer: me.$reportExplorer
                });

                me._setLeftRightPaneStyle();

                $toolbar.reportExplorerToolbar("setFolderBtnActive", viewToBtnMap[view]);
                if (view === "search") {
                    $toolbar.reportExplorerToolbar("setSearchKeyword", path);
                }

                var $lefttoolbar = layout.$leftheader;
                if ($lefttoolbar !== null) {
                    $lefttoolbar.leftToolbar({ $appContainer: layout.$container });
                }

                var $toolpane = layout.$leftpanecontent;
                $toolpane.reportExplorerToolpane({
                    navigateTo: me.options.navigateTo,
                    $appContainer: layout.$container,
                    $reportExplorer: me.$reportExplorer
                });

                $toolpane.reportExplorerToolpane("setFolderItemActive", viewToItemMap[view]);
                if (view === "search") {
                    $toolpane.reportExplorerToolpane("setSearchKeyword", path);
                }

                if (me.options.showBreadCrumb === false) {
                    me.DefaultAppTemplate.$linksection.hide();
                }

                layout._selectedItemPath = path0; //me._selectedItemPath = path0;
                var explorer = $(".fr-report-explorer", me.$reportExplorer);
                me.element.css("background-color", explorer.css("background-color"));

                me._trigger(events.afterTransition, null, { type: "ReportManager", path: path, view: view });
            }, timeout);
        },
        _setLeftRightPaneStyle: function () {
            var me = this;
            var layout = me.DefaultAppTemplate;

            var routeLinkSectionHeight = layout.$linksection.is(":visible") ? layout.$linksection.outerHeight() : 0;
            var toolpaneheaderheight = layout.$mainheadersection.height(); //equal toolbar height
            var offset = forerunner.device.isIEMobile9() ? 0 : routeLinkSectionHeight;

            // window phone 7 get top property wrong
            var topDivHeight = routeLinkSectionHeight + toolpaneheaderheight;

            layout.$topdiv.css({ height: topDivHeight });
            layout.$topdivspacer.css({ height: topDivHeight });

            layout.$rightheader.css({ height: toolpaneheaderheight, top: offset });
            layout.$leftheader.css({ height: toolpaneheaderheight, top: offset });

            layout.$rightheaderspacer.css({ top: offset, height: toolpaneheaderheight });
            layout.$leftheaderspacer.css({ top: offset, height: toolpaneheaderheight });

            layout.$leftpanecontent.css({ top: (toolpaneheaderheight + offset) });
            layout.$rightpanecontent.css({ top: (toolpaneheaderheight + offset) });
        },
        _getUserSettings: function () {
            var me = this;
            return forerunner.ajax.getUserSetting(me.options.rsInstance);
        },
        /**
         * Transition to ReportViewer view
         *
         * @function $.forerunner.reportExplorerEZ#transitionToReportView
         * @param {String} path - The report path to display.
         * @param {String} params - ??.
         * @param {Object} urlOptions - ??
         */
        transitionToReportViewer: function (path, params, urlOptions) {
            var me = this;
            var layout = me.DefaultAppTemplate;
            layout.$mainsection.html("");
            layout.$mainsection.hide();
            forerunner.dialog.closeAllModalDialogs(layout.$container);
            //set properties dialog
            me._setPropertiesTabs(path, propertyListMap.report);

            //add this class to distinguish explorer toolbar and viewer toolbar
            var $toolbar = layout.$mainheadersection;
            $toolbar.addClass("fr-viewer-tb").removeClass("fr-explorer-tb");

            layout._selectedItemPath = null;
            //Android and iOS need some time to clean prior scroll position, I gave it a 50 milliseconds delay
            //To resolved bug 909, 845, 811 on iOS
            var timeout = forerunner.device.isWindowsPhone() ? 500 : forerunner.device.isTouch() ? 50 : 0;
            setTimeout(function () {
                var toolbarConfig = constants.toolbarConfigOption.full;
                if (urlOptions && !urlOptions.showToolbar) {
                    toolbarConfig = constants.toolbarConfigOption.hide;
                }

                layout.$mainviewport.reportViewerEZ({
                    DefaultAppTemplate: layout,
                    path: path,
                    navigateTo: me.options.navigateTo,
                    historyBack: me.options.historyBack,
                    isReportManager: urlOptions ? urlOptions.isReportManager : true,
                    useReportManagerSettings: urlOptions? urlOptions.useReportManagerSettings : true,
                    rsInstance: me.options.rsInstance,
                    savedParameters: params,
                    userSettings: me._getUserSettings(),
                    handleWindowResize: false,
                    showBreadCrumb: urlOptions ? urlOptions.showBreadCrumb : me.options.showBreadCrumb,
                    showParameterArea: urlOptions ? urlOptions.showParameterArea : "Collapsed",
                    showSubscriptionOnOpen: urlOptions ? urlOptions.showSubscriptionOnOpen : false,
                    toolbarConfigOption: toolbarConfig,
                    zoom: urlOptions ? urlOptions.zoom : "100"
                });

                me._setLeftRightPaneStyle();

                var $reportViewer = layout.$mainviewport.reportViewerEZ("getReportViewer");
                if ($reportViewer && path !== null) {
                    path = String(path).replace(/%2f/g, "/");
                    layout.$mainsection.fadeIn("fast");
                    $reportViewer.reportViewer("loadReport", path, urlOptions ? urlOptions.section : 1, params);
                }

                me._trigger(events.afterTransition, null, { type: "ReportViewer", path: path, params: params, urlOptions: urlOptions });
            }, timeout);

            me.element.css("background-color", "");
        },
        _transitionToDashboard: function (path, enableEdit) {
            var me = this;
            var layout = me.DefaultAppTemplate;

            layout.$mainsection.html("");
            forerunner.dialog.closeAllModalDialogs(me.DefaultAppTemplate.$container);

            me.DefaultAppTemplate._selectedItemPath = null;
            me._setPropertiesTabs(path, propertyListMap.normal);

            //Android and iOS need some time to clean prior scroll position, I gave it a 50 milliseconds delay
            //To resolved bug 909, 845, 811 on iOS
            var timeout = forerunner.device.isWindowsPhone() ? 500 : forerunner.device.isTouch() ? 50 : 0;
            setTimeout(function () {
                var $dashboardEZ = layout.$mainviewport.dashboardEZ({
                    DefaultAppTemplate: layout,
                    navigateTo: me.options.navigateTo,
                    historyBack: me.options.historyBack,
                    isReportManager: true,
                    enableEdit: enableEdit,
                    path: path,
                    rsInstance: me.options.rsInstance,
                    userSettings: me._getUserSettings(),
                    handleWindowResize: false
                });

                me._setLeftRightPaneStyle();
                layout.$mainsection.fadeIn("fast");

                var $dashboardEditor = $dashboardEZ.dashboardEZ("getDashboardEditor");
                $dashboardEditor.dashboardEditor("openDashboard", path, enableEdit);
                $dashboardEZ.dashboardEZ("enableEdit", enableEdit, true);

                me._trigger(events.afterTransition, null, { type: "Dashboard", path: path, enableEdit: enableEdit });
            }, timeout);

            me.element.css("background-color", "");
        },
        /**
         * Transition to Open Dashboard view
         *
         * @function $.forerunner.reportExplorerEZ#transitionToOpenDashboard
         * @param {String} path - Fully qualified path to the dashboard
         */
        transitionToOpenDashboard: function (path) {
            var me = this;
            me._transitionToDashboard(path, false);
        },
        /**
         * Transition to Create Dashboard view
         *
         * @function $.forerunner.reportExplorerEZ#transitionToEditDashboard
         * @param {String} path - Fully qualified path to the dashboard
         */
        transitionToEditDashboard: function (path) {
            var me = this;
            me._transitionToDashboard(path, true);
        },
        _create: function () {
            var me = this;
            $(window).on("resize", function (event, data) {
                helper.delay(me, function () {
                    var layout = me.DefaultAppTemplate;
                    if (widgets.hasWidget(layout.$mainviewport, widgets.dashboardEZ)) {
                        layout.$mainviewport.dashboardEZ("windowResize");
                    }
                    if (widgets.hasWidget(layout.$mainviewport, widgets.reportViewerEZ)) {
                        layout.$mainviewport.reportViewerEZ("windowResize");
                    }

                    me.DefaultAppTemplate.windowResize.call(me.DefaultAppTemplate);

                    var $reportExplorerToolbar = me.getReportExplorerToolbar();
                    if (widgets.hasWidget($reportExplorerToolbar, widgets.reportExplorerToolbar)) {
                        $reportExplorerToolbar.reportExplorerToolbar("windowResize");
                    }
                });
            });
        },
        _init: function () {
            var me = this;
            me.DefaultAppTemplate = new forerunner.ssr.DefaultAppTemplate({
                $container: me.element,
                isFullScreen: me.options.isFullScreen
            }).render();
            
            me.DefaultAppTemplate.$propertySection.forerunnerProperties("option", "rsInstance", me.options.rsInstance);

            if (!me.options.navigateTo) {
                me._initNavigateTo();
            }
        },
        _setPropertiesTabs: function (path, propertyList) {
            var me = this;
            me.DefaultAppTemplate.$propertySection.forerunnerProperties("setProperties", path, propertyList);
        },
        /**
         * Get report explorer object
         *
         * @function $.forerunner.reportExplorerEZ#getReportExplorer
         * 
         * @return {Object} - report explorer jQuery object
         */
        getReportExplorer: function () {
            var me = this;
            return me.$reportExplorer;
        },
        /**
         * Get report explorer toolbar object
         *
         * @function $.forerunner.reportExplorerEZ#getReportExplorerToolbar
         * 
         * @return {Object} - report explorer toolbar jQuery object
         */
        getReportExplorerToolbar: function () {
            var me = this;
            if (me.DefaultAppTemplate) {
                return me.DefaultAppTemplate.$mainheadersection;
            }

            return null;
        },
        /**
         * Get report explorer toolpane object
         *
         * @function $.forerunner.reportExplorerEZ#getReportExplorerToolpane
         * 
         * @return {Object} - report explorer toolpane jQuery object
         */
        getReportExplorerToolpane: function () {
            var me = this;
            if (me.DefaultAppTemplate) {
                return me.DefaultAppTemplate.$leftpanecontent;
            }

            return null;
        }
    });  // $.widget
});  // function()