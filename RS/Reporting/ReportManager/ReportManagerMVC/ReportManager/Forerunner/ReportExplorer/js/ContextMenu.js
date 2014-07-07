/**
 * @file Contains the context menu widget.
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
    var contextMenu = locData.contextMenu;

    /**
     * Widget used to create the context menu
     *
     * @namespace $.forerunner.createDashboard
     * @prop {Object} options - The options for the create dashboard dialog
     * @prop {String} options.$reportExplorer - Report viewer widget
     * @prop {Object} options.$appContainer - Report page container
     * @prop {String} options.reportManagerAPI - Optional, Path to the REST calls for the reportManager
     * @prop {String} options.rsInstance - Optional, Report service instance name
     * @prop {Object} options.catalogItem - Optional, report explorer catalog item
     *
     * @example
     * $("#contextMenuId").contextMenu({
     *     $appContainer: me.options.$appContainer,
     *     $reportExplorer: me.element,
     *     catalogItem: me.catalogItem
     * });
     */
    $.widget(widgets.getFullname(widgets.contextMenu), {
        options: {
            $reportExplorer: null,
            $appContainer: null,
            reportManagerAPI: forerunner.config.forerunnerAPIBase() + "ReportManager/",
            rsInstance: null,
            catalogItem: null
        },
        _getPermissions: function () {
            var me = this;
            var permissionList = ["Delete"];
            me.permissions = forerunner.ajax.hasPermission(me.options.catalogItem.Path, permissionList.join(","));
        },
        _init: function () {
            var me = this;
            me._getPermissions();

            // Delete item
            if (!me.permissions.Delete) {
                me._$delete.off("click");
                me._$delete.addClass("fr-toolbase-disabled");
                me._$delete.removeClass("fr-core-cursorpointer");
            } else {
                me._$delete.on("click", function (event, data) {
                    me._onClickDelete.apply(me, arguments);
                });
                me._$delete.removeClass("fr-toolbase-disabled");
                me._$delete.addClass("fr-core-cursorpointer");
            }

            // Close dialog event
            setTimeout(function () {
                $("body").one("click", function () {
                    me.closeDialog();
                });
            }, 10);
        },
        _create: function () {
            var me = this;

            me.element.html("");

            var headerHtml = forerunner.dialog.getModalDialogHeaderHtml("", contextMenu.title, "", "");
            var $dialog = $(
                "<div class='fr-core-dialog-innerPage fr-core-center'>" +
                    headerHtml +
                    // Delete
                    "<div class='fr-ctx-container'>" +
                        "<div class='fr-ctx-delete-id fr-ctx-itemcontainer fr-ctx-state fr-core-cursorpointer'>" +
                            "<div class='fr-ctx-item-text-container'>" +
                                "<div class='fr-ctx-item-text'>" + contextMenu.delete + "</div>" +
                            "</div>" +
                        "</div>" +
                    "</div>" +
                    // Properties
                    "<div class='fr-ctx-container'>" +
                        "<div class='fr-ctx-properties-id fr-ctx-itemcontainer fr-ctx-state fr-core-cursorpointer'>" +
                            "<div class='fr-ctx-item-text-container'>" +
                                "<div class='fr-ctx-item-text'>" + contextMenu.properties + "</div>" +
                            "</div>" +
                        "</div>" +
                    "</div>" +
                "</div>");

            me.element.append($dialog);

            // Delete
            me._$delete = me.element.find(".fr-ctx-delete-id");

            // Properties
            me.element.find(".fr-ctx-properties-id").on("click", function (event, data) {
                me._onClickProperties.apply(me, arguments);
            });
        },
        _onClickDelete: function (event, data) {
            var me = this;

            var url = me.options.reportManagerAPI + "/DeleteCatalogItem";
            url += "?path=" + encodeURIComponent(me.options.catalogItem.Path);
            if (me.options.rsInstance) {
                url += "&instance=" + me.options.rsInstance;
            }

            forerunner.ajax.ajax({
                dataType: "json",
                url: url,
                async: false,
                success: function (data) {
                },
                fail: function (jqXHR) {
                    console.log("DeleteCatalogItem failed - " + jqXHR.statusText);
                    console.log(jqXHR);
                }
            });
        },
        _onClickProperties: function (event, data) {
            alert("_onClickProperties");
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