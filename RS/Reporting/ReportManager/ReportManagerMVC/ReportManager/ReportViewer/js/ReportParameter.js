﻿// Assign or create the single globally scoped variable
var forerunner = forerunner || {};

// Forerunner SQL Server Reports
forerunner.ssr = forerunner.ssr || {};

$(function () {
    var widgets = forerunner.ssr.constants.widgets;

    $.widget(widgets.getFullname(widgets.reportParameter), {
        options: {
            $reportViewer: null,
            pageNum: null,
        },
        _formInit: false,
        _paramCount: 0,
        _defaultValueExist: false,
        _loadedForDefault:true,

        _init: function () {
            var me = this;
            me.element.html(null);
        },
        _destroy: function() {
        },
        _render: function () {
            var me = this;
            me.element.html(null);
            var $params = new $("<div class='fr-param-container'>" +
                "<form name='ParameterForm' onsubmit='return false'>" +
                   "<div class='fr-param-element-border'><input type='text' style='display:none'></div>" +
                   "<div class='fr-param-submit-container'>" +
                      "<input name='Parameter_ViewReport' type='button' class='fr-param-viewreport' value='View Report'/>" +
                   "</div>" +
                "</form></div>");
            me.element.css("display", "block");
            me.element.html($params);

            me._formInit = true;
        },
        writeParameterPanel: function(data, rs, pageNum, loadOnly) {
            var me = this;
            me.options.pageNum = pageNum;
            me._paramCount = parseInt(data.Count,10);
            me._defaultValueExist = data.DefaultValueExist;
            me._loadedForDefault = true;

            me._render();

            var $eleBorder = $(".fr-param-element-border");
            $.each(data.ParametersList, function (index, param) {
                $eleBorder.append(me._writeParamControl(param, new $("<div />")));
            });
            
            me._resetLabelWidth();
            me.resetValidateMessage();
            $("[name='ParameterForm']").validate({
                errorPlacement: function (error, element) {
                    if ($(element).is(":radio"))
                        error.appendTo(element.parent("div").next("span"));
                    else {
                        if ($(element).attr("IsMultiple") === "True")
                            error.appendTo(element.parent("div").next("span"));
                        else
                            error.appendTo(element.next("span"));
                    }
                },
                highlight: function (element) {
                    if ($(element).is(":radio"))
                        $(element).parent("div").addClass("fr-param-error");
                    else
                        $(element).addClass("fr-param-error");
                },
                unhighlight: function (element) {
                    if ($(element).is(":radio"))
                        $(element).parent("div").removeClass("fr-param-error");
                    else
                        $(element).removeClass("fr-param-error");
                }
            });
            $(".fr-param-viewreport").on("click", function () {
                me._submitForm();
            });

            if (me._paramCount === data.DefaultValueCount && me._loadedForDefault)
                me._submitForm();
            else
                me._trigger("render");

            me.options.$reportViewer.reportViewer("removeLoadingIndicator");
        },
        _submitForm: function () {
            var me = this;

            me._closeAllDropdown();
            var paramList = me.getParamsList();
            if (paramList) {
                me.options.$reportViewer.reportViewer("loadPage", me.options.pageNum, false, null, paramList,true);
                me._trigger("submit");
            }
        },
        _writeParamControl: function (param, $parent) {
            var me = this;
            var $lable = new $("<div class='fr-param-label'>" + param.Name + "</div>");
            
            //If the control have valid values, then generate a select control
            var $container = new $("<div class='fr-param-item-container'></div>");
            var $errorMsg = new $("<span class='fr-param-error-placeholder'/>");
            var $element = null;

            if (param.ValidValues !== "") {
                //dropdown with checkbox
                if (param.MultiValue === "True") {
                    $element = me._writeDropDownWithCheckBox(param);
                }
                else {
                    $element = me._writeDropDownControl(param);
                }
            }
            else {
                if (param.Type === "Boolean")
                    $element = me._writeRadioButton(param);
                else
                    $element = me._writeTextArea(param);
            }

            $element.on("keypress", function (e) {
                if (e.keyCode === 13) {
                    me._submitForm();
                } // Enter
            });

            $container.append($element).append(me._addNullableCheckBox(param, $element)).append($errorMsg);
            $parent.append($lable).append($container);

            return $parent;
        },
        _getParameterControlProperty: function (param, $control) {
            $control.attr("AllowBlank", param.AllowBlank);
            if (param.Nullable !== "True") {
                $control.attr("required", "true").watermark("Required");
            }
            $control.attr("ErrorMessage", param.ErrorMessage);
        },
        _addNullableCheckBox: function (param, $control) {
            //var me = this;
            if (param.Nullable === "True") {
                var $nullableSpan = new $("<Span />");

                var $checkbox = new $("<Input type='checkbox' class='fr-param-checkbox' name='" + param.Name + "' />");

                //if (me._hasDefaultValue(param) && param.DefaultValues[0] === "")
                //    $checkbox.attr('checked', 'true');

                $checkbox.on("click", function () {
                    if ($checkbox.attr("checked") === "checked") {
                        $checkbox.removeAttr("checked");
                        if (param.Type === "Boolean")
                            $(".fr-param-radio." + param.Name).removeAttr("disabled");
                        else
                            $control.removeAttr("disabled").removeClass("fr-param-disable").addClass("fr-param-enable");
                    }
                    else {
                        $checkbox.attr("checked", "true");
                        if (param.Type === "Boolean")
                            $(".fr-param-radio." + param.Name).attr("disabled", "true");
                        else
                            $control.attr("disabled", "true").removeClass("fr-param-enable").addClass("fr-param-disable");
                    }
                });

                var $nullableLable = new $("<Label class='fr-param-label-null' />");
                $nullableLable.html("NULL");

                $nullableSpan.append($checkbox).append($nullableLable);
                return $nullableSpan;
            }
            else
                return null;
        },
        _writeRadioButton: function (param) {
            var me = this;
            var radioValues = [];
            radioValues[0] = "True";
            radioValues[1] = "False";

            var $control = new $("<div class='fr-param-checkbox-container' ismultiple='" + param.MultiValue + "' datatype='" + param.Type + "' ></div>");

            for (var i = 0; i < radioValues.length; i++) {
                var $radioItem = new $("<input type='radio' class='fr-param fr-param-radio " + param.Name + "' name='" + param.Name + "' value='" + radioValues[i] +
                    "' id='" + param.Name + "_radio" + "_" + radioValues[i] + "' datatype='" + param.Type + "' />");
                me._getParameterControlProperty(param, $radioItem);

                if (me._hasDefaultValue(param)) {
                    if (param.Nullable === "True")
                        $radioItem.attr("disabled", "true");
                    else if (param.DefaultValues[0] === radioValues[i])
                        $radioItem.attr("checked", "true");
                }

                if (me._paramCount === 1)
                    $radioItem.on("click", function () { me._submitForm(); });

                var $label = new $("<label class='fr-param-radio-label' for='" + param.Name + "_radio" + "_" + radioValues[i] + "'>" + radioValues[i] + "</label>");

                $control.append($radioItem);
                $control.append($label);
            }

            return $control;
        },
        _writeTextArea: function (param) {
            var me = this;
            var $control = new $("<input class='fr-param' type='text' size='30' ismultiple='" + param.MultiValue + "' datatype='" + param.Type + "'  name='" + param.Name + "'/>");
            me._getParameterControlProperty(param, $control);

            switch (param.Type) {
                case "DateTime":
                    $control.attr("readonly", "true");
                    $control.datepicker({
                        dateFormat: "yy-mm-dd", //Format: ISO8601
                        onClose: function () {
                            $("[name='" + param.Name + "']").valid();
                            if (me._paramCount === 1)
                                me._submitForm();
                        },
                    });
                    $control.attr("dateISO","true");

                    if(me._hasDefaultValue(param))
                        $control.datepicker("setDate", me._getDateTimeFromDefault(param.DefaultValues[0]));
                    break;
                case "Integer":
                case "Float":
                    $control.attr("number", "true");
                    if (me._hasDefaultValue(param)) { $control.val(param.DefaultValues[0]); }
                    break;
                case "String":
                    if (me._hasDefaultValue(param)) { $control.val(param.DefaultValues[0]); }
                    //if (param.DefaultValues[0] === "")                        
                    //    $control.attr("disabled", "true").removeClass("fr-param-enable").addClass("fr-param-disable");
                    break;
            }

            return $control;
        },
        _writeDropDownControl: function (param) {
            var me = this;
            var canLoad = false;
            var $control = $("<select class='fr-param fr-param-select' ismultiple='" + param.MultiValue + "' name='" + param.Name + "' datatype='" + param.Type + "' readonly='true'>");
            me._getParameterControlProperty(param, $control);

            var $defaultOption = new $("<option value=''>&#60Select a Value&#62</option>");
            $control.append($defaultOption);

            for (var i = 0; i < param.ValidValues.length;i++) {
                var optionValue = param.ValidValues[i].Value;
                var $option = new $("<option value='" + optionValue + "'>" + param.ValidValues[i].Key + "</option>");
                
                if (me._hasDefaultValue(param) && param.DefaultValues[0] === optionValue) {
                    $option.attr("selected", "true");
                    canLoad = true;
                }

                $control.append($option);
            }
            if (!canLoad) me._loadedForDefault = false;

            if (me._paramCount === 1) {
                $control.on("change", function () { me._submitForm(); });
            }
            
            return $control;
        },
        _writeDropDownWithCheckBox: function(param) {
            var me = this;
            var $control = new $("<div style='display:inline-block;'/>");

            var $multipleCheckBox = new $("<Input type='text' class='fr-param-client' id='" + param.Name + "_fore' name='" + param.Name + "' readonly='true' ismultiple='" + param.MultiValue + "' datatype='" + param.Type + "'/>");
            me._getParameterControlProperty(param, $multipleCheckBox);
            $multipleCheckBox.on("click", function () { me._popupDropDownPanel(param); });

            var $hiddenCheckBox = new $("<Input id='" + param.Name + "_hidden' class='fr-param' type='hidden' name='" + param.Name + "' ismultiple='" + param.MultiValue + "' datatype='" + param.Type + "'/>");

            var $openDropDown = new $("<Img alt='Open DropDown List' src='./reportviewer/Images/OpenDropDown.png' name='" + param.Name + "OpenDropDown' />");
            $openDropDown.on("click", function () { me._popupDropDownPanel(param); });

            var $dropDownContainer = new $("<div class='fr-param-dropdown fr-param-dropdown-hidden' name='" + param.Name + "_DropDownContainer' value='" + param.Name + "' />");

            $(document).on("click", function (e) {
                if ($(e.target).hasClass("ViewReport")) return;

                if (!($(e.target).hasClass("fr-param-dropdown") || $(e.target).hasClass("fr-param-client") || $(e.target).hasClass(param.Name + "_DropDown_CB") || $(e.target).hasClass(param.Name + "_DropDown_lable"))) {
                    if ($(e.target).attr("name") !== param.Name + "OpenDropDown") {
                        me._closeDropDownPanel(param);
                    }
                }
            });

            var $table = me._getDefaultHTMLTable();
            param.ValidValues.push({ Key: "Select All", Value: "Select All" });

            var keys = "";
            var values = "";
            for (var i = 0; i < param.ValidValues.length; i++) {
                var key;
                var value;
                if (i === 0) {
                    var SelectAll = param.ValidValues[param.ValidValues.length - 1];
                    key = SelectAll.Key;
                    value = SelectAll.Value;
                }
                else {
                    key = param.ValidValues[i - 1].Key;
                    value = param.ValidValues[i - 1].Value;
                }

                var $row = new $("<TR />");
                var $col = new $("<TD/>");

                var $span = new $("<Span />");
                var $checkbox = new $("<input type='checkbox' class='" + param.Name + "_DropDown_CB' id='" + param.Name + "_DropDown_" + value + "' value='" + value + "' />");

                if (me._hasDefaultValue(param) && me._contains(param.DefaultValues, value)) {
                    $checkbox.attr("checked", "true");
                    keys += key + ",";
                    values += value + ",";
                }

                $checkbox.on("click", function () {
                    if (this.value === "Select All") {
                        if (this.checked === true) {
                            $("." + param.Name + "_DropDown_CB").each(function () {
                                this.checked = true;
                            });
                        }
                        if (this.value === "Select All" && this.checked === false) {
                            $("." + param.Name + "_DropDown_CB").each(function () {
                                this.checked = false;
                            });
                        }
                    }
                });

                var $label = new $("<label for='" + param.Name + "_DropDown_" + value + "' class='" + param.Name + "_DropDown_lable" + "' name='"
                    + param.Name + "_DropDown_" + value + "_lable" + "'/>");
                $label.html(key);

                $span.append($checkbox).append($label);
                $col.append($span);
                $row.append($col);
                $table.append($row);
            }
            $dropDownContainer.append($table);

            if (me._hasDefaultValue(param)) {
                $multipleCheckBox.val(keys.substr(0, keys.length - 1));
                $hiddenCheckBox.val(values.substr(0, values.length - 1));
            }

            $control.append($multipleCheckBox).append($hiddenCheckBox).append($openDropDown).append($dropDownContainer);

            return $control;
        },
        _setMultipleInputValues: function (param) {
            var showValue = "";
            var hiddenValue = "";
            $("." + param.Name + "_DropDown_CB").each(function () {
                if (this.checked && this.value !== "Select All") {
                    showValue += $("[name='" + param.Name + "_DropDown_" + this.value + "_lable']").html() + ",";
                    hiddenValue += this.value + ",";
                }
            });
            $("#" + param.Name + "_fore").val(showValue.substr(0, showValue.length - 1));
            $("#" + param.Name + "_hidden").val(hiddenValue.substr(0, hiddenValue.length - 1));
        },
        _popupDropDownPanel: function(param) {
            var me = this;
            
            var dropDown = $("[name='" + param.Name + "_DropDownContainer']");
            var multipleControl = $("[name='" + param.Name + "']");
            
            var clientHeight = document.documentElement.clientHeight === 0 ? document.body.clientHeight : document.documentElement.clientHeight;

            if (clientHeight - multipleControl.offset().top < dropDown.height() + 45) {
                dropDown.css("top", multipleControl.offset().top - dropDown.height() - 9);
            }
            else {
                dropDown.css("top", multipleControl.offset().top + 36);
            }

            if (dropDown.hasClass("fr-param-dropdown-hidden")) {
                dropDown.width(multipleControl.width()).fadeOut("fast").removeClass("fr-param-dropdown-hidden").addClass("fr-param-dropdown-show");
            }
            else {
                me._closeDropDownPanel(param);
            }
        },
        _closeDropDownPanel: function (param) {
            var me = this;
            if ($("[name='" + param.Name + "_DropDownContainer']").hasClass("fr-param-dropdown-show")) {
                $("[name='" + param.Name + "_DropDownContainer']").fadeIn("fast", function () {
                    me._setMultipleInputValues(param);
                });
                $("[name='" + param.Name + "_DropDownContainer']").addClass("fr-param-dropdown-hidden").removeClass("fr-param-dropdown-show");
                $("[name='" + param.Name + "']").focus().blur().focus();
            }

        },
        _closeAllDropdown: function () {
            var me = this;
            $(".fr-param-dropdown").each(function (index, param) {
                me._closeDropDownPanel({ Name: $(param).attr("value") });
            });
        },
        getParamsList: function() {
            var me = this;
            var i;
            if ($("[name='ParameterForm']").length !== 0 && $("[name='ParameterForm']").valid() === true) {
                var a = [];
                //Text
                $(".fr-param").filter(":text").each(function () {
                    a.push({ name: this.name, ismultiple: $(this).attr("ismultiple"), type: $(this).attr("datatype"), value: me._isParamNullable(this) });
                });
                //Hidden
                $(".fr-param").filter("[type='hidden']").each(function () {
                    a.push({ name: this.name, ismultiple: $(this).attr("ismultiple"), type: $(this).attr("datatype"), value: me._isParamNullable(this) });
                });
                //dropdown
                $(".fr-param").filter("select").each(function () {
                    a.push({ name: this.name, ismultiple: $(this).attr("ismultiple"), type: $(this).attr("datatype"), value: me._isParamNullable(this) });
                });
                var radioList = {};
                //radio-group by radio name, default value: null
                $(".fr-param").filter(":radio").each(function () {
                    if (!(this.name in radioList)) {
                        radioList[this.name] = null;
                    }
                    if (this.checked === true) {
                        radioList[this.name] = me._isParamNullable(this);
                    }
                });
                for (var radioName in radioList) {
                    a.push({ name: radioName, ismultiple: "", type: "Boolean", value: radioList[radioName] });
                }
                //combobox - multiple values
                var tempCb = "";
                $(".fr-param").filter(":checkbox").filter(":checked").each(function () {
                    if (tempCb.indexOf(this.name) === -1) {
                        tempCb += this.name + ",";
                    }
                });
                var cbArray = tempCb.split(",");
                var cbName = "";
                var cbValue = "";
                for (i = 0; i < cbArray.length - 1; i++) {
                    cbName = cbArray[i];
                    var cbValueLength = $("input[name='" + cbArray[i] + "']:checked").length;
                    $("input[name='" + cbArray[i] + "']:checked").each(function (i) {
                        if (i === cbValueLength - 1)
                            cbValue += this.value;
                        else
                            cbValue += this.value + ",";

                    });
                    a.push({ name: cbName, ismultiple: $(this).attr("ismultiple"), type: $(this).attr("datatype"), value: cbValue });
                }

                //Combined to JSON String, format as below
                //var parameterList = '{ "ParamsList": [{ "Parameter": "CategoryID","IsMultiple":"True", "Value":"'+ $("#CategoryID").val()+'" }] }';
                var tempJson = "[";
                for (i = 0; i < a.length; i++) {
                    if (i !== a.length - 1) {
                        tempJson += "{'Parameter':'" + a[i].name + "','IsMultiple':'" + a[i].ismultiple + "','Type':'" + a[i].type + "','Value':'" + a[i].value + "'},";
                    }
                    else {
                        tempJson += "{'Parameter':'" + a[i].name + "','IsMultiple':'" + a[i].ismultiple + "','Type':'" + a[i].type + "','Value':'" + a[i].value + "'}";
                    }
                }
                tempJson += "]";
                return "{'ParamsList':" + tempJson + "}";
            } else {
                return null;
            }
        },
        _isParamNullable: function(param) {
            var cb = $(".fr-param-checkbox").filter("[name='" + param.name + "']").first();
            if (cb.attr("checked") === "checked" || param.value === "")
                return null;
            else
                return param.value;
        },
        _resetLabelWidth: function () {
            var max = 0;
            $(".fr-param-label").each(function (index, obj) {
                if ($(obj).width() > max) max = $(obj).width();
            });
            $(".fr-param-label").each(function (index, obj) {
                $(obj).width(max);
            });
        },
        resetValidateMessage: function() {
            jQuery.extend(jQuery.validator.messages, {
                required: "Required.",
                remote: "Please fix this field.",
                email: "Invalid email address.",
                url: "Invalid URL.",
                date: "Invalid date.",
                dateISO: "Invalid date",
                dateDE: "Bitte geben Sie ein gltiges Datum ein.",
                number: "Invalid number.",
                numberDE: "Bitte geben Sie eine Nummer ein.",
                digits: "Please enter only digits",
                creditcard: "Please enter a valid credit card number.",
                equalTo: "Please enter the same value again.",
                accept: "Please enter a value with a valid extension.",
                maxlength: $.validator.format("Please enter no more than {0} characters."),
                minlength: $.validator.format("Please enter at least {0} characters."),
                rangelength: $.validator.format("Please enter a value between {0} and {1} characters long."),
                range: $.validator.format("Please enter a value between {0} and {1}."),
                max: $.validator.format("Please enter a value less than or equal to {0}."),
                min: $.validator.format("Please enter a value greater than or equal to {0}.")
            });
        },
        removeParameter: function () {
            var me = this;
            me._formInit = false;
            $(".fr-param-container", this.element).detach();
        },
        _getDefaultHTMLTable: function() {
            var $newObj = $("<Table cellspacing='0' cellpadding='0'/>");
            return $newObj;
        },
        _contains: function (array, keyword) {
            var i = array.length;
            while (i--) {
                if (array[i] === keyword)
                    return true;
            }
            return false;
        },
        _hasDefaultValue: function (param) {
            var me = this;
            return me._defaultValueExist && $.isArray(param.DefaultValues) && param.DefaultValues[0];
        },
        _getDateTimeFromDefault: function (defaultDatetime) {
            if (!defaultDatetime || defaultDatetime.length < 9)
                return null;

            var date = defaultDatetime.substr(0, defaultDatetime.indexOf(" "));

            var datetime = date.substring(0, date.indexOf("/")) + "-" +
                           date.substring(date.indexOf("/") + 1, date.lastIndexOf("/")) + "-" +
                           date.substring(date.lastIndexOf("/") + 1, defaultDatetime.indexOf(" "));
            return datetime;
        },
    });  // $.widget
});