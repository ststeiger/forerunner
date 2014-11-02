/**
 * @file Contains the email subscription widget.
 *
 */

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

    /**
     * Widget used to create email subscription
     *
     * @namespace $.forerunner.emailSubscription
     * @prop {Object} options - The options for emailSubscription
     * @prop {String} options.reportPath - Current report path
     * @prop {Object} options.$appContainer - Report page container
     * @prop {Object} options.subscriptionModel - Subscription model instance
     * @prop {String} options.paramList - Current report selected parameter list
     *
     * @example
     * $("#subscription").emailSubscription({
     *  reportPath : path
     *  $appContainer: $appContainer, 
     *  subscriptionModel : subscriptionModel,
     *  paramList: parameterList
     *  
     * });
    */
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
            var id = forerunner.helper.guidGen();
            var $label = new $("<LABEL />");
            $label.attr("for", id);
            $label.append(label);
            var $retVal = me._createDropDownForValidValues(validValues);
            $retVal.attr("id", id);
            return $retVal;
        },
        _subscriptionData: null,
        _canEditComment: false,
        _setSubscriptionOrSetDefaults : function() {
            var me = this;
            var subscriptionID = me._subscriptionID;

            $.when(me._initExtensionOptions()).done(function (data1) {
                me._extensionSettings = data1;
                me._initRenderFormat(data1);
                me.$includeReport.prop("checked", true);
                me.$includeLink.prop("checked", true);
                if (subscriptionID) {
                    var subscriptionInfo = me.options.subscriptionModel.subscriptionModel("getSubscription", subscriptionID);

                    me.$desc.val(subscriptionInfo.Description);
                    me._subscriptionData = subscriptionInfo;

                    var extensionSettings = subscriptionInfo.ExtensionSettings;
                    for (var i = 0; i < extensionSettings.ParameterValues.length; i++) {
                        if (extensionSettings.ParameterValues[i].Name === "TO") {
                            me.$to.val( extensionSettings.ParameterValues[i].Value);
                        }
                        if (extensionSettings.ParameterValues[i].Name === "Subject") {
                            me.$subject.val( extensionSettings.ParameterValues[i].Value);
                        }
                        if (extensionSettings.ParameterValues[i].Name === "Comment") {
                            me.$comment.val(extensionSettings.ParameterValues[i].Value);
                        }
                        if (extensionSettings.ParameterValues[i].Name === "IncludeReport") {
                            if (extensionSettings.ParameterValues[i].Value === "True") {
                                me.$includeReport.prop("checked", true);
                            } else {
                                me.$includeReport.prop("checked", false);
                            }
                        }
                        if (extensionSettings.ParameterValues[i].Name === "IncludeLink") {
                            if (extensionSettings.ParameterValues[i].Value === "True") {
                                me.$includeLink.prop("checked", true);
                            } else {
                                me.$includeLink.prop("checked", false);
                            }
                        }
                        if (extensionSettings.ParameterValues[i].Name === "RenderFormat") {
                            me.$renderFormat.val(extensionSettings.ParameterValues[i].Value);
                        }
                    }
                } else {
                    var userName = forerunner.ajax.getUserName();
                    me.$to.val( userName );
                    me.$desc.val(locData.subscription.description.format(userName));
                    me.$subject.val(locData.subscription.subject);
                }
            });

            $.when(me._initProcessingOptions()).done(function (data2) {
                me._initSharedSchedule(data2[0]);
                if (subscriptionID) {
                    var subscriptionInfo = me.options.subscriptionModel.subscriptionModel("getSubscription", subscriptionID);
                    me.$sharedSchedule.val(subscriptionInfo.SubscriptionSchedule.ScheduleID);
                }
            });
        },
        _getSubscriptionInfo: function() {
            var me = this;
            var i;
            if (!me._subscriptionData) {
                me._subscriptionData = {};
                me._subscriptionData.SubscriptionID = null;
                me._subscriptionData.Report = me.options.reportPath;
                me._subscriptionData.SubscriptionSchedule = {};
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
                if (me._canEditComment)
                    me._subscriptionData.ExtensionSettings.ParameterValues.push({ "Name": "Comment", "Value": me.$comment.val() });
                me._subscriptionData.ExtensionSettings.ParameterValues.push({ "Name": "IncludeLink", "Value": me.$includeLink.is(":checked") ? "True" : "False" });
                me._subscriptionData.ExtensionSettings.ParameterValues.push({ "Name": "IncludeReport", "Value": me.$includeReport.is(":checked") ? "True" : "False" });
                me._subscriptionData.ExtensionSettings.ParameterValues.push({ "Name": "RenderFormat", "Value":  me.$renderFormat.val() });
            } else {
                me._subscriptionData.Report = me.options.reportPath;
                me._subscriptionData.Description = me.$desc.val();
                me._subscriptionData.SubscriptionSchedule = {};
                me._subscriptionData.SubscriptionSchedule.ScheduleID = me.$sharedSchedule.val();
                me._subscriptionData.SubscriptionSchedule.MatchData = me._sharedSchedule[me.$sharedSchedule.val()].MatchData;
                if (me._sharedSchedule[me.$sharedSchedule.val()].IsMobilizerSchedule)
                    me._subscriptionData.SubscriptionSchedule.IsMobilizerSchedule = true;
                for (i = 0; i < me._subscriptionData.ExtensionSettings.ParameterValues.length; i++) {
                    if (me._subscriptionData.ExtensionSettings.ParameterValues[i].Name === "TO") {
                        me._subscriptionData.ExtensionSettings.ParameterValues[i].Value = me.$to.val();
                    }
                    if (me._subscriptionData.ExtensionSettings.ParameterValues[i].Name === "Subject") {
                        me._subscriptionData.ExtensionSettings.ParameterValues[i].Value = me.$subject.val();
                    }
                    if (me._canEditComment) {
                        me._subscriptionData.ExtensionSettings.ParameterValues[i].Value = me.$comment.val();
                    }
                    if (me._subscriptionData.ExtensionSettings.ParameterValues[i].Name === "IncludeLink") {
                        me._subscriptionData.ExtensionSettings.ParameterValues[i].Value = me.$includeLink.is(":checked") ? "True" : "False";
                    }
                    if (me._subscriptionData.ExtensionSettings.ParameterValues[i].Name === "IncludeReport") {
                        me._subscriptionData.ExtensionSettings.ParameterValues[i].Value = me.$includeReport.is(":checked") ? "True" : "False";
                    }
                    if (me._subscriptionData.ExtensionSettings.ParameterValues[i].Name === "RenderFormat") {
                        me._subscriptionData.ExtensionSettings.ParameterValues[i].Value = me.$renderFormat.val();
                    }
                }
            }
            if (me.options.paramList) {
                me._subscriptionData.Parameters = [];
                var paramListObj = JSON.parse(me.options.paramList);
                for (i = 0; i < paramListObj.ParamsList.length; i++) {
                    var param = paramListObj.ParamsList[i];
                    if (param.UseDefault && param.UseDefault.toLowerCase() === "true")
                        continue;
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
                if (setting.Name === "RenderFormat") {
                    me.$renderFormat = me._createDropDownForValidValues(setting.ValidValues);
                }
            }

            if (!me.$renderFormat) {
                for (var i = 0; i < data[0].length; i++) {
                    var setting = data[0][i];
                    if (setting.Name === "RenderFormat") {
                        me.$renderFormat = me._createDropDownForValidValues(setting.ValidValues);
                    }
                }
            }

            var value = forerunner.config.getCustomSettingsValue("DefaultSubscriptionFormat", "MHTML");
            me.$renderFormat.val(value);
            me.$renderFormat.addClass(".fr-email-renderformat");
            me.$theTable.append(me._createTableRow(locData.subscription.format, me.$renderFormat));
            
        },
        _initExtensionOptions: function () {
            var me = this;
            return me.options.subscriptionModel.subscriptionModel("getExtensionSettings", "Report Server Email");
        },
        _sharedSchedule: {},
        _initSharedSchedule:function(data) {
            var me = this;
            var validValues = [];
            var i;
            for (i = 0; i < data.length; i++) {
                validValues.push({ Value: data[i].ScheduleID, Label: data[i].Name });
                me._sharedSchedule[data[i].ScheduleID] = data[i];
            }
            data = forerunner.config.getMobilizerSharedSchedule();
            if (data) {
                for (i = 0; i < data.length; i++) {
                    validValues.push({ Value: data[i].ScheduleID, Label: data[i].Name });
                    me._sharedSchedule[data[i].ScheduleID] = data[i];
                }
            }
            me.$sharedSchedule = me._createDropDownForValidValues(validValues);
            me.$theTable.append(me._createTableRow(locData.subscription.schedule, me.$sharedSchedule));
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
            var $input = new $("<INPUT />");
            $input.attr("type", type);
            if (placeholder)
                $input.watermark(placeholder, { useNative: false, className: "fr-watermark" });
            for (var i = 0; i < listOfClasses.length; i++) {
                $input.addClass(listOfClasses[i]);
            }
            return $input;
        },
        _createTextAreaWithPlaceHolder: function (listOfClasses, placeholder) {
            var me = this;
            var $input = new $("<TEXTAREA />");
            if (placeholder)
                $input.watermark(placeholder, { useNative: false, className: "fr-watermark" });
            for (var i = 0; i < listOfClasses.length; i++) {
                $input.addClass(listOfClasses[i]);
            }
            return $input;
        },
        _createTableRow: function (label, $div2) {
            var me = this;
            var $row = new $("<TR/>");
            var $col1 = new $("<TD/>");
            $col1.addClass("fr-sub-left-col");
            var $col2 = new $("<TD/>");
            $col2.addClass("fr-sub-right-col");
            $row.append($col1);
            $row.append($col2);
            if (label)
                $col1.append(label);
            if ($div2)
                $col2.append($div2);
            return $row;
        },
        _createCheckBox: function ($div, label) {
            var me = this;
            var $cb = new $("<INPUT />");
            var id = forerunner.helper.guidGen();
            $cb.attr("type", "checkbox");
            $cb.attr("id", id);
            if ($div && label) {
                var $label = new $("<LABEL />");
                $label.attr("for", id);
                $label.append(label);
                $div.append($cb);
                $div.append($label);
            }
            return $cb;
        },
        _init : function () {
        },
        _subscriptionID: null,
        /**
         * Get current report's subscription data
         *
         * @function $.forerunner.emailSubscription#getSubscriptionList
         *
         * @return {Object} The xml http requeset for current report's subscription loading
         */
        getSubscriptionList : function() {
            var me = this;
            return me.options.subscriptionModel.subscriptionModel("getSubscriptionList", me.options.reportPath);
        },
        /**
         * Generate email subscription dialog
         *
         * @function $.forerunner.emailSubscription#loadSubscription
         *
         * @param {String} Subscription id, if not exist set it to null
         */
        loadSubscription: function (subscripitonID) {
            var me = this;
            me._subscriptionID = subscripitonID;
            me._subscriptionData = null;
            me.element.html("");
            me.element.off(events.modalDialogGenericSubmit);
            me.element.off(events.modalDialogGenericCancel);
            me.$outerContainer = me._createDiv(["fr-core-dialog-innerPage", "fr-core-center"]);
            var headerHtml = subscripitonID ? forerunner.dialog.getModalDialogHeaderHtml("fr-icons24x24-emailsubscription", locData.subscription.email, "fr-email-cancel", locData.subscription.cancel, "fr-core-dialog-button fr-email-create-id", locData.subscription.addNew) :
                forerunner.dialog.getModalDialogHeaderHtml("fr-icons24x24-emailsubscription", locData.subscription.email, "fr-email-cancel", locData.subscription.cancel);

            me.$theForm = new $("<FORM />");
            me.$theForm.addClass("fr-email-form");
            me.$theForm.addClass("fr-core-dialog-form");
            me.$outerContainer.append(headerHtml);
            me.$outerContainer.append(me.$theForm);

            me.$theTable = new $("<TABLE />");
            me.$theTable.addClass("fr-email-table");
            me.$theForm.append(me.$theTable);
            me.$desc = me._createInputWithPlaceHolder(["fr-email-description"], "text", locData.subscription.descriptionPlaceholder);
            me.$theTable.append(me._createTableRow(locData.subscription.descriptionPlaceholder, me.$desc));
            me.$to = me._createInputWithPlaceHolder(["fr-email-to"], "text", locData.subscription.toPlaceholder);
            me.$theTable.append(me._createTableRow(locData.subscription.toPlaceholder, me.$to));
            me.$subject = me._createInputWithPlaceHolder(["fr-email-subject"], "text", locData.subscription.subjectPlaceholder);
            me.$theTable.append(me._createTableRow(locData.subscription.subjectPlaceholder, me.$subject));
            me.$includeLink = me._createCheckBox();
            me.$includeLink.addClass("fr-email-include");
            me.$includeReport = me._createCheckBox();
            me.$includeReport.addClass("fr-email-include");
            me.$theTable.append(me._createTableRow(locData.subscription.includeLink, me.$includeLink));
            me.$theTable.append(me._createTableRow(locData.subscription.includeReport, me.$includeReport));
            me.$comment = me._createTextAreaWithPlaceHolder(["fr-email-comment"], "Comment", locData.subscription.commentPlaceholder);
            me.$theTable.append(me._createTableRow(locData.subscription.commentPlaceholder, me.$comment));
            me.$to.prop("required", true);
            me.$subject.prop("required", true);
            if (!me.options.userSettings || !me.options.userSettings.adminUI) {
                me.$to.prop("disabled", true);
                me.$subject.parent().parent().hide();
                me.$desc.parent().parent().hide();
                me.$comment.parent().parent().hide();
            }
            me._canEditComment = forerunner.ajax.hasPermission(me.options.reportPath, "Create Any Subscription").hasPermission === true;
            if (!me._canEditComment) {
                me.$comment.parent().parent().hide();
            }
            me.$lastRow = me._createTableRow();
            me.$colOfLastRow = me.$lastRow.children(":first");
            me.$theTable.append(me.$lastRow);

            me.$submitContainer = me._createDiv(["fr-email-submit-container"]);
            me.$submitButton = me._createInputWithPlaceHolder(["fr-email-submit-id", "fr-core-dialog-submit", "fr-core-dialog-button"], "button");
            me.$submitButton.val(locData.subscription.save);
            me.$submitContainer.append(me.$submitButton);
            
            
            if (subscripitonID) {
                me.$deleteButton = me._createInputWithPlaceHolder(["fr-email-delete-id", "fr-core-dialog-delete"], "button");
                me.$deleteButton.val(locData.subscription.deleteSubscription);
                me.$submitContainer.append(me.$deleteButton);
            }
            me.$theForm.append(me.$submitContainer);
            me._initSections();
            me.element.append(me.$outerContainer);

            //disable form auto submit when click enter on the keyboard
            me.$theForm.on("submit", function () { return false; });

            me.element.find(".fr-email-submit-id").on("click", function (e) {
                me._submit();
            });

            me.element.find(".fr-email-create-id").on("click", function (e) {
                me._createNew();
            });

            me.element.find(".fr-email-delete-id").on("click", function (e) {
                me._deleteMe();
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
            
            me.options.subscriptionModel.subscriptionModel(
                me._subscriptionID ? "updateSubscription" : "createSubscription",
                subscriptionInfo,
                function () { me.closeDialog(); },
                function (data) {
                    forerunner.dialog.showMessageBox(me.options.$appContainer, data.Exception.Message ? data.Exception.Message : locData.subscription.saveFailed);
                });
        },

        _createNew: function () {
            var me = this;
            me.loadSubscription(null);
        },

        _deleteMe: function () {
            var me = this;
            me.options.subscriptionModel.subscriptionModel(
               "deleteSubscription",
               me._subscriptionID,
               function () { me.closeDialog(); },
               function () { forerunner.dialog.showMessageBox(me.options.$appContainer, locData.subscription.deleteFailed); });
        },
        /**
         * Open email subscription dialog
         *
         * @function $.forerunner.emailSubscription#openDialog
         */
        openDialog: function () {
            var me = this;
            forerunner.dialog.showModalDialog(me.options.$appContainer, me);
        },
        /**
         * Close email subscription dialog
         *
         * @function $.forerunner.emailSubscription#closeDialog
         */
        closeDialog: function () {
            var me = this;
            forerunner.dialog.closeModalDialog(me.options.$appContainer, me);          
        },
        /**
         * Removes the email subscription functionality completely. This will return the element back to its pre-init state.
         *
         * @function $.forerunner.emailSubscription#destroy
         */
        destroy: function () {
            var me = this;
            me.element.html("");
            this._destroy();
        }
    });  // $.widget(
});  // $(function ()
