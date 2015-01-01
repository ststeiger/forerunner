/**
 * @file Contains the context menu base widget.
 *
 */

// Assign or create the single globally scoped variable
var forerunner = forerunner || {};

// Forerunner SQL Server Reports
forerunner.ssr = forerunner.ssr || {};

$(function () {
    var widgets = forerunner.ssr.constants.widgets;
    var events = forerunner.ssr.constants.events;
    var helper = forerunner.helper;
    var locData = forerunner.localize.getLocData(forerunner.config.forerunnerFolder() + "ReportViewer/loc/ReportViewer");
    var contextMenu = locData.contextMenu;

    // folder properties data
    var propertyEnums = forerunner.ssr.constants.properties;
    var propertyListMap = {
        // Folder
        1: [propertyEnums.description, propertyEnums.tags],
        // Report
        2: [propertyEnums.description, propertyEnums.tags, propertyEnums.rdlExtension],
        // Resource
        3: [propertyEnums.description, propertyEnums.tags],
        // LinkedReport
        4: [propertyEnums.description, propertyEnums.tags, propertyEnums.rdlExtension],
        // Search Folder
        searchFolder: [propertyEnums.searchFolder, propertyEnums.description],
    };

    /**
     * Widget used to create the context menu
     *
     * @namespace $.forerunner.contextMenuBase
     * @prop {Object} options - The options for the context menu base widget
     * @prop {String} options.$reportExplorer - Report viewer widget
     * @prop {Object} options.$appContainer - Report page container
     * @prop {String} options.reportManagerAPI - Optional, Path to the REST calls for the reportManager
     * @prop {String} options.rsInstance - Optional, Report service instance name
     * @prop {Object} options.catalogItem - Optional, report explorer catalog item
     *
     * @example
     * $("#contextMenuId").contextMenuBase({
     *     $appContainer: me.options.$appContainer,
     *     $reportExplorer: me.element,
     *     catalogItem: me.catalogItem
     * });
     */
    $.widget(widgets.getFullname(widgets.contextMenuBase), {
        options: {
            $reportExplorer: null,
            $appContainer: null,
            reportManagerAPI: forerunner.config.forerunnerAPIBase() + "ReportManager/",
            rsInstance: null,
            catalogItem: null
        },
        /*
         * Sets the permissions list
         *
         * @function $.forerunner.contextMenuBase#setPermissionsList
         *
         * @param {array} list - Array of permission strings to query the server for
         */
        setPermissionsList: function (list) {
            var me = this;
            me.permissionList = list;
        },
        _getPermissionsList: function () {
            var me = this;
            if (me.permissionList) {
                return me.permissionList;
            }

            return ["Delete", "Update Properties"];
        },
        /*
         * Gets the permissions defined by the call to setPermissionsList
         *
         * @function $.forerunner.contextMenuBase#fetchPermissions
         */
        fetchPermissions: function () {
            var me = this;
            var permissionList = me._getPermissionsList();
            me.permissions = forerunner.ajax.hasPermission(me.options.catalogItem.Path, permissionList.join(","));
        },
        /*
         * Sets the title. Used in the _init call to dymanicaaly set the title
         *
         * @param {String} title - title to set dynamically
         */
        setTitle: function (title) {
            var me = this;
            me._title = title;
        },
        _init: function () {
            var me = this;

            // Title
            if (me._title) {
                me._$title.text(me._title);
            }

            // Note that 500 is needed to make the iPhone work properly
            var milliseconds = 500;

            // Close dialog event
            setTimeout(function () {
                if (forerunner.device.isTouch()) {
                    // Touch
                    var touchFunc = function (event) {
                        setTimeout(function () {
                            me.closeMenu();
                        }, milliseconds);
                    };
                    $(document).off("touchend", touchFunc);
                    $(document).one("touchend", touchFunc);
                } else {
                    // Non-touch (PCs)
                    var func = function (event) {
                        me.closeMenu();
                    };
                    $(document).off("mouseup", func);
                    $(document).one("mouseup", func);
                }
            }, milliseconds);
        },
        /*
         * Generate context menu dialog header structure
         *
         * @function $.forerunner.contextMenuBase#addHeader
         *
         * @param {String} title - Context menu title
         *
         * @return {Object} Context menu header object
         */
        addHeader: function (title) {
            var me = this;
            if (title) {
                me._title = title;
            }
            var $header = $(
                // Header
                "<tr>" +
                    "<td class='fr-ctx-header'>" +
                        "<div class='fr-ctx-title'>" +
                        "</div>" +
                    "</td>" +
                "</tr>"
            );
            me._$table.append($header);
            me._$title = me.element.find(".fr-ctx-title");
            return $header;
        },
        /*
         * Generate context menu item structure
         *
         * @function $.forerunner.contextMenuBase#addMenuItem
         *
         * @param {String} selectorClass - Class name
         * @param {String} label - Display value
         *
         * @return {Object} Context menu item object
         */
        addMenuItem: function (selectorClass, label) {
            var me = this;
            var $menuItem = $(
                // Menu item
                "<tr>" +
                    "<td class='" + selectorClass + " fr-ctx-delete-id fr-ctx-container'>" +
                        "<div class='fr-ctx-state fr-core-cursorpointer'>" +
                            "<div class='fr-ctx-delete-id fr-ctx-item-text'>" + label + "</div>" +
                        "</div>" +
                    "</td>" +
                "</tr>"
            );
            me._$table.append($menuItem);
            return $menuItem;
        },
        _create: function () {
            var me = this;

            me.element.html("");

            me._$table = $(
                "<table class='fr-ctx-table'>" +
                "</table>"
            );

            me.element.append(me._$table);
        },
        /**
         * Open menu
         *
         * @function $.forerunner.contextMenuBase#openMenu
         *
         * @param {number} page x position from the event
         * @param {number} page /y position from the event
         */
        openMenu: function (pageX, pageY) {
            var me = this;

            /*
            The problem here was that in IE I was not getting a scroll top during the "contextmenu" event. So I had to
            pass in pageY instead of clientY which generally made the positioning work. But the code here that shifted if
            the context menu was off screen did not work in IE any longer. So simply removing it was a good choice because
            it is an edge case to click so far to the right or bottom.

            var margin = 10;
            var offScreenRight = Math.max(0, pageX + me.element.width() + margin - me.options.$appContainer.width());
            var offScreenBottom = Math.max(0, pageY + me.element.height() + margin - me.options.$appContainer.height());
            */

            var offScreenRight = 0;
            var offScreenBottom = 0;

            var left = pageX - offScreenRight;
            var top = pageY - offScreenBottom;
            me.element.css({
                left: left + "px",
                top: top + "px",
                position: "absolute"
            });
            me.element.show();
        },
        /**
         * Close menu
         *
         * @function $.forerunner.contextMenuBase#closeMenu
         */
        closeMenu: function () {
            var me = this;
            me.element.hide();
        },
    }); //$.widget
});