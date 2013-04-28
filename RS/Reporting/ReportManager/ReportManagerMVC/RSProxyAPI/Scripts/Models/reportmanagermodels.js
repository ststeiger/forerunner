// Assign or create the single globally scoped variable
var g_App = g_App || {};

// Everything inside this function is local unless assigned to a global variable such
// as g_App
(function() {
  var urlBase = g_App.configs.apiBase;
  var reportServerUrl = 'localhost' + ':8080/reportserver';

  // Models
  g_App.CatalogItem = Backbone.Model.extend({
    url: function() {
      return urlBase + 'CatalogItems/' + this.get('id');
    },
    viewerUrl : function() {
      return urlBase + 'ReportViewer/';
    },
    reportServerUrl: function () {
      return g_App.configs.reportServerUrl;
    }
  });

  g_App.CatalogItemCollection = Backbone.Collection.extend({
    model: g_App.CatalogItem,
    initialize: function(options) {
      this.path = options.path;
    },
    url: function () {
      if (this.path != null && this.path != '/') {
          return urlBase + 'CatalogItems?path=' + this.path + '&isRecursive=false';
      } else {
          return urlBase + 'CatalogItems?isRecursive=false';
      }
    }
  });
}());
