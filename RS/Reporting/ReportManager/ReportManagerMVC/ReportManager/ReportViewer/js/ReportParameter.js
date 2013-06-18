$(function () {
    $.widget("Forerunner.reportParameter", {
        options: {
            ReportViewer: null,
            PageNum:null,
        },
        _create: function () {
            var me = this;
            this.element = new $("<div class='Parameter-Container Parameter-Layout'>" +
                "<form name='ParameterForm'>" +
                   "<div class='Parameter-ElementBorder'></div>" +
                   "<div class='Parameter-SubmitBorder'>" +
                      "<input name='Parameter_ViewReport' type='button' class='Parameter-ViewReport' value='View Report'/>" +
                   "</div>" +
                "</form></div>");

            if (me.options.ReportViewer.$ReportAreaContainer == null || me.options.ReportViewer.$ReportAreaContainer.length == 0)
                me.options.ReportViewer.$ReportContainer.append(this.element);
            else
                this.element.insertBefore(me.options.ReportViewer.$ReportAreaContainer);
        },
        WriteParameterPanel: function(Data, RS, PageNum, LoadOnly) {
            var me = this;
            me.options.PageNum = PageNum;

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
            $(".Parameter-ViewReport").on("click", function () { me._SubmitForm();});
            
            me.options.ReportViewer.RemoveLoadingIndicator();
        },
        _SubmitForm: function () {
            var me = this;

            me._CloseAllDropdown();
            if (me.GetParamsList() != null)
                me.options.ReportViewer.LoadPage(me.options.PageNum, null, false, null, me.GetParamsList());
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
                    $element = me._WriteCheckbox(Param);
                else
                    $element = me._WriteTextArea(Param);
            }

            $element.on("keypress", function (e) {
                if (e.keyCode == 13) { me._SubmitForm() }; // Enter
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
        _WriteCheckbox: function (Param) {
            var me = this;
            var radioValues = new Array();
            radioValues[0] = "True";
            radioValues[1] = "False";

            $Control = new $("<div class='Parameter-CheckboxBorder' ismultiple='" + Param.MultiValue + "' datatype='" + Param.Type + "' ></div>");

            for (value in radioValues) {
                var $radioItem = new $("<input type='radio' class='Parameter Parameter-Radio " + Param.Name + "' name='" + Param.Name + "' value='" + radioValues[value] +
                    "' id='" + Param.Name + "_radio" + "_" + radioValues[value] + "' datatype='" + Param.Type + "' />");
                me._GetParameterControlProperty(Param, $radioItem);

                var $label = new $("<label for='" + Param.Name + "_radio" + "_" + radioValues[value] + "'>" + radioValues[value] + "</label>");

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
                    $Control.datepicker({
                        dateFormat: 'yy-mm-dd',//Format: ISO8601
                        onClose: function () { $("[name='" + Param.Name + "']").valid(); },
                    });
                    $Control.attr("dateISO", "true");
                    break;
                case "Integer":
                case "Float":
                    $Control.attr("number", "true");
                    break;
                case "String":
                    break;
            }

            return $Control;
        },
        _WriteDropDownControl: function (Param, $Control) {
            var me = this;
            var $Control = $("<select class='Parameter Parameter-Select' ismultiple='" + Param.MultiValue + "' name='" + Param.Name + "' datatype='" + Param.Type + "' readonly='true'>");
            me._GetParameterControlProperty(Param, $Control);

            var $defaultOption = new $("<option value='' multiple='multiple'>&#60Select a Value&#62</option>");
            $Control.append($defaultOption);

            for (index in Param.ValidValues) {
                var $option = new $("<option value='" + Param.ValidValues[index].Value + "'>" + Param.ValidValues[index].Key + "</option>");
                $Control.append($option);
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
            $(document).click(function (e) {
                if ($(e.target).hasClass("ViewReport")) return;

                if (!($(e.target).hasClass("Parameter-DropDown") || $(e.target).hasClass("ParameterClient") || $(e.target).hasClass(Param.Name + "_DropDown_CB") || $(e.target).hasClass(Param.Name + "_DropDown_lable"))) {
                    if ($(e.target).attr("name") != Param.Name + "OpenDropDown") {
                        me._CloseDropDownPanel(Param);
                    }
                }
            });

            var $Table = me._GetDefaultHTMLTable();
            Param.ValidValues.push({ Key: "Select All", Value: "Select All" });

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

            $Control.append($MultipleCheckBox).append($HiddenCheckBox).append($OpenDropDown).append($DropDownContainer);

            return $Control;
        },
        _PopupDropDownPanel: function(Param) {
            var me = this;
            if ($("[name='" + Param.Name + "_DropDownContainer']").hasClass("Parameter-Dropdown-Hidden")) {
                $("[name='" + Param.Name + "_DropDownContainer']").width($("[name='" + Param.Name + "']").width()).fadeOut("fast").
                    removeClass("Parameter-Dropdown-Hidden").addClass("Parameter-Dropdown-Show");
            }
            else {
                me._CloseDropDownPanel(Param);
            }
        },
        _CloseDropDownPanel: function (Param) {
            var me = this;
            if ($("[name='" + Param.Name + "_DropDownContainer']").hasClass("Parameter-Dropdown-Show")) {
                $("[name='" + Param.Name + "_DropDownContainer']").fadeIn("fast", function () {
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
                $(".Parameter").filter(":hidden").each(function (i) {
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
            $(".Parameter-Container").detach();
        },
        _GetDefaultHTMLTable: function() {
            var $NewObj = $("<Table cellspacing='0' cellpadding='0'/>");
            return $NewObj;
        }
    });  // $.widget
});