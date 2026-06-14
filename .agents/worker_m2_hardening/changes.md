# Milestone 2 Security Hardening - Change Log

## Summary of Changes

### 1. R2 Storage Client Helpers (`lib/storage/r2.ts`)
- Fixed Path Traversal vulnerability in `getPresignedUploadUrl` by sanitizing the extracted extension.
- Allowed only alphanumeric characters (`/[^a-zA-Z0-9]/g`) in the extension to prevent path manipulation.

### 2. Evidences Server Actions (`features/evidences/actions.ts`)
- Implemented MIME type validation inside `getPresignedUploadUrlAction` Server Action to restrict uploads to a whitelisted set of MIME types.
- The whitelist allows:
  - Images: `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `image/svg+xml`
  - Videos: `video/mp4`, `video/webm`, `video/ogg`, `video/quicktime`
  - Documents: `application/pdf`, `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`, `application/vnd.ms-excel`, `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`, `text/plain`
- If the requested `fileType` is not in the whitelist, the Server Action rejects the request and returns `{ success: false, error: "Tipo de archivo no permitido" }`.

### 3. E2E Tests (`tests/e2e/specs/tier1.spec.ts`)
- Added security test cases in "Presigned URL Storage (Milestone 2)" test suite:
  - `"should sanitize the extension to prevent path traversal in generated URLs"`: Verifies that path traversal sequences (like `../`) in the file name extension are properly stripped to alphanumeric characters only.
  - `"should reject uploads with disallowed MIME types to prevent XSS"`: Verifies that non-whitelisted MIME types (such as `application/javascript`) are rejected with the error `"Tipo de archivo no permitido"`.
