
function ReSizeFooter() {
    var footer = $(".Footer");
    var Page = $(".ForerunnerPage");
    var Logo = $(".ForerunnerLogo");
    var l;
    var i;


    if ($(window).height() > footer.offset().top && $(window).scrollTop() === 0) {
        footer.height($(window).height() - footer.offset().top);
    }
    else {
        footer.css("height", "");
    }

    if ($(window).width() < 509) {
        for ( l = 0; l < Logo.length; l++) {
            $(Logo[l]).width($(window).width()-10);
        }

        for ( i = 0; i < Page.length; i++) {
            $(Page[i]).width($(window).width()-10);
        }
    }
   
    if ($(window).width() >= 509) {
        for (l = 0; l < Logo.length; l++) {
            $(Logo[l]).css("width","");
        }
        for (i = 0; i < Page.length; i++) {
            $(Page[i]).css("width", "");
        }
    }
}
ReSizeFooter();
$(window).resize(ReSizeFooter);

if ($("#image")) {
    $("#image").on("click", function () {
        $("#image").hide();
        $("#video").show();
        $("#video").onclick.call();
    });
}

var page = $(document).attr('title');
$("#"+page).addClass("TopNavSelected");

