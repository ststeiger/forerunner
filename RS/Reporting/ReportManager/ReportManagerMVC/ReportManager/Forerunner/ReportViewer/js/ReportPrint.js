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

            var $printForm = new $("<div class='fr-print-page'><div class='fr-print-innerPage fr-print-layout'><div class='fr-print-title'>" +
               locData.title + "</div><form class='fr-print-form'>" +
               "<fidleset><div><label class='fr-print-label'>" + locData.pageHeight+":</label>" +
               "<input class='fr-print-text' name='PageHeight' type='text' value=" + me._unitConvert(pageLayout.PageHeight) + " />" +
                "<label class='fr-print-unit-label'>" + unit + "</label></div>" +

               "<div><label class='fr-print-label'>" + locData.pageWidth + ":</label>" +
               "<input class='fr-print-text' name='PageWidth' type='text' value=" + me._unitConvert(pageLayout.PageWidth) + " />" +
               "<label class='fr-print-unit-label'>" + unit + "</label></div>" +

                "<div><label class='fr-print-label'>" + locData.marginTop + ":</label>" +
                "<input class='fr-print-text' name='MarginTop' type='text' value=" + me._unitConvert(pageLayout.MarginTop) + " />" +
                "<label class='fr-print-unit-label'>" + unit + "</label></div>" +

                "<div><label class='fr-print-label'>" + locData.marginBottom + ":</label>" +
                "<input class='fr-print-text' name='MarginBottom' type='text' value=" + me._unitConvert(pageLayout.MarginBottom) + " />" +
                "<label class='fr-print-unit-label'>" + unit + "</label></div>" +

                "<div><label class='fr-print-label'>" + locData.marginLeft + ":</label>" +
               "<input class='fr-print-text' name='MarginLeft' type='text' value=" + me._unitConvert(pageLayout.MarginLeft) + " />" +
                "<label class='fr-print-unit-label'>" + unit + "</label></div>" +

                "<div><label class='fr-print-label'>" + locData.marginRight + ":</label>" +
               "<input class='fr-print-text' name='MarginRight' type='text' value=" + me._unitConvert(pageLayout.MarginRight) + " />" +
                "<label class='fr-print-unit-label'>" + unit + "</label></div>" +

                "<div class='fr-print-button-group'><input class='fr-print-button fr-print-cancel fr-rounded' name='Cancel' type='button' value='" + locData.cancel + "' />" +
               "<input class='fr-print-button fr-print-submit fr-rounded' name='submit' type='button' value='" + locData.print + "' /></div>" +
               "</fidleset></form></div></div>");

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
                    me.options.$reportViewer.printReport(me._generatePrintProperty());
                    me.options.$reportViewer.showPrint();
                }
            });

            me.element.find(".fr-print-cancel").on("click", function (e) {
                me.options.$reportViewer.showPrint();
            });
        },
        /**
       * @function $.forerunner.reportPrint#togglePrintPane
       * @Open or close print pane.
       */
        togglePrintPane: function () {
            var me = this;

            //To open print pane
            if (!me._printOpen) {
                //forerunner.dialog.insertMaskLayer(function () {
                //    me.element.show();
                //});
                me.element.mask().show();
                me._printOpen = true;
                me._trigger(events.showPrint);
            }
                //To close print pane
            else {
                //forerunner.dialog.removeMaskLayer(function () {
                //    me.element.hide();
                //});
                me.element.unmask().hide();
                me._printOpen = false;
                me._trigger(events.hidePrint);
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

                var tempJson = "[";
                for (var i = 0; i < a.length; i++) {
                    if (i !== a.length - 1) {
                        tempJson += "{\"key\":\"" + a[i].key + "\",\"value\":\"" + a[i].value + "\"},";
                    }
                    else {
                        tempJson += "{\"key\":\"" + a[i].key + "\",\"value\":\"" + a[i].value + "\"}";
                    }
                }
                tempJson += "]";
                return "{\"PrintPropertyList\":" + tempJson + "}";
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