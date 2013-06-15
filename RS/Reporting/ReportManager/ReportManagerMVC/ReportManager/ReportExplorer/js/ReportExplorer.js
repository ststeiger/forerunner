$(function () {
    // Toolbar widget
    $.widget("Forerunner.reportexplorer", {
        options: {
            path: null,
            selectedItemPath: null,
            catalogItems: null,
            url: null,
        },
        _generateListItem: function (catalogItem) {
            var me = this;
            var encodedPath = String(catalogItem.Path).replace(/\//g, "%2f");
            var hasParameters = (String(catalogItem.Path).indexOf("Parameter") != -1) ? 1 : 0;
            var reportThumbnailPath = me.options.url
              + 'GetThumbnail/?ReportPath=' + catalogItem.Path;
            $ListItem = new $('<li />');
            $ListItem.addClass('center');
            $ListItem.addClass('rm-list-container-item');
            $caption = new $('<div />');
            $caption.addClass('center');
            $ListItem.append($caption);
            $captiontext = new $('<h3 />');
            $captiontext.addClass('centertext');
            $captiontext.html(catalogItem.Name);
            $caption.append($captiontext);
            var imageSrc;
            var targetUrl;
            $img = new $('<img />');
            $img.addClass('catalogitem');
            $img.addClass('center');
            if (catalogItem.Type == '1') {
                imageSrc = '../ReportExplorer/images/folder-icon.png'
                targetUrl = '#explore/' + encodedPath;
            } else {
                $img.addClass('reportitem');
                targetUrl = '#browse/' + encodedPath;
                if (hasParameters) {
                    imageSrc = '../ReportExplorer/images/Report-icon.png'
                } else {
                    imageSrc = reportThumbnailPath;
                }
            }
              
            $img.attr('src', imageSrc);
            $img.on('click', function (event) {
                // BUGBUG:: Need to move this to a call back
                g_App.router.navigate(targetUrl, { trigger: true, replace: false });
            });
            $ListItem.append($img);
            return $ListItem;
        },
        _renderList: function () {
            var me = this;
            var catalogItems = me.options.catalogItems;
            me.element.addClass('reportexplorer');
            $carouselContainer = $('.sky-carousel-container', me.$Carousel);
            $rmListContainer = $('.rm-list-container', me.$RMList);
            for (var i = 0; i < catalogItems.length; i++) {
                var catalogItem = catalogItems[i];
                $carouselContainer.append(me._generateListItem(catalogItem));
                $rmListContainer.append(me._generateListItem(catalogItem));
            }
        },
        _render: function () {
            var me = this;
            me.element.html('<div class="sky-carousel">' +
                            '<div class="sky-carousel-wrapper">' +
                            '<ul class="sky-carousel-container" />' +
                            '</div>' +
                            '</div>' +
                            '<div class="rm-list">' +
                            '<ul class="rm-list-container" />' +
                            '</div>');
            me.$Carousel = $('.sky-carousel', me.element);
            me.$RMList = $('.rm-list', me.element);
            me._renderList();
        },
        _initTouch: function () {
            var me = this;
            $(me.element).swipe({
                fallbackToMouseEvents: false,
                allowPageScroll: "auto",
                tap: function (event, target) {
                    $(target).trigger('click');
                },
                //longTap: function (event, target) {
                //    if (me.$Slider === undefined || !me.$Slider.is(":visible")) {
                //        me.ShowNav();
                //    }
                //},
                //doubleTap: function (event, target) {
                //    if (me.$Slider !== undefined && me.$Slider.is(":visible") && $(target).is(me.$Slider)) {
                //        me.ShowNav();
                //    }
                //},
                longTapThreshold: 1000,
            });
        },
        initCarousel: function () {
            var me = this;
            me._initTouch();
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
            carousel.select(me._getSelectedItem(), 1);
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
            me.$Carousel;
            me.$RMList;
            me.selectedItem = 0;
            me.isRendered = false;
            me._render();
        },
        _isTouchDevice: function () {
            var ua = navigator.userAgent;
            return !!('ontouchstart' in window) // works on most browsers 
                || !!('onmsgesturechange' in window) || ua.match(/(iPhone|iPod|iPad)/)
                || ua.match(/BlackBerry/) || ua.match(/Android/); // works on ie10
        },
    });  // $.widget
});  // function()