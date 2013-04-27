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

        var catalogitems = this.model.models;
        var len = catalogitems.length;

        for (var i = 0; i < len; i++) {
            $('.flow', this.el).append(new g_App.CatalogItemView({ model: catalogitems[i] }).render().el.children[0]);
        }

        var CF = new ContentFlow(this.el.children[0], {startItem: 0}, false);
        CF._init();
        return this;
    },
  });
  
  g_App.CatalogItemView = Backbone.View.extend({
      initialize: function () {
          this.model.bind("change", this.render, this);
          this.model.bind("destroy", this.close, this);
      },

      render: function () {
          var data = this.model.toJSON();
          data.EncodedPath = String(data.Path).replace(/\//g, "%2f");
          data.ReportThumbnailPath = this.model.viewerUrl()
            + 'GetThumbnail/?ReportServerURL=' +this.model.reportServerUrl() + '&ReportPath='
            + data.Path + '&SessionID=&PageNumber=1&PageHeight=1in&PageWidth=1in'
          $(this.el).html(this.template(data));
          return this;
      }
  });
}());

