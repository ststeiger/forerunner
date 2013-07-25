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
    var locData = forerunner.localize.getLocData(forerunner.config.forerunnerFolder + "/ReportViewer/loc/ReportViewer");
    var exportType = forerunner.ssr.constants.exportType;

    // Tool Info data
    var btnReportBack = {
        toolType: toolTypes.button,
        selectorClass: "fr-button-reportback",
        imageClass: "fr-image-reportback",
        events: {
            click: function (e) {
                e.data.$reportViewer.reportViewer("back");
            }
        }
    };
    var btnMenu = {
        toolType: toolTypes.button,
        selectorClass: "fr-button-menu",
        imageClass: "fr-image-menu",
        events: {
            click: function (e) {
                e.data.me._trigger(events.menuClick, null, {});
            }
        }
    };
    var btnNav = {
        toolType: toolTypes.button,
        selectorClass: "fr-button-nav",
        imageClass: "fr-image-nav",
        events: {
            click: function (e) {
                e.data.$reportViewer.reportViewer("showNav");
            }
        }
    };
    var btnParamarea = {
        toolType: toolTypes.button,
        selectorClass: "fr-button-paramarea",
        imageClass: "fr-image-paramarea",
        events: {
            click: function (e) {
                e.data.me._trigger(events.paramAreaClick, null, {});
            }
        }
    };
   
    var btnRefresh = {
        toolType: toolTypes.button,
        selectorClass: "fr-button-refresh",
        imageClass: "fr-image-refresh",
        events: {
            click: function (e) {
                e.data.$reportViewer.reportViewer("refreshReport");
            }
        }
    };
    var btnFirstPage = {
        toolType: toolTypes.button,
        selectorClass: "fr-button-firstpage",
        imageClass: "fr-image-firstpage",
        events: {
            click: function (e) {
                e.data.$reportViewer.reportViewer("navToPage", 1);
            }
        }
    };
    var btnPrev = {
        toolType: toolTypes.button,
        selectorClass: "fr-button-prev",
        imageClass: "fr-image-prev",
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
        events: {
            keypress: function (e) {
                if (e.keyCode === 13) {
                    e.data.$reportViewer.reportViewer("navToPage", this.value);
                }
            },
            click: function (e) {
                e.target.select();
            }
        }
    };
    var btnPageOf = {
        toolType: toolTypes.plainText,
        selectorClass: "fr-toolbar-pageOf",
        text: locData.toolbar.pageOf
    };
    var btnNumPages = {
        toolType: toolTypes.plainText,
        selectorClass: "fr-toolbar-numPages",
        text: "0"
    };
    var btnNext = {
        toolType: toolTypes.button,
        selectorClass: "fr-button-next",
        imageClass: "fr-image-next",
        events: {
            click: function (e) {
                e.data.$reportViewer.reportViewer("navToPage", e.data.$reportViewer.reportViewer("getCurPage") + 1);
            }
        }
    };
    var btnLastPage = {
        toolType: toolTypes.button,
        selectorClass: "fr-button-lastpage",
        imageClass: "fr-image-lastpage",
        events: {
            click: function (e) {
                e.data.$reportViewer.reportViewer("navToPage", e.data.$reportViewer.reportViewer("getNumPages"));
            }
        }
    };
    var btnVCRGroup = {
        toolType: toolTypes.toolGroup,
        selectorClass: "fr-btn-VCRgroup-id",
        tools: [btnFirstPage, btnPrev, btnReportPage, btnPageOf, btnNumPages, btnNext, btnLastPage]
    };
    var btnDocumentMap = {
        toolType: toolTypes.button,
        selectorClass: "fr-button-documentmap",
        imageClass: "fr-image-documentmap",
        events: {
            click: function (e) {
                e.data.$reportViewer.reportViewer("showDocMap");
            }
        }
    };
    var btnKeyword = {
        toolType: toolTypes.input,
        selectorClass: "fr-toolbar-keyword-textbox",
        events: {
            keypress: function (e) {
                if (e.keyCode === 13) {
                    e.data.$reportViewer.reportViewer("find", $.trim(this.value));
                }
            }
        }
    };
    var btnFind = {
        toolType: toolTypes.textButton,
        selectorClass: "fr-button-find",
        text: locData.toolbar.find,
        events: {
            click: function (e) {
                var value = $.trim(e.data.me.element.find(".fr-toolbar-keyword-textbox").val());
                e.data.$reportViewer.reportViewer("find", value);
            }
        }
    };
    var btnSeparator = {
        toolType: toolTypes.plainText,
        selectorClass: "fr-toolbar-span-sparator",
        text: "|&nbsp"
    };
    var btnFindNext = {
        toolType: toolTypes.textButton,
        selectorClass: "fr-button-findnext",
        text: locData.toolbar.next,
        events: {
            click: function (e) {
                var value = $.trim(e.data.me.element.find(".fr-toolbar-keyword-textbox").val());
                e.data.$reportViewer.reportViewer("findNext", value);
            }
        }
    };
    var btnFindGroup = {
        toolType: toolTypes.toolGroup,
        selectorClass: "fr-toolbar-findgroup-id",
        tools: [btnKeyword, btnFind, btnSeparator, btnFindNext]
    };
    //
    // Export tools
    var btnExportXML = {
        toolType: toolTypes.textButton,
        text: locData.exportType.xml,
        selectorClass: "fr-button-exportXML",
        sharedClass: "fr-toolbase-dropdown-item",
        events: {
            click: function (e) {
                e.data.$reportViewer.reportViewer("exportReport", exportType.xml);
            }
        }
    };
    var btnExportCSV = {
        toolType: toolTypes.textButton,
        text: locData.exportType.csv,
        selectorClass: "fr-button-exportCSV",
        sharedClass: "fr-toolbase-dropdown-item",
        events: {
            click: function (e) {
                e.data.$reportViewer.reportViewer("exportReport", exportType.csv);
            }
        }
    };
    var btnExportPDF = {
        toolType: toolTypes.textButton,
        text: locData.exportType.pdf,
        selectorClass: "fr-button-exportPDF",
        sharedClass: "fr-toolbase-dropdown-item",
        events: {
            click: function (e) {
                e.data.$reportViewer.reportViewer("exportReport", exportType.pdf);
            }
        }
    };
    var btnExportMHTML = {
        toolType: toolTypes.textButton,
        text: locData.exportType.mhtml,
        selectorClass: "fr-button-exportMHTML",
        sharedClass: "fr-toolbase-dropdown-item",
        events: {
            click: function (e) {
                e.data.$reportViewer.reportViewer("exportReport", exportType.mhtml);
            }
        }
    };
    var btnExportExcel = {
        toolType: toolTypes.textButton,
        text: locData.exportType.excel,
        selectorClass: "fr-button-exportExcel",
        sharedClass: "fr-toolbase-dropdown-item",
        events: {
            click: function (e) {
                e.data.$reportViewer.reportViewer("exportReport", exportType.mhtml);
            }
        }
    };
    var btnExportTiff = {
        toolType: toolTypes.textButton,
        text: locData.exportType.tiff,
        selectorClass: "fr-button-exportTiff",
        sharedClass: "fr-toolbase-dropdown-item",
        events: {
            click: function (e) {
                e.data.$reportViewer.reportViewer("exportReport", exportType.tiff);
            }
        }
    };
    var btnExportWord = {
        toolType: toolTypes.textButton,
        text: locData.exportType.word,
        selectorClass: "fr-button-exportWord",
        sharedClass: "fr-toolbase-dropdown-item",
        events: {
            click: function (e) {
                e.data.$reportViewer.reportViewer("exportReport", exportType.word);
            }
        }
    };
    var btnSeparator2 = {
        toolType: toolTypes.textButton,
        selectorClass: "fr-toolbar-span-sparator",
        text: "|&nbsp"
    };
    var btnExport = {
        toolType: toolTypes.textButton,
        text: locData.toolbar.exportMenu,
        selectorClass: "fr-button-export",
        dropdown: true,
        tools: [btnExportXML, btnExportCSV, btnExportPDF, btnExportMHTML, btnExportExcel, btnExportTiff, btnExportWord],
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

            // Hook up the toolbar element events
            me.enableTools([btnMenu, btnParamarea, btnNav, btnReportBack,
                               btnRefresh, btnFirstPage, btnPrev, btnNext,
                               btnLastPage, btnDocumentMap, btnFind, btnFindNext]);
        },
        _init: function () {
            var me = this;

            // TODO [jont]
            //
            ///////////////////////////////////////////////////////////////////////////////////////////////
            //// if me.element contains or a a child contains the options.toolClass don't replace the html
            ///////////////////////////////////////////////////////////////////////////////////////////////

            me.element.html("<div class='" + me.options.toolClass + "'/>");
            me.addTools(1, true, [btnMenu, btnReportBack, btnNav, btnRefresh, btnVCRGroup, btnDocumentMap, btnFindGroup, btnSeparator2, btnExport, btnParamarea]);
            if (me.options.$reportViewer) {
                me._initCallbacks();
            }
        },
        _updateBtnStates: function (curPage, maxPage) {
            var me = this;

            me.element.find(".fr-toolbar-numPages").html(maxPage);
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
