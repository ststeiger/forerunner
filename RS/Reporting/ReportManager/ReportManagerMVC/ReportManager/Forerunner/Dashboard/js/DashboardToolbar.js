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
        _init: function () {
            var me = this;
            me._super(); //Invokes the method of the same name from the parent widget

            me.element.html("<div class='" + me.options.toolClass + " fr-core-widget'/>");
            me.addTools(1, true, [dtb.btnMenu, dtb.btnBack, dtb.btnSave]);

            //trigger window resize event to regulate toolbar buttons visibility
            $(window).resize();
        },
        _destroy: function () {
        },
        _create: function () {
            var me = this;
            $(window).resize(function () {
                me.onWindowResize.call(me);
            });
        },
    });  // $.widget
});  // function()
