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

    $.widget(widgets.getFullname(widgets.parameterModel), {
        options: {

        },
        _create: function () {
            var me = this;
            me.currentSetId = null;
            me.serverData = null;
        },
        getNewSet: function (name, parameterList) {
            var newSet = {
                isAllUser: false,
                isDefault: false,
                name: name,
                id: forerunner.helper.guidGen(),
                data: parameterList
            };
            return newSet;
        },
        isCurrentSetAllUser: function () {
            var me = this;
            if (me.serverData && me.serverData.parameterSets && me.currentSetId) {
                var set = me._getSet(me.serverData.parameterSets, me.currentSetId);
                return set.isAllUser;
            }
            return false;
        },
        canEditAllUsersSet: function () {
            var me = this;
            if (me.serverData) {
                return me.serverData.canEditAllUsersSet;
            }
            return false;
        },
        canUserSaveCurrentSet: function () {
            var me = this;
            if (me.serverData && me.serverData.canEditAllUsersSet) {
                return true;
            }

            return !me.isCurrentSetAllUser();
        },
        _pushNewSet: function (name, parameterList) {
            var me = this;
            var newSet = me.getNewSet(name, parameterList);
            if (me.serverData && me.serverData.parameterSets) {
                if (me.serverData.parameterSets.length === 0) {
                    newSet.isDefault = true;
                }
                me.serverData.parameterSets.push(newSet);
            }
            else {
                newSet.isDefault = true;
                me.serverData = {
                    canEditAllUsersSet: false,
                    parameterSets: [newSet]
                };
                me.currentSetId = newSet.id;
            }
            return newSet;
        },
        cloneServerData: function () {
            var me = this;
            if (me.serverData) {
                return {
                    canEditAllUsersSet: me.serverData.canEditAllUsersSet,
                    parameterSets: me._getOptionArray()
                };
            }

            return null;
        },
        applyServerData: function (applyData) {
            var me = this;

            // First apply the modifications or additions
            $.each(applyData.parameterSets, function (index, applySet) {
                var modelSet = me._getSet(me.serverData.parameterSets, applySet.id);
                if (modelSet) {
                    modelSet.isAllUser = applySet.isAllUser;
                    modelSet.isDefault = applySet.isDefault;
                    modelSet.name = applySet.name;
                    modelSet.id = applySet.id;
                }
                else {
                    me.serverData.parameterSets.push(applySet);
                }
            });
            // Next handle any deletions
            var deleteArray = [];
            $.each(me.serverData.parameterSets, function (index, modelSet) {
                var applySet = me._getSet(applyData.parameterSets, modelSet.id);
                if (applySet === null) {
                    deleteArray.push(index);
                }
            });
            while (deleteArray.length > 0) {
                var index = deleteArray.pop();
                me.serverData.parameterSets.splice(index, 1);
            }

            // save the results
            me._saveModel();
            me._triggerModelChange();
        },
        _getSet: function (sets, id) {
            var parameterSet = null;
            $.each(sets, function (index, set) {
                if (set.id === id) {
                    parameterSet = set;
                }
            });
            return parameterSet;
        },
        _getOptionArray: function () {
            var me = this;
            var optionArray = [];
            if (me.serverData.parameterSets) {
                $.each(me.serverData.parameterSets, function (index, parameterSet) {
                    optionArray.push({
                        isAllUser: parameterSet.isAllUser,
                        isDefault: parameterSet.isDefault,
                        name: parameterSet.name,
                        id: parameterSet.id,
                    });
                });
            }
            return optionArray;
        },
        _triggerModelChange: function() {
            var me = this;
            var optionArray = me._getOptionArray();
            me._trigger(events.modelChanged, null, { optionArray: optionArray, currentSetId: me.currentSetId });
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
                        me._pushNewSet(locData.parameterModel.defaultName, data.ParamsList);
                    }
                    else if (data) {
                        me.serverData = data;
                        if (me.serverData.parameterSets.length === 0) {
                            me._pushNewSet(locData.parameterModel.defaultName);
                        }
                    }
                    me.reportPath = reportPath;
                    me._triggerModelChange();
                },
                error: function (data) {
                    console.log("ParameterModel._load() - error: " + data.status);
                }
            });
        },
        _saveModel: function(success, error) {
            var me = this;
            var url = forerunner.config.forerunnerAPIBase() + "ReportManager" + "/SaveUserParameters";
            forerunner.ajax.post(
                url,
                {
                    reportPath: me.reportPath,
                    parameters: JSON.stringify(me.serverData),
                },
                function (data, textStatus, jqXHR) {
                    if (success && typeof (success) === "function") {
                        success(data);
                    }
                },
                function (data, textStatus, jqXHR) {
                    if (error && typeof (error) === "function") {
                        error();
                    }
                });
        },
        save: function (parameterList, success, error) {
            var me = this;
            if (parameterList) {
                if (me.serverData === null || me.currentSetId === null) {
                    me._pushNewSet(locData.parameterModel.defaultName, JSON.parse(parameterList));
                } else {
                    $.each(me.serverData.parameterSets, function (index, parameterSet) {
                        if (parameterSet.id === me.currentSetId) {
                            parameterSet.data = JSON.parse(parameterList);
                        }
                    });
                }
                me._saveModel(success, error);
            }
        },
        setCurrentSet: function (id) {
            var me = this;
            if (id && me.serverData && me.serverData.parameterSets) {
                $.each(me.serverData.parameterSets, function (index, parameterSet) {
                    if (parameterSet.id === id) {
                        me.currentSetId = id;
                        if (parameterSet.data) {
                            me._trigger(events.modelSetChanged, null, JSON.stringify(parameterSet.data));
                        }
                        else {
                            me._trigger(events.modelSetChanged, null, null);
                        }
                    }
                });
            }
        },
        getCurrentParameterList: function (reportPath) {
            var me = this;
            var currentParameterList = null;
            me._load(reportPath);
            if (me.serverData && me.serverData.parameterSets) {
                $.each(me.serverData.parameterSets, function (index, parameterSet) {
                    if (me.currentSetId !== null) {
                        if (parameterSet.id === me.currentSetId && parameterSet.data) {
                            currentParameterList = JSON.stringify(parameterSet.data);
                        }
                    }
                    else if (parameterSet.isDefault) {
                        me.currentSetId = parameterSet.id;
                        if (parameterSet.data) {
                            currentParameterList = JSON.stringify(parameterSet.data);
                        }
                    }
                });
            }
            me._triggerModelChange();
            return currentParameterList;
        }
    });  // $.widget(
});  // $(function ()
