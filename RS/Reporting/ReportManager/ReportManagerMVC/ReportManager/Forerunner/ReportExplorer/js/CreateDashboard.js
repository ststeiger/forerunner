/**
 * @file Contains the create dashboard widget.
 *
 */

// Assign or create the single globally scoped variable
var forerunner = forerunner || {};

// Forerunner SQL Server Reports
forerunner.ssr = forerunner.ssr || {};

$(function () {
    var widgets = forerunner.ssr.constants.widgets;
    var events = forerunner.ssr.constants.events;
    var helper = forerunner.helper;
    var locData = forerunner.localize.getLocData(forerunner.config.forerunnerFolder() + "ReportViewer/loc/ReportViewer");
    var createDashboard = locData.createDashboard;
    var ssr = forerunner.ssr;

    /**
     * Widget used to select a new dashboard template
     *
     * @namespace $.forerunner.createDashboard
     * @prop {Object} options - The options for the create dashboard dialog
     * @prop {Object} options.$reportExplorer - Report viewer widget
     * @prop {Object} options.$appContainer - The container jQuery object that holds the application
     * @prop {Object} options.parentFolder - Folder that this resource should be created in
     * @prop {String} options.reportManagerAPI - Optional, Path to the REST calls for the reportManager
     * @prop {String} options.rsInstance - Optional, Report service instance name
     *
     * @example
     * $("#createDashboardDialog").createDashboard({
     *     $appContainer: me.options.$appContainer,
     *     $reportExplorer: me.element,
     *     parentFolder: me.lastFetched,
     * });
     */
    $.widget(widgets.getFullname(widgets.createDashboard), {
        options: {
            $reportExplorer: null,
            $appContainer: null,
            parentFolder: null,
            reportManagerAPI: forerunner.config.forerunnerAPIBase() + "ReportManager/",
            rsInstance: null
        },
        _createOptions: function() {
            var me = this;

            me.$select = me.element.find(".fr-cdb-template-name");

            var dashboards = forerunner.localize.getLocData(forerunner.config.forerunnerFolder() + "Dashboard/dashboards/dashboards");
            var templates = dashboards.templates;
            for (var key in templates) {
                var $option = $("<option value=" + key + ">" + templates[key] + "</option>");
                me.$select.append($option);
            }
        },
        _init: function () {
            var me = this;

            // Reinitialize the fields
            me.$dashboardName.val("");
            me.$overwrite.prop({ checked: false });
        },
        _create: function () {
            var me = this;

            me.element.html("");
            me.element.off(events.modalDialogGenericSubmit);
            me.element.off(events.modalDialogGenericCancel);

            var headerHtml = forerunner.dialog.getModalDialogHeaderHtml("fr-icons24x24-createdashboard", createDashboard.title, "fr-cdb-cancel", createDashboard.cancel);
            var $dialog = $(
                "<div class='fr-core-dialog-innerPage fr-core-center'>" +
                    headerHtml +
                    "<form class='fr-cdb-form fr-core-dialog-form'>" +
                        // Dashboard Name
                        "<table>" +
                            "<tr>" +
                                "<td>" +
                                    "<label class='fr-cdb-label'>" + createDashboard.dashboardName + "</label>" +
                                "</td>" +
                                "<td>" +
                                    // Dashboard name
                                    "<input class='fr-cdb-dashboard-name fr-cdb-input' autofocus='autofocus' type='text' required='true'/>" +
                                    "<span class='fr-cdb-error-span'/>" +
                                "</td>" +
                            "</tr>" +
                            "<tr>" +
                                "<td>" +
                                    "<label class='fr-cdb-label'>" + createDashboard.dashboardTemplate + "</label>" +
                                "</td>" +
                                "<td>" +
                                    // Layout Template 
                                    "<select class='fr-cdb-template-name fr-cdb-input'>" +
                                    "</select>" +
                                "</td>" +
                            "</tr>" +
                            "<tr>" +
                                "<td>" +
                                    "<label class='fr-cdb-label'>" + createDashboard.overwrite + "</label>" +
                                "</td>" +
                                "<td>" +
                                    "<input class='fr-cdb-overwrite-id fr-cdb-overwrite-checkbox' type='checkbox'/>" +
                                "</td>" +
                            "</tr>" +
                        "</table>" +
                        // Submit button
                        "<div class='fr-core-dialog-submit-container'>" +
                            "<div class='fr-core-center'>" +
                                "<input autofocus='autofocus' type='button' class='fr-cdb-submit-id fr-core-dialog-submit fr-core-dialog-button' value='" + createDashboard.submit + "' />" +
                            "</div>" +
                        "</div>" +
                    "</form>" +
                "</div>");

            me.element.append($dialog);

            me._createOptions();

            me.$form = me.element.find(".fr-cdb-form");
            me._validateForm(me.$form);
            //disable form auto submit when click enter on the keyboard
            me.$form.on("submit", function () { return false; });

            me.$dashboardName = me.element.find(".fr-cdb-dashboard-name");
            me.$overwrite = me.element.find(".fr-cdb-overwrite-id");

            me.$dashboardName.watermark(createDashboard.namePlaceholder, forerunner.config.getWatermarkConfig());

            me.element.find(".fr-cdb-cancel").on("click", function(e) {
                me.closeDialog();
            });

            me.element.find(".fr-cdb-submit-id").on("click", function (e) {
                me._submit();
            });

            me.element.on(events.modalDialogGenericSubmit, function () {
                me._submit();
            });

            me.element.on(events.modalDialogGenericCancel, function () {
                me.closeDialog();
            });
        },
        _submit: function () {
            var me = this;

            if (!me.$form.valid()) {
                return;
            }

            var templateName = me.$select.val();
            var dashboardName = me.$dashboardName.val();

            // Save the dashboard
            me.model = new ssr.DashboardModel({
                $appContainer: me.options.$appContainer,
                reportManagerAPI: me.options.reportManagerAPI,
                rsInstance: me.options.rsInstance
            });

            // Load the selected template into the dashboard definition
            me.model.loadTemplate(templateName);

            // Save the model and navigate to editDashboard
            var overwrite = me.$overwrite.prop("checked");
            var result = me.model.save(overwrite, me.options.parentFolder, dashboardName);
            if (result.status) {
                // Call navigateTo to bring up the create dashboard view
                var navigateTo = me.options.$reportExplorer.reportExplorer("option", "navigateTo");
                var path = helper.combinePaths(me.options.parentFolder, result.resourceName);
                navigateTo("editDashboard", path);

                me.closeDialog();
                return;
            }

            if (result.responseJSON && result.responseJSON.ExceptionMessage.substr(0, 21).toLowerCase() == "invalid resource name") {
                forerunner.dialog.showMessageBox(me.options.$appContainer, locData.messages.invalidName, createDashboard.title);
            } else {
                forerunner.dialog.showMessageBox(me.options.$appContainer, locData.messages.createFailed, createDashboard.title);
            }
        },
        /**
         * Open create dashboard dialog
         *
         * @function $.forerunner.createDashboard#openDialog
         */
        openDialog: function () {
            var me = this;
            forerunner.dialog.showModalDialog(me.options.$appContainer, me);
        },
        /**
         * Close create dashboard dialog
         *
         * @function $.forerunner.manageParamSets#closeDialog
         */
        closeDialog: function () {
            var me = this;
            forerunner.dialog.closeModalDialog(me.options.$appContainer, me);
        },
        _validateForm: function (form) {
            form.validate({
                errorPlacement: function (error, element) {
                    error.appendTo($(element).parent().find("span"));
                },
                highlight: function (element) {
                    $(element).parent().find("span").addClass("fr-cdb-error-position");
                    $(element).addClass("fr-cdb-error");
                },
                unhighlight: function (element) {
                    $(element).parent().find("span").removeClass("fr-cdb-error-position");
                    $(element).removeClass("fr-cdb-error");
                }
            });
        },
        _resetValidateMessage: function () {
            var me = this;
            var error = locData.validateError;

            jQuery.extend(jQuery.validator.messages, {
                required: error.required,
                number: error.number,
                digits: error.digits
            });
        },
    }); //$.widget
});