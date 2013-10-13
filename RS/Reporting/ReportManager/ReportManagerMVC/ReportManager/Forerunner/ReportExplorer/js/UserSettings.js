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
                "<div class='fr-us-innerPage fr-us-layout'>" +
                    "<div class='fr-us-header'>" +
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
                            "<input class='fr-us-checkbox'  name='ResponsiveUI' type='checkbox' value='" + false + "'/>" +
                        "</div>" +
                        "<div class='fr-us-submit-container'>" +
                            "<div class='fr-us-submit-inner'>" +
                            "<input name='submit' type='button' class='fr-us-submit' value='" + locData.submit + "'/>" +
                        "</div>" +
                    "</form>" +
                "</div>" +
            "</div>");

            me.element.append($theForm);

            me.element.find(".fr-us-submit").on("click", function (e) {
                me.options.$reportExplorer.reportExplorer("saveSettings");
                me.closeDialog();
            });

            me.element.find(".fr-us-cancel").on("click", function (e) {
                me.closeDialog();
            });

        },
        /**
         * @function $.forerunner.userSettings#openDialog
         */
        openDialog: function () {
            var me = this;

            me.element.mask().show();
            me.element.show();
            me._trigger(events.showUserSettings);
        },
        /**
         * @function $.forerunner.userSettings#clodeDialog
         */
        closeDialog: function () {
            var me = this;

            me.element.unmask().hide();
            me.element.hide();
            me._trigger(events.hidePrint);
        }
    }); //$.widget
});