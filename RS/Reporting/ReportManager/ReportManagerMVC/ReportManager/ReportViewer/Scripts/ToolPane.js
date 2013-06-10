$(function () {
    // Toolbar widget
    $.widget("Forerunner.toolpane", {
        options: {
            $reportViewer: null
        },
        // Button Info
        itemParamarea: {
            selector: '.fr-id-paramarea',
            handler: function (e) {
                e.data.$reportViewer.reportViewer('ShowParms')
            }
        },
        itemNav: {
            selector: '.fr-id-nav',
            handler: function (e) {
                e.data.$reportViewer.reportViewer('ShowNav')
            }
        },
        itemReportBack: {
            selector: '.fr-id-reportback',
            handler: function (e) {
                e.data.$reportViewer.reportViewer('Back')
            }
        },
        itemRefresh: {
            selector: '.fr-id-refresh',
            handler: function (e) {
                e.data.$reportViewer.reportViewer('RefreshReport')
            }
        },
        itemFirstPage: {
            selector: '.fr-item-firstpage',
            handler: function (e) {
                e.data.$reportViewer.reportViewer('NavToPage', 1)
            }
        },
        itemPrev: {
            selector: '.fr-item-prev',
            handler: function (e) {
                e.data.$reportViewer.reportViewer('NavToPage', e.data.$reportViewer.reportViewer('getCurPage') - 1)
            }
        },
        itemNext: {
            selector: '.fr-item-next',
            handler: function (e) {
                e.data.$reportViewer.reportViewer('NavToPage', e.data.$reportViewer.reportViewer('getCurPage') + 1)
            }
        },
        itemLastPage: {
            selector: '.fr-item-lastpage',
            handler: function (e) {
                e.data.$reportViewer.reportViewer('NavToPage', e.data.$reportViewer.reportViewer('getNumPages'))
            }
        },
        itemDocumentMap: {
            selector: '.fr-id-documentmap',
            handler: function (e) {
                e.data.$reportViewer.reportViewer("ShowDocMap")
            }
        },
        itemFind: {
            selector: '.fr-item-find',
            handler: function (e) {
                e.data.$reportViewer.reportViewer("Find")
            }
        },
        itemFindNext: {
            selector: '.fr-item-findnext',
            handler: function (e) {
                e.data.$reportViewer.reportViewer("FindNext")
            }
        },
        initCallbacks: function ($FRReportViewer) {
            var $cell;
            var me = this;
            me.options.$reportViewer = $FRReportViewer;

            // Hook up any / all custom events that the report viewer may trigger
            me.options.$reportViewer.on('reportviewerchangepage', function (e, data) {
                $("input.fr-item-textbox-reportpage", me.$el).val(data.newPageNum);
                var maxNumPages = me.options.$reportViewer.reportViewer('getNumPages');
                me._updateItemStates(data.newPageNum, maxNumPages);
            });

            // Hook up the toolbar element events
            me._enableItems([me.itemParamarea, me.itemNav, me.itemReportBack, me.itemRefresh, me.itemFirstPage, me.itemPrev,
                             me.itemNext, me.itemLastPage, me.itemDocumentMap, me.itemFind, me.itemFindNext]);

            $cell = $('.fr-item-textbox-reportpage', me.$el);
            $cell.attr("type", "number")
            $cell.on("keypress", { input: $cell }, function (e) { if (e.keyCode == 13) me.options.$reportViewer.reportViewer('NavToPage', e.data.input.val()) });
        },
        render: function () {
            var me = this;
            me.element.html($(
                "<div class='fr-toolpane' id='ViewerToolPane'>" +
                    // Page navigation
                    "<div>" +
                        "<div class='fr-itemicon fr-item-firstpage' />" +
                        "<div class='fr-itemicon fr-item-prev' />" +
                        "<input class='fr-item-textbox fr-item-textbox-reportpage' />" +
                        "<div class='fr-itemicon fr-item-next' />" +
                        "<div class='fr-itemicon fr-item-lastpage' />" +
                    "</div>" +
                    // Home
                    "<div class='fr-itemtext'>" +
                        "<a href='#' class='fr-itemtext'><div class='fr-itemicon fr-item-home' />Home</a>" +
                    "</div>" +
                    // Navigation
                    "<div class='fr-itemtext fr-id-nav'>" + // fr-id... are used for selection only
                        "<div class='fr-itemicon fr-item-nav' />Navigation" +
                    "</div>" +
                    // Parameters
                    "<div class='fr-itemtext fr-id-paramarea'>" + // fr-id... are used for selection only
                        "<div class='fr-itemicon fr-item-paramarea' />Paremeters" +
                    "</div>" +
                    // Back
                    "<div class='fr-itemtext fr-id-reportback'>" + // fr-id... are used for selection only
                        "<div class='fr-itemicon fr-item-reportback' />Back" +
                    "</div>" +
                    // Refresh
                    "<div class='fr-itemtext fr-id-refresh'>" + // fr-id... are used for selection only
                        "<div class='fr-itemicon fr-item-refresh' />Refresh" +
                    "</div>" +
                    // document map
                    "<div class='fr-itemtext fr-id-documentmap'>" + // fr-id... are used for selection only
                        "<div class='fr-itemicon fr-item-documentmap' />Document map" +
                    "</div>" +
                    // spacer
                    "<div class='fr-item-spacer'></div>" +
                    // Find | Next
                    "<input class='fr-item-textbox fr-item-textbox-keyword' />" +
                    "<span class='fr-itemtext'>&nbsp&nbsp</span>" +
                    "<span class='fr-itemtext fr-item-find'>Find</span>" +
                    "<span class='fr-itemtext'>&nbsp|&nbsp</span>" +
                    "<span class='fr-itemtext fr-item-findnext' >Next</span>" +
                "</div>"));
        },
        _enableItems: function (itemInfoArray) {
            var me = this;
            itemInfoArray.forEach(function (itemInfo, index, array) {
                var $itemEl = $(itemInfo.selector, me.$el);
                $itemEl.removeClass('fr-item-disabled');
                $itemEl.addClass('cursor-pointer');
                $itemEl.on('click', null, { me: me, $reportViewer: me.options.$reportViewer }, itemInfo.handler);
            }, me);
        },
        _disableItems: function (itemInfoArray) {
            var me = this;
            itemInfoArray.forEach(function (itemInfo, index, array) {
                var $itemEl = $(itemInfo.selector, me.$el);
                $itemEl.addClass('fr-item-disabled');
                $itemEl.removeClass('cursor-pointer');
                $itemEl.off('click');
            }, me);
        },
        _updateItemStates: function (curPage, maxPage) {
            var me = this;
            if (curPage <= 1) {
                me._disableItems([me.itemPrev, me.itemFirstPage]);
            }
            else {
                me._enableItems([me.itemPrev, me.itemFirstPage]);
            }

            if (curPage >= maxPage) {
                me._disableItems([me.itemNext, me.itemLastPage]);
            }
            else {
                me._enableItems([me.itemNext, me.itemLastPage]);
            }
        },
        _create: function () {
            var me = this;
            me.render();
        },
    });  // $.widget
});  // function()