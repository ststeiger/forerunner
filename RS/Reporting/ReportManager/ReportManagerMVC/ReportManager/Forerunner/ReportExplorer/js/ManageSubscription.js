// Assign or create the single globally scoped variable
var forerunner = forerunner || {};

// Forerunner SQL Server Reports objects
forerunner.ajax = forerunner.ajax || {};
forerunner.ssr = forerunner.ssr || {};
forerunner.ssr.constants = forerunner.ssr.constants || {};
forerunner.ssr.constants.events = forerunner.ssr.constants.events || {};

$(function () {
    var ssr = forerunner.ssr;
    var events = ssr.constants.events;
    var widgets = forerunner.ssr.constants.widgets;
    var locData = forerunner.localize.getLocData(forerunner.config.forerunnerFolder() + "/ReportViewer/loc/ReportViewer");

    $.widget(widgets.getFullname(widgets.manageSubscription), {
        options: {
            reportPath: null,
            $appContainer: null,
            $reportViewer: null,
            subscriptionModel: null
        },
        _subscriptionModel: null,
        _createDiv : function(listOfClasses) {
            return forerunner.helper.createDiv(listOfClasses);
        },
        _showDeletionFailure : function() {
            console.log("Deletion failed");
        },
        _createListItem: function (subInfo) {
            var me = this;
            var $listItem = new $("<DIV />");
            $listItem.addClass("fr-sub-listitem");
            var $deleteIcon = me._createDiv(["ui-icon-circle-close", "ui-icon"]);
            var $editIcon = me._createDiv(["ui-icon-pencil", "ui-icon"]);
            $listItem.append($deleteIcon);
            $deleteIcon.addClass("fr-sub-delete-icon");
            $deleteIcon.on("click", function () {
                me.options.subscriptionModel.subscriptionModel("deleteSubscription",
                    subInfo.SubscriptionID,
                    function () { me._renderList(); }, function () { me._showDeletionFailure(); });
            });
            $editIcon.addClass("fr-sub-edit-icon");
            $editIcon.on("click", function () {
                me._editSubscription(subInfo.SubscriptionID);
            });
            $listItem.append($editIcon);
            $listItem.append(subInfo.Description);
            return $listItem;
        },
        _editSubscription: function (subscriptionID) {
            var me = this;
            me.options.$reportViewer.reportViewer("showEmailSubscription", subscriptionID);
        },
        _renderList: function () {
            var me = this;
            me.$listcontainer.html("");
            var $list = new $("<UL />");
            $list.addClass("fr-sub-list");
            $.when(me.options.subscriptionModel.subscriptionModel("getSubscriptionList", me.options.reportPath)).done(function (data) {
                for (var i = 0; i < data.length; i++) {
                    var subInfo = data[i];
                    var $li = new $("<LI />");
                    var $listItem = me._createListItem(subInfo);
                    $li.append($listItem);
                    $list.append($li);
                }
                me.$listcontainer.append($list);
            }).fail(
                function (data) {
                    forerunner.dialog.showMessageBox(me.options.$appContainer, me.locData.messages.loadSubscriptionListFailed);
                }
            );
        },

        listSubscriptions: function () {
            var me = this;
            me.element.html("");
            me.element.off(events.modalDialogGenericSubmit);
            me.element.off(events.modalDialogGenericCancel);
            me.$container = me._createDiv(["fr-core-dialog-innerPage", "fr-core-center"]);
            var headerHtml = forerunner.dialog.getModalDialogHeaderHtml('fr-icons24x24-managesubscription', "Manage Subscription", "fr-managesubscription-cancel", "Cancel");
            me.$container.append(headerHtml);
            // Make these async calls and cache the results before they are needed.
            me.options.subscriptionModel.subscriptionModel("getSchedules");
            me.options.subscriptionModel.subscriptionModel("getDeliveryExtensions");
            me.element.append(me.$container);
            me.$listcontainer = me._createDiv(["fr-sub-list-container"]);
            me.$container.append(me.$listcontainer);
            me.$theForm = me._createDiv(["fr-sub-form"]);
            me.$container.append(me.$theForm);
            me._renderList();

            me.element.find(".fr-managesubscription-cancel").on("click", function (e) {
                me.closeDialog();
            });

            me.element.on(events.modalDialogGenericSubmit, function () {
                me._submit();
            });

            me.element.on(events.modalDialogGenericCancel, function () {
                me.closeDialog();
            });
        },

        openDialog: function () {
            var me = this;
            forerunner.dialog.showModalDialog(me.options.$appContainer, me);
        },

        closeDialog: function () {
            var me = this;
            forerunner.dialog.closeModalDialog(me.options.$appContainer, me);
        },
        destroy: function () {
            var me = this;
            me.element.html("");
            this._destroy();
        }
    });  // $.widget(
});  // $(function ()
