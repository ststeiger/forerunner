$(function () {
    // Toolbar widget
    $.widget("Forerunner.toolbar", $.Forerunner.toolbase, {
        options: {
            $reportViewer: null,
            toolClass: 'fr-toolbar'
        },
        // Button Info
        btnMenu: {
            toolType: 0,
            selectorClass: 'fr-button-menu',
            imageClass: 'fr-image-menu',
            click: function (e) {
                e.data.me._trigger('menuclick', null, {});
            }
        },
        btnNav: {
            toolType: 0,
            selectorClass: 'fr-button-nav',
            imageClass: 'fr-image-nav',
            click: function (e) {
                e.data.$reportViewer.reportViewer('ShowNav')
            }
        },
        btnParamarea: {
            toolType: 0,
            selectorClass: 'fr-button-paramarea',
            imageClass: 'fr-image-paramarea',
            click: function (e) {
                e.data.me._trigger('paramareaclick', null, {});
                //e.data.$reportViewer.reportViewer('ShowParms')
            }
        },
        btnReportBack: {
            toolType: 0,
            selectorClass: 'fr-button-reportback',
            imageClass: 'fr-image-reportback',
            click: function (e) {
                e.data.$reportViewer.reportViewer('Back')
            }
        },
        btnRefresh: {
            toolType: 0,
            selectorClass: 'fr-button-refresh',
            imageClass: 'fr-image-refresh',
            click: function (e) {
                e.data.$reportViewer.reportViewer('RefreshReport')
            }
        },
        btnFirstPage: {
            toolType: 0,
            selectorClass: 'fr-button-firstpage',
            imageClass: 'fr-image-firstpage',
            click: function (e) {
                e.data.$reportViewer.reportViewer('NavToPage', 1)
            }
        },
        btnPrev: {
            toolType: 0,
            selectorClass: 'fr-button-prev',
            imageClass: 'fr-image-prev',
            click: function (e) {
                e.data.$reportViewer.reportViewer('NavToPage', e.data.$reportViewer.reportViewer('getCurPage') - 1)
            }
        },
        btnReportPage: {
            toolType: 1,
            selectorClass: 'fr-textbox-reportpage',
            inputType: 'number',
            keypress: function (e) {
                if (e.keyCode == 13) {
                    e.data.$reportViewer.reportViewer('NavToPage', this.value)
                }
            },
            click: function (e) {                
                e.target.select();
            }
        },
        btnPageOf: {
            toolType: 3,
            selectorClass: 'fr-pageOf',
            text: 'of'
        },
        btnNumPages: {
            toolType: 3,
            selectorClass: 'fr-num-pages',
            text: ""             
        },
        btnNext: {
            toolType: 0,
            selectorClass: 'fr-button-next',
            imageClass: 'fr-image-next',
            click: function (e) {
                e.data.$reportViewer.reportViewer('NavToPage', e.data.$reportViewer.reportViewer('getCurPage') + 1)
            }
        },
        btnLastPage: {
            toolType: 0,
            selectorClass: 'fr-button-lastpage',
            imageClass: 'fr-image-lastpage',
            click: function (e) {
                e.data.$reportViewer.reportViewer('NavToPage', e.data.$reportViewer.reportViewer('getNumPages'))
            }
        },
        btnDocumentMap: {
            toolType: 0,
            selectorClass: 'fr-button-documentmap',
            imageClass: 'fr-image-documentmap',
            click: function (e) {
                e.data.$reportViewer.reportViewer("ShowDocMap")
            }
        },
        btnKeyword: {
            toolType: 1,
            selectorClass: 'fr-textbox-keyword',
            keypress: function (e) {
                if (e.keyCode == 13) {
                    e.data.$reportViewer.reportViewer('Find');
                }
            }
        },
        btnFind: {
            toolType: 2,
            selectorClass: 'fr-button-find',
            text: "Find",
            click: function (e) {
                e.data.$reportViewer.reportViewer("Find");
            }
        },
        btnSeparator: {
            toolType: 3,
            selectorClass: 'fr-span-sparator',
            text: '|&nbsp'
        },
        btnFindNext: {
            toolType: 2,
            selectorClass: 'fr-button-findnext',
            text: "Next",
            click: function (e) {
                e.data.$reportViewer.reportViewer("FindNext");
            }
        },
        btnSeparator2: {
            toolType: 3,
            selectorClass: 'fr-span-sparator',
            text: '|&nbsp'
        },
        btnExport: {
            toolType: 2,
            selectorClass: 'fr-button-export',
            text: "Export",
            click: function (e) {
                e.data.$reportViewer.reportViewer("ShowExport");
            }
        },
        _initCallbacks: function () {
            var me = this;

            // Hook up any / all custom events that the report viewer may trigger
            me.options.$reportViewer.on('reportviewerchangepage', function (e, data) {
                $("input.fr-textbox-reportpage", me.$el).val(data.newPageNum);
                var maxNumPages = me.options.$reportViewer.reportViewer('getNumPages');
                me._updateBtnStates(data.newPageNum, maxNumPages);
                

                if (data.paramLoaded == false)
                    me.disableTools([me.btnParamarea]);
                else
                    me._enableParamButtons();
            });

            me.options.$reportViewer.on('reportviewershowparamarea', function (e, data) {
                me._disableParamButtons();
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

            me.element.html($("<div class='fr-toolbar' />"));
            me.addTools(1, true, [me.btnMenu, me.btnNav, me.btnParamarea, me.btnReportBack, me.btnRefresh, me.btnFirstPage, me.btnPrev, me.btnReportPage,
                                   me.btnPageOf, me.btnNumPages, me.btnNext, me.btnLastPage, me.btnDocumentMap, me.btnKeyword, me.btnFind, me.btnSeparator,
                                   me.btnFindNext, me.btnSeparator2, me.btnExport]);
            if (me.options.$reportViewer) {
                me._initCallbacks();
            }
        },
        _updateBtnStates: function (curPage, maxPage) {
            var me = this;
            me.element.find('.fr-num-pages').html(maxPage);
            me.element.find('.fr-textbox-reportpage').attr({ max: maxPage, min: 1 });

            if (me.options.$reportViewer.reportViewer('getHasDocMap'))
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
            if (maxPage ==1 )
                me.disableTools([me.btnNav]);
            else
                me.enableTools([me.btnNav]);
        },
        _disableParamButtons: function () {
            var me = this;
            me.disableTools([me.btnNav, me.btnRefresh, me.btnFirstPage, me.btnPrev, me.btnReportPage,
                             me.btnPageOf, me.btnNumPages, me.btnNext, me.btnLastPage, me.btnDocumentMap, me.btnKeyword, me.btnFind, me.btnFindNext, me.btnExport]);
        },
        _enableParamButtons: function () {
            var me = this;
            me.enableTools([me.btnNav, me.btnRefresh, me.btnFirstPage, me.btnPrev, me.btnReportPage,
                             me.btnPageOf, me.btnNumPages, me.btnNext, me.btnLastPage, me.btnDocumentMap, me.btnKeyword, me.btnFind, me.btnFindNext, me.btnExport]);
        },
        _destroy: function () {
        },

        _create: function () {
            var me = this;
        },
    });  // $.widget
});  // function()