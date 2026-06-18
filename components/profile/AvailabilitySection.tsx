"use client";

import { useState, useTransition } from "react";
import { addVolunteerAvailabilityAction, deleteVolunteerAvailabilityAction } from "@/features/profile/actions";
import { Calendar, Trash2, Clock, Plus, Loader2, Save } from "lucide-react";

export default function AvailabilitySection({ availabilities: initialAvailabilities }: { availabilities: any[] }) {
  const [availabilities, setAvailabilities] = useState(initialAvailabilities);
  const [isPending, startTransition] = useTransition();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [notes, setNotes] = useState("");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate) return;

    startTransition(async () => {
      const res = await addVolunteerAvailabilityAction({
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        notes
      });
      if (res.success && res.data) {
        setAvailabilities(prev => [...prev, res.data]);
        setStartDate("");
        setEndDate("");
        setNotes("");
      } else {
        alert(res.error || "Error al agregar disponibilidad");
      }
    });
  };

  const handleDelete = (id: number) => {
    if (!confirm("¿Eliminar esta disponibilidad?")) return;
    startTransition(async () => {
      const res = await deleteVolunteerAvailabilityAction(id);
      if (res.success) {
        setAvailabilities(prev => prev.filter(a => a.id !== id));
      } else {
        alert(res.error || "Error al eliminar");
      }
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 border border-gray-100 dark:border-gray-700/50 shadow-sm transition-all duration-300 hover:shadow-md mt-8">
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
        <Calendar className="w-5 h-5 text-blue-500" />
        Mi Disponibilidad
      </h3>

      <div className="space-y-6">
        {availabilities.length === 0 ? (
          <p className="text-gray-500 text-sm italic bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800">No has registrado disponibilidades.</p>
        ) : (
          <ul className="space-y-3">
            {availabilities.map((av) => (
              <li key={av.id} className="flex justify-between items-center bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800 transition-colors hover:border-gray-200 dark:hover:border-gray-700">
                <div>
                  <div className="font-medium text-gray-900 dark:text-white flex items-center gap-2 text-sm sm:text-base">
                    <Clock className="w-4 h-4 text-gray-500" />
                    {new Date(av.startDate).toLocaleString()} - {new Date(av.endDate).toLocaleString()}
                  </div>
                  {av.notes && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 pl-6">{av.notes}</p>}
                </div>
                <button
                  onClick={() => handleDelete(av.id)}
                  disabled={isPending}
                  className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-900/20 p-2 rounded-lg transition-colors"
                >
                  {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="pt-6 border-t border-gray-100 dark:border-gray-700/50">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Plus className="w-4 h-4 text-blue-500" />
            Agregar Disponibilidad
          </h4>
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 ml-1">Inicio</label>
              <input
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="block w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 ml-1">Fin</label>
              <input
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="block w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 dark:text-white"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 ml-1">Notas (Opcional)</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="block w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 dark:text-white"
                placeholder="Ej. Disponible solo por las mañanas"
              />
            </div>
            <div className="md:col-span-2 flex justify-end">
              <button
                type="submit"
                disabled={isPending}
                className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-xl shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 transition-all"
              >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Guardar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
