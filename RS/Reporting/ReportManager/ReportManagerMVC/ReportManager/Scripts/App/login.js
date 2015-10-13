var forerunner = forerunner || {};

$(function () {
    $(document).ready(function () {
        var locData = forerunner.localize.getLocData(forerunner.config.forerunnerFolder() + "ReportViewer/loc/ReportViewer");
        $("#username").attr("placeholder", locData.placeholders.Username);
        if (forerunner.device.isMSIE8())
            $("#password").attr("placeholder", "").attr("data-placeholder-value", "").val("");
        else
            $("#password").attr("placeholder", locData.placeholders.Password);
        $("#login").attr("value", locData.placeholders.Login);

        var $form = $("form");
        // Fix up the ReturnUrl
        var returnUrl = forerunner.helper.urlParam("ReturnUrl");
        
        var action = $form.attr("action");
        var urlParts = action.split("ReturnUrl=");
        action = urlParts[0] + "ReturnUrl=" + returnUrl;
        
        $form.attr("action", action);

    });
});  // $(function()
