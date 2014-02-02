var forerunnerswURL = "http://forerunnersw.com/Mobilizer/";
var forerunnerswLocalURL = "http://localhost:31921//";

var SDKSamplesURL = "http://demo.forerunnersw.com/SDKSamples/";
var SDKSamplesLocalURL = "http://localhost:18228/";

var gettingStartedURL = "http://demo.forerunnersw.com/GettingStarted/";
var gettingStartedLocalURL = "http://localhost:55087/";

var app = {
    SDKSamples: 1,
    GettingStarted: 2,
    Forerunnersw: 3
}

function GetSiteURL(site, filename) {
    var url = null;
    if (window.location.hostname == "localhost") {
        if (site === app.SDKSamples) {
            url = SDKSamplesLocalURL + filename;
        } else if (site === app.GettingStarted) {
            url = gettingStartedLocalURL + filename;
        } else {
            url = forerunnerswLocalURL + filename;
        }
    } else {
        if (site === app.SDKSamples) {
            url = SDKSamplesURL + filename;
        } else if (site === app.GettingStarted) {
            url = gettingStartedURL + filename;
        } else {
            url = forerunnerswURL + filename;
        }
    }
    return url;
}

function NavigateToSiteURL(site, sampleName) {
    window.location.href = GetSiteURL(site, sampleName);
}

function ShowSampleDetail(filename, id) {
    var url = GetSiteURL(app.Forerunnersw, filename);
    $.ajax({
        url: url,
        dataType: "text",
        async: false,
        success: function (data) {
            $("#" + id).html(data);
        },
        fail: function () {
            console.warn("ShowSampleDetail()" + "Failed");
        },
        error: function (jqXHR, textStatus, errorThrown) {
            showError($div, errorThrown, url)
        },
    });
}

function htmlEncode (str) {
    return String(str)
            .replace(/&/g, "&amp;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
};

function ToggleSourceCode(site, filename, id) {
    var $div = $("#" + id);
    var url = GetSiteURL(site, filename);
    if ($div.html().trim().length > 0) {
        $div.html("");
        return;
    }
    var noError = true;
    $.ajax({
        url: url,
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
            showError($div, errorThrown, url);
        },
    });
    if (noError) {
        prettyPrint();
    }
}

function showError($div, errorThrown, url) {
    var me = this;

    $div.html($(
        "<div class='sample-error'>" +
            "<div class='sample-error-text'>An unexpected error occured. Please try again later.</div><br/>" +
            "<div class='sample-error-text'>Name: " + errorThrown.name + "</div>" +
            "<div class='sample-error-text'>Message: " + errorThrown.message + "</div>" +
            "<div class='sample-error-text'>URL: <a href='" + url + "'>" + url + "</a></div>" +
            "<div class='sample-error-text'>Code: " + errorThrown.code + "</div>" +
            "<a class='sample-error-stack'>StackTrace</a>" +
            "<div class='sample-error-stack-details sample-error-text'>" + errorThrown.stack + "</div>" +
        "</div>"));

    var $stackDetails = $div.find(".sample-error-stack-details");
    $stackDetails.hide();

    $stackTrack = $div.find(".sample-error-stack");
    $stackTrack.on("click", { $Detail: $stackDetails }, function (e) { e.data.$Detail.toggle() });
}
