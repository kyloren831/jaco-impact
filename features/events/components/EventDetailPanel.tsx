"use client";

import { useEffect, useState, useCallback } from "react";
import { RightSidePanel } from "@/components/ui/RightSidePanel";
import { EditableField } from "@/components/ui/EditableField";
import { getTasksByEvent, createTaskAction, updateTaskStatusAction } from "@/features/tasks/actions";
import { getAllVolunteersAction } from "@/features/tasks/actions";
import { updateEventDetailsAction } from "@/features/events/actions";
import { getEventVolunteersAction } from "@/features/participation/actions";
import { EVENT_STATUSES } from "./EventsClientView";
import { TaskDetailPanel } from "@/features/tasks/components/TaskDetailPanel";

export const TASK_STATUSES = [
  { id: "OPEN", label: "Abierta", color: "#3B82F6" },
  { id: "IN_PROGRESS", label: "En progreso", color: "#F59E0B" },
  { id: "IN_REVIEW", label: "En revisión", color: "#8B5CF6" },
  { id: "COMPLETED", label: "Completada", color: "#10B981" },
  { id: "CANCELLED", label: "Cancelada", color: "#EF4444" },
];

interface EventDetailPanelProps {
  event: any;
  isOpen: boolean;
  onClose: () => void;
  onEventUpdated?: () => void;
}

export function EventDetailPanel({ event, isOpen, onClose, onEventUpdated }: EventDetailPanelProps) {
  const [tasks, setTasks] = useState<any[]>([]);
  const [volunteers, setVolunteers] = useState<any[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [activeTaskDropdown, setActiveTaskDropdown] = useState<number | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  
  // Para el formulario de crear tarea
  const [selectedVolunteerIds, setSelectedVolunteerIds] = useState<number[]>([]);

  const fetchTasksAndVolunteers = useCallback(async () => {
    if (!event?.id) return;
    setLoadingTasks(true);
    const [tasksRes, volRes] = await Promise.all([
      getTasksByEvent(event.id),
      getEventVolunteersAction(event.id)
    ]);
    
    if (tasksRes.success && tasksRes.data) {
      setTasks(tasksRes.data);
    }
    if (volRes.success && volRes.data) {
      setVolunteers(volRes.data.map((p: any) => p.volunteer));
    }
    
    setLoadingTasks(false);
  }, [event?.id]);

  useEffect(() => {
    if (isOpen && event) {
      fetchTasksAndVolunteers();
      setIsCreatingTask(false);
      setActiveTaskDropdown(null);
      setSelectedTaskId(null);
    }
  }, [isOpen, event, fetchTasksAndVolunteers]);

  const handleCreateTask = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!event) return;
    
    const formData = new FormData(e.currentTarget);
    formData.append('volunteerIds', JSON.stringify(selectedVolunteerIds));
    const res = await createTaskAction(formData, event.id);
    
    if (res.success) {
      setIsCreatingTask(false);
      setSelectedVolunteerIds([]);
      fetchTasksAndVolunteers();
    } else {
      alert("Error al crear tarea: " + res.error);
    }
  };

  const handleStatusChange = async (taskId: number, newStatus: string) => {
    setActiveTaskDropdown(null);
    
    const originalTasks = [...tasks];
    setTasks(tasks.map(t => t.id === taskId ? { ...t, taskStatus: newStatus } : t));
    
    const res = await updateTaskStatusAction(taskId, newStatus);
    if (!res.success) {
      setTasks(originalTasks);
      alert("Error al actualizar tarea: " + res.error);
    }
  };

  if (!event) return null;

  const eventStatusInfo = EVENT_STATUSES.find((s) => s.id === event.status) || EVENT_STATUSES[0];

  return (
    <RightSidePanel
      isOpen={isOpen}
      onClose={onClose}
      title={<span className="text-gray-500 text-sm font-body font-medium uppercase tracking-wider">Detalles del Evento</span>}
      width="w-full sm:w-[450px] md:w-[600px]"
    >
      <div className="flex flex-col h-full animate-[fadeIn_0.5s_ease-out]">
        {/* Event Header Info */}
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1 min-w-0 mr-4">
              <EditableField
                value={event.name || ""}
                onSave={async (newName) => {
                  const res = await updateEventDetailsAction(event.id, { name: newName });
                  if (!res.success) {
                    alert("Error al actualizar: " + res.error);
                    throw new Error(res.error);
                  }
                  onEventUpdated?.();
                }}
                placeholder="Evento sin título"
                required
                as="h1"
                className="font-headline text-3xl font-black text-gray-900 dark:text-white leading-tight"
              />
            </div>
            <span 
              className="px-3 py-1 rounded-full text-xs font-bold border shrink-0 ml-4"
              style={{
                backgroundColor: `${eventStatusInfo.color}15`,
                borderColor: `${eventStatusInfo.color}40`,
                color: eventStatusInfo.color,
              }}
            >
              {eventStatusInfo.label}
            </span>
          </div>
          
          <div className="flex flex-wrap gap-y-2 gap-x-6 mt-4 text-sm font-body text-gray-600 dark:text-gray-300">
            {event.eventDate && (
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="font-medium">{new Date(event.eventDate).toLocaleDateString('es-CR', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
              </div>
            )}
            {event.location && (
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.242-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="font-medium">{event.location}</span>
              </div>
            )}
            {event.project && (
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                <span className="font-medium text-blue-600">{event.project.name}</span>
              </div>
            )}
          </div>

          <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
            <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Descripción</h3>
            <EditableField
              value={event.description || ""}
              onSave={async (newDesc) => {
                const res = await updateEventDetailsAction(event.id, { description: newDesc || null });
                if (!res.success) {
                  alert("Error al actualizar: " + res.error);
                  throw new Error(res.error);
                }
                onEventUpdated?.();
              }}
              placeholder="Añadir una descripción..."
              multiline
              as="p"
              className="font-body text-gray-700 dark:text-gray-300 whitespace-pre-wrap text-sm leading-relaxed"
            />
          </div>
        </div>

        {/* Tasks Section (Jira Style) */}
        <div className="p-6 bg-gray-50 dark:bg-gray-900/50 flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-headline text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <svg className="w-5 h-5 text-brand-verde" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              Tareas del evento
            </h2>
            {!isCreatingTask && (
              <button
                onClick={() => setIsCreatingTask(true)}
                className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 rounded-md text-sm font-bold text-gray-700 dark:text-gray-300 transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Crear Tarea
              </button>
            )}
          </div>

          {/* Create Task Inline Form */}
          {isCreatingTask && (
            <form onSubmit={handleCreateTask} className="mb-6 bg-white dark:bg-gray-800 p-4 rounded-xl border border-blue-200 dark:border-blue-900/50 shadow-[0_4px_12px_-4px_rgba(0,0,0,0.1)]">
              <div className="mb-3">
                <input
                  type="text"
                  name="title"
                  placeholder="¿Qué se necesita hacer?"
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-body text-sm bg-transparent dark:text-white"
                  autoFocus
                  required
                />
              </div>
              <div className="mb-3">
                <textarea
                  name="description"
                  placeholder="Añadir una descripción más detallada..."
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-body text-sm min-h-[60px] bg-transparent dark:text-white"
                ></textarea>
              </div>
              
              <div className="mb-4 bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">Asignar Voluntarios (Opcional)</label>
                <div className="max-h-32 overflow-y-auto space-y-1 scrollbar-thin">
                  {volunteers.map(vol => (
                    <label key={vol.id} className="flex items-center gap-2 p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        checked={selectedVolunteerIds.includes(vol.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedVolunteerIds([...selectedVolunteerIds, vol.id]);
                          } else {
                            setSelectedVolunteerIds(selectedVolunteerIds.filter(id => id !== vol.id));
                          }
                        }}
                      />
                      <div className="flex items-center gap-2">
                        {vol.user?.imageUrl ? (
                          <img src={vol.user.imageUrl} alt="" className="w-5 h-5 rounded-full object-cover" />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[9px] font-bold">
                            {vol.user?.name?.substring(0, 2).toUpperCase() || "VO"}
                          </div>
                        )}
                        <span className="text-xs text-gray-700 dark:text-gray-300">{vol.user?.name}</span>
                      </div>
                    </label>
                  ))}
                  {volunteers.length === 0 && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 italic">No hay voluntarios disponibles.</p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <select name="priority" className="text-xs border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-white rounded-md py-1.5 pl-2 pr-8 focus:ring-blue-500">
                  <option value="MEDIUM">Prioridad Media</option>
                  <option value="HIGH">Prioridad Alta</option>
                  <option value="LOW">Prioridad Baja</option>
                </select>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCreatingTask(false)}
                    className="px-3 py-1.5 text-xs font-bold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-bold shadow-sm transition-colors"
                  >
                    Guardar
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Tasks List */}
          <div className="flex flex-col gap-2">
            {loadingTasks ? (
              <div className="py-8 text-center">
                <div className="inline-block w-6 h-6 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
                <p className="mt-2 text-xs text-gray-500 font-medium">Cargando tareas...</p>
              </div>
            ) : tasks.length === 0 && !isCreatingTask ? (
              <div className="text-center py-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 border-dashed rounded-xl">
                <svg className="w-10 h-10 text-gray-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                <p className="font-body text-sm font-medium text-gray-500 dark:text-gray-400">Aún no hay tareas</p>
                <button 
                  onClick={() => setIsCreatingTask(true)}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-bold"
                >
                  Crea la primera tarea
                </button>
              </div>
            ) : (
              tasks.map((task) => {
                const taskStatusInfo = TASK_STATUSES.find(s => s.id === task.taskStatus) || TASK_STATUSES[0];
                const priorityColor = task.priority === "HIGH" ? "text-red-600 bg-red-50 border-red-100" : task.priority === "MEDIUM" ? "text-yellow-700 bg-yellow-50 border-yellow-100" : "text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700";
                
                const assignedVolunteers = task.assignedTo?.map((a: any) => a.volunteer) || [];
                const displayVolunteers = assignedVolunteers.slice(0, 2);
                const extraCount = assignedVolunteers.length - 2;

                return (
                  <div key={task.id} className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-500 shadow-sm transition-all flex items-start gap-3 group cursor-pointer" onClick={() => setSelectedTaskId(task.id)}>
                    <div className="mt-1" onClick={(e) => e.stopPropagation()}>
                      <svg className={`w-5 h-5 ${task.taskStatus === 'COMPLETED' ? 'text-green-500' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                        {task.taskStatus === 'COMPLETED' ? (
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        ) : (
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                        )}
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0 flex justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <p className={`font-headline text-sm font-bold truncate ${task.taskStatus === 'COMPLETED' ? 'line-through text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                          {task.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${priorityColor} shrink-0`}>
                            {task.priority === "HIGH" ? "ALTA" : task.priority === "MEDIUM" ? "MEDIA" : "BAJA"}
                          </span>
                          {task.description && (
                            <span className="text-xs text-gray-400 truncate" title={task.description}>
                              {task.description}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        {/* Status Dropdown */}
                        <div className="relative" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setActiveTaskDropdown(activeTaskDropdown === task.id ? null : task.id)}
                            className="flex items-center justify-between min-w-[100px] px-2 py-1 rounded border hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-xs font-bold"
                            style={{ color: taskStatusInfo.color, borderColor: `${taskStatusInfo.color}40`, backgroundColor: `${taskStatusInfo.color}10` }}
                          >
                            <span className="truncate mr-1">{taskStatusInfo.label}</span>
                            <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>

                          {activeTaskDropdown === task.id && (
                            <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-100 dark:border-gray-700 z-20 py-1">
                              {TASK_STATUSES.map(s => (
                                <button
                                  key={s.id}
                                  onClick={() => handleStatusChange(task.id, s.id)}
                                  className="w-full text-left px-3 py-1.5 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                                >
                                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }}></span>
                                  {s.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        {/* Assigned Volunteers */}
                        <div className="flex items-center gap-1 mt-1">
                          {assignedVolunteers.length > 0 ? (
                            <>
                              <div className="flex -space-x-1.5">
                                {displayVolunteers.map((vol: any) => (
                                  <div key={vol.id} className="w-6 h-6 rounded-full border-2 border-white dark:border-gray-800 bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center overflow-hidden shrink-0" title={vol.user?.name}>
                                    {vol.user?.imageUrl ? (
                                      <img src={vol.user.imageUrl} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                      <span className="text-[9px] font-bold text-blue-700">{vol.user?.name?.substring(0,2).toUpperCase() || "VO"}</span>
                                    )}
                                  </div>
                                ))}
                              </div>
                              {extraCount > 0 && (
                                <div className="w-6 h-6 rounded-full border-2 border-white dark:border-gray-800 bg-gray-100 dark:bg-gray-700 flex items-center justify-center shrink-0">
                                  <span className="text-[9px] font-bold text-gray-600 dark:text-gray-300">+{extraCount}</span>
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="w-6 h-6 rounded-full border border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:border-gray-400 hover:text-gray-500 transition-colors" title="Asignar voluntario">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Task Detail Panel Overlay */}
      <TaskDetailPanel
        task={tasks.find(t => t.id === selectedTaskId) || null}
        isOpen={!!selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
        volunteers={volunteers}
        onTaskUpdated={fetchTasksAndVolunteers}
      />
    </RightSidePanel>
  );
}
