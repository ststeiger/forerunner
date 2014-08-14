/**
 * @file Contains the toolPane widget.
 *
 */

var forerunner = forerunner || {};
forerunner.ssr = forerunner.ssr || {};

$(function () {
    var widgets = forerunner.ssr.constants.widgets;
    var events = forerunner.ssr.constants.events;
    var dbtp = forerunner.ssr.tools.dashboardToolPane;
    var mi = forerunner.ssr.tools.mergedItems;
    var locData = forerunner.localize.getLocData(forerunner.config.forerunnerFolder() + "ReportViewer/loc/ReportViewer");

    /**
     * ToolPane widget used with the dashboard
     *
     * @namespace $.forerunner.dashboardToolPane
     * @prop {Object} options.navigateTo - Callback function used to navigate to a path and view
     * @prop {Object} options.$appContainer - Container for the dashboardEditor widget
     * @prop {Object} options.$dashboardEZ - dashboardEZ widget
     * @prop {Boolean} options.enableEdit - Enable the dashboard for create and / or editing. Default to true.
     * @prop {String} options.toolClass - The top level class for this tool (E.g., fr-dashboard-toolpane)
     * @example
     * $("#dashboardToolPaneId").dashboardToolPane({
     * });
     *
     * Note:
     *  ToolPane can be extended by calling the addTools method defined by {@link $.forerunner.toolBase}
     */
    $.widget(widgets.getFullname(widgets.dashboardToolPane), $.forerunner.toolBase, {
        options: {
            navigateTo: null,
            $appContainer: null,
            $dashboardEZ: null,
            enableEdit: true,
            toolClass: "fr-dashboard-toolpane"
        },
        /**
         * Show the edit or view UI
         *
         * @function $.forerunner.dashboardToolPane#enableEdit
         * @param {bool} enableEdit - true = enable, false = view
         */
        enableEdit: function (enableEdit) {
            var me = this;

            me.hideTool(dbtp.itemEdit.selectorClass);
            me.hideTool(dbtp.itemView.selectorClass);

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
                        me.showTool(dbtp.itemEdit.selectorClass);
                        return;
                    }
                }
            } else {
                me.showTool(dbtp.itemView.selectorClass);
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
            me._super();

            me.element.html("<div class='" + me.options.toolClass + " fr-core-widget' />");
            me.removeAllTools();

            var toolItemList = [dbtp.itemEdit, dbtp.itemView];
            if (me._isAdmin()) {
                toolItemList.push(mi.itemProperty);
            }

            me.addTools(2, true, toolItemList);
            me.enableEdit(me.options.enableEdit);
            
            var $spacerdiv = new $("<div />");
            $spacerdiv.attr("style", "height:65px");
            me.element.append($spacerdiv);

            me._updateBtnStates();
        },
        _updateBtnStates: function () {
            var me = this;
            if (me._isAdmin()) {
                me.disableTools([mi.itemProperty]);
                var permissions = me.options.$dashboardEZ.dashboardEZ("getPermission");

                if (permissions["Update Properties"]) {
                    me.enableTools([mi.itemProperty]);
                    me.removeHideDisable([mi.itemProperty]);
                }
            }
        },
    });  // $.widget
});  // function()
