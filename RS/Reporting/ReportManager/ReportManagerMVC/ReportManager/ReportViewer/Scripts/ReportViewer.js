$(function () {
    // report viewer widget
    $.widget("reports.reportviewer", {
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
            toolbarOffset: 0
        },

        // Constructor
        _create: function () {
            var me = this;
            var $Table = new $("<table class='top-level-report-table'/>");
            var $Row = new $("<TR/>");
            var $Cell;
            var $FloatingToolbar;

            // ReportState
            me.$ReportOuterDiv = $("#" + me.options.UID);
            me.CurPage = 0;
            me.Pages = new Object();
            me.ReportServerURL = this.options.ReportServer;
            me.FloatingToolbarHeight;
            me.$FloatingToolbar;
            me.SessionID = "";
            me.$PageContainer = $Row;
            me.$ReportAreaContainer;
            me.$DocumentMapContainer;

            me.NumPages = 0;
            me.Lock = false;
            me.$ReportContainer;
            me.$LoadingIndicator = new $("<div id='loadIndicator_" + me.options.UID + "' class='loading-indicator'></div>").text("Report loading...");
            me.FloatingHeaders = [];
            me.$PageNav;
            me.$Slider;
            me.$Carousel;
            me.externalToolbarHeight;
            me.CreateNav = false;
            me.ParamLoaded = false;
            me.ScrollTop = 0;
            me.ScrollLeft = 0;

            Reports[me.options.UID] = this;
            if (me.options.NavUID != null) {
                me.$PageNav = $("#" + me.options.NavUID);
                me.$PageNav.css("display", "none");
            }

            if (me.options.HasToolbar) {
                var $tb = me.GetToolbar(me.options.UID);
                me.ToolbarHeight = GetHeight($tb) * 3.78;  //convert to px

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

                    if (me.options.toolbarOffset != null) {
                        me.externalToolbarHeight = me.options.toolbarOffset;
                    }
                }
            }

            $(window).scroll(UpdateTableHeaders);

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
        getToolbarHeightWithOffset: function () {
            var me = this;
            if (me.externalToolbarHeight == null) {
                return me.ToolbarHeight;
            }

            return me.externalToolbarHeight();
        },
        SetRowHeaderOffset: function ($Tablix, $RowHeader) {
            //  Update floating row headers
            var me = this;
            if ($RowHeader == null)
                return;

            toolbarOffset = 0;

            // Handle toolbar special
            if (me.options.HasToolbar)
                toolbarOffset = me.getToolbarHeightWithOffset();
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
                        HideTableHeaders();
                },
                tap: function (event, target) {
                    $(target).trigger('click');
                }
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
            var action = ActionHistory.pop();
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
        ShowNav: function (UID) {
            var me = this;
            if (!Reports[UID].CreateNav)
                Reports[UID].CreateSlider(UID);
            if (Reports[UID].$Slider.is(":visible")) {
                Reports[UID].$Slider.fadeOut("slow");
                Reports[UID].$PageNav.fadeOut("fast");
            }
            else {
                if (Reports[UID].$Carousel != null)
                    Reports[UID].$Carousel.select(Reports[UID].CurPage - 1, 1);
                Reports[UID].$PageNav.fadeIn("fast");
                Reports[UID].$Slider.fadeIn("slow");
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

            $.getJSON(me.options.ReportViewerAPI + "/ToggleItem/", {
                ReportServerURL: me.ReportServerURL,
                SessionID: me.SessionID,
                ToggleID: ToggleID
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
            $.getJSON(me.options.ReportViewerAPI + "/NavigateBookmark/", {
                ReportServerURL: me.ReportServerURL,
                SessionID: me.SessionID,
                BookmarkID: BookmarkID
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
            $.getJSON(me.options.ReportViewerAPI + "/NavigateDrillthrough/", {
                ReportServerURL: me.ReportServerURL,
                SessionID: me.SessionID,
                DrillthroughID: DrillthroughID
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
            $.getJSON(me.ReportViewerAPI + "/NavigateDocumentMap/", {
                ReportServerURL: me.ReportServerURL,
                SessionID: me.SessionID,
                DocMapID: DocumentMapID
            }).done(function (Data) {
                me.BackupCurPage();
                me.Pages = new Object();
                LoadPage(RS, Data.NewPage, null, false, null);
            })
           .fail(function () { console.log("error"); me.RemoveLoadingIndicator(); });
        },
        BackupCurPage: function () {
            var me = this;
            //deep clone current page container, the different between current page and drill report is ReportPath,SessionID and Container
            //ActionHistory.push({ ReportPath: me.ReportPath, SessionID: me.SessionID, Container: $.extend(true, {}, me.Pages[me.CurPage].$Container) });
            ActionHistory.push({ ReportPath: me.options.ReportPath, SessionID: me.SessionID, CurrentPage: me.CurPage, ScrollTop: $(window).scrollTop(), ScrollLeft: $(window).scrollLeft() });
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
                WriteParameterPanel(Data, me, PageNum, false);
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

            $.getJSON(me.options.ReportViewerAPI + "/GetJSON/", {
                ReportServerURL: me.ReportServerURL,
                ReportPath: me.options.ReportPath,
                SessionID: me.SessionID,
                PageNumber: NewPageNum,
                ParameterList: GetParamsList()
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
            me.Pages[pageNum].$Container.attr("Style", GetStyle(me, me.Pages[pageNum].ReportObj.Report.PageContent.PageStyle));
            $.each(me.Pages[pageNum].ReportObj.Report.PageContent.Sections, function (Index, Obj) { WriteSection(new ReportItemContext(me, Obj, Index, me.Pages[pageNum].ReportObj.Report.PageContent, me.Pages[pageNum].$Container, "")); });


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
            $Cell.on("click", { id: UID }, function (e) { Reports[e.data.id].ShowParms(); });
            $Cell.on("mouseover", function (event) { SetActionCursor(this); });
            $Row.append($Cell);

            $Cell = new $("<TD class='spacer10mm' ><DIV class='composite-icons30x30 icon-nav2'></DIV></TD>");
            $Cell.on("click", { id: UID }, function (e) { Reports[e.data.id].ShowNav(e.data.id); });
            $Cell.on("mouseover", function (event) { SetActionCursor(this); });
            $Row.append($Cell);

            $Cell = new $("<TD class='spacer10mm' ><DIV class='composite-icons30x30 icon-backbutton'></DIV></TD>");
            $Cell.on("click", { id: UID }, function (e) { Reports[e.data.id].Back(); });
            $Cell.on("mouseover", function (event) { SetActionCursor(this); });
            $Row.append($Cell);

            $Cell = new $("<TD class='spacer10mm' ><DIV class='composite-icons30x30 icon-refresh'></DIV></TD>");
            $Cell.on("click", { id: UID }, function (e) { Reports[e.data.id].RefreshReport(); });
            $Cell.on("mouseover", function (event) { SetActionCursor(this); });
            $Row.append($Cell);

            $Cell = new $("<TD class='spacer10mm' ><DIV class='composite-icons30x30 icon-backward'></DIV></TD>");
            $Cell.on("click", { id: UID }, function (e) { Reports[e.data.id].NavToPage(1); });
            $Cell.on("mouseover", function (event) { SetActionCursor(this); });
            $Row.append($Cell);

            $Cell = new $("<TD class='spacer5mm' ><DIV class='composite-icons30x30 icon-previous'></DIV></TD>");
            $Cell.on("click", { id: UID }, function (e) { Reports[e.data.id].NavToPage(Reports[e.data.id].CurPage - 1); });
            $Cell.on("mouseover", function (event) { SetActionCursor(this); });
            $Row.append($Cell);

            $Cell = new $("<input/>");
            $Cell.addClass("toolbartextbox");
            $Cell.addClass(UID);
            $Cell.attr("type", "number")
            $Cell.on("keypress", { id: UID, input: $Cell }, function (e) { if (e.keyCode == 13) Reports[e.data.id].NavToPage(e.data.input.val()); });
            $Row.append($Cell);

            $Cell = new $("<TD class='spacer10mm' ><DIV class='composite-icons30x30 icon-next'></DIV></TD>");
            $Cell.on("click", { id: UID }, function (e) { Reports[e.data.id].NavToPage(Reports[e.data.id].CurPage + 1); });
            $Cell.on("mouseover", function (event) { SetActionCursor(this); });
            $Row.append($Cell);

            $Cell = new $("<TD/>");    
            $Cell.attr("style", "width:100%;");
            $Row.append($Cell);

            $Toolbar.append($Row);
            return $Toolbar;
        }

    });  // $.widget
});   // $(function

//Global reference to all reports
var Reports = new Object();
var ActionHistory = [];
setInterval(function () { SessionPing(); }, 300000);

// ********************* Structures ***************************************

//  The ReportIemContext simplifies the signature for all of the functions to pass context around
function ReportItemContext(RS, CurrObj, CurrObjIndex, CurrObjParent, $HTMLParent, Style, CurrLocation) {
    this.RS = RS;
    this.CurrObj = CurrObj;
    this.CurrObjIndex = CurrObjIndex;
    this.CurrObjParent = CurrObjParent;
    this.$HTMLParent = $HTMLParent;
    this.Style = Style;
    this.CurrLocation = CurrLocation;
}
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
// Layout is used to determine the placement of report items in a rectangle or rectangle/section/column
function Layout() {
    this.ReportItems = new Object();
    this.Height = 0;
    this.LowestIndex;
}
// Temp measurement mimics the server measurement object
function TempMeasurement(Height, Width) {
    this.Height = Height;
    this.Width = Width;
}
//  Report Item Location is used my the layout to absolute position objects in a rectangle/section/column
function ReportItemLocation(Index) {
    this.TopDelta = 0;
    this.Height = 0;
    this.Index = Index;
    this.IndexAbove;
    this.NewHeight;
    this.NewTop;
}

// Utility functions
function SessionPing() {
    // Ping each report so that the seesion does not expire on the report server
    $.each(Reports, function (index, RS) {
        if (RS.SessionID != null && RS.SessionID != "")
            $.get(RS.options.ReportViewerAPI + "/PingSession/", {
                ReportServerURL: RS.ReportServerURL,
                SessionID: RS.SessionID
            })
            .done(function (Data) { })
            .fail(function () { console.log("error"); })
    });
}
function UpdateTableHeaders() {
    // For each report on the page call chack to see if a floating header needs updating
    // Update the toolbar
    $.each(Reports, function (repIndex, RS) {
        $.each(RS.FloatingHeaders, function (Index, Obj) {
            RS.SetRowHeaderOffset(Obj.$Tablix, Obj.$RowHeader);
            RS.SetColHeaderOffset(Obj.$Tablix, Obj.$ColHeader);
        });
        if (RS.HasToolbar) {
            RS.SetRowHeaderOffset(RS.$ReportContainer, RS.$FloatingToolbar);
            RS.SetColHeaderOffset(RS.$ReportContainer, RS.$FloatingToolbar);
        }
    });
}
function HideTableHeaders() {
    // On a touch device hide the headers during a scroll if possible
    $.each(Reports, function (repIndex, RS) {
        $.each(RS.FloatingHeaders, function (Index, Obj) {
            if (Obj.$RowHeader != null) Obj.$RowHeader.css("display", "none");
            if (Obj.$ColHeader != null) Obj.$ColHeader.css("display", "none");
        });
        if (RS.$FloatingToolbar != null) RS.$FloatingToolbar.css("display", "none");
    });
};

function is_touch_device() {
    return !!('ontouchstart' in window) // works on most browsers 
        || !!('onmsgesturechange' in window); // works on ie10
};

function NavToLink(ElementID) {
    $(document).scrollTop($("#" + ElementID).offset().top - 85);
};

function SetActionCursor(Ob) {
    Ob.style.cursor = "pointer";
};

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

// Report Writer / Renderer

function WriteSection(RIContext) {
    var $NewObj = GetDefaultHTMLTable();
    var $Sec = $("<TR/>");
    var Location = GetMeasurmentsObj(RIContext.CurrObjParent, RIContext.CurrObjIndex);

    $Sec.attr("Style", "width:" + Location.Width + "mm;");

    //Columns
    $NewObj.append($Sec);
    $.each(RIContext.CurrObj.Columns, function (Index, Obj) {
        var $col = new $("<TD/>");
        $col.append(WriteRectangle(new ReportItemContext(RIContext.RS, Obj, Index, RIContext.CurrObj, new $("<Div/>"), null, Location)));
        $Sec.append($col)
    });
    RIContext.$HTMLParent.append($NewObj);
}
function WriteRectangle(RIContext) {
    var $RI;        //This is the ReportItem Object
    var $LocDiv;    //This DIV will have the top and left location set, location is not set anywhere else
    var Measurements;
    var RecLayout;
    var Style;

    Measurements = RIContext.CurrObj.Measurement.Measurements;
    RecLayout = GetRectangleLayout(Measurements);

    $.each(RIContext.CurrObj.ReportItems, function (Index, Obj) {
        
        Style = "";
        if (Obj.Type != "Line") {
            Style = "display:table;border-collapse:collapse;";
            Style += GetFullBorderStyle(Obj);
        }

        $RI = WriteReportItems(new ReportItemContext(RIContext.RS, Obj, Index, RIContext.CurrObj, new $("<Div/>"), Style, Measurements[Index]));
                       
        $LocDiv = new $("<Div/>");
        $LocDiv.append($RI);
        Style = "";

        //Determin height and location
        if (Obj.Type == "Image" || Obj.Type == "Chart" || Obj.Type == "Gauge" || Obj.Type == "Map" || Obj.Type == "Line")
            RecLayout.ReportItems[Index].NewHeight = Measurements[Index].Height;
        else
            RecLayout.ReportItems[Index].NewHeight = GetHeight($RI);

        if (RecLayout.ReportItems[Index].IndexAbove == null)
            RecLayout.ReportItems[Index].NewTop = Measurements[Index].Top;
        else
            RecLayout.ReportItems[Index].NewTop = parseFloat(RecLayout.ReportItems[RecLayout.ReportItems[Index].IndexAbove].NewTop) + parseFloat(RecLayout.ReportItems[RecLayout.ReportItems[Index].IndexAbove].NewHeight) + parseFloat(RecLayout.ReportItems[Index].TopDelta)
        Style += "position:absolute;top:" + RecLayout.ReportItems[Index].NewTop + "mm;left:" + Measurements[Index].Left + "mm;";

        //Background color and border go on container        
        if ((RIContext.CurrObj.ReportItems[Index].Element != null) && (RIContext.CurrObj.ReportItems[Index].Elements.SharedElements.Style != null) && (RIContext.CurrObj.ReportItems[Index].Elements.SharedElements.Style.BackgroundColor != null))
            Style += "background-color:" + RIContext.CurrObj.ReportItems[Index].Elements.SharedElements.Style.BackgroundColor + ";";
        else if ((RIContext.CurrObj.ReportItems[Index].Element != null) && (RIContext.CurrObj.ReportItems[Index].Elements.NonSharedElements.Style != null) && (RIContext.CurrObj.ReportItems[Index].Elements.NonSharedElements.Style.BackgroundColor != null))
            Style += "background-color:" + RIContext.CurrObj.ReportItems[Index].Elements.NonSharedElements.Style.BackgroundColor + ";";
        
        $LocDiv.attr("Style", Style);
        $LocDiv.append($RI);
        RIContext.$HTMLParent.append($LocDiv);
    });

    Style = "position:relative;" + GetElementsStyle(RIContext.RS, RIContext.CurrObj.Elements);
    Style += GetFullBorderStyle(RIContext.CurrObj);

    if (RIContext.CurrLocation != null) {
        Style += "width:" + RIContext.CurrLocation.Width + "mm;"
        if (RIContext.CurrObj.ReportItems.length == 0)
            Style += "height:" + RIContext.CurrLocation.Height + "mm;";
        else {
            var parentHeight = parseFloat(RecLayout.ReportItems[RecLayout.LowestIndex].NewTop) + parseFloat(RecLayout.ReportItems[RecLayout.LowestIndex].NewHeight) + (parseFloat(RIContext.CurrLocation.Height) - (parseFloat(Measurements[RecLayout.LowestIndex].Top) + parseFloat(Measurements[RecLayout.LowestIndex].Height)))
            Style += "height:" + parentHeight + "mm;";
        }
        
    }
    RIContext.$HTMLParent.attr("Style", Style);

    return RIContext.$HTMLParent;
}
function GetRectangleLayout(Measurements) {
    var l = new Layout()
   
    $.each(Measurements, function (Index, Obj) {
        l.ReportItems[Index] = new ReportItemLocation(Index);
        curRI = l.ReportItems[Index];

        if (l.LowestIndex == null)
            l.LowestIndex = Index;
        else if (Obj.Top + Obj.Height > Measurements[l.LowestIndex].Top + Measurements[l.LowestIndex].Height)
            l.LowestIndex = Index;

        for (i = 0; i < Measurements.length; i++) {
            var bottom =  Measurements[i].Top + Measurements[i].Height;
            var right = Measurements[i].Left + Measurements[i].Width;
            if ((Obj.Top > bottom) && (
                    ((Obj.Left > Measurements[i].Left) && (Obj.Left < right)) ||
                    ((Obj.Left + Obj.Wifth > Measurements[i].Left) && (Obj.Left + Obj.Width < right)) ||
                    ((Obj.Left < Measurements[i].Left) && (Obj.Left + Obj.Width > right))                    
                )) 
            
            {
                if (curRI.IndexAbove ==null){
                    curRI.IndexAbove = i;
                    curRI.TopDelta = Obj.Top - bottom;
                }
                else if (bottom > Measurements[curRI.IndexAbove].Top + Measurements[curRI.IndexAbove].Height){
                    curRI.IndexAbove = i;    
                    curRI.TopDelta = Obj.Top - bottom;
                }
            }
        }
               
    });
    
    return l;
}
function WriteReportItems(RIContext) {

    switch (RIContext.CurrObj.Type) {
        case "RichTextBox":
            return WriteRichText(RIContext);
            break;
        case "Image":
        case "Chart":
        case "Gauge":
        case "Map":
            return WriteImage(RIContext);
            break;
        case "Tablix":
            return WriteTablix(RIContext);
            break;
        case "Rectangle":
            return WriteRectangle(RIContext);
            break;
        case "SubReport":
            return WriteSubreport(RIContext);
            break;
        case "Line":
            return WriteLine(RIContext);
            break;
    }
}
function WriteRichText(RIContext) {
    var Style = RIContext.Style;
    var $TextObj = $("<div/>");
    var $Sort = null;

    Style += "display:table;";
    if (GetMeasurements(GetMeasurmentsObj(RIContext.CurrObjParent, RIContext.CurrObjIndex), true) != "") 
        Style += GetMeasurements(GetMeasurmentsObj(RIContext.CurrObjParent, RIContext.CurrObjIndex),true);
    Style += GetElementsNonTextStyle(RIContext.RS, RIContext.CurrObj.Elements);
    
    RIContext.$HTMLParent.attr("Style", Style);

    if (RIContext.CurrObj.Elements.SharedElements.IsToggleParent == true || RIContext.CurrObj.Elements.NonSharedElements.IsToggleParent == true) {
        $Drilldown = $("<div/>");
        $Drilldown.attr("id", RIContext.CurrObj.Elements.NonSharedElements.UniqueName);
        $Drilldown.html("&nbsp");

        if (RIContext.CurrObj.Elements.NonSharedElements.ToggleState != null && RIContext.CurrObj.Elements.NonSharedElements.ToggleState == true)
            $Drilldown.addClass("Drilldown-Expand");
        else
            $Drilldown.addClass("Drilldown-Collapse");

        $Drilldown.on("click", { RS: RIContext.RS, ToggleID: RIContext.CurrObj.Elements.NonSharedElements.UniqueName }, function (e) { e.data.RS.ToggleItem(e.data.ToggleID); });
        $Drilldown.on("mouseover", function (event) { SetActionCursor(this); });
        RIContext.$HTMLParent.append($Drilldown);
    }
    if (RIContext.CurrObj.Elements.SharedElements.CanSort != null) {
        $Sort = $("<div/>");
        $Sort.html("&nbsp");
        var Direction = "None";
        if (RIContext.CurrObj.Elements.NonSharedElements.SortState == 2) {
            $Sort.attr("class", "sort-descending");
            Direction = "Descending";
        }
        else if (RIContext.CurrObj.Elements.NonSharedElements.SortState == 1) {
            $Sort.attr("class", "sort-ascending");
            Direction = "Ascending";
        }
        else
            $Sort.attr("class", "sort-unsorted");

        $Sort.on("click", { id: RIContext.RS.options.UID, SortID: RIContext.CurrObj.Elements.NonSharedElements.UniqueName, Direction: Direction }, function (e) { Reports[e.data.id].Sort(e.data.Direction, e.data.SortID); });
        RIContext.$HTMLParent.append($Sort);
    }
    WriteActions(RIContext, RIContext.CurrObj.Elements.NonSharedElements, $TextObj);

    Style = "display: table-cell;white-space:pre-wrap;word-break:break-word;word-wrap:break-word;";
    Style += GetElementsTextStyle(RIContext.CurrObj.Elements);
    $TextObj.attr("Style", Style);

    if (RIContext.CurrObj.Paragraphs.length == 0) {
        if (RIContext.CurrObj.Elements.SharedElements.Value != null)
            $TextObj.html(RIContext.CurrObj.Elements.SharedElements.Value);
        else if (RIContext.CurrObj.Elements.NonSharedElements.Value != null)
            $TextObj.html(RIContext.CurrObj.Elements.NonSharedElements.Value);
        else
            $TextObj.html("&nbsp");
    }
    else {
        //Handle each paragraphs
        var LowIndex = null;
        var ParentName = new Object();
        var ParagraphContainer = new Object();
        ParagraphContainer["Root"] = '';

        //Build paragraph tree
        $.each(RIContext.CurrObj.Paragraphs, function (Index, Obj) {
            if (LowIndex == null) LowIndex = Obj.Paragraph.SharedElements.ListLevel;
            if (ParagraphContainer[Obj.Paragraph.SharedElements.ListLevel] == null) ParagraphContainer[Obj.Paragraph.SharedElements.ListLevel] = [];
            ParentName[Obj.Paragraph.SharedElements.ListLevel] = Obj.Paragraph.NonSharedElements.UniqueName;

            var item;
            if (ParentName[Obj.Paragraph.SharedElements.ListLevel - 1] == null)
                item = "Root";
            else
                item = ParentName[Obj.Paragraph.SharedElements.ListLevel - 1];
            item = { Parent: item, Value: Obj };
            ParagraphContainer[Obj.Paragraph.SharedElements.ListLevel].push(item);
        });

        WriteRichTextItem(RIContext, ParagraphContainer, LowIndex, "Root", $TextObj);
    }
    WriteBookMark(RIContext);
    
    //RIContext.$HTMLParent.append(ParagraphContainer["Root"]);
    RIContext.$HTMLParent.append($TextObj);
    if ($Sort != null) RIContext.$HTMLParent.append($Sort);
    return RIContext.$HTMLParent;
}
function WriteRichTextItem(RIContext, Paragraphs, Index, ParentName, ParentContainer) {
    var $ParagraphList = null;
    
    $.each(Paragraphs[Index], function (SubIndex, Obj) {
        if (Obj.Parent == ParentName) {
            var $ParagraphItem;
            Obj = Obj.Value;
            if (Obj.Paragraph.SharedElements.ListStyle == 1) {
                if ($ParagraphList == null || !$ParagraphList.is("ol")) $ParagraphList = new $("<OL />");
                $ParagraphList.addClass(GetListStyle(1, Obj.Paragraph.SharedElements.ListLevel));

                $ParagraphItem = new $("<LI />");
            }
            else if (Obj.Paragraph.SharedElements.ListStyle == 2) {
                if ($ParagraphList == null || !$ParagraphList.is("ul")) $ParagraphList = new $("<UL />");
                $ParagraphList.addClass(GetListStyle(2, Obj.Paragraph.SharedElements.ListLevel));

                $ParagraphItem = new $("<LI />");
            }
            else {
                if ($ParagraphList == null || !$ParagraphList.is("div")) $ParagraphList = new $("<DIV />");
                $ParagraphItem = new $("<DIV />");
            }

            var ParagraphStyle = "";
            ParagraphStyle += GetMeasurements(GetMeasurmentsObj(Obj, Index));
            ParagraphStyle += GetElementsStyle(RIContext.RS, Obj.Paragraph);
            $ParagraphItem.attr("Style", ParagraphStyle);
            $ParagraphItem.attr("name", Obj.Paragraph.NonSharedElements.UniqueName);

            //Handle each TextRun
            for (i = 0; i < Obj.TextRunCount; i++) {
                var $TextRun;
                var flag = true;
                //With or without Action in TextRun
                if (Obj.TextRuns[i].Elements.NonSharedElements.ActionInfo == undefined) {
                    $TextRun = new $("<SPAN />");
                }
                else {
                    WriteActions(RIContext, Obj.TextRuns[i].Elements.NonSharedElements, $TextRun);
                }

                if (Obj.TextRuns[i].Elements.SharedElements.Value != undefined & Obj.TextRuns[i].Elements.SharedElements.Value != "") {
                    $TextRun.html(Obj.TextRuns[i].Elements.SharedElements.Value);
                }
                else if (Obj.TextRuns[i].Elements.NonSharedElements.Value != undefined & Obj.TextRuns[i].Elements.NonSharedElements.Value != "") {
                    $TextRun.html(Obj.TextRuns[i].Elements.NonSharedElements.Value);
                }
                else {
                    $TextRun.html("&nbsp");
                    flag = false;
                }

                $TextRun.attr("Name", Obj.TextRuns[i].Elements.NonSharedElements.UniqueName);

                if (flag) {
                    var TextRunStyle = "";
                    TextRunStyle += GetMeasurements(GetMeasurmentsObj(Obj.TextRuns[i], i));
                    TextRunStyle += GetElementsStyle(RIContext.RS, Obj.TextRuns[i].Elements);
                    $TextRun.attr("Style", TextRunStyle);
                }

                $ParagraphItem.append($TextRun);
            }
            
            if (Paragraphs[Index + 1] != null)
                WriteRichTextItem(RIContext, Paragraphs, Index + 1, Obj.Paragraph.NonSharedElements.UniqueName, $ParagraphItem);

            $ParagraphList.append($ParagraphItem);
            ParentContainer.append($ParagraphList);
        }
    });
}
function GetImageURL(RS, ImageName) {
    var Url = RS.options.ReportViewerAPI + "/GetImage/?";
    Url += "ReportServerURL=" + RS.ReportServerURL;
    Url += "&SessionID=" + RS.SessionID;
    Url += "&ImageID=" + ImageName;
    return Url;
}
function WriteImage(RIContext) {
    var NewImage = new Image();

    var Style = RIContext.Style + "display:block;max-height:100%;max-width:100%;" + GetElementsStyle(RIContext.RS, RIContext.CurrObj.Elements);
    Style += GetMeasurements(GetMeasurmentsObj(RIContext.CurrObjParent, RIContext.CurrObjIndex),true);
    Style += "overflow:hidden;"

    var ImageName;
    var sizingType = RIContext.CurrObj.Elements.SharedElements.Sizing;

    if (RIContext.CurrObj.Type == "Image") 
        ImageName = RIContext.CurrObj.Elements.NonSharedElements.ImageDataProperties.ImageName;
    else 
        ImageName = RIContext.CurrObj.Elements.NonSharedElements.StreamName;

    NewImage.src = GetImageURL(RIContext.RS, ImageName);
    if (RIContext.CurrObj.Elements.NonSharedElements.ActionImageMapAreas != undefined) {
        NewImage.useMap = "#Map_" + RIContext.RS.SessionID + "_" + RIContext.CurrObj.Elements.NonSharedElements.UniqueName;
    }
    NewImage.onload = function () {
        WriteActionImageMapAreas(RIContext, $(NewImage).width(), $(NewImage).height());
        ResizeImage(this, sizingType, this.naturalHeight, this.naturalWidth, RIContext.CurrLocation.Height, RIContext.CurrLocation.Width);

    };
    NewImage.alt = "Cannot display image";
    $(NewImage).attr("style", "display:block;");

    WriteActions(RIContext, RIContext.CurrObj.Elements.NonSharedElements, $(NewImage));    
    WriteBookMark(RIContext);
  
    RIContext.$HTMLParent.attr("style", Style);
    RIContext.$HTMLParent.append(NewImage);
    return RIContext.$HTMLParent;
}
function WriteActions(RIContext, Elements, $Control) {
    if (Elements.ActionInfo != null)
        for (i = 0; i < Elements.ActionInfo.Count; i++) {
            WriteAction(RIContext, Elements.ActionInfo.Actions[i], $Control);
        }
}
function WriteAction(RIContext, Action, Control) {
    if (Action.HyperLink != undefined) {
        Control.attr("href", Action.HyperLink);
    }
    else if (Action.BookmarkLink != undefined) {
        //HRef needed for ImageMap, Class needed for non image map
        Control.attr("href", "#");
        Control.addClass("cursor-pointer");
        Control.on("click", { ID: RIContext.RS.options.UID, BookmarkID: Action.BookmarkLink }, function (e) {
            StopDefaultEvent(e);
            Reports[e.data.ID].NavigateBookmark(e.data.BookmarkID);
        });
    }
    else {
        //HRef needed for ImageMap, Class needed for non image map
        Control.addClass("cursor-pointer");
        Control.attr("href", "#");
        Control.on("click", { ID: RIContext.RS.options.UID, DrillthroughId: Action.DrillthroughId }, function (e) {
            StopDefaultEvent(e);
            Reports[e.data.ID].NavigateDrillthrough(e.data.DrillthroughId);
        });
    }
}
function WriteActionImageMapAreas(RIContext, width, height) {
    var ActionImageMapAreas = RIContext.CurrObj.Elements.NonSharedElements.ActionImageMapAreas;
    if (ActionImageMapAreas != undefined) {
        var $Map = $("<MAP/>");
        $Map.attr("name", "Map_" + RIContext.RS.SessionID + "_" + RIContext.CurrObj.Elements.NonSharedElements.UniqueName);
        $Map.attr("id", "Map_" + RIContext.RS.SessionID + "_" + RIContext.CurrObj.Elements.NonSharedElements.UniqueName);

        for (i = 0; i < ActionImageMapAreas.Count; i++) {
            var element = ActionImageMapAreas.ActionInfoWithMaps[i];

            for (j = 0; j < element.ImageMapAreas.Count; j++) {
                var $Area = $("<AREA />");
                $Area.attr("tabindex", i + 1);
                $Area.attr("style", "text-decoration:none");
                $Area.attr("alt", element.ImageMapAreas.ImageMapArea[j].Tooltip);
                if (element.Actions != undefined) {
                    WriteAction(RIContext, element.Actions[0], $Area);
                }

                var shape;
                var coords = "";
                switch (element.ImageMapAreas.ImageMapArea[j].ShapeType) {
                    case 0:
                        shape = "rect";
                        coords = parseInt(element.ImageMapAreas.ImageMapArea[j].Coordinates[0] * width / 100) + "," +
                                    parseInt(element.ImageMapAreas.ImageMapArea[j].Coordinates[1] * height / 100) + "," +
                                    parseInt(element.ImageMapAreas.ImageMapArea[j].Coordinates[2] * width / 100) + "," +
                                    parseInt(element.ImageMapAreas.ImageMapArea[j].Coordinates[3] * height / 100);
                        break;
                    case 1:
                        shape = "poly";
                        var coorCount = element.ImageMapAreas.ImageMapArea[j].CoorCount;
                        for (k = 0; k < coorCount; k++) {
                            if (k % 2 == 0) {
                                coords += parseInt(element.ImageMapAreas.ImageMapArea[j].Coordinates[k] * width / 100);
                            }
                            else {
                                coords += parseInt(element.ImageMapAreas.ImageMapArea[j].Coordinates[k] * height / 100);
                            }
                            if (k < coorCount - 1) {
                                coords += ",";
                            }
                        }
                        break;
                    case 2:
                        shape = "circ";
                        coords = parseInt(element.ImageMapAreas.ImageMapArea[j].Coordinates[0] * width / 100) + "," +
                            parseInt(element.ImageMapAreas.ImageMapArea[j].Coordinates[1] * height / 100) + "," +
                            parseInt(element.ImageMapAreas.ImageMapArea[j].Coordinates[2] * width / 100);
                        break;
                }
                $Area.attr("shape", shape);
                $Area.attr("coords", coords);
                $Map.append($Area);
            }
        }
        RIContext.$HTMLParent.append($Map);
    }
}
function ResizeImage(img, sizingType, height, width, maxHeight, maxWidth) {    
    var ratio = 0;

    height = ConvertToMM(height + "px");
    width = ConvertToMM(width + "px");
    if (height != 0 & width != 0) {
        switch (sizingType) {
            case 0://AutoSize
                $(img).css("height", height + "mm");
                $(img).css("width", width + "mm");
                break;
            case 1://Fit
                $(img).css("height", maxHeight + "mm");
                $(img).css("width", maxWidth + "mm");
                break;
            case 2://Fit Proportional
                if (height / maxHeight > 1 | width / maxWidth > 1) {
                    if ((height / maxHeight) >= (width / maxWidth)) {
                        ratio = maxHeight / height;

                        $(img).css("height", maxHeight + "mm");
                        $(img).css("width", width * ratio + "mm");
                        $(img).css("max-height", maxHeight + "mm");
                        $(img).css("max-width", width * ratio + "mm");
                        $(img).css("min-height", maxHeight + "mm");
                        $(img).css("min-width", width * ratio + "mm");
                    }
                    else {
                        ratio = maxWidth / width;

                        $(img).css("width", maxWidth + "mm");
                        $(img).css("height", height * ratio + "mm");
                        $(img).css("max-width", maxWidth + "mm");
                        $(img).css("max-height", height * ratio + "mm");
                        $(img).css("min-width", maxWidth + "mm");
                        $(img).css("min-height", height * ratio + "mm");
                    }
                }
                break;
            case 3://Clip
                $(img).css("height", ConvertToMM(img.naturalHeight + "px") + "mm");
                $(img).css("width", ConvertToMM(img.naturalWidth + "px") + "mm");
                $(img).css("max-height", ConvertToMM(img.naturalHeight + "px") + "mm");
                $(img).css("max-width", ConvertToMM(img.naturalWidth + "px") + "mm");
                //Also add style overflow:hidden to it's parent container
                break;
            default:
                break;
        }
    }
}
function WriteBookMark(RIContext) {
    var $node = $("<a/>");
    if (RIContext.CurrObj.Elements.SharedElements.Bookmark != undefined) {
        $node.attr("name", RIContext.CurrObj.Elements.SharedElements.Bookmark);
        $node.attr("id", RIContext.CurrObj.Elements.SharedElements.Bookmark);
    }
    else if (RIContext.CurrObj.Elements.NonSharedElements.Bookmark != undefined) {
        $node.attr("name", RIContext.CurrObj.Elements.NonSharedElements.Bookmark);
        $node.attr("id", RIContext.CurrObj.Elements.NonSharedElements.Bookmark);
    }
    if ($node.attr("id") != null)
        RIContext.$HTMLParent.append($node);
}
function WriteTablixCell(RIContext, Obj, Index, BodyCellRowIndex) {
    var $Cell = new $("<TD/>");
    var Style = "";
    var width;
    var height;
    var hbordersize = 0;
    var wbordersize = 0;

    
    Style = "vertical-align:top;padding:0;margin:0;-webkit-box-sizing:border-box;-moz-box-sizing:border-box;box-sizing:border-box;";
    Style += GetFullBorderStyle(Obj.Cell.ReportItem);
    var ColIndex = Obj.ColumnIndex;

    var RowIndex;
    if (BodyCellRowIndex == null)
        RowIndex = Obj.RowIndex;
    else
        RowIndex = BodyCellRowIndex;

    width = RIContext.CurrObj.ColumnWidths.Columns[ColIndex].Width 
    height = RIContext.CurrObj.RowHeights.Rows[RowIndex].Height
    Style += "overflow:hidden;width:" + width + "mm;" + "max-width:" + width + "mm;" + "min-width:" + width + "mm;" + "min-height:" + height + "mm;" + "height:" + height + "mm;";

    //Row and column span
    if (Obj.RowSpan != null)
        $Cell.attr("rowspan", Obj.RowSpan);
    if (Obj.ColSpan != null)
        $Cell.attr("colspan", Obj.ColSpan);

    //Background color goes on the cell
    if ((Obj.Cell.ReportItem.Elements.SharedElements.Style !=null) && (Obj.Cell.ReportItem.Elements.SharedElements.Style.BackgroundColor != null))
        Style += "background-color:" + Obj.Cell.ReportItem.Elements.SharedElements.Style.BackgroundColor + ";";
    else if ((Obj.Cell.ReportItem.Elements.NonSharedElements.Style != null) && (Obj.Cell.ReportItem.Elements.NonSharedElements.Style.BackgroundColor != null))
        Style += "background-color:" + Obj.Cell.ReportItem.Elements.NonSharedElements.Style.BackgroundColor + ";";

    $Cell.attr("Style", Style);
    $Cell.append(WriteReportItems(new ReportItemContext(RIContext.RS, Obj.Cell.ReportItem, Index, RIContext.CurrObj, new $("<Div/>"), "margin:0;overflow:hidden;width:100%;height:100%;", new TempMeasurement(height, width))));
    return $Cell;
}
function WriteTablix(RIContext) {
    var $Tablix = GetDefaultHTMLTable();
    var Style = "border-collapse:collapse;padding:0;margin:0;";
    var $Row;
    var LastRowIndex = 0;
    var $FixedColHeader = new $("<DIV/>").css({ display: "none", position: "absolute", top: "0px", left: "0px" });
    var $FixedRowHeader = new $("<DIV/>").css({ display: "none", position: "absolute", top: "0px", left: "0px" });
    var LastObjType = "";
    var HasFixedRows = false;
    var HasFixedCols = false;

    Style += GetMeasurements(GetMeasurmentsObj(RIContext.CurrObjParent, RIContext.CurrObjIndex));
    Style += GetElementsStyle(RIContext.RS, RIContext.CurrObj.Elements);
    $Tablix.attr("Style", Style);
    
    $Row = new $("<TR/>");
    $.each(RIContext.CurrObj.TablixRows, function (Index, Obj) {
        

        if (Obj.RowIndex != LastRowIndex) {
            $Tablix.append($Row);
            
            //Handle fixed col header
            if (RIContext.CurrObj.RowHeights.Rows[Obj.RowIndex-1].FixRows == 1)
                $FixedColHeader.append($Row.clone(true, true));

            $Row = new $("<TR/>");
            LastRowIndex = Obj.RowIndex;
        }

        //Handle fixed row header
        if (Obj.Type != "Corner" && LastObjType == "Corner") {
            $FixedRowHeader.append($Row.clone(true, true));
        }
        if (Obj.Type != "RowHeader" && LastObjType == "RowHeader") {
            $FixedRowHeader.append($Row.clone(true, true));
        }
        if (RIContext.CurrObj.RowHeights.Rows[Obj.RowIndex].FixRows == 1)
            HasFixedRows = true;
        if (Obj.Type != "BodyRow" && RIContext.CurrObj.ColumnWidths.Columns[Obj.ColumnIndex].FixColumn == 1)
            HasFixedCols = true;
        
        if (Obj.Type == "BodyRow") {
            $.each(Obj.Cells, function (BRIndex, BRObj) {
                $Row.append(WriteTablixCell(RIContext, BRObj, BRIndex, Obj.RowIndex));
            })
        }
        else {
            if (Obj.Cell != null) $Row.append(WriteTablixCell(RIContext, Obj, Index));
        }
        LastObjType = Obj.Type;
    })
    $Tablix.append($Row);

    if (HasFixedRows)
        $Tablix.append($FixedColHeader);
    else
        $FixedColHeader = null;

    if (HasFixedCols)
        $Tablix.append($FixedRowHeader);
    else
        $FixedRowHeader = null;

    var ret = $("<div class='divWithFloatingRow' style='position:relative'></div").append($FixedColHeader);
    ret.append($Tablix);
    RIContext.RS.FloatingHeaders.push(new FloatingHeader(ret, $FixedColHeader, $FixedRowHeader));
    return ret;
}
function WriteSubreport(RIContext) {
    
    RIContext.Style += GetElementsStyle(RIContext.RS, RIContext.CurrObj.SubReportProperties);
    RIContext.CurrObj = RIContext.CurrObj.BodyElements;
    return WriteRectangle(RIContext);
    
}
function WriteLine(RIContext) {
    var measurement = GetMeasurmentsObj(RIContext.CurrObjParent, RIContext.CurrObjIndex);
    var Style = "position:relative;width:" + measurement.Width + "mm;height:" + measurement.Height + "mm;";
    
    if (measurement.Width == 0 || measurement.Height == 0)
        Style += GetFullBorderStyle(RIContext.CurrObj);
    else {
        var $line = $("<Div/>");
        var newWidth = Math.sqrt(Math.pow(measurement.Height, 2) + Math.pow(measurement.Width, 2));
        var rotate = Math.atan(measurement.Height / measurement.Width);
        var newTop = (newWidth / 2) * Math.sin(rotate);
        var newLeft = (newWidth / 2) - Math.sqrt(Math.pow(newWidth / 2, 2) + Math.pow(newTop, 2));
        if (RIContext.CurrObj.Elements.SharedElements.Slant == null || RIContext.CurrObj.Elements.SharedElements.Slant == 0)
            rotate = rotate;
        else
            rotate = rotate - (2 * rotate);
        var lineStyle = "position:absolute;top:" + newTop + "mm;left:" + newLeft + "mm;";
        lineStyle += GetFullBorderStyle(RIContext.CurrObj);
        lineStyle += "width:" + newWidth + "mm;height:0;"
        lineStyle += "-moz-transform: rotate(" + rotate + "rad);"
        lineStyle += "-webkit-transform: rotate(" + rotate + "rad);"
        lineStyle += "-ms-transform: rotate(" + rotate + "rad);"
        lineStyle += "transform: rotate(" + rotate + "rad);"
        $line.attr("Style", lineStyle);
        RIContext.$HTMLParent.append($line);
    }

    if (RIContext.CurrObj.Elements.NonSharedElements.ActionInfo != null)
        for (i = 0; i < Obj.TextRuns[i].Elements.NonSharedElements.ActionInfo.Count; i++) {
            WriteAction(RIContext, RIContext.CurrObj.Elements.NonSharedElements.ActionInfo.Actions[i], NewImage);
        }

    WriteBookMark(RIContext);

    RIContext.$HTMLParent.attr("Style", Style + RIContext.Style);
     return RIContext.$HTMLParent;

}

function WriteDocumentMap(RIContext) {
    var $TD = new $("<TD />");
    $TD.addClass("DocMap");
    var $DocMapContainer = new $("<DIV />");
    $DocMapContainer.addClass("DocMapBorder");

    var $Table = GetDefaultHTMLTable();
    $Table.addClass("DocMapBorder");

    var $RowBar = new $("<TR />");
    var $Header = new $("<DIV />");
    $Header.attr("id", "DocMapHeader").addClass("DocMapHeader");

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
}
function WriteDocumentMapItem(RS, DocMap, Level) {
    var $DocMap = new $("<DIV />");
    $DocMap.css("margin-left:" + Level * 18 + "px;white-space:nowrap");

    var $Icon = new $("<Image />");
    var $Icon2 = new $("<Image />");
    if (DocMap.Children == null) {
        $DocMap.attr("level", Level);
        $Icon.attr("src", "./reportviewer/Images/EmptyIndent.gif");
    }
    else {
        $Icon.attr("src", "./reportviewer/Images/Drilldown_Collapse.gif").addClass("DocMap-Show");
        $Icon.on("click", function () {
            $Icon.addClass("DocMap-Hidden").removeClass("DocMap-Show");
            $Icon2.addClass("DocMap-Show").removeClass("DocMap-Hidden");
            $("[level='" + (Level) + "']").addClass("DocMap-Hidden");
        });

        $Icon2.attr("src", "./reportviewer/Images/Drilldown_Expand.gif").addClass("DocMap-Hidden");
        $Icon2.on("click", function () {
            $Icon.addClass("DocMap-Show").removeClass("DocMap-Hidden");
            $Icon2.addClass("DocMap-Hidden").removeClass("DocMap-Show");
            $("[level='" + (Level) + "']").removeClass("DocMap-Hidden");
        });
    }

    var $MapNode = new $("<A />");
    $MapNode.addClass("DocMap-Item").attr("title", "Navigate to " + DocMap.Label).html(DocMap.Label);
    $MapNode.on("click", function () {
        NavigateDocumentMap(RS, DocMap.UniqueName);
    });

    $DocMap.append($Icon).append($Icon2).append($MapNode);

    if (DocMap.Children != undefined) {
        Level++;
        $.each(DocMap.Children, function (Index, Obj) {
            $DocMap.append(WriteDocumentMapItem(RS, Obj, Level));
        });
    }
    return $DocMap;
}

//Helper fucntions
function GetHeight($Obj) {
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
    return ConvertToMM(height);

}
function GetElementsStyle(RS, CurrObj) {
    var Style = "";

    Style += GetStyle(RS, CurrObj.SharedElements.Style, CurrObj.NonSharedElements);
    Style += GetStyle(RS, CurrObj.NonSharedElements.Style, CurrObj.NonSharedElements);    
    return Style;
}
function GetElementsTextStyle(CurrObj) {
    var Style = "";

    Style += GetTextStyle(CurrObj.SharedElements.Style, CurrObj.NonSharedElements);
    Style += GetTextStyle(CurrObj.NonSharedElements.Style, CurrObj.NonSharedElements);
    return Style;
}
function GetElementsNonTextStyle(RS, CurrObj) {
    var Style = "";

    Style += GetNonTextStyle(RS, CurrObj.SharedElements.Style, CurrObj.NonSharedElements);
    Style += GetNonTextStyle(RS, CurrObj.NonSharedElements.Style, CurrObj.NonSharedElements);
    return Style;
}
function GetBorderSize(CurrObj, Side) {
    var Obj;
    var DefaultStyle;
    var SideStyle;
    var DefaultSize;
    var SideSize;

    //Need left, top, right bottom border
    Obj = CurrObj.Elements.SharedElements.Style;
    if (Obj != null) {
        DefaultStyle = Obj.BorderStyle;
        SideStyle = Obj["BorderStyle" + Side];
        DefaultSize = Obj.BorderWidth;
        SideSize = Obj["BorderWidth" + Side];
    }
    else {
        Obj = CurrObj.Elements.NonSharedElements.Style;
        if (Obj != null) {
            DefaultStyle = Obj.BorderStyle;
            SideStyle = Obj["BorderStyle" + Side];
            DefaultSize = Obj.BorderWidth;
            SideSize = Obj["BorderWidth" + Side];
        }
    }
    
    if (SideStyle == null && DefaultStyle == 0)
        return 0;
    if (SideStyle == 0)
        return 0;
    if (SideSize == null)
        return ConvertToMM(DefaultSize);
    else
        return ConvertToMM(SideSize);
}
function GetPaddingSize(CurrObj, Side) {
    var Obj;
    var SideSize;

    
    Obj = CurrObj.Elements.SharedElements.Style;
    if (Obj != null) {
        SideSize = Obj["Padding" + Side];
    }
    else {
        Obj = CurrObj.Elements.NonSharedElements.Style;
        if (Obj != null) {
            SideSize = Obj["Padding" + Side];
        }
    }
    return ConvertToMM(SideSize);
}
function GetFullBorderStyle(CurrObj) {
    var Style = "";
    var Obj;

    if (CurrObj.Elements == null)
        return "";

    //Need left, top, right bottom border
    Obj = CurrObj.Elements.SharedElements.Style;
    if (Obj != null) {
        if (Obj.BorderStyle != null)
            Style += "border:" + Obj.BorderWidth + " " + GetBorderStyle(Obj.BorderStyle) + " " + Obj.BorderColor + ";";
        if (Obj.BorderStyleLeft != null || Obj.BorderWidthLeft != null || Obj.BorderColorLeft != null)
            Style += "border-left:" + ((Obj.BorderWidthLeft == null) ? Obj.BorderWidth : Obj.BorderWidthLeft) + " " + ((Obj.BorderStyleLeft == null) ? GetBorderStyle(Obj.BorderStyle) : GetBorderStyle(Obj.BorderStyleLeft)) + " " + ((Obj.BorderColorLeft == null) ? Obj.BorderColor : Obj.BorderColorLeft) + ";";
        if (Obj.BorderStyleRight != null || Obj.BorderWidthRight != null || Obj.BorderColorRight != null)
            Style += "border-right:" + ((Obj.BorderWidthRight == null) ? Obj.BorderWidth : Obj.BorderWidthRight) + " " + ((Obj.BorderStyleRight == null) ? GetBorderStyle(Obj.BorderStyle) : GetBorderStyle(Obj.BorderStyleRight)) + " " + ((Obj.BorderColorRight == null) ? Obj.BorderColr : Obj.BorderColorRight) + ";";
        if (Obj.BorderStyleTop != null || Obj.BorderWidthTop != null || Obj.BorderColorTop != null)
            Style += "border-top:" + ((Obj.BorderWidthTop == null) ? Obj.BorderWidth : Obj.BorderWidthTop) + " " + ((Obj.BorderStyleTop == null) ? GetBorderStyle(Obj.BorderStyle) : GetBorderStyle(Obj.BorderStyleTop)) + " " + ((Obj.BorderColorTop == null) ? Obj.BorderColor : Obj.BorderColorTop) + ";";
        if (Obj.BorderStyleBottom != null || Obj.BorderWidthBottom != null || Obj.BorderColorBottom != null)
            Style += "border-bottom:" + ((Obj.BorderWidthBottom == null) ? Obj.BorderWidth : Obj.BorderWidthBottom) + " " + ((Obj.BorderStyleBottom == null) ? GetBorderStyle(Obj.BorderStyle) : GetBorderStyle(Obj.BorderStyleBottom)) + " " + ((Obj.BorderColorBottom == null) ? Obj.BorderColor : Obj.BorderColorBottom) + ";";
    }
    Obj = CurrObj.Elements.NonSharedElements.Style;
    if (Obj != null) {
        if (Obj.BorderStyle != null)
            Style += "border:" + Obj.BorderWidth + " " + GetBorderStyle(Obj.BorderStyle) + " " + Obj.BorderColor + ";";
        if (Obj.BorderStyleLeft != null || Obj.BorderWidthLeft != null || Obj.BorderColorLeft != null)
            Style += "border-left:" + ((Obj.BorderWidthLeft == null) ? Obj.BorderWidth : Obj.BorderWidthLeft) + " " + ((Obj.BorderStyleLeft == null) ? GetBorderStyle(Obj.BorderStyle) : GetBorderStyle(Obj.BorderStyleLeft)) + " " + ((Obj.BorderColorLeft == null) ? Obj.BorderColor : Obj.BorderColorLeft) + ";";
        if (Obj.BorderStyleRight != null || Obj.BorderWidthRight != null || Obj.BorderColorRight != null)
            Style += "border-right:" + ((Obj.BorderWidthRight == null) ? Obj.BorderWidth : Obj.BorderWidthRight) + " " + ((Obj.BorderStyleRight == null) ? GetBorderStyle(Obj.BorderStyle) : GetBorderStyle(Obj.BorderStyleRight)) + " " + ((Obj.BorderColorRight == null) ? Obj.BorderColr : Obj.BorderColorRight) + ";";
        if (Obj.BorderStyleTop != null || Obj.BorderWidthTop != null || Obj.BorderColorTop != null)
            Style += "border-top:" + ((Obj.BorderWidthTop == null) ? Obj.BorderWidth : Obj.BorderWidthTop) + " " + ((Obj.BorderStyleTop == null) ? GetBorderStyle(Obj.BorderStyle) : GetBorderStyle(Obj.BorderStyleTop)) + " " + ((Obj.BorderColorTop == null) ? Obj.BorderColor : Obj.BorderColorTop) + ";";
        if (Obj.BorderStyleBottom != null || Obj.BorderWidthBottom != null || Obj.BorderColorBottom != null)
            Style += "border-bottom:" + ((Obj.BorderWidthBottom == null) ? Obj.BorderWidth : Obj.BorderWidthBottom) + " " + ((Obj.BorderStyleBottom == null) ? GetBorderStyle(Obj.BorderStyle) : GetBorderStyle(Obj.BorderStyleBottom)) + " " + ((Obj.BorderColorBottom == null) ? Obj.BorderColor : Obj.BorderColorBottom) + ";";
    }
    return Style;
}
function GetMeasurements(CurrObj,includeHeight) {
    var Style = "";
    //TODO:  zIndex

    if (CurrObj == null)
        return "";

    //Top and left are set in set location, height is not set becasue differnt browsers measure and break words differently
    if (CurrObj.Width != null) {
        Style += "width:" + CurrObj.Width + "mm;";
        Style += "min-width:" + CurrObj.Width + "mm;";
        Style += "max-width:" + (CurrObj.Width) + "mm;";
    }

    if (includeHeight && CurrObj.Height != null ){
        Style += "height:" + CurrObj.Height + "mm;";
        Style += "min-height:" + CurrObj.Height + "mm;";
        Style += "max-height:" + (CurrObj.Height) + "mm;";
    }

    return Style;
}
function GetStyle(RS, CurrObj, TypeCodeObj) {
    var Style = "";

    if (CurrObj == null)
        return Style;

    Style += GetNonTextStyle(RS, CurrObj, TypeCodeObj);
    Style += GetTextStyle(CurrObj, TypeCodeObj);

    return Style;
}
function BackgroundRepeatTypesMap() {
    return {
        0: "repeat",    // Repeat
        1: "no-repeat", // Clip
        2: "repeat-x",  // RepeatX
        3: "repeat-y"   // RepeatY
    };
}
function GetImageStyleURL(RS, ImageName) {
    return "url(" + GetImageURL(RS, ImageName) + ")";
}
function GetNonTextStyle(RS, CurrObj, TypeCodeObj) {
    var Style = "";

    if (CurrObj == null)
        return Style;

    if (CurrObj.BackgroundColor != null)
        Style += "background-color:" + CurrObj.BackgroundColor + ";";
    if (CurrObj.BackgroundImage != null)
        Style += "background-image:" + GetImageStyleURL(RS, CurrObj.BackgroundImage.ImageName) + ";";
    if (CurrObj.BackgroundRepeat != null && BackgroundRepeatTypesMap()[CurrObj.BackgroundRepeat] != undefined)
        Style += "background-repeat:" + BackgroundRepeatTypesMap()[CurrObj.BackgroundRepeat] + ";";
    if (CurrObj.PaddingBottom != null)
        Style += "padding-bottom:" + CurrObj.PaddingBottom + ";";
    if (CurrObj.PaddingLeft != null)
        Style += "padding-left:" + CurrObj.PaddingLeft + ";";
    if (CurrObj.PaddingRight != null)
        Style += "padding-right:" + CurrObj.PaddingRight + ";";
    if (CurrObj.PaddingTop != null)
        Style += "padding-top:" + CurrObj.PaddingTop + ";";
    return Style;
}
function GetTextStyle(CurrObj, TypeCodeObj) {

    var Style = "";

    if (CurrObj == null)
        return Style;

    if (CurrObj.UnicodeBiDi != null)
        Style += "unicode-bidi:" + GetBiDi(CurrObj.UnicodeBiDi) + ";";
    if (CurrObj.VerticalAlign != null)
        Style += "vertical-align:" + GetVAligh(CurrObj.VerticalAlign) + ";";
    if (CurrObj.WritingMode != null)
        Style += "layout-flow:" + GetLayoutFlow(CurrObj.WritingMode) + ";";
    if (CurrObj.Direction != null)
        Style += "Direction:" + GetDirection(CurrObj.Direction) + ";";

    if (CurrObj.TextAlign != null)
        Style += "text-align:" + GetTextAlign(CurrObj.TextAlign, TypeCodeObj) + ";";
    if (CurrObj.FontStyle != null)
        Style += "font-style:" + GetFontStyle(CurrObj.FontStyle) + ";";
    if (CurrObj.FontWeight != null)
        Style += "font-weight:" + GetFontWeight(CurrObj.FontWeight) + ";";
    if (CurrObj.FontFamily != null)
        Style += "font-family:" + CurrObj.FontFamily + ";";
    if (CurrObj.FontSize != null)
        Style += "font-size:" + CurrObj.FontSize + ";";
    if (CurrObj.TextDecoration != null)
        Style += "text-decoration:" + GetTextDecoration(CurrObj.TextDecoration) + ";";
    if (CurrObj.Color != null)
        Style += "color:" + CurrObj.Color + ";";
    //   if (CurrObj.Calendar != null)
    //       Style += "calendar:" + GetCalendar(CurrObj.Calendar) + ";";
    //writing-mode:lr-tb;?
    return Style;
}
function GetCalendar(RPLCode) {
    switch (RPLCode) {
        case 0:
            return "Gregorian";
            break;
        case 1:
            return "GregorianArabic";
            break;
        case 2:
            return "GregorianMiddleEastFrench";
            break
        case 3:
            return "GregorianTransliteratedEnglish";
            break
        case 4:
            return "GregorianTransliteratedFrench";
            break
        case 5:
            return "GregorianUSEnglish";
            break
        case 6:
            return "Hebrew";
            break
        case 7:
            return "Hijri";
            break
        case 9:
            return "Korean";
            break
        case 10:
            return "Julian";
            break
        case 11:
            return "Taiwan";
            break
        case 12:
            return "ThaiBuddist";
            break
    }
    return "Gregorian";
}
function GetTextDecoration(RPLCode) {
    switch (RPLCode) {
        case 0:
            return "None";
            break;
        case 1:
            return "Underline";
            break;
        case 2:
            return "Overline";
            break
        case 3:
            return "LineThrough";
            break
    }
    return "None";
}
function GetFontWeight(RPLCode) {
    switch (RPLCode) {
        case 0:
            return "Normal";
            break;
        case 1:
            return "Thin";
            break;
        case 2:
            return "ExtraLight";
            break
        case 3:
            return "Light";
            break
        case 4:
            return "Medium";
            break
        case 5:
            return "SemiBold";
            break
        case 6:
            return "Bold";
            break
        case 7:
            return "ExtraBold";
            break
        case 8:
            return "Heavy";
            break
    }
    return "General";
}
function GetFontStyle(RPLCode) {
    switch (RPLCode) {
        case 0:
            return "Normal";
            break;
        case 1:
            return "Italic";
            break;
    }
    return "Normal";
}
function GetTextAlign(RPLCode, TypeCodeObj) {
    switch (RPLCode) {
        case 0:
            //Default is string, need to handle direction, 15 seems to be decimal not datetime
            if (TypeCodeObj.TypeCode == null)
                return "Left";
            switch (TypeCodeObj.TypeCode) {
                case 3:
                case 6:
                case 7: 
                case 9: 
                case 11: 
                case 12:
                case 13:
                case 14: 
                case 15:
                case 16:              
                    return "Right";
                    break;
                case 4:
                case 17:
                case 18:
                    return "Left";
                    break;
                default:
                    return "Left";
            }

            break;
        case 1:
            return "Left";
            break;
        case 2:
            return "Center";
            break
        case 3:
            return "Right";
            break
    }

}
function GetDirection(RPLCode) {
    switch (RPLCode) {
        case 0:
            return "LTR";
            break;
        case 1:
            return "RTL";
            break;

    }
    return "LTR";
}
function GetLayoutFlow(RPLCode) {
    switch (RPLCode) {
        case 0:
            return "Horizontal";
            break;
        case 1:
            return "Vertical";
            break;
        case 2:
            return "Rotate270";
            break;
    }
    return "Horizontal";
}
function GetVAligh(RPLCode) {
    switch (RPLCode) {
        case 0:
            return "Top";
            break;
        case 1:
            return "Middle";
            break;
        case 2:
            return "Bottom";
            break;
    }
    return "Top";
}
function GetBiDi(RPLCode) {
    switch (RPLCode) {
        case 0:
            return "normal";
            break;
        case 1:
            return "embed";
            break;
        case 2:
            return "BiDiOverride";
            break;
    }
    return "normal";
}
function GetDefaultHTMLTable() {
    var $NewObj = $("<Table/>");

    $NewObj.attr("CELLSPACING", 0);
    $NewObj.attr("CELLPADDING", 0);
    return $NewObj;
}
function GetBorderStyle(RPLStyle) {
    switch (RPLStyle) {
        case 0:
            return "None";
            break;
        case 1:
            return "Dotted";
            break;
        case 2:
            return "Dashed";
            break;
        case 3:
            return "Solid";
            break;
        case 4:
            return "Double";
            break;
    }
    return "None";
}
function GetMeasurmentsObj(CurrObj, Index) {
    var retval = null;

    if (CurrObj.Measurement != null)
        retval = CurrObj.Measurement.Measurements[Index];
    return retval;
}
function ConvertToMM(ConvertFrom) {
    
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
}
function GetListStyle(Style, Level) {
    var ListStyle;
    //Numbered
    if (Style == 1) {
        switch (Level % 3) {
            case 1:
                ListStyle = "decimal";
                break;
            case 2:
                ListStyle = "lower-roman";
                break;
            case 0:
                ListStyle = "lower-latin";
                break;
        }
    }
    //Bulleted
    else if (Style == 2) {
        switch (Level % 3) {
            case 0:
                ListStyle = "square";
                break;
            case 1:
                ListStyle = "disc";
                break;
            case 2:
                ListStyle = "circle";
                break;
        }
    }
    return ListStyle;
}
function StopDefaultEvent(e) {
    //IE
    if (window.ActiveXObject)
        window.event.returnValue = false;
    else {
        e.preventDefault();
        e.stopPropagation();
    }
}



