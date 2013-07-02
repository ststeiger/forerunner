$(function () {
    $.widget("Forerunner.reportDocumentMap", {
        options: {
            reportViewer: null,
        },
        _create: function () {
                this.element = $("<div class='DocMapPanel'><div class='DocMapBorder'><table cellspacing='0' cellpadding='0' style='position:relative;height:100%;width:100%;'>" +
                "<tr><td nowrap width='100%'><div class='DocMapHeader'><div class='DocMapBar'> Document Map </div></div></td></tr>" +
                "<tr><td class='DocMapContentCell'><div class='DocMapItemContaienr'></div></td></tr></table></div></div>");
            
                this.options.reportViewer.$reportContainer.append(this.element);
                
                $(".DocMapPanel").resizable({
                    resize: function (event, ui) {
                        $(".DocMapBorder").css("width", ui.size.width);
                        $(".DocMapHeader").css("width", ui.size.width);
                        $(".DocMapItemContaienr").css("width", ui.size.width);
                    }
                });

                var clientHeight = document.documentElement.clientHeight == 0 ? document.body.clientHeight : document.documentElement.clientHeight;
                window.onresize = function () { $(".DocMapBorder").css("height", clientHeight - $(".DocMapPanel").offset().top); };

                $(window).scroll(function () { $(".DocMapBorder").css("top", $(window).scrollTop()); });
                //trigger the onresize event, fix Compatibility issue in IE and FF
                $(window).resize();
                $(".DocMapPanel").toggle("fast");
        },
        writeDocumentMap: function (pageNum) {
            var me = this;
            var $cell;
            $cell = $(".DocMapItemContaienr");
            $cell.append(me._writeDocumentMapItem(this.options.reportViewer.pages[pageNum].reportObj.Report.DocumentMap, 0));
        },
        _writeDocumentMapItem: function (docMap, level) {
            var me = this;
            var $docMap = new $("<DIV />");
            $docMap.css("margin-left", 18 * level + "px");

            var $icon = new $("<DIV />");
            
            if (!docMap.Children) {
                $docMap.attr("level", level);
                $icon.addClass("DocMap-Indent");
            }
            else {
                $icon.addClass("DocMap-Collapse");
                $icon.on("click", function () {
                    if ($icon.hasClass("DocMap-Collapse")) {
                        $icon.removeClass("DocMap-Collapse").addClass("DocMap-Expand");
                        $("[level='" + (level) + "']").addClass("DocMap-Hidden");
                    }
                    else {
                        $icon.addClass("DocMap-Collapse").removeClass("DocMap-Expand");
                        $("[level='" + (level) + "']").removeClass("DocMap-Hidden");
                    }
                });
            }
            $docMap.append($icon);

            var $mapNode = new $("<A />");
            $mapNode.addClass("DocMap-Item").attr("title", "Navigate to " + docMap.Label).html(docMap.Label);
            $mapNode.on("click", { UniqueName: docMap.UniqueName }, function (e) {
                me.options.reportViewer.navigateDocumentMap(e.data.UniqueName);
            });
            $mapNode.hover(function () { $mapNode.addClass("DocMap-Item-Highlight"); }, function () { $mapNode.removeClass("DocMap-Item-Highlight"); });
            $docMap.append($mapNode);

            if (docMap.Children) {
                level++;
                $.each(docMap.Children, function (Index, Obj) {
                    $docMap.append(me._writeDocumentMapItem(Obj, level));
                });
            }
            return $docMap;
        },
    });
});