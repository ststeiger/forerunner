///#source 1 1 /Forerunner/Common/js/forerunner.js
/**
 * @file
 *  Defines forerunner SDK specific namespace
 *
 */

/** 
 * Alias used for the jquery namespace
 * @namespace $
 */

/**
 * Defines all jquery based, forerunner widgets
 * @namespace $.forerunner
 */

/**
 * Top level object that defines the forerunner SDK
 *
 * @namespace
 */
var forerunner = forerunner || {};
var moment = moment || {};

/**
 * Contains the SQL Server Report data
 *
 * @namespace
 */
forerunner.ssr = forerunner.ssr || {};

if (!String.prototype.format) {
    String.prototype.format = function () {
        var args = arguments;
        return this.replace(/{(\d+)}/g, function (match, number) {
            return typeof args[number] !== "undefined"
              ? args[number]
              : match
            ;
        });
    };
}

jQuery.fn.extend({
    slideRightShow: function (delay) {
        return this.each(function () {
            $(this).show("slide", { direction: "right", easing: "easeInCubic" }, delay);
        });
    },
    slideDownShow: function (delay) {
        return this.each(function () {
            $(this).show("slide", { direction: "down", easing: "easeInCubic" }, delay);
        });
    },
    slideDownHide: function (delay) {
        return this.each(function () {
            $(this).hide("slide", { direction: "down", easing: "easeInCubic" }, delay);
        });
    },
    slideUpShow: function (delay) {
        return this.each(function () {
            $(this).show("slide", { direction: "up", easing: "easeInCubic" }, delay);
        });
    },
    slideUpHide: function (delay) {
        return this.each(function () {
            $(this).hide("slide", { direction: "up", easing: "easeInCubic" }, delay);
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
    },
    mask: function (onClick, maskHeight, maskWidth) {
        var $mask = $(this).find(".fr-core-mask");

        if ($mask.length === 0) {
            $mask = $("<div class='fr-core-mask'></div>");
            $(this).append($mask);
        }

        if (maskHeight) {
            $mask.height(maskHeight);
        }
        else {
            $mask.height($(this).height());
        }

        if (maskWidth) {
            $mask.width(maskWidth);
        }
        else {
            $mask.width($(this).width());
        }

        if (onClick && typeof onClick === "function") {
            $mask.on("click", onClick);
        }

        return $(this);
    },
    unmask: function (onClick) {
        var $mask = $(this).find(".fr-core-mask");

        if ($mask.length === 0) {
            return $(this);
        }

        if (onClick && typeof onClick === "function") {
            $mask.on("click", onClick);
        }

        $mask.remove();

        return $(this);
    },
    multiLineEllipsis: function () {
        return this.each(function () {
            var el = $(this);

            if (el.css("overflow") === "hidden") {
                var text = el.html();
                var clone = $(this.cloneNode(true)).hide().css("position", "absolute").css("overflow", "visible").width(el.width()).height("auto");
                el.after(clone);

                var height = function () {
                    return clone.height() > el.height();
                };

                if (height()) {
                    var myElipse = " ...";
                    clone.html(text);
                    var suggestedCharLength = parseInt(text.length * el.height() / clone.height(), 10);
                    clone.html(text.substr(0, suggestedCharLength) + myElipse);
                    
                    var x = 1;
                    if (height()) {
                        do {
                            clone.html(text.substr(0, suggestedCharLength - x) + myElipse);
                            x++;
                        }
                        while (height());
                    }
                    else {
                        do {
                            clone.html(text.substr(0, suggestedCharLength + x) + myElipse);
                            x++;
                        }
                        while (!height());
                        x -= 2;
                        clone.html(text.substr(0, suggestedCharLength + x) + myElipse);
                    }
                    
                    el.html(clone.html());
                }
                clone.remove();
            }
        });
    },
    visible:function(partial,hidden,direction){
        var $w = $(window);
        if (this.length < 1)
            return;

        var $t        = this.length > 1 ? this.eq(0) : this,
            t         = $t.get(0),
            vpWidth   = $w.width(),
            vpHeight  = $w.height(),            
            clientSize = hidden === true ? t.offsetWidth * t.offsetHeight : true;

        direction = (direction) ? direction : "both";

        if (typeof t.getBoundingClientRect === "function"){

            // Use this native browser method, if available.
            var rec = t.getBoundingClientRect(),
                tViz = rec.top    >= 0 && rec.top    <  vpHeight,
                bViz = rec.bottom >  0 && rec.bottom <= vpHeight,
                lViz = rec.left   >= 0 && rec.left   <  vpWidth,
                rViz = rec.right  >  0 && rec.right  <= vpWidth,
                vVisible   = partial ? tViz || bViz : tViz && bViz,
                hVisible   = partial ? lViz || lViz : lViz && rViz;

            if(direction === "both")
                return clientSize && vVisible && hVisible;
            else if(direction === "vertical")
                return clientSize && vVisible;
            else if(direction === "horizontal")
                return clientSize && hVisible;
        } else {

            var viewTop         = $w.scrollTop(),
                viewBottom      = viewTop + vpHeight,
                viewLeft        = $w.scrollLeft(),
                viewRight       = viewLeft + vpWidth,
                offset          = $t.offset(),
                _top            = offset.top,
                _bottom         = _top + $t.height(),
                _left           = offset.left,
                _right          = _left + $t.width(),
                compareTop      = partial === true ? _bottom : _top,
                compareBottom   = partial === true ? _top : _bottom,
                compareLeft     = partial === true ? _right : _left,
                compareRight    = partial === true ? _left : _right;

            if(direction === "both")
                return !!clientSize && ((compareBottom <= viewBottom) && (compareTop >= viewTop)) && ((compareRight <= viewRight) && (compareLeft >= viewLeft));
            else if(direction === "vertical")
                return !!clientSize && ((compareBottom <= viewBottom) && (compareTop >= viewTop));
            else if(direction === "horizontal")
                return !!clientSize && ((compareRight <= viewRight) && (compareLeft >= viewLeft));
        }
    },
    
    findUntil: function (selector, until) {
        
        var coll = [];
        this.addUntil(until, coll);

        return $(coll).filter(selector);
    },

    addUntil: function (until, collection) {

        var children = this.children().filter(":not( " + until + ")");

        $.each(children, function (Index, Obj) {
            collection.push(Obj);
            $(Obj).addUntil(until, collection);
        });
    },
    visibleSize : function() {
        var ret = {};

        var elBottom, elTop, scrollBot, scrollTop, visibleBottom, visibleTop;        
        scrollTop = $(window).scrollTop();
        scrollBot = scrollTop + $(window).height();
        elTop = this.offset().top;
        elBottom = elTop + this.outerHeight();
        visibleTop = elTop < scrollTop ? scrollTop : elTop;
        visibleBottom = elBottom > scrollBot ? scrollBot : elBottom;
        ret.height = visibleBottom - visibleTop;

        //13 is scrollbar width
        if (ret.height < this.height())
            ret.height += -13;

        var elLeft, elRight, scrollLeft, scrollRight, visibleLeft, visibleRight;
        scrollLeft = $(window).scrollLeft();
        scrollRight = scrollLeft + $(window).width();
        elLeft = this.offset().left;
        elRight = elLeft + this.outerWidth();
        visibleLeft = elLeft < scrollLeft ? scrollLeft : elLeft;
        visibleRight = elRight > scrollRight ? scrollRight : elRight;
        ret.width = visibleRight - visibleLeft;

        //13 is scrollbar width
        if (ret.width < this.width())
            ret.width += -13;

        return ret;
    }

});
$(function () {
    /**
     * Defines all the constants needed to use the ssr SDK.
     *
     * @namespace
     */
    forerunner.ssr.constants = {
        /**
         * Defines all the widget names available in the ssr SDK
         *
         * @namespace
         */
        widgets: {
            /** @constant */
            reportExplorer: "reportExplorer",
            /** @constant */
            reportExplorerEZ: "reportExplorerEZ",
            /** @constant */
            pageNav: "pageNav",
            /** @constant */
            reportDocumentMap: "reportDocumentMap",
            /** @constant */
            reportParameter: "reportParameter",
            /** @constant */
            reportRender: "reportRender",
            /** @constant */
            reportViewer: "reportViewer",
            /** @constant */
            reportViewerEZ: "reportViewerEZ",
            /** @constant */
            toolbar: "toolbar",
            /** @constant */
            toolBase: "toolBase",
            /** @constant */
            toolPane: "toolPane",
            /** @constant */
            reportPrint: "reportPrint",
            /** @constant */
            reportRDLExt: "reportRDLExt",          
            /** @constant */
            userSettings: "userSettings",
            /** @constant */
            messageBox: "messageBox",
            /** @constant */
            leftToolbar: "leftToolbar",
            /** @constant */
            rightToolbar: "rightToolbar",
            /** @constant */
            manageParamSets: "manageParamSets",
            /** @constant */
            parameterModel: "parameterModel",
            /** @constant */
            dsCredential: "dsCredential",
            /** @constant */
            subscriptionModel: "subscriptionModel",
            /** @constant */
            manageSubscription: "manageSubscription",
            /** @constant */
            manageMySubscriptions: "manageMySubscriptions",
            /** @constant */
            reportDeliveryOptions: "reportDeliveryOptions",
            /** @constant */
            subscriptionProcessingOptions: "subscriptionProcessingOptions",
            /** @constant */
            emailSubscription: "emailSubscription",
            /** @constant */
            reportExplorerToolbar: "reportExplorerToolbar",
            /** @constant */
            reportExplorerToolpane: "reportExplorerToolpane",
            /** @constant */
            unzoomToolbar: "unzoomToolbar",
            /** @constant */
            router: "router",
            /** @constant */
            history: "history",
            /** @constant */
            createDashboard: "createDashboard",
            /** @constant */
            dashboardEditor: "dashboardEditor",
            /** @constant */
            dashboardViewer: "dashboardViewer",
            /** @constant */
            reportProperties: "reportProperties",
            /** @constant */
            dashboardEZ: "dashboardEZ",
            /** @constant */
            dashboardToolbar: "dashboardToolbar",
            /** @constant */
            dashboardToolPane: "dashboardToolPane",
            /** @constant */
            forerunnerTags: "forerunnerTags",
            /** @constant */
            reportExplorerSearchFolder: "reportExplorerSearchFolder",
            /** @constant */
            forerunnerProperties: "forerunnerProperties",
            /** @constant */
            contextMenuBase: "contextMenuBase",
            /** @constant */
            reportExplorerContextMenu: "reportExplorerContextMenu",
            /** @constant */
            forerunnerSecurity: "forerunnerSecurity",
            /** @constant */
            forerunnerLinkedReport: "forerunnerLinkedReport",
            /** @constant */
            catalogTree: "catalogTree",
            /** @constant */
            viewerBase: "viewerBase",
            /** @constant */
            dialogBase: "dialogBase",
            /** @constant */
            uploadFile: "uploadFile",
            /** @constant */
            newFolder: "newFolder",
            /** @constant */
            forerunnerMoveItem: "forerunnerMoveItem",
            /** @constant */
            favoriteModel: "favoriteModel",
            /** @constant */
            paramSetMenu: "paramSetMenu",
            /** @constant */
            namespace: "forerunner",

            /**
             * @param {String} name of the widget.
             * @return {String} The fully qualified widget name (I.e., namespace.widgetname)
             */
            getFullname: function (name) {
                return this.namespace + "." + name;
            },
            _getDataName: function (name) {
                return this.namespace + name.substr(0, 1).toUpperCase() + name.substr(1);
            },
            /**
             * @param {Function} $element - jQuery selector function to test
             * @param {String} name - Name of the widget
             *
             * @return {Bool} true = $element has the widget defined
             */
            hasWidget: function ($element, name) {
                var dataName = this._getDataName(name);
                if ($element && $element.data() && $element.data()[dataName]) {
                    return true;
                }
                return false;
            },
        },
        /** 
         * Defines the event name constant used to trigger the event as well as the fully qualified event name
         * function (widget + event, lowercase). The fully qualified name is used to bind to the event.
         *
         * @namespace
         */
        events: {
            /** @constant */
            actionStarted: "actionstarted",
            /** widget + event, lowercase */
            toolPaneActionStarted: function () { return forerunner.ssr.constants.widgets.toolPane.toLowerCase() + this.actionStarted; },
            /** widget + event, lowercase */
            reportExplorerToolPaneActionStarted: function () { return forerunner.ssr.constants.widgets.reportExplorerToolpane.toLowerCase() + this.actionStarted; },
            /** widget + event, lowercase */
            dashboardToolPaneActionStarted: function () { return forerunner.ssr.constants.widgets.dashboardToolPane.toLowerCase() + this.actionStarted; },


            /** @constant */
            allowZoom: "allowZoom",
            /** widget + event, lowercase */
            reportViewerallowZoom: function () { return (forerunner.ssr.constants.widgets.reportViewer + this.allowZoom).toLowerCase(); },

            /** @constant */
            menuClick: "menuclick",
            /** widget + event, lowercase */
            toolbarMenuClick: function () { return (forerunner.ssr.constants.widgets.toolbar + this.menuClick).toLowerCase(); },
            /** widget + event, lowercase */
            leftToolbarMenuClick: function () { return (forerunner.ssr.constants.widgets.leftToolbar + this.menuClick).toLowerCase(); },
            /** widget + event, lowercase */
            reportExplorerToolbarMenuClick: function () { return (forerunner.ssr.constants.widgets.reportExplorerToolbar + this.menuClick).toLowerCase(); },
            /** widget + event, lowercase */
            dashboardToolbarMenuClick: function () { return (forerunner.ssr.constants.widgets.dashboardToolbar + this.menuClick).toLowerCase(); },

            /** @constant */
            beforeFetch: "beforefetch",
            /** @constant */
            afterFetch: "afterfetch",
            /** widget + event, lowercase */
            reportExplorerBeforeFetch: function () { return (forerunner.ssr.constants.widgets.reportExplorer + this.beforeFetch).toLowerCase(); },
            /** widget + event, lowercase */
            reportExplorerAfterFetch: function () { return (forerunner.ssr.constants.widgets.reportExplorer + this.afterFetch).toLowerCase(); },

            /** @constant */
            paramAreaClick: "paramareaclick",
            /** @constant */
            paramAreaClickTop: "paramareaclicktop",
            /** widget + event, lowercase */
            toolbarParamAreaClick: function () { return (forerunner.ssr.constants.widgets.toolbar + this.paramAreaClick).toLowerCase(); },
            /** widget + event, lowercase */
            rightToolbarParamAreaClick: function () { return (forerunner.ssr.constants.widgets.rightToolbar + this.paramAreaClick).toLowerCase(); },

            /** @constant */
            setPageDone: "setPageDone",
            /** widget + event, lowercase */
            reportViewerSetPageDone: function () { return (forerunner.ssr.constants.widgets.reportViewer + this.setPageDone).toLowerCase(); },

            /** @constant */
            changePage: "changepage",
            /** widget + event, lowercase */
            reportViewerChangePage: function () { return (forerunner.ssr.constants.widgets.reportViewer + this.changePage).toLowerCase(); },

            /** @constant */
            drillThrough: "drillThrough",
            /** widget + event, lowercase */
            reportViewerDrillThrough: function () { return (forerunner.ssr.constants.widgets.reportViewer + this.drillThrough).toLowerCase(); },

            /** @constant */
            back: "back",
            /** widget + event, lowercase */
            reportViewerBack: function () { return (forerunner.ssr.constants.widgets.reportViewer + this.back).toLowerCase(); },

            /** @constant */
            refresh: "refresh",
            /** widget + event, lowercase */
            reportViewerRefresh: function () { return (forerunner.ssr.constants.widgets.reportViewer + this.refresh).toLowerCase(); },

            /** @constant */
            actionHistoryPop: "actionHistoryPop",
            /** widget + event, lowercase */
            reportViewerActionHistoryPop: function () { return (forerunner.ssr.constants.widgets.reportViewer + this.actionHistoryPop).toLowerCase(); },

            /** @constant */
            changeReport: "changeReport",
            /** widget + event, lowercase */
            reportViewerChangeReport: function () { return (forerunner.ssr.constants.widgets.reportViewer + this.changeReport).toLowerCase(); },

            /** @constant */
            actionHistoryPush: "actionHistoryPush",
            /** widget + event, lowercase */
            reportViewerActionHistoryPush: function () { return (forerunner.ssr.constants.widgets.reportViewer + this.actionHistoryPush).toLowerCase(); },

            /** @constant */
            showNav: "showNav",
            /** widget + event, lowercase */
            reportViewerShowNav: function () { return (forerunner.ssr.constants.widgets.reportViewer + this.showNav).toLowerCase(); },

            /** @constant */
            showDocMap: "showDocMap",
            /** widget + event, lowercase */
            reportViewerShowDocMap: function () { return (forerunner.ssr.constants.widgets.reportViewer + this.showDocMap).toLowerCase(); },

            /** @constant */
            hideDocMap: "hideDocMap",
            /** widget + event, lowercase */
            reportViewerHideDocMap: function () { return (forerunner.ssr.constants.widgets.reportViewer + this.hideDocMap).toLowerCase(); },

            /** @constant */
            showParamArea: "showparamarea",
            /** widget + event, lowercase */
            reportViewerShowParamArea: function () { return (forerunner.ssr.constants.widgets.reportViewer + this.showParamArea).toLowerCase(); },

            /** @constant */
            navToPosition: "navToPosition",
            /** widget + event, lowercase */
            reportViewerNavToPosition: function () { return (forerunner.ssr.constants.widgets.reportViewer + this.navToPosition).toLowerCase(); },

            /** @constant */
            loadCascadingParam: "loadcascadingparam",
            /** widget + event, lowercase */
            reportParameterLoadCascadingParam: function () { return (forerunner.ssr.constants.widgets.reportParameter + this.loadCascadingParam).toLowerCase(); },

            /** @constant */
            render: "render",
            /** widget + event, lowercase */
            reportParameterRender: function () { return (forerunner.ssr.constants.widgets.reportParameter + this.render).toLowerCase(); },

            /** @constant */
            submit: "submit",
            /** widget + event, lowercase */
            reportParameterSubmit: function () { return (forerunner.ssr.constants.widgets.reportParameter + this.submit).toLowerCase(); },

            /** @constant */
            cancel: "cancel",
            /** widget + event, lowercase */
            reportParameterCancel: function () { return (forerunner.ssr.constants.widgets.reportParameter + this.cancel).toLowerCase(); },

            /** @constant */
            showPane: "showPane",
            /** widget + event, lowercase */
            reportViewerShowPane: function () { return (forerunner.ssr.constants.widgets.reportViewer + this.showPane).toLowerCase(); },

            /** @constant */
            hidePane: "hidePane",
            /** widget + event, lowercase */
            reportViewerHidePane: function () { return (forerunner.ssr.constants.widgets.reportViewer + this.hidePane).toLowerCase(); },

            /** @constant */
            showModalDialog: "showModalDialog",

            /** @constant */
            closeModalDialog: "closeModalDialog",

            /** @constant */
            modalDialogGenericSubmit: "modalDialogGenericSubmit",

            /** @constant */
            modalDialogGenericCancel: "modalDialogGenericCancel",

            /** @constant */
            modelChanged: "changed",
            /** widget + event, lowercase */
            parameterModelChanged: function () { return (forerunner.ssr.constants.widgets.parameterModel + this.modelChanged).toLowerCase(); },

            /** @constant */
            modelSetChanged: "setchanged",
            parameterModelSetChanged: function () { return (forerunner.ssr.constants.widgets.parameterModel + this.modelSetChanged).toLowerCase(); },

            /** @constant */
            showCredential: "showCredential",
            /** widget + event, lowercase */
            reportViewerShowCredential: function () { return (forerunner.ssr.constants.widgets.reportViewer + this.showCredential).toLowerCase(); },

            /** @constant */
            resetCredential: "resetCredential",
            /** widget + event, lowercase */
            reportViewerResetCredential: function () { return (forerunner.ssr.constants.widgets.reportViewer + this.resetCredential).toLowerCase(); },

            /** @constant */
            renderError: "renderError",
            /** widget + event, lowercase */
            reportViewerRenderError: function () { return (forerunner.ssr.constants.widgets.reportViewer + this.renderError).toLowerCase(); },

            /** @constant */
            preLoadReport: "preLoadReport",
            /** widget + event, lowercase */
            reportViewerPreLoadReport: function () { return (forerunner.ssr.constants.widgets.reportViewer + this.preLoadReport).toLowerCase(); },

            /** @constant */
            preLoadPage: "preLoadPage",
            /** widget + event, lowercase */
            reportViewerPreLoadPage: function () { return (forerunner.ssr.constants.widgets.reportViewer + this.preLoadPage).toLowerCase(); },

            /** @constant */
            afterLoadReport: "afterLoadReport",
            /** widget + event, lowercase */
            reportViewerAfterLoadReport: function () { return (forerunner.ssr.constants.widgets.reportViewer + this.afterLoadReport).toLowerCase(); },

            /** @constant */
            subscriptionFormInit: "subscriptionFormInit",
            /** widget + event, lowercase */
            reportViewersubscriptionFormInit: function () { return (forerunner.ssr.constants.widgets.reportViewer + this.subscriptionFormInit).toLowerCase(); },

            /** @constant */
            find: "find",
            /** widget + event, lowercase */
            reportViewerFind: function () { return (forerunner.ssr.constants.widgets.reportViewer + this.find).toLowerCase(); },

            /** @constant */
            findDone: "finddone",
            /** widget + event, lowercase */
            reportViewerFindDone: function () { return (forerunner.ssr.constants.widgets.reportViewer + this.findDone).toLowerCase(); },

            /** @constant */
            route: "route",
            /** widget + event, lowercase */
            routerRoute: function () { return (forerunner.ssr.constants.widgets.router + this.route).toLowerCase(); },
            /** widget + event, lowercase */
            historyRoute: function () { return (forerunner.ssr.constants.widgets.history + this.route).toLowerCase(); },

            /** @constant */
            close: "close",
            /** widget + event, lowercase */
            reportPropertiesClose: function () { return (forerunner.ssr.constants.widgets.reportProperties + this.close).toLowerCase(); },
            /** widget + event, lowercase */
            userSettingsClose: function () { return (forerunner.ssr.constants.widgets.userSettings + this.close).toLowerCase(); },
            /** widget + event, lowercase */
            forerunnerPropertiesClose: function () { return (forerunner.ssr.constants.widgets.forerunnerProperties + this.close).toLowerCase(); },
            /** widget + event, lowercase */
            forerunnerSecurityClose: function () { return (forerunner.ssr.constants.widgets.forerunnerSecurity + this.close).toLowerCase(); },
            /** widget + event, lowercase */
            forerunnerMoveItemClose: function () { return (forerunner.ssr.constants.widgets.forerunnerMoveItem + this.close).toLowerCase(); },

            /** @constant */
            zoomChange: "zoomchange",
            /** widget + event, lowercase */
            reportViewerZoomChange: function () { return (forerunner.ssr.constants.widgets.reportViewer + this.zoomChange).toLowerCase(); },

            /** @constant */
            afterTransition: "aftertransition",
            /** widget + event, lowercase */
            reportExplorerEZAfterTransition: function () { return (forerunner.ssr.constants.widgets.reportExplorerEZ + this.afterTransition).toLowerCase(); },

            /** @constant */
            saveRDLDone: "saveRDLDone",
            /** @constant */
            renameItem: "renameItem",

            /** @constant */
            catalogSelected: "catalogSelected",
            /** @constant */
            getCatalogComplete: "getcatalogcomplete",
            /** widget + event, lowercase */
            catalogTreeCatalogSelected: function () { return (forerunner.ssr.constants.widgets.catalogTree + this.catalogSelected).toLowerCase(); },
            /** widget + event, lowercase */
            catalogTreeGetCatalogComplete: function () { return (forerunner.ssr.constants.widgets.catalogTree + this.getCatalogComplete).toLowerCase(); }
        },
        /**
         * Tool types used by the Toolbase widget {@link $.forerunner.toolBase}
         *
         * @readonly
         * @enum {String}
         */
        toolTypes: {
            button: "button",
            input: "input",
            textButton: "textbutton",
            plainText: "plaintext",
            containerItem: "containeritem",
            toolGroup: "toolgroup",
            select: "select"
        },
        /**
         * Toolbar configuration options
         *
         * @readonly
         * @enum {String}
         */
        toolbarConfigOption: {
            hide: "hide",
            minimal: "minimal",
            dashboardEdit: "dashboardEdit",
            full: "full"
        },
        /**
         * Dashboard report slot, size options
         *
         * @readonly
         * @enum {String}
         */
        dashboardSizeOption: {
            template: "template",
            report: "report",
            custom: "custom"
        },
        /**
         * sort order used in the Report Viewer sort() method.
         *
         * @readonly
         * @enum {String}
         */
        sortDirection: {
            desc: "Descending",
            asc: "Ascending"
        },
        /**
         * Navigate type used in the REST end point NavigateTo
         *
         * @readonly
         * @enum {String}
         */
        navigateType: {
            toggle: "toggle",
            bookmark: "bookmark",
            drillThrough: "drillthrough",
            docMap: "documentMap"
        },
        /**
         * Export type used in the REST end point ExportReport
         *
         * @readonly
         * @enum {String}
         */
        exportType: {
            xml: "XML",
            csv: "CSV",
            pdf: "PDF",
            mhtml: "MHTML",
            excel: "EXCELOPENXML",            
            tiff: "IMAGE",
            word: "WORDOPENXML"
        },
        /**
        * Forerunner property for report, folder, dashboard
        *
        * @readonly
        * @enum {String}
        */
        properties: {
            description: "description",
            rdlExtension: "rdlExtension",
            tags: "tags",
            searchFolder: "searchFolder",
            visibility: "visibility"
        },

        // itemType is the number returned in the CatalogItem.Type member
        itemType: {
            unknown: 0,
            folder: 1,
            report: 2,
            resource: 3,
            linkedReport: 4,
            dataSource: 5,
            model: 6,
            site: 7
        },
    };

    /**
     * Defines useful global varibles to use the SDK
     *
     * @namespace
     */
    forerunner.config = {
        _virtualRootBase: null,

        _apiBase: null,

        _forerunnerFolderPath: null,

        _customSettings: null,

        _dbConfig: null,

        _watermarkConfig: {
            useNative: true,
            className: "fr-watermark"
        },

        _endsWith : function(str, suffix) {
            return str.indexOf(suffix, str.length - suffix.length);
        },
        /**
        * Override the base virtual root
        *
        * @param {String} virtualRootBase - API Base.
        */
        setVirtualRootBase: function (virtualRootBase) {
            if (this._endsWith(virtualRootBase, "/") === -1) {
                this._virtualRootBase = virtualRootBase + "/";
            } else {
                this._virtualRootBase = virtualRootBase;
            }
        },
        /**
         * Base virtual root used to get URLs for API and resources
         *
         * @return {String} - Virtual Root (E.g., http://localhost/testApp)
         * @member
         */
        virtualRootBase: function () {
            if (!this._virtualRootBase) {
                var scripts = document.getElementsByTagName("script");
                for (var i = 0; i < scripts.length; i++) {
                    var script = scripts[i];
                    var endsWith = this._endsWith(script.src, "Forerunner/Bundles/forerunner.min.js");
                    if (endsWith !== -1) {
                        this._virtualRootBase = script.src.substring(0, endsWith);
                        break;
                    }
                    endsWith = this._endsWith(script.src, "Forerunner/Bundles/forerunner.js");
                    if (endsWith !== -1) {
                        this._virtualRootBase = script.src.substring(0, endsWith);
                        break;
                    }
                }
            }
            return this._virtualRootBase === null ? "" : this._virtualRootBase;
        },
        /**
         * Top level folder for the forerunner SDK files. Used to construct the path to the localization files.
         *
         * @return {String} - Forerunner folder path
         * @member
         */
        forerunnerFolder: function () {
            if (this._forerunnerFolderPath) return this._forerunnerFolderPath;
            return this.virtualRootBase() + "forerunner/";
        },
        /**
        * Override the forerunner folder path.  By default, it is the vroot + /forerunner.
        *
        * @param {String} forerunnerFolderPath - Forerunner folder path.
        */
        setForerunnerFolder: function (forerunnerFolderPath) {
            if (this._endsWith(forerunnerFolderPath, "/") === -1) {
                this._forerunnerFolderPath = forerunnerFolderPath + "/";
            } else {
                this._forerunnerFolderPath = forerunnerFolderPath;
            }
        },
        /**
         * Base path to the REST api controlers
         *
         * @return {String} - API controller base path
         * @member
         */
        forerunnerAPIBase: function () {
            if (this._apiBase) return this._apiBase;
            return this.virtualRootBase() + "api/";
        },
        /**
        * Override the api base.  By default, it is the vroot + /api.
        *
        * @param {String} apiBase - API Base.
        */
        setAPIBase: function (apiBase) {
            if (this._endsWith(apiBase, "/") === -1) {
                this._apiBase = apiBase + "/";
            } else {
                this._apiBase = apiBase;
            }
        },
        /**
        * Set custom settings object
        *
        * @param {Object} settingObject - Custom Settings Object
        */
        setCustomSettings: function (settingObject) {
            forerunner.config._customSettings = settingObject;
        },

        /**
         * Get custom settings object, will retrieve from default location if not set.
         *
         * @param {function} done(Object) - callback function, if specified this function is async
         * @return {Object} - Customer setting object
         */
        getCustomSettings: function (done) {
            if (forerunner.config._customSettings === null) {
                var url = forerunner.config.forerunnerAPIBase() + "ReportManager/GetMobilizerSetting";
                forerunner.config.setCustomSettings({});

                var doAsync = false;
                if (done)
                    doAsync = true;

                forerunner.ajax.ajax({
                    url: url,
                    dataType: "json",
                    async: doAsync,                    
                    success: function (data) {
                        forerunner.config.setCustomSettings(data);
                        if (done) done(forerunner.config._customSettings);
                    },                   
                    fail: function () {
                        forerunner.config.setCustomSettings({});
                        console.log("Load mobilizer custom settings failed");
                    },
                    error: function (jqXHR, textStatus, errorThrown) {
                        forerunner.config.setCustomSettings({});
                        console.log("Load mobilizer custom settings.  textStatus: " + textStatus);
                        console.log(jqXHR);
                    },
                });
            }
            else if (done)
                done(forerunner.config._customSettings);

            return forerunner.config._customSettings;
        },
        /**
         * Get list of mobilizer shared schedule, which everybody can read, unlike the RS shared schedule.
         *
         * @param {function} done(Object) - callback function, if specified this function is async         
         * @return {Object} - Mobilizer shared schedule object
         */
        getMobilizerSharedSchedule: function (done) {
            var me = this;

            if (!me._forerunnerSharedSchedule) {

                var doAsync = false;
                if (done)
                    doAsync = true;

                forerunner.ajax.ajax({
                    url: forerunner.config.forerunnerFolder() + "../Custom/MobilizerSharedSchedule.txt",
                    dataType: "json",
                    async: doAsync,
                    success: function (data) {
                        forerunner.config._forerunnerSharedSchedule = data.SharedSubscriptions;
                        if (done) done(me._forerunnerSharedSchedule);
                    },

                    fail: function () {
                        console.log("Load mobilizer custom settings failed");
                    },
                    error: function (jqXHR, textStatus, errorThrown) {
                        console.log("Load mobilizer custom settings .  " + textStatus);
                    },
                });
            }
            else if (done)
                done(me._forerunnerSharedSchedule);

            return me._forerunnerSharedSchedule;
        },
        /**
         * Get user custom settings
         *
         * @param {String} setting - value to get.
         * @param {String} defaultval - default if not set
         *
         * @return {String} - Default value for the specify setting key
         */
        getCustomSettingsValue: function (setting, defaultval) {
            var settings = this.getCustomSettings();

            if (settings && settings[setting])
                return settings[setting];
            else
                return defaultval;
        },
        // internal used
        setDBConfiguration: function (dbConfig) {
            forerunner.config._dbConfig = dbConfig;
        },

        /**
         * Initialize Forerunner objects
         * Must be called first, function is Async
         *
         * @param {function} done - function to call when done
         */
        initialize: function (done){
            var me = this;

            var loop = function () {
                if (me._configDone === true && me._settingsDone === true && me._locDone === true) {
                    forerunner.ssr._internal.init();
                    if (done)
                        done();
                }
                else {
                    setTimeout(loop, 5);
                }
            };

            forerunner.config._initAsync = true;
            me.getDBConfiguration(function () {
                me._configDone = true;
            });
            forerunner.localize._getLocData(forerunner.config.forerunnerFolder() + "ReportViewer/loc/ReportViewer", "json", function (loc) {
                me._locDone = true;
            });
            
            me.getCustomSettings(function () {
                me._settingsDone = true;
            });
            loop();
        },
        
        // internal used
        getDBConfiguration: function (done) {
            var me = this;

            if (forerunner.config._dbConfig === null || jQuery.isEmptyObject(forerunner.config._dbConfig)) {
                var url = forerunner.config.forerunnerAPIBase() + "ReportManager/GetDBConfig";
                var doAsync = false;
                if (forerunner.config._initAsync === true)
                    doAsync = true;

                forerunner.ajax.ajax({
                    url: url,
                    dataType: "json",
                    async: doAsync,
                    success: function (data) {
                        forerunner.config.setDBConfiguration(data);
                        if (done) done(forerunner.config._dbConfig);
                    },
                    fail: function () {
                        forerunner.config.setDBConfiguration({});
                        console.log("Load database configuration failed");
                        if (done) done(forerunner.config._dbConfig);
                    },
                    error: function (jqXHR, textStatus, errorThrown) {
                        forerunner.config.setDBConfiguration({});
                        console.log("Load mobilizer configuration failed.  textStatus: " + textStatus);
                        console.log(jqXHR);
                        if (done) done(forerunner.config._dbConfig);
                    },
                });
            }
            else if (done)
                done(forerunner.config._dbConfig);

            return forerunner.config._dbConfig;
        },
        //internal used
        setWatermarkConfig: function (cfg) {
            forerunner.config._watermarkConfig = cfg || forerunner.config._watermarkConfig;
        },
        //internal used
        getWatermarkConfig: function () {
            return forerunner.config._watermarkConfig;
        }
    };

    /**
     * Defines generic helper functions
     *
     * @namespace
     */
    forerunner.helper = {

        /**
         * Returns the URL parameter for given name
         *
         * @member
         * @param {string} name - Parameter Name
         *
         * @return {String} - Parameter Value or NULL
         */
        urlParam: function (name) {
            var results = new RegExp("[\?&]" + name + "=([^&#]*)").exec(window.location.href);
            if (results === null) {
                return null;
            }
            else {
                return results[1] || 0;
            }
        },

        
        pushIfNot: function(collection, item){
            for (var i = 0 ;i< collection.length ;i++){
                if (collection[i] === item)
                    return;
            }
            collection.push(item);
        },
        /**
         * Returns a number array sorted in the given direction
         *
         * @member
         * @param {Array} array - Array to sort
         * @param {Boolean} asc - true for ascending false for decending
         *
         * @return {Array} - Array after sort
         */
        sortNumberArray: function (array, asc) {
            if (asc)
                array.sort(function (a, b) { return a - b; });
            else
                array.sort(function (a, b) { return b - a;});
            return array;
        },
        /**
         * Returns the number of elements or properties in an object
         *
         * @member
         * @param {Object} obj - target object        
         *
         * @return {Number} - Number of element or properties in an object
         */
        objectSize: function (obj) {
            var size = 0, key;
            for (key in obj) {
                if (obj.hasOwnProperty(key)) size++;
            }
            return size;
        },
        /**
         * Returns a unique GUID string
         *
         * @member
         *
         * @return {String} - GUID
         */
        guidGen: function () {
            var _padLeft = function (paddingString, width, replacementChar) {
                return paddingString.length >= width ? paddingString : _padLeft(replacementChar + paddingString, width, replacementChar || " ");
            };

            var _s4 = function (number) {
                var hexadecimalResult = number.toString(16);
                return _padLeft(hexadecimalResult, 4, "0");
            };

            var _cryptoGuid = function () {
                var buffer = new window.Uint16Array(8);
                window.crypto.getRandomValues(buffer);
                return [_s4(buffer[0]) + _s4(buffer[1]), _s4(buffer[2]), _s4(buffer[3]), _s4(buffer[4]), _s4(buffer[5]) + _s4(buffer[6]) + _s4(buffer[7])].join("-");
            };

            var _guid = function () {
                var currentDateMilliseconds = new Date().getTime();
                return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (currentChar) {
                    var randomChar = (currentDateMilliseconds + Math.random() * 16) % 16 | 0;
                    currentDateMilliseconds = Math.floor(currentDateMilliseconds / 16);
                    return (currentChar === "x" ? randomChar : (randomChar & 0x7 | 0x8)).toString(16);
                });
            };

            var hasRandomValues = false;
            var hasCrypto = typeof (window.crypto) !== "undefined";
            if (hasCrypto) {
                hasRandomValues = typeof (window.crypto.getRandomValues) !== "undefined";
            }

            return (hasCrypto && hasRandomValues) ? _cryptoGuid() : _guid();
        },
        /**
         * Returns whether given element contain specify class names
         * @param {Object} element - target element
         * @param {Array} classList - class name list
         * @return {Boolean} - Element contain one of the class list or not
         *
         * @member
         */
        containElement: function (element, classList) {
            var isContained = false;
            var target = element;
            
            while (true) {
                if (target === null || target === undefined) {
                    break;
                }
                
                $.each(classList, function (index, className) {
                    if ($(target).hasClass(className)) {
                        isContained = true;
                        return false;//break the $.each loop if has specify classname
                    }
                });

                if (isContained) {
                    break;
                }
                else {
                    //parentNode is standard, parentElement only support by IE
                    target = target.parentElement;
                }
            }
            
            return isContained;
        },
        /**
         * Returns a new div of the specified classes.
         *
         * @params {Array} listOfClassed - List of classes for the new div.
         * @return {Object} - A div element contain one of the class list or not
         *
         * @member
         */
        createDiv: function (listOfClasses) {
            var $div = new $("<div />");
            for (var i = 0; i < listOfClasses.length; i++) {
                $div.addClass(listOfClasses[i]);
            }
            return $div;
        },
        /**
         * Returns a JS object for the given string or object
         *
         * @objStr {Object} - Object or String to Parse
         *
         * @member
         */
        JSONParse: function (objStr) {
            try {
                if ($.type(objStr)=== "string" && $.trim(objStr) !== ""){
                    return jQuery.parseJSON(objStr);                
                }
                else if ($.type(objStr)=== "object"){
                    return objStr;
                }                    
                else {
                    return {};
                }
            }
            catch (e) {
                return {};
            }
        },

        /**
        * Returns a checkbox dropdown list for the valid values
        *
        * @param {Array} validValues - List of valid values.  validValue.Label is the label and validValue.Value is the value.
        *
        * @return {Object} - Select element jQuery object that contain specify values
        */
        createDropDownForValidValues: function (validValues) {
            var $select = new $("<SELECT />");
            for (var i = 0; i < validValues.length; i++) {
                var $option = new $("<OPTION />");
                $option.attr("value", validValues[i].Value);
                $option.append(validValues[i].Label);
                $select.append($option);
            }
            return $select;
        },
        /**
        * Returns an input filled with radio buttons for the valid values.
        *
        * @param {Array} validValues - List of valid values.  validValue.Label is the label and validValue.Value is the value.
        * @param {String} identifier - An identifier for that option.
        * @param {Function} callback - event handler for the onclick
        *
        * @return {Object} - Radio input jQuery object filled with radio buttons for the valid values.
        */
        createRadioButtonsForValidValues: function (validValues, identifier, callback) {
            return this._createInput(validValues, identifier, "radio", callback);
        },
        /**
        * Returns an input filled with radio buttons for the valid values.
        *
        * @param {Array} List of valid values.  validValue.Label is the label and validValue.Value is the value.
        * @param {String} identifier - An identifier for that option.
        *
        * @return {Object} - Input jQuery object filled with radio buttons for the valid values
        */
        createCheckBoxForValidValues: function (validValues, identifier) {
            return this._createInput(validValues, identifier, "checkbox");
        },
        _createInput: function (validValues, identifier, inputType, callback) {
            var $div = new $("<DIV />");
            for (var i = 0; i < validValues.length; i++) {
                var $option = new $("<INPUT />");
                var id = forerunner.helper.guidGen();
                $option.attr("type", inputType);
                $option.attr("id", id);
                $option.attr("value", validValues[i].Value);
                $option.attr("name", identifier);
                if (callback) {
                    $option.on("click", callback);
                }
                var $label = new $("<LABEL />");
                $label.attr("for", id);
                $label.append(validValues[i].Label);
                $div.append($option);
                $div.append($label);
            }
            return $div;
        },
        /**
         * Replaces special characters with the html escape character equivalents
         *
         * @param {String} str - the html string that need to encode
         *
         * @return {String} - Html string after encode.
         * @member
         */
        htmlEncode: function (str) {
            return String(str)
                    .replace(/&/g, "&amp;")
                    .replace(/"/g, "&quot;")
                    .replace(/'/g, "&#39;")
                    .replace(/</g, "&lt;")
                    .replace(/>/g, "&gt;");
        },
        /**
         * Replaces html escape characters with the ASCII equivalents
         *
         * @param {String} str - the html string that need to decode
         *
         * @return {String} - Html string after decode.
         * @member
         */
        htmlDecode: function (str) {
            return String(str)
                .replace(/&amp;/g, "&")
                .replace(/&quot;/g, "\"")
                    .replace(/&#39;/g, "'")
                .replace(/&lt;/g, "<")
                .replace(/&gt;/g, ">");
        },
        /**
         * Check a element has a special attribute or not
         *
         * @param {Object} $control - jQuery object that need to check
         * @param {String} attrbute - Specify attribute
         *
         * @return {Boolean} - true for has this attribute and false for not
         * @member
         */
        hasAttr: function ($control, attribute) {
            return typeof ($control.attr(attribute)) !== "undefined";
        },
        /**
         * Parse css property value to integer value
         *
         * @param {Object} $control - The jQuery object that contain the property
         * @param {String} property - Property name
         *
         * @return {Integer} - Integer value of the property
         * @member
         */
        parseCss: function ($control, property) {
            return parseInt($control.css(property), 10) || 0;
        },
        /**
         * Get parent item path by the given path
         *
         * @param {String} path - Path that need to handle
         *
         * @return {String} - Its parent path, return null if null path or 
         *                    already at the root
         * @member
         */
        getParentPath: function (path) {
            if (!path || path === "/") {
                // Root
                return null;
            }

            var parts = path.split("&");
            path = parts[0];

            var lastIndex = path.lastIndexOf("/");
            if (lastIndex === -1) {
                // Root
                return null;
            }

            if (lastIndex !== 0 && path.substr(lastIndex - 1, 1) === "/") {
                // Site (SharePoint)
                return "/";
            }

            return path.slice(0, lastIndex);
        },
        /**
         * Returns true if str ends with suffix
         *
         * @param {String} str - String need to check
         * @param {String} suffix - Suffix string
         *
         * @return {Boolean} - Return true if path end with suffix and false it not
         * @member
         */
        endsWith: function (str, suffix) {
            return !(str.indexOf(suffix, str.length - suffix.length));
        },
        /**
         * Combines the give folder and name infor a forward slash separated
         * path. Note that this function can combine multiple path parts.
         *
         * @param {String} folder - Folder name
         * @param {String} name - Name need to combine
         *
         * @return {String} - COmbine path
         * @member
         */
        combinePaths: function (folder, name) {
            var path = folder;
            for (var index = 1; index < arguments.length; index++) {
                if (this.endsWith(path, "/")) {
                    path = path + arguments[index];
                } else {
                    path = path + "/" + arguments[index];
                }
            }
            if (path.indexOf("http:") === -1) {
                path = path.replace("//", "/");
            }
            return path;
        },
        /**
         * Get current item name by the given path
         *
         * @param {String} path - Path
         *
         * @return {String} - Item name of the path
         * @member
         */
        getCurrentItemName: function (path) {
            if (!path) return null;
            var parts = path.split("&");
            path = parts[0];

            var lastIndex = path.lastIndexOf("/");
            if (lastIndex === -1) return path;

            return path.slice(lastIndex + 1);
        },
        /**
         * Delayes the execution of the given function by n
         * milliseconds.
         *
         * @param {Object} me - this pointer of the calling object
         * @param {Function} func - Function to call when time expires
         * @param {integer} n - Optional, Default 100, timeout milliseconds
         * @param {String} id - Optional, timer id
         *
         * @member
         */
        delay: function (me, func, n, id) {
            if (!n) {
                n = 100;
            }

            if (!id) {
                id = "_delayTimerId";
            }

            // If we get back here before the timer fires
            if (me[id]) {
                clearTimeout(me[id]);
                me[id] = null;
            }

            me[id] = setTimeout(function () {
                func();
                me[id] = null;
            }, n);
        }
    },
        

    /**
     * Defines utility methods used to update style sheets
     *
     * @namespace
     */
    forerunner.styleSheet = {
        //obsolete, we don't use css imported
        _findImportedSheet: function (name, inSheet) {
            var rules = (inSheet.cssRules || inSheet.rules);
            var returnSheet = null;

            // Enumerate the rules
            $.each(rules, function (rulesIndex, rule) {
                if (rule.styleSheet && rule.styleSheet.href) {
                    if (rule.styleSheet.href.match(new RegExp(name, "i"))) {
                        returnSheet = rule.styleSheet;
                        return false;
                    }

                    returnSheet = forerunner.styleSheet._findImportedSheet(name, rule.styleSheet);
                    if (returnSheet) {
                        return false;
                    }
                }
            });

            return returnSheet;
        },
        //obsolete, after enable MVC bundle, specific file name is gone.
        _findSheet: function (name) {
            var returnSheet = null;

            // Find the toolbase.css style sheet
            $.each(document.styleSheets, function (sheetsIndex, sheet) {
                if (sheet.href && sheet.href.match(new RegExp(name, "i"))) {
                    returnSheet = sheet;
                    return false;
                }

                returnSheet = forerunner.styleSheet._findImportedSheet(name, sheet);
                if (returnSheet) {
                    return false;
                }
            });

            return returnSheet;
        },
        /**
         * Updates style sheet based upon the dynamic rule. Note that
         * this function will loop style sheet object until find specify style name
         * and it cannot be used to create new rules.
         *
         * @param {Array} dynamicRules - custom define dynamic style rules array.
         * @member
         *
         * @example
         *  var isTouchRule = {
         *      selector: ".fr-toolbase-hide-if-not-touch",
         *      properties: function () {
         *          var pairs = { display: "none" };
         *          if (forerunner.device.isTouch()) {
         *              pairs.display = null;
         *          }
         *          return pairs;
         *      }
         *  };
         *
         *  forerunner.styleSheet.updateDynamicRules([isTouchRule]);
         */
        updateDynamicRules: function (dynamicRules) {
            //Enumerate the styleSheets
            $.each(document.styleSheets, function (sheetsIndex, sheet) {
                var rules = (sheet.cssRules || sheet.rules);
                var rulesLength = rules ? rules.length : 0;

                // Enumerate the rules
                for (var ruleIndex = 0; ruleIndex < rulesLength; ruleIndex++) {
                    var rule = rules[ruleIndex];
                    
                    // Check each rule and see if it matches the desired dynamic rule
                    $.each(dynamicRules, function (dynamicIndex, dynamicRule) {
                        var lowerSelector = dynamicRule.selector.toLowerCase();
                        if (rule.selectorText && (rule.selectorText.toLowerCase() === lowerSelector)) {
                            // Add or remove all properties from the dynamic rule into toolbase.css
                            for (var prop in dynamicRule.properties()) {
                                var value = dynamicRule.properties()[prop];
                                if (value !== null || value === "") {
                                    rule.style[prop] = value;
                                }
                                else {
                                    if (forerunner.device.isMSIE8())
                                        rule.style.removeAttribute(prop);
                                    else
                                        rule.style.removeProperty(prop);
                                }
                            }
                            return false;
                        }
                    });
                    /*jshint loopfunc: false */
                }
            });
        },

        internalDynamicRules: function () {
            var ruleArr = [],
                forerunnerFolderPath = forerunner.config.forerunnerFolder();

            //show element when touch screen rule for toolbase
            var touchShowRule = {
                selector: ".fr-toolbase-show-if-mobile",
                properties: function () {
                    var pairs = { display: "none" };
                    if (forerunner.device.isMobile()) {
                        pairs.display = null;
                    }
                    return pairs;
                }
            };
            //show element when touch screen rule for toolpane
            var touchShowRuleTp = {
                selector: ".fr-toolpane .fr-toolbase-show-if-mobile",
                properties: function () {
                    var pairs = { display: "none" };
                    if (forerunner.device.isMobile()) {
                        pairs.display = null;
                    }
                    return pairs;
                }
            };
            //hide element when touch screen rule for toolbase
            var touchHideRule = {
                selector: ".fr-toolbase-hide-if-mobile",
                properties: function () {
                    var pairs = { display: null };
                    if (forerunner.device.isMobile()) {
                        pairs.display = "none";
                    }
                    return pairs;
                }
            };
            //hide element when touch screen rule for tool pane
            var touchHideRuleTp = {
                selector: ".fr-toolpane .fr-toolbase-hide-if-mobile",
                properties: function () {
                    var pairs = { display: null };
                    if (forerunner.device.isMobile()) {
                        pairs.display = "none";
                    }
                    return pairs;
                }
            };

            var folderImageIE8 = {
                selector: ".fr-explorer-folder-ie8",
                properties: function () {
                    return { filter: "progid:DXImageTransform.Microsoft.AlphaImageLoader(src='" + forerunnerFolderPath + "/reportexplorer/images/folder.png', sizingMethod='scale')" };
                }
            };

            var folderSelectedImageIE8 = {
                selector: ".fr-explorer-folder-selected-ie8",
                properties: function () {
                    return { filter: "progid:DXImageTransform.Microsoft.AlphaImageLoader(src='" + forerunnerFolderPath + "/reportexplorer/images/folder_selected.png', sizingMethod='scale')" };
                }
            };

            var itemOuterImageIE8 = {
                selector: ".fr-report-item-outer-image-ie8",
                properties: function () {
                    return { filter: "progid:DXImageTransform.Microsoft.AlphaImageLoader(src='" + forerunnerFolderPath + "/reportexplorer/images/report_bkg.png', sizingMethod='scale')" };
                }
            };

            var itemEarImageIE8 = {
                selector: ".fr-report-item-ear-image-ie8",
                properties: function () {
                    return { filter: "progid:DXImageTransform.Microsoft.AlphaImageLoader(src='" + forerunnerFolderPath + "/reportexplorer/images/report_ear.png', sizingMethod='scale')" };
                }
            };

            var itemEarSelectedImageIE8 = {
                selector: ".fr-explorer-item-ear-selcted-ie8",
                properties: function () {
                    return { filter: "progid:DXImageTransform.Microsoft.AlphaImageLoader(src='" + forerunnerFolderPath + "/reportexplorer/images/report_ear_selected.png', sizingMethod='scale')" };
                }
            };

            var searchFolderImageIE8 = {
                selector: ".fr-explorer-searchfolder-ie8",
                properties: function () {
                    return { filter: "progid:DXImageTransform.Microsoft.AlphaImageLoader(src='" + forerunnerFolderPath + "/reportexplorer/images/Folder_Search.png', sizingMethod='scale')" };
                }
            };

            var searchFolderSelectedImageIE8 = {
                selector: ".fr-explorer-searchfolder-selected-ie8",
                properties: function () {
                    return { filter: "progid:DXImageTransform.Microsoft.AlphaImageLoader(src='" + forerunnerFolderPath + "/reportexplorer/images/SelectedFolder_Search.png', sizingMethod='scale')" };
                }
            };

            var dashboardImageIE8 = {
                selector: ".fr-explorer-dashboard-ie8",
                properties: function () {
                    return { filter: "progid:DXImageTransform.Microsoft.AlphaImageLoader(src='" + forerunnerFolderPath + "/reportexplorer/images/ResourceIcons/dashboard.png', sizingMethod='scale')" };
                }
            };

            ruleArr.push(touchShowRule);
            ruleArr.push(touchHideRule);
            ruleArr.push(touchShowRuleTp);
            ruleArr.push(touchHideRuleTp);

            if (forerunner.device.isMSIE8()) {
                ruleArr.push(folderImageIE8);
                ruleArr.push(folderSelectedImageIE8);
                ruleArr.push(itemOuterImageIE8);
                ruleArr.push(itemEarImageIE8);
                ruleArr.push(itemEarSelectedImageIE8);
                ruleArr.push(searchFolderImageIE8);
                ruleArr.push(searchFolderSelectedImageIE8);
                ruleArr.push(dashboardImageIE8);
            }

            return ruleArr;
        }
    },
    /**
     * Defines the methods used to localize string data in the SDK.
     *
     * @namespace
     */
    forerunner.localize = {
        _locData: {},
        _languageList: null,
 

        _getaLangDataFile: function (locFileLocation, langOnly, index, dataType,done) {
            var me = this;
            var lang;

            if (me._languageList[index])
                lang = me._languageList[index].toLocaleLowerCase();

            if (langOnly && lang && lang.length > 2)
                lang = lang.substring(0, 2);

            if (done) {
                me._loadFile(locFileLocation, lang, dataType, function (file) {
                    if (file)
                        done(file);
                    else if (index < me._languageList.length)
                        me._getaLangDataFile(locFileLocation, langOnly, index + 1,dataType, done);
                });
            }
            else {
                var locData = me._loadFile(locFileLocation, lang,dataType);
                if (locData)
                    return locData;
                else if (index < me._languageList.length)
                    return me._getaLangDataFile(locFileLocation, langOnly, index + 1, dataType);
            }
                
        },

        locFileLocation: forerunner.config.forerunnerFolder() + "ReportViewer/loc/ReportViewer",
        getLocData: function () {
            return forerunner.localize._getLocData(forerunner.localize.locFileLocation, "json");
        },
        /**
         * Returns the language specific data.
         *
         * @param {String} locFileLocation - The localization file location without the language qualifier
         * @param {String} dataType - optional, ajax dataType. defaults to "json"
         * @param {function} done(Object) - callback function
         *
         * @return {Object} Localization data
         *
         * @member
         */
        _getLocData: function (locFileLocation, dataType,done) {
            var me = this;
            var langData = null;

            var after = function (languageList) {
                var i;
                var lang;
                
                if (done) {
                    me._getaLangDataFile(locFileLocation, false, 0, dataType, function (langFile) {
                        if (langFile)
                            done(langFile);
                        else
                            me._getaLangDataFile(locFileLocation, true, 0, dataType, function (langFile) {
                                if (langFile)
                                    done(langFile);
                                else
                                    me._loadFile(locFileLocation, "en", dataType, function (langfile) {
                                        done(langFile);
                                    });

                            });
                    });
                }
                else {
                    langData = me._getaLangDataFile(locFileLocation, false, 0, dataType);
                    if (langData)
                        return langData;
                    else
                        langData = me._getaLangDataFile(locFileLocation, true, 0, dataType);

                    if (!langData)
                        langData = me._loadFile(locFileLocation, "en", dataType);
                    return langData;
                }
                               
            };

            //if Async
            if (done)
                me._getLanguages(after);
            else {
                return after(me._getLanguages());                 
            }
             
        },

        /**
        * Returns the language specific value.
        *
        * @param {String} val - The default value if no localized version is found
        * @param {object} locObj - the json object with the localization data      
        *
        * @return {String} Localized value
        *
        * @member
        */
        getLocalizedValue: function (val, locObj) {
            var me = this;
            var languageList = me._languageList;
            var i;

            if (!languageList)
                return val;

            for (i = 0; i < languageList.length; i++) {
                var lang = languageList[i];
                lang = lang.toLocaleLowerCase();

                if (locObj[lang])
                    return locObj[lang].value;
            }

            return val;
            

        },
        _getLanguages: function (done) {
            var me = this;

            if (!me._languageList) {
                var doAsync = false;
                if (done)
                    doAsync = true;

                //setup wait loop
                var loop = function () {
                    if (me._lockLangCall)
                        setTimeout(loop,5);
                    else
                        done(me._languageList);
                    };

                if (me._lockLangCall) {
                    loop();
                }
                else {
                    me._lockLangCall = true;
                    forerunner.ajax.ajax({
                        url: forerunner.config.forerunnerAPIBase() + "reportViewer/AcceptLanguage",
                        dataType: "json",
                        async: doAsync,
                        success: function (data) {
                            me._languageList = data;
                            me._lockLangCall = false;
                            if (done) done(me._languageList);
                        },
                        done: function () {
                            me._lockLangCall=false;
                        },
                        fail: function () {
                            me._languageList = null;
                        },
                        error: function (jqXHR, textStatus, errorThrown) {
                            me._languageList = null;
                        },
                    });
                }
            }
            else if (done)
                done(me._languageList);

            
            return me._languageList;
        },        
        _loadFile: function (locFileLocation, lang, dataType,done) {
            var me = this;
            if (!dataType) {
                dataType = "json";
            }
            if (me._locData[locFileLocation] === undefined)
                me._locData[locFileLocation] = {};

            var doAsync = false;
            if (done)
                doAsync = true;


            //setup wait loop
            var loop = function () {
                if (me._locData[locFileLocation].locked)
                    setTimeout(loop, 5);
                else
                    done(me._locData[locFileLocation][lang]);
            };

            if (me._locData[locFileLocation].locked) {
                loop();
            }
            else if (me._locData[locFileLocation][lang] === undefined) {
                me._locData[locFileLocation].locked = true;
                // This does not need to be wrapped because this should
                // not require authn,
                forerunner.ajax.ajax({
                    url: forerunner.config.forerunnerAPIBase() + "reportManager/GetMobilizerLocFile" ,
                    data: { LocFile: locFileLocation + "-" + lang + ".txt" },
                    dataType: dataType,
                    async: doAsync,
                    success: function (data) {
                        me._locData[locFileLocation][lang] = data;
                        me._locData[locFileLocation].locked = false;
                        if (done) done(me._locData[locFileLocation][lang]);
                    },
                    fail: function () {
                        me._locData[locFileLocation][lang] = null;
                        me._locData[locFileLocation].locked = false;
                        if (done) done(me._locData[locFileLocation][lang]);
                    },
                    error: function (jqXHR, textStatus, errorThrown) {
                        me._locData[locFileLocation][lang] = null;
                        me._locData[locFileLocation].locked = false;
                        if (done) done(me._locData[locFileLocation][lang]);
                    },
                });

            }
            else if (done)
                done(me._locData[locFileLocation][lang]);

            return me._locData[locFileLocation][lang];
        },

    };
    /**
     * Defines the methods used to make Ajax calls.
     *
     * @namespace
     */
    forerunner.ajax = {
        loginUrl: null,
        /**
         * Check it's form authentication or not
         *
         * @return {Boolean} - Return true if it is form authentication and false if not
         * @member
         */
        isFormsAuth: function (done) {
            var me = this;
            if (done) {
                me._getLoginUrl(function (url) {
                    done(url && url.length > 0);
                });
            }
            else {
                var url = this._getLoginUrl();
                return (url && url.length > 0);
            }
        },
        _getLoginUrl: function (done) {
            var me = this;

            var doAsync = false;
            if (done)
                doAsync = true;
            
            //setup wait loop
            var loop = function () {
                if (me.getLoginURLLock === true)
                    setTimeout(loop, 5);
                else
                    done(me.loginUrl);
            };
            if (me.getLoginURLLock === true && doAsync=== true) {
                loop();                
            }


            if (!me.loginUrl && me.getLoginURLLock !== true) {
                me.getLoginURLLock = true;
                forerunner.ajax.ajax({
                    url: forerunner.config.forerunnerAPIBase() + "reportViewer/LoginUrl",
                    dataType: "json",
                    async: doAsync,
                    success: function (data) {
                        me.loginUrl = data.LoginUrl.replace("~", "");
                        me.getLoginURLLock = false;
                        if (done)
                            done(me.loginUrl);
                    },
                    fail: function () {
                        me.loginUrl = "";
                        me.getLoginURLLock = false;
                    },
                    error: function (jqXHR, textStatus, errorThrown) {
                        me.loginUrl = "";
                        me.getLoginURLLock = false;
                    },
                });

            }           
            else if (done)
                done(me.loginUrl);

            return me.loginUrl;
        },

        _handleRedirect: function (data) {
            var me = this;

            if (data.status === 401 || data.status === 302) {
                me._getLoginUrl(function (loginUrl) {
                    var redirectTo = loginUrl + "?ReturnUrl=" + encodeURIComponent(window.location.href);
                    window.location.href = redirectTo;
                });
            }
        },
        /**
        * Wraps the $.ajax call and if the response status 302 || 401, it will redirect to login page. 
        * Additionally this method will set the proper CORS setting to enable cross domain scripting.
        *
        * @param {Object} options - Options for the ajax call.        
        * @member
        */
        ajax: function (options) {
            var me = this;
            var errorCallback = options.error;
            var successCallback = options.success;
            options.success = null;

            if (options.async !== false)
                options.async = true;

            
            if (forerunner.config.enableCORSWithCredentials) {
                options.xhrFields = {
                    withCredentials: true,
                    crossDomain:true
                };
            }

            if (options.fail)
                errorCallback = options.fail;

            var jqXHR = $.ajax(options);

            if (options.done)
                jqXHR.done(options.done);
            if (successCallback)
                jqXHR.done(successCallback);

            jqXHR.fail(function (jqXHR, textStatus, errorThrown) {
                me._handleRedirect(jqXHR);
                if (errorCallback)
                    errorCallback(jqXHR, textStatus, errorThrown, this);
            });
            return jqXHR;
        },
        /**
        * Wraps the $.getJSON call and if the response status 401 or 302, it will redirect to login page.
        * Additionally this method will set the proper CORS setting to enable cross domain scripting.
        *
        * @param {String} url - Url of the ajax call
        * @param {Object} options - Options for the ajax call.
        * @param {function} done - Handler for the success path.
        * @param {function} fail - Handler for the failure path.
        * @member
        */
        getJSON: function (url, options, done, fail) {
            var me = this;
            
            var requestOptions = {};
            requestOptions.data = options;
            requestOptions.done = done;
            requestOptions.fail = fail;
            requestOptions.dataType = "json";
            requestOptions.url = url;

            return me.ajax(requestOptions);

            
        },
        /**
        * Makes a "POST" type ajax request and if the response status 401 or 302, it will redirect to login page. 
        *
        * @param {String} url - Url of the ajax call
        * @param {Object} data - data for the ajax call.
        * @param {function} success - Handler for the success path.
        * @param {function} fail - Handler for the failure path.
        * @member
        */
        post: function (url, data, success, fail) {
            var me = this;

            var options = {};
            options.type = "POST";
            options.data = data;
            options.url = url;
            options.success = success;
            options.fail = fail;

            return forerunner.ajax.ajax(options);
        },
        /**
        * Returns json data indicating is the user has the requested permissions for the given path
        *
        * @param {String} path - fully qualified path to the resource
        * @param {Array} permissions - Requested permissions list
        * 
        * @param {function} done(object) - callback function, if specified this function is async
        * @return {Object} - Check result for each permission
        * @member
        */
        hasPermission: function (path, permissions,instance,done) {
            var permissionData = {};

            var doAsync = false;
            if (done)
                doAsync = true;

            var url = forerunner.config.forerunnerAPIBase() + "ReportManager/HasPermission";
            forerunner.ajax.ajax({
                url: url,
                data: {
                    path: path,
                    permission:permissions,
                    instance: instance,
                },
                dataType: "json",
                async: doAsync,                
                success: function (data) {
                    permissionData = data;
                    if (done) done(permissionData);
                },
                fail: function (jqXHR) {
                    console.log("hasPermission() - " + jqXHR.statusText);
                    console.log(jqXHR);
                    if (done) done({});
                }
            });
            return permissionData;
        },
        _userSetting: null,
        _userName: null,
        /**
         * Set user settings object
         *
         * @param {Object} usetSetting - User Settings Object
         * @member
         */
        setUserSetting: function (usetSetting) {
            this._userSetting = usetSetting;
        },
        /**
        * Get user name.
        *
        * @param {String} rsInstance - Reporting Service instance name
        * @param {function} done(String) - callback function, if specified this function is async
        *
        * @return {String} - User name
        * @member
        */
        getUserName: function (rsInstance,done) {
            var me = this;
            if (me._userName === null) {
                var url = forerunner.config.forerunnerAPIBase() + "ReportManager/GetUserName";

                if (rsInstance) {
                    url += "?instance=" + rsInstance;
                }

                var doAsync = false;
                if (done)
                    doAsync = true;

                forerunner.ajax.ajax({
                    url: url,
                    dataType: "text",
                    async: doAsync,
                    success: function (data) {
                        forerunner.ajax._userName = data;
                        if (done) done(me._userName);
                    }                    
                });
            }
            else if (done)
                done(me._userName);

            return me._userName;
        },
        /**
        * Get user settings object, will retrieve from database if not set.
        *
        * @param {String} rsInstance - Reporting Service instance name
        * @param {function} done(Object) - callback function, if specified this function is async
        *
        * @return {Object} - User setting object
        * @member
        */
        getUserSetting: function (rsInstance, done) {
            var me = this;
            if (me._userSetting === null) {
                var url = forerunner.config.forerunnerAPIBase() + "ReportManager/GetUserSettings";

                if (rsInstance) {
                    url += "?instance=" + rsInstance;
                }

                var doAsync = false;
                if (forerunner.config._initAsync === true)
                    doAsync = true;

                forerunner.ajax.ajax({
                    url: url,
                    dataType: "json",
                    async: doAsync,                    
                    success: function (data) {
                        forerunner.ajax._userSetting = data;
                        if (done) done(forerunner.ajax._userSetting);
                    }
                });
            }
            else if (done)
                done(me._userSetting);

            return me._userSetting;
        },
        /**
        * Get build version on the server side
        *
        * @param {function} done(Object) - callback function, if specified this function is async
        *
        * @return {Object} - build version
        * @member
        */
        getBuildVersion: function (done) {
            var me = this;
            var url = forerunner.config.forerunnerAPIBase() + "ReportManager/GetMobilizerVersion";
           

            var doAsync = false;
            if (done)
                doAsync = true;

            forerunner.ajax.ajax({
                url: url,
                dataType: "text",
                async: doAsync,
                done: function () {
                    if (done) done(me._buildVersion);
                },
                success: function (data) {
                    me._buildVersion = data;
                },
                fail: function (data) {
                    console.log(data);
                },
                error: function (jqXHR, textStatus, errorThrown) {
                    console.log(errorThrown);
                },
            });

            return me._buildVersion;
        }
    };
    /**
     * Contains device specific methods.
     *
     * @namespace
     */
    forerunner.device = {
        /** @return {Boolean} Returns a boolean that indicates if the device is a touch device */
        isTouch: function () {
            return ("ontouchstart" in window) || (navigator.msMaxTouchPoints > 0);
        },
        /** @return {Boolean} Returns a boolean that indicates if the device is in portrait */
        isPortrait: function () {
            if (!window.orientation) {
                return $(window).height() > $(window).width();
            }
            // The 2 bit will be set for 90 and 180
            /*jshint bitwise: false*/
            if (window.orientation & 2) {
                return false;
            }
            /*jshint bitwise: true*/
            return true;
        },
        /** @return {Boolean} Returns a boolean that indicates if the device is an iOS device */
        isiOS: function () {
            var ua = navigator.userAgent;
            return ua.match(/(iPhone|iPod|iPad)/) !== null;
        },
        /** @return {Boolean} Returns a boolean that indicates if the device is an iPhone or iPod device */
        isiPhone: function () {
            var ua = navigator.userAgent;
            return ua.match(/(iPhone|iPod)/) !== null;
        },
        /** @return {Boolean} Returns a boolean that indicates if the device is an iPad device */
        isiPad: function () {
            var ua = navigator.userAgent;
            return ua.match(/(iPad)/) !== null;
        },
        /** @return {Boolean} Returns a boolean that indicates if the device is an Firefox Browser  */
        isFirefox: function () {
            var ua = navigator.userAgent;
            return ua.match(/(Firefox)/) !== null;
        },
        /** @return {Boolean} Returns a boolean that indicates if the device is an Safari Browser  */
        isSafari: function () {
            var ua = navigator.userAgent;
            if (ua.indexOf("Safari") !== -1 && ua.indexOf("Chrome") === -1) {
                return true;
            }
            return false;
        },
        /** @return {Boolean} Returns a boolean that indicates if the device is an Safari Browser on  */
        isSafariPC: function () {
            var ua = navigator.userAgent;            
            if (ua.indexOf("Safari") !== -1 && ua.indexOf("Chrome") === -1 && ua.indexOf("Windows") !== -1) {
                return true;
            }
            return false;
        },
        /** @return {Boolean} Returns a boolean that indicates if the device is Microsoft IE Browser */
        isMSIE: function () {
            var ua = navigator.userAgent;
            return (ua.match(/(MSIE)/) !== null || ua.match(/(.NET)/) !== null);  //Handle IE11
        },
        /** @return {Boolean} Returns a boolean that indicates if the device is Microsoft IE 8 Browser */
        isMSIE8: function () {
            var ua = navigator.userAgent;

            var ret = (ua.match(/(MSIE 8)/) !== null) || (ua.match(/(MSIE 7)/) !== null);
            return ret;
        },
        /** @return {Boolean} Returns a boolean that indicates if the device is Microsoft IE 9 Browser */
        isMSIE9: function () {
            var ua = navigator.userAgent;
            return ua.match(/(MSIE 9)/) !== null;
        },
        /** @return {Boolean} Returns a boolean that indicates if the device is Microsoft IE Browser with the Touch key word */
        isMSIEAndTouch :function () {
            var ua = navigator.userAgent;
            return ua.match(/(MSIE)/) !== null && ua.match(/(Touch)/) !== null;
        },
        /** @return {Boolean} Returns a boolean that indicates if the device is a Windows Phone */
        isWindowsPhone : function() {
            var ua = navigator.userAgent;
            return ua.match(/(Windows Phone)/) !== null;
        },
        /** @return {Boolean} Returns a boolean that indicates if the device is a Windows Phone */
        isWindowsPhone81: function () {
            var ua = navigator.userAgent;
            return ua.match(/(Windows Phone 8.1)/) !== null;
        },
        /** @return {Boolean} Returns a boolean that indicates if the device is a IE Mobile 9.* */
        isIEMobile9: function () {
            var ua = navigator.userAgent;
            return forerunner.device.isWindowsPhone() && ua.match(/(IEMobile\/9.0)/) !== null;
        },
        /** @return {Boolean} Returns a boolean that indicates if the device is a IE Mobile 10 */
        isIEMobile10: function () {
            var ua = navigator.userAgent;
            return forerunner.device.isWindowsPhone() && ua.match(/(IEMobile\/10.0)/) !== null;
        },
        /** @return {Boolean} Returns a boolean that indicates if the device is a IE Mobile 11 */
        isIEMobile11: function () {
            var ua = navigator.userAgent;
            return forerunner.device.isWindowsPhone() && ua.match(/(IEMobile\/11.0)/) !== null;
        },
        /** @return {Boolean} Returns a boolean that indicates if the device is in the standalone mode */
        isStandalone: function () {
            if (window.navigator.standalone) {
                return true;
            }
            return false;
        },
        /** @return {Boolean} Returns a boolean that indicates if the device an iPhone and is in the fullscreen / landscape mode */
        isiPhoneFullscreen: function () {
            if (forerunner.device.isiPhone() && document.documentElement.clientHeight === 320) {
                return true;
            }
            return false;
        },
        /** @return {Boolean} Returns a boolean that indicates if the device is an Android device */
        isAndroid: function () {
            var ua = navigator.userAgent;
            return ua.match(/(Android)/) !== null;
        },

        /** @return {Boolean} Returns a boolean that indicates if it is a Chrome browser */
        isChrome : function () {
            var ua = navigator.userAgent;

            var ret = (ua.match(/(Chrome)/) !== null )||  (ua.match(/(CriOS)/) !== null);
            return ret;
        },

        /** @return {Boolean} Returns a boolean that indicates if it is a Mobile device */
        isMobile: function(){
            var me = this;

            return (me.isiOS() || me.isAndroid() || me.isWindowsPhone());            
        },

        _allowZoomFlag : null,
        /** 
         * Sets up the viewport meta tag for scaling or fixed size based upon the given flag
         * @param {Boolean} flag - true = scale enabled (max = 10.0), false = scale disabled
         */
        allowZoom: function (flag) {
            if (this._allowZoomFlag === flag) {
                return;
            }

            this._allowZoomFlag = flag;

            if (forerunner.device.isWindowsPhone81()) {
                if (flag === true) {
                    $("#fr-viewport-style").remove();
                }
                else {                    
                    var $viewportStyle = $("<style id=fr-viewport-style>@-ms-viewport {width:auto; user-zoom:" + "fixed" + ";}</style>");
                    //-ms-overflow-style: none; will enable the scroll again in IEMobile 10.0 (WP8)                
                    $("head").slice(0).append($viewportStyle);
                }

                return;
            }

            if (flag === true) {
                $("head meta[name=viewport]").remove();
                $("head").prepend("<meta name='viewport' content='width=device-width, initial-scale=1, maximum-scale=10.0, minimum-scale=0, user-scalable=yes' />");
            } else {
                $("head meta[name=viewport]").remove();
                $("head").prepend("<meta name='viewport' content='width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=no' />");
            }

            
        },

        /** 
         * Gets whether the view port allows zooming
         * @return {Boolean} flag - True if the view port allow zooming.
         */
        isAllowZoom : function() {
            return this._allowZoomFlag;
        },
      
        /** @return {Float} Returns the zoom level, (document / window) width */
        zoomLevel: function(element){
            var ratio = document.documentElement.clientWidth / window.innerWidth;

           
          //alert(ratio);
            return ratio;
        },
        /** @return {Boolean} Returns a boolean that indicates if the element is inside the viewport */
        isElementInViewport: function (el) {
            var rect = el.getBoundingClientRect();
             
            return (
                rect.top >= 0 &&
                rect.left >= 0 &&
                rect.bottom <= (window.innerHeight || document. documentElement.clientHeight) && /*or $(window).height() */
                rect.right <= (window.innerWidth || document. documentElement.clientWidth) /*or $(window).width() */
                );
        },
                   
        /** @return {Boolean} Returns a boolean that indicates if device is small (I.e, height < 768) */
        isSmall: function ($container) {
            if ($container.height() < forerunner.config.getCustomSettingsValue("FullScreenPageNavSize", 768)) {
                return true;
            }
            else {
                return false;
            }
        },

    };

    forerunner.cache = {
        itemProperty: {}
    };
    /**
    * Defines the methods used to modal dialog.
    *
    * @namespace
    */
    forerunner.dialog = {
        dialogLock: false,
        /**
         * Show a modal dialog with appContainer and target dialog container specify
         *
         * @function forerunner.dialog#showModalDialog
         * @param {Object} $appContainer - The container jQuery object that holds the application
         * @param {Object} target - object that modal dialog apply to
         * @member
         */
        showModalDialog: function ($appContainer, target) {
            var me = this;

            if (!forerunner.device.isWindowsPhone())
                $appContainer.trigger(forerunner.ssr.constants.events.showModalDialog);

            setTimeout(function () {
                $appContainer.mask(undefined, document.body.scrollHeight, document.body.scrollWidth);
                target.element.css({ top: $(window).scrollTop(), left: $(window).scrollLeft() }).show();

                //reset modal dialog position when window resize happen or orientation change
                me._removeEventsBinding();
                $(window).on("resize", { target: target, me: me }, me._setPosition);
                $(document).on("keyup", { target: target }, me._bindKeyboard);
            }, 200);
        },
        /**
        * Close a modal dialog with appContainer and target dialog container specify
        *
        * @function forerunner.dialog#closeModalDialog
        * @pramm {Object} $appContainer - The container jQuery object that holds the application
        * @param {Object} target - object that modal dialog apply to
        * @member
        */
        closeModalDialog: function ($appContainer, target) {
            var me = this;
            
            target.element.css({ top: "", left: "" }).hide();

            //in some cases there are multiple dialogs show up at one time
            //like message box and other dialog, so the main dialog will set dialogLock to true
            //to make sure the mask background will be there until it get closed
            if (forerunner.dialog.dialogLock) return;

            me._removeEventsBinding();
            $appContainer.unmask();

            if (!forerunner.device.isWindowsPhone())
                $appContainer.trigger(forerunner.ssr.constants.events.closeModalDialog);
        },
        /**
        * Close all opened modal dialogs in specify appContainer
        *
        * @function forerunner.dialog#closeAllModalDialogs
        * @pram {Object} $appContainer - The container jQuery object that holds the application
        * @member
        */
        closeAllModalDialogs: function ($appContainer) {
            var me = this;

            me._removeEventsBinding();

            $.each($appContainer.find(".fr-dialog-id"), function (index, modalDialog) {
                var $dlg = $(modalDialog);
                if ($dlg.is(":visible")) {
                    $appContainer.unmask();
                    $dlg.hide();
                }
            });
        },
        _messageBox: null,
        /**
        * Show message box
        *
        * @function forerunner.dialog#showMessageBox
        * @param {Object} $appContainer - The container jQuery object that holds the application
        * @param {String} msg - Message content
        * @param {String} caption - Modal dialog caption
        * @member
        */
        showMessageBox: function ($appContainer, msg, caption) {
            var me = this;

            if (me._messageBox === null) {
                me._messageBox = $appContainer.children(".fr-messagebox");

                if (me._messageBox.length === 0) {
                    me._messageBox = $("<div class='fr-messagebox fr-dialog-id fr-core-dialog-layout fr-core-widget'/>");
                    me._messageBox.messageBox({ $appContainer: $appContainer });
                    $appContainer.append(me._messageBox);
                }
            }

            me._messageBox.messageBox("openDialog", msg, caption);
        },
        /**
        * Check message box visible or not
        *
        * @function forerunner.dialog#isMessageBoxVisible
        * @return {Boolean} - true for visible, false for hide
        * @member
        */
        isMessageBoxVisible: function () {
            var me = this;

            if (me._messageBox && me._messageBox.is(":visible")) {
                return true;
            }

            return false;
        },
        /**
        * Get modal dialog static header html snippet
        *
        * @function forerunner.dialog#getModalDialogHeaderHtml
        * @param {String} iconClass - Icon class to specific icon position
        * @param {String} title - Modal dialog title
        * @param {String} cancelClass - Cancel button class name
        * @param {String} cancelWord - Cancel button's text
        * @param {String} action - Action class
        * @param {String} actionWork - Action text
        *
        * @return {String} - Modal dialog header html snippet
        * @member
        */
        getModalDialogHeaderHtml: function (iconClass, title, cancelClass, cancelWord, actionClass, actionWord) {
            var html = "<div class='fr-core-dialog-header'>" +
                            "<div class='fr-core-dialog-icon-container'>" +
                                "<div class='fr-core-dialog-icon-inner'>" +
                                    "<div class='fr-icons24x24 fr-core-dialog-align-middle " + iconClass + "'></div>" +
                                "</div>" +
                            "</div>" +
                            "<div class='fr-core-dialog-title-container'>" +
                                "<div class='fr-core-dialog-title'>" +
                                   title +
                                "</div>" +
                            "</div>";

            html += "<div class='fr-core-dialog-cancel-container'>" +
                                "<input type='button' class='fr-core-dialog-cancel " + cancelClass + "' title='" + cancelWord + "' />" +
                            "</div>";

            if (actionClass) {
                html += "<div class='fr-core-dialog-action-container'>" +
                                "<input type='button' class='fr-core-dialog-action " + actionClass + "' title='" + actionWord + "' />" +
                        "</div>";
            }
            html += "</div>";
            return html;
        },
        
        _setPosition: function (event) {
            var me = event.data.me, target = event.data.target;

            forerunner.helper.delay(me,
                function () {
                    var maskSize = { height: document.body.scrollHeight, width: document.body.scrollWidth };
                    var $mask = $(".fr-core-mask:first");
                    if ($mask.length) {
                        $mask.css(maskSize);
                    }

                    target.element.css({ top: $(window).scrollTop(), left: $(window).scrollLeft() });
                },
            50, "_dialogTimerId");
        },
        _bindKeyboard: function (event) {
            var element = event.data.target.element;
            //trigger generic event, each modal dialog widget can listener part/all of them 
            switch (event.keyCode) {
                case 13://Enter to trigger generic submit
                    element.trigger(forerunner.ssr.constants.events.modalDialogGenericSubmit);
                    break;
                case 27://Esc to trigger generic close
                    element.trigger(forerunner.ssr.constants.events.modalDialogGenericCancel);
                    break;
            }
        },
        _removeEventsBinding: function () {
            var me = this;
            $(window).off("resize", me._setPosition);
            $(document).off("keyup", me._bindKeyboard);
        }
    };

    forerunner.ssr.map = function(initialData) {
        // can pass initial data for the set in an object
        this.data = initialData || {};
    };

    forerunner.ssr._writeRDLExtActions = function (ObjName, RDLExt, $Control, mapAreaOnly, reportViewer,
        getInputs, easySubmit, getParameters, setParamError, deleteCurrentRow, insertNewRow) {

        var me = this;

        if (RDLExt === null || RDLExt === undefined)
            return;
        var ActionExt = RDLExt[ObjName];

        var SharedActions = {};
        if (ActionExt) {
            SharedActions = RDLExt.SharedActions;
            if (SharedActions === undefined) SharedActions = {};
        }
        else
            ActionExt = {};

        if (ActionExt.JavaScriptActions) {
            for (var a = 0; a < ActionExt.JavaScriptActions.length; a++) {
                var action = ActionExt.JavaScriptActions[a];
                var actions;

                if (action.SharedAction && SharedActions[action.SharedAction]) {
                    actions = SharedActions[action.SharedAction].JavaScriptActions;
                }
                var sa = 0;
                // if shared there can be many actions per share
                while (true) {

                    if (actions !== undefined && actions[sa]) {
                        action = actions[sa++];
                    }

                    if (action.JavaFunc === undefined && action.Code !== undefined) {
                        if (mapAreaOnly !== true || (mapAreaOnly === true && action.ImageMapArea === true)) {
                            var newFunc;
                            try {
                                newFunc = new Function("e", action.Code);
                            }
                            catch (e) {
                                console.log(e.message);
                            }
                            action.JavaFunc = newFunc;
                            if (action.On === undefined)
                                action.On = "click";

                        }

                    }
                    if (action.On === "click")
                        $Control.addClass("fr-core-cursorpointer");
                    $Control.on(action.On, { reportViewer: reportViewer, element: $Control, getInputs: getInputs, easySubmit: easySubmit, getParameters: getParameters, setParamError: setParamError, deleteCurrentRow: deleteCurrentRow, insertNewRow: insertNewRow }, action.JavaFunc);

                    if (actions === undefined || (actions !== undefined && actions[sa]) === undefined)
                        break;

                }
            }
        }
    };

    forerunner.ssr.map.prototype = {
        add: function (key, val) {
            if (typeof key === "object") {
                for (var index in key) {
                    if (key.hasOwnProperty(index)) {
                        this.add(index, key[index]);
                    }
                }
            } else {
                this.data[key] = val;
            }
        },
        get: function (key) {
            return this.data[key];
        },
        remove: function (key) {
            // can be one or more args
            // each arg can be a string key or an array of string keys
            var item;
            for (var j = 0; j < arguments.length; j++) {
                item = arguments[j];
                if (typeof key === "string") {
                    delete this.data[item];
                } else if (item.length) {
                    // must be an array of keys
                    for (var i = 0; i < item.length; i++) {
                        delete this.data[item[i]];
                    }
                }
            }
        },
        has: function (key) {
            return Object.prototype.hasOwnProperty.call(this.data, key);
        },
        isEmpty: function () {
            for (var key in this.data) {
                if (this.has(key)) {
                    return false;
                }
            }
            return true;
        },
        keys: function () {
            return Object.keys(this.data);
        },
        clear: function () {
            this.data = {};
        }
    };
    forerunner.ssr._internal = {
        // Returns the parameter list all as single valued parameters.
        // The multiple valued parameter simply are treated 
        getParametersFromUrl: function (url) {
            var params = [];
            var start = url.indexOf("?") + 1;
            var vars = url.substring(start).split("&");
            for (var i = 0; i < vars.length; i++) {
                var pair = vars[i].split("=");
                var key = decodeURIComponent(pair[0]);
                var value = decodeURIComponent(pair[1]);
                var ssrsPram = key.substring(0, 3);
                if (ssrsPram !== "rs:" && ssrsPram !== "rc:" && ssrsPram !== "fr:") {
                    params.push({ "Parameter": key, "Value": value, "IsMultiple": "false", Type: "" });
                }
            }
            return params;
        },

        getOptionsFromURL: function (url) {
            if (url === null)
                return null;

            var options = { "isReportManager": true, "showBreadCrumb": true, "useReportManagerSettings": true, "showToolbar": true, "showParameterArea": "Collapsed", "section": 1, "Zoom": "100", "deviceInfo": {} };
            var start = url.indexOf("?") + 1;
            var vars = url.substring(start).split("&");
            for (var i = 0; i < vars.length; i++) {
                var pair = vars[i].split("=");
                var key = decodeURIComponent(pair[0]).toLowerCase();
                var value = decodeURIComponent(pair[1]).toLowerCase();
                if (key === "fr:reportmanager")
                    options.isReportManager = !(value === "false");
                else if (key === "fr:showbreadcrumb")
                    options.showBreadCrumb = !(value === "false");
                else if (key === "fr:reportmanagersettings")
                    options.useReportManagerSettings = !(value === "false");
                else if (key === "fr:showsubscriptiononopen")
                    options.showSubscriptionOnOpen = value;
                else if (key === "rc:toolbar")
                    options.showToolbar = !(value === "false");
                else if (key === "rc:parameters")
                    options.showParameterArea = value;
                else if (key === "rc:zoom")
                    options.zoom = value;
                else if (key === "rc:section")
                    try {
                        options.section = parseInt(value, 10);
                    } catch (e) {
                        options.section = 1;
                    }
                else if (key.indexOf("rc:") === 0)
                    options.deviceInfo[decodeURIComponent(pair[0]).substring(3, key.length - 1)] = decodeURIComponent(pair[1]);
            }
            return options;
        },

        cultureDateFormat: null,
        _setDateFormat: function (locData) {
            var format = locData.getLocData().datepicker.dateFormat;
            forerunner.ssr._internal.cultureDateFormat = format;
        },
        getDateFormat: function (locData) {
            if (!this.cultureDateFormat) {
                this._setDateFormat(locData);
            }
            return this.cultureDateFormat;
        },
        //standard date format like YYYY-MM-DD
        getStandardMomentDateFormat: function (locData) {
            return "YYYY-MM-DD";
        },
        //both standard and simplified date format like YYYY-M-D
        //this allow people enter data like 2002-1-1 in strict mode
        //moment.js support this from 2.3.0 on, we used 2.5.1 now
        getMomentDateFormat: function (locData) {
            var format = this.getDateFormat().toUpperCase(),
                           formatSimple = format.replace("DD", "D").replace("MM", "M");
            var formatlongDate = format.replace("YY", "YYYY");
            var formatSimplelongDate = formatSimple.replace("YY", "YYYY");

            return [format, formatSimple, formatlongDate, formatSimplelongDate];
        },

        init: function () {
            var me = this;

            //Only init once
            if (me.initDone === true)
                return;
            else
                me.initDone = true;

            //For IE browser when set placeholder browser will trigger an input event if it's Chinese
            //to avoid conflict (like auto complete) with other widget not use placeholder to do it
            //Anyway IE native support placeholder property from IE10 on, so not big deal
            //Also, we are letting the devs style it.  So we have to make userNative: false for everybody now.
            if (forerunner.device.isMSIE()) {
                forerunner.config.setWatermarkConfig({
                    useNative: false,
                    className: "fr-watermark"
                });
            }

            forerunner.styleSheet.updateDynamicRules(forerunner.styleSheet.internalDynamicRules());
            // Put a check in so that this would not barf for the login page.
            if ($.validator) {

                var locData = forerunner.localize;
                var error = locData.getLocData().validateError;

                //replace error message with custom data
                jQuery.extend(jQuery.validator.messages, {
                    required: error.required,
                    remote: error.remote,
                    email: error.email,
                    url: error.url,
                    date: error.date,
                    dateISO: error.dateISO,
                    number: error.number,
                    digits: error.digits,
                    maxlength: $.validator.format(error.maxlength),
                    minlength: $.validator.format(error.minlength),
                    rangelength: $.validator.format(error.rangelength),
                    range: $.validator.format(error.range),
                    max: $.validator.format(error.max),
                    min: $.validator.format(error.min),
                    autoCompleteDropdown: error.invalid,
                    invalidTree: error.invalidTree
                });

                // Add custom date validator rule
                $.validator.addMethod(
                    "formattedDate",
                    function (value, element) {
                        if ($.trim(value) === "") return true;

                        return moment(value, forerunner.ssr._internal.getMomentDateFormat(locData), true).isValid();
                    },
                    error.date
                );

                $.validator.addMethod(
                    "autoCompleteDropdown",
                    function (value, element, param) {
                        if ($(element).hasClass("fr-param-autocomplete-error"))
                            return false;
                        else
                            return true;
                    },
                    error.autoCompleteDropdown
                );

                $.validator.addMethod(
                    "cascadingTree",
                    function (value, element, param) {
                        if ($(element).hasClass("fr-param-cascadingtree-error"))
                            return false;
                        else
                            return true;
                    },
                    error.invalidTree
                );
            }
        }
    };
});

