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
    $.ajax({
        url: GetSiteURL(app.Forerunnersw, filename),
        dataType: "text",
        async: false,
        success: function (data) {
            $("#" + id).html(data);
        },
        fail: function () {
            console.warn("ShowSampleDetail()" + "Failed");
        },
        error: function (jqXHR, textStatus, errorThrown) {
            console.warn("ShowSampleDetail()" + "error: " + errorThrown);
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
    if ($div.html().trim().length > 0) {
        $div.html("");
        return;
    }
    $.ajax({
        url: GetSiteURL(site, filename),
        dataType: "text",
        async: false,
        success: function (data) {
            var html = htmlEncode(data);
            $div.html(html);
            $div.removeClass("prettyprinted");
        },
        fail: function () {
            console.warn("ToggleSourceCode()" + "Failed");
        },
        error: function (jqXHR, textStatus, errorThrown) {

            console.warn("ToggleSourceCode()" + "error: " + errorThrown);
        },
    });
    prettyPrint();
}
