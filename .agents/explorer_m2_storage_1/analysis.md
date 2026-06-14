# Milestone 2: S3/R2 Storage Presigned URLs - Analysis and Design

This document details the analysis of the existing codebase and outlines the implementation strategy for Milestone 2 (S3/R2 Storage Presigned URLs).

---

## 1. Package Dependency Analysis (`package.json`)

### Observation
- The project's `package.json` contains:
  ```json
  "dependencies": {
    "@aws-sdk/client-s3": "^3.1052.0",
    ...
  }
  ```
- To support presigned URL generation, we need to add `@aws-sdk/s3-request-presigner` to the dependencies.

### Recommendation
To ensure compatibility and prevent version conflicts, `@aws-sdk/s3-request-presigner` must match the version of `@aws-sdk/client-s3`.
- **Dependency entry to add**: `"@aws-sdk/s3-request-presigner": "^3.1052.0"`
- **Command to run**: `pnpm add @aws-sdk/s3-request-presigner`

---

## 2. Presigned URL Utility Function Design (`lib/storage/r2.ts`)

### Observation
- The file `lib/storage/r2.ts` initializes `s3Client` (S3Client instance) and defines `uploadFileToR2(file: File, folder: string)`.
- It supports a mock/test mode activated when `process.env.NODE_ENV === "test"` or `process.env.MOCK_S3 === "true"`.
- Mock mode in `uploadFileToR2` returns a simulated file URL:
  ```typescript
  if (process.env.NODE_ENV === "test" || process.env.MOCK_S3 === "true") {
    const extension = file.name.split('.').pop() || 'png';
    const uniqueName = `${crypto.randomUUID()}-${Date.now()}.${extension}`;
    const cleanPublicUrl = (publicUrl || 'http://localhost:3005').replace(/\/$/, '');
    return `${cleanPublicUrl}/${folder}/${uniqueName}`;
  }
  ```

### Design: `getPresignedUploadUrl`
We propose adding `getPresignedUploadUrl` with the signature below. It generates the upload key, handles mock mode, and uses `@aws-sdk/s3-request-presigner` to sign the `PutObjectCommand`.

#### Imports to Add
```typescript
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
```

#### Utility Function
```typescript
/**
 * Generates a presigned URL for uploading a file directly to Cloudflare R2 / S3.
 * @param fileName The original file name
 * @param fileType The MIME type of the file (e.g. 'image/png')
 * @param folder The destination folder (defaults to 'evidences')
 * @returns An object containing the uploadUrl and the final fileUrl
 */
export async function getPresignedUploadUrl(
  fileName: string,
  fileType: string,
  folder: string = "evidences"
): Promise<{ uploadUrl: string; fileUrl: string }> {
  // Extract extension and generate unique name
  const extension = fileName.split('.').pop() || 'png';
  const uniqueName = `${crypto.randomUUID()}-${Date.now()}.${extension}`;
  
  // Clean folder and compute key
  const cleanFolder = folder.replace(/^\/|\/$/g, '');
  const key = `${cleanFolder}/${uniqueName}`;
  const cleanPublicUrl = (publicUrl || 'http://localhost:3005').replace(/\/$/, '');
  const fileUrl = `${cleanPublicUrl}/${key}`;

  // Mock / Test mode support
  if (process.env.NODE_ENV === "test" || process.env.MOCK_S3 === "true") {
    return {
      uploadUrl: `${cleanPublicUrl}/mock-upload/${key}`,
      fileUrl,
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

  // Sign the upload command (expires in 15 minutes / 900 seconds)
  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 });

  return {
    uploadUrl,
    fileUrl,
  };
}
```

---

## 3. Server Action Design (`features/evidences/actions.ts`)

### Observation
- Security guards are defined in `lib/auth/guards.ts` and exported as higher-order functions: `withAuth` and `withRole`.
- `withRole(roles, action)` checks if the authenticated user has one of the allowed roles, throwing an `AuthError` if they do not.
- Actions in `features/evidences/actions.ts` check if the user is a registered volunteer in the database by querying the `Volunteer` table:
  ```typescript
  const volunteer = await prisma.volunteer.findUnique({
    where: { userId: payload.userId },
  });
  ```

### Design: `getPresignedUploadUrlAction`
We propose exposing `getPresignedUploadUrlAction` using `withRole("VOLUNTEER")` to satisfy the guard requirements.

#### Implementation Sketch
```typescript
import { getPresignedUploadUrl } from "@/lib/storage/r2";

export const getPresignedUploadUrlAction = withRole("VOLUNTEER", async (
  payload,
  fileName: string,
  fileType: string
) => {
  try {
    if (!fileName || !fileType) {
      return { success: false, error: "fileName and fileType are required" };
    }

    // Verify volunteer exists in the database
    const volunteer = await prisma.volunteer.findUnique({
      where: { userId: payload.userId },
    });

    if (!volunteer) {
      return { success: false, error: "El usuario no está registrado como voluntario" };
    }

    const data = await getPresignedUploadUrl(fileName, fileType, "evidences");

    return {
      success: true,
      data,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Error al generar la URL de subida presirmada",
    };
  }
});
```

---

## 4. DB Metadata Submission Design (`domain/evidences/service.ts`)

To support client-side upload via presigned URLs, the database submission needs to accept the pre-uploaded `fileUrl` and related file metadata (instead of forcing a server-side upload of a `File` object). 

We recommend updating `SubmitEvidenceInput` and `EvidenceService.submitEvidence` to support both modes:
- **Direct upload (fallback/legacy/test flow)**: Uploads `file: File` on the server using `uploadFileToR2`.
- **Presigned upload (standard flow)**: Receives pre-computed metadata (`fileUrl`, `fileName`, `fileSize`, `fileType`) from the client.

#### Proposed `SubmitEvidenceInput` Update
```typescript
export type SubmitEvidenceInput = {
  taskId: number;
  volunteerId: number;
  actorId: number;
  description?: string;
  // Either a raw file for server-side upload OR pre-computed metadata from presigned URL
  file?: File;
  presignedData?: {
    fileUrl: string;
    fileName: string;
    fileSize: number;
    fileType: string; // MIME type to derive FileType
  };
};
```

#### Proposed `submitEvidence` Logic
```typescript
    // ... validation logic ...

    let fileUrl = "";
    let fileName = "";
    let fileSize = 0;
    let fileType: FileType = "OTHER";

    if (file) {
      fileUrl = await uploadFileToR2(file, 'evidences');
      fileName = file.name;
      fileSize = file.size;
      fileType = getFileType(file.type);
    } else if (presignedData) {
      fileUrl = presignedData.fileUrl;
      fileName = presignedData.fileName;
      fileSize = presignedData.fileSize;
      fileType = getFileType(presignedData.fileType);
    } else {
      throw new Error("Must provide either a file or presignedData metadata");
    }

    // ... create evidence and update task assignment in transaction ...
```
This enables backward compatibility with existing test cases while fully supporting the presigned URL workflow.
