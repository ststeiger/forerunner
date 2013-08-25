/**
 * @file Contains the reportExplorer widget.
 *
 */

var forerunner = forerunner || {};
forerunner.ssr = forerunner.ssr || {};

$(function () {
    var widgets = forerunner.ssr.constants.widgets;

    /**
     * Widget used to explore available reports and launch the Report Viewer
     *
     * @namespace $.forerunner.reportExplorer
     * @prop {object} options - The options for toolbar
     * @prop {String} options.reportManagerAPI - Path to the report manager REST API calls
     * @prop {String} options.forerunnerPath - Path to the top level folder for the SDK
     * @prop {String} options.path - Path passed to the GetItems REST call
     * @prop {String} options.view - View passed to the GetItems REST call
     * @prop {String} options.selectedItemPath - Set to select an item in the explorer
     * @prop {Object} options.$scrollBarOwner - Used to determine the scrollTop position
     * @prop {Object} options.navigateTo - Callback function used to navigate to a slected report
     * @example
     * $("#reportExplorerId").reportExplorer({
     *  reportManagerAPI: "./api/ReportManager",
     *  forerunnerPath: "./forerunner",
     *  path: "/",
     *  view: "catalog",
     *  navigateTo: navigateTo
     * });
     */
    $.widget(widgets.getFullname(widgets.reportExplorer), /** @lends $.forerunner.reportExplorer */ {
        options: {
            reportManagerAPI: forerunner.config.forerunnerAPIBase() + "ReportManager",
            forerunnerPath: forerunner.config.forerunnerFolder(),
            path: null,
            view: null,
            selectedItemPath: null,
            $scrollBarOwner: null,
            navigateTo: null
        },
        _generatePCListItem: function (catalogItem, isSelected) {
            var me = this; 
            var reportThumbnailPath = me.options.reportManagerAPI
              + "/GetThumbnail/?ReportPath=" + catalogItem.Path + "&DefDate=" + catalogItem.ModifiedDate;
            var $item = new $("<div />");
            if (isSelected) {
                $item.addClass("fr-explorer-item-selected");
                me.$selectedItem = $item;
            }
            $item.addClass("fr-explorer-item");            
            var $caption = new $("<div />");
            $caption.addClass("fr-explorer-item-center");
            $item.append($caption);
            var $captiontext = new $("<h3 />");
            $captiontext.addClass("fr-explorer-item-centertext");
            $captiontext.html(catalogItem.Name);
            $caption.append($captiontext);
            var $imageblock = new $("<div />");
            $imageblock.addClass("fr-report-item-image-block");
            $item.append($imageblock);
            var imageSrc;
            var $anchor = new $("<a />");
            var $img = new $("<img />");
            $img.addClass("fr-explorer-item-width");
            $img.addClass("fr-explorer-item-center");            
            if (catalogItem.Type === 1)
                imageSrc = me.options.forerunnerPath + "/ReportExplorer/images/folder-icon.png";
            else {
                imageSrc = reportThumbnailPath;
                $imageblock.addClass("fr-report-item-image-block-shadow");
            }

            var action = catalogItem.Type === 1 ? "explore" : "browse";
            $img.attr("src", imageSrc);
            $img.error(function () {
                $(this).attr("src", me.options.forerunnerPath + "/ReportExplorer/images/Report-icon.png");
            });
            $img.removeAttr("height"); //JQuery adds height for IE8, remove.
            $anchor.on("click", function (event) {
                if (me.options.navigateTo) {
                    me.options.navigateTo(action, catalogItem.Path);
                }
            });
            var $reflection = new $("<div />");
            $reflection.addClass("fr-report-item-reflection");
            var $reflImg = $img.clone();
            $reflImg.addClass("fr-report-item-reflection");
            $reflImg.error(function () {
                $(this).attr("src", me.options.forerunnerPath + "/ReportExplorer/images/Report-icon.png");
            });
            $reflection.append($reflImg);

            $anchor.append($img);
            $anchor.append($reflection);
            $imageblock.append($anchor);
            return $item;
        },
        _renderPCView: function (catalogItems) {
            var me = this;

            me.$UL = me.element.find(".fr-report-explorer");
            var decodedPath = me.options.selectedItemPath ? decodeURIComponent(me.options.selectedItemPath) : null;
            me.rmListItems = new Array(catalogItems.length);
            for (var i = 0; i < catalogItems.length; i++) {
                var catalogItem = catalogItems[i];
                var isSelected = false;
                if (decodedPath && decodedPath === decodeURIComponent(catalogItem.Path)) {
                    me.selectedItem = i;
                    isSelected = true;
                }
                me.rmListItems[i] = me._generatePCListItem(catalogItem, isSelected);
                me.$UL.append(me.rmListItems[i]);
            }
        },
        _render: function (catalogItems) {
            var me = this;
            me.element.html("<div class='fr-report-explorer'>" +
                                "</div>");
            me._renderPCView(catalogItems);
            if (me.$selectedItem) {
                $(window).scrollTop(me.$selectedItem.offset().top - 50);  //This is a hack for now
                $(window).scrollLeft(me.$selectedItem.offset().left - 20);  //This is a hack for now
            }
            //me._initscrollposition();
        },
        _setSelectionFromScroll: function () {
            var me = this;
            var position = me.$explorer.scrollTop();
            var closest = 0;
            var lastDistance = 0;
            var closestDistance = Math.abs(position - me.rmListItems[0].position().top);
            for (var i = 1; i < me.rmListItems.length; i++) {
                var distance = Math.abs(position - me.rmListItems[i].position().top);
                if (distance < closestDistance) {
                    closest = i;
                    closestDistance = distance;
                } else if (lastDistance !== 0 && distance > lastDistance) {
                    // If closetst is no longer 0 and we are no longer approaching the closest break
                    break;
                }
                lastDistance = distance;
            }
            me.selectedItem = closest;
        },

        _fetch: function (view,path) {
            var me = this;
            $.ajax({
                dataType: "json",
                url: me.options.reportManagerAPI + "/GetItems",
                async: false,
                data: {
                    view: view,
                    path: path                    
                },
                success: function (data) {
                    me._render(data);
                },
                error: function (data) {
                    console.log(data);
                    alert("Failed to load the catalogs from the server.  Please try again.");
                }
            });
        },
        _initCallbacks: function () {
            var me = this;
            // Hook up any / all custom events that the report viewer may trigger
        },
        _init: function () {
            var me = this;
            me.$RMList = null;
            me.$UL = null;
            me.rmListItems = null;
            me.selectedItem = 0;
            me.isRendered = false;
            me.$explorer = me.options.$scrollBarOwner ? me.options.$scrollBarOwner : $(window);
            me.$selectedItem = null;
            me._fetch(me.options.view, me.options.path);
        }
    });  // $.widget
});  // function()