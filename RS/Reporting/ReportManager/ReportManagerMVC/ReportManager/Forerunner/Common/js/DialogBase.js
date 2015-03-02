/**
 * @file Contains the base widget used to contain common dialog functionality.
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

    /**
     * Base Widget used to contain common dialog functionality.
     *
     * @namespace $.forerunner.dialogBase
     * @prop {Object} options - The options for dialogBase
     * @prop {String} options.title - The Title used for in the dialog header
     * @prop {String} options.iconClass - Class used to define the dialog icon
     * @prop {Object} options.$appContainer - The container jQuery object that holds the application
     * @prop {String} options.actionWord - Optional, Localized string defining the submit text
     * @prop {String} options.cancelWord - Optional, Localized string defining the cancel text
     * @prop {String} options.reportManagerAPI - Optional, Path to the REST calls for the reportManager
     * @prop {String} options.rsInstance - Optional, Report service instance name
     *
     * @example
     * var widgets = {@link forerunner.ssr.constants.widgets};
     * $.widget(widgets.getFullname(widgets.uploadFile), $.forerunner.dialogBase, {
     *  options: {
     *      title: loc.uploadDialog.title
     *      iconClass: "fr-icons24x24-setup",
     *      $appContainer: me.$appContainer
     *  },
     * });
     */
    $.widget(widgets.getFullname(widgets.dialogBase), {
        options: {
            title: locData.dialogBase.title,
            iconClass: "fr-icons24x24-setup",
            $appContainer: null,
            actionWord: locData.dialogBase.submit,
            cancelWord: locData.dialogBase.cancel,
            reportManagerAPI: forerunner.config.forerunnerAPIBase() + "ReportManager/",
            rsInstance: null
        },
        _init: function () {
            var me = this;
            me._hideSubmitError();
        },
        _create: function () {
            var me = this;

            me.element.html("");
            me.element.off(events.modalDialogGenericSubmit);
            me.element.off(events.modalDialogGenericCancel);

            var headerHtml = forerunner.dialog.getModalDialogHeaderHtml(me.options.iconClass, me.options.title, "fr-dlb-cancel-id", me.options.cancelWord);
            var $dialog = $(
                "<div class='fr-core-dialog-innerPage fr-core-center'>" +
                    // Header
                    headerHtml +
                    // Form
                    "<form class='fr-dlb-form fr-core-dialog-form'>" +

                    // Form Main
                    "<div class=fr-dlb-form-main-id></div>" +

                    // Submit container
                    "<div class='fr-core-dialog-submit-container'>" +
                        // Submit Button
                        "<div class='fr-core-center'>" +
                            "<input type='button' class='fr-dlb-submit-id fr-core-dialog-submit fr-core-dialog-button' value='" + me.options.actionWord + "' />" +
                        "</div>" +
                        // Submit Error
                        "<div class='fr-dlb-submit-error fr-dlb-error fr-dlb-error-span error' />" +
                    "</div>" +
                    "</form>" +
                "</div>");

            me.element.append($dialog);

            me.$form = me.element.find(".fr-dlb-form");
            me.$formMain = me.element.find(".fr-dlb-form-main-id");

            me.$cancel = me.element.find(".fr-dlb-cancel-id");
            me.$cancel.on("click", function (e) {
                me.closeDialog();
            });

            me.$submitError = me.element.find(".fr-dlb-submit-error");

            me.$submit = me.element.find(".fr-dlb-submit-id");
            me.$submit.on("click", function (e) {
                me._submit();
            });

            me.element.on(events.modalDialogGenericSubmit, function () {
                me._submit();
            });

            me.element.on(events.modalDialogGenericCancel, function () {
                me.closeDialog();
            });
        },
        _showSubmitError: function (html) {
            var me = this;
            me.$submitError.show();
            me.$submitError.html(html);
        },
        _hideSubmitError: function () {
            var me = this;
            me.$submitError.hide();
        },
        _submit: function () {
            var me = this;

            if (!me.$form.valid()) {
                return;
            }

            me.closeDialog();
        },
        /**
         * Open dialog
         *
         * @function $.forerunner.dialogBase#openDialog
         */
        openDialog: function () {
            var me = this;
            forerunner.dialog.showModalDialog(me.options.$appContainer, me);
        },
        /**
         * Close  dialog
         *
         * @function $.forerunner.dialogBase#closeDialog
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