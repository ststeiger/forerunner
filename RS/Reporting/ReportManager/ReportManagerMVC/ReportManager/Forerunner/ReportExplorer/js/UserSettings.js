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
     * @prop {Object} options - The options for userSettings
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
            var locData = forerunner.localize.getLocData(forerunner.config.forerunnerFolder() + "ReportViewer/loc/ReportViewer");
            var userSettings = locData.userSettings;
            var unit = locData.unit;

            var buildVersion = forerunner.ajax.getBuildVersion();

            me.element.html("");
            me.element.off(events.modalDialogGenericSubmit);
            me.element.off(events.modalDialogGenericCancel);

            var headerHtml = forerunner.dialog.getModalDialogHeaderHtml("fr-icons24x24-setup", userSettings.title, "fr-us-cancel", userSettings.cancel);
            var $theForm = new $(
            "<div class='fr-core-dialog-innerPage fr-core-center'>" +
                headerHtml +
                // form
                "<form class='fr-us-form fr-core-dialog-form'>" +
                    "<table>" +
                        "<tr>" +
                            "<td>" +
                                "<label class='fr-us-label'>" + userSettings.ResponsiveUI + "</label>" +
                            "</td>" +
                            "<td>" +
                                "<input class='fr-us-responsive-ui-id fr-us-checkbox'  name='ResponsiveUI' type='checkbox'/>" +
                            "</td>" +
                        "</tr>" +
                        "<tr>" +
                            "<td>" +
                                "<label class='fr-us-label'>" + userSettings.AdminUI + "</label>" +
                            "</td>" +
                            "<td>" +
                                "<input class='fr-us-admin-ui-id fr-us-checkbox'  name='adminUI' type='checkbox'/>" +
                            "</td>" +
                        "</tr>" +
                         "<tr>" +
                            "<td>" +
                                "<label class='fr-us-label'>" + userSettings.ViewStyle + "</label>" +
                            "</td>" +
                            "<td class = 'fr-toolbase-selectinner'>" +
                                "<select class='fr-us-viewStyle-id fr-us-dropdown  '  name='viewStyle' list='viewStyles'>" +
                                "<option value='" + "large" + "'>" + userSettings.ViewStyleLarge + "</option>" +
                                "<option value='" + "small" + "'>" + userSettings.ViewStyleSmall + "</option>" +
                                 "<option value='" + "list" + "'>" + userSettings.ViewStyleList + "</option>" +
                                "</select" +
                            "</td>" +
                        "</tr>" +
                    "</table>" +
                    // Ok button
                    "<div class='fr-core-dialog-submit-container'>" +
                        "<div class='fr-core-center'>" +
                        "<input name='submit' type='button' class='fr-us-submit-id fr-core-dialog-submit fr-core-dialog-button' value='" + userSettings.submit + "'/>" +
                    "</div>" +
                "</form>" +
                "<div class='fr-buildversion-container'>" +
                    buildVersion +
                "</div>" +
            "</div>");

            me.element.append($theForm);

            //disable form auto submit when click enter on the keyboard
            me.element.find(".fr-us-form").on("submit", function () { return false; });

            me.element.find(".fr-us-submit-id").on("click", function (e) {
                me._saveSettings();
            });

            me.element.find(".fr-us-cancel").on("click", function (e) {
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
            me.settings = me.options.$reportExplorer.reportExplorer("getUserSettings", true);

            me.$resposiveUI = me.element.find(".fr-us-responsive-ui-id");
            var responsiveUI = me.settings.responsiveUI;
            me.$resposiveUI.prop("checked", responsiveUI);
            me.$adminUI = me.element.find(".fr-us-admin-ui-id");
            var adminUI = me.settings.adminUI;
            me.$adminUI.prop("checked", adminUI);

            me.$viewStyle = me.element.find(".fr-us-viewStyle-id");
            me.$viewStyle.val(me.settings.viewStyle);
        },
        _triggerClose: function (isSubmit) {
            var me = this;
            var data = {
                isSubmit: isSubmit,
                settings: me.settings
            };
            me._trigger(events.close, null, data);
            forerunner.dialog.closeModalDialog(me.options.$appContainer, me);
        },
        _saveSettings: function () {
            var me = this,
                responsiveUI = me.$resposiveUI.prop("checked"),
                adminUI = me.$adminUI.prop("checked"),
                viewStyle = me.$viewStyle.val();

            if (me.settings.responsiveUI === responsiveUI && me.settings.adminUI === adminUI && me.settings.viewStyle === viewStyle) {
                //nothing change, just close dialog
                me.closeDialog();
                return;
            }

            me.settings.responsiveUI = responsiveUI;
            me.settings.adminUI = adminUI;
            me.settings.viewStyle = viewStyle;
            
            //update cached setting
            forerunner.ajax.setUserSetting(me.settings);
            me.options.$reportExplorer.reportExplorer("saveUserSettings", me.settings);
            me._triggerClose(true);
        },
        /**
         * Open user setting dialog
         *
         * @function $.forerunner.userSettings#openDialog
         */
        openDialog: function () {
            var me = this;

            me._getSettings();
            forerunner.dialog.showModalDialog(me.options.$appContainer, me);

        },
        /**
         * Close user setting dialog
         *
         * @function $.forerunner.userSettings#closeDialog
         */
        closeDialog: function () {
            var me = this;
            me._triggerClose(false);
        }
    }); //$.widget
});