/**
 * @file Contains the manage subscription widget.
 *
 */

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
    var locData = forerunner.localize.getLocData(forerunner.config.forerunnerFolder() + "ReportViewer/loc/ReportViewer");

    /**
    * Widget used to manage subscription
    *
    * @namespace $.forerunner.manageMySubscriptions
    * @prop {Object} options - The options for manageSubscription
    * @prop {String} options.reportPath - Current report path
    * @prop {Object} options.$appContainer - Report page container
    * @prop {Object} options.$reportViewer - The report viewer widget instance
    * @prop {Object} options.subscriptionModel - Subscription model instance
    *
    * @example
    * $("#subscription").manageMySubscriptions({
    *  reportPath : path
    *  $appContainer: $appContainer, 
    *  subscriptionModel : subscriptionModel,
    *  
    * });
    */
    $.widget(widgets.getFullname(widgets.manageMySubscriptions), {
        options: {
            $appContainer: null,
            $reportExplorer: null,
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
            $listItem.append(subInfo.Path + " (" + subInfo.Description + ")");
            var $deleteIcon = me._createDiv(["fr-sub-icon18x18"]);
            var $editIcon = me._createDiv(["fr-sub-icon18x18"]);
            $listItem.append($deleteIcon);
            $deleteIcon.addClass("fr-sub-delete-icon");
            $deleteIcon.attr("title", locData.subscription.deleteSubscription);
            $deleteIcon.on("click", function () {
                me.options.subscriptionModel.subscriptionModel("deleteSubscription",
                    subInfo.SubscriptionID,
                    function () { me._renderList(); }, function () { me._showDeletionFailure(); });
            });
            $editIcon.addClass("fr-sub-edit-icon");
            $editIcon.attr("title", locData.subscription.edit);
            $editIcon.on("click", function () {
                me._editSubscription(subInfo.Path, subInfo.SubscriptionID);
            });
            $listItem.append($editIcon);
            return $listItem;
        },
        _editSubscription: function (reportPath, subscriptionID) {
            var me = this;
            me.options.$reportExplorer.reportExplorer("showSubscription", reportPath, subscriptionID);
            me.closeDialog();
        },
        _renderList: function () {
            var me = this;
            me.$listcontainer.html("");
            var $list = new $("<UL />");
            $list.addClass("fr-sub-list");

            $.when(me.options.subscriptionModel.subscriptionModel("getMySubscriptionList", me.options.reportPath)).done(function (data) {
                //if no subscription in the list show the prompt
                if (data.length === 0) {
                    me.$emptyPrompt.show();
                    return;
                }
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
                    forerunner.dialog.showMessageBox(me.options.$appContainer, locData.messages.loadSubscriptionListFailed);
                }
            );
        },
        /**
         * Load subscription data and generate manage subscription UI
         *
         * @function $.forerunner.manageMySubscriptions#listSubscriptions
         *
         */
        listSubscriptions: function () {
            var me = this;

            me.element.html("");
            me.element.off(events.modalDialogGenericSubmit);
            me.element.off(events.modalDialogGenericCancel);

            me.$container = me._createDiv(["fr-core-dialog-innerPage", "fr-core-center"]);
            var headerHtml = forerunner.dialog.getModalDialogHeaderHtml("fr-icons24x24-managesubscription", locData.subscription.manageSubscription, "fr-managesubscription-cancel", locData.subscription.cancel);
            me.$container.append(headerHtml);

            // Make these async calls and cache the results before they are needed.
            me.options.subscriptionModel.subscriptionModel("getSchedules");
            me.options.subscriptionModel.subscriptionModel("getDeliveryExtensions");
            me.element.append(me.$container);

            me.$emptyPrompt = me._createDiv(["fr-sub-empty-prompt"]);
            me.$emptyPrompt.text(locData.subscription.emptyPrompt);
            me.$container.append(me.$emptyPrompt);

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
        /**
         * Open manage subscription dialog
         *
         * @function $.forerunner.manageMySubscriptions#openDialog
         */
        openDialog: function () {
            var me = this;
            forerunner.dialog.showModalDialog(me.options.$appContainer, me);
        },
        /**
         * Close manage subscription dialog
         *
         * @function $.forerunner.manageMySubscriptions#closeDialog
         */
        closeDialog: function () {
            var me = this;
            forerunner.dialog.closeModalDialog(me.options.$appContainer, me);
        },
        /**
         * Removes the manage subscription functionality completely. This will return the element back to its pre-init state.
         *
         * @function $.forerunner.manageMySubscriptions#destroy
         */
        destroy: function () {
            var me = this;
            me.element.html("");
            this._destroy();
        }
    });  // $.widget(
});  // $(function ()
