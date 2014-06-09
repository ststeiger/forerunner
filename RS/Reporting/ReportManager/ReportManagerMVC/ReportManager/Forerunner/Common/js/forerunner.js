/**
 * @file
 *  Defines forerunner SDK specific namespaces
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

/**
 * Contains the SQL Server Report data
 *
 * @namespace
 */
forerunner.ssr = forerunner.ssr || {};

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
    mask: function (onClick) {
        var $mask = $(this).find(".fr-core-mask");

        if ($mask.length === 0) {
            $mask = $("<div class='fr-core-mask'></div>");
            $mask.height($(this).height() + 38);
            $(this).append($mask);
        }
        if (onClick !== undefined)
            $mask.on("click", onClick);
        return $(this);
    },
    unmask: function (onClick) {

        var $mask = $(this).find(".fr-core-mask");
        if (onClick !== undefined)
            $mask.on("click", onClick);
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

                function height() { return clone.height() > el.height(); }

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
            saveAsDashboard: "saveAsDashboard",

            /** @constant */
            namespace: "forerunner",

            /**
             * @param {String} name of the widget.
             * @return {String} The fully qualified widget name (I.e., namespace.widgetname)
             */
            getFullname: function (name) {
                return this.namespace + "." + name;
            }
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
            /** widget + event, lowercase */
            reportExplorerBeforeFetch: function () { return (forerunner.ssr.constants.widgets.reportExplorer + this.beforeFetch).toLowerCase(); },

            /** @constant */
            paramAreaClick: "paramareaclick",
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
            actionHistoryPop: "actionHistoryPop",
            /** widget + event, lowercase */
            reportVieweractionHistoryPop: function () { return (forerunner.ssr.constants.widgets.reportViewer + this.actionHistoryPop).toLowerCase(); },

            /** @constant */
            changeReport: "changeReport",
            /** widget + event, lowercase */
            reportViewerChangeReport: function () { return (forerunner.ssr.constants.widgets.reportViewer + this.changeReport).toLowerCase(); },

            /** @constant */
            actionHistoryPush: "actionHistoryPush",
            /** widget + event, lowercase */
            reportVieweractionHistoryPush: function () { return (forerunner.ssr.constants.widgets.reportViewer + this.actionHistoryPush).toLowerCase(); },

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
            reportViewerNavToPosition: function () { return (forerunner.ssr.constants.widgets.reportViewer + this.navToPosition).toLowerCase();},

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
            afterLoadReport: "afterLoadReport",
            /** widget + event, lowercase */
            reportViewerAfterLoadReport: function () { return (forerunner.ssr.constants.widgets.reportViewer + this.afterLoadReport).toLowerCase(); },

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
            saveAsDashboardClose: function () { return (forerunner.ssr.constants.widgets.saveAsDashboard + this.close).toLowerCase(); },
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

        _endsWith : function(str, suffix) {
            return str.indexOf(suffix, str.length - suffix.length);
        },
        _getVirtualRootBase: function () {
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
            return this._virtualRootBase ===  null ? "" : this._virtualRootBase;
        },
        /**
         * Top level folder for the forerunner SDK files. Used to construct the path to the localization files.
         *
         * @member
         */
        forerunnerFolder: function ()
        {
            if (this._forerunnerFolderPath) return this._forerunnerFolderPath;
            return this._getVirtualRootBase() + "forerunner/";
        },
        /**
        * Override the forerunner folder path.  By default, it is the vroot + /forerunner.
        *
        * @param {String} Forerunner folder path.
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
         * @member
         */
        forerunnerAPIBase: function () {
            if (this._apiBase) return this._apiBase;
            return this._getVirtualRootBase() + "api/";
        },
        /**
        * Override the api base.  By default, it is the vroot + /api.
        *
        * @param {String} API Base.
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
        * @param {Object} Custom Settings Object
        */
        setCustomSettings: function (settingObject) {
            this._customSettings = settingObject;
        },

        /**
         * Get custom settings object, will retrieve from default location if not set.
         *
         * 
         */
        getCustomSettings: function () {
            if (this._customSettings === null) {
                $.ajax({
                    url: forerunner.config.forerunnerFolder() + "../Custom/MobilizerSettings.txt",
                    dataType: "json",
                    async: false,
                    success: function (data) {
                        forerunner.config._customSettings = data;
                    },
                    fail: function () {
                        console.log("Load mobilizer custom settings failed");
                    },
                    error: function (jqXHR, textStatus, errorThrown) {
                        console.log("Load mobilizer custom settings .  " + textStatus);
                    },
                });
            }

            return this._customSettings;
        },
        /**
         * Get list of mobilizer shared schedule, which everybody can read, unlike the RS shared schedule.
         *
         * 
         */
        getMobilizerSharedSchedule: function () {
            if (!this._forerunnerSharedSchedule) {
                $.ajax({
                    url: forerunner.config.forerunnerFolder() + "../Custom/MobilizerSharedSchedule.txt",
                    dataType: "json",
                    async: false,
                    success: function (data) {
                        forerunner.config._forerunnerSharedSchedule = data.SharedSubscriptions;
                    },
                    fail: function () {
                        console.log("Load mobilizer custom settings failed");
                    },
                    error: function (jqXHR, textStatus, errorThrown) {
                        console.log("Load mobilizer custom settings .  " + textStatus);
                    },
                });
            }

            return this._forerunnerSharedSchedule;
        },
        /**
       * Get user custom settings
       *
       * @param {string} value to get.
       * @param {var} default if not set
       */
        getCustomSettingsValue: function (setting, defaultval) {
            var settings = this.getCustomSettings();
            if (settings && settings[setting])
                return settings[setting];
            else
                return defaultval;
        },
    };

    /**
     * Defines generic helper functions
     *
     * @namespace
     */
    forerunner.helper = {

        /**
         * Returns a number array sorted in the given direction
         *
         * @member
         * @param {array} array - Array to sort
         * @param {boolean} asc - true for ascending false for decending
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
         * @return {Boolean} - element contain one of the class list or not
         *
         * @member
         */
        containElement: function (element, classList) {
            var isContained = false;

            $.each(classList, function (index, className) {
                if ($(element).hasClass(className)) {
                    isContained = true;
                } else {
                    var parent = element.parentElement;
                    while (parent !== undefined && parent !== null) {
                        if ($(parent).hasClass(className)) {
                            isContained = true;
                            break;
                        }
                        parent = parent.parentElement;
                    }
                }

                if (isContained)
                    return false; //break the $.each loop if isCOntained === true
            });
                       
            return isContained;
        },
        /**
         * Returns a new div of the specified classes.
         *
         * @params {Array} listOfClassed - List of classes for the new div.
         * @return {Object} - element contain one of the class list or not
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
        * Returns a checkbox dropdown list for the valid values
        *
        * @param List of valid values.  validValue.Label is the label and validValue.Value is the value.
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
        * Returns a div filled with radio buttons for the valid values.
        *
        * @param List of valid values.  validValue.Label is the label and validValue.Value is the value.
        * @param identifier - An identifier for that option.
        * @param callback -- event handler for the onclick
        */
        createRadioButtonsForValidValues: function (validValues, identifier, callback) {
            return this._createInput(validValues, identifier, "radio", callback);
        },
        /**
        * Returns a div filled with radio buttons for the valid values.
        *
        * @param List of valid values.  validValue.Label is the label and validValue.Value is the value.
        * @param identifier - An identifier for that option.
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

        hasAttr: function ($control, attribute) {
            return typeof ($control.attr(attribute)) !== "undefined";
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
                var rulesLength = rules.length;

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
    },
    /**
     * Defines the methods used to localize string data in the SDK.
     *
     * @namespace
     */
    forerunner.localize = {
        _locData: {},

        _getFallBackLanguage: function (locFileLocation, lang, dataType) {
            if (lang.length > 2) {
                lang = lang.toLocaleLowerCase().substring(0, 2);
                return this._loadFile(locFileLocation, lang, dataType);
            }
            return null;
        },
        
        /**
         * Returns the language specific data.
         *
         * @param {String} locFileLocation - The localization file location without the language qualifier
         * @param {String} dataType - optional, ajax dataType. defaults to "json"
         *
         * @return {Object} Localization data
         */
        getLocData: function (locFileLocation, dataType) {
            var languageList = this._getLanguages();
            var i;
            var lang;
            var langData = null;

            if (languageList !== null && languageList !== undefined) {
                for (i = 0; i < languageList.length && langData === null; i++) {
                    lang = languageList[i];
                    lang = lang.toLocaleLowerCase();
                    langData = this._loadFile(locFileLocation, lang, dataType);
                    if (forerunner.device.isAndroid() && langData === null) {
                        langData = this._getFallBackLanguage(locFileLocation, lang);
                    }
                }
                if (!forerunner.device.isAndroid()) {
                    for ( i = 0; i < languageList.length && langData === null; i++) {
                        lang = languageList[i];
                        langData = this._getFallBackLanguage(locFileLocation, lang, dataType);
                    }
                }
            }
            
            // When all fails, load English.
            if (langData === null)
                langData = this._loadFile(locFileLocation, "en", dataType);

            return langData;
            
        },
        _getLanguages: function () {
            var returnValue = null;
            $.ajax({
                url: forerunner.config.forerunnerAPIBase() + "reportViewer/AcceptLanguage",
                dataType: "json",
                async: false,
                success: function (data) {
                    returnValue = data;
                },
                fail: function () {
                    returnValue = null;
                },
                error: function (jqXHR, textStatus, errorThrown) {
                    returnValue = null;
                },
            });
            return returnValue;
        },        
        _loadFile: function (locFileLocation, lang, dataType) {
            var me = this;
            if (!dataType) {
                dataType = "json";
            }
            if (me._locData[locFileLocation] === undefined)
                me._locData[locFileLocation] = {};
            if (me._locData[locFileLocation][lang] === undefined) {
                // This does not need to be wrapped because this should
                // not require authn,
                $.ajax({
                    url: locFileLocation + "-" + lang + ".txt",
                    dataType: dataType,
                    async: false,
                    success: function (data) {
                        me._locData[locFileLocation][lang] = data;
                    },
                    fail: function () {
                        me._locData[locFileLocation][lang] = null;
                    },
                    error: function ( jqXHR ,textStatus, errorThrown) {
                        me._locData[locFileLocation][lang] = null;
                    },
                });

            }
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
        isFormsAuth: function () {
            var url = this._getLoginUrl();
            return (url && url.length > 0);
        },
        _getLoginUrl: function () {
            if (!this.loginUrl) {
                var returnValue = null;
                $.ajax({
                    url: forerunner.config.forerunnerAPIBase() + "reportViewer/LoginUrl",
                    dataType: "json",
                    async: false,
                    success: function (data) {
                        returnValue = data;
                    },
                    fail: function () {
                        returnValue = null;
                    },
                    error: function (jqXHR, textStatus, errorThrown) {
                        returnValue = null;
                    },
                });

                if (returnValue) {
                    this.loginUrl = returnValue.LoginUrl.replace("~", "");
                }
            }

            return this.loginUrl;
        },

        _handleRedirect: function (data) {
            var me = this;
            if (data.status === 401 || data.status === 302) {
                var loginUrl = me._getLoginUrl();
                var urlParts = document.URL.split("#");
                var redirectTo = forerunner.config.forerunnerFolder() + "../" + loginUrl + "?ReturnUrl=" + urlParts[0];
                if (urlParts.length > 1) {
                    redirectTo += "&HashTag=";
                    redirectTo += urlParts[1];
                }
                window.location.href = redirectTo;
            }
        },
        /**
        * Wraps the $.ajax call and if the response status 302, it will redirect to login page. 
        *
        * @param {Object} options - Options for the ajax call.
        * @member
        */
        ajax: function (options) {
            var me = this;
            var errorCallback = options.error;
            var successCallback = options.success;
            options.success = null;

            if (options.fail)
                errorCallback = options.fail;
           
            var jqXHR = $.ajax(options);

            if (options.done)
                jqXHR.done(options.done);
            if (successCallback)
                jqXHR.done(successCallback);


            jqXHR.fail( function (jqXHR, textStatus, errorThrown) {
                me._handleRedirect(jqXHR);
                if (errorCallback)
                    errorCallback(jqXHR, textStatus, errorThrown,this);
            });
            return jqXHR;
        },
        /**
        * Wraps the $.getJSON call and if the response status 401 or 302, it will redirect to login page. 
        *
        * @param {String} url - Url of the ajax call
        * @param {Object} options - Options for the ajax call.
        * @param {function} done - Handler for the success path.
        * @param {function} fail - Handler for the failure path.
        * @member
        */
        getJSON: function (url, options, done, fail) {
            var me = this;
            return $.getJSON(url, options)
            .done(function (data) {
                if (done)
                    done(data);
            })
            .fail(function (jqXHR, textStatus, errorThrown) {
                me._handleRedirect(jqXHR);
                console.log(jqXHR);
                if (fail)
                    fail(jqXHR, textStatus, errorThrown,this);
            });
        },
        /**
        * Wraps the $.post call and if the response status 401 or 302, it will redirect to login page. 
        *
        * @param {String} url - Url of the ajax call
        * @param {Object} data - data for the ajax call.
        * @param {function} success - Handler for the success path.
        * @param {function} fail - Handler for the failure path.
        * @member
        */
        post: function (url, data, success, fail) {
            var me = this;
            return $.post(url, data, function (data, textStatus, jqXHR) {
                if (success && typeof (success) === "function") {
                    success(data);
                }
            }).fail(function (jqXHR, textStatus, errorThrown) {
                me._handleRedirect(jqXHR);
                console.log(jqXHR);
                if (fail)
                    fail(jqXHR, textStatus, errorThrown,this);
            });
        },
        /**
        * Returns json data indicating is the user has the requested permission for the given path
        *
        * @param {String} path - fully qualified path to the resource
        * @param {String} permission - Requested permission
        */
        hasPermission: function (path, permission) {
            var permissionData = null;

            var url = forerunner.config.forerunnerAPIBase() + "ReportManager/HasPermission" +
                "?path=" + encodeURIComponent(path) +
                "&permission=" + permission;
            forerunner.ajax.ajax({
                url: url,
                dataType: "json",
                async: false,
                success: function (data) {
                    permissionData = data;
                },
                fail: function (jqXHR) {
                    console.log("hasPermission() - " + jqXHR.statusText);
                    console.log(jqXHR);
                }
            });
            return permissionData;
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
            return ua.match(/(iPhone|iPod|iPad)/);
        },
        /** @return {Boolean} Returns a boolean that indicates if the device is an iPhone or iPod device */
        isiPhone: function () {
            var ua = navigator.userAgent;
            return ua.match(/(iPhone|iPod)/);
        },
        /** @return {Boolean} Returns a boolean that indicates if the device is an iPad device */
        isiPad: function () {
            var ua = navigator.userAgent;
            return ua.match(/(iPad)/);
        },
        /** @return {Boolean} Returns a boolean that indicates if the device is an Firefox Browser  */
        isFirefox: function () {
            var ua = navigator.userAgent;
            return ua.match(/(Firefox)/);
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
            return (ua.match(/(MSIE)/) || ua.match(/(.NET)/));  //Handle IE11
        },
        /** @return {Boolean} Returns a boolean that indicates if the device is Microsoft IE 8 Browser */
        isMSIE8: function () {
            var ua = navigator.userAgent;
            return ua.match(/(MSIE 8)/);
        },
        /** @return {Boolean} Returns a boolean that indicates if the device is Microsoft IE 9 Browser */
        isMSIE9: function () {
            var ua = navigator.userAgent;
            return ua.match(/(MSIE 9)/);
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
            return ua.match(/(Chrome)/) !== null;
        },

        /** @return {Boolean} Returns a boolean that indicates if it is a Mobile device */
        isMobile: function(){
            var me = this;

            return (me.isiOS() || me.isAndroid() || me.isWindowsPhone());
            
        },

        _allowZoomFlag : false,
        /** 
         * Sets up the viewport meta tag for scaling or fixed size based upon the given flag
         * @param {Boolean} flag - true = scale enabled (max = 10.0), false = scale disabled
         */
        allowZoom: function (flag) {
            this._allowZoomFlag = flag;
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

    /**
    * Defines the methods used to modal dialog.
    *
    * @namespace
    */
    forerunner.dialog = {
        /**
       * Show a modal dialog with appContainer and target dialog container specify
       *
       * @function forerunner.dialog#showModalDialog
       * @param {Object} $appContainer - app Container
       * @param {Object} target - object that modal dialog apply to
       */
        showModalDialog: function ($appContainer, target) {
            var me = this;
            if (!forerunner.device.isWindowsPhone())
                $appContainer.trigger(forerunner.ssr.constants.events.showModalDialog);

            setTimeout(function () {
                if (!target.element.parent().hasClass("ui-dialog")) {
                    target.element.dialog({
                        dialogClass: "noTitleStuff",
                        height: "auto",
                        width: "auto",
                        modal: true,
                        resizable: false,
                        draggable: false,
                        autoOpen: false,
                        position: ["center", 0],
                    }).removeClass("ui-widget-content").removeClass("ui-dialog-content").removeClass("ui-selectable-helper").siblings(".ui-dialog-titlebar").remove();
                    //target._dialogInit = true;
                }

                //modal dialog will highlight the first matched button, add blur to remove it
                target.element.dialog("open");
                target.element.find(":button").blur();
                
                me._removeEventsBinding();
                //reset modal dialog position when window resize happen or orientation change
                $(window).on("resize", { target: target, me: me }, me._setPosition);
                $(document).on("keyup", { target: target }, me._bindKeyboard);
            }, 200);
        },
        /**
        * Close a modal dialog with appContainer and target dialog container specify
        *
        * @function forerunner.dialog#closeModalDialog
        * @param {Object} $appContainer - app Container
        * @param {Object} target - object that modal dialog apply to
        */
        closeModalDialog: function ($appContainer, target) {
            var me = this;

            me._removeEventsBinding();
            target.element.dialog("destroy");
            target.element.hide();

            if (!forerunner.device.isWindowsPhone())
                $appContainer.trigger(forerunner.ssr.constants.events.closeModalDialog);
        },
        /**
        * Close all opened modal dialogs in specify appContainer
        *
        * @function forerunner.dialog#closeAllModalDialogs
        * @param {Object} $appContainer - app Container
        */
        closeAllModalDialogs: function ($appContainer) {
            var me = this;

            me._removeEventsBinding();

            $.each($appContainer.find(".fr-dialog-id"), function (index, modalDialog) {
                if ($(modalDialog).is(":visible")) {
                    $(modalDialog).dialog("destroy");
                }
            });
        },
        /**
        * Show message box
        *
        * @function forerunner.dialog#showMessageBox
        * @param {Object} $appContainer - app Container
        * @param {String} msg - message content
        * @param {String} caption - modal dialog caption
        */
        showMessageBox: function ($appContainer, msg, caption) {
            var $msgBox = $appContainer.find(".fr-messagebox");
            if ($msgBox.length === 0) {
                $msgBox = $("<div class='fr-messagebox fr-dialog-id fr-core-dialog-layout fr-core-widget'/>");
                $msgBox.messageBox({ $appContainer: $appContainer });
                $appContainer.append($msgBox);
            }
            $msgBox.messageBox("openDialog", msg, caption);
        },
        /**
        * Get modal dialog static header html snippet
        *
        * @function forerunner.dialog#getModalDialogHeaderHtml
        * @param {String} iconClass - icon class to specific icon position
        * @param {String} title - modal dialog title
        * @param {String} cancelClass - cancel button class name
        * @param {String} cancelWord - cancel button's text
        *
        * @return {String} - modal dialog header html snippet
        */
        getModalDialogHeaderHtml: function (iconClass, title, cancelClass, cancelWord) {
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
                            "</div>" +
                            "<div class='fr-core-dialog-cancel-container'>" +
                                "<input type='button' class='fr-core-dialog-cancel " + cancelClass + "' value='" + cancelWord + "' />" +
                            "</div>" +
                       "</div>";
            return html;
        },
        _timer: null,
        _setPosition: function (event) {
            var me = event.data.me;

            if (me._timer) {
                clearTimeout(me._timer);
                me._timer = null;
            }

            me._timer = setTimeout(function () {
                var target = event.data.target;
                if (target && target.element.is(":visible")) {
                    var uiDialog = target.element.parent();
                    if (uiDialog.is(":visible")) {
                        var clone = uiDialog.clone().appendTo(uiDialog.parent());
                        var newTop = clone.css("position", "static").offset().top * -1;
                        uiDialog.css("top", newTop);
                        clone.remove();
                    }
                }

                me._timer = null;
            }, 100);
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
            
            if (me._timer) {
                clearTimeout(me._timer);
                me._timer = null;
            }

            $(window).off("resize", me._setPosition);
            $(document).off("keyup", me._bindKeyboard);
        }
    };

    forerunner.ssr.map = function(initialData) {
        // can pass initial data for the set in an object
        this.data = initialData || {};
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
                if (ssrsPram !== "rs:" && ssrsPram !== "rc:") {
                    params.push({ "Parameter": key, "Value": value, "IsMultiple": "false", Type: "" });
                }
            }
            return params;
        },

        cultureDateFormat: null,
        _setDateFormat: function () {
            var locData = forerunner.localize.getLocData(forerunner.config.forerunnerFolder() + "ReportViewer/loc/ReportViewer");

            //set golbal date format
            var format = locData.datepicker.dateFormat;
            forerunner.ssr._internal.cultureDateFormat = format;
        },
        getDateFormat: function () {
            if (!this.cultureDateFormat) {
                this._setDateFormat();
            }
            return this.cultureDateFormat;
        },
        getMomentDateFormat: function () {
            if (!this.cultureDateFormat) {
                this._setDateFormat();
            }

            return this.cultureDateFormat.toUpperCase().replace("YY", "YYYY");
        },
        
    };
    $(document).ready(function () {
        //show element when touch screen rule for toolbase
        var touchShowRule = {
            selector: ".fr-toolbase-show-if-touch",
            properties: function () {
                var pairs = { display: "none" };
                if (forerunner.device.isTouch()) {
                    pairs.display = null;
                }
                return pairs;
            }
        };
        //show element when touch screen rule for toolpane
        var touchShowRuleTp = {
            selector: ".fr-toolpane .fr-toolbase-show-if-touch",
            properties: function () {
                var pairs = { display: "none" };
                if (forerunner.device.isTouch()) {
                    pairs.display = null;
                }
                return pairs;
            }
        };
        //hide element when touch screen rule for toolbase
        var touchHideRule = {
            selector: ".fr-toolbase-hide-if-touch",
            properties: function () {
                var pairs = { display: null };
                if (forerunner.device.isTouch()) {
                    pairs.display = "none";
                }
                return pairs;
            }
        };
        //hide element when touch screen rule for toolpane
        var touchHideRuleTp = {
            selector: ".fr-toolpane .fr-toolbase-hide-if-touch",
            properties: function () {
                var pairs = { display: null };
                if (forerunner.device.isTouch()) {
                    pairs.display = "none";
                }
                return pairs;
            }
        };
        
        forerunner.styleSheet.updateDynamicRules([touchShowRule, touchShowRuleTp, touchHideRule, touchHideRuleTp]);
        // Put a check in so that this would not barf for the login page.
        if ($.validator) {
            var locData = forerunner.localize.getLocData(forerunner.config.forerunnerFolder() + "ReportViewer/loc/ReportViewer");
            var error = locData.validateError;

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
                    return moment(value, forerunner.ssr._internal.getMomentDateFormat(), true).isValid();
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
    });
});
