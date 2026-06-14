# Analysis: Milestone 2 S3/R2 Storage Presigned URLs

This analysis details the strategy and findings for implementing S3/R2 Storage Presigned URLs in the Jaco Impact codebase.

---

## 1. Package Dependency Verification

### Findings
- **Package Manager**: The presence of `pnpm-lock.yaml` in the root workspace confirms that the project uses **pnpm**.
- **Existing SDK version**: `package.json` contains:
  ```json
  "@aws-sdk/client-s3": "^3.1052.0"
  ```
- **Recommended Command**: To add `@aws-sdk/s3-request-presigner` while matching the current SDK version and maintaining package consistency:
  ```bash
  pnpm add @aws-sdk/s3-request-presigner@^3.1052.0
  ```
  This must be installed as a standard production dependency in the `dependencies` block of `package.json`.

---

## 2. Presigned URL Utility Design (`lib/storage/r2.ts`)

### Findings
- `lib/storage/r2.ts` contains the initialization of `s3Client` (using `S3Client` from `@aws-sdk/client-s3`) and the `uploadFileToR2` utility.
- Mock mode in `uploadFileToR2` is determined by:
  ```typescript
  if (process.env.NODE_ENV === "test" || process.env.MOCK_S3 === "true")
  ```

### Utility Design
We will introduce `getPresignedUploadUrl` inside `lib/storage/r2.ts`.

#### Proposed Implementation Details
```typescript
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export interface PresignedUrlResult {
  uploadUrl: string;
  publicUrl: string;
  key: string;
}

export async function getPresignedUploadUrl(
  fileName: string,
  fileType: string,
  folder: string
): Promise<PresignedUrlResult> {
  const extension = fileName.split('.').pop() || 'png';
  const uniqueName = `${crypto.randomUUID()}-${Date.now()}.${extension}`;
  
  const cleanFolder = folder.replace(/^\/|\/$/g, '');
  const key = `${cleanFolder}/${uniqueName}`;
  
  const cleanPublicUrl = (publicUrl || 'http://localhost:3005').replace(/\/$/, '');
  const finalPublicUrl = `${cleanPublicUrl}/${key}`;

  if (process.env.NODE_ENV === "test" || process.env.MOCK_S3 === "true") {
    // Return mock URLs matching the existing mock structure
    return {
      uploadUrl: `${cleanPublicUrl}/mock-upload/${key}`,
      publicUrl: finalPublicUrl,
      key,
    };
  }

  if (!bucketName || !publicUrl) {
    throw new Error("Storage configuration is missing. Check R2_BUCKET_NAME and NEXT_PUBLIC_R2_DEV_URL.");
  }

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    ContentType: fileType,
  });

  // Presigned URL expires in 15 minutes (900 seconds)
  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 });

  return {
    uploadUrl,
    publicUrl: finalPublicUrl,
    key,
  };
}
```

---

## 3. Server Action Design (`features/evidences/actions.ts`)

### Guard Evaluation
- `lib/auth/guards.ts` provides `withAuth` and `withRole` wrappers.
- The new `getPresignedUploadUrlAction` should use `withAuth` to identify the authenticated user.
- To enforce correct volunteer role checks:
  1. Retrieve the `Volunteer` record associated with the authenticated user's `userId`.
  2. Retrieve the `Task` to identify its `eventId`.
  3. Validate that the volunteer has an active/registered `EventParticipation` for that `eventId`.
  4. Validate that the volunteer is assigned to the task via `TaskAssignment` (`taskId_volunteerId` composite key).

### Proposed Action Implementation
```typescript
import { getPresignedUploadUrl } from "@/lib/storage/r2";

export const getPresignedUploadUrlAction = withAuth(async (
  payload,
  taskId: number,
  fileName: string,
  fileType: string
) => {
  try {
    if (!taskId || !fileName || !fileType) {
      return { success: false, error: 'Faltan parámetros obligatorios' };
    }

    // 1. Verify user is registered as a volunteer
    const volunteer = await prisma.volunteer.findUnique({
      where: { userId: payload.userId },
    });

    if (!volunteer) {
      return { success: false, error: 'El usuario no está registrado como voluntario' };
    }

    // 2. Verify task and event registration
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { eventId: true },
    });

    if (!task) {
      return { success: false, error: 'Tarea no encontrada' };
    }

    const participation = await prisma.eventParticipation.findUnique({
      where: {
        eventId_volunteerId: {
          eventId: task.eventId,
          volunteerId: volunteer.id,
        },
      },
    });

    if (!participation || participation.status === 'CANCELLED') {
      return { success: false, error: 'No tienes acceso a las tareas de este evento o no estás inscrito.' };
    }

    // 3. Verify task assignment exists
    const assignment = await prisma.taskAssignment.findUnique({
      where: {
        taskId_volunteerId: {
          taskId,
          volunteerId: volunteer.id,
        },
      },
    });

    if (!assignment) {
      return { success: false, error: 'No estás asignado a esta tarea' };
    }

    // 4. Generate presigned URL
    const result = await getPresignedUploadUrl(fileName, fileType, 'evidences');

    return {
      success: true,
      data: result,
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});
```

---

## 4. Backwards-Compatible Submission Integration

To ensure that the current E2E test suite (which uses the direct server-side file upload approach in `submitEvidenceAction`) doesn't break, the database evidence creation logic in `domain/evidences/service.ts` can be upgraded to support both modes: direct server-side upload and presigned client-side upload.

### Updated Service Types & Logic (`domain/evidences/service.ts`)
```typescript
import { FileType } from "@/generated/prisma/client";

export type SubmitEvidenceInput = {
  taskId: number;
  volunteerId: number;
  actorId: number;
  file?: File;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  description?: string;
};

// Inside submitEvidence method:
let finalFileUrl = fileUrl;
let finalFileName = fileName;
let finalFileSize = fileSize;
let finalFileType: FileType = 'OTHER';

if (file) {
  // Direct file upload (legacy/E2E test flow)
  finalFileUrl = await uploadFileToR2(file, 'evidences');
  finalFileName = file.name;
  finalFileSize = file.size;
  finalFileType = getFileType(file.type);
} else {
  // Presigned URL upload flow (metadata passed from client)
  if (!fileUrl || !fileName || !fileSize || !fileType) {
    throw new Error("Missing file information for submission");
  }
  finalFileType = getFileType(fileType);
}

// Then create the DB record using finalFileUrl, finalFileName, finalFileSize, finalFileType...
```

This ensures complete support for the new feature while keeping the current codebase's test coverage 100% green.
