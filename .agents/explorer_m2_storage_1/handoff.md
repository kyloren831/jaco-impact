# Handoff Report - Milestone 2: S3/R2 Storage Presigned URLs

## 1. Observation
- **Dependency Structure (`package.json`)**:
  - Exact path: `/home/aaron/Projects/jaco-impact/package.json`
  - Line 12: `"@aws-sdk/client-s3": "^3.1052.0"`
  - There is currently no `@aws-sdk/s3-request-presigner` listed under dependencies or devDependencies.
- **R2 Storage Client Setup (`lib/storage/r2.ts`)**:
  - Exact path: `/home/aaron/Projects/jaco-impact/lib/storage/r2.ts`
  - Line 15-22: `s3Client` is initialized with `region: "auto"`, `endpoint`, and `credentials`.
  - Line 31-36: Mock mode is handled with:
    ```typescript
    if (process.env.NODE_ENV === "test" || process.env.MOCK_S3 === "true") {
      const extension = file.name.split('.').pop() || 'png';
      const uniqueName = `${crypto.randomUUID()}-${Date.now()}.${extension}`;
      const cleanPublicUrl = (publicUrl || 'http://localhost:3005').replace(/\/$/, '');
      return `${cleanPublicUrl}/${folder}/${uniqueName}`;
    }
    ```
- **Evidence Actions & Authentication (`features/evidences/actions.ts` & `lib/auth/guards.ts`)**:
  - Exact path: `/home/aaron/Projects/jaco-impact/features/evidences/actions.ts`
  - Exact path: `/home/aaron/Projects/jaco-impact/lib/auth/guards.ts`
  - `lib/auth/guards.ts` (lines 79-87) defines the `withRole` wrapper.
  - `features/evidences/actions.ts` (lines 68-73) uses `withRole(['ADMIN', 'COORDINATOR'], async ...)` to guard coordinators/admins.
  - `features/evidences/actions.ts` (lines 9-29) uses `withAuth` to authenticate the user and then queries the database to look up the volunteer's record:
    ```typescript
    const volunteer = await prisma.volunteer.findUnique({
      where: { userId: payload.userId },
    });
    ```
- **Milestone 2 Scope Document (`.agents/sub_orch_m2_storage/SCOPE.md`)**:
  - Exact path: `/home/aaron/Projects/jaco-impact/.agents/sub_orch_m2_storage/SCOPE.md`
  - Contract: `getPresignedUploadUrl(fileName: string, fileType: string): Promise<{ uploadUrl: string; fileUrl: string }>`
  - Action Signature: `getPresignedUploadUrlAction(fileName: string, fileType: string): Promise<{ success: boolean; data?: { uploadUrl: string; fileUrl: string }; error?: string }>`
  - Guard Requirement: Must require authenticating user as `VOLUNTEER` and verifying that the user is a registered volunteer in the database.

---

## 2. Logic Chain
- **Package Addition**: Because the S3 client `@aws-sdk/client-s3` is at version `^3.1052.0`, and the companion library `@aws-sdk/s3-request-presigner` must be compatible, we must add `"@aws-sdk/s3-request-presigner": "^3.1052.0"` to the `"dependencies"` of `package.json` and install it.
- **Utility Implementation**:
  1. We import `getSignedUrl` from `@aws-sdk/s3-request-presigner`.
  2. The function `getPresignedUploadUrl(fileName: string, fileType: string, folder: string = "evidences")` uses the same unique filename generation strategy and public URL formatting logic as `uploadFileToR2` (re-using `process.env.NEXT_PUBLIC_R2_DEV_URL`).
  3. When in mock/test mode (`process.env.NODE_ENV === "test"` or `process.env.MOCK_S3 === "true"`), the function returns a simulated `uploadUrl` (e.g., `http://localhost:3005/mock-upload/...`) and the final `fileUrl` without contacting S3/R2. This matches the bypass structure of the existing file upload mock in `uploadFileToR2`.
  4. In production mode, it signs a `PutObjectCommand` with a duration of 15 minutes (900 seconds) using `getSignedUrl(s3Client, command, { expiresIn: 900 })`.
- **Server Action implementation**:
  1. We wrap the Server Action `getPresignedUploadUrlAction` with `withRole("VOLUNTEER")` to satisfy the guard rule that requires the user to have the `VOLUNTEER` role.
  2. Inside the action, we lookup the volunteer in the database using `payload.userId` to ensure the volunteer record exists in the system.
  3. If found, we call `getPresignedUploadUrl(fileName, fileType)` and return the result.

---

## 3. Caveats
- Direct uploads from the client will perform an HTTP PUT request to the S3 bucket using the presigned URL. Since the backend won't intercept the file in transit, the client must follow up by submitting the evidence metadata (like `fileUrl`, name, size, type) to another action to record it in the database. We proposed extending `EvidenceService.submitEvidence` to accept both raw `File` (for backward compatibility / E2E tests) and pre-uploaded `presignedData` (for the new presigned URL flow).

---

## 4. Conclusion
We recommend:
1. Adding `"@aws-sdk/s3-request-presigner": "^3.1052.0"` to `package.json` dependencies and installing it.
2. Adding `getPresignedUploadUrl` inside `lib/storage/r2.ts` supporting mock/test bypass.
3. Exposing `getPresignedUploadUrlAction` using `withRole("VOLUNTEER")` and looking up the volunteer record by `payload.userId`.
4. Upgrading `EvidenceService.submitEvidence` in `domain/evidences/service.ts` to accept pre-uploaded metadata to facilitate the database record insertion.

---

## 5. Verification Method
- **Command to compile/build**: Run `pnpm run build` or `npm run build` to verify the added dependency does not throw any TypeScript/bundler compile errors.
- **Unit/E2E test suite command**: Run `npx tsx tests/e2e/run.ts` to confirm existing E2E tests still pass (this ensures backward compatibility is fully intact).
- **Files to inspect**:
  - `package.json`
  - `lib/storage/r2.ts`
  - `features/evidences/actions.ts`
  - `domain/evidences/service.ts`
