
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

function GetURLParameter(sParam)
{
    var sPageURL = window.location.search.substring(1);
    var sURLVariables = sPageURL.split("&");
    for (var i = 0; i < sURLVariables.length; i++) 
    {
        var sParameterName = sURLVariables[i].split("=");
        if (sParameterName[0] === sParam) 
        {
            return sParameterName[1];
        }
    }
}

function GetRef()
{
    var ref = GetURLParameter("ref");
    if (ref === undefined)
        ref = document.referrer;
    return ref;
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

if ($("#zip")) {
    $("#zip").hide();
}

var iref = $("#referer");
if (iref) {
    iref.val(GetRef());
    iref.hide();
}

if ($("#register")) {
    $("#register").attr("href", "../home/register?ref=" + GetRef());
}


//var page = $(document).attr("title");
//if ($("#"+page))
//    $("#"+page).addClass("TopNavSelected");

