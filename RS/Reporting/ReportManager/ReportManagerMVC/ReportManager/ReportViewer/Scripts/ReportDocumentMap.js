$(function () {
    $.widget("Forerunner.reportDocumentMap", {
        options: {
            ReportViewer: null,
        },
        _create: function () {
                this.element = $("<div class='DocMapPanel'><div class='DocMapBorder'><table cellspacing='0' cellpadding='0' style='position:relative;height:100%;width:100%;'>" +
                "<tr><td nowrap width='100%'><div class='DocMapHeader'><div class='DocMapBar'> Document Map </div></div></td></tr>" +
                "<tr><td class='DocMapContentCell'><div class='DocMapItemContaienr'></div></td></tr></table></div></div>");
            
                this.options.ReportViewer.$ReportContainer.append(this.element);
                
                $(".DocMapPanel").resizable({
                    resize: function (event, ui) {
                        alert('test');
                        $(".DocMapBorder").css("width", ui.size.width);
                        $(".DocMapHeader").css("width", ui.size.width);
                        $(".DocMapItemContaienr").css("width", ui.size.width);
                    }
                });

                window.onresize = function () { $(".DocMapBorder").css("height", document.body.clientHeight - $(".DocMapPanel").offset().top); };

                $(window).scroll(function () { $(".DocMapBorder").css("top", $(window).scrollTop()); });
                //trigger the onresize event, fix Compatibility issue in IE and FF
                $(window).resize();
                $(".DocMapPanel").toggle("fast");
        },
        WriteDocumentMap: function (pageNum) {
            var me = this;
            var $Cell;          
            $Cell = $(".DocMapItemContaienr");
            $Cell.append(me._WriteDocumentMapItem(this.options.ReportViewer.Pages[pageNum].ReportObj.Report.DocumentMap, 0));
        },
        _WriteDocumentMapItem: function (DocMap, Level) {
            var me = this;
            var $DocMap = new $("<DIV />");
            $DocMap.css("margin-left", 18 * Level + "px");

            var $Icon = new $("<DIV />");
            
            if (DocMap.Children == null) {
                $DocMap.attr("level", Level);
                $Icon.addClass("DocMap-Indent");
            }
            else {
                $Icon.addClass("DocMap-Collapse");
                $Icon.on("click", function () {
                    if ($Icon.hasClass("DocMap-Collapse")) {
                        $Icon.removeClass("DocMap-Collapse").addClass("DocMap-Expand");
                        $("[level='" + (Level) + "']").addClass("DocMap-Hidden");
                    }
                    else {
                        $Icon.addClass("DocMap-Collapse").removeClass("DocMap-Expand");
                        $("[level='" + (Level) + "']").removeClass("DocMap-Hidden");
                    }
                });
            }
            $DocMap.append($Icon);

            var $MapNode = new $("<A />");
            $MapNode.addClass("DocMap-Item").attr("title", "Navigate to " + DocMap.Label).html(DocMap.Label);
            $MapNode.on("click", { UniqueName: DocMap.UniqueName }, function (e) {
                me.options.ReportViewer.NavigateDocumentMap(e.data.UniqueName);
            });
            $MapNode.hover(function () { $MapNode.addClass("DocMap-Item-Highlight"); }, function () { $MapNode.removeClass("DocMap-Item-Highlight"); });
            $DocMap.append($MapNode);

            if (DocMap.Children != undefined) {
                Level++;
                $.each(DocMap.Children, function (Index, Obj) {
                    $DocMap.append(me._WriteDocumentMapItem(Obj, Level));
                });
            }
            return $DocMap;
        },
    });
});