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
    var dashboards = forerunner.localize.getLocData(forerunner.config.forerunnerFolder() + "Dashboard/dashboards/dashboards");
    var templates = dashboards.templates;
    var createDashboard = locData.createDashboard;

    /**
     * Widget used to select a new dashbard template
     *
     * @namespace $.forerunner.createDashboard
     * @prop {Object} options - The options for the create dashboard dialog
     * @prop {String} options.$reportViewer - Report viewer widget
     * @prop {Object} options.$appContainer - Report page container
     *
     * @example
     * $("#createDashboardDialog").createDashboard({
     *    $appContainer: me.options.$appContainer,
     *    $reportViewer: $viewer,
     /  });
     */
    $.widget(widgets.getFullname(widgets.createDashboard), {
        options: {
            $reportExplorer: null,
            $appContainer: null,
            model: null
        },
        _createOptions: function() {
            var me = this;

            me.$select = me.element.find(".fr-cdb-select-id")

            for (item in templates) {
                var $option = $("<option value=" + item + ">" + templates[item] + "</option>");
                me.$select.append($option);
            }
        },
        _init: function() {
        },
        _create: function () {
            var me = this;

            me.element.html("");

            var headerHtml = forerunner.dialog.getModalDialogHeaderHtml("fr-icons24x24-createdashboard", createDashboard.title, "fr-cdb-cancel", createDashboard.cancel);
            var $dialog = $(
                "<div class='fr-core-dialog-innerPage fr-core-center'>" +
                    headerHtml +
                    "<form class='fr-cdb-form fr-core-dialog-form'>" +
                        "<div class='fr-core-center'>" +
                            "<select class='fr-cdb-select-id'>" +
                            "</select>" +
                            "<div class='fr-core-dialog-submit-container'>" +
                                "<div class='fr-core-center'>" +
                                    "<input name='submit' type='button' class='fr-cdb-submit-id fr-core-dialog-submit fr-core-dialog-button' value='" + createDashboard.submit + "' />" +
                                "</div>" +
                            "</div>" +

                        "</div>" +
                    "</form>" +
                "</div>");

            me.element.append($dialog);

            me._createOptions();

            me.$form = me.element.find(".fr-cdb-form");

            me.element.find(".fr-cdb-cancel").on("click", function(e) {
                me.closeDialog();
            });

            me.element.find(".fr-cdb-submit-id").on("click", function (e) {
                me._submit();
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

            // Call navigateTo to bring up the create dashboard view
            var navigateTo = me.options.$reportExplorer.reportExplorer("option", "navigateTo");
            var name = me.$select.val();
            navigateTo("createDashboard", name);

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