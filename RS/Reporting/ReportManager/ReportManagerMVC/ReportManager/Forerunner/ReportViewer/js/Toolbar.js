/**
 * @file Contains the toolbar widget.
 *
 */

var forerunner = forerunner || {};
forerunner.ssr = forerunner.ssr || {};

$(function () {
    // Useful namespaces
    var widgets = forerunner.ssr.constants.widgets;
    var events = forerunner.ssr.constants.events;
    var toolTypes = forerunner.ssr.constants.toolTypes;
    var locData = forerunner.localize.getLocData(forerunner.config.forerunnerFolder() + "/ReportViewer/loc/ReportViewer");
    var exportType = forerunner.ssr.constants.exportType;

    // Tool Info data
    var btnReportBack = {
        toolType: toolTypes.button,
        selectorClass: "fr-toolbar-reportback-button",
        imageClass: "fr-icons24x24-reportback",
        tooltip: locData.toolbar.back,
        events: {
            click: function (e) {
                e.data.$reportViewer.reportViewer("back");
            }
        }
    };
    var btnMenu = {
        toolType: toolTypes.button,
        selectorClass: "fr-toolbar-menu-button",
        imageClass: "fr-icons24x24-menu",
        tooltip: locData.toolbar.menu,
        events: {
            click: function (e) {
                e.data.me._trigger(events.menuClick, null, {});
            }
        }
    };
    var btnNav = {
        toolType: toolTypes.button,
        selectorClass: "fr-toolbar-nav-button",
        imageClass: "fr-icons24x24-nav",
        sharedClass: "fr-toolbar-hidden-on-small fr-toolbar-hidden-on-medium",
        tooltip: locData.toolbar.navigation,
        events: {
            click: function (e) {
                e.data.$reportViewer.reportViewer("showNav");
            }
        }
    };
    var btnParamarea = {
        toolType: toolTypes.button,
        selectorClass: "fr-toolbar-paramarea-button",
        imageClass: "fr-icons24x24-paramarea",
        tooltip: locData.toolbar.paramarea,
        events: {
            click: function (e) {
                e.data.me._trigger(events.paramAreaClick, null, {});
            }
        }
    };
   
    var btnRefresh = {
        toolType: toolTypes.button,
        selectorClass: "fr-toolbar-refresh-button",
        imageClass: "fr-icons24x24-refresh",
        sharedClass: "fr-toolbar-hidden-on-small fr-toolbar-hidden-on-medium fr-toolbar-hidden-on-large",
        tooltip: locData.toolbar.refresh,
        events: {
            click: function (e) {
                e.data.$reportViewer.reportViewer("refreshReport");
            }
        }
    };
    var btnFirstPage = {
        toolType: toolTypes.button,
        selectorClass: "fr-toolbar-firstpage-button",
        imageClass: "fr-icons24x24-firstpage",
        sharedClass: "fr-toolbar-hidden-on-small",
        tooltip: locData.toolbar.firstPage,
        events: {
            click: function (e) {
                e.data.$reportViewer.reportViewer("navToPage", 1);
            }
        }
    };
    var btnPrev = {
        toolType: toolTypes.button,
        selectorClass: "fr-toolbar-prev-button",
        imageClass: "fr-icons24x24-prev",
        sharedClass: "fr-toolbar-hidden-on-small",
        tooltip: locData.toolbar.previousPage,
        events: {
            click: function (e) {
                e.data.$reportViewer.reportViewer("navToPage", e.data.$reportViewer.reportViewer("getCurPage") - 1);
            }
        }
    };
    var btnReportPage = {
        toolType: toolTypes.input,
        selectorClass: "fr-toolbar-reportpage-textbox",
        inputType: "number",
        tooltip: locData.toolbar.reportPage,
        events: {
            keydown: function (e) {                
                if (e.keyCode === 13 || e.keyCode === 9) {
                    e.data.$reportViewer.reportViewer("navToPage", this.value);
                    return false;
                }
            },
            click: function (e) {
                e.target.select();
            }
        }
    };
    var btnPageOf = {
        toolType: toolTypes.plainText,
        selectorClass: "fr-toolbar-pageOf-button",
        text: locData.toolbar.pageOf
    };
    var btnNumPages = {
        toolType: toolTypes.plainText,
        selectorClass: "fr-toolbar-numPages-button",
        text: "0"
    };
    var btnNext = {
        toolType: toolTypes.button,
        selectorClass: "fr-toolbar-next-button",
        imageClass: "fr-icons24x24-next",
        sharedClass: "fr-toolbar-hidden-on-small",
        tooltip: locData.toolbar.next,
        events: {
            click: function (e) {
                e.data.$reportViewer.reportViewer("navToPage", e.data.$reportViewer.reportViewer("getCurPage") + 1);
            }
        }
    };
    var btnLastPage = {
        toolType: toolTypes.button,
        selectorClass: "fr-toolbar-lastpage-button",
        imageClass: "fr-icons24x24-lastpage",
        sharedClass: "fr-toolbar-hidden-on-small",
        tooltip: locData.toolbar.lastPage,
        events: {
            click: function (e) {
                e.data.$reportViewer.reportViewer("navToPage", e.data.$reportViewer.reportViewer("getNumPages"));
            }
        }
    };
    var btnVCRGroup = {
        toolType: toolTypes.toolGroup,
        selectorClass: "fr-toolbar-VCR-group-id",
        tools: [btnFirstPage, btnPrev, btnReportPage, btnPageOf, btnNumPages, btnNext, btnLastPage]
    };
    var btnDocumentMap = {
        toolType: toolTypes.button,
        selectorClass: "fr-toolbar-documentmap-button",
        sharedClass: "fr-toolbar-hidden-on-small fr-toolbar-hidden-on-medium fr-toolbar-hidden-on-large",
        imageClass: "fr-icons24x24-documentmap",
        tooltip: locData.toolbar.docMap,
        events: {
            click: function (e) {
                e.data.$reportViewer.reportViewer("showDocMap");
            }
        }
    };
    var btnKeyword = {
        toolType: toolTypes.input,
        selectorClass: "fr-toolbar-keyword-textbox",
        sharedClass: "fr-toolbar-hidden-on-small fr-toolbar-hidden-on-medium fr-toolbar-hidden-on-large",
        tooltip: locData.toolbar.keyword,
        events: {
            keydown: function (e) {
                if (e.keyCode === 13 || e.keyCode === 9) {
                    e.data.$reportViewer.reportViewer("find", $.trim(this.value));
                    return false;
                }
            }
        }
    };
    var btnFind = {
        toolType: toolTypes.textButton,
        selectorClass: "fr-toolbar-find-button",
        sharedClass: "fr-toolbar-hidden-on-small fr-toolbar-hidden-on-medium fr-toolbar-hidden-on-large",
        text: locData.toolbar.find,
        tooltip: locData.toolbar.find,
        events: {
            click: function (e) {
                var value = $.trim(e.data.me.element.find(".fr-toolbar-keyword-textbox").val());
                e.data.$reportViewer.reportViewer("find", value);
            }
        }
    };
    var btnSeparator = {
        toolType: toolTypes.plainText,
        selectorClass: "fr-toolbar-sparator-text",
        sharedClass: "fr-toolbar-hidden-on-small fr-toolbar-hidden-on-medium fr-toolbar-hidden-on-large",
        text: "|&nbsp"
    };
    var btnFindNext = {
        toolType: toolTypes.textButton,
        selectorClass: "fr-toolbar-findnext-button",
        sharedClass: "fr-toolbar-hidden-on-small fr-toolbar-hidden-on-medium fr-toolbar-hidden-on-large",
        text: locData.toolbar.next,
        tooltip: locData.toolbar.next,
        events: {
            click: function (e) {
                var value = $.trim(e.data.me.element.find(".fr-toolbar-keyword-textbox").val());
                e.data.$reportViewer.reportViewer("findNext", value);
            }
        }
    };
    var btnFindGroup = {
        toolType: toolTypes.toolGroup,
        selectorClass: "fr-toolbar-find-group-id",
        tools: [btnKeyword, btnFind, btnSeparator, btnFindNext]
    };
    //
    // Export tools
    var btnExportXML = {
        toolType: toolTypes.containerItem,
        selectorClass: "fr-button-exportXML-id",
        imageClass: "fr-icons24x24-exportXML",
        sharedClass: "fr-toolbase-dropdown-item",
        text: locData.exportType.xml,
        events: {
            click: function (e) {
                e.data.$reportViewer.reportViewer("exportReport", exportType.xml);
            }
        }
    };
    var btnExportCSV = {
        toolType: toolTypes.containerItem,
        selectorClass: "fr-button-exportCSV-id",
        imageClass: "fr-icons24x24-exportCSV",
        sharedClass: "fr-toolbase-dropdown-item",
        text: locData.exportType.csv,
        events: {
            click: function (e) {
                e.data.$reportViewer.reportViewer("exportReport", exportType.csv);
            }
        }
    };
    var btnExportPDF = {
        toolType: toolTypes.containerItem,
        selectorClass: "fr-button-exportPDF-id",
        imageClass: "fr-icons24x24-exportPDF",
        sharedClass: "fr-toolbase-dropdown-item",
        text: locData.exportType.pdf,
        events: {
            click: function (e) {
                e.data.$reportViewer.reportViewer("exportReport", exportType.pdf);
            }
        }
    };
    var btnExportMHTML = {
        toolType: toolTypes.containerItem,
        selectorClass: "fr-button-exportMHTML-id",
        imageClass: "fr-icons24x24-exportMHT",
        sharedClass: "fr-toolbase-dropdown-item",
        text: locData.exportType.mhtml,
        events: {
            click: function (e) {
                e.data.$reportViewer.reportViewer("exportReport", exportType.mhtml);
            }
        }
    };
    var btnExportExcel = {
        toolType: toolTypes.containerItem,
        selectorClass: "fr-button-exportExcel-id",
        imageClass: "fr-icons24x24-exportExcel",
        sharedClass: "fr-toolbase-dropdown-item",
        text: locData.exportType.excel,
        events: {
            click: function (e) {
                e.data.$reportViewer.reportViewer("exportReport", exportType.excel);
            }
        }
    };
    var btnExportTiff = {
        toolType: toolTypes.containerItem,
        selectorClass: "fr-button-exportTiff-id",
        imageClass: "fr-icons24x24-exportTIFF",
        sharedClass: "fr-toolbase-dropdown-item",
        text: locData.exportType.tiff,
        events: {
            click: function (e) {
                e.data.$reportViewer.reportViewer("exportReport", exportType.tiff);
            }
        }
    };
    var btnExportWord = {
        toolType: toolTypes.containerItem,
        selectorClass: "fr-button-exportWord-id",
        imageClass: "fr-icons24x24-exportWord",
        sharedClass: "fr-toolbase-dropdown-item",
        text: locData.exportType.word,
        events: {
            click: function (e) {
                e.data.$reportViewer.reportViewer("exportReport", exportType.word);
            }
        }
    };
    var btnSeparator2 = {
        toolType: toolTypes.textButton,
        selectorClass: "fr-toolbar-sparator-text",
        sharedClass: "fr-toolbar-hidden-on-small fr-toolbar-hidden-on-medium fr-toolbar-hidden-on-large",
        text: "|&nbsp"
    };
    var btnZoom = {
        toolType: toolTypes.button,
        selectorClass: "fr-toolbar-zoom-button",
        imageClass: "fr-icons24x24-zoom",
        sharedClass: "fr-toolbar-hidden-on-small fr-toolbar-hidden-on-medium fr-toolbar-hidden-on-large",
        tooltip: locData.toolPane.zoom,
        events: {
            click: function (e) {
                e.data.$reportViewer.reportViewer("allowZoom", true);
            }
        }
    };
    var btnExport = {
        toolType: toolTypes.button,
        selectorClass: "fr-toolbar-export-button",
        imageClass: "fr-icons24x24-export",
        sharedClass: "fr-toolbar-hidden-on-small fr-toolbar-hidden-on-medium fr-toolbar-hidden-on-large",
        tooltip: locData.toolbar.exportMenu,
        dropdown: true,
        tools: [btnExportXML, btnExportCSV, btnExportPDF, btnExportMHTML, btnExportExcel, btnExportTiff, btnExportWord],
    };
    var btnPrint = {
        toolType: toolTypes.button,
        selectorClass: "fr-toolbar-print-button",
        imageClass: "fr-icons24x24-printreport",
        sharedClass: "fr-toolbar-hidden-on-small fr-toolbar-hidden-on-medium fr-toolbar-hidden-on-large",
        tooltip: locData.toolbar.print,
        events: {
            click: function (e) {
                e.data.$reportViewer.reportViewer("showPrint");
            }
        }
    };

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
            me.options.$reportViewer.on(events.reportViewerChangePage(), function (e, data) {
                $("input.fr-toolbar-reportpage-textbox", me.$el).val(data.newPageNum);
                var maxNumPages = me.options.$reportViewer.reportViewer("getNumPages");
                me._updateBtnStates(data.newPageNum, maxNumPages);
                
                if (data.paramLoaded === false)
                    me.disableTools([btnParamarea]);
               
            });

            me.options.$reportViewer.on(events.reportViewerDrillBack(), function (e, data) {
                me._clearBtnStates();
            });

            me.options.$reportViewer.on(events.reportViewerShowParamArea(), function (e, data) {
                me.enableTools([btnParamarea]);
            });

            me.options.$reportViewer.on(events.reportViewerShowDocMap(), function (e, data) {
                me.disableAllTools();
                me.enableTools([btnDocumentMap, btnMenu, btnReportBack]);
            });

            me.options.$reportViewer.on(events.reportViewerHideDocMap(), function (e, data) {
                me.enableAllTools();
            });

            me.options.$reportViewer.on(events.reportViewerShowModalDialog(), function (e, data) {
                me.disableAllTools();
            });

            me.options.$reportViewer.on(events.reportViewerCloseModalDialog(), function (e, data) {
                me.enableAllTools();
            });

            me.options.$reportViewer.on(events.reportViewerShowNav(), function (e, data) {
                if (data.open) {
                    me.disableAllTools();
                    me.enableTools([btnNav, btnMenu]);
                }
                else {
                    me.enableAllTools();
                }
            });

            // Hook up the toolbar element events
            me.enableTools([btnMenu, btnParamarea, btnNav, btnReportBack,
                               btnRefresh, btnFirstPage, btnPrev, btnNext,
                               btnLastPage, btnDocumentMap, btnFind, btnFindNext, btnZoom]);
        },
        _init: function () {
            var me = this;

            // TODO [jont]
            //
            ///////////////////////////////////////////////////////////////////////////////////////////////
            //// if me.element contains or a a child contains the options.toolClass don't replace the html
            ///////////////////////////////////////////////////////////////////////////////////////////////

            me.element.html("<div class='" + me.options.toolClass + "'/>");
            me.addTools(1, true, [btnMenu, btnReportBack, btnNav, btnRefresh, btnVCRGroup, btnDocumentMap, btnFindGroup, btnSeparator2, btnZoom, btnExport, btnPrint, btnParamarea]);
            if (me.options.$reportViewer) {
                me._initCallbacks();
            }
        },
        _updateBtnStates: function (curPage, maxPage) {
            var me = this;

            me.element.find(".fr-toolbar-numPages-button").html(maxPage);
            me.element.find(".fr-toolbar-reportpage-textbox").attr({ max: maxPage, min: 1 });

            if (me.options.$reportViewer.reportViewer("getHasDocMap"))
                me.enableTools([btnDocumentMap]);
            else
                me.disableTools([btnDocumentMap]);

            if (curPage <= 1) {
                me.disableTools([btnPrev, btnFirstPage]);
            }
            else {
                me.enableTools([btnPrev, btnFirstPage]);
            }

            if (curPage >= maxPage) {
                me.disableTools([btnNext, btnLastPage]);
            }
            else {
                me.enableTools([btnNext, btnLastPage]);
            }
            if (maxPage ===1 )
                me.disableTools([btnNav]);
            else
                me.enableTools([btnNav]);
        },
        _clearBtnStates: function () {
            var me = this;
            me.element.find(".fr-toolbar-keyword-textbox").val("");
        },
        _destroy: function () {
        },

        _create: function () {
            var me = this;
        },
    });  // $.widget
});  // function()
