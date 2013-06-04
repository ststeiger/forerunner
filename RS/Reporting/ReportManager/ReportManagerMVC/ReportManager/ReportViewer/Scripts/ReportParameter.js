$(function () {

    $.widget("Forerunner.reportParameter", {
        // Default options
        options: {
            ReportViewer: null,
        },      
        // Constructor
        _create: function () {
            this.ReportViewer = this.options.ReportViewer;
        },
        WriteParameterPanel: function(Data, RS, pageNum, LoadOnly) {
            var me = this;
            var $ParameterDiv = new $("<Div />");
            $ParameterDiv.attr("class", "ParameterContainer");
            $ParameterDiv.attr("name", Data.SessionID);

            var $ParameterContainer = me._GetDefaultHTMLTable();
            $ParameterContainer.attr("class", "Parameter-Panel");
            var $Row = new $("<TR />");
            var $Col = $("<TD/>");

            var $Form = new $("<Form />");
            $Form.attr("name", "ParamsForm");
            var $SecondContainer = me._GetDefaultHTMLTable();
            $SecondContainer.addClass("Parameter-Form");

            $.each(Data.ParametersList, function (Index, Obj) {
                $SecondContainer.append(me._WriteParameterControl(Obj, new $("<TR />")));
            });

            $Form.append($SecondContainer);
            me.ResetValidateMessage();
            $Form.validate({
                errorPlacement: function (error, element) {
                    if ($(element).is(":radio"))
                        error.appendTo(element.parent("div").parent("td").next("td"));
                    else {
                        if ($(element).attr("IsMultiple") == "True")
                            error.appendTo(element.parent("div").parent("td").next("td"));
                        else
                            error.appendTo(element.parent("td").next("td"));
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
            $Col.append($Form);
            $Row.append($Col);

            var $ViewReport_TD = new $("<TD/>");
            $ViewReport_TD.attr("style", "margin:4px;text-align:center");

            var $ViewReport = new $("<input/>");
            $ViewReport.attr("name", "Parameter_ViewReport");
            $ViewReport.attr("type", "button");
            $ViewReport.attr("value", "View Report");
            $ViewReport.on("click", function () {
                if (me.GetParamsList() != null) {
                    //if (me.ReportViewer.Pages[pageNum] != null) {
                    //    me.ReportViewer.Pages[pageNum].$Container.detach();
                    //    me.ReportViewer.Pages = new Object();
                    //}
                    me.ReportViewer.LoadPage(pageNum, null, false, null, me.GetParamsList());
                }
            });

            $ViewReport_TD.append($ViewReport);
            var $SpaceTD = new $("<TD />");
            $SpaceTD.html("&nbsp");
            $Row.append($SpaceTD);
            $Row.append($ViewReport_TD);

            $ParameterContainer.append($Row);

            $ParameterDiv.append($ParameterContainer);
            me.ReportViewer.$PageContainer.append($ParameterDiv);
            me.ReportViewer.RemoveLoadingIndicator();
        },
        _WriteParameterControl: function(Obj, $Parent) {
            var $TD_Lable = new $("<TD />");
            var $lable = new $("<span />");
            $lable.addClass("Parameter-Lable");
            var Name = Obj.Name;
            $lable.html(Name);
            var me = this;

            $TD_Lable.append($lable);

            //If the control have valid values, then generate a select control
            var $TD_Control = new $("<TD />");
            var $element = null;
            if (Obj.ValidValues != "") {
                //dropdown with checkbox
                if (Obj.MultiValue == "True") {
                    $element = new $("<Div />");
                    me._WriteDropDownWithCheckBox(Obj, $element);
                }
                else {
                    $element = new $("<select />");
                    me._WriteDropDownControl(Obj, $element);
                }
            }
            else {
                if (Obj.Type == "Boolean") {
                    var radioValues = new Array();
                    radioValues[0] = "True";
                    radioValues[1] = "False";

                    $element = new $("<Div />");
                    $element.attr("IsMultiple", Obj.MultiValue);
                    $element.attr("DataType", Obj.Type);
                    $element.addClass("Parameter-Div");
                    for (value in radioValues) {
                        var $radioItem = new $("<input/>");
                        $radioItem.addClass("Parameter");
                        $radioItem.addClass("Parameter-Radio");
                        $radioItem.addClass(Obj.Name);
                
                        $radioItem.attr("type", "radio");
                        //$radioItem.attr("name", Obj.Name);
                        $radioItem.attr("value", radioValues[value]);
                        $radioItem.attr("name", Obj.Name + "_radio" + "_" + radioValues[value]);
                        $radioItem.attr("DataType", Obj.Type);
                        me._GetParameterControlProperty(Obj, $radioItem);

                        var $lableTrue = new $("<lable/>");
                        $lableTrue.html(radioValues[value]);
                        $lableTrue.attr("for", Obj.Name + "_radio" + "_" + radioValues[value]);

                        $element.append($radioItem);
                        $element.append($lableTrue);
                    }
                }
                else {
                    $element = new $("<input/>");
                    $element.attr("class", "Parameter");
                    $element.attr("IsMultiple", Obj.MultiValue);
                    $element.attr("DataType", Obj.Type);
                    $element.attr("type", "text");
                    $element.attr("size", "30");
                    $element.attr("name", Name);

                    me._GetParameterControlProperty(Obj, $element);

                    switch (Obj.Type) {
                        case "DateTime":
                            //Format: ISO8601
                            $element.datepicker({
                                dateFormat: 'yy-mm-dd',
                                onClose: function () {
                                    $element.focus().blur();
                                }
                            });
                            $element.attr("dateISO", "true");
                            break;
                        case "Integer":
                        case "Float":
                            $element.attr("number", "true");
                            break;
                        case "String":
                            break;
                    }
                }
            }
            $TD_Control.append($element);
            $TD_Control.append(me._AddNullableCheckBox(Obj, $element));
            var $TD_Status = new $("<TD/>");
            $TD_Status.addClass("Status");
            $Parent.append($TD_Lable);
            $Parent.append($TD_Control);
            $Parent.append($TD_Status);

            return $Parent;
        },
        _WriteParameterToggle: function() {
            //var $Container = new $("<Div />");
            //$Container.attr("class", "ToggleParam");

            //var $ToggleIcon = new $("<Img />");
            //$ToggleIcon.attr("alt", "Show / Hide Parameters");
            //$ToggleIcon.attr("title", "Show / Hide Parameters");
            //$ToggleIcon.attr("src", "/images/Parameter_Collapse.png");
            //$Container.on("mouseover", function (event) { SetActionCursor(this); });

            //$Container.on("click", function () {
            //    $(".Parameter-Panel").toggle("fast");
            //    if ($ToggleIcon.attr("src") == "/images/Parameter_Collapse.png") 
            //        $ToggleIcon.attr("src", "/images/Parameter_Expand.png");
            //    else if ($ToggleIcon.attr("src") == "/images/Parameter_Expand.png") 
            //        $ToggleIcon.attr("src", "/images/Parameter_Collapse.png");
            //});

            //$Container.append($ToggleIcon);
            //return $Container;   
        },
        _GetParameterControlProperty: function(Obj, $Control) {
            var me = this;
            //$Control.attr("name", Obj.Name);
            $Control.attr("AllowBlank", Obj.AllowBlank);
            if (Obj.Nullable != "True") {
                $Control.attr("required", "true");
                $Control.watermark("Required");
            }
            $Control.attr("ErrorMessage", Obj.ErrorMessage);
        },
        _AddNullableCheckBox: function(Obj, $Control) {
            var me = this;
            if (Obj.Nullable == "True") {
                var $NullableSpan = new $("<Span />");

                var $Checkbox = new $("<Input />");
                $Checkbox.attr("type", "checkbox");
                $Checkbox.attr("class", "Parameter-Checkbox");
                $Checkbox.attr("name", Obj.Name);

                $Checkbox.on("click", function () {
                    if ($Checkbox.attr("checked") == "checked") {
                        $Checkbox.removeAttr("checked");
                        if (Obj.Type == "Boolean") {
                            $(".Parameter-Radio." + Obj.Name).removeAttr("disabled");
                        }
                        else {
                            $Control.removeAttr("disabled");
                            $Control.removeClass("Parameter-Disabled").addClass("Parameter-Enabled");
                        }
                    }
                    else {
                        $Checkbox.attr("checked", "true");
                        if (Obj.Type == "Boolean") {
                            $(".Parameter-Radio." + Obj.Name).attr("disabled", "true");
                        }
                        else {
                            $Control.attr("disabled", "true");
                            $Control.removeClass("Parameter-Enable").addClass("Parameter-Disabled");
                        }
                    }
                });

                var $NullableLable = new $("<Lable />");
                $NullableLable.html("NULL");
                $NullableLable.addClass("Parameter-Lable");

                $NullableSpan.append($Checkbox);
                $NullableSpan.append($NullableLable);

                return $NullableSpan;
            }
            else
                return null;
        },
        _WriteDropDownControl: function (Obj, $Control) {
            var me = this;
            $Control.addClass("Parameter");
            $Control.attr("IsMultiple", Obj.MultiValue);
            $Control.addClass("Parameter-Select");
            $Control.attr("name", Obj.Name);
            $Control.attr("DataType", Obj.Type);
            $Control.attr("readonly","true");
            me._GetParameterControlProperty(Obj, $Control);

            var $defaultOption = new $("<option />");
            $defaultOption.attr("value", "");
            $defaultOption.attr("multiple", "multiple");
            $defaultOption.html("&#60Select a Value&#62");
            $Control.append($defaultOption);

            for (index in Obj.ValidValues) {
                var $option = new $("<option />");
                $option.attr("value", Obj.ValidValues[index].Value);
                $option.html(Obj.ValidValues[index].Key);
                $Control.append($option);
            }
        },
        _WriteDropDownWithCheckBox: function(Obj, $Control) {
            var me = this;
            var $MultipleCheckBox = new $("<Input />");
            $MultipleCheckBox.attr("type", "text");
            $MultipleCheckBox.attr("name", Obj.Name);
            $MultipleCheckBox.attr("readonly", "true");
            $MultipleCheckBox.attr("class", "ParameterClient");
            $MultipleCheckBox.attr("IsMultiple", Obj.MultiValue);
            $MultipleCheckBox.attr("DataType", Obj.Type);
            me._GetParameterControlProperty(Obj, $MultipleCheckBox);
            $MultipleCheckBox.on("click", function () { me._PopupDropDownPanel(Obj); });

            var $HiddenCheckBox = new $("<Input />");
            $HiddenCheckBox.attr("type", "hidden");
            //$HiddenCheckBox.attr("name", Obj.Name);
            $HiddenCheckBox.attr("IsMultiple", Obj.MultiValue);
            $HiddenCheckBox.attr("name", Obj.Name + "_hidden");
            $HiddenCheckBox.attr("class", "Parameter");
            $HiddenCheckBox.attr("DataType", Obj.Type);

            var $OpenDropDown = new $("<Img />");
            $OpenDropDown.attr("src", "./reportviewer/Images/OpenDropDown.png");
            $OpenDropDown.attr("alt", "Open DropDown List");
            $OpenDropDown.attr("name", Obj.Name + "OpenDropDown");
            $OpenDropDown.on("click", function () { me._PopupDropDownPanel(Obj); });

            var $DropDownContainer = new $("<Div />");
            $DropDownContainer.attr("name", Obj.Name + "_DropDownContainer");
            $DropDownContainer.addClass("Parameter-DropDown");
            $DropDownContainer.addClass("Parameter-Dropdown-Hidden");

            $("body").click(function (e) {
                if (!($(e.target).hasClass("Parameter-DropDown") | $(e.target).hasClass("ParameterClient") | $(e.target).hasClass(Obj.Name + "_DropDown_CB") | $(e.target).hasClass(Obj.Name + "_DropDown_lable"))) {
                    if ($(e.target).attr("name") != Obj.Name + "OpenDropDown") {
                        me._CloseDropDownPanel(Obj);
                    }
                }
            });

            var $Table = me._GetDefaultHTMLTable();
            Obj.ValidValues.push({ Key: "Select All", Value: "Select All" });

            for (index in Obj.ValidValues) {
                var key;
                var value;
                if (index == 0) {
                    var SelectAll = Obj.ValidValues[Obj.ValidValues.length - 1];
                    key = SelectAll.Key;
                    value = SelectAll.Value;
                }
                else {
                    key = Obj.ValidValues[index - 1].Key;
                    value = Obj.ValidValues[index - 1].Value;
                }

                var $Row = new $("<TR />");
                var $Col = new $("<TD/>");

                var $Span = new $("<Span />");
                var $Checkbox = new $("<Input />");
                $Checkbox.attr("type", "checkbox");
                $Checkbox.attr("name", Obj.Name + "_DropDown_" + value);
                $Checkbox.attr("class", Obj.Name + "_DropDown_CB");
                $Checkbox.attr("value", value);
                $Checkbox.on("click", function () {
                    if (this.value == "Select All" & this.checked == true) {
                        $("." + Obj.Name + "_DropDown_CB").each(function (i) {
                            this.checked = true;
                        });
                    }
                    if (this.value == "Select All" & this.checked == false) {
                        $("." + Obj.Name + "_DropDown_CB").each(function (i) {
                            this.checked = false;
                        });
                    }
                });

                var $Lable = new $("<Lable />");
                $Lable.attr("for", Obj.Name + "_DropDown_" + value);
                $Lable.attr("name", Obj.Name + "_DropDown_" + value + "_lable");
                $Lable.attr("class", Obj.Name + "_DropDown_lable");
                $Lable.html(key);

                $Span.append($Checkbox);
                $Span.append($Lable);
                $Col.append($Span);
                $Row.append($Col);
                $Table.append($Row);
            }
            $DropDownContainer.append($Table);

            $Control.append($MultipleCheckBox);
            $Control.append($HiddenCheckBox);
            $Control.append($OpenDropDown);
            $Control.append($DropDownContainer);
        },
        _PopupDropDownPanel: function(Obj) {
            var me = this;
            $("[name='" + Obj.Name + "_DropDownContainer']").width($("#" + Obj.Name).width());
            if ($("[name='" + Obj.Name + "_DropDownContainer']").hasClass("Parameter-Dropdown-Hidden")) {
                $("[name='" + Obj.Name + "_DropDownContainer']").fadeOut("fast");
                $("[name='" + Obj.Name + "_DropDownContainer']").removeClass("Parameter-Dropdown-Hidden");
                $("[name='" + Obj.Name + "_DropDownContainer']").addClass("Parameter-Dropdown-Show");
            }
            else {
                me._CloseDropDownPanel(Obj);
            }
        },
        _CloseDropDownPanel: function(Obj) {
            var me = this;
            if ($("[name='" + Obj.Name + "_DropDownContainer']").hasClass("Parameter-Dropdown-Show")) {
                $("[name='" + Obj.Name + "_DropDownContainer']").fadeIn("fast", function () {
                    var ShowValue = "";
                    var HiddenValue = "";
                    $("." + Obj.Name + "_DropDown_CB").each(function (i) {
                        if (this.checked & this.value != "Select All") {
                            ShowValue += $("[name='" + Obj.Name + "_DropDown_" + this.value + "_lable']").html() + ",";
                            HiddenValue += this.value + ",";
                        }
                    });
                    $("[name='" + Obj.Name + "']").val(ShowValue.substr(0, ShowValue.length - 1));
                    $("[name='" + Obj.Name + "']").val(HiddenValue.substr(0, HiddenValue.length - 1));
                });
                $("[name='" + Obj.Name + "_DropDownContainer']").addClass("Parameter-Dropdown-Hidden").removeClass("Parameter-Dropdown-Show");
                $("[name='" + Obj.Name + "']").focus().blur();
            }
    
        },
        GetParamsList: function() {
            var me = this;
            if ($("[name='ParamsForm']").length != 0 && $("[name='ParamsForm']").valid() == true) {
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
            $(".ParameterContainer").find("[name='" + me.options.SessionID + "']").detach();
        },
        _GetDefaultHTMLTable: function() {
            var $NewObj = $("<Table/>");

            $NewObj.attr("CELLSPACING", 0);
            $NewObj.attr("CELLPADDING", 0);
            return $NewObj;
        }
    });  // $.widget
});