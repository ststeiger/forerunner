// Assign or create the single globally scoped variable
var forerunner = forerunner || {};

// Forerunner SQL Server Reports
forerunner.ssr = forerunner.ssr || {};

$(function () {
    var ssr = forerunner.ssr;
    var toolTypes = ssr.constants.toolTypes;
    var events = forerunner.ssr.constants.events;
    var widgets = forerunner.ssr.constants.widgets;

    // This class provides the default app template for our app.
    // The EZ Viewer widget should use this template
    // This is an internal class right now.
    ssr.DefaultAppTemplate = function (options) {
        var me = this;

        me.options = {
            $container: null,
            isFullScreen: true
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
            $topdiv.addClass("fr-layout-topdiv fr-core-block");
            me.$topdiv = $topdiv;
            if (me.options.isFullScreen) {
               me.$topdiv.css("width", $(window).width());                
            }
            $mainviewport.append($topdiv);
            //route path link
            var $linksection = new $("<div />");
            $linksection.addClass("fr-layout-linksection");
            me.$linksection = $linksection;
            $topdiv.append($linksection);
            var $mainheadersection = new $("<div />");
            $mainheadersection.addClass("fr-layout-mainheadersection");
            me.$mainheadersection = $mainheadersection;
            $topdiv.append($mainheadersection);
            var $topdivspacer = new $("<div />");
            $topdivspacer.addClass("fr-layout-topdivspacer  fr-core-block");
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
            //Property Dialog Section
            var $propertySection = new $("<div />");
            $propertySection.addClass("fr-properties-section");
            me.$propertySection = $propertySection;
            $container.append($propertySection);
            //Security Dialog Section
            var $securitySection = new $("<div />");
            $securitySection.addClass("fr-security-section");
            me.$securitySection = $securitySection;
            $container.append($securitySection);
            //Upload File Section
            var $uploadFileSection = new $("<div />");
            $uploadFileSection.addClass("fr-upf-section");
            me.$uploadFileSection = $uploadFileSection;
            $container.append($uploadFileSection);

            // Define the unzoom toolbar
            var $unzoomsection = new $("<div class=fr-layout-unzoomsection />");
            me.$unzoomsection = $unzoomsection;
            $mainviewport.append(me.$unzoomsection);

            me._initPropertiesDialog();
            me._initSecurityDialog();
            me._initUploadFileDialog();

            me.isDashboard = me.$container.hasClass("fr-dashboard-report-id");
            //dashboard report toolbar height, used for each report floating header
            me.outerToolbarHeight = me.isDashboard ? $("body").children(".fr-layout-mainviewport").children(".fr-layout-topdiv").height() : 0;
            
            if (!me.options.isFullScreen) {
                me._makePositionAbsolute();
            }

            me.bindEvents();

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

        _initPropertiesDialog: function () {
            var me = this;
            me.$propertySection.addClass("fr-dialog-id fr-core-dialog-layout fr-core-widget");

            me.$propertySection.forerunnerProperties({
                $appContainer: me.$container,
                $reportViewer: me.$mainviewport,
                $reportExplorer: me.$mainsection
            });
        },
        _initSecurityDialog: function () {
            var me = this;
            me.$securitySection.addClass("fr-dialog-id fr-core-dialog-layout fr-core-widget");

            me.$securitySection.forerunnerSecurity({
                $appContainer: me.$container,
                $reportExplorer: me.$mainsection
            });
        },
        _initUploadFileDialog: function () {
            var me = this;
            me.$uploadFileSection.addClass("fr-dialog-id fr-core-dialog-layout fr-core-widget");

            me.$uploadFileSection.uploadFile({
                $appContainer: me.$container
            });
        },
        bindEvents: function () {
            var me = this;
            var events = forerunner.ssr.constants.events;


            if (forerunner.device.isMobile()) {
                //Add double tap to bring up menu.  This resets zoom level on some browsers.
                me.$container.hammer({ stop_browser_behavior: { userSelect: false } }).on("doubletap", function (ev) {
                    ev.preventDefault();
                    ev.gesture.preventDefault();
                    me.showSlideoutPane(widgets.toolbar, true);

                });
            }
           
            // Handle any / all layout changes when the history routes change
            forerunner.history.on(events.historyRoute(), function (e, data) {
                if (data.name === "transitionToReportManager" ||
                    data.name === "transitionToOpenResource" ||
                    data.name === "transitionToSearch") {
                    forerunner.device.allowZoom(false);
                    $("html").addClass("fr-Explorer-background");
                } else if (data.name === "transitionToReportViewer" ||
                           data.name === "transitionToReportViewerWithRSURLAccess") {
                    $("html").removeClass("fr-Explorer-background");
                }
            });

            var $mainheadersection = $(".fr-layout-mainheadersection", me.$container);
            $mainheadersection.on(events.toolbarMenuClick(), function (e, data) { me.showSlideoutPane(widgets.toolbar, true); });
            $mainheadersection.on(events.toolbarParamAreaClick(), function (e, data) { me.showSlideoutPane(widgets.toolbar, false); });
            $mainheadersection.on(events.reportExplorerToolbarMenuClick(), function (e, data) { me.showSlideoutPane(widgets.reportExplorerToolbar, true); });
            $mainheadersection.on(events.dashboardToolbarMenuClick(), function (e, data) { me.showSlideoutPane(widgets.dashboardToolbar, true); });
            $(".fr-layout-rightpanecontent", me.$container).on(events.reportParameterRender(), function (e, data) { me.showSlideoutPane(widgets.toolbar, false); });
            $(".fr-layout-leftheader", me.$container).on(events.leftToolbarMenuClick(), function (e, data) { me.hideSlideoutPane(true); });

            $(".fr-layout-rightheader", me.$container).on(events.rightToolbarParamAreaClick(), function (e, data) { me.hideSlideoutPane(false); });
            var $leftPaneContent = $(".fr-layout-leftpanecontent", me.$container);
            $leftPaneContent.on(events.toolPaneActionStarted(), function (e, data) { me.hideSlideoutPane(true); });
            $leftPaneContent.on(events.dashboardToolPaneActionStarted(), function (e, data) { me.hideSlideoutPane(true); });
            $leftPaneContent.on(events.reportExplorerToolPaneActionStarted(), function (e, data) { me.hideSlideoutPane(true); });
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
                if (!me.$leftpane.is(":visible") && !me.$rightpane.is(":visible")) {
                    me.$container.removeClass("fr-layout-container-noscroll");
                    me.$pagesection.removeClass("fr-layout-pagesection-noscroll");
                }
                // me.$container.css("overflow", "").unmask();
                //me.scrollLock = false;
                //me.restoreScroll();
            });

            var isTouch = forerunner.device.isTouch();
            if (!me.options.isFullScreen) {
                // For mobile touch devices, update the header only on scrollstop. Note that on touch enabled PC devices the release
                // with a velocity of 0 is never hit on a mouse drag event. So we only do this for mobile devices
                if (isTouch && forerunner.device.isMobile() && !forerunner.device.isiOS() ) {
                    me.$container.hammer({ stop_browser_behavior: { userSelect: false }, swipe_max_touches: 22, drag_max_touches: 2 }).on("touch release",
                    function (ev) {
                        if (!ev.gesture) return;
                        switch (ev.type) {
                            // Hide the header on touch
                            case "touch":
                                if (forerunner.helper.containElement(ev.target, ["fr-layout-topdiv"]) || me.$container.hasClass("fr-layout-container-noscroll"))
                                    return;
                                me._showTopDiv(true);
                                break;
                                // Use the swipe and drag events because the swipeleft and swiperight doesn"t seem to fire

                            case "release":
                                if (ev.gesture.velocityX === 0 && ev.gesture.velocityY === 0) {
                                    me._updateTopDiv(me);
                                }
                                break;
                        }
                    });
                    me.$container.on("scrollstop", function () {
                        me._updateTopDiv(me);
                    });
                    $(window).on("scrollstop", function () {
                        me._updateTopDiv(me);
                    });
                }
                else {
                    $(window).on("scroll", function () {
                        me._updateTopDiv(me);
                    });
                    me.$container.on("scroll", function () {
                        me._updateTopDiv(me);
                    });
                }
            }

            $(me.$container).on("touchmove", function (e) {
                if (me.$container.hasClass("fr-layout-container-noscroll")) {

                    var isScrollable = forerunner.helper.containElement(e.target, ["fr-layout-leftpane", "fr-layout-rightpane",
                        "fr-core-dialog-form", "fr-nav-container", "ui-autocomplete", "fr-property-input", "fr-security-container"]);

                    if (!isScrollable)
                        e.preventDefault();
                }
            });


            //IOS safari has a bug that report the window height wrong
            if (forerunner.device.isiOS()) {
               // $(document.documentElement).height(window.innerHeight);
                $(window).on("orientationchange", function () {
                    $(document.documentElement).height(window.innerHeight);

                    // Hiding the tool pane and / or the parameter pane is in response to bugs like 670 and
                    // 532. On iOS, the button clicks and scrolling were having trouble if the panes were left
                    // up. So we are going to close them here. The user can reopen if they want.
                    me.hideSlideoutPane(true);
                    me.hideSlideoutPane(false);
                });
            }
        },
        windowResize: function () {
            var me = this;
            me.ResetSize();
            me._updateTopDiv(me);
            me.setBackgroundLayout();
       
                
        },
        _updateTopDiv: function (me) {

            //IOS8 bug, top div width changing to report width.
            if (me.options.isFullScreen) {
                me.$topdiv.css("width", $(window).width());
                return;
            }

            var scrolledContainerTop = $(window).scrollTop() - me.$container.offset().top + me.outerToolbarHeight;
            var containerHeightLessTopDiv = me.$container.height() - me.$topdiv.outerHeight();
            var diff = scrolledContainerTop;

            
            var linkSectionHeight = me.$linksection.is(":visible") ? me.$linksection.outerHeight() : 0;

            //if it is a dashboard report, then not update top div and left/right toolpane top position, scroll it with report
            if (me.isDashboard === false) {
                if (me.$leftpane.is(":visible")) {
                    me.$leftpane.css("top", diff > 0 ? diff : me.$container.scrollTop() + linkSectionHeight);
                } else if (me.$rightpane.is(":visible")) {
                    me.$rightpane.css("top", diff > 0 ? diff : me.$container.scrollTop() + linkSectionHeight);
                }
            }
            
            var floatingTop = diff > 0 ? diff : me.$container.scrollTop(),
                floatingLeft = me.$container.scrollLeft();

            me.$topdiv.css({ "top": floatingTop, "left": floatingLeft });

            // This code cannot be here. This is because on iOS devices at or after iOS8 the new scroll model makes
            // This code get called immediately after enabling pinch zoom. Which in turn makes the toolbar visible,
            // which is wrong. The toolbar needs to be made visible only in response to a _allowZoom() call.
            // 
            //if (!me.isZoomed()) {
            //    me._showTopDiv(false);
            //}
        },
        
        toggleZoom: function () {
            var me = this;
        
            //Only hide on mobile
            if (forerunner.device.isMobile()) {
                if (me.isZoomed() && me.$viewer && me.$viewer.data("forerunner-reportViewer"))
                    me.$viewer.reportViewer("showToolbar", false);
                else if (me.$viewer && me.$viewer.data("forerunner-reportViewer"))
                    me.$viewer.reportViewer("showToolbar", true);
            }
            return;
       
        },
        _allowZoom: function (zoom) {
            var me = this;

            if (me.$viewer !== undefined && me.$viewer.is(":visible")) {
                me.$viewer.reportViewer("allowZoom", zoom);
            } else {
                forerunner.device.allowZoom(zoom);
            }
        },
        showUnZoomPane: function () {
            var me = this;
            me._showTopDiv(true);
            me.$unzoomsection.show();
        },
        wasZoomed: false,
        isZoomed: function(){
            var ratio = forerunner.device.zoomLevel();

            if (ratio > 1.25 || ratio < 0.975)
                return true;
            else
                return false;
        },
        _firstTime: true,
        // Debug
        _lastHeight: 0,
        getHeightValues: function () {
            var me = this;
            var values = {};
            var linkSectionHeight = me.$linksection.is(":visible") ? me.$linksection.outerHeight() : 0;
            
            values.windowHeight = $(window).height();  // PC case
            values.containerHeight = me.$container.height();

            // Start out by adding the height of the location bar to the height
            if (forerunner.device.isiOS()) {
                // iOS reliably returns the innerWindow size for documentElement.clientHeight
                // but window.innerHeight is sometimes the wrong value after rotating the orientation
                values.windowHeight = document.documentElement.clientHeight;

                // Only add extra padding to the height on iphone / ipod, since the ipad browser
                // doesn't scroll off the location bar.

                //This does not seem needed anymore with 8.3
                if (false && forerunner.device.isiPhone() && !forerunner.device.isiPhoneFullscreen() && !forerunner.device.isStandalone()) {
                    values.windowHeight += 60;
                    if (me._firstTime) {
                        values.containerHeight += 60;
                        me._firstTime = false;
                    }
                }
            } else if (forerunner.device.isAndroid()) {
                values.windowHeight = window.innerHeight;
            }

            values.windowHeight -= linkSectionHeight;
            values.containerHeight -= linkSectionHeight;
            values.max = Math.max(values.windowHeight, values.containerHeight);
            if (me.options.isFullScreen) {
                values.paneHeight = values.windowHeight - 38; /* 38 because $leftPaneContent.offset().top, doesn't work on iPhone*/
            } else {
                values.paneHeight = values.containerHeight - 38; /* 38 because $leftPaneContent.offset().top, doesn't work on iPhone*/
            }
            if (window.navigator.standalone && forerunner.device.isiOS()) {
                values.paneHeight = values.max;
            }
            return values;
        },
        ResetSize: function () {
            var me = this;
            
            // Don't add a window resize call here. It causes a never ending series of window resize
            // events to be triggered
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
            if (me.options.isFullScreen) {
                me.$leftpane.css({ height: heightValues.max });
                me.$rightpane.css({ height: heightValues.max });
                me.$topdiv.css("width", $(window).width());
                
            } else {
                me.$leftpane.css({ height: heightValues.containerHeight });
                me.$rightpane.css({ height: heightValues.containerHeight });
            }
            //me.$mainviewport.css({ height: "100%" });
            $(".fr-param-container", me.$container).css({ height: "100%" });
            $(".fr-toolpane", me.$container).css({ height: "100%" });

            //reset parameter pane size, make sure it small than the container width
            var containerWidth = me.$container.width();
            var customRightPaneWidth = forerunner.config.getCustomSettingsValue("ParameterPaneWidth", 280);
            var parameterPaneWidth = customRightPaneWidth < containerWidth ? customRightPaneWidth : containerWidth;

            me.$rightpane.width(parameterPaneWidth);
            me.$rightheader.width(parameterPaneWidth);
            me.$rightpanecontent.width(parameterPaneWidth);
        },
        // removeTopDiv will set the topdiv (I.e., the tool bar) to be permanently hidden
        removeTopDiv: function (removeDiv) {
            var me = this;
            me.topDivRemoved = removeDiv;
            me._showTopDiv(removeDiv);
        },
        // _showTopDiv will set the topdiv visibility
        //
        //  hideTopDiv === true, hidden
        //  hideTopDiv === false, shown
        _showTopDiv: function (hideTopDiv) {
            var me = this;

            var top = hideTopDiv ? 0 : me.$topdiv.outerHeight();
            if (me.isDashboard) {
                top += me.outerToolbarHeight;
            }

            me.$viewer.reportViewer("option", "toolbarHeight", top);

            if ((me.topDivRemoved && me.topDivRemoved === true) || hideTopDiv === true) {
                me.$topdiv.addClass("fr-core-hidden").removeClass("fr-core-block");
                me.$topdivspacer.addClass("fr-core-hidden").removeClass("fr-core-block");
            }
            else {
                me.$topdiv.addClass("fr-core-block").removeClass("fr-core-hidden");
                me.$topdivspacer.addClass("fr-core-block").removeClass("fr-core-hidden");
            }
        },


        bindExplorerEvents: function () {
            var me = this;

            //resize after explorer fetch to account for scrool bar if there
            me.$container.on(events.reportExplorerAfterFetch(), function (e, data) {
                me.ResetSize();
            });
        },

        bindViewerEvents: function () {
            var me = this;
            var events = forerunner.ssr.constants.events;

            var $viewer = $(".fr-layout-reportviewer", me.$container);
            me.$viewer = $viewer;
            $viewer.on(events.reportViewerActionHistoryPop(), function (e, data) { me.hideSlideoutPane(false); });
            $viewer.on(events.reportViewerDrillThrough(), function (e, data) { me.hideSlideoutPane(true); me.hideSlideoutPane(false); });
            $viewer.on(events.reportViewerShowNav(), function (e, data) {
                var $spacer = me.$bottomdivspacer;

                if (!data.open) {
                    $spacer.hide();
                    //me.$pagesection.show();
                    me.$container.removeClass("fr-layout-container-noscroll");
                    me.$pagesection.removeClass("fr-layout-pagesection-noscroll");
                }
                else {
                    $spacer.show();
                    //don't need to hide page section when navigation open in both full or non-full mode
                    //if (forerunner.device.isSmall(me.options.$container))
                    //    me.$pagesection.hide();

                    me.$container.addClass("fr-layout-container-noscroll");
                    me.$pagesection.addClass("fr-layout-pagesection-noscroll");
                }

            });
            $viewer.on(events.reportViewerShowDocMap(), function (e, data) {
                me.scrollLock = true;
                if (me.savePosition) {
                    me.$viewer.reportViewer("option", "savePosition", me.savePosition);
                }
                me.scrollToPosition(me.getOriginalPosition());
            });

            $viewer.on(events.reportViewerHideDocMap(), function (e, data) {
                me.scrollLock = false;
                me.restoreScrollPosition();
            });

            $viewer.on(events.reportViewerallowZoom(), function (e, data) {
                me._showTopDiv.call(me, data.isEnabled);
            });

            $viewer.on(events.reportViewerSetPageDone(), function (e, data) {
                me.setBackgroundLayout.apply(me, arguments);

                if (me.isDashboard) {
                    me.$viewer.reportViewer("option", "toolbarHeight", me.outerToolbarHeight + me.$topdiv.outerHeight());
                }
            });

            //  Just in case it is hidden
            $viewer.on(events.reportViewerChangePage(), function (e, data) {
                me.$pagesection.show();
            });

            //resize after pageloaded to account for scrool bar if there
            $viewer.on(events.reportViewerSetPageDone(), function (e, data) {
                me.ResetSize();
            });
            
                        
            //nav to the found keyword and clear saved position to resolve the conflict with left pane.
            $viewer.on(events.reportViewerNavToPosition(), function (e, data) {
                var timeout = 0;

                if (forerunner.device.isWindowsPhone()) {
                    timeout = 200;
                }

                setTimeout(function () {
                    me.scrollToPosition(data);
                    me.savePosition = null;
                }, timeout);
                
            });

            $viewer.on(events.reportViewerPreLoadReport(), function (e, data) {
                me.cleanUp();
            });

            $viewer.on(events.reportViewerFind(), function (e, data) {
                if (me.$leftpane.is(":visible")) {
                    me.hideSlideoutPane(true);
                }
            });

            var isTouch = forerunner.device.isTouch();
            // For touch device, update the header only on scrollstop.
            if (isTouch && !me.options.isFullScreen) {
                me.$pagesection.on("scrollstop", function () { me._updateTopDiv(me); });
            }

            $viewer.reportViewer("option", "onInputFocus", me.onInputFocus());
            $viewer.reportViewer("option", "onInputBlur", me.onInputBlur());
        },
        onInputFocus: function () {
            var me = this;

            if (forerunner.device.isiOS()) {
                return function () {
                    setTimeout(function () {
                        if (me.options.isFullScreen)
                            me._makePositionAbsolute();

                        me.$pagesection.addClass("fr-layout-pagesection-noscroll");
                        me.$container.addClass("fr-layout-container-noscroll");

                        $(window).scrollTop(0);
                        $(window).scrollLeft(0);
                        me.ResetSize();
                    }, 50);
                };
            }

            return null;
        },
        onInputBlur: function () {
            var me = this;

            if (forerunner.device.isiOS()) {
                return function () {
                    setTimeout(function () {
                        if (me.options.isFullScreen)
                            me._makePositionFixed();

                        if (me.$leftpane && !me.$leftpane.is(":visible") && !me.$rightpane.is(":visible") && me.showModal !== true) {
                            me.$pagesection.removeClass("fr-layout-pagesection-noscroll");
                            me.$container.removeClass("fr-layout-container-noscroll");
                        }

                        $(window).scrollTop(0);
                        $(window).scrollLeft(0);

                        if (me.ResetSize)
                            me.ResetSize();
                    }, 50);
                };
            }

            return null;
        },
        getScrollPosition: function () {
            var me = this;
            var position = {};

            if (me.$viewer !== undefined && me.$viewer.is(":visible")) {
                position = me.$viewer.reportViewer("getScrollPosition");
            }
            else {
                position.left = $(window).scrollLeft();
                position.top = $(window).scrollTop();
                position.innerLeft = me.$container.scrollLeft();
                position.innerTop = me.$container.scrollTop();
            }
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

            if (me.$viewer !== undefined && me.$viewer.is(":visible")) {
                me.$viewer.reportViewer("scrollReportTo", position);
            }
            else {

                if (position.left)
                    $(window).scrollLeft(position.left);
                if (position.top)
                    $(window).scrollTop(position.top);
                if (position.innerLeft)
                    me.$container.scrollLeft(position.innerLeft);
                if (position.innerTop)
                    me.$container.scrollTop(position.innerTop);
            }
        },
        restoreScrollPosition: function () {
            var me = this;
            if (me.savePosition && !me.scrollLock) {

                if (me.$viewer !== undefined && me.$viewer.is(":visible")) {
                    me.$viewer.reportViewer("scrollReportTo", me.savePosition);
                }
                else {
                    me.$container.scrollLeft(me.savePosition.innerLeft);
                    me.$container.scrollTop(me.savePosition.innerTop);
                    $(window).scrollLeft(me.savePosition.left);
                    $(window).scrollTop(me.savePosition.top);
                }
                me.savePosition = null;
            }
        },
        hideAddressBar: function (isLeftPane, callback) {
            var me = this;
            var containerPosition = me.getOriginalPosition();
            var delay = (document.height <= window.outerHeight + 10) ? 50 : 0;
            if (!isLeftPane) containerPosition.left = null;

            setTimeout(function () {
                me.scrollToPosition(containerPosition);
                if (typeof callback === "function") {
                    callback();
                }
            }, delay);
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

            me._allowZoom(true);
            if (slideoutPane.is(":visible")) {
                if (isLeftPane) {
                    slideoutPane.slideLeftHide(delay * 0.5);
                } else {
                    slideoutPane.slideRightHide(delay * 0.5);
                }
                topdiv.removeClass(className, delay);
                for (var key in me.$mainheadersection.data()) {
                    var widget = me.$mainheadersection.data()[key];
                    if (widget.widgetName) {
                        me.$mainheadersection[widget.widgetName]("showAllTools");
                    }
                }
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
                me.$viewer.reportViewer("triggerEvent", events.hidePane, { isLeftPane: isLeftPane });
            }
        },
        showSlideoutPane: function (toolbarWidgetName, isLeftPane) {
            var me = this;

            me._allowZoom(false);
            if (me.$viewer !== undefined && me.$viewer.is(":visible")) {
                me.$viewer.reportViewer("allowSwipe", false);
            }

            var className = isLeftPane ? "fr-layout-mainViewPortShiftedRight" : "fr-layout-mainViewPortShiftedLeft";
            var mainViewPort = me.$mainviewport;
            var slideoutPane = isLeftPane ? me.$leftpane : me.$rightpane;
            var topdiv = me.$topdiv;
            var delay = Number(200);
            
            if (!slideoutPane.is(":visible")) {
                var routeLinkPaneOffset = me.$linksection.is(":visible") ? me.$linksection.outerHeight() : 0;
                
                slideoutPane.css({ height: Math.max($(window).height() - routeLinkPaneOffset, mainViewPort.height()) - routeLinkPaneOffset });
                if (isLeftPane) {
                    slideoutPane.css({ top: routeLinkPaneOffset });
                    slideoutPane.slideLeftShow(delay);
                } else {
                    slideoutPane.css({ top: routeLinkPaneOffset });
                    slideoutPane.slideRightShow(delay);
                }
                
                topdiv.addClass(className, delay);
                for (var key in me.$mainheadersection.data()) {
                    var widget = me.$mainheadersection.data()[key];
                    if (widget.widgetName) {
                        me.$mainheadersection[widget.widgetName]("hideAllTools");
                    }
                }

                if (me.$viewer !== undefined && me.$viewer.is(":visible")) {
                    me.$viewer.reportViewer("allowSwipe", false);
                }
            }

            // Make sure the address bar is not showing when a side out pane is showing
            // Take add noscroll process as callback to make sure the execute sequence with hideAddress.
            me.hideAddressBar(isLeftPane, function () {
                me.$container.addClass("fr-layout-container-noscroll");
                me.$pagesection.addClass("fr-layout-pagesection-noscroll");
                me.$container.resize();
            });

            if (me.$viewer !== undefined && me.$viewer.is(":visible")) {
                me.$viewer.reportViewer("triggerEvent", events.showPane, { isLeftPane: isLeftPane });
            }
        },
        _isReportViewer: function () {
            var me = this;
            if (widgets.hasWidget(me.$container, widgets.reportViewerEZ)) {
                var reportArea = me.$container.find(".fr-report-areacontainer");
                if (reportArea.length === 1) {
                    return true;
                }
            }
            return false;
        },
        setBackgroundLayout: function (e, data) {
            var me = this;
            if (!me._isReportViewer()) {
                // This is needed for the dashboard case. We cannot have the fr-render-bglayer set for
                // the dashboard viewer. Each report will already be handled.
                return;
            }

            var reportArea = $(".fr-report-areacontainer", me.$container);
            var containerHeight = me.$container.height();
            var containerWidth = me.$container.width();
            var topDivHeight = me.$topdiv.outerHeight();

            if (reportArea.height() > (containerHeight - topDivHeight) || reportArea.width() > containerWidth) {
                $(".fr-render-bglayer", me.$container).css("position", "absolute").
                    css("height", Math.max(reportArea.height(), (containerHeight - topDivHeight)))
                    .css("width", Math.max(reportArea.width(), containerWidth));
            }
            else {
                $(".fr-render-bglayer", me.$container).css("position", "absolute")
                    .css("height", (containerHeight - topDivHeight)).css("width", containerWidth);
            }
        },
        cleanUp: function () {
            var me = this;

            me.hideSlideoutPane(true);
            me.hideSlideoutPane(false);
            me.$bottomdiv.hide();
            me.$bottomdivspacer.hide();
            me.$pagesection.show();
            me.$pagesection.removeClass("fr-layout-pagesection-noscroll");
            me.$container.removeClass("fr-layout-container-noscroll");
        },
        _selectedItemPath: null,
    };
});  // $(function ()
