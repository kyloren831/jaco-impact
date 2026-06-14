# Victory Audit Verification Plan

This plan outlines the verification steps to validate the "Mis Tareas" volunteer UX workflow project implementation.

## Steps

### Step 1: Verify S3 Dependencies
- **Task**: Verify that `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner` are declared in `package.json` and present in `node_modules`.
- **Verification Method**: Inspect `package.json` and directory structure of `node_modules/@aws-sdk`.

### Step 2: Verify Login -> Dashboard -> Mis Tareas Flow & Guards
- **Task**: Inspect pages and sidebar configurations to ensure that:
  - Base dashboard `/dashboard` requires authentication.
  - Sidebar correctly renders "Mis Tareas" link to volunteers (`/dashboard/volunteer/tasks`).
  - `/dashboard/volunteer/tasks/page.tsx` checks user roles correctly and only allows volunteer access.
- **Verification Method**: Inspect `app/login/page.tsx`, `features/auth/actions.ts`, `app/dashboard/page.tsx`, `components/layout/DashboardSidebar.tsx`, and `app/dashboard/volunteer/tasks/page.tsx`.

### Step 3: Verify TypeScript Errors Resolution in Tests
- **Task**: Verify that the ~30 compilation errors due to missing Prisma schema fields in test mocks and sandboxes (`test-transitions.ts` and `tests/stress-concurrency.ts`) are fully resolved.
- **Verification Method**: Inspect the mocks inside `test-transitions.ts` and `tests/stress-concurrency.ts` to ensure fields like `phone`, `nationality`, `profession`, `emergencyContactName`, `emergencyContactPhone`, and `inmediateAvailability` are provided, and that volunteer users have unique IDs.

### Step 4: Verify S3 Environment Variable Configuration
- **Task**: Verify R2/S3 environment variable configurations.
- **Verification Method**: Inspect `lib/storage/r2.ts` for environment variables reading logic, and check for standard fallback structures.

### Step 5: Verify E2E Test Setup and Compatibility
- **Task**: Verify that the E2E test runner (`tests/e2e/run.ts`) and specs are set up properly and handle mock S3 operations cleanly during testing.
- **Verification Method**: Inspect `tests/e2e/run.ts` and `lib/storage/r2.ts` mock implementation checks (`process.env.MOCK_S3 === "true"`).
