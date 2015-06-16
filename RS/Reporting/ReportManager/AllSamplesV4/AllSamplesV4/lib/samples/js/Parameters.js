// This sample is a little different than the others in that the definition of the parameters
// and the report to load must match. So in order to run this sample you will need to edit
// code below for your specific report and associated parameter definition.

var allSamples = allSamples || {};

$(function () {
    allSamples.parameters = {
        init: function (target) {
            if (allSamples.sampleExists(target)) {
                // Only create the sample once
                return;
            }
            var $sampleArea = allSamples.getSampleArea(target);

            // Create the reportViewerEZ widget and hold onto a reference
            var $reportViewerEZ = $sampleArea.reportViewerEZ({
                isReportManager: false,
                isFullScreen: false
            });

            // The syntax for the parameters object can be generated from the output of the 
            // function reportParameter.getParamsList(). We created an optional, utility
            // dialog that you can use to generate parameters for any report by installing
            // ParamUtil.js into a Mobilizer installation.
            //
            // For instructions how to use the ParamUtil, see the forum article here:
            //
            //      https://forerunnersw.com/SMForum/index.php?topic=60.msg79#msg79
            // 
            var parameters = {
                "ParamsList": [{
                    "Parameter": "StartDate",
                    "IsMultiple": "false",
                    "Type": "DateTime",
                    "Value": "2003-01-01",
                    "Prompt": "Start Date:"
                }, {
                    "Parameter": "EndDate",
                    "IsMultiple": "false",
                    "Type": "DateTime",
                    "Value": "2003-12-31",
                    "Prompt": "End Date:"
                }, {
                    "Parameter": "ProductCategory",
                    "IsMultiple": "false",
                    "Type": "Integer",
                    "Value": "4",               // 4 = "Accessories"
                    "Prompt": "Category:"
                }, {
                    "Parameter": "ProductSubcategory",
                    "IsMultiple": "true",
                    "Type": "Integer",
                    "Value": ["28", "31"],      // 28 & 31 = "Bottles and Cages" & "Helmets"
                    "Prompt": "Subcategory:"
                }]
            }

            // Get the reportViewer widget from reportViewerEZ
            var $reportViewer = $reportViewerEZ.reportViewerEZ("getReportViewer");

            // Load the report and set the parameter definitions for:
            //
            //  Accessories
            //      Bottles and Cages
            //      Helmets
            $reportViewer.reportViewer("loadReport", "/AdventureWorks 2008 Sample Reports/Product Line Sales 2008", 1, parameters);

        }  // init
    }  // allSamples.parameters
});  // function()
