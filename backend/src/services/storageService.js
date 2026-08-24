import { randomUUID } from 'node:crypto';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';

// Endpoint/region/credentials come from env: AWS_ENDPOINT_URL_S3, AWS_REGION,
// AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY (picked up by the SDK automatically).
const s3 = new S3Client({ forcePathStyle: true });

function bucket() {
  const name = process.env.S3_BUCKET;
  if (!name) throw new Error('S3_BUCKET env var is required for image uploads');
  return name;
}

const EXT_BY_MIME = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

/** Stable public URL for an uploaded object (served by GET /api/uploads/<key>). */
export const publicUrl = (key) => `/api/uploads/${key}`;

export function isAllowedImageMime(mime) {
  return Boolean(EXT_BY_MIME[mime]);
}

/** Store an image under a unique blog/ key; returns { key, url }. */
export async function uploadBlogImage(buffer, mime) {
  const ext = EXT_BY_MIME[mime];
  if (!ext) throw new Error('Unsupported image type');
  const key = `blog/${randomUUID()}.${ext}`;
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket(),
      Key: key,
      Body: buffer,
      ContentType: mime,
    })
  );
  return { key, url: publicUrl(key) };
}

/** Fetch an object for streaming to the client; null when it does not exist. */
export async function getBlogImage(key) {
  try {
    return await s3.send(new GetObjectCommand({ Bucket: bucket(), Key: key }));
  } catch (err) {
    if (err.name === 'NoSuchKey' || err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) {
      return null;
    }
    throw err;
  }
}
