// Assign or create the single globally scoped variable
var g_App = g_App || {};

// Everything inside this function is local unless assigned to a global variable such
// as g_App
(function () {
  g_App.ReportManagerHeaderView = Backbone.View.extend({
      initialize: function () {
          _(this).bindAll('render');
      },
      render: function () {
          $(this.el).html(this.template(null));
          return this;
      },
  });
  // Views
  g_App.ReportManagerMainView = Backbone.View.extend({
    initialize: function (options) {
        this.options = options;
        _(this).bindAll('render');
    },
    render: function () {
        $(this.el).reportexplorer({
            path: this.options.path,
            catalogItems: this.options.model.toJSON(),
            url: this.options.model.models[0].url(),
            selectedItemPath: this.options.selectedItemPath,
            navigateTo: this.navigateTo
        });

        return this;
    },
    postRender: function () {
        $(this.el).reportexplorer('initCarousel');
    },
    navigateTo: function (action, path) {
        var encodedPath = String(path).replace(/\//g, "%2f");
        var targetUrl = '#' + action + '/' + encodedPath;
        g_App.router.navigate(targetUrl, { trigger: true, replace: false });
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
          data.ReportThumbnailPath = this.model.url()
            + 'GetThumbnail/?ReportPath=' + data.Path 
          $(this.el).html(this.template(data));
          return this;
      }
  });
}());

