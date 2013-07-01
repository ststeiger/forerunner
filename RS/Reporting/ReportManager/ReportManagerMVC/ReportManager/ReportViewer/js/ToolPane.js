﻿// Assign or create the single globally scoped variable
var forerunner = forerunner || {};

// Forerunner SQL Server Reports
forerunner.ssr = forerunner.ssr || {};

$(function () {
    var toolTypes = forerunner.ssr.constants.toolTypes;

    // Tool Info data
    var itemNav = {
        toolType: toolTypes.containerItem,
        selectorClass: "fr-id-nav",
        imageClass: "fr-image-nav",
        text: "Navigation",
        events: {
            click: function (e) {
                e.data.$reportViewer.reportViewer("ShowNav");
                e.data.me._trigger("actionstarted", null, e.data.me.allTools["fr-id-nav"]);
            }
        }
    };
    var itemReportBack = {
        toolType: toolTypes.containerItem,
        selectorClass: "fr-id-reportback",
        imageClass: "fr-image-reportback",
        text: "Back",
        events: {
            click: function (e) {
                e.data.$reportViewer.reportViewer("Back");
                e.data.me._trigger("actionstarted", null, e.data.me.allTools["fr-id-reportback"]);
            }
        }
    };
    var itemRefresh = {
        toolType: toolTypes.containerItem,
        selectorClass: "fr-id-refresh",
        imageClass: "fr-image-refresh",
        text: "Refresh",
        events: {
            click: function (e) {
                e.data.$reportViewer.reportViewer("RefreshReport");
                e.data.me._trigger("actionstarted", null, e.data.me.allTools["fr-id-refresh"]);
            }
        }
    };
    var itemFirstPage = {
        toolType: toolTypes.button,
        selectorClass: "fr-id-firstpage",
        imageClass: "fr-image-firstpage",
        events: {
            click: function (e) {
                e.data.$reportViewer.reportViewer("NavToPage", 1);
                e.data.me._trigger("actionstarted", null, e.data.me.allTools["fr-id-firstpage"]);
            }
        }
    };
    var itemPrev = {
        toolType: toolTypes.button,
        selectorClass: "fr-id-prev",
        imageClass: "fr-image-prev",
        events: {
            click: function (e) {
                e.data.$reportViewer.reportViewer("NavToPage", e.data.$reportViewer.reportViewer("getCurPage") - 1);
                e.data.me._trigger("actionstarted", null, e.data.me.allTools["fr-id-prev"]);
            }
        }
    };
    var itemReportPage = {
        toolType: toolTypes.input,
        selectorClass: "fr-item-textbox-reportpage",
        inputType: "number",
        events: {
            keypress: function (e) {
                if (e.keyCode === 13) {
                    e.data.$reportViewer.reportViewer("NavToPage", this.value);
                }
            }
        }
    };
    var itemPageOf = {
        toolType: toolTypes.plainText,
        selectorClass: "fr-pageOf",
        text: "of"
    };
    var itemNumPages = {
        toolType: toolTypes.plainText,
        selectorClass: "fr-num-pages",
        text: ""
    };
    var itemNext = {
        toolType: toolTypes.button,
        selectorClass: "fr-id-next",
        imageClass: "fr-image-next",
        events: {
            click: function (e) {
                e.data.$reportViewer.reportViewer("NavToPage", e.data.$reportViewer.reportViewer("getCurPage") + 1);
                e.data.me._trigger("actionstarted", null, e.data.me.allTools["fr-id-next"]);
            }
        }
    };
    var itemLastPage = {
        toolType: toolTypes.button,
        selectorClass: "fr-id-lastpage",
        imageClass: "fr-image-lastpage",
        events: {
            click: function (e) {
                e.data.$reportViewer.reportViewer("NavToPage", e.data.$reportViewer.reportViewer("getNumPages"));
                e.data.me._trigger("actionstarted", null, e.data.me.allTools["fr-id-lastpage"]);
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
        imageClass: "fr-image-documentmap",
        text: "Document map",
        events: {
            click: function (e) {
                e.data.$reportViewer.reportViewer("ShowDocMap");
                e.data.me._trigger("actionstarted", null, e.data.me.allTools["fr-id-documentmap"]);
            }
        }
    };
    var itemKeyword = {
        toolType: toolTypes.input,
        selectorClass: "fr-item-textbox-keyword",
        events: {
            keypress: function (e) {
                if (e.keyCode === 13) {
                    e.data.$reportViewer.reportViewer("Find", this.value);
                }
            }
        }
    };
    var itemFind = {
        toolType: toolTypes.textButton,
        selectorClass: "fr-item-find",
        text: "Find",
        events: {
            click: function (e) {
                var value = e.data.me.element.find(".fr-item-textbox-keyword").val().trim();
                e.data.$reportViewer.reportViewer("Find", value);
                e.data.me._trigger("actionstarted", null, e.data.me.allTools["fr-item-find"]);
            }
        }
    };
    var itemSeparator = {
        toolType: toolTypes.plainText,
        selectorClass: "fr-item-span-sparator",
        text: "|&nbsp"
    };
    var itemFindNext = {
        toolType: toolTypes.textButton,
        selectorClass: "fr-item-findnext",
        text: "Next",
        events: {
            click: function (e) {
                var value = e.data.me.element.find(".fr-item-textbox-keyword").val().trim();
                e.data.$reportViewer.reportViewer("FindNext", value);
                e.data.me._trigger("actionstarted", null, e.data.me.allTools["fr-item-findnext"]);
            }
        }
    };
    var itemFindGroup = {
        toolType: toolTypes.toolGroup,
        selectorClass: "fr-item-findgroup",
        tools: [itemKeyword, itemFind, itemSeparator, itemFindNext]
    };

    // Toolbar widget
    $.widget("Forerunner.toolpane", $.Forerunner.toolbase, {
        options: {
            $reportViewer: null,
            toolClass: "fr-toolpane"
        },
        _initCallbacks: function () {
            var me = this;

            // Hook up any / all custom events that the report viewer may trigger
            me.options.$reportViewer.on("reportviewerchangepage", function (e, data) {
                $("input.fr-item-textbox-reportpage", me.$el).val(data.newPageNum);
                var maxNumPages = me.options.$reportViewer.reportViewer("getNumPages");
                me._updateItemStates(data.newPageNum, maxNumPages);
                
            });

            // Hook up the toolbar element events
            me.enableTools([itemFirstPage, itemPrev, itemNext, itemLastPage, itemNav,
                            itemReportBack, itemRefresh, itemDocumentMap, itemFind, itemFindNext]);
        },
        _init: function () {
            var me = this;
            // TODO [jont]
            //
            ///////////////////////////////////////////////////////////////////////////////////////////////
            //// if me.element contains or a a child contains the options.toolClass don"t replace the html
            ///////////////////////////////////////////////////////////////////////////////////////////////

            me.element.html("<div class='" + me.options.toolClass + "'/>");
            me.addTools(1, true, [itemVCRGroup, itemNav, itemReportBack, itemRefresh, itemDocumentMap, itemFindGroup]);

            if (me.options.$reportViewer) {
                me._initCallbacks();
            }
        },
        _updateItemStates: function (curPage, maxPage) {
            var me = this;
            me.element.find(".fr-num-pages").html(maxPage);
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

    });  // $.widget
});  // function()
