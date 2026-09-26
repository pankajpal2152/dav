// Menu behaviour for the admin header (same behaviour as the live site). Requires jQuery.
// The header is injected after page load, so handlers are attached to the document
// (event delegation) and work whenever the header arrives.
(function () {
    if (window.__davAdminNavBound || !window.jQuery) return;
    window.__davAdminNavBound = true;
    var $ = window.jQuery;

    // mobile side menu: open / close
    $(document).on("click", ".navbar-dav-public, .closebtn", function (e) {
        e.preventDefault();
        $(".navbar-dav").toggleClass("visible");
        $("body").toggleClass("cover-bg");
    });

    // dropdowns on small screens (desktop uses CSS :hover)
    $(document).on("click", ".navbar-dav > ul > li > a", function () {
        var menu = $(this).siblings("ul");
        if (!menu.length) return;
        menu.toggleClass("show");
        $(this).find("i.fa-caret-down").toggleClass("rotate");
    });

    // logout: clear the login information and leave the admin panel
    $(document).on("click", "#adminLogout", function (e) {
        e.preventDefault();
        localStorage.clear();
        window.location.href = "/Home.html";
    });
})();

// kept so pages that still call it after loading the header do not break
function initAdminLayoutNav() { }

// The API returns rows as response: [ { JSON_VALUE: { status, response: [ ...rows ] } } ]
// (or a plain array). Returns the actual rows.
function rowsOf(response) {
    if (!Array.isArray(response)) return [];
    var first = response[0];
    if (first && first.JSON_VALUE !== undefined) {
        var inner = first.JSON_VALUE;
        if (typeof inner === "string") {
            try { inner = JSON.parse(inner); } catch (e) { return []; }
        }
        return inner && Array.isArray(inner.response) ? inner.response : [];
    }
    return response;
}
