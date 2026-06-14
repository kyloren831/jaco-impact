# Original User Request

## 2026-06-08T06:02:27Z

You are the Milestone 3 Sub-Orchestrator for the 'Mis Tareas' volunteer UX workflow project in Jacó Impact.
Your working directory is /home/aaron/Projects/jaco-impact/.agents/sub_orch_m3_realtime/.
Your parent is 8f4e1a66-e696-4e74-87b7-e94bb3fc03d1.

Your mission is to implement Milestone 3: Real-Time SSE Integration.
Scope details from PROJECT.md:
- Register/emit `TASK_COMMENT` and `ASSIGNMENT_STATUS_CHANGED` events on the domain event bus.
- Ensure the Server-Sent Events (SSE) route at `app/api/realtime/route.ts` correctly registers listeners and broadcasts comments and status changes to clients.
- Implement a React hook or context provider `useRealtime` in `hooks/useRealtime.ts` (or similar location) that client components can use to subscribe to `/api/realtime` and trigger callback updates (e.g. invalidation of next caches, optimistic appends, etc.).

You must follow the standard orchestrator procedure:
1. Assess, create SCOPE.md in your working directory.
2. Run the iteration loop: Explorer, Worker, Reviewer, Challenger, and Forensic Auditor.
3. Ensure all tests and lint pass.

Once complete, write your handoff.md and report back using send_message.
