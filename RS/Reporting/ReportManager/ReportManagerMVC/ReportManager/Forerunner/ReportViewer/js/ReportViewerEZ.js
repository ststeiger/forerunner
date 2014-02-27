// Assign or create the single globally scoped variable
var forerunner = forerunner || {};

// Forerunner SQL Server Reports
forerunner.ssr = forerunner.ssr || {};

$(function () {
    var widgets = forerunner.ssr.constants.widgets;

    
     /**
     * Widget used to view a report
     *
     * @namespace $.forerunner.reportViewerEZ
     * @prop {Object} options - The options for reportViewerEZ
     * @prop {Object} options.DefaultAppTemplate -- The helper class that creates the app template.  If it is null, the widget will create its own.
     * @prop {String} options.path - Path of the report
     * @prop {String} options.jsonPath - Path of the report
     * @prop {Object} options.navigateTo - Callback function used to navigate to a selected report.  Only needed if isReportManager == true.
     * @prop {Object} options.historyBack - Callback function used to go back in browsing history.  Only needed if isReportManager == true.
     * @prop {String} options.savedParameters - A list of parameters to use in lieu of the default parameters or the forerunner managed list.  Optional.
     * @prop {Boolean} options.isReportManager - A flag to determine whether we should render report manager integration items.  Defaults to false.
     * @prop {Boolean} options.isFullScreen - A flag to determine whether show report viewer in full screen. Default to true.
     * @prop {Boolean} options.userSettings - Custom user setting
     * @prop {String} options.rsInstance - Report service instance name
     * @prop {Boolean} options.useReportManagerSettings - Defaults to false if isREportManager is false.  If set to true, will load the user saved parameters and user settings from the database.
     *
     * @example
     * $("#reportViewerEZId").reportViewerEZ({
     *  DefaultAppTemplate: null,
     *  path: path,
     *  navigateTo: me.navigateTo,
     *  historyBack: me.historyBack
     *  isReportManager: false,
     *  userSettings: userSettings
     * });
     */
    $.widget(widgets.getFullname(widgets.reportViewerEZ), $.forerunner.toolBase, {
        options: {
            DefaultAppTemplate: null,
            path: null,
            jsonPath: null,
            navigateTo: null,
            historyBack: null,
            isReportManager: false,
            isFullScreen: true,
            userSettings: null,
            savedParameters: null,
            rsInstance: null,
            useReportManagerSettings: false,
        },
        _render: function () {
            var me = this;
            var layout = me.DefaultAppTemplate;
            var path = me.options.path;
            forerunner.device.allowZoom(false);
            layout.$bottomdivspacer.addClass("fr-nav-spacer").hide();
            layout.$bottomdiv.addClass("fr-nav-container").hide();
            layout.$bottomdiv.css("position", me.options.isFullScreen ? "fixed" : "absolute");

            if (path !== null) {
                path = String(path).replace(/%2f/g, "/");
            } else {
                path = "/";
            }

            //layout.$mainviewport.css({ width: "100%", height: "100%" });
            layout.$mainsection.html(null);
            var $viewer = new $("<DIV />");
            $viewer.addClass("fr-layout-reportviewer");
            layout.$mainsection.append($viewer);

            var initializer = new forerunner.ssr.ReportViewerInitializer({
                $toolbar: layout.$mainheadersection,
                $toolPane: layout.$leftpanecontent,
                $viewer: $viewer,
                $nav: layout.$bottomdiv,
                $paramarea: layout.$rightpanecontent,
                $lefttoolbar: layout.$leftheader,
                $righttoolbar: layout.$rightheader,
                $docMap: layout.$docmapsection,
                ReportViewerAPI: forerunner.config.forerunnerAPIBase() + "ReportViewer",
                ReportPath: path,
                jsonPath: me.options.jsonPath,
                navigateTo: me.options.navigateTo,
                isReportManager: me.options.isReportManager,
                userSettings: me.options.userSettings,
                savedParameters: me.options.savedParameters,
                $appContainer: layout.$container,
                rsInstance: me.options.rsInstance,
                useReportManagerSettings: me.options.useReportManagerSettings,
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

            layout.$rightheaderspacer.height(layout.$topdiv.height());
            layout.$leftheaderspacer.height(layout.$topdiv.height());
        },
        _init: function () {
            var me = this;
            me._super();

            if (me.options.DefaultAppTemplate === null) {
                me.DefaultAppTemplate = new forerunner.ssr.DefaultAppTemplate({ $container: me.element, isFullScreen: me.options.isFullScreen }).render();
            } else {
                me.DefaultAppTemplate = me.options.DefaultAppTemplate;
            }
            me._render();
        },
    });  // $.widget
});  // function()