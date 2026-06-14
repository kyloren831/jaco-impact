# Milestone 4: Frontend Volunteer UX Dashboard — Analysis and Architectural Proposal

This document presents the detailed architectural layout and implementation recommendations for Milestone 4 (Frontend Volunteer UX Dashboard). It outlines the design patterns, component relationships, state transitions, S3/R2 evidence upload sequence, and real-time SSE synchronization.

---

## 1. Observation

Based on our analysis of the codebase, we observe the following contract and architectural details:

### 1.1 State and Database Enums
The `AssignmentStatus` enum in `prisma/schema.prisma` (lines 46–57) is defined as:
```prisma
enum AssignmentStatus {
  PENDING_ACCEPTANCE
  ACCEPTED
  DECLINED
  IN_PROGRESS
  SUBMITTED
  UNDER_REVIEW
  REVISION_REQUESTED
  APPROVED
  REJECTED
  CANCELLED
}
```
The parent `Task` has a `taskStatus` which updates atomically via the backend services based on individual volunteer assignment states.

### 1.2 Existing Code Implementation
- **`app/dashboard/volunteer/tasks/page.tsx`**: Currently filters tasks using the global `taskStatus` (e.g. `task.taskStatus === "OPEN"`, `"IN_PROGRESS"`, etc.) in a static layout, rather than grouping them by the current volunteer's personal `AssignmentStatus`.
- **`components/dashboard/VolunteerDashboard.tsx`**: A basic overview dashboard that renders open tasks (excluding `APPROVED`, `SUBMITTED`, `DECLINED`, `CANCELLED` statuses) and lists upcoming event registrations.
- **`components/ui/RightSidePanel.tsx`**: A reusable slide-out panel component utilizing `createPortal` with the following props:
  ```typescript
  interface RightSidePanelProps {
    isOpen: boolean;
    onClose: () => void;
    title?: React.ReactNode;
    children: React.ReactNode;
    width?: string; // defaults to w-full sm:w-[400px] md:w-[500px]
  }
  ```

### 1.3 Server Actions Signatures
From `features/volunteer/actions.ts` and `features/evidences/actions.ts`:
- **Transitions**:
  - `acceptAssignmentAction(taskId: number): Promise<{ success: boolean; data?: any; error?: string }>`
  - `declineAssignmentAction(taskId: number, reason: string): Promise<{ success: boolean; data?: any; error?: string }>`
  - `startAssignmentAction(taskId: number): Promise<{ success: boolean; data?: any; error?: string }>`
  - `submitAssignmentAction(taskId: number, note?: string): Promise<{ success: boolean; data?: any; error?: string }>`
- **Comments**:
  - `addTaskCommentAction(taskId: number, content: string): Promise<{ success: boolean; data?: any; error?: string }>`
  - `getTaskCommentsAction(taskId: number): Promise<{ success: boolean; data?: any; error?: string }>`
- **Evidence/Upload**:
  - `submitEvidenceAction(formData: FormData): Promise<{ success: boolean; data?: any; error?: string }>` (expects `taskId`, `file` as File, and optionally `description`).
  - `getPresignedUploadUrlAction(fileName: string, fileType: string): Promise<{ success: boolean; data?: { uploadUrl: string; fileUrl: string }; error?: string }>`

### 1.4 Real-time SSE Events
From `app/api/realtime/route.ts` (lines 15–41):
- `TASK_COMMENT`: sends `{ type: "TASK_COMMENT", payload: { taskId, comment: { id, content, createdAt, author: { id, name } } } }`
- `ASSIGNMENT_STATUS_CHANGED`: sends `{ type: "ASSIGNMENT_STATUS_CHANGED", payload: { taskId, volunteerId, newStatus } }`

---

## 2. Logic Chain

To decouple the volunteer's personalized dashboard from the global task status and satisfy the user requirements, we formulate the following design logic:

1. **Dashboard Decoupling**: Each task returned by `getVolunteerTasksAction()` contains `assignments`. Since the page is viewed by a specific volunteer, the dashboard component must extract the unique assignment record that matches the current volunteer's ID to determine their personal task status.
2. **Tab Allocation**: The tasks must be grouped into four tabs according to the volunteer's active `AssignmentStatus`.
3. **Optimistic UX**: Modifying assignment states (e.g., accepting, declining, starting) should feel instantaneous. Wrapping the dashboard's task dataset in `useOptimistic` permits rendering state changes instantly on the client side while the Server Action executes in the background.
4. **Interactive Drawer**: Clicking a task card must open the `RightSidePanel`, supplying a context-aware `TaskDetailsDrawer` for transitions, comment stream, and file submission.
5. **Real-time Invalidation**:
   - When a `TASK_COMMENT` event is received, if the comments drawer is currently open for that task, the comment is appended instantly to the local chat state.
   - When an `ASSIGNMENT_STATUS_CHANGED` event for the current volunteer is received, calling `router.refresh()` updates the server state and pushes down the latest database changes.

---

## 3. Tab to Status Mapping

The 4 dashboard tabs group tasks based on the volunteer's individual `AssignmentStatus` as follows:

| Tab Name | Mapped `AssignmentStatus` | Allowed State Transitions (Volunteer Actions) |
|---|---|---|
| **Pendientes** <br>(Pending) | `PENDING_ACCEPTANCE`<br>`ACCEPTED` | • **Accept** (`acceptAssignmentAction`) → transitions to `ACCEPTED`<br>• **Decline** (`declineAssignmentAction` with reason) → transitions to `DECLINED`<br>• **Start** (`startAssignmentAction`) → transitions to `IN_PROGRESS` |
| **En curso** <br>(In Progress) | `IN_PROGRESS`<br>`REVISION_REQUESTED` | • **Submit for Review** (`submitAssignmentAction` or submitting evidence) → transitions to `SUBMITTED` |
| **En revisión** <br>(In Review) | `SUBMITTED`<br>`UNDER_REVIEW` | • *None (Awaiting coordinator review)* |
| **Completadas** <br>(Completed) | `APPROVED` | • *Terminal successful status* |

*Note: Inactive statuses like `DECLINED`, `REJECTED`, and `CANCELLED` are filtered out from the volunteer's active board entirely.*

---

## 4. Architectural Layout and Recommendations

We recommend implementing the frontend workflow using three main pieces:
1. **The Entry Page**: `app/dashboard/volunteer/tasks/page.tsx` (Server Component)
2. **The Board Component**: `components/dashboard/VolunteerTasksDashboard.tsx` (Client Component)
3. **The Drawer Component**: `components/dashboard/TaskDetailsDrawer.tsx` (Client Component)

### 4.1 Entry Page: `app/dashboard/volunteer/tasks/page.tsx`
This server page will retrieve the authenticated user session, lookup the volunteer profile, fetch the relevant tasks, and hand over coordination to the Client component.

```typescript
// Proposed structure for app/dashboard/volunteer/tasks/page.tsx
import { getVolunteerTasksAction } from "@/features/volunteer/actions";
import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import VolunteerTasksDashboard from "@/components/dashboard/VolunteerTasksDashboard";

export default async function VolunteerTasksPage({ searchParams }: { searchParams: { eventId?: string } }) {
  const eventId = searchParams.eventId ? parseInt(searchParams.eventId, 10) : undefined;
  
  // 1. Get authenticated session and check roles
  const session = await requireRole(["VOLUNTEER"]);

  // 2. Fetch the corresponding volunteer ID
  const volunteer = await prisma.volunteer.findUnique({
    where: { userId: session.userId },
  });

  if (!volunteer) {
    return (
      <div className="p-6 text-red-500 font-semibold bg-red-50 border border-red-200 rounded-lg">
        Perfil de voluntario no encontrado. Por favor contacta al administrador.
      </div>
    );
  }

  // 3. Fetch all tasks relevant to registered events
  const result = await getVolunteerTasksAction(eventId);

  if (!result.success || !result.data) {
    return <div className="p-8 text-red-500">Error al cargar tareas: {result.error}</div>;
  }

  return (
    <VolunteerTasksDashboard 
      initialTasks={result.data} 
      currentVolunteerId={volunteer.id} 
      eventId={eventId}
    />
  );
}
```

### 4.2 Board Component: `components/dashboard/VolunteerTasksDashboard.tsx`
Renders the 4 tabs, manages the client-side active tab state, integrates `useOptimistic` for instant tab transitions, and listens to realtime SSE events to revalidate lists.

```typescript
"use client";

import { useState, useOptimistic, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useRealtime } from "@/hooks/useRealtime";
import { RightSidePanel } from "@/components/ui/RightSidePanel";
import TaskDetailsDrawer from "@/components/dashboard/TaskDetailsDrawer";
import { format } from "date-fns";
import { es } from "date-fns/locale";

type TabType = "PENDING" | "IN_PROGRESS" | "IN_REVIEW" | "COMPLETED";

export default function VolunteerTasksDashboard({
  initialTasks,
  currentVolunteerId,
  eventId,
}: {
  initialTasks: any[];
  currentVolunteerId: number;
  eventId?: number;
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("PENDING");
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [isPendingTransition, startTransition] = useTransition();

  // Optimistic UI for assignment statuses
  const [optimisticTasks, setOptimisticTaskStatus] = useOptimistic(
    initialTasks,
    (state, { taskId, newStatus }: { taskId: number; newStatus: any }) => {
      return state.map((task) => {
        if (task.id === taskId) {
          return {
            ...task,
            assignments: task.assignments.map((assignment: any) => {
              if (assignment.volunteerId === currentVolunteerId) {
                return { ...assignment, status: newStatus };
              }
              return assignment;
            }),
          };
        }
        return task;
      });
    }
  );

  // SSE: Invalidate/refresh task list on status change
  useRealtime("ASSIGNMENT_STATUS_CHANGED", (event) => {
    const { volunteerId, taskId } = event.payload;
    if (volunteerId === currentVolunteerId) {
      startTransition(() => {
        router.refresh();
      });
    }
  });

  // Helper to extract current volunteer's assignment
  const getVolunteerAssignment = (task: any) => {
    return task.assignments.find((a: any) => a.volunteerId === currentVolunteerId);
  };

  // Filter tasks based on the active tab and AssignmentStatus
  const filteredTasks = optimisticTasks.filter((task) => {
    const assignment = getVolunteerAssignment(task);
    if (!assignment) return false;

    const status = assignment.status;
    switch (activeTab) {
      case "PENDING":
        return status === "PENDING_ACCEPTANCE" || status === "ACCEPTED";
      case "IN_PROGRESS":
        return status === "IN_PROGRESS" || status === "REVISION_REQUESTED";
      case "IN_REVIEW":
        return status === "SUBMITTED" || status === "UNDER_REVIEW";
      case "COMPLETED":
        return status === "APPROVED";
      default:
        return false;
    }
  });

  const selectedTask = optimisticTasks.find((t) => t.id === selectedTaskId);
  const selectedAssignment = selectedTask ? getVolunteerAssignment(selectedTask) : null;

  return (
    <div className="space-y-6">
      {/* Tab Selectors */}
      <div className="flex border-b border-gray-200 dark:border-gray-800">
        {(["PENDING", "IN_PROGRESS", "IN_REVIEW", "COMPLETED"] as TabType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`py-3 px-6 text-sm font-semibold border-b-2 transition-all ${
              activeTab === tab
                ? "border-brand-verde text-brand-verde"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab === "PENDING" && "Pendientes"}
            {tab === "IN_PROGRESS" && "En curso"}
            {tab === "IN_REVIEW" && "En revisión"}
            {tab === "COMPLETED" && "Completadas"}
          </button>
        ))}
      </div>

      {/* Grid of Task Cards */}
      {filteredTasks.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 dark:bg-gray-900/20 border border-gray-100 rounded-2xl text-gray-400">
          No hay tareas en esta sección.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTasks.map((task) => {
            const assignment = getVolunteerAssignment(task);
            return (
              <div
                key={task.id}
                className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                      task.priority === "HIGH" ? "bg-red-50 text-red-600 dark:bg-red-950/30" : "bg-green-50 text-green-600"
                    }`}>
                      {task.priority}
                    </span>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                      {assignment?.status.replace("_", " ")}
                    </span>
                  </div>
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">{task.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-4">{task.description}</p>
                </div>

                <div className="pt-4 border-t border-gray-50 dark:border-gray-700 flex justify-between items-center">
                  <span className="text-xs text-gray-400">
                    Vence: {task.dueDate ? format(new Date(task.dueDate), "dd MMM yyyy", { locale: es }) : "Sin fecha"}
                  </span>
                  <button
                    onClick={() => setSelectedTaskId(task.id)}
                    className="text-sm font-semibold text-brand-verde hover:underline"
                  >
                    Ver detalles
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Task details Right Panel Portal */}
      <RightSidePanel
        isOpen={selectedTaskId !== null}
        onClose={() => setSelectedTaskId(null)}
        title={selectedTask ? selectedTask.title : ""}
        width="w-full sm:w-[500px] md:w-[600px]"
      >
        {selectedTask && selectedAssignment && (
          <TaskDetailsDrawer
            task={selectedTask}
            assignment={selectedAssignment}
            currentVolunteerId={currentVolunteerId}
            onOptimisticChange={(newStatus) => {
              setOptimisticTaskStatus({ taskId: selectedTask.id, newStatus });
            }}
            onClose={() => setSelectedTaskId(null)}
          />
        )}
      </RightSidePanel>
    </div>
  );
}
```

### 4.3 Details Drawer Component: `components/dashboard/TaskDetailsDrawer.tsx`
Handles individual task metadata display, state actions, S3/R2 upload, and comments thread UI.

```typescript
"use client";

import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useRealtime } from "@/hooks/useRealtime";
import {
  acceptAssignmentAction,
  declineAssignmentAction,
  startAssignmentAction,
  submitAssignmentAction,
  addTaskCommentAction,
  getTaskCommentsAction,
} from "@/features/volunteer/actions";
import {
  getPresignedUploadUrlAction,
  submitEvidenceAction,
} from "@/features/evidences/actions";

export default function TaskDetailsDrawer({
  task,
  assignment,
  currentVolunteerId,
  onOptimisticChange,
  onClose,
}: {
  task: any;
  assignment: any;
  currentVolunteerId: number;
  onOptimisticChange: (newStatus: any) => void;
  onClose: () => void;
}) {
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState("");
  const [declineReason, setDeclineReason] = useState("");
  const [showDeclineInput, setShowDeclineInput] = useState(false);
  
  // Evidence States
  const [uploadProgress, setUploadProgress] = useState(false);
  const [evidenceNote, setEvidenceNote] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const commentsEndRef = useRef<HTMLDivElement>(null);

  // Fetch comments initially
  useEffect(() => {
    async function loadComments() {
      const result = await getTaskCommentsAction(task.id);
      if (result.success && result.data) {
        setComments(result.data);
      }
    }
    loadComments();
  }, [task.id]);

  // Scroll to bottom when comments load/change
  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments]);

  // SSE: Listen for live comments added to this specific task
  useRealtime("TASK_COMMENT", (event) => {
    const { taskId, comment } = event.payload;
    if (taskId === task.id) {
      // Avoid duplicates if the author created the comment
      setComments((prev) => {
        if (prev.some((c) => c.id === comment.id)) return prev;
        return [...prev, comment];
      });
    }
  });

  // Handle Comment Submission
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    const tempText = commentText;
    setCommentText("");

    const result = await addTaskCommentAction(task.id, tempText);
    if (!result.success) {
      setErrorMessage(result.error || "No se pudo añadir el comentario");
      setCommentText(tempText);
    }
  };

  // State Transition Handlers
  const handleAccept = async () => {
    onOptimisticChange("ACCEPTED");
    const res = await acceptAssignmentAction(task.id);
    if (!res.success) setErrorMessage(res.error || "Error al aceptar tarea");
  };

  const handleDecline = async () => {
    if (!declineReason.trim()) {
      setShowDeclineInput(true);
      return;
    }
    onOptimisticChange("DECLINED");
    const res = await declineAssignmentAction(task.id, declineReason);
    if (!res.success) {
      setErrorMessage(res.error || "Error al rechazar tarea");
    } else {
      onClose();
    }
  };

  const handleStart = async () => {
    onOptimisticChange("IN_PROGRESS");
    const res = await startAssignmentAction(task.id);
    if (!res.success) setErrorMessage(res.error || "Error al comenzar tarea");
  };

  // S3/R2 Drag and Drop Upload Sequence
  const handleDropUpload = async (e: React.DragEvent<HTMLDivElement> | React.ChangeEvent<HTMLInputElement>) => {
    let file: File | null = null;
    if ("dataTransfer" in e) {
      e.preventDefault();
      file = e.dataTransfer.files?.[0] || null;
    } else {
      file = e.target.files?.[0] || null;
    }

    if (!file) return;

    setUploadProgress(true);
    setErrorMessage("");

    try {
      // 1. Get presigned upload URL from server
      const presignedResult = await getPresignedUploadUrlAction(file.name, file.type);
      if (!presignedResult.success || !presignedResult.data) {
        throw new Error(presignedResult.error || "Error al obtener URL firmada");
      }

      const { uploadUrl, fileUrl } = presignedResult.data;

      // 2. Upload file directly to S3/R2 via PUT request
      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error("Error en la subida al almacenamiento S3/R2");
      }

      // 3. Link uploaded evidence metadata to Database using submitEvidenceAction
      // We wrap the files inside a FormData object to align with submitEvidenceAction schema
      const formData = new FormData();
      formData.append("taskId", task.id.toString());
      formData.append("file", file);
      formData.append("description", evidenceNote);

      onOptimisticChange("SUBMITTED");

      const dbLinkResult = await submitEvidenceAction(formData);
      if (!dbLinkResult.success) {
        throw new Error(dbLinkResult.error || "Error al registrar la evidencia en base de datos");
      }

    } catch (err: any) {
      setErrorMessage(err.message || "Error en el flujo de evidencia");
      onOptimisticChange(assignment.status); // revert optimistic UI
    } finally {
      setUploadProgress(false);
    }
  };

  return (
    <div className="p-6 space-y-6 flex flex-col h-full justify-between">
      {/* 1. Metadata details */}
      <div className="space-y-4">
        <div>
          <span className="text-xs uppercase tracking-wider font-bold text-gray-400">Evento</span>
          <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200">{task.event.title}</h4>
        </div>

        {task.description && (
          <div>
            <span className="text-xs uppercase tracking-wider font-bold text-gray-400">Descripción</span>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{task.description}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-xs uppercase tracking-wider font-bold text-gray-400">Vence</span>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
              {task.dueDate ? format(new Date(task.dueDate), "dd MMM yyyy", { locale: es }) : "Sin fecha"}
            </p>
          </div>
          <div>
            <span className="text-xs uppercase tracking-wider font-bold text-gray-400">Prioridad</span>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{task.priority}</p>
          </div>
        </div>

        {errorMessage && (
          <div className="p-3 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg">
            {errorMessage}
          </div>
        )}

        {/* State Transition Actions */}
        <div className="pt-4 border-t border-gray-100 dark:border-gray-800 space-y-3">
          {assignment.status === "PENDING_ACCEPTANCE" && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <button
                  onClick={handleAccept}
                  className="flex-1 bg-brand-verde hover:bg-brand-verde-oscuro text-white py-2 rounded-xl text-sm font-bold transition"
                >
                  Aceptar Tarea
                </button>
                <button
                  onClick={() => setShowDeclineInput(true)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-200 py-2 rounded-xl text-sm font-bold transition"
                >
                  Rechazar
                </button>
              </div>

              {showDeclineInput && (
                <div className="space-y-2 animate-in slide-in-from-top duration-200">
                  <textarea
                    placeholder="Escribe la razón para rechazar..."
                    value={declineReason}
                    onChange={(e) => setDeclineReason(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-gray-300 dark:bg-gray-800 dark:border-gray-700 focus:ring-1 focus:ring-brand-verde"
                    rows={2}
                  />
                  <button
                    onClick={handleDecline}
                    className="w-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-2 rounded-lg"
                  >
                    Confirmar Rechazo
                  </button>
                </div>
              )}
            </div>
          )}

          {assignment.status === "ACCEPTED" && (
            <button
              onClick={handleStart}
              className="w-full bg-brand-verde hover:bg-brand-verde-oscuro text-white py-2 rounded-xl text-sm font-bold transition"
            >
              Comenzar Tarea
            </button>
          )}

          {/* S3/R2 Drag-and-Drop Evidence Dropzone */}
          {(assignment.status === "IN_PROGRESS" || assignment.status === "REVISION_REQUESTED") && (
            <div className="space-y-4">
              <span className="text-xs uppercase tracking-wider font-bold text-gray-400 block">Subir Evidencia</span>
              
              <textarea
                placeholder="Nota o descripción de la entrega (opcional)..."
                value={evidenceNote}
                onChange={(e) => setEvidenceNote(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-gray-300 dark:bg-gray-800 dark:border-gray-700 focus:ring-1 focus:ring-brand-verde"
                rows={2}
              />

              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDropUpload}
                className="border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-brand-verde/50 rounded-2xl p-6 text-center cursor-pointer transition-colors"
              >
                <input
                  type="file"
                  id="evidence-file-input"
                  onChange={handleDropUpload}
                  className="hidden"
                />
                <label htmlFor="evidence-file-input" className="cursor-pointer space-y-2 block">
                  <svg className="w-8 h-8 text-gray-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                    {uploadProgress ? "Subiendo archivo..." : "Arrastra un archivo aquí o haz clic para subir"}
                  </p>
                  <p className="text-[10px] text-gray-400">Imágenes, PDF, Documentos Word (Máx 10MB)</p>
                </label>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. Chat comments thread UI */}
      <div className="pt-6 border-t border-gray-100 dark:border-gray-800 flex flex-col flex-1 min-h-[250px] max-h-[350px] overflow-hidden justify-between">
        <h5 className="text-xs uppercase tracking-wider font-bold text-gray-400 mb-3">Hilo de Comentarios</h5>
        
        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-2 scrollbar-thin">
          {comments.length === 0 ? (
            <p className="text-xs text-center text-gray-400 py-6">No hay comentarios en esta tarea aún.</p>
          ) : (
            comments.map((comment) => {
              const isOwnComment = comment.author.id === currentVolunteerId; // Adjust check logic if needed
              return (
                <div
                  key={comment.id}
                  className={`flex flex-col max-w-[85%] rounded-2xl p-3 ${
                    isOwnComment
                      ? "bg-brand-verde/10 text-brand-verde-oscuro ml-auto rounded-tr-none"
                      : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100 rounded-tl-none"
                  }`}
                >
                  <span className="text-[9px] font-bold opacity-60">
                    {comment.author.name} • {format(new Date(comment.createdAt), "HH:mm")}
                  </span>
                  <p className="text-xs mt-1 leading-relaxed">{comment.content}</p>
                </div>
              );
            })
          )}
          <div ref={commentsEndRef} />
        </div>

        {/* Input Form */}
        <form onSubmit={handleAddComment} className="flex gap-2">
          <input
            type="text"
            placeholder="Escribe un comentario..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            className="flex-1 text-xs p-2.5 rounded-xl border border-gray-300 dark:bg-gray-800 dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-brand-verde"
          />
          <button
            type="submit"
            className="bg-brand-verde hover:bg-brand-verde-oscuro text-white px-4 py-2 rounded-xl text-xs font-bold transition shrink-0"
          >
            Enviar
          </button>
        </form>
      </div>
    </div>
  );
}
```

---

## 5. Caveats and Assumptions

- **MIME Type Validation**: `getPresignedUploadUrlAction` restricts uploads to an explicit whitelist of MIME types. The client-side drag-and-drop area should check the file's MIME type before triggering S3 upload to prevent unneeded backend failures.
- **Server Action File Handling**: `submitEvidenceAction` requires a raw `File` in the `FormData` to fulfill its domain validations. Even when using S3/R2 direct client uploading, a form data instance containing the file metadata/payload must be sent so the backend can verify and populate the database correctly.
- **Offline / Reconnection**: EventSource handles reconnections automatically, but events broadcast during disconnected periods are lost. The initialization fetches state updates (`getTaskCommentsAction` and page refetches) to recover consistency.

---

## 6. Verification Method

To verify the implementation of the dashboard, transition flows, and real-time event broadcasting:

1. **Verify Layout Compliance**:
   - Confirm components are in `/components/dashboard/` and pages in `/app/dashboard/volunteer/tasks/`.
   - Ensure no source code files reside in the `.agents/` folder.

2. **Execute E2E Integration Suite**:
   Run the project's native E2E suite:
   ```bash
   npx tsx tests/e2e/run.ts
   ```
   Ensure all tests (especially Tier 1 transitions, Tier 3 event combinations, and Tier 4 real-time SSE workflows) complete with exit code `0`.
