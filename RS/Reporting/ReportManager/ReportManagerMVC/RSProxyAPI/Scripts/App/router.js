// Assign or create the single globally scoped variable
var g_App = g_App || {};

// Everything inside this function is local unless assigned to a global variable such
// as g_App
var ApplicationRouter = Backbone.Router.extend({
        routes : {
            "": "transitionToReportManager",
            "explore/:path" : "transitionToReportManager",      
            "browse/:path": "transitionToReportViewer",
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
            $('#footerspacer').attr('style', 'height:0');
            $('#bottomdiv').attr('style', 'height:0');
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
                        // Initialize the carousel
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
                    },
                    error: function (model, response) {
                        console.log(response);
                        alert('Failed to load the catalogs from the server.  Please try again.');
                    }
                });
        },

        transitionToReportViewer: function (path) {
            $('#footerspacer').attr('style', 'height: 150px');
            $('#bottomdiv').attr('style', 'height: 150px');
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
                'ReportViewerMainView'], '',
                g_App.ReportViewerMainView, { path: path, reportServerUrl: g_App.configs.reportServerUrl });
            InitReportEx(g_App.configs.reportServerUrl, g_App.configs.reportControllerBase, path, true, 1, 'FRReportViewer1', 'HeaderArea', 'bottomdiv', this.toolbarHeight);
        },

        toolbarHeight : function()
        {
            return $("#topdiv").outerHeight();
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
g_App.utils.loadTemplate(['AppPageView', 'ReportManagerMainView', 'CatalogItemView', 'ReportViewerMainView'], '', function () {
    // Create the application Router 
    g_App.router = new ApplicationRouter();
    Backbone.history.start();
});

