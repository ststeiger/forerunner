/**
 * @file Contains the forerunnerProperties widget.
 *
 */

var forerunner = forerunner || {};

// Forerunner SQL Server Reports
forerunner.ssr = forerunner.ssr || {};

$(function () {
    var widgets = forerunner.ssr.constants.widgets;
    var events = forerunner.ssr.constants.events;
    var propertyEnums = forerunner.ssr.constants.properties;
    var locData = forerunner.localize.getLocData(forerunner.config.forerunnerFolder() + "ReportViewer/loc/ReportViewer");

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
            rsInstance: null,
        },
        _init: function () {
            var me = this;

            me.guid = forerunner.helper.guidGen();

            me.element.html("");
            me.element.off(events.modalDialogGenericSubmit);
            me.element.off(events.modalDialogGenericCancel);

            var headerHtml = forerunner.dialog.getModalDialogHeaderHtml('fr-icons24x24-tags', locData.properties.title, "fr-properties-cancel", locData.properties.cancel);

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

            me.element.append($container);
        },
        _create: function () {
            
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
        setProperties: function (path, propertyList) {
            var me = this;

            me.$tabs.find("div").remove();
            me.$tabsUL.find("li").remove();
            me._preprocess = null;

            if (!path) {
                return;
            }

            me.curPath = path;
            me._propertyList = propertyList;

            //remove prior jquery.ui.tabs binding
            for (key in me.$tabs.data()) {
                var widget = me.$tabs.data()[key];
                if (widget.widgetName) {
                    me.$tabs[widget.widgetName]("destroy");
                }
            }

            for (var i = 0; i < me._propertyList.length; i++) {
                switch (me._propertyList[i]) {
                    case propertyEnums.description:
                        me._createDescription();
                        me._addPreprocess(me._descriptionPreloading());
                        break;
                    case propertyEnums.rdlExtension:
                        me._createRDLExtension();
                        break;
                    case propertyEnums.tags:
                        me._createTags();
                        me._addPreprocess(me._tagsPreloading);
                        break;
                    case propertyEnums.searchFolder:
                        me._createSearchFolder();
                        me._addPreprocess(me._searchFolderPreloading);
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
                me._preprocess();
                me._preprocess = null;
            }
        },
        _createDescription: function () {
            var me = this;
            var $li = new $("<li name='" + propertyEnums.description + "'><a href='#" + me.guid + "_" + "description" + "'>" + locData.properties.description + "</a></li>");

            var $descriptionDiv = new $(
                "<div id='" + me.guid + "_" + "description" + "' class='fr-property-container fr-description-container'>" +
                    "<label class='fr-description-label'>" + locData.properties.description + "</label>" +
                    "<textarea class='fr-core-input fr-property-input fr-description-id fr-description-text' rows='5' name='Description' />" +
                "</div>");

            me.$desInput = $descriptionDiv.find(".fr-description-text");

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
            
            me.options.$reportViewer.on(events.reportViewerAfterLoadReport(), function (event, data) {
                if (data.RDLExtProperty) {
                    me._RDLExtensionPreloading(data.RDLExtProperty);
                }
            });

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
                    "<div>" +
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
                            "<tr>" +
                                "<td><label class='fr-sf-label'>" + locData.searchFolder.name + ":</label></td>" +
                                //disable the search folder name textbox, not allow user rename folder temporarily
                                "<td>" +
                                    "<input type='text' class='fr-core-input fr-sf-text fr-sf-foldername' name='foldername' required='true' disabled='true' />" +
                                    "<span class='fr-sf-error-span' />" +
                                "</td>" +
                            "</tr>" +
                            "<tr>" +
                                "<td><label class='fr-sf-label'>" + locData.searchFolder.tags + ":</label></td>" +
                                "<td>" +
                                    "<input type='text' class='fr-core-input fr-property-input fr-sf-text fr-sf-foldertags' name='tags' required='true' />" +
                                    "<span class='fr-sf-error-span' />" +
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
                    $(element).addClass("fr-sf-error");
                },
                unhighlight: function (element) {
                    $(element).removeClass("fr-sf-error");
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
                    me._setDescription();
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
        /**
         * Show the properties modal dialog.
         *
         * @function $.forerunner.forerunnerProperties#openDialog
         */
        openDialog: function () {
            var me = this;
           // me._beforeOpenDialog();
            
            forerunner.dialog.showModalDialog(me.options.$appContainer, me);
        },
        /**
         * Close the properties modal dialog.
         *
         * @function $.forerunner.forerunnerProperties#closeDialog
         */
        closeDialog: function () {
            var me = this;
            me._trigger(events.close, null, { $forerunnerProperties: me.element, path: me.curPath });
            forerunner.dialog.closeModalDialog(me.options.$appContainer, me);
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
                }
            }
        },

        _tags: null,
        _tagsPreloading: function () {
            var me = this;
            var tags = me._getTags(me.curPath);
            me.$tagInput.val(tags);
        },
        _getTags: function (path) {
            var me = this;

            if (me.path !== path) {
                me._tags = null;
                me.path = null;

                forerunner.ajax.ajax({
                    type: "GET",
                    dataType: "JSON",
                    url: forerunner.config.forerunnerAPIBase() + "ReportManager/GetReportTags",
                    async: false,
                    data: {
                        path: path,
                        instance: me.options.rsInstance,
                    },
                    success: function (data) {
                        me.path = path;

                        if (data.Tags && data.Tags !== "NotFound") {
                            me._tags = data.Tags.join(",");
                        }
                    },
                    fail: function (data) {
                    },
                });
            }

            if (me._tags) {
                me._tags = me._tags.replace(/"/g, '');
            }

            return me._tags;
        },
        _saveTags: function () {
            var me = this;

            var tags = $.trim(me.$tagInput.val()),
                tagList;

            if (tags !== "" && tags !== me._tags) {
                tagList = tags.split(",");
                for (var i = 0; i < tagList.length; i++) {
                    tagList[i] = '"' + $.trim(tagList[i]) + '"';
                }
                tags = tagList.join(",");
                me._tags = tags;

                forerunner.ajax.ajax(
                {
                    type: "POST",
                    dataType: "text",
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
                    },
                    async: false
                });
            }
        },

        _description: null,
        _descriptionPreloading: function () {
            var me = this;

            var des = me._getDescription(me.curPath, "Description");
            if (des) {
                me.$desInput.val(des);
            }
        },
        _setDescription: function () {
            var me = this;
            try {
                var descriptionInput = $.trim(me.$desInput.val());

                if (descriptionInput !== me._description) {
                    var description = forerunner.helper.htmlEncode(descriptionInput);

                    forerunner.ajax.ajax({
                        type: "POST",
                        dataType: "text",
                        url: forerunner.config.forerunnerAPIBase() + "ReportManager/SaveReportProperty/",
                        data: {
                            value: description,
                            path: me.curPath,
                            propertyName: "Description",
                            instance: me.options.rsInstance,
                        },
                        success: function (data) {
                            //return true;
                        },
                        fail: function (data) {
                            me._description = null;
                            forerunner.dialog.showMessageBox(me.options.$appContainer, locData.messages.addTagsFailed, locData.toolPane.tags);
                        },
                        async: false
                    });
                }
            }
            catch (e) {
                forerunner.dialog.showMessageBox(me.options.$appContainer, e.message, "Error Saving");
                return false;
            }
        },
        _getDescription: function (path) {
            var me = this;
            me._description = null;

            forerunner.ajax.ajax({
                type: "GET",
                dataType: "text",
                url: forerunner.config.forerunnerAPIBase() + "ReportManager/ReportProperty",
                async: false,
                data: {
                    path: path,
                    propertyName: "Description",
                    instance: me.options.rsInstance,
                },
                success: function (data) {
                    if (data && data !== "{}") {
                        me._description = forerunner.helper.htmlDecode(data);
                    }
                },
                fail: function (data) {
                    
                },
            });

            return me._description;
        },

        _RDLExtensionPreloading: function (RDLExtension) {
            var me = this;

            var RDL = JSON.stringify(RDLExtension);
            me.$rdlInput.val(RDL);
        },
        _setRDLExtension: function () {
            var me = this;

            var rdl = me.$rdlInput.val();
            me.options.$reportViewer.find(".fr-layout-reportviewer").reportViewer("saveRDLExt", rdl);
        },

        _searchFolder: null,
        _searchFolderPreloading: function () {
            var me = this;

            var content = me._getSearchFolder();

            if (content) {
                content = JSON.parse(content);//replace(/"/g, '')
                me.$sfForm.find(".fr-sf-foldername").val(content.name)
                me.$sfForm.find(".fr-sf-foldertags").val(content.tags.replace(/"/g, ''));
            }
            else {
                me.$sfForm.find(".fr-sf-foldername").val("")
                me.$sfForm.find(".fr-sf-foldertags").val("");
            }
        },
        _getSearchFolder: function () {
            var me = this;

            var url = forerunner.config.forerunnerAPIBase() + "ReportManager/Resource";

            forerunner.ajax.ajax({
                url: url,
                async: false,
                type: "GET",
                dataType: "text",
                data: {
                    path: me.curPath,
                    instance: me.options.rsInstance
                },
                success: function (data) {
                    me._searchFolder = data;
                },
                error: function (data) { }
            });
            
            return me._searchFolder;
        },
        _setSearchFolder: function () {
            var me = this;

            if (me.$sfForm.valid()) {
                var name = $.trim(me.$sfForm.find(".fr-sf-foldername").val());
                var tags = $.trim(me.$sfForm.find(".fr-sf-foldertags").val());
                var priorSearchFolder = JSON.parse(me._searchFolder);

                if (name !== priorSearchFolder.name || tags !== priorSearchFolder.tags) {
                    var tagsList = tags.split(",");

                    for (var i = 0; i < tagsList.length; i++) {
                        tagsList[i] = '"' + $.trim(tagsList[i]) + '"';
                    }

                    var searchfolder = {
                        searchFolderName: name,
                        overwrite: true,
                        content: { name: name, tags: tagsList.join(",") }
                    };

                    me.options.$reportExplorer.reportExplorer("setSearchFolder", searchfolder);
                }

                return true;
            }
            else {
                return false;
            }
        }
    });
});