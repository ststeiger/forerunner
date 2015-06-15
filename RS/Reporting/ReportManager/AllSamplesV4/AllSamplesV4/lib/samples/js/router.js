var allSamples = allSamples || {};

$(function () {
    var widgets = forerunner.ssr.constants.widgets;
    var events = forerunner.ssr.constants.events;
    var routerId = "allSamples";

    // showSampleSection
    //
    // Toggles the active sample section
    var showSampleSection = function (samplePaneId) {
        var $samplecontent = $(".as-sample-content");
        var $samplePane = $samplecontent.find("#" + samplePaneId);
        if ($samplePane.hasClass("active")) {
            return;
        }
        $samplecontent.find(".as-sample-pane").removeClass("active");
        $samplePane.addClass("active");
    }

    // convertLink
    //
    // Converts the URL from a page request to a route. That way we can keep AllSamplesV4 a Single Page Application
    var convertLink = function (data) {
        var html = data.replace(/href=\"\/Help/g, 'href="#as-help');
        return html;
    }

    // fetch
    //
    // fetch will retrieve the contents of the given URL and display it in the given target id
    //
    // Where:
    //  force = Always refresh target with the contents of url
    //  callback = Allow the contents to be processed before being displayed
    allSamples.fetch = function (target, url, force, callback) {
        var doFetch = force;
        var $target = $("#" + target);
        var $sampleArea = $target.find(".as-sample");
        if ($sampleArea.length === 0) {
            $sampleArea = $("<div class='as-sample'></div>")
            $target.html("");
            $target.append($sampleArea);
            doFetch = true;
        }

        if (doFetch) {
            $.ajax({
                url: url,
                success: function (data) {
                    if (callback) {
                        $sampleArea.html(callback(data));
                    } else {
                        $sampleArea.html(data);
                    }
                },
                error: function (jqXHR, textStatus, errorThrown) {
                    $sampleArea.html(jqXHR.responseText);
                }
            });
        }
    }

    // allSamples.router
    //
    // Holds the instance of the forerunner router widget. The router widget provides
    // the event processing for Hashtag navigation.
    allSamples.router = $({}).router({
        routes: {
            "as-home": "as-home",
            "as-explorer": "as-explorer",
            "as-viewer": "as-viewer",
            "as-addbutton": "as-addbutton",
            "as-removebutton": "as-removebutton",
            "as-dashboard": "as-dashboard",
            "as-selector": "as-selector",
            "as-params": "as-params",
            "as-help/Api/:ApiId": "as-help",
            "as-help": "as-help"
        },
        id: routerId
    });

    // onRoute
    //
    // Event handler that processes the forerunner.history route event.
    allSamples.router.onRoute = function (e, data) {
        var me = this;

        if (data.route.options.id && data.route.options.id !== routerId) {
            // Show the as-explorer section for any / all reportExplorerEZ routes
            showSampleSection("as-explorer");
        } else if (data.name === "as-home") {
            var url = forerunner.config._getVirtualRootBase() + "Home/Home";
            allSamples.fetch(data.name, url);
            showSampleSection(data.name);
        } else if (data.name === "as-explorer") {
            showSampleSection(data.name);
        } else if (data.name === "as-viewer") {
            allSamples.reportViewerEZ.init(data.name);
            showSampleSection(data.name);
        } else if (data.name === "as-addbutton") {
            allSamples.addButton.init(data.name);
            showSampleSection(data.name);
        } else if (data.name === "as-removebutton") {
            allSamples.removeButton.init(data.name);
            showSampleSection(data.name);
        } else if (data.name === "as-dashboard") {
            allSamples.dashboard.init(data.name);
            showSampleSection(data.name);
        } else if (data.name === "as-selector") {
            allSamples.selector.init(data.name);
            showSampleSection(data.name);
        } else if (data.name === "as-params") {
            allSamples.parameters.init(data.name);
            showSampleSection(data.name);
        } else if (data.name === "as-help") {
            var url = forerunner.config._getVirtualRootBase() + "Help";
            if (data.args[0]) {
                // If the ApiId parameter is given then this is an API reference
                url = forerunner.config._getVirtualRootBase() + "Help/Api/foo" + data.args[0];
            }
            allSamples.fetch(data.name, url, true, convertLink);
            showSampleSection(data.name);
        }
    }

    // Hook the history route event, we need to hook the history event here and not the 
    // specific router because we want to see the reportExplorerEZ routes also
    forerunner.history.on(events.historyRoute(), function (event, data) {
        var me = this;
        allSamples.router.onRoute.apply(me, arguments);
    });

});  // function()
