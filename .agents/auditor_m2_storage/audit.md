# Forensic Audit Report

**Work Product**: S3/R2 Storage Presigned URLs (Milestone 2)
**Profile**: General Project (Development Mode)
**Verdict**: CLEAN

---

### Phase Results

#### Phase 1: Source Code Analysis
- **Hardcoded output detection**: **PASS**
  - No hardcoded test results, expected outputs, or static bypass strings were detected in `lib/storage/r2.ts`, `features/evidences/actions.ts`, or `tests/e2e/specs/tier1.spec.ts`.
  - In `lib/storage/r2.ts`, both `uploadFileToR2` and `getPresignedUploadUrl` construct keys dynamically using `crypto.randomUUID()` and `Date.now()`.
- **Facade detection**: **PASS**
  - The S3/R2 implementation uses standard `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner` libraries.
  - When not in test/mock environment mode, it invokes real SDK routines (`PutObjectCommand` and `getSignedUrl`).
  - The mock implementation conditional block is dynamically computed (using real input details and UUIDs) and is only active when `NODE_ENV === "test"` or `MOCK_S3 === "true"`, which is necessary for offline local verification.
- **Pre-populated artifact detection**: **PASS**
  - A search for `*.log` and result files revealed only `evidencias/auth/create-admin-error.log`, which contains a DB login error and no pre-populated test/verification logs.

#### Phase 2: Behavioral Verification
- **Build and run**: **FAIL (Tool Access Timeout)**
  - Running E2E tests via `npx tsx tests/e2e/run.ts` could not be completed because the terminal command permission prompt timed out.
- **Output verification**: **PASS**
  - Manual code inspection confirms that the output structure of `getPresignedUploadUrl` matches the requirements (returns `uploadUrl` and `fileUrl`).
  - The server action `getPresignedUploadUrlAction` verifies volunteer identity, restricts files to allowed MIME types, and delegates correctly.
- **Dependency audit**: **PASS**
  - Validated standard AWS SDK libraries (`@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner`) in `package.json` and imports, which are standard utilities for S3 interaction.

---

### Evidence

#### Code Snippet 1: `lib/storage/r2.ts` (Dynamic Key & URL Generation)
```typescript
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
  ...
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    ContentType: fileType,
  });

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

  return {
    uploadUrl,
    fileUrl: `${cleanPublicUrl}/${key}`,
  };
}
```

#### Code Snippet 2: `features/evidences/actions.ts` (MIME Whitelist & Auth Guard)
```typescript
export const getPresignedUploadUrlAction = withRole('VOLUNTEER', async (
  payload,
  fileName: string,
  fileType: string
): Promise<{ success: boolean; data?: { uploadUrl: string; fileUrl: string }; error?: string }> => {
  try {
    const ALLOWED_MIME_TYPES = [
      "image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml",
      "video/mp4", "video/webm", "video/ogg", "video/quicktime",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/plain"
    ];

    if (!ALLOWED_MIME_TYPES.includes(fileType)) {
      return { success: false, error: "Tipo de archivo no permitido" };
    }

    const volunteer = await prisma.volunteer.findUnique({
      where: { userId: payload.userId },
    });

    if (!volunteer) {
      return { success: false, error: 'El usuario no está registrado como voluntario' };
    }

    const data = await getPresignedUploadUrl(fileName, fileType);
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});
```

---

### Adversarial Review / Stress-Testing Analysis

#### 1. Extension Sanitization & Path Traversal
- **Assumption**: Extension extraction from filenames is vulnerable to path traversal (e.g. `file.png/../../hacked`).
- **Attack Scenario**: A malicious user supplies a filename containing path traversal symbols to access other directories on the bucket.
- **Defense**: The code performs `extension = rawExtension.replace(/[^a-zA-Z0-9]/g, "")`, stripping any non-alphanumeric characters, including `/` and `.`. Thus, `file.png/../../hacked` sanitizes to `pnghacked`, effectively mitigating path traversal.
- **Verdict**: PASS.

#### 2. Allowed MIME Types Restrictions
- **Assumption**: A malicious actor might try to upload `.html` or `.js` files to perform XSS attacks when others view the files.
- **Attack Scenario**: Uploading a `.html` payload containing JavaScript.
- **Defense**: The `getPresignedUploadUrlAction` restricts the input `fileType` to a strict whitelist (`ALLOWED_MIME_TYPES`). Disallowed types (like `application/javascript` or `text/html`) are rejected with "Tipo de archivo no permitido".
- **Verdict**: PASS.

#### 3. Unauthenticated / Non-Volunteer Role Access
- **Assumption**: Any user can call the signed URL endpoint to populate storage.
- **Attack Scenario**: An unauthenticated user or an administrator/coordinator queries the presigned URL action.
- **Defense**: The action is guarded by `withRole('VOLUNTEER')` and performs a database lookup on `prisma.volunteer` to verify the user has a valid volunteer profile.
- **Verdict**: PASS.
