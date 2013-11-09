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
    var locData = forerunner.localize.getLocData(forerunner.config.forerunnerFolder() + "/ReportViewer/loc/ReportViewer");

    ssr.ParameterModel = function (options) {
        var me = this;
        me.options = {
        };

        // Merge options with the default settings
        if (options) {
            $.extend(me.options, options);
        }

        // Add support for jQuery events
        var events = $({});
        $.extend(me, events);

        me.currentSetId = null;
        me.parameterSets = null;
    };

    ssr.ParameterModel.prototype = {
        _isLoaded: function () {
            var me = this;
            return me.parameterSets !== null;
        },
        _createDefaultSet: function (parameterList) {
            var me = this;
            var defaultSet = {
                isDefault: true,
                name: locData.parameterModel.defaultName,
                id: forerunner.helper.guidGen()
            };
            defaultSet.data = parameterList;
            return defaultSet;
        },
        _triggerModelChange: function() {
            var me = this;
            var optionArray = Array();
            $.each(me.parameterSets, function (index, parameterSet) {
                optionArray.push({
                    value: parameterSet.id,
                    text: parameterSet.name
                });
            });
            me.trigger("modelchanged", { optionArray: optionArray });
        },
        _load: function (reportPath) {
            var me = this;
            me.reportPath = reportPath;
            var url = forerunner.config.forerunnerAPIBase() + "ReportManager" + "/GetUserParameters?reportPath=" + reportPath;
            if (me._isLoaded()) {
                return;
            }

            forerunner.ajax.ajax({
                url: url,
                dataType: "json",
                async: false,
                success: function (data) {
                    if (data.ParamsList !== undefined) {
                        var defaultSet = me._createDefaultSet(data);
                        me.parameterSets = [defaultSet];
                        me.currentSetId = defaultSet.id;
                    }
                    else if (data) {
                        me.parameterSets = data;
                    }
                    me._triggerModelChange();
                },
                error: function (data) {
                    console.log("ParameterModel._load() - error: " + data.status);
                }
            });
        },
        save: function (parameterList, success, error) {
            var me = this;
            if (parameterList) {
                var url = forerunner.config.forerunnerAPIBase() + "ReportManager" + "/SaveUserParameters";

                if (me.parameterSets === null || me.currentSetId === null) {
                    var defaultSet = me._createDefaultSet(JSON.parse(parameterList));
                    me.parameterSets = [defaultSet];
                    me.currentSetId = defaultSet.id;
                } else {
                    $.each(me.parameterSets, function (index, parameterSet) {
                        if (parameterSet.id === me.currentSetId) {
                            parameterSet.data = JSON.parse(parameterList);
                        }
                    });
                }

                forerunner.ajax.getJSON(
                    url,
                    {
                        reportPath: me.reportPath,
                        parameters: JSON.stringify(me.parameterSets),
                    },
                    function (data) {
                        if (success && typeof (success) === "function") {
                            success(data);
                        }
                    },
                    function () {
                        if (error && typeof (error) === "function") {
                            error();
                        }
                    }
                );
            }
        },
        getCurrentSet: function (reportPath) {
            var me = this;
            var currentSet = null;
            me._load(reportPath);
            if (me.parameterSets) {
                $.each(me.parameterSets, function (index, parameterSet) {
                    if (me.currentSetId !== null) {
                        if (parameterSet.id === me.currentSetId) {
                            currentSet = JSON.stringify(parameterSet.data);
                        }
                    }
                    else if (parameterSet.isDefault) {
                        currentSet = JSON.stringify(parameterSet.data);
                        me.currentSetId = parameterSet.id;
                    }
                });
            }
            return currentSet;
        }
    };
});
