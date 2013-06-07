$(function () {
    // Toolbar widget
    $.widget("Forerunner.toolbar", {
        options: {
            $reportViewer: null
        },
        initCallbacks: function ($FRReportViewer) {
            var $Cell;
            var me = this;
            me.options.$reportViewer = $FRReportViewer;
            $Cell = $('.fr-button-paramarea', me.$el);
            $Cell.on("click", function (e) { me.options.$reportViewer.reportViewer('ShowParms') });
            $Cell.addClass("cursor-pointer");
            $Cell = $('.fr-button-nav');
            $Cell.on("click", function (e) { me.options.$reportViewer.reportViewer('ShowNav') });
            $Cell.addClass("cursor-pointer");
            $Cell = $('.fr-button-reportback');
            $Cell.on("click", function (e) { me.options.$reportViewer.reportViewer('Back') });
            $Cell.addClass("cursor-pointer");
            $Cell = $('.fr-button-refresh');
            $Cell.on("click", function (e) { me.options.$reportViewer.reportViewer('RefreshReport') });
            $Cell.addClass("cursor-pointer");
            $Cell = $('.fr-button-firstpage');
            $Cell.on("click", function (e) { me.options.$reportViewer.reportViewer('NavToPage', 1) });
            $Cell.addClass("cursor-pointer");
            $Cell = $('.fr-button-prev');
            $Cell.on("click", function (e) { me.options.$reportViewer.reportViewer('NavToPage', me.options.$reportViewer.reportViewer('getCurPage') - 1) });
            $Cell.addClass("cursor-pointer");

            $Cell = $('.fr-textbox-reportpage');
            $Cell.attr("type", "number")
            $Cell.on("keypress", { input: $Cell }, function (e) { if (e.keyCode == 13) me.options.$reportViewer.reportViewer('NavToPage', e.data.input.val()) });

            $Cell = $('.fr-button-next');
            $Cell.on("click", function (e) { me.options.$reportViewer.reportViewer('NavToPage', me.options.$reportViewer.reportViewer('getCurPage') + 1) });
            $Cell.addClass("cursor-pointer");
            $Cell = $('.fr-button-lastpage');
            $Cell.on("click", function (e) { me.options.$reportViewer.reportViewer('NavToPage', me.options.$reportViewer.reportViewer('getNumPages')) });
            $Cell.addClass("cursor-pointer");

            $Cell = $(".fr-button-documentmap");
            $Cell.on("click", function (e) { me.options.$reportViewer.reportViewer("ShowDocMap") });
            $Cell.addClass("cursor-pointer");

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