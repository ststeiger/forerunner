﻿// Assign or create the single globally scoped variable
var forerunner = forerunner || {};

// Forerunner SQL Server Reports
forerunner.ssr = forerunner.ssr || {};

$(function () {
    var ssr = forerunner.ssr;
    var events = forerunner.ssr.constants.events;
    var toolTypes = ssr.constants.toolTypes;
    var locData = forerunner.localize.getLocData(forerunner.config.forerunnerFolder() + "/ReportViewer/loc/ReportViewer");

    // This is the helper class that would initialize a viewer.
    // This is currently private.  But this could be turned into a sample.
    ssr.ReportViewerInitializer = function (options) {
        this.options = {
            $toolbar: null,
            $toolPane: null,
            $viewer: null,
            $nav: null,
            $paramarea: null,
            $lefttoolbar: null,
            $righttoolbar: null,
            $docMap: null,
            ReportViewerAPI: forerunner.config.forerunnerAPIBase() + "ReportViewer",
            ReportManagerAPI: forerunner.config.forerunnerAPIBase() + "ReportManager",
            ReportPath: null,
            toolbarHeight: null,
            navigateTo: null,
            isReportManager: false,
            userSettings: null,
            $appContainer: null
        };

        // Merge options with the default settings
        if (options) {
            $.extend(this.options, options);
        }
    };

    ssr.ReportViewerInitializer.prototype = {
        render: function () {
            var me = this;
            var $viewer = me.options.$viewer;

            me.options.$docMap.hide();
            $viewer.reportViewer({
                reportViewerAPI: me.options.ReportViewerAPI,
                reportPath: me.options.ReportPath,
                pageNum: 1,
                docMapArea: me.options.$docMap,
                loadParamsCallback: me.getSavedParameters,
                userSettings: me.options.userSettings,
                $appContainer: me.options.$appContainer
            });

            // Create / render the toolbar
            var $toolbar = me.options.$toolbar;
            $toolbar.toolbar({ $reportViewer: $viewer, $ReportViewerInitializer: this });

            var tb = forerunner.ssr.tools.mergedButtons;
            if (me.options.isReportManager) {
                $toolbar.toolbar("addTools", 12, true, [tb.btnHome, tb.btnRecent, tb.btnFavorite]);
                $toolbar.toolbar("addTools", 4, true, [tb.btnFav]);
                $toolbar.toolbar("disableTools", [tb.btnFav]);
            }

            // Let the report viewer know the height of the toolbar
            $viewer.reportViewer("option", "toolbarHeight", $toolbar.outerHeight());

            var $lefttoolbar = me.options.$lefttoolbar;
            if ($lefttoolbar !== null) {
                $lefttoolbar.toolbar({ $reportViewer: $viewer, $ReportViewerInitializer: this, toolClass: "fr-toolbar-slide" });
            }

            var $righttoolbar = me.options.$righttoolbar;
            if ($righttoolbar !== null) {
                $righttoolbar.toolbar({ $reportViewer: $viewer, $ReportViewerInitializer: this, toolClass: "fr-toolbar-slide" });
            }

            if (me.options.isReportManager) {
                $righttoolbar.toolbar("addTools", 2, true, [tb.btnSavParam]);
            }

            // Create / render the menu pane
            var tp = forerunner.ssr.tools.mergedItems;
            var $toolPane = me.options.$toolPane.toolPane({ $reportViewer: $viewer, $ReportViewerInitializer: this });
            if (me.options.isReportManager) {
                $toolPane.toolPane("addTools", 2, true, [tp.itemHome]);

                $toolPane.toolPane("addTools", 4, true, [tp.itemFav]);
                $toolPane.toolPane("disableTools", [tp.itemFav]);
                $viewer.on(events.reportViewerChangePage(), function (e, data) {
                    $toolPane.toolPane("enableTools", [tp.itemFav]);
                    $toolbar.toolbar("enableTools", [tb.btnFav]);
                });

                $viewer.on(events.reportViewerDrillThrough(), function (e, data) {
                    me.setFavoriteState($viewer.reportViewer("option", "reportPath"));
                });
                $viewer.on(events.reportViewerDrillBack(), function (e, data) {
                    me.setFavoriteState($viewer.reportViewer("option", "reportPath"));
                });
               

            }

            var $nav = me.options.$nav;
            if ($nav !== null) {
                $nav.pageNav({ $reportViewer: $viewer });
                $viewer.reportViewer("option", "pageNavArea", $nav);
            }
            
            var $paramarea = me.options.$paramarea;
            if ($paramarea !== null) {
                $paramarea.reportParameter({ $reportViewer: $viewer });
                $viewer.reportViewer("option", "paramArea", $paramarea);
            }

            var $dlg = me.options.$appContainer.find(".fr-layout-printsection");
            if ($dlg.length === 0) {
                $dlg = $("<div class='fr-dialog fr-layout-printsection'/>");
                $dlg.reportPrint({
                    $appContainer: me.options.$appContainer,
                    $reportViewer: $viewer
                });
                me.options.$appContainer.append($dlg);
            }

            if (me.options.isReportManager) {
                me.setFavoriteState(me.options.ReportPath);
            }

            $viewer.reportViewer("loadReport", me.options.ReportPath, 1);
        },
        setFavoriteState: function (path) {
            var me = this;
            me.$btnFavorite = null;
            if (me.options.$toolbar !== null) {
                me.$btnFavorite = me.options.$toolbar.find(".fr-button-update-fav").find("div");
            }
            me.$itemFavorite = null;
            if (me.options.$toolPane !== null) {
                me.$itemFavorite = me.options.$toolPane.find(".fr-item-update-fav").find("div");
            }
            forerunner.ajax.ajax({
                url: me.options.ReportManagerAPI + "/isFavorite?path=" + path,
                dataType: "json",
                async: true,
                success: function (data) {
                    me.updateFavoriteState(data.IsFavorite);
                },
                fail: function () {
                    if (me.$btnFavorite) {
                        me.$btnFavorite.hide();
                    }
                    if (me.$itemFavorite) {
                        me.$itemFavorite.hide();
                    }
                }
            });
        },
        onClickBtnFavorite: function (e) {
            var me = this;
            var $toolbar = e.data.me;

            var action = "add";
            if (me.$btnFavorite.hasClass("fr-icons24x24-favorite-minus")) {
                action = "delete";
            }

            forerunner.ajax.getJSON(me.options.ReportManagerAPI + "/UpdateView",
                {
                    view: "favorites",
                    action: action,
                    path: $toolbar.options.$reportViewer.reportViewer("option", "reportPath")
                },
                function (data) {
                    me.updateFavoriteState.call(me, action === "add");
                },
                function () {
                    forerunner.dialog.showMessageBox(me.options.$appContainer, locData.messages.favoriteFailed);
                }
            );
        },
        onClickItemFavorite: function (e) {
            var me = this;
            var $toolpane = e.data.me;

            var action = "add";
            if (me.$itemFavorite.hasClass("fr-icons24x24-favorite-minus")) {
                action = "delete";
            }

            $toolpane._trigger(events.actionStarted, null, $toolpane.allTools["fr-item-update-fav"]);
            forerunner.ajax.getJSON(me.options.ReportManagerAPI + "/UpdateView",
                {
                    view: "favorites",
                    action: action,
                    path: me.options.ReportPath
                },
                function (data) {
                    me.updateFavoriteState.call(me, action === "add");
                },
                function () {
                    forerunner.dialog.showMessageBox(me.options.$appContainer, locData.messages.favoriteFailed);
                }
            );
        },
        updateFavoriteState: function (isFavorite) {
            var me = this;
            if (isFavorite) {
                if (me.$btnFavorite) {
                    me.$btnFavorite.addClass("fr-icons24x24-favorite-minus");
                    me.$btnFavorite.removeClass("fr-icons24x24-favorite-plus");
                }
                if (me.$itemFavorite) {
                    me.$itemFavorite.addClass("fr-icons24x24-favorite-minus");
                    me.$itemFavorite.removeClass("fr-icons24x24-favorite-plus");
                }
            }
            else {
                if (me.$btnFavorite) {
                    me.$btnFavorite.removeClass("fr-icons24x24-favorite-minus");
                    me.$btnFavorite.addClass("fr-icons24x24-favorite-plus");
                }
                if (me.$itemFavorite) {
                    me.$itemFavorite.removeClass("fr-icons24x24-favorite-minus");
                    me.$itemFavorite.addClass("fr-icons24x24-favorite-plus");
                }
            }
        },
        getSavedParameters: function (reportPath) {
            var savedParams;
            var url = forerunner.config.forerunnerAPIBase() + "ReportManager" + "/GetUserParameters?reportPath=" + reportPath;
            forerunner.ajax.ajax({
                url: url,
                dataType: "json",
                async: false,
                success: function (data) {
                    if (data.ParamsList !== undefined) {
                        savedParams = data;
                    }
                }
            });
            return savedParams ? JSON.stringify(savedParams) : null;
        }
    };
});  // $(function ()
