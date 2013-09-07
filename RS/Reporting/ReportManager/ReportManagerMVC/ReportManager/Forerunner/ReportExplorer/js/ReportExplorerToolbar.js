/**
 * @file Contains the reportExplorerToolbar widget.
 *
 */

var forerunner = forerunner || {};

// Forerunner SQL Server Reports
forerunner.ssr = forerunner.ssr || {};

$(function () {
    var toolTypes = forerunner.ssr.constants.toolTypes;
    var locData = forerunner.localize.getLocData(forerunner.config.forerunnerFolder() + "/ReportViewer/loc/ReportViewer");
    var widgets = forerunner.ssr.constants.widgets;

    // Button Info
    var btnHome = {
        toolType: toolTypes.button,
        selectorClass: "fr-rm-button-home",
        imageClass: "fr-icons24x24-home",
        tooltip: locData.toolbar.home,
        events: {
            click: function (e) {
                e.data.me.options.navigateTo("home", null);
            }
        }
    };
    var btnBack = {
        toolType: toolTypes.button,
        selectorClass: "fr-button-back",
        imageClass: "fr-icons24x24-back",
        tooltip: locData.toolbar.back,
        events: {
            click: function (e) {
                e.data.me.options.navigateTo("back", null);
            }
        }
    };
    var btnFav = {
        toolType: toolTypes.button,
        selectorClass: "fr-rm-button-fav",
        imageClass: "fr-icons24x24-favorite",
        tooltip: locData.toolbar.favorites,
        events: {
            click: function (e) {
                e.data.me.options.navigateTo("favorites", null);
            }
        }
    };
    var btnRecent = {
        toolType: toolTypes.button,
        selectorClass: "fr-rm-button-recent",
        imageClass: "fr-icons24x24-recent",
        tooltip: locData.toolbar.recent,
        events: {
            click: function (e) {
                e.data.me.options.navigateTo("recent", null);
            }
        }
    };

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
        _initCallbacks: function () {
            var me = this;
            // Hook up any / all custom events that the report viewer may trigger

            // Hook up the toolbar element events
            me.enableTools([btnHome, btnBack, btnFav, btnRecent]);
        },
        _init: function () {
            var me = this;

            // TODO [jont]
            //
            ///////////////////////////////////////////////////////////////////////////////////////////////
            //// if me.element contains or a a child contains the options.toolClass don't replace the html
            ///////////////////////////////////////////////////////////////////////////////////////////////
            
            me.element.empty();
            me.element.append($("<div/>").addClass(me.options.toolClass));
            me.addTools(1, true, [btnBack, btnHome, btnFav, btnRecent]);
            me._initCallbacks();
        },

        _destroy: function () {
        },

        _create: function () {
            var me = this;
        },
    });  // $.widget
});  // function()
