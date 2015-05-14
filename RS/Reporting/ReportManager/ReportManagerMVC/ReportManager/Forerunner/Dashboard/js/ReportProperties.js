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
     * Widget used to select a new dashboard template
     *
     * @namespace $.forerunner.createDashboard
     * @prop {Object} options - The options for the create dashboard dialog
     * @prop {String} options.reportManagerAPI - Path to the REST calls for the reportManager
     * @prop {Object} options.$appContainer - Dashboard container
     * @prop {Object} options.$dashboardEditor - Dashboard Editor widget
     * @prop {Object} options.reportId - Target Report Id
     * @prop {String} options.title - Dialog title
     * @prop {String} options.iconClass - Style class of the dialog icon
     *
     * @example
     * $("#reportPropertiesDialog").reportProperties({
     *      reportManagerAPI: me.options.reportManagerAPI,
     *      $appContainer: me.options.$appContainer,
     *      $dashboardEditor: me,
     *      reportId: e.target.name
     * });
     */
    $.widget(widgets.getFullname(widgets.reportProperties), $.forerunner.dialogBase, /** @lends $.forerunner.newFolder */ {
        options: {
            reportManagerAPI: null,
            $appContainer: null,
            $dashboardEditor: null,
            reportId: null,
            title: reportProperties.title,
            iconClass: "fr-rp-icon-edit"
        },
        _init: function () {
            var me = this;
            me._super();

            me.$form.addClass("fr-rp-form");

            var $main = $(
                "<input name='add' type='button' value='" + reportProperties.removeReport + "' title='" + reportProperties.removeReport + "' class='fr-rp-remove-report-id fr-rp-action-button fr-core-dialog-button'/>" +
                // Dropdown container
                "<div class='fr-rp-dropdown-container'>" +
                    "<input type='text' class='fr-rp-report-input-id fr-rp-text-input fr-core-input fr-core-cursorpointer' autofocus='autofocus' readonly='readonly' allowblank='false' nullable='false'/>" +
                    "<span class='fr-dlb-error-span'/>" +
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
                "</table>");

            me.$formMain.html("");
            me.$formMain.append($main);

            me.$removeReport = me.element.find(".fr-rp-remove-report-id");
            me.$removeReport.off("click");
            me.$removeReport.on("click", function (e, data) {
                me._onRemoveReport.apply(me, arguments);
            });

            // Toolbar options
            me.$hideToolbar = me.element.find(".fr-rp-hide-toolbar-id");
            me.$hideToolbar.off("change");
            me.$hideToolbar.on("change", function (e, data) {
                me._onChangeToolbarOption.apply(me, arguments);
            });

            me.$minimalToolbar = me.element.find(".fr-rp-minimal-toolbar-id");
            me.$minimalToolbar.off("change");
            me.$minimalToolbar.on("change", function (e, data) {
                me._onChangeToolbarOption.apply(me, arguments);
            });

            me.$fullToolbar = me.element.find(".fr-rp-full-toolbar-id");
            me.$fullToolbar.off("change");
            me.$fullToolbar.on("change", function (e, data) {
                me._onChangeToolbarOption.apply(me, arguments);
            });

            me.$dropdown = me.element.find(".fr-rp-dropdown-container");
            me.$dropdown.find(".fr-rp-dropdown-icon").off("click");
            me.$dropdown.find(".fr-rp-dropdown-icon").on("click", function (e) {
                me._onClickTreeDropdown.apply(me, arguments);
            });

            me.$reportInput = me.element.find(".fr-rp-report-input-id");
            me.$reportInput.watermark(reportProperties.selectReport, forerunner.config.getWatermarkConfig());
            me.$reportInput.off("click");
            me.$reportInput.on("click", function (e) {
                me._onClickTreeDropdown.apply(me, arguments);
            });

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
                allowFolderSelection: false,
                $appContainer: me.options.$appContainer,
                reportManagerAPI: me.options.reportManagerAPI,
                containerClass: "fr-rp-popup-container",
                catalogTreeClass: "fr-report-tree-id fr-rp-tree-container"
            });

            me.showLoadingIndictator();

            // Fired after the catalog is returned from the server
            me.$reportInput.off(events.catalogTreeGetCatalogComplete());
            me.$reportInput.on(events.catalogTreeGetCatalogComplete(), function (e, data) {
                me.removeLoadingIndicator();
            });

            //after the item is selected this event will be triggered
            me.$reportInput.off(events.catalogTreeCatalogSelected());
            me.$reportInput.on(events.catalogTreeCatalogSelected(), function (e, data) {
                var location = data.path;

                // Set the value if this is a report
                if (data.item.Type === forerunner.ssr.constants.itemType.report) {
                    me.$reportInput.attr("title", location).val(location).valid();
                    me.properties.catalogItem = data.item;

                    // Clear any previously save parameters. These get added on the save call later
                    me.properties.parameters = null;
                }
            });

            me._validateForm(me.$form);
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

            // Show the dropdown
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
    }); //$.widget
});