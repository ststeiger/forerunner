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
        //2: [propertyEnums.description, propertyEnums.tags, propertyEnums.rdlExtension],
        2: [propertyEnums.description, propertyEnums.tags],
        // Resource
        3: [propertyEnums.description, propertyEnums.tags],
        // LinkedReport
        //4: [propertyEnums.description, propertyEnums.tags, propertyEnums.rdlExtension],
        4: [propertyEnums.description, propertyEnums.tags],
        // Search Folder
        searchFolder: [propertyEnums.searchFolder, propertyEnums.description],
    };
    
    $.widget(widgets.getFullname(widgets.reportExplorerContextMenu), $.forerunner.contextMenuBase, /** @lends $.forerunner.reportExplorerContextMenu */ {
        options: {
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
            if (!me.permissions["Delete"]) {
                me._$delete.addClass("fr-toolbase-disabled").removeClass("fr-core-cursorpointer");
            } else {
                me._$delete.on("click", function (event, data) {
                    me._onClickDelete.apply(me, arguments);
                });
                me._$delete.removeClass("fr-toolbase-disabled").addClass("fr-core-cursorpointer");
            }

            // Properties
            me._$properties.off("click");
            if (!me.permissions["Update Properties"] &&
                propertyListMap[me.options.catalogItem.Type]) {
                me._$properties.addClass("fr-toolbase-disabled").removeClass("fr-core-cursorpointer");
            } else {
                me._$properties.on("click", function (event, data) {
                    me._onClickProperties.apply(me, arguments);
                });
                me._$properties.removeClass("fr-toolbase-disabled").addClass("fr-core-cursorpointer");
            }

            me._$security.off("click");
            if (!me.permissions["Update Security Policies"]) {
                me._$security.addClass("fr-toolbase-disabled").removeClass("fr-core-cursorpointer");
            } else {
                me._$security.on("click", function (event, data) {
                    me._onClickSecurity.apply(me, arguments);
                });
                me._$security.removeClass("fr-toolbase-disabled").addClass("fr-core-cursorpointer");
            }

            me._$linkedReport.off("click").hide();
            //type=2: report, type=4: linked report
            //now only show the linked report entry on the normal report context menu
            if (catalog.Type === 2) {
                if (!me.permissions["Create Link"]) {
                    me._$linkedReport.addClass("fr-toolbase-disabled").removeClass("fr-core-cursorpointer");
                } else {
                    me._$linkedReport.on("click", function (event, data) {
                        me._onClickLinkedReport.apply(me, arguments);
                    });
                    me._$linkedReport.removeClass("fr-toolbase-disabled").addClass("fr-core-cursorpointer");
                }
                me._$linkedReport.show();
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
            me._$security = me.addMenuItem("fr-ctx-security-id", contextMenu.security);
            me._$linkedReport = me.addMenuItem("fr-ctx-linked-id", contextMenu.linkedReport);
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

            $propertyDlg.one(events.forerunnerPropertiesClose(), function (event, data) {
                // Restore the previous settings
                if (previous && previous.path && previous.propertyList) {
                    $propertyDlg.forerunnerProperties("setProperties", previous.path, previous.propertyList);

                    previous = null;
                }
                me.options.$reportExplorer.reportExplorer("refresh");
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

            //var previous = $securityDlg.forerunnerSecurity("getCurPolicy");
            console.log(me.options.catalogItem);
            $linkedReportDlg.forerunnerLinkedReport("setData", me.options.catalogItem.Type, me.options.catalogItem.Path);
            $linkedReportDlg.forerunnerLinkedReport("openDialog", me.options.catalogItem.Path);

            $linkedReportDlg.one(events.forerunnerLinkedReportClose(), function (event, data) {
                //if (previous) {
                //    $linkedReportDlg.forerunnerLinkedReport("setCurPolicy", previous);

                //    previous = null;
                //}
            });
            me.closeMenu();
        }
    }); //$.widget
});