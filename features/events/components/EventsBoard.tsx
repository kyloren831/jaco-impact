"use client";

import { useState, useEffect } from "react";
import { updateEventStatusAction } from "../actions";
import { EVENT_STATUSES } from "./EventsClientView";

interface EventsBoardProps {
  events: any[];
  project: any | null;
  onUpdateEvents: (events: any[]) => void;
  onAddEvent: (statusId: string) => void;
  onEventClick?: (eventId: number) => void;
}

export function EventsBoard({ events, project, onUpdateEvents, onAddEvent, onEventClick }: EventsBoardProps) {
  const [draggedEventId, setDraggedEventId] = useState<number | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
  const [manualColumns, setManualColumns] = useState<string[]>([]);
  const [showColumnPicker, setShowColumnPicker] = useState(false);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = () => {
      setActiveDropdown(null);
      setShowColumnPicker(false);
    };
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  const handleDragStart = (e: React.DragEvent, eventId: number) => {
    setDraggedEventId(eventId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Necessary to allow dropping
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault();
    if (!draggedEventId) return;

    const eventToUpdate = events.find(ev => ev.id === draggedEventId);
    if (!eventToUpdate || eventToUpdate.status === targetStatus) {
      setDraggedEventId(null);
      return;
    }

    // Optimistic UI Update
    const originalEvents = [...events];
    const newEvents = events.map(ev => 
      ev.id === draggedEventId ? { ...ev, status: targetStatus } : ev
    );
    onUpdateEvents(newEvents);
    setDraggedEventId(null);

    // Call server action
    const res = await updateEventStatusAction(draggedEventId, targetStatus);
    if (!res.success) {
      // Revert if error
      onUpdateEvents(originalEvents);
      alert("Error al mover el evento: " + res.error);
    }
  };

  const handleChangeStatus = async (eventId: number, newStatus: string) => {
    setActiveDropdown(null);

    const eventToUpdate = events.find(ev => ev.id === eventId);
    if (!eventToUpdate || eventToUpdate.status === newStatus) return;

    // Optimistic UI Update
    const originalEvents = [...events];
    const newEvents = events.map(ev =>
      ev.id === eventId ? { ...ev, status: newStatus } : ev
    );
    onUpdateEvents(newEvents);

    // Call server action
    const res = await updateEventStatusAction(eventId, newStatus);
    if (!res.success) {
      onUpdateEvents(originalEvents);
      alert("Error al cambiar estado: " + res.error);
    }
  };

  // Show columns that have events + manually added empty columns
  const visibleStatuses = EVENT_STATUSES.filter(status =>
    events.some(e => e.status === status.id) || manualColumns.includes(status.id)
  );

  // Statuses not yet visible — available to add as columns
  const hiddenStatuses = EVENT_STATUSES.filter(status =>
    !visibleStatuses.some(v => v.id === status.id)
  );

  return (
    <div className="flex gap-6 overflow-x-auto pb-8 items-start min-h-[60vh] snap-x scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent animate-[fadeIn_0.5s_ease-out]">
      {visibleStatuses.map(status => {
        const statusEvents = events.filter(e => e.status === status.id);

        return (
          <div
            key={status.id}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, status.id)}
            className="w-80 shrink-0 backdrop-blur-sm rounded-2xl flex flex-col min-h-[200px] snap-start border shadow-sm"
            style={{
              backgroundColor: `${status.color}10`,
              borderColor: `${status.color}30`
            }}
          >
            {/* Column Header */}
            <div className="p-4 flex items-center justify-between pb-2">
              <div className="flex items-center gap-3">
                <h3 className="font-headline font-bold text-gray-900" style={{ color: status.color }}>
                  {status.label}
                </h3>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 bg-white/60 rounded-full text-gray-700 shadow-sm border border-white/50">
                {statusEvents.length}
              </span>
            </div>

            {/* Cards List - flex-1 allows the dropzone to stretch vertically */}
            <div className="flex-1 flex flex-col gap-3 p-3 pt-2">
              {statusEvents.map(event => (
                <div
                  key={event.id}
                  draggable={true}
                  onDragStart={(e) => handleDragStart(e, event.id)}
                  onClick={() => onEventClick && onEventClick(event.id)}
                  className={`bg-white p-4 rounded-xl shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] border border-gray-100 hover:shadow-md transition-all cursor-grab active:cursor-grabbing group relative ${draggedEventId === event.id ? 'opacity-50' : ''}`}
                >
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-xl opacity-80" style={{ backgroundColor: status.color }}></div>

                  <div className="pl-2">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-headline text-base font-bold text-gray-900 leading-tight flex-1 mr-2">
                        {event.name || "Evento sin título"}
                      </h4>

                      {/* Three-dot dropdown menu */}
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveDropdown(activeDropdown === event.id ? null : event.id);
                          }}
                          className="p-1 text-gray-400 hover:text-black hover:bg-gray-100 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                          title="Cambiar estado"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                          </svg>
                        </button>

                        {activeDropdown === event.id && (
                          <div
                            className="absolute right-0 top-7 mt-1 w-44 bg-white rounded-xl shadow-lg border border-gray-100 z-20 py-1.5 flex flex-col"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">Mover a</p>
                            {EVENT_STATUSES.filter(s => s.id !== event.status).map(s => (
                              <button
                                key={s.id}
                                onClick={() => handleChangeStatus(event.id, s.id)}
                                className="px-3 py-2 text-sm text-left text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition-colors"
                              >
                                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }}></span>
                                {s.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Show project name in global view */}
                    {!project && event.project && (
                      <p className="font-body text-[11px] font-semibold text-blue-500 mb-1.5 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                        </svg>
                        {event.project.name}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-[11px] font-medium text-gray-400">
                      <div className="flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>
                          {event.eventDate ? new Date(event.eventDate).toLocaleDateString('es-CR', { month: 'short', day: 'numeric', year: 'numeric' }) : "Fecha no asignada"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Simulated Add Button within column */}
              <button 
                onClick={() => onAddEvent(status.id)}
                className="mt-auto pt-1 py-2 px-3 flex items-center gap-2 text-sm font-body font-medium text-gray-500 hover:bg-white/50 rounded-lg transition-colors w-full text-left"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Añadir evento
              </button>
            </div>
          </div>
        );
      })}

      {/* Add Column Button — only when there are hidden statuses */}
      {hiddenStatuses.length > 0 && (
        <div className="shrink-0 relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowColumnPicker(!showColumnPicker);
            }}
            className="w-80 py-4 rounded-2xl border-2 border-dashed border-gray-300 hover:border-gray-400 bg-white/50 hover:bg-white/80 transition-all flex items-center justify-center gap-2 text-sm font-body font-semibold text-gray-400 hover:text-gray-600"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Agregar columna
          </button>

          {showColumnPicker && (
            <div
              className="absolute left-0 top-full mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-100 z-20 py-1.5 flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">Agregar estado</p>
              {hiddenStatuses.map(s => (
                <button
                  key={s.id}
                  onClick={() => {
                    setManualColumns(prev => [...prev, s.id]);
                    setShowColumnPicker(false);
                  }}
                  className="px-3 py-2 text-sm text-left text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition-colors"
                >
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }}></span>
                  {s.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
