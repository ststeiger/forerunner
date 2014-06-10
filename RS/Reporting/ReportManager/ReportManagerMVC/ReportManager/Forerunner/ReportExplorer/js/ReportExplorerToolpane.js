/**
 * @file Contains the reportExplorerToolpane widget.
 *
 */

var forerunner = forerunner || {};

// Forerunner SQL Server Reports
forerunner.ssr = forerunner.ssr || {};
forerunner.ssr.tools = forerunner.ssr.tools || {};
forerunner.ssr.tools.reportExplorerToolpane = forerunner.ssr.tools.reportExplorerToolpane || {};

$(function () {
    var widgets = forerunner.ssr.constants.widgets;
    var events = forerunner.ssr.constants.events;
    var tp = forerunner.ssr.tools.reportExplorerToolpane;
    var tg = forerunner.ssr.tools.groups;
    var itemActiveClass = "fr-toolbase-persistent-active-state";
    var locData = forerunner.localize.getLocData(forerunner.config.forerunnerFolder() + "ReportViewer/loc/ReportViewer");

    /**
     * Toolbar widget used by the Report Explorer
     *
     * @namespace $.forerunner.reportExplorerToolpane
     * @prop {Object} options - The options for toolpane
     * @prop {Object} options.navigateTo - Callback function used to navigate to a specific page
     * @prop {String} options.toolClass - The top level class for this tool (E.g., fr-toolbar)
     * @prop {Object} options.$reportExplorer - The report explorer wiget
     * @prop {Object} options.$appContainer - The container jQuery object that holds the application
     * @example
     * $("#reportExplorerToolpaneId").reportExplorerToolpane({
     *  navigateTo: navigateTo
     * });
     */
    $.widget(widgets.getFullname(widgets.reportExplorerToolpane), $.forerunner.toolBase, /** @lends $.forerunner.reportExplorerToolpane */ {
        options: {
            navigateTo: null,
            toolClass: "fr-toolpane",
            $appContainer: null,
            $reportExplorer: null
        },
        /**
         * Set specify tool to active state
         *
         * @function $.forerunner.reportExplorerToolpane#setFolderItemActive
         * @param {String} selectorClass - selector class name
         */
        setFolderItemActive: function (selectorClass) {
        
            var me = this;
            me._clearFolderItemState();
            if (selectorClass) {
                var $item = me.element.find("." + selectorClass);
                $item.addClass(itemActiveClass);
            }
        },
        /**
         * Sets the search item keyword into the UI
         *
         * @function $.forerunner.reportExplorerToolpane#setSearchKeyword
         */
        setSearchKeyword: function (keyword) {
            var me = this;

            me.element.find(".fr-rm-item-keyword").val(keyword);
        },
        _clearFolderItemState: function () {
            var me = this;
            $.each(me.folderItems, function (index, $item) {
                $item.removeClass(itemActiveClass);
            });
        },
        _initCallbacks: function () {
            var me = this;
            // Hook up any / all custom events that the report viewer may trigger
            me.element.find(".fr-rm-item-keyword").watermark(locData.toolbar.search, { useNative: false, className: "fr-param-watermark" });
            
            me.options.$reportExplorer.on(events.reportExplorerBeforeFetch(), function (e, data) {
                me.updateBtnStates.call(me);
            });

            var $userSettings = me.options.$appContainer.find(".fr-us-section");
            $userSettings.on(events.userSettingsClose(), function (e, data) {
                if (data.isSubmit) {
                    me.updateBtnStates.call(me);
                }
            });
        },
        _isAdmin: function () {
            var me = this;
            var userSettings = me.options.$reportExplorer.reportExplorer("getUserSettings");
            if (userSettings && userSettings.adminUI && userSettings.adminUI === true) {
                return true;
            }
            return false;
        },
        _init: function () {
            var me = this;
            me._super();

            me.element.empty();
            me.element.append($("<div class='" + me.options.toolClass + " fr-core-widget'/>"));

            var toolpaneItems = [tp.itemBack, tp.itemFolders, tg.explorerItemFolderGroup, tp.itemTags, tp.itemSearchFolder, tp.itemCreateDashboard, tg.explorerItemFindGroup, tp.itemSetup, tp.itemLogOff];

            me.addTools(1, true, toolpaneItems);
            me._initCallbacks();

            if (forerunner.ajax.isFormsAuth()) {
                me.enableTools([tp.itemLogOff]);
            } else {
                me.disableTools([tp.itemLogOff]);
            }

            // Hold onto the folder buttons for later
            var $itemHome = me.element.find("." + tp.itemHome.selectorClass);
            var $itemRecent = me.element.find("." + tp.itemRecent.selectorClass);
            var $itemFav = me.element.find("." + tp.itemFav.selectorClass);
            me.folderItems = [$itemHome, $itemRecent, $itemFav];

            me.updateBtnStates();
        },

        _destroy: function () {
        },

        _create: function () {
            var me = this;
            me.options.$reportExplorer.on(events.reportExplorerBeforeFetch(), function (e, data) {
                me.updateBtnStates();
            });
        },
        updateBtnStates: function () {
            var me = this;
            var lastFetched = me.options.$reportExplorer.reportExplorer("getLastFetched");

            // Only show the log off is we are configured for forms authentication
            if (forerunner.ajax.isFormsAuth()) {
                me.showTool(tp.itemLogOff.selectorClass);
            } else {
                me.hideTool(tp.itemLogOff.selectorClass);
            }

            if (!me._isAdmin()) {
                me.hideTool(tp.itemSearchFolder.selectorClass);
                me.hideTool(tp.itemCreateDashboard.selectorClass);
                me.hideTool(tp.itemTags.selectorClass);
            } else {
                // If we are in admin mode we show the buttons
                me.showTool(tp.itemSearchFolder.selectorClass);
                me.showTool(tp.itemCreateDashboard.selectorClass);
                me.showTool(tp.itemTags.selectorClass);

                // Then we start out disabled and enable if needed
                me.disableTools([tp.itemSearchFolder, tp.itemCreateDashboard, tp.itemTags]);

                if (lastFetched.view === "catalog") {
                    var permission = forerunner.ajax.hasPermission(lastFetched.path, "Create Resource");
                    if (permission && permission.hasPermission === true) {
                        // If the last fetched folder is a catalog and the user has permission to create a
                        // resource in this folder, enable the create dashboard button and create search folder button
                        me.enableTools([tp.itemSearchFolder, tp.itemCreateDashboard]);
                    }

                    if (lastFetched.path !== "/") {
                        var addTagPermission = forerunner.ajax.hasPermission(lastFetched.path, "Update Properties");
                        if (addTagPermission && addTagPermission.hasPermission === true) {
                            me.enableTools([tp.itemTags]);
                        }
                    }
                }
            }
        }
    });  // $.widget
});  // function()
