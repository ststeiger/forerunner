/**
 * @file Contains the dashboardBase widget.
 *
 */

var forerunner = forerunner || {};
forerunner.ssr = forerunner.ssr || {};

$(function () {
    var widgets = forerunner.ssr.constants.widgets;
    var events = forerunner.ssr.constants.events;

    /**
     * The dashboardBase widget is used as a base namespace for dashboardEditor and
     * dashboardViewer
     *
     * @namespace $.forerunner.dashboardBase
     * @prop {Object} options - The options for dashboardBase
     * @prop {String} options.dashboardState - The dashboardState holds the complete
     *                                         state of the dashboard editing and / or
     *                                         viewing experience.
     */
    $.widget(widgets.getFullname(widgets.dashboardBase), {
        options: {
        },
        _init: function () {
            var me = this;
            me._clearState();
            me.element.html("");
        },
        _clearState: function () {
            var me = this;
            me.dashboardDef = {
                templateName: null,
                template: null,
                reports: {}
            };
        },
        getReportProperties: function (reportId) {
            var me = this;
            return me.dashboardDef.reports[reportId];
        },
        setReportProperties: function (reportId, properties) {
            var me = this;
            me.dashboardDef.reports[reportId] = properties;
        }
    });  // $widget
});  // function()
