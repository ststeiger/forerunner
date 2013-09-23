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
            me.$printsection = new $("<div />");
            me.$printsection.addClass("fr-layout-printsection");
            me.$printsection.addClass("fr-dialog");
            me.$pagesection.append(me.$printsection);
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

            if (!me.options.isFullScreen) {
                me._makePositionAbsolute();
            }
            me.bindEvents();

            //Cannot get zoom event so fake it

            setInterval(function () {
                me.toggleZoom();
            }, 100);
            return this;
        },

        _makePositionAbsolute: function () {
            var me = this;
            me.$topdiv.addClass('fr-layout-position-absolute');
            me.$leftheader.addClass('fr-layout-position-absolute');
            me.$rightheader.addClass('fr-layout-position-absolute');
            me.$leftpane.addClass('fr-layout-position-absolute');
            me.$rightpane.addClass('fr-layout-position-absolute');
            me.$leftpanecontent.addClass('fr-layout-position-absolute');
            me.$rightpanecontent.addClass('fr-layout-position-absolute');
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

            if (!me.options.isFullScreen) {
                var isTouch = forerunner.device.isTouch();
                // For touch device, update the header only on scrollstop.
                if (isTouch) {
                    $(me.$container).hammer({}).on('touch release',
                    function (ev) {
                        if (!ev.gesture) return;
                        switch (ev.type) {
                            // Hide the header on touch
                            case 'touch':
                                if (me._containElement(ev.target, 'fr-layout-topdiv') || me.$container.hasClass('fr-layout-container-noscroll'))
                                    return;
                                me.$topdiv.hide();
                                break;
                                // Use the swipe and drag events because the swipeleft and swiperight doesn't seem to fire

                            case 'release':
                                if (ev.gesture['velocityX'] == 0 && ev.gesture['velocityY'] == 0)
                                    me._updateTopDiv(me);
                                break;
                        }
                    });
                    $(me.$container).on('scrollstop', function () { me._updateTopDiv(me); });
                } else {
                    $(me.$container).on('scroll', function () { me._updateTopDiv(me); });
                }

                $(me.$container).on('touchmove', function (e) {
                    if (me.$container.hasClass('fr-layout-container-noscroll')) {
                        console.log(e.target);

                        var isScrollable = me._containElement(e.target, 'fr-leftpane') || me._containElement(e.target, 'fr-rightpane');
                        console.log('isScrollable: ' + isScrollable);

                        if (isScrollable) {
                            // Check if there is a scrollbar
                            var toolpane = $('.fr-leftpane', me.$container);
                            if (!(toolpane[0].scrollHeight > toolpane[0].clientHeight)) {
                                isScrollable = false;
                                console.log('scrollHeight: ' + toolpane[0].scrollHeight);
                                console.log('clientHeight: ' + toolpane[0].clientHeight);
                                console.log('No Vertical');
                            } else {
                                console.log('Vertical');
                            }
                        }

                        if (!isScrollable)
                            e.preventDefault();
                        //else
                        //    e.stopPropagation();
                    }
                });
            }

            $(window).resize(function () {
                me.ResetSize();
            });
            if (!me.options.isFullScreen && !isTouch) {
                $(window).on('scroll', function () {
                    if (me.$leftpane.is(":visible")) {
                        me.$leftpane.css("top", $(window).scrollTop());
                    } else if (me.$rightpane.is(":visible")) {
                        me.$rightpane.css("top", $(window).scrollTop());
                    }
                });
            }
        },

        _containElement: function(element , className) {
            var isContained = false;
            if ($(element).hasClass(className)) {
                console.log('Exact match');
                isContained = true;
            } else {
                var parent = element.parentElement;
                while (parent != undefined) {
                    console.log(parent);
                    if ($(parent).hasClass(className)) {
                        console.log('Contained');
                        isContained = true;
                        break;
                    }
                    parent = parent.parentElement;
                }
            }

            return isContained;
        },
        
        _updateTopDiv: function (me) {
            me.$topdiv.css("top", $(window).scrollTop());
            me.$topdiv.css("left", $(window).scrollLeft());
            me.$topdiv.show();
        },
        
        toggleZoom: function () {
            var me = this;
            var ratio = forerunner.device.zoomLevel();
            
            if (me.isZoomed() && !me.wasZoomed) {
                //fadeout->fadeIn toolbar immediately to make android browser re-calculate toolbar layout
                //to fill the full width
                if (forerunner.device.isAndroid() && me.$topdiv.is(":visible")) {
                    me.$topdiv.fadeOut(10).fadeIn(10);
                }
                me.wasZoomed = true;
                return;
            }

            if (!me.isZoomed() && me.wasZoomed) {
                if (forerunner.device.isAndroid() && me.$topdiv.is(":visible")) {
                    me.$topdiv.fadeOut(10).fadeIn(10);
                }
                var $viewer = $(".fr-layout-reportviewer", me.$container);
                $viewer.reportViewer("allowZoom", false);
                me.wasZoomed = false;
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
                    values.containerHeight += 60;
                }
            } else if (forerunner.device.isAndroid()) {
                values.windowHeight = window.innerHeight;
            }

            values.max = Math.max(values.windowHeight, values.containerHeight);
            values.paneHeight = values.windowHeight - 38; /* 38 because $leftPaneContent.offset().top, doesn't work on iPhone*/

            return values;
        },
        ResetSize: function () {
            var me = this;
            var heightValues = me.getHeightValues();

            // Setting the min-height allows the iPhone to scroll the left and right panes
            // properly even when the report has not been loaded due to paramters not being
            // entered or is very small
            if (forerunner.device.isiPhone()) {
                $("body").css({ minHeight: heightValues.max });
            }
            me.$leftpanecontent.css({ height: heightValues.paneHeight });
            me.$rightpanecontent.css({ height: heightValues.paneHeight });
            me.$leftpane.css({ height: heightValues.max });
            me.$rightpane.css({ height: heightValues.max });
            me.$mainviewport.css({ height: "100%" });
            $(".fr-param-container", me.$container).css({ height: "100%" });
        },

        bindViewerEvents: function () {
            var me = this;
            var events = forerunner.ssr.constants.events;

            var $viewer = $(".fr-layout-reportviewer", me.$container);
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
                me.$container.addClass("fr-docmap-background");
            });

            $viewer.on(events.reportViewerHideDocMap(), function (e, data) {
                me.$container.removeClass("fr-docmap-background");
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
                var reportArea = $(".fr-report-areacontainer");
                
                if (reportArea.height() > document.documentElement.clientHeight - 38 // 38 is toolbar height
                    || reportArea.width() > document.documentElement.clientWidth) {

                    $(".fr-render-bglayer").css("position", "absolute").
                        css("height", Math.max(reportArea.height(), document.documentElement.clientHeight - 38))
                        .css("width", Math.max(reportArea.width(), document.documentElement.clientWidth));
                }
                else {
                    $(".fr-render-bglayer").css("position", "fixed").css("top", 38);
                }
            });


            //  Just in case it is hidden
            $viewer.on(events.reportViewerChangePage(), function (e, data) {
                me.$pagesection.show();
            });
            var isTouch = forerunner.device.isTouch();
            // For touch device, update the header only on scrollstop.
            if (isTouch && !me.options.isFullScreen) {
                me.$pagesection.on('scrollstop', function () { me._updateTopDiv(me); });
            }
        },
        getScrollPosition: function() {
            var position = {};
            position.left = $(window).scrollLeft();
            position.top = $(window).scrollTop();
            return position;
        },
        scrollToPosition: function (position) {
            var me = this;
            me.savePosition = me.getScrollPosition();
            $(window).scrollLeft(position.left);
            $(window).scrollTop(position.top);
        },
        restoreScrollPosition: function () {
            var me = this;
            if (me.savePosition) {
                $(window).scrollLeft(me.savePosition.left);
                $(window).scrollTop(me.savePosition.top);
                me.savePosition = null;
            }
        },
        hideAddressBar: function () {
            var me = this;
            if (document.height <= window.outerHeight + 10) {
                setTimeout(function () { me.scrollToPosition( {left: 0, top: 1} ); }, 50);
            }
            else {
                setTimeout(function () { me.scrollToPosition( { left: 0, top: 1 } ); }, 0);
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
        removeModalDialog: function () {
            var me = this;

            var $viewer = $(".fr-layout-reportviewer", me.$container);
            $viewer.reportViewer("closeModalDialog");
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
            me.$pagesection.removeClass("fr-layout-pagesection-noscroll");
            me.$container.removeClass("fr-layout-container-noscroll");

            // Make sure the scroll position is restored after the call to hideAddressBar
            me.restoreScroll();
        },
        showSlideoutPane: function (isLeftPane) {
            var me = this;
            me.$container.addClass("fr-layout-container-noscroll");
            forerunner.device.allowZoom(false);
            me.$container.resize();

            var className = isLeftPane ? "fr-layout-mainViewPortShiftedRight" : "fr-layout-mainViewPortShiftedLeft";
            var mainViewPort = me.$mainviewport;
            var slideoutPane = isLeftPane ? me.$leftpane : me.$rightpane;
            var topdiv = me.$topdiv;
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
                me.$mainheadersection.toolbar("hideAllTools");
            }
            me.$pagesection.addClass("fr-layout-pagesection-noscroll");
            
            // Make sure the address bar is not showing when a side out pane is showing
            me.hideAddressBar();
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

        _selectedItemPath: null,
    };
});  // $(function ()
