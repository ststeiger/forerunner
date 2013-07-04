// Assign or create the single globally scoped variable
// Assign or create the single globally scoped variable
var forerunner = forerunner || {};

// Forerunner SQL Server Reports
forerunner.ssr = forerunner.ssr || {};

$(function () {
    var widgets = forerunner.ssr.constants.widgets;
    var toolTypes = forerunner.ssr.constants.toolTypes;

    // Toolbar widget
    $.widget(widgets.getFullname(widgets.toolbar), $.forerunner.toolBase, {
        options: {
            $reportViewer: null,
            toolClass: "fr-toolbar"
        },
        // Button Info
        btnMenu: {
            toolType: toolTypes.button,
            selectorClass: "fr-button-menu",
            imageClass: "fr-image-menu",
            events: {
                click: function (e) {
                    e.data.me._trigger("menuclick", null, {});
                }
            }
        },
        btnNav: {
            toolType: toolTypes.button,
            selectorClass: "fr-button-nav",
            imageClass: "fr-image-nav",
            events: {
                click: function (e) {
                    e.data.$reportViewer.reportViewer("showNav");
                }
            }
        },
        btnParamarea: {
            toolType: toolTypes.button,
            selectorClass: "fr-button-paramarea",
            imageClass: "fr-image-paramarea",
            events: {
                click: function (e) {
                    e.data.me._trigger("paramareaclick", null, {});
                    //e.data.$reportViewer.reportViewer("ShowParms")
                }
            }
        },
        btnReportBack: {
            toolType: toolTypes.button,
            selectorClass: "fr-button-reportback",
            imageClass: "fr-image-reportback",
            events: {
                click: function (e) {
                    e.data.$reportViewer.reportViewer("back");
                }
            }
        },
        btnRefresh: {
            toolType: toolTypes.button,
            selectorClass: "fr-button-refresh",
            imageClass: "fr-image-refresh",
            events: {
                click: function (e) {
                    e.data.$reportViewer.reportViewer("refreshReport");
                }
            }
        },
        btnFirstPage: {
            toolType: toolTypes.button,
            selectorClass: "fr-button-firstpage",
            imageClass: "fr-image-firstpage",
            events: {
                click: function (e) {
                    e.data.$reportViewer.reportViewer("navToPage", 1);
                }
            }
        },
        btnPrev: {
            toolType: toolTypes.button,
            selectorClass: "fr-button-prev",
            imageClass: "fr-image-prev",
            events: {
                click: function (e) {
                    e.data.$reportViewer.reportViewer("navToPage", e.data.$reportViewer.reportViewer("getCurPage") - 1);
                }
            }
        },
        btnReportPage: {
            toolType: toolTypes.input,
            selectorClass: "fr-textbox-reportpage",
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
        },
        btnPageOf: {
            toolType: toolTypes.plainText,
            selectorClass: "fr-pageOf",
            text: "of"
        },
        btnNumPages: {
            toolType: toolTypes.plainText,
            selectorClass: "fr-num-pages",
            text: ""
        },
        btnNext: {
            toolType: toolTypes.button,
            selectorClass: "fr-button-next",
            imageClass: "fr-image-next",
            events: {
                click: function (e) {
                    e.data.$reportViewer.reportViewer("navToPage", e.data.$reportViewer.reportViewer("getCurPage") + 1);
                }
            }
        },
        btnLastPage: {
            toolType: toolTypes.button,
            selectorClass: "fr-button-lastpage",
            imageClass: "fr-image-lastpage",
            events: {
                click: function (e) {
                    e.data.$reportViewer.reportViewer("navToPage", e.data.$reportViewer.reportViewer("getNumPages"));
                }
            }
        },
        btnDocumentMap: {
            toolType: toolTypes.button,
            selectorClass: "fr-button-documentmap",
            imageClass: "fr-image-documentmap",
            events: {
                click: function (e) {
                    e.data.$reportViewer.reportViewer("showDocMap");
                }
            }
        },
        btnKeyword: {
            toolType: toolTypes.input,
            selectorClass: "fr-textbox-keyword",
            events: {
                keypress: function (e) {
                    if (e.keyCode === 13) {
                        var value = e.data.me.element.find(".fr-textbox-keyword").val().trim();
                        e.data.$reportViewer.reportViewer("find", this.value);
                    }
                }
            }
        },
        btnFind: {
            toolType: toolTypes.plainText,
            selectorClass: "fr-button-find",
            text: "Find",
            events: {
                click: function (e) {
                    var value = e.data.me.element.find(".fr-textbox-keyword").val().trim();
                    e.data.$reportViewer.reportViewer("find", value);
                }
            }
        },
        btnSeparator: {
            toolType: toolTypes.plainText,
            selectorClass: "fr-span-sparator",
            text: "|&nbsp"
        },
        btnFindNext: {
            toolType: toolTypes.plainText,
            selectorClass: "fr-button-findnext",
            text: "Next",
            events: {
                click: function (e) {
                    var value = e.data.me.element.find(".fr-textbox-keyword").val().trim();
                    e.data.$reportViewer.reportViewer("findNext", value);
                }
            }
        },
        btnSeparator2: {
            toolType: toolTypes.plainText,
            selectorClass: "fr-span-sparator",
            text: "|&nbsp"
        },
        btnExport: {
            toolType: toolTypes.plainText,
            selectorClass: "fr-button-export",
            //imageClass: "fr-image-export",
            text: "Export",
            events: {
                click: function (e) {
                    e.data.$reportViewer.reportViewer("showExport");
                }
            }
        },
        _initCallbacks: function () {
            var me = this;

            // Hook up any / all custom events that the report viewer may trigger
            me.options.$reportViewer.on("reportviewerchangepage", function (e, data) {
                $("input.fr-textbox-reportpage", me.$el).val(data.newPageNum);
                var maxNumPages = me.options.$reportViewer.reportViewer("getNumPages");
                me._updateBtnStates(data.newPageNum, maxNumPages);
                
                if (data.paramLoaded === false)
                    me.disableTools([me.btnParamarea]);
               
            });

            me.options.$reportViewer.on("reportviewershowparamarea", function (e, data) {
                me.enableTools([me.btnParamarea]);
            });

            // Hook up the toolbar element events
            me.enableTools([me.btnMenu, me.btnParamarea, me.btnNav, me.btnReportBack,
                               me.btnRefresh, me.btnFirstPage, me.btnPrev, me.btnNext,
                               me.btnLastPage, me.btnDocumentMap, me.btnFind, me.btnFindNext]);
        },
        _init: function () {
            var me = this;

            // TODO [jont]
            //
            ///////////////////////////////////////////////////////////////////////////////////////////////
            //// if me.element contains or a a child contains the options.toolClass don't replace the html
            ///////////////////////////////////////////////////////////////////////////////////////////////

            me.element.html("<div class='" + me.options.toolClass + "'/>");
            me.addTools(1, true, [me.btnMenu, me.btnNav, me.btnParamarea, me.btnReportBack, me.btnRefresh, me.btnFirstPage, me.btnPrev, me.btnReportPage,
                                   me.btnPageOf, me.btnNumPages, me.btnNext, me.btnLastPage, me.btnDocumentMap, me.btnKeyword, me.btnFind, me.btnSeparator,
                                   me.btnFindNext, me.btnSeparator2, me.btnExport]);
            if (me.options.$reportViewer) {
                me._initCallbacks();
            }
        },
        _updateBtnStates: function (curPage, maxPage) {
            var me = this;
            me.element.find(".fr-num-pages").html(maxPage);
            me.element.find(".fr-textbox-reportpage").attr({ max: maxPage, min: 1 });

            if (me.options.$reportViewer.reportViewer("getHasDocMap"))
                me.enableTools([me.btnDocumentMap]);
            else
                me.disableTools([me.btnDocumentMap]);

            if (curPage <= 1) {
                me.disableTools([me.btnPrev, me.btnFirstPage]);
            }
            else {
                me.enableTools([me.btnPrev, me.btnFirstPage]);
            }

            if (curPage >= maxPage) {
                me.disableTools([me.btnNext, me.btnLastPage]);
            }
            else {
                me.enableTools([me.btnNext, me.btnLastPage]);
            }
            if (maxPage ===1 )
                me.disableTools([me.btnNav]);
            else
                me.enableTools([me.btnNav]);
        },
       
        _destroy: function () {
        },

        _create: function () {
            var me = this;
        },
    });  // $.widget
});  // function()
