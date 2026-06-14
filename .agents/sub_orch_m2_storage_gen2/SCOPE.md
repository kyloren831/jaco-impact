# Scope: Milestone 2: S3/R2 Storage Presigned URLs

## Architecture
Milestone 2 adds support for generating S3/R2 presigned URLs for client-side uploads.
- **S3 Request Presigner**: Installs `@aws-sdk/s3-request-presigner`.
- **R2 Storage Utility**: Utility function in `lib/storage/r2.ts` to sign PUT requests.
- **Server Action**: Exposes `getPresignedUploadUrlAction` Server Action in `features/evidences/actions.ts` with authentication and volunteer role checks.

```
[Client App] ──(getPresignedUploadUrlAction)──> [Server Action] ──> [R2 Presigned URL Generator] ──> Returns URL
[Client App] ──(HTTP PUT with File)──────────────────────────────────────────────────────────────────> [Cloudflare R2]
```

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|---|---|---|---|
| 1 | Add Dependency | Install `@aws-sdk/s3-request-presigner` via pnpm. | None | IN_PROGRESS |
| 2 | Presigned URL Utility | Implement presigned URL generation helper in `lib/storage/r2.ts`. | M2.1 | PLANNED |
| 3 | Server Action | Implement and export `getPresignedUploadUrlAction` in `features/evidences/actions.ts`. | M2.2 | PLANNED |
| 4 | E2E Testing | Write/run tests for the Server Action (authenticated, role checking, mock/test mode support). | M2.3 | PLANNED |

## Interface Contracts
### 1. S3/R2 Utility
- `getPresignedUploadUrl(fileName: string, fileType: string): Promise<{ uploadUrl: string; fileUrl: string }>`

### 2. Server Action
- Signature: `getPresignedUploadUrlAction(fileName: string, fileType: string): Promise<{ success: boolean; data?: { uploadUrl: string; fileUrl: string }; error?: string }>`
- Guard: Must require authenticating user as `VOLUNTEER` and verifying that the user is a registered volunteer in the database.
