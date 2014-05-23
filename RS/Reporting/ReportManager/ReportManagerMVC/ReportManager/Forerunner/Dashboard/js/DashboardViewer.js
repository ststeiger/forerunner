/**
 * @file Contains the dashboardViewer widget.
 *
 */

var forerunner = forerunner || {};
forerunner.ssr = forerunner.ssr || {};

$(function () {
    var widgets = forerunner.ssr.constants.widgets;
    var events = forerunner.ssr.constants.events;

    /**
     * Widget used to view dashboards
     *
     * @namespace $.forerunner.dashboardViewer
     * @prop {Object} options - The options for dashboardEditor
     * @prop {String} options.reportViewerAPI - Path to the REST calls for the reportViewer
     */
    $.widget(widgets.getFullname(widgets.dashboardViewer), $.forerunner.dashboardBase /** @lends $.forerunner.dashboardViewer */, {
        options: {
            reportViewerAPI: forerunner.config.forerunnerAPIBase() + "ReportManager",
        },
        _create: function () {
            var me = this;
        },
        _init: function () {
            var me = this;
            me._super();
        },
        _destroy: function () {
        },
    });  // $.widget
});   // $(function


