﻿/**
 * @file Contains the document map widget.
 *
 */

// Assign or create the single globally scoped variable
var forerunner = forerunner || {};

// Forerunner SQL Server Reports
forerunner.ssr = forerunner.ssr || {};

$(function () {
    var widgets = forerunner.ssr.constants.widgets;

    /**
     * Widget used to show report documenet map
     *
     * @namespace $.forerunner.reportDocumentMap
     * @prop {Object} options - The options for document map
     * @prop {Object} options.$reportViewer - The report viewer widget     
     * @example
     *   $("#docMap").reportDocumentMap({ 
     *      $reportViewer: $viewer 
     *   });   
     */
    $.widget(widgets.getFullname(widgets.reportDocumentMap), {
        options: {
            $reportViewer: null,
        },
        _create: function () {
        },
        _init: function () {

        },
        /**
         * Write document map layout with doc map data.
         *
         * @function $.forerunner.reportDocumentMap#write
         * 
         * @param {Object} docMapData - Document map data returned from server
         */
        write: function (docMapData) {
            var me = this;
            this.element.html("");

            var $docMapPanel = new $("<div class='fr-docmap-panel fr-docmap-panel-layout fr-core-widget'/>");
            $docMapPanel.append(me._writeDocumentMapItem(docMapData.DocumentMap, 0));
            me.element.append($docMapPanel);
        },

        _writeDocumentMapItem: function (docMap, level) {
            var me = this;
            var $docMap = new $("<div />");
            if (level !== 0)
                $docMap.css("margin-left", "34px");

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
                        //$docMap.find("[level='" + level + "']").hide();
                        $docMap.find("[level='" + level + "']").slideUpHide();
                        $rightImage.removeClass("fr-docmap-icon-up").addClass("fr-docmap-icon-down");
                    }
                    else {
                        $docMap.find("[level='" + level + "']").slideUpShow();
                        //$docMap.find("[level='" + level + "']").show();
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
