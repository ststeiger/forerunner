/**
 * @file Contains the parameter widget.
 *
 */

// Assign or create the single globally scoped variable
var forerunner = forerunner || {};
var moment = moment || {};

// Forerunner SQL Server Reports
forerunner.ssr = forerunner.ssr || {};

$(function () {
    var widgets = forerunner.ssr.constants.widgets;
    var events = forerunner.ssr.constants.events;
    var paramContainerClass = "fr-param-container";
    var nullPlaceHolder = "**ThisIsNull**";

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
            $appContainer: null,
            RDLExt: {}
        },

        $params: null,
        _formInit: false,
        _defaultValueExist: false,
        _loadedForDefault: true,
        _reportDesignError: null,
        _revertLock: false,
        _useDefault: false,
        _submittedParamsList: null,
        _parameterDefinitions: null,
        _hasPostedBackWithoutSubmitForm: false,
        _dependencyList: null,
        _isDropdownTree: true, // indicate whether apply cascading tree
        _writeParamDoneCallback: null,        

        _init: function () {
            var me = this;
            me.element.html(null);
            me.enableCascadingTree = forerunner.config.getCustomSettingsValue("EnableCascadingTree", "on") === "on";
            me.isDebug = forerunner.config.getCustomSettingsValue("Debug", "off") === "on" ? true : false;
        },
        _render: function () {
            var me = this;

            me.element.children().remove();

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
         * Get the number of visible parameters
         *
         * @function $.forerunner.reportParameter#getNumOfVisibleParameters
         *
         * @return {Integer} The number of visible parameters.
         */
        getNumOfVisibleParameters: function () {
            var me = this;
            if (me._numVisibleParams !== undefined)
                return me._numVisibleParams;
            return 0;
        },
        /**
         * Update an existing parameter panel by posting back current selected values to update casacade parameters.
         *
         * @function $.forerunner.reportParameter#updateParameterPanel
         * 
         * @param {Object} data - Parameter data get from reporting service
         * @param {Boolean} submitForm - Submit form when parameters are satisfied
         * @param {Integer} pageNum - Current page number
         * @param {Boolean} renderParamArea - Whether to make parameter area visible
         * @param {Boolean} isCascading - Cascading refresh or normal refresh
         * @param {Object} savedParam - User saved parameters
         * @param {Object} paramMetadata - Report parameter metadata
         */
        updateParameterPanel: function (data, submitForm, pageNum, renderParamArea, isCascading, savedParam, paramMetadata) {
            var me = this;

            //Determin in cascading tree
            var $li = me.element.find(".fr-param-tree-loading");
            //only refresh tree view if it's a cascading refresh and there is a dropdown tree
            if ($li.length !==0) {
                
                me._dataPreprocess(data.ParametersList);
                var level = $li.parent("ul").attr("level");

                var parentName = $li.parent().attr("name");
                var childName = me._dependencyList[parentName];
                var $childList = null;
                //now it only work for 1 to 1 relationship
                for (var i = 0; i < childName.length; i++) {
                    $childList = me._getCascadingTree(me._parameterDefinitions[childName[i]], parseInt(level, 10) + 1);
                    if ($childList) {
                        $li.append($childList);
                    }
                }

                $li.removeClass("fr-param-tree-loading");
            }
            else {
                this.removeParameter();
                this.writeParameterPanel(data, pageNum, submitForm, renderParamArea, savedParam, paramMetadata);
            }

            this._hasPostedBackWithoutSubmitForm = true;
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
         * Write parameter pane with parameters data
         *
         * @function $.forerunner.reportParameter#writeParameterPanel
         *
         * @param {Object} data - Original parameter data returned from reporting service
         * @param {Integer} pageNum - Current page number
         * @param {Boolean} submitForm - Whether to submit form if all parameters are satisfied
         * @param {Boolean} renderParamArea - Whether to make parameter area visible
         * @param {Object} savedParam - User saved parameter
         * @param {Object} paramMetadata - Report parameter metadata
         */
        writeParameterPanel: function (data, pageNum, submitForm, renderParamArea, savedParam, paramMetadata) {
            var me = this;
            if (data.Debug) {
                me._debug = data.Debug;
            }
         
            me.options.pageNum = pageNum;
            me._defaultValueExist = data.DefaultValueExist;
            me._loadedForDefault = true;
            me._submittedParamsList = null;
            me._numVisibleParams = 0;

            me._render();
            me._dataPreprocess(data.ParametersList, true);

            var $eleBorder = $(".fr-param-element-border", me.$params);
            var metadata = paramMetadata && paramMetadata.ParametersList;
            var savedParamMap = me._getParamMap(savedParam);
            $.each(data.ParametersList, function (index, param) {
                var mergedParam = me._getMergedParam(param, savedParamMap);
                if ((mergedParam.PromptUserSpecified ? mergedParam.PromptUser : true)) {
                    if (mergedParam.Prompt !== "") {
                        me._numVisibleParams += 1;
                    }
                    $eleBorder.append(me._writeParamControl(mergedParam, new $("<div />"), pageNum, metadata ? metadata[index] : null));
                }
            });
            //resize the textbox width when custom right pane width is big
            me._elementWidthCheck();

            if (savedParam) {
                me._useDefaultCheck(savedParam);
            }

            if (me._reportDesignError !== null) {
                me._reportDesignError += me.options.$reportViewer.locData.messages.contactAdmin;
            }

            me.$form.validate({
                ignoreTitle: true,
                errorPlacement: function (error, element) {
                    if (element.is(":radio"))
                        error.appendTo(element.parent("div").nextAll(".fr-param-error-message"));
                    else {
                        if (element.attr("ismultiple") === "true" || element.hasClass("ui-autocomplete-input") || element.hasClass("fr-param-tree-input")) {
                            error.appendTo(element.parent("div").siblings(".fr-param-error-message"));
                        }
                        else
                            error.appendTo(element.siblings(".fr-param-error-message"));
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

            if (me.isDebug) {
                console.log("writeParameterPanel", {
                    submitForm: submitForm,
                    DefaultValueCount: data.DefaultValueCount,
                    DataCount: parseInt(data.Count, 10),
                    LoadedForDefault: me._loadedForDefault
                });
            }

            me._trigger(events.loaded);
            if (submitForm !== false) {
                if (data.DefaultValueCount === parseInt(data.Count, 10) && me._loadedForDefault)
                    me._submitForm(pageNum);
                else {
                    //if (renderParamArea !== false)
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
            $(document).off("click", me._checkExternalClick);
            $(document).on("click", { me: me }, me._checkExternalClick);


            $(":text", me.$params).each(
                function (index) {
                    var textinput = $(this);
                    textinput.on("blur", function () { me.options.$reportViewer.onInputBlur(); });
                    textinput.on("focus", function () { me.options.$reportViewer.onInputFocus(); });
                }
            );

            if (typeof (me._writeParamDoneCallback) === "function") {
                me._writeParamDoneCallback();
                me._writeParamDoneCallback = null;
            }
        },
        _getParamMap: function (savedParam) {
            var paramObj = {};

            if (!savedParam) {
                return paramObj;
            }
            var params = forerunner.helper.JSONParse(savedParam);
            var hasMembers = false;

            $.each(params.ParamsList, function (i, item) {
                var index = item.Parameter ? item.Parameter : item.Name;
                paramObj[index] = item;
                hasMembers = true;
            });

            return hasMembers ? paramObj : null;
        },
        _getMergedParam: function (param, savedParamMap) {
            var newParam = param;

            if (savedParamMap) {
                var savedParam = savedParamMap[param.Name];
                if (savedParam && typeof (savedParam.Prompt) === "string") {
                    newParam.Prompt = savedParam.Prompt;
                    if (newParam.Prompt === "") {
                        // Must have just removed this param so fix up the related members
                        newParam.PromptUser = false;
                        newParam.PromptUserSpecified = false;
                    }

                    if (savedParam.ValidValues) {
                        newParam.ValidValues = savedParam.ValidValues;
                    }
                }
            }

            return newParam;
        },
        _addWriteParamDoneCallback: function (func) {
            if (typeof (func) !== "function") return;

            var me = this;
            var priorCallback = me._writeParamDoneCallback;

            if (priorCallback === null) {
                me._writeParamDoneCallback = func;
            } else {
                me._writeParamDoneCallback = function () {
                    priorCallback();
                    func();
                };
            }
        },
        _elementWidthCheck: function () {
            var me = this;

            var containerWidth = me.options.$appContainer.width();
            var customRightPaneWidth = forerunner.config.getCustomSettingsValue("ParameterPaneWidth", 280);
            var parameterPaneWidth = customRightPaneWidth < containerWidth ? customRightPaneWidth : containerWidth;
            var elementWidth = parameterPaneWidth - 80;

            //180 is the default element width
            if (elementWidth > 180) {
                me.element.find(".fr-param-width").css({ "width": elementWidth });
                me.element.find(".fr-param-dropdown-input").css({ "width": elementWidth - 24 });
                me.element.find(".ui-autocomplete").css({ "min-width": elementWidth, "max-width": elementWidth });
                me.element.find(".fr-param-option-container").css({ "width": elementWidth });
            }
        },
        _useDefaultCheck: function (savedParam) {
            var me = this;

            var params = forerunner.helper.JSONParse(savedParam);
            var $useDefaults = me.element.find(".fr-usedefault-checkbox");

            $.each(params.ParamsList, function (index, param) {
                if (param.UseDefault && param.UseDefault.toLowerCase() === "true") {
                    var name = param.Parameter ? param.Parameter : param.Name;
                    var $checkbox = $useDefaults.filter("[name='" + name + "']");
                    if ($checkbox.length) {
                        $checkbox.trigger("click");
                    }
                }
            });
        },
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

            if (me.formIsValid()) {
                var paramList = me.getParamsList();

                if (me._debug) {
                    me.options.$reportViewer.removeLoadingIndicator();
                } else {
                    me.options.$reportViewer.loadReportWithNewParameters(paramList, pageNum, me._useDefault);
                }
                me._submittedParamsList = paramList;
                me._trigger(events.submit);
            }

            me._hasPostedBackWithoutSubmitForm = false;
        },
        /**
         * Revert any unsubmitted parameters, called in two scenario: 
         *
         * 1. when cancelling out from parameter area or before submitting an action
         * 2. when the set of parameters for the session does not match the loaded report.
         *
         * @function $.forerunner.reportParameter#revertParameters 
         */
        revertParameters: function () {
            var me = this;
            if (me.getParamsList(true) === me._submittedParamsList) {
                return;
            }
            if (me._submittedParamsList !== null) {
                me._revertLock = true;
                if (me._hasPostedBackWithoutSubmitForm) {
                    //refresh parameter on server side
                    me._refreshParameters(me._submittedParamsList, false);
                    me._hasPostedBackWithoutSubmitForm = false;
                    me.options.$reportViewer.invalidateReportContext();
                }

                //revert to prior submitted parameters
                var submittedParameters = JSON.parse(me._submittedParamsList);
                var list = submittedParameters.ParamsList;
                var $control;

                for (var i = 0; i < list.length; i++) {
                    var savedParam = list[i];
                    var index = savedParam.Parameter ? savedParam.Parameter : savedParam.Name;
                    var param = me._parameterDefinitions[index];
                    me._setParamValue(param, savedParam.Value);
                    //if (me._isDropdownTree && me.enableCascadingTree && (paramDefinition.isParent || paramDefinition.isChild)) {

                    //    var isTopParent = paramDefinition.isParent === true && paramDefinition.isChild !== true;
                    //    //Revert cascading tree status: display text, backend value, tree UI
                    //    me._setTreeItemStatus(paramDefinition, savedParam, isTopParent);
                    //    $control = me.element.find(".fr-paramname-" + paramDefinition.Name);
                    //    $control.attr("backendValue", JSON.stringify(savedParam.Value));
                    //    continue;
                    //}

                    //if (paramDefinition.MultiValue) {
                    //    if (paramDefinition.ValidValues !== "") {
                    //        $control = $(".fr-paramname-" + paramDefinition.Name + "-dropdown-cb", me.$params);
                    //        me._setCheckBoxes($control, savedParam.Value);
                    //        me._setMultipleInputValues(paramDefinition);
                    //    } else {
                    //        $control = $(".fr-paramname-" + paramDefinition.Name);
                    //        var $dropdownText = $(".fr-paramname-" + paramDefinition.Name + "-dropdown-textArea");
                    //        $dropdownText.val(me._getTextAreaValue(savedParam.Value, true));
                    //        $control.val(me._getTextAreaValue(savedParam.Value, false));
                    //        $control.attr("jsonValues", JSON.stringify(savedParam.Value));
                    //    }
                    //} else {
                    //    $control = $(".fr-paramname-" + paramDefinition.Name, me.$params);
                    //    // Only non-multi-value parameters can be nullable.
                    //    if (paramDefinition.Nullable && savedParam.Value === null) {
                    //        var $cb = $(".fr-param-checkbox", me.$params).filter("[name*='" + paramDefinition.Name + "']").first();
                    //        if ($cb.length !== 0 && $cb.attr("checked") !== "checked")
                    //            $cb.trigger("click");
                    //    } else if (paramDefinition.ValidValues !== "") {
                    //        if (forerunner.device.isTouch() && paramDefinition.ValidValues.length <= forerunner.config.getCustomSettingsValue("MinItemToEnableBigDropdownOnTouch", 10)) {
                    //            me._setSelectedIndex($control, savedParam.Value);
                    //        }
                    //        else {
                    //            me._setBigDropDownIndex(paramDefinition, savedParam.Value, $control);
                    //        }
                    //    } else if (paramDefinition.Type === "Boolean") {
                    //        me._setRadioButton($control, savedParam.Value);
                    //    } else {
                    //        if ($control.attr("datatype").toLowerCase() === "datetime") {
                    //            $control.val(me._getDateTimeFromDefault(savedParam.Value));
                    //        }
                    //        else {
                    //            $control.val(savedParam.Value);
                    //        }
                    //    }
                    //}
                }

                //set tree selected status after revert
                //if (me._isDropdownTree && me.enableCascadingTree) {
                //    me._closeCascadingTree(true);
                //}

                me._revertLock = false;
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

            me.$datepickers = me.element.find(".hasDatepicker");

            if (me.$datepickers.length) {
                $.each(me.$datepickers, function (index, datePicker) {
                    $(datePicker).datepicker("option", "buttonImage", forerunner.config.forerunnerFolder() + "reportviewer/Images/calendar.png")
                        .datepicker("option", "buttonImageOnly", true)
                        .datepicker("option", "buttonText", me.options.$reportViewer.locData.paramPane.datePicker);
                });

                $(window).off("resize", me._paramWindowResize);
                $(window).on("resize", { me: me }, me._paramWindowResize);
            }
        },
        _getPredefinedValue: function (param) {
            var me = this;
            if (me._hasDefaultValue(param)) {
                if (param.MultiValue === false)
                    return param.DefaultValues[0];
                else
                    return param.DefaultValues;
            }

            return undefined;
        },
        _writeParamControl: function (param, $parent, pageNum, paramMetadata) {
            var me = this;
            var $label = new $("<div class='fr-param-label'>" + param.Prompt + "</div>");
            var bindingEnter = true;
            var predefinedValue = me._getPredefinedValue(param);
            //If the control have valid values, then generate a select control
            var $container = new $("<div class='fr-param-item-container'></div>");
            var $optionsDiv = new $("<div class='fr-param-option-container'></div>");
            var $errorMsg = new $("<div class='fr-param-error-message'/>");
            var $element = null;
            var useDefaultParam = paramMetadata || param;


            //Hide hidden parameter
            if (param.Prompt === "") {
                $container.css("display", "none");
                $optionsDiv.css("display", "none");
            }

            //Add RDL Ext override for cascading tree
            if (me.options.RDLExt && me.options.RDLExt[param.Name] && me.options.RDLExt[param.Name].enableCascadingTree === false)
                me._parameterDefinitions[param.Name].enableCascadingTree = false;
            else
                me._parameterDefinitions[param.Name].enableCascadingTree = true;

            if (me._isDropdownTree && me.enableCascadingTree && me._parameterDefinitions[param.Name].isParent === true && me._parameterDefinitions[param.Name].isChild !== true && me._parameterDefinitions[param.Name].enableCascadingTree === true) {
                //only apply tree view to dropdown type
                $element = me._writeCascadingTree(param, predefinedValue);
            }

            if (me._isDropdownTree && me.enableCascadingTree && me._parameterDefinitions[param.Name].isChild === true && me._parameterDefinitions[param.Name].enableCascadingTree === true) {
                $element = me._writeCascadingChildren(param, predefinedValue);
                //if not want sub parameter show then add this class
                $parent.addClass("fr-param-tree-hidden");
            }

            if ($element === null) {
                var dependenceDisable = me._checkDependencies(param);
                //if any element disable exist then not submit form auto
                if (dependenceDisable) me._loadedForDefault = false;

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

                        $element = forerunner.device.isTouch() && param.ValidValues.length <= forerunner.config.getCustomSettingsValue("MinItemToEnableBigDropdownOnTouch", 20) ?
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
            }

            if ($element !== undefined && bindingEnter) {
                $element.on("keydown", function (e) {
                    if (e.keyCode === 13) {
                        me._submitForm(pageNum);
                    } // Enter
                });
            }

            //Add RDL Ext to parameters
            if (me.options.RDLExt && me.options.RDLExt[param.Name] !== undefined && $element !== undefined) {
                forerunner.ssr._writeRDLExtActions(param.Name, me.options.RDLExt, $element, undefined, me.options.$reportViewer.element, undefined, undefined, function () { return me._getParamControls.call(me); }, function (c, m) { me._setParamError.call(me, c, m); });

                if (me.options.RDLExt[param.Name].localize) {
                    $label.text(forerunner.localize.getLocalizedValue(param.Prompt, me.options.RDLExt[param.Name].localize));
                }
                    
                //$.each(me._paramValidation[param.Name], function (index, attribute) {
                //    $element.removeAttr(attribute);
                //});
            }

            $container.append($element);

            //for cascading hidden elements, don't add null / use default checkbox constraint
            //they are assist elements to generate parameter list
            if (!$parent.hasClass("fr-param-tree-hidden")) {
                if (param.ValidValues === "") {
                    $optionsDiv.append(me._addNullableCheckBox(param, $element, predefinedValue));
                    //Hook up null check box to dependency
                    me._checkDependencies(param);
                }

                //Add use default option
                if (useDefaultParam && me._hasDefaultValue(useDefaultParam)) {
                    $optionsDiv.append(me._addUseDefaultOption(param, $element, predefinedValue));
                }

                $container.append($errorMsg);
            }

            $parent.append($label).append($container).append($optionsDiv);
            return $parent;
        },
        _setParamError: function (param, errorString) {
            var me = this;
            var err = {};
            err[param.attr("name")] = errorString;

            if (errorString !== undefined) {
                me.$form.validate().showErrors(err);
                me.$form.validate().invalid[param.attr("name")] = true;
            }
            else {
                delete me.$form.validate().invalid[param.attr("name")];
                me.$form.validate().hideErrors();

            }

        },
        _setParamValue: function (param, defaultValue, $element) {
            var me = this;
            var $control;

            if (me._isDropdownTree && me.enableCascadingTree && (param.isParent || param.isChild)) {
                var isTopParent = param.isParent === true && param.isChild !== true;
                //Revert cascading tree status: display text, backend value, tree UI
                me._setTreeItemStatus(param, defaultValue, isTopParent);
                $control = $element || me.element.find(".fr-paramname-" + param.Name);
                $control.attr("backendValue", JSON.stringify(defaultValue));

                me._closeCascadingTree(true);
                //continue;
            }
            else if (param.MultiValue) {
                if (param.ValidValues !== "") {
                    $control = $(".fr-paramname-" + param.Name + "-dropdown-cb", me.$params);
                    me._setCheckBoxes($control, defaultValue);
                    me._setMultipleInputValues(param);
                } else {
                    $control = $element || $(".fr-paramname-" + param.Name);
                    var $dropdownText = $(".fr-paramname-" + param.Name + "-dropdown-textArea");
                    $dropdownText.val(me._getTextAreaValue(defaultValue, true));
                    $control.val(me._getTextAreaValue(defaultValue, false));
                    $control.attr("jsonValues", JSON.stringify(defaultValue));
                }
            } else {
                $control = $element || $(".fr-paramname-" + param.Name, me.$params);
                // Only non-multi-value parameters can be nullable.
                if (param.Nullable && defaultValue === null) {
                    var $cb = $(".fr-param-checkbox", me.$params).filter("[name='" + param.Name + "']").first();
                    if ($cb.length !== 0 && $cb.attr("checked") !== "checked")
                        $cb.trigger("click");
                } else if (param.ValidValues !== "") {
                    if (forerunner.device.isTouch() && param.ValidValues.length <= forerunner.config.getCustomSettingsValue("MinItemToEnableBigDropdownOnTouch", 10)) {
                        me._setSelectedIndex($control, defaultValue);
                    }
                    else {
                        me._setBigDropDownIndex(param, defaultValue, $control);
                    }
                } else if (param.Type === "Boolean") {
                    me._setRadioButton($control, defaultValue);
                } else {
                    if ($control.attr("datatype").toLowerCase() === "datetime") {
                        $control.val(me._getDateTimeFromDefault(defaultValue));
                    }
                    else {
                        $control.val(defaultValue);
                    }
                }
            }
        },
        _getParameterControlProperty: function (param, $control) {
            var me = this;

            $control.attr("allowblank", param.AllowBlank).attr("nullable", param.Nullable).attr("ErrorMessage", param.ErrorMessage);

            if (param.AllowBlank === false || param.MultiValue === true) {
                me._addRequiredPrompt(param, $control);
            }
        },
        _addRequiredPrompt: function (param, $control) {
            var me = this;

            //For IE browser when set placeholder browser will trigger an input event if it's Chinese
            //to avoid conflict (like auto complete) with other widget not use placeholder to do it
            //Anyway IE native support placeholder property from IE10 on, so not big deal
            //Also, we are letting the devs style it.  So we have to make userNative: false for everybody now.
            $control.attr("required", "true").watermark(me.options.$reportViewer.locData.paramPane.required, forerunner.config.getWatermarkConfig());
            $control.addClass("fr-param-required");
            me._paramValidation[param.Name].push("required");
        },
        _addNullableCheckBox: function (param, $control, predefinedValue) {
            var me = this;
            if (param.Nullable === true) {
                $control = $control.hasClass("fr-param-element-container") ? $control.find(".fr-param") :
                    param.Type === "Boolean" ? $(".fr-paramname-" + param.Name, $control) : $control;

                var $container = new $("<div class='fr-param-option-div' />");
                var $checkbox = new $("<Input type='checkbox' class='fr-param-option-checkbox fr-null-checkbox' name='" + param.Name + "' />");

                $checkbox.on("click", function () {

                    if ($checkbox[0].checked !== true) {//uncheck
                        $control.removeAttr("disabled").removeClass("fr-param-disable");
                        $.watermark.show($control);
                        //add validate arrtibutes to control when uncheck null checkbox
                        $.each(me._paramValidation[param.Name], function (index, attribute) {
                            $control.attr(attribute, "true");
                        });

                        if (param.Type === "DateTime") {
                            $control.datepicker("enable");
                        }
                    }
                    else {
                        $control.attr("disabled", true).addClass("fr-param-disable");
                        $.watermark.hide($control);
                        //remove validate arrtibutes
                        $.each(me._paramValidation[param.Name], function (index, attribute) {
                            $control.removeAttr(attribute);
                        });

                        if (param.Type === "DateTime") {
                            //set delay to 100 since datepicker need time to generate image for the first time
                            $control.datepicker("disable");
                        }
                    }
                });

                var $label = new $("<Label class='fr-param-option-label' />");
                $label.html(me.options.$reportViewer.locData.paramPane.nullField);
                $label.on("click", function () { $checkbox.trigger("click"); });

                $container.append($checkbox).append($label);

                // Check it only if it is really null, not because nobody touched it
                if (predefinedValue === null && param.State !== "MissingValidValue") {
                    if (forerunner.device.isFirefox()) {
                        $checkbox[0].checked = true;
                    }
                    $checkbox.trigger("click");
                }
                return $container;
            }
            else
                return null;
        },
        _addUseDefaultOption: function (param, $control, predefinedValue) {
            var me = this;
            var $hidden = null;

            if ($control.hasClass("fr-param-element-container")) {
                $hidden = $control.find("input[type='hidden']");
                $control = $control.find(".fr-param-dropdown-input");
            }
            else {
                $control = param.Type === "Boolean" ? $(".fr-paramname-" + param.Name, $control) : $control;
            }

            var $container = new $("<div class='fr-param-option-div' />");

            var $checkbox = new $("<Input type='checkbox' class='fr-param-option-checkbox fr-usedefault-checkbox' name='" + param.Name + "' />");
            $checkbox.on("click", function () { me._triggerUseDefaultClick.call(me, param, $control, $checkbox, predefinedValue, $hidden); });

            var $label = new $("<label class='fr-param-option-label' />");
            $label.text(me.options.$reportViewer.locData.paramPane.useDefault);
            $label.on("click", function () { $checkbox.trigger("click"); });

            $container.append($checkbox).append($label);
            return $container;
        },
        _triggerUseDefaultClick: function (param, $control, $checkbox, preDefinedValue, $hidden) {
            var me = this;
            var $nullCheckbox = $(".fr-null-checkbox").filter("[name='" + param.Name + "']"),
                customVal;

            if ($checkbox[0].checked === false) {//uncheck
                if ($nullCheckbox.length) {
                    $nullCheckbox.removeAttr("disabled");
                }

                $control.removeAttr("disabled").removeClass("fr-usedefault");
                customVal = $control.attr("data-custom");
                $control.val(customVal).attr("data-custom", "");

                if ($hidden && $hidden.length) {
                    $hidden.removeClass("fr-usedefault");
                }

                if ($control.hasClass("fr-param-tree-input")) {
                    $.each(me._getTreeItemChildren(param.Name), function (index, childname) {
                        $(".fr-paramname-" + childname).removeClass("fr-usedefault");
                    });
                }

                if ($control.hasClass("fr-param-dropdown-input")) {
                    $control.parent().removeClass("fr-param-disable");
                }
                $control.removeClass("fr-param-disable");
                $.watermark.show($control);

                //add validate arrtibutes to control when uncheck null checkbox
                $.each(me._paramValidation[param.Name], function (index, attribute) {
                    $control.attr(attribute, "true");
                });

                if (param.Type === "DateTime") { $control.datepicker("enable"); }
            }
            else {

                if ($nullCheckbox.length) {
                    if ($nullCheckbox[0].checked === true) {
                        $nullCheckbox[0].checked = false;
                    }

                    $nullCheckbox.attr("disabled", true);
                }

                $control.attr("disabled", true).addClass("fr-usedefault");
                customVal = $control.val();
                $control.attr("data-custom", customVal).val("");

                //remove validate arrtibutes                
                for (var i = 0, arr = me._paramValidation[param.Name], len = arr.length; i < len; i++) {
                    $control.removeAttr(arr[i]);
                }
                if ($hidden && $hidden.length) {
                    $hidden.addClass("fr-usedefault");
                }

                //set all hidden children parameter to use default value
                if ($control.hasClass("fr-param-tree-input")) {
                    $.each(me._getTreeItemChildren(param.Name), function (index, childname) {
                        $(".fr-paramname-" + childname).addClass("fr-usedefault");
                    });
                }

                if ($control.hasClass("fr-param-dropdown-input")) {
                    $control.parent().addClass("fr-param-disable");
                }
                $control.addClass("fr-param-disable");
                $.watermark.hide($control);

                if (param.Type === "DateTime") {
                    //set delay to 100 since datepicker need time to generate image for the first time
                    setTimeout(function () { $control.datepicker("disable"); }, 100);
                }

                //not reset the default value, since it may always change on the server side like current date.
                //me._setParamValue(param, preDefinedValue, $control);
                $control.valid();
            }
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

            var $control = me._createDiv(["fr-param-checkbox-container", "fr-param-width"]);
            $control.attr("ismultiple", param.MultiValue);
            $control.attr("datatype", param.Type);

            for (var i = 0; i < radioValues.length; i++) {
                var $radioItem = new $("<input type='radio' class='fr-param fr-param-radio fr-paramname-" + param.Name + "' name='" + param.Name + "' prompt='" + param.Prompt + "' value='" + radioValues[i].value +
                    "' datatype='" + param.Type + "' />");
                if (dependenceDisable) {
                    $radioItem.attr("disabled", true);
                }
                else {
                    me._getParameterControlProperty(param, $radioItem);

                    if (predefinedValue !== undefined && predefinedValue === radioValues[i].value) {
                        $radioItem.attr("checked", true);
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
        _setParamScrollPos: function ($control) {
            var me = this;

            if (forerunner.device.isTouch()) {
                $control.off("focus", me._setScrollPos).on("focus", { me: me }, me._setScrollPos);
            }
        },
        _setScrollPos: function (event) {
            var me = event.data.me,
                element = event.target;

            var newTop = element.offsetTop - 28;

            setTimeout(function () {
                me.$params.scrollTop(newTop);
            }, 500);
        },
        _writeTextArea: function (param, dependenceDisable, pageNum, predefinedValue) {
            var me = this;
            var $control = new $("<input class='fr-param fr-param-width fr-paramname-" + param.Name +
                "' prompt='" + param.Prompt + "' name='" + param.Name + "' type='text' size='100' ismultiple='"
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
                            var $input = $control;
                            $input.removeAttr("disabled").removeClass("datepicker-focus");
                            $(".fr-paramname-" + param.Name, me.$params).valid();

                            if (me.getNumOfVisibleParameters() === 1)
                                me._submitForm(pageNum);
                        },
                        beforeShow: function (input) {
                            $(input).attr("disabled", true).addClass("datepicker-focus");
                        },
                    });
                    $control.attr("formattedDate", "true");
                    me._paramValidation[param.Name].push("formattedDate");

                    if (predefinedValue) {
                        $control.datepicker("setDate", me._getDateTimeFromDefault(predefinedValue));
                    }
                    break;
                case "Integer":
                case "Float":
                    $control.attr("number", "true");
                    me._paramValidation[param.Name].push("number");

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

            me._setParamScrollPos($control);
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
        _setBigDropDownIndex: function (param, value, $control) {
            for (var i = 0; i < param.ValidValues.length; i++) {
                if ((value && value === param.ValidValues[i].Value) || (!value && i === 0)) {
                    $control.val(param.ValidValues[i].Key).attr("backendValue", param.ValidValues[i].Value);
                }
            }

            if ($control.hasClass("fr-param-autocomplete-error")) {
                $control.removeClass("fr-param-autocomplete-error");
            }
        },
        _writeBigDropDown: function (param, dependenceDisable, pageNum, predefinedValue) {
            var me = this;
            var canLoad = false,
                isOpen = false,
                enterLock = false;

            var $container = me._createDiv(["fr-param-element-container", "fr-param-dropdown-div", "fr-param-width"]);
            var $control = me._createInput(param, "text", false, ["fr-param", "fr-param-dropdown-input", "fr-param-not-close", "fr-paramname-" + param.Name]);
            me._getParameterControlProperty(param, $control);
            //add auto complete selected item check
            $control.attr("autoCompleteDropdown", "true");
            me._paramValidation[param.Name].push("autoCompleteDropdown");

            var $openDropDown = me._createDiv(["fr-param-dropdown-iconcontainer", "fr-core-cursorpointer"]);
            var $dropdownicon = me._createDiv(["fr-param-dropdown-icon", "fr-param-not-close"]);
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

                //only set focus to its textbox for no-touch device by default
                if (!forerunner.device.isTouch()) {
                    $control.focus();
                }

                if (isOpen) {
                    return;
                }

                me._closeAllDropdown();
                //pass an empty string to show all values
                //delay 50 milliseconds to remove the blur/mousedown conflict in old browsers
                setTimeout(function () { $control.autocomplete("search", ""); }, 50);
            });

            for (var i = 0; i < param.ValidValues.length; i++) {
                if ((predefinedValue !== undefined && predefinedValue === param.ValidValues[i].Value)) {

                    if (param.ValidValues[i].Value === null)
                        param.ValidValues[i].Value = nullPlaceHolder;

                    $control.val(param.ValidValues[i].Key).attr("title", param.ValidValues[i].Key).attr("backendValue", param.ValidValues[i].Value);
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
                appendTo: me.$params,
                position: { of: $container },
                maxItem: forerunner.config.getCustomSettingsValue("MaxBigDropdownItem", 50),
                select: function (event, obj) {
                    
                    if (obj.item.value === null) {
                        $control.attr("backendValue", nullPlaceHolder).attr("title", obj.item.label).val(obj.item.label).trigger("change", { item: obj.item.value });
                    }
                    else {
                        $control.attr("backendValue", obj.item.value).attr("title", obj.item.label).val(obj.item.label).trigger("change", { item: obj.item.value });
                    }
                        

                    enterLock = true;

                    if (me.getNumOfVisibleParameters() === 1) {
                        setTimeout(function () { me._submitForm(pageNum); }, 100);
                    }

                    $control.valid();

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

                    $control.val() !== "" && $control.valid();
                },
                change: function (event, obj) {
                    if (!obj.item) {
                        //Invalid selection, remove prior select
                        $control.removeAttr("backendValue");
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
                    if (event.originalEvent && event.originalEvent.originalEvent.type === "click")
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

            me._setParamScrollPos($control);

            $container.append($control).append($openDropDown);
            return $container;
        },
        _writeDropDownControl: function (param, dependenceDisable, pageNum, predefinedValue) {
            var me = this;
            var canLoad = false;
            var $control = new $("<select class='fr-param fr-param-select fr-param-width fr-paramname-" + param.Name + "' name='" + param.Name + "' ismultiple='" +
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

                //Handle NULL
                if (param.ValidValues[i].Value === null)
                    optionValue = nullPlaceHolder;

                var $option = new $("<option title='" + optionKey + "' value='" + optionValue + "'>" + optionKey + "</option>");

                if ((predefinedValue !== undefined && predefinedValue === optionValue)) {
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
        _writeCascadingTree: function (param, predefinedValue) {
            var me = this;
            var nodeLevel = 1;

            var $container = me._createDiv(["fr-param-element-container", "fr-param-tree-container", "fr-param-dropdown-div", "fr-param-width"]);
            var $input = me._createInput(param, "text", false, ["fr-param-client", "fr-param-not-close", "fr-paramname-" + param.Name]);

            $input.attr("cascadingTree", true).attr("readonly", "readonly").addClass("fr-param-tree-input").addClass("fr-param-dropdown-input");
            me._paramValidation[param.Name].push("cascadingTree");
            me._getParameterControlProperty(param, $input);

            var $hidden = me._createInput(param, "hidden", false, ["fr-param", "fr-paramname-" + param.Name]);
            me._setTreeElementProperty(param, $hidden);
            me._setTreeDefaultValue(param, predefinedValue, $input, $hidden);

            var $treeContainer = me._createDiv(["fr-param-tree", "ui-corner-all", "fr-param-not-close"]).css("z-index", 5);
            var $tree = me._getCascadingTree(param, nodeLevel);
            $treeContainer.append($tree);

            var $openDropDown = me._createDiv(["fr-param-dropdown-iconcontainer", "fr-core-cursorpointer"]);
            var $dropdownicon = me._createDiv(["fr-param-dropdown-icon", "fr-param-not-close"]);
            $openDropDown.append($dropdownicon);

            $input.on("click", function () { me._showTreePanel($treeContainer, $input); });
            $openDropDown.on("click", function () {
                if ($input.attr("disabled"))
                    return;

                me._showTreePanel($treeContainer, $input);
            });
            //generate default value after write parameter panel done
            me._addWriteParamDoneCallback(function () { me._setTreeSelectedValues($treeContainer); });

            $container.append($input).append($hidden).append($openDropDown).append($treeContainer);
            return $container;
        },
        _showTreePanel: function ($tree, $input) {
            var me = this;

            if ($tree.is(":visible")) {
                me._setTreeSelectedValues($tree);
                $tree.hide();
            }
            else {
                $input.removeClass("fr-param-cascadingtree-error").attr("cascadingTree", "");
                $tree.show();
                //Fixed issue 1056: jquery.ui.position will got an error in IE8 when the panel width change, 
                //so here I wrote code to got shop up position to popup tree panel
                var $parent = $input.parent();
                var left = forerunner.helper.parseCss($input, "marginLeft") + ($input.outerWidth() - $input.innerWidth()) / 2;
                var top = forerunner.helper.parseCss($input, "marginTop") + $parent.outerHeight();
                $tree.css({ "top": top, "left": left, "min-width": $parent.width() });
                //$tree.position({ my: "left top", at: "left bottom", of: $input });
                $input.blur();
            }
        },
        _writeCascadingChildren: function (param, predefinedValue) {
            var me = this;
            var $container = null, $hidden = null;

            $container = me._createDiv(["fr-param-element-container"]);

            $hidden = me._createInput(param, "hidden", false, ["fr-param", "fr-paramname-" + param.Name]);
            $hidden.val("#");
            me._setTreeElementProperty(param, $hidden);

            me._setTreeDefaultValue(param, predefinedValue, null, $hidden);

            $container.append($hidden);
            return $container;
        },
        _getCascadingTree: function (param, level) {
            var me = this;
            var $list = null;
            //for dropdown list or dropdown with checkbox
            if (!!param.ValidValues) {
                var predefinedValue = me._getPredefinedValue(param);
                var hasChild = !!me._dependencyList[param.Name];
                var length = param.ValidValues.length;

                $list = new $("<ul />");
                $list.attr("name", param.Name)
                    .attr("allowmultiple", param.MultiValue)
                    .attr("haschild", hasChild)
                    .attr("nullable", param.Nullable)
                    .attr("level", level)
                    .attr("prompt", param.Prompt)
                    .addClass("fr-param-tree-ul");

                if (param.isChild) {
                    $list.attr("parent", param.Dependencies.join());
                    $list.addClass("fr-param-tree-child");
                }

                for (var i = 0; i < length; i++) {
                    var isDefault = false;

                    if (param.ValidValues[i].Value === null)
                        param.ValidValues[i].Value = nullPlaceHolder;

                    if (predefinedValue) {
                        if (param.MultiValue) {
                            if (me._contains(predefinedValue, param.ValidValues[i].Value)) {
                                isDefault = true;
                            }
                        }
                        else {
                            if ((predefinedValue && predefinedValue === param.ValidValues[i].Value)) {
                                isDefault = true;
                            }
                        }
                    }

                    var item = me._getCascadingTreeItem(param, param.ValidValues[i], hasChild, i === length - 1, isDefault, level);
                    $list.append(item);
                }
            }

            return $list;
        },
        _getCascadingTreeItem: function (param, value, hasChild, isLast, isDefault, level) {
            var me = this;
            var $li = new $("<li/>");
            $li.addClass("fr-param-tree-item").attr("data-value", value.Value);

            if (isLast) {
                $li.addClass("fr-param-tree-item-last");
            }

            var $icon = new $("<i/>");
            $icon.addClass("fr-param-tree-icon");
            $icon.addClass("fr-param-tree-ocl");

            //$icon will handle node expand/collapse work, if child node not loaded send XHR to load first
            $icon.on("click", function () {
                if ($li.hasClass("fr-param-tree-item-close")) {
                    // when it is from revert not load children if it not exist
                    if (me._revertLock === true) {
                        if ($li.children("ul").length !== 0) {
                            $li.children("ul").show();
                            $li.removeClass("fr-param-tree-item-close").addClass("fr-param-tree-item-open");
                        }
                        return;
                    }

                    me._setRuntimeTreeValues($li);

                    if ($li.children("ul").length === 0) {
                        $li.addClass("fr-param-tree-loading");
                        me._refreshParameters(null, true, param.Name);
                    }
                    else {
                        $li.children("ul").show();
                    }

                    if (param.MultiValue === false) {
                        //handle siblings, close opened siblings
                        var allSiblings = me.element.find(".fr-param-tree-container ul[level='" + level + "']").children("li.fr-param-tree-item-open");

                        $.each(allSiblings, function (index, sibling) {
                            $(sibling).children(".fr-param-tree-icon").trigger("click");
                        });
                    }

                    $li.removeClass("fr-param-tree-item-close").addClass("fr-param-tree-item-open");
                }
                else if ($li.hasClass("fr-param-tree-item-open")) {
                    if (param.MultiValue === false) {
                        //clean all selected children status for single select parameter
                        me._clearTreeItemStatus($li.children("ul"));
                    }
                    else {
                        if (me._revertLock === true) {
                            me._clearTreeItemStatus($li.children("ul"));
                        }
                        //just collapse children for multiple select parameter
                        $li.children("ul").hide();
                        $li.removeClass("fr-param-tree-item-open").addClass("fr-param-tree-item-close");
                    }
                }
            });

            var $checkbox = new $("<i/>");
            $checkbox.addClass("fr-param-tree-icon fr-param-tree-icon-cb");
            if (param.MultiValue === false) {
                $checkbox.addClass("fr-param-tree-icon-hidden");
            }

            var $themeicon = new $("<i/>");
            $themeicon.addClass("fr-param-tree-icon fr-param-tree-icon-theme");

            var $text = new $("<span/>");
            $text.addClass("fr-param-tree-item-text");
            $text.text(value.Key);

            var $anchor = new $("<a href=''/>");
            $anchor.addClass("fr-param-tree-anchor");
            $anchor.on("click", function (e) {
                //$anchor will handle node select/un-select action and update its parent/children status
                e.preventDefault();

                //remove all siblings selected status for single select parameter
                if (param.MultiValue === false) {
                    var siblings;
                    if (hasChild) {
                        siblings = me.element.find(".fr-param-tree-container ul[level='" + level + "']").children("li.fr-param-tree-item-open");
                        $.each(siblings, function (index, sibling) {
                            if ($li.attr("data-value") === $(sibling).attr("data-value")) {
                                return true;
                            }

                            $(sibling).children(".fr-param-tree-ocl").trigger("click");
                        });
                    }
                    else {
                        siblings = me.element.find(".fr-param-tree-container ul[level='" + level + "']").children("li.fr-param-tree-item-selected");
                        $.each(siblings, function (index, sibling) {
                            if ($li.attr("data-value") === $(sibling).attr("data-value")) {
                                return true;
                            }

                            $(sibling).children(".fr-param-tree-anchor").trigger("click");
                        });
                    }
                }

                var $ul = $li.children("ul");
                var allowMultiple = $ul.attr("allowmultiple") === "true";

                // un-select action -- remove all its children in all level
                if ($anchor.hasClass("fr-param-tree-anchor-selected")) {
                    if (hasChild) {
                        //if it not contain children then it is a children loading click
                        if ($ul.length !== 0 && $ul.is(":visible")) {
                            $anchor.removeClass("fr-param-tree-anchor-selected");
                            $li.removeClass("fr-param-tree-item-selected");

                            if (allowMultiple && $ul.children("li.fr-param-tree-item-selected").length === 0) {
                                $anchor.trigger("click");
                                return;
                            }

                            $ul.find(".fr-param-tree-item .fr-param-tree-anchor").removeClass("fr-param-tree-anchor-selected");
                            $ul.find(".fr-param-tree-item").removeClass("fr-param-tree-item-selected");
                        }
                    }
                    else {
                        $anchor.removeClass("fr-param-tree-anchor-selected");
                        $li.removeClass("fr-param-tree-item-selected");
                    }
                }
                else {// select action -- do select all only to its directly children
                    $li.addClass("fr-param-tree-item-selected");
                    $anchor.addClass("fr-param-tree-anchor-selected");

                    if (hasChild) {
                        //for multiple select children select all, for single select children do nothing
                        if (allowMultiple && $ul.is(":visible")) {
                            $ul.children("li").children(".fr-param-tree-anchor").addClass("fr-param-tree-anchor-selected");
                            $ul.children("li").addClass("fr-param-tree-item-selected");
                        }
                    }
                }

                //if this node has child, either children not loaded or collapsed it will open child instead of select all
                //in the same time clear all siblings selected status for single select parameter
                if (hasChild && ($ul.length === 0 || $ul.is(":visible") === false)) {
                    $icon.trigger("click");
                }

                me._setParentStatus($li);
            });

            $anchor.append($checkbox).append($themeicon).append($text);
            $li.append($icon).append($anchor);

            if (hasChild) {
                if (isDefault) {
                    level += 1;
                    var children = me._dependencyList[param.Name];

                    for (var i = 0; i < children.length; i++) {
                        var subParam = me._parameterDefinitions[children[i]];
                        var $childList = me._getCascadingTree(subParam, level);

                        if ($childList) {
                            $li.append($childList);
                        }
                    }

                    level -= 1;
                    $li.addClass("fr-param-tree-item-open");
                }
                else {
                    $li.addClass("fr-param-tree-item-close");
                }
            }

            //trigger default click after write parameter panel done
            if (isDefault && !hasChild) {
                me._addWriteParamDoneCallback(function () { $anchor.trigger("click"); });
            }

            return $li;
        },
        _setParentStatus: function ($item) {
            var me = this;

            if ($item.parent().attr("parent")) {
                var $ul = $item.parent();
                var $parent = $ul.parent("li");
                var $parentAnchor = $parent.children(".fr-param-tree-anchor");

                if ($ul.find("li a").filter(".fr-param-tree-anchor-selected").length === 0) {//no selected
                    $parent.removeClass("fr-param-tree-item-selected");
                    $parentAnchor.removeClass("fr-param-tree-anchor-selected");
                }
                else {//all selected or part selected
                    $parent.addClass("fr-param-tree-item-selected");
                    $parentAnchor.addClass("fr-param-tree-anchor-selected");
                }

                //else if ($ul.find("li a").filter(".fr-param-tree-anchor-selected").length === $ul.find("li a").length) {//all selected
                //    $parent.addClass("fr-param-tree-item-selected");
                //    $parentAnchor.removeClass("fr-param-tree-anchor-udm").addClass("fr-param-tree-anchor-selected");
                //}
                //else {//part selected
                //    $parent.addClass("fr-param-tree-item-selected");
                //    if ($parent.parent("ul").attr("allowmultiple").toLowerCase() === "true") {
                //        $parentAnchor.removeClass("fr-param-tree-anchor-selected").addClass("fr-param-tree-anchor-udm");
                //    }
                //    else {
                //        $parentAnchor.addClass("fr-param-tree-anchor-selected");
                //    }
                //}

                me._setParentStatus($parent);
            }
        },
        _setRuntimeTreeValues: function ($item) {
            var me = this;

            var $ul = $item.parent();
            var parentName = $ul.attr("name");
            var $param = me.element.find(".fr-paramname-" + parentName);
            //set single selected item as backend value to load data dynamically
            if ($ul.attr("allowmultiple") === "true") {
                $param.filter(".fr-param").val("#").attr("backendValue", "[\"" + $item.attr("data-value") + "\"]");
            }
            else {
                $param.filter(".fr-param").val("#").attr("backendValue", $item.attr("data-value"));
            }

            if ($ul.attr("parent")) {
                me._setRuntimeTreeValues($ul.parent("li"));
            }
        },
        _setTreeSelectedValues: function ($tree) {
            var me = this;
            var param = null,
                $targetElement = null,
                displayText = null,
                backendValue = null,
                temp = null,
                isValid = true,
                invalidList = null;
            var $parent = $tree.siblings(".fr-param-tree-input");

            $parent.removeClass("fr-param-cascadingtree-error").attr("cascadingTree", "");

            //Get Parameter of tree
            param = me._parameterDefinitions[$tree.children("ul").attr("name")];
            while (param) {

                //set backend value
                if (param.isParent || param.isChild) {
                    $targetElement = me.element.find(".fr-paramname-" + param.Name);
                    backendValue = "";

                    if (param.MultiValue) {
                        temp = [];

                        $.each($tree.find("ul[name=" + param.Name + "] > li.fr-param-tree-item-selected"), function (index, li) {
                            temp.push($(li).attr("data-value"));
                        });

                        if (temp.length) {
                            backendValue = JSON.stringify(temp);
                        }
                    }
                    else {
                        var $selected = $tree.find("ul[name=" + param.Name + "] > li.fr-param-tree-item-selected");
                        temp = $selected.attr("data-value");
                        if (temp) {
                            backendValue = temp;
                        }
                    }

                    //if target parameter is required and backend value is empty, then it's not valid
                    if ($targetElement.hasClass("fr-param-required") && Boolean(backendValue) === false) {
                        invalidList = invalidList || [];
                        invalidList.push(param.Prompt);
                        isValid = false;
                    }
                    $targetElement.filter(".fr-param").attr("backendValue", backendValue);

                    //set display text only for top parameter
                    if (param.isParent && !param.isChild) {
                        displayText = me._getTreeDisplayText($tree);
                        if (displayText) {
                            $targetElement.val(displayText);
                        }
                        else {
                            $targetElement.val("");
                        }
                    }
                }

                //Do dependent params, trees can only have one child
                if (me._dependencyList[param.Name])
                    param = me._parameterDefinitions[me._dependencyList[param.Name][0]];
                else
                    param = null;

            }

            if (isValid === false) {
                if (invalidList.length) {
                    $parent.attr("cascadingTree", "[" + invalidList.join() + "]");
                }
                $parent.addClass("fr-param-cascadingtree-error");
            }

            $parent.blur();
        },
        _getTreeDisplayText: function ($container) {
            var me = this;
            var $ul = $container.children("ul");

            if ($ul.length === 0)// length === 0 mean it don't have children, stop the recurrence by return empty string
                return "";

            var text = null, displayText = [];
            var hasChild = $ul.attr("haschild").toLowerCase() === "true" ? true : false;

            $.each($ul.children("li.fr-param-tree-item-selected"), function (index, li) {
                text = $(li).children("a").text();
                if (hasChild) {
                    text += me._getTreeDisplayText($(li));
                }
                displayText.push(text);
            });

            if ($ul.hasClass("fr-param-tree-child")) {
                return "(" + displayText.join() + ")";
            }
            else {
                return displayText.join(", ");
            }
        },
        _setTreeDefaultValue: function (param, predefinedValue, $input, $hidden) {
            var me = this;
            var valids = param.ValidValues;
            var i;

            if (predefinedValue !== undefined) {
                if (param.MultiValue) {
                    var keys = [];
                    for ( i = 0; i < valids.length; i++) {
                        if (me._contains(predefinedValue, valids[i].Value)) {
                            keys.push(valids[i].Key);
                        }
                    }
                    if (keys.length) {
                        if ($input) { $input.val(keys.join()); } //set display text
                        $hidden.attr("backendValue", JSON.stringify(predefinedValue)); //set backend value
                    }
                }
                else {
                    for (i = 0; i < valids.length; i++) {
                        if ((predefinedValue && predefinedValue === valids[i].Value)) {
                            if ($input) { $input.val(valids[i].Key); } //set display text
                            $hidden.attr("backendValue", valids[i].Value); //set backend value
                            break;
                        }
                    }
                }
            }
            else {
                me._loadedForDefault = false;
            }
        },
        //set each tree item status by specify parameter value
        _setTreeItemStatus: function (param, defaultParam, isTopParent) {
            var me = this;
            var $parent = me.element.find(".fr-param-tree ul[name='" + param.Name + "']");
            if (isTopParent) {
                //clear current tree status
                $parent.children("li.fr-param-tree-item-open").children(".fr-param-tree-ocl").trigger("click");
            }

            //reset tree select status
            var $li = $parent.children("li");
            $.each($li, function (index, item) {
                if (param.MultiValue) {
                    if (me._contains(defaultParam, $(item).attr("data-value"))) {
                        $(item).children(".fr-param-tree-anchor").trigger("click");
                    }
                }
                else {
                    if ($(item).attr("data-value") === defaultParam) {
                        $(item).children(".fr-param-tree-anchor").trigger("click");
                    }
                }
            });
        },
        _clearTreeItemStatus: function ($parent) {
            //do recursive to removed selected node under specify parent
            var me = this;
            var hasChild = $parent.attr("haschild") === "true";
            if (hasChild) {
                var $children = $parent.children("li.fr-param-tree-item-open").children("ul");
                $.each($children, function (index, child) {
                    me._clearTreeItemStatus($(child));
                });
            }

            $parent.children("li.fr-param-tree-item-selected").children(".fr-param-tree-anchor").removeClass("fr-param-tree-anchor-selected");
            $parent.children("li.fr-param-tree-item-selected").removeClass("fr-param-tree-item-selected");

            $parent.hide();
            $parent.parent("li").children(".fr-param-tree-anchor").removeClass("fr-param-tree-anchor-selected");
            $parent.parent("li").removeClass("fr-param-tree-item-selected").removeClass("fr-param-tree-item-open").addClass("fr-param-tree-item-close");
        },
        _closeCascadingTree: function (skipVisibleCheck) {
            var me = this;
            var $trees = me.element.find(".fr-param-tree");

            $.each($trees, function (index, tree) {
                var $tree = $(tree);
                if (skipVisibleCheck || $tree.is(":visible")) {
                    me._setTreeSelectedValues($tree);
                    $tree.hide();
                }
            });
        },
        _setTreeElementProperty: function (param, $control) {
            var me = this;

            $control.attr("treeInput", "");
            $control.attr("backendValue", "");
            $control.attr("allowblank", param.AllowBlank);
            $control.attr("nullable", param.Nullable);
            $control.addClass("fr-param-tree-hidden-input");

            if (param.AllowBlank === false) {
                $control.attr("required");
                $control.addClass("fr-param-required");
            }
        },
        _getTreeItemChildren: function (paramName, list) {
            //get all its children parameters by using recursive
            //return parameter name array
            var me = this;
            var innerlist = list || [];

            if (me._dependencyList[paramName]) {
                $.each(me._dependencyList[paramName], function (index, child) {
                    if (innerlist.indexOf(child) === -1) {
                        innerlist.push(child);
                        innerlist = me._getTreeItemChildren(child, innerlist);
                    }
                });
            }

            return innerlist;
        },
        _createInput: function (param, type, readonly, listOfClasses) {
            var $input = new $("<Input />");
            $input.attr("type", type);
            $input.attr("name", param.Name);
            $input.attr("ismultiple", param.MultiValue);
            $input.attr("datatype", param.Type);
            $input.attr("prompt", param.Prompt);
            if (readonly) {
                $input.attr("readonly", true);
            }
            for (var i = 0; i < listOfClasses.length; i++) {
                $input.addClass(listOfClasses[i]);
            }
            return $input;
        },
        _createDiv: function (listOfClasses) {
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
            var $control = me._createDiv(["fr-param-element-container", "fr-param-dropdown-div", "fr-param-width"]);

            var $multipleCheckBox = me._createInput(param, "text", true, ["fr-param-client", "fr-param-dropdown-input", "fr-param-not-close", "fr-paramname-" + param.Name]);

            var $openDropDown = me._createDiv(["fr-param-dropdown-iconcontainer", "fr-core-cursorpointer"]);
            var $dropdownicon = me._createDiv(["fr-param-dropdown-icon", "fr-param-not-close"]);
            $openDropDown.append($dropdownicon);

            if (dependenceDisable) {
                me._disabledSubSequenceControl($multipleCheckBox);
                $control.append($multipleCheckBox).append($openDropDown);
                return $control;
            }

            me._getParameterControlProperty(param, $multipleCheckBox);
            var $hiddenCheckBox = me._createInput(param, "hidden", false, ["fr-param", "fr-paramname-" + param.Name]);

            $openDropDown.on("click", function () {
                if ($multipleCheckBox.attr("disabled"))
                    return;

                me._popupDropDownPanel(param);
            });
            $multipleCheckBox.on("click", function () { me._popupDropDownPanel(param); });

            var $dropDownContainer = me._createDiv(["fr-param-dropdown", "fr-param-not-close", "fr-paramname-" + param.Name + "-dropdown-container"]);
            $dropDownContainer.attr("data-value", param.Name);

            var $table = me._getDefaultHTMLTable();
            if (param.ValidValues.length && param.ValidValues[param.ValidValues.length - 1].Key !== "Select All")
                param.ValidValues.push({ Key: "Select All", Value: "Select All" });

            var keys = "";
            var values = "";
            var $selectAllCheckbox = null;
            var allItemsSelected = true;
            for (var i = 0; i < param.ValidValues.length; i++) {
                var key;
                var value;
                var isSelectAllItem = i === 0;
                if (isSelectAllItem) {
                    var valuePair = param.ValidValues[param.ValidValues.length - 1];
                    key = valuePair.Key;
                    value = valuePair.Value;
                } else {
                    key = param.ValidValues[i - 1].Key;
                    value = param.ValidValues[i - 1].Value;
                }

                var $row = new $("<TR />");
                var $col = new $("<TD/>");

                var $span = new $("<Span />");
                var $checkbox = me._createInput(param, "checkbox", false, ["fr-param-dropdown-checkbox", "fr-paramname-" + param.Name + "-dropdown-cb"]);
                $checkbox.attr("data-value", value);

                if (isSelectAllItem) {
                    $selectAllCheckbox = $checkbox;
                }

                if (predefinedValue !== undefined && me._contains(predefinedValue, value)) {
                    $checkbox.attr("checked", "true");
                    keys += key + ",";
                    values += value + ",";
                } else if (!isSelectAllItem) {
                    allItemsSelected = false;
                }

                $checkbox.on("click", function () {
                    if ($(this).attr("data-value") === "Select All") {
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
                    else {
                        var $parents = $(this).parents("table");
                        var $selectAll = $parents.find("input[data-value='Select All']");
                        if (this.checked === true) {
                            // Being checked so we need to test if the select all needs to be checked
                            var $notSelectAll = $parents.find("input[data-value!='Select All']");
                            var isSelectAll = true;
                            $notSelectAll.each(function (index, element) {
                                if (element.checked === false) {
                                    isSelectAll = false;
                                }
                            });
                            $selectAll.prop("checked", isSelectAll);
                        } else {
                            // Being unchecked so we need to un-check the select all
                            $selectAll.prop("checked", false);
                        }
                    }
                });

                var $label = me._createLabel(["fr-param-dropdown-label", "fr-paramname-" + param.Name + "-dropdown-" + i.toString() + "-label"]);
                $label.attr("for", param.Name + "_DropDown_" + i.toString());
                $label.attr("data-value", value).text(key);

                $span.append($checkbox).append($label);
                $col.append($span);
                $row.append($col);
                $table.append($row);
            }

            //If the list is empty
            if ($selectAllCheckbox)
                $selectAllCheckbox.prop("checked", allItemsSelected);

            $dropDownContainer.append($table);

            //If default value is not valid then dont set it as value
            if (predefinedValue !== undefined && me._containsSome(predefinedValue, param.ValidValues)) {
                $multipleCheckBox.val(keys.substr(0, keys.length - 1));
                $hiddenCheckBox.val(JSON.stringify(predefinedValue));               
            }
            else
                me._loadedForDefault = false;

            $control.append($multipleCheckBox).append($hiddenCheckBox).append($openDropDown).append($dropDownContainer);

            $control.delegate("label", "click", function (e) {
                $(this).siblings(".fr-param-dropdown-checkbox").trigger("click");
            });
            return $control;
        },
        _writeDropDownWithTextArea: function (param, dependenceDisable, predefinedValue) {
            var me = this;
            //me._getTextAreaValue(predefinedValue);
            var $control = me._createDiv(["fr-param-element-container", "fr-param-dropdown-div", "fr-param-width"]);

            var $multipleTextArea = me._createInput(param, "text", true, ["fr-param", "fr-param-dropdown-input", "fr-param-not-close", "fr-paramname-" + param.Name]);
            var $openDropDown = me._createDiv(["fr-param-dropdown-iconcontainer", "fr-core-cursorpointer"]);
            var $dropdownicon = me._createDiv(["fr-param-dropdown-icon", "fr-param-not-close"]);
            $openDropDown.append($dropdownicon);

            if (dependenceDisable) {
                me._disabledSubSequenceControl($multipleTextArea);
                $control.append($multipleTextArea).append($openDropDown);
                return $control;
            }
            me._getParameterControlProperty(param, $multipleTextArea);
            $multipleTextArea.on("click", function () { me._popupDropDownPanel(param); });
            $openDropDown.on("click", function () {
                if ($multipleTextArea.attr("disabled"))
                    return;

                me._popupDropDownPanel(param);
            });

            var $dropDownContainer = me._createDiv(["fr-param-dropdown", "fr-param-not-close", "fr-paramname-" + param.Name + "-dropdown-container"]);
            $dropDownContainer.attr("data-value", param.Name);

            var $textarea = new $("<textarea class='fr-param-dropdown-textarea fr-paramname-" + param.Name + "-dropdown-textArea' />");

            if (predefinedValue !== undefined) {
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
                    if (this.checked && $(this).attr("data-value") !== "Select All") {
                        showValue += $(".fr-paramname-" + param.Name + "-dropdown-" + index.toString() + "-label", me.$params).text() + ",";
                        hiddenValue.push($(this).attr("data-value"));
                    }
                });

                newValue = showValue.substr(0, showValue.length - 1);
                $(".fr-paramname-" + param.Name, me.$params).val(newValue).attr("title", newValue);
                $(".fr-paramname-" + param.Name, me.$params).filter(".fr-param").val(JSON.stringify(hiddenValue));
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
                    //popup at above
                    $dropDown.css("top", ($dropDown.height() + 10) * -1);
                }
                else {//popup at bottom, 9 is margin + padding + border
                    $dropDown.css("top", $multipleControl.height() + 9);
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
                me._closeDropDownPanel({ Name: $(param).attr("data-value") });
            });
            //close auto complete dropdown, it will be appended to the body so use $appContainer here to do select
            $(".ui-autocomplete", me.options.$appContainer).hide();
            //close cascading tree and set value
            me._closeCascadingTree(false);
        },
        _checkExternalClick: function (e) {
            var me = e.data.me;

            if (!forerunner.helper.containElement(e.target, ["fr-param-not-close"])) {
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
        _pushParam: function (a, $input, data) {
            data.Prompt = $input.attr("prompt");
            a.push(data);
        },
        _getParamControls: function () {
            var me = this;
            var retval = {};

            var params = $(".fr-param", me.$params);

            for (var i = 0 ; i < params.length; i++) {
                retval[$(params[i]).attr("name")] = $(params[i]);
            }

            return retval;
        },
        /**
         * Returns a boolean that indicates if the form fields are all valid. Note a form with
         * no fields is considered valid.
         *
         * @function $.forerunner.reportParameter#formIsValid
         *
         * @return {Boolean} - true if the all fields of the from are valid
         */
        formIsValid: function () {
            var me = this;
            return (me.$form && me.$form.length === 0) || (me.$form && me.$form.validate().numberOfInvalids() <= 0 && me.$form.valid());
        },
        /**
         * Generate parameter value list into string and return
         *
         * @function $.forerunner.reportParameter#getParamsList
         *
         * @param {Boolean} noValid - If not need valid form set noValid = true
         *
         * @return {String} - Parameter value list or null if this report has no visible parameters
         */
        getParamsList: function (noValid) {
            var me = this;
            var i, $input;

            //for all get request that need validate, close all dropdown panel to get latest value first
            if (!noValid) {
                me._closeAllDropdown();
            }
            me._useDefault = false;
            if ((me.$form && noValid) || (me.$form && me.$form.length !== 0 && me.$form.validate().numberOfInvalids() <= 0 && me.$form.valid())) {
                var a = [];
                //Text
                $(".fr-param", me.$params).filter(":text").each(function (index, input) {
                    $input = $(input);

                    if ($input.hasClass("fr-usedefault")) {
                        me._useDefault = true;
                        me._pushParam(a, $input, { Parameter: input.name, UseDefault: "true" });
                        return true;
                    }

                    if (me._shouldInclude(input, noValid)) {
                        if ($input.attr("ismultiple") === "false") {
                            me._pushParam(a, $input, { Parameter: input.name, IsMultiple: $input.attr("ismultiple"), Type: $input.attr("datatype"), Value: me._isParamNullable(input) });
                        } else {
                            var jsonValues = $input.attr("jsonValues");
                            me._pushParam(a, $input, { Parameter: input.name, IsMultiple: $input.attr("ismultiple"), Type: $input.attr("datatype"), Value: JSON.parse(jsonValues ? jsonValues : null) });
                        }
                    }
                });
                //Hidden
                $(".fr-param", me.$params).filter("[type='hidden']").each(function (index, input) {
                    $input = $(input);

                    if ($input.hasClass("fr-usedefault")) {
                        me._useDefault = true;
                        me._pushParam(a, $input, { Parameter: input.name, UseDefault: "true" });
                        return true;
                    }

                    if (me._shouldInclude(input, noValid)) {
                        if ($input.attr("ismultiple") === "false") {
                            me._pushParam(a, $input, { Parameter: input.name, IsMultiple: $input.attr("ismultiple"), Type: $input.attr("datatype"), Value: me._isParamNullable(input) });
                        } else {
                            var value = me._isParamNullable(input);
                            me._pushParam(a, $input, { Parameter: input.name, IsMultiple: $input.attr("ismultiple"), Type: $input.attr("datatype"), Value: JSON.parse(value ? value : null) });
                        }
                    }
                });
                //normal dropdown
                $(".fr-param", me.$params).filter("select").each(function (index, input) {
                    $input = $(input);

                    if ($input.hasClass("fr-usedefault")) {
                        me._useDefault = true;
                        me._pushParam(a, $input, { Parameter: input.name, UseDefault: "true" });
                        return true;
                    }

                    var shouldInclude = input.value !== null && me._shouldInclude(input, noValid);

                    if (shouldInclude) {
                        me._pushParam(a, $input, { Parameter: input.name, IsMultiple: $input.attr("ismultiple"), Type: $input.attr("datatype"), Value: me._isParamNullable(input) });
                    }
                });
                var radioList = {};
                //radio-group by radio name, default value: null
                $(".fr-param", me.$params).filter(":radio").each(function (index, input) {
                    $input = $(input);

                    if (!(input.name in radioList)) {
                        if (!noValid || me._isNullChecked(input)) {
                            radioList[input.name] = null;
                        }
                    }
                    if (input.checked === true) {
                        radioList[input.name] = me._isParamNullable(input);
                    }
                });
                for (var radioName in radioList) {
                    if (me.element.find(".fr-paramname-" + radioName).hasClass("fr-usedefault")) {
                        me._pushParam(a, $input, { Parameter: radioName, UseDefault: "true" });
                    }
                    else {
                        me._pushParam(a, $input, { Parameter: radioName, IsMultiple: "", Type: "Boolean", Value: radioList[radioName] });
                    }
                }

                // Return null if this report has no parameters
                if (a.length === 0) {
                    return null;
                }

                var paramsObject = { "ParamsList": a };
                return JSON.stringify(paramsObject);
            } else {
                // Return null if this report has no parameters
                return null;
            }
        },
        _isNullChecked: function (param) {
            var $cb = $(".fr-null-checkbox", this.$params).filter("[name='" + param.name + "']").first();
            return $cb.length !== 0 && $cb.prop("checked");
        },
        _isParamNullable: function (param) {
            var me = this;
            var $param = $(".fr-paramname-" + param.name, this.$params).filter(".fr-param");

            //check nullable
            if (me._isNullChecked(param)) {
                return null;
            } else if ($param.hasClass("fr-param-tree-hidden-input")) {
                if ($param.attr("backendValue") === nullPlaceHolder && $param.attr("nullable") === "true") {
                    return null;
                }
                return $param.attr("backendValue");
            } else if ($param.attr("allowblank") === "true" && $param.val() === "") {
                //check allow blank
                return "";
            } else if (forerunner.helper.hasAttr($param, "backendValue")) {
                //Take care of the big dropdown list
                if ($param.attr("backendValue") === nullPlaceHolder && $param.attr("nullable") === "true") {
                    return null;
                }
                return $param.attr("backendValue");
            } else if ($param.attr("datatype").toLowerCase() === "datetime") {
                var m = moment($param.val(), forerunner.ssr._internal.getMomentDateFormat(), true);

                //hard code a sql server accept date format here to parse all culture
                //date format to it. It's ISO 8601 format below 
                return m.format("YYYY-MM-DD");
            }
            else if ($param.attr("datatype").toLowerCase() === "boolean") {
                return $param.filter(":checked").val();
            }
            else {
                //Otherwise handle the case where the parameter has not been touched or normal drop down
                if ($param.val() === nullPlaceHolder)
                    return null;

                return $param.val();
            }
        },
        _hasValidValues: function (param) {
            var result = true;
            if (param.ValidValues === "" && param.ValidValuesQueryBased === false) {
                result = false;
            }
            return result;
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
            me._submittedParamsList = null;
            me._parameterDefinitions = null;
            me._dependencyList = null;

            $("." + paramContainerClass, me.element).remove();
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
        _containsSome: function (array, validValues) {
            var i = array.length;
            var j;

            while (i--) {
                j = validValues.length;
                while (j--) {
                    if (array[i] === validValues[j].Value)
                        return true;
                }
            }
            return false;
        },

        _hasDefaultValue: function (param) {
            var me = this;
            return me._defaultValueExist && $.isArray(param.DefaultValues);//&& param.DefaultValues[0];
        },
        _getDateTimeFromDefault: function (defaultDatetime) {
            var me = this;
            if (!defaultDatetime) {
                return null;
            }

            var dateFormat = forerunner.ssr._internal.getDateFormat().toUpperCase();
            var m = moment(defaultDatetime, forerunner.ssr._internal.getStandardMomentDateFormat());

            if (!m.isValid()) {
                me._DebugLog("_getDateTimeFromDefault", {
                    defaultDatetime: defaultDatetime,
                    dateFormat: dateFormat
                });
            }

            return m.isValid() ? m.format(dateFormat) : null;
        },
        _DebugLog: function (funcName, debugData) {
            var me = this;
            if (!me.isDebug) {
                return;
            }

            if (forerunner.device.isiOS()) {
                var $error = me.$form.find(".fr-param-debug-error");
                if ($error.length === 0) {
                    $error = $("<div class='fr-param-debug-error error'></dev>");
                    me.$form.append($error);
                }
                $error.text(funcName + ", " + JSON.stringify(debugData));
            }

            console.log(funcName, debugData);
        },
        _checkDependencies: function (param) {
            var me = this;
            var disabled = false;

            if ($.isArray(param.Dependencies) && param.Dependencies.length) {
                $.each(param.Dependencies, function (index, dependence) {
                    //exclude hidden element
                    var $targetElement = $(".fr-paramname-" + dependence, me.$params).not("[type='hidden']");
                    /*
                        if more than one parameter depend on the same parameter, then this 
                        parent parameter will bind change event more than once
                        so need to off change event first and bind
                    */
                    $targetElement.off("change");

                    $targetElement.on("change", function () {
                        me._refreshParameters(null, true, dependence);
                    });

                    //if nullable hookup null check box also                    
                    var $targetElementNull = $(".fr-null-checkbox", $targetElement.parent().parent()).not("[type='hidden']");
                    if ($targetElementNull.length === 1) {

                        $targetElementNull.on("change", function () {
                            if ($(this).is(":checked")) {
                                me._refreshParameters(null, true, dependence);
                            }
                        });
                    }

                });
            }

            if (param.State === "HasOutstandingDependencies") disabled = true;

            return disabled;
        },
        _dataPreprocess: function (parametersList, isRender) {
            var me = this;

            //clean cached data
            me._parameterDefinitions = null;
            me._dependencyList = null;
            me._isDropdownTree = true;
            $.each(parametersList, function (index, param) {
                me._parameterDefinitions = me._parameterDefinitions || {};
                me._paramValidation = me._paramValidation || {};

                me._parameterDefinitions[param.Name] = param;

                if (isRender) {
                    me._paramValidation[param.Name] = [];
                }

                if ($.isArray(param.Dependencies) && param.Dependencies.length) {
                    /*
                       For cascading tree component, only support 1 to 1 relationship
                       for 1-many, many-1, many-many cases show them in standard mode
                    */
                    if (me._isDropdownTree && param.Dependencies.length > 1) {
                        me._isDropdownTree = false;
                    }
                    me._dependencyList = me._dependencyList || {};

                    me._parameterDefinitions[param.Name].isChild = true;

                    if (me._isDropdownTree && me._hasValidValues(me._parameterDefinitions[param.Name]) === false) {
                        me._isDropdownTree = false;
                    }

                    //handle the hidden cascading parameter case, but I think it should not never happen.
                    if (me._isDropdownTree && param.Prompt === "") {
                        me._isDropdownTree = false;
                    }

                    $.each(param.Dependencies, function (index, dependence) {
                        me._parameterDefinitions[dependence].isParent = true;
                        //now we only support cascading tree to dropdown type, if either parent or children don't have validvalues
                        //then we don't apply tree to the element
                        if (me._isDropdownTree && me._hasValidValues(me._parameterDefinitions[dependence]) === false) {
                            me._isDropdownTree = false;
                        }

                        //Add dependency relationship, format: _dependencyList: { parent1: [childname1, childname2], ... }
                        if (!me._dependencyList[dependence]) {
                            me._dependencyList[dependence] = [];
                        }

                        if (!me._contains(me._dependencyList[dependence], param.Name)) {
                            me._dependencyList[dependence].push(param.Name);

                            if (me._dependencyList[dependence].length > 1) {
                                me._isDropdownTree = false;
                            }
                        }
                    });
                }
            });
        },
        //Ask viewer to refresh parameter, but not automatically post back if all parameters are satisfied        
        _refreshParameters: function (savedParams, isCascading, parentName) {
            var me = this;
            //set false not to do form validate.

            var paramList = savedParams ? savedParams : me.getParamsList(true);

            if (isCascading && parentName) {
                paramList = me._removeChildParam(paramList, parentName);
            }

            if (paramList) {
                // Ask viewer to refresh parameter, but not automatically post back
                // if all parameters are satisfied.
                me.options.$reportViewer.refreshParameters(paramList, false, -1, false, isCascading);
            }
        },
        _removeChildParam: function (paramList, parentName) {
            var me = this, result = paramList, pattern = null;

            var children = me._dependencyList[parentName];
           
            if (children) {
                var len = children.length;
                //build a dynamic regular expression to replace the child parameters with empty in cascading case.
                for (var i = 0; i < len; i++) {
                    pattern = new RegExp("\{\"Parameter\":\"" + children[i] + "\".+?\},?", ["g"]);

                    result = paramList.replace(pattern, "");

                    if (result.slice(-3) === ",]}") {
                        result = result.substring(0, result.length - 3) + "]}";
                    }


                    if (me._dependencyList[children[i]]) {
                        result = me._removeChildParam(result, children[i]);
                    }            
                }
            }
            return result;
        },
        _disabledSubSequenceControl: function ($control) {
            $control.attr("disabled", true).addClass("fr-param-disable");
        },
        _getDatePickerLoc: function () {
            var me = this;
            return me.options.$reportViewer.locData.datepicker;
        },
        //handle window resize action
        _paramWindowResize: function (event, data) {
            var me = event.data.me;

            forerunner.helper.delay(me, function () {
                me.$datepickers.filter(".datepicker-focus").datepicker("hide").datepicker("show");
            }, 100, "_parameterDelayId");
        },
        /**
        * Removes the report parameter functionality completely. This will return the element back to its pre-init state.
        *
        * @function $.forerunner.reportParameter#destroy
        */
        destroy: function () {
            var me = this;

            me.removeParameter();
            $(document).off("click", me._checkExternalClick);
            if (me.$datepickers.length) {
                $(window).off("resize", me._paramWindowResize);
            }

            this._destroy();
        }
    });  // $.widget
});