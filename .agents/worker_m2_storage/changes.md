# Milestone 2: S3/R2 Storage Presigned URLs - Change Log

## Summary of Changes

### 1. R2 Storage Client Helpers (`lib/storage/r2.ts`)
- Imported `getSignedUrl` from `@aws-sdk/s3-request-presigner`.
- Implemented `getPresignedUploadUrl(fileName: string, fileType: string, folder?: string)`:
  - Dynamically extracts file extension from `fileName`.
  - Generates a unique key via `crypto.randomUUID()` and timestamp `Date.now()`.
  - Cleans both `folder` (defaulting to `'evidences'`) and `publicUrl` of trailing/leading slashes.
  - Supports mock mode when `process.env.NODE_ENV === "test"` or `process.env.MOCK_S3 === "true"`, generating the exact required mock URLs.
  - In normal/production mode, creates a `PutObjectCommand` and signs it using `getSignedUrl` with 1 hour expiration, returning both `uploadUrl` and `fileUrl`.

### 2. Evidences Server Actions (`features/evidences/actions.ts`)
- Imported `getPresignedUploadUrl` from `@/lib/storage/r2`.
- Implemented and exported Server Action `getPresignedUploadUrlAction` with signature:
  `getPresignedUploadUrlAction(fileName: string, fileType: string): Promise<{ success: boolean; data?: { uploadUrl: string; fileUrl: string }; error?: string }>`
- Secured the action using the `withRole('VOLUNTEER')` higher-order auth guard wrapper to verify volunteer role.
- Inside the action, added verification that the authenticated user exists in `prisma.volunteer`.

### 3. E2E Test Runner Setup (`tests/e2e/run.ts`)
- Added `getPresignedUploadUrlAction` to the dynamic Next.js compilation compiler page imports and object mappings. This ensures Next.js compiles the action during test execution, allowing `executeAction` to locate it in the manifest.

### 4. E2E Tests (`tests/e2e/specs/tier1.spec.ts`)
- Added a new test suite `"Presigned URL Storage (Milestone 2)"` containing 4 E2E tests:
  - Verifies successful presigned URL generation (mock format) for authorized volunteers.
  - Verifies authentication failure when no cookie is provided.
  - Verifies role authorization failure when an ADMIN user attempts to call the action.
  - Verifies lookup failure when a user has the `VOLUNTEER` role but no corresponding `prisma.volunteer` record exists.
