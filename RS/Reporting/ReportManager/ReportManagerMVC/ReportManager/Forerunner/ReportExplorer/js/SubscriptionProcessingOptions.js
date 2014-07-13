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

    $.widget(widgets.getFullname(widgets.subscriptionProcessingOptions), {
        options: {
            reportPath: null,
            $appContainer: null,
            subscriptionModel: null,
            subscriptionID: null,
            subDetails: null
        },
        _scheduleOptions: [{Value: "Shared", Label: "Use shared schedule"}, {Value: "Instance", Label: "Create your own"}],
        _selectScheduleString: "Choose whether to run the report on an hourly, daily, weekly, monthly, or one time basis.\nAll times are expressed in (GMT -08:00) Pacific Standard Time.\n",
        _selector: null,
        _scheduleDetails: null,
        _sharedSchedule: {},
        _initSharedSchedule: function () {
            var me = this;
            me._scheduleDetails.html("");
            var result = me.options.subscriptionModel.subscriptionModel("getSchedules");
            $.when(result).done(function (data) {
                var validValues = [];
                for (var i = 0; i < data.length; i++) {
                    validValues.push({ Value: data[i].ScheduleID, Label: data[i].Name });
                    me._sharedSchedule[data[i].ScheduleID] = data[i];
                }
                $dropdown = forerunner.helper.createDropDownForValidValues(validValues);
                me._scheduleDetails.append($dropdown);
            }).fail(
                function (data) {
                    forerunner.dialog.showMessageBox(me.options.$appContainer, me.locData.messages.ListSchedulesFailed);
                }
            );
        },
        _initScheduleEditor : function() {
            var me = this;
            me._scheduleDetails.html("");
        },
        _initScheduleSelector: function () {
            var me = this;
            var $details = forerunner.helper.createDiv(["fr-sub-schedule-details"]);
            me._scheduleDetails = $details;
            var callback = function () {
                if (this.value) {
                    if (this.value === "Shared") {
                        me._initSharedSchedule();
                    } else {
                        me._initScheduleEditor();
                    }
                }
            };
            var $selector = forerunner.helper.createRadioButtonsForValidValues(me._scheduleOptions, "ScheduleSelector", callback);
            me._selector = $selector;
            

            me.element.append($selector);
            me.element.append($details);

            $('input[type="radio"]', $selector).on('click change', function (e) {
                console.log(e.type);
            });
        },
        _create: function () {
            var me = this;
            me.element.html("");
            me._initScheduleSelector();

        },
    });  // $.widget(
});  // $(function ()
