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
            $docMapPanel.addClass("fr-docmap-panel").addClass("fr-docmap-panel-layout");
            $docMapPanel.append(me._writeDocumentMapItem(docMapData.DocumentMap, 0));
            me.element.append($docMapPanel);
        },

        _writeDocumentMapItem: function (docMap, level) {
            var me = this;
            var $docMap = new $("<div />");
            
            var $header = null;
            var $rightImage = null;
            if (!docMap.Children) {
                var $icon = new $("<div />");
                $icon.addClass("fr-docmap-indent");
                $docMap.append($icon);

                $docMap.addClass("fr-docmap-item-container");
                me._setFocus($docMap);
            }
            else {
                $header = new $("<DIV />");
                $header.addClass("fr-docmap-parent-container");
                me._setFocus($header);

                $header.on("click", function () {
                    var childPanel = $docMap.find("[level='" + level + "']");
                    if (childPanel.is(":visible"))
                        $docMap.find("[level='" + level + "']").hide();
                    else
                        $docMap.find("[level='" + level + "']").slideUpShow();
                });
            }
         
            var $mapNode = new $("<A />");
            $mapNode.addClass("fr-docmap-item").attr("title", "Navigate to " + docMap.Label).html(docMap.Label);
            $mapNode.on("click", { UniqueName: docMap.UniqueName }, function (e) {
                me.options.$reportViewer.navigateDocumentMap(e.data.UniqueName);
            });
            
            if ($header) {
                $header.append($mapNode);
                $docMap.append($header);
            }
            else{
                $docMap.append($mapNode);
            }

            var $children = $("<div level='" + level + "'>");
            if (docMap.Children) {
                $.each(docMap.Children, function (Index, Obj) {
                    $children.append(me._writeDocumentMapItem(Obj, level + 1));
                });
            }
            $children.hide();
            $docMap.append($children);
            return $docMap;
        },
        _setFocus: function ($focus) {
            $focus.hover(function () { $(this).addClass("fr-docmap-item-highlight"); }, function () { $(this).removeClass("fr-docmap-item-highlight"); });
        }
    });  // $.widget
    
});  // $(function ()
