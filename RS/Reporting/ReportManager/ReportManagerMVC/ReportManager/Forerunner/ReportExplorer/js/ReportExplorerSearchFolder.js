/**
 * @file Contains the reportExplorerSearchFolder widget.
 *
 */

// Assign or create the single globally scoped variable
var forerunner = forerunner || {};

// Forerunner SQL Server Reports
forerunner.ssr = forerunner.ssr || {};

$(function () {
    var widgets = forerunner.ssr.constants.widgets;
    var events = forerunner.ssr.constants.events;
    var locData = forerunner.localize;

    /**
     * Widget used to create search folder
     *
     * @namespace $.forerunner.reportExplorerSearchFolder
     * @prop {Object} options - The options for reportExplorerSearchFolder
     * @prop {Object} options.$reportExplorer - Report viewer widget
     * @prop {Object} options.$appContainer - The container jQuery object that holds the application
     *
     * @example
     * $("#searchFolder").reportExplorerSearchFolder({
     *     $appContainer: me.options.$appContainer,
     *     $reportExplorer: me.element,
     * });
    */
    $.widget(widgets.getFullname(widgets.reportExplorerSearchFolder), {
        options: {
            $reportExplorer: null,
            $appContainer: null
        },
        _create: function () {

        },
        _init: function () {
            var me = this;

            me.element.html("");
            me.element.off(events.modalDialogGenericSubmit);
            me.element.off(events.modalDialogGenericCancel);            

            var headerHtml = forerunner.dialog.getModalDialogHeaderHtml("fr-icons24x24-searchfolder", locData.getLocData().searchFolder.title, "fr-sf-cancel", locData.getLocData().searchFolder.cancel);

            var $container = new $(
                "<div class='fr-core-dialog-innerPage fr-core-center'>" +
                    headerHtml +
                   "<div class='fr-sf-form-container'>" +
                        "<form class='fr-core-dialog-form fr-sf-form'>" +
                            "<table class='fr-sf-table'>" +
                                "<tr>" +
                                    "<td><label class='fr-sf-label'>" + locData.getLocData().searchFolder.name + ":</label></td>" +
                                    "<td><input type='text' class='fr-core-input fr-sf-text fr-sf-foldername' name='foldername' required='true' />" +
                                         "<span class='fr-sf-error-span' />" +
                                    "</td>" +
                                "</tr>" +
                                "<tr>" +
                                    "<td><label class='fr-sf-label'>" + locData.getLocData().searchFolder.tags + ":</label></td>" +
                                    "<td><input type='text' class='fr-core-input fr-sf-text fr-sf-foldertags' name='tags' required='true' />" +
                                        "<span class='fr-sf-error-span' />" +
                                    "</td>" +
                                "</tr>" +
                                "<tr class='fr-sf-prompt'>" +
                                    "<td></td>" +
                                    "<td><label class='fr-sf-label-prompt'>" + locData.getLocData().searchFolder.prompt + "</label></td>" +
                                "<tr>" +
                            "</table>" +
                        "</form>" +
                    "</div>" +
                    "<div class='fr-core-dialog-submit-container'>" +
                        "<div class='fr-core-center'>" +
                            "<input type='button' class='fr-sf-submit-id fr-sf-button fr-core-dialog-button' value='" + locData.getLocData().searchFolder.submit + "' />" +
                        "</div>" +
                        "<div class='fr-sf-location' />" +
                    "</div>" +
                "</div>");

            me.element.append($container);

            me.element.find(".fr-sf-foldername").watermark(locData.getLocData().searchFolder.namePlaceholder, forerunner.config.getWatermarkConfig());
            me.element.find(".fr-sf-foldertags").watermark(locData.getLocData().searchFolder.tags, forerunner.config.getWatermarkConfig());

            me.$form = $container.find(".fr-sf-form");
            me.$form.validate({
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

            //disable form auto submit when click enter on the keyboard
            me.$form.on("submit", function () { return false; });

            me.element.find(".fr-sf-cancel").on("click", function (e) {
                me.closeDialog();
            });

            me.element.find(".fr-sf-submit-id").on("click", function (e) {
                me._createSearchFolder();
            });
            
            me.element.on(events.modalDialogGenericSubmit, function () {
                me._createSearchFolder();
            });

            me.element.on(events.modalDialogGenericCancel, function () {
                me.closeDialog();
            });
        },
        _createSearchFolder: function () {
            var me = this;

            if (me.$form.valid()) {
                var name = $.trim(me.element.find(".fr-sf-foldername").val());
                var tags = $.trim(me.element.find(".fr-sf-foldertags").val());
                var tagsList = tags.split(",");

                for (var i = 0; i < tagsList.length; i++) {
                    tagsList[i] =  $.trim(tagsList[i]) ;
                }

                var searchfolder = {
                    searchFolderName: name,
                    overwrite: false,
                    content: { name: name, tags: tagsList.join(",") }
                };

                me.options.$reportExplorer.reportExplorer("setSearchFolder", searchfolder);
                me.closeDialog();
            }
        },
        /**
         * Open search folder dialog
         *
         * @function $.forerunner.reportExplorerSearchFolder#openDialog
         */
        openDialog: function () {
            var me = this;

            forerunner.dialog.showModalDialog(me.options.$appContainer, me);
        },
        /**
         * Close search folder dialog
         *
         * @function $.forerunner.reportExplorerSearchFolder#closeDialog
         */
        closeDialog: function () {
            var me = this;

            forerunner.dialog.closeModalDialog(me.options.$appContainer, me);
        },
    });   
});