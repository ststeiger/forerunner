// Assign or create the single globally scoped variable
var forerunner = forerunner || {};

// Forerunner SQL Server Reports
forerunner.ssr = forerunner.ssr || {};

$(function () {
    var widgets = forerunner.ssr.constants.widgets;

    $.widget(widgets.getFullname(widgets.reportExplorer), {
        options: {
            path: null,
            selectedItemPath: null,
            catalogItems: null,
            url: null,
            $scrollBarOwner: null,
            navigateTo: null
        },
        _generatePCListItem: function (catalogItem, isSelected) {
            var me = this;
            //var $selectedItem = null;

            var hasParameters = (String(catalogItem.Path).indexOf("Parameter") !== -1) ? 1 : 0;
            var reportThumbnailPath = me.options.url
              + "GetThumbnail/?ReportPath=" + catalogItem.Path + "&DefDate=" + catalogItem.ModifiedDate;
            var $item = new $("<div />");
            if (isSelected) {
                $item.addClass("fr-explorer-item-selected");
                me.$selectedItem = $item;
            }
            $item.addClass("fr-explorer-item");
            $item.addClass("image-block");
            var $caption = new $("<div />");
            $caption.addClass("fr-report-center");
            $item.append($caption);
            var $captiontext = new $("<h3 />");
            $captiontext.addClass("fr-report-centertext");
            $captiontext.html(catalogItem.Name);
            $caption.append($captiontext);
            var imageSrc;
            //var targetUrl;
            var $anchor = new $("<a />");
            var $img = new $("<img />");
            $img.addClass("catalogitem");
            $img.addClass("fr-report-center");
            if (catalogItem.Type === 1) {
                imageSrc = "./Forerunner/ReportExplorer/images/folder-icon.png";
            } else {
                $img.addClass("reportitem");
                imageSrc = reportThumbnailPath;
            }

            var action = catalogItem.Type === 1 ? "explore" : "browse";
            $img.attr("src", imageSrc);
            $img.error(function () {
                $(this).attr("src", "./Forerunner/ReportExplorer/images/Report-icon.png");
            });
            $img.removeAttr("height"); //JQuery adds height for IE8, remove.
            $anchor.on("click", function (event) {
                if (me.options.navigateTo) {
                    me.options.navigateTo(action, catalogItem.Path);
                }
            });
            var $reflection = new $("<div />");
            $reflection.addClass("reflection");
            var $reflImg = $img.clone().removeClass("catalogitem")
            $reflImg.addClass("reflection")
            $reflImg.error(function () {
                $(this).attr("src", "../Forerunner/ReportExplorer/images/Report-icon.png");
            });
            $reflection.append($reflImg);

            $anchor.append($img);
            $anchor.append($reflection);
            $item.append($anchor);
            return $item;
        },
        _renderPCView: function () {
            var me = this;
            me.$UL = me.element.find(".fr-report-explorer");
            var catalogItems = me.options.catalogItems;
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
        _render: function () {
            var me = this;
            me.element.html("<div class='fr-report-explorer'>" +
                                "</div>");
            me._renderPCView();
            if (me.$selectedItem) {
                $(window).scrollTop(me.$selectedItem.offset().top - 50);  //This is a hack for now
                $(window).scrollLeft(me.$selectedItem.offset().left - 20);  //This is a hack for now
            }
        },
        initCarousel: function () {
            var me = this;
            var isTouch = forerunner.device.isTouch();
            if (isTouch) {
                if (me.rmListItems.length > 0) {
                    me._scrollList();
                }

                me.$explorer.bind("scrollstop", function (e) {
                    me._setSelectionFromScroll();
                });

                me.$explorer.resize(function () {
                    me._scrollList();
                });
            }
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
                } else if (lastDistance != 0 && distance > lastDistance) {
                    // If closetst is no longer 0 and we are no longer approaching the closest break
                    break;
                }
                lastDistance = distance;
            }
            me.selectedItem = closest;
        },
        _scrollList: function () {
            var me = this;
            var itemPosition = me.rmListItems[me.selectedItem].position().top;
            var ulPosition = me.$UL.position().top;
            var diff = Number(itemPosition - ulPosition);
            me.$explorer.scrollTop(diff, "slow");
        },
        _getSelectedItem: function () {
            var me = this;
            return me.selectedItem;
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
            me._render();
            me.$selectedItem = null;
        }
    });  // $.widget
});  // function()