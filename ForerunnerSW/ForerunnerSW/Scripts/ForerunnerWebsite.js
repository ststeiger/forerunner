


function MaunualLicense() {

    var data = $("#Key").val() ;
    $.ajax(
        {
            type: "POST",
            dataType: "text",
            url: "/register/api/License",
            data: data,                    
            async: false,
            success: function (data) {
                $("#ManualResponce").val(data);
            },
            error: function ( jqXHR ,  textStatus, errorThrown)
            {
                alert("License Server Error");
            }
        });

}

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
        ga("send", "event", "Video", "click", "Image",0);
        $("#video").show();
        //$("#video").onclick.call();
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

$(document).ready(function () {
    SetupSlider();
    
});

function SetupSlider() {
    var slideLeft;
    var slideRight;

    if ($("#SlideLeft").length === 1)

        slideLeft = $("#SlideLeft").bxSlider({
            mode: 'horizontal',
            autoHover: true,
            autoControls: false,
            controls: false,
            pager: false,
            responsive:true
        });

    if ($("#SlideRight").length === 1)
        slideRight = $("#SlideRight").bxSlider({
            mode: 'horizontal',
            autoHover: true,
            autoControls: false,
            controls: false,
            pager: false,
            responsive: true
        });

    if ($("#SliderForward").length === 1)
        $("#SliderForward").click(function () {
            slideLeft.goToNextSlide();
            slideRight.goToNextSlide();
            return false;
        });
    if ($("#SliderBack").length === 1)
        $("#SliderBack").click(function () {
            slideLeft.goToPrevSlide();
            slideRight.goToPrevSlide();
            return false;
        });

    if (slideLeft && slideRight){
        slideLeft.parent().css("height", "");
        window.setInterval(function () { NextSlide(slideRight, slideLeft); }, 8000);
    }

    //if ($("#Slide").length > 0)
    //    $(window).on("resize", function () { $("#Slide").hide().show(1); });
}

function NextSlide(right,left) {
    right.goToNextSlide();
    left.goToNextSlide();

    $(left).parent().css("height", "");
    $(left).css("height", "");
}

//var page = $(document).attr("title");
//if ($("#"+page))
//    $("#"+page).addClass("TopNavSelected");

