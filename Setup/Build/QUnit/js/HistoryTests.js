// HistoryTests.js
//
// This file contains all QUnit based test that will verify that the forrunner.history and
// forerunner.router widgets are functions properly.

var forerunner = forerunner || {};
forerunner.ssr = forerunner.ssr || {};

var TestMetrics = function (SDKName) {
    TestMetrics.prototype.resetCounters();
    this.SDKName = SDKName;
}

TestMetrics.prototype = {
    reportPath: "/Northwind Test Suite/action URL",
    resetCounters: function () {
        this.homeCount = 0;
        this.favoritesCount = 0;
        this.browseCount = 0;
    },
    verifyReportPath: function (path) {
        ok(path === this.reportPath, this.SDKName + " - Verify that the path argument is correct");
    },
    verifyCounters: function (homeCount, favoritesCount, browseCount) {
        ok(this.homeCount === homeCount, this.SDKName + " - homeCount = " + this.homeCount);
        ok(this.favoritesCount === favoritesCount, this.SDKName + " - favoritesCount = " + this.favoritesCount);
        ok(this.browseCount === browseCount, this.SDKName + " - browseCount = " + this.browseCount);
    }
}

// All the tests can share these metrics
var frMetrics = new TestMetrics("forerunner");
var bbMetrics = new TestMetrics("backbone");

// Backbone router defined a BB router that uses callbacks. This will be used as the benchmark
// test data by which all the other forerunner router tests will be compared
var BBRouter = Backbone.Router.extend({
    routes: {
        "": "home",
        "bbHome": "home",
        "bbFavorites": "favorites",
        "bbBrowse/:path": "browse"
    },
    home: function () {
        bbMetrics.homeCount++;
    },
    favorites: function () {
        bbMetrics.favoritesCount++;
    },
    browse: function (path) {
        bbMetrics.browseCount++;
        bbMetrics.verifyReportPath(path);
    }
});

// CallbackRouter defines a router object that uses callbacks to handle the routes
var CallbackRouter = function () {
    var router = $({}).router({
        routes: {
            "": "home",
            "frHome": "home",
            "frFavorites": "favorites",
            "frBrowse/:path": "browse"
        },
        home: function () {
            frMetrics.homeCount++;
        },
        favorites: function () {
            frMetrics.favoritesCount++;
        },
        browse: function (path) {
            frMetrics.browseCount++;
            frMetrics.verifyReportPath(path);
        },
    });
    return router;
}

// EventRouter defines a router that does not define callback functions
var EventRouter = function () {
    var router = $({}).router({
        routes: {
            "": "home",
            "frHome": "home",
            "frFavorites": "favorites",
            "frBrowse/:path": "browse"
        },
    });
    return router;
}

// This is the benchmark test. All forerunner tests must work like this test
test("Backbone Router Callback Test", function () {
    bbMetrics.resetCounters();

    // Make sure the hash is at the home before we start the tests
    location.hash = "#";

    // Start the history widget
    var router = new BBRouter();
    Backbone.history.start();

    // Cycle through the routes
    router.navigate("#bbFavorites", { trigger: true, replace: false });
    router.navigate("#bbBrowse/" + encodeURIComponent(bbMetrics.reportPath), { trigger: true, replace: false });

    // Unhook the history event handlers
    Backbone.history.stop();

    // Verify the results
    bbMetrics.verifyCounters(1, 1, 1);
});

// This test must produce the exact same results as the "Backbone Router Callback Test"
test("Forerunner Router Callback Test", function () {
    frMetrics.resetCounters();

    // Make sure the hash is at the home before we start the tests
    location.hash = "#";

    // Start the history widget
    var router = new CallbackRouter();
    forerunner.history.history("start");

    // Cycle through the routes
    router.router("navigate", "#frFavorites", { trigger: true, replace: false });
    router.router("navigate", "#frBrowse/" + encodeURIComponent(frMetrics.reportPath), { trigger: true, replace: false });

    // Unhook the history event handlers
    forerunner.history.history("stop");

    // Verify the results
    frMetrics.verifyCounters(1, 1, 1);
});

// This test will verify that the event handlers work correctly. The router event
// processing will trigger two events for each route one is triggered by the route
// and the second by the history object
test("Forerunner Router Event Test", function () {
    frMetrics.resetCounters();

    var me = this;
    var events = forerunner.ssr.constants.events;
    var onRoute = function (event, data) {
        if (data.name === "home") {
            frMetrics.homeCount++;
        } else if (data.name === "favorites") {
            frMetrics.favoritesCount++;
        } else if (data.name === "browse") {
            frMetrics.browseCount++;
            frMetrics.verifyReportPath(data.args[0]);
        }
    }

    // Create the router and hook the events
    var router = new EventRouter();
    router.on(events.routerRoute(), onRoute);
    forerunner.history.on(events.historyRoute(), onRoute);

    // Make sure the hash is at the home before we start the tests
    location.hash = "#";

    // Start the history widget
    forerunner.history.history("start");

    // Cycle through the routes
    router.router("navigate", "#frFavorites", { trigger: true, replace: false });
    router.router("navigate", "#frBrowse/" + encodeURIComponent(frMetrics.reportPath), { trigger: true, replace: false });

    // Unhook the history event handlers
    forerunner.history.history("stop");
    router.off(events.routerRoute(), onRoute);
    forerunner.history.off(events.historyRoute(), onRoute);

    // Verify the results
    frMetrics.verifyCounters(2, 2, 2);
});

test("Backbone & forerunner Coexist Test", function () {
    bbMetrics.resetCounters();
    frMetrics.resetCounters();

    // Make sure the hash is at the home before we start the tests
    location.hash = "#";

    // Start forerunner.history widget
    var frRouter = new CallbackRouter();
    forerunner.history.history("start");

    // Start the Backbone.history
    var bbRouter = new BBRouter();
    Backbone.history.start();

    // Cycle through the routes in an inter-leaved order
    bbRouter.navigate("#bbFavorites", { trigger: true, replace: false });
    frRouter.router("navigate", "#frFavorites", { trigger: true, replace: false });
    bbRouter.navigate("#bbBrowse/" + encodeURIComponent(bbMetrics.reportPath), { trigger: true, replace: false });
    frRouter.router("navigate", "#frBrowse/" + encodeURIComponent(frMetrics.reportPath), { trigger: true, replace: false });

    // Unhook the history event handlers
    Backbone.history.stop();
    forerunner.history.stop();

    // Verify the results
    frMetrics.verifyCounters(1, 1, 1);
    bbMetrics.verifyCounters(1, 1, 1);
});
