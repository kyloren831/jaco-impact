# Milestone 4: Frontend Volunteer UX Dashboard — Requirements Analysis & Architectural Layout Proposal

## 1. Executive Summary

Milestone 4 focuses on creating an intuitive, real-time interactive dashboard for volunteers to manage their assigned tasks in Jacó Impact. The core design principle is **decoupling the volunteer's personal task dashboard from the global task status**. Volunteers should see and move their tasks through columns/tabs based on their individual **`AssignmentStatus`** rather than the global `TaskStatus`.

This proposal details the layout and implementation recommendations for:
1. `app/dashboard/volunteer/tasks/page.tsx` (the server-rendered entry point).
2. `components/dashboard/VolunteerTasksDashboard.tsx` (the client-side board wrapper with 4 tabs and real-time listeners).
3. `components/dashboard/TaskDetailsDrawer.tsx` (the slide-out details panel using `RightSidePanel` that supports actions, comments, and uploads).

---

## 2. Page Structure & Data Flow (`app/dashboard/volunteer/tasks/page.tsx`)

### Current Status
The current `app/dashboard/volunteer/tasks/page.tsx` fetches tasks using `getVolunteerTasksAction(eventId)` and groups them into 4 columns (Kanban-style) based on **`task.taskStatus`** (the global task status: `OPEN`, `IN_PROGRESS`, `IN_REVIEW`, `COMPLETED`). 
This violates the requirements because:
- Multiple volunteers can be assigned to the same task. If one volunteer submits, the task may remain `IN_PROGRESS` or transition globally, but each volunteer's individual view should reflect their specific assignment state (e.g. `PENDING_ACCEPTANCE`, `ACCEPTED`, `SUBMITTED`, etc.).
- The visual layout is a rigid 4-column kanban grid which is not optimal for mobile volunteer views where a tabbed interface ("Pendientes", "En curso", "En revisión", "Completadas") is much cleaner and fits the mobile-first UX guidelines.

### Proposed Structure
The revised page will:
1. Fetch the user session and the corresponding `Volunteer` profile.
2. Fetch the list of tasks for the active event (or all events).
3. Pass the initial tasks list, the logged-in volunteer's ID (`volunteerId`), and user ID to a client-side wrapper: `VolunteerTasksDashboard`.

```tsx
// app/dashboard/volunteer/tasks/page.tsx
import { getVolunteerTasksAction } from "@/features/volunteer/actions";
import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import VolunteerTasksDashboard from "@/components/dashboard/VolunteerTasksDashboard";
import Link from "next/link";

export default async function VolunteerTasksPage({ searchParams }: { searchParams: { eventId?: string } }) {
  const session = await requireRole(["VOLUNTEER"]);
  const volunteer = await prisma.volunteer.findUniqueOrThrow({
    where: { userId: session.userId },
  });

  const eventId = searchParams.eventId ? parseInt(searchParams.eventId) : undefined;
  const result = await getVolunteerTasksAction(eventId);

  if (!result.success) {
    return <div className="p-8 text-red-500">Error: {result.error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Mi Tablero de Tareas</h1>
          <p className="text-gray-600 dark:text-gray-400">
            {eventId ? "Tareas del evento seleccionado" : "Todas tus tareas asignadas"}
          </p>
        </div>
        {eventId && (
          <Link href="/dashboard/volunteer/tasks" className="text-sm px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200">
            Ver todas mis tareas
          </Link>
        )}
      </div>

      <VolunteerTasksDashboard 
        initialTasks={result.data} 
        currentVolunteerId={volunteer.id}
        currentUserId={session.userId}
      />
    </div>
  );
}
```

---

## 3. Volunteer-Specific Status Tab Mapping

To decouple the dashboard from the global task status, tasks are grouped under **4 tabs** mapping directly to the volunteer's individual `AssignmentStatus`:

| Tab Name | Mapped `AssignmentStatus` | Meaning for Volunteer | Available Action Buttons in Drawer |
|---|---|---|---|
| **Pendientes** | `PENDING_ACCEPTANCE`, `ACCEPTED` | Tasks assigned to the volunteer that either need acceptance or have been accepted but not yet started. | - **Aceptar** (for `PENDING_ACCEPTANCE`) <br> - **Rechazar** (for `PENDING_ACCEPTANCE`) <br> - **Iniciar Tarea** (for `ACCEPTED`) |
| **En curso** | `IN_PROGRESS`, `REVISION_REQUESTED` | Active tasks being worked on, or returned by coordinator for revision. | - **Entregar Tarea** (via note form) <br> - **Subir Evidencia** (via Dropzone) <br> - **Iniciar** (to move `REVISION_REQUESTED` back to `IN_PROGRESS` if required) |
| **En revisión** | `SUBMITTED`, `UNDER_REVIEW` | Tasks completed by the volunteer, currently awaiting review/validation by the coordinator. | *No volunteer actions available* (read-only state) |
| **Completadas** | `APPROVED` | Tasks successfully completed and approved by the coordinator. | *No volunteer actions available* (read-only state) |

### Terminal/Excluded States
- `DECLINED`, `REJECTED`, and `CANCELLED` are terminal or aborted assignment statuses. To keep the workspace focused on actionable tasks, they are excluded from the main active tabs. They can optionally be listed in a separate history collapse section or excluded entirely from the active dashboard.

---

## 4. TaskDetailsDrawer Component Design (`components/dashboard/TaskDetailsDrawer.tsx`)

The slide-out details panel is built on top of `components/ui/RightSidePanel.tsx`. It provides the main interaction interface for a task.

### Drawer Layout Structure
1. **Header**: Title, Event Name, and Close Button.
2. **Metadata Section**: 
   - Priority badge (High, Medium, Low).
   - Due date (formatted with `es` locale).
   - Assignment status badge.
   - List of other assigned volunteers (using initial avatars).
3. **State Transition Buttons**:
   - Conditional rendering based on the user's `AssignmentStatus`.
   - Actions call the corresponding volunteer Server Action:
     - `acceptAssignmentAction(taskId)`
     - `declineAssignmentAction(taskId, reason)`
     - `startAssignmentAction(taskId)`
     - `submitAssignmentAction(taskId, note)`
4. **Drag-and-Drop Evidence Dropzone**:
   - Visible only when status is `IN_PROGRESS` or `REVISION_REQUESTED`.
   - Accepts image, video, PDF, and document formats.
   - Upload action details below.
5. **Real-time Comments Thread**:
   - Chronological list of comments.
   - Chat input box to post new comments.

### State Transitions Rendering Logic
```typescript
{status === "PENDING_ACCEPTANCE" && (
  <div className="flex gap-3 mt-4">
    <button onClick={handleAccept} className="bg-brand-verde text-white px-4 py-2 rounded-lg font-bold flex-1">
      Aceptar
    </button>
    <button onClick={() => setShowDeclineInput(true)} className="bg-red-100 text-red-700 px-4 py-2 rounded-lg font-bold flex-1">
      Rechazar
    </button>
  </div>
)}
{status === "ACCEPTED" && (
  <button onClick={handleStart} className="bg-brand-azul text-white w-full py-2 rounded-lg font-bold mt-4">
    Iniciar Tarea
  </button>
)}
{(status === "IN_PROGRESS" || status === "REVISION_REQUESTED") && (
  <div className="space-y-4 mt-4">
    {/* Dropzone & Note submission forms */}
  </div>
)}
```

### Drag-and-Drop Evidence Dropzone & Upload Action Integration

#### Option A: Server-Side Upload (Recommended & Currently Integrated)
The server-side `submitEvidenceAction` (in `features/evidences/actions.ts`) accepts a `FormData` object containing the binary `File` object and handles uploading to R2 via `uploadFileToR2` internally:
1. Client registers standard HTML5 drag handlers (`onDragOver`, `onDragLeave`, `onDrop`).
2. When a file is dropped or selected, client prepares `FormData`:
   ```typescript
   const formData = new FormData();
   formData.append("taskId", taskId.toString());
   formData.append("file", file);
   if (description) formData.append("description", description);
   ```
3. Call `submitEvidenceAction(formData)`.

#### Option B: Client-Side Upload (Presigned URL Architecture)
If direct client-side S3/R2 upload is required to offload the server, the flow is:
1. Client calls `getPresignedUploadUrlAction(file.name, file.type)`.
2. Server returns `uploadUrl` and `fileUrl`.
3. Client performs a direct PUT request to the S3 bucket:
   ```typescript
   await fetch(uploadUrl, {
     method: "PUT",
     body: file,
     headers: { "Content-Type": file.type }
   });
   ```
4. **Architectural Caveat**: In the current codebase, there is **no Server Action to register an already-uploaded URL** in the database. `submitEvidenceAction` only accepts a raw `File`. Thus, to support this path, we must either create a new action or stick to **Option A** (passing the `File` object directly through `submitEvidenceAction`), which is fully tested and supported. We recommend using **Option A** for robust compatibility.

---

## 5. Real-time Synchronization Strategy (`hooks/useRealtime.ts`)

To provide a seamless, modern user experience, we hook the components into the Server-Sent Events (SSE) `/api/realtime` stream.

### 5.1 Comments Real-time Update
Inside `TaskDetailsDrawer.tsx`, we listen for `TASK_COMMENT` events:
- When a `TASK_COMMENT` event is received, we check if `event.payload.taskId === activeTaskId`.
- If it matches, we append the comment directly to the drawer's comments state without a full page refresh.
- To prevent duplicate entries (e.g. if the active volunteer posted the comment and it is returned both by the action response and the SSE stream), we perform a key-based deduplication:
  ```typescript
  useRealtime("TASK_COMMENT", (event) => {
    if (event.payload.taskId === task.id) {
      setComments((prev) => {
        if (prev.some((c) => c.id === event.payload.comment.id)) return prev;
        return [...prev, event.payload.comment];
      });
    }
  });
  ```

### 5.2 Assignment Status Real-time Update
Inside `VolunteerTasksDashboard.tsx`, we listen for `ASSIGNMENT_STATUS_CHANGED` events:
- If `event.payload.volunteerId === currentVolunteerId`, it indicates the coordinator approved, rejected, or updated the status of one of our assignments.
- We trigger a page refresh (`router.refresh()`) to fetch the updated task states and re-render the tabs.
- Inside `TaskDetailsDrawer.tsx`, if the drawer is open for `event.payload.taskId`, we update the local `status` state so that transition buttons and badges update immediately in front of the volunteer.

---

## 6. Architectural Code Layout Proposals

Below are the suggested skeletons for the client components.

### 6.1 `components/dashboard/VolunteerTasksDashboard.tsx`
```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useRealtime } from "@/hooks/useRealtime";
import TaskDetailsDrawer from "./TaskDetailsDrawer";
import { format } from "date-fns";
import { es } from "date-fns/locale";

type TabType = "PENDING" | "IN_PROGRESS" | "IN_REVIEW" | "COMPLETED";

export default function VolunteerTasksDashboard({
  initialTasks,
  currentVolunteerId,
  currentUserId,
}: {
  initialTasks: any[];
  currentVolunteerId: number;
  currentUserId: number;
}) {
  const [activeTab, setActiveTab] = useState<TabType>("PENDING");
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const router = useRouter();

  // Listen for assignment status changes and refresh dashboard
  useRealtime("ASSIGNMENT_STATUS_CHANGED", (event) => {
    if (event.payload.volunteerId === currentVolunteerId) {
      router.refresh();
      // If the selected task was updated, update its local assignment status
      if (selectedTask && event.payload.taskId === selectedTask.id) {
        setSelectedTask((prev: any) => ({
          ...prev,
          assignments: prev.assignments.map((a: any) =>
            a.volunteerId === currentVolunteerId ? { ...a, status: event.payload.newStatus } : a
          ),
        }));
      }
    }
  });

  // Extract individual assignments for the current volunteer
  const myAssignments = initialTasks.flatMap((task) => {
    const myAsg = task.assignments.find((a: any) => a.volunteerId === currentVolunteerId);
    return myAsg ? [{ ...task, myAssignment: myAsg }] : [];
  });

  // Group assignments into tabs
  const tabGroups = {
    PENDING: myAssignments.filter((t) => ["PENDING_ACCEPTANCE", "ACCEPTED"].includes(t.myAssignment.status)),
    IN_PROGRESS: myAssignments.filter((t) => ["IN_PROGRESS", "REVISION_REQUESTED"].includes(t.myAssignment.status)),
    IN_REVIEW: myAssignments.filter((t) => ["SUBMITTED", "UNDER_REVIEW"].includes(t.myAssignment.status)),
    COMPLETED: myAssignments.filter((t) => t.myAssignment.status === "APPROVED"),
  };

  const currentList = tabGroups[activeTab];

  return (
    <div className="space-y-4">
      {/* Tabs Headers */}
      <div className="flex border-b border-gray-200 dark:border-gray-800 gap-4">
        {(["PENDING", "IN_PROGRESS", "IN_REVIEW", "COMPLETED"] as TabType[]).map((tab) => {
          const labels = {
            PENDING: "Pendientes",
            IN_PROGRESS: "En curso",
            IN_REVIEW: "En revisión",
            COMPLETED: "Completadas",
          };
          const count = tabGroups[tab].length;
          const isActive = activeTab === tab;

          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-semibold transition-all relative ${
                isActive ? "text-brand-verde font-bold" : "text-gray-500 hover:text-gray-900"
              }`}
            >
              {labels[tab]}
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                isActive ? "bg-brand-verde/10 text-brand-verde" : "bg-gray-100 text-gray-600"
              }`}>
                {count}
              </span>
              {isActive && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-verde animate-in fade-in" />}
            </button>
          );
        })}
      </div>

      {/* Task Cards Grid */}
      {currentList.length === 0 ? (
        <div className="p-12 text-center bg-gray-50 dark:bg-gray-900/20 rounded-2xl text-gray-500 border border-dashed border-gray-300">
          No hay tareas en esta categoría.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentList.map((task) => (
            <div
              key={task.id}
              onClick={() => setSelectedTask(task)}
              className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md cursor-pointer transition-all hover:-translate-y-0.5"
            >
              <div className="flex justify-between items-start mb-3">
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                  task.priority === "HIGH" ? "bg-red-50 text-red-600" :
                  task.priority === "MEDIUM" ? "bg-yellow-50 text-yellow-600" : "bg-green-50 text-green-600"
                }`}>
                  {task.priority}
                </span>
                <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md">
                  {task.myAssignment.status}
                </span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{task.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-4">{task.description}</p>
              
              <div className="flex justify-between items-center pt-4 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-400">
                <span>Vence: {task.dueDate ? format(new Date(task.dueDate), "PPP", { locale: es }) : "Sin fecha"}</span>
                <span className="text-brand-verde font-bold hover:underline">Ver detalles</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedTask && (
        <TaskDetailsDrawer
          task={selectedTask}
          currentVolunteerId={currentVolunteerId}
          currentUserId={currentUserId}
          isOpen={!!selectedTask}
          onClose={() => {
            setSelectedTask(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
```

### 6.2 `components/dashboard/TaskDetailsDrawer.tsx`
```tsx
"use client";

import { useEffect, useState, useOptimistic, useTransition } from "react";
import { RightSidePanel } from "../ui/RightSidePanel";
import { useRealtime } from "@/hooks/useRealtime";
import {
  acceptAssignmentAction,
  declineAssignmentAction,
  startAssignmentAction,
  submitAssignmentAction,
  addTaskCommentAction,
  getTaskCommentsAction,
} from "@/features/volunteer/actions";
import { submitEvidenceAction } from "@/features/evidences/actions";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

export default function TaskDetailsDrawer({
  task,
  currentVolunteerId,
  currentUserId,
  isOpen,
  onClose,
}: {
  task: any;
  currentVolunteerId: number;
  currentUserId: number;
  isOpen: boolean;
  onClose: () => void;
}) {
  const myAssignment = task.assignments.find((a: any) => a.volunteerId === currentVolunteerId);
  const [status, setStatus] = useState<string>(myAssignment?.status || "PENDING_ACCEPTANCE");
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState("");
  const [declineReason, setDeclineReason] = useState("");
  const [showDeclineInput, setShowDeclineInput] = useState(false);
  const [evidenceNote, setEvidenceNote] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Optimistic UI for comments thread
  const [optimisticComments, addOptimisticComment] = useOptimistic(
    comments,
    (state, newComment: any) => [newComment, ...state] // Chronological order display handling
  );

  // Load comments on mount
  useEffect(() => {
    if (isOpen) {
      getTaskCommentsAction(task.id).then((res) => {
        if (res.success && res.data) {
          // Sort comments chronologically (oldest to newest or vice versa, based on UI layout)
          setComments(res.data.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        }
      });
    }
  }, [task.id, isOpen]);

  // Real-time comments listener
  useRealtime("TASK_COMMENT", (event) => {
    if (event.payload.taskId === task.id) {
      setComments((prev) => {
        if (prev.some((c) => c.id === event.payload.comment.id)) return prev;
        return [event.payload.comment, ...prev];
      });
    }
  });

  const handleAccept = async () => {
    startTransition(async () => {
      const res = await acceptAssignmentAction(task.id);
      if (res.success) setStatus("ACCEPTED");
    });
  };

  const handleDecline = async () => {
    if (!declineReason.trim()) return;
    startTransition(async () => {
      const res = await declineAssignmentAction(task.id, declineReason);
      if (res.success) {
        setStatus("DECLINED");
        onClose();
      }
    });
  };

  const handleStart = async () => {
    startTransition(async () => {
      const res = await startAssignmentAction(task.id);
      if (res.success) setStatus("IN_PROGRESS");
    });
  };

  const handleSubmitNote = async () => {
    startTransition(async () => {
      const res = await submitAssignmentAction(task.id, evidenceNote);
      if (res.success) setStatus("SUBMITTED");
    });
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;
    await uploadEvidence(file);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadEvidence(file);
  };

  const uploadEvidence = async (file: File) => {
    setIsUploading(true);
    const formData = new FormData();
    formData.append("taskId", task.id.toString());
    formData.append("file", file);
    if (evidenceNote) formData.append("description", evidenceNote);

    const res = await submitEvidenceAction(formData);
    if (res.success) {
      setStatus("SUBMITTED");
      setEvidenceNote("");
    } else {
      alert(res.error || "Error al subir evidencia");
    }
    setIsUploading(false);
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    const newComment = {
      id: Date.now(), // Temporary ID for optimistic rendering
      content: commentText,
      createdAt: new Date().toISOString(),
      author: {
        id: currentUserId,
        name: "Tú",
      },
    };

    addOptimisticComment(newComment);
    setCommentText("");

    const res = await addTaskCommentAction(task.id, newComment.content);
    if (!res.success) {
      // Revert comments or display error message
      alert(res.error || "Error al enviar comentario");
    }
  };

  return (
    <RightSidePanel isOpen={isOpen} onClose={onClose} title={task.title}>
      <div className="p-6 space-y-6">
        
        {/* Info Area */}
        <div>
          <span className="text-xs text-gray-500 font-medium">{task.event.name}</span>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{task.description}</p>
        </div>

        {/* Status Actions */}
        <div className="border-t border-b border-gray-100 dark:border-gray-800 py-4">
          <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Tu Estado de Asignación: <span className="text-brand-verde">{status}</span></h4>
          
          {status === "PENDING_ACCEPTANCE" && !showDeclineInput && (
            <div className="flex gap-3">
              <button disabled={isPending} onClick={handleAccept} className="bg-brand-verde text-white py-2 rounded-lg font-bold flex-1 hover:bg-brand-verde-oscuro">
                Aceptar
              </button>
              <button onClick={() => setShowDeclineInput(true)} className="bg-red-50 text-red-600 py-2 rounded-lg font-bold flex-1 hover:bg-red-100">
                Rechazar
              </button>
            </div>
          )}

          {showDeclineInput && (
            <div className="space-y-2">
              <textarea
                placeholder="Motivo del rechazo..."
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                className="w-full text-sm border-gray-300 rounded-lg"
                rows={2}
              />
              <div className="flex gap-2">
                <button disabled={isPending} onClick={handleDecline} className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold">
                  Confirmar Rechazo
                </button>
                <button onClick={() => setShowDeclineInput(false)} className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-xs">
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {status === "ACCEPTED" && (
            <button disabled={isPending} onClick={handleStart} className="bg-brand-azul text-white w-full py-2.5 rounded-lg font-bold hover:bg-brand-azul-oscuro">
              Iniciar Tarea
            </button>
          )}

          {(status === "IN_PROGRESS" || status === "REVISION_REQUESTED") && (
            <div className="space-y-4">
              <textarea
                placeholder="Nota de entrega / descripción de evidencia..."
                value={evidenceNote}
                onChange={(e) => setEvidenceNote(e.target.value)}
                className="w-full text-sm border-gray-300 rounded-lg focus:ring-brand-verde focus:border-brand-verde"
                rows={2}
              />

              {/* Drag & Drop zone */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                className="border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-brand-verde rounded-2xl p-6 text-center cursor-pointer transition-colors relative"
              >
                <input
                  type="file"
                  id="evidence-file-input"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={isUploading}
                />
                <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-xs text-gray-500 font-medium">
                  {isUploading ? "Subiendo archivo..." : "Arrastra un archivo aquí o haz clic para seleccionar"}
                </p>
              </div>

              <div className="flex justify-between items-center text-xs text-gray-400">
                <span>O puedes entregar sin subir archivos:</span>
                <button disabled={isPending} onClick={handleSubmitNote} className="text-brand-verde font-bold hover:underline">
                  Entregar sin archivo
                </button>
              </div>
            </div>
          )}

          {["SUBMITTED", "UNDER_REVIEW"].includes(status) && (
            <div className="bg-yellow-50 dark:bg-yellow-950/20 text-yellow-700 border border-yellow-100 dark:border-yellow-900 p-3 rounded-lg text-sm">
              Entregada. A la espera de la revisión por parte del coordinador.
            </div>
          )}

          {status === "APPROVED" && (
            <div className="bg-green-50 dark:bg-green-950/20 text-green-700 border border-green-100 dark:border-green-900 p-3 rounded-lg text-sm font-semibold flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              ¡Tarea Aprobada y Completada con éxito!
            </div>
          )}
        </div>

        {/* Comments Section */}
        <div className="space-y-4">
          <h3 className="font-bold text-gray-900 dark:text-white text-base">Comentarios</h3>
          
          <form onSubmit={handleAddComment} className="flex gap-2">
            <input
              type="text"
              placeholder="Escribe un comentario..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="flex-1 rounded-lg border-gray-300 dark:border-gray-700 text-sm focus:ring-brand-verde focus:border-brand-verde"
            />
            <button type="submit" className="bg-brand-verde text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-brand-verde-oscuro">
              Enviar
            </button>
          </form>

          <div className="space-y-3 max-h-[300px] overflow-y-auto scrollbar-thin">
            {optimisticComments.map((c: any) => {
              const isMe = c.author.id === currentUserId;
              return (
                <div key={c.id} className={`p-3 rounded-xl max-w-[85%] ${
                  isMe ? "ml-auto bg-brand-verde/10 text-gray-800" : "bg-gray-100 text-gray-800"
                }`}>
                  <div className="flex justify-between items-center text-[10px] text-gray-400 mb-1 font-semibold">
                    <span>{isMe ? "Tú" : c.author.name}</span>
                    <span>{formatDistanceToNow(new Date(c.createdAt), { addSuffix: true, locale: es })}</span>
                  </div>
                  <p className="text-xs font-medium leading-relaxed">{c.content}</p>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </RightSidePanel>
  );
}
```

---

## 7. Verification Plan & Testing

To verify the correct functionality of this proposed volunteer workflow dashboard:
1. **Manual Visual Layout**:
   - Check that switching tabs updates the filtered lists and updates counts.
   - Verify that clicking a card opens the right side drawer showing all task details and correct context.
2. **Transition Testing**:
   - Run the E2E test suite to verify the transitions are functionally valid on the backend:
     ```bash
     npx tsx tests/e2e/run.ts
     ```
   - Check status transitions using the UI buttons and check that the drawer status shifts to the next valid state.
3. **SSE Streams & Real-time Comments**:
   - Open two browser sessions (one as Volunteer and one as Admin/Coordinator commenting on the task).
   - Verify comments show up instantly in the drawer comments list without any manual refresh.
   - Verify status updates dynamically when changed by a coordinator.
