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
        _setWidths: function (width) {
            var updated = false;
            $.each(arguments, function (index, item) {
                if (index > 0 && item.css && item.css("width") !== width) {
                    updated = true;
                    item.css("width", width);
                }
            });

            return updated;
        },
        /**
         * windowResize will change the report containers to: 1) be responsive
         * (I.e., inline-block) as well as 2) resize the containers if the window
         * width is less than the container width,
         *
         * @function $.forerunner.dashboardViewer#windowResize
         */
        windowResize: function () {
            var me = this;
            var maxResponsiveRes = forerunner.config.getCustomSettingsValue("MaxResponsiveResolution", 1280);
            var userSettings = forerunner.ajax.getUserSetting(me.options.rsInstance);

            var isResponsive = userSettings.responsiveUI && $(window).width() < maxResponsiveRes && !me.enableEdit;
            var updated = false;
            me.element.find(".fr-dashboard-report-id").each(function (index, item) {
                var $item = $(item);
                var currentStyle = $item.css("display");

                if (isResponsive) {
                    // Set the dispay on the report container element to inline-block
                    if (currentStyle !== "inline-block") {
                        $item.css("display", "inline-block");
                        updated = true;
                    }

                    if (me.element.width() < $item.width()) {
                        // Set the width of the report <div> to the viewer width
                        updated = me._setWidths(me.element.width(), $item);
                    } else {
                        // Remove any explicit width
                        updated = me._setWidths("", $item);
                    }
                } else {
                    if (currentStyle) {
                        // Remove any explicitly set display and default back to whatever the template designer wanted
                        $item.css("display", "");
                        updated = true;
                    }

                    // Remove any explicit width
                    updated = me._setWidths("", $item);
                }

                if (updated && widgets.hasWidget($item, widgets.reportViewerEZ)) {
                    // Update the viewer size
                    $item.reportViewerEZ("windowResize");
                }
            });

            // This line has caused trouble; on IE8 in particular. The case it fixes is when the code just above
            // changes the DOM, I.e., the updated variable becomes true. In that case the display does not always
            // update properly.
            //
            // To test, switch between full screen and a smaller size (with the Responsive UI on). Without this
            // line the display will not update properly. On IE8 it causes an infinite loop so on IE8 this is
            // removed (lesser of two evils).
            if (updated && !forerunner.device.isMSIE8()) {
                // Need the hide and show to refresh the viewer to see the changes
                me.element.hide().show(0);
            }
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

            // Add a placeholder size so when either the placeholder does not have a report
            // or the report needs parameters before it can load, then placeholder has a size
            $item.addClass("fr-dashboard-placeholder-size");

            // If we have a report definition, load the report
            if (reportProperties && reportProperties.catalogItem) {
                $item.reportViewerEZ({
                    navigateTo: me.options.navigateTo,
                    historyBack: null,
                    isReportManager: false,
                    isFullScreen: false,
                    handleWindowResize: false,
                    userSettings: forerunner.ajax.getUserSetting(),
                    toolbarConfigOption: me.enableEdit ? constants.toolbarConfigOption.dashboardEdit : reportProperties.toolbarConfigOption
                });

                var $reportViewer = $item.reportViewerEZ("getReportViewer");

                $reportViewer.one(events.reportViewerAfterLoadReport(), function (e, data) {
                    $item.removeClass("fr-dashboard-placeholder-size");
                    data.reportId = reportId;
                    data.$reportViewerEZ = $item;
                    me._onAfterReportLoaded.apply(me, arguments);
                });

                //set floating header top property base on the outer header height
                me.outerToolbarHeight = me.outerToolbarHeight || me.options.$appContainer.find(".fr-layout-topdiv:first").height();
                $reportViewer.reportViewer("option", "toolbarHeight", me.outerToolbarHeight);

                var catalogItem = reportProperties.catalogItem;
                var parameters = reportProperties.parameters;
                $reportViewer.reportViewer("loadReport", catalogItem.Path, 1, parameters);

                // We catch this event so as to auto save when the user changes parameters
                var $reportParameter = $item.reportViewerEZ("getReportParameter");
                $reportParameter.one(events.reportParameterSubmit(), function (e, data) {
                    me._onReportParameterSubmit.apply(me, arguments);
                });
            } else if (hideMissing) {
                $item.removeClass("fr-dashboard-placeholder-size");
                $item.css("display", "none");
            }
        },
        _onReportParameterSubmit: function (e, data) {
            // Meant to be overridden in the dashboard editor widget
        },
        _onAfterReportLoaded: function (e, data) {
            if (data.$reportViewerEZ) {
                data.$reportViewerEZ.reportViewerEZ("windowResize");
            }
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


