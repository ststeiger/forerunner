/**
 * @file Contains the reportExplorerSearchFolder widget.
 *
 */

var forerunner = forerunner || {};

// Forerunner SQL Server Reports
forerunner.ssr = forerunner.ssr || {};

$(function () {
    var widgets = forerunner.ssr.constants.widgets;
    var events = forerunner.ssr.constants.events;
    var locData = forerunner.localize.getLocData(forerunner.config.forerunnerFolder() + "ReportViewer/loc/ReportViewer");

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

            var headerHtml = forerunner.dialog.getModalDialogHeaderHtml('fr-icons24x24-searchfolder', locData.searchFolder.title, "fr-sf-cancel", "");
            var $container = new $(
                "<div class='fr-core-dialog-innerPage fr-core-center'>" +
                    headerHtml +
                   "<div class='fr-sf-form-container'>" +
                        "<form class='fr-sf-form'>" +
                            "<table class='fr-sf-table'>" +
                                "<tr>" +
                                    "<td><label class='fr-sf-label'>" + locData.searchFolder.name + ":</label></td>" +
                                    "<td><input type='text' class='fr-sf-text fr-sf-foldername' name='foldername' required='true' /></td>" +
                                "</tr>" +
                                "<tr>" +
                                    "<td><label class='fr-sf-label'>" + locData.searchFolder.tags + ":</label></td>" +
                                    "<td><input type='text' class='fr-sf-text fr-sf-foldertags' name='tags' required='true' /></td>" +
                                "</tr>" +
                                "<tr class='fr-sf-prompt'>" +
                                    "<td></td>" +
                                    "<td><label class='fr-sf-label-prompt'>" + locData.searchFolder.prompt + "</label></td>" +
                                "<tr>" +
                            "</table>" +
                        "</form>" +
                    "</div>" +
                    "<div class='fr-core-dialog-submit-container'>" +
                        "<div class='fr-core-center'>" +
                            "<input type='button' class='fr-sf-submit-id fr-sf-button fr-core-dialog-button' value='" + locData.searchFolder.submit + "' />" +
                        "</div>" +
                        "<div class='fr-sf-location' />" +
                    "</div>" +
                "</div>");

            me.element.append($container);

            me.$form = $container.find(".fr-sf-form");
            me.$form.validate({
                errorPlacement: function (error, element) {
                    error.appendTo(element.parent("td"));
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
                var name = me.element.find(".fr-sf-foldername").val().trim();
                var tags = me.element.find(".fr-sf-foldertags").val().trim();
                var tagsList = tags.split(",");

                for (var i = 0; i < tagsList.length; i++) {
                    tagsList[i] = '"' + tagsList[i].trim() + '"';
                }

                var searchfolder = { searchFolderName: name, content: { name: name, tags: tagsList.join(",") } };

                me.options.$reportExplorer.reportExplorer("createSearchFolder", searchfolder);
                me.closeDialog();
            }
        },
        openDialog: function () {
            var me = this;
            var content = me.options.$reportExplorer.reportExplorer("getSearchFolderContent");
            if (content) {
                content = JSON.parse(content);//replace(/"/g, '')
                me.element.find(".fr-sf-foldername").val(content.name)
                me.element.find(".fr-sf-foldertags").val(content.tags.replace(/"/g, ''));
            }
            else {
                me.element.find(".fr-sf-foldername").val("")
                me.element.find(".fr-sf-foldertags").val("");
            }

            var path = me.options.$reportExplorer.reportExplorer("getCurrentPath");
            var location;
            if (path === "/") {
                location = locData.searchFolder.homePage;
            }
            else {
                location = path.substring(path.lastIndexOf("/") + 1);
            }
            location = locData.searchFolder.createTo + ": " + location;
            me.element.find(".fr-sf-location").text(location);

            forerunner.dialog.showModalDialog(me.options.$appContainer, me);
        },
        closeDialog: function () {
            var me = this;

            forerunner.dialog.closeModalDialog(me.options.$appContainer, me);
        },
    });   
});