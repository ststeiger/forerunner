﻿/**
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
     * @prop {Object} options - The options for reportExplorerEZ
     * @prop {Object} options.navigateTo - Callback function used to navigate to a selected report
     * @prop {Object} options.historyBack - Callback function used to go back in browsing history
	 * @prop {Boolean} options.isFullScreen - Indicate is full screen mode default by true
	 * @prop {Object} options.explorerSettings - Object that stores custom explorer style settings
     * @prop {String} options.rsInstance - Report service instance name
     * @example
     * $("#reportExplorerEZId").reportExplorerEZ({
     *  navigateTo: me.navigateTo,
     *  historyBack: me.historyBack,
     *  explorerSettings: explorerSettings
     * });
     */
    $.widget(widgets.getFullname(widgets.reportExplorerEZ), /** @lends $.forerunner.reportExplorerEZ */ {
        options: {
            navigateTo: null,
            historyBack: null,
            isFullScreen: true,
            explorerSettings: null,
            rsInstance: null,
            isAdmin:false,
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
                isAdmin: me.options.isAdmin,
            });            
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
            if (me.DefaultAppTemplate.$mainsection.html() !== "" && me.DefaultAppTemplate.$mainsection.html() !== null) {
                me.DefaultAppTemplate.$mainsection.html("");
                me.DefaultAppTemplate.$mainsection.hide();
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
                $toolbar.reportExplorerToolbar({
                    navigateTo: me.options.navigateTo,
                    $appContainer: layout.$container,
                    $reportExplorer: me.$reportExplorer
                });
                $toolbar.reportExplorerToolbar("setFolderBtnActive", viewToBtnMap[view]);

                layout.$rightheader.height(layout.$topdiv.height());
                layout.$leftheader.height(layout.$topdiv.height());
                layout.$rightheaderspacer.height(layout.$topdiv.height());
                layout.$leftheaderspacer.height(layout.$topdiv.height());

                layout._selectedItemPath = path0; //me._selectedItemPath = path0;
                var explorer = $('.fr-report-explorer', me.$reportExplorer);
                me.element.css("background-color", explorer.css("background-color"));
            }, timeout);
        },
        /**
         * Transition to ReportViewer view
         *
         * @function $.forerunner.reportExplorerEZ#transitionToReportView
         * @param {String} path - The report path to display.
         */
        transitionToReportViewer: function (path, params) {
            var me = this;

            // We need to create the report explorer here so as to get the UserSettings needed in the case where
            // the user navigates directly to a report via the URL
            me.DefaultAppTemplate.$mainsection.html("");
            me.DefaultAppTemplate.$mainsection.hide();
            forerunner.dialog.closeAllModalDialogs(me.DefaultAppTemplate.$container);

            me.DefaultAppTemplate._selectedItemPath = null;
            //Android and iOS need some time to clean prior scroll position, I gave it a 50 milliseconds delay
            //To resolved bug 909, 845, 811 on iOS
            var timeout = forerunner.device.isWindowsPhone() ? 500 : forerunner.device.isTouch() ? 50 : 0;
            setTimeout(function () {
                me.DefaultAppTemplate.$mainviewport.reportViewerEZ({
                    DefaultAppTemplate: me.DefaultAppTemplate,
                    path: path,
                    navigateTo: me.options.navigateTo,
                    historyBack: me.options.historyBack,
                    isReportManager: true,
                    rsInstance: me.options.rsInstance,
                    savedParameters: params,
                });

                var $reportViewer = me.DefaultAppTemplate.$mainviewport.reportViewerEZ("getReportViewer");
                if ($reportViewer && path !== null) {
                    path = String(path).replace(/%2f/g, "/");

                    $reportViewer.reportViewer("loadReport", path, 1, params);
                    me.DefaultAppTemplate.$mainsection.fadeIn("fast");
                }
            }, timeout);

            me.element.css("background-color", "");
        },
        _init: function () {
            var me = this;
            me.DefaultAppTemplate = new forerunner.ssr.DefaultAppTemplate({ $container: me.element, isFullScreen: me.isFullScreen }).render();
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
        }
    });  // $.widget
});  // function()