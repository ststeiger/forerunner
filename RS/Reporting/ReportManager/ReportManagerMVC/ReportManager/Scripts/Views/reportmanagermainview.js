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
    },
    postRender: function () {
        $('#browse-carousel').carousel({
            itemWidth: 250,
            itemHeight: 350,
            distance: 15,
            selectedItemDistance: 50,
            selectedItemZoomFactor: 1,
            unselectedItemZoomFactor: 0.67,
            unselectedItemAlpha: 0.6,
            motionStartDistance: 250,
            topMargin: 80,
            gradientStartPoint: 0.35,
            gradientOverlayColor: "#f5f5f5",
            gradientOverlaySize: 200,
            reflectionDistance: 1,
            reflectionAlpha: 0.35,
            reflectionVisible: true,
            reflectionSize: 70,
            selectByClick: true
        });
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
          data.HasParameters = (String(data.Path).indexOf("Parameter") != -1) ? 1 : 0;
          data.ReportThumbnailPath = this.model.viewerUrl()
            + 'GetThumbnail/?ReportServerURL=' +this.model.reportServerUrl() + '&ReportPath='
            + data.Path + '&SessionID=&PageNumber=1&maxHeightToWidthRatio=1.1'
          $(this.el).html(this.template(data));
          return this;
      }
  });
}());

