// Assign or create the single globally scoped variable
var forerunner = forerunner || {};

// Forerunner SQL Server Reports
forerunner.ssr = forerunner.ssr || {};
jQuery.fn.extend({
    slideRightShow: function (delay) {
        return this.each(function () {
            $(this).show("slide", { direction: "right", easing: "easeInCubic" }, delay);
        });
    },
    slideLeftHide: function (delay) {
        return this.each(function () {
            $(this).hide("slide", { direction: "left", easing: "easeOutCubic" }, delay);
        });
    },
    slideRightHide: function (delay) {
        return this.each(function () {
            $(this).hide("slide", { direction: "right", easing: "easeOutCubic" }, delay);
        });
    },
    slideLeftShow: function (delay) {
        return this.each(function () {
            $(this).show("slide", { direction: "left", easing: "easeInCubic" }, delay);
        });
    }    
});
$(function () {
    // Constants used by SSR
    forerunner.ssr.constants = {
        widgets: {
            // widget names
            reportExplorer: "reportExplorer",
            reportExplorerToolbar: "reportExplorerToolbar",
            pageNav: "pageNav",
            reportDocumentMap: "reportDocumentMap",
            reportParameter: "reportParameter",
            reportRender: "reportRender",
            reportViewer: "reportViewer",
            reportViewerEZ: "reportViewerEZ",
            toolbar: "toolbar",
            toolBase: "toolBase",
            toolPane: "toolPane",

            // Forerunner widget namespace
            namespace: "forerunner",

            // Get the <namespace>.<name> for the widget
            getFullname: function (name) {
                return this.namespace + "." + name;
            }
        },
        events: {
            // toolPane
            actionStarted: "actionstarted",
            toolPaneActionStarted: function () { return forerunner.ssr.constants.widgets.toolPane.toLowerCase() + this.actionStarted; },

            // toolbar
            menuClick: "menuclick",
            toolbarMenuClick: function () { return (forerunner.ssr.constants.widgets.toolbar + this.menuClick).toLowerCase(); },

            paramAreaClick: "paramareaclick",
            toolbarParamAreaClick: function () { return (forerunner.ssr.constants.widgets.toolbar + this.paramAreaClick).toLowerCase(); },

            // reportViewer
            setPageDone: "setPageDone",
            reportViewerSetPageDone: function () { return (forerunner.ssr.constants.widgets.reportViewer + this.setPageDone).toLowerCase(); },

            changePage: "changepage",
            reportViewerChangePage: function () { return (forerunner.ssr.constants.widgets.reportViewer + this.changePage).toLowerCase(); },

            drillBack: "drillback",
            reportViewerDrillBack: function () { return (forerunner.ssr.constants.widgets.reportViewer + this.drillBack).toLowerCase(); },

            back: "back",
            reportViewerBack: function () { return (forerunner.ssr.constants.widgets.reportViewer + this.back).toLowerCase(); },

            showParamArea: "showparamarea",
            reportViewerShowParamArea: function () { return (forerunner.ssr.constants.widgets.reportViewer + this.showParamArea).toLowerCase(); },

            // reportParameter
            render: "render",
            reportParameterRender: function () { return (forerunner.ssr.constants.widgets.reportParameter + this.render).toLowerCase(); },

            submit: "submit",
            reportParameterSubmit: function () { return (forerunner.ssr.constants.widgets.reportParameter + this.submit).toLowerCase(); },
        },
        // Tool types used by the Toolbase widget
        toolTypes: {
            button: "button",
            input: "input",
            textButton: "textbutton",
            plainText: "plaintext",
            containerItem: "containeritem",
            toolGroup: "toolgroup"
        },
        sortDirection: {
            desc: "Descending",
            asc: "Ascending"
        },
        navigateType: {
            toggle: "toggle",
            bookmark: "bookmark",
            drillThrough: "drillthrough",
            docMap: "documentMap",
        },
    };

    forerunner.localize = {
        _locData: {},
        getLocData: function(locFolder, app){
            var lang = navigator.language || navigator.userLanguage;
            var langData = this._loadFile(locFolder, app, lang);

            if (langData === null)
                langData = this._loadFile(locFolder, app, "en-us");

            return langData;
            
        },
        _loadFile: function (locFolder, app, lang) {
            var me = this;
            if (me._locData[locFolder] === undefined)
                me._locData[locFolder] = {};
            if (me._locData[locFolder][app] === undefined)
                me._locData[locFolder][app] = {};
            if (me._locData[locFolder][app][lang] === undefined) {
                $.ajax({
                    url: locFolder + app + "-" + lang + ".txt",
                    dataType: "json",
                    async: false,
                    success: function (data) {
                        me._locData[locFolder][app][lang] = data;
                    },
                    fail: function () {
                        me._locData[locFolder][app][lang] = null;
                    }
                });

            }
            return me._locData[locFolder][app][lang];
        },

    };
    // device contains all externally available helper methods related to the device
    forerunner.device = {
        isTouch: function () {
            var ua = navigator.userAgent;
            return !!("ontouchstart" in window) // works on most browsers
                || !!("onmsgesturechange" in window) || ua.match(/(iPhone|iPod|iPad)/)
                || ua.match(/BlackBerry/) || ua.match(/Android/); // works on ie10
        }

    };
    
});
