var forerunner = forerunner || {};

$(function () {
    var ssr = forerunner.ssr;
    var events = ssr.constants.events;

    // Define a parameter widget to hold the parameter data
    $.widget("SDKSamples.parameterModel", {
        options: {
        },
        // parameterModel is basically made up of these two members
        _create: function () {
            this.currentSetId = null;
            this.parameterSets = {};
        },
        _init: function () {
            var roadBikesId = forerunner.helper.guidGen();
            this.parameterSets[roadBikesId] = {
                id: roadBikesId,
                name: "Road Bikes",
                data: {
                    ParamsList: [{
                        "Parameter": "StartDate", "IsMultiple": "false", "Type": "DateTime", "Value": "01/01/2003"
                    }, {
                        "Parameter": "EndDate", "IsMultiple": "false", "Type": "DateTime", "Value": "12/31/2003"
                    }, {
                        "Parameter": "ProductSubcategory", "IsMultiple": "true", "Type": "Integer", "Value": ["2"]
                    }, {
                        "Parameter": "ProductCategory", "IsMultiple": "false", "Type": "Integer", "Value": "1"
                    }]
                }
            };
            var accessoriesId = forerunner.helper.guidGen();
            this.parameterSets[accessoriesId] = {
                id: accessoriesId,
                name: "Accessories",
                data: {
                    ParamsList: [{
                        "Parameter": "StartDate", "IsMultiple": "false", "Type": "DateTime", "Value": "01/01/2003"
                    }, {
                        "Parameter": "EndDate", "IsMultiple": "false", "Type": "DateTime", "Value": "12/31/2003"
                    }, {
                        "Parameter": "ProductSubcategory", "IsMultiple": "true", "Type": "Integer", "Value": [
                            "26", "27", "28", "29", "30", "31", "32", "33", "34", "35", "36", "37"
                        ]
                    }, {
                        "Parameter": "ProductCategory", "IsMultiple": "false", "Type": "Integer", "Value": "4"
                    }]
                }
            };

            // Set the current set to the all accessories set
            this.currentSetId = accessoriesId;
        },
        // Loads the data, sets the current set id and triggers the "changed" event
        load: function () {
            // In production code this method would read from a data source. In this sample
            // the data is hard coded so all we need to do here is to trigger the "changed"
            // event
            this._triggerModelChange();
        },
        // Gets the currently selected parameter set
        getCurrentParameterList: function() {
            return this.getParameterList(this.currentSetId);
        },
        // Gets the paramter list based upon the given id. This parameter list is in the form
        // needed by the reportViewer widget refreshParameters() function
        getParameterList: function (selectedId) {
            var currentParameterList = null;
            $.each(this.parameterSets, function (index, parameterSet) {
                if (parameterSet.id === selectedId) {
                    currentParameterList = JSON.stringify(parameterSet.data);
                }
            });
            return currentParameterList;
        },
        // Returns the option array which is used to fill in the <select> button
        _getOptionArray: function () {
            var optionArray = [];
            $.each(this.parameterSets, function (index, parameterSet) {
                optionArray.push({
                    name: parameterSet.name,
                    id: parameterSet.id,
                });
            });
            return optionArray;
        },
        // Triggers the "changed" event which causes the <select> button to load the
        // optionsArray
        _triggerModelChange: function () {
            var optionArray = this._getOptionArray();
            this._trigger("changed", null, { optionArray: optionArray, currentSetId: this.currentSetId });
        }

    });  // paremeterModel
});  // function()
