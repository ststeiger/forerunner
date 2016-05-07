// Assign or create the single globally scoped variable
var forerunner = forerunner || {};

// Forerunner SQL Server Reports
forerunner.ssr = forerunner.ssr || {};

$(function () {
    var ssr = forerunner.ssr;
    var constants = forerunner.ssr.constants;
    var events = constants.events;
    var toolTypes = ssr.constants.toolTypes;
    var widgets = constants.widgets;
    var locData = forerunner.localize;
   

    // This is the helper class that would initialize a viewer.
    // This is currently private.  But this could be turned into a sample.
    ssr.ReportViewerInitializer = function (options) {
        var me = this;

        me.options = {
            $toolbar: null,
            $toolPane: null,
            $routeLink: null,
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
            $unzoomtoolbar: null,
            toolbarConfigOption: constants.toolbarConfigOption.full,
            dbConfig: {},
            isTopParamLayout: null
        };

        // Merge options with the default settings
        if (options) {
            $.extend(me.options, options);
        }

        me.parameterModel = null;
        me.subscriptionModel = null;
       
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

            if (me.options.dbConfig.UseMobilizerDB === true && (me.options.isReportManager || me.options.useReportManagerSettings)) {
                // Create the parameter model object for this report
                me.parameterModel = $({}).parameterModel({ rsInstance: me.options.rsInstance });
                // Create the subscription model object for this report
                me.subscriptionModel = $({}).subscriptionModel({ rsInstance: me.options.rsInstance });
            }

            $viewer.reportViewer({
                reportViewerAPI: me.options.ReportViewerAPI,
                jsonPath: me.options.jsonPath,
                docMapArea: me.options.$docMap,
                parameterModel: me.parameterModel,
                userSettings: userSettings,
                $appContainer: me.options.$appContainer,
                rsInstance: me.options.rsInstance,
                showSubscriptionUI: (me.options.isReportManager || me.options.useReportManagerSettings) && forerunner.config.getCustomSettingsValue("showSubscriptionUI", "on") === "on",
                zoom: me.options.zoom,
                showSubscriptionOnOpen: me.options.showSubscriptionOnOpen
            });
               

            if ((me.options.isReportManager || me.options.useReportManagerSettings) && !userSettings) {
                userSettings = forerunner.ajax.getUserSetting(me.options.rsInstance);
            }

            me.options.$docMap.hide();
               

            // Create / render the toolbar
            var $toolbar = me.options.$toolbar;
            $toolbar.toolbar({
                dbConfig: me.options.dbConfig,
                $reportViewer: $viewer,
                $ReportViewerInitializer: me,
                $appContainer: me.options.$appContainer,
                isTopParamLayout: me.options.isTopParamLayout
            });

            var tb = forerunner.ssr.tools.mergedButtons;
            var rtb = forerunner.ssr.tools.rightToolbar;

            if (me.options.isReportManager) {
                var listOfButtons = [];
                //add home button if user enable it
                if (forerunner.config.getCustomSettingsValue("showHomeButton", "off") === "on") {
                    listOfButtons.push(tb.btnHome);
                }

                if (me.options.dbConfig.UseMobilizerDB === true) {
                    if (me.options.dbConfig.SeperateDB !== true) {
                        listOfButtons.push(tb.btnRecent);
                    }

                    listOfButtons.push(tb.btnFavorite);
                }

                listOfButtons.push(tb.btnLogOff);

                $toolbar.toolbar("addTools", 12, true, listOfButtons);

                forerunner.ajax.isFormsAuth(function (isForms) {
                    if (!isForms)
                        $toolbar.toolbar("hideTool", tb.btnLogOff.selectorClass);
                });

                if (me.options.dbConfig.UseMobilizerDB === true) {
                    $toolbar.toolbar("addTools", 4, true, [tb.btnFav]);
                    $toolbar.toolbar("disableTools", [tb.btnFav]);
                }
            }

            if (me.options.toolbarConfigOption === constants.toolbarConfigOption.hide) {
                $toolbar.hide();
            } else {
                if (me.options.toolbarConfigOption && me.options.toolbarConfigOption !== constants.toolbarConfigOption.full) {
                    $toolbar.toolbar("configure", me.options.toolbarConfigOption);
                }
                // Let the report viewer know the height of the toolbar (toolbar height + route link section height)
                var toolbarHeight = $toolbar.outerHeight() + (me.options.$routeLink.is(":visible") ? me.options.$routeLink.outerHeight() : 0);

                $viewer.reportViewer("option", "toolbarHeight", toolbarHeight);
                $toolbar.show();
            }

            var $unzoomtoolbar = me.options.$unzoomtoolbar;
            if ($unzoomtoolbar !== null) {
                $unzoomtoolbar.unzoomToolbar({ $reportViewer: $viewer, $ReportViewerInitializer: me, $appContainer: me.options.$appContainer });
            }

            var $lefttoolbar = me.options.$lefttoolbar;
            if ($lefttoolbar !== null) {
                $lefttoolbar.leftToolbar({ $reportViewer: $viewer, $ReportViewerInitializer: me, $appContainer: me.options.$appContainer });
            }

            var manageSetList;
            if (me.options.isTopParamLayout) {
                $toolbar.addClass('fr-toolbar-top-param');
                manageSetList = [rtb.btnSavParam, rtb.btnSelectSet, rtb.btnRTBManageSets];
                //set the manage set elements to hide by default, after the parameters rendered, show them after that if visibla parameter exist.
                $.each(manageSetList, function (i, v) {
                    v.visible = false;
                });

                $toolbar.toolbar("addTools", 2, true, manageSetList);
                me._initManageSetCallback();
            } else {
                var $righttoolbar = me.options.$righttoolbar;
                if ($righttoolbar !== null) {
                    $righttoolbar.rightToolbar({ $reportViewer: $viewer, $ReportViewerInitializer: me, $appContainer: me.options.$appContainer });
                }

                if (me.options.dbConfig.UseMobilizerDB === true && (me.options.isReportManager || me.options.useReportManagerSettings)) {
                    $righttoolbar.rightToolbar("addTools", 2, true, [rtb.btnRTBManageSets, rtb.btnSelectSet, rtb.btnSavParam]);
                }
            }

            // Create / render the menu pane
            var mi = forerunner.ssr.tools.mergedItems;
            var $toolPane = me.options.$toolPane.toolPane({
                dbConfig: me.options.dbConfig,
                $reportViewer: $viewer,
                $ReportViewerInitializer: me,
                $appContainer: me.options.$appContainer
            });

            //favoriteModel dependence on toolbar and toolpane, so run initialization after those done
            me.favoriteInstance = null;
            me.favoriteInstance = $({}).favoriteModel({
                $toolbar: me.options.$toolbar,
                $toolpane: me.options.$toolPane,
                $appContainer: me.options.$appContainer,
                rsInstance: me.options.rsInstance
            });

            if (me.options.isReportManager) {
                if (me.options.dbConfig.UseMobilizerDB === true) {
                    $toolPane.toolPane("addTools", 2, true, [mi.itemFolders]);
                    $toolPane.toolPane("addTools", 5, true, [mi.itemFav]);
                    $toolPane.toolPane("disableTools", [mi.itemFav]);

                    $viewer.on(events.reportViewerChangePage(), function (e, data) {
                        $toolPane.toolPane("enableTools", [mi.itemFav]);
                        $toolbar.toolbar("enableTools", [tb.btnFav]);
                    });

                    $viewer.on(events.reportViewerDrillThrough(), function (e, data) {
                        me.favoriteInstance.favoriteModel("setFavoriteState", $viewer.reportViewer("getReportPath"));
                    });

                    $viewer.on(events.reportViewerChangeReport(), function (e, data) {
                        me.favoriteInstance.favoriteModel("setFavoriteState", $viewer.reportViewer("getReportPath"));
                    });

                    $viewer.on(events.reportViewerPreLoadReport(), function (e, data) {
                        if (data.newPath) {
                            me.favoriteInstance.favoriteModel("setFavoriteState", data.newPath);
                        }
                    });
                }
            }

            var $nav = me.options.$nav;
            if ($nav !== null) {
                $nav.pageNav({ $reportViewer: $viewer, $appContainer: me.options.$appContainer, rsInstance: me.options.rsInstance });
                $viewer.reportViewer("option", "pageNavArea", $nav);
            }

            var $paramarea = me.options.$paramarea;
            if ($paramarea !== null) {
                $paramarea.reportParameter({ $reportViewer: $viewer, isTopParamLayout: me.options.isTopParamLayout });
                $viewer.reportViewer("option", "paramArea", $paramarea);
            }

            var $dlg;
            $dlg = me._findSection("fr-print-section");
            $dlg.reportPrint({ $appContainer: me.options.$appContainer, $reportViewer: $viewer });

            if (me.options.dbConfig.UseMobilizerDB === true) {
                $dlg = me._findSection("fr-managesubscription-section");
                $dlg.manageSubscription({ $appContainer: me.options.$appContainer, $reportViewer: $viewer, subscriptionModel: me.subscriptionModel });

                $dlg = me._findSection("fr-emailsubscription-section");
                $dlg.emailSubscription({ $appContainer: me.options.$appContainer, $reportViewer: $viewer, subscriptionModel: me.subscriptionModel, userSettings: userSettings });

                if (me.parameterModel) {
                    $dlg = me._findSection("fr-mps-section");
                    $dlg.manageParamSets({
                        $appContainer: me.options.$appContainer,
                        $reportViewer: $viewer,
                        $reportViewerInitializer: me,
                        model: me.parameterModel
                    });
                    me._manageParamSetsDialog = $dlg;
                }
            }

            $dlg = me._findSection("fr-dsc-section");
            
            $dlg.dsCredential({ $appContainer: me.options.$appContainer, $reportViewer: $viewer });
            
        },
        _findSection: function (sectionClass) {
            var me = this;

            var $dlg = me.options.$appContainer.find("." + sectionClass);
            if ($dlg.length === 0) {
                $dlg = new $("<div class='fr-dialog-id fr-core-dialog-layout fr-core-widget'/>");
                $dlg.addClass(sectionClass);
                me.options.$appContainer.append($dlg);
            }

            return $dlg;
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
        _initManageSetCallback: function () {
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
        _onModelChange: function () {
            var me = this;
            var rtb = forerunner.ssr.tools.rightToolbar;

            if (me.parameterModel && me.parameterModel.parameterModel("canUserSaveCurrentSet")) {
                me.options.$toolbar.toolbar("enableTools", [rtb.btnSavParam]);
            } else {
                me.options.$toolbar.toolbar("disableTools", [rtb.btnSavParam]);
            }
        }
    };  // ssr.ReportViewerInitializer.prototype

    // Unzoom Toolbar
    $.widget(widgets.getFullname(widgets.unzoomToolbar), $.forerunner.toolBase, {
        options: {
            $reportViewer: null,
            $ReportViewerInitializer: null,
            toolClass: "fr-toolbar-zoom",
            $appContainer: null
        },
        _init: function () {
            var me = this;
            me._super();
            var utb = forerunner.ssr.tools.unZoomToolbar;

            me.element.html("");
            var $toolbar = new $("<div class='" + me.options.toolClass + " fr-core-widget' />");
            $(me.element).append($toolbar);

            me.addTools(1, true, [utb.btnUnZoom]);
        },
    }); //$.widget

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

            if (me.parameterModel && me.parameterModel.parameterModel("canUserSaveCurrentSet")) {
                me.enableTools([rtb.btnSavParam]);
            } else {
                me.disableTools([rtb.btnSavParam]);
            }
        }
    }); //$.widget

});  // $(function ()
