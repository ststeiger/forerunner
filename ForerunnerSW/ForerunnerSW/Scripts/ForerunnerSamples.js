var demoServerURL = "http://demo.forerunnersw.com/SDKSamples/";
var demoLocalURL = "http://localhost:18228/";

var forerunnerswServerURL = "http://forerunnersw.com/Mobilizer/";
var forerunnerLocalURL = "http://localhost:31921//";

function GetSDKSamplesURL(filename) {
    var url = null;
    if (window.location.hostname == "localhost") {
        url = demoLocalURL + filename;
    } else {
        url = demoServerURL + filename;
    }
    return url;
}

function GetForerunnerswURL(filename) {
    var url = null;
    if (window.location.hostname == "localhost") {
        url = forerunnerLocalURL + filename;
    } else {
        url = forerunnerswServerURL + filename;
    }
    return url;
}

function NavigateToSDKSamplesURL(sampleName) {
    window.location.href = GetSDKSamplesURL(sampleName);
}

function ShowSampleDetail(filename, id) {
    $.ajax({
        url: GetForerunnerswURL(filename),
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


function ToggleSourceCode(filename, id) {
    var $div = $("#" + id);
    if ($div.html().trim().length > 0) {
        $div.html("");
        return;
    }
    $.ajax({
        url: GetSDKSamplesURL(filename),
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
