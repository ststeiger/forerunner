// Assign or create the single globally scoped variable
var forerunner = forerunner || {};

// Forerunner SQL Server Reports
forerunner.ssr = forerunner.ssr || {};

$(function () {
    var ssr = forerunner.ssr;
    var toolTypes = ssr.constants.toolTypes;

    ssr.ReportViewerInitializerBase = function (options) {
        this.options = {
            $toolbar: null,
            $toolPane: null,
            $viewer: null,
            $nav: null,
            $paramarea: null,
            $lefttoolbar: null,
            $righttoolbar: null,
            ReportServerURL: null,
            ReportViewerAPI: null,
            ReportPath: null,
            toolbarHeight: null,
            navigateTo: null
        };

        // Merge options with the default settings
        if (options) {
            $.extend(this.options, options);
        }
    };

    ssr.ReportViewerInitializerBase.prototype = {
        render: function () {
            var me = this;
            var $viewer = me.options.$viewer;

            $viewer.reportViewer({
                reportServerURL: me.options.ReportServerURL,
                reportViewerAPI: me.options.ReportViewerAPI,
                reportPath: me.options.ReportPath,
                PageNum: 1,
            });

            // Create / render the toolbar
            var $toolbar = me.options.$toolbar;
            $toolbar.toolbar({ $reportViewer: $viewer });
            // Let the report viewer know the height of the toolbar
            $viewer.reportViewer('option', 'toolbarHeight', me.options.toolbarHeight());

            var $lefttoolbar = me.options.$lefttoolbar;
            if ($lefttoolbar != null) {
                $lefttoolbar.toolbar({ $reportViewer: $viewer, toolClass: 'fr-toolbar-slide' });
            }

            var $righttoolbar = me.options.$righttoolbar;
            if ($righttoolbar != null) {
                $righttoolbar.toolbar({ $reportViewer: $viewer, toolClass: 'fr-toolbar-slide' });
            }

            // Create / render the menu pane
            var $toolPane = me.options.$toolPane.toolpane({ $reportViewer: $viewer });

            var $nav = me.options.$nav;
            if ($nav != null) {
                $nav.pagenav({ $reportViewer: $viewer });
                $viewer.reportViewer('option', 'pageNav', $nav);
            }

            var $paramarea = me.options.$paramarea;
            if ($paramarea != null) {
                $paramarea.reportParameter({ $reportViewer: $viewer });
                $viewer.reportViewer('option', 'paramArea', $paramarea);
            }
        },
    };
});  // $(function ()
