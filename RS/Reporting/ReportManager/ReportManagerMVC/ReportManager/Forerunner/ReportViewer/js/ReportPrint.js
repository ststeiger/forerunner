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

    $.widget(widgets.getFullname(widgets.reportPrint), {
        options: {
            $reportViewer: null,
        },
        _create: function () {

        },
        _init: function () {

        },
        _printOpen: false,
        setPrint: function (pageLayout) {
            var me = this;
            me.element.html("");

            var $printForm = new $("<div class='fr-print-page'><div class='fr-print-innerPage'><div class='fr-print-title'>" +
               "Print Page Layout Option:<p class=fr-render-close-print' title='Close'>x</p></div><form class='fr-print-form'>" +
               "<fidleset><div><label class='fr-print-label'>PageHeight (in):</label>" +
               "<input class='fr-print-text' name='PageHeight' type='text' value=" + me._convertMilmeterToInch(pageLayout.PageHeight) + " /></div>" +
               "<div><label class='fr-print-label'>PageWidth (in):</label>" +
               "<input class='fr-print-text' name='PageWidth' type='text' value=" + me._convertMilmeterToInch(pageLayout.PageWidth) + " /></div>" +
               "<div><label class='fr-print-label'>MarginTop (in):</label>" +
               "<input class='fr-print-text' name='MarginTop' type='text' value=" + me._convertMilmeterToInch(pageLayout.MarginTop) + " /></div>" +
               "<div><label class='fr-print-label'>MarginBottom (in):</label>" +
               "<input class='fr-print-text' name='MarginBottom' type='text' value=" + me._convertMilmeterToInch(pageLayout.MarginBottom) + " /></div>" +
               "<div><label class='fr-print-label'>MarginLeft (in):</label>" +
               "<input class='fr-print-text' name='MarginLeft' type='text' value=" + me._convertMilmeterToInch(pageLayout.MarginLeft) + " /></div>" +
               "<div><label class='fr-print-label'>MarginRight (in):</label>" +
               "<input class='fr-print-text' name='MarginRight' type='text' value=" + me._convertMilmeterToInch(pageLayout.MarginRight) + " /></div>" +
               "<div><input class='fr-print-button fr-print-submit fr-rounded' name='submit' type='button' value='Print' />" +
               "<input class='fr-print-button fr-print-cancel fr-rounded' name='Cancel' type='button' value='Cancel' /></div>" +
               "</fidleset></form></div></div>");

            var $maskDiv = $("<div class='fr-print-mask'></div>").css({ width: me.element.width(), height: me.element.height() });

            me.element.append($maskDiv).append($printForm);

            me.element.find(".fr-print-text").each(function () {
                $(this).attr("required", "true").attr("number", "true");
                $(this).parent().addClass('fr-print-item').append($("<span class='fr-print-error-span'/>").clone());
            });

            me._validateForm(me.element.find(".fr-print-form"));

            me.element.find(".fr-print-submit").on("click", function (e) {
                me._resetValidateMessage();
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
        togglePrintPane: function () {
            var me = this;

            var $mask = me.element.find(".fr-print-mask");
            var $printPane = me.element.find(".fr-print-page");

            //To open print pane
            if (!me._printOpen) {
                $mask.show('fast', function () {
                    $(this).fadeTo('fast', 0.5, function () {
                        $("body").eq(0).css("overflow", "hidden");
                        $printPane.show();
                    });
                });

                me._printOpen = true;
            }
            //To close print pane
            else {
                $mask.hide('fast', 0, function () {
                    $("body").eq(0).css("overflow", "auto");
                    $printPane.hide();
                });

                me._printOpen = false;
            }
        },
        _validateForm: function (form) {
            form.validate({
                errorPlacement: function (error, element) {
                    error.appendTo($(element).next("span"));
                },
                highlight: function (element) {
                    $(element).next("span").addClass("fr-print-error-position");
                    $(element).addClass("fr-print-error");
                },
                unhighlight: function (element) {
                    $(element).next("span").removeClass("fr-print-error-position");
                    $(element).removeClass("fr-print-error");
                }
            });
        },
        _generatePrintProperty: function () {
            var me = this;
            var a = [];
            if (me.element.find(".fr-print-form").valid() === true) {

                me.element.find(".fr-print-text").each(function () {
                    a.push({ key: this.name, value: this.value });
                });

                var tempJson = "[";
                for (i = 0; i < a.length; i++) {
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
        _convertMilmeterToInch: function (milimeter) {
            //keep two decimal places
            return Math.round(milimeter / 25.4 *100) / 100;
        },
    }); //$.widget
});