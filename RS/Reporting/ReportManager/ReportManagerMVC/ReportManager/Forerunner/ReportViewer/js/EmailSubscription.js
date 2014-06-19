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
    var locData = forerunner.localize.getLocData(forerunner.config.forerunnerFolder() + "ReportViewer/loc/ReportViewer");

    $.widget(widgets.getFullname(widgets.emailSubscription), {
        options: {
            reportPath: null,
            $appContainer: null,
            subscriptionModel: null,
            paramList: null
        },
        _extensionSettings: null,
        _createDropDownForValidValues : function(validValues) {
            return forerunner.helper.createDropDownForValidValues(validValues);
        },
        _createRadioButtonsForValidValues : function(validValues, index) {
            return forerunner.helper.createRadioButtonsForValidValues(validValues, index);
        },
        _createDiv: function (listOfClasses) {
            var $div = new $("<div />");
            for (var i = 0; i < listOfClasses.length; i++) {
                $div.addClass(listOfClasses[i]);
            }
            return $div;
        },
        _createDropDownWithLabel: function (label, validValues) {
            var me = this;
            me.$colOfLastRow.append("<BR/>");
            var id = forerunner.helper.guidGen();
            var $label = new $("<LABEL />");
            $label.attr("for", id);
            $label.append(label);
            $retVal = me._createDropDownForValidValues(validValues);
            $retVal.attr("id", id);
            me.$colOfLastRow.append($label);
            me.$colOfLastRow.append($retVal);
            return $retVal;
        },
        _subscriptionData : null,
        _setSubscriptionOrSetDefaults : function() {
            var me = this;
            var subscriptionID = me._subscriptionID;

            $.when(me._initExtensionOptions(), me._initProcessingOptions()).done(function (data1, data2) {
                me._extensionSettings = data1;
                me._initRenderFormat(data1[0]);
                me._initSharedSchedule(data2[0]);
                me.$includeReport.prop('checked', true);
                me.$includeLink.prop('checked', true);
                if (subscriptionID) {
                    var subscriptionInfo = me.options.subscriptionModel.subscriptionModel("getSubscription", subscriptionID);

                    me.$desc.val(subscriptionInfo.Description);
                    me._subscriptionData = subscriptionInfo;

                    var extensionSettings = subscriptionInfo.ExtensionSettings;
                    for (var i = 0; i < extensionSettings.ParameterValues.length; i++) {
                        if (extensionSettings.ParameterValues[i].Name === "TO") {
                            me.$to.attr("value", extensionSettings.ParameterValues[i].Value);
                        }
                        if (extensionSettings.ParameterValues[i].Name === "Subject") {
                            me.$subject.attr("value", extensionSettings.ParameterValues[i].Value);
                        }
                        if (extensionSettings.ParameterValues[i].Name === "Comment") {
                            me.$comment.val(extensionSettings.ParameterValues[i].Value);
                        }
                        if (extensionSettings.ParameterValues[i].Name === "IncludeReport") {
                            if (extensionSettings.ParameterValues[i].Value === "True") {
                                me.$includeReport.prop('checked', true);
                            } else {
                                me.$includeReport.prop('checked', false);
                            }
                        }
                        if (extensionSettings.ParameterValues[i].Name === "IncludeLink") {
                            if (extensionSettings.ParameterValues[i].Value === "True") {
                                me.$includeLink.prop('checked', true);
                            } else {
                                me.$includeLink.prop('checked', false);
                            }
                        }
                        if (extensionSettings.ParameterValues[i].Name === "RenderFormat") {
                            me.$renderFormat.val(extensionSettings.ParameterValues[i].Value);
                        }
                    }
                    
                    me.$sharedSchedule.val(subscriptionInfo.SubscriptionSchedule.ScheduleID);
                } else {
                    if (me.options.userSettings) {
                        me.$to.attr("value", me.options.userSettings.email );
                        me.$desc.val(locData.subscription.description.format(me.options.userSettings.email));
                    }
                    me.$subject.val(locData.subscription.subject);
                }
            }); 
        },
        _getSubscriptionInfo: function() {
            var me = this;
            if (!me._subscriptionData) {
                me._subscriptionData = {}
                me._subscriptionData.SubscriptionID = null;
                me._subscriptionData.Report = me.options.reportPath;
                me._subscriptionData.SubscriptionSchedule = {}
                me._subscriptionData.SubscriptionSchedule.ScheduleID = me.$sharedSchedule.val();
                me._subscriptionData.SubscriptionSchedule.MatchData = me._sharedSchedule[me.$sharedSchedule.val()].MatchData;
                if (me._sharedSchedule[me.$sharedSchedule.val()].IsMobilizerSchedule)
                    me._subscriptionData.SubscriptionSchedule.IsMobilizerSchedule = true;
                me._subscriptionData.Description = me.$desc.val();
                me._subscriptionData.EventType = "TimedSubscription";
                me._subscriptionData.ExtensionSettings = {};
                me._subscriptionData.ExtensionSettings.Extension = "Report Server Email";
                me._subscriptionData.ExtensionSettings.ParameterValues = [];
                me._subscriptionData.ExtensionSettings.ParameterValues.push({ "Name": "TO", "Value": me.$to.val() });
                me._subscriptionData.ExtensionSettings.ParameterValues.push({ "Name": "Subject", "Value": me.$subject.val() });
                if (me.options.userSettings && me.options.userSettings.adminUI == true)
                    me._subscriptionData.ExtensionSettings.ParameterValues.push({ "Name": "Comment", "Value": me.$comment.val() });
                me._subscriptionData.ExtensionSettings.ParameterValues.push({ "Name": "IncludeLink", "Value": me.$includeLink.is(':checked') ? "True" : "False" });
                me._subscriptionData.ExtensionSettings.ParameterValues.push({ "Name": "IncludeReport", "Value": me.$includeReport.is(':checked') ? "True" : "False" });
                me._subscriptionData.ExtensionSettings.ParameterValues.push({ "Name": "RenderFormat", "Value":  me.$renderFormat.val() });
            } else {
                me._subscriptionData.Report = me.options.reportPath;
                me._subscriptionData.Description = me.$desc.val();
                me._subscriptionData.SubscriptionSchedule = {}
                me._subscriptionData.SubscriptionSchedule.ScheduleID = me.$sharedSchedule.val();
                me._subscriptionData.SubscriptionSchedule.MatchData = me._sharedSchedule[me.$sharedSchedule.val()].MatchData;
                if (me._sharedSchedule[me.$sharedSchedule.val()].IsMobilizerSchedule)
                    me._subscriptionData.SubscriptionSchedule.IsMobilizerSchedule = true;
                for (var i = 0; i < me._subscriptionData.ExtensionSettings.length; i++) {
                    if (me._subscriptionData.ExtensionSettings.ParameterValues[i].Name === "TO") {
                        me._subscriptionData.ExtensionSettings.ParameterValues[i].Value = me.$to.val();
                    }
                    if (me._subscriptionData.ExtensionSettings.ParameterValues[i].Name === "Subject") {
                        me._subscriptionData.ExtensionSettings.ParameterValues[i].Value = me.$subject.val();
                    }
                    //if (me._subscriptionData.ExtensionSettings.ParameterValues[i].Name === "Comment") {
                    //    me._subscriptionData.ExtensionSettings.ParameterValues[i].Value = me.$comment.val();
                    //}
                    if (me._subscriptionData.ExtensionSettings.ParameterValues[i].Name === "IncludeLink") {
                        me._subscriptionData.ExtensionSettings.ParameterValues[i].Value = me.$includeLink.is(':checked') ? "True" : "False";
                    }
                    if (me._subscriptionData.ExtensionSettings.ParameterValues[i].Name === "IncludeReport") {
                        me._subscriptionData.ExtensionSettings.ParameterValues[i].Value = me.$includeReport.is(':checked') ? "True" : "False";
                    }
                    if (me._subscriptionData.ExtensionSettings.ParameterValues[i].Name === "RenderFormat") {
                        me._subscriptionData.ExtensionSettings.ParameterValues[i].Value = me.$renderFormat.val();
                    }
                }
            }
            if (me.options.paramList) {
                me._subscriptionData.Parameters = [];
                var paramListObj = JSON.parse(me.options.paramList);
                for (var i = 0; i < paramListObj.ParamsList.length; i++) {
                    var param = paramListObj.ParamsList[i];
                    if (param.IsMultiple === "true") {
                        for (var j = 0; j < param.Value.length; j++) {
                            me._subscriptionData.Parameters.push({ "Name": param.Parameter, "Value": param.Value[j] });
                        }
                    } else {
                        me._subscriptionData.Parameters.push({"Name": param.Parameter, "Value": param.Value});
                    }
                }
            }
            return me._subscriptionData;
        },
        _initRenderFormat : function (data) {
            var me = this;
            for (var i = 0; i < data.length; i++) {
                var setting = data[i];
                if (setting.Name == "RenderFormat") {
                    me.$renderFormat = me._createDropDownWithLabel("Format:", setting.ValidValues);
                    me.$renderFormat.val(setting.Value);
                    me.$renderFormat.addClass(".fr-email-renderformat");
                }
            }
        },
        _initExtensionOptions: function () {
            var me = this;
            return me.options.subscriptionModel.subscriptionModel("getExtensionSettings", "Report Server Email");
        },
        _sharedSchedule: {},
        _initSharedSchedule:function(data) {
            var me = this;
            var validValues = [];
            for (var i = 0; i < data.length; i++) {
                validValues.push({ Value: data[i].ScheduleID, Label: data[i].Name });
                me._sharedSchedule[data[i].ScheduleID] = data[i];
            }
            data = forerunner.config.getMobilizerSharedSchedule();
            if (data) {
                for (var i = 0; i < data.length; i++) {
                    validValues.push({ Value: data[i].ScheduleID, Label: data[i].Name });
                    me._sharedSchedule[data[i].ScheduleID] = data[i];
                }
            }
            me.$sharedSchedule = me._createDropDownWithLabel("Schedule:", validValues);
            me.$sharedSchedule.addClass("fr-email-schedule");
        },
        _initProcessingOptions: function () {
            var me = this;
            return me.options.subscriptionModel.subscriptionModel("getSchedules");
        },
        _initSections : function () {
            var me = this;
            me._setSubscriptionOrSetDefaults();
        },
        _createInputWithPlaceHolder: function (listOfClasses, type, placeholder) {
            var me = this;
            $input = new $("<INPUT />");
            $input.attr("type", type);
            if (placeholder)
                $input.attr("placeholder", placeholder);
            for (var i = 0; i < listOfClasses.length; i++) {
                $input.addClass(listOfClasses[i]);
            }
            return $input;
        },
        _createTextAreaWithPlaceHolder: function (listOfClasses, placeholder) {
            var me = this;
            $input = new $("<TEXTAREA />");
            if (placeholder)
                $input.attr("placeholder", placeholder);
            for (var i = 0; i < listOfClasses.length; i++) {
                $input.addClass(listOfClasses[i]);
            }
            return $input;
        },
        _createTableRow: function ($div) {
            var me = this;
            $row = new $("<TR/>");
            $col = new $("<TD/>");
            $row.append($col)
            if ($div)
                $col.append($div);
            return $row;
        },
        _createCheckBox: function ($div, label) {
            var me = this;
            var $cb = new $("<INPUT />");
            var id = forerunner.helper.guidGen();
            $cb.attr("type", "checkbox");
            $cb.attr("id", id);
            var $label = new $("<LABEL />");
            $label.attr("for", id);
            $label.append(label);
            $div.append($cb);
            $div.append($label);
            return $cb;
        },
        _createToggleInput: function ($container, label) {
            var me = this;
            $div = forerunner.helper.createDiv(["fr-email-include"]);
            $cb = me._createCheckBox($div, label);
            $container.append($div);
            return $cb;
        },
        _init : function () {
        },
        _subscriptionID : null,
        loadSubscription: function (subscripitonID) {
            var me = this;
            me._subscriptionID = subscripitonID;
            me._subscriptionData = null;
            me.element.html("");
            me.element.off(events.modalDialogGenericSubmit);
            me.element.off(events.modalDialogGenericCancel);
            me.$outerContainer = me._createDiv(["fr-core-dialog-innerPage", "fr-core-center"]);
            var headerHtml = forerunner.dialog.getModalDialogHeaderHtml('fr-icons24x24-emailsubscription', locData.subscription.email, "fr-email-cancel", locData.subscription.cancel);

            me.$theForm = new $("<FORM />");
            me.$theForm.addClass("fr-email-form");
            me.$theForm.addClass("fr-core-dialog-form");
            me.$outerContainer.append(headerHtml);
            me.$outerContainer.append(me.$theForm);
            me.$theTable = new $("<TABLE />");
            me.$theTable.addClass("fr-email-table");
            me.$theForm.append(me.$theTable);
            me.$desc = me._createInputWithPlaceHolder(["fr-email-description"], "text", locData.subscription.description_placeholder);
            me.$theTable.append(me._createTableRow(me.$desc));
            me.$to = me._createInputWithPlaceHolder(["fr-email-to"], "text", locData.subscription.to_placeholder);
            me.$theTable.append(me._createTableRow(me.$to));
            me.$subject = me._createInputWithPlaceHolder(["fr-email-subject"], "text", locData.subscription.subject_placeholder)
            me.$theTable.append(me._createTableRow(me.$subject));
            me.$comment = me._createTextAreaWithPlaceHolder(["fr-email-comment"], "Comment", locData.subscription.comment_placeholder)
            me.$theTable.append(me._createTableRow(me.$comment));
            if (!me.options.userSettings || !me.options.userSettings.adminUI) {
                me.$desc.hide();
                me.$comment.hide();
            }
            me.$lastRow = me._createTableRow();
            me.$colOfLastRow = me.$lastRow.children(":first");
            me.$theTable.append(me.$lastRow);
            me.$includeLink = me._createToggleInput(me.$colOfLastRow, "[{0}]".format(locData.subscription.includeLink));
            me.$includeReport = me._createToggleInput(me.$colOfLastRow, "[{0}]".format(locData.subscription.includeReport));
            me.$submitButton = me._createInputWithPlaceHolder(["fr-email-submit-id",  "fr-core-dialog-submit", "fr-core-dialog-button"], locData.subscription.save, null)
            me.$submitButton.val(locData.subscription.save);
            me.$theForm.append(me.$submitButton)
            me._initSections();
            me.element.append(me.$outerContainer);

            me.element.find(".fr-email-submit-id").on("click", function (e) {
                me._submit();
            });

            me.element.find(".fr-email-cancel").on("click", function (e) {
                me.closeDialog();
            });

            me.element.on(events.modalDialogGenericSubmit, function () {
                me._submit();
            });

            me.element.on(events.modalDialogGenericCancel, function () {
                me.closeDialog();
            });
        },

        _submit : function () {
            var me = this;
            var subscriptionInfo = me._getSubscriptionInfo();
            if (me._subscriptionID) {
                me.options.subscriptionModel.subscriptionModel("updateSubscription", subscriptionInfo)
            } else {
                me.options.subscriptionModel.subscriptionModel("createSubscription", subscriptionInfo)
            }
            me.closeDialog();
        },
        
        openDialog: function () {
            var me = this;
            forerunner.dialog.showModalDialog(me.options.$appContainer, me);
        },
        
        closeDialog: function () {
            var me = this;
            forerunner.dialog.closeModalDialog(me.options.$appContainer, me);          
        },
        destroy: function () {
            var me = this;
            me.element.html("");
            this._destroy();
        }
    });  // $.widget(
});  // $(function ()
