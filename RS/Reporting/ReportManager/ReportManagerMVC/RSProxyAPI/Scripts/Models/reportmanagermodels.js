// Assign or create the single globally scoped variable
var g_App = g_App || {};

// Everything inside this function is local unless assigned to a global variable such
// as g_App
(function() {

  var hostname = window.document.location.hostname;
  var urlBase = 'http://' + hostname + ':9000/api/';

  // Models
  g_App.CatalogItem = Backbone.Model.extend({
    url: function() {
      return urlBase + "CatalogItems/" + this.get("id");
    }
  });

  g_App.CatalogItemCollection = Backbone.Collection.extend({
      model: g_App.CatalogItem,
      initialize: function(options) {
        this.path = options.path;
      },
      url: function () {
          if (this.path != null && this.path != "/") {
              return urlBase + "CatalogItems?path=" + this.path;
          } else {
              return urlBase + "CatalogItems";
          }
      }
  });
}());
