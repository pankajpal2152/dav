const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

let client = null;

function isS3Configured() {
  return Boolean(
    process.env.AWS_ACCESS_KEY_ID &&
      process.env.AWS_SECRET_ACCESS_KEY &&
      process.env.AWS_REGION &&
      process.env.AWS_S3_BUCKET_NAME
  );
}

function getClient() {
  if (!client) {
    client = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
  }
  return client;
}

const bucket = () => process.env.AWS_S3_BUCKET_NAME;

// Creates the "folder" (zero-byte "<folder>/" object) in the bucket when it does not exist yet.
async function ensureFolderExists(folder) {
  const Key = `${folder.replace(/\/+$/, '')}/`;
  try {
    await getClient().send(new HeadObjectCommand({ Bucket: bucket(), Key }));
  } catch (error) {
    if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
      await getClient().send(new PutObjectCommand({ Bucket: bucket(), Key, Body: '' }));
      return;
    }
    throw error;
  }
}

async function uploadFile({ buffer, key, contentType }) {
  await getClient().send(
    new PutObjectCommand({
      Bucket: bucket(),
      Key: key,
      Body: buffer,
      ContentType: contentType || 'application/octet-stream',
    })
  );
  return {
    key,
    url: `https://${bucket()}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`,
  };
}

async function downloadFile({ key }) {
  return getClient().send(new GetObjectCommand({ Bucket: bucket(), Key: key }));
}

async function deleteFile({ key }) {
  await getClient().send(new DeleteObjectCommand({ Bucket: bucket(), Key: key }));
}

// Short-lived link so the bucket itself can stay private.
async function getDownloadUrl({ key, expiresIn = 300 }) {
  return getSignedUrl(
    getClient(),
    new GetObjectCommand({ Bucket: bucket(), Key: key, ResponseContentDisposition: 'inline' }),
    { expiresIn }
  );
}

module.exports = {
  isS3Configured,
  ensureFolderExists,
  uploadFile,
  downloadFile,
  deleteFile,
  getDownloadUrl,
};
