/**
 * @file Contains the toolbar widget.
 *
 */

var forerunner = forerunner || {};
forerunner.ssr = forerunner.ssr || {};
forerunner.ssr.tools = forerunner.ssr.tools || {};
forerunner.ssr.tools.toolbar = forerunner.ssr.tools.toolbar || {};
forerunner.ssr.tools.groups = forerunner.ssr.tools.groups || {};

$(function () {
    // Useful namespaces
    var widgets = forerunner.ssr.constants.widgets;
    var events = forerunner.ssr.constants.events;
    var tb = forerunner.ssr.tools.toolbar;
    var tg = forerunner.ssr.tools.groups;
    var locData = forerunner.localize.getLocData(forerunner.config.forerunnerFolder() + "ReportViewer/loc/ReportViewer");

    /**
     * Toobar widget used by the reportViewer
     *
     * @namespace $.forerunner.toolbar
     * @prop {Object} options - The options for toolbar
     * @prop {Object} options.$reportViewer - The report viewer widget
     * @prop {String} options.toolClass - The top level class for this tool (E.g., fr-toolbar)
     * @example
     * $("#toolbarId").toolbar({
     *  $reportViewer: $viewer,
     *  toolClass: "fr-toolbar"
	 * });
     *
     * Note:
     *  Toolbar can be extended by calling the addTools method defined by {@link $.forerunner.toolBase}
     */
    $.widget(widgets.getFullname(widgets.toolbar), $.forerunner.toolBase, /** @lends $.forerunner.toolbar */ {
        options: {
            $reportViewer: null,
            toolClass: "fr-toolbar"
        },
        _initCallbacks: function () {
            var me = this;

            // Hook up any / all custom events that the report viewer may trigger
            me.options.$reportViewer.on(events.reportViewerSetPageDone(), function (e, data) {
                if (data.renderError === true) {
                    me.enableTools([tb.btnMenu, tb.btnRefresh]);
                    me._clearBtnStates();
                }
                else {
                    $("input.fr-toolbar-reportpage-textbox", me.element).val(data.newPageNum);
                    var maxNumPages = me.options.$reportViewer.reportViewer("getNumPages");

                    me.enableTools(me._viewerButtons(false));
                    me._updateBtnStates(data.newPageNum, maxNumPages);

                    if (data.paramLoaded && data.numOfVisibleParameters === 0)
                        me.disableTools([tb.btnParamarea]);

                    if (data.credentialRequired === false) {
                        me.disableTools([tb.btnCredential]);
                    }
                    
                    //we need to put keyword textbox watermark initialize code here, we call enableTools above it will re-bind each buttons' events
                    //but in watermark plug-in it also bind a focus/blur event to the textbox, enableTools only re-bind the event we defined in 
                    //forerunner-tools.js so need to make sure the blur event from watermark actually work
                    me.element.find(".fr-toolbar-keyword-textbox").watermark(locData.toolbar.search, { useNative: false, className: "fr-param-watermark" });
                }
            });

            me.options.$reportViewer.on(events.reportViewerShowParamArea(), function (e, data) {
                me.enableTools([tb.btnParamarea]);
            });

            me.options.$reportViewer.on(events.reportViewerShowDocMap(), function (e, data) {
                me.disableAllTools();
                me.enableTools([tb.btnDocumentMap, tb.btnMenu, tb.btnReportBack]);
            });

            me.options.$reportViewer.on(events.reportViewerHideDocMap(), function (e, data) {
                me.enableAllTools();
            });

            me.options.$reportViewer.on(events.reportViewerShowNav(), function (e, data) {
                if (data.open) {
                    me.disableAllTools();
                    me.enableTools([tb.btnNav, tb.btnMenu]);
                    me.freezeEnableDisable(true);
                }
                else {
                    me.freezeEnableDisable(false);
                    me.enableAllTools();

                    //update navigation buttons status in toolbar after close navigation panel
                    var maxNumPages = me.options.$reportViewer.reportViewer("getNumPages");
                    me._updateBtnStates(data.newPageNum, maxNumPages);
                }
            });

            me.options.$reportViewer.on(events.reportViewerDrillThrough(), function (e, data) {
                me._leaveCurReport();
                me._checkSubscription();
            });

            me.options.$reportViewer.on(events.reportViewerPreLoadReport(), function (e, data) {
                me._leaveCurReport();
            });

            me.options.$reportViewer.on(events.reportViewerAfterLoadReport(), function (e, data) {
                me._checkSubscription();
            });

            me.options.$reportViewer.on(events.reportViewerChangeReport(), function (e, data) {
                me._leaveCurReport();

                if (data.credentialRequired === true) {
                    me.enableTools([tb.btnCredential]);
                }

                me._checkSubscription();
            });

            me.options.$reportViewer.on(events.reportViewerFindDone(), function (e, data) {
                if (forerunner.device.isTouch()) {
                    //if it's touch device trigger blur event on textbox to remove virtual keyboard
                    me.element.find(".fr-toolbar-keyword-textbox").trigger("blur");
                }
            });

            me.options.$reportViewer.on(events.reportViewerShowCredential(), function (e, data) {
                me.enableTools([tb.btnMenu, tb.btnCredential]);
                //add credential button to the end of the toolbar if report require credential.
            });

            me.options.$reportViewer.on(events.reportViewerResetCredential(), function (e, data) {
                me._clearBtnStates();
                me.disableTools(me._viewerButtons());
                if (data.paramLoaded === false) {
                    me.disableTools([tb.btnParamarea]);
                }
                me.enableTools([tb.btnMenu, tb.btnReportBack, tb.btnCredential]);
            });

            // Hook up the toolbar element events
            //me.enableTools([tb.btnNav, tb.btnRefresh, tb.btnFirstPage, tb.btnPrev, tb.btnNext,
            //                   tb.btnLastPage, tb.btnDocumentMap, tb.btnFind, tb.btnZoom, tg.btnExportDropdown, tb.btnPrint]);
            //me.enableTools([tb.btnMenu, tb.btnReportBack]);
        },
        _init: function () {
            var me = this;
            me._super(); //Invokes the method of the same name from the parent widget

            me.element.html("<div class='" + me.options.toolClass + " fr-core-toolbar fr-core-widget'/>");
           
            me.addTools(1, false, me._viewerButtons());
            if (!me.options.$reportViewer.reportViewer("showSubscriptionUI"))
                me.hideTool(tb.btnEmailSubscription.selectorClass);
            me.addTools(1, false, [tb.btnParamarea]);
            me.enableTools([tb.btnMenu]);
            if (me.options.$reportViewer) {
                me._initCallbacks();
            }

            //trigger window resize event to regulate toolbar buttons visibility
            $(window).resize();
        },
        _viewerButtons: function (allButtons) {
            var listOfButtons = [tb.btnMenu];

            //check button button
            if (allButtons === true || allButtons === undefined) {
                listOfButtons.push(tb.btnReportBack);
            }

            listOfButtons.push(tb.btnCredential, tb.btnNav, tb.btnRefresh, tb.btnDocumentMap, tg.btnExportDropdown, tg.btnVCRGroup, tg.btnFindGroup, tb.btnZoom);

            //remove zoom button on android
            if (forerunner.device.isAndroid() && !forerunner.device.isChrome()) {
                listOfButtons.pop()
            }

            listOfButtons.push(tb.btnPrint, tb.btnEmailSubscription);

            return listOfButtons;
        },
        _updateBtnStates: function (curPage, maxPage) {
            var me = this;

            if (maxPage !== 0) {
                me.element.find(".fr-toolbar-numPages-button").html(maxPage);
                me.element.find(".fr-toolbar-reportpage-textbox").attr({ max: maxPage, min: 1 });
            }
            else {
                me.element.find(".fr-toolbar-numPages-button").html("?");
            }


            if (me.options.$reportViewer.reportViewer("getHasDocMap"))
                me.enableTools([tb.btnDocumentMap]);
            else
                me.disableTools([tb.btnDocumentMap]);

            if (curPage <= 1) {
                me.disableTools([tb.btnPrev, tb.btnFirstPage]);
            }
            else {
                me.enableTools([tb.btnPrev, tb.btnFirstPage]);
            }

            if (curPage >= maxPage && maxPage !== 0) {
                me.disableTools([tb.btnNext, tb.btnLastPage]);
            }
            else {
                if (maxPage === 0)
                    me.disableTools([tb.btnLastPage]);
                else
                    me.enableTools([tb.btnNext, tb.btnLastPage]);
            }
            if (maxPage ===1 )
                me.disableTools([tb.btnNav]);
            else
                me.enableTools([tb.btnNav]);
        },
        _clearBtnStates: function () {
            var me = this;

            me.element.find(".fr-toolbar-keyword-textbox").val("");
            me.element.find(".fr-toolbar-reportpage-textbox").val("");
            me.element.find(".fr-toolbar-numPages-button").html(0);
        },
        _leaveCurReport: function () {
            var me = this;
            me._clearBtnStates();
            me.disableTools(me._viewerButtons(false));
            me.disableTools([tb.btnCredential, tb.btnParamarea]);
            //me.enableTools([tb.btnReportBack]);
        },
        _checkSubscription: function () {
            var me = this;
            if (!me.options.$reportViewer.reportViewer("showSubscriptionUI")) return;

            var permissions = me.options.$reportViewer.reportViewer("getPermissions");
            if (permissions["Create Subscription"] === true) {
                me.showTool(tb.btnEmailSubscription.selectorClass);
            } else {
                me.hideTool(tb.btnEmailSubscription.selectorClass);
            }
        },
        
        _destroy: function () {
        },
        _create: function () {
        },
    });  // $.widget
});  // function()
