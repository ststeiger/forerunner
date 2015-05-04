/**
 * @file Contains the reportExplorerToolbar widget.
 *
 */

var forerunner = forerunner || {};

// Forerunner SQL Server Reports
forerunner.ssr = forerunner.ssr || {};
forerunner.ssr.tools = forerunner.ssr.tools || {};
forerunner.ssr.tools.reportExplorerToolbar = forerunner.ssr.tools.reportExplorerToolbar || {};

$(function () {
    var widgets = forerunner.ssr.constants.widgets;
    var events = forerunner.ssr.constants.events;
    var tb = forerunner.ssr.tools.reportExplorerToolbar;
    var tg = forerunner.ssr.tools.groups;
    var btnActiveClass = "fr-toolbase-persistent-active-state";
    var locData = forerunner.localize.getLocData(forerunner.config.forerunnerFolder() + "ReportViewer/loc/ReportViewer");

    /**
     * Toolbar widget used by the Report Explorer
     *
     * @namespace $.forerunner.reportExplorerToolbar
     * @prop {Object} options - The options for toolbar
     * @prop {Object} options.navigateTo - Callback function used to navigate to a specific page
     * @prop {String} options.toolClass - The top level class for this tool (E.g., fr-toolbar)
     * @prop {Object} options.$reportExplorer - The report explorer widget
     * @prop {Object} options.$appContainer - The container jQuery object that holds the application
     * @example
     * $("#reportExplorerToolbarId").reportExplorerToolbar({
     *  navigateTo: navigateTo
     * });
     */
    $.widget(widgets.getFullname(widgets.reportExplorerToolbar), $.forerunner.toolBase, /** @lends $.forerunner.reportExplorerToolbar */ {
        options: {
            navigateTo: null,
            toolClass: "fr-toolbar",
            dbConfig: null,
            $appContainer: null,
            $reportExplorer: null
        },
        /**
         * Set specify tool to active state
         *
         * @function $.forerunner.reportExplorerToolbar#setFolderBtnActive
         * @param {String} selectorClass - selector class name
         */
        setFolderBtnActive: function (selectorClass) {
            var me = this;
            me._clearFolderBtnState();
            if (selectorClass) {
                var $btn = me.element.find("." + selectorClass);
                $btn.addClass(btnActiveClass);
            }
        },
        /**
         * Sets the keyword on the search textbox in the toolbar
         *
         * @function $.forerunner.reportExplorerToolbar#setSearchKeyword
         */
        setSearchKeyword: function (keyword) {
            var me = this;

            me.element.find(".fr-rm-keyword-textbox").val(keyword);
        },
        _clearFolderBtnState: function () {
            var me = this;
            $.each(me.folderBtns, function (index, $btn) {
                $btn.removeClass(btnActiveClass);
            });
        },
        _initCallbacks: function () {
            var me = this;
            me.enableTools([tb.btnMenu, tb.btnBack, tb.btnFav, tb.btnRecent, tg.explorerFindGroup]);

            me.element.find(".fr-rm-keyword-textbox").watermark(locData.toolbar.search, forerunner.config.getWatermarkConfig());
        },
        _init: function () {
            var me = this;
            me._super();

            me.element.empty();
            me.element.append($("<div class='" + me.options.toolClass + " fr-core-toolbar fr-core-widget'/>"));

            //check whether hide home button is enable
            var toolbarList = [tb.btnMenu, tb.btnBack];

            //add UseMoblizerDB check for setting, subscriptions, recent, favorite on the explorer toolbar
            if (me.options.dbConfig && me.options.dbConfig.UseMobilizerDB === true) {
                toolbarList.push(tb.btnSetup);
            }

            if (forerunner.config.getCustomSettingsValue("showHomeButton", "off") === "on") {
                //add home button based on the user setting
                toolbarList.push(tb.btnHome);
            }

            if (me.options.dbConfig && me.options.dbConfig.UseMobilizerDB === true) {
                if (forerunner.config.getCustomSettingsValue("showSubscriptionUI", "off") === "on") {
                    //add home button based on the user setting
                    toolbarList.push(tb.btnMySubscriptions);
                }

                //recent view feature need ReportServerDB support
                if (me.options.dbConfig.SeperateDB !== true) {
                    toolbarList.push(tb.btnRecent);
                }
                toolbarList.push(tb.btnFav);
            }

            if (forerunner.ajax.isFormsAuth()) {
                toolbarList.push(tb.btnLogOff);
            }

            toolbarList.push(tg.explorerFindGroup);

            me.addTools(1, true, toolbarList);
            me._initCallbacks();

            // Hold onto the folder buttons for later
            var $btnHome = me.element.find("." + tb.btnHome.selectorClass);
            var $btnRecent = me.element.find("." + tb.btnRecent.selectorClass);
            var $btnFav = me.element.find("." + tb.btnFav.selectorClass);
            me.folderBtns = [$btnHome, $btnRecent, $btnFav];

            // Make sure the tools are configured properly
            me.windowResize();
        },
        _create: function () {
        }
    });  // $.widget
});  // function()
