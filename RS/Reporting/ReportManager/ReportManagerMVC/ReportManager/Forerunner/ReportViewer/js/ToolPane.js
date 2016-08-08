/**
 * @file Contains the report viewer toolPane widget.
 *
 */

var forerunner = forerunner || {};
forerunner.ssr = forerunner.ssr || {};

$(function () {
    var widgets = forerunner.ssr.constants.widgets;
    var events = forerunner.ssr.constants.events;
    var tp = forerunner.ssr.tools.toolpane;
    var tg = forerunner.ssr.tools.groups;
    var mi = forerunner.ssr.tools.mergedItems;
    //var locData = forerunner.localize.getLocData(forerunner.config.forerunnerFolder() + "ReportViewer/loc/ReportViewer");
    var locData = forerunner.localize;    


    /**
     * ToolPane widget used with the reportViewer
     *
     * @namespace $.forerunner.toolPane
     * @prop {Object} options - The options for toolPane
     * @prop {Object} options.$reportViewer - The report viewer widget
     * @prop {String} options.toolClass - The top level class for this tool (E.g., fr-toolpane)
     * @example
     * $("#toolPaneId").toolPane({
     *  $reportViewer: $viewer,
     *  toolClass: "fr-toolpane"
	 * });
     *
     * Note:
     *  ToolPane can be extended by calling the addTools method defined by {@link $.forerunner.toolBase}
     */
    $.widget(widgets.getFullname(widgets.toolPane), $.forerunner.toolBase, {
        options: {
            dbConfig: {},
            $reportViewer: null,
            $appContainer: null,
            toolClass: "fr-toolpane"
        },
        _initCallbacks: function () {
            var me = this;

            // Hook up any / all custom events that the report viewer may trigger
            me.options.$reportViewer.on(events.reportViewerSetPageDone(), function (e, data) {
                if (data.renderError === true) {
                    me.enableTools([tp.itemRefresh, mi.itemFolders, tg.itemFolderGroup]);
                }
                else {
                    $("input.fr-item-textbox-reportpage", me.element).val(data.newPageNum);
                    var maxNumPages = me.options.$reportViewer.reportViewer("getNumPages");

                    me.enableTools(me._viewerItems(false));
                    me._updateItemStates(data.newPageNum, maxNumPages);

                    if (data.credentialRequired === false) {
                        me.disableTools([tp.itemCredential]);
                    }

                    me.element.find(".fr-item-keyword-textbox").watermark(locData.getLocData().toolbar.search,
                        forerunner.config.getWatermarkConfig());
                }
            });

            me.options.$reportViewer.on(events.reportViewerAfterLoadReport(), function (e, data) {
                me.disableTools([mi.itemProperty]);

                var permissions = me.options.$reportViewer.reportViewer("getPermissions");
                if (permissions["Update Properties"] === true) {
                    me.enableTools([mi.itemProperty]);
                }

                me._checkSubscription();
            });

            me.options.$reportViewer.on(events.reportViewerShowDocMap(), function (e, data) {
                me.disableAllTools();
                me.enableTools([tp.itemDocumentMap]);
            });

            me.options.$reportViewer.on(events.reportViewerHideDocMap(), function (e, data) {
                me.enableAllTools();
            });

            me.options.$reportViewer.on(events.reportViewerShowNav(), function (e, data) {
                if (data.open) {
                    me.disableAllTools();
                    me.enableTools([tp.itemNav]);
                    me.freezeEnableDisable(true);
                }
                else {
                    me.freezeEnableDisable(false);
                    me.enableAllTools();

                    //update navigation buttons status in toolpane after close navigation panel
                    var maxNumPages = me.options.$reportViewer.reportViewer("getNumPages");
                    me._updateItemStates(data.newPageNum, maxNumPages);
                }
            });

            me.options.$reportViewer.on(events.reportViewerDrillThrough(), function (e, data) {
                me._leaveCurReport();
                me._checkSubscription();
            });

            me.options.$reportViewer.on(events.reportViewerPreLoadReport(), function (e, data) {
                me._leaveCurReport();
            });

            me.options.$reportViewer.on(events.reportViewerChangeReport(), function (e, data) {
                me._leaveCurReport();

                if (data.credentialRequired === true) {
                    me.enableTools([tp.itemCredential]);
                }

                me._checkSubscription();
            });

            me.options.$reportViewer.on(events.reportViewerFindDone(), function (e, data) {
                if (forerunner.device.isTouch()) {
                    //if it's touch device trigger blur event on textbox to remove virtual keyboard
                    me.element.find(".fr-item-keyword-textbox").trigger("blur");
                }
            });

            me.options.$reportViewer.on(events.reportViewerShowCredential(), function (e, data) {
                me.enableTools([tp.itemCredential]);
                me.removeHideDisable([tp.itemCredential]);
            });

            me.options.$reportViewer.on(events.reportViewerZoomChange(), function (e, data) {
                me._$itemPercentage.val(data.zoomFactor.toFixed(0));
            });

            me.options.$reportViewer.on(events.reportViewerResetCredential(), function (e, data) {
                me._clearItemStates();
                me.disableTools(me._viewerItems());
                me.enableTools([tp.itemReportBack, tp.itemCredential, mi.itemFolders, tg.itemFolderGroup]);
            });

            me.options.$reportViewer.on(events.reportViewerRefresh(), function (e, data) {
                me._clearItemStates();
            });

                      
        },
        _init: function () {
            var me = this;
            me._super();

            me.element.html("");
            var $toolpane = new $("<div class='" + me.options.toolClass + " fr-core-widget' />");
            $(me.element).append($toolpane);
            
            if (me.options.dbConfig.SeperateDB !== true) {
                forerunner.helper.pushIfNot(tg.itemFolderGroup.tools, tp.itemRecent);                
            }

            me.addTools(1, false, me._viewerItems());

            forerunner.ajax.isFormsAuth(function (isForms) {
                if (!isForms && forerunner.ssr.tools.toolpane.itemLogOff)
                    me.hideTool(forerunner.ssr.tools.toolpane.itemLogOff.selectorClass);
            });


            if (me.options.dbConfig && me.options.dbConfig.UseMobilizerDB === true
                && !me.options.$reportViewer.reportViewer("showSubscriptionUI")) {
                me.hideTool(tp.itemEmailSubscription.selectorClass);
            }

            // Keep the itemPercent for later
            me._$itemPercentage = me.element.find("." + tp.itemPercent.selectorClass);
            var zoomFactor = me.options.$reportViewer.reportViewer("getZoomFactor").toFixed(0);
            me._$itemPercentage.val(zoomFactor);

           
            //me.enableTools([tp.itemReportBack]);
            // Need to add this to work around the iOS7 footer.
            // It has to be added to the scrollable area for it to scroll up.
            // Bottom padding/border or margin won't be rendered in some cases.
            var $spacerdiv = new $("<div />");
            $spacerdiv.attr("style", "height:65px");
            $toolpane.append($spacerdiv);
            if (me.options.$reportViewer) {
                me._initCallbacks();
            }
        },
        _viewerItems: function (allButtons) {
            var me = this;

            var listOfItems = [tg.itemVCRGroup, tg.itemFolderGroup];

            //check back button
            if (allButtons === true || allButtons === undefined) {
                listOfItems.push(tp.itemReportBack);
            }

            listOfItems.push(tp.itemCredential, tp.itemNav, tp.itemRefresh, tp.itemDocumentMap, tp.itemZoomDropDown,
                tg.itemZoomGroup, tp.itemExport, tg.itemExportGroup, tp.itemPrint, tp.itemResponsive);

            if (me.options.dbConfig && me.options.dbConfig.UseMobilizerDB === true) {
                listOfItems.push(tp.itemEmailSubscription);
            }

            //check admin functions
            var userSettings = me.options.$reportViewer.reportViewer("getUserSettings");
            if (userSettings && userSettings.adminUI && userSettings.adminUI === true) {
                listOfItems.push(mi.itemProperty);
            }

            listOfItems.push(tg.itemFindGroup);   

            return listOfItems;
        },
        _updateItemStates: function (curPage, maxPage) {
            var me = this;

            if (maxPage !== 0) {
                me.element.find(".fr-toolbar-numPages-button").html(maxPage);
                me.element.find(".fr-item-textbox-reportpage").attr({ max: maxPage, min: 1 });
            }
            else {
                me.element.find(".fr-toolbar-numPages-button").html("?");
            }
            
            if (me.options.$reportViewer.reportViewer("getHasDocMap")) {
                me.enableTools([tp.itemDocumentMap]);
                me.removeHideDisable([tp.itemDocumentMap]);
            }
            else {
                me.disableTools([tp.itemDocumentMap]);
            }

            if (curPage <= 1) {
                me.disableTools([tp.itemPrev, tp.itemFirstPage]);
            }
            else {
                me.enableTools([tp.itemPrev, tp.itemFirstPage]);
            }

            if (curPage >= maxPage && maxPage !== 0) {
                me.disableTools([tp.itemNext, tp.itemLastPage]);
            }

           
            if (maxPage === 1) {
                me.disableTools([tp.itemNav]);
            }
            else {
                me.enableTools([tp.itemNav]);
                me.removeHideDisable([tp.itemNav]);
            }
         
            
        },
        _clearItemStates: function () {
            var me = this;
            me.element.find(".fr-item-keyword-textbox").val("");
            me.element.find(".fr-item-textbox-reportpage").val("");
            me.element.find(".fr-toolbar-numPages-button").html(0);
        },
        _leaveCurReport: function () {
            var me = this;
            me._clearItemStates();
            me.disableTools(me._viewerItems(false));
            me.disableTools([tp.itemCredential]);
            //me.enableTools([tp.itemReportBack]);
        },
        _checkSubscription: function () {
            var me = this;

            if (me.options.dbConfig && me.options.dbConfig.UseMobilizerDB === false
                || !me.options.$reportViewer.reportViewer("showSubscriptionUI")) {
                return;
            }

            var permissions = me.options.$reportViewer.reportViewer("getPermissions");
            if (permissions["Create Subscription"] === true) {
                me.showTool(tp.itemEmailSubscription.selectorClass);
            } else {
                me.hideTool(tp.itemEmailSubscription.selectorClass);
            }
        },
    });  // $.widget
});  // function()
