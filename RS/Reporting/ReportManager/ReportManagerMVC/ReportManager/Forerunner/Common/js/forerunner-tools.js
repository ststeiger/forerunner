/**
 * @file
 *  Defines all tools, tool groups and dropdowns used in the UI.
 *
 */

var forerunner = forerunner || {};
forerunner.ssr = forerunner.ssr || {};

/**
 * Top level object that defines the forerunner SDK
 *
 * @namespace
 */
forerunner.ssr.tools = forerunner.ssr.tools || {};

$(function () {
    var events = forerunner.ssr.constants.events;
    var toolTypes = forerunner.ssr.constants.toolTypes;
    var locData = forerunner.localize.getLocData(forerunner.config.forerunnerFolder() + "/ReportViewer/loc/ReportViewer");
    var exportType = forerunner.ssr.constants.exportType;

    /**
     * Defines all the tools used in the toolbar.
     *
     * @namespace
     */
    forerunner.ssr.tools.toolbar = {
        /** @member */
        btnReportBack: {
            toolType: toolTypes.button,
            selectorClass: "fr-toolbar-reportback-button",
            imageClass: "fr-icons24x24-reportback",
            tooltip: locData.toolbar.back,
            events: {
                click: function (e) {
                    e.data.$reportViewer.reportViewer("back");
                }
            }
        },
        /** @member */
        btnMenu: {
            toolType: toolTypes.button,
            selectorClass: "fr-toolbar-menu-button",
            imageClass: "fr-icons24x24-menu",
            tooltip: locData.toolbar.menu,
            events: {
                click: function (e) {
                    e.data.me._trigger(events.menuClick, null, {});
                }
            }
        },
        /** @member */
        btnNav: {
            toolType: toolTypes.button,
            selectorClass: "fr-toolbar-nav-button",
            imageClass: "fr-icons24x24-nav",
            sharedClass: "fr-toolbar-hidden-on-small fr-toolbar-hidden-on-medium",
            tooltip: locData.toolbar.navigation,
            events: {
                click: function (e) {
                    e.data.$reportViewer.reportViewer("showNav");
                }
            }
        },
        /** @member */
        btnParamarea: {
            toolType: toolTypes.button,
            selectorClass: "fr-toolbar-paramarea-button",
            imageClass: "fr-icons24x24-paramarea",
            tooltip: locData.toolbar.paramarea,
            events: {
                click: function (e) {
                    e.data.me._trigger(events.paramAreaClick, null, {});
                }
            }
        },
        /** @member */
        btnRefresh: {
            toolType: toolTypes.button,
            selectorClass: "fr-toolbar-refresh-button",
            imageClass: "fr-icons24x24-refresh",
            sharedClass: "fr-toolbar-hidden-on-small fr-toolbar-hidden-on-medium fr-toolbar-hidden-on-large",
            tooltip: locData.toolbar.refresh,
            events: {
                click: function (e) {
                    e.data.$reportViewer.reportViewer("refreshReport");
                }
            }
        },
        /** @member */
        btnFirstPage: {
            toolType: toolTypes.button,
            selectorClass: "fr-toolbar-firstpage-button",
            imageClass: "fr-icons24x24-firstpage",
            sharedClass: "fr-toolbar-hidden-on-small",
            tooltip: locData.toolbar.firstPage,
            events: {
                click: function (e) {
                    e.data.$reportViewer.reportViewer("navToPage", 1);
                }
            }
        },
        /** @member */
        btnPrev: {
            toolType: toolTypes.button,
            selectorClass: "fr-toolbar-prev-button",
            imageClass: "fr-icons24x24-prev",
            sharedClass: "fr-toolbar-hidden-on-small",
            tooltip: locData.toolbar.previousPage,
            events: {
                click: function (e) {
                    e.data.$reportViewer.reportViewer("navToPage", e.data.$reportViewer.reportViewer("getCurPage") - 1);
                }
            }
        },
        /** @member */
        btnReportPage: {
            toolType: toolTypes.input,
            selectorClass: "fr-toolbar-reportpage-textbox",
            inputType: "number",
            tooltip: locData.toolbar.reportPage,
            events: {
                keydown: function (e) {
                    if (e.keyCode === 13 || e.keyCode === 9) {
                        e.data.$reportViewer.reportViewer("navToPage", this.value);
                        return false;
                    }
                },
                click: function (e) {
                    e.target.select();
                },
                blur: function (e) {
                    e.data.$reportViewer.reportViewer("onInputBlur");
                },
                focus: function (e) {
                    e.data.$reportViewer.reportViewer("onInputFocus");
                }
            }
        },
        /** @member */
        btnPageOf: {
            toolType: toolTypes.plainText,
            selectorClass: "fr-toolbar-pageOf-button",
            text: locData.toolbar.pageOf
        },
        /** @member */
        btnNumPages: {
            toolType: toolTypes.plainText,
            selectorClass: "fr-toolbar-numPages-button",
            text: "0"
        },
        /** @member */
        btnNext: {
            toolType: toolTypes.button,
            selectorClass: "fr-toolbar-next-button",
            imageClass: "fr-icons24x24-next",
            sharedClass: "fr-toolbar-hidden-on-small",
            tooltip: locData.toolbar.next,
            events: {
                click: function (e) {
                    e.data.$reportViewer.reportViewer("navToPage", parseInt(e.data.$reportViewer.reportViewer("getCurPage")) + 1);
                }
            }
        },
        /** @member */
        btnLastPage: {
            toolType: toolTypes.button,
            selectorClass: "fr-toolbar-lastpage-button",
            imageClass: "fr-icons24x24-lastpage",
            sharedClass: "fr-toolbar-hidden-on-small",
            tooltip: locData.toolbar.lastPage,
            events: {
                click: function (e) {
                    e.data.$reportViewer.reportViewer("navToPage", e.data.$reportViewer.reportViewer("getNumPages"));
                }
            }
        },
        /** @member */
        btnDocumentMap: {
            toolType: toolTypes.button,
            selectorClass: "fr-toolbar-documentmap-button",
            sharedClass: "fr-toolbar-hidden-on-small fr-toolbar-hidden-on-medium fr-toolbar-hidden-on-large",
            imageClass: "fr-icons24x24-documentmap",
            tooltip: locData.toolbar.docMap,
            events: {
                click: function (e) {
                    e.data.$reportViewer.reportViewer("showDocMap");
                }
            }
        },
        /** @member */
        btnKeyword: {
            toolType: toolTypes.input,
            selectorClass: "fr-toolbar-keyword-textbox",
            sharedClass: "fr-toolbar-hidden-on-small fr-toolbar-hidden-on-medium fr-toolbar-hidden-on-large",
            tooltip: locData.toolbar.keyword,
            events: {
                keydown: function (e) {
                    if (e.keyCode === 13 || e.keyCode === 9) {
                        e.data.$reportViewer.reportViewer("find", $.trim(this.value));
                        return false;
                    }
                },
                blur: function (e) {
                    e.data.$reportViewer.reportViewer("onInputBlur");
                },
                focus: function (e) {
                    e.data.$reportViewer.reportViewer("onInputFocus");
                }
            }
        },
        /** @member */
        btnFind: {
            toolType: toolTypes.button,
            selectorClass: "fr-toolbar-find-button",
            sharedClass: "fr-toolbar-hidden-on-small fr-toolbar-hidden-on-medium fr-toolbar-hidden-on-large",
            iconClass: null,
            toolContainerClass: null,
            imageClass: "fr-toolbar-search-icon",
            toolStateClass: null,
            tooltip: locData.toolbar.find,
            events: {
                click: function (e) {
                    var value = $.trim(e.data.me.element.find(".fr-toolbar-keyword-textbox").val());
                    e.data.$reportViewer.reportViewer("find", value);
                }
            }
        },
        /** @member */
        btnExportXML: {
            toolType: toolTypes.containerItem,
            selectorClass: "fr-button-exportXML-id",
            iconClass: "fr-icons25x31",
            imageClass: "fr-icons25x31-exportXML",
            sharedClass: "fr-toolbase-dropdown-item",
            toolStateClass: null,
            text: locData.exportType.xml,
            events: {
                click: function (e) {
                    e.data.$reportViewer.reportViewer("exportReport", exportType.xml);
                }
            }
        },
        /** @member */
        btnExportCSV: {
            toolType: toolTypes.containerItem,
            selectorClass: "fr-button-exportCSV-id",
            iconClass: "fr-icons25x31",
            imageClass: "fr-icons25x31-exportCSV",
            sharedClass: "fr-toolbase-dropdown-item",
            toolStateClass: null,
            text: locData.exportType.csv,
            events: {
                click: function (e) {
                    e.data.$reportViewer.reportViewer("exportReport", exportType.csv);
                }
            }
        },
        /** @member */
        btnExportPDF: {
            toolType: toolTypes.containerItem,
            selectorClass: "fr-button-exportPDF-id",
            iconClass: "fr-icons25x31",
            imageClass: "fr-icons25x31-exportPDF",
            sharedClass: "fr-toolbase-dropdown-item",
            toolStateClass: null,
            text: locData.exportType.pdf,
            events: {
                click: function (e) {
                    e.data.$reportViewer.reportViewer("exportReport", exportType.pdf);
                }
            }
        },
        /** @member */
        btnExportMHTML: {
            toolType: toolTypes.containerItem,
            selectorClass: "fr-button-exportMHTML-id",
            iconClass: "fr-icons25x31",
            imageClass: "fr-icons25x31-exportMHT",
            sharedClass: "fr-toolbase-dropdown-item",
            toolStateClass: null,
            text: locData.exportType.mhtml,
            events: {
                click: function (e) {
                    e.data.$reportViewer.reportViewer("exportReport", exportType.mhtml);
                }
            }
        },
        /** @member */
        btnExportExcel: {
            toolType: toolTypes.containerItem,
            selectorClass: "fr-button-exportExcel-id",
            iconClass: "fr-icons25x31",
            imageClass: "fr-icons25x31-exportExcel",
            sharedClass: "fr-toolbase-dropdown-item",
            toolStateClass: null,
            text: locData.exportType.excel,
            events: {
                click: function (e) {
                    e.data.$reportViewer.reportViewer("exportReport", exportType.excel);
                }
            }
        },
        /** @member */
        btnExportTiff: {
            toolType: toolTypes.containerItem,
            selectorClass: "fr-button-exportTiff-id",
            iconClass: "fr-icons25x31",
            imageClass: "fr-icons25x31-exportTIFF",
            sharedClass: "fr-toolbase-dropdown-item",
            toolStateClass: null,
            text: locData.exportType.tiff,
            events: {
                click: function (e) {
                    e.data.$reportViewer.reportViewer("exportReport", exportType.tiff);
                }
            }
        },
        /** @member */
        btnExportWord: {
            toolType: toolTypes.containerItem,
            selectorClass: "fr-button-exportWord-id",
            iconClass: "fr-icons25x31",
            imageClass: "fr-icons25x31-exportWord",
            sharedClass: "fr-toolbase-dropdown-item",
            toolStateClass: null,
            text: locData.exportType.word,
            events: {
                click: function (e) {
                    e.data.$reportViewer.reportViewer("exportReport", exportType.word);
                }
            }
        },
        /** @member */
        btnZoom: {
            toolType: toolTypes.button,
            selectorClass: "fr-toolbar-zoom-button",
            imageClass: "fr-icons24x24-zoom",
            sharedClass: "fr-toolbase-hide-if-not-touch fr-toolbar-hidden-on-small fr-toolbar-hidden-on-medium fr-toolbar-hidden-on-large",
            tooltip: locData.toolPane.zoom,
            events: {
                click: function (e) {
                    e.data.$reportViewer.reportViewer("allowZoom", true);
                }
            }
        },
        /** @member */
        btnPrint: {
            toolType: toolTypes.button,
            selectorClass: "fr-toolbar-print-button",
            imageClass: "fr-icons24x24-printreport",
            sharedClass: "fr-toolbar-hidden-on-small fr-toolbar-hidden-on-medium fr-toolbar-hidden-on-large",
            tooltip: locData.toolbar.print,
            events: {
                click: function (e) {
                    e.data.$reportViewer.reportViewer("showPrint");
                }
            }
        },
        btnCredential: {
            toolType: toolTypes.button,
            selectorClass: "fr-toolbar-credential-button",
            imageClass: "fr-icons24x24-setup",
            sharedClass: "fr-toolbar-hidden-on-small fr-toolbar-hidden-on-medium fr-toolbar-hidden-on-large",
            tooltip: locData.toolbar.dsCredential,
            events: {
                click: function (e) {
                    e.data.$reportViewer.reportViewer("showDSCredential");
                }
            }
        }
    };

    /**
     * Defines all the tools used in the toolpane.
     *
     * @namespace
     */
    forerunner.ssr.tools.toolpane = {
        /** @member */
        itemNav: {
            toolType: toolTypes.containerItem,
            selectorClass: "fr-id-nav",
            imageClass: "fr-icons24x24-nav",
            text: locData.toolPane.navigation,
            events: {
                click: function (e) {
                    e.data.$reportViewer.reportViewer("showNav");
                    e.data.me._trigger(events.actionStarted, null, e.data.me.allTools["fr-id-nav"]);
                }
            }
        },
        /** @member */
        itemZoom: {
            toolType: toolTypes.containerItem,
            selectorClass: "fr-item-zoom",
            imageClass: "fr-icons24x24-zoom",
            sharedClass: "fr-toolbase-hide-if-not-touch",
            text: locData.toolPane.zoom,
            events: {
                click: function (e) {                
                    e.data.$reportViewer.reportViewer("allowZoom",true);
                    e.data.me._trigger(events.actionStarted, null, e.data.me.allTools["fr-item-zoom"]);
                    //e.data.me._trigger(events.actionStarted, null, e.data.me.allTools["fr-item-zoom"]);
                }
            }
        },
        /** @member */
        itemReportBack: {
            toolType: toolTypes.containerItem,
            selectorClass: "fr-id-reportback",
            imageClass: "fr-icons24x24-reportback",
            text: locData.toolPane.back,
            events: {
                click: function (e) {
                    e.data.$reportViewer.reportViewer("back");
                    e.data.me._trigger(events.actionStarted, null, e.data.me.allTools["fr-id-reportback"]);
                }
            }
        },
        /** @member */
        itemRefresh: {
            toolType: toolTypes.containerItem,
            selectorClass: "fr-id-refresh",
            imageClass: "fr-icons24x24-refresh",
            text: locData.toolPane.refresh,
            events: {
                click: function (e) {
                    e.data.$reportViewer.reportViewer("refreshReport");
                    e.data.me._trigger(events.actionStarted, null, e.data.me.allTools["fr-id-refresh"]);
                }
            }
        },
        /** @member */
        itemFirstPage: {
            toolType: toolTypes.button,
            selectorClass: "fr-id-firstpage",
            imageClass: "fr-icons24x24-firstpage",
            events: {
                click: function (e) {
                    e.data.$reportViewer.reportViewer("navToPage", 1);
                    e.data.me._trigger(events.actionStarted, null, e.data.me.allTools["fr-id-firstpage"]);
                }
            }
        },
        /** @member */
        itemPrev: {
            toolType: toolTypes.button,
            selectorClass: "fr-id-prev",
            imageClass: "fr-icons24x24-prev",
            events: {
                click: function (e) {
                    e.data.$reportViewer.reportViewer("navToPage", e.data.$reportViewer.reportViewer("getCurPage") - 1);
                    e.data.me._trigger(events.actionStarted, null, e.data.me.allTools["fr-id-prev"]);
                }
            }
        },
        /** @member */
        itemReportPage: {
            toolType: toolTypes.input,
            selectorClass: "fr-item-textbox-reportpage",
            inputType: "number",
            events: {
                keydown: function (e) {
                    if (e.keyCode === 13 || e.keyCode === 9) {
                        e.data.$reportViewer.reportViewer("navToPage", this.value);
                        e.data.me._trigger(events.actionStarted, null, e.data.me.allTools["fr-item-textbox-reportpage"]);
                        return false;
                    }
                },
                blur: function (e) {
                    e.data.$reportViewer.reportViewer("onInputBlur");
                },
                focus: function (e) {
                    e.data.$reportViewer.reportViewer("onInputFocus");
                }
            }
        },
        /** @member */
        itemPageOf: {
            toolType: toolTypes.plainText,
            selectorClass: "fr-toolbar-pageOf-button",
            text: locData.toolPane.pageOf
        },
        /** @member */
        itemNumPages: {
            toolType: toolTypes.plainText,
            selectorClass: "fr-toolbar-numPages-button",
            text: ""
        },
        /** @member */
        itemNext: {
            toolType: toolTypes.button,
            selectorClass: "fr-id-next",
            imageClass: "fr-icons24x24-next",
            events: {
                click: function (e) {
                    e.data.$reportViewer.reportViewer("navToPage", e.data.$reportViewer.reportViewer("getCurPage") + 1);
                    e.data.me._trigger(events.actionStarted, null, e.data.me.allTools["fr-id-next"]);
                }
            }
        },
        /** @member */
        itemLastPage: {
            toolType: toolTypes.button,
            selectorClass: "fr-id-lastpage",
            imageClass: "fr-icons24x24-lastpage",
            events: {
                click: function (e) {
                    e.data.$reportViewer.reportViewer("navToPage", e.data.$reportViewer.reportViewer("getNumPages"));
                    e.data.me._trigger(events.actionStarted, null, e.data.me.allTools["fr-id-lastpage"]);
                }
            }
        },
        /** @member */
        itemDocumentMap: {
            toolType: toolTypes.containerItem,
            selectorClass: "fr-id-documentmap",
            imageClass: "fr-icons24x24-documentmap",
            text: locData.toolPane.docMap,
            events: {
                click: function (e) {
                    e.data.$reportViewer.reportViewer("showDocMap");
                    e.data.me._trigger(events.actionStarted, null, e.data.me.allTools["fr-id-documentmap"]);
                }
            }
        },
        /** @member */
        itemExportXML: {
            toolType: toolTypes.containerItem,
            selectorClass: "fr-item-exportXML",
            itemContainerClass: "fr-toolpane-dropdown-itemcontainer",
            iconClass: "fr-icons25x31",
            imageClass: "fr-icons25x31-exportXML",
            itemTextClass: "fr-toolpane-dropdown-item-text",
            toolStateClass: null,
            text: locData.exportType.xml,
            events: {
                click: function (e) {
                    e.data.$reportViewer.reportViewer("exportReport", exportType.xml);
                }
            }
        },
        /** @member */
        itemExportCSV: {
            toolType: toolTypes.containerItem,
            selectorClass: "fr-item-exportCSV",
            itemContainerClass: "fr-toolpane-dropdown-itemcontainer",
            iconClass: "fr-icons25x31",
            imageClass: "fr-icons25x31-exportCSV",
            itemTextClass: "fr-toolpane-dropdown-item-text",
            toolStateClass: null,
            text: locData.exportType.csv,
            events: {
                click: function (e) {
                    e.data.$reportViewer.reportViewer("exportReport", exportType.csv);
                }
            }
        },
        /** @member */
        itemExportPDF: {
            toolType: toolTypes.containerItem,
            selectorClass: "fr-item-exportPDF",
            itemContainerClass: "fr-toolpane-dropdown-itemcontainer",
            iconClass: "fr-icons25x31",
            imageClass: "fr-icons25x31-exportPDF",
            itemTextClass: "fr-toolpane-dropdown-item-text",
            toolStateClass: null,
            text: locData.exportType.pdf,
            events: {
                click: function (e) {
                    e.data.$reportViewer.reportViewer("exportReport", exportType.pdf);
                }
            }
        },
        /** @member */
        itemExportMHTML: {
            toolType: toolTypes.containerItem,
            selectorClass: "fr-item-exportMHTML",
            itemContainerClass: "fr-toolpane-dropdown-itemcontainer",
            iconClass: "fr-icons25x31",
            imageClass: "fr-icons25x31-exportMHT",
            itemTextClass: "fr-toolpane-dropdown-item-text",
            toolStateClass: null,
            text: locData.exportType.mhtml,
            events: {
                click: function (e) {
                    e.data.$reportViewer.reportViewer("exportReport", exportType.mhtml);
                }
            }
        },
        /** @member */
        itemExportExcel: {
            toolType: toolTypes.containerItem,
            selectorClass: "fr-item-exportExcel",
            itemContainerClass: "fr-toolpane-dropdown-itemcontainer",
            iconClass: "fr-icons25x31",
            imageClass: "fr-icons25x31-exportExcel",
            itemTextClass: "fr-toolpane-dropdown-item-text",
            toolStateClass: null,
            text: locData.exportType.excel,
            events: {
                click: function (e) {
                    e.data.$reportViewer.reportViewer("exportReport", exportType.excel);
                }
            }
        },
        /** @member */
        itemExportTiff: {
            toolType: toolTypes.containerItem,
            selectorClass: "fr-item-exportTiff",
            itemContainerClass: "fr-toolpane-dropdown-itemcontainer",
            iconClass: "fr-icons25x31",
            imageClass: "fr-icons25x31-exportTIFF",
            itemTextClass: "fr-toolpane-dropdown-item-text",
            toolStateClass: null,
            text: locData.exportType.tiff,
            events: {
                click: function (e) {
                    e.data.$reportViewer.reportViewer("exportReport", exportType.tiff);
                }
            }
        },
        /** @member */
        itemExportWord: {
            toolType: toolTypes.containerItem,
            selectorClass: "fr-item-exportWord",
            itemContainerClass: "fr-toolpane-dropdown-itemcontainer",
            iconClass: "fr-icons25x31",
            imageClass: "fr-icons25x31-exportWord",
            itemTextClass: "fr-toolpane-dropdown-item-text",
            toolStateClass: null,
            text: locData.exportType.word,
            events: {
                click: function (e) {
                    e.data.$reportViewer.reportViewer("exportReport", exportType.word);
                }
            }
        },
        /** @member */
        itemExport: {
            toolType: toolTypes.containerItem,
            selectorClass: "fr-item-export",
            imageClass: "fr-icons24x24-export",
            text: locData.toolbar.exportMenu,
            rightImageClass: "fr-toolpane-icon16x16 fr-toolpane-down-icon",
            events: {
                click: function (e) {
                    var toolInfo = e.data.me.allTools["fr-item-export"];
                    var $rightIcon = e.data.me.element.find("." + "fr-toolpane-icon16x16");
                    $rightIcon.toggleClass("fr-toolpane-down-icon");
                    $rightIcon.toggleClass("fr-toolpane-up-icon");

                    var accordionGroup = toolInfo.accordionGroup;
                    var $accordionGroup = e.data.me.element.find("." + accordionGroup.selectorClass);
                    $accordionGroup.toggle();
                }
            }
        },
        /** @member */
        itemKeyword: {
            toolType: toolTypes.input,
            selectorClass: "fr-item-textbox-keyword",
            events: {
                keydown: function (e) {
                    if (e.keyCode === 13 || e.keyCode === 9) {
                        e.data.$reportViewer.reportViewer("find", $.trim(this.value));
                        // bug-622
                        //e.data.me._trigger(events.actionStarted, null, e.data.me.allTools["fr-item-find"]);
                        return false;
                    }
                },
                blur: function (e) {
                    e.data.$reportViewer.reportViewer("onInputBlur");
                },
                focus: function (e) {
                    e.data.$reportViewer.reportViewer("onInputFocus");
                }
            }
        },
        /** @member */
        itemFind: {
            toolType: toolTypes.button,
            selectorClass: "fr-item-find",
            iconClass: null,
            toolContainerClass: null,
            toolStateClass: null,
            imageClass: "fr-item-search-icon",
            text: locData.toolPane.find,
            events: {
                click: function (e) {
                    var value = $.trim(e.data.me.element.find(".fr-item-textbox-keyword").val());
                    e.data.$reportViewer.reportViewer("find", value);
                    //e.data.me._trigger(events.actionStarted, null, e.data.me.allTools["fr-item-find"]);
                }
            }
        },   
        /** @member */
        itemPrint: {
            toolType: toolTypes.containerItem,
            selectorClass: "fr-item-printreport",
            imageClass: "fr-icons24x24-printreport",
            text: locData.toolPane.print,
            events: {
                click: function (e) {
                    e.data.$reportViewer.reportViewer("showPrint");
                    e.data.me._trigger(events.actionStarted, null, e.data.me.allTools["fr-item-printreport"]);
                }
            }
        },
        itemCredential: {
            toolType: toolTypes.containerItem,
            selectorClass: "fr-item-credential",
            imageClass: "fr-icons24x24-setup",
            text: locData.toolPane.dsCredential,
            events: {
                click: function (e) {
                    e.data.$reportViewer.reportViewer("showDSCredential");
                    e.data.me._trigger(events.actionStarted, null, e.data.me.allTools["fr-item-credential"]);
                }
            }
        },        
    };

    /**
     * Defines all the tools used in the left toolbar.
     *
     * @namespace
     */
    forerunner.ssr.tools.leftToolbar = {
        /** @member */
        btnLTBMenu: {
            toolType: toolTypes.button,
            selectorClass: "fr-ltb-menu-button",
            imageClass: "fr-icons24x24-menu",
            tooltip: locData.toolbar.menu,
            events: {
                click: function (e) {
                    e.data.me._trigger(events.menuClick, null, {});
                }
            }
        }
    };

    /**
     * Defines all the tools used in the right toolbar.
     *
     * @namespace
     */
    forerunner.ssr.tools.rightToolbar = {
        /** @member */
        btnRTBParamarea: {
            toolType: toolTypes.button,
            selectorClass: "fr-rtb-paramarea-button",
            imageClass: "fr-icons24x24-paramarea",
            tooltip: locData.toolbar.paramarea,
            events: {
                click: function (e) {
                    e.data.me._trigger(events.paramAreaClick, null, {});
                }
            }
        },
        /** @member */
        btnRTBManageSets: {
            toolType: toolTypes.button,
            selectorClass: "fr-rtb-manage_sets",
            imageClass: "fr-icons24x24-parameterSets",
            tooltip: locData.toolbar.parameterSets,
            events: {
                click: function (e) {
                    var parameterList = e.data.me.options.$ReportViewerInitializer.options.$paramarea.reportParameter("getParamsList");
                    e.data.me.options.$ReportViewerInitializer.showManageParamSetsDialog(parameterList);
                    //forerunner.dialog.showUserManageParamSetsDialog(e.data.me.options.$appContainer);
                }
            }
        },
        /** @member */
        btnSelectSet: {
            toolType: toolTypes.select,
            selectorClass: "fr-rtb-select-set",
            model: function () {
                var me = this;
                var initializer = me.options.$ReportViewerInitializer;
                return initializer.getParameterModel.call(initializer);
            },
            tooltip: locData.toolbar.selectSet,
            events: {
                change: function (e) {
                    var $select = $(".fr-layout-rightheader select");
                    var id = $select.val();
                    var parameterModel = e.data.me.options.$ReportViewerInitializer.getParameterModel();
                    parameterModel.parameterModel("setCurrentSet", id);
                }
            }

        },
        /** @member */
        btnSavParam: {
            toolType: toolTypes.button,
            selectorClass: "fr-rtb-save-param",
            imageClass: "fr-icons24x24-save-param",
            tooltip: locData.toolbar.saveParam,
            events: {
                click: function (e) {
                    var parameterModel = e.data.me.options.$ReportViewerInitializer.getParameterModel();
                    var parameterList = e.data.me.options.$ReportViewerInitializer.options.$paramarea.reportParameter("getParamsList");
                    parameterModel.parameterModel("save",
                        parameterList,
                        function (data) {
                            forerunner.dialog.showMessageBox(e.data.me.options.$appContainer, locData.messages.saveParamSuccess, locData.toolbar.saveParam);
                        },
                        function () {
                            forerunner.dialog.showMessageBox(e.data.me.options.$appContainer, locData.messages.saveParamFailed, locData.toolbar.saveParam);
                        }
                    );
                }
            }
        }
    };

    /**
      * Defines all the tools used in the Report Exploer Toolbar.
      *
      * @namespace
      */
    forerunner.ssr.tools.reportExplorerToolbar = {
        /** @member */
        btnHome: {
            toolType: toolTypes.button,
            selectorClass: "fr-rm-button-home",
            imageClass: "fr-icons24x24-home",
            tooltip: locData.toolbar.home,
            events: {
                click: function (e) {
                    e.data.me.freezeEnableDisable(false);
                    e.data.me.options.navigateTo("home", null);
                }
            }
        },
        /** @member */
        btnBack: {
            toolType: toolTypes.button,
            selectorClass: "fr-button-back",
            imageClass: "fr-icons24x24-back",
            tooltip: locData.toolbar.back,
            events: {
                click: function (e) {
                    e.data.me.freezeEnableDisable(false);
                    e.data.me.options.navigateTo("back", null);
                }
            }
        },
        /** @member */
        btnFav: {
            toolType: toolTypes.button,
            selectorClass: "fr-rm-button-fav",
            imageClass: "fr-icons24x24-favorite",
            tooltip: locData.toolbar.favorites,
            events: {
                click: function (e) {
                    e.data.me.freezeEnableDisable(false);
                    e.data.me.options.navigateTo("favorites", null);
                }
            }
        },
        /** @member */
        btnRecent: {
            toolType: toolTypes.button,
            selectorClass: "fr-rm-button-recent",
            imageClass: "fr-icons24x24-recent",
            tooltip: locData.toolbar.recent,
            events: {
                click: function (e) {
                    e.data.me.freezeEnableDisable(false);
                    e.data.me.options.navigateTo("recent", null);
                }
            }
        },
        /** @member */
        btnSetup: {
        toolType: toolTypes.button,
        selectorClass: "fr-rm-button-setup",
        imageClass: "fr-icons24x24-setup",
        tooltip: locData.toolbar.userSettings,
        events: {
            click: function (e) {
                e.data.me.options.$reportExplorer.reportExplorer("showUserSettingsDialog");
                //forerunner.dialog.showUserSettingsDialog(e.data.me.options.$appContainer);
            }
        }
    }
};

    /**
     * Defines all the tools that are merged into the Report Viewer Toolbar
     * when the Report Viewer is created via the report Explorer. If the Report
     * Viewer is created directly then these buttons will not be merged.
     *
     * @namespace
     */
    forerunner.ssr.tools.mergedButtons = {
        /** @member */
        btnFav: {
            toolType: toolTypes.button,
            selectorClass: "fr-button-update-fav",
            sharedClass: "fr-toolbar-hidden-on-small",
            imageClass: "fr-icons24x24-favorite-minus",
            tooltip: locData.toolbar.favorites,
            events: {
                click: function (e) {
                    e.data.me.options.$ReportViewerInitializer.onClickBtnFavorite.call(e.data.me.options.$ReportViewerInitializer, e);
                }
            }
        },
        /** @member */
        btnFavorite: {
            toolType: toolTypes.button,
            selectorClass: "fr-button-favorite",
            sharedClass: "fr-toolbase-no-disable-id",
            imageClass: "fr-icons24x24-favorite",
            tooltip: locData.toolbar.favorites,
            events: {
                click: function (e) {
                    e.data.me.options.$ReportViewerInitializer.options.navigateTo("favorites", null);
                }
            }
        },
        /** @member */
        btnRecent: {
            toolType: toolTypes.button,
            selectorClass: "fr-button-recent",
            sharedClass: "fr-toolbase-no-disable-id fr-toolbar-hidden-on-small",
            imageClass: "fr-icons24x24-recent",
            tooltip: locData.toolbar.recent,
            events: {
                click: function (e) {
                    e.data.me.options.$ReportViewerInitializer.options.navigateTo("recent", null);
                }
            }
        },
        /** @member */
        btnHome: {
            toolType: toolTypes.button,
            selectorClass: "fr-button-home",
            sharedClass: "fr-toolbase-no-disable-id",
            imageClass: "fr-icons24x24-home",
            tooltip: locData.toolbar.home,
            events: {
                click: function (e) {
                    e.data.me.options.$ReportViewerInitializer.options.navigateTo("home", null);
                }
            }
        },
    };

    /**
     * Defines all the tools that are merged into the Report Viewer Toolpane
     * when the Report Viewer is created via the report Explorer. If the Report
     * Viewer is created directly then these tools will not be merged.
     *
     * @namespace
     */
    forerunner.ssr.tools.mergedItems = {
        /** @member */
        itemHome: {
            toolType: toolTypes.containerItem,
            selectorClass: "fr-id-home",
            sharedClass: "fr-toolbase-no-disable-id",
            imageClass: "fr-icons24x24-home",
            text: locData.toolPane.home,
            events: {
                click: function (e) {
                    e.data.me.options.$ReportViewerInitializer.options.navigateTo("home", null);
                }
            }
        },
        /** @member */
        itemFav: {
            toolType: toolTypes.containerItem,
            selectorClass: "fr-item-update-fav",
            imageClass: "fr-icons24x24-favorite-minus",
            text: locData.toolPane.favorites,
            events: {
                click: function (e) {
                    e.data.me.options.$ReportViewerInitializer.onClickItemFavorite.call(e.data.me.options.$ReportViewerInitializer, e);
                }
            }
        },

    };

    var tb = forerunner.ssr.tools.toolbar;
    var tp = forerunner.ssr.tools.toolpane;

    /**
     * Defines all the tool groups and dropdowns used in UI.
     *
     * @namespace
     */
    forerunner.ssr.tools.groups = {
        /** @member */
        btnVCRGroup: {
            toolType: toolTypes.toolGroup,
            selectorClass: "fr-toolbar-VCR-group-id",
            tools: [tb.btnFirstPage,
                    tb.btnPrev,
                    tb.btnReportPage,
                    tb.btnPageOf,
                    tb.btnNumPages,
                    tb.btnNext,
                    tb.btnLastPage]
        },
        /** @member */
        btnFindGroup: {
            toolType: toolTypes.toolGroup,
            selectorClass: "fr-toolbar-find-group-id",
            tools: [tb.btnKeyword,
                    tb.btnFind]
        },
        /** @member */
        btnExportDropdown: {
            toolType: toolTypes.button,
            selectorClass: "fr-toolbar-export-button",
            imageClass: "fr-icons24x24-export",
            sharedClass: "fr-toolbar-hidden-on-small fr-toolbar-hidden-on-medium fr-toolbar-hidden-on-large",
            tooltip: locData.toolbar.exportMenu,
            dropdown: true,
            tools: [tb.btnExportXML,
                    tb.btnExportCSV,
                    tb.btnExportPDF,
                    tb.btnExportMHTML,
                    tb.btnExportExcel,
                    tb.btnExportTiff,
                    tb.btnExportWord],
        },
        /** @member */
        itemVCRGroup: {
            toolType: toolTypes.toolGroup,
            selectorClass: "fr-item-VCRgroup",
            tools: [tp.itemFirstPage,
                    tp.itemPrev,
                    tp.itemReportPage,
                    tp.itemPageOf,
                    tp.itemNumPages,
                    tp.itemNext,
                    tp.itemLastPage]
        },
        /** @member */
        itemExportGroup: {
            toolType: toolTypes.toolGroup,
            visible: false,
            selectorClass: "fr-item-export-group",
            groupContainerClass: "fr-toolpane-dropdown-group-container",
            tools: [tp.itemExportXML,
                    tp.itemExportCSV,
                    tp.itemExportPDF,
                    tp.itemExportMHTML,
                    tp.itemExportExcel,
                    tp.itemExportTiff,
                    tp.itemExportWord]
        },
        /** @member */
        itemFindCompositeGroup: {
            toolType: toolTypes.toolGroup,
            selectorClass: "fr-item-find-composite-group",
            groupContainerClass: null,
            tools: [tp.itemKeyword,
                    tp.itemFind]
        },
    };

    // Dynamically add in any / all accordionGroup definitions into the associate items
    var tg = forerunner.ssr.tools.groups;
    tp.itemExport.accordionGroup = tg.itemExportGroup;

    /** @member */
    tg.itemFindGroup = {
        toolType: toolTypes.toolGroup,
        selectorClass: "fr-item-findgroup",
        tools: [tg.itemFindCompositeGroup],
        events: {
            click: function (e) {
                if (!forerunner.helper.containElement(e.target, ["fr-item-find-composite-group"])) {
                    var value = $.trim(e.data.me.element.find(".fr-item-textbox-keyword").val());
                    e.data.$reportViewer.reportViewer("find", value);
                }
                //e.data.me._trigger(events.actionStarted, null, e.data.me.allTools["fr-item-find"]);
            }
        }
    };
});
