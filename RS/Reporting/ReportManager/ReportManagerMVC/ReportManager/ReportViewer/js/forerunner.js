// Assign or create the single globally scoped variable
var forerunner = forerunner || {};

// Forerunner SQL Server Reports
forerunner.ssr = forerunner.ssr || {};

$(function () {
    // Constants used by SSR
    forerunner.ssr.constants = {
        // Public widgets
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
