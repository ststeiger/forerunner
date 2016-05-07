///#source 1 1 /forerunner/Common/js/forerunner-tools.js
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
    var locData = forerunner.localize;       

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
            tooltip: function () { return locData.getLocData().toolbar.back; },
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
            tooltip: function () {
                return locData.getLocData().toolbar.menu;
            },
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
            sharedClass: "fr-hide-if-disable",
            tooltip: function () { return locData.getLocData().toolbar.navigation; },
            visibilityOrder: 7,
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
            sharedClass: "fr-toolbase-config-minimal fr-toolbase-config-edit fr-hide-if-disable",
            tooltip: function () { return  locData.getLocData().toolbar.paramarea; },
            events: {
                click: function (e) {
                    if (e.data.me.options.isTopParamLayout) {
                        e.data.me.options.$appContainer.trigger(events.paramAreaClickTop);
                    } else {
                        e.data.me._trigger(events.paramAreaClick, null, {});
                    }                    
                }
            }
        },
        /** @member */
        btnRefresh: {
            toolType: toolTypes.button,
            selectorClass: "fr-toolbar-refresh-button",
            imageClass: "fr-icons24x24-refresh",
            tooltip:  function () { return locData.getLocData().toolbar.refresh; },
            visibilityOrder: 15,
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
            tooltip:  function () { return locData.getLocData().toolbar.firstPage; },
            visibilityOrder: 4,
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
            tooltip: function () { return  locData.getLocData().toolbar.previousPage; },
            visibilityOrder: 3,
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
            sharedClass: "fr-core-input",
            //inputType: "number",
            tooltip:  function () { return locData.getLocData().toolbar.reportPage; },
            visibilityOrder: 1,
            events: {
                keydown: function (e) {
                    if (e.keyCode === 13 || e.keyCode === 9) {
                        var toolInfo = e.data.me.allTools["fr-toolbar-reportpage-textbox"];
                        var $input = e.data.me.element.find("." + toolInfo.selectorClass);

                        if (isNaN($input.val())) {
                            $input.addClass("fr-toolbase-input-invalid");
                        }
                        else if ($input.hasClass("fr-toolbase-input-invalid")) {
                            $input.removeClass("fr-toolbase-input-invalid");
                        }

                        if (!$input.hasClass("fr-toolbase-input-invalid")) {
                            e.data.$reportViewer.reportViewer("navToPage", this.value);
                        }
                        return false;
                    }
                },
                click: function (e) {
                    e.target.select();
                },
                blur: function (e) {
                    var toolInfo = e.data.me.allTools["fr-toolbar-reportpage-textbox"];
                    var $input = e.data.me.element.find("." + toolInfo.selectorClass);
                    //verify if input value is number
                    if (isNaN($input.val())) {
                        $input.addClass("fr-toolbase-input-invalid");
                    }
                    else if ($input.hasClass("fr-toolbase-input-invalid")) {
                        $input.removeClass("fr-toolbase-input-invalid");
                    }

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
            sharedClass: "fr-core-toolbar-text",
            text:  function () { return locData.getLocData().toolbar.pageOf; },
            visibilityOrder: 1
        },
        /** @member */
        btnNumPages: {
            toolType: toolTypes.plainText,
            selectorClass: "fr-toolbar-numPages-button",
            text: "0",
            visibilityOrder: 1
        },
        /** @member */
        btnNext: {
            toolType: toolTypes.button,
            selectorClass: "fr-toolbar-next-button",
            imageClass: "fr-icons24x24-next",
            tooltip:  function () { return locData.getLocData().toolbar.next; },
            visibilityOrder: 3,
            events: {
                click: function (e) {
                    e.data.$reportViewer.reportViewer("navToPage", e.data.$reportViewer.reportViewer("getCurPage") + 1);
                }
            }
        },
        /** @member */
        btnLastPage: {
            toolType: toolTypes.button,
            selectorClass: "fr-toolbar-lastpage-button",
            imageClass: "fr-icons24x24-lastpage",
            tooltip:  function () { return locData.getLocData().toolbar.lastPage; },
            visibilityOrder: 4,
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
            sharedClass: "fr-hide-if-disable",
            imageClass: "fr-icons24x24-documentmap",
            tooltip: function () { return  locData.getLocData().toolbar.docMap; },
            visibilityOrder: 6,
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
            sharedClass: "fr-toolbase-find-textbox fr-core-input",
            tooltip: function () { return  locData.getLocData().toolbar.keyword; },
            visibilityOrder: 10,
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
            sharedClass: "fr-toolbase-overlayed-button",
            iconClass: null,
            toolContainerClass: null,
            imageClass: "fr-toolbase-find-icon",
            toolStateClass: null,
            tooltip:  function () { return locData.getLocData().toolbar.find; },
            visibilityOrder: 10,
            visibilityNoWidth: true,
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
            sharedClass: "fr-toolbase-dropdown-item fr-toolbase-hide-if-mobile",
            toolStateClass: null,
            text:  function () { return locData.getLocData().exportType.xml; },
            visibilityOrder: 8,
            visibilityNoWidth: true,
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
            text:  function () { return locData.getLocData().exportType.csv; },
            visibilityOrder: 8,
            visibilityNoWidth: true,
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
            text:  function () { return locData.getLocData().exportType.pdf; },
            visibilityOrder: 8,
            visibilityNoWidth: true,
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
            sharedClass: "fr-toolbase-dropdown-item fr-toolbase-hide-if-mobile",
            toolStateClass: null,
            text:  function () { return locData.getLocData().exportType.mhtml; },
            visibilityOrder: 8,
            visibilityNoWidth: true,
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
            text: function () { return  locData.getLocData().exportType.excel; },
            visibilityOrder: 8,
            visibilityNoWidth: true,
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
            text: function () { return  locData.getLocData().exportType.tiff; },
            visibilityOrder: 8,
            visibilityNoWidth: true,
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
            text:  function () { return locData.getLocData().exportType.word; },
            visibilityOrder: 8,
            visibilityNoWidth: true,
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
            sharedClass: "fr-toolbase-show-if-mobile fr-hide-if-disable",
            tooltip:  function () { return locData.getLocData().toolPane.zoom; },
            visibilityOrder: 11,
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
            tooltip:  function () { return locData.getLocData().toolbar.print; },
            visibilityOrder: 13,
            events: {
                click: function (e) {
                    e.data.$reportViewer.reportViewer("showPrint");

                    //var paramsList = e.data.me.options.$ReportViewerInitializer.options.$paramarea.reportParameter("getParamsList");
                    //alert("paramsList: " + paramsList);
                }
            }
        },
        /** @member */
        btnEmailSubscription: {
            toolType: toolTypes.button,
            selectorClass: "fr-toolbar-email-button",
            imageClass: "fr-icons24x24-emailsubscription",
            tooltip: function () { return  locData.getLocData().subscription.email; },
            visibilityOrder: 14,
            events: {
                click: function (e) {
                    e.data.$reportViewer.reportViewer("showEmailSubscription");
                }
            }
        },
        /** @member */
        btnCredential: {
            toolType: toolTypes.button,
            selectorClass: "fr-toolbar-credential-button",
            imageClass: "fr-icons24x24-dataSourceCred",
            sharedClass: "fr-hide-if-disable",
            tooltip:  function () { return locData.getLocData().toolbar.dsCredential; },
            visibilityOrder: 9,
            events: {
                click: function (e) {
                    e.data.$reportViewer.reportViewer("showDSCredential");
                }
            }
        }
    };

    /**
     * Defines all the tools used in the dashboard toolbar.
     *
     * @namespace
     */
    forerunner.ssr.tools.dashboardToolbar = {
        /** @member */
        btnMenu: {
            toolType: toolTypes.button,
            selectorClass: "fr-dashboard-toolbar-menu-button",
            imageClass: "fr-icons24x24-menu",
            tooltip: function () { return  locData.getLocData().toolbar.menu; },
            events: {
                click: function (e) {
                    e.data.me._trigger(events.menuClick, null, {});
                }
            }
        },
        /** @member */
        btnBack: {
            toolType: toolTypes.button,
            selectorClass: "fr-dashboard-button-back",
            imageClass: "fr-icons24x24-back",
            tooltip: function () { return  locData.getLocData().toolbar.back; },
            events: {
                click: function (e) {
                    e.data.me.options.navigateTo("back", null);
                }
            }
        },
        /** @member */
        btnEdit: {
            toolType: toolTypes.button,
            selectorClass: "fr-dashboard-toolbar-edit-button",
            imageClass: "fr-icons24x24-editdashboard",
            tooltip:  function () { return locData.getLocData().toolbar.editDashboard; },
            events: {
                click: function (e) {
                    e.data.me.options.$dashboardEZ.dashboardEZ("enableEdit", true);
                }
            }
        },
        /** @member */
        btnView: {
            toolType: toolTypes.button,
            selectorClass: "fr-dashboard-toolbar-view-button",
            imageClass: "fr-icons24x24-createdashboard",
            tooltip: function () { return  locData.getLocData().toolbar.viewDashboard; },
            events: {
                click: function (e) {
                    e.data.me.options.$dashboardEZ.dashboardEZ("enableEdit", false);
                }
            }
        },
        /** @member */
        btnHome: {
            toolType: toolTypes.button,
            selectorClass: "fr-dashboard-button-home",
            imageClass: "fr-icons24x24-home",
            tooltip: function () { return  locData.getLocData().toolbar.home; },
            events: {
                click: function (e) {
                    e.data.me.options.navigateTo("home", null);
                }
            }
        },
        /** @member */
        btnRecent: {
            toolType: toolTypes.button,
            selectorClass: "fr-dashboard-button-recent",
            imageClass: "fr-icons24x24-recent",
            tooltip: function () { return  locData.getLocData().toolbar.recent; },
            visibilityOrder: 1,
            events: {
                click: function (e) {
                    e.data.me.options.navigateTo("recent", null);
                }
            }
        },
        /** @member */
        btnFavorite: {
            toolType: toolTypes.button,
            selectorClass: "fr-dashboard-button-favorite",
            imageClass: "fr-icons24x24-favorites",
            tooltip: function () { return  locData.getLocData().toolbar.favorites; },
            events: {
                click: function (e) {
                    e.data.me.options.navigateTo("favorites", null);
                }
            }
        },
        /** @member */
        btnLogOff: {
            toolType: toolTypes.button,
            selectorClass: "fr-dashboard-button-logOff",
            imageClass: "fr-icons24x24-logout",
            tooltip: function () { return  locData.getLocData().toolbar.logOff; },
            visibilityOrder: 2,
            events: {
                click: function (e) {
                    window.location = forerunner.config.forerunnerFolder() + "../Login/LogOff?returnUrl=" + encodeURIComponent(window.location.href);
                }
            }
        }
    };

    /**
     * Defines all the tools used in the dashboard toolpane.
     *
     * @namespace
     */
    forerunner.ssr.tools.dashboardToolPane = {
        /** @member */
        itemEdit: {
            toolType: toolTypes.containerItem,
            selectorClass: "fr-dashboardtoolpane-edit-button",
            imageClass: "fr-icons24x24-editdashboard",
            text:  function () { return locData.getLocData().toolPane.editDashboard; },
            events: {
                click: function (e) {
                    e.data.me._trigger(events.actionStarted, null, e.data.me.allTools["fr-dashboardtoolpane-edit-button"]);
                    e.data.me.options.$dashboardEZ.dashboardEZ("enableEdit", true);
                }
            }
        },
        /** @member */
        itemView: {
            toolType: toolTypes.containerItem,
            selectorClass: "fr-dashboardtoolpane-view-button",
            imageClass: "fr-icons24x24-createdashboard",
            text: function () { return  locData.getLocData().toolPane.viewDashboard; },
            events: {
                click: function (e) {
                    e.data.me._trigger(events.actionStarted, null, e.data.me.allTools["fr-dashboardtoolpane-view-button"]);
                    e.data.me.options.$dashboardEZ.dashboardEZ("enableEdit", false);
                }
            }
        },
        /** @member */
        itemBack: {
            toolType: toolTypes.containerItem,
            selectorClass: "fr-dashboardtoolpane-back",
            imageClass: "fr-icons24x24-reportback",
            text:  function () { return locData.getLocData().toolPane.back; },
            events: {
                click: function (e) {
                    e.data.me._trigger(events.actionStarted, null, e.data.me.allTools["fr-dashboardtoolpane-back"]);
                    e.data.me.options.navigateTo("back", null);
                }
            }
        },
        /** @member */
        itemHome: {
            toolType: toolTypes.containerItem,
            selectorClass: "fr-dashboardtoolpane-home",
            sharedClass: "fr-toolbase-no-disable-id",
            imageClass: "fr-icons24x24-homeBlue",
            itemTextClass: "fr-dashboardtoolpane-dropdown-item-text",
            toolStateClass: null,
            text: function () { return  locData.getLocData().toolPane.home; },
            events: {
                click: function (e) {
                    e.data.me.options.navigateTo("home", null);
                }
            }
        },
        /** @member */
        itemRecent: {
            toolType: toolTypes.containerItem,
            selectorClass: "fr-dashboardtoolpane-recent",
            imageClass: "fr-icons24x24-recentBlue",
            itemTextClass: "fr-dashboardtoolpane-dropdown-item-text",
            itemContainerClass: "fr-toolpane-dropdown-itemcontainer",
            text: function () { return  locData.getLocData().toolbar.recent; },
            toolStateClass: null,
            events: {
                click: function (e) {
                    e.data.me.options.navigateTo("recent", null);
                }
            }
        },
        /** @member */
        itemFavorite: {
            toolType: toolTypes.containerItem,
            selectorClass: "fr-dashboardtoolpane-favorite",
            imageClass: "fr-icons24x24-favoritesBlue",
            itemTextClass: "fr-dashboardtoolpane-dropdown-item-text",
            text: function () { return  locData.getLocData().toolPane.favorites; },
            itemContainerClass: "fr-toolpane-dropdown-itemcontainer",
            toolStateClass: null,
            events: {
                click: function (e) {
                    e.data.me.options.navigateTo("favorites", null);
                }
            }
        },
        /** @member */
        itemFolders: {
            toolType: toolTypes.containerItem,
            selectorClass: "fr-dashboard-item-folders",
            imageClass: "fr-icons24x24-folders",
            text: function () { return  locData.getLocData().toolPane.views; },
            rightImageClass: "fr-toolpane-icon16x16 fr-toolpane-down-icon",
            events: {
                click: function (e) {
                    var toolInfo = e.data.me.allTools["fr-dashboard-item-folders"];
                    var $rightIcon = e.data.me.element.find("." + toolInfo.selectorClass).find("." + "fr-toolpane-icon16x16");
                    $rightIcon.toggleClass("fr-toolpane-down-icon");
                    $rightIcon.toggleClass("fr-toolpane-up-icon");

                    var accordionGroup = toolInfo.accordionGroup;
                    var $accordionGroup = e.data.me.element.find("." + accordionGroup.selectorClass);
                    $accordionGroup.toggle();
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
            text: function () { return  locData.getLocData().toolPane.navigation; },
            sharedClass: "fr-hide-if-disable",
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
            itemContainerClass: "fr-toolpane-dropdown-itemcontainer",
            toolStateClass: null,
            imageClass: "fr-icons24x24-zoom-blue",
            sharedClass: "fr-toolbase-show-if-mobile fr-hide-if-disable",
            text: function () { return  locData.getLocData().toolPane.zoom; },
            itemTextClass: "fr-toolpane-dropdown-item-text",
            events: {
                click: function (e) {
                    e.data.$reportViewer.reportViewer("allowZoom", true);
                    e.data.me._trigger(events.actionStarted, null, e.data.me.allTools["fr-item-zoom"]);
                }
            }
        },
        /** @member */
        itemZoomPageWidth: {
            toolType: toolTypes.containerItem,
            selectorClass: "fr-item-zoom-page-width",
            itemContainerClass: "fr-toolpane-dropdown-itemcontainer",
            toolStateClass: null,
            imageClass: "fr-icons24x24-zoom-to-page-width",
            text: function () { return  locData.getLocData().toolPane.zoomPageWidth; },
            itemTextClass: "fr-toolpane-dropdown-item-text",
            events: {
                click: function (e) {
                    e.data.$reportViewer.reportViewer("toggleZoomPageWidth");
                    e.data.me._trigger(events.actionStarted, null, e.data.me.allTools["fr-item-zoom-page-width"]);
                }
            }
        },
        /** @member */
        itemPercent: {
            toolType: toolTypes.input,
            selectorClass: "fr-item-zoom-percent-textbox",
            sharedClass: "fr-core-input",
            tooltip:  function () { return locData.getLocData().toolPane.zoomPercent; },
            events: {
                keydown: function (e) {
                    if (e.keyCode === 13 || e.keyCode === 9) {
                        e.data.$reportViewer.reportViewer("zoomToPercent", $.trim(this.value));
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
        itemZoomIcon: {
            toolType: toolTypes.button,
            selectorClass: "fr-item-zoom-icon",
            iconClass: null,
            toolContainerClass: null,
            toolStateClass: null,
            sharedClass: "fr-toolbase-overlayed-button",
            imageClass: "fr-toolbase-zoom-icon",
            text:  function () { return locData.getLocData().toolPane.find;},
            tooltip: function () { return  locData.getLocData().toolbar.find;},
            events: {
                click: function (e) {
                    var value = $.trim(e.data.me.element.find(".fr-item-zoom-percent-textbox").val());
                    e.data.$reportViewer.reportViewer("zoomToPercent", value);
                }
            }
        },
        /** @member */
        itemZoomDropDown: {
            toolType: toolTypes.containerItem,
            selectorClass: "fr-item-zoom-drop-down",
            imageClass: "fr-icons24x24-zoom",
            text: function () { return  locData.getLocData().toolPane.zoomDropdown; },
            rightImageClass: "fr-toolpane-icon16x16 fr-toolpane-down-icon",
            events: {
                click: function (e) {
                    var toolInfo = e.data.me.allTools["fr-item-zoom-drop-down"];
                    var $rightIcon = e.data.me.element.find("." + toolInfo.selectorClass).find("." + "fr-toolpane-icon16x16");
                    $rightIcon.toggleClass("fr-toolpane-down-icon");
                    $rightIcon.toggleClass("fr-toolpane-up-icon");

                    var accordionGroup = toolInfo.accordionGroup;
                    var $accordionGroup = e.data.me.element.find("." + accordionGroup.selectorClass);
                    $accordionGroup.toggle();
                }
            }
        },

        /** @member */
        itemReportBack: {
            toolType: toolTypes.containerItem,
            selectorClass: "fr-id-reportback",
            imageClass: "fr-icons24x24-reportback",
            text:  function () { return locData.getLocData().toolPane.back; },
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
            text:  function () { return locData.getLocData().toolPane.refresh; },
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
            tooltip: function () { return  locData.getLocData().toolbar.firstPage; },
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
            tooltip:  function () { return locData.getLocData().toolbar.previousPage; },
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
            sharedClass: "fr-core-input",
            //inputType: "number",
            tooltip:  function () { return locData.getLocData().toolbar.reportPage; },
            events: {
                keydown: function (e) {
                    if (e.keyCode === 13 || e.keyCode === 9) {
                        var toolInfo = e.data.me.allTools["fr-item-textbox-reportpage"];
                        var $input = e.data.me.element.find("." + toolInfo.selectorClass);

                        //verify if input value is number
                        if (isNaN($input.val())) {
                            $input.addClass("fr-toolbase-input-invalid");
                        }
                        else if ($input.hasClass("fr-toolbase-input-invalid")) {
                            $input.removeClass("fr-toolbase-input-invalid");
                        }
                        
                        if (!$input.hasClass("fr-toolbase-input-invalid")) {
                            e.data.$reportViewer.reportViewer("navToPage", this.value);
                            e.data.me._trigger(events.actionStarted, null, e.data.me.allTools["fr-item-textbox-reportpage"]);
                        }
                        
                        return false;
                    }
                },
                click: function (e) {
                    e.target.select();
                },
                blur: function (e) {
                    var toolInfo = e.data.me.allTools["fr-item-textbox-reportpage"];
                    var $input = e.data.me.element.find("." + toolInfo.selectorClass);
                    //verify if input value is number
                    if (isNaN($input.val())) {
                        $input.addClass("fr-toolbase-input-invalid");
                    }
                    else if ($input.hasClass("fr-toolbase-input-invalid")) {
                        $input.removeClass("fr-toolbase-input-invalid");
                    }
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
            sharedClass: "fr-core-toolbar-text",
            text:  function () { return locData.getLocData().toolPane.pageOf; }
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
            tooltip:  function () { return locData.getLocData().toolbar.next; },
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
            tooltip: function () { return  locData.getLocData().toolbar.lastPage; },
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
            sharedClass: "fr-hide-if-disable",
            text:  function () { return locData.getLocData().toolPane.docMap; },
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
            sharedClass: "fr-toolbase-hide-if-mobile",
            toolStateClass: null,
            text: function () { return  locData.getLocData().exportType.xml; },
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
            text:  function () { return locData.getLocData().exportType.csv; },
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
            text:  function () { return locData.getLocData().exportType.pdf; },
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
            sharedClass: "fr-toolbase-hide-if-mobile",
            toolStateClass: null,
            text: function () { return  locData.getLocData().exportType.mhtml; },
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
            text:  function () { return locData.getLocData().exportType.excel; },
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
            text: function () { return  locData.getLocData().exportType.tiff; },
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
            text:  function () { return locData.getLocData().exportType.word; },
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
            text: function () { return  locData.getLocData().toolbar.exportMenu; },
            rightImageClass: "fr-toolpane-icon16x16 fr-toolpane-down-icon",
            events: {
                click: function (e) {
                    var toolInfo = e.data.me.allTools["fr-item-export"];
                    var $rightIcon = e.data.me.element.find("." + toolInfo.selectorClass).find("." + "fr-toolpane-icon16x16");
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
            selectorClass: "fr-item-keyword-textbox",
            sharedClass: "fr-toolbase-find-textbox fr-core-input",
            tooltip: function () { return  locData.getLocData().toolbar.keyword; },
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
            sharedClass: "fr-toolbase-overlayed-button",
            imageClass: "fr-toolbase-find-icon",
            text:  function () { return locData.getLocData().toolPane.find; },
            tooltip: function () { return  locData.getLocData().toolbar.find; },
            events: {
                click: function (e) {
                    var value = $.trim(e.data.me.element.find(".fr-item-keyword-textbox").val());
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
            text:  function () { return locData.getLocData().toolPane.print; },
            events: {
                click: function (e) {
                    e.data.$reportViewer.reportViewer("showPrint");
                    e.data.me._trigger(events.actionStarted, null, e.data.me.allTools["fr-item-printreport"]);
                }
            }
        },
        /** @member */
        itemEmailSubscription: {
            toolType: toolTypes.containerItem,
            selectorClass: "fr-item-emailsubscription",
            imageClass: "fr-icons24x24-emailsubscription",
            text:  function () { return locData.getLocData().subscription.email; },
            events: {
                click: function (e) {
                    e.data.$reportViewer.reportViewer("showEmailSubscription");
                    e.data.me._trigger(events.actionStarted, null, e.data.me.allTools["fr-item-emailsubscription"]);
                }
            }
        },
        /** @member */
        itemCredential: {
            toolType: toolTypes.containerItem,
            selectorClass: "fr-item-credential",
            imageClass: "fr-icons24x24-dataSourceCred",
            sharedClass: "fr-hide-if-disable",
            text: function () { return  locData.getLocData().toolPane.dsCredential; },
            events: {
                click: function (e) {
                    e.data.$reportViewer.reportViewer("showDSCredential");
                    e.data.me._trigger(events.actionStarted, null, e.data.me.allTools["fr-item-credential"]);
                }
            }
        },
        /** @member */
        itemHome: {
            toolType: toolTypes.containerItem,
            selectorClass: "fr-id-home",
            sharedClass: "fr-toolbase-no-disable-id",
            imageClass: "fr-icons24x24-homeBlue",
            itemTextClass: "fr-toolpane-dropdown-item-text",
            toolStateClass: null,
            text: function () { return  locData.getLocData().toolPane.home; },
            events: {
                click: function (e) {
                    e.data.me.options.$ReportViewerInitializer.options.navigateTo("home", null);
                }
            }
        },
        /** @member */
        itemRecent: {
            toolType: toolTypes.containerItem,
            selectorClass: "fr-item-recent",
            imageClass: "fr-icons24x24-recentBlue",
            itemTextClass: "fr-toolpane-dropdown-item-text",
            itemContainerClass: "fr-toolpane-dropdown-itemcontainer",
            text:  function () { return locData.getLocData().toolbar.recent; },
            toolStateClass: null,
            events: {
                click: function (e) {
                    e.data.me.options.$ReportViewerInitializer.options.navigateTo("recent", null);
                }
            }
        },
        /** @member */
        itemFavorite: {
            toolType: toolTypes.containerItem,
            selectorClass: "fr-item-favorite",
            imageClass: "fr-icons24x24-favoritesBlue",
            itemTextClass: "fr-toolpane-dropdown-item-text",
            itemContainerClass: "fr-toolpane-dropdown-itemcontainer",
            text:  function () { return locData.getLocData().toolPane.favorites; },
            toolStateClass: null,
            events: {
                click: function (e) {
                    e.data.me.options.$ReportViewerInitializer.options.navigateTo("favorites", null);
                }
            }
        }
    };

    /**
     * Defines all the tools used in the unzoom toolbar.
     *
     * @namespace
     */
    forerunner.ssr.tools.unZoomToolbar = {
        /** @member */
        btnUnZoom: {
            toolType: toolTypes.button,
            selectorClass: "fr-unzoom-button",
            imageClass: "fr-icons24x24-unzoom",
            tooltip:  function () { return locData.getLocData().toolbar.unzoom; },
            events: {
                click: function (e) {
                    e.data.$reportViewer.reportViewer("allowZoom", false);
                }
            }
        }
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
            tooltip:  function () { return locData.getLocData().toolbar.menu; },
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
            tooltip:  function () { return locData.getLocData().toolbar.paramarea; },
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
            tooltip: function () { return  locData.getLocData().toolbar.parameterSets; },
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
            containerClass: 'fr-rtb-select-set-box',
            selectorClass: "fr-rtb-select-set",
            model: function () {
                var me = this;
                var initializer = me.options.$ReportViewerInitializer;
                return initializer.getParameterModel.call(initializer);
            },
            modelChange: events.parameterModelChanged(),
            tooltip: function () { return  locData.getLocData().toolbar.selectSet; },
            alwaysChange: function (e) {
                //var $select = $(".fr-layout-rightheader select");
                //var id = $select.val();
                var target = e.srcElement ? e.srcElement : e.target;
                var id = target.value;
                var parameterModel = e.data.me.options.$ReportViewerInitializer.getParameterModel();
                parameterModel.parameterModel("setCurrentSet", id);
            }
        },
        /** @member */
        btnSavParam: {
            toolType: toolTypes.button,
            selectorClass: "fr-rtb-save-param",
            imageClass: "fr-icons24x24-save-param",
            tooltip:  function () { return locData.getLocData().toolbar.saveParam; },
            events: {
                click: function (e) {
                    var parameterModel = e.data.me.options.$ReportViewerInitializer.getParameterModel();
                    var parameterList = e.data.me.options.$ReportViewerInitializer.options.$paramarea.reportParameter("getParamsList");
                    parameterModel.parameterModel("save",
                        parameterList,
                        function (data) {
                            forerunner.dialog.showMessageBox(e.data.me.options.$appContainer, locData.getLocData().messages.saveParamSuccess, locData.getLocData().toolbar.saveParam);
                        },
                        function () {
                            forerunner.dialog.showMessageBox(e.data.me.options.$appContainer, locData.getLocData().messages.saveParamFailed, locData.getLocData().toolbar.saveParam);
                        }
                    );
                }
            }
        }
    };

    /**
      * Defines all the tools used in the Report Explorer Toolbar.
      *
      * @namespace
      */
    forerunner.ssr.tools.reportExplorerToolbar = {
        /** @member */
        btnMenu: {
            toolType: toolTypes.button,
            selectorClass: "fr-rm-button-menu",
            imageClass: "fr-icons24x24-menu",
            tooltip: function () {
                return locData.getLocData().toolbar.menu;
            },
            events: {
                click: function (e) {
                    e.data.me._trigger(events.menuClick, null, {});
                }
            }
        },
        /** @member */
        btnHome: {
            toolType: toolTypes.button,
            selectorClass: "fr-rm-button-home",
            imageClass: "fr-icons24x24-home",
            tooltip: function () { return  locData.getLocData().toolbar.home; },
            events: {
                click: function (e) {
                    e.data.me.freezeEnableDisable(false);
                    e.data.me.options.navigateTo("home", null);
                }
            }
        },
        /** @member */
        btnLogOff: {
            toolType: toolTypes.button,
            selectorClass: "fr-rm-button-logOff",
            imageClass: "fr-icons24x24-logout",
            tooltip:  function () { return locData.getLocData().toolbar.logOff; },
            visibilityOrder: 2,
            events: {
                click: function (e) {
                    window.location = forerunner.config.forerunnerFolder() + "../Login/LogOff?returnUrl=" + encodeURIComponent(window.location.href);
                }
            }
        },

        /** @member */
        btnBack: {
            toolType: toolTypes.button,
            selectorClass: "fr-button-back",
            imageClass: "fr-icons24x24-back",
            tooltip:  function () { return locData.getLocData().toolbar.back; },
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
            imageClass: "fr-icons24x24-favorites",
            tooltip:  function () { return locData.getLocData().toolbar.favorites; },
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
            tooltip:  function () { return locData.getLocData().toolbar.recent; },
            visibilityOrder: 1,
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
            tooltip: function () { return  locData.getLocData().toolbar.userSettings; },
            events: {
                click: function (e) {
                    e.data.me.options.$reportExplorer.reportExplorer("showUserSettingsDialog");
                    //forerunner.dialog.showUserSettingsDialog(e.data.me.options.$appContainer);
                }
            },
        },
        /** @member */
        btnMySubscriptions: {
            toolType: toolTypes.button,
            selectorClass: "fr-rm-button-mms",
            imageClass: "fr-icons24x24-emailsubscription",
            tooltip: function () { return  locData.getLocData().subscription.manageSubscription; },
            events: {
                click: function (e) {
                    e.data.me.options.$reportExplorer.reportExplorer("showManageMySubscriptionsDialog");
                }
            },
        },
        /** @member */
        btnKeyword: {
            toolType: toolTypes.input,
            selectorClass: "fr-rm-keyword-textbox",
            sharedClass: "fr-core-input fr-toolbase-find-textbox",
            tooltip: function () { return  locData.getLocData().toolbar.keyword; },
            visibilityOrder: 10,
            events: {
                keydown: function (e) {
                    if (e.keyCode === 13 || e.keyCode === 9) {
                        var keyword = $.trim(this.value);
                        if (keyword === "") {
                            forerunner.dialog.showMessageBox(e.data.me.options.$appContainer, locData.getLocData().explorerSearch.emptyError, locData.getLocData().dialog.title);
                            return;
                        }

                        e.data.me.options.navigateTo("search", keyword);
                        return false;
                    }
                },
                blur: function (e) {
                    e.data.$reportExplorer.reportExplorer("onInputBlur");
                },
                focus: function (e) {
                    e.data.$reportExplorer.reportExplorer("onInputFocus");
                }
            }
        },
        /** @member */
        btnFind: {
            toolType: toolTypes.button,
            selectorClass: "fr-rm-button-find",
            sharedClass: "fr-toolbase-overlayed-button",
            iconClass: null,
            toolContainerClass: null,
            imageClass: "fr-toolbase-find-icon",
            toolStateClass: null,
            tooltip:  function () { return locData.getLocData().toolbar.search; },
            visibilityOrder: 10,
            visibilityNoWidth: true,
            events: {
                click: function (e) {
                    var keyword = $.trim(e.data.me.element.find(".fr-rm-keyword-textbox").val());
                    if (keyword === "") {
                        forerunner.dialog.showMessageBox(e.data.me.options.$appContainer, locData.getLocData().explorerSearch.emptyError, locData.getLocData().dialog.title);
                        return;
                    }

                    e.data.me.options.navigateTo("search", keyword);
                }
            }
        },
        /** @member */
        btnSearchFolder: {
            toolType: toolTypes.button,
            selectorClass: "fr-rm-button-searchfolder",
            imageClass: "fr-icons24x24-dataSourceCred",
            tooltip: function () { return  locData.getLocData().toolbar.searchFolder; },
            events: {
                click: function (e) {
                    e.data.me.options.$reportExplorer.reportExplorer("showExplorerSearchFolderDialog");
                }
            }
        },
    };

    /**
      * Defines all the tools used in the Report Explorer Toolpane.
      *
      * @namespace
      */
    forerunner.ssr.tools.reportExplorerToolpane = {
        /** @member */
        itemHome: {
            toolType: toolTypes.containerItem,
            selectorClass: "fr-rm-item-home",
            imageClass: "fr-icons24x24-homeBlue",
            text: function () { return  locData.getLocData().toolbar.home; },
            itemTextClass: "fr-toolpane-dropdown-item-text",
            toolStateClass: null,
            events: {
                click: function (e) {
                    e.data.me.freezeEnableDisable(false);
                    e.data.me.options.navigateTo("home", null);
                    e.data.me._trigger(events.actionStarted, null, e.data.me.allTools["fr-rm-item-home"]);
                }
            }
        },
        /** @member */
        itemCreateDashboard: {
            toolType: toolTypes.containerItem,
            selectorClass: "fr-rm-item-createdashboard",
            imageClass: "fr-icons24x24-createdashboard",
            sharedClass: "fr-hide-if-disable",
            text: function () { return  locData.getLocData().toolbar.createDashboard; },
            events: {
                click: function (e) {
                    e.data.me.options.$reportExplorer.reportExplorer("showCreateDashboardDialog");
                    e.data.me._trigger(events.actionStarted, null, e.data.me.allTools["fr-rm-item-createdashboard"]);
                }
            }
        },
        /** @member */
        itemLogOff: {
            toolType: toolTypes.containerItem,
            selectorClass: "fr-rm-item-logOff",
            imageClass: "fr-icons24x24-logout",
            text:  function () { return locData.getLocData().toolbar.logOff; },
            events: {
                click: function (e) {
                    window.location = forerunner.config.forerunnerFolder() + "../Login/LogOff?returnUrl=" + encodeURIComponent(window.location.href);
                    e.data.me._trigger(events.actionStarted, null, e.data.me.allTools["fr-rm-item-logOff"]);
                }
            }
        },
        /** @member */
        itemBack: {
            toolType: toolTypes.containerItem,
            selectorClass: "fr-rm-item-back",
            imageClass: "fr-icons24x24-back",
            text:  function () { return locData.getLocData().toolbar.back; },
            events: {
                click: function (e) {
                    e.data.me.freezeEnableDisable(false);
                    e.data.me.options.navigateTo("back", null);
                    e.data.me._trigger(events.actionStarted, null, e.data.me.allTools["fr-rm-item-back"]);
                }
            }
        },
        /** @member */
        itemFav: {
            toolType: toolTypes.containerItem,
            selectorClass: "fr-rm-item-fav",
            imageClass: "fr-icons24x24-favoritesBlue",
            text: function () { return  locData.getLocData().toolbar.favorites; },
            itemTextClass: "fr-toolpane-dropdown-item-text",
            itemContainerClass: "fr-toolpane-dropdown-itemcontainer",
            toolStateClass: null,
            events: {
                click: function (e) {
                    e.data.me.freezeEnableDisable(false);
                    e.data.me.options.navigateTo("favorites", null);
                    e.data.me._trigger(events.actionStarted, null, e.data.me.allTools["fr-rm-item-fav"]);
                }
            }
        },
        /** @member */
        itemRecent: {
            toolType: toolTypes.containerItem,
            selectorClass: "fr-rm-item-recent",
            imageClass: "fr-icons24x24-recentBlue",
            text:  function () { return locData.getLocData().toolbar.recent; },
            itemTextClass: "fr-toolpane-dropdown-item-text",
            itemContainerClass: "fr-toolpane-dropdown-itemcontainer",
            toolStateClass: null,
            events: {
                click: function (e) {
                    e.data.me.freezeEnableDisable(false);
                    e.data.me.options.navigateTo("recent", null);
                    e.data.me._trigger(events.actionStarted, null, e.data.me.allTools["fr-rm-item-recent"]);
                }
            }
        },
        /** @member */
        itemSetup: {
            toolType: toolTypes.containerItem,
            selectorClass: "fr-rm-item-setup",
            imageClass: "fr-icons24x24-setup",
            text:  function () { return locData.getLocData().toolbar.userSettings; },
            events: {
                click: function (e) {
                    e.data.me.options.$reportExplorer.reportExplorer("showUserSettingsDialog");
                    e.data.me._trigger(events.actionStarted, null, e.data.me.allTools["fr-rm-item-setup"]);
                }
            },
        },
        /** @member */
        itemKeyword: {
            toolType: toolTypes.input,
            selectorClass: "fr-rm-item-keyword",
            tooltip: function () { return  locData.getLocData().toolbar.keyword; },
            sharedClass: "fr-core-input fr-toolbase-find-textbox",
            events: {
                keydown: function (e) {
                    if (e.keyCode === 13 || e.keyCode === 9) {
                        var keyword = $.trim(this.value);
                        if (keyword === "") {
                            forerunner.dialog.showMessageBox(e.data.me.options.$appContainer, locData.getLocData().explorerSearch.emptyError, locData.getLocData().dialog.title);
                            return;
                        }

                        e.data.me.options.navigateTo("search", keyword);
                        return false;
                    }
                },
                blur: function (e) {
                    e.data.$reportExplorer.reportExplorer("onInputBlur");
                },
                focus: function (e) {
                    e.data.$reportExplorer.reportExplorer("onInputFocus");
                }
            }
        },
        /** @member */
        itemFind: {
            toolType: toolTypes.button,
            selectorClass: "fr-rm-item-find",
            sharedClass: "fr-toolbase-overlayed-button",
            iconClass: null,
            toolContainerClass: null,
            imageClass: "fr-toolbase-find-icon",
            toolStateClass: null,
            tooltip: function () { return  locData.getLocData().toolbar.find; },
            events: {
                click: function (e) {
                    var keyword = $.trim(e.data.me.element.find(".fr-rm-item-keyword").val());
                    if (keyword === "") {
                        forerunner.dialog.showMessageBox(e.data.me.options.$appContainer, locData.getLocData().explorerSearch.emptyError, locData.getLocData().dialog.title);
                        return;
                    }

                    e.data.me.options.navigateTo("search", keyword);
                }
            }
        },
        /** @member */
        itemFolders: {
            toolType: toolTypes.containerItem,
            selectorClass: "fr-rm-item-folders",
            imageClass: "fr-icons24x24-folders",
            text: function () { return  locData.getLocData().toolPane.views; },
            rightImageClass: "fr-toolpane-icon16x16 fr-toolpane-down-icon",
            events: {
                click: function (e) {
                    var toolInfo = e.data.me.allTools["fr-rm-item-folders"];
                    var $rightIcon = e.data.me.element.find("." + toolInfo.selectorClass).find("." + "fr-toolpane-icon16x16");
                    $rightIcon.toggleClass("fr-toolpane-down-icon");
                    $rightIcon.toggleClass("fr-toolpane-up-icon");

                    var accordionGroup = toolInfo.accordionGroup;
                    var $accordionGroup = e.data.me.element.find("." + accordionGroup.selectorClass);
                    $accordionGroup.toggle();
                }
            }
        },
        /** @member */
        itemSearchFolder: {
            toolType: toolTypes.containerItem,
            selectorClass: "fr-rm-item-searchfolder",
            imageClass: "fr-icons24x24-searchfolder",
            sharedClass: "fr-hide-if-disable",
            text:  function () { return locData.getLocData().toolbar.searchFolder; },
            events: {
                click: function (e) {
                    e.data.$reportExplorer.reportExplorer("showExplorerSearchFolderDialog");
                    e.data.me._trigger(events.actionStarted, null, e.data.me.allTools["fr-rm-item-searchfolder"]);
                }
            }
        },
        /** @member */
        itemUploadFile: {
            toolType: toolTypes.containerItem,
            selectorClass: "fr-rm-item-upload-file",
            imageClass: "fr-upf-upload-file-icon",
            sharedClass: "fr-hide-if-disable",
            text: function () { return  locData.getLocData().uploadFile.title; },
            events: {
                click: function (e) {
                    e.data.me.options.$reportExplorer.reportExplorer("showUploadFileDialog");
                    e.data.me._trigger(events.actionStarted, null, e.data.me.allTools["fr-rm-item-upload-file"]);
                }
            }
        },
        /** @member */
        itemNewFolder: {
            toolType: toolTypes.containerItem,
            selectorClass: "fr-rm-item-new-folder",
            imageClass: "fr-nfd-new-folder-icon",
            sharedClass: "fr-hide-if-disable",
            text: function () { return  locData.getLocData().newFolder.title; },
            events: {
                click: function (e) {
                    e.data.me.options.$reportExplorer.reportExplorer("showNewFolderDialog");
                    e.data.me._trigger(events.actionStarted, null, e.data.me.allTools["fr-rm-item-new-folder"]);
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
            imageClass: "fr-icons24x24-favorite-minus",
            tooltip:  function () { return locData.getLocData().toolbar.addToFavorites; },
            visibilityOrder: 8,
            events: {
                click: function (e) {
                    //e.data.me.options.$ReportViewerInitializer.onClickBtnFavorite.call(e.data.me.options.$ReportViewerInitializer, e);
                    e.data.$appContainer.trigger("toolbar-fav-click");
                }
            }
        },
        /** @member */
        btnFavorite: {
            toolType: toolTypes.button,
            selectorClass: "fr-button-favorite",
            sharedClass: "fr-toolbase-no-disable-id",
            imageClass: "fr-icons24x24-favorites",
            tooltip:  function () { return locData.getLocData().toolbar.favorites; },
            visibilityOrder: 2,
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
            sharedClass: "fr-toolbase-no-disable-id",
            imageClass: "fr-icons24x24-recent",
            tooltip: function () { return  locData.getLocData().toolbar.recent; },
            visibilityOrder: 3,
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
            tooltip:  function () { return locData.getLocData().toolbar.home; },
            events: {
                click: function (e) {
                    e.data.me.options.$ReportViewerInitializer.options.navigateTo("home", null);
                }
            }
        },
        /** @member */
        btnLogOff: {
            toolType: toolTypes.button,
            selectorClass: "fr-rm-button-logOff",
            imageClass: "fr-icons24x24-logout",
            tooltip:  function () { return locData.getLocData().toolbar.logOff; },
            visibilityOrder: 12,
            events: {
                click: function (e) {
                    window.location = forerunner.config.forerunnerFolder() + "../Login/LogOff?returnUrl=" + encodeURIComponent(window.location.href);
                }
            }
        }
       
    };

    var tb = forerunner.ssr.tools.toolbar;
    var tp = forerunner.ssr.tools.toolpane;
    var ret = forerunner.ssr.tools.reportExplorerToolbar;
    var rep = forerunner.ssr.tools.reportExplorerToolpane;
    var dbtp = forerunner.ssr.tools.dashboardToolPane;

    /**
     * Defines all the tools that are merged into the Report Viewer Toolpane
     * when the Report Viewer is created via the report Explorer. If the Report
     * Viewer is created directly then these tools will not be merged.
     *
     * @namespace
     */
    forerunner.ssr.tools.mergedItems = {
        /** @member */
        itemFav: {
            toolType: toolTypes.containerItem,
            selectorClass: "fr-item-update-fav",
            imageClass: "fr-icons24x24-favorite-minus",
            text:  function () { return locData.getLocData().toolPane.addToFavorites; },
            events: {
                click: function (e) {
                    //e.data.me.options.$ReportViewerInitializer.onClickItemFavorite.call(e.data.me.options.$ReportViewerInitializer, e);
                    e.data.$appContainer.trigger("toolpane-fav-click");
                    e.data.me._trigger(events.actionStarted, null, e.data.me.allTools["fr-item-update-fav"]);
                }
            }
        },
        /** @member */
        itemFolders: {
            toolType: toolTypes.containerItem,
            selectorClass: "fr-item-folders",
            imageClass: "fr-icons24x24-folders",
            text:  function () { return locData.getLocData().toolPane.views; },
            rightImageClass: "fr-toolpane-icon16x16 fr-toolpane-down-icon",
            events: {
                click: function (e) {
                    var toolInfo = e.data.me.allTools["fr-item-folders"];
                    var $rightIcon = e.data.me.element.find("." + toolInfo.selectorClass).find("." + "fr-toolpane-icon16x16");
                    $rightIcon.toggleClass("fr-toolpane-down-icon");
                    $rightIcon.toggleClass("fr-toolpane-up-icon");

                    var accordionGroup = toolInfo.accordionGroup;
                    var $accordionGroup = e.data.me.element.find("." + accordionGroup.selectorClass);
                    $accordionGroup.toggle();
                }
            }
        },
        /** @member */
        itemLogOff: {
            toolType: toolTypes.containerItem,
            selectorClass: "fr-item-logOff",
            imageClass: "fr-icons24x24-logout",
            text:  function () { return locData.getLocData().toolbar.logOff; },
            events: {
                click: function (e) {
                    window.location = forerunner.config.forerunnerFolder() + "../Login/LogOff?returnUrl=" + encodeURIComponent(window.location.href);
                }
            }
        },
        /** @member */
        itemProperty: {
            toolType: toolTypes.containerItem,
            selectorClass: "fr-item-property",
            imageClass: "fr-icons24x24-tags",
            sharedClass: "fr-hide-if-disable",
            text: function () { return  locData.getLocData().properties.title; },
            events: {
                click: function (e) {
                    var $propertyDlg = e.data.me.options.$appContainer.children(".fr-properties-section");
                    $propertyDlg.forerunnerProperties("openDialog");
                    e.data.me._trigger(events.actionStarted, null, e.data.me.allTools["fr-rm-item-tags"]);
                }
            }
        },
        /** @member */
        itemSecurity: {
            toolType: toolTypes.containerItem,
            selectorClass: "fr-item-security",
            imageClass: "fr-icons24x24-security",
            sharedClass: "fr-hide-if-disable",
            text:  function () { return locData.getLocData().security.title; },
            events: {
                click: function (e) {
                    var $propertyDlg = e.data.me.options.$appContainer.children(".fr-security-section");
                    $propertyDlg.forerunnerSecurity("openDialog");
                    e.data.me._trigger(events.actionStarted, null, e.data.me.allTools["fr-rm-item-security"]);
                }
            }
        }
    };

    var mi = forerunner.ssr.tools.mergedItems;

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
            visibilityOrder: 1,
            visibilityNoWidth: true,
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
            visibilityOrder: 10,
            visibilityNoWidth: true,
            tools: [tb.btnKeyword,
                    tb.btnFind]
        },
        /** @member */
        btnExportDropdown: {
            toolType: toolTypes.button,
            selectorClass: "fr-toolbar-export-button",
            imageClass: "fr-icons24x24-export",
            tooltip: function () { return locData.getLocData().toolbar.exportMenu; },
            dropdown: true,
            visibilityOrder: 8,
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
        itemZoomGroup: {
            toolType: toolTypes.toolGroup,
            visible: false,
            selectorClass: "fr-item-zoom-group",
            groupContainerClass: "fr-toolpane-dropdown-group-container",
            tools: [ tp.itemZoomPageWidth]
        },
        /** @member */
        itemZoomPercentCompositeGroup: {
            toolType: toolTypes.toolGroup,
            selectorClass: "fr-item-zoom-percent-composite-group",
            groupContainerClass: null,
            tools: [tp.itemPercent,
                    tp.itemZoomIcon]
        },
        /** @member */
        itemFindCompositeGroup: {
            toolType: toolTypes.toolGroup,
            selectorClass: "fr-item-find-composite-group",
            groupContainerClass: null,
            tools: [tp.itemKeyword,
                    tp.itemFind]
        },
        /** @member */
        itemFolderGroup: {
            toolType: toolTypes.toolGroup,
            visible: false,
            selectorClass: "fr-item-folders-group",
            groupContainerClass: "fr-toolpane-dropdown-group-container",

            tools: [tp.itemFavorite]
        },
        /** @member */
        explorerFindGroup: {
            toolType: toolTypes.toolGroup,
            selectorClass: "fr-rm-toolbar-find-group",
            visibilityOrder: 10,
            visibilityNoWidth: true,
            tools: [ret.btnKeyword, ret.btnFind]
        },
        /** @member */
        explorerItemFindCompositeGroup: {
            toolType: toolTypes.toolGroup,
            selectorClass: "fr-item-find-composite-group",
            groupContainerClass: null,
            tools: [rep.itemKeyword, rep.itemFind]
        },
        /** @member */
        explorerItemFolderGroup: {
            toolType: toolTypes.toolGroup,
            visible: false,
            selectorClass: "fr-rm-item-folders-group",
            groupContainerClass: "fr-toolpane-dropdown-group-container",
            tools: [rep.itemFav]
        },
        /** @member */
        dashboardItemFolderGroup: {
            toolType: toolTypes.toolGroup,
            visible: false,
            selectorClass: "fr-dashboard-item-folders-group",
            groupContainerClass: "fr-toolpane-dropdown-group-container",
            tools: [dbtp.itemFavorite]
        },
    };
    var tg = forerunner.ssr.tools.groups;

    // Dynamically add in any / all accordionGroup definitions into the associate items
    tp.itemExport.accordionGroup = tg.itemExportGroup;
    tp.itemZoomDropDown.accordionGroup = tg.itemZoomGroup;
    mi.itemFolders.accordionGroup = tg.itemFolderGroup;
    rep.itemFolders.accordionGroup = tg.explorerItemFolderGroup;
    dbtp.itemFolders.accordionGroup = tg.dashboardItemFolderGroup;

    /** @member */
    tg.itemFindGroup = {
        toolType: toolTypes.toolGroup,
        selectorClass: "fr-item-findgroup",
        tools: [tg.itemFindCompositeGroup],
        events: {
            click: function (e) {
                if (!forerunner.helper.containElement(e.target, ["fr-item-find-composite-group"])) {
                    var value = $.trim(e.data.me.element.find(".fr-item-keyword-textbox").val());
                    e.data.$reportViewer.reportViewer("find", value);
                }
                //e.data.me._trigger(events.actionStarted, null, e.data.me.allTools["fr-item-find"]);
            }
        }
    };
    /** @member */
    tg.itemZoomPercentGroup = {
        toolType: toolTypes.toolGroup,
        selectorClass: "fr-item-zoom-percent-group",
        tools: [tg.itemZoomPercentCompositeGroup],
        events: {
            click: function (e) {
                if (!forerunner.helper.containElement(e.target, ["fr-item-zoom-percent-composite-group"])) {
                    var value = $.trim(e.data.me.element.find(".fr-item-zoom-percent-textbox").val());
                    e.data.$reportViewer.reportViewer("zoomToPercent", value);
                }
                //e.data.me._trigger(events.actionStarted, null, e.data.me.allTools["fr-item-find"]);
            }
        }
    };
    // Add the zoom percentage group into the Zoom Group tools
    tg.itemZoomGroup.tools.push(tg.itemZoomPercentGroup);

    /** @member */
    tg.explorerItemFindGroup = {
        toolType: toolTypes.toolGroup,
        selectorClass: "fr-rm-item-findgroup",
        tools: [tg.explorerItemFindCompositeGroup],
        events: {
            click: function (e) {
                if (!forerunner.helper.containElement(e.target, ["fr-item-find-composite-group"])) {
                    var keyword = $.trim(e.data.me.element.find(".fr-rm-item-keyword").val());
                    if (keyword === "") { return; }

                    e.data.me.options.navigateTo("search", keyword);
                }
            }
        }
    };

});

