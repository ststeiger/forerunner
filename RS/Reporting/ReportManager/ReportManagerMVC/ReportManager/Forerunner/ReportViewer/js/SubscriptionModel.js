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

    $.widget(widgets.getFullname(widgets.subscriptionModel), {
        options: {
            rsInstance: null
        },
        subscriptionList: null,
        extensionList: null,
        extensionParameter: null,
        extensionSettings: {},
        schedules: null,
        _create: function () {
        },
        getSubscriptionList: function (reportPath) {
            var me = this;
            var url = forerunner.config.forerunnerAPIBase() + "ReportManager/ListSubscriptions?reportPath=" + reportPath + "&instance=" + me.options.rsInstance;
            var jqxhr = forerunner.ajax.ajax({
                url: url,
                dataType: "json",
                async: true
            })
            .done(function (data) {
                console.log("ListSubscriptions succeeded.");
            })
            .fail(function (data) {
                console.log("ListSubscriptions call failed.");
            });
            return jqxhr;
        },
        getSchedules: function () {
            var me = this;
            if (me.schedules) return [me.schedules];
            var url = forerunner.config.forerunnerAPIBase() + "ReportManager/ListSchedules?instance=" + me.options.rsInstance;
            var jqxhr = forerunner.ajax.ajax({
                url: url,
                dataType: "json",
                async: true
            })
            .done(
                function (data) {
                    me.schedules = data;
                })
            .fail(
                function () {
                    console.log("ListSchedules call failed.");
                });
            return me.schedules || jqxhr;
        },
        getDeliveryExtensions: function () {
            var me = this;
            if (me.extensionList) return [me.extensionList];
            var url = forerunner.config.forerunnerAPIBase() + "ReportManager/ListDeliveryExtensions?instance=" + me.options.rsInstance;
            return forerunner.ajax.ajax({
                url: url,
                dataType: "json",
                async: true
            })
            .done(
                function (data) {
                    me.extensionList = data; 
                })
            .fail(function () {
                console.log("ListDeliveryExtensions call failed.");
            });
        },
        _extensionSettingsCount: 0,
        _extensionSettingsJQXHR : {},
        getExtensionSettings: function (extensionName) {
            if (extensionName === "NULL") return;
            var me = this;
            var url = forerunner.config.forerunnerAPIBase() + "ReportManager/GetExtensionSettings?extension=" + extensionName + "&instance=" + me.options.rsInstance;
            return forerunner.ajax.ajax({
                    url: url,
                    dataType: "json",
                    async: true
                })
                .done(
                    function (settings) {
                        me.extensionSettings[extensionName] = settings;
                    })
                .fail(
                    function () {
                        console.log("GetExtensionSettings call failed.");
                    })
                .always(
                    function () {
                        me._extensionSettingsCount++;
                    });
        },
        getSubscription: function (subscriptionID) {
            var me = this;
            var url = forerunner.config.forerunnerAPIBase() + "ReportManager" + "/GetSubscription?subscriptionID=" + subscriptionID + "&instance=" + me.options.rsInstance;
            var retval;
            forerunner.ajax.ajax({
                url: url,
                dataType: "json",
                async: false,
                success: function (data) {
                    retval = data;
                },
                error: function (data) {
                    console.log("getSubscription failed: " + data.status);
                }
            });
            return retval;
        },
        createSubscription: function (subscriptionInfo, success, error) {
            return this._saveSubscription("CreateSubscription", subscriptionInfo, success, error);
        },
        updateSubscription: function (subscriptionInfo, success, error) {
            return this._saveSubscription("UpdateSubscription", subscriptionInfo, success, error);
        },
        deleteSubscription: function (subscriptionID, success, error) {
            var me = this;
            var url = forerunner.config.forerunnerAPIBase() + "ReportManager/DeleteSubscription?subscriptionID=" + subscriptionID + "&instance=" + me.options.rsInstance;
            forerunner.ajax.ajax({
                url: url,
                dataType: "json",
                async: false,
                success: function (data, textStatus, jqXHR) {
                    if (success && typeof (success) === "function") {
                        success(data);
                    }
                },
                error: function (data, textStatus, jqXHR) {
                    if (error && typeof (error) === "function") {
                        error();
                    }
                }
            });
        },
        _saveSubscription: function (verb, subscriptionInfo, success, error) {
            var me = this;
            var url = forerunner.config.forerunnerAPIBase() + "ReportManager/" + verb;
            subscriptionInfo.Instance = me.options.rsInstance;
            forerunner.ajax.post(
                url,
                subscriptionInfo,
                function (data, textStatus, jqXHR) {
                    var isException = true;
                    try {
                        var exception = JSON.parse(data);
                        if (exception.Exception) {
                            data = exception;
                        }
                    } catch(e) {
                        isException = false;
                    }
                    if (!isException && success && typeof (success) === "function") {
                        success(data);
                    }
                    if (isException && error && typeof (error) === "function") {
                        error(data);
                    }
                },
                function (data, textStatus, jqXHR) {
                    if (error && typeof (error) === "function") {
                        error(data);
                    }
                });
        },
    });  // $.widget(
});  // $(function ()
