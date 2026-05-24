"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { getEventsByProject, getAllEvents } from "../actions";
import { CreateEventModal } from "./CreateEventModal";
import { EventsBoard } from "./EventsBoard";
import { EventsList } from "./EventsList";
import { EventDetailPanel } from "./EventDetailPanel";

interface EventsClientViewProps {
  project: any | null; // null = show events from all projects
}

export const EVENT_STATUSES = [
  { id: "PLANNED", label: "Planeado", color: "#3B82F6" },   // Blue
  { id: "OPEN", label: "Abierto", color: "#10B981" },       // Green
  { id: "CLOSED", label: "Cerrado", color: "#F59E0B" },     // Yellow/Orange
  { id: "COMPLETED", label: "Completado", color: "#8B5CF6" }, // Purple
  { id: "CANCELLED", label: "Cancelado", color: "#EF4444" },  // Red
];

export function EventsClientView({ project }: EventsClientViewProps) {
  const [viewMode, setViewMode] = useState<"board" | "list">("board");
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingStatus, setCreatingStatus] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    const res = project
      ? await getEventsByProject(project.id)
      : await getAllEvents();
    if (res.success && res.data) {
      setEvents(res.data);
    }
    setLoading(false);
  }, [project]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Handler para actualizar la lista localmente de forma optimista
  const handleOptimisticUpdate = (updatedEvents: any[]) => {
    setEvents(updatedEvents);
  };

  return (
    <div className="flex flex-col h-full space-y-6 animate-[fadeIn_0.5s_ease-out]">
      {/* Header and Add Button */}
      <div className="flex flex-col items-start gap-4 mb-2">
        <div className="w-full flex justify-between items-start">
          <div>
            <h1 className="font-headline text-4xl font-black text-black">
              {project ? (
                <>
                  <Link href="/dashboard/admin/projects" className="text-gray-400 font-bold hover:text-gray-600 transition-colors">
                    Proyectos
                  </Link>
                  <span className="text-gray-400 font-bold"> / </span>
                  {project.name}
                </>
              ) : (
                "Eventos y Tareas"
              )}
            </h1>
            <p className="font-body text-gray-500 mt-2 font-medium">
              {project
                ? "Gestiona los eventos para este proyecto."
                : "Vista general de todos los eventos de todos los proyectos."
              }
            </p>
          </div>
          <button 
            onClick={() => setCreatingStatus("PLANNED")}
            className="px-6 py-2.5 rounded-full font-body font-bold text-white bg-black hover:bg-gray-800 shadow-lg transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nuevo Evento
          </button>
        </div>
        {project && (
          <Link
            href="/dashboard/admin/projects"
            className="px-4 py-2 bg-white border border-gray-200 rounded-full hover:bg-gray-50 hover:shadow-sm transition-all text-gray-600 hover:text-black flex items-center gap-2 font-body text-sm font-medium"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Volver a Proyectos
          </Link>
        )}
      </div>

      {/* Tabs Submenu */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setViewMode("board")}
          className={`px-6 py-3 font-body text-sm font-bold transition-all relative ${
            viewMode === "board" ? "text-brand-verde" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Tablero
          {viewMode === "board" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-verde rounded-t-full"></div>
          )}
        </button>
        <button
          onClick={() => setViewMode("list")}
          className={`px-6 py-3 font-body text-sm font-bold transition-all relative ${
            viewMode === "list" ? "text-brand-verde" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Lista
          {viewMode === "list" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-verde rounded-t-full"></div>
          )}
        </button>
      </div>

      {/* Views */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center min-h-[50vh]">
          <div className="w-10 h-10 border-4 border-gray-200 border-t-black rounded-full animate-spin"></div>
        </div>
      ) : events.length === 0 ? (
        <div className="flex-1 flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <p className="font-body text-lg font-medium text-gray-400 mb-2">No hay eventos aún</p>
            <p className="font-body text-sm text-gray-400">
              {project
                ? "Crea el primer evento para este proyecto."
                : "No se encontraron eventos en ningún proyecto."
              }
            </p>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col">
          {viewMode === "board" ? (
            <EventsBoard 
              events={events} 
              project={project} 
              onUpdateEvents={handleOptimisticUpdate}
              onAddEvent={(statusId) => setCreatingStatus(statusId)}
              onEventClick={(id) => setSelectedEventId(id)}
            />
          ) : (
            <EventsList 
              events={events} 
              project={project}
              onUpdateEvents={handleOptimisticUpdate}
              onEventClick={(id) => setSelectedEventId(id)}
            />
          )}
        </div>
      )}

      {/* Create Modal */}
      {creatingStatus && (
        <CreateEventModal
          projectId={project?.id}
          status={creatingStatus}
          onClose={() => setCreatingStatus(null)}
          onSuccess={() => {
            setCreatingStatus(null);
            fetchEvents();
          }}
        />
      )}

      {/* Event Detail Panel */}
      <EventDetailPanel
        event={events.find(e => e.id === selectedEventId) || null}
        isOpen={!!selectedEventId}
        onClose={() => setSelectedEventId(null)}
      />
    </div>
  );
}
