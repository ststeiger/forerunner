// Assign or create the globally scoped variables
var g_App = g_App || {};
var forerunner = forerunner || {};

// Forerunner SQL Server Reports
forerunner.ssr = forerunner.ssr || {};

// Everything inside this function is local unless assigned to a global variable such
// as g_App
var ApplicationRouter = Backbone.Router.extend({
        routes : {
            "": "transitionToReportManager",
            "explore/:path" : "transitionToReportManager",      
            "browse/:path": "transitionToReportViewer",
            "view/:args": "transitionToReportViewerWithRSURLAccess",
            "open/:path": "transitionToOpenResource",
            "search/:keyword": "transitionToSearch",
            "favorites": "transitionToFavorites",
            "recent": "transitionToRecent",
            "test/:arg": "test",
            "*notFound": "notFound"
        },

        // Application page view
        appPageView : null,

        notFound: function () {
            alert("Not found");
        },

        transitionToReportManager: function (path) {
            this._transitionToReportManager(path, null);
        },

        transitionToFavorites: function () {
            this._transitionToReportManager(null, "favorites");
        },
        transitionToRecent: function () {
            this._transitionToReportManager(null, "recent");
        },
        
        //_selectedItemPath : null,

        _transitionToReportManager: function (path, view) {
            forerunner.device.allowZoom(false);
            $("body").reportExplorerEZ("transitionToReportManager", path, view);
            $("html").addClass("fr-Explorer-background");
        },

        _lastAction : null,
        navigateTo: function (action, path) {
            if (path !== null) path = String(path).replace(/%2f/g, "/");
            if (action === "home") {
                g_App.router.navigate("#", { trigger: true, replace: false });
            } else if (action === "back") {
                g_App.router.back();
            } else if (action === "favorites") {
                g_App.router.navigate("#favorites", { trigger: true, replace: false });
            } else if (action === "recent") {
                g_App.router.navigate("#recent", { trigger: true, replace: false });
            } else {
                var encodedPath = String(path).replace(/\//g, "%2f");
                var targetUrl = "#" + action + "/" + encodedPath;
                // Do not trigger for Firefox when we are changing the anchor
                var trigger = !forerunner.device.isFirefox() || this._lastAction === action || !this._lastAction;
                g_App.router.navigate(targetUrl, { trigger: trigger, replace: false });
            }
            this._lastAction = action;
        },

        transitionToOpenResource: function (path) {
            forerunner.device.allowZoom(false);
            $("body").reportExplorerEZ("transitionToReportManager", path, "resource");
            $("html").addClass("fr-Explorer-background");
        },

        transitionToSearch: function (keyword) {
            forerunner.device.allowZoom(false);
            $("body").reportExplorerEZ("transitionToReportManager", keyword, "search");
            $("html").addClass("fr-Explorer-background");
        },

        transitionToReportViewer: function (path) {
            var parts = path.split("?");
            path = parts[0];
            var params = parts.length > 1 ? forerunner.ssr._internal.getParametersFromUrl(parts[1]) : null;
            if (params) params = JSON.stringify({ "ParamsList": params });
            $("body").reportExplorerEZ("transitionToReportViewer", path, params);
            $("html").removeClass("fr-Explorer-background");
        },

        transitionToReportViewerWithRSURLAccess: function (args) {
            var startParam = args.indexOf("&");
            var path = startParam > 0 ? args.substring(1, startParam) : args;
            
            var params = startParam > 0 ? args.substring(startParam + 1) : null;
            if (params) params = params.length > 0 ? forerunner.ssr._internal.getParametersFromUrl(params) : null;
            if (params) params = JSON.stringify({ "ParamsList": params });
            $("body").reportExplorerEZ("transitionToReportViewer", path, params);
            $("html").removeClass("fr-Explorer-background");
        },

        toolbarHeight : function() {
            return $("#topdiv").outerHeight();
        },

        historyBack: function () {
            g_App.router.back();
        },
    
        initialize: function () {
            var explorerSettings = forerunner.config.getCustomSettings();

            var isAdmin = false;
            if (window.location.pathname.toLowerCase().indexOf("/admin") >= 0)
                isAdmin = true;

            this.explorer = $("body").reportExplorerEZ({
                navigateTo: this.navigateTo,
                historyBack: this.historyBack,
                explorerSettings: explorerSettings,
                isAdmin:isAdmin,
            });
        }
    });

// This call essential starts the application. It will Load the initial Application Page View
// and then start the Backbone Router processing (I.e., g_App.router)
$(document).ready(function () {
    // Create the application Router 
    g_App.router = new ApplicationRouter();
    Backbone.history.length = 0;
    Backbone.history.on("route", function () { ++this.length; });
    g_App.router.back = function () {
        Backbone.history.length -= 2;
        window.history.back();
    };
    Backbone.history.start();
});

