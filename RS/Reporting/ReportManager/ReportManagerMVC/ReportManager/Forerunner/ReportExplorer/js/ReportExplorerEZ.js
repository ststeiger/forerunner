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