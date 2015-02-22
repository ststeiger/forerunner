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
    * @prop {Object} options.$reportViewer - Report viewer widget
    * @prop {Object} options.$appContainer - The container jQuery object that holds the application
    * @prop {String} options.rsInstance - Optional, Report service instance name
    *
    * @example
    * $("#property").forerunnerSecurity({
    *     $appContainer: me.options.$appContainer,
    *     $reportExplorer: me.$explorer,
    *     $reportViewer: me.$viewer
    * });
    */
    $.widget(widgets.getFullname(widgets.forerunnerSecurity), {
        options: {
            $appContainer: null,
            $reportViewer: null,
            $reportExplorer: null,
            rsInstance: null,
        },
        _init: function () {
            var me = this;

            me.guid = forerunner.helper.guidGen();
            me.curPath = null;

            me.element.html("");
            me.element.off(events.modalDialogGenericSubmit);
            me.element.off(events.modalDialogGenericCancel);

            var headerHtml = forerunner.dialog.getModalDialogHeaderHtml('fr-icons24x24-tags', locData.security.title, "fr-security-cancel", locData.common.cancel);

            var $container = new $(
               "<div class='fr-core-dialog-innerPage fr-core-center'>" +
                   headerHtml +
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
                           "<div class='operate-1'>" +
                                "<input type='button' class='fr-security-new fr-core-dialog-button' value='" + locData.security.newPolicy + "' />" +
                                "<input type='button' class='fr-security-reset fr-core-dialog-button' value='" + locData.security.reset + "' />" +
                           "</div>" +
                           "<div class='operate-2'>" +
                                "<input type='button' class='fr-security-submit fr-core-dialog-button' value='" + locData.common.submit + "' />" +
                                "<input type='button' class='fr-security-cancel fr-core-dialog-button' value='" + locData.common.cancel + "' />" +
                           "</div>" +
                       "</div>" +
                   "</div>" +
               "</div>");

            me.element.append($container);
            me.$layer1 = me.element.find(".layer-1");
            me.$layer2 = me.element.find(".layer-2");
            me.$groupuser = me.$layer2.find(".fr-security-groupuser");

            me.$operate1 = me.element.find(".operate-1");
            me.$operate2 = me.element.find(".operate-2");

            me.$reset = me.$operate1.find(".fr-security-reset");

            me.element.on(events.modalDialogGenericSubmit, function () {
                me._submit()
            });

            me.element.on(events.modalDialogGenericCancel, function () {
                me._clickCancel();
            });

            me._bindEvents();

            me.element.append($container);
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
            me.$reset.on("click", function () {
                if (me.isInheritParent || me.isRoot) {
                    me.closeDialog();
                } else {
                    if (!confirm('Are you sure to set this item to inherit its parent security configuration?')) return;

                    me._inheritParentPolicy();
                }
            });

            //save the change, (new or update)
            me.element.find(".fr-security-submit").on("click", function () {
                me._submit();
            });

            //back to main layer, for close button at the right top corner, always close dialog
            me.element.find(".fr-security-cancel").on("click", function (e) {
                if ($(this).hasClass('fr-core-dialog-cancel')) {
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
                if (!confirm('Are you sure to delete this?')) return;

                // Todo.. call delete Api to delete this role assignment
                var groupuser = $(this).siblings("span").text();
                me._deletePolicy(groupuser);
            });

            // show or hide the roles description
            me.$layer2.delegate('.tip', 'click', function (e) {
                $(this).closest('li').find('.desp').toggle();
            });

            me.$layer2.delegate('.acc-name', 'click', function (e) {
                var $chk = $(this).closest('li').find('.acc-chk').trigger('click');
            });
            /******************* end of bind operate button in each row *********************/
        },
        setData: function (path, type) {
            var me = this;

            if (me.curPath !== path) {
                me.curPath = path;
                me.curType = type;

                me.cachedRoles = null;
                me.cachedPolicy = null;

                if (me.curPath === '/') {
                    me.isRoot = true;
                }
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

                me.$layer2.show();
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
        _create: function () {

        },
        _refreshUI: function () {
            var me = this;

            if (!me.cachedPolicy) {
                me._getPolicy();
            }

            if (me.isInheritParent || me.isRoot) {
                me.$reset.val(locData.common.cancel);
            } else {
                me.$reset.val(locData.security.reset);
            }

            var layer1 = me._drawPolicyUI(me.cachedPolicy);
            me.$layer1.children('ul').html('').append(layer1);

            //draw layer-2 later after layer-1 done
            setTimeout(function () {
                if (!me.cachedRoles) {
                    me._getRoles();
                }

                var layer2 = me._drawRoleUI(me.cachedRoles);
                me.$layer2.children('ul').html('').append(layer2);
            }, 0);
        },
        _submit: function () {
            var me = this;

            var policyArr = me._generatePostData();

            if (policyArr === null) return;

            me._setPolicy(policyArr);
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

            for (i = 0; i < me.cachedPolicy.length; i++) {
                if (me.cachedPolicy[i].GroupUserName === groupuser) {
                    me.cachedPolicy[i].Roles = Roles;
                    break;
                }
            }

            //new a policy
            if (i === me.cachedPolicy.length) {
                me.cachedPolicy.push({
                    GroupUserName: groupuser,
                    Roles: Roles
                });
            }
            
            return JSON.stringify(me.cachedPolicy)
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
        _setPolicy: function (policyArr) {
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

                    me.isInheritParent = false;
                    me._refreshUI();
                    me._clickCancel();
                },
                fail: function (data) {
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
                            "<a href='javascript:void(0);' class='tip' title='" + locData.security.roles + "'>...</a>" +
                            "<a href='javascript:void(0);' class='delete'>Delete</a>" +
                            "<a href='javascript:void(0);' class='edit'>Edit</a>" +
                       "</div>" +
                       "<div class='role'>" +
                           "<span class='tit'>Roles:</span>" +
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
                           "<span class='tit'>Description:</span>" +
                           "<span class='txt'>" + data[i].Description + "</span>" +
                       "</div></li>";

                html.push(tpl);
            }

            return html.join('');
        }
    });
});