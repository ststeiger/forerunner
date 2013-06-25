// Assign or create the single globally scoped variable
var forerunner = forerunner || {};

$(function () {
    var fr = forerunner;

    // Toolbar widget
    $.widget("Forerunner.toolbase", {
        options: {
            toolClass: null     // Define the top level class for this tool (E.g., fr-toolbar)
        },
        toolTypes: {
            button:     0,
            input:      1,
            textButton: 2,
            plainText:  3,
            paneItem:   4
        },
        //addTool
        //  index - 1 based index of where to insert the button array
        //  enabled - true = enabled, false = dasbled
        //  toolInfoArray: [{
        //      toolType: fr.ssr.constants.toolTypes.button,
        //      selectorClass: '',
        //      imageClass: '',
        //      text: '',
        //      inputType: 'number',    // Used with button type 1
        //      events: {
        //          click: function (e) {
        //      }
        //  }]
        //
        //  Notes:
        //      Any toolInfo.events property that is of type function, e.g., "click" above will be interpreted
        //      as a event handler. The event, i.e., the name of the property will be bound to the button
        //      when the button is enabled and removed when the button is disabled.
        addTools: function (index, enabled, toolInfoArray) {
            var me = this;
            var $toolbar = me.element.find('.' + me.options.toolClass);
            var $firstTool = $(me._getToolHtml(toolInfoArray[0]));

            if (me.tools == null)
                me.tools = new Object();

            if (index <= 1) {
                $toolbar.prepend($firstTool);
            }
            else if (index > $toolbar.children().length) {
                $toolbar.append($firstTool);
            }
            else {
                var selector = ':nth-child(' + index + ')';
                var $child = $toolbar.find(selector);
                $child.before($firstTool);
            }
            
            var $tool = $firstTool;
            me.tools[toolInfoArray[0].selectorClass] =toolInfoArray[0];
            for (i = 1; i < toolInfoArray.length; i++) {
                $tool.after(me._getToolHtml(toolInfoArray[i]));
                $tool = $tool.next();
                me.tools[toolInfoArray[i].selectorClass] = toolInfoArray[i];
            }

            if (enabled) {
                me.enableTools(toolInfoArray);
            }
            else {
                me.disableTools(toolInfoArray);
            }
        },
        hideTools: function (){
            var me = this;

            $.each(me.tools, function (Index, Obj) {
                if (Obj.selectorClass != null) {                    
                    var $toolEl = $("." + Obj.selectorClass, me.element);
                    Obj["Display"] = $toolEl.is(":visible");
                    $toolEl.fadeOut();
                }
            });

        },
        showTools: function () {
            var me = this;

            $.each(me.tools, function (Index, Obj) {
                if (Obj.selectorClass != null) {
                    var $toolEl = $("." + Obj.selectorClass, me.element);
                    if (Obj["Display"])
                        $toolEl.fadeIn();
                }
            });

        },
        enableTools: function (toolInfoArray) {
            var me = this;
            toolInfoArray.forEach(function (toolInfo, index, array) {
                var $toolEl = $("." + toolInfo.selectorClass, me.element);
                $toolEl.removeClass('fr-tool-disabled');
                $toolEl.addClass('cursor-pointer');
                me._removeEvent($toolEl, toolInfo);   // Always remove any existing event, this will avoid getting two accidentally
                me._addEvents($toolEl, toolInfo)
            }, me);
        },

        disableTools: function (toolInfoArray) {
            var me = this;
            toolInfoArray.forEach(function (toolInfo, index, array) {
                var $toolEl = $("." + toolInfo.selectorClass, me.element);
                $toolEl.addClass('fr-tool-disabled');
                $toolEl.removeClass('cursor-pointer');
                me._removeEvent($toolEl, toolInfo);
            }, me);
        },
        _removeEvent: function ($toolEl, toolInfo) {
            var me = this;
            for (var key in toolInfo.events) {
                if (typeof toolInfo.events[key] == 'function') {
                    $toolEl.off(key);
                }
            }
        },
        _addEvents: function ($toolEl, toolInfo) {
            var me = this;
            for (var key in toolInfo.events) {
                if (typeof toolInfo.events[key] == 'function') {
                    $toolEl.on(key, null, { me: me, $reportViewer: me.options.$reportViewer }, toolInfo.events[key]);
                }
            }
        },
        _getToolHtml: function (toolInfo) {
            var me = this;
            if (toolInfo.toolType == fr.ssr.constants.toolTypes.button) {
                return "<div class='fr-tool-container fr-tool-state " + toolInfo.selectorClass + "'>" +
                            "<div class='fr-tool-icon " + toolInfo.imageClass + "' />" +
                        "</div>";
            }
            else if (toolInfo.toolType == fr.ssr.constants.toolTypes.input) {
                var type = "";
                if (toolInfo.inputType) {
                    type = ", type='" + toolInfo.inputType + "'";
                }
                return "<input class='" + toolInfo.selectorClass + "'" + type + " />";
            }
            else if (toolInfo.toolType == fr.ssr.constants.toolTypes.textButton) {
                return "<div class='fr-tool-container fr-tool-state " + toolInfo.selectorClass + "'>" + me._getText(toolInfo) + "</div>";
            }
            else if (toolInfo.toolType == fr.ssr.constants.toolTypes.plainText) {
                return "<span class='" + toolInfo.selectorClass + "'> " + me._getText(toolInfo) + "</span>";
                }
            else if (toolInfo.toolType == fr.ssr.constants.toolTypes.containerItem) {
                var text = '';
                if (toolInfo.text) {
                    text = me._getText(toolInfo);
                }
                return "<div class='fr-item-container fr-tool-state " + toolInfo.selectorClass + "'>" +
                            "<div class='fr-tool-icon " + toolInfo.imageClass + "' />" +
                            text +
                        "</div>";
            }
        },
        _getText: function (toolInfo) {
            var text;
            var me = this;

            if (typeof toolInfo.text == 'function')
                text = toolInfo.text({ $reportViewer: me.options.$reportViewer });
            else
                text = toolInfo.text
            return text;
        },
        _destroy: function () {
        },

        _create: function () {
           
        },
    });  // $.widget
});  // function()
