﻿/**
 * @file Contains the print widget.
 *
 */

// Assign or create the single globally scoped variable
var forerunner = forerunner || {};

// Forerunner SQL Server Reports
forerunner.ssr = forerunner.ssr || {};

$(function () {
    var widgets = forerunner.ssr.constants.widgets;
    var events = forerunner.ssr.constants.events;
    var locData = forerunner.localize.getLocData(forerunner.config.forerunnerFolder() + "ReportViewer/loc/ReportViewer");
    var createDashboard = locData.createDashboard;
    var ssr = forerunner.ssr;

    /**
     * Widget used to select a new dashboard template
     *
     * @namespace $.forerunner.createDashboard
     * @prop {Object} options - The options for the create dashboard dialog
     * @prop {String} options.$reportExplorer - Report viewer widget
     * @prop {Object} options.$appContainer - Report page container
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

            me.$select = me.element.find(".fr-cdb-template-name")

            var dashboards = forerunner.localize.getLocData(forerunner.config.forerunnerFolder() + "Dashboard/dashboards/dashboards");
            var templates = dashboards.templates;
            for (item in templates) {
                var $option = $("<option value=" + item + ">" + templates[item] + "</option>");
                me.$select.append($option);
            }
        },
        _init: function() {
        },
        _create: function () {
            var me = this;

            me.element.html("");

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
                                    "<input class='fr-cdb-dashboard-name fr-cdb-input' autofocus='autofocus' type='text' placeholder='" + createDashboard.namePlaceholder + "' required='true'/><span class='fr-cdb-error-span'/>" +
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
                        "</table>" +
                        // Submit button
                        "<div class='fr-core-dialog-submit-container'>" +
                            "<div class='fr-core-center'>" +
                                "<input name='submit' autofocus='autofocus' type='button' class='fr-cdb-submit-id fr-core-dialog-submit fr-core-dialog-button' value='" + createDashboard.submit + "' />" +
                            "</div>" +
                        "</div>" +
                    "</form>" +
                "</div>");

            me.element.append($dialog);

            me._createOptions();

            me.$form = me.element.find(".fr-cdb-form");
            me._validateForm(me.$form);

            me.$dashboardName = me.element.find(".fr-cdb-dashboard-name");

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

            // Save the dashboard
            me.model = new ssr.DashboardModel({
                $appContainer: me.options.$appContainer,
                reportManagerAPI: me.options.reportManagerAPI,
                rsInstance: me.options.rsInstance
            });

            // Load the selected template into the dashboard definition
            me.model.loadTemplate(me.$dashboardName.val());

            // Save the model and navigate to editDashboard
            if (me.model.save(false, me.options.parentFolder, me.$dashboardName.val())) {
                // Call navigateTo to bring up the create dashboard view
                var navigateTo = me.options.$reportExplorer.reportExplorer("option", "navigateTo");
                var name = me.$select.val();
                var path = me.options.parentFolder + name;
                navigateTo("createDashboard", path);

                me.closeDialog();
            }

            // TODO
            // Launch to confirm overwrite dialog
        },
        /**
         * Open parameter set dialog
         *
         * @function $.forerunner.createDashboard#openDialog
         */
        openDialog: function () {
            var me = this;
            forerunner.dialog.showModalDialog(me.options.$appContainer, me);
        },
        /**
         * Close parameter set dialog
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