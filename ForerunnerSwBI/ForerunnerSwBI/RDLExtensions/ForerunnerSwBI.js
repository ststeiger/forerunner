// ForerunnerSwBI
//
// Forerunner Software Business Intelligence report support script

ForerunnerSwBI = {
    onExtendTrial: function (e) {
        // https://forerunnersw.com/register/api/license/extendtrial?Key=H275gW&Hash=12
        var hashCode = moment().format("M");
        var inputs = e.data.getInputs(e.data.element);
        var key = inputs[0];
        var url = "https://forerunnersw.com/register/api/license/extendtrial?Key=" + key.value + "&Hash=" + hashCode;
        var jqxhr = $.get(url, null, null, "text/xml");
        jqxhr.always(function () {
            if (jqxhr.status === 200) {
                alert(jqxhr.responseText);
                var reportViewer = e.data.reportViewer;
                reportViewer.reportViewer("refreshReport");
            } else {
                alert("satus: " + jqxhr.status + ", " + jqxhr.responseText);
            }
        });
    },
    _dateFormat: "YYYY-MM-DD",
    onNextWeek: function (e) {
        var me = this;
        me.changeWeek(e, 7);
    },
    onPrevWeek: function (e) {
        var me = this;
        me.changeWeek(e, -7);
    },
    changeWeek: function (e, offset) {
        var me = this;
        var reportViewer = e.data.reportViewer;
        var reportParameter = me.getReportParameter(reportViewer);
        var params = JSON.parse(reportParameter.reportParameter("getParamsList", false));
        var endDate = params.ParamsList[1].Value;
        params.ParamsList[0].Value = moment(endDate).add(offset, 'days').startOf('week').format(me._dateFormat);
        params.ParamsList[1].Value = moment(endDate).add(offset, 'days').endOf('week').format(me._dateFormat);
        reportViewer.reportViewer("refreshParameters", params, true);
    },
    getReportViewerEZ: function (reportViewer) {
        var me = this;
        var parents = reportViewer.parents();
        var reportViewerEZ = null;
        parents.each(function (index, element) {
            var $element = $(element);
            var data = $element.data();
            if (data && data["forerunnerReportViewerEZ"]) {
                reportViewerEZ = $element;
            }
        });
        return reportViewerEZ;
    },
    getReportParameter: function (reportViewer) {
        var me = this;
        var reportViewerEZ = me.getReportViewerEZ(reportViewer);
        return reportViewerEZ.reportViewerEZ("getReportParameter");
    }
}  // ForerunnerSwBI
