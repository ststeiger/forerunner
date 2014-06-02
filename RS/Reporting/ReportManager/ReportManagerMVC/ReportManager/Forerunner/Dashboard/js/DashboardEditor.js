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
    var toolbar = locData.toolbar;
    var messages =locData.messages;

    /**
     * Widget used to create and edit dashboards
     *
     * @namespace $.forerunner.dashboardEditor
     * @prop {Object} options - The options for dashboardEditor
     */
    $.widget(widgets.getFullname(widgets.dashboardEditor), $.forerunner.dashboardViewer /** @lends $.forerunner.dashboardEditor */, {
        options: {
        },
        /**
         * Loads the given template
         * @function $.forerunner.dashboardEditor#loadTemplate
         */
        loadTemplate: function (parentFolder, templateName) {
            var me = this;
            var template = forerunner.localize.getLocData(forerunner.config.forerunnerFolder() + "Dashboard/dashboards/" + templateName, "text");
            me.dashboardDef.template = template;
            me.parentFolder = parentFolder;
            me._renderTemplate();
        },
        /**
         * Loads the given dashboard definition and opens the dashboard for editing
         * @function $.forerunner.dashboardEditor#loadTemplate
         */
        editDashboard: function (path) {
            // TODO
        },
        /**
         * Save the dashboard
         * @function $.forerunner.dashboardEditor#save
         */
        save: function (overwrite) {
            var me = this;
            if (!me.dashboardName) {
                // If we don't have the name, we need to do a save as
                me.saveAs(overwrite);
                return;
            }
            // If we have the dashboard name we can just save
            me._saveDashboard(overwrite);
        },
        /**
         * Save the dashboard and prompt for a name
         * @function $.forerunner.dashboardEditor#saveAs
         */
        saveAs: function (overwrite) {
            var me = this;
            var $dlg = me.options.$appContainer.find(".fr-sad-section");
            if ($dlg.length === 0) {
                $dlg = $("<div class='fr-sad-section fr-dialog-id fr-core-dialog-layout fr-core-widget'/>");
                me.options.$appContainer.append($dlg);
                $dlg.on(events.saveAsDashboardClose(), function (e, data) {
                    me._onSaveAsDashboardClose.apply(me, arguments);
                });
            }
            $dlg.saveAsDashboard({
                $appContainer: me.options.$appContainer,
                overwrite: overwrite,
                dashboardName: me.dashboardName
            });
            $dlg.saveAsDashboard("openDialog");
        },
        _onSaveAsDashboardClose: function (e, data) {
            var me = this;
            if (!data.isSubmit) {
                // Wasn't a submit so just return
                return;
            }

            // Save the dashboard to the server
            me.dashboardName = data.dashboardName;
            me._saveDashboard(data.overwrite);
        },
        _saveDashboard: function (overwrite) {
            var me = this;
            if (overwrite === null || overwrite === undefined) {
                overwrite = false;
            }
            var stringified = JSON.stringify(me.dashboardDef);
            var url = forerunner.config.forerunnerAPIBase() + "ReportManager/SaveResource";
            forerunner.ajax.ajax({
                type: "POST",
                url: url,
                data: {
                    resourceName: me.dashboardName,
                    parentFolder: encodeURIComponent(me.parentFolder),
                    contents: stringified,
                    mimetype: "json/forerunner-dashboard",
                    rsInstance: me.options.rsInstance
                },
                dataType: "json",
                async: false,
                success: function (data) {
                    forerunner.dialog.showMessageBox(me.options.$appContainer, messages.saveDashboardSucceeded, toolbar.saveDashboard);
                },
                fail: function (jqXHR) {
                    console.log("_saveDashboard() - " + jqXHR.statusText);
                    console.log(jqXHR);
                    forerunner.dialog.showMessageBox(me.options.$appContainer, messages.saveDashboardFailed, toolbar.saveDashboard);
                }
            });
        },
        _renderTemplate: function () {
            var me = this;
            me.element.html(me.dashboardDef.template);
            me.element.find(".fr-dashboard-report-id").each(function (index, item) {
                var $item = $(item);

                // Create the button
                var $btn = $("<input type=button class='fr-dashboard-btn' value='" + dashboardEditor.propertiesBtn + "' name='" + item.id + "'/>");
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

            // Load the given report
            me._loadReport(data.reportId);
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
