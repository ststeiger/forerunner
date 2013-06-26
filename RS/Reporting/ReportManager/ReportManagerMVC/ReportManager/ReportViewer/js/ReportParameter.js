$(function () {
    $.widget("Forerunner.reportParameter", {
        options: {
            $reportViewer: null,
            PageNum: null,
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
            $params = new $("<div class='Parameter-Container Parameter-Layout'>" +
                "<form name='ParameterForm' onsubmit='return false'>" +
                   "<div class='Parameter-ElementBorder'><input type='text' style='display:none'></div>" +
                   "<div class='Parameter-SubmitBorder'>" +
                      "<input name='Parameter_ViewReport' type='button' class='Parameter-ViewReport' value='View Report'/>" +
                   "</div>" +
                "</form></div>");
            me.element.css("display", "block");
            me.element.html($params);

            me._formInit = true;
        },
        WriteParameterPanel: function(Data, RS, PageNum, LoadOnly) {
            var me = this;
            me.options.PageNum = PageNum;
            me._paramCount = Data.Count;
            me._defaultValueExist = Data.DefaultValueExist;
            me._loadedForDefault = true;

            me._render();

            var $ElementBorder = $(".Parameter-ElementBorder");
            $.each(Data.ParametersList, function (Index, Param) {
                $ElementBorder.append(me._WriteParameterControl(Param, new $("<div />")));
            });
            
            me._ResetLabelWidth();
            me.ResetValidateMessage();
            $("[name='ParameterForm']").validate({
                errorPlacement: function (error, element) {
                    if ($(element).is(":radio"))
                        error.appendTo(element.parent("div").next("span"));
                    else {
                        if ($(element).attr("IsMultiple") == "True")
                            error.appendTo(element.parent("div").next("span"));
                        else
                            error.appendTo(element.next("span"));
                    }
                },
                highlight: function (element) {
                    if ($(element).is(":radio"))
                        $(element).parent("div").addClass("Parameter-Error");
                    else
                        $(element).addClass("Parameter-Error");
                },
                unhighlight: function (element) {
                    if ($(element).is(":radio"))
                        $(element).parent("div").removeClass("Parameter-Error");
                    else
                        $(element).removeClass("Parameter-Error");
                }
            });
            $(".Parameter-ViewReport").on("click", function () {
                me._SubmitForm();
            });

            if (me._paramCount == Data.DefaultValueCount && me._loadedForDefault)
                me._SubmitForm();
            else
                me._trigger('render');

            me.options.$reportViewer.reportViewer('RemoveLoadingIndicator');
        },
        _SubmitForm: function () {
            var me = this;

            me._CloseAllDropdown();
            var paramList = me.GetParamsList();
            if (paramList != null) {                
                me.options.$reportViewer.reportViewer('LoadPage', me.options.PageNum, false, null, paramList,true);
                me._trigger('submit');
            }
        },
        _WriteParameterControl: function (Param, $Parent) {
            var me = this;
            var $Lable = new $("<div class='Parameter-Label'>" + Param.Name + "</div>");
            
            //If the control have valid values, then generate a select control
            var $Container = new $("<div class='Parameter-ItemContainer'></div>");
            var $ErrorMessage = new $("<span class='ErrorPlaceHolder'/>");
            var $element = null;

            if (Param.ValidValues != "") {
                //dropdown with checkbox
                if (Param.MultiValue == "True") {
                    $element = me._WriteDropDownWithCheckBox(Param);
                }
                else {
                    $element = me._WriteDropDownControl(Param);
                }
            }
            else {
                if (Param.Type == "Boolean")
                    $element = me._WriteRadioButton(Param);
                else
                    $element = me._WriteTextArea(Param);
            }

            $element.on("keypress", function (e) {
                if (e.keyCode == 13) {
                    me._SubmitForm()
                }; // Enter
            });

            $Container.append($element).append(me._AddNullableCheckBox(Param, $element)).append($ErrorMessage);
            $Parent.append($Lable).append($Container);

            return $Parent;
        },
        _GetParameterControlProperty: function (Param, $Control) {
            var me = this;
            $Control.attr("AllowBlank", Param.AllowBlank);
            if (Param.Nullable != "True") {
                $Control.attr("required", "true").watermark("Required");
            }
            $Control.attr("ErrorMessage", Param.ErrorMessage);
        },
        _AddNullableCheckBox: function (Param, $Control) {
            var me = this;
            if (Param.Nullable == "True") {
                var $NullableSpan = new $("<Span />");

                var $Checkbox = new $("<Input type='checkbox' class='Parameter-Checkbox' name='" + Param.Name + "' />");

                if (me._hasDefaultValue(Param))
                    $Checkbox.attr('checked', 'true');

                $Checkbox.on("click", function () {
                    if ($Checkbox.attr("checked") == "checked") {
                        $Checkbox.removeAttr("checked");
                        if (Param.Type == "Boolean")
                            $(".Parameter-Radio." + Param.Name).removeAttr("disabled");
                        else
                            $Control.removeAttr("disabled").removeClass("Parameter-Disabled").addClass("Parameter-Enabled");
                    }
                    else {
                        $Checkbox.attr("checked", "true");
                        if (Param.Type == "Boolean")
                            $(".Parameter-Radio." + Param.Name).attr("disabled", "true");
                        else
                            $Control.attr("disabled", "true").removeClass("Parameter-Enable").addClass("Parameter-Disabled");
                    }
                });

                var $NullableLable = new $("<Label class='Parameter-Null-Label' />");
                $NullableLable.html("NULL");

                $NullableSpan.append($Checkbox).append($NullableLable);
                return $NullableSpan;
            }
            else
                return null;
        },
        _WriteRadioButton: function (Param) {
            var me = this;
            var radioValues = new Array();
            radioValues[0] = "True";
            radioValues[1] = "False";

            $Control = new $("<div class='Parameter-CheckboxBorder' ismultiple='" + Param.MultiValue + "' datatype='" + Param.Type + "' ></div>");

            for (value in radioValues) {
                var $radioItem = new $("<input type='radio' class='Parameter Parameter-Radio " + Param.Name + "' name='" + Param.Name + "' value='" + radioValues[value] +
                    "' id='" + Param.Name + "_radio" + "_" + radioValues[value] + "' datatype='" + Param.Type + "' />");
                me._GetParameterControlProperty(Param, $radioItem);

                if (me._hasDefaultValue(Param)) {
                    if (Param.Nullable == "True")
                        $radioItem.attr("disabled", "true");
                    else if (Param.DefaultValues[0] == radioValues[value])
                        $radioItem.attr("checked", "true");
                }

                if (me._paramCount == 1)
                    $radioItem.on("click", function () { me._SubmitForm(); });

                var $label = new $("<label class='Parameter-RadioLabel' for='" + Param.Name + "_radio" + "_" + radioValues[value] + "'>" + radioValues[value] + "</label>");

                $Control.append($radioItem);
                $Control.append($label);
            }

            return $Control;
        },
        _WriteTextArea: function (Param) {
            var me = this;
            $Control = new $("<input class='Parameter' type='text' size='30' ismultiple='" + Param.MultiValue + "' datatype='" + Param.Type + "'  name='" + Param.Name + "'/>");
            me._GetParameterControlProperty(Param, $Control);

            switch (Param.Type) {
                case "DateTime":
                    $Control.attr("readonly", "true");
                    $Control.datepicker({
                        dateFormat: 'yy-mm-dd', //Format: ISO8601
                        onClose: function () {
                            $("[name='" + Param.Name + "']").valid();
                            if (me._paramCount == 1)
                                me._SubmitForm();
                        },
                    });
                    $Control.attr("dateISO","true");

                    if(me._hasDefaultValue(Param))
                        $Control.datepicker("setDate", me._GetDateTimeFromDefault(Param.DefaultValues[0]));
                    break;
                case "Integer":
                case "Float":
                    $Control.attr("number", "true");
                    //break;
                case "String":
                    if (me._hasDefaultValue(Param)) {
                        $Control.val(Param.DefaultValues[0]);
                        if (Param.Nullable=="True")
                            $Control.attr("disabled", "true").removeClass("Parameter-Enable").addClass("Parameter-Disabled");
                    }
                    break;
            }

            return $Control;
        },
        _WriteDropDownControl: function (Param, $Control) {
            var me = this;
            var canLoad = false;
            var $Control = $("<select class='Parameter Parameter-Select' ismultiple='" + Param.MultiValue + "' name='" + Param.Name + "' datatype='" + Param.Type + "' readonly='true'>");
            me._GetParameterControlProperty(Param, $Control);

            var $defaultOption = new $("<option value=''>&#60Select a Value&#62</option>");
            $Control.append($defaultOption);

            for (index in Param.ValidValues) {
                var optionValue = Param.ValidValues[index].Value;
                var $option = new $("<option value='" + optionValue + "'>" + Param.ValidValues[index].Key + "</option>");
                
                if (me._hasDefaultValue(Param) && Param.DefaultValues[0] == optionValue) {
                    $option.attr("selected", "true");
                    canLoad = true;
                }

                $Control.append($option);
            }
            if (!canLoad) me._loadedForDefault = false;

            if (me._paramCount == 1) {
                $Control.on('change', function () { me._SubmitForm(); });
            }
            
            return $Control;
        },
        _WriteDropDownWithCheckBox: function(Param, $Control) {
            var me = this;
            var $Control = new $("<div style='display:inline-block;'/>");

            var $MultipleCheckBox = new $("<Input type='text' class='ParameterClient' id='" + Param.Name + "_fore' name='" + Param.Name + "' readonly='true' ismultiple='" + Param.MultiValue + "' datatype='" + Param.Type + "'/>");
            me._GetParameterControlProperty(Param, $MultipleCheckBox);
            $MultipleCheckBox.on("click", function () { me._PopupDropDownPanel(Param); });

            var $HiddenCheckBox = new $("<Input id='" + Param.Name + "_hidden' class='Parameter' type='hidden' name='" + Param.Name + "' ismultiple='" + Param.MultiValue + "' datatype='" + Param.Type + "'/>");

            var $OpenDropDown = new $("<Img alt='Open DropDown List' src='./reportviewer/Images/OpenDropDown.png' name='" + Param.Name + "OpenDropDown' />");
            $OpenDropDown.on("click", function () { me._PopupDropDownPanel(Param); });

            var $DropDownContainer = new $("<div class='Parameter-DropDown Parameter-Dropdown-Hidden' name='" + Param.Name + "_DropDownContainer' value='" + Param.Name + "' />");

            $(document).on("click", function (e) {
                if ($(e.target).hasClass("ViewReport")) return;

                if (!($(e.target).hasClass("Parameter-DropDown") || $(e.target).hasClass("ParameterClient") || $(e.target).hasClass(Param.Name + "_DropDown_CB") || $(e.target).hasClass(Param.Name + "_DropDown_lable"))) {
                    if ($(e.target).attr("name") != Param.Name + "OpenDropDown") {
                        me._CloseDropDownPanel(Param);
                    }
                }
            });

            var $Table = me._GetDefaultHTMLTable();
            Param.ValidValues.push({ Key: "Select All", Value: "Select All" });

            var keys = "";
            var values = "";
            for (index in Param.ValidValues) {
                var key;
                var value;
                if (index == 0) {
                    var SelectAll = Param.ValidValues[Param.ValidValues.length - 1];
                    key = SelectAll.Key;
                    value = SelectAll.Value;
                }
                else {
                    key = Param.ValidValues[index - 1].Key;
                    value = Param.ValidValues[index - 1].Value;
                }

                var $Row = new $("<TR />");
                var $Col = new $("<TD/>");

                var $Span = new $("<Span />");
                var $Checkbox = new $("<input type='checkbox' class='" + Param.Name + "_DropDown_CB' id='" + Param.Name + "_DropDown_" + value + "' value='" + value + "' />");
                
                if (me._hasDefaultValue(Param) && me._Contains(Param.DefaultValues, value)) {
                    $Checkbox.attr("checked", "true");
                    keys += key + ",";
                    values += value + ",";
                }

                $Checkbox.on("click", function () {
                    if (this.value == "Select All") {
                        if (this.checked == true) {
                            $("." + Param.Name + "_DropDown_CB").each(function (i) {
                                this.checked = true;
                            });
                        }
                        if (this.value == "Select All" & this.checked == false) {
                            $("." + Param.Name + "_DropDown_CB").each(function (i) {
                                this.checked = false;
                            });
                        }
                    }
                });

                var $Label = new $("<label for='" + Param.Name + "_DropDown_" + value + "' class='" + Param.Name + "_DropDown_lable" + "' name='"
                    + Param.Name + "_DropDown_" + value + "_lable" + "'/>");
                $Label.html(key);

                $Span.append($Checkbox).append($Label);
                $Col.append($Span);
                $Row.append($Col);
                $Table.append($Row);
            }
            $DropDownContainer.append($Table);

            if (me._hasDefaultValue(Param)) {
                $MultipleCheckBox.val(keys.substr(0, keys.length - 1));
                $HiddenCheckBox.val(values.substr(0, values.length - 1));
            }

            $Control.append($MultipleCheckBox).append($HiddenCheckBox).append($OpenDropDown).append($DropDownContainer);

            return $Control;
        },
        _SetMultipleInputValues: function (Param) {
            var ShowValue = "";
            var HiddenValue = "";
            $("." + Param.Name + "_DropDown_CB").each(function (i) {
                if (this.checked & this.value != "Select All") {
                    ShowValue += $("[name='" + Param.Name + "_DropDown_" + this.value + "_lable']").html() + ",";
                    HiddenValue += this.value + ",";
                }
            });
            $("#" + Param.Name + "_fore").val(ShowValue.substr(0, ShowValue.length - 1));
            $("#" + Param.Name + "_hidden").val(HiddenValue.substr(0, HiddenValue.length - 1));
        },
        _PopupDropDownPanel: function(Param) {
            var me = this;
            
            var dropDown = $("[name='" + Param.Name + "_DropDownContainer']");
            var multipleControl = $("[name='" + Param.Name + "']");
            
            if (document.body.clientHeight - multipleControl.offset().top < dropDown.height() + 45) {
                dropDown.css('top', multipleControl.offset().top - dropDown.height() - 9);
            }
            else {
                dropDown.css('top', multipleControl.offset().top + 36);
            }

            if (dropDown.hasClass("Parameter-Dropdown-Hidden")) {
                dropDown.width(multipleControl.width()).fadeOut("fast").removeClass("Parameter-Dropdown-Hidden").addClass("Parameter-Dropdown-Show");
            }
            else {
                me._CloseDropDownPanel(Param);
            }
        },
        _CloseDropDownPanel: function (Param) {
            var me = this;
            if ($("[name='" + Param.Name + "_DropDownContainer']").hasClass("Parameter-Dropdown-Show")) {
                $("[name='" + Param.Name + "_DropDownContainer']").fadeIn("fast", function () {
                    me._SetMultipleInputValues(Param);
                });
                $("[name='" + Param.Name + "_DropDownContainer']").addClass("Parameter-Dropdown-Hidden").removeClass("Parameter-Dropdown-Show");
                $("[name='" + Param.Name + "']").focus().blur().focus();
            }

        },
        _CloseAllDropdown: function () {
            var me = this;
            $(".Parameter-DropDown").each(function (Index, Param) {
                me._CloseDropDownPanel({ Name: $(Param).attr("value") });
            });
        },
        GetParamsList: function() {
            var me = this;
            if ($("[name='ParameterForm']").length != 0 && $("[name='ParameterForm']").valid() == true) {
                var a = [];
                //Text
                $(".Parameter").filter(":text").each(function (i) {
                    a.push({ name: this.name, ismultiple: $(this).attr("ismultiple"), type: $(this).attr("datatype"), value: me._IsParamNullable(this) });
                });
                //Hidden
                $(".Parameter").filter("[type='hidden']").each(function (i) {
                    a.push({ name: this.name, ismultiple: $(this).attr("ismultiple"), type: $(this).attr("datatype"), value: me._IsParamNullable(this) });
                });
                //dropdown
                $(".Parameter").filter("select").each(function (i) {
                    a.push({ name: this.name, ismultiple: $(this).attr("ismultiple"), type: $(this).attr("datatype"), value: me._IsParamNullable(this) });
                });
                var RadioList = new Object();
                //radio-group by radio name, default value: null
                $(".Parameter").filter(":radio").each(function (i) {
                    if (!(this.name in RadioList)) {
                        RadioList[this.name] = null;
                    }
                    if (this.checked == true) {
                        RadioList[this.name] = me._IsParamNullable(this);
                    }
                });
                for (var RadioName in RadioList) {
                    a.push({ name: RadioName, ismultiple: "", type: 'Boolean', value: RadioList[RadioName] });
                }
                //combobox - multiple values
                var temp_cb = "";
                $(".Parameter").filter(":checkbox").filter(":checked").each(function (i) {
                    if (temp_cb.indexOf(this.name) == -1) {
                        temp_cb += this.name + ",";
                    }
                });
                var cb_array = temp_cb.split(",");
                var cb_name = "";
                var cb_value = "";
                for (var cb_i = 0; cb_i < cb_array.length - 1; cb_i++) {
                    cb_name = cb_array[cb_i];
                    var cb_value_length = $("input[name='" + cb_array[cb_i] + "']:checked").length;
                    $("input[name='" + cb_array[cb_i] + "']:checked").each(function (i) {
                        if (i == cb_value_length - 1)
                            cb_value += this.value;
                        else
                            cb_value += this.value + ",";

                    });
                    a.push({ name: cb_name, ismultiple: $(this).attr("ismultiple"), type: $(this).attr("datatype"), value: cb_value });
                }

                //Combined to JSON String, format as below
                //var parameterList = '{ "ParamsList": [{ "Parameter": "CategoryID","IsMultiple":"True", "Value":"'+ $("#CategoryID").val()+'" }] }';
                var temp_json = "[";
                for (var json_i = 0; json_i < a.length; json_i++) {
                    if (json_i != a.length - 1) {
                        temp_json += '{"Parameter":"' + a[json_i].name + '","IsMultiple":"' + a[json_i].ismultiple + '","Type":"' + a[json_i].type + '","Value":"' + a[json_i].value + '"},';
                    }
                    else {
                        temp_json += '{"Parameter":"' + a[json_i].name + '","IsMultiple":"' + a[json_i].ismultiple + '","Type":"' + a[json_i].type + '","Value":"' + a[json_i].value + '"}';
                    }
                }
                temp_json += "]";
                return '{"ParamsList":' + temp_json + '}';
            } else {
                return null;
            }
        },
        _IsParamNullable: function(Parameter) {
            var me = this;
            var checkbox = $(".Parameter-Checkbox").filter("[name='" + Parameter.name + "']").first();
            if (checkbox.attr("checked") == "checked" || Parameter.value == "")
                return null;
            else
                return Parameter.value;
        },
        _ResetLabelWidth: function () {
            var max = 0;
            $(".Parameter-Label").each(function (index, obj) {
                if ($(obj).width() > max) max = $(obj).width();
            });
            $(".Parameter-Label").each(function (index, obj) {
                $(obj).width(max);
            });
        },
        ResetValidateMessage: function() {
            var me = this;
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
        RemoveParameter: function () {
            var me = this;
            me._formInit = false;
            $(".Parameter-Container", this.element).detach();
        },
        _GetDefaultHTMLTable: function() {
            var $NewObj = $("<Table cellspacing='0' cellpadding='0'/>");
            return $NewObj;
        },
        _Contains: function (Array, Keyword) {
            var i = Array.length;
            while (i--) {
                if (Array[i] == Keyword)
                    return true;
            }
            return false;
        },
        _hasDefaultValue: function (param) {
            var me = this;
            return me._defaultValueExist && $.isArray(param.DefaultValues) && param.DefaultValues[0] != null;
        },
        _GetDateTimeFromDefault: function (DefaultDatetime) {
            if (DefaultDatetime == null || DefaultDatetime.length < 9)
                return null;

            var date = DefaultDatetime.substr(0, DefaultDatetime.indexOf(' '));

            var datetime = date.substring(0, date.indexOf('/')) + "-" +
                           date.substring(date.indexOf('/') + 1, date.lastIndexOf('/')) + "-" +
                           date.substring(date.lastIndexOf('/') + 1, DefaultDatetime.indexOf(' '));
            return datetime;
        },
    });  // $.widget
});