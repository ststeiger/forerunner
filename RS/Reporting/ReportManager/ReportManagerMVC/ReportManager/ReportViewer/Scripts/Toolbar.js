$(function () {
    // Toolbar widget
    $.widget("Forerunner.toolbar", {
        options: {
            $reportViewer: null
        },
        // Button Info
        btnMenu: {
            btnType: 0,
            selectorClass: 'fr-button-menu',
            imageClass: 'fr-image-menu',
            click: function (e) {
                e.data.me._trigger('menuclick', null, {});
            }
        },
        btnNav: {
            btnType: 0,
            selectorClass: 'fr-button-nav',
            imageClass: 'fr-image-nav',
            click: function (e) {
                e.data.$reportViewer.reportViewer('ShowNav')
            }
        },
        btnParamarea: {
            btnType: 0,
            selectorClass: 'fr-button-paramarea',
            imageClass: 'fr-image-paramarea',
            click: function (e) {
                e.data.$reportViewer.reportViewer('ShowParms')
            }
        },
        btnReportBack: {
            btnType: 0,
            selectorClass: 'fr-button-reportback',
            imageClass: 'fr-image-reportback',
            click: function (e) {
                e.data.$reportViewer.reportViewer('Back')
            }
        },
        btnRefresh: {
            btnType: 0,
            selectorClass: 'fr-button-refresh',
            imageClass: 'fr-image-refresh',
            click: function (e) {
                e.data.$reportViewer.reportViewer('RefreshReport')
            }
        },
        btnFirstPage: {
            btnType: 0,
            selectorClass: 'fr-button-firstpage',
            imageClass: 'fr-image-firstpage',
            click: function (e) {
                e.data.$reportViewer.reportViewer('NavToPage', 1)
            }
        },
        btnPrev: {
            btnType: 0,
            selectorClass: 'fr-button-prev',
            imageClass: 'fr-image-prev',
            click: function (e) {
                e.data.$reportViewer.reportViewer('NavToPage', e.data.$reportViewer.reportViewer('getCurPage') - 1)
            }
        },
        btnReportPage: {
            btnType: 1,
            selectorClass: 'fr-textbox-reportpage',
            inputType: 'number',
            keypress: function (e) {
                if (e.keyCode == 13) {
                    e.data.$reportViewer.reportViewer('NavToPage', this.value)
                }
            }
        },
        btnNext: {
            btnType: 0,
            selectorClass: 'fr-button-next',
            imageClass: 'fr-image-next',
            click: function (e) {
                e.data.$reportViewer.reportViewer('NavToPage', e.data.$reportViewer.reportViewer('getCurPage') + 1)
            }
        },
        btnLastPage: {
            btnType: 0,
            selectorClass: 'fr-button-lastpage',
            imageClass: 'fr-image-lastpage',
            click: function (e) {
                e.data.$reportViewer.reportViewer('NavToPage', e.data.$reportViewer.reportViewer('getNumPages'))
            }
        },
        btnDocumentMap: {
            btnType: 0,
            selectorClass: 'fr-button-documentmap',
            imageClass: 'fr-image-documentmap',
            click: function (e) {
                e.data.$reportViewer.reportViewer("ShowDocMap")
            }
        },
        btnKeyword: {
            btnType: 1,
            selectorClass: 'fr-textbox-keyword',
            keypress: function (e) {
                if (e.keyCode == 13) {
                    e.data.$reportViewer.reportViewer('Find', this.value);
                }
            }
        },
        btnFind: {
            btnType: 2,
            selectorClass: 'fr-button-find',
            text: "Find",
            click: function (e) {
                var value = e.me.find('.fr-textbox-keyword').value;
                e.data.$reportViewer.reportViewer("Find", value);
            }
        },
        btnSeparator: {
            btnType: 3,
            selectorClass: 'fr-span-sparator',
            text: '|&nbsp'
        },
        btnFindNext: {
            btnType: 2,
            selectorClass: 'fr-button-findnext',
            text: "Next",
            click: function (e) {
                e.data.$reportViewer.reportViewer("FindNext");
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
            me.enableButtons([me.btnMenu, me.btnParamarea, me.btnNav, me.btnReportBack,
                               me.btnRefresh, me.btnFirstPage, me.btnPrev, me.btnNext,
                               me.btnLastPage, me.btnDocumentMap, me.btnFind, me.btnFindNext]);

            // Hookup the page number input element events
            $cell = $('.fr-textbox-reportpage', me.element);
            $cell.attr("type", "number")
            $cell.on("keypress", { input: $cell }, function (e) { if (e.keyCode == 13) me.options.$reportViewer.reportViewer('NavToPage', e.data.input.val()) });
        },
        //addButton
        //  index - 1 based index of where to insert the button array
        //  enabled - true = enabled, false = dasbled
        //  btnInfoArray: [{
        //      btnType: 0,             // 0 = button, 1 = <input>, 2 = text button, 3 = plain text
        //      selectorClass: '',
        //      imageClass: '',
        //      text: '',
        //      inputType: 'number',    // Used with button type 1
        //      click: function (e) {
        //  }]
        addButtons: function (index, enabled, btnInfoArray) {
            var me = this;
            var $toolbar = me.element.find('.fr-toolbar');
            var $firstBtn = $(me._getButton(btnInfoArray[0]));

            if (index <= 1) {
                $toolbar.prepend($firstBtn);
            }
            else if (index > $toolbar.children().length) {
                $toolbar.append($firstBtn);
            }
            else {
                var selector = ':nth-child(' + index + ')';
                var $child = $toolbar.find(selector);
                $child.before($firstBtn);
            }

            var $btn = $firstBtn;
            for (i = 1; i < btnInfoArray.length; i++) {
                $btn.after(me._getButton(btnInfoArray[i]));
                $btn = $btn.next();
            }

            if (enabled) {
                me.enableButtons(btnInfoArray);
            }
            else {
                me.disableButtons(btnInfoArray);
            }
        },
        enableButtons: function (btnInfoArray) {
            var me = this;
            btnInfoArray.forEach(function (btnInfo, index, array) {
                var $btnEl = $("." + btnInfo.selectorClass, me.element);
                $btnEl.removeClass('fr-button-disabled');   // Always remove any existing event, this will avoid getting two accidentally
                $btnEl.addClass('cursor-pointer');
                me._removeEvent($btnEl, btnInfo);
                me._addEvents($btnEl, btnInfo)
            }, me);
        },

        disableButtons: function (btnInfoArray) {
            var me = this;
            btnInfoArray.forEach(function (btnInfo, index, array) {
                var $btnEl = $("." + btnInfo.selectorClass, me.element);
                $btnEl.addClass('fr-button-disabled');
                $btnEl.removeClass('cursor-pointer');
                me._removeEvent($btnEl, btnInfo);
            }, me);
        },
        _removeEvent: function ($btnEl, btnInfo) {
            var me = this;
            for (var key in btnInfo) {
                if (typeof btnInfo[key] == 'function') {
                    $btnEl.off(key);
                }
            }
        },
        _addEvents: function ($btnEl, btnInfo) {
            var me = this;
            for (var key in btnInfo) {
                if (typeof btnInfo[key] == 'function') {
                    $btnEl.on(key, null, { me: me, $reportViewer: me.options.$reportViewer }, btnInfo[key]);
                }
            }
        },
        _getButton: function (btnInfo) {
            if (btnInfo.btnType == 0) {
                return "<div class='fr-button-container " + btnInfo.selectorClass + "'>" +
                            "<div class='fr-buttonicon " + btnInfo.imageClass + "'/>" +
                       "</div>";
            }
            else if (btnInfo.btnType == 1) {
                var type = "";
                if (btnInfo.inputType) {
                    type = ", type='" + btnInfo.inputType + "'";
                }
                return "<input class='" + btnInfo.selectorClass + "'" + type + " />";
            }
            else if (btnInfo.btnType == 2) {
                return "<div class='fr-button-container " + btnInfo.selectorClass + "'>" + btnInfo.text + "</div>";
            }
            else if (btnInfo.btnType == 3) {
                return "<span class='" + btnInfo.selectorClass + "'> " + btnInfo.text + "</span>";
            }
        },
        _init: function () {
            var me = this;

            // TODO [jont]
            //
            //////////////////////////////////////////////////////////////////////////////////////
            //// if me.element contains or a a child contains fr-toolbar don't replace the html
            //////////////////////////////////////////////////////////////////////////////////////
            me.element.html($("<div class='fr-toolbar' />"));
            me.addButtons(1, true, [me.btnMenu, me.btnNav, me.btnParamarea, me.btnReportBack, me.btnRefresh, me.btnFirstPage, me.btnPrev, me.btnReportPage,
                                   me.btnNext, me.btnLastPage, me.btnDocumentMap, me.btnKeyword, me.btnFind, me.btnSeparator, me.btnFindNext]);
            if (me.options.$reportViewer) {
                me._initCallbacks();
            }
        },
        _updateBtnStates: function (curPage, maxPage) {
            var me = this;
            if (curPage <= 1) {
                me.disableButtons([me.btnPrev, me.btnFirstPage]);
            }
            else {
                me.enableButtons([me.btnPrev, me.btnFirstPage]);
            }

            if (curPage >= maxPage) {
                me.disableButtons([me.btnNext, me.btnLastPage]);
            }
            else {
                me.enableButtons([me.btnNext, me.btnLastPage]);
            }
        },

        _destroy: function () {
        },

        _create: function () {
            var me = this;
        },
    });  // $.widget
});  // function()