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
    var events = forerunner.ssr.constants.events;
    var locData;
    var uploadFile;
    forerunner.localize.getLocData(forerunner.config.forerunnerFolder() + "ReportViewer/loc/ReportViewer", "json", function (loc) {
        locData = loc;
        uploadFile = locData.uploadFile;
    });
    
    var helper = forerunner.helper;

    /**
     * Widget used to upload a file to the server
     *
     * @namespace $.forerunner.uploadFile
     * @prop {Object} options - The options for the upload file dialog
     * @prop {String} options.itemType - The CataloagItem.Type
     * @prop {String} options.parentFolder - Folder the file will be uploaded to
     * @prop {Object} options.$reportExplorer - Report Explorer Widget
     *
     * @example
     * $("#uploadFileDialog").uploadFile({
     *      $appContainer: me.options.$appContainer,
     *      $reportExplorer: me.element,
     *      parentFolder: me.lastFetched.path,
     *      rsInstance: me.options.rsInstance
     * });
     */
    $.widget(widgets.getFullname(widgets.uploadFile), $.forerunner.dialogBase, /** @lends $.forerunner.uploadFile */ {
        options: {            
            iconClass: "fr-upf-upload-file-icon",
            itemType: "",
            parentFolder: "",
            $reportExplorer: null
        },
        _init: function () {
            var me = this;
            me._super();

            forerunner.localize.getLocData(forerunner.config.forerunnerFolder() + "ReportViewer/loc/ReportViewer", "json", function (loc) {
                locData = loc;
                uploadFile = locData.uploadFile;
            
            if (!me.options.title) me.options.title = uploadFile.title;
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
                            "<input name='browse' type='button' autofocus='autofocus' value='" + uploadFile.browseBtn + "' title='" + uploadFile.browseBtn + "' class='fr-upf-browse-id fr-upf-browse fr-core-action-button'/>" +
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
                    // Hidden fields
                    "<tr>" +
                        "<input name='rsinstance' type='text' class='fr-core-hidden' value='" + me.options.rsInstance + "' />" +
                        "<input name='parentfolder' type='text' class='fr-core-hidden' value='" + me.options.parentFolder + "' />" +
                        "<input name='itemtype' type='text' class='fr-core-hidden' value='" + me.options.itemType + "' />" +
                    "</tr>" +
                "</table>"
            );

            me.$formMain.html("");
            me.$formMain.append($table);

            // Change the form to set up a post action and a submit button
            var url = me.options.reportManagerAPI + "UploadFile";
            me.$form.attr({ action: url, method: "post", enctype: "multipart/form-data" });


            //ie not allow change input type property when it is created, to bypass it create a new one and replace old
            //it was record by #1433
            //This breaks now, not sure why but removing it for now ie8 only
            if (forerunner.device.isMSIE8()) {
                var newBtnHtml = me.$submit.prop("outerHTML").replace(/type=[a-z]+/i, "type='submit'");

                me.$submit.replaceWith(newBtnHtml);
            } else {
                me.$submit.attr({ type: "submit" });
            }

            
            
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
                    me._hideSubmitError();
                },
                uploadProgress: function (event, position, total, percentComplete) {
                    var percent = percentComplete + "%";
                    me.$progress.text(percent);
                    me.$progressBar.width(percent);
                },
                success: function (data, status, xhr) {
                    me.$progressContainer.hide();
                    var responseObj = JSON.parse(xhr.responseText);
                    var dataObj = JSON.parse(data);
                    if (responseObj.Warning) {
                        var message = locData.uploadFile.warningsMessage.replace("{0}", responseObj.Warning);
                        forerunner.dialog.showMessageBox(me.options.$appContainer, message, locData.uploadFile.title);
                    } else if (dataObj.Exception) {
                        me.$progressContainer.hide();
                        me._showExceptionError(dataObj);
                        return;
                    }

                    me.options.$reportExplorer.reportExplorer("refresh");
                    me.closeDialog();
                },
                error: function (xhr, status, error) {
                    me.$progressContainer.hide();
                    if (xhr.status === 400) {
                        forerunner.dialog.showMessageBox(me.options.$appContainer, locData.uploadFile.overwriteMessage, locData.uploadFile.overwriteTitle);
                        return;
                    }

                    me._showSubmitError(xhr.responseText);
                }
            });

            me._validateForm(me.$form);

            me.$uploadFile.watermark(uploadFile.uploadFileLabel, forerunner.config.getWatermarkConfig());

            // Add a transparent file type <input> tag overlaid on top of the "Browse Button" This will enable
            // us to have the look and feel we want and also be compatible on all browsers
            me.$browseContainer = me.element.find(".fr-upf-browse-btn-container");
            me.$browseBtn = me.element.find(".fr-upf-browse-id");
            });
        },
        _submit: function () {
            // We are taking this processing away because the "real" form submit processing will handles
            // this. See the me.$form.ajaxForm statement above
        },
        openDialog: function () {
            var me = this;
            me._super();
        },
        onDialogVisible: function() {
            var me = this;
            me._super();

            me.$progressContainer.width(me.$decsription.width());

            me.$inputFile = new $("<input name='file' type=file class='fr-upf-transparent-input' />");
            me.$inputFile.on("change", function (e, data) {
                me._onChangeInputFile.apply(me, arguments);
            });

            me.$inputFile.css({
                top: me.$browseBtn.css("marginTop"),
                left: me.$browseBtn.css("marginLeft"),
                width: me.$browseBtn.css("width"),
                height: me.$browseBtn.css("height")
            });

            me.$browseContainer.append(me.$inputFile);
        },
        _onChangeInputFile: function (e, data) {
            var me = this,
                filePath;
            
            if (forerunner.device.isMSIE()) {
                //for IE it will show the fakepath for security, so need to do a parse to get the right filename
                filePath = e.target.value.replace(/C:\\fakepath\\/i, "");
            } else if (me.$inputFile[0] && me.$inputFile[0].files && me.$inputFile[0].files[0] && me.$inputFile[0].files[0].name) {
                filePath = me.$inputFile[0].files[0].name;
            }

            me.$uploadFile.val(filePath);
        }
    }); //$.widget
});