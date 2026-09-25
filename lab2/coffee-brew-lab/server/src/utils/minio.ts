import * as Minio from 'minio';

const endPoint = process.env.MINIO_ENDPOINT || 'localhost';
const port = parseInt(process.env.MINIO_PORT || '9000', 10);
const accessKey = process.env.MINIO_ACCESS_KEY || 'minioadmin';
const secretKey = process.env.MINIO_SECRET_KEY || 'minioadminpassword';
export const BUCKET_NAME = process.env.MINIO_BUCKET || 'coffee-uploads';

export const minioClient = new Minio.Client({
  endPoint,
  port,
  useSSL: false,
  accessKey,
  secretKey,
});

export async function initMinio(): Promise<void> {
  const maxRetries = 15;
  const retryInterval = 2000;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const exists = await minioClient.bucketExists(BUCKET_NAME);
      if (!exists) {
        await minioClient.makeBucket(BUCKET_NAME);
        const policy = {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { AWS: ['*'] },
              Action: ['s3:GetBucketLocation', 's3:ListBucket'],
              Resource: [`arn:aws:s3:::${BUCKET_NAME}`],
            },
            {
              Effect: 'Allow',
              Principal: { AWS: ['*'] },
              Action: ['s3:GetObject'],
              Resource: [`arn:aws:s3:::${BUCKET_NAME}/*`],
            },
          ],
        };
        await minioClient.setBucketPolicy(BUCKET_NAME, JSON.stringify(policy));
      }
      return;
    } catch (err) {
      if (attempt === maxRetries) {
        throw err;
      }
      await new Promise((res) => setTimeout(res, retryInterval));
    }
  }
}

export async function uploadToMinio(
  buffer: Buffer,
  filename: string,
  mimetype: string
): Promise<string> {
  await minioClient.putObject(
    BUCKET_NAME,
    filename,
    buffer,
    buffer.length,
    { 'Content-Type': mimetype }
  );
  return `/uploads/${filename}`;
}

export async function deleteFromMinio(relativeUrl?: string | null): Promise<void> {
  if (!relativeUrl || !relativeUrl.startsWith('/uploads/')) {
    return;
  }
  const filename = relativeUrl.replace('/uploads/', '');
  if (
    filename.startsWith('ethiopia-') ||
    filename.startsWith('colombia-') ||
    filename.startsWith('kenya-') ||
    filename.startsWith('costa-') ||
    filename.startsWith('guatemala-')
  ) {
    return;
  }

  try {
    await minioClient.removeObject(BUCKET_NAME, filename);
  } catch {
    // Ignore deletion error if file does not exist
  }
}
