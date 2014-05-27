// Assign or create the single globally scoped variable
var forerunner = forerunner || {};

// Forerunner SQL Server Reports
forerunner.ssr = forerunner.ssr || {};

$(function () {
    var widgets = forerunner.ssr.constants.widgets;
    var dtb = forerunner.ssr.tools.dashboardToolbar;
    var dbtp = forerunner.ssr.tools.dashboardToolPane;
    var tg = forerunner.ssr.tools.groups;

    /**
    * Widget used to create and edit dashboards
    *
    * @namespace $.forerunner.dashboardEZ
    * @prop {Object} options - The options
    * @prop {Object} options.DefaultAppTemplate -- The helper class that creates the app template.  If it is null, the widget will create its own.
    * @prop {Object} options.navigateTo - Callback function used to navigate to a path and view
    * @prop {Object} options.historyBack - Callback function used to go back in browsing history
    * @prop {Boolean} options.isFullScreen - A flag to determine whether show report viewer in full screen. Default to true.
    * @prop {Boolean} options.isReportManager - A flag to determine whether we should render report manager integration items.  Defaults to false.
    * @prop {Boolean} options.enableEdit - Enable the dashboard for create and / or editing. Default to true.
    *
    * @example
    * $("#dashboardEZId").dashboardEZ({
    * });
    */
    $.widget(widgets.getFullname(widgets.dashboardEZ), {
        options: {
            DefaultAppTemplate: null,
            navigateTo: null,
            historyBack: null,
            isFullScreen: true,
            isReportManager: false,
            enableEdit: true
        },
        _init: function () {
            var me = this;
            me._super();

            if (me.options.DefaultAppTemplate === null) {
                me.layout = new forerunner.ssr.DefaultAppTemplate({ $container: me.element, isFullScreen: me.options.isFullScreen }).render();
            } else {
                me.layout = me.options.DefaultAppTemplate;
            }

            forerunner.device.allowZoom(false);
            me.layout.$mainsection.html(null);

            var $dashboardContainer = $("<div class='fr-dashboard-container'></div>");
            me.layout.$mainsection.append($dashboardContainer);

            var $dashboardWidget = null;
            if (me.options.enableEdit) {
                $dashboardWidget = $dashboardContainer.dashboardEditor({
                    navigateTo: me.options.navigateTo,
                    historyBack: me.options.historyBack,
                    $appContainer: me.layout.$container
                });
            } else {
                $dashboardWidget = $dashboardContainer.dashboardViewer({
                    navigateTo: me.options.navigateTo,
                    historyBack: me.options.historyBack,
                    $appContainer: me.layout.$container
                });
            }

            var $toolbar = me.layout.$mainheadersection;
            $toolbar.dashboardToolbar({
                navigateTo: me.options.navigateTo,
                $appContainer: me.layout.$container,
                $dashboardEZ: me,
                $dashboardEditor: me.getDashboardEditor(),
                enableEdit: me.options.enableEdit
            });

            var $lefttoolbar = me.layout.$leftheader;
            if ($lefttoolbar !== null) {
                $lefttoolbar.leftToolbar({ $appContainer: me.layout.$container });
            }

            var $toolpane = me.layout.$leftpanecontent;
            $toolpane.dashboardToolPane({
                navigateTo: me.options.navigateTo,
                $appContainer: me.layout.$container,
                $dashboardEZ: me,
                $dashboardEditor: me.getDashboardEditor(),
                enableEdit: me.options.enableEdit
            });

            
            if (me.options.isReportManager) {
                var listOfButtons = [dtb.btnHome, dtb.btnRecent, dtb.btnFavorite];
                if (forerunner.ajax.isFormsAuth()) {
                    listOfButtons.push(dtb.btnLogOff);
                }
                $toolbar.dashboardToolbar("addTools", 4, true, listOfButtons);
                $toolpane.dashboardToolPane("addTools", 1, true, [dbtp.itemFolders, tg.dashboardItemFolderGroup, dbtp.itemBack]);
            }

            me.layout.$rightheaderspacer.height(me.layout.$topdiv.height());
            me.layout.$leftheaderspacer.height(me.layout.$topdiv.height());
        },
        /**
         * Get dashboard viewer
         *
         * @function $.forerunner.dashboardEZ#getDashboardViewer
         * 
         * @return {Object} - dashboard viewer jQuery object
         */
        getDashboardViewer: function () {
            var me = this;
            return me.getDashboardEditor();
        },
        /**
         * Get dashboard editor
         *
         * @function $.forerunner.dashboardEZ#getDashboardEditor
         * 
         * @return {Object} - dashboard editor jQuery object
         */
        getDashboardEditor: function () {
            var me = this;

            if (me.layout) {
                var $dashboard = me.layout.$mainsection.find(".fr-dashboard-container");
                if ($dashboard.length !== 0) {
                    return $dashboard;
                }
            }

            return null;
        },
        /**
         * Get report viewer toolbar
         *
         * @function $.forerunner.dashboardEZ#getToolbar
         * 
         * @return {Object} - toolbar jQuery object
         */
        getToolbar: function () {
            var me = this;
            if (me.layout) {
                return me.layout.$mainheadersection;
            }

            return null;
        },
        /**
         * Get report viewer toolpane
         *
         * @function $.forerunner.dashboardEZ#getToolPane
         * 
         * @return {Object} - toolpane jQuery object
         */
        getToolPane: function () {
            var me = this;
            if (me.layout) {
                return me.layout.$leftpanecontent;
            }

            return null;
        },
    });  // $.widget

});  // function()
