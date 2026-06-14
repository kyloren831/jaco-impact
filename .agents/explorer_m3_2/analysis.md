# Analysis: Real-Time SSE Integration (Milestone 3)

This report details the investigation of the codebase to implement real-time events via Server-Sent Events (SSE). It includes the precise locations for changes and the exact implementation specifications.

## 1. Domain Events Definition (`domain/shared/events.ts`)

- **Current State**: `DOMAIN_EVENTS` lists the available domain events, but does not include `ASSIGNMENT_STATUS_CHANGED`. `AssignmentStatusChangedPayload` is already defined in `domain/shared/events.ts` (lines 13-21).
- **Proposed Change**: Add `ASSIGNMENT_STATUS_CHANGED: 'ASSIGNMENT_STATUS_CHANGED'` to the `DOMAIN_EVENTS` object.

```typescript
export const DOMAIN_EVENTS = {
  // Comment domain
  TASK_COMMENT: 'TASK_COMMENT',

  // ... other events

  // Assignment domain
  TASK_CREATED: 'TASK_CREATED',
  TASK_ASSIGNED: 'TASK_ASSIGNED',
  ASSIGNMENT_ACCEPTED: 'ASSIGNMENT_ACCEPTED',
  ASSIGNMENT_DECLINED: 'ASSIGNMENT_DECLINED',
  ASSIGNMENT_STARTED: 'ASSIGNMENT_STARTED',
  ASSIGNMENT_SUBMITTED: 'ASSIGNMENT_SUBMITTED',
  ASSIGNMENT_APPROVED: 'ASSIGNMENT_APPROVED',
  ASSIGNMENT_REVISION_REQUESTED: 'ASSIGNMENT_REVISION_REQUESTED',
  ASSIGNMENT_CANCELLED: 'ASSIGNMENT_CANCELLED',
  ASSIGNMENT_STATUS_CHANGED: 'ASSIGNMENT_STATUS_CHANGED', // Add this
  TASK_STATUS_DERIVED: 'TASK_STATUS_DERIVED',
  
  // ... other events
} as const;
```

---

## 2. Emission of `ASSIGNMENT_STATUS_CHANGED` (`domain/assignments/service.ts`)

- **Current State**: Transition methods in `AssignmentService` emit specific events (e.g. `ASSIGNMENT_ACCEPTED`, `ASSIGNMENT_DECLINED`, `ASSIGNMENT_STARTED`, `ASSIGNMENT_SUBMITTED`, `ASSIGNMENT_APPROVED`, `ASSIGNMENT_REVISION_REQUESTED`, `ASSIGNMENT_CANCELLED`).
- **Proposed Change**: Emit `DOMAIN_EVENTS.ASSIGNMENT_STATUS_CHANGED` alongside these specific events. The transition actions are:
  1. `acceptAssignment` (accept)
  2. `declineAssignment` (decline)
  3. `startAssignment` (start)
  4. `submitAssignment` (submit)
  5. `reviewAssignment` (review)
     - Note: During `reviewAssignment`, the assignment status transitions first to `UNDER_REVIEW` (if it was `SUBMITTED`), and then to `newStatus` (`APPROVED`, `REJECTED`, or `REVISION_REQUESTED`). We should emit the status change event for both database transitions.
  6. `removeAssignment` (remove)

---

## 3. API Real-Time SSE Route Payload Formatting (`app/api/realtime/route.ts`)

- **Current State**: The route registers listeners for all `DOMAIN_EVENTS` and directly streams them encoded as JSON.
- **Proposed Change**: Intercept and format payloads for `TASK_COMMENT` and `ASSIGNMENT_STATUS_CHANGED` in `sendEvent` inside `GET`:
  - **`TASK_COMMENT`**: Nested `comment` property containing the comment details and `author` information, while preserving all top-level flat properties (such as `taskId`, `content`, `authorName`) for backward compatibility with existing tests in `tests/e2e/specs/tier1.spec.ts`, `tier3.spec.ts`, and `tier4.spec.ts`.
  - **`ASSIGNMENT_STATUS_CHANGED`**: Clean payload containing exactly `taskId`, `volunteerId`, and `newStatus` as specified in the interface contract.

---

## 4. Clientside React Hook `useRealtime` (`hooks/useRealtime.ts`)

- **Current State**: Accepts only `eventType?: string` and returns `{ lastEvent, isConnected }`.
- **Proposed Change**: Enhance signature to allow clients to optionally register a callback handler `onEvent?: (event: RealtimeEvent<T>) => void`. Use `useRef` to store the callback reference to prevent unnecessary `EventSource` reconnections when unstable callback references are passed.

---

## Proposed Diff Patches

### Patch for `domain/shared/events.ts`
```patch
diff --git a/domain/shared/events.ts b/domain/shared/events.ts
index c6d18a9..ea2360b 100644
--- a/domain/shared/events.ts
+++ b/domain/shared/events.ts
@@ -95,4 +95,5 @@ export const DOMAIN_EVENTS = {
   ASSIGNMENT_REVISION_REQUESTED: 'ASSIGNMENT_REVISION_REQUESTED',
   ASSIGNMENT_CANCELLED: 'ASSIGNMENT_CANCELLED',
+  ASSIGNMENT_STATUS_CHANGED: 'ASSIGNMENT_STATUS_CHANGED',
   TASK_STATUS_DERIVED: 'TASK_STATUS_DERIVED',
```

### Patch for `domain/assignments/service.ts`
```patch
diff --git a/domain/assignments/service.ts b/domain/assignments/service.ts
index d84dfa4..f4c0a52 100644
--- a/domain/assignments/service.ts
+++ b/domain/assignments/service.ts
@@ -112,4 +112,17 @@ export class AssignmentService {
       });
 
+      await domainEventBus.emit({
+        metadata: { timestamp: new Date(), actorId },
+        type: DOMAIN_EVENTS.ASSIGNMENT_STATUS_CHANGED,
+        payload: {
+          taskId,
+          volunteerId,
+          eventId: current.eventId,
+          actorId,
+          previousStatus: current.status,
+          newStatus
+        }
+      });
+
       return updated;
     });
@@ -146,4 +159,18 @@ export class AssignmentService {
       });
 
+      await domainEventBus.emit({
+        metadata: { timestamp: new Date(), actorId },
+        type: DOMAIN_EVENTS.ASSIGNMENT_STATUS_CHANGED,
+        payload: {
+          taskId,
+          volunteerId,
+          eventId: current.eventId,
+          actorId,
+          previousStatus: current.status,
+          newStatus,
+          reason
+        }
+      });
+
       return updated;
     });
@@ -179,4 +206,17 @@ export class AssignmentService {
       });
 
+      await domainEventBus.emit({
+        metadata: { timestamp: new Date(), actorId },
+        type: DOMAIN_EVENTS.ASSIGNMENT_STATUS_CHANGED,
+        payload: {
+          taskId,
+          volunteerId,
+          eventId: current.eventId,
+          actorId,
+          previousStatus: current.status,
+          newStatus
+        }
+      });
+
       return updated;
     });
@@ -212,4 +252,17 @@ export class AssignmentService {
       });
 
+      await domainEventBus.emit({
+        metadata: { timestamp: new Date(), actorId },
+        type: DOMAIN_EVENTS.ASSIGNMENT_STATUS_CHANGED,
+        payload: {
+          taskId,
+          volunteerId,
+          eventId: current.eventId,
+          actorId,
+          previousStatus: current.status,
+          newStatus
+        }
+      });
+
       return updated;
     });
@@ -230,4 +283,17 @@ export class AssignmentService {
         });
 
+        await domainEventBus.emit({
+          metadata: { timestamp: new Date(), actorId },
+          type: DOMAIN_EVENTS.ASSIGNMENT_STATUS_CHANGED,
+          payload: {
+            taskId,
+            volunteerId,
+            eventId: current.eventId,
+            actorId,
+            previousStatus: current.status,
+            newStatus: tempStatus
+          }
+        });
+      }
+
       const newStatus = assignmentStateMachine.transition(tempStatus, AssignmentStatus[decision]);
@@ -263,4 +329,17 @@ export class AssignmentService {
       }
 
+      await domainEventBus.emit({
+        metadata: { timestamp: new Date(), actorId },
+        type: DOMAIN_EVENTS.ASSIGNMENT_STATUS_CHANGED,
+        payload: {
+          taskId,
+          volunteerId,
+          eventId: current.eventId,
+          actorId,
+          previousStatus: tempStatus,
+          newStatus
+        }
+      });
+
       return updated;
     });
@@ -298,4 +377,17 @@ export class AssignmentService {
       });
 
+      await domainEventBus.emit({
+        metadata: { timestamp: new Date(), actorId },
+        type: DOMAIN_EVENTS.ASSIGNMENT_STATUS_CHANGED,
+        payload: {
+          taskId,
+          volunteerId,
+          eventId: current.eventId,
+          actorId,
+          previousStatus: current.status,
+          newStatus
+        }
+      });
+
       return updated;
     });
```

### Patch for `app/api/realtime/route.ts`
```patch
diff --git a/app/api/realtime/route.ts b/app/api/realtime/route.ts
index b312151..cd5331e 100644
--- a/app/api/realtime/route.ts
+++ b/app/api/realtime/route.ts
@@ -12,5 +12,31 @@ export async function GET(req: NextRequest) {
       const sendEvent = (event: any) => {
         try {
-          const data = `data: ${JSON.stringify(event)}\n\n`;
+          let formattedEvent = event;
+
+          if (event && event.type === DOMAIN_EVENTS.TASK_COMMENT) {
+            formattedEvent = {
+              ...event,
+              payload: {
+                ...event.payload,
+                comment: {
+                  id: event.payload.commentId,
+                  content: event.payload.content,
+                  createdAt: event.payload.createdAt,
+                  author: {
+                    id: event.payload.authorId,
+                    name: event.payload.authorName,
+                  },
+                },
+              },
+            };
+          } else if (event && event.type === DOMAIN_EVENTS.ASSIGNMENT_STATUS_CHANGED) {
+            formattedEvent = {
+              ...event,
+              payload: {
+                taskId: event.payload.taskId,
+                volunteerId: event.payload.volunteerId,
+                newStatus: event.payload.newStatus,
+              },
+            };
+          }
+          const data = `data: ${JSON.stringify(formattedEvent)}\n\n`;
           controller.enqueue(encoder.encode(data));
```

### Patch for `hooks/useRealtime.ts`
```patch
diff --git a/hooks/useRealtime.ts b/hooks/useRealtime.ts
index e5a34e0..9de0e51 100644
--- a/hooks/useRealtime.ts
+++ b/hooks/useRealtime.ts
@@ -3,2 +3,2 @@
-import { useEffect, useState } from 'react';
+import { useEffect, useState, useRef } from 'react';
 
@@ -10,3 +10,6 @@ type RealtimeEvent<T = any> = {
 
-export function useRealtime<T = any>(eventType?: string) {
+export function useRealtime<T = any>(
+  eventType?: string,
+  onEvent?: (event: RealtimeEvent<T>) => void
+) {
   const [lastEvent, setLastEvent] = useState<RealtimeEvent<T> | null>(null);
   const [isConnected, setIsConnected] = useState(false);
 
+  // Store current callback in a ref to avoid reconnecting if reference changes
+  const onEventRef = useRef(onEvent);
+  useEffect(() => {
+    onEventRef.current = onEvent;
+  }, [onEvent]);
+
   useEffect(() => {
@@ -31,2 +39,5 @@ export function useRealtime<T = any>(eventType?: string) {
           setLastEvent(parsedEvent);
+          if (onEventRef.current) {
+            onEventRef.current(parsedEvent);
+          }
         }
```
