var forerunner = forerunner || {};

$(function () {
    $(document).ready(function () {
        var url = $("#loginUrl").text();

        var pathname = window.location.pathname;
        var maxIndex = pathname.length - 1;
        if (pathname.substr(maxIndex, 1) === "/") {
            pathname = pathname.substr(0, maxIndex);
        }

        url = url.replace("~", "http://" + window.location.host + pathname);

        url += "?ReturnUrl=" + encodeURIComponent(window.location.href);

        window.location = url;

    });  // $(document).ready()

});  // $(function()
