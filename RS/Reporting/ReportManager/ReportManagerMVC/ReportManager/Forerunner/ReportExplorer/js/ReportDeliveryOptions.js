// Assign or create the single globally scoped variable
var forerunner = forerunner || {};

// Forerunner SQL Server Reports objects
forerunner.ajax = forerunner.ajax || {};
forerunner.ssr = forerunner.ssr || {};
forerunner.ssr.constants = forerunner.ssr.constants || {};
forerunner.ssr.constants.events = forerunner.ssr.constants.events || {};

$(function () {
    var ssr = forerunner.ssr;
    var events = ssr.constants.events;
    var widgets = forerunner.ssr.constants.widgets;
    var locData = forerunner.localize.getLocData(forerunner.config.forerunnerFolder() + "/ReportViewer/loc/ReportViewer");

    $.widget(widgets.getFullname(widgets.reportDeliveryOptions), {
        options: {
            reportPath: null,
            $appContainer: null,
            subscriptionModel: null,
            subscriptionID: null,
            subDetails: null
        },
        _extensionSettings: null,
        _createDropDownForValidValues : function(validValues) {
            return forerunner.helper.createDropDownForValidValues(validValues);
        },
        _createRadioButtonsForValidValues : function(validValues, index) {
            return forerunner.helper.createRadioButtonsForValidValues(validValues, index);
        },
        _initExtensionSettings : function(extensionName) {
            var me = this;
            var $table = new $("<TABLE />");
            var result = me.options.subscriptionModel.subscriptionModel("getExtensionSettings", extensionName);
            $.when(result).done(function (data) {
                me._extensionSettings = data;
                for (var i = 0; i < data.length; i++) {
                    var ext = data[i];
                    var $row = new $("<TR />");
                    var $displayName = new $("<TD />");
                    $displayName.append(ext.DisplayName);
                    var $value = new $("<TD />");
                    if (ext.ValidValues === null) {
                        var $input = new $("<INPUT/>");
                        if (ext.IsPassword || ext.Encrypted) {
                            $input.attr("type", "password");
                        } else {
                            $input.attr("type", "text");
                        }
                        $value.append($input);
                    } else {
                        if (ext.ValidValues.length > 3) {
                            $value.append(me._createDropDownForValidValues(ext.ValidValues));
                        } else {
                            $value.append(me._createRadioButtonsForValidValues(ext.ValidValues, "extensionSettings" + i));
                        }
                    }
                    $row.append($displayName);
                    $row.append($value);
                    $table.append($row);
                }
                me.$extensionSettings.append("Options: <BR/>");
                me.$extensionSettings.append($table);
            }).fail(
                function (data) {
                    forerunner.dialog.showMessageBox(me.options.$appContainer, me.locData.messages.loadExtensionSettingsFailed);
                }
            );
        },
        _initExtensionOptions : function () {
            var me = this;
            var $text = "Delivered By";
            var $select = new $("<SELECT />");
            
            var result = me.options.subscriptionModel.subscriptionModel("getDeliveryExtensions");
            $.when(result).done(function (data) {
                for (var i = 0; i < data.length; i++) {
                    var ext = data[i];
                    var $option = new $("<OPTION/>");
                    $option.attr("value", ext.Name);
                    $option.append(ext.LocalizedName);
                    $select.append($option);
                }
            }).fail(
                function (data) {
                    forerunner.dialog.showMessageBox(me.options.$appContainer, me.locData.messages.loadDeliveryExtensionsFailed);
                }
            );

            var callback = function () {
                if ($select.val() === "") return;
                me._initExtensionSettings($select.val());
            };
            $select.attr("onchange", callback);
            me.$deliveryOptions.append($text);
            me.$deliveryOptions.append($select);
        },
        _initProcessingOptions: function () {
            var me = this;
            me.$processingOptions.html("");
            me.$processingOptions.append("Processing options:<BR/>");
            var $container = new $("<DIV />");
            me.$processingOptions.append($container);
            $container.subscriptionProcessingOptions({
                reportPath: me.options.reportPath,
                $appContainer: me.options.$appContainer,
                subscriptionModel: me.options.subscriptionModel,
                subscriptionID: me.options.subscriptionID,
                subDetails: me.options.subDetails
            });
        },
        _initSections : function () {
            var me = this;
            me._initExtensionOptions();
            me._initProcessingOptions();
        },
        _create: function () {
            var me = this;
            me.element.html("");
            me.$theForm = new $("<FORM />");
            me.$deliveryOptions = forerunner.helper.createDiv(["fr-sub-deliveryoptions"]);
            me.$theForm.append(me.$deliveryOptions);
            me.$extensionSettings = forerunner.helper.createDiv(["fr-sub-extensionsettings"]);
            me.$theForm.append(me.$extensionSettings);
            me.$processingOptions = forerunner.helper.createDiv(["fr-sub-processingoptions"]);
            me.$theForm.append(me.$processingOptions);
            me.$parameterOptions = forerunner.helper.createDiv(["fr-sub-parameteroptions"]);
            me.$theForm.append(me.$parameterOptions);
            me.$actions = forerunner.helper.createDiv(["fr-sub-actions"]);
            me.$theForm.append(me.actions);
            me._initSections();
            me.element.append(me.$theForm);
        },
    });  // $.widget(
});  // $(function ()
