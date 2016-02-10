/**
 * @file Contains the ReportViewerEZ widget.
 *
 */

// Assign or create the single globally scoped variable
var forerunner = forerunner || {};

// Forerunner SQL Server Reports
forerunner.ssr = forerunner.ssr || {};

$(function () {
    var constants = forerunner.ssr.constants;
    var widgets = constants.widgets;
    var events = constants.events;
    var helper = forerunner.helper;
    var propertyEnums = forerunner.ssr.constants.properties;
    
     /**
     * Widget used to view a report
     *
     * @namespace $.forerunner.reportViewerEZ
     * @prop {Object} options - The options for reportViewerEZ
     * @prop {Object} options.DefaultAppTemplate -- The helper class that creates the app template.  If it is null, the widget will create its own.
     * @prop {Object} options.navigateTo - Callback function used to navigate to a selected report.  Only needed if isReportManager == true.
     * @prop {Object} options.historyBack - Callback function used to go back in browsing history.  Only needed if isReportManager == true.
     * @prop {Boolean} options.isReportManager - A flag to determine whether we should render report manager integration items.  Defaults to false.
     * @prop {Boolean} options.isFullScreen - A flag to determine whether show report viewer in full screen. Default to true.
     * @prop {Object} options.userSettings - Custom user setting
     * @prop {Object} options.dbConfig - Database configuration
     * @prop {String} options.rsInstance - Report service instance name
     * @prop {Boolean} options.useReportManagerSettings - Defaults to false if isReportManager is false.  If set to true, will load the user saved parameters and user settings from the database.
     * @prop {String} options.toolbarConfigOption - Defaults to forerunner.ssr.constants.toolbarConfigOption.full
     * @prop {Boolean} options.handleWindowResize - Handle the window resize events automatically. In cases such as dashboards this can be set to false. Call resize in this case.
     * @prop {Boolean} options.showBreadCrumb - A flag to determine whether show breadcrumb navigation upon the toolbar. Defaults to false.
     * @prop {String} options.zoom- Zoom factor. Defaults to 100.
     *
     * @example
     * $("#reportViewerEZId").reportViewerEZ({
     *  DefaultAppTemplate: null,
     *  navigateTo: navigateTo,
     *  historyBack: historyBack
     *  isReportManager: false,
     *  userSettings: userSettings
     * });
     */
    $.widget(widgets.getFullname(widgets.reportViewerEZ), $.forerunner.toolBase, {
        options: {
            DefaultAppTemplate: null,
            jsonPath: null,
            navigateTo: null,
            historyBack: null,
            isReportManager: false,
            isFullScreen: true,
            userSettings: null,
            rsInstance: null,
            useReportManagerSettings: false,
            toolbarConfigOption: constants.toolbarConfigOption.full,
            handleWindowResize: true,
            showBreadCrumb: false,
            showParameterArea: "Collapsed",
            zoom: "100",
            dbConfig: {}
        },
        _render: function () {
            var me = this;
            var layout = me.DefaultAppTemplate;
            
            layout.$bottomdivspacer.addClass("fr-nav-spacer").hide();
            layout.$bottomdiv.addClass("fr-nav-container").hide();
            layout.$bottomdiv.css("position", me.options.isFullScreen ? "fixed" : "absolute");

            //layout.$mainviewport.css({ width: "100%", height: "100%" });
            layout.$mainsection.html(null);
            var $viewer = new $("<DIV />");
            $viewer.addClass("fr-layout-reportviewer");
            layout.$mainsection.append($viewer);

            me.$viewer = $viewer;

            var initializer = new forerunner.ssr.ReportViewerInitializer({
                $toolbar: layout.$mainheadersection,
                $toolPane: layout.$leftpanecontent,
                $routeLink: layout.$linksection,
                $viewer: $viewer,
                $nav: layout.$bottomdiv,
                $paramarea: layout.$rightpanecontent,
                $lefttoolbar: layout.$leftheader,
                $righttoolbar: layout.$rightheader,
                $docMap: layout.$docmapsection,
                ReportViewerAPI: forerunner.config.forerunnerAPIBase() + "ReportViewer",
                jsonPath: me.options.jsonPath,
                navigateTo: me.options.navigateTo,
                isReportManager: me.options.isReportManager,
                userSettings: me.options.userSettings,
                $appContainer: layout.$container,
                rsInstance: me.options.rsInstance,
                useReportManagerSettings: me.options.useReportManagerSettings,
                $unzoomtoolbar: layout.$unzoomsection,
                toolbarConfigOption: me.options.toolbarConfigOption,
                zoom: me.options.zoom,
                showSubscriptionOnOpen: me.options.showSubscriptionOnOpen,
                dbConfig: me.options.dbConfig
            });

            initializer.render();

            $viewer.on(events.reportViewerBack(), function (e, data) {
                layout._selectedItemPath = data.path;
                //when exit the report we need to set the DefaultAppTemplate.$viewer to undefined
                //if not then the toggleZoom in the DefaultAppTemplate.js will keep invoke the showToolbar method 
                //on reportViewer which was destroyed already and throw error - fixed #1349 by baotong.wang
                layout.$viewer = void 0;

                if (me.options.historyBack) {
                    me.options.historyBack();
                }             
            });

            $viewer.on(events.reportViewerActionHistoryPop(), function (e, data) {
                if (!me.options.historyBack && ($viewer.reportViewer("actionHistoryDepth") === 0)) {
                    layout.$mainheadersection.toolbar("disableTools", [forerunner.ssr.tools.toolbar.btnReportBack]);
                    layout.$leftpanecontent.toolPane("disableTools", [forerunner.ssr.tools.toolpane.itemReportBack]);
                }
            });

            $viewer.on(events.reportViewerActionHistoryPush(), function (e, data) {
                if (!me.options.historyBack) {
                    layout.$mainheadersection.toolbar("enableTools", [forerunner.ssr.tools.toolbar.btnReportBack]);
                    layout.$leftpanecontent.toolPane("enableTools", [forerunner.ssr.tools.toolpane.itemReportBack]);
                }
            });

            $viewer.on(events.reportViewerPreLoadReport(), function (e, data) {
                if (me.options.DefaultAppTemplate === null) {
                    //init property dialog in reportviewer
                    layout.$propertySection.forerunnerProperties("option", "rsInstance", me.options.rsInstance);
                    layout.$propertySection.forerunnerProperties("setProperties", "viewer", data.newPath, [propertyEnums.description, propertyEnums.tags, propertyEnums.rdlExtension, propertyEnums.visibility]);
                }
            });

            $viewer.on(events.reportViewerChangePage(), function (e, data) {
                if (me.options.isFullScreen && (forerunner.device.isMobile())) {
                   $viewer.reportViewer("scrollReportBody");
                }
            });
            

            if (me.options.historyBack){
                layout.$mainheadersection.toolbar("enableTools", [forerunner.ssr.tools.toolbar.btnReportBack]);
                layout.$leftpanecontent.toolPane("enableTools", [forerunner.ssr.tools.toolpane.itemReportBack]);
            }

            me.DefaultAppTemplate.bindViewerEvents();

            if (me.options.toolbarConfigOption === constants.toolbarConfigOption.hide) {
                layout.removeTopDiv(true);
            }
        },
        _create: function () {
            var me = this;

            if (me.options.handleWindowResize) {
                $(window).on("resize", function (e, data) {
                    helper.delay(me, function () {
                        me.windowResize.call(me);
                    });
                });
            }
        },
        _init: function () {
            var me = this;
            me._super();

            if (me.options.DefaultAppTemplate === null) {
                me.DefaultAppTemplate = new forerunner.ssr.DefaultAppTemplate({
                    $container: me.element,
                    isFullScreen: me.options.isFullScreen
                }).render();
            } else {
                me.DefaultAppTemplate = me.options.DefaultAppTemplate;
            }

            if (me.options.showBreadCrumb === false) {
                me.DefaultAppTemplate.$linksection.hide();
            }

            me._render();
            
            if (me.options.isFullScreen && (forerunner.device.isWindowsPhone() && !forerunner.device.isWindowsPhone81())) {
                // if the viewer is full screen, we will set up the viewport here. Note that on Windows
                // Phone 8, the equivalent of the user-zoom setting only works with @-ms-viewport and not
                // with the meta tag.
                var $viewportStyle = $("#fr-viewport-style");
                if ($viewportStyle.length === 0) {
                    var userZoom = "fixed";
                    if (sessionStorage.forerunner_zoomReload_userZoom) {
                        var zoomReloadStringData = sessionStorage.forerunner_zoomReload_userZoom;
                        delete sessionStorage.forerunner_zoomReload_userZoom;
                        var zoomReloadData = JSON.parse(zoomReloadStringData);
                        if (zoomReloadData.userZoom) {
                            userZoom = zoomReloadData.userZoom;
                        }
                    }

                    $viewportStyle = $("<style id=fr-viewport-style>@-ms-viewport {width:auto; user-zoom:" + userZoom + ";}</style>");
                    //-ms-overflow-style: none; will enable the scroll again in IEMobile 10.0 (WP8)
                    var $IEMobileScrollStyle = $("<style>ul.fr-nav-container, .fr-layout-leftpane, .fr-layout-rightpane { -ms-overflow-style: none; }</style>");
                    $("head").slice(0).append($viewportStyle).append($IEMobileScrollStyle);

                    // Show the unzoom toolbar
                    if (userZoom === "zoom") {
                        forerunner.device.allowZoom(true);
                        me.DefaultAppTemplate.showUnZoomPane.call(me.DefaultAppTemplate);
                    }
                }
            }
        },
        /**
         * Call this function when the handleWindowResize is set to true. It
         * handles the updating of the viewer, and associated widget, sizes.
         *
         * @function $.forerunner.reportViewerEZ#windowResize
         */
        windowResize: function () {            
            var me = this;

            // if the viewer is not visible then do nothing
            if (!me.$viewer || me.$viewer.is(":visible") === false) {
                return;
            }

            if (me.DefaultAppTemplate !== null) {
                me.DefaultAppTemplate.windowResize.call(me.DefaultAppTemplate);
            }
            var $reportViewer = me.getReportViewer();
            if (widgets.hasWidget($reportViewer, widgets.reportViewer)) {
                $reportViewer.reportViewer("windowResize");
            }

            if (me.options.isFullScreen && (forerunner.device.isiOS()))
                if (widgets.hasWidget($reportViewer, widgets.reportViewer)) {
                    $reportViewer.reportViewer("scrollReportBody");
                }

            var $toolbar = me.getToolbar();
            if (widgets.hasWidget($toolbar, widgets.toolbar)) {
                //Make sure the toolbar has the right buttons always
                setInterval(function () {
                    me.getToolbar().toolbar("windowResize");
                }, 100);
            }
        },
        /**
         * Get report viewer page navigation section
         *
         * @function $.forerunner.reportViewerEZ#getPageNav
         * 
         * @return {Object} - report viewer page navigation jQuery object
         */
        getPageNav: function () {
            var me = this;
            if (me.DefaultAppTemplate) {
                return me.DefaultAppTemplate.$bottomdiv;
            }

            return null;
        },
        /**
         * Get report viewer document map section
         *
         * @function $.forerunner.reportViewerEZ#getReportDocumentMap
         * 
         * @return {Object} - report viewer document map jQuery object
         */
        getReportDocumentMap: function () {
            var me = this;
            if (me.DefaultAppTemplate) {
                return me.DefaultAppTemplate.$docmapsection;
            }

            return null;
        },
        /**
         * Get report viewer report parameter section
         *
         * @function $.forerunner.reportViewerEZ#getReportParameter
         * 
         * @return {Object} - report viewer report parameter jQuery object
         */
        getReportParameter: function () {
            var me = this;
            if (me.DefaultAppTemplate) {
                return me.DefaultAppTemplate.$rightpanecontent;
            }

            return null;
        },
        /**
         * Get report viewer section
         *
         * @function $.forerunner.reportViewerEZ#getReportViewer
         * 
         * @return {Object} - report viewer jQuery object
         */
        getReportViewer: function () {
            var me = this;

            if (me.DefaultAppTemplate) {
                var $viewer = me.DefaultAppTemplate.$mainsection.find(".fr-layout-reportviewer");
                if ($viewer.length !== 0) {
                    return $viewer;
                }
            }

            return null;
        },
        /**
         * Get report viewer toolbar section
         *
         * @function $.forerunner.reportViewerEZ#getToolbar
         * 
         * @return {Object} - report viewer toolbar jQuery object
         */
        getToolbar: function () {
            var me = this;
            if (me.DefaultAppTemplate) {
                return me.DefaultAppTemplate.$mainheadersection;
            }

            return null;
        },
        /**
         * Get report viewer toolpane section
         *
         * @function $.forerunner.reportViewerEZ#getToolPane
         * 
         * @return {Object} - report viewer toolpane jQuery object
         */
        getToolPane: function () {
            var me = this;
            if (me.DefaultAppTemplate) {
                return me.DefaultAppTemplate.$leftpanecontent;
            }

            return null;
        },
        /**
         * Get report viewer left toolbar section
         *
         * @function $.forerunner.reportViewerEZ#getLeftToolbar
         * 
         * @return {Object} - report viewer left toolbar jQuery object
         */
        getLeftToolbar: function () {
            var me = this;
            if (me.DefaultAppTemplate) {
                return me.DefaultAppTemplate.$leftheader;
            }

            return null;
        },
        /**
         * Get report viewer right toolbar section
         *
         * @function $.forerunner.reportViewerEZ#getRightToolbar
         * 
         * @return {Object} - report viewer right toolbar jQuery object
         */
        getRightToolbar: function () {
            var me = this;
            if (me.DefaultAppTemplate) {
                return me.DefaultAppTemplate.$rightheader;
            }

            return null;
        }
    });  // $.widget
});  // function()