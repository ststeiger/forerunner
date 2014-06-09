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
     * @prop {Object} options - The options for dashboardViewer
     * @prop {Object} options.$appContainer - Dashboard container
     * @prop {Object} options.navigateTo - Optional, Callback function used to navigate to a selected report
     * @prop {Object} options.historyBack - Optional,Callback function used to go back in browsing history
     * @prop {String} options.reportManagerAPI - Optional, Path to the REST calls for the reportManager
     * @prop {String} options.rsInstance - Optional, Report service instance name
     */
    $.widget(widgets.getFullname(widgets.dashboardViewer), {
        options: {
            $appContainer: null,
            navigateTo: null,
            historyBack: null,
            reportManagerAPI: forerunner.config.forerunnerAPIBase() + "ReportManager/",
            rsInstance: null
        },
        _create: function () {
            var me = this;
            me.model = new forerunner.ssr.DashboardModel({
                $appContainer: me.options.$appContainer,
                reportManagerAPI: me.options.reportManagerAPI,
                rsInstance: me.options.rsInstance
            });
        },
        _init: function () {
            var me = this;
            me.model.clearState();
            me.element.html("");
        },
        loadDefinition: function (path, hideMissing) {
            var me = this;

            // Clear the html in case of an error
            me.element.html("");

            if (path) {
                // Load the given report definition
                var loaded = me._loadResource(path);
                if (!loaded) {
                    return;
                }
            }

            // Render the template and load the reports
            me.element.html(me.model.dashboardDef.template);
            me.element.find(".fr-dashboard-report-id").each(function (index, item) {
                me._loadReport(item.id, hideMissing);
            });
        },
        getParentFolder: function () {
            return me.parentFolder;
        },
        getDashboardName: function () {
            return me.dashboardName;
        },
        getReportProperties: function (reportId) {
            var me = this;
            return me.model.dashboardDef.reports[reportId];
        },
        setReportProperties: function (reportId, properties) {
            var me = this;
            me.model.dashboardDef.reports[reportId] = properties;
        },
        _loadReport: function (reportId, hideMissing) {
            var me = this;
            var $item = me.element.find("#" + reportId);
            $item.removeClass("fr-dashboard-hide");

            // If we have a report definition, load the report
            if (me.model.dashboardDef.reports[reportId]) {
                $item.reportViewerEZ({
                    navigateTo: me.options.navigateTo,
                    historyBack: null,
                    isReportManager: false,
                    isFullScreen: false
                });

                var catalogItem = me.model.dashboardDef.reports[reportId].catalogItem;
                var $reportViewer = $item.reportViewerEZ("getReportViewer");
                $reportViewer.reportViewer("loadReport", catalogItem.Path);
            } else if (hideMissing) {
                $item.addClass("fr-dashboard-hide");
            }
        },
        _getName: function (path) {
            if (!path) return null;

            var lastIndex = path.lastIndexOf("/");
            if (lastIndex === -1) return path;
            return path.slice(lastIndex + 1);
        },
        _getFolder: function (path) {
            if (!path) return null;

            var lastIndex = path.lastIndexOf("/");
            if (lastIndex === -1) return null;
            return path.slice(0, lastIndex + 1);
        },
        _loadResource: function (path) {
            var me = this;
            var status = false;

            // Set the parent folder and dashboard name properties
            me.dashboardName = me._getName(path);
            me.parentFolder = me._getFolder(path);

            // Fetch the model from the server
            return me.model.fetch(path);
        },
        _destroy: function () {
        },
    });  // $.widget
});   // $(function


