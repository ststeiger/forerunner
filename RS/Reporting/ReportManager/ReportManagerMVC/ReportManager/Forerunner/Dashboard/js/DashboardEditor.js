/**
 * @file Contains the reportViewer widget.
 *
 */

var forerunner = forerunner || {};
forerunner.ssr = forerunner.ssr || {};

$(function () {
    var widgets = forerunner.ssr.constants.widgets;
    var events = forerunner.ssr.constants.events;
    var locData = forerunner.localize.getLocData(forerunner.config.forerunnerFolder() + "ReportViewer/loc/ReportViewer");
    var dashboardEditor = locData.dashboardEditor;

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
            me.element.find(".fr-dashboard-report-id").each(function (index, item) {
                // Create the button
                var $btn = $("<input type=button class='fr-dashboard-btn' value='" + dashboardEditor.propertiesBtn + "' name='" + item.id + "'/>");
                var $item = $(item);
                $item.append($btn);

                // Hook the onClick event
                $btn.on("click", function (e) {
                    me._onClickProperties.apply(me, arguments);
                });

                // Position the button
                var left = $item.width() / 2 - ($btn.width() / 2);
                var top = $item.height() / 2 - ($btn.height() / 2);
                $btn.css({position: "absolute", left:left + "px", top: top + "px"});
            });
        },
        _onClickProperties: function (e) {
            alert("_onClickProperties - name: " + e.target.name);
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
