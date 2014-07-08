// Assign or create the single globally scoped variable
var forerunner = forerunner || {};

// Forerunner SQL Server Reports
forerunner.ssr = forerunner.ssr || {};

$(function () {
    var widgets = forerunner.ssr.constants.widgets;
    var dtb = forerunner.ssr.tools.dashboardToolbar;
    var dtp = forerunner.ssr.tools.dashboardToolPane;
    var tg = forerunner.ssr.tools.groups;
    var helper = forerunner.helper;

    /**
    * Widget used to create and edit dashboards
    *
    * @namespace $.forerunner.dashboardEZ
    * @prop {Object} options - The options
    * @prop {Object} options.DefaultAppTemplate -- The helper class that creates the app template.
    * @prop {Object} options.parentFolder - Fully qualified URL of the parent folder
    * @prop {Object} options.navigateTo - Callback function used to navigate to a path and view
    * @prop {Object} options.historyBack - Callback function used to go back in browsing history
    * @prop {Boolean} options.isFullScreen - A flag to determine whether show report viewer in full screen. Default to true.
    * @prop {Boolean} options.isReportManager - A flag to determine whether we should render report manager integration items.  Defaults to false.
    * @prop {Boolean} options.enableEdit - Enable the dashboard for create and / or editing. Default to true.
    * @prop {String} options.rsInstance - Optional, Report service instance name
    * @prop {String} options.rsInstance - Optional, User specific options
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
            enableEdit: true,
            rsInstance: null,
            userSettings: null,
            path: null,
            handleWindowResize: true
        },
        /**
         * Returns the user settings
         *
         * @function $.forerunner.dashboardEZ#getUserSettings
         */
        getUserSettings: function () {
            var me = this;
            return me.options.userSettings;
        },
        /**
         * Show the edit or view UI
         *
         * @function $.forerunner.dashboardEZ#enableEdit
         * @param {bool} enableEdit - true = enable, false = view
         */
        enableEdit: function (enableEdit) {
            var me = this;
            me.options.enableEdit = enableEdit;

            // Set the tools to the correct edit mode
            me.$toolbar.dashboardToolbar("enableEdit", enableEdit);
            me.$toolpane.dashboardToolPane("enableEdit", enableEdit);

            var $dashboardEditor = me.getDashboardEditor();
            $dashboardEditor.dashboardEditor("openDashboard", null, enableEdit);
        },
        _create: function () {
            var me = this;
            if (me.options.handleWindowResize) {
                $(window).on("resize", function (e, data) {
                    helper.delay(me, function () {
                        me.windowResize.call(me);
                    });
                });
            }
        },
        /**
         * Call this function when the handleWindowResize is set to false. It
         * handles the updating of the dashboard viewer, and associated widget, sizes.
         *
         * @function $.forerunner.dashboardEZ#windowResize
         */
        windowResize: function () {
            var me = this;
            if (me.options.DefaultAppTemplate === null) {
                me.layout.windowResize.call(me.layout);
            }

            var $dashboardEditor = me.getDashboardEditor();
            if (widgets.hasWidget($dashboardEditor, widgets.dashboardEditor)) {
                $dashboardEditor.dashboardEditor("windowResize");
            }

            var $dashboardToolbar = me.getDashboardToolbar();
            if (widgets.hasWidget($dashboardToolbar, widgets.dashboardToolbar)) {
                $dashboardToolbar.dashboardToolbar("windowResize");
            }
        },
        _init: function () {
            var me = this;
            me._super();

            if (me.options.DefaultAppTemplate === null) {
                me.layout = new forerunner.ssr.DefaultAppTemplate({
                    $container: me.element,
                    isFullScreen: me.options.isFullScreen
                }).render();
            } else {
                me.layout = me.options.DefaultAppTemplate;
            }

            me._checkPermission();

            forerunner.device.allowZoom(false);
            me.layout.$mainsection.html(null);

            me.$dashboardContainer = $("<div class='fr-dashboard'></div>");
            me.layout.$mainsection.append(me.$dashboardContainer);
            me.$dashboardContainer.dashboardEditor({
                $appContainer: me.layout.$container,
                navigateTo: me.options.navigateTo,
                historyBack: me.options.historyBack,
                rsInstance: me.options.rsInstance,
                handleWindowResize: false
            });

            me.$toolbar = me.layout.$mainheadersection;
            me.$toolbar.dashboardToolbar({
                navigateTo: me.options.navigateTo,
                $appContainer: me.layout.$container,
                $dashboardEZ: me.element,
                $dashboardEditor: me.getDashboardEditor(),
                enableEdit: me.options.enableEdit
            });

            var $lefttoolbar = me.layout.$leftheader;
            if ($lefttoolbar !== null) {
                $lefttoolbar.leftToolbar({ $appContainer: me.layout.$container });
            }

            me.$toolpane = me.layout.$leftpanecontent;
            me.$toolpane.dashboardToolPane({
                navigateTo: me.options.navigateTo,
                $appContainer: me.layout.$container,
                $dashboardEZ: me.element,
                $dashboardEditor: me.getDashboardEditor(),
                enableEdit: me.options.enableEdit
            });

            if (me.options.isReportManager) {
                var listOfButtons = [];

                if (forerunner.config.getCustomSettingsValue("showHomeButton") === "on") {
                    listOfButtons.push(dtb.btnHome);
                }
                listOfButtons.push(dtb.btnRecent, dtb.btnFavorite);

                if (forerunner.ajax.isFormsAuth()) {
                    listOfButtons.push(dtb.btnLogOff);
                }
                me.$toolbar.dashboardToolbar("addTools", 4, true, listOfButtons);
                me.$toolpane.dashboardToolPane("addTools", 1, true, [dtp.itemFolders, tg.dashboardItemFolderGroup]);
            }

            if (me.options.historyBack) {
                me.$toolbar.dashboardToolbar("addTools", 2, true, [dtb.btnBack]);
                me.$toolpane.dashboardToolPane("addTools", 3, true, [dtp.itemBack]);
            }

            me.layout.$rightheaderspacer.height(me.layout.$topdiv.height());
            me.layout.$leftheaderspacer.height(me.layout.$topdiv.height());
        },
        _checkPermission: function () {
            var me = this;
            //Update Content: update resource content (dashboard)
            //for more properties, add to the list
            var permissionList = ["Update Content", "Update Properties"];
            me.permissions = forerunner.ajax.hasPermission(me.options.path, permissionList.join(","));
        },
        /**
         * Get current path user permission
         *
         * @function $.forerunner.dashboardEZ#getPermission
         * 
         * @return {Object} - permission jQuery object
         */
        getPermission: function () {
            var me = this;
            return me.permissions;
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
                var $dashboard = me.layout.$mainsection.find(".fr-dashboard");
                if ($dashboard.length !== 0) {
                    return $dashboard;
                }
            }

            return null;
        },
        /**
         * Get report viewer toolbar
         *
         * @function $.forerunner.dashboardEZ#getDashboardToolbar
         * 
         * @return {Object} - toolbar jQuery object
         */
        getDashboardToolbar: function () {
            var me = this;
            if (me.layout) {
                return me.layout.$mainheadersection;
            }

            return null;
        },
        /**
         * Get report viewer toolpane
         *
         * @function $.forerunner.dashboardEZ#getDashboardToolPane
         * 
         * @return {Object} - toolpane jQuery object
         */
        getDashboardToolPane: function () {
            var me = this;
            if (me.layout) {
                return me.layout.$leftpanecontent;
            }

            return null;
        },
    });  // $.widget

});  // function()
