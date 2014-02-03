var app = {
    SDKSamples: 0,
    GettingStarted: 1,
    Forerunnersw: 2
}

var appURL = [
    // SDKSamples
    { local: "http://localhost:18228/", remote: "http://demo.forerunnersw.com/SDKSamples/" },

    // GettingStarted
    { local: "http://localhost:55087/", remote: "http://demo.forerunnersw.com/GettingStarted/" },

    // Forerunnersw
    { local: "http://localhost:31921/", remote: "http://forerunnersw.com/Mobilizer/" },
]

function GetSiteURL(site, filename) {
    var url = null;
    if (window.location.hostname == "localhost") {
        url = appURL[site].local + filename;
    } else {
        url = appURL[site].remote + filename;
    }
    return url;
}

function NavigateToSiteURL(site, sampleName) {
    window.location.href = GetSiteURL(site, sampleName);
}

function ShowSampleDetail(filename, id) {
    var url = GetSiteURL(app.Forerunnersw, filename);
    var $div = $("#" + id);
    $.ajax({
        url: url,
        dataType: "text",
        async: false,
        success: function (data) {
            $div.html(data);
        },
        fail: function () {
            console.warn("ShowSampleDetail()" + "Failed");
        },
        error: function (jqXHR, textStatus, errorThrown) {
            showError($div, errorThrown, jqXHR, url)
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
                      "<div class='sample-error-stack-details sample-error-text'>" + errorThrown.stack + "</div>" +
                      "</div>";
    }

    $div.html($(html));

    if (errorThrown && errorThrown.stack) {
        var $stackDetails = $div.find(".sample-error-stack-details");
        $stackDetails.hide();

        $stackTrack = $div.find(".sample-error-stack");
        $stackTrack.on("click", { $Detail: $stackDetails }, function (e) { e.data.$Detail.toggle() });
    }
}
