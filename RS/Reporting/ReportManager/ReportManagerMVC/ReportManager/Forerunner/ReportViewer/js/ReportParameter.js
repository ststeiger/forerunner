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
            $appContainer: null
        },

        $params: null,
        _formInit: false,
        _paramCount: 0,
        _defaultValueExist: false,
        _loadedForDefault: true,
        _reportDesignError: null,

        _init: function () {
            var me = this;
            me.element.html(null);
        },
        _destroy: function () {

        },
        _render: function () {
            var me = this;

            me.element.html(null);
            var $params = new $("<div class='" + paramContainerClass + " fr-core-widget'>" +
                "<form class='fr-param-form' onsubmit='return false'>" +
                   "<div class='fr-param-element-border'><input type='text' style='display:none'></div>" +
                   "<div>" +
                       "<div class='fr-param-submit-container'>" +
                          "<input name='Parameter_ViewReport' type='button' class='fr-param-viewreport' value='" + me.options.$reportViewer.locData.paramPane.viewReport + "'/>" +
                       "</div>" +
                       "<div class='fr-param-cancel-container'>" +
                          "<input type='button' class='fr-param-cancel' value='" + me.options.$reportViewer.locData.paramPane.cancel + "'/>" +
                       "</div>" +
                    "</div>" +
                "</form>" +
                "<div style='height:65px;'/>" +
                "</div>");
            me.element.css("display", "block");
            me.element.html($params);
            me.$params = $params;
            me._formInit = true;
        },

        /**
         * @function $.forerunner.reportParameter#getNumOfVisibleParameters
         * @return {int} The number of visible parameters.
         */
        getNumOfVisibleParameters: function () {
            var me = this;
            if (me.$numVisibleParams !== undefined)
                return me.$numVisibleParams;
            return 0;
        },
    
        _parameterDefinitions: {},
        _hasPostedBackWithoutSubmitForm : false,
        /**
         * @function $.forerunner.reportParameter#updateParameterPanel
         * @Update an existing parameter panel by posting back current selected values to update casacade parameters.
         * @param {String} data - original data get from server client
         * @param {boolean} submitForm - submit form when parameters are satisfied.
         * @param {boolean} Whether to make parameter area visible.
         */
        updateParameterPanel: function (data, submitForm, pageNum, renderParamArea) {
            this.removeParameter();
            this._hasPostedBackWithoutSubmitForm = true;
            this.writeParameterPanel(data, pageNum, submitForm, renderParamArea);
        },

        /**
         * @function $.forerunner.reportParameter#setParametersAndUpdate
         * @Set the parameter panel to the given list
         * @param {Object} paramDefs - Parameter definition.
         * @param {string} paramsList - Parameter List.
         * @param {int} pageNum - Current page number.
        */
        setParametersAndUpdate: function (paramDefs, paramsList, pageNum) {
            var me = this;
            me.updateParameterPanel(paramDefs, false, pageNum, false);
            me._submittedParamsList = paramsList;
            this._hasPostedBackWithoutSubmitForm = false;
            me.revertParameters();
        },

        /**
         * @function $.forerunner.reportParameter#writeParameterPanel
         * @Generate parameter html code and append to the dom tree
         * @param {String} data - original data get from server client
         * @param {int} pageNum - current page num
         * @param {boolean} submitForm - whether to submit form if all parameters are satisfied.
         * @param {boolean} Whether to make parameter area visible.
         */
        writeParameterPanel: function (data, pageNum, submitForm, renderParamArea) {
            var me = this;
            if (me.$params === null) me._render();

            me.options.pageNum = pageNum;
            me._paramCount = parseInt(data.Count, 10);

            me._defaultValueExist = data.DefaultValueExist;
            me._loadedForDefault = true;
            me._render();
            me.$numVisibleParams = 0;

            var $eleBorder = $(".fr-param-element-border", me.$params);
            $.each(data.ParametersList, function (index, param) {
                me._parameterDefinitions[param.Name] = param;
                if (param.Prompt !== "" && (param.PromptUserSpecified ? param.PromptUser : true)) {
                    $eleBorder.append(me._writeParamControl(param, new $("<div />"), pageNum));
                    me.$numVisibleParams += 1;
                }
                else
                    me._checkHiddenParam(param);
            });

            if (me._reportDesignError !== null)
                me._reportDesignError += me.options.$reportViewer.locData.messages.contactAdmin;

            me.resetValidateMessage();
            $(".fr-param-form", me.$params).validate({
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
            $(".fr-param-viewreport", me.$params).on("click", function () {
                me._submitForm(pageNum);
            });
            $(".fr-param-cancel", me.$params).on("click", function () {
                me._cancelForm();
            });

            if (submitForm !== false) {
                if (me._paramCount === data.DefaultValueCount && me._loadedForDefault)
                    me._submitForm(pageNum);
                else {
                    if (renderParamArea !== false)
                        me._trigger(events.render);
                    me.options.$reportViewer.removeLoadingIndicator();
                }
            } else {
                if (renderParamArea !== false)
                    me._trigger(events.render);
                me.options.$reportViewer.removeLoadingIndicator();
            }

            //jquery adds height, remove it
            var pc = me.element.find("." + paramContainerClass);
            pc.removeAttr("style");

            me._setDatePicker();
            $(document).on("click", function (e) { me._checkExternalClick(e); });


            $(":text", me.$params).each(
                function (index) {
                    var textinput = $(this);
                    textinput.on("blur", function () { me.options.$reportViewer.onInputBlur(); });
                    textinput.on("focus", function () { me.options.$reportViewer.onInputFocus(); });
                }
            );
        },

        _submittedParamsList: null,

        /*
         * @function $.forerunner.reportParameter#setsubmittedParamsList
         * @Set the submitted parameter list state to the parameter list.
         * @param {String} paramList - Parameter List
         */
        setsubmittedParamsList: function (paramList) {
            var me = this;
            me._submittedParamsList = paramList;
        },

        _submitForm: function (pageNum) {
            var me = this;
            me._closeAllDropdown();

            if (me._reportDesignError !== null) {
                forerunner.dialog.showMessageBox(me.options.$appContainer, me._reportDesignError);
                return;
            }

            var paramList = me.getParamsList();
            if (paramList) {
                me.options.$reportViewer.loadReportWithNewParameters(paramList, pageNum);
                me._submittedParamsList = paramList;
                me._trigger(events.submit);
            }
            me._hasPostedBackWithoutSubmitForm = false;
        },
        /**
         * @function $.forerunner.reportParameter#revertParameters
         * @Revert any unsubmitted parameters.  Called in two scenario:  when cancelling out from parameter area or 
         *  before submitting an action when the set of parameters for the session does not match the loaded report.
         */
        revertParameters: function () {
            var me = this;
            if (me.getParamsList() === me._submittedParamsList) {
                return;
            }
            if (me._submittedParamsList !== null) {
                if (me._hasPostedBackWithoutSubmitForm) {
                    me.refreshParameters(me._submittedParamsList);
                    me._hasPostedBackWithoutSubmitForm = false;

                    me.options.$reportViewer.invalidateReportContext();
                }
                var submittedParameters = JSON.parse(me._submittedParamsList);
                var list = submittedParameters.ParamsList;
                var $control;
                for (var i = 0; i < list.length; i++) {
                    var savedParam = list[i];
                    var paramDefinition = me._parameterDefinitions[savedParam.Parameter];
                    if (paramDefinition.MultiValue) {
                        if (paramDefinition.ValidValues !== "") {
                            $control = $(".fr-paramname-" + paramDefinition.Name + "-dropdown-cb", me.$params);
                            me._setCheckBoxes($control, savedParam.Value);
                            me._setMultipleInputValues(paramDefinition);
                        } else {
                            $control = $(".fr-paramname-" + paramDefinition.Name);
                            var $dropdownText = $(".fr-paramname-" + paramDefinition.Name + "-dropdown-textArea");
                            $dropdownText.val(me._getTextAreaValue(savedParam.Value, true));
                            $control.val(me._getTextAreaValue(savedParam.Value, false));
                            $control.attr("jsonValues", JSON.stringify(savedParam.Value));
                        }
                    } else {
                        $control = $(".fr-paramname-" + paramDefinition.Name, me.$params);
                        if (paramDefinition.ValidValues !== "") {
                            me._setSelectedIndex($control, savedParam.Value);
                        } else if (paramDefinition.Type === "Boolean") {
                            me._setRadioButton($control, savedParam.Value);
                        } else {
                            $control.val(savedParam.Value);
                        }
                    }
                }
            }
        },
        _cancelForm: function () {
            var me = this;
            me._closeAllDropdown();
            me.revertParameters();
            me._trigger(events.cancel, null, {});
        },
        _setDatePicker: function () {
            var me = this;

            var dpLoc = me._getDatePickerLoc();
            if (dpLoc)
                $.datepicker.setDefaults(dpLoc);
            
            $.each(me.element.find(".hasDatepicker"), function (index, datePicker) {
                $(datePicker).datepicker("option", "buttonImage", forerunner.config.forerunnerFolder() + "/reportviewer/Images/calendar.png");
                $(datePicker).datepicker("option", "buttonImageOnly", true);
                $(datePicker).datepicker("option", "buttonText", me.options.$reportViewer.locData.paramPane.datePicker);
            });
        },
        _getPredefinedValue: function (param) {
            var me = this;
            if (me._hasDefaultValue(param)) {
                if (param.MultiValue === false)
                    return param.DefaultValues[0];
                else
                    return param.DefaultValues;
            }

            return null;
        },
        _writeParamControl: function (param, $parent, pageNum) {
            var me = this;
            var $label = new $("<div class='fr-param-label'>" + param.Prompt + "</div>");
            var bindingEnter = true;
            var dependenceDisable = me._checkDependencies(param);

            //if any element disable exist then not submit form auto
            if (dependenceDisable) me._loadedForDefault = false
            //If the control have valid values, then generate a select control
            var $container = new $("<div class='fr-param-item-container'></div>");
            var $errorMsg = new $("<span class='fr-param-error-placeholder'/>");
            var $element = null;

            if (param.MultiValue === true) { // Allow multiple values in one textbox

                if (param.ValidValues !== "") { // Dropdown with checkbox
                    $element = me._writeDropDownWithCheckBox(param, dependenceDisable);
                }
                else {//if (param.DefaultValues !== "") { // Dropdown with editable textarea
                    bindingEnter = false;
                    $element = me._writeDropDownWithTextArea(param, dependenceDisable);
                }
            }
            else { // Only one value allowed

                if (param.ValidValues !== "") { // Dropdown box
                    $element = me._writeDropDownControl(param, dependenceDisable, pageNum);
                }
                else if (param.Type === "Boolean") {
                    //Radio Button, RS will return MultiValue false even set it to true
                    $element = me._writeRadioButton(param, dependenceDisable, pageNum);
                }
                else { // Textbox
                    $element = me._writeTextArea(param, dependenceDisable, pageNum);
                }
            }

            if ($element !== undefined && bindingEnter) {
                $element.on("keydown", function (e) {
                    if (e.keyCode === 13) {
                        me._submitForm(pageNum);
                    } // Enter
                });
            }

            $container.append($element).append(me._addNullableCheckBox(param, $element)).append($errorMsg);
            $parent.append($label).append($container);

            return $parent;
        },
        _getParameterControlProperty: function (param, $control) {
            var me = this;
            $control.attr("allowblank", param.AllowBlank);
            $control.attr("nullable", param.Nullable);
            if (param.Nullable === false && param.AllowBlank === false) {
                $control.attr("required", "true").watermark(me.options.$reportViewer.locData.paramPane.required, {useNative : false, className: "fr-param-watermark" });
                $control.addClass("fr-param-required");
            }
            $control.attr("ErrorMessage", param.ErrorMessage);
        },
        _addNullableCheckBox: function (param, $control) {
            var me = this;
            if (param.Nullable === true) {
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
        _setRadioButton: function (s, v) {
            for (var i = 0; i < s.length; i++) {
                if (s[i].value === v) {
                    s[i].checked = true;
                } else {
                    s[i].checked = false;
                }
            }
        },
        _writeRadioButton: function (param, dependenceDisable, pageNum) {
            var me = this;
            var predefinedValue = me._getPredefinedValue(param);
            var paramPane = me.options.$reportViewer.locData.paramPane;
            var radioValues = [];
            radioValues[0] = { display: paramPane.isTrue, value: "True" };
            radioValues[1] = { display: paramPane.isFalse, value: "False" };

            var $control = me._createDiv("fr-param-checkbox-container");
            $control.attr("ismultiple", param.MultiValue);
            $control.attr("datatype", param.Type);

            for (var i = 0; i < radioValues.length; i++) {
                var $radioItem = new $("<input type='radio' class='fr-param fr-param-radio fr-paramname-" + param.Name + "' name='" + param.Name + "' value='" + radioValues[i].value +
                    "' datatype='" + param.Type + "' />");
                if (dependenceDisable) {
                    me._disabledSubSequenceControl($control);
                }
                else {
                    me._getParameterControlProperty(param, $radioItem);

                    if (predefinedValue) {
                        if (param.Nullable === true)
                            $radioItem.attr("disabled", "true");
                        else if (predefinedValue === radioValues[i].value)
                            $radioItem.attr("checked", "true");
                    }

                    if (me._paramCount === 1)
                        $radioItem.on("click", function () { me._submitForm(pageNum); });
                }
                var $label = new $("<label class='fr-param-radio-label'>" + radioValues[i].display + "</label>");

                $control.append($radioItem);
                $control.append($label);
            }

            return $control;
        },
        _writeTextArea: function (param, dependenceDisable, pageNum) {
            var me = this;
            var predefinedValue = me._getPredefinedValue(param);
            var $control = new $("<input class='fr-param fr-paramname-" + param.Name + "' name='" + param.Name + "' type='text' size='100' ismultiple='"
                + param.MultiValue + "' datatype='" + param.Type + "' />");

            if (dependenceDisable) {
                me._disabledSubSequenceControl($control);
                return $control;
            }

            me._getParameterControlProperty(param, $control);
            switch (param.Type) {
                case "DateTime":
                    $control.datepicker({
                        showOn: "button",
                        dateFormat: "yy-mm-dd", //Format: ISO8601
                        changeMonth: true,
                        changeYear: true,
                        showButtonPanel: true,
                        //gotoCurrent: true,
                        onClose: function () {
                            $control.removeAttr("disabled");
                            $(".fr-paramname-" + param.Name, me.$params).valid();
                            if (me._paramCount === 1)
                                me._submitForm(pageNum);
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
                    break;
            }
            return $control;
        },
        _setSelectedIndex: function (s, v) {
            var options = s[0];
            for ( var i = 0; i < options.length; i++ ) {
                if (options[i].value === v) {
                    options[i].selected = true;
                    return;
                }
            }
        },
        _writeDropDownControl: function (param, dependenceDisable, pageNum) {
            var me = this;
            var canLoad = false;
            var predefinedValue = me._getPredefinedValue(param);
            var $control = new $("<select class='fr-param fr-param-select fr-paramname-" + param.Name + "' name='" + param.Name + "' ismultiple='" +
                param.MultiValue + "' datatype='" + param.Type + "' readonly='true'>");

            if (dependenceDisable) {
                me._disabledSubSequenceControl($control);
                return $control;
            }

            me._getParameterControlProperty(param, $control);
            var $defaultOption = new $("<option value=''>&#60Select a Value&#62</option>");
            $control.append($defaultOption);

            for (var i = 0; i < param.ValidValues.length; i++) {
                var optionValue = param.ValidValues[i].Value;
                var $option = new $("<option value='" + optionValue + "'>" + forerunner.helper.htmlEncode(param.ValidValues[i].Key) + "</option>");

                if (predefinedValue && predefinedValue === optionValue) {
                    $option.attr("selected", "true");
                    $control.attr("title", param.ValidValues[i].Key);
                    canLoad = true;
                }

                $control.append($option);
            }
            if (!canLoad) me._loadedForDefault = false;

            $control.on("change", function () {
                $control.attr("title", $(this).find("option:selected").text());
            });

            if (me._paramCount === 1) {
                $control.on("change", function () { me._submitForm(pageNum); });
            }

            return $control;
        },
        _createInput : function(param, type, readonly, listOfClasses) {
            var $input = new $("<Input />");
            $input.attr("type", type);
            $input.attr("name", param.Name);
            $input.attr("ismultiple", param.MultiValue);
            $input.attr("datatype", param.Type);
            if (readonly) {
                $input.attr("readonly", true);
            }
            for (var i = 0; i < listOfClasses.length; i++) {
                $input.addClass(listOfClasses[i]);
            }
            return $input;
        },
        _createDiv : function(listOfClasses) {
            var $div = new $("<div />");
            for (var i = 0; i < listOfClasses.length; i++) {
                $div.addClass(listOfClasses[i]);
            }
            return $div;
        },
        _createLabel: function (listOfClasses) {
            var $label = new $("<label />");
            for (var i = 0; i < listOfClasses.length; i++) {
                $label.addClass(listOfClasses[i]);
            }
            return $label;
        },
        _writeDropDownWithCheckBox: function (param, dependenceDisable) {
            var me = this;
            var predefinedValue = me._getPredefinedValue(param);
            var $control = me._createDiv(["fr-param-element-container"]);

            var $multipleCheckBox = me._createInput(param, "text", true, ["fr-param-client", "fr-param-dropdown-textbox", "fr-paramname-" + param.Name]);

            var $openDropDown = me._createDiv(["fr-param-dropdown-iconcontainer", "fr-core-cursorpointer"]);
            var $dropdownicon = me._createDiv(["fr-param-dropdown-icon"]);
            $openDropDown.append($dropdownicon);

            if (dependenceDisable) {
                me._disabledSubSequenceControl($multipleCheckBox);
                $control.append($multipleCheckBox).append($openDropDown);
                return $control;
            }

            me._getParameterControlProperty(param, $multipleCheckBox);
            var $hiddenCheckBox = me._createInput(param, "hidden", false, ["fr-param", "fr-paramname-" + param.Name + "-hidden"]);
           
            $openDropDown.on("click", function () { me._popupDropDownPanel(param); });
            $multipleCheckBox.on("click", function () { me._popupDropDownPanel(param); });

            var $dropDownContainer = me._createDiv(["fr-param-dropdown", "fr-paramname-" + param.Name + "-dropdown-container"]);
            $dropDownContainer.attr("value", param.Name);

            var $table = me._getDefaultHTMLTable();
            if (param.ValidValues.length && param.ValidValues[param.ValidValues.length - 1].label !== "Select All")
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
                var $checkbox = me._createInput(param, "checkbox", false, ["fr-param-dropdown-checkbox", "fr-paramname-" + param.Name + "-dropdown-cb"]);
                $checkbox.attr("value", value);

                if (predefinedValue && me._contains(predefinedValue, value)) {
                    $checkbox.attr("checked", "true");
                    keys += key + ",";
                    values += value + ",";
                }

                $checkbox.on("click", function () {
                    if (this.value === "Select All") {
                        if (this.checked === true) {
                            $(".fr-paramname-" + param.Name + "-dropdown-cb", me.$params).each(function () {
                                this.checked = true;
                            });
                        }
                        if (this.checked === false) {
                            $(".fr-paramname-" + param.Name + "-dropdown-cb", me.$params).each(function () {
                                this.checked = false;
                            });
                        }
                    }
                });

                var $label = me._createLabel(["fr-param-dropdown-label", "fr-paramname-" + param.Name + "-dropdown-" + i.toString() + "-label"]);
                $label.attr("for", param.Name + "_DropDown_" + i.toString());
                $label.attr("value", value);

                $label.text(key);

                $span.append($checkbox).append($label);
                $col.append($span);
                $row.append($col);
                $table.append($row);
            }
            $dropDownContainer.append($table);

            if (predefinedValue) {
                $multipleCheckBox.val(keys.substr(0, keys.length - 1));
                $hiddenCheckBox.val(JSON.stringify(predefinedValue));
            }

            $control.append($multipleCheckBox).append($hiddenCheckBox).append($openDropDown).append($dropDownContainer);

            return $control;
        },
        _writeDropDownWithTextArea: function (param, dependenceDisable) {
            var me = this;
            var predefinedValue = me._getPredefinedValue(param);
            //me._getTextAreaValue(predefinedValue);
            var $control = me._createDiv(["fr-param-element-container"]);

            var $multipleTextArea = me._createInput(param, "text", true, ["fr-param", "fr-param-dropdown-textbox", "fr-paramname-" + param.Name]);
            var $openDropDown = me._createDiv(["fr-param-dropdown-iconcontainer", "fr-core-cursorpointer"]);
            var $dropdownicon = me._createDiv(["fr-param-dropdown-icon"]);
            $openDropDown.append($dropdownicon);

            if (dependenceDisable) {
                me._disabledSubSequenceControl($multipleTextArea);
                $control.append($multipleTextArea).append($openDropDown);
                return $control;
            }
            me._getParameterControlProperty(param, $multipleTextArea);
            $multipleTextArea.on("click", function () { me._popupDropDownPanel(param); });
            $openDropDown.on("click", function () { me._popupDropDownPanel(param); });

            var $dropDownContainer = me._createDiv(["fr-param-dropdown", "fr-paramname-" + param.Name + "-dropdown-container"]);
            $dropDownContainer.attr("value", param.Name);

            var $textarea = new $("<textarea class='fr-param-dropdown-textarea fr-paramname-" + param.Name + "-dropdown-textArea' />");

            if (predefinedValue) {
                $textarea.val(me._getTextAreaValue(predefinedValue, true));
                $multipleTextArea.val(me._getTextAreaValue(predefinedValue, false)).attr("title", me._getTextAreaValue(predefinedValue, false));
                $multipleTextArea.attr("jsonValues", JSON.stringify(predefinedValue));
            }

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
                result = result.substr(0, result.length - 1);
            }
            else {
                for (var j = 0; j < predifinedValue.length; j++) {
                    result += predifinedValue[j] + ",";
                }
                result = result.substr(0, result.length - 1);
            }
            return result;
        },
        _setCheckBoxes: function (s, valueList) {
            for (var i = 0; i < s.length; i++) {
                if ($.inArray(s[i].value, valueList) >= 0) {
                    s[i].checked = true;
                } else {
                    s[i].checked = false;
                }
            }
        },
        _setMultipleInputValues: function (param) {
            var me = this;
            var newValue, oldValue;
            //var target = $(".fr-paramname-" + param.Name, me.$params).filter(":visible");
            var target = $(".fr-paramname-" + param.Name, me.$params);
            oldValue = target.val();

            if (target.hasClass("fr-param-client")) {
                var showValue = "";
                var hiddenValue = [];

                $(".fr-paramname-" + param.Name + "-dropdown-cb", me.$params).each(function (index) {
                    if (this.checked && this.value !== "Select All") {
                        showValue += $(".fr-paramname-" + param.Name + "-dropdown-" + index.toString() + "-label", me.$params).text() + ",";
                        hiddenValue.push( this.value );
                    }
                });

                newValue = showValue.substr(0, showValue.length - 1);
                $(".fr-paramname-" + param.Name, me.$params).val(newValue).attr("title", newValue);
                $(".fr-paramname-" + param.Name + "-hidden", me.$params).val(JSON.stringify(hiddenValue));
            }
            else {
                newValue = $(".fr-paramname-" + param.Name + "-dropdown-textArea", me.$params).val();
                var listOfValues = newValue.split("\n");
                newValue = newValue.replace(/\n+/g, ",");
                
                if (newValue.charAt(newValue.length - 1) === ",") {
                    newValue = newValue.substr(0, newValue.length - 1);
                }
                target.val(newValue).attr("title", newValue);
                target.attr("jsonValues", JSON.stringify(listOfValues));
            }

            if (oldValue !== newValue)
                target.change();
        },
        _popupDropDownPanel: function (param) {
            var me = this;
            var isVisible = $(".fr-paramname-" + param.Name + "-dropdown-container", me.$params).is(":visible");
            me._closeAllDropdown();

            if (!isVisible) {
                var $container = me.$params;
                var $dropDown = $(".fr-paramname-" + param.Name + "-dropdown-container", me.$params);
                var $multipleControl = $(".fr-paramname-" + param.Name, me.$params);
                var positionTop = $multipleControl.offset().top;

                $multipleControl.parent().css("z-index", 1);

                if ($container.height() - positionTop - $multipleControl.height() < $dropDown.height()) {
                    //popup at above, 4 is margin top
                    $dropDown.css("top", (($dropDown.height() +10) * -1) + 4);
                }
                else {//popup at bottom, 15 is margin + padding + border
                    $dropDown.css("top", $multipleControl.height() + 15);
                }

                if ($dropDown.is(":hidden")) {
                    $dropDown.width($multipleControl.width() + 20).addClass("fr-param-dropdown-show").show(10);
                }
                else {
                    me._closeDropDownPanel(param);
                }
            }
        },
        _closeDropDownPanel: function (param) {
            var me = this;
            me._setMultipleInputValues(param);            
            $(".fr-paramname-" + param.Name + "-dropdown-container", me.$params).removeClass("fr-param-dropdown-show").hide();

            //for dropdown textbox do focus->blur->focus to re-validate, also reset its parent container's z-index property
            $(".fr-paramname-" + param.Name, me.$params).focus().blur().parent().css("z-index", "inherit");
        },
        _closeAllDropdown: function () {
            var me = this;
            $(".fr-param-dropdown-show", me.$params).filter(":visible").each(function (index, param) {
                me._closeDropDownPanel({ Name: $(param).attr("value") });
            });
        },
        _checkExternalClick: function (e) {
            var me = this;
            var $target = $(e.target);

            if (!$target.hasClass("fr-param-dropdown-img") &&
                !$target.hasClass("fr-param-dropdown-textbox") &&
                !$target.hasClass("fr-param-dropdown") &&
                !$target.hasClass("fr-param-dropdown-label") &&
                !$target.hasClass("fr-param-dropdown-checkbox") &&
                !$target.hasClass("fr-param-dropdown-icon") &&
                !$target.hasClass("fr-param-dropdown-textarea")) {
                me._closeAllDropdown();
            }
        },
        _shouldInclude: function (param, noValid) {
            if (!noValid) return true;
            var me = this;

            var isString = $(param).attr("datatype") === "String";
            var allowBlank = $(param).attr("allowblank") === "true";

            // If it is a string type
            if (isString && allowBlank) return true;

            if (param.value == "") {
                return me._isNullChecked(param);
            }

            var required = !!$(param).attr("required");
            if (required && param.value === me.options.$reportViewer.locData.paramPane.required) {
                return false;
            }

            return true;
        },
        /**
         * @function $.forerunner.reportParameter#getParamsList
         * @generate parameter list base on the user input and return
         */
        getParamsList: function (noValid) {
            var me = this;
            var i;
            if (noValid || ($(".fr-param-form", me.$params).length !== 0 && $(".fr-param-form", me.$params).valid() === true)) {
                var a = [];
                //Text
                $(".fr-param", me.$params).filter(":text").each(function () {
                    if (me._shouldInclude(this, noValid)) {
                        if ($(this).attr("ismultiple") === "false") {
                            a.push({ Parameter: this.name, IsMultiple: $(this).attr("ismultiple"), Type: $(this).attr("datatype"), Value: me._isParamNullable(this) });
                        } else {
                            var jsonValues = $(this).attr("jsonValues");
                            a.push({ Parameter: this.name, IsMultiple: $(this).attr("ismultiple"), Type: $(this).attr("datatype"), Value: JSON.parse(jsonValues ? jsonValues : null) });
                        }
                    }
                });
                //Hidden
                $(".fr-param", me.$params).filter("[type='hidden']").each(function () {
                    if (me._shouldInclude(this, noValid)) {
                        if ($(this).attr("ismultiple") === "false") {
                            a.push({ Parameter: this.name, IsMultiple: $(this).attr("ismultiple"), Type: $(this).attr("datatype"), Value: me._isParamNullable(this) });
                        } else {
                            var value = me._isParamNullable(this);
                            a.push({ Parameter: this.name, IsMultiple: $(this).attr("ismultiple"), Type: $(this).attr("datatype"), Value: JSON.parse(value ? value : null) });
                        }
                    }
                });
                //dropdown
                $(".fr-param", me.$params).filter("select").each(function () {
                    var shouldInclude = this.value !== null && this.value !== "" && me._shouldInclude(this, noValid);
                    if (shouldInclude)
                        a.push({ Parameter: this.name, IsMultiple: $(this).attr("ismultiple"), Type: $(this).attr("datatype"), Value: me._isParamNullable(this) });
                });
                var radioList = {};
                //radio-group by radio name, default value: null
                $(".fr-param", me.$params).filter(":radio").each(function () {
                    if (!(this.name in radioList)) {
                        if (!noValid || me._isNullChecked(this)) {
                            radioList[this.name] = null;
                        }
                    }
                    if (this.checked === true) {
                        radioList[this.name] = me._isParamNullable(this);
                    }
                });
                for (var radioName in radioList) {
                    a.push({ Parameter: radioName, IsMultiple: "", Type: "Boolean", Value: radioList[radioName] });
                }
                //combobox - multiple values
                //var tempCb = "";
                //$(".fr-param", me.$params).filter(":checkbox").filter(":checked").each(function () {
                //    if (tempCb.indexOf(this.name) === -1) {
                //        tempCb += this.name + ",";
                //    }
                //});
                //if (tempCb !== "") {
                //    var cbArray = tempCb.split(",");
                //    var cbName = "";
                //    var cbValue = "";
                //    for (i = 0; i < cbArray.length - 1; i++) {
                //        cbName = cbArray[i];
                //        var $target = $("input[name='" + cbArray[i] + "']:checked", me.$params);
                //        var cbValueLength = $target.length;

                //        $target.each(function (i) {
                //            if (i === cbValueLength - 1)
                //                cbValue += this.value;
                //            else
                //                cbValue += this.value + ",";

                //        });
                //        a.push({ name: cbName, ismultiple: $(this).attr("ismultiple"), type: $(this).attr("datatype"), value: cbValue });
                //    }
                //}

                //Combined to JSON String, format as below
                //var parameterList = '{ "ParamsList": [{ "Parameter": "CategoryID","IsMultiple":"True", "Value":"'+ $("#CategoryID").val()+'" }] }';

                var paramsObject = { "ParamsList": a };
                return JSON.stringify(paramsObject);
            } else {
                return null;
            }
        },
        _isNullChecked: function (param) {
            var $cb = $(".fr-param-checkbox", this.$params).filter("[name*='" + param.name + "']").first();
            return $cb.length !== 0 && $cb.attr("checked") === "checked";
        },
        _isParamNullable: function (param) {
            var me = this;
            var $element = $(".fr-paramname-" + param.name, this.$params);

            //check nullable
            if (me._isNullChecked(param) && param.value === "") {
                return null;
            } else if ($element.attr("allowblank") === "true" && param.value === "") {
                //check allow blank
                return "";
            } else if (param.attributes.backendValue) {
                //Take care of the big dropdown list
                return param.attributes.backendValue.nodeValue;
            } else {
                //Otherwise handle the case where the parameter has not been touched
                return param.value !== "" ? param.value : null;
            }
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
            me.$params = null;
            $("." + paramContainerClass, me.element).detach();
            me._parameterDefinitions = {};
        },
        _getDefaultHTMLTable: function () {
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
            return me._defaultValueExist && $.isArray(param.DefaultValues);//&& param.DefaultValues[0];
        },
        _getDateTimeFromDefault: function (defaultDatetime) {
            if (!defaultDatetime || defaultDatetime.length < 9)
                return null;

            //dateISO: yyyy-mm-dd
            if (/^(\d{4})-(0\d{1}|1[0-2])-(0\d{1}|[12]\d{1}|3[01])$/.test(defaultDatetime))
                return defaultDatetime;

            var date = new Date(defaultDatetime.substr(0, defaultDatetime.indexOf(" ")));

            return date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate();
        },
        _checkDependencies: function (param) {
            var me = this;
            var disabled = false;

            if ($.isArray(param.Dependencies) && param.Dependencies.length) {
                $.each(param.Dependencies, function (index, dependence) {
                    var $targetElement = $(".fr-paramname-" + dependence, me.$params);
                    $targetElement.change(function () { me.refreshParameters(); });
                    //if dependence control don't have any value and not allow blank, then disabled current one
                    if ($targetElement.attr("allowblank") === "false" && $targetElement.attr("allowblank") === "false" && $targetElement.val() === "")
                        disabled = true;
                });
            }

            return disabled;
        },
        refreshParameters: function (savedParams) {
            var me = this;
            //set false not to do form validate.
            var paramList = savedParams ? savedParams : me.getParamsList(true);
            if (paramList) {
                // Ask viewer to refresh parameter, but not automatically post back
                // if all parameters are satisfied.
                me.options.$reportViewer.refreshParameters(paramList, false, -1, false);
            }
        },
        _disabledSubSequenceControl: function ($control) {
            $control.attr("disabled", true).addClass("fr-param-disable");
        },
        _checkHiddenParam: function (param) {
            var me = this;
            //if (param.QueryParameter) {
            //when no default value exist, it will set it as the first valid value
            //if no valid value exist, will popup error.
            if (!me._hasDefaultValue(param)) {
                // Do not error here because the parameter can be an internal parameter.
                console.log(param.Name + " does not have a default value.");
            }
            //}
        },
        _getDatePickerLoc: function () {
            var me = this;
            return me.options.$reportViewer.locData.datepicker;
        },
    });  // $.widget
});