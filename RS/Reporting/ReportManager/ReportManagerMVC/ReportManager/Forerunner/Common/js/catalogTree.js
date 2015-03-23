/**
 * @file Contains the catalogTree widget.
 * This widget depended on the jstree.js file.
 */
var forerunner = forerunner || {};
// Forerunner SQL Server Reports
forerunner.ssr = forerunner.ssr || {};

$(function () {
    var events = forerunner.ssr.constants.events;
    var widgets = forerunner.ssr.constants.widgets;
    var locData = forerunner.localize.getLocData(forerunner.config.forerunnerFolder() + "ReportViewer/loc/ReportViewer");

    $.widget(widgets.getFullname(widgets.catalogTree), {
        options: {
            rootPath: null,
            type: null,
            containerClass: null,
            catalogTreeClass: null,
            $appContainer: null,
            reportManagerAPI: null,
            rsInstance: null
        },
        _create: function () {
            var me = this;
            var common = locData.common;

            me.$catalogTree = new $(
                "<div class='fr-catalog fr-popup-container fr-core-hidden'>" +
                    "<div class='fr-tree-container'></div>" +
                "</div>");

            me.$tree = me.$catalogTree.find(".fr-tree-container");

            me.options.containerClass && me.$catalogTree.addClass(me.options.containerClass);
            me.options.catalogTreeClass && me.$tree.addClass(me.options.catalogTreeClass);

            me.element.siblings(".fr-catalog").remove();
            me.$catalogTree.insertAfter(me.element);
        },
        _init: function () {
            var me = this;
            
            me.options.rootPath && me._getCatalogTreeData(me.options.rootPath);
        },
        _buildTree: function () {
            var me = this;

            if (me.$tree.is(":jstree")) {
                me.$tree.jstree().destroy();
            }

            if (me.options.type === "fullCatalog") {
                me.$tree.jstree({
                    core: {
                        data: me.fullTreeData
                    }
                });
            } else {
                me.$tree.jstree({
                    core: {
                        data: me.catalogTreeData
                    }
                });
            }

            //me.$tree.jstree("close_all");
            //me.$tree.jstree("open_node", "j1_1");
            me.$tree.jstree("deselect_all", true);

            //make sure the popup is hidden
            me.$catalogTree.addClass("fr-core-hidden");

            me.$tree.off("changed.jstree");
            me.$tree.on("changed.jstree", function (e, data) {
                me._onChangedjsTree.apply(me, arguments);
            });
        },
        toggleCatalog: function (width) {
            var me = this;

            if (!me.$catalogTree.is(":visible")) {
                //handle border width
                me.$catalogTree.css({ width: width });
            }

            me.$catalogTree.toggleClass("fr-core-hidden");

            //return tree dropdown visible status
            return !me.$catalogTree.hasClass("fr-core-hidden");
        },
        _getCatalogTreeData: function (rootPath) {
            var me = this;

            me.fullTreeData = {
                text: rootPath,
                state: {
                    opened: true
                },
                li_attr: {
                    dataCatalogItem: {
                        Path: me.options.rootPath,
                        Name: me.options.rootPath,
                        Type: forerunner.ssr.constants.itemType.folder
                    }
                },
                children: []
            };

            me._getCatalog(rootPath, function (items) {
                me._catalogDataPrefix.call(me, me.fullTreeData, items.children);

                me.catalogTreeData = me._createSimpleTreeData.call(me, $.extend(true, {}, me.fullTreeData));

                me._buildTree();
            });
        },
        _catalogDataPrefix: function (curNode, items) {
            var me = this;

            $.each(items, function (index, item) {
                var newNode = {
                    text: item.Name,
                    li_attr: {
                        dataCatalogItem: {
                            Path: item.Path,
                            Name: item.Name,
                            Type: item.Type
                        }
                    },
                    children: []
                };

                if (item.Type === forerunner.ssr.constants.itemType.folder) {
                    curNode.children.push(newNode);

                    me._catalogDataPrefix(newNode, item.children);
                } else if (item.Type === forerunner.ssr.constants.itemType.report) {
                    curNode.children.push(newNode);
                    newNode.icon = "jstree-file";
                }
            });
        },
        _createSimpleTreeData: function (nodeData) {
            var me = this;

            for (var i = 0, child; i < nodeData.children.length; i++) {
                child = nodeData.children[i];
                if (child.children.length !== 0) {
                    me._createSimpleTreeData(child);
                }
                else if (child.li_attr.dataCatalogItem.Type !== 1) {
                    nodeData.children.splice(i, 1);
                    i = i - 1;
                }
            }
            return nodeData;
        },
        _getCatalog: function (rootPath, callback) {
            var me = this;

            forerunner.ajax.ajax({
                dataType: "json",
                url: me.options.reportManagerAPI + "/GetCatalog",
                async: true,
                data: {
                    rootPath: rootPath,
                    showLinkedReport: false
                },
                success: function (data) {
                    if (typeof callback === "function") {
                        callback.call(me, data);
                    }
                },
                error: function (data) {
                    console.log(data);
                }
            });
        },        
        _onChangedjsTree: function (e, data) {
            var me = this;
            
            if (me.options.type === "fullCatalog" && data.node.li_attr.dataCatalogItem.Type === 1 && data.node.children.length !== 0) { // if it is the folder item, then 
                me.$tree.jstree("toggle_node", data.node.id);
                return;
            }
            
            var location = data.node.text === me.options.rootPath ? me.options.rootPath : data.node.li_attr.dataCatalogItem.Path;

            me._trigger(events.catalogSelected, null, { path: location, item: data.node.li_attr.dataCatalogItem });
            me.$catalogTree.addClass("fr-core-hidden");
        }
    });
});