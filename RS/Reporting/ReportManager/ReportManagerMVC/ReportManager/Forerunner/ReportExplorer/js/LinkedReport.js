/**
 * @file Contains the forerunnerLinkedReport widget.
 */
var forerunner = forerunner || {};
// Forerunner SQL Server Reports
forerunner.ssr = forerunner.ssr || {};

$(function () {
    var widgets = forerunner.ssr.constants.widgets;
    var events = forerunner.ssr.constants.events;
    var propertyEnums = forerunner.ssr.constants.properties;
    var locData = forerunner.localize.getLocData(forerunner.config.forerunnerFolder() + "ReportViewer/loc/ReportViewer");

    /**
    * Widget used to manage item linked report
    *
    * @namespace $.forerunner.forerunnerLinkedReport
    * @prop {Object} options - The options for the linked report dialog
    * @prop {Object} options.$reportExplorer - Report viewer widget
    * @prop {Object} options.$appContainer - The container jQuery object that holds the application
    * @prop {String} options.rsInstance - Optional, Report service instance name
    *
    * @example
    * $("#property").forerunnerLinkedReport({
    *     $appContainer: me.options.$appContainer,
    *     $reportExplorer: me.$explorer
    * });
    */
    $.widget(widgets.getFullname(widgets.forerunnerLinkedReport), {
        options: {
            $appContainer: null,
            $reportExplorer: null,
            reportManagerAPI: null,
            rsInstance: null
        },
        rootPath: "/",

        _create: function () {
            var me = this;

            var linked = locData.linkedReport,
                common = locData.common;

            me.guid = forerunner.helper.guidGen();
            me.curPath = null;

            me.element.children().remove();
            me.element.off(events.modalDialogGenericSubmit);
            me.element.off(events.modalDialogGenericCancel);

            var headerHtml = forerunner.dialog.getModalDialogHeaderHtml('fr-icons24x24-tags', linked.title, "fr-linked-cancel", common.cancel);

            var $container = new $(
               "<div class='fr-core-dialog-innerPage fr-core-center'>" +
                    headerHtml +
                    "<form class='fr-linked-form fr-core-dialog-form'>" +
                        "<div class='fr-linked-container'>" +
                            "<div class='fr-linked-prompt'></div>" +
                             // Dropdown container
                            "<div class='fr-linked-input-container fr-linked-dropdown-container'>" +
                                "<label class='fr-linked-label fr-linked-tree-label' >" + linked.location + "</label>" +
	                            "<input type='text' name='location' class='fr-core-input fr-linked-input fr-linked-location fr-core-cursorpointer' readonly='true' required='true' allowblank='false' nullable='false'/>" +
	                            "<div class='fr-linked-dropdown-iconcontainer fr-core-cursorpointer'>" +
		                            "<div class='fr-linked-dropdown-icon'></div>" +
	                            "</div>" +
                                "<span class='fr-linked-error-span'/>" +
                            "</div>" +
                            "<div class='fr-linked-input-container'>" +
                                "<label class='fr-linked-label'>" + common.name + "</label>" +
                                "<input type='text' name='linkedname' class='fr-core-input fr-linked-input fr-linked-name' autocomplete='off' required='true' />" +
                                "<span class='fr-linked-error-span' />" +
                            "</div>" +
                        "</div>" +
                        "<div class='fr-core-dialog-submit-container fr-linked-submit-container'>" +
                            "<div class='fr-core-center'>" +
                                "<input type='button' class='fr-linked-submit fr-core-dialog-button' value='" + common.submit + "' />" +
                                "<input type='button' class='fr-linked-cancel fr-core-dialog-button' value='" + common.cancel + "' />" +
                            "</div>" +
                        "</div>" +
                    "</form>" +
                "</div>");

            me.element.append($container);

            //add form validation
            me.$prompt = me.element.find(".fr-linked-prompt");
            me.$form = me.element.find(".fr-linked-form");

            me.$name = me.element.find(".fr-linked-name");
            me.$location = me.element.find(".fr-linked-location");
            me.$treeLabel = me.element.find(".fr-linked-tree-label");

            me._bindEvents();
        },
        _init: function () {
            var me = this;

            me._reset();
        },
        _bindEvents: function () {
            var me = this;

            me._resetValidateMessage();
            me._validateForm(me.$form);

            me.$location.on('click', function () {
                me._openPopup.call(me)
            });

            me.element.find(".fr-linked-dropdown-icon").on("click", function () {
                me._openPopup.call(me)
            });

            me.element.find(".fr-linked-submit").on("click", function () {
                me._submit();
            });

            me.element.find(".fr-linked-cancel").on("click", function () {
                me.closeDialog();
            });

            me.element.on(events.modalDialogGenericSubmit, function () {
                me._submit();
            });

            me.element.on(events.modalDialogGenericCancel, function () {
                me.closeDialog();
            });
        },
        _submit: function () {
            var me = this;

            if (!me.$form.valid()) {
                return;
            }

            me.isLinkedReport ? me._setReportLink() : me._createLinkedReport();
        },
        _reset: function () {
            var me = this;

            me.$name.val('');
            me.$location.removeAttr("title").val('');
        },
        _openPopup: function () {
            var me = this;

            //calculate the tree container width
            //handle border width
            var width = me.$location.width() + 4 + 24;

            me.$location.catalogTree("toggleCatalog", width);
        },
        setData: function (catalogItem){
            var me = this,
                prompt,
                treeLabel;

            me.reportType = catalogItem.Type;
            me.curPath = catalogItem.Path;
            me.linkedReportName = catalogItem.Name;

            me.isLinkedReport = me.reportType === forerunner.ssr.constants.itemType.linkedReport ? true : false;

            me._reset();

            var catalogTreeOptions = {
                rootPath: "/",
                $appContainer: me.options.$appContainer,
                $reportExplorer: me.options.$reportExplorer,
                reportManagerAPI: me.options.reportManagerAPI,
                containerClass: "fr-linked-popup-container",
                catalogTreeClass: "fr-linked-tree-container",
                rsInstance: me.options.rsInstance
            };
            debugger;
            if (me.isLinkedReport) {
                me._getReportLink();
                me.$name.attr("disabled", true);
                prompt = locData.linkedReport.edit.format(me.curPath);
                treeLabel = locData.linkedReport.report;

                catalogTreeOptions.type = "fullCatalog";
            } else {
                me.$name.removeAttr("disabled");
                prompt = locData.linkedReport.create.format(me.curPath);
                treeLabel = locData.linkedReport.locatiton;

                catalogTreeOptions.type = "subCatalog";
            }

            me.$prompt.text(prompt);
            me.$treeLabel.text(treeLabel);

            //initialized catalog tree widget on the location input element
            me.$location.catalogTree(catalogTreeOptions);

            //after the item is selected this event will be triggered
            me.$location.off(events.forerunnerCatalogSelected());
            me.$location.on(events.forerunnerCatalogSelected(), function (e, data) {
                var location = data.path;
                me.$location.attr("title", location).val(location).valid();
            });
        },
        /**
         * Show the linked report modal dialog.
         *
         * @function $.forerunner.forerunnerProperties#openDialog
         */
        openDialog: function () {
            var me = this;

            forerunner.dialog.dialogLock = true;

            forerunner.dialog.showModalDialog(me.options.$appContainer, me);
        },
        /**
         * Close the linked report modal dialog.
         *
         * @function $.forerunner.forerunnerProperties#closeDialog
         */
        closeDialog: function () {
            var me = this;

            forerunner.dialog.dialogLock = false;

            me._trigger(events.close, null, { $forerunnerLinkedReport: me.element, path: me.curPath });
            forerunner.dialog.closeModalDialog(me.options.$appContainer, me);
        },
        _getReportLink: function () {
            var me = this;

            forerunner.ajax.ajax({
                type: "GET",
                dataType: "JSON",
                url: forerunner.config.forerunnerAPIBase() + "ReportManager/GetReportLink",
                async: false,
                data: {
                    path: me.curPath
                },
                success: function (data) {
                    me.$location.attr("title", data.linkedReport).val(data.linkedReport);
                    me.$name.val(me.linkedReportName);
                },
                fail: function (data) {

                },
            });
        },
        _setReportLink: function () {
            var me = this,
                fileLocation = $.trim(me.$location.val());

            forerunner.ajax.ajax({
                type: "POST",
                dataType: "JSON",
                url: forerunner.config.forerunnerAPIBase() + "ReportManager/SetReportLink",
                async: true,
                data: {
                    linkedReportPath: me.curPath,
                    newLink: fileLocation
                },
                success: function (data) {
                    if (data.Exception) {
                        forerunner.dialog.showMessageBox(me.options.$appContainer, data.Exception.Message);

                        console.log('Set linked report wrong.', data.Exception);
                        return;
                    }

                    me.closeDialog();
                },
                fail: function (data) {
                },
            });
        },
        _createLinkedReport: function () {
            var me = this,
                fileLocation = $.trim(me.$location.val()),
                linkedName = $.trim(me.$name.val());

            forerunner.ajax.ajax({
                type: "POST",
                dataType: "JSON",
                url: forerunner.config.forerunnerAPIBase() + "ReportManager/CreateLinkedReport",
                async: true,
                data: {
                    name: linkedName,
                    parent: fileLocation,
                    link: me.curPath
                },
                success: function (data) {
                    if (data.Exception) {
                        forerunner.dialog.showMessageBox(me.options.$appContainer, data.Exception.Message);

                        console.log('Create linked report wrong.', data.Exception);
                        return;
                    }

                    me.closeDialog();
                },
                fail: function (data) {
                },
            });

        },
        _validateForm: function ($form) {
            $form.validate({
                errorPlacement: function (error, element) {
                    error.appendTo($(element).siblings(".fr-linked-error-span"));
                },
                highlight: function (element) {
                    $(element).addClass("fr-linked-error");
                },
                unhighlight: function (element) {
                    $(element).removeClass("fr-linked-error");
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
    });
});