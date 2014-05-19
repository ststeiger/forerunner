﻿/**
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

            var buildVersion = me._getBuildVersion();

            me.element.html("");
            me.element.off(events.modalDialogGenericSubmit);
            me.element.off(events.modalDialogGenericCancel);

            var headerHtml = forerunner.dialog.getModalDialogHeaderHtml("fr-icons24x24-setup", userSettings.title, "fr-us-cancel", userSettings.cancel);
            var $theForm = new $(
            "<div class='fr-core-dialog-innerPage fr-core-center'>" +
                headerHtml +
                // form
                "<form class='fr-us-form fr-core-dialog-form'>" +
                    "<div class='fr-us-setting-container'>" +
                        "<table><tr><td>" +
                        "<label class='fr-us-label'>" + userSettings.ResponsiveUI + "</label>" +
                        "<input class='fr-us-responsive-ui-id fr-us-checkbox'  name='ResponsiveUI' type='checkbox'/>" +
                        "</tr></td><tr><td>" +
                        "<label class='fr-us-label'>" + userSettings.Email + "</label>" +
                        "<input class='fr-us-email-id fr-us-textbox' name='Email' type='email'/>" +
                        "</td></tr></table>" +
                    "</div>" +
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
        _getBuildVersion: function () {
            var me = this;
            var url = forerunner.config.forerunnerFolder() + "version.txt";
            var buildVersion = null;
            $.ajax({
                url: url,
                dataType: "text",
                async: false,
                success: function (data) {
                    buildVersion = data;
                },
                fail: function (data) {
                    console.log(data);
                },
                error: function (jqXHR, textStatus, errorThrown) {
                    console.log(errorThrown);
                },
            });

            return buildVersion;
        },
        _getSettings: function () {
            var me = this;
            me.settings = me.options.$reportExplorer.reportExplorer("getUserSettings", true);
            me.$resposiveUI = me.element.find(".fr-us-responsive-ui-id");
            me.$email = me.element.find(".fr-us-email-id");
            var responsiveUI = me.settings.responsiveUI;
            me.$resposiveUI.prop("checked", responsiveUI);
            me.$email.val(me.settings.email);
        },
        _saveSettings: function () {
            var me = this;
            me.settings.responsiveUI = me.$resposiveUI.prop("checked");
            me.settings.email = me.$email.val();

            me.options.$reportExplorer.reportExplorer("saveUserSettings", me.settings);

            me.closeDialog();
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
            //forerunner.dialog.showModalDialog(me.options.$appContainer, function () {
            //    me.element.css("display", "inline-block");
            //});
        },
        /**
         * Close user setting dialog
         *
         * @function $.forerunner.userSettings#closeDialog
         */
        closeDialog: function () {
            var me = this;

            forerunner.dialog.closeModalDialog(me.options.$appContainer, me);
            //forerunner.dialog.closeModalDialog(me.options.$appContainer, function () {
            //    me.element.css("display", "");
            //});
        }
    }); //$.widget
});