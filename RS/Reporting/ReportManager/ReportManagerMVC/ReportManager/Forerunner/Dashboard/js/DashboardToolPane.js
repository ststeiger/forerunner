﻿/**
 * @file Contains the toolPane widget.
 *
 */

var forerunner = forerunner || {};
forerunner.ssr = forerunner.ssr || {};

$(function () {
    var widgets = forerunner.ssr.constants.widgets;
    var events = forerunner.ssr.constants.events;
    var dbtp = forerunner.ssr.tools.dashboardToolPane;
    var locData = forerunner.localize.getLocData(forerunner.config.forerunnerFolder() + "ReportViewer/loc/ReportViewer");

    /**
     * ToolPane widget used with the dashboard
     *
     * @namespace $.forerunner.dashboardToolPane
     * @prop {Object} options.navigateTo - Callback function used to navigate to a path and view
     * @prop {Object} options.$appContainer - Container for the dashboardEditor widget
     * @prop {Object} options.$dashboardEZ - dashboardEZ widget
     * @prop {Boolean} options.enableEdit - Enable the dashboard for create and / or editing. Default to true.
     * @prop {String} options.toolClass - The top level class for this tool (E.g., fr-dashboard-toolbar)
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
            if (enableEdit) {
                me.showTool(dbtp.itemView.selectorClass);
                me.hideTool(dbtp.itemEdit.selectorClass);
            } else {
                me.hideTool(dbtp.itemView.selectorClass);
                me.showTool(dbtp.itemEdit.selectorClass);
            }
        },
        _init: function () {
            var me = this;
            me._super();

            me.element.html("<div class='" + me.options.toolClass + " fr-core-widget' />");
            me.removeAllTools();

            me.addTools(2, true, [dbtp.itemSave, dbtp.itemEdit, dbtp.itemView]);
            me.enableEdit(me.options.enableEdit);
            
            var $spacerdiv = new $("<div />");
            $spacerdiv.attr("style", "height:65px");
            me.element.append($spacerdiv);
        },
    });  // $.widget
});  // function()
