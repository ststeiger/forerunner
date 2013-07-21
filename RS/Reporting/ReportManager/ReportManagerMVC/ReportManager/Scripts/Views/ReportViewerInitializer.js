// Assign or create the single globally scoped variable
var forerunner = forerunner || {};

// Forerunner SQL Server Reports
forerunner.ssr = forerunner.ssr || {};

$(function () {
    var ssr = forerunner.ssr;
    var events = forerunner.ssr.constants.events;
    var toolTypes = ssr.constants.toolTypes;
    var locData = forerunner.localize.getLocData(forerunner.init.forerunnerFolder + "/ReportViewer/loc/ReportViewer");

    ssr.ReportViewerInitializer = function (options) {
        this.options = {
            $toolbar: null,
            $toolPane: null,
            $viewer: null,
            $nav: null,
            $paramarea: null,
            $lefttoolbar: null,
            $righttoolbar: null,
            ReportViewerAPI: "./api/ReportViewer",
            ReportManagerAPI: "./api/ReportManager",
            ReportPath: null,
            toolbarHeight: null,
            navigateTo: null
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


            $viewer.reportViewer({
                reportViewerAPI: me.options.ReportViewerAPI,
                reportPath: me.options.ReportPath,
                pageNum: 1,
            });

            // Create / render the toolbar
            var $toolbar = me.options.$toolbar;
            $toolbar.toolbar({ $reportViewer: $viewer });
            var btnHome = {
                toolType: toolTypes.button,
                selectorClass: "fr-button-home",
                imageClass: "fr-image-home",
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
                imageClass: "fr-image-delFav",
                events: {
                    click: function (e) {
                        var action;
                        var $img = $(e.target);
                        if (!$img.hasClass("fr-toolbase-icon"))
                            $img = $img.find(".fr-toolbase-icon");

                        if ($img.hasClass("fr-image-delFav"))
                            action = "delete";
                        else
                            action = "add";

                        $.getJSON( me.options.ReportManagerAPI + "/UpdateView", {
                            view: "favorites",
                            action: action,
                            path: me.options.ReportPath
                        }).done(function (Data) {
                            if (action === "add") {
                                $img.addClass("fr-image-delFav");
                                $img.removeClass("fr-image-addFav");
                            }
                            else {
                                $img.removeClass("fr-image-delFav");
                                $img.addClass("fr-image-addFav");
                            }
                        })
                        .fail(function () { alert("Failed"); });
                    }
                }
            };
            $toolbar.toolbar("addTools", 3, true, [btnFav]);
            $toolbar.toolbar("disableTools", [btnFav]);

            // Let the report viewer know the height of the toolbar
            $viewer.reportViewer("option", "toolbarHeight", me.options.toolbarHeight());

            var $lefttoolbar = me.options.$lefttoolbar;
            if ($lefttoolbar !== null) {
                $lefttoolbar.toolbar({ $reportViewer: $viewer, toolClass: "fr-toolbar-slide" });
            }

            var $righttoolbar = me.options.$righttoolbar;
            if ($righttoolbar !== null) {
                $righttoolbar.toolbar({ $reportViewer: $viewer, toolClass: "fr-toolbar-slide" });
            }

            // Create / render the menu pane
            var $toolPane = me.options.$toolPane.toolPane({ $reportViewer: $viewer });
            var itemHome = {
                toolType: toolTypes.containerItem,
                selectorClass: "fr-id-home",
                imageClass: "fr-image-home",
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
                imageClass: "fr-image-delFav",
                text: locData.toolPane.favorites,
                events: {
                    click: function (e) {
                        var action;
                        var $img = $(e.target);
                        if (!$img.hasClass("fr-toolbase-icon"))
                            $img = $img.find(".fr-toolbase-icon");

                        if ($img.hasClass("fr-image-delFav"))
                            action = "delete";
                        else
                            action = "add";
                        e.data.me._trigger(events.actionStarted, null, e.data.me.allTools["fr-item-update-fav"]);
                        $.getJSON(me.options.ReportViewerAPI + "/UpdateView", {
                            view: "favorites",
                            action: action,
                            path: me.options.ReportPath
                        }).done(function (Data) {

                            if (action === "add") {
                                $img.addClass("fr-image-delFav");
                                $img.removeClass("fr-image-addFav");
                            }
                            else {
                                $img.removeClass("fr-image-delFav");
                                $img.addClass("fr-image-addFav");
                            }
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

            var $nav = me.options.$nav;
            if ($nav !== null) {
                $nav.pageNav({ $reportViewer: $viewer });
                $viewer.reportViewer("option", "pageNav", $nav);
            }
            $viewer.on(events.reportViewerShowNav(), function (e, data) {
                var $spacer = $("#footerspacer");

                if (!data.open) {
                    $spacer.hide();
                    $("#pageSection").show();
                }
                else {
                    $spacer.show();
                    if (forerunner.device.isSmall())
                        $("#pageSection").hide();
                }

            });
            $viewer.on(events.reportViewerChangePage(), function (e, data) {
                $("#pageSection").show();
            });
            
            var $paramarea = me.options.$paramarea;
            if ($paramarea !== null) {
                $paramarea.reportParameter({ $reportViewer: $viewer });
                $viewer.reportViewer("option", "paramArea", $paramarea);
            }
            me.setFavoriteState(me.options.ReportPath);
        },

        setFavoriteState: function (path) {
            var me = this;
            var $toolbar = me.options.$toolbar;
            var $toolPane = me.options.$toolPane;
            $.ajax({
                url: me.options.ReportManagerAPI + "/isFavorite?path=" + path,
                dataType: "json",
                async: true,
                success: function (data) {
                    var $tb;
                    if ($toolbar !== null) {
                        $tb = $toolbar.find(".fr-button-update-fav").find("div");
                        if (data.IsFavorite) {
                            $tb.addClass("fr-image-delFav");
                            $tb.removeClass("fr-image-addFav");
                        }
                        else {
                            $tb.removeClass("fr-image-delFav");
                            $tb.addClass("fr-image-addFav");
                        }
                    }
                    if ($toolPane !== null) {
                        $tb = $toolPane.find(".fr-item-update-fav").find("div");
                        if (data.IsFavorite) {
                            $tb.addClass("fr-image-delFav");
                            $tb.removeClass("fr-image-addFav");
                        }
                        else {
                            $tb.removeClass("fr-image-delFav");
                            $tb.addClass("fr-image-addFav");
                        }
                    }
                },
                fail: function () {
                    $toolbar.find(".fr-button-update-fav").hide();
                }
            });
        },
    };
});  // $(function ()
