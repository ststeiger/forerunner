var g_App = g_App || {};
var forerunner = forerunner || {};
forerunner.ssr = forerunner.ssr || {};

g_App.AppPageView = function () {
};

g_App.AppPageView.prototype = {
    render: function () {
        return this;
    },


    bindEvents: function () {
        var me = this;
        var events = forerunner.ssr.constants.events;

        //$('#mainSectionHeader').on(events.toolbarMenuClick(), function (e, data) { me.toggleSlideoutPane(true); });
        //$('#mainSectionHeader').on(events.toolbarParamAreaClick(), function (e, data) { me.toggleSlideoutPane(false); });
        $('#mainSectionHeader').on(events.toolbarMenuClick(), function (e, data) { me.showSlideoutPane(true); });
        $('#mainSectionHeader').on(events.toolbarParamAreaClick(), function (e, data) { me.showSlideoutPane(false); });
        $('#rightPaneContent').on(events.reportParameterRender(), function (e, data) { me.showSlideoutPane(false); });
        $('#leftheader').on(events.toolbarMenuClick(), function (e, data) { me.hideSlideoutPane(true); });

        $('#rightheader').on(events.toolbarParamAreaClick(), function (e, data) { me.hideSlideoutPane(false); });
        $('#leftPaneContent').on(events.toolPaneActionStarted(), function (e, data) { me.hideSlideoutPane(true); });
        $('#rightPaneContent').on(events.reportParameterSubmit(), function (e, data) { me.hideSlideoutPane(false); });
        $('#FRReportViewer1').on(events.reportViewerDrillBack(), function (e, data) { me.hideSlideoutPane(false); });
        $('#FRReportViewer1').on(events.reportViewerDrillThrough(), function (e, data) { me.hideSlideoutPane(true); me.hideSlideoutPane(false); });
        $(window).resize(function () {
            $('#leftPane').css({ height: Math.max($(window).height(), $('#mainViewPort').height()) });
            $('#rightPane').css({ height: Math.max($(window).height(), $('#mainViewPort').height()) });
            $('#leftPaneContent').css({ height: '100%' });
            $('#rightPaneContent').css({ height: '100%' });
            $('.fr-param-container').css({ height: $('#rightPane').height() - 45 });
        });
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
            forerunner.device.allowZoom(true);
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
                $('.fr-param-container').css({ height:slideoutPane.height() - 36 });
                slideoutPane.slideRightShow(delay);
            }
            mainViewPort.addClass(className, delay);
            topdiv.addClass(className, delay);
            forerunner.device.allowZoom(false);
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