/**
 * @file Contains the param set menu widget.
 *
 */

// Assign or create the single globally scoped variable
var forerunner = forerunner || {};

// Forerunner SQL Server Reports
forerunner.ssr = forerunner.ssr || {};

$(function () {
    var widgets = forerunner.ssr.constants.widgets;
    var events = forerunner.ssr.constants.events;

    /**
     * Widget used to show manage set menu widget, a sub widget of report parameter
     *
     * @namespace $.forerunner.paramSetMenu
     * @prop {Object} options - The options for parma set menu
     * @prop {Object} options.$reportViewer - The report viewer widget     
     * @prop {Object} options.$ReportViewerInitializer - The report viewer initializer instance     
     * @prop {Object} options.$parameter - parameter instance
     * @prop {Object} options.localData - localization data
     * @example
     *   $manageSetBtn.paramSetMenu({ 
     *      $reportViewer: $appContainer,
     *      $parameter: parameterContext,
     *      localData: localData,
     *   });   
     */
    $.widget(widgets.getFullname(widgets.paramSetMenu), {
        options: { 
            $appContainer: null,
            $ReportViewerInitializer: null,
            $reportViewer: null,
            $parameter: null,
            localData: null
        },
        _inited: false,
        _create: function () {
            var me = this;

            me.parameterModel = me.options.$ReportViewerInitializer.getParameterModel();
        },        
        _init: function () {
            var me = this;
            
            if (me._inited) {
                return;
            }

            //me.$switcher = me.element.find(".fr-param-paramset");
            me.localData = me.options.localData;
            me.canEdit = false;

            var tmpl = "<div class='fr-paramset-menu'>" +
                    "<div class='fr-paramset-btn' title='" + me.localData.toolbar.saveParam + "'>" +
                        "<div class='fr-icons24x24 fr-icons24x24-save-param fr-paramset-save'></div>" +
                    "</div>" +
                    "<div class='fr-paramset-btn' title='" + me.localData.toolbar.parameterSets + "'>" +
                        "<div class='fr-icons24x24 fr-icons24x24-parameterSets fr-paramset-edit'></div>" +
                    "</div>" +
                    "<div class='fr-paramset-dp' title='" + me.localData.toolbar.selectSet + "'>" +
                        "<select class='fr-rtb-select-set fr-paramset-select' readonly='true' ismultiple='false'></select>" +
                    "</div>" +
                "</div>";

            me.$paramSet = new $(tmpl);
            me.$save = me.$paramSet.find(".fr-paramset-save");
            me.$edit = me.$paramSet.find(".fr-paramset-edit");
            me.$select = me.$paramSet.find(".fr-paramset-select");
            me.$btnBox = me.$paramSet.find(".fr-paramset-btn");

            me.element.append(me.$paramSet);
            me._loadParamList();
            me._initEvent();
            me._inited = true;
        },
        _loadParamList: function () {
            var me = this,
                reportPath = me.options.$reportViewer.getReportPath();

            me.parameterModel.parameterModel("getAllParameterSets", reportPath, function (data) {
                me.$select.html("");

                $.each(data.optionArray, function (index, option) {
                    var encodedOptionName = forerunner.helper.htmlEncode(option.name);
                    var $option = $("<option value=" + option.id + ">" + encodedOptionName + "</option>");

                    me.$select.append($option);

                    option.id === data.selectedId && me.$select.prop("selectedIndex", index);
                });
            });
        },
        _onModelChange: function () {
            var me = this;

            if (me.parameterModel && me.parameterModel.parameterModel("canUserSaveCurrentSet")) {
                me.canEdit = true;
                me.$btnBox.removeClass("fr-paramset-disabled");
            } else {
                me.canEdit = false;
                me.$btnBox.addClass("fr-paramset-disabled");
            }
        },
        _initEvent: function () {
            var me = this;

            me.canEdit = me.parameterModel.parameterModel("canUserSaveCurrentSet");

            me.parameterModel.on(events.parameterModelChanged(), function (e, data) {
                me._onModelChange.call(me, e, data);
            });

            me.parameterModel.on(events.parameterModelSetChanged(), function (e, data) {
                me._onModelChange.call(me, e, data);
            });

            // save current parameters
            me.$save.on("click", function (e) {
                if (me.canEdit !== true) return;

                var parameterList = me.options.$parameter.getParamsList();

                me.parameterModel.parameterModel("save",
                    parameterList,
                    function (data) {
                        forerunner.dialog.showMessageBox(me.options.$appContainer, me.localData.messages.saveParamSuccess, me.localData.toolbar.saveParam);
                    },
                    function () {
                        forerunner.dialog.showMessageBox(me.options.$appContainer, me.localData.messages.saveParamFailed, me.localData.toolbar.saveParam);
                    }
                );
            });

            // open the manage set dialog and edit
            me.$edit.on("click", function () {
                var parameterList = me.options.$parameter.getParamsList();
                
                me.options.$ReportViewerInitializer.showManageParamSetsDialog(parameterList);
            });

            // select an saved parameter 
            me.$select.on("change", function () {
                var id = this.value;
                me.parameterModel.parameterModel("setCurrentSet", id);
            });
        },
        destory: function () {
            var me = this;

            me.$paramSet.remove();
        }
    });  // $.widget

});  // $(function ()
