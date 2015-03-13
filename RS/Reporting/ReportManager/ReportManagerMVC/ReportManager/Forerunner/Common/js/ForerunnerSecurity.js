/**
 * @file Contains the forerunnerSecurity widget.
 */
var forerunner = forerunner || {};
// Forerunner SQL Server Reports
forerunner.ssr = forerunner.ssr || {};

$(function () {
    var widgets = forerunner.ssr.constants.widgets;
    var events = forerunner.ssr.constants.events;
    var propertyEnums = forerunner.ssr.constants.properties;
    var locData = forerunner.localize.getLocData(forerunner.config.forerunnerFolder() + "ReportViewer/loc/ReportViewer");

    /**
    * Widget used to manage item security
    *
    * @namespace $.forerunner.forerunnerSecurity
    * @prop {Object} options - The options for the security dialog
    * @prop {Object} options.$reportExplorer - Report viewer widget
    * @prop {Object} options.$appContainer - The container jQuery object that holds the application
    * @prop {String} options.rsInstance - Optional, Report service instance name
    *
    * @example
    * $("#property").forerunnerSecurity({
    *     $appContainer: me.options.$appContainer,
    *     $reportExplorer: me.$explorer
    * });
    */
    $.widget(widgets.getFullname(widgets.forerunnerSecurity), {
        options: {
            $appContainer: null,
            $reportExplorer: null,
            rsInstance: null,
        },
        _create: function () {

        },
        _init: function () {
            var me = this;

            me.guid = forerunner.helper.guidGen();
            me.curPath = null;

            me.element.html("");
            //me.element.off(events.modalDialogGenericSubmit);
            me.element.off(events.modalDialogGenericCancel);

            var headerHtml = forerunner.dialog.getModalDialogHeaderHtml('fr-icons24x24-security', locData.security.title, "fr-security-cancel", locData.common.cancel);

            var $container = new $(
               "<div class='fr-core-dialog-innerPage fr-core-center'>" +
                   headerHtml +
                    "<div class='fr-security-path'>" +
                        "<span class='fr-security-curPath'></span>" + 
                    "</div>" +
                    "<div class='fr-security-container'>" +
                        "<div class='fr-security-layer layer-1'>" +
                            "<ul class='fr-security-list'></ul>" +
                        "</div>" +
                        "<div class='fr-security-layer layer-2'>" +
                            "<div class='header'>" +
                              "<span class='fr-security-label'>" + locData.security.groupuser + "</span>" +
                              "<input type='text' class='fr-core-input fr-security-input fr-security-groupuser'>" +
                            "</div>" +
                            "<div class='prompt'>" + locData.security.prompt + "</div>" +
                            "<ul class='fr-security-list'></ul>" +
                        "</div>" +
                    "</div>" +
                   "<div class='fr-core-dialog-submit-container fr-security-submit-container'>" +
                       "<div class='fr-core-center'>" +
                           "<div class='operate-0'>" +
                                "<input type='button' class='fr-security-edit fr-core-dialog-button' value='" + locData.security.editSecurity + "' />" +
                           "</div>" +
                           "<div class='operate-1'>" +
                                "<input type='button' class='fr-security-new fr-security-btn fr-core-dialog-button' value='" + locData.security.newPolicy + "' />" +
                                "<input type='button' class='fr-security-revert fr-security-btn fr-core-dialog-button' value='" + locData.security.revert + "' />" +
                           "</div>" +
                           "<div class='operate-2'>" +
                                "<input type='button' class='fr-security-submit fr-security-btn fr-core-dialog-button' value='" + locData.common.submit + "' />" +
                                "<input type='button' class='fr-security-cancel fr-security-btn fr-core-dialog-button' value='" + locData.common.cancel + "' />" +
                           "</div>" +
                       "</div>" +
                   "</div>" +
               "</div>");

            me.element.append($container);

            me.$layer1 = me.element.find(".layer-1");
            me.$layer2 = me.element.find(".layer-2");
            me.$groupuser = me.$layer2.find(".fr-security-groupuser");

            me.$operate0 = me.element.find(".operate-0");
            me.$operate1 = me.element.find(".operate-1");
            me.$operate2 = me.element.find(".operate-2");

            me.$revert = me.$operate1.find(".fr-security-revert");
            me.$curPath = me.element.find(".fr-security-curPath");

            //me.element.on(events.modalDialogGenericSubmit, function () {
            //    me._submit()
            //});

            me.element.on(events.modalDialogGenericCancel, function () {
                me._clickCancel();
            });

            me._bindEvents();
        },
        _bindEvents: function(){
            var me = this;

            /****************************************** 
                Used to flag which layer it is, default to 1
                1: account layer, show all account accessable to current item
                2: role layer, show the available role
            *****************************************/
            me.curLayer = 1;

            /******************* bind function button action *********************/
            //create a new role assignment to current item
            me.element.find(".fr-security-new").on("click", function () {
                me._switchToLayer2("new");
            });

            //reset to its parent policy
            me.$revert.on("click", function () {
                if (me.isInheritParent || me.isRoot) {
                    me.closeDialog();
                } else {
                    if (!confirm(locData.security.revertConfirm.format(me.parentName))) return;

                    me._inheritParentPolicy();
                }
            });

            me.$operate0.on("click", function () {
                if (!confirm(locData.security.editConfirm.format(me.parentName))) return;

                me._breakInherit();
            });

            //save the change, (new or update)
            me.element.find(".fr-security-submit").on("click", function () {
                me._submit(function () {
                    me._clickCancel();
                });
            });

            //back to main layer, for close button at the right top corner, always close dialog
            me.element.find(".fr-security-cancel").on("click", function (e) {
                if ($(this).hasClass('fr-core-dialog-cancel')) {
                    if (me.isInheritParent) {
                        me.closeDialog();
                        return;
                    }

                    me.$layer2.hide();
                    me.$operate2.hide();

                    me.$layer1.show();
                    me.$operate1.show();

                    me.closeDialog();
                    return;
                }

                me._clickCancel();
            });
            /******************** end of bind function button action *********************/


            /******************* bind operate button in each row *********************/
            // show or hide the current user's roles
            me.$layer1.delegate('.tip', 'click', function (e) {
                $(this).closest('li').find('.role').toggle();
            });

            me.$layer1.delegate('.edit', 'click', function (e) {
                var groupuser = $(this).siblings("span").text();
                me._switchToLayer2("edit", groupuser);
            });

            me.$layer1.delegate('.delete', 'click', function (e) {
                if (!confirm(locData.security.deleteConfirm)) return;

                var groupuser = $(this).siblings("span").text();
                me._deletePolicy(groupuser);
            });

            // show or hide the roles description
            me.$layer2.delegate('.tip', 'click', function (e) {
                $(this).closest('li').find('.desp').toggle();
            });

            me.$layer2.delegate('.acc-name', 'click', function (e) {
                $(this).closest('li').find('.acc-chk').trigger('click');
            });
            /******************* end of bind operate button in each row *********************/
        },
        setData: function (path, type) {
            var me = this;

            if (me.curPath !== path) {
                me.curPath = path;
                me.curType = type;
                me.parentName = me._getParentName(path);

                me.cachedRoles = null;
                me.cachedPolicy = null;

                me.$curPath.text(me._getItemName(path));

                me.isRoot = me.curPath === '/' ? true : false;
            }
        },
        /**
         * Show the security modal dialog.
         *
         * @function $.forerunner.forerunnerProperties#openDialog
         */
        openDialog: function () {
            var me = this;
            
            if (!me.cachedPolicy || !me.cachedRoles) {
                me._refreshUI();
            }

            forerunner.dialog.dialogLock = true;

            forerunner.dialog.showModalDialog(me.options.$appContainer, me);
        },
        /**
         * Close the security modal dialog.
         *
         * @function $.forerunner.forerunnerProperties#closeDialog
         */
        closeDialog: function () {
            var me = this;
            forerunner.dialog.dialogLock = false;

            me._trigger(events.close, null, { $forerunnerSecurity: me.element, path: me.curPath });
            forerunner.dialog.closeModalDialog(me.options.$appContainer, me);
        },
        /**
         * Get the policy data for current path
         *
         * @function $.forerunner.forerunnerSecurity#getCurPolicy
         */
        getCurPolicy: function(){
            var me = this;
            return {
                path: me.curPath,
                policy: me.cachedPolicy,
                roles: me.cachedRoles,
                isInheritParent: me.isInheritParent
            };
        },
        /**
         * Set the policy to a specific stats
         *
         * @function $.forerunner.forerunnerSecurity#setCurPolicy
         */
        setCurPolicy: function(obj){
            var me = this;

            me.curPath = obj.path;            
            me.cachedRoles = obj.roles;
            me.cachedPolicy = obj.policy;
            me.isInheritParent = obj.isInheritParent;

            me.isRoot = me.curPath === '/' ? true : false;

            me._refreshUI();
        },
        _switchToLayer2: function (type, groupuser) {
            var me = this,
                isNew = type === "new" ? true : false;

            me.curLayer = 2;

            if (!isNew) {
                //merge the exist roles with the role list, set the exist role checkbox to checked by default
                var existRole = {},
                    $chks = me.$layer2.find('.acc-chk'),
                    i, j;

                for (i = 0; i < me.cachedPolicy.length; i++) {
                    if (me.cachedPolicy[i].GroupUserName === groupuser) {
                        for (j = 0; j < me.cachedPolicy[i].Roles.length; j++) {
                            existRole[me.cachedPolicy[i].Roles[j].Name] = true;
                        }
                        break;
                    }
                }

                for (i = 0; i < me.cachedRoles.length; i++) {
                    var name = me.cachedRoles[i].Name;

                    if (existRole[name]) {
                        $chks.filter("[data-acc='" + name + "']").trigger("click");
                    }
                }
            }

            me.$layer1.hide(function () {
                me.$operate1.hide();
                //for edit assign the account to the input and add title to show full text
                !isNew && me.$groupuser.val(groupuser).attr("title", groupuser).attr("readonly", true);

                me.$layer2.show().scrollTop(0);
                me.$operate2.show();
            });
        },
        _clickCancel: function () {
            var me = this;
            
            if (me.curLayer === 2) {
                me.curLayer = 1;

                me.$layer2.hide(function () {
                    var $chks = me.$layer2.find('.acc-chk');
                    //un-check all selected role when hide layer2
                    for (var i = 0; i < $chks.length; i++) {
                        if ($chks[i].checked) {
                            $chks[i].checked = false;
                        }
                    }
                    
                    me.$operate2.hide();
                    me.$groupuser.val('').removeAttr('title').removeAttr('readonly');

                    me.$layer1.show();
                    me.$operate1.show();
                });
            } else {
                me.closeDialog();
            }
        },
        _refreshUI: function () {
            var me = this;

            if (!me.cachedPolicy) {
                me._getPolicy();
            }

            var layer1 = me._drawPolicyUI(me.cachedPolicy);
            me.$layer1.children('ul').html('').append(layer1);

            if (me.isInheritParent) {
                me.$operate0.show();
                me.$operate1.hide();
                me.$operate2.hide();
            } else {
                me.$operate0.hide();
                me.$operate1.show();
                me.$operate2.hide();

                me.$layer1.find(".funcBtn").show();

                me.isRoot ? me.$revert.hide() : me.$revert.show();
            }

            //draw layer-2 later after layer-1 done
            setTimeout(function () {
                if (!me.cachedRoles) {
                    me._getRoles();
                }

                var layer2 = me._drawRoleUI(me.cachedRoles);
                me.$layer2.children('ul').html('').append(layer2);
            }, 0);
        },
        _submit: function (callback) {
            var me = this;

            var policyArr = me._generatePostData();

            if (!policyArr) return;

            me._setPolicy(policyArr, callback);
        },
        _generatePostData: function () {
            var me = this,
                i,
                Roles = [];

            var groupuser = me.$groupuser.val();

            if ($.trim(groupuser) === "") {
                forerunner.dialog.showMessageBox(me.options.$appContainer, locData.security.accountMsg);
                return null;
            }

            $.each(me.$layer2.find('.acc-chk'), function (i, obj) {
                if (obj.checked) {
                    Roles.push({
                        Name: obj.getAttribute('data-acc')
                    });
                }
            });

            //at least one role need select
            if (Roles.length === 0) {
                forerunner.dialog.showMessageBox(me.options.$appContainer, locData.security.roleEmptyMsg);
                return null;
            }

            me.tempCachedPolicy = me.cachedPolicy.slice(0);

            for (i = 0; i < me.tempCachedPolicy.length; i++) {
                if (me.tempCachedPolicy[i].GroupUserName === groupuser) {
                    me.tempCachedPolicy[i].Roles = Roles;
                    break;
                }
            }

            //new a policy
            if (i === me.tempCachedPolicy.length) {
                me.tempCachedPolicy.push({
                    GroupUserName: groupuser,
                    Roles: Roles
                });
            }
            
            return JSON.stringify(me.tempCachedPolicy);
        },
        _getRoles: function () {
            var me = this;

            forerunner.ajax.ajax({
                type: "GET",
                dataType: "JSON",
                url: forerunner.config.forerunnerAPIBase() + "ReportManager/ListRoles",
                async: false,
                data: {
                    type: me.curType,
                    itemPath: me.curPath,
                    instance: me.options.rsInstance
                },
                success: function (data) {
                    if (data.Exception) {
                        me.cachedRoles = null;
                        return;
                    }

                    me.cachedRoles = data;
                },
                fail: function (data) {
                    me.curPath = null;
                },
            });
        },
        _getPolicy: function () {
            var me = this;

            forerunner.ajax.ajax({
                type: "GET",
                dataType: "JSON",
                url: forerunner.config.forerunnerAPIBase() + "ReportManager/GetItemPolicies",
                async: false,
                data: {
                    itemPath: me.curPath,
                    instance: me.options.rsInstance
                },
                success: function (data) {
                    if (data.Exception) {
                        me.cachedPolicy = null;
                        return;
                    }

                    me.isInheritParent = data.isInheritParent;
                    me.cachedPolicy = data.policyArr;
                },
                fail: function (data) {
                    me.curPath = null;
                },
            });
        },
        _setPolicy: function (policyArr, callback) {
            var me = this;

            forerunner.ajax.ajax({
                type: "POST",
                dataType: "JSON",
                url: forerunner.config.forerunnerAPIBase() + "ReportManager/SetItemPolicies",
                async: true,
                data: {
                    itemPath: me.curPath,
                    policies: policyArr,
                    instance: me.options.rsInstance,
                },
                success: function (data) {
                    if (data.Exception) {
                        forerunner.dialog.showMessageBox(me.options.$appContainer, data.Exception.Message);

                        console.log('update item policy wrong', data.Exception);
                        return;
                    }

                    //update cached policy only when set policy success
                    me.cachedPolicy = me.tempCachedPolicy || me.cachedPolicy;
                    me.tempCachedPolicy = null;

                    me.isInheritParent = false;
                    me._refreshUI();

                    if (callback && typeof callback === "function") {
                        callback();
                    }
                },
                fail: function (data) {
                    me.tempCachedPolicy = null;
                },
            });
        },
        _inheritParentPolicy: function () {
            var me = this;

            forerunner.ajax.ajax({
                type: "POST",
                dataType: "JSON",
                url: forerunner.config.forerunnerAPIBase() + "ReportManager/InheritParentSecurity",
                async: true,
                data: {
                    itemPath: me.curPath,
                    instance: me.options.rsInstance,
                },
                success: function (data) {
                    if (data.Exception) {
                        forerunner.dialog.showMessageBox(me.options.$appContainer, data.Exception.Message);

                        console.log('inherit parent policy wrong', data.Exception);
                        return;
                    }

                    me.cachedPolicy = null;
                    me.isInheritParent = true;
                    me._refreshUI();
                },
                fail: function (data) {
                },
            });
        },
        _breakInherit: function () {
            var me = this;

            me._setPolicy(JSON.stringify(me.cachedPolicy));
        },
        _deletePolicy: function (groupuser) {
            var me = this,
                index = 0;

            for (var i = 0; i < me.cachedPolicy.length; i++) {
                if (me.cachedPolicy[i].GroupUserName === groupuser) {
                    index = i;
                    break;
                }
            }

            me.cachedPolicy.splice(index, 1);
            me._setPolicy(JSON.stringify(me.cachedPolicy));
        },
        // draw layer-1 UI to show exist policy
        _drawPolicyUI: function (data) {
            var html = [],
                tpl;
            
            for (var i = 0, len = data.length; i < len; i++) {
                var names = [];

                for (var j = 0; j < data[i].Roles.length; j++) {
                    names.push(data[i].Roles[j].Name);
                }

                tpl = "<li>" +
                        "<div class='acc'>" +
                            "<span>" + data[i].GroupUserName + "</span>" +
                            "<a href='javascript:void(0);' class='tip' title='" + locData.security.detail + "'>...</a>" +
                            "<a href='javascript:void(0);' class='funcBtn delete'>" + locData.common.deleteBtn + "</a>" +
                            "<a href='javascript:void(0);' class='funcBtn edit'>" + locData.common.edit + "</a>" +
                       "</div>" +
                       "<div class='role'>" +
                           "<span class='tit'>" + locData.security.roles + ":&nbsp;</span>" +
                           "<span class='txt'>" + names.join(', ') + "</span>" +
                       "</div></li>";

                html.push(tpl);
            }

            return html.join('');
        },
        // draw layer-2 UI to show all available roles
        _drawRoleUI: function (data) {
            var html = [],
               tpl;

            for (var i = 0, len = data.length; i < len; i++) {
                tpl = "<li>" +
                       "<div class='role-name'>" +
                            "<span class='chk'><input class='acc-chk' type='checkbox' data-acc='" + data[i].Name + "' /></span>" +
                            "<span class='acc-name'>" + data[i].Name + "</span>" +
                            "<a href='javascript:void(0);' class='tip' title=" + locData.security.desp + ">...</a>" +
                       "</div>" +
                        "<div class='desp'>" +
                           "<span class='tit'>" + locData.security.desp + ":&nbsp;</span>" +
                           "<span class='txt'>" + data[i].Description + "</span>" +
                       "</div></li>";

                html.push(tpl);
            }

            return html.join('');
        },
        _getParentName: function (curPath) {
            var index = curPath.lastIndexOf("/"),
                strTemp = curPath.substring(0, index);
                
            index = strTemp.lastIndexOf("/");
            var returnStr = strTemp.substring(index + 1);

            return returnStr === "" ? locData.security.home : returnStr;
        },
        _getItemName: function (curPath) {
            return forerunner.helper.getItemName(curPath, locData.security.home);
        }
    });
});