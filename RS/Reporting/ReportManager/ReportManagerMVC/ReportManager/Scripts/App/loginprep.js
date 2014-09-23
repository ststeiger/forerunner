var forerunner = forerunner || {};

$(function () {
    $(document).ready(function () {
        var returnUrl;
        var urlParts = document.URL.split("#");
        returnUrl = urlParts[0];
        var hashTag = null;
        if (urlParts.length > 1) {
            hashTag = urlParts[1];
        } else {
            hashTag = window.location.hash.replace("#", "");
        }

        var url = $("#loginUrl").text();
        if (window.location.pathname.toLowerCase() === "/debug") {
            url = url.replace("~", "http://" + window.location.host);
        } else {
            url = url.replace("~", "http://" + window.location.host + window.location.pathname);
        }

        url += "?ReturnUrl=" + encodeURIComponent(returnUrl);

        if (hashTag) {
            url = url + "&HashTag=" + encodeURIComponent(hashTag);
        }

        window.location = url;

    });  // $(document).ready()

});  // $(function()
