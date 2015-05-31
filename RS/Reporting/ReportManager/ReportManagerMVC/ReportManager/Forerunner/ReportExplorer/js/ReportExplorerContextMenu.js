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

    var itemType = forerunner.ssr.constants.itemType;

    // folder properties data
    var propertyEnums = forerunner.ssr.constants.properties;
    var genericPropertyTabs = [propertyEnums.description, propertyEnums.tags, propertyEnums.rdlExtension];

    var propertyListMap = {
        // Folder
        1: genericPropertyTabs,
        // Report
        2: genericPropertyTabs,
        // Resource
        3: genericPropertyTabs,
        // LinkedReport
        4: genericPropertyTabs,
        // Search Folder
        searchFolder: [propertyEnums.description, propertyEnums.searchFolder, propertyEnums.rdlExtension],
    };
    
    $.widget(widgets.getFullname(widgets.reportExplorerContextMenu), $.forerunner.contextMenuBase, /** @lends $.forerunner.reportExplorerContextMenu */ {
        options: {
            $appContainer: null,
            $reportExplorer: null,
            reportManagerAPI: null,
            rsInstance: null,
            catalogItem: null,
            view: null
        },
        _init: function () {
            var me = this;
            var catalog = me.options.catalogItem;

            // Get the permissions for the path define in the catalogItem option
            me.fetchPermissions();

            // Dynamically set the title
            me.setTitle(helper.getCurrentItemName(me.options.catalogItem.Path));

            // Delete item
            me._$delete.off("click");
            if (!me.permissions.Delete) {
                me._$delete.addClass("fr-toolbase-disabled").removeClass("fr-core-cursorpointer");
            } else {
                me._$delete.on("click", function (event, data) {
                    me._onClickDelete.apply(me, arguments);
                });
                me._$delete.removeClass("fr-toolbase-disabled").addClass("fr-core-cursorpointer");
            }

            // Properties
            me._$properties.off("click");
            if (!me.permissions["Update Properties"] && propertyListMap[me.options.catalogItem.Type]) {
                me._$properties.addClass("fr-toolbase-disabled").removeClass("fr-core-cursorpointer");
            } else {
                me._$properties.on("click", function (event, data) {
                    me._onClickProperties.apply(me, arguments);
                });
                me._$properties.removeClass("fr-toolbase-disabled").addClass("fr-core-cursorpointer");
            }

            // DownloadFile
            me._$downloadFile.off("click");
            if (catalog.Type !== itemType.report && catalog.Type !== itemType.resource) {
                me._$downloadFile.hide();
            } else {
                me._$downloadFile.show();
                me._$downloadFile.on("click", function (event, data) {
                    me._onClickDownloadFile.apply(me, arguments);
                });
                me._$downloadFile.removeClass("fr-toolbase-disabled").addClass("fr-core-cursorpointer");
            }

            // Forerunner Security
            me._$security.off("click");
            if (!me.permissions["Update Security Policies"]) {
                me._$security.addClass("fr-toolbase-disabled").removeClass("fr-core-cursorpointer");
            } else {
                me._$security.on("click", function (event, data) {
                    me._onClickSecurity.apply(me, arguments);
                });
                me._$security.removeClass("fr-toolbase-disabled").addClass("fr-core-cursorpointer");
            }

            // Linked Report
            me._$linkedReport.off("click").hide();
            // Only show the linked report entry on the normal report context menu
            if (catalog.Type === itemType.report || catalog.Type === itemType.linkedReport) {
                if (!me.permissions["Create Link"]) {
                    me._$linkedReport.addClass("fr-toolbase-disabled").removeClass("fr-core-cursorpointer");
                } else {
                    me._$linkedReport.on("click", function (event, data) {
                        me._onClickLinkedReport.apply(me, arguments);
                    });
                    me._$linkedReport.removeClass("fr-toolbase-disabled").addClass("fr-core-cursorpointer");
                }
                me._$linkedReport.show();
            } else {
                me._$linkedReport.hide();
            }

            me._$moveItem.off("click");
            if (!me.permissions["Update Properties"]) {
                me._$moveItem.addClass("fr-toolbase-disabled").removeClass("fr-core-cursorpointer");
            } else {
                me._$moveItem.on("click", function (event, data) {
                    me._onClickMoveItem.apply(me, arguments);
                });

                me._$moveItem.removeClass("fr-toolbase-disabled").addClass("fr-core-cursorpointer");
            }

            me._$unFavorite.off("click").hide();
            if (me.options.view === "favorites") {
                me._$unFavorite.on("click", function (event, data) {
                    me._onClickUnFavorite.apply(me, arguments);
                });

                me._$unFavorite.show();
            }

            // Call contextMenuBase._init()
            me._super();
        },
        _create: function () {
            var me = this;
           
            // Call contextMenuBase._create()
            me._super();

            me.addHeader();

            me._$moveItem = me.addMenuItem("fr-ctx-move-id", contextMenu.move);
            me._$delete = me.addMenuItem("fr-ctx-delete-id", contextMenu.delLabel);
            me._$security = me.addMenuItem("fr-ctx-security-id", contextMenu.security);
            me._$properties = me.addMenuItem("fr-ctx-properties-id", contextMenu.properties);
            me._$linkedReport = me.addMenuItem("fr-ctx-linked-id", contextMenu.linkedReport);
            me._$downloadFile = me.addMenuItem("fr-ctx-download-id", contextMenu.downloadFile);
            me._$unFavorite = me.addMenuItem("fr-crx-unFav-id", contextMenu.unFavorite);
        },
        _onClickDelete: function (event, data) {
            var me = this;
            var itemName = forerunner.helper.getCurrentItemName(me.options.catalogItem.Path);
            if (!window.confirm(contextMenu.deleteConfirm.format(itemName))) return;
            
            var url = me.options.reportManagerAPI + "/DeleteCatalogItem";

            forerunner.ajax.ajax({
                dataType: "json",
                url: url,
                data: {
                    path: me.options.catalogItem.Path,
                    safeFolderDelete: true,
                    instance: me.options.rsInstance,
                },
                async: false,
                success: function (data) {
                    if (data.Warning === "folderNotEmpty") {
                        forerunner.dialog.showMessageBox(me.options.$appContainer, contextMenu.folderNotEmpty);
                    } else if (data.Status && data.Status === "Success") {
                        me.options.$reportExplorer.reportExplorer("refresh");
                    }
                },
                fail: function (jqXHR) {
                    console.log("DeleteCatalogItem failed - " + jqXHR.statusText);
                    console.log(jqXHR);
                }
            });

            me.closeMenu();
        },
        _onClickDownloadFile: function (event, data) {
            var me = this;

            var url = me.options.reportManagerAPI + "/DownloadFile?path=" + encodeURIComponent(me.options.catalogItem.Path) +
                "&itemtype=" + encodeURIComponent(me.options.catalogItem.Type);

            if (me.options.rsInstance) {
                url += "&instance=" + me.options.rsInstance;
            }

            window.location.assign(url);

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
                propertyList = me.options.catalogItem.MimeType === "json/forerunner-searchfolder" ? propertyListMap.searchFolder : propertyList;
            }

            $propertyDlg.forerunnerProperties("setProperties", "contextmenu", me.options.catalogItem.Path, propertyList);
            $propertyDlg.forerunnerProperties("openDialog");

            $propertyDlg.one(events.forerunnerPropertiesClose(), function (event, data) {
                // Restore the previous settings
                if (previous && previous.path && previous.propertyList) {
                    $propertyDlg.forerunnerProperties("setProperties", previous.view, previous.path, previous.propertyList);

                    previous = null;
                }

                data.isUpdate && me.options.$reportExplorer.reportExplorer("refresh");
            });
            me.closeMenu();
        },
        _onClickSecurity: function (event, data) {
            var me = this;

            var $securityDlg = me.options.$appContainer.find(".fr-security-section");
            if (!$securityDlg || $securityDlg.length === 0) {
                console.log("Error - fr-security-section not found");
                return;
            }

            var previous = $securityDlg.forerunnerSecurity("getCurPolicy");

            $securityDlg.forerunnerSecurity("setData", me.options.catalogItem.Path, "Catalog");
            $securityDlg.forerunnerSecurity("openDialog");

            $securityDlg.one(events.forerunnerSecurityClose(), function (event, data) {
                if (previous) {
                    $securityDlg.forerunnerSecurity("setCurPolicy", previous);

                    previous = null;
                }
            });
            me.closeMenu();
        },
        _onClickLinkedReport: function (event, data) {
            var me = this;

            var $linkedReportDlg = me.options.$appContainer.find(".fr-linked-section");
            if (!$linkedReportDlg || $linkedReportDlg.length === 0) {
                console.log("Error - fr-security-section not found");
                return;
            }

            $linkedReportDlg.forerunnerLinkedReport("setData", me.options.catalogItem);
            $linkedReportDlg.forerunnerLinkedReport("openDialog");

            me.closeMenu();
        },
        _onClickMoveItem: function (event, data) {
            var me = this;

            var $moveItemDlg = me.options.$appContainer.find(".fr-move-section");
            if(!$moveItemDlg || $moveItemDlg.length === 0) {
                console.log("Error - fr-move-section not found");
                return;
            }

            $moveItemDlg.forerunnerMoveItem("setData", me.options.catalogItem);
            $moveItemDlg.forerunnerMoveItem("openDialog");

            $moveItemDlg.one(events.forerunnerMoveItemClose(), function (event, data) {
                me.options.$reportExplorer.reportExplorer("refresh");
            });

            me.closeMenu();
        },
        _onClickUnFavorite: function (event, data) {
            var me = this;

            var itemName = forerunner.helper.getCurrentItemName(me.options.catalogItem.Path);

            if (!window.confirm(contextMenu.unFavConfirm.format(itemName))) return;

            var url = me.options.reportManagerAPI + "/UpdateView?view=favorites&action=delete&path=" + me.options.catalogItem.Path;

            if (me.options.rsInstance) {
                url += "&instance=" + me.options.rsInstance;
            }

            forerunner.ajax.ajax({
                dataType: "json",
                url: url,
                async: false,
                success: function (data) {
                    if (data.Status === "Success") {
                        me.options.$reportExplorer.reportExplorer("refresh");
                    }
                },
                fail: function (jqXHR) {
                    console.log("UpdateView failed - " + jqXHR.statusText);
                    console.log(jqXHR);
                }
            });

            me.closeMenu();
        }
    }); //$.widget
});