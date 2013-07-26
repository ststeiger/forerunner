/**
 * @file Contains the document map widget.
 *
 */

// Assign or create the single globally scoped variable
var forerunner = forerunner || {};

// Forerunner SQL Server Reports
forerunner.ssr = forerunner.ssr || {};

/**
     * documenet map widget used with the reportViewer
     *
     * @namespace $.forerunner.reportDocumentMap
     * @prop {object} options - The options for document map
     * @prop {Object} options.$reportViewer - The report viewer widget     
     * @example
     *   $("#docMap").reportDocumentMap({ 
     *      $reportViewer: $viewer 
     *   });   
     */
$(function () {
    var widgets = forerunner.ssr.constants.widgets;

    $.widget(widgets.getFullname(widgets.reportDocumentMap), {
        options: {
            $reportViewer: null,
        },
        _create: function () {
        },
        _init: function () {
               
        },
        /**
        * @function $.forerunner.reportDocumentMap#write
        * @Generate document map html code and append to the dom tree
        * @param {String} docMapData - original data get from server client
        */
        write: function(docMapData) {
            var me = this;
            this.element.html("");

            var $docMapPanel = new $("<DIV />");
            var $docMapContainer = new $("<DIV />");
            $docMapPanel.addClass("fr-docmap-panel");
            $docMapContainer.addClass("fr-docmap-item-container");

            $docMapPanel.append($docMapContainer);
            $docMapContainer.append(me._writeDocumentMapItem(docMapData.DocumentMap, 0));
            me.element.append($docMapPanel);
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
                me.options.$reportViewer.navigateDocumentMap(e.data.UniqueName);
            });
            $mapNode.hover(function () { $mapNode.addClass("fr-docmap-item-highlight"); }, function () { $mapNode.removeClass("fr-docmap-item-highlight"); });
            $docMap.append($mapNode);

            if (docMap.Children) {
                $.each(docMap.Children, function (Index, Obj) {
                    $docMap.append(me._writeDocumentMapItem(Obj, level + 1));
                });
            }
            return $docMap;
        }
    });  // $.widget
});  // $(function ()