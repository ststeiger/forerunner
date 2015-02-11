var forerunner = forerunner || {};

$(function () {
    // This call starts the Mobilizer application
    $(document).ready(function () {
        var explorerSettings = forerunner.config.getCustomSettings();

        this.explorer = $("body").reportExplorerEZ({
            explorerSettings: explorerSettings,
        });
    });
});