"use client";

import { evaluatePymeAction } from "@/features/pymes/actions";
import { toast } from "sonner";
import { CheckCircle2, XCircle } from "lucide-react";

export default function EvaluatePymeButtons({ pymeId, isActive }: { pymeId: number, isActive: boolean }) {
  const handleEvaluate = async (approve: boolean) => {
    try {
      await evaluatePymeAction(pymeId, approve);
      toast.success(approve ? "Catálogo aprobado." : "Catálogo retirado.");
    } catch (e: any) {
      toast.error("Error: " + e.message);
    }
  };

  return (
    <>
      {isActive ? (
        <button 
          onClick={() => handleEvaluate(false)}
          className="flex items-center gap-2 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors dark:bg-red-900/20 dark:border-red-800 dark:hover:bg-red-900/40"
        >
          <XCircle className="w-4 h-4" /> Revocar
        </button>
      ) : (
        <button 
          onClick={() => handleEvaluate(true)}
          className="flex items-center gap-2 bg-green-600 text-white hover:bg-green-700 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors shadow-sm"
        >
          <CheckCircle2 className="w-4 h-4" /> Aprobar
        </button>
      )}
    </>
  );
}
