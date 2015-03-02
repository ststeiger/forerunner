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
    var helper = forerunner.helper;

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
                        "<td colspan='2' class='fr-upf-browse-btn-container'>" +
                            "<input name='browse' type='button' autofocus='autofocus' value='" + uploadFile.browseBtn + "' title='" + uploadFile.browseBtn + "' class='fr-upf-browse-id fr-core-action-button'/>" +
                        "</td>" +
                    "</tr>" +
                    // File to upload
                    "<tr>" +
                        "<td class='fr-upf-label-cell'>" +
                            "<label class='fr-upf-label'>" + uploadFile.uploadFileLabel + "</label>" +
                        "</td>" +
                        "<td>" +
                            "<input name='filename' readonly class='fr-upf-file fr-upf-input' type='text' required='true'/>" +
                            "<span class='fr-dlb-error-span'/>" +
                        "</td>" +
                    "</tr>" +
                    // Overwrite checkbox
                    "<tr>" +
                        "<td>" +
                            "<label class='fr-upf-label'>" + uploadFile.overwrite + "</label>" +
                        "</td>" +
                        "<td>" +
                            "<input name='overwrite' class='fr-upf-overwrite-id fr-upf-checkbox' type='checkbox'/>" +
                        "</td>" +
                    "</tr>" +
                    // Upload Status and progress bar
                    "<tr>" +
                        "<td colspan='2'>" +
                            "<div class='fr-upf-progess-container'>" +
                                "<div class='fr-upf-progess-bar' />" +
                                "<div class='fr-upf-progress-text' />" +
                            "</div>" +
                        "</td>" +
                    "</tr>" +
                "</table>"
            );

            me.$formMain.html("");
            me.$formMain.append($table);

            // Change the form to set up a post action and a submit button
            var url = me.options.reportManagerAPI + "/UploadFile";
            me.$form.attr({ action: url, method: "post", enctype: "multipart/form-data" });
            me.$submit.attr({ type: "submit" });

            me.$decsription = me.element.find(".fr-upf-description");
            me.$uploadFile = me.element.find(".fr-upf-file");
            me.$overwrite = me.element.find(".fr-upf-overwrite-id");

            me.$progressContainer = me.element.find(".fr-upf-progess-container");
            me.$progressBar = me.element.find(".fr-upf-progess-bar");
            me.$progress = me.element.find(".fr-upf-progress-text");

            // Use jquery.form to handle an ajax like POST to the server
            me.$progressContainer.show();
            me.$form.ajaxForm({
                beforeSend: function () {
                    var percent = "0%";
                    me.$progress.text(percent);
                    me.$progressBar.width(percent);
                },
                uploadProgress: function (event, position, total, percentComplete) {
                    var percent = percentComplete + '%';
                    me.$progress.text(percent);
                    me.$progressBar.width(percent);
                },
                success: function (data, status, xhr) {
                    me.$progressContainer.hide();
                    me.closeDialog();
                },
                error: function (xhr, status, error) {
                    me.$progressContainer.hide();
                    me._showSubmitError(xhr.responseText);
                }
            });

            me._validateForm(me.$form);

            me.$uploadFile.watermark(uploadFile.uploadFileLabel, { useNative: false, className: "fr-watermark" });

            // Add a transparent file type <input> tag overlaid on top of the "Browse Button" This will enable
            // use to have the look and feel we want and also be compatible on all browsers
            me.$browseContainer = me.element.find(".fr-upf-browse-btn-container");
            me.$browseBtn = me.element.find(".fr-upf-browse-id");
        },
        _submit: function () {
            // We are taking this processing away because the "real" form submit processing will handles
            // this. See the me.$form.ajaxForm statement above
        },
        openDialog: function () {
            var me = this;
            me._super();
            me._onReadyBrowseBtn();
        },
        _onReadyBrowseBtn: function () {
            var me = this;

            me.$submitError.width(me.$decsription.width());
            me.$progressContainer.width(me.$decsription.width());

            if (me.$browseBtn.is(":visible")) {
                me.$inputFile = $("<input name='file' type=file class='fr-upf-transparent-input' />");
                me.$inputFile.on("change", function (e, data) {
                    me._onChangeInputFile.call(me);
                });
                
                me.$inputFile.css({
                    top: me.$browseBtn.css("marginTop"),
                    left: me.$browseBtn.css("marginLeft"),
                    width: me.$browseBtn.css("width"),
                    height: me.$browseBtn.css("height")
                });

                me.$browseContainer.append(me.$inputFile);
            } else {
                // Poll until the browser button is visible
                setTimeout(function () {
                    me._onReadyBrowseBtn.call(me);
                }, 50);
            }
        },
        _onChangeInputFile: function (e, data) {
            var me = this;

            if (me.$inputFile[0] && me.$inputFile[0].files && me.$inputFile[0].files[0] && me.$inputFile[0].files[0].name) {
                me.$uploadFile.val(me.$inputFile[0].files[0].name);
            }
        }
    }); //$.widget
});