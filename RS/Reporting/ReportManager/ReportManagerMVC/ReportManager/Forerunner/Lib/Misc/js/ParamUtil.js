var forerunner = forerunner || {};
forerunner.ssr = forerunner.ssr || {};

$(function () {
  var widgets = forerunner.ssr.constants.widgets;
  var events = forerunner.ssr.constants.events;

  var methodOpts = {
    loadReport: "reportViewer.loadReport",
    refreshParameters: "reportViewer.refreshParameters"
};

  $.widget(widgets.getFullname("paramUtil"), {
    options: {
      $appContainer: null,
      $reportViewerEZ: null,
      $reportParameter: null,
      reportPath: "",
      paramListObj: {}
    },
    _create: function () {
      var me = this;
    },
    _init: function () {
      var me = this;
      me.locData = forerunner.localize.getLocData(forerunner.config.forerunnerFolder() + "ReportViewer/loc/ReportViewer");

      me.element.html("");
      me.element.off(events.modalDialogGenericSubmit);
      me.element.off(events.modalDialogGenericCancel);

      var headerHtml = forerunner.dialog.getModalDialogHeaderHtml('fr-icons24x24-paramarea', "Parameter Utility", "fr-putil-cancel", "Cancel");
      var $form = new $(
      "<div class='fr-core-dialog-innerPage fr-core-center'>" +
          headerHtml +
          // form
          "<form class='fr-putil-form fr-core-dialog-form'>" +
              // Report path
              "<p>Report Path:" + "</p><span class='fr-putil-normal-text'>" + me.options.reportPath + "</span>" +
              // Parameter List Text
              "<p>ParamList</>" +
              "<div class='fr-putil-plist'>" +
                "<textarea name='plist' wrap='soft' class='fr-putil-plist-textarea-id fr-putil-normal-text'>" + JSON.stringify(me.options.paramListObj) + "</textarea>" +
              "</div>" +
              // Method call option
              "<p>Method:</p>" +
              "<select class='fr-putil-methods'>" +
              "</select>" +
              // Submit button
              "<div class='fr-core-dialog-submit-container'>" +
                  "<div class='fr-core-center'>" +
                      "<input name='submit' type='button' class='fr-putil-submit-id fr-core-dialog-submit fr-core-dialog-button' value='" + "Submit" + "'/>" +
                  "</div>" +
              "</div>" +
          "</form>" +
      "</div>");

      me.element.append($form);

      // Add the method options
      me.$methodSelect = $form.find(".fr-putil-methods");
      for (var member in methodOpts) {
        me.$methodSelect.append($("<option value=" + member + ">" + methodOpts[member] +"</option>"));
      }

      me.$form = me.element.find(".fr-putil-form");
      //disable form auto submit when click enter on the keyboard
      me.$form.on("submit", function () { return false; });
      me._resetValidateMessage();

      me.element.find(".fr-putil-submit-id").on("click", function (e) {
        me._submitPUtil();
      });

      me.element.find(".fr-putil-cancel").on("click", function (e) {
        me.closeDialog();
      });

      me.element.on(events.modalDialogGenericSubmit, function () {
        me._submitPUtil();
      });

      me.element.on(events.modalDialogGenericCancel, function () {
        me.closeDialog();
      });
    },
    _submitPUtil: function () {
      var me = this;

      var $reportViewer = me.options.$reportViewerEZ.reportViewerEZ("getReportViewer");
      var $textArea = me.element.find(".fr-putil-plist-textarea-id");
      var paramList = $textArea.val();

      if (me.$methodSelect.val() === "loadReport") {
        // loadReport: function (reportPath, pageNum, parameters,sessionID)
        $reportViewer.reportViewer("loadReport", me.options.reportPath, 1, paramList);
      } else if (me.$methodSelect.val() === "refreshParameters") {
        // refreshParameters: function (paramList, submitForm, pageNum, renderParamArea, isCascading)
        $reportViewer.reportViewer("refreshParameters", paramList);
      } else {
        alert("Error - Unrecognized method: " + me.$methodSelect.val());
      }

      me.closeDialog();
    },
    /**
     * Open print dialog
     *
     * @function $.forerunner.reportPrint#openDialog
     */
    openDialog: function () {
      var me = this;
      forerunner.dialog.showModalDialog(me.options.$appContainer, me);
    },
    /**
     * Close print dialog
     *
     * @function $.forerunner.reportPrint#openDialog
     */
    closeDialog: function () {
      var me = this;
      forerunner.dialog.closeModalDialog(me.options.$appContainer, me);
      //forerunner.dialog.closeModalDialog(me.options.$appContainer, function () {
      //    me.element.css("display", "");
      //});
    },
    _validateForm: function (form) {
      form.validate({
        errorPlacement: function (error, element) {
          error.appendTo($(element).parent().find("span"));
        },
        highlight: function (element) {
          $(element).parent().find("span").addClass("fr-putil-error-position");
          $(element).addClass("fr-putil-error");
        },
        unhighlight: function (element) {
          $(element).parent().find("span").removeClass("fr-putil-error-position");
          $(element).removeClass("fr-putil-error");
        }
      });
    },
    _resetValidateMessage: function () {
      var me = this;
      var error = me.locData.validateError;

      jQuery.extend(jQuery.validator.messages, {
        required: error.required,
        number: error.number,
        digits: error.digits
      });
    }
  }); //$.widget

  // Document Ready
  //
  // Add the Param Util button to the right toolbar
  //
  $(document).ready(function (e) {
    var viewerEZSelector = ".fr-layout-container";
    var $viewerEZCollection = $(document).find(viewerEZSelector);

    if ($viewerEZCollection.length === 0) {
      console.log("ParamUtil failed - unable to find: " + viewerEZSelector);
      return;
    }

    var findDialog = function ($container, dialogClass) {
      var me = this;

      var $dlg = $container.find("." + dialogClass);
      if ($dlg.length === 0) {
        $dlg = new $("<div class='fr-dialog-id fr-core-dialog-layout fr-core-widget'/>");
        $dlg.addClass(dialogClass);
        $container.append($dlg);
      }

      return $dlg;
    }

    $viewerEZCollection.each(function (index) {
      var $reportViewerEZ = $(this);
      var $rightToolbar = $reportViewerEZ.reportViewerEZ("getRightToolbar");
      var $reportParameter = $reportViewerEZ.reportViewerEZ("getReportParameter");
      var $reportViewer = $reportViewerEZ.reportViewerEZ("getReportViewer");
      var reportPath = $reportViewer.reportViewer("getReportPath");

      var btnGetParameters = {
        toolType: "button",
        selectorClass: "fr-putil-getparams-id",
        imageClass: "fr-putil-getparams-btn",
        iconClass: "fr-putil-getparams24x24",
        tooltip: "Parameters Utility",
        events: {
          click: function (e) {
            var paramList = $reportParameter.reportParameter("getParamsList");
            if (paramList === null) {
              console.log("ParamUtil - getParamsList returned null");
              return;
            }
            var paramListObj = JSON.parse(paramList);
            var $pUtilDlg = findDialog($reportViewerEZ, "fr-putil-section")
            $pUtilDlg.paramUtil({
              $appContainer: $reportViewerEZ,
              $reportViewerEZ: $reportViewerEZ,
              $reportParameter: $reportParameter,
              reportPath: reportPath,
              paramListObj: paramListObj
            });
            $pUtilDlg.paramUtil("openDialog");
          }
        }
      }

      $rightToolbar.rightToolbar("addTools", 2, true, [btnGetParameters]);

    });

  });  // document ready

});  // $(function()

