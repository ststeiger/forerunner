// Assign or create the single globally scoped variable
var forerunner = forerunner || {};

// Forerunner SQL Server Reports
forerunner.ssr = forerunner.ssr || {};

forerunner.ssr.CatalogItemsView = function (options) {
    this.options = {
        $toolbar: null,
        $explorerview: null,
        url: null,
        path: null,
        data: null,
        selectedItemPath: null,
        navigateTo: null
    };

    // Merge options with the default settings
    if (options) {
        $.extend(this.options, options);
    }
};

forerunner.ssr.CatalogItemsView.prototype = {
    _renderToolbar: function () {
        var me = this;
        var $toolbar = me.options.$toolbar;
        if ($toolbar != null) $toolbar.reportexplorertoolbar({ navigateTo: me.options.navigateTo });
    },
    _renderExplorer : function() {
        var me = this;
        $explorerview = me.options.$explorerview;

        if ($explorerview != null) {
            $explorerview.reportexplorer({
                path: me.options.path,
                catalogItems: me.options.data,
                url: me.options.url,
                selectedItemPath: me.options.selectedItemPath,
                navigateTo: me.options.navigateTo
            });
            $explorerview.reportexplorer('initCarousel');
        }
    },
    render: function (options) {
        var me = this;
        me._renderToolbar();
        me._renderExplorer();
    }
};

forerunner.ssr.CatalogItemsView.fetchModelAndRenderView = function (options) {
    var model = new forerunner.ssr.CatalogItemsModel({ url: options.catalogItemUrl });
    model.fetch({
        success: function (data) {
            var view = new forerunner.ssr.CatalogItemsView({
                $toolbar: options.$toolbar,
                $explorerview: options.$explorerview,
                url: options.reportManagerAPIUrl,
                path: options.path,
                data: data,
                selectedItemPath: options.selectedItemPath,
                navigateTo: options.navigateTo
            });
            view.render();
        },
        error: function (data) {
            console.log(data);
            alert('Failed to load the catalogs from the server.  Please try again.');
        }
    })
};