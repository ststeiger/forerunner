/**
 * @file Contains the datasource credential modal dialog widget.
 *
 */

// Assign or create the single globally scoped variable
var forerunner = forerunner || {};

// Forerunner SQL Server Reports
forerunner.ssr = forerunner.ssr || {};

$(function () {
    var widgets = forerunner.ssr.constants.widgets;
    var events = forerunner.ssr.constants.events;
    var locData = forerunner.localize.getLocData(forerunner.config.forerunnerFolder() + "/ReportViewer/loc/ReportViewer");
    var dsCredential = locData.dsCredential;
    /**
   * Widget used to show datasource credential dialog
   *
   * @namespace $.forerunner.dsCredemtial
   */
    $.widget(widgets.getFullname(widgets.dsCredential), {
        options: {
            $reportViewer: null,
            $appContainer: null
        },
        create: function () {

        },
        _init: function () {
            var me = this;

            me.element.html("");
            var headerHtml = forerunner.dialog.getModalDialogHeaderHtml('fr-icons24x24-setup', dsCredential.title, "fr-dsc-cancel", dsCredential.cancel);
            var $dialog = $(
                "<div class='fr-core-dialog-innerPage fr-core-center fr-dsc-innerPage'>" +
                    headerHtml +
                    "<form class='fr-core-dialog-form fr-dsc-form'>" +
                        "<div class='fr-core-center'>" +
                            "<div class='fr-dsc-main-container'></div>" +
                            "<div class='fr-core-dialog-submit-container'>" +
                                "<div class='fr-core-center'>" +
                                    "<input name='submit' type='button' class='fr-dsc-submit-id fr-dsc-button fr-core-dialog-button' value='" + dsCredential.submit + "' />" +
                                    "<input name='reset' type='button' class='fr-dsc-reset-id fr-dsc-button fr-core-dialog-button' value='" + dsCredential.reset + "' />" +
                                "</div>" +
                            "</div>" +
                        "</div>" +
                    "</form>" +
                "</div>");

            me.element.append($dialog);
            me.$container = me.element.find(".fr-dsc-main-container");
            me.$form = me.element.find('.fr-dsc-form');

            me._resetValidateMessage();

            me.element.find(".fr-dsc-cancel").on("click", function () {
                me.closeDialog();
            });

            me.element.find(".fr-dsc-reset-id").on("click", function () {
                me._resetCredential();
            });

            me.element.find(".fr-dsc-submit-id").on("click", function () {
                me._submitCredential();
            });

            if (me.options.$reportViewer) {
                me._initCallback();
            }
        },
        _initCallback: function () {
            var me = this;

            me.options.$reportViewer.on(events.reportViewerRenderError(), function (e, data) {
                //highlight error datasource label by change color to right
                var error = data.Exception.Message.match(/[“"]([^"“”]*)["”]/)[0];
                var datasourceID = error.replace(/["“”]/g, '');
                me.element.find("[name='" + datasourceID + "']").find(".fr-dsc-label").addClass("fr-dsc-label-error");
            });
        },
        _createRows: function (credentials) {
            var me = this;
            me.$container.html("");

            $.each(credentials, function (index, credential) {
                var $item = $(
                  "<div class='fr-dsc-item-container' name='" + credential.DataSourceID + "'>" +
                      "<div class='fr-dsc-prompt'>" +
                          "<div>" + credential.Name + " - " + credential.Prompt + "</div>" +
                      "</div>" +
                      "<div class='fr-dsc-username'>" +
                          "<label class='fr-dsc-label' >" + dsCredential.username + "</label>" +
                          "<div class='fr-dsc-input-container'>" +
                              "<input type='text' name='" + credential.Name + "-username' required='true' class='fr-dsc-text-input fr-dsc-username-input' />" +
                              "<span class='fr-dsc-error-span' />" +
                          "</div>" +
                      "</div>" +
                      "<div class='fr-dsc-password'>" +
                          "<label class='fr-dsc-label' >" + dsCredential.password + "</label>" +
                          "<div class='fr-dsc-input-container'>" +
                              "<input type='password' name='" + credential.Name + "-password' required='true' class='fr-dsc-text-input fr-dsc-password-input' />" +
                              "<span class='fr-dsc-error-span' />" +
                          "</div>" +
                      "</div>" +
                  "</div>");

                $item.find('.fr-dsc-text-input').on("keydown", function (e) {
                    if (e.keyCode === 13) {
                        me._submitCredential();
                    } // Enter
                });

                me.$container.append($item);
            });

            me._validateForm(me.$form);
        },
        _submitCredential: function () {
            var me = this;

            var credentialList = me.getCredentialList();
            if (credentialList) {
                me.options.$reportViewer.reportViewer("loadReportWithCustomDSCredential", credentialList);
                me.closeDialog();

                me.element.find(".fr-dsc-label-error").removeClass("fr-dsc-label-error");
            }
        },
        openDialog: function () {
            var me = this;
            forerunner.dialog.showModalDialog(me.options.$appContainer, me);
        },
        writeDialog: function (credentials) {
            var me = this;
            if (credentials) {
                me._createRows(credentials);
                forerunner.dialog.showModalDialog(me.options.$appContainer, me);
            }
        },
        closeDialog: function () {
            var me = this;
            forerunner.dialog.closeModalDialog(me.options.$appContainer, me);
        },
        resetSavedCredential: function (credentials, savedCredential) {
            var me = this;

            if (credentials) {
                me._createRows(credentials);
            }
            if (savedCredential) {
                var savedData = JSON.parse(savedCredential);
                
                $.each(savedData.CredentialList, function (index, data) {
                    var targetContainer = me.element.find("[name='" + data.DataSourceID + "']");
                    targetContainer.find(".fr-dsc-username-input").val(data.Username);
                    targetContainer.find(".fr-dsc-password-input").val(data.Password);
                });
            }
        },
        _resetCredential: function () {
            var me = this;
            me.element.find(".fr-dsc-text-input").val("");
        },
        getCredentialList: function () {
            var me = this;
            if (me.$form.valid()) {
                var credentialList = [];
                var containers = me.options.$appContainer.find(".fr-dsc-item-container");

                $.each(containers, function (index, container) {
                    var dsID = $(container).attr("name");
                    var un = $(container).find(".fr-dsc-username-input").val();
                    var pwd = $(container).find(".fr-dsc-password-input").val();

                    credentialList.push({ DataSourceID: dsID, Username: un, Password: pwd });
                });
                return JSON.stringify({ "CredentialList": credentialList });
            }
            return null;
        },
        _validateForm: function (form) {
            form.validate({
                
                errorPlacement: function (error, element) {
                    error.appendTo($(element).parent().find(".fr-dsc-error-span"));
                },
                highlight: function (element) {
                    $(element).parent().find(".fr-dsc-error-span").addClass("fr-dsc-error-position");
                    $(element).addClass("fr-dsc-error");
                },
                unhighlight: function (element) {
                    $(element).parent().find(".fr-dsc-error-span").removeClass("fr-dsc-error-position");
                    $(element).removeClass("fr-dsc-error");
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
}); // $(function())