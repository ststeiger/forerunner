var forerunner = forerunner || {};

$(function () {
    $(document).ready(function () {
        var locData = forerunner.localize.getLocData(forerunner.config.forerunnerFolder() + 'ReportViewer/loc/ReportViewer');
        $('#username').attr('placeholder', locData.placeholders.Username);
        if (forerunner.device.isMSIE8())
            $('#password').attr('placeholder', '').attr("data-placeholder-value", '').val('');
        else
            $('#password').attr('placeholder', locData.placeholders.Password);
        $('#login').attr('value', locData.placeholders.Login);

        $form = $("form");
        // Fix up the ReturnUrl
        var urlParts = document.URL.split("ReturnUrl=");
        if (urlParts.length > 1) {
            var returnUrl = urlParts[1];
            urlParts = returnUrl.split("#");
            returnUrl = urlParts[0];
            var hashTag = null;
            if (urlParts.length > 1) {
                hashTag = urlParts[1];
            } else {
                hashTag = window.location.hash.replace("#", "");
            }
            var action = $form.attr("action");
            urlParts = action.split("ReturnUrl=");
            action = urlParts[0] + "ReturnUrl=" + returnUrl;
            if (hashTag)
                action += "&HashTag=" + hashTag;
            $form.attr("action", action);
        }
    });
});  // $(function()
