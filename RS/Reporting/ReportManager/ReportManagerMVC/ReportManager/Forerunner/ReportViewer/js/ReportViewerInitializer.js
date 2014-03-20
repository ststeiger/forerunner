// Assign or create the single globally scoped variable
var forerunner = forerunner || {};

// Forerunner SQL Server Reports
forerunner.ssr = forerunner.ssr || {};

$(function () {
    var ssr = forerunner.ssr;
    var events = forerunner.ssr.constants.events;
    var toolTypes = ssr.constants.toolTypes;
    var widgets = forerunner.ssr.constants.widgets;
    var locData = forerunner.localize.getLocData(forerunner.config.forerunnerFolder() + "ReportViewer/loc/ReportViewer");

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
            toolbarHeight: null,
            navigateTo: null,
            isReportManager: false,
            userSettings: null,
            $appContainer: null,
            rsInstance: null,
            useReportManagerSettings: false,
        };

        // Merge options with the default settings
        if (options) {
            $.extend(me.options, options);
        }

        me.parameterModel = null;
        if (me.options.isReportManager || me.options.useReportManagerSettings) {
            // Create the parameter model object for this report
            me.parameterModel = $({}).parameterModel({ rsInstance: me.options.rsInstance });
        }
    };

    ssr.ReportViewerInitializer.prototype = {
        getParameterModel: function () {
            var me = this;
            return me.parameterModel;
        },
        render: function () {
            var me = this;
            var $viewer = me.options.$viewer;

            var userSettings = me.options.userSettings;
            if ((me.options.isReportManager || me.options.useReportManagerSettings) && !userSettings) {
                userSettings = me.getUserSettings(me.options);
            }

            me.options.$docMap.hide();
            $viewer.reportViewer({
                reportViewerAPI: me.options.ReportViewerAPI,
                jsonPath: me.options.jsonPath,
                docMapArea: me.options.$docMap,
                parameterModel: me.parameterModel,
                userSettings: userSettings,
                $appContainer: me.options.$appContainer,
                rsInstance: me.options.rsInstance,
            });

            // Create / render the toolbar
            var $toolbar = me.options.$toolbar;
            $toolbar.toolbar({ $reportViewer: $viewer, $ReportViewerInitializer: this, $appContainer: me.options.$appContainer });

            var tb = forerunner.ssr.tools.mergedButtons;
            var rtb = forerunner.ssr.tools.rightToolbar;

            if (me.options.isReportManager) {
                var listOfButtons = [tb.btnHome, tb.btnRecent, tb.btnFavorite];
                if (forerunner.ajax.isFormsAuth()) {
                    listOfButtons.push(tb.btnLogOff);
                }
                $toolbar.toolbar("addTools", 12, true, listOfButtons);
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

            if (me.options.isReportManager || me.options.useReportManagerSettings) {
                $righttoolbar.rightToolbar("addTools", 2, true, [rtb.btnRTBManageSets, rtb.btnSelectSet, rtb.btnSavParam]);
            }

            // Create / render the menu pane
            var mi = forerunner.ssr.tools.mergedItems;
            var tg = forerunner.ssr.tools.groups;
            var $toolPane = me.options.$toolPane.toolPane({ $reportViewer: $viewer, $ReportViewerInitializer: this, $appContainer: me.options.$appContainer });
            if (me.options.isReportManager) {
                $toolPane.toolPane("addTools", 2, true, [mi.itemFolders, tg.itemFolderGroup]);
                $toolPane.toolPane("addTools", 13, true, [mi.itemLogOff]);

                $toolPane.toolPane("addTools", 5, true, [mi.itemFav]);
                $toolPane.toolPane("disableTools", [mi.itemFav]);
                $viewer.on(events.reportViewerChangePage(), function (e, data) {
                    $toolPane.toolPane("enableTools", [mi.itemFav]);
                    $toolbar.toolbar("enableTools", [tb.btnFav]);
                });

                $viewer.on(events.reportViewerDrillThrough(), function (e, data) {
                    me.setFavoriteState($viewer.reportViewer("getReportPath"));
                });

                $viewer.on(events.reportViewerChangeReport(), function (e, data) {
                    me.setFavoriteState($viewer.reportViewer("getReportPath"));
                });

                $viewer.on(events.reportViewerPreLoadReport(), function (e, data) {
                    if (data.newPath) {
                        me.setFavoriteState(data.newPath);
                    }
                });
            }

            var $nav = me.options.$nav;
            if ($nav !== null) {
                $nav.pageNav({ $reportViewer: $viewer, rsInstance: me.options.rsInstance });
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
                me.options.$appContainer.append($dlg);
            }
            $dlg.reportPrint({ $appContainer: me.options.$appContainer, $reportViewer: $viewer });

            $dlg = me.options.$appContainer.find(".fr-dsc-section");
            if ($dlg.length === 0) {
                $dlg = $("<div class='fr-dsc-section fr-dialog-id fr-core-dialog-layout fr-core-widget'/>");
                me.options.$appContainer.append($dlg);
            }
            $dlg.dsCredential({ $appContainer: me.options.$appContainer, $reportViewer: $viewer });

            if (me.parameterModel) {
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
            }
        },
        showManageParamSetsDialog: function (parameterList) {
            var me = this;
            var $viewer = me.options.$viewer;

            // Re-initialize the options for the current report viewer, model, etc.
            me._manageParamSetsDialog.manageParamSets({
                $appContainer: me.options.$appContainer,
                $reportViewer: $viewer,
                $reportViewerInitializer: me,
                model: me.parameterModel
            });
            me._manageParamSetsDialog.manageParamSets("openDialog", parameterList);
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
            var url = me.options.ReportManagerAPI + "/isFavorite?path=" + path;
            if (me.options.rsInstance) url += "&instance=" + me.options.rsInstance;
            forerunner.ajax.ajax({
                url: url,
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
        getUserSettings : function(options) {
            var settings = null;
            var url = forerunner.config.forerunnerAPIBase() + "ReportManager" + "/GetUserSettings";
            if (options.rsInstance) url += "?instance=" + options.rsInstance;
            forerunner.ajax.ajax({
                url: url,
                dataType: "json",
                async: false,
                success: function (data) {
                    if (data && data.responsiveUI !== undefined) {
                        settings = data;
                    }
                }
            });
            return settings;
        },
        onClickBtnFavorite: function (e) {
            var me = this;
            var $toolbar = e.data.me;

            var action = "add";
            if (me.$btnFavorite.hasClass("fr-icons24x24-favorite-minus")) {
                action = "delete";
            }

            var url = me.options.ReportManagerAPI + "/UpdateView";
            forerunner.ajax.getJSON(url,
                {
                    view: "favorites",
                    action: action,
                    path: $toolbar.options.$reportViewer.reportViewer("getReportPath"),
                    instance: me.options.rsInstance,
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
            var url = me.options.ReportManagerAPI + "/UpdateView";
            forerunner.ajax.getJSON(url,
                {
                    view: "favorites",
                    action: action,
                    path: $toolpane.options.$reportViewer.reportViewer("getReportPath"),
                    instance: me.options.rsInstance,
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
            me._super();
            var ltb = forerunner.ssr.tools.leftToolbar;

            me.element.html("");
            var $toolbar = new $("<div class='" + me.options.toolClass + " fr-core-widget' />");
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
        _initCallbacks: function () {
            var me = this;

            if (me.parameterModel) {
                me.parameterModel.on(events.parameterModelChanged(), function (e, data) {
                    me._onModelChange.call(me, e, data);
                });
                me.parameterModel.on(events.parameterModelSetChanged(), function (e, data) {
                    me._onModelChange.call(me, e, data);
                });
            }
        },
        _init: function () {
            var me = this;
            me._super();
            var rtb = forerunner.ssr.tools.rightToolbar;
            me.parameterModel = me.options.$ReportViewerInitializer.getParameterModel();

            me.element.html("");
            var $toolbar = new $("<div class='" + me.options.toolClass + " fr-core-widget' />");
            $(me.element).append($toolbar);

            me.addTools(1, true, [rtb.btnRTBParamarea]);

            me._initCallbacks();
        },
        _onModelChange: function () {
            var me = this;
            var rtb = forerunner.ssr.tools.rightToolbar;

            if (me.parameterModel.parameterModel("canUserSaveCurrentSet")) {
                me.enableTools([rtb.btnSavParam]);
            } else {
                me.disableTools([rtb.btnSavParam]);
            }
        }
    }); //$.widget

});  // $(function ()
