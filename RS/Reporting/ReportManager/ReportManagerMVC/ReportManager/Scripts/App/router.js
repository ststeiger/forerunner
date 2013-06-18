// Assign or create the single globally scoped variable
var g_App = g_App || {};

// Everything inside this function is local unless assigned to a global variable such
// as g_App
var ApplicationRouter = Backbone.Router.extend({
        routes : {
            "": "transitionToReportManager",
            "explore/:path" : "transitionToReportManager",      
            "browse/:path": "transitionToReportViewer",
            "favorite": "transitionToFavorite",
            "recent": "transitionToRecent",
            "test/:arg": "test",
            '*notFound': 'notFound'
        },

        // Application page view
        appPageView : null,

        notFound: function () {
            alert('Not found');
        },

        

        transitionToReportManager: function (path) {
            this._transitionToReportManager(path, null);
        },

        transitionToFavorite: function () {
            this._transitionToReportManager(null, 'favorites');
        },
        transitionToRecent: function () {
            this._transitionToReportManager(null, 'recent');
        },
        _getCatalogItemsUrl: function (path) {
            if (path == null) path = "/";
            return 'ReportManager/GetItems?view=catalog&path=' + path;
        },

        _getViewCatalogItemsUrl: function (view) {
            return 'ReportManager/GetItems?view=' + view + '&path=';
        },

        _selectedItemPath : null,

        _transitionToReportManager: function (path, view) {
            var path0 = path;
            g_App.utils.allowZoom(false);
            $('#footerspacer').attr('style', 'height:0');
            $('#bottomdiv').attr('style', 'height:0');
            if (g_App.utils.isTouchDevice()) {
                $('#headerspacer').attr('style', 'height:35px');
            }            
            if ($('#mainViewPort').position().left != 0) this.appPageView.toggleLeftPane();
            $('#mainViewPort').css({ width: "100%" });

            if (path != null) {
                path = String(path).replace(/%2f/g,"/");
            } else {
                path = "/";
            }
            var appPageModel = new g_App.AppPageModel({
                showBackButton: false,
                pageTitle: path
            });

            var catalogItemUrl = view != null ? this._getViewCatalogItemsUrl (view) : this._getCatalogItemsUrl(path);
            var catalogItemsModel = new g_App.CatalogItemCollection({
                catalogItemsUrl: catalogItemUrl
            });
            this.appPageView.transitionHeader(g_App.ReportManagerHeaderView);
            var me = this;

            $('.fr-image-back', $('#mainSectionHeader')).on('click', function (e, data) {
                me.historyBack();
            });


            $('.fr-button-fav').on("click",
                function (e) {
                    me.transitionToFavorite();
                });

            $('.fr-button-recent').on("click",
                function (e) {
                    me.transitionToRecent();
                });

            catalogItemsModel.fetch({
                success: function (catalogItemsModel, response, options) {
                    me.appPageView.transitionMainSection(appPageModel,
                    g_App.ReportManagerMainView, { model: catalogItemsModel, selectedItemPath: String(me._selectedItemPath).replace(/%2f/g, "/") });
                    me._selectedItemPath = path0;
                },
                error: function (model, response) {
                    console.log(response);
                    alert('Failed to load the catalogs from the server.  Please try again.');
                }
            });
        },

        transitionToReportViewer: function (path) {
            var me = this;
            me._selectedItemPath = null;

            g_App.utils.allowZoom(true);
            $('#footerspacer').attr('style', 'height: 150px');
            $('#bottomdiv').attr('style', 'height: 150px;display: none;');
            //if (g_App.utils.isTouchDevice()) {
            //    $('#headerspacer').attr('style', 'height: 0px');
            //}
            $('#headerspacer').attr('style', 'height: 50px');
            if (path != null) {
                path = String(path).replace(/%2f/g, "/");
            } else {
                path = "/";
            }
            var appPageModel = new g_App.AppPageModel({
                showBackButton: true,
                pageTitle: 'ReportViewer',
            });

            me.appPageView.transitionMainSection(appPageModel, 
                g_App.ReportViewerMainView, { path: path, reportServerUrl: g_App.configs.reportServerUrl });

            var $viewer = $('#FRReportViewer1');
            $viewer.reportViewer({
                ReportServerURL: g_App.configs.reportServerUrl,
                ReportViewerAPI: g_App.configs.reportControllerBase,
                ReportPath: path,
                PageNum: 1,
            });

            // Create / render the toolbar
            var $toolbar = $('#mainSectionHeader');
            $toolbar.toolbar({ $reportViewer: $viewer });
            var btnHome = {
                toolType: 0,
                selectorClass: 'fr-button-home',
                imageClass: 'fr-image-home',
                click: function (e) {
                    window.location.href = "#";
                }
            };
            $toolbar.toolbar('addTools', 2, true, [btnHome]);

            var btnFav = {
                toolType: 0,
                selectorClass: 'fr-button-update-fav',
                imageClass: 'fr-image-delFav',
                click: function (e) {
                    var action;
                    var $img = $(e.target);
                    if (!$img.hasClass('fr-tool-icon'))
                        $img = $img.find('.fr-tool-icon');

                    if ($img.hasClass('fr-image-delFav'))
                        action = "delete";
                    else
                        action = "add";
                    
                    $.getJSON("./api/ReportManager/UpdateView", {
                        view: "favorites",
                        action: action,
                        path: path
                    }).done(function (Data) {
                        if (action == "add") {
                            $img.addClass('fr-image-delFav');
                            $img.removeClass('fr-image-addFav');
                        }
                        else {
                            $img.removeClass('fr-image-delFav');
                            $img.addClass('fr-image-addFav');
                        }
                     })
                    .fail(function () { alert("Failed") });
                }
            };
            $toolbar.toolbar('addTools', 12, true, [btnFav]);

            // Let the report viewer know the height of the toolbar
            $viewer.reportViewer('option', 'ToolbarHeight', this.toolbarHeight());

            // Create / render the menu pane
            var $toolPane = $('#leftPane').toolpane({ $reportViewer: $viewer });
            var itemHome = {
                toolType: 4,
                selectorClass: 'fr-id-home',
                imageClass: 'fr-image-home',
                text: 'Home',
                click: function (e) {
                    window.location.href = "#";
                }
            };
            $toolPane.toolpane('addTools', 8, true, [itemHome]);

            var itemFav = {
                toolType: 4,
                selectorClass: 'fr-item-update-fav',
                imageClass: 'fr-image-delFav',
                text: 'Favorites',
                click: function (e) {
                    var action;
                    var $img = $(e.target);
                    if (!$img.hasClass('fr-tool-icon'))
                        $img = $img.find('.fr-tool-icon');

                    if ($img.hasClass('fr-image-delFav'))
                        action = "delete";
                    else
                        action = "add";
                    e.data.me._trigger('actionstarted', null, e.data.me.tools['fr-item-update-fav']);
                    $.getJSON("./api/ReportManager/UpdateView", {
                        view: "favorites",
                        action: action,
                        path: path
                    }).done(function (Data) {                       

                        if (action == "add") {
                            $img.addClass('fr-image-delFav');
                            $img.removeClass('fr-image-addFav');
                        }
                        else {
                            $img.removeClass('fr-image-delFav');
                            $img.addClass('fr-image-addFav');
                        }
                    })
                    .fail(function () { alert("Failed") });
                }
            };
            $toolPane.toolpane('addTools', 10, true, [itemFav]);

            $('#bottomdiv').pagenav({$reportViewer: $viewer  });
            $viewer.on('reportviewerback', function (e, data) {
                me._selectedItemPath = data.path;
                me.historyBack();
            });
            $viewer.reportViewer('option', 'PageNav', $('#bottomdiv'));
            me.setFavoriteState(path, $toolbar);
            me.appPageView.bindEvents();
        },

        setFavoriteState: function (path, toolbar) {
            var me = this;
            $.ajax({
                url: './api/ReportManager/isFavorite?path=' + path,
                dataType: 'json',
                async: true,                
                success: function (data) {
                    $tb = $(toolbar).find('.fr-button-Fav').find("div");
                    if (data.IsFavorite) {
                        $tb.addClass('fr-image-delFav');
                        $tb.removeClass('fr-image-addFav');
                    }
                    else {
                        $tb.removeClass('fr-image-delFav');
                        $tb.addClass('fr-image-addFav');
                    }
                },
                fail: function () {
                    toolbar.find('.fr-button-Fav').hide();
                }
            });
           
        },
       
        toolbarHeight : function() {
            return $("#topdiv").outerHeight();
        },

        historyBack: function () {
            g_App.router.back();
        },
    
        showModalView: function(appPageModel, views, subfolder, modalViewType, options) {
            // First load the subordinate view templates, everything else will happen in the callback
            var me = this;
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
        }
    });

// This call essential starts the application. It will Load the initial Application Page View
// and then start the Backbone Router processing (I.e., g_App.router)
$(document).ready(g_App.utils.loadTemplate(['AppPageView'], '', function () {
    // Create the application Router 
    g_App.router = new ApplicationRouter();
    Backbone.history.length = 0;
    Backbone.history.on('route', function () { ++this.length; });
    g_App.router.back = function () {
        Backbone.history.length -= 2;
        window.history.back();
    };
    Backbone.history.start();
}));

