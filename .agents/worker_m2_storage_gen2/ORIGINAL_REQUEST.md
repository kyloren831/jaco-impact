## 2026-06-09T01:33:35Z

You are a worker assigned to fix the security and alignment bugs in the Milestone 2 storage implementation.
Please apply the following changes:
1. In `lib/storage/r2.ts`:
   - Import `path` from "path" at the top.
   - Modify `uploadFileToR2` (around lines 45-47) to sanitize the extension of `file.name` using `path.basename`:
     ```typescript
     const baseName = path.basename(file.name);
     const lastDotIndex = baseName.lastIndexOf(".");
     const rawExtension = lastDotIndex !== -1 ? baseName.slice(lastDotIndex + 1) : "png";
     const extension = rawExtension.replace(/[^a-zA-Z0-9]/g, "");
     const uniqueName = `${crypto.randomUUID()}-${Date.now()}.${extension}`;
     ```
   - Modify `getPresignedUploadUrl` (around lines 80-84) to use `path.basename` to extract baseName first, preventing directory traversal in the extension parsing:
     ```typescript
     const baseName = path.basename(fileName);
     const lastDotIndex = baseName.lastIndexOf(".");
     const rawExtension = lastDotIndex !== -1 ? baseName.slice(lastDotIndex + 1) : "";
     const extension = rawExtension.replace(/[^a-zA-Z0-9]/g, "");
     const uniqueName = extension
       ? `${crypto.randomUUID()}-${Date.now()}.${extension}`
       : `${crypto.randomUUID()}-${Date.now()}`;
     ```

2. In `features/evidences/actions.ts`:
   - Define a helper at the top:
     ```typescript
     const DISALLOWED_MIME_TYPES = [
       "text/html",
       "application/javascript",
       "text/javascript",
       "application/x-javascript",
       "application/x-msdownload",
       "application/x-executable"
     ];

     function isAllowedMime(mimeType: string): boolean {
       const cleanMime = mimeType.split(";")[0].trim().toLowerCase();
       return !DISALLOWED_MIME_TYPES.includes(cleanMime);
     }
     ```
   - Add a check in `submitEvidenceAction` (direct upload) after extracting the file:
     ```typescript
     if (!isAllowedMime(file.type)) {
       return { success: false, error: 'Tipo de archivo no permitido' };
     }
     ```
   - Add a check in `getPresignedUploadUrlAction` (presigned URL upload):
     ```typescript
     if (!isAllowedMime(fileType)) {
       return { success: false, error: 'Tipo de archivo no permitido' };
     }
     ```

3. In `tests/e2e/specs/tier1.spec.ts`:
   - Update the test `"should sanitize the extension to prevent path traversal in generated URLs"` to pass `"evidencia.png/../../hacked.png"` and verify that the output doesn't contain `".."` and ends with `".png"`:
     ```typescript
     it("should sanitize the extension to prevent path traversal in generated URLs", async () => {
       const res = await executeAction("getPresignedUploadUrlAction", ["evidencia.png/../../hacked.png", "image/png"], vol1Cookie);
       assert.strictEqual(res.success, true);
       assert.ok(res.data);
       assert.ok(!res.data.uploadUrl.includes(".."));
       assert.ok(res.data.uploadUrl.endsWith(".png"));
     });
     ```
   - Make sure no other tests are broken.

4. Run `pnpm run build` to verify compilation.
5. Create a `changes.md` and a `handoff.md` in your working directory.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.
