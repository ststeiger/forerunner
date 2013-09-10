// Assign or create the single globally scoped variable
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
            $print:null,
            ReportViewerAPI: forerunner.config.forerunnerAPIBase() + "ReportViewer",
            ReportManagerAPI: forerunner.config.forerunnerAPIBase() + "ReportManager",
            ReportPath: null,
            toolbarHeight: null,
            navigateTo: null,
            isReportManager: false
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
            });

            // Create / render the toolbar
            var $toolbar = me.options.$toolbar;
            $toolbar.toolbar({ $reportViewer: $viewer, $ReportViewerInitializer: this });

            if (me.options.isReportManager) {
                var btnHome = {
                    toolType: toolTypes.button,
                    selectorClass: "fr-button-home",
                    sharedClass: "fr-toolbase-no-disable-id fr-toolbar-hidden-on-small",
                    imageClass: "fr-icons24x24-home",
                    tooltip: locData.toolbar.home,
                    events: {
                        click: function (e) {
                            me.options.navigateTo("home", null);
                        }
                    }
                };
                $toolbar.toolbar("addTools", 12, true, [btnHome]);

                var btnFav = {
                    toolType: toolTypes.button,
                    selectorClass: "fr-button-update-fav",
                    sharedClass: "fr-toolbar-hidden-on-small",
                    imageClass: "fr-icons24x24-favorite-minus",
                    tooltip: locData.toolbar.favorites,
                    events: {
                        click: function (e) {
                            var action = "add";
                            if (me.$btnFavorite.hasClass("fr-icons24x24-favorite-minus"))
                                action = "delete";
                            $.getJSON(me.options.ReportManagerAPI + "/UpdateView", {
                                view: "favorites",
                                action: action,
                                path: $viewer.reportViewer("option", "reportPath")
                            }).done(function (data) {
                                me.updateFavoriteState.call(me, action === "add");
                            })
                            .fail(function () { alert("Failed"); });
                        }
                    }
                };
                $toolbar.toolbar("addTools", 3, true, [btnFav]);
                $toolbar.toolbar("disableTools", [btnFav]);
            }

            // Let the report viewer know the height of the toolbar
            $viewer.reportViewer("option", "toolbarHeight", $toolbar.outerHeight());

            var $lefttoolbar = me.options.$lefttoolbar;
            if ($lefttoolbar !== null) {
                $lefttoolbar.toolbar({ $reportViewer: $viewer, toolClass: "fr-toolbar-slide" });
            }

            var $righttoolbar = me.options.$righttoolbar;
            if ($righttoolbar !== null) {
                $righttoolbar.toolbar({ $reportViewer: $viewer, toolClass: "fr-toolbar-slide" });
            }

            if (me.options.isReportManager) {
                var btnSavParam = {
                    toolType: toolTypes.button,
                    selectorClass: "fr-button-save-param",
                    imageClass: "fr-icons24x24-save-param",
                    parameterWidget: me.options.$paramarea,
                    events: {
                        click: function (e) {
                            var parameterList = e.data.me.getTool("fr-button-save-param").parameterWidget.reportParameter("getParamsList");
                            if (parameterList) {
                                $.getJSON(me.options.ReportManagerAPI + "/SaveUserParameters", {
                                    reportPath: $viewer.reportViewer("option", "reportPath"),
                                    parameters: parameterList,
                                }).done(function (Data) {
                                    alert("Saved");
                                })
                                .fail(function () { alert("Failed"); });
                            }
                        }
                    }
                };
                $righttoolbar.toolbar("addTools", 2, true, [btnSavParam]);
                $viewer.on(events.reportViewerShowParamArea(), function (e, data) {
                    $.ajax({
                        url: me.options.ReportManagerAPI + "/GetUserParameters?reportPath=" + me.options.ReportPath,
                        dataType: "json",
                        async: false,
                        success: function (data) {
                            if (data.ParamsList)
                                $paramarea.reportParameter("overrideDefaultParams", data);
                        }
                    });

                });

            }


            // Create / render the menu pane
            var $toolPane = me.options.$toolPane.toolPane({ $reportViewer: $viewer });
            if (me.options.isReportManager) {
                var itemHome = {
                    toolType: toolTypes.containerItem,
                    selectorClass: "fr-id-home",
                    sharedClass: "fr-toolbase-no-disable-id",
                    imageClass: "fr-icons24x24-home",
                    text: locData.toolPane.home,
                    events: {
                        click: function (e) {
                            me.options.navigateTo("home", null);
                        }
                    }
                };
                $toolPane.toolPane("addTools", 2, true, [itemHome]);

                var itemFav = {
                    toolType: toolTypes.containerItem,
                    selectorClass: "fr-item-update-fav",
                    imageClass: "fr-icons24x24-favorite-minus",
                    text: locData.toolPane.favorites,
                    events: {
                        click: function (e) {
                            var action = "add";
                            if (me.$itemFavorite.hasClass("fr-icons24x24-favorite-minus"))
                                action = "delete";
                            e.data.me._trigger(events.actionStarted, null, e.data.me.allTools["fr-item-update-fav"]);
                            $.getJSON(me.options.ReportManagerAPI + "/UpdateView", {
                                view: "favorites",
                                action: action,
                                path: me.options.ReportPath
                            }).done(function (data) {
                                me.updateFavoriteState.call(me, action === "add");
                            })
                            .fail(function () { alert("Failed"); });
                        }
                    }
                };
                $toolPane.toolPane("addTools", 4, true, [itemFav]);
                $toolPane.toolPane("disableTools", [itemFav]);
                $viewer.on(events.reportViewerChangePage(), function (e, data) {
                    $toolPane.toolPane("enableTools", [itemFav]);
                    $toolbar.toolbar("enableTools", [btnFav]);
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

            var $print = me.options.$print;
            if ($print !== null) {
                $print.reportPrint({ $reportViewer: $viewer });
                $viewer.reportViewer("option", "printArea", $print);
            }

            if (me.options.isReportManager) {
                me.setFavoriteState(me.options.ReportPath);
            }
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
            $.ajax({
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
    };
});  // $(function ()
