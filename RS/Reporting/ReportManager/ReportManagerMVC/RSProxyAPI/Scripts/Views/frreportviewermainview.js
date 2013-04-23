// Assign or create the single globally scoped variable
var g_App = g_App || {};

// Everything inside this function is local unless assigned to a global variable such
// as g_App
(function() {
  // Views
  g_App.FRReportViewerMainView = Backbone.View.extend({
    initialize: function (options) {
        this.path = options.path;
        this.reportServerUrl = options.reportServerUrl;
        _(this).bindAll('render');
    },
    render: function () {
        var data = {};
        $(this.el).html(this.template(data));
        //InitReport("localhost/reportserver_winauth", "/api/ReportViewer", "/RootTest", true, 1, "FRReportViewer1");
        //InitReport(this.reportServerUrl, '/api/ReportViewer', this.path, true, 1, 'pageSection');
        return this;
    },
  });
}());

