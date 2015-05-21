// Assign or create the single globally scoped variable
var forerunner = forerunner || {};

// Forerunner SQL Server Reports
forerunner.ssr = forerunner.ssr || {};

$(function () {
    var ssr = forerunner.ssr;
    var locData = forerunner.localize.getLocData(forerunner.config.forerunnerFolder() + "ReportViewer/loc/ReportViewer");
    var messages = locData.messages;

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
            forerunner.ajax.ajax({
                dataType: "json",
                url: url,
                data: {
                    path: path,
                    instance: me.options.rsInstance,
                },
                async: false,
                success: function (data) {
                    me.dashboardDef = data;
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
            var result = {
                status: false,
                resourceName: null
            };

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
                    parentFolder: parentFolder,
                    overwrite: overwrite,
                    contents: stringified,
                    mimetype: "json/forerunner-dashboard",
                    rsInstance: me.options.rsInstance
                },
                dataType: "json",
                async: false,
                success: function (data) {
                    if (data && data.Exception) {
                        result = data;
                    }
                    else if (data && data.ResourceName) {
                        result.resourceName = data.ResourceName;
                        result.status = true;
                    }
                    
                },
                fail: function (jqXHR) {
                    result.responseJSON = jqXHR.responseJSON;
                    console.log("ssr.DashboardModel.save() - " + jqXHR.statusText);
                    console.log(jqXHR);
                }
            });
            return result;
        },
        loadTemplate: function (templateName) {
            var me = this;
            var template = forerunner.localize.getLocData(forerunner.config.forerunnerFolder() + "Dashboard/dashboards/" + templateName, "text");
            me.dashboardDef.template = template;
        },

    };
});
