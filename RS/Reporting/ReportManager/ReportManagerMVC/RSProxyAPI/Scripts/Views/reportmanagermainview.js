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
            $('.sky-carousel-container', this.el).append(new g_App.CatalogItemView({ model: catalogitems[i] }).render().el.children[0]);
            $('.rm-list-container', this.el).append(new g_App.CatalogItemView({ model: catalogitems[i] }).render().el.children[0]);
        }

        return this;
    },
    sectionHeader: function () {
        if (this.model.path == '/') return 'Home';
        return 'Home' + this.model.path;
    }
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
            + data.Path + '&SessionID=&PageNumber=1&PageHeight=8in&PageWidth=11in'
          $(this.el).html(this.template(data));
          return this;
      }
  });
}());

