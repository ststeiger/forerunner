// Assign or create the single globally scoped variable
var forerunner = forerunner || {};

// Forerunner SQL Server Reports
forerunner.ssr = forerunner.ssr || {};

$(function () {

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
    function Layout() {
        this.ReportItems = {};
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
    // The Floating header object holds pointers to the tablix and its row and col header objects
    function FloatingHeader($Tablix, $RowHeader, $ColHeader) {
        this.$Tablix = $Tablix;
        this.$RowHeader = $RowHeader;
        this.$ColHeader = $ColHeader;
    }
    // report render widget
    $.widget("Forerunner.reportRender", {
        // Default options
        options: {
            ReportViewer: null,
        },
        // Constructor
        _create: function () {
            
        },
                
        Render: function (reportObj) {
            var me = this;
            var ReportDiv = me.element;
            var ReportViewer = me.options.ReportViewer;
            

            me._writeExportPanel();

            ReportDiv.attr("Style", this._getStyle(ReportViewer, reportObj.Report.PageContent.PageStyle));
            $.each(reportObj.Report.PageContent.Sections, function (Index, Obj) { me._writeSection(new ReportItemContext(ReportViewer, Obj, Index, reportObj.Report.PageContent, ReportDiv, "")); });
        },
        WriteError: function (errorData) {
            var me = this;
            var errorTag = forerunner.ssr.constants.errorTag;

            me.element.html($(
                "<div class='Error-Message'></div>" +
                "<div class='Error-Details'>" + errorTag.moreDetail + "</div>" +
                "<div class='Error'><h3>" + errorTag.serverError + "</h3>" +
                "<div class='Error Error-Type'></div>" +
                "<div class='Error Error-TargetSite'></div>" +
                "<div class='Error Error-Source'></div>" +
                "<div class='Error Error-StackTrace'></div>" +
                "</div>"));

            if (me.options.ReportViewer != null) {
                var $cell;

                $cell = me.element.find(".Error");
                $cell.hide();

                $cell = me.element.find(".Error-Details");
                $cell.on("click", { $Detail: me.element.find(".Error") }, function (e) { e.data.$Detail.show(); $(e.target).hide(); });


                $cell = me.element.find(".Error-Type");
                $cell.append("<h4>" + errorTag.type + ":</h4>" + errorData.Exception.Type);

                $cell = me.element.find(".Error-TargetSite");
                $cell.html("<h4>" + errorTag.targetSite + ":</h4>" + errorData.Exception.TargetSite);

                $cell = me.element.find(".Error-Source");
                $cell.html("<h4>" + errorTag.source + ":</h4>" + errorData.Exception.Source);

                $cell = me.element.find(".Error-Message");
                $cell.html("<h4>" + errorTag.message + ":</h4>" + errorData.Exception.Message);

                $cell = me.element.find(".Error-StackTrace");
                $cell.html("<h4>" + errorTag.stackTrace + ":</h4>" + errorData.Exception.StackTrace);
            }
        },

        _writeSection: function (RIContext) {
            var me = this;
            var $NewObj = me._getDefaultHTMLTable();
            var $Sec = $("<TR/>");
            var Location = me._getMeasurmentsObj(RIContext.CurrObjParent, RIContext.CurrObjIndex);

            //Need to determine Header and footer Index
            var HeaderIndex;
            var FooterIndex;
            if (RIContext.CurrObj.PageFooter != null) {
                FooterIndex = RIContext.CurrObj.Columns.length;
                HeaderIndex = FooterIndex + 1;
            }
            else
                HeaderIndex = RIContext.CurrObj.Columns.length;


            //Page Header
            if (RIContext.CurrObj.PageHeader != null) {
                var $Header = $("<TR/>");
                var $HTD = $("<TD/>");
                $Header.append($HTD);
                var HeadLoc = me._getMeasurmentsObj(RIContext.CurrObj, HeaderIndex);
                $Header.attr("Style", "width:" + HeadLoc.Width + "mm;");
                $HTD.append(me._writeRectangle(new ReportItemContext(RIContext.RS, RIContext.CurrObj.PageHeader, HeaderIndex, RIContext.CurrObj, new $("<DIV/>"), null, HeadLoc)));
                $NewObj.append($Header);
            }
            
            $Sec.attr("Style", "width:" + Location.Width + "mm;");
            //Columns
            $NewObj.append($Sec);
            $.each(RIContext.CurrObj.Columns, function (Index, Obj) {
                var $col = new $("<TD/>");
                $col.append(me._writeRectangle(new ReportItemContext(RIContext.RS, Obj, Index, RIContext.CurrObj, new $("<Div/>"), null, Location)));
                $Sec.append($col);
            });

            //Page Footer
            if (RIContext.CurrObj.PageFooter != null) {
                var $Footer = $("<TR/>");
                var $FTD = $("<TD/>");
                $Footer.append($FTD);
                var FootLoc = me._getMeasurmentsObj(RIContext.CurrObj, FooterIndex);
                $Footer.attr("Style", "width:" + FootLoc.Width + "mm;");
                $FTD.append(me._writeRectangle(new ReportItemContext(RIContext.RS, RIContext.CurrObj.PageFooter, FooterIndex, RIContext.CurrObj, new $("<DIV/>"), "", FootLoc)));
                $NewObj.append($Footer);
            }


            RIContext.$HTMLParent.append($NewObj);
        },
        _writeRectangle: function (RIContext) {
            var $RI;        //This is the ReportItem Object
            var $LocDiv;    //This DIV will have the top and left location set, location is not set anywhere else
            var Measurements;
            var RecLayout;
            var Style;
            var me = this;

            Measurements = RIContext.CurrObj.Measurement.Measurements;
            RecLayout = me._getRectangleLayout(Measurements);

            $.each(RIContext.CurrObj.ReportItems, function (Index, Obj) {
        
                Style = "";
                if (Obj.Type != "Line") {
                    Style = "display:table;border-collapse:collapse;";
                    Style += me._getFullBorderStyle(Obj);
                }

                $RI = me._writeReportItems(new ReportItemContext(RIContext.RS, Obj, Index, RIContext.CurrObj, new $("<Div/>"), Style, Measurements[Index]));
                       
                $LocDiv = new $("<Div/>");
                $LocDiv.append($RI);
                Style = "";

                //Determin height and location
                if (Obj.Type == "Image" || Obj.Type == "Chart" || Obj.Type == "Gauge" || Obj.Type == "Map" || Obj.Type == "Line")
                    RecLayout.ReportItems[Index].NewHeight = Measurements[Index].Height;
                else
                    RecLayout.ReportItems[Index].NewHeight = me._getHeight($RI);

                if (RecLayout.ReportItems[Index].IndexAbove == null)
                    RecLayout.ReportItems[Index].NewTop = Measurements[Index].Top;
                else
                    RecLayout.ReportItems[Index].NewTop = parseFloat(RecLayout.ReportItems[RecLayout.ReportItems[Index].IndexAbove].NewTop) + parseFloat(RecLayout.ReportItems[RecLayout.ReportItems[Index].IndexAbove].NewHeight) + parseFloat(RecLayout.ReportItems[Index].TopDelta);
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

            Style = "position:relative;" + this._getElementsStyle(RIContext.RS, RIContext.CurrObj.Elements);
            Style += me._getFullBorderStyle(RIContext.CurrObj);

            if (RIContext.CurrLocation != null) {
                Style += "width:" + RIContext.CurrLocation.Width + "mm;";
                if (RIContext.CurrObj.ReportItems.length == 0)
                    Style += "height:" + RIContext.CurrLocation.Height + "mm;";
                else {
                    var parentHeight = parseFloat(RecLayout.ReportItems[RecLayout.LowestIndex].NewTop) + parseFloat(RecLayout.ReportItems[RecLayout.LowestIndex].NewHeight) + (parseFloat(RIContext.CurrLocation.Height) - (parseFloat(Measurements[RecLayout.LowestIndex].Top) + parseFloat(Measurements[RecLayout.LowestIndex].Height)));
                    Style += "height:" + parentHeight + "mm;";
                }
        
            }
            RIContext.$HTMLParent.attr("Style", Style);

            return RIContext.$HTMLParent;
        },
        _getRectangleLayout: function (Measurements) {
            var l = new Layout();
            var me = this;

            $.each(Measurements, function (Index, Obj) {
                l.ReportItems[Index] = new ReportItemLocation(Index);
                var curRI = l.ReportItems[Index];

                if (l.LowestIndex == null)
                    l.LowestIndex = Index;
                else if (Obj.Top + Obj.Height > Measurements[l.LowestIndex].Top + Measurements[l.LowestIndex].Height)
                    l.LowestIndex = Index;

                for (var i = 0; i < Measurements.length; i++) {
                    var bottom =  Measurements[i].Top + Measurements[i].Height;
                    //var right = Measurements[i].Left + Measurements[i].Width;
                    if ((Obj.Top > bottom) //&& (
                        //    ((Obj.Left > Measurements[i].Left) && (Obj.Left < right)) ||
                        //     ((Obj.Left + Obj.Width > Measurements[i].Left) && (Obj.Left + Obj.Width < right)) ||
                        //     ((Obj.Left < Measurements[i].Left) && (Obj.Left + Obj.Width > right))
                        // )
                        )
            
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
        },
        _writeReportItems: function (RIContext) {
            var me = this;

            switch (RIContext.CurrObj.Type) {
                case "RichTextBox":
                    return me._writeRichText(RIContext);
                    //break;
                case "Image":
                case "Chart":
                case "Gauge":
                case "Map":
                    return me._writeImage(RIContext);
                    //break;
                case "Tablix":
                    return me._writeTablix(RIContext);
                    //break;
                case "Rectangle":
                    return me._writeRectangle(RIContext);
                    //break;
                case "SubReport":
                    return me._writeSubreport(RIContext);
                    //break;
                case "Line":
                    return me._writeLine(RIContext);
                    //break;
            }
        },
        _writeRichText: function (RIContext) {
            var Style = RIContext.Style;
            var $TextObj = $("<div/>");
            var $Sort = null;
            var me = this;

            Style += "display:table;";
            if (me._getMeasurements(me._getMeasurmentsObj(RIContext.CurrObjParent, RIContext.CurrObjIndex), true) != "")
                Style += me._getMeasurements(me._getMeasurmentsObj(RIContext.CurrObjParent, RIContext.CurrObjIndex), true);
            Style += me._getElementsNonTextStyle(RIContext.RS, RIContext.CurrObj.Elements);
    
            RIContext.$HTMLParent.attr("Style", Style);

            if (RIContext.CurrObj.Elements.SharedElements.IsToggleParent == true || RIContext.CurrObj.Elements.NonSharedElements.IsToggleParent == true) {
                var $Drilldown = $("<div/>");
                $Drilldown.attr("id", RIContext.CurrObj.Elements.NonSharedElements.UniqueName);
                $Drilldown.html("&nbsp");

                if (RIContext.CurrObj.Elements.NonSharedElements.ToggleState != null && RIContext.CurrObj.Elements.NonSharedElements.ToggleState == true)
                    $Drilldown.addClass("Drilldown-Collapse");
                else
                    $Drilldown.addClass("Drilldown-Expand");

                $Drilldown.on("click", {ToggleID: RIContext.CurrObj.Elements.NonSharedElements.UniqueName }, function (e) { me.options.ReportViewer.ToggleItem(e.data.ToggleID); });
                $Drilldown.addClass("cursor-pointer");
                RIContext.$HTMLParent.append($Drilldown);
            }
            if (RIContext.CurrObj.Elements.SharedElements.CanSort != null) {
                $Sort = $("<div/>");
                $Sort.html("&nbsp");
                var Direction = "None";
                var sortDirection = forerunner.ssr.constants.sortDirection;

                if (RIContext.CurrObj.Elements.NonSharedElements.SortState == 2) {
                    $Sort.attr("class", "sort-descending");
                    Direction = sortDirection.desc;
                }
                else if (RIContext.CurrObj.Elements.NonSharedElements.SortState == 1) {
                    $Sort.attr("class", "sort-ascending");
                    Direction = sortDirection.asc;
                }
                else
                    $Sort.attr("class", "sort-unsorted");

                $Sort.on("click", { Viewer:  RIContext.RS, SortID: RIContext.CurrObj.Elements.NonSharedElements.UniqueName, Direction: Direction }, function (e) { e.data.Viewer.Sort(e.data.Direction, e.data.SortID); });
                RIContext.$HTMLParent.append($Sort);
            }
            me._writeActions(RIContext, RIContext.CurrObj.Elements.NonSharedElements, $TextObj);

            Style = "display: table-cell;white-space:pre-wrap;word-break:break-word;word-wrap:break-word;";
            Style += me._getElementsTextStyle(RIContext.CurrObj.Elements);
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
                var ParentName = {};
                var ParagraphContainer = {};
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

                me._writeRichTextItem(RIContext, ParagraphContainer, LowIndex, "Root", $TextObj);
            }
            me._writeBookMark(RIContext);
    
            //RIContext.$HTMLParent.append(ParagraphContainer["Root"]);
            RIContext.$HTMLParent.append($TextObj);
            if ($Sort != null) RIContext.$HTMLParent.append($Sort);
            return RIContext.$HTMLParent;
        },
        _writeRichTextItem: function (RIContext, Paragraphs, Index, ParentName, ParentContainer) {
            var $ParagraphList = null;
            var me = this;

            $.each(Paragraphs[Index], function (SubIndex, Obj) {
                if (Obj.Parent == ParentName) {
                    var $ParagraphItem;
                    Obj = Obj.Value;
                    if (Obj.Paragraph.SharedElements.ListStyle == 1) {
                        if ($ParagraphList == null || !$ParagraphList.is("ol")) $ParagraphList = new $("<OL />");
                        $ParagraphList.addClass(me._getListStyle(1, Obj.Paragraph.SharedElements.ListLevel));

                        $ParagraphItem = new $("<LI />");
                    }
                    else if (Obj.Paragraph.SharedElements.ListStyle == 2) {
                        if ($ParagraphList == null || !$ParagraphList.is("ul")) $ParagraphList = new $("<UL />");
                        $ParagraphList.addClass(me._getListStyle(2, Obj.Paragraph.SharedElements.ListLevel));

                        $ParagraphItem = new $("<LI />");
                    }
                    else {
                        if ($ParagraphList == null || !$ParagraphList.is("div")) $ParagraphList = new $("<DIV />");
                        $ParagraphItem = new $("<DIV />");
                    }

                    var ParagraphStyle = "";
                    ParagraphStyle += me._getMeasurements(me._getMeasurmentsObj(Obj, Index));
                    ParagraphStyle += me._getElementsStyle(RIContext.RS, Obj.Paragraph);
                    $ParagraphItem.attr("Style", ParagraphStyle);
                    $ParagraphItem.attr("name", Obj.Paragraph.NonSharedElements.UniqueName);

                    //Handle each TextRun
                    for (var i = 0; i < Obj.TextRunCount; i++) {
                        var $TextRun;
                        var flag = true;
                        //With or without Action in TextRun
                        if (Obj.TextRuns[i].Elements.NonSharedElements.ActionInfo == undefined) {
                            $TextRun = new $("<SPAN />");
                        }
                        else {
                            $TextRun = new $("<A />");
                            me._writeActions(RIContext, Obj.TextRuns[i].Elements.NonSharedElements, $TextRun);
                        }

                        if (Obj.TextRuns[i].Elements.SharedElements.Value != undefined && Obj.TextRuns[i].Elements.SharedElements.Value != "") {
                            $TextRun.html(Obj.TextRuns[i].Elements.SharedElements.Value);
                        }
                        else if (Obj.TextRuns[i].Elements.NonSharedElements.Value != undefined && Obj.TextRuns[i].Elements.NonSharedElements.Value != "") {
                            $TextRun.html(Obj.TextRuns[i].Elements.NonSharedElements.Value);
                        }
                        else {
                            $TextRun.html("&nbsp");
                            flag = false;
                        }

                        $TextRun.attr("Name", Obj.TextRuns[i].Elements.NonSharedElements.UniqueName);

                        if (flag) {
                            var TextRunStyle = "";
                            TextRunStyle += me._getMeasurements(me._getMeasurmentsObj(Obj.TextRuns[i], i));
                            TextRunStyle += me._getElementsStyle(RIContext.RS, Obj.TextRuns[i].Elements);
                            $TextRun.attr("Style", TextRunStyle);
                        }

                        $ParagraphItem.append($TextRun);
                    }
            
                    if (Paragraphs[Index + 1] != null)
                        me._writeRichTextItem(RIContext, Paragraphs, Index + 1, Obj.Paragraph.NonSharedElements.UniqueName, $ParagraphItem);

                    $ParagraphList.append($ParagraphItem);
                    ParentContainer.append($ParagraphList);
                }
            });
        },
        _getImageURL: function (RS, ImageName) {
            var me = this;

            var Url = me.options.ReportViewer.options.ReportViewerAPI + "/GetImage/?";
            Url += "ReportServerURL=" + me.options.ReportViewer.options.ReportServerURL;
            Url += "&SessionID=" + me.options.ReportViewer.sessionID;
            Url += "&ImageID=" + ImageName;
            return Url;
        },
        _writeImage: function (RIContext) {
            var NewImage = new Image();
            var me = this;

            var Style = RIContext.Style + "display:block;max-height:100%;max-width:100%;" + me._getElementsStyle(RIContext.RS, RIContext.CurrObj.Elements);
            Style += me._getMeasurements(me._getMeasurmentsObj(RIContext.CurrObjParent, RIContext.CurrObjIndex), true);
            Style += "overflow:hidden;";

            var ImageName;
            var sizingType = RIContext.CurrObj.Elements.SharedElements.Sizing;

            if (RIContext.CurrObj.Type == "Image")
                ImageName = RIContext.CurrObj.Elements.NonSharedElements.ImageDataProperties.ImageName;
            else
                ImageName = RIContext.CurrObj.Elements.NonSharedElements.StreamName;
                        
            if (RIContext.CurrObj.Elements.NonSharedElements.ActionImageMapAreas != undefined) {
                NewImage.useMap = "#Map_" + RIContext.RS.sessionID + "_" + RIContext.CurrObj.Elements.NonSharedElements.UniqueName;
            }
            NewImage.onload = function () {
                me._writeActionImageMapAreas(RIContext, $(NewImage).width(), $(NewImage).height());
                var naturalSize = me._getNatural(this);
                
                me._resizeImage(this, sizingType, naturalSize.height, naturalSize.width, RIContext.CurrLocation.Height, RIContext.CurrLocation.Width);
            };
            NewImage.alt = forerunner.ssr.constants.messages.imageNotDisplay;
            $(NewImage).attr("style", "display:block;" );

            NewImage.src = this._getImageURL(RIContext.RS, ImageName);

            this._writeActions(RIContext, RIContext.CurrObj.Elements.NonSharedElements, $(NewImage));
            this._writeBookMark(RIContext);
  
            RIContext.$HTMLParent.attr("style", Style);
            RIContext.$HTMLParent.append(NewImage);
            return RIContext.$HTMLParent;
        },
        _writeActions: function (RIContext, Elements, $Control) {
            if (Elements.ActionInfo != null)
                for (var i = 0; i < Elements.ActionInfo.Count; i++) {
                    this._writeAction(RIContext, Elements.ActionInfo.Actions[i], $Control);
                }
        },
        _writeAction: function (RIContext, Action, Control) {
            var me = this;
            if (Action.HyperLink != undefined) {
                Control.attr("href", Action.HyperLink);
            }
            else if (Action.BookmarkLink != undefined) {
                //HRef needed for ImageMap, Class needed for non image map
                Control.attr("href", "#");
                Control.addClass("cursor-pointer");
                Control.on("click", {BookmarkID: Action.BookmarkLink }, function (e) {
                    me._stopDefaultEvent(e);
                    me.options.ReportViewer.NavigateBookmark(e.data.BookmarkID);
                });
            }
            else {
                //HRef needed for ImageMap, Class needed for non image map
                Control.addClass("cursor-pointer");
                Control.attr("href", "#");
                Control.on("click", { DrillthroughId: Action.DrillthroughId }, function (e) {
                    me._stopDefaultEvent(e);
                    me.options.ReportViewer.NavigateDrillthrough(e.data.DrillthroughId);
                });
            }
        },
        _writeActionImageMapAreas: function (RIContext, width, height) {
            var ActionImageMapAreas = RIContext.CurrObj.Elements.NonSharedElements.ActionImageMapAreas;
            var me = this;

            if (ActionImageMapAreas != undefined) {
                var $Map = $("<MAP/>");
                $Map.attr("name", "Map_" + RIContext.RS.sessionID + "_" + RIContext.CurrObj.Elements.NonSharedElements.UniqueName);
                $Map.attr("id", "Map_" + RIContext.RS.sessionID + "_" + RIContext.CurrObj.Elements.NonSharedElements.UniqueName);

                for (var i = 0; i < ActionImageMapAreas.Count; i++) {
                    var element = ActionImageMapAreas.ActionInfoWithMaps[i];

                    for (var j = 0; j < element.ImageMapAreas.Count; j++) {
                        var $Area = $("<AREA />");
                        $Area.attr("tabindex", i + 1);
                        $Area.attr("style", "text-decoration:none");
                        $Area.attr("alt", element.ImageMapAreas.ImageMapArea[j].Tooltip);
                        if (element.Actions != undefined) {
                            this._writeAction(RIContext, element.Actions[0], $Area);
                        }

                        var shape;
                        var coords = "";
                        switch (element.ImageMapAreas.ImageMapArea[j].ShapeType) {
                            case 0:
                                shape = "rect";
                                coords = parseInt(element.ImageMapAreas.ImageMapArea[j].Coordinates[0] * width / 100, 10) + "," +
                                            parseInt(element.ImageMapAreas.ImageMapArea[j].Coordinates[1] * height / 100, 10) + "," +
                                            parseInt(element.ImageMapAreas.ImageMapArea[j].Coordinates[2] * width / 100, 10) + "," +
                                            parseInt(element.ImageMapAreas.ImageMapArea[j].Coordinates[3] * height / 100, 10);
                                break;
                            case 1:
                                shape = "poly";
                                var coorCount = element.ImageMapAreas.ImageMapArea[j].CoorCount;
                                for (var k = 0; k < coorCount; k++) {
                                    if (k % 2 == 0) {
                                        coords += parseInt(element.ImageMapAreas.ImageMapArea[j].Coordinates[k] * width / 100, 10);
                                    }
                                    else {
                                        coords += parseInt(element.ImageMapAreas.ImageMapArea[j].Coordinates[k] * height / 100, 10);
                                    }
                                    if (k < coorCount - 1) {
                                        coords += ",";
                                    }
                                }
                                break;
                            case 2:
                                shape = "circ";
                                coords = parseInt(element.ImageMapAreas.ImageMapArea[j].Coordinates[0] * width / 100, 10) + "," +
                                    parseInt(element.ImageMapAreas.ImageMapArea[j].Coordinates[1] * height / 100, 10) + "," +
                                    parseInt(element.ImageMapAreas.ImageMapArea[j].Coordinates[2] * width / 100, 10);
                                break;
                        }
                        $Area.attr("shape", shape);
                        $Area.attr("coords", coords);
                        $Map.append($Area);
                    }
                }
                RIContext.$HTMLParent.append($Map);
            }
        },
        _resizeImage: function (img, sizingType, height, width, maxHeight, maxWidth) {
            var ratio = 0;
            var me = this;

            height = this._convertToMM(height + "px");
            width = this._convertToMM(width + "px");
            if (height != 0 && width != 0) {
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
                        if (height / maxHeight > 1 || width / maxWidth > 1) {
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
                        var naturalSize = me._getNatural(img);
                        $(img).css("height", this._convertToMM(naturalSize.height + "px") + "mm");
                        $(img).css("width", this._convertToMM(naturalSize.width + "px") + "mm");
                        $(img).css("max-height", this._convertToMM(naturalSize.height + "px") + "mm");
                        $(img).css("max-width", this._convertToMM(naturalSize.width + "px") + "mm");
                        //Also add style overflow:hidden to it's parent container
                        break;
                    default:
                        break;
                }
            }
        },
        _writeBookMark: function (RIContext) {
            var $node = $("<a/>");
            var me = this;

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
        },
        _writeTablixCell: function (RIContext, Obj, Index, BodyCellRowIndex) {
            var $Cell = new $("<TD/>");
            var Style = "";
            var width;
            var height;
            //var hbordersize = 0;
            //var wbordersize = 0;
            var me = this;
    
            Style = "vertical-align:top;padding:0;margin:0;-webkit-box-sizing:border-box;-moz-box-sizing:border-box;box-sizing:border-box;-ms-box-sizing: border-box;";
            Style += this._getFullBorderStyle(Obj.Cell.ReportItem);
            var ColIndex = Obj.ColumnIndex;

            var RowIndex;
            if (BodyCellRowIndex == null)
                RowIndex = Obj.RowIndex;
            else
                RowIndex = BodyCellRowIndex;

            width = RIContext.CurrObj.ColumnWidths.Columns[ColIndex].Width;
            height = RIContext.CurrObj.RowHeights.Rows[RowIndex].Height;
            Style += "overflow:hidden;width:" + width + "mm;" + "max-width:" + width + "mm;"  + "height:" + height + "mm;";

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
            $Cell.append(this._writeReportItems(new ReportItemContext(RIContext.RS, Obj.Cell.ReportItem, Index, RIContext.CurrObj, new $("<Div/>"), "margin:0;overflow:hidden;width:100%;height:100%;", new TempMeasurement(height, width))));
            return $Cell;
        },
        _writeTablix: function (RIContext) {
            var $Tablix = this._getDefaultHTMLTable();
            var Style = "border-collapse:collapse;padding:0;margin:0;";
            var $Row;
            var LastRowIndex = 0;
            var $FixedColHeader = new $("<DIV/>").css({ display: "table", position: "absolute", top: "0px", left: "0px",padding: "0",margin:"0", "border-collapse": "collapse"});
            var $FixedRowHeader = new $("<TABLE/>").css({ position: "absolute", top: "0px", left: "0px", padding: "0", margin: "0", "border-collapse": "collapse" });
            $FixedRowHeader.attr("CELLSPACING", 0);
            $FixedRowHeader.attr("CELLPADDING", 0);
            var LastObjType = "";
            var HasFixedRows = false;
            var HasFixedCols = false;
            var me = this;

            Style += me._getMeasurements(me._getMeasurmentsObj(RIContext.CurrObjParent, RIContext.CurrObjIndex));
            Style += me._getElementsStyle(RIContext.RS, RIContext.CurrObj.Elements);
            $Tablix.attr("Style", Style);
    
            $Row = new $("<TR/>");
            $.each(RIContext.CurrObj.TablixRows, function (Index, Obj) {


                if (Obj.RowIndex != LastRowIndex) {
                    $Tablix.append($Row);

                    //Handle fixed col header
                    if (RIContext.CurrObj.RowHeights.Rows[Obj.RowIndex - 1].FixRows == 1)
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
                        $Row.append(me._writeTablixCell(RIContext, BRObj, BRIndex, Obj.RowIndex));
                    });
                }
                else {
                    if (Obj.Cell != null) $Row.append(me._writeTablixCell(RIContext, Obj, Index));
                }
                LastObjType = Obj.Type;
            });
            $Tablix.append($Row);

            if (HasFixedRows) {
                $FixedColHeader.hide();
                // $Tablix.append($FixedColHeader);
            }
            else
                $FixedColHeader = null;

            if (HasFixedCols) {
                $FixedRowHeader.hide();
                //$Tablix.append($FixedRowHeader);
            }
            else
                $FixedRowHeader = null;

            var ret = $("<div style='position:relative'></div");
            ret.append($FixedColHeader);
            ret.append($FixedRowHeader);
            ret.append($Tablix);
            RIContext.RS.floatingHeaders.push(new FloatingHeader(ret, $FixedColHeader, $FixedRowHeader));
            return ret;
        },
        _writeSubreport: function (RIContext) {
            var me = this;
            RIContext.Style += this._getElementsStyle(RIContext.RS, RIContext.CurrObj.SubReportProperties);
            RIContext.CurrObj = RIContext.CurrObj.BodyElements;
            return this._writeRectangle(RIContext);
    
        },
        _writeLine: function (RIContext) {
            var measurement = this._getMeasurmentsObj(RIContext.CurrObjParent, RIContext.CurrObjIndex);
            var Style = "position:relative;width:" + measurement.Width + "mm;height:" + measurement.Height + "mm;";
            var me = this;
            if (measurement.Width == 0 || measurement.Height == 0)
                Style += me._getFullBorderStyle(RIContext.CurrObj);
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
                lineStyle += me._getFullBorderStyle(RIContext.CurrObj);
                lineStyle += "width:" + newWidth + "mm;height:0;";
                lineStyle += "-moz-transform: rotate(" + rotate + "rad);";
                lineStyle += "-webkit-transform: rotate(" + rotate + "rad);";
                lineStyle += "-ms-transform: rotate(" + rotate + "rad);";
                lineStyle += "transform: rotate(" + rotate + "rad);";
                $line.attr("Style", lineStyle);

                //Line don't have action
                //if (RIContext.CurrObj.Elements.NonSharedElements.ActionInfo != null)
                //    for (var i = 0; i < Obj.TextRuns[i].Elements.NonSharedElements.ActionInfo.Count; i++) {
                //        me._writeAction(RIContext, RIContext.CurrObj.Elements.NonSharedElements.ActionInfo.Actions[i], $line);
                //    }

                RIContext.$HTMLParent.append($line);
            }

            

            me._writeBookMark(RIContext);

            RIContext.$HTMLParent.attr("Style", Style + RIContext.Style);
            return RIContext.$HTMLParent;

        },
        _writeExportPanel: function () {
            var me = this;
            var $ExportPanel = $("<div class='Export-Panel'></div>");
            var exportType = forerunner.ssr.constants.exportType;

            var ExportList = [];
            ExportList.push({ Name: exportType.xml, Type: "XML" });
            ExportList.push({ Name: exportType.csv, Type: "CSV" });
            ExportList.push({ Name: exportType.pdf, Type: "PDF" });
            ExportList.push({ Name: exportType.mhtml, Type: "MHTML" });
            ExportList.push({ Name: exportType.excel, Type: "EXCELOPENXML" });
            ExportList.push({ Name: exportType.tiff, Type: "IMAGE" });
            ExportList.push({ Name: exportType.word, Type: "WORDOPENXML" });

            $.each(ExportList, function (Index, ExportObj) {
                $ExportPanel.append(me._getExportItem(ExportObj));
            });

            $(document).on("click", function (e) {
                if (!$(e.target).hasClass("Export-Panel") && !$(e.target).hasClass("fr-button-export") && $ExportPanel.is(":visible")) {
                    $ExportPanel.toggle();
                }
            });

            $(".fr-button-export").filter(":visible").append($ExportPanel);
        },
        _getExportItem: function (ExportObj) {
            var me = this;
            var $ExportItem = $("<div class='Export-Item'></div>");

            $ExportItem.hover(function () {
                $ExportItem.addClass("Export-Hover");
            },
            function () {
                $ExportItem.removeClass("Export-Hover");
            });

            var $ExportLink = $("<a class='Export-Link' value='" + ExportObj.Type + "' href='javascript:void(0)'>" + ExportObj.Name + "</a>");
            $ExportLink.on("click", function () {
                me.options.ReportViewer.Export(ExportObj.Type);
            });

            $ExportItem.append($ExportLink);
            return $ExportItem;
        },
        

        //Helper fucntions
        _getHeight: function ($Obj) {
            var height;

            var $copiedElem = $Obj.clone()
                                .css({
                                    visibility: "hidden"
                                });

            $copiedElem.find('img').remove();

            $("body").append($copiedElem);
            height = $copiedElem.height() + "px";

            $copiedElem.remove();

            //Return in mm
            return this._convertToMM(height);

        },
        _getElementsStyle: function (RS, CurrObj) {
            var Style = "";
            var me = this;

            Style += me._getStyle(RS, CurrObj.SharedElements.Style, CurrObj.NonSharedElements);
            Style += me._getStyle(RS, CurrObj.NonSharedElements.Style, CurrObj.NonSharedElements);
            return Style;
        },
        _getElementsTextStyle: function (CurrObj) {
            var Style = "";
            var me = this;

            Style += me._getTextStyle(CurrObj.SharedElements.Style, CurrObj.NonSharedElements);
            Style += me._getTextStyle(CurrObj.NonSharedElements.Style, CurrObj.NonSharedElements);
            return Style;
        },
        _getElementsNonTextStyle: function (RS, CurrObj) {
            var Style = "";
            var me = this;

            Style += me._getNonTextStyle(RS, CurrObj.SharedElements.Style, CurrObj.NonSharedElements);
            Style += me._getNonTextStyle(RS, CurrObj.NonSharedElements.Style, CurrObj.NonSharedElements);
            return Style;
        },
        _getBorderSize: function (CurrObj, Side) {
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
                return this._convertToMM(DefaultSize);
            else
                return this._convertToMM(SideSize);
        },
        _getPaddingSize: function (CurrObj, Side) {
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
            return this._convertToMM(SideSize);
        },
        _getFullBorderStyle: function (CurrObj) {
            var Style = "";
            var Obj;

            if (CurrObj.Elements == null)
                return "";

            //Need left, top, right bottom border
            Obj = CurrObj.Elements.SharedElements.Style;
            if (Obj != null) {
                if (Obj.BorderStyle != null)
                    Style += "border:" + Obj.BorderWidth + " " + this._getBorderStyle(Obj.BorderStyle) + " " + Obj.BorderColor + ";";
                if (Obj.BorderStyleLeft != null || Obj.BorderWidthLeft != null || Obj.BorderColorLeft != null)
                    Style += "border-left:" + ((Obj.BorderWidthLeft == null) ? Obj.BorderWidth : Obj.BorderWidthLeft) + " " + ((Obj.BorderStyleLeft == null) ? this._getBorderStyle(Obj.BorderStyle) : this._getBorderStyle(Obj.BorderStyleLeft)) + " " + ((Obj.BorderColorLeft == null) ? Obj.BorderColor : Obj.BorderColorLeft) + ";";
                if (Obj.BorderStyleRight != null || Obj.BorderWidthRight != null || Obj.BorderColorRight != null)
                    Style += "border-right:" + ((Obj.BorderWidthRight == null) ? Obj.BorderWidth : Obj.BorderWidthRight) + " " + ((Obj.BorderStyleRight == null) ? this._getBorderStyle(Obj.BorderStyle) : this._getBorderStyle(Obj.BorderStyleRight)) + " " + ((Obj.BorderColorRight == null) ? Obj.BorderColr : Obj.BorderColorRight) + ";";
                if (Obj.BorderStyleTop != null || Obj.BorderWidthTop != null || Obj.BorderColorTop != null)
                    Style += "border-top:" + ((Obj.BorderWidthTop == null) ? Obj.BorderWidth : Obj.BorderWidthTop) + " " + ((Obj.BorderStyleTop == null) ? this._getBorderStyle(Obj.BorderStyle) : this._getBorderStyle(Obj.BorderStyleTop)) + " " + ((Obj.BorderColorTop == null) ? Obj.BorderColor : Obj.BorderColorTop) + ";";
                if (Obj.BorderStyleBottom != null || Obj.BorderWidthBottom != null || Obj.BorderColorBottom != null)
                    Style += "border-bottom:" + ((Obj.BorderWidthBottom == null) ? Obj.BorderWidth : Obj.BorderWidthBottom) + " " + ((Obj.BorderStyleBottom == null) ? this._getBorderStyle(Obj.BorderStyle) : this._getBorderStyle(Obj.BorderStyleBottom)) + " " + ((Obj.BorderColorBottom == null) ? Obj.BorderColor : Obj.BorderColorBottom) + ";";
            }
            Obj = CurrObj.Elements.NonSharedElements.Style;
            if (Obj != null) {
                if (Obj.BorderStyle != null)
                    Style += "border:" + Obj.BorderWidth + " " + this._getBorderStyle(Obj.BorderStyle) + " " + Obj.BorderColor + ";";
                if (Obj.BorderStyleLeft != null || Obj.BorderWidthLeft != null || Obj.BorderColorLeft != null)
                    Style += "border-left:" + ((Obj.BorderWidthLeft == null) ? Obj.BorderWidth : Obj.BorderWidthLeft) + " " + ((Obj.BorderStyleLeft == null) ? this._getBorderStyle(Obj.BorderStyle) : this._getBorderStyle(Obj.BorderStyleLeft)) + " " + ((Obj.BorderColorLeft == null) ? Obj.BorderColor : Obj.BorderColorLeft) + ";";
                if (Obj.BorderStyleRight != null || Obj.BorderWidthRight != null || Obj.BorderColorRight != null)
                    Style += "border-right:" + ((Obj.BorderWidthRight == null) ? Obj.BorderWidth : Obj.BorderWidthRight) + " " + ((Obj.BorderStyleRight == null) ? this._getBorderStyle(Obj.BorderStyle) : this._getBorderStyle(Obj.BorderStyleRight)) + " " + ((Obj.BorderColorRight == null) ? Obj.BorderColr : Obj.BorderColorRight) + ";";
                if (Obj.BorderStyleTop != null || Obj.BorderWidthTop != null || Obj.BorderColorTop != null)
                    Style += "border-top:" + ((Obj.BorderWidthTop == null) ? Obj.BorderWidth : Obj.BorderWidthTop) + " " + ((Obj.BorderStyleTop == null) ? this._getBorderStyle(Obj.BorderStyle) : this._getBorderStyle(Obj.BorderStyleTop)) + " " + ((Obj.BorderColorTop == null) ? Obj.BorderColor : Obj.BorderColorTop) + ";";
                if (Obj.BorderStyleBottom != null || Obj.BorderWidthBottom != null || Obj.BorderColorBottom != null)
                    Style += "border-bottom:" + ((Obj.BorderWidthBottom == null) ? Obj.BorderWidth : Obj.BorderWidthBottom) + " " + ((Obj.BorderStyleBottom == null) ? this._getBorderStyle(Obj.BorderStyle) : this._getBorderStyle(Obj.BorderStyleBottom)) + " " + ((Obj.BorderColorBottom == null) ? Obj.BorderColor : Obj.BorderColorBottom) + ";";
            }
            return Style;
        },
        _getMeasurements: function (CurrObj, includeHeight) {
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
        },
        _getStyle: function (RS, CurrObj, TypeCodeObj) {
            var Style = "";

            if (CurrObj == null)
                return Style;

            Style += this._getNonTextStyle(RS, CurrObj, TypeCodeObj);
            Style += this._getTextStyle(CurrObj, TypeCodeObj);

            return Style;
        },
        _backgroundRepeatTypesMap: function () {
            return {
                0: "repeat",    // Repeat
                1: "no-repeat", // Clip
                2: "repeat-x",  // RepeatX
                3: "repeat-y"   // RepeatY
            };
        },
        _getImageStyleURL: function (RS, ImageName) {
            return "url(" + this._getImageURL(RS, ImageName) + ")";
        },
        _getNonTextStyle: function (RS, CurrObj, TypeCodeObj) {
            var Style = "";

            if (CurrObj == null)
                return Style;

            if (CurrObj.BackgroundColor != null)
                Style += "background-color:" + CurrObj.BackgroundColor + ";";
            if (CurrObj.BackgroundImage != null)
                Style += "background-image:" + this._getImageStyleURL(RS, CurrObj.BackgroundImage.ImageName) + ";";
            if (CurrObj.BackgroundRepeat != null && this._backgroundRepeatTypesMap()[CurrObj.BackgroundRepeat] != undefined)
                Style += "background-repeat:" + this._backgroundRepeatTypesMap()[CurrObj.BackgroundRepeat] + ";";

            return Style;
        },
        _getTextStyle: function (CurrObj, TypeCodeObj) {

            var Style = "";

            if (CurrObj == null)
                return Style;

            if (CurrObj.PaddingBottom != null)
                Style += "padding-bottom:" + CurrObj.PaddingBottom + ";";
            if (CurrObj.PaddingLeft != null)
                Style += "padding-left:" + CurrObj.PaddingLeft + ";";
            if (CurrObj.PaddingRight != null)
                Style += "padding-right:" + CurrObj.PaddingRight + ";";
            if (CurrObj.PaddingTop != null)
                Style += "padding-top:" + CurrObj.PaddingTop + ";";
            if (CurrObj.UnicodeBiDi != null)
                Style += "unicode-bidi:" + this._getBiDi(CurrObj.UnicodeBiDi) + ";";
            if (CurrObj.VerticalAlign != null)
                Style += "vertical-align:" + this._getVAligh(CurrObj.VerticalAlign) + ";";
            if (CurrObj.WritingMode != null)
                Style += "layout-flow:" + this._getLayoutFlow(CurrObj.WritingMode) + ";";
            if (CurrObj.Direction != null)
                Style += "Direction:" + this._getDirection(CurrObj.Direction) + ";";

            if (CurrObj.TextAlign != null)
                Style += "text-align:" + this._getTextAlign(CurrObj.TextAlign, TypeCodeObj) + ";";
            if (CurrObj.FontStyle != null)
                Style += "font-style:" + this._getFontStyle(CurrObj.FontStyle) + ";";
            if (CurrObj.FontWeight != null)
                Style += "font-weight:" + this._getFontWeight(CurrObj.FontWeight) + ";";
            if (CurrObj.FontFamily != null)
                Style += "font-family:" + CurrObj.FontFamily + ";";
            if (CurrObj.FontSize != null)
                Style += "font-size:" + CurrObj.FontSize + ";";
            if (CurrObj.TextDecoration != null)
                Style += "text-decoration:" + this._getTextDecoration(CurrObj.TextDecoration) + ";";
            if (CurrObj.Color != null)
                Style += "color:" + CurrObj.Color + ";";
            //   if (CurrObj.Calendar != null)
            //       Style += "calendar:" + GetCalendar(CurrObj.Calendar) + ";";
            //writing-mode:lr-tb;?
            return Style;
        },
        _getCalendar: function (RPLCode) {
            switch (RPLCode) {
                case 0:
                    return "Gregorian";
                case 1:
                    return "GregorianArabic";
                case 2:
                    return "GregorianMiddleEastFrench";
                case 3:
                    return "GregorianTransliteratedEnglish";
                case 4:
                    return "GregorianTransliteratedFrench";
                case 5:
                    return "GregorianUSEnglish";
                case 6:
                    return "Hebrew";
                case 7:
                    return "Hijri";
                case 9:
                    return "Korean";
                case 10:
                    return "Julian";
                case 11:
                    return "Taiwan";
                case 12:
                    return "ThaiBuddist";
            }
            return "Gregorian";
        },
        _getTextDecoration: function (RPLCode) {
            switch (RPLCode) {
                case 0:
                    return "None";
                case 1:
                    return "Underline";
                case 2:
                    return "Overline";
                case 3:
                    return "LineThrough";
            }
            return "None";
        },
        _getFontWeight: function (RPLCode) {
            switch (RPLCode) {
                case 0:
                    return "Normal";
                case 1:
                    return "Thin";
                case 2:
                    return "ExtraLight";
                case 3:
                    return "Light";
                case 4:
                    return "Medium";
                case 5:
                    return "SemiBold";
                case 6:
                    return "Bold";
                case 7:
                    return "ExtraBold";
                case 8:
                    return "Heavy";
            }
            return "General";
        },
        _getFontStyle: function (RPLCode) {
            switch (RPLCode) {
                case 0:
                    return "Normal";
                case 1:
                    return "Italic";
            }
            return "Normal";
        },
        _getTextAlign: function (RPLCode, TypeCodeObj) {
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
                        case 4:
                        case 17:
                        case 18:
                            return "Left";
                        default:
                            return "Left";
                    }

                    break;
                case 1:
                    return "Left";
                case 2:
                    return "Center";
                case 3:
                    return "Right";
            }

        },
        _getDirection: function (RPLCode) {
            switch (RPLCode) {
                case 0:
                    return "LTR";
                case 1:
                    return "RTL";

            }
            return "LTR";
        },
        _getLayoutFlow: function (RPLCode) {
            switch (RPLCode) {
                case 0:
                    return "Horizontal";
                case 1:
                    return "Vertical";
                case 2:
                    return "Rotate270";
            }
            return "Horizontal";
        },
        _getVAligh: function (RPLCode) {
            switch (RPLCode) {
                case 0:
                    return "Top";
                case 1:
                    return "Middle";
                case 2:
                    return "Bottom";
            }
            return "Top";
        },
        _getBiDi: function (RPLCode) {
            switch (RPLCode) {
                case 0:
                    return "normal";
                case 1:
                    return "embed";
                case 2:
                    return "BiDiOverride";
            }
            return "normal";
        },
        _getDefaultHTMLTable: function () {
            var $NewObj = $("<Table/>");

            $NewObj.attr("CELLSPACING", 0);
            $NewObj.attr("CELLPADDING", 0);
            return $NewObj;
        },
        _getBorderStyle: function (RPLStyle) {
            switch (RPLStyle) {
                case 0:
                    return "None";
                case 1:
                    return "Dotted";
                case 2:
                    return "Dashed";
                case 3:
                    return "Solid";
                case 4:
                    return "Double";
            }
            return "None";
        },
        _getMeasurmentsObj: function (CurrObj, Index) {
            var retval = null;

            if (CurrObj.Measurement != null)
                retval = CurrObj.Measurement.Measurements[Index];
            return retval;
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
        _getListStyle: function (Style, Level) {
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
        },
        _stopDefaultEvent: function (e) {
            //IE
            if (window.ActiveXObject)
                window.event.returnValue = false;
            else {
                e.preventDefault();
                e.stopPropagation();
            }
        },
        _getNatural: function (domElement) {
            if (domElement.naturalWidth != null && domElement.naturalHeight != null) {
                return { width: domElement.naturalWidth, height: domElement.naturalHeight };
            }
            else {
                var img = new Image();
                img.src = domElement.src;
                return { width: img.width, height: img.height };
            }
        },
    });  // $.widget
});