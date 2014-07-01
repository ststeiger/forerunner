///#source 1 1 /Forerunner/Common/js/History.js
/**
 * @file
 *  Defines the forerunner router and history widgets
 *
 *  This code was converted from the Backbone.js fragments. The Event
 *  handling specific to Backbone was re-written to use jquery event
 *  support as well as to remove any / all underlying undecore.js and
 *  Backbone.js dependencies (E.g., Events).
 */

var forerunner = forerunner || {};
forerunner.ssr = forerunner.ssr || {};

$(function () {
    var widgets = forerunner.ssr.constants.widgets;
    var events = forerunner.ssr.constants.events;

    // ---------------------------
    // Underscore.js 1.4.3
    var isFunction = function (obj) {
        return typeof obj === "function";
    };

    var isRegExp = function (obj) {
        return "[object RegExp]" === Object.prototype.toString.call(obj);
    };

    // If the value of the named property is a function then invoke it;
    // otherwise, return it.
    var result = function (object, property) {
        if (object == null) return null;
        var value = object[property];
        return isFunction(value) ? value.call(object) : value;
    };

    // Shortcut function for checking if an object has a given property directly
    // on itself (in other words, not on a prototype).
    has = function (obj, key) {
        return Object.hasOwnProperty.call(obj, key);
    };

    // Keep the identity function around for default iterators.
    var identity = function (value) {
        return value;
    };

    // Establish the object that gets returned to break out of a loop iteration.
    var breaker = {};

    // Save bytes in the minified (but not gzipped) version:
    var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

    // Determine if at least one element in the object matches a truth test.
    // Delegates to **ECMAScript 5**'s native `some` if available.
    // Aliased as `any`.
    var nativeSome = ArrayProto.some;
    var any = function (obj, predicate, context) {
        predicate || (predicate = identity);
        var result = false;
        if (obj == null) return result;
        if (nativeSome && obj.some === nativeSome) return obj.some(predicate, context);
        $.each(obj, function (index, value) {
            if (result || (result = predicate.call(context, value, index, obj))) return breaker;
        });
        return !!result;
    };

    // Return the results of applying the iterator to each element.
    // Delegates to **ECMAScript 5**'s native `map` if available.
    var nativeMap = ArrayProto.map;
    var map = collect = function (obj, iterator, context) {
        var results = [];
        if (obj == null) return results;
        if (nativeMap && obj.map === nativeMap) return obj.map(iterator, context);
        $.each(obj, function (index, value) {
            results.push(iterator.call(context, value, index, obj));
        });
        return results;
    };



    // Retrieve the names of an object's properties.
    // Delegates to **ECMAScript 5**'s native `Object.keys`
    var nativeKeys = Object.keys;
    var keys = nativeKeys || function (obj) {
        if (obj !== Object(obj)) throw new TypeError('Invalid object');
        var keysArray = [];
        for (var key in obj) if (has(obj, key)) keysArray[keysArray.length] = key;
        return keysArray;
    };

    var slice = Array.prototype.slice;
    var splice = Array.prototype.splice;

    // Underscore.js 1.4.3
    // ---------------------------

    // ---------------------------
    // Adapted from backbone.js 1.1.2

    // Cached regular expressions for matching named param parts and splatted
    // parts of route strings.
    var optionalParam = /\((.*?)\)/g;
    var namedParam = /(\(\?)?:\w+/g;
    var splatParam = /\*\w+/g;
    var escapeRegExp = /[\-{}\[\]+?.,\\\^$|#\s]/g;

    /**
     * The router widget is used to provide methods for routing client-side pages,
     * and connecting them to actions and events. It works in concert with the 
     * forerunner.history widget.
     *
     * @namespace $.forerunner.router
     * @prop {Object} options - The options for router
     * @prop {String} options.routes - hash of routes.
     * @example
     *  //
     *  // Callback Router Example
     *  var router = $({}).router({
     *      routes: {
     *          "": "home",
     *          "home": "home",
     *          "favorites": "favorites",
     *          "browse/:path": "browse"
     *      },
     *      home: function () {
     *          // Your code goes here
     *      },
     *      favorites: function () {
     *          // Your code goes here
     *      },
     *      browse: function (path) {
     *          // Your code goes here
     *      },
     *  });
     *
     *  //
     *  // Event Router Example
     *  var EventRouter = $({}).router({
     *      routes: {
     *          "": "home",
     *          "home": "home",
     *          "favorites": "favorites",
     *          "browse/:path": "browse"
     *      },
     *  });
     * 
     *  // Hook up to the router events
     *  var onRoute = function (event, data) {
     *      if (data.name === "home") {
     *          // Your code goes here
     *      } else if (data.name === "favorites") {
     *          // Your code goes here
     *      } else if (data.name === "browse") {
     *          // Your code goes here
     *      }
     *  }
     *
     *  // Hook up the onRoute handler to the route event
     *  router.on(events.routerRoute(), onRoute);
     *
     * Notes:
     *  - The callback functions are defined as members of the options
     */
    $.widget(widgets.getFullname(widgets.router), {
        options: {
            routes: {}
        },
        _create: function () {
            var me = this;
            if (me.options.routes) {
                me.routes = me.options.routes;
            }
            me._bindRoutes();
        },
        _init: function () {
        },
        /**
         * Manually create a route for the router/
         *
         * @function $.forerunner.router#route
         *
         * @param {String} route - routing string or regular expression
         * @param {String} name - Used as the callback function name and / or a
         *                        property of the data object passed to the route
         *                        event.
         * @param {String} callback - function to call when a route is matched if
         *                            callback is ommitted me[name] will be used
         * @example
         * 
         * The routes hash maps URLs with parameters to functions on your router (or just
         * direct function definitions, if you prefer). Routes can contain parameter parts,
         * :param, which match a single URL component between slashes; and splat parts *splat,
         * which can match any number of URL components.
         *
         * Part of a route can be made optional by surrounding it in parentheses (/:optional). 
         * For example, a route of "search/:query/p:page" will match a fragment of 
         * #search/obama/p2, passing "obama" and "2" to the action. A route of "file/*path" will
         * match #file/nested/folder/file.txt, passing "nested/folder/file.txt" to the action. 
         * A route of "docs/:section(/:subsection)" will match #docs/faq and #docs/faq/installing,
         * passing "faq" to the action in the first case, and passing "faq" and "installing" to the
         * action in the second. 
         *
         * Trailing slashes are treated as part of the URL, and (correctly) treated as a unique route
         * when accessed. docs and docs/ will fire different callbacks. If you can't avoid generating
         * both types of URLs, you can define a "docs(/)" matcher to capture both cases. 
         * 
         * When the visitor presses the back button, or enters a URL, and a particular route is matched,
         * the name of the action will be fired as an event, so that other objects can listen to the
         * router, and be notified. In the following example, visiting #help/uploading will fire a
         * forerunner.ssr.constants.events.routerRoute() event from the router. 
         *
         * routes: {
         *   "help/:page":         "help",
         *   "download/*path":     "download",
         *   "folder/:name":       "openFolder",
         *   "folder/:name-:mode": "openFolder"
         * }
         * 
         * router.on(forerunner.ssr.constants.events.routerRoute(), function(data) {
         *  // Where:
         *  //  data.name = "help"
         *  //  data.args[0] = "uploading"
         * });
         *
         * // You can also hook routes on the history object as follows
         * forerunner.history.on(events.historyRoute(), onRoute);
         */
        route: function (route, name, callback) {
            var me = this;
            if (!isRegExp(route)) {
                route = me._routeToRegExp(route);
            }
            if (isFunction(name)) {
                callback = name;
                name = '';
            }
            if (!callback) {
                callback = me.options[name];
            }
            forerunner.history.history("route", route, function (fragment) {
                var args = me._extractParameters(route, fragment);
                me._execute(callback, args);
                me._trigger(events.route, null, { name: name, args: args });
                forerunner.history.history("triggerRoute", { route: me, name: name, args: args });
            });
            return me;
        },

        // Execute a route handler with the provided parameters.  This is an
        // excellent place to do pre-route setup or post-route cleanup.
        _execute: function (callback, args) {
            if (callback) callback.apply(this, args);
        },

        /**
         * Updates the URL. If you wish to also call the route function, set the
         * trigger option to true. To update the URL without creating an entry in
         * the browser's history, set the replace option to true.
         *
         * @function $.forerunner.router#navigate
         *
         * @param {String} fragment - URL fragment
         * @param {Object} options - Navigation options
         */
        navigate: function (fragment, options) {
            forerunner.history.history("navigate", fragment, options);
            return this;
        },

        // Bind all defined routes to `Backbone.history`. We have to reverse the
        // order of the routes here to support behavior where the most general
        // routes can be defined at the bottom of the route map.
        _bindRoutes: function () {
            if (!this.routes) return;
            this.routes = result(this, 'routes');
            var route, routes = keys(this.routes);
            while ((route = routes.pop()) != null) {
                this.route(route, this.routes[route]);
            }
        },

        // Convert a route string into a regular expression, suitable for matching
        // against the current location hash.
        _routeToRegExp: function (route) {
            route = route.replace(escapeRegExp, '\\$&')
                         .replace(optionalParam, '(?:$1)?')
                         .replace(namedParam, function (match, optional) {
                             return optional ? match : '([^/?]+)';
                         })
                         .replace(splatParam, '([^?]*?)');
            return new RegExp('^' + route + '(?:\\?([\\s\\S]*))?$');
        },

        // Given a route, and a URL fragment that it matches, return the array of
        // extracted decoded parameters. Empty or unmatched parameters will be
        // treated as `null` to normalize cross-browser behavior.
        _extractParameters: function (route, fragment) {
            var params = route.exec(fragment).slice(1);
            return map(params, function (param, i) {
                // Don't decode the search params.
                if (i === params.length - 1) return param || null;
                return param ? decodeURIComponent(param) : null;
            });
        }
    });  // $.widget router

    // Cached regex for stripping a leading hash/slash and trailing space.
    var routeStripper = /^[#\/]|\s+$/g;

    // Cached regex for stripping leading and trailing slashes.
    var rootStripper = /^\/+|\/+$/g;

    // Cached regex for detecting MSIE.
    var isExplorer = /msie [\w.]+/;

    // Cached regex for removing a trailing slash.
    var trailingSlash = /\/$/;

    // Cached regex for stripping urls of hash.
    var pathStripper = /#.*$/;

    // Has the history handling already been started?
    var historyStarted = false;

    /**
     * The history widget is a singleton widget accessed via the reference
     * forerunner.history.
     *
     * @namespace $.forerunner.history
     *
     * @example
     *      forerunner.history.history("start");
     *
     * Notes:
     *  - history is adapted from backbone.js 1.1.2 but it is packaged as a widget
     *    and all backbone and underscore dependencies have been removed.
     *  - history has been designed and tested to peacefully co-exist with
     *    Backbone.history
     *  - You shouldn't ever have to create this widget
     *  - pushState support exists on a purely opt-in basis. See the options
     *    above. Older browsers that don't support pushState will continue to
     *    use hash-based URL fragments, and if a hash URL is visited by a
     *    pushState-capable browser, it will be transparently upgraded to the
     *    true URL. Note that using real URLs requires your web server to be
     *    able to correctly render those pages, so back-end changes are required
     *    as well. For example, if you have a route of /documents/100, your web
     *    server must be able to serve that page, if the browser visits that URL
     *    directly. For full search-engine crawlability, it's best to have the
     *    server generate the complete HTML for the page ... but if it's a web
     *    application, just rendering the same content you would have for the root
     *    URL, and filling in the rest with Backbone Views and JavaScript works fine. 
     */
    $.widget(widgets.getFullname(widgets.history), {
        options: {
        },
        _create: function () {
            var me = this;
            this.handlers = [];
        },
        _init: function () {
            // Ensure that `History` can be used outside of the browser.
            if (typeof window !== 'undefined') {
                this.location = window.location;
                this.history = window.history;
            }
        },
        /**
         * Returns true if forerunner.history has been started
         *
         * @function $.forerunner.history#isStarted
         */
        isStarted: function () {
            return historyStarted;
        },
        // The default interval to poll for hash changes, if necessary, is
        // twenty times a second.
        _interval: 50,

        // Are we at the app root?
        atRoot: function () {
            return this.location.pathname.replace(/[^\/]$/, '$&/') === this.root;
        },

        // Gets the true hash value. Cannot use location.hash directly due to bug
        // in Firefox where location.hash will always be decoded.
        getHash: function (window) {
            var match = (window || this).location.href.match(/#(.*)$/);
            return match ? match[1] : '';
        },

        // Get the cross-browser normalized URL fragment, either from the URL,
        // the hash, or the override.
        getFragment: function (fragment, forcePushState) {
            if (fragment == null) {
                if (this._hasPushState || !this._wantsHashChange || forcePushState) {
                    fragment = decodeURI(this.location.pathname + this.location.search);
                    var root = this.root.replace(trailingSlash, '');
                    if (!fragment.indexOf(root)) fragment = fragment.slice(root.length);
                } else {
                    fragment = this.getHash();
                }
            }
            return fragment.replace(routeStripper, '');
        },

        triggerRoute: function (data) {
            this._trigger(events.route, null, data);
        },

        /**
         * Starts monitoring hashChanged events and triggers all registered routes and / or
         * callbacks
         *
         * @function $.forerunner.history#start
         *
         * @param {Object} options - Start options
         * @prop {Object} options - The options for router
         * @prop {Bool} options.pushState - True indicates you would like to use
         *                                  pushState support in your application
         * @prop {String} options.root - If your application is not being served
         *                               from the root url / of your domain, use
         *                               this parameter.
         * @prop {String} options.silent - True indicates to not trigger the initial
         *                                 route when starting up.
         * @example
         *  forerunner.history.history("start");
         *
         *  Notes:
         *  To indicate that you'd like to use HTML5 pushState support in your application,
         *  use Backbone.history.start({pushState: true}). If you'd like to use pushState,
         *  but have browsers that don't support it natively use full page refreshes
         *  instead, you can add {hashChange: false} to the options. 
         *
         *  If your application is not being served from the root url / of your domain, be
         *  sure to tell History where the root really is, as an option:
         *  forerunner.history.history("start", {pushState: true, root: "/public/search/"});
         *
         *  When called, if a route succeeds with a match for the current URL, 
         *  forerunner.history.start() returns true. If no defined route matches the
         *  current URL, it returns false. 
         */
        start: function (options) {
            var me = this;
            if (historyStarted) {
                return false;
            }
            historyStarted = true;

            // Figure out the initial configuration. Do we need an iframe?
            // Is pushState desired ... is it available?
            $.extend(me.options, { root: '/' }, options);
            me.root = me.options.root;
            me._wantsHashChange = me.options.hashChange !== false;
            me._wantsPushState = !!me.options.pushState;
            me._hasPushState = !!(me.options.pushState && me.history && me.history.pushState);
            var fragment = me.getFragment();
            var docMode = document.documentMode;
            var oldIE = (isExplorer.exec(navigator.userAgent.toLowerCase()) && (!docMode || docMode <= 7));

            // Normalize root to always include a leading and trailing slash.
            me.root = ('/' + me.root + '/').replace(rootStripper, '/');

            if (oldIE && me._wantsHashChange) {
                var frame = Backbone.$('<iframe src="javascript:0" tabindex="-1">');
                me.iframe = frame.hide().appendTo('body')[0].contentWindow;
                me.navigate(fragment);
            }

            // Depending on whether we're using pushState or hashes, and whether
            // 'onhashchange' is supported, determine how we check the URL state.
            if (me._hasPushState) {
                $(window).on('popstate', function () {
                    me.checkUrl.call(me);
                });
            } else if (me._wantsHashChange && ('onhashchange' in window) && !oldIE) {
                $(window).on('hashchange', function () {
                    me.checkUrl.call(me);
                });
            } else if (me._wantsHashChange) {
                me._checkUrlInterval = setInterval(function () {
                    me.checkUrl.call(me);
                }, me.interval);
            }

            // Determine if we need to change the base url, for a pushState link
            // opened by a non-pushState browser.
            me.fragment = fragment;
            var loc = me.location;

            // Transition from hashChange to pushState or vice versa if both are
            // requested.
            if (me._wantsHashChange && me._wantsPushState) {

                // If we've started off with a route from a `pushState`-enabled
                // browser, but we're currently in a browser that doesn't support it...
                if (!me._hasPushState && !me.atRoot()) {
                    me.fragment = me.getFragment(null, true);
                    me.location.replace(me.root + '#' + me.fragment);
                    // Return immediately as browser will do redirect to new url
                    return true;

                    // Or if we've started out with a hash-based route, but we're currently
                    // in a browser where it could be `pushState`-based instead...
                } else if (me._hasPushState && me.atRoot() && loc.hash) {
                    me.fragment = me.getHash().replace(routeStripper, '');
                    me.history.replaceState({}, document.title, me.root + me.fragment);
                }

            }

            if (!me.options.silent) {
                return me.loadUrl();
            }
        },

        // Disable Backbone.history, perhaps temporarily. Not useful in a real app,
        // but possibly useful for unit testing Routers.
        stop: function () {
            $(window).off('popstate').off('hashchange');
            clearInterval(this._checkUrlInterval);
            historyStarted = false;

            // Clear all the route handlers. This is done this way to support unit testing.
            // Each time a test is run and start is called the routes must be setup for that
            // test. Then at the end of the test call stop.
            this.handlers.length = 0;
        },

        // Add a route to be tested when the fragment changes. Routes added later
        // may override previous routes.
        route: function (route, callback) {
            this.handlers.unshift({ route: route, callback: callback });
        },

        // Checks the current URL to see if it has changed, and if it has,
        // calls `loadUrl`, normalizing across the hidden iframe.
        checkUrl: function (e) {
            var current = this.getFragment();
            if (current === this.fragment && this.iframe) {
                current = this.getFragment(this.getHash(this.iframe));
            }
            if (current === this.fragment) return false;
            if (this.iframe) this.navigate(current);
            this.loadUrl();
        },

        // Attempt to load the current URL fragment. If a route succeeds with a
        // match, returns `true`. If no defined routes matches the fragment,
        // returns `false`.
        loadUrl: function (fragment) {
            fragment = this.fragment = this.getFragment(fragment);
            return any(this.handlers, function (handler) {
                if (handler.route.test(fragment)) {
                    handler.callback(fragment);
                    return true;
                }
            });
        },

        // Save a fragment into the hash history, or replace the URL state if the
        // 'replace' option is passed. You are responsible for properly URL-encoding
        // the fragment in advance.
        //
        // The options object can contain `trigger: true` if you wish to have the
        // route callback be fired (not usually desirable), or `replace: true`, if
        // you wish to modify the current URL without adding an entry to the history.
        navigate: function (fragment, options) {
            if (!historyStarted) return false;
            if (!options || options === true) options = { trigger: !!options };

            var url = this.root + (fragment = this.getFragment(fragment || ''));

            // Strip the hash for matching.
            fragment = fragment.replace(pathStripper, '');

            if (this.fragment === fragment) return;
            this.fragment = fragment;

            // Don't include a trailing slash on the root.
            if (fragment === '' && url !== '/') url = url.slice(0, -1);

            // If pushState is available, we use it to set the fragment as a real URL.
            if (this._hasPushState) {
                this.history[options.replace ? 'replaceState' : 'pushState']({}, document.title, url);

                // If hash changes haven't been explicitly disabled, update the hash
                // fragment to store history.
            } else if (this._wantsHashChange) {
                this._updateHash(this.location, fragment, options.replace);
                if (this.iframe && (fragment !== this.getFragment(this.getHash(this.iframe)))) {
                    // Opening and closing the iframe tricks IE7 and earlier to push a
                    // history entry on hash-tag change.  When replace is true, we don't
                    // want this.
                    if (!options.replace) this.iframe.document.open().close();
                    this._updateHash(this.iframe.location, fragment, options.replace);
                }

                // If you've told us that you explicitly don't want fallback hashchange-
                // based history, then `navigate` becomes a page refresh.
            } else {
                return this.location.assign(url);
            }
            if (options.trigger) return this.loadUrl(fragment);
        },

        // Update the hash location, either replacing the current entry, or adding
        // a new one to the browser history.
        _updateHash: function (location, fragment, replace) {
            if (replace) {
                var href = location.href.replace(/(javascript:|#).*$/, '');
                location.replace(href + '#' + fragment);
            } else {
                // Some browsers require that `hash` contains a leading #.
                location.hash = '#' + fragment;
            }
        }
    });  // $.widget

    // Adapted from backbone.js
    // ---------------------------

    // Create the singleton history object
    forerunner.history = $({}).history({});

});  // $(function

///#source 1 1 /Forerunner/ReportViewer/js/ReportViewer.js
/**
 * @file Contains the reportViewer widget.
 *
 */

var forerunner = forerunner || {};
forerunner.ssr = forerunner.ssr || {};

$(function () {
    var widgets = forerunner.ssr.constants.widgets;
    var events = forerunner.ssr.constants.events;
    var navigateType = forerunner.ssr.constants.navigateType;

    // The Floating header object holds pointers to the tablix and its row and col header objects
    function floatingHeader($tablix, $rowHeader, $colHeader) {
        this.$tablix = $tablix;
        this.$rowHeader = $rowHeader;
        this.$colHeader = $colHeader;
    }

    // The page object holds the data for each page
    function reportPage(reportObj) {
        this.reportObj = reportObj;
        this.isRendered = false;
    }

    /**
     * Widget used to view a report
     *
     * @namespace $.forerunner.reportViewer
     * @prop {Object} options - The options for reportViewer
     * @prop {String} options.reportViewerAPI - Path to the REST calls for the reportViewer
     * @prop {Integer} options.pingInterval - Interval to ping the server. Used to keep the sessions active
     * @prop {Number} options.toolbarHeight - Height of the toolbar.
     * @prop {Object} options.pageNavArea - jQuery selector object that will the page navigation widget
     * @prop {Object} options.paramArea - jQuery selector object that defineds the report parameter widget
     * @prop {Object} options.DocMapArea - jQuery selector object that defineds the Document Map widget
     * @prop {Object} options.userSettings - User settings used for user specific options
     * @prop {Function} options.onInputBlur - Callback function used to handle input blur event
     * @prop {Function} options.onInputFocus -Callback function used to handle input focus event 
     * @prop {Object} options.$appContainer - Report container
     * @prop {Object} options.parameterModel - Parameter model
     * @prop {Object} options.savePosition - Saved report page scroll position 
     * @prop {String} options.viewerID - Current report viewer id.
     * @prop {String} options.rsInstance - Report service instance name
     * @prop {String} options.showSubscriptionUI - Show Subscription UI if the user has permissions.  Default to false.
     * @example
     * $("#reportViewerId").reportViewer();
     * $("#reportViewerId").reportViewer("loadReport", reportPath, 1, true, savedParameters);
     */
    $.widget(widgets.getFullname(widgets.reportViewer), /** @lends $.forerunner.reportViewer */ {
        // Default options
        options: {
            reportViewerAPI: forerunner.config.forerunnerAPIBase() + "ReportViewer",
            //reportPath: null,
            //pageNum: 1,
            pingInterval: 300000,
            toolbarHeight: 0,
            pageNavArea: null,
            paramArea: null,
            DocMapArea: null,
            userSettings: null,
            //savedParameters: null,
            onInputBlur: null,
            onInputFocus: null,
            $appContainer: null,
            parameterModel: null,
            savePosition: null,
            viewerID: null,
            rsInstance: null,
            showSubscriptionUI: false
        },

        _destroy: function () {
            var me = this;
            //This needs to be changed to only remove the view function
            //Baotong update it on 22-05-2014
            $(window).off("resize", me._onWindowResize);
        },

        // Constructor
        _create: function () {
            var me = this;
            setInterval(function () { me._sessionPing(); }, me.options.pingInterval);

            // ReportState
            me.locData = forerunner.localize.getLocData(forerunner.config.forerunnerFolder() + "ReportViewer/loc/ReportViewer");
            me.actionHistory = [];
            me.curPage = 0;
            me.pages = {};
            me.reportPath = "";
            me.pageNum = 0;
            me.savedParameters = null;
            me.sessionID = "";
            me.numPages = 0;
            me.lock = 0;
            me.$reportContainer = new $("<DIV class='fr-report-container'/>");
            me.$reportAreaContainer = null;            
            me.$loadingIndicator = new $("<div class='fr-report-loading-indicator' ></div>").text(me.locData.messages.loading);
            me.floatingHeaders = [];
            me.paramLoaded = false;
            me.scrollTop = 0;
            me.scrollLeft = 0;
            me.loadLock = 0;
            me.finding = false;
            me.findStartPage = null;
            me.findEndPage = null;
            me.findKeyword = null;
            me.hasDocMap = false;
            me.docMapData = null;
            me.togglePageNum = 0;
            me.element.append(me.$loadingIndicator);
            me.pageNavOpen = false;
            me.savedTop = 0;
            me.savedLeft = 0;
            me.origionalReportPath = "";
            me._setPageCallback = null;
            me.renderError = false;
            me.autoRefreshID = null;
            me.reportStates = { toggleStates: new forerunner.ssr.map(), sortStates: [] };
            me.renderTime = new Date().getTime();
            me.paramDefs = null;
            me.credentialDefs = null;
            me.datasourceCredentials = null;
            me.viewerID = me.options.viewerID ? me.options.viewerID : Math.floor((Math.random() * 100) + 1);
            me.SaveThumbnail = false;
            me.RDLExtProperty = null;            

            var isTouch = forerunner.device.isTouch();
            // For touch device, update the header only on scrollstop.
            if (isTouch) {
                $(window).on("scrollstop", function () { me._updateTableHeaders(me); });                
            } else {                
                $(window).on("scroll", function () { me._updateTableHeaders(me); });
            }

            //setup orientation change
            if (!forerunner.device.isMSIE8())
                window.addEventListener("orientationchange", function() { me._ReRender.call(me);},false);

            //$(window).resize(function () { me._ReRender.call(me); });
            $(window).on("resize", { me: me }, me._onWindowResize);

            //load the report Page requested
            me.element.append(me.$reportContainer);
            //me._addLoadingIndicator();
            me.hideDocMap();

            if (me.options.parameterModel) {
                me.options.parameterModel.on(events.parameterModelSetChanged(), function (e, args) {
                    me._onModelSetChanged.call(me, e, args);
                });
            }
        },
        _checkPermission: function (path) {
            var me = this;
            //Create Subscription: create subscription
            //update properties: update report properties (tags)
            //for more properties, add to the list
            var permissionList = ["Create Subscription", "Update Properties"];
            me.permissions = forerunner.ajax.hasPermission(path, permissionList.join(","));
        },
        /**
         * Get current path user permission
         *
         * @function $.forerunner.dashboardEZ#getPermission
         * 
         * @return {Object} - permission jQuery object
         */
        getPermissions: function () {
            var me = this;

            return me.permissions;
        },
        /**
         * Get current user settings
         *
         * @function $.forerunner.reportViewer#getUserSettings
         * @return {Object} - Current user settings
         */
        getUserSettings: function () {
            return this.options.userSettings;
        },
        /**
         * Get the flag to indicate whether to show subscription UI
         *
         * @function $.forerunner.reportViewer#showSubscriptionUI
         * @return {Object} - Flag to indicate whether to show subscription UI
         */
        showSubscriptionUI: function() {
            return this.options.showSubscriptionUI;
        },
        /**
         * Get current page number
         *
         * @function $.forerunner.reportViewer#getCurPage
         * @return {Integer} - Current page number
         */
        getCurPage: function () {
            var me = this;
            return me.curPage;
        },
        /**
         * Get current number of pages
         *
         * @function $.forerunner.reportViewer#getNumPages
         * @return {Integer} - Current number of pages
         */
        getNumPages: function () {
            var me = this;
            return me.numPages;
        },
        /**
         * Get report viewer API path
         *
         * @function $.forerunner.reportViewer#getReportViewerAPI
         * @return {String} - Path to the report viewer API
         */
        getReportViewerAPI: function () {
            var me = this;
            return me.options.reportViewerAPI;
        },
        /**
         * Get current report path
         *
         * @function $.forerunner.reportViewer#getReportPath
         * @return {String} - Path to current report path
         */
        getReportPath: function () {
            var me = this;
            return me.reportPath;
        },
        /**
         * Get current report session ID
         *
         * @function $.forerunner.reportViewer#getSessionID
         * @return {String} - Session ID
         */
        getSessionID: function () {
            var me = this;
            return me.sessionID;
        },
        /**
         * Get current report contain document map or not
         *
         * @function $.forerunner.reportViewer#getHasDocMap
         * @return {Boolean} - true if there is a document map
         */
        getHasDocMap: function () {
            var me = this;
            return me.hasDocMap;
        },
        /**
         * Get datasource credentials' data
         *
         * @function $.forerunner.reportViewer#getDataSourceCredential
         * @return {Object} datasource credential if saved datasource credential exist; return null if not
         */
        getDataSourceCredential: function () {
            var me = this;
            return me.datasourceCredentials ? me.datasourceCredentials : null;
        },
        /**
         * Trigger an report viewer event
         *
         * @function $.forerunner.reportViewer#triggerEvent
         *
         * @paran {String} eventName - event name
         */
        triggerEvent: function (eventName,eventData) {
            var me = this;
            return me._trigger(eventName,null,eventData);
        },
        _setColHeaderOffset: function ($tablix, $colHeader) {
            //Update floating column headers
            //var me = this;
          
            if (!$colHeader)
                return;

            var offset = $tablix.offset();
            var scrollLeft = $(window).scrollLeft();
            if ((scrollLeft > offset.left) && (scrollLeft < offset.left + $tablix.width())) {
                //$colHeader.css("top", $tablix.offset.top);
                $colHeader.css("left", Math.min(scrollLeft - offset.left, $tablix.width() - $colHeader.width()) + "px");
                $colHeader.css("visibility", "visible");
            }
            else {
                $colHeader.css("visibility", "hidden");                
            }
        },
        _setRowHeaderOffset: function ($tablix, $rowHeader) {
            //  Update floating row headers
         
            var me = this;
            if (!$rowHeader)
                return;

            var offset = $tablix.offset();
            var scrollTop = $(window).scrollTop();            
            if ((scrollTop > offset.top) && (scrollTop < offset.top + $tablix.innerHeight())) {
                $rowHeader.css("top", (Math.min((scrollTop - offset.top), ($tablix.height() - $rowHeader.innerHeight())) + me.options.toolbarHeight) + "px");
                $rowHeader.css("visibility", "visible");
            }
            else {
                $rowHeader.css("visibility", "hidden");
            }
            
        },
        _addLoadingIndicator: function () {
            var me = this;
            if (me.loadLock === 0) {
                me.loadLock = 1;
                setTimeout(function () { me.showLoadingIndictator(); }, 500);
            }
        },
        /**
         * Shows the loading Indicator
         *
         * @function $.forerunner.reportViewer#showLoadingIndictator
         *
         * @param {Boolean} force - Force show loading indicator if it's true
         */
        showLoadingIndictator: function (force) {
            var me = this;
            if (me.loadLock === 1 || force===true) {
                var $mainviewport = me.options.$appContainer.find(".fr-layout-mainviewport");
                $mainviewport.addClass("fr-layout-mainviewport-fullheight");
                //212 is static value for loading indicator width
                var scrollLeft = me.$reportContainer.width() - 212;

                if (force === true) {
                    me.$loadingIndicator.css("top",$(window).scrollTop() + 100 + "px")
                     .css("left", scrollLeft > 0 ? scrollLeft / 2 : 0 + "px");
                }
                else {
                    me.$loadingIndicator.css("top", me.$reportContainer.scrollTop() + 100 + "px")
                        .css("left", scrollLeft > 0 ? scrollLeft / 2 : 0 + "px");
                }

                me.$reportContainer.addClass("fr-report-container-translucent");
                me.$loadingIndicator.show();
            }
        },
        /**
         * Removes the loading Indicator
         *
         * @function $.forerunner.reportViewer#removeLoadingIndicator
         *
         * @param {Boolean} force - Force remove loading indicator if it's true
         */
        removeLoadingIndicator: function (force) {
            var me = this;
            if (me.loadLock === 1 || force === true) {
                me.loadLock = 0;
                var $mainviewport = me.options.$appContainer.find(".fr-layout-mainviewport");
                $mainviewport.removeClass("fr-layout-mainviewport-fullheight");

                me.$reportContainer.removeClass("fr-report-container-translucent");
                me.$loadingIndicator.hide();
            }
        },
        _ReRender: function (force) {
            var me = this;

            if (me.options.userSettings && me.options.userSettings.responsiveUI === true) {
                $.each(me.pages, function (index, page) {
                    page.needsLayout = true;
                });                
                me._reLayoutPage(me.curPage, force);
                
            }
        },
        //Wrapper function, used to resigter window resize event
        _onWindowResize: function (event) {
            var me = event.data.me;
            me._windowResize.call(me);
        },
        _windowResize: function () {
            var me = this;
            me.scrollLeft = $(window).scrollLeft();
            me.scrollTop = $(window).scrollTop();

            me._ReRender.call(me);
            $(window).scrollLeft(me.scrollLeft);
            $(window).scrollTop(me.scrollTop);
        },
        /**
         * Relayout the report
         *
         * @function $.forerunner.reportViewer#reLayout
         *
         * Normally this would not need to be called. It is needed when a
         * report is rendered into a container (<div>) and the size of the
         * container is defined by the report itself. In that case call this
         * function after the report is finished loading.
         */
        reLayout: function () {
            var me = this;
            me._windowResize();
        },
        _removeCSS: function () {
            var me = this;

            var sty = $("head").find("style");
            for (var i = 0; i < sty.length; i++) {
                if (sty[i].id === me.viewerID.toString()) {
                    var e = sty[i];
                    e.parentNode.removeChild(e);
                }
            }
        },
        _setPage: function (pageNum) {
            //  Load a new page into the screen and udpate the toolbar
            var me = this;

            if (!me.pages[pageNum].isRendered)
                me._renderPage(pageNum);
            

            if ($(".fr-report-areacontainer", me.$reportContainer).length === 0) {
                var errorpage = me.$reportContainer.find(".Page");
                if (errorpage)
                    errorpage.detach();
                me.$reportAreaContainer = $("<Div/>");
                me.$reportAreaContainer.addClass("fr-report-areacontainer");
                me.$reportContainer.append(me.$reportAreaContainer);
                me.$reportAreaContainer.append(me._getPageContainer(pageNum));
                me._touchNav();
                me._removeDocMap();
            }
            else {
                me.$reportAreaContainer.find(".Page").detach();
                me.$reportAreaContainer.append(me._getPageContainer(pageNum));
               
            }

            me._removeCSS();

            if (!$.isEmptyObject(me.pages[pageNum].CSS))
                me.pages[pageNum].CSS.appendTo("head");

            //relayout page if needed
            me._reLayoutPage(pageNum);

            if (!me.renderError) {
                me.curPage = pageNum;
                me._trigger(events.changePage, null, { newPageNum: pageNum, paramLoaded: me.paramLoaded, numOfVisibleParameters: me.$numOfVisibleParameters, renderError: me.renderError, credentialRequired: me.credentialDefs ? true : false });
            }
            $(window).scrollLeft(me.scrollLeft);
            $(window).scrollTop(me.scrollTop);
            me.removeLoadingIndicator();
            me.lock = 0;

            if (typeof (me._setPageCallback) === "function") {
                me._setPageCallback();
                me._setPageCallback = null;
            }
            
            // Trigger the change page event to allow any widget (E.g., toolbar) to update their view
            me._trigger(events.setPageDone, null, { newPageNum: me.curPage, paramLoaded: me.paramLoaded, numOfVisibleParameters: me.$numOfVisibleParameters, renderError: me.renderError, credentialRequired: me.credentialDefs ? true : false });
        },
        _addSetPageCallback: function (func) {
            if (typeof (func) !== "function") return;

            var me = this;
            var priorCallback = me._setPageCallback;

            if (priorCallback === null) {
                me._setPageCallback = func;
            } else {
                me._setPageCallback = function () {
                    priorCallback();
                    func();
                };
            }
        },
        // Windows Phones need to be reloaded in order to change their viewport settings
        // so what we will do in this case is to set our state into the sessionStorage
        // and reload the page. Then in the loadPage function we will check if this is
        // a reload page case so as to set the zoom
        _allowZoomWindowsPhone: function (isEnabled) {
            var me = this;

            // Save a copy of the page into the action history
            me.backupCurPage(true);

            // Make the action history ready to stringify (I.e., remove any unneeded object references)
            $.each(me.actionHistory, function (index, actionItem) {
                $.each(actionItem.reportPages, function (index, reportPage) {
                    reportPage.$container = null;
                    reportPage.CSS = null;
                    reportPage.isRendered = false;
                });
            });

            // Save the action history into the session storage
            sessionStorage.forerunner_zoomReload_actionHistory = JSON.stringify({ actionHistory: me.actionHistory });

            // Save the reuested zoom state
            sessionStorage.forerunner_zoomReload_userZoom = JSON.stringify({ userZoom: isEnabled ? "zoom" : "fixed" });

            // Now reload the page from the saved state
            window.location.reload();
        },
        /**
         * Set zoom enable or disable
         *
         * @function $.forerunner.reportViewer#allowZoom
         *
         * @param {Boolean} isEnabled - True to enable zoom, False to disable
         */
        allowZoom: function (isEnabled) {
            var me = this;

            if (forerunner.device.isWindowsPhone()) {
                me._allowZoomWindowsPhone(isEnabled);
                return;
            }

            if (isEnabled === true){
                forerunner.device.allowZoom(true);
                me.allowSwipe(false);
            }
            else{
                forerunner.device.allowZoom(false);
                me.allowSwipe(true);
            }
            me._trigger(events.allowZoom, null, { isEnabled: isEnabled });

        },
        /**
         * Function execute when input element blur
         *
         * @function $.forerunner.reportViewer#onInputBlur
         */
        onInputBlur: function () {
            var me = this;
            if (me.options.onInputBlur)
                me.options.onInputBlur();
        },
        /**
         * Function execute when input element focus
         *
         * @function $.forerunner.reportViewer#onInputFocus
         */
        onInputFocus: function () {
            var me = this;
            if (me.options.onInputFocus)
                me.options.onInputFocus();
        },

        _allowSwipe: true,
        /**
         * Set swipe enable or disable
         *
         * @function $.forerunner.reportViewer#allowSwipe
         *
         * @param {Boolean} isEnabled - True to enable swipe, False to disable
         */
        allowSwipe: function(isEnabled){
            var me = this;
            me._allowSwipe = isEnabled;
        },
        _navToPage: function (newPageNum) {
            var me = this;
            if (me._allowSwipe === true) {
                me.navToPage(newPageNum);
            }
        },
        _touchNav: function () {
            if (!forerunner.device.isTouch())
                return;
            // Touch Events
            var me = this;
            $(me.element).hammer({ stop_browser_behavior: { userSelect: false }, swipe_max_touches: 2, drag_max_touches: 2 }).on("swipe drag touch release",
                function (ev) {
                    if (!ev.gesture) return;
                    switch (ev.type) {
                        // Hide the header on touch
                        case "touch":
                            me._hideTableHeaders();
                            break;

                            // Show the header on release only if this is not scrolling.
                            // If it is scrolling, we will let scrollstop handle that.                   
                        case "release":
                            var swipeNav = false;                            
                            if (ev.gesture.touches.length > 1) {                                
                                swipeNav = true;
                            }

                            if ((ev.gesture.direction === "left" || ev.gesture.direction === "up") && swipeNav) {
                                ev.gesture.preventDefault();
                                me._navToPage(me.curPage + 1);
                                break;
                            }

                            if ((ev.gesture.direction === "right" || ev.gesture.direction === "down") && swipeNav) {
                                ev.gesture.preventDefault();
                                me._navToPage(me.curPage - 1);
                                break;
                            }
                            

                            if (ev.gesture.velocityX === 0 && ev.gesture.velocityY === 0)
                                me._updateTableHeaders(me);
                            break;
                    }
                   
                }
            );
        },
        /**
         * Refreshes current report
         *
         * @function $.forerunner.reportViewer#refreshReport
         *
         * @param {Integer} curPage - Current page number
         */
        refreshReport: function (curPage) {
            // Remove all cached data on the report and re-run
            var me = this;
            var paramList = null;

            if (me.lock === 1)
                return;

            if (curPage === undefined)
                curPage = 1;

            me.sessionID = "";
            me.renderTime = new Date().getTime();

            me.lock = 1;
            me._revertUnsubmittedParameters();

            if (me.paramLoaded === true) {                
                paramList = me.options.paramArea.reportParameter("getParamsList");
            }
            me._resetViewer(true);
            me._loadPage(curPage, false, null, paramList,true);
        },
        /**
         * Navigates to the given page
         *
         * @function $.forerunner.reportViewer#navToPage
         *
         * @param {Ingeter} newPageNum - Page number to navigate to
         */
        navToPage: function (newPageNum) {
            var me = this;
            if (newPageNum === me.curPage || me.lock === 1)
                return;
            me._resetContextIfInvalid();
            me.scrollLeft = 0;
            me.scrollTop = 0;

            if (newPageNum > me.numPages && me.numPages !==0 ) {
                newPageNum = 1;
            }
            if (newPageNum < 1) {
                newPageNum = me.numPages;
            }
            
            if (newPageNum !== me.curPage) {
                if (me.lock === 0) {
                    me.lock = 1;
                    me._loadPage(newPageNum, false);
                }
            }
        },
        _hideDocMap: function() {
            var me = this;
            var docMap = me.options.docMapArea;

            me.savedTop = 0;
            me.savedLeft = 0;

            docMap.hide();
            me.element.unmask();
            me._trigger(events.hideDocMap);
        },
        _showDocMap: function () {
            var me = this;
            me._resetContextIfInvalid();
            var docMap = me.options.docMapArea;
            docMap.reportDocumentMap({ $reportViewer: me });

            //get the doc map
            if (!me.docMapData) {
                forerunner.ajax.ajax({
                    url: me.options.reportViewerAPI + "/DocMapJSON/",
                    data: {
                        SessionID: me.sessionID,
                        instance: me.options.rsInstance,
                    },
                    dataType: "json",
                    async: false,
                    success: function (data) {
                        me.docMapData = data;
                        docMap.reportDocumentMap("write", data);
                    },
                    fail: function () { me._showMessageBox(me.locData.messages.docmapShowFailed); }
                });
            }

            me.savedTop = $(window).scrollTop();
            me.savedLeft = $(window).scrollLeft();

            me.element.mask();
            docMap.slideUpShow();
            me._trigger(events.showDocMap);

            //if doc map opened from toolpane, DefaultAppTemplate will pass savePosition here.
            setTimeout(function () {
                if (me.options.savePosition) {
                    me.savedTop = me.options.savePosition.top;
                    me.savedLeft = me.options.savePosition.left;
                    me.options.savePosition = null;
                }
            }, 100);
        },
        _removeDocMap: function () {
            //Verify whether document map code exist in previous report
            var me = this;

            if ($(".fr-docmap-panel").length !== 0) {
                me.hideDocMap();
                me.docMapData = null;
                $(".fr-docmap-panel").remove();
            }
        },
        /**
         * Hides the Document Map if it is visible
         *
         * @function $.forerunner.reportViewer#hideDocMap
         */
        hideDocMap: function () {
            var me = this;
            var docMap = me.options.docMapArea;

            if (!me.hasDocMap || !docMap)
                return;

            if (docMap.is(":visible")) {
                me._hideDocMap();
            }
        },
        /**
         * Shows the visibility of the Document Map
         *
         * @function $.forerunner.reportViewer#showDocMap
         */
        showDocMap: function () {
            var me = this;
            var docMap = me.options.docMapArea;

            if (!me.hasDocMap || !docMap)
                return;

            if (docMap.is(":visible")) {
                me._hideDocMap();
                return;
            }
            me._showDocMap();
        },
        _cachePages: function (initPage) {
            var me = this;
             
            initPage = parseInt(initPage, 10);
            
            var low = initPage - 1;
            var high = initPage + 1;
            if (low < 1) low = 1;
            if (high > me.numPages && me.numPages !== 0 )
                high = me.numPages;

            for (var i = low; i <= high; i++) {
                if (!me.pages[i])
                    if (i !== initPage)
                        me._loadPage(i, true);
            }

        },

        /**
         * Returns the number of actions in history for the back event
         *
         * @function $.forerunner.reportViewer#actionHistoryDepth
         *
         * @return {Integer} - Action history length
         */
        actionHistoryDepth:function(){
            return this.actionHistory.length;
        },
        /**
         * Loads and pops the page on the action history stack and triggers a drillBack event or triggers a back event if no action history
         *
         * @function $.forerunner.reportViewer#back
         *
         * @fires reportviewerdrillback
         * @fires reportviewerback
         * @see forerunner.ssr.constants.events
         */
        back: function () {
            var me = this;
            var action = me.actionHistory.pop();
            if (action) {
                me._clearReportViewerForDrill();

                me.reportPath = action.ReportPath;
                me.sessionID = action.SessionID;
                me.curPage = action.CurrentPage;
               
                me.hideDocMap();
                me.scrollLeft = action.ScrollLeft;
                me.scrollTop = action.ScrollTop;
                me.reportStates = action.reportStates;
                me.renderTime = action.renderTime;
                me.renderError = action.renderError;
                               

                if (action.credentialDefs !== null) {
                    me.credentialDefs = action.credentialDefs;
                    me.datasourceCredentials = action.savedCredential;

                    if (!me.$credentialDialog)
                        me.$credentialDialog = me.options.$appContainer.find(".fr-dsc-section");

                    me.$credentialDialog.dsCredential("resetSavedCredential", me.credentialDefs.CredentialsList, me.datasourceCredentials);
                }

                //Trigger Change Report, disables buttons.  Differnt than pop
                me._trigger(events.changeReport, null, { path: me.reportPath, credentialRequired: me.credentialDefs ? true : false });

                //This means we changed reports
                if (action.FlushCache) {
                    me._removeParameters();
                    me.flushCache();
                    me.pages = action.reportPages;
                    me.paramDefs = action.paramDefs;

                    me.numPages = action.reportPages[action.CurrentPage].reportObj.ReportContainer.NumPages ? action.reportPages[action.CurrentPage].reportObj.ReportContainer.NumPages : 0;

                    if (action.paramDefs) {
                        me.options.paramArea.reportParameter({ $reportViewer: me, $appContainer: me.options.$appContainer });
                        me.options.paramArea.reportParameter("setParametersAndUpdate", action.paramDefs, action.savedParams, action.CurrentPage);
                        me.$numOfVisibleParameters = me.options.paramArea.reportParameter("getNumOfVisibleParameters");
                        if (me.$numOfVisibleParameters > 0) {
                            me._trigger(events.showParamArea, null, { reportPath: me.reportPath });
                        }
                        me.paramLoaded = true;
                        me.$paramarea = me.options.paramArea;
                    }

                    // Restore the parameterModel state from the action history
                    if (me.options.parameterModel && action.parameterModel)
                        me.options.parameterModel.parameterModel("setModel", action.parameterModel);
                }
                me._loadPage(action.CurrentPage, false, null, null, false, me.pages[me.curPage].Replay);
                me._trigger(events.actionHistoryPop, null, { path: me.reportPath });
            }
            else {
                me.flushCache();
                me._resetViewer(false);
                me._trigger(events.back, null, { path: me.reportPath });
            }
        },
        /**
         * Shows the page navigation pane
         *
         * @function $.forerunner.reportViewer#showNav
         *
         * @fires reportviewershowNav
         * @see forerunner.ssr.constants.events
         */
        showNav: function () {
            var me = this;
            me._resetContextIfInvalid();
            if (me.pageNavOpen) {//close nav
                me.pageNavOpen = false;
                if (window.removeEventListener) {
                    window.removeEventListener("orientationchange", me._handleOrientation, false);
                }
                else {
                    window.detachEvent("orientationchange", me._handleOrientation);
                }
                me.element.unmask(function() { me.showNav.call(me);});
            }
            else {//open nav
                me.pageNavOpen = true;
                if (window.addEventListener) {
                    window.addEventListener("orientationchange", me._handleOrientation, false);
                } else {
                    window.attachEvent("orientationchange", me._handleOrientation);
                }
                me.element.mask(function() { me.showNav.call(me);});
            }

            if (me.options.pageNavArea){
                me.options.pageNavArea.pageNav("showNav");
            }
            me._trigger(events.showNav, null, { newPageNum: me.curPage, path: me.reportPath, open: me.pageNavOpen });
            me._reLayoutPage(me.curPage);
        },
        _handleOrientation: function () {
            var me = this;
            var pageSection = $(".fr-layout-pagesection");
            if (forerunner.device.isSmall(me.element)) {//big screen, height>=768
                //portrait
                if (pageSection.is(":visible"))
                    pageSection.hide();
            }
            else {//small screen, height<768
                if (pageSection.is(":hidden"))
                    pageSection.show();
            }
        },

        /**
         * Resets the Page Navigation cache
         *
         * @function $.forerunner.reportViewer#flushCache
         */
        flushCache: function () {
            var me = this;
            me.pages = {};
            if (me.options.pageNavArea)
                me.options.pageNavArea.pageNav("reset");
        },
        _saveThumbnail: function () {
            var me = this;
            var url = forerunner.config.forerunnerAPIBase() + "ReportManager" + "/SaveThumbnail";
            if (me.getCurPage() === 1 && !me.SaveThumbnail) {
                me.SaveThumbnail = true;
                forerunner.ajax.ajax({
                    type: "GET",
                    url: url,
                    data: {
                        ReportPath: encodeURIComponent(me.reportPath),
                        SessionID: me.sessionID,
                        Instance: me.options.rsInstance,
                    },
                    async: true,
                    success: function (data) {
                        //console.log("Saved");
                    }

                });
            }
        },
        _prepareAction: function () {
            var me = this;

            if (me.togglePageNum !== me.curPage || me.togglePageNum  === 0) {
                forerunner.ajax.ajax({
                    type: "POST",
                    url: me.options.reportViewerAPI + "/ReportJSON/",
                    data: {
                        ReportPath: encodeURIComponent(me.reportPath),
                        SessionID: me.sessionID,
                        PageNumber: me.curPage,
                        ParameterList: "",
                        instance: me.options.rsInstance,
                    },
                    dataType: "json",
                    async: false,
                    success: function (data) {
                        me.togglePageNum = me.curPage;
                    },
                    fail: function () { me._showMessageBox(me.locData.messages.prepareActionFailed); }
                });
            }
        },
        _updateSortState: function (id, direction, clear) {
            var me = this;
            if (clear !== false)
                me.reportStates.sortStates = [];
            me.reportStates.sortStates.push({ id: id, direction: direction });
        },
        _getSortResult: function (id, direction, clear) {
            var me = this;
            return forerunner.ajax.ajax({
                dataType: "json",
                url: me.options.reportViewerAPI + "/SortReport/",
                data: {
                    SessionID: me.sessionID,
                    SortItem: id,
                    Direction: direction,
                    ClearExistingSort: clear,
                    instance: me.options.rsInstance,
                },
                async: false,
            });
        },

        _replaySortStates: function () {
            var me = this;
            // Must synchronously replay one-by-one
            var list = me.reportStates.sortStates;
            for (var i = 0; i < list.length; i++) {
                // Only clear it for the first item
                me._getSortResult(list[i].id, list[i].direction, i === 0);
            }
        },
        /**
         * Sorts the current report
         *
         * @function $.forerunner.reportViewer#sort
         *
         * @param {String} direction - Sort direction
         * @param {String} id - Sort item id
         * @param {Boolean} clear - Clear existing sort flag
         * @see forerunner.ssr.constants.sortDirection
         */
        sort: function (direction, id, clear) {
            //Go the other dirction from current
            var me = this;
            var newDir;
            var sortDirection = forerunner.ssr.constants.sortDirection;

            if (me.lock === 1)
                return;
            me.lock = 1;
            me._resetContextIfInvalid();

            if (direction === sortDirection.asc)
                newDir = sortDirection.desc;
            else
                newDir = sortDirection.asc;

            me._callSort(id, newDir, clear);
        },

        _callSort: function (id, newDir, clear) {
            var me = this;
            me._updateSortState(id, newDir);
            forerunner.ajax.getJSON(me.options.reportViewerAPI + "/SortReport/",
                {
                    SessionID: me.sessionID,
                    SortItem: id,
                    Direction: newDir,
                    ClearExistingSort: clear,
                    instance: me.options.rsInstance,
                },
                function (data) {
                    me.scrollLeft = $(window).scrollLeft();
                    me.scrollTop = $(window).scrollTop();

                    me.numPages = data.NumPages;
                    me.renderTime = new Date().getTime();
                    var replay = me.pages[me.curPage].Replay

                    me._loadPage(data.NewPage, false, null, null, true,replay);

                },
                function (jqXHR, textStatus, errorThrown, request) { me._writeError(jqXHR, textStatus, errorThrown, request); }
            );
        },
        
        _isReportContextValid: true,
        /**
         * Set isReportContextValid to false
         *
         * @function $.forerunner.reportViewer#invalidateReportContext
         */
        invalidateReportContext : function() {
            this._isReportContextValid = false;
        },
        _callGetReportJSON: function () {
            var me = this;
            var paramList = null;
            if (me.paramLoaded) {
                var $paramArea = me.options.paramArea;
                //get current parameter list without validate
                paramList = $paramArea.reportParameter("getParamsList", true);
            }
            forerunner.ajax.ajax(
                {
                    type: "POST",
                    dataType: "json",
                    url: me.options.reportViewerAPI + "/ReportJSON/",
                    data: {
                        ReportPath: encodeURIComponent(me.reportPath),
                        SessionID: me.sessionID,
                        PageNumber: me.getCurPage(),
                        ParameterList: paramList,
                        instance: me.options.rsInstance,
                    },
                    success: function (data) {
                        me._isReportContextValid = true;
                    },
                    async: false
                });           

        },
        _updateToggleState: function (toggleID) {
            var me = this;
            if (me.reportStates.toggleStates.has(toggleID)) {
                me.reportStates.toggleStates.remove(toggleID);
            } else {
                me.reportStates.toggleStates.add(toggleID);
            }
        },

        _getToggleResult: function (toggleID) {
            var me = this;
            return forerunner.ajax.ajax({
                dataType: "json",
                url : me.options.reportViewerAPI + "/NavigateTo/",
                data: {
                    NavType: navigateType.toggle,
                    SessionID: me.sessionID,
                    UniqueID: toggleID,
                    instance: me.options.rsInstance,
                },
                async: false,
            });
        },
        
        _replayToggleStates : function() {
            var me = this;
            // Must synchronously replay one-by-one
            var keys = me.reportStates.toggleStates.keys();
            for (var i = 0; i < keys.length; i++) {
                me._getToggleResult(keys[i]);
            }
        },
        /**
         * Toggle specify item of the report
         *
         * @function $.forerunner.reportViewer#toggleItem
         *
         * @param {String} toggleID - Id of the item to toggle
         */
        toggleItem: function (toggleID,scrollID) {
            var me = this;
            if (me.lock === 1)
                return;
            me.lock = 1;

            me._addLoadingIndicator();
            me._resetContextIfInvalid();
            me._prepareAction();
            
            me._callToggle(toggleID, scrollID);
        },
        
        _callToggle: function (toggleID, scrollID) {
            var me = this;
            me._updateToggleState(toggleID);
            forerunner.ajax.getJSON(me.options.reportViewerAPI + "/NavigateTo/",
                {
                    NavType: navigateType.toggle,
                    SessionID: me.sessionID,
                    UniqueID: toggleID,
                    instance: me.options.rsInstance,
                },
                function (data) {
                    if (data.Result === true) {
                        me.scrollLeft = $(window).scrollLeft();
                        me.scrollTop = $(window).scrollTop();

                        var replay = me.pages[me.curPage].Replay

                        me.pages[me.curPage] = null;
                        me._loadPage(me.curPage, false, undefined, undefined, undefined, replay, scrollID);
                        
                    }
                    else
                        me.lock = 0;
                },
                function (jqXHR, textStatus, errorThrown, request) { me.lock = 0; me._writeError(jqXHR, textStatus, errorThrown, request); }
            );
        },

        _resetContextIfInvalid: function () {
            var me = this;
            me._revertUnsubmittedParameters();
            if (!me._isReportContextValid) {
                me._callGetReportJSON();
                // Replay sort states
                me._replaySortStates();
                // Replay toggle states
                me._replayToggleStates();
            }
        },

        _revertUnsubmittedParameters: function () {
            var me = this;
            if (me.paramLoaded) {
                var $paramArea = me.options.paramArea;
                //get current parameter list without validate
                return $paramArea.reportParameter("revertParameters");
            }
        },
        /**
         * Navigate to the given bookmark
         *
         * @function $.forerunner.reportViewer#navigateBookmark
         *
         * @param {String} bookmarkID - Id of the bookmark
         */
        navigateBookmark: function (bookmarkID) {
            var me = this;
            if (me.lock === 1)
                return;
            me.lock = 1;
            me._resetContextIfInvalid();
            me._prepareAction();
            forerunner.ajax.getJSON(me.options.reportViewerAPI + "/NavigateTo/",
                {
                    NavType: navigateType.bookmark,
                    SessionID: me.sessionID,
                    UniqueID: bookmarkID,
                    instance: me.options.rsInstance,
                },
                function (data) {
                    if (data.NewPage === me.curPage) {
                        me._navToLink(bookmarkID);
                        me.lock = 0;
                    } else {
                        if (data.NewPage !== undefined && data.NewPage > 0) {
                            me.backupCurPage();
                            me._loadPage(data.NewPage, false, bookmarkID);
                        } else {
                            me._showMessageBox(me.locData.messages.bookmarkNotFound);
                            me.lock = 0;
                        }
                    }
                },
                function (jqXHR, textStatus, errorThrown, request) { me.lock = 0; me._writeError(jqXHR, textStatus, errorThrown, request); }
            );
        },

        /**
         * Determines if the current report being viewed is the result of a drillthough action
         *
         * @function $.forerunner.reportViewer#isDrillThoughReport
         *
         * @return {Boolean} - True if current report is the result of a drillthough action, false else
         */
        isDrillThoughReport: function () {
            var me = this;
            if (me.origionalReportPath === me.reportPath)
                return true;
            else
                return false;
        },
        /**
         * Navigate to the given drill through item
         *
         * @function $.forerunner.reportViewer#navigateDrillthrough
         *
         * @param {String} drillthroughID - Id of the item
         */
        navigateDrillthrough: function (drillthroughID) {
            var me = this;
            if (me.lock === 1)
                return;
            me.lock = 1;
            me._addLoadingIndicator();
            me._resetContextIfInvalid();
            me._prepareAction();
            forerunner.ajax.getJSON(me.options.reportViewerAPI + "/NavigateTo/",
                {
                    NavType: navigateType.drillThrough,
                    SessionID: me.sessionID,
                    UniqueID: drillthroughID,
                    instance: me.options.rsInstance,
                },
                function (data) {
                    me.backupCurPage(true);
                    if (data.Exception) {
                        me._renderPageError(me.$reportAreaContainer.find(".Page"), data);
                        me.removeLoadingIndicator();
                        me.lock = 0;
                    }
                    else {
                        me.renderError = false;
                        me.sessionID = data.SessionID;
                        if (me.origionalReportPath === "")
                            me.origionalReportPath = me.reportPath;
                        me.reportPath = data.ReportPath;
                        if (me.options.parameterModel)
                            me.options.parameterModel.parameterModel("getCurrentParameterList", me.reportPath);

                        me._trigger(events.drillThrough, null, { path: data.ReportPath });
                        if (data.CredentialsRequired) {
                            me.$reportAreaContainer.find(".Page").detach();
                            me._setScrollLocation(0, 0);
                            me._writeDSCredential(data.Credentials);
                        }
                        else if (data.ParametersRequired) {
                            me.$reportAreaContainer.find(".Page").detach();
                            me._setScrollLocation(0, 0);
                            me._showParameters(1, data.Parameters);
                        }
                        else {
                            me._setScrollLocation(0, 0);
                            me._loadPage(1, false, null, null, true);
                        }
                    }
                },
                function (jqXHR, textStatus, errorThrown, request) { me.lock = 0; me._writeError(jqXHR, textStatus, errorThrown, request); }
            );
        },
        /**
         * Navigate to the Document Map
         *
         * @function $.forerunner.reportViewer#navigateDocumentMap
         *
         * @param {String} docMapID - Id of the document map
         */
        navigateDocumentMap: function (docMapID) {
            var me = this;
            if (me.lock === 1)
                return;
            me.lock = 1;
            me._resetContextIfInvalid();
            forerunner.ajax.getJSON(me.options.reportViewerAPI + "/NavigateTo/",
                {
                    NavType: navigateType.docMap,
                    SessionID: me.sessionID,
                    UniqueID: docMapID,
                    instance: me.options.rsInstance,
                },
                function (data) {
                    me.backupCurPage(false,true);
                    me.hideDocMap();
                    me._loadPage(data.NewPage, false, docMapID);
                },
                function (jqXHR, textStatus, errorThrown, request) { me.lock = 0; me._writeError(jqXHR, textStatus, errorThrown, request); }
            );
        },
        /**
         * Push the current page into the action history stack
         *
         * @function $.forerunner.reportViewer#backupCurPage
         *
         * @param {Boolean} flushCache - Specify flushCache status
         * @param {Boolean} useSavedLocation - Whether used saved location
         */
        backupCurPage: function (flushCache,useSavedLocation) {
            var me = this;

            var top, left, savedParams;
            var parameterModel = null;

            if (flushCache !== true)
                flushCache = false;

            if (useSavedLocation === true) {
                top = me.savedTop;
                left = me.savedLeft;
            }
            else {
                top = $(window).scrollTop();
                left = $(window).scrollLeft();
            }

            if (me.paramLoaded) {
                var $paramArea = me.options.paramArea;
                //get current parameter list without validate
                savedParams = $paramArea.reportParameter("getParamsList", true);
            }

            if (me.options.parameterModel)
                parameterModel = me.options.parameterModel.parameterModel("getModel");

            me.actionHistory.push({
                ReportPath: me.reportPath, SessionID: me.sessionID, CurrentPage: me.curPage, ScrollTop: top,
                ScrollLeft: left, FlushCache: flushCache, paramLoaded: me.paramLoaded, savedParams: savedParams,
                reportStates: me.reportStates, renderTime: me.renderTime, reportPages: me.pages, paramDefs: me.paramDefs,
                credentialDefs: me.credentialDefs, savedCredential: me.datasourceCredentials, renderError: me.renderError,
                parameterModel: parameterModel
            });

            me._clearReportViewerForDrill();
            me._trigger(events.actionHistoryPush, null, { path: me.reportPath });
        },
        _clearReportViewerForDrill: function () {
            //clean current report's property that not all reports have
            //when drill to another report or drill back
            var me = this;

            me.datasourceCredentials = null;
            me.credentialDefs = null;
        },
        _setScrollLocation: function (top, left) {
            var me = this;
            me.scrollLeft = left;
            me.scrollTop = top;
        },
        /**
         * Find the given keyword. Find will always find the first matched
         *
         * @function $.forerunner.reportViewer#find
         *
         * @param {String} keyword - Keyword to find
         * @param {Integer} startPage - Starting page of the search range
         * @param {Integer} endPage - Ending page of the search range
         * @param {Boolean} findInNewPage - Find in new page not current
         */
        find: function (keyword, startPage, endPage, findInNewPage) {
            var me = this;
            if (keyword === "") return;
            me._resetContextIfInvalid();
            //input new keyword
            if (!me.findKeyword || me.findKeyword !== keyword) {
                me.resetFind();
                me.findKeyword = keyword;
            }

            me._trigger(events.find);

            if (me.finding && !findInNewPage) {
                me._findNext(keyword);
            }
            else {
                if (startPage === undefined)
                    startPage = me.getCurPage();

                if (endPage === undefined)
                    endPage = me.getNumPages() === 0 ? 2147483647 : me.getNumPages(); //if page number === 0 then set Int32.MaxValue in C# to it

                if (startPage > endPage) {
                    me.resetFind();
                    me._showMessageBox(me.locData.messages.completeFind, me._findDone);
                    return;
                }

                //markup find start page
                if (me.findStartPage === null)
                    me.findStartPage = startPage;

                forerunner.ajax.getJSON(me.options.reportViewerAPI + "/FindString/",
                    {
                        SessionID: me.sessionID,
                        StartPage: startPage,
                        EndPage: endPage,
                        FindValue: keyword,
                        instance: me.options.rsInstance,
                    },
                    function (data) {
                        if (data.NewPage !== 0) {//keyword exist
                            me.finding = true;
                            if (data.NewPage !== me.getCurPage()) {
                                me._addSetPageCallback(function () { me._setFindHighlight(keyword); });
                                me.pages[data.NewPage] = null;
                                me._loadPage(data.NewPage, false);
                            } else {
                                me._setFindHighlight(keyword);
                            }
                        }
                        else {//keyword not exist
                            if (me.findStartPage !== 1) {
                                me.findEndPage = me.findStartPage - 1;
                                me.find(keyword, 1, me.findEndPage, true);
                                me.findStartPage = 1;
                            }
                            else {
                                if (me.finding === true)
                                    me._showMessageBox(me.locData.messages.completeFind, me._findDone);
                                else
                                    me._showMessageBox(me.locData.messages.keyNotFound, me._findDone);
                                me.resetFind();
                            }
                        }
                    },
                    function (jqXHR, textStatus, errorThrown, request) { me._writeError(jqXHR, textStatus, errorThrown, request); }
                );
            }
        },
        _findNext: function (keyword) {
            var me = this;

            $(".fr-render-find-keyword").filter(".fr-render-find-highlight").first().removeClass("fr-render-find-highlight");

            var $nextWord = $(".fr-render-find-keyword").filter(":visible").filter(".Unread").first();
            if ($nextWord.length > 0) {
                $nextWord.removeClass("Unread").addClass("fr-render-find-highlight").addClass("Read");
                me._trigger(events.navToPosition, null, { top: $nextWord.offset().top - 150, left: $nextWord.offset().left - 250 });
            }
            else {
                if (me.getNumPages() === 1) {
                    me._showMessageBox(me.locData.messages.completeFind, me._findDone);
                    me.resetFind();
                    return;
                }
                var endPage = me.findEndPage ? me.findEndPage : me.getNumPages() === 0 ? 2147483647 : me.getNumPages(); //if page number === 0 then set Int32.MaxValue in C# to it;

                if (me.getCurPage() + 1 <= endPage){
                    me.find(keyword, me.getCurPage() + 1, endPage, true);
                }
                else if (me.findStartPage > 1) {
                    me.findEndPage = me.findStartPage - 1;
                    if (me.getCurPage() === me.findEndPage) {
                        me._showMessageBox(me.locData.messages.completeFind, me._findDone);
                        me.resetFind();
                    }
                    else {
                        me.find(keyword, 1, me.findEndPage, true);
                    }
                }
                else {
                    me._showMessageBox(me.locData.messages.completeFind, me._findDone);
                    me.resetFind();
                }
            }
        },       
        _setFindHighlight: function (keyword) {
            var me = this;
            me._clearHighLightWord();
            me._highLightWord(me.$reportContainer, keyword);

            //Highlight the first match.
            var $item = me.$reportContainer.find(".fr-render-find-keyword").filter(":visible").filter(".Unread").first();
            if ($item.length > 0) {
                $item.removeClass("Unread").addClass("fr-render-find-highlight").addClass("Read");
                me._trigger(events.navToPosition, null, { top: $item.offset().top - 150, left: $item.offset().left - 250 });
            }
        },
        _findDone: function (me) {
            me._trigger(events.findDone);
        },
        _showMessageBox: function (message, preFunc, afterFunc) {
            var me = this;

            if (typeof preFunc === "function") {
                preFunc(me);
            }

            forerunner.dialog.showMessageBox(me.options.$appContainer, message);

            if (typeof afterFunc === "function") {
                afterFunc(me);
            }
        },
        /**
         * Resets the find state
         *
         * @function $.forerunner.reportViewer#resetFind
         */
        resetFind: function () {
            var me = this;
            me.finding = false;
            me.findKeyword = null;
            me.findStartPage = null;
            me.findEndPage = null;
        },
        /**
         * Export the report in the given format
         *
         * @function $.forerunner.reportViewer#exportReport
         *
         * @param {String} exportType - Export format
         * @see forerunner.ssr.constants
         */
        exportReport: function (exportType) {
            var me = this;
            me._resetContextIfInvalid();
            var url = me.options.reportViewerAPI + "/ExportReport/?ReportPath=" + me.getReportPath() + "&SessionID=" + me.getSessionID() + "&ExportType=" + exportType;
            if (me.options.rsInstance) url += "&instance=" + me.options.rsInstance;
            window.open(url);
        },       
        /**
         * Show print dialog, close it if opened
         *
         * @function $.forerunner.reportViewer#showPrint
         */
        showPrint: function () {
            var me = this;
            if (me.$printDialog) {
                me.$printDialog.reportPrint("openDialog");
            }
        },
        editEmailSubscription : function(subscriptionID) {
            var me = this;
            if (!me.showSubscriptionUI()) return;
            me._setEmailSubscriptionUI();
            if (me.$emailSub) {
                me.$emailSub.emailSubscription("option", "reportPath", me.getReportPath());

                var paramList = null;
                if (me.paramLoaded) {
                    var $paramArea = me.options.paramArea;
                    //get current parameter list without validate
                    paramList = $paramArea.reportParameter("getParamsList", true);
                }
                if (paramList)
                    me.$emailSub.emailSubscription("option", "paramList", paramList);
                me.$emailSub.emailSubscription("loadSubscription", subscriptionID);
                me.$emailSub.emailSubscription("openDialog");
            }
        },
        showEmailSubscription : function (subscriptionID) {
            var me = this;
            if (!me.showSubscriptionUI()) return;
            me._setEmailSubscriptionUI();
            if (me.$emailSub) {
                me.$emailSub.emailSubscription("option", "reportPath", me.getReportPath());
                $.when(me.$emailSub.emailSubscription("getSubscriptionList"))
                    .done(function (data) {
                        if (data.length == 0) {
                            me.editEmailSubscription(null);
                        } else if (data.length == 1) {
                            me.editEmailSubscription(data[0].SubscriptionID);
                        } else {
                            me.manageSubscription();
                        }
                    })
                    .fail(function() { me._showEmailSubscriptionDialog(null); });
            }
        },
        manageSubscription : function() {
            var me = this;
            if (!me.showSubscriptionUI()) return;
            me._setManageSubscriptionUI();
            if (me.$manageSub) {
                me.$manageSub.manageSubscription("option", "reportPath", me.getReportPath());
                me.$manageSub.manageSubscription("listSubscriptions", null);
                me.$manageSub.manageSubscription("openDialog");
            }
        },
        /**
         * Print current reprot in PDF format
         *
         * @function $.forerunner.reportViewer#printReport
         *
         * @param {String} printPropertyList - Page layout option
         */
        printReport: function (printPropertyList) {
            var me = this;
            me._resetContextIfInvalid();
            var url = me.options.reportViewerAPI + "/PrintReport/?ReportPath=" + me.getReportPath() + "&SessionID=" + me.getSessionID() + "&PrintPropertyString=" + printPropertyList;
            if (me.options.rsInstance) url += "&instance=" + me.options.rsInstance;

            if ((forerunner.device.isFirefox() && forerunner.config.getCustomSettingsValue("FirefoxPDFbug", "on").toLowerCase() === "on") || forerunner.device.isMobile()) {
                window.open(url);
            }
            else {
                var pif = me.element.find(".fr-print-iframe");
                if (pif.length === 1) pif.detach();

                var pif = $("<iframe/>");
                pif.addClass("fr-print-iframe");
                pif.attr("name", me.viewerID);
                pif.attr("src", url);
                pif.hide();
                me.element.append(pif);
            }
        },
        _setPrint: function (pageLayout) {
            var me = this;
            me.$printDialog = me.options.$appContainer.find(".fr-print-section");
            if (widgets.hasWidget(me.$printDialog, widgets.reportPrint)) {
                me.$printDialog.reportPrint("setPrint", pageLayout);
            }
        },
        _setEmailSubscriptionUI : function() {
            var me = this;
            if (!me.$emailSub)
                me.$emailSub = me.options.$appContainer.find(".fr-emailsubscription-section");
        },
        _setManageSubscriptionUI: function () {
            var me = this;
            if (!me.$manageSub)
                me.$manageSub = me.options.$appContainer.find(".fr-managesubscription-section");
        },
       
        //Page Loading
        _onModelSetChanged: function (e, savedParams) {
            var me = this;
            //since we load a new page we should change page number to 1
            //var pageNum = me.getCurPage();
            if (savedParams) {
                me.refreshParameters(savedParams, true, 1);
            }
        },
        _getSavedParams : function(orderedList) {
            for(var i = 0; i < orderedList.length; i++) {
                    if (orderedList[i]) return orderedList[i];
                }
            return null;
        },
        _loadParameters: function (pageNum, savedParamFromHistory, submitForm) {
            var me = this;
            var savedParams = me._getSavedParams([savedParamFromHistory, me.savedParameters, 
                me.options.parameterModel ? me.options.parameterModel.parameterModel("getCurrentParameterList", me.reportPath) : null]);

            if (submitForm === undefined)
                submitForm = true;

            if (savedParams) {
                if (me.options.paramArea) {
                    me.options.paramArea.reportParameter({
                        $reportViewer: this,
                        $appContainer: me.options.$appContainer
                    });
                    
                    if (submitForm === false) {
                        me._loadPage(pageNum, false, null, null, false);
                        me.options.paramArea.reportParameter("setsubmittedParamsList", savedParams);
                    }
                    else
                        me.refreshParameters(savedParams, submitForm, pageNum, false);
                        
                }
            } else {
                me._loadDefaultParameters(pageNum);
            }
        },
        _paramsToString: function (a) {
            return JSON.stringify(a);
        },
        _loadDefaultParameters: function (pageNum) {
            var me = this;
            forerunner.ajax.ajax({
                type: "POST",
                url: me.options.reportViewerAPI + "/ParameterJSON/",
                data: {
                    ReportPath: encodeURIComponent(me.reportPath),
                    SessionID: me.getSessionID(),
                    ParameterList: null,
                    DSCredentials: me.getDataSourceCredential(),
                    instance: me.options.rsInstance,
                },
                dataType: "json",
                async: false,
                done: function (data) {
                    if (data.Exception) {
                        me._renderPageError(me.$reportContainer, data);
                        me.removeLoadingIndicator();
                    } else {
                        if (data.SessionID)
                            me.sessionID = data.SessionID;
                        me._addLoadingIndicator();
                        me._showParameters(pageNum, data);
                    }
                },
                fail: function (jqXHR, textStatus, errorThrown, request) {
                    me._writeError(jqXHR, textStatus, errorThrown, request);                                        
                }
            });
        },

        _showParameters: function (pageNum, data) {
            var me = this;
            
            if (data.Type === "Parameters") {
                me._removeParameters();
                me.$reportContainer.find(".Page").detach();
                
                var $paramArea = me.options.paramArea;
                if ($paramArea) {
                    me.paramDefs = data;
                    $paramArea.reportParameter({ $reportViewer: this, $appContainer: me.options.$appContainer });
                    $paramArea.reportParameter("writeParameterPanel", data, pageNum);
                    me.$numOfVisibleParameters = $paramArea.reportParameter("getNumOfVisibleParameters");
                    if (me.$numOfVisibleParameters > 0)
                        me._trigger(events.showParamArea, null, { reportPath: me.reportPath});

                    me.paramLoaded = true;
                    me.$paramarea = me.options.paramArea;
                }
            }
            else if (data.Exception) {
                me._renderPageError(me.$reportContainer, data);
                me.removeLoadingIndicator();
            }
            else {
                me._loadPage(pageNum, false);
            }
        },
        /**
         * Refresh the parameter using the given list
         *
         * @function $.forerunner.reportViewer#refreshParameters
         *
         * @param {String} Parameter list.
         * @param {Boolean} Submit form if the parameters are satisfied.
         * @param {Integer} The page to load.  Specify -1 to load the current page.
         * @param {Boolean} Whether to trigger show parameter area event if there are visible parameters.
         * @param {Boolean} Indicate it's a cascading refresh or whole refresh
         */
        refreshParameters: function (paramList, submitForm, pageNum, renderParamArea, isCascading) {
            var me = this;
            if (pageNum === -1) {
                pageNum = me.getCurPage();
            }
            if (paramList) {
                forerunner.ajax.ajax({
                    type: "POST",
                    url: me.options.reportViewerAPI + "/ParameterJSON",
                    data : {
                        ReportPath: encodeURIComponent(me.reportPath),
                        SessionID: me.getSessionID(),
                        ParameterList: paramList,
                        DSCredentials: me.getDataSourceCredential(),
                        instance: me.options.rsInstance,
                    },
                    dataType: "json",
                    async: false,
                    success: function (data) {
                        if (data.Exception) {
                            me._renderPageError(me.$reportContainer, data);
                            me.removeLoadingIndicator();
                        } else {
                            if (data.SessionID)
                                me.sessionID = data.SessionID;
                            me._updateParameterData(data, submitForm, pageNum, renderParamArea, isCascading);
                        }
                    }
                });
            }
        },
        _updateParameterData: function (paramData, submitForm, pageNum, renderParamArea, isCascading) {
            var me = this;
            if (paramData) {
                me.paramDefs = paramData;
                me.options.paramArea.reportParameter("updateParameterPanel", paramData, submitForm, pageNum, renderParamArea, isCascading);
                me.$numOfVisibleParameters = me.options.paramArea.reportParameter("getNumOfVisibleParameters");
                if (me.$numOfVisibleParameters > 0) {
                    me._trigger(events.showParamArea, null, { reportPath: me.reportPath });
                }
                me.paramLoaded = true;
                me.$paramarea = me.options.paramArea;
            }
        },
        _removeParameters: function () {
            var me = this;
            if (me.paramLoaded === true) {
                var $paramArea = me.options.paramArea;
                if ($paramArea) {
                    $paramArea.reportParameter("removeParameter");
                    me.paramLoaded = false;
                    me.$numOfVisibleParameters = 0;
                }
            }
        },
        _resetViewer: function(isSameReport){
            var me = this;

            //me.sessionID = "";
            me.numPages = 0;
            me.floatingHeaders = [];
            if (!isSameReport) {
                me.paramLoaded = false;
                me._removeAutoRefreshTimeout();
                me.SaveThumbnail = false;
                me.RDLExtProperty = null;
            }
            me.scrollTop = 0;
            me.scrollLeft = 0;
            me.finding = false;
            me.findStartPage = null;
            me.hasDocMap = false;
            me.docMapData = null;
            me.togglePageNum = 0;
            me.findKeyword = null;
            me.origionalReportPath = "";
            me.renderError = false;            
            me.reportStates = { toggleStates: new forerunner.ssr.map(), sortStates: [] };
        },
        _reloadFromSessionStorage: function () {
            var me = this;
            if (sessionStorage.forerunner_zoomReload_actionHistory) {
                var zoomReloadStringData = sessionStorage.forerunner_zoomReload_actionHistory;
                delete sessionStorage.forerunner_zoomReload_actionHistory;
                var zoomReloadData = JSON.parse(zoomReloadStringData);
                if (zoomReloadData.actionHistory) {
                    me.actionHistory = zoomReloadData.actionHistory;
                    me.back();
                    return true;
                }
            }
            return false;
        },
        /**
         * Load the given report
         *
         * @function $.forerunner.reportViewer#loadReport
         *
         * @param {String} reportPath - Path to the specific report
         * @param {Integer} pageNum - Starting page number
         * @param {Object} savedParameters - Saved parameters
         */
        loadReport: function (reportPath, pageNum, savedParameters) {
            var me = this;
            
            me._checkPermission(reportPath);
            me._trigger(events.preLoadReport, null, { viewer: me, oldPath: me.reportPath, newPath: reportPath, pageNum: pageNum });

            if (me._reloadFromSessionStorage()) {
                me._trigger(events.afterLoadReport, null, { viewer: me, reportPath: me.getReportPath(), sessionID: me.getSessionID() });
                return;
            }

            if (me.reportPath && me.reportPath !== reportPath) {
                //Do some clean work if it's a new report
                me.backupCurPage(true);
                me.sessionID = "";
                me.flushCache();
                me.hideDocMap();
                me.element.unmask();
            }
            
            me._resetViewer();
            
            me.reportPath = reportPath ? reportPath : "/";
            me.pageNum = pageNum ? pageNum : 1;
            me.savedParameters = savedParameters ? savedParameters : null;

            //See if we have RDL extensions
            me._getRDLExtProp();

            if (me.options.jsonPath) {
                me._renderJson();
            } else {
                me._loadParameters(me.pageNum);
            }

            me._addSetPageCallback(function () {
                //_loadPage is designed to async so trigger afterloadreport event as set page down callback
                me._trigger(events.afterLoadReport, null, { viewer: me, reportPath: me.getReportPath(), sessionID: me.getSessionID() });
            });
        },
        _getRDLExtProp: function () {
            var me = this;

            forerunner.ajax.ajax(
               {
                   type: "GET",
                   dataType: "json",
                   url: forerunner.config.forerunnerAPIBase() + "ReportManager/ReportProperty/",
                   data: {
                       path: encodeURIComponent(me.reportPath),
                       propertyName: "ForerunnerRDLExt",
                       instance: me.options.rsInstance,
                   },
                   success: function (data) {
                       me.RDLExtProperty = data;
                   },
                   async: false
               });
        },
        /**
         * Load current report with the given parameter list
         *
         * @function $.forerunner.reportViewer#loadReportWithNewParameters
         *
         * @param {Object} paramList - Parameter list object
         * @param {Integer} pageNum - The page to load
         */
        loadReportWithNewParameters: function (paramList, pageNum) {
            var me = this;
           
            me._resetViewer(true);
            me.renderTime = new Date().getTime();
            if (!pageNum) {
                pageNum = 1;
            }
            me._loadPage(pageNum, false, null, paramList, true);
        },
        /**
        * Load current report with the given datasource credential list
        *
        * @function $.forerunner.reportViewer#loadReportWithCustomDSCredential
        *
        * @param {Object} credentialList - datasource credential list object
        */
        loadReportWithCustomDSCredential: function (credentialList) {
            var me = this;

            if (me.getDataSourceCredential()) {
                //reset current credential before next load
                me._resetDSCredential();
            }
            me.datasourceCredentials = credentialList;

            if (me.paramLoaded) {
                var paramList = me.options.paramArea.reportParameter("getParamsList");
                me._loadPage(1, false, null, paramList, true);
            }
            else {
                me.loadReport(me.getReportPath(), 1);
            }
        },
        _resetDSCredential: function () {
            var me = this;
            me.flushCache();
            
            me.sessionID = null;

            var errorpage = me.$reportContainer.find(".Page");
            if (errorpage)
                errorpage.detach();

            me._trigger(events.resetCredential, null, { paramLoaded: me.paramLoaded });
        },
        _renderJson : function () {
            var me = this;
            var newPageNum = 1;
            var loadOnly = false;

            if (!me.element.is(":visible") && !loadOnly)
                me.element.show(); //scrollto does not work with the slide in functions:(

            me._addLoadingIndicator();
            me.togglePageNum = newPageNum;
            forerunner.ajax.ajax(
                {
                    type: "GET",
                    dataType: "json",
                    url: me.options.jsonPath,
                    async: false,
                    done: function (data) {
                        me._writePage(data, newPageNum, loadOnly);
                        if (!loadOnly) {
                            if (data.ReportContainer) {
                                me._setPrint(data.ReportContainer.Report.PageContent.PageLayoutStart);
                            }

                            if (!me.element.is(":visible"))
                                me.element.show();  //scrollto does not work with the slide in functions:(                            

                            me._updateTableHeaders(me);
                        }
                    },
                    fail: function (jqXHR, textStatus, errorThrown, request) { me._writeError(jqXHR, textStatus, errorThrown, request); }
                });
        },
        _loadPage: function (newPageNum, loadOnly, bookmarkID, paramList, flushCache, respToggleReplay, scrollID) {
            var me = this;

            if (flushCache === true)
                me.flushCache();

            if (me.pages[newPageNum])
                if (me._getPageContainer(newPageNum)) {
                    if (!loadOnly) {                        
                        me._setPage(newPageNum);
                        if (!me.element.is(":visible") && !loadOnly)
                            me.element.show(0); //scrollto does not work with the slide in functions:(                        
                        if (bookmarkID)
                            me._navToLink(bookmarkID);
                        if (me.pages[newPageNum].reportObj.ReportContainer && me.pages[newPageNum].reportObj.ReportContainer.Report.AutoRefresh) // reset auto refresh if exist.
                            me._setAutoRefresh(me.pages[newPageNum].reportObj.ReportContainer.Report.AutoRefresh);
                        if (flushCache !== true)
                            me._cachePages(newPageNum);
                        if (scrollID) {
                            el = me.element.find("div[data-uniqName=\"" + scrollID + "\"]")
                            if (el.length ===1)
                                $('html, body').animate({ scrollTop: el.offset().top }, 500);
                        }

                    }
                    return;
                }
            if (!paramList) paramList = "";

            if (!loadOnly) {
                me._addLoadingIndicator();
            }
            me.togglePageNum = newPageNum;            
            forerunner.ajax.ajax(
                {
                    type: "POST",
                    dataType: "json",
                    url: me.options.reportViewerAPI + "/ReportJSON/",
                    data: {
                        ReportPath: encodeURIComponent(me.reportPath),
                        SessionID: me.sessionID,
                        PageNumber: newPageNum,
                        ParameterList: paramList,
                        DSCredentials: me.getDataSourceCredential(),
                        instance: me.options.rsInstance,
                    }, 
                    async: true,
                    done: function (data) {
                        me._writePage(data, newPageNum, loadOnly);
                        if (!loadOnly) {
                            if (data.ReportContainer) {
                                me._setPrint(data.ReportContainer.Report.PageContent.PageLayoutStart);
                            }

                            if (!me.element.is(":visible"))
                                me.element.show();  //scrollto does not work with the slide in functions:(                            
                            if (bookmarkID)
                                me._navToLink(bookmarkID);
                            if (flushCache !== true)
                                me._cachePages(newPageNum);
                            if (respToggleReplay)
                                me._getPageContainer(newPageNum).reportRender("replayRespTablix", respToggleReplay);

                            //$(window).scrollLeft(me.scrollLeft);
                            //$(window).scrollTop(me.scrollTop);
                            if (scrollID) {
                                el = me.element.find("div[data-uniqName=\"" + scrollID + "\"]")
                                if (el.length === 1)
                                    $('html, body').animate({ scrollTop: el.offset().top-50 }, 500);
                            }
                            me._updateTableHeaders(me);
                            me._saveThumbnail();
                        }
                    },
                    fail: function (jqXHR, textStatus, errorThrown, request) { me._writeError(jqXHR, textStatus, errorThrown, request); }
                });
        },
        _writeError: function (jqXHR, textStatus, errorThrown,request) {
            var me = this;

            var data = { Exception: 
                {
                    DetailMessage: errorThrown,
                    Type: "Error",
                    TargetSite: request.url,
                    Source: "" ,
                    Message: textStatus,
                    StackTrace: JSON.stringify(request)
                }                        
            };

            me._renderPageError(me.$reportContainer, data);
        },
        _getPageContainer: function(pageNum) {
            var me = this;
            if (!me.pages[pageNum].$container) {
                me.pages[pageNum].$container = $("<div class='Page'/>");
                var responsiveUI = false;
                if (me.options.userSettings && me.options.userSettings.responsiveUI === true) {
                    responsiveUI = true;
                }
                me.pages[pageNum].$container.reportRender({ reportViewer: me, responsive: responsiveUI, renderTime: me.renderTime });
            }

            return me.pages[pageNum].$container;
        },
        _writePage: function (data, newPageNum, loadOnly) {
            var me = this;
            //Error, need to handle this better
            if (!data) return;
            
            if (data.CredentialsRequired) {
                me._writeDSCredential(data);
                return;
            }

            if (!loadOnly && data.ReportContainer && data.ReportContainer.Report.AutoRefresh) {
                me._addSetPageCallback(function () {
                    me._setAutoRefresh(data.ReportContainer.Report.AutoRefresh);
                });
            }
             
            if (!me.pages[newPageNum]) {
                me.pages[newPageNum] = new reportPage(data);
            }
            else {
                me.pages[newPageNum].reportObj = data;
            }

            if (!data.SessionID)
                me.sessionID = "";
            else
                me.sessionID = data.SessionID;

            try {
                if (data.ReportContainer.NumPages === undefined)
                    me.numPages = 0;
                else
                    me.numPages = data.ReportContainer.NumPages;
            }
            catch (error) {
                me.numPages = 0;
            } 

            if (!loadOnly) {
                me._renderPage(newPageNum);
                me._setPage(newPageNum);
            }
        },

        _reLayoutPage: function(pageNum,force){
            var me = this;
            if (me.pages[pageNum] && me.pages[pageNum].needsLayout) {
                me.pages[pageNum].needsLayout = me.pages[pageNum].$container.reportRender("layoutReport", true, force, me.getRDLExt());                
            }
        },
        _renderPage: function (pageNum) {
            //Write Style
            var me = this;
            if (me.pages[pageNum] && me.pages[pageNum].isRendered === true)
                return;

            if (me.pages[pageNum].reportObj.Exception) {
                me._renderPageError(me._getPageContainer(pageNum), me.pages[pageNum].reportObj);
            }
            else {
                me.renderError = false;
                me.hasDocMap = me.pages[pageNum].reportObj.HasDocMap;

                //Render responsive if set
                var responsiveUI = false;
                if (me.options.userSettings && me.options.userSettings.responsiveUI === true) {
                    responsiveUI = true;
                }

                me._getPageContainer(pageNum).reportRender("render", me.pages[pageNum],false, me.RDLExtProperty);       
                me.pages[pageNum].needsLayout= true;
            }

            me.pages[pageNum].isRendered = true;
        },
        _renderPageError: function ($container, errorData) {
            var me = this;
            var pageNum = me.getCurPage();

            me.renderError = true;
            if (me.pages[pageNum])
                me.pages[pageNum].isRendered = false;

            $container.reportRender({ reportViewer: me });
            $container.reportRender("writeError", errorData);
            me.removeLoadingIndicator();
            me._trigger(events.renderError, null, errorData);
        },
        _writeDSCredential: function (data) {
            var me = this;
            me.flushCache();
            me._resetViewer(false);
            me.datasourceCredentials = null;
            me.credentialDefs = data;

            me.sessionID = data.SessionID;
            me.numPages = data.NumPages;
            me.curPage = 1;

            me.$credentialDialog = me.options.$appContainer.find(".fr-dsc-section");
            me.$credentialDialog.dsCredential("writeDialog", data.CredentialsList);
            me.showDSCredential();

            me._trigger(events.showCredential);
            me.removeLoadingIndicator();
        },
        /**
         * Show datasource dialog, close if opened
         *
         * @function $.forerunner.reportViewer#showDSCredential
         */
        showDSCredential: function () {
            var me = this;
            me.$credentialDialog.dsCredential("openDialog");
        },
        _sessionPing: function () {
            // Ping each report so that the seesion does not expire on the report server
            var me = this;

            if (me._sessionPingPost(me.sessionID) === false)
                me.sessionID = "";

            $.each(me.actionHistory, function (index, obj) {
                me._sessionPingPost(obj.SessionID);
            });

            },
        _sessionPingPost: function (sessionID) {
            var me = this;
            if (sessionID && sessionID !== "")
                forerunner.ajax.getJSON(me.options.reportViewerAPI + "/PingSession",
                    {
                        PingSessionID: sessionID,
                        instance: me.options.rsInstance,
                    },
                    function (data) {
                        if (data.Status === "Fail") {
                            return false;
                        }
                        else
                            return true;
                    },
                    function () { console.log("ping error"); }
                );
            },
        _updateTableHeaders: function (me) {
            // Update the floating headers in this viewer
            // Update the toolbar
            $.each(me.floatingHeaders, function (index, obj) {
                me._setRowHeaderOffset(obj.$tablix, obj.$rowHeader);
                me._setColHeaderOffset(obj.$tablix, obj.$colHeader);
            });
        },
        _hideTableHeaders: function () {
            // On a touch device hide the headers during a scroll if possible
            var me = this;
            $.each(me.floatingHeaders, function (index, obj) {
                if (obj.$rowHeader) obj.$rowHeader.css("visibility", "hidden");
                if (obj.$colHeader) obj.$colHeader.css("visibility", "hidden");
            });
            if (me.$floatingToolbar) me.$floatingToolbar.hide();
        },
        _navToLink: function (elementID) {
            var me = this;
            var navTo = me.element.find("[data-uniqName='" + elementID + "']")[0];
            if (navTo !== undefined) {
                //Should account for floating headers and toolbar height need to be a calculation
                var bookmarkPosition = { top: $(navTo).offset().top - 100, left: $(navTo).offset().left };
                
                //$(window).scrollTop(bookmarkPosition.top).scrollLeft(bookmarkPosition.left);
                //me.options.$appContainer.scrollTop(bookmarkPosition.top).scrollLeft(bookmarkPosition.left);
            
                me._trigger(events.navToPosition, null, bookmarkPosition);
            }
        },
        _stopDefaultEvent: function (e) {
            //IE
            if (window.ActiveXObject)
                window.event.returnValue = false;
            else {
                e.preventDefault();
                e.stopPropagation();
            }
        },
        _getHeight: function ($obj) {
            var height;

            var $copiedElem = $obj.clone()
                                .css({
                                    visibility: "hidden"
                                });

            //Image size cannot change so do not load.
            //$copiedElem.find("img").removeAttr("src");
            //$copiedElem.find("img").removeAttr("onload");
            //$copiedElem.find("img").removeAttr("alt");
            $copiedElem.find("img").remove();

            $("body").append($copiedElem);
            height = $copiedElem.height() + "px";

            $copiedElem.remove();

            //Return in mm
            return this._convertToMM(height);

        },
        _convertToMM: function (convertFrom) {

            if (!convertFrom)
                return 0;

            var unit = convertFrom.match(/\D+$/);  // get the existing unit
            var value = convertFrom.match(/\d+/);  // get the numeric component

            if (unit.length === 1) unit = unit[0];
            if (value.length === 1) value = value[0];

            switch (unit) {
                case "px":
                    return value / 3.78;
                case "pt":
                    return value * 0.352777777778;
                case "in":
                    return value * 25.4;
                case "mm":
                    return value;
                case "cm":
                    return value * 10;
                case "em":
                    return value * 4.2175176;
            }

            //This is an error
            return value;
        },
        _highLightWord: function ($element, keyword) {
            if (!keyword || keyword === "") {
                return;
            }
            else {
                var me = this;
                $($element).each(function () {
                    var elt = $(this).get(0);
                    elt.normalize();
                    $.each(elt.childNodes, function (i, node) {
                        //nodetype=3 : text node
                        if (node.nodeType === 3) {
                            var searchnode = node;
                            try{
                                var pos = searchnode.data.toUpperCase().indexOf(keyword.toUpperCase());

                                while (pos < searchnode.data.length) {
                                    if (pos >= 0) {
                                        //create a new span node with matched keyword text
                                        var spannode = document.createElement("span");
                                        spannode.className = "fr-render-find-keyword Unread";

                                        //split the match node
                                        var middlebit = searchnode.splitText(pos);
                                        searchnode = middlebit.splitText(keyword.length);

                                        //replace keyword text with span node 
                                        var middleclone = middlebit.cloneNode(true);
                                        spannode.appendChild(middleclone);
                                        node.parentNode.replaceChild(spannode, middlebit);
                                    }
                                    else {
                                        break;
                                    }
                                    pos = searchnode.data.toUpperCase().indexOf(keyword.toUpperCase());
                                }
                            } catch (error) { }
                        }
                        else {
                            me._highLightWord($(node), keyword);
                        }
                    });
                });
            }
            return $(this);
        },
        _clearHighLightWord: function () {
            $(".fr-render-find-keyword").each(function () {
                var text = document.createTextNode($(this).text());
                $(this).replaceWith($(text));
            });
        },
        _setAutoRefresh: function (period) {
            var me = this;
            
            //me.autoRefreshID will be set to undefined when report viewer destory.
            if (me.autoRefreshID !== undefined) {
                //one report viewer should has only one auto refresh, so clear previous setTimeout when new one come
                if (me.autoRefreshID !== null) {
                    me._removeAutoRefreshTimeout();
                    
                }
                me.autoRefreshID = setTimeout(function () {
                    if (me.lock === 1) {
                        //if report viewer is lock then set it again.
                        me._setAutoRefresh(period);
                        return;
                    }
                    else {
                        //restore privious scroll position
                        var containerTop = me.options.$appContainer.scrollTop();
                        var containerLeft = me.options.$appContainer.scrollLeft();
                        var windowTop = $(window).scrollTop();
                        var windowLeft = $(window).scrollLeft();
                        
                        me._addSetPageCallback(function () {
                            me.options.$appContainer.scrollTop(containerTop).scrollLeft(containerLeft);
                            $(window).scrollTop(windowTop).scrollLeft(windowLeft);
                        });

                        //close all opened dialog before report start refresh
                        forerunner.dialog.closeAllModalDialogs(me.options.$appContainer);

                        me.refreshReport(me.getCurPage());
                        //console.log("report: " + me.getReportPath() + " refresh at:" + new Date());
                    }

                    me.autoRefreshID = null;
                }, period * 1000);

                //console.log('add settimeout, period: ' + period + "s");
            }
        },
        showRDLExtDialog: function () {
            var me = this;

            var dlg = $(".fr-rdl-section",me.element).first();

            if (dlg.length ===0) {
                dlg = $("<div class='fr-rdl-section fr-dialog-id fr-core-dialog-layout fr-core-widget'/>");
                me.options.$appContainer.append(dlg);
                dlg.reportRDLExt({ reportViewer: me });
            }
            dlg.reportRDLExt("openDialog");
            
        },
        getRDLExt: function () {
            var me = this;

            return me.RDLExtProperty;

        },
        saveRDLExt: function (RDL) {
            var me = this;

            try {
                if (RDL.trim() !== "")
                    me.RDLExtProperty = jQuery.parseJSON(RDL);
                else
                    me.RDLExtProperty = {};
            }
            catch (e) {
                forerunner.dialog.showMessageBox(me.options.$appContainer, e.message,"Error Saving");                
                return false;
            }

            return forerunner.ajax.ajax(
               {
                   type: "POST",
                   dataType: "text",
                   url: forerunner.config.forerunnerAPIBase() + "ReportManager/SaveReportProperty/",
                   data: {
                       value:RDL,
                       path: me.reportPath,
                       propertyName: "ForerunnerRDLExt",
                       instance: me.options.rsInstance,
                   },
                   success: function (data) {
                       me._ReRender(true);
                       return true;
                   },
                   fail: function (data){
                       return false;
                   },
                   async: false
               });
            

        },

        _removeAutoRefreshTimeout: function () {
            var me = this;

            if (me.autoRefreshID !== null) {
                clearTimeout(me.autoRefreshID);
                //console.log('remove settimeout');
            }
            me.autoRefreshID = null;
        },
        /**
         * Show report tags dialog
         *
         * @function $.forerunner.reportViewer#showTags
         */
        showTags: function () {
            var me = this;
            me.$tagsDialog = me.options.$appContainer.find(".fr-tag-section");
            me.$tagsDialog.forerunnerTags("openDialog", me.getReportPath());
        },
        /**
         * Removes the reportViewer functionality completely. This will return the element back to its pre-init state.
         *
         * @function $.forerunner.dsCredential#destroy
         */
        destroy: function () {
            var me = this;

            me._removeAutoRefreshTimeout();
            me.autoRefreshID = undefined;

            if (me.$credentialDialog)
                me.$credentialDialog.dsCredential("destroy");

            if (me.$printDialog)
                me.$printDialog.reportPrint("destroy");

            if (me.$emailSub)
                me.$emailSub.emailSubscription("destroy");
            if (me.$paramarea) {
                me.$paramarea.reportParameter("destroy");
            }
            if (me.$RDLExtDialog) {
                me.$RDLExtDialog.reportRDLExt("destroy");
            }
            
            //console.log('report viewer destory is invoked')

            //comment from MSDN: http://msdn.microsoft.com/en-us/library/hh404085.aspx
            // if using jQuery UI 1.8.x
            //$.Widget.prototype.destroy.call(this);
            // if using jQuery UI 1.9.x
            this._destroy();
        },
    });  // $.widget

});   // $(function



///#source 1 1 /Forerunner/ReportExplorer/js/ParameterModel.js
// Assign or create the single globally scoped variable
var forerunner = forerunner || {};

// Forerunner SQL Server Reports objects
forerunner.ajax = forerunner.ajax || {};
forerunner.ssr = forerunner.ssr || {};
forerunner.ssr.constants = forerunner.ssr.constants || {};
forerunner.ssr.constants.events = forerunner.ssr.constants.events || {};

$(function () {
    var ssr = forerunner.ssr;
    var events = ssr.constants.events;
    var widgets = forerunner.ssr.constants.widgets;
    var locData = forerunner.localize.getLocData(forerunner.config.forerunnerFolder() + "ReportViewer/loc/ReportViewer");

    $.widget(widgets.getFullname(widgets.parameterModel), {
        options: {
            rsInstance: null,
        },
        _create: function () {
            var me = this;
            me.currentSetId = null;
            me.serverData = null;
            me.selectSetId = forerunner.helper.guidGen();
        },
        getNewSet: function (name, parameterList) {
            var newSet = {
                isAllUser: false,
                name: name,
                id: forerunner.helper.guidGen(),
                data: parameterList
            };
            return newSet;
        },
        isCurrentSetAllUser: function () {
            var me = this;
            if (me.serverData && me.serverData.parameterSets && me.currentSetId) {
                var set = me.serverData.parameterSets[me.currentSetId];
                return set.isAllUser;
            }
            return false;
        },
        canEditAllUsersSet: function () {
            var me = this;
            if (me.serverData) {
                return me.serverData.canEditAllUsersSet;
            }
            return false;
        },
        canUserSaveCurrentSet: function () {
            var me = this;
            if (me.serverData && me.serverData.canEditAllUsersSet) {
                return true;
            }

            return !me.isCurrentSetAllUser();
        },
        _addNewSet: function (name, parameterList) {
            var me = this;
            var newSet = me.getNewSet(name, parameterList);
            if (me.serverData === undefined || me.serverData === null) {
                me.serverData = {
                    canEditAllUsersSet: false,
                    defaultSetId: newSet.id,
                    parameterSets: {}
                };
            }
            me.serverData.parameterSets[newSet.id] = newSet;
            me.serverData.defaultSetId = newSet.id;
            me.currentSetId = newSet.id;

            return newSet;
        },
        // getModel is used to get the model state used with the report viewer action history
        getModel: function () {
            var me = this;
            return {
                serverData: me.cloneServerData(),
                reportPath: me.reportPath,
            };
        },
        // setModel restores the model state and triggers a Model change event
        setModel: function (modelData) {
            var me = this;
            me.serverData = modelData.serverData;
            me.reportPath = modelData.reportPath;
            me.currentSetId = null;
            me._triggerModelChange();
        },
        cloneServerData: function () {
            var me = this;
            if (me.serverData) {
                // Returns a deep clone of me.serverData
                return $.extend(true, {}, me.serverData);
            }

            return null;
        },
        applyServerData: function (applyData, lastAddedSetId) {
            var me = this;
            var id = null;

            // Save the default set id
            me.serverData.defaultSetId = applyData.defaultSetId;

            // First apply the modifications or additions
            for (id in applyData.parameterSets) {
                var modelSet = me.serverData.parameterSets[id];
                var applySet = applyData.parameterSets[id];
                if (modelSet) {
                    modelSet.isAllUser = applySet.isAllUser;
                    modelSet.name = applySet.name;
                } else {
                    me.serverData.parameterSets[id] = applySet;
                }
            }

            // Next handle any deletions
            var deleteArray = [];
            for (id in me.serverData.parameterSets) {
                if (!applyData.parameterSets.hasOwnProperty(id)) {
                    deleteArray.push(id);
                }
            }
            while (deleteArray.length > 0) {
                id = deleteArray.pop();
                delete me.serverData.parameterSets[id];
            }

            // save the results
            me._saveModel();


            // Set the current set and trigger the model changed event
            if (lastAddedSetId && lastAddedSetId != me.currentSetId) {
                me.currentSetId = lastAddedSetId;
            }

            var setCount = me.getSetCount(me.serverData);
            if (setCount === 0) {
                me.currentSetId = null;
                me.serverData.defaultSetId = null;
            }

            me._triggerModelChange();
        },
        getOptionArray: function (parameterSets) {
            var me = this;
            var optionArray = [];
            for (var id in parameterSets) {
                var set = parameterSets[id];
                optionArray.push({
                    id: set.id,
                    name: set.name
                });
            }
            optionArray.sort(function (a, b) {
                if (a.name > b.name) return 1;
                if (b.name > a.name) return -1;
                return 0;
            });
            // Add the "<select set>" option
            optionArray.unshift({
                id: me.selectSetId,
                name: locData.parameterModel.selectSet
            });
            return optionArray;
        },
        _modelChangeData: function () {
            var me = this;
            var data = {
                selectedId: me.currentSetId,
            };
            data.optionArray = me.getOptionArray(me.serverData.parameterSets);
            return data;
        },
        _triggerModelChange: function() {
            var me = this;
            me._trigger(events.modelChanged, null, me._modelChangeData());
        },
        _isLoaded: function (reportPath) {
            var me = this;
            return me.serverData !== null && me.reportPath === reportPath;
        },
        areSetsEmpty: function (serverData) {
            if (!serverData || !serverData.parameterSets) {
                return true;
            }

            for (var property in serverData.parameterSets) {
                return false;
            }

            return true;
        },
        getSetCount: function (serverData) {
            var count = 0;
            if (!serverData || !serverData.parameterSets) {
                return count;
            }

            for (var property in serverData.parameterSets) {
                count++;
            }

            return count;
        },
        _load: function (reportPath) {
            var me = this;
            var url = forerunner.config.forerunnerAPIBase() + "ReportManager" + "/GetUserParameters?reportPath=" + reportPath;
            if (me._isLoaded(reportPath)) {
                return;
            }
            if (me.options.rsInstance) url += "&instance=" + me.options.rsInstance;
            forerunner.ajax.ajax({
                url: url,
                dataType: "json",
                async: false,
                success: function (data) {
                    if (data.ParamsList !== undefined) {
                        // Add support for build 436 schema.
                        me._pushNewSet(locData.parameterModel.defaultName, (data.ParamsList instanceof Array) ? data : data.ParamsList);
                    }
                    else if (data) {
                        me.serverData = data;
                        if (!me.areSetsEmpty(me.serverData)) {
                            me.currentSetId = me.serverData.defaultSetId;
                        }
                        else {
                            // If the server returns back no sets then we need to clear out the current set id
                            me.currentSetId = null;
                        }
                    }
                    me.reportPath = reportPath;
                    me._triggerModelChange();
                },
                error: function (data) {
                    console.log("ParameterModel._load() - error: " + data.status);
                    me.currentSetId = null;
                    me.serverData = null;
                }
            });
        },
        _saveModel: function(success, error) {
            var me = this;
            var url = forerunner.config.forerunnerAPIBase() + "ReportManager" + "/SaveUserParameters";
            forerunner.ajax.post(
                url,
                {
                    reportPath: me.reportPath,
                    parameters: JSON.stringify(me.serverData),
                    Instance: me.options.rsInstance,
                },
                function (data, textStatus, jqXHR) {
                    if (success && typeof (success) === "function") {
                        success(data);
                    }
                },
                function (data, textStatus, jqXHR) {
                    if (error && typeof (error) === "function") {
                        error();
                    }
                });
        },
        save: function (parameterList, success, error) {
            var me = this;
            if (parameterList) {
                if (me.serverData === null || me.currentSetId === null) {
                    me._addNewSet(locData.parameterModel.defaultName, JSON.parse(parameterList));
                    me._triggerModelChange();
                } else {
                    me.serverData.parameterSets[me.currentSetId].data = JSON.parse(parameterList);
                }
                me._saveModel(success, error);
            }
        },
        setCurrentSet: function (id) {
            var me = this;
            if (id && me.serverData && me.serverData.parameterSets.hasOwnProperty(id)) {
                me.currentSetId = id;
                var parameterSet = me.serverData.parameterSets[id];
                if (parameterSet.data) {
                    me._trigger(events.modelSetChanged, null, JSON.stringify(parameterSet.data));
                }
                else {
                    me._trigger(events.modelSetChanged, null, null);
                }
            }
        },
        getCurrentParameterList: function (reportPath) {
            var me = this;
            var currentParameterList = null;
            me._load(reportPath);
            if (me.serverData) {
                var parameterSet;
                if (me.currentSetId) {
                    parameterSet = me.serverData.parameterSets[me.currentSetId];
                } else if (me.serverData.defaultSetId) {
                    me.currentSetId = me.serverData.defaultSetId;
                    parameterSet = me.serverData.parameterSets[me.serverData.defaultSetId];
                    me._triggerModelChange();
                } else {
                    return null;
                }
                if (parameterSet && parameterSet.data) {
                    currentParameterList = JSON.stringify(parameterSet.data);
                }
            }
            return currentParameterList;
        },
        getCurrentSet: function () {
            var me = this;
            if (me.serverData && me.currentSetId) {
                return me.serverData.parameterSets[me.currentSetId];
            }
            return null;
        }

    });  // $.widget(
});  // $(function ()

///#source 1 1 /Forerunner/Common/js/Toolbase.js
/**
 * @file Contains the toolBase widget.
 *
 */

var forerunner = forerunner || {};
forerunner.ssr = forerunner.ssr || {};

$(function () {
    var constants = forerunner.ssr.constants;
    var widgets = constants.widgets;
    var toolTypes = constants.toolTypes;
    var events = constants.events;

    var dropdownContainerClass = "fr-toolbase-dropdown-container";

    var getClassValue = function (textValue, defaultValue) {
        var returnText = defaultValue;
        if (typeof (textValue) !== "undefined") {
            returnText = "";
            if (textValue !== false && textValue !== null) {
                returnText = textValue;
            }
        }
        return returnText;
    };

    /**
     * The toolBase widget is used as a base namespace for toolbars and the toolPane
     *
     * @namespace $.forerunner.toolBase
     * @prop {Object} options - The options for toolBase
     * @prop {String} options.toolClass - The top level class for this tool (E.g., fr-toolbar)
     * @example
     * var widgets = {@link forerunner.ssr.constants.widgets};
     * $.widget(widgets.getFullname(widgets.toolbar), $.forerunner.toolBase, {
     *  options: {
     *      $reportViewer: null,
     *      toolClass: "fr-toolbar"
     *  },
     * });
     */
    $.widget(widgets.getFullname(widgets.toolBase), /** @lends $.forerunner.toolBase */ {
        options: {
            toolClass: null
        },

        /**
         * Add tools starting at index, enabled or disabled based upon the given tools array.
         * @function $.forerunner.toolBase#addTools
         *
         * @param {Integer} index - 1 based index of where to insert the button array.
         * @param {Boolean} enabled - true = enabled, false = disabled
         * @param {Array} tools - array containing the collection of tool information objects.
         * @example
         * var toolTypes = {@link forerunner.ssr.constants.toolTypes};
         * 
         * var btnMenu = {
         *  toolType: toolTypes.button,
         *  selectorClass: "fr-toolbar-menu-button",
         *  imageClass: "fr-icons24x24-menu",
         *  events: {
         *      click: function (e) {
         *          e.data.me._trigger(events.menuClick, null, {});
         *      }
         *  }
         * };
         * 
         * this.element.html("&lt;div class='" + me.options.toolClass + "'/>");
         * this.addTools(1, true, [btnMenu]);
         *
         *  Notes:
         *      Any events property that is of type function, e.g., "click" above will be interpreted
         *      as a event handler. The event, i.e., the name of the property will be bound to the button
         *      when the button is enabled and removed when the button is disabled.
         */
        addTools: function (index, enabled, tools) {
            var me = this;
            var $toolbar = me.element.find("." + me.options.toolClass);
            me._addChildTools($toolbar, index, enabled, tools);

            if (enabled) {
                me.enableTools(tools);
            }
            else {
                me.disableTools(tools);
            }
        },
        /**
         * Clears the allTools array. This function is useful when re-initializing a toolbar.
         *
         * @function $.forerunner.toolBase#removeAllTools
         */
        removeAllTools: function () {
            var me = this;
            me.allTools = me.allTools || {};
            me.allTools.length = 0;
        },
        /**
         * Configures the toolbar to hide / show buttons based upon the given configuration option
         *
         * @function $.forerunner.toolBase#configure
         */
        configure: function (toolbarConfigOption) {
            var me = this;
            me.toolbarConfigOption = toolbarConfigOption;
            $.each(me.allTools, function (Index, tool) {
                var $tool = me.element.find("." + tool.selectorClass);
                if ($tool.length > 0 && !me._isButtonInConfig($tool)) {
                    $tool.hide();
                }
            });
        },
        _configurations: function () {
            return [
                { name: constants.toolbarConfigOption.minimal, selectorClass: "fr-toolbase-config-minimal" },
                { name: constants.toolbarConfigOption.dashboardEdit, selectorClass: "fr-toolbase-config-edit" }
            ];
        },
        _isButtonInConfig: function ($tool) {
            var me = this;
            if (!me.toolbarConfigOption) {
                // Default is full so this case we always return true
                return true;
            }

            var found = false;
            $.each(me._configurations(), function (index, config) {
                if (me.toolbarConfigOption === config.name && $tool.hasClass(config.selectorClass)) {
                    // We must match the config name and have the selector class
                    found = true;
                }
            });

            // Otherwise this button is not in this configuration
            return found;
        },
        _addChildTools: function ($parent, index, enabled, tools) {
            var me = this;
            me.allTools = me.allTools || {};

            var $firstTool = $(me._getToolHtml(tools[0]));

            if (index <= 1) {
                $parent.prepend($firstTool);
            }
            else if (index > $parent.children().length) {
                $parent.append($firstTool);
            }
            else {
                var selector = ":nth-child(" + index + ")";
                var $child = $parent.children(selector);
                $child.before($firstTool);
            }

            var $tool = $firstTool;
            me._addChildTool($tool, tools[0], enabled);
            for (var i = 1; i < tools.length; i++) {
                var toolInfo = tools[i];
                if (toolInfo) {
                    $tool.after(me._getToolHtml(toolInfo));
                    $tool = $tool.next();
                    me._addChildTool($tool, toolInfo, enabled);
                } else {
                    throw new Error("Toolbase - addTools() Undefined tool, index: " + i + ", toolClass: " + me.options.toolClass);
                }
            }
        },
        _addChildTool: function ($tool, toolInfo, enabled) {
            var me = this;
            me.allTools[toolInfo.selectorClass] = toolInfo;
            if (toolInfo.toolType === toolTypes.toolGroup && toolInfo.tools) {
                me._addChildTools($tool, 1, enabled, toolInfo.tools);      // Add the children of a tool group
            }

            if (toolInfo.sharedClass) {
                $tool.addClass(toolInfo.sharedClass);
            }

            if (toolInfo.tooltip) {
                $tool.attr("title", toolInfo.tooltip);
            }

            if (toolInfo.dropdown) {
                me._createDropdown($tool, toolInfo);
            }

            if (toolInfo.toolType === toolTypes.select) {
                $tool.selectTool($.extend(me.options, { toolInfo: toolInfo, toolClass: "fr-toolbase-selectinner" }));
            }

            if (toolInfo.alwaysChange) {
                $tool.alwaysChange({ handler: toolInfo.alwaysChange, toolBase: me });
            }

            if (toolInfo.visible === false) {
                $tool.hide();
            }
        },
        _createDropdown: function ($tool, toolInfo) {
            var me = this;

            // Create the dropdown
            toolInfo.$dropdown = $("<div class='" + dropdownContainerClass + "'/>");
            toolInfo.$dropdown.toolDropdown({ $reportViewer: me.options.$reportViewer });
            toolInfo.$dropdown.toolDropdown("addTools", 1, true, toolInfo.tools);

            $tool.append(toolInfo.$dropdown);
            var $dropdown = $tool.find("." + dropdownContainerClass);
            var selectorClass = toolInfo.selectorClass;
            var imageClass = toolInfo.imageClass;

            // tool click event handler
            $tool.on("click", { toolInfo: toolInfo, $tool: $tool }, function (e) {
                $dropdown.css("left", e.data.$tool.filter(":visible").offset().left - e.data.$tool.filter(":visible").offsetParent().offset().left);
                //$dropdown.css("top", e.data.$tool.filter(":visible").offset().top + e.data.$tool.height());
                $dropdown.css("top", e.data.$tool.height() + e.data.$tool.filter(":visible").offset().top);
                $dropdown.toggle();
            });

            // dropdown dismiss handler
            $(document).on("click", function (e) {
                if ($dropdown.is(":visible") && !$(e.target).hasClass(selectorClass) && !$(e.target).hasClass(imageClass)) {
                    $dropdown.toggle();
                }
            });
        },
        /**
         * Return the tool object
         * @function $.forerunner.toolBase#getTool
         * @param {String} selectorClass - tool's class name
         *
         * @return {Object} - specify tool object
         */
        getTool: function (selectorClass) {
            var me = this;
            return me.allTools[selectorClass];
        },


        /**
        * Make tool visible
        * @function $.forerunner.toolBase#showTool
        * @param {String} selectorClass - tool's class name
        */
        showTool: function(selectorClass){
            var me = this;
            if (me.allTools[selectorClass]) {
                // NOTE: that you cannot know when hiding a tool if it should be made
                // visible in the showTool function. So the strategy here is to remove
                // the display style on the element and thereby revert the visibility
                // back to the style sheet definition.
                var $toolEl = me.element.find("." + selectorClass);

                if (me._isButtonInConfig($toolEl)) {
                    $toolEl.css({ "display": "" });
                }
            }
        },
        /**
         * Make all tools visible
         * @function $.forerunner.toolBase#showAllTools
         */
        showAllTools: function () {
            var me = this;

            $.each(me.allTools, function (Index, Obj) {
                if (Obj.selectorClass)
                    me.showTool(Obj.selectorClass);
            });

        },
        /**
        * Make tool hidden
        * @function $.forerunner.toolBase#hideTool
        * @param {String} selectorClass - tool's class name
        */
        hideTool: function (selectorClass) {
            var me = this;
            if (me.allTools[selectorClass]) {
                // NOTE: that you cannot know when hiding a tool if it should be made
                // visible in the showTool function. That is because a resize / orientation
                // change may happen that changes which buttons should be visible at the 
                // time showTool is called.
                var $toolEl = me.element.find("." + selectorClass);
                $toolEl.hide();
            }
        },
        /**
         * Make all tools hidden
         * @function $.forerunner.toolBase#hideAllTools
         */
        hideAllTools: function (){
            var me = this;
            $.each(me.allTools, function (Index, Obj) {
                if (Obj.selectorClass)
                    me.hideTool(Obj.selectorClass);
            });
        },
        /**
         * Enable or disable tool frozen
         * @function $.forerunner.toolBase#freezeEnableDisable
         * @param {Boolean} freeze - ture: enable, false: disable
         */
        freezeEnableDisable: function (freeze) {
            var me = this;
            me.frozen = freeze;
        },
        /**
         * Enable the given tools
         * @function $.forerunner.toolBase#enableTools
         * @param {Array} tools - Array of tools to enable
         */
        enableTools: function (tools) {
            var me = this;

            if (me.frozen === true) {
                return;
            }

            $.each(tools, function (index, toolInfo) {
                if (toolInfo) {
                    var $toolEl = me.element.find("." + toolInfo.selectorClass);
                    $toolEl.removeClass("fr-toolbase-disabled");
                    if (toolInfo.events) {
                        $toolEl.addClass("fr-core-cursorpointer");
                        me._removeEvent($toolEl, toolInfo);   // Always remove any existing event, this will avoid getting two accidentally
                        me._addEvents($toolEl, toolInfo);
                    }
                    if (toolInfo.toolType === toolTypes.toolGroup && toolInfo.tools) {
                        me.enableTools(toolInfo.tools);
                    }
                } else {
                    throw new Error("Toolbase - enableTools() Undefined tool, index: " + index + ", toolClass: " + me.options.toolClass);
                }
            });
        },
        /**
         * Disable the given tools
         * @function $.forerunner.toolBase#disableTools
         * @param {Array} tools - Array of tools to disable
         */
        disableTools: function (tools) {
            var me = this;

            if (me.frozen === true) {
                return;
            }

            $.each(tools, function (index, toolInfo) {
                if (toolInfo) {
                    var $toolEl = me.element.find("." + toolInfo.selectorClass);
                    $toolEl.addClass("fr-toolbase-disabled");
                    if (toolInfo.events) {
                        $toolEl.removeClass("fr-core-cursorpointer");
                        me._removeEvent($toolEl, toolInfo);
                    }
                    if (toolInfo.toolType === toolTypes.toolGroup && toolInfo.tools) {
                        me.disableTools(toolInfo.tools);
                    }
                } else {
                    throw new Error("Toolbase - disableTools() Undefined tool, index: " + index + ", toolClass: " + me.options.toolClass);
                }
            });
        },
        /**
        * Make all tools enable that where enabled before disable
        * @function $.forerunner.toolBase#enableAllTools
        */
        enableAllTools: function () {
            var me = this;

            $.each(me.allTools, function (Index, Tools) {
                if (Tools.selectorClass && me.allTools[Tools.selectorClass].isEnable) {
                    me.enableTools([Tools]);
                }
            });
        },
        /**
        * Make all tools disable and remember which ones where enabled
        * @function $.forerunner.toolBase#disableAllTools
        */
        disableAllTools: function () {
            var me = this;

            $.each(me.allTools, function (Index, Tools) {
                if (Tools.selectorClass) {
                    var $toolEl = me.element.find("." + Tools.selectorClass);
                    if (!$toolEl.hasClass("fr-toolbase-no-disable-id")) {
                        me.allTools[Tools.selectorClass].isEnable = !$toolEl.hasClass("fr-toolbase-disabled");
                        me.disableTools([Tools]);
                    }
                }
            });
        },
        onWindowResize: function () {
            var me = this;
            var smallClass = "." + me.options.toolClass + " .fr-toolbar-hidden-on-small";
            var mediumClass = "." + me.options.toolClass + " .fr-toolbar-hidden-on-medium";
            var largeClass = "." + me.options.toolClass + " .fr-toolbar-hidden-on-large";
            var veryLargeClass = "." + me.options.toolClass + " .fr-toolbar-hidden-on-very-large";

            // Remove any previously added fr-toolbar-hidden classes
            me.element.find(smallClass + ", " + mediumClass + ", " + largeClass + ", " + veryLargeClass).removeClass("fr-core-hidden");

            var width = me.element.width();
            if (width < 480) {
                me.element.find(smallClass).addClass("fr-core-hidden");
            } else if (width < 568) {
                me.element.find(mediumClass).addClass("fr-core-hidden");
            } else if (width < 768) {
                me.element.find(largeClass).addClass("fr-core-hidden");
            } else {  // Screen >= 769
                me.element.find(veryLargeClass).addClass("fr-core-hidden");
            }
        },
        _getToolHtml: function (toolInfo) {
            var me = this;

            // Get class string options
            var toolStateClass = getClassValue(toolInfo.toolStateClass, "fr-toolbase-state ");
            var iconClass = getClassValue(toolInfo.iconClass, "fr-icons24x24");
            var toolContainerClass = getClassValue(toolInfo.toolContainerClass, "fr-toolbase-toolcontainer");
            var groupContainerClass = getClassValue(toolInfo.groupContainerClass, "fr-toolbase-groupcontainer");
            var itemContainerClass = getClassValue(toolInfo.itemContainerClass, "fr-toolbase-itemcontainer");
            var itemTextContainerClass = getClassValue(toolInfo.itemTextContainerClass, "fr-toolbase-item-text-container");
            var itemTextClass = getClassValue(toolInfo.itemTextClass, "fr-toolbase-item-text");

            if (toolInfo.toolType === toolTypes.button) {
                return "<div class='" + toolContainerClass + " " + toolStateClass + toolInfo.selectorClass + "'>" +
                            "<div class='" + iconClass + " " + toolInfo.imageClass + "' />" +
                        "</div>";
            }
            else if (toolInfo.toolType === toolTypes.input) {
                var type = "";
                if (toolInfo.inputType) {
                    type = " type='" + toolInfo.inputType + "'";
                }
                return "<input class='" + toolInfo.selectorClass + "'" + type + " />";
            }
            else if (toolInfo.toolType === toolTypes.select) {
                return "<div class='fr-toolbase-selectcontainer' />";
            }
            else if (toolInfo.toolType === toolTypes.textButton) {
                return "<div class='" + toolContainerClass + " " + toolStateClass + toolInfo.selectorClass + "'>" + me._getText(toolInfo) + "</div>";
            }
            else if (toolInfo.toolType === toolTypes.plainText) {
                return "<span class='" + toolInfo.selectorClass + "'> " + me._getText(toolInfo) + "</span>";
            }
            else if (toolInfo.toolType === toolTypes.containerItem) {
                var text = "";
                if (toolInfo.text) {
                    text = me._getText(toolInfo);
                }

                var imageClass = getClassValue(toolInfo.imageClass, "");
                var rightImageDiv = "";
                if (toolInfo.rightImageClass) {
                    rightImageDiv = "<div class='fr-toolbase-rightimage " + toolInfo.rightImageClass + "'></div>";
                }
                var html = "<div class='" + itemContainerClass + " " + toolStateClass + toolInfo.selectorClass + "'>" +
                            "<div class='" + iconClass + " " + imageClass + "'></div>" +
                            "<div class='" + itemTextContainerClass + "'>" +
                                "<div class='" + itemTextClass + "'>" + text + "</div>" +
                            "</div>" +
                            rightImageDiv +
                            "</div>";
                return html;
            }
            else if (toolInfo.toolType === toolTypes.toolGroup) {
                return "<div class='" + groupContainerClass + " " + toolInfo.selectorClass + "'></div>";
            }
        },
        _getText: function (toolInfo) {
            var text;
            var me = this;

            if (typeof toolInfo.text === "function")
                text = toolInfo.text({ $reportViewer: me.options.$reportViewer });
            else
                text = toolInfo.text;
            return text;
        },
        _removeEvent: function ($toolEl, toolInfo) {
            var me = this;
            for (var key in toolInfo.events) {
                if (typeof toolInfo.events[key] === "function") {
                    $toolEl.off(key, toolInfo.events[key]);
                }
            }
        },
        _addEvents: function ($toolEl, toolInfo) {
            var me = this;
            for (var key in toolInfo.events) {
                if (typeof toolInfo.events[key] === "function") {
                    $toolEl.on(key, null, { me: me, $reportViewer: me.options.$reportViewer, $reportExplorer: me.options.$reportExplorer }, toolInfo.events[key]);
                }
            }
        },
        _destroy: function () {
        },
        _create: function () {
        },
        _init: function () {
            var me = this;
            //inilialize widget data
            me.frozen = false;
        }
    });  // $.widget

    // The alwaysChange widget enables a callback to always be called on a select element
    // even if the user selects the currently selected option.
    $.widget(widgets.getFullname("alwaysChange"), $.forerunner.toolBase, {
        options: {
            toolBase: null,
            handler: null
        },
        _create: function () {
            var me = this;
            var $select = me.element.find("select");
            var focusIndex = -1;
            $select.on("change", function (e) {
                focusIndex = -1;
                if (typeof me.options.handler === "function") {
                    e.data = { me: me.options.toolBase };
                    me.options.handler(e);
                }
            });
            $select.on("focus", function (e) {
                if ($select.prop("selectedIndex") !== 0 && focusIndex === -1) {
                    focusIndex = $select.prop("selectedIndex");
                    $select.prop("selectedIndex", 0);
                    // Blur does not work properly with IE 11
                    //$select.blur();

                    var resetSelected = function (e) {
                        if (!$select.is(e.target)) {
                            // Reset the selected index if no choice was made
                            if ($select.prop("selectedIndex") === 0) {
                                $select.prop("selectedIndex", focusIndex);
                            }
                            focusIndex = -1;
                            $('body').off("keyup mouseup", resetSelected);
                        }
                    };

                    $('body').off("keyup mouseup", resetSelected);
                    $('body').on("keyup mouseup", resetSelected);
                }
            });
        },
    });  // $widget

    // popup widget used with the showDrowpdown method
    $.widget(widgets.getFullname("toolDropdown"), $.forerunner.toolBase, {
        options: {
            $reportViewer: null,
            toolClass: "fr-toolbase-dropdown"
        },
        _init: function () {
            var me = this;
            me._super();

            me.element.html("<div class='" + me.options.toolClass + " fr-core-widget'/>");
        },
    });  // $widget

    // Defines a toolbar select tool widget
    $.widget(widgets.getFullname("selectTool"), {
        options: {
            toolClass: "fr-toolbase-selectinner",
        },
        _init: function () {
            var me = this;
            var optionClass = getClassValue(me.options.toolInfo.optionClass, "fr-toolbase-option");

            me.element.html("");
            var $selectContainer = $(
                "<div class='" + me.options.toolClass + " fr-core-widget'>" +
                    "<select class='" + me.options.toolInfo.selectorClass + "' readonly='true' ismultiple='false'></select>" +
                "</div>");
            me.element.append($selectContainer);
        },
        _create: function () {
            var me = this;
            if (me.options.toolInfo.model) {
                me.model = me.options.toolInfo.model.call(me);
                if (me.options.toolInfo.modelChange) {
                    me.model.on(me.options.toolInfo.modelChange, function (e, data) {
                        me._onModelChange.call(me, e, data);
                    });
                }
            }
        },
        _onModelChange: function (e, data) {
            var me = this;
            var $select = me.element.find("." + me.options.toolInfo.selectorClass);
            $select.html("");
            $.each(data.optionArray, function (index, option) {
                var encodedOptionName = forerunner.helper.htmlEncode(option.name);
                $option = $("<option value=" + option.id + ">" + encodedOptionName + "</option>");
                $select.append($option);
            });
            $select.children("option").each(function (index, option) {
                if ($(option).val() === data.selectedId) {
                    $select.prop("selectedIndex", index);
                }
            });
        }
    });  // $widget

});  // function()

///#source 1 1 /Forerunner/Common/js/MessageBox.js
/**
 * @file Contains the messgae box widget.
 *
 */

// Assign or create the single globally scoped variable
var forerunner = forerunner || {};

// Forerunner SQL Server Reports
forerunner.ssr = forerunner.ssr || {};

$(function () {
    var widgets = forerunner.ssr.constants.widgets;
    var events = forerunner.ssr.constants.events;

    /**
     * Widget used display the message box dialog
     *
     * @namespace $.forerunner.messageBox
     * @prop {Object} options - The options for Message Box
     * @prop {Object} options.$appContainer - The app container that messageBox belong to
     *
     * @example
     * $msgBox.messageBox({ 
     *    $appContainer: $appContainer 
     * });
     */
    $.widget(widgets.getFullname(widgets.messageBox), {
        options: {
            $appContainer: null
        },
        _create: function () {
            
        },
        _init: function () {
            var me = this;
            me.element.off(events.modalDialogGenericSubmit);
            me.element.off(events.modalDialogGenericCancel);

            var locData = forerunner.localize.getLocData(forerunner.config.forerunnerFolder() + "ReportViewer/loc/ReportViewer");
            $messageBox = new $(
                "<div class='fr-core-dialog-innerPage fr-core-center'>" +
                    "<div class='fr-messagebox-innerpage'>" +
                        "<div class='fr-core-dialog-header'>" +
                            "<div class='fr-messagebox-title'>" + locData.dialog.title + "</div>" +
                        "</div>" +
                        "<div class='fr-messagebox-content'>" +
                            "<span class='fr-messagebox-msg'/>" +
                        "</div>" +
                        "<div class='fr-core-dialog-submit-container'>" +
                            "<div class='fr-core-center'>" +
                                "<input name='close' type='button' class='fr-messagebox-close-id fr-messagebox-submit fr-core-dialog-button' value='" + locData.dialog.close + "' />" +
                            "</div>" +
                        "</div>" +
                    "</div>" +
                "</div>");

            me.element.append($messageBox);

            me.element.find(".fr-messagebox-close-id").on("click", function () {
                me.closeDialog();
            });

            me.element.on(events.modalDialogGenericSubmit, function () {
                me.closeDialog();
            });

            me.element.on(events.modalDialogGenericCancel, function () {
                me.closeDialog();
            });
        },
        /**
         * Open message box dialog
         *
         * @function $.forerunner.messageBox#openDialog
         * @param {String} msg - Message to show
         * @param {String} caption - Message box dialog caption
         */
        openDialog: function (msg, caption) {
            var me = this;

            me.element.find(".fr-messagebox-msg").text(msg);
            if (caption) {
                me.element.find(".fr-messagebox-title").text(caption);
            }

            forerunner.dialog.showModalDialog(me.options.$appContainer, me);
        },
        /**
         * Close current message box
         *
         * @function $.forerunner.messageBox#closeDialog
         */
        closeDialog: function () {
            var me = this;
            $(".fr-messagebox-msg").val();
            
            forerunner.dialog.closeModalDialog(me.options.$appContainer, me);
        }

    }); //$.widget
}); // $(function ()
///#source 1 1 /Forerunner/Common/js/DefaultAppTemplate.js
// Assign or create the single globally scoped variable
var forerunner = forerunner || {};

// Forerunner SQL Server Reports
forerunner.ssr = forerunner.ssr || {};

$(function () {
    var ssr = forerunner.ssr;
    var toolTypes = ssr.constants.toolTypes;
    var events = forerunner.ssr.constants.events;
    var widgets = forerunner.ssr.constants.widgets;

    // This class provides the default app template for our app.
    // The EZ Viewer widget should use this template
    // This is an internal class right now.
    ssr.DefaultAppTemplate = function (options) {
        var me = this;
        me.options = {
            $container: null,
            isFullScreen: true,
        };

        // Merge options with the default settings
        if (options) {
            $.extend(this.options, options);
        }
    };

    ssr.DefaultAppTemplate.prototype = {
        render: function () {
            var me = this;
            var $container = me.options.$container;
            $container.addClass("fr-layout-container");
            me.$container = $container;
            var $leftpane = new $("<div />");
            $leftpane.addClass("fr-layout-leftpane");
            me.$leftpane = $leftpane;
            var $leftheader = new $("<div />");
            $leftheader.addClass("fr-layout-leftheader");
            me.$leftheader = $leftheader;
            var $leftheaderspacer = new $("<div />");
            $leftheaderspacer.addClass("fr-layout-leftheaderspacer");
            me.$leftheaderspacer = $leftheaderspacer;
            var $leftpanecontent = new $("<div />");
            $leftpanecontent.addClass("fr-layout-leftpanecontent");
            me.$leftpanecontent = $leftpanecontent;
            $leftpane.append($leftheader);
            $leftpane.append($leftheaderspacer);
            $leftpane.append($leftpanecontent);
            $container.append($leftpane);
            //main view port
            var $mainviewport = new $("<div />");
            $mainviewport.addClass("fr-layout-mainviewport");
            me.$mainviewport = $mainviewport;
            $container.append($mainviewport);
            //top div
            var $topdiv = new $("<div />");
            $topdiv.addClass("fr-layout-topdiv");
            me.$topdiv = $topdiv;
            $mainviewport.append($topdiv);
            //route path link
            var $linksection = new $("<div />");
            $linksection.addClass("fr-layout-linksection");
            me.$linksection = $linksection;
            $topdiv.append($linksection);
            var $mainheadersection = new $("<div />");
            $mainheadersection.addClass("fr-layout-mainheadersection");
            me.$mainheadersection = $mainheadersection;
            $topdiv.append($mainheadersection);
            var $topdivspacer = new $("<div />");
            $topdivspacer.addClass("fr-layout-topdivspacer");
            me.$topdivspacer = $topdivspacer;
            $mainviewport.append($topdivspacer);
            // Page section
            var $pagesection = new $("<div />");
            $pagesection.addClass("fr-layout-pagesection");
            me.$pagesection = $pagesection;
            $mainviewport.append($pagesection);
            me.$mainsection = new $("<div />");
            me.$mainsection.addClass("fr-layout-mainsection");
            me.$pagesection.append(me.$mainsection);
            me.$docmapsection = new $("<div />");
            me.$docmapsection.addClass("fr-layout-docmapsection");
            me.$pagesection.append(me.$docmapsection);
            //bottom div
            var $bottomdiv = new $("<div />");
            $bottomdiv.addClass("fr-layout-bottomdiv");
            me.$bottomdiv = $bottomdiv;
            $mainviewport.append($bottomdiv);
            var $bottomdivspacer = new $("<div />");
            $bottomdivspacer.addClass("fr-layout-bottomdivspacer");
            me.$bottomdivspacer = $bottomdivspacer;
            $mainviewport.append($bottomdivspacer);
            //right pane
            var $rightpane = new $("<div />");
            $rightpane.addClass("fr-layout-rightpane");
            me.$rightpane = $rightpane;
            var $rightheader = new $("<div />");
            $rightheader.addClass("fr-layout-rightheader");
            me.$rightheader = $rightheader;
            var $rightheaderspacer = new $("<div />");
            $rightheaderspacer.addClass("fr-layout-rightheaderspacer");
            me.$rightheaderspacer = $rightheaderspacer;
            var $rightpanecontent = new $("<div />");
            $rightpanecontent.addClass("fr-layout-rightpanecontent");
            me.$rightpanecontent = $rightpanecontent;
            $rightpane.append($rightheader);
            $rightpane.append($rightheaderspacer);
            $rightpane.append($rightpanecontent);
            $container.append($rightpane);

            // Define the unzoom toolbar
            var $unzoomsection = new $("<div class=fr-layout-unzoomsection />");
            me.$unzoomsection = $unzoomsection;
            $mainviewport.append(me.$unzoomsection);

            if (!me.options.isFullScreen) {
                me._makePositionAbsolute();
            }

            me.bindEvents();

            //Cannot get zoom event so fake it
            setInterval(function () {
                me.toggleZoom();
            }, 100);
            return this;
        },

        _makePositionAbsolute: function () {
            var me = this;
            me.$topdiv.addClass("fr-layout-position-absolute");
            me.$leftheader.addClass("fr-layout-position-absolute");
            me.$rightheader.addClass("fr-layout-position-absolute");
            me.$leftpane.addClass("fr-layout-position-absolute");
            me.$rightpane.addClass("fr-layout-position-absolute");
            me.$leftpanecontent.addClass("fr-layout-position-absolute");
            me.$rightpanecontent.addClass("fr-layout-position-absolute");
        },

        _makePositionFixed: function () {
            var me = this;
            me.$topdiv.removeClass("fr-layout-position-absolute");
            me.$leftheader.removeClass("fr-layout-position-absolute");
            me.$rightheader.removeClass("fr-layout-position-absolute");
            me.$leftpane.removeClass("fr-layout-position-absolute");
            me.$rightpane.removeClass("fr-layout-position-absolute");
            me.$leftpanecontent.removeClass("fr-layout-position-absolute");
            me.$rightpanecontent.removeClass("fr-layout-position-absolute");
        },

        bindEvents: function () {
            var me = this;
            var events = forerunner.ssr.constants.events;

            // Handle any / all layout changes when the history routes change
            forerunner.history.on(events.historyRoute(), function (e, data) {
                if (data.name === "transitionToReportManager" ||
                    data.name === "transitionToOpenResource" ||
                    data.name === "transitionToSearch") {
                    forerunner.device.allowZoom(false);
                    $("html").addClass("fr-Explorer-background");
                } else if (data.name === "transitionToReportViewer" ||
                           data.name === "transitionToReportViewerWithRSURLAccess") {
                    $("html").removeClass("fr-Explorer-background");
                }
            });

            var $mainheadersection = $(".fr-layout-mainheadersection", me.$container);
            $mainheadersection.on(events.toolbarMenuClick(), function (e, data) { me.showSlideoutPane(widgets.toolbar, true); });
            $mainheadersection.on(events.toolbarParamAreaClick(), function (e, data) { me.showSlideoutPane(widgets.toolbar, false); });
            $mainheadersection.on(events.reportExplorerToolbarMenuClick(), function (e, data) { me.showSlideoutPane(widgets.reportExplorerToolbar, true); });
            $mainheadersection.on(events.dashboardToolbarMenuClick(), function (e, data) { me.showSlideoutPane(widgets.dashboardToolbar, true); });
            $(".fr-layout-rightpanecontent", me.$container).on(events.reportParameterRender(), function (e, data) { me.showSlideoutPane(widgets.toolbar, false); });
            $(".fr-layout-leftheader", me.$container).on(events.leftToolbarMenuClick(), function (e, data) { me.hideSlideoutPane(true); });

            $(".fr-layout-rightheader", me.$container).on(events.rightToolbarParamAreaClick(), function (e, data) { me.hideSlideoutPane(false); });
            var $leftPaneContent = $(".fr-layout-leftpanecontent", me.$container);
            $leftPaneContent.on(events.toolPaneActionStarted(), function (e, data) { me.hideSlideoutPane(true); });
            $leftPaneContent.on(events.dashboardToolPaneActionStarted(), function (e, data) { me.hideSlideoutPane(true); });
            $leftPaneContent.on(events.reportExplorerToolPaneActionStarted(), function (e, data) { me.hideSlideoutPane(true); });
            $(".fr-layout-rightpanecontent", me.$container).on(events.reportParameterSubmit(), function (e, data) { me.hideSlideoutPane(false); });
            $(".fr-layout-rightpanecontent", me.$container).on(events.reportParameterCancel(), function (e, data) { me.hideSlideoutPane(false); });

            me.$container.on(events.showModalDialog, function () {
                //me.$viewer.reportViewer("allowZoom", true);
                me.$container.addClass("fr-layout-container-noscroll");
                me.$pagesection.addClass("fr-layout-pagesection-noscroll");
                me.showModal = true;
                //me.$container.css("overflow", "hidden").mask();
                //this field is to remove the conflict of restore scroll invoke list
                //made by left pane and modal dialog.
                //me.scrollLock = true;
                //me.scrollToPosition(me.getOriginalPosition());
            });

            me.$container.on(events.closeModalDialog, function () {
                //me.$viewer.reportViewer("allowZoom", false);
                me.showModal = false;
                if (!me.$leftpane.is(":visible") && !me.$rightpane.is(":visible")) {
                    me.$container.removeClass("fr-layout-container-noscroll");
                    me.$pagesection.removeClass("fr-layout-pagesection-noscroll");
                }
                // me.$container.css("overflow", "").unmask();
                //me.scrollLock = false;
                //me.restoreScroll();
            });

            var isTouch = forerunner.device.isTouch();
            if (!me.options.isFullScreen) {
                // For touch device, update the header only on scrollstop.
                if (isTouch) {
                    $(me.$container).hammer({ stop_browser_behavior: { userSelect: false }, swipe_max_touches: 22, drag_max_touches: 2 }).on("touch release",
                    function (ev) {
                        if (!ev.gesture) return;
                        switch (ev.type) {
                            // Hide the header on touch
                            case "touch":
                                if (forerunner.helper.containElement(ev.target, ["fr-layout-topdiv"]) || me.$container.hasClass("fr-layout-container-noscroll"))
                                    return;
                                me.$topdiv.hide();
                                break;
                                // Use the swipe and drag events because the swipeleft and swiperight doesn"t seem to fire

                            case "release":
                                if (ev.gesture.velocityX === 0 && ev.gesture.velocityY === 0) {
                                    me._updateTopDiv(me);
                                }
                                break;
                        }
                    });
                    $(me.$container).on("scrollstop", function () {
                        me._updateTopDiv(me);
                    });
                    $(window).on("scrollstop", function () {
                        me._updateTopDiv(me);
                    });
                }  
            }

            $(me.$container).on("touchmove", function (e) {
                if (me.$container.hasClass("fr-layout-container-noscroll")) {

                    var isScrollable = forerunner.helper.containElement(e.target, ["fr-layout-leftpane", "fr-layout-rightpane", "fr-core-dialog-form", "fr-nav-container", "ui-autocomplete"]);

                    if (!isScrollable)
                        e.preventDefault();
                }
            });

            $(window).on("resize", function () {
                me._windowResizeHandler.call(me)
            });

            if (!me.options.isFullScreen && !isTouch) {
                $(window).on("scroll", function () {
                    me._updateTopDiv(me);
                });
                me.$container.on("scroll", function () {
                    me._updateTopDiv(me);
                });
            }
            
            //IOS safari has a bug that report the window height wrong
            if (forerunner.device.isiOS()) {
                $(document.documentElement).height(window.innerHeight);
                $(window).on("orientationchange", function () {
                    $(document.documentElement).height(window.innerHeight);

                    // Hiding the tool pane and / or the parameter pane is in response to bugs like 670 and
                    // 532. On iOS, the button clicks and scrolling were having trouble if the panes were left
                    // up. So we are going to close them here. The user can reopen if they want.
                    me.hideSlideoutPane(true);
                    me.hideSlideoutPane(false);
                });
            }
        },
        _windowResizeTimer: null,
        _windowResizeHandler: function () {
            var me = this;
            //handle window resize event when the call interval is more than 100 milliseconds
            //this will optimize performance when resize action rapid succession to make it only execute one time
            if (me._windowResizeTimer) {
                clearTimeout(me._windowResizeTimer);
                me._windowResizeTimer = null;
            }
            
            me._windowResizeTimer = setTimeout(function () {
                me.ResetSize();
                me._updateTopDiv(me);
                me.setBackgroundLayout();
            }, 100);
        },
        _updateTopDiv: function (me) {
            if (me.options.isFullScreen)
                return;

            var diff = Math.min($(window).scrollTop() - me.$container.offset().top, me.$container.height() - me.$topdiv.outerHeight());
            var linkSectionHeight = me.$linksection.outerHeight();
            if (me.$leftpane.is(":visible")) {
                me.$leftpane.css("top", diff > 0 ? diff : me.$container.scrollTop() + linkSectionHeight);
            } else if (me.$rightpane.is(":visible")) {
                me.$rightpane.css("top", diff > 0 ? diff : me.$container.scrollTop() + linkSectionHeight);
            }
            me.$topdiv.css("top", diff > 0 ? diff : me.$container.scrollTop());
            me.$topdiv.css("left", me.$container.scrollLeft());
            if (!me.isZoomed()) {
                me.$topdiv.show();
            }
        },
        
        toggleZoom: function () {
            var me = this;
            var ratio = forerunner.device.zoomLevel();
            
            if (me.isZoomed() && !me.wasZoomed) {
                //fadeout->fadeIn toolbar immediately to make android browser re-calculate toolbar layout
                //to fill the full width
                if (forerunner.device.isAndroid() && me.$topdiv.is(":visible")) {
                    me.$topdiv.css("width", "100%");
                    me.$topdiv.css("width", "device-width");
                }
                me.wasZoomed = true;
                return;
            }

            if (!me.isZoomed() && me.wasZoomed) {
                var $viewer = $(".fr-layout-reportviewer", me.$container);
                me._allowZoom(false);
                me.wasZoomed = false;
                if (forerunner.device.isAndroid()) {
                    me.$topdiv.css("width", "100%");
                    me.$topdiv.fadeOut(10).fadeIn(10);
                }
            }
        },
        wasZoomed: false,
        isZoomed: function(){
            var ratio = forerunner.device.zoomLevel();

            if (ratio > 1.15 || ratio < 0.985)
                return true;
            else
                return false;
        },
        _firstTime: true,
        // Debug
        _lastHeight: 0,
        getHeightValues: function () {
            var me = this;
            var values = {};
            var linkSectionHeight = me.$linksection.outerHeight();
            values.windowHeight = $(window).height();  // PC case
            values.containerHeight = me.$container.height();

            // Start out by adding the height of the location bar to the height
            if (forerunner.device.isiOS()) {
                // iOS reliably returns the innerWindow size for documentElement.clientHeight
                // but window.innerHeight is sometimes the wrong value after rotating the orientation
                values.windowHeight = document.documentElement.clientHeight;

                // Only add extra padding to the height on iphone / ipod, since the ipad browser
                // doesn't scroll off the location bar.
                if (forerunner.device.isiPhone() && !forerunner.device.isiPhoneFullscreen() && !forerunner.device.isStandalone()) {
                    values.windowHeight += 60;
                    if (me._firstTime) {
                        values.containerHeight += 60;
                        me._firstTime = false;
                    }
                }
            } else if (forerunner.device.isAndroid()) {
                values.windowHeight = window.innerHeight;
            }

            values.windowHeight -= linkSectionHeight;
            values.containerHeight -= linkSectionHeight;
            values.max = Math.max(values.windowHeight, values.containerHeight);
            if (me.options.isFullScreen) {
                values.paneHeight = values.windowHeight - 38; /* 38 because $leftPaneContent.offset().top, doesn't work on iPhone*/
            } else {
                values.paneHeight = values.containerHeight - 38; /* 38 because $leftPaneContent.offset().top, doesn't work on iPhone*/
            }
            if (window.navigator.standalone && forerunner.device.isiOS()) {
                values.paneHeight = values.max;
            }
            return values;
        },
        ResetSize: function () {
            var me = this;
            
            var heightValues = me.getHeightValues();

            // Setting the min-height allows the iPhone to scroll the left and right panes
            // properly even when the report has not been loaded due to paramters not being
            // entered or is very small
            if (forerunner.device.isiPhone()) {
                $("html").css({ minHeight: heightValues.max });
                $("body").css({ minHeight: heightValues.max });
            }
            me.$leftpanecontent.css({ height: heightValues.paneHeight });
            me.$rightpanecontent.css({ height: heightValues.paneHeight });
            if (me.options.isFullScreen) {
                me.$leftpane.css({ height: heightValues.max });
                me.$rightpane.css({ height: heightValues.max });
            } else {
                me.$leftpane.css({ height: heightValues.containerHeight });
                me.$rightpane.css({ height: heightValues.containerHeight });
            }
            //me.$mainviewport.css({ height: "100%" });
            $(".fr-param-container", me.$container).css({ height: "100%" });
            $(".fr-toolpane", me.$container).css({ height: "100%" });

            //reset parameter pane size, make sure it small than the container width
            var containerWidth = me.$container.width();
            var customRightPaneWidth = forerunner.config.getCustomSettingsValue("ParameterPaneWidth", 280);
            var parameterPaneWidth = customRightPaneWidth < containerWidth ? customRightPaneWidth : containerWidth;

            me.$rightpane.width(parameterPaneWidth);
            me.$rightheader.width(parameterPaneWidth);
            me.$rightpanecontent.width(parameterPaneWidth);
        },

        showTopDiv: function (isEnabled) {
            var me = this;
            if (isEnabled === true) {
                me.$topdiv.hide();
                me.$viewer.reportViewer("option", "toolbarHeight", 0);
            }
            else {
                me.$topdiv.show();
                me.$viewer.reportViewer("option", "toolbarHeight", me.$topdiv.outerHeight());
            }
        },

        bindViewerEvents: function () {
            var me = this;
            var events = forerunner.ssr.constants.events;

            var $viewer = $(".fr-layout-reportviewer", me.$container);
            me.$viewer = $viewer;
            $viewer.on(events.reportVieweractionHistoryPop(), function (e, data) { me.hideSlideoutPane(false); });
            $viewer.on(events.reportViewerDrillThrough(), function (e, data) { me.hideSlideoutPane(true); me.hideSlideoutPane(false); });
            $viewer.on(events.reportViewerShowNav(), function (e, data) {
                var $spacer = me.$bottomdivspacer;

                if (!data.open) {
                    $spacer.hide();
                    //me.$pagesection.show();
                    me.$container.removeClass("fr-layout-container-noscroll");
                    me.$pagesection.removeClass("fr-layout-pagesection-noscroll");
                }
                else {
                    $spacer.show();
                    //don't need to hide page section when navigation open in both full or non-full mode
                    //if (forerunner.device.isSmall(me.options.$container))
                    //    me.$pagesection.hide();

                    me.$container.addClass("fr-layout-container-noscroll");
                    me.$pagesection.addClass("fr-layout-pagesection-noscroll");
                }

            });
            $viewer.on(events.reportViewerShowDocMap(), function (e, data) {
                me.scrollLock = true;
                if (me.savePosition) {
                    me.$viewer.reportViewer("option", "savePosition", me.savePosition);
                }
                me.scrollToPosition(me.getOriginalPosition());
            });

            $viewer.on(events.reportViewerHideDocMap(), function (e, data) {
                me.scrollLock = false;
                me.restoreScrollPosition();
            });

            $viewer.on(events.reportViewerallowZoom(), function (e, data) {
                me.showTopDiv.call(me, data.isEnabled);
            });

            $viewer.on(events.reportViewerSetPageDone(), function (e, data) {
                me.setBackgroundLayout();
            });

            //  Just in case it is hidden
            $viewer.on(events.reportViewerChangePage(), function (e, data) {
                me.$pagesection.show();
            });

            //nav to the found keyword and clear saved position to resolve the conflict with left pane.
            $viewer.on(events.reportViewerNavToPosition(), function (e, data) {
                me.scrollToPosition(data);
                me.savePosition = null;
            });

            $viewer.on(events.reportViewerPreLoadReport(), function (e, data) {
                me.cleanUp();
            });

            $viewer.on(events.reportViewerFind(), function (e, data) {
                if (me.$leftpane.is(":visible")) {
                    me.hideSlideoutPane(true);
                }
            });

            var isTouch = forerunner.device.isTouch();
            // For touch device, update the header only on scrollstop.
            if (isTouch && !me.options.isFullScreen) {
                me.$pagesection.on("scrollstop", function () { me._updateTopDiv(me); });
            }

            $viewer.reportViewer("option", "onInputFocus", me.onInputFocus);
            $viewer.reportViewer("option", "onInputBlur", me.onInputBlur);
        },
        onInputFocus: function () {
            var me = this;

            if (forerunner.device.isiOS()) {
                setTimeout(function () {
                    if (me.options.isFullScreen)
                        me._makePositionAbsolute();

                    me.$pagesection.addClass("fr-layout-pagesection-noscroll");
                    me.$container.addClass("fr-layout-container-noscroll");

                    $(window).scrollTop(0);
                    $(window).scrollLeft(0);
                    me.ResetSize();
                }, 50);
            }
        },
        onInputBlur: function () {
            var me = this;
            if (forerunner.device.isiOS()) {
                setTimeout(function () {
                    if (me.options.isFullScreen)
                        me._makePositionFixed();

                    if (!me.$leftpane.is(":visible") && !me.$rightpane.is(":visible") && me.showModal !== true) {
                        me.$pagesection.removeClass("fr-layout-pagesection-noscroll");
                        me.$container.removeClass("fr-layout-container-noscroll");
                    }

                    $(window).scrollTop(0);
                    $(window).scrollLeft(0);

                    me.ResetSize();
                }, 50);
            }
        },
        getScrollPosition: function () {
            var me = this;
            var position = {};
            position.left = $(window).scrollLeft();
            position.top = $(window).scrollTop();
            position.innerLeft = me.$container.scrollLeft();
            position.innerTop = me.$container.scrollTop();
            return position;
        },
        getOriginalPosition: function () {
            var me = this;
            return { left: me.$container.offset().left > 100 ? me.$container.offset().left : 0, top: 0, innerLeft: 0, innerTop: 0 };
        },
        scrollToPosition: function (position) {
            var me = this;
            if (!me.savePosition)
                me.savePosition = me.getScrollPosition();
            if (position.left !== null)
                $(window).scrollLeft(position.left);
            if (position.top !== null)
                $(window).scrollTop(position.top);
            if (position.innerLeft !== null)
                me.$container.scrollLeft(position.innerLeft);
            if (position.innerTop !== null)
                me.$container.scrollTop(position.innerTop);
        },
        restoreScrollPosition: function () {
            var me = this;
            if (me.savePosition && !me.scrollLock) {
                me.$container.scrollLeft(me.savePosition.innerLeft);
                me.$container.scrollTop(me.savePosition.innerTop);
                $(window).scrollLeft(me.savePosition.left);
                $(window).scrollTop(me.savePosition.top);
                
                me.savePosition = null;
            }
        },
        hideAddressBar: function (isLeftPane, callback) {
            var me = this;
            var containerPosition = me.getOriginalPosition();
            var delay = (document.height <= window.outerHeight + 10) ? 50 : 0;
            if (!isLeftPane) containerPosition.left = null;

            setTimeout(function () {
                me.scrollToPosition(containerPosition);
                if (typeof callback === "function") {
                    callback();
                }
            }, delay);
        },
        restoreScroll: function () {
            var me = this;
            if (document.height <= window.outerHeight + 10) {
                setTimeout(function () { me.restoreScrollPosition(); }, 50);
            }
            else {
                setTimeout(function () { me.restoreScrollPosition(); }, 0);
            }
        },
        hideSlideoutPane: function (isLeftPane) {
            var me = this;
            var className = isLeftPane ? "fr-layout-mainViewPortShiftedRight" : "fr-layout-mainViewPortShiftedLeft";
            var mainViewPort = me.$mainviewport;
            var slideoutPane = isLeftPane ? me.$leftpane : me.$rightpane;
            var topdiv = me.$topdiv;
            var delay = Number(200);


            if (slideoutPane.is(":visible")) {
                if (isLeftPane) {
                    slideoutPane.slideLeftHide(delay * 0.5);
                } else {
                    slideoutPane.slideRightHide(delay * 0.5);
                }
                topdiv.removeClass(className, delay);
                for (key in me.$mainheadersection.data()) {
                    var widget = me.$mainheadersection.data()[key];
                    if (widget.widgetName) {
                        me.$mainheadersection[widget.widgetName]("showAllTools");
                    }
                }
            }
            
            if (me.showModal !== true) {
                me.$pagesection.removeClass("fr-layout-pagesection-noscroll");
                me.$container.removeClass("fr-layout-container-noscroll");
            }

            if (forerunner.device.isAndroid() && !forerunner.device.isChrome())
                me.$pagesection.addClass("fr-layout-android");

            // Make sure the scroll position is restored after the call to hideAddressBar
            me.restoreScroll();
            me.$container.resize();
            if (me.$viewer !== undefined && me.$viewer.is(":visible")) {
                if (!forerunner.device.isAllowZoom()) {
                    me.$viewer.reportViewer("allowSwipe", true);
                }
                me.$viewer.reportViewer("triggerEvent", events.hidePane, { isLeftPane: isLeftPane });
            }
        },
        _allowZoom: function (zoom) {
            var me = this;
            if (!forerunner.device.isWindowsPhone() ) {
                if (me.$viewer !== undefined && me.$viewer.is(":visible")) {
                    me.$viewer.reportViewer("allowZoom", zoom);
                } else {
                    forerunner.device.allowZoom(zoom);
                }
            }
        },
        showUnZoomPane: function () {
            var me = this;
            me.showTopDiv(true);
            me.$unzoomsection.show();
        },
        showSlideoutPane: function (toolbarWidgetName, isLeftPane) {
            var me = this;

            me._allowZoom(false);
            if (me.$viewer !== undefined && me.$viewer.is(":visible")) {
                me.$viewer.reportViewer("allowSwipe", false);
            }

            var className = isLeftPane ? "fr-layout-mainViewPortShiftedRight" : "fr-layout-mainViewPortShiftedLeft";
            var mainViewPort = me.$mainviewport;
            var slideoutPane = isLeftPane ? me.$leftpane : me.$rightpane;
            var topdiv = me.$topdiv;
            var delay = Number(200);
            
            if (!slideoutPane.is(":visible")) {
                var routeLinkPaneOffset = me.$linksection.outerHeight();
                slideoutPane.css({ height: Math.max($(window).height() - routeLinkPaneOffset, mainViewPort.height()) - routeLinkPaneOffset });
                if (isLeftPane) {
                    slideoutPane.css({ top: me.$container.scrollTop() + routeLinkPaneOffset });
                    slideoutPane.slideLeftShow(delay);
                } else {
                    slideoutPane.css({ top: me.$container.scrollTop() + routeLinkPaneOffset });
                    slideoutPane.slideRightShow(delay);
                }
                
                topdiv.addClass(className, delay);
                for (key in me.$mainheadersection.data()) {
                    var widget = me.$mainheadersection.data()[key];
                    if (widget.widgetName) {
                        me.$mainheadersection[widget.widgetName]("hideAllTools");
                    }
                }

                me._allowZoom(false);
                if (me.$viewer !== undefined && me.$viewer.is(":visible")) {
                    me.$viewer.reportViewer("allowSwipe", false);
                }
            }

            // Make sure the address bar is not showing when a side out pane is showing
            // Take add noscroll process as callback to make sure the execute sequence with hideAddress.
            me.hideAddressBar(isLeftPane, function () {
                me.$container.addClass("fr-layout-container-noscroll");
                me.$pagesection.addClass("fr-layout-pagesection-noscroll");
                me.$container.resize();
            });

            if (me.$viewer !== undefined && me.$viewer.is(":visible")) {
                me.$viewer.reportViewer("triggerEvent", events.showPane, { isLeftPane: isLeftPane });
            }
        },
        setBackgroundLayout: function () {
            var me = this;
            var reportArea = $(".fr-report-areacontainer", me.$container);
            var containerHeight = me.$container.height();
            var containerWidth = me.$container.width();
            var topDivHeight = me.$topdiv.outerHeight();
            
            if (reportArea.height() > (containerHeight - topDivHeight) || reportArea.width() > containerWidth) {
                $(".fr-render-bglayer", me.$container).css("position", "absolute").
                    css("height", Math.max(reportArea.height(), (containerHeight - topDivHeight)))
                    .css("width", Math.max(reportArea.width(), containerWidth));
            }
            else {
                $(".fr-render-bglayer", me.$container).css("position", "absolute")
                    .css("height", (containerHeight - topDivHeight)).css("width", containerWidth);
            }
        },
        cleanUp: function () {
            var me = this;

            me.hideSlideoutPane(true);
            me.hideSlideoutPane(false);
            me.$bottomdiv.hide();
            me.$bottomdivspacer.hide();
            me.$pagesection.show();
            me.$pagesection.removeClass("fr-layout-pagesection-noscroll");
            me.$container.removeClass("fr-layout-container-noscroll");
        },
        _selectedItemPath: null,
    };
});  // $(function ()

///#source 1 1 /Forerunner/Common/js/DashboardModel.js
// Assign or create the single globally scoped variable
var forerunner = forerunner || {};

// Forerunner SQL Server Reports
forerunner.ssr = forerunner.ssr || {};

$(function () {
    var ssr = forerunner.ssr;

    ssr.DashboardModel = function (options) {
        var me = this;
        me.options = {
            $appContainer: null,
            reportManagerAPI: forerunner.config.forerunnerAPIBase() + "ReportManager/",
            rsInstance: null
        };

        // Merge options with the default settings
        if (options) {
            $.extend(this.options, options);
        }

        me.clearState();
    };

    ssr.DashboardModel.prototype = {
        clearState: function () {
            var me = this;
            me.dashboardDef = {
                templateName: null,
                template: null,
                reports: {}
            };
        },
        fetch: function (path) {
            var me = this;
            var status = false;

            var url = me.options.reportManagerAPI + "/Resource";
            url += "?path=" + encodeURIComponent(path);
            url += "&instance=" + me.options.rsInstance;
            if (me.options.rsInstance) {
                url += "?instance=" + me.options.rsInstance;
            }

            forerunner.ajax.ajax({
                dataType: "json",
                url: url,
                async: false,
                success: function (data) {
                    me.dashboardDef = data
                    status = true;
                },
                fail: function (jqXHR) {
                    console.log("_loadResource() - " + jqXHR.statusText);
                    console.log(jqXHR);
                    forerunner.dialog.showMessageBox(me.options.$appContainer, messages.loadDashboardFailed, messages.loadDashboard);
                }
            });
            return status;
        },
        save: function (overwrite, parentFolder, dashboardName) {
            var me = this;
            var status = false;
            if (overwrite === null || overwrite === undefined) {
                overwrite = false;
            }
            var stringified = JSON.stringify(me.dashboardDef);
            var url = forerunner.config.forerunnerAPIBase() + "ReportManager/SaveResource";
            forerunner.ajax.ajax({
                type: "POST",
                url: url,
                data: {
                    resourceName: dashboardName,
                    parentFolder: encodeURIComponent(parentFolder),
                    overwrite: overwrite,
                    contents: stringified,
                    mimetype: "json/forerunner-dashboard",
                    rsInstance: me.options.rsInstance
                },
                dataType: "json",
                async: false,
                success: function (data) {
                    status = true;
                },
                fail: function (jqXHR) {
                    console.log("ssr.DashboardModel.save() - " + jqXHR.statusText);
                    console.log(jqXHR);
                }
            });
            return status;
        },
        loadTemplate: function (templateName) {
            var me = this;
            var template = forerunner.localize.getLocData(forerunner.config.forerunnerFolder() + "Dashboard/dashboards/" + templateName, "text");
            me.dashboardDef.template = template;
        },

    };
});

///#source 1 1 /Forerunner/ReportViewer/js/Toolbar.js
/**
 * @file Contains the toolbar widget.
 *
 */

var forerunner = forerunner || {};
forerunner.ssr = forerunner.ssr || {};
forerunner.ssr.tools = forerunner.ssr.tools || {};
forerunner.ssr.tools.toolbar = forerunner.ssr.tools.toolbar || {};
forerunner.ssr.tools.groups = forerunner.ssr.tools.groups || {};

$(function () {
    // Useful namespaces
    var widgets = forerunner.ssr.constants.widgets;
    var events = forerunner.ssr.constants.events;
    var tb = forerunner.ssr.tools.toolbar;
    var tg = forerunner.ssr.tools.groups;
    var locData = forerunner.localize.getLocData(forerunner.config.forerunnerFolder() + "ReportViewer/loc/ReportViewer");

    /**
     * Toobar widget used by the reportViewer
     *
     * @namespace $.forerunner.toolbar
     * @prop {Object} options - The options for toolbar
     * @prop {Object} options.$reportViewer - The report viewer widget
     * @prop {String} options.toolClass - The top level class for this tool (E.g., fr-toolbar)
     * @example
     * $("#toolbarId").toolbar({
     *  $reportViewer: $viewer,
     *  toolClass: "fr-toolbar"
	 * });
     *
     * Note:
     *  Toolbar can be extended by calling the addTools method defined by {@link $.forerunner.toolBase}
     */
    $.widget(widgets.getFullname(widgets.toolbar), $.forerunner.toolBase, /** @lends $.forerunner.toolbar */ {
        options: {
            $reportViewer: null,
            toolClass: "fr-toolbar"
        },
        _initCallbacks: function () {
            var me = this;

            // Hook up any / all custom events that the report viewer may trigger
            me.options.$reportViewer.on(events.reportViewerSetPageDone(), function (e, data) {
                if (data.renderError === true) {
                    me.enableTools([tb.btnMenu, tb.btnRefresh]);
                    me._clearBtnStates();
                }
                else {
                    $("input.fr-toolbar-reportpage-textbox", me.element).val(data.newPageNum);
                    var maxNumPages = me.options.$reportViewer.reportViewer("getNumPages");

                    me.enableTools(me._viewerButtons(false));
                    me._updateBtnStates(data.newPageNum, maxNumPages);

                    if (data.paramLoaded && data.numOfVisibleParameters === 0)
                        me.disableTools([tb.btnParamarea]);

                    if (data.credentialRequired === false) {
                        me.disableTools([tb.btnCredential]);
                    }
                    
                    //we need to put keyword textbox watermark initialize code here, we call enableTools above it will re-bind each buttons' events
                    //but in watermark plug-in it also bind a focus/blur event to the textbox, enableTools only re-bind the event we defined in 
                    //forerunner-tools.js so need to make sure the blur event from watermark actually work
                    me.element.find(".fr-toolbar-keyword-textbox").watermark(locData.toolbar.search, { useNative: false, className: "fr-param-watermark" });
                }
            });

            me.options.$reportViewer.on(events.reportViewerShowParamArea(), function (e, data) {
                me.enableTools([tb.btnParamarea]);
            });

            me.options.$reportViewer.on(events.reportViewerShowDocMap(), function (e, data) {
                me.disableAllTools();
                me.enableTools([tb.btnDocumentMap, tb.btnMenu, tb.btnReportBack]);
            });

            me.options.$reportViewer.on(events.reportViewerHideDocMap(), function (e, data) {
                me.enableAllTools();
            });

            me.options.$reportViewer.on(events.reportViewerShowNav(), function (e, data) {
                if (data.open) {
                    me.disableAllTools();
                    me.enableTools([tb.btnNav, tb.btnMenu]);
                    me.freezeEnableDisable(true);
                }
                else {
                    me.freezeEnableDisable(false);
                    me.enableAllTools();

                    //update navigation buttons status in toolbar after close navigation panel
                    var maxNumPages = me.options.$reportViewer.reportViewer("getNumPages");
                    me._updateBtnStates(data.newPageNum, maxNumPages);
                }
            });

            me.options.$reportViewer.on(events.reportViewerDrillThrough(), function (e, data) {
                me._leaveCurReport();
                me._checkSubscription();
            });

            me.options.$reportViewer.on(events.reportViewerPreLoadReport(), function (e, data) {
                me._leaveCurReport();
            });

            me.options.$reportViewer.on(events.reportViewerAfterLoadReport(), function (e, data) {
                me._checkSubscription();
            });

            me.options.$reportViewer.on(events.reportViewerChangeReport(), function (e, data) {
                me._leaveCurReport();

                if (data.credentialRequired === true) {
                    me.enableTools([tb.btnCredential]);
                }

                me._checkSubscription();
            });

            me.options.$reportViewer.on(events.reportViewerFindDone(), function (e, data) {
                if (forerunner.device.isTouch()) {
                    //if it's touch device trigger blur event on textbox to remove virtual keyboard
                    me.element.find(".fr-toolbar-keyword-textbox").trigger("blur");
                }
            });

            me.options.$reportViewer.on(events.reportViewerShowCredential(), function (e, data) {
                me.enableTools([tb.btnMenu, tb.btnCredential]);
                //add credential button to the end of the toolbar if report require credential.
            });

            me.options.$reportViewer.on(events.reportViewerResetCredential(), function (e, data) {
                me._clearBtnStates();
                me.disableTools(me._viewerButtons());
                if (data.paramLoaded === false) {
                    me.disableTools([tb.btnParamarea]);
                }
                me.enableTools([tb.btnMenu, tb.btnReportBack, tb.btnCredential]);
            });

            // Hook up the toolbar element events
            //me.enableTools([tb.btnNav, tb.btnRefresh, tb.btnFirstPage, tb.btnPrev, tb.btnNext,
            //                   tb.btnLastPage, tb.btnDocumentMap, tb.btnFind, tb.btnZoom, tg.btnExportDropdown, tb.btnPrint]);
            //me.enableTools([tb.btnMenu, tb.btnReportBack]);
        },
        _init: function () {
            var me = this;
            me._super(); //Invokes the method of the same name from the parent widget

            me.element.html("<div class='" + me.options.toolClass + " fr-core-toolbar fr-core-widget'/>");
           
            me.addTools(1, false, me._viewerButtons());
            if (!me.options.$reportViewer.reportViewer("showSubscriptionUI"))
                me.hideTool(tb.btnEmailSubscription.selectorClass);
            me.addTools(1, false, [tb.btnParamarea]);
            me.enableTools([tb.btnMenu]);
            if (me.options.$reportViewer) {
                me._initCallbacks();
            }
        },
        _viewerButtons: function (allButtons) {
            var listOfButtons = [tb.btnMenu];

            //check button button
            if (allButtons === true || allButtons === undefined) {
                listOfButtons.push(tb.btnReportBack);
            }

            listOfButtons.push(tb.btnCredential, tb.btnNav, tb.btnRefresh, tb.btnDocumentMap, tg.btnExportDropdown, tg.btnVCRGroup, tg.btnFindGroup, tb.btnZoom);

            //remove zoom button on android
            if (forerunner.device.isAndroid() && !forerunner.device.isChrome()) {
                listOfButtons.pop()
            }

            listOfButtons.push(tb.btnPrint, tb.btnEmailSubscription);

            return listOfButtons;
        },
        _updateBtnStates: function (curPage, maxPage) {
            var me = this;

            if (maxPage !== 0) {
                me.element.find(".fr-toolbar-numPages-button").html(maxPage);
                me.element.find(".fr-toolbar-reportpage-textbox").attr({ max: maxPage, min: 1 });
            }
            else {
                me.element.find(".fr-toolbar-numPages-button").html("?");
            }


            if (me.options.$reportViewer.reportViewer("getHasDocMap"))
                me.enableTools([tb.btnDocumentMap]);
            else
                me.disableTools([tb.btnDocumentMap]);

            if (curPage <= 1) {
                me.disableTools([tb.btnPrev, tb.btnFirstPage]);
            }
            else {
                me.enableTools([tb.btnPrev, tb.btnFirstPage]);
            }

            if (curPage >= maxPage && maxPage !== 0) {
                me.disableTools([tb.btnNext, tb.btnLastPage]);
            }
            else {
                if (maxPage === 0)
                    me.disableTools([tb.btnLastPage]);
                else
                    me.enableTools([tb.btnNext, tb.btnLastPage]);
            }
            if (maxPage ===1 )
                me.disableTools([tb.btnNav]);
            else
                me.enableTools([tb.btnNav]);
        },
        _clearBtnStates: function () {
            var me = this;

            me.element.find(".fr-toolbar-keyword-textbox").val("");
            me.element.find(".fr-toolbar-reportpage-textbox").val("");
            me.element.find(".fr-toolbar-numPages-button").html(0);
        },
        _leaveCurReport: function () {
            var me = this;
            me._clearBtnStates();
            me.disableTools(me._viewerButtons(false));
            me.disableTools([tb.btnCredential, tb.btnParamarea]);
            //me.enableTools([tb.btnReportBack]);
        },
        _checkSubscription: function () {
            var me = this;
            if (!me.options.$reportViewer.reportViewer("showSubscriptionUI")) return;

            var permissions = me.options.$reportViewer.reportViewer("getPermissions");
            if (permissions["Create Subscription"] === true) {
                me.showTool(tb.btnEmailSubscription.selectorClass);
            } else {
                me.hideTool(tb.btnEmailSubscription.selectorClass);
            }
        },
        
        _destroy: function () {
        },
        _create: function () {
            var me = this;

            $(window).resize(function () {
                me.onWindowResize.call(me);
            });
        },
    });  // $.widget
});  // function()

///#source 1 1 /Forerunner/ReportViewer/js/ToolPane.js
/**
 * @file Contains the toolPane widget.
 *
 */

var forerunner = forerunner || {};
forerunner.ssr = forerunner.ssr || {};

$(function () {
    var widgets = forerunner.ssr.constants.widgets;
    var events = forerunner.ssr.constants.events;
    var tp = forerunner.ssr.tools.toolpane;
    var tg = forerunner.ssr.tools.groups;
    var mi = forerunner.ssr.tools.mergedItems;
    var locData = forerunner.localize.getLocData(forerunner.config.forerunnerFolder() + "ReportViewer/loc/ReportViewer");

    /**
     * ToolPane widget used with the reportViewer
     *
     * @namespace $.forerunner.toolPane
     * @prop {Object} options - The options for toolPane
     * @prop {Object} options.$reportViewer - The report viewer widget
     * @prop {String} options.toolClass - The top level class for this tool (E.g., fr-toolpane)
     * @example
     * $("#toolPaneId").toolPane({
     *  $reportViewer: $viewer,
     *  toolClass: "fr-toolpane"
	 * });
     *
     * Note:
     *  ToolPane can be extended by calling the addTools method defined by {@link $.forerunner.toolBase}
     */
    $.widget(widgets.getFullname(widgets.toolPane), $.forerunner.toolBase, {
        options: {
            $reportViewer: null,
            toolClass: "fr-toolpane"
        },
        _initCallbacks: function () {
            var me = this;

            // Hook up any / all custom events that the report viewer may trigger
            me.options.$reportViewer.on(events.reportViewerSetPageDone(), function (e, data) {
                if (data.renderError === true) {
                    me.enableTools([tp.itemRefresh, mi.itemFolders, tg.itemFolderGroup]);
                }
                else {
                    $("input.fr-item-textbox-reportpage", me.element).val(data.newPageNum);
                    var maxNumPages = me.options.$reportViewer.reportViewer("getNumPages");

                    me.enableTools(me._viewerItems(false));
                    me._updateItemStates(data.newPageNum, maxNumPages);

                    if (data.credentialRequired === false) {
                        me.disableTools([tp.itemCredential]);
                    }

                    me.element.find(".fr-item-keyword-textbox").watermark(locData.toolbar.search, { useNative: false, className: "fr-param-watermark" });
                }
            });

            me.options.$reportViewer.on(events.reportViewerAfterLoadReport(), function (e, data) {
                me.disableTools([tp.itemTags]);

                var permissions = me.options.$reportViewer.reportViewer("getPermissions");
                if (permissions["Update Properties"] === true) {
                    me.enableTools([tp.itemTags]);
                }

                me._checkSubscription();
            });

            me.options.$reportViewer.on(events.reportViewerShowDocMap(), function (e, data) {
                me.disableAllTools();
                me.enableTools([tp.itemDocumentMap]);
            });

            me.options.$reportViewer.on(events.reportViewerHideDocMap(), function (e, data) {
                me.enableAllTools();
            });

            me.options.$reportViewer.on(events.reportViewerShowNav(), function (e, data) {
                if (data.open) {
                    me.disableAllTools();
                    me.enableTools([tp.itemNav]);
                    me.freezeEnableDisable(true);
                }
                else {
                    me.freezeEnableDisable(false);
                    me.enableAllTools();

                    //update navigation buttons status in toolpane after close navigation panel
                    var maxNumPages = me.options.$reportViewer.reportViewer("getNumPages");
                    me._updateItemStates(data.newPageNum, maxNumPages);
                }
            });

            me.options.$reportViewer.on(events.reportViewerDrillThrough(), function (e, data) {
                me._leaveCurReport();
                me._checkSubscription();
            });

            me.options.$reportViewer.on(events.reportViewerPreLoadReport(), function (e, data) {
                me._leaveCurReport();
            });

            me.options.$reportViewer.on(events.reportViewerChangeReport(), function (e, data) {
                me._leaveCurReport();

                if (data.credentialRequired === true) {
                    me.enableTools([tp.itemCredential]);
                }

                me._checkSubscription();
            });

            me.options.$reportViewer.on(events.reportViewerFindDone(), function (e, data) {
                if (forerunner.device.isTouch()) {
                    //if it's touch device trigger blur event on textbox to remove virtual keyboard
                    me.element.find(".fr-item-keyword-textbox").trigger("blur");
                }
            });

            me.options.$reportViewer.on(events.reportViewerShowCredential(), function (e, data) {
                me.enableTools([tp.itemCredential]);
            });

            me.options.$reportViewer.on(events.reportViewerResetCredential(), function (e, data) {
                me._clearItemStates();
                me.disableTools(me._viewerItems());
                me.enableTools([tp.itemReportBack, tp.itemCredential, mi.itemFolders, tg.itemFolderGroup]);
            });
            
            // Hook up the toolbar element events
            //me.enableTools([tp.itemFirstPage, tp.itemPrev, tp.itemNext, tp.itemLastPage, tp.itemNav,
            //                tp.itemReportBack, tp.itemRefresh, tp.itemDocumentMap, tp.itemFind]);
        },
        _init: function () {
            var me = this;
            me._super();

            me.element.html("");
            var $toolpane = new $("<div class='" + me.options.toolClass + " fr-core-widget' />");
            $(me.element).append($toolpane);
            
            me.addTools(1, false, me._viewerItems());
            if (!me.options.$reportViewer.reportViewer("showSubscriptionUI")) {
                me.hideTool(tp.itemEmailSubscription.selectorClass);
            }
            
            //me.enableTools([tp.itemReportBack]);
            // Need to add this to work around the iOS7 footer.
            // It has to be added to the scrollable area for it to scroll up.
            // Bottom padding/border or margin won't be rendered in some cases.
            var $spacerdiv = new $("<div />");
            $spacerdiv.attr("style", "height:65px");
            $toolpane.append($spacerdiv);
            if (me.options.$reportViewer) {
                me._initCallbacks();
            }
        },
        _viewerItems: function (allButtons) {
            var me = this;
            var listOfItems = [tg.itemVCRGroup, tg.itemFolderGroup];

            //check back button
            if (allButtons === true || allButtons === undefined) {
                listOfItems.push(tp.itemReportBack);
            }

            listOfItems.push(tp.itemCredential, tp.itemNav, tp.itemRefresh, tp.itemDocumentMap, tp.itemZoom);

            //remove zoom on android browser
            if (forerunner.device.isAndroid() && !forerunner.device.isChrome()) {
                listOfItems.pop();
            }

            listOfItems.push(tp.itemExport, tg.itemExportGroup, tp.itemPrint, tp.itemEmailSubscription);

            //check admin functions
            var userSettings = me.options.$reportViewer.reportViewer("getUserSettings");
            if (userSettings && userSettings.adminUI && userSettings.adminUI === true) {
                listOfItems.push(tp.itemTags, tp.itemRDLExt);
            }

            listOfItems.push(tg.itemFindGroup);

            //check authentication type to show log off button or not 
            if (forerunner.ajax.isFormsAuth()) {
                listOfItems.push(mi.itemLogOff);
            }

            return listOfItems;
        },
        _updateItemStates: function (curPage, maxPage) {
            var me = this;

            if (maxPage !== 0) {
                me.element.find(".fr-toolbar-numPages-button").html(maxPage);
                me.element.find(".fr-item-textbox-reportpage").attr({ max: maxPage, min: 1 });
            }
            else {
                me.element.find(".fr-toolbar-numPages-button").html("?");
            }
            
            if (me.options.$reportViewer.reportViewer("getHasDocMap"))
                me.enableTools([tp.itemDocumentMap]);
            else
                me.disableTools([tp.itemDocumentMap]);

            if (curPage <= 1) {
                me.disableTools([tp.itemPrev, tp.itemFirstPage]);
            }
            else {
                me.enableTools([tp.itemPrev, tp.itemFirstPage]);
            }

            if (curPage >= maxPage && maxPage !== 0) {
                me.disableTools([tp.itemNext, tp.itemLastPage]);
            }
            else {
                if (maxPage === 0) {
                    me.disableTools([tp.itemLastPage]);
                } else {
                    me.enableTools([tp.itemNext, tp.itemLastPage]);
                }
            }
           
            if (maxPage === 1)
                me.disableTools([tp.itemNav]);
            else
                me.enableTools([tp.itemNav]);
        },
        _clearItemStates: function () {
            var me = this;
            me.element.find(".fr-item-keyword-textbox").val("");
            me.element.find(".fr-item-textbox-reportpage").val("");
            me.element.find(".fr-toolbar-numPages-button").html(0);
        },
        _leaveCurReport: function () {
            var me = this;
            me._clearItemStates();
            me.disableTools(me._viewerItems(false));
            me.disableTools([tp.itemCredential]);
            //me.enableTools([tp.itemReportBack]);
        },
        _checkSubscription: function () {
            var me = this;
            if (!me.options.$reportViewer.reportViewer("showSubscriptionUI")) return;

            var permissions = me.options.$reportViewer.reportViewer("getPermissions");
            if (permissions["Create Subscription"] === true) {
                me.showTool(tp.itemEmailSubscription.selectorClass);
            } else {
                me.hideTool(tp.itemEmailSubscription.selectorClass);
            }
        },
    });  // $.widget
});  // function()

///#source 1 1 /Forerunner/ReportViewer/js/PageNav.js
// Assign or create the single globally scoped variable
var forerunner = forerunner || {};

// Forerunner SQL Server Reports
forerunner.ssr = forerunner.ssr || {};

$(function () {
    var widgets = forerunner.ssr.constants.widgets;
    var events = forerunner.ssr.constants.events;
    var locData = forerunner.localize.getLocData(forerunner.config.forerunnerFolder() + "ReportViewer/loc/ReportViewer");

    /**
     * Widget used to show page navigation
     *
     * @namespace $.forerunner.pageNav
     * @prop {Object} options - The options for pageNav
     * @prop {Object} options.$reportViewer - Report viewer widget
     * @prop {String} options.rsInstance - Report service instance name
     * @example
     * $("#pageNavContainer").pageNav({
     *  $reportViewer: me.$reportViewer
     * });
     */
    $.widget(widgets.getFullname(widgets.pageNav), /** @lends $.forerunner.pageNav */ {
        options: {
            $reportViewer: null,
            $appContainer: null,
            rsInstance: null,
        },
        // Constructor
        _create: function () {

        },
        _setCurrentPage: function (currentPageNum) {
            var me = this;
            var $li;

            if (me.currentPageNum !== null && me.currentPageNum !== currentPageNum) {
                $li = me.listItems[me.currentPageNum - 1];
                $li.removeClass("fr-nav-selected");
                $li.find("img").removeClass("fr-nav-page-thumb-selected");
            }

            me.currentPageNum = currentPageNum;            
            me._ScrolltoPage();

            $li = me.listItems[me.currentPageNum - 1];
            $li.addClass("fr-nav-selected");
            $li.find("img").addClass("fr-nav-page-thumb-selected");
        },
        _ScrolltoPage: function () {
            var me = this;

            if (me.currentPageNum > me._maxNumPages && me.options.$reportViewer.reportViewer("getNumPages") === 0) {
                for (var i = me._maxNumPages + 1 ; i <= me.currentPageNum; i++)
                    me._renderListItem(i, me.$list);

                me._maxNumPages = me.currentPageNum;
            }
            if (me.currentPageNum && !forerunner.device.isElementInViewport(me.listItems[me.currentPageNum - 1].get(0))) {
                var left = me.$ul.scrollLeft() + me.listItems[me.currentPageNum - 1].position().left;
                me.$ul.scrollLeft(left);
            }
        },
        _maxNumPages: null,
        _renderListItem: function (i, $list, isAppend) {
            var me = this;

            var sessionID = me.options.$reportViewer.reportViewer("getSessionID");
            var reportViewerAPI = me.options.$reportViewer.reportViewer("getReportViewerAPI");
            var reportPath = me.options.$reportViewer.reportViewer("getReportPath");
            var url = reportViewerAPI + "/Thumbnail/?ReportPath="
                        + reportPath + "&SessionID=" + sessionID + "&PageNumber=" + i;
            if (me.options.rsInstance)
                url += "&instance=" + me.options.rsInstance;
            var $listItem = new $("<LI />");

            if (isAppend && me.$loadMore) {
                $listItem.insertBefore(me.$loadMore);
            }
            else {
                $list.append($listItem);
            }

            me.listItems[i - 1] = $listItem;            
            var $caption = new $("<DIV class='fr-nav-centertext'>" + i.toString() + "</DIV>");
            var $thumbnail = new $("<IMG />");
            $thumbnail.addClass("fr-nav-page-thumb");
            // Instead of stating the src, use data-original and add the lazy class so that
            // we will use lazy loading.
            $thumbnail.addClass("lazy");
            $thumbnail.attr("src", forerunner.config.forerunnerFolder() + "reportviewer/Images/page-loading.gif");
            $thumbnail.attr("data-src", url);
            $thumbnail.data("pageNumber", i);
            this._on($thumbnail, {
                click: function (event) {
                    me.options.$reportViewer.reportViewer("navToPage", $(event.currentTarget).data("pageNumber"));
                    //check $slider container instead, we can sure it's open
                    //me.options.$reportviewer may hide so its width is 0
                    //if (forerunner.device.isSmall(me.$slider))
                    if (forerunner.device.isSmall(me.options.$appContainer))
                        me.options.$reportViewer.reportViewer("showNav");                        
                },
            });
                
            $listItem.addClass("fr-nav-item");
            $listItem.append($caption);
            $listItem.append($thumbnail);
        },
        _batchSize : 10,
        _renderList: function () {
            var me = this;
            var isTouch = forerunner.device.isTouch();
            var $list;
            
            $list = new $("<ul class='fr-nav-container fr-core-widget' />");
            me.$ul = $list;
 
            me._maxNumPages = me.options.$reportViewer.reportViewer("getNumPages");
            if (me._maxNumPages === 0)
                me._maxNumPages = me._batchSize;

            me.listItems = new Array(me._maxNumPages);
             
            for (var i = 1; i <= me._maxNumPages; i++) {
                me._renderListItem(i, $list);
            }

            if (me._maxNumPages !== me.options.$reportViewer.reportViewer("getNumPages")) {
                var $loadMore = new $("<LI />");
                $loadMore.addClass("fr-nav-loadmore");
                $loadMore.addClass("fr-nav-item");
                $loadMore.addClass("fr-core-cursorpointer");
                $loadMore.on("click", function () {
                    if (me.options.$reportViewer.reportViewer("getNumPages") === 0) {
                        for (var i = me._maxNumPages + 1; i <= me._maxNumPages + me._batchSize; i++) {
                            me._renderListItem(i, me.$list, true);
                        }
                        me._maxNumPages += me._batchSize;
                    } else {
                        var realMax = me.options.$reportViewer.reportViewer("getNumPages");
                        if (realMax !== me._maxNumPages) {
                            for (var i = me._maxNumPages + 1; i <= realMax; i++) {
                                me._renderListItem(i, me.$list, true);
                            }
                            me._maxNumPages = realMax;
                        }

                        $loadMore.remove();
                    }

                    me._fullScreenCheck();

                    var $container = $("ul.fr-nav-container", $(me.element));
                    $(".lazy", me.$list).lazyload({
                        $container: $container,
                        onError: function (element) {
                            if ($loadMore) 
                                $loadMore.remove();
                            element.data.parent().remove();
                        },
                    });
                });

                var $loadMoreSpan = new $("<Div />");
                $loadMoreSpan.addClass("fr-nav-loadmore-text");    
                $loadMore.append($loadMoreSpan);

                $list.append($loadMore);
                me.$loadMore = $loadMore;
            }
            var $spacer = new $("<LI />");
            $spacer.addClass("fr-nav-li-spacer");

            return $list.append($spacer);
        },

        /**
         * Reset page navigation status
         * 
         * @function $.forerunner.pageNav#reset
         */
        reset: function () {
            var me = this;
            me.element.hide();
            me.isRendered = false;
        },
        _render: function () {
            var me = this;
            me.element.html("");
            var isTouch = forerunner.device.isTouch();          
            var $slider = new $("<DIV />");
            $slider.addClass("fr-nav-container");
            me.$slider = $slider;

            var $close = $("<DIV />");
            $close.addClass("fr-nav-close-container");

            var $span = $("<SPAN>" + locData.paramPane.cancel + "</SPAN>");
            $span.addClass("fr-nav-close");
            $close.append($span);

            $close.on("click", function () {
                me.options.$reportViewer.reportViewer("showNav");
            });

            $slider.append($close);
            
            me.currentPageNum = me.options.$reportViewer.reportViewer("getCurPage");
            var $list = me._renderList();
            me.$list = $list;

            $slider.append($list);
            me.element.css("display", "block");
            
            me.element.append($slider);
            //me.element.html($slider.html());

            me.element.hide();
            me._initCallbacks();
            me._setCurrentPage(me.currentPageNum);
        },
        _makeVisible: function (flag) {
            var me = this;
            if (!flag) {
                me.element.fadeOut("fast");
                $(window).off("resize", me._fullScreenCheckCall);
            }
            else {
                me._fullScreenCheck.call(me, 0);
                me.element.fadeIn("fast");
                me._ScrolltoPage();
                $(window).on("resize", { me: me }, me._fullScreenCheckCall);
            }
        },
        //wrapper function used to register window resize event
        _fullScreenCheckCall : function(event){
            var me = event.data.me;
            me._fullScreenCheck.call(me, 100);
        },
        resizeTimer: null,
        //check screen size to decide navigation mode
        _fullScreenCheck: function (delay) {
            var me = this;
            
            if (me.resizeTimer) {
                clearTimeout(me.resizeTimer);
                me.resizeTimer = null;
            }

            me.resizeTimer = setTimeout(function () {
                var $container = me.element.find(".fr-nav-container");
                var $items = me.element.find(".fr-nav-item");
                var $spacer = me.element.find(".fr-nav-li-spacer");
                var $closeButton = me.element.find(".fr-nav-close-container");

                //if (forerunner.device.isSmall(me.$slider.is(":visible") ? me.$slider : me.options.$reportViewer)) {
                //we should used visible area to indicate full screen mode
                if (forerunner.device.isSmall(me.options.$appContainer)) {
                    $container.addClass("fr-nav-container-full");
                    $items.addClass("fr-nav-item-full");
                    $spacer.addClass("fr-nav-li-spacer-full");
                    $closeButton.addClass("fr-nav-close-container-full");
                }
                else {
                    $container.removeClass("fr-nav-container-full");
                    $items.removeClass("fr-nav-item-full");
                    $spacer.removeClass("fr-nav-li-spacer-full");
                    $closeButton.removeClass("fr-nav-close-container-full");
                }

                me.resizeTimer = null;
            }, delay);
            
        },
        /**
         * Show page navigation
         *
         * @function $.forerunner.pageNav#showNav
         */
        showNav: function () {
            var me = this;
            if (!me.isRendered) {
                me._render();
                me.isRendered = true;
                var $container = $("ul.fr-nav-container", $(me.element));
                $(".lazy", me.$list).lazyload({
                    $container: $container,
                    onError: function (element) {
                        if (me.$loadMore)
                            me.$loadMore.remove();

                        element.data.parent().remove();
                    },
                });
            }

            me._makeVisible(!me.element.is(":visible"));
            $(".fr-nav-container", $(me.element)).css("position", me.element.css("position"));
           
            if (forerunner.device.isMSIE()) {
                me._ScrolltoPage();
            }
        },
        _initCallbacks: function () {
            var me = this;
            // Hook up any / all custom events that the report viewer may trigger
            me.options.$reportViewer.on(events.reportViewerChangePage(), function (e, data) {
                me._setCurrentPage(data.newPageNum);
            });
        },
        _init: function () {
            var me = this;
            me.listItems = null;
            me.$ul = null;
            me.currentPageNum = null;
            me.isRendered = false;
        },
    });  // $.widget
});  // function()
///#source 1 1 /Forerunner/ReportExplorer/js/ReportExplorerToolbar.js
/**
 * @file Contains the reportExplorerToolbar widget.
 *
 */

var forerunner = forerunner || {};

// Forerunner SQL Server Reports
forerunner.ssr = forerunner.ssr || {};
forerunner.ssr.tools = forerunner.ssr.tools || {};
forerunner.ssr.tools.reportExplorerToolbar = forerunner.ssr.tools.reportExplorerToolbar || {};

$(function () {
    var widgets = forerunner.ssr.constants.widgets;
    var events = forerunner.ssr.constants.events;
    var tb = forerunner.ssr.tools.reportExplorerToolbar;
    var tg = forerunner.ssr.tools.groups;
    var btnActiveClass = "fr-toolbase-persistent-active-state";
    var locData = forerunner.localize.getLocData(forerunner.config.forerunnerFolder() + "ReportViewer/loc/ReportViewer");

    /**
     * Toolbar widget used by the Report Explorer
     *
     * @namespace $.forerunner.reportExplorerToolbar
     * @prop {Object} options - The options for toolbar
     * @prop {Object} options.navigateTo - Callback function used to navigate to a specific page
     * @prop {String} options.toolClass - The top level class for this tool (E.g., fr-toolbar)
     * @example
     * $("#reportExplorerToolbarId").reportExplorerToolbar({
     *  navigateTo: navigateTo
     * });
     */
    $.widget(widgets.getFullname(widgets.reportExplorerToolbar), $.forerunner.toolBase, /** @lends $.forerunner.reportExplorerToolbar */ {
        options: {
            navigateTo: null,
            toolClass: "fr-toolbar",
            $appContainer: null,
            $reportExplorer: null
        },
        /**
         * Set specify tool to active state
         *
         * @function $.forerunner.reportExplorerToolbar#setFolderBtnActive
         * @param {String} selectorClass - selector class name
         */
        setFolderBtnActive: function (selectorClass) {
            var me = this;
            me._clearFolderBtnState();
            if (selectorClass) {
                var $btn = me.element.find("." + selectorClass);
                $btn.addClass(btnActiveClass);
            }
        },
        setSearchKeyword: function (keyword) {
            var me = this;

            me.element.find(".fr-rm-keyword-textbox").val(keyword);
        },
        _clearFolderBtnState: function () {
            var me = this;
            $.each(me.folderBtns, function (index, $btn) {
                $btn.removeClass(btnActiveClass);
            });
        },
        _initCallbacks: function () {
            var me = this;
            me.enableTools([tb.btnMenu, tb.btnBack, tb.btnFav, tb.btnRecent, tg.explorerFindGroup]);

            me.element.find(".fr-rm-keyword-textbox").watermark(locData.toolbar.search, { useNative: false, className: "fr-param-watermark" });
            //trigger window resize event to regulate toolbar buttons visibility
            $(window).resize();
        },
        _init: function () {
            var me = this;
            me._super();

            me.element.empty();
            me.element.append($("<div class='" + me.options.toolClass + " fr-core-toolbar fr-core-widget'/>"));

            //check whether hide home button is enable
            var toolbarList = [tb.btnMenu, tb.btnBack, tb.btnSetup];
            if (forerunner.config.getCustomSettingsValue("showHomeButton") === "on") {
                //add home button based on the user setting
                toolbarList.push(tb.btnHome);
            }

            toolbarList.push(tb.btnRecent, tb.btnFav);

            if (forerunner.ajax.isFormsAuth()) {
                toolbarList.push(tb.btnLogOff);
            }

            toolbarList.push(tg.explorerFindGroup);

            me.addTools(1, true, toolbarList);
            me._initCallbacks();

            // Hold onto the folder buttons for later
            var $btnHome = me.element.find("." + tb.btnHome.selectorClass);
            var $btnRecent = me.element.find("." + tb.btnRecent.selectorClass);
            var $btnFav = me.element.find("." + tb.btnFav.selectorClass);
            me.folderBtns = [$btnHome, $btnRecent, $btnFav];
        },

        _destroy: function () {
        },

        _create: function () {
            var me = this;

            $(window).resize(function () {
                me.onWindowResize.call(me);
            });
        }
    });  // $.widget
});  // function()

///#source 1 1 /Forerunner/ReportExplorer/js/ReportExplorerToolpane.js
/**
 * @file Contains the reportExplorerToolpane widget.
 *
 */

var forerunner = forerunner || {};

// Forerunner SQL Server Reports
forerunner.ssr = forerunner.ssr || {};
forerunner.ssr.tools = forerunner.ssr.tools || {};
forerunner.ssr.tools.reportExplorerToolpane = forerunner.ssr.tools.reportExplorerToolpane || {};

$(function () {
    var widgets = forerunner.ssr.constants.widgets;
    var events = forerunner.ssr.constants.events;
    var tp = forerunner.ssr.tools.reportExplorerToolpane;
    var tg = forerunner.ssr.tools.groups;
    var itemActiveClass = "fr-toolbase-persistent-active-state";
    var locData = forerunner.localize.getLocData(forerunner.config.forerunnerFolder() + "ReportViewer/loc/ReportViewer");

    /**
     * Toolbar widget used by the Report Explorer
     *
     * @namespace $.forerunner.reportExplorerToolpane
     * @prop {Object} options - The options for toolpane
     * @prop {Object} options.navigateTo - Callback function used to navigate to a specific page
     * @prop {String} options.toolClass - The top level class for this tool (E.g., fr-toolbar)
     * @prop {Object} options.$reportExplorer - The report explorer wiget
     * @prop {Object} options.$appContainer - The container jQuery object that holds the application
     * @example
     * $("#reportExplorerToolpaneId").reportExplorerToolpane({
     *  navigateTo: navigateTo
     * });
     */
    $.widget(widgets.getFullname(widgets.reportExplorerToolpane), $.forerunner.toolBase, /** @lends $.forerunner.reportExplorerToolpane */ {
        options: {
            navigateTo: null,
            toolClass: "fr-toolpane",
            $appContainer: null,
            $reportExplorer: null
        },
        /**
         * Set specify tool to active state
         *
         * @function $.forerunner.reportExplorerToolpane#setFolderItemActive
         * @param {String} selectorClass - selector class name
         */
        setFolderItemActive: function (selectorClass) {
        
            var me = this;
            me._clearFolderItemState();
            if (selectorClass) {
                var $item = me.element.find("." + selectorClass);
                $item.addClass(itemActiveClass);
            }
        },
        /**
         * Sets the search item keyword into the UI
         *
         * @function $.forerunner.reportExplorerToolpane#setSearchKeyword
         */
        setSearchKeyword: function (keyword) {
            var me = this;

            me.element.find(".fr-rm-item-keyword").val(keyword);
        },
        _clearFolderItemState: function () {
            var me = this;
            $.each(me.folderItems, function (index, $item) {
                $item.removeClass(itemActiveClass);
            });
        },
        _createCallbacks: function () {
            var me = this;

            me.element.find(".fr-rm-item-keyword").watermark(locData.toolbar.search, { useNative: false, className: "fr-param-watermark" });

            // Hook up any / all custom events that the report explorer may trigger
            me.options.$reportExplorer.off(events.reportExplorerBeforeFetch());
            me.options.$reportExplorer.on(events.reportExplorerBeforeFetch(), function (e, data) {
                me.updateBtnStates.call(me);
            });

            var $userSettings = me.options.$appContainer.find(".fr-us-section");
            $userSettings.off(events.userSettingsClose());
            $userSettings.on(events.userSettingsClose(), function (e, data) {
                if (data.isSubmit) {
                    me.updateBtnStates.call(me);
                }
            });
        },
        _isAdmin: function () {
            var me = this;
            var userSettings = me.options.$reportExplorer.reportExplorer("getUserSettings");
            if (userSettings && userSettings.adminUI && userSettings.adminUI === true) {
                return true;
            }
            return false;
        },
        _init: function () {
            var me = this;
            me._super();

            me.element.empty();
            me.element.append($("<div class='" + me.options.toolClass + " fr-core-widget'/>"));

            var toolpaneItems = [tp.itemBack, tp.itemFolders, tg.explorerItemFolderGroup, tp.itemTags, tp.itemSearchFolder, tp.itemCreateDashboard, tp.itemSetup, tg.explorerItemFindGroup];
            // Only show the log off is we are configured for forms authentication
            if (forerunner.ajax.isFormsAuth()) {
                toolpaneItems.push(tp.itemLogOff);
            }

            me.addTools(1, true, toolpaneItems);

            // Hold onto the folder buttons for later
            var $itemHome = me.element.find("." + tp.itemHome.selectorClass);
            var $itemRecent = me.element.find("." + tp.itemRecent.selectorClass);
            var $itemFav = me.element.find("." + tp.itemFav.selectorClass);
            me.folderItems = [$itemHome, $itemRecent, $itemFav];

            me.updateBtnStates();
        },
        _destroy: function () {
        },
        _create: function () {
            var me = this;
            //this toolpane exist in all explorer page, so we should put some initialization here
            //to make it only run one time
            me._createCallbacks();
        },
        updateBtnStates: function () {
            var me = this;

            if (!me._isAdmin()) {
                me.hideTool(tp.itemSearchFolder.selectorClass);
                me.hideTool(tp.itemCreateDashboard.selectorClass);
                me.hideTool(tp.itemTags.selectorClass);
            } else {
                // If we are in admin mode we show the buttons
                me.showTool(tp.itemSearchFolder.selectorClass);
                me.showTool(tp.itemCreateDashboard.selectorClass);
                me.showTool(tp.itemTags.selectorClass);

                var lastFetched = me.options.$reportExplorer.reportExplorer("getLastFetched");
                // Then we start out disabled and enable if needed
                me.disableTools([tp.itemSearchFolder, tp.itemCreateDashboard, tp.itemTags]);

                if (lastFetched.view === "catalog") {
                    var permissions = me.options.$reportExplorer.reportExplorer("getPermission");
                    if (permissions["Create Resource"]) {
                        me.enableTools([tp.itemSearchFolder, tp.itemCreateDashboard]);
                    }

                    if (lastFetched.path !== "/" && permissions["Update Properties"]) {
                        me.enableTools([tp.itemTags]);
                    }
                }
            }
        },
    });  // $.widget
});  // function()

///#source 1 1 /Forerunner/ReportExplorer/js/ReportExplorer.js
/**
 * @file Contains the reportExplorer widget.
 *
 */

var forerunner = forerunner || {};
forerunner.ssr = forerunner.ssr || {};

$(function () {
    var widgets = forerunner.ssr.constants.widgets;
    var events = forerunner.ssr.constants.events;
    var locData = forerunner.localize.getLocData(forerunner.config.forerunnerFolder() + "ReportViewer/loc/ReportViewer");
    /**
     * Widget used to explore available reports and launch the Report Viewer
     *
     * @namespace $.forerunner.reportExplorer
     * @prop {Object} options - The options for reportExplorer
     * @prop {String} options.reportManagerAPI - Path to the report manager REST API calls
     * @prop {String} options.forerunnerPath - Path to the top level folder for the SDK
     * @prop {String} options.path - Path passed to the GetItems REST call
     * @prop {String} options.view - View passed to the GetItems REST call
     * @prop {String} options.selectedItemPath - Set to select an item in the explorer
     * @prop {Object} options.$scrollBarOwner - Used to determine the scrollTop position
     * @prop {Object} options.navigateTo - Callback function used to navigate to a selected report
     * @prop {Object} options.$appContainer - Report page container
     * @prop {Object} options.explorerSettings - Object that stores custom explorer style settings
     * @prop {String} options.rsInstance - Report service instance name
     * @example
     * $("#reportExplorerId").reportExplorer({
     *  reportManagerAPI: "./api/ReportManager",
     *  forerunnerPath: "./forerunner/",
     *  path: "/",
     *  view: "catalog",
     *  navigateTo: navigateTo,
     *  $appContainer: me.$container,
     *  explorerSettings: explorerSettings
     * });
     */
    $.widget(widgets.getFullname(widgets.reportExplorer), /** @lends $.forerunner.reportExplorer */ {
        options: {
            reportManagerAPI: forerunner.config.forerunnerAPIBase() + "ReportManager",
            forerunnerPath: forerunner.config.forerunnerFolder(),
            path: null,
            view: null,
            selectedItemPath: null,
            $scrollBarOwner: null,
            navigateTo: null,
            $appContainer: null,
            explorerSettings: null,
            rsInstance: null,
            onInputBlur: null,
            onInputFocus: null,
            userSettings: null,
        },
        /**
         * Save the user settings
         * @function $.forerunner.reportExplorer#saveUserSettings
         *
         * @param {Object} settings - Settings object
         */
        saveUserSettings: function (settings) {
            var me = this;

            var stringified = JSON.stringify(settings);

            var url = forerunner.config.forerunnerAPIBase() + "ReportManager" + "/SaveUserSettings?settings=" + stringified;
            if (me.options.rsInstance) url += "&instance=" + me.options.rsInstance;
            forerunner.ajax.ajax({
                url: url,
                dataType: "json",
                async: false,
                success: function (data) {
                },
                error: function (data) {
                    console.log(data);
                }
            });

        },
        /**
         * Get the user settings.
         * @function $.forerunner.reportExplorer#getUserSettings
         *
         * @return {Object} - User settings
         */
        getUserSettings: function () {
            var me = this;
            return me.options.userSettings;
        },
        _generatePCListItem: function (catalogItem, isSelected) {
            var me = this; 
            var reportThumbnailPath = me.options.reportManagerAPI
              + "/Thumbnail/?ReportPath=" + encodeURIComponent(catalogItem.Path) + "&DefDate=" + catalogItem.ModifiedDate;
            if (me.options.rsInstance)
                reportThumbnailPath += "&instance=" + me.options.rsInstance;
            //Item
            var $item = new $("<div />");
            $item.addClass("fr-explorer-item");
            if (isSelected)
                $item.addClass("fr-explorer-item-selcted");

            var $anchor = new $("<a />");
            //action
            var action;
            if (catalogItem.Type === 1 || catalogItem.Type === 7) {
                    action = "explore";
            }
            else if (catalogItem.Type === 3) {
                switch (catalogItem.MimeType) {
                    case "json/forerunner-dashboard":
                        action = "openDashboard";
                        break;
                    case "json/forerunner-searchfolder":
                        action = "searchfolder";
                        break;
                    default:
                        action = "open";
                        break;
                }
            }
            else {
                action = "browse";
            }

            $anchor.on("click", function (event) {
                if (me.options.navigateTo) {
                    me.options.navigateTo(action, catalogItem.Path);
                }
            });
            $item.append($anchor);


            //Image Block
            var $imageblock = new $("<div />");
            $imageblock.addClass("fr-report-item-image-block");
            $anchor.append($imageblock);
            var outerImage = new $("<div />");            
            $imageblock.append(outerImage);
           

            //Images
            
            if (catalogItem.Type === 1 || catalogItem.Type === 7) {
                if (isSelected) {
                    outerImage.addClass("fr-explorer-folder-selected");
                }
                else {
                    outerImage.addClass("fr-explorer-folder");
                }
            }
            else if (catalogItem.Type === 3) {//resource files
                var fileTypeClass = me._getFileTypeClass(catalogItem.MimeType);
                outerImage.addClass(fileTypeClass);

                if (catalogItem.MimeType === "json/forerunner-searchfolder" && isSelected) {
                    outerImage.addClass("fr-explorer-searchfolder-selected").removeClass("fr-explorer-searchfolder");
                }
            }
            else {

                var innerImage = new $("<img />");
                $imageblock.append(innerImage);
                var corner = new $("<div />");
                $imageblock.append(corner);
                corner.addClass("fr-explorer-item-earcorner");
                corner.css("background-color", me.$UL.css("background-color"));
                var EarImage = new $("<div />");
                $imageblock.append(EarImage);
                var imageSrc = reportThumbnailPath;
                innerImage.addClass("fr-report-item-inner-image");
                innerImage.addClass("fr-report-item-image-base");
                outerImage.addClass("fr-report-item-image-base");
                EarImage.addClass("fr-report-item-image-base");
                if (isSelected) {
                    outerImage.addClass("fr-report-item-outer-image-selected");
                    EarImage.addClass("fr-explorer-item-ear-selcted");
                }
                else {
                    outerImage.addClass("fr-report-item-outer-image");
                    EarImage.addClass("fr-report-item-ear-image");
                }

                innerImage.attr("src", imageSrc);
                innerImage.error(function () {
                    $(this).attr("src", me.options.forerunnerPath + "ReportExplorer/images/Report-icon.png");
                });

                innerImage.removeAttr("height"); //JQuery adds height for IE8, remove.
            }
            if (isSelected)
                me.$selectedItem = $item;

            
            
            //Caption
            var $caption = new $("<div />");
            $caption.addClass("fr-explorer-caption");
            var $captiontext = new $("<div />");
            $captiontext.addClass("fr-explorer-item-title");
            $captiontext.attr("title", catalogItem.Name);
            $captiontext.html(catalogItem.Name);
            $caption.append($captiontext);
            $item.append($caption);

            //Description
            var $desc = new $("<div />");
            //$desc.addClass("fr-explorer-caption");
            var $desctext = new $("<div />");
            $desctext.addClass("fr-explorer-item-desc");
            $desctext.attr("title", catalogItem.Description);
            $desctext.html(catalogItem.Description);
            $desc.append($desctext);
            $item.append($desc);
           
            return $item;
        },
        _renderPCView: function (catalogItems) {
            var me = this;

            me.$UL = me.element.find(".fr-report-explorer");
            var decodedPath = me.options.selectedItemPath ? decodeURIComponent(me.options.selectedItemPath) : null;
            me.rmListItems = new Array(catalogItems.length);
            
            for (var i = 0; i < catalogItems.length; i++) {
                var catalogItem = catalogItems[i];
                var isSelected = false;
                if (decodedPath && decodedPath === decodeURIComponent(catalogItem.Path)) {
                    me.selectedItem = i;
                    isSelected = true;
                }
                me.rmListItems[i] = me._generatePCListItem(catalogItem, isSelected);
                me.$UL.append(me.rmListItems[i]);
            }
            me.$UL.find(".fr-explorer-item-title").multiLineEllipsis();
            me.$UL.find(".fr-explorer-item-desc").multiLineEllipsis();
        },
        _render: function (catalogItems) {
            var me = this;
            me.element.html("<div class='fr-report-explorer fr-core-widget'></div>");
            if (me.colorOverrideSettings && me.colorOverrideSettings.explorer) {
                $(".fr-report-explorer", me.element).addClass(me.colorOverrideSettings.explorer);
            }
            me._renderPCView(catalogItems);
            if (me.$selectedItem) {
                setTimeout(function () { me.$explorer.scrollTop(me.$selectedItem.offset().top - 50); }, 100);  //This is a hack for now
                setTimeout(function () { me.$explorer.scrollLeft(me.$selectedItem.offset().left - 20); }, 100);  //This is a hack for now
            } else {
                setTimeout(function () { me.$explorer.scrollTop(0); }, 100);
                setTimeout(function () { me.$explorer.scrollLeft(0); }, 100);
            }
        },
        _renderResource: function (path) {
            var me = this;

            var url = me.options.reportManagerAPI + "/Resource?";
            url += "path=" + encodeURIComponent(path);
            url += "&instance=" + me.options.rsInstance;

            var $if = $("<iframe/>");
            $if.addClass("fr-report-explorer fr-core-widget fr-explorer-iframe");
            $if.attr("src", url);
            //$if.attr("scrolling", "no");
            me.element.append($if);

            //for IE iframe onload is not working so used below compatible code to detect readyState
            if (forerunner.device.isMSIE()) {
                var frame = $if[0];

                var fmState = function () {
                    var state = null;
                    if (document.readyState) {
                        try {
                            state = frame.document.readyState;
                        }
                        catch (e) { state = null; }

                        if (state === "complete" || !state) {//loading,interactive,complete       
                            me._setIframeHeight(frame);
                        }
                        else {
                            //check frame document state until it turn to complete
                            setTimeout(fmState, 10);
                        }
                    }
                };

                if (fmState.TimeoutInt) {
                    clearTimeout(fmState.timeoutInt);
                    fmState.TimeoutInt = null;
                }

                fmState.timeoutInt = setTimeout(fmState, 100);
            }
            else {
                $if.load(function () {
                    me._setIframeHeight(this);
                });
            }
        },
        //set iframe height with body height
        _setIframeHeight: function (frame) {
            var me = this;
            //use app container height minus toolbar height
            //also there is an offset margin-botton:-20px defined in ReportExplorer.css 
            //to prevent document scroll bar (except IE8)
            var iframeHeight = me.options.$appContainer.height() - 38;
            frame.style.height = iframeHeight + "px";
        },
        /**
         * Returns the last fetch view and path
         *
         * @function $.forerunner.reportExplorer#getLastFetched
         */
        getLastFetched: function () {
            var me = this;
            if (me.lastFetched) {
                return me.lastFetched;
            }

            return null;
        },
        _fetch: function (view, path) {
            var me = this;
            me.lastFetched = {
                view: view,
                path: path
            };
            me._trigger(events.beforeFetch, null, { reportExplorer: me, lastFetched: me.lastFetched, newPath: path });

            if (view === "resource") {
                me._renderResource(path);
                return;
            }

            if (view === "search") {
                me._searchItems(path);
                return;
            }

            me.parentPath = null;
            if (view === "searchfolder") {
                me.parentPath = forerunner.helper.getParentPath(me.options.path);
            }

            var url = me.options.reportManagerAPI + "/GetItems";
            if (me.options.rsInstance) url += "?instance=" + me.options.rsInstance;
            forerunner.ajax.ajax({
                dataType: "json",
                url: url,
                async: false,
                data: {
                    view: view,
                    path: path
                }
            }).done(
                 function (data) {
                     if (data.Exception) {
                         forerunner.dialog.showMessageBox(me.options.$appContainer, data.Exception.Message, locData.messages.catalogsLoadFailed);
                     }
                     else
                         me._render(data);
                 }).fail(
                function (jqXHR, textStatus, errorThrown) {
                    console.log(textStatus);
                    forerunner.dialog.showMessageBox(me.options.$appContainer, textStatus + " - " + errorThrown, locData.messages.catalogsLoadFailed);
                });
        },
        _initCallbacks: function () {
            var me = this;
            // Hook up any / all custom events that the report viewer may trigger
        },
        _initOverrides: function () {
            var me = this;
            if (me.options.explorerSettings.CustomColors) {
                var decodedPath = decodeURIComponent(me.options.path);
                var colorOverrideSettings = me.options.explorerSettings.CustomColors[decodedPath];
                if (colorOverrideSettings) {
                    me.colorOverrideSettings = colorOverrideSettings;
                    // Optimize for an exact match
                    return;
                }
                for (var key in me.options.explorerSettings.CustomColors) {
                    if (decodedPath.indexOf(key, 0) === 0) {
                        me.colorOverrideSettings = me.options.explorerSettings.CustomColors[key];
                        return;
                    }
                }
            }
        },
        _init: function () {
            var me = this;
            me.$RMList = null;
            me.$UL = null;
            me.rmListItems = null;
            me.colorOverrideSettings = null;
            me.selectedItem = 0;
            me.isRendered = false;
            me.$explorer = me.options.$scrollBarOwner ? me.options.$scrollBarOwner : $(window);
            me.$selectedItem = null;

            if (me.options.view === "catalog") {
                me._checkPermission();
            }

            if (me.options.explorerSettings) {
                me._initOverrides();
            }
            me._fetch(me.options.view, me.options.path);

            var $dlg = me.options.$appContainer.find(".fr-us-section");
            if ($dlg.length === 0) {
                $dlg = new $("<div class='fr-us-section fr-dialog-id fr-core-dialog-layout fr-core-widget'/>");
                $dlg.userSettings({
                    $appContainer: me.options.$appContainer,
                    $reportExplorer: me.element
                });
                me.options.$appContainer.append($dlg);
            }
            me._userSettingsDialog = $dlg;

            $dlg = me.options.$appContainer.find(".fr-sf-section");
            if ($dlg.length === 0) {
                $dlg = new $("<div class='fr-sf-section fr-dialog-id fr-core-dialog-layout fr-core-widget'/>");
                $dlg.reportExplorerSearchFolder({
                    $appContainer: me.options.$appContainer,
                    $reportExplorer: me.element
                });
                me.options.$appContainer.append($dlg);
            }
            me._searchFolderDialog = $dlg;

            $dlg = me.options.$appContainer.find(".fr-tag-section");
            if ($dlg.length === 0) {
                $dlg = new $("<div class='fr-tag-section fr-dialog-id fr-core-dialog-layout fr-core-widget'/>");
                $dlg.forerunnerTags({
                    $appContainer: me.options.$appContainer,
                    rsInstance: me.options.rsInstance
                });
                me.options.$appContainer.append($dlg);
            }
            me._forerunnerTagsDialog = $dlg;
        },
        _checkPermission: function () {
            var me = this;
            //create resource: create resource file (search folder/dashboard)
            //update properties: update report properties (tags)
            //for more properties, add to the list
            var permissionList = ["Create Resource", "Update Properties"];
            me.permissions = forerunner.ajax.hasPermission(me.options.path, permissionList.join(","));
        },
        /**
         * Get current path user permission
         *
         * @function $.forerunner.dashboardEZ#getPermission
         * 
         * @return {Object} - permission jQuery object
         */
        getPermission: function () {
            var me = this;
            return me.permissions;
        },
        /**
         * Show the create dashboard modal dialog.
         *
         * @function $.forerunner.reportExplorer#showCreateDashboardDialog
         */
        showCreateDashboardDialog: function () {
            var me = this;
            var $dlg = me.options.$appContainer.find(".fr-cdb-section");
            if ($dlg.length === 0) {
                $dlg = $("<div class='fr-cdb-section fr-dialog-id fr-core-dialog-layout fr-core-widget'/>");
                me.options.$appContainer.append($dlg);
                me._createDashboardDialog = $dlg;
            }

            // Aways re-initialize the dialog even if it was created before
            $dlg.createDashboard({
                $appContainer: me.options.$appContainer,
                $reportExplorer: me.element,
                parentFolder: me.lastFetched.path,
                reportManagerAPI: me.options.reportManagerAPI,
                rsInstance: me.options.rsInstance
            });
            me._createDashboardDialog.createDashboard("openDialog");
        },
        /**
         * Show the user settings modal dialog.
         *
         * @function $.forerunner.reportExplorer#showUserSettingsDialog
         */
        showUserSettingsDialog: function () {
            var me = this;
            me._userSettingsDialog.userSettings("openDialog");
        },
        showExplorerSearchFolderDialog: function () {
            var me = this;
            me._searchFolderDialog.reportExplorerSearchFolder("openDialog");
        },
        showTags: function () {
            var me = this;
            me._forerunnerTagsDialog.forerunnerTags("openDialog", me.options.path);
        },
        createSearchFolder: function (searchFolder) {
            var me = this;

            var url = me.options.reportManagerAPI + "/SaveResource";

            forerunner.ajax.ajax({
                url: url,
                async: false,
                type: "POST",
                dataType: "text",
                data: {
                    resourceName: searchFolder.searchFolderName,
                    parentFolder: me.parentPath || me.options.path,
                    contents: JSON.stringify(searchFolder.content),
                    mimetype: "json/forerunner-searchfolder",
                    instance: me.options.rsInstance
                },
                success: function (data) {
                    //refresh the page if search folder created succeeded
                    location.reload(true);
                    //bug 1078, not show succeeded dialig, instead just close current dialog
                    //forerunner.dialog.showMessageBox(me.options.$appContainer, locData.messages.saveSearchFolderSucceeded, locData.toolbar.searchFolder);
                },
                error: function (data) {
                    forerunner.dialog.showMessageBox(me.options.$appContainer, locData.messages.saveSearchFolderFailed, locData.toolbar.searchFolder);
                }
            });
        },
        getSearchFolderContent: function () {
            var me = this;
            if (me.options.view !== "searchfolder") {
                return null;
            }

            var url = me.options.reportManagerAPI + "/Resource";
            var content = null;

            forerunner.ajax.ajax({
                url: url,
                async: false,
                type: "GET",
                dataType: "text",
                data: {
                    path: me.options.path,
                    instance: me.options.rsInstance
                },
                success: function (data) {
                    content = data;
                },
                error: function (data) { }
            });

            return content;
        },
        _searchItems: function (keyword) {
            var me = this;

            if (keyword === "") {
                forerunner.dialog.showMessageBox(me.options.$appContainer, locData.explorerSearch.emptyError, locData.dialog.title);
                return;
            }
            
            var url = me.options.reportManagerAPI + "/FindItems";
            if (me.options.rsInstance) url += "?instance=" + me.options.rsInstance;
            var searchCriteria = { SearchCriteria: [{ Key: "Name", Value: keyword }, { Key: "Description", Value: keyword }] };

            //specify the search folder, not default to global
            //var folder = me.priorExplorerPath ? me.priorExplorerPath : "";
            //folder = folder.replace("%2f", "/");

            forerunner.ajax.ajax({
                dataType: "json",
                url: url,
                async: false,
                data: {
                    folder: "",
                    searchOperator: "",
                    searchCriteria: JSON.stringify(searchCriteria)
                },
                success: function (data) {
                    if (data.Exception) {
                        forerunner.dialog.showMessageBox(me.options.$appContainer, data.Exception.Message, locData.messages.catalogsLoadFailed);
                    }
                    else {
                        if (data.length) {
                            me._render(data);
                        }
                        else {
                            me._showNotFound();
                        }
                    }
                },
                error: function (data) {
                    console.log(data);
                    forerunner.dialog.showMessageBox(me.options.$appContainer, locData.messages.catalogsLoadFailed);
                }
            });
        },
        _showNotFound:function(){
            var me = this;
            var $explorer = new $("<div class='fr-report-explorer fr-core-widget'></div>");
            var $notFound = new $("<div class='fr-explorer-notfound'>" + locData.explorerSearch.notFound + "</div>");
            $explorer.append($notFound);            
            me.element.append($explorer);
        },
        /**
        * Function execute when input element blur
        *
        * @function $.forerunner.reportExplorer#onInputBlur
        */
        onInputBlur: function () {
            var me = this;
            if (me.options.onInputBlur)
                me.options.onInputBlur();
        },
        /**
         * Function execute when input element focus
         *
         * @function $.forerunner.reportExplorer#onInputFocus
         */
        onInputFocus: function () {
            var me = this;
            if (me.options.onInputFocus)
                me.options.onInputFocus();
        },
        /**
         * Get current explorer path
         *
         * @function $.forerunner.reportExplorer#getCurrentPath
         */
        getCurrentPath: function () {
            var me = this;
            return decodeURIComponent(me.options.path);
        },
        /**
         * Get current explorer view
         *
         * @function $.forerunner.reportExplorer#getCurrentView
         */
        getCurrentView: function () {
            var me = this;
            return me.options.view;
        },
        _getFileTypeClass: function (mimeType) {
            var fileTypeClass = null,
                isFeatureIcon = false;

            switch (mimeType) {
                case "application/pdf":
                    fileTypeClass = "fr-icons128x128-file-pdf";
                    break;
                case "application/vnd.ms-excel":
                    fileTypeClass = "fr-icons128x128-file-xls";
                    break;
                case "application/msword":
                    fileTypeClass = "fr-icons128x128-file-doc";
                    break;
                case "application/vnd.ms-powerpoint":
                    fileTypeClass = "fr-icons128x128-file-ppt";
                    break;
                case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"://xlsx
                    fileTypeClass = "fr-icons128x128-file-xls";
                    break;
                case "application/vnd.openxmlformats-officedocument.wordprocessingml.document"://docx
                    fileTypeClass = "fr-icons128x128-file-doc";
                    break;
                case "application/vnd.openxmlformats-officedocument.presentationml.presentation"://pptx
                    fileTypeClass = "fr-icons128x128-file-ppt";
                    break;
                case "text/html":
                    fileTypeClass = "fr-icons128x128-file-html";
                    break;
                case "audio/mpeg":
                    fileTypeClass = "fr-icons128x128-file-mp3";
                    break;
                case "image/tiff":
                    fileTypeClass = "fr-icons128x128-file-tiff";
                    break;
                case "application/xml":
                    fileTypeClass = "fr-icons128x128-file-xml";
                    break;
                case "image/jpeg":
                    fileTypeClass = "fr-icons128x128-file-jpeg";
                    break;
                case "application/x-zip-compressed":
                    fileTypeClass = "fr-icons128x128-file-zip";
                    break;
                case "application/octet-stream":
                    fileTypeClass = "fr-icons128x128-file-ini";
                    break;
                case "image/gif":
                    fileTypeClass = "fr-icons128x128-file-gif";
                    break;
                case "image/png":
                    fileTypeClass = "fr-icons128x128-file-png";
                    break;
                case "image/bmp":
                    fileTypeClass = "fr-icons128x128-file-bmp";
                    break;
                case "text/plain":
                    fileTypeClass = "fr-icons128x128-file-text";
                    break;
                case "text/css":
                    fileTypeClass = "fr-icons128x128-file-css";
                    break;
                case "json/forerunner-dashboard":
                    isFeatureIcon = true;
                    fileTypeClass = "fr-icons128x128-file-dashboard";
                    break;
                case "json/forerunner-searchfolder":
                    isFeatureIcon = true;
                    fileTypeClass = "fr-explorer-searchfolder";
                    break;
                default://unknown
                    fileTypeClass = "fr-icons128x128-file-unknown";
                    break;
            }

            if (isFeatureIcon === false) {
                fileTypeClass = "fr-icons128x128 " + fileTypeClass;
            }

            return fileTypeClass;
        }
    });  // $.widget
});  // function()
///#source 1 1 /Forerunner/ReportExplorer/js/UserSettings.js
/**
 * @file Contains the user settings widget.
 *
 */

// Assign or create the single globally scoped variable
var forerunner = forerunner || {};

// Forerunner SQL Server Reports
forerunner.ssr = forerunner.ssr || {};

$(function () {
    var widgets = forerunner.ssr.constants.widgets;
    var events = forerunner.ssr.constants.events;

    /**
     * Widget used to manage user settings
     *
     * @namespace $.forerunner.userSettings
     * @prop {Object} options - The options for userSettings
     * @prop {Object} options.$reportExplorer - The report explorer widget
     * @example
     * $("#userSettingsId").userSettings({
     *  $reportExplorer: me.$reportExplorer
     * });
     */
    $.widget(widgets.getFullname(widgets.userSettings), {
        options: {
            $reportExplorer: null,
        },
        _create: function () {
        },
        _init: function () {
            var me = this;
            var locData = forerunner.localize.getLocData(forerunner.config.forerunnerFolder() + "ReportViewer/loc/ReportViewer");
            var userSettings = locData.userSettings;
            var unit = locData.unit;

            var buildVersion = me._getBuildVersion();

            me.element.html("");
            me.element.off(events.modalDialogGenericSubmit);
            me.element.off(events.modalDialogGenericCancel);

            var headerHtml = forerunner.dialog.getModalDialogHeaderHtml("fr-icons24x24-setup", userSettings.title, "fr-us-cancel", "");
            var $theForm = new $(
            "<div class='fr-core-dialog-innerPage fr-core-center'>" +
                headerHtml +
                // form
                "<form class='fr-us-form fr-core-dialog-form'>" +
                    "<table>" +
                        "<tr>" +
                            "<td>" +
                                "<label class='fr-us-label'>" + userSettings.ResponsiveUI + "</label>" +
                            "</td>" +
                            "<td>" +
                                "<input class='fr-us-responsive-ui-id fr-us-checkbox'  name='ResponsiveUI' type='checkbox'/>" +
                            "</td>" +
                        "</tr>" +
                        "<tr>" +
                            "<td>" +
                                "<label class='fr-us-label'>" + userSettings.AdminUI + "</label>" +
                            "</td>" +
                            "<td>" +
                                "<input class='fr-us-admin-ui-id fr-us-checkbox'  name='adminUI' type='checkbox'/>" +
                            "</td>" +
                        "</tr>" +
                        "<tr>" +
                            "<td colspan='2'>" +
                                "<label class='fr-us-label fr-us-separator'>" + userSettings.Email + "</label>" +
                            "</td>" +
                        "</tr>" +
                        "<tr>" +
                            "<td colspan='2'>" +
                                "<input class='fr-us-email-id fr-us-textbox' autofocus='autofocus' name='Email' type='email'/>" +
                            "</td>" +
                        "</tr>" +
                    "</table>" +
                    // Ok button
                    "<div class='fr-core-dialog-submit-container'>" +
                        "<div class='fr-core-center'>" +
                        "<input name='submit' type='button' class='fr-us-submit-id fr-core-dialog-submit fr-core-dialog-button' value='" + userSettings.submit + "'/>" +
                    "</div>" +
                "</form>" +
                "<div class='fr-buildversion-container'>" +
                    buildVersion +
                "</div>" +
            "</div>");
            //http://localhost:9000/Forerunner/ReportViewer/Loc/ReportViewer-en.txt

            me.element.append($theForm);

            //disable form auto submit when click enter on the keyboard
            me.element.find(".fr-us-form").on("submit", function () { return false; });

            me.element.find(".fr-us-submit-id").on("click", function (e) {
                me._saveSettings();
            });

            me.element.find(".fr-us-cancel").on("click", function (e) {
                me.closeDialog();
            });

            me.element.on(events.modalDialogGenericSubmit, function () {
                me._saveSettings();
            });

            me.element.on(events.modalDialogGenericCancel, function () {
                me.closeDialog();
            });
        },
        _getBuildVersion: function () {
            var me = this;
            var url = forerunner.config.forerunnerFolder() + "version.txt";
            var buildVersion = null;
            $.ajax({
                url: url,
                dataType: "text",
                async: false,
                success: function (data) {
                    buildVersion = data;
                },
                fail: function (data) {
                    console.log(data);
                },
                error: function (jqXHR, textStatus, errorThrown) {
                    console.log(errorThrown);
                },
            });

            return buildVersion;
        },
        _getSettings: function () {
            var me = this;
            me.settings = me.options.$reportExplorer.reportExplorer("getUserSettings", true);

            me.$resposiveUI = me.element.find(".fr-us-responsive-ui-id");
            me.$email = me.element.find(".fr-us-email-id");
            var responsiveUI = me.settings.responsiveUI;
            me.$resposiveUI.prop("checked", responsiveUI);
            me.$email.val(me.settings.email);
            me.$adminUI = me.element.find(".fr-us-admin-ui-id");
            var adminUI = me.settings.adminUI;
            me.$adminUI.prop("checked", adminUI);
        },
        /**
         * Open user setting dialog
         *
         * @function $.forerunner.userSettings#openDialog
         */
        openDialog: function () {
            var me = this;

            me._getSettings();
            forerunner.dialog.showModalDialog(me.options.$appContainer, me);

        },
        _triggerClose: function (isSubmit) {
            var me = this;
            var data = {
                isSubmit: isSubmit,
                settings: me.settings
            };
            me._trigger(events.close, null, data);
            forerunner.dialog.closeModalDialog(me.options.$appContainer, me);
        },
        _saveSettings: function () {
            var me = this;
            me.settings.responsiveUI = me.$resposiveUI.prop("checked");
            me.settings.email = me.$email.val();
            me.settings.adminUI = me.$adminUI.prop("checked");
            //update cached setting
            forerunner.ajax.setUserSetting(me.settings);
            me.options.$reportExplorer.reportExplorer("saveUserSettings", me.settings);
            me._triggerClose(true);
        },
        /**
         * Close user setting dialog
         *
         * @function $.forerunner.userSettings#closeDialog
         */
        closeDialog: function () {
            var me = this;
            me._triggerClose(false);
        }
    }); //$.widget
});
///#source 1 1 /Forerunner/ReportExplorer/js/ForerunnerTags.js
/**
 * @file Contains the forerunnerTags widget.
 *
 */

var forerunner = forerunner || {};

// Forerunner SQL Server Reports
forerunner.ssr = forerunner.ssr || {};

$(function () {
    var widgets = forerunner.ssr.constants.widgets;
    var events = forerunner.ssr.constants.events;
    var locData = forerunner.localize.getLocData(forerunner.config.forerunnerFolder() + "ReportViewer/loc/ReportViewer");

    $.widget(widgets.getFullname(widgets.forerunnerTags), {
        options: {
            $appContainer: null,
            rsInstance: null,
        },
        _create: function () {

        },
        _init: function () {
            var me = this;

            me.element.html("");
            me.element.off(events.modalDialogGenericSubmit);
            me.element.off(events.modalDialogGenericCancel);

            var headerHtml = forerunner.dialog.getModalDialogHeaderHtml('fr-icons24x24-tags', locData.tags.title, "fr-tag-cancel", "");
            var $container = new $(
                "<div class='fr-core-dialog-innerPage fr-core-center'>" +
                    headerHtml +
                    "<div class='fr-tag-form-container'>" +
                        "<form class='fr-tag-form'>" +
                            "<table class='fr-tag-table'>" +
                                "<tr>" +
                                    "<td><label class='fr-tag-label'>" + locData.tags.tags + ":</label></td>" +
                                    "<td><input type='text' class='fr-core-input fr-tag-text' /></td>" +
                                "</tr>" +
                                "<tr class='fr-tag-prompt'>" +
                                    "<td></td>" +
                                    "<td><label class='fr-tag-label-prompt'>" + locData.tags.prompt + "</label></td>" +
                                "<tr>" +
                            "</table>" +
                        "</form>" +
                    "</div>" +
                    "<div class='fr-core-dialog-submit-container'>" +
                        "<div class='fr-core-center'>" +
                            "<input name='submit' type='button' class='fr-tag-submit-id fr-tag-button fr-core-dialog-button' value='" + locData.tags.submit + "' />" +
                        "</div>" +
                        "<div class='fr-tag-location' />" +
                    "</div>" +
                "</div>");

            me.element.append($container);

            me.$tags = me.element.find(".fr-tag-text")

            me.element.find(".fr-tag-submit-id").on("click", function () {
                me._saveTags();
            });

            me.element.find(".fr-tag-cancel").on("click", function (e) {
                me.closeDialog();
            });
            
            me.element.on(events.modalDialogGenericSubmit, function () {
                me._saveTags();
            });

            me.element.on(events.modalDialogGenericCancel, function () {
                me.closeDialog();
            });

            me.element.find(".fr-tag-form").on("submit", function () {
                return false;
            });
        },
        openDialog: function (path) {
            var me = this;
            me._getTags(path);
           
            var text = path.substring(path.lastIndexOf("/") + 1);
            text = locData.tags.yourPosition + ": " + text;
            me.element.find(".fr-tag-location").text(text);

            forerunner.dialog.showModalDialog(me.options.$appContainer, me);
        },
        closeDialog: function () {
            var me = this;

            forerunner.dialog.closeModalDialog(me.options.$appContainer, me);
        },
        _tags: null,
        _getTags: function (path) {
            var me = this;

            if (me.path !== path) {
                me._tags = null;
                me.path = null;

                forerunner.ajax.ajax({
                    type: "GET",
                    dataType: "JSON",
                    url: forerunner.config.forerunnerAPIBase() + "ReportManager/GetReportTags",
                    async: false,
                    data: {
                        path: path,
                        instance: me.options.rsInstance,
                    },
                    success: function (data) {
                        me.path = path;

                        if (data.Tags !== "NotFound") {
                            me._tags = data.Tags.join(",");
                        }
                    },
                    fail: function (data) {
                    },
                });
            }

            if (me._tags) {
                me._tags = me._tags.replace(/"/g, '');
            }

            me.$tags.val(me._tags);
        },
        _saveTags: function () {
            var me = this;

            var tags = me.$tags.val(),
                tagList;

            if (tags.trim() !== "" && tags !== me._tags) {
                tagList = tags.split(",");
                for (var i = 0; i < tagList.length; i++) {
                    tagList[i] = '"' + tagList[i].trim() + '"';
                }
                tags = tagList.join(",");
                me._tags = tags;

                forerunner.ajax.ajax(
                {
                    type: "POST",
                    dataType: "text",
                    url: forerunner.config.forerunnerAPIBase() + "ReportManager/SaveReportTags/",
                    data: {
                        reportTags: tags,
                        path: me.path,
                        instance: me.options.rsInstance,
                    },
                    success: function (data) {
                        //bug 1078, not show succeeded dialig, instead just close current dialog
                        //forerunner.dialog.showMessageBox(me.options.$appContainer, locData.messages.addTagsSucceeded, locData.toolPane.tags);
                    },
                    fail: function (data) {
                        forerunner.dialog.showMessageBox(me.options.$appContainer, locData.messages.addTagsFailed, locData.toolPane.tags);
                    },
                    async: false
                });
            }

            me.closeDialog();
        }
    });
});
///#source 1 1 /Forerunner/ReportExplorer/js/ReportExplorerSearchFolder.js
/**
 * @file Contains the reportExplorerSearchFolder widget.
 *
 */

var forerunner = forerunner || {};

// Forerunner SQL Server Reports
forerunner.ssr = forerunner.ssr || {};

$(function () {
    var widgets = forerunner.ssr.constants.widgets;
    var events = forerunner.ssr.constants.events;
    var locData = forerunner.localize.getLocData(forerunner.config.forerunnerFolder() + "ReportViewer/loc/ReportViewer");

    $.widget(widgets.getFullname(widgets.reportExplorerSearchFolder), {
        options: {
            $reportExplorer: null,
            $appContainer: null
        },
        _create: function () {

        },
        _init: function () {
            var me = this;

            me.element.html("");
            me.element.off(events.modalDialogGenericSubmit);
            me.element.off(events.modalDialogGenericCancel);            

            var headerHtml = forerunner.dialog.getModalDialogHeaderHtml('fr-icons24x24-searchfolder', locData.searchFolder.title, "fr-sf-cancel", "");
            var $container = new $(
                "<div class='fr-core-dialog-innerPage fr-core-center'>" +
                    headerHtml +
                   "<div class='fr-sf-form-container'>" +
                        "<form class='fr-sf-form'>" +
                            "<table class='fr-sf-table'>" +
                                "<tr>" +
                                    "<td><label class='fr-sf-label'>" + locData.searchFolder.name + ":</label></td>" +
                                    "<td><input type='text' class='fr-sf-text fr-sf-foldername' name='foldername' required='true' /></td>" +
                                "</tr>" +
                                "<tr>" +
                                    "<td><label class='fr-sf-label'>" + locData.searchFolder.tags + ":</label></td>" +
                                    "<td><input type='text' class='fr-sf-text fr-sf-foldertags' name='tags' required='true' /></td>" +
                                "</tr>" +
                                "<tr class='fr-sf-prompt'>" +
                                    "<td></td>" +
                                    "<td><label class='fr-sf-label-prompt'>" + locData.searchFolder.prompt + "</label></td>" +
                                "<tr>" +
                            "</table>" +
                        "</form>" +
                    "</div>" +
                    "<div class='fr-core-dialog-submit-container'>" +
                        "<div class='fr-core-center'>" +
                            "<input type='button' class='fr-sf-submit-id fr-sf-button fr-core-dialog-button' value='" + locData.searchFolder.submit + "' />" +
                        "</div>" +
                        "<div class='fr-sf-location' />" +
                    "</div>" +
                "</div>");

            me.element.append($container);

            me.$form = $container.find(".fr-sf-form");
            me.$form.validate({
                errorPlacement: function (error, element) {
                    error.appendTo(element.parent("td"));
                },
                highlight: function (element) {
                    $(element).addClass("fr-sf-error");
                },
                unhighlight: function (element) {
                    $(element).removeClass("fr-sf-error");
                }
            });

            //disable form auto submit when click enter on the keyboard
            me.$form.on("submit", function () { return false; });

            me.element.find(".fr-sf-cancel").on("click", function (e) {
                me.closeDialog();
            });

            me.element.find(".fr-sf-submit-id").on("click", function (e) {
                me._createSearchFolder();
            });
            
            me.element.on(events.modalDialogGenericSubmit, function () {
                me._createSearchFolder();
            });

            me.element.on(events.modalDialogGenericCancel, function () {
                me.closeDialog();
            });
        },
        _createSearchFolder: function () {
            var me = this;

            if (me.$form.valid()) {
                var name = me.element.find(".fr-sf-foldername").val().trim();
                var tags = me.element.find(".fr-sf-foldertags").val().trim();
                var tagsList = tags.split(",");

                for (var i = 0; i < tagsList.length; i++) {
                    tagsList[i] = '"' + tagsList[i].trim() + '"';
                }

                var searchfolder = { searchFolderName: name, content: { name: name, tags: tagsList.join(",") } };

                me.options.$reportExplorer.reportExplorer("createSearchFolder", searchfolder);
                me.closeDialog();
            }
        },
        openDialog: function () {
            var me = this;
            var content = me.options.$reportExplorer.reportExplorer("getSearchFolderContent");
            if (content) {
                content = JSON.parse(content);//replace(/"/g, '')
                me.element.find(".fr-sf-foldername").val(content.name)
                me.element.find(".fr-sf-foldertags").val(content.tags.replace(/"/g, ''));
            }
            else {
                me.element.find(".fr-sf-foldername").val("")
                me.element.find(".fr-sf-foldertags").val("");
            }

            var path = me.options.$reportExplorer.reportExplorer("getCurrentPath");
            var location;
            if (path === "/") {
                location = locData.searchFolder.homePage;
            }
            else {
                location = path.substring(path.lastIndexOf("/") + 1);
            }
            location = locData.searchFolder.createTo + ": " + location;
            me.element.find(".fr-sf-location").text(location);

            forerunner.dialog.showModalDialog(me.options.$appContainer, me);
        },
        closeDialog: function () {
            var me = this;

            forerunner.dialog.closeModalDialog(me.options.$appContainer, me);
        },
    });   
});
///#source 1 1 /Forerunner/ReportViewer/js/ReportRender.js
// Assign or create the single globally scoped variable
var forerunner = forerunner || {};

// Forerunner SQL Server Reports
forerunner.ssr = forerunner.ssr || {};

$(function () {
    var widgets = forerunner.ssr.constants.widgets;
   
    //  The ReportIemContext simplifies the signature for all of the functions to pass context around
    function reportItemContext(RS, CurrObj, CurrObjIndex, CurrObjParent, $HTMLParent, Style, CurrLocation,ApplyBackgroundColor) {
        this.RS = RS;
        this.CurrObj = CurrObj;
        this.CurrObjIndex = CurrObjIndex;
        this.CurrObjParent = CurrObjParent;
        this.$HTMLParent = $HTMLParent;
        this.Style = Style;
        this.CurrLocation = CurrLocation;
        this.ApplyBackgroundColor = ApplyBackgroundColor;
    }
    function layout() {
        this.ReportItems = {};
        this.Height = 0;
        this.LowestIndex = null;
    }
    // Temp measurement mimics the server measurement object
    function tempMeasurement(height, width) {
        this.Height = height;
        this.Width = width;
    }
    //  Report Item Location is used my the layout to absolute position objects in a rectangle/section/column
    function reportItemLocation(index) {
        this.TopDelta = 0;
        this.Height = 0;
        this.Left = 0;
        this.Index = index;
        this.IndexAbove = null;
        this.NewHeight = null;
        this.NewTop = null;
    }
    // The Floating header object holds pointers to the tablix and its row and col header objects
    function floatingHeader($tablix, $rowHeader, $colHeader) {
        this.$tablix = $tablix;
        this.$rowHeader = $rowHeader;
        this.$colHeader = $colHeader;
    }

    /**
    * Widget used to render the report
    *
    * @namespace $.forerunner.reportRender
    * @prop {Object} options - The options for reportRender
    * @prop {String} options.reportViewer - The ReportViewer object  that is rendering this report
    * @prop {boolean} options.responsive - Whether the report layout should be based on the device size or the RDL defintion
    * @prop {Number} options.renderTime - Unique id for this report
    * @example
    * $("#reportRenderId").reportRender({ reportViewer: this, responsive: true, renderTime: new Date().getTime() });
    * $("#reportViewerId").reportRender("render", 1);
    */


    // report render widget
    $.widget(widgets.getFullname(widgets.reportRender),/** @lends $.forerunner.reportRender */ {
        // Default options
        options: {
            reportViewer: null,
            responsive: false,
            renderTime: null,
        },
        // Constructor
        _create: function () {
            var me = this;
            var isTouch = forerunner.device.isTouch();
            me._defaultResponsizeTablix = forerunner.config.getCustomSettingsValue("DefaultResponsiveTablix", "on").toLowerCase();
            me._maxResponsiveRes = forerunner.config.getCustomSettingsValue("MaxResponsiveResolution", 1280);

            if (me.options.reportViewer)
                me._currentWidth = me.options.reportViewer.element.width();

            // For touch device, update the header only on scrollstop.
            if (isTouch) {
                $(window).on("scrollstop", function () { me._lazyLoadTablix(me); });
            } else {
                $(window).on("scroll", function () { me._lazyLoadTablix(me); });
            }
        },
         
        /**
        * Renders the report
        *
        * @function $.forerunner.reportRender#render
        *
        * @param {integer} Page - The page number of the report to render
        */
        render: function (Page, delayLayout, RLDExt) {
            var me = this;
            me.reportObj = Page.reportObj;
            me.Page = Page;
            me._tablixStream = {};
            me.RDLExt = RLDExt;
            
            me._currentWidth = me.options.reportViewer.element.width();
            if (me.Page.Replay === undefined)
                me.Page.Replay = {};

            me._createStyles(me.options.reportViewer);
            me._reRender();
            
            if (delayLayout !== true)
                me.layoutReport();
        },
        _reRender: function(){
            var me = this;
            var reportDiv = me.element;
            var reportViewer = me.options.reportViewer;
            me._rectangles = [];
            me._currentWidth = me.options.reportViewer.element.width();

            reportDiv.html("");

            $.each(me.reportObj.ReportContainer.Report.PageContent.Sections, function (Index, Obj) {
                me._writeSection(new reportItemContext(reportViewer, Obj, Index, me.reportObj.ReportContainer.Report.PageContent, reportDiv, ""));
            });
            me._addPageStyle(reportViewer, me.reportObj.ReportContainer.Report.PageContent.PageLayoutStart.PageStyle, me.reportObj);         

        },
        _addPageStyle: function (reportViewer, pageStyle, reportObj) {
            var me = this;

            var style = me._getStyle(reportViewer, pageStyle);
            var bgLayer = new $("<div class='fr-render-bglayer'></div>");
            bgLayer.attr("style", style);

            if (reportObj.ReportContainer.Trial ===1) {                
                me.element.append(me._getWatermark());
            }

            
            me.element.append(bgLayer);
        },
        _getWatermark: function () {

            var wstyle = "opacity:0.30;color: #d0d0d0;font-size: 120pt;position: absolute;margin: 0;left:0px;top:40px; pointer-events: none;";
            if (forerunner.device.isMSIE8() || forerunner.device.isAndroid()) {
                var wtr = $("<DIV/>").html("Evaluation");
                wstyle += "z-index: -1;";
                wtr.attr("style", wstyle);
                return wtr;
            }

            var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            svg.setAttribute("xlink", "http://www.w3.org/1999/xlink");
            svg.setAttribute("width", "100%");
            svg.setAttribute("height", "100%");
            svg.setAttribute("pointer-events", "none");

            wstyle = "opacity:0.10;color: #d0d0d0;font-size: 120pt;position: absolute;margin: 0;left:0px;top:40px; pointer-events: none;";
            if (forerunner.device.isSafariPC())
                wstyle += "z-index: -1;";
            else
                wstyle += "z-index: 1000;";
            
            //wstyle += "-webkit-transform: rotate(-45deg);-moz-transform: rotate(-45deg);-ms-transform: rotate(-45deg);transform: rotate(-45deg);"
            svg.setAttribute("style", wstyle);

            
            var text = document.createElementNS("http://www.w3.org/2000/svg", "text");
            text.setAttribute("x", "10");
            text.setAttribute("y", "160");
            text.setAttribute("fill", "#000");
            text.setAttribute("pointer-events", "none");
            text.textContent = "E" + "val" + "ua" + "tion";

            svg.appendChild(text);

            return svg;
        },
         /**
         * Writes error data to the page
         *
         * @function $.forerunner.reportRender#writeError
         *
         * @param {object} errorData - Error data object to srite error page from.
         */
        writeError: function (errorData) {
            var me = this;
            var errorTag = me.options.reportViewer.locData.errorTag;
            var $cell;

            if (errorData.Exception.Type === "LicenseException") {
                //Reason: Expired,MachineMismatch,TimeBombMissing,SetupError
                me.element.html($("<div class='Page' >" +
                    "<div class='fr-render-error-license Page'>" +
                    "<div class='fr-render-error-license-container'>"+
                    "<div class='fr-render-error-license-title'></div><br/>" +
                    "<div class='fr-render-error-license-content'></div>" +
                    "</div></div>"));
                if (me.options.reportViewer) {
                    $cell = me.element.find(".fr-render-error-license-title");
                    $cell.html(errorTag.licenseErrorTitle);
                    $cell = me.element.find(".fr-render-error-license-content");
                    $cell.html(errorTag.licenseErrorContent);
                }                

            }
            else {
                me.element.html($("<div class='Page' >" +
               "<div class='fr-render-error-message'></div></br>" +
               "<div class='fr-render-error-details'>" + errorTag.moreDetail + "</div>" +
               "<div class='fr-render-error'><h3>" + errorTag.serverError + "</h3>" +
               "<div class='fr-render-error fr-render-error-DetailMessage'></div>" +
               "<div class='fr-render-error fr-render-error-type'></div>" +
               "<div class='fr-render-error fr-render-error-targetsite'></div>" +
               "<div class='fr-render-error fr-render-error-source'></div>" +
               "<div class='fr-render-error fr-render-error-stacktrace'></div>" +
               "</div></div>"));

                if (me.options.reportViewer) {
                    $cell = me.element.find(".fr-render-error");
                    $cell.hide();

                    $cell = me.element.find(".fr-render-error-details");
                    $cell.on("click", { $Detail: me.element.find(".fr-render-error") }, function (e) { e.data.$Detail.show(); $(e.target).hide(); });

                    $cell = me.element.find(".fr-render-error-DetailMessage");
                    $cell.append("<h4>" + errorTag.message + ":</h4>" + errorData.Exception.DetailMessage);

                    $cell = me.element.find(".fr-render-error-type");
                    $cell.append("<h4>" + errorTag.type + ":</h4>" + errorData.Exception.Type);

                    $cell = me.element.find(".fr-render-error-targetsite");
                    $cell.html("<h4>" + errorTag.targetSite + ":</h4>" + errorData.Exception.TargetSite);

                    $cell = me.element.find(".fr-render-error-source");
                    $cell.html("<h4>" + errorTag.source + ":</h4>" + errorData.Exception.Source);

                    $cell = me.element.find(".fr-render-error-message");
                    $cell.html(errorData.Exception.Message);

                    $cell = me.element.find(".fr-render-error-stacktrace");
                    $cell.html("<h4>" + errorTag.stackTrace + ":</h4>" + errorData.Exception.StackTrace);
                }
            }
        },
        _writeSection: function (RIContext) {
            var me = this;
            var $newObj = me._getDefaultHTMLTable();
            var $sec = $("<TR/>");
            var loc;

            //Need to determine Header and footer Index
            var headerIndex;
            var footerIndex;
            var bodyIndex;

            var sectionMeasurement;
            if (RIContext.CurrObj.Measurement)
                sectionMeasurement = RIContext.CurrObj.Measurement;
            else
                sectionMeasurement = RIContext.CurrObjParent.Measurement;
            
            for (var i = 0; i < sectionMeasurement.Count; i++) {
                if (sectionMeasurement.Measurements[i].Type === "PageHeader")
                    headerIndex = i;
                if (sectionMeasurement.Measurements[i].Type === "PageFooter")
                    footerIndex = i;
                if (sectionMeasurement.Measurements[i].Type === "BodyArea")
                    bodyIndex = i;
            }

            loc = bodyIndex >= 0 ? sectionMeasurement.Measurements[bodyIndex] : me._getMeasurmentsObj(RIContext.CurrObjParent, RIContext.CurrObjIndex);
            
            //Page Header
            if (RIContext.CurrObj.PageHeader)
                $newObj.append(me._writeHeaderFooter(RIContext, "PageHeader", headerIndex));
            //Page Header on PageContent
            if (RIContext.CurrObjParent.PageHeader)
                $newObj.append(me._writeHeaderFooter(new reportItemContext(RIContext.RS, RIContext.CurrObjParent, null, null, null, null, null), "PageHeader", headerIndex));
            
            $sec.attr("Style", "width:" + me._getWidth(loc.Width) + "mm;");

            //Columns
            $newObj.append($sec);
            $.each(RIContext.CurrObj.Columns, function (index, obj) {
                var $col = new $("<TD/>");
                $col.append(me._writeRectangle(new reportItemContext(RIContext.RS, obj, index, RIContext.CurrObj, new $("<Div/>"), null, loc)));
                $sec.append($col);
            });

            //Page Footer
            if (RIContext.CurrObj.PageFooter)
                $newObj.append(me._writeHeaderFooter(RIContext, "PageFooter", footerIndex));
            //Page Footer on PageContent
            if (RIContext.CurrObjParent.PageFooter)
                $newObj.append(me._writeHeaderFooter(new reportItemContext(RIContext.RS, RIContext.CurrObjParent, null, null, null, null, null), "PageFooter", footerIndex));

            RIContext.$HTMLParent.append($newObj);
        },
        _writeHeaderFooter: function (RIContext, HeaderOrFooter, Index) {
            var me = this;
            //Page Header
            if (RIContext.CurrObj[HeaderOrFooter]) {
                var $header = $("<TR/>");
                var $headerTD = $("<TD/>");
                $header.append($headerTD);
                var headerLoc = me._getMeasurmentsObj(RIContext.CurrObj, Index);

                $header.attr("Style", "width:" + me._getWidth(headerLoc.Width) + "mm;");

                $headerTD.append(me._writeRectangle(new reportItemContext(RIContext.RS, RIContext.CurrObj[HeaderOrFooter], Index, RIContext.CurrObj, new $("<DIV/>"), null, headerLoc)));
                return $header;
            }
        },
        _writeRectangle: function (RIContext) {
            var $RI;        //This is the ReportItem Object
            var $LocDiv;    //This DIV will have the top and left location set, location is not set anywhere else
            var Measurements;
            //var RecLayout;
            var Style;
            var me = this;
            var ReportItems = {};
            var rec = RIContext.$HTMLParent;

            Measurements = RIContext.CurrObj.Measurement.Measurements;
            var sharedElements = me._getSharedElements(RIContext.CurrObj.Elements.SharedElements);            
            var RecExt = me._getRDLExt(RIContext);

            if (RecExt.FormAction) {
                rec = $("<form />");
                rec.attr("action", RecExt.FormAction);
                if (RecExt.FormName) rec.attr("name", RecExt.FormName);
                if (RecExt.FormMethod) rec.attr("method", RecExt.FormMethod);
                RIContext.$HTMLParent = rec;
            }
            if (RecExt.IFrameSrc) {
                rec = $("<iframe />");
                rec.attr("src", RecExt.IFrameSrc);
                //if (RecExt.IFrameSeamless === false) {
                //    rec.attr("seamless", "seamless");
                //}
                if (RecExt.IFrameSeamless === true)
                    rec.addClass("fr-iframe-seamless");

                RIContext.$HTMLParent = rec;
            }
            else if(RecExt.CustomHTML){
                rec = $("<div />");
                rec.html(RecExt.CustomHTML);
                RIContext.$HTMLParent = rec;
            }
            if(RecExt.ID)
                rec.attr("id", RecExt.ID);

            else {

                $.each(RIContext.CurrObj.ReportItems, function (Index, Obj) {

                    Style = "";
                    if (Obj.Type !== "Line") {
                        //Style = "display:table;border-collapse:collapse;";
                        if (Obj.Elements)
                            Style += me._getFullBorderStyle(Obj.Elements.NonSharedElements.Style);
                    }

                    $RI = me._writeReportItems(new reportItemContext(RIContext.RS, Obj, Index, RIContext.CurrObj, new $("<Div/>"), Style, Measurements[Index]));
                    if (Obj.Type !== "Line" && Obj.Type !== "Tablix") {
                        $RI.addClass("fr-render-rec");
                        $RI.addClass(me._getClassName("fr-b-", Obj));
                    }

                    $LocDiv = new $("<Div/>");
                    $LocDiv.append($RI);
                    Style = "";

                    //RecLayout.ReportItems[Index].NewHeight = Measurements[Index].Height;
                    ReportItems[Index] = {};
                    ReportItems[Index].HTMLElement = $LocDiv;
                    ReportItems[Index].Type = Obj.Type;

                    if (Obj.Type === "Tablix" && me._tablixStream[Obj.Elements.NonSharedElements.UniqueName].BigTablix === true) {
                        ReportItems[Index].BigTablix = true;
                    }

                    //if (RecLayout.ReportItems[Index].IndexAbove === null)
                    //    RecLayout.ReportItems[Index].NewTop = Measurements[Index].Top;

                    Style += "position:absolute;";

                    if (Measurements[Index].zIndex)
                        Style += "z-index:" + Measurements[Index].zIndex + ";";

                    //Background color goes on container
                    if (RIContext.CurrObj.ReportItems[Index].Element && RIContext.CurrObj.ReportItems[Index].Elements.NonSharedElements.Style && RIContext.CurrObj.ReportItems[Index].Elements.NonSharedElements.Style.BackgroundColor)
                        Style += "background-color:" + RIContext.CurrObj.ReportItems[Index].Elements.NonSharedElements.Style.BackgroundColor + ";";

                    $LocDiv.attr("Style", Style);
                    $LocDiv.append($RI);
                    rec.append($LocDiv);
                });
            }

            Style = "position:relative;";
            //This fixed an IE bug dublicate styles
            if (RIContext.CurrObjParent.Type !== "Tablix") {
                Style += me._getElementsStyle(RIContext.RS, RIContext.CurrObj.Elements);
                rec.addClass(me._getClassName("fr-n-", RIContext.CurrObj));
                rec.addClass(me._getClassName("fr-t-", RIContext.CurrObj));
                rec.addClass(me._getClassName("fr-b-", RIContext.CurrObj));
                Style += me._getFullBorderStyle(RIContext.CurrObj.Elements.NonSharedElements.Style);
            }
             
            if (RecExt.FixedHeight)
                Style += "overflow-y: scroll;height:" + me._convertToMM(RecExt.FixedHeight) + "mm;";
            if (RecExt.FixedWidth)
                Style += "overflow-x: scroll;width:" + me._convertToMM(RecExt.FixedWidth) + "mm;";

            rec.attr("Style", Style);
            if (RIContext.CurrObj.Elements.NonSharedElements.UniqueName)
                me._writeUniqueName(rec, RIContext.CurrObj.Elements.NonSharedElements.UniqueName);
            me._writeBookMark(RIContext);
            me._writeTooltip(RIContext);

            //Add Rec to Rec collection to layout later
            me._rectangles.push({ ReportItems: ReportItems, Measurements: Measurements, HTMLRec: rec, RIContext: RIContext, RecExt: RecExt });

            return rec;
        },

        layoutReport: function(isLoaded,force,RDLExt){
            var me = this;
            renderWidth = me.options.reportViewer.element.width();
            if (RDLExt)
                me.RDLExt = RDLExt;
            if (renderWidth === 0)
                return true;

            //Need to re-render
            if ((Math.abs(me._currentWidth - renderWidth) > 30 || force) && me.options.responsive && me._defaultResponsizeTablix === "on" ) {
                me._currentWidth = renderWidth;
                me._reRender();
            }
            
            for (var r = 0; r < me._rectangles.length; r++) {
                var rec = me._rectangles[r];
                var RecLayout = me._getRectangleLayout(rec.Measurements);
                var Measurements = rec.Measurements;
                var RIContext = rec.RIContext;

                for (var Index = 0; Index < forerunner.helper.objectSize(RecLayout.ReportItems); Index++) {                   

                    //Determin height and location
                    if (rec.ReportItems[Index].Type === "Image" || rec.ReportItems[Index].Type === "Chart" || rec.ReportItems[Index].Type === "Gauge" || RecLayout.ReportItems[Index].Type === "Map" || rec.ReportItems[Index].Type === "Line")
                        RecLayout.ReportItems[Index].NewHeight = rec.Measurements[Index].Height;
                    else {
                        if (isLoaded)
                            RecLayout.ReportItems[Index].NewHeight = me._convertToMM(rec.ReportItems[Index].HTMLElement.outerHeight() + "px");
                        else if (rec.ReportItems[Index].BigTablix)
                            RecLayout.ReportItems[Index].NewHeight = rec.Measurements[Index].Height;
                        else
                            RecLayout.ReportItems[Index].NewHeight = me._getHeight(rec.ReportItems[Index].HTMLElement);
                        
                    }

                    // If I grew I may be the new bottom
                    if (RecLayout.ReportItems[Index].NewHeight > RecLayout.ReportItems[RecLayout.LowestIndex].NewHeight && RecLayout.ReportItems[Index].IndexAbove === RecLayout.ReportItems[RecLayout.LowestIndex].IndexAbove) {
                        RecLayout.LowestIndex = Index;
                    }

                    if (RecLayout.ReportItems[Index].IndexAbove === null)
                        RecLayout.ReportItems[Index].NewTop = Measurements[Index].Top;
                    else
                        RecLayout.ReportItems[Index].NewTop = parseFloat(RecLayout.ReportItems[RecLayout.ReportItems[Index].IndexAbove].NewTop) + parseFloat(RecLayout.ReportItems[RecLayout.ReportItems[Index].IndexAbove].NewHeight) + parseFloat(RecLayout.ReportItems[Index].TopDelta);
                
                    rec.ReportItems[Index].HTMLElement.css("top", me._roundToTwo(RecLayout.ReportItems[Index].NewTop) + "mm");
                    rec.ReportItems[Index].HTMLElement.css("left", me._roundToTwo(RecLayout.ReportItems[Index].Left) + "mm");
                }                

                if (rec.RecExt.FixedHeight || rec.RecExt.FixedWidth) {
                    rec.HTMLRec.removeClass("fr-render-rec");
                }
                if (RIContext.CurrLocation) {
                    if (rec.RecExt.FixedWidth === undefined)
                        rec.HTMLRec.css("width", me._getWidth(RIContext.CurrLocation.Width) + "mm");

                    if (RIContext.CurrObj.ReportItems.length === 0)
                        rec.HTMLRec.css("height", me._roundToTwo((RIContext.CurrLocation.Height + 1)) + "mm");
                    else {

                        var parentHeight = parseFloat(RecLayout.ReportItems[RecLayout.LowestIndex].NewTop) +
                                            parseFloat(RecLayout.ReportItems[RecLayout.LowestIndex].NewHeight) +
                                            (parseFloat(RIContext.CurrLocation.Height) -
                                                (parseFloat(Measurements[RecLayout.LowestIndex].Top) +
                                                parseFloat(Measurements[RecLayout.LowestIndex].Height))) +
                                            0; //changed from 1  may need to change back
                        if (rec.RecExt.FixedHeight === undefined) {
                            rec.HTMLRec.css("height", me._roundToTwo(parentHeight) + "mm");
                        }
                    }

                }
            }
            me.element.hide().show(0);
            return false;
        },
        _getRectangleLayout: function (Measurements) {
            var l = new layout();
            var me = this;

            $.each(Measurements, function (Index, Obj) {
                l.ReportItems[Index] = new reportItemLocation(Index);
                var curRI = l.ReportItems[Index];
                curRI.Left = Obj.Left;

                if (me.isNull(l.LowestIndex))
                    l.LowestIndex = Index;
                else if (Obj.Top + Obj.Height > Measurements[l.LowestIndex].Top + Measurements[l.LowestIndex].Height)
                    l.LowestIndex = Index;

                for (var i = 0; i < Measurements.length; i++) {
                    var bottom =  Measurements[i].Top + Measurements[i].Height;
                    if (Obj.Top > bottom)           
                    {
                        if (!curRI.IndexAbove){
                            curRI.IndexAbove = i;
                            curRI.TopDelta = Obj.Top - bottom;
                        }
                        else if (bottom > Measurements[curRI.IndexAbove].Top + Measurements[curRI.IndexAbove].Height){
                            curRI.IndexAbove = i;
                            curRI.TopDelta = Obj.Top - bottom;
                        }
                    }
                }
               
            });
    
            if (me.options.responsive)
                return me._getResponsiveRectangleLayout(Measurements,l);
            return l;
        },
        _getResponsiveRectangleLayout: function (Measurements,layout) {           
            var me = this;

            var viewerWidth = me._convertToMM(me._currentWidth + "px");
            var anyMove = false;

            $.each(Measurements, function (Index, Obj) {               
                var curRI = layout.ReportItems[Index];                
                curRI.OrgBottom = Obj.Top + Obj.Height;
                curRI.OrgRight = Obj.Left + Obj.Width;
                curRI.OrgIndexAbove = curRI.IndexAbove;
                var bottompMove = false;
                
                var topMove = false;

                if (curRI.OrgRight > viewerWidth) {
                    curRI.Left = 0;

                    //Measurements.length
                    for (var i = 0; i < Measurements.length; i++) {
                        var bottom = Measurements[i].Top + Measurements[i].Height;
                        var right = Measurements[i].Left + Measurements[i].Width;

                        //Above
                        //&& (layout.ReportItems[i].Left < Obj.Width)
                        if (!topMove && (Index !== i) && (Obj.Top < Measurements[i].Top) && (curRI.OrgBottom > Measurements[i].Top) ) {
                            layout.ReportItems[i].IndexAbove = Index;
                            layout.ReportItems[i].TopDelta = 1;
                            if (Index === layout.LowestIndex)
                                layout.LowestIndex = layout.ReportItems[i].Index;                            
                            anyMove = true;
                            topMove = true;
                        }
                        //Below
                        //&& (layout.ReportItems[i].Left < Obj.Width)
                        if ((Index !== i) && (Obj.Top >= Measurements[i].Top) && (Obj.Top < bottom) && Index > i ) {
                            //Not below if there is another one lower
                            if (curRI.IndexAbove === null || layout.ReportItems[curRI.IndexAbove].OrgBottom <= layout.ReportItems[i].OrgBottom) { //chnaged to <=  to fix rec height issue, need to test more
                                curRI.IndexAbove = i;
                                curRI.TopDelta = 1;
                                if (i === layout.LowestIndex)
                                    layout.LowestIndex = Index;
                                bottompMove = true;
                                anyMove = true;
                            }
                        }

                        
                    }
                }

                if (anyMove || (Index === Measurements.length - 1)) {
                    for (var j = 0; j < curRI.Index ; j++) {
                        // if I have the same index above and I did not move but you did more then I have to move down
                        if (curRI.IndexAbove === layout.ReportItems[j].IndexAbove && curRI.OrgRight <= viewerWidth && layout.ReportItems[j].OrgRight > viewerWidth) {
                            curRI.IndexAbove = j;

                            //Fix Lowest Index
                            if (layout.LowestIndex === j)
                                layout.LowestIndex = curRI.Index;
                        }
                        // if you moved or I moved
                        if (layout.ReportItems[j].OrgRight > viewerWidth || curRI.OrgRight > viewerWidth) {
                            //if my index above is the same as yours then move me down
                            if (curRI.IndexAbove === layout.ReportItems[j].IndexAbove) {
                                curRI.IndexAbove = layout.ReportItems[j].Index;
                                curRI.TopDelta = 1;

                                //Fix Lowest Index
                                if (layout.LowestIndex === layout.ReportItems[j].Index)
                                    layout.LowestIndex = curRI.Index;
                            }
                            // else if your origional index above is my new index above then you move down
                            else if (layout.ReportItems[j].OrgIndexAbove === curRI.IndexAbove && j > curRI.Index) {
                                layout.ReportItems[j].IndexAbove = curRI.Index;
                                layout.ReportItems[j].TopDelta = 1;

                                //Fix Lowest Index
                                if (layout.LowestIndex === curRI.Index)
                                    layout.LowestIndex = layout.ReportItems[j].Index;
                            }
                        }
                        // If we now overlap move me down
                        if (curRI.IndexAbove === layout.ReportItems[j].IndexAbove && curRI.Left >= Measurements[j].Left && curRI.Left < layout.ReportItems[j].Left + Measurements[j].Width) {
                            curRI.IndexAbove = layout.ReportItems[j].Index;
                            curRI.TopDelta = 1;

                            //Fix Lowest Index
                            if (layout.LowestIndex === layout.ReportItems[j].Index)
                                layout.LowestIndex = curRI.Index;

                        }
                    }
                }
                

            });

            return layout;
        },
        _writeReportItems: function (RIContext) {
            var me = this;

            switch (RIContext.CurrObj.Type) {
                case "RichTextBox":
                    return me._writeRichText(RIContext);
                    //break;
                case "Image":
                case "Chart":
                case "Gauge":
                case "Map":
                    return me._writeImage(RIContext);
                    //break;
                case "Tablix":
                    return me._writeTablix(RIContext);
                    //break;
                case "Rectangle":
                    return me._writeRectangle(RIContext);
                    //break;
                case "SubReport":
                    return me._writeSubreport(RIContext);
                    //break;
                case "Line":
                    return me._writeLine(RIContext);
                    //break;
            }
        },

        _getRDLExt: function (RIContext) {
            var me = this;

            var rdlExt = {};
            if (me.RDLExt) {
                rdlExt = me.RDLExt[me._getSharedElements(RIContext.CurrObj.Elements.SharedElements).Name];
                if (!rdlExt)
                    rdlExt = {};
            }
            return rdlExt;

        },
        _writeRichText: function (RIContext) {
            var Style = RIContext.Style;
            var $TextObj = $("<div/>");
            var $Sort = null;
            var me = this;

            //See if RDLExt
            var textExt = me._getRDLExt(RIContext);
                       
            Style += "";
            
            if (me._getMeasurements(me._getMeasurmentsObj(RIContext.CurrObjParent, RIContext.CurrObjIndex), true) !== "")
                Style += me._getMeasurements(me._getMeasurmentsObj(RIContext.CurrObjParent, RIContext.CurrObjIndex), true);

            //This fixed an IE bug for duplicate syyles
            if (RIContext.CurrObjParent.Type !== "Tablix" || RIContext.ApplyBackgroundColor) {
                Style += me._getElementsNonTextStyle(RIContext.RS, RIContext.CurrObj.Elements);
                RIContext.$HTMLParent.addClass(me._getClassName("fr-n-", RIContext.CurrObj));
            }

        
            
            RIContext.$HTMLParent.attr("Style", Style);
            RIContext.$HTMLParent.addClass("fr-r-rT");


            Style = "";
            //Special case for RDL extension inputType
            if (textExt.InputType) {
                if (textExt.InputType === "textarea") {
                    $TextObj = $("<textarea name='" + textExt.InputName + "'/>");
                    Style += "resize:none;" 
                }
                else
                    $TextObj = $("<input type='" + textExt.InputType + "' name='" + textExt.InputName + "'/>");
                Style += "height:auto;box-sizing:border-box;";
                if (textExt.InputRequired === true)
                    $TextObj.attr("required", true);
                if (textExt.InputSubmit)
                    $TextObj.attr("data-submitType", textExt.InputSubmit);
                $TextObj.addClass("fr-input-" + textExt.InputType);
                //Handle EasySubmit
                if (textExt.EasySubmitURL && textExt.EasySubmitType) {
                    $TextObj.on("click", { reportViewer: me.options.reportViewer.element, element: $TextObj, getInputs: me._getInputsInRow, easySubmit:me._submitRow, veryEasySubmit: me._easySubmit }, function (e) {
                        e.data.veryEasySubmit(e, textExt.EasySubmitType, textExt.EasySubmitURL, textExt.EasySubmitDatatype, textExt.EasySubmitSuccess, textExt.EasySuccessFail);
                    });
                }
            }


            if (me._getSharedElements(RIContext.CurrObj.Elements.SharedElements).IsToggleParent === true || RIContext.CurrObj.Elements.NonSharedElements.IsToggleParent === true) {
                var $Drilldown = $("<div/>");
                $Drilldown.attr("id", RIContext.CurrObj.Elements.NonSharedElements.UniqueName);
                $Drilldown.html("&nbsp");

                if (RIContext.CurrObj.Elements.NonSharedElements.ToggleState !== undefined && RIContext.CurrObj.Elements.NonSharedElements.ToggleState === true)
                    $Drilldown.addClass("fr-render-drilldown-collapse");
                else
                    $Drilldown.addClass("fr-render-drilldown-expand");

                $Drilldown.on("click", { ToggleID: RIContext.CurrObj.Elements.NonSharedElements.UniqueName }, function (e) {
                    var name = $(this).parent().parent().attr("data-uniqName");
                    me.options.reportViewer.toggleItem(e.data.ToggleID,name);
                });
                $Drilldown.addClass("fr-core-cursorpointer");
                RIContext.$HTMLParent.append($Drilldown);
            }
            if (me._getSharedElements(RIContext.CurrObj.Elements.SharedElements).CanSort !== undefined) {
                $Sort = $("<div/>");
                $Sort.html("&nbsp");
                var Direction = "None";
                var sortDirection = forerunner.ssr.constants.sortDirection;
                
                if (RIContext.CurrObj.Elements.NonSharedElements.SortState === 2) {
                    $Sort.attr("class", "fr-render-sort-descending");
                    Direction = sortDirection.desc;
                }
                else if (RIContext.CurrObj.Elements.NonSharedElements.SortState === 1) {
                    $Sort.attr("class", "fr-render-sort-ascending");
                    Direction = sortDirection.asc;
                }
                else
                    $Sort.attr("class", "fr-render-sort-unsorted");                

                $Sort.on("click", { Viewer: RIContext.RS, SortID: RIContext.CurrObj.Elements.NonSharedElements.UniqueName, Direction: Direction },
                    function (e) {
                        e.data.Viewer.sort(e.data.Direction, e.data.SortID, !(e.shiftKey));
                    });

                //subtract out the sort image cell
                Style += "width:" + (me._getWidth(RIContext.CurrLocation.Width) - 6) + "mm;";
                RIContext.$HTMLParent.append($Sort);
            }
            me._writeActions(RIContext, RIContext.CurrObj.Elements.NonSharedElements, $TextObj);
            if (RIContext.CurrObj.Elements.NonSharedElements.UniqueName)
                me._writeUniqueName($TextObj, RIContext.CurrObj.Elements.NonSharedElements.UniqueName);

                     
            
            var dirClass =me._getTextDirection(RIContext.CurrObj.Elements);
            if (dirClass !== "") {
                Style += "width:" + RIContext.CurrLocation.Height + "mm;height:" + me._getWidth(RIContext.CurrLocation.Width) + "mm;";
                Style += "position:absolute;";
                var nTop = -(me._getWidth(RIContext.CurrLocation.Width) - RIContext.CurrLocation.Height) / 2;
                var nLeft = -(RIContext.CurrLocation.Height - me._getWidth(RIContext.CurrLocation.Width)) / 2;
                Style += "left:" + nLeft + "mm;top:" + nTop + "mm;";
                $TextObj.addClass(dirClass);
            }
            else {
                //Needs to be 100% to handle center align                
                $TextObj.addClass("fr-r-fS");
            }
               

            if (RIContext.CurrObj.Paragraphs.length === 0) {
                var val = me._getSharedElements(RIContext.CurrObj.Elements.SharedElements).Value ? me._getSharedElements(RIContext.CurrObj.Elements.SharedElements).Value : RIContext.CurrObj.Elements.NonSharedElements.Value;
                if (val) {
                    val = me._getNewLineFormatText(val);
                    if (textExt.InputType) {
                        $TextObj.attr("data-origVal", val);
                        $TextObj.val(val);
                    }
                    else
                        $TextObj.text(val);
                    if (textExt.ID)
                        $TextObj.attr("id", textExt.ID);
                    if (textExt.InputReadOnly === true)
                        $TextObj.attr("readonly", "readonly");
                    
                    Style += me._getElementsTextStyle(RIContext.CurrObj.Elements);
                    if (RIContext.CurrObj.Elements.NonSharedElements.TypeCode && (me._getSharedElements(RIContext.CurrObj.Elements.SharedElements).TextAlign === 0 || me._getSharedElements(RIContext.CurrObj.Elements.SharedElements).Style.TextAlign === 0)) {
                        Style += "text-align:" + me._getTextAlign(0, RIContext.CurrObj.Elements.NonSharedElements) + ";";
                    }
                }
                else {
                    $TextObj.html("&nbsp");
                    Style += "text-decoration:none;";
                }
                $TextObj.addClass(me._getClassName("fr-t-", RIContext.CurrObj));
            }
            else {
                //Handle each paragraphs
                var LowIndex = null;
                var ParentName = {};
                var ParagraphContainer = {};
                ParagraphContainer.Root = "";                
                Style += me._getElementsTextStyle(RIContext.CurrObj.Elements);
                //Build paragraph tree
    
                $.each(RIContext.CurrObj.Paragraphs, function (Index, Obj) {

                    var listLevel = me._getSharedElements(Obj.Paragraph.SharedElements).ListLevel;
                    if (LowIndex === null)
                        LowIndex = listLevel;
                    if (!ParagraphContainer[listLevel])
                        ParagraphContainer[listLevel] = [];
                    ParentName[listLevel] = Obj.Paragraph.NonSharedElements.UniqueName;

                    var item;
                    if (!ParentName[listLevel - 1])
                        item = "Root";
                    else
                        item = ParentName[listLevel - 1];
                    item = { Parent: item, Value: Obj };
                    ParagraphContainer[listLevel].push(item);
                });

                me._writeRichTextItem(RIContext, ParagraphContainer, LowIndex, "Root", $TextObj);
            }
            me._writeBookMark(RIContext);
            me._writeTooltip(RIContext);
            $TextObj.attr("Style", Style);
            $TextObj.addClass(me._getClassName("fr-t-", RIContext.CurrObj));
            $TextObj.addClass("fr-r-t");

            RIContext.$HTMLParent.append($TextObj);
            if ($Sort) RIContext.$HTMLParent.append($Sort);
            return RIContext.$HTMLParent;
        },
        _writeRichTextItem: function (RIContext, Paragraphs, Index, ParentName, ParentContainer) {
            var $ParagraphList = null;
            var me = this;

            $.each(Paragraphs[Index], function (SubIndex, Obj) {
                if (Obj.Parent === ParentName) {
                    var $ParagraphItem;
                    var ParagraphStyle = "font-size:small;"; //needed for paragraph spacing 
                    Obj = Obj.Value;

                    if (me._getSharedElements(Obj.Paragraph.SharedElements).ListStyle === 1) {
                        if (!$ParagraphList || !$ParagraphList.is("ol"))
                            $ParagraphList = new $("<OL />");
                        $ParagraphList.addClass(me._getListStyle(1, me._getSharedElements(Obj.Paragraph.SharedElements).ListLevel));
                        $ParagraphItem = new $("<LI />");
                    }
                    else if (me._getSharedElements(Obj.Paragraph.SharedElements).ListStyle === 2) {
                        if (!$ParagraphList || !$ParagraphList.is("ul"))
                            $ParagraphList = new $("<UL />");
                        $ParagraphList.addClass(me._getListStyle(2, me._getSharedElements(Obj.Paragraph.SharedElements).ListLevel));
                        $ParagraphItem = new $("<LI />");
                    }
                    else {
                        if (!$ParagraphList || !$ParagraphList.is("div"))
                            $ParagraphList = new $("<DIV />");
                        $ParagraphItem = new $("<DIV />");
                    }

                    
                    ParagraphStyle += me._getMeasurements(me._getMeasurmentsObj(Obj, Index));
                    ParagraphStyle += me._getElementsStyle(RIContext.RS, Obj.Paragraph);
                    $ParagraphItem.attr("Style", ParagraphStyle);
                    $ParagraphItem.addClass(me._getClassName("fr-n-", Obj.Paragraph));
                    $ParagraphItem.addClass(me._getClassName("fr-t-", Obj.Paragraph));

                    me._writeUniqueName($ParagraphItem, Obj.Paragraph.NonSharedElements.UniqueName);
                    //$ParagraphItem.attr("data-uniqName", Obj.Paragraph.NonSharedElements.UniqueName);

                    //Handle each TextRun
                    for (var i = 0; i < Obj.TextRunCount; i++) {
                        var $TextRun;
                        var flag = true;
                        //With or without Action in TextRun
                        if (!Obj.TextRuns[i].Elements.NonSharedElements.ActionInfo) {
                            $TextRun = new $("<SPAN />");
                        }
                        else {
                            $TextRun = new $("<A />");
                            me._writeActions(RIContext, Obj.TextRuns[i].Elements.NonSharedElements, $TextRun);
                        }

                        if (me._getSharedElements(Obj.TextRuns[i].Elements.SharedElements).Value && me._getSharedElements(Obj.TextRuns[i].Elements.SharedElements).Value !== "") {
                            $TextRun.text(me._getNewLineFormatText(me._getSharedElements(Obj.TextRuns[i].Elements.SharedElements).Value));
                        }
                        else if (Obj.TextRuns[i].Elements.NonSharedElements.Value && Obj.TextRuns[i].Elements.NonSharedElements.Value !== "") {
                            $TextRun.text(me._getNewLineFormatText(Obj.TextRuns[i].Elements.NonSharedElements.Value));
                        }
                        else {
                            $TextRun.html("&nbsp");
                            flag = false;
                        }

                        me._writeUniqueName($TextRun, Obj.TextRuns[i].Elements.NonSharedElements.UniqueName);
                        //$TextRun.attr("data-uniqName", Obj.TextRuns[i].Elements.NonSharedElements.UniqueName);

                        if (flag) {
                            var TextRunStyle = "";
                            TextRunStyle += me._getMeasurements(me._getMeasurmentsObj(Obj.TextRuns[i], i));
                            TextRunStyle += me._getElementsTextStyle(Obj.TextRuns[i].Elements);
                            $TextRun.attr("Style", TextRunStyle);
                            $TextRun.addClass(me._getClassName("fr-t-", Obj.TextRuns[i]));                            

                        }

                        $ParagraphItem.append($TextRun);
                    }
            
                    if (Paragraphs[Index + 1])
                        me._writeRichTextItem(RIContext, Paragraphs, Index + 1, Obj.Paragraph.NonSharedElements.UniqueName, $ParagraphItem);

                    //$ParagraphList.attr("style", "width:100%;height:100%;");
                    $ParagraphList.addClass("fr-r-pL");
                    $ParagraphList.append($ParagraphItem);
                    ParentContainer.append($ParagraphList);
                }
            }); 
        },
        _writeUniqueName: function($item,uniqueName){
            
            $item.attr("data-uniqName", uniqueName);
           
        },
        _getImageURL: function (RS, ImageName) {
            var me = this;
            if (!me.imageList)
                me.imageList = {};
            
            if (!me.imageList[ImageName]) {
                var Url = me.options.reportViewer.options.reportViewerAPI + "/Image/?";
                Url += "SessionID=" + me.options.reportViewer.sessionID;
                Url += "&ImageID=" + ImageName;
                Url += "&" + me.options.renderTime;
                if (me.options.reportViewer.options.rsInstance)
                    Url += "&instance=" + me.options.reportViewer.options.rsInstance;
                me.imageList[ImageName] = Url;
            }

            return me.imageList[ImageName];
        },
        _writeImage: function (RIContext) {
            var NewImage = $("<img/>"); //new Image();
            var me = this; 

            
            var measurement = me._getMeasurmentsObj(RIContext.CurrObjParent, RIContext.CurrObjIndex);
            var Style = RIContext.Style ;
            RIContext.$HTMLParent.addClass("fr-render-image");

            //Get padding
            Style += me._getTextStyle(RIContext.CurrObj.Elements);
            RIContext.$HTMLParent.addClass(me._getClassName("fr-t-", RIContext.CurrObj));

            //This fixed an IE bug dublicate styles
            if (RIContext.CurrObjParent.Type !== "Tablix") {
                Style += me._getElementsStyle(RIContext.RS, RIContext.CurrObj.Elements);                
                RIContext.$HTMLParent.addClass(me._getClassName("fr-n-", RIContext.CurrObj));
            }
            
            Style += me._getMeasurements(measurement, true);
 

            var ImageName;
            var imageStyle = "";
            var imageConsolidationOffset;

            var sizingType = me._getSharedElements(RIContext.CurrObj.Elements.SharedElements).Sizing;

            if (!sizingType)
                sizingType = 0;

            //get the padding size
            var padWidth = me._getPaddingSize(RIContext.CurrObj, "Left") + me._getPaddingSize(RIContext.CurrObj, "Right");
            var padHeight = me._getPaddingSize(RIContext.CurrObj, "Top") + me._getPaddingSize(RIContext.CurrObj, "Bottom");

            if (RIContext.CurrObj.Type === "Image") {//for image
                ImageName = RIContext.CurrObj.Elements.NonSharedElements.ImageDataProperties.ImageName;
                if (RIContext.CurrObj.Elements.NonSharedElements.ImageDataProperties.NonSharedImageDataProperties)
                    imageConsolidationOffset = RIContext.CurrObj.Elements.NonSharedElements.ImageDataProperties.NonSharedImageDataProperties.ImageConsolidationOffsets;
            }
            else {//for chart, map, gauge
                ImageName = RIContext.CurrObj.Elements.NonSharedElements.StreamName;
                if (RIContext.CurrObj.Elements.NonSharedElements.ImageConsolidationOffsets) {
                    imageConsolidationOffset = RIContext.CurrObj.Elements.NonSharedElements.ImageConsolidationOffsets;
                    Style += "width:" + imageConsolidationOffset.Width + "px;height:" + imageConsolidationOffset.Height + "px";
                }
            }

            if (imageConsolidationOffset) {
                imageStyle += "position:relative;top:" + imageConsolidationOffset.Top * -1 + "px;left:" + imageConsolidationOffset.Left * -1 + "px";
            }
                        
            if (RIContext.CurrObj.Elements.NonSharedElements.ActionImageMapAreas) {
                NewImage.attr("useMap", "#Map_" + RIContext.RS.sessionID + "_" + RIContext.CurrObj.Elements.NonSharedElements.UniqueName);
            }
           

            //NewImage.alt = me.options.reportViewer.locData.messages.imageNotDisplay;            
            //NewImage.src = this._getImageURL(RIContext.RS, ImageName);
            
            NewImage.attr("alt", me.options.reportViewer.locData.messages.imageNotDisplay);
            NewImage.attr("src",this._getImageURL(RIContext.RS, ImageName));

            me._writeActions(RIContext, RIContext.CurrObj.Elements.NonSharedElements, $(NewImage));
            me._writeBookMark(RIContext);
            me._writeTooltip(RIContext);

            if (RIContext.CurrObj.Elements.NonSharedElements.UniqueName)
                me._writeUniqueName($(NewImage), RIContext.CurrObj.Elements.NonSharedElements.UniqueName);
  
            var imageWidth, imageHeight;

            if (imageConsolidationOffset) {
                imageWidth = imageConsolidationOffset.Width;
                imageHeight = imageConsolidationOffset.Height;
            }
            else {
                imageWidth = RIContext.CurrLocation.Width * 3.78;
                imageHeight = RIContext.CurrLocation.Height * 3.78;
            }

            RIContext.$HTMLParent.attr("style", Style).append(NewImage);
             
            me._writeActionImageMapAreas(RIContext, imageWidth, imageHeight, imageConsolidationOffset);

            Style = imageStyle ? imageStyle : "display:block;";
            NewImage.attr("style", Style);

            //Remove the blue border on ie 8,9,10
            NewImage.css("border", "0").css("text-decoration", "none");
            switch (sizingType) {
                case 0://AutoSize
                    break;
                case 1://Fit
                    $(NewImage).css("height", RIContext.CurrLocation.Height - padHeight + "mm");
                    $(NewImage).css("width", RIContext.CurrLocation.Width - padWidth + "mm");
                    break;
                case 2:
                case 3:
                     $(NewImage).css("height", RIContext.CurrLocation.Height + "mm");
                    $(NewImage).css("width", RIContext.CurrLocation.Width + "mm");
                    NewImage.on("load", function () {
                        var naturalSize = me._getNatural(this);
                        var imageWidth, imageHeight;

                        //Neeed to have this here for IE8
                        if (imageConsolidationOffset) {
                            imageWidth = imageConsolidationOffset.Width;
                            imageHeight = imageConsolidationOffset.Height;
                        }
                        else {
                            imageWidth = NewImage.width;
                            imageHeight = NewImage.height;
                        }

                        me._resizeImage(this, sizingType, naturalSize.height, naturalSize.width, RIContext.CurrLocation.Height - padHeight, RIContext.CurrLocation.Width - padWidth);
                    });
            }

            return RIContext.$HTMLParent;
        },

        _getInputsInRow: function(element,filter){
            var me = this;
            var data = [];
            var rows = 0;

            if (filter === undefined) filter = "auto";

            var row = $(element).parent().parent().parent();
            if (row.is("tr") === false) {
                return data;
            }
            
            //Maximum of 2 rows to find
            while (rows < 2) {

                $.each(row.find("input, textarea"), function (index, input) {
                    var obj = {};
                    obj.name = $(input).attr("name");
                    obj.value = $(input).val();
                    obj.origionalValue = $(input).attr("data-origVal");
                    obj.type = $(input).attr("type");
                    obj.submitType = $(input).attr("data-submitType");

                    if (filter ==="all")
                        data.push(obj);

                    if (filter === "auto" && (obj.submitType ==="always"  || (obj.submitType === "changed" && obj.value !== obj.origionalValue) )) {
                        data.push(obj);
                    }
                });

                //get another row
                rows++;
                if (row.hasClass("fr-render-row")) {
                    row = row.next();
                    if (row.hasClass("fr-render-respRow") === false) //Did not find second row end
                        rows = 2;
                }
                else if (row.hasClass("fr-render-respRow")) {
                    row = row.prev();
                    if (row.hasClass("fr-render-row") === false) //Did not find second row end
                        rows = 2;
                }
            }
            return data;
        },

        _submitRow: function(inputs,type,url,datatype, done,fail){
            var me = this;
            var data = {};
        
            for (var i = 0;i<inputs.length;i++){            
                data[inputs[i].name] = inputs[i].value;
            }
            if (datatype === "json")
                data = JSON.stringify(data);

            $.ajax({

                type: type,
                dataType: datatype,
                url: url,
                data: data,
                async: true
            }).done(done).fail(fail);

        },

        _easySubmit: function(e,type, url,datatype,successText,failText){            
            if (!successText) successText = "Saved";
            if (!failText) failText = "Failed";
            
            var data = e.data.getInputs(e.data.element,"auto");

            e.data.easySubmit(data, type, url, datatype, function () { alert(successText); }, function () { alert(failText); });

        },

        _writeActions: function (RIContext, Elements, $Control) {
            var me = this;
            if (Elements.ActionInfo)
                for (var i = 0; i < Elements.ActionInfo.Count; i++) {
                    this._writeAction(RIContext, Elements.ActionInfo.Actions[i], $Control);
                }

            var ActionExt = me._getRDLExt(RIContext);

            if (ActionExt.JavaScriptActions) {
                $Control.addClass("fr-core-cursorpointer");

                for (var a = 0; a < ActionExt.JavaScriptActions.length; a++){
                    var action = ActionExt.JavaScriptActions[a];

                    if (action.JavaFunc === undefined && action.Code !==undefined) {
                        var newFunc;
                        try {
                            newFunc = new Function("e", action.Code);
                        }
                        catch (e) { }
                        action.JavaFunc = newFunc
                        if (action.On === undefined)
                            action.On = "click";
                    }

                    $Control.on(action.On, { reportViewer: me.options.reportViewer.element, element: $Control, getInputs: me._getInputsInRow, easySubmit: me._submitRow }, action.JavaFunc);
                }
            }

        },
        _writeAction: function (RIContext, Action, Control) {
            var me = this;
            if (Action.HyperLink) {               
                Control.addClass("fr-core-cursorpointer");
                Control.attr("href", "#");
                Control.on("click", { HyperLink: Action.HyperLink }, function (e) {
                    me._stopDefaultEvent(e);
                    location.href = e.data.HyperLink;                    
                });

            }
            else if (Action.BookmarkLink) {
                //HRef needed for ImageMap, Class needed for non image map
                Control.attr("href", "#");
                Control.addClass("fr-core-cursorpointer");
                Control.on("click", {BookmarkID: Action.BookmarkLink }, function (e) {
                    me._stopDefaultEvent(e);
                    me.options.reportViewer.navigateBookmark(e.data.BookmarkID);
                });
            }
            else if (Action.DrillthroughId) {
                //HRef needed for ImageMap, Class needed for non image map
                Control.addClass("fr-core-cursorpointer");
                Control.attr("href", "#");
                Control.on("click", { DrillthroughId: Action.DrillthroughId }, function (e) {
                    me._stopDefaultEvent(e);
                    me.options.reportViewer.navigateDrillthrough(e.data.DrillthroughId);
                });
            }
        },
        _writeActionImageMapAreas: function (RIContext, width, height, imageConsolidationOffset) {
            var actionImageMapAreas = RIContext.CurrObj.Elements.NonSharedElements.ActionImageMapAreas;
            var me = this;
            var offsetLeft = 0, offsetTop = 0;

            if (imageConsolidationOffset) {
                offsetLeft = imageConsolidationOffset.Left;
                offsetTop = imageConsolidationOffset.Top;
            }
            
            if (actionImageMapAreas) {
                var $map = $("<MAP/>");
                me._writeUniqueName($map, "Map_" + RIContext.RS.sessionID + "_" + RIContext.CurrObj.Elements.NonSharedElements.UniqueName);
                $map.attr("name", "Map_" + RIContext.RS.sessionID + "_" + RIContext.CurrObj.Elements.NonSharedElements.UniqueName);
                $map.attr("id", "Map_" + RIContext.RS.sessionID + "_" + RIContext.CurrObj.Elements.NonSharedElements.UniqueName);

                for (var i = 0; i < actionImageMapAreas.Count; i++) {
                    var element = actionImageMapAreas.ActionInfoWithMaps[i];

                    for (var j = 0; j < element.ImageMapAreas.Count; j++) {
                        var $area = $("<AREA />");
                        $area.attr("tabindex", i + 1);
                        $area.attr("style", "text-decoration:none");
                        $area.attr("alt", element.ImageMapAreas.ImageMapArea[j].Tooltip);
                        if (element.Actions) {
                            this._writeAction(RIContext, element.Actions[0], $area);
                        }

                        var shape;
                        var coords = "";
                        switch (element.ImageMapAreas.ImageMapArea[j].ShapeType) {
                            case 0:
                                shape = "rect";//(x1,y1)=upper left, (x2,y2)=lower right, describe in RPL about rect is not correct or obsolete
                                coords = (parseInt(element.ImageMapAreas.ImageMapArea[j].Coordinates[0] * width / 100, 10) + offsetLeft) + "," +//x1
                                            (parseInt(element.ImageMapAreas.ImageMapArea[j].Coordinates[1] * height / 100, 10) + offsetTop) + "," +//y1
                                            (parseInt(element.ImageMapAreas.ImageMapArea[j].Coordinates[2] * width / 100, 10) + offsetLeft)  + "," +//x2
                                            (parseInt(element.ImageMapAreas.ImageMapArea[j].Coordinates[3] * height / 100, 10) + offsetTop);//y2
                                break;
                            case 1:
                                shape = "poly";
                                var coorCount = element.ImageMapAreas.ImageMapArea[j].CoorCount;
                                for (var k = 0; k < coorCount; k++) {
                                    if (k % 2 === 0) {
                                        coords += parseInt(element.ImageMapAreas.ImageMapArea[j].Coordinates[k] * width / 100, 10) + offsetLeft;//X
                                    }
                                    else {
                                        coords += parseInt(element.ImageMapAreas.ImageMapArea[j].Coordinates[k] * height / 100, 10) + offsetTop;//Y
                                    }
                                    if (k < coorCount - 1) {
                                        coords += ",";
                                    }
                                }
                                break;
                            case 2:
                                shape = "circ";
                                coords = (parseInt(element.ImageMapAreas.ImageMapArea[j].Coordinates[0] * width / 100, 10) + offsetLeft) +"," +//X
                                    (parseInt(element.ImageMapAreas.ImageMapArea[j].Coordinates[1] * height / 100, 10) + offsetTop) + "," +//Y, (X,Y) is the center of the circle
                                    parseInt(element.ImageMapAreas.ImageMapArea[j].Coordinates[2] * width / 100, 10);//radius
                                break;
                        }
                        $area.attr("shape", shape);
                        $area.attr("coords", coords);
                        $map.append($area);
                    }
                }
                RIContext.$HTMLParent.append($map);
            }
        },
        _resizeImage: function (img, sizingType, height, width, maxHeight, maxWidth) {
            var ratio = 0;
            var me = this;

            height = me._convertToMM(height + "px");
            width = me._convertToMM(width + "px");
            var $img = $(img);
            if (height !== 0 && width !== 0) {
                switch (sizingType) {
                    case 0://AutoSize
                        $img.css("height", height + "mm");
                        $img.css("width", width + "mm");
                        break;
                    case 1://Fit
                        $img.css("height", maxHeight + "mm");
                        $img.css("width", maxWidth + "mm");
                        break;
                    case 2://Fit Proportional
                        if (height / maxHeight > 1 || width / maxWidth > 1) {
                            if ((height / maxHeight) >= (width / maxWidth)) {
                                ratio = maxHeight / height;

                                $img.css("height", maxHeight + "mm");
                                $img.css("width", width * ratio + "mm");
                                $img.css("max-height", maxHeight + "mm");
                                $img.css("max-width", width * ratio + "mm");
                                $img.css("min-height", maxHeight + "mm");
                                $img.css("min-width", width * ratio + "mm");
                            }
                            else {
                                ratio = maxWidth / width;

                                $img.css("width", maxWidth + "mm");
                                $img.css("height", height * ratio + "mm");
                                $img.css("max-width", maxWidth + "mm");
                                $img.css("max-height", height * ratio + "mm");
                                $img.css("min-width", maxWidth + "mm");
                                $img.css("min-height", height * ratio + "mm");
                            }
                        }
                        break;
                    case 3://Clip
                        var naturalSize = me._getNatural(img);
                        $img.css("height", me._convertToMM(naturalSize.height + "px") + "mm");
                        $img.css("width", me._convertToMM(naturalSize.width + "px") + "mm");
                        $img.css("max-height", me._convertToMM(naturalSize.height + "px") + "mm");
                        $img.css("max-width", me._convertToMM(naturalSize.width + "px") + "mm");
                        //Also add style overflow:hidden to it's parent container
                        break;
                    default:
                       break;
                }
            }
        },
        _writeTablixCell: function (RIContext, Obj, Index, BodyCellRowIndex,$Drilldown) {
            var $Cell = new $("<TD/>");
            var Style = "";
            var width;
            var height;
             var me = this;
    
            Style = "";

            if (Obj.Cell) {
                if (me._getElements(Obj.Cell.ReportItem).NonSharedElements)
                    Style += me._getFullBorderStyle(me._getElements(Obj.Cell.ReportItem).NonSharedElements.Style);
               
                $Cell.addClass(me._getClassName("fr-b-", Obj.Cell.ReportItem));
            }

            var ColIndex = Obj.ColumnIndex;

            var RowIndex;
            if (me.isNull(BodyCellRowIndex))
                RowIndex = Obj.RowIndex;
            else
                RowIndex = BodyCellRowIndex;

            width = me._getWidth(RIContext.CurrObj.ColumnWidths.Columns[ColIndex].Width);
            height = RIContext.CurrObj.RowHeights.Rows[RowIndex].Height;
            Style += "width:" + width + "mm;" + "max-width:" + width + "mm;"  ;
            if (forerunner.device.isMSIE())
                Style += "min-height:" + height + "mm;";
            else
                Style += "height:" + height + "mm;";
            
            //Row and column span
            if (Obj.RowSpan !== undefined) {
                $Cell.attr("rowspan", Obj.RowSpan);
            }
            if (Obj.ColSpan !== undefined) {
                $Cell.attr("colspan", Obj.ColSpan);
                
            }
               
            if (Obj.Cell){
                //Background color goes on the cell
                if (me._getElements(Obj.Cell.ReportItem).NonSharedElements.Style && me._getElements(Obj.Cell.ReportItem).NonSharedElements.Style.BackgroundColor)
                    Style += "background-color:" + me._getElements(Obj.Cell.ReportItem).NonSharedElements.Style.BackgroundColor + ";";

                $Cell.addClass(me._getClassName("fr-n-", Obj.Cell.ReportItem));

                $Cell.attr("Style", Style);
                $Cell.addClass("fr-r-tC");
                var RI = me._writeReportItems(new reportItemContext(RIContext.RS, Obj.Cell.ReportItem, Index, RIContext.CurrObj, new $("<Div/>"), "", new tempMeasurement(height, width)));
                RI.addClass("fr-r-tCI");
                //Add Repsponsive table expand
                if ($Drilldown)
                    RI.prepend($Drilldown);

                $Cell.append(RI);
            }
            else
                $Cell.html("&nbsp");
            return $Cell;
        },
        _writeTablix: function (RIContext) {
            var me = this;
            var $Tablix = me._getDefaultHTMLTable();
            var Style = "";
            var $Row;
            var LastRowIndex = 0;
            var $FixedColHeader = new $("<TABLE/>").css({ display: "table", position: "absolute", top: "0px", left: "0px", padding: "0", margin: "0", "border-collapse": "collapse" });
            var $FixedRowHeader = new $("<TABLE/>").css({ display: "table", position: "absolute", top: "0px", left: "0px", padding: "0", margin: "0", "border-collapse": "collapse" });
            $FixedRowHeader.attr("CELLSPACING", 0);
            $FixedRowHeader.attr("CELLPADDING", 0);
            var LastObjType = "";
            var HasFixedRows = false;
            var HasFixedCols = false;
            var respCols = {isResp: false};

                      
            Style += me._getElementsStyle(RIContext.RS, RIContext.CurrObj.Elements);
            Style += me._getFullBorderStyle(RIContext.CurrObj.Elements.NonSharedElements);
            
            $Tablix.addClass("fr-render-tablix");
            $Tablix.addClass(me._getClassName("fr-n-", RIContext.CurrObj));
            $Tablix.addClass(me._getClassName("fr-t-", RIContext.CurrObj));
            $Tablix.addClass(me._getClassName("fr-b-", RIContext.CurrObj));

            //If there are columns
            if (RIContext.CurrObj.ColumnWidths) {
                var colgroup = $("<colgroup/>");               
                var viewerWidth = me._convertToMM(me._currentWidth + "px");
                var tablixwidth = me._getMeasurmentsObj(RIContext.CurrObjParent, RIContext.CurrObjIndex).Width;
                var cols;
                var sharedElements = me._getSharedElements(RIContext.CurrObj.Elements.SharedElements);
                var tablixExt = me._getRDLExt(RIContext);;                

                //Setup the responsive columns def
                respCols.Columns = new Array(RIContext.CurrObj.ColumnWidths.ColumnCount);
                respCols.ColumnCount = RIContext.CurrObj.ColumnWidths.ColumnCount;
                respCols.ColumnHeaders = {}; 
                respCols.ColHeaderRow = 0;
                respCols.BackgroundColor = "#F2F2F2";

                if (tablixExt.ColumnHeaders) {
                    for (var ch = 0; ch < tablixExt.ColumnHeaders.length; ch++) {
                        //Just creating index, can all object later if needed
                        respCols.ColumnHeaders[tablixExt.ColumnHeaders[ch]] = ch;
                    }
                }
                if (tablixExt.ColHeaderRow !== undefined)
                    respCols.ColHeaderRow = tablixExt.ColHeaderRow-1;
                if (tablixExt.BackgroundColor !== undefined)
                    respCols.BackgroundColor = tablixExt.BackgroundColor;

                if (me.options.responsive && me._defaultResponsizeTablix === "on" && me._maxResponsiveRes > me._currentWidth) {
                    var notdone = true;
                    var nextColIndex = RIContext.CurrObj.ColumnWidths.ColumnCount;
                    var tablixCols = RIContext.CurrObj.ColumnWidths.Columns;
                    var maxPri = -1;
                    var foundCol;
                    
                    if (tablixExt.Columns && tablixExt.Columns.length <= RIContext.CurrObj.ColumnWidths.ColumnCount) {
                        for (cols = 0; cols < tablixExt.Columns.length; cols++) {
                            respCols.Columns[parseInt(tablixExt.Columns[cols].Col) - 1] = { show: true};
                        }
                    }
                     

                    while (notdone) {
                        maxPri = -1;

                        //If the author has supplied instructions for minimizing the tablix, determine columns here                            
                        if (tablixExt.Columns) {

                            //if not all columns are in the array, use the ones that are missing first
                            if (respCols.ColumnCount > tablixExt.Columns.length) {
                                for (cols = respCols.ColumnCount-1; cols >= 0; cols--) {
                                    if (respCols.Columns[cols] === undefined) {
                                        foundCol = cols;
                                        respCols.Columns[foundCol] = { show: false };
                                        break;
                                    }
                                }

                            }
                            else {
                                for (cols = 0; cols < tablixExt.Columns.length; cols++) {
                                    if (tablixExt.Columns[cols].Pri >= maxPri  && respCols.Columns[parseInt(tablixExt.Columns[cols].Col) - 1].show === true) {
                                        nextColIndex = cols;
                                        maxPri = tablixExt.Columns[cols].Pri;
                                    }
                                }
                                foundCol = parseInt(tablixExt.Columns[nextColIndex].Col) - 1;                                
                                respCols.Columns[foundCol].Ext = tablixExt.Columns[nextColIndex];
                                respCols.Columns[foundCol] = { show: false };
                            }
                                                                                 
                            respCols.ColumnCount--;
                        
                            }
                        //Just remove from the right
                        else {
                            nextColIndex--;
                            foundCol = nextColIndex;
                            respCols.Columns[foundCol] = { show: false };
                            respCols.ColumnCount--;
                        }

                        tablixwidth -= tablixCols[foundCol].Width;

                        //Check if we are done                        
                        if (tablixwidth < viewerWidth || respCols.ColumnCount ===0) {
                            notdone = false;
                            //Show if more then half is visible
                            if (viewerWidth - tablixwidth > tablixCols[foundCol].Width * .9 || respCols.ColumnCount===0) {
                                respCols.Columns[foundCol].show = true;
                                respCols.ColumnCount++;
                            }
                        }
                    }
                }
               //create the colgroup from visible columns
                for (cols = 0; cols < RIContext.CurrObj.ColumnWidths.ColumnCount; cols++) {
                    if (respCols.Columns[cols]=== undefined)
                        respCols.Columns[cols] = { show: true };
                    else if (respCols.Columns[cols].show === false)
                        respCols.isResp = true;

                    if (respCols.Columns[cols].show) {
                        colgroup.append($("<col/>").css("width", (me._getWidth(RIContext.CurrObj.ColumnWidths.Columns[cols].Width)) + "mm"));
                    }
                }

                //Set Tablix width if not responsive.
                if (respCols.isResp ===false)
                    Style += me._getMeasurements(me._getMeasurmentsObj(RIContext.CurrObjParent, RIContext.CurrObjIndex));
                $Tablix.attr("Style", Style);
                $Tablix.append(colgroup);
                if (!forerunner.device.isFirefox()) {                
                    $FixedRowHeader.append(colgroup.clone(true, true));  //Need to allign fixed header on chrome, makes FF fail
                }
                $FixedColHeader.append(colgroup.clone(true, true));  
                $FixedRowHeader.addClass("fr-render-tablix");
                $FixedColHeader.addClass("fr-render-tablix");
                $FixedColHeader.addClass(me._getClassName("fr-n-", RIContext.CurrObj));
                $FixedRowHeader.addClass(me._getClassName("fr-n-", RIContext.CurrObj));
                $FixedColHeader.addClass(me._getClassName("fr-t-", RIContext.CurrObj));
                $FixedRowHeader.addClass(me._getClassName("fr-t-", RIContext.CurrObj));
                
            }

            me._tablixStream[RIContext.CurrObj.Elements.NonSharedElements.UniqueName] = { $Tablix: $Tablix, $FixedColHeader: $FixedColHeader, $FixedRowHeader: $FixedRowHeader, HasFixedRows: HasFixedRows, HasFixedCols: HasFixedCols, RIContext: RIContext, respCols: respCols };

            var TS = me._tablixStream[RIContext.CurrObj.Elements.NonSharedElements.UniqueName];
            TS.State = { "LastRowIndex": 0, "LastObjType": "", "StartIndex": 0, CellCount: 0 };
            TS.EndRow = $("<TR/>").addClass("fr-lazyNext").css("visible", false).text(me.options.reportViewer.locData.messages.loading);
            me._writeTablixRowBatch(TS);

            HasFixedRows = TS.HasFixedRows;
            HasFixedCols = TS.HasFixedCols;
            if (HasFixedRows) {
                $FixedColHeader.css("visibility", "hidden");               
            }
            else
                $FixedColHeader = null;

            if (HasFixedCols) {
                $FixedRowHeader.css("visibility", "hidden");                
            }
            else
                $FixedRowHeader = null;

            var ret = $("<div style='position:relative'></div");
            $Tablix.append($FixedColHeader);
            $Tablix.append($FixedRowHeader);
                       
            if (RIContext.CurrObj.Elements.NonSharedElements.UniqueName)
                me._writeUniqueName($Tablix, RIContext.CurrObj.Elements.NonSharedElements.UniqueName);
            RIContext.$HTMLParent = ret;

            me._writeBookMark(RIContext);
            me._writeTooltip(RIContext);

            ret.append($Tablix);
            RIContext.RS.floatingHeaders.push(new floatingHeader(ret, $FixedColHeader, $FixedRowHeader));
            return ret;
        },



        _writeSingleTablixRow: function (RIContext, $Tablix, Index, Obj, $FixedColHeader, $FixedRowHeader, State,respCols) {
            var me = this;
            var LastRowIndex = State.LastRowIndex;
            var LastColIndex = State.LastColIndex;
            var LastObjType = State.LastObjType;
            var $Row = State.Row;
            var HasFixedCols = false;
            var HasFixedRows = false;           
            var $ExtRow = State.ExtRow;
            var $ExtCell = State.ExtCell;
            var CellHeight;
            var CellWidth;

            if (State.ExtRow === undefined && respCols.isResp) {
                $ExtRow = new $("<TR/>");                
                $ExtCell = new $("<TD/>").attr("colspan", respCols.ColumnCount).css("background-color", respCols.BackgroundColor);
                $ExtRow.addClass("fr-render-respRow");
                $ExtRow.append($ExtCell);
                $ExtRow.hide();
            }

            if (State.Row === undefined) 
                $Row = new $("<TR/>");               
            
            if ($Row.hasClass("fr-render-row") === false)
                $Row.addClass("fr-render-row");
            
            var Colspans = State.Colspans;
            var Rowspans = State.Rowspans;

            if (LastColIndex === undefined) {
                LastColIndex = -1;
                Colspans = {};
                Rowspans = {};
            }

            if (Obj.RowSpan)
                Rowspans[Obj.ColumnIndex] = Obj.RowSpan;
            else if (Rowspans[Obj.ColumnIndex] > 0)
                Rowspans[Obj.ColumnIndex]--;

            if (Rowspans[Obj.ColumnIndex] === 0)
                Rowspans[Obj.ColumnIndex] = undefined;

            //TODO: need to do Col spans



            if (Obj.RowIndex !== LastRowIndex) {
                $Tablix.append($Row);

                //Dont add the ext row if no data and hide the expand icon
                if (respCols.isResp && $ExtRow && $ExtRow.children()[0].children.length > 0)
                    $Tablix.append($ExtRow);
                else
                    $Row.find(".fr-render-respIcon").hide();

                //Handle fixed col header
                if (RIContext.CurrObj.RowHeights.Rows[Obj.RowIndex - 1].FixRows === 1) {
                   $FixedColHeader.append($Row.clone(true, true));
                }

                $Row = new $("<TR/>");
                if (respCols.isResp) {
                    $ExtRow = new $("<TR/>");
                    $ExtCell = new $("<TD/>").attr("colspan", respCols.ColumnCount).css("background-color", respCols.BackgroundColor);
                    $ExtRow.addClass("fr-render-respRow");
                    $ExtRow.append($ExtCell);
                    $ExtRow.hide();
                }

                //Handle missing rows
                for (var ri = LastRowIndex + 1; ri < Obj.RowIndex ; ri++) {
                    $Tablix.append($Row);
                    $Row = new $("<TR/>");
                }
                LastRowIndex = Obj.RowIndex;
                LastColIndex = -1;
            }

            if (Obj.UniqueName)
                me._writeUniqueName($Row, Obj.UniqueName);

            //Handle fixed row header
            if (Obj.Type !== "Corner" && LastObjType === "Corner") {
                $FixedRowHeader.append($Row.clone(true, true));
            }
            if (Obj.Type !== "RowHeader" && LastObjType === "RowHeader") {
                $FixedRowHeader.append($Row.clone(true, true));
            }
            if (RIContext.CurrObj.RowHeights.Rows[Obj.RowIndex].FixRows === 1)
                HasFixedRows = true;

           
            
            //There seems to be a bug in RPL, it can return a colIndex that is greater than the number of columns
            if (Obj.Type !== "BodyRow" && RIContext.CurrObj.ColumnWidths.Columns[Obj.ColumnIndex]) {
                if (RIContext.CurrObj.ColumnWidths.Columns[Obj.ColumnIndex].FixColumn === 1)
                    HasFixedCols = true;
            }

            var $Drilldown;            
            CellHeight = RIContext.CurrObj.RowHeights.Rows[Obj.RowIndex].Height;
            if (Obj.Type === "BodyRow") {
                $.each(Obj.Cells, function (BRIndex, BRObj) {
                    CellWidth = RIContext.CurrObj.ColumnWidths.Columns[BRObj.ColumnIndex].Width;
                    $Drilldown = undefined;
                    if (respCols.Columns[BRObj.ColumnIndex].show) {
                        if (respCols.isResp && respCols.ColHeaderRow !== Obj.RowIndex && BRObj.RowSpan === undefined && $ExtRow && $ExtRow.HasDrill !== true) {
                            //If responsive table add the show hide image and hook up
                            $Drilldown = me._addTablixRespDrill($ExtRow, BRObj.ColumnIndex, $Tablix, BRObj.Cell);
                            $ExtRow.HasDrill = true;
                        }
                        $Row.append(me._writeTablixCell(RIContext, BRObj, BRIndex, Obj.RowIndex, $Drilldown));
                    }
                    else {
                        if (respCols.ColHeaderRow === Obj.RowIndex || me._isHeader(respCols, BRObj.Cell)) {

                            if (respCols.Columns[BRObj.ColumnIndex].HeaderIndex === undefined)
                                respCols.Columns[BRObj.ColumnIndex].HeaderIndex = 0;
                            if (respCols.Columns[BRObj.ColumnIndex].HeaderName === undefined)
                                respCols.Columns[BRObj.ColumnIndex].HeaderName = me._getElements(BRObj.Cell.ReportItem).NonSharedElements.UniqueName;
                            respCols.Columns[BRObj.ColumnIndex].Header = me._writeReportItems(new reportItemContext(RIContext.RS, BRObj.Cell.ReportItem, BRIndex, RIContext.CurrObj, new $("<Div/>"), "", new tempMeasurement(CellHeight, CellWidth), true));
                            respCols.Columns[BRObj.ColumnIndex].Header.children().removeClass("fr-r-fS");
                            $ExtRow = null;
                        }
                        else {
                            if (respCols.Columns[BRObj.ColumnIndex].Header)
                                $ExtCell.append(respCols.Columns[BRObj.ColumnIndex].Header.clone(true, true).attr("data-uniqName", respCols.Columns[BRObj.ColumnIndex].HeaderName + "-" + respCols.Columns[BRObj.ColumnIndex].HeaderIndex++));
                            var ric;
                            ric = me._writeReportItems(new reportItemContext(RIContext.RS, BRObj.Cell.ReportItem, BRIndex, RIContext.CurrObj, new $("<Div/>"), "", new tempMeasurement(CellHeight, CellWidth)));
                            ric.css("width", CellWidth+"mm");
                            ric.css("height", CellHeight+"mm");
                            $ExtCell.append(ric);

                        }
                    }
                });
                State.CellCount += Obj.Cells.length;
            }
            else {
                CellWidth = RIContext.CurrObj.ColumnWidths.Columns[Obj.ColumnIndex].Width;
                if (Obj.Cell) {

                    if (Obj.Type === "RowHeader") {
                        //Write empty cell
                        if (LastColIndex !== Obj.ColumnIndex - 1 && Obj.ColumnIndex > 0 && Rowspans[Obj.ColumnIndex - 1] === undefined)
                            $Row.append($("<TD/>").html("&nbsp;"));
                    }
                    LastColIndex = Obj.ColumnIndex;


                    if (respCols.Columns[Obj.ColumnIndex].show === false && (Obj.Type === "Corner" || Obj.Type === "ColumnHeader")) {
                        var h = me._writeReportItems(new reportItemContext(RIContext.RS, Obj.Cell.ReportItem, Index, RIContext.CurrObj, new $("<Div/>"), "", new tempMeasurement(CellHeight, CellWidth), true));
                        if (respCols.Columns[Obj.ColumnIndex].Header ===undefined)
                            respCols.Columns[Obj.ColumnIndex].Header = new $("<div/>");
                        
                        if (respCols.Columns[Obj.ColumnIndex].HeaderIndex === undefined)
                            respCols.Columns[Obj.ColumnIndex].HeaderIndex = 0;
                        if (respCols.Columns[Obj.ColumnIndex].HeaderName === undefined)
                            respCols.Columns[Obj.ColumnIndex].HeaderName = me._getElements(Obj.Cell.ReportItem).NonSharedElements.UniqueName;
                        respCols.Columns[Obj.ColumnIndex].Header.append(h);
                        respCols.Columns[Obj.ColumnIndex].Header.children().children().removeClass("fr-r-fS");
                        $ExtRow = null;
                    }
                    else {
                        if (respCols.isResp && Obj.Type === "RowHeader" && Obj.RowSpan === undefined && respCols.ColHeaderRow !== Obj.RowIndex && $ExtRow && $ExtRow.HasDrill !==true) {
                            //add drill  - rowspan and of none means most detail RowHeader
                            $Drilldown = me._addTablixRespDrill($ExtRow, Obj.ColumnIndex, $Tablix,Obj.Cell);
                            $ExtCell.attr("colspan", respCols.ColumnCount - Obj.ColumnIndex);
                            $ExtRow.HasDrill = true;
                        }
                        //This is a hack for now, colIndex 0 makes a big assumption - but a pretty safe one
                        if (respCols.isResp && Obj.RowSpan !== undefined && Obj.ColumnIndex===0) {
                            if (Obj.Type === "Corner")
                                $Row.addClass("fr-resp-corner");
                            else
                                $Row.addClass("fr-resp-rowspan");
                        }
                        $Row.append(me._writeTablixCell(RIContext, Obj, Index, undefined, $Drilldown));
                    }
                    State.CellCount += 1;
                  
                }
                else  if (Obj.Type === "RowHeader") {
                    //Write empty cell
                    if (LastColIndex !== Obj.ColumnIndex - 1 && Obj.ColumnIndex > 0 && Rowspans[Obj.ColumnIndex-1] === undefined)
                        $Row.append($("<TD/>").html("&nbsp;"));
                }                
                    
            }
            LastObjType = Obj.Type;
            return { LastRowIndex: LastRowIndex,LastColIndex:LastColIndex,Colspans:Colspans,Rowspans:Rowspans, LastObjType: LastObjType, Row: $Row, ExtRow : $ExtRow, ExtCell : $ExtCell, HasFixedCols: HasFixedCols, HasFixedRows: HasFixedRows ,CellCount:State.CellCount  };          
        },

        _isHeader: function(respCols,cell){
            var me = this;
            var cellDefName;

            cellDefName = (me._getSharedElements(me._getElements(cell.ReportItem).SharedElements)).Name;

            if (respCols.ColumnHeaders[cellDefName])
                return true;
            return false;


        },
        replayRespTablix: function (replay) {
            var me = this;

            if (replay) {
                $.each(replay, function (i, obj) {
                    var icon;
                    var ExtRow;
                    var cell;

                    if (obj.Visible) {
                        //find cell
                        cell = me.element.find("[data-uniqName=\"" + obj.UniqueName + "\"]");
                        icon = cell.prev();
                        if (icon.hasClass("fr-render-respIcon") === false)
                            icon = icon.prev();
                        ExtRow = icon.parent().parent().parent().next();

                        me._TablixRespShow(icon, ExtRow, obj.ColIndex, obj.UniqueName);

                    }
                });
            }

        },
        _addTablixRespDrill: function ($ExtRow,ColIndex,$Tablix,Cell) {
            var me = this;

            var $Drilldown = new $("<div/>");
            $Drilldown.html("&nbsp");
            $Drilldown.addClass("fr-render-respTablix-expand");
            $Drilldown.addClass("fr-render-respIcon");

            $Drilldown.on("click", { ExtRow: $ExtRow, ColIndex: ColIndex, UniqueName: me._getElements(Cell.ReportItem).NonSharedElements.UniqueName, $Tablix: $Tablix }, function (e) {

                me._TablixRespShow(this, e.data.ExtRow, e.data.ColIndex, e.data.UniqueName, e.data.$Tablix);
                return;

            });
            $Drilldown.addClass("fr-core-cursorpointer");
            return $Drilldown;
        },

        _TablixRespShow: function (icon,ExtRow,ColIndex,UniqueName,$Tablix) {
            var me = this;
            var show = !ExtRow.is(":visible");
            var delta;

            if (show) {
                ExtRow.show();
                delta = 1;
                me.Page.Replay[UniqueName] = { Visible: true, ColIndex: ColIndex, UniqueName: UniqueName };
            }
            else {
                delta = -1;
                me.Page.Replay[UniqueName] = { Visible: false, ColIndex: ColIndex, UniqueName: UniqueName };
            }


            if (ColIndex > 0) {
                $.each(ExtRow.prevAll(), function (r, tr) {

                    //if the corrner stop
                    if ($(tr).hasClass("fr-resp-corner"))
                        return false;

                    $.each($(tr).children("[rowspan]"), function (c, td) {
                        if ($(td).height() > 0)
                            $(td).attr("rowspan", parseInt($(td).attr("rowspan")) + delta);
                    });
                    if ($(tr).hasClass("fr-resp-rowspan"))
                        return false;
                });
            }

            if (show) {
                $(icon).addClass("fr-render-respTablix-collapse");
                $(icon).removeClass("fr-render-respTablix-expand");
            }
            else {
                ExtRow.hide();
                $(icon).removeClass("fr-render-respTablix-collapse");
                $(icon).addClass("fr-render-respTablix-expand");
            }
            me.layoutReport(true);
            if ($Tablix)
                $Tablix.hide().show(0);
    
        },
        _batchSize: function () {
            return forerunner.config.getCustomSettingsValue("BigTablixBatchSize", 3000);
        },
        _tablixStream: {},
        _writeTablixRowBatch: function (Tablix) {
            var me = this;
            
            //me.options.reportViewer.showLoadingIndictator(me.options.reportViewer,true);

            for (var Index = Tablix.State.StartIndex; Index < Tablix.RIContext.CurrObj.TablixRows.length && Tablix.State.CellCount < me._batchSize(); Index++) {
                var Obj = Tablix.RIContext.CurrObj.TablixRows[Index];
                Tablix.State = me._writeSingleTablixRow(Tablix.RIContext, Tablix.$Tablix, Index, Obj, Tablix.$FixedColHeader, Tablix.$FixedRowHeader, Tablix.State, Tablix.respCols);
                if (Tablix.State.HasFixedRows === true)
                    Tablix.HasFixedRows = true;
                if (Tablix.State.HasFixedCols === true)
                    Tablix.HasFixedCols = true;
            }
            //me.options.reportViewer.removeLoadingIndicator(true);
            Tablix.State.StartIndex = Index;
            Tablix.State.CellCount = 0;
            if (Tablix.State.StartIndex < Tablix.RIContext.CurrObj.TablixRows.length) {                
                Tablix.$Tablix.append(Tablix.EndRow);
                Tablix.BigTablix = true;
            }
            else {
                Tablix.$Tablix.append(Tablix.State.Row);
                if (Tablix.respCols.isResp && Tablix.State.ExtRow && Tablix.State.ExtRow.children()[0].children.length > 0) {
                    Tablix.$Tablix.append(Tablix.State.ExtRow);
                    Tablix.State.ExtRow.hide();
                }
                else
                    Tablix.State.Row.find(".fr-render-respIcon").hide();

                Tablix.BigTablixDone = true;
            }
        },

        _lazyLoadTablix: function (me) {

            for (var name in me._tablixStream) {
                if (me._tablixStream[name].EndRow.visible(false,false,"vertical")){
                    me._tablixStream[name].EndRow.detach();
                    me._writeTablixRowBatch(me._tablixStream[name]);

                    //If we are done re-size the report to the new size
                    if (me._tablixStream[name].BigTablixDone) {
                        me.layoutReport(true);
                    }
                }

            }

        },


        _writeSubreport: function (RIContext) {
            var me = this;

            if (RIContext.CurrObjParent.Type !== "Tablix") {
                RIContext.Style += me._getElementsStyle(RIContext.RS, RIContext.CurrObj.SubReportProperties);
            }
            RIContext.CurrObj = RIContext.CurrObj.BodyElements;
            me._writeBookMark(RIContext);
            me._writeTooltip(RIContext);
            return me._writeRectangle(RIContext);
    
        },
        _writeLine: function (RIContext) {
            var me = this;
            var measurement = me._getMeasurmentsObj(RIContext.CurrObjParent, RIContext.CurrObjIndex);
            var Style = "position:relative;width:" + measurement.Width + "mm;height:" + measurement.Height + "mm;";
            
            if (measurement.Width === 0 || measurement.Height === 0) {
                Style += me._getFullBorderStyle(RIContext.CurrObj.Elements.NonSharedElements);
                RIContext.$HTMLParent.addClass(me._getClassName("fr-b-", RIContext.CurrObj));
            }
            else {
                var $line = $("<Div/>");
                var newWidth = Math.sqrt(Math.pow(measurement.Height, 2) + Math.pow(measurement.Width, 2));
                var rotate = Math.atan(measurement.Height / measurement.Width);
                var newTop = (newWidth / 2) * Math.sin(rotate);
                var newLeft = (newWidth / 2) - Math.sqrt(Math.pow(newWidth / 2, 2) + Math.pow(newTop, 2));
                if (!(me._getSharedElements(RIContext.CurrObj.Elements.SharedElements).Slant === undefined || me._getSharedElements(RIContext.CurrObj.Elements.SharedElements).Slant === 0))
                    rotate = rotate - (2 * rotate);

                var lineStyle = "position:absolute;top:" + newTop + "mm;left:" + newLeft + "mm;";
                lineStyle += me._getFullBorderStyle(RIContext.CurrObj.Elements.NonSharedElements);
                $line.addClass(me._getClassName("fr-b-", RIContext.CurrObj));

                lineStyle += "width:" + newWidth + "mm;height:0;";
                lineStyle += "-moz-transform: rotate(" + rotate + "rad);";
                lineStyle += "-webkit-transform: rotate(" + rotate + "rad);";
                lineStyle += "-ms-transform: rotate(" + rotate + "rad);";
                lineStyle += "transform: rotate(" + rotate + "rad);";
                $line.attr("Style", lineStyle);

                RIContext.$HTMLParent.append($line);
            }

            me._writeBookMark(RIContext);
            me._writeTooltip(RIContext);

            RIContext.$HTMLParent.attr("Style", Style + RIContext.Style);
            return RIContext.$HTMLParent;

        },
        _writeBookMark: function (RIContext) {
            var me = this;
            var $node = $("<a/>"),
                CurrObj = RIContext.CurrObj.Elements,
                bookmark = me._getSharedElements(CurrObj.SharedElements).Bookmark || CurrObj.NonSharedElements.Bookmark;

            if (bookmark) {
                me._writeUniqueName($node, bookmark);
                //$node.attr("id", bookmark);
                RIContext.$HTMLParent.append($node);
            }   
        },
        _writeTooltip: function (RIContext) {
            var me = this;

            var CurrObj = RIContext.CurrObj.Elements,
                tooltip = me._getSharedElements(CurrObj.SharedElements).Tooltip || CurrObj.NonSharedElements.Tooltip;

            if (tooltip) {
                if (RIContext.CurrObjParent.Type === "Image")
                    RIContext.$HTMLParent.attr("alt", tooltip);
                else if (RIContext.CurrObjParent.Type === "Chart")
                    RIContext.$HTMLParent.attr("alt", tooltip);
                else if (RIContext.CurrObjParent.Type === "Gauge")
                    RIContext.$HTMLParent.attr("alt", tooltip);
                else if (RIContext.CurrObjParent.Type === "Map")
                    RIContext.$HTMLParent.attr("alt", tooltip);
                else
                    RIContext.$HTMLParent.attr("title", tooltip);
            }
        },
        //Helper fucntions
        _getHeight: function ($obj) {
            var me = this;
            var height;
            var $copiedElem ;

            $copiedElem = $obj.clone().css({ visibility: "hidden" });
            $copiedElem.find("img").remove();

            $("body").append($copiedElem);
            height = $copiedElem.outerHeight() + "px";
            $copiedElem.remove();

            //Return in mm
            return me._convertToMM(height);

        },
        _getElements: function (CurrObj) {
            //Use to handle report items and sub reports
            if (CurrObj.Elements)
                return CurrObj.Elements;
            if (CurrObj.SubReportProperties)
                return CurrObj.SubReportProperties
        },

        _getElementsStyle: function (RS, CurrObj) {
            var Style = "";
            var me = this;

            //Style += me._getStyle(RS, me._getSharedElements(CurrObj.SharedElements).Style, CurrObj.NonSharedElements);
            Style += me._getStyle(RS, CurrObj.NonSharedElements.Style, CurrObj.NonSharedElements);
            //Background Image maybe at root
            Style += me._getStyle(RS, CurrObj, CurrObj);
            return Style;
        },
        _getElementsTextStyle: function (CurrObj) {
            var Style = "";
            var me = this;

            //Style += me._getTextStyle(me._getSharedElements(CurrObj.SharedElements).Style, CurrObj.NonSharedElements);
            Style += me._getTextStyle(CurrObj.NonSharedElements.Style, CurrObj.NonSharedElements);
            return Style;
        },
        _getElementsNonTextStyle: function (RS, CurrObj) {
            var Style = "";
            var me = this;

            //Style += me._getNonTextStyle(RS, me._getSharedElements(CurrObj.SharedElements).Style, CurrObj.NonSharedElements);
            Style += me._getNonTextStyle(RS, CurrObj.NonSharedElements.Style, CurrObj.NonSharedElements);
            return Style;
        },
        _getBorderSize: function (CurrObj, Side) {
            var me = this;
            var Obj;
            var DefaultStyle;
            var SideStyle;
            var DefaultSize;
            var SideSize;

            //Need left, top, right bottom border
            Obj = me._getSharedElements(CurrObj.Elements.SharedElements).Style;
            if (Obj) {
                DefaultStyle = Obj.BorderStyle;
                SideStyle = Obj["BorderStyle" + Side];
                DefaultSize = Obj.BorderWidth;
                SideSize = Obj["BorderWidth" + Side];
            }
            else {
                Obj = CurrObj.Elements.NonSharedElements.Style;
                if (Obj) {
                    DefaultStyle = Obj.BorderStyle;
                    SideStyle = Obj["BorderStyle" + Side];
                    DefaultSize = Obj.BorderWidth;
                    SideSize = Obj["BorderWidth" + Side];
                }
            }
    
            if (!SideStyle && DefaultStyle === 0)
                return 0;
            if (SideStyle === 0)
                return 0;
            if (!SideSize)
                return me._convertToMM(DefaultSize);
            else
                return me._convertToMM(SideSize);
        },
        _getPaddingSize: function (CurrObj, Side) {
            var me = this;
            var Obj;
            var SideSize;

    
            Obj = me._getSharedElements(CurrObj.Elements.SharedElements).Style;
            if (Obj) {
                SideSize = Obj["Padding" + Side];
            }
            else {
                Obj = CurrObj.Elements.NonSharedElements.Style;
                if (Obj) {
                    SideSize = Obj["Padding" + Side];
                }
            }
            return me._convertToMM(SideSize);
        },
        _getFullBorderStyle: function (CurrObj) {
            var me = this;
            var Style = "";
            var Obj;

            if (!CurrObj)
                return "";

            //Need left, top, right bottom border
            //Obj = me._getSharedElements(CurrObj.Elements.SharedElements).Style;
            //if (Obj !== undefined) {
            //    if (Obj.BorderStyle !== undefined && Obj.BorderStyle !==0 )
            //        Style += "border:" + Obj.BorderWidth + " " + me._getBorderStyle(Obj.BorderStyle) + " " + Obj.BorderColor + ";";
            //    if (Obj.BorderStyleLeft !== undefined || Obj.BorderWidthLeft !== undefined || Obj.BorderColorLeft !== undefined)
            //        Style += "border-left:" + ((Obj.BorderWidthLeft === undefined) ? Obj.BorderWidth : Obj.BorderWidthLeft) + " " + ((Obj.BorderStyleLeft === undefined) ? me._getBorderStyle(Obj.BorderStyle) : me._getBorderStyle(Obj.BorderStyleLeft)) + " " + ((Obj.BorderColorLeft === undefined) ? Obj.BorderColor : Obj.BorderColorLeft) + ";";
            //    if (Obj.BorderStyleRight !== undefined || Obj.BorderWidthRight !== undefined || Obj.BorderColorRight !== undefined)
            //        Style += "border-right:" + ((Obj.BorderWidthRight === undefined) ? Obj.BorderWidth : Obj.BorderWidthRight) + " " + ((Obj.BorderStyleRight === undefined) ? me._getBorderStyle(Obj.BorderStyle) : me._getBorderStyle(Obj.BorderStyleRight)) + " " + ((Obj.BorderColorRight === undefined) ? Obj.BorderColr : Obj.BorderColorRight) + ";";
            //    if (Obj.BorderStyleTop !== undefined || Obj.BorderWidthTop !== undefined || Obj.BorderColorTop !== undefined)
            //        Style += "border-top:" + ((Obj.BorderWidthTop === undefined) ? Obj.BorderWidth : Obj.BorderWidthTop) + " " + ((Obj.BorderStyleTop === undefined) ? me._getBorderStyle(Obj.BorderStyle) : me._getBorderStyle(Obj.BorderStyleTop)) + " " + ((Obj.BorderColorTop === undefined) ? Obj.BorderColor : Obj.BorderColorTop) + ";";
            //    if (Obj.BorderStyleBottom !== undefined || Obj.BorderWidthBottom !== undefined || Obj.BorderColorBottom !== undefined)
            //        Style += "border-bottom:" + ((Obj.BorderWidthBottom === undefined) ? Obj.BorderWidth : Obj.BorderWidthBottom) + " " + ((Obj.BorderStyleBottom === undefined) ? me._getBorderStyle(Obj.BorderStyle) : me._getBorderStyle(Obj.BorderStyleBottom)) + " " + ((Obj.BorderColorBottom === undefined) ? Obj.BorderColor : Obj.BorderColorBottom) + ";";
            //}
            Obj = CurrObj;            
            if (Obj !== undefined) {
                if (Obj.BorderStyle !== undefined && Obj.BorderStyle !== 0)
                    Style += "border:" + Obj.BorderWidth + " " + me._getBorderStyle(Obj.BorderStyle) + " " + Obj.BorderColor + "!important;";
                if (Obj.BorderStyleLeft !== undefined || Obj.BorderWidthLeft !== undefined || Obj.BorderColorLeft !== undefined)
                    Style += "border-left:" + ((Obj.BorderWidthLeft === undefined) ? Obj.BorderWidth : Obj.BorderWidthLeft) + " " + ((Obj.BorderStyleLeft === undefined) ? me._getBorderStyle(Obj.BorderStyle) : me._getBorderStyle(Obj.BorderStyleLeft)) + " " + ((Obj.BorderColorLeft === undefined) ? Obj.BorderColor : Obj.BorderColorLeft) + "!important;";
                if (Obj.BorderStyleRight !== undefined || Obj.BorderWidthRight !== undefined || Obj.BorderColorRight !== undefined)
                    Style += "border-right:" + ((Obj.BorderWidthRight === undefined) ? Obj.BorderWidth : Obj.BorderWidthRight) + " " + ((Obj.BorderStyleRight === undefined) ? me._getBorderStyle(Obj.BorderStyle) : me._getBorderStyle(Obj.BorderStyleRight)) + " " + ((Obj.BorderColorRight === undefined) ? Obj.BorderColor : Obj.BorderColorRight) + "!important;";
                if (Obj.BorderStyleTop !== undefined || Obj.BorderWidthTop !== undefined || Obj.BorderColorTop !== undefined)
                    Style += "border-top:" + ((Obj.BorderWidthTop === undefined) ? Obj.BorderWidth : Obj.BorderWidthTop) + " " + ((Obj.BorderStyleTop === undefined) ? me._getBorderStyle(Obj.BorderStyle) : me._getBorderStyle(Obj.BorderStyleTop)) + " " + ((Obj.BorderColorTop === undefined) ? Obj.BorderColor : Obj.BorderColorTop) + "!important;";
                if (Obj.BorderStyleBottom !== undefined || Obj.BorderWidthBottom !== undefined || Obj.BorderColorBottom !== undefined)
                    Style += "border-bottom:" + ((Obj.BorderWidthBottom === undefined) ? Obj.BorderWidth : Obj.BorderWidthBottom) + " " + ((Obj.BorderStyleBottom === undefined) ? me._getBorderStyle(Obj.BorderStyle) : me._getBorderStyle(Obj.BorderStyleBottom)) + " " + ((Obj.BorderColorBottom === undefined) ? Obj.BorderColor : Obj.BorderColorBottom) + "!important;";
                if (Obj.BackgroundColor)
                    Style += "background-color:" + Obj.BackgroundColor + ";";
            }

            return Style;
        },
        _getMeasurementsInvert: function (CurrObj) {
            var me = this;
            var Style = "";
            //TODO:  zIndex

            if (!CurrObj)
                return "";

            //Top and left are set in set location, height is not set becasue differnt browsers measure and break words differently
            if (CurrObj.Width !== undefined) {
                Style += "height:" + CurrObj.Width + "mm;";
                Style += "min-height:" + CurrObj.Width + "mm;";
                Style += "max-height:" + (CurrObj.Width) + "mm;";
            }

            if (CurrObj.Height !== undefined) {
                Style += "width:" + CurrObj.Height + "mm;";
                Style += "min-width:" + CurrObj.Height + "mm;";
                Style += "max-width:" + (CurrObj.Height) + "mm;";
            }

            if (CurrObj.zIndex)
                Style += "z-index:" + CurrObj.zIndex + ";";

            return Style;
        },
        _getMeasurements: function (CurrObj, includeHeight) {
            var me = this;
            var Style = "";
            //TODO:  zIndex

            if (!CurrObj)
                return "";

            //Top and left are set in set location, height is not set becasue differnt browsers measure and break words differently
            if (CurrObj.Width !== undefined) {
                Style += "width:" + me._getWidth(CurrObj.Width) + "mm;";
                Style += "min-width:" + me._getWidth(CurrObj.Width ) + "mm;";
                Style += "max-width:" + me._getWidth(CurrObj.Width) + "mm;";
            }

            if (includeHeight && CurrObj.Height !== undefined){
                Style += "height:" + CurrObj.Height + "mm;";
                Style += "min-height:" + CurrObj.Height + "mm;";
                Style += "max-height:" + (CurrObj.Height) + "mm;";
            }

            if (CurrObj.zIndex)
                Style += "z-index:" + CurrObj.zIndex + ";";

            return Style;
        },
        _getStyle: function (RS, CurrObj, TypeCodeObj) {
            var me = this;
            var Style = "";

            if (!CurrObj)
                return Style;

            Style += me._getNonTextStyle(RS, CurrObj, TypeCodeObj);
            Style += me._getTextStyle(CurrObj, TypeCodeObj);

            return Style;
        },
        _backgroundRepeatTypesMap: function () {
            return {
                0: "repeat",    // Repeat
                1: "no-repeat", // Clip
                2: "repeat-x",  // RepeatX
                3: "repeat-y"   // RepeatY
            };
        },
        _getImageStyleURL: function (RS, ImageName) {
            var me = this;
            return "url(" + me._getImageURL(RS, ImageName) + ")";
        },
        _getNonTextStyle: function (RS, CurrObj, TypeCodeObj) {
            var me = this;
            var Style = "";

            if (!CurrObj)
                return Style;

            if (CurrObj.BackgroundColor)
                Style += "background-color:" + CurrObj.BackgroundColor + ";";
            if (CurrObj.BackgroundImage)
                Style += "background-image:" + me._getImageStyleURL(RS, CurrObj.BackgroundImage.ImageName) + ";";
            if (CurrObj.BackgroundRepeat !== undefined && me._backgroundRepeatTypesMap()[CurrObj.BackgroundRepeat])
                Style += "background-repeat:" + me._backgroundRepeatTypesMap()[CurrObj.BackgroundRepeat] + ";";

            return Style;
        },
        _getTextDirection:function(CurrObj){
            var Dirclass = "";
            var me = this;

            if (me._getSharedElements(CurrObj.SharedElements).Style && me._getSharedElements(CurrObj.SharedElements).Style.WritingMode !== undefined){
                if (me._getSharedElements(CurrObj.SharedElements).Style.WritingMode === 1)
                    Dirclass = "fr-rotate-90";
            if (me._getSharedElements(CurrObj.SharedElements).Style.WritingMode === 2)
                    Dirclass = "fr-rotate-270";
            }
            if (CurrObj.NonSharedElements.Style && CurrObj.NonSharedElements.Style.WritingMode !== undefined) {
                if (CurrObj.NonSharedElements.Style.WritingMode === 1)
                    Dirclass = "fr-rotate-90";
                if (CurrObj.NonSharedElements.Style.WritingMode === 2)
                    Dirclass = "fr-rotate-270";
            }
            return Dirclass;

          
        },
        _getTextStyle: function (CurrObj, TypeCodeObj) {
            var me = this;
            var Style = "";

            if (!CurrObj)
                return Style;

            if (CurrObj.PaddingBottom !== undefined)
                Style += "padding-bottom:" + CurrObj.PaddingBottom + ";";
            if (CurrObj.PaddingLeft !== undefined)
                Style += "padding-left:" + CurrObj.PaddingLeft + ";";
            if (CurrObj.PaddingRight !== undefined)
                Style += "padding-right:" + CurrObj.PaddingRight + ";";
            if (CurrObj.PaddingTop !== undefined)
                Style += "padding-top:" + CurrObj.PaddingTop + ";";
            if (CurrObj.UnicodeBiDi !== undefined)
                Style += "unicode-bidi:" + me._getBiDi(CurrObj.UnicodeBiDi) + ";";
            if (CurrObj.VerticalAlign !== undefined)
                Style += "vertical-align:" + me._getVAligh(CurrObj.VerticalAlign) + ";";
            //if (CurrObj.WritingMode !== undefined)
            //    Style += "layout-flow:" + me._getLayoutFlow(CurrObj.WritingMode) + ";";
            if (CurrObj.Direction !== undefined)
                Style += "Direction:" + me._getDirection(CurrObj.Direction) + ";";

            if (CurrObj.TextAlign !== undefined)
                Style += "text-align:" + me._getTextAlign(CurrObj.TextAlign, TypeCodeObj) + ";";
            if (CurrObj.FontStyle !== undefined)
                Style += "font-style:" + me._getFontStyle(CurrObj.FontStyle) + ";";
            if (CurrObj.FontWeight !== undefined)
                Style += "font-weight:" + me._getFontWeight(CurrObj.FontWeight) + ";";
            if (CurrObj.FontFamily !== undefined)
                Style += "font-family:" + CurrObj.FontFamily + ";";
            if (CurrObj.FontSize !== undefined)
                Style += "font-size:" + me._getFontSize(CurrObj.FontSize) + ";";
            if (CurrObj.TextDecoration !== undefined)
                Style += "text-decoration:" + me._getTextDecoration(CurrObj.TextDecoration) + ";";
            if (CurrObj.Color !== undefined)
                Style += "color:" + CurrObj.Color + ";";
            //   if (CurrObj.Calendar !== undefined)
            //       Style += "calendar:" + GetCalendar(CurrObj.Calendar) + ";";
            //writing-mode:lr-tb;?
            return Style;

        },
        _getCalendar: function (RPLCode) {
            switch (RPLCode) {
                case 0:
                    return "Gregorian";
                case 1:
                    return "GregorianArabic";
                case 2:
                    return "GregorianMiddleEastFrench";
                case 3:
                    return "GregorianTransliteratedEnglish";
                case 4:
                    return "GregorianTransliteratedFrench";
                case 5:
                    return "GregorianUSEnglish";
                case 6:
                    return "Hebrew";
                case 7:
                    return "Hijri";
                case 9:
                    return "Korean";
                case 10:
                    return "Julian";
                case 11:
                    return "Taiwan";
                case 12:
                    return "ThaiBuddist";
            }
            return "Gregorian";
        },
        _getTextDecoration: function (RPLCode) {
            switch (RPLCode) {
                case 0:
                    return "None";
                case 1:
                    return "Underline";
                case 2:
                    return "Overline";
                case 3:
                    return "LineThrough";
            }
            return "None";
        },
        _getFontWeight: function (RPLCode) {
            switch (RPLCode) {
                case 0:
                    return "Normal";
                case 1:
                    return "Thin";
                case 2:
                    return "ExtraLight";
                case 3:
                    return "Light";
                case 4:
                    return "Medium";
                case 5:
                    return "SemiBold";
                case 6:
                    return "Bold";
                case 7:
                    return "ExtraBold";
                case 8:
                    return "Heavy";
            }
            return "General";
        },
        _getFontStyle: function (RPLCode) {
            switch (RPLCode) {
                case 0:
                    return "Normal";
                case 1:
                    return "Italic";
            }
            return "Normal";
        },
        _getTextAlign: function (RPLCode, TypeCodeObj) {
            switch (RPLCode) {
                case 0:
                    //Default is string, need to handle direction, 15 seems to be decimal not datetime
                    if (TypeCodeObj === undefined  || TypeCodeObj.TypeCode === undefined)
                        return "Left";
                    switch (TypeCodeObj.TypeCode) {                        
                        case 3:
                        case 6:
                        case 7:
                        case 9:
                        case 11:
                        case 12:
                        case 13:
                        case 14:
                        case 15:
                        case 16:
                            return "Right";
                        case 4:
                        case 17:
                        case 18:
                            return "Left";
                        default:
                            return "Left";
                    }

                    break;
                case 1:
                    return "Left";
                case 2:
                    return "Center";
                case 3:
                    return "Right";
            }

        },
        _getDirection: function (RPLCode) {
            switch (RPLCode) {
                case 0:
                    return "LTR";
                case 1:
                    return "RTL";

            }
            return "LTR";
        },
        _getLayoutFlow: function (RPLCode) {
            switch (RPLCode) {
                case 0:
                    return "Horizontal";
                case 1:
                    return "Vertical";
                case 2:
                    return "Rotate270";
            }
            return "Horizontal";
        },
        _getVAligh: function (RPLCode) {
            switch (RPLCode) {
                case 0:
                    return "Top";
                case 1:
                    return "Middle";
                case 2:
                    return "Bottom";
            }
            return "Top";
        },
        _getBiDi: function (RPLCode) {
            switch (RPLCode) {
                case 0:
                    return "normal";
                case 1:
                    return "embed";
                case 2:
                    return "BiDiOverride";
            }
            return "normal";
        },
        _getDefaultHTMLTable: function () {
            var $newObj = $("<Table/>");

            $newObj.attr("CELLSPACING", 0);
            $newObj.attr("CELLPADDING", 0);
            return $newObj;
        },
        _getBorderStyle: function (RPLStyle) {
            switch (RPLStyle) {
                case 0:
                    return "None";
                case 1:
                    return "Dotted";
                case 2:
                    return "Dashed";
                case 3:
                    return "Solid";
                case 4:
                    return "Double";
            }
            return "None";
        },
        _getMeasurmentsObj: function (CurrObj, Index) {
            var retval = null;

            if (CurrObj.Measurement)
                retval = CurrObj.Measurement.Measurements[Index];
            return retval;
        },
        _getSharedElements: function(sharedElements){
            var me = this;
            
            if (sharedElements.SID) {
                return me.reportObj.ReportContainer.SharedElements[sharedElements.SID];
            }
            else
                return sharedElements;

        },
        _convertToMM: function (convertFrom) {
    
            if (!convertFrom)
                return 0;
    
            var unit = convertFrom.match(/\D+$/);  // get the existing unit
            var value = convertFrom.match(/\d+/);  // get the numeric component

            if (unit && unit.length === 1)
                unit = unit[0];
            else
                unit = "px";

            if (value.length === 1) value = value[0];

            switch (unit) {
                case "px":
                    return value / 3.78;
                case "pt":
                    return value * 0.352777777778;
                case "in":
                    return value * 25.4;
                case "mm":
                    return value;
                case "cm":
                    return value * 10;
                case "em":
                    return value * 4.2175176;
            }

            //This is an error
            return value;
        },

        _getFontSize:function (fontSize){
            if (!fontSize)
                return "";
    
            //Not needed anymore with fixed table,  leaving in just in case.
            //if (!forerunner.device.isMSIE())
            return fontSize;


           // var unit = fontSize.match(/\D+$/);  // get the existing unit
           // var value = fontSize.match(/\d+/);  // get the numeric component

           // if (unit.length === 1) unit = unit[0];
           // if (value.length === 1) value = value[0];

           ////This is an error
           // return (value*0.98) + unit ;
        },
        _getListStyle: function (Style, Level) {
            var ListStyle;
            //Numbered
            if (Style === 1) {
                switch (Level % 3) {
                    case 1:
                        ListStyle = "decimal";
                        break;
                    case 2:
                        ListStyle = "lower-roman";
                        break;
                    case 0:
                        ListStyle = "lower-latin";
                        break;
                }
            }
                //Bulleted
            else if (Style === 2) {
                switch (Level % 3) {
                    case 0:
                        ListStyle = "square";
                        break;
                    case 1:
                        ListStyle = "disc";
                        break;
                    case 2:
                        ListStyle = "circle";
                        break;
                }
            }
            return "fr-render-list-" + ListStyle;
        },
        _stopDefaultEvent: function (e) {
            //IE
            if (window.ActiveXObject)
                window.event.returnValue = false;
            else {
                e.preventDefault();
                e.stopPropagation();
            }
        },
        _getNatural: function (domElement) {
            if ((domElement.naturalWidth) && (domElement.naturalHeight) ) {
                return { width: domElement.naturalWidth, height: domElement.naturalHeight };
            }
            else {
                var img = new Image();
                img.src = domElement.src;
                return { width: img.width, height: img.height };
            }
        },
        isNull: function (val) {
            if (val === null || val === undefined)
                return true;
            else
                return false;
        },
        _getWidth: function (val) {
            // might be usfull for text sizing issues between browsers
            return val ;
        },
        _getNewLineFormatText: function (Value) {
            return Value.replace(/\r\n+/g, "\n");
        },
        _createStyles: function(RS){
            var me = this;
            var CSS = "<style type='text/css' id='" + me.options.reportViewer.viewerID + "'>";
            var styles = me.reportObj.ReportContainer.SharedElements;

            for (var key in styles) {                
                //CSS += ".fr-border-" + styles[key].SID + "-" + me.reportObj.SessionID  + "{" + me._getFullBorderStyle(styles[key].Style) + "} ";
                //CSS += ".fr-text-" + styles[key].SID + "-" + me.reportObj.SessionID + "{" + me._getTextStyle(styles[key].Style) + "} ";
                //CSS += ".fr-nonText-" + styles[key].SID + "-" + me.reportObj.SessionID + "{" + me._getNonTextStyle(RS, styles[key].Style) + "} ";
                CSS += ".fr-b-" + styles[key].SID + "-" + me.options.reportViewer.viewerID + "{" + me._getFullBorderStyle(styles[key].Style) + "} ";
                CSS += ".fr-t-" + styles[key].SID + "-" + me.options.reportViewer.viewerID + "{" + me._getTextStyle(styles[key].Style, styles[key]) + "} ";
                CSS += ".fr-n-" + styles[key].SID + "-" + me.options.reportViewer.viewerID + "{" + me._getNonTextStyle(RS, styles[key].Style) + "} ";
            }

            
            me.Page.CSS = $(CSS + "</style>");
            me.Page.CSS.appendTo("head");
            
        },
        _getClassName: function (name, obj) {
            var me = this;

            var cName = "";

            if (obj.SubReportProperties)
                obj = obj.SubReportProperties;

            if (obj.Elements && obj.Elements.SharedElements)
                return name + obj.Elements.SharedElements.SID + "-" + me.options.reportViewer.viewerID;
            if (obj.SharedElements)
                return name + obj.SharedElements.SID + "-" + me.options.reportViewer.viewerID;
            return cName;
        },
        _roundToTwo: function (num) {    
            return +(Math.round(num + "e+2")  + "e-2");
        },
    });  // $.widget
});
///#source 1 1 /Forerunner/ReportViewer/js/ReportParameter.js
/**
 * @file Contains the parameter widget.
 *
 */

// Assign or create the single globally scoped variable
var forerunner = forerunner || {};

// Forerunner SQL Server Reports
forerunner.ssr = forerunner.ssr || {};

$(function () {
    var widgets = forerunner.ssr.constants.widgets;
    var events = forerunner.ssr.constants.events;
    var paramContainerClass = "fr-param-container";


    /**
     * Widget used to manage report parameters
     *
     * @namespace $.forerunner.reportParameter
     * @prop {Object} options - The options for report parameter
     * @prop {Object} options.$reportViewer - The report viewer widget
     * @prop {Object} options.$appContainer - Report page container
     * @prop {Integer} options.pageNum - Report page number
     *
     * @example
     * $paramArea.reportParameter({ $reportViewer: this });
     * $("#paramArea").reportParameter({
     *  $reportViewer: $viewer,
     *  $appContainer: $appContainer
	 * });    
     */
    $.widget(widgets.getFullname(widgets.reportParameter), {
        options: {
            $reportViewer: null,
            pageNum: null,
            $appContainer: null
        },

        $params: null,
        _formInit: false,
        _paramCount: 0,
        _defaultValueExist: false,
        _loadedForDefault: true,
        _reportDesignError: null,
        _revertLock: false, 

        _init: function () {
            var me = this;
            me.element.html(null);
            me.enableCascadingTree = forerunner.config.getCustomSettingsValue("EnableCascadingTree", true) === "on";
        },
        _destroy: function () {

        },
        _render: function () {
            var me = this;

            me.element.html(null);
            var $params = new $("<div class='" + paramContainerClass + " fr-core-widget'>" +
                "<form class='fr-param-form' onsubmit='return false'>" +
                   "<div class='fr-param-element-border'><input type='text' style='display:none'></div>" +
                   "<div>" +
                       "<div class='fr-param-submit-container'>" +
                          "<input name='Parameter_ViewReport' type='button' class='fr-param-viewreport fr-param-button' value='" + me.options.$reportViewer.locData.paramPane.viewReport + "'/>" +
                       "</div>" +
                       "<div class='fr-param-cancel-container'>" +
                          "<span class='fr-param-cancel'>" + me.options.$reportViewer.locData.paramPane.cancel + "</span>" +
                       "</div>" +
                    "</div>" +
                "</form>" +
                "<div style='height:65px;'/>" +
                "</div>");

            me.element.css("display", "block");
            me.element.html($params);

            me.$params = $params;
            me.$form = me.element.find(".fr-param-form");

            me._formInit = true;
        },
        _dependencyList: null,
        //indicate whether apply cascading tree
        _isDropdownTree: true,
        _writeParamDoneCallback: null,

        /**
         * Get number of visible parameters
         *
         * @function $.forerunner.reportParameter#getNumOfVisibleParameters
         *
         * @return {Integer} The number of visible parameters.
         */
        getNumOfVisibleParameters: function () {
            var me = this;
            if (me.$numVisibleParams !== undefined)
                return me.$numVisibleParams;
            return 0;
        },

        _parameterDefinitions: {},
        _hasPostedBackWithoutSubmitForm: false,
        /**
         * Update an existing parameter panel by posting back current selected values to update casacade parameters.
         *
         * @function $.forerunner.reportParameter#updateParameterPanel
         * 
         * @param {Object} data - Parameter data get from reporting service
         * @param {Boolean} submitForm - Submit form when parameters are satisfied
         * @param {Integer} pageNum - Current page number
         * @param {Boolean} renderParamArea - Whether to make parameter area visible
         */
        updateParameterPanel: function (data, submitForm, pageNum, renderParamArea, isCascading) {
            var me = this;

            //only refresh tree view if it's a cascading refresh and there is a dropdown tree
            if (isCascading && me._isDropdownTree && me.enableCascadingTree) {
                var $li = me.element.find(".fr-param-tree-loading");
                me._dataPreprocess(data.ParametersList);
                var level = $li.parent("ul").attr("level");

                var parentName = $li.parent().attr("name");
                var childName = me._dependencyList[parentName];
                var $childList = null;
                //now it only work for 1 to 1 relationship
                for (var i = 0; i < childName.length; i++) {
                    $childList = me._getCascadingTree(me._parameterDefinitions[childName[i]], parseInt(level, 10) + 1);
                    if ($childList) {
                        $li.append($childList);
                    }
                }

                $li.removeClass("fr-param-tree-loading");
            }
            else {
                this.removeParameter();
                this.writeParameterPanel(data, pageNum, submitForm, renderParamArea);
            }

            this._hasPostedBackWithoutSubmitForm = true;
        },

        /**
        * Set the parameter panel to the given list
        *
        * @function $.forerunner.reportParameter#setParametersAndUpdate
        * 
        * @param {Object} paramDefs - Parameter definition data.
        * @param {String} paramsList - Parameter value list.
        * @param {Integer} pageNum - Current page number.
        */
        setParametersAndUpdate: function (paramDefs, savedParams, pageNum) {
            var me = this;
            me.updateParameterPanel(paramDefs, false, pageNum, false);
            me._submittedParamsList = savedParams;
            this._hasPostedBackWithoutSubmitForm = false;
            me.revertParameters();
        },


        /**
         * Write parameter pane with passed definition data
         *
         * @function $.forerunner.reportParameter#writeParameterPanel
         *
         * @param {Object} data - Original parameter data returned from reporting service
         * @param {Integer} pageNum - Current page number
         * @param {Boolean} submitForm - Whether to submit form if all parameters are satisfied.
         * @param {Boolean} renderParamArea - Whether to make parameter area visible.
         */
        writeParameterPanel: function (data, pageNum, submitForm, renderParamArea) {
            var me = this;
            if (me.$params === null) me._render();

            me.options.pageNum = pageNum;
            me._paramCount = parseInt(data.Count, 10);

            me._defaultValueExist = data.DefaultValueExist;
            me._loadedForDefault = true;
            me._render();
            me.$numVisibleParams = 0;

            me._dataPreprocess(data.ParametersList);

            var $eleBorder = $(".fr-param-element-border", me.$params);
            $.each(data.ParametersList, function (index, param) {
                if (param.Prompt !== "" && (param.PromptUserSpecified ? param.PromptUser : true)) {
                    me.$numVisibleParams += 1;
                    $eleBorder.append(me._writeParamControl(param, new $("<div />"), pageNum));
                }
                else
                    me._checkHiddenParam(param);
            });
            //resize the textbox width when custom right pane width is big
            me._elementWidthCheck();

            if (me._reportDesignError !== null)
                me._reportDesignError += me.options.$reportViewer.locData.messages.contactAdmin;

            me.$form.validate({
                ignoreTitle: true,
                errorPlacement: function (error, element) {
                    if (element.is(":radio"))
                        error.appendTo(element.parent("div").nextAll(".fr-param-error-placeholder"));
                    else {
                        if (element.attr("ismultiple") === "true") {
                            error.appendTo(element.parent("div").next("span"));
                        }
                        else if (element.hasClass("ui-autocomplete-input") || element.hasClass("fr-param-tree-input")) {
                            error.appendTo(element.parent("div").nextAll(".fr-param-error-placeholder"));
                        }
                        else
                            error.appendTo(element.nextAll(".fr-param-error-placeholder"));
                    }
                },
                highlight: function (element) {
                    if ($(element).is(":radio"))
                        $(element).parent("div").addClass("fr-param-error");
                    else
                        $(element).addClass("fr-param-error");
                },
                unhighlight: function (element) {
                    if ($(element).is(":radio"))
                        $(element).parent("div").removeClass("fr-param-error");
                    else
                        $(element).removeClass("fr-param-error");
                }
            });
            $(".fr-param-viewreport", me.$params).on("click", function () {
                me._submitForm(pageNum);
            });
            $(".fr-param-cancel", me.$params).on("click", function () {
                me._cancelForm();
            });

            if (submitForm !== false) {
                if (me._paramCount === data.DefaultValueCount && me._loadedForDefault)
                    me._submitForm(pageNum);
                else {
                    if (renderParamArea !== false)
                        me._trigger(events.render);
                    me.options.$reportViewer.removeLoadingIndicator();
                }
            } else {
                if (renderParamArea !== false)
                    me._trigger(events.render);
                me.options.$reportViewer.removeLoadingIndicator();
            }

            //jquery adds height, remove it
            var pc = me.element.find("." + paramContainerClass);
            pc.removeAttr("style");

            me._setDatePicker();
            $(document).off("click", me._checkExternalClick);
            $(document).on("click", { me: me }, me._checkExternalClick);


            $(":text", me.$params).each(
                function (index) {
                    var textinput = $(this);
                    textinput.on("blur", function () { me.options.$reportViewer.onInputBlur(); });
                    textinput.on("focus", function () { me.options.$reportViewer.onInputFocus(); });
                }
            );

            if (typeof (me._writeParamDoneCallback) === "function") {
                me._writeParamDoneCallback();
                me._writeParamDoneCallback = null;
            }
        },
        _addWriteParamDoneCallback: function (func) {
            if (typeof (func) !== "function") return;

            var me = this;
            var priorCallback = me._writeParamDoneCallback;

            if (priorCallback === null) {
                me._writeParamDoneCallback = func;
            } else {
                me._writeParamDoneCallback = function () {
                    priorCallback();
                    func();
                };
            }
        },

        _submittedParamsList: null,
        _elementWidthCheck: function () {
            var me = this;
            
            var containerWidth = me.options.$appContainer.width();
            var customRightPaneWidth = forerunner.config.getCustomSettingsValue("ParameterPaneWidth", 280);
            var parameterPaneWidth = customRightPaneWidth < containerWidth ? customRightPaneWidth : containerWidth;
            var elementWidth = parameterPaneWidth - 128;

            //180 is the default element width
            if (elementWidth > 180) {
                me.element.find(".fr-param-width").css({ "width": elementWidth });
                me.element.find(".fr-param-dropdown-input").css({ "width": elementWidth - 24 });
                me.element.find(".ui-autocomplete").css({ "min-width": elementWidth, "max-width": elementWidth });
            }
        },
        /**
         * Set parameters with specify parameter list
         *
         * @function $.forerunner.reportParameter#setsubmittedParamsList
         *
         * @param {String} paramList - Parameter value list
         */
        setsubmittedParamsList: function (paramList) {
            var me = this;
            me._submittedParamsList = paramList;
        },

        _submitForm: function (pageNum) {
            var me = this;
            me._closeAllDropdown();

            if (me._reportDesignError !== null) {
                forerunner.dialog.showMessageBox(me.options.$appContainer, me._reportDesignError);
                return;
            }

            var paramList = me.getParamsList();
            if (paramList) {
                me.options.$reportViewer.loadReportWithNewParameters(paramList, pageNum);
                me._submittedParamsList = paramList;
                me._trigger(events.submit);
            }
            me._hasPostedBackWithoutSubmitForm = false;
        },
        /**
         * Revert any unsubmitted parameters, called in two scenario:  when cancelling out from parameter area or 
         * before submitting an action when the set of parameters for the session does not match the loaded report.
         *
         * @function $.forerunner.reportParameter#revertParameters 
         */
        revertParameters: function () {
            var me = this;
            if (me.getParamsList(true) === me._submittedParamsList) {
                return;
            }
            if (me._submittedParamsList !== null) {
                me._revertLock = true;
                if (me._hasPostedBackWithoutSubmitForm) {
                    //refresh parameter on server side
                    me.refreshParameters(me._submittedParamsList, false);
                    me._hasPostedBackWithoutSubmitForm = false;
                    me.options.$reportViewer.invalidateReportContext();
                }

                //revert to prior submitted parameters
                var submittedParameters = JSON.parse(me._submittedParamsList);
                var list = submittedParameters.ParamsList;
                var $control;

                for (var i = 0; i < list.length; i++) {
                    var savedParam = list[i];
                    var paramDefinition = me._parameterDefinitions[savedParam.Parameter];

                    if (me._isDropdownTree && me.enableCascadingTree && (paramDefinition.isParent || paramDefinition.isChild)) {

                        var isTopParent = paramDefinition.isParent === true && paramDefinition.isChild !== true;
                        //Revert cascading tree status: display text, backend value, tree UI
                        me._setTreeItemStatus(paramDefinition, savedParam, isTopParent);
                        $control = me.element.find(".fr-paramname-" + paramDefinition.Name);
                        $control.attr("backendValue", JSON.stringify(savedParam.Value));
                        continue;
                    }

                    if (paramDefinition.MultiValue) {
                        if (paramDefinition.ValidValues !== "") {
                            $control = $(".fr-paramname-" + paramDefinition.Name + "-dropdown-cb", me.$params);
                            me._setCheckBoxes($control, savedParam.Value);
                            me._setMultipleInputValues(paramDefinition);
                        } else {
                            $control = $(".fr-paramname-" + paramDefinition.Name);
                            var $dropdownText = $(".fr-paramname-" + paramDefinition.Name + "-dropdown-textArea");
                            $dropdownText.val(me._getTextAreaValue(savedParam.Value, true));
                            $control.val(me._getTextAreaValue(savedParam.Value, false));
                            $control.attr("jsonValues", JSON.stringify(savedParam.Value));
                        }
                    } else {
                        $control = $(".fr-paramname-" + paramDefinition.Name, me.$params);
                        // Only non-multi-value parameters can be nullable.
                        if (paramDefinition.Nullable && savedParam.Value === null) {
                            var $cb = $(".fr-param-checkbox", me.$params).filter("[name*='" + paramDefinition.Name + "']").first();
                            if ($cb.length !== 0 && $cb.attr("checked") !== "checked")
                                $cb.trigger("click");
                        } else if (paramDefinition.ValidValues !== "") {
                            if (forerunner.device.isTouch() && paramDefinition.ValidValues.length <= forerunner.config.getCustomSettingsValue("MinItemToEnableBigDropdownOnTouch", 10)) {
                                me._setSelectedIndex($control, savedParam.Value);
                            }
                            else {
                                me._setBigDropDownIndex(paramDefinition, savedParam.Value, $control);
                            }
                        } else if (paramDefinition.Type === "Boolean") {
                            me._setRadioButton($control, savedParam.Value);
                        } else {
                            if ($control.attr("datatype").toLowerCase() === "datetime") {
                                $control.val(me._getDateTimeFromDefault(savedParam.Value));
                            }
                            else {
                                $control.val(savedParam.Value);
                            }
                        }
                    }
                }

                //set tree selected status after revert
                if (me._isDropdownTree && me.enableCascadingTree) {
                    me._closeCascadingTree(true);
                }

                me._revertLock = false;
            }
        },
        _cancelForm: function () {
            var me = this;
            me._closeAllDropdown();
            me.revertParameters();
            me.$form.valid();
            me._trigger(events.cancel, null, {});
        },
        _setDatePicker: function () {
            var me = this;

            var dpLoc = me._getDatePickerLoc();
            if (dpLoc)
                $.datepicker.setDefaults(dpLoc);

            $.each(me.element.find(".hasDatepicker"), function (index, datePicker) {
                $(datePicker).datepicker("option", "buttonImage", forerunner.config.forerunnerFolder() + "reportviewer/Images/calendar.png");
                $(datePicker).datepicker("option", "buttonImageOnly", true);
                $(datePicker).datepicker("option", "buttonText", me.options.$reportViewer.locData.paramPane.datePicker);
            });
        },
        _getPredefinedValue: function (param) {
            var me = this;
            if (me._hasDefaultValue(param)) {
                if (param.MultiValue === false)
                    return param.DefaultValues[0];
                else
                    return param.DefaultValues;
            }

            return null;
        },
        _writeParamControl: function (param, $parent, pageNum) {
            var me = this;
            var $label = new $("<div class='fr-param-label'>" + param.Prompt + "</div>");
            var bindingEnter = true;
            var predefinedValue = me._getPredefinedValue(param);
            //If the control have valid values, then generate a select control
            var $container = new $("<div class='fr-param-item-container'></div>");
            var $errorMsg = new $("<span class='fr-param-error-placeholder'/>");
            var $element = null;
            
            if (me._isDropdownTree && me.enableCascadingTree && me._parameterDefinitions[param.Name].isParent === true && me._parameterDefinitions[param.Name].isChild !== true) {
                //only apply tree view to dropdown type
                $element = me._writeCascadingTree(param, predefinedValue);
            }
            
            if (me._isDropdownTree && me.enableCascadingTree && me._parameterDefinitions[param.Name].isChild === true) {
                $element = me._writeCascadingChildren(param, predefinedValue);
                //if not want sub parameter show then add this class
                $parent.addClass("fr-param-tree-hidden");
            }

            if ($element === null) {
                var dependenceDisable = me._checkDependencies(param);
                //if any element disable exist then not submit form auto
                if (dependenceDisable) me._loadedForDefault = false;

                if (param.MultiValue === true) { // Allow multiple values in one textbox
                    if (param.ValidValues !== "") { // Dropdown with checkbox
                        $element = me._writeDropDownWithCheckBox(param, dependenceDisable, predefinedValue);
                    }
                    else {// Dropdown with editable textarea
                        bindingEnter = false;
                        $element = me._writeDropDownWithTextArea(param, dependenceDisable, predefinedValue);
                    }
                }
                else { // Only one value allowed

                    if (param.ValidValues !== "") { // Dropdown box
                        bindingEnter = false;
                        $element = forerunner.device.isTouch() && param.ValidValues.length <= forerunner.config.getCustomSettingsValue("MinItemToEnableBigDropdownOnTouch", 10) ?
                            me._writeDropDownControl(param, dependenceDisable, pageNum, predefinedValue) :
                            me._writeBigDropDown(param, dependenceDisable, pageNum, predefinedValue);
                    }
                    else if (param.Type === "Boolean") {
                        //Radio Button, RS will return MultiValue false even set it to true
                        $element = me._writeRadioButton(param, dependenceDisable, pageNum, predefinedValue);
                    }
                    else { // Textbox
                        $element = me._writeTextArea(param, dependenceDisable, pageNum, predefinedValue);
                    }
                }
            }


            if ($element !== undefined && bindingEnter) {
                $element.on("keydown", function (e) {
                    if (e.keyCode === 13) {
                        me._submitForm(pageNum);
                    } // Enter
                });
            }

            $container.append($element);
            //for cascading hidden elements, don't add null checkbox constraint
            //they are assist elements to generate parameter list
            if (!$parent.hasClass("fr-param-tree-hidden")) {
                if (!$element.find(".fr-param").hasClass("fr-param-required")) {
                    $container.append(me._addNullableCheckBox(param, $element, predefinedValue));
                }
                $container.append($errorMsg);
            }
                
            $parent.append($label).append($container);
            return $parent;
        },
        _getParameterControlProperty: function (param, $control) {
            var me = this;

            $control.attr("allowblank", param.AllowBlank);
            $control.attr("nullable", param.Nullable);
            if (param.QueryParameter || ((param.Nullable === false || !me._isNullChecked($control)) && param.AllowBlank === false)) {
                //For IE browser when set placeholder browser will trigger an input event if it's Chinese
                //to avoid conflict (like auto complete) with other widget not use placeholder to do it
                //Anyway IE native support placeholder property from IE10 on, so not big deal
                //Also, we are letting the devs style it.  So we have to make userNative: false for everybody now.
                $control.attr("required", "true").watermark(me.options.$reportViewer.locData.paramPane.required, { useNative: false, className: "fr-param-watermark" });
                $control.addClass("fr-param-required");
                me._parameterDefinitions[param.Name].ValidatorAttrs.push("required");
            } else if (param.MultiValue) {
                if (param.ValidValues || (!param.ValidValues && param.AllowBlank)) {
                    $control.attr("required", "true");
                    $control.addClass("fr-param-required");
                    me._parameterDefinitions[param.Name].ValidatorAttrs.push("required");
                }
            }
            $control.attr("ErrorMessage", param.ErrorMessage);
        },
        _addNullableCheckBox: function (param, $control, predefinedValue) {
            var me = this;
            if (param.Nullable === true) {
                $control = $control.hasClass("fr-param-element-container") ? $control.find(".fr-param") :
                    param.Type === "Boolean" ? $(".fr-paramname-" + param.Name, $control) : $control;

                var $nullableSpan = new $("<div class='fr-param-nullable' />");
                var $checkbox = new $("<Input type='checkbox' class='fr-param-checkbox' name='" + param.Name + "' />");

                $checkbox.on("click", function () {
                    if ($checkbox.attr("checked") === "checked") {
                        $checkbox.removeAttr("checked");
                        $control.removeAttr("disabled").removeClass("fr-param-disable");

                        //add validate arrtibutes to control when uncheck null checkbox
                        $.each(me._parameterDefinitions[param.Name].ValidatorAttrs, function (index, attribute) {
                            $control.attr(attribute, "true");
                        });

                        if (param.Type === "DateTime") {
                            $control.datepicker("enable");
                        }
                    }
                    else {
                        $checkbox.attr("checked", "true");
                        $control.attr("disabled", "true").addClass("fr-param-disable");

                        //remove validate arrtibutes
                        $.each(me._parameterDefinitions[param.Name].ValidatorAttrs, function (index, attribute) {
                            $control.removeAttr(attribute);
                        });

                        if (param.Type === "DateTime") {
                            //set delay to 100 since datepicker need time to generate image for the first time
                            setTimeout(function () { $control.datepicker("disable"); }, 100);
                        }
                    }
                });

                // Check it only if it is really null, not because nobody touched it
                if (predefinedValue === null && param.State !== "MissingValidValue") $checkbox.trigger("click");

                var $nullableLable = new $("<Label class='fr-param-label-null' />");
                $nullableLable.html(me.options.$reportViewer.locData.paramPane.nullField);

                $nullableSpan.append($checkbox).append($nullableLable);
                return $nullableSpan;
            }
            else
                return null;
        },
        _setRadioButton: function (s, v) {
            for (var i = 0; i < s.length; i++) {
                if (s[i].value === v) {
                    s[i].checked = true;
                } else {
                    s[i].checked = false;
                }
            }
        },
        _writeRadioButton: function (param, dependenceDisable, pageNum, predefinedValue) {
            var me = this;
            var paramPane = me.options.$reportViewer.locData.paramPane;
            var radioValues = [];
            radioValues[0] = { display: paramPane.isTrue, value: "True" };
            radioValues[1] = { display: paramPane.isFalse, value: "False" };

            var $control = me._createDiv(["fr-param-checkbox-container", "fr-param-width"]);
            $control.attr("ismultiple", param.MultiValue);
            $control.attr("datatype", param.Type);

            for (var i = 0; i < radioValues.length; i++) {
                var $radioItem = new $("<input type='radio' class='fr-param fr-param-radio fr-paramname-" + param.Name + "' name='" + param.Name + "' value='" + radioValues[i].value +
                    "' datatype='" + param.Type + "' />");
                if (dependenceDisable) {
                    $radioItem.attr("disabled", "true");
                }
                else {
                    me._getParameterControlProperty(param, $radioItem);

                    if (predefinedValue && predefinedValue === radioValues[i].value) {
                        $radioItem.attr("checked", "true");
                    }

                    $radioItem.on("click", function () {
                        if (me.getNumOfVisibleParameters() === 1) {
                            me._submitForm(pageNum);
                        }
                    });
                }
                var $label = new $("<label class='fr-param-radio-label'>" + radioValues[i].display + "</label>");

                $control.append($radioItem);
                $control.append($label);
            }

            return $control;
        },
        _writeTextArea: function (param, dependenceDisable, pageNum, predefinedValue) {
            var me = this;
            var $control = new $("<input class='fr-param fr-param-width fr-paramname-" + param.Name + "' name='" + param.Name + "' type='text' size='100' ismultiple='"
                + param.MultiValue + "' datatype='" + param.Type + "' />");

            if (dependenceDisable) {
                me._disabledSubSequenceControl($control);
                return $control;
            }

            me._getParameterControlProperty(param, $control);
            switch (param.Type) {
                case "DateTime":
                    $control.datepicker({
                        showOn: "button",
                        changeMonth: true,
                        changeYear: true,
                        showButtonPanel: true,
                        //gotoCurrent: true,
                        dateFormat: forerunner.ssr._internal.getDateFormat(),
                        onClose: function () {
                            $control.removeAttr("disabled");
                            $(".fr-paramname-" + param.Name, me.$params).valid();

                            if (me.getNumOfVisibleParameters() === 1)
                                me._submitForm(pageNum);
                        },
                        beforeShow: function () {
                            $control.attr("disabled", true);
                        },
                    });
                    $control.attr("formattedDate", "true");
                    me._parameterDefinitions[param.Name].ValidatorAttrs.push("formattedDate");

                    if (predefinedValue) {
                        $control.datepicker("setDate", me._getDateTimeFromDefault(predefinedValue));
                    }
                    break;
                case "Integer":
                case "Float":
                    $control.attr("number", "true");
                    me._parameterDefinitions[param.Name].ValidatorAttrs.push("number");

                    if (predefinedValue) {
                        $control.val(predefinedValue);
                    }
                    break;
                case "String":
                    if (predefinedValue) {
                        $control.val(predefinedValue);
                    }
                    break;
            }

            return $control;
        },
        _setSelectedIndex: function (s, v) {

            var options = s[0];
            for (var i = 0; i < options.length; i++) {
                if (options[i].value === v) {
                    options[i].selected = true;
                    return;
                }
            }

        },
        _setBigDropDownIndex: function(param, value, $control){
            for (var i = 0; i < param.ValidValues.length; i++) {
                if ((value && value === param.ValidValues[i].Value) || (!value && i === 0)) {
                    $control.val(param.ValidValues[i].Key).attr("backendValue", param.ValidValues[i].Value);
                }
            }

            if ($control.hasClass("fr-param-autocomplete-error")) {
                $control.removeClass("fr-param-autocomplete-error");
            }
        },
        _writeBigDropDown: function (param, dependenceDisable, pageNum, predefinedValue) {
            var me = this;
            var canLoad = false,
                isOpen = false,
                enterLock = false;

            var $container = me._createDiv(["fr-param-element-container", "fr-param-dropdown-div", "fr-param-width"]);
            var $control = me._createInput(param, "text", false, ["fr-param", "fr-param-dropdown-input", "fr-param-not-close", "fr-paramname-" + param.Name]);
            me._getParameterControlProperty(param, $control);
            //add auto complete selected item check
            $control.attr("autoCompleteDropdown", "true");
            me._parameterDefinitions[param.Name].ValidatorAttrs.push("autoCompleteDropdown");

            var $openDropDown = me._createDiv(["fr-param-dropdown-iconcontainer", "fr-core-cursorpointer"]);
            var $dropdownicon = me._createDiv(["fr-param-dropdown-icon", "fr-param-not-close"]);
            $openDropDown.append($dropdownicon);

            if (dependenceDisable) {
                me._disabledSubSequenceControl($control);
                $container.append($control).append($openDropDown);
                return $container;
            }

            $openDropDown.on("mousedown", function () {
                isOpen = $control.autocomplete("widget").is(":visible");
            });

            $openDropDown.on("click", function () {
                if ($control.attr("disabled"))
                    return;

                //only set focus to its textbox for no-touch device by default
                if (!forerunner.device.isTouch()) {
                    $control.focus();
                }

                if (isOpen) {
                    return;
                }

                me._closeAllDropdown();
                //pass an empty string to show all values
                //delay 50 milliseconds to remove the blur/mousedown conflict in old browsers
                setTimeout(function () { $control.autocomplete("search", ""); }, 50);
            });

            for (var i = 0; i < param.ValidValues.length; i++) {
                if ((predefinedValue && predefinedValue === param.ValidValues[i].Value)) {
                    $control.val(param.ValidValues[i].Key).attr("title", param.ValidValues[i].Key).attr("backendValue", param.ValidValues[i].Value);
                    canLoad = true;
                }

                param.ValidValues[i].label = param.ValidValues[i].Key;
                param.ValidValues[i].value = param.ValidValues[i].Value;
            }
            if (!canLoad && param.Nullable !== true) me._loadedForDefault = false;

            $control.autocomplete({
                source: param.ValidValues,
                minLength: 0,
                delay: 0,
                autoFocus: true,
                appendTo: me.$params,
                position: { of: $container },
                maxItem: forerunner.config.getCustomSettingsValue("MaxBigDropdownItem", 50),
                select: function (event, obj) {
                    $control.attr("backendValue", obj.item.value).attr("title", obj.item.label).val(obj.item.label).trigger("change", { item: obj.item.value });
                    enterLock = true;

                    if (me.getNumOfVisibleParameters() === 1) {
                        setTimeout(function () { me._submitForm(pageNum); }, 100);
                    }

                    return false;
                },
                focus: function (event, obj) {
                    return false;
                },
                response: function (event, obj) {
                    //obj.content.length will equal = 0 if no item match.
                    if (obj.content.length === 0) {
                        $control.addClass("fr-param-autocomplete-error");
                    }
                    else {
                        $control.removeClass("fr-param-autocomplete-error");
                    }
                },
                change: function (event, obj) {
                    if (!obj.item) {
                        //Invalid selection, remove prior select
                        $control.removeAttr("backendValue");
                        $control.addClass("fr-param-autocomplete-error");
                    }
                    else {
                        $control.removeClass("fr-param-autocomplete-error");
                    }

                    //if this control don't required, then empty is a valid value
                    if (!$control.attr("required") && $control.val() === "")
                        $control.removeClass("fr-param-autocomplete-error");

                    $control.valid();
                },
                close: function (event) {
                    //if user selected by mouse click then unlock enter
                    //close event will happend after select event so it safe here.
                    if (event.originalEvent && event.originalEvent.originalEvent.type === "click")
                        enterLock = false;
                }
            });

            $control.on("focus", function () {
                $(".ui-autocomplete", me.options.$appContainer).hide();
            });

            $control.on("change", function (event, obj) {
                // Keeps the rest of the handlers (get cascading parameter here) 
                //from being executed when input value is not valid.
                if (!obj && $control.val() !== "")
                    event.stopImmediatePropagation();
            });

            //auto complete widget bind a keydown hander when initialize an instance
            //I create instance first so our own handler will be execute later in the handler list
            //enterLock is our expect value
            $control.on("keydown", function (e) {
                if (e.keyCode === 13) {
                    if (enterLock) {
                        enterLock = false;
                        return;
                    }

                    me._submitForm(pageNum);
                }
            });

            $container.append($control).append($openDropDown);
            return $container;
        },
        _writeDropDownControl: function (param, dependenceDisable, pageNum, predefinedValue) {
            var me = this;
            var canLoad = false;
            var $control = new $("<select class='fr-param fr-param-select fr-param-width fr-paramname-" + param.Name + "' name='" + param.Name + "' ismultiple='" +
                param.MultiValue + "' datatype='" + param.Type + "' readonly='true'>");

            if (dependenceDisable) {
                me._disabledSubSequenceControl($control);
                return $control;
            }

            me._getParameterControlProperty(param, $control);
            var defaultSelect = me.options.$reportViewer.locData.paramPane.select;
            var $defaultOption = new $("<option title='" + defaultSelect + "' value=''>&#60" + defaultSelect + "&#62</option>");
            $control.append($defaultOption);

            for (var i = 0; i < param.ValidValues.length; i++) {
                var optionKey = forerunner.helper.htmlEncode(param.ValidValues[i].Key);
                var optionValue = param.ValidValues[i].Value;
                var $option = new $("<option title='" + optionKey + "' value='" + optionValue + "'>" + optionKey + "</option>");

                if ((predefinedValue && predefinedValue === optionValue)) {
                    $option.attr("selected", "true");
                    $control.attr("title", param.ValidValues[i].Key);
                    canLoad = true;
                }

                $control.append($option);
            }
            if (!canLoad) me._loadedForDefault = false;

            $control.on("change", function () {
                $control.attr("title", $(this).find("option:selected").text());

                if (me.getNumOfVisibleParameters() === 1) {
                    me._submitForm(pageNum);
                }
            });

            return $control;
        },
        _writeCascadingTree: function (param, predefinedValue) {
            var me = this;
            var nodeLevel = 1;

            var $container = me._createDiv(["fr-param-element-container", "fr-param-tree-container", "fr-param-dropdown-div", "fr-param-width"]);
            var $input = me._createInput(param, "text", false, ["fr-param-client", "fr-param-not-close", "fr-paramname-" + param.Name]);
            $input.attr("cascadingTree", true).attr("readonly", "readonly").addClass("fr-param-tree-input").addClass("fr-param-dropdown-input");
            me._getParameterControlProperty(param, $input);

            var $hidden = me._createInput(param, "hidden", false, ["fr-param", "fr-paramname-" + param.Name]);
            me._setTreeElementProperty(param, $hidden);
            me._setTreeDefaultValue(param, predefinedValue, $input, $hidden);

            var $treeContainer = me._createDiv(["fr-param-tree", "ui-corner-all", "fr-param-not-close"]);
            var $tree = me._getCascadingTree(param, nodeLevel);
            $treeContainer.append($tree);

            var $openDropDown = me._createDiv(["fr-param-dropdown-iconcontainer", "fr-core-cursorpointer"]);
            var $dropdownicon = me._createDiv(["fr-param-dropdown-icon", "fr-param-not-close"]);
            $openDropDown.append($dropdownicon);

            $input.on("click", function () { me._showTreePanel($treeContainer, $input); });
            $openDropDown.on("click", function () { me._showTreePanel($treeContainer, $input); });
            //generate default value after write parameter panel done
            me._addWriteParamDoneCallback(function () { me._setTreeSelectedValues($treeContainer); });

            $container.append($input).append($hidden).append($openDropDown).append($treeContainer);
            return $container;
        },
        _showTreePanel: function ($tree, $input) {
            var me = this;

            if ($tree.is(":visible")) {
                me._setTreeSelectedValues($tree);
                $tree.hide();
            }
            else {
                $input.removeClass("fr-param-cascadingtree-error").attr("cascadingTree", "");
                $tree.show();
                //Fixed issue 1056: jquery.ui.position will got an error in IE8 when the panel width change, 
                //so here I wrote code to got shop up position to popup tree panel
                var $parent = $input.parent();
                var left = forerunner.helper.parseCss($input, "marginLeft") + ($input.outerWidth() - $input.innerWidth()) / 2;
                var top = forerunner.helper.parseCss($input, "marginTop") + $parent.outerHeight();
                $tree.css({ "top": top, "left": left, "min-width": $parent.width() });
                //$tree.position({ my: "left top", at: "left bottom", of: $input });
                $input.blur();
            }
        },
        _writeCascadingChildren: function (param, predefinedValue) {
            var me = this;
            var $container = null, $hidden = null;

            $container = me._createDiv(["fr-param-element-container"]);
            
            $hidden = me._createInput(param, "hidden", false, ["fr-param", "fr-paramname-" + param.Name]);
            $hidden.val("#");
            me._setTreeElementProperty(param, $hidden);

            me._setTreeDefaultValue(param, predefinedValue, null, $hidden);
            
            $container.append($hidden);
            return $container;
        },
        _getCascadingTree: function (param, level) {
            var me = this;
            var $list = null;
            //for dropdown list or dropdown with checkbox
            if (!!param.ValidValues) {
                var predefinedValue = me._getPredefinedValue(param);
                var hasChild = !!me._dependencyList[param.Name];
                var length = param.ValidValues.length;

                $list = new $("<ul />");
                $list.attr("name", param.Name)
                    .attr("allowmultiple", param.MultiValue)
                    .attr("haschild", hasChild)
                    .attr("nullable", param.Nullable)
                    .attr("level", level)
                    .addClass("fr-param-tree-ul");

                if (param.isChild) {
                    $list.attr("parent", param.Dependencies.join());
                    $list.addClass("fr-param-tree-child");
                }
                
                for (var i = 0; i < length; i++) {
                    var isDefault = false;
                    if (predefinedValue) {
                        if (param.MultiValue) {
                            if (me._contains(predefinedValue, param.ValidValues[i].Value)) {
                                isDefault = true;
                            }
                        }
                        else {
                            if ((predefinedValue && predefinedValue === param.ValidValues[i].Value)) {
                                isDefault = true;
                            }
                        }
                    }
                    
                    var item = me._getCascadingTreeItem(param, param.ValidValues[i], hasChild, i === length - 1, isDefault, level);
                    $list.append(item);
                }
            }

            return $list;
        },
        _getCascadingTreeItem: function (param, value, hasChild, isLast, isDefault, level) {
            var me = this;
            var $li = new $("<li/>");
            $li.addClass("fr-param-tree-item").attr("value", value.Value);
            
            if (isLast) {
                $li.addClass("fr-param-tree-item-last");
            }

            var $icon = new $("<i/>");
            $icon.addClass("fr-param-tree-icon");
            $icon.addClass("fr-param-tree-ocl");

            //$icon will handle node expand/collapse work, if child node not loaded send XHR to load first
            $icon.on("click", function () {
                if ($li.hasClass("fr-param-tree-item-close")) {
                    // when it is from revert not load children if it not exist
                    if (me._revertLock === true) {
                        if ($li.children("ul").length !== 0) {
                            $li.children("ul").show();
                            $li.removeClass("fr-param-tree-item-close").addClass("fr-param-tree-item-open");
                        }
                        return;
                    }

                    me._setRuntimeTreeValues($li);
                    
                    if ($li.children("ul").length === 0) {
                        $li.addClass("fr-param-tree-loading");
                        me.refreshParameters(null, true);
                    }
                    else {
                        $li.children("ul").show();
                    }

                    if (param.MultiValue === false) {
                        //handle siblings, close opened siblings
                        var allSiblings = me.element.find(".fr-param-tree-container ul[level='" + level + "']").children("li.fr-param-tree-item-open");

                        $.each(allSiblings, function (index, sibling) {
                            $(sibling).children(".fr-param-tree-icon").trigger("click");
                        });
                    }

                    $li.removeClass("fr-param-tree-item-close").addClass("fr-param-tree-item-open");
                }
                else if ($li.hasClass("fr-param-tree-item-open")) {
                    if (param.MultiValue === false) {
                        //clean all selected children status for single select parameter
                        me._clearTreeItemStatus($li.children("ul"));
                    }
                    else {
                        if (me._revertLock === true) {
                            me._clearTreeItemStatus($li.children("ul"));
                        }
                        //just collapse children for multiple select parameter
                        $li.children("ul").hide();
                        $li.removeClass("fr-param-tree-item-open").addClass("fr-param-tree-item-close");
                    }
                }
            });

            var $checkbox = new $("<i/>");
            $checkbox.addClass("fr-param-tree-icon fr-param-tree-icon-cb");
            if (param.MultiValue === false) {
                $checkbox.addClass("fr-param-tree-icon-hidden");
            }

            var $themeicon = new $("<i/>");
            $themeicon.addClass("fr-param-tree-icon fr-param-tree-icon-theme");

            var $text = new $("<span/>");
            $text.addClass("fr-param-tree-item-text");
            $text.text(value.Key);

            var $anchor = new $("<a href=''/>");
            $anchor.addClass("fr-param-tree-anchor");
            $anchor.on("click", function (e) {
                //$anchor will handle node select/un-select action and update its parent/children status
                e.preventDefault();

                //remove all siblings selected status for single select parameter
                if (param.MultiValue === false) {
                    var siblings;
                    if (hasChild) {
                        siblings = me.element.find(".fr-param-tree-container ul[level='" + level + "']").children("li.fr-param-tree-item-open");
                        $.each(siblings, function (index, sibling) {
                            if ($li.attr("value") === $(sibling).attr("value")) {
                                return true;
                            }

                            $(sibling).children(".fr-param-tree-ocl").trigger("click");
                        });
                    }
                    else {
                        siblings = me.element.find(".fr-param-tree-container ul[level='" + level + "']").children("li.fr-param-tree-item-selected");
                        $.each(siblings, function (index, sibling) {
                            if ($li.attr("value") === $(sibling).attr("value")) {
                                return true;
                            }

                            $(sibling).children(".fr-param-tree-anchor").trigger("click");
                        });
                    }
                }

                var $ul = $li.children("ul");
                var allowMultiple = $ul.attr("allowmultiple") === "true";

                // un-select action -- remove all its children in all level
                if ($anchor.hasClass("fr-param-tree-anchor-selected")) {
                    if (hasChild) {
                        //if it not contain children then it is a children loading click
                        if ($ul.length !== 0 && $ul.is(":visible")) {
                            $anchor.removeClass("fr-param-tree-anchor-selected");
                            $li.removeClass("fr-param-tree-item-selected");

                            if (allowMultiple && $ul.children("li.fr-param-tree-item-selected").length === 0) {
                                $anchor.trigger("click");
                                return;
                            }

                            $ul.find(".fr-param-tree-item .fr-param-tree-anchor").removeClass("fr-param-tree-anchor-selected");
                            $ul.find(".fr-param-tree-item").removeClass("fr-param-tree-item-selected");
                        }
                    }
                    else {
                        $anchor.removeClass("fr-param-tree-anchor-selected");
                        $li.removeClass("fr-param-tree-item-selected");
                    }
                }
                else {// select action -- do select all only to its directly children
                    $li.addClass("fr-param-tree-item-selected");
                    $anchor.addClass("fr-param-tree-anchor-selected");

                    if (hasChild) {
                        //for multiple select children select all, for single select children do nothing
                        if (allowMultiple && $ul.is(":visible")) {
                            $ul.children("li").children(".fr-param-tree-anchor").addClass("fr-param-tree-anchor-selected");
                            $ul.children("li").addClass("fr-param-tree-item-selected");
                        }
                    }
                }
                
                //if this node has child, either children not loaded or collapsed it will open child instead of select all
                //in the same time clear all siblings selected status for single select parameter
                if (hasChild && ($ul.length === 0 || $ul.is(":visible") === false)) {
                    $icon.trigger("click");
                }

                me._setParentStatus($li);
            });

            $anchor.append($checkbox).append($themeicon).append($text);
            $li.append($icon).append($anchor);

            if (hasChild) {
                if (isDefault) {
                    level += 1;
                    var children = me._dependencyList[param.Name];

                    for (var i = 0; i < children.length; i++) {
                        var subParam = me._parameterDefinitions[children[i]];
                        var $childList = me._getCascadingTree(subParam, level);
                        
                        if ($childList) {
                            $li.append($childList);
                        }
                    }

                    level -= 1;
                    $li.addClass("fr-param-tree-item-open");
                }
                else {
                    $li.addClass("fr-param-tree-item-close");
                }
            }

            //trigger default click after write parameter panel done
            if (isDefault && !hasChild) {
                me._addWriteParamDoneCallback(function () { $anchor.trigger("click"); });
            }

            return $li;
        },
        _setParentStatus: function ($item) {
            var me = this;

            if ($item.parent().attr("parent")) {
                var $ul = $item.parent();
                var $parent = $ul.parent("li");
                var $parentAnchor = $parent.children(".fr-param-tree-anchor");

                if ($ul.find("li a").filter(".fr-param-tree-anchor-selected").length === 0) {//no selected
                    $parent.removeClass("fr-param-tree-item-selected");
                    $parentAnchor.removeClass("fr-param-tree-anchor-selected");
                }
                else {//all selected or part selected
                    $parent.addClass("fr-param-tree-item-selected");
                    $parentAnchor.addClass("fr-param-tree-anchor-selected");
                }
                
                //else if ($ul.find("li a").filter(".fr-param-tree-anchor-selected").length === $ul.find("li a").length) {//all selected
                //    $parent.addClass("fr-param-tree-item-selected");
                //    $parentAnchor.removeClass("fr-param-tree-anchor-udm").addClass("fr-param-tree-anchor-selected");
                //}
                //else {//part selected
                //    $parent.addClass("fr-param-tree-item-selected");
                //    if ($parent.parent("ul").attr("allowmultiple").toLowerCase() === "true") {
                //        $parentAnchor.removeClass("fr-param-tree-anchor-selected").addClass("fr-param-tree-anchor-udm");
                //    }
                //    else {
                //        $parentAnchor.addClass("fr-param-tree-anchor-selected");
                //    }
                //}

                me._setParentStatus($parent);
            }
        },
        _setRuntimeTreeValues: function($item){
            var me = this;

            var $ul = $item.parent();
            var parentName = $ul.attr("name");
            var $param = me.element.find(".fr-paramname-" + parentName);
            //set single selected item as backend value to load data dynamically
            if ($ul.attr("allowmultiple") === "true") {
                $param.filter(".fr-param").val("#").attr("backendValue", "[\"" + $item.attr("value") + "\"]");
            }
            else {
                $param.filter(".fr-param").val("#").attr("backendValue", $item.attr("value"));
            }

            if ($ul.attr("parent")) {
                me._setRuntimeTreeValues($ul.parent("li"));
            }
        },
        _setTreeSelectedValues: function ($tree) {
            var me = this;
            var param = null,
                $targetElement = null,
                displayText = null,
                backendValue = null,
                temp = null,
                isValid = true,
                invalidList = null;
                var $parent = $tree.siblings(".fr-param-tree-input");

                $parent.removeClass("fr-param-cascadingtree-error").attr("cascadingTree", "");

            for (var i in me._parameterDefinitions) {
                if (me._parameterDefinitions.hasOwnProperty(i)) {
                    param = me._parameterDefinitions[i];

                    //set backend value
                    if (param.isParent || param.isChild) {
                        $targetElement = me.element.find(".fr-paramname-" + param.Name);
                        backendValue = "";

                        if (param.MultiValue) {
                            temp = [];

                            $.each($tree.find("ul[name=" + param.Name + "] > li.fr-param-tree-item-selected"), function (index, li) {
                                temp.push($(li).attr("value"));
                            });

                            if (temp.length) {
                                backendValue = JSON.stringify(temp);
                            }
                        }
                        else {
                            var $selected = $tree.find("ul[name=" + param.Name + "] > li.fr-param-tree-item-selected");
                            temp = $selected.attr("value");
                            if (temp) {
                                backendValue = temp;
                            }
                        }

                        //if target parameter is required and backend value is empty, then it's not valid
                        if ($targetElement.hasClass("fr-param-required") && !!backendValue === false) {
                            invalidList = invalidList || [];
                            invalidList.push(param.Prompt);
                            isValid = false;
                        }
                        $targetElement.filter(".fr-param").attr("backendValue", backendValue);

                        //set display text only for top parameter
                        if (param.isParent && !param.isChild) {
                            displayText = me._getTreeDisplayText($tree);
                            if (displayText) {
                                $targetElement.val(displayText);
                            }
                            else {
                                $targetElement.val("");
                            }
                        }
                    }
                }
            }

            if (isValid === false) {
                if (invalidList.length) {
                    $parent.attr("cascadingTree", "[" + invalidList.join() + "]");
                }
                $parent.addClass("fr-param-cascadingtree-error");
            }

            $parent.blur();
        },
        _getTreeDisplayText: function ($container) {
            var me = this;
            var $ul = $container.children("ul");

            if ($ul.length === 0)// length === 0 mean it don't have children, stop the recurrence by return empty string
                return "";

            var text = null, displayText = [];
            var hasChild = $ul.attr("haschild").toLowerCase() === "true" ? true : false;

            $.each($ul.children("li.fr-param-tree-item-selected"), function (index, li) {
                text = $(li).children("a").text();
                if (hasChild) {
                    text += me._getTreeDisplayText($(li));
                }
                displayText.push(text);
            });

            if ($ul.hasClass("fr-param-tree-child")) {
                return "(" + displayText.join() + ")";
            }
            else {
                return displayText.join(", ");
            }
        },
        _setTreeDefaultValue: function (param, predefinedValue, $input, $hidden) {
            var me = this;
            var valids = param.ValidValues;
            if (predefinedValue) {
                if (param.MultiValue) {
                    var keys = [];
                    for (var i = 0; i < valids.length; i++) {
                        if (me._contains(predefinedValue, valids[i].Value)) {
                            keys.push(valids[i].Key);
                        }
                    }
                    if (keys.length) {
                        if ($input) { $input.val(keys.join()); } //set display text
                        $hidden.attr("backendValue", JSON.stringify(predefinedValue)); //set backend value
                    }
                }
                else {
                    for (var i = 0; i < valids.length; i++) {
                        if ((predefinedValue && predefinedValue === valids[i].Value)) {
                            if ($input) { $input.val(valids[i].Key); } //set display text
                            $hidden.attr("backendValue", valids[i].Value); //set backend value
                            break;
                        }
                    }
                }
            }
        },
        //set each tree item status by specify parameter value
        _setTreeItemStatus:  function (param, defaultParam, isTopParent) {
            var me = this;
            var $parent = me.element.find(".fr-param-tree ul[name='" + param.Name + "']");
            if (isTopParent) {
                //clear current tree status
                $parent.children("li.fr-param-tree-item-open").children(".fr-param-tree-ocl").trigger("click");
            }

            //reset tree select status
            var $li = $parent.children("li");
            $.each($li, function (index, item) {
                if (param.MultiValue) {
                    if (me._contains(defaultParam.Value, $(item).attr("value"))) {
                        $(item).children(".fr-param-tree-anchor").trigger("click");
                    }
                }
                else {
                    if ($(item).attr("value") === defaultParam.Value) {
                        $(item).children(".fr-param-tree-anchor").trigger("click");
                    }
                }
            });
        },
        _clearTreeItemStatus: function ($parent) {
            //do recursive to removed selected node under specify parent
            var me = this;
            var hasChild = $parent.attr("haschild") === "true";
            if (hasChild) {
                var $children = $parent.children("li.fr-param-tree-item-open").children("ul");
                $.each($children, function (index, child) {
                    me._clearTreeItemStatus($(child));
                });
            }
            
            $parent.children("li.fr-param-tree-item-selected").children(".fr-param-tree-anchor").removeClass("fr-param-tree-anchor-selected");
            $parent.children("li.fr-param-tree-item-selected").removeClass("fr-param-tree-item-selected");
            
            $parent.hide();
            $parent.parent("li").children(".fr-param-tree-anchor").removeClass("fr-param-tree-anchor-selected");
            $parent.parent("li").removeClass("fr-param-tree-item-selected").removeClass("fr-param-tree-item-open").addClass("fr-param-tree-item-close");
        },
        _closeCascadingTree: function (skipVisibleCheck) {
            var me = this;
            var $trees = me.element.find(".fr-param-tree");

            $.each($trees, function (index, tree) {
                var $tree = $(tree);
                if (skipVisibleCheck || $tree.is(":visible")) {
                    me._setTreeSelectedValues($tree);
                    $tree.hide();
                }
            });
        },
        _setTreeElementProperty: function (param, $control) {
            var me = this;

            $control.attr("treeInput", "");
            $control.attr("backendValue", "");
            $control.attr("allowblank", param.AllowBlank);
            $control.attr("nullable", param.Nullable);
            $control.addClass("fr-param-tree-hidden-input");

            if (param.QueryParameter || (param.Nullable === false && param.AllowBlank === false)) {
                $control.attr("required");
                $control.addClass("fr-param-required");
            }
        },
        _createInput: function (param, type, readonly, listOfClasses) {
            var $input = new $("<Input />");
            $input.attr("type", type);
            $input.attr("name", param.Name);
            $input.attr("ismultiple", param.MultiValue);
            $input.attr("datatype", param.Type);
            if (readonly) {
                $input.attr("readonly", true);
            }
            for (var i = 0; i < listOfClasses.length; i++) {
                $input.addClass(listOfClasses[i]);
            }
            return $input;
        },
        _createDiv: function (listOfClasses) {
            var $div = new $("<div />");
            for (var i = 0; i < listOfClasses.length; i++) {
                $div.addClass(listOfClasses[i]);
            }
            return $div;
        },
        _createLabel: function (listOfClasses) {
            var $label = new $("<label />");
            for (var i = 0; i < listOfClasses.length; i++) {
                $label.addClass(listOfClasses[i]);
            }
            return $label;
        },
        _writeDropDownWithCheckBox: function (param, dependenceDisable, predefinedValue) {
            var me = this;
            var $control = me._createDiv(["fr-param-element-container", "fr-param-dropdown-div", "fr-param-width"]);

            var $multipleCheckBox = me._createInput(param, "text", true, ["fr-param-client", "fr-param-dropdown-input", "fr-param-not-close", "fr-paramname-" + param.Name]);

            var $openDropDown = me._createDiv(["fr-param-dropdown-iconcontainer", "fr-core-cursorpointer"]);
            var $dropdownicon = me._createDiv(["fr-param-dropdown-icon", "fr-param-not-close"]);
            $openDropDown.append($dropdownicon);

            if (dependenceDisable) {
                me._disabledSubSequenceControl($multipleCheckBox);
                $control.append($multipleCheckBox).append($openDropDown);
                return $control;
            }

            me._getParameterControlProperty(param, $multipleCheckBox);
            var $hiddenCheckBox = me._createInput(param, "hidden", false, ["fr-param", "fr-paramname-" + param.Name]);

            $openDropDown.on("click", function () { me._popupDropDownPanel(param); });
            $multipleCheckBox.on("click", function () { me._popupDropDownPanel(param); });

            var $dropDownContainer = me._createDiv(["fr-param-dropdown", "fr-param-not-close", "fr-paramname-" + param.Name + "-dropdown-container"]);
            $dropDownContainer.attr("value", param.Name);

            var $table = me._getDefaultHTMLTable();
            if (param.ValidValues.length && param.ValidValues[param.ValidValues.length - 1].Key !== "Select All")
                param.ValidValues.push({ Key: "Select All", Value: "Select All" });

            var keys = "";
            var values = "";
            for (var i = 0; i < param.ValidValues.length; i++) {
                var key;
                var value;
                if (i === 0) {
                    var SelectAll = param.ValidValues[param.ValidValues.length - 1];
                    key = SelectAll.Key;
                    value = SelectAll.Value;
                }
                else {
                    key = param.ValidValues[i - 1].Key;
                    value = param.ValidValues[i - 1].Value;
                }

                var $row = new $("<TR />");
                var $col = new $("<TD/>");

                var $span = new $("<Span />");
                var $checkbox = me._createInput(param, "checkbox", false, ["fr-param-dropdown-checkbox", "fr-paramname-" + param.Name + "-dropdown-cb"]);
                $checkbox.attr("value", value);

                if (predefinedValue && me._contains(predefinedValue, value)) {
                    $checkbox.attr("checked", "true");
                    keys += key + ",";
                    values += value + ",";
                }

                $checkbox.on("click", function () {
                    if (this.value === "Select All") {
                        if (this.checked === true) {
                            $(".fr-paramname-" + param.Name + "-dropdown-cb", me.$params).each(function () {
                                this.checked = true;
                            });
                        }
                        if (this.checked === false) {
                            $(".fr-paramname-" + param.Name + "-dropdown-cb", me.$params).each(function () {
                                this.checked = false;
                            });
                        }
                    }
                });

                var $label = me._createLabel(["fr-param-dropdown-label", "fr-paramname-" + param.Name + "-dropdown-" + i.toString() + "-label"]);
                $label.attr("for", param.Name + "_DropDown_" + i.toString());
                $label.attr("value", value);

                $label.text(key);

                $span.append($checkbox).append($label);
                $col.append($span);
                $row.append($col);
                $table.append($row);
            }
            $dropDownContainer.append($table);

            if (predefinedValue) {
                $multipleCheckBox.val(keys.substr(0, keys.length - 1));
                $hiddenCheckBox.val(JSON.stringify(predefinedValue));
            }

            $control.append($multipleCheckBox).append($hiddenCheckBox).append($openDropDown).append($dropDownContainer);

            return $control;
        },
        _writeDropDownWithTextArea: function (param, dependenceDisable, predefinedValue) {
            var me = this;
            //me._getTextAreaValue(predefinedValue);
            var $control = me._createDiv(["fr-param-element-container", "fr-param-dropdown-div", "fr-param-width"]);

            var $multipleTextArea = me._createInput(param, "text", true, ["fr-param", "fr-param-dropdown-input", "fr-param-not-close", "fr-paramname-" + param.Name]);
            var $openDropDown = me._createDiv(["fr-param-dropdown-iconcontainer", "fr-core-cursorpointer"]);
            var $dropdownicon = me._createDiv(["fr-param-dropdown-icon", "fr-param-not-close"]);
            $openDropDown.append($dropdownicon);

            if (dependenceDisable) {
                me._disabledSubSequenceControl($multipleTextArea);
                $control.append($multipleTextArea).append($openDropDown);
                return $control;
            }
            me._getParameterControlProperty(param, $multipleTextArea);
            $multipleTextArea.on("click", function () { me._popupDropDownPanel(param); });
            $openDropDown.on("click", function () { me._popupDropDownPanel(param); });

            var $dropDownContainer = me._createDiv(["fr-param-dropdown", "fr-param-not-close", "fr-paramname-" + param.Name + "-dropdown-container"]);
            $dropDownContainer.attr("value", param.Name);

            var $textarea = new $("<textarea class='fr-param-dropdown-textarea fr-paramname-" + param.Name + "-dropdown-textArea' />");

            if (predefinedValue) {
                $textarea.val(me._getTextAreaValue(predefinedValue, true));
                $multipleTextArea.val(me._getTextAreaValue(predefinedValue, false)).attr("title", me._getTextAreaValue(predefinedValue, false));
                $multipleTextArea.attr("jsonValues", JSON.stringify(predefinedValue));
            }

            $dropDownContainer.append($textarea);
            $control.append($multipleTextArea).append($openDropDown).append($dropDownContainer);
            return $control;
        },
        _getTextAreaValue: function (predifinedValue, forArea) {
            var result = "";
            if (forArea) {
                for (var i = 0; i < predifinedValue.length; i++) {
                    result += predifinedValue[i] + "\n";
                }
                result = result.substr(0, result.length - 1);
            }
            else {
                for (var j = 0; j < predifinedValue.length; j++) {
                    result += predifinedValue[j] + ",";
                }
                result = result.substr(0, result.length - 1);
            }
            return result;
        },
        _setCheckBoxes: function (s, valueList) {
            for (var i = 0; i < s.length; i++) {
                if ($.inArray(s[i].value, valueList) >= 0) {
                    s[i].checked = true;
                } else {
                    s[i].checked = false;
                }
            }
        },
        _setMultipleInputValues: function (param) {
            var me = this;
            var newValue, oldValue;
            //var target = $(".fr-paramname-" + param.Name, me.$params).filter(":visible");
            var target = $(".fr-paramname-" + param.Name, me.$params);
            oldValue = target.val();

            if (target.hasClass("fr-param-client")) {
                var showValue = "";
                var hiddenValue = [];

                $(".fr-paramname-" + param.Name + "-dropdown-cb", me.$params).each(function (index) {
                    if (this.checked && this.value !== "Select All") {
                        showValue += $(".fr-paramname-" + param.Name + "-dropdown-" + index.toString() + "-label", me.$params).text() + ",";
                        hiddenValue.push(this.value);
                    }
                });

                newValue = showValue.substr(0, showValue.length - 1);
                $(".fr-paramname-" + param.Name, me.$params).val(newValue).attr("title", newValue);
                $(".fr-paramname-" + param.Name, me.$params).filter(".fr-param").val(JSON.stringify(hiddenValue));
            }
            else {
                newValue = $(".fr-paramname-" + param.Name + "-dropdown-textArea", me.$params).val();
                var listOfValues = newValue.split("\n");
                newValue = newValue.replace(/\n+/g, ",");

                if (newValue.charAt(newValue.length - 1) === ",") {
                    newValue = newValue.substr(0, newValue.length - 1);
                }
                target.val(newValue).attr("title", newValue);
                target.attr("jsonValues", JSON.stringify(listOfValues));
            }

            if (oldValue !== newValue)
                target.change();
        },
        _popupDropDownPanel: function (param) {
            var me = this;
            var isVisible = $(".fr-paramname-" + param.Name + "-dropdown-container", me.$params).is(":visible");
            me._closeAllDropdown();

            if (!isVisible) {
                var $container = me.$params;
                var $dropDown = $(".fr-paramname-" + param.Name + "-dropdown-container", me.$params);
                var $multipleControl = $(".fr-paramname-" + param.Name, me.$params);
                var positionTop = $multipleControl.offset().top;

                $multipleControl.parent().css("z-index", 1);

                if ($container.height() - positionTop - $multipleControl.height() < $dropDown.height()) {
                    //popup at above
                    $dropDown.css("top", ($dropDown.height() + 10) * -1);
                }
                else {//popup at bottom, 9 is margin + padding + border
                    $dropDown.css("top", $multipleControl.height() + 9);
                }

                if ($dropDown.is(":hidden")) {
                    $dropDown.width($multipleControl.width() + 20).addClass("fr-param-dropdown-show").show(10);
                }
                else {
                    me._closeDropDownPanel(param);
                }
            }
        },
        _closeDropDownPanel: function (param) {
            var me = this;
            me._setMultipleInputValues(param);
            $(".fr-paramname-" + param.Name + "-dropdown-container", me.$params).removeClass("fr-param-dropdown-show").hide();

            //for dropdown textbox do focus->blur->focus to re-validate, also reset its parent container's z-index property
            $(".fr-paramname-" + param.Name, me.$params).focus().blur().parent().css("z-index", "inherit");
        },
        _closeAllDropdown: function () {
            var me = this;
            $(".fr-param-dropdown-show", me.$params).filter(":visible").each(function (index, param) {
                me._closeDropDownPanel({ Name: $(param).attr("value") });
            });
            //close auto complete dropdown, it will be appended to the body so use $appContainer here to do select
            $(".ui-autocomplete", me.options.$appContainer).hide();
            //close cascading tree and set value
            me._closeCascadingTree(false);
        },
        _checkExternalClick: function (e) {
            var me = e.data.me;

            if (!forerunner.helper.containElement(e.target, ["fr-param-not-close"])) {
                me._closeAllDropdown();
            }
        },
        _shouldInclude: function (param, noValid) {
            if (!noValid) return true;
            var me = this;

            var isString = $(param).attr("datatype") === "String";
            var allowBlank = $(param).attr("allowblank") === "true";

            // If it is a string type
            if (isString && allowBlank) return true;

            if (param.value === "") {
                return me._isNullChecked(param);
            }

            var required = !!$(param).attr("required");
            if (required && param.value === me.options.$reportViewer.locData.paramPane.required) {
                return false;
            }

            return true;
        },
        /**
         * Generate parameter value list into string and return
         *
         * @function $.forerunner.reportParameter#getParamsList
         *
         * @param {Boolean} noValid - if not need valid form set noValid = true
         *
         * @return {String} - parameter value list
         */
        getParamsList: function (noValid) {
            var me = this;
            var i;

            //for all get request that need validate, close all dropdown panel to get latest value first
            if (!noValid) {
                me._closeAllDropdown();
            }
            
            if (noValid || (me.$form.length !== 0 && me.$form.valid() === true)) {
                var a = [];
                //Text
                $(".fr-param", me.$params).filter(":text").each(function () {
                    if (me._shouldInclude(this, noValid)) {
                        if ($(this).attr("ismultiple") === "false") {
                            a.push({ Parameter: this.name, IsMultiple: $(this).attr("ismultiple"), Type: $(this).attr("datatype"), Value: me._isParamNullable(this) });
                        } else {
                            var jsonValues = $(this).attr("jsonValues");
                            a.push({ Parameter: this.name, IsMultiple: $(this).attr("ismultiple"), Type: $(this).attr("datatype"), Value: JSON.parse(jsonValues ? jsonValues : null) });
                        }
                    }
                });
                //Hidden
                $(".fr-param", me.$params).filter("[type='hidden']").each(function () {
                    if (me._shouldInclude(this, noValid)) {
                        if ($(this).attr("ismultiple") === "false") {
                            a.push({ Parameter: this.name, IsMultiple: $(this).attr("ismultiple"), Type: $(this).attr("datatype"), Value: me._isParamNullable(this) });
                        } else {
                            var value = me._isParamNullable(this);
                            a.push({ Parameter: this.name, IsMultiple: $(this).attr("ismultiple"), Type: $(this).attr("datatype"), Value: JSON.parse(value ? value : null) });
                        }
                    }
                });
                //dropdown
                $(".fr-param", me.$params).filter("select").each(function () {
                    var shouldInclude = this.value !== null && this.value !== "" && me._shouldInclude(this, noValid);
                    if (shouldInclude)
                        a.push({ Parameter: this.name, IsMultiple: $(this).attr("ismultiple"), Type: $(this).attr("datatype"), Value: me._isParamNullable(this) });
                });
                var radioList = {};
                //radio-group by radio name, default value: null
                $(".fr-param", me.$params).filter(":radio").each(function () {
                    if (!(this.name in radioList)) {
                        if (!noValid || me._isNullChecked(this)) {
                            radioList[this.name] = null;
                        }
                    }
                    if (this.checked === true) {
                        radioList[this.name] = me._isParamNullable(this);
                    }
                });
                for (var radioName in radioList) {
                    a.push({ Parameter: radioName, IsMultiple: "", Type: "Boolean", Value: radioList[radioName] });
                }
                //combobox - multiple values
                //var tempCb = "";
                //$(".fr-param", me.$params).filter(":checkbox").filter(":checked").each(function () {
                //    if (tempCb.indexOf(this.name) === -1) {
                //        tempCb += this.name + ",";
                //    }
                //});
                //if (tempCb !== "") {
                //    var cbArray = tempCb.split(",");
                //    var cbName = "";
                //    var cbValue = "";
                //    for (i = 0; i < cbArray.length - 1; i++) {
                //        cbName = cbArray[i];
                //        var $target = $("input[name='" + cbArray[i] + "']:checked", me.$params);
                //        var cbValueLength = $target.length;

                //        $target.each(function (i) {
                //            if (i === cbValueLength - 1)
                //                cbValue += this.value;
                //            else
                //                cbValue += this.value + ",";

                //        });
                //        a.push({ name: cbName, ismultiple: $(this).attr("ismultiple"), type: $(this).attr("datatype"), value: cbValue });
                //    }
                //}

                //Combined to JSON String, format as below
                //var parameterList = '{ "ParamsList": [{ "Parameter": "CategoryID","IsMultiple":"True", "Value":"'+ $("#CategoryID").val()+'" }] }';

                var paramsObject = { "ParamsList": a };
                return JSON.stringify(paramsObject);
            } else {
                return null;
            }
        },
        _isNullChecked: function (param) {
            var $cb = $(".fr-param-checkbox", this.$params).filter("[name*='" + param.name + "']").first();
            return $cb.length !== 0 && $cb.attr("checked") === "checked";
        },
        _isParamNullable: function (param) {
            var me = this;
            var $param = $(".fr-paramname-" + param.name, this.$params).filter(".fr-param");

            //check nullable
            if (me._isNullChecked(param)) {
                return null;
            } else if ($param.hasClass("fr-param-tree-hidden-input")) {
                if ($param.attr("backendValue") === "" && $param.attr("nullable") === "true") {
                    return null;
                }
                return $param.attr("backendValue");                
            } else if ($param.attr("allowblank") === "true" && $param.val() === "") {
                //check allow blank
                return "";
            } else if (forerunner.helper.hasAttr($param, "backendValue")) {
                //Take care of the big dropdown list
                return $param.attr("backendValue");
            } else if ($param.attr("datatype").toLowerCase() === "datetime") {
                var m = moment($param.val(), forerunner.ssr._internal.getMomentDateFormat(), true);

                //hard code a sql server accept date format here to parse all culture
                //date format to it. It's ISO 8601 format below 
                return m.format("YYYY-MM-DD");
            }
            else if ($param.attr("datatype").toLowerCase() === "boolean") {
                return $param.filter(":checked").val();
            }
            else {
                //Otherwise handle the case where the parameter has not been touched
                return $param.val() !== "" ? $param.val() : null;
            }
        },
        _hasValidValues: function (param) {
            var result = true;
            if (param.ValidValues === "" && param.ValidValuesQueryBased === false) {
                result = false;
            }
            return result;
        },
        /**
        * Remove all parameters from report
        *
        * @function $.forerunner.reportParameter#removeParameter
        */
        removeParameter: function () {
            var me = this;
            me._formInit = false;
            me.$params = null;
            $("." + paramContainerClass, me.element).detach();
            me._parameterDefinitions = {};
        },
        _getDefaultHTMLTable: function () {
            var $newObj = $("<Table cellspacing='0' cellpadding='0'/>");
            return $newObj;
        },
        _contains: function (array, keyword) {
            var i = array.length;
            while (i--) {
                if (array[i] === keyword)
                    return true;
            }
            return false;
        },
        _hasDefaultValue: function (param) {
            var me = this;
            return me._defaultValueExist && $.isArray(param.DefaultValues);//&& param.DefaultValues[0];
        },
        _getDateTimeFromDefault: function (defaultDatetime) {
            if (!defaultDatetime) {
                return null;
            }

            var m = moment(defaultDatetime);
            return m.isValid() ? m.format(forerunner.ssr._internal.getMomentDateFormat()) : null;
        },
        _checkDependencies: function (param) {
            var me = this;
            var disabled = false;

            if ($.isArray(param.Dependencies) && param.Dependencies.length) {
                $.each(param.Dependencies, function (index, dependence) {
                    var $targetElement = $(".fr-paramname-" + dependence, me.$params);
                    $targetElement.on("change", function () { me.refreshParameters(null, true); });
                });
            }

            if (param.State === "HasOutstandingDependencies") disabled = true;

            return disabled;
        },
        _dataPreprocess: function (parametersList) {
            var me = this;

            $.each(parametersList, function (index, param) {
                me._parameterDefinitions[param.Name] = param;
                me._parameterDefinitions[param.Name].ValidatorAttrs = [];

                if ($.isArray(param.Dependencies) && param.Dependencies.length) {
                    me._dependencyList = me._dependencyList || {};
                    me._parameterDefinitions[param.Name].isChild = true;

                    if (me._hasValidValues(me._parameterDefinitions[param.Name]) === false) {
                        me._isDropdownTree = false;
                    }

                    $.each(param.Dependencies, function (index, dependence) {
                        me._parameterDefinitions[dependence].isParent = true;
                        //now we only support cascading tree to dropdown type, if either parent or children don't have validvalues
                        //then we don't apply tree to the element
                        if (me._hasValidValues(me._parameterDefinitions[dependence]) === false) {
                            me._isDropdownTree = false;
                        }

                        //Add dependency relationship, format: _dependencyList: { parent1: [childname1, childname2], ... }
                        if (!me._dependencyList[dependence]) {
                            me._dependencyList[dependence] = [];
                        }

                        if (!me._contains(me._dependencyList[dependence], param.Name)) {
                            me._dependencyList[dependence].push(param.Name);
                        }
                    });
                }
            });
        },
        /**
        * Ask viewer to refresh parameter, but not automatically post back if all parameters are satisfied
        *
        * @function $.forerunner.reportParameter#refreshParameters
        *
        * @param {String} savedParams - Saved parameter value list
        */
        refreshParameters: function (savedParams, isCascading) {
            var me = this;
            //set false not to do form validate.

            var paramList = savedParams ? savedParams : me.getParamsList(true);
            if (paramList) {
                // Ask viewer to refresh parameter, but not automatically post back
                // if all parameters are satisfied.
                me.options.$reportViewer.refreshParameters(paramList, false, -1, false, isCascading);
            }
        },
        _disabledSubSequenceControl: function ($control) {
            $control.attr("disabled", true).addClass("fr-param-disable");
        },
        _checkHiddenParam: function (param) {
            var me = this;
            //if (param.QueryParameter) {
            //when no default value exist, it will set it as the first valid value
            //if no valid value exist, will popup error.
            if (!me._hasDefaultValue(param)) {
                // Do not error here because the parameter can be an internal parameter.
                //console.log(param.Name + " does not have a default value.");
            }
            //}
        },
        _getDatePickerLoc: function () {
            var me = this;
            return me.options.$reportViewer.locData.datepicker;
        },
        destroy: function () {
            var me = this;

            $(document).off("click", me._checkExternalClick);
        }
    });  // $.widget
});
///#source 1 1 /Forerunner/ReportViewer/js/ReportDocumentMap.js
/**
 * @file Contains the document map widget.
 *
 */

// Assign or create the single globally scoped variable
var forerunner = forerunner || {};

// Forerunner SQL Server Reports
forerunner.ssr = forerunner.ssr || {};

$(function () {
    var widgets = forerunner.ssr.constants.widgets;

    /**
     * Widget used to show report documenet map
     *
     * @namespace $.forerunner.reportDocumentMap
     * @prop {Object} options - The options for document map
     * @prop {Object} options.$reportViewer - The report viewer widget     
     * @example
     *   $("#docMap").reportDocumentMap({ 
     *      $reportViewer: $viewer 
     *   });   
     */
    $.widget(widgets.getFullname(widgets.reportDocumentMap), {
        options: {
            $reportViewer: null,
        },
        _create: function () {
        },
        _init: function () {

        },
        /**
        * Write document map layout with passed data
        *
        * @function $.forerunner.reportDocumentMap#write
        * 
        * @param {Object} docMapData - Document map data returned from server
        */
        write: function (docMapData) {
            var me = this;
            this.element.html("");

            var $docMapPanel = new $("<div class='fr-docmap-panel fr-docmap-panel-layout fr-core-widget'/>");
            $docMapPanel.append(me._writeDocumentMapItem(docMapData.DocumentMap, 0));
            me.element.append($docMapPanel);
        },

        _writeDocumentMapItem: function (docMap, level) {
            var me = this;
            var $docMap = new $("<div />");
            if (level !== 0)
                $docMap.css("margin-left", "34px");

            var $mapNode = new $("<div />");
            $mapNode.addClass("fr-docmap-item").attr("title", "Navigate to " + docMap.Label).html(docMap.Label);
            $mapNode.on("click", { UniqueName: docMap.UniqueName }, function (e) {
                me.options.$reportViewer.navigateDocumentMap(e.data.UniqueName);
            });

            if (docMap.Children) {
                var $header = new $("<DIV />");
                $header.addClass("fr-docmap-parent-container");
                me._setFocus($header);

                var $rightImage = new $("<div class='fr-docmap-icon'/>");

                if (level === 0)
                    $rightImage.addClass("fr-docmap-icon-up");
                else
                    $rightImage.addClass("fr-docmap-icon-down");

                $rightImage.on("click", function () {
                    var childPanel = $docMap.find("[level='" + level + "']");
                    if (childPanel.is(":visible")) {
                        //$docMap.find("[level='" + level + "']").hide();
                        $docMap.find("[level='" + level + "']").slideUpHide();
                        $rightImage.removeClass("fr-docmap-icon-up").addClass("fr-docmap-icon-down");
                    }
                    else {
                        $docMap.find("[level='" + level + "']").slideUpShow();
                        //$docMap.find("[level='" + level + "']").show();
                        $rightImage.removeClass("fr-docmap-icon-down").addClass("fr-docmap-icon-up");
                    }
                });

                $mapNode.addClass("fr-docmap-item-root");
                $header.append($rightImage);
                $header.append($mapNode);
                $docMap.append($header);

                var $children = new $("<div level='" + level + "'>");
                $.each(docMap.Children, function (Index, Obj) {
                    $children.append(me._writeDocumentMapItem(Obj, level + 1));
                });

                $docMap.append($children);

                //expand the first root node
                if (level !== 0)
                    $children.hide();
            }
            else {
                $docMap.addClass("fr-docmap-item-container");
                me._setFocus($docMap);
                $docMap.append($mapNode);
            }

            return $docMap;
        },
        _setFocus: function ($focus) {
            $focus.hover(function () { $(this).addClass("fr-docmap-item-highlight"); }, function () { $(this).removeClass("fr-docmap-item-highlight"); });
        }
    });  // $.widget

});  // $(function ()

///#source 1 1 /Forerunner/ReportViewer/js/ReportPrint.js
/**
 * @file Contains the print widget.
 *
 */

// Assign or create the single globally scoped variable
var forerunner = forerunner || {};

// Forerunner SQL Server Reports
forerunner.ssr = forerunner.ssr || {};

$(function () {
    var widgets = forerunner.ssr.constants.widgets;
    var events = forerunner.ssr.constants.events;

    $.widget(widgets.getFullname("settingsPairWidget"), {
        options: {
            label1: null,
            name1: null,
            text1: null,
            unit1: null,
            label2: null,
            name2: null,
            text2: null,
            unit2: null,
        },
        _init: function () {
            var me = this;
            var name1 = "";
            if (me.options.name1) {
                name1 = "name='" + me.options.name1 + "'";
            }

            var name2 = "";
            if (me.options.name2) {
                name2 = "name='" + me.options.name2 + "'";
            }

            me.element.html("");
            var $theTable = new $(
            "<table class=fr-print-settings>" +
                "<tr>" +
                    "<td>" +
                        "<label class='fr-print-label'>" + me.options.label1 + "</label>" +
                    "</td>" +
                    "<td>" +
                        "<input class='fr-core-input fr-print-text' " + name1 + " type='text' value='" + me.options.text1 + "'/>" +
                    "</td>" +
                    "<td>" +
                        "<label class='fr-print-unit-label'>" + me.options.unit1 + "</label>" +
                    "</td>" +
                "</tr>" +
                "<tr>" +
                    "<td>" +
                        "<label class='fr-print-label'>" + me.options.label2 + "</label>" +
                    "</td>" +
                    "<td>" +
                        "<input class='fr-core-input fr-print-text' " + name2 + " type='text' value='" + me.options.text2 + "'/>" +
                    "</td>" +
                    "<td>" +
                        "<label class='fr-print-unit-label'>" + me.options.unit2 + "</label>" +
                    "</td>" +
                "</tr>" +
            "</table>");
            me.element.append($theTable);
            me.element.addClass("fr-print-settings-pair-widget");
        },
    }); //$.widget

    /**
     * Widget used to show print dialog
     *
     * @namespace $.forerunner.reportPrint
     * @prop {Object} options - The options for document map
     * @prop {Object} options.$reportViewer - The report viewer widget     
     * @prop {Object} options.$appContainer - Report page container
     *
     * @example
     *   $("#docMap").reportDocumentMap({ 
     *      $reportViewer: $viewer 
     *   });   
     */
    $.widget(widgets.getFullname(widgets.reportPrint), {
        options: {
            $reportViewer: null,
            $appContainer: null
        },
        _printData: null,
        _create: function () {
            
        },
        _init: function () {
            var me = this;
            me.locData = forerunner.localize.getLocData(forerunner.config.forerunnerFolder() + "ReportViewer/loc/ReportViewer");
        },
        _initBody: function () {
            var me = this;
            var print = me.locData.print;

            me.element.html("");
            me.element.off(events.modalDialogGenericSubmit);
            me.element.off(events.modalDialogGenericCancel);

            var headerHtml = forerunner.dialog.getModalDialogHeaderHtml('fr-icons24x24-printreport', print.title, "fr-print-cancel", "");
            var $printForm = new $(
            "<div class='fr-core-dialog-innerPage fr-core-center'>" +
                headerHtml +
                // form
                "<form class='fr-print-form fr-core-dialog-form'>" +
                    // Print layout label
                    "<div class='fr-print-options-label'>" +
                        print.pageLayoutOptions +
                    "</div>" +
                    // Height / Width
                    "<div class=fr-print-height-width-id></div>" +
                    // Orientation
                    "<div class='fr-print-orientation-container'>" +
                        "<div class='fr-print-portrait'></div>" +
                        "<div class='fr-print-landscape'></div>" +
                    "</div>" +
                    // Margins label
                    "<div class='fr-print-margins-label'>" +
                        print.margin +
                    "</div>" +
                    // Top / Bottom
                    "<div class=fr-print-top-bottom-id></div>" +
                     //Left / Right
                    "<div class=fr-print-left-right-id></div>" +
                    // Print button
                    "<div class='fr-core-dialog-submit-container'>" +
                        "<div class='fr-core-center'>" +
                            "<input name='submit' type='button' class='fr-print-submit-id fr-core-dialog-submit fr-core-dialog-button' value='" + print.print + "'/>" +
                        "</div>" +
                    "</div>" +
                "</form>" +
            "</div>");

            me.element.append($printForm);
            me.$form = me.element.find(".fr-print-form");
            //disable form auto submit when click enter on the keyboard
            me.$form.on("submit", function () { return false; });
            me._resetValidateMessage();

            me.element.find(".fr-print-submit-id").on("click", function (e) {
                me._submitPrint();
            });

            me.element.find(".fr-print-cancel").on("click", function (e) {
                me.closeDialog();
                if (me._printData) {
                    me._createItems();
                }
            });

            me.element.on(events.modalDialogGenericSubmit, function () {
                me._submitPrint();
            });

            me.element.on(events.modalDialogGenericCancel, function () {
                me.closeDialog();
            });
        },
        /**
         * Set report page layout
         *
         * @function $.forerunner.reportPrint#setPrint
         * 
         * @param {Object} pageLayout - Report page layout data
         */
        setPrint: function (pageLayout) {
            var me = this;
            me._initBody();
            me._printData = pageLayout || me._printData;

            if (me._printData) {
                me._createItems(me._printData);
            }
        },
        _submitPrint: function () {
            var me = this;

            var printPropertyList = me._generatePrintProperty();
            if (printPropertyList !== null) {
                me.options.$reportViewer.reportViewer("printReport", printPropertyList);
                me.closeDialog();
            }
        },
        _createItems: function (pageLayout) {
            var me = this;
            var print = me.locData.print;
            var unit = print.unit;
            pageLayout = pageLayout || me._printData;

            me.element.find(".fr-print-height-width-id").settingsPairWidget({
                label1: print.pageHeight,
                name1: "PageHeight",
                text1: me._unitConvert(pageLayout.PageHeight),
                unit1: unit,
                label2: print.pageWidth,
                name2: "PageWidth",
                text2: me._unitConvert(pageLayout.PageWidth),
                unit2: unit
            });

            me.element.find(".fr-print-top-bottom-id").settingsPairWidget({
                label1: print.marginTop,
                name1: "MarginTop",
                text1: me._unitConvert(pageLayout.MarginTop),
                unit1: unit,
                label2: print.marginBottom,
                name2: "MarginBottom",
                text2: me._unitConvert(pageLayout.MarginBottom),
                unit2: unit
            });

            me.element.find(".fr-print-left-right-id").settingsPairWidget({
                label1: print.marginLeft,
                name1: "MarginLeft",
                text1: me._unitConvert(pageLayout.MarginLeft),
                unit1: unit,
                label2: print.marginRight,
                name2: "MarginRight",
                text2: me._unitConvert(pageLayout.MarginRight),
                unit2: unit
            });

            me.element.find(".fr-print-text").each(function () {
                $(this).attr("required", "true").attr("number", "true");
                $(this).parent().addClass("fr-print-item").append($("<span class='fr-print-error-span'/>").clone());
            });

            me._validateForm(me.$form);

            me.$pageWidth = me.element.find("[name=PageWidth]");
            me.$pageHeight = me.element.find("[name=PageHeight]");

            me.$pageWidth.on("change", function (e) {
                me._setOrientationIconState.call(me);
            });

            me.$pageHeight.on("change", function (e) {
                me._setOrientationIconState.call(me);
            });

            me.$printPortrait = me.element.find(".fr-print-portrait");
            me.$printLandscape = me.element.find(".fr-print-landscape");

            me.$printPortrait.on("click", function (e) {
                if (!me._isPortrait()) {
                    me._swapWidthHeight();
                }
            });

            me.$printLandscape.on("click", function (e) {
                if (me._isPortrait()) {
                    me._swapWidthHeight();
                }
            });

            me._setOrientationIconState();

            $(":text", me.element).each(
                function (index) {
                    var textinput = $(this);
                    textinput.on("blur", function () {
                        me.options.$reportViewer.reportViewer("onInputBlur");
                    });
                    textinput.on("focus", function () {
                        me.options.$reportViewer.reportViewer("onInputFocus");
                    });
                }
            );
        },
        _isPortrait: function () {
            var me = this;
            if (Number(me.$pageWidth.val()) > Number(me.$pageHeight.val())) {
                return false;
            }
            return true;
        },
        _swapWidthHeight: function () {
            var me = this;

            var width = me.$pageWidth.val();
            me.$pageWidth.val(me.$pageHeight.val());
            me.$pageHeight.val(width);

            me._setOrientationIconState();
        },
        _setOrientationIconState: function () {
            var me = this;

            if (Number(me.$pageWidth.val()) > Number(me.$pageHeight.val())) {
                // Landscape
                me.$printLandscape.removeClass("fr-core-cursorpointer");
                me.$printLandscape.removeClass("fr-print-landscape-icon");
                me.$printLandscape.addClass("fr-print-landscape-icon-active");
                
                me.$printPortrait.removeClass("fr-print-portrait-icon-active");
                me.$printPortrait.addClass("fr-core-cursorpointer");
                me.$printPortrait.addClass("fr-print-portrait-icon");
            }
            else {
                // Portrait
                me.$printLandscape.addClass("fr-core-cursorpointer");
                me.$printLandscape.removeClass("fr-print-landscape-icon-active");
                me.$printLandscape.addClass("fr-print-landscape-icon");

                me.$printPortrait.removeClass("fr-print-portrait-icon");
                me.$printPortrait.removeClass("fr-core-cursorpointer");
                me.$printPortrait.addClass("fr-print-portrait-icon-active");
            }
        },

        /**
         * Open print dialog
         *
         * @function $.forerunner.reportPrint#openDialog
         */
        openDialog: function () {
            var me = this;

            forerunner.dialog.showModalDialog(me.options.$appContainer, me);

            //forerunner.dialog.showModalDialog(me.options.$appContainer, function () {
            //    me.element.css("display", "inline-block");
            //});
        },
        /**
         * Close print dialog
         *
         * @function $.forerunner.reportPrint#openDialog
         */
        closeDialog: function () {
            var me = this;
            forerunner.dialog.closeModalDialog(me.options.$appContainer, me);
            //forerunner.dialog.closeModalDialog(me.options.$appContainer, function () {
            //    me.element.css("display", "");
            //});
        },
        _validateForm: function (form) {
            form.validate({
                errorPlacement: function (error, element) {
                    error.appendTo($(element).parent().find("span"));
                },
                highlight: function (element) {
                    $(element).parent().find("span").addClass("fr-print-error-position");
                    $(element).addClass("fr-print-error");
                },
                unhighlight: function (element) {
                    $(element).parent().find("span").removeClass("fr-print-error-position");
                    $(element).removeClass("fr-print-error");
                }
            });
        },
        _generatePrintProperty: function () {
            var me = this;
            var a = [];
            if (me.$form.valid() === true) {

                me.element.find(".fr-print-text").each(function () {
                    a.push({ key: this.name, value: me._generateUnitConvert(this.value) });
                });

                var printObject = { "PrintPropertyList": a };
                return JSON.stringify(printObject);
            }
            else {
                return null;
            }
        },
        _resetValidateMessage: function () {
            var me = this;
            var error = me.locData.validateError;

            jQuery.extend(jQuery.validator.messages, {
                required: error.required,
                number: error.number,
                digits: error.digits
            });
        },
        //milimeter is the unit of the RPL, inch is the format unit for PDF
        _unitConvert: function (milimeter) {
            var me = this;
            //if inch is the country's culture unit then convert milimeter to inch
            if (me.locData.print.unit === "in") {
                return Math.round(milimeter / 25.4 * 100) / 100;
            }
            else {
                return milimeter;
            }
        },
        //if inch is the country's culture unit then the source should be inch, otherwise it should be mm (RPL Default).
        _generateUnitConvert: function (source) {
            var me = this;
            if (me.locData.print.unit === "mm") {
                return Math.round(source / 25.4 * 100) / 100;
            }
            else {
                return source;
            }
        },
        /**
        * Removes the dsCredential functionality completely. This will return the element back to its pre-init state.
        *
        * @function $.forerunner.dsCredential#destroy
        */
        destroy: function () {
            var me = this;
            me._printData = null;

            this._destroy();
        }
    }); //$.widget
});
///#source 1 1 /Forerunner/ReportViewer/js/RDLExtDialog.js
/**
 * @file Contains the RDL Extensions widget.
 *
 */

// Assign or create the single globally scoped variable
var forerunner = forerunner || {};

// Forerunner SQL Server Reports
forerunner.ssr = forerunner.ssr || {};

$(function () {
    var widgets = forerunner.ssr.constants.widgets;
    var events = forerunner.ssr.constants.events;

    /**
     * Widget used to manage user settings
     *
     * @namespace $.forerunner.userSettings
     * @prop {Object} options - The options for userSettings
     * @prop {Object} options.$reportExplorer - The report explorer widget
     * @example
     * $("#userSettingsId").userSettings({
     *  $reportExplorer: me.$reportExplorer
     * });
     */
    $.widget(widgets.getFullname(widgets.reportRDLExt), {
        options: {
            reportViewer: null,
        },
        _create: function () {
        },
        _init: function () {
            var me = this;
            var locData = forerunner.localize.getLocData(forerunner.config.forerunnerFolder() + "ReportViewer/loc/ReportViewer").RDLExt;
            

            me.element.html("");
            me.element.off(events.modalDialogGenericSubmit);
            me.element.off(events.modalDialogGenericCancel);

            var headerHtml = forerunner.dialog.getModalDialogHeaderHtml("fr-icons24x24-rdlextension", locData.title, "fr-rdl-cancel", "");
            var $theForm = new $(
            "<div class='fr-core-dialog-innerPage fr-core-center'>" +
                headerHtml +
                // form
                "<form class='fr-rdl-form fr-core-dialog-form'>" +
                    "<div class='fr-rdl-container'>" +
                        "<label class='fr-rdl-label'>" + locData.dialogTitle + "</label>" +
                        "<textarea class='fr-rdl-text' rows='5' class='fr-rdl-id '  name='RDL' />  " +
                    "</div>" +
                    // Ok button
                    "<div class='fr-core-dialog-submit-container'>" +
                        "<div class='fr-core-center'>" +
                        "<input name='submit' type='button' class='fr-rdl-submit-id fr-core-dialog-submit fr-core-dialog-button' value='" + locData.submit + "'/>" +
                    "</div>" +
                "</form>" +
            "</div>");

            me.element.append($theForm);

            me.element.find(".fr-rdl-submit-id").on("click", function (e) {
                me._saveSettings();
            });

            me.element.find(".fr-rdl-cancel").on("click", function (e) {
                me.closeDialog();
            });

            me.element.on(events.modalDialogGenericSubmit, function () {
                me._saveSettings();
            });

            me.element.on(events.modalDialogGenericCancel, function () {
                me.closeDialog();
            });
        },

        _getSettings: function () {
            var me = this;
            me.settings = me.options.reportViewer.getRDLExt();
            me.$RLDExt = me.element.find(".fr-rdl-text");

            if (me.settings)
                me.$RLDExt.val(JSON.stringify(me.settings));
        },
        _saveSettings: function () {
            var me = this;
            
            var ret = me.options.reportViewer.saveRDLExt(me.$RLDExt.val());

            if (ret.statusText === "OK" ) {
                me.closeDialog();
            }
        },
        /**
         * Open user setting dialog
         *
         * @function $.forerunner.userSettings#openDialog
         */
        openDialog: function () {
            var me = this;

            me._getSettings();
            forerunner.dialog.showModalDialog(me.options.reportViewer.options.$appContainer, me);

        },
        /**
         * Close user setting dialog
         *
         * @function $.forerunner.userSettings#closeDialog
         */
        closeDialog: function () {
            var me = this;

            forerunner.dialog.closeModalDialog(me.options.reportViewer.options.$appContainer, me);
            me.element.detach();

        }
    }); //$.widget
});
///#source 1 1 /Forerunner/ReportViewer/js/ManageParamSets.js
/**
 * @file Contains the print widget.
 *
 */

// Assign or create the single globally scoped variable
var forerunner = forerunner || {};

// Forerunner SQL Server Reports
forerunner.ssr = forerunner.ssr || {};

$(function () {
    var widgets = forerunner.ssr.constants.widgets;
    var events = forerunner.ssr.constants.events;
    var locData = forerunner.localize.getLocData(forerunner.config.forerunnerFolder() + "ReportViewer/loc/ReportViewer");
    var manageParamSets = locData.manageParamSets;

    /**
     * Widget used to manage parameter set
     *
     * @namespace $.forerunner.manageParamSets
     * @prop {Object} options - The options for Managed Parameter Sets dialog
     * @prop {String} options.$reportViewer - Report viewer widget
     * @prop {Object} options.$appContainer - Report page container
     * @prop {String} options.model - Parameter model widget instance
     *
     * @example
     * $("#manageParamSetsDialog").manageParamSets({
     *    $appContainer: me.options.$appContainer,
     *    $reportViewer: $viewer,
     *    model: me.parameterModel
     /  });
     */
    $.widget(widgets.getFullname(widgets.manageParamSets), {
        options: {
            $reportViewer: null,
            $appContainer: null,
            model: null
        },
        _initTBody: function() {
            var me = this;
            me.serverData = me.options.model.parameterModel("cloneServerData");
            if (me.serverData === null || me.serverData === undefined) {
                return;
            }

            // Create the rows from the server data
            me._createRows();

            me.lastAddedSetId = null;
        },
        _createRows: function() {
            var me = this;

            // Remove any previous event handlers
            me.element.find(".fr-mps-text-input").off("change");
            me.element.find(".fr-mps-default-id").off("click");
            me.element.find(".fr-mps-all-users-id").off("click");
            me.element.find(".fr-mps-delete-id").off("click");

            me.$tbody.html("");
            var optionArray = me.options.model.parameterModel("getOptionArray", me.serverData.parameterSets);
            $.each(optionArray, function (index, option) {
                if (index > 0) {
                    // Skip the "<select set>" option
                    var parameterSet = me.serverData.parameterSets[option.id];
                    var $row = me._createRow(index, parameterSet);
                    me.$tbody.append($row);

                    if (me.serverData.canEditAllUsersSet) {
                        $row.find(".fr-mps-all-users-id").on("click", function (e) {
                            me._onClickAllUsers(e);
                        });
                    }
                    if (me.serverData.canEditAllUsersSet || !parameterSet.isAllUser) {
                        $row.find(".fr-mps-delete-id").on("click", function (e) {
                            me._onClickDelete(e);
                        });
                    }
                }
            });

            // Add any table body specific event handlers
            me.element.find(".fr-mps-text-input").on("change", function (e) {
                me._onChangeInput(e);
            });
            me.element.find(".fr-mps-default-id").on("click", function (e) {
                me._onClickDefault(e);
            });

            $(":text", me.element).each(
               function (index) {
                   var textinput = $(this);
                   textinput.on("blur", function () {
                       me.options.$reportViewer.reportViewer("onInputBlur");
                   });
                   textinput.on("focus", function () {
                       me.options.$reportViewer.reportViewer("onInputFocus");
                   });
               }
           );

            // Set up the form validation
            me._validateForm(me.$form);
        },
        _createRow: function(index, parameterSet) {
            var me = this;

            var allUsersTdClass = "";
            if (me.serverData.canEditAllUsersSet) {
                allUsersTdClass = " fr-core-cursorpointer";
            }

            var encodedSetName = forerunner.helper.htmlEncode(parameterSet.name);
            var textElement = "<input type='text' required='true' name=name" + index + " class='fr-mps-text-input fr-core-input' value='" + encodedSetName + "'/><span class='fr-mps-error-span'/>";
            var allUsersClass = "fr-mps-all-users-check-id ";
            var deleteClass = " class='ui-icon-circle-close ui-icon fr-core-center'";
            if (parameterSet.isAllUser) {
                if (!me.serverData.canEditAllUsersSet) {
                    textElement = encodedSetName;
                    deleteClass = "";
                }
                allUsersClass = "fr-mps-all-users-check-id ui-icon-check ui-icon ";
            }

            var defaultClass = "fr-mps-default-check-id ";
            if (parameterSet.id === me.serverData.defaultSetId) {
                defaultClass = "fr-mps-default-check-id ui-icon-check ui-icon ";
            }

            var rowClass = (index + 1) & 1 ? " class='fr-mps-odd-row'" : "";
            var $row = $(
                "<tr" + rowClass + " modelid='" + parameterSet.id + "'>" +
                    // Name
                    "<td title='" + encodedSetName + "'>" + textElement + "</td>" +
                    // Default
                    "<td class='fr-mps-default-id fr-core-cursorpointer'><div class='" + defaultClass + "fr-core-center' /></td>" +
                    // All Users
                    "<td class='fr-mps-all-users-id" + allUsersTdClass + "'><div class='" + allUsersClass + "fr-core-center' /></td>" +
                    // Delete
                    "<td class='fr-mps-delete-id ui-state-error-text fr-core-cursorpointer'><div" + deleteClass + "/></td>" +
                "</tr>");
            return $row;
        },
        _init: function () {
            var me = this;

            me.element.html("");
            me.element.off(events.modalDialogGenericSubmit);
            me.element.off(events.modalDialogGenericCancel);

            var headerHtml = forerunner.dialog.getModalDialogHeaderHtml("fr-icons24x24-parameterSets", manageParamSets.manageSets, "fr-mps-cancel", "");
            var $dialog = $(
                "<div class='fr-core-dialog-innerPage fr-core-center'>" +
                    headerHtml +
                    "<form class='fr-mps-form fr-core-dialog-form'>" +
                        "<div class='fr-core-center'>" +
                            "<input name='add' type='button' value='" + manageParamSets.add + "' title='" + manageParamSets.addNewSet + "' class='fr-mps-add-id fr-mps-action-button fr-core-dialog-button'/>" +
                            "<table class='fr-mps-main-table'>" +
                                "<thead>" +
                                    "<tr>" +
                                    "<th class='fr-mps-name-header'>" + manageParamSets.name + "</th><th class='fr-mps-property-header'>" + manageParamSets.defaultHeader + "</th><th class='fr-mps-property-header'>" + manageParamSets.allUsers + "</th><th class='fr-mps-property-header'>" + manageParamSets.deleteHeader + "</th>" +
                                    "</tr>" +
                                "</thead>" +
                                "<tbody class='fr-mps-main-table-body-id'></tbody>" +
                            "</table>" +
                            "<div class='fr-core-dialog-submit-container'>" +
                                "<div class='fr-core-center'>" +
                                    "<input name='submit' type='button' class='fr-mps-submit-id fr-core-dialog-submit fr-core-dialog-button' value='" + manageParamSets.apply + "' />" +
                                "</div>" +
                            "</div>" +
                        "</div>" +
                    "</form>" +
                "</div>");

            me.element.append($dialog);
            me.$tbody = me.element.find(".fr-mps-main-table-body-id");
            me._initTBody();

            me.$form = me.element.find(".fr-mps-form");
            //disable form auto submit when click enter on the keyboard
            me.$form.on("submit", function () { return false; });

            me._resetValidateMessage();

            me.element.find(".fr-mps-cancel").on("click", function(e) {
                me.closeDialog();
            });

            me.element.find(".fr-mps-add-id").on("click", function(e) {
                me._onAdd(e);
            });

            me.element.find(".fr-mps-submit-id").on("click", function (e) {
                me._submitParamSet();
            });

            me.element.on(events.modalDialogGenericSubmit, function () {
                me._submitParamSet();
            });

            me.element.on(events.modalDialogGenericCancel, function () {
                me.closeDialog();
            });
        },
        _submitParamSet: function () {
            var me = this;

            if (me.$form.valid() === true) {
                me.options.model.parameterModel("applyServerData", me.serverData, me.lastAddedSetId);
                me.closeDialog();
            }
        },
        _findId: function (e) {
            var $target = $(e.target);
            var $tr = $target;
            while (!$tr.is("tr") && !$tr.is("table")) {
                $tr = $tr.parent();
            }
            if ($tr.is("tr")) {
                return $tr.attr("modelid");
            }

            return null;
        },
        _findRow: function(id) {
            var me = this;
            return me.$tbody.find("[modelid='" + id + "']");
        },
        _onAdd: function (e) {
            var me = this;
            var newSet = me.options.model.parameterModel("getNewSet", manageParamSets.newSet, me.parameterList);
            me.serverData.parameterSets[newSet.id] = newSet;
            var setCount = me.options.model.parameterModel("getSetCount", me.serverData);

            if (setCount === 1) {
                // Set the default id if this is the first set
                me.serverData.defaultSetId = newSet.id;
            }

            // Update the UI with the new set
            me._createRows();
            var $tr = me._findRow(newSet.id);
            var $input = $tr.find("input");
            $input.focus();

            me.lastAddedSetId = newSet.id;
        },
        _onChangeInput: function(e) {
            var me = this;
            var $input = $(e.target);
            $input.attr("title", $input.val());
            var id = me._findId(e);
            me.serverData.parameterSets[id].name = $input.val();
            me._createRows();
        },
        _onClickDefault: function(e) {
            var me = this;

            // Update the UI
            me.$tbody.find(".fr-mps-default-id div").removeClass("ui-icon-check ui-icon");
            var $div = $(e.target);
            if (!$div.hasClass("fr-mps-default-check-id")) {
                $div = $div.find(".fr-mps-default-check-id");
            }
            $div.addClass("ui-icon-check ui-icon");

            // Update the paramaterSets
            me.serverData.defaultSetId = me._findId(e);
        },
        _onClickAllUsers: function(e) {
            var me = this;

            // Update the UI
            var $div = $(e.target);
            if (!$div.hasClass("fr-mps-all-users-check-id")) {
                $div = $div.find(".fr-mps-all-users-check-id");
            }
            $div.toggleClass("ui-icon-check ui-icon");

            // Update the paramaterSets
            var id = me._findId(e);
            var set = me.serverData.parameterSets[id];
            set.isAllUser = !set.isAllUser;
        },
        _onClickDelete: function(e) {
            var me = this;
            var count = me.options.model.parameterModel("getSetCount", me.serverData);

            // Update the UI
            var id = me._findId(e);
            var $tr = me._findRow(id);
            $tr.remove();

            // Update the paramaterSets
            if (count === 1) {
                me.serverData.defaultSetId = null;
            } else if (id === me.serverData.defaultSetId) {
                var $first = me.$tbody.find(".fr-mps-default-check-id").first();
                me._onClickDefault({ target: $first });
            }

            if (id === me.lastAddedSetId) {
                // Reset the last added if need be
                me.lastAddedSetId = me.serverData.defaultSetId;
            }

            delete me.serverData.parameterSets[id];
        },
        /**
         * Open parameter set dialog
         *
         * @function $.forerunner.manageParamSets#openDialog
         * @param {String} parameterList - User saved parameter set
         */
        openDialog: function (parameterList) {
            var me = this;
            if (parameterList) {
                me.parameterList = JSON.parse(parameterList);
                // Before the dialog is opened the options should always be re-initialized
                // so this call is not be needed any longer
                //me._initTBody();
                forerunner.dialog.showModalDialog(me.options.$appContainer, me);

                // We need to make sure the current set has the parameter list defined. It
                // may not be defined for instance when the set is the default set and the
                // default has never been saved by way of the save button in the toolbar
                var currentSet = me.options.model.parameterModel("getCurrentSet");
                if (currentSet && !currentSet.data) {
                    currentSet.data = me.parameterList;
                }
            }
        },
        /**
         * Close parameter set dialog
         *
         * @function $.forerunner.manageParamSets#closeDialog
         */
        closeDialog: function () {
            var me = this;
            forerunner.dialog.closeModalDialog(me.options.$appContainer, me);
            //forerunner.dialog.closeModalDialog(me.options.$appContainer, function () {
            //    me.element.css("display", "");
            //});
        },

        _validateForm: function (form) {
            form.validate({
                errorPlacement: function (error, element) {
                    error.appendTo($(element).parent().find("span"));
                },
                highlight: function (element) {
                    $(element).parent().find("span").addClass("fr-mps-error-position");
                    $(element).addClass("fr-mps-error");
                },
                unhighlight: function (element) {
                    $(element).parent().find("span").removeClass("fr-mps-error-position");
                    $(element).removeClass("fr-mps-error");
                }
            });
        },
        _resetValidateMessage: function () {
            var me = this;
            var error = locData.validateError;

            jQuery.extend(jQuery.validator.messages, {
                required: error.required,
                number: error.number,
                digits: error.digits
            });
        },
    }); //$.widget
});
///#source 1 1 /Forerunner/ReportViewer/js/ReportViewerInitializer.js
// Assign or create the single globally scoped variable
var forerunner = forerunner || {};

// Forerunner SQL Server Reports
forerunner.ssr = forerunner.ssr || {};

$(function () {
    var ssr = forerunner.ssr;
    var constants = forerunner.ssr.constants;
    var events = constants.events;
    var toolTypes = ssr.constants.toolTypes;
    var widgets = constants.widgets;
    var locData = forerunner.localize.getLocData(forerunner.config.forerunnerFolder() + "ReportViewer/loc/ReportViewer");

    // This is the helper class that would initialize a viewer.
    // This is currently private.  But this could be turned into a sample.
    ssr.ReportViewerInitializer = function (options) {
        var me = this;

        me.options = {
            $toolbar: null,
            $toolPane: null,
            $routeLink: null,
            $viewer: null,
            $nav: null,
            $paramarea: null,
            $lefttoolbar: null,
            $righttoolbar: null,
            $docMap: null,
            ReportViewerAPI: forerunner.config.forerunnerAPIBase() + "ReportViewer",
            ReportManagerAPI: forerunner.config.forerunnerAPIBase() + "ReportManager",
            toolbarHeight: null,
            navigateTo: null,
            isReportManager: false,
            userSettings: null,
            $appContainer: null,
            rsInstance: null,
            useReportManagerSettings: false,
            $unzoomtoolbar: null,
            toolbarConfigOption: constants.toolbarConfigOption.full
        };

        // Merge options with the default settings
        if (options) {
            $.extend(me.options, options);
        }

        me.parameterModel = null;
        if (me.options.isReportManager || me.options.useReportManagerSettings) {
            // Create the parameter model object for this report
            me.parameterModel = $({}).parameterModel({ rsInstance: me.options.rsInstance });
        }

        me.subscriptionModel = null;
        if (me.options.isReportManager || me.options.useReportManagerSettings) {
            me.subscriptionModel = $({}).subscriptionModel({ rsInstance: me.options.rsInstance });
        }
    };

    ssr.ReportViewerInitializer.prototype = {
        getParameterModel: function () {
            var me = this;
            return me.parameterModel;
        },
        render: function () {
            var me = this;
            var $viewer = me.options.$viewer;

            var userSettings = me.options.userSettings;
            if ((me.options.isReportManager || me.options.useReportManagerSettings) && !userSettings) {
                userSettings = forerunner.ajax.getUserSetting(me.options.rsInstance);
            }

            me.options.$docMap.hide();
            $viewer.reportViewer({
                reportViewerAPI: me.options.ReportViewerAPI,
                jsonPath: me.options.jsonPath,
                docMapArea: me.options.$docMap,
                parameterModel: me.parameterModel,
                userSettings: userSettings,
                $appContainer: me.options.$appContainer,
                rsInstance: me.options.rsInstance,
                showSubscriptionUI: (me.options.isReportManager || me.options.useReportManagerSettings)
            });

            // Create / render the toolbar
            var $toolbar = me.options.$toolbar;
            $toolbar.toolbar({ $reportViewer: $viewer, $ReportViewerInitializer: this, $appContainer: me.options.$appContainer });

            var tb = forerunner.ssr.tools.mergedButtons;
            var rtb = forerunner.ssr.tools.rightToolbar;

            if (me.options.isReportManager) {
                var listOfButtons = [];
                //add home button if user enable it
                if (forerunner.config.getCustomSettingsValue("showHomeButton") === "on") {
                    listOfButtons.push(tb.btnHome);
                }
                listOfButtons.push(tb.btnRecent, tb.btnFavorite);

                if (forerunner.ajax.isFormsAuth()) {
                    listOfButtons.push(tb.btnLogOff);
                }
                $toolbar.toolbar("addTools", 12, true, listOfButtons);
                $toolbar.toolbar("addTools", 4, true, [tb.btnFav]);
                $toolbar.toolbar("disableTools", [tb.btnFav]);
            }

            if (me.options.toolbarConfigOption === constants.toolbarConfigOption.hide) {
                $toolbar.hide();
            } else {
                if (me.options.toolbarConfigOption && me.options.toolbarConfigOption !== constants.toolbarConfigOption.full) {
                    $toolbar.toolbar("configure", me.options.toolbarConfigOption);
                }
                // Let the report viewer know the height of the toolbar (toolbar height + route link section height)
                $viewer.reportViewer("option", "toolbarHeight", $toolbar.outerHeight() + me.options.$routeLink.outerHeight());
            }

            var $unzoomtoolbar = me.options.$unzoomtoolbar;
            if ($unzoomtoolbar !== null) {
                $unzoomtoolbar.unzoomToolbar({ $reportViewer: $viewer, $ReportViewerInitializer: this, $appContainer: me.options.$appContainer });
            }

            var $lefttoolbar = me.options.$lefttoolbar;
            if ($lefttoolbar !== null) {
                $lefttoolbar.leftToolbar({ $reportViewer: $viewer, $ReportViewerInitializer: this, $appContainer: me.options.$appContainer });
            }

            var $righttoolbar = me.options.$righttoolbar;
            if ($righttoolbar !== null) {
                $righttoolbar.rightToolbar({ $reportViewer: $viewer, $ReportViewerInitializer: this, $appContainer: me.options.$appContainer });
            }

            if (me.options.isReportManager || me.options.useReportManagerSettings) {
                $righttoolbar.rightToolbar("addTools", 2, true, [rtb.btnRTBManageSets, rtb.btnSelectSet, rtb.btnSavParam]);
            }

            // Create / render the menu pane
            var mi = forerunner.ssr.tools.mergedItems;
            var $toolPane = me.options.$toolPane.toolPane({ $reportViewer: $viewer, $ReportViewerInitializer: this, $appContainer: me.options.$appContainer });
            if (me.options.isReportManager) {
                $toolPane.toolPane("addTools", 2, true, [mi.itemFolders]);
                $toolPane.toolPane("addTools", 5, true, [mi.itemFav]);
                $toolPane.toolPane("disableTools", [mi.itemFav]);

                $viewer.on(events.reportViewerChangePage(), function (e, data) {
                    $toolPane.toolPane("enableTools", [mi.itemFav]);
                    $toolbar.toolbar("enableTools", [tb.btnFav]);
                });

                $viewer.on(events.reportViewerDrillThrough(), function (e, data) {
                    me.setFavoriteState($viewer.reportViewer("getReportPath"));
                });

                $viewer.on(events.reportViewerChangeReport(), function (e, data) {
                    me.setFavoriteState($viewer.reportViewer("getReportPath"));
                });

                $viewer.on(events.reportViewerPreLoadReport(), function (e, data) {
                    if (data.newPath) {
                        me.setFavoriteState(data.newPath);
                    }
                });
            }

            var $nav = me.options.$nav;
            if ($nav !== null) {
                $nav.pageNav({ $reportViewer: $viewer, $appContainer: me.options.$appContainer, rsInstance: me.options.rsInstance });
                $viewer.reportViewer("option", "pageNavArea", $nav);
            }
            
            var $paramarea = me.options.$paramarea;
            if ($paramarea !== null) {
                $paramarea.reportParameter({ $reportViewer: $viewer });
                $viewer.reportViewer("option", "paramArea", $paramarea);
            }

            var $dlg;
            $dlg = me._findSection("fr-print-section");
            $dlg.reportPrint({ $appContainer: me.options.$appContainer, $reportViewer: $viewer });

            $dlg = me._findSection("fr-managesubscription-section");
            $dlg.manageSubscription({ $appContainer: me.options.$appContainer, $reportViewer: $viewer, subscriptionModel: me.subscriptionModel });

            $dlg = me._findSection("fr-emailsubscription-section");
            $dlg.emailSubscription({ $appContainer: me.options.$appContainer, $reportViewer: $viewer, subscriptionModel: me.subscriptionModel, userSettings: userSettings });

            $dlg = me._findSection("fr-dsc-section");
            $dlg.dsCredential({ $appContainer: me.options.$appContainer, $reportViewer: $viewer });

            $dlg = me._findSection("fr-tag-section");
            $dlg.forerunnerTags({ $appContainer: me.options.$appContainer, rsInstance: me.options.rsInstance });

            if (me.parameterModel) {
                $dlg = me._findSection("fr-mps-section");
                $dlg.manageParamSets({
                    $appContainer: me.options.$appContainer,
                    $reportViewer: $viewer,
                    $reportViewerInitializer: me,
                    model: me.parameterModel
                });
                me._manageParamSetsDialog = $dlg;
            }
        },
        _findSection: function (sectionClass) {
            var me = this;

            var $dlg = me.options.$appContainer.find("." + sectionClass);
            if ($dlg.length === 0) {
                $dlg = new $("<div class='fr-dialog-id fr-core-dialog-layout fr-core-widget'/>");
                $dlg.addClass(sectionClass);
                me.options.$appContainer.append($dlg);
            }

            return $dlg;
        },
        showManageParamSetsDialog: function (parameterList) {
            var me = this;
            var $viewer = me.options.$viewer;

            // Re-initialize the options for the current report viewer, model, etc.
            me._manageParamSetsDialog.manageParamSets({
                $appContainer: me.options.$appContainer,
                $reportViewer: $viewer,
                $reportViewerInitializer: me,
                model: me.parameterModel
            });
            me._manageParamSetsDialog.manageParamSets("openDialog", parameterList);
        },
        setFavoriteState: function (path) {
            var me = this;
            me.$btnFavorite = null;
            if (me.options.$toolbar !== null) {
                me.$btnFavorite = me.options.$toolbar.find(".fr-button-update-fav").find("div").first();
            }
            me.$itemFavorite = null;
            if (me.options.$toolPane !== null) {
                me.$itemFavorite = me.options.$toolPane.find(".fr-item-update-fav").find("div").first();
            }
            var url = me.options.ReportManagerAPI + "/isFavorite?path=" + path;
            if (me.options.rsInstance) url += "&instance=" + me.options.rsInstance;
            forerunner.ajax.ajax({
                url: url,
                dataType: "json",
                async: true,
                success: function (data) {
                    me.updateFavoriteState(data.IsFavorite);
                },
                fail: function () {
                    if (me.$btnFavorite) {
                        me.$btnFavorite.hide();
                    }
                    if (me.$itemFavorite) {
                        me.$itemFavorite.hide();
                    }
                }
            });
        },
        onClickBtnFavorite: function (e) {
            var me = this;
            var $toolbar = e.data.me;

            var action = "add";
            if (me.$btnFavorite.hasClass("fr-icons24x24-favorite-minus")) {
                action = "delete";
            }

            var url = me.options.ReportManagerAPI + "/UpdateView";
            forerunner.ajax.getJSON(url,
                {
                    view: "favorites",
                    action: action,
                    path: $toolbar.options.$reportViewer.reportViewer("getReportPath"),
                    instance: me.options.rsInstance,
                },
                function (data) {
                    me.updateFavoriteState.call(me, action === "add");
                },
                function () {
                    forerunner.dialog.showMessageBox(me.options.$appContainer, locData.messages.favoriteFailed);
                }
            );
        },
        onClickItemFavorite: function (e) {
            var me = this;
            var $toolpane = e.data.me;

            var action = "add";
            if (me.$itemFavorite.hasClass("fr-icons24x24-favorite-minus")) {
                action = "delete";
            }

            $toolpane._trigger(events.actionStarted, null, $toolpane.allTools["fr-item-update-fav"]);
            var url = me.options.ReportManagerAPI + "/UpdateView";
            forerunner.ajax.getJSON(url,
                {
                    view: "favorites",
                    action: action,
                    path: $toolpane.options.$reportViewer.reportViewer("getReportPath"),
                    instance: me.options.rsInstance,
                },
                function (data) {
                    me.updateFavoriteState.call(me, action === "add");
                },
                function () {
                    forerunner.dialog.showMessageBox(me.options.$appContainer, locData.messages.favoriteFailed);
                }
            );
        },
        updateFavoriteState: function (isFavorite) {
            var me = this;
            if (isFavorite) {
                if (me.$btnFavorite) {
                    me.$btnFavorite.addClass("fr-icons24x24-favorite-minus");
                    me.$btnFavorite.removeClass("fr-icons24x24-favorite-plus");
                }
                if (me.$itemFavorite) {
                    me.$itemFavorite.addClass("fr-icons24x24-favorite-minus");
                    me.$itemFavorite.removeClass("fr-icons24x24-favorite-plus");
                }
            }
            else {
                if (me.$btnFavorite) {
                    me.$btnFavorite.removeClass("fr-icons24x24-favorite-minus");
                    me.$btnFavorite.addClass("fr-icons24x24-favorite-plus");
                }
                if (me.$itemFavorite) {
                    me.$itemFavorite.removeClass("fr-icons24x24-favorite-minus");
                    me.$itemFavorite.addClass("fr-icons24x24-favorite-plus");
                }
            }
        }
    };  // ssr.ReportViewerInitializer.prototype

    // Unzoom Toolbar
    $.widget(widgets.getFullname(widgets.unzoomToolbar), $.forerunner.toolBase, {
        options: {
            $reportViewer: null,
            $ReportViewerInitializer: null,
            toolClass: "fr-toolbar-zoom",
            $appContainer: null
        },
        _init: function () {
            var me = this;
            me._super();
            var utb = forerunner.ssr.tools.unZoomToolbar;

            me.element.html("");
            var $toolbar = new $("<div class='" + me.options.toolClass + " fr-core-widget' />");
            $(me.element).append($toolbar);

            me.addTools(1, true, [utb.btnUnZoom]);
        },
    }); //$.widget

    // Left Toolbar
    $.widget(widgets.getFullname(widgets.leftToolbar), $.forerunner.toolBase, {
        options: {
            $reportViewer: null,
            $ReportViewerInitializer: null,
            toolClass: "fr-toolbar-slide",
            $appContainer: null
        },
        _init: function () {
            var me = this;
            me._super();
            var ltb = forerunner.ssr.tools.leftToolbar;

            me.element.html("");
            var $toolbar = new $("<div class='" + me.options.toolClass + " fr-core-widget' />");
            $(me.element).append($toolbar);

            me.addTools(1, true, [ltb.btnLTBMenu]);
        },
    }); //$.widget

    // Right Toolbar
    $.widget(widgets.getFullname(widgets.rightToolbar), $.forerunner.toolBase, {
        options: {
            $reportViewer: null,
            $ReportViewerInitializer: null,
            toolClass: "fr-toolbar-slide",
            $appContainer: null
        },
        _initCallbacks: function () {
            var me = this;

            if (me.parameterModel) {
                me.parameterModel.on(events.parameterModelChanged(), function (e, data) {
                    me._onModelChange.call(me, e, data);
                });
                me.parameterModel.on(events.parameterModelSetChanged(), function (e, data) {
                    me._onModelChange.call(me, e, data);
                });
            }
        },
        _init: function () {
            var me = this;
            me._super();
            var rtb = forerunner.ssr.tools.rightToolbar;
            me.parameterModel = me.options.$ReportViewerInitializer.getParameterModel();

            me.element.html("");
            var $toolbar = new $("<div class='" + me.options.toolClass + " fr-core-widget' />");
            $(me.element).append($toolbar);

            me.addTools(1, true, [rtb.btnRTBParamarea]);

            me._initCallbacks();
        },
        _onModelChange: function () {
            var me = this;
            var rtb = forerunner.ssr.tools.rightToolbar;

            if (me.parameterModel.parameterModel("canUserSaveCurrentSet")) {
                me.enableTools([rtb.btnSavParam]);
            } else {
                me.disableTools([rtb.btnSavParam]);
            }
        }
    }); //$.widget

});  // $(function ()

///#source 1 1 /Forerunner/ReportViewer/js/ReportViewerEZ.js
// Assign or create the single globally scoped variable
var forerunner = forerunner || {};

// Forerunner SQL Server Reports
forerunner.ssr = forerunner.ssr || {};

$(function () {
    var constants = forerunner.ssr.constants;
    var widgets = constants.widgets;
    
     /**
     * Widget used to view a report
     *
     * @namespace $.forerunner.reportViewerEZ
     * @prop {Object} options - The options for reportViewerEZ
     * @prop {Object} options.DefaultAppTemplate -- The helper class that creates the app template.  If it is null, the widget will create its own.
     * @prop {Object} options.navigateTo - Callback function used to navigate to a selected report.  Only needed if isReportManager == true.
     * @prop {Object} options.historyBack - Callback function used to go back in browsing history.  Only needed if isReportManager == true.
     * @prop {Boolean} options.isReportManager - A flag to determine whether we should render report manager integration items.  Defaults to false.
     * @prop {Boolean} options.isFullScreen - A flag to determine whether show report viewer in full screen. Default to true.
     * @prop {Boolean} options.userSettings - Custom user setting
     * @prop {String} options.rsInstance - Report service instance name
     * @prop {Boolean} options.useReportManagerSettings - Defaults to false if isReportManager is false.  If set to true, will load the user saved parameters and user settings from the database.
     * @prop {Boolean} options.toolbarConfigOption - Defaults to forerunner.ssr.constants.toolbarConfigOption.full
     *
     * @example
     * $("#reportViewerEZId").reportViewerEZ({
     *  DefaultAppTemplate: null,
     *  navigateTo: me.navigateTo,
     *  historyBack: me.historyBack
     *  isReportManager: false,
     *  userSettings: userSettings
     * });
     */
    $.widget(widgets.getFullname(widgets.reportViewerEZ), $.forerunner.toolBase, {
        options: {
            DefaultAppTemplate: null,
            jsonPath: null,
            navigateTo: null,
            historyBack: null,
            isReportManager: false,
            isFullScreen: true,
            userSettings: null,
            rsInstance: null,
            useReportManagerSettings: false,
            toolbarConfigOption: constants.toolbarConfigOption.full
        },
        _render: function () {
            var me = this;
            var layout = me.DefaultAppTemplate;
            forerunner.device.allowZoom(false);
            layout.$bottomdivspacer.addClass("fr-nav-spacer").hide();
            layout.$bottomdiv.addClass("fr-nav-container").hide();
            layout.$bottomdiv.css("position", me.options.isFullScreen ? "fixed" : "absolute");

            //layout.$mainviewport.css({ width: "100%", height: "100%" });
            layout.$mainsection.html(null);
            var $viewer = new $("<DIV />");
            $viewer.addClass("fr-layout-reportviewer");
            layout.$mainsection.append($viewer);

            var initializer = new forerunner.ssr.ReportViewerInitializer({
                $toolbar: layout.$mainheadersection,
                $toolPane: layout.$leftpanecontent,
                $routeLink: layout.$linksection,
                $viewer: $viewer,
                $nav: layout.$bottomdiv,
                $paramarea: layout.$rightpanecontent,
                $lefttoolbar: layout.$leftheader,
                $righttoolbar: layout.$rightheader,
                $docMap: layout.$docmapsection,
                ReportViewerAPI: forerunner.config.forerunnerAPIBase() + "ReportViewer",
                jsonPath: me.options.jsonPath,
                navigateTo: me.options.navigateTo,
                isReportManager: me.options.isReportManager,
                userSettings: me.options.userSettings,
                $appContainer: layout.$container,
                rsInstance: me.options.rsInstance,
                useReportManagerSettings: me.options.useReportManagerSettings,
                $unzoomtoolbar: layout.$unzoomsection,
                toolbarConfigOption: me.options.toolbarConfigOption
            });

            initializer.render();

            $viewer.on("reportviewerback", function (e, data) {
                layout._selectedItemPath = data.path;
                if (me.options.historyBack) {
                    me.options.historyBack();
                }             
            });

            $viewer.on("reportvieweractionhistorypop", function (e, data) {
                if (!me.options.historyBack && ($viewer.reportViewer("actionHistoryDepth") === 0)) {
                    layout.$mainheadersection.toolbar("disableTools", [forerunner.ssr.tools.toolbar.btnReportBack]);
                    layout.$leftpanecontent.toolPane("disableTools", [forerunner.ssr.tools.toolpane.itemReportBack]);
                }
            });

            $viewer.on("reportvieweractionhistorypush", function (e, data) {
                if (!me.options.historyBack) {
                    layout.$mainheadersection.toolbar("enableTools", [forerunner.ssr.tools.toolbar.btnReportBack]);
                    layout.$leftpanecontent.toolPane("enableTools", [forerunner.ssr.tools.toolpane.itemReportBack]);
                }
            });

            if (me.options.historyBack){
                layout.$mainheadersection.toolbar("enableTools", [forerunner.ssr.tools.toolbar.btnReportBack]);
                layout.$leftpanecontent.toolPane("enableTools", [forerunner.ssr.tools.toolpane.itemReportBack]);
            }

            me.DefaultAppTemplate.bindViewerEvents();
        },
        _init: function () {
            var me = this;
            me._super();

            if (me.options.DefaultAppTemplate === null) {
                me.DefaultAppTemplate = new forerunner.ssr.DefaultAppTemplate({ $container: me.element, isFullScreen: me.options.isFullScreen }).render();
            } else {
                me.DefaultAppTemplate = me.options.DefaultAppTemplate;
            }
            me._render();
            
            if (me.options.isFullScreen &&
                (forerunner.device.isWindowsPhone() )) {
                // if the viewer is full screen, we will set up the viewport here. Note that on Windows
                // Phone 8, the equivalent of the user-zoom setting only works with @-ms-viewport and not
                // with the meta tag.
                var $viewportStyle = $("#fr-viewport-style");
                if ($viewportStyle.length === 0) {
                    var userZoom = "fixed";
                    if (sessionStorage.forerunner_zoomReload_userZoom) {
                        var zoomReloadStringData = sessionStorage.forerunner_zoomReload_userZoom;
                        delete sessionStorage.forerunner_zoomReload_userZoom;
                        var zoomReloadData = JSON.parse(zoomReloadStringData);
                        if (zoomReloadData.userZoom) {
                            userZoom = zoomReloadData.userZoom;
                        }
                    }

                    $viewportStyle = $("<style id=fr-viewport-style>@-ms-viewport {width:device-width; user-zoom:" + userZoom + ";}</style>");
                    $("head").slice(0).append($viewportStyle);

                    // Show the unzoom toolbar
                    if (userZoom === "zoom") {
                        me.DefaultAppTemplate.showUnZoomPane.call(me.DefaultAppTemplate);
                    }
                }
            }
        },
        /**
         * Get report viewer page navigation
         *
         * @function $.forerunner.reportViewerEZ#getPageNav
         * 
         * @return {Object} - report viewer page navigation jQuery object
         */
        getPageNav: function () {
            var me = this;
            if (me.DefaultAppTemplate) {
                return me.DefaultAppTemplate.$bottomdiv;
            }

            return null;
        },
        /**
         * Get report viewer document map
         *
         * @function $.forerunner.reportViewerEZ#getReportDocumentMap
         * 
         * @return {Object} - report viewer document map jQuery object
         */
        getReportDocumentMap: function () {
            var me = this;
            if (me.DefaultAppTemplate) {
                return me.DefaultAppTemplate.$docmapsection;
            }

            return null;
        },
        /**
         * Get report viewer report parameter
         *
         * @function $.forerunner.reportViewerEZ#getReportParameter
         * 
         * @return {Object} - report viewer report parameter jQuery object
         */
        getReportParameter: function () {
            var me = this;
            if (me.DefaultAppTemplate) {
                return me.DefaultAppTemplate.$rightpanecontent;
            }

            return null;
        },
        /**
         * Get report viewer
         *
         * @function $.forerunner.reportViewerEZ#getReportViewer
         * 
         * @return {Object} - report viewer jQuery object
         */
        getReportViewer: function () {
            var me = this;

            if (me.DefaultAppTemplate) {
                var $viewer = me.DefaultAppTemplate.$mainsection.find(".fr-layout-reportviewer");
                if ($viewer.length !== 0) {
                    return $viewer;
                }
            }

            return null;
        },
        /**
         * Get report viewer toolbar
         *
         * @function $.forerunner.reportViewerEZ#getToolbar
         * 
         * @return {Object} - report viewer toolbar jQuery object
         */
        getToolbar: function () {
            var me = this;
            if (me.DefaultAppTemplate) {
                return me.DefaultAppTemplate.$mainheadersection;
            }

            return null;
        },
        /**
         * Get report viewer toolpane
         *
         * @function $.forerunner.reportViewerEZ#getToolPane
         * 
         * @return {Object} - report viewer toolpane jQuery object
         */
        getToolPane: function () {
            var me = this;
            if (me.DefaultAppTemplate) {
                return me.DefaultAppTemplate.$leftpanecontent;
            }

            return null;
        },
        /**
         * Get report viewer left toolbar
         *
         * @function $.forerunner.reportViewerEZ#getLeftToolbar
         * 
         * @return {Object} - report viewer left toolbar jQuery object
         */
        getLeftToolbar: function () {
            var me = this;
            if (me.DefaultAppTemplate) {
                return me.DefaultAppTemplate.$leftheader;
            }

            return null;
        },
        /**
         * Get report viewer right toolbar
         *
         * @function $.forerunner.reportViewerEZ#getRightToolbar
         * 
         * @return {Object} - report viewer right toolbar jQuery object
         */
        getRightToolbar: function () {
            var me = this;
            if (me.DefaultAppTemplate) {
                return me.DefaultAppTemplate.$rightheader;
            }

            return null;
        },
    });  // $.widget
});  // function()
///#source 1 1 /Forerunner/ReportViewer/js/DSCredential.js
/**
 * @file Contains the datasource credential modal dialog widget.
 *
 */

// Assign or create the single globally scoped variable
var forerunner = forerunner || {};

// Forerunner SQL Server Reports
forerunner.ssr = forerunner.ssr || {};

$(function () {
    var widgets = forerunner.ssr.constants.widgets;
    var events = forerunner.ssr.constants.events;
    var locData = forerunner.localize.getLocData(forerunner.config.forerunnerFolder() + "ReportViewer/loc/ReportViewer");
    var dsCredential = locData.dsCredential;
    /**
     * Widget used to manage report datasource credential
     *
     * @namespace $.forerunner.dsCredential
     * @prop {Object} options - The options for dsCredential
     * @prop {String} options.$reportViewer - Report viewer widget
     * @prop {Object} options.$appContainer - Report page container
     *
     * @example
     * $("#dsCredential").dsCredential({
     *  $appContainer: me.$appContainer, 
     *  $reportViewer: $viewer
     * });
    */
    $.widget(widgets.getFullname(widgets.dsCredential), {
        options: {
            $reportViewer: null,
            $appContainer: null
        },
        _credentialData: null,
        _create: function () {
        },
        _init: function () {
        },
        _initBody: function () {
            var me = this;

            me.element.html("");
            me.element.off(events.modalDialogGenericSubmit);
            me.element.off(events.modalDialogGenericCancel);

            var headerHtml = forerunner.dialog.getModalDialogHeaderHtml('fr-icons24x24-dataSourceCred', dsCredential.title, "fr-dsc-cancel", "");
            var $dialog = $(
                "<div class='fr-core-dialog-innerPage fr-core-center fr-dsc-innerPage'>" +
                    headerHtml +
                    "<form class='fr-core-dialog-form fr-dsc-form'>" +
                        "<div class='fr-core-center'>" +
                            "<div class='fr-dsc-main-container'></div>" +
                            "<div class='fr-core-dialog-submit-container'>" +
                                "<div class='fr-core-center'>" +
                                    "<input name='submit' type='button' class='fr-dsc-submit-id fr-dsc-button fr-core-dialog-button' value='" + dsCredential.submit + "' />" +
                                    "<input name='reset' type='button' class='fr-dsc-reset-id fr-dsc-button fr-core-dialog-button' value='" + dsCredential.reset + "' />" +
                                "</div>" +
                            "</div>" +
                        "</div>" +
                    "</form>" +
                "</div>");

            me.element.append($dialog);
            me.$container = me.element.find(".fr-dsc-main-container");
            me.$form = me.element.find('.fr-dsc-form');

            //disable form auto submit when click enter on the keyboard
            me.$form.on("submit", function () { return false; });

            me._resetValidateMessage();

            me.element.find(".fr-dsc-cancel").on("click", function () {
                me.closeDialog();
                if (me._credentialData) {
                    me._createRows();
                }
            });

            me.element.find(".fr-dsc-reset-id").on("click", function () {
                me._resetCredential();
            });

            me.element.find(".fr-dsc-submit-id").on("click", function () {
                me._submitCredential();
            });

            me.element.on(events.modalDialogGenericSubmit, function () {
                me._submitCredential();
            });

            me.element.on(events.modalDialogGenericCancel, function () {
                me.closeDialog();
            });

            if (me.options.$reportViewer) {
                me._initCallback();
            }
        },
        _createRows: function (credentials) {
            var me = this;
            credentials = credentials || me._credentialData;
            me.$container.html("");

            $.each(credentials, function (index, credential) {
                var $item = $(
                  "<div class='fr-dsc-item-container' name='" + credential.DataSourceID + "'>" +
                      "<div class='fr-dsc-prompt'>" +
                          "<div>" + credential.Name + " - " + credential.Prompt + "</div>" +
                      "</div>" +
                      "<div class='fr-dsc-username'>" +
                          "<label class='fr-dsc-label' >" + dsCredential.username + "</label>" +
                          "<div class='fr-dsc-input-container'>" +
                              "<input type='text' autocomplete='off' name='" + credential.Name + "-username' required='true' class='fr-dsc-text-input fr-dsc-username-input' />" +
                              "<span class='fr-dsc-error-span' />" +
                          "</div>" +
                      "</div>" +
                      "<div class='fr-dsc-password'>" +
                          "<label class='fr-dsc-label' >" + dsCredential.password + "</label>" +
                          "<div class='fr-dsc-input-container'>" +
                              "<input type='password' autocomplete='off' name='" + credential.Name + "-password' required='true' class='fr-dsc-text-input fr-dsc-password-input' />" +
                              "<span class='fr-dsc-error-span' />" +
                          "</div>" +
                      "</div>" +
                  "</div>");
                
                me.$container.append($item);
            });

            me._validateForm(me.$form);
        },
        _initCallback: function () {
            var me = this;

            me.options.$reportViewer.on(events.reportViewerRenderError(), function (e, data) {
                //highlight error datasource label by change color to red
                var error = data.Exception.Message.match(/[“"']([^"“”']*)["”']/);
                if (error && me._credentialData) {
                    var datasourceID = error[0].replace(/["“”']/g, '');
                    me.element.find("[name='" + datasourceID + "']").find(".fr-dsc-label").addClass("fr-dsc-label-error");
                    me.openDialog();
                }
            });
        },
        _submitCredential: function () {
            var me = this;

            var credentialList = me.getCredentialList();
            if (credentialList) {
                me.options.$reportViewer.reportViewer("loadReportWithCustomDSCredential", credentialList);
                me.closeDialog();

                me.element.find(".fr-dsc-label-error").removeClass("fr-dsc-label-error");
            }
        },
        /**
         * Open datasource credential dialog
         *
         * @function $.forerunner.dsCredential#openDialog
         */
        openDialog: function () {
            var me = this;
            forerunner.dialog.showModalDialog(me.options.$appContainer, me);
        },
        /**
         * Create datasource credential dialog 
         *
         * @function $.forerunner.dsCredential#writeDialog
         *
         * @param {Object} credentials - Report service returned datasource credential data
         */
        writeDialog: function (credentials) {
            var me = this;
            me._initBody();
            me._credentialData = credentials || me._credentialData;
            
            if (me._credentialData) {
                me._createRows(me._credentialData);
            }
        },
        /**
         * Close datasource credential dialog
         *
         * @function $.forerunner.dsCredential#closeDialog
         */
        closeDialog: function () {
            var me = this;
            forerunner.dialog.closeModalDialog(me.options.$appContainer, me);
        },
        /**
         * Reset datasource credential dialog
         *
         * @function $.forerunner.dsCredential#resetSavedCredential
         *
         * @param {Object} credentials - Datasource credential data
         * @param {Object} savedCredential - Widget saved datasource credential
         */
        resetSavedCredential: function (credentials, savedCredential) {
            var me = this;

            if (credentials) {
                me._initBody();
                me._createRows(credentials);
            }
            if (savedCredential) {
                var savedData = JSON.parse(savedCredential);
                
                $.each(savedData.CredentialList, function (index, data) {
                    var targetContainer = me.element.find("[name='" + data.DataSourceID + "']");
                    targetContainer.find(".fr-dsc-username-input").val(data.Username);
                    targetContainer.find(".fr-dsc-password-input").val(data.Password);
                });
            }
        },
        _resetCredential: function () {
            var me = this;
            me.element.find(".fr-dsc-text-input").val("");
        },
        /**
         * Get user input credential JSON string 
         *
         * @function $.forerunner.dsCredential#getCredentialList
         *
         * @return {String} If form valid return credential JSON string, if not return null
         */
        getCredentialList: function () {
            var me = this;
            if (me.$form.valid()) {
                var credentialList = [];
                var containers = me.options.$appContainer.find(".fr-dsc-item-container");

                $.each(containers, function (index, container) {
                    var dsID = $(container).attr("name");
                    var un = $(container).find(".fr-dsc-username-input").val();
                    var pwd = $(container).find(".fr-dsc-password-input").val();

                    credentialList.push({ DataSourceID: dsID, Username: un, Password: pwd });
                });
                return JSON.stringify({ "CredentialList": credentialList });
            }
            return null;
        },
        _validateForm: function (form) {
            form.validate({
                
                errorPlacement: function (error, element) {
                    error.appendTo($(element).parent().find(".fr-dsc-error-span"));
                },
                highlight: function (element) {
                    $(element).parent().find(".fr-dsc-error-span").addClass("fr-dsc-error-position");
                    $(element).addClass("fr-dsc-error");
                },
                unhighlight: function (element) {
                    $(element).parent().find(".fr-dsc-error-span").removeClass("fr-dsc-error-position");
                    $(element).removeClass("fr-dsc-error");
                }
            });
        },
        _resetValidateMessage: function () {
            var me = this;
            var error = locData.validateError;

            jQuery.extend(jQuery.validator.messages, {
                required: error.required,
                number: error.number,
                digits: error.digits
            });
        },
        /**
         * Removes the dsCredential functionality completely. This will return the element back to its pre-init state.
         *
         * @function $.forerunner.dsCredential#destroy
         */
        destroy: function () {
            var me = this;
            me._credentialData = null;

            this._destroy();
        },
    }); //$.widget
}); // $(function())
///#source 1 1 /Forerunner/ReportExplorer/js/ReportExplorerEZ.js
/**
 * @file Contains the reportExplorer widget.
 *
 */

var forerunner = forerunner || {};
forerunner.ssr = forerunner.ssr || {};
forerunner.ssr.tools = forerunner.ssr.tools || {};
forerunner.ssr.tools.reportExplorerToolbar = forerunner.ssr.tools.reportExplorerToolbar || {};

$(function () {
    var widgets = forerunner.ssr.constants.widgets;
    var events = forerunner.ssr.constants.events;
    var rtb = forerunner.ssr.tools.reportExplorerToolbar;
    var rtp = forerunner.ssr.tools.reportExplorerToolpane;
    var locData = forerunner.localize.getLocData(forerunner.config.forerunnerFolder() + "ReportViewer/loc/ReportViewer");
    var viewToBtnMap = {
        catalog: rtb.btnHome.selectorClass,
        favorites: rtb.btnFav.selectorClass,
        recent: rtb.btnRecent.selectorClass,
    };

    var viewToItemMap = {
        catalog: rtp.itemHome.selectorClass,
        favorites: rtp.itemFav.selectorClass,
        recent: rtp.itemRecent.selectorClass,
    };

    /**
     * Widget used to explore available reports and launch the Report Viewer
     *
     * @namespace $.forerunner.reportExplorerEZ
     * @prop {Object} options - The options for reportExplorerEZ
     * @prop {Object} options.navigateTo - Optional, Callback function used to navigate to a selected report
     * @prop {Object} options.historyBack - Optional,Callback function used to go back in browsing history
	 * @prop {Boolean} options.isFullScreen - Optional,Indicate is full screen mode default by true
	 * @prop {Object} options.explorerSettings - Optional,Object that stores custom explorer style settings
     * @prop {String} options.rsInstance - Optional,Report service instance name
     * @example
     * $("#reportExplorerEZId").reportExplorerEZ();
     */
    $.widget(widgets.getFullname(widgets.reportExplorerEZ), /** @lends $.forerunner.reportExplorerEZ */ {
        options: {
            navigateTo: null,
            historyBack: null,
            isFullScreen: true,
            explorerSettings: null,
            rsInstance: null,
        },
        _createReportExplorer: function (path, view, showmainesection) {
            var me = this;
            var path0 = path;
            var layout = me.DefaultAppTemplate;

            if (!path)
                path = "/";
            if (!view)
                view = "catalog";

            var currentSelectedPath = layout._selectedItemPath;// me._selectedItemPath;
            layout.$mainsection.html(null);
            if (showmainesection)
                layout.$mainsection.show();
            else
                layout.$mainsection.hide();
            layout.$docmapsection.hide();
            me.$reportExplorer = layout.$mainsection.reportExplorer({
                reportManagerAPI: forerunner.config.forerunnerAPIBase() + "ReportManager",
                forerunnerPath: forerunner.config.forerunnerFolder(),
                path: path,
                view: view,
                selectedItemPath: currentSelectedPath,
                navigateTo: me.options.navigateTo,
                $appContainer: layout.$container,
                explorerSettings: me.options.explorerSettings,
                rsInstance: me.options.rsInstance,
                onInputFocus: layout.onInputFocus,
                onInputBlur: layout.onInputBlur,
                userSettings: me._getUserSettings()
            });
        },

        // Initalize our internal navigateTo processing
        _initNavigateTo: function () {
            var me = this;

            // Assign the default navigateTo handler
            me.options.navigateTo = function (action, path) {
                me._navigateTo.apply(me, arguments);
            };

            // Create the forerunner router widget
            me.router = $({}).router({
                routes: {
                    "": "transitionToReportManager",
                    "explore/:path": "transitionToReportManager",
                    "browse/:path": "transitionToReportViewer",
                    "view/:args": "transitionToReportViewerWithRSURLAccess",
                    "open/:path": "transitionToOpenResource",
                    "openDashboard/:path": "transitionToOpenDashboard",
                    "search/:keyword": "transitionToSearch",
                    "favorites": "transitionToFavorites",
                    "recent": "transitionToRecent",
                    "editDashboard/:path": "transitionToEditDashboard",
                    "searchfolder/:path": "transitionToSearchFolder"
                }
            });

            // Hook the router route event
            me.router.on(events.routerRoute(), function (event, data) {
                me._onRoute.apply(me, arguments);
                me._generateRouteLink.apply(me, arguments);
            });

            if (!me.options.historyBack) {
                // Assign the default history back handler
                me.options.historyBack = function () {
                    window.history.back();
                };
            }

            forerunner.history.history("start");
        },
        _onRoute: function (event, data) {
            var me = this;
            var path, args, keyword, name;
            path = args = keyword = name = data.args[0];

            me._routeAction = null;
            
            if (data.name === "transitionToReportManager") {
                me.transitionToReportManager(path, null);
            } else if (data.name === "transitionToReportViewer") {
                var parts = path.split("?");
                path = parts[0];
                var params = parts.length > 1 ? forerunner.ssr._internal.getParametersFromUrl(parts[1]) : null;
                if (params) params = JSON.stringify({ "ParamsList": params });
                me.transitionToReportViewer(path, params);
            } else if (data.name === "transitionToReportViewerWithRSURLAccess") {
                var startParam = args.indexOf("&");
                var reportPath = startParam > 0 ? args.substring(1, startParam) : args;
                var RSURLParams = startParam > 0 ? args.substring(startParam + 1) : null;
                if (RSURLParams) RSURLParams = RSURLParams.length > 0 ? forerunner.ssr._internal.getParametersFromUrl(RSURLParams) : null;
                if (RSURLParams) RSURLParams = JSON.stringify({ "ParamsList": RSURLParams });
                me.transitionToReportViewer(reportPath, RSURLParams);
            } else if (data.name === "transitionToOpenResource") {
                me.transitionToReportManager(path, "resource");
            } else if (data.name === "transitionToSearch") {
                me.transitionToReportManager(keyword, "search");
                me._routeAction = "search";
            } else if (data.name === "transitionToFavorites") {
                me.transitionToReportManager(null, "favorites");
                me._routeAction = "favorite";
            } else if (data.name === "transitionToRecent") {
                me.transitionToReportManager(null, "recent");
                me._routeAction = "recent";
            } else if (data.name === "transitionToSearchFolder") {
                me.transitionToReportManager(path, "searchfolder");
            } else if (data.name === "transitionToEditDashboard") {
                me.transitionToEditDashboard(path);
            } else if (data.name == "transitionToOpenDashboard") {
                me.transitionToOpenDashboard(path);
            }
        },
        _lastAction: null,
        _navigateTo: function (action, path) {
            var me = this;
            
            if (path !== null) {
                path = encodeURIComponent(path);
            }

            if (action === "home") {
                me.router.router("navigate", "#", { trigger: true, replace: false });
            } else if (action === "back") {
                me.options.historyBack();
            } else if (action === "favorites") {
                me.router.router("navigate", "#favorites", { trigger: true, replace: false });
            } else if (action === "recent") {
                me.router.router("navigate", "#recent", { trigger: true, replace: false });
            } else {
                var targetUrl = "#" + action + "/" + path;
                me.router.router("navigate", targetUrl, { trigger: true, replace: false });
            }
            me._lastAction = action;
        },
        _generateRouteLink: function (event, data) {
            var me = this;

            var $linksection = me.DefaultAppTemplate.$linksection;
            //clear prior route link
            $linksection.html("");
            var path = data.args[0];
            me._getLink(path, $linksection, 0);

            me._linkResize($linksection);
        },
        _getLink: function (path, $container, index) {
            var me = this,
                parentPath = (path === "/" ? null : forerunner.helper.getParentPath(path)),
                name = (forerunner.helper.getCurrentItemName(path) || locData.toolbar.home),
                $link = new $("<span />"),
                $arrowTag,
                $forerunnerViewLink,
                forerunerViewText;

            $link.addClass("fr-location-link");
            index++;
            if (parentPath === null) {
                $link.text(locData.toolbar.home);
                $link.on("click", function () { me._navigateTo("home"); });
                $container.append($link);

                if (me._routeAction) {
                    $arrowTag = new $("<span/>");
                    $arrowTag.text(" > ");
                    $container.append($arrowTag);
                    //Add special handle for search, favorite, recent views
                    $forerunnerViewLink = new $("<span />");
                    $forerunnerViewLink.addClass("fr-location-link-last");

                    switch (me._routeAction) {
                        case "search":
                            forerunerViewText = locData.toolbar.search;
                            break;
                        case "favorite":
                            forerunerViewText = locData.toolbar.favorites;
                            break;
                        case "recent":
                            forerunerViewText = locData.toolbar.recent;
                            break;
                    }

                    $forerunnerViewLink.text(forerunerViewText);
                    $container.append($forerunnerViewLink);
                }
                
                return;
            }
            else {
                me._getLink(parentPath, $container);
            }

            $arrowTag = new $("<span/>");
            $arrowTag.text(" > ");

            $link.text(name);
            if (index !== 1) {
                $link.on("click", function () {
                    //only report folder can be selected in the path, so always pass explore to do the route
                    me._navigateTo("explore", path);
                });
            }
            else {
                $link.addClass("fr-location-link-last");
            }

            $container.append($arrowTag).append($link);
        },
        //compare link section and container width, ellipsis long word to only keep 10 characters.
        _linkResize: function ($linksection) {
            var me = this;

            var $lastLink = $linksection.find(".fr-location-link-last"),
                text,
                newText;

            if ($lastLink.length && ($lastLink.offset().left + $lastLink.width()) > $linksection.width()) {
                //get the last not ellipsis link
                var $link = $linksection.find(".fr-location-link:not(.fr-link-ellipsis):last");
                if ($link.length === 0) return;//stop ellisis if all links have been ellipsis

                text = $link.text();
                if (text.length > 10) {
                    newText = text.substring(0, 10) + "..";
                }
                $link.addClass("fr-link-ellipsis").text(newText);

                me._linkResize($linksection);
            }
        },
        /**
         * Transition to ReportManager view.
         *
         * @function $.forerunner.reportExplorerEZ#transitionToReportManager
         * @param {String} path - The explorer path to display.  Null for favorites and recent views.
         * @param {String} view - The view to display.  Valid values are null, favorites and recent.  Null is simply the report manager.
         */
        transitionToReportManager: function (path, view) {
            var me = this;
            var path0 = path;
            var layout = me.DefaultAppTemplate;
            if (layout.$mainsection.html() !== "" && layout.$mainsection.html() !== null) {
                layout.$mainsection.html("");
                layout.$mainsection.hide();
            }
            
            layout.cleanUp();
            forerunner.device.allowZoom(false);
            forerunner.dialog.closeAllModalDialogs(layout.$container);

            //Android and iOS need some time to clean prior scroll position, I gave it a 50 milliseconds delay
            //To resolved bug 494 on android
            var timeout = forerunner.device.isWindowsPhone() ? 500 : forerunner.device.isTouch() ? 50 : 0;
            setTimeout(function () {
                me._createReportExplorer(path, view, true);

                var $toolbar = layout.$mainheadersection;
                //add this class to distinguish explorer toolbar and viewer toolbar
                $toolbar.addClass("fr-explorer-tb").removeClass("fr-viewer-tb");
                $toolbar.reportExplorerToolbar({
                    navigateTo: me.options.navigateTo,
                    $appContainer: layout.$container,
                    $reportExplorer: me.$reportExplorer
                });

                $toolbar.reportExplorerToolbar("setFolderBtnActive", viewToBtnMap[view]);
                if (view === "search") {
                    $toolbar.reportExplorerToolbar("setSearchKeyword", path);
                }

                var $lefttoolbar = layout.$leftheader;
                if ($lefttoolbar !== null) {
                    $lefttoolbar.leftToolbar({ $appContainer: layout.$container });
                }

                var $toolpane = layout.$leftpanecontent;
                $toolpane.reportExplorerToolpane({
                    navigateTo: me.options.navigateTo,
                    $appContainer: layout.$container,
                    $reportExplorer: me.$reportExplorer
                });

                $toolpane.reportExplorerToolpane("setFolderItemActive", viewToItemMap[view]);
                if (view === "search") {
                    $toolpane.reportExplorerToolpane("setSearchKeyword", path);
                }

                me._setLeftRightPaneStyle();

                layout._selectedItemPath = path0; //me._selectedItemPath = path0;
                var explorer = $(".fr-report-explorer", me.$reportExplorer);
                me.element.css("background-color", explorer.css("background-color"));
            }, timeout);
        },
        _setLeftRightPaneStyle: function () {
            var me = this;
            var layout = me.DefaultAppTemplate;

            var routeLinkSectionHeight = layout.$linksection.outerHeight();//default to 18px
            var toolpaneheaderheight = layout.$topdiv.height() - routeLinkSectionHeight; //equal toolbar height

            var offset = forerunner.device.isWindowsPhone() ? 0 : routeLinkSectionHeight;// window phone 7 get top property wrong

            layout.$rightheader.css({ height: toolpaneheaderheight, top: offset });
            layout.$leftheader.css({ height: toolpaneheaderheight, top: offset });
            layout.$rightheaderspacer.height(toolpaneheaderheight);
            layout.$leftheaderspacer.height(toolpaneheaderheight);

            if (forerunner.device.isWindowsPhone()) {
                layout.$leftpanecontent.css({ top: toolpaneheaderheight });
                layout.$rightpanecontent.css({ top: toolpaneheaderheight });
            }
        },
        _getUserSettings: function () {
            var me = this;
            return forerunner.ajax.getUserSetting(me.options.rsInstance);
        },
        /**
         * Transition to ReportViewer view
         *
         * @function $.forerunner.reportExplorerEZ#transitionToReportView
         * @param {String} path - The report path to display.
         */
        transitionToReportViewer: function (path, params) {
            var me = this;
            var layout = me.DefaultAppTemplate;
            layout.$mainsection.html("");
            layout.$mainsection.hide();
            forerunner.dialog.closeAllModalDialogs(layout.$container);

            //add this class to distinguish explorer toolbar and viewer toolbar
            var $toolbar = layout.$mainheadersection;
            $toolbar.addClass("fr-viewer-tb").removeClass("fr-explorer-tb");

            layout._selectedItemPath = null;
            //Android and iOS need some time to clean prior scroll position, I gave it a 50 milliseconds delay
            //To resolved bug 909, 845, 811 on iOS
            var timeout = forerunner.device.isWindowsPhone() ? 500 : forerunner.device.isTouch() ? 50 : 0;
            setTimeout(function () {
                layout.$mainviewport.reportViewerEZ({
                    DefaultAppTemplate: layout,
                    path: path,
                    navigateTo: me.options.navigateTo,
                    historyBack: me.options.historyBack,
                    isReportManager: true,
                    rsInstance: me.options.rsInstance,
                    savedParameters: params,
                    userSettings: me._getUserSettings()
                });

                var $reportViewer = layout.$mainviewport.reportViewerEZ("getReportViewer");
                if ($reportViewer && path !== null) {
                    path = String(path).replace(/%2f/g, "/");
                    $reportViewer.reportViewer("loadReport", path, 1, params);
                    layout.$mainsection.fadeIn("fast");
                }

                me._setLeftRightPaneStyle();

            }, timeout);

            me.element.css("background-color", "");
        },
        _transitionToDashboard: function (path, enableEdit) {
            var me = this;
            var layout = me.DefaultAppTemplate;

            layout.$mainsection.html("");
            forerunner.dialog.closeAllModalDialogs(me.DefaultAppTemplate.$container);

            me.DefaultAppTemplate._selectedItemPath = null;
            //Android and iOS need some time to clean prior scroll position, I gave it a 50 milliseconds delay
            //To resolved bug 909, 845, 811 on iOS
            var timeout = forerunner.device.isWindowsPhone() ? 500 : forerunner.device.isTouch() ? 50 : 0;
            setTimeout(function () {
                var $dashboardEZ = me.DefaultAppTemplate.$mainviewport.dashboardEZ({
                    DefaultAppTemplate: layout,
                    navigateTo: me.options.navigateTo,
                    historyBack: me.options.historyBack,
                    isReportManager: true,
                    enableEdit: enableEdit,
                    path: path,
                    rsInstance: me.options.rsInstance,
                    userSettings: me._getUserSettings()
                });

                var $dashboardEditor = $dashboardEZ.dashboardEZ("getDashboardEditor");
                $dashboardEditor.dashboardEditor("openDashboard", path, enableEdit);
                $dashboardEZ.dashboardEZ("enableEdit", enableEdit);
                me._setLeftRightPaneStyle();
                layout.$mainsection.fadeIn("fast");
            }, timeout);

            me.element.css("background-color", "");
        },
        /**
         * Transition to Open Dashboard view
         *
         * @function $.forerunner.reportExplorerEZ#transitionToOpenDashboard
         * @param {String} path - Fully qualified path to the dashboard
         */
        transitionToOpenDashboard: function (path) {
            var me = this;
            me._transitionToDashboard(path, false);
        },
        /**
         * Transition to Create Dashboard view
         *
         * @function $.forerunner.reportExplorerEZ#transitionToEditDashboard
         * @param {String} path - Fully qualified path to the dashboard
         */
        transitionToEditDashboard: function (path) {
            var me = this;
            me._transitionToDashboard(path, true);
        },
        _init: function () {
            var me = this;
            me.DefaultAppTemplate = new forerunner.ssr.DefaultAppTemplate({ $container: me.element, isFullScreen: me.isFullScreen }).render();

            if (!me.options.navigateTo) {
                me._initNavigateTo();
            }
        },
        /**
         * Get report explorer
         *
         * @function $.forerunner.reportExplorerEZ#getReportExplorer
         * 
         * @return {Object} - report explorer jQuery object
         */
        getReportExplorer: function () {
            var me = this;
            return me.$reportExplorer;
        },
        /**
         * Get report explorer toolbar
         *
         * @function $.forerunner.reportExplorerEZ#getReportExplorerToolbar
         * 
         * @return {Object} - report explorer toolbar jQuery object
         */
        getReportExplorerToolbar: function () {
            var me = this;
            if (me.DefaultAppTemplate) {
                return me.DefaultAppTemplate.$mainheadersection;
            }

            return null;
        },
        /**
         * Get report explorer toolpane
         *
         * @function $.forerunner.reportExplorerEZ#getReportExplorerToolpane
         * 
         * @return {Object} - report explorer toolpane jQuery object
         */
        getReportExplorerToolpane: function () {
            var me = this;
            if (me.DefaultAppTemplate) {
                return me.DefaultAppTemplate.$leftpanecontent;
            }

            return null;
        }
    });  // $.widget
});  // function()
///#source 1 1 /Forerunner/ReportExplorer/js/CreateDashboard.js
/**
 * @file Contains the print widget.
 *
 */

// Assign or create the single globally scoped variable
var forerunner = forerunner || {};

// Forerunner SQL Server Reports
forerunner.ssr = forerunner.ssr || {};

$(function () {
    var widgets = forerunner.ssr.constants.widgets;
    var events = forerunner.ssr.constants.events;
    var locData = forerunner.localize.getLocData(forerunner.config.forerunnerFolder() + "ReportViewer/loc/ReportViewer");
    var createDashboard = locData.createDashboard;
    var ssr = forerunner.ssr;

    /**
     * Widget used to select a new dashboard template
     *
     * @namespace $.forerunner.createDashboard
     * @prop {Object} options - The options for the create dashboard dialog
     * @prop {String} options.$reportExplorer - Report viewer widget
     * @prop {Object} options.$appContainer - Report page container
     * @prop {Object} options.parentFolder - Folder that this resource should be created in
     * @prop {String} options.reportManagerAPI - Optional, Path to the REST calls for the reportManager
     * @prop {String} options.rsInstance - Optional, Report service instance name
     *
     * @example
     * $("#createDashboardDialog").createDashboard({
     *     $appContainer: me.options.$appContainer,
     *     $reportExplorer: me.element,
     *     parentFolder: me.lastFetched,
     * });
     */
    $.widget(widgets.getFullname(widgets.createDashboard), {
        options: {
            $reportExplorer: null,
            $appContainer: null,
            parentFolder: null,
            reportManagerAPI: forerunner.config.forerunnerAPIBase() + "ReportManager/",
            rsInstance: null
        },
        _createOptions: function() {
            var me = this;

            me.$select = me.element.find(".fr-cdb-template-name")

            var dashboards = forerunner.localize.getLocData(forerunner.config.forerunnerFolder() + "Dashboard/dashboards/dashboards");
            var templates = dashboards.templates;
            for (item in templates) {
                var $option = $("<option value=" + item + ">" + templates[item] + "</option>");
                me.$select.append($option);
            }
        },
        _init: function () {
            var me = this;
            // Reinitialize the fields
            me.$dashboardName.val("");
            me.$overwrite.prop({ checked: false });
        },
        _create: function () {
            var me = this;

            me.element.html("");
            me.element.off(events.modalDialogGenericSubmit);
            me.element.off(events.modalDialogGenericCancel);

            var headerHtml = forerunner.dialog.getModalDialogHeaderHtml("fr-icons24x24-createdashboard", createDashboard.title, "fr-cdb-cancel", "");
            var $dialog = $(
                "<div class='fr-core-dialog-innerPage fr-core-center'>" +
                    headerHtml +
                    "<form class='fr-cdb-form fr-core-dialog-form'>" +
                        // Dashboard Name
                        "<table>" +
                            "<tr>" +
                                "<td>" +
                                    "<label class='fr-cdb-label'>" + createDashboard.dashboardName + "</label>" +
                                "</td>" +
                                "<td>" +
                                    // Dashboard name
                                    "<input class='fr-cdb-dashboard-name fr-cdb-input' autofocus='autofocus' type='text' placeholder='" + createDashboard.namePlaceholder + "' required='true'/><span class='fr-cdb-error-span'/>" +
                                "</td>" +
                            "</tr>" +
                            "<tr>" +
                                "<td>" +
                                    "<label class='fr-cdb-label'>" + createDashboard.dashboardTemplate + "</label>" +
                                "</td>" +
                                "<td>" +
                                    // Layout Template 
                                    "<select class='fr-cdb-template-name fr-cdb-input'>" +
                                    "</select>" +
                                "</td>" +
                            "</tr>" +
                            "<tr>" +
                                "<td>" +
                                    "<label class='fr-cdb-label'>" + createDashboard.overwrite + "</label>" +
                                "</td>" +
                                "<td>" +
                                    "<input class='fr-cdb-overwrite-id fr-cdb-overwrite-checkbox' type='checkbox'/>" +
                                "</td>" +
                            "</tr>" +
                        "</table>" +
                        // Submit button
                        "<div class='fr-core-dialog-submit-container'>" +
                            "<div class='fr-core-center'>" +
                                "<input name='submit' autofocus='autofocus' type='button' class='fr-cdb-submit-id fr-core-dialog-submit fr-core-dialog-button' value='" + createDashboard.submit + "' />" +
                            "</div>" +
                        "</div>" +
                    "</form>" +
                "</div>");

            me.element.append($dialog);

            me._createOptions();

            me.$form = me.element.find(".fr-cdb-form");
            me._validateForm(me.$form);
            //disable form auto submit when click enter on the keyboard
            me.$form.on("submit", function () { return false; });

            me.$dashboardName = me.element.find(".fr-cdb-dashboard-name");
            me.$overwrite = me.element.find(".fr-cdb-overwrite-id");

            me.element.find(".fr-cdb-cancel").on("click", function(e) {
                me.closeDialog();
            });

            me.element.find(".fr-cdb-submit-id").on("click", function (e) {
                me._submit();
            });

            me.element.on(events.modalDialogGenericSubmit, function () {
                me._submit();
            });

            me.element.on(events.modalDialogGenericCancel, function () {
                me.closeDialog();
            });
        },
        _submit: function () {
            var me = this;

            if (!me.$form.valid()) {
                return;
            }

            var templateName = me.$select.val();
            var dashboardName = me.$dashboardName.val();

            // Save the dashboard
            me.model = new ssr.DashboardModel({
                $appContainer: me.options.$appContainer,
                reportManagerAPI: me.options.reportManagerAPI,
                rsInstance: me.options.rsInstance
            });

            // Load the selected template into the dashboard definition
            me.model.loadTemplate(templateName);

            // Save the model and navigate to editDashboard
            var overwrite = me.$overwrite.prop("checked");
            if (me.model.save(overwrite, me.options.parentFolder, dashboardName)) {
                // Call navigateTo to bring up the create dashboard view
                var navigateTo = me.options.$reportExplorer.reportExplorer("option", "navigateTo");
                var path = me.options.parentFolder + dashboardName;
                navigateTo("editDashboard", path);

                me.closeDialog();
                return;
            }

            forerunner.dialog.showMessageBox(me.options.$appContainer, locData.messages.createFailed, createDashboard.title);
        },
        /**
         * Open parameter set dialog
         *
         * @function $.forerunner.createDashboard#openDialog
         */
        openDialog: function () {
            var me = this;
            forerunner.dialog.showModalDialog(me.options.$appContainer, me);
        },
        /**
         * Close parameter set dialog
         *
         * @function $.forerunner.manageParamSets#closeDialog
         */
        closeDialog: function () {
            var me = this;
            forerunner.dialog.closeModalDialog(me.options.$appContainer, me);
        },
        _validateForm: function (form) {
            form.validate({
                errorPlacement: function (error, element) {
                    error.appendTo($(element).parent().find("span"));
                },
                highlight: function (element) {
                    $(element).parent().find("span").addClass("fr-cdb-error-position");
                    $(element).addClass("fr-cdb-error");
                },
                unhighlight: function (element) {
                    $(element).parent().find("span").removeClass("fr-cdb-error-position");
                    $(element).removeClass("fr-cdb-error");
                }
            });
        },
        _resetValidateMessage: function () {
            var me = this;
            var error = locData.validateError;

            jQuery.extend(jQuery.validator.messages, {
                required: error.required,
                number: error.number,
                digits: error.digits
            });
        },
    }); //$.widget
});
///#source 1 1 /Forerunner/ReportViewer/js/EmailSubscription.js
// Assign or create the single globally scoped variable
var forerunner = forerunner || {};

// Forerunner SQL Server Reports objects
forerunner.ajax = forerunner.ajax || {};
forerunner.ssr = forerunner.ssr || {};
forerunner.ssr.constants = forerunner.ssr.constants || {};
forerunner.ssr.constants.events = forerunner.ssr.constants.events || {};

$(function () {
    var ssr = forerunner.ssr;
    var events = ssr.constants.events;
    var widgets = forerunner.ssr.constants.widgets;
    var locData = forerunner.localize.getLocData(forerunner.config.forerunnerFolder() + "ReportViewer/loc/ReportViewer");

    $.widget(widgets.getFullname(widgets.emailSubscription), {
        options: {
            reportPath: null,
            $appContainer: null,
            subscriptionModel: null,
            paramList: null
        },
        _extensionSettings: null,
        _createDropDownForValidValues : function(validValues) {
            return forerunner.helper.createDropDownForValidValues(validValues);
        },
        _createRadioButtonsForValidValues : function(validValues, index) {
            return forerunner.helper.createRadioButtonsForValidValues(validValues, index);
        },
        _createDiv: function (listOfClasses) {
            var $div = new $("<div />");
            for (var i = 0; i < listOfClasses.length; i++) {
                $div.addClass(listOfClasses[i]);
            }
            return $div;
        },
        _createDropDownWithLabel: function (label, validValues) {
            var me = this;
            var id = forerunner.helper.guidGen();
            var $label = new $("<LABEL />");
            $label.attr("for", id);
            $label.append(label);
            $retVal = me._createDropDownForValidValues(validValues);
            $retVal.attr("id", id);
            return $retVal;
        },
        _subscriptionData: null,
        _canEditComment: false,
        _setSubscriptionOrSetDefaults : function() {
            var me = this;
            var subscriptionID = me._subscriptionID;

            $.when(me._initExtensionOptions(), me._initProcessingOptions()).done(function (data1, data2) {
                me._extensionSettings = data1;
                me._initRenderFormat(data1[0]);
                me._initSharedSchedule(data2[0]);
                me.$includeReport.prop('checked', true);
                me.$includeLink.prop('checked', true);
                if (subscriptionID) {
                    var subscriptionInfo = me.options.subscriptionModel.subscriptionModel("getSubscription", subscriptionID);

                    me.$desc.val(subscriptionInfo.Description);
                    me._subscriptionData = subscriptionInfo;

                    var extensionSettings = subscriptionInfo.ExtensionSettings;
                    for (var i = 0; i < extensionSettings.ParameterValues.length; i++) {
                        if (extensionSettings.ParameterValues[i].Name === "TO") {
                            me.$to.attr("value", extensionSettings.ParameterValues[i].Value);
                        }
                        if (extensionSettings.ParameterValues[i].Name === "Subject") {
                            me.$subject.attr("value", extensionSettings.ParameterValues[i].Value);
                        }
                        if (extensionSettings.ParameterValues[i].Name === "Comment") {
                            me.$comment.val(extensionSettings.ParameterValues[i].Value);
                        }
                        if (extensionSettings.ParameterValues[i].Name === "IncludeReport") {
                            if (extensionSettings.ParameterValues[i].Value === "True") {
                                me.$includeReport.prop('checked', true);
                            } else {
                                me.$includeReport.prop('checked', false);
                            }
                        }
                        if (extensionSettings.ParameterValues[i].Name === "IncludeLink") {
                            if (extensionSettings.ParameterValues[i].Value === "True") {
                                me.$includeLink.prop('checked', true);
                            } else {
                                me.$includeLink.prop('checked', false);
                            }
                        }
                        if (extensionSettings.ParameterValues[i].Name === "RenderFormat") {
                            me.$renderFormat.val(extensionSettings.ParameterValues[i].Value);
                        }
                    }
                    
                    me.$sharedSchedule.val(subscriptionInfo.SubscriptionSchedule.ScheduleID);
                } else {
                    if (me.options.userSettings) {
                        me.$to.attr("value", me.options.userSettings.email );
                        me.$desc.val(locData.subscription.description.format(me.options.userSettings.email));
                    }
                    me.$subject.val(locData.subscription.subject);
                }
            }); 
        },
        _getSubscriptionInfo: function() {
            var me = this;
            if (!me._subscriptionData) {
                me._subscriptionData = {}
                me._subscriptionData.SubscriptionID = null;
                me._subscriptionData.Report = me.options.reportPath;
                me._subscriptionData.SubscriptionSchedule = {}
                me._subscriptionData.SubscriptionSchedule.ScheduleID = me.$sharedSchedule.val();
                me._subscriptionData.SubscriptionSchedule.MatchData = me._sharedSchedule[me.$sharedSchedule.val()].MatchData;
                if (me._sharedSchedule[me.$sharedSchedule.val()].IsMobilizerSchedule)
                    me._subscriptionData.SubscriptionSchedule.IsMobilizerSchedule = true;
                me._subscriptionData.Description = me.$desc.val();
                me._subscriptionData.EventType = "TimedSubscription";
                me._subscriptionData.ExtensionSettings = {};
                me._subscriptionData.ExtensionSettings.Extension = "Report Server Email";
                me._subscriptionData.ExtensionSettings.ParameterValues = [];
                me._subscriptionData.ExtensionSettings.ParameterValues.push({ "Name": "TO", "Value": me.$to.val() });
                me._subscriptionData.ExtensionSettings.ParameterValues.push({ "Name": "Subject", "Value": me.$subject.val() });
                if (me._canEditComment)
                    me._subscriptionData.ExtensionSettings.ParameterValues.push({ "Name": "Comment", "Value": me.$comment.val() });
                me._subscriptionData.ExtensionSettings.ParameterValues.push({ "Name": "IncludeLink", "Value": me.$includeLink.is(':checked') ? "True" : "False" });
                me._subscriptionData.ExtensionSettings.ParameterValues.push({ "Name": "IncludeReport", "Value": me.$includeReport.is(':checked') ? "True" : "False" });
                me._subscriptionData.ExtensionSettings.ParameterValues.push({ "Name": "RenderFormat", "Value":  me.$renderFormat.val() });
            } else {
                me._subscriptionData.Report = me.options.reportPath;
                me._subscriptionData.Description = me.$desc.val();
                me._subscriptionData.SubscriptionSchedule = {}
                me._subscriptionData.SubscriptionSchedule.ScheduleID = me.$sharedSchedule.val();
                me._subscriptionData.SubscriptionSchedule.MatchData = me._sharedSchedule[me.$sharedSchedule.val()].MatchData;
                if (me._sharedSchedule[me.$sharedSchedule.val()].IsMobilizerSchedule)
                    me._subscriptionData.SubscriptionSchedule.IsMobilizerSchedule = true;
                for (var i = 0; i < me._subscriptionData.ExtensionSettings.ParameterValues.length; i++) {
                    if (me._subscriptionData.ExtensionSettings.ParameterValues[i].Name === "TO") {
                        me._subscriptionData.ExtensionSettings.ParameterValues[i].Value = me.$to.val();
                    }
                    if (me._subscriptionData.ExtensionSettings.ParameterValues[i].Name === "Subject") {
                        me._subscriptionData.ExtensionSettings.ParameterValues[i].Value = me.$subject.val();
                    }
                    if (me._canEditComment) {
                        me._subscriptionData.ExtensionSettings.ParameterValues[i].Value = me.$comment.val();
                    }
                    if (me._subscriptionData.ExtensionSettings.ParameterValues[i].Name === "IncludeLink") {
                        me._subscriptionData.ExtensionSettings.ParameterValues[i].Value = me.$includeLink.is(':checked') ? "True" : "False";
                    }
                    if (me._subscriptionData.ExtensionSettings.ParameterValues[i].Name === "IncludeReport") {
                        me._subscriptionData.ExtensionSettings.ParameterValues[i].Value = me.$includeReport.is(':checked') ? "True" : "False";
                    }
                    if (me._subscriptionData.ExtensionSettings.ParameterValues[i].Name === "RenderFormat") {
                        me._subscriptionData.ExtensionSettings.ParameterValues[i].Value = me.$renderFormat.val();
                    }
                }
            }
            if (me.options.paramList) {
                me._subscriptionData.Parameters = [];
                var paramListObj = JSON.parse(me.options.paramList);
                for (var i = 0; i < paramListObj.ParamsList.length; i++) {
                    var param = paramListObj.ParamsList[i];
                    if (param.IsMultiple === "true") {
                        for (var j = 0; j < param.Value.length; j++) {
                            me._subscriptionData.Parameters.push({ "Name": param.Parameter, "Value": param.Value[j] });
                        }
                    } else {
                        me._subscriptionData.Parameters.push({"Name": param.Parameter, "Value": param.Value});
                    }
                }
            }
            return me._subscriptionData;
        },
        _initRenderFormat : function (data) {
            var me = this;
            for (var i = 0; i < data.length; i++) {
                var setting = data[i];
                if (setting.Name == "RenderFormat") {
                    me.$renderFormat = me._createDropDownForValidValues(setting.ValidValues);
                    me.$renderFormat.val(setting.Value);
                    me.$renderFormat.addClass(".fr-email-renderformat");
                    me.$theTable.append(me._createTableRow(locData.subscription.format, me.$renderFormat));
                }
            }
        },
        _initExtensionOptions: function () {
            var me = this;
            return me.options.subscriptionModel.subscriptionModel("getExtensionSettings", "Report Server Email");
        },
        _sharedSchedule: {},
        _initSharedSchedule:function(data) {
            var me = this;
            var validValues = [];
            for (var i = 0; i < data.length; i++) {
                validValues.push({ Value: data[i].ScheduleID, Label: data[i].Name });
                me._sharedSchedule[data[i].ScheduleID] = data[i];
            }
            data = forerunner.config.getMobilizerSharedSchedule();
            if (data) {
                for (var i = 0; i < data.length; i++) {
                    validValues.push({ Value: data[i].ScheduleID, Label: data[i].Name });
                    me._sharedSchedule[data[i].ScheduleID] = data[i];
                }
            }
            me.$sharedSchedule = me._createDropDownForValidValues(validValues);
            me.$theTable.append(me._createTableRow(locData.subscription.schedule, me.$sharedSchedule));
            me.$sharedSchedule.addClass("fr-email-schedule");
        },
        _initProcessingOptions: function () {
            var me = this;
            return me.options.subscriptionModel.subscriptionModel("getSchedules");
        },
        _initSections : function () {
            var me = this;
            me._setSubscriptionOrSetDefaults();
        },
        _createInputWithPlaceHolder: function (listOfClasses, type, placeholder) {
            var me = this;
            $input = new $("<INPUT />");
            $input.attr("type", type);
            if (placeholder)
                $input.attr("placeholder", placeholder);
            for (var i = 0; i < listOfClasses.length; i++) {
                $input.addClass(listOfClasses[i]);
            }
            return $input;
        },
        _createTextAreaWithPlaceHolder: function (listOfClasses, placeholder) {
            var me = this;
            $input = new $("<TEXTAREA />");
            if (placeholder)
                $input.attr("placeholder", placeholder);
            for (var i = 0; i < listOfClasses.length; i++) {
                $input.addClass(listOfClasses[i]);
            }
            return $input;
        },
        _createTableRow: function (label, $div2) {
            var me = this;
            $row = new $("<TR/>");
            $col1 = new $("<TD/>");
            $col1.addClass("fr-sub-left-col");
            $col2 = new $("<TD/>");
            $col2.addClass("fr-sub-right-col");
            $row.append($col1)
            $row.append($col2)
            if (label)
                $col1.append(label);
            if ($div2)
                $col2.append($div2);
            return $row;
        },
        _createCheckBox: function ($div, label) {
            var me = this;
            var $cb = new $("<INPUT />");
            var id = forerunner.helper.guidGen();
            $cb.attr("type", "checkbox");
            $cb.attr("id", id);
            if ($div && label) {
                var $label = new $("<LABEL />");
                $label.attr("for", id);
                $label.append(label);
                $div.append($cb);
                $div.append($label);
            }
            return $cb;
        },
        _init : function () {
        },
        _subscriptionID: null,

        getSubscriptionList : function() {
            var me = this;
            return me.options.subscriptionModel.subscriptionModel("getSubscriptionList", me.options.reportPath);
        },
        loadSubscription: function (subscripitonID) {
            var me = this;
            me._subscriptionID = subscripitonID;
            me._subscriptionData = null;
            me.element.html("");
            me.element.off(events.modalDialogGenericSubmit);
            me.element.off(events.modalDialogGenericCancel);
            me.$outerContainer = me._createDiv(["fr-core-dialog-innerPage", "fr-core-center"]);
            var headerHtml = subscripitonID ? forerunner.dialog.getModalDialogHeaderHtml('fr-icons24x24-emailsubscription', locData.subscription.email, "fr-email-cancel", "", "fr-core-dialog-button fr-email-create-id", "") :
                forerunner.dialog.getModalDialogHeaderHtml('fr-icons24x24-emailsubscription', locData.subscription.email, "fr-email-cancel", "");

            me.$theForm = new $("<FORM />");
            me.$theForm.addClass("fr-email-form");
            me.$theForm.addClass("fr-core-dialog-form");
            me.$outerContainer.append(headerHtml);
            me.$outerContainer.append(me.$theForm);

            me.$theTable = new $("<TABLE />");
            me.$theTable.addClass("fr-email-table");
            me.$theForm.append(me.$theTable);
            me.$desc = me._createInputWithPlaceHolder(["fr-email-description"], "text", locData.subscription.description_placeholder);
            me.$theTable.append(me._createTableRow(locData.subscription.description_placeholder, me.$desc));
            me.$to = me._createInputWithPlaceHolder(["fr-email-to"], "text", locData.subscription.to_placeholder);
            me.$theTable.append(me._createTableRow(locData.subscription.to_placeholder, me.$to));
            me.$subject = me._createInputWithPlaceHolder(["fr-email-subject"], "text", locData.subscription.subject_placeholder);
            me.$theTable.append(me._createTableRow(locData.subscription.subject_placeholder, me.$subject));
            me.$includeLink = me._createCheckBox();
            me.$includeLink.addClass("fr-email-include");
            me.$includeReport = me._createCheckBox();
            me.$includeReport.addClass("fr-email-include");
            me.$theTable.append(me._createTableRow(locData.subscription.includeLink, me.$includeLink));
            me.$theTable.append(me._createTableRow(locData.subscription.includeReport, me.$includeReport));
            me.$comment = me._createTextAreaWithPlaceHolder(["fr-email-comment"], "Comment", locData.subscription.comment_placeholder);
            me.$theTable.append(me._createTableRow(locData.subscription.comment_placeholder, me.$comment));
            if (!me.options.userSettings || !me.options.userSettings.adminUI) {
                me.$subject.parent().parent().hide();
                me.$desc.parent().parent().hide();
                me.$comment.parent().parent().hide();
            }
            me._canEditComment = forerunner.ajax.hasPermission(me.options.reportPath, "Create Any Subscription").hasPermission == true;
            if (!me._canEditComment) {
                me.$comment.parent().parent().hide();
            }
            me.$lastRow = me._createTableRow();
            me.$colOfLastRow = me.$lastRow.children(":first");
            me.$theTable.append(me.$lastRow);

            me.$submitContainer = me._createDiv(["fr-email-submit-container"]);
            me.$submitButton = me._createInputWithPlaceHolder(["fr-email-submit-id", "fr-core-dialog-submit", "fr-core-dialog-button"], "button");
            me.$submitButton.val(locData.subscription.save);
            me.$submitContainer.append(me.$submitButton);
            
            
            if (subscripitonID) {
                me.$deleteButton = me._createInputWithPlaceHolder(["fr-email-delete-id", "fr-core-dialog-delete"], "button");
                me.$deleteButton.val(locData.subscription.deleteSubscription);
                me.$submitContainer.append(me.$deleteButton);
            }
            me.$theForm.append(me.$submitContainer);
            me._initSections();
            me.element.append(me.$outerContainer);

            //disable form auto submit when click enter on the keyboard
            me.$theForm.on("submit", function () { return false; });

            me.element.find(".fr-email-submit-id").on("click", function (e) {
                me._submit();
            });

            me.element.find(".fr-email-create-id").on("click", function (e) {
                me._createNew();
            });

            me.element.find(".fr-email-delete-id").on("click", function (e) {
                me._deleteMe();
            });

            me.element.find(".fr-email-cancel").on("click", function (e) {
                me.closeDialog();
            });

            me.element.on(events.modalDialogGenericSubmit, function () {
                me._submit();
            });

            me.element.on(events.modalDialogGenericCancel, function () {
                me.closeDialog();
            });
        },

        _submit : function () {
            var me = this;
            var subscriptionInfo = me._getSubscriptionInfo();
            
            me.options.subscriptionModel.subscriptionModel(
                me._subscriptionID ? "updateSubscription" : "createSubscription",
                subscriptionInfo,
                function () { me.closeDialog(); },
                function (data) {
                    forerunner.dialog.showMessageBox(me.options.$appContainer, data.Exception.Message ? data.Exception.Message : locData.subscription.saveFailed);
                });
        },

        _createNew: function () {
            var me = this;
            me.loadSubscription(null);
        },

        _deleteMe: function () {
            var me = this;
            me.options.subscriptionModel.subscriptionModel(
               "deleteSubscription",
               me._subscriptionID,
               function () { me.closeDialog(); },
               function () { forerunner.dialog.showMessageBox(me.options.$appContainer, locData.subscription.deleteFailed); });
        },
        
        openDialog: function () {
            var me = this;
            forerunner.dialog.showModalDialog(me.options.$appContainer, me);
        },
        
        closeDialog: function () {
            var me = this;
            forerunner.dialog.closeModalDialog(me.options.$appContainer, me);          
        },
        destroy: function () {
            var me = this;
            me.element.html("");
            this._destroy();
        }
    });  // $.widget(
});  // $(function ()

///#source 1 1 /Forerunner/ReportViewer/js/ManageSubscription.js
// Assign or create the single globally scoped variable
var forerunner = forerunner || {};

// Forerunner SQL Server Reports objects
forerunner.ajax = forerunner.ajax || {};
forerunner.ssr = forerunner.ssr || {};
forerunner.ssr.constants = forerunner.ssr.constants || {};
forerunner.ssr.constants.events = forerunner.ssr.constants.events || {};

$(function () {
    var ssr = forerunner.ssr;
    var events = ssr.constants.events;
    var widgets = forerunner.ssr.constants.widgets;
    var locData = forerunner.localize.getLocData(forerunner.config.forerunnerFolder() + "ReportViewer/loc/ReportViewer");

    $.widget(widgets.getFullname(widgets.manageSubscription), {
        options: {
            reportPath: null,
            $appContainer: null,
            $reportViewer: null,
            subscriptionModel: null
        },
        _subscriptionModel: null,
        _createDiv : function(listOfClasses) {
            return forerunner.helper.createDiv(listOfClasses);
        },
        _showDeletionFailure : function() {
            console.log("Deletion failed");
        },
        _createListItem: function (subInfo) {
            var me = this;
            var $listItem = new $("<DIV />");
            $listItem.addClass("fr-sub-listitem");
            $listItem.append(subInfo.Description);
            var $deleteIcon = me._createDiv(["fr-sub-icon18x18"]);
            var $editIcon = me._createDiv(["fr-sub-icon18x18"]);
            $listItem.append($deleteIcon);
            $deleteIcon.addClass("fr-sub-delete-icon");
            $deleteIcon.on("click", function () {
                me.options.subscriptionModel.subscriptionModel("deleteSubscription",
                    subInfo.SubscriptionID,
                    function () { me._renderList(); }, function () { me._showDeletionFailure(); });
            });
            $editIcon.addClass("fr-sub-edit-icon");
            $editIcon.on("click", function () {
                me._editSubscription(subInfo.SubscriptionID);
            });
            $listItem.append($editIcon);
            return $listItem;
        },
        _editSubscription: function (subscriptionID) {
            var me = this;
            me.options.$reportViewer.reportViewer("editEmailSubscription", subscriptionID);
            me.closeDialog();
        },
        _renderList: function () {
            var me = this;
            me.$listcontainer.html("");
            var $list = new $("<UL />");
            $list.addClass("fr-sub-list");
            $.when(me.options.subscriptionModel.subscriptionModel("getSubscriptionList", me.options.reportPath)).done(function (data) {
                for (var i = 0; i < data.length; i++) {
                    var subInfo = data[i];
                    var $li = new $("<LI />");
                    var $listItem = me._createListItem(subInfo);
                    $li.append($listItem);
                    $list.append($li);
                }
                me.$listcontainer.append($list);
            }).fail(
                function (data) {
                    forerunner.dialog.showMessageBox(me.options.$appContainer, locData.messages.loadSubscriptionListFailed);
                }
            );
        },

        listSubscriptions: function () {
            var me = this;
            me.element.html("");
            me.element.off(events.modalDialogGenericSubmit);
            me.element.off(events.modalDialogGenericCancel);
            me.$container = me._createDiv(["fr-core-dialog-innerPage", "fr-core-center"]);
            var headerHtml = forerunner.dialog.getModalDialogHeaderHtml('fr-icons24x24-managesubscription', locData.subscription.manageSubscription, "fr-managesubscription-cancel", "");
            me.$container.append(headerHtml);
            // Make these async calls and cache the results before they are needed.
            me.options.subscriptionModel.subscriptionModel("getSchedules");
            me.options.subscriptionModel.subscriptionModel("getDeliveryExtensions");
            me.element.append(me.$container);
            me.$listcontainer = me._createDiv(["fr-sub-list-container"]);
            me.$container.append(me.$listcontainer);
            me.$theForm = me._createDiv(["fr-sub-form"]);
            me.$container.append(me.$theForm);
            me._renderList();

            me.element.find(".fr-managesubscription-cancel").on("click", function (e) {
                me.closeDialog();
            });

            me.element.on(events.modalDialogGenericSubmit, function () {
                me._submit();
            });

            me.element.on(events.modalDialogGenericCancel, function () {
                me.closeDialog();
            });
        },

        openDialog: function () {
            var me = this;
            forerunner.dialog.showModalDialog(me.options.$appContainer, me);
        },

        closeDialog: function () {
            var me = this;
            forerunner.dialog.closeModalDialog(me.options.$appContainer, me);
        },
        destroy: function () {
            var me = this;
            me.element.html("");
            this._destroy();
        }
    });  // $.widget(
});  // $(function ()

///#source 1 1 /Forerunner/ReportViewer/js/SubscriptionModel.js
// Assign or create the single globally scoped variable
var forerunner = forerunner || {};

// Forerunner SQL Server Reports objects
forerunner.ajax = forerunner.ajax || {};
forerunner.ssr = forerunner.ssr || {};
forerunner.ssr.constants = forerunner.ssr.constants || {};
forerunner.ssr.constants.events = forerunner.ssr.constants.events || {};

$(function () {
    var ssr = forerunner.ssr;
    var events = ssr.constants.events;
    var widgets = forerunner.ssr.constants.widgets;
    var locData = forerunner.localize.getLocData(forerunner.config.forerunnerFolder() + "ReportViewer/loc/ReportViewer");

    $.widget(widgets.getFullname(widgets.subscriptionModel), {
        options: {
            rsInstance: null
        },
        subscriptionList: null,
        extensionList: null,
        extensionParameter: null,
        extensionSettings: {},
        schedules: null,
        _create: function () {
        },
        getSubscriptionList: function (reportPath) {
            var me = this;
            var url = forerunner.config.forerunnerAPIBase() + "ReportManager/ListSubscriptions?reportPath=" + reportPath + "&instance=" + me.options.rsInstance;
            var jqxhr = forerunner.ajax.ajax({
                url: url,
                dataType: "json",
                async: true
            })
            .done(function (data) {
                console.log("ListSubscriptions succeeded.");
            })
            .fail(function (data) {
                console.log("ListSubscriptions call failed.");
            });
            return jqxhr;
        },
        getSchedules: function () {
            var me = this;
            if (me.schedules) return [me.schedules];
            var url = forerunner.config.forerunnerAPIBase() + "ReportManager/ListSchedules?instance=" + me.options.rsInstance;
            var jqxhr = forerunner.ajax.ajax({
                url: url,
                dataType: "json",
                async: true
            })
            .done(
                function (data) {
                    me.schedules = data;
                })
            .fail(
                function () {
                    console.log("ListSchedules call failed.");
                });
            return me.schedules || jqxhr;
        },
        getDeliveryExtensions: function () {
            var me = this;
            if (me.extensionList) return [me.extensionList];
            var url = forerunner.config.forerunnerAPIBase() + "ReportManager/ListDeliveryExtensions?instance=" + me.options.rsInstance;
            return forerunner.ajax.ajax({
                url: url,
                dataType: "json",
                async: true
            })
            .done(
                function (data) {
                    me.extensionList = data; 
                })
            .fail(function () {
                console.log("ListDeliveryExtensions call failed.");
            });
        },
        _extensionSettingsCount: 0,
        _extensionSettingsJQXHR : {},
        getExtensionSettings: function (extensionName) {
            if (extensionName === "NULL") return;
            var me = this;
            var url = forerunner.config.forerunnerAPIBase() + "ReportManager/GetExtensionSettings?extension=" + extensionName + "&instance=" + me.options.rsInstance;
            return forerunner.ajax.ajax({
                    url: url,
                    dataType: "json",
                    async: true
                })
                .done(
                    function (settings) {
                        me.extensionSettings[extensionName] = settings;
                    })
                .fail(
                    function () {
                        console.log("GetExtensionSettings call failed.");
                    })
                .always(
                    function () {
                        me._extensionSettingsCount++;
                    });
        },
        getSubscription: function (subscriptionID) {
            var me = this;
            var url = forerunner.config.forerunnerAPIBase() + "ReportManager" + "/GetSubscription?subscriptionID=" + subscriptionID + "&instance=" + me.options.rsInstance;
            var retval;
            forerunner.ajax.ajax({
                url: url,
                dataType: "json",
                async: false,
                success: function (data) {
                    retval = data;
                },
                error: function (data) {
                    console.log("getSubscription failed: " + data.status);
                }
            });
            return retval;
        },
        createSubscription: function (subscriptionInfo, success, error) {
            return this._saveSubscription("CreateSubscription", subscriptionInfo, success, error);
        },
        updateSubscription: function (subscriptionInfo, success, error) {
            return this._saveSubscription("UpdateSubscription", subscriptionInfo, success, error);
        },
        deleteSubscription: function (subscriptionID, success, error) {
            var me = this;
            var url = forerunner.config.forerunnerAPIBase() + "ReportManager/DeleteSubscription?subscriptionID=" + subscriptionID + "&instance=" + me.options.rsInstance;
            forerunner.ajax.ajax({
                url: url,
                dataType: "json",
                async: false,
                success: function (data, textStatus, jqXHR) {
                    if (success && typeof (success) === "function") {
                        success(data);
                    }
                },
                error: function (data, textStatus, jqXHR) {
                    if (error && typeof (error) === "function") {
                        error();
                    }
                }
            });
        },
        _saveSubscription: function (verb, subscriptionInfo, success, error) {
            var me = this;
            var url = forerunner.config.forerunnerAPIBase() + "ReportManager/" + verb;
            subscriptionInfo.Instance = me.options.rsInstance;
            forerunner.ajax.post(
                url,
                subscriptionInfo,
                function (data, textStatus, jqXHR) {
                    var is_exception = true;
                    try {
                        var exception = JSON.parse(data);
                        if (exception.Exception) {
                            data = exception;
                        }
                    } catch(e) {
                        is_exception = false;
                    }
                    if (!is_exception && success && typeof (success) === "function") {
                        success(data);
                    }
                    if (is_exception && error && typeof (error) === "function") {
                        error(data);
                    }
                },
                function (data, textStatus, jqXHR) {
                    if (error && typeof (error) === "function") {
                        error(data);
                    }
                });
        },
    });  // $.widget(
});  // $(function ()

///#source 1 1 /Forerunner/Lib/jsTree/jstree.js
$(function() {
	"use strict";
/*!
 * jsTree 3.0.0
 * http://jstree.com/
 *
 * Copyright (c) 2013 Ivan Bozhanov (http://vakata.com)
 *
 * Licensed same as jquery - under the terms of the MIT License
 *   http://www.opensource.org/licenses/mit-license.php
 */
/*!
 * if using jslint please allow for the jQuery global and use following options: 
 * jslint: browser: true, ass: true, bitwise: true, continue: true, nomen: true, plusplus: true, regexp: true, unparam: true, todo: true, white: true
 */

	// prevent another load? maybe there is a better way?
	if($.jstree) {
		return;
	}

	/**
	 * ### jsTree core functionality
	 */

	// internal variables
	var instance_counter = 0,
		ccp_node = false,
		ccp_mode = false,
		ccp_inst = false,
		themes_loaded = [],
		src = $('script:last').attr('src'),
		_d = document, _node = _d.createElement('LI'), _temp1, _temp2;

	_node.setAttribute('role', 'treeitem');
	_temp1 = _d.createElement('I');
	_temp1.className = 'jstree-icon jstree-ocl';
	_node.appendChild(_temp1);
	_temp1 = _d.createElement('A');
	_temp1.className = 'jstree-anchor';
	_temp1.setAttribute('href','#');
	_temp2 = _d.createElement('I');
	_temp2.className = 'jstree-icon jstree-themeicon';
	_temp1.appendChild(_temp2);
	_node.appendChild(_temp1);
	_temp1 = _temp2 = null;


	/**
	 * holds all jstree related functions and variables, including the actual class and methods to create, access and manipulate instances.
	 * @name $.jstree
	 */
	$.jstree = {
		/** 
		 * specifies the jstree version in use
		 * @name $.jstree.version
		 */
		version : '3.0.0',
		/**
		 * holds all the default options used when creating new instances
		 * @name $.jstree.defaults
		 */
		defaults : {
			/**
			 * configure which plugins will be active on an instance. Should be an array of strings, where each element is a plugin name. The default is `[]`
			 * @name $.jstree.defaults.plugins
			 */
			plugins : []
		},
		/**
		 * stores all loaded jstree plugins (used internally)
		 * @name $.jstree.plugins
		 */
		plugins : {},
		path : src && src.indexOf('/') !== -1 ? src.replace(/\/[^\/]+$/,'') : '',
		idregex : /[\\:&'".,=\- \/]/g
	};
	/**
	 * creates a jstree instance
	 * @name $.jstree.create(el [, options])
	 * @param {DOMElement|jQuery|String} el the element to create the instance on, can be jQuery extended or a selector
	 * @param {Object} options options for this instance (extends `$.jstree.defaults`)
	 * @return {jsTree} the new instance
	 */
	$.jstree.create = function (el, options) {
		var tmp = new $.jstree.core(++instance_counter),
			opt = options;
		options = $.extend(true, {}, $.jstree.defaults, options);
		if(opt && opt.plugins) {
			options.plugins = opt.plugins;
		}
		$.each(options.plugins, function (i, k) {
			if(i !== 'core') {
				tmp = tmp.plugin(k, options[k]);
			}
		});
		tmp.init(el, options);
		return tmp;
	};
	/**
	 * the jstree class constructor, used only internally
	 * @private
	 * @name $.jstree.core(id)
	 * @param {Number} id this instance's index
	 */
	$.jstree.core = function (id) {
		this._id = id;
		this._cnt = 0;
		this._data = {
			core : {
				themes : {
					name : false,
					dots : false,
					icons : false
				},
				selected : [],
				last_error : {}
			}
		};
	};
	/**
	 * get a reference to an existing instance
	 *
	 * __Examples__
	 *
	 *	// provided a container with an ID of "tree", and a nested node with an ID of "branch"
	 *	// all of there will return the same instance
	 *	$.jstree.reference('tree');
	 *	$.jstree.reference('#tree');
	 *	$.jstree.reference($('#tree'));
	 *	$.jstree.reference(document.getElementByID('tree'));
	 *	$.jstree.reference('branch');
	 *	$.jstree.reference('#branch');
	 *	$.jstree.reference($('#branch'));
	 *	$.jstree.reference(document.getElementByID('branch'));
	 *
	 * @name $.jstree.reference(needle)
	 * @param {DOMElement|jQuery|String} needle
	 * @return {jsTree|null} the instance or `null` if not found
	 */
	$.jstree.reference = function (needle) {
		var tmp = null,
			obj = null;
		if(needle && needle.id) { needle = needle.id; }

		if(!obj || !obj.length) {
			try { obj = $(needle); } catch (ignore) { }
		}
		if(!obj || !obj.length) {
			try { obj = $('#' + needle.replace($.jstree.idregex,'\\$&')); } catch (ignore) { }
		}
		if(obj && obj.length && (obj = obj.closest('.jstree')).length && (obj = obj.data('jstree'))) {
			tmp = obj;
		}
		else {
			$('.jstree').each(function () {
				var inst = $(this).data('jstree');
				if(inst && inst._model.data[needle]) {
					tmp = inst;
					return false;
				}
			});
		}
		return tmp;
	};
	/**
	 * Create an instance, get an instance or invoke a command on a instance. 
	 * 
	 * If there is no instance associated with the current node a new one is created and `arg` is used to extend `$.jstree.defaults` for this new instance. There would be no return value (chaining is not broken).
	 * 
	 * If there is an existing instance and `arg` is a string the command specified by `arg` is executed on the instance, with any additional arguments passed to the function. If the function returns a value it will be returned (chaining could break depending on function).
	 * 
	 * If there is an existing instance and `arg` is not a string the instance itself is returned (similar to `$.jstree.reference`).
	 * 
	 * In any other case - nothing is returned and chaining is not broken.
	 *
	 * __Examples__
	 *
	 *	$('#tree1').jstree(); // creates an instance
	 *	$('#tree2').jstree({ plugins : [] }); // create an instance with some options
	 *	$('#tree1').jstree('open_node', '#branch_1'); // call a method on an existing instance, passing additional arguments
	 *	$('#tree2').jstree(); // get an existing instance (or create an instance)
	 *	$('#tree2').jstree(true); // get an existing instance (will not create new instance)
	 *	$('#branch_1').jstree().select_node('#branch_1'); // get an instance (using a nested element and call a method)
	 *
	 * @name $().jstree([arg])
	 * @param {String|Object} arg
	 * @return {Mixed}
	 */
	$.fn.jstree = function (arg) {
		// check for string argument
		var is_method	= (typeof arg === 'string'),
			args		= Array.prototype.slice.call(arguments, 1),
			result		= null;
		this.each(function () {
			// get the instance (if there is one) and method (if it exists)
			var instance = $.jstree.reference(this),
				method = is_method && instance ? instance[arg] : null;
			// if calling a method, and method is available - execute on the instance
			result = is_method && method ?
				method.apply(instance, args) :
				null;
			// if there is no instance and no method is being called - create one
			if(!instance && !is_method && (arg === undefined || $.isPlainObject(arg))) {
				$(this).data('jstree', new $.jstree.create(this, arg));
			}
			// if there is an instance and no method is called - return the instance
			if( (instance && !is_method) || arg === true ) {
				result = instance || false;
			}
			// if there was a method call which returned a result - break and return the value
			if(result !== null && result !== undefined) {
				return false;
			}
		});
		// if there was a method call with a valid return value - return that, otherwise continue the chain
		return result !== null && result !== undefined ?
			result : this;
	};
	/**
	 * used to find elements containing an instance
	 *
	 * __Examples__
	 *
	 *	$('div:jstree').each(function () {
	 *		$(this).jstree('destroy');
	 *	});
	 *
	 * @name $(':jstree')
	 * @return {jQuery}
	 */
	$.expr[':'].jstree = $.expr.createPseudo(function(search) {
		return function(a) {
			return $(a).hasClass('jstree') &&
				$(a).data('jstree') !== undefined;
		};
	});

	/**
	 * stores all defaults for the core
	 * @name $.jstree.defaults.core
	 */
	$.jstree.defaults.core = {
		/**
		 * data configuration
		 * 
		 * If left as `false` the HTML inside the jstree container element is used to populate the tree (that should be an unordered list with list items).
		 *
		 * You can also pass in a HTML string or a JSON array here.
		 * 
		 * It is possible to pass in a standard jQuery-like AJAX config and jstree will automatically determine if the response is JSON or HTML and use that to populate the tree. 
		 * In addition to the standard jQuery ajax options here you can suppy functions for `data` and `url`, the functions will be run in the current instance's scope and a param will be passed indicating which node is being loaded, the return value of those functions will be used.
		 * 
		 * The last option is to specify a function, that function will receive the node being loaded as argument and a second param which is a function which should be called with the result.
		 *
		 * __Examples__
		 *
		 *	// AJAX
		 *	$('#tree').jstree({
		 *		'core' : {
		 *			'data' : {
		 *				'url' : '/get/children/',
		 *				'data' : function (node) {
		 *					return { 'id' : node.id };
		 *				}
		 *			}
		 *		});
		 *
		 *	// direct data
		 *	$('#tree').jstree({
		 *		'core' : {
		 *			'data' : [
		 *				'Simple root node',
		 *				{
		 *					'id' : 'node_2',
		 *					'text' : 'Root node with options',
		 *					'state' : { 'opened' : true, 'selected' : true },
		 *					'children' : [ { 'text' : 'Child 1' }, 'Child 2']
		 *				}
		 *			]
		 *		});
		 *	
		 *	// function
		 *	$('#tree').jstree({
		 *		'core' : {
		 *			'data' : function (obj, callback) {
		 *				callback.call(this, ['Root 1', 'Root 2']);
		 *			}
		 *		});
		 * 
		 * @name $.jstree.defaults.core.data
		 */
		data			: false,
		/**
		 * configure the various strings used throughout the tree
		 *
		 * You can use an object where the key is the string you need to replace and the value is your replacement.
		 * Another option is to specify a function which will be called with an argument of the needed string and should return the replacement.
		 * If left as `false` no replacement is made.
		 *
		 * __Examples__
		 *
		 *	$('#tree').jstree({
		 *		'core' : {
		 *			'strings' : {
		 *				'Loading...' : 'Please wait ...'
		 *			}
		 *		}
		 *	});
		 *
		 * @name $.jstree.defaults.core.strings
		 */
		strings			: false,
		/**
		 * determines what happens when a user tries to modify the structure of the tree
		 * If left as `false` all operations like create, rename, delete, move or copy are prevented.
		 * You can set this to `true` to allow all interactions or use a function to have better control.
		 *
		 * __Examples__
		 *
		 *	$('#tree').jstree({
		 *		'core' : {
		 *			'check_callback' : function (operation, node, node_parent, node_position, more) {
		 *				// operation can be 'create_node', 'rename_node', 'delete_node', 'move_node' or 'copy_node'
		 *				// in case of 'rename_node' node_position is filled with the new node name
		 *				return operation === 'rename_node' ? true : false;
		 *			}
		 *		}
		 *	});
		 * 
		 * @name $.jstree.defaults.core.check_callback
		 */
		check_callback	: false,
		/**
		 * a callback called with a single object parameter in the instance's scope when something goes wrong (operation prevented, ajax failed, etc)
		 * @name $.jstree.defaults.core.error
		 */
		error			: $.noop,
		/**
		 * the open / close animation duration in milliseconds - set this to `false` to disable the animation (default is `200`)
		 * @name $.jstree.defaults.core.animation
		 */
		animation		: 200,
		/**
		 * a boolean indicating if multiple nodes can be selected
		 * @name $.jstree.defaults.core.multiple
		 */
		multiple		: true,
		/**
		 * theme configuration object
		 * @name $.jstree.defaults.core.themes
		 */
		themes			: {
			/**
			 * the name of the theme to use (if left as `false` the default theme is used)
			 * @name $.jstree.defaults.core.themes.name
			 */
			name			: false,
			/**
			 * the URL of the theme's CSS file, leave this as `false` if you have manually included the theme CSS (recommended). You can set this to `true` too which will try to autoload the theme.
			 * @name $.jstree.defaults.core.themes.url
			 */
			url				: false,
			/**
			 * the location of all jstree themes - only used if `url` is set to `true`
			 * @name $.jstree.defaults.core.themes.dir
			 */
			dir				: false,
			/**
			 * a boolean indicating if connecting dots are shown
			 * @name $.jstree.defaults.core.themes.dots
			 */
			dots			: true,
			/**
			 * a boolean indicating if node icons are shown
			 * @name $.jstree.defaults.core.themes.icons
			 */
			icons			: true,
			/**
			 * a boolean indicating if the tree background is striped
			 * @name $.jstree.defaults.core.themes.stripes
			 */
			stripes			: false,
			/**
			 * a string (or boolean `false`) specifying the theme variant to use (if the theme supports variants)
			 * @name $.jstree.defaults.core.themes.variant
			 */
			variant			: false,
			/**
			 * a boolean specifying if a reponsive version of the theme should kick in on smaller screens (if the theme supports it). Defaults to `true`.
			 * @name $.jstree.defaults.core.themes.responsive
			 */
			responsive		: true
		},
		/**
		 * if left as `true` all parents of all selected nodes will be opened once the tree loads (so that all selected nodes are visible to the user)
		 * @name $.jstree.defaults.core.expand_selected_onload
		 */
		expand_selected_onload : true
	};
	$.jstree.core.prototype = {
		/**
		 * used to decorate an instance with a plugin. Used internally.
		 * @private
		 * @name plugin(deco [, opts])
		 * @param  {String} deco the plugin to decorate with
		 * @param  {Object} opts options for the plugin
		 * @return {jsTree}
		 */
		plugin : function (deco, opts) {
			var Child = $.jstree.plugins[deco];
			if(Child) {
				this._data[deco] = {};
				Child.prototype = this;
				return new Child(opts, this);
			}
			return this;
		},
		/**
		 * used to decorate an instance with a plugin. Used internally.
		 * @private
		 * @name init(el, optons)
		 * @param {DOMElement|jQuery|String} el the element we are transforming
		 * @param {Object} options options for this instance
		 * @trigger init.jstree, loading.jstree, loaded.jstree, ready.jstree, changed.jstree
		 */
		init : function (el, options) {
			this._model = {
				data : {
					'#' : {
						id : '#',
						parent : null,
						parents : [],
						children : [],
						children_d : [],
						state : { loaded : false }
					}
				},
				changed : [],
				force_full_redraw : false,
				redraw_timeout : false,
				default_state : {
					loaded : true,
					opened : false,
					selected : false,
					disabled : false
				}
			};

			this.element = $(el).addClass('jstree jstree-' + this._id);
			this.settings = options;
			this.element.bind("destroyed", $.proxy(this.teardown, this));

			this._data.core.ready = false;
			this._data.core.loaded = false;
			this._data.core.rtl = (this.element.css("direction") === "rtl");
			this.element[this._data.core.rtl ? 'addClass' : 'removeClass']("jstree-rtl");
			this.element.attr('role','tree');

			this.bind();
			/**
			 * triggered after all events are bound
			 * @event
			 * @name init.jstree
			 */
			this.trigger("init");

			this._data.core.original_container_html = this.element.find(" > ul > li").clone(true);
			this._data.core.original_container_html
				.find("li").addBack()
				.contents().filter(function() {
					return this.nodeType === 3 && (!this.nodeValue || /^\s+$/.test(this.nodeValue));
				})
				.remove();
			this.element.html("<"+"ul class='jstree-container-ul'><"+"li class='jstree-initial-node jstree-loading jstree-leaf jstree-last'><i class='jstree-icon jstree-ocl'></i><"+"a class='jstree-anchor' href='#'><i class='jstree-icon jstree-themeicon-hidden'></i>" + this.get_string("Loading ...") + "</a></li></ul>");
			this._data.core.li_height = this.get_container_ul().children("li:eq(0)").height() || 18;
			/**
			 * triggered after the loading text is shown and before loading starts
			 * @event
			 * @name loading.jstree
			 */
			this.trigger("loading");
			this.load_node('#');
		},
		/**
		 * destroy an instance
		 * @name destroy()
		 */
		destroy : function () {
			this.element.unbind("destroyed", this.teardown);
			this.teardown();
		},
		/**
		 * part of the destroying of an instance. Used internally.
		 * @private
		 * @name teardown()
		 */
		teardown : function () {
			this.unbind();
			this.element
				.removeClass('jstree')
				.removeData('jstree')
				.find("[class^='jstree']")
					.addBack()
					.attr("class", function () { return this.className.replace(/jstree[^ ]*|$/ig,''); });
			this.element = null;
		},
		/**
		 * bind all events. Used internally.
		 * @private
		 * @name bind()
		 */
		bind : function () {
			this.element
				.on("dblclick.jstree", function () {
						if(document.selection && document.selection.empty) {
							document.selection.empty();
						}
						else {
							if(window.getSelection) {
								var sel = window.getSelection();
								try {
									sel.removeAllRanges();
									sel.collapse();
								} catch (ignore) { }
							}
						}
					})
				.on("click.jstree", ".jstree-ocl", $.proxy(function (e) {
						this.toggle_node(e.target);
					}, this))
				.on("click.jstree", ".jstree-anchor", $.proxy(function (e) {
						e.preventDefault();
						$(e.currentTarget).focus();
						this.activate_node(e.currentTarget, e);
					}, this))
				.on('keydown.jstree', '.jstree-anchor', $.proxy(function (e) {
						if(e.target.tagName === "INPUT") { return true; }
						var o = null;
						switch(e.which) {
							case 13:
							case 32:
								e.type = "click";
								$(e.currentTarget).trigger(e);
								break;
							case 37:
								e.preventDefault();
								if(this.is_open(e.currentTarget)) {
									this.close_node(e.currentTarget);
								}
								else {
									o = this.get_prev_dom(e.currentTarget);
									if(o && o.length) { o.children('.jstree-anchor').focus(); }
								}
								break;
							case 38:
								e.preventDefault();
								o = this.get_prev_dom(e.currentTarget);
								if(o && o.length) { o.children('.jstree-anchor').focus(); }
								break;
							case 39:
								e.preventDefault();
								if(this.is_closed(e.currentTarget)) {
									this.open_node(e.currentTarget, function (o) { this.get_node(o, true).children('.jstree-anchor').focus(); });
								}
								else {
									o = this.get_next_dom(e.currentTarget);
									if(o && o.length) { o.children('.jstree-anchor').focus(); }
								}
								break;
							case 40:
								e.preventDefault();
								o = this.get_next_dom(e.currentTarget);
								if(o && o.length) { o.children('.jstree-anchor').focus(); }
								break;
							// delete
							case 46:
								e.preventDefault();
								o = this.get_node(e.currentTarget);
								if(o && o.id && o.id !== '#') {
									o = this.is_selected(o) ? this.get_selected() : o;
									// this.delete_node(o);
								}
								break;
							// f2
							case 113:
								e.preventDefault();
								o = this.get_node(e.currentTarget);
								/*!
								if(o && o.id && o.id !== '#') {
									// this.edit(o);
								}
								*/
								break;
							default:
								// console.log(e.which);
								break;
						}
					}, this))
				.on("load_node.jstree", $.proxy(function (e, data) {
						if(data.status) {
							if(data.node.id === '#' && !this._data.core.loaded) {
								this._data.core.loaded = true;
								/**
								 * triggered after the root node is loaded for the first time
								 * @event
								 * @name loaded.jstree
								 */
								this.trigger("loaded");
							}
							if(!this._data.core.ready && !this.get_container_ul().find('.jstree-loading:eq(0)').length) {
								this._data.core.ready = true;
								if(this._data.core.selected.length) {
									if(this.settings.core.expand_selected_onload) {
										var tmp = [], i, j;
										for(i = 0, j = this._data.core.selected.length; i < j; i++) {
											tmp = tmp.concat(this._model.data[this._data.core.selected[i]].parents);
										}
										tmp = $.vakata.array_unique(tmp);
										for(i = 0, j = tmp.length; i < j; i++) {
											this.open_node(tmp[i], false, 0);
										}
									}
									this.trigger('changed', { 'action' : 'ready', 'selected' : this._data.core.selected });
								}
								/**
								 * triggered after all nodes are finished loading
								 * @event
								 * @name ready.jstree
								 */
								setTimeout($.proxy(function () { this.trigger("ready"); }, this), 0);
							}
						}
					}, this))
				// THEME RELATED
				.on("init.jstree", $.proxy(function () {
						var s = this.settings.core.themes;
						this._data.core.themes.dots			= s.dots;
						this._data.core.themes.stripes		= s.stripes;
						this._data.core.themes.icons		= s.icons;
						this.set_theme(s.name || "default", s.url);
						this.set_theme_variant(s.variant);
					}, this))
				.on("loading.jstree", $.proxy(function () {
						this[ this._data.core.themes.dots ? "show_dots" : "hide_dots" ]();
						this[ this._data.core.themes.icons ? "show_icons" : "hide_icons" ]();
						this[ this._data.core.themes.stripes ? "show_stripes" : "hide_stripes" ]();
					}, this))
				.on('focus.jstree', '.jstree-anchor', $.proxy(function (e) {
						this.element.find('.jstree-hovered').not(e.currentTarget).mouseleave();
						$(e.currentTarget).mouseenter();
					}, this))
				.on('mouseenter.jstree', '.jstree-anchor', $.proxy(function (e) {
						this.hover_node(e.currentTarget);
					}, this))
				.on('mouseleave.jstree', '.jstree-anchor', $.proxy(function (e) {
						this.dehover_node(e.currentTarget);
					}, this));
		},
		/**
		 * part of the destroying of an instance. Used internally.
		 * @private
		 * @name unbind()
		 */
		unbind : function () {
			this.element.off('.jstree');
			$(document).off('.jstree-' + this._id);
		},
		/**
		 * trigger an event. Used internally.
		 * @private
		 * @name trigger(ev [, data])
		 * @param  {String} ev the name of the event to trigger
		 * @param  {Object} data additional data to pass with the event
		 */
		trigger : function (ev, data) {
			if(!data) {
				data = {};
			}
			data.instance = this;
			this.element.triggerHandler(ev.replace('.jstree','') + '.jstree', data);
		},
		/**
		 * returns the jQuery extended instance container
		 * @name get_container()
		 * @return {jQuery}
		 */
		get_container : function () {
			return this.element;
		},
		/**
		 * returns the jQuery extended main UL node inside the instance container. Used internally.
		 * @private
		 * @name get_container_ul()
		 * @return {jQuery}
		 */
		get_container_ul : function () {
			return this.element.children("ul:eq(0)");
		},
		/**
		 * gets string replacements (localization). Used internally.
		 * @private
		 * @name get_string(key)
		 * @param  {String} key
		 * @return {String}
		 */
		get_string : function (key) {
			var a = this.settings.core.strings;
			if($.isFunction(a)) { return a.call(this, key); }
			if(a && a[key]) { return a[key]; }
			return key;
		},
		/**
		 * gets the first child of a DOM node. Used internally.
		 * @private
		 * @name _firstChild(dom)
		 * @param  {DOMElement} dom
		 * @return {DOMElement}
		 */
		_firstChild : function (dom) {
			dom = dom ? dom.firstChild : null;
			while(dom !== null && dom.nodeType !== 1) {
				dom = dom.nextSibling;
			}
			return dom;
		},
		/**
		 * gets the next sibling of a DOM node. Used internally.
		 * @private
		 * @name _nextSibling(dom)
		 * @param  {DOMElement} dom
		 * @return {DOMElement}
		 */
		_nextSibling : function (dom) {
			dom = dom ? dom.nextSibling : null;
			while(dom !== null && dom.nodeType !== 1) {
				dom = dom.nextSibling;
			}
			return dom;
		},
		/**
		 * gets the previous sibling of a DOM node. Used internally.
		 * @private
		 * @name _previousSibling(dom)
		 * @param  {DOMElement} dom
		 * @return {DOMElement}
		 */
		_previousSibling : function (dom) {
			dom = dom ? dom.previousSibling : null;
			while(dom !== null && dom.nodeType !== 1) {
				dom = dom.previousSibling;
			}
			return dom;
		},
		/**
		 * get the JSON representation of a node (or the actual jQuery extended DOM node) by using any input (child DOM element, ID string, selector, etc)
		 * @name get_node(obj [, as_dom])
		 * @param  {mixed} obj
		 * @param  {Boolean} as_dom
		 * @return {Object|jQuery}
		 */
		get_node : function (obj, as_dom) {
			if(obj && obj.id) {
				obj = obj.id;
			}
			var dom;
			try {
				if(this._model.data[obj]) {
					obj = this._model.data[obj];
				}
				else if(((dom = $(obj, this.element)).length || (dom = $('#' + obj.replace($.jstree.idregex,'\\$&'), this.element)).length) && this._model.data[dom.closest('li').attr('id')]) {
					obj = this._model.data[dom.closest('li').attr('id')];
				}
				else if((dom = $(obj, this.element)).length && dom.hasClass('jstree')) {
					obj = this._model.data['#'];
				}
				else {
					return false;
				}

				if(as_dom) {
					obj = obj.id === '#' ? this.element : $('#' + obj.id.replace($.jstree.idregex,'\\$&'), this.element);
				}
				return obj;
			} catch (ex) { return false; }
		},
		/**
		 * get the path to a node, either consisting of node texts, or of node IDs, optionally glued together (otherwise an array)
		 * @name get_path(obj [, glue, ids])
		 * @param  {mixed} obj the node
		 * @param  {String} glue if you want the path as a string - pass the glue here (for example '/'), if a falsy value is supplied here, an array is returned
		 * @param  {Boolean} ids if set to true build the path using ID, otherwise node text is used
		 * @return {mixed}
		 */
		get_path : function (obj, glue, ids) {
			obj = obj.parents ? obj : this.get_node(obj);
			if(!obj || obj.id === '#' || !obj.parents) {
				return false;
			}
			var i, j, p = [];
			p.push(ids ? obj.id : obj.text);
			for(i = 0, j = obj.parents.length; i < j; i++) {
				p.push(ids ? obj.parents[i] : this.get_text(obj.parents[i]));
			}
			p = p.reverse().slice(1);
			return glue ? p.join(glue) : p;
		},
		/**
		 * get the next visible node that is below the `obj` node. If `strict` is set to `true` only sibling nodes are returned.
		 * @name get_next_dom(obj [, strict])
		 * @param  {mixed} obj
		 * @param  {Boolean} strict
		 * @return {jQuery}
		 */
		get_next_dom : function (obj, strict) {
			var tmp;
			obj = this.get_node(obj, true);
			if(obj[0] === this.element[0]) {
				tmp = this._firstChild(this.get_container_ul()[0]);
				return tmp ? $(tmp) : false;
			}
			if(!obj || !obj.length) {
				return false;
			}
			if(strict) {
				tmp = this._nextSibling(obj[0]);
				return tmp ? $(tmp) : false;
			}
			if(obj.hasClass("jstree-open")) {
				tmp = this._firstChild(obj.children('ul')[0]);
				return tmp ? $(tmp) : false;
			}
			if((tmp = this._nextSibling(obj[0])) !== null) {
				return $(tmp);
			}
			return obj.parentsUntil(".jstree","li").next("li").eq(0);
		},
		/**
		 * get the previous visible node that is above the `obj` node. If `strict` is set to `true` only sibling nodes are returned.
		 * @name get_prev_dom(obj [, strict])
		 * @param  {mixed} obj
		 * @param  {Boolean} strict
		 * @return {jQuery}
		 */
		get_prev_dom : function (obj, strict) {
			var tmp;
			obj = this.get_node(obj, true);
			if(obj[0] === this.element[0]) {
				tmp = this.get_container_ul()[0].lastChild;
				return tmp ? $(tmp) : false;
			}
			if(!obj || !obj.length) {
				return false;
			}
			if(strict) {
				tmp = this._previousSibling(obj[0]);
				return tmp ? $(tmp) : false;
			}
			if((tmp = this._previousSibling(obj[0])) !== null) {
				obj = $(tmp);
				while(obj.hasClass("jstree-open")) {
					obj = obj.children("ul:eq(0)").children("li:last");
				}
				return obj;
			}
			tmp = obj[0].parentNode.parentNode;
			return tmp && tmp.tagName === 'LI' ? $(tmp) : false;
		},
		/**
		 * get the parent ID of a node
		 * @name get_parent(obj)
		 * @param  {mixed} obj
		 * @return {String}
		 */
		get_parent : function (obj) {
			obj = this.get_node(obj);
			if(!obj || obj.id === '#') {
				return false;
			}
			return obj.parent;
		},
		/**
		 * get a jQuery collection of all the children of a node (node must be rendered)
		 * @name get_children_dom(obj)
		 * @param  {mixed} obj
		 * @return {jQuery}
		 */
		get_children_dom : function (obj) {
			obj = this.get_node(obj, true);
			if(obj[0] === this.element[0]) {
				return this.get_container_ul().children("li");
			}
			if(!obj || !obj.length) {
				return false;
			}
			return obj.children("ul").children("li");
		},
		/**
		 * checks if a node has children
		 * @name is_parent(obj)
		 * @param  {mixed} obj
		 * @return {Boolean}
		 */
		is_parent : function (obj) {
			obj = this.get_node(obj);
			return obj && (obj.state.loaded === false || obj.children.length > 0);
		},
		/**
		 * checks if a node is loaded (its children are available)
		 * @name is_loaded(obj)
		 * @param  {mixed} obj
		 * @return {Boolean}
		 */
		is_loaded : function (obj) {
			obj = this.get_node(obj);
			return obj && obj.state.loaded;
		},
		/**
		 * check if a node is currently loading (fetching children)
		 * @name is_loading(obj)
		 * @param  {mixed} obj
		 * @return {Boolean}
		 */
		is_loading : function (obj) {
			obj = this.get_node(obj);
			return obj && obj.state && obj.state.loading;
		},
		/**
		 * check if a node is opened
		 * @name is_open(obj)
		 * @param  {mixed} obj
		 * @return {Boolean}
		 */
		is_open : function (obj) {
			obj = this.get_node(obj);
			return obj && obj.state.opened;
		},
		/**
		 * check if a node is in a closed state
		 * @name is_closed(obj)
		 * @param  {mixed} obj
		 * @return {Boolean}
		 */
		is_closed : function (obj) {
			obj = this.get_node(obj);
			return obj && this.is_parent(obj) && !obj.state.opened;
		},
		/**
		 * check if a node has no children
		 * @name is_leaf(obj)
		 * @param  {mixed} obj
		 * @return {Boolean}
		 */
		is_leaf : function (obj) {
			return !this.is_parent(obj);
		},
		/**
		 * loads a node (fetches its children using the `core.data` setting). Multiple nodes can be passed to by using an array.
		 * @name load_node(obj [, callback])
		 * @param  {mixed} obj
		 * @param  {function} callback a function to be executed once loading is conplete, the function is executed in the instance's scope and receives two arguments - the node and a boolean status
		 * @return {Boolean}
		 * @trigger load_node.jstree
		 */
		load_node : function (obj, callback) {
			var t1, t2, k, l, i, j, c;
			if($.isArray(obj)) {
				obj = obj.slice();
				for(t1 = 0, t2 = obj.length; t1 < t2; t1++) {
					this.load_node(obj[t1], callback);
				}
				return true;
			}
			obj = this.get_node(obj);
			if(!obj) {
				if(callback) { callback.call(this, obj, false); }
				return false;
			}
			if(obj.state.loaded) {
				obj.state.loaded = false;
				for(k = 0, l = obj.children_d.length; k < l; k++) {
					for(i = 0, j = obj.parents.length; i < j; i++) {
						this._model.data[obj.parents[i]].children_d = $.vakata.array_remove_item(this._model.data[obj.parents[i]].children_d, obj.children_d[k]);
					}
					if(this._model.data[obj.children_d[k]].state.selected) {
						c = true;
						this._data.core.selected = $.vakata.array_remove_item(this._data.core.selected, obj.children_d[k]);
					}
					delete this._model.data[obj.children_d[k]];
				}
				obj.children = [];
				obj.children_d = [];
				if(c) {
					this.trigger('changed', { 'action' : 'load_node', 'node' : obj, 'selected' : this._data.core.selected });
				}
			}
			obj.state.loading = true;
			this.get_node(obj, true).addClass("jstree-loading");
			this._load_node(obj, $.proxy(function (status) {
				obj.state.loading = false;
				obj.state.loaded = status;
				var dom = this.get_node(obj, true);
				if(obj.state.loaded && !obj.children.length && dom && dom.length && !dom.hasClass('jstree-leaf')) {
					dom.removeClass('jstree-closed jstree-open').addClass('jstree-leaf');
				}
				dom.removeClass("jstree-loading");
				/**
				 * triggered after a node is loaded
				 * @event
				 * @name load_node.jstree
				 * @param {Object} node the node that was loading
				 * @param {Boolean} status was the node loaded successfully
				 */
				this.trigger('load_node', { "node" : obj, "status" : status });
				if(callback) {
					callback.call(this, obj, status);
				}
			}, this));
			return true;
		},
		/**
		 * load an array of nodes (will also load unavailable nodes as soon as the appear in the structure). Used internally.
		 * @private
		 * @name _load_nodes(nodes [, callback])
		 * @param  {array} nodes
		 * @param  {function} callback a function to be executed once loading is complete, the function is executed in the instance's scope and receives one argument - the array passed to _load_nodes
		 */
		_load_nodes : function (nodes, callback, is_callback) {
			var r = true,
				c = function () { this._load_nodes(nodes, callback, true); },
				m = this._model.data, i, j;
			for(i = 0, j = nodes.length; i < j; i++) {
				if(m[nodes[i]] && (!m[nodes[i]].state.loaded || !is_callback)) {
					if(!this.is_loading(nodes[i])) {
						this.load_node(nodes[i], c);
					}
					r = false;
				}
			}
			if(r) {
				if(!callback.done) {
					callback.call(this, nodes);
					callback.done = true;
				}
			}
		},
		/**
		 * handles the actual loading of a node. Used only internally.
		 * @private
		 * @name _load_node(obj [, callback])
		 * @param  {mixed} obj
		 * @param  {function} callback a function to be executed once loading is complete, the function is executed in the instance's scope and receives one argument - a boolean status
		 * @return {Boolean}
		 */
		_load_node : function (obj, callback) {
			var s = this.settings.core.data, t;
			// use original HTML
			if(!s) {
				return callback.call(this, obj.id === '#' ? this._append_html_data(obj, this._data.core.original_container_html.clone(true)) : false);
			}
			if($.isFunction(s)) {
				return s.call(this, obj, $.proxy(function (d) {
					return d === false ? callback.call(this, false) : callback.call(this, this[typeof d === 'string' ? '_append_html_data' : '_append_json_data'](obj, typeof d === 'string' ? $(d) : d));
				}, this));
			}
			if(typeof s === 'object') {
				if(s.url) {
					s = $.extend(true, {}, s);
					if($.isFunction(s.url)) {
						s.url = s.url.call(this, obj);
					}
					if($.isFunction(s.data)) {
						s.data = s.data.call(this, obj);
					}
					return $.ajax(s)
						.done($.proxy(function (d,t,x) {
								var type = x.getResponseHeader('Content-Type');
								if(type.indexOf('json') !== -1 || typeof d === "object") {
									return callback.call(this, this._append_json_data(obj, d));
								}
								if(type.indexOf('html') !== -1 || typeof d === "string") {
									return callback.call(this, this._append_html_data(obj, $(d)));
								}
								this._data.core.last_error = { 'error' : 'ajax', 'plugin' : 'core', 'id' : 'core_04', 'reason' : 'Could not load node', 'data' : JSON.stringify({ 'id' : obj.id, 'xhr' : x }) };
								return callback.call(this, false);
							}, this))
						.fail($.proxy(function (f) {
								callback.call(this, false);
								this._data.core.last_error = { 'error' : 'ajax', 'plugin' : 'core', 'id' : 'core_04', 'reason' : 'Could not load node', 'data' : JSON.stringify({ 'id' : obj.id, 'xhr' : f }) };
								this.settings.core.error.call(this, this._data.core.last_error);
							}, this));
				}
				t = ($.isArray(s) || $.isPlainObject(s)) ? JSON.parse(JSON.stringify(s)) : s;
				if(obj.id !== "#") { this._data.core.last_error = { 'error' : 'nodata', 'plugin' : 'core', 'id' : 'core_05', 'reason' : 'Could not load node', 'data' : JSON.stringify({ 'id' : obj.id }) }; }
				return callback.call(this, (obj.id === "#" ? this._append_json_data(obj, t) : false) );
			}
			if(typeof s === 'string') {
				if(obj.id !== "#") { this._data.core.last_error = { 'error' : 'nodata', 'plugin' : 'core', 'id' : 'core_06', 'reason' : 'Could not load node', 'data' : JSON.stringify({ 'id' : obj.id }) }; }
				return callback.call(this, (obj.id === "#" ? this._append_html_data(obj, $(s)) : false) );
			}
			return callback.call(this, false);
		},
		/**
		 * adds a node to the list of nodes to redraw. Used only internally.
		 * @private
		 * @name _node_changed(obj [, callback])
		 * @param  {mixed} obj
		 */
		_node_changed : function (obj) {
			obj = this.get_node(obj);
			if(obj) {
				this._model.changed.push(obj.id);
			}
		},
		/**
		 * appends HTML content to the tree. Used internally.
		 * @private
		 * @name _append_html_data(obj, data)
		 * @param  {mixed} obj the node to append to
		 * @param  {String} data the HTML string to parse and append
		 * @return {Boolean}
		 * @trigger model.jstree, changed.jstree
		 */
		_append_html_data : function (dom, data) {
			dom = this.get_node(dom);
			dom.children = [];
			dom.children_d = [];
			var dat = data.is('ul') ? data.children() : data,
				par = dom.id,
				chd = [],
				dpc = [],
				m = this._model.data,
				p = m[par],
				s = this._data.core.selected.length,
				tmp, i, j;
			dat.each($.proxy(function (i, v) {
				tmp = this._parse_model_from_html($(v), par, p.parents.concat());
				if(tmp) {
					chd.push(tmp);
					dpc.push(tmp);
					if(m[tmp].children_d.length) {
						dpc = dpc.concat(m[tmp].children_d);
					}
				}
			}, this));
			p.children = chd;
			p.children_d = dpc;
			for(i = 0, j = p.parents.length; i < j; i++) {
				m[p.parents[i]].children_d = m[p.parents[i]].children_d.concat(dpc);
			}
			/**
			 * triggered when new data is inserted to the tree model
			 * @event
			 * @name model.jstree
			 * @param {Array} nodes an array of node IDs
			 * @param {String} parent the parent ID of the nodes
			 */
			this.trigger('model', { "nodes" : dpc, 'parent' : par });
			if(par !== '#') {
				this._node_changed(par);
				this.redraw();
			}
			else {
				this.get_container_ul().children('.jstree-initial-node').remove();
				this.redraw(true);
			}
			if(this._data.core.selected.length !== s) {
				this.trigger('changed', { 'action' : 'model', 'selected' : this._data.core.selected });
			}
			return true;
		},
		/**
		 * appends JSON content to the tree. Used internally.
		 * @private
		 * @name _append_json_data(obj, data)
		 * @param  {mixed} obj the node to append to
		 * @param  {String} data the JSON object to parse and append
		 * @return {Boolean}
		 */
		_append_json_data : function (dom, data) {
			dom = this.get_node(dom);
			dom.children = [];
			dom.children_d = [];
			var dat = data,
				par = dom.id,
				chd = [],
				dpc = [],
				m = this._model.data,
				p = m[par],
				s = this._data.core.selected.length,
				tmp, i, j;
			// *%$@!!!
			if(dat.d) {
				dat = dat.d;
				if(typeof dat === "string") {
					dat = JSON.parse(dat);
				}
			}
			if(!$.isArray(dat)) { dat = [dat]; }
			if(dat.length && dat[0].id !== undefined && dat[0].parent !== undefined) {
				// Flat JSON support (for easy import from DB):
				// 1) convert to object (foreach)
				for(i = 0, j = dat.length; i < j; i++) {
					if(!dat[i].children) {
						dat[i].children = [];
					}
					m[dat[i].id.toString()] = dat[i];
				}
				// 2) populate children (foreach)
				for(i = 0, j = dat.length; i < j; i++) {
					m[dat[i].parent.toString()].children.push(dat[i].id.toString());
					// populate parent.children_d
					p.children_d.push(dat[i].id.toString());
				}
				// 3) normalize && populate parents and children_d with recursion
				for(i = 0, j = p.children.length; i < j; i++) {
					tmp = this._parse_model_from_flat_json(m[p.children[i]], par, p.parents.concat());
					dpc.push(tmp);
					if(m[tmp].children_d.length) {
						dpc = dpc.concat(m[tmp].children_d);
					}
				}
				// ?) three_state selection - p.state.selected && t - (if three_state foreach(dat => ch) -> foreach(parents) if(parent.selected) child.selected = true;
			}
			else {
				for(i = 0, j = dat.length; i < j; i++) {
					tmp = this._parse_model_from_json(dat[i], par, p.parents.concat());
					if(tmp) {
						chd.push(tmp);
						dpc.push(tmp);
						if(m[tmp].children_d.length) {
							dpc = dpc.concat(m[tmp].children_d);
						}
					}
				}
				p.children = chd;
				p.children_d = dpc;
				for(i = 0, j = p.parents.length; i < j; i++) {
					m[p.parents[i]].children_d = m[p.parents[i]].children_d.concat(dpc);
				}
			}
			this.trigger('model', { "nodes" : dpc, 'parent' : par });

			if(par !== '#') {
				this._node_changed(par);
				this.redraw();
			}
			else {
				// this.get_container_ul().children('.jstree-initial-node').remove();
				this.redraw(true);
			}
			if(this._data.core.selected.length !== s) {
				this.trigger('changed', { 'action' : 'model', 'selected' : this._data.core.selected });
			}
			return true;
		},
		/**
		 * parses a node from a jQuery object and appends them to the in memory tree model. Used internally.
		 * @private
		 * @name _parse_model_from_html(d [, p, ps])
		 * @param  {jQuery} d the jQuery object to parse
		 * @param  {String} p the parent ID
		 * @param  {Array} ps list of all parents
		 * @return {String} the ID of the object added to the model
		 */
		_parse_model_from_html : function (d, p, ps) {
			if(!ps) { ps = []; }
			else { ps = [].concat(ps); }
			if(p) { ps.unshift(p); }
			var c, e, m = this._model.data,
				data = {
					id			: false,
					text		: false,
					icon		: true,
					parent		: p,
					parents		: ps,
					children	: [],
					children_d	: [],
					data		: null,
					state		: { },
					li_attr		: { id : false },
					a_attr		: { href : '#' },
					original	: false
				}, i, tmp, tid;
			for(i in this._model.default_state) {
				if(this._model.default_state.hasOwnProperty(i)) {
					data.state[i] = this._model.default_state[i];
				}
			}
			tmp = $.vakata.attributes(d, true);
			$.each(tmp, function (i, v) {
				v = $.trim(v);
				if(!v.length) { return true; }
				data.li_attr[i] = v;
				if(i === 'id') {
					data.id = v.toString();
				}
			});
			tmp = d.children('a').eq(0);
			if(tmp.length) {
				tmp = $.vakata.attributes(tmp, true);
				$.each(tmp, function (i, v) {
					v = $.trim(v);
					if(v.length) {
						data.a_attr[i] = v;
					}
				});
			}
			tmp = d.children("a:eq(0)").length ? d.children("a:eq(0)").clone() : d.clone();
			tmp.children("ins, i, ul").remove();
			tmp = tmp.html();
			tmp = $('<div />').html(tmp);
			data.text = tmp.html();
			tmp = d.data();
			data.data = tmp ? $.extend(true, {}, tmp) : null;
			data.state.opened = d.hasClass('jstree-open');
			data.state.selected = d.children('a').hasClass('jstree-clicked');
			data.state.disabled = d.children('a').hasClass('jstree-disabled');
			if(data.data && data.data.jstree) {
				for(i in data.data.jstree) {
					if(data.data.jstree.hasOwnProperty(i)) {
						data.state[i] = data.data.jstree[i];
					}
				}
			}
			tmp = d.children("a").children(".jstree-themeicon");
			if(tmp.length) {
				data.icon = tmp.hasClass('jstree-themeicon-hidden') ? false : tmp.attr('rel');
			}
			if(data.state.icon) {
				data.icon = data.state.icon;
			}
			tmp = d.children("ul").children("li");
			do {
				tid = 'j' + this._id + '_' + (++this._cnt);
			} while(m[tid]);
			data.id = data.li_attr.id ? data.li_attr.id.toString() : tid;
			if(tmp.length) {
				tmp.each($.proxy(function (i, v) {
					c = this._parse_model_from_html($(v), data.id, ps);
					e = this._model.data[c];
					data.children.push(c);
					if(e.children_d.length) {
						data.children_d = data.children_d.concat(e.children_d);
					}
				}, this));
				data.children_d = data.children_d.concat(data.children);
			}
			else {
				if(d.hasClass('jstree-closed')) {
					data.state.loaded = false;
				}
			}
			if(data.li_attr['class']) {
				data.li_attr['class'] = data.li_attr['class'].replace('jstree-closed','').replace('jstree-open','');
			}
			if(data.a_attr['class']) {
				data.a_attr['class'] = data.a_attr['class'].replace('jstree-clicked','').replace('jstree-disabled','');
			}
			m[data.id] = data;
			if(data.state.selected) {
				this._data.core.selected.push(data.id);
			}
			return data.id;
		},
		/**
		 * parses a node from a JSON object (used when dealing with flat data, which has no nesting of children, but has id and parent properties) and appends it to the in memory tree model. Used internally.
		 * @private
		 * @name _parse_model_from_flat_json(d [, p, ps])
		 * @param  {Object} d the JSON object to parse
		 * @param  {String} p the parent ID
		 * @param  {Array} ps list of all parents
		 * @return {String} the ID of the object added to the model
		 */
		_parse_model_from_flat_json : function (d, p, ps) {
			if(!ps) { ps = []; }
			else { ps = ps.concat(); }
			if(p) { ps.unshift(p); }
			var tid = d.id.toString(),
				m = this._model.data,
				df = this._model.default_state,
				i, j, c, e,
				tmp = {
					id			: tid,
					text		: d.text || '',
					icon		: d.icon !== undefined ? d.icon : true,
					parent		: p,
					parents		: ps,
					children	: d.children || [],
					children_d	: d.children_d || [],
					data		: d.data,
					state		: { },
					li_attr		: { id : false },
					a_attr		: { href : '#' },
					original	: false
				};
			for(i in df) {
				if(df.hasOwnProperty(i)) {
					tmp.state[i] = df[i];
				}
			}
			if(d && d.data && d.data.jstree && d.data.jstree.icon) {
				tmp.icon = d.data.jstree.icon;
			}
			if(d && d.data) {
				tmp.data = d.data;
				if(d.data.jstree) {
					for(i in d.data.jstree) {
						if(d.data.jstree.hasOwnProperty(i)) {
							tmp.state[i] = d.data.jstree[i];
						}
					}
				}
			}
			if(d && typeof d.state === 'object') {
				for (i in d.state) {
					if(d.state.hasOwnProperty(i)) {
						tmp.state[i] = d.state[i];
					}
				}
			}
			if(d && typeof d.li_attr === 'object') {
				for (i in d.li_attr) {
					if(d.li_attr.hasOwnProperty(i)) {
						tmp.li_attr[i] = d.li_attr[i];
					}
				}
			}
			if(!tmp.li_attr.id) {
				tmp.li_attr.id = tid;
			}
			if(d && typeof d.a_attr === 'object') {
				for (i in d.a_attr) {
					if(d.a_attr.hasOwnProperty(i)) {
						tmp.a_attr[i] = d.a_attr[i];
					}
				}
			}
			if(d && d.children && d.children === true) {
				tmp.state.loaded = false;
				tmp.children = [];
				tmp.children_d = [];
			}
			m[tmp.id] = tmp;
			for(i = 0, j = tmp.children.length; i < j; i++) {
				c = this._parse_model_from_flat_json(m[tmp.children[i]], tmp.id, ps);
				e = m[c];
				tmp.children_d.push(c);
				if(e.children_d.length) {
					tmp.children_d = tmp.children_d.concat(e.children_d);
				}
			}
			delete d.data;
			delete d.children;
			m[tmp.id].original = d;
			if(tmp.state.selected) {
				this._data.core.selected.push(tmp.id);
			}
			return tmp.id;
		},
		/**
		 * parses a node from a JSON object and appends it to the in memory tree model. Used internally.
		 * @private
		 * @name _parse_model_from_json(d [, p, ps])
		 * @param  {Object} d the JSON object to parse
		 * @param  {String} p the parent ID
		 * @param  {Array} ps list of all parents
		 * @return {String} the ID of the object added to the model
		 */
		_parse_model_from_json : function (d, p, ps) {
			if(!ps) { ps = []; }
			else { ps = ps.concat(); }
			if(p) { ps.unshift(p); }
			var tid = false, i, j, c, e, m = this._model.data, df = this._model.default_state, tmp;
			do {
				tid = 'j' + this._id + '_' + (++this._cnt);
			} while(m[tid]);

			tmp = {
				id			: false,
				text		: typeof d === 'string' ? d : '',
				icon		: typeof d === 'object' && d.icon !== undefined ? d.icon : true,
				parent		: p,
				parents		: ps,
				children	: [],
				children_d	: [],
				data		: null,
				state		: { },
				li_attr		: { id : false },
				a_attr		: { href : '#' },
				original	: false
			};
			for(i in df) {
				if(df.hasOwnProperty(i)) {
					tmp.state[i] = df[i];
				}
			}
			if(d && d.id) { tmp.id = d.id.toString(); }
			if(d && d.text) { tmp.text = d.text; }
			if(d && d.data && d.data.jstree && d.data.jstree.icon) {
				tmp.icon = d.data.jstree.icon;
			}
			if(d && d.data) {
				tmp.data = d.data;
				if(d.data.jstree) {
					for(i in d.data.jstree) {
						if(d.data.jstree.hasOwnProperty(i)) {
							tmp.state[i] = d.data.jstree[i];
						}
					}
				}
			}
			if(d && typeof d.state === 'object') {
				for (i in d.state) {
					if(d.state.hasOwnProperty(i)) {
						tmp.state[i] = d.state[i];
					}
				}
			}
			if(d && typeof d.li_attr === 'object') {
				for (i in d.li_attr) {
					if(d.li_attr.hasOwnProperty(i)) {
						tmp.li_attr[i] = d.li_attr[i];
					}
				}
			}
			if(tmp.li_attr.id && !tmp.id) {
				tmp.id = tmp.li_attr.id.toString();
			}
			if(!tmp.id) {
				tmp.id = tid;
			}
			if(!tmp.li_attr.id) {
				tmp.li_attr.id = tmp.id;
			}
			if(d && typeof d.a_attr === 'object') {
				for (i in d.a_attr) {
					if(d.a_attr.hasOwnProperty(i)) {
						tmp.a_attr[i] = d.a_attr[i];
					}
				}
			}
			if(d && d.children && d.children.length) {
				for(i = 0, j = d.children.length; i < j; i++) {
					c = this._parse_model_from_json(d.children[i], tmp.id, ps);
					e = m[c];
					tmp.children.push(c);
					if(e.children_d.length) {
						tmp.children_d = tmp.children_d.concat(e.children_d);
					}
				}
				tmp.children_d = tmp.children_d.concat(tmp.children);
			}
			if(d && d.children && d.children === true) {
				tmp.state.loaded = false;
				tmp.children = [];
				tmp.children_d = [];
			}
			delete d.data;
			delete d.children;
			tmp.original = d;
			m[tmp.id] = tmp;
			if(tmp.state.selected) {
				this._data.core.selected.push(tmp.id);
			}
			return tmp.id;
		},
		/**
		 * redraws all nodes that need to be redrawn. Used internally.
		 * @private
		 * @name _redraw()
		 * @trigger redraw.jstree
		 */
		_redraw : function () {
			var nodes = this._model.force_full_redraw ? this._model.data['#'].children.concat([]) : this._model.changed.concat([]),
				f = document.createElement('UL'), tmp, i, j;
			for(i = 0, j = nodes.length; i < j; i++) {
				tmp = this.redraw_node(nodes[i], true, this._model.force_full_redraw);
				if(tmp && this._model.force_full_redraw) {
					f.appendChild(tmp);
				}
			}
			if(this._model.force_full_redraw) {
				f.className = this.get_container_ul()[0].className;
				this.element.empty().append(f);
				//this.get_container_ul()[0].appendChild(f);
			}
			this._model.force_full_redraw = false;
			this._model.changed = [];
			/**
			 * triggered after nodes are redrawn
			 * @event
			 * @name redraw.jstree
			 * @param {array} nodes the redrawn nodes
			 */
			this.trigger('redraw', { "nodes" : nodes });
		},
		/**
		 * redraws all nodes that need to be redrawn or optionally - the whole tree
		 * @name redraw([full])
		 * @param {Boolean} full if set to `true` all nodes are redrawn.
		 */
		redraw : function (full) {
			if(full) {
				this._model.force_full_redraw = true;
			}
			//if(this._model.redraw_timeout) {
			//	clearTimeout(this._model.redraw_timeout);
			//}
			//this._model.redraw_timeout = setTimeout($.proxy(this._redraw, this),0);
			this._redraw();
		},
		/**
		 * redraws a single node. Used internally.
		 * @private
		 * @name redraw_node(node, deep, is_callback)
		 * @param {mixed} node the node to redraw
		 * @param {Boolean} deep should child nodes be redrawn too
		 * @param {Boolean} is_callback is this a recursion call
		 */
		redraw_node : function (node, deep, is_callback) {
			var obj = this.get_node(node),
				par = false,
				ind = false,
				old = false,
				i = false,
				j = false,
				k = false,
				c = '',
				d = document,
				m = this._model.data,
				f = false,
				s = false;
			if(!obj) { return false; }
			if(obj.id === '#') {  return this.redraw(true); }
			deep = deep || obj.children.length === 0;
			node = !document.querySelector ? document.getElementById(obj.id) : this.element[0].querySelector('#' + ("0123456789".indexOf(obj.id[0]) !== -1 ? '\\3' + obj.id[0] + ' ' + obj.id.substr(1).replace($.jstree.idregex,'\\$&') : obj.id.replace($.jstree.idregex,'\\$&')) ); //, this.element);
			if(!node) {
				deep = true;
				//node = d.createElement('LI');
				if(!is_callback) {
					par = obj.parent !== '#' ? $('#' + obj.parent.replace($.jstree.idregex,'\\$&'), this.element)[0] : null;
					if(par !== null && (!par || !m[obj.parent].state.opened)) {
						return false;
					}
					ind = $.inArray(obj.id, par === null ? m['#'].children : m[obj.parent].children);
				}
			}
			else {
				node = $(node);
				if(!is_callback) {
					par = node.parent().parent()[0];
					if(par === this.element[0]) {
						par = null;
					}
					ind = node.index();
				}
				// m[obj.id].data = node.data(); // use only node's data, no need to touch jquery storage
				if(!deep && obj.children.length && !node.children('ul').length) {
					deep = true;
				}
				if(!deep) {
					old = node.children('UL')[0];
				}
				s = node.attr('aria-selected');
				f = node.children('.jstree-anchor')[0] === document.activeElement;
				node.remove();
				//node = d.createElement('LI');
				//node = node[0];
			}
			node = _node.cloneNode(true);
			// node is DOM, deep is boolean

			c = 'jstree-node ';
			for(i in obj.li_attr) {
				if(obj.li_attr.hasOwnProperty(i)) {
					if(i === 'id') { continue; }
					if(i !== 'class') {
						node.setAttribute(i, obj.li_attr[i]);
					}
					else {
						c += obj.li_attr[i];
					}
				}
			}
			if(s && s !== "false") {
				node.setAttribute('aria-selected', true);
			}
			if(obj.state.loaded && !obj.children.length) {
				c += ' jstree-leaf';
			}
			else {
				c += obj.state.opened && obj.state.loaded ? ' jstree-open' : ' jstree-closed';
				node.setAttribute('aria-expanded', (obj.state.opened && obj.state.loaded) );
			}
			if(obj.parent !== null && m[obj.parent].children[m[obj.parent].children.length - 1] === obj.id) {
				c += ' jstree-last';
			}
			node.id = obj.id;
			node.className = c;
			c = ( obj.state.selected ? ' jstree-clicked' : '') + ( obj.state.disabled ? ' jstree-disabled' : '');
			for(j in obj.a_attr) {
				if(obj.a_attr.hasOwnProperty(j)) {
					if(j === 'href' && obj.a_attr[j] === '#') { continue; }
					if(j !== 'class') {
						node.childNodes[1].setAttribute(j, obj.a_attr[j]);
					}
					else {
						c += ' ' + obj.a_attr[j];
					}
				}
			}
			if(c.length) {
				node.childNodes[1].className = 'jstree-anchor ' + c;
			}
			if((obj.icon && obj.icon !== true) || obj.icon === false) {
				if(obj.icon === false) {
					node.childNodes[1].childNodes[0].className += ' jstree-themeicon-hidden';
				}
				else if(obj.icon.indexOf('/') === -1 && obj.icon.indexOf('.') === -1) {
					node.childNodes[1].childNodes[0].className += ' ' + obj.icon + ' jstree-themeicon-custom';
				}
				else {
					node.childNodes[1].childNodes[0].style.backgroundImage = 'url('+obj.icon+')';
					node.childNodes[1].childNodes[0].style.backgroundPosition = 'center center';
					node.childNodes[1].childNodes[0].style.backgroundSize = 'auto';
					node.childNodes[1].childNodes[0].className += ' jstree-themeicon-custom';
				}
			}
			//node.childNodes[1].appendChild(d.createTextNode(obj.text));
			node.childNodes[1].innerHTML += obj.text;
			// if(obj.data) { $.data(node, obj.data); } // always work with node's data, no need to touch jquery store

			if(deep && obj.children.length && obj.state.opened && obj.state.loaded) {
				k = d.createElement('UL');
				k.setAttribute('role', 'group');
				k.className = 'jstree-children';
				for(i = 0, j = obj.children.length; i < j; i++) {
					k.appendChild(this.redraw_node(obj.children[i], deep, true));
				}
				node.appendChild(k);
			}
			if(old) {
				node.appendChild(old);
			}
			if(!is_callback) {
				// append back using par / ind
				if(!par) {
					par = this.element[0];
				}
				if(!par.getElementsByTagName('UL').length) {
					i = d.createElement('UL');
					i.setAttribute('role', 'group');
					i.className = 'jstree-children';
					par.appendChild(i);
					par = i;
				}
				else {
					par = par.getElementsByTagName('UL')[0];
				}

				if(ind < par.childNodes.length) {
					par.insertBefore(node, par.childNodes[ind]);
				}
				else {
					par.appendChild(node);
				}
				if(f) {
					node.childNodes[1].focus();
				}
			}
			if(obj.state.opened && !obj.state.loaded) {
				obj.state.opened = false;
				setTimeout($.proxy(function () {
					this.open_node(obj.id, false, 0);
				}, this), 0);
			}
			return node;
		},
		/**
		 * opens a node, revaling its children. If the node is not loaded it will be loaded and opened once ready.
		 * @name open_node(obj [, callback, animation])
		 * @param {mixed} obj the node to open
		 * @param {Function} callback a function to execute once the node is opened
		 * @param {Number} animation the animation duration in milliseconds when opening the node (overrides the `core.animation` setting). Use `false` for no animation.
		 * @trigger open_node.jstree, after_open.jstree, before_open.jstree
		 */
		open_node : function (obj, callback, animation) {
			var t1, t2, d, t;
			if($.isArray(obj)) {
				obj = obj.slice();
				for(t1 = 0, t2 = obj.length; t1 < t2; t1++) {
					this.open_node(obj[t1], callback, animation);
				}
				return true;
			}
			obj = this.get_node(obj);
			if(!obj || obj.id === '#') {
				return false;
			}
			animation = animation === undefined ? this.settings.core.animation : animation;
			if(!this.is_closed(obj)) {
				if(callback) {
					callback.call(this, obj, false);
				}
				return false;
			}
			if(!this.is_loaded(obj)) {
				if(this.is_loading(obj)) {
					return setTimeout($.proxy(function () {
						this.open_node(obj, callback, animation);
					}, this), 500);
				}
				this.load_node(obj, function (o, ok) {
					return ok ? this.open_node(o, callback, animation) : (callback ? callback.call(this, o, false) : false);
				});
			}
			else {
				d = this.get_node(obj, true);
				t = this;
				if(d.length) {
					if(obj.children.length && !this._firstChild(d.children('ul')[0])) {
						obj.state.opened = true;
						this.redraw_node(obj, true);
						d = this.get_node(obj, true);
					}
					if(!animation) {
						this.trigger('before_open', { "node" : obj });
						d[0].className = d[0].className.replace('jstree-closed', 'jstree-open');
						d[0].setAttribute("aria-expanded", true);
					}
					else {
						this.trigger('before_open', { "node" : obj });
						d
							.children("ul").css("display","none").end()
							.removeClass("jstree-closed").addClass("jstree-open").attr("aria-expanded", true)
							.children("ul").stop(true, true)
								.slideDown(animation, function () {
									this.style.display = "";
									t.trigger("after_open", { "node" : obj });
								});
					}
				}
				obj.state.opened = true;
				if(callback) {
					callback.call(this, obj, true);
				}
				if(!d.length) {
					/**
					 * triggered when a node is about to be opened (if the node is supposed to be in the DOM, it will be, but it won't be visible yet)
					 * @event
					 * @name before_open.jstree
					 * @param {Object} node the opened node
					 */
					this.trigger('before_open', { "node" : obj });
				}
				/**
				 * triggered when a node is opened (if there is an animation it will not be completed yet)
				 * @event
				 * @name open_node.jstree
				 * @param {Object} node the opened node
				 */
				this.trigger('open_node', { "node" : obj });
				if(!animation || !d.length) {
					/**
					 * triggered when a node is opened and the animation is complete
					 * @event
					 * @name after_open.jstree
					 * @param {Object} node the opened node
					 */
					this.trigger("after_open", { "node" : obj });
				}
			}
		},
		/**
		 * opens every parent of a node (node should be loaded)
		 * @name _open_to(obj)
		 * @param {mixed} obj the node to reveal
		 * @private
		 */
		_open_to : function (obj) {
			obj = this.get_node(obj);
			if(!obj || obj.id === '#') {
				return false;
			}
			var i, j, p = obj.parents;
			for(i = 0, j = p.length; i < j; i+=1) {
				if(i !== '#') {
					this.open_node(p[i], false, 0);
				}
			}
			return $('#' + obj.id.replace($.jstree.idregex,'\\$&'), this.element);
		},
		/**
		 * closes a node, hiding its children
		 * @name close_node(obj [, animation])
		 * @param {mixed} obj the node to close
		 * @param {Number} animation the animation duration in milliseconds when closing the node (overrides the `core.animation` setting). Use `false` for no animation.
		 * @trigger close_node.jstree, after_close.jstree
		 */
		close_node : function (obj, animation) {
			var t1, t2, t, d;
			if($.isArray(obj)) {
				obj = obj.slice();
				for(t1 = 0, t2 = obj.length; t1 < t2; t1++) {
					this.close_node(obj[t1], animation);
				}
				return true;
			}
			obj = this.get_node(obj);
			if(!obj || obj.id === '#') {
				return false;
			}
			if(this.is_closed(obj)) {
				return false;
			}
			animation = animation === undefined ? this.settings.core.animation : animation;
			t = this;
			d = this.get_node(obj, true);
			if(d.length) {
				if(!animation) {
					d[0].className = d[0].className.replace('jstree-open', 'jstree-closed');
					d.attr("aria-expanded", false).children('ul').remove();
				}
				else {
					d
						.children("ul").attr("style","display:block !important").end()
						.removeClass("jstree-open").addClass("jstree-closed").attr("aria-expanded", false)
						.children("ul").stop(true, true).slideUp(animation, function () {
							this.style.display = "";
							d.children('ul').remove();
							t.trigger("after_close", { "node" : obj });
						});
				}
			}
			obj.state.opened = false;
			/**
			 * triggered when a node is closed (if there is an animation it will not be complete yet)
			 * @event
			 * @name close_node.jstree
			 * @param {Object} node the closed node
			 */
			this.trigger('close_node',{ "node" : obj });
			if(!animation || !d.length) {
				/**
				 * triggered when a node is closed and the animation is complete
				 * @event
				 * @name after_close.jstree
				 * @param {Object} node the closed node
				 */
				this.trigger("after_close", { "node" : obj });
			}
		},
		/**
		 * toggles a node - closing it if it is open, opening it if it is closed
		 * @name toggle_node(obj)
		 * @param {mixed} obj the node to toggle
		 */
		toggle_node : function (obj) {
			var t1, t2;
			if($.isArray(obj)) {
				obj = obj.slice();
				for(t1 = 0, t2 = obj.length; t1 < t2; t1++) {
					this.toggle_node(obj[t1]);
				}
				return true;
			}
			if(this.is_closed(obj)) {
				return this.open_node(obj);
			}
			if(this.is_open(obj)) {
				return this.close_node(obj);
			}
		},
		/**
		 * opens all nodes within a node (or the tree), revaling their children. If the node is not loaded it will be loaded and opened once ready.
		 * @name open_all([obj, animation, original_obj])
		 * @param {mixed} obj the node to open recursively, omit to open all nodes in the tree
		 * @param {Number} animation the animation duration in milliseconds when opening the nodes, the default is no animation
		 * @param {jQuery} reference to the node that started the process (internal use)
		 * @trigger open_all.jstree
		 */
		open_all : function (obj, animation, original_obj) {
			if(!obj) { obj = '#'; }
			obj = this.get_node(obj);
			if(!obj) { return false; }
			var dom = obj.id === '#' ? this.get_container_ul() : this.get_node(obj, true), i, j, _this;
			if(!dom.length) {
				for(i = 0, j = obj.children_d.length; i < j; i++) {
					if(this.is_closed(this._model.data[obj.children_d[i]])) {
						this._model.data[obj.children_d[i]].state.opened = true;
					}
				}
				return this.trigger('open_all', { "node" : obj });
			}
			original_obj = original_obj || dom;
			_this = this;
			dom = this.is_closed(obj) ? dom.find('li.jstree-closed').addBack() : dom.find('li.jstree-closed');
			dom.each(function () {
				_this.open_node(
					this,
					function(node, status) { if(status && this.is_parent(node)) { this.open_all(node, animation, original_obj); } },
					animation || 0
				);
			});
			if(original_obj.find('li.jstree-closed').length === 0) {
				/**
				 * triggered when an `open_all` call completes
				 * @event
				 * @name open_all.jstree
				 * @param {Object} node the opened node
				 */
				this.trigger('open_all', { "node" : this.get_node(original_obj) });
			}
		},
		/**
		 * closes all nodes within a node (or the tree), revaling their children
		 * @name close_all([obj, animation])
		 * @param {mixed} obj the node to close recursively, omit to close all nodes in the tree
		 * @param {Number} animation the animation duration in milliseconds when closing the nodes, the default is no animation
		 * @trigger close_all.jstree
		 */
		close_all : function (obj, animation) {
			if(!obj) { obj = '#'; }
			obj = this.get_node(obj);
			if(!obj) { return false; }
			var dom = obj.id === '#' ? this.get_container_ul() : this.get_node(obj, true),
				_this = this, i, j;
			if(!dom.length) {
				for(i = 0, j = obj.children_d.length; i < j; i++) {
					this._model.data[obj.children_d[i]].state.opened = false;
				}
				return this.trigger('close_all', { "node" : obj });
			}
			dom = this.is_open(obj) ? dom.find('li.jstree-open').addBack() : dom.find('li.jstree-open');
			$(dom.get().reverse()).each(function () { _this.close_node(this, animation || 0); });
			/**
			 * triggered when an `close_all` call completes
			 * @event
			 * @name close_all.jstree
			 * @param {Object} node the closed node
			 */
			this.trigger('close_all', { "node" : obj });
		},
		/**
		 * checks if a node is disabled (not selectable)
		 * @name is_disabled(obj)
		 * @param  {mixed} obj
		 * @return {Boolean}
		 */
		is_disabled : function (obj) {
			obj = this.get_node(obj);
			return obj && obj.state && obj.state.disabled;
		},
		/**
		 * enables a node - so that it can be selected
		 * @name enable_node(obj)
		 * @param {mixed} obj the node to enable
		 * @trigger enable_node.jstree
		 */
		enable_node : function (obj) {
			var t1, t2;
			if($.isArray(obj)) {
				obj = obj.slice();
				for(t1 = 0, t2 = obj.length; t1 < t2; t1++) {
					this.enable_node(obj[t1]);
				}
				return true;
			}
			obj = this.get_node(obj);
			if(!obj || obj.id === '#') {
				return false;
			}
			obj.state.disabled = false;
			this.get_node(obj,true).children('.jstree-anchor').removeClass('jstree-disabled');
			/**
			 * triggered when an node is enabled
			 * @event
			 * @name enable_node.jstree
			 * @param {Object} node the enabled node
			 */
			this.trigger('enable_node', { 'node' : obj });
		},
		/**
		 * disables a node - so that it can not be selected
		 * @name disable_node(obj)
		 * @param {mixed} obj the node to disable
		 * @trigger disable_node.jstree
		 */
		disable_node : function (obj) {
			var t1, t2;
			if($.isArray(obj)) {
				obj = obj.slice();
				for(t1 = 0, t2 = obj.length; t1 < t2; t1++) {
					this.disable_node(obj[t1]);
				}
				return true;
			}
			obj = this.get_node(obj);
			if(!obj || obj.id === '#') {
				return false;
			}
			obj.state.disabled = true;
			this.get_node(obj,true).children('.jstree-anchor').addClass('jstree-disabled');
			/**
			 * triggered when an node is disabled
			 * @event
			 * @name disable_node.jstree
			 * @param {Object} node the disabled node
			 */
			this.trigger('disable_node', { 'node' : obj });
		},
		/**
		 * called when a node is selected by the user. Used internally.
		 * @private
		 * @name activate_node(obj, e)
		 * @param {mixed} obj the node
		 * @param {Object} e the related event
		 * @trigger activate_node.jstree
		 */
		activate_node : function (obj, e) {
			if(this.is_disabled(obj)) {
				return false;
			}

			// ensure last_clicked is still in the DOM, make it fresh (maybe it was moved?) and make sure it is still selected, if not - make last_clicked the last selected node
			this._data.core.last_clicked = this._data.core.last_clicked && this._data.core.last_clicked.id !== undefined ? this.get_node(this._data.core.last_clicked.id) : null;
			if(this._data.core.last_clicked && !this._data.core.last_clicked.state.selected) { this._data.core.last_clicked = null; }
			if(!this._data.core.last_clicked && this._data.core.selected.length) { this._data.core.last_clicked = this.get_node(this._data.core.selected[this._data.core.selected.length - 1]); }

			if(!this.settings.core.multiple || (!e.metaKey && !e.ctrlKey && !e.shiftKey) || (e.shiftKey && (!this._data.core.last_clicked || !this.get_parent(obj) || this.get_parent(obj) !== this._data.core.last_clicked.parent ) )) {
				if(!this.settings.core.multiple && (e.metaKey || e.ctrlKey || e.shiftKey) && this.is_selected(obj)) {
					this.deselect_node(obj, false, false, e);
				}
				else {
					this.deselect_all(true);
					this.select_node(obj, false, false, e);
					this._data.core.last_clicked = this.get_node(obj);
				}
			}
			else {
				if(e.shiftKey) {
					var o = this.get_node(obj).id,
						l = this._data.core.last_clicked.id,
						p = this.get_node(this._data.core.last_clicked.parent).children,
						c = false,
						i, j;
					for(i = 0, j = p.length; i < j; i += 1) {
						// separate IFs work whem o and l are the same
						if(p[i] === o) {
							c = !c;
						}
						if(p[i] === l) {
							c = !c;
						}
						if(c || p[i] === o || p[i] === l) {
							this.select_node(p[i], false, false, e);
						}
						else {
							this.deselect_node(p[i], false, false, e);
						}
					}
				}
				else {
					if(!this.is_selected(obj)) {
						this.select_node(obj, false, false, e);
					}
					else {
						this.deselect_node(obj, false, false, e);
					}
				}
			}
			/**
			 * triggered when an node is clicked or intercated with by the user
			 * @event
			 * @name activate_node.jstree
			 * @param {Object} node
			 */
			this.trigger('activate_node', { 'node' : this.get_node(obj) });
		},
		/**
		 * applies the hover state on a node, called when a node is hovered by the user. Used internally.
		 * @private
		 * @name hover_node(obj)
		 * @param {mixed} obj
		 * @trigger hover_node.jstree
		 */
		hover_node : function (obj) {
			obj = this.get_node(obj, true);
			if(!obj || !obj.length || obj.children('.jstree-hovered').length) {
				return false;
			}
			var o = this.element.find('.jstree-hovered'), t = this.element;
			if(o && o.length) { this.dehover_node(o); }

			obj.children('.jstree-anchor').addClass('jstree-hovered');
			/**
			 * triggered when an node is hovered
			 * @event
			 * @name hover_node.jstree
			 * @param {Object} node
			 */
			this.trigger('hover_node', { 'node' : this.get_node(obj) });
			setTimeout(function () { t.attr('aria-activedescendant', obj[0].id); obj.attr('aria-selected', true); }, 0);
		},
		/**
		 * removes the hover state from a nodecalled when a node is no longer hovered by the user. Used internally.
		 * @private
		 * @name dehover_node(obj)
		 * @param {mixed} obj
		 * @trigger dehover_node.jstree
		 */
		dehover_node : function (obj) {
			obj = this.get_node(obj, true);
			if(!obj || !obj.length || !obj.children('.jstree-hovered').length) {
				return false;
			}
			obj.attr('aria-selected', false).children('.jstree-anchor').removeClass('jstree-hovered');
			/**
			 * triggered when an node is no longer hovered
			 * @event
			 * @name dehover_node.jstree
			 * @param {Object} node
			 */
			this.trigger('dehover_node', { 'node' : this.get_node(obj) });
		},
		/**
		 * select a node
		 * @name select_node(obj [, supress_event, prevent_open])
		 * @param {mixed} obj an array can be used to select multiple nodes
		 * @param {Boolean} supress_event if set to `true` the `changed.jstree` event won't be triggered
		 * @param {Boolean} prevent_open if set to `true` parents of the selected node won't be opened
		 * @trigger select_node.jstree, changed.jstree
		 */
		select_node : function (obj, supress_event, prevent_open, e) {
			var dom, t1, t2, th;
			if($.isArray(obj)) {
				obj = obj.slice();
				for(t1 = 0, t2 = obj.length; t1 < t2; t1++) {
					this.select_node(obj[t1], supress_event, prevent_open, e);
				}
				return true;
			}
			obj = this.get_node(obj);
			if(!obj || obj.id === '#') {
				return false;
			}
			dom = this.get_node(obj, true);
			if(!obj.state.selected) {
				obj.state.selected = true;
				this._data.core.selected.push(obj.id);
				if(!prevent_open) {
					dom = this._open_to(obj);
				}
				if(dom && dom.length) {
					dom.children('.jstree-anchor').addClass('jstree-clicked');
				}
				/**
				 * triggered when an node is selected
				 * @event
				 * @name select_node.jstree
				 * @param {Object} node
				 * @param {Array} selected the current selection
				 * @param {Object} event the event (if any) that triggered this select_node
				 */
				this.trigger('select_node', { 'node' : obj, 'selected' : this._data.core.selected, 'event' : e });
				if(!supress_event) {
					/**
					 * triggered when selection changes
					 * @event
					 * @name changed.jstree
					 * @param {Object} node
					 * @param {Object} action the action that caused the selection to change
					 * @param {Array} selected the current selection
					 * @param {Object} event the event (if any) that triggered this changed event
					 */
					this.trigger('changed', { 'action' : 'select_node', 'node' : obj, 'selected' : this._data.core.selected, 'event' : e });
				}
			}
		},
		/**
		 * deselect a node
		 * @name deselect_node(obj [, supress_event])
		 * @param {mixed} obj an array can be used to deselect multiple nodes
		 * @param {Boolean} supress_event if set to `true` the `changed.jstree` event won't be triggered
		 * @trigger deselect_node.jstree, changed.jstree
		 */
		deselect_node : function (obj, supress_event, e) {
			var t1, t2, dom;
			if($.isArray(obj)) {
				obj = obj.slice();
				for(t1 = 0, t2 = obj.length; t1 < t2; t1++) {
					this.deselect_node(obj[t1], supress_event, e);
				}
				return true;
			}
			obj = this.get_node(obj);
			if(!obj || obj.id === '#') {
				return false;
			}
			dom = this.get_node(obj, true);
			if(obj.state.selected) {
				obj.state.selected = false;
				this._data.core.selected = $.vakata.array_remove_item(this._data.core.selected, obj.id);
				if(dom.length) {
					dom.children('.jstree-anchor').removeClass('jstree-clicked');
				}
				/**
				 * triggered when an node is deselected
				 * @event
				 * @name deselect_node.jstree
				 * @param {Object} node
				 * @param {Array} selected the current selection
				 * @param {Object} event the event (if any) that triggered this deselect_node
				 */
				this.trigger('deselect_node', { 'node' : obj, 'selected' : this._data.core.selected, 'event' : e });
				if(!supress_event) {
					this.trigger('changed', { 'action' : 'deselect_node', 'node' : obj, 'selected' : this._data.core.selected, 'event' : e });
				}
			}
		},
		/**
		 * select all nodes in the tree
		 * @name select_all([supress_event])
		 * @param {Boolean} supress_event if set to `true` the `changed.jstree` event won't be triggered
		 * @trigger select_all.jstree, changed.jstree
		 */
		select_all : function (supress_event) {
			var tmp = this._data.core.selected.concat([]), i, j;
			this._data.core.selected = this._model.data['#'].children_d.concat();
			for(i = 0, j = this._data.core.selected.length; i < j; i++) {
				if(this._model.data[this._data.core.selected[i]]) {
					this._model.data[this._data.core.selected[i]].state.selected = true;
				}
			}
			this.redraw(true);
			/**
			 * triggered when all nodes are selected
			 * @event
			 * @name select_all.jstree
			 * @param {Array} selected the current selection
			 */
			this.trigger('select_all', { 'selected' : this._data.core.selected });
			if(!supress_event) {
				this.trigger('changed', { 'action' : 'select_all', 'selected' : this._data.core.selected, 'old_selection' : tmp });
			}
		},
		/**
		 * deselect all selected nodes
		 * @name deselect_all([supress_event])
		 * @param {Boolean} supress_event if set to `true` the `changed.jstree` event won't be triggered
		 * @trigger deselect_all.jstree, changed.jstree
		 */
		deselect_all : function (supress_event) {
			var tmp = this._data.core.selected.concat([]), i, j;
			for(i = 0, j = this._data.core.selected.length; i < j; i++) {
				if(this._model.data[this._data.core.selected[i]]) {
					this._model.data[this._data.core.selected[i]].state.selected = false;
				}
			}
			this._data.core.selected = [];
			this.element.find('.jstree-clicked').removeClass('jstree-clicked');
			/**
			 * triggered when all nodes are deselected
			 * @event
			 * @name deselect_all.jstree
			 * @param {Object} node the previous selection
			 * @param {Array} selected the current selection
			 */
			this.trigger('deselect_all', { 'selected' : this._data.core.selected, 'node' : tmp });
			if(!supress_event) {
				this.trigger('changed', { 'action' : 'deselect_all', 'selected' : this._data.core.selected, 'old_selection' : tmp });
			}
		},
		/**
		 * checks if a node is selected
		 * @name is_selected(obj)
		 * @param  {mixed}  obj
		 * @return {Boolean}
		 */
		is_selected : function (obj) {
			obj = this.get_node(obj);
			if(!obj || obj.id === '#') {
				return false;
			}
			return obj.state.selected;
		},
		/**
		 * get an array of all selected nodes
		 * @name get_selected([full])
		 * @param  {mixed}  full if set to `true` the returned array will consist of the full node objects, otherwise - only IDs will be returned
		 * @return {Array}
		 */
		get_selected : function (full) {
			return full ? $.map(this._data.core.selected, $.proxy(function (i) { return this.get_node(i); }, this)) : this._data.core.selected;
		},
		/**
		 * get an array of all top level selected nodes (ignoring children of selected nodes)
		 * @name get_top_selected([full])
		 * @param  {mixed}  full if set to `true` the returned array will consist of the full node objects, otherwise - only IDs will be returned
		 * @return {Array}
		 */
		get_top_selected : function (full) {
			var tmp = this.get_selected(true),
				obj = {}, i, j, k, l;
			for(i = 0, j = tmp.length; i < j; i++) {
				obj[tmp[i].id] = tmp[i];
			}
			for(i = 0, j = tmp.length; i < j; i++) {
				for(k = 0, l = tmp[i].children_d.length; k < l; k++) {
					if(obj[tmp[i].children_d[k]]) {
						delete obj[tmp[i].children_d[k]];
					}
				}
			}
			tmp = [];
			for(i in obj) {
				if(obj.hasOwnProperty(i)) {
					tmp.push(i);
				}
			}
			return full ? $.map(tmp, $.proxy(function (i) { return this.get_node(i); }, this)) : tmp;
		},
		/**
		 * get an array of all bottom level selected nodes (ignoring selected parents)
		 * @name get_top_selected([full])
		 * @param  {mixed}  full if set to `true` the returned array will consist of the full node objects, otherwise - only IDs will be returned
		 * @return {Array}
		 */
		get_bottom_selected : function (full) {
			var tmp = this.get_selected(true),
				obj = [], i, j;
			for(i = 0, j = tmp.length; i < j; i++) {
				if(!tmp[i].children.length) {
					obj.push(tmp[i].id);
				}
			}
			return full ? $.map(obj, $.proxy(function (i) { return this.get_node(i); }, this)) : obj;
		},
		/**
		 * gets the current state of the tree so that it can be restored later with `set_state(state)`. Used internally.
		 * @name get_state()
		 * @private
		 * @return {Object}
		 */
		get_state : function () {
			var state	= {
				'core' : {
					'open' : [],
					'scroll' : {
						'left' : this.element.scrollLeft(),
						'top' : this.element.scrollTop()
					},
					/*!
					'themes' : {
						'name' : this.get_theme(),
						'icons' : this._data.core.themes.icons,
						'dots' : this._data.core.themes.dots
					},
					*/
					'selected' : []
				}
			}, i;
			for(i in this._model.data) {
				if(this._model.data.hasOwnProperty(i)) {
					if(i !== '#') {
						if(this._model.data[i].state.opened) {
							state.core.open.push(i);
						}
						if(this._model.data[i].state.selected) {
							state.core.selected.push(i);
						}
					}
				}
			}
			return state;
		},
		/**
		 * sets the state of the tree. Used internally.
		 * @name set_state(state [, callback])
		 * @private
		 * @param {Object} state the state to restore
		 * @param {Function} callback an optional function to execute once the state is restored.
		 * @trigger set_state.jstree
		 */
		set_state : function (state, callback) {
			if(state) {
				if(state.core) {
					var res, n, t, _this;
					if(state.core.open) {
						if(!$.isArray(state.core.open)) {
							delete state.core.open;
							this.set_state(state, callback);
							return false;
						}
						res = true;
						n = false;
						t = this;
						$.each(state.core.open.concat([]), function (i, v) {
							n = t.get_node(v);
							if(n) {
								if(t.is_loaded(v)) {
									if(t.is_closed(v)) {
										t.open_node(v, false, 0);
									}
									if(state && state.core && state.core.open) {
										$.vakata.array_remove_item(state.core.open, v);
									}
								}
								else {
									if(!t.is_loading(v)) {
										t.open_node(v, $.proxy(function (o, s) {
											if(!s && state && state.core && state.core.open) {
												$.vakata.array_remove_item(state.core.open, o.id);
											}
											this.set_state(state, callback);
										}, t), 0);
									}
									// there will be some async activity - so wait for it
									res = false;
								}
							}
						});
						if(res) {
							delete state.core.open;
							this.set_state(state, callback);
						}
						return false;
					}
					if(state.core.scroll) {
						if(state.core.scroll && state.core.scroll.left !== undefined) {
							this.element.scrollLeft(state.core.scroll.left);
						}
						if(state.core.scroll && state.core.scroll.top !== undefined) {
							this.element.scrollTop(state.core.scroll.top);
						}
						delete state.core.scroll;
						this.set_state(state, callback);
						return false;
					}
					/*!
					if(state.core.themes) {
						if(state.core.themes.name) {
							this.set_theme(state.core.themes.name);
						}
						if(typeof state.core.themes.dots !== 'undefined') {
							this[ state.core.themes.dots ? "show_dots" : "hide_dots" ]();
						}
						if(typeof state.core.themes.icons !== 'undefined') {
							this[ state.core.themes.icons ? "show_icons" : "hide_icons" ]();
						}
						delete state.core.themes;
						delete state.core.open;
						this.set_state(state, callback);
						return false;
					}
					*/
					if(state.core.selected) {
						_this = this;
						this.deselect_all();
						$.each(state.core.selected, function (i, v) {
							_this.select_node(v);
						});
						delete state.core.selected;
						this.set_state(state, callback);
						return false;
					}
					if($.isEmptyObject(state.core)) {
						delete state.core;
						this.set_state(state, callback);
						return false;
					}
				}
				if($.isEmptyObject(state)) {
					state = null;
					if(callback) { callback.call(this); }
					/**
					 * triggered when a `set_state` call completes
					 * @event
					 * @name set_state.jstree
					 */
					this.trigger('set_state');
					return false;
				}
				return true;
			}
			return false;
		},
		/**
		 * refreshes the tree - all nodes are reloaded with calls to `load_node`.
		 * @name refresh()
		 * @param {Boolean} skip_loading an option to skip showing the loading indicator
		 * @trigger refresh.jstree
		 */
		refresh : function (skip_loading) {
			this._data.core.state = this.get_state();
			this._cnt = 0;
			this._model.data = {
				'#' : {
					id : '#',
					parent : null,
					parents : [],
					children : [],
					children_d : [],
					state : { loaded : false }
				}
			};
			var c = this.get_container_ul()[0].className;
			if(!skip_loading) {
				this.element.html("<"+"ul class='jstree-container-ul'><"+"li class='jstree-initial-node jstree-loading jstree-leaf jstree-last'><i class='jstree-icon jstree-ocl'></i><"+"a class='jstree-anchor' href='#'><i class='jstree-icon jstree-themeicon-hidden'></i>" + this.get_string("Loading ...") + "</a></li></ul>");
			}
			this.load_node('#', function (o, s) {
				if(s) {
					this.get_container_ul()[0].className = c;
					this.set_state($.extend(true, {}, this._data.core.state), function () {
						/**
						 * triggered when a `refresh` call completes
						 * @event
						 * @name refresh.jstree
						 */
						this.trigger('refresh');
					});
				}
				this._data.core.state = null;
			});
		},
		/**
		 * refreshes a node in the tree (reload its children) all opened nodes inside that node are reloaded with calls to `load_node`.
		 * @name refresh_name(obj)
		 * @param {Boolean} skip_loading an option to skip showing the loading indicator
		 * @trigger refresh.jstree
		 */
		refresh_node : function (obj) {
			obj = this.get_node(obj);
			if(!obj || obj.id === '#') { return false; }
			var opened = [], s = this._data.core.selected.concat([]);
			if(obj.state.opened === true) { opened.push(obj.id); }
			this.get_node(obj, true).find('.jstree-open').each(function() { opened.push(this.id); });
			this._load_nodes(opened, $.proxy(function (nodes) {
				this.open_node(nodes, false, 0);
				this.select_node(this._data.core.selected);
				/**
				 * triggered when a node is refreshed
				 * @event
				 * @name move_node.jstree
				 * @param {Object} node - the refreshed node
				 * @param {Array} nodes - an array of the IDs of the nodes that were reloaded
				 */
				this.trigger('refresh_node', { 'node' : obj, 'nodes' : nodes });
			}, this));
		},
		/**
		 * set (change) the ID of a node
		 * @name set_id(obj, id)
		 * @param  {mixed} obj the node
		 * @param  {String} id the new ID
		 * @return {Boolean}
		 */
		set_id : function (obj, id) {
			obj = this.get_node(obj);
			if(!obj || obj.id === '#') { return false; }
			var i, j, m = this._model.data;
			id = id.toString();
			// update parents (replace current ID with new one in children and children_d)
			m[obj.parent].children[$.inArray(obj.id, m[obj.parent].children)] = id;
			for(i = 0, j = obj.parents.length; i < j; i++) {
				m[obj.parents[i]].children_d[$.inArray(obj.id, m[obj.parents[i]].children_d)] = id;
			}
			// update children (replace current ID with new one in parent and parents)
			for(i = 0, j = obj.children.length; i < j; i++) {
				m[obj.children[i]].parent = id;
			}
			for(i = 0, j = obj.children_d.length; i < j; i++) {
				m[obj.children_d[i]].parents[$.inArray(obj.id, m[obj.children_d[i]].parents)] = id;
			}
			i = $.inArray(obj.id, this._data.core.selected);
			if(i !== -1) { this._data.core.selected[i] = id; }
			// update model and obj itself (obj.id, this._model.data[KEY])
			i = this.get_node(obj.id, true);
			if(i) {
				i.attr('id', id);
			}
			delete m[obj.id];
			obj.id = id;
			m[id] = obj;
			return true;
		},
		/**
		 * get the text value of a node
		 * @name get_text(obj)
		 * @param  {mixed} obj the node
		 * @return {String}
		 */
		get_text : function (obj) {
			obj = this.get_node(obj);
			return (!obj || obj.id === '#') ? false : obj.text;
		},
		/**
		 * set the text value of a node. Used internally, please use `rename_node(obj, val)`.
		 * @private
		 * @name set_text(obj, val)
		 * @param  {mixed} obj the node, you can pass an array to set the text on multiple nodes
		 * @param  {String} val the new text value
		 * @return {Boolean}
		 * @trigger set_text.jstree
		 */
		set_text : function (obj, val) {
			var t1, t2, dom, tmp;
			if($.isArray(obj)) {
				obj = obj.slice();
				for(t1 = 0, t2 = obj.length; t1 < t2; t1++) {
					this.set_text(obj[t1], val);
				}
				return true;
			}
			obj = this.get_node(obj);
			if(!obj || obj.id === '#') { return false; }
			obj.text = val;
			dom = this.get_node(obj, true);
			if(dom.length) {
				dom = dom.children(".jstree-anchor:eq(0)");
				tmp = dom.children("I").clone();
				dom.html(val).prepend(tmp);
				/**
				 * triggered when a node text value is changed
				 * @event
				 * @name set_text.jstree
				 * @param {Object} obj
				 * @param {String} text the new value
				 */
				this.trigger('set_text',{ "obj" : obj, "text" : val });
			}
			return true;
		},
		/**
		 * gets a JSON representation of a node (or the whole tree)
		 * @name get_json([obj, options])
		 * @param  {mixed} obj
		 * @param  {Object} options
		 * @param  {Boolean} options.no_state do not return state information
		 * @param  {Boolean} options.no_id do not return ID
		 * @param  {Boolean} options.no_children do not include children
		 * @param  {Boolean} options.no_data do not include node data
		 * @param  {Boolean} options.flat return flat JSON instead of nested
		 * @return {Object}
		 */
		get_json : function (obj, options, flat) {
			obj = this.get_node(obj || '#');
			if(!obj) { return false; }
			if(options && options.flat && !flat) { flat = []; }
			var tmp = {
				'id' : obj.id,
				'text' : obj.text,
				'icon' : this.get_icon(obj),
				'li_attr' : obj.li_attr,
				'a_attr' : obj.a_attr,
				'state' : {},
				'data' : options && options.no_data ? false : obj.data
				//( this.get_node(obj, true).length ? this.get_node(obj, true).data() : obj.data ),
			}, i, j;
			if(options && options.flat) {
				tmp.parent = obj.parent;
			}
			else {
				tmp.children = [];
			}
			if(!options || !options.no_state) {
				for(i in obj.state) {
					if(obj.state.hasOwnProperty(i)) {
						tmp.state[i] = obj.state[i];
					}
				}
			}
			if(options && options.no_id) {
				delete tmp.id;
				if(tmp.li_attr && tmp.li_attr.id) {
					delete tmp.li_attr.id;
				}
			}
			if(options && options.flat && obj.id !== '#') {
				flat.push(tmp);
			}
			if(!options || !options.no_children) {
				for(i = 0, j = obj.children.length; i < j; i++) {
					if(options && options.flat) {
						this.get_json(obj.children[i], options, flat);
					}
					else {
						tmp.children.push(this.get_json(obj.children[i], options));
					}
				}
			}
			return options && options.flat ? flat : (obj.id === '#' ? tmp.children : tmp);
		},
		/**
		 * create a new node (do not confuse with load_node)
		 * @name create_node([obj, node, pos, callback, is_loaded])
		 * @param  {mixed}   par       the parent node (to create a root node use either "#" (string) or `null`)
		 * @param  {mixed}   node      the data for the new node (a valid JSON object, or a simple string with the name)
		 * @param  {mixed}   pos       the index at which to insert the node, "first" and "last" are also supported, default is "last"
		 * @param  {Function} callback a function to be called once the node is created
		 * @param  {Boolean} is_loaded internal argument indicating if the parent node was succesfully loaded
		 * @return {String}            the ID of the newly create node
		 * @trigger model.jstree, create_node.jstree
		 */
		create_node : function (par, node, pos, callback, is_loaded) {
			if(par === null) { par = "#"; }
			par = this.get_node(par);
			if(!par) { return false; }
			pos = pos === undefined ? "last" : pos;
			if(!pos.toString().match(/^(before|after)$/) && !is_loaded && !this.is_loaded(par)) {
				return this.load_node(par, function () { this.create_node(par, node, pos, callback, true); });
			}
			if(!node) { node = { "text" : this.get_string('New node') }; }
			if(node.text === undefined) { node.text = this.get_string('New node'); }
			var tmp, dpc, i, j;

			if(par.id === '#') {
				if(pos === "before") { pos = "first"; }
				if(pos === "after") { pos = "last"; }
			}
			switch(pos) {
				case "before":
					tmp = this.get_node(par.parent);
					pos = $.inArray(par.id, tmp.children);
					par = tmp;
					break;
				case "after" :
					tmp = this.get_node(par.parent);
					pos = $.inArray(par.id, tmp.children) + 1;
					par = tmp;
					break;
				case "inside":
				case "first":
					pos = 0;
					break;
				case "last":
					pos = par.children.length;
					break;
				default:
					if(!pos) { pos = 0; }
					break;
			}
			if(pos > par.children.length) { pos = par.children.length; }
			if(!node.id) { node.id = true; }
			if(!this.check("create_node", node, par, pos)) {
				this.settings.core.error.call(this, this._data.core.last_error);
				return false;
			}
			if(node.id === true) { delete node.id; }
			node = this._parse_model_from_json(node, par.id, par.parents.concat());
			if(!node) { return false; }
			tmp = this.get_node(node);
			dpc = [];
			dpc.push(node);
			dpc = dpc.concat(tmp.children_d);
			this.trigger('model', { "nodes" : dpc, "parent" : par.id });

			par.children_d = par.children_d.concat(dpc);
			for(i = 0, j = par.parents.length; i < j; i++) {
				this._model.data[par.parents[i]].children_d = this._model.data[par.parents[i]].children_d.concat(dpc);
			}
			node = tmp;
			tmp = [];
			for(i = 0, j = par.children.length; i < j; i++) {
				tmp[i >= pos ? i+1 : i] = par.children[i];
			}
			tmp[pos] = node.id;
			par.children = tmp;

			this.redraw_node(par, true);
			if(callback) { callback.call(this, this.get_node(node)); }
			/**
			 * triggered when a node is created
			 * @event
			 * @name create_node.jstree
			 * @param {Object} node
			 * @param {String} parent the parent's ID
			 * @param {Number} position the position of the new node among the parent's children
			 */
			this.trigger('create_node', { "node" : this.get_node(node), "parent" : par.id, "position" : pos });
			return node.id;
		},
		/**
		 * set the text value of a node
		 * @name rename_node(obj, val)
		 * @param  {mixed} obj the node, you can pass an array to rename multiple nodes to the same name
		 * @param  {String} val the new text value
		 * @return {Boolean}
		 * @trigger rename_node.jstree
		 */
		rename_node : function (obj, val) {
			var t1, t2, old;
			if($.isArray(obj)) {
				obj = obj.slice();
				for(t1 = 0, t2 = obj.length; t1 < t2; t1++) {
					this.rename_node(obj[t1], val);
				}
				return true;
			}
			obj = this.get_node(obj);
			if(!obj || obj.id === '#') { return false; }
			old = obj.text;
			if(!this.check("rename_node", obj, this.get_parent(obj), val)) {
				this.settings.core.error.call(this, this._data.core.last_error);
				return false;
			}
			this.set_text(obj, val); // .apply(this, Array.prototype.slice.call(arguments))
			/**
			 * triggered when a node is renamed
			 * @event
			 * @name rename_node.jstree
			 * @param {Object} node
			 * @param {String} text the new value
			 * @param {String} old the old value
			 */
			this.trigger('rename_node', { "node" : obj, "text" : val, "old" : old });
			return true;
		},
		/**
		 * remove a node
		 * @name delete_node(obj)
		 * @param  {mixed} obj the node, you can pass an array to delete multiple nodes
		 * @return {Boolean}
		 * @trigger delete_node.jstree, changed.jstree
		 */
		delete_node : function (obj) {
			var t1, t2, par, pos, tmp, i, j, k, l, c;
			if($.isArray(obj)) {
				obj = obj.slice();
				for(t1 = 0, t2 = obj.length; t1 < t2; t1++) {
					this.delete_node(obj[t1]);
				}
				return true;
			}
			obj = this.get_node(obj);
			if(!obj || obj.id === '#') { return false; }
			par = this.get_node(obj.parent);
			pos = $.inArray(obj.id, par.children);
			c = false;
			if(!this.check("delete_node", obj, par, pos)) {
				this.settings.core.error.call(this, this._data.core.last_error);
				return false;
			}
			if(pos !== -1) {
				par.children = $.vakata.array_remove(par.children, pos);
			}
			tmp = obj.children_d.concat([]);
			tmp.push(obj.id);
			for(k = 0, l = tmp.length; k < l; k++) {
				for(i = 0, j = obj.parents.length; i < j; i++) {
					pos = $.inArray(tmp[k], this._model.data[obj.parents[i]].children_d);
					if(pos !== -1) {
						this._model.data[obj.parents[i]].children_d = $.vakata.array_remove(this._model.data[obj.parents[i]].children_d, pos);
					}
				}
				if(this._model.data[tmp[k]].state.selected) {
					c = true;
					pos = $.inArray(tmp[k], this._data.core.selected);
					if(pos !== -1) {
						this._data.core.selected = $.vakata.array_remove(this._data.core.selected, pos);
					}
				}
			}
			/**
			 * triggered when a node is deleted
			 * @event
			 * @name delete_node.jstree
			 * @param {Object} node
			 * @param {String} parent the parent's ID
			 */
			this.trigger('delete_node', { "node" : obj, "parent" : par.id });
			if(c) {
				this.trigger('changed', { 'action' : 'delete_node', 'node' : obj, 'selected' : this._data.core.selected, 'parent' : par.id });
			}
			for(k = 0, l = tmp.length; k < l; k++) {
				delete this._model.data[tmp[k]];
			}
			this.redraw_node(par, true);
			return true;
		},
		/**
		 * check if an operation is premitted on the tree. Used internally.
		 * @private
		 * @name check(chk, obj, par, pos)
		 * @param  {String} chk the operation to check, can be "create_node", "rename_node", "delete_node", "copy_node" or "move_node"
		 * @param  {mixed} obj the node
		 * @param  {mixed} par the parent
		 * @param  {mixed} pos the position to insert at, or if "rename_node" - the new name
		 * @param  {mixed} more some various additional information, for example if a "move_node" operations is triggered by DND this will be the hovered node
		 * @return {Boolean}
		 */
		check : function (chk, obj, par, pos, more) {
			obj = obj && obj.id ? obj : this.get_node(obj);
			par = par && par.id ? par : this.get_node(par);
			var tmp = chk.match(/^move_node|copy_node|create_node$/i) ? par : obj,
				chc = this.settings.core.check_callback;
			if(chk === "move_node" || chk === "copy_node") {
				if((!more || !more.is_multi) && (obj.id === par.id || $.inArray(obj.id, par.children) === pos || $.inArray(par.id, obj.children_d) !== -1)) {
					this._data.core.last_error = { 'error' : 'check', 'plugin' : 'core', 'id' : 'core_01', 'reason' : 'Moving parent inside child', 'data' : JSON.stringify({ 'chk' : chk, 'pos' : pos, 'obj' : obj && obj.id ? obj.id : false, 'par' : par && par.id ? par.id : false }) };
					return false;
				}
			}
			if(tmp && tmp.data) { tmp = tmp.data; }
			if(tmp && tmp.functions && (tmp.functions[chk] === false || tmp.functions[chk] === true)) {
				if(tmp.functions[chk] === false) {
					this._data.core.last_error = { 'error' : 'check', 'plugin' : 'core', 'id' : 'core_02', 'reason' : 'Node data prevents function: ' + chk, 'data' : JSON.stringify({ 'chk' : chk, 'pos' : pos, 'obj' : obj && obj.id ? obj.id : false, 'par' : par && par.id ? par.id : false }) };
				}
				return tmp.functions[chk];
			}
			if(chc === false || ($.isFunction(chc) && chc.call(this, chk, obj, par, pos, more) === false) || (chc && chc[chk] === false)) {
				this._data.core.last_error = { 'error' : 'check', 'plugin' : 'core', 'id' : 'core_03', 'reason' : 'User config for core.check_callback prevents function: ' + chk, 'data' : JSON.stringify({ 'chk' : chk, 'pos' : pos, 'obj' : obj && obj.id ? obj.id : false, 'par' : par && par.id ? par.id : false }) };
				return false;
			}
			return true;
		},
		/**
		 * get the last error
		 * @name last_error()
		 * @return {Object}
		 */
		last_error : function () {
			return this._data.core.last_error;
		},
		/**
		 * move a node to a new parent
		 * @name move_node(obj, par [, pos, callback, is_loaded])
		 * @param  {mixed} obj the node to move, pass an array to move multiple nodes
		 * @param  {mixed} par the new parent
		 * @param  {mixed} pos the position to insert at (besides integer values, "first" and "last" are supported, as well as "before" and "after"), defaults to integer `0`
		 * @param  {function} callback a function to call once the move is completed, receives 3 arguments - the node, the new parent and the position
		 * @param  {Boolean} internal parameter indicating if the parent node has been loaded
		 * @trigger move_node.jstree
		 */
		move_node : function (obj, par, pos, callback, is_loaded) {
			var t1, t2, old_par, new_par, old_ins, is_multi, dpc, tmp, i, j, k, l, p;
			if($.isArray(obj)) {
				obj = obj.reverse().slice();
				for(t1 = 0, t2 = obj.length; t1 < t2; t1++) {
					this.move_node(obj[t1], par, pos, callback, is_loaded);
				}
				return true;
			}
			obj = obj && obj.id ? obj : this.get_node(obj);
			par = this.get_node(par);
			pos = pos === undefined ? 0 : pos;

			if(!par || !obj || obj.id === '#') { return false; }
			if(!pos.toString().match(/^(before|after)$/) && !is_loaded && !this.is_loaded(par)) {
				return this.load_node(par, function () { this.move_node(obj, par, pos, callback, true); });
			}

			old_par = (obj.parent || '#').toString();
			new_par = (!pos.toString().match(/^(before|after)$/) || par.id === '#') ? par : this.get_node(par.parent);
			old_ins = obj.instance ? obj.instance : (this._model.data[obj.id] ? this : $.jstree.reference(obj.id));
			is_multi = !old_ins || !old_ins._id || (this._id !== old_ins._id);
			if(is_multi) {
				if(this.copy_node(obj, par, pos, callback, is_loaded)) {
					if(old_ins) { old_ins.delete_node(obj); }
					return true;
				}
				return false;
			}
			//var m = this._model.data;
			if(new_par.id === '#') {
				if(pos === "before") { pos = "first"; }
				if(pos === "after") { pos = "last"; }
			}
			switch(pos) {
				case "before":
					pos = $.inArray(par.id, new_par.children);
					break;
				case "after" :
					pos = $.inArray(par.id, new_par.children) + 1;
					break;
				case "inside":
				case "first":
					pos = 0;
					break;
				case "last":
					pos = new_par.children.length;
					break;
				default:
					if(!pos) { pos = 0; }
					break;
			}
			if(pos > new_par.children.length) { pos = new_par.children.length; }
			if(!this.check("move_node", obj, new_par, pos, { 'core' : true, 'is_multi' : (old_ins && old_ins._id && old_ins._id !== this._id), 'is_foreign' : (!old_ins || !old_ins._id) })) {
				this.settings.core.error.call(this, this._data.core.last_error);
				return false;
			}
			if(obj.parent === new_par.id) {
				dpc = new_par.children.concat();
				tmp = $.inArray(obj.id, dpc);
				if(tmp !== -1) {
					dpc = $.vakata.array_remove(dpc, tmp);
					if(pos > tmp) { pos--; }
				}
				tmp = [];
				for(i = 0, j = dpc.length; i < j; i++) {
					tmp[i >= pos ? i+1 : i] = dpc[i];
				}
				tmp[pos] = obj.id;
				new_par.children = tmp;
				this._node_changed(new_par.id);
				this.redraw(new_par.id === '#');
			}
			else {
				// clean old parent and up
				tmp = obj.children_d.concat();
				tmp.push(obj.id);
				for(i = 0, j = obj.parents.length; i < j; i++) {
					dpc = [];
					p = old_ins._model.data[obj.parents[i]].children_d;
					for(k = 0, l = p.length; k < l; k++) {
						if($.inArray(p[k], tmp) === -1) {
							dpc.push(p[k]);
						}
					}
					old_ins._model.data[obj.parents[i]].children_d = dpc;
				}
				old_ins._model.data[old_par].children = $.vakata.array_remove_item(old_ins._model.data[old_par].children, obj.id);

				// insert into new parent and up
				for(i = 0, j = new_par.parents.length; i < j; i++) {
					this._model.data[new_par.parents[i]].children_d = this._model.data[new_par.parents[i]].children_d.concat(tmp);
				}
				dpc = [];
				for(i = 0, j = new_par.children.length; i < j; i++) {
					dpc[i >= pos ? i+1 : i] = new_par.children[i];
				}
				dpc[pos] = obj.id;
				new_par.children = dpc;
				new_par.children_d.push(obj.id);
				new_par.children_d = new_par.children_d.concat(obj.children_d);

				// update object
				obj.parent = new_par.id;
				tmp = new_par.parents.concat();
				tmp.unshift(new_par.id);
				p = obj.parents.length;
				obj.parents = tmp;

				// update object children
				tmp = tmp.concat();
				for(i = 0, j = obj.children_d.length; i < j; i++) {
					this._model.data[obj.children_d[i]].parents = this._model.data[obj.children_d[i]].parents.slice(0,p*-1);
					Array.prototype.push.apply(this._model.data[obj.children_d[i]].parents, tmp);
				}

				this._node_changed(old_par);
				this._node_changed(new_par.id);
				this.redraw(old_par === '#' || new_par.id === '#');
			}
			if(callback) { callback.call(this, obj, new_par, pos); }
			/**
			 * triggered when a node is moved
			 * @event
			 * @name move_node.jstree
			 * @param {Object} node
			 * @param {String} parent the parent's ID
			 * @param {Number} position the position of the node among the parent's children
			 * @param {String} old_parent the old parent of the node
			 * @param {Boolean} is_multi do the node and new parent belong to different instances
			 * @param {jsTree} old_instance the instance the node came from
			 * @param {jsTree} new_instance the instance of the new parent
			 */
			this.trigger('move_node', { "node" : obj, "parent" : new_par.id, "position" : pos, "old_parent" : old_par, 'is_multi' : (old_ins && old_ins._id && old_ins._id !== this._id), 'is_foreign' : (!old_ins || !old_ins._id), 'old_instance' : old_ins, 'new_instance' : this });
			return true;
		},
		/**
		 * copy a node to a new parent
		 * @name copy_node(obj, par [, pos, callback, is_loaded])
		 * @param  {mixed} obj the node to copy, pass an array to copy multiple nodes
		 * @param  {mixed} par the new parent
		 * @param  {mixed} pos the position to insert at (besides integer values, "first" and "last" are supported, as well as "before" and "after"), defaults to integer `0`
		 * @param  {function} callback a function to call once the move is completed, receives 3 arguments - the node, the new parent and the position
		 * @param  {Boolean} internal parameter indicating if the parent node has been loaded
		 * @trigger model.jstree copy_node.jstree
		 */
		copy_node : function (obj, par, pos, callback, is_loaded) {
			var t1, t2, dpc, tmp, i, j, node, old_par, new_par, old_ins, is_multi;
			if($.isArray(obj)) {
				obj = obj.reverse().slice();
				for(t1 = 0, t2 = obj.length; t1 < t2; t1++) {
					this.copy_node(obj[t1], par, pos, callback, is_loaded);
				}
				return true;
			}
			obj = obj && obj.id ? obj : this.get_node(obj);
			par = this.get_node(par);
			pos = pos === undefined ? 0 : pos;

			if(!par || !obj || obj.id === '#') { return false; }
			if(!pos.toString().match(/^(before|after)$/) && !is_loaded && !this.is_loaded(par)) {
				return this.load_node(par, function () { this.copy_node(obj, par, pos, callback, true); });
			}

			old_par = (obj.parent || '#').toString();
			new_par = (!pos.toString().match(/^(before|after)$/) || par.id === '#') ? par : this.get_node(par.parent);
			old_ins = obj.instance ? obj.instance : (this._model.data[obj.id] ? this : $.jstree.reference(obj.id));
			is_multi = !old_ins || !old_ins._id || (this._id !== old_ins._id);
			if(new_par.id === '#') {
				if(pos === "before") { pos = "first"; }
				if(pos === "after") { pos = "last"; }
			}
			switch(pos) {
				case "before":
					pos = $.inArray(par.id, new_par.children);
					break;
				case "after" :
					pos = $.inArray(par.id, new_par.children) + 1;
					break;
				case "inside":
				case "first":
					pos = 0;
					break;
				case "last":
					pos = new_par.children.length;
					break;
				default:
					if(!pos) { pos = 0; }
					break;
			}
			if(pos > new_par.children.length) { pos = new_par.children.length; }
			if(!this.check("copy_node", obj, new_par, pos, { 'core' : true, 'is_multi' : (old_ins && old_ins._id && old_ins._id !== this._id), 'is_foreign' : (!old_ins || !old_ins._id) })) {
				this.settings.core.error.call(this, this._data.core.last_error);
				return false;
			}
			node = old_ins ? old_ins.get_json(obj, { no_id : true, no_data : true, no_state : true }) : obj;
			if(!node) { return false; }
			if(node.id === true) { delete node.id; }
			node = this._parse_model_from_json(node, new_par.id, new_par.parents.concat());
			if(!node) { return false; }
			tmp = this.get_node(node);
			if(obj && obj.state && obj.state.loaded === false) { tmp.state.loaded = false; }
			dpc = [];
			dpc.push(node);
			dpc = dpc.concat(tmp.children_d);
			this.trigger('model', { "nodes" : dpc, "parent" : new_par.id });

			// insert into new parent and up
			for(i = 0, j = new_par.parents.length; i < j; i++) {
				this._model.data[new_par.parents[i]].children_d = this._model.data[new_par.parents[i]].children_d.concat(dpc);
			}
			dpc = [];
			for(i = 0, j = new_par.children.length; i < j; i++) {
				dpc[i >= pos ? i+1 : i] = new_par.children[i];
			}
			dpc[pos] = tmp.id;
			new_par.children = dpc;
			new_par.children_d.push(tmp.id);
			new_par.children_d = new_par.children_d.concat(tmp.children_d);

			this._node_changed(new_par.id);
			this.redraw(new_par.id === '#');
			if(callback) { callback.call(this, tmp, new_par, pos); }
			/**
			 * triggered when a node is copied
			 * @event
			 * @name copy_node.jstree
			 * @param {Object} node the copied node
			 * @param {Object} original the original node
			 * @param {String} parent the parent's ID
			 * @param {Number} position the position of the node among the parent's children
			 * @param {String} old_parent the old parent of the node
			 * @param {Boolean} is_multi do the node and new parent belong to different instances
			 * @param {jsTree} old_instance the instance the node came from
			 * @param {jsTree} new_instance the instance of the new parent
			 */
			this.trigger('copy_node', { "node" : tmp, "original" : obj, "parent" : new_par.id, "position" : pos, "old_parent" : old_par, 'is_multi' : (old_ins && old_ins._id && old_ins._id !== this._id), 'is_foreign' : (!old_ins || !old_ins._id), 'old_instance' : old_ins, 'new_instance' : this });
			return tmp.id;
		},
		/**
		 * cut a node (a later call to `paste(obj)` would move the node)
		 * @name cut(obj)
		 * @param  {mixed} obj multiple objects can be passed using an array
		 * @trigger cut.jstree
		 */
		cut : function (obj) {
			if(!obj) { obj = this._data.core.selected.concat(); }
			if(!$.isArray(obj)) { obj = [obj]; }
			if(!obj.length) { return false; }
			var tmp = [], o, t1, t2;
			for(t1 = 0, t2 = obj.length; t1 < t2; t1++) {
				o = this.get_node(obj[t1]);
				if(o && o.id && o.id !== '#') { tmp.push(o); }
			}
			if(!tmp.length) { return false; }
			ccp_node = tmp;
			ccp_inst = this;
			ccp_mode = 'move_node';
			/**
			 * triggered when nodes are added to the buffer for moving
			 * @event
			 * @name cut.jstree
			 * @param {Array} node
			 */
			this.trigger('cut', { "node" : obj });
		},
		/**
		 * copy a node (a later call to `paste(obj)` would copy the node)
		 * @name copy(obj)
		 * @param  {mixed} obj multiple objects can be passed using an array
		 * @trigger copy.jstre
		 */
		copy : function (obj) {
			if(!obj) { obj = this._data.core.selected.concat(); }
			if(!$.isArray(obj)) { obj = [obj]; }
			if(!obj.length) { return false; }
			var tmp = [], o, t1, t2;
			for(t1 = 0, t2 = obj.length; t1 < t2; t1++) {
				o = this.get_node(obj[t1]);
				if(o && o.id && o.id !== '#') { tmp.push(o); }
			}
			if(!tmp.length) { return false; }
			ccp_node = tmp;
			ccp_inst = this;
			ccp_mode = 'copy_node';
			/**
			 * triggered when nodes are added to the buffer for copying
			 * @event
			 * @name copy.jstree
			 * @param {Array} node
			 */
			this.trigger('copy', { "node" : obj });
		},
		/**
		 * get the current buffer (any nodes that are waiting for a paste operation)
		 * @name get_buffer()
		 * @return {Object} an object consisting of `mode` ("copy_node" or "move_node"), `node` (an array of objects) and `inst` (the instance)
		 */
		get_buffer : function () {
			return { 'mode' : ccp_mode, 'node' : ccp_node, 'inst' : ccp_inst };
		},
		/**
		 * check if there is something in the buffer to paste
		 * @name can_paste()
		 * @return {Boolean}
		 */
		can_paste : function () {
			return ccp_mode !== false && ccp_node !== false; // && ccp_inst._model.data[ccp_node];
		},
		/**
		 * copy or move the previously cut or copied nodes to a new parent
		 * @name paste(obj [, pos])
		 * @param  {mixed} obj the new parent
		 * @param  {mixed} pos the position to insert at (besides integer, "first" and "last" are supported), defaults to integer `0`
		 * @trigger paste.jstree
		 */
		paste : function (obj, pos) {
			obj = this.get_node(obj);
			if(!obj || !ccp_mode || !ccp_mode.match(/^(copy_node|move_node)$/) || !ccp_node) { return false; }
			if(this[ccp_mode](ccp_node, obj, pos)) {
				/**
				 * triggered when paste is invoked
				 * @event
				 * @name paste.jstree
				 * @param {String} parent the ID of the receiving node
				 * @param {Array} node the nodes in the buffer
				 * @param {String} mode the performed operation - "copy_node" or "move_node"
				 */
				this.trigger('paste', { "parent" : obj.id, "node" : ccp_node, "mode" : ccp_mode });
			}
			ccp_node = false;
			ccp_mode = false;
			ccp_inst = false;
		},
		/**
		 * put a node in edit mode (input field to rename the node)
		 * @name edit(obj [, default_text])
		 * @param  {mixed} obj
		 * @param  {String} default_text the text to populate the input with (if omitted the node text value is used)
		 */
		edit : function (obj, default_text) {
			obj = this._open_to(obj);
			if(!obj || !obj.length) { return false; }
			var rtl = this._data.core.rtl,
				w  = this.element.width(),
				a  = obj.children('.jstree-anchor'),
				s  = $('<span>'),
				/*!
				oi = obj.children("i:visible"),
				ai = a.children("i:visible"),
				w1 = oi.width() * oi.length,
				w2 = ai.width() * ai.length,
				*/
				t  = typeof default_text === 'string' ? default_text : this.get_text(obj),
				h1 = $("<"+"div />", { css : { "position" : "absolute", "top" : "-200px", "left" : (rtl ? "0px" : "-1000px"), "visibility" : "hidden" } }).appendTo("body"),
				h2 = $("<"+"input />", {
						"value" : t,
						"class" : "jstree-rename-input",
						// "size" : t.length,
						"css" : {
							"padding" : "0",
							"border" : "1px solid silver",
							"box-sizing" : "border-box",
							"display" : "inline-block",
							"height" : (this._data.core.li_height) + "px",
							"lineHeight" : (this._data.core.li_height) + "px",
							"width" : "150px" // will be set a bit further down
						},
						"blur" : $.proxy(function () {
							var i = s.children(".jstree-rename-input"),
								v = i.val();
							if(v === "") { v = t; }
							h1.remove();
							s.replaceWith(a);
							s.remove();
							this.set_text(obj, t);
							if(this.rename_node(obj, v) === false) {
								this.set_text(obj, t); // move this up? and fix #483
							}
						}, this),
						"keydown" : function (event) {
							var key = event.which;
							if(key === 27) {
								this.value = t;
							}
							if(key === 27 || key === 13 || key === 37 || key === 38 || key === 39 || key === 40 || key === 32) {
								event.stopImmediatePropagation();
							}
							if(key === 27 || key === 13) {
								event.preventDefault();
								this.blur();
							}
						},
						"click" : function (e) { e.stopImmediatePropagation(); },
						"mousedown" : function (e) { e.stopImmediatePropagation(); },
						"keyup" : function (event) {
							h2.width(Math.min(h1.text("pW" + this.value).width(),w));
						},
						"keypress" : function(event) {
							if(event.which === 13) { return false; }
						}
					}),
				fn = {
						fontFamily		: a.css('fontFamily')		|| '',
						fontSize		: a.css('fontSize')			|| '',
						fontWeight		: a.css('fontWeight')		|| '',
						fontStyle		: a.css('fontStyle')		|| '',
						fontStretch		: a.css('fontStretch')		|| '',
						fontVariant		: a.css('fontVariant')		|| '',
						letterSpacing	: a.css('letterSpacing')	|| '',
						wordSpacing		: a.css('wordSpacing')		|| ''
				};
			this.set_text(obj, "");
			s.attr('class', a.attr('class')).append(a.contents().clone()).append(h2);
			a.replaceWith(s);
			h1.css(fn);
			h2.css(fn).width(Math.min(h1.text("pW" + h2[0].value).width(),w))[0].select();
		},


		/**
		 * changes the theme
		 * @name set_theme(theme_name [, theme_url])
		 * @param {String} theme_name the name of the new theme to apply
		 * @param {mixed} theme_url  the location of the CSS file for this theme. Omit or set to `false` if you manually included the file. Set to `true` to autoload from the `core.themes.dir` directory.
		 * @trigger set_theme.jstree
		 */
		set_theme : function (theme_name, theme_url) {
			if(!theme_name) { return false; }
			if(theme_url === true) {
				var dir = this.settings.core.themes.dir;
				if(!dir) { dir = $.jstree.path + '/themes'; }
				theme_url = dir + '/' + theme_name + '/style.css';
			}
			if(theme_url && $.inArray(theme_url, themes_loaded) === -1) {
				$('head').append('<'+'link rel="stylesheet" href="' + theme_url + '" type="text/css" />');
				themes_loaded.push(theme_url);
			}
			if(this._data.core.themes.name) {
				this.element.removeClass('jstree-' + this._data.core.themes.name);
			}
			this._data.core.themes.name = theme_name;
			this.element.addClass('jstree-' + theme_name);
			this.element[this.settings.core.themes.responsive ? 'addClass' : 'removeClass' ]('jstree-' + theme_name + '-responsive');
			/**
			 * triggered when a theme is set
			 * @event
			 * @name set_theme.jstree
			 * @param {String} theme the new theme
			 */
			this.trigger('set_theme', { 'theme' : theme_name });
		},
		/**
		 * gets the name of the currently applied theme name
		 * @name get_theme()
		 * @return {String}
		 */
		get_theme : function () { return this._data.core.themes.name; },
		/**
		 * changes the theme variant (if the theme has variants)
		 * @name set_theme_variant(variant_name)
		 * @param {String|Boolean} variant_name the variant to apply (if `false` is used the current variant is removed)
		 */
		set_theme_variant : function (variant_name) {
			if(this._data.core.themes.variant) {
				this.element.removeClass('jstree-' + this._data.core.themes.name + '-' + this._data.core.themes.variant);
			}
			this._data.core.themes.variant = variant_name;
			if(variant_name) {
				this.element.addClass('jstree-' + this._data.core.themes.name + '-' + this._data.core.themes.variant);
			}
		},
		/**
		 * gets the name of the currently applied theme variant
		 * @name get_theme()
		 * @return {String}
		 */
		get_theme_variant : function () { return this._data.core.themes.variant; },
		/**
		 * shows a striped background on the container (if the theme supports it)
		 * @name show_stripes()
		 */
		show_stripes : function () { this._data.core.themes.stripes = true; this.get_container_ul().addClass("jstree-striped"); },
		/**
		 * hides the striped background on the container
		 * @name hide_stripes()
		 */
		hide_stripes : function () { this._data.core.themes.stripes = false; this.get_container_ul().removeClass("jstree-striped"); },
		/**
		 * toggles the striped background on the container
		 * @name toggle_stripes()
		 */
		toggle_stripes : function () { if(this._data.core.themes.stripes) { this.hide_stripes(); } else { this.show_stripes(); } },
		/**
		 * shows the connecting dots (if the theme supports it)
		 * @name show_dots()
		 */
		show_dots : function () { this._data.core.themes.dots = true; this.get_container_ul().removeClass("jstree-no-dots"); },
		/**
		 * hides the connecting dots
		 * @name hide_dots()
		 */
		hide_dots : function () { this._data.core.themes.dots = false; this.get_container_ul().addClass("jstree-no-dots"); },
		/**
		 * toggles the connecting dots
		 * @name toggle_dots()
		 */
		toggle_dots : function () { if(this._data.core.themes.dots) { this.hide_dots(); } else { this.show_dots(); } },
		/**
		 * show the node icons
		 * @name show_icons()
		 */
		show_icons : function () { this._data.core.themes.icons = true; this.get_container_ul().removeClass("jstree-no-icons"); },
		/**
		 * hide the node icons
		 * @name hide_icons()
		 */
		hide_icons : function () { this._data.core.themes.icons = false; this.get_container_ul().addClass("jstree-no-icons"); },
		/**
		 * toggle the node icons
		 * @name toggle_icons()
		 */
		toggle_icons : function () { if(this._data.core.themes.icons) { this.hide_icons(); } else { this.show_icons(); } },
		/**
		 * set the node icon for a node
		 * @name set_icon(obj, icon)
		 * @param {mixed} obj
		 * @param {String} icon the new icon - can be a path to an icon or a className, if using an image that is in the current directory use a `./` prefix, otherwise it will be detected as a class
		 */
		set_icon : function (obj, icon) {
			var t1, t2, dom, old;
			if($.isArray(obj)) {
				obj = obj.slice();
				for(t1 = 0, t2 = obj.length; t1 < t2; t1++) {
					this.set_icon(obj[t1], icon);
				}
				return true;
			}
			obj = this.get_node(obj);
			if(!obj || obj.id === '#') { return false; }
			old = obj.icon;
			obj.icon = icon;
			dom = this.get_node(obj, true).children(".jstree-anchor").children(".jstree-themeicon");
			if(icon === false) {
				this.hide_icon(obj);
			}
			else if(icon === true) {
				dom.removeClass('jstree-themeicon-custom ' + old).css("background","").removeAttr("rel");
			}
			else if(icon.indexOf("/") === -1 && icon.indexOf(".") === -1) {
				dom.removeClass(old).css("background","");
				dom.addClass(icon + ' jstree-themeicon-custom').attr("rel",icon);
			}
			else {
				dom.removeClass(old).css("background","");
				dom.addClass('jstree-themeicon-custom').css("background", "url('" + icon + "') center center no-repeat").attr("rel",icon);
			}
			return true;
		},
		/**
		 * get the node icon for a node
		 * @name get_icon(obj)
		 * @param {mixed} obj
		 * @return {String}
		 */
		get_icon : function (obj) {
			obj = this.get_node(obj);
			return (!obj || obj.id === '#') ? false : obj.icon;
		},
		/**
		 * hide the icon on an individual node
		 * @name hide_icon(obj)
		 * @param {mixed} obj
		 */
		hide_icon : function (obj) {
			var t1, t2;
			if($.isArray(obj)) {
				obj = obj.slice();
				for(t1 = 0, t2 = obj.length; t1 < t2; t1++) {
					this.hide_icon(obj[t1]);
				}
				return true;
			}
			obj = this.get_node(obj);
			if(!obj || obj === '#') { return false; }
			obj.icon = false;
			this.get_node(obj, true).children("a").children(".jstree-themeicon").addClass('jstree-themeicon-hidden');
			return true;
		},
		/**
		 * show the icon on an individual node
		 * @name show_icon(obj)
		 * @param {mixed} obj
		 */
		show_icon : function (obj) {
			var t1, t2, dom;
			if($.isArray(obj)) {
				obj = obj.slice();
				for(t1 = 0, t2 = obj.length; t1 < t2; t1++) {
					this.show_icon(obj[t1]);
				}
				return true;
			}
			obj = this.get_node(obj);
			if(!obj || obj === '#') { return false; }
			dom = this.get_node(obj, true);
			obj.icon = dom.length ? dom.children("a").children(".jstree-themeicon").attr('rel') : true;
			if(!obj.icon) { obj.icon = true; }
			dom.children("a").children(".jstree-themeicon").removeClass('jstree-themeicon-hidden');
			return true;
		}
	};

	// helpers
	$.vakata = {};
	// collect attributes
	$.vakata.attributes = function(node, with_values) {
		node = $(node)[0];
		var attr = with_values ? {} : [];
		if(node && node.attributes) {
			$.each(node.attributes, function (i, v) {
				if($.inArray(v.nodeName.toLowerCase(),['style','contenteditable','hasfocus','tabindex']) !== -1) { return; }
				if(v.nodeValue !== null && $.trim(v.nodeValue) !== '') {
					if(with_values) { attr[v.nodeName] = v.nodeValue; }
					else { attr.push(v.nodeName); }
				}
			});
		}
		return attr;
	};
	$.vakata.array_unique = function(array) {
		var a = [], i, j, l;
		for(i = 0, l = array.length; i < l; i++) {
			for(j = 0; j <= i; j++) {
				if(array[i] === array[j]) {
					break;
				}
			}
			if(j === i) { a.push(array[i]); }
		}
		return a;
	};
	// remove item from array
	$.vakata.array_remove = function(array, from, to) {
		var rest = array.slice((to || from) + 1 || array.length);
		array.length = from < 0 ? array.length + from : from;
		array.push.apply(array, rest);
		return array;
	};
	// remove item from array
	$.vakata.array_remove_item = function(array, item) {
		var tmp = $.inArray(item, array);
		return tmp !== -1 ? $.vakata.array_remove(array, tmp) : array;
	};
	// browser sniffing
	(function () {
		var browser = {},
			b_match = function(ua) {
			ua = ua.toLowerCase();

			var match =	/(chrome)[ \/]([\w.]+)/.exec( ua ) ||
						/(webkit)[ \/]([\w.]+)/.exec( ua ) ||
						/(opera)(?:.*version|)[ \/]([\w.]+)/.exec( ua ) ||
						/(msie) ([\w.]+)/.exec( ua ) ||
						(ua.indexOf("compatible") < 0 && /(mozilla)(?:.*? rv:([\w.]+)|)/.exec( ua )) ||
						[];
				return {
					browser: match[1] || "",
					version: match[2] || "0"
				};
			},
			matched = b_match(window.navigator.userAgent);
		if(matched.browser) {
			browser[ matched.browser ] = true;
			browser.version = matched.version;
		}
		if(browser.chrome) {
			browser.webkit = true;
		}
		else if(browser.webkit) {
			browser.safari = true;
		}
		$.vakata.browser = browser;
	}());
	if($.vakata.browser.msie && $.vakata.browser.version < 8) {
		$.jstree.defaults.core.animation = 0;
	}

/**
 * ### Checkbox plugin
 *
 * This plugin renders checkbox icons in front of each node, making multiple selection much easier. 
 * It also supports tri-state behavior, meaning that if a node has a few of its children checked it will be rendered as undetermined, and state will be propagated up.
 */

	var _i = document.createElement('I');
	_i.className = 'jstree-icon jstree-checkbox';
	/**
	 * stores all defaults for the checkbox plugin
	 * @name $.jstree.defaults.checkbox
	 * @plugin checkbox
	 */
	$.jstree.defaults.checkbox = {
		/**
		 * a boolean indicating if checkboxes should be visible (can be changed at a later time using `show_checkboxes()` and `hide_checkboxes`). Defaults to `true`.
		 * @name $.jstree.defaults.checkbox.visible
		 * @plugin checkbox
		 */
		visible				: true,
		/**
		 * a boolean indicating if checkboxes should cascade down and have an undetermined state. Defaults to `true`.
		 * @name $.jstree.defaults.checkbox.three_state
		 * @plugin checkbox
		 */
		three_state			: true,
		/**
		 * a boolean indicating if clicking anywhere on the node should act as clicking on the checkbox. Defaults to `true`.
		 * @name $.jstree.defaults.checkbox.whole_node
		 * @plugin checkbox
		 */
		whole_node			: true,
		/**
		 * a boolean indicating if the selected style of a node should be kept, or removed. Defaults to `true`.
		 * @name $.jstree.defaults.checkbox.keep_selected_style
		 * @plugin checkbox
		 */
		keep_selected_style	: true
	};
	$.jstree.plugins.checkbox = function (options, parent) {
		this.bind = function () {
			parent.bind.call(this);
			this._data.checkbox.uto = false;
			this.element
				.on("init.jstree", $.proxy(function () {
						this._data.checkbox.visible = this.settings.checkbox.visible;
						if(!this.settings.checkbox.keep_selected_style) {
							this.element.addClass('jstree-checkbox-no-clicked');
						}
					}, this))
				.on("loading.jstree", $.proxy(function () {
						this[ this._data.checkbox.visible ? 'show_checkboxes' : 'hide_checkboxes' ]();
					}, this));
			if(this.settings.checkbox.three_state) {
				this.element
					.on('changed.jstree move_node.jstree copy_node.jstree redraw.jstree open_node.jstree', $.proxy(function () {
							if(this._data.checkbox.uto) { clearTimeout(this._data.checkbox.uto); }
							this._data.checkbox.uto = setTimeout($.proxy(this._undetermined, this), 50);
						}, this))
					.on('model.jstree', $.proxy(function (e, data) {
							var m = this._model.data,
								p = m[data.parent],
								dpc = data.nodes,
								chd = [],
								c, i, j, k, l, tmp;

							// apply down
							if(p.state.selected) {
								for(i = 0, j = dpc.length; i < j; i++) {
									m[dpc[i]].state.selected = true;
								}
								this._data.core.selected = this._data.core.selected.concat(dpc);
							}
							else {
								for(i = 0, j = dpc.length; i < j; i++) {
									if(m[dpc[i]].state.selected) {
										for(k = 0, l = m[dpc[i]].children_d.length; k < l; k++) {
											m[m[dpc[i]].children_d[k]].state.selected = true;
										}
										this._data.core.selected = this._data.core.selected.concat(m[dpc[i]].children_d);
									}
								}
							}

							// apply up
							for(i = 0, j = p.children_d.length; i < j; i++) {
								if(!m[p.children_d[i]].children.length) {
									chd.push(m[p.children_d[i]].parent);
								}
							}
							chd = $.vakata.array_unique(chd);
							for(k = 0, l = chd.length; k < l; k++) {
								p = m[chd[k]];
								while(p && p.id !== '#') {
									c = 0;
									for(i = 0, j = p.children.length; i < j; i++) {
										c += m[p.children[i]].state.selected;
									}
									if(c === j) {
										p.state.selected = true;
										this._data.core.selected.push(p.id);
										tmp = this.get_node(p, true);
										if(tmp && tmp.length) {
											tmp.children('.jstree-anchor').addClass('jstree-clicked');
										}
									}
									else {
										break;
									}
									p = this.get_node(p.parent);
								}
							}
							this._data.core.selected = $.vakata.array_unique(this._data.core.selected);
						}, this))
					.on('select_node.jstree', $.proxy(function (e, data) {
							var obj = data.node,
								m = this._model.data,
								par = this.get_node(obj.parent),
								dom = this.get_node(obj, true),
								i, j, c, tmp;
							this._data.core.selected = $.vakata.array_unique(this._data.core.selected.concat(obj.children_d));

							for(i = 0, j = obj.children_d.length; i < j; i++) {
								tmp = m[obj.children_d[i]];
								tmp.state.selected = true;
								if(tmp && tmp.original && tmp.original.state && tmp.original.state.undetermined) {
									tmp.original.state.undetermined = false;
								}
							}
							while(par && par.id !== '#') {
								c = 0;
								for(i = 0, j = par.children.length; i < j; i++) {
									c += m[par.children[i]].state.selected;
								}
								if(c === j) {
									par.state.selected = true;
									this._data.core.selected.push(par.id);
									tmp = this.get_node(par, true);
									if(tmp && tmp.length) {
										tmp.children('.jstree-anchor').addClass('jstree-clicked');
									}
								}
								else {
									break;
								}
								par = this.get_node(par.parent);
							}
							if(dom.length) {
								dom.find('.jstree-anchor').addClass('jstree-clicked');
							}
						}, this))
					.on('deselect_all.jstree', $.proxy(function (e, data) {
							var obj = this.get_node('#'),
								m = this._model.data,
								i, j, tmp;
							for(i = 0, j = obj.children_d.length; i < j; i++) {
								tmp = m[obj.children_d[i]];
								if(tmp && tmp.original && tmp.original.state && tmp.original.state.undetermined) {
									tmp.original.state.undetermined = false;
								}
							}
						}, this))
					.on('deselect_node.jstree', $.proxy(function (e, data) {
							var obj = data.node,
								dom = this.get_node(obj, true),
								i, j, tmp;
							if(obj && obj.original && obj.original.state && obj.original.state.undetermined) {
								obj.original.state.undetermined = false;
							}
							for(i = 0, j = obj.children_d.length; i < j; i++) {
								tmp = this._model.data[obj.children_d[i]];
								tmp.state.selected = false;
								if(tmp && tmp.original && tmp.original.state && tmp.original.state.undetermined) {
									tmp.original.state.undetermined = false;
								}
							}
							for(i = 0, j = obj.parents.length; i < j; i++) {
								tmp = this._model.data[obj.parents[i]];
								tmp.state.selected = false;
								if(tmp && tmp.original && tmp.original.state && tmp.original.state.undetermined) {
									tmp.original.state.undetermined = false;
								}
								tmp = this.get_node(obj.parents[i], true);
								if(tmp && tmp.length) {
									tmp.children('.jstree-anchor').removeClass('jstree-clicked');
								}
							}
							tmp = [];
							for(i = 0, j = this._data.core.selected.length; i < j; i++) {
								if($.inArray(this._data.core.selected[i], obj.children_d) === -1 && $.inArray(this._data.core.selected[i], obj.parents) === -1) {
									tmp.push(this._data.core.selected[i]);
								}
							}
							this._data.core.selected = $.vakata.array_unique(tmp);
							if(dom.length) {
								dom.find('.jstree-anchor').removeClass('jstree-clicked');
							}
						}, this))
					.on('delete_node.jstree', $.proxy(function (e, data) {
							var p = this.get_node(data.parent),
								m = this._model.data,
								i, j, c, tmp;
							while(p && p.id !== '#') {
								c = 0;
								for(i = 0, j = p.children.length; i < j; i++) {
									c += m[p.children[i]].state.selected;
								}
								if(c === j) {
									p.state.selected = true;
									this._data.core.selected.push(p.id);
									tmp = this.get_node(p, true);
									if(tmp && tmp.length) {
										tmp.children('.jstree-anchor').addClass('jstree-clicked');
									}
								}
								else {
									break;
								}
								p = this.get_node(p.parent);
							}
						}, this))
					.on('move_node.jstree', $.proxy(function (e, data) {
							var is_multi = data.is_multi,
								old_par = data.old_parent,
								new_par = this.get_node(data.parent),
								m = this._model.data,
								p, c, i, j, tmp;
							if(!is_multi) {
								p = this.get_node(old_par);
								while(p && p.id !== '#') {
									c = 0;
									for(i = 0, j = p.children.length; i < j; i++) {
										c += m[p.children[i]].state.selected;
									}
									if(c === j) {
										p.state.selected = true;
										this._data.core.selected.push(p.id);
										tmp = this.get_node(p, true);
										if(tmp && tmp.length) {
											tmp.children('.jstree-anchor').addClass('jstree-clicked');
										}
									}
									else {
										break;
									}
									p = this.get_node(p.parent);
								}
							}
							p = new_par;
							while(p && p.id !== '#') {
								c = 0;
								for(i = 0, j = p.children.length; i < j; i++) {
									c += m[p.children[i]].state.selected;
								}
								if(c === j) {
									if(!p.state.selected) {
										p.state.selected = true;
										this._data.core.selected.push(p.id);
										tmp = this.get_node(p, true);
										if(tmp && tmp.length) {
											tmp.children('.jstree-anchor').addClass('jstree-clicked');
										}
									}
								}
								else {
									if(p.state.selected) {
										p.state.selected = false;
										this._data.core.selected = $.vakata.array_remove_item(this._data.core.selected, p.id);
										tmp = this.get_node(p, true);
										if(tmp && tmp.length) {
											tmp.children('.jstree-anchor').removeClass('jstree-clicked');
										}
									}
									else {
										break;
									}
								}
								p = this.get_node(p.parent);
							}
						}, this));
			}
		};
		/**
		 * set the undetermined state where and if necessary. Used internally.
		 * @private
		 * @name _undetermined()
		 * @plugin checkbox
		 */
		this._undetermined = function () {
			var i, j, m = this._model.data, s = this._data.core.selected, p = [], t = this;
			for(i = 0, j = s.length; i < j; i++) {
				if(m[s[i]] && m[s[i]].parents) {
					p = p.concat(m[s[i]].parents);
				}
			}
			// attempt for server side undetermined state
			this.element.find('.jstree-closed').not(':has(ul)')
				.each(function () {
					var tmp = t.get_node(this), tmp2;
					if(!tmp.state.loaded) {
						if(tmp.original && tmp.original.state && tmp.original.state.undetermined && tmp.original.state.undetermined === true) {
							p.push(tmp.id);
							p = p.concat(tmp.parents);
						}
					}
					else {
						for(i = 0, j = tmp.children_d.length; i < j; i++) {
							tmp2 = m[tmp.children_d[i]];
							if(!tmp2.state.loaded && tmp2.original && tmp2.original.state && tmp2.original.state.undetermined && tmp2.original.state.undetermined === true) {
								p.push(tmp2.id);
								p = p.concat(tmp2.parents);
							}
						}
					}
				});
			p = $.vakata.array_unique(p);
			p = $.vakata.array_remove_item(p,'#');

			this.element.find('.jstree-undetermined').removeClass('jstree-undetermined');
			for(i = 0, j = p.length; i < j; i++) {
				if(!m[p[i]].state.selected) {
					s = this.get_node(p[i], true);
					if(s && s.length) {
						s.children('a').children('.jstree-checkbox').addClass('jstree-undetermined');
					}
				}
			}
		};
		this.redraw_node = function(obj, deep, is_callback) {
			obj = parent.redraw_node.call(this, obj, deep, is_callback);
			if(obj) {
				var tmp = obj.getElementsByTagName('A')[0];
				tmp.insertBefore(_i.cloneNode(false), tmp.childNodes[0]);
			}
			if(!is_callback && this.settings.checkbox.three_state) {
				if(this._data.checkbox.uto) { clearTimeout(this._data.checkbox.uto); }
				this._data.checkbox.uto = setTimeout($.proxy(this._undetermined, this), 50);
			}
			return obj;
		};
		this.activate_node = function (obj, e) {
			if(this.settings.checkbox.whole_node || $(e.target).hasClass('jstree-checkbox')) {
				e.ctrlKey = true;
			}
			return parent.activate_node.call(this, obj, e);
		};
		/**
		 * show the node checkbox icons
		 * @name show_checkboxes()
		 * @plugin checkbox
		 */
		this.show_checkboxes = function () { this._data.core.themes.checkboxes = true; this.element.children("ul").removeClass("jstree-no-checkboxes"); };
		/**
		 * hide the node checkbox icons
		 * @name hide_checkboxes()
		 * @plugin checkbox
		 */
		this.hide_checkboxes = function () { this._data.core.themes.checkboxes = false; this.element.children("ul").addClass("jstree-no-checkboxes"); };
		/**
		 * toggle the node icons
		 * @name toggle_checkboxes()
		 * @plugin checkbox
		 */
		this.toggle_checkboxes = function () { if(this._data.core.themes.checkboxes) { this.hide_checkboxes(); } else { this.show_checkboxes(); } };
	};

	// include the checkbox plugin by default
	// $.jstree.defaults.plugins.push("checkbox");

/**
 * ### Contextmenu plugin
 *
 * Shows a context menu when a node is right-clicked.
 */
// TODO: move logic outside of function + check multiple move

	/**
	 * stores all defaults for the contextmenu plugin
	 * @name $.jstree.defaults.contextmenu
	 * @plugin contextmenu
	 */
	$.jstree.defaults.contextmenu = {
		/**
		 * a boolean indicating if the node should be selected when the context menu is invoked on it. Defaults to `true`.
		 * @name $.jstree.defaults.contextmenu.select_node
		 * @plugin contextmenu
		 */
		select_node : true,
		/**
		 * a boolean indicating if the menu should be shown aligned with the node. Defaults to `true`, otherwise the mouse coordinates are used.
		 * @name $.jstree.defaults.contextmenu.show_at_node
		 * @plugin contextmenu
		 */
		show_at_node : true,
		/**
		 * an object of actions, or a function that accepts a node and a callback function and calls the callback function with an object of actions available for that node (you can also return the items too).
		 * 
		 * Each action consists of a key (a unique name) and a value which is an object with the following properties (only label and action are required):
		 * 
		 * * `separator_before` - a boolean indicating if there should be a separator before this item
		 * * `separator_after` - a boolean indicating if there should be a separator after this item
		 * * `_disabled` - a boolean indicating if this action should be disabled
		 * * `label` - a string - the name of the action (could be a function returning a string)
		 * * `action` - a function to be executed if this item is chosen
		 * * `icon` - a string, can be a path to an icon or a className, if using an image that is in the current directory use a `./` prefix, otherwise it will be detected as a class
		 * * `shortcut` - keyCode which will trigger the action if the menu is open (for example `113` for rename, which equals F2)
		 * * `shortcut_label` - shortcut label (like for example `F2` for rename)
		 * 
		 * @name $.jstree.defaults.contextmenu.items
		 * @plugin contextmenu
		 */
		items : function (o, cb) { // Could be an object directly
			return {
				"create" : {
					"separator_before"	: false,
					"separator_after"	: true,
					"_disabled"			: false, //(this.check("create_node", data.reference, {}, "last")),
					"label"				: "Create",
					"action"			: function (data) {
						var inst = $.jstree.reference(data.reference),
							obj = inst.get_node(data.reference);
						inst.create_node(obj, {}, "last", function (new_node) {
							setTimeout(function () { inst.edit(new_node); },0);
						});
					}
				},
				"rename" : {
					"separator_before"	: false,
					"separator_after"	: false,
					"_disabled"			: false, //(this.check("rename_node", data.reference, this.get_parent(data.reference), "")),
					"label"				: "Rename",
					/*
					"shortcut"			: 113,
					"shortcut_label"	: 'F2',
					"icon"				: "glyphicon glyphicon-leaf",
					*/
					"action"			: function (data) {
						var inst = $.jstree.reference(data.reference),
							obj = inst.get_node(data.reference);
						inst.edit(obj);
					}
				},
				"remove" : {
					"separator_before"	: false,
					"icon"				: false,
					"separator_after"	: false,
					"_disabled"			: false, //(this.check("delete_node", data.reference, this.get_parent(data.reference), "")),
					"label"				: "Delete",
					"action"			: function (data) {
						var inst = $.jstree.reference(data.reference),
							obj = inst.get_node(data.reference);
						if(inst.is_selected(obj)) {
							inst.delete_node(inst.get_selected());
						}
						else {
							inst.delete_node(obj);
						}
					}
				},
				"ccp" : {
					"separator_before"	: true,
					"icon"				: false,
					"separator_after"	: false,
					"label"				: "Edit",
					"action"			: false,
					"submenu" : {
						"cut" : {
							"separator_before"	: false,
							"separator_after"	: false,
							"label"				: "Cut",
							"action"			: function (data) {
								var inst = $.jstree.reference(data.reference),
									obj = inst.get_node(data.reference);
								if(inst.is_selected(obj)) {
									inst.cut(inst.get_selected());
								}
								else {
									inst.cut(obj);
								}
							}
						},
						"copy" : {
							"separator_before"	: false,
							"icon"				: false,
							"separator_after"	: false,
							"label"				: "Copy",
							"action"			: function (data) {
								var inst = $.jstree.reference(data.reference),
									obj = inst.get_node(data.reference);
								if(inst.is_selected(obj)) {
									inst.copy(inst.get_selected());
								}
								else {
									inst.copy(obj);
								}
							}
						},
						"paste" : {
							"separator_before"	: false,
							"icon"				: false,
							"_disabled"			: function (data) {
								return !$.jstree.reference(data.reference).can_paste();
							},
							"separator_after"	: false,
							"label"				: "Paste",
							"action"			: function (data) {
								var inst = $.jstree.reference(data.reference),
									obj = inst.get_node(data.reference);
								inst.paste(obj);
							}
						}
					}
				}
			};
		}
	};

	$.jstree.plugins.contextmenu = function (options, parent) {
		this.bind = function () {
			parent.bind.call(this);

			var last_ts = 0;
			this.element
				.on("contextmenu.jstree", ".jstree-anchor", $.proxy(function (e) {
						e.preventDefault();
						last_ts = e.ctrlKey ? e.timeStamp : 0;
						if(!this.is_loading(e.currentTarget)) {
							this.show_contextmenu(e.currentTarget, e.pageX, e.pageY, e);
						}
					}, this))
				.on("click.jstree", ".jstree-anchor", $.proxy(function (e) {
						if(this._data.contextmenu.visible && (!last_ts || e.timeStamp - last_ts > 250)) { // work around safari & macOS ctrl+click
							$.vakata.context.hide();
						}
					}, this));
			/*
			if(!('oncontextmenu' in document.body) && ('ontouchstart' in document.body)) {
				var el = null, tm = null;
				this.element
					.on("touchstart", ".jstree-anchor", function (e) {
						el = e.currentTarget;
						tm = +new Date();
						$(document).one("touchend", function (e) {
							e.target = document.elementFromPoint(e.originalEvent.targetTouches[0].pageX - window.pageXOffset, e.originalEvent.targetTouches[0].pageY - window.pageYOffset);
							e.currentTarget = e.target;
							tm = ((+(new Date())) - tm);
							if(e.target === el && tm > 600 && tm < 1000) {
								e.preventDefault();
								$(el).trigger('contextmenu', e);
							}
							el = null;
							tm = null;
						});
					});
			}
			*/
			$(document).on("context_hide.vakata", $.proxy(function () { this._data.contextmenu.visible = false; }, this));
		};
		this.teardown = function () {
			if(this._data.contextmenu.visible) {
				$.vakata.context.hide();
			}
			parent.teardown.call(this);
		};

		/**
		 * prepare and show the context menu for a node
		 * @name show_contextmenu(obj [, x, y])
		 * @param {mixed} obj the node
		 * @param {Number} x the x-coordinate relative to the document to show the menu at
		 * @param {Number} y the y-coordinate relative to the document to show the menu at
		 * @param {Object} e the event if available that triggered the contextmenu
		 * @plugin contextmenu
		 * @trigger show_contextmenu.jstree
		 */
		this.show_contextmenu = function (obj, x, y, e) {
			obj = this.get_node(obj);
			if(!obj || obj.id === '#') { return false; }
			var s = this.settings.contextmenu,
				d = this.get_node(obj, true),
				a = d.children(".jstree-anchor"),
				o = false,
				i = false;
			if(s.show_at_node || x === undefined || y === undefined) {
				o = a.offset();
				x = o.left;
				y = o.top + this._data.core.li_height;
			}
			if(this.settings.contextmenu.select_node && !this.is_selected(obj)) {
				this.deselect_all();
				this.select_node(obj, false, false, e);
			}

			i = s.items;
			if($.isFunction(i)) {
				i = i.call(this, obj, $.proxy(function (i) {
					this._show_contextmenu(obj, x, y, i);
				}, this));
			}
			if($.isPlainObject(i)) {
				this._show_contextmenu(obj, x, y, i);
			}
		};
		/**
		 * show the prepared context menu for a node
		 * @name _show_contextmenu(obj, x, y, i)
		 * @param {mixed} obj the node
		 * @param {Number} x the x-coordinate relative to the document to show the menu at
		 * @param {Number} y the y-coordinate relative to the document to show the menu at
		 * @param {Number} i the object of items to show
		 * @plugin contextmenu
		 * @trigger show_contextmenu.jstree
		 * @private
		 */
		this._show_contextmenu = function (obj, x, y, i) {
			var d = this.get_node(obj, true),
				a = d.children(".jstree-anchor");
			$(document).one("context_show.vakata", $.proxy(function (e, data) {
				var cls = 'jstree-contextmenu jstree-' + this.get_theme() + '-contextmenu';
				$(data.element).addClass(cls);
			}, this));
			this._data.contextmenu.visible = true;
			$.vakata.context.show(a, { 'x' : x, 'y' : y }, i);
			/**
			 * triggered when the contextmenu is shown for a node
			 * @event
			 * @name show_contextmenu.jstree
			 * @param {Object} node the node
			 * @param {Number} x the x-coordinate of the menu relative to the document
			 * @param {Number} y the y-coordinate of the menu relative to the document
			 * @plugin contextmenu
			 */
			this.trigger('show_contextmenu', { "node" : obj, "x" : x, "y" : y });
		};
	};

	// contextmenu helper
	(function ($) {
		var right_to_left = false,
			vakata_context = {
				element		: false,
				reference	: false,
				position_x	: 0,
				position_y	: 0,
				items		: [],
				html		: "",
				is_visible	: false
			};

		$.vakata.context = {
			settings : {
				hide_onmouseleave	: 0,
				icons				: true
			},
			_trigger : function (event_name) {
				$(document).triggerHandler("context_" + event_name + ".vakata", {
					"reference"	: vakata_context.reference,
					"element"	: vakata_context.element,
					"position"	: {
						"x" : vakata_context.position_x,
						"y" : vakata_context.position_y
					}
				});
			},
			_execute : function (i) {
				i = vakata_context.items[i];
				return i && (!i._disabled || ($.isFunction(i._disabled) && !i._disabled({ "item" : i, "reference" : vakata_context.reference, "element" : vakata_context.element }))) && i.action ? i.action.call(null, {
							"item"		: i,
							"reference"	: vakata_context.reference,
							"element"	: vakata_context.element,
							"position"	: {
								"x" : vakata_context.position_x,
								"y" : vakata_context.position_y
							}
						}) : false;
			},
			_parse : function (o, is_callback) {
				if(!o) { return false; }
				if(!is_callback) {
					vakata_context.html		= "";
					vakata_context.items	= [];
				}
				var str = "",
					sep = false,
					tmp;

				if(is_callback) { str += "<"+"ul>"; }
				$.each(o, function (i, val) {
					if(!val) { return true; }
					vakata_context.items.push(val);
					if(!sep && val.separator_before) {
						str += "<"+"li class='vakata-context-separator'><"+"a href='#' " + ($.vakata.context.settings.icons ? '' : 'style="margin-left:0px;"') + ">&#160;<"+"/a><"+"/li>";
					}
					sep = false;
					str += "<"+"li class='" + (val._class || "") + (val._disabled === true || ($.isFunction(val._disabled) && val._disabled({ "item" : val, "reference" : vakata_context.reference, "element" : vakata_context.element })) ? " vakata-contextmenu-disabled " : "") + "' "+(val.shortcut?" data-shortcut='"+val.shortcut+"' ":'')+">";
					str += "<"+"a href='#' rel='" + (vakata_context.items.length - 1) + "'>";
					if($.vakata.context.settings.icons) {
						str += "<"+"i ";
						if(val.icon) {
							if(val.icon.indexOf("/") !== -1 || val.icon.indexOf(".") !== -1) { str += " style='background:url(\"" + val.icon + "\") center center no-repeat' "; }
							else { str += " class='" + val.icon + "' "; }
						}
						str += "><"+"/i><"+"span class='vakata-contextmenu-sep'>&#160;<"+"/span>";
					}
					str += ($.isFunction(val.label) ? val.label({ "item" : i, "reference" : vakata_context.reference, "element" : vakata_context.element }) : val.label) + (val.shortcut?' <span class="vakata-contextmenu-shortcut vakata-contextmenu-shortcut-'+val.shortcut+'">'+ (val.shortcut_label || '') +'</span>':'') + "<"+"/a>";
					if(val.submenu) {
						tmp = $.vakata.context._parse(val.submenu, true);
						if(tmp) { str += tmp; }
					}
					str += "<"+"/li>";
					if(val.separator_after) {
						str += "<"+"li class='vakata-context-separator'><"+"a href='#' " + ($.vakata.context.settings.icons ? '' : 'style="margin-left:0px;"') + ">&#160;<"+"/a><"+"/li>";
						sep = true;
					}
				});
				str  = str.replace(/<li class\='vakata-context-separator'\><\/li\>$/,"");
				if(is_callback) { str += "</ul>"; }
				/**
				 * triggered on the document when the contextmenu is parsed (HTML is built)
				 * @event
				 * @plugin contextmenu
				 * @name context_parse.vakata
				 * @param {jQuery} reference the element that was right clicked
				 * @param {jQuery} element the DOM element of the menu itself
				 * @param {Object} position the x & y coordinates of the menu
				 */
				if(!is_callback) { vakata_context.html = str; $.vakata.context._trigger("parse"); }
				return str.length > 10 ? str : false;
			},
			_show_submenu : function (o) {
				o = $(o);
				if(!o.length || !o.children("ul").length) { return; }
				var e = o.children("ul"),
					x = o.offset().left + o.outerWidth(),
					y = o.offset().top,
					w = e.width(),
					h = e.height(),
					dw = $(window).width() + $(window).scrollLeft(),
					dh = $(window).height() + $(window).scrollTop();
				// може да се спести е една проверка - дали няма някой от класовете вече нагоре
				if(right_to_left) {
					o[x - (w + 10 + o.outerWidth()) < 0 ? "addClass" : "removeClass"]("vakata-context-left");
				}
				else {
					o[x + w + 10 > dw ? "addClass" : "removeClass"]("vakata-context-right");
				}
				if(y + h + 10 > dh) {
					e.css("bottom","-1px");
				}
				e.show();
			},
			show : function (reference, position, data) {
				var o, e, x, y, w, h, dw, dh, cond = true;
				if(vakata_context.element && vakata_context.element.length) {
					vakata_context.element.width('');
				}
				switch(cond) {
					case (!position && !reference):
						return false;
					case (!!position && !!reference):
						vakata_context.reference	= reference;
						vakata_context.position_x	= position.x;
						vakata_context.position_y	= position.y;
						break;
					case (!position && !!reference):
						vakata_context.reference	= reference;
						o = reference.offset();
						vakata_context.position_x	= o.left + reference.outerHeight();
						vakata_context.position_y	= o.top;
						break;
					case (!!position && !reference):
						vakata_context.position_x	= position.x;
						vakata_context.position_y	= position.y;
						break;
				}
				if(!!reference && !data && $(reference).data('vakata_contextmenu')) {
					data = $(reference).data('vakata_contextmenu');
				}
				if($.vakata.context._parse(data)) {
					vakata_context.element.html(vakata_context.html);
				}
				if(vakata_context.items.length) {
					e = vakata_context.element;
					x = vakata_context.position_x;
					y = vakata_context.position_y;
					w = e.width();
					h = e.height();
					dw = $(window).width() + $(window).scrollLeft();
					dh = $(window).height() + $(window).scrollTop();
					if(right_to_left) {
						x -= e.outerWidth();
						if(x < $(window).scrollLeft() + 20) {
							x = $(window).scrollLeft() + 20;
						}
					}
					if(x + w + 20 > dw) {
						x = dw - (w + 20);
					}
					if(y + h + 20 > dh) {
						y = dh - (h + 20);
					}

					vakata_context.element
						.css({ "left" : x, "top" : y })
						.show()
						.find('a:eq(0)').focus().parent().addClass("vakata-context-hover");
					vakata_context.is_visible = true;
					/**
					 * triggered on the document when the contextmenu is shown
					 * @event
					 * @plugin contextmenu
					 * @name context_show.vakata
					 * @param {jQuery} reference the element that was right clicked
					 * @param {jQuery} element the DOM element of the menu itself
					 * @param {Object} position the x & y coordinates of the menu
					 */
					$.vakata.context._trigger("show");
				}
			},
			hide : function () {
				if(vakata_context.is_visible) {
					vakata_context.element.hide().find("ul").hide().end().find(':focus').blur();
					vakata_context.is_visible = false;
					/**
					 * triggered on the document when the contextmenu is hidden
					 * @event
					 * @plugin contextmenu
					 * @name context_hide.vakata
					 * @param {jQuery} reference the element that was right clicked
					 * @param {jQuery} element the DOM element of the menu itself
					 * @param {Object} position the x & y coordinates of the menu
					 */
					$.vakata.context._trigger("hide");
				}
			}
		};
		$(function () {
			right_to_left = $("body").css("direction") === "rtl";
			var to = false;

			vakata_context.element = $("<ul class='vakata-context'></ul>");
			vakata_context.element
				.on("mouseenter", "li", function (e) {
					e.stopImmediatePropagation();

					if($.contains(this, e.relatedTarget)) {
						// премахнато заради delegate mouseleave по-долу
						// $(this).find(".vakata-context-hover").removeClass("vakata-context-hover");
						return;
					}

					if(to) { clearTimeout(to); }
					vakata_context.element.find(".vakata-context-hover").removeClass("vakata-context-hover").end();

					$(this)
						.siblings().find("ul").hide().end().end()
						.parentsUntil(".vakata-context", "li").addBack().addClass("vakata-context-hover");
					$.vakata.context._show_submenu(this);
				})
				// тестово - дали не натоварва?
				.on("mouseleave", "li", function (e) {
					if($.contains(this, e.relatedTarget)) { return; }
					$(this).find(".vakata-context-hover").addBack().removeClass("vakata-context-hover");
				})
				.on("mouseleave", function (e) {
					$(this).find(".vakata-context-hover").removeClass("vakata-context-hover");
					if($.vakata.context.settings.hide_onmouseleave) {
						to = setTimeout(
							(function (t) {
								return function () { $.vakata.context.hide(); };
							}(this)), $.vakata.context.settings.hide_onmouseleave);
					}
				})
				.on("click", "a", function (e) {
					e.preventDefault();
				})
				.on("mouseup", "a", function (e) {
					if(!$(this).blur().parent().hasClass("vakata-context-disabled") && $.vakata.context._execute($(this).attr("rel")) !== false) {
						$.vakata.context.hide();
					}
				})
				.on('keydown', 'a', function (e) {
						var o = null;
						switch(e.which) {
							case 13:
							case 32:
								e.type = "mouseup";
								e.preventDefault();
								$(e.currentTarget).trigger(e);
								break;
							case 37:
								if(vakata_context.is_visible) {
									vakata_context.element.find(".vakata-context-hover").last().parents("li:eq(0)").find("ul").hide().find(".vakata-context-hover").removeClass("vakata-context-hover").end().end().children('a').focus();
									e.stopImmediatePropagation();
									e.preventDefault();
								}
								break;
							case 38:
								if(vakata_context.is_visible) {
									o = vakata_context.element.find("ul:visible").addBack().last().children(".vakata-context-hover").removeClass("vakata-context-hover").prevAll("li:not(.vakata-context-separator)").first();
									if(!o.length) { o = vakata_context.element.find("ul:visible").addBack().last().children("li:not(.vakata-context-separator)").last(); }
									o.addClass("vakata-context-hover").children('a').focus();
									e.stopImmediatePropagation();
									e.preventDefault();
								}
								break;
							case 39:
								if(vakata_context.is_visible) {
									vakata_context.element.find(".vakata-context-hover").last().children("ul").show().children("li:not(.vakata-context-separator)").removeClass("vakata-context-hover").first().addClass("vakata-context-hover").children('a').focus();
									e.stopImmediatePropagation();
									e.preventDefault();
								}
								break;
							case 40:
								if(vakata_context.is_visible) {
									o = vakata_context.element.find("ul:visible").addBack().last().children(".vakata-context-hover").removeClass("vakata-context-hover").nextAll("li:not(.vakata-context-separator)").first();
									if(!o.length) { o = vakata_context.element.find("ul:visible").addBack().last().children("li:not(.vakata-context-separator)").first(); }
									o.addClass("vakata-context-hover").children('a').focus();
									e.stopImmediatePropagation();
									e.preventDefault();
								}
								break;
							case 27:
								$.vakata.context.hide();
								e.preventDefault();
								break;
							default:
								//console.log(e.which);
								break;
						}
					})
				.on('keydown', function (e) {
					e.preventDefault();
					var a = vakata_context.element.find('.vakata-contextmenu-shortcut-' + e.which).parent();
					if(a.parent().not('.vakata-context-disabled')) {
						a.mouseup();
					}
				})
				.appendTo("body");

			$(document)
				.on("mousedown", function (e) {
					if(vakata_context.is_visible && !$.contains(vakata_context.element[0], e.target)) { $.vakata.context.hide(); }
				})
				.on("context_show.vakata", function (e, data) {
					vakata_context.element.find("li:has(ul)").children("a").addClass("vakata-context-parent");
					if(right_to_left) {
						vakata_context.element.addClass("vakata-context-rtl").css("direction", "rtl");
					}
					// also apply a RTL class?
					vakata_context.element.find("ul").hide().end();
				});
		});
	}($));
	// $.jstree.defaults.plugins.push("contextmenu");

/**
 * ### Drag'n'drop plugin
 *
 * Enables dragging and dropping of nodes in the tree, resulting in a move or copy operations.
 */

	/**
	 * stores all defaults for the drag'n'drop plugin
	 * @name $.jstree.defaults.dnd
	 * @plugin dnd
	 */
	$.jstree.defaults.dnd = {
		/**
		 * a boolean indicating if a copy should be possible while dragging (by pressint the meta key or Ctrl). Defaults to `true`.
		 * @name $.jstree.defaults.dnd.copy
		 * @plugin dnd
		 */
		copy : true,
		/**
		 * a number indicating how long a node should remain hovered while dragging to be opened. Defaults to `500`.
		 * @name $.jstree.defaults.dnd.open_timeout
		 * @plugin dnd
		 */
		open_timeout : 500,
		/**
		 * a function invoked each time a node is about to be dragged, invoked in the tree's scope and receives the nodes about to be dragged as an argument (array) - return `false` to prevent dragging
		 * @name $.jstree.defaults.dnd.is_draggable
		 * @plugin dnd
		 */
		is_draggable : true,
		/**
		 * a boolean indicating if checks should constantly be made while the user is dragging the node (as opposed to checking only on drop), default is `true`
		 * @name $.jstree.defaults.dnd.check_while_dragging
		 * @plugin dnd
		 */
		check_while_dragging : true,
		/**
		 * a boolean indicating if nodes from this tree should only be copied with dnd (as opposed to moved), default is `false`
		 * @name $.jstree.defaults.dnd.always_copy
		 * @plugin dnd
		 */
		always_copy : false
	};
	// TODO: now check works by checking for each node individually, how about max_children, unique, etc?
	// TODO: drop somewhere else - maybe demo only?
	$.jstree.plugins.dnd = function (options, parent) {
		this.bind = function () {
			parent.bind.call(this);

			this.element
				.on('mousedown.jstree touchstart.jstree', '.jstree-anchor', $.proxy(function (e) {
					var obj = this.get_node(e.target),
						mlt = this.is_selected(obj) ? this.get_selected().length : 1;
					if(obj && obj.id && obj.id !== "#" && (e.which === 1 || e.type === "touchstart") &&
						(this.settings.dnd.is_draggable === true || ($.isFunction(this.settings.dnd.is_draggable) && this.settings.dnd.is_draggable.call(this, (mlt > 1 ? this.get_selected(true) : [obj]))))
					) {
						this.element.trigger('mousedown.jstree');
						return $.vakata.dnd.start(e, { 'jstree' : true, 'origin' : this, 'obj' : this.get_node(obj,true), 'nodes' : mlt > 1 ? this.get_selected() : [obj.id] }, '<div id="jstree-dnd" class="jstree-' + this.get_theme() + '"><i class="jstree-icon jstree-er"></i>' + (mlt > 1 ? mlt + ' ' + this.get_string('nodes') : this.get_text(e.currentTarget, true)) + '<ins class="jstree-copy" style="display:none;">+</ins></div>');
					}
				}, this));
		};
	};

	$(function() {
		// bind only once for all instances
		var lastmv = false,
			laster = false,
			opento = false,
			marker = $('<div id="jstree-marker">&#160;</div>').hide().appendTo('body');

		$(document)
			.bind('dnd_start.vakata', function (e, data) {
				lastmv = false;
			})
			.bind('dnd_move.vakata', function (e, data) {
				if(opento) { clearTimeout(opento); }
				if(!data.data.jstree) { return; }

				// if we are hovering the marker image do nothing (can happen on "inside" drags)
				if(data.event.target.id && data.event.target.id === 'jstree-marker') {
					return;
				}

				var ins = $.jstree.reference(data.event.target),
					ref = false,
					off = false,
					rel = false,
					l, t, h, p, i, o, ok, t1, t2, op, ps, pr;
				// if we are over an instance
				if(ins && ins._data && ins._data.dnd) {
					marker.attr('class', 'jstree-' + ins.get_theme());
					data.helper
						.children().attr('class', 'jstree-' + ins.get_theme())
						.find('.jstree-copy:eq(0)')[ data.data.origin && (data.data.origin.settings.dnd.always_copy || (data.data.origin.settings.dnd.copy && (data.event.metaKey || data.event.ctrlKey))) ? 'show' : 'hide' ]();


					// if are hovering the container itself add a new root node
					if( (data.event.target === ins.element[0] || data.event.target === ins.get_container_ul()[0]) && ins.get_container_ul().children().length === 0) {
						ok = true;
						for(t1 = 0, t2 = data.data.nodes.length; t1 < t2; t1++) {
							ok = ok && ins.check( (data.data.origin && (data.data.origin.settings.dnd.always_copy || (data.data.origin.settings.dnd.copy && (data.event.metaKey || data.event.ctrlKey)) ) ? "copy_node" : "move_node"), (data.data.origin && data.data.origin !== ins ? data.data.origin.get_node(data.data.nodes[t1]) : data.data.nodes[t1]), '#', 'last', { 'dnd' : true, 'ref' : ins.get_node('#'), 'pos' : 'i', 'is_multi' : (data.data.origin && data.data.origin !== ins), 'is_foreign' : (!data.data.origin) });
							if(!ok) { break; }
						}
						if(ok) {
							lastmv = { 'ins' : ins, 'par' : '#', 'pos' : 'last' };
							marker.hide();
							data.helper.find('.jstree-icon:eq(0)').removeClass('jstree-er').addClass('jstree-ok');
							return;
						}
					}
					else {
						// if we are hovering a tree node
						ref = $(data.event.target).closest('a');
						if(ref && ref.length && ref.parent().is('.jstree-closed, .jstree-open, .jstree-leaf')) {
							off = ref.offset();
							rel = data.event.pageY - off.top;
							h = ref.height();
							if(rel < h / 3) {
								o = ['b', 'i', 'a'];
							}
							else if(rel > h - h / 3) {
								o = ['a', 'i', 'b'];
							}
							else {
								o = rel > h / 2 ? ['i', 'a', 'b'] : ['i', 'b', 'a'];
							}
							$.each(o, function (j, v) {
								switch(v) {
									case 'b':
										l = off.left - 6;
										t = off.top - 5;
										p = ins.get_parent(ref);
										i = ref.parent().index();
										break;
									case 'i':
										l = off.left - 2;
										t = off.top - 5 + h / 2 + 1;
										p = ins.get_node(ref.parent()).id;
										i = 0;
										break;
									case 'a':
										l = off.left - 6;
										t = off.top - 5 + h;
										p = ins.get_parent(ref);
										i = ref.parent().index() + 1;
										break;
								}
								/*!
								// TODO: moving inside, but the node is not yet loaded?
								// the check will work anyway, as when moving the node will be loaded first and checked again
								if(v === 'i' && !ins.is_loaded(p)) { }
								*/
								ok = true;
								for(t1 = 0, t2 = data.data.nodes.length; t1 < t2; t1++) {
									op = data.data.origin && (data.data.origin.settings.dnd.always_copy || (data.data.origin.settings.dnd.copy && (data.event.metaKey || data.event.ctrlKey))) ? "copy_node" : "move_node";
									ps = i;
									if(op === "move_node" && v === 'a' && (data.data.origin && data.data.origin === ins) && p === ins.get_parent(data.data.nodes[t1])) {
										pr = ins.get_node(p);
										if(ps > $.inArray(data.data.nodes[t1], pr.children)) {
											ps -= 1;
										}
									}
									ok = ok && ( (ins && ins.settings && ins.settings.dnd && ins.settings.dnd.check_while_dragging === false) || ins.check(op, (data.data.origin && data.data.origin !== ins ? data.data.origin.get_node(data.data.nodes[t1]) : data.data.nodes[t1]), p, ps, { 'dnd' : true, 'ref' : ins.get_node(ref.parent()), 'pos' : v, 'is_multi' : (data.data.origin && data.data.origin !== ins), 'is_foreign' : (!data.data.origin) }) );
									if(!ok) {
										if(ins && ins.last_error) { laster = ins.last_error(); }
										break;
									}
								}
								if(ok) {
									if(v === 'i' && ref.parent().is('.jstree-closed') && ins.settings.dnd.open_timeout) {
										opento = setTimeout((function (x, z) { return function () { x.open_node(z); }; }(ins, ref)), ins.settings.dnd.open_timeout);
									}
									lastmv = { 'ins' : ins, 'par' : p, 'pos' : i };
									marker.css({ 'left' : l + 'px', 'top' : t + 'px' }).show();
									data.helper.find('.jstree-icon:eq(0)').removeClass('jstree-er').addClass('jstree-ok');
									laster = {};
									o = true;
									return false;
								}
							});
							if(o === true) { return; }
						}
					}
				}
				lastmv = false;
				data.helper.find('.jstree-icon').removeClass('jstree-ok').addClass('jstree-er');
				marker.hide();
			})
			.bind('dnd_scroll.vakata', function (e, data) {
				if(!data.data.jstree) { return; }
				marker.hide();
				lastmv = false;
				data.helper.find('.jstree-icon:eq(0)').removeClass('jstree-ok').addClass('jstree-er');
			})
			.bind('dnd_stop.vakata', function (e, data) {
				if(opento) { clearTimeout(opento); }
				if(!data.data.jstree) { return; }
				marker.hide();
				var i, j, nodes = [];
				if(lastmv) {
					for(i = 0, j = data.data.nodes.length; i < j; i++) {
						nodes[i] = data.data.origin ? data.data.origin.get_node(data.data.nodes[i]) : data.data.nodes[i];
						if(data.data.origin) {
							nodes[i].instance = data.data.origin;
						}
					}
					lastmv.ins[ data.data.origin && (data.data.origin.settings.dnd.always_copy || (data.data.origin.settings.dnd.copy && (data.event.metaKey || data.event.ctrlKey))) ? 'copy_node' : 'move_node' ](nodes, lastmv.par, lastmv.pos);
				}
				else {
					i = $(data.event.target).closest('.jstree');
					if(i.length && laster && laster.error && laster.error === 'check') {
						i = i.jstree(true);
						if(i) {
							i.settings.core.error.call(this, laster);
						}
					}
				}
			})
			.bind('keyup keydown', function (e, data) {
				data = $.vakata.dnd._get();
				if(data.data && data.data.jstree) {
					data.helper.find('.jstree-copy:eq(0)')[ data.data.origin && (data.data.origin.settings.dnd.always_copy || (data.data.origin.settings.dnd.copy && (e.metaKey || e.ctrlKey))) ? 'show' : 'hide' ]();
				}
			});
	});

	// helpers
	(function ($) {
		// private variable
		var vakata_dnd = {
			element	: false,
			is_down	: false,
			is_drag	: false,
			helper	: false,
			helper_w: 0,
			data	: false,
			init_x	: 0,
			init_y	: 0,
			scroll_l: 0,
			scroll_t: 0,
			scroll_e: false,
			scroll_i: false
		};
		$.vakata.dnd = {
			settings : {
				scroll_speed		: 10,
				scroll_proximity	: 20,
				helper_left			: 5,
				helper_top			: 10,
				threshold			: 5
			},
			_trigger : function (event_name, e) {
				var data = $.vakata.dnd._get();
				data.event = e;
				$(document).triggerHandler("dnd_" + event_name + ".vakata", data);
			},
			_get : function () {
				return {
					"data"		: vakata_dnd.data,
					"element"	: vakata_dnd.element,
					"helper"	: vakata_dnd.helper
				};
			},
			_clean : function () {
				if(vakata_dnd.helper) { vakata_dnd.helper.remove(); }
				if(vakata_dnd.scroll_i) { clearInterval(vakata_dnd.scroll_i); vakata_dnd.scroll_i = false; }
				vakata_dnd = {
					element	: false,
					is_down	: false,
					is_drag	: false,
					helper	: false,
					helper_w: 0,
					data	: false,
					init_x	: 0,
					init_y	: 0,
					scroll_l: 0,
					scroll_t: 0,
					scroll_e: false,
					scroll_i: false
				};
				$(document).off("mousemove touchmove", $.vakata.dnd.drag);
				$(document).off("mouseup touchend", $.vakata.dnd.stop);
			},
			_scroll : function (init_only) {
				if(!vakata_dnd.scroll_e || (!vakata_dnd.scroll_l && !vakata_dnd.scroll_t)) {
					if(vakata_dnd.scroll_i) { clearInterval(vakata_dnd.scroll_i); vakata_dnd.scroll_i = false; }
					return false;
				}
				if(!vakata_dnd.scroll_i) {
					vakata_dnd.scroll_i = setInterval($.vakata.dnd._scroll, 100);
					return false;
				}
				if(init_only === true) { return false; }

				var i = vakata_dnd.scroll_e.scrollTop(),
					j = vakata_dnd.scroll_e.scrollLeft();
				vakata_dnd.scroll_e.scrollTop(i + vakata_dnd.scroll_t * $.vakata.dnd.settings.scroll_speed);
				vakata_dnd.scroll_e.scrollLeft(j + vakata_dnd.scroll_l * $.vakata.dnd.settings.scroll_speed);
				if(i !== vakata_dnd.scroll_e.scrollTop() || j !== vakata_dnd.scroll_e.scrollLeft()) {
					/**
					 * triggered on the document when a drag causes an element to scroll
					 * @event
					 * @plugin dnd
					 * @name dnd_scroll.vakata
					 * @param {Mixed} data any data supplied with the call to $.vakata.dnd.start
					 * @param {DOM} element the DOM element being dragged
					 * @param {jQuery} helper the helper shown next to the mouse
					 * @param {jQuery} event the element that is scrolling
					 */
					$.vakata.dnd._trigger("scroll", vakata_dnd.scroll_e);
				}
			},
			start : function (e, data, html) {
				if(e.type === "touchstart" && e.originalEvent && e.originalEvent.changedTouches && e.originalEvent.changedTouches[0]) {
					e.pageX = e.originalEvent.changedTouches[0].pageX;
					e.pageY = e.originalEvent.changedTouches[0].pageY;
					e.target = document.elementFromPoint(e.originalEvent.changedTouches[0].pageX - window.pageXOffset, e.originalEvent.changedTouches[0].pageY - window.pageYOffset);
				}
				if(vakata_dnd.is_drag) { $.vakata.dnd.stop({}); }
				try {
					e.currentTarget.unselectable = "on";
					e.currentTarget.onselectstart = function() { return false; };
					if(e.currentTarget.style) { e.currentTarget.style.MozUserSelect = "none"; }
				} catch(ignore) { }
				vakata_dnd.init_x	= e.pageX;
				vakata_dnd.init_y	= e.pageY;
				vakata_dnd.data		= data;
				vakata_dnd.is_down	= true;
				vakata_dnd.element	= e.currentTarget;
				if(html !== false) {
					vakata_dnd.helper = $("<div id='vakata-dnd'></div>").html(html).css({
						"display"		: "block",
						"margin"		: "0",
						"padding"		: "0",
						"position"		: "absolute",
						"top"			: "-2000px",
						"lineHeight"	: "16px",
						"zIndex"		: "10000"
					});
				}
				$(document).bind("mousemove touchmove", $.vakata.dnd.drag);
				$(document).bind("mouseup touchend", $.vakata.dnd.stop);
				return false;
			},
			drag : function (e) {
				if(e.type === "touchmove" && e.originalEvent && e.originalEvent.changedTouches && e.originalEvent.changedTouches[0]) {
					e.pageX = e.originalEvent.changedTouches[0].pageX;
					e.pageY = e.originalEvent.changedTouches[0].pageY;
					e.target = document.elementFromPoint(e.originalEvent.changedTouches[0].pageX - window.pageXOffset, e.originalEvent.changedTouches[0].pageY - window.pageYOffset);
				}
				if(!vakata_dnd.is_down) { return; }
				if(!vakata_dnd.is_drag) {
					if(
						Math.abs(e.pageX - vakata_dnd.init_x) > $.vakata.dnd.settings.threshold ||
						Math.abs(e.pageY - vakata_dnd.init_y) > $.vakata.dnd.settings.threshold
					) {
						if(vakata_dnd.helper) {
							vakata_dnd.helper.appendTo("body");
							vakata_dnd.helper_w = vakata_dnd.helper.outerWidth();
						}
						vakata_dnd.is_drag = true;
						/**
						 * triggered on the document when a drag starts
						 * @event
						 * @plugin dnd
						 * @name dnd_start.vakata
						 * @param {Mixed} data any data supplied with the call to $.vakata.dnd.start
						 * @param {DOM} element the DOM element being dragged
						 * @param {jQuery} helper the helper shown next to the mouse
						 * @param {Object} event the event that caused the start (probably mousemove)
						 */
						$.vakata.dnd._trigger("start", e);
					}
					else { return; }
				}

				var d  = false, w  = false,
					dh = false, wh = false,
					dw = false, ww = false,
					dt = false, dl = false,
					ht = false, hl = false;

				vakata_dnd.scroll_t = 0;
				vakata_dnd.scroll_l = 0;
				vakata_dnd.scroll_e = false;
				$($(e.target).parentsUntil("body").addBack().get().reverse())
					.filter(function () {
						return	(/^auto|scroll$/).test($(this).css("overflow")) &&
								(this.scrollHeight > this.offsetHeight || this.scrollWidth > this.offsetWidth);
					})
					.each(function () {
						var t = $(this), o = t.offset();
						if(this.scrollHeight > this.offsetHeight) {
							if(o.top + t.height() - e.pageY < $.vakata.dnd.settings.scroll_proximity)	{ vakata_dnd.scroll_t = 1; }
							if(e.pageY - o.top < $.vakata.dnd.settings.scroll_proximity)				{ vakata_dnd.scroll_t = -1; }
						}
						if(this.scrollWidth > this.offsetWidth) {
							if(o.left + t.width() - e.pageX < $.vakata.dnd.settings.scroll_proximity)	{ vakata_dnd.scroll_l = 1; }
							if(e.pageX - o.left < $.vakata.dnd.settings.scroll_proximity)				{ vakata_dnd.scroll_l = -1; }
						}
						if(vakata_dnd.scroll_t || vakata_dnd.scroll_l) {
							vakata_dnd.scroll_e = $(this);
							return false;
						}
					});

				if(!vakata_dnd.scroll_e) {
					d  = $(document); w = $(window);
					dh = d.height(); wh = w.height();
					dw = d.width(); ww = w.width();
					dt = d.scrollTop(); dl = d.scrollLeft();
					if(dh > wh && e.pageY - dt < $.vakata.dnd.settings.scroll_proximity)		{ vakata_dnd.scroll_t = -1;  }
					if(dh > wh && wh - (e.pageY - dt) < $.vakata.dnd.settings.scroll_proximity)	{ vakata_dnd.scroll_t = 1; }
					if(dw > ww && e.pageX - dl < $.vakata.dnd.settings.scroll_proximity)		{ vakata_dnd.scroll_l = -1; }
					if(dw > ww && ww - (e.pageX - dl) < $.vakata.dnd.settings.scroll_proximity)	{ vakata_dnd.scroll_l = 1; }
					if(vakata_dnd.scroll_t || vakata_dnd.scroll_l) {
						vakata_dnd.scroll_e = d;
					}
				}
				if(vakata_dnd.scroll_e) { $.vakata.dnd._scroll(true); }

				if(vakata_dnd.helper) {
					ht = parseInt(e.pageY + $.vakata.dnd.settings.helper_top, 10);
					hl = parseInt(e.pageX + $.vakata.dnd.settings.helper_left, 10);
					if(dh && ht + 25 > dh) { ht = dh - 50; }
					if(dw && hl + vakata_dnd.helper_w > dw) { hl = dw - (vakata_dnd.helper_w + 2); }
					vakata_dnd.helper.css({
						left	: hl + "px",
						top		: ht + "px"
					});
				}
				/**
				 * triggered on the document when a drag is in progress
				 * @event
				 * @plugin dnd
				 * @name dnd_move.vakata
				 * @param {Mixed} data any data supplied with the call to $.vakata.dnd.start
				 * @param {DOM} element the DOM element being dragged
				 * @param {jQuery} helper the helper shown next to the mouse
				 * @param {Object} event the event that caused this to trigger (most likely mousemove)
				 */
				$.vakata.dnd._trigger("move", e);
			},
			stop : function (e) {
				if(e.type === "touchend" && e.originalEvent && e.originalEvent.changedTouches && e.originalEvent.changedTouches[0]) {
					e.pageX = e.originalEvent.changedTouches[0].pageX;
					e.pageY = e.originalEvent.changedTouches[0].pageY;
					e.target = document.elementFromPoint(e.originalEvent.changedTouches[0].pageX - window.pageXOffset, e.originalEvent.changedTouches[0].pageY - window.pageYOffset);
				}
				if(vakata_dnd.is_drag) {
					/**
					 * triggered on the document when a drag stops (the dragged element is dropped)
					 * @event
					 * @plugin dnd
					 * @name dnd_stop.vakata
					 * @param {Mixed} data any data supplied with the call to $.vakata.dnd.start
					 * @param {DOM} element the DOM element being dragged
					 * @param {jQuery} helper the helper shown next to the mouse
					 * @param {Object} event the event that caused the stop
					 */
					$.vakata.dnd._trigger("stop", e);
				}
				$.vakata.dnd._clean();
			}
		};
	}(jQuery));

	// include the dnd plugin by default
	// $.jstree.defaults.plugins.push("dnd");


/**
 * ### Search plugin
 *
 * Adds search functionality to jsTree.
 */

	/**
	 * stores all defaults for the search plugin
	 * @name $.jstree.defaults.search
	 * @plugin search
	 */
	$.jstree.defaults.search = {
		/**
		 * a jQuery-like AJAX config, which jstree uses if a server should be queried for results. 
		 * 
		 * A `str` (which is the search string) parameter will be added with the request. The expected result is a JSON array with nodes that need to be opened so that matching nodes will be revealed.
		 * Leave this setting as `false` to not query the server. You can also set this to a function, which will be invoked in the instance's scope and receive 2 parameters - the search string and the callback to call with the array of nodes to load.
		 * @name $.jstree.defaults.search.ajax
		 * @plugin search
		 */
		ajax : false,
		/**
		 * Indicates if the search should be fuzzy or not (should `chnd3` match `child node 3`). Default is `true`.
		 * @name $.jstree.defaults.search.fuzzy
		 * @plugin search
		 */
		fuzzy : true,
		/**
		 * Indicates if the search should be case sensitive. Default is `false`.
		 * @name $.jstree.defaults.search.case_sensitive
		 * @plugin search
		 */
		case_sensitive : false,
		/**
		 * Indicates if the tree should be filtered to show only matching nodes (keep in mind this can be a heavy on large trees in old browsers). Default is `false`.
		 * @name $.jstree.defaults.search.show_only_matches
		 * @plugin search
		 */
		show_only_matches : false,
		/**
		 * Indicates if all nodes opened to reveal the search result, should be closed when the search is cleared or a new search is performed. Default is `true`.
		 * @name $.jstree.defaults.search.close_opened_onclear
		 * @plugin search
		 */
		close_opened_onclear : true,
		/**
		 * Indicates if only leaf nodes should be included in search results. Default is `false`.
		 * @name $.jstree.defaults.search.search_leaves_only
		 * @plugin search
		 */
		search_leaves_only : false
	};

	$.jstree.plugins.search = function (options, parent) {
		this.bind = function () {
			parent.bind.call(this);

			this._data.search.str = "";
			this._data.search.dom = $();
			this._data.search.res = [];
			this._data.search.opn = [];

			this.element.on('before_open.jstree', $.proxy(function (e, data) {
				var i, j, f, r = this._data.search.res, s = [], o = $();
				if(r && r.length) {
					this._data.search.dom = $();
					for(i = 0, j = r.length; i < j; i++) {
						s = s.concat(this.get_node(r[i]).parents);
						f = this.get_node(r[i], true);
						if(f) {
							this._data.search.dom = this._data.search.dom.add(f);
						}
					}
					s = $.vakata.array_unique(s);
					for(i = 0, j = s.length; i < j; i++) {
						if(s[i] === "#") { continue; }
						f = this.get_node(s[i], true);
						if(f) {
							o = o.add(f);
						}
					}
					this._data.search.dom.children(".jstree-anchor").addClass('jstree-search');
					if(this.settings.search.show_only_matches && this._data.search.res.length) {
						this.element.find("li").hide().filter('.jstree-last').filter(function() { return this.nextSibling; }).removeClass('jstree-last');
						o = o.add(this._data.search.dom);
						o.parentsUntil(".jstree").addBack().show()
							.filter("ul").each(function () { $(this).children("li:visible").eq(-1).addClass("jstree-last"); });
					}
				}
			}, this));
			if(this.settings.search.show_only_matches) {
				this.element
					.on("search.jstree", function (e, data) {
						if(data.nodes.length) {
							$(this).find("li").hide().filter('.jstree-last').filter(function() { return this.nextSibling; }).removeClass('jstree-last');
							data.nodes.parentsUntil(".jstree").addBack().show()
								.filter("ul").each(function () { $(this).children("li:visible").eq(-1).addClass("jstree-last"); });
						}
					})
					.on("clear_search.jstree", function (e, data) {
						if(data.nodes.length) {
							$(this).find("li").css("display","").filter('.jstree-last').filter(function() { return this.nextSibling; }).removeClass('jstree-last');
						}
					});
			}
		};
		/**
		 * used to search the tree nodes for a given string
		 * @name search(str [, skip_async])
		 * @param {String} str the search string
		 * @param {Boolean} skip_async if set to true server will not be queried even if configured
		 * @plugin search
		 * @trigger search.jstree
		 */
		this.search = function (str, skip_async) {
			if(str === false || $.trim(str) === "") {
				return this.clear_search();
			}
			var s = this.settings.search,
				a = s.ajax ? s.ajax : false,
				f = null,
				r = [],
				p = [], i, j;
			if(this._data.search.res.length) {
				this.clear_search();
			}
			if(!skip_async && a !== false) {
				if($.isFunction(a)) {
					return a.call(this, str, $.proxy(function (d) {
							if(d && d.d) { d = d.d; }
							this._load_nodes(!$.isArray(d) ? [] : d, function () {
								this.search(str, true);
							});
						}, this));
				}
				else {
					a = $.extend({}, a);
					if(!a.data) { a.data = {}; }
					a.data.str = str;
					return $.ajax(a)
						.fail($.proxy(function () {
							this._data.core.last_error = { 'error' : 'ajax', 'plugin' : 'search', 'id' : 'search_01', 'reason' : 'Could not load search parents', 'data' : JSON.stringify(a) };
							this.settings.core.error.call(this, this._data.core.last_error);
						}, this))
						.done($.proxy(function (d) {
							if(d && d.d) { d = d.d; }
							this._load_nodes(!$.isArray(d) ? [] : d, function () {
								this.search(str, true);
							});
						}, this));
				}
			}
			this._data.search.str = str;
			this._data.search.dom = $();
			this._data.search.res = [];
			this._data.search.opn = [];

			f = new $.vakata.search(str, true, { caseSensitive : s.case_sensitive, fuzzy : s.fuzzy });

			$.each(this._model.data, function (i, v) {
				if(v.text && f.search(v.text).isMatch && (!s.search_leaves_only || (v.state.loaded && v.children.length === 0)) ) {
					r.push(i);
					p = p.concat(v.parents);
				}
			});
			if(r.length) {
				p = $.vakata.array_unique(p);
				this._search_open(p);
				for(i = 0, j = r.length; i < j; i++) {
					f = this.get_node(r[i], true);
					if(f) {
						this._data.search.dom = this._data.search.dom.add(f);
					}
				}
				this._data.search.res = r;
				this._data.search.dom.children(".jstree-anchor").addClass('jstree-search');
			}
			/**
			 * triggered after search is complete
			 * @event
			 * @name search.jstree
			 * @param {jQuery} nodes a jQuery collection of matching nodes
			 * @param {String} str the search string
			 * @param {Array} res a collection of objects represeing the matching nodes
			 * @plugin search
			 */
			this.trigger('search', { nodes : this._data.search.dom, str : str, res : this._data.search.res });
		};
		/**
		 * used to clear the last search (removes classes and shows all nodes if filtering is on)
		 * @name clear_search()
		 * @plugin search
		 * @trigger clear_search.jstree
		 */
		this.clear_search = function () {
			this._data.search.dom.children(".jstree-anchor").removeClass("jstree-search");
			if(this.settings.search.close_opened_onclear) {
				this.close_node(this._data.search.opn, 0);
			}
			/**
			 * triggered after search is complete
			 * @event
			 * @name clear_search.jstree
			 * @param {jQuery} nodes a jQuery collection of matching nodes (the result from the last search)
			 * @param {String} str the search string (the last search string)
			 * @param {Array} res a collection of objects represeing the matching nodes (the result from the last search)
			 * @plugin search
			 */
			this.trigger('clear_search', { 'nodes' : this._data.search.dom, str : this._data.search.str, res : this._data.search.res });
			this._data.search.str = "";
			this._data.search.res = [];
			this._data.search.opn = [];
			this._data.search.dom = $();
		};
		/**
		 * opens nodes that need to be opened to reveal the search results. Used only internally.
		 * @private
		 * @name _search_open(d)
		 * @param {Array} d an array of node IDs
		 * @plugin search
		 */
		this._search_open = function (d) {
			var t = this;
			$.each(d.concat([]), function (i, v) {
				if(v === "#") { return true; }
				try { v = $('#' + v.replace($.jstree.idregex,'\\$&'), t.element); } catch(ignore) { }
				if(v && v.length) {
					if(t.is_closed(v)) {
						t._data.search.opn.push(v[0].id);
						t.open_node(v, function () { t._search_open(d); }, 0);
					}
				}
			});
		};
	};

	// helpers
	(function ($) {
		// from http://kiro.me/projects/fuse.html
		$.vakata.search = function(pattern, txt, options) {
			options = options || {};
			if(options.fuzzy !== false) {
				options.fuzzy = true;
			}
			pattern = options.caseSensitive ? pattern : pattern.toLowerCase();
			var MATCH_LOCATION	= options.location || 0,
				MATCH_DISTANCE	= options.distance || 100,
				MATCH_THRESHOLD	= options.threshold || 0.6,
				patternLen = pattern.length,
				matchmask, pattern_alphabet, match_bitapScore, search;
			if(patternLen > 32) {
				options.fuzzy = false;
			}
			if(options.fuzzy) {
				matchmask = 1 << (patternLen - 1);
				pattern_alphabet = (function () {
					var mask = {},
						i = 0;
					for (i = 0; i < patternLen; i++) {
						mask[pattern.charAt(i)] = 0;
					}
					for (i = 0; i < patternLen; i++) {
						mask[pattern.charAt(i)] |= 1 << (patternLen - i - 1);
					}
					return mask;
				}());
				match_bitapScore = function (e, x) {
					var accuracy = e / patternLen,
						proximity = Math.abs(MATCH_LOCATION - x);
					if(!MATCH_DISTANCE) {
						return proximity ? 1.0 : accuracy;
					}
					return accuracy + (proximity / MATCH_DISTANCE);
				};
			}
			search = function (text) {
				text = options.caseSensitive ? text : text.toLowerCase();
				if(pattern === text || text.indexOf(pattern) !== -1) {
					return {
						isMatch: true,
						score: 0
					};
				}
				if(!options.fuzzy) {
					return {
						isMatch: false,
						score: 1
					};
				}
				var i, j,
					textLen = text.length,
					scoreThreshold = MATCH_THRESHOLD,
					bestLoc = text.indexOf(pattern, MATCH_LOCATION),
					binMin, binMid,
					binMax = patternLen + textLen,
					lastRd, start, finish, rd, charMatch,
					score = 1,
					locations = [];
				if (bestLoc !== -1) {
					scoreThreshold = Math.min(match_bitapScore(0, bestLoc), scoreThreshold);
					bestLoc = text.lastIndexOf(pattern, MATCH_LOCATION + patternLen);
					if (bestLoc !== -1) {
						scoreThreshold = Math.min(match_bitapScore(0, bestLoc), scoreThreshold);
					}
				}
				bestLoc = -1;
				for (i = 0; i < patternLen; i++) {
					binMin = 0;
					binMid = binMax;
					while (binMin < binMid) {
						if (match_bitapScore(i, MATCH_LOCATION + binMid) <= scoreThreshold) {
							binMin = binMid;
						} else {
							binMax = binMid;
						}
						binMid = Math.floor((binMax - binMin) / 2 + binMin);
					}
					binMax = binMid;
					start = Math.max(1, MATCH_LOCATION - binMid + 1);
					finish = Math.min(MATCH_LOCATION + binMid, textLen) + patternLen;
					rd = new Array(finish + 2);
					rd[finish + 1] = (1 << i) - 1;
					for (j = finish; j >= start; j--) {
						charMatch = pattern_alphabet[text.charAt(j - 1)];
						if (i === 0) {
							rd[j] = ((rd[j + 1] << 1) | 1) & charMatch;
						} else {
							rd[j] = ((rd[j + 1] << 1) | 1) & charMatch | (((lastRd[j + 1] | lastRd[j]) << 1) | 1) | lastRd[j + 1];
						}
						if (rd[j] & matchmask) {
							score = match_bitapScore(i, j - 1);
							if (score <= scoreThreshold) {
								scoreThreshold = score;
								bestLoc = j - 1;
								locations.push(bestLoc);
								if (bestLoc > MATCH_LOCATION) {
									start = Math.max(1, 2 * MATCH_LOCATION - bestLoc);
								} else {
									break;
								}
							}
						}
					}
					if (match_bitapScore(i + 1, MATCH_LOCATION) > scoreThreshold) {
						break;
					}
					lastRd = rd;
				}
				return {
					isMatch: bestLoc >= 0,
					score: score
				};
			};
			return txt === true ? { 'search' : search } : search(txt);
		};
	}(jQuery));

	// include the search plugin by default
	// $.jstree.defaults.plugins.push("search");

/**
 * ### Sort plugin
 *
 * Autmatically sorts all siblings in the tree according to a sorting function.
 */

	/**
	 * the settings function used to sort the nodes.
	 * It is executed in the tree's context, accepts two nodes as arguments and should return `1` or `-1`.
	 * @name $.jstree.defaults.sort
	 * @plugin sort
	 */
	$.jstree.defaults.sort = function (a, b) {
		//return this.get_type(a) === this.get_type(b) ? (this.get_text(a) > this.get_text(b) ? 1 : -1) : this.get_type(a) >= this.get_type(b);
		return this.get_text(a) > this.get_text(b) ? 1 : -1;
	};
	$.jstree.plugins.sort = function (options, parent) {
		this.bind = function () {
			parent.bind.call(this);
			this.element
				.on("model.jstree", $.proxy(function (e, data) {
						this.sort(data.parent, true);
					}, this))
				.on("rename_node.jstree create_node.jstree", $.proxy(function (e, data) {
						this.sort(data.parent || data.node.parent, false);
						this.redraw_node(data.parent || data.node.parent, true);
					}, this))
				.on("move_node.jstree copy_node.jstree", $.proxy(function (e, data) {
						this.sort(data.parent, false);
						this.redraw_node(data.parent, true);
					}, this));
		};
		/**
		 * used to sort a node's children
		 * @private
		 * @name sort(obj [, deep])
		 * @param  {mixed} obj the node
		 * @param {Boolean} deep if set to `true` nodes are sorted recursively.
		 * @plugin sort
		 * @trigger search.jstree
		 */
		this.sort = function (obj, deep) {
			var i, j;
			obj = this.get_node(obj);
			if(obj && obj.children && obj.children.length) {
				obj.children.sort($.proxy(this.settings.sort, this));
				if(deep) {
					for(i = 0, j = obj.children_d.length; i < j; i++) {
						this.sort(obj.children_d[i], false);
					}
				}
			}
		};
	};

	// include the sort plugin by default
	// $.jstree.defaults.plugins.push("sort");

/**
 * ### State plugin
 *
 * Saves the state of the tree (selected nodes, opened nodes) on the user's computer using available options (localStorage, cookies, etc)
 */

	var to = false;
	/**
	 * stores all defaults for the state plugin
	 * @name $.jstree.defaults.state
	 * @plugin state
	 */
	$.jstree.defaults.state = {
		/**
		 * A string for the key to use when saving the current tree (change if using multiple trees in your project). Defaults to `jstree`.
		 * @name $.jstree.defaults.state.key
		 * @plugin state
		 */
		key		: 'jstree',
		/**
		 * A space separated list of events that trigger a state save. Defaults to `changed.jstree open_node.jstree close_node.jstree`.
		 * @name $.jstree.defaults.state.events
		 * @plugin state
		 */
		events	: 'changed.jstree open_node.jstree close_node.jstree',
		/**
		 * Time in milliseconds after which the state will expire. Defaults to 'false' meaning - no expire.
		 * @name $.jstree.defaults.state.ttl
		 * @plugin state
		 */
		ttl		: false,
		/**
		 * A function that will be executed prior to restoring state with one argument - the state object. Can be used to clear unwanted parts of the state.
		 * @name $.jstree.defaults.state.filter
		 * @plugin state
		 */
		filter	: false
	};
	$.jstree.plugins.state = function (options, parent) {
		this.bind = function () {
			parent.bind.call(this);
			var bind = $.proxy(function () {
				this.element.on(this.settings.state.events, $.proxy(function () {
					if(to) { clearTimeout(to); }
					to = setTimeout($.proxy(function () { this.save_state(); }, this), 100);
				}, this));
			}, this);
			this.element
				.on("ready.jstree", $.proxy(function (e, data) {
						this.element.one("restore_state.jstree", bind);
						if(!this.restore_state()) { bind(); }
					}, this));
		};
		/**
		 * save the state
		 * @name save_state()
		 * @plugin state
		 */
		this.save_state = function () {
			var st = { 'state' : this.get_state(), 'ttl' : this.settings.state.ttl, 'sec' : +(new Date()) };
			$.vakata.storage.set(this.settings.state.key, JSON.stringify(st));
		};
		/**
		 * restore the state from the user's computer
		 * @name restore_state()
		 * @plugin state
		 */
		this.restore_state = function () {
			var k = $.vakata.storage.get(this.settings.state.key);
			if(!!k) { try { k = JSON.parse(k); } catch(ex) { return false; } }
			if(!!k && k.ttl && k.sec && +(new Date()) - k.sec > k.ttl) { return false; }
			if(!!k && k.state) { k = k.state; }
			if(!!k && $.isFunction(this.settings.state.filter)) { k = this.settings.state.filter.call(this, k); }
			if(!!k) {
				this.element.one("set_state.jstree", function (e, data) { data.instance.trigger('restore_state', { 'state' : $.extend(true, {}, k) }); });
				this.set_state(k);
				return true;
			}
			return false;
		};
		/**
		 * clear the state on the user's computer
		 * @name clear_state()
		 * @plugin state
		 */
		this.clear_state = function () {
			return $.vakata.storage.del(this.settings.state.key);
		};
	};

	(function ($, undefined) {
		$.vakata.storage = {
			// simply specifying the functions in FF throws an error
			set : function (key, val) { return window.localStorage.setItem(key, val); },
			get : function (key) { return window.localStorage.getItem(key); },
			del : function (key) { return window.localStorage.removeItem(key); }
		};
	}(jQuery));

	// include the state plugin by default
	// $.jstree.defaults.plugins.push("state");

/**
 * ### Types plugin
 *
 * Makes it possible to add predefined types for groups of nodes, which make it possible to easily control nesting rules and icon for each group.
 */

	/**
	 * An object storing all types as key value pairs, where the key is the type name and the value is an object that could contain following keys (all optional).
	 * 
	 * * `max_children` the maximum number of immediate children this node type can have. Do not specify or set to `-1` for unlimited.
	 * * `max_depth` the maximum number of nesting this node type can have. A value of `1` would mean that the node can have children, but no grandchildren. Do not specify or set to `-1` for unlimited.
	 * * `valid_children` an array of node type strings, that nodes of this type can have as children. Do not specify or set to `-1` for no limits.
	 * * `icon` a string - can be a path to an icon or a className, if using an image that is in the current directory use a `./` prefix, otherwise it will be detected as a class. Omit to use the default icon from your theme.
	 *
	 * There are two predefined types:
	 * 
	 * * `#` represents the root of the tree, for example `max_children` would control the maximum number of root nodes.
	 * * `default` represents the default node - any settings here will be applied to all nodes that do not have a type specified.
	 * 
	 * @name $.jstree.defaults.types
	 * @plugin types
	 */
	$.jstree.defaults.types = {
		'#' : {},
		'default' : {}
	};

	$.jstree.plugins.types = function (options, parent) {
		this.init = function (el, options) {
			var i, j;
			if(options && options.types && options.types['default']) {
				for(i in options.types) {
					if(i !== "default" && i !== "#" && options.types.hasOwnProperty(i)) {
						for(j in options.types['default']) {
							if(options.types['default'].hasOwnProperty(j) && options.types[i][j] === undefined) {
								options.types[i][j] = options.types['default'][j];
							}
						}
					}
				}
			}
			parent.init.call(this, el, options);
			this._model.data['#'].type = '#';
		};
		this.refresh = function (skip_loading) {
			parent.refresh.call(this, skip_loading);
			this._model.data['#'].type = '#';
		};
		this.bind = function () {
			this.element
				.on('model.jstree', $.proxy(function (e, data) {
						var m = this._model.data,
							dpc = data.nodes,
							t = this.settings.types,
							i, j, c = 'default';
						for(i = 0, j = dpc.length; i < j; i++) {
							c = 'default';
							if(m[dpc[i]].original && m[dpc[i]].original.type && t[m[dpc[i]].original.type]) {
								c = m[dpc[i]].original.type;
							}
							if(m[dpc[i]].data && m[dpc[i]].data.jstree && m[dpc[i]].data.jstree.type && t[m[dpc[i]].data.jstree.type]) {
								c = m[dpc[i]].data.jstree.type;
							}
							m[dpc[i]].type = c;
							if(m[dpc[i]].icon === true && t[c].icon !== undefined) {
								m[dpc[i]].icon = t[c].icon;
							}
						}
					}, this));
			parent.bind.call(this);
		};
		this.get_json = function (obj, options, flat) {
			var i, j,
				m = this._model.data,
				opt = options ? $.extend(true, {}, options, {no_id:false}) : {},
				tmp = parent.get_json.call(this, obj, opt, flat);
			if(tmp === false) { return false; }
			if($.isArray(tmp)) {
				for(i = 0, j = tmp.length; i < j; i++) {
					tmp[i].type = tmp[i].id && m[tmp[i].id] && m[tmp[i].id].type ? m[tmp[i].id].type : "default";
					if(options && options.no_id) {
						delete tmp[i].id;
						if(tmp[i].li_attr && tmp[i].li_attr.id) {
							delete tmp[i].li_attr.id;
						}
					}
				}
			}
			else {
				tmp.type = tmp.id && m[tmp.id] && m[tmp.id].type ? m[tmp.id].type : "default";
				if(options && options.no_id) {
					tmp = this._delete_ids(tmp);
				}
			}
			return tmp;
		};
		this._delete_ids = function (tmp) {
			if($.isArray(tmp)) {
				for(var i = 0, j = tmp.length; i < j; i++) {
					tmp[i] = this._delete_ids(tmp[i]);
				}
				return tmp;
			}
			delete tmp.id;
			if(tmp.li_attr && tmp.li_attr.id) {
				delete tmp.li_attr.id;
			}
			if(tmp.children && $.isArray(tmp.children)) {
				tmp.children = this._delete_ids(tmp.children);
			}
			return tmp;
		};
		this.check = function (chk, obj, par, pos, more) {
			if(parent.check.call(this, chk, obj, par, pos, more) === false) { return false; }
			obj = obj && obj.id ? obj : this.get_node(obj);
			par = par && par.id ? par : this.get_node(par);
			var m = obj && obj.id ? $.jstree.reference(obj.id) : null, tmp, d, i, j;
			m = m && m._model && m._model.data ? m._model.data : null;
			switch(chk) {
				case "create_node":
				case "move_node":
				case "copy_node":
					if(chk !== 'move_node' || $.inArray(obj.id, par.children) === -1) {
						tmp = this.get_rules(par);
						if(tmp.max_children !== undefined && tmp.max_children !== -1 && tmp.max_children === par.children.length) {
							this._data.core.last_error = { 'error' : 'check', 'plugin' : 'types', 'id' : 'types_01', 'reason' : 'max_children prevents function: ' + chk, 'data' : JSON.stringify({ 'chk' : chk, 'pos' : pos, 'obj' : obj && obj.id ? obj.id : false, 'par' : par && par.id ? par.id : false }) };
							return false;
						}
						if(tmp.valid_children !== undefined && tmp.valid_children !== -1 && $.inArray(obj.type, tmp.valid_children) === -1) {
							this._data.core.last_error = { 'error' : 'check', 'plugin' : 'types', 'id' : 'types_02', 'reason' : 'valid_children prevents function: ' + chk, 'data' : JSON.stringify({ 'chk' : chk, 'pos' : pos, 'obj' : obj && obj.id ? obj.id : false, 'par' : par && par.id ? par.id : false }) };
							return false;
						}
						if(m && obj.children_d && obj.parents) {
							d = 0;
							for(i = 0, j = obj.children_d.length; i < j; i++) {
								d = Math.max(d, m[obj.children_d[i]].parents.length);
							}
							d = d - obj.parents.length + 1;
						}
						if(d <= 0 || d === undefined) { d = 1; }
						do {
							if(tmp.max_depth !== undefined && tmp.max_depth !== -1 && tmp.max_depth < d) {
								this._data.core.last_error = { 'error' : 'check', 'plugin' : 'types', 'id' : 'types_03', 'reason' : 'max_depth prevents function: ' + chk, 'data' : JSON.stringify({ 'chk' : chk, 'pos' : pos, 'obj' : obj && obj.id ? obj.id : false, 'par' : par && par.id ? par.id : false }) };
								return false;
							}
							par = this.get_node(par.parent);
							tmp = this.get_rules(par);
							d++;
						} while(par);
					}
					break;
			}
			return true;
		};
		/**
		 * used to retrieve the type settings object for a node
		 * @name get_rules(obj)
		 * @param {mixed} obj the node to find the rules for
		 * @return {Object}
		 * @plugin types
		 */
		this.get_rules = function (obj) {
			obj = this.get_node(obj);
			if(!obj) { return false; }
			var tmp = this.get_type(obj, true);
			if(tmp.max_depth === undefined) { tmp.max_depth = -1; }
			if(tmp.max_children === undefined) { tmp.max_children = -1; }
			if(tmp.valid_children === undefined) { tmp.valid_children = -1; }
			return tmp;
		};
		/**
		 * used to retrieve the type string or settings object for a node
		 * @name get_type(obj [, rules])
		 * @param {mixed} obj the node to find the rules for
		 * @param {Boolean} rules if set to `true` instead of a string the settings object will be returned
		 * @return {String|Object}
		 * @plugin types
		 */
		this.get_type = function (obj, rules) {
			obj = this.get_node(obj);
			return (!obj) ? false : ( rules ? $.extend({ 'type' : obj.type }, this.settings.types[obj.type]) : obj.type);
		};
		/**
		 * used to change a node's type
		 * @name set_type(obj, type)
		 * @param {mixed} obj the node to change
		 * @param {String} type the new type
		 * @plugin types
		 */
		this.set_type = function (obj, type) {
			var t, t1, t2, old_type, old_icon;
			if($.isArray(obj)) {
				obj = obj.slice();
				for(t1 = 0, t2 = obj.length; t1 < t2; t1++) {
					this.set_type(obj[t1], type);
				}
				return true;
			}
			t = this.settings.types;
			obj = this.get_node(obj);
			if(!t[type] || !obj) { return false; }
			old_type = obj.type;
			old_icon = this.get_icon(obj);
			obj.type = type;
			if(old_icon === true || (t[old_type] && t[old_type].icon && old_icon === t[old_type].icon)) {
				this.set_icon(obj, t[type].icon !== undefined ? t[type].icon : true);
			}
			return true;
		};
	};
	// include the types plugin by default
	// $.jstree.defaults.plugins.push("types");

/**
 * ### Unique plugin
 *
 * Enforces that no nodes with the same name can coexist as siblings.
 */

	$.jstree.plugins.unique = function (options, parent) {
		this.check = function (chk, obj, par, pos, more) {
			if(parent.check.call(this, chk, obj, par, pos, more) === false) { return false; }
			obj = obj && obj.id ? obj : this.get_node(obj);
			par = par && par.id ? par : this.get_node(par);
			if(!par || !par.children) { return true; }
			var n = chk === "rename_node" ? pos : obj.text,
				c = [],
				m = this._model.data, i, j;
			for(i = 0, j = par.children.length; i < j; i++) {
				c.push(m[par.children[i]].text);
			}
			switch(chk) {
				case "delete_node":
					return true;
				case "rename_node":
				case "copy_node":
					i = ($.inArray(n, c) === -1);
					if(!i) {
						this._data.core.last_error = { 'error' : 'check', 'plugin' : 'unique', 'id' : 'unique_01', 'reason' : 'Child with name ' + n + ' already exists. Preventing: ' + chk, 'data' : JSON.stringify({ 'chk' : chk, 'pos' : pos, 'obj' : obj && obj.id ? obj.id : false, 'par' : par && par.id ? par.id : false }) };
					}
					return i;
				case "move_node":
					i = (obj.parent === par.id || $.inArray(n, c) === -1);
					if(!i) {
						this._data.core.last_error = { 'error' : 'check', 'plugin' : 'unique', 'id' : 'unique_01', 'reason' : 'Child with name ' + n + ' already exists. Preventing: ' + chk, 'data' : JSON.stringify({ 'chk' : chk, 'pos' : pos, 'obj' : obj && obj.id ? obj.id : false, 'par' : par && par.id ? par.id : false }) };
					}
					return i;
			}
			return true;
		};
	};

	// include the unique plugin by default
	// $.jstree.defaults.plugins.push("unique");


/**
 * ### Wholerow plugin
 *
 * Makes each node appear block level. Making selection easier. May cause slow down for large trees in old browsers.
 */

	var div = document.createElement('DIV');
	div.setAttribute('unselectable','on');
	div.className = 'jstree-wholerow';
	div.innerHTML = '&#160;';
	$.jstree.plugins.wholerow = function (options, parent) {
		this.bind = function () {
			parent.bind.call(this);

			this.element
				.on('loading', $.proxy(function () {
						div.style.height = this._data.core.li_height + 'px';
					}, this))
				.on('ready.jstree set_state.jstree', $.proxy(function () {
						this.hide_dots();
					}, this))
				.on("ready.jstree", $.proxy(function () {
						this.get_container_ul().addClass('jstree-wholerow-ul');
					}, this))
				.on("deselect_all.jstree", $.proxy(function (e, data) {
						this.element.find('.jstree-wholerow-clicked').removeClass('jstree-wholerow-clicked');
					}, this))
				.on("changed.jstree", $.proxy(function (e, data) {
						this.element.find('.jstree-wholerow-clicked').removeClass('jstree-wholerow-clicked');
						var tmp = false, i, j;
						for(i = 0, j = data.selected.length; i < j; i++) {
							tmp = this.get_node(data.selected[i], true);
							if(tmp && tmp.length) {
								tmp.children('.jstree-wholerow').addClass('jstree-wholerow-clicked');
							}
						}
					}, this))
				.on("open_node.jstree", $.proxy(function (e, data) {
						this.get_node(data.node, true).find('.jstree-clicked').parent().children('.jstree-wholerow').addClass('jstree-wholerow-clicked');
					}, this))
				.on("hover_node.jstree dehover_node.jstree", $.proxy(function (e, data) {
						this.get_node(data.node, true).children('.jstree-wholerow')[e.type === "hover_node"?"addClass":"removeClass"]('jstree-wholerow-hovered');
					}, this))
				.on("contextmenu.jstree", ".jstree-wholerow", $.proxy(function (e) {
						e.preventDefault();
						var tmp = $.Event('contextmenu', { metaKey : e.metaKey, ctrlKey : e.ctrlKey, altKey : e.altKey, shiftKey : e.shiftKey, pageX : e.pageX, pageY : e.pageY });
						$(e.currentTarget).closest("li").children("a:eq(0)").trigger(tmp);
					}, this))
				.on("click.jstree", ".jstree-wholerow", function (e) {
						e.stopImmediatePropagation();
						var tmp = $.Event('click', { metaKey : e.metaKey, ctrlKey : e.ctrlKey, altKey : e.altKey, shiftKey : e.shiftKey });
						$(e.currentTarget).closest("li").children("a:eq(0)").trigger(tmp).focus();
					})
				.on("click.jstree", ".jstree-leaf > .jstree-ocl", $.proxy(function (e) {
						e.stopImmediatePropagation();
						var tmp = $.Event('click', { metaKey : e.metaKey, ctrlKey : e.ctrlKey, altKey : e.altKey, shiftKey : e.shiftKey });
						$(e.currentTarget).closest("li").children("a:eq(0)").trigger(tmp).focus();
					}, this))
				.on("mouseover.jstree", ".jstree-wholerow, .jstree-icon", $.proxy(function (e) {
						e.stopImmediatePropagation();
						this.hover_node(e.currentTarget);
						return false;
					}, this))
				.on("mouseleave.jstree", ".jstree-node", $.proxy(function (e) {
						this.dehover_node(e.currentTarget);
					}, this));
		};
		this.teardown = function () {
			if(this.settings.wholerow) {
				this.element.find(".jstree-wholerow").remove();
			}
			parent.teardown.call(this);
		};
		this.redraw_node = function(obj, deep, callback) {
			obj = parent.redraw_node.call(this, obj, deep, callback);
			if(obj) {
				var tmp = div.cloneNode(true);
				//tmp.style.height = this._data.core.li_height + 'px';
				if($.inArray(obj.id, this._data.core.selected) !== -1) { tmp.className += ' jstree-wholerow-clicked'; }
				obj.insertBefore(tmp, obj.childNodes[0]);
			}
			return obj;
		};
	};
	// include the wholerow plugin by default
	// $.jstree.defaults.plugins.push("wholerow");

});
///#source 1 1 /Forerunner/Dashboard/js/DashboardEZ.js
// Assign or create the single globally scoped variable
var forerunner = forerunner || {};

// Forerunner SQL Server Reports
forerunner.ssr = forerunner.ssr || {};

$(function () {
    var widgets = forerunner.ssr.constants.widgets;
    var dtb = forerunner.ssr.tools.dashboardToolbar;
    var dtp = forerunner.ssr.tools.dashboardToolPane;
    var tg = forerunner.ssr.tools.groups;

    /**
    * Widget used to create and edit dashboards
    *
    * @namespace $.forerunner.dashboardEZ
    * @prop {Object} options - The options
    * @prop {Object} options.DefaultAppTemplate -- The helper class that creates the app template.
    * @prop {Object} options.parentFolder - Fully qualified URL of the parent folder
    * @prop {Object} options.navigateTo - Callback function used to navigate to a path and view
    * @prop {Object} options.historyBack - Callback function used to go back in browsing history
    * @prop {Boolean} options.isFullScreen - A flag to determine whether show report viewer in full screen. Default to true.
    * @prop {Boolean} options.isReportManager - A flag to determine whether we should render report manager integration items.  Defaults to false.
    * @prop {Boolean} options.enableEdit - Enable the dashboard for create and / or editing. Default to true.
    * @prop {String} options.rsInstance - Optional, Report service instance name
    * @prop {String} options.rsInstance - Optional, User specific options
    *
    * @example
    * $("#dashboardEZId").dashboardEZ({
    * });
    */
    $.widget(widgets.getFullname(widgets.dashboardEZ), {
        options: {
            DefaultAppTemplate: null,
            navigateTo: null,
            historyBack: null,
            isFullScreen: true,
            isReportManager: false,
            enableEdit: true,
            rsInstance: null,
            userSettings: null,
            path: null
        },
        /**
         * Returns the user settings
         *
         * @function $.forerunner.dashboardEZ#getUserSettings
         */
        getUserSettings: function () {
            var me = this;
            return me.options.userSettings;
        },
        /**
         * Show the edit or view UI
         *
         * @function $.forerunner.dashboardEZ#enableEdit
         * @param {bool} enableEdit - true = enable, false = view
         */
        enableEdit: function (enableEdit) {
            var me = this;
            me.options.enableEdit = enableEdit;

            // Set the tools to the correct edit mode
            me.$toolbar.dashboardToolbar("enableEdit", enableEdit);
            me.$toolpane.dashboardToolPane("enableEdit", enableEdit);

            var $dashboardEditor = me.getDashboardEditor();
            $dashboardEditor.dashboardEditor("openDashboard", null, enableEdit);
        },
        _init: function () {
            var me = this;
            me._super();

            if (me.options.DefaultAppTemplate === null) {
                me.layout = new forerunner.ssr.DefaultAppTemplate({ $container: me.element, isFullScreen: me.options.isFullScreen }).render();
            } else {
                me.layout = me.options.DefaultAppTemplate;
            }

            me._checkPermission();

            forerunner.device.allowZoom(false);
            me.layout.$mainsection.html(null);

            me.$dashboardContainer = $("<div class='fr-dashboard'></div>");
            me.layout.$mainsection.append(me.$dashboardContainer);
            me.$dashboardContainer.dashboardEditor({
                $appContainer: me.layout.$container,
                navigateTo: me.options.navigateTo,
                historyBack: me.options.historyBack,
                rsInstance: me.options.rsInstance
            });

            me.$toolbar = me.layout.$mainheadersection;
            me.$toolbar.dashboardToolbar({
                navigateTo: me.options.navigateTo,
                $appContainer: me.layout.$container,
                $dashboardEZ: me.element,
                $dashboardEditor: me.getDashboardEditor(),
                enableEdit: me.options.enableEdit
            });

            var $lefttoolbar = me.layout.$leftheader;
            if ($lefttoolbar !== null) {
                $lefttoolbar.leftToolbar({ $appContainer: me.layout.$container });
            }

            me.$toolpane = me.layout.$leftpanecontent;
            me.$toolpane.dashboardToolPane({
                navigateTo: me.options.navigateTo,
                $appContainer: me.layout.$container,
                $dashboardEZ: me.element,
                $dashboardEditor: me.getDashboardEditor(),
                enableEdit: me.options.enableEdit
            });

            if (me.options.isReportManager) {
                var listOfButtons = [];

                if (forerunner.config.getCustomSettingsValue("showHomeButton") === "on") {
                    listOfButtons.push(dtb.btnHome);
                }
                listOfButtons.push(dtb.btnRecent, dtb.btnFavorite);

                if (forerunner.ajax.isFormsAuth()) {
                    listOfButtons.push(dtb.btnLogOff);
                }
                me.$toolbar.dashboardToolbar("addTools", 4, true, listOfButtons);
                me.$toolpane.dashboardToolPane("addTools", 1, true, [dtp.itemFolders, tg.dashboardItemFolderGroup]);
            }

            if (me.options.historyBack) {
                me.$toolbar.dashboardToolbar("addTools", 2, true, [dtb.btnBack]);
                me.$toolpane.dashboardToolPane("addTools", 3, true, [dtp.itemBack]);
            }

            me.layout.$rightheaderspacer.height(me.layout.$topdiv.height());
            me.layout.$leftheaderspacer.height(me.layout.$topdiv.height());
        },
        _checkPermission: function () {
            var me = this;
            //Update Content: update resource content (dashboard)
            //for more properties, add to the list
            var permissionList = ["Update Content"];
            me.permissions = forerunner.ajax.hasPermission(me.options.path, permissionList.join(","));
        },
        /**
         * Get current path user permission
         *
         * @function $.forerunner.dashboardEZ#getPermission
         * 
         * @return {Object} - permission jQuery object
         */
        getPermission: function () {
            var me = this;
            return me.permissions;
        },
        /**
         * Get dashboard editor
         *
         * @function $.forerunner.dashboardEZ#getDashboardEditor
         * 
         * @return {Object} - dashboard editor jQuery object
         */
        getDashboardEditor: function () {
            var me = this;

            if (me.layout) {
                var $dashboard = me.layout.$mainsection.find(".fr-dashboard");
                if ($dashboard.length !== 0) {
                    return $dashboard;
                }
            }

            return null;
        },
        /**
         * Get report viewer toolbar
         *
         * @function $.forerunner.dashboardEZ#getToolbar
         * 
         * @return {Object} - toolbar jQuery object
         */
        getToolbar: function () {
            var me = this;
            if (me.layout) {
                return me.layout.$mainheadersection;
            }

            return null;
        },
        /**
         * Get report viewer toolpane
         *
         * @function $.forerunner.dashboardEZ#getToolPane
         * 
         * @return {Object} - toolpane jQuery object
         */
        getToolPane: function () {
            var me = this;
            if (me.layout) {
                return me.layout.$leftpanecontent;
            }

            return null;
        },
    });  // $.widget

});  // function()

///#source 1 1 /Forerunner/Dashboard/js/DashboardToolbar.js
/**
 * @file Contains the toolbar widget.
 *
 */

var forerunner = forerunner || {};
forerunner.ssr = forerunner.ssr || {};
forerunner.ssr.tools = forerunner.ssr.tools || {};
forerunner.ssr.tools.toolbar = forerunner.ssr.tools.dashboardToolbar || {};

$(function () {
    // Useful namespaces
    var widgets = forerunner.ssr.constants.widgets;
    var events = forerunner.ssr.constants.events;
    var dtb = forerunner.ssr.tools.dashboardToolbar;
    var locData = forerunner.localize.getLocData(forerunner.config.forerunnerFolder() + "ReportViewer/loc/ReportViewer");

    /**
     * Toobar widget used by the dashboard
     *
     * @namespace $.forerunner.dashboardToolbar
     * @prop {Object} options - The options
     * @prop {Object} options.navigateTo - Callback function used to navigate to a path and view
     * @prop {Object} options.$appContainer - Container for the dashboardEditor widget
     * @prop {Object} options.$dashboardEZ - dashboardEZ widget
     * @prop {Boolean} options.enableEdit - Enable the dashboard for create and / or editing. Default to true.
     * @prop {String} options.toolClass - The top level class for this tool (E.g., fr-dashboard-toolbar)
     * @example
     * $("#dashboardToolbarId").dashboardToolbar({
     *      navigateTo: me.options.navigateTo,
     *      $appContainer: layout.$container,
     *      $dashboardEZ: me.dashboardEZ,
     *      enableEdit: me.options.enableEdit
     * });
     *
     * Note:
     *  Toolbar can be extended by calling the addTools method defined by {@link $.forerunner.toolBase}
     */
    $.widget(widgets.getFullname(widgets.dashboardToolbar), $.forerunner.toolBase, /** @lends $.forerunner.toolbar */ {
        options: {
            navigateTo: null,
            $appContainer: null,
            $dashboardEZ: null,
            enableEdit: true,
            toolClass: "fr-dashboard-toolbar"
        },
        /**
         * Show the edit or view UI
         *
         * @function $.forerunner.dashboardToolbar#enableEdit
         * @param {bool} enableEdit - true = enable, false = view
         */
        enableEdit: function (enableEdit) {
            var me = this;

            me.hideTool(dtb.btnEdit.selectorClass);
            me.hideTool(dtb.btnView.selectorClass);

            if (!me._isAdmin()) {
                return;
            }

            if (!enableEdit) {
                var $dashboardEditor = me.options.$dashboardEZ.dashboardEZ("getDashboardEditor");
                var path = $dashboardEditor.dashboardEditor("getPath");

                if (path) {
                    var permissions = me.options.$dashboardEZ.dashboardEZ("getPermission");
                    if (permissions["Update Content"] === true) {
                        // If the user has update resource permission for this dashboard, we will enable the edit button
                        me.showTool(dtb.btnEdit.selectorClass);
                        return;
                    }
                }
            } else {
                me.showTool(dtb.btnView.selectorClass);
            }
        },
        _isAdmin: function () {
            var me = this;
            var userSettings = me.options.$dashboardEZ.dashboardEZ("getUserSettings");
            if (userSettings && userSettings.adminUI && userSettings.adminUI === true) {
                return true;
            }
            return false;
        },
        _init: function () {
            var me = this;
            me._super(); //Invokes the method of the same name from the parent widget

            me.element.html("<div class='" + me.options.toolClass + " fr-core-toolbar fr-core-widget'/>");
            me.removeAllTools();

            me.addTools(1, true, [dtb.btnMenu, dtb.btnEdit, dtb.btnView]);
            me.enableEdit(me.options.enableEdit);

            //trigger window resize event to regulate toolbar buttons visibility
            $(window).resize();
        },
        _destroy: function () {
        },
        _create: function () {
            var me = this;
            $(window).resize(function () {
                me.onWindowResize.call(me);
            });
        },
    });  // $.widget
});  // function()

///#source 1 1 /Forerunner/Dashboard/js/DashboardToolPane.js
/**
 * @file Contains the toolPane widget.
 *
 */

var forerunner = forerunner || {};
forerunner.ssr = forerunner.ssr || {};

$(function () {
    var widgets = forerunner.ssr.constants.widgets;
    var events = forerunner.ssr.constants.events;
    var dbtp = forerunner.ssr.tools.dashboardToolPane;
    var locData = forerunner.localize.getLocData(forerunner.config.forerunnerFolder() + "ReportViewer/loc/ReportViewer");

    /**
     * ToolPane widget used with the dashboard
     *
     * @namespace $.forerunner.dashboardToolPane
     * @prop {Object} options.navigateTo - Callback function used to navigate to a path and view
     * @prop {Object} options.$appContainer - Container for the dashboardEditor widget
     * @prop {Object} options.$dashboardEZ - dashboardEZ widget
     * @prop {Boolean} options.enableEdit - Enable the dashboard for create and / or editing. Default to true.
     * @prop {String} options.toolClass - The top level class for this tool (E.g., fr-dashboard-toolpane)
     * @example
     * $("#dashboardToolPaneId").dashboardToolPane({
     * });
     *
     * Note:
     *  ToolPane can be extended by calling the addTools method defined by {@link $.forerunner.toolBase}
     */
    $.widget(widgets.getFullname(widgets.dashboardToolPane), $.forerunner.toolBase, {
        options: {
            navigateTo: null,
            $appContainer: null,
            $dashboardEZ: null,
            enableEdit: true,
            toolClass: "fr-dashboard-toolpane"
        },
        /**
         * Show the edit or view UI
         *
         * @function $.forerunner.dashboardToolPane#enableEdit
         * @param {bool} enableEdit - true = enable, false = view
         */
        enableEdit: function (enableEdit) {
            var me = this;

            me.hideTool(dbtp.itemEdit.selectorClass);
            me.hideTool(dbtp.itemView.selectorClass);

            if (!me._isAdmin()) {
                return;
            }

            if (!enableEdit) {
                var $dashboardEditor = me.options.$dashboardEZ.dashboardEZ("getDashboardEditor");
                var path = $dashboardEditor.dashboardEditor("getPath");

                if (path) {
                    var permissions = me.options.$dashboardEZ.dashboardEZ("getPermission");
                    if (permissions["Update Content"] === true) {
                        // If the user has update resource permission for this dashboard, we will enable the edit button
                        me.showTool(dbtp.itemEdit.selectorClass);
                        return;
                    }
                }
            } else {
                me.showTool(dbtp.itemView.selectorClass);
            }
        },
        _isAdmin: function () {
            var me = this;
            var userSettings = me.options.$dashboardEZ.dashboardEZ("getUserSettings");
            if (userSettings && userSettings.adminUI && userSettings.adminUI === true) {
                return true;
            }
            return false;
        },
        _init: function () {
            var me = this;
            me._super();

            me.element.html("<div class='" + me.options.toolClass + " fr-core-widget' />");
            me.removeAllTools();

            me.addTools(2, true, [dbtp.itemEdit, dbtp.itemView]);
            me.enableEdit(me.options.enableEdit);
            
            var $spacerdiv = new $("<div />");
            $spacerdiv.attr("style", "height:65px");
            me.element.append($spacerdiv);
        },
    });  // $.widget
});  // function()

///#source 1 1 /Forerunner/Dashboard/js/DashboardViewer.js
/**
 * @file Contains the dashboardViewer widget.
 *
 */

var forerunner = forerunner || {};
forerunner.ssr = forerunner.ssr || {};

$(function () {
    var constants = forerunner.ssr.constants;
    var widgets = constants.widgets;
    var events = constants.events;
    var locData = forerunner.localize.getLocData(forerunner.config.forerunnerFolder() + "ReportViewer/loc/ReportViewer");
    var toolbar = locData.toolbar;
    var messages = locData.messages;

    /**
     * Widget used to view dashboards
     *
     * @namespace $.forerunner.dashboardViewer
     * @prop {Object} options - The options for dashboardViewer
     * @prop {Object} options.$appContainer - Dashboard container
     * @prop {Object} options.navigateTo - Optional, Callback function used to navigate to a selected report
     * @prop {Object} options.historyBack - Optional,Callback function used to go back in browsing history
     * @prop {String} options.reportManagerAPI - Optional, Path to the REST calls for the reportManager
     * @prop {String} options.rsInstance - Optional, Report service instance name
     */
    $.widget(widgets.getFullname(widgets.dashboardViewer), {
        options: {
            $appContainer: null,
            navigateTo: null,
            historyBack: null,
            reportManagerAPI: forerunner.config.forerunnerAPIBase() + "ReportManager/",
            rsInstance: null
        },
        _create: function () {
            var me = this;
            me.model = new forerunner.ssr.DashboardModel({
                $appContainer: me.options.$appContainer,
                reportManagerAPI: me.options.reportManagerAPI,
                rsInstance: me.options.rsInstance
            });

            // For the viewer widget alone, this will always stay false
            me.enableEdit = false;

            $(window).on("resize", function (e, data) {
                me._onWindowResize.apply(me, arguments);
            });
        },
        _setWidths: function (width) {
            var updated = false;
            $.each(arguments, function (index, item) {
                if (index > 0 && item.css && item.css("width") !== width) {
                    updated = true;
                    item.css("width", width);
                }
            });
            return updated;
        },
        _timerId: null,
        _onWindowResize: function () {
            var me = this;

            // If we get back here before the timer fires
            if (me._timerId) {
                clearTimeout(me._timerId);
                me._timerId = null;
            }

            var maxResponsiveRes = forerunner.config.getCustomSettingsValue("MaxResponsiveResolution", 1280);
            var userSettings = forerunner.ajax.getUserSetting(me.options.rsInstance);

            me._timerId = setTimeout(function () {
                var isResponsive = userSettings.responsiveUI && $(window).width() < maxResponsiveRes && !me.enableEdit;
                var updated = false;
                me.element.find(".fr-dashboard-report-id").each(function (index, item) {
                    var $item = $(item);
                    var currentStyle = $item.css("display");

                    if (isResponsive) {
                        // Set the dispay on the report container element to inline-block
                        if (currentStyle !== "inline-block") {
                            $item.css("display", "inline-block");
                            updated = true;
                        }

                        if (me.element.width() < $item.width()) {
                            // Set the width of the report <div> to the viewer width
                            updated = me._setWidths(me.element.width(), $item);
                        } else {
                            // Remove any explicit width
                            updated = me._setWidths("", $item);
                        }
                    } else {
                        // Remove any explicit width
                        updated = me._setWidths("", $item);

                        if (currentStyle) {
                            // Remove any explicitly set display and default back to whatever the template designer wanted
                            $item.css("display", "");
                            updated = true;
                        }
                    }
                });
                if (updated) {
                    // Need this to refresh the viewer to see the changes
                    me.element.hide().show(0);
                }
                me._timerId = null;
            }, 100);
        },
        _init: function () {
            var me = this;
            me.model.clearState();
            me.element.html("");
        },
        /**
         * Loads the given dashboard definition and opens
         *
         * @function $.forerunner.dashboardEditor#loadDefinition
         * @param {String} path - Fully qualified path to the dashboard
         * @param {Bool} hideMissing - True = hide report slots that don't have a report assigned
         */
        loadDefinition: function (path, hideMissing) {
            var me = this;

            // Clear the html in case of an error
            me.element.html("");

            if (path) {
                // Load the given report definition
                var loaded = me._loadResource(path);
                if (!loaded) {
                    return;
                }
            }

            // Render the template and load the reports
            me.element.html(me.model.dashboardDef.template);
            me.element.find(".fr-dashboard-report-id").each(function (index, item) {
                me._loadReport(item.id, hideMissing);
            });
        },
        getParentFolder: function () {
            var me = this;
            return me.parentFolder;
        },
        getDashboardName: function () {
            var me = this;
            return me.dashboardName;
        },
        getReportProperties: function (reportId) {
            var me = this;
            if (!me.model.dashboardDef.reports[reportId]) {
                me.model.dashboardDef.reports[reportId] = {};
            }
            return me.model.dashboardDef.reports[reportId];
        },
        setReportProperties: function (reportId, properties) {
            var me = this;
            var reportProperties = me.getReportProperties(reportId);
            $.extend(reportProperties, properties);
        },
        _loadReport: function (reportId, hideMissing) {
            var me = this;
            var reportProperties = me.getReportProperties(reportId);

            var $item = me.element.find("#" + reportId);
            $item.css("display", "");

            $item.html("");

            // If we have a report definition, load the report
            if (reportProperties && reportProperties.catalogItem) {
                $item.reportViewerEZ({
                    navigateTo: me.options.navigateTo,
                    historyBack: null,
                    isReportManager: false,
                    isFullScreen: false,
                    userSettings: forerunner.ajax.getUserSetting(),
                    toolbarConfigOption: me.enableEdit ? constants.toolbarConfigOption.dashboardEdit : reportProperties.toolbarConfigOption
                });

                var $reportViewer = $item.reportViewerEZ("getReportViewer");

                $reportViewer.one(events.reportViewerAfterLoadReport(), function (e, data) {
                    data.reportId = reportId;
                    data.$reportViewer = $reportViewer;
                    me._onAfterReportLoaded.apply(me, arguments);
                });

                var catalogItem = reportProperties.catalogItem;
                var parameters = reportProperties.parameters;
                $reportViewer.reportViewer("loadReport", catalogItem.Path, 1, parameters);

                // We catch this event so as to auto save when the user changes parameters
                var $reportParameter = $item.reportViewerEZ("getReportParameter");
                $reportParameter.one(events.reportParameterSubmit(), function (e, data) {
                    me._onReportParameterSubmit.apply(me, arguments);
                });
            } else if (hideMissing) {
                $item.css("display", "none");
            }
        },
        _onReportParameterSubmit: function (e, data) {
            // Meant to be overridden in the dashboard editor widget
        },
        _onAfterReportLoaded: function (e, data) {
            if (data.$reportViewer) {
                data.$reportViewer.reportViewer("reLayout");
            }
        },
        _loadResource: function (path) {
            var me = this;
            var status = false;

            // Set the parent folder and dashboard name properties
            me.dashboardName = forerunner.helper.getCurrentItemName(path);
            me.parentFolder = forerunner.helper.getParentPath(path);
            if (!me.parentFolder) {
                me.parentFolder = "/";
            }


            // Fetch the model from the server
            return me.model.fetch(path);
        },
        _destroy: function () {
        },
    });  // $.widget
});   // $(function



///#source 1 1 /Forerunner/Dashboard/js/DashboardEditor.js
/**
 * @file Contains the reportViewer widget.
 *
 */

var forerunner = forerunner || {};
forerunner.ssr = forerunner.ssr || {};

$(function () {
    var widgets = forerunner.ssr.constants.widgets;
    var events = forerunner.ssr.constants.events;
    var locData = forerunner.localize.getLocData(forerunner.config.forerunnerFolder() + "ReportViewer/loc/ReportViewer");
    var toolbar = locData.toolbar;
    var messages =locData.messages;
    var timeout = forerunner.device.isWindowsPhone() ? 500 : forerunner.device.isTouch() ? 50 : 50;

    /**
     * Widget used to create and edit dashboards
     *
     * @namespace $.forerunner.dashboardEditor
     */
    $.widget(widgets.getFullname(widgets.dashboardEditor), $.forerunner.dashboardViewer /** @lends $.forerunner.dashboardEditor */, {
        options: {
        },
        /**
         * Opens the given dashboard definition for editing or viewing
         *
         * @function $.forerunner.dashboardEditor#editDashboard
         * @param {String} path - Fully qualified path to the dashboard
         * @param {Bool} enableEdit - True = display the dashboard in edit mode, False = view mode
         */
        openDashboard: function (path, enableEdit) {
            var me = this;

            me.enableEdit = enableEdit;
            if (enableEdit) {
                setTimeout(function () {
                    me.loadDefinition(path, false);
                    me._showUI(true);
                }, timeout);
            } else {
                me.loadDefinition(path, true);
            }
        },
        /**
         * Returns the fully qualified dashboard path
         * @function $.forerunner.dashboardEditor#getPath
         */
        getPath: function () {
            var me = this;
            if (!me.parentFolder || !me.dashboardName) {
                return null;
            }

            return me.parentFolder + me.dashboardName;
        },
        _save: function (overwrite) {
            var me = this;

            // Extract and save any / all parameter definitions
            var $reportContainers = me.element.find(".fr-dashboard-report-id");
            $reportContainers.each(function (index, item) {
                var reportId = item.id;
                var $item = $(item);

                if (me._hasReport($item)) {
                    var reportProperties = me.getReportProperties(reportId);
                    reportProperties.parameters = null;

                    // If we have a reportVewerEZ attached then get and save the parameter list
                    var $reportParameter = $item.reportViewerEZ("getReportParameter");
                    if (widgets.hasWidget($reportParameter, widgets.reportParameter)) {
                        var numOfVisibleParameters = $reportParameter.reportParameter("getNumOfVisibleParameters");
                        if (numOfVisibleParameters > 0) {
                            reportProperties.parameters = $reportParameter.reportParameter("getParamsList", true);
                        }
                    }
                }
            });

            // Save the model
            if (!me.model.save(overwrite, me.parentFolder, me.dashboardName)) {
                forerunner.dialog.showMessageBox(me.options.$appContainer, messages.saveDashboardFailed, toolbar.saveDashboard);
            }
        },
        _onReportParameterSubmit: function (e, data) {
            var me = this;
            if (me.enableEdit === true) {
                me._save(true);
            }
        },
        _onAfterReportLoaded: function (e, data) {
            var me = this;
            me._super(e, data);
            me._showUI(me.enableEdit);
        },
        _onClickProperties: function (e) {
            var me = this;
            var $dlg = me.options.$appContainer.find(".fr-rp-section");
            if ($dlg.length === 0) {
                $dlg = $("<div class='fr-rp-section fr-dialog-id fr-core-dialog-layout fr-core-widget'/>");
                me.options.$appContainer.append($dlg);
                $dlg.on(events.reportPropertiesClose(), function (e, data) {
                    me._onReportPropertiesClose.apply(me, arguments);
                });
            }
            $dlg.reportProperties({
                reportManagerAPI: me.options.reportManagerAPI,
                $appContainer: me.options.$appContainer,
                $dashboardEditor: me,
                reportId: e.target.name
            });
            $dlg.reportProperties("openDialog");
        },
        _onReportPropertiesClose: function (e, data) {
            var me = this;
            if (!data.isSubmit) {
                // Wasn't a submit so just return
                return;
            }

            setTimeout(function () {
                // Load the given report
                me._loadReport(data.reportId, false);
                me._renderButtons();
                me._makeOpaque(true);
            }, timeout);

            me._save(true);
        },
        _showUI: function (show) {
            var me = this;
            if (show) {
                me._renderButtons();
            } else {
                me._removeButtons();
            }
            me._makeOpaque(show);
        },
        _renderButtons: function () {
            var me = this;
            me._removeButtons();
            me.element.find(".fr-dashboard-report-id").each(function (index, item) {
                me._renderButton(item);
            });
        },
        _hasReport: function ($item) {
            return widgets.hasWidget($item, widgets.reportViewerEZ);
        },
        _renderButton: function (item) {
            var me = this;
            var $item = $(item);

            if (me._hasReport($item)){
                // Use the reort height
                $item.height("");
            } else {
                // Put in a default height until a report is loaded
                $item.height("480px");
            }

            // Create the button
            var $btn = $("<input type=button class='fr-dashboard-btn' name='" + item.id + "'/>");
            $item.append($btn);

            // Hook the onClick event
            $btn.on("click", function (e) {
                me._onClickProperties.apply(me, arguments);
            });

            // Position the button
            var left = $item.width() / 2 - ($btn.width() / 2);
            var top = $item.height() / 2 - ($btn.height() / 2);
            $btn.css({ position: "absolute", left: left + "px", top: top + "px" });
        },
        _removeButtons: function () {
            var me = this;
            me.element.find(".fr-dashboard-btn").remove();
        },
        _makeOpaque: function (addMask) {
            var me = this;
            if (addMask) {
                me.element.find(".fr-report-container").addClass("fr-dashboard-mask");
            } else {
                me.element.find(".fr-report-container").removeClass("fr-dashboard-mask");
            }
        },
        _create: function () {
            var me = this;
            me._super();
        },
        _init: function () {
            var me = this;
            me._super();
        },
        _destroy: function () {
        }
    });  // $.widget
});   // $(function

///#source 1 1 /Forerunner/Dashboard/js/ReportProperties.js
/**
 * @file Contains the reportProperties widget.
 *
 */

// Assign or create the single globally scoped variable
var forerunner = forerunner || {};

// Forerunner SQL Server Reports
forerunner.ssr = forerunner.ssr || {};

$(function () {
    var constants = forerunner.ssr.constants;
    var widgets = constants.widgets;
    var events = constants.events;
    var locData = forerunner.localize.getLocData(forerunner.config.forerunnerFolder() + "ReportViewer/loc/ReportViewer");
    var reportProperties = locData.reportProperties;

    /**
     * Widget used to select a new dashbard template
     *
     * @namespace $.forerunner.createDashboard
     * @prop {Object} options - The options for the create dashboard dialog
     * @prop {String} options.reportManagerAPI - Path to the REST calls for the reportManager
     * @prop {Object} options.$appContainer - Dashboard container
     * @prop {Object} options.$dashboardEditor - Dashboard Editor widget
     * @prop {Object} options.reportId - Target Report Id
     *
     * @example
     * $("#reportPropertiesDialog").reportProperties({
     *      reportManagerAPI: me.options.reportManagerAPI,
     *      $appContainer: me.options.$appContainer,
     *      $dashboardEditor: me,
     *      reportId: e.target.name
     * });
     */
    $.widget(widgets.getFullname(widgets.reportProperties), {
        options: {
            reportManagerAPI: null,
            $appContainer: null,
            $dashboardEditor: null,
            reportId: null
        },
        _setCheckbox: function (setting, $e) {
            if (setting === true) {
                $e.prop("checked", true);
            } else {
                $e.prop("checked", false);
            }
        },
        _init: function () {
            var me = this;

            me.properties = me.options.$dashboardEditor.getReportProperties(me.options.reportId) || {};

            // Open the top level nodes and deselect any previous selection
            me.$tree.jstree("close_all");
            me.$tree.jstree("open_node", "j1_1");
            me.$tree.jstree("deselect_all", true);

            // Restore the report name
            if (me.properties.catalogItem &&
                me.properties.catalogItem.Name) {
                me.$reportInput.val(me.properties.catalogItem.Name);
            } else {
                me.$reportInput.val("");
            }

            // Restore the toolbar option checkboxes
            me._setCheckbox(false, me.$hideToolbar);
            me._setCheckbox(false, me.$minimalToolbar);
            me._setCheckbox(false, me.$fullToolbar);

            if (me.properties.toolbarConfigOption) {
                if (me.properties.toolbarConfigOption === constants.toolbarConfigOption.hide) {
                    me._setCheckbox(true, me.$hideToolbar);
                } else if (me.properties.toolbarConfigOption === constants.toolbarConfigOption.minimal) {
                    me._setCheckbox(true, me.$minimalToolbar);
                } else {
                    me._setCheckbox(true, me.$fullToolbar);
                }
            } else {
                me._setCheckbox(true, me.$hideToolbar);
            }

            // Make sure the popup is hidden
            me.$popup.addClass("fr-core-hidden");

            me._resetValidateMessage();

            // Setup the report selector UI
            var JSData = me._createJSData("/");
            me.$tree.jstree({
                core: {
                    data: JSData
                }
            });
        },
        _createJSData: function (path) {
            var me = this;
            var nodeTree = {
                text: path,
                state: {
                    opened: true
                },
                children: []
            };
            me._createTreeItems(nodeTree, "catalog", path);
            return [nodeTree];
        },
        _createTreeItems: function (curNode, view, path) {
            var me = this;
            var items = me._getItems(view, path);
            $.each(items, function (index, item) {
                var newNode = {
                    text: item.Name,
                    li_attr: {
                        dataCatalogItem: item
                    },
                    children: []
                };
                if (item.Type === me._itemType.folder) {
                    curNode.children.push(newNode);
                    me._createTreeItems(newNode, view, item.Path);
                } else if (item.Type === me._itemType.report) {
                    curNode.children.push(newNode);
                    newNode.icon = "jstree-file";
                    newNode.li_attr.dataReport = true;
                }
            });
        },
        _create: function () {
            var me = this;

            me.element.html("");
            me.element.off(events.modalDialogGenericSubmit);
            me.element.off(events.modalDialogGenericCancel);

            var headerHtml = forerunner.dialog.getModalDialogHeaderHtml("fr-rp-icon-edit", reportProperties.title, "fr-rp-cancel", "");
            var $dialog = $(
                "<div class='fr-core-dialog-innerPage fr-core-center'>" +
                    headerHtml +
                    "<form class='fr-rp-form fr-core-dialog-form'>" +
                        "<input name='add' type='button' value='" + reportProperties.removeReport + "' title='" + reportProperties.removeReport + "' class='fr-rp-remove-report-id fr-rp-action-button fr-core-dialog-button'/>" +
                        // Dropdown container
                        "<div class='fr-rp-dropdown-container'>" +
                            "<input type='text' autofocus='autofocus' placeholder='" + reportProperties.selectReport + "' class='fr-rp-report-input-id fr-rp-text-input fr-core-input fr-core-cursorpointer' readonly='readonly' allowblank='false' nullable='false'/><span class='fr-rp-error-span'/>" +
                            "<div class='fr-rp-dropdown-iconcontainer fr-core-cursorpointer'>" +
                                "<div class='fr-rp-dropdown-icon'></div>" +
                            "</div>" +
                        "</div>" +
                        // Popup container
                        "<div class='fr-rp-popup-container fr-core-hidden'>" +
                            "<div class='fr-report-tree-id fr-rp-tree-container'></div>" +
                        "</div>" +
                        // Toolbar options
                        "<table>" +
                            "<tr>" +
                                "<td>" +
                                    "<h3>" +
                                        "<label class='fr-rp-label fr-rp-section-separator'>" + reportProperties.toolbar + "</label>" +
                                    "</h3>" +
                                "</td>" +
                            "</tr>" +
                                "<td>" +
                                    "<label class='fr-rp-label fr-rp-separator'>" + reportProperties.hideToolbar + "</label>" +
                                    "<input class='fr-rp-hide-toolbar-id fr-rp-checkbox' name='hideToolbar' type='checkbox'/>" +
                                "</td>" +
                                "<td>" +
                                    "<label class='fr-rp-label fr-rp-separator'>" + reportProperties.minimal + "</label>" +
                                    "<input class='fr-rp-minimal-toolbar-id fr-rp-checkbox' name='hideToolbar' type='checkbox'/>" +
                                "</td>" +
                                "<td>" +
                                    "<label class='fr-rp-label fr-rp-separator'>" + reportProperties.full + "</label>" +
                                    "<input class='fr-rp-full-toolbar-id fr-rp-checkbox' name='hideToolbar' type='checkbox'/>" +
                                "</td>" +
                            "<tr>" +
                        "</table>" +
                        // Submit conatiner
                        "<div class='fr-core-dialog-submit-container'>" +
                            "<div class='fr-core-center'>" +
                                "<input name='submit' type='button' class='fr-rp-submit-id fr-core-dialog-submit fr-core-dialog-button' value='" + reportProperties.submit + "' />" +
                            "</div>" +
                        "</div>" +
                    "</form>" +
                "</div>");

            me.element.append($dialog);

            me.$form = me.element.find(".fr-rp-form");
            me._validateForm(me.$form);

            me.$dropdown = me.element.find(".fr-rp-dropdown-container");
            me.$dropdown.on("click", function (e) {
                me._onClickTreeDropdown.apply(me, arguments);
            });

            me.$removeReport = me.element.find(".fr-rp-remove-report-id");
            me.$removeReport.on("click", function (e, data) {
                me._onRemoveReport.apply(me, arguments);
            });

            // Toolbar options
            me.$hideToolbar = me.element.find(".fr-rp-hide-toolbar-id");
            me.$hideToolbar.on("change", function (e, data) {
                me._onChangeToolbarOption.apply(me, arguments);
            });
            me.$minimalToolbar = me.element.find(".fr-rp-minimal-toolbar-id");
            me.$minimalToolbar.on("change", function (e, data) {
                me._onChangeToolbarOption.apply(me, arguments);
            });
            me.$fullToolbar = me.element.find(".fr-rp-full-toolbar-id");
            me.$fullToolbar.on("change", function (e, data) {
                me._onChangeToolbarOption.apply(me, arguments);
            });

            me.$reportInput = me.element.find(".fr-rp-report-input-id");
            me.$popup = me.element.find(".fr-rp-popup-container");
            me.$tree = me.element.find(".fr-report-tree-id");

            me.$tree.on("changed.jstree", function (e, data) {
                me._onChangedjsTree.apply(me, arguments);
            });

            // Hook the cancel and submit events
            me.element.find(".fr-rp-cancel").on("click", function(e) {
                me.closeDialog();
            });
            me.element.find(".fr-rp-submit-id").on("click", function (e) {
                me._submit();
            });
            me.element.on(events.modalDialogGenericSubmit, function () {
                me._submit();
            });
            me.element.on(events.modalDialogGenericCancel, function () {
                me.closeDialog();
            });
        },
        _onRemoveReport: function (e, data) {
            var me = this;
            me.$reportInput.val("");
            me.properties.catalogItem = null;
        },
        _onChangeToolbarOption: function (e, data) {
            var me = this;
            me.$hideToolbar.prop("checked", false);
            me.$minimalToolbar.prop("checked", false);
            me.$fullToolbar.prop("checked", false);

            $(e.target).prop("checked", true);
        },
        _onChangedjsTree: function (e, data) {
            var me = this;

            // Set the value if this is a report
            if (data.node.li_attr.dataReport === true) {
                me.$reportInput.val(data.node.text);
                me.properties.catalogItem = data.node.li_attr.dataCatalogItem;

                // Clear any previously save parameters. These get added on the save call later
                me.properties.parameters = null;

                me.$popup.addClass("fr-core-hidden");
            }
            else {
                me.$tree.jstree("toggle_node", data.node);
            }
        },
        _onClickTreeDropdown: function (e) {
            var me = this;
            var $window = $(window);

            // Show the popup
            var top = me.$dropdown.offset().top + me.$dropdown.height() - $window.scrollTop();
            var left = me.$dropdown.offset().left - $window.scrollLeft();
            var width = me.$dropdown.width();
            me.$popup.css({ top: top, left: left, width: width });
            me.$popup.toggleClass("fr-core-hidden");
        },
        // _getItems will return back an array of CatalogItem objects where:
        //
        // var = CatalogItem {
        //          ID: string,     - GUID
        //          Name: string,   - Item Name
        //          Path: string,   - Item Path
        //          Type: number,   - itemType (see below)
        // }
        _getItems: function (view, path) {
            var me = this;
            var items = null;

            forerunner.ajax.ajax({
                dataType: "json",
                url: me.options.reportManagerAPI + "GetItems",
                async: false,
                data: {
                    view: view,
                    path: path
                },
                success: function (data) {
                    items = data;
                },
                error: function (data) {
                    console.log(data);
                }
            });

            return items;
        },
        // itemType is the number returned in the CatalogItem.Type member
        _itemType: {
            unknown: 0,
            folder: 1,
            report: 2,
            resource: 3,
            linkedReport: 4,
            dataSource: 5,
            model: 6,
            site: 7
        },
        /**
         * Open parameter set dialog
         *
         * @function $.forerunner.reportProperties#openDialog
         */
        openDialog: function () {
            var me = this;
            forerunner.dialog.showModalDialog(me.options.$appContainer, me);
        },
        _triggerClose: function (isSubmit) {
            var me = this;
            var data = {
                reportId: me.options.reportId,
                isSubmit: isSubmit
            };
            me._trigger(events.close, null, data);
        },
        _submit: function () {
            var me = this;

            if (me.$form.valid() === true) {
                // Toolbar options
                me.properties.toolbarConfigOption = constants.toolbarConfigOption.hide;
                if (me.$minimalToolbar.prop("checked")) {
                    me.properties.toolbarConfigOption = constants.toolbarConfigOption.minimal;
                } else if (me.$fullToolbar.prop("checked")) {
                    me.properties.toolbarConfigOption = constants.toolbarConfigOption.full;
                }

                me.options.$dashboardEditor.setReportProperties(me.options.reportId, me.properties);
                me._triggerClose(true);
                forerunner.dialog.closeModalDialog(me.options.$appContainer, me);
            }
        },
        /**
         * Close parameter set dialog
         *
         * @function $.forerunner.reportProperties#closeDialog
         */
        closeDialog: function () {
            var me = this;
            me._triggerClose(false);
            forerunner.dialog.closeModalDialog(me.options.$appContainer, me);
        },
        _validateForm: function (form) {
            form.validate({
                errorPlacement: function (error, element) {
                    error.appendTo($(element).parent().find("span"));
                },
                highlight: function (element) {
                    $(element).parent().find("span").addClass("fr-rp-error-position");
                    $(element).addClass("fr-rp-error");
                },
                unhighlight: function (element) {
                    $(element).parent().find("span").removeClass("fr-rp-error-position");
                    $(element).removeClass("fr-rp-error");
                }
            });
        },
        _resetValidateMessage: function () {
            var me = this;
            var error = locData.validateError;

            jQuery.extend(jQuery.validator.messages, {
                required: error.required,
                number: error.number,
                digits: error.digits
            });
        },
    }); //$.widget
});
