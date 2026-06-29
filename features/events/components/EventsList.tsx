"use client";

import { useState } from "react";
import { updateEventStatusAction } from "../actions";
import { EVENT_STATUSES } from "./EventsClientView";

interface EventsListProps {
  events: any[];
  project: any | null;
  onUpdateEvents: (events: any[]) => void;
  onEventClick?: (eventId: number) => void;
}

export function EventsList({ events, project, onUpdateEvents, onEventClick }: EventsListProps) {
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
  const [isUpdating, setIsUpdating] = useState<number | null>(null);

  const handleChangeStatus = async (eventId: number, newStatus: string) => {
    if (isUpdating === eventId) return;
    setIsUpdating(eventId);
    setActiveDropdown(null);

    const eventToUpdate = events.find((ev) => ev.id === eventId);
    if (!eventToUpdate || eventToUpdate.status === newStatus) return;

    // Optimistic UI Update
    const originalEvents = [...events];
    const newEvents = events.map((ev) =>
      ev.id === eventId ? { ...ev, status: newStatus } : ev
    );
    onUpdateEvents(newEvents);

    // Call server action
    const res = await updateEventStatusAction(eventId, newStatus);
    if (!res.success) {
      onUpdateEvents(originalEvents);
      alert("Error al cambiar estado: " + res.error);
    }
    setIsUpdating(null);
  };

  const getStatusInfo = (statusId: string) => {
    return EVENT_STATUSES.find((s) => s.id === statusId) || EVENT_STATUSES[0];
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm overflow-hidden animate-[fadeIn_0.5s_ease-out]">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Evento</th>
              {!project && (
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Proyecto</th>
              )}
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Fecha</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Estado</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {events.map((event) => {
              const statusInfo = getStatusInfo(event.status);

              return (
                <tr 
                  key={event.id} 
                  className="hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                  onClick={() => onEventClick && onEventClick(event.id)}
                >
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-headline font-bold text-gray-900 dark:text-gray-100">{event.name || "Evento sin título"}</span>
                      {event.location && (
                        <span className="font-body text-xs text-gray-500 flex items-center gap-1 mt-1">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.242-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {event.location}
                        </span>
                      )}
                    </div>
                  </td>

                  {!project && (
                    <td className="px-6 py-4">
                      {event.project ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-body text-xs font-semibold border border-blue-100 dark:border-blue-800/30">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                          </svg>
                          {event.project.name}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs italic">-</span>
                      )}
                    </td>
                  )}

                  <td className="px-6 py-4">
                    <div className="font-body text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {event.eventDate ? new Date(event.eventDate).toLocaleDateString('es-CR', { month: 'short', day: 'numeric', year: 'numeric' }) : "No asignada"}
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    {/* Status Dropdown Trigger */}
                    <div className="relative inline-block">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveDropdown(activeDropdown === event.id ? null : event.id);
                        }}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all hover:shadow-sm"
                        style={{
                          backgroundColor: `${statusInfo.color}15`,
                          borderColor: `${statusInfo.color}40`,
                          color: statusInfo.color,
                        }}
                      >
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: statusInfo.color }}></span>
                        <span className="font-body text-xs font-bold">{statusInfo.label}</span>
                        <svg className="w-3.5 h-3.5 ml-1 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {/* Dropdown Menu */}
                      {activeDropdown === event.id && (
                        <div
                          className="absolute left-0 top-full mt-1.5 w-44 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 z-20 py-1.5 flex flex-col"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">Mover a</p>
                          {EVENT_STATUSES.filter((s) => s.id !== event.status).map((s) => (
                            <button
                              key={s.id}
                              onClick={() => handleChangeStatus(event.id, s.id)}
                              disabled={isUpdating === event.id}
                              className="px-3 py-2 text-sm text-left text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2.5 transition-colors disabled:opacity-50"
                            >
                              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }}></span>
                              {s.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>

                  <td className="px-6 py-4 text-right">
                    <button className="p-2 text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                      </svg>
                    </button>
                  </td>
                </tr>
              );
            })}

            {events.length === 0 && (
              <tr>
                <td colSpan={project ? 4 : 5} className="px-6 py-8 text-center text-gray-500 font-body text-sm">
                  No hay eventos para mostrar.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
