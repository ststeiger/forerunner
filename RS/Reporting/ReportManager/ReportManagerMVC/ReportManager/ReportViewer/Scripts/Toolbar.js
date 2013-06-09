$(function () {
    // Toolbar widget
    $.widget("Forerunner.toolbar", {
        options: {
            $reportViewer: null
        },
        initCallbacks: function ($FRReportViewer) {
            var $cell;
            var me = this;
            me.options.$reportViewer = $FRReportViewer;

            // Hook up any / all custome events that the report viewer may trigger
            me.options.$reportViewer.on('changePage', function (e, newPageNum) {
                var $input = $("input.fr-textbox-reportpage", me.$el);
                $input.val(newPageNum);
            });

            // Hook up the toolbar element events
            $cell = $('.fr-button-paramarea', me.$el);
            $cell.on("click", function (e) { me.options.$reportViewer.reportViewer('ShowParms') });
            $cell.addClass("cursor-pointer");
            $cell = $('.fr-button-nav');
            $cell.on("click", function (e) { me.options.$reportViewer.reportViewer('ShowNav') });
            $cell.addClass("cursor-pointer");
            $cell = $('.fr-button-reportback');
            $cell.on("click", function (e) { me.options.$reportViewer.reportViewer('Back') });
            $cell.addClass("cursor-pointer");
            $cell = $('.fr-button-refresh');
            $cell.on("click", function (e) { me.options.$reportViewer.reportViewer('RefreshReport') });
            $cell.addClass("cursor-pointer");
            $cell = $('.fr-button-firstpage');
            $cell.on("click", function (e) { me.options.$reportViewer.reportViewer('NavToPage', 1) });
            $cell.addClass("cursor-pointer");
            $cell = $('.fr-button-prev');
            $cell.on("click", function (e) { me.options.$reportViewer.reportViewer('NavToPage', me.options.$reportViewer.reportViewer('getCurPage') - 1) });
            $cell.addClass("cursor-pointer");

            $cell = $('.fr-textbox-reportpage');
            $cell.attr("type", "number")
            $cell.on("keypress", { input: $cell }, function (e) { if (e.keyCode == 13) me.options.$reportViewer.reportViewer('NavToPage', e.data.input.val()) });

            $cell = $('.fr-button-next');
            $cell.on("click", function (e) { me.options.$reportViewer.reportViewer('NavToPage', me.options.$reportViewer.reportViewer('getCurPage') + 1) });
            $cell.addClass("cursor-pointer");
            $cell = $('.fr-button-lastpage');
            $cell.on("click", function (e) { me.options.$reportViewer.reportViewer('NavToPage', me.options.$reportViewer.reportViewer('getNumPages')) });
            $cell.addClass("cursor-pointer");

            $cell = $(".fr-button-documentmap");
            $cell.on("click", function (e) { me.options.$reportViewer.reportViewer("ShowDocMap") });
            $cell.addClass("cursor-pointer");

            $cell = $(".fr-button-find");
            $cell.on("click", function (e) { me.options.$reportViewer.reportViewer("Find") });
            $cell.addClass("cursor-pointer");

            $cell = $(".fr-button-findnext");
            $cell.on("click", function (e) { me.options.$reportViewer.reportViewer("FindNext") });
            $cell.addClass("cursor-pointer");
        },
        render: function () {
            var me = this;
            me.element.html($(
                "<div class='fr-toolbar' id='ViewerToolbar'><a href='#'><div class='fr-buttonicon fr-button-home'/></a>" +
                "<div class='fr-buttonicon fr-button-menu'/>" +
                "<a href='#'><div class='fr-buttonicon fr-button-home'/></a>" +
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