var forerunner = forerunner || {};

$(function () {
    // This call starts the Mobilizer application
    $(document).ready(function () {
        var me = this;

        //If CORS support needed
        //forerunner.config.enableCORSWithCredentials = true;

        me.explorer = $("body").reportExplorerEZ({
        });
    });
});