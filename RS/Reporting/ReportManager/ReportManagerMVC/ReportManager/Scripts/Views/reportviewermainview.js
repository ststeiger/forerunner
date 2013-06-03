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

