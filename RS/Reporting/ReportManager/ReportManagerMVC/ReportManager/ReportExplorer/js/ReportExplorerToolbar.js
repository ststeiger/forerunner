// Assign or create the single globally scoped variable
var forerunner = forerunner || {};

// Forerunner SQL Server Reports
forerunner.ssr = forerunner.ssr || {};

$(function () {
    var fr = forerunner;

    // Toolbar widget
    $.widget("Forerunner.reportexplorertoolbar", $.Forerunner.toolbase, {
        options: {
            navigateTo: null,
            toolClass: 'fr-toolbar'
        },
        // Button Info
        btnHome: {
            toolType: fr.ssr.constants.toolTypes.button,
            selectorClass: 'fr-rm-button-home',
            imageClass: 'fr-image-home',
            events: {
                click: function (e) {
                    e.data.me.options.navigateTo('home', null);
                }
            }
        },
        btnBack: {
            toolType: fr.ssr.constants.toolTypes.button,
            selectorClass: 'fr-button-back',
            imageClass: 'fr-image-back',
            events: {
                click: function (e) {
                    e.data.me.options.navigateTo('back', null);
                }
            }
        },
        btnFav: {
            toolType: fr.ssr.constants.toolTypes.button,
            selectorClass: 'fr-rm-button-fav',
            imageClass: 'fr-image-fav',
            events: {
                click: function (e) {
                    e.data.me.options.navigateTo('favorites', null);
                }
            }
        },
        btnRecent: {
            toolType: fr.ssr.constants.toolTypes.button,
            selectorClass: 'fr-rm-button-recent',
            imageClass: 'fr-image-recent',
            events: {
                click: function (e) {
                    e.data.me.options.navigateTo('recent', null);
                }
            }
        },
        

        _initCallbacks: function () {
            var me = this;
            // Hook up any / all custom events that the report viewer may trigger

            // Hook up the toolbar element events
            me.enableTools([me.btnHome, me.btnBack, me.btnFav, me.btnRecent]);
        },
        _init: function () {
            var me = this;

            // TODO [jont]
            //
            ///////////////////////////////////////////////////////////////////////////////////////////////
            //// if me.element contains or a a child contains the options.toolClass don't replace the html
            ///////////////////////////////////////////////////////////////////////////////////////////////

            me.element.html($("<div class='fr-toolbar' />"));
            me.addTools(1, true, [me.btnHome, me.btnBack, me.btnFav, me.btnRecent]);
            me._initCallbacks();
        },

        _destroy: function () {
        },

        _create: function () {
            var me = this;
        },
    });  // $.widget
});  // function()
