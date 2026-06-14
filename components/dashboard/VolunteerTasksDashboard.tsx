"use client";

import { useState, useOptimistic, useTransition, startTransition } from "react";
import { useRouter } from "next/navigation";
import { useRealtime } from "@/hooks/useRealtime";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";

import {
  acceptAssignmentAction,
  declineAssignmentAction,
  startAssignmentAction,
  submitAssignmentAction,
} from "@/features/volunteer/actions";
import {
  submitEvidenceAction,
} from "@/features/evidences/actions";

import TaskDetailsDrawer from "./TaskDetailsDrawer";

interface VolunteerTasksDashboardProps {
  tasks: any[];
  volunteerId: number;
  userId: number;
  userName: string;
  selectedEventId?: number;
}

type TabType = "PENDING" | "IN_PROGRESS" | "IN_REVIEW" | "COMPLETED";

export default function VolunteerTasksDashboard({
  tasks,
  volunteerId,
  userId,
  userName,
  selectedEventId,
}: VolunteerTasksDashboardProps) {
  const router = useRouter();
  const [isPending, startUpdateTransition] = useTransition();

  // Optimistic updates for tasks and assignment status
  const [optimisticTasks, setOptimisticTaskStatus] = useOptimistic(
    tasks,
    (state, update: { taskId: number; newStatus: string }) => {
      return state.map((task) => {
        if (task.id === update.taskId) {
          const updatedAssignments = task.assignments.map((asg: any) => {
            if (asg.volunteerId === volunteerId) {
              return { ...asg, status: update.newStatus };
            }
            return asg;
          });
          return { ...task, assignments: updatedAssignments };
        }
        return task;
      });
    }
  );

  const [activeTab, setActiveTab] = useState<TabType>("PENDING");
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);

  // Real-time update: assignment status updated by coordinator
  useRealtime("ASSIGNMENT_STATUS_CHANGED", (event) => {
    if (event.payload?.volunteerId === volunteerId) {
      router.refresh();
    }
  });

  const getMyAssignmentForTask = (task: any) => {
    return task.assignments?.find((a: any) => a.volunteerId === volunteerId);
  };

  const getFilteredTasks = () => {
    return optimisticTasks.filter((task) => {
      const asg = getMyAssignmentForTask(task);
      if (!asg) return false;

      switch (activeTab) {
        case "PENDING":
          return asg.status === "PENDING_ACCEPTANCE" || asg.status === "ACCEPTED";
        case "IN_PROGRESS":
          return asg.status === "IN_PROGRESS" || asg.status === "REVISION_REQUESTED";
        case "IN_REVIEW":
          return asg.status === "SUBMITTED" || asg.status === "UNDER_REVIEW";
        case "COMPLETED":
          return asg.status === "APPROVED";
        default:
          return false;
      }
    });
  };

  const handleDrawerAction = async (
    action: "ACCEPT" | "DECLINE" | "START" | "SUBMIT" | "SUBMIT_WITH_FILE",
    payload?: any
  ) => {
    return new Promise<void>((resolve, reject) => {
      startUpdateTransition(async () => {
        let newStatus = "";
        if (action === "ACCEPT") newStatus = "ACCEPTED";
        else if (action === "DECLINE") newStatus = "DECLINED";
        else if (action === "START") newStatus = "IN_PROGRESS";
        else if (action === "SUBMIT" || action === "SUBMIT_WITH_FILE") newStatus = "SUBMITTED";

        if (newStatus && selectedTaskId) {
          setOptimisticTaskStatus({ taskId: selectedTaskId, newStatus });
        }

        try {
          let result;
          if (action === "ACCEPT") {
            result = await acceptAssignmentAction(selectedTaskId!);
          } else if (action === "DECLINE") {
            result = await declineAssignmentAction(selectedTaskId!, payload.reason);
          } else if (action === "START") {
            result = await startAssignmentAction(selectedTaskId!);
          } else if (action === "SUBMIT") {
            result = await submitAssignmentAction(selectedTaskId!, payload.note);
          } else if (action === "SUBMIT_WITH_FILE") {
            const { file, note } = payload;

            // Submit evidence
            const formData = new FormData();
            formData.append("taskId", selectedTaskId!.toString());
            formData.append("file", file);
            if (note) {
              formData.append("description", note);
            }

            result = await submitEvidenceAction(formData);
          }

          if (result && !result.success) {
            throw new Error(result.error || "Error al realizar la acción");
          }

          router.refresh();
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    });
  };

  const filteredTasks = getFilteredTasks();
  const selectedTask = optimisticTasks.find((t) => t.id === selectedTaskId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Tablero de Tareas</h1>
          <p className="text-gray-600 dark:text-gray-400">
            {selectedEventId
              ? "Tareas del evento seleccionado"
              : "Todas las tareas de los eventos en los que estás inscrito"}
          </p>
        </div>
        {selectedEventId && (
          <Link
            href="/dashboard/volunteer/tasks"
            className="text-sm px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            Ver de todos mis eventos
          </Link>
        )}
      </div>

      {/* Tabs Layout */}
      <div className="border-b border-gray-200 dark:border-gray-800">
        <nav className="flex space-x-8" aria-label="Tabs">
          {(
            [
              { id: "PENDING", label: "Pendientes" },
              { id: "IN_PROGRESS", label: "En curso" },
              { id: "IN_REVIEW", label: "En revisión" },
              { id: "COMPLETED", label: "Completadas" },
            ] as const
          ).map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-150 cursor-pointer
                  ${
                    active
                      ? "border-brand-verde text-brand-verde"
                      : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300"
                  }
                `}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Task List / Grid */}
      {filteredTasks.length === 0 ? (
        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-8 border border-gray-200 dark:border-gray-800 text-center text-gray-500">
          No tienes tareas en esta sección.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTasks.map((task) => {
            const assignment = getMyAssignmentForTask(task);
            const priorityColor =
              task.priority === "HIGH"
                ? "text-red-600 bg-red-100 dark:bg-red-950/30 dark:text-red-400"
                : task.priority === "MEDIUM"
                ? "text-yellow-600 bg-yellow-100 dark:bg-yellow-950/30 dark:text-yellow-400"
                : "text-green-600 bg-green-100 dark:bg-green-950/30 dark:text-green-400";

            return (
              <div
                key={task.id}
                className="bg-white dark:bg-gray-850 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between"
              >
                <div className="absolute top-0 left-0 w-1.5 h-full bg-brand-verde"></div>
                <div>
                  <div className="flex justify-between items-start mb-3 pl-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${priorityColor}`}
                    >
                      {task.priority}
                    </span>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full truncate max-w-[150px]">
                      {task.event.name || task.event.title}
                    </span>
                  </div>
                  <h3 className="font-bold text-gray-900 dark:text-white mb-2 pl-2">
                    {task.title}
                  </h3>
                  {task.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 pl-2 line-clamp-2 mb-4">
                      {task.description}
                    </p>
                  )}
                </div>

                <div className="pl-2 pt-3 border-t border-gray-50 dark:border-gray-850 flex items-center justify-between mt-auto">
                  <span className="text-xs text-gray-400 font-medium">
                    Vence:{" "}
                    {task.dueDate
                      ? format(new Date(task.dueDate), "dd MMM, yyyy", { locale: es })
                      : "Sin fecha"}
                  </span>
                  <button
                    onClick={() => setSelectedTaskId(task.id)}
                    className="text-xs font-bold text-brand-verde hover:underline cursor-pointer"
                  >
                    Ver detalles
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Drawer */}
      {selectedTaskId !== null && selectedTask && (
        <TaskDetailsDrawer
          taskId={selectedTaskId}
          volunteerId={volunteerId}
          userId={userId}
          userName={userName}
          onClose={() => setSelectedTaskId(null)}
          onAction={handleDrawerAction}
          task={selectedTask}
        />
      )}
    </div>
  );
}
