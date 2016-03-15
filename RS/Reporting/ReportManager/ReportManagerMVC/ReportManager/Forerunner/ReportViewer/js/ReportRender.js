// Assign or create the single globally scoped variable
var forerunner = forerunner || {};

// Forerunner SQL Server Reports
forerunner.ssr = forerunner.ssr || {};

$(function () {
    var widgets = forerunner.ssr.constants.widgets;

    //  The ReportIemContext simplifies the signature for all of the functions to pass context around
    function reportItemContext(RS, CurrObj, CurrObjIndex, CurrObjParent, $HTMLParent, Style, CurrLocation, ApplyBackgroundColor) {
        this.RS = RS;
        this.CurrObj = CurrObj;
        this.CurrObjIndex = CurrObjIndex;
        this.CurrObjParent = CurrObjParent;
        this.$HTMLParent = $HTMLParent;
        this.Style = Style;
        this.CurrLocation = CurrLocation;
        this.ApplyBackgroundColor = ApplyBackgroundColor;
    }
    function layout() {
        this.ReportItems = {};
        this.Height = 0;
        this.LowestIndex = null;
    }
    // Temp measurement mimics the server measurement object
    function tempMeasurement(height, width) {
        this.Height = height;
        this.Width = width;
    }
    //  Report Item Location is used my the layout to absolute position objects in a rectangle/section/column
    function reportItemLocation(index) {
        this.TopDelta = 0;
        this.Height = 0;
        this.Left = 0;
        this.Index = index;
        this.IndexAbove = null;
        this.NewHeight = null;
        this.NewTop = null;
    }
    // The Floating header object holds pointers to the tablix and its row and col header objects
    function floatingHeader($tablix, $rowHeader, $colHeader) {
        this.$tablix = $tablix;
        this.$rowHeader = $rowHeader;
        this.$colHeader = $colHeader;
    }

    /**
    * Widget used to render the report
    *
    * @namespace $.forerunner.reportRender
    * @prop {Object} options - The options for reportRender
    * @prop {Object} options.reportViewer - The ReportViewer object that is rendering this report
    * @prop {boolean} options.responsive - Whether the report layout should be based on the device size or the RDL defintion
    * @prop {Number} options.renderTime - Unique id for this report
    * @example
    * $("#reportRenderId").reportRender({ reportViewer: this, responsive: true, renderTime: new Date().getTime() });
    * $("#reportViewerId").reportRender("render", 1);
    */
    $.widget(widgets.getFullname(widgets.reportRender),/** @lends $.forerunner.reportRender */ {
        // Default options
        options: {
            reportViewer: null,
            responsive: false,
            renderTime: null,
        },
        // Constructor
        _create: function () {
            var me = this;
            var isTouch = forerunner.device.isTouch();
            me._defaultResponsizeTablix = forerunner.config.getCustomSettingsValue("DefaultResponsiveTablix", "on").toLowerCase();
            me._maxResponsiveRes = forerunner.config.getCustomSettingsValue("MaxResponsiveResolution", 1280);

            if (me.options.reportViewer)
                me._currentWidth = me.options.reportViewer.element.width();

            // For touch device, update the header only on scrollstop.
            if (isTouch) {
                $(window).on("scrollstop", function () { me._lazyLoadTablix(me); });
            } else {
                $(window).on("scroll", function () { me._lazyLoadTablix(me); });
            }
        },

        /**
         * Renders the report
         *
         * @function $.forerunner.reportRender#render
         *
         * @param {Integer} Page - The page number of the report to render
         * @param {Boolean} delayLayout - Delay the layout or not
         * @param {Object} RDLExt - RDL extension object for this report
         */
        render: function (Page, delayLayout, RDLExt) {
            var me = this;
            me.reportObj = Page.reportObj;
            me.Page = Page;
            me._tablixStream = {};
            me.RDLExt = RDLExt ? RDLExt : {};


            if (me.RDLExt.ForceResponsive !== undefined)
                me.options.responsive = me.RDLExt.ForceResponsive;

            me._currentWidth = me.options.reportViewer.element.width();
            if (me.Page.Replay === undefined)
                me.Page.Replay = {};

            me._createStyles(me.options.reportViewer);
            me._reRender();

            if (delayLayout !== true) {
                me.layoutReport();
            }
        },
        _reRender: function () {
            var me = this;
            var reportDiv = me.element;
            var reportViewer = me.options.reportViewer;
            me._rectangles = [];
            me._currentWidth = me.options.reportViewer.element.width();

            reportDiv.html("");

            $.each(me.reportObj.ReportContainer.Report.PageContent.Sections, function (Index, Obj) {
                me._writeSection(new reportItemContext(reportViewer, Obj, Index, me.reportObj.ReportContainer.Report.PageContent, reportDiv, ""));
            });
            me._addPageStyle(reportViewer, me.reportObj.ReportContainer.Report.PageContent.PageLayoutStart.PageStyle, me.reportObj);

        },
        _addPageStyle: function (reportViewer, pageStyle, reportObj) {
            var me = this;

            var style = me._getStyle(reportViewer, pageStyle);
            var bgLayer = new $("<div class='fr-render-bglayer'></div>");
            bgLayer.attr("style", style);

            if (reportObj.ReportContainer.Trial === 1) {
                me.element.append(me._getWatermark());
            }

            me.element.append(bgLayer);
        },
        _getWatermark: function () {            
            var wstyle = "opacity:0.30;color: #d0d0d0;font-size: 120pt;display: inline-block ;position: fixed; float: left;margin: 0;left:0px;top:40px;  pointer-events: none;";

            var postText = forerunner.config.getCustomSettingsValue("WatermarkPostText", "");

            if (forerunner.device.isMSIE8() || forerunner.device.isAndroid()) {            
                var wtr = $("<DIV/>").html("Evaluation </br></br>" + postText);
                wstyle += "z-index: -1;";
                wtr.attr("style", wstyle);
                return wtr;
            }

            var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            svg.setAttribute("xlink", "http://www.w3.org/1999/xlink");
            svg.setAttribute("width", "100%");
            svg.setAttribute("height", "100%");
            svg.setAttribute("pointer-events", "none");

            wstyle = "opacity:0.10;color: #d0d0d0;font-size: 120pt;display: inline-block ;position: fixed; float: left;margin: 0;left:0px;top:40px; pointer-events: none;";
            if (forerunner.device.isSafariPC())
                wstyle += "z-index: -1;";
            else
                wstyle += "z-index: 1000;";

            //wstyle += "-webkit-transform: rotate(-45deg);-moz-transform: rotate(-45deg);-ms-transform: rotate(-45deg);transform: rotate(-45deg);"
            svg.setAttribute("style", wstyle);


            var text = document.createElementNS("http://www.w3.org/2000/svg", "text");
            text.setAttribute("x", "10");
            text.setAttribute("y", "160");
            text.setAttribute("fill", "#000");
            text.setAttribute("pointer-events", "none");

            var span = document.createElementNS("http://www.w3.org/2000/svg", "tspan");
            span.textContent = "Evaluation";
            text.appendChild(span);
            span = document.createElementNS("http://www.w3.org/2000/svg", "tspan");
            span.setAttribute("x", "10");
            span.setAttribute("y", "280");
            span.textContent = postText;
            text.appendChild(span);

            svg.appendChild(text);

            return svg;
        },
        /**
         * Writes error data to the page
         *
         * @function $.forerunner.reportRender#writeError
         *
         * @param {object} errorData - Error data object.
         */
        writeError: function (errorData) {
            var me = this;
            var errorTag = me.options.reportViewer.locData.getLocData().errorTag;
            var $cell;

            if (errorData.Exception.Type === "LicenseException") {
                //Reason: Expired,MachineMismatch,TimeBombMissing,SetupError
                me.element.html($("<div class='Page' >" +
                    "<div class='fr-render-error-license Page'>" +
                        "<div class='fr-render-error-license-container'>" +
                    "<p class='fr-render-error-license-title'></p><br/>" +
                    "<p class='fr-render-error-license-content'></p>" +                            
                        "</div>" +
                    "</div>"));
                if (me.options.reportViewer) {
                    $cell = me.element.find(".fr-render-error-license-title");
                    $cell.html(errorTag.licenseErrorTitle);
                    $cell = me.element.find(".fr-render-error-license-content");
                    $cell.html(errorTag.licenseErrorContent);
                }

            }
            else {
                me.element.html($("<div class='Page' >" +
               "<div class='fr-render-error-message'></div></br>" +
               "<div class='fr-render-error-details'>" + errorTag.moreDetail + "</div>" +
               "<div class='fr-render-error'><h3>" + errorTag.serverError + "</h3>" +
               "<div class='fr-render-error fr-render-error-DetailMessage'></div>" +
               "<div class='fr-render-error fr-render-error-type'></div>" +
               "<div class='fr-render-error fr-render-error-targetsite'></div>" +
               "<div class='fr-render-error fr-render-error-source'></div>" +
               "<div class='fr-render-error fr-render-error-stacktrace'></div>" +
               "</div></div>"));

                if (me.options.reportViewer) {
                    $cell = me.element.find(".fr-render-error");
                    $cell.hide();

                    $cell = me.element.find(".fr-render-error-details");
                    $cell.on("click", { $Detail: me.element.find(".fr-render-error") }, function (e) { e.data.$Detail.show(); $(e.target).hide(); });

                    $cell = me.element.find(".fr-render-error-DetailMessage");
                    $cell.append("<h4>" + errorTag.message + ":</h4>" + errorData.Exception.DetailMessage);

                    $cell = me.element.find(".fr-render-error-type");
                    $cell.append("<h4>" + errorTag.type + ":</h4>" + errorData.Exception.Type);

                    $cell = me.element.find(".fr-render-error-targetsite");
                    $cell.html("<h4>" + errorTag.targetSite + ":</h4>" + errorData.Exception.TargetSite);

                    $cell = me.element.find(".fr-render-error-source");
                    $cell.html("<h4>" + errorTag.source + ":</h4>" + errorData.Exception.Source);

                    $cell = me.element.find(".fr-render-error-message");
                    $cell.html(errorData.Exception.Message);

                    $cell = me.element.find(".fr-render-error-stacktrace");
                    $cell.html("<h4>" + errorTag.stackTrace + ":</h4>" + errorData.Exception.StackTrace);
                }
            }
        },
        _writeSection: function (RIContext) {
            var me = this;
            var $newObj = me._getDefaultHTMLTable();
            var $sec = $("<TR/>");
            var loc;

            //Need to determine Header and footer Index
            var headerIndex;
            var footerIndex;
            var bodyIndex;

            var sectionMeasurement;
            if (RIContext.CurrObj.Measurement)
                sectionMeasurement = RIContext.CurrObj.Measurement;
            else
                sectionMeasurement = RIContext.CurrObjParent.Measurement;

            for (var i = 0; i < sectionMeasurement.Count; i++) {
                if (sectionMeasurement.Measurements[i].Type === "PageHeader")
                    headerIndex = i;
                if (sectionMeasurement.Measurements[i].Type === "PageFooter")
                    footerIndex = i;
                if (sectionMeasurement.Measurements[i].Type === "BodyArea")
                    bodyIndex = i;
            }

            loc = bodyIndex >= 0 ? sectionMeasurement.Measurements[bodyIndex] : me._getMeasurmentsObj(RIContext.CurrObjParent, RIContext.CurrObjIndex);

            //Page Header
            if (RIContext.CurrObj.PageHeader)
                $newObj.append(me._writeHeaderFooter(RIContext, "PageHeader", headerIndex));
            //Page Header on PageContent
            if (RIContext.CurrObjParent.PageHeader)
                $newObj.append(me._writeHeaderFooter(new reportItemContext(RIContext.RS, RIContext.CurrObjParent, null, null, null, null, null), "PageHeader", headerIndex));

            $sec.attr("Style", "width:" + me._getWidth(loc.Width) + "mm;");

            //Set the responsive width
            me._setResonsiveWidth(me._getWidth(loc.Width), $sec);


            //Columns
            $newObj.append($sec);
            $.each(RIContext.CurrObj.Columns, function (index, obj) {
                var $col = new $("<TD/>");
                $col.append(me._writeRectangle(new reportItemContext(RIContext.RS, obj, index, RIContext.CurrObj, new $("<Div/>"), null, loc)));
                $sec.append($col);
            });

            //Page Footer
            if (RIContext.CurrObj.PageFooter)
                $newObj.append(me._writeHeaderFooter(RIContext, "PageFooter", footerIndex));
            //Page Footer on PageContent
            if (RIContext.CurrObjParent.PageFooter)
                $newObj.append(me._writeHeaderFooter(new reportItemContext(RIContext.RS, RIContext.CurrObjParent, null, null, null, null, null), "PageFooter", footerIndex));

            RIContext.$HTMLParent.append($newObj);
        },
        _writeHeaderFooter: function (RIContext, HeaderOrFooter, Index) {
            var me = this;
            //Page Header
            if (RIContext.CurrObj[HeaderOrFooter]) {
                var $header = $("<TR/>");
                var $headerTD = $("<TD/>");
                $header.append($headerTD);
                var headerLoc = me._getMeasurmentsObj(RIContext.CurrObj, Index);

                $header.attr("Style", "width:" + me._getWidth(headerLoc.Width) + "mm;");

                //Set the responsive width
                me._setResonsiveWidth(me._getWidth(headerLoc.Width), $header);

                $headerTD.append(me._writeRectangle(new reportItemContext(RIContext.RS, RIContext.CurrObj[HeaderOrFooter], Index, RIContext.CurrObj, new $("<DIV/>"), null, headerLoc)));
                return $header;
            }
        },

        _setResonsiveWidth: function (defWidth, element) {
            var me = this;
            return;
            //Set the responsive width
            //if (me.options.responsive && me._maxResponsiveRes > me._currentWidth) {
            //    if (defWidth > me._convertToMM(me._currentWidth + "px"))
            //        element.css("width", me._currentWidth);
            //}
        },

        _writeRectangle: function (RIContext) {
            var $RI;        //This is the ReportItem Object
            var $LocDiv;    //This DIV will have the top and left location set, location is not set anywhere else
            var Measurements;
            //var RecLayout;
            var Style;
            var me = this;
            var ReportItems = {};
            var rec = RIContext.$HTMLParent;

            Measurements = RIContext.CurrObj.Measurement.Measurements;
            var sharedElements = me._getSharedElements(RIContext.CurrObj.Elements.SharedElements);
            var RecExt = me._getRDLExt(RIContext);

            if (RecExt.FormAction) {
                rec = $("<form />");
                rec.attr("action", RecExt.FormAction);
                if (RecExt.FormName) rec.attr("name", RecExt.FormName);
                if (RecExt.FormMethod) rec.attr("method", RecExt.FormMethod);
                RIContext.$HTMLParent = rec;
            }
            if (RecExt.IFrameSrc) {
                rec = $("<iframe />");
                rec.attr("src", RecExt.IFrameSrc);
                //if (RecExt.IFrameSeamless === false) {
                //    rec.attr("seamless", "seamless");
                //}
                if (RecExt.IFrameSeamless === true)
                    rec.addClass("fr-iframe-seamless");

                RIContext.$HTMLParent = rec;
            }
            else if (RecExt.CustomHTML) {
                rec = $("<div />");
                rec.html(RecExt.CustomHTML);
                RIContext.$HTMLParent = rec;
            }


            else {

                $.each(RIContext.CurrObj.ReportItems, function (Index, Obj) {

                    Style = "";
                    if (Obj.Type !== "Line") {
                        //Style = "display:table;border-collapse:collapse;";
                        if (Obj.Elements)
                            Style += me._getFullBorderStyle(Obj.Elements.NonSharedElements.Style);
                    }

                    $RI = me._writeReportItems(new reportItemContext(RIContext.RS, Obj, Index, RIContext.CurrObj, new $("<Div/>"), Style, Measurements[Index]));
                    if (Obj.Type !== "Line" && Obj.Type !== "Tablix") {
                        $RI.addClass("fr-render-rec");
                        $RI.addClass(me._getClassName("fr-b-", Obj));
                    }

                    $LocDiv = new $("<Div/>");
                    $LocDiv.append($RI);
                    Style = "";

                    //RecLayout.ReportItems[Index].NewHeight = Measurements[Index].Height;
                    ReportItems[Index] = {};
                    ReportItems[Index].HTMLElement = $LocDiv;
                    ReportItems[Index].Type = Obj.Type;

                    if (Obj.Type === "Tablix" && me._tablixStream[Obj.Elements.NonSharedElements.UniqueName].BigTablix === true) {
                        ReportItems[Index].BigTablix = true;
                    }

                    //if (RecLayout.ReportItems[Index].IndexAbove === null)
                    //    RecLayout.ReportItems[Index].NewTop = Measurements[Index].Top;

                    Style += "position:absolute;";

                    //if (Measurements[Index].zIndex)
                    //    Style += "z-index:" + Measurements[Index].zIndex + ";";

                    //Background color goes on container
                    if (RIContext.CurrObj.ReportItems[Index].Element && RIContext.CurrObj.ReportItems[Index].Elements.NonSharedElements.Style && RIContext.CurrObj.ReportItems[Index].Elements.NonSharedElements.Style.BackgroundColor)
                        Style += "background-color:" + RIContext.CurrObj.ReportItems[Index].Elements.NonSharedElements.Style.BackgroundColor + ";";

                    $LocDiv.attr("Style", Style);
                    $LocDiv.append($RI);
                    rec.append($LocDiv);
                });
            }

            Style = "position:relative;";
            //This fixed an IE bug dublicate styles
            if (RIContext.CurrObjParent.Type !== "Tablix") {
                Style += me._getElementsStyle(RIContext.RS, RIContext.CurrObj.Elements);
                rec.addClass(me._getClassName("fr-n-", RIContext.CurrObj));
                rec.addClass(me._getClassName("fr-t-", RIContext.CurrObj));
                rec.addClass(me._getClassName("fr-b-", RIContext.CurrObj));
                Style += me._getFullBorderStyle(RIContext.CurrObj.Elements.NonSharedElements.Style);
            }

            if (RecExt.FixedHeight)
                Style += "overflow-y: scroll;height:" + me._convertToMM(RecExt.FixedHeight) + "mm;";
            if (RecExt.FixedWidth)
                Style += "overflow-x: scroll;width:" + me._convertToMM(RecExt.FixedWidth) + "mm;";

            me._AddExtIDs(RecExt, rec);
            me._writeActions(RIContext, {}, rec);

            rec.attr("Style", Style);

            if (RIContext.CurrObj.Elements.NonSharedElements.UniqueName)
                me._writeUniqueName(rec, RIContext.CurrObj.Elements.NonSharedElements.UniqueName);
            me._writeBookMark(RIContext);
            me._writeTooltip(RIContext);

            //Add Rec to Rec collection to layout later
            me._rectangles.push({ ReportItems: ReportItems, Measurements: Measurements, HTMLRec: rec, RIContext: RIContext, RecExt: RecExt });

            return rec;
        },

        /**
        * Layout all the elements on the report surface
        *
        * @function $.forerunner.reportRender#layoutReport
        *
        * @param {Boolean} isLoaded - Has the report been loaded in the DOM
        * @param {Boolean} force - force a re-layout
        * @param {Object} RDLExt - RDL extension object for this report
        */
        layoutReport: function (isLoaded, force, RDLExt) {
            var me = this;
            var renderWidth = me.options.reportViewer.element.width();
            if (RDLExt)
                me.RDLExt = RDLExt;
            if (renderWidth === 0)
                return true;

            //Need to re-render
            if ((Math.abs(me._currentWidth - renderWidth) > 30 || force) && me.options.responsive && me._defaultResponsizeTablix === "on") {
                me._currentWidth = renderWidth;
                me._reRender();
            }

            //This is an error page
            if (!me._rectangles)
                return;

            for (var r = 0; r < me._rectangles.length; r++) {
                var rec = me._rectangles[r];
                var RecLayout = me._getRectangleLayout(rec.Measurements);
                var Measurements = rec.Measurements;
                var RIContext = rec.RIContext;

                for (var Index = 0; Index < forerunner.helper.objectSize(RecLayout.ReportItems) ; Index++) {

                    //Determin height and location
                    if (rec.ReportItems[Index].Type === "Image" || rec.ReportItems[Index].Type === "Chart" || rec.ReportItems[Index].Type === "Gauge" || RecLayout.ReportItems[Index].Type === "Map" || rec.ReportItems[Index].Type === "Line")
                        RecLayout.ReportItems[Index].NewHeight = rec.Measurements[Index].Height;
                    else {
                        if (isLoaded)
                            RecLayout.ReportItems[Index].NewHeight = me._convertToMM(rec.ReportItems[Index].HTMLElement.outerHeight() + "px");
                        else if (rec.ReportItems[Index].BigTablix)
                            RecLayout.ReportItems[Index].NewHeight = rec.Measurements[Index].Height;
                        else
                            RecLayout.ReportItems[Index].NewHeight = me._getHeight(rec.ReportItems[Index].HTMLElement);
                    }

                    // If I grew I may be the new bottom
                    if (RecLayout.ReportItems[Index].NewHeight > RecLayout.ReportItems[RecLayout.LowestIndex].NewHeight && RecLayout.ReportItems[Index].IndexAbove === RecLayout.ReportItems[RecLayout.LowestIndex].IndexAbove) {
                        RecLayout.LowestIndex = Index;
                    }

                    if (RecLayout.ReportItems[Index].IndexAbove === null)
                        RecLayout.ReportItems[Index].NewTop = Measurements[Index].Top;
                    else
                        RecLayout.ReportItems[Index].NewTop = parseFloat(RecLayout.ReportItems[RecLayout.ReportItems[Index].IndexAbove].NewTop) + parseFloat(RecLayout.ReportItems[RecLayout.ReportItems[Index].IndexAbove].NewHeight) + parseFloat(RecLayout.ReportItems[Index].TopDelta);

                    rec.ReportItems[Index].HTMLElement.css("top", me._roundToTwo(RecLayout.ReportItems[Index].NewTop) + "mm");
                    rec.ReportItems[Index].HTMLElement.css("left", me._roundToTwo(RecLayout.ReportItems[Index].Left) + "mm");
                }

                if (rec.RecExt.FixedHeight || rec.RecExt.FixedWidth) {
                    rec.HTMLRec.removeClass("fr-render-rec");
                }
                if (RIContext.CurrLocation) {
                    if (rec.RecExt.FixedWidth === undefined)
                        rec.HTMLRec.css("width", me._getWidth(RIContext.CurrLocation.Width) + "mm");

                    //Set the responsive width
                    me._setResonsiveWidth(me._getWidth(RIContext.CurrLocation.Width), rec.HTMLRec);


                    if (RIContext.CurrObj.ReportItems.length === 0)
                        rec.HTMLRec.css("height", me._roundToTwo((RIContext.CurrLocation.Height + 1)) + "mm");
                    else {

                        var parentHeight = parseFloat(RecLayout.ReportItems[RecLayout.LowestIndex].NewTop) +
                                            parseFloat(RecLayout.ReportItems[RecLayout.LowestIndex].NewHeight) +
                                            (parseFloat(RIContext.CurrLocation.Height) -
                                                (parseFloat(Measurements[RecLayout.LowestIndex].Top) +
                                                parseFloat(Measurements[RecLayout.LowestIndex].Height))) +
                                            0; //changed from 1  may need to change back
                        if (rec.RecExt.FixedHeight === undefined) {
                            rec.HTMLRec.css("height", me._roundToTwo(parentHeight) + "mm");
                        }
                    }

                }
            }
            me.element.hide().show(0);
            return false;
        },
        _getRectangleLayout: function (Measurements) {
            var l = new layout();
            var me = this;

            $.each(Measurements, function (Index, Obj) {
                l.ReportItems[Index] = new reportItemLocation(Index);
                var curRI = l.ReportItems[Index];
                curRI.Left = Obj.Left;

                if (me._isNull(l.LowestIndex))
                    l.LowestIndex = Index;
                else if (Obj.Top + Obj.Height > Measurements[l.LowestIndex].Top + Measurements[l.LowestIndex].Height)
                    l.LowestIndex = Index;

                for (var i = 0; i < Measurements.length; i++) {
                    var bottom = Measurements[i].Top + Measurements[i].Height;
                    if (Obj.Top > bottom) {
                        if (!curRI.IndexAbove) {
                            curRI.IndexAbove = i;
                            curRI.TopDelta = Obj.Top - bottom;
                        }
                        else if (bottom > Measurements[curRI.IndexAbove].Top + Measurements[curRI.IndexAbove].Height) {
                            curRI.IndexAbove = i;
                            curRI.TopDelta = Obj.Top - bottom;
                        }
                    }
                }

            });

            if (me.options.responsive && me._maxResponsiveRes > me._currentWidth)
                return me._getResponsiveRectangleLayout(Measurements, l);
            return l;
        },
        _getResponsiveRectangleLayout: function (Measurements, layout) {
            var me = this;

            var viewerWidth = me._convertToMM(me._currentWidth + "px");
            var anyMove = false;

            $.each(Measurements, function (Index, Obj) {
                var curRI = layout.ReportItems[Index];
                curRI.OrgBottom = Obj.Top + Obj.Height;
                curRI.OrgRight = Obj.Left + Obj.Width;
                curRI.OrgIndexAbove = curRI.IndexAbove;
                var bottompMove = false;

                var topMove = false;

                if (curRI.OrgRight > viewerWidth) {
                    curRI.Left = 0;

                    //Measurements.length
                    for (var i = 0; i < Measurements.length; i++) {
                        var bottom = Measurements[i].Top + Measurements[i].Height;
                        var right = Measurements[i].Left + Measurements[i].Width;

                        //Above
                        //&& (layout.ReportItems[i].Left < Obj.Width)
                        if (!topMove && (Index !== i) && (Obj.Top < Measurements[i].Top) && (curRI.OrgBottom > Measurements[i].Top)) {
                            layout.ReportItems[i].IndexAbove = Index;
                            layout.ReportItems[i].TopDelta = 1;
                            if (Index === layout.LowestIndex)
                                layout.LowestIndex = layout.ReportItems[i].Index;
                            anyMove = true;
                            topMove = true;
                        }
                        //Below
                        //&& (layout.ReportItems[i].Left < Obj.Width)
                        if ((Index !== i) && (Obj.Top >= Measurements[i].Top) && (Obj.Top < bottom) && Index > i) {
                            //Not below if there is another one lower
                            if (curRI.IndexAbove === null || layout.ReportItems[curRI.IndexAbove].OrgBottom <= layout.ReportItems[i].OrgBottom) { //chnaged to <=  to fix rec height issue, need to test more
                                curRI.IndexAbove = i;
                                curRI.TopDelta = 1;
                                if (i === layout.LowestIndex)
                                    layout.LowestIndex = Index;
                                bottompMove = true;
                                anyMove = true;
                            }
                        }


                    }
                }

                if (anyMove || (Index === Measurements.length - 1)) {
                    for (var j = 0; j < curRI.Index ; j++) {
                        // if I have the same index above and I did not move but you did more then I have to move down
                        if (curRI.IndexAbove === layout.ReportItems[j].IndexAbove && curRI.OrgRight <= viewerWidth && layout.ReportItems[j].OrgRight > viewerWidth) {
                            curRI.IndexAbove = j;

                            //Fix Lowest Index
                            if (layout.LowestIndex === j)
                                layout.LowestIndex = curRI.Index;
                        }
                        // if you moved or I moved
                        if (layout.ReportItems[j].OrgRight > viewerWidth || curRI.OrgRight > viewerWidth) {
                            //if my index above is the same as yours then move me down
                            if (curRI.IndexAbove === layout.ReportItems[j].IndexAbove) {
                                curRI.IndexAbove = layout.ReportItems[j].Index;
                                curRI.TopDelta = 1;

                                //Fix Lowest Index
                                if (layout.LowestIndex === layout.ReportItems[j].Index)
                                    layout.LowestIndex = curRI.Index;
                            }
                                // else if your origional index above is my new index above then you move down
                            else if (layout.ReportItems[j].OrgIndexAbove === curRI.IndexAbove && j > curRI.Index) {
                                layout.ReportItems[j].IndexAbove = curRI.Index;
                                layout.ReportItems[j].TopDelta = 1;

                                //Fix Lowest Index
                                if (layout.LowestIndex === curRI.Index)
                                    layout.LowestIndex = layout.ReportItems[j].Index;
                            }
                        }
                        // If we now overlap move me down
                        if (curRI.IndexAbove === layout.ReportItems[j].IndexAbove && curRI.Left >= Measurements[j].Left && curRI.Left < layout.ReportItems[j].Left + Measurements[j].Width) {
                            curRI.IndexAbove = layout.ReportItems[j].Index;
                            curRI.TopDelta = 1;

                            //Fix Lowest Index
                            if (layout.LowestIndex === layout.ReportItems[j].Index)
                                layout.LowestIndex = curRI.Index;

                        }
                    }
                }


            });

            return layout;
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

        _getRDLExt: function (RIContext) {
            var me = this;

            var rdlExt = {};
            if (me.RDLExt) {
                rdlExt = me.RDLExt[me._getSharedElements(RIContext.CurrObj.Elements.SharedElements).Name];
                if (!rdlExt)
                    rdlExt = {};
            }
            return rdlExt;

        },
        _getRDLExtShared: function () {
            var me = this;

            var rdlExt = {};
            if (me.RDLExt) {
                rdlExt = me.RDLExt.SharedActions;
                if (!rdlExt)
                    rdlExt = {};
            }
            return rdlExt;

        },
        _writeEasySubmit: function (control, Ext) {
            var me = this;

            //Handle EasySubmit
            if (Ext.EasySubmitURL && Ext.EasySubmitType) {
                control.on("click", { reportViewer: me.options.reportViewer.element, element: control, getInputs: me._getInputsInRow, easySubmit: me._submitRow, veryEasySubmit: me._easySubmit, deleteCurrentRow: me._delCurrentRow, insertNewRow: me._insNewRow }, function (e) {
                    e.data.veryEasySubmit(e, Ext.EasySubmitType, Ext.EasySubmitURL, Ext.EasySubmitDatatype, Ext.EasySubmitSuccess, Ext.EasySubmitFail,Ext.EasySubmitReportPath);
                });
                control.addClass("fr-core-cursorpointer");
            }
        },
        
        _writeRichText: function (RIContext) {
            var Style = RIContext.Style;
            var $TextObj = $("<div/>");
            var $Sort = null;
            var me = this;

            //See if RDLExt
            var textExt = me._getRDLExt(RIContext);

            Style += "";

            if (me._getMeasurements(me._getMeasurmentsObj(RIContext.CurrObjParent, RIContext.CurrObjIndex), true) !== "")
                Style += me._getMeasurements(me._getMeasurmentsObj(RIContext.CurrObjParent, RIContext.CurrObjIndex), true);

            //This fixed an IE bug for duplicate syyles
            if (RIContext.CurrObjParent.Type !== "Tablix" || RIContext.ApplyBackgroundColor) {
                Style += me._getElementsNonTextStyle(RIContext.RS, RIContext.CurrObj.Elements);
                RIContext.$HTMLParent.addClass(me._getClassName("fr-n-", RIContext.CurrObj));
            }

            RIContext.$HTMLParent.attr("Style", Style);
            RIContext.$HTMLParent.addClass("fr-r-rT");


            Style = "";
            //Special case for RDL extension inputType
            if (textExt.InputType) {
                if (textExt.InputType === "textarea") {
                    $TextObj = $("<textarea name='" + textExt.InputName + "'/>");
                    Style += "resize:none;";
                }
                else
                    $TextObj = $("<input type='" + textExt.InputType + "' name='" + textExt.InputName + "'/>");
                Style += "height:auto;box-sizing:border-box;";
                if (textExt.InputRequired === true)
                    $TextObj.attr("required", true);
                if (textExt.InputSubmit)
                    $TextObj.attr("data-submitType", textExt.InputSubmit);
                $TextObj.addClass("fr-input-" + textExt.InputType);

            }

            // Handel Easy Submit
            me._writeEasySubmit($TextObj, textExt);

            // RDL Extension
            if (textExt.Align === "justify") {
                Style += "white-space:normal;text-align:" + textExt.Align + ";";
            }

            if (me._getSharedElements(RIContext.CurrObj.Elements.SharedElements).IsToggleParent === true || RIContext.CurrObj.Elements.NonSharedElements.IsToggleParent === true) {
                var $Drilldown = $("<div/>");
                $Drilldown.attr("id", RIContext.CurrObj.Elements.NonSharedElements.UniqueName);
                $Drilldown.html("&nbsp");

                if (RIContext.CurrObj.Elements.NonSharedElements.ToggleState !== undefined && RIContext.CurrObj.Elements.NonSharedElements.ToggleState === true)
                    $Drilldown.addClass("fr-render-drilldown-collapse");
                else
                    $Drilldown.addClass("fr-render-drilldown-expand");

                $Drilldown.on("click", { ToggleID: RIContext.CurrObj.Elements.NonSharedElements.UniqueName }, function (e) {
                    var name = $(this).parent().parent().attr("data-uniqName");
                    me.options.reportViewer.toggleItem(e.data.ToggleID, name);
                });
                $Drilldown.addClass("fr-core-cursorpointer");
                RIContext.$HTMLParent.append($Drilldown);
            }
            if (me._getSharedElements(RIContext.CurrObj.Elements.SharedElements).CanSort !== undefined) {
                $Sort = $("<div/>");
                $Sort.html("&nbsp");
                var Direction = "None";
                var sortDirection = forerunner.ssr.constants.sortDirection;

                if (RIContext.CurrObj.Elements.NonSharedElements.SortState === 2) {
                    $Sort.attr("class", "fr-render-sort-descending");
                    Direction = sortDirection.desc;
                }
                else if (RIContext.CurrObj.Elements.NonSharedElements.SortState === 1) {
                    $Sort.attr("class", "fr-render-sort-ascending");
                    Direction = sortDirection.asc;
                }
                else
                    $Sort.attr("class", "fr-render-sort-unsorted");

                $Sort.on("click", { Viewer: RIContext.RS, SortID: RIContext.CurrObj.Elements.NonSharedElements.UniqueName, Direction: Direction },
                    function (e) {
                        e.data.Viewer.sort(e.data.Direction, e.data.SortID, !(e.shiftKey));
                    });

                //subtract out the sort image cell
                Style += "width:" + (me._getWidth(RIContext.CurrLocation.Width) - 6) + "mm;";
                RIContext.$HTMLParent.append($Sort);
            }
            me._writeActions(RIContext, RIContext.CurrObj.Elements.NonSharedElements, $TextObj);
            if (RIContext.CurrObj.Elements.NonSharedElements.UniqueName)
                me._writeUniqueName($TextObj, RIContext.CurrObj.Elements.NonSharedElements.UniqueName);



            var dirClass = me._getTextDirection(RIContext.CurrObj.Elements);
            if (dirClass !== "") {
                Style += "width:" + RIContext.CurrLocation.Height + "mm;height:" + me._getWidth(RIContext.CurrLocation.Width) + "mm;";
                Style += "position:absolute;";

                if (!forerunner.device.isMSIE8()) {

                    var nTop = -(me._getWidth(RIContext.CurrLocation.Width) - RIContext.CurrLocation.Height) / 2;
                    var nLeft = -(RIContext.CurrLocation.Height - me._getWidth(RIContext.CurrLocation.Width)) / 2;
                    Style += "left:" + nLeft + "mm;top:" + nTop + "mm;";
                }
                $TextObj.addClass(dirClass);
            }
            else {
                //Needs to be 100% to handle center align                
                $TextObj.addClass("fr-r-fS");
            }

            //

            var val = null;
            if (RIContext.CurrObj.Paragraphs.length === 0) {
                val = me._getSharedElements(RIContext.CurrObj.Elements.SharedElements).Value ? me._getSharedElements(RIContext.CurrObj.Elements.SharedElements).Value : RIContext.CurrObj.Elements.NonSharedElements.Value;
                
                if (textExt && textExt.localize)
                    val = forerunner.localize.getLocalizedValue(val, textExt.localize);

                if (val) {
                    val = me._getNewLineFormatText(val);
                    

                    if (textExt.InputType) {
                        $TextObj.attr("data-origVal", val);
                        $TextObj.val(val);
                    }
                    else
                        $TextObj.text(val);

                    if (textExt.InputReadOnly === true)
                        $TextObj.attr("readonly", "readonly");

                    Style += me._getElementsTextStyle(RIContext.CurrObj.Elements);
                    if (RIContext.CurrObj.Elements.NonSharedElements.TypeCode && (me._getSharedElements(RIContext.CurrObj.Elements.SharedElements).TextAlign === 0 || me._getSharedElements(RIContext.CurrObj.Elements.SharedElements).Style.TextAlign === 0)) {
                        Style += "text-align:" + me._getTextAlign(0, RIContext.CurrObj.Elements.NonSharedElements) + ";";
                    }
                }
                else {
                    $TextObj.html("&nbsp");
                    Style += "text-decoration:none;";
                }
                $TextObj.addClass(me._getClassName("fr-t-", RIContext.CurrObj));
            }
            else {
                //Handle each paragraphs
                var LowIndex = null;
                var ParentName = {};
                var ParagraphContainer = {};
                ParagraphContainer.Root = "";
                Style += me._getElementsTextStyle(RIContext.CurrObj.Elements);
                //Build paragraph tree

                $.each(RIContext.CurrObj.Paragraphs, function (Index, Obj) {

                    var listLevel = me._getSharedElements(Obj.Paragraph.SharedElements).ListLevel;
                    if (LowIndex === null)
                        LowIndex = listLevel;
                    if (!ParagraphContainer[listLevel])
                        ParagraphContainer[listLevel] = [];
                    ParentName[listLevel] = Obj.Paragraph.NonSharedElements.UniqueName;

                    var item;
                    if (!ParentName[listLevel - 1])
                        item = "Root";
                    else
                        item = ParentName[listLevel - 1];
                    item = { Parent: item, Value: Obj };
                    ParagraphContainer[listLevel].push(item);
                });

                me._writeRichTextItem(RIContext, ParagraphContainer, LowIndex, "Root", $TextObj);
            }
            me._writeBookMark(RIContext);
            me._writeTooltip(RIContext);
            $TextObj.attr("Style", Style);
            $TextObj.addClass(me._getClassName("fr-t-", RIContext.CurrObj));
            $TextObj.addClass("fr-r-t");

            //Add extension ID and Class
            me._AddExtIDs(textExt, $TextObj);

            RIContext.$HTMLParent.append($TextObj);
            if ($Sort) RIContext.$HTMLParent.append($Sort);
            return RIContext.$HTMLParent;
        },
        _writeRichTextItem: function (RIContext, Paragraphs, Index, ParentName, ParentContainer) {
            var $ParagraphList = null;
            var me = this;

            $.each(Paragraphs[Index], function (SubIndex, Obj) {
                if (Obj.Parent === ParentName) {
                    var $ParagraphItem;
                    var ParagraphStyle = "font-size:small;"; //needed for paragraph spacing 
                    Obj = Obj.Value;

                    if (me._getSharedElements(Obj.Paragraph.SharedElements).ListStyle === 1) {
                        if (!$ParagraphList || !$ParagraphList.is("ol"))
                            $ParagraphList = new $("<OL />");
                        $ParagraphList.addClass(me._getListStyle(1, me._getSharedElements(Obj.Paragraph.SharedElements).ListLevel));
                        $ParagraphItem = new $("<LI />");
                    }
                    else if (me._getSharedElements(Obj.Paragraph.SharedElements).ListStyle === 2) {
                        if (!$ParagraphList || !$ParagraphList.is("ul"))
                            $ParagraphList = new $("<UL />");
                        $ParagraphList.addClass(me._getListStyle(2, me._getSharedElements(Obj.Paragraph.SharedElements).ListLevel));
                        $ParagraphItem = new $("<LI />");
                    }
                    else {
                        if (!$ParagraphList || !$ParagraphList.is("div"))
                            $ParagraphList = new $("<DIV />");
                        $ParagraphItem = new $("<DIV />");
                    }


                    ParagraphStyle += me._getMeasurements(me._getMeasurmentsObj(Obj, Index));
                    ParagraphStyle += me._getElementsStyle(RIContext.RS, Obj.Paragraph);

                    //See if RDLExt
                    var textExt = me._getRDLExt(RIContext);
                    if (textExt.Align === "justify") {
                        ParagraphStyle += "white-space:normal;text-align:" + textExt.Align + ";";
                    }

                    $ParagraphItem.attr("Style", ParagraphStyle);
                    $ParagraphItem.addClass(me._getClassName("fr-n-", Obj.Paragraph));
                    $ParagraphItem.addClass(me._getClassName("fr-t-", Obj.Paragraph));

                    me._writeUniqueName($ParagraphItem, Obj.Paragraph.NonSharedElements.UniqueName);
                    //$ParagraphItem.attr("data-uniqName", Obj.Paragraph.NonSharedElements.UniqueName);

                    //Handle each TextRun
                    for (var i = 0; i < Obj.TextRunCount; i++) {
                        var $TextRun;
                        var flag = true;
                        //With or without Action in TextRun
                        if (!Obj.TextRuns[i].Elements.NonSharedElements.ActionInfo) {
                            $TextRun = new $("<SPAN />");
                        }
                        else {
                            $TextRun = new $("<A />");
                            me._writeActions(RIContext, Obj.TextRuns[i].Elements.NonSharedElements, $TextRun);
                        }

                        if (me._getSharedElements(Obj.TextRuns[i].Elements.SharedElements).Value && me._getSharedElements(Obj.TextRuns[i].Elements.SharedElements).Value !== "") {
                            $TextRun.text(me._getNewLineFormatText(me._getSharedElements(Obj.TextRuns[i].Elements.SharedElements).Value));
                        }
                        else if (Obj.TextRuns[i].Elements.NonSharedElements.Value && Obj.TextRuns[i].Elements.NonSharedElements.Value !== "") {
                            $TextRun.text(me._getNewLineFormatText(Obj.TextRuns[i].Elements.NonSharedElements.Value));
                        }
                        else {
                            $TextRun.html("&nbsp");
                            flag = false;
                        }

                        me._writeUniqueName($TextRun, Obj.TextRuns[i].Elements.NonSharedElements.UniqueName);
                        //$TextRun.attr("data-uniqName", Obj.TextRuns[i].Elements.NonSharedElements.UniqueName);

                        if (flag) {
                            var TextRunStyle = "";
                            TextRunStyle += me._getMeasurements(me._getMeasurmentsObj(Obj.TextRuns[i], i));
                            TextRunStyle += me._getElementsTextStyle(Obj.TextRuns[i].Elements);

                            //See if RDLExt
                            if (textExt.Align === "justify") {
                                TextRunStyle += "white-space:normal;text-align:" + textExt.Align + ";";
                            }

                            $TextRun.attr("Style", TextRunStyle);
                            $TextRun.addClass(me._getClassName("fr-t-", Obj.TextRuns[i]));

                        }

                        $ParagraphItem.append($TextRun);
                    }

                    if (Paragraphs[Index + 1])
                        me._writeRichTextItem(RIContext, Paragraphs, Index + 1, Obj.Paragraph.NonSharedElements.UniqueName, $ParagraphItem);

                    //$ParagraphList.attr("style", "width:100%;height:100%;");
                    $ParagraphList.addClass("fr-r-pL");
                    $ParagraphList.append($ParagraphItem);
                    ParentContainer.append($ParagraphList);
                }
            });
        },
        _writeUniqueName: function ($item, uniqueName) {

            $item.attr("data-uniqName", uniqueName);

        },
        _getImageURL: function (RS, ImageName) {
            var me = this;
            if (!me.imageList)
                me.imageList = {};

            if (!me.imageList[ImageName]) {
                var Url = me.options.reportViewer.options.reportViewerAPI + "/Image/?";
                Url += "SessionID=" + me.options.reportViewer.sessionID;
                Url += "&ImageID=" + ImageName;
                Url += "&" + me.options.renderTime;
                if (me.options.reportViewer.options.rsInstance)
                    Url += "&instance=" + me.options.reportViewer.options.rsInstance;
                me.imageList[ImageName] = Url;
            }

            return me.imageList[ImageName];
        },
        _writeImage: function (RIContext) {
            var NewImage = $("<img/>"); //new Image();
            var me = this;
            var imageContainer = $("<div/>").addClass("fr-render-image");

            var measurement = me._getMeasurmentsObj(RIContext.CurrObjParent, RIContext.CurrObjIndex);
            var Style = RIContext.Style;
            //See if RDLExt
            var Ext = me._getRDLExt(RIContext);

            //Get padding
            Style += me._getTextStyle(RIContext.CurrObj.Elements);
            imageContainer.addClass(me._getClassName("fr-t-", RIContext.CurrObj));

            //This fixed an IE bug dublicate styles
            if (RIContext.CurrObjParent.Type !== "Tablix") {
                Style += me._getElementsStyle(RIContext.RS, RIContext.CurrObj.Elements);
                imageContainer.addClass(me._getClassName("fr-n-", RIContext.CurrObj));
            }

            Style += me._getMeasurements(measurement, true);


            var ImageName;
            var imageStyle = "";
            var imageConsolidationOffset;

            var sizingType = me._getSharedElements(RIContext.CurrObj.Elements.SharedElements).Sizing;

            if (!sizingType)
                sizingType = 0;

            //get the padding size
            var padWidth = me._getPaddingSize(RIContext.CurrObj, "Left") + me._getPaddingSize(RIContext.CurrObj, "Right");
            var padHeight = me._getPaddingSize(RIContext.CurrObj, "Top") + me._getPaddingSize(RIContext.CurrObj, "Bottom");

            if (RIContext.CurrObj.Type === "Image") {//for image
                ImageName = RIContext.CurrObj.Elements.NonSharedElements.ImageDataProperties.ImageName;
                if (RIContext.CurrObj.Elements.NonSharedElements.ImageDataProperties.NonSharedImageDataProperties)
                    imageConsolidationOffset = RIContext.CurrObj.Elements.NonSharedElements.ImageDataProperties.NonSharedImageDataProperties.ImageConsolidationOffsets;
            }
            else {//for chart, map, gauge
                ImageName = RIContext.CurrObj.Elements.NonSharedElements.StreamName;
                if (RIContext.CurrObj.Elements.NonSharedElements.ImageConsolidationOffsets) {
                    imageConsolidationOffset = RIContext.CurrObj.Elements.NonSharedElements.ImageConsolidationOffsets;
                    Style += "width:" + imageConsolidationOffset.Width + "px;height:" + imageConsolidationOffset.Height + "px";
                }
            }

            if (imageConsolidationOffset) {
                imageStyle += "position:relative;top:" + imageConsolidationOffset.Top * -1 + "px;left:" + imageConsolidationOffset.Left * -1 + "px";
            }

            if (RIContext.CurrObj.Elements.NonSharedElements.ActionImageMapAreas) {
                NewImage.attr("useMap", "#Map_" + RIContext.RS.sessionID + "_" + RIContext.CurrObj.Elements.NonSharedElements.UniqueName);
            }


            //NewImage.alt = me.options.reportViewer.locData.getLocData().messages.imageNotDisplay;            
            //NewImage.src = this._getImageURL(RIContext.RS, ImageName);

            NewImage.attr("alt", me.options.reportViewer.locData.getLocData().messages.imageNotDisplay);
            NewImage.attr("src", this._getImageURL(RIContext.RS, ImageName));

            me._writeActions(RIContext, RIContext.CurrObj.Elements.NonSharedElements, $(NewImage));

            // Handel Easy Submit
            me._writeEasySubmit($(NewImage), Ext);

            me._writeBookMark(RIContext);
            me._writeTooltip(RIContext);

            if (RIContext.CurrObj.Elements.NonSharedElements.UniqueName)
                me._writeUniqueName($(NewImage), RIContext.CurrObj.Elements.NonSharedElements.UniqueName);

            var imageWidth, imageHeight;

            if (imageConsolidationOffset) {
                imageWidth = imageConsolidationOffset.Width;
                imageHeight = imageConsolidationOffset.Height;
            }
            else {
                imageWidth = RIContext.CurrLocation.Width * 3.78;
                imageHeight = RIContext.CurrLocation.Height * 3.78;
            }

            imageContainer.append(NewImage);
            imageContainer.attr("style", Style);
            RIContext.$HTMLParent.append(imageContainer);

            me._writeActionImageMapAreas(RIContext, imageWidth, imageHeight, imageConsolidationOffset);
            NewImage.attr("style", imageStyle);//remove display:table-cell; from image style

            //Add Highlighting  except IE8
            if (forerunner.config.getCustomSettingsValue("ImageAreaHighligh", "off") === "on" && !forerunner.device.isMSIE8()) {
                var strokeColor = forerunner.config.getCustomSettingsValue("ImageAreaHighlighBorderColor", "ff0000");
                var strokeWidth = forerunner.config.getCustomSettingsValue("ImageAreaHighlighBorderWidth", "1");

                //On chrome need to give time on cached image
                window.setTimeout(function () {
                    $(imageContainer).FRmaphilight({ strokeColor: strokeColor, strokeWidth: strokeWidth });
                }, 200);
            }

            //Remove the blue border on ie 8,9,10
            NewImage.css("border", "0").css("text-decoration", "none");
            switch (sizingType) {
                case 0://AutoSize
                    break;
                case 1://Fit
                    $(NewImage).css("height", RIContext.CurrLocation.Height - padHeight + "mm");
                    $(NewImage).css("width", RIContext.CurrLocation.Width - padWidth + "mm");
                    break;
                case 2:
                case 3:
                    $(NewImage).css("height", RIContext.CurrLocation.Height + "mm");
                    $(NewImage).css("width", RIContext.CurrLocation.Width + "mm");
                    NewImage.on("load", function () {
                        var naturalSize = me._getNatural(this);
                        var imageWidth, imageHeight;

                        //Neeed to have this here for IE8
                        if (imageConsolidationOffset) {
                            imageWidth = imageConsolidationOffset.Width;
                            imageHeight = imageConsolidationOffset.Height;
                        }
                        else {
                            imageWidth = NewImage.width;
                            imageHeight = NewImage.height;
                        }

                        me._resizeImage(this, sizingType, naturalSize.height, naturalSize.width, RIContext.CurrLocation.Height - padHeight, RIContext.CurrLocation.Width - padWidth);
                    });
            }

            //Add Ext ID and class
            me._AddExtIDs(Ext, NewImage);

            return RIContext.$HTMLParent;
        },

        _delCurrentRow: function (element) {
            var me = this;

            var row = $(element).parent().parent().parent();

            //Handle image in talix
            if (row.is("td") === true) {
                row = row.parent();
            }

            var nextRow;
            if (row.hasClass("fr-render-row")) {
                nextRow = row.next();
                if (nextRow.hasClass("fr-render-respRow"))
                    $(nextRow).remove();
            }
            else {
                nextRow = row.prev();
                if (nextRow.hasClass("fr-render-row"))
                    $(nextRow).remove();
            }


            $(row).remove();
        },
        
        _insNewRow: function (element,options) {
            var me = this;

            var row = $(element).parent().parent().parent();
            var nextRow;
            var newRow;
            var inputs;

            //Handle image in talix
            if (row.is("td") === true) {
                row = row.parent();
            }

            //Handle header special
            if (row.hasClass("fr-render-colHeader")) {
                row = row.next();
                if (row && row.hasClass("fr-render-respRow"))
                    row = row.next();
            }

            //get main row
            if (row && !row.hasClass("fr-render-row")) {
                row = row.next();         
            }

            //copy the row and appy options
            if (row) {
                nextRow = row.next();
                row.before(row.clone(true, true));
                newRow = row.prev();
                inputs =  newRow.find("*").filter(":input").not("input[type=button], :input[type=submit], :input[type=reset]");
                if (options.indexOf("clearInputs") >= 0) {
                    inputs.val("");
                    inputs.attr("data-origval", "");
                }
                if (options.indexOf("removeReadOnly") >= 0)
                    inputs.attr("readonly", false);
            }

            //if resp row copy the row and appy options
            if (nextRow && nextRow.hasClass("fr-render-respRow")) {
                newRow.after(nextRow.clone(true, true));
                newRow = newRow.next();
                inputs = newRow.find("*").filter(":input").not("input[type=button], :input[type=submit], :input[type=reset]");
                if (options.indexOf("clearInputs") >= 0) {
                    inputs.val("");
                    inputs.attr("data-origval", "");
                }
                if (options.indexOf("removeReadOnly") >= 0)
                    inputs.attr("readonly", false);

                //hook up drill
                var $Drilldown = newRow.prev().find(".fr-render-respIcon");
                $Drilldown.off("click");
                
                $Drilldown.on("click", { icon: $Drilldown, ExtRow: newRow }, function (e) {
                    var show = !e.data.ExtRow.is(":visible");
                  
                    if (show) {
                        e.data.ExtRow.show();
                        $(e.data.icon).addClass("fr-render-respTablix-collapse");
                        $(e.data.icon).removeClass("fr-render-respTablix-expand");
                    }
                    else {
                        e.data.ExtRow.hide();
                        $(e.data.icon).removeClass("fr-render-respTablix-collapse");
                        $(e.data.icon).addClass("fr-render-respTablix-expand");
                    }
            
                });


            }

                    
        },

        _getInputsInRow: function (element, filter) {
            var me = this;
            var data = [];
            var rows = 0;

            if (filter === undefined) filter = "auto";

            var row = $(element).parent().parent().parent();

            //Handle image in tablix
            if (row.is("td") === true) {
                row = row.parent();
            }
            if (row.is("tr") === false) {
                return data;
            }

            //Maximum of 2 rows to find
            while (rows < 2) {

                $.each(row.find("input, textarea"), function (index, input) {
                    var obj = {};
                   
                    obj.name = $(input).attr("name");
                    obj.value = $(input).val();
                    obj.origionalValue = $(input).attr("data-origVal");
                    obj.type = $(input).attr("type");
                    obj.submitType = $(input).attr("data-submitType");

                    if (!obj.origionalValue)
                        obj.origionalValue = "";

                    if (filter === "all")
                        data.push(obj);

                    if (filter === "auto" && (obj.submitType === "always" || (obj.submitType === "changed" && obj.value !== obj.origionalValue))) {
                        data.push(obj);
                    }
                });

                //get another row
                rows++;
                if (row.hasClass("fr-render-row")) {
                    row = row.next();
                    if (row.hasClass("fr-render-respRow") === false) //Did not find second row end
                        rows = 2;
                }
                else if (row.hasClass("fr-render-respRow")) {
                    row = row.prev();
                    if (row.hasClass("fr-render-row") === false) //Did not find second row end
                        rows = 2;
                }
            }
            return data;
        },

        _submitRow: function (inputs, type, url, datatype, done, fail, reportPath) {
            var me = this;
            var data = {};

            if (reportPath) {
                data.ReportPath = reportPath;
                var ParamsList = {};
                ParamsList.ParamsList = new Array(inputs.length);
                for (var i = 0; i < inputs.length; i++) {
                    ParamsList.ParamsList[i] = { Parameter: inputs[i].name, Value: inputs[i].value };
                }
                data.ParameterList = JSON.stringify(ParamsList);
            }
            else {

                for (var j = 0; j < inputs.length; j++) {
                    data[inputs[j].name] = inputs[j].value;
                }
                if (datatype === "json")
                    data = JSON.stringify(data);
            }

            

            forerunner.ajax.ajax({
                type: type,
                
                url: url,
                data: data,
                async: true
            }).done(function (retdata) {

                if (reportPath && JSON.parse(retdata).Exception)
                    fail();
                else
                    done();
            }).fail(fail);

        },
        _easySubmit: function (e, type, url, datatype, success, fail,reportPath) {
            if (!success) success = "alert('Success');";
            if (!fail) fail = "alert('Failed');";

            var func;
            try {
                func = new Function("e",success);
                success = func;
            }
            catch(err){
                func = undefined;
            }
            try {
                func = new Function("e", fail);
                fail = func;
            }
            catch (err) {
                func = undefined;
            }

            var successFun = function (data, textStatus) {
                success(e);                
            };
            var failFun = function (data, textStatus) {
                fail(e);
            };
                       
            var data = e.data.getInputs(e.currentTarget, "auto");

            e.data.easySubmit(data, type, url, datatype,successFun,failFun, reportPath);

        },

        _writeActions: function (RIContext, Elements, $Control) {
            var me = this;
            if (Elements.ActionInfo)
                for (var i = 0; i < Elements.ActionInfo.Count; i++) {
                    this._writeAction(RIContext, Elements.ActionInfo.Actions[i], $Control);
                }
            me._writeRDLExtActions(RIContext, $Control);
        },

        _writeRDLExtActions: function (RIContext, $Control, mapAreaOnly) {
            var me = this;

            forerunner.ssr._writeRDLExtActions(me._getSharedElements(RIContext.CurrObj.Elements.SharedElements).Name, me.RDLExt, $Control, mapAreaOnly, me.options.reportViewer.element, me._getInputsInRow, me._submitRow, undefined, undefined, me._delCurrentRow, me._insNewRow);
           

        },
        _writeAction: function (RIContext, Action, Control) {
            var me = this;
            if (Action.HyperLink) {
                Control.addClass("fr-core-cursorpointer");
                Control.attr("href", "#");
                Control.on("click", { HyperLink: Action.HyperLink }, function (e) {
                    me._stopDefaultEvent(e);               
                    if (forerunner.config.getCustomSettingsValue("URLActionNewTab", "off") === "on")
                        window.open(e.data.HyperLink, "_blank");
                    else
                        location.href = e.data.HyperLink;                    
                });

            }
            else if (Action.BookmarkLink) {
                //HRef needed for ImageMap, Class needed for non image map
                Control.attr("href", "#");
                Control.addClass("fr-core-cursorpointer");
                Control.on("click", { BookmarkID: Action.BookmarkLink }, function (e) {
                    me._stopDefaultEvent(e);
                    me.options.reportViewer.navigateBookmark(e.data.BookmarkID);
                });
            }
            else if (Action.DrillthroughId) {
                //HRef needed for ImageMap, Class needed for non image map
                Control.addClass("fr-core-cursorpointer");
                Control.attr("href", "#");
                Control.on("click", { DrillthroughId: Action.DrillthroughId }, function (e) {
                    me._stopDefaultEvent(e);
                    me.options.reportViewer.navigateDrillthrough(e.data.DrillthroughId);
                });
            }
        },
        _writeActionImageMapAreas: function (RIContext, width, height, imageConsolidationOffset) {
            var actionImageMapAreas = RIContext.CurrObj.Elements.NonSharedElements.ActionImageMapAreas;
            var me = this;
            var offsetLeft = 0, offsetTop = 0;

            if (imageConsolidationOffset) {
                offsetLeft = imageConsolidationOffset.Left;
                offsetTop = imageConsolidationOffset.Top;
            }

            if (actionImageMapAreas) {
                var $map = $("<MAP/>");
                me._writeUniqueName($map, "Map_" + RIContext.RS.sessionID + "_" + RIContext.CurrObj.Elements.NonSharedElements.UniqueName);
                $map.attr("name", "Map_" + RIContext.RS.sessionID + "_" + RIContext.CurrObj.Elements.NonSharedElements.UniqueName);
                $map.attr("id", "Map_" + RIContext.RS.sessionID + "_" + RIContext.CurrObj.Elements.NonSharedElements.UniqueName);

                for (var i = 0; i < actionImageMapAreas.Count; i++) {
                    var element = actionImageMapAreas.ActionInfoWithMaps[i];

                    for (var j = 0; j < element.ImageMapAreas.Count; j++) {
                        var $area = $("<AREA />");
                        $area.attr("tabindex", i + 1);
                        $area.attr("style", "text-decoration:none");
                        //$area.attr("alt", element.ImageMapAreas.ImageMapArea[j].Tooltip);
                        //$area.attr("title", element.ImageMapAreas.ImageMapArea[j].Tooltip);
                        me._writeTooltipInternal(element.ImageMapAreas.ImageMapArea[j].Tooltip, RIContext.$HTMLParent, $area, offsetLeft, offsetTop);

                        if (element.Actions) {
                            me._writeAction(RIContext, element.Actions[0], $area);
                        }
                        me._writeRDLExtActions(RIContext, $area, true);

                        var shape;
                        var coords = "";
                        switch (element.ImageMapAreas.ImageMapArea[j].ShapeType) {
                            case 0:
                                shape = "rect";//(x1,y1)=upper left, (x2,y2)=lower right, describe in RPL about rect is not correct or obsolete
                                coords = (parseInt(element.ImageMapAreas.ImageMapArea[j].Coordinates[0] * width / 100, 10) + offsetLeft) + "," +//x1
                                            (parseInt(element.ImageMapAreas.ImageMapArea[j].Coordinates[1] * height / 100, 10) + offsetTop) + "," +//y1
                                            (parseInt(element.ImageMapAreas.ImageMapArea[j].Coordinates[2] * width / 100, 10) + offsetLeft) + "," +//x2
                                            (parseInt(element.ImageMapAreas.ImageMapArea[j].Coordinates[3] * height / 100, 10) + offsetTop);//y2
                                break;
                            case 1:
                                shape = "poly";
                                var coorCount = element.ImageMapAreas.ImageMapArea[j].CoorCount;
                                for (var k = 0; k < coorCount; k++) {
                                    if (k % 2 === 0) {
                                        coords += parseInt(element.ImageMapAreas.ImageMapArea[j].Coordinates[k] * width / 100, 10) + offsetLeft;//X
                                    }
                                    else {
                                        coords += parseInt(element.ImageMapAreas.ImageMapArea[j].Coordinates[k] * height / 100, 10) + offsetTop;//Y
                                    }
                                    if (k < coorCount - 1) {
                                        coords += ",";
                                    }
                                }
                                break;
                            case 2:
                                shape = "circ";
                                coords = (parseInt(element.ImageMapAreas.ImageMapArea[j].Coordinates[0] * width / 100, 10) + offsetLeft) + "," +//X
                                    (parseInt(element.ImageMapAreas.ImageMapArea[j].Coordinates[1] * height / 100, 10) + offsetTop) + "," +//Y, (X,Y) is the center of the circle
                                    parseInt(element.ImageMapAreas.ImageMapArea[j].Coordinates[2] * width / 100, 10);//radius
                                break;
                        }
                        $area.attr("shape", shape);
                        $area.attr("coords", coords);
                        $map.append($area);
                    }
                }
                RIContext.$HTMLParent.append($map);
            }
        },
        _resizeImage: function (img, sizingType, height, width, maxHeight, maxWidth) {
            var ratio = 0;
            var me = this;

            height = me._convertToMM(height + "px");
            width = me._convertToMM(width + "px");
            var $img = $(img);
            if (height !== 0 && width !== 0) {
                switch (sizingType) {
                    case 0://AutoSize
                        $img.css("height", height + "mm");
                        $img.css("width", width + "mm");
                        break;
                    case 1://Fit
                        $img.css("height", maxHeight + "mm");
                        $img.css("width", maxWidth + "mm");
                        break;
                    case 2://Fit Proportional
                        if (height / maxHeight > 1 || width / maxWidth > 1) {
                            if ((height / maxHeight) >= (width / maxWidth)) {
                                ratio = maxHeight / height;

                                $img.css("height", maxHeight + "mm");
                                $img.css("width", width * ratio + "mm");
                                $img.css("max-height", maxHeight + "mm");
                                $img.css("max-width", width * ratio + "mm");
                                $img.css("min-height", maxHeight + "mm");
                                $img.css("min-width", width * ratio + "mm");
                            }
                            else {
                                ratio = maxWidth / width;

                                $img.css("width", maxWidth + "mm");
                                $img.css("height", height * ratio + "mm");
                                $img.css("max-width", maxWidth + "mm");
                                $img.css("max-height", height * ratio + "mm");
                                $img.css("min-width", maxWidth + "mm");
                                $img.css("min-height", height * ratio + "mm");
                            }
                        }
                        break;
                    case 3://Clip
                        var naturalSize = me._getNatural(img);
                        $img.css("height", me._convertToMM(naturalSize.height + "px") + "mm");
                        $img.css("width", me._convertToMM(naturalSize.width + "px") + "mm");
                        $img.css("max-height", me._convertToMM(naturalSize.height + "px") + "mm");
                        $img.css("max-width", me._convertToMM(naturalSize.width + "px") + "mm");
                        //Also add style overflow:hidden to it's parent container
                        break;
                    default:
                        break;
                }
            }
        },
        _writeTablixCell: function (RIContext, Obj, Index, BodyCellRowIndex, $Drilldown) {
            var $Cell = new $("<TD/>");
            var Style = "";
            var width;
            var height;
            var me = this;

            Style = "";

            if (Obj.Cell) {
                if (me._getElements(Obj.Cell.ReportItem).NonSharedElements)
                    Style += me._getFullBorderStyle(me._getElements(Obj.Cell.ReportItem).NonSharedElements.Style);

                $Cell.addClass(me._getClassName("fr-b-", Obj.Cell.ReportItem));
            }

            var ColIndex = Obj.ColumnIndex;

            var RowIndex;
            if (me._isNull(BodyCellRowIndex))
                RowIndex = Obj.RowIndex;
            else
                RowIndex = BodyCellRowIndex;

            width = me._getWidth(RIContext.CurrObj.ColumnWidths.Columns[ColIndex].Width);
            height = RIContext.CurrObj.RowHeights.Rows[RowIndex].Height;
            Style += "width:" + width + "mm;" + "max-width:" + width + "mm;";
            if (forerunner.device.isMSIE())
                Style += "min-height:" + height + "mm;";
            else
                Style += "height:" + height + "mm;";

            //Row and column span
            if (Obj.RowSpan !== undefined) {
                for (var rh = RowIndex + 1; rh < RowIndex + Obj.RowSpan ; rh++) {
                    height += RIContext.CurrObj.RowHeights.Rows[rh].Height;
                }
                $Cell.attr("rowspan", Obj.RowSpan);
            }
            if (Obj.ColSpan !== undefined) {
                for (var cw = ColIndex + 1; cw < ColIndex + Obj.ColSpan ; cw++) {
                    width += me._getWidth(RIContext.CurrObj.ColumnWidths.Columns[cw].Width);
                }
                $Cell.attr("colspan", Obj.ColSpan);

            }

            if (Obj.Cell) {
                //Background color goes on the cell
                if (me._getElements(Obj.Cell.ReportItem).NonSharedElements.Style && me._getElements(Obj.Cell.ReportItem).NonSharedElements.Style.BackgroundColor)
                    Style += "background-color:" + me._getElements(Obj.Cell.ReportItem).NonSharedElements.Style.BackgroundColor + ";";

                $Cell.addClass(me._getClassName("fr-n-", Obj.Cell.ReportItem));

                $Cell.attr("Style", Style);
                $Cell.addClass("fr-r-tC");
                var RI = me._writeReportItems(new reportItemContext(RIContext.RS, Obj.Cell.ReportItem, Index, RIContext.CurrObj, new $("<Div/>"), "", new tempMeasurement(height, width)));
                RI.addClass("fr-r-tCI");
                //Add Repsponsive table expand
                if ($Drilldown)
                    RI.prepend($Drilldown);

                $Cell.append(RI);
            }
            else
                $Cell.html("&nbsp");
            return $Cell;
        },
        _AddExtIDs: function (Ext, Element) {

            if (Ext.ID)
                Element.attr("id", Ext.ID);
            if (Ext.Class)
                Element.addClass(Ext.Class);
        },
        _writeTablix: function (RIContext) {
            var me = this;
            var $Tablix = me._getDefaultHTMLTable();
            var Style = "";
            var $Row;
            var LastRowIndex = 0;
            var $FixedColHeader = new $("<TABLE/>").addClass("fr-render-tablix-header");
            var $FixedRowHeader = new $("<TABLE/>").addClass("fr-render-tablix-header");
            $FixedRowHeader.attr("CELLSPACING", 0);
            $FixedRowHeader.attr("CELLPADDING", 0);
            var LastObjType = "";
            var HasFixedRows = false;
            var HasFixedCols = false;
            var respCols = { isResp: false };


            Style += me._getElementsStyle(RIContext.RS, RIContext.CurrObj.Elements);
            Style += me._getFullBorderStyle(RIContext.CurrObj.Elements.NonSharedElements);

            $Tablix.addClass("fr-render-tablix");
            $Tablix.addClass(me._getClassName("fr-n-", RIContext.CurrObj));
            $Tablix.addClass(me._getClassName("fr-t-", RIContext.CurrObj));
            $Tablix.addClass(me._getClassName("fr-b-", RIContext.CurrObj));

            var tablixExt = me._getRDLExt(RIContext);
            me._AddExtIDs(tablixExt, $Tablix);


            //If there are columns
            if (RIContext.CurrObj.ColumnWidths) {
                var colgroup = $("<colgroup/>");
                var rowHeadColGroup = $("<colgroup/>");
                var fixColWidth = 0;
                var viewerWidth = me._convertToMM(me._currentWidth + "px");
                //var tablixwidth = me._getMeasurmentsObj(RIContext.CurrObjParent, RIContext.CurrObjIndex).Width;
                var tablixwidth = RIContext.CurrLocation.Width;
                var cols;
                var sharedElements = me._getSharedElements(RIContext.CurrObj.Elements.SharedElements);


                //Setup the responsive columns def
                respCols.Columns = new Array(RIContext.CurrObj.ColumnWidths.ColumnCount);
                respCols.ColumnCount = RIContext.CurrObj.ColumnWidths.ColumnCount;
                respCols.ColumnHeaders = {};
                respCols.ColHeaderRow = 0;
                respCols.BackgroundColor = "#F2F2F2";

                if (tablixExt.ColumnHeaders) {
                    for (var ch = 0; ch < tablixExt.ColumnHeaders.length; ch++) {
                        //Just creating index, can all object later if needed
                        respCols.ColumnHeaders[tablixExt.ColumnHeaders[ch]] = ch;
                    }
                }
                if (tablixExt.ColHeaderRow !== undefined)
                    respCols.ColHeaderRow = tablixExt.ColHeaderRow - 1;
                if (tablixExt.BackgroundColor !== undefined)
                    respCols.BackgroundColor = tablixExt.BackgroundColor;

                if (me.options.responsive && me._defaultResponsizeTablix === "on" && me._maxResponsiveRes > me._currentWidth) {
                    var notdone = true;
                    var nextColIndex = RIContext.CurrObj.ColumnWidths.ColumnCount;
                    var tablixCols = RIContext.CurrObj.ColumnWidths.Columns;
                    var maxPri = -1;
                    var foundCol;
                    

                    if (tablixExt.Columns && tablixExt.Columns.length <= RIContext.CurrObj.ColumnWidths.ColumnCount) {
                        for (cols = 0; cols < tablixExt.Columns.length; cols++) {
                            respCols.Columns[parseInt(tablixExt.Columns[cols].Col, 10) - 1] = { show: true };
                        }
                    }


                    while (notdone) {
                        maxPri = -1;

                        //If the author has supplied instructions for minimizing the tablix, determine columns here                            
                        if (tablixExt.Columns) {

                            //if not all columns are in the array, use the ones that are missing first
                            if (respCols.ColumnCount > tablixExt.Columns.length) {
                                for (cols = respCols.ColumnCount - 1; cols >= 0; cols--) {
                                    if (respCols.Columns[cols] === undefined) {
                                        foundCol = cols;
                                        respCols.Columns[foundCol] = { show: false };
                                        break;
                                    }
                                }

                            }
                            else {
                                for (cols = 0; cols < tablixExt.Columns.length; cols++) {
                                    if (tablixExt.Columns[cols].Pri >= maxPri && respCols.Columns[parseInt(tablixExt.Columns[cols].Col, 10) - 1].show === true) {
                                        nextColIndex = cols;
                                        maxPri = tablixExt.Columns[cols].Pri;
                                    }
                                }
                                foundCol = parseInt(tablixExt.Columns[nextColIndex].Col, 10) - 1;
                                respCols.Columns[foundCol].Ext = tablixExt.Columns[nextColIndex];
                                respCols.Columns[foundCol] = { show: false };
                            }

                            respCols.ColumnCount--;

                        }
                            //Just remove from the right
                        else {
                            nextColIndex--;
                            foundCol = nextColIndex;
                            respCols.Columns[foundCol] = { show: false };
                            respCols.ColumnCount--;
                        }

                        tablixwidth -= tablixCols[foundCol].Width;

                        //Check if we are done                        
                        if (tablixwidth < viewerWidth || respCols.ColumnCount === 0) {
                            notdone = false;
                            //Show if more then half is visible
                            if (viewerWidth - tablixwidth > tablixCols[foundCol].Width * 0.9 || respCols.ColumnCount === 0) {
                                respCols.Columns[foundCol].show = true;
                                respCols.ColumnCount++;
                            }
                        }
                    }
                }
                //create the colgroup from visible columns
                for (cols = 0; cols < RIContext.CurrObj.ColumnWidths.ColumnCount; cols++) {
                    if (respCols.Columns[cols] === undefined)
                        respCols.Columns[cols] = { show: true };
                    else if (respCols.Columns[cols].show === false)
                        respCols.isResp = true;

                    if (respCols.Columns[cols].show) {
                        colgroup.append($("<col/>").css("width", (me._getWidth(RIContext.CurrObj.ColumnWidths.Columns[cols].Width)) + "mm"));

                        //Count the number of fixed columns
                        if (RIContext.CurrObj.ColumnWidths.Columns[cols].FixColumn === 1) {
                            var cw = me._getWidth(RIContext.CurrObj.ColumnWidths.Columns[cols].Width);

                            // add .25 for the right border
                            if (RIContext.CurrObj.ColumnWidths.Columns[cols+1].FixColumn ===0){
                                cw += 0.25;
                            }

                            fixColWidth += me._getWidth(cw);
                            rowHeadColGroup.append($("<col/>").css("width", cw + "mm"));
                        }

                    }
                }

                //Set Tablix width if not responsive.
                if (respCols.isResp === false)
                    Style += me._getMeasurements(me._getMeasurmentsObj(RIContext.CurrObjParent, RIContext.CurrObjIndex));
                $Tablix.attr("Style", Style);
                $Tablix.append(colgroup);
                if (!forerunner.device.isFirefox()) {
                    $FixedRowHeader.append(rowHeadColGroup);
                }
                $FixedColHeader.append(colgroup.clone(true, true));
                $FixedRowHeader.addClass("fr-render-tablix");
                $FixedColHeader.addClass("fr-render-tablix");
                $FixedColHeader.addClass(me._getClassName("fr-n-", RIContext.CurrObj));
                $FixedRowHeader.addClass(me._getClassName("fr-n-", RIContext.CurrObj));
                $FixedColHeader.addClass(me._getClassName("fr-t-", RIContext.CurrObj));
                $FixedRowHeader.addClass(me._getClassName("fr-t-", RIContext.CurrObj));
                $FixedColHeader.attr("Style", Style);
                $FixedRowHeader.css("width", fixColWidth + "mm");
                $FixedRowHeader.css("min-width", fixColWidth + "mm");
                $FixedRowHeader.css("max-width", fixColWidth + "mm");
            }

            me._tablixStream[RIContext.CurrObj.Elements.NonSharedElements.UniqueName] = { $Tablix: $Tablix, $FixedColHeader: $FixedColHeader, $FixedRowHeader: $FixedRowHeader, HasFixedRows: HasFixedRows, HasFixedCols: HasFixedCols, RIContext: RIContext, respCols: respCols };

            var TS = me._tablixStream[RIContext.CurrObj.Elements.NonSharedElements.UniqueName];
            TS.State = { "LastRowIndex": 0, "LastObjType": "", "StartIndex": 0, CellCount: 0 };
            TS.EndRow = $("<TR/>").addClass("fr-lazyNext").css("visible", false).text(me.options.reportViewer.locData.getLocData().messages.loading);
            me._writeTablixRowBatch(TS);

            HasFixedRows = TS.HasFixedRows;
            HasFixedCols = TS.HasFixedCols;
            if (HasFixedRows) {
                $FixedColHeader.css("visibility", "hidden");
            }
            else
                $FixedColHeader = null;

            if (HasFixedCols) {
                $FixedRowHeader.css("visibility", "hidden");
            }
            else
                $FixedRowHeader = null;

            var ret = $("<div style='position:relative'></div");
            $Tablix.append($FixedColHeader);
            $Tablix.append($FixedRowHeader);

            if (RIContext.CurrObj.Elements.NonSharedElements.UniqueName)
                me._writeUniqueName($Tablix, RIContext.CurrObj.Elements.NonSharedElements.UniqueName);
            RIContext.$HTMLParent = ret;

            me._writeBookMark(RIContext);
            me._writeTooltip(RIContext);
            me._writeActions(RIContext, {}, $Tablix);

            ret.append($Tablix);
            RIContext.RS.floatingHeaders.push(new floatingHeader(ret, $FixedColHeader, $FixedRowHeader));
            return ret;
        },



        _writeSingleTablixRow: function (RIContext, $Tablix, Index, Obj, $FixedColHeader, $FixedRowHeader, State, respCols) {
            var me = this;
            var LastRowIndex = State.LastRowIndex;
            var LastColIndex = State.LastColIndex;
            var LastObjType = State.LastObjType;
            var $Row = State.Row;
            var HasFixedCols = false;
            var HasFixedRows = false;
            var $ExtRow = State.ExtRow;
            var $ExtCell = State.ExtCell;
            var CellHeight;
            var CellWidth;

            if (State.ExtRow === undefined && respCols.isResp) {
                $ExtRow = new $("<TR/>");
                $ExtCell = new $("<TD/>").attr("colspan", respCols.ColumnCount).css("background-color", respCols.BackgroundColor);
                $ExtCell.css("position", "relative");
                $ExtRow.addClass("fr-render-respRow");
                $ExtRow.append($ExtCell);
                $ExtRow.hide();
            }

            if (State.Row === undefined) {
                $Row = new $("<TR/>");
                $Row.addClass("fr-render-row");
            }

            var Colspans = State.Colspans;
            var Rowspans = State.Rowspans;

            if (LastColIndex === undefined) {
                LastColIndex = -1;
                Colspans = {};
                Rowspans = {};
            }

            if (Obj.RowSpan)
                Rowspans[Obj.ColumnIndex] = Obj.RowSpan;
            else if (Rowspans[Obj.ColumnIndex] > 0)
                Rowspans[Obj.ColumnIndex]--;

            if (Rowspans[Obj.ColumnIndex] === 0 || isNaN(Rowspans[Obj.ColumnIndex]))
                Rowspans[Obj.ColumnIndex] = undefined;

            if (Obj.ColSpan)
                Colspans[Obj.ColumnIndex] = Obj.ColSpan;
            else if (Colspans[Obj.ColumnIndex] > 0)
                Colspans[Obj.ColumnIndex]--;

            if (Colspans[Obj.ColumnIndex] === 0 || isNaN(Colspans[Obj.ColumnIndex]))
                Colspans[Obj.ColumnIndex] = undefined;

            if (Obj.RowIndex !== LastRowIndex) {
                $Tablix.append($Row);

                //Dont add the ext row if no data and hide the expand icon
                if (respCols.isResp && $ExtRow && $ExtRow.children()[0].children.length > 0)
                    $Tablix.append($ExtRow);
                else
                    $Row.findUntil(".fr-render-respIcon", ".fr-render-tablix").hide();


                //Handle fixed col header
                if (RIContext.CurrObj.RowHeights.Rows[Obj.RowIndex - 1].FixRows === 1) {                    
                    $FixedColHeader.append($Row.clone(true, true));
                }

                $Row = new $("<TR/>");
                $Row.addClass("fr-render-row");

                if (respCols.isResp) {
                    $ExtRow = new $("<TR/>");
                    $ExtCell = new $("<TD/>").attr("colspan", respCols.ColumnCount).css("background-color", respCols.BackgroundColor);
                    $ExtCell.css("position", "relative");
                    $ExtRow.addClass("fr-render-respRow");
                    $ExtRow.append($ExtCell);
                    $ExtRow.hide();
                }

                //Handle missing rows
                for (var ri = LastRowIndex + 1; ri < Obj.RowIndex ; ri++) {
                    $Tablix.append($Row);
                    $Row = new $("<TR/>");
                }
                LastRowIndex = Obj.RowIndex;
                LastColIndex = -1;
            }

            if (Obj.UniqueName)
                me._writeUniqueName($Row, Obj.UniqueName);

            //Handle fixed row header
            if (Obj.Type !== "Corner" && LastObjType === "Corner") {
                $FixedRowHeader.append($Row.clone(true, true));
            }
            if (Obj.Type !== "RowHeader" && LastObjType === "RowHeader") {
                $FixedRowHeader.append($Row.clone(true, true));
            }
            if (RIContext.CurrObj.RowHeights.Rows[Obj.RowIndex] && RIContext.CurrObj.RowHeights.Rows[Obj.RowIndex].FixRows === 1)
                HasFixedRows = true;

            //There seems to be a bug in RPL, it can return a colIndex that is greater than the number of columns
            if (Obj.Type !== "BodyRow" && RIContext.CurrObj.ColumnWidth && RIContext.CurrObj.ColumnWidths.Columns[Obj.ColumnIndex]) {
                if (RIContext.CurrObj.ColumnWidths.Columns[Obj.ColumnIndex].FixColumn === 1)
                    HasFixedCols = true;
            }

            var $Drilldown;
            CellHeight = 0;
            if (RIContext.CurrObj.RowHeights.Rows[Obj.RowIndex])
                CellHeight = RIContext.CurrObj.RowHeights.Rows[Obj.RowIndex].Height;

            if (Obj.Type === "BodyRow") {

                //Handle missing cells
                $.each(Rowspans, function (rsIndex, RSObj) {
                    // No not get NaN
                    if (Rowspans[rsIndex] !== undefined)
                        Rowspans[rsIndex]--;
                });

                $.each(Obj.Cells, function (BRIndex, BRObj) {

                    //Mark as header
                    if (respCols.ColHeaderRow === Obj.RowIndex)
                        $Row.addClass("fr-render-colHeader");

                    CellWidth = RIContext.CurrObj.ColumnWidths.Columns[BRObj.ColumnIndex].Width;


                    //Remove Extra Headers cells that overlap with Body
                    // For some reason SSRS will have headers and body for the same cell
                    //If there was an empty RowHeader for same cell, remove and add body row
                    for (var lci = LastColIndex ; lci >= BRObj.ColumnIndex ; lci--) {
                        $("td:last-child", $Row).remove();
                    }

                    LastColIndex = BRObj.ColumnIndex;
                    //Handle Col spans, last col is after the span
                    if (BRObj.ColSpan)
                        LastColIndex += BRObj.ColSpan - 1;

                    $Drilldown = undefined;

                    if (respCols.Columns[BRObj.ColumnIndex].show) {
                        if (respCols.isResp && respCols.ColHeaderRow !== Obj.RowIndex && BRObj.RowSpan === undefined && $ExtRow && $ExtRow.HasDrill !== true && BRObj.Cell) {
                            //If responsive table add the show hide image and hook up
                            $Drilldown = me._addTablixRespDrill($ExtRow, BRObj.ColumnIndex, $Tablix, BRObj.Cell);
                            $ExtRow.HasDrill = true;
                        }
                        $Row.append(me._writeTablixCell(RIContext, BRObj, BRIndex, Obj.RowIndex, $Drilldown));
                    }
                    else {
                        if (respCols.ColHeaderRow === Obj.RowIndex || me._isHeader(respCols, BRObj.Cell)) {

                            if (respCols.Columns[BRObj.ColumnIndex].HeaderIndex === undefined)
                                respCols.Columns[BRObj.ColumnIndex].HeaderIndex = 0;
                            if (respCols.Columns[BRObj.ColumnIndex].HeaderName === undefined)
                                respCols.Columns[BRObj.ColumnIndex].HeaderName = me._getElements(BRObj.Cell.ReportItem).NonSharedElements.UniqueName;
                            respCols.Columns[BRObj.ColumnIndex].Header = me._writeReportItems(new reportItemContext(RIContext.RS, BRObj.Cell.ReportItem, BRIndex, RIContext.CurrObj, new $("<Div/>"), "", new tempMeasurement(CellHeight, CellWidth), true));
                            respCols.Columns[BRObj.ColumnIndex].Header.children().removeClass("fr-r-fS");

                            //Undo rotate if needed
                            me._unRotate(respCols.Columns[BRObj.ColumnIndex].Header.children(0).children(0));
                            $ExtRow = null;
                        }
                        else {
                            if (respCols.Columns[BRObj.ColumnIndex].Header)
                                $ExtCell.append(respCols.Columns[BRObj.ColumnIndex].Header.clone(true, true).attr("data-uniqName", respCols.Columns[BRObj.ColumnIndex].HeaderName + "-" + respCols.Columns[BRObj.ColumnIndex].HeaderIndex++));
                            if (BRObj.Cell) {
                                var ric;
                                ric = me._writeReportItems(new reportItemContext(RIContext.RS, BRObj.Cell.ReportItem, BRIndex, RIContext.CurrObj, new $("<Div/>"), "", new tempMeasurement(CellHeight, CellWidth)));
                                ric.css("width", CellWidth + "mm");
                                ric.css("height", CellHeight + "mm");
                                $ExtCell.append(ric);
                            }
                        }
                    }
                });
                State.CellCount += Obj.Cells.length;
            }
            else {
                var ci2 = LastColIndex;
                

                if (Obj.Cell) {
                    
                    //Handel missing cells
                    for ( ci2 = LastColIndex + 1; ci2 < Obj.ColumnIndex && Rowspans[ci2] === undefined  ; ci2++) {
                        $Row.append($("<TD/>").html("&nbsp;"));
                    }

                    LastColIndex = Obj.ColumnIndex;
                    //Handle Col spans, last col is after the span
                    if (Obj.ColSpan)
                        LastColIndex += Obj.ColSpan - 1;

                    if (respCols.Columns[Obj.ColumnIndex].show === false && (Obj.Type === "Corner" || Obj.Type === "ColumnHeader")) {
                        CellWidth = RIContext.CurrObj.ColumnWidths.Columns[Obj.ColumnIndex].Width;
                        var h = me._writeReportItems(new reportItemContext(RIContext.RS, Obj.Cell.ReportItem, Index, RIContext.CurrObj, new $("<Div/>"), "", new tempMeasurement(CellHeight, CellWidth), true));
                        if (respCols.Columns[Obj.ColumnIndex].Header === undefined)
                            respCols.Columns[Obj.ColumnIndex].Header = new $("<div/>");

                        if (respCols.Columns[Obj.ColumnIndex].HeaderIndex === undefined)
                            respCols.Columns[Obj.ColumnIndex].HeaderIndex = 0;
                        if (respCols.Columns[Obj.ColumnIndex].HeaderName === undefined)
                            respCols.Columns[Obj.ColumnIndex].HeaderName = me._getElements(Obj.Cell.ReportItem).NonSharedElements.UniqueName;
                        respCols.Columns[Obj.ColumnIndex].Header.append(h);
                        respCols.Columns[Obj.ColumnIndex].Header.children().children().removeClass("fr-r-fS");

                        me._unRotate(respCols.Columns[Obj.ColumnIndex].Header.children(0).children(0));
                        $ExtRow = null;
                    }
                    else {
                        if (respCols.isResp && Obj.Type === "RowHeader" && Obj.RowSpan === undefined && respCols.ColHeaderRow !== Obj.RowIndex && $ExtRow && $ExtRow.HasDrill !== true) {
                            //add drill  - rowspan and of none means most detail RowHeader
                            $Drilldown = me._addTablixRespDrill($ExtRow, Obj.ColumnIndex, $Tablix, Obj.Cell);
                            $ExtCell.attr("colspan", respCols.ColumnCount - Obj.ColumnIndex);
                            $ExtRow.HasDrill = true;
                        }
                        //This is a hack for now, colIndex 0 makes a big assumption - but a pretty safe one
                        if (respCols.isResp && Obj.RowSpan !== undefined && Obj.ColumnIndex === 0) {
                            if (Obj.Type === "Corner")
                                $Row.addClass("fr-resp-corner");
                            else
                                $Row.addClass("fr-resp-rowspan");
                        }
                        $Row.append(me._writeTablixCell(RIContext, Obj, Index, undefined, $Drilldown));
                    }
                    State.CellCount += 1;

                }
                else if (Obj.Type !== "ColumnHeader") {
                    
                    //add empty cells that where missed
                    for ( ci2 = LastColIndex + 1; ci2 < Obj.ColumnIndex && Rowspans[ci2] === undefined  ; ci2++) {
                        $Row.append($("<TD/>").html("&nbsp;"));
                    }
                    LastColIndex = Obj.ColumnIndex;                    
                    if (Obj.ColSpan)
                        LastColIndex += Obj.ColSpan - 1;

                    //Dont write cell if there is a row span unless this is the first row
                    if (Rowspans[Obj.ColumnIndex] === undefined || Obj.RowSpan > 0 || Obj.ColSpan >0) {
                        //Write empty cell           
                        var $td = $("<TD/>").html("&nbsp;");
                        //Add row span since not added in cell
                        if (Obj.RowSpan > 0) {
                            $td.attr("rowspan", Obj.RowSpan);
                        }
                        if (Obj.ColSpan > 0) {
                            $td.attr("colspan", Obj.ColSpan);
                        }
                        $Row.append($td);
                    }
                   
                }

            }
            LastObjType = Obj.Type;
            return { LastRowIndex: LastRowIndex, LastColIndex: LastColIndex, Colspans: Colspans, Rowspans: Rowspans, LastObjType: LastObjType, Row: $Row, ExtRow: $ExtRow, ExtCell: $ExtCell, HasFixedCols: HasFixedCols, HasFixedRows: HasFixedRows, CellCount: State.CellCount };
        },
        _unRotate: function (header) {

            //Undo rotate if needed    
            $.each(header, function (i, obj) {
                obj = $(obj);
                if (obj.hasClass("fr-rotate-90") || obj.hasClass("fr-rotate-270")) {
                    obj.removeClass("fr-rotate-90").removeClass("fr-rotate-270");
                    obj.css("left", "").css("top", "").css("width", "").css("height", "").css("position", "");
                }
            });

        },
        _isHeader: function (respCols, cell) {
            var me = this;
            var cellDefName;

            if (cell === undefined)
                return false;

            cellDefName = (me._getSharedElements(me._getElements(cell.ReportItem).SharedElements)).Name;

            if (respCols.ColumnHeaders[cellDefName])
                return true;
            return false;


        },
        /**
         * Open all the toggles for a repsonsive tablix
         *
         * @function $.forerunner.reportRender#replayRespTablix
         *
         * @param {Object} replay - The stack of toggles top replay
         */
        replayRespTablix: function (replay) {
            var me = this;

            if (replay) {
                $.each(replay, function (i, obj) {
                    var icon;
                    var ExtRow;
                    var cell;

                    if (obj.Visible) {
                        //find cell
                        cell = me.element.find("[data-uniqName=\"" + obj.UniqueName + "\"]");
                        icon = cell.prev();
                        if (icon.hasClass("fr-render-respIcon") === false)
                            icon = icon.prev();
                        ExtRow = icon.parent().parent().parent().next();

                        me._TablixRespShow(icon, ExtRow, obj.ColIndex, obj.UniqueName);

                    }
                });
            }

        },
        _addTablixRespDrill: function ($ExtRow, ColIndex, $Tablix, Cell) {
            var me = this;

            var $Drilldown = new $("<div/>");
            $Drilldown.html("&nbsp");
            $Drilldown.addClass("fr-render-respTablix-expand");
            $Drilldown.addClass("fr-render-respIcon");

            $Drilldown.on("click", { ExtRow: $ExtRow, ColIndex: ColIndex, UniqueName: me._getElements(Cell.ReportItem).NonSharedElements.UniqueName, $Tablix: $Tablix }, function (e) {

                me._TablixRespShow(this, e.data.ExtRow, e.data.ColIndex, e.data.UniqueName, e.data.$Tablix);
                return;

            });
            $Drilldown.addClass("fr-core-cursorpointer");
            return $Drilldown;
        },

        _TablixRespShow: function (icon, ExtRow, ColIndex, UniqueName, $Tablix) {
            var me = this;
            var show = !ExtRow.is(":visible");
            var delta;

            if (show) {
                ExtRow.show();
                delta = 1;
                me.Page.Replay[UniqueName] = { Visible: true, ColIndex: ColIndex, UniqueName: UniqueName };
            }
            else {
                delta = -1;
                me.Page.Replay[UniqueName] = { Visible: false, ColIndex: ColIndex, UniqueName: UniqueName };
            }


            if (ColIndex > 0) {
                $.each(ExtRow.prevAll(), function (r, tr) {

                    //if the corrner stop
                    if ($(tr).hasClass("fr-resp-corner"))
                        return false;

                    $.each($(tr).children("[rowspan]"), function (c, td) {
                        if ($(td).height() > 0)
                            $(td).attr("rowspan", parseInt($(td).attr("rowspan"), 10) + delta);
                    });
                    if ($(tr).hasClass("fr-resp-rowspan"))
                        return false;
                });
            }

            if (show) {
                $(icon).addClass("fr-render-respTablix-collapse");
                $(icon).removeClass("fr-render-respTablix-expand");
            }
            else {
                ExtRow.hide();
                $(icon).removeClass("fr-render-respTablix-collapse");
                $(icon).addClass("fr-render-respTablix-expand");
            }
            me.layoutReport(true);
            if ($Tablix)
                $Tablix.hide().show(0);

        },
        _batchSize: function () {
            return forerunner.config.getCustomSettingsValue("BigTablixBatchSize", 3000);
        },
        _tablixStream: {},
        _writeTablixRowBatch: function (Tablix) {
            var me = this;

            //me.options.reportViewer.showLoadingIndictator(me.options.reportViewer,true);

            for (var Index = Tablix.State.StartIndex; Index < Tablix.RIContext.CurrObj.TablixRows.length && Tablix.State.CellCount < me._batchSize() ; Index++) {
                var Obj = Tablix.RIContext.CurrObj.TablixRows[Index];
                Tablix.State = me._writeSingleTablixRow(Tablix.RIContext, Tablix.$Tablix, Index, Obj, Tablix.$FixedColHeader, Tablix.$FixedRowHeader, Tablix.State, Tablix.respCols);
                if (Tablix.State.HasFixedRows === true)
                    Tablix.HasFixedRows = true;
                if (Tablix.State.HasFixedCols === true)
                    Tablix.HasFixedCols = true;
            }
            //me.options.reportViewer.removeLoadingIndicator(true);
            Tablix.State.StartIndex = Index;
            Tablix.State.CellCount = 0;
            if (Tablix.State.StartIndex < Tablix.RIContext.CurrObj.TablixRows.length) {
                Tablix.$Tablix.append(Tablix.EndRow);
                Tablix.BigTablix = true;
            }
            else {
                Tablix.$Tablix.append(Tablix.State.Row);
                if (Tablix.respCols.isResp && Tablix.State.ExtRow && Tablix.State.ExtRow.children()[0].children.length > 0) {
                    Tablix.$Tablix.append(Tablix.State.ExtRow);
                    Tablix.State.ExtRow.hide();
                }
                else if(Tablix.State.Row)
                    Tablix.State.Row.findUntil(".fr-render-respIcon", ".fr-render-tablix").hide();

                Tablix.BigTablixDone = true;
            }
        },

        _lazyLoadTablix: function (me) {

            for (var name in me._tablixStream) {
                if (me._tablixStream[name].EndRow.visible(false, false, "vertical")) {
                    me._tablixStream[name].EndRow.detach();
                    me._writeTablixRowBatch(me._tablixStream[name]);

                    //If we are done re-size the report to the new size
                    if (me._tablixStream[name].BigTablixDone) {
                        me.layoutReport(true);
                    }
                }

            }

        },


        _writeSubreport: function (RIContext) {
            var me = this;

            if (RIContext.CurrObjParent.Type !== "Tablix") {
                RIContext.Style += me._getElementsStyle(RIContext.RS, RIContext.CurrObj.SubReportProperties);
            }
            RIContext.CurrObj = RIContext.CurrObj.BodyElements;
            me._writeBookMark(RIContext);
            me._writeTooltip(RIContext);
            return me._writeRectangle(RIContext);

        },
        _writeLine: function (RIContext) {
            var me = this;
            var measurement = me._getMeasurmentsObj(RIContext.CurrObjParent, RIContext.CurrObjIndex);
            var Style = "position:relative;width:" + measurement.Width + "mm;height:" + measurement.Height + "mm;";

            if (measurement.Width === 0 || measurement.Height === 0) {
                Style += me._getFullBorderStyle(RIContext.CurrObj.Elements.NonSharedElements);
                RIContext.$HTMLParent.addClass(me._getClassName("fr-b-", RIContext.CurrObj));
            }
            else {
                var $line = $("<Div/>");
                var newWidth = Math.sqrt(Math.pow(measurement.Height, 2) + Math.pow(measurement.Width, 2));
                var rotate = Math.atan(measurement.Height / measurement.Width);
                var newTop = (newWidth / 2) * Math.sin(rotate);
                var newLeft = (newWidth / 2) - Math.sqrt(Math.pow(newWidth / 2, 2) + Math.pow(newTop, 2));
                if (!(me._getSharedElements(RIContext.CurrObj.Elements.SharedElements).Slant === undefined || me._getSharedElements(RIContext.CurrObj.Elements.SharedElements).Slant === 0))
                    rotate = rotate - (2 * rotate);

                var lineStyle = "position:absolute;top:" + newTop + "mm;left:" + newLeft + "mm;";
                lineStyle += me._getFullBorderStyle(RIContext.CurrObj.Elements.NonSharedElements);
                $line.addClass(me._getClassName("fr-b-", RIContext.CurrObj));

                lineStyle += "width:" + newWidth + "mm;height:0;";
                lineStyle += "-moz-transform: rotate(" + rotate + "rad);";
                lineStyle += "-webkit-transform: rotate(" + rotate + "rad);";
                lineStyle += "-ms-transform: rotate(" + rotate + "rad);";
                lineStyle += "transform: rotate(" + rotate + "rad);";
                $line.attr("Style", lineStyle);

                RIContext.$HTMLParent.append($line);
            }

            me._writeBookMark(RIContext);
            me._writeTooltip(RIContext);

            RIContext.$HTMLParent.attr("Style", Style + RIContext.Style);
            return RIContext.$HTMLParent;

        },
        _writeBookMark: function (RIContext) {
            var me = this;
            var $node = $("<a/>"),
                CurrObj = RIContext.CurrObj.Elements,
                bookmark = me._getSharedElements(CurrObj.SharedElements).Bookmark || CurrObj.NonSharedElements.Bookmark;

            if (bookmark) {
                me._writeUniqueName($node, bookmark);
                //$node.attr("id", bookmark);
                RIContext.$HTMLParent.append($node);
            }
        },
        _writeTooltipInternal: function (tooltip, element, actionElement, offsetLeft, offsetTop) {
            var me = this;

            if (tooltip && forerunner.config.getCustomSettingsValue("FancyTooltips", "off").toLowerCase() === "on" && !forerunner.device.isMSIE8()) {
                // Make DIV and append to page 
                var $tooltip = $("<div class='fr-tooltip'>" + tooltip + "<div class='fr-arrow'></div></div>");


                element.append($tooltip);
                var timer;

                // Mouseenter
                actionElement.on("mouseenter", function (e) {

                    if (timer) {
                        clearTimeout(timer);
                        timer = null;
                    }

                    var $el = $(this);
                    var top = 0;
                    var left = 0;

                    // Reposition tooltip, in case of page movement e.g. screen resize           
                    var parentOffset = $(this).parent().offset();
                    if ($(this).parent().is("map")) {
                        parentOffset = $(this).parent().parent().offset();
                    }


                    top = e.pageY - parentOffset.top;
                    left = e.pageX - parentOffset.left;

                    $tooltip.css({
                        top: top - $tooltip.outerHeight() - 13,
                        left: left - ($tooltip.outerWidth() / 2)
                    });

                    timer = setTimeout(function () {
                        // Adding class handles animation through CSS
                        $tooltip.addClass("active");
                    }, 1000);
                }
                );

                // Mouseleave
                actionElement.on("mouseleave", function (e) {
                    clearTimeout(timer);
                    var $el = $(this);

                    // Remove all classes
                    setTimeout(function () {
                        $tooltip.removeClass("active").removeClass("out");
                    }, 300);

                });

            }
            else if (tooltip) {
                actionElement.attr("alt", tooltip);
                actionElement.attr("title", tooltip);
            }
        },
        _writeTooltip: function (RIContext) {
            var me = this;

            var CurrObj = RIContext.CurrObj.Elements;
            var tooltip = me._getSharedElements(CurrObj.SharedElements).Tooltip || CurrObj.NonSharedElements.Tooltip;

            me._writeTooltipInternal(tooltip, RIContext.$HTMLParent, RIContext.$HTMLParent, 0, 0);
        },
        //Helper fucntions
        _getHeight: function ($obj) {
            var me = this;
            var height;
            var $copiedElem;

            $copiedElem = $obj.clone().css({ visibility: "hidden" });
            $copiedElem.find("img").remove();

            $("body").append($copiedElem);
            height = $copiedElem.outerHeight() + "px";
            $copiedElem.remove();

            //Return in mm
            return me._convertToMM(height);

        },
        _getElements: function (CurrObj) {
            //Use to handle report items and sub reports
            if (CurrObj.Elements)
                return CurrObj.Elements;
            if (CurrObj.SubReportProperties)
                return CurrObj.SubReportProperties;
        },

        _getElementsStyle: function (RS, CurrObj) {
            var Style = "";
            var me = this;

            //Style += me._getStyle(RS, me._getSharedElements(CurrObj.SharedElements).Style, CurrObj.NonSharedElements);
            Style += me._getStyle(RS, CurrObj.NonSharedElements.Style, CurrObj.NonSharedElements);
            //Background Image maybe at root
            Style += me._getStyle(RS, CurrObj, CurrObj);
            return Style;
        },
        _getElementsTextStyle: function (CurrObj) {
            var Style = "";
            var me = this;

            //Style += me._getTextStyle(me._getSharedElements(CurrObj.SharedElements).Style, CurrObj.NonSharedElements);
            Style += me._getTextStyle(CurrObj.NonSharedElements.Style, CurrObj.NonSharedElements);
            return Style;
        },
        _getElementsNonTextStyle: function (RS, CurrObj) {
            var Style = "";
            var me = this;

            //Style += me._getNonTextStyle(RS, me._getSharedElements(CurrObj.SharedElements).Style, CurrObj.NonSharedElements);
            Style += me._getNonTextStyle(RS, CurrObj.NonSharedElements.Style, CurrObj.NonSharedElements);
            return Style;
        },
        _getBorderSize: function (CurrObj, Side) {
            var me = this;
            var Obj;
            var DefaultStyle;
            var SideStyle;
            var DefaultSize;
            var SideSize;

            //Need left, top, right bottom border
            Obj = me._getSharedElements(CurrObj.Elements.SharedElements).Style;
            if (Obj) {
                DefaultStyle = Obj.BorderStyle;
                SideStyle = Obj["BorderStyle" + Side];
                DefaultSize = Obj.BorderWidth;
                SideSize = Obj["BorderWidth" + Side];
            }
            else {
                Obj = CurrObj.Elements.NonSharedElements.Style;
                if (Obj) {
                    DefaultStyle = Obj.BorderStyle;
                    SideStyle = Obj["BorderStyle" + Side];
                    DefaultSize = Obj.BorderWidth;
                    SideSize = Obj["BorderWidth" + Side];
                }
            }

            if (!SideStyle && DefaultStyle === 0)
                return 0;
            if (SideStyle === 0)
                return 0;
            if (!SideSize)
                return me._convertToMM(DefaultSize);
            else
                return me._convertToMM(SideSize);
        },
        _getPaddingSize: function (CurrObj, Side) {
            var me = this;
            var Obj;
            var SideSize;


            Obj = me._getSharedElements(CurrObj.Elements.SharedElements).Style;
            if (Obj) {
                SideSize = Obj["Padding" + Side];
            }
            else {
                Obj = CurrObj.Elements.NonSharedElements.Style;
                if (Obj) {
                    SideSize = Obj["Padding" + Side];
                }
            }
            return me._convertToMM(SideSize);
        },
        _getFullBorderStyle: function (CurrObj) {
            var me = this;
            var Style = "";
            var Obj;

            if (!CurrObj)
                return "";

            //Need left, top, right bottom border
            //Obj = me._getSharedElements(CurrObj.Elements.SharedElements).Style;
            //if (Obj !== undefined) {
            //    if (Obj.BorderStyle !== undefined && Obj.BorderStyle !==0 )
            //        Style += "border:" + Obj.BorderWidth + " " + me._getBorderStyle(Obj.BorderStyle) + " " + Obj.BorderColor + ";";
            //    if (Obj.BorderStyleLeft !== undefined || Obj.BorderWidthLeft !== undefined || Obj.BorderColorLeft !== undefined)
            //        Style += "border-left:" + ((Obj.BorderWidthLeft === undefined) ? Obj.BorderWidth : Obj.BorderWidthLeft) + " " + ((Obj.BorderStyleLeft === undefined) ? me._getBorderStyle(Obj.BorderStyle) : me._getBorderStyle(Obj.BorderStyleLeft)) + " " + ((Obj.BorderColorLeft === undefined) ? Obj.BorderColor : Obj.BorderColorLeft) + ";";
            //    if (Obj.BorderStyleRight !== undefined || Obj.BorderWidthRight !== undefined || Obj.BorderColorRight !== undefined)
            //        Style += "border-right:" + ((Obj.BorderWidthRight === undefined) ? Obj.BorderWidth : Obj.BorderWidthRight) + " " + ((Obj.BorderStyleRight === undefined) ? me._getBorderStyle(Obj.BorderStyle) : me._getBorderStyle(Obj.BorderStyleRight)) + " " + ((Obj.BorderColorRight === undefined) ? Obj.BorderColr : Obj.BorderColorRight) + ";";
            //    if (Obj.BorderStyleTop !== undefined || Obj.BorderWidthTop !== undefined || Obj.BorderColorTop !== undefined)
            //        Style += "border-top:" + ((Obj.BorderWidthTop === undefined) ? Obj.BorderWidth : Obj.BorderWidthTop) + " " + ((Obj.BorderStyleTop === undefined) ? me._getBorderStyle(Obj.BorderStyle) : me._getBorderStyle(Obj.BorderStyleTop)) + " " + ((Obj.BorderColorTop === undefined) ? Obj.BorderColor : Obj.BorderColorTop) + ";";
            //    if (Obj.BorderStyleBottom !== undefined || Obj.BorderWidthBottom !== undefined || Obj.BorderColorBottom !== undefined)
            //        Style += "border-bottom:" + ((Obj.BorderWidthBottom === undefined) ? Obj.BorderWidth : Obj.BorderWidthBottom) + " " + ((Obj.BorderStyleBottom === undefined) ? me._getBorderStyle(Obj.BorderStyle) : me._getBorderStyle(Obj.BorderStyleBottom)) + " " + ((Obj.BorderColorBottom === undefined) ? Obj.BorderColor : Obj.BorderColorBottom) + ";";
            //}
            Obj = CurrObj;
            if (Obj !== undefined) {
                if (Obj.BorderStyle !== undefined && Obj.BorderStyle !== 0)
                    Style += "border:" + Obj.BorderWidth + " " + me._getBorderStyle(Obj.BorderStyle) + " " + Obj.BorderColor + "!important;";
                if (Obj.BorderStyleLeft !== undefined || Obj.BorderWidthLeft !== undefined || Obj.BorderColorLeft !== undefined)
                    Style += "border-left:" + ((Obj.BorderWidthLeft === undefined) ? Obj.BorderWidth : Obj.BorderWidthLeft) + " " + ((Obj.BorderStyleLeft === undefined) ? me._getBorderStyle(Obj.BorderStyle) : me._getBorderStyle(Obj.BorderStyleLeft)) + " " + ((Obj.BorderColorLeft === undefined) ? Obj.BorderColor : Obj.BorderColorLeft) + "!important;";
                if (Obj.BorderStyleRight !== undefined || Obj.BorderWidthRight !== undefined || Obj.BorderColorRight !== undefined)
                    Style += "border-right:" + ((Obj.BorderWidthRight === undefined) ? Obj.BorderWidth : Obj.BorderWidthRight) + " " + ((Obj.BorderStyleRight === undefined) ? me._getBorderStyle(Obj.BorderStyle) : me._getBorderStyle(Obj.BorderStyleRight)) + " " + ((Obj.BorderColorRight === undefined) ? Obj.BorderColor : Obj.BorderColorRight) + "!important;";
                if (Obj.BorderStyleTop !== undefined || Obj.BorderWidthTop !== undefined || Obj.BorderColorTop !== undefined)
                    Style += "border-top:" + ((Obj.BorderWidthTop === undefined) ? Obj.BorderWidth : Obj.BorderWidthTop) + " " + ((Obj.BorderStyleTop === undefined) ? me._getBorderStyle(Obj.BorderStyle) : me._getBorderStyle(Obj.BorderStyleTop)) + " " + ((Obj.BorderColorTop === undefined) ? Obj.BorderColor : Obj.BorderColorTop) + "!important;";
                if (Obj.BorderStyleBottom !== undefined || Obj.BorderWidthBottom !== undefined || Obj.BorderColorBottom !== undefined)
                    Style += "border-bottom:" + ((Obj.BorderWidthBottom === undefined) ? Obj.BorderWidth : Obj.BorderWidthBottom) + " " + ((Obj.BorderStyleBottom === undefined) ? me._getBorderStyle(Obj.BorderStyle) : me._getBorderStyle(Obj.BorderStyleBottom)) + " " + ((Obj.BorderColorBottom === undefined) ? Obj.BorderColor : Obj.BorderColorBottom) + "!important;";
                if (Obj.BackgroundColor)
                    Style += "background-color:" + Obj.BackgroundColor + ";";
            }

            return Style;
        },
        _getMeasurementsInvert: function (CurrObj) {
            var me = this;
            var Style = "";
            //TODO:  zIndex

            if (!CurrObj)
                return "";

            //Top and left are set in set location, height is not set becasue differnt browsers measure and break words differently
            if (CurrObj.Width !== undefined) {
                Style += "height:" + CurrObj.Width + "mm;";
                Style += "min-height:" + CurrObj.Width + "mm;";
                Style += "max-height:" + (CurrObj.Width) + "mm;";
            }

            if (CurrObj.Height !== undefined) {
                Style += "width:" + CurrObj.Height + "mm;";
                Style += "min-width:" + CurrObj.Height + "mm;";
                Style += "max-width:" + (CurrObj.Height) + "mm;";
            }

            //if (CurrObj.zIndex)
            //    Style += "z-index:" + CurrObj.zIndex + ";";

            return Style;
        },
        _getMeasurements: function (CurrObj, includeHeight) {
            var me = this;
            var Style = "";
            //TODO:  zIndex

            if (!CurrObj)
                return "";

            //Top and left are set in set location, height is not set becasue differnt browsers measure and break words differently
            if (CurrObj.Width !== undefined) {
                Style += "width:" + me._getWidth(CurrObj.Width) + "mm;";
                Style += "min-width:" + me._getWidth(CurrObj.Width) + "mm;";
                Style += "max-width:" + me._getWidth(CurrObj.Width) + "mm;";
            }

            if (includeHeight && CurrObj.Height !== undefined) {
                Style += "height:" + CurrObj.Height + "mm;";
                Style += "min-height:" + CurrObj.Height + "mm;";
                Style += "max-height:" + (CurrObj.Height) + "mm;";
            }

            //if (CurrObj.zIndex)
            //    Style += "z-index:" + CurrObj.zIndex + ";";

            return Style;
        },
        _getStyle: function (RS, CurrObj, TypeCodeObj) {
            var me = this;
            var Style = "";

            if (!CurrObj)
                return Style;

            Style += me._getNonTextStyle(RS, CurrObj, TypeCodeObj);
            Style += me._getTextStyle(CurrObj, TypeCodeObj);

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
            var me = this;
            return "url(" + me._getImageURL(RS, ImageName) + ")";
        },
        _getNonTextStyle: function (RS, CurrObj, TypeCodeObj) {
            var me = this;
            var Style = "";

            if (!CurrObj)
                return Style;

            if (CurrObj.BackgroundColor)
                Style += "background-color:" + CurrObj.BackgroundColor + ";";
            if (CurrObj.BackgroundImage)
                Style += "background-image:" + me._getImageStyleURL(RS, CurrObj.BackgroundImage.ImageName) + ";";
            if (CurrObj.BackgroundRepeat !== undefined && me._backgroundRepeatTypesMap()[CurrObj.BackgroundRepeat])
                Style += "background-repeat:" + me._backgroundRepeatTypesMap()[CurrObj.BackgroundRepeat] + ";";

            return Style;
        },
        _getTextDirection: function (CurrObj) {
            var Dirclass = "";
            var me = this;

            if (me._getSharedElements(CurrObj.SharedElements).Style && me._getSharedElements(CurrObj.SharedElements).Style.WritingMode !== undefined) {
                if (me._getSharedElements(CurrObj.SharedElements).Style.WritingMode === 1)
                    Dirclass = "fr-rotate-90";
                if (me._getSharedElements(CurrObj.SharedElements).Style.WritingMode === 2)
                    Dirclass = "fr-rotate-270";
            }
            if (CurrObj.NonSharedElements.Style && CurrObj.NonSharedElements.Style.WritingMode !== undefined) {
                if (CurrObj.NonSharedElements.Style.WritingMode === 1)
                    Dirclass = "fr-rotate-90";
                if (CurrObj.NonSharedElements.Style.WritingMode === 2)
                    Dirclass = "fr-rotate-270";
            }

            if (Dirclass !== "" && forerunner.device.isMSIE8())
                Dirclass += "-IE8";

            return Dirclass;


        },
        _getTextStyle: function (CurrObj, TypeCodeObj) {
            var me = this;
            var Style = "";

            if (!CurrObj)
                return Style;

            if (CurrObj.PaddingBottom !== undefined)
                Style += "padding-bottom:" + CurrObj.PaddingBottom + ";";
            if (CurrObj.PaddingLeft !== undefined)
                Style += "padding-left:" + CurrObj.PaddingLeft + ";";
            if (CurrObj.PaddingRight !== undefined)
                Style += "padding-right:" + CurrObj.PaddingRight + ";";
            if (CurrObj.PaddingTop !== undefined)
                Style += "padding-top:" + CurrObj.PaddingTop + ";";
            if (CurrObj.UnicodeBiDi !== undefined)
                Style += "unicode-bidi:" + me._getBiDi(CurrObj.UnicodeBiDi) + ";";
            if (CurrObj.VerticalAlign !== undefined)
                Style += "vertical-align:" + me._getVAligh(CurrObj.VerticalAlign) + ";";
            //if (CurrObj.WritingMode !== undefined)
            //    Style += "layout-flow:" + me._getLayoutFlow(CurrObj.WritingMode) + ";";
            if (CurrObj.Direction !== undefined)
                Style += "Direction:" + me._getDirection(CurrObj.Direction) + ";";

            if (CurrObj.TextAlign !== undefined)
                Style += "text-align:" + me._getTextAlign(CurrObj.TextAlign, TypeCodeObj) + ";";
            if (CurrObj.FontStyle !== undefined)
                Style += "font-style:" + me._getFontStyle(CurrObj.FontStyle) + ";";
            if (CurrObj.FontWeight !== undefined)
                Style += "font-weight:" + me._getFontWeight(CurrObj.FontWeight) + ";";
            if (CurrObj.FontFamily !== undefined)
                Style += "font-family:\"" + CurrObj.FontFamily + "\";";
            if (CurrObj.FontSize !== undefined)
                Style += "font-size:" + me._getFontSize(CurrObj.FontSize) + ";";
            if (CurrObj.TextDecoration !== undefined)
                Style += "text-decoration:" + me._getTextDecoration(CurrObj.TextDecoration) + ";";
            if (CurrObj.Color !== undefined)
                Style += "color:" + CurrObj.Color + ";";
            //   if (CurrObj.Calendar !== undefined)
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
                    if (TypeCodeObj === undefined || TypeCodeObj.TypeCode === undefined)
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
            var $newObj = $("<Table/>");

            $newObj.attr("CELLSPACING", 0);
            $newObj.attr("CELLPADDING", 0);
            return $newObj;
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

            if (CurrObj.Measurement)
                retval = CurrObj.Measurement.Measurements[Index];
            return retval;
        },
        _getSharedElements: function (sharedElements) {
            var me = this;

            if (sharedElements.SID) {
                return me.reportObj.ReportContainer.SharedElements[sharedElements.SID];
            }
            else
                return sharedElements;

        },
        _convertToMM: function (convertFrom) {

            if (!convertFrom)
                return 0;

            var unit = convertFrom.match(/\D+$/);  // get the existing unit
            var value = convertFrom.match(/\d+/);  // get the numeric component

            if (unit && unit.length === 1)
                unit = unit[0];
            else
                unit = "px";

            if (value.length === 1) value = value[0];

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

        _getFontSize: function (fontSize) {
            if (!fontSize)
                return "";

            //Not needed anymore with fixed table,  leaving in just in case.
            //if (!forerunner.device.isMSIE())
            return fontSize;


            // var unit = fontSize.match(/\D+$/);  // get the existing unit
            // var value = fontSize.match(/\d+/);  // get the numeric component

            // if (unit.length === 1) unit = unit[0];
            // if (value.length === 1) value = value[0];

            ////This is an error
            // return (value*0.98) + unit ;
        },
        _getListStyle: function (Style, Level) {
            var ListStyle;
            //Numbered
            if (Style === 1) {
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
            else if (Style === 2) {
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
            return "fr-render-list-" + ListStyle;
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
            if ((domElement.naturalWidth) && (domElement.naturalHeight)) {
                return { width: domElement.naturalWidth, height: domElement.naturalHeight };
            }
            else {
                var img = new Image();
                img.src = domElement.src;
                return { width: img.width, height: img.height };
            }
        },
        _isNull: function (val) {
            if (val === null || val === undefined)
                return true;
            else
                return false;
        },
        _getWidth: function (val) {
            // might be usfull for text sizing issues between browsers
            return val;
        },
        _getNewLineFormatText: function (Value) {
            return Value.replace(/\r\n+/g, "\n");
        },
        _createStyles: function (RS) {
            var me = this;
            var CSS = "<style type='text/css' id='" + me.options.reportViewer.viewerID + "'>";
            var styles = me.reportObj.ReportContainer.SharedElements;

            for (var key in styles) {
                //CSS += ".fr-border-" + styles[key].SID + "-" + me.reportObj.SessionID  + "{" + me._getFullBorderStyle(styles[key].Style) + "} ";
                //CSS += ".fr-text-" + styles[key].SID + "-" + me.reportObj.SessionID + "{" + me._getTextStyle(styles[key].Style) + "} ";
                //CSS += ".fr-nonText-" + styles[key].SID + "-" + me.reportObj.SessionID + "{" + me._getNonTextStyle(RS, styles[key].Style) + "} ";
                CSS += ".fr-b-" + styles[key].SID + "-" + me.options.reportViewer.viewerID + "{" + me._getFullBorderStyle(styles[key].Style) + "} ";
                CSS += ".fr-t-" + styles[key].SID + "-" + me.options.reportViewer.viewerID + "{" + me._getTextStyle(styles[key].Style, styles[key]) + "} ";
                CSS += ".fr-n-" + styles[key].SID + "-" + me.options.reportViewer.viewerID + "{" + me._getNonTextStyle(RS, styles[key].Style) + "} ";
            }


            me.Page.CSS = $(CSS + "</style>");
            me.Page.CSS.appendTo("head");

        },
        _getClassName: function (name, obj) {
            var me = this;

            var cName = "";

            if (obj.SubReportProperties)
                obj = obj.SubReportProperties;

            if (obj.Elements && obj.Elements.SharedElements)
                return name + obj.Elements.SharedElements.SID + "-" + me.options.reportViewer.viewerID;
            if (obj.SharedElements)
                return name + obj.SharedElements.SID + "-" + me.options.reportViewer.viewerID;
            return cName;
        },
        _roundToTwo: function (num) {
            return +(Math.round(num + "e+2") + "e-2");
        },
    });  // $.widget
});