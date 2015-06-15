var allSamples = allSamples || {};

$(function () {
    allSamples.parameters = {
        init: function (target) {
            if (allSamples.sampleExists(target)) {
                // Only create the sample once
                return;
            }
            var $sampleArea = allSamples.getSampleArea(target);
            $sampleArea.html("<h3>Parameters</h3>");
        }  // init
    }  // allSamples.parameters
});  // function()
