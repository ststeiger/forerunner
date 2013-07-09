// Assign or create the single globally scoped variable
var forerunner = forerunner || {};

// Forerunner SQL Server Reports
forerunner.ssr = forerunner.ssr || {};

forerunner.ssr.CatalogItemsModel = function (options) {
    this.options = {
        url : null,
    };

    // Merge options with the default settings
    if (options) {
        $.extend(this.options, options);
    }
};

forerunner.ssr.CatalogItemsModel.prototype = {
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
forerunner.ssr.CatalogItemsModel.getCatalogItemUrl = function(view, path) {
    if (view) {
        return "ReportManager/GetItems?view=" + view + "&path=";
    }

    if (!path) path = "/";
    return "ReportManager/GetItems?view=catalog&path=" + path;
};

