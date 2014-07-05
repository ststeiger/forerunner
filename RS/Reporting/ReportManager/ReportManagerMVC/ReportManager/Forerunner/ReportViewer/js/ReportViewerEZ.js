// Assign or create the single globally scoped variable
var forerunner = forerunner || {};

// Forerunner SQL Server Reports
forerunner.ssr = forerunner.ssr || {};

$(function () {
    var constants = forerunner.ssr.constants;
    var widgets = constants.widgets;
    var helper = forerunner.helper;
    
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
     * @prop {Boolean} options.userSettings - Custom user setting
     * @prop {String} options.rsInstance - Report service instance name
     * @prop {Boolean} options.useReportManagerSettings - Defaults to false if isReportManager is false.  If set to true, will load the user saved parameters and user settings from the database.
     * @prop {Boolean} options.toolbarConfigOption - Defaults to forerunner.ssr.constants.toolbarConfigOption.full
     * @prop {Boolean} options.handleWindowResize - Handle the window resize events automatically. In cases such as dashboards this can be set to false. Call resize in this case.
     *
     * @example
     * $("#reportViewerEZId").reportViewerEZ({
     *  DefaultAppTemplate: null,
     *  navigateTo: me.navigateTo,
     *  historyBack: me.historyBack
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
            handleWindowResize: true
        },
        _render: function () {
            var me = this;
            var layout = me.DefaultAppTemplate;
            forerunner.device.allowZoom(false);
            layout.$bottomdivspacer.addClass("fr-nav-spacer").hide();
            layout.$bottomdiv.addClass("fr-nav-container").hide();
            layout.$bottomdiv.css("position", me.options.isFullScreen ? "fixed" : "absolute");

            //layout.$mainviewport.css({ width: "100%", height: "100%" });
            layout.$mainsection.html(null);
            var $viewer = new $("<DIV />");
            $viewer.addClass("fr-layout-reportviewer");
            layout.$mainsection.append($viewer);

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
                toolbarConfigOption: me.options.toolbarConfigOption
            });

            initializer.render();

            $viewer.on("reportviewerback", function (e, data) {
                layout._selectedItemPath = data.path;
                if (me.options.historyBack) {
                    me.options.historyBack();
                }             
            });

            $viewer.on("reportvieweractionhistorypop", function (e, data) {
                if (!me.options.historyBack && ($viewer.reportViewer("actionHistoryDepth") === 0)) {
                    layout.$mainheadersection.toolbar("disableTools", [forerunner.ssr.tools.toolbar.btnReportBack]);
                    layout.$leftpanecontent.toolPane("disableTools", [forerunner.ssr.tools.toolpane.itemReportBack]);
                }
            });

            $viewer.on("reportvieweractionhistorypush", function (e, data) {
                if (!me.options.historyBack) {
                    layout.$mainheadersection.toolbar("enableTools", [forerunner.ssr.tools.toolbar.btnReportBack]);
                    layout.$leftpanecontent.toolPane("enableTools", [forerunner.ssr.tools.toolpane.itemReportBack]);
                }
            });

            if (me.options.historyBack){
                layout.$mainheadersection.toolbar("enableTools", [forerunner.ssr.tools.toolbar.btnReportBack]);
                layout.$leftpanecontent.toolPane("enableTools", [forerunner.ssr.tools.toolpane.itemReportBack]);
            }

            me.DefaultAppTemplate.bindViewerEvents();
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
            
            var showBreadcrumb = forerunner.config.getCustomSettingsValue("showBreadCrumbInViewer", "off");
            if (showBreadcrumb === "off") {
                me.hideRouteLink();
            }

            me._render();

            if (me.options.isFullScreen && (forerunner.device.isWindowsPhone() )) {
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

                    $viewportStyle = $("<style id=fr-viewport-style>@-ms-viewport {width:device-width; user-zoom:" + userZoom + ";}</style>");
                    $("head").slice(0).append($viewportStyle);

                    // Show the unzoom toolbar
                    if (userZoom === "zoom") {
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
            var $reportViewer = me.getReportViewer();
            $reportViewer.reportViewer("windowResize");
            if (me.options.DefaultAppTemplate === null) {
                me.DefaultAppTemplate.windowResize.call(me.DefaultAppTemplate);
            }
        },
        /**
         * Hide the breadcrumb section
         *
         * @function $.forerunner.reportViewerEZ#hideRouteLink
         */
        hideRouteLink: function(){
            var me = this;
            me.DefaultAppTemplate.$linksection.hide();
        },
        /**
         * Get report viewer page navigation
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
         * Get report viewer document map
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
         * Get report viewer report parameter
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
         * Get report viewer
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
         * Get report viewer toolbar
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
         * Get report viewer toolpane
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
         * Get report viewer left toolbar
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
         * Get report viewer right toolbar
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
        },
    });  // $.widget
});  // function()