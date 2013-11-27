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
    var locData = forerunner.localize.getLocData(forerunner.config.forerunnerFolder() + "/ReportViewer/loc/ReportViewer");
    var manageParamSets = locData.manageParamSets;

    $.widget(widgets.getFullname(widgets.manageParamSets), {
        options: {
            $reportViewer: null,
            $appContainer: null,
            model: null
        },
        _initTBody: function() {
            var me = this;
            me.serverData = me.options.model.parameterModel("cloneServerData");
            if (me.serverData === null || me.serverData === undefined) {
                return;
            }

            // Create the rows from the server data
            me._createRows();
        },
        _createRows: function() {
            var me = this;

            // Remove any previous event handlers
            me.element.find(".fr-mps-text-input").off("change");
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
            me.element.find(".fr-mps-text-input").on("change", function (e) {
                me._onChangeInput(e);
            });
            me.element.find(".fr-mps-default-id").on("click", function (e) {
                me._onClickDefault(e);
            });

            // Set up the form validation
            me._validateForm(me.$form);
        },
        _createRow: function(index, parameterSet) {
            var me = this;

            var allUsersTdClass = "";
            if (me.serverData.canEditAllUsersSet) {
                allUsersTdClass = " fr-core-cursorpointer";
            }

            var textElement = "<input type='text' required='true' name=name" + index + " class='fr-mps-text-input' value='" + parameterSet.name + "'/><span class='fr-mps-error-span'/>";
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
            var headerHtml = forerunner.dialog.getModalDialogHeaderHtml('fr-icons24x24-parameterSets', manageParamSets.manageSets, "fr-mps-cancel", manageParamSets.cancel);
            var $dialog = $(
                "<div class='fr-core-dialog-innerPage fr-core-center'>" +
                    headerHtml +
                    "<form class='fr-mps-form fr-core-dialog-form'>" +
                        "<div class='fr-core-center'>" +
                            "<input name='add' type='button' value='" + manageParamSets.add + "' title='" + manageParamSets.addNewSet + "' class='fr-mps-add-id fr-mps-action-button fr-core-dialog-button'/>" +
                            "<table class='fr-mps-main-table'>" +
                                "<thead>" +
                                    "<tr>" +
                                    "<th class='fr-mps-name-header'>" + manageParamSets.name + "</th><th class='fr-mps-property-header'>" + manageParamSets.defaultHeader + "</th><th class='fr-mps-property-header'>" + manageParamSets.allUsers + "</th><th class='fr-mps-property-header'>" + manageParamSets.deleteHeader + "</th>" +
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

            me.$form = me.element.find(".fr-mps-form");

            me._resetValidateMessage();

            me.element.find(".fr-mps-cancel").on("click", function(e) {
                me.closeDialog();
            });

            me.element.find(".fr-mps-add-id").on("click", function(e) {
                me._onAdd(e);
            });

            me.element.find(".fr-mps-submit-id").on("click", function (e) {
                if (me.$form.valid() === true) {
                    me.options.model.parameterModel("applyServerData", me.serverData);
                    me.closeDialog();
                }
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
            var newSet = me.options.model.parameterModel("getNewSet", manageParamSets.newSet, me.parameterList);
            me.serverData.parameterSets.push(newSet);
            me._createRows();
            var $tr = me._findRow(newSet.id);
            var $input = $tr.find("input");
            $input.focus();
        },
        _onChangeInput: function(e) {
            var me = this;
            var $input = $(e.target);
            $input.attr("title", $input.val());
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
        openDialog: function (parameterList) {
            var me = this;
            if (parameterList) {
                me.parameterList = JSON.parse(parameterList);
                me._initTBody();
                forerunner.dialog.showModalDialog(me.options.$appContainer, me);
            }
        },
        /**
         * @function $.forerunner.userSettings#openDialog
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
                debug: true,
                errorPlacement: function (error, element) {
                    error.appendTo($(element).parent().find("span"));
                },
                highlight: function (element) {
                    $(element).parent().find("span").addClass("fr-mps-error-position");
                    $(element).addClass("fr-mps-error");
                },
                unhighlight: function (element) {
                    $(element).parent().find("span").removeClass("fr-mps-error-position");
                    $(element).removeClass("fr-mps-error");
                }
            });
        },
        _resetValidateMessage: function () {
            var me = this;
            var error = locData.validateError;

            jQuery.extend(jQuery.validator.messages, {
                required: error.required,
                number: error.number,
                digits: error.digits
            });
        },
    }); //$.widget
});