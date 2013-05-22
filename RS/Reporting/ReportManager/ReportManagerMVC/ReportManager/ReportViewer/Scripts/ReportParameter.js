function WriteParameterPanel(Data, RS, pageNum, LoadOnly) {
    //var LoadOnly = false;
    var $ParameterDiv = new $("<Div />");
    $ParameterDiv.attr("id", "ParameterContainer");

    var $ParameterContainer = GetDefaultHTMLTable();
    $ParameterContainer.attr("class", "Parameter-Panel");
    var $Row = new $("<TR />");
    var $Col = $("<TD/>");

    var $Form = new $("<Form />");
    $Form.attr("id", "ParamsForm");
    var $SecondContainer = GetDefaultHTMLTable();
    $SecondContainer.addClass("Parameter-Form");

    $.each(Data.ParametersList, function (Index, Obj) {
        $SecondContainer.append(WriteParameterControl(new ReportItemContext(RS, Obj, Index, RS.CurrObj, new $("<TR />"), "", "")));
    });

    $Form.append($SecondContainer);
    ResetValidateMessage();
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
    $ViewReport.attr("id", "Parameter_ViewReport");
    $ViewReport.attr("type", "button");
    $ViewReport.attr("value", "View Report");
    $ViewReport.on("click", function () {
        if ($("#ParamsForm").valid() == true) {
            if (RS.Pages[pageNum] != null) {
                RS.Pages[pageNum].$Container.detach();
            }
            AddLoadingIndicator(RS);
            var parameterList = GetParamsList();

            $.getJSON(RS.ReportViewerAPI + "/GetJSON/", {
                ReportServerURL: RS.ReportServerURL,
                ReportPath: RS.ReportPath,
                SessionID: RS.SessionID,
                PageNumber: pageNum,
                ParameterList: parameterList
            })
            .done(function (Data) { WritePage(Data, RS, pageNum, null, LoadOnly); if (!LoadOnly) LoadAllPages(RS, pageNum); })
            .fail(function () { console.log("error"); RemoveLoadingIndicator(RS); })
        }
    });

    $ViewReport_TD.append($ViewReport);
    var $SpaceTD = new $("<TD />");
    $SpaceTD.html("&nbsp");
    $Row.append($SpaceTD);
    $Row.append($ViewReport_TD);

    $ParameterContainer.append($Row);

    //Same Hierarchy with Toolbar
    $ParameterDiv.append($ParameterContainer);
    RS.$PageContainer.append($ParameterDiv);
    //RS.$PageContainer.append(WriteParameterToggle());
    //RS.$ReportContainer.append(RS.$PageContainer);   
    RemoveLoadingIndicator(RS);
}
function WriteParameterControl(RIContext) {
    var $TD_Lable = new $("<TD />");
    var $lable = new $("<span />");
    $lable.addClass("Parameter-Lable");
    var Name = RIContext.CurrObj.Name;
    $lable.html(Name);

    $TD_Lable.append($lable);

    //If the control have valid values, then generate a select control
    var $TD_Control = new $("<TD />");
    var $element = null;
    if (RIContext.CurrObj.ValidValues != "") {
        //dropdown with checkbox
        if (RIContext.CurrObj.MultiValue == "True") {
            $element = new $("<Div />");
            WriteDropDownWithCheckBox(RIContext.CurrObj, $element);
        }
        else {
            $element = new $("<select />");
            WriteDropDownControl(RIContext.CurrObj, $element);
        }
    }
    else {
        if (RIContext.CurrObj.Type == "Boolean") {
            var radioValues = new Array();
            radioValues[0] = "True";
            radioValues[1] = "False";

            $element = new $("<Div />");
            $element.attr("IsMultiple", RIContext.CurrObj.MultiValue);
            $element.attr("DataType", RIContext.CurrObj.Type);
            $element.addClass("Parameter-Div");
            for (value in radioValues) {
                var $radioItem = new $("<input/>");
                $radioItem.addClass("Parameter");
                $radioItem.addClass("Parameter-Radio");
                $radioItem.addClass(RIContext.CurrObj.Name);
                
                $radioItem.attr("type", "radio");
                $radioItem.attr("name", RIContext.CurrObj.Name);
                $radioItem.attr("value", radioValues[value]);
                $radioItem.attr("id", RIContext.CurrObj.Name + "_radio" + "_" + radioValues[value]);
                $radioItem.attr("DataType", RIContext.CurrObj.Type);
                GetParameterControlProperty(RIContext.CurrObj, $radioItem);

                var $lableTrue = new $("<lable/>");
                $lableTrue.html(radioValues[value]);
                $lableTrue.attr("for", RIContext.CurrObj.Name + "_radio" + "_" + radioValues[value]);

                $element.append($radioItem);
                $element.append($lableTrue);
            }
        }
        else {
            $element = new $("<input/>");
            $element.attr("class", "Parameter");
            $element.attr("IsMultiple", RIContext.CurrObj.MultiValue);
            $element.attr("DataType", RIContext.CurrObj.Type);
            $element.attr("type", "text");
            $element.attr("size", "30");
            $element.attr("id", Name);

            GetParameterControlProperty(RIContext.CurrObj, $element);

            switch (RIContext.CurrObj.Type) {
                case "DateTime":
                    //Format: ISO8601
                    $element.datepicker({ dateFormat: 'yy-mm-dd' });
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
    $TD_Control.append(AddNullableCheckBox(RIContext.CurrObj, $element));
    var $TD_Status = new $("<TD/>");
    $TD_Status.addClass("Status");
    RIContext.$HTMLParent.append($TD_Lable);
    RIContext.$HTMLParent.append($TD_Control);
    RIContext.$HTMLParent.append($TD_Status);

    return RIContext.$HTMLParent;
}
function WriteParameterToggle() {
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
}
function GetParameterControlProperty(Obj, $Control) {
    $Control.attr("name", Obj.Name);
    $Control.attr("AllowBlank", Obj.AllowBlank);
    if (Obj.QueryParameter == "True" | Obj.Nullable != "True") {
        $Control.attr("required", "true");
        $Control.watermark("Required");
    }

    //if (Obj.PromptUser == "True") {
    //    $Control.attr("Title", Obj.Prompt);
    //}
    $Control.attr("ErrorMessage", Obj.ErrorMessage);
}
function AddNullableCheckBox(Obj, $Control) {
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
}
function WriteDropDownControl(Obj, $Control) {
    $Control.addClass("Parameter");
    $Control.attr("IsMultiple", Obj.MultiValue);
    $Control.addClass("Parameter-Select");
    $Control.attr("id", Obj.Name);
    $Control.attr("DataType", Obj.Type);
    GetParameterControlProperty(Obj, $Control);

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
}
function WriteDropDownWithCheckBox(Obj, $Control) {
    var $MultipleCheckBox = new $("<Input />");
    $MultipleCheckBox.attr("type", "text");
    $MultipleCheckBox.attr("id", Obj.Name);
    $MultipleCheckBox.attr("class", "ParameterClient");
    $MultipleCheckBox.attr("IsMultiple", Obj.MultiValue);
    $MultipleCheckBox.attr("DataType", Obj.Type);
    GetParameterControlProperty(Obj, $MultipleCheckBox);
    $MultipleCheckBox.on("click", function () { PopupDropDownPanel(Obj); });

    var $HiddenCheckBox = new $("<Input />");
    $HiddenCheckBox.attr("type", "hidden");
    $HiddenCheckBox.attr("name", Obj.Name);
    $HiddenCheckBox.attr("IsMultiple", Obj.MultiValue);
    $HiddenCheckBox.attr("id", Obj.Name + "_hidden");
    $HiddenCheckBox.attr("class", "Parameter");
    $HiddenCheckBox.attr("DataType", Obj.Type);

    var $OpenDropDown = new $("<Img />");
    $OpenDropDown.attr("src", "./reportviewer/Images/OpenDropDown.png");
    $OpenDropDown.attr("alt", "Open DropDown List");
    $OpenDropDown.on("click", function () { PopupDropDownPanel(Obj); });

    var $DropDownContainer = new $("<Div />");
    $DropDownContainer.attr("id", Obj.Name + "_DropDown");
    $DropDownContainer.addClass("Parameter-DropDown");
    $DropDownContainer.addClass("Parameter-Dropdown-Hidden");

    var $Table = GetDefaultHTMLTable();
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
        $Checkbox.attr("id", Obj.Name + "_DropDown_" + value);
        $Checkbox.attr("class", Obj.Name + "_DropDown_CB");
        $Checkbox.attr("name", Obj.Name + "_DropDown_CB");
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
        $Lable.attr("id", Obj.Name + "_DropDown_" + value + "_lable");
        $Lable.html(key);

        //$Col.append($Checkbox);
        //$Col.append($Lable);
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
}
function PopupDropDownPanel(Obj) {
    $("#" + Obj.Name + "_DropDown").width($("#" + Obj.Name).width());
    if ($("#" + Obj.Name + "_DropDown").hasClass("Parameter-Dropdown-Hidden")) {
        $("#" + Obj.Name + "_DropDown").fadeOut("fast");
        $("#" + Obj.Name + "_DropDown").removeClass("Parameter-Dropdown-Hidden");
        $("#" + Obj.Name + "_DropDown").addClass("Parameter-Dropdown-Show");
    }
    else {
        $("#" + Obj.Name + "_DropDown").fadeIn("fast", function () {
            var ShowValue = "";
            var HiddenValue = "";
            $("." + Obj.Name + "_DropDown_CB").each(function (i) {
                if (this.checked & this.value != "Select All") {
                    ShowValue += $("#" + Obj.Name + "_DropDown_" + this.value + "_lable").html() + ",";
                    HiddenValue += this.value + ",";
                }
            });
            $("#" + Obj.Name).val(ShowValue.substr(0, ShowValue.length - 1));
            $("#" + Obj.Name + "_hidden").val(HiddenValue.substr(0, HiddenValue.length - 1));
        });
        $("#" + Obj.Name + "_DropDown").addClass("Parameter-Dropdown-Hidden");
        $("#" + Obj.Name + "_DropDown").removeClass("Parameter-Dropdown-Show");
    }
}
function GetParamsList() {
    var a = [];
    //Text
    $(".Parameter").filter(":text").each(function (i) {
        a.push({ name: this.name, ismultiple: $(this).attr("ismultiple"), type: $(this).attr("datatype"), value: IsParamNullable(this) });
    });
    //Hidden
    $(".Parameter").filter(":hidden").each(function (i) {
        a.push({ name: this.name, ismultiple: $(this).attr("ismultiple"), type: $(this).attr("datatype"), value: IsParamNullable(this) });
    });
    //dropdown
    $(".Parameter").filter("select").each(function (i) {
        a.push({ name: this.name, ismultiple: $(this).attr("ismultiple"), type: $(this).attr("datatype"), value: IsParamNullable(this) });
    });
    var RadioList = new Object();
    //radio-group by radio name, default value: null
    $(".Parameter").filter(":radio").each(function (i) {
        if (!(this.name in RadioList)) {
            RadioList[this.name] = null;
        }
        if (this.checked == true) {
            RadioList[this.name] = IsParamNullable(this);
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
}
function IsParamNullable(Parameter) {
    var checkbox = $(".Parameter-Checkbox").filter("[name='" + Parameter.name + "']").first();
    if (checkbox.attr("checked") == "checked")
        return null;
    else
        return Parameter.value;
}
function ResetValidateMessage() {
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
}