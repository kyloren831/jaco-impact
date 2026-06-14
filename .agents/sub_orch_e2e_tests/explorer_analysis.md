# E2E Testing Explorer Analysis Report

This report provides a comprehensive analysis of the 'Mis Tareas' repository codebase to guide the design and implementation of a robust, opaque-box E2E testing framework. 

---

## 1. Executive Summary & Recommendations

Based on our exploration of the codebase, we recommend the following E2E testing architecture:
*   **Test Runner**: **Playwright** is the recommended E2E runner. Next.js Server Actions rely on dynamic build-time action IDs, making raw HTTP API testing of Server Actions fragile. Playwright naturally handles these actions via browser-based UI interaction.
*   **Real-time Event Verification**: Tests should open programmatic SSE connections to `/api/realtime` during execution (using Node `fetch` or a stream reader) to intercept and assert on broadcasted events (e.g. `ASSIGNMENT_SUBMITTED`, `EVIDENCE_SUBMITTED`).
*   **Database State Management**: Use Prisma directly within Playwright global setup/teardown and test hooks to seed test users, events, and tasks, and to assert on database state directly (e.g., verifying assignment status changes in the database).

---

## 2. Existing Testing Setups

An audit of the codebase confirms that **there is currently no pre-configured testing framework, runner, or test suite**.
*   **`package.json`**: There are no testing dependencies (like Playwright, Cypress, Vitest, or Jest) and no test scripts under `"scripts"` (only `dev`, `build`, `start`, `lint`).
*   **Test Files**: No standard test files (`*.test.ts`, `*.spec.ts`) exist.
*   **Utilities**: A single helper script, `test-prisma.ts`, is present in the root directory. It is used solely to verify database connectivity by counting users:
    ```typescript
    // test-prisma.ts
    import { prisma } from "./lib/prisma";
    async function main() {
      const count = await prisma.user.count();
      console.log("User count:", count);
    }
    main().catch(console.error).finally(() => process.exit(0));
    ```

---

## 3. Authentication Mechanism

Authentication in 'Mis Tareas' is custom-built using JSON Web Tokens (JWT) stored in HttpOnly cookies, combined with session tracking and token rotation in the database.

### 3.1. Login Flow (`features/auth/actions.ts`)
*   **Entry Point**: `loginAction(prevState: any, formData: FormData)` Server Action.
*   **Validation**: Uses `LoginUserSchema` (from `lib/validators/user.validator.ts`) to validate email and password inputs.
*   **Verification**:
    1. Queries the user by email using Prisma: `prisma.user.findUnique({ where: { email }, include: { userRoles: true, pillar: true } })`.
    2. Checks if the user is active: `user.isActive`.
    3. Compares passwords using `bcrypt.compare(password, user.password)`.
*   **Token Issuance**: Generates two JWT tokens using the `jose` library (defined in `lib/auth/jwt.ts`):
    *   **Access Token**: Expires in `15m`. Contains: `userId` (numeric), `sub` (string userId), `email`, `role` (primary role), `roles` (all assigned roles), and `pillarId` (if coordinator).
    *   **Refresh Token**: Expires in `7d`. Contains: `sub` (string userId) and `type: "refresh"`.
*   **Session Database Persist**: Hashes the refresh token (`hashToken(refreshToken)` in `lib/auth/hash.ts`) and records it in the `sessions` table via `createSession(...)` (in `lib/auth/session.ts`), storing `userId`, `refreshHash`, `userAgent`, `ip`, and expiration date.
*   **Cookie Storage**: Sets both tokens in cookies via `setAuthCookies(accessToken, refreshToken)` (in `lib/auth/cookies.ts`):
    *   `access_token`: HttpOnly, lax sameSite, secure in production.
    *   `refresh_token`: HttpOnly, lax sameSite, secure in production.

### 3.2. Session Guards & Middleware (`lib/auth/guards.ts` & `proxy.ts`)
*   **Route Protection (`proxy.ts` - Next.js 16 Proxy)**:
    Acts as a middleware guarding paths matching `["/dashboard/:path*", "/admin/:path*"]`. It performs an optimistic check for the presence of the `access_token` cookie. If missing, redirects to `/login?returnUrl=...`.
*   **Server-Side Security Guards (`lib/auth/guards.ts`)**:
    *   `requireAuth()`: Extracts `access_token` from cookies, verifies it against `JWT_SECRET`, and returns the `AccessTokenPayload`. Throws `AuthError` if missing/expired.
    *   `requireRole(allowedRoles)`: Calls `requireAuth()` and ensures the user has one of the allowed roles.
    *   `requirePillarAccess(pillarId)`: Ensures the user is an global `ADMIN` or a `COORDINATOR` assigned to that specific `pillarId`.
    *   `requireOwnership(resourceOwnerId)`: *Note*: This is defined but currently unused. There is a potential typo/bug here, as it compares `payload.id` (which does not exist on `AccessTokenPayload` since it uses `userId` and `sub`) with `resourceOwnerId`:
        ```typescript
        if (String(payload.id) !== String(resourceOwnerId)) { // payload.id is undefined!
        ```
*   **Higher-Order Action Wrappers**:
    `withAuth`, `withRole`, and `withPillarAccess` wrap server-side functions/actions, resolving the session and passing the payload as the first argument automatically.

### 3.3. Token Refresh Flow (`app/api/auth/refresh/route.ts`)
Clients call POST `/api/auth/refresh` automatically via `apiFetch(input, init)` (in `lib/auth/apiFetch.ts`) when encountering a `401 Unauthorized`.
*   Verifies the refresh token cookie.
*   Hashes it and checks the database `Session` table using `findValidSession(userId, currentHash)`.
*   **Reuse Attack Prevention**: If a valid refresh token is used but no active session is found in the database, it assumes the token was stolen and already reused. It immediately revokes all active sessions for that user (`revokeAllUserSessions(userId)`).
*   On success: Revokes the old session, creates a new one, generates new access/refresh tokens, and updates the cookies.

---

## 4. Server Actions Structure & Request Validation

The Server Actions in `features/volunteer/actions.ts` and `features/evidences/actions.ts` highlight two distinct patterns for authorization and validation.

### 4.1. Volunteer Actions (`features/volunteer/actions.ts`)
*   **Pattern**: Uses direct, unwrapped async functions.
*   **Authorization**: Calls `requireRole` manually inside a try-catch block.
*   **Validation**: Inputs (such as `eventId: number`) are passed as direct arguments and validated manually (e.g. checking uniqueness/existence in DB).
*   **Example**:
    ```typescript
    export async function registerToEventAction(eventId: number) {
      try {
        const session = await requireRole(["VOLUNTEER"]); // retrieve session & role check
        const volunteer = await prisma.volunteer.findUnique({ where: { userId: session.userId } });
        if (!volunteer) throw new Error("Perfil de voluntario no encontrado");
        // ... business logic ...
        return { success: true as const };
      } catch (error: any) {
        return { success: false as const, error: error.message };
      }
    }
    ```

### 4.2. Evidence Actions (`features/evidences/actions.ts`)
*   **Pattern**: Uses higher-order wrappers (`withAuth`, `withRole`) to handle session injection.
*   **Authorization**: Pre-validated by the wrapper, which injects `payload: AccessTokenPayload` as the first argument.
*   **Validation**: Inputs are passed via `FormData`. The action extracts parameters manually, performs type conversions, and does basic validation before calling a domain service.
*   **Example**:
    ```typescript
    export const submitEvidenceAction = withAuth(async (payload, formData: FormData) => {
      try {
        const taskIdStr = formData.get('taskId');
        const file = formData.get('file') as File | null;
        const descriptionStr = formData.get('description');
        if (!taskIdStr || !file) return { success: false, error: 'Falta taskId o el archivo' };
        
        const taskId = parseInt(taskIdStr.toString(), 10);
        const description = descriptionStr ? descriptionStr.toString() : undefined;
        
        const volunteer = await prisma.volunteer.findUnique({ where: { userId: payload.userId } });
        if (!volunteer) return { success: false, error: 'El usuario no está registrado como voluntario' };

        const evidence = await evidenceService.submitEvidence({
          taskId,
          volunteerId: volunteer.id,
          actorId: payload.userId,
          file,
          description,
        });
        return { success: true, data: evidence };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    });
    ```

---

## 5. Real-Time API SSE Route (`app/api/realtime/route.ts`)

The SSE endpoint acts as a global broadcast channel for domain events.

*   **Endpoint**: GET `/api/realtime`
*   **Authentication**: **No authentication required**. The proxy matcher ignores this route, and the route itself does not invoke `requireAuth()`.
*   **Mechanism**:
    1. Opens a `ReadableStream`.
    2. Subscribes a listener `sendEvent` to all domain event names listed in `DOMAIN_EVENTS` (from `domain/shared/events.ts`) via the global `domainEventBus`.
    3. When an event is emitted, it writes to the stream in standard SSE format: `data: ${JSON.stringify(event)}\n\n`.
    4. Sends a `: keep-alive\n\n` heartbeat comment every 30 seconds.
    5. Cleans up event listeners and intervals when the request is aborted (via `req.signal.addEventListener('abort')`).
*   **Programmatic Connection in Tests**:
    Since it is a public GET endpoint, we can connect programmatically in our test suite using standard HTTP stream reading:
    ```typescript
    const res = await fetch("http://localhost:3000/api/realtime");
    const reader = res.body?.getReader();
    const decoder = new TextDecoder();
    
    // Read loop
    while (reader) {
      const { value, done } = await reader.read();
      if (done) break;
      const text = decoder.decode(value);
      // Process SSE lines (filtering on data:)
    }
    ```

---

## 6. Prisma Database Setup

### 6.1. Connection Configuration
*   **Provider**: PostgreSQL (`postgresql`).
*   **Connection Variable**: `DATABASE_URL` (defined in `.env` / `.env.local`).
*   **Adapter**: Uses `@prisma/adapter-pg` with a `pg` pool (`new Pool({ connectionString: process.env.DATABASE_URL })`) to allow edge-compatibility and connection pooling.
*   **Client Location**: Generated client is saved outside `node_modules` at `../generated/prisma`.

### 6.2. Relevant Database Models
*   **`users`**: Contains credentials and active status.
*   **`user_roles`**: Links users to roles (`ADMIN`, `COORDINATOR`, `VOLUNTEER`).
*   **`sessions`**: Tracks active/revoked user sessions.
*   **`volunteers`**: Extends the user profile with phone, nationality, emergency contacts, etc.
*   **`projects` & `events`**: Core entities representing pillars, projects, and child events.
*   **`tasks`**: Actionable items under events.
*   **`task_assignments`**: Links tasks to volunteers, tracking status transitions (`PENDING_ACCEPTANCE`, `ACCEPTED`, `DECLINED`, `IN_PROGRESS`, `SUBMITTED`, `APPROVED`, `REJECTED`).
*   **`tasks_evidences`**: Files and verification notes submitted by volunteers.

### 6.3. Seed and Admin Scripts
Two scripts exist in the project root to seed a test administrative user:
1.  **`create-admin.ts`**: TypeScript script that imports `dotenv/config`, hashes `admin1234` with `bcryptjs`, and creates/upserts a user with:
    *   Email: `admin@jacoimpact.com`
    *   Password: `admin1234` (hashed)
    *   Role: `ADMIN`
    *   Volunteer Profile: Linked with default values.
2.  **`create-admin.js`**: Pure Node.js CommonJS script doing the exact same thing but referencing `./generated/prisma` directly (does not load `.env` automatically; environment variables must be preloaded).

These scripts can be executed via:
```bash
# TS version
npx tsx create-admin.ts

# JS version
DATABASE_URL="postgresql://..." node create-admin.js
```

---

## 7. Recommended E2E Testing Framework & Runner

To implement a robust, maintainable E2E testing framework, we recommend **Playwright**.

### 7.1. Why Playwright?
1.  **Opaque-Box E2E Compliance**: Playwright allows testing the application through its real user interface. It eliminates the need to mock or guess the Next.js Server Action IDs, which change with every build.
2.  **SSE Connection Support**: Playwright runs in a Node environment and can simultaneously spin up programmatic SSE clients to listen to `/api/realtime` while browser events are executed, allowing real-time event verification.
3.  **Database Seeding**: Because Playwright tests run in Node, they can import `@prisma/client` directly. We can use the existing database connection variables to reset the DB and insert test users, projects, tasks, and assignments before running test scenarios.
4.  **Parallel Execution**: Playwright supports parallelizing test runs out of the box, speeding up E2E verification.

### 7.2. Test Suite Architecture Proposal
```
tests/e2e/
├── global.setup.ts         # Resets database, runs migration, executes admin seed
├── helpers/
│   ├── auth.ts             # Auth utilities (e.g. bypass login by manually setting cookies)
│   ├── db.ts               # Test data generators (insert project, event, task, volunteer)
│   └── sse-client.ts       # SSE event collector class
├── specs/
│   ├── volunteer-flow.spec.ts # Happy path: Accept -> Start -> Submit Evidence -> Admin Approve
│   ├── boundary-cases.spec.ts # Invalid transitions (e.g. start task without accepting)
│   └── sse-broadcast.spec.ts  # Verifies SSE broadcasts occur on transitions
└── playwright.config.ts
```

### 7.3. Test Phase Execution Design
1.  **Setup Phase**:
    *   Spin up the test database.
    *   Execute database migrations: `npx prisma migrate deploy`.
    *   Seed initial state (Admin, Coordinator, Volunteer users).
2.  **Execution Phase**:
    *   **Test Case 1 (Happy Path)**:
        *   Log in as Volunteer.
        *   Navigate to tasks. Accept a task.
        *   Verify the DB status changes to `ACCEPTED`.
        *   Start task. Verify status changes to `IN_PROGRESS`.
        *   Submit evidence (upload file, write note). Verify status changes to `SUBMITTED`.
        *   Assert that `/api/realtime` broadcasted `EVIDENCE_SUBMITTED` event.
        *   Log in as Coordinator. Approve evidence.
        *   Verify status changes to `APPROVED` and task status becomes `COMPLETED`.
    *   **Test Case 2 (Edge Case)**:
        *   Attempt to submit evidence for a task that is not accepted.
        *   Verify appropriate UI error message is displayed.
3.  **Teardown Phase**:
    *   Clean up or reset tables to avoid state leak between tests.
