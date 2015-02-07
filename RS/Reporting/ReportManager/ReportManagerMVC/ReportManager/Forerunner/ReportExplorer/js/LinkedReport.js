/**
 * @file Contains the forerunnerLinkedReport widget.
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
    * Widget used to manage item linked report
    *
    * @namespace $.forerunner.forerunnerLinkedReport
    * @prop {Object} options - The options for the linked report dialog
    * @prop {Object} options.$reportExplorer - Report viewer widget
    * @prop {Object} options.$appContainer - The container jQuery object that holds the application
    * @prop {String} options.rsInstance - Optional, Report service instance name
    *
    * @example
    * $("#property").forerunnerLinkedReport({
    *     $appContainer: me.options.$appContainer,
    *     $reportExplorer: me.$explorer
    * });
    */
    $.widget(widgets.getFullname(widgets.forerunnerLinkedReport), {
        options: {
            $appContainer: null,
            $reportExplorer: null,
            reportManagerAPI: null,
            rsInstance: null
        },
        rootPath: "/",

        _create: function () {
            var me = this;
            console.log('linked report widget is created.');
            var linked = locData.linkedReport,
                common = locData.common;

            me.guid = forerunner.helper.guidGen();
            me.curPath = null;

            me.element.children().remove();
            me.element.off(events.modalDialogGenericSubmit);
            me.element.off(events.modalDialogGenericCancel);

            var headerHtml = forerunner.dialog.getModalDialogHeaderHtml('fr-icons24x24-tags', linked.title, "fr-linked-cancel", common.cancel);

            var $container = new $(
               "<div class='fr-core-dialog-innerPage fr-core-center'>" +
                    headerHtml +
                    "<form class='fr-linked-form fr-core-dialog-form'>" +
                        "<div class='fr-linked-container'>" +
                            "<div class='fr-linked-prompt'></div>" +
                             // Dropdown container
                            "<div class='fr-linked-input-container fr-linked-dropdown-container'>" +
                                "<label class='fr-linked-label' >" + linked.location + "</label>" +
	                            "<input type='text' name='location' class='fr-core-input fr-linked-input fr-linked-location fr-core-cursorpointer' readonly='true' required='true' allowblank='false' nullable='false'/>" +
	                            "<div class='fr-linked-dropdown-iconcontainer fr-core-cursorpointer'>" +
		                            "<div class='fr-linked-dropdown-icon'></div>" +
	                            "</div>" +
                                // Popup container
                                "<div class='fr-linked-popup-container fr-core-hidden'>" +
	                                "<div class='fr-linked-tree-container'></div>" +
                                "</div>" +
                                "<span class='fr-linked-error-span'/>" +
                            "</div>" +
                            "<div class='fr-linked-input-container'>" +
                                "<label class='fr-linked-label'>" + common.name + "</label>" +
                                "<input type='text' name='linkedname' class='fr-core-input fr-linked-input fr-linked-name' autocomplete='off' required='true' />" +
                                "<span class='fr-linked-error-span' />" +
                            "</div>" +
                            //"<div class='fr-linked-input-container'>" +
                            //    "<div class='fr-linked-desp-label' >" + common.description + "</div>" +
                            //    "<textarea type='text' rows='3' class='fr-core-input fr-linked-textarea fr-linked-desp'></textarea>" +
                            //"</div>" +
                        "</div>" +
                        "<div class='fr-core-dialog-submit-container fr-linked-submit-container'>" +
                            "<div class='fr-core-center'>" +
                                "<input type='button' class='fr-linked-submit fr-core-dialog-button' value='" + common.submit + "' />" +
                                "<input type='button' class='fr-linked-cancel fr-core-dialog-button' value='" + common.cancel + "' />" +
                            "</div>" +
                        "</div>" +
                    "</form>" +
                "</div>");

            me.element.append($container);

            //add form validation
            me.$prompt = me.element.find(".fr-linked-prompt");
            me.$form = me.element.find(".fr-linked-form");
            me.$popup = me.element.find(".fr-linked-popup-container");
            me.$tree = me.element.find(".fr-linked-tree-container");

            me.$tree.on("changed.jstree", function (e, data) {
                me._onChangedjsTree.apply(me, arguments);
            });

            me.$name = me.element.find(".fr-linked-name");
            //me.$description = me.element.find(".fr-linked-desp");
            me.$location = me.element.find(".fr-linked-location");
            me.$dpIcon = me.element.find(".fr-linked-dropdown-icon");

            me._bindEvents();

            me.element.append($container);
        },
        _init: function () {
            var me = this;

            me._reset();

            var treeData = me._createJSData(me.rootPath);
            me.$tree.jstree({
                core: {
                    data: treeData
                }
            });
        },
        _bindEvents: function () {
            var me = this;

            me._resetValidateMessage();
            me._validateForm(me.$form);

            me.$location.on('click', function () {
                me._openPopup.call(me)
            });

            me.$dpIcon.on("click", function () {
                me._openPopup.call(me)
            });

            me.element.find(".fr-linked-submit").on("click", function () {
                me._submit();
            });

            me.element.find(".fr-linked-cancel").on("click", function () {
                me.closeDialog();
            });

            me.element.on(events.modalDialogGenericSubmit, function () {
                me._submit();
            });

            me.element.on(events.modalDialogGenericCancel, function () {
                me.closeDialog();
            });
        },
        _openPopup: function () {
            var me = this;

            //handle border width
            var width = me.$location.width() + 4;
            me.$popup.css({ width: width });
            me.$popup.toggleClass("fr-core-hidden");
        },
        _createJSData: function (path) {
            var me = this;
            var nodeTree = {
                text: path,
                state: {
                    opened: true
                },
                children: []
            };

            me._createTreeItems(nodeTree, "catalog", path);
            return [nodeTree];
        },
        _createTreeItems: function (curNode, view, path) {
            var me = this;
            var items = me._getItems(view, path);

            $.each(items, function (index, item) {
                var newNode = {
                    text: item.Name,
                    li_attr: {
                        dataCatalogItem: item
                    },
                    children: []
                };
                
                //only add fole to the tree
                if (item.Type === forerunner.ssr.constants.itemType.folder) {
                    curNode.children.push(newNode);
                    me._createTreeItems(newNode, view, item.Path);
                }
            });
        },
        _getItems: function (view, path) {
            var me = this;
            var items = null;

            forerunner.ajax.ajax({
                dataType: "json",
                url: me.options.reportManagerAPI + "/GetItems",
                async: false,
                data: {
                    view: view,
                    path: path
                },
                success: function (data) {
                    items = data;
                },
                error: function (data) {
                    console.log(data);
                }
            });

            return items;
        },
        _onChangedjsTree: function (e, data) {
            var me = this;
            var location = data.node.text === me.rootPath ? me.rootPath : data.node.li_attr.dataCatalogItem.Path;

            me.$location.val(location).valid();
            me.$popup.addClass("fr-core-hidden");
        },
        _validateForm: function ($form) {
            $form.validate({
                errorPlacement: function (error, element) {
                    error.appendTo($(element).siblings(".fr-linked-error-span"));
                },
                highlight: function (element) {
                    $(element).addClass("fr-linked-error");
                },
                unhighlight: function (element) {
                    $(element).removeClass("fr-linked-error");
                }
            });
        },
        setData: function (type, curPath){
            var me = this;

            me.reportType = type;
            me.curPath = curPath;

            me._reset();

            var prompt = locData.linkedReport.prompt.format(me.curPath);
            me.$prompt.text(prompt);

            if (me.reportType == forerunner.ssr.constants.itemType.linkedReport) {
                //Todo.. not expose this function now.
            }
        },
        /**
         * Show the linked report modal dialog.
         *
         * @function $.forerunner.forerunnerProperties#openDialog
         */
        openDialog: function (curPath) {
            var me = this;
            //current path which is the link report path
            me.curPath = curPath;

            forerunner.dialog.showModalDialog(me.options.$appContainer, me);
        },
        /**
         * Close the linked report modal dialog.
         *
         * @function $.forerunner.forerunnerProperties#closeDialog
         */
        closeDialog: function () {
            var me = this;
            me._trigger(events.close, null, { $forerunnerLinkedReport: me.element, path: me.curPath });
            forerunner.dialog.closeModalDialog(me.options.$appContainer, me);
        },
        _submit: function () {
            var me = this,
                fileLocation,
                linkedName;

            if (me.$form.valid()) {
                linkedName = $.trim(me.$name.val());
                fileLocation = $.trim(me.$location.val());

                forerunner.ajax.ajax({
                    type: "POST",
                    dataType: "JSON",
                    url: forerunner.config.forerunnerAPIBase() + "ReportManager/CreateLinkedReport",
                    async: true,
                    data: {
                        name: linkedName,
                        parent: fileLocation,
                        link: me.curPath
                    },
                    success: function (data) {
                        if (data.Status === "Failed") {
                            console.log('Create linked report wrong.', data.Exception);
                            return;
                        }

                        me.closeDialog();
                    },
                    fail: function (data) {
                    },
                });
            }
        },
        _reset: function () {
            var me = this;

            me.$name.val('');
            me.$location.val('');

            me.$tree.jstree("close_all");
            me.$tree.jstree("open_node", "j1_1");
            me.$tree.jstree("deselect_all", true);

            //make sure the popup is hidden
            me.$popup.addClass("fr-core-hidden");
        },
        _getReportLink: function () {
            var me = this;

            forerunner.ajax.ajax({
                type: "GET",
                dataType: "JSON",
                url: forerunner.config.forerunnerAPIBase() + "ReportManager/GetReportLink",
                async: false,
                data: {
                    name: linkedName,
                    parent: fileLocation,
                    link: me.curPath
                },
                success: function (data) {
                    console.log(data);
                },
                fail: function (data) {
                },
            });
        },
        _setReportLink: function () {
            var me = this,
               fileLocation,
               linkedName;

            if (me.$form.valid()) {
                linkedName = $.trim(me.$name.val());
                fileLocation = $.trim(me.$location.val());

                forerunner.ajax.ajax({
                    type: "POST",
                    dataType: "JSON",
                    url: forerunner.config.forerunnerAPIBase() + "ReportManager/SetReportLink",
                    async: true,
                    data: {
                        name: linkedName,
                        link: me.curPath
                    },
                    success: function (data) {
                        if (data.Status === "Failed") {
                            console.log('Create linked report wrong.', data.Exception);
                            return;
                        }

                        me.closeDialog();
                    },
                    fail: function (data) {
                    },
                });
            }
        },
        _resetValidateMessage: function () {
            var me = this;
            var error = locData.validateError;

            jQuery.extend(jQuery.validator.messages, {
                required: error.required,
                number: error.number,
                digits: error.digits
            });
        },
    });
});