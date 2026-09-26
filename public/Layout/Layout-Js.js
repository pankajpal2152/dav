// Menu behaviour for the public site header (same behaviour as the live site).
// The header is injected after page load, so handlers are attached to the document
// (event delegation) and work whenever the header arrives. Requires jQuery.
(function () {
  if (window.__davLayoutNavBound || !window.jQuery) return;
  window.__davLayoutNavBound = true;
  var $ = window.jQuery;

  // mobile side menu: open / close
  $(document).on("click", ".navbar-dav-public, .closebtn", function (e) {
    e.preventDefault();
    $(".navbar-dav").toggleClass("visible");
    $("body").toggleClass("cover-bg");
  });

  // dropdowns on small screens (desktop uses CSS :hover)
  $(document).on("click", ".our_school_show", function () {
    $("ul.dropdown").toggleClass("show");
    $(".first_caret").toggleClass("rotate");
  });
  $(document).on("click", ".gallery_info", function () {
    $("ul.dropdown_1").toggleClass("show1");
    $(".second_caret").toggleClass("rotate1");
  });

  // same as the live site: a clicked menu item is highlighted (the page then navigates)
  $(document).on('click', '.highlight_nav li a', function () {
    $('.highlight_nav li').removeClass('current');
    $(this).parent('li').addClass('current');
  });

  // kept so pages that still call it do not break
  window.initLayoutNav = function () {};
})();
