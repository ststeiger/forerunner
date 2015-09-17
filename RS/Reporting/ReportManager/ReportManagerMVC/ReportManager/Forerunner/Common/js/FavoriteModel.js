/**
 * @file Contains the widget used to add/remove item to/from favorite.
 *
 */

// Assign or create the single globally scoped variable
var forerunner = forerunner || {};

// Forerunner SQL Server Reports
forerunner.ssr = forerunner.ssr || {};

$(function () {
    var widgets = forerunner.ssr.constants.widgets;
    var events = forerunner.ssr.constants.events;
    var helper = forerunner.helper;
    var locData = forerunner.localize;

    $.widget(widgets.getFullname(widgets.favoriteModel), {
        options: {
            $appContainer: null,
            isExplorer: null,
            $toolbar: null,
            $toolpane: null,
            rsInstance: null
        },
        _constant: {
            isFavoriteApi: forerunner.config.forerunnerAPIBase() + "ReportManager/isFavorite",
            updateFavStateApi: forerunner.config.forerunnerAPIBase() + "ReportManager/UpdateView",
            plusIcon: "fr-icons24x24-favorite-plus",
            minusIcon: "fr-icons24x24-favorite-minus"
        },
        _create: function () {

        },
        _init: function () {
            var me = this;

            // if it is explorer, then put off the get step to setFavoriteState
            // the toolpane is not ready here
            !me.options.isExplorer && me._getFavBtnAndItem();
            me._bindFavClick();
        },
        /**
         * Set item favorite state by the given path.
         *
         * @function $.forerunner.favoriteModel#setFavoriteState
         */
        setFavoriteState: function(path) {
            var me = this;

            me.path = path;
            me._getFavBtnAndItem();

            forerunner.ajax.ajax({
                url: me._constant.isFavoriteApi,
                data: {
                    path: path,
                    instance: me.options.rsInstance
                },
                dataType: "json",
                async: true,
                success: function (result) {
                    // todo.. check the result return value
                    me._switchFavIcon(result.IsFavorite);
                },
                fail: function () {
                    me.$btnFav.hide();
                    me.$itemFavorite.hide();
                }
            });
        },
        _getFavBtnAndItem: function () {
            var me = this;

            if (me.options.$toolbar) {
                me.$btnFav = me.options.$toolbar.find(".fr-button-update-fav").find("div").first();
            }

            if (me.options.$toolpane) {
                me.$itemFav = me.options.$toolpane.find(".fr-item-update-fav").find("div").first();
            }
        },
        _bindFavClick: function(e, args) {
            var me = this;

            me.options.$appContainer.off("toolbar-fav-click", me._updateFavState).off("toolpane-fav-click", me._updateFavState);

            me.options.$appContainer.on("toolbar-fav-click", { me: me }, me._updateFavState);
            me.options.$appContainer.on("toolpane-fav-click", { me: me }, me._updateFavState);
        },
        _updateFavState: function (e) {
            var me = e.data.me,
                action = "add",
                $target = e.data.isToolpane ? me.$itemFav : me.$btnFav;

            if ($target.hasClass(me._constant.minusIcon)) {
                action = "delete";
            }

            forerunner.ajax.getJSON(me._constant.updateFavStateApi, {
                view: "favorites",
                action: action,
                path: me.path,
                instance: me.options.rsInstance
            }, function (result) {
                me._switchFavIcon(action === "add");
            }, function () {
                forerunner.dialog.showMessageBox(me.options.$appContainer, locData.getLocData().messages.favoriteFailed);
            });
        },
        _switchFavIcon: function (isFavorite) {
            var me = this;

            if (isFavorite) {
                me.$btnFav.addClass(me._constant.minusIcon).removeClass(me._constant.plusIcon);
                me.$itemFav.addClass(me._constant.minusIcon).removeClass(me._constant.plusIcon);
            } else {
                me.$btnFav.addClass(me._constant.plusIcon).removeClass(me._constant.minusIcon);
                me.$itemFav.addClass(me._constant.plusIcon).removeClass(me._constant.minusIcon);
            }
        }
    }); // widgets
});