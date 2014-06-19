/**
 * @file Contains the forerunnerTags widget.
 *
 */

var forerunner = forerunner || {};

// Forerunner SQL Server Reports
forerunner.ssr = forerunner.ssr || {};

$(function () {
    var widgets = forerunner.ssr.constants.widgets;
    var events = forerunner.ssr.constants.events;
    var locData = forerunner.localize.getLocData(forerunner.config.forerunnerFolder() + "ReportViewer/loc/ReportViewer");

    $.widget(widgets.getFullname(widgets.forerunnerTags), {
        options: {
            $appContainer: null,
            rsInstance: null,
        },
        _create: function () {

        },
        _init: function () {
            var me = this;

            me.element.html("");
            me.element.off(events.modalDialogGenericSubmit);
            me.element.off(events.modalDialogGenericCancel);

            var headerHtml = forerunner.dialog.getModalDialogHeaderHtml('fr-icons24x24-tags', locData.tags.title, "fr-tag-cancel", locData.tags.cancel);
            var $container = new $(
                "<div class='fr-core-dialog-innerPage fr-core-center'>" +
                    headerHtml +
                    "<div class='fr-tag-form-container'>" +
                        "<form class='fr-tag-form'>" +
                            "<table class='fr-tag-table'>" +
                                "<tr>" +
                                    "<td><label class='fr-tag-label'>" + locData.tags.tags + ":</label></td>" +
                                    "<td><input type='text' class='fr-core-input fr-tag-text' /></td>" +
                                "</tr>" +
                                "<tr class='fr-tag-prompt'>" +
                                    "<td></td>" +
                                    "<td><label class='fr-tag-label-prompt'>" + locData.tags.prompt + "</label></td>" +
                                "<tr>" +
                            "</table>" +
                        "</form>" +
                    "</div>" +
                    "<div class='fr-core-dialog-submit-container'>" +
                        "<div class='fr-core-center'>" +
                            "<input name='reset' type='button' class='fr-tag-submit-id fr-tag-button fr-core-dialog-button' value='" + locData.tags.submit + "' />" +
                        "</div>" +
                        "<div class='fr-tag-location' />" +
                    "</div>" +
                "</div>");

            me.element.append($container);

            me.$tags = me.element.find(".fr-tag-text")

            me.element.find(".fr-tag-submit-id").on("click", function () {
                me._saveTags();
            });

            me.element.find(".fr-tag-cancel").on("click", function (e) {
                me.closeDialog();
            });

            me.element.on(events.modalDialogGenericSubmit, function () {
                me._saveTags();
            });

            me.element.on(events.modalDialogGenericCancel, function () {
                me.closeDialog();
            });
        },    
        openDialog: function (path) {
            var me = this;
            me._getTags(path);
           
            var text = path.substring(path.lastIndexOf("/") + 1);
            text = locData.tags.yourPosition + ": " + text;
            me.element.find(".fr-tag-location").text(text);

            forerunner.dialog.showModalDialog(me.options.$appContainer, me);
        },
        closeDialog: function () {
            var me = this;

            forerunner.dialog.closeModalDialog(me.options.$appContainer, me);
        },
        _getTags: function (path) {
            var me = this;

            if (me.path !== path) {
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
                        if (data.Tags !== "NotFound") {
                            me.tags = data.Tags.join(",");
                        }
                        else {
                            me.tags = null;
                        }
                    },
                    fail: function (data) {
                    },
                });
                me.path = path;
            }

            if (me.tags) {
                me.tags = me.tags.replace(/"/g, '');
                me.$tags.val(me.tags);
            }
        },
        _saveTags: function () {
            var me = this;

            var tags = me.$tags.val(),
                tagList;

            if (tags.trim() !== "" && tags !== me.tags) {
                tagList = tags.split(",");
                for (var i = 0; i < tagList.length; i++) {
                    tagList[i] = '"' + tagList[i].trim() + '"';
                }
                tags = tagList.join(",");
                me.tags = tags;

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
                        //bug 1078, not show succeeded dialig, instead just close current dialog
                        //forerunner.dialog.showMessageBox(me.options.$appContainer, locData.messages.addTagsSucceeded, locData.toolPane.tags);
                    },
                    fail: function (data) {
                        forerunner.dialog.showMessageBox(me.options.$appContainer, locData.messages.addTagsFailed, locData.toolPane.tags);
                    },
                    async: false
                });
            }

            me.closeDialog();
        }
    });
});