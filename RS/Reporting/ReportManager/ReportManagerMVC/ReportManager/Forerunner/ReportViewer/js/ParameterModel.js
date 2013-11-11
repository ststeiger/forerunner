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
        $.extend(me, $({}));

        me.currentSetId = null;
        me.serverData = null;
    };

    ssr.ParameterModel.prototype = {
        _createDefaultServerData: function (parameterList) {
            var me = this;
            var defaultSet = {
                isDefault: true,
                isAllUser: false,
                name: locData.parameterModel.defaultName,
                id: forerunner.helper.guidGen(),
                data: parameterList
            };
            me.serverData = {
                canEditAllUsersSet: false,
                parameterSets: [defaultSet]
            };
            me.currentSetId = defaultSet.id;
        },
        getServerData: function () {
            var me = this;
            return me.serverData;
        },
        setServerData: function (serverData) {
            var me = this;
            me.serverData = serverData;
            me._triggerModelChange;
        },
        _getOptionArray: function () {
            var me = this;
            var optionArray = Array();
            if (me.serverData.parameterSets) {
                $.each(me.serverData.parameterSets, function (index, parameterSet) {
                    optionArray.push({
                        value: parameterSet.id,
                        text: parameterSet.name,
                    });
                });
            }
            return optionArray;
        },
        _triggerModelChange: function() {
            var me = this;
            var optionArray = me._getOptionArray();
            me.trigger("modelchanged", { optionArray: optionArray });
        },
        _isLoaded: function (reportPath) {
            var me = this;
            return me.serverData !== null && me.reportPath === reportPath;
        },
        _load: function (reportPath) {
            var me = this;
            var url = forerunner.config.forerunnerAPIBase() + "ReportManager" + "/GetUserParameters?reportPath=" + reportPath;
            if (me._isLoaded(reportPath)) {
                return;
            }
            forerunner.ajax.ajax({
                url: url,
                dataType: "json",
                async: false,
                success: function (data) {
                    if (data.ParamsList !== undefined) {
                        me._createDefaultServerData(data.ParamsList);
                    }
                    else if (data) {
                        me.serverData = data;
                    }
                    me.reportPath = reportPath;
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

                if (me.serverData === null || me.currentSetId === null) {
                    me._createDefaultServerData(JSON.parse(parameterList));
                } else {
                    $.each(me.serverData.parameterSets, function (index, parameterSet) {
                        if (parameterSet.id === me.currentSetId) {
                            parameterSet.data = JSON.parse(parameterList);
                        }
                    });
                }

                forerunner.ajax.getJSON(
                    url,
                    {
                        reportPath: me.reportPath,
                        parameters: JSON.stringify(me.serverData),
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
        getCurrentParameterList: function (reportPath) {
            var me = this;
            var currentParameterList = null;
            me._load(reportPath);
            if (me.serverData && me.serverData.parameterSets) {
                $.each(me.serverData.parameterSets, function (index, parameterSet) {
                    if (me.currentSetId !== null) {
                        if (parameterSet.id === me.currentSetId) {
                            currentParameterList = JSON.stringify(parameterSet.data);
                        }
                    }
                    else if (parameterSet.isDefault) {
                        currentParameterList = JSON.stringify(parameterSet.data);
                        me.currentSetId = parameterSet.id;
                    }
                });
            }
            return currentParameterList;
        }
    };
});
