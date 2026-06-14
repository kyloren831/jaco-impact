# Handoff Report — Challenger M2 Storage Gen2

## 1. Observation

- **Implementation of Extension Extraction**: In `lib/storage/r2.ts` lines 80-82:
  ```typescript
  const lastDotIndex = fileName.lastIndexOf(".");
  const rawExtension = lastDotIndex !== -1 ? fileName.slice(lastDotIndex + 1) : "";
  const extension = rawExtension.replace(/[^a-zA-Z0-9]/g, ""); // Allow only alphanumeric characters
  ```
- **Test Assertion for Path Traversal**: In `tests/e2e/specs/tier1.spec.ts` lines 793-799:
  ```typescript
  it("should sanitize the extension to prevent path traversal in generated URLs", async () => {
    const res = await executeAction("getPresignedUploadUrlAction", ["evidencia.png/../../hacked", "image/png"], vol1Cookie);
    assert.strictEqual(res.success, true);
    assert.ok(res.data);
    assert.ok(res.data.uploadUrl.endsWith("pnghacked"));
    assert.ok(res.data.fileUrl.endsWith("pnghacked"));
  });
  ```
- **Unsanitized Upload in R2 Helper**: In `lib/storage/r2.ts` lines 47-48 (inside `uploadFileToR2`):
  ```typescript
  // Generate unique filename to avoid collisions
  const extension = file.name.split('.').pop() || 'png';
  const uniqueName = `${crypto.randomUUID()}-${Date.now()}.${extension}`;
  ```
- **No MIME Whitelist check in Direct Upload Action**: In `features/evidences/actions.ts` lines 10-67, `submitEvidenceAction` has no logic referencing `ALLOWED_MIME_TYPES`.
- **Command Output (Timeout)**: During run, running compilation or test suite via `run_command` timed out waiting for user permission:
  > `Encountered error in step execution: Permission prompt for action 'command' on target 'pnpm run build' timed out waiting for user response.`

---

## 2. Logic Chain

- **E2E Test Failure**:
  1. The E2E test runs `getPresignedUploadUrlAction` with `fileName = "evidencia.png/../../hacked"`.
  2. In `getPresignedUploadUrl` (`lib/storage/r2.ts`), `fileName.lastIndexOf(".")` finds the last dot, which is the second dot in `/../../`. Its index is 18.
  3. `fileName.slice(19)` returns `"/hacked"`.
  4. Removing non-alphanumeric characters leaves `extension` as `"hacked"`.
  5. The generated upload and file URLs will end with `.hacked`.
  6. The test asserts `res.data.uploadUrl.endsWith("pnghacked")` (which was written assuming `.split('.').pop()` logic would yield `"png/../../hacked"` and sanitize to `"pnghacked"`).
  7. Because `"hacked"` is not equal to `"pnghacked"`, the assertion fails, causing the E2E test suite to fail.

- **Storage Path Traversal Vulnerability**:
  1. `uploadFileToR2` uses `.split('.').pop()` to extract the extension.
  2. For a file named `"test.png/../../hacked.png"`, it extracts the extension `"png"`. But if the file is named `"test.png/../../hacked"`, it extracts `"png/../../hacked"`.
  3. The resulting key is `evidences/<uuid>-<timestamp>.png/../../hacked` which resolves to the bucket root level as `/hacked` (outside the `evidences/` folder).
  4. An attacker can use this path traversal to write files to arbitrary directories and overwrite critical objects in the R2 storage bucket.

- **MIME Whitelist Bypass Vulnerability**:
  1. An attacker can call `submitEvidenceAction` directly.
  2. `submitEvidenceAction` does not check the file's MIME type against `ALLOWED_MIME_TYPES`.
  3. It delegates directly to `evidenceService.submitEvidence`, which uploads the file using the unsanitized `uploadFileToR2`.
  4. Therefore, any file type (e.g. `.html` containing malicious JavaScript scripts, or raw `.js` files) can be successfully uploaded to the bucket, bypassing the new security restriction.

---

## 3. Caveats

- **No Live Execution Verification**: Because interactive terminal command approval timed out in the execution environment, tests and builds could not be run live. Verification is based entirely on deterministic static code analysis.
- **MIME Type Usability**: Case sensitivity and parameters (e.g. `image/png; charset=utf-8`) in MIME type strings are not accounted for in the whitelist check, which could lead to false rejections of legitimate uploads.

---

## 4. Conclusion

The security hardening changes fail validation:
1. The E2E test suite fails due to a discrepancy between the implementation of `getPresignedUploadUrl` (uses `lastIndexOf(".")` and yields `"hacked"`) and the test assertions (expects `"pnghacked"`).
2. The legacy direct upload path (`uploadFileToR2` and `submitEvidenceAction`) contains a directory traversal vulnerability and a MIME whitelist bypass, meaning the security hardening is incomplete and can be completely bypassed by an attacker.

---

## 5. Verification Method

- **Run E2E Tests**: Run `npx tsx tests/e2e/run.ts` to observe the failure in the test suite at `"should sanitize the extension to prevent path traversal in generated URLs"`.
- **Verify Path Traversal**: Call `uploadFileToR2` directly with a filename containing traversal characters (e.g. `test.png/../../traversal.txt`) and inspect the returned S3 object key.
- **Verify Whitelist Bypass**: Call `submitEvidenceAction` with a multipart form containing a file with type `application/javascript` to verify it successfully uploads and is stored in the database.
