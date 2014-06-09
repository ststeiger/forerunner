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

    /**
     * Widget used to explore available reports and launch the Report Viewer
     *
     * @namespace $.forerunner.reportExplorerEZ
     * @prop {Object} options - The options for reportExplorerEZ
     * @prop {Object} options.navigateTo - Optional, Callback function used to navigate to a selected report
     * @prop {Object} options.historyBack - Optional,Callback function used to go back in browsing history
	 * @prop {Boolean} options.isFullScreen - Optional,Indicate is full screen mode default by true
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
            explorerSettings: null,
            rsInstance: null,
        },
        _createReportExplorer: function (path, view, showmainesection) {
            var me = this;
            var path0 = path;
            var layout = me.DefaultAppTemplate;

            if (!path)
                path = "/";
            if (!view)
                view = "catalog";

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
                    "view/:args": "transitionToReportViewerWithRSURLAccess",
                    "open/:path": "transitionToOpenResource",
                    "openDashboard/:path": "transitionToOpenDashboard",
                    "search/:keyword": "transitionToSearch",
                    "favorites": "transitionToFavorites",
                    "recent": "transitionToRecent",
                    "createDashboard/:path": "transitionToCreateDashboard"
                    "searchfolder/:path": "transitionToSearchFolder"
                }
            });

            // Hook the router route event
            me.router.on(events.routerRoute(), function (event, data) {
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
            var path, args, keyword, name;
            path = args = keyword = name = data.args[0];

            if (data.name === "transitionToReportManager") {
                me.transitionToReportManager(path, null);
            } else if (data.name === "transitionToReportViewer") {
                var parts = path.split("?");
                path = parts[0];
                var params = parts.length > 1 ? forerunner.ssr._internal.getParametersFromUrl(parts[1]) : null;
                if (params) params = JSON.stringify({ "ParamsList": params });
                me.transitionToReportViewer(path, params);
            } else if (data.name === "transitionToReportViewerWithRSURLAccess") {
                var startParam = args.indexOf("&");
                var reportPath = startParam > 0 ? args.substring(1, startParam) : args;
                var RSURLParams = startParam > 0 ? args.substring(startParam + 1) : null;
                if (RSURLParams) RSURLParams = RSURLParams.length > 0 ? forerunner.ssr._internal.getParametersFromUrl(RSURLParams) : null;
                if (RSURLParams) RSURLParams = JSON.stringify({ "ParamsList": RSURLParams });
                me.transitionToReportViewer(reportPath, RSURLParams);
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
            } else if (data.name === "transitionToCreateDashboard") {
                me.transitionToCreateDashboard(path);
            } else if (data.name == "transitionToOpenDashboard") {
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
                // Do not trigger for Firefox when we are changing the anchor
                var trigger = !forerunner.device.isFirefox() || me._lastAction === action || !me._lastAction;
                me.router.router("navigate", targetUrl, { trigger: trigger, replace: false });
            }
            me._lastAction = action;
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
            forerunner.device.allowZoom(false);
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

                layout.$rightheader.height(layout.$topdiv.height());
                layout.$leftheader.height(layout.$topdiv.height());
                layout.$rightheaderspacer.height(layout.$topdiv.height());
                layout.$leftheaderspacer.height(layout.$topdiv.height());

                layout._selectedItemPath = path0; //me._selectedItemPath = path0;
                var explorer = $(".fr-report-explorer", me.$reportExplorer);
                me.element.css("background-color", explorer.css("background-color"));
            }, timeout);
        },
        _getUserSettings: function () {
            var me = this;
            if (!me.$reportExplorer)
                me._createReportExplorer();
            return me.$reportExplorer.reportExplorer("getUserSettings");
        },
        /**
         * Transition to ReportViewer view
         *
         * @function $.forerunner.reportExplorerEZ#transitionToReportView
         * @param {String} path - The report path to display.
         */
        transitionToReportViewer: function (path, params) {
            var me = this;
            var layout = me.DefaultAppTemplate;
            layout.$mainsection.html("");
            layout.$mainsection.hide();
            forerunner.dialog.closeAllModalDialogs(layout.$container);

            //add this class to distinguish explorer toolbar and viewer toolbar
            var $toolbar = layout.$mainheadersection;
            $toolbar.addClass("fr-viewer-tb").removeClass("fr-explorer-tb");

            layout._selectedItemPath = null;
            //Android and iOS need some time to clean prior scroll position, I gave it a 50 milliseconds delay
            //To resolved bug 909, 845, 811 on iOS
            var timeout = forerunner.device.isWindowsPhone() ? 500 : forerunner.device.isTouch() ? 50 : 0;
            setTimeout(function () {
                layout.$mainviewport.reportViewerEZ({
                    DefaultAppTemplate: layout,
                    path: path,
                    navigateTo: me.options.navigateTo,
                    historyBack: me.options.historyBack,
                    isReportManager: true,
                    rsInstance: me.options.rsInstance,
                    savedParameters: params,
                    userSettings: me._getUserSettings()
                });

                var $reportViewer = layout.$mainviewport.reportViewerEZ("getReportViewer");
                if ($reportViewer && path !== null) {
                    path = String(path).replace(/%2f/g, "/");
                    $reportViewer.reportViewer("loadReport", path, 1, params);
                    layout.$mainsection.fadeIn("fast");
                }

            }, timeout);

            me.element.css("background-color", "");
        },
        _transitionToDashboard: function (path, enableEdit) {
            var me = this;
            var layout = me.DefaultAppTemplate;

            layout.$mainsection.html("");
            forerunner.dialog.closeAllModalDialogs(me.DefaultAppTemplate.$container);

            me.DefaultAppTemplate._selectedItemPath = null;
            //Android and iOS need some time to clean prior scroll position, I gave it a 50 milliseconds delay
            //To resolved bug 909, 845, 811 on iOS
            var timeout = forerunner.device.isWindowsPhone() ? 500 : forerunner.device.isTouch() ? 50 : 0;
            setTimeout(function () {
                var $dashboardEZ = me.DefaultAppTemplate.$mainviewport.dashboardEZ({
                    DefaultAppTemplate: layout,
                    navigateTo: me.options.navigateTo,
                    historyBack: me.options.historyBack,
                    isReportManager: true,
                    enableEdit: enableEdit,
                    rsInstance: me.options.rsInstance,
                    userSettings: me._getUserSettings()
                });

                var $dashboardEditor = $dashboardEZ.dashboardEZ("getDashboardEditor");
                if (enableEdit) {
                    $dashboardEditor.dashboardEditor("editDashboard", path);
                } else {
                    $dashboardEditor.dashboardEditor("loadDefinition", path, true);
                }

                layout.$mainsection.fadeIn("fast");
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
         * @function $.forerunner.reportExplorerEZ#transitionToCreateDashboard
         * @param {String} path - Fully qualified path to the dashboard
         */
        transitionToCreateDashboard: function (path) {
            var me = this;
            me._transitionToDashboard(path, true);
        },
        _init: function () {
            var me = this;
            me.DefaultAppTemplate = new forerunner.ssr.DefaultAppTemplate({ $container: me.element, isFullScreen: me.isFullScreen }).render();

            if (!me.options.navigateTo) {
                me._initNavigateTo();
            }
        },
        /**
         * Get report explorer
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
         * Get report explorer toolbar
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
         * Get report explorer toolpane
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