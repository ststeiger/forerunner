$(function () {
    // Toolbar widget
    $.widget("Forerunner.toolbar", {
        initCallbacks: function ($FRReportViewer) {
            var $Cell;
            $Cell = $('.fr-button-paramarea', this.$el);
            $Cell.on("click", function (e) { $FRReportViewer.reportViewer('ShowParms') });
            $Cell.addClass("cursor-pointer");
            $Cell = $('.fr-button-nav');
            $Cell.on("click", function (e) { $FRReportViewer.reportViewer('ShowNav') });
            $Cell.addClass("cursor-pointer");
            $Cell = $('.fr-button-reportback');
            $Cell.on("click", function (e) { $FRReportViewer.reportViewer('Back') });
            $Cell.addClass("cursor-pointer");
            $Cell = $('.fr-button-refresh');
            $Cell.on("click", function (e) { $FRReportViewer.reportViewer('RefreshReport') });
            $Cell.addClass("cursor-pointer");
            $Cell = $('.fr-button-firstpage');
            $Cell.on("click", function (e) { $FRReportViewer.reportViewer('NavToPage', 1) });
            $Cell.addClass("cursor-pointer");
            $Cell = $('.fr-button-prev');
            $Cell.on("click", function (e) { $FRReportViewer.reportViewer('NavToPage', $FRReportViewer.reportViewer('getCurPage') - 1) });
            $Cell.addClass("cursor-pointer");

            $Cell = $('.fr-textbox-reportpage');
            $Cell.attr("type", "number")
            $Cell.on("keypress", { input: $Cell }, function (e) { if (e.keyCode == 13) $FRReportViewer.reportViewer('NavToPage', e.data.input.val()) });

            $Cell = $('.fr-button-next');
            $Cell.on("click", function (e) { $FRReportViewer.reportViewer('NavToPage', $FRReportViewer.reportViewer('getCurPage') + 1) });
            $Cell.addClass("cursor-pointer");
            $Cell = $('.fr-button-lastpage');
            $Cell.on("click", function (e) { $FRReportViewer.reportViewer('NavToPage', $FRReportViewer.reportViewer('getNumPages')) });
            $Cell.addClass("cursor-pointer");
        },
        _create: function () {
            var me = this;
            me.element = $("<div class='fr-toolbar' id='ViewerToolbar'><a href='#'><div class='fr-buttonicon fr-button-home'/></a>" +
                           "<div class='fr-buttonicon fr-button-nav'/>" +
                           "<div class='fr-buttonicon fr-button-paramarea'/>" +
                           "<div class='fr-buttonicon fr-button-reportback'/>" +
                           "<div class='fr-buttonicon fr-button-refresh'/>" +
                           "<div class='fr-buttonicon fr-button-firstpage'/>" +
                           "<div class='fr-buttonicon fr-button-prev'/>" +
                           "<input class='fr-textbox fr-textbox-reportpage' />" +
                           "<div class='fr-buttonicon fr-button-next'/>" +
                           "<div class='fr-buttonicon fr-button-lastpage'/>" +
                           "</div>");
        },
    });  // $.widget
});  // function()