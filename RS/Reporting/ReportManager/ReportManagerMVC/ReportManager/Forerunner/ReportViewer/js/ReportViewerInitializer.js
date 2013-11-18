// Assign or create the single globally scoped variable
var forerunner = forerunner || {};

// Forerunner SQL Server Reports
forerunner.ssr = forerunner.ssr || {};

$(function () {
    var ssr = forerunner.ssr;
    var events = forerunner.ssr.constants.events;
    var toolTypes = ssr.constants.toolTypes;
    var widgets = forerunner.ssr.constants.widgets;
    var locData = forerunner.localize.getLocData(forerunner.config.forerunnerFolder() + "/ReportViewer/loc/ReportViewer");

    // This is the helper class that would initialize a viewer.
    // This is currently private.  But this could be turned into a sample.
    ssr.ReportViewerInitializer = function (options) {
        var me = this;

        me.options = {
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
            $.extend(me.options, options);
        }

        // Create the parameter model object for this report
        me.parameterModel = $({}).parameterModel();
    };

    ssr.ReportViewerInitializer.prototype = {
        getParameterModel: function () {
            var me = this;
            return me.parameterModel;
        },
        render: function () {
            var me = this;
            var $viewer = me.options.$viewer;

            me.options.$docMap.hide();
            $viewer.reportViewer({
                reportViewerAPI: me.options.ReportViewerAPI,
                reportPath: me.options.ReportPath,
                pageNum: 1,
                docMapArea: me.options.$docMap,
                parameterModel: me.parameterModel,
                userSettings: me.options.userSettings,
                $appContainer: me.options.$appContainer
            });

            // Create / render the toolbar
            var $toolbar = me.options.$toolbar;
            $toolbar.toolbar({ $reportViewer: $viewer, $ReportViewerInitializer: this, $appContainer: me.options.$appContainer });

            var tb = forerunner.ssr.tools.mergedButtons;
            var rtb = forerunner.ssr.tools.rightToolbar;

            if (me.options.isReportManager) {
                $toolbar.toolbar("addTools", 12, true, [tb.btnHome, tb.btnRecent, tb.btnFavorite]);
                $toolbar.toolbar("addTools", 4, true, [tb.btnFav]);
                $toolbar.toolbar("disableTools", [tb.btnFav]);
            }

            // Let the report viewer know the height of the toolbar
            $viewer.reportViewer("option", "toolbarHeight", $toolbar.outerHeight());

            var $lefttoolbar = me.options.$lefttoolbar;
            if ($lefttoolbar !== null) {
                $lefttoolbar.leftToolbar({ $reportViewer: $viewer, $ReportViewerInitializer: this, $appContainer: me.options.$appContainer });
            }

            var $righttoolbar = me.options.$righttoolbar;
            if ($righttoolbar !== null) {
                $righttoolbar.rightToolbar({ $reportViewer: $viewer, $ReportViewerInitializer: this, $appContainer: me.options.$appContainer });
            }

            if (me.options.isReportManager) {
                $righttoolbar.rightToolbar("addTools", 2, true, [/*rtb.btnRTBManageSets, rtb.btnSelectSet, */rtb.btnSavParam]);
            }

            // Create / render the menu pane
            var tp = forerunner.ssr.tools.mergedItems;
            var $toolPane = me.options.$toolPane.toolPane({ $reportViewer: $viewer, $ReportViewerInitializer: this, $appContainer: me.options.$appContainer });
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

            var $dlg;
            $dlg = me.options.$appContainer.find(".fr-print-section");
            if ($dlg.length === 0) {
                $dlg = $("<div class='fr-print-section fr-dialog-id fr-core-dialog-layout fr-core-widget'/>");
                $dlg.reportPrint({
                    $appContainer: me.options.$appContainer,
                    $reportViewer: $viewer
                });
                me.options.$appContainer.append($dlg);
            }

            $dlg = me.options.$appContainer.find(".fr-mps-section");
            if ($dlg.length === 0) {
                $dlg = $("<div class='fr-mps-section fr-dialog-id fr-core-dialog-layout fr-core-widget'/>");
                $dlg.manageParamSets({
                    $appContainer: me.options.$appContainer,
                    $reportViewer: $viewer,
                    $reportViewerInitializer: me,
                    model: me.parameterModel
                });
                me.options.$appContainer.append($dlg);
            }
            me._manageParamSetsDialog = $dlg;

            if (me.options.isReportManager) {
                me.setFavoriteState(me.options.ReportPath);
            }

            $viewer.reportViewer("loadReport", me.options.ReportPath, 1);
        },
        showManageParamSetsDialog : function() {
            var me = this;
            me._manageParamSetsDialog.manageParamSets("openDialog");
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
        }
    };  // ssr.ReportViewerInitializer.prototype

    // Left Toolbar
    $.widget(widgets.getFullname(widgets.leftToolbar), $.forerunner.toolBase, {
        options: {
            $reportViewer: null,
            $ReportViewerInitializer: null,
            toolClass: "fr-toolbar-slide",
            $appContainer: null
        },
        _init: function () {
            var me = this;
            var ltb = forerunner.ssr.tools.leftToolbar;

            me.element.html("");
            $toolbar = new $("<div class='" + me.options.toolClass + " fr-core-widget' />");
            $(me.element).append($toolbar);

            me.addTools(1, true, [ltb.btnLTBMenu]);
        },
    }); //$.widget

    // Right Toolbar
    $.widget(widgets.getFullname(widgets.rightToolbar), $.forerunner.toolBase, {
        options: {
            $reportViewer: null,
            $ReportViewerInitializer: null,
            toolClass: "fr-toolbar-slide",
            $appContainer: null
        },
        _init: function () {
            var me = this;
            var rtb = forerunner.ssr.tools.rightToolbar;

            me.element.html("");
            $toolbar = new $("<div class='" + me.options.toolClass + " fr-core-widget' />");
            $(me.element).append($toolbar);

            me.addTools(1, true, [rtb.btnRTBParamarea]);
        },
    }); //$.widget

});  // $(function ()
