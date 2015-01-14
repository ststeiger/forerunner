/**
 * @file Contains the viewerBase widget.
 *
 */

var forerunner = forerunner || {};
forerunner.ssr = forerunner.ssr || {};

$(function () {
    var constants = forerunner.ssr.constants;
    var widgets = constants.widgets;

    /**
     * The viewerBase widget is used as a base namespace for the reportViewer and the reportExplorer
     * widgets
     *
     * @namespace $.forerunner.viewerBase
     * @prop {Object} options - The options for toolBase
     * @prop {Number} options.loadDelay - number of milliseconds to delay before showing the loading
     *                overlay
     */
    $.widget(widgets.getFullname(widgets.viewerBase), /** @lends $.forerunner.toolBase */ {
        options: {
            loadDelay: 500
        },
        // Constructor
        _create: function () {
            var me = this;
            me.locData = forerunner.localize.getLocData(forerunner.config.forerunnerFolder() + "ReportViewer/loc/ReportViewer");
            me.$loadingIndicator = new $("<div class='fr-report-loading-indicator' ></div>").text(me.locData.messages.loading);
            me.element.append(me.$loadingIndicator);
            me.loadLock = 0;
        },
        _addLoadingIndicator: function () {
            var me = this;
            if (me.loadLock === 0) {
                me.loadLock = 1;
                setTimeout(function () { me.showLoadingIndictator(); }, me.options.loadDelay);
            }
        },
        /**
         * Shows the loading Indicator
         *
         * @function $.forerunner.reportViewer#showLoadingIndictator
         *
         * @param {Boolean} force - Force show loading indicator if it's true
         */
        showLoadingIndictator: function (force) {
            var me = this;
            if (me.loadLock === 1 || force === true) {
                var $mainviewport = me.options.$appContainer.find(".fr-layout-mainviewport");
                $mainviewport.addClass("fr-layout-mainviewport-fullheight");
                //212 is static value for loading indicator width
                var scrollLeft = me.$reportContainer.width() - 212;

                if (force === true) {
                    me.$loadingIndicator.css("top", $(window).scrollTop() + 100 + "px")
                     .css("left", scrollLeft > 0 ? scrollLeft / 2 : 0 + "px");
                }
                else {
                    me.$loadingIndicator.css("top", me.$reportContainer.scrollTop() + 100 + "px")
                        .css("left", scrollLeft > 0 ? scrollLeft / 2 : 0 + "px");
                }

                me.$reportContainer.addClass("fr-report-container-translucent");
                me.$loadingIndicator.show();
            }
        },
        /**
         * Removes the loading Indicator
         *
         * @function $.forerunner.reportViewer#removeLoadingIndicator
         *
         * @param {Boolean} force - Force remove loading indicator if it's true
         */
        removeLoadingIndicator: function (force) {
            var me = this;
            if (me.loadLock === 1 || force === true) {
                me.loadLock = 0;
                var $mainviewport = me.options.$appContainer.find(".fr-layout-mainviewport");
                $mainviewport.removeClass("fr-layout-mainviewport-fullheight");

                me.$reportContainer.removeClass("fr-report-container-translucent");
                me.$loadingIndicator.hide();
            }
        }
    });  // $widget

});  // function()
