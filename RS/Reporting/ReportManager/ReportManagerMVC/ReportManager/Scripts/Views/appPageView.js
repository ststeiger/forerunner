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
            $('#rightPaneContent').on('reportparameterrender', function (e, data) { me.showSlideoutPane(false); });
            $('#leftheader').on('toolbarmenuclick', function (e, data) { me.hideSlideoutPane(true); });
            $('#rightheader').on('toolbarparamareaclick', function (e, data) { me.hideSlideoutPane(false); });
            $('#leftPaneContent').on('toolpaneactionstarted', function (e, data) { me.hideSlideoutPane(true); });
            $('#rightPaneContent').on('reportparametersubmit', function (e, data) { me.hideSlideoutPane(false); });
            $('#FRReportViewer1').on('reportviewerdrillback', function (e, data) { me.hideSlideoutPane(false); });
            $(window).resize(function () {
                $('#leftPane').css({ height: Math.max($(window).height(), $('#mainViewPort').height()) });
                $('#rightPane').css({ height: Math.max($(window).height(), $('#mainViewPort').height()) });
                $('#leftPaneContent').css({ height: '100%' });
                $('#rightPaneContent').css({ height: '100%' });
                $('.Parameter-Container').css({ height: $('#rightPane').height() - 45 });
            });
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
                slideoutPane.slideLeftHide(delay * 0.5);
            } else {
                slideoutPane.slideRightHide(delay * 0.5);
            }
            mainViewPort.removeClass(className, delay);
            topdiv.removeClass(className, delay);
            g_App.utils.allowZoom(true);
            $('#mainSectionHeader').toolbar('showTools');
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
            if (isLeftPane) {
                slideoutPane.slideLeftShow(delay);
            } else {
                $('.Parameter-Container').css({ height:slideoutPane.height() - 36 });
                slideoutPane.slideRightShow(delay);
            }
            mainViewPort.addClass(className, delay);
            topdiv.addClass(className, delay);
            g_App.utils.allowZoom(false);
            $('#mainSectionHeader').toolbar('hideTools');
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