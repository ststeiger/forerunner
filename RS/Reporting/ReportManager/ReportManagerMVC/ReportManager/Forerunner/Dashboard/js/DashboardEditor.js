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
    var toolbar = locData.toolbar;
    var messages =locData.messages;
    var timeout = forerunner.device.isWindowsPhone() ? 500 : forerunner.device.isTouch() ? 50 : 50;

    /**
     * Widget used to create and edit dashboards
     *
     * @namespace $.forerunner.dashboardEditor
     */
    $.widget(widgets.getFullname(widgets.dashboardEditor), $.forerunner.dashboardViewer /** @lends $.forerunner.dashboardEditor */, {
        options: {
        },
        /**
         * Opens the given dashboard definition for editing or viewing
         *
         * @function $.forerunner.dashboardEditor#editDashboard
         * @param {String} path - Fully qualified path to the dashboard
         * @param {Bool} enableEdit - True = display the dashboard in edit mode, False = view mode
         */
        openDashboard: function (path, enableEdit) {
            var me = this;

            me.enableEdit = enableEdit;
            if (enableEdit) {
                setTimeout(function () {
                    me.loadDefinition(path, false);
                    me._showUI(true);
                }, timeout);
            } else {
                me.loadDefinition(path, true);
            }
        },
        /**
         * Returns the fully qualified dashboard path
         * @function $.forerunner.dashboardEditor#getPath
         */
        getPath: function () {
            var me = this;
            if (!me.parentFolder || !me.dashboardName) {
                return null;
            }

            return me.parentFolder + me.dashboardName;
        },
        _save: function (overwrite) {
            var me = this;

            // Extract and save any / all parameter definitions
            var $reportContainers = me.element.find(".fr-dashboard-report-id");
            $reportContainers.each(function (index, item) {
                var reportId = item.id;
                var $item = $(item);

                if (me._hasReport($item)) {
                    var reportProperties = me.model.dashboardDef.reports[reportId];
                    reportProperties.parameters = null;

                    // If we have a reportVewerEZ attached then get and save the parameter list
                    var $reportParameter = $item.reportViewerEZ("getReportParameter");
                    if (widgets.hasWidget($reportParameter, widgets.reportParameter)) {
                        var numOfVisibleParameters = $reportParameter.reportParameter("getNumOfVisibleParameters");
                        if (numOfVisibleParameters > 0) {
                            reportProperties.parameters = $reportParameter.reportParameter("getParamsList", true);
                        }
                    }
                }
            });

            // Save the model
            if (!me.model.save(overwrite, me.parentFolder, me.dashboardName)) {
                forerunner.dialog.showMessageBox(me.options.$appContainer, messages.saveDashboardFailed, toolbar.saveDashboard);
            }
        },
        _onReportParameterSubmit: function (e, data) {
            var me = this;
            if (me.enableEdit === true) {
                me._save(true);
            }
        },
        _onAfterReportLoaded: function (e, data) {
            var me = this;
            me._showUI(me.enableEdit);
        },
        _onClickProperties: function (e) {
            var me = this;
            var $dlg = me.options.$appContainer.find(".fr-rp-section");
            if ($dlg.length === 0) {
                $dlg = $("<div class='fr-rp-section fr-dialog-id fr-core-dialog-layout fr-core-widget'/>");
                me.options.$appContainer.append($dlg);
                $dlg.on(events.reportPropertiesClose(), function (e, data) {
                    me._onReportPropertiesClose.apply(me, arguments);
                });
            }
            $dlg.reportProperties({
                reportManagerAPI: me.options.reportManagerAPI,
                $appContainer: me.options.$appContainer,
                $dashboardEditor: me,
                reportId: e.target.name
            });
            $dlg.reportProperties("openDialog");
        },
        _onReportPropertiesClose: function (e, data) {
            var me = this;
            if (!data.isSubmit) {
                // Wasn't a submit so just return
                return;
            }

            setTimeout(function () {
                // Load the given report
                me._loadReport(data.reportId, false);
                me._renderButtons();
                me._makeOpaque(true);
            }, timeout);

            me._save(true);
        },
        _showUI: function (show) {
            var me = this;
            if (show) {
                me._renderButtons();
            } else {
                me._removeButtons();
            }
            me._makeOpaque(show);
        },
        _renderButtons: function () {
            var me = this;
            me._removeButtons();
            me.element.find(".fr-dashboard-report-id").each(function (index, item) {
                me._renderButton(item);
            });
        },
        _hasReport: function ($item) {
            return widgets.hasWidget($item, widgets.reportViewerEZ);
        },
        _renderButton: function (item) {
            var me = this;
            var $item = $(item);

            if (me._hasReport($item)){
                // Use the reort height
                $item.height("");
            } else {
                // Put in a default height until a report is loaded
                $item.height("480px");
            }

            // Create the button
            var $btn = $("<input type=button class='fr-dashboard-btn' name='" + item.id + "'/>");
            $item.append($btn);

            // Hook the onClick event
            $btn.on("click", function (e) {
                me._onClickProperties.apply(me, arguments);
            });

            // Position the button
            var left = $item.width() / 2 - ($btn.width() / 2);
            var top = $item.height() / 2 - ($btn.height() / 2);
            $btn.css({ position: "absolute", left: left + "px", top: top + "px" });
        },
        _removeButtons: function () {
            var me = this;
            me.element.find(".fr-dashboard-btn").remove();
        },
        _makeOpaque: function (addMask) {
            var me = this;
            if (addMask) {
                me.element.find(".fr-report-container").addClass("fr-dashboard-mask");
            } else {
                me.element.find(".fr-report-container").removeClass("fr-dashboard-mask");
            }
        },
        _create: function () {
            var me = this;
            me._super();
        },
        _init: function () {
            var me = this;
            me._super();
        },
        _destroy: function () {
        }
    });  // $.widget
});   // $(function
