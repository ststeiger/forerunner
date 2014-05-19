/**
 * @file Contains the print widget.
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
    var reportProperties = locData.reportProperties;

    /**
     * Widget used to select a new dashbard template
     *
     * @namespace $.forerunner.createDashboard
     * @prop {Object} options - The options for the create dashboard dialog
     * @prop {Object} options.$appContainer - Dashboard container
     *
     * @example
     * $("#reportPropertiesDialog").reportProperties({
     /  });
     */
    $.widget(widgets.getFullname(widgets.reportProperties), {
        options: {
            $appContainer: null
        },
        _init: function() {
        },
        _create: function () {
            var me = this;

            me.element.html("");

            var headerHtml = forerunner.dialog.getModalDialogHeaderHtml("fr-icons24x24-setup", reportProperties.title, "fr-rp-cancel", reportProperties.cancel);
            var $dialog = $(
                "<div class='fr-core-dialog-innerPage fr-core-center'>" +
                    headerHtml +
                    "<form class='fr-rp-form fr-core-dialog-form'>" +
                        // Dropdown container
                        "<div class='fr-rp-dropdown-container'>" +
                            "<input type='text' placeholder='" + reportProperties.selectReport + "' class='fr-rp-report-input-id fr-rp-text-input fr-core-cursorpointer' readonly='readonly' allowblank='false' nullable='false' required='required' />" +
                            "<div class='fr-rp-dropdown-iconcontainer fr-core-cursorpointer'>" +
                                "<div class='fr-rp-dropdown-icon'></div>" +
                            "</div>" +
                        "</div>" +
                        // Popup container
                        "<div class='fr-rp-popup-container'>" +
                            "<div class='fr-reportTree-id fr-rp-tree-container'>" +
                                "<ul>" +
                                    "<li>root 1" +
                                        "<ul>" +
                                            "<li>foo bang boo</li>" +
                                            "<li>foo bang 2</li>" +
                                            "<li>foo bang 3</li>" +
                                            "<li>foo bang 4</li>" +
                                            "<li>foo bang 5</li>" +
                                        "</ul>" +
                                    "</li>" +
                                    "<li>root 2</li>" +
                                "</ul>" +
                            "</div>" +
                        "</div>" +
                        // Submit conatiner
                        "<div class='fr-core-dialog-submit-container'>" +
                            "<div class='fr-core-center'>" +
                                "<input name='submit' type='button' class='fr-rp-submit-id fr-core-dialog-submit fr-core-dialog-button' value='" + reportProperties.submit + "' />" +
                            "</div>" +
                        "</div>" +
                    "</form>" +
                "</div>");

            me.element.append($dialog);

            me.$dropdown = me.element.find(".fr-rp-dropdown-container");
            me.$dropdown.on("click", function (e) {
                me._onClickTreeDropdown.apply(me, arguments);
            })

            me.$reportInput = me.element.find(".fr-rp-report-input-id");

            me.$popup = me.element.find(".fr-rp-popup-container");

            me.$tree = me.element.find(".fr-reportTree-id");
            me.$tree.jstree();

            me.$tree.on("changed.jstree", function (e, data) {
                me._onChangedjsTree.apply(me, arguments);
            });

            me.$form = me.element.find(".fr-rp-form");

            me.element.find(".fr-rp-cancel").on("click", function(e) {
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
        _onChangedjsTree: function (e, data) {
            var me = this;

            // TODO - Change this to explicitally check for a folder node
            if (data.node.children.length === 0) {
                me.$reportInput.val(data.node.text);
                me.$popup.hide();
            }
        },
        _onClickTreeDropdown: function (e) {
            var me = this;
            // Show the popup
            var top = me.$dropdown.offset().top + me.$dropdown.height();
            var left = me.$dropdown.offset().left;
            var width = me.$dropdown.width();
            me.$popup.css({ top: top, left: left, width: width });
            me.$popup.toggle();
        },
        _submit: function () {
            var me = this;

            me.closeDialog();
        },
        /**
         * Open parameter set dialog
         *
         * @function $.forerunner.createDashboard#openDialog
         */
        openDialog: function () {
            var me = this;
            forerunner.dialog.showModalDialog(me.options.$appContainer, me);
        },
        /**
         * Close parameter set dialog
         *
         * @function $.forerunner.manageParamSets#closeDialog
         */
        closeDialog: function () {
            var me = this;
            forerunner.dialog.closeModalDialog(me.options.$appContainer, me);
        },
    }); //$.widget
});