/**
 * @file Contains the reportViewer widget.
 *
 */

var forerunner = forerunner || {};
forerunner.ssr = forerunner.ssr || {};

$(function () {
    var widgets = forerunner.ssr.constants.widgets;
    var events = forerunner.ssr.constants.events;

    /**
     * Widget used to create and edit dashboards
     *
     * @namespace $.forerunner.dashboardEditor
     * @prop {Object} options - The options for dashboardEditor
     * @prop {String} options.reportViewerAPI - Path to the REST calls for the reportViewer
     */
    $.widget(widgets.getFullname(widgets.dashboardEditor), $.forerunner.dashboardBase /** @lends $.forerunner.dashboardEditor */, {
        options: {
            reportViewerAPI: forerunner.config.forerunnerAPIBase() + "ReportManager",
        },
        loadTemplate: function (templateName) {
            var me = this;
            var template = forerunner.localize.getLocData(forerunner.config.forerunnerFolder() + "Dashboard/dashboards/" + templateName, "text");
            me.dashboardDef.template = template;
            me._renderTemplate();
        },
        _renderTemplate: function () {
            var me = this;
            me.element.html(me.dashboardDef.template);
        },
        _create: function () {
        },
        _init: function () {
            var me = this;
            me._super();
        },
        _destroy: function () {
        }
    });  // $.widget
});   // $(function
