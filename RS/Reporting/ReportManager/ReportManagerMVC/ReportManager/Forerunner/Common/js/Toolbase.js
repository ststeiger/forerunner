// Assign or create the single globally scoped variable
var forerunner = forerunner || {};

// Forerunner SQL Server Reports
forerunner.ssr = forerunner.ssr || {};

$(function () {
    var widgets = forerunner.ssr.constants.widgets;
    var toolTypes = forerunner.ssr.constants.toolTypes;

    $.widget(widgets.getFullname(widgets.toolBase), {
        options: {
            toolClass: null     // Define the top level class for this tool (E.g., fr-toolbar)
        },

        allTools: {},

        //addTool
        //  index - 1 based index of where to insert the button array
        //  enabled - true = enabled, false = dasbled
        //  tools: [{
        //      toolType: forerunner.ssr.constants.toolTypes.button,
        //      selectorClass: '',
        //      imageClass: '',
        //      text: '',
        //      inputType: 'number',    // Used with toolTypes.inp
        //      events: {
        //          click: function (e) {
        //      }
        //  }]
        //
        //  Notes:
        //      Any toolInfo.events property that is of type function, e.g., "click" above will be interpreted
        //      as a event handler. The event, i.e., the name of the property will be bound to the button
        //      when the button is enabled and removed when the button is disabled.
        addTools: function (index, enabled, tools) {
            var me = this;
            var $toolbar = me.element.find("." + me.options.toolClass);
            me._addChildTools($toolbar, index, enabled, tools);

            if (enabled) {
                me.enableTools(tools);
            }
            else {
                me.disableTools(tools);
            }
        },
        _addChildTools: function ($parent, index, enabled, tools) {
            var me = this;
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

            me.allTools[tools[0].selectorClass] = tools[0];
            if (tools[0].toolType === toolTypes.toolGroup && tools[0].tools) {
                me._addChildTools($firstTool, 1, enabled, tools[0].tools);      // Add the children of a tool group
            }

            var $tool = $firstTool;
            for (var i = 1; i < tools.length; i++) {
                var toolInfo = tools[i];
                $tool.after(me._getToolHtml(toolInfo));
                $tool = $tool.next();
                me.allTools[toolInfo.selectorClass] = toolInfo;

                if (toolInfo.toolType === toolTypes.toolGroup && toolInfo.tools) {
                    me._addChildTools($tool, 1, enabled, toolInfo.tools);      // Add the children of a tool group
                }
            }
        },
        hideTools: function (){
            var me = this;

            $.each(me.allTools, function (Index, Obj) {
                if (Obj.selectorClass) {
                    var $toolEl = $("." + Obj.selectorClass, me.element);
                    Obj.Display = $toolEl.is(":visible");
                    $toolEl.fadeOut();
                }
            });

        },
        showTools: function () {
            var me = this;

            $.each(me.allTools, function (Index, Obj) {
                if (Obj.selectorClass) {
                    var $toolEl = $("." + Obj.selectorClass, me.element);
                    if (Obj.Display)
                        $toolEl.fadeIn();
                }
            });

        },
        enableTools: function (tools) {
            var me = this;
            $.each(tools, function (index, toolInfo) {
                var $toolEl = $("." + toolInfo.selectorClass, me.element);
                $toolEl.removeClass("fr-toolbase-disabled");
                if (toolInfo.events) {
                    $toolEl.addClass("fr-core-cursorpointer");
                    me._removeEvent($toolEl, toolInfo);   // Always remove any existing event, this will avoid getting two accidentally
                    me._addEvents($toolEl, toolInfo);
                }
                if (toolInfo.toolType === toolTypes.toolGroup && toolInfo.tools) {
                    me.enableTools(toolInfo.tools);
                }
            });
        },

        disableTools: function (tools) {
            var me = this;
            $.each(tools, function (index, toolInfo) {
                var $toolEl = $("." + toolInfo.selectorClass, me.element);
                $toolEl.addClass("fr-toolbase-disabled");
                if (toolInfo.events) {
                    $toolEl.removeClass("fr-core-cursorpointer");
                    me._removeEvent($toolEl, toolInfo);
                }
                if (toolInfo.toolType === toolTypes.toolGroup && toolInfo.tools) {
                    me.disableTools(toolInfo.tools);
                }
            });
        },
        _removeEvent: function ($toolEl, toolInfo) {
            var me = this;
            for (var key in toolInfo.events) {
                if (typeof toolInfo.events[key] === "function") {
                    $toolEl.off(key);
                }
            }
        },
        _addEvents: function ($toolEl, toolInfo) {
            var me = this;
            for (var key in toolInfo.events) {
                if (typeof toolInfo.events[key] === "function") {
                    $toolEl.on(key, null, { me: me, $reportViewer: me.options.$reportViewer }, toolInfo.events[key]);
                }
            }
        },
        _getToolHtml: function (toolInfo) {
            var me = this;
            if (toolInfo.toolType === toolTypes.button) {
                return "<div class='fr-toolbase-toolcontainer fr-toolbase-state " + toolInfo.selectorClass + "'>" +
                            "<div class='fr-toolbase-icon " + toolInfo.imageClass + "' />" +
                        "</div>";
            }
            else if (toolInfo.toolType === toolTypes.input) {
                var type = "";
                if (toolInfo.inputType) {
                    type = ", type='" + toolInfo.inputType + "'";
                }
                return "<input class='" + toolInfo.selectorClass + "'" + type + " />";
            }
            else if (toolInfo.toolType === toolTypes.textButton) {
                return "<div class='fr-toolbase-toolcontainer fr-toolbase-state " + toolInfo.selectorClass + "'>" + me._getText(toolInfo) + "</div>";
            }
            else if (toolInfo.toolType === toolTypes.plainText) {
                return "<span class='" + toolInfo.selectorClass + "'> " + me._getText(toolInfo) + "</span>";
                }
            else if (toolInfo.toolType === toolTypes.containerItem) {
                var text = "";
                if (toolInfo.text) {
                    text = me._getText(toolInfo);
                }
                return "<div class='fr-toolbase-itemcontainer fr-toolbase-state " + toolInfo.selectorClass + "'>" +
                            "<div class='fr-toolbase-icon " + toolInfo.imageClass + "' />" +
                            text +
                        "</div>";
            }
            else if (toolInfo.toolType === toolTypes.toolGroup) {
                return "<div class='fr-toolbase-groupcontainer " + toolInfo.selectorClass + "'></div>";
            }
        },
        _getText: function (toolInfo) {
            var text;
            var me = this;

            if (typeof toolInfo.text === "function")
                text = toolInfo.text({ $reportViewer: me.options.$reportViewer });
            else
                text = toolInfo.text;
            return text;
        },
        _destroy: function () {
        },

        _create: function () {
           
        },
    });  // $.widget
});  // function()
