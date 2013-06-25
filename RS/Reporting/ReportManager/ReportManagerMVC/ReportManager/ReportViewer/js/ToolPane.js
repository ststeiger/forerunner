$(function () {
    // Toolbar widget
    $.widget("Forerunner.toolpane", $.Forerunner.toolbase, {
        options: {
            $reportViewer: null,
            toolClass: 'fr-toolpane'
        },
        // Button Info
        itemNav: {
            toolType: function () { return this.toolTypes.paneItem; },
            selectorClass: 'fr-id-nav',
            imageClass: 'fr-image-nav',
            text: 'Navigation',
            events: {
                click: function (e) {
                    e.data.$reportViewer.reportViewer('ShowNav')
                    e.data.me._trigger('actionstarted', null, e.data.me.tools['fr-id-nav']);
                }
            }
        },
        itemReportBack: {
            toolType: function () { return this.toolTypes.paneItem; },
            selectorClass: 'fr-id-reportback',
            imageClass: 'fr-image-reportback',
            text: 'Back',
            events: {
                click: function (e) {
                    e.data.$reportViewer.reportViewer('Back')
                    e.data.me._trigger('actionstarted', null, e.data.me.tools['fr-id-reportback']);
                }
            }
        },
        itemRefresh: {
            toolType: function () { return this.toolTypes.paneItem; },
            selectorClass: 'fr-id-refresh',
            imageClass: 'fr-image-refresh',
            text: 'Refresh',
            events: {
                click: function (e) {
                    e.data.$reportViewer.reportViewer('RefreshReport')
                    e.data.me._trigger('actionstarted', null, e.data.me.tools['fr-id-refresh']);
                }
            }
        },
        itemFirstPage: {
            toolType: function () { return this.toolTypes.button; },
            selectorClass: 'fr-id-firstpage',
            imageClass: 'fr-image-firstpage',
            events: {
                click: function (e) {
                    e.data.$reportViewer.reportViewer('NavToPage', 1)
                    e.data.me._trigger('actionstarted', null, e.data.me.tools['fr-id-firstpage']);
                }
            }
        },
        itemPrev: {
            toolType: function () { return this.toolTypes.button; },
            selectorClass: 'fr-id-prev',
            imageClass: 'fr-image-prev',
            events: {
                click: function (e) {
                    e.data.$reportViewer.reportViewer('NavToPage', e.data.$reportViewer.reportViewer('getCurPage') - 1)
                    e.data.me._trigger('actionstarted', null, e.data.me.tools['fr-id-prev']);
                }
            }
        },
        itemReportPage: {
            toolType: function () { return this.toolTypes.input; },
            selectorClass: 'fr-item-textbox-reportpage',
            inputType: 'number',
            events: {
                keypress: function (e) {
                    if (e.keyCode == 13) {
                        e.data.$reportViewer.reportViewer('NavToPage', this.value)
                    }
                }
            }
        },
        itemPageOf: {
            toolType: function () { return this.toolTypes.plainText; },
            selectorClass: 'fr-pageOf',
            text: 'of'
        },
        itemNumPages: {
            toolType: function () { return this.toolTypes.plainText; },
            selectorClass: 'fr-num-pages',
            text: ""
        },
        itemNext: {
            toolType: function () { return this.toolTypes.button; },
            selectorClass: 'fr-id-next',
            imageClass: 'fr-image-next',
            events: {
                click: function (e) {
                    e.data.$reportViewer.reportViewer('NavToPage', e.data.$reportViewer.reportViewer('getCurPage') + 1)
                    e.data.me._trigger('actionstarted', null, e.data.me.tools['fr-id-next']);
                }
            }
        },
        itemLastPage: {
            toolType: function () { return this.toolTypes.button; },
            selectorClass: 'fr-id-lastpage',
            imageClass: 'fr-image-lastpage',
            events: {
                click: function (e) {
                    e.data.$reportViewer.reportViewer('NavToPage', e.data.$reportViewer.reportViewer('getNumPages'))
                    e.data.me._trigger('actionstarted', null, e.data.me.tools['fr-id-lastpage']);
                }
            }
        },
        itemDocumentMap: {
            toolType: function () { return this.toolTypes.paneItem; },
            selectorClass: 'fr-id-documentmap',
            imageClass: 'fr-image-documentmap',
            text: 'Document map',
            events: {
                click: function (e) {
                    e.data.$reportViewer.reportViewer("ShowDocMap")
                    e.data.me._trigger('actionstarted', null, e.data.me.tools['fr-id-documentmap']);
                }
            }
        },
        itemKeyword: {
            toolType: function () { return this.toolTypes.input; },
            selectorClass: 'fr-item-textbox-keyword',
            events: {
                keypress: function (e) {
                    if (e.keyCode == 13) {
                        e.data.$reportViewer.reportViewer('Find', this.value);
                    }
                }
            }
        },
        itemFind: {
            toolType: function () { return this.toolTypes.textButton; },
            selectorClass: 'fr-item-find',
            text: "Find",
            events: {
                click: function (e) {
                    var value = e.data.me.element.find('.fr-item-textbox-keyword').val().trim();
                    e.data.$reportViewer.reportViewer("Find", value);
                    e.data.me._trigger('actionstarted', null, e.data.me.tools['fr-item-find']);
                }
            }
        },
        itemSeparator: {
            toolType: function () { return this.toolTypes.plainText; },
            selectorClass: 'fr-item-span-sparator',
            text: '|&nbsp'
        },
        itemFindNext: {
            toolType: function () { return this.toolTypes.textButton; },
            selectorClass: 'fr-item-findnext',
            text: "Next",
            events: {
                click: function (e) {
                    var value = e.data.me.element.find('.fr-item-textbox-keyword').val().trim();
                    e.data.$reportViewer.reportViewer("FindNext", value);
                    e.data.me._trigger('actionstarted', null, e.data.me.tools['fr-item-findnext']);
                }
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
            me.element.find('.fr-num-pages').html(maxPage);
            me.element.find('.fr-item-textbox-reportpage').attr({ max: maxPage, min: 1 });

            me.options.$reportViewer.reportViewer('getNumPages', curPage);
            if (me.options.$reportViewer.reportViewer('getHasDocMap'))
                me.enableTools([me.itemDocumentMap]);
            else
                me.disableTools([me.itemDocumentMap]);

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
            if (maxPage == 1)
                me.disableTools([me.itemNav]);
            else
                me.enableTools([me.itemNav]);
        },       

    });  // $.widget
});  // function()