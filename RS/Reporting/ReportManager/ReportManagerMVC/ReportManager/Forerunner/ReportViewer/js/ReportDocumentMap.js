// Assign or create the single globally scoped variable
var forerunner = forerunner || {};

// Forerunner SQL Server Reports
forerunner.ssr = forerunner.ssr || {};

$(function () {
    var widgets = forerunner.ssr.constants.widgets;

    $.widget(widgets.getFullname(widgets.reportDocumentMap), {
        options: {
            reportViewer: null,
        },
        _create: function () {
                this.element = $("<div class='fr-docmap-panel'><div class='fr-docmap-border'><table class='fr-docmap-table'>" +
                "<tr><td nowrap><div class='fr-docmap-header'><div class='fr-docmap-bar'> Document Map </div></div></td></tr>" +
                "<tr><td class='fr-docmap-content-cell'><div class='fr-docmap-item-container'></div></td></tr></table></div></div>");
            
                this.options.reportViewer.$reportContainer.append(this.element);
                
                $(".fr-docmap-panel").resizable({
                    resize: function (event, ui) {
                        $(".fr-docmap-border").css("width", ui.size.width);
                        $(".fr-docmap-header").css("width", ui.size.width);
                        $(".fr-docmap-item-container").css("width", ui.size.width);
                    }
                });

                var clientHeight = document.documentElement.clientHeight === 0 ? document.body.clientHeight : document.documentElement.clientHeight;
                window.onresize = function () { $(".fr-docmap-border").css("height", clientHeight - $(".fr-docmap-panel").offset().top); };

                $(window).scroll(function () { $(".fr-docmap-border").css("top", $(window).scrollTop()); });
                //trigger the onresize event, fix Compatibility issue in IE and FF
                $(window).resize();
                $(".fr-docmap-panel").toggle("fast");
        },
        writeDocumentMap: function (pageNum) {
            var me = this;
            var $cell;
            $cell = $(".fr-docmap-item-container");
            $cell.append(me._writeDocumentMapItem(this.options.reportViewer.pages[pageNum].reportObj.Report.DocumentMap, 0));
        },
        _writeDocumentMapItem: function (docMap, level) {
            var me = this;
            var $docMap = new $("<DIV />");
            $docMap.css("margin-left", 18 * level + "px");

            var $icon = new $("<DIV />");
            
            if (!docMap.Children) {
                $docMap.attr("level", level);
                $icon.addClass("fr-docmap-indent");
            }
            else {
                $icon.addClass("fr-docmap-spliter");
                $icon.on("click", function () {
                    if ($icon.hasClass("fr-docmap-spliter")) {
                        $icon.removeClass("fr-docmap-spliter").addClass("fr-docmap-expand");
                        $("[level='" + (level) + "']").addClass("fr-docmap-hidden");
                    }
                    else {
                        $icon.addClass("fr-docmap-spliter").removeClass("fr-docmap-expand");
                        $("[level='" + (level) + "']").removeClass("fr-docmap-hidden");
                    }
                });
            }
            $docMap.append($icon);

            var $mapNode = new $("<A />");
            $mapNode.addClass("fr-docmap-item").attr("title", "Navigate to " + docMap.Label).html(docMap.Label);
            $mapNode.on("click", { UniqueName: docMap.UniqueName }, function (e) {
                me.options.reportViewer.navigateDocumentMap(e.data.UniqueName);
            });
            $mapNode.hover(function () { $mapNode.addClass("fr-docmap-item-highlight"); }, function () { $mapNode.removeClass("fr-docmap-item-highlight"); });
            $docMap.append($mapNode);

            if (docMap.Children) {
                level++;
                $.each(docMap.Children, function (Index, Obj) {
                    $docMap.append(me._writeDocumentMapItem(Obj, level));
                });
            }
            return $docMap;
        }
    });  // $.widget
});  // $(function ()