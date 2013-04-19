// Assign or create the single globally scoped variable
var g_App = g_App || {};

// This call essential starts the application. It will Load the initial Application Page View
// and then start the Backbone Router processing (I.e., g_App.router)
g_App.utils.loadTemplate(['AppPageView','ReportManagerMainView'], '', function() {  
  // Create the application Router 
  g_App.router = new ApplicationRouter();
  Backbone.history.start();
});

// Everything inside this function is local unless assigned to a global variable such
// as g_App
(function() {
  ApplicationRouter = Backbone.Router.extend({
    routes : {
      "" : "transitionToReportManager",
      "ReportManager/:path" : "transitionToReportManager",      
      "ReportViewer/:path" : "transitionToReportViewer",
    },

    // Application page view
    appPageView : null,

    transitionToReportManager: function (path) {
      var appPageModel = new g_App.AppPageModel({
        showBackButton: false,
        pageTitle : 'ReportManager',
      });
      var catalogItemsModel = new g_App.CatalogItemCollection({
        path: path
      });
      this.appPageView.transitionMainSection(appPageModel, [
          'ReportManagerMainView'], '',
          g_App.ReportManagerMainView, { model: catalogItemsModel });
    },

    transitionToReportViewer: function (path) {
      var appPageModel = new g_App.AppPageModel({
        showBackButton : true,
        pageTitle : 'ReportViewer',
      });
      this.appPageView.transitionMainSection(appPageModel, [
          'ReportViewerMainView'], '',
          g_App.ReportViewerMainView, {reportPath : path});
    },
    
    showModalView: function(appPageModel, views, subfolder, modalViewType, options) {
      // First load the subordinate view templates, everything else will happen in the callback
      var thisObj = this;
      g_App.utils.loadTemplate(views, subfolder, function() {
        var modalView = new modalViewType(options).render();
        $('#modalViewContainer').append(modalView.el);
        $('#modalViewContainer').show();
      });
    },
    
    removeModalView: function() {
      $('#modalViewContainer>div').remove();
      $('#modalViewContainer').hide();
    },

    initialize : function() {
      // Create the application page framework; specifically the header, main section and footer.
      // Then attach it to the page. The application page sections will be shared by all pages.
      var appPageModel = new g_App.AppPageModel({});
      this.appPageView = new g_App.AppPageView({
        model : appPageModel
      }).render();
      $("#pageSection").append(this.appPageView.el);
    }
  });

}());
