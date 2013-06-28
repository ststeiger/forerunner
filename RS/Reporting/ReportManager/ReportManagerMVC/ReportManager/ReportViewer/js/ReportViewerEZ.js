$(function () {
    // Toolbar widget
    $.widget("Forerunner.reportviewerez", $.Forerunner.toolbase, {
        options: {
            container: null,
        },
        _init: function () {
            var me = this;
            var $container = new $("<div />");
            $container.addClass("fr-ezviewer-container");
            me.$container = $container;
            var $toppane = new $("<div />");
            $toppane.addClass("fr-ezviewer-toppane");
            me.$toppane = $toppane;
            $container.append($toppane);
            var $leftpane = new $("<div />");
            $leftpane.addClass("fr-ezviewer-leftpane");
            me.$leftpane = $leftpane;
            var $lefttoolbar = new $("<div />");
            $lefttoolbar.addClass("fr-ezviewer-lefttoolbar");
            me.$lefttoolbar = $lefttoolbar;
            $container.append($leftpane);
            var $rightpane = new $("<div />");
            $rightpane.addClass("fr-ezviewer-rightpane");
            me.$rightpane = $rightpane;
            $container.append($rightpane);
            var $righttoolbar = new $("<div />");
            $righttoolbar.addClass("fr-ezviewer-righttoolbar");
            me.$righttoolbar = $righttoolbar;
            var $bottompane = new $("<div />");
            $bottompane.addClass("fr-ezviewer-bottompane");
            me.$bottompane = $bottompane;
            $container.append($bottompane);
            me.element.html($container);
        },
       
        _destroy: function () {
        },

        _create: function () {
        },
    });  // $.widget
});  // function()