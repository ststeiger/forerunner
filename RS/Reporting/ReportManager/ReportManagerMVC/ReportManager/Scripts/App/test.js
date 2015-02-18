var forerunner = forerunner || {};

$(function () {
    // This call starts the Mobilizer application
    $(document).ready(function () {
        $("body").on(forerunner.ssr.constants.events.subscriptionFormInit, function (e, s) {

            $(".fr-email-to").on("blur", function (e) {

                if ($(e.currentTarget).val() !== "TestAccount") {
                    $(e.currentTarget).css("border", "2px solid red");
                    $(e.currentTarget).attr("data-invalid", true);
                }
                else {
                    $(e.currentTarget).css("border", "");
                    $(e.currentTarget).attr("data-invalid", false);
                }
            });
            
        });
    });
});