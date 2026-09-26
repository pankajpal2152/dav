/* Helpers shared by the public pages that load data from the API. */
var SiteData = (function () {
    function escapeHtml(value) {
        return String(value == null ? "" : value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    /* The API wraps rows as response: [ { JSON_VALUE: { status, response: [ ...rows ] } } ] */
    function extractRows(response) {
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

    /* GET a public API route and return its rows */
    function getRows(url) {
        return fetch(url).then(function (response) {
            return response.json().then(function (data) {
                if (!response.ok || (data.status !== "true" && data.status !== true)) {
                    throw new Error(data.message || "Request failed.");
                }
                return extractRows(data.response);
            });
        });
    }

    /* Dates are always shown like the live site: 16 Mar 26 (whatever format the API returns) */
    var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    function formatDate(value) {
        if (value == null || value === "") return "";
        var text = String(value).trim();
        var day, month, year, m;

        if ((m = text.match(/^(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})/))) {            // 2026-03-16, 2026-03-16T10:00:00
            year = +m[1]; month = +m[2]; day = +m[3];
        } else if ((m = text.match(/^(\d{1,2})[-\/. ](\d{1,2})[-\/. ](\d{2,4})/))) {    // 16-03-2026, 16/03/26
            day = +m[1]; month = +m[2]; year = +m[3];
        } else if ((m = text.match(/^(\d{1,2})[-\/. ]([A-Za-z]{3,9})[-\/. ,]*(\d{2,4})/))) { // 16 Mar 26, 16-March-2026
            day = +m[1];
            month = MONTHS.map(function (x) { return x.toLowerCase(); }).indexOf(m[2].slice(0, 3).toLowerCase()) + 1;
            year = +m[3];
        } else {
            var parsed = new Date(text);
            if (isNaN(parsed.getTime())) return text;
            day = parsed.getDate(); month = parsed.getMonth() + 1; year = parsed.getFullYear();
        }

        if (!month || month > 12 || !day || day > 31) return text;
        return (day < 10 ? "0" : "") + day + " " + MONTHS[month - 1] + " " + String(year).slice(-2);
    }

    function fileUrl(folder, name) {
        if (!name) return "";
        if (/^(https?:)?\/\//i.test(name) || name.charAt(0) === "/") return name;
        return "/Uploadfiles/" + folder + "/" + encodeURIComponent(name);
    }

    /* Returns a YouTube embed URL, or "" when the link is not a YouTube link */
    function youTubeEmbed(link) {
        var url;
        try { url = new URL(link); } catch (e) { return ""; }
        var host = url.hostname.replace(/^www\./, "");
        var id = "";
        if (host === "youtu.be") {
            id = url.pathname.slice(1);
        } else if (host === "youtube.com" || host === "m.youtube.com") {
            if (url.pathname === "/watch") id = url.searchParams.get("v") || "";
            else if (/^\/(embed|shorts)\//.test(url.pathname)) id = url.pathname.split("/")[2] || "";
        }
        return /^[A-Za-z0-9_-]{6,}$/.test(id) ? "https://www.youtube.com/embed/" + id : "";
    }

    function videoPlayer(link, title) {
        var embed = youTubeEmbed(link);
        if (embed) {
            return '<iframe width="100%" height="200" src="' + escapeHtml(embed) + '" title="' + escapeHtml(title) +
                '" allow="accelerometer; encrypted-media; picture-in-picture; fullscreen" allowfullscreen loading="lazy"></iframe>';
        }
        if (/\.(mp4|webm|ogg)(\?.*)?$/i.test(link)) {
            return '<video controls preload="metadata" width="100%" height="200" src="' + escapeHtml(link) + '"></video>';
        }
        return '<a class="btn btn-primary" href="' + escapeHtml(link) + '" target="_blank" rel="noopener">Watch Video</a>';
    }

    /* Video cards (live look: .video-content title + description under the player) */
    function renderVideos(container, list) {
        var html = "";
        (list || []).forEach(function (video, i) {
            var link = String(video.URL || video.VIDEO_LINK || video.VIDEO_URL || "").trim();
            if (!/^https?:\/\//i.test(link)) return;
            var title = video.TITLE || ("Video " + (i + 1));
            html += '<div class="col-12 col-sm-6 col-md-4 gellery-img">' +
                '<div class="video-popup">' + videoPlayer(link, title) + '</div>' +
                '<div class="video-content"><h4>' + escapeHtml(title) + '</h4><p>' + escapeHtml(video.DESCRIPTION || "") + '</p></div>' +
                '</div>';
        });
        container.innerHTML = html || '<div class="col-12 text-center">No videos found.</div>';
    }

    /* Gallery cards; clicking one opens the photos in a modal (Bootstrap 4) */
    function renderGalleries(container, list) {
        var html = "";
        (list || []).forEach(function (g) {
            var thumb = fileUrl("GalleryImages", g.THUMBNAIL);
            html += '<div class="col-12 col-sm-6 col-md-3 gellery-img">' +
                '<a href="#" class="open-gallery" data-id="' + escapeHtml(g.GALLERY_SYS_ID) + '" data-title="' + escapeHtml(g.TITLE) + '">' +
                '<div class="img-container">' +
                (thumb ? '<img src="' + escapeHtml(thumb) + '" alt="' + escapeHtml(g.TITLE) + '">'
                       : '<img src="/assets/images/under-construction.png" alt="">') +
                '</div><div class="img-content">' + escapeHtml(g.TITLE) + '</div></a></div>';
        });
        container.innerHTML = html || '<div class="col-12 text-center">No galleries found.</div>';
    }

    function openGalleryModal(id, title) {
        var body = document.getElementById("div_image_load_all");
        body.innerHTML = '<div class="col-12 text-center">Loading...</div>';
        var heading = document.querySelector("#image_gallery_popup .modal-title");
        if (heading) heading.textContent = title || "Image Gallery";
        window.jQuery("#image_gallery_popup").modal("show");

        getRows("/api/ourSchool/api-get-view-gallery-image?ITEM=VIEW_ALL&GALLERY_SYS_ID=" + encodeURIComponent(id))
            .then(function (rows) {
                var html = "";
                rows.forEach(function (p) {
                    var src = fileUrl("GalleryImages", p.IMAGE_NAME);
                    if (!src) return;
                    html += '<div class="col-6 col-md-3"><div class="gallery_popup" style="width:100%;margin:5px 0;">' +
                        '<a href="' + escapeHtml(src) + '" target="_blank" rel="noopener"><img src="' + escapeHtml(src) + '" alt="' + escapeHtml(p.CAPTION) + '"></a>' +
                        '<div class="desc">' + escapeHtml(p.CAPTION || "") + '</div></div></div>';
                });
                body.innerHTML = html || '<div class="col-12 text-center">No photos found.</div>';
            })
            .catch(function () {
                body.innerHTML = '<div class="col-12 text-center">Unable to load photos.</div>';
            });
    }

    document.addEventListener("click", function (event) {
        var link = event.target.closest && event.target.closest(".open-gallery");
        if (link) {
            event.preventDefault();
            openGalleryModal(link.getAttribute("data-id"), link.getAttribute("data-title"));
        }
    });

    return {
        escapeHtml: escapeHtml,
        extractRows: extractRows,
        getRows: getRows,
        fileUrl: fileUrl,
        formatDate: formatDate,
        renderVideos: renderVideos,
        renderGalleries: renderGalleries
    };
})();
