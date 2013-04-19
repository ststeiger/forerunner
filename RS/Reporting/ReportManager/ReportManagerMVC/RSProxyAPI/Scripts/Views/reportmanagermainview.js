// Assign or create the single globally scoped variable
var g_App = g_App || {};

// Everything inside this function is local unless assigned to a global variable such
// as g_App
(function() {
  // Views
  g_App.ReportManagerMainView = Backbone.View.extend({
    initialize: function (options) {
        this.model = options.model;
        _(this).bindAll('render');
    },
    render: function () {
        var data = this.model.toJSON();
        $(this.el).html(this.template(data));
        return this;
    },
  });
  
}());

