/**
 * @file Contains the forerunnerMoveItem widget.
 */
var forerunner = forerunner || {};
// Forerunner SQL Server Reports
forerunner.ssr = forerunner.ssr || {};

$(function () {
    var widgets = forerunner.ssr.constants.widgets;
    var events = forerunner.ssr.constants.events;
    var locData = forerunner.localize.getLocData(forerunner.config.forerunnerFolder() + "ReportViewer/loc/ReportViewer");

    /**
    * Widget used to support item move
    *
    * @namespace $.forerunner.forerunnerMoveItem
    * @prop {Object} options - The options for the forerunnerMoveItem dialog
    * @prop {Object} options.$reportExplorer - Report viewer widget
    * @prop {Object} options.$appContainer - The container jQuery object that holds the application
    * @prop {String} options.rsInstance - Optional, Report service instance name
    *
    * @example
    * $("#dialog").forerunnerMoveItem({
    *     $appContainer: me.options.$appContainer,
    *     $reportExplorer: me.$explorer
    * });
    */
    $.widget(widgets.getFullname(widgets.forerunnerMoveItem), {
        options: {
            $appContainer: null,
            $reportExplorer: null,
            rsInstance: null,
        },
        _create: function () {

        },
        _init: function () {
            var me = this;
            var common = locData.common,
                move = locData.move;

            me.curPath = null;
            me.element.children().remove();
            me.element.off(events.modalDialogGenericSubmit);
            me.element.off(events.modalDialogGenericCancel);

            var headerHtml = forerunner.dialog.getModalDialogHeaderHtml('fr-icons24x24-security', move.title, "fr-move-cancel", common.cancel);

            var $container = new $(
               "<div class='fr-core-dialog-innerPage fr-core-center'>" +
                   headerHtml +
                "<div class='fr-move-container'>" +
                    "<div class='fr-move-prompt fr-core-dialog-description'>" + move.prompt + "</div>" +
                    // Dropdown container
                    "<div class='fr-move-input-container fr-move-dropdown-container'>" +
                        "<label class='fr-move-label fr-move-tree-label' >" + move.location + "</label>" +
	                    "<input type='text' name='location' class='fr-core-input fr-move-input fr-move-location fr-core-cursorpointer'" +
                            " readonly='true' required='true' allowblank='false' nullable='false'/>" +
	                    "<div class='fr-move-dropdown-iconcontainer fr-core-cursorpointer'>" +
		                    "<div class='fr-move-dropdown-icon'></div>" +
	                    "</div>" +
                    "</div>" +
                "</div>" +
                "<div class='fr-core-dialog-submit-container fr-move-submit-container'>" +
                    "<div class='fr-core-center'>" +
                        "<input type='button' class='fr-move-submit fr-core-dialog-button' value='" + common.submit + "' />" +
                        "<input type='button' class='fr-move-cancel fr-core-dialog-button' value='" + common.cancel + "' />" +
                    "</div>" +
                "</div>" +
               "</div>");

            me.element.append($container);
            me.$moveContainer = me.element.find(".fr-move-container");
            me.$location = me.$moveContainer.find(".fr-move-location");

            me._bindEvents();
        },
        _bindEvents: function () {
            var me = this;

            me.$location.on('click', function () {
                me._openPopup.call(me)
            });

            me.element.find(".fr-move-dropdown-icon").on("click", function () {
                me._openPopup.call(me)
            });

            me.element.find(".fr-move-submit").on("click", function () {
                me._submit();
            });

            me.element.find(".fr-move-cancel").on("click", function () {
                me.closeDialog();
            });

            me.element.on(events.modalDialogGenericSubmit, function () {
                me._submit();
            });

            me.element.on(events.modalDialogGenericCancel, function () {
                me.closeDialog();
            });
        },
        setData: function (catalogItem) {
            var me = this;

            me.curPath = catalogItem.Path;
            me.Name = catalogItem.Name;
            me.Type = catalogItem.Type;

            var parentPath = forerunner.helper.getParentPath(me.curPath);
            parentPath = (parentPath === null || parentPath === "") ? "/" : parentPath;
            me.$location.val(parentPath);

            var catalogTreeOptions = {
                rootPath: "/",
                type: "subCatalog",
                $appContainer: me.options.$appContainer,
                reportManagerAPI: me.options.reportManagerAPI,
                containerClass: "fr-move-popup-container",
                catalogTreeClass: "fr-move-tree-container",
                rsInstance: me.options.rsInstance
            };

            //initialized catalog tree widget on the location input element
            me.$location.catalogTree(catalogTreeOptions);

            //after the item is selected this event will be triggered
            me.$location.off(events.forerunnerCatalogSelected());
            me.$location.on(events.forerunnerCatalogSelected(), function (e, data) {
                var location = data.path;
                me.$location.attr("title", location).val(location);
                //here me.initHeight already exist,
                //it will be set when open the tree dropdown for the first time
                me.$moveContainer.css({ height: me.initHeight });
            });
        },
        _openPopup: function () {
            var me = this;
            me.initHeight = me.initHeight || me.$moveContainer.height();
            //calculate the tree container width, handle border width
            var width = me.$location.width() + 24;
            var visible = me.$location.catalogTree("toggleCatalog", width);
            //expand fr-move-container height to 200px to show the tree dropdown
            visible ? me.$moveContainer.css({ height: '200px' }): me.$moveContainer.css({ height: me.initHeight });
        },
        /**
         * Show the forerunnerMoveItem modal dialog.
         *
         * @function $.forerunner.forerunnerMoveItem#openDialog
         */
        openDialog: function () {
            var me = this;

            forerunner.dialog.dialogLock = true;
            forerunner.dialog.showModalDialog(me.options.$appContainer, me);
        },
        /**
         * Close the forerunnerMoveItem modal dialog.
         *
         * @function $.forerunner.forerunnerMoveItem#closeDialog
         */
        closeDialog: function () {
            var me = this;

            forerunner.dialog.dialogLock = false;
            me._trigger(events.close);
            forerunner.dialog.closeModalDialog(me.options.$appContainer, me);
            //make sure the moveContainer is reset to its original height when dialog close
            me.initHeight && me.$moveContainer.css({ height: me.initHeight });
        },
        _submit: function (callback) {
            var me = this,
                postData = me._generatePostData();

            if (postData === null) {
                me.closeDialog();
                return;
            }

            forerunner.ajax.ajax({
                type: "POST",
                dataType: "JSON",
                url: forerunner.config.forerunnerAPIBase() + "ReportManager/MoveItem",
                data: postData,
                success: function (data) {
                    if (data.Exception) {
                        forerunner.dialog.showMessageBox(me.options.$appContainer, data.Exception.Message);

                        console.log('Set linked report wrong.', data.Exception);
                        return;
                    }

                    me.closeDialog();
                },
                fail: function (data) {
                },
            });
        },
        _generatePostData: function () {
            var me = this,
                data = {
                    curFullPath: me.curPath,
                    newFullPath: null,
                    instance: me.options.rsInstance
                },
                location = $.trim(me.$location.val()),
                newLocation = location === '/' ? (location + me.Name) : (location + '/' + me.Name);

            if (data.curFullPath === newLocation) return null;

            data.newFullPath = newLocation;
            return data;
        }
    });
});