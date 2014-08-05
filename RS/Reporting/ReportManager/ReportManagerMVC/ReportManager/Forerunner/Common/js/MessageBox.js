/**
 * @file Contains the messgae box widget.
 *
 */

// Assign or create the single globally scoped variable
var forerunner = forerunner || {};

// Forerunner SQL Server Reports
forerunner.ssr = forerunner.ssr || {};

$(function () {
    var widgets = forerunner.ssr.constants.widgets;
    var events = forerunner.ssr.constants.events;

    /**
     * Widget used display the message box dialog
     *
     * @namespace $.forerunner.messageBox
     * @prop {Object} options - The options for Message Box
     * @prop {Object} options.$appContainer - The container jQuery object that holds the application
     *
     * @example
     * $msgBox.messageBox({ 
     *    $appContainer: $appContainer 
     * });
     */
    $.widget(widgets.getFullname(widgets.messageBox), {
        options: {
            $appContainer: null
        },
        _create: function () {
            
        },
        _init: function () {
            var me = this;
            me.element.off(events.modalDialogGenericSubmit);
            me.element.off(events.modalDialogGenericCancel);

            var locData = forerunner.localize.getLocData(forerunner.config.forerunnerFolder() + "ReportViewer/loc/ReportViewer");
            $messageBox = new $(
                "<div class='fr-core-dialog-innerPage fr-core-center'>" +
                    "<div class='fr-messagebox-innerpage'>" +
                        "<div class='fr-core-dialog-header'>" +
                            "<div class='fr-messagebox-title'>" + locData.dialog.title + "</div>" +
                        "</div>" +
                        "<div class='fr-messagebox-content'>" +
                            "<span class='fr-messagebox-msg'/>" +
                        "</div>" +
                        "<div class='fr-core-dialog-submit-container'>" +
                            "<div class='fr-core-center'>" +
                                "<input name='close' type='button' class='fr-messagebox-close-id fr-messagebox-submit fr-core-dialog-button' value='" + locData.dialog.close + "' />" +
                            "</div>" +
                        "</div>" +
                    "</div>" +
                "</div>");

            me.element.append($messageBox);

            me.element.find(".fr-messagebox-close-id").on("click", function () {
                me.closeDialog();
            });

            me.element.on(events.modalDialogGenericSubmit, function () {
                me.closeDialog();
            });

            me.element.on(events.modalDialogGenericCancel, function () {
                me.closeDialog();
            });
        },
        /**
         * Open message box dialog
         *
         * @function $.forerunner.messageBox#openDialog
         * @param {String} msg - Message to show
         * @param {String} caption - Message box dialog caption
         */
        openDialog: function (msg, caption) {
            var me = this;

            me.element.find(".fr-messagebox-msg").text(msg);
            if (caption) {
                me.element.find(".fr-messagebox-title").text(caption);
            }

            forerunner.dialog.showModalDialog(me.options.$appContainer, me);
        },
        /**
         * Close current message box
         *
         * @function $.forerunner.messageBox#closeDialog
         */
        closeDialog: function () {
            var me = this;
            $(".fr-messagebox-msg").val();
            
            forerunner.dialog.closeModalDialog(me.options.$appContainer, me);
        }

    }); //$.widget
}); // $(function ()