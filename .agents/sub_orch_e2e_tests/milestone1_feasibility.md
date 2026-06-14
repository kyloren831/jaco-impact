# E2E Test Infrastructure Feasibility Report (Milestone 1)

This report details the findings and implementation of the E2E test infrastructure feasibility checks for the `jaco-impact` project.

---

## 1. Playwright Installation & Execution Check
- **Observation**:
  - Playwright is **not** listed in the `dependencies` or `devDependencies` of `package.json`.
  - The local `node_modules/.bin` directory does not contain a `playwright` binary.
  - The environment is running in `CODE_ONLY` network mode, meaning downloading NPM packages or downloading browser binaries (Chromium, Firefox, WebKit) from external CDNs is blocked.
  - A command to run `npx playwright --version` requires manual user approval, which times out if the user is not actively watching.
- **Conclusion**:
  - Browser-based E2E testing using Playwright is **not feasible** in this isolated environment due to the lack of pre-installed browsers, network restrictions preventing their download, and the inability to run interactive installer commands without manual approvals.

---

## 2. Other Testing Tools in `node_modules` and `package.json`
- **Observation**:
  - We inspected `package.json` and `node_modules/.bin/`.
  - There are **no testing libraries** (such as Jest, Vitest, Cypress, Mocha, or Testing Library) declared in `dependencies`/`devDependencies` or installed locally.
  - The project does contain a custom script `test-transitions.ts` at the root, which is run directly using `npx tsx` for database transition testing.

---

## 3. Lightweight Test Runner using Node's Built-in `node:test` Framework
- **Observation**:
  - The project uses Node.js v20 (as indicated by `@types/node: ^20` in `package.json`).
  - Node.js v20 includes a fully native, stable test runner (`node:test`) and assertion library (`node:assert`) which require zero external dependencies.
  - Since `npx tsx` is used for running `test-transitions.ts`, it can be leveraged to execute TypeScript tests using `node:test` directly without compilation.
  - If a fully offline, zero-dependency execution is required, TypeScript files can be compiled using the project's local `tsc` compiler (`node_modules/.bin/tsc` with `--noEmit false`), and then the generated JavaScript files can be run natively using:
    ```bash
    node --env-file=.env.local --test <compiled-test-file>.js
    ```
- **Conclusion**:
  - Node's built-in `node:test` framework combined with compilation or `npx tsx` is the **most viable and robust** path forward for E2E backend testing.

---

## 4. Bypassing Browser-Based Login via JWT Signing
- **Observation**:
  - Session authentication in the application is managed via cookies: `access_token` (expires in 15 minutes) and `refresh_token` (expires in 7 days).
  - The `access_token` is verified by `lib/auth/guards.ts#requireAuth()` using the secret `JWT_SECRET` (loaded from `.env` or `.env.local`) and the `jose` library.
  - The API endpoints (e.g. `/api/auth/me`) read the token using `cookies().get("access_token")`.
- **Conclusion**:
  - We can **completely bypass** browser-based login by programmatically signing a valid JWT `access_token` in our test code using the same `JWT_SECRET` and sending it in the `Cookie` header:
    ```http
    Cookie: access_token=<signed_jwt_token>
    ```
  - This allows us to test all authenticated Next.js Server Actions and HTTP API routes without needing a browser or a login user interface.

---

## 5. Prototype Script
A self-contained prototype script has been created at:
`/home/aaron/Projects/jaco-impact/.agents/sub_orch_e2e_tests/test_feasibility.ts`

### Script Workflow:
1. **Load Environment**: Manually parses `.env` and `.env.local` to retrieve the `JWT_SECRET` and `DATABASE_URL`.
2. **Start Next.js**: Spawns the Next.js dev server on port `3005` (to avoid port conflicts) as a child process.
3. **Wait for Server**: Polls the server until it responds to HTTP requests.
4. **Sign Token**: Uses `signAccessToken` imported from `lib/auth/jwt` to generate a valid JWT token for a mock administrator.
5. **Test Unauthenticated**: Sends a request to `/api/auth/me` without cookies and asserts a `401 Unauthorized` response.
6. **Test Authenticated**: Sends a request to `/api/auth/me` with the signed `access_token` cookie and asserts a `200 OK` response returning the correct user payload.
7. **Clean Up**: Kills the child Next.js process on completion.

This prototype verifies that the entire E2E API/Server Action test loop can run headlessly and securely with zero external dependencies.
