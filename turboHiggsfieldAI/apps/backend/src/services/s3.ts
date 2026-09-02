import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";

const region = process.env.AWS_REGION || "us-east-1";
const bucket = process.env.AWS_S3_BUCKET || "higgsfield-assets";

let s3Client: S3Client | null = null;

if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
  s3Client = new S3Client({
    region,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });
}

/**
 * Uploads a Buffer or File to AWS S3.
 * Returns the public URL of the uploaded asset.
 */
export async function uploadToS3(
  fileBuffer: Buffer,
  key: string,
  contentType: string
): Promise<string> {
  if (!s3Client) {
    console.warn("AWS S3 client not configured. Saving file locally as fallback.");
    const localDir = "./uploads";
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }
    const localPath = `${localDir}/${key.replace(/\//g, "_")}`;
    fs.writeFileSync(localPath, fileBuffer);
    return `file://${localPath}`;
  }

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: fileBuffer,
    ContentType: contentType,
  });

  await s3Client.send(command);

  // Return public URL or custom endpoint URL
  if (process.env.AWS_S3_CUSTOM_DOMAIN) {
    return `${process.env.AWS_S3_CUSTOM_DOMAIN}/${key}`;
  }
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}
