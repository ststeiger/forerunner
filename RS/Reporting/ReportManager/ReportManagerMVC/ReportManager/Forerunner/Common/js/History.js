/**
 * @file
 *  Defines the forerunner router and history widgets
 *
 *  This code was converted from the Backbone.js fragments. The Event
 *  handling specific to Backbone was re-written to use jquery event
 *  support.
 */

var forerunner = forerunner || {};
forerunner.ssr = forerunner.ssr || {};

$(function () {
    var widgets = forerunner.ssr.constants.widgets;
    var events = forerunner.ssr.constants.events;

    var isFunction = function (obj) {
        return typeof obj === 'function';
    };

    var isRegExp = function (obj) {
        return toString.call(obj) == '[object RegExp]';
    };

    // ---------------------------
    // Adapted from backbone.js

    var slice = Array.prototype.slice;
    var splice = Array.prototype.splice;

    // Cached regular expressions for matching named param parts and splatted
    // parts of route strings.
    var namedParam = /:\w+/g;
    var splatParam = /\*\w+/g;
    var escapeRegExp = /[-[\]{}()+?.,\\^$|#\s]/g;

    /**
     * The router widget is used to provide methods for routing client-side pages,
     * and connecting them to actions and events.
     *
     * @namespace $.forerunner.router
     * @prop {Object} options - The options for router
     * @prop {String} options.routes - hash of routes.
     * @example
     * routes: {
     *   "help/:page":         "help",
     *   "download/*path":     "download",
     *   "folder/:name":       "openFolder",
     *   "folder/:name-:mode": "openFolder"
     * }
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
         * @param {String} name - will be triggered as an event
         * @param {String} callback - function to call when a route is matched if
         *                            callback is ommitted me[name] will be used
         * @example
         */
        route: function (route, name, callback) {
            var me = this;
            if (!isRegExp(route)) {
                route = me._routeToRegExp(route);
            }
            if (!callback) {
                callback = me.options[name];
            }

            forerunner.history.history("route", route, function (fragment) {
                var args = me._extractParameters(route, fragment);
                callback && callback.apply(me, args);
                me._trigger(events.route, null, { name: name, args: args });
                forerunner.history.history("triggerRoute", {route: me, name: name, args: args});
            });
            return me;
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
        },

        // Bind all defined routes to `forerunner.history`. We have to reverse the
        // order of the routes here to support behavior where the most general
        // routes can be defined at the bottom of the route map.
        _bindRoutes: function() {
            if (!this.routes) return;
            var routes = [];
            for (var route in this.routes) {
                routes.unshift([route, this.routes[route]]);
            }
            for (var i = 0, l = routes.length; i < l; i++) {
                this.route(routes[i][0], routes[i][1], this[routes[i][1]]);
            }
        },

        // Convert a route string into a regular expression, suitable for matching
        // against the current location hash.
        _routeToRegExp: function(route) {
            route = route.replace(escapeRegExp, '\\$&')
                         .replace(namedParam, '([^\/]+)')
                         .replace(splatParam, '(.*?)');
            return new RegExp('^' + route + '$');
        },

        // Given a route, and a URL fragment that it matches, return the array of
        // extracted parameters.
        _extractParameters: function(route, fragment) {
            return route.exec(fragment).slice(1);
        }
    });  // $.widget

    // Cached regex for cleaning leading hashes and slashes .
    var routeStripper = /^[#\/]/;

    // Cached regex for detecting MSIE.
    var isExplorer = /msie [\w.]+/;

    // Has the history handling already been started?
    var historyStarted = false;

    /**
     * The history widget is a singleton widget accessed via the reference
     * forerunner.history.
     *
     * @namespace $.forerunner.history
     * @prop {Object} options - The options for router
     * @prop {String} options.oooo - oooo option
     * @example
     */
    $.widget(widgets.getFullname(widgets.history), {
        options: {
        },
        _create: function () {
            var me = this;
            this.handlers = [];
        },
        _init: function () {
        },
        // The default interval to poll for hash changes, if necessary, is
        // twenty times a second.
        _interval: 50,

        // Gets the true hash value. Cannot use location.hash directly due to bug
        // in Firefox where location.hash will always be decoded.
        _getHash: function(windowOverride) {
            var loc = windowOverride ? windowOverride.location : window.location;
            var match = loc.href.match(/#(.*)$/);
            return match ? match[1] : '';
        },

        // Get the cross-browser normalized URL fragment, either from the URL,
        // the hash, or the override.
        _getFragment: function(fragment, forcePushState) {
            if (fragment == null) {
                if (this._hasPushState || forcePushState) {
                    fragment = window.location.pathname;
                    var search = window.location.search;
                    if (search) fragment += search;
                } else {
                    fragment = this._getHash();
                }
            }
            if (!fragment.indexOf(this.options.root)) fragment = fragment.substr(this.options.root.length);
            return fragment.replace(routeStripper, '');
        },

        /**
         * triggers a historyroute event
         *
         * @function $.forerunner.history#triggerRoute
         *
         * @param {Object} data - Data passed to the event
         */
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
            if (historyStarted) throw new Error("forerunner.history has already been started");
            historyStarted = true;

            // Figure out the initial configuration. Do we need an iframe?
            // Is pushState desired ... is it available?
            $.extend(me.options, { root: '/' }, options);
            me._wantsHashChange = me.options.hashChange !== false;
            me._wantsPushState  = !!me.options.pushState;
            me._hasPushState    = !!(me.options.pushState && window.history && window.history.pushState);
            var fragment          = me._getFragment();
            var docMode           = document.documentMode;
            var oldIE             = (isExplorer.exec(navigator.userAgent.toLowerCase()) && (!docMode || docMode <= 7));

            if (oldIE) {
                me.iframe = $('<iframe src="javascript:0" tabindex="-1" />').hide().appendTo('body')[0].contentWindow;
                me.navigate(fragment);
            }

            // Depending on whether we're using pushState or hashes, and whether
            // 'onhashchange' is supported, determine how we check the URL state.
            if (me._hasPushState) {
                $(window).on('popstate', function() {
                    me.checkUrl.call(me);
                });
            } else if (me._wantsHashChange && ('onhashchange' in window) && !oldIE) {
                $(window).on('hashchange', function () {
                    me.checkUrl.call(me);
                });
            } else if (me._wantsHashChange) {
                me._checkUrlInterval = setInterval(me.checkUrl, me._interval);
            }

            // Determine if we need to change the base url, for a pushState link
            // opened by a non-pushState browser.
            me.fragment = fragment;
            var loc = window.location;
            var atRoot  = loc.pathname == me.options.root;

            // If we've started off with a route from a `pushState`-enabled browser,
            // but we're currently in a browser that doesn't support it...
            if (me._wantsHashChange && me._wantsPushState && !me._hasPushState && !atRoot) {
                me.fragment = me._getFragment(null, true);
                window.location.replace(me.options.root + '#' + me.fragment);
                // Return immediately as browser will do redirect to new url
                return true;

                // Or if we've started out with a hash-based route, but we're currently
                // in a browser where it could be `pushState`-based instead...
            } else if (me._wantsPushState && me._hasPushState && atRoot && loc.hash) {
                me.fragment = me._getHash().replace(routeStripper, '');
                window.history.replaceState({}, document.title, loc.protocol + '//' + loc.host + me.options.root + me.fragment);
            }

            if (!me.options.silent) {
                return me.loadUrl();
            }
        },

        // Disable Backbone.history, perhaps temporarily. Not useful in a real app,
        // but possibly useful for unit testing Routers.
        stop: function () {
            $(window).off('popstate', this.checkUrl).off('hashchange', this.checkUrl);
            clearInterval(this._checkUrlInterval);
            historyStarted = false;

            // Clear all the route handlers. This is done this way to support unit testing.
            // Each time a test is run and start is called the routes must be setup for that
            // test. Then at the end of the test call stop.
            this.handlers.length = 0;
        },

        // Add a route to be tested when the fragment changes. Routes added later
        // may override previous routes.
        route: function(route, callback) {
            this.handlers.unshift({route: route, callback: callback});
        },

        // Checks the current URL to see if it has changed, and if it has,
        // calls `loadUrl`, normalizing across the hidden iframe.
        checkUrl: function(e) {
            var current = this._getFragment();
            if (current == this.fragment && this.iframe) {
                current = this._getFragment(this._getHash(this.iframe));
            }
            if (current == this.fragment) {
                return false;
            }
            if (this.iframe) {
                this.navigate(current);
            }
            this.loadUrl() || this.loadUrl(this._getHash());
        },

        // Attempt to load the current URL fragment. If a route succeeds with a
        // match, returns `true`. If no defined routes matches the fragment,
        // returns `false`.
        loadUrl: function(fragmentOverride) {
            var fragment = this.fragment = this._getFragment(fragmentOverride);
            var matched = this.handlers.some(function (handler) {
                if (handler.route.test(fragment)) {
                    handler.callback(fragment);
                    return true;
                }
            });
            return matched;
        },

        // Save a fragment into the hash history, or replace the URL state if the
        // 'replace' option is passed. You are responsible for properly URL-encoding
        // the fragment in advance.
        //
        // The options object can contain `trigger: true` if you wish to have the
        // route callback be fired (not usually desirable), or `replace: true`, if
        // you wish to modify the current URL without adding an entry to the history.
        navigate: function(fragment, options) {
            if (!historyStarted) return false;
            if (!options || options === true) options = {trigger: options};
            var frag = (fragment || '').replace(routeStripper, '');
            if (this.fragment == frag) return;

            // If pushState is available, we use it to set the fragment as a real URL.
            if (this._hasPushState) {
                if (frag.indexOf(this.options.root) != 0) frag = this.options.root + frag;
                this.fragment = frag;
                window.history[options.replace ? 'replaceState' : 'pushState']({}, document.title, frag);

                // If hash changes haven't been explicitly disabled, update the hash
                // fragment to store history.
            } else if (this._wantsHashChange) {
                this.fragment = frag;
                this._updateHash(window.location, frag, options.replace);
                if (this.iframe && (frag != this._getFragment(this._getHash(this.iframe)))) {
                    // Opening and closing the iframe tricks IE7 and earlier to push a history entry on hash-tag change.
                    // When replace is true, we don't want this.
                    if(!options.replace) this.iframe.document.open().close();
                    this._updateHash(this.iframe.location, frag, options.replace);
                }

                // If you've told us that you explicitly don't want fallback hashchange-
                // based history, then `navigate` becomes a page refresh.
            } else {
                window.location.assign(this.options.root + fragment);
            }
            if (options.trigger) this.loadUrl(fragment);
        },

        // Update the hash location, either replacing the current entry, or adding
        // a new one to the browser history.
        _updateHash: function(location, fragment, replace) {
            if (replace) {
                location.replace(location.toString().replace(/(javascript:|#).*$/, '') + '#' + fragment);
            } else {
                location.hash = fragment;
            }
        }
    });  // $.widget
    // Adapted from backbone.js
    // ---------------------------

    // Create the singleton history object
    forerunner.history = $({}).history({});

});  // $(function
