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
    var mi = forerunner.ssr.tools.mergedItems;
    var itemActiveClass = "fr-toolbase-persistent-active-light";
    var locData = forerunner.localize.getLocData(forerunner.config.forerunnerFolder() + "ReportViewer/loc/ReportViewer");

    /**
     * Toolbar widget used by the Report Explorer
     *
     * @namespace $.forerunner.reportExplorerToolpane
     * @prop {Object} options - The options for toolpane
     * @prop {Object} options.navigateTo - Callback function used to navigate to a specific page
     * @prop {String} options.toolClass - The top level class for this tool (E.g., fr-toolpane)
     * @prop {Object} options.$reportExplorer - The report explorer widget
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
         * Sets the keyword on the search textbox in the toolpane
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
        _createCallbacks: function () {
            var me = this;

            // Hook up any / all custom events that the report explorer may trigger
            me.options.$reportExplorer.off(events.reportExplorerBeforeFetch());
            me.options.$reportExplorer.on(events.reportExplorerBeforeFetch(), function (e, data) {
                me._updateBtnStates.call(me);
            });

            var $userSettings = me.options.$appContainer.find(".fr-us-section");
            $userSettings.off(events.userSettingsClose());
            $userSettings.on(events.userSettingsClose(), function (e, data) {
                if (data.isSubmit) {
                    me._updateBtnStates.call(me);
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

            var toolpaneItems = [tp.itemBack, tp.itemFolders, tg.explorerItemFolderGroup, tp.itemSetup];
            var lastFetched = me.options.$reportExplorer.reportExplorer("getLastFetched");
            if (me._isAdmin()) {
                toolpaneItems.push(tp.itemSearchFolder, tp.itemCreateDashboard);
                if (lastFetched.path !== "/") {
                    toolpaneItems.push(mi.itemProperty);
                }
            }

            toolpaneItems.push(tg.explorerItemFindGroup);

            // Only show the log off is we are configured for forms authentication
            if (forerunner.ajax.isFormsAuth()) {
                toolpaneItems.push(tp.itemLogOff);
            }

            me.addTools(1, true, toolpaneItems);

            // Hold onto the folder buttons for later
            var $itemHome = me.element.find("." + tp.itemHome.selectorClass);
            var $itemRecent = me.element.find("." + tp.itemRecent.selectorClass);
            var $itemFav = me.element.find("." + tp.itemFav.selectorClass);
            me.folderItems = [$itemHome, $itemRecent, $itemFav];

            me.element.find(".fr-rm-item-keyword").watermark(locData.toolbar.search, { useNative: false, className: "fr-watermark" });

            me._updateBtnStates();
        },
        _create: function () {
            var me = this;
            //this toolpane exist in all explorer page, so we should put some initialization here
            //to make it only run one time
            me._createCallbacks();
        },
        _updateBtnStates: function () {
            var me = this;

            // Then we start out disabled and enable if needed
            me.disableTools([tp.itemSearchFolder, tp.itemCreateDashboard, mi.itemProperty]);

            if (me._isAdmin()) {
                var lastFetched = me.options.$reportExplorer.reportExplorer("getLastFetched");
                var permissions = me.options.$reportExplorer.reportExplorer("getPermission");

                if (lastFetched.view === "catalog" && permissions["Create Resource"]) {
                    me.enableTools([tp.itemSearchFolder, tp.itemCreateDashboard]);
                }

                if ((lastFetched.view === "searchfolder" || lastFetched.view === "catalog") && lastFetched.path !== "/" && permissions["Update Properties"]) {
                    me.enableTools([mi.itemProperty]);
                }
            }
        },
    });  // $.widget
});  // function()
