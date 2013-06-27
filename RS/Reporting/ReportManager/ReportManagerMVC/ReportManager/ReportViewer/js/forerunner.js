// Assign or create the single globally scoped variable
var forerunner = forerunner || {};

// Forerunner SQL Server Reports
forerunner.ssr = forerunner.ssr || {};

$(function () {
    // Constants used by SSR
    forerunner.ssr.constants = {
        // Tool types used by the Toolbase widget
        toolTypes: {
            button:         "button",
            input:          "input",
            textButton:     "textbutton",
            plainText:      "plaintext",
            containerItem:  "containeritem",
            toolGroup:      "toolgroup"
        }
    };

    // device contains all externally available helper methods related to the device
    forerunner.device = {
        isTouch: function () {
            var ua = navigator.userAgent;
            return !!('ontouchstart' in window) // works on most browsers
                || !!('onmsgesturechange' in window) || ua.match(/(iPhone|iPod|iPad)/)
                || ua.match(/BlackBerry/) || ua.match(/Android/); // works on ie10
        }
    };
});
