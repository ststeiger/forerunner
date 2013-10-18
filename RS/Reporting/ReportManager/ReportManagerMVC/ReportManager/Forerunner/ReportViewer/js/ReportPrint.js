/**
 * @file Contains the print widget.
 *
 */

// Assign or create the single globally scoped variable
var forerunner = forerunner || {};

// Forerunner SQL Server Reports
forerunner.ssr = forerunner.ssr || {};

$(function () {
    var widgets = forerunner.ssr.constants.widgets;
    var events = forerunner.ssr.constants.events;

    $.widget(widgets.getFullname(widgets.reportPrint), {
        options: {
            $reportViewer: null,
        },
        _create: function () {
            
        },
        _init: function () {
            var me = this;
            this._printOpen = false;
        },
        _printOpen: false,
        /**
       * @function $.forerunner.reportPrint#setPrint
       * @Generate print pane html code and append to the dom tree
       * @param {String} pageLayout - default loaded page layout data from RPL
       */
        setPrint: function (pageLayout) {
            var me = this;
            var locData = me.options.$reportViewer.locData.print;
            var unit = locData.unit;

            me.element.html("");

            var $printForm = new $(
            "<div class='fr-print-page'>" +
                // Header
                "<div class='fr-print-innerPage fr-print-layout fr-core-dialog-layout'>" +
                    "<div class='fr-print-header fr-core-dialog-header'>" +
                        "<div class='fr-print-print-icon-container'>" +
                            "<div class='fr-icons24x24 fr-icons24x24-printreport fr-print-align-middle'>" +
                            "</div>" +
                        "</div>" +
                        "<div class='fr-print-title-container'>" +
                            "<div class='fr-print-title'>" +
                                locData.title +
                            "</div>" +
                        "</div>" +
                        "<div class='fr-print-cancel-container'>" +
                            "<input type='button' class='fr-print-cancel' value='" + locData.cancel + "'/>" +
                        "</div>" +
                    "</div>" +
                    // form
                    "<form class='fr-print-form'>" +
                        "<div class='fr-print-options-label'>" +
                            "<div>" +
                                locData.pageLayoutOptions +
                            "</div>" +
                        "</div>" +
                        // Height / Width
                        "<div class='fr-print-settings-pair-container'>" +
                            "<div class='fr-print-setting'>" +
                                "<label class='fr-print-label'>" + locData.pageHeight + "</label>" +
                                "<input class='fr-print-text'  name='PageHeight' type='text' value='" + me._unitConvert(pageLayout.PageHeight) + "'/>" +
                                "<label class='fr-print-unit-label'>" + unit + "</label>" +
                            "</div>" +
                            "<div class='fr-print-setting'>" +
                                "<label class='fr-print-label'>" + locData.pageWidth + "</label>" +
                                "<input class='fr-print-text'  name='PageWidth' type='text' value='" + me._unitConvert(pageLayout.PageWidth) + "'/>" +
                                "<label class='fr-print-unit-label'>" + unit + "</label>" +
                            "</div>" +
                        "</div>" +
                        // Orientation
                        "<div class='fr-print-orientation-container'>" +
                            "<div class='fr-print-portrait'></div>" +
                            "<div class='fr-print-landscape'></div>" +
                        "</div>" +
                        "<div class='fr-print-margins-label'>" +
                            locData.margin +
                        "</div>" +
                        // Top / Bottom
                        "<div class='fr-print-settings-pair-container'>" +
                            "<div class='fr-print-setting'>" +
                                "<label class='fr-print-label'>" + locData.marginTop + "</label>" +
                                "<input class='fr-print-text'  name='MarginTop' type='text' value='" + me._unitConvert(pageLayout.MarginTop) + "'/>" +
                                "<label class='fr-print-unit-label'>" + unit + "</label>" +
                            "</div>" +
                            "<div class='fr-print-setting'>" +
                                "<label class='fr-print-label'>" + locData.marginBottom + "</label>" +
                                "<input class='fr-print-text'  name='MarginBottom' type='text' value='" + me._unitConvert(pageLayout.MarginBottom) + "'/>" +
                                "<label class='fr-print-unit-label'>" + unit + "</label>" +
                            "</div>" +
                        "</div>" +
                        // Left / Right
                        "<div class='fr-print-settings-pair-container'>" +
                            "<div class='fr-print-setting'>" +
                                "<label class='fr-print-label'>" + locData.marginLeft + "</label>" +
                                "<input class='fr-print-text'  name='MarginLeft' type='text' value='" + me._unitConvert(pageLayout.MarginLeft) + "'/>" +
                                "<label class='fr-print-unit-label'>" + unit + "</label>" +
                            "</div>" +
                            "<div class='fr-print-setting'>" +
                                "<label class='fr-print-label'>" + locData.marginRight + "</label>" +
                                "<input class='fr-print-text'  name='MarginRight' type='text' value='" + me._unitConvert(pageLayout.MarginRight) + "'/>" +
                                "<label class='fr-print-unit-label'>" + unit + "</label>" +
                            "</div>" +
                            "</div>" +
                                "<div class='fr-print-submit-container'>" +
                                    "<div class='fr-print-submit-inner'>" +
                                    "<input name='submit' type='button' class='fr-print-submit fr-core-dialog-button' value='" + locData.print + "'/>" +
                            "</div>" +
                        "</div>" +
                    "</form>" +
                "</div>" +
            "</div>");

            //var $maskDiv = $("<div class='fr-print-mask'></div>").css({ width: me.element.width(), height: me.element.height() });

            me.element.append($printForm);

            me.element.find(".fr-print-text").each(function () {
                $(this).attr("required", "true").attr("number", "true");
                $(this).parent().addClass("fr-print-item").append($("<span class='fr-print-error-span'/>").clone());
            });

            me._resetValidateMessage();
            me._validateForm(me.element.find(".fr-print-form"));

            me.element.find(".fr-print-submit").on("click", function (e) {
                var printPropertyList = me._generatePrintProperty();
                if (printPropertyList !== null) {
                    me.options.$reportViewer.printReport(printPropertyList);
                    me.options.$reportViewer.showPrint();
                }
            });

            me.element.find(".fr-print-cancel").on("click", function (e) {
                me.options.$reportViewer.showPrint();
            });

            me.$pageWidth = me.element.find("[name=PageWidth]");
            me.$pageHeight = me.element.find("[name=PageHeight]");

            me.$pageWidth.on("change", function (e) {
                me._setOrientationIconState.call(me);
            });

            me.$pageHeight.on("change", function (e) {
                me._setOrientationIconState.call(me);
            });

            me.$printPortrait = me.element.find(".fr-print-portrait");
            me.$printLandscape = me.element.find(".fr-print-landscape");

            me.$printPortrait.on("click", function (e) {
                if (!me._isPortrait()) {
                    me._swapWidthHeight();
                }
            });

            me.$printLandscape.on("click", function (e) {
                if (me._isPortrait()) {
                    me._swapWidthHeight();
                }
            });

            me._setOrientationIconState();
        },
        _isPortrait: function () {
            var me = this;
            if (Number(me.$pageWidth.val()) > Number(me.$pageHeight.val())) {
                return false;
            }
            return true;
        },
        _swapWidthHeight: function () {
            var me = this;

            var width = me.$pageWidth.val();
            me.$pageWidth.val(me.$pageHeight.val());
            me.$pageHeight.val(width);

            me._setOrientationIconState();
        },
        _setOrientationIconState: function () {
            var me = this;

            if (Number(me.$pageWidth.val()) > Number(me.$pageHeight.val())) {
                // Landscape
                me.$printLandscape.removeClass("fr-core-cursorpointer");
                me.$printLandscape.removeClass("fr-print-landscape-icon");
                me.$printLandscape.addClass("fr-print-landscape-icon-active");
                
                me.$printPortrait.removeClass("fr-print-portrait-icon-active");
                me.$printPortrait.addClass("fr-core-cursorpointer");
                me.$printPortrait.addClass("fr-print-portrait-icon");
            }
            else {
                // Portrait
                me.$printLandscape.addClass("fr-core-cursorpointer");
                me.$printLandscape.removeClass("fr-print-landscape-icon-active");
                me.$printLandscape.addClass("fr-print-landscape-icon");

                me.$printPortrait.removeClass("fr-print-portrait-icon");
                me.$printPortrait.removeClass("fr-core-cursorpointer");
                me.$printPortrait.addClass("fr-print-portrait-icon-active");
            }
        },
        /**
       * @function $.forerunner.reportPrint#togglePrintPane
       * @Open or close print pane.
       */
        togglePrintPane: function () {
            var me = this;

            //To open print pane
            if (!me._printOpen) {
                forerunner.dialog.showModalDialog(me.element, function () {
                    me.element.show();
                });
                me._printOpen = true;
            }
                //To close print pane
            else {
                forerunner.dialog.closeModalDialog(me.element, function () {
                    me.element.hide();
                });
                me._printOpen = false;
            }
        },
        /**
       * @function $.forerunner.reportDocumentMap#closePrintPane
       * @close print pane, happened when page switch.
       */
        closePrintPane: function () {
            var me = this;
            if (me._printOpen === true) {
                me.togglePrintPane();
            }
        },
        _validateForm: function (form) {
            form.validate({
                errorPlacement: function (error, element) {
                    error.appendTo($(element).parent().find("span"));
                },
                highlight: function (element) {
                    $(element).parent().find("span").addClass("fr-print-error-position");
                    $(element).addClass("fr-print-error");
                },
                unhighlight: function (element) {
                    $(element).parent().find("span").removeClass("fr-print-error-position");
                    $(element).removeClass("fr-print-error");
                }
            });
        },
        _generatePrintProperty: function () {
            var me = this;
            var a = [];
            if (me.element.find(".fr-print-form").valid() === true) {

                me.element.find(".fr-print-text").each(function () {
                    a.push({ key: this.name, value: me._generateUnitConvert(this.value) });
                });

                var printObject = { "PrintPropertyList": a };
                return JSON.stringify(printObject);
            }
            else {
                return null;
            }
        },
        _resetValidateMessage: function () {
            var me = this;
            var error = me.options.$reportViewer.locData.validateError;

            jQuery.extend(jQuery.validator.messages, {
                required: error.required,
                number: error.number,
                digits: error.digits
            });
        },
        //milimeter is the unit of the RPL, inch is the format unit for PDF
        _unitConvert: function (milimeter) {
            var me = this;
            //if inch is the country's culture unit then convert milimeter to inch
            if (me.options.$reportViewer.locData.print.unit === "in") {
                return Math.round(milimeter / 25.4 * 100) / 100;
            }
            else {
                return milimeter;
            }
        },
        //if inch is the country's culture unit then the source should be inch, otherwise it should be mm (RPL Default).
        _generateUnitConvert: function (source) {
            var me = this;
            if (me.options.$reportViewer.locData.print.unit === "mm") {
                return Math.round(source / 25.4 * 100) / 100;
            }
            else {
                return source;
            }
        },
    }); //$.widget
});