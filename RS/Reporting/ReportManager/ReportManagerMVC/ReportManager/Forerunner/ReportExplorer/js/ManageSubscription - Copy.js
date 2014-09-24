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
            $appContainer: null
        },
        _subscriptionModel: null,
        _createDiv : function(listOfClasses) {
            return forerunner.helper.createDiv(listOfClasses);
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
                //me._subscriptionModel.subscriptionModel("deleteSubscription", subInfo.SubscriptionID);
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
            var subDetails = me._subscriptionModel.subscriptionModel("getSubscription", subscriptionID);
            // Instantiate the control here
            me.$theForm.reportDeliveryOptions({
                reportPath: me.options.reportPath,
                $appContainer: me.options.$appContainer,
                subscriptionModel: me._subscriptionModel,
                subscriptionID: subscriptionID,
                subDetails: subDetails
            });
        },
        _addSubscription : function() {
            // Instantiate the control here
            var me = this;
            me.$theForm.reportDeliveryOptions({
                reportPath: me.options.reportPath,
                $appContainer: me.options.$appContainer,
                subscriptionModel: me._subscriptionModel,
                subscriptionID: null,
                subDetails: null
            });
        },
        _renderList: function () {
            var me = this;
            var $list = new $("<UL />");
            $list.addClass("fr-sub-list");
            var result = me._subscriptionModel.subscriptionModel("getSubscriptionList", me.options.reportPath);
            $.when(result).done(function (data) {
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
        _create: function () {
            var me = this;
            me._subscriptionModel = $({}).subscriptionModel();
            // Make these async calls and cache the results before they are needed.
            me._subscriptionModel.subscriptionModel("getSchedules");
            me._subscriptionModel.subscriptionModel("getDeliveryExtensions");
            me.$container = me._createDiv(["fr-sub-container"]);
            me.element.append(me.$container);
            me.$listcontainer = me._createDiv(["fr-sub-list-container"]);
            me.$container.append(me.$listcontainer);
            me.$theForm = me._createDiv(["fr-sub-form"]);
            me.$container.append(me.$theForm);
            me._renderList();
        },
    });  // $.widget(
});  // $(function ()
