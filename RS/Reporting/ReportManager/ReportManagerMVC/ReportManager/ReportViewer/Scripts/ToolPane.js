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
                e.data.me._trigger('actionstarted', null, e.data.me.itemParamarea);
            }
        },
        itemNav: {
            selector: '.fr-id-nav',
            handler: function (e) {
                e.data.$reportViewer.reportViewer('ShowNav')
                e.data.me._trigger('actionstarted', null, e.data.me.itemNav);
            }
        },
        itemReportBack: {
            selector: '.fr-id-reportback',
            handler: function (e) {
                e.data.$reportViewer.reportViewer('Back')
                e.data.me._trigger('actionstarted', null, e.data.me.itemReportBack);
            }
        },
        itemRefresh: {
            selector: '.fr-id-refresh',
            handler: function (e) {
                e.data.$reportViewer.reportViewer('RefreshReport')
                e.data.me._trigger('actionstarted', null, e.data.me.itemRefresh);
            }
        },
        itemFirstPage: {
            selector: '.fr-id-firstpage',
            handler: function (e) {
                e.data.$reportViewer.reportViewer('NavToPage', 1)
                e.data.me._trigger('actionstarted', null, e.data.me.itemFirstPage);
            }
        },
        itemPrev: {
            selector: '.fr-id-prev',
            handler: function (e) {
                e.data.$reportViewer.reportViewer('NavToPage', e.data.$reportViewer.reportViewer('getCurPage') - 1)
                e.data.me._trigger('actionstarted', null, e.data.me.itemPrev);
            }
        },
        itemNext: {
            selector: '.fr-id-next',
            handler: function (e) {
                e.data.$reportViewer.reportViewer('NavToPage', e.data.$reportViewer.reportViewer('getCurPage') + 1)
                e.data.me._trigger('actionstarted', null, e.data.me.itemNext);
            }
        },
        itemLastPage: {
            selector: '.fr-id-lastpage',
            handler: function (e) {
                e.data.$reportViewer.reportViewer('NavToPage', e.data.$reportViewer.reportViewer('getNumPages'))
                e.data.me._trigger('actionstarted', null, e.data.me.itemLastPage);
            }
        },
        itemDocumentMap: {
            selector: '.fr-id-documentmap',
            handler: function (e) {
                e.data.$reportViewer.reportViewer("ShowDocMap")
                e.data.me._trigger('actionstarted', null, e.data.me.itemDocumentMap);
            }
        },
        itemFind: {
            selector: '.fr-item-find',
            handler: function (e) {
                e.data.$reportViewer.reportViewer("Find")
                e.data.me._trigger('actionstarted', null, e.data.me.itemFind);
            }
        },
        itemFindNext: {
            selector: '.fr-item-findnext',
            handler: function (e) {
                e.data.$reportViewer.reportViewer("FindNext")
                e.data.me._trigger('actionstarted', null, e.data.me.itemFindNext);
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
            me._enableItems([me.itemParamarea, me.itemNav, me.itemReportBack, me.itemRefresh, me.itemFirstPage, me.itemPrev,
                             me.itemNext, me.itemLastPage, me.itemDocumentMap, me.itemFind, me.itemFindNext]);

            $cell = $('.fr-item-textbox-reportpage', me.$el);
            $cell.attr("type", "number")
            $cell.on("keypress", { input: $cell }, function (e) { if (e.keyCode == 13) me.options.$reportViewer.reportViewer('NavToPage', e.data.input.val()) });
        },
        _init: function () {
            var me = this;
            me.element.html($(
                "<div class='fr-toolpane' id='ViewerToolPane'>" +
                    // Page navigation
                    "<div class='fr-button-container fr-id-firstpage'>" +
                        "<div class='fr-itemicon fr-image-firstpage'/>" +
                    "</div>" +
                    "<div class='fr-button-container fr-id-prev'>" +
                        "<div class='fr-itemicon fr-image-prev'/>" +
                    "</div>" +
                    // Page number input element
                    "<input class='fr-textbox fr-textbox-reportpage' />" +
                    "<div class='fr-button-container fr-id-next'>" +
                        "<div class='fr-itemicon fr-image-next'/>" +
                    "</div>" +
                    "<div class='fr-button-container fr-id-lastpage'>" +
                        "<div class='fr-itemicon fr-image-lastpage'/>" +
                    "</div>" +
                    // Home
                    "<div class='fr-item-container'>" +
                        "<a href='#' class='fr-item-container'><div class='fr-itemicon fr-image-home' />Home</a>" +
                    "</div>" +
                    // Navigation
                    "<div class='fr-item-container fr-id-nav'>" + // fr-id... are used for selection only
                        "<div class='fr-itemicon fr-image-nav' />Navigation" +
                    "</div>" +
                    // Parameters
                    "<div class='fr-item-container fr-id-paramarea'>" + // fr-id... are used for selection only
                        "<div class='fr-itemicon fr-image-paramarea' />Paremeters" +
                    "</div>" +
                    // Back
                    "<div class='fr-item-container fr-id-reportback'>" + // fr-id... are used for selection only
                        "<div class='fr-itemicon fr-image-reportback' />Back" +
                    "</div>" +
                    // Refresh
                    "<div class='fr-item-container fr-id-refresh'>" + // fr-id... are used for selection only
                        "<div class='fr-itemicon fr-image-refresh' />Refresh" +
                    "</div>" +
                    // document map
                    "<div class='fr-item-container fr-id-documentmap'>" + // fr-id... are used for selection only
                        "<div class='fr-itemicon fr-image-documentmap' />Document map" +
                    "</div>" +
                    // spacer
                    "<div class='fr-item-spacer'></div>" +
                    // Find | Next
                    "<input class='fr-item-textbox fr-item-textbox-keyword' />" +
                    "<span class='fr-item-container'>&nbsp&nbsp</span>" +
                    "<span class='fr-item-container fr-item-find'>Find</span>" +
                    "<span class='fr-item-container'>&nbsp|&nbsp</span>" +
                    "<span class='fr-item-container fr-item-findnext' >Next</span>" +
                "</div>"));
            if (me.options.$reportViewer) {
                me._initCallbacks();
            }
        },
        _enableItems: function (itemInfoArray) {
            var me = this;
            itemInfoArray.forEach(function (itemInfo, index, array) {
                var $itemEl = $(itemInfo.selector, me.$el);
                $itemEl.removeClass('fr-item-disabled');
                $itemEl.addClass('cursor-pointer');
                $itemEl.off('click');  // Always remove any existing event so as to avoid having two accidentally
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

            if (curPage > 1) {
                me._enableItems([me.itemPrev, me.itemFirstPage]);
            }
            else {
                me._disableItems([me.itemPrev, me.itemFirstPage]);
            }

            if (curPage < maxPage) {
                me._enableItems([me.itemNext, me.itemLastPage]);
            }
            else {
                me._disableItems([me.itemNext, me.itemLastPage]);
            }
        },

        _destroy: function () {
        },

        _create: function () {
            var me = this;
        },
    });  // $.widget
});  // function()