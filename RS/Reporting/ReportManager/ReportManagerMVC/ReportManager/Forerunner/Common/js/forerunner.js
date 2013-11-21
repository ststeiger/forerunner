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
 * Contains the SQL Server Report datal
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
    mask: function () {
        var $mask = $(this).find(".fr-core-mask");

        if ($mask.length === 0) {
            $mask = $("<div class='fr-core-mask'></div>");
            $mask.height($(this).height() + 38);
            $(this).append($mask);
        }
        return $(this);
    },
    unmask: function () {
        $(this).find(".fr-core-mask").remove();
        return $(this);
    },
    multiLineEllipsis: function () {
        return this.each(function () {
            var el = $(this);

            if (el.css("overflow") == "hidden") {
                var text = el.html();
                var clone = $(this.cloneNode(true)).hide().css('position', 'absolute').css('overflow', 'visible').width(el.width()).height('auto');
                el.after(clone);

                function height() { return clone.height() > el.height(); };

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
            reportExplorerToolbar: "reportExplorerToolbar",
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
            drillBack: "drillback",
            /** widget + event, lowercase */
            reportViewerDrillBack: function () { return (forerunner.ssr.constants.widgets.reportViewer + this.drillBack).toLowerCase(); },

            /** @constant */
            drillThrough: "drillThrough",
            /** widget + event, lowercase */
            reportViewerDrillThrough: function () { return (forerunner.ssr.constants.widgets.reportViewer + this.drillThrough).toLowerCase(); },

            /** @constant */
            back: "back",
            /** widget + event, lowercase */
            reportViewerBack: function () { return (forerunner.ssr.constants.widgets.reportViewer + this.back).toLowerCase(); },

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
            modelChanged: "changed",
            /** widget + event, lowercase */
            parameterModelChanged: function () { return (forerunner.ssr.constants.widgets.parameterModel + this.modelChanged).toLowerCase(); },

            /** @constant */
            modelSetChanged: "setchanged",
            parameterModelSetChanged: function () { return (forerunner.ssr.constants.widgets.parameterModel + this.modelSetChanged).toLowerCase(); },
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
        _virtualRootBase : null,

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
            
            return this._getVirtualRootBase() + "/forerunner";
        },
        /**
         * Base path to the REST api controlers
         *
         * @member
         */
        forerunnerAPIBase: function () {
            return this._getVirtualRootBase() + "/api/";
        },
    };

    /**
     * Defines generic helper functions
     *
     * @namespace
     */
    forerunner.helper = {
        /**
         * Returns the number of elements or properties in an object
         *
         * @member
         *
         * @example
         *  var objectSize = forerunner.helper.objectSize(obj)
         *
         *  objectSize(obj);
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
                return paddingString.length >= width ? paddingString : _padLeft(replacementChar + paddingString, width, replacementChar || ' ');
            };

            var _s4 = function (number) {
                var hexadecimalResult = number.toString(16);
                return _padLeft(hexadecimalResult, 4, '0');
            };

            var _cryptoGuid = function () {
                var buffer = new window.Uint16Array(8);
                window.crypto.getRandomValues(buffer);
                return [_s4(buffer[0]) + _s4(buffer[1]), _s4(buffer[2]), _s4(buffer[3]), _s4(buffer[4]), _s4(buffer[5]) + _s4(buffer[6]) + _s4(buffer[7])].join('-');
            };

            var _guid = function () {
                var currentDateMilliseconds = new Date().getTime();
                return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (currentChar) {
                    var randomChar = (currentDateMilliseconds + Math.random() * 16) % 16 | 0;
                    currentDateMilliseconds = Math.floor(currentDateMilliseconds / 16);
                    return (currentChar === 'x' ? randomChar : (randomChar & 0x7 | 0x8)).toString(16);
                });
            };

            var hasRandomValues = false;
            var hasCrypto = typeof (window.crypto) != 'undefined';
            if (hasCrypto) {
                hasRandomValues = typeof (window.crypto.getRandomValues) != 'undefined';
            };

            return (hasCrypto && hasRandomValues) ? _cryptoGuid() : _guid();
        }
    },
    /**
     * Defines utility methods used to update style sheets
     *
     * @namespace
     */
    forerunner.styleSheet = {
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
         * Updates the given style sheet filename based upon the dynamic rule. Note that
         * this function assumes that the rule already exists in the css file and it
         * cannot be used to create new rules.
         *
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
         *  updateDynamicRules([isTouchRule]);
         */
        updateDynamicRules: function (dynamicRules, sheetname) {
            var sheet = forerunner.styleSheet._findSheet(sheetname);
            if (sheet) {
                var rules = (sheet.cssRules || sheet.rules);
                var rulesLength = rules.length;

                // Enumerate the rules
                for (var ruleIndex = 0; ruleIndex < rulesLength; ruleIndex++) {
                    var rule = rules[ruleIndex];
                    /*jshint loopfunc: true */
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
                                    rule.style.removeProperty(prop);
                                }
                            }
                        }
                    });
                    /*jshint loopfunc: false */
                }
            }
        },
    },
    /**
     * Defines the methods used to localize string data in the SDK.
     *
     * @namespace
     */
    forerunner.localize = {
        _locData: {},

        /**
         * Returns the language specific data.
         *
         * @param {String} locFileLocation - The localization file location without the language qualifier
         *
         * @return {object} Localization data
         */
        getLocData: function (locFileLocation) {
            var languageList = this._getLanguages();
            var i;
            var lang;
            var langData = null;

            if (languageList !== null && languageList !== undefined) {
                for (i = 0; i < languageList.length && langData === null; i++) {
                    lang = languageList[i];
                    lang = lang.toLocaleLowerCase();
                    langData = this._loadFile(locFileLocation, lang);
                }
                for ( i = 0; i < languageList.length && langData === null; i++) {
                    lang = languageList[i];
                    if (lang.length > 2) {
                        lang = lang.toLocaleLowerCase().substring(0, 2);
                        langData = this._loadFile(locFileLocation, lang);
                    }
                }
            }
            
            // When all fails, load English.
            if (langData === null)
                langData = this._loadFile(locFileLocation, "en");

            return langData;
            
        },
        _getLanguages: function () {
            var returnValue = null;
            $.ajax({
                url: forerunner.config.forerunnerAPIBase() + "/reportViewer/AcceptLanguage",
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
        _loadFile: function (locFileLocation, lang) {
            var me = this;
            if (me._locData[locFileLocation] === undefined)
                me._locData[locFileLocation] = {};
            if (me._locData[locFileLocation][lang] === undefined) {
                // This does not need to be wrapped because this should
                // not require authn,
                $.ajax({
                    url: locFileLocation + "-" + lang + ".txt",
                    dataType: "json",
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

        _getLoginUrl: function () {
            if (!this.loginUrl) {
                var returnValue = null;
                $.ajax({
                    url: forerunner.config.forerunnerAPIBase() + "/reportViewer/LoginUrl",
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

        /**
        * Wraps the $.ajax call and if the response status 302, it will redirect to login page. 
        *
        * @param {object} Options for the ajax call.
        * @member
        */
        ajax: function (options) {
            var errorCallback = options.error;
            var me = this;
            options.error = function (data) {
                if (data.status === 401 || data.status === 302) {
                    var loginUrl = me._getLoginUrl();
                    window.location.href = forerunner.config.forerunnerFolder() + "/../" + loginUrl + "?ReturnUrl=" + document.URL;
                }
                if (errorCallback)
                    errorCallback(data);
            };
            return $.ajax(options);
        },
        /**
        * Wraps the $.getJSON call and if the response status 401 or 302, it will redirect to login page. 
        *
        * @param {String} Url of the ajax call
        * @param {object} Options for the ajax call.
        * @param {function} Handler for the success path.
        * @param {function} Handler for the failure path.
        * @member
        */
        getJSON: function (url, options, done, fail) {
            var me = this;
            return $.getJSON(url, options)
            .done(function (data) {
                if (done)
                    done(data);
            })
            .fail(function (data) {
                if (data.status === 401 || data.status === 302) {
                    var loginUrl = me._getLoginUrl();
                    window.location.href = forerunner.config.forerunnerFolder() + "/../" + loginUrl + "?ReturnUrl=" + document.URL;
                }
                console.log(data);
                if (fail)
                    fail(data);
            });
        },
        /**
        * Wraps the $.post call and if the response status 401 or 302, it will redirect to login page. 
        *
        * @param {String} Url of the ajax call
        * @param {object} data for the ajax call.
        * @param {function} Handler for the success path.
        * @param {function} Handler for the failure path.
        * @member
        */
        post: function (url, data, success, fail) {
            var me = this;
            return $.post(url, data, function (data, textStatus, jqXHR) {
                if (success && typeof (success) === "function") {
                    success(data);
                }
            }).fail(function(data, textStatus, jqXHR) {
                if (data.status === 401 || data.status === 302) {
                    var loginUrl = me._getLoginUrl();
                    window.location.href = forerunner.config.forerunnerFolder() + "/../" + loginUrl + "?ReturnUrl=" + document.URL;
                }
                console.log(jqXHR);
                if (fail)
                    fail(data);
            });
        }
    };
    /**
     * Contains device specific methods.
     *
     * @namespace
     */
    forerunner.device = {
        /** @return {bool} Returns a boolean that indicates if the device is a touch device */
        isTouch: function () {
            return ("ontouchstart" in window) || (navigator.msMaxTouchPoints > 0);
        },
        /** @return {bool} Returns a boolean that indicates if the device is in portrait */
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
        /** @return {bool} Returns a boolean that indicates if the device is an iOS device */
        isiOS: function () {
            var ua = navigator.userAgent;
            return ua.match(/(iPhone|iPod|iPad)/);
        },
        /** @return {bool} Returns a boolean that indicates if the device is an iPhone or iPod device */
        isiPhone: function () {
            var ua = navigator.userAgent;
            return ua.match(/(iPhone|iPod)/);
        },
        /** @return {bool} Returns a boolean that indicates if the device is an iPad device */
        isiPad: function () {
            var ua = navigator.userAgent;
            return ua.match(/(iPad)/);
        },
        /** @return {bool} Returns a boolean that indicates if the device is an Firefox Browser  */
        isFirefox: function () {
            var ua = navigator.userAgent;
            return ua.match(/(Firefox)/);
        },
        /** @return {bool} Returns a boolean that indicates if the device is an Safari Browser  */
        isSafari: function () {
            var ua = navigator.userAgent;
            if (ua.indexOf("Safari") !== -1 && ua.indexOf("Chrome") === -1) {
                return true;
            }
            return false;
        },
        /** @return {bool} Returns a boolean that indicates if the device is an Safari Browser on  */
        isSafariPC: function () {
            var ua = navigator.userAgent;            
            if (ua.indexOf("Safari") !== -1 && ua.indexOf("Chrome") === -1 && ua.indexOf("Windows") !== -1) {
                return true;
            }
            return false;
        },
        /** @return {bool} Returns a boolean that indicates if the device is Microsoft IE Browser */
        isMSIE: function () {
            var ua = navigator.userAgent;
            return ua.match(/(MSIE)/);
        },
        /** @return {bool} Returns a boolean that indicates if the device is Microsoft IE 8 Browser */
        isMSIE8: function () {
            var ua = navigator.userAgent;
            return ua.match(/(MSIE 8)/);
        },
        /** @return {bool} Returns a boolean that indicates if the device is Microsoft IE 9 Browser */
        isMSIE9: function () {
            var ua = navigator.userAgent;
            return ua.match(/(MSIE 9)/);
        },
        /** @return {bool} Returns a boolean that indicates if the device is Microsoft IE Browser with the Touch key woard */
        isMSIEAndTouch :function () {
            var ua = navigator.userAgent;
            return ua.match(/(MSIE)/) !== null && ua.match(/(Touch)/) !== null;
        },
        /** @return {bool} Returns a boolean that indicates if the device is a Windows Phone */
        isWindowsPhone : function() {
            var ua = navigator.userAgent;
            return ua.match(/(Windows Phone)/) !== null;
        },
        /** @return {bool} Returns a boolean that indicates if the device is in the standalone mode */
        isStandalone: function () {
            if (window.navigator.standalone) {
                return true;
            }
            return false;
        },
        /** @return {bool} Returns a boolean that indicates if the device an iPhone and is in the fullscreen / landscape mode */
        isiPhoneFullscreen: function () {
            if (forerunner.device.isiPhone() && document.documentElement.clientHeight === 320) {
                return true;
            }
            return false;
        },
        /** @return {bool} Returns a boolean that indicates if the device is an Android device */
        isAndroid: function () {
            var ua = navigator.userAgent;
            return ua.match(/(Android)/) !== null;
        },

        /** @return {bool} Returns a boolean that indicates if it is a Chrome browser */
        isChrome : function () {
            var ua = navigator.userAgent;
            return ua.match(/(Chrome)/) !== null;
        },

        _allowZoomFlag : false,
        /** 
         * Sets up the viewport meta tag for scaling or fixed size based upon the given flag
         * @param {bool} flag - true = scale enabled (max = 10.0)
         */
        allowZoom: function (flag) {
            this._allowZoomFlag = flag;
            if (flag === true) {
                $("head meta[name=viewport]").remove();
                $("head").prepend("'<meta name='viewport' content='width=device-width, initial-scale=1, maximum-scale=10.0, minimum-scale=0, user-scalable=1' />");
            } else {
                $("head meta[name=viewport]").remove();
                $("head").prepend("<meta name='viewport' content='width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=0' />");
            }
        },

        /** 
         * Gets whether the view port allows zooming
         * @return {bool} flag - True if the view port allow zooming.
         */
        isAllowZoom : function() {
            return this._allowZoomFlag;
        },
      
        /** @return {float} Returns the zoom level, (document / window) width */
        zoomLevel: function(element){
            var ratio = document.documentElement.clientWidth / window.innerWidth;

            //alert(ratio);
            return ratio;
        },
        /** @return {bool} Returns a boolean that indicates if the element is inside the viewport */
        isElementInViewport: function (el) {
            var rect = el.getBoundingClientRect();

            return (
                rect.top >= 0 &&
                rect.left >= 0 &&
                rect.bottom <= (window.innerHeight || document. documentElement.clientHeight) && /*or $(window).height() */
                rect.right <= (window.innerWidth || document. documentElement.clientWidth) /*or $(window).width() */
                );
        },
                   
        /** @return {bool} Returns a boolean that indicates if device is small (I.e, height < 768) */
        isSmall: function () {
            if ($(window).height() < 768)
                return true;
            else
                return false;
        },
    };

    /**
    * Defines utility methods used to show and close modal dialog
    *
    * @namespace
    */
    forerunner.dialog = {
        /**
       * Show a modal dialog
       *
       * @function forerunner.dialog#showModalDialog
       * @param {function} $appContainer - Modal dialog container
       * @param {function} me - The element where the dialog is at
       */
        showModalDialog: function ($appContainer, me) {
            if (!forerunner.device.isWindowsPhone())
                $appContainer.trigger(forerunner.ssr.constants.events.showModalDialog);

            //if (showModal && typeof (showModal) === "function") {
            //    setTimeout(function () { showModal(); }, 50);
            //}

            setTimeout(function () {
                if (!me._dialogInit) {
                    me.element.dialog({
                        dialogClass: "noTitleStuff",
                        height: me.element.height(),
                        width: me.element.width(),
                        modal: true,
                        resizable: false,
                        draggable: false,
                        autoOpen: false,
                        position: ['center', 0],
                    }).removeClass("ui-widget-content").removeClass("ui-dialog-content").removeClass("ui-selectable-helper").siblings(".ui-dialog-titlebar").remove();
                    me._dialogInit = true;
                }

                me.element.dialog("open");
            }, 200);
        },
        /**
        * Close a modal dialog
        *
        * @function forerunner.dialog#closeModalDialog
        * @param {function} $appContainer - Modal dialog container
        * @param {function} me - The element where the dialog is at
        */
        closeModalDialog: function ($appContainer, me) {
            me.element.dialog("close");
            //if (closeModal && typeof (closeModal) === "function") {
            //    setTimeout(function () { closeModal(); }, 50);
            //}
            if (!forerunner.device.isWindowsPhone())
                $appContainer.trigger(forerunner.ssr.constants.events.closeModalDialog);
        },
        /**
        * close all opened modal dialogs with classname 'fr-dialog-id'
        *
        * @function forerunner.dialog#closeAllModalDialogs
        */
        closeAllModalDialogs: function () {
            var me = this;
            $(".fr-core-mask").remove();
            $(".fr-dialog-id").hide();
        },
        /**
        * Show message box by modal dialog
        *
        * @function forerunner.dialog#showMessageBox
        * @param {function} $appContainer - Modal dialog container
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
    $(document).ready(function () {
        // Update all dynamic styles
        var isTouchRule = {
            selector: ".fr-toolbase-hide-if-not-touch",
            properties: function () {
                var pairs = { display: "none" };
                if (forerunner.device.isTouch()) {
                    pairs.display = null;
                }
                return pairs;
            }
        };
        forerunner.styleSheet.updateDynamicRules([isTouchRule], "toolbase.css");
    });
});
