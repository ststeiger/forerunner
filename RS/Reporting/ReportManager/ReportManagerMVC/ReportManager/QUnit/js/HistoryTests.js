var forerunner = forerunner || {};
forerunner.ssr = forerunner.ssr || {};

var TestMetrics = function () {
    TestMetrics.prototype.resetCounters();
}

TestMetrics.prototype = {
    reportPath: "/Northwind Test Suite/action URL",
    resetCounters: function () {
        this.homeCount = 0;
        this.favoritesCount = 0;
        this.browseCount = 0;
    },
    verifyReportPath: function (path) {
        ok(path === this.reportPath, "Verify that the path argument is correct");
    },
    verifyCounters: function (homeCount, favoritesCount, browseCount) {
        ok(this.homeCount === homeCount, "homeCount =" + this.homeCount);
        ok(this.favoritesCount === favoritesCount, "favoritesCount =" + this.favoritesCount);
        ok(this.browseCount === browseCount, "browseCount =" + this.browseCount);
    }
}

// All the tests can share these metrics
var metrics = new TestMetrics();

// Backbone router defined a BB router that uses callbacks. This will be used as the benchmark
// test data by which all the other forerunner router tests will be compared
var BBRouter = Backbone.Router.extend({
    routes: {
        "": "home",
        "favorites": "favorites",
        "browse/:path": "browse"
    },
    home: function () {
        metrics.homeCount++;
    },
    favorites: function () {
        metrics.favoritesCount++;
    },
    browse: function (path) {
        metrics.browseCount++;
        metrics.verifyReportPath(path);
    }
});

// CallbackRouter defines a router object that uses callbacks to handle the routes
var CallbackRouter = function () {
    var router = $({}).router({
        routes: {
            "": "home",
            "favorites": "favorites",
            "browse/:path": "browse"
        },
        home: function () {
            metrics.homeCount++;
        },
        favorites: function () {
            metrics.favoritesCount++;
        },
        browse: function (path) {
            metrics.browseCount++;
            metrics.verifyReportPath(path);
        },
    });
    return router;
}

// EventRouter defines a router that does not define callback functions
var EventRouter = function () {
    var router = $({}).router({
        routes: {
            "": "home",
            "favorites": "favorites",
            "browse/:path": "browse"
        },
    });
    return router;
}

// This is the benchmark test. All forerunner tests must work like this test
test("Backbone Router Callback Test", function () {
    metrics.resetCounters();

    // Make sure the hash is at the home before we start the tests
    location.hash = "#";

    // Start the history widget
    var router = new BBRouter();
    Backbone.history.start();

    // Cycle through the routes
    router.navigate("#favorites", { trigger: true, replace: false });
    router.navigate("#browse/" + encodeURIComponent(metrics.reportPath), { trigger: true, replace: false });

    // Unhook the history event handlers
    Backbone.history.stop();

    // Verify the results
    metrics.verifyCounters(1, 1, 1);
});

// This is the exact same test done using the forerunner widgets. This
// test must work exactly the same as the "Backbone Router Callback Test"
test("Forerunner Router Callback Test", function () {
    metrics.resetCounters();

    // Make sure the hash is at the home before we start the tests
    location.hash = "#";

    // Start the history widget
    var router = new CallbackRouter();
    forerunner.history.history("start");

    // Cycle through the routes
    router.router("navigate", "#favorites", { trigger: true, replace: false });
    router.router("navigate", "#browse/" + encodeURIComponent(metrics.reportPath), { trigger: true, replace: false });

    // Unhook the history event handlers
    forerunner.history.history("stop");

    // Verify the results
    metrics.verifyCounters(1, 1, 1);
});

// This test will verify that the event handlers work correctly. The router event
// processing will trigger two events for each route one is triggered by the route
// and the second by the history object
test("Forerunner Router Event Test", function () {
    metrics.resetCounters();

    var me = this;
    var events = forerunner.ssr.constants.events;
    var onRoute = function (event, data) {
        if (data.name === "home") {
            metrics.homeCount++;
        } else if (data.name === "favorites") {
            metrics.favoritesCount++;
        } else if (data.name === "browse") {
            metrics.browseCount++;
            metrics.verifyReportPath(data.args[0]);
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
    router.router("navigate", "#favorites", { trigger: true, replace: false });
    router.router("navigate", "#browse/" + encodeURIComponent(metrics.reportPath), { trigger: true, replace: false });

    // Unhook the history event handlers
    forerunner.history.history("stop");

    // Verify the results
    metrics.verifyCounters(2, 2, 2);
});
