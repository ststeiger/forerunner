/**
 * @file Contains the toolPane widget.
 *
 */

var forerunner = forerunner || {};
forerunner.ssr = forerunner.ssr || {};

$(function () {
    var widgets = forerunner.ssr.constants.widgets;
    var events = forerunner.ssr.constants.events;
    var tp = forerunner.ssr.tools.toolpane;
    var tg = forerunner.ssr.tools.groups;

    /**
     * ToolPane widget used with the reportViewer
     *
     * @namespace $.forerunner.toolPane
     * @prop {object} options - The options for toolPane
     * @prop {Object} options.$reportViewer - The report viewer widget
     * @prop {String} options.toolClass - The top level class for this tool (E.g., fr-toolpane)
     * @example
     * $("#toolPaneId").toolPane({
     *  $reportViewer: $viewer,
     *  toolClass: "fr-toolpane"
	 * });
     *
     * Note:
     *  ToolPane can be extended by calling the addTools method defined by {@link $.forerunner.toolBase}
     */
    $.widget(widgets.getFullname(widgets.toolPane), $.forerunner.toolBase, {
        options: {
            $reportViewer: null,
            toolClass: "fr-toolpane"
        },
        _initCallbacks: function () {
            var me = this;

            // Hook up any / all custom events that the report viewer may trigger
            me.options.$reportViewer.on(events.reportViewerSetPageDone(), function (e, data) {
                $("input.fr-item-textbox-reportpage", me.element).val(data.newPageNum);
                var maxNumPages = me.options.$reportViewer.reportViewer("getNumPages");

                if (data.renderError === true) {
                    me.enableTools([tp.itemReportBack, tp.itemRefresh]);
                }
                else {
                    me.enableTools(me._viewerItems());
                    me._updateItemStates(data.newPageNum, maxNumPages);
                }
                
            });

            me.options.$reportViewer.on(events.reportViewerShowDocMap(), function (e, data) {
                me.disableAllTools();
                me.enableTools([tp.itemDocumentMap, tp.itemReportBack]);
            });

            me.options.$reportViewer.on(events.reportViewerHideDocMap(), function (e, data) {
                me.enableAllTools();
            });

            me.options.$reportViewer.on(events.reportViewerShowNav(), function (e, data) {
                if (data.open) {
                    me.disableAllTools();
                    me.enableTools([tp.itemNav]);
                    me.freezeEnableDisable(true);
                }
                else {
                    me.freezeEnableDisable(false);
                    me.enableAllTools();
                }
            });

            me.options.$reportViewer.on(events.reportViewerDrillThrough(), function (e, data) {
                me._leaveCurReport();
            });

            me.options.$reportViewer.on(events.reportViewerDrillBack(), function (e, data) {
                me._leaveCurReport();
            });

            // Hook up the toolbar element events
            //me.enableTools([tp.itemFirstPage, tp.itemPrev, tp.itemNext, tp.itemLastPage, tp.itemNav,
            //                tp.itemReportBack, tp.itemRefresh, tp.itemDocumentMap, tp.itemFind]);
        },
        _init: function () {
            var me = this;
            // TODO [jont]
            //
            ///////////////////////////////////////////////////////////////////////////////////////////////
            //// if me.element contains or a a child contains the options.toolClass don"t replace the html
            ///////////////////////////////////////////////////////////////////////////////////////////////

            me.element.html("");
            $toolpane = new $("<div />");
            $toolpane.addClass(me.options.toolClass);
            $(me.element).append($toolpane);

          
            me.addTools(1, false, me._viewerItems());
            // Need to add this to work around the iOS7 footer.
            // It has to be added to the scrollable area for it to scroll up.
            // Bottom padding/border or margin won't be rendered in some cases.
            $spacerdiv = new $("<div />");
            $spacerdiv.attr("style", "height:65px");
            $toolpane.append($spacerdiv);
            if (me.options.$reportViewer) {
                me._initCallbacks();
            }
        },
        _viewerItems: function () {
            var listOfItems = [tg.itemVCRGroup, tp.itemNav, tp.itemReportBack, tp.itemRefresh, tp.itemDocumentMap, tp.itemZoom, tp.itemExport, tg.itemExportGroup, tp.itemPrint, tg.itemFindGroup];
            // For Windows 8 with touch, windows phone and the default Android browser, skip the zoom button.
            // We don't zoom in default android browser and Windows 8 always zoom anyways.
            if (forerunner.device.isMSIEAndTouch() || forerunner.device.isWindowsPhone() || (forerunner.device.isAndroid() && !forerunner.device.isChrome())) {
                listOfItems = [tg.itemVCRGroup, tp.itemNav, tp.itemReportBack, tp.itemRefresh, tp.itemDocumentMap, tp.itemExport, tg.itemExportGroup, tp.itemPrint, tg.itemFindGroup];
            }

            return listOfItems;
        },
        _updateItemStates: function (curPage, maxPage) {
            var me = this;
            me.element.find(".fr-toolbar-numPages-button").html(maxPage);
            me.element.find(".fr-item-textbox-reportpage").attr({ max: maxPage, min: 1 });

            me.options.$reportViewer.reportViewer("getNumPages", curPage);
            if (me.options.$reportViewer.reportViewer("getHasDocMap"))
                me.enableTools([tp.itemDocumentMap]);
            else
                me.disableTools([tp.itemDocumentMap]);

            if (curPage > 1) {
                me.enableTools([tp.itemPrev, tp.itemFirstPage]);
            }
            else {
                me.disableTools([tp.itemPrev, tp.itemFirstPage]);
            }

            if (curPage < maxPage) {
                me.enableTools([tp.itemNext, tp.itemLastPage]);
            }
            else {
                me.disableTools([tp.itemNext, tp.itemLastPage]);
            }
            if (maxPage === 1)
                me.disableTools([tp.itemNav]);
            else
                me.enableTools([tp.itemNav]);
        },
        _clearItemStates: function () {
            var me = this;
            me.element.find(".fr-item-textbox-keyword").val("");
            me.element.find(".fr-item-textbox-reportpage").val("");
            me.element.find(".fr-toolbar-numPages-button").html(0);
        },
        _leaveCurReport: function () {
            var me = this;
            me._clearItemStates();
            me.disableTools(me._viewerItems());
            me.enableTools([tp.itemReportBack]);
        },
    });  // $.widget
});  // function()
