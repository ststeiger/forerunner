$(function () {
    // Toolbar widget
    $.widget("Forerunner.toolpane", {
        options: {
            $reportViewer: null
        },
        initCallbacks: function ($FRReportViewer) {
            var $cell;
            var me = this;
            me.options.$reportViewer = $FRReportViewer;

            // Hook up any / all custom events that the report viewer may trigger
            me.options.$reportViewer.on('reportviewerchangepage', function (e, data) {
                var $input = $("input.fr-item-textbox-reportpage", me.$el);
                $input.val(data.newPageNum);
            });

            // Hook up the toolbar element events
            $cell = $('.fr-item-paramarea', me.$el);
            $cell.on("click", function (e) { me.options.$reportViewer.reportViewer('ShowParms') });
            $cell.addClass("cursor-pointer");
            $cell = $('.fr-item-nav', me.$el);
            $cell.on("click", function (e) { me.options.$reportViewer.reportViewer('ShowNav') });
            $cell.addClass("cursor-pointer");
            $cell = $('.fr-item-reportback', me.$el);
            $cell.on("click", function (e) { me.options.$reportViewer.reportViewer('Back') });
            $cell.addClass("cursor-pointer");
            $cell = $('.fr-item-refresh', me.$el);
            $cell.on("click", function (e) { me.options.$reportViewer.reportViewer('RefreshReport') });
            $cell.addClass("cursor-pointer", me.$el);
            $cell = $('.fr-item-firstpage', me.$el);
            $cell.on("click", function (e) { me.options.$reportViewer.reportViewer('NavToPage', 1) });
            $cell.addClass("cursor-pointer");
            $cell = $('.fr-item-prev', me.$el);
            $cell.on("click", function (e) { me.options.$reportViewer.reportViewer('NavToPage', me.options.$reportViewer.reportViewer('getCurPage') - 1) });
            $cell.addClass("cursor-pointer");

            $cell = $('.fr-item-textbox-reportpage', me.$el);
            $cell.attr("type", "number")
            $cell.on("keypress", { input: $cell }, function (e) { if (e.keyCode == 13) me.options.$reportViewer.reportViewer('NavToPage', e.data.input.val()) });

            $cell = $('.fr-item-next', me.$el);
            $cell.on("click", function (e) { me.options.$reportViewer.reportViewer('NavToPage', me.options.$reportViewer.reportViewer('getCurPage') + 1) });
            $cell.addClass("cursor-pointer");
            $cell = $('.fr-item-lastpage', me.$el);
            $cell.on("click", function (e) { me.options.$reportViewer.reportViewer('NavToPage', me.options.$reportViewer.reportViewer('getNumPages')) });
            $cell.addClass("cursor-pointer");

            $cell = $(".fr-item-documentmap", me.$el);
            $cell.on("click", function (e) { me.options.$reportViewer.reportViewer("ShowDocMap") });
            $cell.addClass("cursor-pointer");

            $cell = $(".fr-item-find", me.$el);
            $cell.on("click", { keyword: $(".fr-item-textbox-keyword") }, function (e) { me.options.$reportViewer.reportViewer("Find", e.data.keyword.val()) });
            $cell.addClass("cursor-pointer");

            $cell = $(".fr-item-findnext", me.$el);
            $cell.on("click", { keyword: $(".fr-item-textbox-keyword") }, function (e) { me.options.$reportViewer.reportViewer("FindNext", e.data.keyword.val()) });
            $cell.addClass("cursor-pointer");
        },
        render: function () {
            var me = this;
            me.element.html($(
                "<div class='fr-toolpane' id='ViewerToolPane'>" +
                    "<div><a href='#' class='fr-itemtext'><div class='fr-itemicon fr-item-home' />Home</a></div>" +
                    "<div class='fr-itemtext'><div class='fr-itemicon fr-item-nav' />Navigation</div>" +
                    "<div class='fr-itemtext'><div class='fr-itemicon fr-item-paramarea' />Paremeters</div>" +
                    "<div class='fr-itemtext'><div class='fr-itemicon fr-item-reportback' />Back</div>" +
                    "<div class='fr-itemtext'><div class='fr-itemicon fr-item-refresh' />Refresh</div>" +
                    "<div>" +
                        "<div class='fr-itemicon fr-item-firstpage' />" +
                        "<div class='fr-itemicon fr-item-prev' />" +
                        "<input class='fr-item-textbox fr-item-textbox-reportpage' />" +
                        "<div class='fr-itemicon fr-item-next' />" +
                        "<div class='fr-itemicon fr-item-lastpage' />" +
                    "</div>" +
                    "<div class='fr-itemtext'><div class='fr-itemicon fr-item-documentmap' />Document map</div>" +
                    "<input class='fr-item-textbox fr-item-textbox-keyword' />" +
                    "<span class='fr-itemtext'>&nbsp&nbsp</span>" +
                    "<span class='fr-item-find' >Find</span>" +
                    "<span class='fr-itemtext'>&nbsp|&nbsp</span>" +
                    "<span class='fr-item-findnext' >Next</span>" +
                "</div>"));

            if (me.options.$reportViewer != null) {
                me.initCallbacks(me.options.$reportViewer);
            };
        },
        _create: function () {
            var me = this;
            me.render();
        },
    });  // $.widget
});  // function()