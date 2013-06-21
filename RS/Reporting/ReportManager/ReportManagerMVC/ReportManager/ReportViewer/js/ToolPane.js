﻿$(function () {
    // Toolbar widget
    $.widget("Forerunner.toolpane", $.Forerunner.toolbase, {
        options: {
            $reportViewer: null,
            toolClass: 'fr-toolpane'
        },
        // Button Info
        itemNav: {
            toolType: 4,
            selectorClass: 'fr-id-nav',
            imageClass: 'fr-image-nav',
            text: 'Navigation',
            click: function (e) {
                e.data.$reportViewer.reportViewer('ShowNav')
                e.data.me._trigger('actionstarted', null, e.data.me.tools['fr-id-nav']);
            }
        },
        itemReportBack: {
            toolType: 4,
            selectorClass: 'fr-id-reportback',
            imageClass: 'fr-image-reportback',
            text: 'Back',
            click: function (e) {
                e.data.$reportViewer.reportViewer('Back')
                e.data.me._trigger('actionstarted', null, e.data.me.tools['fr-id-reportback']);
            }
        },
        itemRefresh: {
            toolType: 4,
            selectorClass: 'fr-id-refresh',
            imageClass: 'fr-image-refresh',
            text: 'Refresh',
            click: function (e) {
                e.data.$reportViewer.reportViewer('RefreshReport')
                e.data.me._trigger('actionstarted', null, e.data.me.tools['fr-id-refresh']);
            }
        },
        itemFirstPage: {
            toolType: 0,
            selectorClass: 'fr-id-firstpage',
            imageClass: 'fr-image-firstpage',
            click: function (e) {
                e.data.$reportViewer.reportViewer('NavToPage', 1)
                e.data.me._trigger('actionstarted', null, e.data.me.tools['fr-id-firstpage']);
            }
        },
        itemPrev: {
            toolType: 0,
            selectorClass: 'fr-id-prev',
            imageClass: 'fr-image-prev',
            click: function (e) {
                e.data.$reportViewer.reportViewer('NavToPage', e.data.$reportViewer.reportViewer('getCurPage') - 1)
                e.data.me._trigger('actionstarted', null, e.data.me.tools['fr-id-prev']);
            }
        },
        itemReportPage: {
            toolType: 1,
            selectorClass: 'fr-item-textbox-reportpage',
            inputType: 'number',
            keypress: function (e) {
                if (e.keyCode == 13) {
                    e.data.$reportViewer.reportViewer('NavToPage', this.value)
                }
            }
        },
        itemPageOf: {
            toolType: 3,
            selectorClass: 'fr-pageOf',
            text: 'of'
        },
        itemNumPages: {
            toolType: 3,
            selectorClass: 'fr-num-pages',
            text: ""
        },
        itemNext: {
            toolType: 0,
            selectorClass: 'fr-id-next',
            imageClass: 'fr-image-next',
            click: function (e) {
                e.data.$reportViewer.reportViewer('NavToPage', e.data.$reportViewer.reportViewer('getCurPage') + 1)
                e.data.me._trigger('actionstarted', null, e.data.me.tools['fr-id-next']);
            }
        },
        itemLastPage: {
            toolType: 0,
            selectorClass: 'fr-id-lastpage',
            imageClass: 'fr-image-lastpage',
            click: function (e) {
                e.data.$reportViewer.reportViewer('NavToPage', e.data.$reportViewer.reportViewer('getNumPages'))
                e.data.me._trigger('actionstarted', null, e.data.me.tools['fr-id-lastpage']);
            }
        },
        itemDocumentMap: {
            toolType: 4,
            selectorClass: 'fr-id-documentmap',
            imageClass: 'fr-image-documentmap',
            text: 'Document map',
            click: function (e) {
                e.data.$reportViewer.reportViewer("ShowDocMap")
                e.data.me._trigger('actionstarted', null, e.data.me.tools['fr-id-documentmap']);
            }
        },
        itemKeyword: {
            toolType: 1,
            selectorClass: 'fr-item-textbox-keyword',
            keypress: function (e) {
                if (e.keyCode == 13) {
                    e.data.$reportViewer.reportViewer('Find', this.value);
                }
            }
        },
        itemFind: {
            toolType: 2,
            selectorClass: 'fr-item-find',
            text: "Find",
            click: function (e) {
                e.data.$reportViewer.reportViewer("Find")
                e.data.me._trigger('actionstarted', null, e.data.me.tools['fr-item-find']);
            }
        },
        itemSeparator: {
            toolType: 3,
            selectorClass: 'fr-item-span-sparator',
            text: '|&nbsp'
        },
        itemFindNext: {
            toolType: 2,
            selectorClass: 'fr-item-findnext',
            text: "Next",
            click: function (e) {
                e.data.$reportViewer.reportViewer("FindNext")
                e.data.me._trigger('actionstarted', null, e.data.me.tools['fr-item-findnext']);
            }
        },
        _initCallbacks: function () {
            var $cell;
            var me = this;

            // Hook up any / all custom events that the report viewer may trigger
            me.options.$reportViewer.on('reportviewerchangepage', function (e, data) {
                $("input.fr-item-textbox-reportpage", me.$el).val(data.newPageNum);
                var maxNumPages = me.options.$reportViewer.reportViewer('getNumPages');
                me._updateItemStates(data.newPageNum, maxNumPages);
                me.element.find('.fr-num-pages').html(maxNumPages);
                me.element.find('.fr-item-textbox-reportpage').attr({ max: maxNumPages, min: 1 });
            });

          

            // Hook up the toolbar element events
            me.enableTools([me.itemFirstPage, me.itemPrev, me.itemNext, me.itemLastPage, me.itemNav,
                                  me.itemReportBack, me.itemRefresh, me.itemDocumentMap, me.itemFind, me.itemFindNext]);
        },
        _init: function () {
            var me = this;
            // TODO [jont]
            //
            ///////////////////////////////////////////////////////////////////////////////////////////////
            //// if me.element contains or a a child contains the options.toolClass don't replace the html
            ///////////////////////////////////////////////////////////////////////////////////////////////

            me.element.html($("<div class='fr-toolpane' />"));
            me.addTools(1, true, [me.itemFirstPage, me.itemPrev, me.itemReportPage, me.itemPageOf, me.itemNumPages, me.itemNext, me.itemLastPage, me.itemNav,
                                  me.itemReportBack, me.itemRefresh, me.itemDocumentMap, me.itemKeyword, me.itemFind, me.itemSeparator, me.itemFindNext]);

            if (me.options.$reportViewer) {
                me._initCallbacks();
            }
        },
        _updateItemStates: function (curPage, maxPage) {
            var me = this;

            if (curPage > 1) {
                me.enableTools([me.itemPrev, me.itemFirstPage]);
            }
            else {
                me.disableTools([me.itemPrev, me.itemFirstPage]);
            }

            if (curPage < maxPage) {
                me.enableTools([me.itemNext, me.itemLastPage]);
            }
            else {
                me.disableTools([me.itemNext, me.itemLastPage]);
            }
        },       


        _create: function () {
            var me = this;
        },
    });  // $.widget
});  // function()