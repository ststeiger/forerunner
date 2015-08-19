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

    // convertHelpLink
    //
    // Converts the Help href from a page request to a route. This is needed to keep AllSamplesV4 a Single Page Application
    var convertHelpLink = function (data) {
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
    var fetch = function (target, url, force, callback) {
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

    // allSamples.sampleExists
    //
    // Returns true if the 'as.sample' <div> exists as a child of target
    allSamples.sampleExists = function (target) {
        var $target = $("#" + target);
        var $sampleArea = $target.find(".as-sample");
        return $sampleArea.length > 0;
    }

    // allSamples.getSampleArea
    //
    // Returns the sample-area child <div> of the given target
    allSamples.getSampleArea = function (target) {
        var $target = $("#" + target);
        var $sampleArea = $target.find(".as-sample");
        if ($sampleArea.length === 0) {
            $sampleArea = $("<div class='as-sample'></div>")
            $target.html($sampleArea);
        }

        return $sampleArea;
    }

    // onWindowResize
    //
    // The min-height of the sample container <div> needs to be set for the case where 
    // the report may need to have required parameters entered before it can be rendered.
    // In the case where the report is rendered the size of the report will determine the
    // height of the sample <div>.
    $(window).on("resize", function (e, data) {
        $asSample = $(".as-sample");
        var minHeight = $(window).height() - $(".navbar-inverse").outerHeight(true);
        $asSample.css({ minHeight: minHeight + "px" });
    });

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

    // allSamples.router.onRoute
    //
    // Event handler that processes the forerunner.history route event.
    allSamples.router.onRoute = function (e, data) {
        var me = this;

        if (data.route.options.id && data.route.options.id !== routerId) {
            // Show the as-explorer section for any / all reportExplorerEZ routes
            showSampleSection("as-explorer");
        } else if (data.name === "as-home") {
            var url = forerunner.config.virtualRootBase() + "Home/Home";
            fetch(data.name, url);
            showSampleSection(data.name);
        } else if (data.name === "as-explorer") {
            allSamples.reportExplorerEZ.init(data.name);
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
            var url = forerunner.config.virtualRootBase() + "Help";
            if (data.args[0]) {
                // If the ApiId parameter is given then this is an API reference
                url = forerunner.config.virtualRootBase() + "Help/Api/" + data.args[0];
            }
            fetch(data.name, url, true, convertHelpLink);
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
