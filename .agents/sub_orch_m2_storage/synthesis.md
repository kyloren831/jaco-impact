# Synthesis of Explorer Reports: Milestone 2 S3/R2 Storage Presigned URLs

## Consensus
- **Package Dependency**: Install `@aws-sdk/s3-request-presigner` at version `^3.1052.0` to match the existing `@aws-sdk/client-s3` dependency version in `package.json`.
- **R2 Storage Utility**: Implement `getPresignedUploadUrl` in `lib/storage/r2.ts` with:
  - Input: `fileName: string, fileType: string, folder?: string`
  - Output: `Promise<{ uploadUrl: string; fileUrl: string }>`
  - Mock mode bypass check: `if (process.env.NODE_ENV === "test" || process.env.MOCK_S3 === "true")`. It should generate a local simulated URL pair without making actual R2 requests.
- **Server Action**: Implement `getPresignedUploadUrlAction` in `features/evidences/actions.ts` with:
  - Signature: `getPresignedUploadUrlAction(fileName: string, fileType: string): Promise<{ success: boolean; data?: { uploadUrl: string; fileUrl: string }; error?: string }>`
  - Guards: Authenticate the user with `withRole(["VOLUNTEER"])` (or `withAuth` and explicitly verify they are a volunteer/active). Let's use `withRole(["VOLUNTEER"])` to enforce volunteer role-based guard, and then check `prisma.volunteer` for existence.

## Implementation Details
1. **Dependency Installation**:
   Add dependency in `package.json` and run `pnpm install` or run a shell command `pnpm add @aws-sdk/s3-request-presigner@3.1052.0`.
2. **Mock URL Structure**:
   For mock mode:
   - File name generation: `const extension = fileName.split('.').pop() || 'png'; const uniqueName = `${crypto.randomUUID()}-${Date.now()}.${extension}`;`
   - File key path: `${folder}/${uniqueName}`
   - `fileUrl`: `${cleanPublicUrl}/${key}`
   - `uploadUrl`: `${cleanPublicUrl}/mock-upload/${key}`
3. **R2 Signed URL Production logic**:
   - Command: `PutObjectCommand`
   - SignedUrl: `getSignedUrl(s3Client, command, { expiresIn: 900 })`

## Next Steps
- Spawn a `teamwork_preview_worker` to install the package and implement the utility function and Server Action.
- Verify through E2E tests and compilation.
