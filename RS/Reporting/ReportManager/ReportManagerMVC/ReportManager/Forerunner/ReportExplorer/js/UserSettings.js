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
            me._reset();
           
            var locData = forerunner.localize;
            var userSettings = locData.getLocData().userSettings;
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
                                "<input class='fr-us-admin-ui-id fr-us-checkbox' name='adminUI' type='checkbox'/>" +
                            "</td>" +
                        "</tr>" +
                        "<tr>" +
                            "<td>" +
                                "<label class='fr-us-label'>" + userSettings.ViewStyle + "</label>" +
                            "</td>" +
                            "<td>" +
                                "<select class='fr-us-viewStyle-id fr-us-dropdown' name='viewStyle' list='viewStyles'>" +
                                    "<option value='large'>" + userSettings.ViewStyleLarge + "</option>" +
                                    "<option value='small'>" + userSettings.ViewStyleSmall + "</option>" +
                                    "<option value='list'>" + userSettings.ViewStyleList + "</option>" +
                                "</select>" +
                            "</td>" +
                        "</tr>" +
                        "<tr>" +
                            "<td>" +
                                "<label class='fr-us-label'>" + userSettings.ParamLayout + "</label>" +
                            "</td>" +
                            "<td>" +
                                "<select class='fr-us-paramLayout-id fr-us-dropdown' name='paramLayout' list='paramLayout'>" +
                                    "<option value='right'>" + userSettings.ParamLayoutRight + "</option>" +
                                    "<option value='top'>" + userSettings.ParamLayoutTop + "</option>" +
                                "</select>" +
                            "</td>" +
                        "</tr>" +
                        "<tr class='param-toplayout-prompt fr-hide'>" +
                            "<td colspan='2'>" +
                                "<span class='fr-us-prompt'>"+ userSettings.ParamLayoutTopPrompt + "</span>" +
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
                "</div>" +
            "</div>");

            me.element.append($theForm);            

            //Set build number            
            forerunner.ajax.getBuildVersion(function (version) {
                me.element.find(".fr-buildversion-container").html(version);
            });

            me.$paramLayout = me.element.find(".fr-us-paramLayout-id");
            me.$paramLayout.on("change", function () {
                var $option = $(this),
                    $prompt = $option.closest("tr").siblings(".param-toplayout-prompt");

                $option.val().toLowerCase() === "top" ? $prompt.removeClass("fr-hide"): $prompt.addClass("fr-hide");
            });

            //disable form auto submit when click enter on the keyboard
            me.element.find(".fr-us-form").on("submit", function () { return false; });

            me.element.on("click", ".fr-us-submit-id", function (e) {
                me._saveSettings();
            });

            me.element.on("click", ".fr-us-cancel", function (e) {
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
            var viewStyle = me.settings.viewStyle || "large";
            me.$viewStyle.val(viewStyle);

            me.$paramLayout = me.element.find(".fr-us-paramLayout-id");
            var paramLayout = me.settings.paramLayout || "right";
            me.$paramLayout.val(paramLayout);
            me.$paramLayout.triggerHandler("change");
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
                viewStyle = me.$viewStyle.val(),
                paramLayout = me.$paramLayout.val();

            if (me.settings.responsiveUI === responsiveUI
                && me.settings.adminUI === adminUI
                && me.settings.viewStyle === viewStyle
                && me.settings.paramLayout === paramLayout) {

                //nothing change, just close dialog
                me.closeDialog();
                return;
            }

            me.settings.responsiveUI = responsiveUI;
            me.settings.adminUI = adminUI;
            me.settings.viewStyle = viewStyle;
            me.settings.paramLayout = paramLayout;
            
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
        },
        _reset: function () {
            var me = this;

            me.element.html("");
            me.element.off(events.modalDialogGenericSubmit);
            me.element.off(events.modalDialogGenericCancel);
            me.$paramLayout && me.$paramLayout.off("change");
        }
    }); //$.widget
});