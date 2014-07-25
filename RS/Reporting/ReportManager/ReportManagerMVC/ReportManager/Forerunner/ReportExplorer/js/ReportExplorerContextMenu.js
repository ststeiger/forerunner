/**
 * @file Contains the Report Explorer Context Menu widget.
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
     * Widget used to create the report explorer context menu
     *
     * @namespace $.forerunner.reportExplorerContextMenu
     *
     * @example
     * $("#contextMenuId").reportExplorerContextMenu({
     *     $appContainer: me.options.$appContainer,
     *     $reportExplorer: me.element,
     *     catalogItem: me.catalogItem
     * });
     */
    $.widget(widgets.getFullname(widgets.reportExplorerContextMenu), $.forerunner.contextMenuBase, /** @lends $.forerunner.reportExplorerContextMenu */ {
        options: {
        },
        _init: function () {
            var me = this;

            // Get the permissions for the path define in the catalogItem option
            me.fetchPermissions();

            // Dynamically set the title
            me.setTitle(helper.getCurrentItemName(me.options.catalogItem.Path));

            // Delete item
            me._$delete.off("click");
            if (!me.permissions["Delete"]) {
                me._$delete.addClass("fr-toolbase-disabled");
                me._$delete.removeClass("fr-core-cursorpointer");
            } else {
                me._$delete.on("click", function (event, data) {
                    me._onClickDelete.apply(me, arguments);
                });
                me._$delete.removeClass("fr-toolbase-disabled");
                me._$delete.addClass("fr-core-cursorpointer");
            }

            // Properties
            me._$properties.off("click");
            if (!me.permissions["Update Properties"] &&
                propertyListMap[me.options.catalogItem.Type]) {
                me._$properties.addClass("fr-toolbase-disabled");
                me._$properties.removeClass("fr-core-cursorpointer");
            } else {
                me._$properties.on("click", function (event, data) {
                    me._onClickProperties.apply(me, arguments);
                });
                me._$properties.removeClass("fr-toolbase-disabled");
                me._$properties.addClass("fr-core-cursorpointer");
            }

            // Call contextMenuBase._init()
            me._super();
        },
        _create: function () {
            var me = this;

            // Call contextMenuBase._create()
            me._super();

            me.addHeader();
            me._$delete = me.addMenuItem("fr-ctx-delete-id", contextMenu.delLabel);
            me._$properties = me.addMenuItem("fr-ctx-properties-id", contextMenu.properties);
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
                    me.options.$reportExplorer.reportExplorer("refresh");
                },
                fail: function (jqXHR) {
                    console.log("DeleteCatalogItem failed - " + jqXHR.statusText);
                    console.log(jqXHR);
                }
            });
            me.closeMenu();
        },
        _onClickProperties: function (event, data) {
            var me = this;
            var $propertyDlg = me.options.$appContainer.find(".fr-properties-section");
            if (!$propertyDlg || $propertyDlg.length === 0) {
                console.log("Error - fr-properties-section not found");
                return;
            }

            // Save the current settings
            var previous = $propertyDlg.forerunnerProperties("getProperties");

            // Set the new settings based upon the catalogItem and show the dialog
            var propertyList = propertyListMap[me.options.catalogItem.Type];
            // For search folder it's different with other resource file, it don't have tags, instead it's search folder property
            if (me.options.catalogItem.Type === 3) {
                propertyList = me.options.catalogItem.MimeType === "json/forerunner-searchfolder" ? propertyListMap["searchFolder"] : propertyList;
            }

            $propertyDlg.forerunnerProperties("setProperties", me.options.catalogItem.Path, propertyList);
            $propertyDlg.forerunnerProperties("openDialog");

            $propertyDlg.on(events.forerunnerPropertiesClose(), function (event, data) {
                // Retore the previous settings
                if (previous && previous.path && previous.propertyList) {
                    $propertyDlg.forerunnerProperties("setProperties", previous.path, previous.propertyList);
                }
                me.options.$reportExplorer.reportExplorer("refresh");
            });
            me.closeMenu();
        }
    }); //$.widget
});