/**
 * @file Contains the parameter model widget.
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
    var locData = forerunner.localize;
    
    $.widget(widgets.getFullname(widgets.parameterModel), {
        options: {
            rsInstance: null,
            userName: null
        },
        _create: function () {
            var me = this;
            me.currentSetId = null;
            me.serverData = null;
            me.selectSetId = forerunner.helper.guidGen();
        },
        getNewSet: function (parameterList) {
            var newSet = {
                isAllUser: false,
                name: null,
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
        addSet:function(parameterList,name,isDefault,isAllUser){
            var me = this;
            var newSet = me.getNewSet(parameterList);
            newSet.name = name;
            if (isDefault ===true)
                me.serverData.defaultSetId = newSet.id;
            if (isAllUser === true)
                newSet.isAllUser = true;
            me.serverData.parameterSets[newSet.id] = newSet;
            me._saveModel();
        },
        removeSet: function(id){
            var me = this;

            delete me.serverData.parameterSets[id];
            if (me.serverData.defaultSetId === id)
                me.serverData.defaultSetId = null;
            me._saveModel();
        },
        _addNewSet: function (parameterList) {
            var me = this;
            var newSet = me.getNewSet(parameterList);
            newSet.name = locData.getLocData().parameterModel.defaultName;
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
        // getModel is used to get the model state used with the report viewer action history
        getModel: function () {
            var me = this;
            return {
                serverData: me.cloneServerData(),
                reportPath: me.reportPath,
                //remember prior select set id
                currentSetId: me.currentSetId
            };
        },
        // setModel restores the model state and triggers a Model change event
        setModel: function (modelData) {
            var me = this;
            me.serverData = modelData.serverData;
            me.reportPath = modelData.reportPath;
            //restore prior select set id
            me.currentSetId = modelData.currentSetId || null;

            me._triggerModelChange();
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
            if (lastAddedSetId && lastAddedSetId !== me.currentSetId) {
                me.currentSetId = lastAddedSetId;
            }

            var setCount = me.getSetCount(me.serverData);
            if (setCount === 0) {
                me.currentSetId = null;
                me.serverData.defaultSetId = null;
            }

            me._triggerModelChange();
        },
        getOptionArray: function (parameterSets) {
            var me = this;
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
            // Add the "<select set>" option
            optionArray.unshift({
                id: me.selectSetId,
                name: locData.getLocData().parameterModel.selectSet
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
        _triggerModelChange: function () {
            var me = this;
            me._trigger(events.modelChanged, null, me._modelChangeData());
        },
        _isLoaded: function (reportPath) {
            var me = this;
            return me.serverData !== null && me.reportPath === reportPath;
        },
        areSetsEmpty: function (serverData) {
            if (!serverData || !serverData.parameterSets) {
                return true;
            }

            for (var property in serverData.parameterSets) {
                return false;
            }

            return true;
        },
        getSetCount: function (serverData) {
            var count = 0;
            if (!serverData || !serverData.parameterSets) {
                return count;
            }

            for (var property in serverData.parameterSets) {
                count++;
            }

            return count;
        },
        _load: function (reportPath,done) {
            var me = this;

            var url = forerunner.config.forerunnerAPIBase() + "ReportManager" + "/GetUserParameters";
            if (me._isLoaded(reportPath)) {
                if (done) done();
                return;
            }


            forerunner.ajax.ajax({
                url: url,
                data: {
                    reportPath: reportPath,
                    instance: me.options.rsInstance,
                    userName: me.options.userName
                },
                dataType: "json",
                //async:false,
                success: function (data) {
                    if (data.ParamsList !== undefined) {
                        // Add support for build 436 schema.
                        var newSet = me._addNewSet((data.ParamsList instanceof Array) ? data : data.ParamsList);
                        newSet.name = locData.getLocData().parameterModel.defaultName;
                    }
                    else if (data) {
                        me.serverData = data;
                        if (!me.areSetsEmpty(me.serverData)) {
                            me.currentSetId = me.serverData.defaultSetId;
                        }
                        else {
                            // If the server returns back no sets then we need to clear out the current set id
                            me.currentSetId = null;
                        }
                    }
                    me.reportPath = reportPath;
                    me._triggerModelChange();
                    if (done) done();
                },
                error: function (data) {
                    console.log("ParameterModel._load() - error: " + data.status);
                    me.currentSetId = null;
                    me.serverData = null;
                    if (done) done();
                }
            });
        },
        _saveModel: function (success, error) {
            var me = this;
            var url = forerunner.config.forerunnerAPIBase() + "ReportManager" + "/SaveUserParameters";


            forerunner.ajax.post(
                url,
                {
                    reportPath: me.reportPath,
                    parameters: JSON.stringify(me.serverData),
                    Instance: me.options.rsInstance,
                    userName: me.options.userName
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
                    me._addNewSet(JSON.parse(parameterList));
                    me._triggerModelChange();
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
        getAllParameterSets: function (reportPath, done) {
            var me = this;

            me._load(reportPath, function () {
                done(me._modelChangeData());
            });
        },
        getCurrentParameterList: function (reportPath, isSkipSetDefault,done) {
            var me = this;
            var currentParameterList = null;
            me._load(reportPath, function () {

                //isSkipSetDefault: used for drill through scenario, don't need to set default set id.
                if (isSkipSetDefault === true) {
                    me.currentSetId = null;
                    me._triggerModelChange();                    
                }
                else if (me.serverData) {
                    var parameterSet = null;
                    if (me.currentSetId) {
                        parameterSet = me.serverData.parameterSets[me.currentSetId];
                    } else if (me.serverData.defaultSetId) {
                        me.currentSetId = me.serverData.defaultSetId;
                        parameterSet = me.serverData.parameterSets[me.serverData.defaultSetId];
                        me._triggerModelChange();
                    }
                    if (parameterSet && parameterSet.data) {
                        currentParameterList = JSON.stringify(parameterSet.data);
                    }
                }
                if (done) done(currentParameterList);
            });
            return currentParameterList;
        },
        getCurrentSet: function () {
            var me = this;
            if (me.serverData && me.currentSetId) {
                return me.serverData.parameterSets[me.currentSetId];
            }
            return null;
        }

    });  // $.widget(
    
});  // $(function ()
