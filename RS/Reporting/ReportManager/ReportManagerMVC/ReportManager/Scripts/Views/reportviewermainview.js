// Assign or create the single globally scoped variable
var g_App = g_App || {};

// Everything inside this function is local unless assigned to a global variable such
// as g_App
(function() {
  // Views
  g_App.ReportViewerHeaderView = Backbone.View.extend({
    initialize: function () {
        _(this).bindAll('render');
    },
    render: function () {
        $(this.el).html(this.template(null));
        return this;
    },
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

        $Cell = $(".fr-button-documentmap");
        $Cell.on("click", function (e) { $FRReportViewer.reportViewer("ShowDocMap") });
        $Cell.addClass("cursor-pointer");
    },

  });
  g_App.ReportViewerMainView = Backbone.View.extend({
    initialize: function (options) {
        this.path = options.path;
        this.reportServerUrl = options.reportServerUrl;
        _(this).bindAll('render');
    },
    render: function () {
        var data = {};
        $(this.el).html(this.template(data));
        return this;
    },
  });
}());

