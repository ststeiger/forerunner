// Assign or create the single globally scoped variable
var forerunner = forerunner || {};

// Forerrunner SQL Server Reports
forerunner.ssr = forerunner.ssr || {};

$(function () {
    var fr = forerunner;

    fr.ssr.ReportViewerInitializer = function (options) {
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

    fr.ssr.ReportViewerInitializer.prototype = {
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
            var btnHome = {
                toolType: fr.ssr.constants.toolTypes.button,
                selectorClass: 'fr-button-home',
                imageClass: 'fr-image-home',
                events: {
                    click: function (e) {
                        me.options.navigateTo('home', null);
                    }
                }
            };
            $toolbar.toolbar('addTools', 2, true, [btnHome]);

            var btnFav = {
                toolType: fr.ssr.constants.toolTypes.button,
                selectorClass: 'fr-button-update-fav',
                imageClass: 'fr-image-delFav',
                events: {
                    click: function (e) {
                        var action;
                        var $img = $(e.target);
                        if (!$img.hasClass('fr-tool-icon'))
                            $img = $img.find('.fr-tool-icon');

                        if ($img.hasClass('fr-image-delFav'))
                            action = "delete";
                        else
                            action = "add";

                        $.getJSON("./api/ReportManager/UpdateView", {
                            view: "favorites",
                            action: action,
                            path: me.options.ReportPath
                        }).done(function (Data) {
                            if (action == "add") {
                                $img.addClass('fr-image-delFav');
                                $img.removeClass('fr-image-addFav');
                            }
                            else {
                                $img.removeClass('fr-image-delFav');
                                $img.addClass('fr-image-addFav');
                            }
                        })
                        .fail(function () { alert("Failed") });
                    }
                }
            };
            $toolbar.toolbar('addTools', 14, true, [btnFav]);
            $toolbar.toolbar('disableTools', [btnFav]);

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
            var itemHome = {
                toolType: fr.ssr.constants.toolTypes.containerItem,
                selectorClass: 'fr-id-home',
                imageClass: 'fr-image-home',
                text: 'Home',
                events: {
                    click: function (e) {
                        me.options.navigateTo('home', null);
                    }
                }
            };
            $toolPane.toolpane('addTools', 8, true, [itemHome]);

            var itemFav = {
                toolType: fr.ssr.constants.toolTypes.containerItem,
                selectorClass: 'fr-item-update-fav',
                imageClass: 'fr-image-delFav',
                text: 'Favorites',
                events: {
                    click: function (e) {
                        var action;
                        var $img = $(e.target);
                        if (!$img.hasClass('fr-tool-icon'))
                            $img = $img.find('.fr-tool-icon');

                        if ($img.hasClass('fr-image-delFav'))
                            action = "delete";
                        else
                            action = "add";
                        e.data.me._trigger('actionstarted', null, e.data.me.tools['fr-item-update-fav']);
                        $.getJSON("./api/ReportManager/UpdateView", {
                            view: "favorites",
                            action: action,
                            path: me.options.ReportPath
                        }).done(function (Data) {

                            if (action == "add") {
                                $img.addClass('fr-image-delFav');
                                $img.removeClass('fr-image-addFav');
                            }
                            else {
                                $img.removeClass('fr-image-delFav');
                                $img.addClass('fr-image-addFav');
                            }
                        })
                        .fail(function () { alert("Failed") });
                    }
                }
            };
            $toolPane.toolpane('addTools', 10, true, [itemFav]);
            $toolPane.toolpane('disableTools', [itemFav]);
            $viewer.on('reportviewerchangepage', function (e, data) {
                $toolPane.toolpane('enableTools', [itemFav]);
                $toolbar.toolbar('enableTools', [btnFav]);
            });

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
            me.setFavoriteState(me.options.ReportPath);
        },

        setFavoriteState: function (path) {
            var me = this;
            $toolbar = me.options.$toolbar;
            $toolPane = me.options.$toolPane;
            $.ajax({
                url: './api/ReportManager/isFavorite?path=' + path,
                dataType: 'json',
                async: true,
                success: function (data) {
                    var $tb;
                    if ($toolbar != null) {
                        $tb = $toolbar.find('.fr-button-update-fav').find("div");
                        if (data.IsFavorite) {
                            $tb.addClass('fr-image-delFav');
                            $tb.removeClass('fr-image-addFav');
                        }
                        else {
                            $tb.removeClass('fr-image-delFav');
                            $tb.addClass('fr-image-addFav');
                        }
                    }
                    if ($toolPane != null) {
                        $tb = $toolPane.find('.fr-item-update-fav').find("div");
                        if (data.IsFavorite) {
                            $tb.addClass('fr-image-delFav');
                            $tb.removeClass('fr-image-addFav');
                        }
                        else {
                            $tb.removeClass('fr-image-delFav');
                            $tb.addClass('fr-image-addFav');
                        }
                    }
                },
                fail: function () {
                    $toolbar.find('.fr-button-update-fav').hide();
                }
            });
        },
    }
});  // $(function ()
