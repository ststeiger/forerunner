/**
 * @file Contains the save as dashboard widget.
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
    var saveAsDashboard = locData.saveAsDashboard;

    /**
     * Widget used to get the dashboard name from the user
     *
     * @namespace $.forerunner.saveAsDashboard
     * @prop {Object} options - The options for the create dashboard dialog
     * @prop {Object} options.$appContainer - Dashboard container
     * @prop {bool} options.overwrite - Server overwrite resource flag
     * @prop {Object} options.dashboardName - Name of the dashboard resource
     *
     * @example
     * $("#saveAsDashboard").saveAsDashboard({
     *      $appContainer: me.options.$appContainer,
     * });
     */
    $.widget(widgets.getFullname(widgets.saveAsDashboard), {
        options: {
            $appContainer: null,
            overwrite: false,
            dashboardName: null
        },
        _init: function () {
            var me = this;

            if (me.options.dashboardName) {
                me.$dashboardName.val(me.options.dashboardName);
            }

            me._resetValidateMessage();
        },
        _create: function () {
            var me = this;

            me.element.html("");

            var headerHtml = forerunner.dialog.getModalDialogHeaderHtml("fr-icons24x24-save-param", saveAsDashboard.title, "fr-sad-cancel", saveAsDashboard.cancel);
            var $dialog = $(
                "<div class='fr-core-dialog-innerPage fr-core-center'>" +
                    headerHtml +
                    "<form class='fr-sad-form fr-core-dialog-form'>" +
                        // Dashboard Name
                        "<table>" +
                            "<tr>" +
                                "<td>" +
                                    "<label class='fr-sad-label'>" + saveAsDashboard.dashboardName + "</label>" +
                                "</td>" +
                                "<td>" +
                                    "<input class='fr-sad-dashboard-name' autofocus='autofocus' type='text' placeholder='" + saveAsDashboard.namePlaceholder + "' required='true'/><span class='fr-sad-error-span'/>" +
                                "</td>" +
                            "</tr>" +
                        "</table>" +
                        // Submit conatiner
                        "<div class='fr-core-dialog-submit-container'>" +
                            "<div class='fr-core-center'>" +
                                "<input name='submit' type='button' class='fr-sad-submit-id fr-core-dialog-submit fr-core-dialog-button' value='" + saveAsDashboard.submit + "' />" +
                            "</div>" +
                        "</div>" +
                    "</form>" +
                "</div>");

            me.element.append($dialog);

            me.$form = me.element.find(".fr-sad-form");
            me._validateForm(me.$form);

            me.$dashboardName = me.element.find(".fr-sad-dashboard-name");

            // Hook the cancel and submit events
            me.element.find(".fr-sad-cancel").on("click", function(e) {
                me.closeDialog();
            });
            me.element.find(".fr-sad-submit-id").on("click", function (e) {
                me._submit();
            });
            me.element.on(events.modalDialogGenericSubmit, function () {
                me._submit();
            });
            me.element.on(events.modalDialogGenericCancel, function () {
                me.closeDialog();
            });
        },
        /**
         * Open parameter set dialog
         *
         * @function $.forerunner.saveAsDashboard#openDialog
         */
        openDialog: function () {
            var me = this;
            forerunner.dialog.showModalDialog(me.options.$appContainer, me);
        },
        _triggerClose: function (isSubmit) {
            var me = this;
            var data = {
                dashboardName: me.$dashboardName.val(),
                isSubmit: isSubmit,
                overwrite: me.options.overwrite
            };
            me._trigger(events.close, null, data);
        },
        _submit: function () {
            var me = this;

            if (me.$form.valid() === true) {
                me._triggerClose(true);
                forerunner.dialog.closeModalDialog(me.options.$appContainer, me);
            }
        },
        /**
         * Close parameter set dialog
         *
         * @function $.forerunner.saveAsDashboard#closeDialog
         */
        closeDialog: function () {
            var me = this;
            me._triggerClose(false);
            forerunner.dialog.closeModalDialog(me.options.$appContainer, me);
        },
        _validateForm: function (form) {
            form.validate({
                errorPlacement: function (error, element) {
                    error.appendTo($(element).parent().find("span"));
                },
                highlight: function (element) {
                    $(element).parent().find("span").addClass("fr-sad-error-position");
                    $(element).addClass("fr-sad-error");
                },
                unhighlight: function (element) {
                    $(element).parent().find("span").removeClass("fr-sad-error-position");
                    $(element).removeClass("fr-sad-error");
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