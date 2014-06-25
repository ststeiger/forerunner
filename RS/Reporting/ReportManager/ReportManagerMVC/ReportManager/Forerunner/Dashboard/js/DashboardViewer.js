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

            $(window).on("resize", function (e, data) {
                me._onWindowResize.apply(me, arguments);
            });
        },
        _setWidths: function ($item, $reportViewerEZ, width) {
            if ($item) {
                $item.width(width);
            }
            if ($reportViewerEZ) {
                $reportViewerEZ.width(width);
            }
        },
        _onWindowResize: function (e, data) {
            var me = this;

            var maxResponsiveRes = forerunner.config.getCustomSettingsValue("MaxResponsiveResolution", 1280);
            var userSettings = forerunner.ajax.getUserSetting(me.options.rsInstance);

            setTimeout(function () {
                var isResponsive = userSettings.responsiveUI && $(window).width() < maxResponsiveRes && !me.enableEdit;
                me.element.find(".fr-dashboard-report-id").each(function (index, item) {
                    var $item = $(item);
                    var currentStyle = $item.css("display");
                    var $reportViewer = null;
                    if (widgets.hasWidget($item, widgets.reportViewerEZ)) {
                        $reportViewer = $item.reportViewerEZ("getReportViewer");
                    }

                    if (isResponsive) {
                        // Set the dispay on the element to inline-block
                        if (currentStyle !== "inline-block") {
                            $item.css("display", "inline-block");
                        }

                        if (me.element.width() < $item.width()) {
                            // Set the width of the report <div> to the viewer width
                            me._setWidths($item, $reportViewer, me.element.width());
                        } else {
                            // Remove any explicit width
                            me._setWidths($item, $reportViewer, "");
                        }
                    } else {
                        // Remove any explicit width
                        me._setWidths($item, $reportViewer, "");

                        if (currentStyle) {
                            // Remove any explicitly set display and default back to whatever the template designer wanted
                            $item.css("display", "");
                        }
                        // Need this to refresh the viewer to see the changes
                        me.element.hide().show(0);
                    }
                });
            }, 1);
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
                me._loadReport(item.id, hideMissing);
            });
        },
        getParentFolder: function () {
            var me = this;
            return me.parentFolder;
        },
        getDashboardName: function () {
            var me = this;
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
            var reportProperties = me.getReportProperties(reportId);

            var $item = me.element.find("#" + reportId);
            $item.css("display", "");

            $item.html("");

            // If we have a report definition, load the report
            if (reportProperties && reportProperties.catalogItem) {
                $item.reportViewerEZ({
                    navigateTo: me.options.navigateTo,
                    historyBack: null,
                    isReportManager: false,
                    isFullScreen: false,
                    toolbarConfigOption: me.enableEdit ? constants.toolbarConfigOption.dashboardEdit : reportProperties.toolbarConfigOption
                });

                var $reportViewer = $item.reportViewerEZ("getReportViewer");

                $reportViewer.one(events.reportViewerAfterLoadReport(), function (e, data) {
                    data.reportId = reportId;
                    me._onAfterReportLoaded.apply(me, arguments);
                });

                var catalogItem = reportProperties.catalogItem;
                var parameters = reportProperties.parameters;
                $reportViewer.reportViewer("loadReport", catalogItem.Path, 1, parameters);

                // We catch this event so as to auto save when the user changes parameters
                var $reportParameter = $item.reportViewerEZ("getReportParameter");
                $reportParameter.one(events.reportParameterSubmit(), function (e, data) {
                    me._onReportParameterSubmit.apply(me, arguments);
                });
            } else if (hideMissing) {
                $item.css("display", "none");
            }
        },
        _onReportParameterSubmit: function (e, data) {
            // Meant to be overridden in the dashboard editor widget
        },
        _onAfterReportLoaded: function (e, data) {
            // Meant to be overridden in the dashboard editor widget
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


