/**
 * @file Contains the toolPane widget.
 *
 */

var forerunner = forerunner || {};
forerunner.ssr = forerunner.ssr || {};

$(function () {
    var widgets = forerunner.ssr.constants.widgets;
    var events = forerunner.ssr.constants.events;
    var toolTypes = forerunner.ssr.constants.toolTypes;
    var locData = forerunner.localize.getLocData(forerunner.config.forerunnerFolder() + "/ReportViewer/loc/ReportViewer");
    var exportType = forerunner.ssr.constants.exportType;

    // Tool Info data
    var itemNav = {
        toolType: toolTypes.containerItem,
        selectorClass: "fr-id-nav",
        imageClass: "fr-icons24x24-nav",
        text: locData.toolPane.navigation,
        events: {
            click: function (e) {
                e.data.$reportViewer.reportViewer("showNav");
                e.data.me._trigger(events.actionStarted, null, e.data.me.allTools["fr-id-nav"]);
            }
        }
    };
    var itemZoom = {
        toolType: toolTypes.containerItem,
        selectorClass: "fr-item-zoom",
        imageClass: "fr-icons24x24-zoom",
        text: locData.toolPane.zoom,
        events: {
            click: function (e) {                
                e.data.$reportViewer.reportViewer("allowZoom",true);
                e.data.me._trigger(events.actionStarted, null, e.data.me.allTools["fr-item-zoom"]);
                //e.data.me._trigger(events.actionStarted, null, e.data.me.allTools["fr-item-zoom"]);
            }
        }
    };
    var itemReportBack = {
        toolType: toolTypes.containerItem,
        selectorClass: "fr-id-reportback",
        imageClass: "fr-icons24x24-reportback",
        text: locData.toolPane.back,
        events: {
            click: function (e) {
                e.data.$reportViewer.reportViewer("back");
                e.data.me._trigger(events.actionStarted, null, e.data.me.allTools["fr-id-reportback"]);
            }
        }
    };
    var itemRefresh = {
        toolType: toolTypes.containerItem,
        selectorClass: "fr-id-refresh",
        imageClass: "fr-icons24x24-refresh",
        text: locData.toolPane.refresh,
        events: {
            click: function (e) {
                e.data.$reportViewer.reportViewer("refreshReport");
                e.data.me._trigger(events.actionStarted, null, e.data.me.allTools["fr-id-refresh"]);
            }
        }
    };
    var itemFirstPage = {
        toolType: toolTypes.button,
        selectorClass: "fr-id-firstpage",
        imageClass: "fr-icons24x24-firstpage",
        events: {
            click: function (e) {
                e.data.$reportViewer.reportViewer("navToPage", 1);
                e.data.me._trigger(events.actionStarted, null, e.data.me.allTools["fr-id-firstpage"]);
            }
        }
    };
    var itemPrev = {
        toolType: toolTypes.button,
        selectorClass: "fr-id-prev",
        imageClass: "fr-icons24x24-prev",
        events: {
            click: function (e) {
                e.data.$reportViewer.reportViewer("navToPage", e.data.$reportViewer.reportViewer("getCurPage") - 1);
                e.data.me._trigger(events.actionStarted, null, e.data.me.allTools["fr-id-prev"]);
            }
        }
    };
    var itemReportPage = {
        toolType: toolTypes.input,
        selectorClass: "fr-item-textbox-reportpage",
        inputType: "number",
        events: {
            keydown: function (e) {
                if (e.keyCode === 13 || e.keyCode === 9) {
                    e.data.$reportViewer.reportViewer("navToPage", this.value);
                    e.data.me._trigger(events.actionStarted, null, e.data.me.allTools["fr-item-textbox-reportpage"]);
                    return false;
                }
            }
        }
    };
    var itemPageOf = {
        toolType: toolTypes.plainText,
        selectorClass: "fr-toolbar-pageOf-button",
        text: locData.toolPane.pageOf
    };
    var itemNumPages = {
        toolType: toolTypes.plainText,
        selectorClass: "fr-toolbar-numPages-button",
        text: ""
    };
    var itemNext = {
        toolType: toolTypes.button,
        selectorClass: "fr-id-next",
        imageClass: "fr-icons24x24-next",
        events: {
            click: function (e) {
                e.data.$reportViewer.reportViewer("navToPage", e.data.$reportViewer.reportViewer("getCurPage") + 1);
                e.data.me._trigger(events.actionStarted, null, e.data.me.allTools["fr-id-next"]);
            }
        }
    };
    var itemLastPage = {
        toolType: toolTypes.button,
        selectorClass: "fr-id-lastpage",
        imageClass: "fr-icons24x24-lastpage",
        events: {
            click: function (e) {
                e.data.$reportViewer.reportViewer("navToPage", e.data.$reportViewer.reportViewer("getNumPages"));
                e.data.me._trigger(events.actionStarted, null, e.data.me.allTools["fr-id-lastpage"]);
            }
        }
    };
    var itemVCRGroup = {
        toolType: toolTypes.toolGroup,
        selectorClass: "fr-item-VCRgroup",
        tools: [itemFirstPage, itemPrev, itemReportPage, itemPageOf, itemNumPages, itemNext, itemLastPage]
    };
    var itemDocumentMap = {
        toolType: toolTypes.containerItem,
        selectorClass: "fr-id-documentmap",
        imageClass: "fr-icons24x24-documentmap",
        text: locData.toolPane.docMap,
        events: {
            click: function (e) {
                e.data.$reportViewer.reportViewer("showDocMap");
                e.data.me._trigger(events.actionStarted, null, e.data.me.allTools["fr-id-documentmap"]);
            }
        }
    };
    //
    // Export group
    var itemExportXML = {
        toolType: toolTypes.containerItem,
        imageClass: "fr-icons24x24-exportXML",
        text: locData.exportType.xml,
        selectorClass: "fr-item-exportXML",
        indent: 1,
        events: {
            click: function (e) {
                e.data.$reportViewer.reportViewer("exportReport", exportType.xml);
            }
        }
    };
    var itemExportCSV = {
        toolType: toolTypes.containerItem,
        imageClass: "fr-icons24x24-exportCSV",
        text: locData.exportType.csv,
        selectorClass: "fr-item-exportCSV",
        indent: 1,
        events: {
            click: function (e) {
                e.data.$reportViewer.reportViewer("exportReport", exportType.csv);
            }
        }
    };
    var itemExportPDF = {
        toolType: toolTypes.containerItem,
        imageClass: "fr-icons24x24-exportPDF",
        text: locData.exportType.pdf,
        selectorClass: "fr-item-exportPDF",
        indent: 1,
        events: {
            click: function (e) {
                e.data.$reportViewer.reportViewer("exportReport", exportType.pdf);
            }
        }
    };
    var itemExportMHTML = {
        toolType: toolTypes.containerItem,
        imageClass: "fr-icons24x24-exportMHT",
        text: locData.exportType.mhtml,
        selectorClass: "fr-item-exportMHTML",
        indent: 1,
        events: {
            click: function (e) {
                e.data.$reportViewer.reportViewer("exportReport", exportType.mhtml);
            }
        }
    };
    var itemExportExcel = {
        toolType: toolTypes.containerItem,
        imageClass: "fr-icons24x24-exportExcel",
        text: locData.exportType.excel,
        selectorClass: "fr-item-exportExcel",
        indent: 1,
        events: {
            click: function (e) {
                e.data.$reportViewer.reportViewer("exportReport", exportType.excel);
            }
        }
    };
    var itemExportTiff = {
        toolType: toolTypes.containerItem,
        imageClass: "fr-icons24x24-exportTIFF",
        text: locData.exportType.tiff,
        selectorClass: "fr-item-exportTiff",
        indent: 1,
        events: {
            click: function (e) {
                e.data.$reportViewer.reportViewer("exportReport", exportType.tiff);
            }
        }
    };
    var itemExportWord = {
        toolType: toolTypes.containerItem,
        imageClass: "fr-icons24x24-exportWord",
        text: locData.exportType.word,
        selectorClass: "fr-item-exportWord",
        indent: 1,
        events: {
            click: function (e) {
                e.data.$reportViewer.reportViewer("exportReport", exportType.word);
            }
        }
    };
    var itemExportGroup = {
        toolType: toolTypes.toolGroup,
        visible: false,
        selectorClass: "fr-item-export-group",
        tools: [itemExportXML, itemExportCSV, itemExportPDF, itemExportMHTML, itemExportExcel, itemExportTiff, itemExportWord]
    };
    var itemExport = {
        toolType: toolTypes.containerItem,
        selectorClass: "fr-item-export",
        imageClass: "fr-icons24x24-export",
        text: locData.toolbar.exportMenu,
        rightImageClass: "fr-toolpane-icon16x16 fr-toolpane-down-icon",
        accordionGroup: itemExportGroup,
        events: {
            click: function (e) {
                var toolInfo = e.data.me.allTools["fr-item-export"];
                var $rightIcon = e.data.me.element.find("." + "fr-toolpane-icon16x16");
                $rightIcon.toggleClass("fr-toolpane-down-icon");
                $rightIcon.toggleClass("fr-toolpane-up-icon");

                var accordionGroup = toolInfo.accordionGroup;
                var $accordionGroup = e.data.me.element.find("." + accordionGroup.selectorClass);
                $accordionGroup.toggle();
            }
        }
    };
    //
    // Find group
    var itemKeyword = {
        toolType: toolTypes.input,
        selectorClass: "fr-item-textbox-keyword",
        events: {
            keydown: function (e) {
                if (e.keyCode === 13 || e.keyCode === 9) {
                    e.data.$reportViewer.reportViewer("find", $.trim(this.value));
                    e.data.me._trigger(events.actionStarted, null, e.data.me.allTools["fr-item-find"]);
                    return false;
                }
            }
        }
    };
    var itemFind = {
        toolType: toolTypes.button,
        selectorClass: "fr-item-find",
        imageClass: "fr-icons24x24-search",
        text: locData.toolPane.find,
        events: {
            click: function (e) {
                var value = $.trim(e.data.me.element.find(".fr-item-textbox-keyword").val());
                e.data.$reportViewer.reportViewer("find", value);
                e.data.me._trigger(events.actionStarted, null, e.data.me.allTools["fr-item-find"]);
            }
        }
    };   
    var itemFindGroup = {
        toolType: toolTypes.toolGroup,
        selectorClass: "fr-item-findgroup",
        tools: [itemKeyword, itemFind]
    };
    var itemPrint = {
        toolType: toolTypes.containerItem,
        selectorClass: "fr-item-printreport",
        imageClass: "fr-icons24x24-printreport",
        text: locData.toolPane.print,
        events: {
            click: function (e) {
                e.data.$reportViewer.reportViewer("showPrint");
                e.data.me._trigger(events.actionStarted, null, e.data.me.allTools["fr-item-printreport"]);
            }
        }
    };

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
            me.options.$reportViewer.on(events.reportViewerChangePage(), function (e, data) {
                $("input.fr-item-textbox-reportpage", me.$el).val(data.newPageNum);
                var maxNumPages = me.options.$reportViewer.reportViewer("getNumPages");
                me._updateItemStates(data.newPageNum, maxNumPages);
                
            });

            me.options.$reportViewer.on(events.reportViewerDrillBack(), function (e, data) {
                me._clearItemStates();
            });

            me.options.$reportViewer.on(events.reportViewerShowDocMap(), function (e, data) {
                me.disableAllTools();
                me.enableTools([itemDocumentMap, itemReportBack]);
            });

            me.options.$reportViewer.on(events.reportViewerHideDocMap(), function (e, data) {
                me.enableAllTools();
            });

            me.options.$reportViewer.on(events.reportViewerShowNav(), function (e, data) {
                if (data.open) {
                    me.disableAllTools();
                    me.enableTools([itemNav]);
                }
                else {
                    me.enableAllTools();
                }
            });

            // Hook up the toolbar element events
            me.enableTools([itemFirstPage, itemPrev, itemNext, itemLastPage, itemNav,
                            itemReportBack, itemRefresh, itemDocumentMap, itemFind]);
        },
        _init: function () {
            var me = this;
            // TODO [jont]
            //
            ///////////////////////////////////////////////////////////////////////////////////////////////
            //// if me.element contains or a a child contains the options.toolClass don"t replace the html
            ///////////////////////////////////////////////////////////////////////////////////////////////

            me.element.html("<div class='" + me.options.toolClass + "'/>");
            me.addTools(1, true, [itemVCRGroup, itemNav, itemReportBack, itemRefresh, itemDocumentMap,itemZoom, itemExport, itemExportGroup, itemPrint, itemFindGroup]);

            if (me.options.$reportViewer) {
                me._initCallbacks();
            }
        },
        _updateItemStates: function (curPage, maxPage) {
            var me = this;
            me.element.find(".fr-toolbar-numPages-button").html(maxPage);
            me.element.find(".fr-item-textbox-reportpage").attr({ max: maxPage, min: 1 });

            me.options.$reportViewer.reportViewer("getNumPages", curPage);
            if (me.options.$reportViewer.reportViewer("getHasDocMap"))
                me.enableTools([itemDocumentMap]);
            else
                me.disableTools([itemDocumentMap]);

            if (curPage > 1) {
                me.enableTools([itemPrev, itemFirstPage]);
            }
            else {
                me.disableTools([itemPrev, itemFirstPage]);
            }

            if (curPage < maxPage) {
                me.enableTools([itemNext, itemLastPage]);
            }
            else {
                me.disableTools([itemNext, itemLastPage]);
            }
            if (maxPage === 1)
                me.disableTools([itemNav]);
            else
                me.enableTools([itemNav]);
        },
        _clearItemStates: function () {
            var me = this;
            me.element.find(".fr-item-textbox-keyword").val("");
        },
    });  // $.widget
});  // function()
