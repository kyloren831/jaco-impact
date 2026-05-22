import "server-only";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// Ensure environment variables exist
const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucketName = process.env.R2_BUCKET_NAME;
const publicUrl = process.env.NEXT_PUBLIC_R2_DEV_URL;

if (!accountId || !accessKeyId || !secretAccessKey || !bucketName || !publicUrl) {
  console.warn("Missing R2 Environment Variables. File uploads will fail.");
}

const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: accessKeyId || "",
    secretAccessKey: secretAccessKey || "",
  },
});

/**
 * Uploads a standard File object to Cloudflare R2
 * @param file The File object from FormData
 * @param folder The target dynamic folder (e.g., 'pillars', 'users')
 * @returns The public URL of the uploaded image
 */
export async function uploadFileToR2(file: File, folder: string): Promise<string> {
  if (!bucketName || !publicUrl) {
    throw new Error("Storage configuration is missing. Verifica R2_BUCKET_NAME y NEXT_PUBLIC_R2_DEV_URL en .env.local");
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Generate unique filename to avoid collisions
  const extension = file.name.split('.').pop() || 'png';
  const uniqueName = `${crypto.randomUUID()}-${Date.now()}.${extension}`;
  
  // Clean folder string (remove trailing/leading slashes)
  const cleanFolder = folder.replace(/^\/|\/$/g, '');
  const key = `${cleanFolder}/${uniqueName}`;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: buffer,
    ContentType: file.type,
  });

  await s3Client.send(command);

  // Return the full public URL
  const cleanPublicUrl = publicUrl.replace(/\/$/, '');
  return `${cleanPublicUrl}/${key}`;
}
