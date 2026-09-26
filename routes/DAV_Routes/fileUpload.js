const express = require('express');
const path = require('path');
const auth = require('../../middlewares/auth');
const s3 = require('../../config/s3');

const router = express.Router();

/*
 Dedicated S3 folders, one per purpose. Upload with X-UPLOADED-PATH = one of these values.
   NoticeBoardFiles          - Notice Board PDFs
   TransferCertificateFiles  - Transfer Certificates
   DocumentFiles             - Mandatory Disclosure documents
   GalleryImages             - Photo Gallery images
*/
const PUBLIC_FOLDERS = ['NoticeBoardFiles', 'TransferCertificateFiles', 'DocumentFiles', 'GalleryImages'];

const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png', '.webp', '.gif'];

const NOT_CONFIGURED_MESSAGE =
  'File storage is not configured. Set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION and AWS_S3_BUCKET_NAME in the server environment.';

// Keeps generated S3 keys predictable and free of path-traversal / unsafe characters.
function sanitizeKeySegment(value, fallback) {
  const cleaned = String(value || '')
    .replace(/\.\./g, '')
    .replace(/^\/+/, '')
    .replace(/[^a-zA-Z0-9/_.-]/g, '_');

  return cleaned || fallback;
}

// POST /api/file-upload/api-post-upload-file-to-storage
/**
 * @swagger
 * /api/file-upload/api-post-upload-file-to-storage:
 *   post:
 *     tags:
 *       - File Upload
 *     summary: Upload a file to S3 storage
 *     description: >
 *       Stores the uploaded file in the configured AWS S3 bucket, inside the folder given by
 *       the X-UPLOADED-PATH header, and returns the stored FILE_NAME. Save that FILE_NAME in
 *       the record (notice / transfer certificate / document / gallery image).
 *       Allowed types are pdf, jpg, jpeg, png, webp and gif; maximum size is 5 MB.
 *       Returns 503 when S3 is not configured.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: X-UPLOADED-PATH
 *         schema:
 *           type: string
 *           enum: [NoticeBoardFiles, TransferCertificateFiles, DocumentFiles, GalleryImages]
 *         required: false
 *         description: S3 folder for this module. Falls back to the "folder" form field, then to "uploads". Created automatically if missing.
 *         example: NoticeBoardFiles
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               folder:
 *                 type: string
 *                 description: Optional S3 folder, used when X-UPLOADED-PATH is not sent.
 *     responses:
 *       200:
 *         description: File stored successfully
 *       400:
 *         description: No file was sent or file type not allowed
 *       401:
 *         description: Unauthorized / invalid or expired token
 *       503:
 *         description: S3 storage is not configured
 *       500:
 *         description: Internal server error
 */
router.post('/api-post-upload-file-to-storage', auth, async (req, res) => {
  try {
    if (!s3.isS3Configured()) {
      return res.status(503).json({ status: 'false', response: NOT_CONFIGURED_MESSAGE });
    }

    const uploadedFile = req.files && req.files.file;

    if (!uploadedFile) {
      return res.status(400).json({
        status: 'false',
        response: 'No file was uploaded. Send the file using the "file" form field.',
      });
    }

    const extension = path.extname(uploadedFile.name).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      return res.status(400).json({
        status: 'false',
        response: `File type not allowed. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`,
      });
    }

    const folder = sanitizeKeySegment(req.headers['x-uploaded-path'] || (req.body && req.body.folder), 'uploads');
    const safeFileName = sanitizeKeySegment(uploadedFile.name, 'file');
    const storedFileName = `${Date.now()}-${safeFileName}`;
    const key = `${folder}/${storedFileName}`;

    await s3.ensureFolderExists(folder);

    await s3.uploadFile({
      buffer: uploadedFile.data,
      key,
      contentType: uploadedFile.mimetype,
    });

    return res.json({
      status: 'true',
      response: {
        FILE_NAME: storedFileName,
        USER_FILE_NAME: uploadedFile.name,
        FOLDER: folder,
        // Public, signed-link route used by the website pages
        URL: `/Uploadfiles/${folder}/${encodeURIComponent(storedFileName)}`,
        SIZE: uploadedFile.size,
      },
    });
  } catch (error) {
    return res.status(500).json({ status: 'false', response: error.message });
  }
});

// GET /api/file-upload/api-get-download-file-from-storage
/**
 * @swagger
 * /api/file-upload/api-get-download-file-from-storage:
 *   get:
 *     tags:
 *       - File Upload
 *     summary: Download a previously uploaded file from S3 storage
 *     description: >
 *       Streams the object at "<X-UPLOADED-PATH>/<FILE_NAME>" back from the S3 bucket.
 *       Content-Disposition uses USER_FILE_NAME so the browser saves the file under the name
 *       the user originally uploaded it as.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: X-UPLOADED-PATH
 *         schema:
 *           type: string
 *         required: true
 *         description: S3 folder the file was uploaded into.
 *         example: NoticeBoardFiles
 *       - in: query
 *         name: FILE_NAME
 *         schema:
 *           type: string
 *         required: true
 *         description: The S3-stored file name (FILE_NAME returned by the upload API).
 *         example: "1735289400000-holiday-notice.pdf"
 *       - in: query
 *         name: USER_FILE_NAME
 *         schema:
 *           type: string
 *         required: false
 *         description: Original file name to restore on download. Falls back to FILE_NAME.
 *         example: "Holiday Notice.pdf"
 *     responses:
 *       200:
 *         description: File stream
 *       400:
 *         description: Missing X-UPLOADED-PATH header or FILE_NAME query param
 *       401:
 *         description: Unauthorized / invalid or expired token
 *       404:
 *         description: File not found in S3
 *       503:
 *         description: S3 storage is not configured
 *       500:
 *         description: Internal server error
 */
router.get('/api-get-download-file-from-storage', auth, async (req, res) => {
  try {
    if (!s3.isS3Configured()) {
      return res.status(503).json({ status: 'false', response: NOT_CONFIGURED_MESSAGE });
    }

    const folder = req.headers['x-uploaded-path'];
    const { FILE_NAME, USER_FILE_NAME } = req.query;

    if (!folder) {
      return res.status(400).json({ status: 'false', response: 'X-UPLOADED-PATH header is required.' });
    }
    if (!FILE_NAME) {
      return res.status(400).json({ status: 'false', response: 'FILE_NAME query param is required.' });
    }

    const safeFolder = sanitizeKeySegment(folder, null);
    const safeFileName = sanitizeKeySegment(FILE_NAME, null);

    if (!safeFolder || !safeFileName) {
      return res.status(400).json({ status: 'false', response: 'Invalid X-UPLOADED-PATH or FILE_NAME.' });
    }

    const key = `${safeFolder}/${safeFileName}`;
    const downloadName = USER_FILE_NAME || FILE_NAME;

    const s3Object = await s3.downloadFile({ key });

    const asciiFallbackName = String(downloadName).replace(/[^\x20-\x7E]/g, '_').replace(/"/g, "'");

    res.setHeader('Content-Type', s3Object.ContentType || 'application/octet-stream');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${asciiFallbackName}"; filename*=UTF-8''${encodeURIComponent(downloadName)}`
    );
    if (s3Object.ContentLength) {
      res.setHeader('Content-Length', s3Object.ContentLength);
    }

    return s3Object.Body.pipe(res);
  } catch (error) {
    if (error.name === 'NoSuchKey') {
      return res.status(404).json({ status: 'false', response: 'File not found in storage.' });
    }
    return res.status(500).json({ status: 'false', response: error.message });
  }
});

// DELETE /api/file-upload/api-delete-file-from-storage
/**
 * @swagger
 * /api/file-upload/api-delete-file-from-storage:
 *   delete:
 *     tags:
 *       - File Upload
 *     summary: Delete a file from S3 storage
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: X-UPLOADED-PATH
 *         schema:
 *           type: string
 *         required: true
 *         example: NoticeBoardFiles
 *       - in: query
 *         name: FILE_NAME
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: File deleted
 *       400:
 *         description: Missing X-UPLOADED-PATH header or FILE_NAME query param
 *       401:
 *         description: Unauthorized / invalid or expired token
 *       503:
 *         description: S3 storage is not configured
 *       500:
 *         description: Internal server error
 */
router.delete('/api-delete-file-from-storage', auth, async (req, res) => {
  try {
    if (!s3.isS3Configured()) {
      return res.status(503).json({ status: 'false', response: NOT_CONFIGURED_MESSAGE });
    }

    const safeFolder = sanitizeKeySegment(req.headers['x-uploaded-path'], null);
    const safeFileName = sanitizeKeySegment(req.query.FILE_NAME, null);

    if (!safeFolder || !safeFileName) {
      return res.status(400).json({
        status: 'false',
        response: 'X-UPLOADED-PATH header and FILE_NAME query param are required.',
      });
    }

    await s3.deleteFile({ key: `${safeFolder}/${safeFileName}` });
    return res.json({ status: 'true', response: 'File deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ status: 'false', response: error.message });
  }
});

/*
 Public viewing for the website: /Uploadfiles/<folder>/<fileName>
 Redirects to a short-lived signed S3 link so the bucket stays private while notices,
 transfer certificates and gallery images remain viewable by visitors without logging in.
 Only the dedicated public folders above are served.
*/
const publicFileRouter = express.Router();

publicFileRouter.get('/:folder/:fileName', async (req, res) => {
  const { folder } = req.params;
  const fileName = path.basename(req.params.fileName);

  if (!PUBLIC_FOLDERS.includes(folder)) {
    return res.sendStatus(404);
  }
  if (!s3.isS3Configured()) {
    return res.status(503).json({ status: 'false', response: NOT_CONFIGURED_MESSAGE });
  }

  try {
    const url = await s3.getDownloadUrl({ key: `${folder}/${fileName}` });
    res.set('Cache-Control', 'no-store');
    return res.redirect(302, url);
  } catch (error) {
    return res.status(500).json({ status: 'false', response: error.message });
  }
});

module.exports = { router, publicFileRouter };
