// Assign or create the single globally scoped variable
var g_App = g_App || {};

// Everything inside this function is local unless assigned to a global variable such
// as g_App
(function() {
  // Views
  g_App.ReportViewerMainView = Backbone.View.extend({
    initialize: function (options) {
    },
    render: function () {
        $(this.el).attr('id', 'FRReportViewer1');
        return this;
    },
  });
}());

