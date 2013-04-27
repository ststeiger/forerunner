// Assign or create the single globally scoped variable
var g_App = g_App || {};

// Everything inside this function is local unless assigned to a global variable such
// as g_App
var ApplicationRouter = Backbone.Router.extend({
        routes : {
            "": "transitionToReportManager",
            "explore/:path" : "transitionToReportManager",      
            "browse/:path": "transitionToFRReportViewer",
            "test/:arg": "test",
            '*notFound': 'notFound'
        },

        // Application page view
        appPageView : null,

        test: function (arg) {
            alert('I am here');
            alert(arg);
        },

        notFound: function () {
            alert('Not found');
        },

        transitionToReportManager: function (path) {
            if (path != null) {
                path = String(path).replace(/%2f/g,"/");
            } else {
                path = "/";
            }
            var appPageModel = new g_App.AppPageModel({
                showBackButton: false,
                pageTitle: path
            });
            var catalogItemsModel = new g_App.CatalogItemCollection({
                path: path
            });
            var thisObj = this;
            catalogItemsModel.fetch(
                {
                    success: function (catalogItemsModel, response, options) {
                        thisObj.appPageView.transitionMainSection(appPageModel, [
                        'ReportManagerMainView'], '',
                        g_App.ReportManagerMainView, { model: catalogItemsModel });
                    },
                    error: function (model, response) {
                        console.log(response);
                        alert('Failed to load the catalogs from the server.  Please try again.');
                    }
                });
        },

        transitionToReportViewer: function (path) {
            if (path != null) {
                path = String(path).replace(/%2f/g, "/");
            } else {
                path = "/";
            }
            var appPageModel = new g_App.AppPageModel({
                showBackButton : true,
                pageTitle : 'ReportViewer',
            });
            this.appPageView.transitionMainSection(appPageModel, [
                'ReportViewerMainView'], '',
                g_App.ReportViewerMainView, {path: path});
        },

        transitionToFRReportViewer: function (path) {
            if (path != null) {
                path = String(path).replace(/%2f/g, "/");
            } else {
                path = "/";
            }
            var appPageModel = new g_App.AppPageModel({
                showBackButton: true,
                pageTitle: 'ReportViewer',
            });
            this.appPageView.transitionMainSection(appPageModel, [
                'FRReportViewerMainView'], '',
                g_App.FRReportViewerMainView, { path: path, reportServerUrl: g_App.configs.reportServerUrl });
            InitReportEx(g_App.configs.reportServerUrl, g_App.configs.reportControllerBase, path, true, 1, 'FRReportViewer1', 'HeaderArea');
                g_App.FRReportViewerMainView, { path: path, reportServerUrl: 'localhost:8080/ReportServer/' });
            InitReport('localhost:8080/ReportServer/', '/api/ReportViewer', path, true, 1, 'FRReportViewer1');
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

// This call essential starts the application. It will Load the initial Application Page View
// and then start the Backbone Router processing (I.e., g_App.router)
g_App.utils.loadTemplate(['AppPageView', 'ReportManagerMainView', 'CatalogItemView', 'ReportViewerMainView', 'FRReportViewerMainView'], '', function () {
    // Create the application Router 
    g_App.router = new ApplicationRouter();
    Backbone.history.start();
});

