// Assign or create the single globally scoped variable
var g_App = g_App || {};

// Everything inside this function is local unless assigned to a global variable such
// as g_App
(function() {
  // Views
  g_App.ReportViewerMainView = Backbone.View.extend({
    initialize: function (options) {
        this.path = options.path;
        _(this).bindAll('render');
    },
    render: function () {
        var data = { url: g_App.configs.reportServerViewer + this.path + '&rs:Command=Render' };
        $(this.el).html(this.template(data));
        return this;
    },
  });
}());

