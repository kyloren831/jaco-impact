# Handoff Report — explorer_1

This handoff report summarizes the codebase exploration for the 'Mis Tareas' repository E2E testing track.

---

## 1. Observation

1.  **Testing Setups**:
    *   No testing frameworks or dev dependencies (like Playwright, Vitest, Cypress, or Jest) are defined in `package.json` under `"devDependencies"` or `"scripts"`.
    *   `test-prisma.ts` exists in the root directory, containing:
        ```typescript
        import { prisma } from "./lib/prisma";
        async function main() {
          const count = await prisma.user.count();
          console.log("User count:", count);
        }
        ```
2.  **Authentication**:
    *   Defined in `features/auth/actions.ts` (`loginAction`), `lib/auth/jwt.ts`, `lib/auth/cookies.ts`, `lib/auth/session.ts`, and `lib/auth/guards.ts`.
    *   Cookies are HttpOnly: `access_token` and `refresh_token`.
    *   Access token JWT payload contains `userId`, `email`, `role`, `roles`, and optional `pillarId`.
    *   Sessions are tracked in the database `sessions` table (containing `refreshHash`, `revoked`, `expiresAt`, `userId`).
3.  **Server Actions**:
    *   `features/volunteer/actions.ts` uses raw async actions with manual check:
        ```typescript
        const session = await requireRole(["VOLUNTEER"]);
        ```
    *   `features/evidences/actions.ts` uses high-order wrappers `withAuth` and `withRole`:
        ```typescript
        export const submitEvidenceAction = withAuth(async (payload, formData: FormData) => { ... });
        ```
4.  **SSE Endpoints**:
    *   Defined in `app/api/realtime/route.ts` as a public GET route. It hooks into the global `domainEventBus` to stream all `DOMAIN_EVENTS` (from `domain/shared/events.ts`) as `data: ${JSON.stringify(event)}\n\n`.
5.  **Prisma & Seeds**:
    *   Prisma schema is in `prisma/schema.prisma` with custom output to `../generated/prisma`.
    *   Database connection uses `process.env.DATABASE_URL` (in `prisma.config.ts` and `lib/prisma.ts`).
    *   Admin seed scripts are `create-admin.ts` and `create-admin.js` in the root folder, seeding `admin@jacoimpact.com` with password `admin1234`.

---

## 2. Logic Chain

1.  The lack of test dependencies or scripts in `package.json` indicates that the E2E testing framework must be built from scratch.
2.  Authentication relies on HttpOnly cookies and database session rows. Therefore, tests must either authenticate using a browser or manually manipulate the database and session cookies.
3.  Next.js Server Actions use build-time dynamic identifiers for client requests. Thus, invoking them directly via raw HTTP calls is highly fragile. Interacting via a browser E2E test runner avoids this issue since the browser handles request compilation automatically.
4.  The SSE `/api/realtime` endpoint is public and does not check session cookies. This makes it trivial to connect to programmatically via Node's `fetch` in the test suite to listen to real-time events.
5.  Database setup uses Prisma client with a standard connection string (`DATABASE_URL`). Testing setups can run `npx tsx create-admin.ts` to prepare admin credentials, and tests can directly import Prisma to seed/validate DB state.

---

## 3. Caveats

*   **No Environment Variable Access**: Reading `.env` and `.env.local` timed out during the permission check, but config files (`prisma.config.ts`, `lib/prisma.ts`) confirmed `DATABASE_URL` is the source of truth.
*   **Static Investigation**: Code execution was not performed as the scope of this agent is read-only exploration.

---

## 4. Conclusion

*   We recommend **Playwright** as the E2E test runner. It handles Next.js Server Actions natively, allows programmatic SSE connection listening during tests, and supports database setup/seeding via Prisma client inside global hooks.

---

## 5. Verification Method

*   Verify the existence of the analysis report at `/home/aaron/Projects/jaco-impact/.agents/sub_orch_e2e_tests/explorer_analysis.md`.
*   Inspect the details inside `/home/aaron/Projects/jaco-impact/.agents/sub_orch_e2e_tests/explorer_analysis.md` to ensure coverage of all 5 items from the user request.
