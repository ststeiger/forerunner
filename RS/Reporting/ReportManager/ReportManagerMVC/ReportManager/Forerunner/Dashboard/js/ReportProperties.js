/**
 * @file Contains the reportProperties widget.
 *
 */

// Assign or create the single globally scoped variable
var forerunner = forerunner || {};

// Forerunner SQL Server Reports
forerunner.ssr = forerunner.ssr || {};

$(function () {
    var constants = forerunner.ssr.constants;
    var widgets = constants.widgets;
    var events = constants.events;
    var locData = forerunner.localize.getLocData(forerunner.config.forerunnerFolder() + "ReportViewer/loc/ReportViewer");
    var reportProperties = locData.reportProperties;

    /**
     * Widget used to select a new dashbard template
     *
     * @namespace $.forerunner.createDashboard
     * @prop {Object} options - The options for the create dashboard dialog
     * @prop {String} options.reportManagerAPI - Path to the REST calls for the reportManager
     * @prop {Object} options.$appContainer - Dashboard container
     * @prop {Object} options.$dashboardEditor - Dashboard Editor widget
     * @prop {Object} options.reportId - Target Report Id
     *
     * @example
     * $("#reportPropertiesDialog").reportProperties({
     *      reportManagerAPI: me.options.reportManagerAPI,
     *      $appContainer: me.options.$appContainer,
     *      $dashboardEditor: me,
     *      reportId: e.target.name
     * });
     */
    $.widget(widgets.getFullname(widgets.reportProperties), {
        options: {
            reportManagerAPI: null,
            $appContainer: null,
            $dashboardEditor: null,
            reportId: null
        },
        _create: function () {
            var me = this;

            me.element.html("");
            me.element.off(events.modalDialogGenericSubmit);
            me.element.off(events.modalDialogGenericCancel);

            var headerHtml = forerunner.dialog.getModalDialogHeaderHtml("fr-rp-icon-edit", reportProperties.title, "fr-rp-cancel", reportProperties.cancel);
            var $dialog = $(
                "<div class='fr-core-dialog-innerPage fr-core-center'>" +
                    headerHtml +
                    "<form class='fr-rp-form fr-core-dialog-form'>" +
                        "<input name='add' type='button' value='" + reportProperties.removeReport + "' title='" + reportProperties.removeReport + "' class='fr-rp-remove-report-id fr-rp-action-button fr-core-dialog-button'/>" +
                        // Dropdown container
                        "<div class='fr-rp-dropdown-container'>" +
                            "<input type='text' class='fr-rp-report-input-id fr-rp-text-input fr-core-input fr-core-cursorpointer' autofocus='autofocus' readonly='readonly' allowblank='false' nullable='false'/><span class='fr-rp-error-span'/>" +
                            "<div class='fr-rp-dropdown-iconcontainer fr-core-cursorpointer'>" +
                                "<div class='fr-rp-dropdown-icon'></div>" +
                            "</div>" +
                        "</div>" +
                        // Toolbar options
                        "<table>" +
                            "<tr>" +
                                "<td>" +
                                    "<h3>" +
                                        "<label class='fr-rp-label fr-rp-section-separator'>" + reportProperties.toolbar + "</label>" +
                                    "</h3>" +
                                "</td>" +
                            "</tr>" +
                                "<td>" +
                                    "<label class='fr-rp-label fr-rp-separator'>" + reportProperties.hideToolbar + "</label>" +
                                    "<input class='fr-rp-hide-toolbar-id fr-rp-checkbox' name='hideToolbar' type='checkbox'/>" +
                                "</td>" +
                                "<td>" +
                                    "<label class='fr-rp-label fr-rp-separator'>" + reportProperties.minimal + "</label>" +
                                    "<input class='fr-rp-minimal-toolbar-id fr-rp-checkbox' name='hideToolbar' type='checkbox'/>" +
                                "</td>" +
                                "<td>" +
                                    "<label class='fr-rp-label fr-rp-separator'>" + reportProperties.full + "</label>" +
                                    "<input class='fr-rp-full-toolbar-id fr-rp-checkbox' name='hideToolbar' type='checkbox'/>" +
                                "</td>" +
                            "<tr>" +
                        "</table>" +
                        // Submit conatiner
                        "<div class='fr-rp-submit fr-core-dialog-submit-container'>" +
                            "<div class='fr-core-center'>" +
                                "<input type='button' class='fr-rp-submit-id fr-core-dialog-submit fr-core-dialog-button' value='" + reportProperties.submit + "' />" +
                            "</div>" +
                        "</div>" +
                    "</form>" +
                "</div>");

            me.element.append($dialog);

            me.$form = me.element.find(".fr-rp-form");
            me._validateForm(me.$form);

            me.$removeReport = me.element.find(".fr-rp-remove-report-id");
            me.$removeReport.on("click", function (e, data) {
                me._onRemoveReport.apply(me, arguments);
            });

            // Toolbar options
            me.$hideToolbar = me.element.find(".fr-rp-hide-toolbar-id");
            me.$hideToolbar.on("change", function (e, data) {
                me._onChangeToolbarOption.apply(me, arguments);
            });

            me.$minimalToolbar = me.element.find(".fr-rp-minimal-toolbar-id");
            me.$minimalToolbar.on("change", function (e, data) {
                me._onChangeToolbarOption.apply(me, arguments);
            });

            me.$fullToolbar = me.element.find(".fr-rp-full-toolbar-id");
            me.$fullToolbar.on("change", function (e, data) {
                me._onChangeToolbarOption.apply(me, arguments);
            });

            me.$dropdown = me.element.find(".fr-rp-dropdown-container");
            me.$dropdown.find(".fr-rp-dropdown-icon").on("click", function (e) {
                me._onClickTreeDropdown.apply(me, arguments);
            });

            me.$reportInput = me.element.find(".fr-rp-report-input-id");
            me.$reportInput.watermark(reportProperties.selectReport, forerunner.config.getWatermarkConfig());
            me.$reportInput.on("click", function (e) {
                me._onClickTreeDropdown.apply(me, arguments);
            });

            // Hook the cancel and submit events
            me.element.find(".fr-rp-cancel").on("click", function (e) {
                me.closeDialog();
            });
            me.element.find(".fr-rp-submit-id").on("click", function (e) {
                me._submit();
            });
            me.element.on(events.modalDialogGenericSubmit, function () {
                me._submit();
            });
            me.element.on(events.modalDialogGenericCancel, function () {
                me.closeDialog();
            });
        },
        _init: function () {
            var me = this;

            me.properties = me.options.$dashboardEditor.getReportProperties(me.options.reportId) || {};

            // Restore the report name
            if (me.properties.catalogItem && me.properties.catalogItem.Name) {
                me.$reportInput.val(me.properties.catalogItem.Name);
            } else {
                me.$reportInput.val("");
            }

            // Restore the toolbar option checkboxes
            me._setCheckbox(false, me.$hideToolbar);
            me._setCheckbox(false, me.$minimalToolbar);
            me._setCheckbox(false, me.$fullToolbar);

            if (me.properties.toolbarConfigOption) {
                if (me.properties.toolbarConfigOption === constants.toolbarConfigOption.hide) {
                    me._setCheckbox(true, me.$hideToolbar);
                } else if (me.properties.toolbarConfigOption === constants.toolbarConfigOption.minimal) {
                    me._setCheckbox(true, me.$minimalToolbar);
                } else {
                    me._setCheckbox(true, me.$fullToolbar);
                }
            } else {
                me._setCheckbox(true, me.$hideToolbar);
            }

            //initialized catalog tree widget on the location input element
            me.$reportInput.catalogTree({
                rootPath: "/",
                type: "fullCatalog",
                $appContainer: me.options.$appContainer,
                reportManagerAPI: me.options.reportManagerAPI,
                containerClass: "fr-rp-popup-container",
                catalogTreeClass: "fr-report-tree-id fr-rp-tree-container"
            });

            //after the item is selected this event will be triggered
            me.$reportInput.off(events.forerunnerCatalogSelected());
            me.$reportInput.on(events.forerunnerCatalogSelected(), function (e, data) {
                var location = data.path;

                // Set the value if this is a report
                if (data.item.Type === forerunner.ssr.constants.itemType.report) {
                    me.$reportInput.attr("title", location).val(location).valid();
                    me.properties.catalogItem = data.item;

                    // Clear any previously save parameters. These get added on the save call later
                    me.properties.parameters = null;
                }
            });

            me._resetValidateMessage();
        },        
        _onRemoveReport: function (e, data) {
            var me = this;
            me.$reportInput.val("");
            me.properties.catalogItem = null;
        },
        _onChangeToolbarOption: function (e, data) {
            var me = this;
            me.$hideToolbar.prop("checked", false);
            me.$minimalToolbar.prop("checked", false);
            me.$fullToolbar.prop("checked", false);

            $(e.target).prop("checked", true);
        },
        _onClickTreeDropdown: function (e) {
            var me = this;

            // Show the popup
            var width = me.$dropdown.width() - 2;//minus border width
            me.$reportInput.catalogTree("toggleCatalog", width);
        },
        _setCheckbox: function (setting, $e) {
            if (setting === true) {
                $e.prop("checked", true);
            } else {
                $e.prop("checked", false);
            }
        },
        /**
         * Open parameter set dialog
         *
         * @function $.forerunner.reportProperties#openDialog
         */
        openDialog: function () {
            var me = this;
            forerunner.dialog.showModalDialog(me.options.$appContainer, me);
        },
        _triggerClose: function (isSubmit) {
            var me = this;
            var data = {
                reportId: me.options.reportId,
                isSubmit: isSubmit
            };
            me._trigger(events.close, null, data);
        },
        _submit: function () {
            var me = this;

            if (me.$form.valid() === true) {
                // Toolbar options
                me.properties.toolbarConfigOption = constants.toolbarConfigOption.hide;
                if (me.$minimalToolbar.prop("checked")) {
                    me.properties.toolbarConfigOption = constants.toolbarConfigOption.minimal;
                } else if (me.$fullToolbar.prop("checked")) {
                    me.properties.toolbarConfigOption = constants.toolbarConfigOption.full;
                }

                me.options.$dashboardEditor.setReportProperties(me.options.reportId, me.properties);
                me._triggerClose(true);
                forerunner.dialog.closeModalDialog(me.options.$appContainer, me);
            }
        },
        /**
         * Close parameter set dialog
         *
         * @function $.forerunner.reportProperties#closeDialog
         */
        closeDialog: function () {
            var me = this;
            me._triggerClose(false);
            forerunner.dialog.closeModalDialog(me.options.$appContainer, me);
        },
        _validateForm: function (form) {
            form.validate({
                errorPlacement: function (error, element) {
                    error.appendTo($(element).parent().find("span"));
                },
                highlight: function (element) {
                    $(element).parent().find("span").addClass("fr-rp-error-position");
                    $(element).addClass("fr-rp-error");
                },
                unhighlight: function (element) {
                    $(element).parent().find("span").removeClass("fr-rp-error-position");
                    $(element).removeClass("fr-rp-error");
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
});