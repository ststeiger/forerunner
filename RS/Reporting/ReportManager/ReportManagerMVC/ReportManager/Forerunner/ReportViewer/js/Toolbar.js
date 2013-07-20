// Assign or create the single globally scoped variable
// Assign or create the single globally scoped variable
var forerunner = forerunner || {};

// Forerunner SQL Server Reports
forerunner.ssr = forerunner.ssr || {};

$(function () {
    var widgets = forerunner.ssr.constants.widgets;
    var events = forerunner.ssr.constants.events;
    var toolTypes = forerunner.ssr.constants.toolTypes;
    var locData = forerunner.localize.getLocData(forerunner.init.forerunnerFolder + "/ReportViewer/loc/ReportViewer");

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
        selectorClass: "fr-pageOf",
        text: locData.toolbar.pageOf
    };
    var btnNumPages = {
        toolType: toolTypes.plainText,
        selectorClass: "fr-num-pages",
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
        selectorClass: "fr-textbox-keyword",
        events: {
            keypress: function (e) {
                if (e.keyCode === 13) {
                    e.data.$reportViewer.reportViewer("find", $.trim(this.value));
                }
            }
        }
    };
    var btnFind = {
        toolType: toolTypes.plainText,
        selectorClass: "fr-button-find",
        text: locData.toolbar.find,
        events: {
            click: function (e) {
                var value = $.trim(e.data.me.element.find(".fr-textbox-keyword").val());
                e.data.$reportViewer.reportViewer("find", value);
            }
        }
    };
    var btnSeparator = {
        toolType: toolTypes.plainText,
        selectorClass: "fr-span-sparator",
        text: "|&nbsp"
    };
    var btnFindNext = {
        toolType: toolTypes.plainText,
        selectorClass: "fr-button-findnext",
        text: locData.toolbar.next,
        events: {
            click: function (e) {
                var value = $.trim(e.data.me.element.find(".fr-textbox-keyword").val());
                e.data.$reportViewer.reportViewer("findNext", value);
            }
        }
    };
    var btnSeparator2 = {
        toolType: toolTypes.plainText,
        selectorClass: "fr-span-sparator",
        text: "|&nbsp"
    };
    var btnExport = {
        toolType: toolTypes.plainText,
        selectorClass: "fr-button-export",
        //imageClass: "fr-image-export",
        text: locData.toolbar.exportMenu,
        events: {
            click: function (e) {
                e.data.$reportViewer.reportViewer("showExport");
            }
        }
    };
    var btnFindGroup = {
        toolType: toolTypes.toolGroup,
        selectorClass: "fr-toolbar-findgroup-id",
        tools: [btnKeyword, btnFind, btnSeparator, btnFindNext]
    };

    // Toolbar widget
    $.widget(widgets.getFullname(widgets.toolbar), $.forerunner.toolBase, {
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

            me.element.find(".fr-num-pages").html(maxPage);
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
            me.element.find(".fr-textbox-keyword").val("");
        },
        _destroy: function () {
        },

        _create: function () {
            var me = this;
        },
    });  // $.widget
});  // function()
