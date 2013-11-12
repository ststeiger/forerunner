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
    var manageParamSets = forerunner.localize.getLocData(forerunner.config.forerunnerFolder() + "/ReportViewer/loc/ReportViewer").manageParamSets;

    $.widget(widgets.getFullname(widgets.manageParamSets), {
        options: {
            $reportViewer: null,
            $appContainer: null,
            model: null
        },
        _initTBody: function() {
            var me = this;
            me.serverData = me.options.model.cloneServerData();
            if (me.serverData === null || me.serverData === undefined) {
                return;
            }

            // Create the rows from the server data
            me._createRows();
        },
        _createRows: function() {
            var me = this;

            // Remove any previous event handlers
            me.element.find(".fr-mps-input-id").off("change");
            me.element.find(".fr-mps-default-id").off("click");
            me.element.find(".fr-mps-all-users-id").off("click");
            me.element.find(".fr-mps-delete-id").off("click");

            me.$tbody.html("");
            $.each(me.serverData.parameterSets, function (index, parameterSet) {
                var $row = me._createRow(index, parameterSet);
                me.$tbody.append($row);

                if (me.serverData.canEditAllUsersSet) {
                    $row.find(".fr-mps-all-users-id").on("click", function (e) {
                        me._onClickAllUsers(e);
                    });
                }
                if (me.serverData.canEditAllUsersSet || !parameterSet.isAllUser) {
                    $row.find(".fr-mps-delete-id").on("click", function (e) {
                        me._onClickDelete(e);
                    });
                }
            });

            // Add any table body specific event handlers
            me.element.find(".fr-mps-input-id").on("change", function (e) {
                me._onChangeInput(e);
            });
            me.element.find(".fr-mps-default-id").on("click", function (e) {
                me._onClickDefault(e);
            });
        },
        _createRow: function(index, parameterSet) {
            var me = this;

            var allUsersTdClass = "";
            if (me.serverData.canEditAllUsersSet) {
                allUsersTdClass = " fr-core-cursorpointer";
            }

            var textElement = "<input type='text' class='fr-mps-input-id fr-rtb-select-set' value='" + parameterSet.name + "'/>";
            var allUsersClass = "fr-mps-all-users-check-id ";
            var deleteClass = " class='ui-icon-circle-close ui-icon fr-core-center'";
            if (parameterSet.isAllUser) {
                if (!me.serverData.canEditAllUsersSet) {
                    textElement = parameterSet.name;
                    deleteClass = "";
                }
                allUsersClass = "fr-mps-all-users-check-id ui-icon-check ui-icon ";
            }

            var defaultClass = "fr-mps-default-check-id ";
            if (parameterSet.isDefault) {
                defaultClass = "fr-mps-default-check-id ui-icon-check ui-icon ";
            }

            var rowClass = (index + 1) & 1 ? " class='fr-mps-odd-row'" : "";
            var $row = $(
                "<tr" + rowClass + " modelid='" + parameterSet.id + "'>" +
                    // Name
                    "<td title='" + parameterSet.name + "'>" + textElement + "</td>" +
                    // Default
                    "<td class='fr-mps-default-id fr-core-cursorpointer'><div class='" + defaultClass + "fr-core-center' /></td>" +
                    // All Users
                    "<td class='fr-mps-all-users-id" + allUsersTdClass + "'><div class='" + allUsersClass + "fr-core-center' /></td>" +
                    // Delete
                    "<td class='fr-mps-delete-id ui-state-error-text fr-core-cursorpointer'><div" + deleteClass + "/></td>" +
                "</tr>");
            return $row;
        },
        _init: function () {
            var me = this;

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
                                    "<th class='fr-rtb-select-set'>" + manageParamSets.name + "</th><th class='fr-mps-property-header'>" + manageParamSets.defaultHeader + "</th><th class='fr-mps-property-header'>" + manageParamSets.allUsers + "</th><th class='fr-mps-property-header'>" + manageParamSets.delete + "</th>" +
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
            me.$tbody = me.element.find(".fr-mps-main-table-body-id");
            me._initTBody();

            /*
            me.element.find(".fr-print-text").each(function () {
                $(this).attr("required", "true").attr("number", "true");
                $(this).parent().addClass("fr-print-item").append($("<span class='fr-print-error-span'/>").clone());
            });
            me._resetValidateMessage();
            me._validateForm(me.element.find(".fr-print-form"));
            */

            me.element.find(".fr-mps-cancel").on("click", function(e) {
                me.closeDialog();
            });

            me.element.find(".fr-mps-add-id").on("click", function(e) {
                me._onAdd(e);
            });

            me.element.find(".fr-mps-submit-id").on("click", function (e) {
                me.options.model.applyServerData.call(me.options.model, me.serverData);
                me.closeDialog();
            });
        },
        _findId: function (e) {
            var $target = $(e.target);
            var $tr = $target;
            while (!$tr.is("tr") && !$tr.is("table")) {
                $tr = $tr.parent();
            }
            if ($tr.is("tr")) {
                return $tr.attr("modelid");
            }

            return null;
        },
        _findRow: function(id) {
            var me = this;
            return me.$tbody.find("[modelid='" + id + "']");
        },
        _onAdd: function (e) {
            var me = this;
            var newSet = me.options.model.getNewSet(manageParamSets.newSet);
            me.serverData.parameterSets.push(newSet);
            me._createRows();
            var $tr = me._findRow(newSet.id);
            var $input = $tr.find("input");
            $input.focus();
        },
        _onChangeInput: function(e) {
            var me = this;
            var $input = $(e.target);
            var id = me._findId(e);
            $.each(me.serverData.parameterSets, function (index, set) {
                if (set.id === id) {
                    set.name = $input.val();
                }
            });
        },
        _onClickDefault: function(e) {
            var me = this;

            // Update the UI
            me.$tbody.find(".fr-mps-default-id div").removeClass("ui-icon-check ui-icon");
            var $div = $(e.target);
            if (!$div.hasClass("fr-mps-default-check-id")) {
                $div = $div.find(".fr-mps-default-check-id");
            }
            $div.addClass("ui-icon-check ui-icon");

            // Update the paramaterSets
            var id = me._findId(e);
            $.each(me.serverData.parameterSets, function (index, set) {
                if (set.id === id) {
                    set.isDefault = true;
                } else {
                    set.isDefault = false;
                }
            });
        },
        _onClickAllUsers: function(e) {
            var me = this;

            // Update the UI
            var $div = $(e.target);
            if (!$div.hasClass("fr-mps-all-users-check-id")) {
                $div = $div.find(".fr-mps-all-users-check-id");
            }
            $div.toggleClass("ui-icon-check ui-icon");

            // Update the paramaterSets
            var id = me._findId(e);
            $.each(me.serverData.parameterSets, function (index, set) {
                if (set.id === id) {
                    set.isAllUser = !set.isAllUser;
                }
            });
        },
        _onClickDelete: function(e) {
            var me = this;

            if (me.serverData.parameterSets.length <= 1) {
                return;
            }

            // Update the UI
            var id = me._findId(e);
            var $tr = me._findRow(id);
            $tr.remove();

            // Update the paramaterSets
            var id = me._findId(e);
            var setIndex = -1;
            var isDefault = false;
            $.each(me.serverData.parameterSets, function (index, set) {
                if (set.id === id) {
                    setIndex = index;
                    isDefault = set.isDefault;
                }
            });

            if (setIndex !== -1) {
                if (isDefault) {
                    var $first = me.$tbody.find(".fr-mps-default-check-id").first();
                    me._onClickDefault({ target: $first });
                }
                me.serverData.parameterSets.splice(setIndex, 1);
            }
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