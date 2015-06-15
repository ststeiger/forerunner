var allSamples = allSamples || {};

$(function () {
    allSamples.parameters = {
        init: function (target) {
            var $target = $("#" + target);
            var $reportArea = $target.find(".as-sample");
            if ($reportArea.length === 0) {
                $reportArea = $("<div class='as-sample'></div>")
                $target.html($reportArea);

                $reportArea.html("<h3>Parameters</h3>");
            }
        }
    }
});  // function()
