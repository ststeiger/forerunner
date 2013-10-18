/**
 * @file Contains the user settings widget.
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
     * @prop {object} options - The options for userSettings
     * @prop {Object} options.$reportExplorer - The report explorer widget
     * @example
     * $("#userSettingsId").userSettings({
     *  $reportExplorer: me.$reportExplorer
     * });
     */
    $.widget(widgets.getFullname(widgets.userSettings), {
        options: {
            $reportExplorer: null,
        },
        _create: function () {
            
        },
        _init: function () {
            var me = this;
            var locData = me.options.locData.userSettings;
            var unit = locData.unit;

            me.element.html("");

            var $theForm = new $(
            "<div class='fr-us-page'>" +
                // Header
                "<div class='fr-us-innerPage fr-us-layout fr-core-dialog-layout'>" +
                    "<div class='fr-us-header fr-core-dialog-header'>" +
                        "<div class='fr-us-print-icon-container'>" +
                            "<div class='fr-icons24x24 fr-icons24x24-setup fr-us-align-middle'>" +
                            "</div>" +
                        "</div>" +
                        "<div class='fr-us-title-container'>" +
                            "<div class='fr-us-title'>" +
                                locData.title +
                            "</div>" +
                        "</div>" +
                        "<div class='fr-us-cancel-container'>" +
                            "<input type='button' class='fr-us-cancel' value='" + locData.cancel + "'/>" +
                        "</div>" +
                    "</div>" +
                    // form
                    "<form class='fr-us-form'>" +
                        "<div class='fr-us-setting-container'>" +
                            "<label class='fr-us-label'>" + locData.ResponsiveUI + "</label>" +
                            "<input class='fr-us-responsive-ui-id fr-us-checkbox'  name='ResponsiveUI' type='checkbox'/>" +
                        "</div>" +
                        "<div class='fr-us-submit-container'>" +
                            "<div class='fr-us-submit-inner'>" +
                            "<input name='submit' type='button' class='fr-us-submit fr-core-dialog-button' value='" + locData.submit + "'/>" +
                        "</div>" +
                    "</form>" +
                "</div>" +
            "</div>");

            me.element.append($theForm);

            me.element.find(".fr-us-submit").on("click", function (e) {
                me._saveSettings();
                me.closeDialog();
            });

            me.element.find(".fr-us-cancel").on("click", function (e) {
                me.closeDialog();
            });

        },
        _getSettings: function () {
            var me = this;
            me.settings = me.options.$reportExplorer.reportExplorer("getUserSettings", true);
            me.$resposiveUI = me.element.find(".fr-us-responsive-ui-id");
            var responsiveUI = me.settings.responsiveUI;
            me.$resposiveUI.prop("checked", responsiveUI);
        },
        _saveSettings: function () {
            var me = this;
            me.settings.responsiveUI = me.$resposiveUI.prop("checked");

            me.options.$reportExplorer.reportExplorer("saveUserSettings", me.settings);
        },
        /**
         * @function $.forerunner.userSettings#openDialog
         */
        openDialog: function () {
            var me = this;

            me._getSettings();
            forerunner.dialog.showModalDialog(me.element, function () {
                me.element.show();
            });
        },
        /**
         * @function $.forerunner.userSettings#closeDialog
         */
        closeDialog: function () {
            var me = this;

            forerunner.dialog.closeModalDialog(me.element, function () {
                me.element.hide();
            });
        }
    }); //$.widget
});