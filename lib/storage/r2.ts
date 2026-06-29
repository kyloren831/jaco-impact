import "server-only";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

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
  if (process.env.NODE_ENV === "test" || process.env.MOCK_S3 === "true") {
    const extension = file.name.split('.').pop() || 'png';
    const uniqueName = `${crypto.randomUUID()}-${Date.now()}.${extension}`;
    const cleanPublicUrl = (publicUrl || 'http://localhost:3005').replace(/\/$/, '');
    return `${cleanPublicUrl}/${folder}/${uniqueName}`;
  }

  if (!bucketName || !publicUrl) {
    throw new Error("Storage configuration is missing. Verifica R2_BUCKET_NAME y NEXT_PUBLIC_R2_DEV_URL en .env.local");
  }

  // Validation
  if (file.size > 50 * 1024 * 1024) {
    throw new Error("File size exceeds limit");
  }

  // Use stream instead of loading entirely into memory
  const stream = file.stream();

  // Generate unique filename to avoid collisions
  const extension = file.name.split('.').pop() || 'png';
  const uniqueName = `${crypto.randomUUID()}-${Date.now()}.${extension}`;
  
  // Clean folder string (remove trailing/leading slashes)
  const cleanFolder = folder.replace(/^\/|\/$/g, '');
  const key = `${cleanFolder}/${uniqueName}`;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: stream as any,
    ContentType: file.type,
    ContentLength: file.size,
  });

  await s3Client.send(command);

  // Return the full public URL
  const cleanPublicUrl = publicUrl.replace(/\/$/, '');
  return `${cleanPublicUrl}/${key}`;
}

/**
 * Generates a presigned upload URL and public file URL for S3/R2 storage
 * @param fileName Name of the file (e.g., 'image.png')
 * @param fileType MIME type of the file (e.g., 'image/png')
 * @param folder Optional folder name (defaults to 'evidences')
 */
export async function getPresignedUploadUrl(
  fileName: string,
  fileType: string,
  folder?: string
): Promise<{ uploadUrl: string; fileUrl: string }> {
  const cleanFolder = (folder || "evidences").replace(/^\/|\/$/g, "");
  const lastDotIndex = fileName.lastIndexOf(".");
  const rawExtension = lastDotIndex !== -1 ? fileName.slice(lastDotIndex + 1) : "";
  const extension = rawExtension.replace(/[^a-zA-Z0-9]/g, ""); // Allow only alphanumeric characters
  const uniqueName = extension
    ? `${crypto.randomUUID()}-${Date.now()}.${extension}`
    : `${crypto.randomUUID()}-${Date.now()}`;
  const key = `${cleanFolder}/${uniqueName}`;

  const cleanPublicUrl = (process.env.NEXT_PUBLIC_R2_DEV_URL || "http://localhost:3005").replace(/\/$/, "");

  if (process.env.NODE_ENV === "test" || process.env.MOCK_S3 === "true") {
    return {
      fileUrl: `${cleanPublicUrl}/${key}`,
      uploadUrl: `${cleanPublicUrl}/mock-upload/${key}`,
    };
  }

  if (!bucketName || !publicUrl) {
    throw new Error("Storage configuration is missing. Verifica R2_BUCKET_NAME y NEXT_PUBLIC_R2_DEV_URL en .env.local");
  }

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    ContentType: fileType,
  });

  const uploadUrl = await getSignedUrl(s3Client as any, command as any, { expiresIn: 3600 });

  return {
    uploadUrl,
    fileUrl: `${cleanPublicUrl}/${key}`,
  };
}
