
function ReSizeFooter() {
    var footer = $(".footer");
    if ($(window).height() > footer.offset().top && $(window).scrollTop() === 0) {
        footer.height($(window).height() - footer.offset().top);
    }
    else {
        footer.css("height", "");
    }
        
}
ReSizeFooter();
$(window).resize(ReSizeFooter);

