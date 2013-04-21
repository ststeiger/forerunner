//Global reference to all reports
var Reports = new Object();

function ReportItemContext(RS,CurrObj, CurrObjIndex, CurrObjParent, $HTMLParent, Style) {
    this.RS = RS;
    this.CurrObj = CurrObj;
    this.CurrObjIndex = CurrObjIndex;
    this.CurrObjParent = CurrObjParent;
    this.$HTMLParent = $HTMLParent;
    this.Style = Style;
}
function ReportState(UID, $ReportOuterDiv,  ReportServer, ReportPath, Toolbar, $PageContainer) {
    this.UID = UID;
    this.$ReportOuterDiv = $ReportOuterDiv;       
    this.CurPage = 0;
    this.Pages = new Object();
    this.$PageInput = new $("<Input/>");
    this.ReportServerURL = ReportServer;
    this.ReportPath = ReportPath;
    this.Toolbar = Toolbar;
    this.SessionID = "";
    this.$PageContainer = $PageContainer;
    this.NumPages = 0;
    this.Lock = false;
    this.$ReportContainer = $("<Table/>");
    this.$LoadingIndicator = new $("<div id='loadIndicator_" + UID + "' class='loading-indicator'></div>").text("Report loading...");

}
function ReportPage($Container, ReportObj) {
    this.ReportObj = ReportObj;    
    this.$Container = $Container;
    this.Image = null;
    this.$Img = new $("<IMG/>");
}


function InitReport(ReportServer, ReportPath, Toolbar, PageNum, UID) {      
    var $Row =  new $("<TR/>");
    var $Cell;
    
    var RS = new ReportState(UID, $("#" + UID), ReportServer, ReportPath, Toolbar, $Row);
    
    Reports[UID] = RS;
    
    if (Toolbar) {
        $Row = new $("<TR/>");
        $Cell = new $("<TD/>");
        $Cell.append(GetToolbar(UID));
        $Row.append($Cell);
        RS.$ReportContainer.append($Row);
    }
    AddLoadingIndicator(RS);
  
    //Log in screen if needed

    //If Parameters needed show Parameters


    //load the report Page requested        
    RS.$ReportContainer.append(RS.$PageContainer);
    RS.$ReportOuterDiv.append(RS.$ReportContainer);
    LoadPage(RS, PageNum, null);    
}

function SetActionCursor(Ob) {
    Ob.style.cursor = "pointer";   
}
function AddLoadingIndicator(RS) {    
    RS.$ReportContainer.append(RS.$LoadingIndicator);
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

    $.getJSON("/api/Report/GetJSON/", {
        ReportServerURL: RS.ReportServerURL,
        ReportPath: RS.ReportPath,
        SessionID: RS.SessionID,
        PageNumber: NewPageNum
    })
    .done(function (Data) { WritePage(Data, RS, NewPageNum, OldPage, LoadOnly); })
    .fail(function () { console.log("error"); RemoveLoadingIndicator(RS); })

}

function RemoveLoadingIndicator(RS) {
    RS.$LoadingIndicator.detach();
}
function SetPage(RS, NewPageNum, OldPage) {
    RS.$PageContainer.append(RS.Pages[NewPageNum].$Container)
    RS.Pages[NewPageNum].$Container.fadeIn("normal");
    if (OldPage != null)
        OldPage.$Container.detach();
    RS.CurPage = NewPageNum;
    RS.$PageInput.val(NewPageNum);
    RS.Lock = 0;
}
function RefreshReport(RS) {
    Page = RS.Pages[RS.CurPage];

    RS.SessionID = "";
    RS.Pages = new Object();
    LoadPage(RS, 1, Page, false); 
}
function GetToolbar(UID) {
    var $Toolbar = $("<Table/>");
    var $Row = $("<TR/>");
    var $Cell;

    $Toolbar.attr("style", "width:100%;background-color:lightsteelblue;background:linear-gradient(steelblue lightsteelblue);");

    $Cell = new $("<TD/>");
    $Cell.attr("style", "width:10mm;");
    $Cell.attr("onclick", "ShowParms(Reports['" + UID + "'])");
    $Cell.attr("onmouseover", "SetActionCursor(this)");
    $Cell.html("Par");
    $Row.append($Cell);

    $Cell = new $("<TD/>");
    $Cell.attr("style", "min-width:10mm;");
    $Cell.attr("onclick", "ShowNav('" + UID + "')");
    $Cell.attr("onmouseover", "SetActionCursor(this)");
    $Cell.html("Nav");
    $Row.append($Cell);

    $Cell = new $("<TD/>");
    $Cell.attr("style", "min-width:20mm;");
    $Row.append($Cell);

    $Cell = new $("<TD/>");
    $Cell.attr("style", "min-width:10mm;");
    $Cell.attr("onclick", "RefreshReport(Reports['" + UID + "'])");
    $Cell.attr("onmouseover", "SetActionCursor(this)");
    $Cell.html("Refresh");
    $Row.append($Cell);

    $Cell = new $("<TD/>");
    $Cell.attr("style", "min-width:20mm;");
    $Row.append($Cell);

    $Cell = new $("<TD/>");
    $Cell.attr("style", "min-width:10mm;");
    $Cell.attr("onclick", "NavToPage(Reports['" + UID + "'],1)");
    $Cell.attr("onmouseover", "SetActionCursor(this)");
    $Cell.html("Start");
    $Row.append($Cell);

    $Cell = new $("<TD/>");
    $Cell.attr("style", "min-width:10mm;");

    $Cell.attr("onclick", "NavToPage(Reports['" + UID + "'],Reports['" + UID + "'].CurPage-1)");
    $Cell.attr("onmouseover", "SetActionCursor(this)");
    $Cell.html("Prev");
    $Row.append($Cell);

    $Cell = Reports[UID].$PageInput;
    $Cell.attr("style", "min-width:10mm;max-width:15mm;text-align:right;");
    $Cell.attr("id", "PageInput");
    $Cell.attr("type", "number")
    $Cell.bind("keypress", function (e) { if (e.keyCode == 13) NavToPage(Reports[UID], Reports[UID].$PageInput.val()); });
    $Row.append($Cell);

    $Cell = new $("<TD/>");
    $Cell.attr("style", "min-width:10mm;");
    $Cell.attr("onclick", "NavToPage(Reports['" + UID + "'],Reports['" + UID + "'].CurPage+1)");
    $Cell.attr("onmouseover", "SetActionCursor(this)");
    $Cell.html("Next");
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
function ShowParms() {
    alert("Show");
}

function LoadAllPages(RS) {

    for (var i = 1; i <= RS.NumPages; i++)
        if (RS.Pages[i] == null)
            LoadPage(RS, i, null, true);

}
function WritePage(Data, RS, NewPageNum, OldPage, LoadOnly) {
    var $Report = GetDefaultHTMLDiv();

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


    //Write Style   
    $Report.attr("Style", "" + GetStyle(Data.Report.PageContent.PageStyle));

    //Sections
    $.each(Data.Report.PageContent.Sections, function (Index, Obj) { WriteSection(new ReportItemContext(RS, Obj, Index, Data.Report.PageContent, $Report, "")); });

    RemoveLoadingIndicator(RS);
    if (!LoadOnly)
        SetPage(RS, NewPageNum, OldPage);

    //Get Thumbnail    
    $.get("/api/Report/GetThumbnail/", {
        ReportServerURL: RS.ReportServerURL,
        ReportPath: RS.ReportPath,
        SessionID: RS.SessionID,
        PageNumber: NewPageNum,
        PageHeight: RS.Pages[NewPageNum].ReportObj.Report.PageContent.PageLayoutStart.PageHeight * 0.0393700787 + "in",
        PageWidth: RS.Pages[NewPageNum].ReportObj.Report.PageContent.PageLayoutStart.PageWidth * 0.0393700787 + "in",
    })
    .done(function (Data) {
        RS.Pages[NewPageNum].Image = Data; RS.Pages[NewPageNum].$Img.attr("src", RS.Pages[NewPageNum].Image); RS.Pages[NewPageNum].$Img.attr("alt", NewPageNum + ":");
    })
    .fail(function () { console.log("error"); })

}
function SetImage(Data, RS) {
    if (RS.Pages[PageNum] == null)
        RS.Pages[PageNum] = new ReportPage(null, null);
    RS.Pages[PageNum].Image = Data;
}


function WriteSection(RIContext) {
    var $NewObj = GetDefaultHTMLTable();
    var $Sec = $("<TR/>");

    $Sec.attr("Style", "" + GetMeasurements(GetMeasurmentsObj(RIContext.CurrObjParent, RIContext.CurrObjIndex)));

    //Columns
    $NewObj.append($Sec);
    $.each(RIContext.CurrObj.Columns, function (Index, Obj) { $Sec.append(WriteRectangle(new ReportItemContext(RIContext.RS, Obj, Index, RIContext.CurrObj, new $("<TD/>"), null))); });
    RIContext.$HTMLParent.append($NewObj);
}
function WriteRectangle(RIContext) {
    var $RI;        //This is the ReportItem Object
    var $LocDiv;    //This DIV will have the top and left location set, location is not set anywhere else
    var EmptyDivHeight = 0;
    var $EmptyDiv = $("<Div/>");
    var Measurements;
    var NewTop = 0;

    RIContext.$HTMLParent.attr("Style", GetElementsStyle(RIContext.CurrObj.Elements));

    $.each(RIContext.CurrObj.ReportItems, function (Index, Obj) {
        $RI = WriteReportItems(new ReportItemContext(RIContext.RS, Obj, Index, RIContext.CurrObj, new $("<Div/>"), ""));
        Measurements = RIContext.CurrObj.Measurement.Measurements;

        // Keep track of how much space we are using for top position offset       
        $LocDiv = new $("<Div/>");
        $LocDiv.append($RI);
        $LocDiv.attr("Style", "position:relative;top:" + (Measurements[Index].Top - NewTop) + "mm;left:" + Measurements[Index].Left + "mm;");
        NewTop += Measurements[Index].Height;

        //Collect empty space, this needs to handle more complex layout       
        if (Index > 0) {
            if (Measurements[Index].Top > (Measurements[Index - 1].Top + Measurements[Index - 1].Height))
                EmptyDivHeight += Measurements[Index].Top - (Measurements[Index - 1].Top + Measurements[Index - 1].Height);
        }
        else
            EmptyDivHeight += Measurements[Index].Top;

        RIContext.$HTMLParent.append($LocDiv);
    });


    // Take up the empty space
    $EmptyDiv.attr("Style", "height:" + EmptyDivHeight + "mm;");
    RIContext.$HTMLParent.append($EmptyDiv);

    return RIContext.$HTMLParent;
}
function GetHeight($Obj) {
    var height;

    if ($Obj.height() > 0) {
        height = $Obj.height();
        // if height is zero, then we're dealing with a hidden element
    }
    else {
        var copied_elem = $Obj.clone()
                            .attr("id", false)
                            .css({
                                visibility: "hidden", display: "block",
                                position: "absolute"
                            });
        $("body").append(copied_elem);
        height = copied_elem.height();

        copied_elem.remove();
    }
    return height;

}
function WriteReportItems(RIContext) {

    switch (RIContext.CurrObj.Type) {
        case "RichTextBox":
            return WriteRichText(RIContext);
            break;
        case "Image":
            return WriteImage(RIContext);
            break;
        case "Tablix":
            return WriteTablix(RIContext);
            break;
        case "Rectangle":
            return WriteRectangle(RIContext);
            break;
        case "Chart":
        case "Map":
            return WriteChartImage(RIContext);
            break;
    }
}
function WriteRichText(RIContext) {
    var Style = "";
    var $NewObj = RIContext.$HTMLParent;

    if (RIContext.CurrObj.Elements.SharedElements.Value != null)
        $NewObj.html(RIContext.CurrObj.Elements.SharedElements.Value);
    else if (RIContext.CurrObj.Elements.NonSharedElements.Value != null)
        $NewObj.html(RIContext.CurrObj.Elements.NonSharedElements.Value);
    else
        $NewObj.html("&nbsp");

    //If no value put in HTML empty
    if (RIContext.CurrObj.Elements.SharedElements.Value == "" || RIContext.CurrObj.Elements.NonSharedElements.Value == "")
        $NewObj.html("&nbsp");

    Style += GetMeasurements(GetMeasurmentsObj(RIContext.CurrObjParent, RIContext.CurrObjIndex));
    Style += GetElementsStyle(RIContext.CurrObj.Elements);
    $NewObj.attr("Style", "-moz-box-sizing:border-box;box-sizing:border-box;" + Style + RIContext.Style);

    //Paragraphs
    //$.each(CurrObj.ReportItems, function (Index, Obj) { WriteReportItems(ReportObj, Obj, Index, CurrObj, $Col); });

    return RIContext.$HTMLParent;
}
function WriteImage(RIContext) {
    var $NewObj = $("<IMG/>");
    var Src = "/api/Report/GetImage/?";
    var Style = "max-height=100%;max-width:100%;" + GetElementsStyle(RIContext.CurrObj.Elements);


    //Hack for Image size, need to handle clip, fit , fit proportional
    Style += GetMeasurements(GetMeasurmentsObj(RIContext.CurrObjParent, RIContext.CurrObjIndex));
    $NewObj.attr("Style", Style);

    //src parameters
    Src += "ReportServerURL=" + RIContext.RS.ReportServerURL;
    Src += "&SessionID=" + RIContext.RS.SessionID;
    Src += "&ImageID=" + RIContext.CurrObj.Elements.NonSharedElements.ImageDataProperties.ImageName;
    $NewObj.attr("src", Src);
    $NewObj.attr("alt", "Cannot display image");
    return $NewObj;
}
function WriteChartImage(RIContext) {
    var $NewObj = $("<IMG/>");
    var Src = "/api/Report/GetImage/?";
    var Style = "max-height=100%;max-width:100%;" + GetElementsStyle(RIContext.CurrObj.Elements);

    //Measurements
    Style += GetMeasurements(GetMeasurmentsObj(RIContext.CurrObjParent, RIContext.CurrObjIndex));
    $NewObj.attr("Style", Style);

    //src parameters
    Src += "ReportServerURL=" + RIContext.RS.ReportServerURL;
    Src += "&SessionID=" + RIContext.RS.SessionID;
    Src += "&ImageID=" + RIContext.CurrObj.Elements.NonSharedElements.StreamName;

    $NewObj.attr("src", Src);
    $NewObj.attr("alt", "Cannot display chart image");
    RIContext.$HTMLParent.append($NewObj);
    return RIContext.$HTMLParent;
}
function ResizeImage(img) {
    //TODO: this does not work
    if (img.height >= img.width) {
        img.maxheight = "100%";
        img.width = "auto";
    }
    else {
        img.maxwidth = "100%";
        img.height = "auto";
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
    Style = "vertical-align:top;";
    Style += GetFullBorderStyle(Obj.Cell.ReportItem);
    var ColIndex = Obj.ColumnIndex;

    var RowIndex;
    if (BodyCellRowIndex == null)
        RowIndex = Obj.RowIndex;
    else
        RowIndex = BodyCellRowIndex;

    // need to handle different size borders
    if (RIContext.CurrObj.ColumnWidths.Columns[ColIndex] != null) {
        if ((ColIndex == 0) && (ColIndex == (RIContext.CurrObj.ColumnWidths.ColumnCount - 1)))
            wbordersize = GetBorderSize(Obj.Cell.ReportItem, "Left") + GetBorderSize(Obj.Cell.ReportItem, "Right")
        else if (ColIndex == 0)
            wbordersize = GetBorderSize(Obj.Cell.ReportItem, "Left") + GetBorderSize(Obj.Cell.ReportItem, "Right") * .5
        else if (ColIndex == (RIContext.CurrObj.ColumnWidths.ColumnCount - 1))
            wbordersize = GetBorderSize(Obj.Cell.ReportItem, "Right") + GetBorderSize(Obj.Cell.ReportItem, "Left") * .5
        else
            wbordersize = GetBorderSize(Obj.Cell.ReportItem, "Right") * .5 + GetBorderSize(Obj.Cell.ReportItem, "Left") * .5

        if ((RowIndex == 0) && (RowIndex == (RIContext.CurrObj.RowHeights.RowCount - 1)))
            hbordersize = GetBorderSize(Obj.Cell.ReportItem, "Top") + GetBorderSize(Obj.Cell.ReportItem, "Bottom")
        else if (RowIndex == 0)
            hbordersize = GetBorderSize(Obj.Cell.ReportItem, "Top") + GetBorderSize(Obj.Cell.ReportItem, "Bottom") * .5
        else if (RowIndex == (RIContext.CurrObj.RowHeights.RowCount - 1))
            hbordersize = GetBorderSize(Obj.Cell.ReportItem, "Bottom") + GetBorderSize(Obj.Cell.ReportItem, "Top") * .5
        else
            hbordersize = GetBorderSize(Obj.Cell.ReportItem, "Top") * .5 + GetBorderSize(Obj.Cell.ReportItem, "Bottom") * .5


        //Specify width,but only min-height to allow brower to grow height as needed
        width = RIContext.CurrObj.ColumnWidths.Columns[ColIndex].Width - wbordersize;
        height = RIContext.CurrObj.RowHeights.Rows[RowIndex].Height - hbordersize;
        Style += "width:" + width + "mm;" + "max-width:" + width + "mm;" + "min-width:" + width + "mm;" + "min-height:" + height + "mm;";
    }
    //Background color goes on the cell
    if (Obj.Cell.ReportItem.Elements.SharedElements.Style.BackgroundColor != null)
        Style += "background-color:" + Obj.Cell.ReportItem.Elements.SharedElements.Style.BackgroundColor + ";";
    else if (Obj.Cell.ReportItem.Elements.NonSharedElements.Style.BackgroundColor != null)
        Style += "background-color:" + Obj.Cell.ReportItem.Elements.NonSharedElements.Style.BackgroundColor + ";";

    $Cell.attr("Style", Style);

    // Not sure why IE and Firefox do not work with box sizing, but block size works.
    if ($.browser.mozilla || $.browser.msie)
        $Cell.append(WriteReportItems(new ReportItemContext(RIContext.RS, Obj.Cell.ReportItem, Index, RIContext.CurrObj, new $("<Div/>"), "display:block;margin:0")));
    else
        $Cell.append(WriteReportItems(new ReportItemContext(RIContext.RS, Obj.Cell.ReportItem, Index, RIContext.CurrObj, new $("<Div/>"), "box-sizing:border-box;margin:0;")));

    return $Cell;
}
function WriteTablix(RIContext) {
    var $Tablix = GetDefaultHTMLTable();
    var Style = "border-collapse:collapse;padding:0;";
    var $Row;
    var LastRowIndex = 0;

    Style += GetMeasurements(GetMeasurmentsObj(RIContext.CurrObjParent, RIContext.CurrObjIndex));

    Style += GetElementsStyle(RIContext.CurrObj.Elements);
    $Tablix.attr("Style", Style);

    //var $Col;
    //var $ColGroup = $("<ColGroup/>");
    // $.each(Context.CurrObj.ColumnWidths.Columns, function (Index, Obj) {
    //    $Col = new $("<Col/>");
    //    $Col.attr("Style", "width:" + Obj.Width + "mm;" + "max-width:" + Obj.Width + "mm;");
    //   $ColGroup.append($Col);
    // })
    //    $Tablix.append($ColGroup);

    $Row = new $("<TR/>");
    $.each(RIContext.CurrObj.TablixRows, function (Index, Obj) {
        if (Obj.RowIndex != LastRowIndex) {
            $Tablix.append($Row);
            $Row = new $("<TR/>");
            LastRowIndex = Obj.RowIndex;
        }

        if (Obj.Type == "BodyRow") {
            $.each(Obj.Cells, function (BRIndex, BRObj) {
                $Row.append(WriteTablixCell(RIContext, BRObj, BRIndex, Obj.RowIndex));
            })
        }
        else
            if (Obj.Cell != null) $Row.append(WriteTablixCell(RIContext, Obj, Index));
    })
    $Tablix.append($Row);
    return $Tablix;
}


function GetElementsStyle(CurrObj) {
    var Style = "";

    Style += GetStyle(CurrObj.SharedElements.Style, CurrObj.NonSharedElements);
    Style += GetStyle(CurrObj.NonSharedElements.Style, CurrObj.NonSharedElements);
    Style += "white-space:pre-wrap;word-break:break-word;word-wrap:break-word;";
    return Style;
}
function GetBorderSize(CurrObj, Side) {
    var Obj;

    //Need left, top, right bottom border
    Obj = CurrObj.Elements.SharedElements.Style;
    if (Obj != null) {
        if (Side == "Left")
            if (Obj.BorderWidthLeft != null)
                return ConvertToMM(Obj.BorderWidthLeft);
            else
                return ConvertToMM(Obj.BorderWidth);
        else if (Side == "Right")
            if (Obj.BorderWidthRight != null)
                return ConvertToMM(Obj.BorderWidthRight);
            else
                return ConvertToMM(Obj.BorderWidth);
        else if (Side == "Top")
            if (Obj.BorderWidtTop != null)
                return ConvertToMM(Obj.BorderWidthTop);
            else
                return ConvertToMM(Obj.BorderWidth);
        else if (Side == "Bottom")
            if (Obj.BorderWidthBottom != null)
                return ConvertToMM(Obj.BorderWidthBottom);
            else
                return ConvertToMM(Obj.BorderWidth);
    }
    Obj = CurrObj.Elements.NonSharedElements.Style;
    if (Obj != null)
        if (Side == "Left")
            if (Obj.BorderWidthLeft != null)
                return ConvertToMM(Obj.BorderWidthLeft);
            else
                return ConvertToMM(Obj.BorderWidth);
        else if (Side == "Right")
            if (Obj.BorderWidthRight != null)
                return ConvertToMM(Obj.BorderWidthRight);
            else
                return ConvertToMM(Obj.BorderWidth);
        else if (Side == "Top")
            if (Obj.BorderWidtTop != null)
                return ConvertToMM(Obj.BorderWidthTop);
            else
                return ConvertToMM(Obj.BorderWidth);
        else if (Side == "Bottom")
            if (Obj.BorderWidthBottom != null)
                return ConvertToMM(Obj.BorderWidthBottom);
            else
                return ConvertToMM(Obj.BorderWidth);
    return 0;
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
function GetDefaultHTMLDiv() {
    var $NewObj = $("<Div/>");

    $NewObj.attr("HEIGHT", "100%");
    $NewObj.attr("WIDTH", "100%");
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
function GetTableRow() {
    var retval = new $("<TR/>");
    retval.attr("Height", 0);
    return retval;
}
function ConvertToMM(ConvertFrom) {
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