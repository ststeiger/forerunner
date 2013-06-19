// Assign or create the single globally scoped variable
var g_App = g_App || {};
    g_App.AppPageView = function () {
    };
    g_App.AppPageView.prototype = {
        render: function () {
            return this;
        },

        eventsBound: false,

        bindEvents: function () {
            var me = this;
            if (!me.eventsBound) {
                me.eventsBound = true;
                $('#mainSectionHeader').on('toolbarmenuclick', function (e, data) { me.toggleLeftPane(); });
                $('#leftPane').on('toolpaneactionstarted', function (e, data) { me.toggleLeftPane(); });
            }
        },

        toggleLeftPane: function () {
            var mainViewPort = $('#mainViewPort');
            var leftPane = $('#leftPane');
            var topdiv = $('#topdiv');
            if (!mainViewPort.hasClass('mainViewPortShifted')) {
                leftPane.css({ height: Math.max($(window).height(), mainViewPort.height()) });
                leftPane.show();
                mainViewPort.addClass('mainViewPortShifted');
                topdiv.addClass('mainViewPortShifted');
            } else {
                mainViewPort.removeClass('mainViewPortShifted');
                topdiv.removeClass('mainViewPortShifted');
                leftPane.hide();
            }
        },
    };