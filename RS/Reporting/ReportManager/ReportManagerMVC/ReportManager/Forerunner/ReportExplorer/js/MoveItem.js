/**
 * @file Contains the forerunnerMoveItem widget.
 */
var forerunner = forerunner || {};
// Forerunner SQL Server Reports
forerunner.ssr = forerunner.ssr || {};

$(function () {
    var constants = forerunner.ssr.constants;
    var widgets = constants.widgets;
    var events = constants.events;
    var locData = forerunner.localize.getLocData(forerunner.config.forerunnerFolder() + "ReportViewer/loc/ReportViewer");
    var common = locData.common;
    var move = locData.move;

    /**
    * Widget used to support item move
    *
    * @namespace $.forerunner.forerunnerMoveItem
    * @prop {Object} options - The options for the forerunnerMoveItem dialog
    * @prop {Object} options.$reportExplorer - Report viewer widget
    * @prop {Object} options.$appContainer - The container jQuery object that holds the application
    * @prop {String} options.rsInstance - Optional, Report service instance name
    * @prop {String} options.title - Dialog title
    * @prop {String} options.iconClass - Style class of the dialog icon
    *
    * @example
    * $("#dialog").forerunnerMoveItem({
    *     $appContainer: me.options.$appContainer,
    *     $reportExplorer: me.$explorer
    * });
    */
    $.widget(widgets.getFullname(widgets.forerunnerMoveItem), $.forerunner.dialogBase, /** @lends $.forerunner.newFolder */ {
        options: {
            $appContainer: null,
            $reportExplorer: null,
            rsInstance: null,
            title: move.title,
            iconClass: "fr-icons24x24-tags"
        },
        _init: function () {
            var me = this;
            me._super();

            me.curPath = null;

            var $main = new $(
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
                "</div>");

            me.$formMain.html("");
            me.$formMain.append($main);

            me.$moveContainer = me.$formMain.find(".fr-move-container");
            me.$location = me.$moveContainer.find(".fr-move-location");

            me._bindEvents();
        },
        _bindEvents: function () {
            var me = this;

            me.$location.off("click");
            me.$location.on("click", function () {
                me._openPopup.call(me);
            });

            me.element.find(".fr-move-dropdown-icon").off("click");
            me.element.find(".fr-move-dropdown-icon").on("click", function () {
                me._openPopup.call(me);
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

            me.showLoadingIndictator();

            me.$location.off(events.catalogTreeGetCatalogComplete());
            me.$location.on(events.catalogTreeGetCatalogComplete(), function (e, data) {
                me.removeLoadingIndicator();
            });

            //after the item is selected this event will be triggered
            me.$location.off(events.catalogTreeCatalogSelected());
            me.$location.on(events.catalogTreeCatalogSelected(), function (e, data) {
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
            visible ? me.$moveContainer.css({ height: "200px" }): me.$moveContainer.css({ height: me.initHeight });
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

                        console.log("Set linked report wrong.", data.Exception);
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
                newLocation = location === "/" ? (location + me.Name) : (location + "/" + me.Name);

            if (data.curFullPath === newLocation) return null;

            data.newFullPath = newLocation;
            return data;
        }
    });
});