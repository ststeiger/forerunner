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
                name: name,
                id: forerunner.helper.guidGen(),
                data: parameterList
            };
            return newSet;
        },
        isCurrentSetAllUser: function () {
            var me = this;
            if (me.serverData && me.serverData.parameterSets && me.currentSetId) {
                var set = me.serverData.parameterSets[me.currentSetId];
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
        _addNewSet: function (name, parameterList) {
            var me = this;
            var newSet = me.getNewSet(name, parameterList);
            if (me.serverData === undefined || me.serverData === null) {
                me.serverData = {
                    canEditAllUsersSet: false,
                    defaultSetId: newSet.id,
                    parameterSets: {}
                };
            }
            me.serverData.parameterSets[newSet.id] = newSet;
            me.serverData.defaultSetId = newSet.id;
            me.currentSetId = newSet.id;

            return newSet;
        },
        cloneServerData: function () {
            var me = this;
            if (me.serverData) {
                // Returns a deep clone of me.serverData
                return $.extend(true, {}, me.serverData);
            }

            return null;
        },
        applyServerData: function (applyData, lastAddedSetId) {
            var me = this;
            var id = null;

            // Save the default set id
            me.serverData.defaultSetId = applyData.defaultSetId;

            // First apply the modifications or additions
            for (id in applyData.parameterSets) {
                var modelSet = me.serverData.parameterSets[id];
                var applySet = applyData.parameterSets[id];
                if (modelSet) {
                    modelSet.isAllUser = applySet.isAllUser;
                    modelSet.name = applySet.name;
                } else {
                    me.serverData.parameterSets[id] = applySet;
                }
            }

            // Next handle any deletions
            var deleteArray = [];
            for (id in me.serverData.parameterSets) {
                if (!applyData.parameterSets.hasOwnProperty(id)) {
                    deleteArray.push(id);
                }
            }
            while (deleteArray.length > 0) {
                id = deleteArray.pop();
                delete me.serverData.parameterSets[id];
            }

            // save the results
            me._saveModel();


            // Set the current set and trigger the model changed event
            if (lastAddedSetId && lastAddedSetId != me.currentSetId) {
                me.currentSetId = lastAddedSetId;
            }
            me._triggerModelChange();
        },
        getOptionArray: function (parameterSets) {
            var optionArray = [];
            for (var id in parameterSets) {
                var set = parameterSets[id];
                optionArray.push({
                    id: set.id,
                    name: set.name
                });
            }
            optionArray.sort(function (a, b) {
                if (a.name > b.name) return 1;
                if (b.name > a.name) return -1;
                return 0;
            });
            return optionArray;
        },
        _modelChangeData: function () {
            var me = this;
            var data = {
                selectedId: me.currentSetId,
            };
            data.optionArray = me.getOptionArray(me.serverData.parameterSets);
            return data;
        },
        _triggerModelChange: function() {
            var me = this;
            me._trigger(events.modelChanged, null, me._modelChangeData());
        },
        _isLoaded: function (reportPath) {
            var me = this;
            return me.serverData !== null && me.reportPath === reportPath;
        },
        areSetsEmpty: function (serverData) {
            if (serverData.parameterSets === undefined || serverData.parameterSets === null) {
                return true;
            }

            for (var property in serverData.parameterSets) {
                return false;
            }

            return true;
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
                        // Add support for build 436 schema.
                        me._pushNewSet(locData.parameterModel.defaultName, (data.ParamsList instanceof Array) ? data : data.ParamsList);
                    }
                    else if (data) {
                        me.serverData = data;
                        if (me.areSetsEmpty(me.serverData)) {
                            me._addNewSet(locData.parameterModel.defaultName);
                        }
                        else {
                            me.currentSetId = me.serverData.defaultSetId;
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
                    me._addNewSet(locData.parameterModel.defaultName, JSON.parse(parameterList));
                } else {
                    me.serverData.parameterSets[me.currentSetId].data = JSON.parse(parameterList);
                }
                me._saveModel(success, error);
            }
        },
        setCurrentSet: function (id) {
            var me = this;
            if (id && me.serverData && me.serverData.parameterSets.hasOwnProperty(id)) {
                me.currentSetId = id;
                var parameterSet = me.serverData.parameterSets[id];
                if (parameterSet.data) {
                    me._trigger(events.modelSetChanged, null, JSON.stringify(parameterSet.data));
                }
                else {
                    me._trigger(events.modelSetChanged, null, null);
                }
            }
        },
        getCurrentParameterList: function (reportPath) {
            var me = this;
            var currentParameterList = null;
            me._load(reportPath);
            if (me.serverData) {
                var parameterSet;
                if (me.currentSetId) {
                    parameterSet = me.serverData.parameterSets[me.currentSetId];
                } else if (me.serverData.defaultSetId) {
                    me.currentSetId = me.serverData.defaultSetId;
                    parameterSet = me.serverData.parameterSets[me.serverData.defaultSetId];
                    me._triggerModelChange();
                } else {
                    return null;
                }
                if (parameterSet.data) {
                    currentParameterList = JSON.stringify(parameterSet.data);
                }
            }
            return currentParameterList;
        }
    });  // $.widget(
});  // $(function ()
