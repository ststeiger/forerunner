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

    $.widget(widgets.getFullname("settingsPairWidget"), {
        options: {
            label1: null,
            name1: null,
            text1: null,
            unit1: null,
            label2: null,
            name2: null,
            text2: null,
            unit2: null,
        },
        _init: function () {
            var me = this;
            var name1 = "";
            if (me.options.name1) {
                name1 = "name='" + me.options.name1 + "'";
            }

            var name2 = "";
            if (me.options.name2) {
                name2 = "name='" + me.options.name2 + "'";
            }

            me.element.html("");
            var $theTable = new $(
            "<table class=fr-print-settings>" +
                "<tr>" +
                    "<td>" +
                        "<label class='fr-print-label'>" + me.options.label1 + "</label>" +
                    "</td>" +
                    "<td>" +
                        "<input class='fr-print-text' " + name1 + " type='text' value='" + me.options.text1 + "'/>" +
                    "</td>" +
                    "<td>" +
                        "<label class='fr-print-unit-label'>" + me.options.unit1 + "</label>" +
                    "</td>" +
                "</tr>" +
                "<tr>" +
                    "<td>" +
                        "<label class='fr-print-label'>" + me.options.label2 + "</label>" +
                    "</td>" +
                    "<td>" +
                        "<input class='fr-print-text' " + name2 + " type='text' value='" + me.options.text2 + "'/>" +
                    "</td>" +
                    "<td>" +
                        "<label class='fr-print-unit-label'>" + me.options.unit2 + "</label>" +
                    "</td>" +
                "</tr>" +
            "</table>");
            me.element.append($theTable);
            me.element.addClass("fr-print-settings-pair-widget");
        },
    }); //$.widget

    $.widget(widgets.getFullname(widgets.reportPrint), {
        options: {
            $reportViewer: null,
            $appContainer: null
        },
        _create: function () {
            
        },
        _init: function () {
            var me = this;
            me.locData = forerunner.localize.getLocData(forerunner.config.forerunnerFolder() + "ReportViewer/loc/ReportViewer");
        },
        /**
         * @function $.forerunner.reportPrint#setPrint
         * @Generate print pane html code and append to the dom tree
         * @param {String} pageLayout - default loaded page layout data from RPL
         */
        setPrint: function (pageLayout) {
            var me = this;
            var print = me.locData.print;
            var unit = print.unit;

            me.element.html("");

            var headerHtml = forerunner.dialog.getModalDialogHeaderHtml('fr-icons24x24-printreport', print.title, "fr-print-cancel", print.cancel);
            var $printForm = new $(
            "<div class='fr-core-dialog-innerPage fr-core-center'>" +
                headerHtml +
                // form
                "<form class='fr-print-form fr-core-dialog-form'>" +
                    // Print layout label
                    "<div class='fr-print-options-label'>" +
                        print.pageLayoutOptions +
                    "</div>" +
                    // Height / Width
                    "<div class=fr-print-height-width-id></div>" +
                    // Orientation
                    "<div class='fr-print-orientation-container'>" +
                        "<div class='fr-print-portrait'></div>" +
                        "<div class='fr-print-landscape'></div>" +
                    "</div>" +
                    // Margins label
                    "<div class='fr-print-margins-label'>" +
                        print.margin +
                    "</div>" +
                    // Top / Bottom
                    "<div class=fr-print-top-bottom-id></div>" +
                     //Left / Right
                    "<div class=fr-print-left-right-id></div>" +
                    // Print button
                    "<div class='fr-core-dialog-submit-container'>" +
                        "<div class='fr-core-center'>" +
                            "<input name='submit' type='button' class='fr-print-submit-id fr-core-dialog-submit fr-core-dialog-button' value='" + print.print + "'/>" +
                        "</div>" +
                    "</div>" +
                "</form>" +
            "</div>");

            
            me.element.append($printForm);

            me.element.find(".fr-print-height-width-id").settingsPairWidget({
                label1: print.pageHeight,
                name1: "PageHeight",
                text1: me._unitConvert(pageLayout.PageHeight),
                unit1: unit,
                label2: print.pageWidth,
                name2: "PageWidth",
                text2: me._unitConvert(pageLayout.PageWidth),
                unit2: unit
            });

            me.element.find(".fr-print-top-bottom-id").settingsPairWidget({
                label1: print.marginTop,
                name1: "MarginTop",
                text1: me._unitConvert(pageLayout.MarginTop),
                unit1: unit,
                label2: print.marginBottom,
                name2: "MarginBottom",
                text2: me._unitConvert(pageLayout.MarginBottom),
                unit2: unit
            });

            me.element.find(".fr-print-left-right-id").settingsPairWidget({
                label1: print.marginLeft,
                name1: "MarginLeft",
                text1: me._unitConvert(pageLayout.MarginLeft),
                unit1: unit,
                label2: print.marginRight,
                name2: "MarginRight",
                text2: me._unitConvert(pageLayout.MarginRight),
                unit2: unit
            });

            me.element.find(".fr-print-text").each(function () {
                $(this).attr("required", "true").attr("number", "true");
                $(this).parent().addClass("fr-print-item").append($("<span class='fr-print-error-span'/>").clone());
            });

            me._resetValidateMessage();
            me._validateForm(me.element.find(".fr-print-form"));

            me.element.find(".fr-print-submit-id").on("click", function (e) {
                var printPropertyList = me._generatePrintProperty();
                if (printPropertyList !== null) {
                    me.options.$reportViewer.reportViewer("printReport", printPropertyList);
                    me.closeDialog();
                }
            });

            me.element.find(".fr-print-cancel").on("click", function (e) {
                me.closeDialog();
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

            $(":text", me.element).each(
                function (index) {
                    var textinput = $(this);
                    textinput.on("blur", function () {
                        me.options.$reportViewer.reportViewer("onInputBlur");
                    });
                    textinput.on("focus", function () {
                        me.options.$reportViewer.reportViewer("onInputFocus");
                    });
                }
            );
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
         * @function $.forerunner.reportPrint#openDialog
         */
        openDialog: function () {
            var me = this;

            forerunner.dialog.showModalDialog(me.options.$appContainer, me);

            //forerunner.dialog.showModalDialog(me.options.$appContainer, function () {
            //    me.element.css("display", "inline-block");
            //});
        },
        /**
         * @function $.forerunner.reportPrint#openDialog
         */
        closeDialog: function () {
            var me = this;
            forerunner.dialog.closeModalDialog(me.options.$appContainer, me);
            //forerunner.dialog.closeModalDialog(me.options.$appContainer, function () {
            //    me.element.css("display", "");
            //});
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
            var error = me.locData.validateError;

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
            if (me.locData.print.unit === "in") {
                return Math.round(milimeter / 25.4 * 100) / 100;
            }
            else {
                return milimeter;
            }
        },
        //if inch is the country's culture unit then the source should be inch, otherwise it should be mm (RPL Default).
        _generateUnitConvert: function (source) {
            var me = this;
            if (me.locData.print.unit === "mm") {
                return Math.round(source / 25.4 * 100) / 100;
            }
            else {
                return source;
            }
        },
    }); //$.widget
});