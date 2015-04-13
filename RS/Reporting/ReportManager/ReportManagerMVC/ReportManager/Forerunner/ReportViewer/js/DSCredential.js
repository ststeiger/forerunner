/**
 * @file Contains the datasource credential widget.
 *
 */

// Assign or create the single globally scoped variable
var forerunner = forerunner || {};

// Forerunner SQL Server Reports
forerunner.ssr = forerunner.ssr || {};

$(function () {
    var widgets = forerunner.ssr.constants.widgets;
    var events = forerunner.ssr.constants.events;
    var locData = forerunner.localize.getLocData(forerunner.config.forerunnerFolder() + "ReportViewer/loc/ReportViewer");
    var dsCredential = locData.dsCredential;
    /**
     * Widget used to manage report datasource credential
     *
     * @namespace $.forerunner.dsCredential
     * @prop {Object} options - The options for dsCredential
     * @prop {Object} options.$reportViewer - Report viewer widget
     * @prop {Object} options.$appContainer - The container jQuery object that holds the application
     *
     * @example
     * $("#dsCredential").dsCredential({
     *  $appContainer: me.$appContainer, 
     *  $reportViewer: $viewer
     * });
    */
    $.widget(widgets.getFullname(widgets.dsCredential), {
        options: {
            $reportViewer: null,
            $appContainer: null
        },
        _credentialData: null,
        _create: function () {
        },
        _init: function () {
        },
        _initBody: function () {
            var me = this;

            me.element.html("");
            me.element.off(events.modalDialogGenericSubmit);
            me.element.off(events.modalDialogGenericCancel);

            var headerHtml = forerunner.dialog.getModalDialogHeaderHtml("fr-icons24x24-dataSourceCred", dsCredential.title, "fr-dsc-cancel", dsCredential.cancel);
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
            me.$form = me.element.find(".fr-dsc-form");

            //disable form auto submit when click enter on the keyboard
            me.$form.on("submit", function () { return false; });

            me._resetValidateMessage();

            me.element.find(".fr-dsc-cancel").on("click", function () {
                me.closeDialog();
                if (me._credentialData) {
                    me._createRows();
                }
            });

            me.element.find(".fr-dsc-reset-id").on("click", function () {
                me._resetCredential();
            });

            me.element.find(".fr-dsc-submit-id").on("click", function () {
                me._submitCredential();
            });

            me.element.on(events.modalDialogGenericSubmit, function () {
                me._submitCredential();
            });

            me.element.on(events.modalDialogGenericCancel, function () {
                me.closeDialog();
            });

            if (me.options.$reportViewer) {
                me._initCallback();
            }
        },
        _createRows: function (credentials) {
            var me = this;
            credentials = credentials || me._credentialData;
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
                              "<input type='text' autocomplete='off' name='" + credential.Name + "-username' required='true' class='fr-core-input fr-dsc-text-input fr-dsc-username-input' />" +
                              "<span class='fr-dsc-error-span' />" +
                          "</div>" +
                      "</div>" +
                      "<div class='fr-dsc-password'>" +
                          "<label class='fr-dsc-label' >" + dsCredential.password + "</label>" +
                          "<div class='fr-dsc-input-container'>" +
                              "<input type='password' autocomplete='off' name='" + credential.Name + "-password' required='true' class='fr-core-input fr-dsc-text-input fr-dsc-password-input' />" +
                              "<span class='fr-dsc-error-span' />" +
                          "</div>" +
                      "</div>" +
                  "</div>");
                
                me.$container.append($item);
            });

            me._validateForm(me.$form);
        },
        _initCallback: function () {
            var me = this;

            me.options.$reportViewer.on(events.reportViewerRenderError(), function (e, data) {
                //highlight error datasource label by change color to red
                var error = data.Exception.Message.match(/[“"']([^"“”']*)["”']/);
                if (error && me._credentialData) {
                    var datasourceID = error[0].replace(/["“”']/g, "");
                    me.element.find("[name='" + datasourceID + "']").find(".fr-dsc-label").addClass("fr-dsc-label-error");
                    me.openDialog();
                }
            });
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
        /**
         * Open datasource credential dialog
         *
         * @function $.forerunner.dsCredential#openDialog
         */
        openDialog: function () {
            var me = this;
            forerunner.dialog.showModalDialog(me.options.$appContainer, me);
        },
        /**
         * Write datasource credential dialog by specify Sql Server datasource credential data
         *
         * @function $.forerunner.dsCredential#writeDialog
         *
         * @param {Object} credentials - Report service returned datasource credential data
         */
        writeDialog: function (credentials) {
            var me = this;
            me._initBody();
            me._credentialData = credentials || me._credentialData;
            
            if (me._credentialData) {
                me._createRows(me._credentialData);
            }
        },
        /**
         * Close datasource credential dialog
         *
         * @function $.forerunner.dsCredential#closeDialog
         */
        closeDialog: function () {
            var me = this;
            forerunner.dialog.closeModalDialog(me.options.$appContainer, me);
        },
        /**
         * Reset datasource credential dialog
         *
         * @function $.forerunner.dsCredential#resetSavedCredential
         *
         * @param {Object} credentials - Datasource credential data
         * @param {Object} savedCredential - Widget saved datasource credential
         */
        resetSavedCredential: function (credentials, savedCredential) {
            var me = this;

            if (credentials) {
                me._initBody();
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
        /**
         * Get user input credential in JSON format string
         *
         * @function $.forerunner.dsCredential#getCredentialList
         *
         * @return {String} Return credential in JSON format string If form valid, if not return null
         */
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
        /**
         * Removes the dsCredential functionality completely. This will return the element back to its pre-init state.
         *
         * @function $.forerunner.dsCredential#destroy
         */
        destroy: function () {
            var me = this;
            me._credentialData = null;

            this._destroy();
        },
    }); //$.widget
}); // $(function())