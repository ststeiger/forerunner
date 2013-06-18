$(function () {
    // reportexplorer widget
    $.widget("Forerunner.reportexplorertoolbar", {
        options: {

        },
        _render: function () {
            var me = this;
            me.element.html("<div class='fr-toolbar'>" +
            "<a href='#'><div class='fr-buttonicon fr-image-home'/></a>" +
            "<div class='fr-buttonicon fr-image-back'/>" +
            "<a href='#favorite'><div class='fr-buttonicon fr-button-fav fr-image-fav'/></a>" +
            "<a href='#recent'><div class='fr-buttonicon fr-button-recent fr-image-recent'/></a>" +
            "<div id='HeaderArea'></div></div>"
            );
        },
        _init: function () {
            var me = this;
            me._render();
        }
    });  // $.widget
});  // function()