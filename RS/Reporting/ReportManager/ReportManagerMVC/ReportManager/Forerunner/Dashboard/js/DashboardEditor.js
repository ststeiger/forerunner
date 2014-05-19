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
     * @prop {String} options.reportManagerAPI - Path to the REST calls for the reportManager
     * @prop {Object} options.navigateTo - Optional, Callback function used to navigate to a selected report
     * @prop {Object} options.historyBack - Optional,Callback function used to go back in browsing history
     * @prop {Object} options.$appContainer - Dashboard container
     */
    $.widget(widgets.getFullname(widgets.dashboardEditor), $.forerunner.dashboardBase /** @lends $.forerunner.dashboardEditor */, {
        options: {
            reportManagerAPI: forerunner.config.forerunnerAPIBase() + "ReportManager/",
            navigateTo: null,
            historyBack: null,
            $appContainer: null
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
            var me = this;
            var $dlg = me.options.$appContainer.find(".fr-rp-section");
            if ($dlg.length === 0) {
                $dlg = $("<div class='fr-rp-section fr-dialog-id fr-core-dialog-layout fr-core-widget'/>");
                me.options.$appContainer.append($dlg);
            }
            $dlg.reportProperties({
                reportManagerAPI: me.options.reportManagerAPI,
                $appContainer: me.options.$appContainer
            });
            $dlg.reportProperties("openDialog");
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
