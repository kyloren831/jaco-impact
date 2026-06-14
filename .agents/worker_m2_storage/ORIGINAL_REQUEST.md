## 2026-06-08T19:20:17Z
You are a worker assigned to implement Milestone 2: S3/R2 Storage Presigned URLs.
Your tasks are:
1. Ensure `@aws-sdk/s3-request-presigner` is installed at version `^3.1052.0`.
2. Implement `getPresignedUploadUrl` in `lib/storage/r2.ts`:
   - Input: `fileName: string, fileType: string, folder?: string`
   - Output: `Promise<{ uploadUrl: string; fileUrl: string }>`
   - Support mock mode if `process.env.NODE_ENV === "test"` or `process.env.MOCK_S3 === "true"`. The mock URLs generated should be:
     - `fileUrl`: `${cleanPublicUrl}/${key}`
     - `uploadUrl`: `${cleanPublicUrl}/mock-upload/${key}`
     Where:
     - `cleanPublicUrl` is derived from `process.env.NEXT_PUBLIC_R2_DEV_URL || 'http://localhost:3005'`, replacing trailing slash.
     - `key` is `${cleanFolder}/${uniqueName}`, where cleanFolder is folder (default 'evidences') cleaned of trailing/leading slashes, and uniqueName is generated using `crypto.randomUUID()` and timestamp.
3. Implement Server Action `getPresignedUploadUrlAction` in `features/evidences/actions.ts`:
   - Signature: `getPresignedUploadUrlAction(fileName: string, fileType: string): Promise<{ success: boolean; data?: { uploadUrl: string; fileUrl: string }; error?: string }>`
   - Security: Must authenticate the user and ensure they have `VOLUNTEER` role and exist in `prisma.volunteer`.
4. Run `pnpm run build` or similar to verify compile and no errors.
5. Create a `changes.md` and a `handoff.md` in your own working directory: `/home/aaron/Projects/jaco-impact/.agents/worker_m2_storage/`.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.
