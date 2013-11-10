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

    $.widget(widgets.getFullname(widgets.manageParamSets), {
        options: {
            $reportViewer: null,
            $appContainer: null,
            model: null
        },
        _create: function () {

        },
        _initTBody: function() {
            var me = this;
            me.serverData = me.options.model.getServerData();
            if (me.serverData === null || me.serverData === undefined) {
                return;
            }
            var $tbody = me.element.find(".fr-mps-main-table-body-id");
            $tbody.html("");
            var allUsersTdClass = "";
            if (me.serverData.canEditAllUsersSet) {
                allUsersTdClass = " class='fr-core-cursorpointer'";
            }
            $.each(me.serverData.parameterSets, function (index, parameterSet) {
                var textElement = "<input type='text' class='fr-rtb-select-set' value='" + parameterSet.name + "'/>";
                var allUsersClass = "";
                if (parameterSet.isAllUser) {
                    textElement = parameterSet.name;
                    allUsersClass = "ui-icon-check ui-icon ";
                }
                var defaultClass = "";
                if (parameterSet.isDefault) {
                    defaultClass = "ui-icon-check ui-icon ";
                }
                var rowClass = (index + 1) & 1 ? "class='fr-mps-odd-row'" : "";
                var $row = $(
                    "<tr " + rowClass + ">" +
                        // Name
                        "<td title='" + parameterSet.name + "'>" + textElement + "</td>" +
                        // Default
                        "<td class='fr-core-cursorpointer'><div class='" + defaultClass + "fr-core-center' /></td>" +
                        // All Users
                        "<td" + allUsersTdClass + "><div class='" + allUsersClass + "fr-core-center' /></td>" +
                        // Delete
                        "<td class='ui-state-error-text fr-core-cursorpointer'><div class='ui-icon-circle-close ui-icon fr-core-center' /></td>" +
                    "</tr>");
                $tbody.append($row);
            });
        },
        _init: function () {
            var me = this;
            var manageParamSets = forerunner.localize.getLocData(forerunner.config.forerunnerFolder() + "/ReportViewer/loc/ReportViewer").manageParamSets;

            me.element.html("");
            var $dialog = $(
                "<div class='fr-core-dialog-innerPage fr-mps-innerPage fr-core-center'>" +
                    "<div class='fr-mps-header fr-core-dialog-header'>" +
                        "<div class='fr-mps-icon-container'>" +
                            "<div class='fr-mps-icon-inner'>" +
                                "<div class='fr-icons24x24 fr-icons24x24-parameterSets fr-mps-align-middle'></div>" +
                            "</div>" +
                        "</div>" +
                        "<div class='fr-mps-title-container'>" +
                            "<div class='fr-mps-title'>" +
                                manageParamSets.manageSets +
                            "</div>" +
                        "</div>" +
                        "<div class='fr-mps-cancel-container'>" +
                            "<input type='button' class='fr-mps-cancel' value='" + manageParamSets.cancel + "'/>" +
                        "</div>" +
                    "</div>" +
                    "<form class='fr-mps-form'>" +
                        "<div class='fr-core-center'>" +
                            "<input name='add' type='button' value='" + manageParamSets.add + "' title='" + manageParamSets.addNewSet + "' class='fr-mps-add-id fr-mps-action-button fr-core-dialog-button'/>" +
                            "<table class='fr-mps-main-table'>" +
                                "<thead>" +
                                    "<tr>" +
                                    "<th class='fr-rtb-select-set'>" + manageParamSets.name + "</th><th class='fr-mps-property-header'>" + manageParamSets.default + "</th><th class='fr-mps-property-header'>" + manageParamSets.allUsers + "</th><th class='fr-mps-property-header'>" + manageParamSets.delete + "</th>" +
                                    "</tr>" +
                                "</thead>" +
                                "<tbody class='fr-mps-main-table-body-id'></tbody>" +
                            "</table>" +
                            "<div class='fr-core-dialog-submit-container'>" +
                                "<div class='fr-core-center'>" +
                                    "<input name='submit' type='button' class='fr-mps-submit-id fr-core-dialog-submit fr-core-dialog-button' value='" + manageParamSets.apply + "' />" +
                                "</div>" +
                            "</div>" +
                        "</div>" +
                    "</form>" +
                "</div>");

            me.element.append($dialog);
            me._initTBody();

            /*
            me.element.find(".fr-print-text").each(function () {
                $(this).attr("required", "true").attr("number", "true");
                $(this).parent().addClass("fr-print-item").append($("<span class='fr-print-error-span'/>").clone());
            });
            me._resetValidateMessage();
            me._validateForm(me.element.find(".fr-print-form"));
            */

            me.element.find(".fr-mps-cancel").on("click", function (e) {
                me.closeDialog();
            });

            /*
            me.element.find(".fr-print-submit-id").on("click", function (e) {
                var printPropertyList = me._generatePrintProperty();
                if (printPropertyList !== null) {
                    me.options.$reportViewer.reportViewer("printReport", printPropertyList);
                    me.closeDialog();
                }
            });
            */
        },
        /**
         * @function $.forerunner.userSettings#openDialog
         */
        openDialog: function () {
            var me = this;
            me._initTBody();
            forerunner.dialog.showModalDialog(me.options.$appContainer, function () {
                me.element.css("display", "inline-block");
            });
        },
        /**
         * @function $.forerunner.userSettings#openDialog
         */
        closeDialog: function () {
            var me = this;
            forerunner.dialog.closeModalDialog(me.options.$appContainer, function () {
                me.element.css("display", "");
            });
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
        _resetValidateMessage: function () {
            var me = this;
            var error = me.locData.validateError;

            jQuery.extend(jQuery.validator.messages, {
                required: error.required,
                number: error.number,
                digits: error.digits
            });
        },
    }); //$.widget
});