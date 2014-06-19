/**
 * @file Contains the dashboardViewer widget.
 *
 */

var forerunner = forerunner || {};
forerunner.ssr = forerunner.ssr || {};

$(function () {
    var constants = forerunner.ssr.constants;
    var widgets = constants.widgets;
    var events = constants.events;
    var locData = forerunner.localize.getLocData(forerunner.config.forerunnerFolder() + "ReportViewer/loc/ReportViewer");
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

            // For the viewer widget alone, this will always stay false
            me.enableEdit = false;
        },
        _init: function () {
            var me = this;
            me.model.clearState();
            me.element.html("");
        },
        /**
         * Loads the given dashboard definition and opens
         *
         * @function $.forerunner.dashboardEditor#loadDefinition
         * @param {String} path - Fully qualified path to the dashboard
         * @param {Bool} hideMissing - True = hide report slots that don't have a report assigned
         */
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
                me._saveTemplateSizes($(item));
                me._loadReport(item.id, hideMissing);
            });
        },
        _clearSizes: function ($item) {
            $item.css({ minWidth: "", maxWidth: "", minHeight: "", maxHeight: "" });
        },
        _resetTemplateSizes: function ($item) {
            var me = this;
            me._clearSizes($item);
            var id = $item.attr("id");
            var reportProperties = me.getReportProperties(id);
            $item.css(reportProperties.sizes);
        },
        _setCustomSize: function ($item) {
            var me = this;
            me._clearSizes($item);
            
            var id = $item.attr("id");
            var reportProperties = me.getReportProperties(id);
            me._setCustomDimension($item, reportProperties.customSize.width, "minWidth", "maxWidth");
            me._setCustomDimension($item, reportProperties.customSize.height, "minHeight", "maxHeight");
        },
        _setCustomDimension: function ($item, dimension, minString, maxString) {
            if (dimension.value > 0) {
                var length = dimension.value / dimension.slots;
                $item.css(minString, length);
                $item.css(maxString, length);
            } else {
                $item.css(minString, "");
                $item.css(maxString, "");
            }
        },
        _saveTemplateSizes: function ($item) {
            var me = this;
            var styles = $item.css(["min-width", "max-width", "min-height", "max-height"]);
            var sizes = {};
            $.each(styles, function (prop, value) {
                sizes[prop] = value;
            });
            var id = $item.attr("id");
            var reportProperties = me.getReportProperties(id);
            reportProperties.sizes = sizes;
        },
        getParentFolder: function () {
            return me.parentFolder;
        },
        getDashboardName: function () {
            return me.dashboardName;
        },
        getReportProperties: function (reportId) {
            var me = this;
            if (!me.model.dashboardDef.reports[reportId]) {
                me.model.dashboardDef.reports[reportId] = {};
            }
            return me.model.dashboardDef.reports[reportId];
        },
        setReportProperties: function (reportId, properties) {
            var me = this;
            var reportProperties = me.getReportProperties(reportId);
            $.extend(reportProperties, properties);
        },
        _loadReport: function (reportId, hideMissing) {
            var me = this;
            var reportProperties = me.model.dashboardDef.reports[reportId];

            var $item = me.element.find("#" + reportId);
            $item.css("display", "");

            $item.html("");

            // Set the report size
            if (me.enableEdit) {
                me._resetTemplateSizes($item);
            } else if (reportProperties.dashboardSizeOption) {
                if (reportProperties.dashboardSizeOption === constants.dashboardSizeOption.template) {
                    me._resetTemplateSizes($item);
                } else if (reportProperties.dashboardSizeOption === constants.dashboardSizeOption.report) {
                    me._clearSizes($item);
                } else if (reportProperties.dashboardSizeOption === constants.dashboardSizeOption.custom) {
                    me._setCustomSize($item);
                }
            }

            // If we have a report definition, load the report
            if (reportProperties && reportProperties.catalogItem) {
                $item.reportViewerEZ({
                    navigateTo: me.options.navigateTo,
                    historyBack: null,
                    isReportManager: false,
                    isFullScreen: false,
                    toolbarConfigOption: me.enableEdit ? constants.toolbarConfigOption.dashboardEdit : reportProperties.toolbarConfigOption
                });

                var catalogItem = me.model.dashboardDef.reports[reportId].catalogItem;
                var parameters = me.model.dashboardDef.reports[reportId].parameters;
                var $reportViewer = $item.reportViewerEZ("getReportViewer");
                $reportViewer.reportViewer("loadReport", catalogItem.Path, 1, parameters);

                // We catch this event so as to auto save when the user changes parameters
                var $reportParameter = $item.reportViewerEZ("getReportParameter");
                $reportParameter.on(events.reportParameterSubmit(), function (e, data) {
                    me._onReportParameterSubmit.apply(me, arguments);
                });
            } else if (hideMissing) {
                $item.css("display", "none");
            }
        },
        _onReportParameterSubmit: function (e, data) {
            // Ment to be overridden in the dashboard editor widget
        },
        _loadResource: function (path) {
            var me = this;
            var status = false;

            // Set the parent folder and dashboard name properties
            me.dashboardName = forerunner.helper.getCurrentItemName(path);
            me.parentFolder = forerunner.helper.getParentPath(path);
            if (!me.parentFolder) {
                me.parentFolder = "/";
            }


            // Fetch the model from the server
            return me.model.fetch(path);
        },
        _destroy: function () {
        },
    });  // $.widget
});   // $(function


