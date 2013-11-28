// Assign or create the single globally scoped variable
var forerunner = forerunner || {};

// Forerunner SQL Server Reports
forerunner.ssr = forerunner.ssr || {};

$(function () {
    var ssr = forerunner.ssr;
    var toolTypes = ssr.constants.toolTypes;
    var events = forerunner.ssr.constants.events;

    // This class provides the default app template for our app.
    // The EZ Viewer widget should use this template
    // This is an internal class right now.
    ssr.DefaultAppTemplate = function (options) {
        var me = this;
        me.options = {
            $container: null,
            isFullScreen: true,
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
            $mainviewport.append($topdiv);
            var $mainheadersection = new $("<div />");
            $mainheadersection.addClass("fr-layout-mainheadersection");
            me.$mainheadersection = $mainheadersection;
            $topdiv.append($mainheadersection);
            var $topdivspacer = new $("<div />");
            $topdivspacer.addClass("fr-layout-topdivspacer");
            me.$topdivspacer = $topdivspacer;
            $mainviewport.append($topdivspacer);
            // Page section
            var $pagesection = new $("<div />");
            $pagesection.addClass("fr-layout-pagesection");
            me.$pagesection = $pagesection;
            $mainviewport.append($pagesection);
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
            $mainviewport.append($bottomdiv);
            var $bottomdivspacer = new $("<div />");
            $bottomdivspacer.addClass("fr-layout-bottomdivspacer");
            me.$bottomdivspacer = $bottomdivspacer;
            $mainviewport.append($bottomdivspacer);
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

            if (!me.options.isFullScreen) {
                me._makePositionAbsolute();
            }

            // This is a workaround for bug 658
            if (forerunner.device.isiOS() && me.options.isFullScreen) {
                me.$topdiv.addClass("fr-layout-position-absolute");
            }

            me.bindEvents();

            //Cannot get zoom event so fake it

            // This is a workaround for bug 658
            setTimeout(function () {
                if (forerunner.device.isiOS() && me.options.isFullScreen) {
                    me.$topdiv.removeClass("fr-layout-position-absolute");
                }
            }, 10);

            setInterval(function () {
                me.toggleZoom();
            }, 100);
            return this;
        },

        _makePositionAbsolute: function () {
            var me = this;
            me.$topdiv.addClass("fr-layout-position-absolute");
            me.$leftheader.addClass("fr-layout-position-absolute");
            me.$rightheader.addClass("fr-layout-position-absolute");
            me.$leftpane.addClass("fr-layout-position-absolute");
            me.$rightpane.addClass("fr-layout-position-absolute");
            me.$leftpanecontent.addClass("fr-layout-position-absolute");
            me.$rightpanecontent.addClass("fr-layout-position-absolute");
        },

        _makePositionFixed: function () {
            var me = this;
            me.$topdiv.removeClass("fr-layout-position-absolute");
            me.$leftheader.removeClass("fr-layout-position-absolute");
            me.$rightheader.removeClass("fr-layout-position-absolute");
            me.$leftpane.removeClass("fr-layout-position-absolute");
            me.$rightpane.removeClass("fr-layout-position-absolute");
            me.$leftpanecontent.removeClass("fr-layout-position-absolute");
            me.$rightpanecontent.removeClass("fr-layout-position-absolute");
        },

        bindEvents: function () {
            var me = this;
            var events = forerunner.ssr.constants.events;

            var $mainheadersection = $(".fr-layout-mainheadersection", me.$container);
            $mainheadersection.on(events.toolbarMenuClick(), function (e, data) { me.showSlideoutPane(true); });
            $mainheadersection.on(events.toolbarParamAreaClick(), function (e, data) { me.showSlideoutPane(false); });
            $(".fr-layout-rightpanecontent", me.$container).on(events.reportParameterRender(), function (e, data) { me.showSlideoutPane(false); });
            $(".fr-layout-leftheader", me.$container).on(events.leftToolbarMenuClick(), function (e, data) { me.hideSlideoutPane(true); });

            $(".fr-layout-rightheader", me.$container).on(events.rightToolbarParamAreaClick(), function (e, data) { me.hideSlideoutPane(false); });
            $(".fr-layout-leftpanecontent", me.$container).on(events.toolPaneActionStarted(), function (e, data) { me.hideSlideoutPane(true); });
            $(".fr-layout-rightpanecontent", me.$container).on(events.reportParameterSubmit(), function (e, data) { me.hideSlideoutPane(false); });
            $(".fr-layout-rightpanecontent", me.$container).on(events.reportParameterCancel(), function (e, data) { me.hideSlideoutPane(false); });

            me.$container.on(events.showModalDialog, function () {
                //me.$viewer.reportViewer("allowZoom", true);
                me.$container.addClass("fr-layout-container-noscroll");
                me.$pagesection.addClass("fr-layout-pagesection-noscroll");
                me.showModal = true;
                //me.$container.css("overflow", "hidden").mask();
                //this field is to remove the conflict of restore scroll invoke list
                //made by left pane and modal dialog.
                //me.scrollLock = true;
                //me.scrollToPosition(me.getOriginalPosition());
            });

            me.$container.on(events.closeModalDialog, function () {
                //me.$viewer.reportViewer("allowZoom", false);
                me.showModal = false;
                me.$container.removeClass("fr-layout-container-noscroll");
                me.$pagesection.removeClass("fr-layout-pagesection-noscroll");
                // me.$container.css("overflow", "").unmask();
                //me.scrollLock = false;
                //me.restoreScroll();
            });

            var isTouch = forerunner.device.isTouch();
            if (!me.options.isFullScreen) {
                // For touch device, update the header only on scrollstop.
                if (isTouch) {
                    $(me.$container).hammer({ stop_browser_behavior: { userSelect: false }, swipe_max_touches: 22, drag_max_touches: 2 }).on("touch release",
                    function (ev) {
                        if (!ev.gesture) return;
                        switch (ev.type) {
                            // Hide the header on touch
                            case "touch":
                                if (me._containElement(ev.target, "fr-layout-topdiv") || me.$container.hasClass("fr-layout-container-noscroll"))
                                    return;
                                me.$topdiv.hide();
                                break;
                                // Use the swipe and drag events because the swipeleft and swiperight doesn"t seem to fire

                            case "release":
                                if (ev.gesture.velocityX === 0 && ev.gesture.velocityY === 0) {
                                    me._updateTopDiv(me);
                                }
                                break;
                        }
                    });
                    $(me.$container).on("scrollstop", function () {
                        me._updateTopDiv(me);
                    });
                }  
            }

            $(me.$container).on("touchmove", function (e) {
                if (me.$container.hasClass("fr-layout-container-noscroll")) {

                    var isScrollable = me._containElement(e.target, "fr-layout-leftpane") ||
                                       me._containElement(e.target, "fr-layout-rightpane") ||
                                       me._containElement(e.target, "fr-print-form") ||
                                       me._containElement(e.target, "fr-mps-form");

                    if (!isScrollable)
                        e.preventDefault();
                }
            });

            $(window).resize(function () {
                me.ResetSize();

                me._updateTopDiv(me);
                me.setBackgroundLayout();
            });

            if (!me.options.isFullScreen && !isTouch) {
                $(window).on("scroll", function () {
                    me._updateTopDiv(me);
                });
                me.$container.on("scroll", function () {
                    me._updateTopDiv(me);
                });
            }
            
            //IOS safari have a bug that report the window height wrong
            if (forerunner.device.isiOS()) {
                $(document.documentElement).height(window.innerHeight);
                $(window).on("orientationchange", function () {
                    $(document.documentElement).height(window.innerHeight);
                });
            }
        },

        _containElement: function(element , className) {
            var isContained = false;
            if ($(element).hasClass(className)) {
                isContained = true;
            } else {
                var parent = element.parentElement;
                while (parent !== undefined && parent !== null) {
                    if ($(parent).hasClass(className)) {
                        isContained = true;
                        break;
                    }
                    parent = parent.parentElement;
                }
            }

            return isContained;
        },
        

        _updateTopDiv: function (me) {
            if (me.options.isFullScreen)
                return;
            if (me.$leftpane.is(":visible")) {
                me.$leftpane.css("top", me.$container.scrollTop());
            } else if (me.$rightpane.is(":visible")) {
                me.$rightpane.css("top", me.$container.scrollTop());
            }
            me.$topdiv.css("top", me.$container.scrollTop());
            me.$topdiv.css("left", me.$container.scrollLeft());
            if (!me.isZoomed()) {
                me.$topdiv.show();
            }
        },
        
        toggleZoom: function () {
            var me = this;
            var ratio = forerunner.device.zoomLevel();
            
            if (me.isZoomed() && !me.wasZoomed) {
                //fadeout->fadeIn toolbar immediately to make android browser re-calculate toolbar layout
                //to fill the full width
                if (forerunner.device.isAndroid() && me.$topdiv.is(":visible")) {
                    me.$topdiv.css("width", "100%");
                    me.$topdiv.css("width", "device-width");
                }
                me.wasZoomed = true;
                return;
            }

            if (!me.isZoomed() && me.wasZoomed) {
                var $viewer = $(".fr-layout-reportviewer", me.$container);
                $viewer.reportViewer("allowZoom", false);
                me.wasZoomed = false;
                if (forerunner.device.isAndroid()) {
                    me.$topdiv.css("width", "100%");
                    me.$topdiv.fadeOut(10).fadeIn(10);
                }
            }
        },
        wasZoomed: false,
        isZoomed: function(){
            var ratio = forerunner.device.zoomLevel();

            if (ratio > 1.15 || ratio < 0.985)
                return true;
            else
                return false;
        },
        _firstTime: true,
        getHeightValues: function () {
            var me = this;
            var values = {};
            values.windowHeight = $(window).height();  // PC case
            values.containerHeight = me.$container.height();

            // Start out by adding the height of the location bar to the height
            if (forerunner.device.isiOS()) {
                // iOS reliably returns the innerWindow size for documentElement.clientHeight
                // but window.innerHeight is sometimes the wrong value after rotating the orientation
                values.windowHeight = document.documentElement.clientHeight;

                // Only add extra padding to the height on iphone / ipod, since the ipad browser
                // doesn't scroll off the location bar.
                if (forerunner.device.isiPhone() && !forerunner.device.isiPhoneFullscreen() && !forerunner.device.isStandalone()) {
                    values.windowHeight += 60;
                    if (me._firstTime) {
                        values.containerHeight += 60;
                        me._firstTime = false;
                    }
                }
            } else if (forerunner.device.isAndroid()) {
                values.windowHeight = window.innerHeight;
            }

            values.max = Math.max(values.windowHeight, values.containerHeight);
            values.paneHeight = values.windowHeight - 38; /* 38 because $leftPaneContent.offset().top, doesn't work on iPhone*/
            if (window.navigator.standalone && forerunner.device.isiOS()) {
                values.paneHeight = values.max;
            }
            return values;
        },
        ResetSize: function () {
            var me = this;
            
            var heightValues = me.getHeightValues();

            // Setting the min-height allows the iPhone to scroll the left and right panes
            // properly even when the report has not been loaded due to paramters not being
            // entered or is very small
            if (forerunner.device.isiPhone()) {
                $("html").css({ minHeight: heightValues.max });
                $("body").css({ minHeight: heightValues.max });
            }
            me.$leftpanecontent.css({ height: heightValues.paneHeight });
            me.$rightpanecontent.css({ height: heightValues.paneHeight });
            me.$leftpane.css({ height: heightValues.max });
            me.$rightpane.css({ height: heightValues.max });
            //me.$mainviewport.css({ height: "100%" });
            $(".fr-param-container", me.$container).css({ height: "100%" });
            $(".fr-toolpane", me.$container).css({ height: "100%" });
        },

        bindViewerEvents: function () {
            var me = this;
            var events = forerunner.ssr.constants.events;

            var $viewer = $(".fr-layout-reportviewer", me.$container);
            me.$viewer = $viewer;
            $viewer.on(events.reportViewerDrillBack(), function (e, data) { me.hideSlideoutPane(false); });
            $viewer.on(events.reportViewerDrillThrough(), function (e, data) { me.hideSlideoutPane(true); me.hideSlideoutPane(false); });
            $viewer.on(events.reportViewerShowNav(), function (e, data) {
                var $spacer = me.$bottomdivspacer;

                if (!data.open) {
                    $spacer.hide();
                    me.$pagesection.show();
                }
                else {
                    $spacer.show();
                    if (forerunner.device.isSmall())
                        me.$pagesection.hide();
                }

            });
            $viewer.on(events.reportViewerShowDocMap(), function (e, data) {
                me.scrollLock = true;
                me.scrollToPosition(me.getOriginalPosition());
            });

            $viewer.on(events.reportViewerHideDocMap(), function (e, data) {
                me.scrollLock = false;
                me.restoreScrollPosition();
            });

            $viewer.on(events.reportViewerallowZoom(), function (e, data) {
                if (data.isEnabled === true) {
                    me.$topdiv.hide();
                    $viewer.reportViewer("option", "toolbarHeight", 0);
                }
                else {
                    me.$topdiv.show();
                    $viewer.reportViewer("option", "toolbarHeight", me.$topdiv.outerHeight());
                }
            });

            $viewer.on(events.reportViewerSetPageDone(), function (e, data) {
                me.setBackgroundLayout();
            });

            //  Just in case it is hidden
            $viewer.on(events.reportViewerChangePage(), function (e, data) {
                me.$pagesection.show();
            });

            //nav to the found keyword and clear saved position to resolve the conflict with left pane.
            $viewer.on(events.reportViewerNavToPosition(), function (e, data) {
                me.scrollToPosition(data);
                me.savePosition = null;
            });

            var isTouch = forerunner.device.isTouch();
            // For touch device, update the header only on scrollstop.
            if (isTouch && !me.options.isFullScreen) {
                me.$pagesection.on("scrollstop", function () { me._updateTopDiv(me); });
            }

            var onInputFocus = function () {
                if (forerunner.device.isiOS()) {
                    if (me.options.isFullScreen)
                        me._makePositionAbsolute();

                    me.$pagesection.addClass("fr-layout-pagesection-noscroll");
                    me.$container.addClass("fr-layout-container-noscroll");

                    $(window).scrollTop(0);
                    $(window).scrollLeft(0);
                    me.ResetSize();
                }
            };

            var onInputBlur = function () {
                if (forerunner.device.isiOS()) {
                    if (me.options.isFullScreen)
                        me._makePositionFixed();

                    if (!me.$leftpane.is(":visible") && !me.$rightpane.is(":visible") && me.showModal !== true) {
                        me.$pagesection.removeClass("fr-layout-pagesection-noscroll");
                        me.$container.removeClass("fr-layout-container-noscroll");
                    }

                    $(window).scrollTop(0);
                    $(window).scrollLeft(0);

                    me.ResetSize();
                }
            };

            $viewer.reportViewer("option", "onInputFocus", onInputFocus);
            $viewer.reportViewer("option", "onInputBlur", onInputBlur);
        },
        getScrollPosition: function () {
            var me = this;
            var position = {};
            position.left = $(window).scrollLeft();
            position.top = $(window).scrollTop();
            position.innerLeft = me.$container.scrollLeft();
            position.innerTop = me.$container.scrollTop();
            return position;
        },
        getOriginalPosition: function () {
            var me = this;
            return { left: me.$container.offset().left > 100 ? me.$container.offset().left : 0, top: 0, innerLeft: 0, innerTop: 0 };
        },
        scrollToPosition: function (position) {
            var me = this;
            if (!me.savePosition)
                me.savePosition = me.getScrollPosition();
            if (position.left !== null)
                $(window).scrollLeft(position.left);
            if (position.top !== null)
                $(window).scrollTop(position.top);
            if (position.innerLeft !== null)
                me.$container.scrollLeft(position.innerLeft);
            if (position.innerTop !== null)
                me.$container.scrollTop(position.innerTop);
        },
        restoreScrollPosition: function () {
            var me = this;
            if (me.savePosition && !me.scrollLock) {
                $(window).scrollLeft(me.savePosition.left);
                $(window).scrollTop(me.savePosition.top);
                me.$container.scrollLeft(me.savePosition.innerLeft);
                me.$container.scrollTop(me.savePosition.innerTop);
                me.savePosition = null;
            }
        },
        hideAddressBar: function (isLeftPane) {
            var me = this;
            var containerPosition = me.getOriginalPosition();
            if (!isLeftPane) containerPosition.left = null;

            if (document.height <= window.outerHeight + 10) {
                setTimeout(function () { me.scrollToPosition(containerPosition); }, 50);
            }
            else {
                setTimeout(function () { me.scrollToPosition(containerPosition); }, 0);
            }
        },
        restoreScroll: function () {
            var me = this;
            if (document.height <= window.outerHeight + 10) {
                setTimeout(function () { me.restoreScrollPosition(); }, 50);
            }
            else {
                setTimeout(function () { me.restoreScrollPosition(); }, 0);
            }
        },
        hideSlideoutPane: function (isLeftPane) {
            var me = this;
            var className = isLeftPane ? "fr-layout-mainViewPortShiftedRight" : "fr-layout-mainViewPortShiftedLeft";
            var mainViewPort = me.$mainviewport;
            var slideoutPane = isLeftPane ? me.$leftpane : me.$rightpane;
            var topdiv = me.$topdiv;
            var delay = Number(200);
            if (slideoutPane.is(":visible")) {
                if (isLeftPane) {
                    slideoutPane.slideLeftHide(delay * 0.5);
                } else {
                    slideoutPane.slideRightHide(delay * 0.5);
                }
                topdiv.removeClass(className, delay);
                me.$mainheadersection.toolbar("showAllTools");
            }
            
            if (me.showModal !== true) {
                me.$pagesection.removeClass("fr-layout-pagesection-noscroll");
                me.$container.removeClass("fr-layout-container-noscroll");
            }

            if (forerunner.device.isAndroid() && !forerunner.device.isChrome())
                me.$pagesection.addClass("fr-layout-android");

            // Make sure the scroll position is restored after the call to hideAddressBar
            me.restoreScroll();
            me.$container.resize();
            if (me.$viewer !== undefined && me.$viewer.is(":visible")) {
                if (!forerunner.device.isAllowZoom()) {
                    me.$viewer.reportViewer("allowSwipe", true);
                }
                me.$viewer.reportViewer("triggerEvent", events.hidePane);
            }
        },
        showSlideoutPane: function (isLeftPane) {
            var me = this;

            if (me.$viewer !== undefined) {
                me.$viewer.reportViewer("allowZoom", false);
                me.$viewer.reportViewer("allowSwipe", false);
            } else {
                forerunner.device.allowZoom(false);
            }

            var className = isLeftPane ? "fr-layout-mainViewPortShiftedRight" : "fr-layout-mainViewPortShiftedLeft";
            var mainViewPort = me.$mainviewport;
            var slideoutPane = isLeftPane ? me.$leftpane : me.$rightpane;
            var topdiv = me.$topdiv;
            var delay = Number(200);
            if (!slideoutPane.is(":visible")) {
                slideoutPane.css({ height: Math.max($(window).height(), mainViewPort.height()) });
                if (isLeftPane) {
                    slideoutPane.css({ top: me.$container.scrollTop()});
                    slideoutPane.slideLeftShow(delay);
                } else {
                    slideoutPane.css({ top: me.$container.scrollTop()});
                    slideoutPane.slideRightShow(delay);
                }
                
                topdiv.addClass(className, delay);
                me.$mainheadersection.toolbar("hideAllTools");

                if (me.$viewer !== undefined) {
                    me.$viewer.reportViewer("allowZoom", false);
                    me.$viewer.reportViewer("allowSwipe", false);
                } else {
                    forerunner.device.allowZoom(false);
                }
            }

            me.$container.addClass("fr-layout-container-noscroll");
            me.$pagesection.addClass("fr-layout-pagesection-noscroll");
            
            // Make sure the address bar is not showing when a side out pane is showing
            me.hideAddressBar(isLeftPane);
            me.$container.resize();

            if (me.$viewer !== undefined && me.$viewer.is(":visible")) {
                me.$viewer.reportViewer("triggerEvent", events.showPane);
            }
        },
        toggleSlideoutPane: function (isLeftPane) {
            var me = this;
            var slideoutPane = isLeftPane ? me.$leftpane : me.$rightpane;
            if (slideoutPane.is(":visible")) {
                this.hideSlideoutPane(isLeftPane);
            } else {
                this.showSlideoutPane(isLeftPane);
            }
        },
        setBackgroundLayout: function () {
            var me = this;
            var reportArea = $(".fr-report-areacontainer", me.$container);
            var containerHeight = me.$container.height();
            var containerWidth = me.$container.width();
            
            if (reportArea.height() > (containerHeight - 38) || reportArea.width() > containerWidth) {// 38 is toolbar height
                $(".fr-render-bglayer", me.$container).css("position", "absolute").
                    css("height", Math.max(reportArea.height(), (containerHeight - 38)))
                    .css("width", Math.max(reportArea.width(), containerWidth));
            }
            else {
                $(".fr-render-bglayer", me.$container).css("position", "absolute")
                    .css("height", (containerHeight - 38)).css("width", containerWidth);
            }
        },
        cleanUp: function () {
            var me = this;

            me.hideSlideoutPane(true);
            me.hideSlideoutPane(false);
            me.$bottomdiv.hide();
            me.$bottomdivspacer.hide();
            me.$pagesection.removeClass("fr-layout-pagesection-noscroll");
            me.$container.removeClass("fr-layout-container-noscroll");
        },
        _selectedItemPath: null,
    };
});  // $(function ()
