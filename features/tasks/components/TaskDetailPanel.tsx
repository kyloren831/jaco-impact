"use client";

import { useEffect, useState, useCallback } from "react";
import { RightSidePanel } from "@/components/ui/RightSidePanel";
import { EditableField } from "@/components/ui/EditableField";
import { assignVolunteerAction, removeVolunteerAction, updateTaskDetailsAction } from "@/features/tasks/actions";
import { TASK_STATUSES } from "@/features/events/components/EventDetailPanel";

interface TaskDetailPanelProps {
  task: any | null;
  isOpen: boolean;
  onClose: () => void;
  volunteers: any[]; // Lista completa de voluntarios para asignar
  onTaskUpdated: () => void; // Para recargar tareas en el padre
}

export function TaskDetailPanel({ task, isOpen, onClose, volunteers, onTaskUpdated }: TaskDetailPanelProps) {
  const [isAssigning, setIsAssigning] = useState(false);
  const [selectedVolunteerId, setSelectedVolunteerId] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setIsAssigning(false);
      setSelectedVolunteerId("");
    }
  }, [isOpen]);

  const handleAssign = async () => {
    if (!task || !selectedVolunteerId) return;
    const res = await assignVolunteerAction(task.id, parseInt(selectedVolunteerId));
    if (res.success) {
      setIsAssigning(false);
      setSelectedVolunteerId("");
      onTaskUpdated();
    } else {
      alert("Error al asignar voluntario: " + res.error);
    }
  };

  const handleRemove = async (volunteerId: number) => {
    if (!task) return;
    if (confirm("¿Estás seguro de quitar a este voluntario de la tarea?")) {
      const res = await removeVolunteerAction(task.id, volunteerId);
      if (res.success) {
        onTaskUpdated();
      } else {
        alert("Error al quitar voluntario: " + res.error);
      }
    }
  };

  if (!task) return null;

  const taskStatusInfo = TASK_STATUSES.find((s) => s.id === task.taskStatus) || TASK_STATUSES[0];
  const priorityColor = task.priority === "HIGH" ? "text-red-600 bg-red-50 border-red-100" : task.priority === "MEDIUM" ? "text-yellow-700 bg-yellow-50 border-yellow-100" : "text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700";
  
  // Assigned volunteers from task object
  const assignedVolunteers = task.assignedTo?.map((assignment: any) => assignment.volunteer) || [];
  const assignedIds = assignedVolunteers.map((v: any) => v.id);
  const availableVolunteers = volunteers.filter(v => !assignedIds.includes(v.id));

  return (
    <RightSidePanel
      isOpen={isOpen}
      onClose={onClose}
      title={<span className="text-gray-500 dark:text-gray-400 text-sm font-body font-medium uppercase tracking-wider">Detalles de Tarea</span>}
      width="w-full sm:w-[400px] md:w-[450px]"
    >
      <div className="flex flex-col h-full animate-[fadeIn_0.5s_ease-out]">
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1 min-w-0 mr-4">
              <EditableField
                value={task.title || ""}
                onSave={async (newTitle) => {
                  const res = await updateTaskDetailsAction(task.id, { title: newTitle });
                  if (!res.success) {
                    alert("Error al actualizar: " + res.error);
                    throw new Error(res.error);
                  }
                  onTaskUpdated();
                }}
                placeholder="Tarea sin título"
                required
                as="h1"
                className="font-headline text-2xl font-black text-gray-900 dark:text-white leading-tight"
              />
            </div>
            <span 
              className="px-3 py-1 rounded-full text-xs font-bold border shrink-0 ml-4"
              style={{
                backgroundColor: `${taskStatusInfo.color}15`,
                borderColor: `${taskStatusInfo.color}40`,
                color: taskStatusInfo.color,
              }}
            >
              {taskStatusInfo.label}
            </span>
          </div>

          <div className="flex items-center gap-2 mt-3">
            <span className={`text-[10px] font-bold px-2 py-1 rounded border ${priorityColor}`}>
              PRIORIDAD {task.priority === "HIGH" ? "ALTA" : task.priority === "MEDIUM" ? "MEDIA" : "BAJA"}
            </span>
            {task.dueDate && (
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded border border-gray-200 dark:border-gray-700">
                Vence: {new Date(task.dueDate).toLocaleDateString()}
              </span>
            )}
          </div>

          <div className="mt-6">
            <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Descripción</h3>
            <EditableField
              value={task.description || ""}
              onSave={async (newDesc) => {
                const res = await updateTaskDetailsAction(task.id, { description: newDesc || null });
                if (!res.success) {
                  alert("Error al actualizar: " + res.error);
                  throw new Error(res.error);
                }
                onTaskUpdated();
              }}
              placeholder="Añadir una descripción..."
              multiline
              as="p"
              className="font-body text-gray-700 dark:text-gray-300 whitespace-pre-wrap text-sm leading-relaxed"
            />
          </div>
        </div>

        <div className="p-6 bg-gray-50 dark:bg-gray-900/50 flex-1">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-headline text-lg font-bold text-gray-900 dark:text-white">Voluntarios Asignados</h2>
            {!isAssigning && (
              <button 
                onClick={() => setIsAssigning(true)}
                className="text-sm font-bold text-blue-600 hover:text-blue-800"
              >
                + Añadir
              </button>
            )}
          </div>

          {isAssigning && (
            <div className="mb-4 bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-2">
              <select
                value={selectedVolunteerId}
                onChange={(e) => setSelectedVolunteerId(e.target.value)}
                className="flex-1 text-sm border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-white rounded-md py-1.5 px-2 focus:ring-blue-500"
              >
                <option value="">Seleccionar voluntario...</option>
                {availableVolunteers.map((v) => (
                  <option key={v.id} value={v.id}>{v.user?.name || "Sin nombre"}</option>
                ))}
              </select>
              <button 
                onClick={handleAssign}
                disabled={!selectedVolunteerId}
                className="px-3 py-1.5 bg-blue-600 disabled:bg-blue-300 text-white rounded text-xs font-bold"
              >
                Asignar
              </button>
              <button 
                onClick={() => setIsAssigning(false)}
                className="px-2 py-1.5 text-gray-400 hover:text-gray-600 text-xs font-bold"
              >
                Cancelar
              </button>
            </div>
          )}

          <div className="space-y-2">
            {assignedVolunteers.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 italic">No hay voluntarios asignados a esta tarea.</p>
            ) : (
              assignedVolunteers.map((vol: any) => {
                const initials = vol.user?.name ? vol.user.name.substring(0, 2).toUpperCase() : "VO";
                return (
                  <div key={vol.id} className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {vol.user?.imageUrl ? (
                        <img src={vol.user.imageUrl} alt={vol.user.name} className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 flex items-center justify-center text-xs font-bold">
                          {initials}
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{vol.user?.name || "Voluntario"}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{vol.user?.email}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleRemove(vol.id)}
                      className="text-red-500 hover:text-red-700 p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                      title="Quitar asignación"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </RightSidePanel>
  );
}
