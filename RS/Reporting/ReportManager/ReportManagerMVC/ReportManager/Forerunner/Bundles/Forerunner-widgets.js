﻿///#source 1 1 /Forerunner/Common/js/History.js
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
     * @prop {Function} options.onInputBlur - Callback function used to handle input blur event
     * @prop {Function} options.onInputFocus -Callback function used to handle input focus event 
     * @prop {Object} options.$appContainer - Report container
     * @prop {Object} options.parameterModel - Parameter model
     * @prop {Object} options.savePosition - Saved report page scroll position 
     * @prop {String} options.viewerID - Current report viewer id.
     * @prop {String} options.rsInstance - Report service instance name
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
            isAdmin: false,
        },

        _destroy: function () {
            var me = this;
            //This needs to be changed to only remove the view function
            //Baotong update it on 22-05-2014
            $(window).off("resize", me._ReRenderCall);
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
            $(window).on("resize", {me: me }, me._ReRenderCall);

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
        _ReRenderCall: function (event) {
            var me = event.data.me;
            me.scrollLeft = $(window).scrollLeft();
            me.scrollTop = $(window).scrollTop();

            me._ReRender.call(me);
            $(window).scrollLeft(me.scrollLeft);
            $(window).scrollTop(me.scrollTop);
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
                        ReportPath: me.reportPath,
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
                        ReportPath: me.reportPath,
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
                    me._loadPage(data.NewPage, false, null, null, true);
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
                        ReportPath: me.reportPath,
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
            me.$printDialog.reportPrint("setPrint", pageLayout);
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
                    ReportPath: me.reportPath,
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
                        ReportPath: me.reportPath,
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
                       path: me.reportPath,
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
                        ReportPath: me.reportPath,
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
    var widgets = forerunner.ssr.constants.widgets;
    var toolTypes = forerunner.ssr.constants.toolTypes;
    var events = forerunner.ssr.constants.events;

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
                $tool.after(me._getToolHtml(toolInfo));
                $tool = $tool.next();
                me._addChildTool($tool, toolInfo, enabled);
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
                $dropdown.css("top", e.data.$tool.height());
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
                $toolEl.css({"display": ""});
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
                var $toolEl = me.element.find("." + toolInfo.selectorClass);
                $toolEl.addClass("fr-toolbase-disabled");
                if (toolInfo.events) {
                    $toolEl.removeClass("fr-core-cursorpointer");
                    me._removeEvent($toolEl, toolInfo);
                }
                if (toolInfo.toolType === toolTypes.toolGroup && toolInfo.tools) {
                    me.disableTools(toolInfo.tools);
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
            var smallClass = ".fr-toolbar .fr-toolbar-hidden-on-small";
            var mediumClass = ".fr-toolbar .fr-toolbar-hidden-on-medium";
            var largeClass = ".fr-toolbar .fr-toolbar-hidden-on-large";
            var veryLargeClass = ".fr-toolbar .fr-toolbar-hidden-on-very-large";

            // Remove any previously added fr-toolbar-hidden classes
            me.element.find(smallClass + ", " + mediumClass + ", " + largeClass + ", " + veryLargeClass).removeClass("fr-toolbar-hidden");

            var width = me.element.width();
            if (width < 480) {
                me.element.find(smallClass).addClass("fr-toolbar-hidden");
            } else if (width < 568) {
                me.element.find(mediumClass).addClass("fr-toolbar-hidden");
            } else if (width < 768) {
                me.element.find(largeClass).addClass("fr-toolbar-hidden");
            } else {  // Screen >= 769
                me.element.find(veryLargeClass).addClass("fr-toolbar-hidden");
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
            $mainheadersection.on(events.toolbarMenuClick(), function (e, data) { me.showSlideoutPane(true); });
            $mainheadersection.on(events.toolbarParamAreaClick(), function (e, data) { me.showSlideoutPane(false); });
            $mainheadersection.on(events.reportExplorerToolbarMenuClick(), function (e, data) { me.showSlideoutPane(true); });
            $(".fr-layout-rightpanecontent", me.$container).on(events.reportParameterRender(), function (e, data) { me.showSlideoutPane(false); });
            $(".fr-layout-leftheader", me.$container).on(events.leftToolbarMenuClick(), function (e, data) { me.hideSlideoutPane(true); });

            $(".fr-layout-rightheader", me.$container).on(events.rightToolbarParamAreaClick(), function (e, data) { me.hideSlideoutPane(false); });
            $(".fr-layout-leftpanecontent", me.$container).on(events.toolPaneActionStarted(), function (e, data) { me.hideSlideoutPane(true); });
            $(".fr-layout-leftpanecontent", me.$container).on(events.reportExplorerToolPaneActionStarted(), function (e, data) { me.hideSlideoutPane(true); });
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

            $(window).resize(function () {
                me.ResetSize();

                me._updateTopDiv(me);
                me.setBackgroundLayout();
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

        _updateTopDiv: function (me) {
            if (me.options.isFullScreen)
                return;

            var diff = Math.min($(window).scrollTop() - me.$container.offset().top, me.$container.height() - 38);
            if (me.$leftpane.is(":visible")) {
                me.$leftpane.css("top", diff > 0 ? diff : me.$container.scrollTop());
            } else if (me.$rightpane.is(":visible")) {
                me.$rightpane.css("top", diff > 0 ? diff : me.$container.scrollTop());
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
            var isReportExplorerToolbar = me.$mainheadersection.hasClass("fr-explorer-tb");

            if (slideoutPane.is(":visible")) {
                if (isLeftPane) {
                    slideoutPane.slideLeftHide(delay * 0.5);
                } else {
                    slideoutPane.slideRightHide(delay * 0.5);
                }
                topdiv.removeClass(className, delay);
                if (isReportExplorerToolbar) {
                    me.$mainheadersection.reportExplorerToolbar("showAllTools");
                }
                else {
                    me.$mainheadersection.toolbar("showAllTools");
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
        showSlideoutPane: function (isLeftPane) {
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
            var isReportExplorerToolbar = me.$mainheadersection.hasClass("fr-explorer-tb");
            
            if (!slideoutPane.is(":visible")) {
                slideoutPane.css({ height: Math.max($(window).height(), mainViewPort.height()) });
                if (isLeftPane) {
                    slideoutPane.css({ top: me.$container.scrollTop()});
                    slideoutPane.slideLeftShow(delay);
                } else {
                    slideoutPane.css({ top: me.$container.scrollTop()});
                    slideoutPane.slideRightShow(delay);
                }
                
                topdiv.addClass(className, delay);
                if (isReportExplorerToolbar) {
                    me.$mainheadersection.reportExplorerToolbar("hideAllTools");
                }
                else {
                    me.$mainheadersection.toolbar("hideAllTools");
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
        toggleSlideoutPane: function (isLeftPane) {
            var me = this;
            var slideoutPane = isLeftPane ? me.$leftpane : me.$rightpane;
            if (slideoutPane.is(":visible")) {
                this.hideSlideoutPane(isLeftPane);
            } else {
                this.showSlideoutPane(isLeftPane);
            }
        },
        setBackgroundLayout: function () {
            var me = this;
            var reportArea = $(".fr-report-areacontainer", me.$container);
            var containerHeight = me.$container.height();
            var containerWidth = me.$container.width();
            
            if (reportArea.height() > (containerHeight - 38) || reportArea.width() > containerWidth) {// 38 is toolbar height
                $(".fr-render-bglayer", me.$container).css("position", "absolute").
                    css("height", Math.max(reportArea.height(), (containerHeight - 38)))
                    .css("width", Math.max(reportArea.width(), containerWidth));
            }
            else {
                $(".fr-render-bglayer", me.$container).css("position", "absolute")
                    .css("height", (containerHeight - 38)).css("width", containerWidth);
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
            });

            me.options.$reportViewer.on(events.reportViewerPreLoadReport(), function (e, data) {
                me._leaveCurReport();
            });

            me.options.$reportViewer.on(events.reportViewerChangeReport(), function (e, data) {
                me._leaveCurReport();

                if (data.credentialRequired === true) {
                    me.enableTools([tb.btnCredential]);
                }
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

            me.element.html("<div class='" + me.options.toolClass + " fr-core-widget'/>");
           
            me.addTools(1, false, me._viewerButtons());
            me.addTools(1, false, [tb.btnParamarea]);
            me.enableTools([tb.btnMenu]);
            if (me.options.$reportViewer) {
                me._initCallbacks();
            }
        },
        _viewerButtons: function (allButtons) {
            var listOfButtons;

            if (allButtons === true || allButtons === undefined)
                listOfButtons = [tb.btnMenu, tb.btnReportBack, tb.btnCredential, tb.btnNav, tb.btnRefresh, tb.btnDocumentMap, tg.btnExportDropdown, tg.btnVCRGroup, tg.btnFindGroup, tb.btnZoom, tb.btnPrint];
            else
                listOfButtons = [tb.btnMenu, tb.btnCredential, tb.btnNav, tb.btnRefresh, tb.btnDocumentMap, tg.btnExportDropdown, tg.btnVCRGroup, tg.btnFindGroup, tb.btnZoom, tb.btnPrint];

            if (forerunner.device.isAndroid() && !forerunner.device.isChrome()) {
                if (allButtons === true || allButtons === undefined)
                    listOfButtons = [tb.btnMenu, tb.btnReportBack, tb.btnCredential, tb.btnNav, tb.btnRefresh, tb.btnDocumentMap, tg.btnExportDropdown, tg.btnVCRGroup, tg.btnFindGroup, tb.btnPrint];
                else
                    listOfButtons = [tb.btnMenu, tb.btnNav, tb.btnCredential, tb.btnRefresh, tb.btnDocumentMap, tg.btnExportDropdown, tg.btnVCRGroup, tg.btnFindGroup, tb.btnPrint];
            }

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
            });

            me.options.$reportViewer.on(events.reportViewerPreLoadReport(), function (e, data) {
                me._leaveCurReport();
            });

            me.options.$reportViewer.on(events.reportViewerChangeReport(), function (e, data) {
                me._leaveCurReport();

                if (data.credentialRequired === true) {
                    me.enableTools([tp.itemCredential]);
                }
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
            var listOfItems;
            var me = this;

            if (allButtons === true || allButtons === undefined)
                listOfItems = [tg.itemVCRGroup, tp.itemReportBack, tp.itemCredential, tp.itemNav, tp.itemRefresh, tp.itemDocumentMap, tp.itemZoom, tp.itemExport, tg.itemExportGroup, tp.itemPrint, tg.itemFindGroup];
            else
                listOfItems = [tg.itemVCRGroup, tp.itemCredential, tp.itemNav, tp.itemRefresh, tp.itemDocumentMap, tp.itemZoom, tp.itemExport, tg.itemExportGroup, tp.itemPrint, tg.itemFindGroup];

            //remove zoom on android browser
            if (forerunner.device.isAndroid() && !forerunner.device.isChrome()) {
                if (allButtons === true || allButtons === undefined)
                    listOfItems = [tg.itemVCRGroup, tp.itemReportBack, tp.itemCredential, tp.itemNav, tp.itemRefresh, tp.itemDocumentMap, tp.itemExport, tg.itemExportGroup, tp.itemPrint, tg.itemFindGroup];
                else
                    listOfItems = [tg.itemVCRGroup, tp.itemCredential, tp.itemNav, tp.itemRefresh, tp.itemDocumentMap, tp.itemExport, tg.itemExportGroup, tp.itemPrint, tg.itemFindGroup];
            }

            if (me.options.$reportViewer.reportViewer("option","isAdmin"))
                listOfItems = listOfItems.concat([tp.itemRDLExt]);
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
            // Hook up any / all custom events that the report viewer may trigger

            // Hook up the toolbar element events
            me.enableTools([tb.btnMenu, tb.btnHome, tb.btnBack, tb.btnFav, tb.btnRecent, tg.explorerFindGroup]);
            if (forerunner.ajax.isFormsAuth()) {
                me.enableTools([tb.btnLogOff]);
            }

            me.element.find(".fr-rm-keyword-textbox").watermark(locData.toolbar.search, { useNative: false, className: "fr-param-watermark" });
            //trigger window resize event to regulate toolbar buttons visibility
            $(window).resize();
        },
        _init: function () {
            var me = this;
            me._super();

            me.element.empty();
            me.element.append($("<div class='" + me.options.toolClass + " fr-core-widget'/>"));
            me.addTools(1, true, [tb.btnMenu, tb.btnBack, tb.btnSetup, /*tb.btnCreateDashboard,*/ tb.btnHome, tb.btnRecent, tb.btnFav, tg.explorerFindGroup]);
            if (forerunner.ajax.isFormsAuth()) {
                me.addTools(8, true, [tb.btnLogOff]);
            }
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
        },
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
        _initCallbacks: function () {
            var me = this;
            // Hook up any / all custom events that the report viewer may trigger

            // Hook up the toolbar element events
            me.enableTools([tp.itemBack, tp.itemFolders, tp.itemSetup, tg.explorerItemFindGroup]);
            if (forerunner.ajax.isFormsAuth()) {
                me.enableTools([tp.itemLogOff]);
            }

            me.element.find(".fr-rm-item-keyword").watermark(locData.toolbar.search, { useNative: false, className: "fr-param-watermark" });
        },
        _init: function () {
            var me = this;
            me._super();

            me.element.empty();
            me.element.append($("<div class='" + me.options.toolClass + " fr-core-widget'/>"));
            me.addTools(1, true, [tp.itemBack, tp.itemFolders, tg.explorerItemFolderGroup, tp.itemSetup, tg.explorerItemFindGroup]);
            if (forerunner.ajax.isFormsAuth()) {
                me.addTools(5, true, [tp.itemLogOff]);
            }
            me._initCallbacks();

            // Hold onto the folder buttons for later
            var $itemHome = me.element.find("." + tp.itemHome.selectorClass);
            var $itemRecent = me.element.find("." + tp.itemRecent.selectorClass);
            var $itemFav = me.element.find("." + tp.itemFav.selectorClass);
            me.folderItems = [$itemHome, $itemRecent, $itemFav];
        },

        _destroy: function () {
        },

        _create: function () {
            
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
            isAdmin: false,
            onInputBlur: null,
            onInputFocus: null,
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
                    me.options.isAdmin = settings.adminUI;
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
         * @param {Boolean} forceLoadFromServer - if true, always load from the server
         *
         * @return {Object} - User settings
         */
        getUserSettings: function (forceLoadFromServer) {
            var me = this;

            if (forceLoadFromServer !== true && me.userSettings) {
                return me.userSettings;
            }

            var settings = forerunner.ssr.ReportViewerInitializer.prototype.getUserSettings(me.options);
            if (settings) {
                me.userSettings = settings;
                me.options.isAdmin = settings.adminUI;
            }

            return me.userSettings;
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
            if (catalogItem.Type === 1 || catalogItem.Type === 7)
                action = "explore";
            else if (catalogItem.Type === 3)
                action = "open";
            else
                action = "browse";

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
            
            if (catalogItem.Type === 1 || catalogItem.Type === 7)
                if (isSelected) {
                    outerImage.addClass("fr-explorer-folder-selected");
                }
                else {
                    outerImage.addClass("fr-explorer-folder");
                }
            else if (catalogItem.Type === 3) {//resource files
                outerImage.addClass("fr-icons128x128");

                var fileTypeClass = me._getFileTypeClass(catalogItem.MimeType);
                outerImage.addClass(fileTypeClass);
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
                var imageSrc =  reportThumbnailPath;
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
        _fetch: function (view,path) {
            var me = this;

            if (view === "resource") {
                me._renderResource(path);
                return;
            }

            if (view === "search") {
                me._searchItems(path);
                return;
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
                },
                success: function (data) {
                    if (data.Exception) {
                        forerunner.dialog.showMessageBox(me.options.$appContainer, data.Exception.Message, locData.messages.catalogsLoadFailed);
                    }
                    else {
                        me._render(data);
                    }
                },
                error: function (data) {
                    console.log(data);
                    forerunner.dialog.showMessageBox(me.options.$appContainer, locData.messages.catalogsLoadFailed);
                }
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

            if (me.options.explorerSettings) {
                me._initOverrides();
            }
            me._fetch(me.options.view, me.options.path);

            me.userSettings = {
                responsiveUI: false
            };
            me.getUserSettings(true);

            var $dlg = me.options.$appContainer.find(".fr-us-section");
            if ($dlg.length === 0) {
                $dlg = $("<div class='fr-us-section fr-dialog-id fr-core-dialog-layout fr-core-widget'/>");
                $dlg.userSettings({
                    $appContainer: me.options.$appContainer,
                    $reportExplorer: me.element
                });
                me.options.$appContainer.append($dlg);
                me._userSettingsDialog = $dlg;
            }
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
                $dlg.createDashboard({
                    $appContainer: me.options.$appContainer,
                    $reportExplorer: me.element
                });
                me.options.$appContainer.append($dlg);
                me._createDashboardDialog = $dlg;
            }
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
        savedPath: function () {
            var me = this;
            if (me.options.view === "catalog") {
                me.priorExplorerPath = me.options.path;
            }

        },
        _searchItems: function (keyword) {
            var me = this;

            if (keyword === "") {
                forerunner.dialog.showMessageBox(me.options.$appContainer, "Please input valid keyword", "Prompt");
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
        _getFileTypeClass: function (mimeType) {
            var fileTypeClass = null;
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
                default://unknown
                    fileTypeClass = "fr-icons128x128-file-unknown";
                    break;
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

            var headerHtml = forerunner.dialog.getModalDialogHeaderHtml("fr-icons24x24-setup", userSettings.title, "fr-us-cancel", userSettings.cancel);
            var $theForm = new $(
            "<div class='fr-core-dialog-innerPage fr-core-center'>" +
                headerHtml +
                // form
                "<form class='fr-us-form fr-core-dialog-form'>" +
                    "<div class='fr-us-setting-container'>" +
                        "<label class='fr-us-label'>" + userSettings.ResponsiveUI + "</label>" +
                        "<input class='fr-us-responsive-ui-id fr-us-checkbox'  name='ResponsiveUI' type='checkbox'/>" +

                        "</br><label class='fr-us-label'>" + userSettings.AdminUI + "</label>" +
                        "<input class='fr-us-admin-ui-id fr-us-checkbox'  name='adminUI' type='checkbox'/>" +
                    "</div>" +
                    // Ok button
                    "<div class='fr-core-dialog-submit-container'>" +
                        "<div class='fr-core-center'>" +
                        "<input name='submit' type='button' class='fr-us-submit-id fr-core-dialog-submit fr-core-dialog-button' value='" + userSettings.submit + "'/>" +
                    "</div>" +
                "</form>" +
                "<div class='fr-buildversion-container'>" +
                    buildVersion +
                "</div>" +
            "</div>");http://localhost:9000/Forerunner/ReportViewer/Loc/ReportViewer-en.txt

            me.element.append($theForm);

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
            var responsiveUI = me.settings.responsiveUI;
            me.$resposiveUI.prop("checked", responsiveUI);

            me.$adminUI = me.element.find(".fr-us-admin-ui-id");
            var adminUI = me.settings.adminUI;
            me.$adminUI.prop("checked", adminUI);

        },
        _saveSettings: function () {
            var me = this;
            me.settings.responsiveUI = me.$resposiveUI.prop("checked");
            me.settings.adminUI = me.$adminUI.prop("checked");

            me.options.$reportExplorer.reportExplorer("saveUserSettings", me.settings);

            me.closeDialog();
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
        /**
         * Close user setting dialog
         *
         * @function $.forerunner.userSettings#closeDialog
         */
        closeDialog: function () {
            var me = this;

            forerunner.dialog.closeModalDialog(me.options.$appContainer, me);

        }
    }); //$.widget
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
            var renderWidth = me.options.reportViewer.element.width();
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

            var viewerWidth = me._convertToMM(me.options.reportViewer.element.width()+"px");
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

                //Handle EasySubmit
                if (textExt.EasySubmitURL && textExt.EasySubmitType) {
                    $TextObj.on("click", { reportViewer: me.options.reportViewer.element, element: $TextObj, getInputs: me._getInputsInRow, easySubmit:me._submitRow, veryEasySubmit: me._easySubmit }, function (e) {
                        e.data.veryEasySubmit(e, textExt.EasySubmitType, textExt.EasySubmitURL, textExt.EasySubmitAllFields, textExt.EasySubmitSuccess, textExt.EasySuccessFail);
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
                    if (textExt.InputAllways ===true)
                        $TextObj.attr("data-allways", true);
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

        _getInputsInRow: function(element,includeAll){
            var me = this;
            var data = [];
            var rows = 0;

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
                    obj.allways = $(input).attr("data-allways");

                    if (obj.allways || includeAll || obj.value !== obj.origionalValue || obj.type === "button" || obj.type === "submit") {
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

            $.ajax({

                type: type,
                dataType: datatype,
                url: url,
                data: data,
                async: true
            }).done(done).fail(fail);

        },

        _easySubmit: function(e,type, url,AllFields,successText,failText){            
            if (!successText) successText = "Saved";
            if (!failText) failText = "Failed";
            if (AllFields === undefined) AllFields = true;
            var data = e.data.getInputs(e.data.element, AllFields);

            e.data.easySubmit(data, type, url, 'text', function () { alert(successText); }, function () { alert(failText); });

        },

        _writeActions: function (RIContext, Elements, $Control) {
            var me = this;
            if (Elements.ActionInfo)
                for (var i = 0; i < Elements.ActionInfo.Count; i++) {
                    this._writeAction(RIContext, Elements.ActionInfo.Actions[i], $Control);
                }

            var ActionExt = me._getRDLExt(RIContext);

            if (ActionExt.JavaScriptAction) {                
                $Control.addClass("fr-core-cursorpointer");
                var newFunc;
                try{
                    newFunc = new Function("e",ActionExt.JavaScriptAction);
                }
                catch (e) { }

                $Control.on("click", { reportViewer: me.options.reportViewer.element, element: $Control, getInputs: me._getInputsInRow, easySubmit:me._submitRow }, newFunc);
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
                //$map.attr("data-uniqName", "Map_" + RIContext.RS.sessionID + "_" + RIContext.CurrObj.Elements.NonSharedElements.UniqueName);
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
                if (Obj.Cell.ReportItem.Type !== "SubReport") {
                    if (Obj.Cell.ReportItem.Elements.NonSharedElements)
                        Style += me._getFullBorderStyle(Obj.Cell.ReportItem.Elements.NonSharedElements.Style);
                }
                else {
                    if (Obj.Cell.ReportItem.SubReportProperties.NonSharedElements)
                        Style += me._getFullBorderStyle(Obj.Cell.ReportItem.SubReportProperties.NonSharedElements.Style);
                }
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
                if (Obj.Cell.ReportItem.Type !== "SubReport") {
                    if (Obj.Cell.ReportItem.Elements.NonSharedElements.Style && Obj.Cell.ReportItem.Elements.NonSharedElements.Style.BackgroundColor)
                        Style += "background-color:" + Obj.Cell.ReportItem.Elements.NonSharedElements.Style.BackgroundColor + ";";
                }
                else {
                    if (Obj.Cell.ReportItem.SubReportProperties.NonSharedElements.Style && Obj.Cell.ReportItem.SubReportProperties.NonSharedElements.Style.BackgroundColor)
                        Style += "background-color:" + Obj.Cell.ReportItem.SubReportProperties.NonSharedElements.Style.BackgroundColor + ";";
                }

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
                var viewerWidth = me._convertToMM(me.options.reportViewer.element.width() + "px");
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

                if (me.options.responsive && me._defaultResponsizeTablix === "on" &&  me._maxResponsiveRes > me.options.reportViewer.element.width()) {
                    var notdone = true;
                    var nextColIndex = RIContext.CurrObj.ColumnWidths.ColumnCount;
                    var tablixCols = RIContext.CurrObj.ColumnWidths.Columns;
                    var maxPri = -1;
                    var foundCol;
                    
                    if (tablixExt.Columns && tablixExt.Columns.length < RIContext.CurrObj.ColumnWidths.ColumnCount) {
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
                                    if (tablixExt.Columns[cols].Pri >= maxPri && respCols.Columns[parseInt(tablixExt.Columns[cols].Col) - 1].show === true) {
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
                                respCols.Columns[BRObj.ColumnIndex].HeaderName = BRObj.Cell.ReportItem.Elements.NonSharedElements.UniqueName;
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
                    if (respCols.Columns[Obj.ColumnIndex].show === false && (Obj.Type === "Corner" || Obj.Type === "ColumnHeader")) {
                        var h = me._writeReportItems(new reportItemContext(RIContext.RS, Obj.Cell.ReportItem, Index, RIContext.CurrObj, new $("<Div/>"), "", new tempMeasurement(CellHeight, CellWidth), true));
                        if (respCols.Columns[Obj.ColumnIndex].Header ===undefined)
                            respCols.Columns[Obj.ColumnIndex].Header = new $("<div/>");
                        
                        if (respCols.Columns[Obj.ColumnIndex].HeaderIndex === undefined)
                            respCols.Columns[Obj.ColumnIndex].HeaderIndex = 0;
                        if (respCols.Columns[Obj.ColumnIndex].HeaderName === undefined)
                            respCols.Columns[Obj.ColumnIndex].HeaderName = Obj.Cell.ReportItem.Elements.NonSharedElements.UniqueName;
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
            }
            LastObjType = Obj.Type;
            return { "LastRowIndex": LastRowIndex, "LastObjType": LastObjType, "Row": $Row, "ExtRow" : $ExtRow, "ExtCell" : $ExtCell, HasFixedCols: HasFixedCols, HasFixedRows: HasFixedRows ,CellCount:State.CellCount  };          
        },

        _isHeader: function(respCols,cell){
            var me = this;

            var cellDefName = (me._getSharedElements(cell.ReportItem.Elements.SharedElements)).Name ;
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

            $Drilldown.on("click", { ExtRow: $ExtRow, ColIndex: ColIndex, UniqueName: Cell.ReportItem.Elements.NonSharedElements.UniqueName, $Tablix: $Tablix }, function (e) {

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

            var viewport_left = $(window).scrollLeft();
            var viewport_top =$(window).scrollTop();
            var viewport_width = $(window).innerWidth();
            var viewport_height = $(window).innerHeight();

            for (var name in me._tablixStream) {
                var offset = me._tablixStream[name].EndRow.offset();
                if (offset.top > viewport_top && offset.top+100 < viewport_top + viewport_height) {
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

            var $control = me._createDiv(["fr-param-checkbox-container"]);
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
            var $control = new $("<input class='fr-param fr-paramname-" + param.Name + "' name='" + param.Name + "' type='text' size='100' ismultiple='"
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

            var $container = me._createDiv(["fr-param-element-container"]);
            var $control = me._createInput(param, "text", false, ["fr-param", "fr-param-autocomplete-textbox", "fr-param-not-close", "fr-paramname-" + param.Name]);
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
                if ((predefinedValue && predefinedValue === param.ValidValues[i].Value) || (!predefinedValue && i === 0)) {
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
            var $control = new $("<select class='fr-param fr-param-select fr-paramname-" + param.Name + "' name='" + param.Name + "' ismultiple='" +
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

                if ((predefinedValue && predefinedValue === optionValue) || (!predefinedValue && i === 0)) {
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

            var $container = me._createDiv(["fr-param-element-container fr-param-tree-container"]);
            var $input = me._createInput(param, "text", false, ["fr-param-client", "fr-param-not-close", "fr-paramname-" + param.Name]);
            $input.attr("cascadingTree", true).attr("readonly", "readonly").addClass("fr-param-tree-input");
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
                $tree.position({ my: "left top", at: "left bottom", of: $input });
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
            var $control = me._createDiv(["fr-param-element-container"]);

            var $multipleCheckBox = me._createInput(param, "text", true, ["fr-param-client", "fr-param-dropdown-textbox", "fr-param-not-close", "fr-paramname-" + param.Name]);

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
            var $control = me._createDiv(["fr-param-element-container"]);

            var $multipleTextArea = me._createInput(param, "text", true, ["fr-param", "fr-param-dropdown-textbox", "fr-param-not-close", "fr-paramname-" + param.Name]);
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
                    //popup at above, 4 is margin top
                    $dropDown.css("top", (($dropDown.height() + 10) * -1) + 4);
                }
                else {//popup at bottom, 15 is margin + padding + border
                    $dropDown.css("top", $multipleControl.height() + 15);
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
                        "<input class='fr-print-text' " + name1 + " type='text' value='" + me.options.text1 + "'/>" +
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
                        "<input class='fr-print-text' " + name2 + " type='text' value='" + me.options.text2 + "'/>" +
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

            var headerHtml = forerunner.dialog.getModalDialogHeaderHtml('fr-icons24x24-printreport', print.title, "fr-print-cancel", print.cancel);
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
            if (me.element.find(".fr-print-form").valid() === true) {

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

            var headerHtml = forerunner.dialog.getModalDialogHeaderHtml("fr-icons24x24-setup", locData.title, "fr-rdl-cancel", locData.cancel);
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
            var textElement = "<input type='text' required='true' name=name" + index + " class='fr-mps-text-input' value='" + encodedSetName + "'/><span class='fr-mps-error-span'/>";
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

            var headerHtml = forerunner.dialog.getModalDialogHeaderHtml("fr-icons24x24-parameterSets", manageParamSets.manageSets, "fr-mps-cancel", manageParamSets.cancel);
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
    var events = forerunner.ssr.constants.events;
    var toolTypes = ssr.constants.toolTypes;
    var widgets = forerunner.ssr.constants.widgets;
    var locData = forerunner.localize.getLocData(forerunner.config.forerunnerFolder() + "ReportViewer/loc/ReportViewer");

    // This is the helper class that would initialize a viewer.
    // This is currently private.  But this could be turned into a sample.
    ssr.ReportViewerInitializer = function (options) {
        var me = this;

        me.options = {
            $toolbar: null,
            $toolPane: null,
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
            isAdmin:false,
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
                userSettings = me.getUserSettings(me.options);
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
                isAdmin: me.options.isAdmin,
            });

            // Create / render the toolbar
            var $toolbar = me.options.$toolbar;
            $toolbar.toolbar({ $reportViewer: $viewer, $ReportViewerInitializer: this, $appContainer: me.options.$appContainer });

            var tb = forerunner.ssr.tools.mergedButtons;
            var rtb = forerunner.ssr.tools.rightToolbar;

            if (me.options.isReportManager) {
                var listOfButtons = [tb.btnHome, tb.btnRecent, tb.btnFavorite];
                if (forerunner.ajax.isFormsAuth()) {
                    listOfButtons.push(tb.btnLogOff);
                }
                $toolbar.toolbar("addTools", 12, true, listOfButtons);
                $toolbar.toolbar("addTools", 4, true, [tb.btnFav]);
                $toolbar.toolbar("disableTools", [tb.btnFav]);
            }

            // Let the report viewer know the height of the toolbar
            $viewer.reportViewer("option", "toolbarHeight", $toolbar.outerHeight());

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
            var tg = forerunner.ssr.tools.groups;
            var $toolPane = me.options.$toolPane.toolPane({ $reportViewer: $viewer, $ReportViewerInitializer: this, $appContainer: me.options.$appContainer });
            if (me.options.isReportManager) {
                $toolPane.toolPane("addTools", 2, true, [mi.itemFolders, tg.itemFolderGroup]);
                if (forerunner.ajax.isFormsAuth()) {
                    $toolPane.toolPane("addTools", 13, true, [mi.itemLogOff]);
                }

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
            $dlg = me.options.$appContainer.find(".fr-print-section");
            if ($dlg.length === 0) {
                $dlg = $("<div class='fr-print-section fr-dialog-id fr-core-dialog-layout fr-core-widget'/>");
                me.options.$appContainer.append($dlg);
            }
            $dlg.reportPrint({ $appContainer: me.options.$appContainer, $reportViewer: $viewer });

            $dlg = me.options.$appContainer.find(".fr-dsc-section");
            if ($dlg.length === 0) {
                $dlg = $("<div class='fr-dsc-section fr-dialog-id fr-core-dialog-layout fr-core-widget'/>");
                me.options.$appContainer.append($dlg);
            }
            $dlg.dsCredential({ $appContainer: me.options.$appContainer, $reportViewer: $viewer });

            if (me.parameterModel) {
                $dlg = me.options.$appContainer.find(".fr-mps-section");
                if ($dlg.length === 0) {
                    $dlg = $("<div class='fr-mps-section fr-dialog-id fr-core-dialog-layout fr-core-widget'/>");
                    $dlg.manageParamSets({
                        $appContainer: me.options.$appContainer,
                        $reportViewer: $viewer,
                        $reportViewerInitializer: me,
                        model: me.parameterModel
                    });
                    me.options.$appContainer.append($dlg);
                }
                me._manageParamSetsDialog = $dlg;
            }
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
                me.$btnFavorite = me.options.$toolbar.find(".fr-button-update-fav").find("div");
            }
            me.$itemFavorite = null;
            if (me.options.$toolPane !== null) {
                me.$itemFavorite = me.options.$toolPane.find(".fr-item-update-fav").find("div");
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
        getUserSettings : function(options) {
            var settings = null;
            var url = forerunner.config.forerunnerAPIBase() + "ReportManager" + "/GetUserSettings";
            if (options.rsInstance) url += "?instance=" + options.rsInstance;
            forerunner.ajax.ajax({
                url: url,
                dataType: "json",
                async: false,
                success: function (data) {
                    if (data && data.responsiveUI !== undefined) {
                        settings = data;
                    }
                }
            });
            return settings;
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
    var widgets = forerunner.ssr.constants.widgets;

    
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
     * @prop {Boolean} options.useReportManagerSettings - Defaults to false if isREportManager is false.  If set to true, will load the user saved parameters and user settings from the database.
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
            isAdmin: false,
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
                isAdmin: me.options.isAdmin,
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

            layout.$rightheaderspacer.height(layout.$topdiv.height());
            layout.$leftheaderspacer.height(layout.$topdiv.height());
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

            var headerHtml = forerunner.dialog.getModalDialogHeaderHtml('fr-icons24x24-dataSourceCred', dsCredential.title, "fr-dsc-cancel", dsCredential.cancel);
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
     * @prop {String} options.isAdmin - Optional,Report service instance name
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
            isAdmin:false,
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
                isAdmin: me.options.isAdmin,
                onInputFocus: layout.onInputFocus,
                onInputBlur: layout.onInputBlur
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
                    "search/:keyword": "transitionToSearch",
                    "favorites": "transitionToFavorites",
                    "recent": "transitionToRecent",
                    "createDashboard/:name": "transitionToCreateDashboard"
                }
            });

            // Hook the router route event
            me.router.on(events.routerRoute(), function (event, data) {
                me._onRoute.apply(me, arguments);
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
            var path = args = keyword = name = data.args[0];

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
                var path = startParam > 0 ? args.substring(1, startParam) : args;
                var params = startParam > 0 ? args.substring(startParam + 1) : null;
                if (params) params = params.length > 0 ? forerunner.ssr._internal.getParametersFromUrl(params) : null;
                if (params) params = JSON.stringify({ "ParamsList": params });
                me.transitionToReportViewer(path, params);
            } else if (data.name === "transitionToOpenResource") {
                me.transitionToReportManager(path, "resource");
            } else if (data.name === "transitionToSearch") {
                me.transitionToReportManager(keyword, "search");
            } else if (data.name === "transitionToFavorites") {
                me.transitionToReportManager(null, "favorites");
            } else if (data.name === "transitionToRecent") {
                me.transitionToReportManager(null, "recent");
            } else if (data.name === "transitionToCreateDashboard") {
                me.transitionToCreateDashboard(name);
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
                // Do not trigger for Firefox when we are changing the anchor
                var trigger = !forerunner.device.isFirefox() || me._lastAction === action || !me._lastAction;
                me.router.router("navigate", targetUrl, { trigger: trigger, replace: false });
            }
            me._lastAction = action;
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

                layout.$rightheader.height(layout.$topdiv.height());
                layout.$leftheader.height(layout.$topdiv.height());
                layout.$rightheaderspacer.height(layout.$topdiv.height());
                layout.$leftheaderspacer.height(layout.$topdiv.height());

                layout._selectedItemPath = path0; //me._selectedItemPath = path0;
                var explorer = $(".fr-report-explorer", me.$reportExplorer);
                me.element.css("background-color", explorer.css("background-color"));
            }, timeout);
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

            //Update isAdmin
            if (!me.$reportExplorer)
                me._createReportExplorer();
            var settings = me.$reportExplorer.reportExplorer("getUserSettings");
            if (settings && settings.adminUI === true )
                me.options.isAdmin = true;
            else
                me.options.isAdmin = false;

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
                    isAdmin: me.options.isAdmin,
                });

                var $reportViewer = layout.$mainviewport.reportViewerEZ("getReportViewer");
                if ($reportViewer && path !== null) {
                    path = String(path).replace(/%2f/g, "/");                    
                    $reportViewer.reportViewer("loadReport", path, 1, params);
                    layout.$mainsection.fadeIn("fast");
                }

            }, timeout);

            me.element.css("background-color", "");
        },
        /**
         * Transition to Create Dashboard view
         *
         * @function $.forerunner.reportExplorerEZ#transitionToCreateDashboard
         * @param {String} name - Name of the dashboard template
         */
        transitionToCreateDashboard: function (templateName) {
            var me = this;
            var layout = me.DefaultAppTemplate;
            layout.$mainsection.html("");
            layout.$mainsection.hide();
            forerunner.dialog.closeAllModalDialogs(layout.$container);

            layout._selectedItemPath = null;
            //Android and iOS need some time to clean prior scroll position, I gave it a 50 milliseconds delay
            //To resolved bug 909, 845, 811 on iOS
            var timeout = forerunner.device.isWindowsPhone() ? 500 : forerunner.device.isTouch() ? 50 : 0;
            setTimeout(function () {
                var $dashboardEditor = layout.$mainviewport.dashboardEditor({
                    navigateTo: me.options.navigateTo,
                    historyBack: me.options.historyBack
                });

                $dashboardEditor.dashboardEditor("loadTemplate", templateName);
            }, timeout);

            me.element.css("background-color", "");
        },
        _init: function () {
            var me = this;
            me.DefaultAppTemplate = new forerunner.ssr.DefaultAppTemplate({ $container: me.element, isFullScreen: me.isFullScreen }).render();

            if (!me.options.navigateTo) {
                me._initNavigateTo();
            }
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
    var dashboards = forerunner.localize.getLocData(forerunner.config.forerunnerFolder() + "Dashboard/dashboards/dashboards");
    var templates = dashboards.templates;
    var createDashboard = locData.createDashboard;

    /**
     * Widget used to select a new dashbard template
     *
     * @namespace $.forerunner.createDashboard
     * @prop {Object} options - The options for the create dashboard dialog
     * @prop {String} options.$reportViewer - Report viewer widget
     * @prop {Object} options.$appContainer - Report page container
     *
     * @example
     * $("#createDashboardDialog").createDashboard({
     *    $appContainer: me.options.$appContainer,
     *    $reportViewer: $viewer,
     /  });
     */
    $.widget(widgets.getFullname(widgets.createDashboard), {
        options: {
            $reportExplorer: null,
            $appContainer: null,
            model: null
        },
        _createOptions: function() {
            var me = this;

            me.$select = me.element.find(".fr-cdb-select-id")

            for (item in templates) {
                var $option = $("<option value=" + item + ">" + templates[item] + "</option>");
                me.$select.append($option);
            }
        },
        _init: function() {
        },
        _create: function () {
            var me = this;

            me.element.html("");

            var headerHtml = forerunner.dialog.getModalDialogHeaderHtml("fr-icons24x24-createdashboard", createDashboard.title, "fr-cdb-cancel", createDashboard.cancel);
            var $dialog = $(
                "<div class='fr-core-dialog-innerPage fr-core-center'>" +
                    headerHtml +
                    "<form class='fr-cdb-form fr-core-dialog-form'>" +
                        "<div class='fr-core-center'>" +
                            "<select class='fr-cdb-select-id'>" +
                            "</select>" +
                            "<div class='fr-core-dialog-submit-container'>" +
                                "<div class='fr-core-center'>" +
                                    "<input name='submit' type='button' class='fr-cdb-submit-id fr-core-dialog-submit fr-core-dialog-button' value='" + createDashboard.submit + "' />" +
                                "</div>" +
                            "</div>" +

                        "</div>" +
                    "</form>" +
                "</div>");

            me.element.append($dialog);

            me._createOptions();

            me.$form = me.element.find(".fr-cdb-form");

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

            // Call navigateTo to bring up the create dashboard view
            var navigateTo = me.options.$reportExplorer.reportExplorer("option", "navigateTo");
            var name = me.$select.val();
            navigateTo("createDashboard", name);

            me.closeDialog();
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
    }); //$.widget
});
///#source 1 1 /Forerunner/Dashboard/js/DashboardBase.js
/**
 * @file Contains the dashboardBase widget.
 *
 */

var forerunner = forerunner || {};
forerunner.ssr = forerunner.ssr || {};

$(function () {
    var widgets = forerunner.ssr.constants.widgets;
    var events = forerunner.ssr.constants.events;

    /**
     * The dashboardBase widget is used as a base namespace for dashboardEditor and
     * dashboardViewer
     *
     * @namespace $.forerunner.dashboardBase
     * @prop {Object} options - The options for dashboardBase
     * @prop {String} options.dashboardState - The dashboardState holds the complete
     *                                         state of the dashboard editing and / or
     *                                         viewing experience.
     */
    $.widget(widgets.getFullname(widgets.dashboardBase), {
        options: {
        },
        _init: function () {
            var me = this;
            me.clearState();
            me.element.html("");
        },
        clearState: function () {
            var me = this;
            me.dashboardDef = {
                templateName: null,
                template: null,
                reports: {}
            };
        },
        _destory: function () {
        }
    });  // $widget
});  // function()

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

    /**
     * Widget used to create and edit dashboards
     *
     * @namespace $.forerunner.dashboardEditor
     * @prop {Object} options - The options for dashboardEditor
     * @prop {String} options.reportViewerAPI - Path to the REST calls for the reportViewer
     */
    $.widget(widgets.getFullname(widgets.dashboardEditor), $.forerunner.dashboardBase /** @lends $.forerunner.dashboardEditor */, {
        options: {
            reportViewerAPI: forerunner.config.forerunnerAPIBase() + "ReportManager",
        },
        loadTemplate: function (templateName) {
            var me = this;
            var template = forerunner.localize.getLocData(forerunner.config.forerunnerFolder() + "Dashboard/dashboards/" + templateName, "text");
            me.dashboardDef.template = template;
            me._renderTemplate();
        },
        _renderTemplate: function () {
            var me = this;
            me.element.html(me.dashboardDef.template);
        },
        _create: function () {
        },
        _init: function () {
            var me = this;
            me._super();
        },
        _destroy: function () {
        }
    });  // $.widget
});   // $(function

///#source 1 1 /Forerunner/Dashboard/js/DashboardViewer.js
/**
 * @file Contains the dashboardViewer widget.
 *
 */

var forerunner = forerunner || {};
forerunner.ssr = forerunner.ssr || {};

$(function () {
    var widgets = forerunner.ssr.constants.widgets;
    var events = forerunner.ssr.constants.events;

    /**
     * Widget used to view dashboards
     *
     * @namespace $.forerunner.dashboardViewer
     * @prop {Object} options - The options for dashboardEditor
     * @prop {String} options.reportViewerAPI - Path to the REST calls for the reportViewer
     */
    $.widget(widgets.getFullname(widgets.dashboardViewer), $.forerunner.dashboardBase /** @lends $.forerunner.dashboardViewer */, {
        options: {
            reportViewerAPI: forerunner.config.forerunnerAPIBase() + "ReportManager",
        },
        _create: function () {
            var me = this;
        },
        _init: function () {
            var me = this;
            me._super();
        },
        _destroy: function () {
        },
    });  // $.widget
});   // $(function



