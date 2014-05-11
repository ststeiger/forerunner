var forerunner = forerunner || {};

$(function () {
    // This call starts the Mobilizer application
    $(document).ready(function () {
        var explorerSettings = forerunner.config.getCustomSettings();

        var isAdmin = false;
        if (window.location.pathname.toLowerCase().indexOf("/admin") >= 0)
            isAdmin = true;

        this.explorer = $("body").reportExplorerEZ({
            explorerSettings: explorerSettings,
            isAdmin: isAdmin
        });
    });
});