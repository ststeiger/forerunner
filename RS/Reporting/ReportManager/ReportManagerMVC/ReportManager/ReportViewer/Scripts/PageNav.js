$(function () {
    // Toolbar widget
    $.widget("Forerunner.pagenav", {
        options: {
            $reportViewer: null
        },
        _setCurrentPage: function (currentPageNum) {
            var me = this;
            me.$Carousel.select(currentPageNum - 1, 1);
        },
        _renderList: function () {
            var me = this;
            $List = new $('<UL />');
            $List.attr('class', 'sky-carousel-container');
            var maxNumPages = me.options.$reportViewer.reportViewer('getNumPages');
            var sessionID = me.options.$reportViewer.reportViewer('getSessionID');
            var reportServerURL = me.options.$reportViewer.reportViewer('getReportServerURL');
            var reportViewerAPI = me.options.$reportViewer.reportViewer('getReportViewerAPI');
            var reportPath = me.options.$reportViewer.reportViewer('getReportPath');

            for (var i = 1; i <= maxNumPages; i++) {

                var url = reportViewerAPI + '/GetThumbnail/?ReportServerURL=' + reportServerURL + '&ReportPath='
                        + reportPath + '&SessionID=' + sessionID + '&PageNumber=' + i;
                $ListItem = new $('<LI />');
                $List.append($ListItem);
                $Caption = new $('<DIV />');
                $Caption.html("<h3 class='centertext'>" + i.toString() + "</h3>");
                $Caption.attr('class', 'center');
                $Thumbnail = new $('<IMG />');
                $Thumbnail.attr('class', 'pagethumb');
                $Thumbnail.attr('src', url);
                $Thumbnail.data('pageNumber', i);
                this._on($Thumbnail, {
                    click: function (event) {
                        me.options.$reportViewer.NavToPage($(event.currentTarget).data('pageNumber'));
                    }
                });
                // Need to add onclick
                $ListItem.append($Caption);
                $ListItem.append($Thumbnail);
            }

            return $List;
        },

        render: function () {
            var me = this;
            var $reportViewer = me.options.$reportViewer;

            $Slider = new $('<DIV />');
            $Slider.attr('class', 'sky-carousel');
            $Slider.attr('style', 'height: 150px;'); // Need to make this none
            $SliderWrapper = new $('<DIV />');
            $SliderWrapper.attr('class', 'sky-carousel-wrapper');
            $Slider.append($SliderWrapper);


            $List = me._renderList();

            $SliderWrapper.append($List);
            me.element.css("display", "block");
            me.element.html($Slider);

            var carousel = $Slider.carousel({
                itemWidth: 120,
                itemHeight: 120,
                distance: 8,
                selectedItemDistance: 25,
                selectedItemZoomFactor: 1,
                unselectedItemZoomFactor: 0.67,
                unselectedItemAlpha: 0.6,
                motionStartDistance: 85,
                topMargin: 30,
                gradientStartPoint: 0.35,
                gradientOverlayColor: "#f5f5f5",
                gradientOverlaySize: 95,
                reflectionDistance: 1,
                reflectionAlpha: 0.35,
                reflectionVisible: true,
                reflectionSize: 35,
                selectByClick: true
            });
            carousel.select(0, 1);
            me.$Carousel = carousel;
        },
        showNav: function () {
            var me = this;
            if (me.element.is(":visible")) {
                me.element.fadeOut("fast");
            }
            else {
                me.element.fadeIn("fast");
            }
        },
        _initCallbacks: function () {
            var me = this;
            // Hook up any / all custom events that the report viewer may trigger
            me.options.$reportViewer.on('reportviewerchangepage', function (e, data) {
                me._setCurrentPage(data.newPageNum);
            });
        },
        _create: function () {
            var me = this;
            me.$Carousel;
            me.render();
            me._initCallbacks();
        },
    });  // $.widget
});  // function()