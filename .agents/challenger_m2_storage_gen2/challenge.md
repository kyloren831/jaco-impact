# Adversarial Challenge Report — Milestone 2 Storage Security Hardening

## Challenge Summary

**Overall risk assessment**: HIGH

While the security hardening changes for Milestone 2 introduce important improvements (sanitizing extensions in the presigned URL utility and introducing a MIME type whitelist for presigned uploads), there are critical bugs in the implementation, test alignment, and structural coverage that undermine the overall security of the system and prevent the E2E test suite from passing.

Specifically, we identified:
1. **A critical test-implementation mismatch**: The E2E test asserts an extension sanitization outcome (`"pnghacked"`) that mathematically cannot be produced by the `lastIndexOf(".")` logic implemented in the R2 utility (which results in `"hacked"`), causing the test suite to fail.
2. **Inconsistent Extension Sanitization (Path Traversal Bypass)**: The direct server-side upload helper `uploadFileToR2` (still actively used in production for pillars, projects, and legacy evidence submissions) remains completely unsanitized, allowing folder traversal.
3. **Inconsistent MIME Whitelist (MIME Whitelist Bypass)**: The direct upload server action `submitEvidenceAction` contains no MIME whitelist check, allowing attackers to upload arbitrary files (e.g. `.html` or `.js`) and bypass the security restriction introduced on presigned URLs.

---

## Challenges

### [Critical] Challenge 1: E2E Test Suite Mismatch on Path Traversal Sanitization

- **Assumption challenged**: The assumption that `getPresignedUploadUrl`'s extension extraction and sanitization logic is aligned with the assertions of the E2E test suite.
- **Attack scenario**: The E2E test suite calls:
  `getPresignedUploadUrlAction("evidencia.png/../../hacked", "image/png")`
  The implementation in `lib/storage/r2.ts` performs extension extraction via:
  ```typescript
  const lastDotIndex = fileName.lastIndexOf(".");
  const rawExtension = lastDotIndex !== -1 ? fileName.slice(lastDotIndex + 1) : "";
  const extension = rawExtension.replace(/[^a-zA-Z0-9]/g, "");
  ```
  For the input `"evidencia.png/../../hacked"`, the dots are located at index 9, 14, 15, 17, and 18.
  - `lastDotIndex` evaluates to `18` (the final dot of the second directory traversal segment `..`).
  - `rawExtension` evaluates to `"/hacked"`.
  - `extension` (after stripping non-alphanumeric characters) evaluates to `"hacked"`.
  
  However, the E2E test in `tests/e2e/specs/tier1.spec.ts` asserts:
  ```typescript
  assert.ok(res.data.uploadUrl.endsWith("pnghacked"));
  assert.ok(res.data.fileUrl.endsWith("pnghacked"));
  ```
  Since the generated URLs end with `.hacked` and not `pnghacked`, this test **fails**. This test code was written assuming that the extension would be split using `.split('.').pop()`, which would yield `"png/../../hacked"` and sanitize to `"pnghacked"`.
- **Blast radius**: The E2E test suite fails, blocking build pipelines and verification checks.
- **Mitigation**: Update either the test assertion or the implementation. If the goal of the implementation is to extract the extension correctly from the original extension before traversal sequences, the code should extract the segment after the first dot or sanitize the entire filename structure before extracting the extension.

---

### [High] Challenge 2: Path Traversal Bypass via `uploadFileToR2`

- **Assumption challenged**: The assumption that sanitizing `getPresignedUploadUrl` alone is sufficient to protect the S3/R2 storage bucket from path traversal attacks.
- **Attack scenario**: While client-side presigned URLs use `getPresignedUploadUrl`, the direct server-side upload function `uploadFileToR2` (defined in `lib/storage/r2.ts`) does not apply any sanitization:
  ```typescript
  const extension = file.name.split('.').pop() || 'png';
  const uniqueName = `${crypto.randomUUID()}-${Date.now()}.${extension}`;
  ```
  If a malicious volunteer or coordinator makes a request calling server actions that use `uploadFileToR2` (e.g. `submitEvidenceAction`, `createPillar`, or `createProject`) and passes a file name like `"image.png/../../overwritten-file.png"`, the resulting S3 key is resolved by stripping the directories back:
  `evidences/<uuid>-<timestamp>.image.png/../../overwritten-file.png` -> `overwritten-file.png`
  This enables attackers to overwrite arbitrary files (such as avatars, event assets, or database backups if stored in the same bucket) at the root level or in other folders.
- **Blast radius**: Write access to arbitrary keys inside the S3/R2 bucket, leading to data tampering, resource overwrites, and denial of service.
- **Mitigation**: Standardize extension extraction and sanitization across both `getPresignedUploadUrl` and `uploadFileToR2` by extracting only the clean alphanumeric extension and stripping all folder structure prefixes from filenames before processing.

---

### [High] Challenge 3: MIME Whitelist Bypass via Direct Evidence Uploads

- **Assumption challenged**: The assumption that restricting `getPresignedUploadUrlAction` to whitelisted MIME types prevents malicious files from being uploaded to the evidence store.
- **Attack scenario**: A volunteer wishing to bypass the MIME whitelist check on `getPresignedUploadUrlAction` can simply make a direct request to `submitEvidenceAction` with the target file. `submitEvidenceAction` is a Server Action that processes direct multipart uploads and delegates to `evidenceService.submitEvidence`, which uploads the file using `uploadFileToR2`.
  Neither `submitEvidenceAction` nor `evidenceService.submitEvidence` implements the MIME whitelist check. The file is uploaded, and the database record is created with `fileType` set to `'OTHER'`.
- **Blast radius**: Bypassing of the file type restrictions, allowing malicious file uploads (e.g., active HTML scripts that execute XSS when loaded directly from the bucket's domain).
- **Mitigation**: Move the `ALLOWED_MIME_TYPES` validation check to a shared domain layer helper or apply it inside `submitEvidenceAction` to guarantee that all evidence submission pathways enforce the exact same whitelist.

---

### [Low] Challenge 4: Usability Restriction in MIME Whitelist Matching

- **Assumption challenged**: The assumption that standard clients will always supply exact MIME types without parameters or in strict lowercase.
- **Attack scenario**: The check in `getPresignedUploadUrlAction` uses `.includes(fileType)` against a list of exact lowercase strings:
  ```typescript
  if (!ALLOWED_MIME_TYPES.includes(fileType)) { ... }
  ```
  If a user agent sends `image/png; charset=utf-8` or `IMAGE/PNG`, the action will fail and reject the upload.
- **Blast radius**: Low-risk usability issues; legitimate uploads from some browser configurations or API clients may be rejected.
- **Mitigation**: Normalize `fileType` by trimming, converting to lowercase, and splitting by `;` to check only the primary/sub-type media type (e.g., `fileType.split(";")[0].trim().toLowerCase()`).

---

## Stress Test Results

- **Test Path Traversal on Presigned URL**: Input `fileName = "test.png/../../hacked"`, `fileType = "image/png"` $\rightarrow$ Expected behavior: Returns presigned URL ending in `pnghacked` (per E2E test assertion) $\rightarrow$ Actual behavior: Returns URL ending in `hacked`, causing E2E test failure $\rightarrow$ **FAIL**
- **Test MIME Whitelist Bypass on Direct Action**: Input malicious file type `application/javascript` via `submitEvidenceAction` $\rightarrow$ Expected behavior: Upload rejected with "Tipo de archivo no permitido" $\rightarrow$ Actual behavior: Upload succeeds and is stored in database $\rightarrow$ **FAIL**
- **Test Path Traversal on Direct Action**: Input `file.name = "test.png/../../evil"` via `submitEvidenceAction` $\rightarrow$ Expected behavior: Extension is sanitized and file is written safely under `evidences/` $\rightarrow$ Actual behavior: Path traversal resolves to root folder of the R2 bucket $\rightarrow$ **FAIL**

---

## Unchallenged Areas

- **Presigned URL Cryptographic Signatures**: The actual signature generation logic is handled natively by `@aws-sdk/s3-request-presigner` and `@aws-sdk/client-s3`. We assume the AWS SDK generates and verifies signatures correctly.
- **Next.js Dev Server and DB Seed**: We assume the database seed script resets the environment correctly when E2E tests are executed.
