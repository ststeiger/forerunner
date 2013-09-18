/**
 * @file Contains the parameter widget.
 *
 */

// Assign or create the single globally scoped variable
var forerunner = forerunner || {};

// Forerunner SQL Server Reports
forerunner.ssr = forerunner.ssr || {};

$(function () {
    var widgets = forerunner.ssr.constants.widgets;
    var events = forerunner.ssr.constants.events;
    var paramContainerClass = "fr-param-container";
    /**
     * report parameter widget used with the reportViewer
     *
     * @namespace $.forerunner.reportParameter
     * @prop {object} options - The options for report parameter
     * @prop {Object} options.$reportViewer - The report viewer widget
     * @example
     * $paramArea.reportParameter({ $reportViewer: this });
     * $("#paramArea").reportParameter({
     *  $reportViewer: $viewer
	 * });    
     */
    $.widget(widgets.getFullname(widgets.reportParameter), {
        options: {
            $reportViewer: null,
            pageNum: null,
        },
        _formInit: false,
        _paramCount: 0,
        _defaultValueExist: false,
        _loadedForDefault: true,

        _savedParamExist:false,
        _savedParamList: null,
        _savedParamCount: 0,

        _init: function () {
            var me = this;
            me.element.html(null);
        },
        _destroy: function () {
            
        },
        _render: function () {
            var me = this;
            
            me.element.html(null);
            var $params = new $("<div class=" + paramContainerClass + ">" +
                "<form name='ParameterForm' onsubmit='return false'>" +
                   "<div class='fr-param-element-border'><input type='text' style='display:none'></div>" +
                   "<div class='fr-param-submit-container'>" +
                      "<input name='Parameter_ViewReport' type='button' class='fr-param-viewreport' value='" + me.options.$reportViewer.locData.paramPane.viewReport + "'/>" +
                   "</div>" +
                "</form></div>");
            me.element.css("display", "block");
            me.element.html($params);

            me._formInit = true;
        },
        /**
         * @function $.forerunner.reportParameter#writeParameterPanel
         * @Generate parameter html code and append to the dom tree
         * @param {String} data - original data get from server client
         */
        writeParameterPanel: function (data, rs, pageNum) {
            var me = this;
            me.options.pageNum = pageNum;            
            me._paramCount = parseInt(data.Count, 10);

            me._defaultValueExist = data.DefaultValueExist && !me._savedParamExist;
            me._loadedForDefault = true && !me._savedParamExist;
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
                            error.appendTo(element.nextAll(".fr-param-error-placeholder"));
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
            else if (me._paramCount === me._savedParamCount)
                me._submitForm();
            else {
                me._trigger(events.render);
                me.options.$reportViewer.removeLoadingIndicator();
            }

            //jquery adds height, remove it
            var pc = me.element.find("." + paramContainerClass);
            pc.removeAttr("style"); 

            me._savedParamExist = false;
            me._savedParamCount = 0;

            me._setDatePicker();
            $(document).on("click", function (e) { me._checkExternalClick(e); });
        },
        _submitForm: function () {
            var me = this;

            me._closeAllDropdown();
            var paramList = me.getParamsList();
            if (paramList) {
                me.options.$reportViewer.loadReportWithNewParameters(paramList);
                me._trigger(events.submit);
            }
        },
        overrideDefaultParams: function (overrideParams) {
            var me = this;
            me._savedParamList = {};
            me._savedParamCount = 0;
            me._savedParamExist = true;
            $.each(overrideParams.ParamsList, function (index, param) {
                me._savedParamList[param.Parameter] = param.Value;
                me._savedParamCount++;
                });
        },
        _setDatePicker: function () {
            var me = this;

            $.each(me.element.find(".hasDatepicker"), function (index, datePicker) {
                $(datePicker).datepicker("option", "buttonImage", forerunner.config.forerunnerFolder() + "/reportviewer/Images/calendar.gif");
                $(datePicker).datepicker("option", "buttonImageOnly", true);
            });
        },
        _getPredefinedValue: function (param) {
            var me = this;
            //if saved param exist then used it else user default value
            if (me._savedParamExist) {
                return me._savedParamList[param.Name];
            }
            else if (me._hasDefaultValue(param)) {
                if (param.MultiValue==="False")
                    return param.DefaultValues[0];
                else
                    return param.DefaultValues;
            }

            return null;
        },
        _writeParamControl: function (param, $parent) {
            var me = this;
            var $lable = new $("<div class='fr-param-label'>" + param.Name + "</div>");
            var bindingEnter = true;
            
            //If the control have valid values, then generate a select control
            var $container = new $("<div class='fr-param-item-container'></div>");
            var $errorMsg = new $("<span class='fr-param-error-placeholder'/>");
            var $element = null;

            if (param.MultiValue === "True") { // Allow multiple values in one textbox

                if (param.ValidValues !== "") { // Dropdown with checkbox
                    $element = me._writeDropDownWithCheckBox(param);
                }
                else if (param.DefaultValues !== "") { // Dropdown with editable textarea
                    bindingEnter = false;
                    $element = me._writeDropDownWithTextArea(param);
                }
            }
            else { // Only one value allowed

                if (param.ValidValues !== "") { // Dropdown box
                    $element = me._writeDropDownControl(param);
                }
                else if (param.Type === "Boolean") {
                    //Radio Button, RS will return MultiValue false even set it to true
                    $element = me._writeRadioButton(param);
                }
                else { // Textbox
                    $element = me._writeTextArea(param);
                }
            }

            if ($element !== undefined && bindingEnter) {
                $element.on("keydown", function (e) {
                    if (e.keyCode === 13) {
                        me._submitForm();
                    } // Enter
                });               
            }
            $container.append($element).append(me._addNullableCheckBox(param, $element)).append($errorMsg);
            $parent.append($lable).append($container);

            return $parent;
        },
        _getParameterControlProperty: function (param, $control) {
            var me = this;
            $control.attr("AllowBlank", param.AllowBlank);
            if (param.Nullable !== "True") {
                $control.attr("required", "true").watermark(me.options.$reportViewer.locData.paramPane.required);
            }
            $control.attr("ErrorMessage", param.ErrorMessage);
        },
        _addNullableCheckBox: function (param, $control) {
            var me = this;
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
                $nullableLable.html(me.options.$reportViewer.locData.paramPane.nullField);

                $nullableSpan.append($checkbox).append($nullableLable);
                return $nullableSpan;
            }
            else
                return null;
        },
        _writeRadioButton: function (param) {
            var me = this;
            var predefinedValue = me._getPredefinedValue(param);
            var paramPane = me.options.$reportViewer.locData.paramPane;
            var radioValues = [];
            radioValues[0] = { display: paramPane.isTrue, value: "True"};
            radioValues[1] = { display: paramPane.isFalse, value: "False" };

            var $control = new $("<div class='fr-param-checkbox-container' ismultiple='" + param.MultiValue + "' datatype='" + param.Type + "' ></div>");

            for (var i = 0; i < radioValues.length; i++) {
                var $radioItem = new $("<input type='radio' class='fr-param fr-param-radio " + param.Name + "' name='" + param.Name + "' value='" + radioValues[i].value +
                    "' id='" + param.Name + "_radio" + "_" + radioValues[i].value + "' datatype='" + param.Type + "' />");
                me._getParameterControlProperty(param, $radioItem);
                
                if (predefinedValue) {
                    if (param.Nullable === "True")
                        $radioItem.attr("disabled", "true");
                    else if (predefinedValue === radioValues[i].value)
                        $radioItem.attr("checked", "true");
                }

                if (me._paramCount === 1)
                    $radioItem.on("click", function () { me._submitForm(); });

                var $label = new $("<label class='fr-param-radio-label' for='" + param.Name + "_radio" + "_" + radioValues[i].value + "'>" + radioValues[i].display + "</label>");

                $control.append($radioItem);
                $control.append($label);
            }

            return $control;
        },
        _writeTextArea: function (param) {
            var me = this;
            var predefinedValue = me._getPredefinedValue(param);
            var $control = new $("<input class='fr-param' type='text' size='100' ismultiple='" + param.MultiValue + "' datatype='" + param.Type + "'  name='" + param.Name + "'/>");
            me._getParameterControlProperty(param, $control);

            switch (param.Type) {
                case "DateTime":
                    $control.datepicker({
                        showOn: "button",
                        dateFormat: "yy-mm-dd", //Format: ISO8601
                        changeMonth: true,
                        changeYear: true,
                        showButtonPanel: true,
                        gotoCurrent: true,
                        closeText: "Close",
                        onClose: function () {
                            $control.removeAttr("disabled");
                            $("[name='" + param.Name + "']").valid();
                            if (me._paramCount === 1)
                                me._submitForm();
                        },
                        beforeShow: function () {
                            $control.attr("disabled", true);
                        },
                    });
                    $control.attr("dateISO", "true");

                    if (predefinedValue)
                        $control.datepicker("setDate", me._getDateTimeFromDefault(predefinedValue));
                    break;
                case "Integer":
                case "Float":
                    $control.attr("number", "true");
                    if (predefinedValue) {
                        $control.val(predefinedValue);
                    }
                    break;
                case "String":
                    if (predefinedValue) {
                        $control.val(predefinedValue);
                    }
                    //if (param.DefaultValues[0] === "")                        
                    //    $control.attr("disabled", "true").removeClass("fr-param-enable").addClass("fr-param-disable");
                    break;
            }

            return $control;
        },
        _writeDropDownControl: function (param) {
            var me = this;
            var canLoad = false;
            var predefinedValue = me._getPredefinedValue(param);
            var $control = $("<select class='fr-param fr-param-select' ismultiple='" + param.MultiValue + "' name='" + param.Name + "' datatype='" + param.Type + "' readonly='true'>");
            me._getParameterControlProperty(param, $control);

            var $defaultOption = new $("<option value=''>&#60Select a Value&#62</option>");
            $control.append($defaultOption);

            for (var i = 0; i < param.ValidValues.length;i++) {
                var optionValue = param.ValidValues[i].Value;
                var $option = new $("<option value='" + optionValue + "'>" + param.ValidValues[i].Key + "</option>");
                
                if (predefinedValue && predefinedValue === optionValue) {
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
            var predefinedValue = me._getPredefinedValue(param);
            var $control = new $("<div style='display:inline-block;'/>");

            var $multipleCheckBox = new $("<Input type='text' class='fr-param-client fr-param-dropdown-textbox' id='" + param.Name + "_fore' name='" + param.Name + "' readonly='true' ismultiple='" + param.MultiValue + "' datatype='" + param.Type + "'/>");
            me._getParameterControlProperty(param, $multipleCheckBox);
            $multipleCheckBox.on("click", function () { me._popupDropDownPanel(param); });

            var $hiddenCheckBox = new $("<Input id='" + param.Name + "_hidden' class='fr-param' type='hidden' name='" + param.Name + "' ismultiple='" + param.MultiValue + "' datatype='" + param.Type + "'/>");

            var $openDropDown = new $("<Img class='fr-param-dropdown-img' alt='Open DropDown List' src='" + forerunner.config.forerunnerFolder() + "/ReportViewer/images/OpenDropDown.png' name='" + param.Name + "OpenDropDown' />");
            $openDropDown.on("click", function () { me._popupDropDownPanel(param); });

            var $dropDownContainer = new $("<div class='fr-param-dropdown' name='" + param.Name + "_DropDownContainer' value='" + param.Name + "' />");

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
                var $checkbox = new $("<input type='checkbox' class='fr-param-dropdown-checkbox " + param.Name + "_DropDown_CB' id='" + param.Name + "_DropDown_" + value + "' value='" + value + "' />");

                if (predefinedValue && me._contains(predefinedValue, value)) {
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

                var $label = new $("<label for='" + param.Name + "_DropDown_" + value + "' class='fr-param-dropdown-label " + param.Name + "_DropDown_lable" + "' name='"
                    + param.Name + "_DropDown_" + value + "_lable" + "'/>");
                $label.html(key);

                $span.append($checkbox).append($label);
                $col.append($span);
                $row.append($col);
                $table.append($row);
            }
            $dropDownContainer.append($table);

            if (predefinedValue) {
                $multipleCheckBox.val(keys.substr(0, keys.length - 1));
                $hiddenCheckBox.val(values.substr(0, values.length - 1));
            }

            $control.append($multipleCheckBox).append($hiddenCheckBox).append($openDropDown).append($dropDownContainer);

            return $control;
        },
        _writeDropDownWithTextArea: function (param) {
            var me = this;
            var predefinedValue = me._getPredefinedValue(param);
            me._getTextAreaValue(predefinedValue);
            var $control = new $("<div style='display:inline-block;'/>");

            var $multipleTextArea = new $("<Input type='text' class='fr-param fr-param-dropdown-textbox' id='" + param.Name + "' name='" + param.Name + "' readonly='true' ismultiple='" + param.MultiValue + "' datatype='" + param.Type + "' />");
            me._getParameterControlProperty(param, $multipleTextArea);
            $multipleTextArea.on("click", function () { me._popupDropDownPanel(param); });

            var $openDropDown = new $("<Img class='fr-param-dropdown-img' alt='Open DropDown List' src='" + forerunner.config.forerunnerFolder() + "/ReportViewer/images/OpenDropDown.png' name='" + param.Name + "OpenDropDown' />");
            $openDropDown.on("click", function () { me._popupDropDownPanel(param); });

            var $dropDownContainer = new $("<div class='fr-param-dropdown' name='" + param.Name + "_DropDownContainer' value='" + param.Name + "' />");

            var $textarea = new $("<textarea name='" + param.Name + "_DropDownTextArea' class='fr-param-dropdown-textarea' />");
            
            $textarea.val(me._getTextAreaValue(predefinedValue, true));
            $multipleTextArea.val(me._getTextAreaValue(predefinedValue, false));

            $dropDownContainer.append($textarea);
            $control.append($multipleTextArea).append($openDropDown).append($dropDownContainer);
            return $control;
        },
        _getTextAreaValue: function (predifinedValue, forArea) {
            var result = "";
            if (forArea) {
                for (var i = 0; i < predifinedValue.length; i++) {
                    result += predifinedValue[i] + "\n";
                }
            }
            else {
                for (var j = 0; j < predifinedValue.length; j++) {
                    result += predifinedValue[j] + ",";
                }
                result = result.substr(0, result.length - 1);
            }
            return result;
        },
        _setMultipleInputValues: function (param) {
            var target = $("[name='" + param.Name + "']");

            if (target.hasClass("fr-param-client")) {
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
            }
            else {
                var currentValue = target.val();
                var newValue = $("[name='" + param.Name + "_DropDownTextArea']").val();
                newValue=newValue.replace(/\n+/g,",");
                
                if (newValue.charAt(newValue.length - 1) === ",") {
                    newValue = newValue.substr(0, newValue.length - 1);
                }
                target.val(newValue);
            }
        },
        _popupDropDownPanel: function(param) {
            var me = this;
            me._closeAllDropdown();

            var $container = $(".fr-layout-rightpanecontent");
            var scrollTop = $container.scrollTop();
            var $dropDown = $("[name='" + param.Name + "_DropDownContainer']");
            var $multipleControl = $("[name='" + param.Name + "']");
            var positionTop = $multipleControl.offset().top;
            
            if ($container.height() - positionTop - $multipleControl.height() < $dropDown.height()) {
                $dropDown.css("top", positionTop - $dropDown.height() - 48 + scrollTop);
            }
            else {
                $dropDown.css("top", positionTop + $multipleControl.height() - 28 + scrollTop);
            }

            if ($dropDown.is(":hidden")){
                $dropDown.width($multipleControl.width()).addClass("fr-param-dropdown-show").show(10);
            }
            else {
                me._closeDropDownPanel(param);
            }
        },
        _closeDropDownPanel: function (param) {
            var me = this;
            me._setMultipleInputValues(param);
            $("[name='" + param.Name + "_DropDownContainer']").removeClass("fr-param-dropdown-show").hide();
            //$("[name='" + param.Name + "']").focus().blur().focus();
        },
        _closeAllDropdown: function () {
            var me = this;
            $(".fr-param-dropdown").filter(":visible").each(function (index, param) {
                me._closeDropDownPanel({ Name: $(param).attr("value") });
            });
        },
        _checkExternalClick:function(e){
            var me = this;
            var $target = $(e.target);

            if (!$target.hasClass("fr-param-dropdown-img") &&
                !$target.hasClass("fr-param-dropdown-textbox") &&
                !$target.hasClass("fr-param-dropdown") &&
                !$target.hasClass("fr-param-dropdown-label") &&
                !$target.hasClass("fr-param-dropdown-checkbox") &&
                !$target.hasClass("fr-param-dropdown-textarea")) {
                me._closeAllDropdown();
            }
        },
        /**
         * @function $.forerunner.reportParameter#getParamList
         * @generate parameter list base on the user input and return
         */
        getParamsList: function () {
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
                        tempJson += "{\"Parameter\":\"" + a[i].name + "\",\"IsMultiple\":\"" + a[i].ismultiple + "\",\"Type\":\"" + a[i].type + "\",\"Value\":\"" + a[i].value + "\"},";
                    }
                    else {
                        tempJson += "{\"Parameter\":\"" + a[i].name + "\",\"IsMultiple\":\"" + a[i].ismultiple + "\",\"Type\":\"" + a[i].type + "\",\"Value\":\"" + a[i].value + "\"}";
                    }
                }
                tempJson += "]";
                return "{\"ParamsList\":" + tempJson + "}";
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
        /**
        * @function $.forerunner.reportParameter#resetValidateMessage
        * @customize jquery.validate message
        */
        resetValidateMessage: function () {
            var me = this;
            var error = me.options.$reportViewer.locData.validateError;
            
            jQuery.extend(jQuery.validator.messages, {
                required: error.required,
                remote: error.remote,
                email: error.email,
                url: error.url,
                date: error.date,
                dateISO: error.dateISO,
                number: error.number,
                digits: error.digits,
                maxlength: $.validator.format(error.maxlength),
                minlength: $.validator.format(error.minlength),
                rangelength: $.validator.format(error.rangelength),
                range: $.validator.format(error.range),
                max: $.validator.format(error.max),
                min: $.validator.format(error.min)
            });
        },
        /**
        * @function $.forerunner.reportParameter#removeParameter
        * @remove parameter element form the dom tree
        */
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

            //dateISO: yyyy-mm-dd
            if (/^(\d{4})-(0\d{1}|1[0-2])-(0\d{1}|[12]\d{1}|3[01])$/.test(defaultDatetime))
                return defaultDatetime;

            var date = defaultDatetime.substr(0, defaultDatetime.indexOf(" "));

            var datetime = date.substring(date.lastIndexOf("/") + 1, defaultDatetime.indexOf(" ")) + "-" +
                           date.substring(0, date.indexOf("/")) + "-" +
                           date.substring(date.indexOf("/") + 1, date.lastIndexOf("/"));
            return datetime;
        },
    });  // $.widget
});