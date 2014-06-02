/**
 * @file Contains the dashboardViewer widget.
 *
 */

var forerunner = forerunner || {};
forerunner.ssr = forerunner.ssr || {};

$(function () {
    var widgets = forerunner.ssr.constants.widgets;
    var events = forerunner.ssr.constants.events;
    var locData = forerunner.localize.getLocData(forerunner.config.forerunnerFolder() + "ReportViewer/loc/ReportViewer");
    var dashboardEditor = locData.dashboardEditor;
    var toolbar = locData.toolbar;
    var messages = locData.messages;

    /**
     * Widget used to view dashboards
     *
     * @namespace $.forerunner.dashboardViewer
     * @prop {Object} options - The options for dashboardEditor
     */
    $.widget(widgets.getFullname(widgets.dashboardViewer), $.forerunner.dashboardBase /** @lends $.forerunner.dashboardViewer */, {
        options: {
        },
        _create: function () {
            var me = this;
        },
        _init: function () {
            var me = this;
            me._super();
        },
        loadDefinition: function (path) {
            var me = this;

            // Clear the html in case of an error
            me.element.html("");

            // Load the given report definition
            var loaded = me._loadResource(path);
            if (!loaded) {
                return;
            }

            // Render the template and load the reports
            me.element.html(me.dashboardDef.template);
            me.element.find(".fr-dashboard-report-id").each(function (index, item) {
                me._loadReport(item.id);
            });
        },
        _destroy: function () {
        },
    });  // $.widget
});   // $(function


