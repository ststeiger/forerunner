$(function () {
    var appEnum = {
        SDKSamples: 0,
        GettingStarted: 1,
        Forerunnersw: 2
    };
    
    var appURL = [
        // SDKSamples
        { local: "http://localhost:55089/", remote: "http://demo.forerunnersw.com/V1Samples/" },

        // GettingStarted
        { local: "http://localhost:55086/", remote: "http://demo.forerunnersw.com/V1GettingStarted/" },

        // Forerunnersw
        { local: "../", remote: "../" }
    ];

    function GetSiteURL(site, filename) {
        var url = null;
        if (window.location.hostname === "localhost") {
            url = appURL[site].local + filename;
        } else {
            url = appURL[site].remote + filename;
        }
        return url;
    }

    // This is global scope because it is called directly from the html page
    ShowSampleDetail = function(filename, id) {
        var url = GetSiteURL(appEnum.Forerunnersw, filename);
        var $div = $("#" + id);
        $.ajax({
            url: url,
            dataType: "text",
            async: false,
            success: function (data) {
                $div.html(data);
                createToggleSourceCodeElements($div);
            },
            fail: function () {
                console.warn("ShowSampleDetail()" + "Failed");
            },
            error: function (jqXHR, textStatus, errorThrown) {
                showError($div, errorThrown, jqXHR, url);
            },
        });
    }

    function ShowSampleOnLoad() {
        var sample = GetURLParameter("Sample");
        if (sample) {
            ShowSampleDetail("SampleDetail/" + sample, "SamplesDetailId");
        }

    }

    function evalNumberParameter(app) {
        var me = this;
        var result = null;
        if (typeof app === "number") {
            result = app;
        }
        else {
            result = eval(app);
        }
        return result;
    }

    // Used to generate a unique id for the <pre> tag
    var preCount = 1;

    $.widget("forerunnersw.toggleSourceCode", {
        options: {
            app: appEnum.SDKSamples,
            file: null,
            toggletext: "Click here to see the source code",
            buttontext: "Download File"
        },

        _create: function () {

        },

        _init: function () {
            var me = this;
            var app = evalNumberParameter(me.options.app);
            var id = "preId" + preCount++;

            me.element.html("");
            var html = $(
                "<table style='width:100%;'>" +
                    "<tr>" +
                        "<td><a onclick='ToggleSourceCode(" + app + ", \"" + me.options.file + "\", \"" + id + "\")'>" + me.options.toggletext + "</a></td>" +
                        "<td style='text-align: right;'><input onclick='DownloadSourceCode(" + app + ", \"" + me.options.file + "\")' type='button' value='" + me.options.buttontext + "'></td>" +
                    "</tr>" +
                    "<tr>" +
                        "<td colspan='2'><pre id='" + id + "' class='prettyprint'></pre></td>" +
                    "</tr>" +
                "</table>"
                );
            me.element.html(html);
        }
    });

    function setOptionFromDataAttr(options, $element, optionName) {
        var attrValue = $element.attr("data-" + optionName);
        if (attrValue) {
            options[optionName] = attrValue;
        }
    }

    function createToggleSourceCodeElements($container) {
        // Create any / all toggleSourceCode widgets
        var $toggleSourceCodeElements = $container.find(".toggle-source-code");
        $toggleSourceCodeElements.each(function (index, element) {
            var options = {};
            var $element = $(element);
            setOptionFromDataAttr(options, $element, "app");
            setOptionFromDataAttr(options, $element, "file");
            setOptionFromDataAttr(options, $element, "toggletext");
            setOptionFromDataAttr(options, $element, "buttontext");
            $element.toggleSourceCode(options);
        });
    }

    // This is global scope because it is called directly from the html page
    NavigateToSiteURL = function (site, sampleName) {
        var app = evalNumberParameter(site);
        window.open(GetSiteURL(app, sampleName), "_blank");
    }

    function htmlEncode(str) {
        return String(str)
                .replace(/&/g, "&amp;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#39;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;");
    }

    // This is global scope because it is called directly from the html page
    DownloadSourceCode = function(site, filename) {
        var url = GetSiteURL(site, "api/samplesdownload/GetSample?SampleName=" + filename + "&ResponseType=attachment");
        window.location.assign(url);
    }

    // This is global scope because it is called directly from the html page
    ToggleSourceCode = function (site, filename, id) {
        var $div = $("#" + id);
        var url = GetSiteURL(site, "api/samplesdownload/GetSample");
        if ($div.html().trim().length > 0) {
            $div.html("");
            return;
        }
        var noError = true;
        $.ajax({
            url: url,
            data: {
                SampleName: filename,
                ResponseType: "inline"
            },
            dataType: "text",
            async: false,
            success: function (data) {
                var html = htmlEncode(data);
                $div.html(html);
                $div.removeClass("prettyprinted");
            },
            fail: function () {
                noError = false;
                console.warn("ToggleSourceCode()" + "Failed");
            },
            error: function (jqXHR, textStatus, errorThrown) {
                noError = false;
                showError($div, errorThrown, jqXHR, url);
            },
        });
        if (noError) {
            prettyPrint();
        }
    }

    function showError($div, errorThrown, jqXHR, url) {
        var me = this;

        var html = "<div class='sample-error'>" +
                   "<div class='sample-error-text'>An unexpected error occured. Please try again later.</div><br/>" +
                   "<div class='sample-error-text'>Status: " + jqXHR.status + "</div>" +
                   "<div class='sample-error-text'>Status Text: " + jqXHR.statusText + "</div>";

        if (errorThrown && errorThrown.message) {
            html = html + "<div class='sample-error-text'>Message: " + errorThrown.message + "</div>";
        }

        html = html + "<div class='sample-error-text'>URL: <a href='" + url + "'>" + url + "</a></div>";

        if (errorThrown && errorThrown.stack) {
            html = html + "<a class='sample-error-stack'>StackTrace</a>" +
                          "<div class='sample-error-stack-details sample-error-text'>" + errorThrown.stack +
                          "</div>";
        }

        if (jqXHR.responseText && jqXHR.responseText.length > 0) {
            html = html + "<a class='sample-error-responsetext'>Response Text:</a>" +
                          "<div class='sample-error-responsetext-details sample-error-text'>" +
                          "<iframe class='sample-error-responsetext-details-iframe' sandbox='allow-same-origin'></iframe>" +
                          "</div>";
        }

        html = html + "</div>";

        $div.html($(html));

        if (jqXHR.responseText && jqXHR.responseText.length > 0) {
            var $iframe = $div.find(".sample-error-responsetext-details-iframe");
            $iframe.contents().find("html").html(jqXHR.responseText);
        }

        if (errorThrown && errorThrown.stack) {
            var $stackDetails = $div.find(".sample-error-stack-details");
            $stackDetails.hide();

            var $stackTrack = $div.find(".sample-error-stack");
            $stackTrack.on("click", { $Detail: $stackDetails }, function (e) { e.data.$Detail.toggle(); });
        }

        if (jqXHR.responseText && jqXHR.responseText.length > 0) {
            var $responseTextDetails = $div.find(".sample-error-responsetext-details");
            $responseTextDetails.hide();

            var $responseText = $div.find(".sample-error-responsetext");
            $responseText.on("click", { $Detail: $responseTextDetails }, function (e) {
                var $iframe = $div.find(".sample-error-responsetext-details-iframe");
                $iframe.contents().find("html").html(jqXHR.responseText);
                e.data.$Detail.toggle();
            });
        }
    }
    ShowSampleOnLoad();
});  // Function

