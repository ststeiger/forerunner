/*
 * Forerunner plugin
 *
 * Put any shared / utility functions here.
 */
$(function () {

    $.fn.extend({
        forerunner: function () {
            return {
                // device contains all externally available helper methods related to the device
                device: {
                    // $.fn.forerunner().device.isTouch()
                    isTouch: function () {
                        var ua = navigator.userAgent;
                        return !!('ontouchstart' in window) // works on most browsers 
                            || !!('onmsgesturechange' in window) || ua.match(/(iPhone|iPod|iPad)/)
                            || ua.match(/BlackBerry/) || ua.match(/Android/); // works on ie10
                    }
                }
            };
        }
    });
});