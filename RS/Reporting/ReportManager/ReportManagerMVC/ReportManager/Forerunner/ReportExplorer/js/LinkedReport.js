/**
 * @file Contains the forerunnerLinkedReport widget.
 */
var forerunner = forerunner || {};
// Forerunner SQL Server Reports
forerunner.ssr = forerunner.ssr || {};

$(function () {
    var constants = forerunner.ssr.constants;
    var widgets = constants.widgets;
    var events = constants.events;
    var locData = forerunner.localize.getLocData(forerunner.config.forerunnerFolder() + "ReportViewer/loc/ReportViewer");
    var linked = locData.linkedReport;
    var common = locData.common;

    /**
    * Widget used to manage item linked report
    *
    * @namespace $.forerunner.forerunnerLinkedReport
    * @prop {Object} options - The options for the linked report dialog
    * @prop {Object} options.$reportExplorer - Report viewer widget
    * @prop {Object} options.$appContainer - The container jQuery object that holds the application
    * @prop {String} options.rsInstance - Optional, Report service instance name
    * @prop {String} options.title - Dialog title
    * @prop {String} options.iconClass - Style class of the dialog icon
    *
    * @example
    * $("#property").forerunnerLinkedReport({
    *     $appContainer: me.options.$appContainer,
    *     $reportExplorer: me.$explorer
    * });
    */
    $.widget(widgets.getFullname(widgets.forerunnerLinkedReport), $.forerunner.dialogBase, /** @lends $.forerunner.newFolder */ {
        options: {
            $appContainer: null,
            $reportExplorer: null,
            reportManagerAPI: null,
            rsInstance: null,
            title: linked.title,
            iconClass: "fr-icons24x24-tags"
        },
        rootPath: "/",

        _create: function () {
            var me = this;
            me._super();
            me.guid = forerunner.helper.guidGen();
        },
        _init: function () {
            var me = this;
            me._super();
            me.$form.addClass("fr-linked-form");
            me.curPath = null;

            var $main = new $(
                "<div class='fr-linked-container'>" +
                    "<div class='fr-linked-prompt fr-core-dialog-description'></div>" +
                        // Dropdown container
                    "<div class='fr-linked-input-container fr-linked-dropdown-container'>" +
                        "<label class='fr-linked-label fr-linked-tree-label' >" + linked.location + "</label>" +
	                    "<input type='text' name='location' class='fr-core-input fr-linked-input fr-linked-location fr-core-cursorpointer' readonly='true' required='true' allowblank='false' nullable='false'/>" +
	                    "<div class='fr-linked-dropdown-iconcontainer fr-core-cursorpointer'>" +
		                    "<div class='fr-linked-dropdown-icon'></div>" +
	                    "</div>" +
                        "<span class='fr-dlb-error-span'/>" +
                    "</div>" +
                    "<div class='fr-linked-input-container'>" +
                        "<label class='fr-linked-label'>" + common.name + "</label>" +
                        "<input type='text' name='linkedname' class='fr-core-input fr-linked-input fr-linked-name' autocomplete='off' required='true' />" +
                        "<span class='fr-dlb-error-span' />" +
                    "</div>" +
                "</div>");

            me.$formMain.html("");
            me.$formMain.append($main);

            me.$linkContainer = me.$formMain.find(".fr-linked-container");
            me.$prompt = me.$linkContainer.find(".fr-linked-prompt");
            me.$name = me.$linkContainer.find(".fr-linked-name");
            me.$location = me.$linkContainer.find(".fr-linked-location");
            me.$treeLabel = me.$linkContainer.find(".fr-linked-tree-label");

            me._bindEvents();
            me._reset();
        },
        _bindEvents: function () {
            var me = this;

            me._resetValidateMessage();
            me._validateForm(me.$form);

            me.$location.off("click");
            me.$location.on("click", function () {
                me._openPopup.call(me);
            });

            me.element.find(".fr-linked-dropdown-icon").off("click");
            me.element.find(".fr-linked-dropdown-icon").on("click", function () {
                me._openPopup.call(me);
            });
        },
        _submit: function () {
            var me = this;

            if (!me.$form.valid()) {
                return;
            }

            me.isLinkedReport ? me._setReportLink() : me._createLinkedReport();
        },
        _reset: function () {
            var me = this;

            me.$name.val("");
            me.$location.removeAttr("title").val("");
        },
        _openPopup: function () {
            var me = this;
            me.initHeight = me.initHeight || me.$linkContainer.height();
            //calculate the tree container width
            //handle border width
            var width = me.$location.width() + 24;
            var visible = me.$location.catalogTree("toggleCatalog", width);

            visible ? me.$linkContainer.css({ height: "220px" }) : me.$linkContainer.css({ height: me.initHeight });
        },
        setData: function (catalogItem){
            var me = this,
                prompt,
                treeLabel;

            me.reportType = catalogItem.Type;
            me.curPath = catalogItem.Path;
            me.linkedReportName = catalogItem.Name;

            me.isLinkedReport = me.reportType === forerunner.ssr.constants.itemType.linkedReport ? true : false;

            me._reset();

            var catalogTreeOptions = {
                rootPath: "/",
                $appContainer: me.options.$appContainer,
                reportManagerAPI: me.options.reportManagerAPI,
                containerClass: "fr-linked-popup-container",
                catalogTreeClass: "fr-linked-tree-container",
                rsInstance: me.options.rsInstance
            };

            me.showLoadingIndictator();

            me.$location.off(events.catalogTreeGetCatalogComplete());
            me.$location.on(events.catalogTreeGetCatalogComplete(), function (e, data) {
                me.removeLoadingIndicator();
            });

            if (me.isLinkedReport) {
                me._getReportLink();
                me.$name.attr("disabled", true);
                prompt = locData.linkedReport.edit.format(me.curPath);
                treeLabel = locData.linkedReport.report;

                catalogTreeOptions.type = "fullCatalog";
            } else {
                me.$name.removeAttr("disabled");
                prompt = locData.linkedReport.create.format(me.curPath);
                treeLabel = locData.linkedReport.locatiton;

                catalogTreeOptions.type = "subCatalog";
            }

            me.$prompt.text(prompt);
            me.$treeLabel.text(treeLabel);

            //initialized catalog tree widget on the location input element
            me.$location.catalogTree(catalogTreeOptions);

            //after the item is selected this event will be triggered
            me.$location.off(events.catalogTreeCatalogSelected());
            me.$location.on(events.catalogTreeCatalogSelected(), function (e, data) {
                var location = data.path;
                me.$location.attr("title", location).val(location).valid();
                me.$linkContainer.css({ height: me.initHeight });
            });
        },
        /**
         * Show the linked report modal dialog.
         *
         * @function $.forerunner.forerunnerProperties#openDialog
         */
        openDialog: function () {
            var me = this;

            forerunner.dialog.dialogLock = true;

            forerunner.dialog.showModalDialog(me.options.$appContainer, me);
        },
        /**
         * Close the linked report modal dialog.
         *
         * @function $.forerunner.forerunnerProperties#closeDialog
         */
        closeDialog: function () {
            var me = this;

            forerunner.dialog.dialogLock = false;

            me._trigger(events.close, null, { $forerunnerLinkedReport: me.element, path: me.curPath });
            forerunner.dialog.closeModalDialog(me.options.$appContainer, me);

            //make sure the $linkContainer is reset to its original height when dialog close
            me.initHeight && me.$linkContainer.css({ height: me.initHeight });
        },
        _getReportLink: function () {
            var me = this;

            forerunner.ajax.ajax({
                type: "GET",
                dataType: "JSON",
                url: forerunner.config.forerunnerAPIBase() + "ReportManager/GetReportLink",
                async: false,
                data: {
                    path: me.curPath
                },
                success: function (data) {
                    me.$location.attr("title", data.linkedReport).val(data.linkedReport);
                    me.$name.val(me.linkedReportName);
                },
                fail: function (data) {

                },
            });
        },
        _setReportLink: function () {
            var me = this,
                fileLocation = $.trim(me.$location.val());

            forerunner.ajax.ajax({
                type: "POST",
                dataType: "JSON",
                url: forerunner.config.forerunnerAPIBase() + "ReportManager/SetReportLink",
                async: true,
                data: {
                    linkedReportPath: me.curPath,
                    newLink: fileLocation
                },
                success: function (data) {
                    if (data.Exception) {
                        forerunner.dialog.showMessageBox(me.options.$appContainer, data.Exception.Message);

                        console.log("Set linked report wrong.", data.Exception);
                        return;
                    }

                    me.closeDialog();
                },
                fail: function (data) {
                },
            });
        },
        _createLinkedReport: function () {
            var me = this,
                fileLocation = $.trim(me.$location.val()),
                linkedName = $.trim(me.$name.val());

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
                    if (data.Exception) {
                        forerunner.dialog.showMessageBox(me.options.$appContainer, data.Exception.Message);

                        console.log("Create linked report wrong.", data.Exception);
                        return;
                    }

                    me.closeDialog();
                },
                fail: function (data) {
                },
            });
        }
    });  // $.widget()
});  // $(function ()