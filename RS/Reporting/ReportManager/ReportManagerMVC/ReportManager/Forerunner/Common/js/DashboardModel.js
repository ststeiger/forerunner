// Assign or create the single globally scoped variable
var forerunner = forerunner || {};

// Forerunner SQL Server Reports
forerunner.ssr = forerunner.ssr || {};

$(function () {
    var ssr = forerunner.ssr;

    ssr.DashboardModel = function (options) {
        var me = this;
        me.options = {
            $appContainer: null,
            reportManagerAPI: forerunner.config.forerunnerAPIBase() + "ReportManager/",
            rsInstance: null
        };

        // Merge options with the default settings
        if (options) {
            $.extend(this.options, options);
        }

        me.clearState();
    };

    ssr.DashboardModel.prototype = {
        clearState: function () {
            var me = this;
            me.dashboardDef = {
                templateName: null,
                template: null,
                reports: {}
            };
        },
        fetch: function (path) {
            var me = this;
            var status = false;

            var url = me.options.reportManagerAPI + "/Resource";
            url += "?path=" + encodeURIComponent(path);
            url += "&instance=" + me.options.rsInstance;
            if (me.options.rsInstance) {
                url += "?instance=" + me.options.rsInstance;
            }

            forerunner.ajax.ajax({
                dataType: "json",
                url: url,
                async: false,
                success: function (data) {
                    me.dashboardDef = data
                    status = true;
                },
                fail: function (jqXHR) {
                    console.log("_loadResource() - " + jqXHR.statusText);
                    console.log(jqXHR);
                    forerunner.dialog.showMessageBox(me.options.$appContainer, messages.loadDashboardFailed, messages.loadDashboard);
                }
            });
            return status;
        },
        save: function (overwrite, parentFolder, dashboardName) {
            var me = this;
            var status = false;
            if (overwrite === null || overwrite === undefined) {
                overwrite = false;
            }
            var stringified = JSON.stringify(me.dashboardDef);
            var url = forerunner.config.forerunnerAPIBase() + "ReportManager/SaveResource";
            forerunner.ajax.ajax({
                type: "POST",
                url: url,
                data: {
                    resourceName: dashboardName,
                    parentFolder: encodeURIComponent(parentFolder),
                    contents: stringified,
                    mimetype: "json/forerunner-dashboard",
                    rsInstance: me.options.rsInstance
                },
                dataType: "json",
                async: false,
                success: function (data) {
                    status = true;
                },
                fail: function (jqXHR) {
                    console.log("ssr.DashboardModel.save() - " + jqXHR.statusText);
                    console.log(jqXHR);
                }
            });
            return status;
        },
        loadTemplate: function (templateName) {
            var me = this;
            var template = forerunner.localize.getLocData(forerunner.config.forerunnerFolder() + "Dashboard/dashboards/" + templateName, "text");
            me.dashboardDef.template = template;
        },

    };
});
