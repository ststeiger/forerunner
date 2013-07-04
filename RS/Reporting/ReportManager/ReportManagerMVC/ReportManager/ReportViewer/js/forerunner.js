// Assign or create the single globally scoped variable
var forerunner = forerunner || {};

// Forerunner SQL Server Reports
forerunner.ssr = forerunner.ssr || {};

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
        messages: {
            loading: "Loading...",
            completeFind: "The entire report has been searched",
            keyNotFound: "Keywork not found",
            sessionExpired: "Your session has expired",
            imageNotDisplay: "Cannot display image"
        },
        errorTag: {
            moreDetail: "Click for more detail",
            serverError: "Exception thrown from server",
            type: "Type",
            targetSite: "targetSite",
            source: "Source",
            message: "Message",
            stackTrace: "StackTrace"
        },
        exportType: {
            xml: "XML file with report data",
            csv: "CSV (comma delimited)",
            pdf: "PDF",
            mhtml: "MHTML (web archive)",
            excel: "Excel",
            tiff: "TIFF file",
            word: "Word"
        }
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
