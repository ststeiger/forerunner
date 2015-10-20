var forerunner = forerunner || {};

$(function () {
    // This call starts the Mobilizer application
    $(document).ready(function () {
        var explorerSettings = forerunner.config.getCustomSettings();
        var dbConfig = forerunner.config.getDBConfiguration();

        this.explorer = $("body").reportExplorerEZ({
            explorerSettings: explorerSettings,
            dbConfig: dbConfig
        });

    });
});


