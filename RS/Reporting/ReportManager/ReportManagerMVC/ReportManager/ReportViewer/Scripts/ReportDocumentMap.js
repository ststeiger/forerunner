$(function () {
    $.widget("Forerunner.reportDocumentMap", {
        options: {
            ReportViewer: null,
        },
        _create: function () {
                this.element = $("<td class='DocMapPanel'><div class='DocMapBorder'><table cellspacing='0' cellpadding='0'>" +
                    "<tr class='DocMapHeader'><td><div class='DocMapBar'> Document Map </div></td></tr>" +
                    "<tr><td class='DocMapItemContaienr'></td></tr></table></div></td>");
                //  "<td class='DocMap-Spliter'><div class='DocMap-Collapse'></div></td>"
                this.options.ReportViewer.$PageContainer.append(this.element);            
                //$(".DocMapBorder").resizable();
            
                window.onresize = function () { $(".DocMapBorder").css("height", document.body.clientHeight - $(".DocMapPanel").offset().top); };

                $(window).scroll(function () { $(".DocMapBorder").css("top", $(window).scrollTop()); });
        },
        WriteDocumentMap: function (pageNum) {
            var me = this;
            var $Cell;          
            $Cell = $(".DocMapItemContaienr");
            $Cell.append(me._WriteDocumentMapItem(this.options.ReportViewer.Pages[pageNum].ReportObj.Report.DocumentMap, 0));
            
            //$Cell = $(".DocMap-Spliter");
            //$Cell.on("click", function () {
            //    $(".DocMapPanel").toggle("fast");
            //    if ($Spliter.hasClass("DocMap-Collapse"))
            //        $Spliter.removeClass("DocMap-Collapse").addClass("DocMap-Expand");
            //    else
            //        $Spliter.removeClass("DocMap-Expand").addClass("DocMap-Collapse");
            //});            
        },
        _WriteDocumentMapItem: function (DocMap, Level) {
            var me = this;
            var $DocMap = new $("<DIV />");
            $DocMap.attr("style", "margin-left:" + Level * 18 + "px;white-space:nowrap");

            var $Icon = new $("<DIV />");

            if (DocMap.Children == null) {
                $DocMap.attr("level", Level);
                $Icon.attr("src", "./reportviewer/Images/EmptyIndent.gif");
            }
            else {
                $Icon.addClass("Drilldown-Collapse");
                $Icon.on("click", function () {
                    if ($Icon.hasClass("Drilldown-Collapse")) {
                        $Icon.removeClass("Drilldown-Collapse").addClass("Drilldown-Expand");
                        $("[level='" + (Level) + "']").addClass("DocMap-Hidden");
                    }
                    else {
                        $Icon.addClass("Drilldown-Collapse").removeClass("Drilldown-Expand");
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