// Assign or create the single globally scoped variable
var forerunner = forerunner || {};

// Forerunner SQL Server Reports
forerunner.ssr = forerunner.ssr || {};

$(function () {
    var ssr = forerunner.ssr;
    var toolTypes = ssr.constants.toolTypes;

    // This class provides the default app template for our app.
    // The EZ Viewer widget should use this template
    // This is an internal class right now.
    ssr.DefaultAppTemplate = function (options) {
        this.options = {
            $container : null
        };

        // Merge options with the default settings
        if (options) {
            $.extend(this.options, options);
        }
    };

    ssr.DefaultAppTemplate.prototype = {
        render: function () {
            var me = this;
            var $container = me.options.$container;
            $container.addClass("fr-layout-container");
            me.$container = $container;
            var $leftpane = new $("<div />");
            $leftpane.addClass("fr-layout-leftpane");
            me.$leftpane = $leftpane;
            var $leftheader = new $("<div />");
            $leftheader.addClass("fr-layout-leftheader");
            me.$leftheader = $leftheader;
            var $leftheaderspacer = new $("<div />");
            $leftheaderspacer.addClass("fr-layout-leftheaderspacer");
            me.$leftheaderspacer = $leftheaderspacer;
            var $leftpanecontent = new $("<div />");
            $leftpanecontent.addClass("fr-layout-leftpanecontent");
            me.$leftpanecontent = $leftpanecontent;
            $leftpane.append($leftheader);
            $leftpane.append($leftheaderspacer);
            $leftpane.append($leftpanecontent);
            $container.append($leftpane);
            //main view port
            var $mainviewport = new $("<div />");
            $mainviewport.addClass("fr-layout-mainviewport");
            me.$mainviewport = $mainviewport;
            $container.append($mainviewport);
            //top div
            var $topdiv = new $("<div />");
            $topdiv.addClass("fr-layout-topdiv");
            me.$topdiv = $topdiv;
            $container.append($topdiv);
            var $mainheadersection = new $("<div />");
            $mainheadersection.addClass("fr-layout-mainheadersection");
            me.$mainheadersection = $mainheadersection;
            $topdiv.append($mainheadersection);
            var $topdivspacer = new $("<div />");
            $topdivspacer.addClass("fr-layout-topdivspacer");
            me.$topdivspacer = $topdivspacer;
            $container.append($topdivspacer);
            // Page section
            var $pagesection = new $("<div />");
            $pagesection.addClass("fr-layout-pagesection");
            me.$pagesection = $pagesection;
            $container.append($pagesection);
            me.$mainsection = new $("<div />");
            me.$mainsection.addClass("fr-layout-mainsection");
            me.$pagesection.append(me.$mainsection);
            me.$docmapsection = new $("<div />");
            me.$docmapsection.addClass("fr-layout-docmapsection");
            me.$pagesection.append(me.$docmapsection);
            //bottom div
            var $bottomdiv = new $("<div />");
            $bottomdiv.addClass("fr-layout-bottomdiv");
            me.$bottomdiv = $bottomdiv;
            $container.append($bottomdiv);
            var $bottomdivspacer = new $("<div />");
            $bottomdivspacer.addClass("fr-layout-bottomdivspacer");
            me.$bottomdivspacer = $bottomdivspacer;
            $container.append($bottomdivspacer);
            //right pane
            var $rightpane = new $("<div />");
            $rightpane.addClass("fr-layout-rightpane");
            me.$rightpane = $rightpane;
            var $rightheader = new $("<div />");
            $rightheader.addClass("fr-layout-rightheader");
            me.$rightheader = $rightheader;
            var $rightheaderspacer = new $("<div />");
            $rightheaderspacer.addClass("fr-layout-rightheaderspacer");
            me.$rightheaderspacer = $rightheaderspacer;
            var $rightpanecontent = new $("<div />");
            $rightpanecontent.addClass("fr-layout-rightpanecontent");
            me.$rightpanecontent = $rightpanecontent;
            $rightpane.append($rightheader);
            $rightpane.append($rightheaderspacer);
            $rightpane.append($rightpanecontent);
            $container.append($rightpane);
            me.bindEvents();

            return this;
        },

        bindEvents: function () {
            var me = this;
            var events = forerunner.ssr.constants.events;

            var $mainheadersection = $(".fr-layout-mainheadersection", me.$container);
            $mainheadersection.on(events.toolbarMenuClick(), function (e, data) { me.showSlideoutPane(true); });
            $mainheadersection.on(events.toolbarParamAreaClick(), function (e, data) { me.showSlideoutPane(false); });
            $(".fr-layout-rightpanecontent", me.$container).on(events.reportParameterRender(), function (e, data) { me.showSlideoutPane(false); });
            $(".fr-layout-leftheader", me.$container).on(events.toolbarMenuClick(), function (e, data) { me.hideSlideoutPane(true); });

            $(".fr-layout-rightheader", me.$container).on(events.toolbarParamAreaClick(), function (e, data) { me.hideSlideoutPane(false); });
            $(".fr-layout-leftpanecontent", me.$container).on(events.toolPaneActionStarted(), function (e, data) { me.hideSlideoutPane(true); });
            $(".fr-layout-rightpanecontent", me.$container).on(events.reportParameterSubmit(), function (e, data) { me.hideSlideoutPane(false); });
            
            $(window).resize(function () {
                me.ResetSize();
            });
        },
        ResetSize: function () {
            var me = this;
            forerunner.device.allowZoom(false);
            //alert("hi");
            $(".fr-layout-mainviewport", me.$container).css({ height: "100%" });
            $(".fr-layout-leftpane", me.$container).css({ height: Math.max($(window).height(), me.$container.height()) + 50 });
            $(".fr-layout-rightpane", me.$container).css({ height: Math.max($(window).height(), me.$container.height()) });
            $(".fr-layout-leftpanecontent", me.$container).css({ height: "100%" });
            $(".fr-layout-rightpanecontent", me.$container).css({ height: "100%" });
            $(".fr-param-container", me.$container).css({ height: $(".fr-layout-rightpane", me.$container).height() });
            
        },

        bindViewerEvents: function () {
            var me = this;
            var events = forerunner.ssr.constants.events;

            var $viewer = $(".fr-layout-reportviewer", me.$container);
            $viewer.on(events.reportViewerDrillBack(), function (e, data) { me.hideSlideoutPane(false); });
            $viewer.on(events.reportViewerDrillThrough(), function (e, data) { me.hideSlideoutPane(true); me.hideSlideoutPane(false); });
            $viewer.on(events.reportViewerShowNav(), function (e, data) {
                var $spacer = $(".fr-layout-bottomdivspacer", me.$container);

                if (!data.open) {
                    $spacer.hide();
                    $(".fr-layout-pagesection", me.$container).show();
                }
                else {
                    $spacer.show();
                    if (forerunner.device.isSmall())
                        $(".fr-layout-pagesection", me.$container).hide();
                }

            });
            $viewer.on(events.reportViewerShowDocMap(), function (e, data) {
                me.$container.addClass("fr-docmap-background");
            });

            $viewer.on(events.reportViewerHideDocMap(), function (e, data) {
                me.$container.removeClass("fr-docmap-background");
            });

            //  Just in case it is hidden
            $viewer.on(events.reportViewerChangePage(), function (e, data) {
                $(".fr-layout-pagesection", me.$container).show();
            });
        },

        hideSlideoutPane: function (isLeftPane) {
            var me = this;
            var className = isLeftPane ? "fr-layout-mainViewPortShiftedRight" : "fr-layout-mainViewPortShiftedLeft";
            var mainViewPort = $(".fr-layout-mainviewport", me.$container);
            var slideoutPane = isLeftPane ? $(".fr-layout-leftpane", me.$container) : $(".fr-layout-rightpane", me.$container);
            var topdiv = $(".fr-layout-topdiv", me.$container);
            var delay = Number(200);
            if (slideoutPane.is(":visible")) {
                if (isLeftPane) {
                    slideoutPane.slideLeftHide(delay * 0.5);
                } else {
                    slideoutPane.slideRightHide(delay * 0.5);
                }
                topdiv.removeClass(className, delay);
                $(".fr-layout-mainheadersection", me.$container).toolbar("showAllTools");
            }
        },
        showSlideoutPane: function (isLeftPane) {
            var me = this;
            forerunner.device.allowZoom(false);
            me.$container.resize();

            var className = isLeftPane ? "fr-layout-mainViewPortShiftedRight" : "fr-layout-mainViewPortShiftedLeft";
            var mainViewPort = $(".fr-layout-mainviewport", me.$container);
            var slideoutPane = isLeftPane ? $(".fr-layout-leftpane", me.$container) : $(".fr-layout-rightpane", me.$container);
            var topdiv = $(".fr-layout-topdiv", me.$container);
            var delay = Number(200);
            if (!slideoutPane.is(":visible")) {
                slideoutPane.css({ height: Math.max($(window).height(), mainViewPort.height()) });
                if (isLeftPane) {
                    slideoutPane.slideLeftShow(delay);                    
                } else {
                    //$(".fr-param-container", me.$container).css({ height: slideoutPane.height() + 100 });
                    slideoutPane.slideRightShow(delay);
                }
                topdiv.addClass(className, delay);
                forerunner.device.allowZoom(false);
                $(".fr-layout-mainheadersection", me.$container).toolbar("hideAllTools");
            }
        },
        toggleSlideoutPane: function (isLeftPane) {
            var me = this;
            var slideoutPane = isLeftPane ? $(".fr-layout-leftpane", me.$container) : $(".fr-layout-rightpane", me.$container);
            if (slideoutPane.is(":visible")) {
                this.hideSlideoutPane(isLeftPane);
            } else {
                this.showSlideoutPane(isLeftPane);
            }
        },
    };
});  // $(function ()
