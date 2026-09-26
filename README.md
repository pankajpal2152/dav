# DAV School – Node.js + Express + MySQL

Express server that serves the static school website (`public/`) and the JSON API
(`/api/ourSchool/*`, MySQL stored procedures, JWT auth, Swagger docs).

## Run locally

```
npm install
npm run dev
```

1. Copy `.env.example` to `.env` and fill in the DB credentials and `JWT_SECRET`.
2. Open http://localhost:3009 (site) or http://localhost:3009/api-docs (Swagger).

`npm start` runs without nodemon.

Uploaded files go to the S3 bucket (see `.env`), one folder per purpose, and are served via `/Uploadfiles/<folder>/<file>`.

## File upload / download (AWS S3)

Set `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET_NAME` in `.env`
(the storage APIs return 503 until they are set). Each purpose uses its own S3 folder, passed in the
`X-UPLOADED-PATH` header:

| Purpose                | `X-UPLOADED-PATH`          |
|------------------------|----------------------------|
| Notice Board           | `NoticeBoardFiles`         |
| Transfer Certificate   | `TransferCertificateFiles` |
| Mandatory Disclosure   | `DocumentFiles`            |
| Photo Gallery          | `GalleryImages`            |

APIs (all need the JWT `Authorization: Bearer <token>`; see `/api-docs` > File Upload):

- `POST   /api/file-upload/api-post-upload-file-to-storage` - multipart field `file`; returns `FILE_NAME` to save in the record. pdf/jpg/png/webp/gif, max 5 MB.
- `GET    /api/file-upload/api-get-download-file-from-storage?FILE_NAME=..&USER_FILE_NAME=..` - streams the file.
- `DELETE /api/file-upload/api-delete-file-from-storage?FILE_NAME=..` - removes the file.
- `GET    /Uploadfiles/<folder>/<FILE_NAME>` - public website link; redirects to a 5-minute signed S3 URL (no login needed, only the four folders above).

Admin pages call these through `public/Layout/Layout-Api.js`.
