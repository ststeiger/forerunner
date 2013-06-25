var forerunner = forerunner || {};

forerunner.CatalogItemsModel = function (options) {
    this.options = {
        url : null,
    };

    // Merge options with the default settings
    if (options) {
        $.extend(this.options, options);
    }
};

forerunner.CatalogItemsModel.prototype = {
    fetch: function (options) {
        $.ajax({
            dataType: "json",
            url: this.options.url,
            success: options.success,
            error: options.error,
        });
    }
};

// View can be null, favorites, or recent
forerunner.CatalogItemsModel.getCatalogItemUrl = function(view, path) {
    if (view != null) {
        return 'ReportManager/GetItems?view=' + view + '&path='; 
    }

    if (path == null) path = "/";
    return 'ReportManager/GetItems?view=catalog&path=' + path;
};

