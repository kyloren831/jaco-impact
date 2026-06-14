## 2026-06-09T01:27:23Z

You are a worker assigned to harden the Milestone 2 implementation against the security vulnerabilities identified during review.
Your tasks are:
1. Fix the Path Traversal vulnerability in `lib/storage/r2.ts` (around lines 80-84) by sanitizing the extracted extension:
   ```typescript
   const lastDotIndex = fileName.lastIndexOf(".");
   const rawExtension = lastDotIndex !== -1 ? fileName.slice(lastDotIndex + 1) : "";
   const extension = rawExtension.replace(/[^a-zA-Z0-9]/g, ""); // Allow only alphanumeric characters
   ```
2. Implement MIME type validation in `features/evidences/actions.ts` inside `getPresignedUploadUrlAction` to restrict uploads to a whitelisted set of MIME types to prevent Stored XSS:
   Whitelist:
   ```typescript
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
   ```
   If `fileType` is not in the whitelist, return `{ success: false, error: "Tipo de archivo no permitido" }`.
3. Verify that the build succeeds by running `pnpm run build` or similar.
4. Verify that the E2E test suite passes successfully by running `npx tsx tests/e2e/run.ts`. (Make sure to run this synchronously or handle it so the user can approve the command execution prompt).
5. Document all changes in `changes.md` and `handoff.md` in your working directory.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.
