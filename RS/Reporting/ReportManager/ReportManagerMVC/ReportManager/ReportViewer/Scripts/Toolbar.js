$(function () {
    // Toolbar widget
    $.widget("Forerunner.toolbar", {
        options: {
            $reportViewer: null
        },
        // Button Info
        btnMenu: {
            selector: '.fr-button-menu',
            handler: function (e) {
                e.data.me._trigger('menuclick', null, {});
            }
        },
        btnParamarea: {
            selector: '.fr-button-paramarea',
            handler: function (e) {
                e.data.$reportViewer.reportViewer('ShowParms')
            }
        },
        btnNav: {
            selector: '.fr-button-nav',
            handler: function (e) {
                e.data.$reportViewer.reportViewer('ShowNav')
            }
        },
        btnReportBack: {
            selector: '.fr-button-reportback',
            handler: function (e) {
                e.data.$reportViewer.reportViewer('Back')
            }
        },
        btnRefresh: {
            selector: '.fr-button-refresh',
            handler: function (e) {
                e.data.$reportViewer.reportViewer('RefreshReport')
            }
        },
        btnFirstPage: {
            selector: '.fr-button-firstpage',
            handler: function (e) {
                e.data.$reportViewer.reportViewer('NavToPage', 1)
            }
        },
        btnPrev: {
            selector: '.fr-button-prev',
            handler: function (e) {
                e.data.$reportViewer.reportViewer('NavToPage', e.data.$reportViewer.reportViewer('getCurPage') - 1)
            }
        },
        btnNext: {
            selector: '.fr-button-next',
            handler: function (e) {
                e.data.$reportViewer.reportViewer('NavToPage', e.data.$reportViewer.reportViewer('getCurPage') + 1)
            }
        },
        btnLastPage: {
            selector: '.fr-button-lastpage',
            handler: function (e) {
                e.data.$reportViewer.reportViewer('NavToPage', e.data.$reportViewer.reportViewer('getNumPages'))
            }
        },
        btnDocumentMap: {
            selector: '.fr-button-documentmap',
            handler: function (e) {
                e.data.$reportViewer.reportViewer("ShowDocMap")
            }
        },
        btnFind: {
            selector: '.fr-button-find',
            handler: function (e) {
                e.data.$reportViewer.reportViewer("Find")
            }
        },
        btnFindNext: {
            selector: '.fr-button-findnext',
            handler: function (e) {
                e.data.$reportViewer.reportViewer("FindNext")
            }
        },
        _initCallbacks: function () {
            var $cell;
            var me = this;

            // Hook up any / all custom events that the report viewer may trigger
            me.options.$reportViewer.on('reportviewerchangepage', function (e, data) {
                $("input.fr-textbox-reportpage", me.$el).val(data.newPageNum);
                var maxNumPages = me.options.$reportViewer.reportViewer('getNumPages');
                me._updateBtnStates(data.newPageNum, maxNumPages);
            });

            // Hook up the toolbar element events
            me._enableButtons([me.btnMenu, me.btnParamarea, me.btnNav, me.btnReportBack,
                               me.btnRefresh, me.btnFirstPage, me.btnPrev, me.btnNext,
                               me.btnLastPage, me.btnDocumentMap, me.btnFind, me.btnFindNext]);

            // Hookup the page number input element events
            $cell = $('.fr-textbox-reportpage', me.$el);
            $cell.attr("type", "number")
            $cell.on("keypress", { input: $cell }, function (e) { if (e.keyCode == 13) me.options.$reportViewer.reportViewer('NavToPage', e.data.input.val()) });
        },
        _init: function () {
            var me = this;

            // TODO [jont]
            //
            //////////////////////////////////////////////////////////////////////////////////////
            //// if me.element contains or a a child contains fr-toolbar don't replace the html
            //////////////////////////////////////////////////////////////////////////////////////

            me.element.html($(
                "<div class='fr-toolbar'>" +
                    "<div class='fr-button-container fr-button-menu'>" +
                        "<div class='fr-buttonicon fr-image-menu'/>" +
                    "</div>" +
                    "<div class='fr-button-container fr-button-home'>" +
                        "<a href='#'><div class='fr-buttonicon fr-image-home'/></a>" +
                    "</div>" +
                    "<div class='fr-button-container fr-button-nav'>" +
                        "<div class='fr-buttonicon fr-image-nav'/>" +
                    "</div>" +
                    "<div class='fr-button-container fr-button-paramarea'>" +
                        "<div class='fr-buttonicon fr-image-paramarea'/>" +
                    "</div>" +
                    "<div class='fr-button-container fr-button-reportback'>" +
                        "<div class='fr-buttonicon fr-image-reportback'/>" +
                    "</div>" +
                    "<div class='fr-button-container fr-button-refresh'>" +
                        "<div class='fr-buttonicon fr-image-refresh'/>" +
                    "</div>" +
                    "<div class='fr-button-container fr-button-firstpage'>" +
                        "<div class='fr-buttonicon fr-image-firstpage'/>" +
                    "</div>" +
                    "<div class='fr-button-container fr-button-prev'>" +
                        "<div class='fr-buttonicon fr-image-prev'/>" +
                    "</div>" +
                    // Page number input element
                    "<input class='fr-textbox fr-textbox-reportpage' />" +
                    "<div class='fr-button-container fr-button-next'>" +
                        "<div class='fr-buttonicon fr-image-next'/>" +
                    "</div>" +
                    "<div class='fr-button-container fr-button-lastpage'>" +
                        "<div class='fr-buttonicon fr-image-lastpage'/>" +
                    "</div>" +
                    "<div class='fr-button-container fr-button-documentmap'>" +
                        "<div class='fr-buttonicon fr-image-documentmap' />" +
                    "</div>" +
                    // Find input element
                    "<input class='fr-textbox fr-textbox-keyword' />" +
                    "<div class='fr-button-container fr-button-find'>" +
                        "<div class='fr-buttonicon fr-image-find' >Find</div>" +
                    "</div>" +
                    "<span class='fr-span-find'> | </span>" +
                    "<div class='fr-button-container fr-button-findnext'>" +
                        "<div class='fr-buttonicon fr-image-findnext' >Next</div>" +
                    "</div>" +
                "</div>"));  // class='fr-toolbar'

            if (me.options.$reportViewer) {
                me._initCallbacks();
            }
        },
        _enableButtons: function (btnInfoArray) {
            var me = this;
            btnInfoArray.forEach(function (btnInfo, index, array) {
                var $btnEl = $(btnInfo.selector, me.$el);
                $btnEl.removeClass('fr-button-disabled');
                $btnEl.addClass('cursor-pointer');
                $btnEl.off('click');  // Always remove any existing event so as to avoid having two accidentally
                $btnEl.on('click', null, { me: me, $reportViewer: me.options.$reportViewer }, btnInfo.handler);
            }, me);
        },
        _disableButtons: function (btnInfoArray) {
            var me = this;
            btnInfoArray.forEach(function (btnInfo, index, array) {
                var $btnEl = $(btnInfo.selector, me.$el);
                $btnEl.addClass('fr-button-disabled');
                $btnEl.removeClass('cursor-pointer');
                $btnEl.off('click');
            }, me);
        },
        _updateBtnStates: function (curPage, maxPage) {
            var me = this;
            if (curPage <= 1) {
                me._disableButtons([me.btnPrev, me.btnFirstPage]);
            }
            else {
                me._enableButtons([me.btnPrev, me.btnFirstPage]);
            }

            if (curPage >= maxPage) {
                me._disableButtons([me.btnNext, me.btnLastPage]);
            }
            else {
                me._enableButtons([me.btnNext, me.btnLastPage]);
            }
        },

        _destroy: function () {
        },

        _create: function () {
            var me = this;
        },
    });  // $.widget
});  // function()