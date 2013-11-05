// Assign or create the single globally scoped variable
var forerunner = forerunner || {};

// Forerunner SQL Server Reports objects
forerunner.ajax = forerunner.ajax || {};
forerunner.ssr = forerunner.ssr || {};
forerunner.ssr.models = forerunner.ssr.models || {};
forerunner.ssr.constants = forerunner.ssr.constants || {};
forerunner.ssr.constants.events = forerunner.ssr.constants.events || {};

$(function () {
    var ssr = forerunner.ssr;
    var models = forerunner.ssr.models;
    var events = ssr.constants.events;

    models.ParameterModel = function (options) {
        var me = this;
        me.options = {
            reportPath: null
        };

        // Merge options with the default settings
        if (options) {
            $.extend(me.options, options);
        }

        me.currentSetId = null;
        me.loc = forerunner.localize.getLocData(forerunner.config.forerunnerFolder() + "/ReportViewer/loc/ReportViewer");
    };

    models.ParameterModel.prototype = {
        _isLoaded: function () {
            var me = this;
            return me.parameterSets !== undefined;
        },
        _createDefaultSet: function (parameterList) {
            var me = this;
            var defaultSet = {
                isDefault: true,
                Name: me.loc.parameterModel.default,
                id: forerunner.helper.guidGen()
            }
            defaultSet.data = parameterList;
            return defaultSet;
        },
        _load: function () {
            var me = this;
            var url = forerunner.config.forerunnerAPIBase() + "ReportManager" + "/GetUserParameters?reportPath=" + me.options.reportPath;
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
                },
                error: function () {
                    console.log("models.ParameterModel._load() - error: " + data.status);
                }
            });
        },
        save: function (parameterList, success, error) {
            var me = this;
            if (parameterList) {
                var url = forerunner.config.forerunnerAPIBase() + "ReportManager" + "/SaveUserParameters";

                if (me.parameterSets == undefined || me.currentSetId === null) {
                    var defaultSet = me._createDefaultSet(JSON.parse(parameterList));
                    me.parameterSets = [defaultSet];
                    me.currentSetId = defaultSet.id;
                } else {
                    $.each(me.parameterSets, function (index, parameterSet) {
                        if (parameterSet.id == me.currentSetId) {
                            parameterSet.data = JSON.parse(parameterList);
                        }
                    });
                }

                forerunner.ajax.getJSON(
                    url,
                    {
                        reportPath: me.options.reportPath,
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
        getDefaultSet: function () {
            var me = this;
            var defaultSet = null;
            me._load();
            if (me.parameterSets) {
                $.each(me.parameterSets, function (index, parameterSet) {
                    if (parameterSet.isDefault) {
                        defaultSet = JSON.stringify(parameterSet.data);
                        me.currentSetId = parameterSet.id;
                    }
                });
            }
            return defaultSet;
        }
    }
});
