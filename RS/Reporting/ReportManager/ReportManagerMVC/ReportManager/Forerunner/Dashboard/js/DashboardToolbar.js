/**
 * @file Contains the toolbar widget.
 *
 */

var forerunner = forerunner || {};
forerunner.ssr = forerunner.ssr || {};
forerunner.ssr.tools = forerunner.ssr.tools || {};
forerunner.ssr.tools.toolbar = forerunner.ssr.tools.dashboardToolbar || {};

$(function () {
    // Useful namespaces
    var widgets = forerunner.ssr.constants.widgets;
    var events = forerunner.ssr.constants.events;
    var dtb = forerunner.ssr.tools.dashboardToolbar;
    var mi = forerunner.ssr.tools.mergedButtons;
    var locData = forerunner.localize.getLocData(forerunner.config.forerunnerFolder() + "ReportViewer/loc/ReportViewer");

    /**
     * Toobar widget used by the dashboard
     *
     * @namespace $.forerunner.dashboardToolbar
     * @prop {Object} options - The options
     * @prop {Object} options.navigateTo - Callback function used to navigate to a path and view
     * @prop {Object} options.$appContainer - Container for the dashboardEditor widget
     * @prop {Object} options.$dashboardEZ - dashboardEZ widget
     * @prop {Boolean} options.enableEdit - Enable the dashboard for create and / or editing. Default to true.
     * @prop {String} options.toolClass - The top level class for this tool (E.g., fr-dashboard-toolbar)
     * @example
     * $("#dashboardToolbarId").dashboardToolbar({
     *      navigateTo: me.options.navigateTo,
     *      $appContainer: layout.$container,
     *      $dashboardEZ: me.dashboardEZ,
     *      enableEdit: me.options.enableEdit
     * });
     *
     * Note:
     *  Toolbar can be extended by calling the addTools method defined by {@link $.forerunner.toolBase}
     */
    $.widget(widgets.getFullname(widgets.dashboardToolbar), $.forerunner.toolBase, /** @lends $.forerunner.toolbar */ {
        options: {
            navigateTo: null,
            $appContainer: null,
            $dashboardEZ: null,
            enableEdit: true,
            toolClass: "fr-dashboard-toolbar"
        },
        /**
         * Show the edit or view UI
         *
         * @function $.forerunner.dashboardToolbar#enableEdit
         * @param {bool} enableEdit - true = enable, false = view
         */
        enableEdit: function (enableEdit) {
            var me = this;

            me.hideTool(dtb.btnEdit.selectorClass);
            me.hideTool(dtb.btnView.selectorClass);

            if (!me._isAdmin()) {
                return;
            }

            if (!enableEdit) {
                var $dashboardEditor = me.options.$dashboardEZ.dashboardEZ("getDashboardEditor");
                var path = $dashboardEditor.dashboardEditor("getPath");

                if (path) {
                    var permissions = me.options.$dashboardEZ.dashboardEZ("getPermission");
                    if (permissions["Update Content"] === true) {
                        // If the user has update resource permission for this dashboard, we will enable the edit button
                        me.showTool(dtb.btnEdit.selectorClass);
                        return;
                    }
                }
            } else {
                me.showTool(dtb.btnView.selectorClass);
            }
        },
        _isAdmin: function () {
            var me = this;
            var userSettings = me.options.$dashboardEZ.dashboardEZ("getUserSettings");
            if (userSettings && userSettings.adminUI && userSettings.adminUI === true) {
                return true;
            }
            return false;
        },
        _init: function () {
            var me = this;
            me._super(); //Invokes the method of the same name from the parent widget

            me.element.html("<div class='" + me.options.toolClass + " fr-core-toolbar fr-core-widget'/>");
            me.removeAllTools();

            me.addTools(1, true, [dtb.btnMenu, mi.btnFav, dtb.btnEdit, dtb.btnView]);
            me.enableEdit(me.options.enableEdit);

            //trigger window resize event to regulate toolbar buttons visibility
            //$(window).resize();
            me.windowResize();
        },
        _destroy: function () {
        },
        _create: function () {
        },
    });  // $.widget
});  // function()
