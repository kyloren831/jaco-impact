# Handoff Report - Milestone 2 Challenger

## 1. Observation

In `lib/storage/r2.ts` (lines 80-85), the logic for generating the unique S3 storage key extracts the extension directly from the last dot of the user-provided `fileName`:
```typescript
  const lastDotIndex = fileName.lastIndexOf(".");
  const extension = lastDotIndex !== -1 ? fileName.slice(lastDotIndex + 1) : "";
  const uniqueName = extension
    ? `${crypto.randomUUID()}-${Date.now()}.${extension}`
    : `${crypto.randomUUID()}-${Date.now()}`;
  const key = `${cleanFolder}/${uniqueName}`;
```

In `features/evidences/actions.ts` (lines 89-108), the Server Action `getPresignedUploadUrlAction` wraps the service with `withRole('VOLUNTEER')`:
```typescript
export const getPresignedUploadUrlAction = withRole('VOLUNTEER', async (
  payload,
  fileName: string,
  fileType: string
): Promise<{ success: boolean; data?: { uploadUrl: string; fileUrl: string }; error?: string }> => {
  try {
    const volunteer = await prisma.volunteer.findUnique({
      where: { userId: payload.userId },
    });

    if (!volunteer) {
      return { success: false, error: 'El usuario no está registrado como voluntario' };
    }

    const data = await getPresignedUploadUrl(fileName, fileType);
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});
```

During verification, terminal commands to run the test suite returned the following timeout:
```
Permission prompt for action 'command' on target 'npx ts-node tests/e2e/run.ts' timed out waiting for user response. The user was not able to provide permission on time.
```

---

## 2. Logic Chain

1. In `lib/storage/r2.ts`, the `extension` is sliced directly from the end of the `fileName` string starting after the last dot.
2. If `fileName` is `"test.png/../../malicious.txt"`, the `lastDotIndex` locates the dot before `png`.
3. Slicing from `lastDotIndex + 1` produces `extension = "png/../../malicious.txt"`.
4. The key is constructed as `key = "evidences/[uuid]-[timestamp].png/../../malicious.txt"`.
5. Upon target storage execution (MinIO / S3 / R2), directory traversal characters (`/..`) resolve relative to the root bucket, collapsing the key to `"malicious.txt"`.
6. Therefore, an authorized volunteer can obtain a write-access presigned URL targeting any path in the storage bucket.

---

## 3. Caveats

- Interactive terminal commands require user-level permission approval. Since this ran in an automated subagent loop, the approval prompt timed out. Direct test execution feedback was therefore not captured. Verification relies on static code analysis, logic traces, and existing worker specs.
- Live R2 bucket credentials were not set in the environment, so mock mode was verified statically.

---

## 4. Conclusion

The Milestone 2 implementation of S3/R2 Storage Presigned URLs is functionally complete and conforms to the specified contract signatures. However, it contains a **HIGH-severity Path Traversal vulnerability** in `lib/storage/r2.ts` and a **design gap** (AuthError stack trace leaks in logs due to lack of wrapper catch blocks). It should not be merged/promoted to production without mitigating the path traversal vulnerability.

---

## 5. Verification Method

To independently verify the vulnerability:
1. View `lib/storage/r2.ts` lines 80-85.
2. Run a payload validation test by calling:
   ```typescript
   await getPresignedUploadUrlAction("test.png/../../traversal.txt", "text/plain")
   ```
   and verifying if the returned `fileUrl` contains the `/../` traversal sequences or resolves outside of the `evidences/` namespace.
3. The project test command is `npx ts-node tests/e2e/run.ts` (once approved by the host user).
