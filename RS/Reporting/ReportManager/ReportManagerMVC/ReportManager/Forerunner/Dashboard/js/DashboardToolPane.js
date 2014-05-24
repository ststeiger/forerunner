/**
 * @file Contains the toolPane widget.
 *
 */

var forerunner = forerunner || {};
forerunner.ssr = forerunner.ssr || {};

$(function () {
    var widgets = forerunner.ssr.constants.widgets;
    var events = forerunner.ssr.constants.events;
    var dtp = forerunner.ssr.tools.dashboardToolpane;
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
        _init: function () {
            var me = this;
            me._super();

            me.element.html("");
            var $toolpane = new $("<div class='" + me.options.toolClass + " fr-core-widget' />");
            $(me.element).append($toolpane);
            
            me.addTools(1, false, [dtp.itemSave]);
            
            var $spacerdiv = new $("<div />");
            $spacerdiv.attr("style", "height:65px");
            $toolpane.append($spacerdiv);
        },
    });  // $.widget
});  // function()
