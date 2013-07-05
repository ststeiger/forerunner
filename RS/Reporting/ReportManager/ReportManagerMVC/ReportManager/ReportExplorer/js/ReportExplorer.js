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
        _generateListItem: function (catalogItem) {
            var me = this;
            
            var hasParameters = (String(catalogItem.Path).indexOf("Parameter") !== -1) ? 1 : 0;
            var reportThumbnailPath = me.options.url
              + "GetThumbnail/?ReportPath=" + catalogItem.Path + "&DefDate=" + catalogItem.ModifiedDate;
            var $listItem = new $("<li />");
            $listItem.addClass("fr-report-center");
            $listItem.addClass("rm-list-container-item");
            var $caption = new $("<div />");
            $caption.addClass("fr-report-center");
            $listItem.append($caption);
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
                imageSrc = "./ReportExplorer/images/folder-icon.png";
            } else {
                $img.addClass("reportitem");
                if (hasParameters) {
                    imageSrc = "./ReportExplorer/images/Report-icon.png";
                } else {
                    imageSrc = reportThumbnailPath;
                }
            }

            var action = catalogItem.Type === 1 ? "explore" : "browse";
              
            $img.attr("src", imageSrc);
            $img.removeAttr("height");
            $anchor.on("click", function (event) {
                if (me.options.navigateTo) {
                    me.options.navigateTo(action, catalogItem.Path);
                }
            });
            $anchor.append($img);
            $listItem.append($anchor);
            return $listItem;
        },
        _generatePCListItem: function (catalogItem) {
            var me = this;
            //var $selectedItem = null;

            var hasParameters = (String(catalogItem.Path).indexOf("Parameter") !== -1) ? 1 : 0;
            var reportThumbnailPath = me.options.url
              + "GetThumbnail/?ReportPath=" + catalogItem.Path + "&DefDate=" + catalogItem.ModifiedDate;
            var $item = new $("<div />");
            if (catalogItem.Path === me.options.selectedItemPath) {
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
                imageSrc = "./ReportExplorer/images/folder-icon.png";
            } else {
                $img.addClass("reportitem");
                if (hasParameters) {
                    imageSrc = "./ReportExplorer/images/Report-icon.png";
                } else {
                    imageSrc = reportThumbnailPath;
                }
            }

            var action = catalogItem.Type === 1 ? "explore" : "browse";

            $img.attr("src", imageSrc);
            $img.removeAttr("height");
            $anchor.on("click", function (event) {
                if (me.options.navigateTo) {
                    me.options.navigateTo(action, catalogItem.Path);
                }
            });
            var $reflection = new $("<div />");
            $reflection.addClass("reflection");
            $reflection.append($img.clone().removeClass("catalogitem").addClass("reflection"));

            $anchor.append($img);
            $anchor.append($reflection);
            $item.append($anchor);
            return $item;
        },
        _renderList: function () {
            var me = this;
            var catalogItems = me.options.catalogItems;
            var decodedPath = me.options.selectedItemPath ? decodeURIComponent(me.options.selectedItemPath) : null;
            me.element.addClass("reportexplorer");
            var $carouselContainer = $(".sky-carousel-container", me.$Carousel);
            var $rmListContainer = $(".rm-list-container", me.$RMList);
            me.rmListItems = new Array(catalogItems.length);
            for (var i = 0; i < catalogItems.length; i++) {
                var catalogItem = catalogItems[i];
                if (decodedPath && decodedPath === decodeURIComponent(catalogItem.Path)) {
                    me.selectedItem = i;
                }
                $carouselContainer.append(me._generateListItem(catalogItem));
                me.rmListItems[i] = me._generateListItem(catalogItem);
                $rmListContainer.append(me.rmListItems[i]);
            }
            me.$UL = $rmListContainer;
        },
        _renderPCView: function () {
            var me = this;
            var catalogItems = me.options.catalogItems;
            var decodedPath = me.options.selectedItemPath ? decodeURIComponent(me.options.selectedItemPath) : null;
            me.rmListItems = new Array(catalogItems.length);
            for (var i = 0; i < catalogItems.length; i++) {
                var catalogItem = catalogItems[i];
                if (decodedPath && decodedPath === decodeURIComponent(catalogItem.Path)) {
                    me.selectedItem = i;
                }
                me.rmListItems[i] = me._generatePCListItem(catalogItem);
                me.element.find(".fr-report-explorer").append(me.rmListItems[i]);
            }
        },
        _render: function () {
            var me = this;

            if (me._mobileUI()) {
                me.element.html("<div class='sky-carousel'>" +
                                "<div class='sky-carousel-wrapper'>" +
                                "<ul class='sky-carousel-container' />" +
                                "</div>" +
                                "</div>" +
                                "<div class='rm-list'>" +
                                "<ul class='rm-list-container' />" +
                                "</div>");
                me.$Carousel = $(".sky-carousel", me.element);
                me.$RMList = $(".rm-list", me.element);
                me._renderList();
            }
            else {
                me.element.html("<div class='fr-report-explorer'>" +
                                "</div>");
                me._renderPCView();
            }
            if (me.$selectedItem) {
                $(window).scrollTop(me.$selectedItem.offset().top - 50);  //This is a hack for now
                $(window).scrollLeft(me.$selectedItem.offset().left - 20);  //This is a hack for now
            }
        },
        _mobileUI: function () {
            return false;
            if (screen.availWidth < 1224)
                return true;
            else
                return false;
        },
        initCarousel: function () {
            var me = this;
            if (!me._mobileUI())
                return;
            var carousel = me.$Carousel.carousel({
                itemWidth: 250,
                itemHeight: 350,
                distance: 15,
                selectedItemDistance: 50,
                selectedItemZoomFactor: 1,
                unselectedItemZoomFactor: 0.67,
                unselectedItemAlpha: 0.6,
                motionStartDistance: 250,
                topMargin: 80,
                gradientStartPoint: 0.35,
                gradientOverlayColor: "#f5f5f5",
                gradientOverlaySize: 200,
                reflectionDistance: 1,
                reflectionAlpha: 0.35,
                reflectionVisible: true,
                reflectionSize: 70,
                selectByClick: true
            });
            me.$C = carousel;
            if (me.rmListItems.length > 0) {
                me._selectCarouselItem();
                me._scrollList();
            }

            me.$explorer.bind("scrollstop", function (e) {
                if (!me.$Carousel.is(":visible")) {
                    me._setSelectionFromScroll();
                    me._selectCarouselItem();
                }
            });

            me.$explorer.bind("selectionAnimationEnd.sc", function (e) {
                me.selectedItem = me.$C.selectedItem.index();
            });

            me.$explorer.resize(function () {
                if (!me.$Carousel.is(":visible")) {
                    if (me.$explorer.scrollTop() === 0 && me.$UL.is(":visible"))
                        me._scrollList();
                }
            });
        },
        _setSelectionFromScroll: function () {
            var me = this;
            //var ulPosition = me.$UL.position().top;
            var position = me.$explorer.scrollTop();
            var closest = 0;
            var closestDistance = Math.abs(position - me.rmListItems[0].position().top);
            for (var i = 1; i < me.rmListItems.length; i++) {
                var distance = Math.abs(position - me.rmListItems[i].position().top);
                if (distance < closestDistance) {
                    closest = i;
                    closestDistance = distance;
                } else if (closest !== 0) {
                    // If closetst is no longer 0 and we are no longer approaching the closest break
                    break;
                }
            }
            me.selectedItem = closest;
        },
        _selectCarouselItem: function () {
            var me = this;
            me.$C.select(me._getSelectedItem(), 1);
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
            me.$Carousel = null;
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