# Handoff Report: Milestone 2 (S3/R2 Storage Presigned URLs)

## 1. Observation
We observed the following files and structural configurations in the workspace:
- **Package Manager & Dependencies**: Root directory contains `pnpm-lock.yaml`, confirming **pnpm** is used. `package.json` lists `"@aws-sdk/client-s3": "^3.1052.0"` in dependencies:
  ```json
  "dependencies": {
    "@aws-sdk/client-s3": "^3.1052.0",
    ...
  }
  ```
- **R2 Utility**: `lib/storage/r2.ts` contains the function `uploadFileToR2` with mock condition check at lines 31-36:
  ```typescript
  if (process.env.NODE_ENV === "test" || process.env.MOCK_S3 === "true") {
    const extension = file.name.split('.').pop() || 'png';
    const uniqueName = `${crypto.randomUUID()}-${Date.now()}.${extension}`;
    const cleanPublicUrl = (publicUrl || 'http://localhost:3005').replace(/\/$/, '');
    return `${cleanPublicUrl}/${folder}/${uniqueName}`;
  }
  ```
- **Guards & Authentication**: `lib/auth/guards.ts` exports `withAuth` and `withRole` wrappers, and `requireAuth`/`requireRole`/`requirePillarAccess` functions.
- **Evidence Submissions**: `features/evidences/actions.ts` implements `submitEvidenceAction` wrapped with `withAuth`. It retrieves the `volunteer` record (lines 23-25) and verifies event participation (lines 41-52):
  ```typescript
  const volunteer = await prisma.volunteer.findUnique({
    where: { userId: payload.userId },
  });
  ...
  const participation = await prisma.eventParticipation.findUnique({
    where: {
      eventId_volunteerId: {
        eventId: task.eventId,
        volunteerId: volunteer.id,
      },
    },
  });
  ```
- **Domain Service**: `domain/evidences/service.ts` contains `submitEvidence` which enforces that a `taskAssignment` exists (lines 40-44):
  ```typescript
  const assignment = await prisma.taskAssignment.findUnique({
    where: {
      taskId_volunteerId: { taskId, volunteerId }
    }
  });
  ```

---

## 2. Logic Chain
1. Since `pnpm-lock.yaml` is present, the package manager is **pnpm**, so packages must be added via `pnpm add`. Installing `@aws-sdk/s3-request-presigner` using version `^3.1052.0` prevents version mismatch with `@aws-sdk/client-s3`.
2. The mock structure for presigned URLs must match `uploadFileToR2`'s check: `if (process.env.NODE_ENV === "test" || process.env.MOCK_S3 === "true")`. If true, it should return mock URLs immediately without contacting S3/R2 endpoints.
3. The Server Action `getPresignedUploadUrlAction` needs user authentication, meaning it must be wrapped with `withAuth` from `lib/auth/guards.ts`.
4. The volunteer checks require querying `prisma.volunteer` using `payload.userId` (from the session), verifying event enrollment via `prisma.eventParticipation`, and ensuring that the assignment exists in `prisma.taskAssignment`.
5. The `submitEvidence` method in `domain/evidences/service.ts` can be overloaded to accept either a raw `File` (direct upload) or a `fileUrl` (already uploaded via presigned URL). This maintains complete backwards compatibility for existing E2E tests.

---

## 3. Caveats
- No client-side implementation of file uploading was investigated, as it is outside the scope of this read-only Explorer role.
- We assume that the Next.js/React environment supports standard Web API functions like `crypto.randomUUID()` in the environment where the server action runs. If Node version < 19 is used in production, `crypto` must be imported explicitly from the Node.js built-in library.

---

## 4. Conclusion
We recommend implementing Milestone 2 as follows:
1. Add `@aws-sdk/s3-request-presigner@^3.1052.0` to package dependencies.
2. Implement `getPresignedUploadUrl` in `lib/storage/r2.ts` to return both `uploadUrl` and `publicUrl`, supporting mock mode when `MOCK_S3 === "true"` or `NODE_ENV === "test"`.
3. Implement `getPresignedUploadUrlAction` in `features/evidences/actions.ts` wrapped with `withAuth`, verifying volunteer existence, event participation, and task assignment.
4. Update `domain/evidences/service.ts` to support both `file: File` and `fileUrl: string` to preserve backwards compatibility for E2E tests.

---

## 5. Verification Method
To verify the implementation once written:
1. Run the existing E2E test suite to ensure no regressions:
   ```bash
   npx tsx tests/e2e/run.ts
   ```
2. Write a new unit/E2E test under `tests/e2e/specs/` that calls `getPresignedUploadUrlAction` with a mock task, verifying it returns a success object with a mock presigned URL and public URL.
3. Verify that requesting a presigned URL fails for:
   - Unauthenticated users.
   - Users who are not registered as volunteers.
   - Volunteers not assigned to the target task.
