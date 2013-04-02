
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

    var $Report = $('<Div/>');
    
    //Sections
    $.each(ReportObj.Report.PageContent.Sections, function (Index, Obj) { WriteSection(ReportObj, Obj, Index, ReportObj.Report.PageContent, $Report); });
    $("#"+ReportDiv).append($Report);        
    //Div = document.getElementById(ReportDiv);

}

function WriteSection(ReportObj,CurrObj, CurrObjIndex, CurrObjParent, $HTMLParent) {    
    var $NewObj = $('<TABLE/>');
    var $Sec = $("<TR/>");
    //Columns
    $NewObj.append($Sec);
    $.each(CurrObj.Columns, function (Index, Obj) { WriteColumn(ReportObj, Obj, Index, CurrObj, $Sec); });
    $HTMLParent.append($NewObj);

}
function WriteColumn(ReportObj, CurrObj, CurrObjIndex, CurrObjParent, $HTMLParent) {
    var $NewObj
    $NewObj = $("<TD/>");
    $.each(CurrObj.ReportItems, function (Index, Obj) { WriteReportItems(ReportObj, Obj, Index, CurrObj, $NewObj); });
    $HTMLParent.append($NewObj);
}

function WriteReportItems(ReportObj, CurrObj, CurrObjIndex, CurrObjParent, $HTMLParent) {
    
    switch (CurrObj.Type)
    {
        case "RichTextBox":
            WriteRichText(ReportObj, CurrObj, CurrObjIndex, CurrObjParent, $HTMLParent);
            break;
        case "Image":
            WriteImage(ReportObj, CurrObj, CurrObjIndex, CurrObjParent, $HTMLParent);
            break;
        case "RichTextBox":
            WriteRichText(ReportObj, CurrObj, CurrObjIndex, CurrObjParent, $HTMLParent);
            break;
        case "Tablix":
            WriteTablix(ReportObj, CurrObj, CurrObjIndex, CurrObjParent, $HTMLParent);
            break;
        case "Rectangle":
            WriteRectangle(ReportObj, CurrObj, CurrObjIndex, CurrObjParent, $HTMLParent);
            break;
    }
}
function WriteRichText(ReportObj, CurrObj, CurrObjIndex, CurrObjParent, $HTMLParent) {
    var $NewObj = $("<Table/>");
    var $Row = $("<TR/>");    
    var $Cell = $("<TD/>");
    

    $Cell.html(CurrObj.Elements.SharedElements.Value);
    WriteStyle(CurrObj.Elements, $Cell);

    $NewObj.append($Row);
    $Row.append($Cell);
    //Paragraphs
    //$.each(CurrObj.ReportItems, function (Index, Obj) { WriteReportItems(ReportObj, Obj, Index, CurrObj, $Col); });
    $HTMLParent.append($NewObj);
}

function WriteStyle(CurrObj, $HTMLParent) {
    
}

function WriteImage(ReportObj, CurrObj, CurrObjIndex, CurrObjParent, $HTMLParentt) {
}
function WriteTablix(ReportObj, CurrObj, CurrObjIndex, CurrObjParent, $HTMLParent) {
}
function WriteRectangle(ReportObj, CurrObj, CurrObjIndex, CurrObjParent, $HTMLParent) {
}
