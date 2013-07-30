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
        write: function (docMapData) {
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
            if (level !== 0)
                $docMap.css("margin-left", '34px');

            var $mapNode = new $("<div />");
            $mapNode.addClass("fr-docmap-item").attr("title", "Navigate to " + docMap.Label).html(docMap.Label);
            $mapNode.on("click", { UniqueName: docMap.UniqueName }, function (e) {
                me.options.$reportViewer.navigateDocumentMap(e.data.UniqueName);
            });

            if (docMap.Children) {
                var $header = new $("<DIV />");
                $header.addClass("fr-docmap-parent-container");
                me._setFocus($header);

                var $rightImage = new $("<div class='fr-docmap-icon'/>");

                if (level === 0)
                    $rightImage.addClass("fr-docmap-icon-up");
                else
                    $rightImage.addClass("fr-docmap-icon-down");

                $rightImage.on("click", function () {
                    var childPanel = $docMap.find("[level='" + level + "']");
                    if (childPanel.is(":visible")) {
                        $docMap.find("[level='" + level + "']").hide();
                        $rightImage.removeClass("fr-docmap-icon-up").addClass("fr-docmap-icon-down");
                    }
                    else {
                        //$docMap.find("[level='" + level + "']").slideUpShow();
                        $docMap.find("[level='" + level + "']").show();
                        $rightImage.removeClass("fr-docmap-icon-down").addClass("fr-docmap-icon-up");
                    }
                });

                $mapNode.addClass("fr-docmap-item-root");
                $header.append($rightImage);
                $header.append($mapNode);
                $docMap.append($header);

                var $children = new $("<div level='" + level + "'>");
                $.each(docMap.Children, function (Index, Obj) {
                    $children.append(me._writeDocumentMapItem(Obj, level + 1));
                });

                $docMap.append($children);

                //expand the first root node
                if (level !== 0)
                    $children.hide();
            }
            else {
                $docMap.addClass("fr-docmap-item-container");
                me._setFocus($docMap);
                $docMap.append($mapNode);
            }

            return $docMap;
        },
        _setFocus: function ($focus) {
            $focus.hover(function () { $(this).addClass("fr-docmap-item-highlight"); }, function () { $(this).removeClass("fr-docmap-item-highlight"); });
        }
    });  // $.widget

});  // $(function ()
