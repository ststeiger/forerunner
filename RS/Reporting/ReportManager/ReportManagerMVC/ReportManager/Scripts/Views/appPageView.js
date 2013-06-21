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
            $('#mainSectionHeader').on('toolbarmenuclick', function (e, data) { me.toggleSlideoutPane(true); });
            $('#mainSectionHeader').on('toolbarparamareaclick', function (e, data) { me.toggleSlideoutPane(false); });
            $('#rightPane').on('reportparameterrender', function (e, data) { me.showSlideoutPane(false); });
            $('#leftPane').on('toolpaneactionstarted', function (e, data) { me.hideSlideoutPane(true); });
            $('#rightPane').on('reportparametersubmit', function (e, data) { me.hideSlideoutPane(false); });
        }
    },

    hideSlideoutPane: function (isLeftPane) {
        var className = isLeftPane ? 'mainViewPortShiftedRight' : 'mainViewPortShiftedLeft';
        var mainViewPort = $('#mainViewPort');
        var slideoutPane = isLeftPane ? $('#leftPane') : $('#rightPane');
        var topdiv = $('#topdiv');
        var delay = Number(200);
        if (slideoutPane.is(':visible')) {
            if (isLeftPane) {
                slideoutPane.slideRightHide(delay * 0.5);
            } else {
                slideoutPane.slideLeftHide(delay * 0.5);
            }
            mainViewPort.removeClass(className, delay);
            topdiv.removeClass(className, delay);
        }
    },
    showSlideoutPane: function (isLeftPane) {
        var className = isLeftPane ? 'mainViewPortShiftedRight' : 'mainViewPortShiftedLeft';
        var mainViewPort = $('#mainViewPort');
        var slideoutPane = isLeftPane ? $('#leftPane') : $('#rightPane');
        var topdiv = $('#topdiv');
        var delay = Number(200);
        if (!slideoutPane.is(':visible')) {
            slideoutPane.css({ height: Math.max($(window).height(), mainViewPort.height()) });
            //slideoutPane.show();
            if (isLeftPane) {
                slideoutPane.slideLeftShow(delay);
            } else {
                slideoutPane.slideRightShow(delay);
            }
            mainViewPort.addClass(className, delay);
            topdiv.addClass(className, delay);
        }
    },
    toggleSlideoutPane: function (isLeftPane) {
        var slideoutPane = isLeftPane ? $('#leftPane') : $('#rightPane');
        if (slideoutPane.is(':visible')) {
            this.hideSlideoutPane(isLeftPane);
        } else {
            this.showSlideoutPane(isLeftPane);
        }
    },
};