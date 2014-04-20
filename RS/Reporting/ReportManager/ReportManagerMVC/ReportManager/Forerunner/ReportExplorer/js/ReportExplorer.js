﻿/**
 * @file Contains the reportExplorer widget.
 *
 */

var forerunner = forerunner || {};
forerunner.ssr = forerunner.ssr || {};

$(function () {
    var widgets = forerunner.ssr.constants.widgets;
    var locData = forerunner.localize.getLocData(forerunner.config.forerunnerFolder() + "ReportViewer/loc/ReportViewer");
    /**
     * Widget used to explore available reports and launch the Report Viewer
     *
     * @namespace $.forerunner.reportExplorer
     * @prop {Object} options - The options for reportExplorer
     * @prop {String} options.reportManagerAPI - Path to the report manager REST API calls
     * @prop {String} options.forerunnerPath - Path to the top level folder for the SDK
     * @prop {String} options.path - Path passed to the GetItems REST call
     * @prop {String} options.view - View passed to the GetItems REST call
     * @prop {String} options.selectedItemPath - Set to select an item in the explorer
     * @prop {Object} options.$scrollBarOwner - Used to determine the scrollTop position
     * @prop {Object} options.navigateTo - Callback function used to navigate to a slected report
     * @prop {Object} options.$appContainer - Report page container
     * @prop {Object} options.explorerSettings - Object that stores custom explorer style settings
     * @prop {String} options.rsInstance - Report service instance name
     * @example
     * $("#reportExplorerId").reportExplorer({
     *  reportManagerAPI: "./api/ReportManager",
     *  forerunnerPath: "./forerunner/",
     *  path: "/",
     *  view: "catalog",
     *  navigateTo: navigateTo,
     *  $appContainer: me.$container,
     *  explorerSettings: explorerSettings
     * });
     */
    $.widget(widgets.getFullname(widgets.reportExplorer), /** @lends $.forerunner.reportExplorer */ {
        options: {
            reportManagerAPI: forerunner.config.forerunnerAPIBase() + "ReportManager",
            forerunnerPath: forerunner.config.forerunnerFolder(),
            path: null,
            view: null,
            selectedItemPath: null,
            $scrollBarOwner: null,
            navigateTo: null,
            $appContainer: null,
            explorerSettings: null,
            rsInstance: null,
            isAdmin: false,
        },
        /**
         * Save the user settings
         * @function $.forerunner.reportExplorer#saveUserSettings
         *
         * @param {Object} settings - Settings object
         */
        saveUserSettings: function (settings) {
            var me = this;

            var stringified = JSON.stringify(settings);

            var url = forerunner.config.forerunnerAPIBase() + "ReportManager" + "/SaveUserSettings?settings=" + stringified;
            if (me.options.rsInstance) url += "&instance=" + me.options.rsInstance;
            forerunner.ajax.ajax({
                url: url,
                dataType: "json",
                async: false,
                success: function (data) {
                },
                error: function (data) {
                    console.log(data);
                }
            });

        },
        /**
         * Get the user settings.
         * @function $.forerunner.reportExplorer#getUserSettings
         *
         * @param {Boolean} forceLoadFromServer - if true, always load from the server
         *
         * @return {Object} - User settings
         */
        getUserSettings: function (forceLoadFromServer) {
            var me = this;

            if (forceLoadFromServer !== true && me.userSettings) {
                return me.userSettings;
            }

            var settings = forerunner.ssr.ReportViewerInitializer.prototype.getUserSettings(me.options);
            if (settings) {
                me.userSettings = settings;
            }

            return me.userSettings;
        },
        _generatePCListItem: function (catalogItem, isSelected) {
            var me = this; 
            var reportThumbnailPath = me.options.reportManagerAPI
              + "/Thumbnail/?ReportPath=" + encodeURIComponent(catalogItem.Path) + "&DefDate=" + catalogItem.ModifiedDate;
            if (me.options.rsInstance)
                reportThumbnailPath += "&instance=" + me.options.rsInstance;
            //Item
            var $item = new $("<div />");
            $item.addClass("fr-explorer-item");
            if (isSelected)
                $item.addClass("fr-explorer-item-selcted");

            var $anchor = new $("<a />");
            //action
            var action;
            if (catalogItem.Type === 1 || catalogItem.Type === 7)
                action = "explore";
            else if (catalogItem.Type === 3)
                action = "open";
            else
                action = "browse";

            $anchor.on("click", function (event) {
                if (me.options.navigateTo) {
                    me.options.navigateTo(action, catalogItem.Path);
                }
            });
            $item.append($anchor);


            //Image Block
            var $imageblock = new $("<div />");
            $imageblock.addClass("fr-report-item-image-block");
            $anchor.append($imageblock);
            var outerImage = new $("<div />");            
            $imageblock.append(outerImage);
           

            //Images
            
            if (catalogItem.Type === 1 || catalogItem.Type === 7)
                if (isSelected) {
                    outerImage.addClass("fr-explorer-folder-selected");
                }
                else {
                    outerImage.addClass("fr-explorer-folder");
                }
            else if (catalogItem.Type === 3) {//resource files
                outerImage.addClass("fr-icons128x128");

                var fileTypeClass = me._getFileTypeClass(catalogItem.MimeType);
                outerImage.addClass(fileTypeClass);
            }
            else {
                
                var innerImage = new $("<img />");                
                $imageblock.append(innerImage);
                var corner = new $("<div />");
                $imageblock.append(corner);
                corner.addClass("fr-explorer-item-earcorner");
                corner.css("background-color", me.$UL.css("background-color"));
                var EarImage = new $("<div />");
                $imageblock.append(EarImage);
                var imageSrc =  reportThumbnailPath;
                innerImage.addClass("fr-report-item-inner-image");
                innerImage.addClass("fr-report-item-image-base");
                outerImage.addClass("fr-report-item-image-base");
                EarImage.addClass("fr-report-item-image-base");
                if (isSelected) {
                    outerImage.addClass("fr-report-item-outer-image-selected");
                    EarImage.addClass("fr-explorer-item-ear-selcted");                   
                }
                else {
                    outerImage.addClass("fr-report-item-outer-image");                    
                    EarImage.addClass("fr-report-item-ear-image");
                }
               
                innerImage.attr("src", imageSrc);
                innerImage.error(function () {
                    $(this).attr("src", me.options.forerunnerPath + "ReportExplorer/images/Report-icon.png");
                });
                
                innerImage.removeAttr("height"); //JQuery adds height for IE8, remove.
            }
            if (isSelected)
                me.$selectedItem = $item;

            
            
            //Caption
            var $caption = new $("<div />");
            $caption.addClass("fr-explorer-caption");
            var $captiontext = new $("<div />");
            $captiontext.addClass("fr-explorer-item-title");
            $captiontext.attr("title", catalogItem.Name);
            $captiontext.html(catalogItem.Name);
            $caption.append($captiontext);
            $item.append($caption);            
           
            return $item;
        },
        _renderPCView: function (catalogItems) {
            var me = this;

            me.$UL = me.element.find(".fr-report-explorer");
            var decodedPath = me.options.selectedItemPath ? decodeURIComponent(me.options.selectedItemPath) : null;
            me.rmListItems = new Array(catalogItems.length);
            
            for (var i = 0; i < catalogItems.length; i++) {
                var catalogItem = catalogItems[i];
                var isSelected = false;
                if (decodedPath && decodedPath === decodeURIComponent(catalogItem.Path)) {
                    me.selectedItem = i;
                    isSelected = true;
                }
                me.rmListItems[i] = me._generatePCListItem(catalogItem, isSelected);
                me.$UL.append(me.rmListItems[i]);
            }
            me.$UL.find(".fr-explorer-item-title").multiLineEllipsis();
        },
        _render: function (catalogItems) {
            var me = this;
            me.element.html("<div class='fr-report-explorer fr-core-widget'></div>");
            if (me.colorOverrideSettings && me.colorOverrideSettings.explorer) {
                $(".fr-report-explorer", me.element).addClass(me.colorOverrideSettings.explorer);
            }
            me._renderPCView(catalogItems);
            if (me.$selectedItem) {
                setTimeout(function () { me.$explorer.scrollTop(me.$selectedItem.offset().top - 50); }, 100);  //This is a hack for now
                setTimeout(function () { me.$explorer.scrollLeft(me.$selectedItem.offset().left - 20); }, 100);  //This is a hack for now
            } else {
                setTimeout(function () { me.$explorer.scrollTop(0); }, 100);
                setTimeout(function () { me.$explorer.scrollLeft(0); }, 100);
            }
        },
        _renderResource: function (path) {
            var me = this;

            var url = me.options.reportManagerAPI + "/Resource?"
            url += "path=" + encodeURIComponent(path);
            url += "&instance=" + me.options.rsInstance;

            var $if = $("<iframe/>")
            $if.addClass("fr-report-explorer fr-core-widget");
            $if.attr("src", url);
            $if.attr("scrolling", "no");
            $if.css("width", "100%");
            $if.css("height", "100%");
            $if.css("overflow", "hidden");
            me.element.append($if);

            $if.load(function () {
                this.style.height = $(this.contentWindow.document.body).outerHeight() + 'px';
            });

            
        },

        _fetch: function (view,path) {
            var me = this;

            if (view === "resource") {
                me._renderResource(path);
                return;
            }

            var url = me.options.reportManagerAPI + "/GetItems";
            if (me.options.rsInstance) url += "?instance=" + me.options.rsInstance;
            forerunner.ajax.ajax({
                dataType: "json",
                url: url,
                async: false,
                data: {
                    view: view,
                    path: path                    
                },
                success: function (data) {
                    if (data.Exception) {
                        forerunner.dialog.showMessageBox(me.options.$appContainer, data.Exception.Message, locData.messages.catalogsLoadFailed);
                    }
                    else {
                        me._render(data);
                    }
                },
                error: function (data) {
                    console.log(data);
                    forerunner.dialog.showMessageBox(me.options.$appContainer, locData.messages.catalogsLoadFailed);
                }
            });
        },
        _initCallbacks: function () {
            var me = this;
            // Hook up any / all custom events that the report viewer may trigger
        },
        _initOverrides: function () {
            var me = this;
            if (me.options.explorerSettings.CustomColors) {
                var decodedPath = decodeURIComponent(me.options.path);
                var colorOverrideSettings = me.options.explorerSettings.CustomColors[decodedPath];
                if (colorOverrideSettings) {
                    me.colorOverrideSettings = colorOverrideSettings;
                    // Optimize for an exact match
                    return;
                }
                for (var key in me.options.explorerSettings.CustomColors) {
                    if (decodedPath.indexOf(key, 0) === 0) {
                        me.colorOverrideSettings = me.options.explorerSettings.CustomColors[key];
                        return;
                    }
                }
            }
        },
        _init: function () {
            var me = this;
            me.$RMList = null;
            me.$UL = null;
            me.rmListItems = null;
            me.colorOverrideSettings = null;
            me.selectedItem = 0;
            me.isRendered = false;
            me.$explorer = me.options.$scrollBarOwner ? me.options.$scrollBarOwner : $(window);
            me.$selectedItem = null;
            me.findKeywordList = me.findKeywordList || [];
            me.priorKeyword = null;

            if (me.options.explorerSettings) {
                me._initOverrides();
            }
            me._fetch(me.options.view, me.options.path);

            me.userSettings = {
                responsiveUI: false
            };
            me.getUserSettings(true);

            var $dlg = me.options.$appContainer.find(".fr-us-section");
            if ($dlg.length === 0) {
                $dlg = $("<div class='fr-us-section fr-dialog-id fr-core-dialog-layout fr-core-widget'/>");
                $dlg.userSettings({
                    $appContainer: me.options.$appContainer,
                    $reportExplorer: me.element
                });
                me.options.$appContainer.append($dlg);
                me._userSettingsDialog = $dlg;
            }
        },
        /**
         * Show the user settings modal dialog.
         *
         * @function $.forerunner.reportExplorer#showUserSettingsDialog
         */
        showUserSettingsDialog : function() {
            var me = this;
            me._userSettingsDialog.userSettings("openDialog");
        },
        reportExplorerBack: function () {
            var me = this;

            if (me.findKeywordList.length === 0) {
                me.options.navigateTo("back", null);
            }
            else if (me.findKeywordList.length === 1) {
                me.$selectedItem = me.findKeywordList.pop();
                me._fetch(me.options.view, me.options.path);
            }
            else {
                me.findItems(me.findKeywordList.pop(), "back");
            }
        },
        findItems: function (keyword, actionType) {
            var me = this;

            if (keyword === "") {
                forerunner.dialog.showMessageBox(me.options.$appContainer, "Please input valid keyword", "Prompt");
                return;
            }

            if (me.findKeywordList.length === 0 && me.$selectedItem) {
                me.findKeywordList.push(me.$selectedItem);
                me.$selectedItem = null;
            }

            if (actionType === "push" && me.priorKeyword) {
                me.findKeywordList.push(me.priorKeyword);
            }

            me.priorKeyword = keyword;

            var url = me.options.reportManagerAPI + "/FindItems";
            if (me.options.rsInstance) url += "?instance=" + me.options.rsInstance;
            var searchCriteria = { SearchCriteria: [{ Key: "Name", Value: keyword }, { Key: "Description", Value: keyword }] };

            forerunner.ajax.ajax({
                dataType: "json",
                url: url,
                async: false,
                data: {
                    searchCriteria: JSON.stringify(searchCriteria)
                },
                success: function (data) {
                    if (data.Exception) {
                        forerunner.dialog.showMessageBox(me.options.$appContainer, data.Exception.Message, locData.messages.catalogsLoadFailed);
                    }
                    else {
                        me._render(data);
                        console.log(data);
                    }
                },
                error: function (data) {
                    console.log(data);
                    forerunner.dialog.showMessageBox(me.options.$appContainer, locData.messages.catalogsLoadFailed);
                }
            });
        },
        _getFileTypeClass: function (mimeType) {
            var fileTypeClass = null;
            switch (mimeType) {
                case "application/pdf":
                    fileTypeClass = "fr-icons128x128-file-pdf";
                    break;
                case "application/vnd.ms-excel":
                    fileTypeClass = "fr-icons128x128-file-xls";
                    break;
                case "application/msword":
                    fileTypeClass = "fr-icons128x128-file-doc";
                    break;
                case "application/vnd.ms-powerpoint":
                    fileTypeClass = "fr-icons128x128-file-ppt";
                    break;
                case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"://xlsx
                    fileTypeClass = "fr-icons128x128-file-xls";
                    break;
                case "application/vnd.openxmlformats-officedocument.wordprocessingml.document"://docx
                    fileTypeClass = "fr-icons128x128-file-doc";
                    break;
                case "application/vnd.openxmlformats-officedocument.presentationml.presentation"://pptx
                    fileTypeClass = "fr-icons128x128-file-ppt";
                    break;
                case "text/html":
                    fileTypeClass = "fr-icons128x128-file-html";
                    break;
                case "audio/mpeg":
                    fileTypeClass = "fr-icons128x128-file-mp3";
                    break;
                case "image/tiff":
                    fileTypeClass = "fr-icons128x128-file-tiff";
                    break;
                case "application/xml":
                    fileTypeClass = "fr-icons128x128-file-xml";
                    break;
                case "image/jpeg":
                    fileTypeClass = "fr-icons128x128-file-jpeg";
                    break;
                case "application/x-zip-compressed":
                    fileTypeClass = "fr-icons128x128-file-zip";
                    break;
                case "application/octet-stream":
                    fileTypeClass = "fr-icons128x128-file-ini";
                    break;
                case "image/gif":
                    fileTypeClass = "fr-icons128x128-file-gif";
                    break;
                case "image/png":
                    fileTypeClass = "fr-icons128x128-file-png";
                    break;
                case "image/bmp":
                    fileTypeClass = "fr-icons128x128-file-bmp";
                    break;
                case "text/plain":
                    fileTypeClass = "fr-icons128x128-file-text";
                    break;
                case "text/css":
                    fileTypeClass = "fr-icons128x128-file-css";
                    break;
                default://unknown
                    fileTypeClass = "fr-icons128x128-file-unknown";
                    break;
            }

            return fileTypeClass;
        }
    });  // $.widget
});  // function()