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
                e.data._trigger('menuclick', null, {});
            }
        },
        btnParamarea: {
            selector: '.fr-button-paramarea',
            handler: function (e) {
                e.data.options.$reportViewer.reportViewer('ShowParms')
            }
        },
        btnNav: {
            selector: '.fr-button-nav',
            handler: function (e) {
                e.data.options.$reportViewer.reportViewer('ShowNav')
            }
        },
        btnReportBack: {
            selector: '.fr-button-reportback',
            handler: function (e) {
                e.data.options.$reportViewer.reportViewer('Back')
            }
        },
        btnRefresh: {
            selector: '.fr-button-refresh',
            handler: function (e) {
                e.data.options.$reportViewer.reportViewer('RefreshReport')
            }
        },
        btnFirstPage: {
            selector: '.fr-button-firstpage',
            handler: function (e) {
                e.data.options.$reportViewer.reportViewer('NavToPage', 1)
            }
        },
        btnPrev: {
            selector: '.fr-button-prev',
            handler: function (e) {
                e.data.options.$reportViewer.reportViewer('NavToPage', e.data.options.$reportViewer.reportViewer('getCurPage') - 1)
            }
        },
        btnNext: {
            selector: '.fr-button-next',
            handler: function (e) {
                e.data.options.$reportViewer.reportViewer('NavToPage', e.data.options.$reportViewer.reportViewer('getCurPage') + 1)
            }
        },
        btnLastPage: {
            selector: '.fr-button-lastpage',
            handler: function (e) {
                e.data.options.$reportViewer.reportViewer('NavToPage', e.data.options.$reportViewer.reportViewer('getNumPages'))
            }
        },
        btnDocumentMap: {
            selector: '.fr-button-documentmap',
            handler: function (e) {
                e.data.options.$reportViewer.reportViewer("ShowDocMap")
            }
        },
        btnFind: {
            selector: '.fr-button-find',
            handler: function (e) {
                e.data.options.$reportViewer.reportViewer("Find")
            }
        },
        btnFindNext: {
            selector: '.fr-button-findnext',
            handler: function (e) {
                e.data.options.$reportViewer.reportViewer("FindNext")
            }
        },
        initCallbacks: function ($FRReportViewer) {
            var $cell;
            var me = this;
            me.options.$reportViewer = $FRReportViewer;

            // Hook up any / all custom events that the report viewer may trigger
            me.options.$reportViewer.on('reportviewerchangepage', function (e, data) {
                $("input.fr-textbox-reportpage", me.$el).val(data.newPageNum);
                var maxNumPages = me.options.$reportViewer.reportViewer('getNumPages');
                me._updateBtnStates(data.newPageNum, maxNumPages);
            });

            // Hook up the toolbar element events
            me._enableButtons([me.btnMenu, me.btnParamarea, me.btnNav, me.btnReportBack, me.btnRefresh, me.btnFirstPage, me.btnPrev]);

            $cell = $('.fr-textbox-reportpage', me.$el);
            $cell.attr("type", "number")
            $cell.on("keypress", { input: $cell }, function (e) { if (e.keyCode == 13) me.options.$reportViewer.reportViewer('NavToPage', e.data.input.val()) });

            me._enableButtons([me.btnNext, me.btnLastPage, me.btnDocumentMap, me.btnFindNext, me.btnNext]);

        },
        render: function () {
            var me = this;
            me.element.html($(
                "<div class='fr-toolbar' id='ViewerToolbar'>" +
                "<a href='#'><div class='fr-buttonicon fr-button-home'/></a>" +
                "<div class='fr-buttonicon fr-button-menu'/>" +
                "<div class='fr-buttonicon fr-button-nav'/>" +
                "<div class='fr-buttonicon fr-button-paramarea'/>" +
                "<div class='fr-buttonicon fr-button-reportback'/>" +
                "<div class='fr-buttonicon fr-button-refresh'/>" +
                "<div class='fr-buttonicon fr-button-firstpage'/>" +
                "<div class='fr-buttonicon fr-button-prev'/>" +
                "<input class='fr-textbox fr-textbox-reportpage' />" +
                "<div class='fr-buttonicon fr-button-next'/>" +
                "<div class='fr-buttonicon fr-button-lastpage'/>" +
                "<div class='fr-buttonicon fr-button-documentmap' />" +
                "<input class='fr-textbox fr-textbox-keyword' />" +
                "<div class='fr-buttonicon fr-button-find' >Find</div><span class='fr-span-find'> | </span>" +
                "<div class='fr-buttonicon fr-button-findnext' >Next</div>" +
                "</div>"));
        },
        _enableButtons: function (btnInfoArray) {
            var me = this;
            btnInfoArray.forEach(function (btnInfo, index, array) {
                var $btnEl = $(btnInfo.selector, me.$el);
                $btnEl.removeClass('fr-button-disabled');
                $btnEl.addClass('cursor-pointer');
                $btnEl.on('click', null, me, btnInfo.handler);
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
        _create: function () {
            var me = this;
            me.render();
        },
    });  // $.widget
});  // function()