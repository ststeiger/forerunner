$(function () {

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
            ReportServer: null,
            ReportViewerAPI: null,
            ReportPath: null,
            HasToolbar: true,
            PageNum: 1,
            UID: null,
            ToolbarUID: null,
            NavUID: null,
            toolbarOffset: 0,
            PingInterval: 300000,
            ParameterDiv: null
        },

        // Constructor
        _create: function () {
            var me = this;
            var $Table = new $("<table class='top-level-report-table'/>");
            var $Row = new $("<TR/>");
            var $Cell;
            var $FloatingToolbar;

            setInterval(function () { me.SessionPing(); }, this.options.PingInterval);

            // ReportState
            me.ActionHistory = [];
            me.$ReportOuterDiv = $("#" + me.options.UID);
            me.CurPage = 0;
            me.Pages = new Object();
            me.ReportServerURL = this.options.ReportServer;
            me.ReportViewerAPI = this.options.ReportViewerAPI
            me.FloatingToolbarHeight;
            me.$FloatingToolbar;
            me.SessionID = "";
            me.$PageContainer = $Row;
            me.$ReportAreaContainer;
            me.$DocumentMapContainer;
            me.ToolbarHeight = this.options.toolbarOffset;
            me.HasToolbar = this.options.HasToolbar;

            me.NumPages = 0;
            me.Lock = false;
            me.$ReportContainer;
            me.$LoadingIndicator = new $("<div id='loadIndicator_" + me.options.UID + "' class='loading-indicator'></div>").text("Report loading...");
            me.FloatingHeaders = [];
            me.$PageNav;
            me.$Slider;
            me.$Carousel;
            me.ToolbarHeight;
            me.CreateNav = false;
            me.ParamLoaded = false;
            me.ScrollTop = 0;
            me.ScrollLeft = 0;
           
            if (me.options.NavUID != null) {
                me.$PageNav = $("#" + me.options.NavUID);
                me.$PageNav.css("display", "none");
            }

            if (me.HasToolbar) {
                var $tb = me.GetToolbar(me.options.UID);
                if (me.ToolbarHeight == 0)
                    me.ToolbarHeight = me._GetHeight($tb) * 3.78;  //convert to px

                if (me.options.ToolbarUID == null) {
                    $Row = new $("<TR/>");
                    $Cell = new $("<TD/>");
                    $Cell.append($tb);
                    $Row.append($Cell);
                    $Row.addClass('inlinetoolbar', 0, 0, null);
                    $FloatingToolbar = $Row.clone(true, true).css({ display: "none", position: "absolute", top: "0px", left: "0px" });
                    me.$FloatingToolbar = $FloatingToolbar;
                    $Table.append($Row);
                    $Table.append($FloatingToolbar);
                } else {
                    $Container = $('#' + me.options.ToolbarUID);
                    $Container.append($tb);                    
                }
            }

            $(window).scroll(function () { me.UpdateTableHeaders(me) });

            //Log in screen if needed

            //load the report Page requested  
            $Table.append(me.$PageContainer);
            me.element.append($Table);
            me.element.addClass("report-container");
            me.$ReportContainer = me.element;
            me.AddLoadingIndicator();
            me.$ReportOuterDiv.append(me.$ReportContainer);
            me.LoadParameters(me.options.PageNum);
        },

        SetColHeaderOffset: function ($Tablix, $ColHeader) {
            //Update floating column headers
            var me = this;
            if ($ColHeader == null)
                return;

            offset = $Tablix.offset();
            scrollLeft = $(window).scrollLeft();    
            if ((scrollLeft > offset.left) && (scrollLeft < offset.left + $Tablix.width())) {                
                $ColHeader.css("left", Math.min(scrollLeft - offset.left, $Tablix.width() - $ColHeader.width()) + "px");
                $ColHeader.fadeIn('fast');
            }
            else {
                $ColHeader.css("display", "none");
        
            }
        },        
        SetRowHeaderOffset: function ($Tablix, $RowHeader) {
            //  Update floating row headers
            var me = this;
            if ($RowHeader == null)
                return;

            toolbarOffset = 0;

            // Handle toolbar special            
            toolbarOffset = me.ToolbarHeight;
            if ($RowHeader == me.$FloatingToolbar)
                toolbarOffset = 0;

            offset = $Tablix.offset();
            scrollTop = $(window).scrollTop();
            if ((scrollTop > offset.top - toolbarOffset) && (scrollTop < offset.top + $Tablix.height())) {        
                $RowHeader.css("top", Math.min((scrollTop - offset.top) + toolbarOffset, ($Tablix.height() - $RowHeader.height()) + toolbarOffset) + "px");
                $RowHeader.fadeIn('fast');
            }
            else {
                $RowHeader.css("display", "none");
            }
        },
        AddLoadingIndicator: function () {
            var me = this;
            me.$ReportContainer.append(me.$LoadingIndicator);
        },
        RemoveLoadingIndicator: function () {
            var me = this;
            me.$LoadingIndicator.detach();
        },
        SetPage: function (NewPageNum, OldPage) {
            //  Load a new page into the screen and udpate the toolbar
            var me = this;
 
            if (!me.Pages[NewPageNum].IsRendered)
                me.RenderPage(NewPageNum);
            if (me.$ReportAreaContainer == null) {
                me.$ReportAreaContainer = $("<Div/>");
                me.$ReportAreaContainer.attr("ID", "ReportArea");
                me.$PageContainer.append(me.$ReportAreaContainer);
                me.$ReportAreaContainer.append(me.Pages[NewPageNum].$Container);
                me.touchNav();
                me.Pages[NewPageNum].$Container.fadeIn();
            }
            else {
                //if (OldPage != null)
                //    OldPage.$Container.detach();

                me.$ReportAreaContainer.find("#Page").detach();
                me.$ReportAreaContainer.append(me.Pages[NewPageNum].$Container);
        
                //me.Pages[NewPageNum].$Container.hide();
                if (me.CurPage != null && me.CurPage > NewPageNum) {
                    //me.Pages[NewPageNum].$Container.slideLeftShow(1500);
                    me.Pages[NewPageNum].$Container.show();
                } else {
                    me.Pages[NewPageNum].$Container.show();
                    //me.Pages[NewPageNum].$Container.slideRightShow(1500);
                }
        
            }
            me.Pages[NewPageNum] = null;
            me.CurPage = NewPageNum;
            $("input." + me.options.UID).each(function () { $(this).val(NewPageNum); });
    
            $(window).scrollLeft(me.ScrollLeft);
            $(window).scrollTop(me.ScrollTop);
            me.Lock = 0;
        },
        touchNav: function () {
            // Touch Events
            var me = this;
            $(document).swipe({
                fallbackToMouseEvents: false,
                allowPageScroll: "auto",
                swipe: function (e, dir) {
                    if (dir == 'left' || dir == 'up' ) 
                        me.NavToPage((me.CurPage + 1));
                    else 
                        me.NavToPage((me.CurPage - 1));            
                },
                swipeStatus: function (event, phase, direction, distance) {
                    if (phase == "start")
                        me.HideTableHeaders();
                },
                tap: function (event, target) {
                    $(target).trigger('click');
                },
                longTap: function (event, target) {
                    if (me.$Slider === undefined || !me.$Slider.is(":visible")) {
                        me.ShowNav();
                    }
                },
                doubleTap: function (event, target) {
                    if (me.$Slider !== undefined && me.$Slider.is(":visible") && $(target).is(me.$Slider)) {
                        me.ShowNav();
                    }
                },
                longTapThreshold: 1000,
            });
        },
        RefreshReport: function () {
            // Remove all cached data on the report and re-run
            var me = this;
            Page = me.Pages[me.CurPage];
            me.SessionID = "";
            me.Pages = new Object();
            me.LoadPage(1, Page, false);
        },
        NavToPage: function (NewPageNum) {    
            var me = this;
            if (NewPageNum == me.CurPage || me.Lock == 1)
                return;

            me.ScrollLeft = 0;
            me.ScrollTop = 0;

            if (NewPageNum > me.NumPages) {
                NewPageNum = 1;
            }
            if (NewPageNum < 1) {
                NewPageNum = me.NumPages;
            }
            if (NewPageNum != me.CurPage) {
                if (me.Lock == 0) {
                    me.Lock = 1;
                    me.LoadPage(NewPageNum, me.Pages[me.CurPage], false);
                    if (me.$Carousel != null)
                        me.$Carousel.select(NewPageNum - 1, 1);
                }
            }
        },
        ShowParms: function () {
            var me = this;
            if (me.ParamLoaded == true)
                $("#ParameterContainer").animate({ height: 'toggle' }, 500);
        },
        CachePages: function (InitPage) {
            var me = this;

            // TODO [jasonc]
            // Put back caching
            return;

            //Just picked 2 could be more or less
            var low = InitPage - 2;
            var high = InitPage + 2;
            if (low < 1) low = 1;
            if (high > me.NumPages) high = me.NumPages;

            for (var i = low; i <= high; i++)
                if (me.Pages[i] == null)
                    if (i != InitPage)
                        me.LoadPage(i, null, true);

        },
        SetImage: function (Data) {
            var me = this;
            if (me.Pages[PageNum] == null)
                me.Pages[PageNum] = new ReportPage(null, null);
            me.Pages[PageNum].Image = Data;
        },
        CreateSlider: function (ReportViewerUID) {
            var me = this;
            $Container = me.$PageNav;
            $Container.css("display", "block");
            $Slider = new $('<DIV />');
            $Slider.attr('class', 'sky-carousel');
            $Slider.attr('style', 'height: 150px; display: none;'); // Need to make this none
            $SliderWrapper = new $('<DIV />');
            $SliderWrapper.attr('class', 'sky-carousel-wrapper');
            $Slider.append($SliderWrapper);
            $List = new $('<UL />');
            $List.attr('class', 'sky-carousel-container');

            //if(GetParamsList()!
            for ( i = 1; i <= me.NumPages; i++) {
        
                var url = me.options.ReportViewerAPI + '/GetThumbnail/?ReportServerURL=' + me.ReportServerURL + '&ReportPath='
                        + me.options.ReportPath + '&SessionID=' + me.SessionID + '&PageNumber=' +  i;
                $ListItem = new $('<LI />');
                $List.append($ListItem);
                $Caption = new $('<DIV />');
                $Caption.html("<h3 class='centertext'>" + i.toString() + "</h3>");
                $Caption.attr('class', 'center');
                $Thumbnail = new $('<IMG />');
                $Thumbnail.attr('class', 'pagethumb');
                $Thumbnail.attr('src', url);
                $Thumbnail.attr("onclick", "Reports['" + ReportViewerUID + "'].NavToPage(" + i + ")");
                // Need to add onclick
                $ListItem.append($Caption);
                $ListItem.append($Thumbnail);
            }

            $SliderWrapper.append($List);
            $Container.append($Slider);

            var carousel = $Slider.carousel({
                itemWidth: 120,
                itemHeight: 120,
                distance: 8,
                selectedItemDistance: 25,
                selectedItemZoomFactor: 1,
                unselectedItemZoomFactor: 0.67,
                unselectedItemAlpha: 0.6,
                motionStartDistance: 85,
                topMargin: 30,
                gradientStartPoint: 0.35,
                gradientOverlayColor: "#f5f5f5",
                gradientOverlaySize: 95,
                reflectionDistance: 1,
                reflectionAlpha: 0.35,
                reflectionVisible: true,
                reflectionSize: 35,
                selectByClick: true
            });
            carousel.select(0, 1);

            me.$PageNav = $Container;
            me.$Slider = $Slider;
            me.$Carousel = carousel;
            me.CreateNav = true;
        },
        Back: function () {
            var me = this;
            var action = me.ActionHistory.pop();
            if (action != undefined) {
                me.options.ReportPath = action.ReportPath;
                me.SessionID = action.SessionID;
                me.ScrollLeft = action.ScrollLeft;
                me.ScrollTop = action.ScrollTop;

                if (me.ParamLoaded == true) {
                    RemoveParameter();
                    me.paramloaded = false;
                }
                me.LoadPage(action.CurrentPage, null, false);

                //me.Pages[me.CurPage].$Container.detach();
                //me.Pages[me.CurPage].$Container = null;
                //me.Pages[me.CurPage].$Container = action.Container;
                //me.$ReportAreaContainer.append(me.Pages[me.CurPage].$Container);
            }
        },
        ShowNav: function () {
            var me = this;
            if (!me.CreateNav)
                me.CreateSlider(me.options.UID);
            if (me.$Slider.is(":visible")) {
                me.$Slider.fadeOut("slow");
                me.$PageNav.fadeOut("fast");
            }
            else {
                if (me.$Carousel != null)
                    me.$Carousel.select(me.CurPage - 1, 1);
                me.$PageNav.fadeIn("fast");
                me.$Slider.fadeIn("slow");
            }
        },
        Sort: function (Direction, ID) {
            //Go the other dirction from current
            var me = this;
            var newDir;
            if (Direction == "Ascending")
                newDir = "Descending";
            else
                newDir = "Ascending";

            $.getJSON(me.options.ReportViewerAPI + "/SortReport/", {                
                ReportServerURL: me.ReportServerURL,
                SessionID: me.SessionID,
                SortItem: ID,
                Direction: newDir
            }).done(function (Data) {
                me.NumPages = Data.NumPages;
                me.Pages = new Object();
                me.LoadPage((Data.NewPage), null, false);
            })
            .fail(function () { console.log("error"); me.RemoveLoadingIndicator(); });
        },
        ToggleItem: function (ToggleID) {
            var me = this;
            me.ToggleID = ToggleID;

            $.getJSON(me.options.ReportViewerAPI + "/NavigateTo/", {
                NavType: "toggle",
                ReportServerURL: me.ReportServerURL,
                SessionID: me.SessionID,
                UniqueID: ToggleID
            }).done(function (Data) {
                if (Data.Result == true) {
                    //var pc = me.Pages[me.CurPage];
                    //pc.$Container.detach();
                    me.ScrollLeft = $(window).scrollLeft();
                    me.ScrollTop = $(window).scrollTop();

                    me.Pages[me.CurPage] = null;            
                    me.LoadPage(me.CurPage, null, false);
                }
            })
           .fail(function () { console.log("error"); me.RemoveLoadingIndicator(); });
        },
        NavigateBookmark: function (BookmarkID) {
            var me = this;
            $.getJSON(me.options.ReportViewerAPI + "/NavigateTo/", {
                NavType: "bookmark",
                ReportServerURL: me.ReportServerURL,
                SessionID: me.SessionID,
                UniqueID: BookmarkID
            }).done(function (Data) {
                if (Data.NewPage == me.CurPage) {
                    NavToLink(BookmarkID);
                } else {
                    me.BackupCurPage();
                    me.LoadPage(Data.NewPage, null, false, BookmarkID);
                }
            })
           .fail(function () { console.log("error"); me.RemoveLoadingIndicator(); });
        },
        NavigateDrillthrough: function (DrillthroughID) {
            var me = this;
            $.getJSON(me.options.ReportViewerAPI + "/NavigateTo/", {
                NavType: "drillthrough",
                ReportServerURL: me.ReportServerURL,
                SessionID: me.SessionID,
                UniqueID: DrillthroughID
            }).done(function (Data) {
                me.BackupCurPage();
                me.SessionID = Data.SessionID;
                me.Pages = new Object();

                if (Data.ParametersRequired) {
                    me.$ReportAreaContainer.find("#Page").detach();
                    me.SetScrollLocation(0, 0);
                    me.ShowParameters(1, Data.Parameters);
                }
                else {
                    me.SetScrollLocation(0, 0);
                    me.LoadPage(1, null, false, null);
                }

            })
           .fail(function () { console.log("error"); me.RemoveLoadingIndicator(); });
        },
        NavigateDocumentMap: function (DocumentMapID) {
            var me = this;
            $.getJSON(me.options.ReportViewerAPI + "/NavigateDocumentMap/", {
                NavType: "documentMap",
                ReportServerURL: me.ReportServerURL,
                SessionID: me.SessionID,
                UniqueID: DocumentMapID
            }).done(function (Data) {
                me.BackupCurPage();
                me.Pages = new Object();
                me.LoadPage(Data.NewPage, null, false, null);
                //LoadPage(RS, Data.NewPage, null, false, null);
            })
           .fail(function () { console.log("error"); me.RemoveLoadingIndicator(); });
        },
        BackupCurPage: function () {
            var me = this;
            //deep clone current page container, the different between current page and drill report is ReportPath,SessionID and Container
            //ActionHistory.push({ ReportPath: me.ReportPath, SessionID: me.SessionID, Container: $.extend(true, {}, me.Pages[me.CurPage].$Container) });
            me.ActionHistory.push({ ReportPath: me.options.ReportPath, SessionID: me.SessionID, CurrentPage: me.CurPage, ScrollTop: $(window).scrollTop(), ScrollLeft: $(window).scrollLeft() });
        },
        SetScrollLocation: function (top, left) {
            var me = this;
            me.ScrollLeft = left;
            me.ScrollTop = top;
       },
        
        //Page Loading
        LoadParameters: function (PageNum) {
            var me = this;
            $.getJSON(me.options.ReportViewerAPI + "/GetParameterJSON/", {
                ReportServerURL: me.ReportServerURL,
                ReportPath: me.options.ReportPath
            })
           .done(function (Data) {
               me.ShowParameters(PageNum, Data);
           })
           .fail(function () { console.log("error"); me.RemoveLoadingIndicator(); })
        },
        ShowParameters: function (PageNum, Data) {
            var me = this;
            if (Data.Type == "Parameters") {
                if (me.ParamLoaded == true) {
                    $("#ParameterContainer").detach();
                }
                //$("#ParameterContainer").reportParameters({ ReportViewer: this });
                //$("#ParameterContainer").reportParameters("WriteParameterPanel", Data, me, PageNum, false);
                me.reportParameters({ ReportViewer: this });
                me.reportParameters("WriteParameterPanel", Data, me, PageNum, false);
                me.ParamLoaded = true;
            }
            else {
                me.LoadPage(PageNum, null, false);
            }
        },
        LoadPage: function (NewPageNum, OldPage, LoadOnly, BookmarkID) {
            var me = this;
            //if (OldPage != null)
            //    if (OldPage.$Container != null)
            //        OldPage.$Container.fadeOut("fast");

            if (me.Pages[NewPageNum] != null)
                if (me.Pages[NewPageNum].$Container != null) {
                    if (!LoadOnly) {
                        me.SetPage(NewPageNum);
                        me.CachePages(NewPageNum);
                    }
                    return;
                }

            $.getJSON(me.options.ReportViewerAPI + "/GetReportJSON/", {
                ReportServerURL: me.ReportServerURL,
                ReportPath: me.options.ReportPath,
                SessionID: me.SessionID,
                PageNumber: NewPageNum,
                ParameterList: "" //GetParamsList()
            })
            .done(function (Data) {       
                me.WritePage(Data, NewPageNum, OldPage, LoadOnly);
                if (BookmarkID != null)
                    NavToLink(BookmarkID);
                //me.RenderPage(NewPageNum);
                if (!LoadOnly) me.CachePages(NewPageNum);        
            })
            .fail(function () { console.log("error"); me.RemoveLoadingIndicator(); })
        },
        WritePage: function (Data, NewPageNum, OldPage, LoadOnly) {
            var me = this;
            var $Report = $("<Div/>");
            $Report.attr("ID", "Page");
    
            //Error, need to handle this better
            if (Data == null) return;
            $Report.reportRender({ReportViewer: this});

            if (me.Pages[NewPageNum] == null)
                me.Pages[NewPageNum] = new ReportPage($Report, Data);
            else {                
                me.Pages[NewPageNum].$Container = $Report;
                me.Pages[NewPageNum].ReportObj = Data;
            }
            me.SessionID = Data.SessionID;
            me.NumPages = Data.NumPages;

            //Sections
            me.RemoveLoadingIndicator();
            if (!LoadOnly) {
                me.RenderPage(NewPageNum);
                me.SetPage(NewPageNum, OldPage);
            }
        },
        RenderPage: function (pageNum) {
            //Write Style   
            var me = this;
            if (me.Pages[pageNum] != null && me.Pages[pageNum].IsRendered == true)
                return;
            //me.Pages[pageNum].$Container.reportRender({ ReportViewer: this });
            me.Pages[pageNum].$Container.reportRender("Render",pageNum);

            if (me.Pages[pageNum].ReportObj.Report.DocumentMap != null) {
                WriteDocumentMap(new ReportItemContext(me, me.Pages[pageNum].ReportObj.Report.DocumentMap, null, null, me.$PageContainer));
            }
            me.Pages[pageNum].IsRendered = true;
        },
        GetToolbar: function (UID) {
            var me = this;
            var $Toolbar = $("<Table/>");
            var $Row = $("<TR/>");
            var $Cell;

            $Toolbar.attr("class", "toolbar");

            $Cell = new $("<TD class='spacer10mm' ><DIV class='composite-icons30x30 icon-settings'></DIV></TD>");
            $Cell.on("click", { id: UID }, function (e) { me.ShowParms(); });
            $Cell.addClass("cursor-pointer");
            $Row.append($Cell);

            $Cell = new $("<TD class='spacer10mm' ><DIV class='composite-icons30x30 icon-nav2'></DIV></TD>");
            $Cell.on("click", { id: UID }, function (e) { me.ShowNav(); });
            $Cell.addClass("cursor-pointer");
            $Row.append($Cell);

            $Cell = new $("<TD class='spacer10mm' ><DIV class='composite-icons30x30 icon-backbutton'></DIV></TD>");
            $Cell.on("click", { id: UID }, function (e) { me.Back(); });
            $Cell.addClass("cursor-pointer");
            $Row.append($Cell);

            $Cell = new $("<TD class='spacer10mm' ><DIV class='composite-icons30x30 icon-refresh'></DIV></TD>");
            $Cell.on("click", { id: UID }, function (e) { me.RefreshReport(); });
            $Cell.addClass("cursor-pointer");
            $Row.append($Cell);

            $Cell = new $("<TD class='spacer10mm' ><DIV class='composite-icons30x30 icon-backward'></DIV></TD>");
            $Cell.on("click", { id: UID }, function (e) { me.NavToPage(1); });
            $Cell.addClass("cursor-pointer");
            $Row.append($Cell);

            $Cell = new $("<TD class='spacer5mm' ><DIV class='composite-icons30x30 icon-previous'></DIV></TD>");
            $Cell.on("click", { id: UID }, function (e) { me.NavToPage(Reports[e.data.id].CurPage - 1); });
            $Cell.addClass("cursor-pointer");
            $Row.append($Cell);

            $Cell = new $("<input/>");
            $Cell.addClass("toolbartextbox");
            $Cell.addClass(UID);
            $Cell.attr("type", "number")
            $Cell.on("keypress", { id: UID, input: $Cell }, function (e) { if (e.keyCode == 13) Reports[e.data.id].NavToPage(e.data.input.val()); });
            $Row.append($Cell);

            $Cell = new $("<TD class='spacer10mm' ><DIV class='composite-icons30x30 icon-next'></DIV></TD>");
            $Cell.on("click", { id: UID }, function (e) { me.NavToPage(Reports[e.data.id].CurPage + 1); });
            $Cell.addClass("cursor-pointer");
            $Row.append($Cell);

            $Cell = new $("<TD/>");    
            $Cell.attr("style", "width:100%;");
            $Row.append($Cell);

            $Toolbar.append($Row);
            return $Toolbar;
        },
        WriteDocumentMap: function (RIContext) {
            var $TD = new $("<TD />");
            $TD.addClass("DocMapPanel");
            var $DocMapContainer = new $("<DIV />");
            $DocMapContainer.addClass("DocMapBorder");

            var $Table = GetDefaultHTMLTable();
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
            $TDMap.append(WriteDocumentMapItem(RIContext.RS, RIContext.CurrObj, 0));

            $Row.append($TDMap);
            $Table.append($RowBar);
            $Table.append($Row);
            $DocMapContainer.append($Table);
            $TD.append($DocMapContainer);

            RIContext.RS.$PageContainer.append($TD);
            RIContext.RS.$PageContainer.append($TDSpliter);
        },
        WriteDocumentMapItem: function(RS, DocMap, Level) {
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

            var $TDSpliter = new $("<TD />");
            $TDSpliter.addClass("DocMap-Spliter");
            $TDSpliter.on("mouseover", function (event) { SetActionCursor(this); });    
            //$TDSpliter.on("mousemove", function (e) {
        
            //    var offset = $(this).offset();
            //    //var x = e.pageX - offset.left;
            //    //alert('e.pageX:' + e.pageX + ';x:' + x);
            //    //$(".DocMapBorder").width(offset.left);
            //});

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
    
            var $MapNode = new $("<A />");
            $MapNode.addClass("DocMap-Item").attr("title", "Navigate to " + DocMap.Label).html(DocMap.Label);
            $MapNode.on("click", { ID: RS.options.UID, UniqueName: DocMap.UniqueName }, function (e) {
                Reports[e.data.ID].NavigateDocumentMap(e.data.UniqueName);
            });
            $MapNode.hover(function () { $MapNode.addClass("DocMap-Item-Highlight"); }, function () { $MapNode.removeClass("DocMap-Item-Highlight"); });
            $DocMap.append($MapNode);

            if (DocMap.Children != undefined) {
                Level++;
                $.each(DocMap.Children, function (Index, Obj) {
                    $DocMap.append(WriteDocumentMapItem(RS, Obj, Level));
                });
            }
            return $DocMap;
        },
        // Utility functions
        SessionPing: function() {
            // Ping each report so that the seesion does not expire on the report server
            var me = this;
            if (me.SessionID != null && me.SessionID != "")
                $.get(me.ReportViewerAPI + "/PingSession/", {
                    ReportServerURL: me.ReportServerURL,
                    SessionID: me.SessionID
                })
                .done(function (Data) { })
                .fail(function () { console.log("error"); })
    
        },
        UpdateTableHeaders: function(me) {
            // Update the floating headers in this viewer
            // Update the toolbar
            
            $.each(me.FloatingHeaders, function (Index, Obj) {
                me.SetRowHeaderOffset(Obj.$Tablix, Obj.$RowHeader);
                me.SetColHeaderOffset(Obj.$Tablix, Obj.$ColHeader);
            });
            if (me.HasToolbar) {
                me.SetRowHeaderOffset(me.$ReportContainer, me.$FloatingToolbar);
                me.SetColHeaderOffset(me.$ReportContainer, me.$FloatingToolbar);
            }
        },
        HideTableHeaders: function() {
            // On a touch device hide the headers during a scroll if possible
            var me = this;
            $.each(me.FloatingHeaders, function (Index, Obj) {
                if (Obj.$RowHeader != null) Obj.$RowHeader.css("display", "none");
                if (Obj.$ColHeader != null) Obj.$ColHeader.css("display", "none");
            });
            if (me.$FloatingToolbar != null) me.$FloatingToolbar.css("display", "none");
        },
        is_touch_device: function() {
            return !!('ontouchstart' in window) // works on most browsers 
                || !!('onmsgesturechange' in window); // works on ie10
        },
        NavToLink: function(ElementID) {
            $(this).scrollTop($("#" + ElementID).offset().top - 85);
        },
        StopDefaultEvent: function(e) {
            //IE
            if (window.ActiveXObject)
                window.event.returnValue = false;
            else {
                e.preventDefault();
                e.stopPropagation();
            }
        },
        _GetHeight: function ($Obj) {
            var height;

            var $copied_elem = $Obj.clone()
                                .css({
                                    visibility: "hidden"
                                });

            //Image size cannot change so do not load.
            //$copied_elem.find('img').removeAttr('src');
            //$copied_elem.find('img').removeAttr('onload');
            //$copied_elem.find('img').removeAttr('alt');
            $copied_elem.find('img').remove();

            $("body").append($copied_elem);
            height = $copied_elem.height() + "px";

            $copied_elem.remove();

            //Return in mm
            return this._ConvertToMM(height);

        },
        _ConvertToMM: function (ConvertFrom) {

            if (ConvertFrom == null)
                return 0;

            var unit = ConvertFrom.match(/\D+$/);  // get the existing unit
            var value = ConvertFrom.match(/\d+/);  // get the numeric component

            if (unit.length == 1) unit = unit[0];
            if (value.length == 1) value = value[0];

            switch (unit) {
                case "px":
                    return value / 3.78;
                    break;
                case "pt":
                    return value * 0.352777777778;
                    break;
                case "in":
                    return value * 25.4;
                    break;
                case "mm":
                    return value;
                    break;
                case "cm":
                    return value * 10;
                    break;
                case "em":
                    return value * 4.2175176;
                    break;
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
    }
});
