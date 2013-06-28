// Assign or create the single globally scoped variable
var forerunner = forerunner || {};

// Forerunner SQL Server Reports
forerunner.ssr = forerunner.ssr || {};

$(function () {
    var messages = forerunner.ssr.constants.messages;
    var navigateType = forerunner.ssr.constants.navigateType;

    // The Floating header object holds pointers to the tablix and its row and col header objects
    function FloatingHeader($Tablix, $RowHeader, $ColHeader) {
        this.$Tablix = $Tablix;
        this.$RowHeader = $RowHeader;
        this.$ColHeader = $ColHeader;
    }

    // The page object holds the data for each page
    function ReportPage($Container, ReportObj) {
        this.ReportObj = ReportObj;
        this.$Container = $Container;
        this.IsRendered = false;
    }

    // report viewer widget
    $.widget("Forerunner.reportViewer", {
        // Default options
        options: {
            ReportServerURL: null,
            ReportViewerAPI: null,
            ReportPath: null,
            PageNum: 1,
            PingInterval: 300000,
            //ParameterDiv: null,
            ToolbarHeight: 0,
            SetPageDone: null,
            PageNav: null,
            ParamArea: null
        },

        _destroy: function () {
        },

        // Constructor
        _create: function () {
            var me = this;

            setInterval(function () { me.SessionPing(); }, this.options.PingInterval);

            // ReportState
            me.actionHistory = [];
            me.curPage = 0;
            me.pages = {};
            me.sessionID = "";
            me.numPages = 0;
            me.lock = false;
            me.$reportContainer = new $("<DIV class='report-container'/>");
            me.$reportAreaContainer = null;
            me.$loadingIndicator = new $("<div class='loading-indicator'></div>").text(messages.loading);
            me.floatingHeaders = [];
            me.paramLoaded = false;
            me.scrollTop = 0;
            me.scrollLeft = 0;
            me.loadLock = 0;
            me.finding = false;
            me.findStart = null;
            me.hasDocMap = false;
            me.togglePageNum = 0;
            me.findKeyword = null;
            me.element.append(me.$loadingIndicator);

            $(window).scroll(function () { me.UpdateTableHeaders(me); });

            //Log in screen if needed

            //load the report Page requested
            me.element.append(me.$reportContainer);
            me.AddLoadingIndicator();
            me.LoadParameters(me.options.PageNum);
        },
        getCurPage: function () {
            var me = this;
            return me.curPage;
        },
        getNumPages: function () {
            var me = this;
            return me.numPages;
        },
        getReportViewerAPI: function () {
            var me = this;
            return me.options.ReportViewerAPI;
        },
        getReportServerURL: function () {
            var me = this;
            return me.options.ReportServerURL;
        },
        getReportPath: function () {
            var me = this;
            return me.options.ReportPath;
        },
        getSessionID: function () {
            var me = this;
            return me.sessionID;
        },
        getHasDocMap: function () {
            var me = this;
            return me.hasDocMap;
        },
        SetColHeaderOffset: function ($tablix, $colHeader) {
            //Update floating column headers
            var me = this;
            if ($colHeader == null)
                return;

            var offset = $tablix.offset();
            var scrollLeft = $(window).scrollLeft();
            if ((scrollLeft > offset.left) && (scrollLeft < offset.left + $tablix.width())) {
                //$colHeader.css("top", $tablix.offset.top);
                $colHeader.css("left", Math.min(scrollLeft - offset.left, $tablix.width() - $colHeader.width()) + "px");
                $colHeader.fadeIn('fast');
            }
            else {
                $colHeader.hide();

            }
        },
        SetRowHeaderOffset: function ($tablix, $rowHeader) {
            //  Update floating row headers
            var me = this;
            if ($rowHeader == null)
                return;

            var offset = $tablix.offset();
            var scrollTop = $(window).scrollTop();
            if ((scrollTop > offset.top) && (scrollTop < offset.top + $tablix.height())) {
                $rowHeader.css("top", (Math.min((scrollTop - offset.top), ($tablix.height() - $rowHeader.height())) + me.options.ToolbarHeight) + "px");
                $rowHeader.fadeIn('fast');
            }
            else {
                $rowHeader.hide();
            }
        },
        AddLoadingIndicator: function () {
            var me = this;
           
            me.loadLock = 1;
            setTimeout(function () { me.showLoadingIndictator(me); }, 500);
        },
        showLoadingIndictator: function (me) {
            if (me.loadLock == 1) {
                //212 is static value for loading indicator width
                var scrollLeft = me.$reportContainer.width() - 212;

                me.$loadingIndicator.css("top", me.$reportContainer.scrollTop() + 100 + 'px')
                    .css("left", scrollLeft > 0 ? scrollLeft / 2 : 0 + 'px');

                me.$reportContainer.css({ opacity: 0.5 });
                me.$loadingIndicator.show();
            }
        },
        RemoveLoadingIndicator: function () {
            var me = this;
            me.loadLock = 0;
            me.$reportContainer.css({ opacity: 1 });
            me.$loadingIndicator.hide();
        },
        SetPage: function (PageNum) {
            //  Load a new page into the screen and udpate the toolbar
            var me = this;

            if (!me.pages[PageNum].IsRendered)
                me.RenderPage(PageNum);
            if (me.$reportAreaContainer == null) {
                me.$reportAreaContainer = $("<Div/>");
                me.$reportAreaContainer.addClass("report-area-container");
                me.$reportContainer.append(me.$reportAreaContainer);
                me.$reportAreaContainer.append(me.pages[PageNum].$Container);
                me.touchNav();
                me.pages[PageNum].$Container.fadeIn();
            }
            else {
                me.$reportAreaContainer.find(".Page").detach();
                me.$reportAreaContainer.append(me.pages[PageNum].$Container);

                if (me.curPage != null && me.curPage > PageNum) {
                    me.pages[PageNum].$Container.show();
                } else {
                    me.pages[PageNum].$Container.show();
                }

            }
                       
            me.curPage = PageNum;

            // Trigger the change page event to allow any widget (E.g., toolbar) to update their view
            if (me.options.SetPageDone != null) me._trigger("SetPageDone");
            me._trigger('changepage', null, { newPageNum: PageNum, paramLoaded: me.paramLoaded });

            $(window).scrollLeft(me.scrollLeft);
            $(window).scrollTop(me.scrollTop);
            me.lock = 0;
        },
        touchNav: function () {
            // Touch Events
            var me = this;
            $(me.element).swipe({
                fallbackToMouseEvents: false,
                allowPageScroll: "auto",
                swipe: function (e, dir) {
                    if (dir == 'left' || dir == 'up')
                        me.NavToPage((me.curPage + 1));
                    else
                        me.NavToPage((me.curPage - 1));
                },
                swipeStatus: function (event, phase, direction, distance) {
                    if (phase == "start")
                        me.HideTableHeaders();
                },
                tap: function (event, target) {
                    $(target).trigger('click');
                },
               longTapThreshold: 1000,
            });
        },
        RefreshReport: function () {
            // Remove all cached data on the report and re-run
            var me = this;
            me.sessionID = "";
            if (me.paramLoaded == true) {
                var $paramArea = me.options.ParamArea;
                me.LoadPage(1, false, null, $paramArea.reportParameter("getParamsList"),true);
            }
            else {
                me.LoadPage(1, false,null,null,true);
            }
        },
        NavToPage: function (newPageNum) {
            var me = this;
            if (newPageNum == me.curPage || me.lock == 1)
                return;

            me.scrollLeft = 0;
            me.scrollTop = 0;

            if (newPageNum > me.numPages) {
                newPageNum = 1;
            }
            if (newPageNum < 1) {
                newPageNum = me.numPages;
            }
            if (newPageNum != me.curPage) {
                if (me.lock == 0) {
                    me.lock = 1;
                    me.LoadPage(newPageNum, false);
                }
            }
        },
        ShowDocMap: function () {
            if ($(".DocMapPanel").length > 0)
                $(".DocMapPanel").animate({ height: 'toggle' }, 100, function () {
                    $(".DocMapBorder").css("height", document.body.clientHeight - $(".DocMapPanel").offset().top);
                });
        },
        CachePages: function (initPage) {
            var me = this;
             
            var low = initPage - 1;
            var high = initPage + 1;
            if (low < 1) low = 1;
            if (high > me.numPages) high = me.numPages;

            for (var i = low; i <= high; i++)
                if (me.pages[i] == null)
                    if (i != initPage)
                        me.LoadPage(i, true);

        },
        Back: function () {
            var me = this;
            var action = me.actionHistory.pop();
            if (action != undefined) {
                
                me.options.ReportPath = action.ReportPath;
                me.sessionID = action.SessionID;
                me.scrollLeft = action.ScrollLeft;
                me.scrollTop = action.ScrollTop;
                
                me._trigger('drillback');
                me.RemoveParameters();
                me.LoadPage(action.CurrentPage, false,null,null,true);
            }
            else {
                me._trigger('back', null, { path: me.options.ReportPath });
            }
        },
        ShowNav: function () {
            var me = this;
            if (me.options.PageNav != null){
                me.options.PageNav.pagenav('showNav');
            }
        },
        flushCache: function () {
            var me = this;
            me.pages = {};
            if (me.options.PageNav != null)
                me.options.PageNav.pagenav('reset');
        },
        _PrepareAction: function () {
            var me = this;

            if (me.togglePageNum != me.curPage || me.togglePageNum  == 0) {
                $.ajax({
                    url: me.options.ReportViewerAPI + "/GetReportJSON/",
                    data: {
                        ReportServerURL: me.options.ReportServerURL,
                        ReportPath: me.options.ReportPath,
                        SessionID: me.sessionID,
                        PageNumber: me.curPage,
                        ParameterList: ""
                    },
                    dataType: 'json',
                    async: false,
                    success: function (data) {
                        me.togglePageNum = me.curPage;
                    },
                    fail: function () { alert("Fail"); }
                });
            }
        },
        Sort: function (direction, id) {
            //Go the other dirction from current
            var me = this;
            var newDir;
            var sortDirection = forerunner.ssr.constants.sortDirection;

            if (direction == sortDirection.asc)
                newDir = sortDirection.desc;
            else
                newDir = sortDirection.asc;

            $.getJSON(me.options.ReportViewerAPI + "/SortReport/", {
                ReportServerURL: me.options.ReportServerURL,
                SessionID: me.sessionID,
                SortItem: id,
                Direction: newDir
            }).done(function (data) {
                me.numPages = data.NumPages;
                me.LoadPage((data.NewPage), false,null,null,true );
            })
            .fail(function () { console.log("error"); me.RemoveLoadingIndicator(); });
        },
        ToggleItem: function (toggleID) {
            var me = this;
            me.ToggleID = toggleID;
            me._PrepareAction();

            $.getJSON(me.options.ReportViewerAPI + "/NavigateTo/", {
                NavType: navigateType.toggle,
                ReportServerURL: me.options.ReportServerURL,
                SessionID: me.sessionID,
                UniqueID: toggleID
            }).done(function (data) {
                if (data.Result == true) {
                    me.scrollLeft = $(window).scrollLeft();
                    me.scrollTop = $(window).scrollTop();

                    me.pages[me.curPage] = null;
                    me.LoadPage(me.curPage, false);
                }
            })
           .fail(function () { console.log("error"); me.RemoveLoadingIndicator(); });
        },
        NavigateBookmark: function (bookmarkID) {
            var me = this;
            me._PrepareAction();
            $.getJSON(me.options.ReportViewerAPI + "/NavigateTo/", {
                NavType: navigateType.bookmark,
                ReportServerURL: me.options.ReportServerURL,
                SessionID: me.sessionID,
                UniqueID: bookmarkID
            }).done(function (data) {
                if (data.NewPage == me.curPage) {
                    me.NavToLink(bookmarkID);
                } else {
                    me.BackupCurPage();
                    me.LoadPage(data.NewPage, false, bookmarkID);
                }
            })
           .fail(function () { console.log("error"); me.RemoveLoadingIndicator(); });
        },
        NavigateDrillthrough: function (drillthroughID) {
            var me = this;
            me._PrepareAction();
            $.getJSON(me.options.ReportViewerAPI + "/NavigateTo/", {
                NavType: navigateType.drillThrough,
                ReportServerURL: me.options.ReportServerURL,
                SessionID: me.sessionID,
                UniqueID: drillthroughID
            }).done(function (data) {
                me.BackupCurPage();
                if (data.Exception != null)
                    me.$reportAreaContainer.find(".Page").reportRender("WriteError", data);
                else {
                    me.sessionID = data.SessionID;
                    me.options.ReportPath = data.ReportPath;
                    
                    if (data.ParametersRequired) {
                        me.$reportAreaContainer.find(".Page").detach();
                        me.SetScrollLocation(0, 0);
                        me.ShowParameters(1, data.Parameters);
                    }
                    else {
                        me.SetScrollLocation(0, 0);
                        me.LoadPage(1, false, null, null, true);
                    }
                }

            })
           .fail(function () { console.log("error"); me.RemoveLoadingIndicator(); });
        },
        NavigateDocumentMap: function (docMapID) {
            var me = this;
            $.getJSON(me.options.ReportViewerAPI + "/NavigateTo/", {
                NavType: navigateType.docMap,
                ReportServerURL: me.options.ReportServerURL,
                SessionID: me.sessionID,
                UniqueID: docMapID
            }).done(function (data) {
                me.BackupCurPage();
                me.LoadPage(data.NewPage, false, null);
            })
           .fail(function () { console.log("error"); me.RemoveLoadingIndicator(); });
        },
        BackupCurPage: function () {
            var me = this;
            me.actionHistory.push({ ReportPath: me.options.ReportPath, SessionID: me.sessionID, CurrentPage: me.curPage, ScrollTop: $(window).scrollTop(), ScrollLeft: $(window).scrollLeft() });
        },
        SetScrollLocation: function (top, left) {
            var me = this;
            me.scrollLeft = left;
            me.scrollTop = top;
        },
        Find: function (keyword,startPage, endPage) {
            var me = this;
            if (keyword == '') return;

            if (me.findKeyword == null || me.findKeyword != keyword) { me.findKeyword = keyword; me.findStart = null; }

            if (startPage == null) startPage = me.getCurPage();
            if (endPage == null) endPage = me.getNumPages();

            if (me.findStart == null) me.findStart = startPage;

            $.getJSON(me.options.ReportViewerAPI + "/FindString/", {
                ReportServerURL: me.options.ReportServerURL,
                SessionID: me.sessionID,
                StartPage: startPage,
                EndPage: endPage,
                FindValue: keyword
            }).done(function (data) {
                if (data.NewPage != 0) {
                    me.finding = true;
                    if (data.NewPage != me.curPage) {
                        me.options.SetPageDone = function () { me.SetFindHighlight(keyword); };
                        me.pages[data.NewPage] = null;
                        me.LoadPage(data.NewPage, false);
                    } else {
                        me.SetFindHighlight(keyword);
                    }
                }
                else {
                    if (me.finding == true) {
                        alert(messages.completeFind);
                        me.ResetFind();
                    }
                    else
                        alert(messages.keyNotFound);
                }
            })
          .fail(function () { console.log("error"); me.RemoveLoadingIndicator(); });
        },
        FindNext: function (keyword) {
            var me = this;
            $(".Find-Keyword").filter('.Find-Highlight').first().removeClass("Find-Highlight");

            var $NextWord = $(".Find-Keyword").filter('.Unread').first();
            if ($NextWord.length > 0) {
                $NextWord.removeClass("Unread").addClass("Find-Highlight").addClass("Read");
                $(document).scrollTop($NextWord.offset().top - 100);
            }
            else {
                if (me.getNumPages() == 1) {
                    alert(messages.completeFind);
                    me.ResetFind();
                    return;
                }

                if (me.getCurPage() + 1 <= me.getNumPages())
                    me.Find(keyword, me.getCurPage() + 1);
                else if (me.findStart > 1)
                    me.Find(keyword, 1, me.findStart - 1);
                else {
                    alert(messages.completeFind);
                    me.ResetFind();
                }
            }
        },
        SetFindHighlight: function (keyword) {
            var me = this;
            $(me).clearHighLightWord();
            me.$reportContainer.highLightWord(keyword);

            //Highlight the first match.
            var $item = $(".Find-Keyword").filter('.Unread').first();
            $item.removeClass("Unread").addClass("Find-Highlight").addClass("Read");

            $(document).scrollTop($item.offset().top - 100);
        },
        ResetFind: function () {
            var me = this;
            me.finding = false;
            me.findStart = null;
            me.findKeyword = null;
        },
        ShowExport: function () {
            if ($(".Export-Panel").is(":hidden")) {
                var $Export = $(".fr-button-export").filter(":visible");
                $(".Export-Panel").css("left", $Export.offset().left);
            }
            $(".Export-Panel").toggle();
        },
        Export: function (exportType) {
            var me = this;
            $(".Export-Panel").toggle();
            var url = me.options.ReportViewerAPI + "/ExportReport/?ReportServerURL=" + me.getReportServerURL() + "&ReportPath=" + me.getReportPath() + "&SessionID=" + me.getSessionID() + "&ParameterList=&ExportType=" + exportType;
            window.open(url);
        },

        //Page Loading
        LoadParameters: function (pageNum) {
            var me = this;
            $.getJSON(me.options.ReportViewerAPI + "/GetParameterJSON/", {
                ReportServerURL: me.options.ReportServerURL,
                ReportPath: me.options.ReportPath
            })
           .done(function (data) {
               me.AddLoadingIndicator();
               me.ShowParameters(pageNum, data);
           })
           .fail(function () {
               console.log("error");
               me.RemoveLoadingIndicator();
           });
        },
        ShowParameters: function (pageNum, data) {
            var me = this;
            if (data.Type == "Parameters") {
                me.RemoveParameters();
               
                var $ParamArea = me.options.ParamArea;
                if ($ParamArea != null) {
                    me._trigger('showparamarea');
                    $ParamArea.reportParameter("writeParameterPanel", data, me, pageNum, false);
                    me.paramLoaded = true;
                }
            }
            else if (data.Exception != null) {
                me.$reportContainer.reportRender({ ReportViewer: this });
                me.$reportContainer.reportRender("WriteError", data);
                me.RemoveLoadingIndicator();
            }
            else {
                me.LoadPage(pageNum, false);
            }
        },
        RemoveParameters: function () {
            var me = this;
            if (me.paramLoaded == true) {
                var $ParamArea = me.options.ParamArea;
                if ($ParamArea != null) {
                    $ParamArea.reportParameter("removeParameter");
                    me.paramLoaded = false;
                }
            }
        },
        LoadPage: function (newPageNum, loadOnly, bookmarkID, paramList, flushCache) {
            var me = this;

            if (flushCache != null && flushCache)
                me.flushCache();

            if (me.pages[newPageNum] != null)
                if (me.pages[newPageNum].$Container != null) {
                    if (!loadOnly) {
                        me.SetPage(newPageNum);
                        me.CachePages(newPageNum);
                    }
                    return;
                }
            if (paramList == null) paramList = "";

            if (!loadOnly) {
                me.AddLoadingIndicator();
            }
            me.togglePageNum = newPageNum;
            me.lock = 1;
            $.getJSON(me.options.ReportViewerAPI + "/GetReportJSON/", {
                ReportServerURL: me.options.ReportServerURL,
                ReportPath: me.options.ReportPath,
                SessionID: me.sessionID,
                PageNumber: newPageNum,
                ParameterList: paramList
            })
            .done(function (data) {
                me.WritePage(data, newPageNum, loadOnly);
                me.lock = 0;
                if (bookmarkID != null)
                    me.NavToLink(bookmarkID);

                if (!loadOnly) me.CachePages(newPageNum);
            })
            .fail(function () { console.log("error"); me.RemoveLoadingIndicator(); });
        },
        WritePage: function (data, newPageNum, loadOnly) {
            var me = this;
            var $Report = $("<Div/>");
            $Report.addClass("Page");

            //Error, need to handle this better
            if (data == null) return;

            $Report.reportRender({ ReportViewer: me });

            if (me.pages[newPageNum] == null)
                me.pages[newPageNum] = new ReportPage($Report, data);
            else {
                me.pages[newPageNum].$Container = $Report;
                me.pages[newPageNum].ReportObj = data;
            }

            if (data.SessionID == null)
                me.sessionID = "";
            else
                me.sessionID = data.SessionID;
            if (data.NumPages == null)
                me.numPages = 0;
            else
                me.numPages = data.NumPages;
       
            if (!loadOnly) {
                me.RenderPage(newPageNum);
                me.RemoveLoadingIndicator();
                me.SetPage(newPageNum);
            }
        },
        RenderPage: function (pageNum) {
            //Write Style
            var me = this;
            if (me.pages[pageNum] != null && me.pages[pageNum].IsRendered == true)
                return;

            if (me.pages[pageNum].ReportObj.Exception == null) {
                if (me.$reportContainer.find(".DocMapPanel").length == 0 && me.pages[pageNum].ReportObj.Report.DocumentMap != null) {
                    me.hasDocMap = true;
                    me.$reportContainer.reportDocumentMap({ reportViewer: me });
                    me.$reportContainer.reportDocumentMap("writeDocumentMap", pageNum);
                }

                me.pages[pageNum].$Container.reportRender("Render", me.pages[pageNum].ReportObj);
            }
            else
                me.pages[pageNum].$Container.reportRender("WriteError", me.pages[pageNum].ReportObj);
            me.pages[pageNum].IsRendered = true;
        },
                
        SessionPing: function () {
            // Ping each report so that the seesion does not expire on the report server
            var me = this;
            if (me.sessionID != null && me.sessionID != "")
                $.getJSON(me.options.ReportViewerAPI + "/PingSession/", {
                    ReportServerURL: me.options.ReportServerURL,
                    SessionID: me.sessionID
                })
                .done(function (data) {
                    if (data.Status == "Fail") {
                        me.sessionID = "";
                        alert(messages.sessionExpired);
                    }
                })
                .fail(function () { console.log("error"); });

        },
        UpdateTableHeaders: function (me) {
            // Update the floating headers in this viewer
            // Update the toolbar

            $.each(me.floatingHeaders, function (Index, Obj) {
                me.SetRowHeaderOffset(Obj.$Tablix, Obj.$RowHeader);
                me.SetColHeaderOffset(Obj.$Tablix, Obj.$ColHeader);
            });
        },
        HideTableHeaders: function () {
            // On a touch device hide the headers during a scroll if possible
            var me = this;
            $.each(me.floatingHeaders, function (Index, Obj) {
                if (Obj.$RowHeader != null) Obj.$RowHeader.hide();
                if (Obj.$ColHeader != null) Obj.$ColHeader.hide();
            });
            if (me.$FloatingToolbar != null) me.$FloatingToolbar.hide();
        },
        NavToLink: function (ElementID) {
            $(document).scrollTop($("#" + ElementID).offset().top - 85);
        },
        StopDefaultEvent: function (e) {
            //IE
            if (window.ActiveXObject)
                window.event.returnValue = false;
            else {
                e.preventDefault();
                e.stopPropagation();
            }
        },
        _getHeight: function ($Obj) {
            var height;

            var $copiedElem = $Obj.clone()
                                .css({
                                    visibility: "hidden"
                                });

            //Image size cannot change so do not load.
            //$copiedElem.find('img').removeAttr('src');
            //$copiedElem.find('img').removeAttr('onload');
            //$copiedElem.find('img').removeAttr('alt');
            $copiedElem.find('img').remove();

            $("body").append($copiedElem);
            height = $copiedElem.height() + "px";

            $copiedElem.remove();

            //Return in mm
            return this._convertToMM(height);

        },
        _convertToMM: function (convertFrom) {

            if (convertFrom == null)
                return 0;

            var unit = convertFrom.match(/\D+$/);  // get the existing unit
            var value = convertFrom.match(/\d+/);  // get the numeric component

            if (unit.length == 1) unit = unit[0];
            if (value.length == 1) value = value[0];

            switch (unit) {
                case "px":
                    return value / 3.78;
                case "pt":
                    return value * 0.352777777778;
                case "in":
                    return value * 25.4;
                case "mm":
                    return value;
                case "cm":
                    return value * 10;
                case "em":
                    return value * 4.2175176;
            }

            //This is an error
            return value;
        },
    });  // $.widget
});   // $(function



jQuery.fn.extend({
    slideRightShow: function (delay) {
        return this.each(function () {
            $(this).show('slide', { direction: 'right', easing: 'easeInCubic' }, delay);
        });
    },
    slideLeftHide: function (delay) {
        return this.each(function () {
            $(this).hide('slide', { direction: 'left', easing: 'easeOutCubic' }, delay);
        });
    },
    slideRightHide: function (delay) {
        return this.each(function () {
            $(this).hide('slide', { direction: 'right', easing: 'easeOutCubic' }, delay);
        });
    },
    slideLeftShow: function (delay) {
        return this.each(function () {
            $(this).show('slide', { direction: 'left', easing: 'easeInCubic' }, delay);
        });
    },
    highLightWord: function (keyword) {
        if (keyword == undefined || keyword == "") {
            return;
        }
        else {
            $(this).each(function () {
                var elt = $(this).get(0);
                elt.normalize();
                $.each($.makeArray(elt.childNodes), function (i, node) {
                    //nodetype=3 : text node
                    if (node.nodeType == 3) {
                        var searchnode = node;
                        var pos = searchnode.data.toUpperCase().indexOf(keyword.toUpperCase());

                        while (pos < searchnode.data.length) {
                            if (pos >= 0) {
                                var spannode = document.createElement('span');
                                spannode.className = 'Find-Keyword Unread';
                                var middlebit = searchnode.splitText(pos);
                                var searchnode = middlebit.splitText(keyword.length);
                                var middleclone = middlebit.cloneNode(true);
                                spannode.appendChild(middleclone);
                                searchnode.parentNode.replaceChild(spannode, middlebit);
                            }
                            else {
                                break;
                            }

                            pos = searchnode.data.toUpperCase().indexOf(keyword.toUpperCase());
                        }
                    }
                    else {
                        $(node).highLightWord(keyword);
                    }
                });
            });
        }
        return $(this);
    },
    clearHighLightWord: function () {
        $(".Find-Keyword").each(function () {
            var text = document.createTextNode($(this).text());
            $(this).replaceWith($(text));
        });
    }
});
