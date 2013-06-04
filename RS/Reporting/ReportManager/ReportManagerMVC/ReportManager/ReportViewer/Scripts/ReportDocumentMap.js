$(function () {
    $.widget("Forerunner.reportDocumentMap", {
        options: {
            ReportViewer: null,
        },
        _create: function () {
            this.ReportViewer = this.options.ReportViewer;
        },
        WriteDocumentMap: function (pageNum) {
            var me = this;
            var $TD = new $("<TD />");
            $TD.addClass("DocMapPanel");
            var $DocMapContainer = new $("<DIV />");
            $DocMapContainer.addClass("DocMapBorder");

            var $Table = me._GetDefaultHTMLTable();
            $Table.addClass("DocMapBorder");

            var $RowBar = new $("<TR />");
            var $Header = new $("<DIV />");
            $Header.addClass("DocMapHeader");

            var $DocMapBar = new $("<DIV />");
            $DocMapBar.addClass("DocMapBar").html(" Document Map ");
            $Header.append($DocMapBar);
            $RowBar.append($Header);

            var $Row = new $("<TR />");
            var $TDMap = new $("<TD />");
            $TDMap.addClass("DocMapBorder");
            $TDMap.append(me._WriteDocumentMapItem(this.ReportViewer.Pages[pageNum].ReportObj.Report.DocumentMap, 0));

            var $TDSpliter = new $("<TD />");
            $TDSpliter.addClass("DocMap-Spliter");

            var $Spliter = new $("<DIV />");
            $Spliter.addClass("DocMap-Collapse");
            $TDSpliter.on("click", function () {
                $(".DocMapPanel").toggle("fast");
                if ($Spliter.hasClass("DocMap-Collapse"))
                    $Spliter.removeClass("DocMap-Collapse").addClass("DocMap-Expand");
                else
                    $Spliter.removeClass("DocMap-Expand").addClass("DocMap-Collapse");
            });
            $TDSpliter.append($Spliter);

            $Row.append($TDMap);
            $Table.append($RowBar);
            $Table.append($Row);
            $DocMapContainer.append($Table);
            $TD.append($DocMapContainer);

            this.ReportViewer.$PageContainer.append($TD);
            this.ReportViewer.$PageContainer.append($TDSpliter);
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
                me.ReportViewer.NavigateDocumentMap(e.data.UniqueName);
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
        _GetDefaultHTMLTable: function () {
            var $NewObj = $("<Table/>");

            $NewObj.attr("CELLSPACING", 0);
            $NewObj.attr("CELLPADDING", 0);
            return $NewObj;
        },
    });
});