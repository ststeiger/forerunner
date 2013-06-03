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
            this.ReportViewer = this.options.ReportViewer;
        },
                
        Render: function (pageNum) {
            ReportDiv = $(this);
            ReportViewer = this.ReportViewer
            var me = this;

            ReportDiv.attr("Style", this._GetStyle(ReportViewer, ReportViewer.Pages[pageNum].ReportObj.Report.PageContent.PageStyle));
            $.each(ReportViewer.Pages[pageNum].ReportObj.Report.PageContent.Sections, function (Index, Obj) { me._WriteSection(new ReportItemContext(ReportViewer, Obj, Index, ReportViewer.Pages[pageNum].ReportObj.Report.PageContent, ReportViewer.Pages[pageNum].$Container, "")); });
        },

        _WriteSection: function (RIContext) {
            var me = this;
            var $NewObj = me._GetDefaultHTMLTable();
            var $Sec = $("<TR/>");
            var Location = me._GetMeasurmentsObj(RIContext.CurrObjParent, RIContext.CurrObjIndex);

            $Sec.attr("Style", "width:" + Location.Width + "mm;");

                //Columns
            $NewObj.append($Sec);
            $.each(RIContext.CurrObj.Columns, function (Index, Obj) {
                var $col = new $("<TD/>");
                $col.append(me._WriteRectangle(new ReportItemContext(RIContext.RS, Obj, Index, RIContext.CurrObj, new $("<Div/>"), null, Location)));
                $Sec.append($col)
            });
            RIContext.$HTMLParent.append($NewObj);
        },
        _WriteRectangle: function (RIContext) {
            var $RI;        //This is the ReportItem Object
            var $LocDiv;    //This DIV will have the top and left location set, location is not set anywhere else
            var Measurements;
            var RecLayout;
            var Style;
            var me = this;

            Measurements = RIContext.CurrObj.Measurement.Measurements;
            RecLayout = me._GetRectangleLayout(Measurements);

            $.each(RIContext.CurrObj.ReportItems, function (Index, Obj) {
        
                Style = "";
                if (Obj.Type != "Line") {
                    Style = "display:table;border-collapse:collapse;";
                    Style += me._GetFullBorderStyle(Obj);
                }

                $RI = me._WriteReportItems(new ReportItemContext(RIContext.RS, Obj, Index, RIContext.CurrObj, new $("<Div/>"), Style, Measurements[Index]));
                       
                $LocDiv = new $("<Div/>");
                $LocDiv.append($RI);
                Style = "";

                //Determin height and location
                if (Obj.Type == "Image" || Obj.Type == "Chart" || Obj.Type == "Gauge" || Obj.Type == "Map" || Obj.Type == "Line")
                    RecLayout.ReportItems[Index].NewHeight = Measurements[Index].Height;
                else
                    RecLayout.ReportItems[Index].NewHeight = me._GetHeight($RI);

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

            Style = "position:relative;" + this._GetElementsStyle(RIContext.RS, RIContext.CurrObj.Elements);
            Style += me._GetFullBorderStyle(RIContext.CurrObj);

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
        },
        _GetRectangleLayout: function (Measurements) {
            var l = new Layout()
            var me = this;

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
        },
        _WriteReportItems: function (RIContext) {
            var me = this;

            switch (RIContext.CurrObj.Type) {
                case "RichTextBox":
                    return this._WriteRichText(RIContext);
                    break;
                case "Image":
                case "Chart":
                case "Gauge":
                case "Map":
                    return this._WriteImage(RIContext);
                    break;
                case "Tablix":
                    return this._WriteTablix(RIContext);
                    break;
                case "Rectangle":
                    return this._WriteRectangle(RIContext);
                    break;
                case "SubReport":
                    return this._WriteSubreport(RIContext);
                    break;
                case "Line":
                    return this._WriteLine(RIContext);
                    break;
            }
        },
        _WriteRichText: function (RIContext) {
            var Style = RIContext.Style;
            var $TextObj = $("<div/>");
            var $Sort = null;
            var me = this;

            Style += "display:table;";
            if (me._GetMeasurements(me._GetMeasurmentsObj(RIContext.CurrObjParent, RIContext.CurrObjIndex), true) != "")
                Style += this._GetMeasurements(me._GetMeasurmentsObj(RIContext.CurrObjParent, RIContext.CurrObjIndex), true);
            Style += me._GetElementsNonTextStyle(RIContext.RS, RIContext.CurrObj.Elements);
    
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
                $Drilldown.addClass("cursor-pointer");
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

                $Sort.on("click", { SortID: RIContext.CurrObj.Elements.NonSharedElements.UniqueName, Direction: Direction }, function (e) { this.ReportViewer.Sort(e.data.Direction, e.data.SortID); });
                RIContext.$HTMLParent.append($Sort);
            }
            me._WriteActions(RIContext, RIContext.CurrObj.Elements.NonSharedElements, $TextObj);

            Style = "display: table-cell;white-space:pre-wrap;word-break:break-word;word-wrap:break-word;";
            Style += me._GetElementsTextStyle(RIContext.CurrObj.Elements);
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

                me._WriteRichTextItem(RIContext, ParagraphContainer, LowIndex, "Root", $TextObj);
            }
            me._WriteBookMark(RIContext);
    
            //RIContext.$HTMLParent.append(ParagraphContainer["Root"]);
            RIContext.$HTMLParent.append($TextObj);
            if ($Sort != null) RIContext.$HTMLParent.append($Sort);
            return RIContext.$HTMLParent;
        },
        _WriteRichTextItem: function (RIContext, Paragraphs, Index, ParentName, ParentContainer) {
            var $ParagraphList = null;
            var me = this;

            $.each(Paragraphs[Index], function (SubIndex, Obj) {
                if (Obj.Parent == ParentName) {
                    var $ParagraphItem;
                    Obj = Obj.Value;
                    if (Obj.Paragraph.SharedElements.ListStyle == 1) {
                        if ($ParagraphList == null || !$ParagraphList.is("ol")) $ParagraphList = new $("<OL />");
                        $ParagraphList.addClass(this._GetListStyle(1, Obj.Paragraph.SharedElements.ListLevel));

                        $ParagraphItem = new $("<LI />");
                    }
                    else if (Obj.Paragraph.SharedElements.ListStyle == 2) {
                        if ($ParagraphList == null || !$ParagraphList.is("ul")) $ParagraphList = new $("<UL />");
                        $ParagraphList.addClass(this._GetListStyle(2, Obj.Paragraph.SharedElements.ListLevel));

                        $ParagraphItem = new $("<LI />");
                    }
                    else {
                        if ($ParagraphList == null || !$ParagraphList.is("div")) $ParagraphList = new $("<DIV />");
                        $ParagraphItem = new $("<DIV />");
                    }

                    var ParagraphStyle = "";
                    ParagraphStyle += me._GetMeasurements(me._GetMeasurmentsObj(Obj, Index));
                    ParagraphStyle += me._GetElementsStyle(RIContext.RS, Obj.Paragraph);
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
                            me._WriteActions(RIContext, Obj.TextRuns[i].Elements.NonSharedElements, $TextRun);
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
                            TextRunStyle += me._GetMeasurements(me._GetMeasurmentsObj(Obj.TextRuns[i], i));
                            TextRunStyle += me._GetElementsStyle(RIContext.RS, Obj.TextRuns[i].Elements);
                            $TextRun.attr("Style", TextRunStyle);
                        }

                        $ParagraphItem.append($TextRun);
                    }
            
                    if (Paragraphs[Index + 1] != null)
                        me._WriteRichTextItem(RIContext, Paragraphs, Index + 1, Obj.Paragraph.NonSharedElements.UniqueName, $ParagraphItem);

                    $ParagraphList.append($ParagraphItem);
                    ParentContainer.append($ParagraphList);
                }
            });
        },
        _GetImageURL: function (RS, ImageName) {
            var Url = this.ReportViewer.options.ReportViewerAPI + "/GetImage/?";
            Url += "ReportServerURL=" + this.ReportViewer.ReportServerURL;
            Url += "&SessionID=" + this.ReportViewer.SessionID;
            Url += "&ImageID=" + ImageName;
            return Url;
        },
        _WriteImage: function (RIContext) {
            var NewImage = new Image();
            var me = this;

            var Style = RIContext.Style + "display:block;max-height:100%;max-width:100%;" + me._GetElementsStyle(RIContext.RS, RIContext.CurrObj.Elements);
            Style += me._GetMeasurements(me._GetMeasurmentsObj(RIContext.CurrObjParent, RIContext.CurrObjIndex), true);
            Style += "overflow:hidden;"

            var ImageName;
            var sizingType = RIContext.CurrObj.Elements.SharedElements.Sizing;

            if (RIContext.CurrObj.Type == "Image") 
                ImageName = RIContext.CurrObj.Elements.NonSharedElements.ImageDataProperties.ImageName;
            else 
                ImageName = RIContext.CurrObj.Elements.NonSharedElements.StreamName;

            NewImage.src = this._GetImageURL(RIContext.RS, ImageName);
            if (RIContext.CurrObj.Elements.NonSharedElements.ActionImageMapAreas != undefined) {
                NewImage.useMap = "#Map_" + RIContext.RS.SessionID + "_" + RIContext.CurrObj.Elements.NonSharedElements.UniqueName;
            }
            me = this;
            NewImage.onload = function () {
                me._WriteActionImageMapAreas(RIContext, $(NewImage).width(), $(NewImage).height());
                me._ResizeImage(this, sizingType, this.naturalHeight, this.naturalWidth, RIContext.CurrLocation.Height, RIContext.CurrLocation.Width);

            };
            NewImage.alt = "Cannot display image";
            $(NewImage).attr("style", "display:block;");

            this._WriteActions(RIContext, RIContext.CurrObj.Elements.NonSharedElements, $(NewImage));
            this._WriteBookMark(RIContext);
  
            RIContext.$HTMLParent.attr("style", Style);
            RIContext.$HTMLParent.append(NewImage);
            return RIContext.$HTMLParent;
        },
        _WriteActions: function (RIContext, Elements, $Control) {
            if (Elements.ActionInfo != null)
                for (i = 0; i < Elements.ActionInfo.Count; i++) {
                    this._WriteAction(RIContext, Elements.ActionInfo.Actions[i], $Control);
                }
        },
        _WriteAction: function (RIContext, Action, Control) {
            var me = this;
            if (Action.HyperLink != undefined) {
                Control.attr("href", Action.HyperLink);
            }
            else if (Action.BookmarkLink != undefined) {
                //HRef needed for ImageMap, Class needed for non image map
                Control.attr("href", "#");
                Control.addClass("cursor-pointer");                
                Control.on("click", {BookmarkID: Action.BookmarkLink }, function (e) {
                    me._StopDefaultEvent(e);
                    me.ReportViewer.NavigateBookmark(e.data.BookmarkID);
                });
            }
            else {
                //HRef needed for ImageMap, Class needed for non image map
                Control.addClass("cursor-pointer");
                Control.attr("href", "#");
                Control.on("click", { DrillthroughId: Action.DrillthroughId }, function (e) {
                    me._StopDefaultEvent(e);
                    me.ReportViewer.NavigateDrillthrough(e.data.DrillthroughId);
                });
            }
        },
        _WriteActionImageMapAreas: function (RIContext, width, height) {
            var ActionImageMapAreas = RIContext.CurrObj.Elements.NonSharedElements.ActionImageMapAreas;
            var me = this;

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
                            this._WriteAction(RIContext, element.Actions[0], $Area);
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
        },
        _ResizeImage: function (img, sizingType, height, width, maxHeight, maxWidth) {
            var ratio = 0;
            var me = this;

            height = this._ConvertToMM(height + "px");
            width = this._ConvertToMM(width + "px");
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
                        $(img).css("height", this._ConvertToMM(img.naturalHeight + "px") + "mm");
                        $(img).css("width", this._ConvertToMM(img.naturalWidth + "px") + "mm");
                        $(img).css("max-height", this._ConvertToMM(img.naturalHeight + "px") + "mm");
                        $(img).css("max-width", this._ConvertToMM(img.naturalWidth + "px") + "mm");
                        //Also add style overflow:hidden to it's parent container
                        break;
                    default:
                        break;
                }
            }
        },
        _WriteBookMark: function (RIContext) {
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
        _WriteTablixCell: function (RIContext, Obj, Index, BodyCellRowIndex) {
            var $Cell = new $("<TD/>");
            var Style = "";
            var width;
            var height;
            var hbordersize = 0;
            var wbordersize = 0;
            var me = this;
    
            Style = "vertical-align:top;padding:0;margin:0;-webkit-box-sizing:border-box;-moz-box-sizing:border-box;box-sizing:border-box;";
            Style += this._GetFullBorderStyle(Obj.Cell.ReportItem);
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
            $Cell.append(this._WriteReportItems(new ReportItemContext(RIContext.RS, Obj.Cell.ReportItem, Index, RIContext.CurrObj, new $("<Div/>"), "margin:0;overflow:hidden;width:100%;height:100%;", new TempMeasurement(height, width))));
            return $Cell;
        },
        _WriteTablix: function (RIContext) {
            var $Tablix = this._GetDefaultHTMLTable();
            var Style = "border-collapse:collapse;padding:0;margin:0;";
            var $Row;
            var LastRowIndex = 0;
            var $FixedColHeader = new $("<DIV/>").css({ display: "none", position: "absolute", top: "0px", left: "0px" });
            var $FixedRowHeader = new $("<DIV/>").css({ display: "none", position: "absolute", top: "0px", left: "0px" });
            var LastObjType = "";
            var HasFixedRows = false;
            var HasFixedCols = false;
            var me = this;

            Style += me._GetMeasurements(me._GetMeasurmentsObj(RIContext.CurrObjParent, RIContext.CurrObjIndex));
            Style += me._GetElementsStyle(RIContext.RS, RIContext.CurrObj.Elements);
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
                        $Row.append(me._WriteTablixCell(RIContext, BRObj, BRIndex, Obj.RowIndex));
                    })
                }
                else {
                    if (Obj.Cell != null) $Row.append(me._WriteTablixCell(RIContext, Obj, Index));
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
        },
        _WriteSubreport: function (RIContext) {
            var me = this;
            RIContext.Style += this._GetElementsStyle(RIContext.RS, RIContext.CurrObj.SubReportProperties);
            RIContext.CurrObj = RIContext.CurrObj.BodyElements;
            return this._WriteRectangle(RIContext);
    
        },
        _WriteLine: function (RIContext) {
            var measurement = this._GetMeasurmentsObj(RIContext.CurrObjParent, RIContext.CurrObjIndex);
            var Style = "position:relative;width:" + measurement.Width + "mm;height:" + measurement.Height + "mm;";
            var me = this;
            if (measurement.Width == 0 || measurement.Height == 0)
                Style += me._GetFullBorderStyle(RIContext.CurrObj);
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
                lineStyle += me._GetFullBorderStyle(RIContext.CurrObj);
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
                    me._WriteAction(RIContext, RIContext.CurrObj.Elements.NonSharedElements.ActionInfo.Actions[i], NewImage);
                }

            me._WriteBookMark(RIContext);

            RIContext.$HTMLParent.attr("Style", Style + RIContext.Style);
            return RIContext.$HTMLParent;

        },

        //Helper fucntions
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
        _GetElementsStyle: function (RS, CurrObj) {
            var Style = "";
            var me = this;

            Style += me._GetStyle(RS, CurrObj.SharedElements.Style, CurrObj.NonSharedElements);
            Style += me._GetStyle(RS, CurrObj.NonSharedElements.Style, CurrObj.NonSharedElements);
            return Style;
        },
        _GetElementsTextStyle: function (CurrObj) {
            var Style = "";
            var me = this;

            Style += me._GetTextStyle(CurrObj.SharedElements.Style, CurrObj.NonSharedElements);
            Style += me._GetTextStyle(CurrObj.NonSharedElements.Style, CurrObj.NonSharedElements);
            return Style;
        },
        _GetElementsNonTextStyle: function (RS, CurrObj) {
            var Style = "";
            var me = this;

            Style += me._GetNonTextStyle(RS, CurrObj.SharedElements.Style, CurrObj.NonSharedElements);
            Style += me._GetNonTextStyle(RS, CurrObj.NonSharedElements.Style, CurrObj.NonSharedElements);
            return Style;
        },
        _GetBorderSize: function (CurrObj, Side) {
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
                return this._ConvertToMM(DefaultSize);
            else
                return this._ConvertToMM(SideSize);
        },
        _GetPaddingSize: function (CurrObj, Side) {
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
            return this._ConvertToMM(SideSize);
        },
        _GetFullBorderStyle: function (CurrObj) {
            var Style = "";
            var Obj;

            if (CurrObj.Elements == null)
                return "";

            //Need left, top, right bottom border
            Obj = CurrObj.Elements.SharedElements.Style;
            if (Obj != null) {
                if (Obj.BorderStyle != null)
                    Style += "border:" + Obj.BorderWidth + " " + this._GetBorderStyle(Obj.BorderStyle) + " " + Obj.BorderColor + ";";
                if (Obj.BorderStyleLeft != null || Obj.BorderWidthLeft != null || Obj.BorderColorLeft != null)
                    Style += "border-left:" + ((Obj.BorderWidthLeft == null) ? Obj.BorderWidth : Obj.BorderWidthLeft) + " " + ((Obj.BorderStyleLeft == null) ? this._GetBorderStyle(Obj.BorderStyle) : this._GetBorderStyle(Obj.BorderStyleLeft)) + " " + ((Obj.BorderColorLeft == null) ? Obj.BorderColor : Obj.BorderColorLeft) + ";";
                if (Obj.BorderStyleRight != null || Obj.BorderWidthRight != null || Obj.BorderColorRight != null)
                    Style += "border-right:" + ((Obj.BorderWidthRight == null) ? Obj.BorderWidth : Obj.BorderWidthRight) + " " + ((Obj.BorderStyleRight == null) ? this._GetBorderStyle(Obj.BorderStyle) : this._GetBorderStyle(Obj.BorderStyleRight)) + " " + ((Obj.BorderColorRight == null) ? Obj.BorderColr : Obj.BorderColorRight) + ";";
                if (Obj.BorderStyleTop != null || Obj.BorderWidthTop != null || Obj.BorderColorTop != null)
                    Style += "border-top:" + ((Obj.BorderWidthTop == null) ? Obj.BorderWidth : Obj.BorderWidthTop) + " " + ((Obj.BorderStyleTop == null) ? this._GetBorderStyle(Obj.BorderStyle) : this._GetBorderStyle(Obj.BorderStyleTop)) + " " + ((Obj.BorderColorTop == null) ? Obj.BorderColor : Obj.BorderColorTop) + ";";
                if (Obj.BorderStyleBottom != null || Obj.BorderWidthBottom != null || Obj.BorderColorBottom != null)
                    Style += "border-bottom:" + ((Obj.BorderWidthBottom == null) ? Obj.BorderWidth : Obj.BorderWidthBottom) + " " + ((Obj.BorderStyleBottom == null) ? this._GetBorderStyle(Obj.BorderStyle) : this._GetBorderStyle(Obj.BorderStyleBottom)) + " " + ((Obj.BorderColorBottom == null) ? Obj.BorderColor : Obj.BorderColorBottom) + ";";
            }
            Obj = CurrObj.Elements.NonSharedElements.Style;
            if (Obj != null) {
                if (Obj.BorderStyle != null)
                    Style += "border:" + Obj.BorderWidth + " " + this._GetBorderStyle(Obj.BorderStyle) + " " + Obj.BorderColor + ";";
                if (Obj.BorderStyleLeft != null || Obj.BorderWidthLeft != null || Obj.BorderColorLeft != null)
                    Style += "border-left:" + ((Obj.BorderWidthLeft == null) ? Obj.BorderWidth : Obj.BorderWidthLeft) + " " + ((Obj.BorderStyleLeft == null) ? this._GetBorderStyle(Obj.BorderStyle) : this._GetBorderStyle(Obj.BorderStyleLeft)) + " " + ((Obj.BorderColorLeft == null) ? Obj.BorderColor : Obj.BorderColorLeft) + ";";
                if (Obj.BorderStyleRight != null || Obj.BorderWidthRight != null || Obj.BorderColorRight != null)
                    Style += "border-right:" + ((Obj.BorderWidthRight == null) ? Obj.BorderWidth : Obj.BorderWidthRight) + " " + ((Obj.BorderStyleRight == null) ? this._GetBorderStyle(Obj.BorderStyle) : this._GetBorderStyle(Obj.BorderStyleRight)) + " " + ((Obj.BorderColorRight == null) ? Obj.BorderColr : Obj.BorderColorRight) + ";";
                if (Obj.BorderStyleTop != null || Obj.BorderWidthTop != null || Obj.BorderColorTop != null)
                    Style += "border-top:" + ((Obj.BorderWidthTop == null) ? Obj.BorderWidth : Obj.BorderWidthTop) + " " + ((Obj.BorderStyleTop == null) ? this._GetBorderStyle(Obj.BorderStyle) : this._GetBorderStyle(Obj.BorderStyleTop)) + " " + ((Obj.BorderColorTop == null) ? Obj.BorderColor : Obj.BorderColorTop) + ";";
                if (Obj.BorderStyleBottom != null || Obj.BorderWidthBottom != null || Obj.BorderColorBottom != null)
                    Style += "border-bottom:" + ((Obj.BorderWidthBottom == null) ? Obj.BorderWidth : Obj.BorderWidthBottom) + " " + ((Obj.BorderStyleBottom == null) ? this._GetBorderStyle(Obj.BorderStyle) : this._GetBorderStyle(Obj.BorderStyleBottom)) + " " + ((Obj.BorderColorBottom == null) ? Obj.BorderColor : Obj.BorderColorBottom) + ";";
            }
            return Style;
        },
        _GetMeasurements: function (CurrObj, includeHeight) {
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
        _GetStyle: function (RS, CurrObj, TypeCodeObj) {
            var Style = "";

            if (CurrObj == null)
                return Style;

            Style += this._GetNonTextStyle(RS, CurrObj, TypeCodeObj);
            Style += this._GetTextStyle(CurrObj, TypeCodeObj);

            return Style;
        },
        _BackgroundRepeatTypesMap: function () {
            return {
                0: "repeat",    // Repeat
                1: "no-repeat", // Clip
                2: "repeat-x",  // RepeatX
                3: "repeat-y"   // RepeatY
            };
        },
        _GetImageStyleURL: function (RS, ImageName) {
            return "url(" + this._GetImageURL(RS, ImageName) + ")";
        },
        _GetNonTextStyle: function (RS, CurrObj, TypeCodeObj) {
            var Style = "";

            if (CurrObj == null)
                return Style;

            if (CurrObj.BackgroundColor != null)
                Style += "background-color:" + CurrObj.BackgroundColor + ";";
            if (CurrObj.BackgroundImage != null)
                Style += "background-image:" + this._GetImageStyleURL(RS, CurrObj.BackgroundImage.ImageName) + ";";
            if (CurrObj.BackgroundRepeat != null && this._BackgroundRepeatTypesMap()[CurrObj.BackgroundRepeat] != undefined)
                Style += "background-repeat:" + this._BackgroundRepeatTypesMap()[CurrObj.BackgroundRepeat] + ";";
            if (CurrObj.PaddingBottom != null)
                Style += "padding-bottom:" + CurrObj.PaddingBottom + ";";
            if (CurrObj.PaddingLeft != null)
                Style += "padding-left:" + CurrObj.PaddingLeft + ";";
            if (CurrObj.PaddingRight != null)
                Style += "padding-right:" + CurrObj.PaddingRight + ";";
            if (CurrObj.PaddingTop != null)
                Style += "padding-top:" + CurrObj.PaddingTop + ";";
            return Style;
        },
        _GetTextStyle: function (CurrObj, TypeCodeObj) {

            var Style = "";

            if (CurrObj == null)
                return Style;

            if (CurrObj.UnicodeBiDi != null)
                Style += "unicode-bidi:" + this._GetBiDi(CurrObj.UnicodeBiDi) + ";";
            if (CurrObj.VerticalAlign != null)
                Style += "vertical-align:" + this._GetVAligh(CurrObj.VerticalAlign) + ";";
            if (CurrObj.WritingMode != null)
                Style += "layout-flow:" + this._GetLayoutFlow(CurrObj.WritingMode) + ";";
            if (CurrObj.Direction != null)
                Style += "Direction:" + this._GetDirection(CurrObj.Direction) + ";";

            if (CurrObj.TextAlign != null)
                Style += "text-align:" + this._GetTextAlign(CurrObj.TextAlign, TypeCodeObj) + ";";
            if (CurrObj.FontStyle != null)
                Style += "font-style:" + this._GetFontStyle(CurrObj.FontStyle) + ";";
            if (CurrObj.FontWeight != null)
                Style += "font-weight:" + this._GetFontWeight(CurrObj.FontWeight) + ";";
            if (CurrObj.FontFamily != null)
                Style += "font-family:" + CurrObj.FontFamily + ";";
            if (CurrObj.FontSize != null)
                Style += "font-size:" + CurrObj.FontSize + ";";
            if (CurrObj.TextDecoration != null)
                Style += "text-decoration:" + this._GetTextDecoration(CurrObj.TextDecoration) + ";";
            if (CurrObj.Color != null)
                Style += "color:" + CurrObj.Color + ";";
            //   if (CurrObj.Calendar != null)
            //       Style += "calendar:" + GetCalendar(CurrObj.Calendar) + ";";
            //writing-mode:lr-tb;?
            return Style;
        },
        _GetCalendar: function (RPLCode) {
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
        },
        _GetTextDecoration: function (RPLCode) {
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
        },
        _GetFontWeight: function (RPLCode) {
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
        },
        _GetFontStyle: function (RPLCode) {
            switch (RPLCode) {
                case 0:
                    return "Normal";
                    break;
                case 1:
                    return "Italic";
                    break;
            }
            return "Normal";
        },
        _GetTextAlign: function (RPLCode, TypeCodeObj) {
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

        },
        _GetDirection: function (RPLCode) {
            switch (RPLCode) {
                case 0:
                    return "LTR";
                    break;
                case 1:
                    return "RTL";
                    break;

            }
            return "LTR";
        },
        _GetLayoutFlow: function (RPLCode) {
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
        },
        _GetVAligh: function (RPLCode) {
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
        },
        _GetBiDi: function (RPLCode) {
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
        },
        _GetDefaultHTMLTable: function () {
            var $NewObj = $("<Table/>");

            $NewObj.attr("CELLSPACING", 0);
            $NewObj.attr("CELLPADDING", 0);
            return $NewObj;
        },
        _GetBorderStyle: function (RPLStyle) {
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
        },
        _GetMeasurmentsObj: function (CurrObj, Index) {
            var retval = null;

            if (CurrObj.Measurement != null)
                retval = CurrObj.Measurement.Measurements[Index];
            return retval;
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
        _GetListStyle: function (Style, Level) {
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
        _StopDefaultEvent: function(e) {
            //IE
        if (window.ActiveXObject)
            window.event.returnValue = false;
        else {
            e.preventDefault();
            e.stopPropagation();
        }
    },
    });  // $.widget
});