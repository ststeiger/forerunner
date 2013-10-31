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
    var tb = forerunner.ssr.tools.reportExplorerToolbar;
    var btnActiveClass = "fr-toolbase-persistent-active-state";

    /**
     * Toolbar widget used by the Report Explorer
     *
     * @namespace $.forerunner.reportExplorerToolbar
     * @prop {object} options - The options for toolbar
     * @prop {Object} options.navigateTo - Callback function used to navigate to a specific page
     * @prop {String} options.toolClass - The top level class for this tool (E.g., fr-toolbar)
     * @example
     * $("#reportExplorerToolbarId").reportExplorerToolbar({
     *  navigateTo: navigateTo
     * });
     */
    $.widget(widgets.getFullname(widgets.reportExplorerToolbar), $.forerunner.toolBase, /** @lends $.forerunner.reportExplorerToolbar */ {
        options: {
            navigateTo: null,
            toolClass: "fr-toolbar"
        },
        setFolderBtnActive: function (selectorClass) {
            var me = this;
            me._clearFolderBtnState();
            if (selectorClass) {
                var $btn = me.element.find("." + selectorClass);
                $btn.addClass(btnActiveClass);
            }
        },
        _clearFolderBtnState: function () {
            var me = this;
            $.each(me.folderBtns, function (index, $btn) {
                $btn.removeClass(btnActiveClass);
            });
        },
        _initCallbacks: function () {
            var me = this;
            // Hook up any / all custom events that the report viewer may trigger

            // Hook up the toolbar element events
            me.enableTools([tb.btnHome, tb.btnBack, tb.btnFav, tb.btnRecent]);
        },
        _init: function () {
            var me = this;

            // TODO [jont]
            //
            ///////////////////////////////////////////////////////////////////////////////////////////////
            //// if me.element contains or a a child contains the options.toolClass don't replace the html
            ///////////////////////////////////////////////////////////////////////////////////////////////
            
            me.element.empty();
            me.element.append($("<div class='" + me.options.toolClass + " fr-core-widget'/>"));
            me.addTools(1, true, [tb.btnBack, tb.btnSetup, tb.btnHome, tb.btnRecent, tb.btnFav]);
            me._initCallbacks();

            // Hold onto the folder buttons for later
            var $btnHome = me.element.find("." + tb.btnHome.selectorClass);
            var $btnRecent = me.element.find("." + tb.btnRecent.selectorClass);
            var $btnFav = me.element.find("." + tb.btnFav.selectorClass);
            me.folderBtns = [$btnHome, $btnRecent, $btnFav];
        },

        _destroy: function () {
        },

        _create: function () {
            var me = this;
        },
    });  // $.widget
});  // function()
