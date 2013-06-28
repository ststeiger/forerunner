﻿// Assign or create the single globally scoped variable
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
                ReportServerURL: me.options.ReportServerURL,
                ReportViewerAPI: me.options.ReportViewerAPI,
                ReportPath: me.options.ReportPath,
                PageNum: 1,
            });

            // Create / render the toolbar
            var $toolbar = me.options.$toolbar;
            $toolbar.toolbar({ $reportViewer: $viewer });
            // Let the report viewer know the height of the toolbar
            $viewer.reportViewer('option', 'ToolbarHeight', me.options.toolbarHeight());

            $lefttoolbar = me.options.$lefttoolbar;
            if ($lefttoolbar != null) {
                $lefttoolbar.toolbar({ $reportViewer: $viewer, toolClass: 'fr-toolbar-slide' });
            }

            $righttoolbar = me.options.$righttoolbar;
            if ($righttoolbar != null) {
                $righttoolbar.toolbar({ $reportViewer: $viewer, toolClass: 'fr-toolbar-slide' });
            }

            // Create / render the menu pane
            var $toolPane = me.options.$toolPane.toolpane({ $reportViewer: $viewer });

            $nav = me.options.$nav;
            if ($nav != null) {
                $nav.pagenav({ $reportViewer: $viewer });
                $viewer.reportViewer('option', 'PageNav', $nav);
            }

            $paramarea = me.options.$paramarea;
            if ($paramarea != null) {
                $paramarea.reportParameter({ $reportViewer: $viewer });
                $viewer.reportViewer('option', 'ParamArea', $paramarea);
            }
        },
    };
});  // $(function ()
