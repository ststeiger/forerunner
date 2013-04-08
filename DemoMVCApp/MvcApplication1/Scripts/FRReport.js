
function GetReport(ReportServer, ReportPath, SessionID, PageNum,ReportDiv) {
    var ReportAPI = "/api/Report/GetJSON/";
    $.getJSON(ReportAPI, {
        RepServer: ReportServer,
        ReportPath: ReportPath,
        SessionID: SessionID,
        PageID: PageNum
    })
    .done(function (Data) { WriteReport(Data, ReportDiv); })
}

function WriteReport(ReportObj, ReportDiv) {

    var $Report = GetDefaultHTMLDiv();

    //Write Style   
    $Report.attr("Style", "position:relative;" + GetStyle(ReportObj.Report.PageContent.PageStyle));

    //Sections
    $.each(ReportObj.Report.PageContent.Sections, function (Index, Obj) { WriteSection(ReportObj, Obj, Index, ReportObj.Report.PageContent, $Report); });
    $("#"+ReportDiv).append($Report);        
    //Div = document.getElementById(ReportDiv);

}

function WriteSection(ReportObj,CurrObj, CurrObjIndex, CurrObjParent, $HTMLParent) {    
    var $NewObj = GetDefaultHTMLTable();
    var $Sec = $("<TR/>");

    $Sec.attr("Style",  GetMeasurements(GetMeasurmentsObj(CurrObjParent, CurrObjIndex)));
    
    //Columns
    $NewObj.append($Sec);
    $.each(CurrObj.Columns, function (Index, Obj) { WriteColumn(ReportObj, Obj, Index, CurrObj, $Sec); });
    $HTMLParent.append($NewObj);

}
function WriteColumn(ReportObj, CurrObj, CurrObjIndex, CurrObjParent, $HTMLParent) {
    var $NewObj = $("<TD/>");
    var $RIDiv;
    
    $NewObj.attr("Style", GetElementsStyle(CurrObj.Elements, null));
    $.each(CurrObj.ReportItems, function (Index, Obj) { $RIDiv = new $("<Div/>"); $NewObj.append(WriteReportItems(ReportObj, Obj, Index, CurrObj, $RIDiv)); });
    $HTMLParent.append($NewObj);
}

function WriteReportItems(ReportObj, CurrObj, CurrObjIndex, CurrObjParent, $HTMLParent) {
    
    switch (CurrObj.Type)
    {
        case "RichTextBox":
            return WriteRichText(ReportObj, CurrObj, CurrObjIndex, CurrObjParent, $HTMLParent);
            break;
        case "Image":
            return WriteImage(ReportObj, CurrObj, CurrObjIndex, CurrObjParent, $HTMLParent);
            break;
        case "RichTextBox":
            return WriteRichText(ReportObj, CurrObj, CurrObjIndex, CurrObjParent, $HTMLParent);
            break;
        case "Tablix":
            return WriteTablix(ReportObj, CurrObj, CurrObjIndex, CurrObjParent, $HTMLParent);
            break;
        case "Rectangle":
            return WriteRectangle(ReportObj, CurrObj, CurrObjIndex, CurrObjParent, $HTMLParent);
            break;
    }
}
function WriteRichText(ReportObj, CurrObj, CurrObjIndex, CurrObjParent, $HTMLParent) {   
    var Style = "";

    if (CurrObj.Elements.SharedElements.Value != null)
        $HTMLParent.html(CurrObj.Elements.SharedElements.Value);
    else
        $HTMLParent.html(CurrObj.Elements.NonSharedElements.Value);

    Style = GetElementsStyle(CurrObj.Elements, GetMeasurmentsObj(CurrObjParent, CurrObjIndex));
    $HTMLParent.attr("Style", Style);   

    //$NewObj.append($Row);
    //$Row.append($Cell);
    //$Cell.append($RText);
    //Paragraphs
    //$.each(CurrObj.ReportItems, function (Index, Obj) { WriteReportItems(ReportObj, Obj, Index, CurrObj, $Col); });
    //$HTMLParent.append($NewObj);
    return $HTMLParent;
}

function GetElementsStyle(CurrObj, Measurements,position) {
    var Style = "";

    Style += GetStyle(CurrObj.SharedElements.Style, CurrObj.NonSharedElements);
    Style += GetStyle(CurrObj.NonSharedElements.Style, CurrObj.NonSharedElements);
    if (Measurements != null) {
        Style += "position:absolute;" +  GetMeasurements(Measurements);
        if (CurrObj.SharedElements.CanGrow)
            Style += "word-wrap:break-word;white-space:pre-wrap;";
    }
    //TODO: Can Shrink
     
    return Style;
}

function GetMeasurements(CurrObj) {
    var Style = "";

    if (CurrObj.Width != null) {
        Style += "width:" + CurrObj.Width + "mm;";
        Style += "min-width:" + CurrObj.Width + "mm;";
    }
    if (CurrObj.Height != null)
        Style += "height:" + CurrObj.Height + "mm;";

    if (CurrObj.Left != null)
        Style += "left:" + CurrObj.Left + "mm;";
    if (CurrObj.Height != null)
        Style += "top:" + CurrObj.Top + "mm;";

    return Style;
    //TODO:  zIndex?
}
function GetStyle(CurrObj, TypeCodeObj) {
    var Style = "";

    if (CurrObj == null)
        return Style;

    //Need left, top, right bottom border
    if (CurrObj.BackgroundColor != null)
        Style += "background-color:" + CurrObj.BackgroundColor + ";";
    if (CurrObj.BorderWidth != null)
        Style += "border:" + CurrObj.BorderWidth + " " + GetBorderStyle(CurrObj.BorderStyle) + " " + CurrObj.BorderColor + ";";
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
                case 3,6,7,9,11,12,13,14,15:
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
function GetMeasurmentsObj(CurrObj,Index) {
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

function WriteImage(ReportObj, CurrObj, CurrObjIndex, CurrObjParent, $HTMLParent) {
    var $NewObj = $("<IMG/>");
    var Src = "/api/Report/GetImage/?";

    $NewObj.attr("Style",  GetElementsStyle(CurrObj.Elements, GetMeasurmentsObj(CurrObjParent, CurrObjIndex)));
    Src += "RepServer=" + ReportObj.ReportServerURL;
    Src += "&SessionID=" + ReportObj.SessionID;
    Src += "&ImageID=" + CurrObj.Elements.NonSharedElements.ImageDataProperties.ImageName;
    $NewObj.attr("src", Src);
    $NewObj.attr("alt", "Cannot find image");

    return $NewObj;
}
function WriteTablix(ReportObj, CurrObj, CurrObjIndex, CurrObjParent, $HTMLParent) {
    var $Tablix = GetDefaultHTMLTable();
    var Style = "border-collapse:collapse;";
    var $Row;
    var $Cell ;
    var $Col;
    var $ColGroup = $("<ColGroup/>");
    
    
    Style +=  GetElementsStyle(CurrObj.Elements, GetMeasurmentsObj(CurrObjParent, CurrObjIndex));
    $Tablix.attr("Style", Style);

    $.each(CurrObj.ColumnsWidths.Columns, function (Index, Obj) {
        $Col = new $("<Col/>");
        $Col.attr("Style", "Width:"+ Obj.Width +"mm;");
        $ColGroup.append($Col);
    })
    $Tablix.append($ColGroup);

    $Row = GetTableRow();
    $.each(CurrObj.Content, function (Index, Obj) {
        if (Obj.Type != "BodyRow"){
            $Cell = new $("<TD/>");
            $Row.append(WriteReportItems(ReportObj, Obj, Index, CurrObj, $Cell));            
        }
        else {
            $Tablix.append($Row);
            $Row = GetTableRow();
        }
    })

    return $Tablix;
}
function WriteRectangle(ReportObj, CurrObj, CurrObjIndex, CurrObjParent, $HTMLParent) {
    var $RIDiv;

    $HTMLParent.attr("Style", GetElementsStyle(CurrObj.Elements, null));
    $.each(CurrObj.Content, function (Index, Obj) { $RIDiv = new $("<Div/>"); $HTMLParent.append(WriteReportItems(ReportObj, Obj, Index, CurrObj, $RIDiv)); });

    return $HTMLParent;
}
