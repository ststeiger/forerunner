/**
 * @file Contains the New Folder dialog widget.
 *
 */

// Assign or create the single globally scoped variable
var forerunner = forerunner || {};

// Forerunner SQL Server Reports
forerunner.ssr = forerunner.ssr || {};

$(function () {
    var widgets = forerunner.ssr.constants.widgets;
    var events = forerunner.ssr.constants.events;
    var locData = forerunner.localize.getLocData(forerunner.config.forerunnerFolder() + "ReportViewer/loc/ReportViewer");
    var newFolder = locData.newFolder;
    var helper = forerunner.helper;

    /**
     * Widget used to create a new child folder on the server
     *
     * @namespace $.forerunner.newFolder
     * @prop {Object} options - The options for the new folder dialog
     * @prop {String} options.parentFolder - Folder the file will be uploaded to
     * @prop {Object} options.$reportExplorer - Report Explorer Widget
     *
     * @example
     * $("#newFolderDialog").newFolder({
     *      $appContainer: me.options.$appContainer,
     *      $reportExplorer: me.element,
     *      parentFolder: me.lastFetched.path,
     *      rsInstance: me.options.rsInstance
     * });
     */
    $.widget(widgets.getFullname(widgets.newFolder), $.forerunner.dialogBase, /** @lends $.forerunner.newFolder */ {
        options: {
            title: newFolder.title,
            iconClass: "fr-nfd-new-folder-icon",
            parentFolder: "",
            $reportExplorer: null
        },
        _init: function () {
            var me = this;
            me._super();

            var description = newFolder.description.replace("{0}", me.options.parentFolder);

            var $main = $(
                "<div>" +
                    // Dialog description
                    "<label class='fr-nfd-description fr-core-dialog-description'>" + description + "</label>" +
                    // New folder name
                    "<label class='fr-nfd-label'>" + newFolder.name + "</label>" +
                    "<input name='foldername' class='fr-nfd-name fr-core-input' type='text' required='true' autofocus='autofocus'/>" +
                    "<span class='fr-dlb-error-span'/>" +
                    // Folder Description
                    "<label class='fr-nfd-label'>" + newFolder.descriptionLabel + "</label>" +
                    "<textarea name='folderdescription' rows='5' class='fr-nfd-folder-description fr-core-input' />" +
                    // Hidden in normal mode check box
                    "<div class='fr-nfd-hidden-container'>" +
                        "<input name='hide' class='fr-nfd-hidden' type='checkbox'/>" +
                        "<label class='fr-nfd-hidden-label'>" + newFolder.hide + "</label>" +
                    "</div>" +
                "</div>"
            );

            me.$formMain.html("");
            me.$formMain.append($main);

            me.$folderName = me.element.find(".fr-nfd-name");
            me.$folderDecsription = me.element.find(".fr-nfd-folder-description");
            me.$hidden = me.element.find(".fr-nfd-hidden");

            me._validateForm(me.$form);

            me.$folderName.watermark(newFolder.name, { useNative: false, className: "fr-watermark" });
        },
        _submit: function () {
            var me = this;

            if (!me.$form.valid()) {
                return;
            }

            me._hideSubmitError();

            forerunner.ajax.ajax({
                type: "POST",
                dataType: "text",
                async: false,
                url: me.options.reportManagerAPI + "/NewFolder",
                data: {
                    parentFolder: me.options.parentFolder,
                    folderName: me.$folderName.val(),
                    folderDecsription: me.$folderDecsription.val(),
                    hidden: me.$hidden.is(":checked") ? "on" : "off",
                    instance: me.options.rsInstance
                },
                success: function (data, status, xhr) {
                    var dataObj = JSON.parse(data);
                    if (dataObj.Exception) {
                        me._showExceptionError(dataObj);
                        return;
                    }

                    me.options.$reportExplorer.reportExplorer("refresh");
                    me.closeDialog();
                },
                fail: function (jqXHR, textStatus, errorThrown) {
                    if (xhr.status === 400) {
                        forerunner.dialog.showMessageBox(me.options.$appContainer, locData.newFolder.fileExists, locData.newFolder.fileExists);
                        return;
                    }

                    me._showSubmitError(xhr.responseText);
                }
            });
        },
        openDialog: function () {
            var me = this;
            me._super();
        }
    }); //$.widget
});