"use client";

import { useState } from "react";
import { registerToEventAction } from "@/features/volunteer/actions";

interface Props {
  eventId: number;
}

export default function RegisterEventButton({ eventId }: Props) {
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setLoading(true);
    const result = await registerToEventAction(eventId);
    if (!result.success) {
      alert(`Error al inscribirse: ${result.error}`);
    } else {
      alert("¡Te has inscrito al evento exitosamente!");
    }
    setLoading(false);
  };

  return (
    <button
      onClick={handleRegister}
      disabled={loading}
      className="px-4 py-2 bg-brand-verde hover:bg-brand-turquesa text-white rounded-lg font-bold transition-colors disabled:opacity-50"
    >
      {loading ? "Inscribiendo..." : "Inscribirme al Evento"}
    </button>
  );
}
