/**
 * @file Contains the viewerBase widget.
 *
 */

var forerunner = forerunner || {};
forerunner.ssr = forerunner.ssr || {};

$(function () {
    var constants = forerunner.ssr.constants;
    var widgets = constants.widgets;
    var locData = forerunner.localize;
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
            
        },
        _init: function ($viewerContainer) {
            var me = this;
            me.loadLock = 0;

            me.$loadingIndicator = me.element.find(".fr-report-loading-indicator");
            if (me.$loadingIndicator.length === 0) {
                me.$loadingIndicator = $("<div class='fr-report-loading-indicator' ></div>").text(locData.getLocData().messages.loading);
                me.element.append(me.$loadingIndicator);
            }

            me.$viewerContainer = $viewerContainer;
        },
        /**
         * Shows the loading Indicator
         *
         * @function $.forerunner.reportViewer#showLoadingIndictator
         */
        showLoadingIndictator: function () {
            var me = this;
            if (me.loadLock === 0) {
                me.loadLock = 1;
                setTimeout(function () { me._showLoadingIndictator(); }, me.options.loadDelay);
            }
        },
        _showLoadingIndictator: function () {
            var me = this;

            if (me.loadLock === 1) {
                var $mainviewport = me.options.$appContainer.find(".fr-layout-mainviewport");
                $mainviewport.addClass("fr-layout-mainviewport-fullheight");
                //212 is static value for loading indicator width
                var scrollLeft = me.$viewerContainer.width() - 212;

                me.$loadingIndicator.css("top", me.$viewerContainer.scrollTop() + 100 + "px")
                    .css("left", scrollLeft > 0 ? scrollLeft / 2 : 0 + "px");

                me.$viewerContainer.addClass("fr-report-container-translucent");
                me.$loadingIndicator.show();
            }
        },
        /**
         * Removes the loading Indicator
         *
         * @function $.forerunner.reportViewer#removeLoadingIndicator
         */
        removeLoadingIndicator: function () {
            var me = this;
            me.loadLock = 0;
            var $mainviewport = me.options.$appContainer.find(".fr-layout-mainviewport");
            $mainviewport.removeClass("fr-layout-mainviewport-fullheight");

            me.$viewerContainer.removeClass("fr-report-container-translucent");
            me.$loadingIndicator.hide();
        }
    });  // $widget

});  // function()
