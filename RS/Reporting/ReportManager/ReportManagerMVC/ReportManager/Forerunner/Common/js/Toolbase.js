/**
 * @file Contains the toolBase widget.
 *
 */

var forerunner = forerunner || {};
forerunner.ssr = forerunner.ssr || {};

$(function () {
    var constants = forerunner.ssr.constants;
    var widgets = constants.widgets;
    var toolTypes = constants.toolTypes;
    var events = constants.events;

    var dropdownContainerClass = "fr-toolbase-dropdown-container";

    var getClassValue = function (textValue, defaultValue) {
        var returnText = defaultValue;
        if (typeof (textValue) !== "undefined") {
            returnText = "";
            if (textValue !== false && textValue !== null) {
                returnText = textValue;
            }
        }
        return returnText;
    };

    /**
     * The toolBase widget is used as a base namespace for toolbars and the toolPane
     *
     * @namespace $.forerunner.toolBase
     * @prop {Object} options - The options for toolBase
     * @prop {String} options.toolClass - The top level class for this tool (E.g., fr-toolbar)
     * @example
     * var widgets = {@link forerunner.ssr.constants.widgets};
     * $.widget(widgets.getFullname(widgets.toolbar), $.forerunner.toolBase, {
     *  options: {
     *      $reportViewer: null,
     *      toolClass: "fr-toolbar"
     *  },
     * });
     */
    $.widget(widgets.getFullname(widgets.toolBase), /** @lends $.forerunner.toolBase */ {
        options: {
            toolClass: null
        },

        /**
         * Add tools starting at index, enabled or disabled based upon the given tools array.
         * @function $.forerunner.toolBase#addTools
         *
         * @param {Integer} index - 1 based index of where to insert the button array.
         * @param {Boolean} enabled - true = enabled, false = disabled
         * @param {Array} tools - array containing the collection of tool information objects.
         * @example
         * var toolTypes = {@link forerunner.ssr.constants.toolTypes};
         * 
         * var btnMenu = {
         *  toolType: toolTypes.button,
         *  selectorClass: "fr-toolbar-menu-button",
         *  imageClass: "fr-icons24x24-menu",
         *  events: {
         *      click: function (e) {
         *          e.data.me._trigger(events.menuClick, null, {});
         *      }
         *  }
         * };
         * 
         * this.element.html("&lt;div class='" + me.options.toolClass + "'/>");
         * this.addTools(1, true, [btnMenu]);
         *
         *  Notes:
         *      Any events property that is of type function, e.g., "click" above will be interpreted
         *      as a event handler. The event, i.e., the name of the property will be bound to the button
         *      when the button is enabled and removed when the button is disabled.
         */
        addTools: function (index, enabled, tools) {
            var me = this;

            if (tools.length === 0) {
                return;
            }

            var $toolbar = me.element.find("." + me.options.toolClass);
            me._addChildTools($toolbar, index, enabled, tools);

            if (enabled) {
                me.enableTools(tools);
            }
            else {
                me.disableTools(tools);
            }
        },
        /**
         * Clears the allTools array. This function is useful when re-initializing a toolbar.
         *
         * @function $.forerunner.toolBase#removeAllTools
         */
        removeAllTools: function () {
            var me = this;
            me.allTools = me.allTools || {};
            me.allTools.length = 0;
        },
        /**
         * Configures the toolbar to hide / show buttons based upon the given configuration option
         *
         * @function $.forerunner.toolBase#configure
         */
        configure: function (toolbarConfigOption) {
            var me = this;
            me.toolbarConfigOption = toolbarConfigOption;
            $.each(me.allTools, function (Index, tool) {
                var $tool = me.element.find("." + tool.selectorClass);
                if ($tool.length > 0 && !me._isButtonInConfig($tool)) {
                    $tool.hide();
                }
            });
        },
        _configurations: function () {
            return [
                { name: constants.toolbarConfigOption.minimal, selectorClass: "fr-toolbase-config-minimal" },
                { name: constants.toolbarConfigOption.dashboardEdit, selectorClass: "fr-toolbase-config-edit" }
            ];
        },
        /**
         * Returns true if this toolbar is contained in a dashboard. Either directly or a child report.
         *
         * @function $.forerunner.toolBase#isDashboard
         */
        isDashboard: function () {
            var me = this;
            var returnValue = false;
            me.element.parents().each(function (index, element) {
                if (widgets.hasWidget($(element), widgets.dashboardEditor)) {
                    returnValue = true;
                }
            });
            return returnValue;
        },
        _isButtonInConfig: function ($tool) {
            var me = this;
            if (!me.toolbarConfigOption) {
                // Default is full so this case we always return true
                return true;
            }

            var found = false;
            $.each(me._configurations(), function (index, config) {
                if (me.toolbarConfigOption === config.name && $tool.hasClass(config.selectorClass)) {
                    // We must match the config name and have the selector class
                    found = true;
                }
            });

            // Otherwise this button is not in this configuration
            return found;
        },
        _addChildTools: function ($parent, index, enabled, tools) {
            var me = this;
            me.allTools = me.allTools || {};

            var $firstTool = $(me._getToolHtml(tools[0]));

            if (index <= 1) {
                $parent.prepend($firstTool);
            }
            else if (index > $parent.children().length) {
                $parent.append($firstTool);
            }
            else {
                var selector = ":nth-child(" + index + ")";
                var $child = $parent.children(selector);
                $child.before($firstTool);
            }

            var $tool = $firstTool;
            me._addChildTool($tool, tools[0], enabled);
            for (var i = 1; i < tools.length; i++) {
                var toolInfo = tools[i];
                if (toolInfo) {
                    $tool.after(me._getToolHtml(toolInfo));
                    $tool = $tool.next();
                    me._addChildTool($tool, toolInfo, enabled);
                } else {
                    throw new Error("Toolbase - addTools() Undefined tool, index: " + i + ", toolClass: " + me.options.toolClass);
                }
            }
        },
        _addChildTool: function ($tool, toolInfo, enabled) {
            var me = this;
            me.allTools[toolInfo.selectorClass] = toolInfo;
            if (toolInfo.toolType === toolTypes.toolGroup && toolInfo.tools) {
                me._addChildTools($tool, 1, enabled, toolInfo.tools);      // Add the children of a tool group
            }

            if (toolInfo.sharedClass) {
                $tool.addClass(toolInfo.sharedClass);
            }

            if (toolInfo.tooltip) {
                $tool.attr("title", toolInfo.tooltip());
            }
            
            if (toolInfo.dropdown) {
                me._createDropdown($tool, toolInfo);
            }

            if (toolInfo.toolType === toolTypes.select) {
                $tool.selectTool($.extend({}, me.options, { toolInfo: toolInfo, toolClass: "fr-toolbase-selectinner" }));
            }

            if (toolInfo.alwaysChange) {
                $tool.alwaysChange({ handler: toolInfo.alwaysChange, toolBase: me });
            }

            //for select widget the whole div container is hide
            if (toolInfo.visible === false) {
                $tool.hide();
            }

            //add an access entry to each toolbar item.
            me.allTools[toolInfo.selectorClass].$domReference = $tool;
        },
        _createDropdown: function ($tool, toolInfo) {
            var me = this;

            // Create the dropdown
            toolInfo.$dropdown = $("<div class='" + dropdownContainerClass + "'/>");
            toolInfo.$dropdown.toolDropdown({ $reportViewer: me.options.$reportViewer });
            toolInfo.$dropdown.toolDropdown("addTools", 1, true, toolInfo.tools);

            $tool.append(toolInfo.$dropdown);
            var $dropdown = $tool.find("." + dropdownContainerClass);
            var selectorClass = toolInfo.selectorClass;
            var imageClass = toolInfo.imageClass;

            // tool click event handler
            $tool.on("click", { toolInfo: toolInfo, $tool: $tool }, function (e) {
                if ($tool.hasClass("fr-toolbase-disabled")) {
                    return;
                }

                var left = e.data.$tool.filter(":visible").offset().left -
                           e.data.$tool.filter(":visible").offsetParent().offset().left;

                var top = e.data.$tool.height() +
                          e.data.$tool.filter(":visible").offset().top -
                          e.data.$tool.filter(":visible").offsetParent().offset().top;

                $dropdown.css("left", left);
                //$dropdown.css("top", e.data.$tool.filter(":visible").offset().top + e.data.$tool.height());
                $dropdown.css("top", top);
                $dropdown.toggle();
            });

            // dropdown dismiss handler
            $(document).on("click", function (e) {
                if ($dropdown.is(":visible") && !$(e.target).hasClass(selectorClass) && !$(e.target).hasClass(imageClass)) {
                    $dropdown.toggle();
                }
            });
        },
        /**
         * Return the tool object
         * @function $.forerunner.toolBase#getTool
         * @param {String} selectorClass - tool's class name
         *
         * @return {Object} - specify tool object
         */
        getTool: function (selectorClass) {
            var me = this;
            return me.allTools[selectorClass];
        },


        /**
        * Make tool visible
        * @function $.forerunner.toolBase#showTool
        * @param {String} selectorClass - tool's class name
        */
        showTool: function(selectorClass){
            var me = this,
                toolInfo = me.allTools[selectorClass];

            if (toolInfo) {
                // NOTE: that you cannot know when hiding a tool if it should be made
                // visible in the showTool function. So the strategy here is to remove
                // the display style on the element and thereby revert the visibility
                // back to the style sheet definition.
                var $toolEl = me.element.find("." + selectorClass);

                if (me._isButtonInConfig($toolEl)) {
                    $toolEl.css({ "display": "" });
                }

                if (toolInfo.toolType === toolTypes.select) {
                    toolInfo.$domReference.selectTool("show");
                }
            }
        },
        /**
         * Make list of tools visible
         * @function $.forerunner.toolBase#showTools
         * @param {Arr} selectorArr - the array of tool's class name
         */
        showTools: function (selectorArr) {
            var me = this;

            if (selectorArr && $.isArray(selectorArr)) {
                $.each(selectorArr, function (Index, Obj) {
                    if (Obj.selectorClass) me.showTool(Obj.selectorClass);
                });
            }
        },
        /**
         * Make all tools visible
         * @function $.forerunner.toolBase#showAllTools
         */
        showAllTools: function () {
            var me = this;

            $.each(me.allTools, function (Index, Obj) {
                if (Obj.selectorClass)
                    me.showTool(Obj.selectorClass);
            });
        },
        /**
        * Make tool hidden
        * @function $.forerunner.toolBase#hideTool
        * @param {String} selectorClass - tool's class name
        */
        hideTool: function (selectorClass) {
            var me = this;
            if (me.allTools[selectorClass]) {
                // NOTE: that you cannot know when hiding a tool if it should be made
                // visible in the showTool function. That is because a resize / orientation
                // change may happen that changes which buttons should be visible at the 
                // time showTool is called.
                var $toolEl = me.element.find("." + selectorClass);
                $toolEl.hide();
            } else if (forerunner.config.getCustomSettingsValue("Debug", "off") === "on") {
                console.log("hideTool called with an invalid selector class: " + selectorClass);
            }
        },
        /**
         * Make list of tools hidden
         * @function $.forerunner.toolBase#hideTools
         * @param {Arr} selectorArr - the array of tool's class name
         */
        hideTools: function(selectorArr) {
            var me = this;

            if (selectorArr && $.isArray(selectorArr)) {
                $.each(selectorArr, function (Index, Obj) {
                    if (Obj.selectorClass && Obj.toolType !== toolTypes.toolGroup) {
                        me.hideTool(Obj.selectorClass);
                    }
                });
            }
        },
        /**
         * Make all tools hidden
         * @function $.forerunner.toolBase#hideAllTools
         */
        hideAllTools: function () {
            var me = this;
            $.each(me.allTools, function (Index, Obj) {
                //skip hide toolGroup, it will hide all its buttons inside.
                if (Obj.selectorClass && Obj.toolType !== toolTypes.toolGroup) {
                    var $toolEl = me.element.find("." + Obj.selectorClass);

                    if (!$toolEl.hasClass("fr-toolbase-no-hide-id")) {
                        me.hideTool(Obj.selectorClass);
                    }
                }
            });
        },
        /**
         * Enable or disable tool frozen
         * @function $.forerunner.toolBase#freezeEnableDisable
         * @param {Boolean} freeze - ture: enable, false: disable
         */
        freezeEnableDisable: function (freeze) {
            var me = this;
            me.frozen = freeze;
        },
        /**
         * Enable the given tools
         * @function $.forerunner.toolBase#enableTools
         * @param {Array} tools - Array of tools to enable
         */
        enableTools: function (tools) {
            var me = this;

            if (me.frozen === true) {
                return;
            }

            $.each(tools, function (index, toolInfo) {
                if (toolInfo) {
                    var $toolEl = me.element.find("." + toolInfo.selectorClass);
                    $toolEl.removeClass("fr-toolbase-disabled");
                    if (toolInfo.events) {
                        $toolEl.addClass("fr-core-cursorpointer");
                        me._removeEvent($toolEl, toolInfo);   // Always remove any existing event, this will avoid getting two accidentally
                        me._addEvents($toolEl, toolInfo);
                    }
                    if (toolInfo.toolType === toolTypes.toolGroup && toolInfo.tools) {
                        me.enableTools(toolInfo.tools);
                    }

                    if (me.hideDisabledTool && $toolEl.hasClass("fr-hide-if-disable")) {
                        me.showTool(toolInfo.selectorClass);
                    }
                } else {
                    throw new Error("Toolbase - enableTools() Undefined tool, index: " + index + ", toolClass: " + me.options.toolClass);
                }
            });
        },
        /**
         * Disable the given tools
         * @function $.forerunner.toolBase#disableTools
         * @param {Array} tools - Array of tools to disable
         */
        disableTools: function (tools) {
            var me = this;

            if (me.frozen === true) {
                return;
            }

            $.each(tools, function (index, toolInfo) {
                if (toolInfo) {
                    var $toolEl = me.element.find("." + toolInfo.selectorClass);
                    $toolEl.addClass("fr-toolbase-disabled");
                    if (toolInfo.events) {
                        $toolEl.removeClass("fr-core-cursorpointer");
                        me._removeEvent($toolEl, toolInfo);
                    }
                    if (toolInfo.toolType === toolTypes.toolGroup && toolInfo.tools) {
                        me.disableTools(toolInfo.tools);
                    }

                    if (me.hideDisabledTool && $toolEl.hasClass("fr-hide-if-disable")) {
                        me.hideTool(toolInfo.selectorClass);
                    }
                } else {
                    throw new Error("Toolbase - disableTools() Undefined tool, index: " + index + ", toolClass: " + me.options.toolClass);
                }
            });
        },
        /**
        * Make all tools enable that where enabled before disable
        * @function $.forerunner.toolBase#enableAllTools
        */
        enableAllTools: function () {
            var me = this;

            $.each(me.allTools, function (index, toolInfo) {
                if (toolInfo.selectorClass && me.allTools[toolInfo.selectorClass].isEnable) {
                    me.enableTools([toolInfo]);
                }
            });
        },
        /**
        * Make all tools disable and remember which ones where enabled
        * @function $.forerunner.toolBase#disableAllTools
        */
        disableAllTools: function () {
            var me = this;

            $.each(me.allTools, function (Index, Tools) {
                if (Tools.selectorClass) {
                    var $toolEl = me.element.find("." + Tools.selectorClass);
                    if (!$toolEl.hasClass("fr-toolbase-no-disable-id")) {
                        me.allTools[Tools.selectorClass].isEnable = !$toolEl.hasClass("fr-toolbase-disabled");
                        me.disableTools([Tools]);
                    }
                }
            });
        },
        _orderedList: [],
        // Return an array ordered by visibilityOrder
        _getOrderedList: function () {
            var me = this;

            if (forerunner.helper.objectSize(me.allTools) === me._orderedList.length) {
                // Only regenerate the ordered list if the size of allTools changes
                return me._orderedList;
            }
            me._orderedList = [];

            // Process the alltools array
            $.each(me.allTools, function (index, toolInfo) {
                var $tool = me.element.find("." + toolInfo.selectorClass);
                var width = $tool.outerWidth();
                if (toolInfo.visibilityNoWidth) {
                    width = 0;
                }
                me._orderedList.push({ toolInfo: toolInfo, width: width });
            });

            // Sort the array
            me._orderedList.sort(function (a, b) {
                if (a.toolInfo.visibilityOrder === undefined) {
                    a.toolInfo.visibilityOrder = 0;
                }
                if (b.toolInfo.visibilityOrder === undefined) {
                    b.toolInfo.visibilityOrder = 0;
                }

                return a.toolInfo.visibilityOrder - b.toolInfo.visibilityOrder;
            });

            return me._orderedList;
        },
        /**
         * Show/Hide buttons when window resize
         * @function $.forerunner.toolBase#windowResize
         */
        windowResize: function () {           
            var me = this;
         
            var toolbarWidth = me.element.width();
            var tools = me._getOrderedList();

            var runningWidth = 0;
            var firstOver = null;

            $.each(tools, function (index, tool) {
                var $tool = me.element.find("." + tool.toolInfo.selectorClass);
                $tool.removeClass("fr-core-hidden");
                if ($tool.is(":visible")) {
                    // Only total widths of visible tools
                    runningWidth += tool.width;
                    if (runningWidth > toolbarWidth) {
                        if (firstOver === null) {
                            firstOver = {
                                index: index,
                                visibilityOrder: tool.toolInfo.visibilityOrder
                            };
                        }
                        $tool.addClass("fr-core-hidden");
                    }
                }
            });

            if (firstOver !== null) {
                // Make sure any tools with the same visibility order are hidden
                var index = firstOver.index - 1;
                while (index > 0 && tools[index].toolInfo.visibilityOrder === firstOver.visibilityOrder) {
                    var $tool = me.element.find("." + tools[index].toolInfo.selectorClass);
                    $tool.addClass("fr-core-hidden");
                    index--;
                }
            }
        },
        _getToolHtml: function (toolInfo) {
            var me = this;

            // Get class string options
            var toolStateClass = getClassValue(toolInfo.toolStateClass, "fr-toolbase-state ");
            var iconClass = getClassValue(toolInfo.iconClass, "fr-icons24x24");
            var toolContainerClass = getClassValue(toolInfo.toolContainerClass, "fr-toolbase-toolcontainer");
            var groupContainerClass = getClassValue(toolInfo.groupContainerClass, "fr-toolbase-groupcontainer");
            var itemContainerClass = getClassValue(toolInfo.itemContainerClass, "fr-toolbase-itemcontainer");
            var itemTextContainerClass = getClassValue(toolInfo.itemTextContainerClass, "fr-toolbase-item-text-container");
            var itemTextClass = getClassValue(toolInfo.itemTextClass, "fr-toolbase-item-text");

            if (toolInfo.toolType === toolTypes.button) {
                return "<div class='" + toolContainerClass + " " + toolStateClass + toolInfo.selectorClass + "'>" +
                            "<div class='" + iconClass + " " + toolInfo.imageClass + "' />" +
                        "</div>";
            }
            else if (toolInfo.toolType === toolTypes.input) {
                var type = "";
                if (toolInfo.inputType) {
                    type = " type='" + toolInfo.inputType + "'";
                }
                return "<input class='" + toolInfo.selectorClass + "'" + type + " />";
            }
            else if (toolInfo.toolType === toolTypes.select) {
                return "<div class='fr-toolbase-selectcontainer' />";
            }
            else if (toolInfo.toolType === toolTypes.textButton) {
                return "<div class='" + toolContainerClass + " " + toolStateClass + toolInfo.selectorClass + "'>" + me._getText(toolInfo) + "</div>";
            }
            else if (toolInfo.toolType === toolTypes.plainText) {
                return "<span class='" + toolInfo.selectorClass + "'> " + me._getText(toolInfo) + "</span>";
            }
            else if (toolInfo.toolType === toolTypes.containerItem) {
                var text = "";
                if (toolInfo.text) {
                    text = me._getText(toolInfo);
                }

                var imageClass = getClassValue(toolInfo.imageClass, "");
                var rightImageDiv = "";
                if (toolInfo.rightImageClass) {
                    rightImageDiv = "<div class='fr-toolbase-rightimage " + toolInfo.rightImageClass + "'></div>";
                }
                var html = "<div class='" + itemContainerClass + " " + toolStateClass + toolInfo.selectorClass + "'>" +
                            "<div class='" + iconClass + " " + imageClass + "'></div>" +
                            "<div class='" + itemTextContainerClass + "'>" +
                                "<div class='" + itemTextClass + "'>" + text + "</div>" +
                            "</div>" +
                            rightImageDiv +
                            "</div>";
                return html;
            }
            else if (toolInfo.toolType === toolTypes.toolGroup) {
                return "<div class='" + groupContainerClass + " " + toolInfo.selectorClass + "'></div>";
            }
        },
        _getText: function (toolInfo) {
            var text;
            var me = this;

            //Make sure loc files is loaded
            if (typeof toolInfo.text === "function")
                text = toolInfo.text({ $reportViewer: me.options.$reportViewer });
            else
                text = toolInfo.text;
            
            return text;
            
        },
        _removeEvent: function ($toolEl, toolInfo) {
            var me = this;
            for (var key in toolInfo.events) {
                if (typeof toolInfo.events[key] === "function") {
                    $toolEl.off(key, toolInfo.events[key]);
                }
            }
        },
        _addEvents: function ($toolEl, toolInfo) {
            var me = this;
            for (var key in toolInfo.events) {
                if (typeof toolInfo.events[key] === "function") {
                    $toolEl.on(key, null, { me: me, $appContainer: me.options.$appContainer,  $reportViewer: me.options.$reportViewer, $reportExplorer: me.options.$reportExplorer }, toolInfo.events[key]);
                }
            }
        },
        /**
        * Remove hide disable class from given tools
        * @param {Array} tools - item list
        * @function $.forerunner.toolBase#removeHideDisable
        */
        removeHideDisable: function (tools) {
            var me = this;
            if (me.hideDisabledTool) {
                $.each(tools, function (index, toolInfo) {
                    me.element.find("." + toolInfo.selectorClass).removeClass("fr-hide-if-disable");
                });
            }
        },
        _create: function () {
        },
        _init: function () {
            var me = this;
            //inilialize widget data
            me.frozen = false;

            forerunner.config.getCustomSettings(function () {
                me.hideDisabledTool = (forerunner.config.getCustomSettingsValue("HideDisabledTool", "on") === "on");
            });

            
        }
    });  // $.widget

    // The alwaysChange widget enables a callback to always be called on a select element
    // even if the user selects the currently selected option.
    $.widget(widgets.getFullname("alwaysChange"), $.forerunner.toolBase, {
        options: {
            toolBase: null,
            handler: null
        },
        _create: function () {
            var me = this;
            
            var $select = me.element.is('select') ? me.element : me.element.find("select");

            var focusIndex = -1;
            $select.on("change", function (e) {
                focusIndex = -1;
                if (typeof me.options.handler === "function") {
                    e.data = { me: me.options.toolBase };
                    me.options.handler(e);
                }
            });
            $select.on("focus", function (e) {
                if ($select.prop("selectedIndex") !== 0 && focusIndex === -1) {
                    focusIndex = $select.prop("selectedIndex");
                    $select.prop("selectedIndex", 0);
                    // Blur does not work properly with IE 11
                    //$select.blur();

                    var resetSelected = function (e) {
                        if (!$select.is(e.target)) {
                            // Reset the selected index if no choice was made
                            if ($select.prop("selectedIndex") === 0) {
                                $select.prop("selectedIndex", focusIndex);
                            }
                            focusIndex = -1;
                            $("body").off("keyup mouseup", resetSelected);
                        }
                    };

                    $("body").off("keyup mouseup", resetSelected);
                    $("body").on("keyup mouseup", resetSelected);
                }
            });
        },
    });  // $widget

    // popup widget used with the showDrowpdown method
    $.widget(widgets.getFullname("toolDropdown"), $.forerunner.toolBase, {
        options: {
            $reportViewer: null,
            toolClass: "fr-toolbase-dropdown"
        },
        _init: function () {
            var me = this;
            me._super();

            me.element.html("<div class='" + me.options.toolClass + " fr-core-widget'/>");
        },
    });  // $widget

    // Defines a toolbar select tool widget
    $.widget(widgets.getFullname("selectTool"), {
        options: {
            toolClass: "fr-toolbase-selectinner",
        },
        _init: function () {
            var me = this;
            var optionClass = getClassValue(me.options.toolInfo.optionClass, "fr-toolbase-option");

            me.element.html("");
            var $selectContainer = $(
                "<div class='" + me.options.toolClass + " fr-core-widget'>" +
                    "<select class='" + me.options.toolInfo.selectorClass + "' readonly='true' ismultiple='false'></select>" +
                "</div>");

            me.options.toolInfo.containerClass && me.element.addClass(me.options.toolInfo.containerClass);
            me.element.append($selectContainer);
        },
        _create: function () {
            var me = this;
            if (me.options.toolInfo.model) {
                me.model = me.options.toolInfo.model.call(me);
                if (me.options.toolInfo.modelChange) {
                    me.model.on(me.options.toolInfo.modelChange, function (e, data) {
                        me._onModelChange.call(me, e, data);
                    });
                }
            }
        },
        _onModelChange: function (e, data) {
            var me = this;
            var $select = me.element.find("." + me.options.toolInfo.selectorClass);
            $select.html("");
            $.each(data.optionArray, function (index, option) {
                var encodedOptionName = forerunner.helper.htmlEncode(option.name);
                var $option = $("<option value=" + option.id + ">" + encodedOptionName + "</option>");
                $select.append($option);
            });
            $select.children("option").each(function (index, option) {
                if ($(option).val() === data.selectedId) {
                    $select.prop("selectedIndex", index);
                }
            });
        },
        show: function () {
            var me = this;

            me.element.show();
        }
    });  // $widget

});  // function()
