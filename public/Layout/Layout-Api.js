/*
 Shared helpers for the admin pages: authenticated API calls and S3 file upload.
 Upload types (each goes to its own S3 folder):
   notice-board | transfer-certificate | mandatory-disclosure | gallery-image
*/
const DavApi = {
    LOGIN_PAGE: "/Dav-Login.html",

    token() {
        return localStorage.getItem("authToken");
    },

    requireLogin() {
        if (!this.token()) {
            window.location.href = this.LOGIN_PAGE;
            return false;
        }
        return true;
    },

    async handle(response) {
        if (response.status === 401 || response.status === 403) {
            localStorage.removeItem("authToken");
            alert("Session expired. Please login again.");
            window.location.href = this.LOGIN_PAGE;
            throw new Error("Unauthorized");
        }

        let data = {};
        try {
            data = await response.json();
        } catch (e) { /* non-JSON response */ }

        if (!response.ok || data.status === "false" || data.status === false) {
            throw new Error(data.message || (typeof data.response === "string" ? data.response : "") || "Request failed.");
        }
        return data;
    },

    /* JSON POST. `data` is sent as { data: [...] } which is what the ourSchool routes expect. */
    async post(path, records) {
        const response = await fetch(`/api/ourSchool/${path}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${this.token()}`
            },
            body: JSON.stringify({ data: Array.isArray(records) ? records : [records] })
        });
        return this.handle(response);
    },

    async get(path) {
        const response = await fetch(`/api/ourSchool/${path}`, {
            headers: { "Authorization": `Bearer ${this.token()}` }
        });
        return this.handle(response);
    },

    /* S3 folder per purpose (sent as the X-UPLOADED-PATH header) */
    FOLDERS: {
        "notice-board": "NoticeBoardFiles",
        "transfer-certificate": "TransferCertificateFiles",
        "mandatory-disclosure": "DocumentFiles",
        "gallery-image": "GalleryImages"
    },

    /* Upload File objects to S3. Returns [{ fileName, userFileName, folder, url }] in the same order. */
    async upload(type, files) {
        const folder = this.FOLDERS[type];
        if (!folder) throw new Error("Unknown upload type: " + type);

        const uploaded = [];
        for (const file of Array.from(files)) {
            const form = new FormData();
            form.append("file", file);

            const response = await fetch("/api/file-upload/api-post-upload-file-to-storage", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${this.token()}`,
                    "X-UPLOADED-PATH": folder
                },
                body: form
            });
            const data = await this.handle(response);
            uploaded.push({
                fileName: data.response.FILE_NAME,
                userFileName: data.response.USER_FILE_NAME,
                folder: data.response.FOLDER,
                url: data.response.URL
            });
        }
        return uploaded;
    },

    async deleteFile(type, fileName) {
        const response = await fetch(
            `/api/file-upload/api-delete-file-from-storage?FILE_NAME=${encodeURIComponent(fileName)}`,
            {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${this.token()}`,
                    "X-UPLOADED-PATH": this.FOLDERS[type]
                }
            }
        );
        return this.handle(response);
    },

    /* Academic session (April - March), e.g. "2026-27" */
    sessionYear(date = new Date()) {
        const start = date.getMonth() >= 3 ? date.getFullYear() : date.getFullYear() - 1;
        return `${start}-${String(start + 1).slice(-2)}`;
    },

    /* Unwraps rows that may come as [{ JSON_VALUE: { response: [...] } }] or a flat array */
    rows(response) {
        if (!Array.isArray(response)) return [];
        const first = response[0];
        if (first && first.JSON_VALUE !== undefined) {
            let inner = first.JSON_VALUE;
            if (typeof inner === "string") {
                try { inner = JSON.parse(inner); } catch (e) { return []; }
            }
            return inner && Array.isArray(inner.response) ? inner.response : [];
        }
        return response;
    },

    /* Disable a button while an async action runs */
    async busy(button, work) {
        const label = button.textContent;
        button.disabled = true;
        button.textContent = "Saving...";
        try {
            return await work();
        } finally {
            button.disabled = false;
            button.textContent = label;
        }
    }
};
