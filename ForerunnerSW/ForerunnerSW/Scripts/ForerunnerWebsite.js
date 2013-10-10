
function ReSizeFooter() {
    var footer = $(".footer");
    if ($(window).height() > footer.offset().top)
        footer.height($(window).height() - footer.offset().top);
    else
        footer.height("150px");
}
ReSizeFooter();
$(window).resize(ReSizeFooter);

