/**
 * @file Contains the forerunnerProperties widget.
 *
 */

var forerunner = forerunner || {};

// Forerunner SQL Server Reports
forerunner.ssr = forerunner.ssr || {};
forerunner.cache = forerunner.cache || {};

$(function () {
    var widgets = forerunner.ssr.constants.widgets;
    var events = forerunner.ssr.constants.events;
    var propertyEnums = forerunner.ssr.constants.properties;
    var locData;
   

    /**
    * Widget used to manage property
    *
    * @namespace $.forerunner.forerunnerProperties
    * @prop {Object} options - The options for the property dialog
    * @prop {Object} options.$reportExplorer - Report viewer widget
    * @prop {Object} options.$reportViewer - Report viewer widget
    * @prop {Object} options.$appContainer - The container jQuery object that holds the application
    * @prop {String} options.rsInstance - Optional, Report service instance name
    *
    * @example
    * $("#property").forerunnerProperties({
    *     $appContainer: me.options.$appContainer,
    *     $reportExplorer: me.$explorer,
    *     $reportViewer: me.$viewer
    * });
    */
    $.widget(widgets.getFullname(widgets.forerunnerProperties), {
        options: {
            $appContainer: null,
            $reportViewer: null,
            $reportExplorer: null,
            rsInstance: null
        },
        _init: function () {
            var me = this;

            forerunner.localize.getLocData(forerunner.config.forerunnerFolder() + "ReportViewer/loc/ReportViewer", "json", function (loc) {
                locData = loc;
            
            me.guid = forerunner.helper.guidGen();

            me.element.html("");
            me.element.off(events.modalDialogGenericSubmit);
            me.element.off(events.modalDialogGenericCancel);

            var headerHtml = forerunner.dialog.getModalDialogHeaderHtml("fr-icons24x24-tags", locData.properties.title, "fr-properties-cancel", locData.common.cancel);

            var $container = new $(
               "<div class='fr-core-dialog-innerPage fr-core-center'>" +
                   headerHtml +
                   "<div class='fr-properties-container'>" +
                        "<ul class='fr-properties-tabs'></ul>" +
                   "</div>" +
                   "<div class='fr-core-dialog-submit-container fr-properties-submit-container'>" +
                       "<div class='fr-core-center'>" +
                           "<input type='button' class='fr-properties-submit fr-core-dialog-submit fr-core-dialog-button' value='" + locData.properties.submit + "' />" +
                       "</div>" +
                   "</div>" +
               "</div>");

            me.element.append($container);
            me.$tabs = me.element.find(".fr-properties-container");
            me.$tabsUL = me.$tabs.find(".fr-properties-tabs");

            me.element.find(".fr-properties-submit").on("click", function () {
                me._generalSubmit();
            });

            me.element.find(".fr-properties-cancel").on("click", function (e) {
                me.closeDialog();
            });

            me.element.on(events.modalDialogGenericSubmit, function () {
                me._generalSubmit();
            });

            me.element.on(events.modalDialogGenericCancel, function () {
                me.closeDialog();
            });
          });
        },
        _create: function () {
            
        },
        /**
        * Show the properties modal dialog.
        *
        * @function $.forerunner.forerunnerProperties#openDialog
        */
        openDialog: function () {
            var me = this;

            //used to flag where user make the change
            me.userUpdate = false;
            forerunner.dialog.showModalDialog(me.options.$appContainer, me);
        },
        /**
         * Close the properties modal dialog.
         *
         * @function $.forerunner.forerunnerProperties#closeDialog
         */
        closeDialog: function () {
            var me = this;

            me._trigger(events.close, null, { $forerunnerProperties: me.element, path: me.curPath, isUpdate: me.userUpdate });
            forerunner.dialog.closeModalDialog(me.options.$appContainer, me);
        },
        /**
         * Returns the current path and propertyList
         *
         * @function $.forerunner.forerunnerProperties#getProperties
         *
         * @return {Object} Property object that contain current path and properties
         */
        getProperties: function () {
            var me = this;
            return {
                view: me.view,
                path: me.curPath,
                propertyList: me._propertyList
            };
        },
        /**
         * Set the properties current item should have
         *
         * @function $.forerunner.forerunnerProperties#setProperties
         *
         * @param {String} path - the path of the item
         * @param {Array} propertyList - the list of the properties
         *
         * @see forerunner.ssr.constants.properties
         */
        setProperties: function (view, path, propertyList) {
            var me = this;

            me.view = view;
            me.property = forerunner.cache.itemProperty[path];

            me.$tabs.find("div").remove();
            me.$tabsUL.find("li").remove();
            me._preprocess = null;

            if (!path) {
                return;
            }

            me.curPath = path;
            me._propertyList = propertyList;

            //remove prior jquery.ui.tabs binding
            for (var key in me.$tabs.data()) {
                var widget = me.$tabs.data()[key];
                if (widget.widgetName) {
                    me.$tabs[widget.widgetName]("destroy");
                }
            }

            for (var i = 0; i < me._propertyList.length; i++) {
                switch (me._propertyList[i]) {
                    case propertyEnums.description:
                        me._createDescription();
                        me._addPreprocess(function () {
                            me._propertiesPreloading();
                        });
                        break;
                    case propertyEnums.rdlExtension:
                        me._createRDLExtension();
                        me._addPreprocess(function () {
                            me._RDLExtensionPreloading();
                        });
                        break;
                    case propertyEnums.tags:
                        me._createTags();
                        me._addPreprocess(function () {
                            me._tagsPreloading();
                        });
                        break;
                    case propertyEnums.searchFolder:
                        me._createSearchFolder();
                        me._addPreprocess(function () {
                            me._searchFolderPreloading();
                        });
                        break;
                }
            }

            me.element.find(".fr-properties-form").on("submit", function () {
                return false;
            });

            me.element.find(".fr-property-input").on("keyup", function (e) {
                if (e.keyCode === 13) {
                    e.stopImmediatePropagation();
                }
            });

            me.$tabs.tabs();

            if (typeof me._preprocess === "function") {
                me._preprocess.call(me);
                me._preprocess = null;
            }
        },
        _createDescription: function () {
            var me = this;
            var $li = new $("<li name='" + propertyEnums.description + "'><a href='#" + me.guid + "_" + "description" + "'>" + locData.properties.title + "</a></li>");

            var $descriptionDiv = new $(
                "<div id='" + me.guid + "_" + "description" + "' class='fr-property-container fr-description-container'>" +
                    "<form class='fr-properties-form fr-property-form'>" +
                        "<div class='fr-name-div'>" + 
                            "<label class='fr-name-label'>" + locData.common.name + "</label>" +
                            "<span class='fr-readonly-span'>"+ locData.properties.readonly + "</span>" + 
                            "<input type='text' class='fr-core-input fr-property-input fr-name-text fr-property-name' name='Name' required='true'>" +
                            "<span class='fr-error-span' />" +
                        "</div>" +
                        "<div>" +
                            "<label class='fr-description-label'>" + locData.properties.description + "</label>" +
                            "<textarea class='fr-core-input fr-property-input fr-description-id fr-description-text' rows='5' name='Description' />" +
                        "<div>" +
                        "<div class='fr-visibility-container'>" +
                            "<label class='fr-visibility-label'>"+
                                "<input type='checkbox' name='visibility' class='fr-property-visibility'>" + locData.visibility.label + 
                            "</label>" +
                        "</div>" +
                    "</form>" +
                "</div>");

            me.$desInput = $descriptionDiv.find(".fr-description-text");
            me.$isHidden = $descriptionDiv.find(".fr-property-visibility");
            me.$itemName = $descriptionDiv.find(".fr-name-text");
            me.$propertyForm = $descriptionDiv.find(".fr-property-form");

            if (me.view !== "contextmenu") {
                me.$itemName.addClass("fr-name-readonly").attr("disabled", true);
                $descriptionDiv.find(".fr-readonly-span").show();
            }

            me.$propertyForm.validate({
                errorPlacement: function (error, element) {
                    error.appendTo(element.siblings("span"));
                },
                highlight: function (element) {
                    $(element).addClass("fr-error");
                },
                unhighlight: function (element) {
                    $(element).removeClass("fr-error");
                }
            });

            me.$tabsUL.append($li);
            me.$tabs.append($descriptionDiv);
        },
        _createRDLExtension: function () {
            var me = this;
            var $li = new $("<li name='" + propertyEnums.rdlExtension + "'><a href='#" + me.guid + "_" + "RDL" + "'>" + locData.RDLExt.title + "</a></li>");

            var $rdlDiv = new $(
                "<div id='" + me.guid + "_" + "RDL" + "'  class='fr-property-container fr-rdl-container'>" +
                    "<label class='fr-rdl-label'>" + locData.RDLExt.dialogTitle + "</label>" +
                    "<textarea rows='5' class='fr-core-input fr-property-input fr-rdl-id fr-rdl-text' name='RDL' />" +
                "</div>");

            me.$rdlInput = $rdlDiv.find(".fr-rdl-text");

            me.$tabsUL.append($li);
            me.$tabs.append($rdlDiv);
        },
        _createTags: function () {
            var me = this;
            var $li = new $("<li name='" + propertyEnums.tags + "'><a href='#" + me.guid + "_" + "tags" + "'>" + locData.tags.tags + "</a></li>");

            var $tagsDiv = new $(
                "<div id='" + me.guid + "_" + "tags" + "'  class='fr-property-container fr-tag-container'>" +
                    "<div class='fr-tag-input-div'>" +
                        "<label class='fr-tag-label'>" + locData.tags.tags + "</label>" +
                        "<textarea class='fr-core-input fr-property-input fr-tag-text' rows='5' name='tags' />" +
                    "</div>" +
                    "<div class='fr-tag-prompt-div'>" +
                        "<label class='fr-tag-label-prompt'>" + locData.tags.prompt + "</label>" +
                    "</div>" +
                "</div>");

            me.$tagInput = $tagsDiv.find(".fr-tag-text");
            
            me.$tabsUL.append($li);
            me.$tabs.append($tagsDiv);
        },
        _createSearchFolder: function () {
            var me = this;
            var $li = new $("<li name='" + propertyEnums.searchFolder + "'><a href='#" + me.guid + "_" + "searchfolder" + "'>" + locData.searchFolder.title + "</a></li>");

            var $searchfolderDiv = new $(
                "<div id='" + me.guid + "_" + "searchfolder" + "' class='fr-property-container fr-sf-container'>" +
                   "<form class='fr-properties-form fr-sf-form'>" +
                        "<table class='fr-sf-table'>" +
                            //"<tr>" +
                                //"<td><label class='fr-sf-label'>" + locData.searchFolder.name + ":</label></td>" +
                                //disable the search folder name textbox, not allow user rename folder temporarily
                                //"<td>" +
                                //    "<input type='hidden' class='fr-core-input fr-sf-text fr-sf-foldername' name='foldername'/>" +
                                //    "<span class='fr-error-span' />" +
                                //"</td>" +
                            //"</tr>" +
                            "<tr>" +
                                "<td><label class='fr-sf-label'>" + locData.searchFolder.tags + ":</label></td>" +
                                "<td>" +
                                    "<input type='text' class='fr-core-input fr-property-input fr-sf-text fr-sf-foldertags' name='tags' required='true' />" +
                                    "<span class='fr-error-span' />" +
                                "</td>" +
                            "</tr>" +
                            "<tr class='fr-sf-prompt'>" +
                                "<td></td>" +
                                "<td><label class='fr-sf-label-prompt'>" + locData.searchFolder.prompt + "</label></td>" +
                            "<tr>" +
                        "</table>" +
                    "</form>" +
                "</div>");

            me.$sfForm = $searchfolderDiv.find(".fr-sf-form");

            me.$sfForm.validate({
                errorPlacement: function (error, element) {
                    error.appendTo(element.siblings("span"));
                },
                highlight: function (element) {
                    $(element).addClass("fr-error");
                },
                unhighlight: function (element) {
                    $(element).removeClass("fr-error");
                }
            });

            me.$tabsUL.append($li);
            me.$tabs.append($searchfolderDiv);
        },

        _generalSubmit: function () {
            var me = this;

            var tabName = me.$tabsUL.find(".ui-state-active").attr("name");
            var result = true;
            switch (tabName) {
                case propertyEnums.description:
                    result = me._setProperties();
                    break;
                case propertyEnums.rdlExtension:
                    me._setRDLExtension();
                    break;
                case propertyEnums.tags:
                    me._saveTags();
                    break;
                case propertyEnums.searchFolder:
                    result = me._setSearchFolder();
                    break;
            }

            if (result === true) {
                me.closeDialog();
            }
        },
        _preprocess: null,
        _addPreprocess: function (func) {
            if (typeof func !== "function") return;

            var me = this;
            var priorFunc = me._preprocess;

            if (priorFunc === null) {
                me._preprocess = func;
            }
            else {
                me._preprocess = function () {
                    priorFunc();
                    func();
                };
            }
        },

        _tagsPreloading: function () {
            var me = this;

            me._getTags(me.curPath);
        },
        _getTags: function (path) {
            var me = this;

            if (me.path !== path) {
                me._tags = "";
                me.path = null;

                forerunner.ajax.ajax({
                    type: "GET",
                    dataType: "JSON",
                    url: forerunner.config.forerunnerAPIBase() + "ReportManager/GetReportTags",
                    async: true,
                    data: {
                        path: path,
                        instance: me.options.rsInstance,
                    },
                    success: function (data) {
                        me.path = path;

                        if (data.Tags && data.Tags !== "NotFound") {
                            me._tags = data.Tags.join(",");
                            me._tags = me._tags.replace(/"/g, "");

                            me.$tagInput.val(me._tags);
                        }
                    },
                    fail: function (data) {
                    },
                });
            }
        },
        _saveTags: function () {
            var me = this;

            var tags = $.trim(me.$tagInput.val()),
                tagList;

            if (tags !== "" && tags !== me._tags) {
                tagList = tags.split(",");
                for (var i = 0; i < tagList.length; i++) {
                    tagList[i] = "\"" + $.trim(tagList[i]) + "\"";
                }
                tags = tagList.join(",");
                me._tags = tags;

                forerunner.ajax.ajax(
                {
                    type: "POST",
                    dataType: "text",
                    async: true,
                    url: forerunner.config.forerunnerAPIBase() + "ReportManager/SaveReportTags/",
                    data: {
                        reportTags: tags,
                        path: me.path,
                        instance: me.options.rsInstance,
                    },
                    success: function (data) {
                        //do something to notice submit success, since we have multiple tabs the dialog should not be closed after a single submit
                    },
                    fail: function (data) {
                        me._tags = null;
                        forerunner.dialog.showMessageBox(me.options.$appContainer, locData.messages.addTagsFailed, locData.toolPane.tags);
                    }
                });
            }
        },

        _propertiesPreloading: function () {
            var me = this;

            me._description = "";
            me._isHidden = "False";


            me._getProperties(me.curPath, function (data) {
                var me = this;

                //all items has the hidden property but not all has description
                //so if the return data is string type then it's hidden property
                if (typeof data === "string" && data.toLowerCase() === "true") {
                    me._isHidden = "True";
                    me.$isHidden.attr("checked", true);
                }

                if (typeof data === "object" && data.Hidden && data.Hidden.toLowerCase() === "true") {
                    me._isHidden = "True";
                    me.$isHidden.attr("checked", true);
                }

                if (typeof data === "object") {
                    me._description = data.Description || "";
                    me.$desInput.val(me._description);

                    me._itemName = data.Name;
                    me.$itemName.val(me._itemName);
                }
            }, me);
        },
        _setProperties: function () {
            var me = this;

            if (me.$propertyForm.valid() === false) {
                return false;
            }
            try {
                var descriptionInput = $.trim(me.$desInput.val()),
                    isHidden = me.$isHidden[0].checked ? "True" : "False",
                    itemName = $.trim(me.$itemName.val()),
                    path = me.curPath,
                    newPath = null;

                var properties = [];

                if(descriptionInput !== me._description) {
                    properties.push({
                        name: "Description",
                        value: descriptionInput
                    });
                }

                if (isHidden !== me._isHidden) {
                    properties.push({
                        name: "Hidden",
                        value: isHidden
                    });
                }

                if (itemName !== me._itemName) {
                    newPath = forerunner.helper.getParentPath(path) + "/" + itemName;
                    properties.push({
                        name: "Name",
                        value: newPath
                    });
                }
               
                if (properties.length) {
                    me.userUpdate = true;

                    forerunner.ajax.ajax({
                        type: "POST",
                        dataType: "text",                        
                        url: forerunner.config.forerunnerAPIBase() + "ReportManager/SaveReportProperty/",
                        data: {                            
                            path: me.curPath,
                            properties: JSON.stringify(properties),
                            instance: me.options.rsInstance,
                        },
                        success: function (data) {
                            data = JSON.parse(data);

                            if (data.Exception) {
                                me._description = "";
                                me._isHidden = "False";
                                me._itemName = "";
                                forerunner.dialog.showMessageBox(me.options.$appContainer, data.Exception.Message, locData.properties.title);
                                return;
                            }

                            if (newPath) {
                                me.curPath = newPath;
                                me.options.$appContainer.trigger(events.renameItem, { newPath: me.curPath });

                                delete forerunner.cache.itemProperty[path];
                            } else {
                                forerunner.cache.itemProperty[path].Hidden = isHidden;
                                forerunner.cache.itemProperty[path].Name = itemName;
                                forerunner.cache.itemProperty[path].Description = descriptionInput;
                            }
                            me.closeDialog();
                        },
                        fail: function (data) {
                            me._description = "";
                            me._isHidden = "False";
                            me._itemName = "";
                            forerunner.dialog.showMessageBox(me.options.$appContainer, locData.messages.addTagsFailed, locData.properties.title);
                        }
                    });
                }
            }
            catch (e) {
                forerunner.dialog.showMessageBox(me.options.$appContainer, e.message, "Error Saving");
                return false;
            }

            return true;
        },

        _RDLExtensionPreloading: function (RDLExtension) {
            var me = this;
            me._rdl = "";

            me._getProperties(me.curPath, function (data) {
                var me = this;

                if (typeof data === "object" && data.ForerunnerRDLExt) {
                    me._rdl = JSON.stringify( data.ForerunnerRDLExt);
                    me.$rdlInput.val(me._rdl);
                }
            }, me);
        },
        _setRDLExtension: function () {
            var me = this;
            var rdl = me.$rdlInput.val(),
                path = me.curPath;

            if (rdl !== me._rdl) {
                var properties = [{
                    name: "ForerunnerRDLExt",
                    value: rdl
                }];

                forerunner.ajax.ajax({
                    type: "POST",
                    dataType: "text",
                    async: true,
                    url: forerunner.config.forerunnerAPIBase() + "ReportManager/SaveReportProperty/",
                    data: {
                        path: me.curPath,
                        properties: JSON.stringify(properties),
                        instance: me.options.rsInstance,
                    },
                    success: function (data) {
                        me._rdl = rdl;

                        forerunner.cache.itemProperty[path].ForerunnerRDLExt = rdl;
                        me.property = forerunner.cache.itemProperty[path];

                        me.options.$appContainer.trigger(events.saveRDLDone, { newRDL: rdl });
                    },
                    fail: function (data) {
                        me._rdl = "";
                        //forerunner.dialog.showMessageBox(me.options.$appContainer, locData.messages.addTagsFailed, locData.toolPane.tags);
                    }
                });
            }
        },
        
        _searchFolder: null,
        _searchFolderPreloading: function () {
            var me = this;

            var content = me._getSearchFolder();

           
        },
        _getSearchFolder: function () {
            var me = this;

            var url = forerunner.config.forerunnerAPIBase() + "ReportManager/Resource";

            forerunner.ajax.ajax({
                url: url,                
                type: "GET",
                dataType: "text",
                data: {
                    path: me.curPath,
                    instance: me.options.rsInstance
                },
                success: function (data) {
                    me._searchFolder = data;
                    if (me._searchFolder) {
                        me._searchFolder = JSON.parse(me._searchFolder);//replace(/"/g, '')
                        me.$sfForm.find(".fr-sf-foldertags").val(me._searchFolder.tags.replace(/"/g, ""));
                    }
                    else {
                        me.$sfForm.find(".fr-sf-foldertags").val("");
                    }
                },
                error: function (data) { }
            });
            
            return me._searchFolder;
        },
        _setSearchFolder: function () {
            var me = this;

            if (me.$sfForm.valid()) {
                var name = $.trim(me._itemName);
                var tags = $.trim(me.$sfForm.find(".fr-sf-foldertags").val());
                var priorSearchFolder = JSON.parse(me._searchFolder);

                if (tags !== priorSearchFolder.tags) {
                    var tagsList = tags.split(",");

                    for (var i = 0; i < tagsList.length; i++) {
                        tagsList[i] = "\"" + $.trim(tagsList[i]) + "\"";
                    }

                    var searchfolder = {
                        searchFolderName: name,
                        overwrite: true,
                        content: { tags: tagsList.join(",") }
                    };

                    me.options.$reportExplorer.reportExplorer("setSearchFolder", searchfolder);
                }

                return true;
            }
            else {
                return false;
            }
        },

        _getProperties: function (path, callback, context) {
            var me = this;

            if (me.property) {
                if (typeof callback === "function") {
                    callback.call(context || me, me.property);
                }
                return;
            }

            //setup wait loop
            var loop = function () {
                if (me._locked)
                    setTimeout(loop, 5);
                else
                    callback.call(context || me, me.property);
            };

            if (me._locked) {
                loop();
            }
            else {

                me._locked = true;
                forerunner.ajax.ajax({
                    type: "GET",
                    dataType: "text",
                    url: forerunner.config.forerunnerAPIBase() + "ReportManager/ReportProperty",
                    data: {
                        path: path,
                        propertyName: "Hidden,Description,ForerunnerRDLExt,Name",
                        instance: me.options.rsInstance,
                    },
                    success: function (data) {

                        try {
                            me.property = forerunner.cache.itemProperty[path] = JSON.parse(data);
                        } catch (e) {
                            me.property = forerunner.cache.itemProperty[path] = data;
                        }
                        me._locked = false;

                        if (typeof callback === "function") {
                            callback.call(context || me, me.property);
                        }
                        return;
                    },
                    fail: function (data) {
                        me._locked = false;
                    },
                });
            }
        }
    });
});