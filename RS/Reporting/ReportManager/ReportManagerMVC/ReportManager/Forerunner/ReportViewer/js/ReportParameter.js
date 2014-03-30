﻿/**
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
     * Widget used to manage report parameters
     *
     * @namespace $.forerunner.reportParameter
     * @prop {Object} options - The options for report parameter
     * @prop {Object} options.$reportViewer - The report viewer widget
     * @prop {Object} options.$appContainer - Report page container
     * @prop {Integer} options.pageNum - Report page number
     *
     * @example
     * $paramArea.reportParameter({ $reportViewer: this });
     * $("#paramArea").reportParameter({
     *  $reportViewer: $viewer,
     *  $appContainer: $appContainer
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
                          "<input name='Parameter_ViewReport' type='button' class='fr-param-viewreport fr-param-button' value='" + me.options.$reportViewer.locData.paramPane.viewReport + "'/>" +
                       "</div>" +
                       "<div class='fr-param-cancel-container'>" +
                          "<span class='fr-param-cancel'>" + me.options.$reportViewer.locData.paramPane.cancel + "</span>" +
                       "</div>" +
                    "</div>" +
                "</form>" +
                "<div style='height:65px;'/>" +
                "</div>");

            me.element.css("display", "block");
            me.element.html($params);

            me.$params = $params;
            me.$form = me.element.find(".fr-param-form");

            me._formInit = true;
        },

        /**
         * Get number of visible parameters
         *
         * @function $.forerunner.reportParameter#getNumOfVisibleParameters
         *
         * @return {Integer} The number of visible parameters.
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
         * Update an existing parameter panel by posting back current selected values to update casacade parameters.
         *
         * @function $.forerunner.reportParameter#updateParameterPanel
         * 
         * @param {Object} data - Parameter data get from reporting service
         * @param {Boolean} submitForm - Submit form when parameters are satisfied
         * @param {Integer} pageNum - Current page number
         * @param {Boolean} renderParamArea - Whether to make parameter area visible
         */
        updateParameterPanel: function (data, submitForm, pageNum, renderParamArea) {
            this.removeParameter();
            this._hasPostedBackWithoutSubmitForm = true;
            this.writeParameterPanel(data, pageNum, submitForm, renderParamArea);
        },

        /**
        * Set the parameter panel to the given list
        *
        * @function $.forerunner.reportParameter#setParametersAndUpdate
        * 
        * @param {Object} paramDefs - Parameter definition data.
        * @param {String} paramsList - Parameter value list.
        * @param {Integer} pageNum - Current page number.
        */
        setParametersAndUpdate: function (paramDefs, savedParams, pageNum) {
            var me = this;
            me.updateParameterPanel(paramDefs, false, pageNum, false);
            me._submittedParamsList = savedParams;
            this._hasPostedBackWithoutSubmitForm = false;
            me.revertParameters();
        },


        /**
         * Write parameter pane with passed definition data
         *
         * @function $.forerunner.reportParameter#writeParameterPanel
         *
         * @param {Object} data - Original parameter data returned from reporting service
         * @param {Integer} pageNum - Current page number
         * @param {Boolean} submitForm - Whether to submit form if all parameters are satisfied.
         * @param {Boolean} renderParamArea - Whether to make parameter area visible.
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
                me._parameterDefinitions[param.Name].ValidatorAttrs = [];
                if (param.Prompt !== "" && (param.PromptUserSpecified ? param.PromptUser : true)) {
                    me.$numVisibleParams += 1;
                    $eleBorder.append(me._writeParamControl(param, new $("<div />"), pageNum));
                }
                else
                    me._checkHiddenParam(param);
            });

            if (me._reportDesignError !== null)
                me._reportDesignError += me.options.$reportViewer.locData.messages.contactAdmin;

            me.$form.validate({
                ignoreTitle: true,
                errorPlacement: function (error, element) {
                    if ($(element).is(":radio"))
                        error.appendTo(element.parent("div").nextAll(".fr-param-error-placeholder"));
                    else {
                        if ($(element).attr("ismultiple") === "true") {
                            error.appendTo(element.parent("div").next("span"));
                        }
                        else if ($(element).hasClass("ui-autocomplete-input")) {
                            error.appendTo(element.parent("div").nextAll(".fr-param-error-placeholder"));
                        }
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

        /**
         * Set parameters with specify parameter list
         *
         * @function $.forerunner.reportParameter#setsubmittedParamsList
         *
         * @param {String} paramList - Parameter value list
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
         * Revert any unsubmitted parameters, called in two scenario:  when cancelling out from parameter area or 
         * before submitting an action when the set of parameters for the session does not match the loaded report.
         *
         * @function $.forerunner.reportParameter#revertParameters 
         */
        revertParameters: function () {
            var me = this;
            if (me.getParamsList(true) === me._submittedParamsList) {
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
                        // Only non-multi-value parameters can be nullable.
                        if (paramDefinition.Nullable && savedParam.Value === null) {
                            var $cb = $(".fr-param-checkbox", me.$params).filter("[name*='" + paramDefinition.Name + "']").first();
                            if ($cb.length !== 0 && $cb.attr("checked") !== "checked")
                                $cb.trigger("click");
                        } else if (paramDefinition.ValidValues !== "") {
                            me._setSelectedIndex($control, savedParam.Value);
                        } else if (paramDefinition.Type === "Boolean") {
                            me._setRadioButton($control, savedParam.Value);
                        } else {
                            if ($control.attr("datatype").toLowerCase() === "datetime") {
                                $control.val(me._getDateTimeFromDefault(savedParam.Value));
                            }
                            else {
                                $control.val(savedParam.Value);
                            }
                        }
                    }
                }
            }
        },
        _cancelForm: function () {
            var me = this;
            me._closeAllDropdown();
            me.revertParameters();
            me.$form.valid();
            me._trigger(events.cancel, null, {});
        },
        _setDatePicker: function () {
            var me = this;

            var dpLoc = me._getDatePickerLoc();
            if (dpLoc)
                $.datepicker.setDefaults(dpLoc);
            
            $.each(me.element.find(".hasDatepicker"), function (index, datePicker) {
                $(datePicker).datepicker("option", "buttonImage", forerunner.config.forerunnerFolder() + "reportviewer/Images/calendar.png");
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
            var predefinedValue = me._getPredefinedValue(param);
            //if any element disable exist then not submit form auto
            if (dependenceDisable) me._loadedForDefault = false;

            //If the control have valid values, then generate a select control
            var $container = new $("<div class='fr-param-item-container'></div>");
            var $errorMsg = new $("<span class='fr-param-error-placeholder'/>");
            var $element = null;

            if (param.MultiValue === true) { // Allow multiple values in one textbox

                if (param.ValidValues !== "") { // Dropdown with checkbox
                    $element = me._writeDropDownWithCheckBox(param, dependenceDisable, predefinedValue);
                }
                else {// Dropdown with editable textarea
                    bindingEnter = false;
                    $element = me._writeDropDownWithTextArea(param, dependenceDisable, predefinedValue);
                }
            }
            else { // Only one value allowed

                if (param.ValidValues !== "") { // Dropdown box
                    bindingEnter = false;
                    $element = forerunner.device.isTouch() && param.ValidValues.length <= forerunner.config.getCustomSettingsValue("MinItemToEnableBigDropdownOnTouch", 10) ?
                        me._writeDropDownControl(param, dependenceDisable, pageNum, predefinedValue) :
                        me._writeBigDropDown(param, dependenceDisable, pageNum, predefinedValue);
                }
                else if (param.Type === "Boolean") {
                    //Radio Button, RS will return MultiValue false even set it to true
                    $element = me._writeRadioButton(param, dependenceDisable, pageNum, predefinedValue);
                }
                else { // Textbox
                    $element = me._writeTextArea(param, dependenceDisable, pageNum, predefinedValue);
                }
            }

            if ($element !== undefined && bindingEnter) {
                $element.on("keydown", function (e) {
                    if (e.keyCode === 13) {
                        me._submitForm(pageNum);
                    } // Enter
                });
            }

            $container.append($element).append(me._addNullableCheckBox(param, $element, predefinedValue)).append($errorMsg);
            $parent.append($label).append($container);

            return $parent;
        },
        _getParameterControlProperty: function (param, $control) {
            var me = this;
            
            $control.attr("allowblank", param.AllowBlank);
            $control.attr("nullable", param.Nullable);
            if ((param.Nullable === false || !me._isNullChecked($control)) && param.AllowBlank === false) {
                //For IE browser when set placeholder browser will trigger an input event if it's Chinese
                //to avoid conflict (like auto complete) with other widget not use placeholder to do it
                //Anyway IE native support placeholder property from IE10 on, so not big deal
                //Also, we are letting the devs style it.  So we have to make userNative: false for everybody now.
                $control.attr("required", "true").watermark(me.options.$reportViewer.locData.paramPane.required, { useNative: false, className: "fr-param-watermark" });
                $control.addClass("fr-param-required");
                me._parameterDefinitions[param.Name].ValidatorAttrs.push("required");
            } else if (param.MultiValue) {
                if (param.ValidValues || (!param.ValidValues && param.AllowBlank)) {
                    $control.attr("required", "true");
                    $control.addClass("fr-param-required");
                    me._parameterDefinitions[param.Name].ValidatorAttrs.push("required");
                }
            }
            $control.attr("ErrorMessage", param.ErrorMessage);
        },
        _addNullableCheckBox: function (param, $control, predefinedValue) {
            var me = this;
            if (param.Nullable === true) {
                $control = $control.hasClass("fr-param-element-container") ? $control.find(".fr-param") :
                    param.Type === "Boolean" ? $(".fr-paramname-" + param.Name, $control) : $control;

                var $nullableSpan = new $("<div class='fr-param-nullable' />");
                var $checkbox = new $("<Input type='checkbox' class='fr-param-checkbox' name='" + param.Name + "' />");

                $checkbox.on("click", function () {
                    if ($checkbox.attr("checked") === "checked") {
                        $checkbox.removeAttr("checked");
                        $control.removeAttr("disabled").removeClass("fr-param-disable");
                       
                        //add validate arrtibutes to control when uncheck null checkbox
                        $.each(me._parameterDefinitions[param.Name].ValidatorAttrs, function (index, attribute) {
                            $control.attr(attribute, "true");
                        });

                        if (param.Type === "DateTime") {
                            $control.datepicker("enable");
                        }
                    }
                    else {
                        $checkbox.attr("checked", "true");
                        $control.attr("disabled", "true").addClass("fr-param-disable");

                        //remove validate arrtibutes
                        $.each(me._parameterDefinitions[param.Name].ValidatorAttrs, function (index, attribute) {
                            $control.removeAttr(attribute);
                        });

                        if (param.Type === "DateTime") {
                            //set delay to 100 since datepicker need time to generate image for the first time
                            setTimeout(function () { $control.datepicker("disable"); }, 100);
                        }
                    }
                });

                // Check it only if it is really null, not because nobody touched it
                if (predefinedValue === null  && param.State !== "MissingValidValue") $checkbox.trigger("click");

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
        _writeRadioButton: function (param, dependenceDisable, pageNum, predefinedValue) {
            var me = this;
            var paramPane = me.options.$reportViewer.locData.paramPane;
            var radioValues = [];
            radioValues[0] = { display: paramPane.isTrue, value: "True" };
            radioValues[1] = { display: paramPane.isFalse, value: "False" };

            var $control = me._createDiv(["fr-param-checkbox-container"]);
            $control.attr("ismultiple", param.MultiValue);
            $control.attr("datatype", param.Type);

            for (var i = 0; i < radioValues.length; i++) {
                var $radioItem = new $("<input type='radio' class='fr-param fr-param-radio fr-paramname-" + param.Name + "' name='" + param.Name + "' value='" + radioValues[i].value +
                    "' datatype='" + param.Type + "' />");
                if (dependenceDisable) {
                    $radioItem.attr("disabled", "true");
                }
                else {
                    me._getParameterControlProperty(param, $radioItem);

                    if (predefinedValue && predefinedValue === radioValues[i].value) {
                        $radioItem.attr("checked", "true");
                    }

                    $radioItem.on("click", function () {
                        if (me.getNumOfVisibleParameters() === 1) {
                            me._submitForm(pageNum);
                        }
                    });
                }
                var $label = new $("<label class='fr-param-radio-label'>" + radioValues[i].display + "</label>");

                $control.append($radioItem);
                $control.append($label);
            }

            return $control;
        },
        _writeTextArea: function (param, dependenceDisable, pageNum, predefinedValue) {
            var me = this;
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
                        changeMonth: true,
                        changeYear: true,
                        showButtonPanel: true,
                        //gotoCurrent: true,
                        dateFormat: forerunner.ssr._internal.getDateFormat(),
                        onClose: function () {
                            $control.removeAttr("disabled");
                            $(".fr-paramname-" + param.Name, me.$params).valid();

                            if (me.getNumOfVisibleParameters() === 1)
                                me._submitForm(pageNum);
                        },
                        beforeShow: function () {
                            $control.attr("disabled", true);
                        },
                    });
                    $control.attr("formattedDate", "true");
                    me._parameterDefinitions[param.Name].ValidatorAttrs.push("formattedDate");

                    if (predefinedValue) {
                        $control.datepicker("setDate",  me._getDateTimeFromDefault(predefinedValue));
                    }
                    break;
                case "Integer":
                case "Float":
                    $control.attr("number", "true");
                    me._parameterDefinitions[param.Name].ValidatorAttrs.push("number");

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
            for (var i = 0; i < options.length; i++) {
                if (options[i].value === v) {
                    options[i].selected = true;
                    return;
                }
            }

        },
        _writeBigDropDown: function (param, dependenceDisable, pageNum, predefinedValue) {
            var me = this;
            var canLoad = false,
                isOpen = false,
                enterLock = false;

            var $container = me._createDiv(["fr-param-element-container"]);
            var $control = me._createInput(param, "text", false, ["fr-param", "fr-paramname-" + param.Name]);
            me._getParameterControlProperty(param, $control);
            //add auto complete selected item check
            $control.attr("autoCompleteDropdown", "true");
            me._parameterDefinitions[param.Name].ValidatorAttrs.push("autoCompleteDropdown");

            var $openDropDown = me._createDiv(["fr-param-dropdown-iconcontainer", "fr-core-cursorpointer"]);
            var $dropdownicon = me._createDiv(["fr-param-dropdown-icon"]);
            $openDropDown.append($dropdownicon);

            if (dependenceDisable) {
                me._disabledSubSequenceControl($control);
                $container.append($control).append($openDropDown);
                return $container;
            }

            $openDropDown.on("mousedown", function () {
                isOpen = $control.autocomplete("widget").is(":visible");
            });

            $openDropDown.on("click", function () {
                if ($control.attr("disabled"))
                    return;

                $control.focus();

                if (isOpen) {
                    return;
                }
                
                me._closeAllDropdown();
                //pass an empty string to show all values
                //delay 50 milliseconds to remove the blur/mousedown conflict in old browsers
                setTimeout(function () { $control.autocomplete("search", ""); }, 50);
            });

            for (var i = 0; i < param.ValidValues.length; i++) {
                if ((predefinedValue && predefinedValue === param.ValidValues[i].Value) || (!predefinedValue && i === 0)) {
                    $control.val(param.ValidValues[i].Key).attr("backendValue", param.ValidValues[i].Value);
                    canLoad = true;
                }

                param.ValidValues[i].label = param.ValidValues[i].Key;
                param.ValidValues[i].value = param.ValidValues[i].Value;
            }
            if (!canLoad && param.Nullable !== true) me._loadedForDefault = false;

            $control.autocomplete({
                source: param.ValidValues,
                minLength: 0,
                delay: 0,
                autoFocus: true,
                maxItem: forerunner.config.getCustomSettingsValue("MaxBigDropdownItem",50),
                select: function (event, obj) {
                    $control.attr("backendValue", obj.item.value).val(obj.item.label).trigger("change", { value: obj.item.value });
                    enterLock = true;
                    
                    if (me.getNumOfVisibleParameters() === 1) {
                        setTimeout(function () { me._submitForm(pageNum); }, 100);
                    }

                    return false;
                },
                focus: function (event, obj) {
                    return false;
                },
                response: function (event, obj) {
                    //obj.content.length will equal = 0 if no item match.
                    if (obj.content.length === 0) {
                        $control.addClass("fr-param-autocomplete-error");
                    }
                    else {
                        $control.removeClass("fr-param-autocomplete-error");
                    }
                },
                change: function (event, obj) {
                    if (!obj.item) {
                        $control.addClass("fr-param-autocomplete-error");
                    }
                    else {
                        $control.removeClass("fr-param-autocomplete-error");
                    }

                    //if this control don't required, then empty is a valid value
                    if (!$control.attr("required") && $control.val() === "")
                        $control.removeClass("fr-param-autocomplete-error");

                    $control.valid();
                },
                close: function (event) {
                    //if user selected by mouse click then unlock enter
                    //close event will happend after select event so it safe here.
                    if (event.originalEvent.originalEvent.type === 'click')
                        enterLock = false;
                }
            });

            $control.on("focus", function () {
                $(".ui-autocomplete", me.options.$appContainer).hide();
            });

            $control.on("change", function (event, obj) {
                // Keeps the rest of the handlers (get cascading parameter here) 
                //from being executed when input value is not valid.
                if (!obj && $control.val() !== "")
                    event.stopImmediatePropagation();
            });

            //auto complete widget bind a keydown hander when initialize an instance
            //I create instance first so our own handler will be execute later in the handler list
            //enterLock is our expect value
            $control.on("keydown", function (e) {
                if (e.keyCode === 13) {
                    if (enterLock) {
                        enterLock = false;
                        return;
                    }

                    me._submitForm(pageNum);
                }
            });

            $container.append($control).append($openDropDown);
            return $container;
        },
        _writeDropDownControl: function (param, dependenceDisable, pageNum, predefinedValue) {
            var me = this;
            var canLoad = false;
            var $control = new $("<select class='fr-param fr-param-select fr-paramname-" + param.Name + "' name='" + param.Name + "' ismultiple='" +
                param.MultiValue + "' datatype='" + param.Type + "' readonly='true'>");

            if (dependenceDisable) {
                me._disabledSubSequenceControl($control);
                return $control;
            }

            me._getParameterControlProperty(param, $control);
            var defaultSelect = me.options.$reportViewer.locData.paramPane.select;
            var $defaultOption = new $("<option title='" + defaultSelect + "' value=''>&#60" + defaultSelect + "&#62</option>");
            $control.append($defaultOption);

            for (var i = 0; i < param.ValidValues.length; i++) {
                var optionKey = forerunner.helper.htmlEncode(param.ValidValues[i].Key);
                var optionValue = param.ValidValues[i].Value;
                var $option = new $("<option title='" + optionKey + "' value='" + optionValue + "'>" + optionKey + "</option>");

                if ((predefinedValue && predefinedValue === optionValue) || (!predefinedValue && i === 0)) {
                    $option.attr("selected", "true");
                    $control.attr("title", param.ValidValues[i].Key);
                    canLoad = true;
                }

                $control.append($option);
            }
            if (!canLoad) me._loadedForDefault = false;

            $control.on("change", function () {
                $control.attr("title", $(this).find("option:selected").text());
                
                if (me.getNumOfVisibleParameters() === 1) {
                    me._submitForm(pageNum);
                }
            });

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
        _writeDropDownWithCheckBox: function (param, dependenceDisable, predefinedValue) {
            var me = this;
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
            if (param.ValidValues.length && param.ValidValues[param.ValidValues.length - 1].Key !== "Select All")
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
        _writeDropDownWithTextArea: function (param, dependenceDisable, predefinedValue) {
            var me = this;
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
            //clsoe auto complete dropdown, it will be appended to the body so use $appContainer here to do select
            $(".ui-autocomplete", me.options.$appContainer).hide();
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
                !$target.hasClass("fr-param-dropdown-textarea") &&
                !$target.hasClass("ui-autocomplete") &&
                !$target.hasClass("ui-autocomplete-input")) {
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

            if (param.value === "") {
                return me._isNullChecked(param);
            }

            var required = !!$(param).attr("required");
            if (required && param.value === me.options.$reportViewer.locData.paramPane.required) {
                return false;
            }

            return true;
        },
        /**
         * Generate parameter value list into string and return
         *
         * @function $.forerunner.reportParameter#getParamsList
         *
         * @param {Boolean} noValid - if not need valid form set noValid = true
         *
         * @return {String} - parameter value list
         */
        getParamsList: function (noValid) {
            var me = this;
            var i;
            if (noValid || (me.$form.length !== 0 && me.$form.valid() === true)) {
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
            if (me._isNullChecked(param)) {
                return null;
            } else if ($element.attr("allowblank") === "true" && param.value === "") {
                //check allow blank
                return "";
            } else if (param.attributes.backendValue) {
                //Take care of the big dropdown list
                return param.attributes.backendValue.nodeValue;
            } else if ($element.attr("datatype").toLowerCase() === "datetime") {
                var m = moment($element.val(), forerunner.ssr._internal.getMomentDateFormat(), true);
                
                //hard code a sql server accept date format here to parse all culture
                //date format to it. It's ISO 8601 format below 
                return m.format("YYYY-MM-DD");
            }
            else {
                //Otherwise handle the case where the parameter has not been touched
                return param.value !== "" ? param.value : null;
            }
        },
        /**
        * Remove all parameters from report
        *
        * @function $.forerunner.reportParameter#removeParameter
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
            if (!defaultDatetime) {
                return null;
            }

            var m = moment(defaultDatetime);
            return m.isValid() ? m.format(forerunner.ssr._internal.getMomentDateFormat()) : null;
        },
        _checkDependencies: function (param) {
            var me = this;
            var disabled = false;

            if ($.isArray(param.Dependencies) && param.Dependencies.length) {
                $.each(param.Dependencies, function (index, dependence) {
                    var $targetElement = $(".fr-paramname-" + dependence, me.$params);
                    $targetElement.on("change", function () { me.refreshParameters(); });
                });
            }

            if (param.State === "HasOutstandingDependencies") disabled = true;

            return disabled;
        },
        /**
        * Ask viewer to refresh parameter, but not automatically post back if all parameters are satisfied
        *
        * @function $.forerunner.reportParameter#refreshParameters
        *
        * @param {String} savedParams - Saved parameter value list
        */
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
                //console.log(param.Name + " does not have a default value.");
            }
            //}
        },
        _getDatePickerLoc: function () {
            var me = this;
            return me.options.$reportViewer.locData.datepicker;
        },
    });  // $.widget
});