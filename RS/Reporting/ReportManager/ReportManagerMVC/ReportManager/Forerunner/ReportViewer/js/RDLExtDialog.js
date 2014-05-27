/**
 * @file Contains the RDL Extensions widget.
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
     * Widget used to manage user settings
     *
     * @namespace $.forerunner.userSettings
     * @prop {Object} options - The options for userSettings
     * @prop {Object} options.$reportExplorer - The report explorer widget
     * @example
     * $("#userSettingsId").userSettings({
     *  $reportExplorer: me.$reportExplorer
     * });
     */
    $.widget(widgets.getFullname(widgets.reportRDLExt), {
        options: {
            reportViewer: null,
        },
        _create: function () {
        },
        _init: function () {
            var me = this;
            var locData = forerunner.localize.getLocData(forerunner.config.forerunnerFolder() + "ReportViewer/loc/ReportViewer").RDLExt;
            

            me.element.html("");
            me.element.off(events.modalDialogGenericSubmit);
            me.element.off(events.modalDialogGenericCancel);

            var headerHtml = forerunner.dialog.getModalDialogHeaderHtml("fr-icons24x24-setup", locData.title, "fr-rdl-cancel", locData.cancel);
            var $theForm = new $(
            "<div class='fr-core-dialog-innerPage fr-core-center'>" +
                headerHtml +
                // form
                "<form class='fr-rdl-form fr-core-dialog-form'>" +
                    "<div class='fr-rdl-container'>" +
                        "<label class='fr-rdl-label'>" + locData.dialogTitle + "</label>" +
                        "<textarea class='fr-rdl-text' rows='5' class='fr-rdl-id '  name='RDL' />  " +
                    "</div>" +
                    // Ok button
                    "<div class='fr-core-dialog-submit-container'>" +
                        "<div class='fr-core-center'>" +
                        "<input name='submit' type='button' class='fr-rdl-submit-id fr-core-dialog-submit fr-core-dialog-button' value='" + locData.submit + "'/>" +
                    "</div>" +
                "</form>" +
            "</div>");

            me.element.append($theForm);

            me.element.find(".fr-rdl-submit-id").on("click", function (e) {
                me._saveSettings();
            });

            me.element.find(".fr-rdl-cancel").on("click", function (e) {
                me.closeDialog();
            });

            me.element.on(events.modalDialogGenericSubmit, function () {
                me._saveSettings();
            });

            me.element.on(events.modalDialogGenericCancel, function () {
                me.closeDialog();
            });
        },

        _getSettings: function () {
            var me = this;
            me.settings = me.options.reportViewer.getRDLExt();
            me.$RLDExt = me.element.find(".fr-rdl-text");

            if (me.settings)
                me.$RLDExt.val(JSON.stringify(me.settings));
        },
        _saveSettings: function () {
            var me = this;
            
            if (me.options.reportViewer.saveRDLExt(me.$RLDExt.val())===true) {
                me.closeDialog();
            }
        },
        /**
         * Open user setting dialog
         *
         * @function $.forerunner.userSettings#openDialog
         */
        openDialog: function () {
            var me = this;

            me._getSettings();
            forerunner.dialog.showModalDialog(me.options.reportViewer.options.$appContainer, me);

        },
        /**
         * Close user setting dialog
         *
         * @function $.forerunner.userSettings#closeDialog
         */
        closeDialog: function () {
            var me = this;

            forerunner.dialog.closeModalDialog(me.options.reportViewer.options.$appContainer, me);
            me.element.detach();

        }
    }); //$.widget
});