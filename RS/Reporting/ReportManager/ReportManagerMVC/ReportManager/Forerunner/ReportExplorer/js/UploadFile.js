/**
 * @file Contains the upload file dialog widget.
 *
 */

// Assign or create the single globally scoped variable
var forerunner = forerunner || {};

// Forerunner SQL Server Reports
forerunner.ssr = forerunner.ssr || {};

$(function () {
    var widgets = forerunner.ssr.constants.widgets;
    var locData = forerunner.localize.getLocData(forerunner.config.forerunnerFolder() + "ReportViewer/loc/ReportViewer");
    var uploadFile = locData.uploadFile;

    /**
     * Widget used to upload a file to the server
     *
     * @namespace $.forerunner.uploadFile
     * @prop {Object} options - The options for the upload file dialog
     *
     * @example
     * $("#uploadFileDialog").uploadFile({
     *      $appContainer: me.options.$appContainer,
     *      title: loc.uploadFile.title,
     *      iconClass: "fr-upf-upload-file-icon"
     * });
     */
    $.widget(widgets.getFullname(widgets.uploadFile), $.forerunner.dialogBase, /** @lends $.forerunner.uploadFile */ {
        options: {
            title: uploadFile.title,
            iconClass: "fr-upf-upload-file-icon",
            parentFolder: ""
        },
        _init: function () {
            var me = this;
            me._super();

            var description = uploadFile.description.replace("{0}", me.options.parentFolder);

            var $table = $(
                "<table>" +
                    // Instructions
                    "<tr>" +
                        "<td colspan='2'>" +
                            "<label class='fr-upf-description fr-core-dialog-description'>" + description + "</label>" +
                        "</td>" +
                    "</tr>" +
                    // Browse button
                    "<tr>" +
                        "<td colspan='2'>" +
                            "<input name='add' type='button' value='" + uploadFile.browseBtn + "' title='" + uploadFile.browseBtn + "' class='fr-upf-browse-id fr-core-action-button'/>" +
                        "</td>" +
                    "</tr>" +
                    // File to upload
                    "<tr>" +
                        "<td class='fr-upf-label-cell'>" +
                            "<label class='fr-upf-label'>" + uploadFile.uploadFileLabel + "</label>" +
                        "</td>" +
                        "<td>" +
                            "<input class='fr-upf-file fr-upf-input' autofocus='autofocus' type='text' required='true'/>" +
                            "<span class='fr-dlb-error-span'/>" +
                        "</td>" +
                    "</tr>" +
                    // File name
                    "<tr>" +
                        "<td>" +
                            "<label class='fr-upf-label'>" + uploadFile.filename + "</label>" +
                        "</td>" +
                        "<td>" +
                            "<input class='fr-upf-name fr-upf-input' type='text' required='true'/>" +
                            "<span class='fr-dlb-error-span'/>" +
                        "</td>" +
                    "</tr>" +
                    // Overwrite checkbox
                    "<tr>" +
                        "<td>" +
                            "<label class='fr-upf-label'>" + uploadFile.overwrite + "</label>" +
                        "</td>" +
                        "<td>" +
                            "<input class='fr-upf-overwrite-id fr-upf-checkbox' type='checkbox'/>" +
                        "</td>" +
                    "</tr>" +
                "</table>"
            );

            me.$formMain.html("");
            me.$formMain.append($table);

            me._validateForm(me.$form);

            me.$decsription = me.element.find(".fr-upf-description");
            me.$uploadFile = me.element.find(".fr-upf-file");
            me.$uploadName = me.element.find(".fr-upf-name");
            me.$overwrite = me.element.find(".fr-upf-overwrite-id");

            me.$uploadFile.watermark(uploadFile.uploadFileLabel, { useNative: false, className: "fr-watermark" });
            me.$uploadName.watermark(uploadFile.filename, { useNative: false, className: "fr-watermark" });
        },
        _create: function () {
            var me = this;
            me._super();
        },
    }); //$.widget
});