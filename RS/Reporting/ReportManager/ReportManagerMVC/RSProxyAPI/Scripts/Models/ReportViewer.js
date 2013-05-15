//Global reference to all reports
var Reports = new Object();
//setInterval(function () { SessionPing(); }, 10000);

// ********************* Structures ***************************************

//  The ReportIemContext simplifies the signature for all of the functions to pass context around
function ReportItemContext(RS,CurrObj, CurrObjIndex, CurrObjParent, $HTMLParent, Style,CurrLocation) {
    this.RS = RS;
    this.CurrObj = CurrObj;
    this.CurrObjIndex = CurrObjIndex;
    this.CurrObjParent = CurrObjParent;
    this.$HTMLParent = $HTMLParent;
    this.Style = Style;
    this.CurrLocation = CurrLocation;
}
//  The ReportState Object holds all of the pointers needed to easily manage the report on the client
function ReportState(UID, $ReportOuterDiv, ReportServer, ReportViewerAPI, ReportPath, HasToolbar, $PageContainer) {
    this.UID = UID;
    this.$ReportOuterDiv = $ReportOuterDiv;       
    this.CurPage = 0;
    this.Pages = new Object();
    this.ReportServerURL = ReportServer;
    this.ReportViewerAPI = ReportViewerAPI;
    this.ReportPath = ReportPath;
    this.HasToolbar = HasToolbar;
    this.FloatingToolbarHeight;
    this.$FloatingToolbar;
    this.SessionID = "";
    this.$PageContainer = $PageContainer;
    this.NumPages = 0;
    this.Lock = false;
    this.$ReportContainer = new $("<div class 'report-contaioner' style='position:relative'></div");
    this.$LoadingIndicator = new $("<div id='loadIndicator_" + UID + "' class='loading-indicator'></div>").text("Report loading...");
    this.FloatingHeaders = [];
    this.$PageNav;
    this.$Slider;
    this.externalToolbarHeight;
    this.CreateNav = false;
    this.ParamLoaded = false;
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

// ******************** Page Management ***********************************
function SessionPing() {

    // Ping each report so that the seesion does not expire on the report server
    $.each(Reports, function (index, RS) {
        if (RS.SessionID != null)
            $.get(RS.ReportViewerAPI + "/PingSession/", {
                ReportServerURL: RS.ReportServerURL,
                ReportPath: RS.ReportPath,
                SessionID: RS.SessionID         
            })
            .done(function (Data) {  })
            .fail(function () { console.log("error"); })
    });

}
function UpdateTableHeaders() {

    // For each report on the page call chack to see if a floating header needs updating
    // Update the toolbar
    $.each(Reports, function (repIndex, RS) {
        $.each(RS.FloatingHeaders, function (Index, Obj) {
            SetRowHeaderOffset(Obj.$Tablix, Obj.$RowHeader, RS);
            SetColHeaderOffset(Obj.$Tablix, Obj.$ColHeader, RS);
        });
        if (RS.HasToolbar) {
            SetRowHeaderOffset(RS.$ReportContainer, RS.$FloatingToolbar, RS);
            SetColHeaderOffset(RS.$ReportContainer, RS.$FloatingToolbar, RS);
        }
    });

    

}
function SetColHeaderOffset($Tablix, $ColHeader,RS) {

    //Update floating column headers
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
}
function getToolbarHeightWithOffset(rs) {
    if (rs.externalToolbarHeight == null) {
        return rs.ToolbarHeight;
    }

    return rs.externalToolbarHeight();
}
function SetRowHeaderOffset($Tablix,$RowHeader,RS){
    //  Update floating row headers

    if ($RowHeader == null)
        return;

    toolbarOffset = 0;

    // Handle toolbar special
    if (RS.HasToolbar)
        toolbarOffset = getToolbarHeightWithOffset(RS);
    if ($RowHeader == RS.$FloatingToolbar)
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
}
function HideTableHeaders() {
    // On a touch device hide the headers during a scroll if possible
    
    $.each(Reports, function (repIndex, RS) {
        $.each(RS.FloatingHeaders, function (Index, Obj) {
            if (Obj.$RowHeader != null) Obj.$RowHeader.css("display", "none");
            if (Obj.$ColHeader != null) Obj.$ColHeader.css("display", "none");
        });
        if (RS.HasToolbar)
            RS.$FloatingToolbar.css("display", "none");
    });
    

}
function SetActionCursor(Ob) {
    Ob.style.cursor = "pointer";
}
function AddLoadingIndicator(RS) {
    RS.$ReportContainer.append(RS.$LoadingIndicator);
}
function RemoveLoadingIndicator(RS) {
    RS.$LoadingIndicator.detach();
}
function SetPage(RS, NewPageNum, OldPage) {
    //  Load a new page into the screen and udpate the toolbar

    if (!RS.Pages[NewPageNum].IsRendered)
        RenderPage(RS, NewPageNum);
    RS.$PageContainer.append(RS.Pages[NewPageNum].$Container)
    RS.Pages[NewPageNum].$Container.fadeIn("normal");
    if (OldPage != null)
        OldPage.$Container.detach();
    RS.CurPage = NewPageNum;
    $("input." + RS.UID).each(function () { $(this).val(NewPageNum); });
    RS.Lock = 0;
}
function RefreshReport(RS) {
    // Remove all cached data on the report and re-run
    Page = RS.Pages[RS.CurPage];
    RS.SessionID = "";
    RS.Pages = new Object();
    LoadPage(RS, 1, Page, false);
}
function GetToolbar(UID) {
    var $Toolbar = $("<Table/>");
    var $Row = $("<TR/>");
    var $Cell;

    $Toolbar.attr("class", "toolbar");

    $Cell = new $("<TD/>");
    $Cell.attr("class", "spacer10mm");
    $Cell.on("click", { id: UID }, function (e) { ShowParms(Reports[e.data.id]); });
    $Cell.on("mouseover", function (event) { SetActionCursor(this); });
    $Cell.html("Par");
    $Row.append($Cell);

    $Cell = new $("<TD/>");
    $Cell.attr("class", "spacer20mm");
    $Cell.on("click", { id: UID }, function (e) { ShowNav(e.data.id); });
    $Cell.on("mouseover", function (event) { SetActionCursor(this); });
    $Cell.html("Nav");
    $Row.append($Cell);

    $Cell = new $("<TD/>");
    $Cell.attr("class", "spacer20mm");
    $Row.append($Cell);

    $Cell = new $("<TD/>");
    $Cell.attr("class", "spacer10mm");
    $Cell.on("click", { id: UID }, function (e) { RefreshReport(Reports[e.data.id]); });
    $Cell.on("mouseover", function (event) { SetActionCursor(this); });
    $Cell.html("<IMG class='buttonicon' src='/Images/ReportViewer/Refresh.png'/>");
    $Row.append($Cell);

    $Cell = new $("<TD/>");
    $Cell.attr("class", "spacer10mm");
    $Row.append($Cell);

    $Cell = new $("<TD/>");
    $Cell.attr("class", "spacer10mm");
    $Cell.on("click", { id: UID }, function (e) { NavToPage(Reports[e.data.id], 1); });
    $Cell.on("mouseover", function (event) { SetActionCursor(this); });
    $Cell.html("<IMG class='buttonicon' src='/Images/ReportViewer/Backward.png'/>");
    $Row.append($Cell);

    $Cell = new $("<TD/>");
    $Cell.attr("class", "spacer5mm");

    $Cell.on("click", { id: UID }, function (e) { NavToPage(Reports[e.data.id], Reports[UID].CurPage - 1); });
    $Cell.on("mouseover", function (event) { SetActionCursor(this); });
    $Cell.html("<IMG class='buttonicon' src='/Images/ReportViewer/Previous.png'/>");
    $Row.append($Cell);

    $Cell = new $("<input/>");
    $Cell.addClass("toolbartextbox");
    $Cell.addClass(UID);
    $Cell.attr("type", "number")
    $Cell.on("keypress", { id: UID, input: $Cell }, function (e) { if (e.keyCode == 13) NavToPage(Reports[e.data.id], e.data.input.val()); });
    $Row.append($Cell);

    $Cell = new $("<TD/>");
    $Cell.attr("class", "spacer10mm");
    $Cell.on("click", { id: UID }, function (e) { NavToPage(Reports[e.data.id], Reports[e.data.id].CurPage + 1); });
    $Cell.on("mouseover", function (event) { SetActionCursor(this); });
    $Cell.html("<IMG class='buttonicon' src='/Images/ReportViewer/Next.png'/>");
    $Row.append($Cell);

    $Cell = new $("<TD/>");    
    $Cell.attr("style", "width:100%;");
    $Row.append($Cell);

    $Toolbar.append($Row);
    return $Toolbar;
}
function NavToPage(RS, NewPageNum) {

    if (RS.Lock == 0) {
        RS.Lock = 1;
        LoadPage(RS, NewPageNum, RS.Pages[RS.CurPage], false);
    }

}
function ShowParms(RS) {
    //alert("Show");
    if (RS.ParamLoaded == true)
        $(".Parameter-Panel").animate({ height: 'toggle' }, 100);
}
function LoadAllPages(RS,InitPage) {

    for (var i = 1; i <= RS.NumPages; i++)
        if (RS.Pages[i] == null)
            if (i != InitPage)
                LoadPage(RS, i, null, true);

}
function SetImage(Data, RS) {
    if (RS.Pages[PageNum] == null)
        RS.Pages[PageNum] = new ReportPage(null, null);
    RS.Pages[PageNum].Image = Data;
}
function CreateSlider(RS, ReportViewerUID) {
    $Container = RS.$PageNav;
    $Container.css("display", "block");
    $Slider = new $('<DIV />');
    $Slider.attr('class', 'sky-carousel');
    $Slider.attr('style', 'height: 150px; display: none;'); // Need to make this none
    $SliderWrapper = new $('<DIV />');
    $SliderWrapper.attr('class', 'sky-carousel-wrapper');
    $Slider.append($SliderWrapper);
    $List = new $('<UL />');
    $List.attr('class', 'sky-carousel-container');

    var i
    var pHeight = 0;
    var pWidth = 0;

    for (i = 1; i <= RS.NumPages; i++) {
        if (RS.Pages[i].ReportObj.Report.PageContent.Measurement.Measurements[0].Height > pHeight)
            pHeight = RS.Pages[i].ReportObj.Report.PageContent.Measurement.Measurements[0].Height
        if (RS.Pages[i].ReportObj.Report.PageContent.Measurement.Measurements[0].Width > pWidth)
        pWidth = RS.Pages[i].ReportObj.Report.PageContent.Measurement.Measurements[0].Width
    }
    pHeight = (pHeight * 0.0393700787) + "in";
    pWidth = (pWidth * 0.0393700787) + "in";
    for ( i = 1; i <= RS.NumPages; i++) {
        
        var url = RS.ReportViewerAPI + '/GetThumbnail/?ReportServerURL=' + RS.ReportServerURL + '&ReportPath='
                + RS.ReportPath + '&SessionID=' + RS.SessionID + '&PageNumber=' + i + '&PageHeight='+ pHeight + '&PageWidth=' + pWidth;
        $ListItem = new $('<LI />');
        $List.append($ListItem);
        $Caption = new $('<DIV />');
        $Caption.html("<h3 class='centertext'>" + i.toString() + "</h3>");
        $Caption.attr('class', 'center');
        $Thumbnail = new $('<IMG />');
        $Thumbnail.attr('class', 'pagethumb');
        $Thumbnail.attr('src', url);
        $Thumbnail.attr("onclick", "NavToPage(Reports['" + ReportViewerUID + "']," + i + ")");
        // Need to add onclick
        $ListItem.append($Caption);
        $ListItem.append($Thumbnail);
    }

    $SliderWrapper.append($List);
    $Container.append($Slider);

    $Slider.carousel({
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

    RS.$PageNav = $Container;
    RS.$Slider = $Slider;
    RS.CreateNav = true;
}
function ShowNav(UID) {
    if (!Reports[UID].CreateNav)
        CreateSlider(Reports[UID], UID);
    if (Reports[UID].$Slider.is(":visible")) {
        Reports[UID].$Slider.fadeOut("slow");
        Reports[UID].$PageNav.fadeOut("fast");
    }
    else {
        Reports[UID].$PageNav.fadeIn("fast");
        Reports[UID].$Slider.fadeIn("slow");
    }
}

//Page Loading
function InitReport(ReportServer, ReportViewerAPI, ReportPath, HasToolbar, PageNum, UID) {
    InitReportEx(ReportServer, ReportViewerAPI, ReportPath, HasToolbar, PageNum, UID, null, 0)
}
function InitReportEx(ReportServer, ReportViewerAPI, ReportPath, HasToolbar, PageNum, UID, ToolbarUID, NavUID, toolbarOffset) {
    var $Table = new $("<table/>");
    var $Row = new $("<TR/>");
    var $Cell;
    var $FloatingToolbar;
    var RS = new ReportState(UID, $("#" + UID), ReportServer,ReportViewerAPI, ReportPath, HasToolbar, $Row);
    
    Reports[UID] = RS;
    if (NavUID != null) {
        RS.$PageNav = $("#" + NavUID);
        RS.$PageNav.css("display", "none");
    }
    
    if (HasToolbar) {
        var $tb = GetToolbar(UID);
        RS.ToolbarHeight = GetHeight($tb) * 3.78;  //convert to px

        if (ToolbarUID == null) {
            $Row = new $("<TR/>");            
            $Cell = new $("<TD/>");
            $Cell.append($tb);            
            $Row.append($Cell);
            $Row.addClass('inlinetoolbar', 0, 0, null);
            $FloatingToolbar = $Row.clone(true, true).css({ display: "none", position: "absolute", top: "0px", left: "0px" });
            RS.$FloatingToolbar = $FloatingToolbar;
            $Table.append($Row);
            $Table.append($FloatingToolbar);
        } else {
            $Container = $('#' + ToolbarUID);
            $Container.append($tb);

            if (toolbarOffset != null) {
                RS.externalToolbarHeight = toolbarOffset;
            }
        }
    }

    $(window).scroll(UpdateTableHeaders);
    $(window).bind('touchmove', HideTableHeaders);
    //window.addEventListener("gesturechange", UpdateTableHeaders, false);
  
    //Log in screen if needed

    //If Parameters needed show Parameters


    //load the report Page requested  
    $Table.append(RS.$PageContainer);    
    RS.$ReportContainer.append($Table);
    AddLoadingIndicator(RS);
    RS.$ReportOuterDiv.append(RS.$ReportContainer);
    LoadPage(RS, PageNum, null, false, NavUID);    
}

function LoadPage(RS, NewPageNum, OldPage, LoadOnly) {
    if (OldPage != null)
        if (OldPage.$Container != null)
            OldPage.$Container.fadeOut("fast");

    if (RS.Pages[NewPageNum] != null)
        if (RS.Pages[NewPageNum].$Container != null) {
            if (!LoadOnly)
                SetPage(RS, NewPageNum);
            return;
        }

    $.getJSON(RS.ReportViewerAPI + "/GetJSON/", {
        ReportServerURL: RS.ReportServerURL,
        ReportPath: RS.ReportPath,
        SessionID: RS.SessionID,
        PageNumber: NewPageNum,
        ParameterList: null
    })
    .done(function (Data) {
        if (Data.Type != undefined && Data.Type == "Parameters") {
            if (RS.ParamLoaded == true) {
                $(".Parameter-Panel").detach();
            }
            WriteParameterPanel(Data, RS, NewPageNum, LoadOnly);
            RS.ParamLoaded = true;
        }
        else {
            WritePage(Data, RS, NewPageNum, OldPage, LoadOnly);
            if (!LoadOnly) LoadAllPages(RS, NewPageNum);
        }
    })
    .fail(function () { console.log("error"); RemoveLoadingIndicator(RS); })
}
function WritePage(Data, RS, NewPageNum, OldPage, LoadOnly) {
    var $Report = $("<Div/>");
    
    //Error, need to handle this better
    if (Data == null) return;

    if (RS.Pages[NewPageNum] == null)
        RS.Pages[NewPageNum] = new ReportPage($Report, Data);
    else {
        RS.Pages[NewPageNum].$Container = $Report;
        RS.Pages[NewPageNum].ReportObj = Data;
    }
    RS.SessionID = Data.SessionID;
    RS.NumPages = Data.NumPages;

    //Sections
    RemoveLoadingIndicator(RS);
    if (!LoadOnly) {
        RenderPage(RS, NewPageNum);
        SetPage(RS, NewPageNum, OldPage);
    }
}
function RenderPage(RS, pageNum) {
     //Write Style   
    RS.Pages[pageNum].$Container.attr("Style", GetStyle(RS.Pages[pageNum].ReportObj.Report.PageContent.PageStyle));
    $.each(RS.Pages[pageNum].ReportObj.Report.PageContent.Sections, function (Index, Obj) { WriteSection(new ReportItemContext(RS, Obj, Index, RS.Pages[pageNum].ReportObj.Report.PageContent, RS.Pages[pageNum].$Container, "")); });
    RS.Pages[pageNum].IsRendered = true;
}
function WriteParameterPanel(Data, RS, pageNum, LoadOnly) {
    var LoadOnly = false;
    var $ParameterContainer = GetDefaultHTMLTable();
    $ParameterContainer.attr("class", "Parameter-Panel");
    var $Row = new $("<TR />");
    var $Col = $("<TD/>");

    var $Form = new $("<Form />");
    $Form.attr("id", "ParamsForm");
    var $SecondContainer = GetDefaultHTMLTable();
    $SecondContainer.addClass("Parameter-Form");

    $.each(Data.ParametersList, function (Index, Obj) {        
        $SecondContainer.append(WriteParameterControl(new ReportItemContext(RS, Obj, Index, RS.CurrObj, new $("<TR />"), "", "")));
    });

    $Form.append($SecondContainer);
    ResetValidateMessage();
    $Form.validate({
        errorPlacement: function (error, element) {
            if (element.is(":radio"))
                error.appendTo(element.parent("span").parent("td").next("td"));
            else {
                if ($(element).attr("IsMultiple") == "True")
                    error.appendTo(element.parent("div").parent("td").next("td"));
                else
                    error.appendTo(element.parent("td").next("td"));
            }
        },
        highlight: function (element) {
            $(element).addClass("Parameter-Error");           
        },
        unhighlight: function (element) {
            $(element).removeClass("Parameter-Error");
        }
    });
    $Col.append($Form);
    $Row.append($Col);

    var $ViewReport_TD = new $("<TD/>");
    $ViewReport_TD.attr("style", "margin:4px;text-align:center");

    var $ViewReport = new $("<input/>");
    $ViewReport.attr("id", "Parameter_ViewReport");
    $ViewReport.attr("type", "button");
    $ViewReport.attr("value", "View Report");
    $ViewReport.on("click", function () {
        if ($("#ParamsForm").valid() == true) {
            if (RS.Pages[pageNum] != null) {
                RS.Pages[pageNum].$Container.detach();
            }
            AddLoadingIndicator(RS);
            var parameterList = GetParamsList();
            
            $.getJSON(RS.ReportViewerAPI + "/GetJSON/", {
                ReportServerURL: RS.ReportServerURL,
                ReportPath: RS.ReportPath,
                SessionID: RS.SessionID,
                PageNumber: pageNum,
                ParameterList: parameterList
            })
            .done(function (Data) { WritePage(Data, RS, pageNum, null, LoadOnly); if (!LoadOnly) LoadAllPages(RS, pageNum); })
            .fail(function () { console.log("error"); RemoveLoadingIndicator(RS); })
        }
    });

    $ViewReport_TD.append($ViewReport);
    var $SpaceTD = new $("<TD />");
    $SpaceTD.html("&nbsp");
    $Row.append($SpaceTD);
    $Row.append($ViewReport_TD);

    $ParameterContainer.append($Row);
    
    //Same Hierarchy with Toolbar
    RS.$PageContainer.append($ParameterContainer);
    //RS.$PageContainer.append(WriteParameterToggle());
    //RS.$ReportContainer.append(RS.$PageContainer);   
    RemoveLoadingIndicator(RS);
}
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
        $RI = WriteReportItems(new ReportItemContext(RIContext.RS, Obj, Index, RIContext.CurrObj, new $("<Div/>"), "", Measurements[Index]));
                       
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

        //Backgroundcolor goes on container        
        if ((RIContext.CurrObj.ReportItems[Index].Element != null) && (RIContext.CurrObj.ReportItems[Index].Elements.SharedElements.Style != null) && (RIContext.CurrObj.ReportItems[Index].Elements.SharedElements.Style.BackgroundColor != null))
            Style += "background-color:" + RIContext.CurrObj.ReportItems[Index].Elements.SharedElements.Style.BackgroundColor + ";";
        else if ((RIContext.CurrObj.ReportItems[Index].Element != null) && (RIContext.CurrObj.ReportItems[Index].Elements.NonSharedElements.Style != null) && (RIContext.CurrObj.ReportItems[Index].Elements.NonSharedElements.Style.BackgroundColor != null))
            Style += "background-color:" + RIContext.CurrObj.ReportItems[Index].Elements.NonSharedElements.Style.BackgroundColor + ";";

        $LocDiv.attr("Style", Style);
        $LocDiv.append($RI);
        RIContext.$HTMLParent.append($LocDiv);
    });

    Style = "position:relative;" + GetElementsStyle(RIContext.CurrObj.Elements);
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
    var $NewObj = RIContext.$HTMLParent;

    Style += GetMeasurements(GetMeasurmentsObj(RIContext.CurrObjParent, RIContext.CurrObjIndex));
    Style += GetElementsStyle(RIContext.CurrObj.Elements);
    Style += "white-space:pre-wrap;word-break:break-word;word-wrap:break-word;";      
    $NewObj.attr("Style", Style);

    if (RIContext.CurrObj.Paragraphs.length == 0) {
        if (RIContext.CurrObj.Elements.SharedElements.Value != null)
            $NewObj.html(RIContext.CurrObj.Elements.SharedElements.Value);
        else if (RIContext.CurrObj.Elements.NonSharedElements.Value != null)
            $NewObj.html(RIContext.CurrObj.Elements.NonSharedElements.Value);
        else
            $NewObj.html("&nbsp");
    }
    else {
        //Handle each paragraphs
        $.each(RIContext.CurrObj.Paragraphs, function (Index, Obj) {
            var $Paragraph = new $("<DIV />");
            $Paragraph.attr("name", Obj.Paragraph.NonSharedElements.UniqueName);

            var ParagraphStyle = "";
            ParagraphStyle += GetMeasurements(GetMeasurmentsObj(Obj, Index));
            ParagraphStyle += GetElementsStyle(Obj.Paragraph);
            $Paragraph.attr("Style", ParagraphStyle);

            //Handle each TextRun
            for (i = 0; i < Obj.TextRunCount; i++) {
                var $TextRun;
                var flag = true;
                //With or without Action in TextRun
                if (Obj.TextRuns[i].Elements.NonSharedElements.ActionInfo == undefined) {
                    $TextRun = new $("<SPAN />");
                }
                else {
                    $TextRun = new $("<A />");
                    for (j = 0; j < Obj.TextRuns[i].Elements.NonSharedElements.ActionInfo.Count; j++) {
                        WriteAction(Obj.TextRuns[i].Elements.NonSharedElements.ActionInfo.Actions[j], $TextRun);
                    }
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
                    TextRunStyle += GetElementsStyle(Obj.TextRuns[i].Elements);
                    $TextRun.attr("Style", TextRunStyle);
                }

                $Paragraph.append($TextRun);
            }

            $NewObj.append($Paragraph);
        });
    }
    return RIContext.$HTMLParent;
}
function WriteImage(RIContext) {
    var $NewObj = new Image();

    var Src = RIContext.RS.ReportViewerAPI + "/GetImage/?";
    var Style = "max-height=100%;max-width:100%;" + GetElementsStyle(RIContext.CurrObj.Elements);
    
    Style += GetMeasurements(GetMeasurmentsObj(RIContext.CurrObjParent, RIContext.CurrObjIndex));
    Src += "ReportServerURL=" + RIContext.RS.ReportServerURL;
    Src += "&SessionID=" + RIContext.RS.SessionID;

    if (RIContext.CurrObj.Type == "Image") {
        var sizingType = RIContext.CurrObj.Elements.SharedElements.Sizing;
        Src += "&ImageID=" + RIContext.CurrObj.Elements.NonSharedElements.ImageDataProperties.ImageName;
        if (sizingType == 3) {
            RIContext.$HTMLParent.addClass("overflow-hidden");
        }
    }
    else {
        Src += "&ImageID=" + RIContext.CurrObj.Elements.NonSharedElements.StreamName;
    }

    $NewObj.src = Src;
    $($NewObj).attr("style", Style);
    $NewObj.alt = "Cannot display image";
    if (RIContext.CurrObj.Elements.NonSharedElements.ActionImageMapAreas != undefined) {
        $NewObj.useMap = "#Map_" + RIContext.RS.SessionID;
    }

    $NewObj.onload = function () {
        WriteActionImageMapAreas(RIContext, this.width, this.height);
        ResizeImage(this, sizingType, RIContext.CurrLocation.Height, RIContext.CurrLocation.Width);
    };
    WriteBookMark(RIContext);
  

    RIContext.$HTMLParent.append($NewObj);
    return RIContext.$HTMLParent;
}
function WriteAction(RIContext,Action, Control) {
    if (Action.HyperLink != undefined) {
        Control.attr("href", Action.HyperLink);
    }
    else if (Action.BookmarkLink != undefined) {
        Control.attr("href", "#" + Action.BookmarkLink);
    }
    else {
        //Control.attr("href", Action.DrillthroughUrl);
        $(Control).click(function () {
            var reportPath = Action.DrillthroughUrl.substring(Action.DrillthroughUrl.indexOf('?') + 1).replace('%2F', '/');
            //alert(reportPath);
            RIContext.RS.ReportPath = reportPath;
            LoadPage(RIContext.RS, RIContext.RS.CurPage, RIContext.RS.Pages[RIContext.RS.CurPage], false);
            //InitReport(RIContext.RS.ReportServerURL, RIContext.RS.ReportViewerAPI, reportPath, true, 1, RIContext.RS.UID);
        });
    }
}
function WriteActionImageMapAreas(RIContext, width, height) {
    var ActionImageMapAreas = RIContext.CurrObj.Elements.NonSharedElements.ActionImageMapAreas;
    if (ActionImageMapAreas != undefined) {
        var $Map = $("<MAP/>");
        $Map.attr("name", "Map_" + RIContext.RS.SessionID);
        $Map.attr("id", "Map_" + RIContext.RS.SessionID);

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
function ResizeImage(img, sizingType, maxHeight, maxWidth) {    
    var ratio = 0;
    var height = 0;
    var width = 0;

    height = ConvertToMM($(img).height() + "px");
    width = ConvertToMM($(img).width() + "px");
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
    if (RIContext.CurrObj.Elements.SharedElements.Bookmark != undefined) {
        var $node = $("<a/>");
        $node.attr("name", RIContext.CurrObj.Elements.SharedElements.Bookmark);
        RIContext.$HTMLParent.append($node);
    }
}
function WriteTablixCell(RIContext, Obj, Index, BodyCellRowIndex) {
    var $Cell = new $("<TD/>");
    var Style = "";
    var width;
    var height;
    var hbordersize = 0;
    var wbordersize = 0;

    // Width and Border go on the Cell so we need to subtract out border width from content width, allign the TD to the Top in case another column grows
    Style = "vertical-align:top;padding:0;margin:0;";
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
    $Cell.append(WriteReportItems(new ReportItemContext(RIContext.RS, Obj.Cell.ReportItem, Index, RIContext.CurrObj, new $("<Div/>"), "margin:0;overflow:hidden;", new TempMeasurement(height, width))));
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
    Style += GetElementsStyle(RIContext.CurrObj.Elements);
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
    RIContext.$HTMLParent.attr("Style", GetElementsStyle(RIContext.CurrObj.SubReportProperties));    
    //var subReportName = $("<h2/>").css("text-align", "center").html("SubReport: "+RIContext.CurrObj.SubReportProperties.SharedElements.ReportName);
    //RIContext.$HTMLParent.append(subReportName);

    $.each(RIContext.CurrObj.BodyElements, function (Index, Obj) {
        var $RI = WriteRectangle(new ReportItemContext(RIContext.RS, Obj, Index, RIContext.CurrObj, new $("<Div/>"), ""));
        RIContext.$HTMLParent.append($RI);
    });

    return RIContext.$HTMLParent;
}
function WriteLine(RIContext) {

    var Style = GetFullBorderStyle(RIContext.CurrObj);
    var measurement = GetMeasurmentsObj(RIContext.CurrObjParent, RIContext.CurrObjIndex);

    Style += "width:" + measurement.Width + "mm;height:" + measurement.Height + "mm;";

    //TODO:Slant
    if (RIContext.CurrObj.Elements.SharedElements.Slant == null || RIContext.CurrObj.Elements.SharedElements.Slant == 0)
        a = 1

    RIContext.$HTMLParent.attr("Style", Style + RIContext.Style);
    return RIContext.$HTMLParent;

}
function WriteParameterControl(RIContext) {
    var $TD_Lable = new $("<TD />");
    var $lable = new $("<span />");
    $lable.addClass("Parameter-Lable");
    var Name = RIContext.CurrObj.Name;
    $lable.html(Name);

    $TD_Lable.append($lable);

    //If the control have valid values, then generate a select control
    var $TD_Control = new $("<TD />");
    var $element = null;
    if (RIContext.CurrObj.ValidValues != "") {
        //dropdown with checkbox
        if (RIContext.CurrObj.MultiValue == "True") {
            $element = new $("<Div />");
            WriteDropDownWithCheckBox(RIContext.CurrObj, $element);
        }
        else {
            $element = new $("<select />");
            WriteDropDownControl(RIContext.CurrObj, $element);
        }
    }
    else {
        if (RIContext.CurrObj.Type == "Boolean") {
            var radioValues = new Array();
            radioValues[0] = "True";
            radioValues[1] = "False";

            $element = new $("<Span />");
            for (value in radioValues) {
                var $radioItem = new $("<input/>");
                $radioItem.addClass("Parameter");
                $element.attr("IsMultiple", RIContext.CurrObj.MultiValue);
                $radioItem.addClass("Parameter-Radio");
                $element.attr("DataType", RIContext.CurrObj.Type);
                $radioItem.addClass(RIContext.CurrObj.Name);
                
                $radioItem.attr("type", "radio");
                $radioItem.attr("name", RIContext.CurrObj.Name);
                $radioItem.attr("value", radioValues[value]);
                $radioItem.attr("id", RIContext.CurrObj.Name + "_radio" + "_" + radioValues[value]);
                $radioItem.attr("DataType", RIContext.CurrObj.Type);
                GetParameterControlProperty(RIContext.CurrObj, $radioItem);

                var $lableTrue = new $("<lable/>");
                $lableTrue.html(radioValues[value]);
                $lableTrue.attr("for", RIContext.CurrObj.Name + "_radio" + "_" + radioValues[value]);

                $element.append($radioItem);
                $element.append($lableTrue);
            }
        }
        else {
            $element = new $("<input/>");
            $element.attr("class", "Parameter");
            $element.attr("IsMultiple", RIContext.CurrObj.MultiValue);
            $element.attr("DataType", RIContext.CurrObj.Type);
            $element.attr("type", "text");
            $element.attr("size", "30");
            $element.attr("id", Name);

            GetParameterControlProperty(RIContext.CurrObj, $element);

            switch (RIContext.CurrObj.Type) {
                case "DateTime":
                    //Format: ISO8601
                    $element.datepicker({ dateFormat: 'yy-mm-dd' });
                    $element.attr("dateISO", "true");
                    break;
                case "Integer":
                case "Float":
                    $element.attr("number", "true");
                    break;
                case "String":
                    break;
            }
        }
    }    
    $TD_Control.append($element);
    $TD_Control.append(AddNullableCheckBox(RIContext.CurrObj, $element));
    var $TD_Status = new $("<TD/>");
    $TD_Status.addClass("Status");
    RIContext.$HTMLParent.append($TD_Lable);
    RIContext.$HTMLParent.append($TD_Control);
    RIContext.$HTMLParent.append($TD_Status);

    return RIContext.$HTMLParent;
}
function WriteParameterToggle() {
    //var $Container = new $("<Div />");
    //$Container.attr("class", "ToggleParam");

    //var $ToggleIcon = new $("<Img />");
    //$ToggleIcon.attr("alt", "Show / Hide Parameters");
    //$ToggleIcon.attr("title", "Show / Hide Parameters");
    //$ToggleIcon.attr("src", "/images/Parameter_Collapse.png");
    //$Container.on("mouseover", function (event) { SetActionCursor(this); });

    //$Container.on("click", function () {
    //    $(".Parameter-Panel").toggle("fast");
    //    if ($ToggleIcon.attr("src") == "/images/Parameter_Collapse.png") 
    //        $ToggleIcon.attr("src", "/images/Parameter_Expand.png");
    //    else if ($ToggleIcon.attr("src") == "/images/Parameter_Expand.png") 
    //        $ToggleIcon.attr("src", "/images/Parameter_Collapse.png");
    //});

    //$Container.append($ToggleIcon);
    //return $Container;   
}
function GetParameterControlProperty(Obj, $Control) {
    $Control.attr("name", Obj.Name);
    $Control.attr("AllowBlank", Obj.AllowBlank);
    if (Obj.QueryParameter == "True" | Obj.Nullable != "True") {
        $Control.attr("required", "true");
        $Control.watermark("Required");
    }
    
    //if (Obj.PromptUser == "True") {
    //    $Control.attr("Title", Obj.Prompt);
    //}
    $Control.attr("ErrorMessage", Obj.ErrorMessage);
}
function AddNullableCheckBox(Obj, $Control) {
    if (Obj.Nullable == "True") {
        var $NullableSpan = new $("<Span />");

        var $Checkbox = new $("<Input />");
        $Checkbox.attr("type", "checkbox");
        $Checkbox.attr("class", "Parameter-Checkbox");
        $Checkbox.attr("name", Obj.Name);

        $Checkbox.on("click", function () {
            if ($Checkbox.attr("checked") == "checked") {
                $Checkbox.removeAttr("checked");
                if (Obj.Type == "Boolean") {
                    $(".Parameter-Radio." + Obj.Name).removeAttr("disabled");
                }
                else {
                    $Control.removeAttr("disabled");
                    $Control.removeClass("Parameter-Disabled").addClass("Parameter-Enabled");
                }
            }
            else {
                $Checkbox.attr("checked", "true");
                if (Obj.Type == "Boolean") {
                    $(".Parameter-Radio." + Obj.Name).attr("disabled", "true");
                }
                else {
                    $Control.attr("disabled", "true");
                    $Control.removeClass("Parameter-Enable").addClass("Parameter-Disabled");
                }
            }
        });

        var $NullableLable = new $("<Lable />");
        $NullableLable.html("NULL");
        $NullableLable.addClass("Parameter-Lable");

        $NullableSpan.append($Checkbox);
        $NullableSpan.append($NullableLable);

        return $NullableSpan;
    }
    else
        return null;
}
function WriteDropDownControl(Obj, $Control) {    
    $Control.addClass("Parameter");
    $Control.attr("IsMultiple", Obj.MultiValue);
    $Control.addClass("Parameter-Select");
    $Control.attr("id", Obj.Name);
    $Control.attr("DataType", Obj.Type);
    GetParameterControlProperty(Obj, $Control);

    var $defaultOption = new $("<option />");
    $defaultOption.attr("value", "");        
    $defaultOption.attr("multiple", "multiple");
    $defaultOption.html("&#60Select a Value&#62");
    $Control.append($defaultOption);

    for (index in Obj.ValidValues) {
        var $option = new $("<option />");
        $option.attr("value", Obj.ValidValues[index].Value);
        $option.html(Obj.ValidValues[index].Key);
        $Control.append($option);
    }
}
function WriteDropDownWithCheckBox(Obj, $Control) {
    var $MultipleCheckBox = new $("<Input />");
    $MultipleCheckBox.attr("type", "text");
    $MultipleCheckBox.attr("id", Obj.Name);
    $MultipleCheckBox.attr("class", "ParameterClient");
    $MultipleCheckBox.attr("IsMultiple", Obj.MultiValue);
    $MultipleCheckBox.attr("DataType", Obj.Type);
    GetParameterControlProperty(Obj, $MultipleCheckBox);
    $MultipleCheckBox.on("click", function () { PopupDropDownPanel(Obj); });

    var $HiddenCheckBox = new $("<Input />");
    $HiddenCheckBox.attr("type", "hidden");
    $HiddenCheckBox.attr("name", Obj.Name);
    $HiddenCheckBox.attr("IsMultiple", Obj.MultiValue);
    $HiddenCheckBox.attr("id", Obj.Name + "_hidden");
    $HiddenCheckBox.attr("class", "Parameter");
    $HiddenCheckBox.attr("DataType", Obj.Type);

    var $OpenDropDown = new $("<Img />");
    $OpenDropDown.attr("src", "/Images/OpenDropDown.png");
    $OpenDropDown.attr("alt", "Open DropDown List");
    $OpenDropDown.on("click", function () { PopupDropDownPanel(Obj); });

    var $DropDownContainer = new $("<Div />");
    $DropDownContainer.attr("id", Obj.Name + "_DropDown");
    $DropDownContainer.addClass("Parameter-DropDown");
    $DropDownContainer.addClass("Parameter-Dropdown-Hidden");

    var $Table = GetDefaultHTMLTable();
    Obj.ValidValues.push({ Key: "Select All", Value: "Select All" });

    for (index in Obj.ValidValues) {
        var key;
        var value;
        if (index == 0) {
            var SelectAll = Obj.ValidValues[Obj.ValidValues.length - 1];
            key = SelectAll.Key;
            value = SelectAll.Value;
        }
        else {
            key = Obj.ValidValues[index-1].Key;
            value = Obj.ValidValues[index-1].Value;
        }

        var $Row = new $("<TR />");
        var $Col = new $("<TD/>");

        var $Span = new $("<Span />");
        var $Checkbox = new $("<Input />");
        $Checkbox.attr("type", "checkbox");
        $Checkbox.attr("id", Obj.Name + "_DropDown_" + value);
        $Checkbox.attr("class", Obj.Name + "_DropDown_CB");
        $Checkbox.attr("name", Obj.Name + "_DropDown_CB");
        $Checkbox.attr("value", value);
        $Checkbox.on("click", function () {
            if (this.value == "Select All" & this.checked == true) {
                $("." + Obj.Name + "_DropDown_CB").each(function (i) {
                    this.checked = true;
                });
            }
            if (this.value == "Select All" & this.checked == false) {
                $("." + Obj.Name + "_DropDown_CB").each(function (i) {
                    this.checked = false;
                });
            }
        });

        var $Lable = new $("<Lable />");
        $Lable.attr("for", Obj.Name + "_DropDown_" + value);
        $Lable.attr("id", Obj.Name + "_DropDown_" + value + "_lable");
        $Lable.html(key);

        //$Col.append($Checkbox);
        //$Col.append($Lable);
        $Span.append($Checkbox);
        $Span.append($Lable);
        $Col.append($Span);
        $Row.append($Col);
        $Table.append($Row);
    }
    $DropDownContainer.append($Table);

    $Control.append($MultipleCheckBox);
    $Control.append($HiddenCheckBox);
    $Control.append($OpenDropDown);
    $Control.append($DropDownContainer);
}
function PopupDropDownPanel(Obj) {
    $("#" + Obj.Name + "_DropDown").width($("#" + Obj.Name).width());
    if ($("#" + Obj.Name + "_DropDown").hasClass("Parameter-Dropdown-Hidden")) {
        $("#" + Obj.Name + "_DropDown").fadeOut("fast");
        $("#" + Obj.Name + "_DropDown").removeClass("Parameter-Dropdown-Hidden");
        $("#" + Obj.Name + "_DropDown").addClass("Parameter-Dropdown-Show");
    }
    else {
        $("#" + Obj.Name + "_DropDown").fadeIn("fast", function () {
            var ShowValue = "";
            var HiddenValue = "";
            $("." + Obj.Name + "_DropDown_CB").each(function (i) {
                if (this.checked & this.value != "Select All") {
                    ShowValue += $("#" + Obj.Name + "_DropDown_" + this.value + "_lable").html() + ",";
                    HiddenValue += this.value + ",";
                }
            });
            $("#" + Obj.Name).val(ShowValue.substr(0, ShowValue.length - 1));
            $("#" + Obj.Name + "_hidden").val(HiddenValue.substr(0, HiddenValue.length - 1));
        });
        $("#" + Obj.Name + "_DropDown").addClass("Parameter-Dropdown-Hidden");
        $("#" + Obj.Name + "_DropDown").removeClass("Parameter-Dropdown-Show");
    }
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
function GetElementsStyle(CurrObj) {
    var Style = "";

    Style += GetStyle(CurrObj.SharedElements.Style, CurrObj.NonSharedElements);
    Style += GetStyle(CurrObj.NonSharedElements.Style, CurrObj.NonSharedElements);    
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
function GetMeasurements(CurrObj) {
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

    return Style;
}
function GetStyle(CurrObj, TypeCodeObj) {
    var Style = "";

    if (CurrObj == null)
        return Style;

    if (CurrObj.BackgroundColor != null)
        Style += "background-color:" + CurrObj.BackgroundColor + ";";
    if (CurrObj.UnicodeBiDi != null)
        Style += "unicode-bidi:" + GetBiDi(CurrObj.UnicodeBiDi) + ";";
    if (CurrObj.VerticalAlign != null)
        Style += "vertical-align:" + GetVAligh(CurrObj.VerticalAlign) + ";";
    if (CurrObj.WritingMode != null)
        Style += "layout-flow:" + GetLayoutFlow(CurrObj.WritingMode) + ";";
    if (CurrObj.Direction != null)
        Style += "Direction:" + GetDirection(CurrObj.Direction) + ";";
    if (CurrObj.PaddingBottom != null)
        Style += "padding-bottom:" + CurrObj.PaddingBottom + ";";
    if (CurrObj.PaddingLeft != null)
        Style += "padding-left:" + CurrObj.PaddingLeft + ";";
    if (CurrObj.PaddingRight != null)
        Style += "padding-right:" + CurrObj.PaddingRight + ";";
    if (CurrObj.PaddingTop != null)
        Style += "padding-top:" + CurrObj.PaddingTop + ";";
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
                case 3, 6, 7, 9, 11, 12, 13, 14, 15:
                    return "Right";
                    break;
                case 4, 17:
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
function GetParamsList() {
    var a = [];
    //Text
    $(".Parameter").filter(":text").each(function (i) {
        a.push({ name: this.name, ismultiple:$(this).attr("ismultiple"), type:$(this).attr("datatype"), value: IsParamNullable(this) });
    });
    //Hidden
    $(".Parameter").filter(":hidden").each(function (i) {
        a.push({ name: this.name, ismultiple: $(this).attr("ismultiple"), type: $(this).attr("datatype"), value: IsParamNullable(this) });
    });
    //dropdown
    $(".Parameter").filter("select").each(function (i) {
        a.push({ name: this.name, ismultiple: $(this).attr("ismultiple"), type: $(this).attr("datatype"), value: IsParamNullable(this) });
    });
    var RadioList = new Object();
    //radio-group by radio name, default value: null
    $(".Parameter").filter(":radio").each(function (i) {
        if (!(this.name in RadioList)) {
            RadioList[this.name] = null;
        }
        if (this.checked == true) {
            RadioList[this.name] = IsParamNullable(this);
        }
    });
    for (var RadioName in RadioList) {
        a.push({ name: RadioName, ismultiple: "", type: 'Boolean', value: RadioList[RadioName] });
    }
    //combobox - multiple values
    var temp_cb = "";
    $(".Parameter").filter(":checkbox").filter(":checked").each(function (i) {
        if (temp_cb.indexOf(this.name) == -1) {
            temp_cb += this.name + ",";
        }
    });
    var cb_array = temp_cb.split(",");
    var cb_name = "";
    var cb_value = "";
    for (var cb_i = 0; cb_i < cb_array.length - 1; cb_i++) {
        cb_name = cb_array[cb_i];
        var cb_value_length = $("input[name='" + cb_array[cb_i] + "']:checked").length;
        $("input[name='" + cb_array[cb_i] + "']:checked").each(function (i) {
            if (i == cb_value_length - 1)
                cb_value += this.value;
            else
                cb_value += this.value + ",";

        });
        a.push({ name: cb_name, ismultiple: $(this).attr("ismultiple"), type: $(this).attr("datatype"), value: cb_value });
    }

    //Combined to JSON String, format as below
    //var parameterList = '{ "ParamsList": [{ "Parameter": "CategoryID","IsMultiple":"True", "Value":"'+ $("#CategoryID").val()+'" }] }';
    var temp_json = "[";
    for (var json_i = 0; json_i < a.length; json_i++) {
        if (json_i != a.length - 1) {
            temp_json += '{"Parameter":"' + a[json_i].name + '","IsMultiple":"' + a[json_i].ismultiple + '","Type":"' + a[json_i].type + '","Value":"' + a[json_i].value + '"},';
        }
        else {
            temp_json += '{"Parameter":"' + a[json_i].name + '","IsMultiple":"' + a[json_i].ismultiple + '","Type":"' + a[json_i].type + '","Value":"' + a[json_i].value + '"}';
        }
    }
    temp_json += "]";
    return '{"ParamsList":' + temp_json + '}';
}
function IsParamNullable(Parameter) {
    var checkbox = $(".Parameter-Checkbox").filter("[name='" + Parameter.name + "']").first();
    if (checkbox.attr("checked") == "checked")
        return null;
    else
        return Parameter.value;
}
function ResetValidateMessage() {
    jQuery.extend(jQuery.validator.messages, {
        required: "Required.",
        remote: "Please fix this field.",
        email: "Invalid email address.",
        url: "Invalid URL.",
        date: "Invalid date.",
        dateISO: "Invalid date",
        dateDE: "Bitte geben Sie ein gltiges Datum ein.",
        number: "Invalid number.",
        numberDE: "Bitte geben Sie eine Nummer ein.",
        digits: "Please enter only digits",
        creditcard: "Please enter a valid credit card number.",
        equalTo: "Please enter the same value again.",
        accept: "Please enter a value with a valid extension.",
        maxlength: $.validator.format("Please enter no more than {0} characters."),
        minlength: $.validator.format("Please enter at least {0} characters."),
        rangelength: $.validator.format("Please enter a value between {0} and {1} characters long."),
        range: $.validator.format("Please enter a value between {0} and {1}."),
        max: $.validator.format("Please enter a value less than or equal to {0}."),
        min: $.validator.format("Please enter a value greater than or equal to {0}.")
    });
}



