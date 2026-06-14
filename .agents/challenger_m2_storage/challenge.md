# Challenge Report - Milestone 2: S3/R2 Storage Presigned URLs

## Challenge Summary

**Overall risk assessment**: HIGH

While the Milestone 2 implementation of S3/R2 storage presigned URL generation successfully fulfills the core functional requirements and integrates role-based guards, it contains a significant security vulnerability (Path Traversal) and a few minor design/robustness gaps.

---

## Challenges

### [High] Challenge 1: Path Traversal Vulnerability via `fileName` Parameter

- **Assumption challenged**: Assumes that slicing the filename after the last dot safely extracts only a file extension (e.g., `png` or `jpg`) and that the resulting key is securely restricted to the `evidences/` folder.
- **Attack scenario**:
  An authenticated volunteer calls the Server Action `getPresignedUploadUrlAction` with a malformed `fileName` containing folder traversal sequences:
  `getPresignedUploadUrlAction("test.png/../../profile_pictures/admin_avatar.png", "image/png")`
  
  Inside `getPresignedUploadUrl`, the extension is extracted via:
  ```typescript
  const lastDotIndex = fileName.lastIndexOf(".");
  const extension = lastDotIndex !== -1 ? fileName.slice(lastDotIndex + 1) : "";
  ```
  This yields:
  `extension = "png/../../profile_pictures/admin_avatar.png"`
  
  The generated key is constructed as:
  `key = "evidences/[uuid]-[timestamp].png/../../profile_pictures/admin_avatar.png"`
  
  When uploaded to S3/R2, this path collapses to:
  `profile_pictures/admin_avatar.png`
  
  As a result, a volunteer can generate a signed URL to write/overwrite files outside the `evidences/` folder (e.g., in `profile_pictures/`, `pillars/`, or the bucket root).
- **Blast radius**: High. Direct write/overwrite capability for arbitrary keys in the shared S3/R2 bucket, allowing malicious/unauthorized users to tamper with system assets.
- **Mitigation**:
  Enforce a strict whitelist on the file extension using regex (e.g., only alphanumeric characters) and strip any directory traversal characters (`/` or `\\`).
  ```typescript
  const rawExtension = lastDotIndex !== -1 ? fileName.slice(lastDotIndex + 1) : "";
  const extension = rawExtension.replace(/[^a-zA-Z0-9]/g, "");
  ```

---

### [Low] Challenge 2: Lack of MIME Type Validation

- **Assumption challenged**: Assumes the client will only request upload URLs for valid evidence formats (images, videos, pdfs).
- **Attack scenario**:
  An attacker requests a presigned URL with `fileType: "application/x-executable"` or `text/html`. They upload a malicious executable or script to the project's R2 domain, which can then be used for drive-by malware downloads or cross-site scripting (XSS) if the bucket serves files directly.
- **Blast radius**: Low/Medium. Could lead to hosting malicious assets on the organization's domain.
- **Mitigation**:
  Implement a check in `getPresignedUploadUrlAction` to ensure the `fileType` parameter matches an allowed list of mime types (e.g., starting with `image/`, `video/`, or being `application/pdf`).

---

### [Low] Challenge 3: Next.js Auth Wrapper Exception Bubbling

- **Assumption challenged**: Assumes that Server Action wrappers like `withRole` handle exceptions gracefully without causing uncaught framework-level errors.
- **Attack scenario**:
  When an unauthenticated request calls `getPresignedUploadUrlAction`, `requireAuth()` throws an uncaught `AuthError`. Because this error is thrown outside the action's inner `try/catch` block, it bubbles up to Next.js's global error handler, causing HTTP 500 or framework-level RSC errors rather than returning a clean `{ success: false, error: "..." }` response.
- **Blast radius**: Low. The action fails as expected (safe failure), but it generates noise in server logs and forces client-side E2E test helpers to fall back to regex/raw text scanning.
- **Mitigation**:
  Catch `AuthError` in the `withRole`/`withAuth` higher-order wrappers and return a normalized `{ success: false, error: error.message }` JSON response.

---

## Stress Test Results

- **Normal upload request** → Generates presigned PUT url and public URL → Succeeds (Returns 200 URLs in mock mode) → **PASS**
- **Unauthenticated request** → Blocks access → Blocks (Next.js bubbles AuthError, returning failure) → **PASS**
- **Non-volunteer role request** → Blocks access → Blocks (Forbidden error) → **PASS**
- **Missing volunteer DB record** → Returns structured error → Fails with "El usuario no está registrado como voluntario" → **PASS**
- **Path traversal payload** (`test.png/../../evil.txt`) → Generates URL for `evidences/[uuid]-[timestamp].png/../../evil.txt` → Generates vulnerable URL → **FAIL**

---

## Unchallenged Areas

- **Actual S3 Client Network Connectivity** — Not challenged because live AWS/R2 credentials are not configured in local environment variables, forcing the code to run in mock mode.
