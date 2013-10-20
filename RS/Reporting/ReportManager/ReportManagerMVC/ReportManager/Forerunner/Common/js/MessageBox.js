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
     * @prop {object} options - The options for Message Box
     * @prop {String} options.msg - The messgae to display
     * @example
     * $("#messageBoxId").messageBox({
        msg: "Display this text"
     * });
     */
    $.widget(widgets.getFullname(widgets.messageBox), {
        options: {
        },
        _create: function () {
            
        },
        _init: function () {
            var me = this;

            var locData = forerunner.localize.getLocData(forerunner.config.forerunnerFolder() + "/ReportViewer/loc/ReportViewer");
            $messageBox = new $("<div class='fr-messagebox-innerpage fr-core-dialog-layout'>" +
                "<div class='fr-messagebox-header fr-core-dialog-header'><div class='fr-messagebox-title'>" + locData.dialog.title + "</div></div>" +
                "<div class='fr-messagebox-content'><span class='fr-messagebox-msg'/></div>" +
                "<div class='fr-messagebox-buttongroup'>" +
                "<input class='fr-messagebox-button fr-messagebox-close fr-core-dialog-button' name='close' type='button' value='" + locData.dialog.close + "' />" +
                "</div>");

            me.element.append($messageBox);

            me.element.find(".fr-messagebox-close").on("click", function () {
                me.closeDialog();
            });
        },
        /**
         * @function $.forerunner.messageBox#openDialog
         */
        openDialog: function (msg) {
            var me = this;

            forerunner.dialog.showModalDialog(me.element, function () {
                $(".fr-messagebox-msg").html(msg);
                me.element.css("display", "inline-block");
            });
        },
        /**
         * @function $.forerunner.messageBox#closeDialog
         */
        closeDialog: function () {
            var me = this;

            forerunner.dialog.closeModalDialog(me.element, function () {
                $(".fr-messagebox-msg").val();
                me.element.css("display", "");
            });
        }

    }); //$.widget
}); // $(function ()