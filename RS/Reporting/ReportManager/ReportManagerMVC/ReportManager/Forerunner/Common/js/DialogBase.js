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
        // _showExceptionError
        //  Will show a Submit Error with formatting specifically designed to
        //  work with a json object returned by a .cs controller that called
        //  JsonUtility.WriteExceptionJSON(e)
        _showExceptionError: function (errorData) {
            var me = this;
            var errorTag = locData.errorTag;
            var $cell;

            me.$submitError.html("");
            if (errorData.Exception.Type === "LicenseException") {
                //Reason: Expired,MachineMismatch,TimeBombMissing,SetupError
                me.$submitError.append($("<div class='Page' >" +
                    "<div class='fr-render-error-license Page'>" +
                        "<div class='fr-render-error-license-container'>" +
                    "<p class='fr-render-error-license-title'></p><br/>" +
                    "<p class='fr-render-error-license-content'></p>" +
                        "</div>" +
                    "</div>"));

                $cell = me.$submitError.find(".fr-render-error-license-title");
                $cell.html(errorTag.licenseErrorTitle);
                $cell = me.$submitError.find(".fr-render-error-license-content");
                $cell.html(errorTag.licenseErrorContent);
            }
            else {
                me.$submitError.append($("<div class='Page' >" +
               "<div class='fr-render-error-message'></div></br>" +
               "<div class='fr-render-error-details'>" + errorTag.moreDetail + "</div>" +
               "<div class='fr-render-error'><h3>" + errorTag.serverError + "</h3>" +
               "<div class='fr-render-error fr-render-error-DetailMessage'></div>" +
               "<div class='fr-render-error fr-render-error-type'></div>" +
               "<div class='fr-render-error fr-render-error-targetsite'></div>" +
               "<div class='fr-render-error fr-render-error-source'></div>" +
               "<div class='fr-render-error fr-render-error-stacktrace'></div>" +
               "</div></div>"));

                $cell = me.$submitError.find(".fr-render-error");
                $cell.hide();

                $cell = me.$submitError.find(".fr-render-error-details");
                $cell.on("click", { $Detail: me.$submitError.find(".fr-render-error") }, function (e) {
                    e.data.$Detail.toggle();
                });

                $cell = me.$submitError.find(".fr-render-error-DetailMessage");
                $cell.append("<h4>" + errorTag.message + ":</h4>" + errorData.Exception.DetailMessage);

                $cell = me.$submitError.find(".fr-render-error-type");
                $cell.append("<h4>" + errorTag.type + ":</h4>" + errorData.Exception.Type);

                $cell = me.$submitError.find(".fr-render-error-targetsite");
                $cell.html("<h4>" + errorTag.targetSite + ":</h4>" + errorData.Exception.TargetSite);

                $cell = me.$submitError.find(".fr-render-error-source");
                $cell.html("<h4>" + errorTag.source + ":</h4>" + errorData.Exception.Source);

                $cell = me.$submitError.find(".fr-render-error-message");
                $cell.html(errorData.Exception.Message);

                $cell = me.$submitError.find(".fr-render-error-stacktrace");
                $cell.html("<h4>" + errorTag.stackTrace + ":</h4>" + errorData.Exception.StackTrace);
            }

            me.$submitError.show();
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
            me._visibleCheck();
        },
        _visibleCheck: function () {
            var me = this;

            if (me.$formMain.is(":visible")) {
                me.onDialogVisible();
            } else {
                // Poll until the browser button is visible
                setTimeout(function () { me._visibleCheck.call(me); }, 50);
            }
        },
        /**
         * Is called when the dialog becomes visible. This is a good function to use if
         * you need to do dynamic layout because the position and dimensions of the dialog's
         * elements are all set when this is called.
         *
         * @function $.forerunner.dialogBase#onDialogVisible
         */
        onDialogVisible: function () {
            var me = this;

            // Set the submit error width to the size of the form main element. The
            // reason to do this is to keep the width of $submitError from expanding
            // the width of the dialog if / when an error is returned.
            me.$submitError.width(me.$formMain.width());
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
        }
    }); //$.widget
});