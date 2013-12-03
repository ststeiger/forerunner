/**
 * @file Contains the toolbar widget.
 *
 */

var forerunner = forerunner || {};
forerunner.ssr = forerunner.ssr || {};
forerunner.ssr.tools = forerunner.ssr.tools || {};
forerunner.ssr.tools.toolbar = forerunner.ssr.tools.toolbar || {};
forerunner.ssr.tools.groups = forerunner.ssr.tools.groups || {};

$(function () {
    // Useful namespaces
    var widgets = forerunner.ssr.constants.widgets;
    var events = forerunner.ssr.constants.events;
    var tb = forerunner.ssr.tools.toolbar;
    var tg = forerunner.ssr.tools.groups;


    /**
     * Toobar widget used by the reportViewer
     *
     * @namespace $.forerunner.toolbar
     * @prop {object} options - The options for toolbar
     * @prop {Object} options.$reportViewer - The report viewer widget
     * @prop {String} options.toolClass - The top level class for this tool (E.g., fr-toolbar)
     * @example
     * $("#toolbarId").toolbar({
     *  $reportViewer: $viewer,
     *  toolClass: "fr-toolbar"
	 * });
     *
     * Note:
     *  Toolbar can be extended by calling the addTools method defined by {@link $.forerunner.toolBase}
     */
    $.widget(widgets.getFullname(widgets.toolbar), $.forerunner.toolBase, /** @lends $.forerunner.toolbar */ {
        options: {
            $reportViewer: null,
            toolClass: "fr-toolbar"
        },
        _initCallbacks: function () {
            var me = this;

            // Hook up any / all custom events that the report viewer may trigger
            me.options.$reportViewer.on(events.reportViewerSetPageDone(), function (e, data) {
                $("input.fr-toolbar-reportpage-textbox", me.element).val(data.newPageNum);
                var maxNumPages = me.options.$reportViewer.reportViewer("getNumPages");

                if (data.renderError === true) {
                    me.enableTools([tb.btnMenu, tb.btnRefresh]);
                }
                else {
                    me.enableTools(me._viewerButtons(false));
                    me._updateBtnStates(data.newPageNum, maxNumPages);

                    if (data.numOfVisibleParameters === 0)
                        me.disableTools([tb.btnParamarea]);
                }
            });

            me.options.$reportViewer.on(events.reportViewerShowParamArea(), function (e, data) {
                me.enableTools([tb.btnParamarea]);
            });

            me.options.$reportViewer.on(events.reportViewerShowDocMap(), function (e, data) {
                me.disableAllTools();
                me.enableTools([tb.btnDocumentMap, tb.btnMenu, tb.btnReportBack]);
            });

            me.options.$reportViewer.on(events.reportViewerHideDocMap(), function (e, data) {
                me.enableAllTools();
            });

            me.options.$reportViewer.on(events.reportViewerShowNav(), function (e, data) {
                if (data.open) {
                    me.disableAllTools();
                    me.enableTools([tb.btnNav, tb.btnMenu]);
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
            //me.enableTools([tb.btnNav, tb.btnRefresh, tb.btnFirstPage, tb.btnPrev, tb.btnNext,
            //                   tb.btnLastPage, tb.btnDocumentMap, tb.btnFind, tb.btnZoom, tg.btnExportDropdown, tb.btnPrint]);
            //me.enableTools([tb.btnMenu, tb.btnReportBack]);
        },
        _init: function () {
            var me = this;

            // TODO [jont]
            //
            ///////////////////////////////////////////////////////////////////////////////////////////////
            //// if me.element contains or a a child contains the options.toolClass don't replace the html
            ///////////////////////////////////////////////////////////////////////////////////////////////

            me.element.html("<div class='" + me.options.toolClass + " fr-core-widget'/>");
           
            me.addTools(1, false, me._viewerButtons());
            me.addTools(1, false, [tb.btnParamarea]);
            me.enableTools([tb.btnMenu]);
            if (me.options.$reportViewer) {
                me._initCallbacks();
            }
        },
        _viewerButtons: function (allButtons) {
            var listOfButtons;

            if (allButtons === true || allButtons === undefined)
                listOfButtons = [tb.btnMenu, tb.btnReportBack, tb.btnNav, tb.btnRefresh, tb.btnDocumentMap, tg.btnExportDropdown, tg.btnVCRGroup, tg.btnFindGroup, tb.btnZoom, tb.btnPrint];
            else
                listOfButtons = [tb.btnMenu, tb.btnNav, tb.btnRefresh, tb.btnDocumentMap, tg.btnExportDropdown, tg.btnVCRGroup, tg.btnFindGroup, tb.btnZoom, tb.btnPrint];

            // For Windows 8 with touch, windows phone and the default Android browser, skip the zoom button.
            // We don't zoom in default android browser and Windows 8 always zoom anyways.
            if (forerunner.device.isMSIEAndTouch() || forerunner.device.isWindowsPhone() || (forerunner.device.isAndroid() && !forerunner.device.isChrome())) {
                if (allButtons === true || allButtons === undefined)
                    listOfButtons = [tb.btnMenu, tb.btnNav, tb.btnRefresh, tb.btnDocumentMap, tg.btnExportDropdown, tg.btnVCRGroup, tg.btnFindGroup, tb.btnPrint];
                else
                    listOfButtons = [tb.btnMenu, tb.btnReportBack, tb.btnNav, tb.btnRefresh, tb.btnDocumentMap, tg.btnExportDropdown, tg.btnVCRGroup, tg.btnFindGroup, tb.btnPrint];

                
            }

            return listOfButtons;
        },
        _updateBtnStates: function (curPage, maxPage) {
            var me = this;

            me.element.find(".fr-toolbar-numPages-button").html(maxPage);
            me.element.find(".fr-toolbar-reportpage-textbox").attr({ max: maxPage, min: 1 });

            if (me.options.$reportViewer.reportViewer("getHasDocMap"))
                me.enableTools([tb.btnDocumentMap]);
            else
                me.disableTools([tb.btnDocumentMap]);

            if (curPage <= 1) {
                me.disableTools([tb.btnPrev, tb.btnFirstPage]);
            }
            else {
                me.enableTools([tb.btnPrev, tb.btnFirstPage]);
            }

            if (curPage >= maxPage) {
                me.disableTools([tb.btnNext, tb.btnLastPage]);
            }
            else {
                me.enableTools([tb.btnNext, tb.btnLastPage]);
            }
            if (maxPage ===1 )
                me.disableTools([tb.btnNav]);
            else
                me.enableTools([tb.btnNav]);
        },
        _clearBtnStates: function () {
            var me = this;
            me.element.find(".fr-toolbar-keyword-textbox").val("");
            me.element.find(".fr-toolbar-reportpage-textbox").val("");
            me.element.find(".fr-toolbar-numPages-button").html(0);
        },
        _leaveCurReport: function () {
            var me = this;
            me._clearBtnStates();
            me.disableTools(me._viewerButtons(false));
            //me.enableTools([tb.btnReportBack]);
        },
        _destroy: function () {
        },

        _create: function () {
            var me = this;
        },
    });  // $.widget
});  // function()
