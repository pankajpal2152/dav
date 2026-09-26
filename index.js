require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./docs/swagger');
const ourSchoolRoutes = require('./routes/DAV_Routes/ourSchool');
const fileUpload = require('express-fileupload');
const { router: fileUploadRoutes, publicFileRouter } = require('./routes/DAV_Routes/fileUpload');
// NOTE: the hospital-dashboard leftovers (routes/master.js, routes/transaction.js,
// routes/auth.js, routes/sapInbound.js, jobs/*) are intentionally not loaded: they call
// stored procedures that do not exist in the DAV School database.
 
const app = express();
 
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
// multipart uploads (parsed into req.files) - 5 MB max per file
app.use(fileUpload({ limits: { fileSize: 5 * 1024 * 1024 }, abortOnLimit: true, responseOnLimit: 'File size must not exceed 5 MB.' }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));
// Uploaded files live in S3; this redirects to a short-lived signed URL
app.use('/Uploadfiles', publicFileRouter);
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'Home.html'));
});
 
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/api/ourSchool', ourSchoolRoutes);
app.use('/api/file-upload', fileUploadRoutes);
app.use('/api', (req, res) => {
  res.status(404).json({ status: 'false', message: 'API route not found' });
});
 
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ status: 'false', message: err.message || 'Internal server error' });
});
 
const PORT = process.env.PORT || 3009;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`API docs at http://localhost:${PORT}/api-docs`);
  if (!process.env.AWS_S3_BUCKET_NAME) console.warn('WARNING: AWS_S3_BUCKET_NAME is not set - file uploads will fail (503).');
  if (!process.env.JWT_SECRET) console.warn('WARNING: JWT_SECRET is not set - login will fail.');
});
 
 