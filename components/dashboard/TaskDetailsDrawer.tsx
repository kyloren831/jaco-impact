"use client";

import { useState, useRef, useEffect, useOptimistic, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { RightSidePanel } from "@/components/ui/RightSidePanel";
import { useRealtime } from "@/hooks/useRealtime";
import { getTaskCommentsAction, addTaskCommentAction } from "@/features/volunteer/actions";

interface CommentDisplay {
  id: number;
  content: string;
  createdAt: Date | string;
  authorId: number;
  authorName: string;
}

interface TaskDetailsDrawerProps {
  taskId: number;
  volunteerId: number;
  userId: number;
  userName: string;
  onClose: () => void;
  onAction: (
    action: "ACCEPT" | "DECLINE" | "START" | "SUBMIT" | "SUBMIT_WITH_FILE",
    payload?: any
  ) => Promise<void>;
  task: any;
}

export default function TaskDetailsDrawer({
  taskId,
  volunteerId,
  userId,
  userName,
  onClose,
  onAction,
  task,
}: TaskDetailsDrawerProps) {
  const router = useRouter();
  const [isPending, startCommentTransition] = useTransition();

  const [comments, setComments] = useState<CommentDisplay[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [error, setError] = useState("");
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  // States for Decline workflow
  const [showDeclineInput, setShowDeclineInput] = useState(false);
  const [declineReason, setDeclineReason] = useState("");

  // States for Evidence upload
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [note, setNote] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const commentsEndRef = useRef<HTMLDivElement>(null);

  const assignment = task.assignments?.find((a: any) => a.volunteerId === volunteerId);
  const status = assignment?.status;

  // Load comments on mount/taskId change
  useEffect(() => {
    async function loadComments() {
      setIsLoadingComments(true);
      setError("");
      try {
        const result = await getTaskCommentsAction(taskId);
        if (result.success && result.data) {
          setComments(
            result.data.map((c: any) => ({
              id: c.id,
              content: c.content,
              createdAt: c.createdAt,
              authorId: c.authorId,
              authorName: c.author?.name || "Usuario",
            }))
          );
        } else if (result.error) {
          setError(result.error);
        }
      } catch (err: any) {
        setError(err.message || "Error al cargar comentarios");
      } finally {
        setIsLoadingComments(false);
      }
    }
    loadComments();
  }, [taskId]);

  // Optimistic comments
  const [optimisticComments, setOptimisticComments] = useOptimistic(
    comments,
    (state, newComment: CommentDisplay) => {
      if (state.some((c) => c.id === newComment.id)) {
        return state;
      }
      return [...state, newComment];
    }
  );

  const renderedComments = optimisticComments.filter((c) => {
    if (c.id < 0) {
      const hasReal = optimisticComments.some(
        (rc) => rc.id > 0 && rc.content === c.content && rc.authorId === c.authorId
      );
      if (hasReal) return false;
    }
    return true;
  });

  // Real-time comment addition
  useRealtime("TASK_COMMENT", (event) => {
    if (event.payload?.taskId === taskId) {
      const newComment: CommentDisplay = {
        id: event.payload.commentId,
        content: event.payload.content,
        createdAt: event.payload.createdAt,
        authorId: event.payload.authorId,
        authorName: event.payload.authorName,
      };

      setComments((prev) => {
        // Deduplicate comments to prevent showing duplicate entries for the local user
        if (prev.some((c) => c.id === newComment.id)) {
          return prev;
        }
        return [...prev, newComment];
      });
    }
  });

  // Scroll to bottom when comments change
  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [optimisticComments]);

  // Handle new comment submission
  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    const textToSubmit = commentText;
    setCommentText("");

    startCommentTransition(async () => {
      // Create temporary optimistic comment
      const tempComment: CommentDisplay = {
        id: Date.now() * -1, // Temporary negative ID
        content: textToSubmit,
        createdAt: new Date(),
        authorId: userId,
        authorName: userName || "Tú",
      };

      setOptimisticComments(tempComment);

      try {
        const result = await addTaskCommentAction(taskId, textToSubmit);
        if (!result.success) {
          setError(result.error || "Error al enviar comentario");
        } else {
          router.refresh();
        }
      } catch (err: any) {
        setError(err.message || "Error al enviar comentario");
      }
    });
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const executeDrawerAction = async (
    action: "ACCEPT" | "DECLINE" | "START" | "SUBMIT" | "SUBMIT_WITH_FILE",
    payload?: any
  ) => {
    setIsSubmittingAction(true);
    setError("");
    try {
      await onAction(action, payload);
      if (action === "DECLINE") {
        setShowDeclineInput(false);
        setDeclineReason("");
      }
      setSelectedFile(null);
      setNote("");
    } catch (err: any) {
      setError(err.message || "Ocurrió un error inesperado al procesar la acción.");
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Status badges styling
  const getStatusBadge = (statusValue: string) => {
    switch (statusValue) {
      case "PENDING_ACCEPTANCE":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800 dark:bg-yellow-950/30 dark:text-yellow-400">Aceptación Pendiente</span>;
      case "ACCEPTED":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-400">Aceptada</span>;
      case "IN_PROGRESS":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950/30 dark:text-indigo-400">En Curso</span>;
      case "SUBMITTED":
      case "UNDER_REVIEW":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 dark:bg-purple-950/30 dark:text-purple-400">En Revisión</span>;
      case "REVISION_REQUESTED":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-850 dark:bg-orange-950/30 dark:text-orange-400">Corrección Solicitada</span>;
      case "APPROVED":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800 dark:bg-green-950/30 dark:text-green-400">Aprobada (Completada)</span>;
      case "DECLINED":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-400">Rechazada</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">{statusValue}</span>;
    }
  };

  const priorityColor =
    task.priority === "HIGH"
      ? "text-red-600 bg-red-100 dark:bg-red-950/30 dark:text-red-400"
      : task.priority === "MEDIUM"
      ? "text-yellow-600 bg-yellow-100 dark:bg-yellow-950/30 dark:text-yellow-400"
      : "text-green-600 bg-green-100 dark:bg-green-950/30 dark:text-green-400";

  const drawerTitle = (
    <div>
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-0.5">
        {task.event?.name || task.event?.title || "Evento"}
      </p>
      <span className="line-clamp-1">{task.title}</span>
    </div>
  );

  return (
    <RightSidePanel isOpen={true} onClose={onClose} title={drawerTitle} width="w-full sm:w-[500px] md:w-[600px]">
      <div className="p-6 space-y-6">
            {error && (
              <div className="bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm border border-red-100 dark:border-red-950">
                {error}
              </div>
            )}

            {/* Badges details */}
            <div className="grid grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-850 p-4 rounded-xl">
              <div>
                <span className="block text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 mb-1">
                  Prioridad
                </span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${priorityColor}`}>
                  {task.priority}
                </span>
              </div>
              <div>
                <span className="block text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 mb-1">
                  Mi Estado
                </span>
                {getStatusBadge(status)}
              </div>
              <div className="col-span-2">
                <span className="block text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 mb-0.5">
                  Vence
                </span>
                <span className="text-sm font-semibold text-gray-800 dark:text-gray-250">
                  {task.dueDate
                    ? format(new Date(task.dueDate), "dd 'de' MMMM, yyyy", { locale: es })
                    : "Sin fecha especificada"}
                </span>
              </div>
            </div>

            {/* Description */}
            <div>
              <h4 className="text-xs uppercase font-bold text-gray-400 dark:text-gray-500 mb-1.5">
                Descripción de la Tarea
              </h4>
              <p className="text-sm text-gray-750 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                {task.description || "Sin descripción proporcionada."}
              </p>
            </div>

            {/* Decline Reason (if declined) */}
            {status === "DECLINED" && assignment?.declineReason && (
              <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900 rounded-xl">
                <h4 className="text-xs font-bold text-red-700 dark:text-red-400 mb-1">
                  Motivo de Rechazo
                </h4>
                <p className="text-xs text-red-600 dark:text-red-300">
                  {assignment.declineReason}
                </p>
              </div>
            )}

            {/* Transitions Workflows */}
            <div className="border-t border-gray-100 dark:border-gray-800 pt-6">
              {status === "PENDING_ACCEPTANCE" && (
                <div className="space-y-4">
                  {!showDeclineInput ? (
                    <div className="flex gap-3">
                      <button
                        onClick={() => executeDrawerAction("ACCEPT")}
                        disabled={isSubmittingAction}
                        className="flex-1 inline-flex justify-center items-center rounded-xl bg-brand-verde hover:bg-brand-verde-oscuro px-4 py-3 text-sm font-bold text-white shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        {isSubmittingAction ? "Aceptando..." : "Aceptar Tarea"}
                      </button>
                      <button
                        onClick={() => setShowDeclineInput(true)}
                        disabled={isSubmittingAction}
                        className="flex-1 inline-flex justify-center items-center rounded-xl border border-red-200 dark:border-red-900/60 hover:bg-red-50 dark:hover:bg-red-950/20 px-4 py-3 text-sm font-bold text-red-600 dark:text-red-400 transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        Rechazar Tarea
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-850 rounded-xl">
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                        ¿Por qué rechazas esta tarea?
                      </h4>
                      <textarea
                        value={declineReason}
                        onChange={(e) => setDeclineReason(e.target.value)}
                        placeholder="Escribe el motivo..."
                        rows={3}
                        className="w-full text-sm rounded-lg border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white shadow-sm focus:border-brand-verde focus:ring-brand-verde"
                      />
                      <div className="flex gap-2 justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            setShowDeclineInput(false);
                            setDeclineReason("");
                          }}
                          className="px-3 py-1.5 text-xs font-semibold text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 cursor-pointer"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={() => executeDrawerAction("DECLINE", { reason: declineReason })}
                          disabled={!declineReason.trim() || isSubmittingAction}
                          className="px-3 py-1.5 text-xs font-bold bg-red-600 text-white rounded-md hover:bg-red-750 disabled:opacity-50 cursor-pointer"
                        >
                          Confirmar Rechazo
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {status === "ACCEPTED" && (
                <button
                  onClick={() => executeDrawerAction("START")}
                  disabled={isSubmittingAction}
                  className="w-full inline-flex justify-center items-center rounded-xl bg-brand-azul hover:bg-brand-azul-oscuro px-4 py-3 text-sm font-bold text-white shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isSubmittingAction ? "Iniciando..." : "Iniciar Tarea"}
                </button>
              )}

              {(status === "IN_PROGRESS" || status === "REVISION_REQUESTED") && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs uppercase font-bold text-gray-400 dark:text-gray-500 mb-1.5">
                      Nota de Entrega (Opcional)
                    </label>
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Añade un comentario sobre tu entrega..."
                      rows={3}
                      className="w-full text-sm rounded-xl border-gray-300 dark:border-gray-750 dark:bg-gray-800 dark:text-white shadow-sm focus:border-brand-verde focus:ring-brand-verde"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase font-bold text-gray-400 dark:text-gray-500 mb-1.5">
                      Archivo de Evidencia (Obligatorio para entrega normal)
                    </label>
                    
                    {/* Drag and Drop Zone */}
                    <div
                      onDragEnter={handleDrag}
                      onDragOver={handleDrag}
                      onDragLeave={handleDrag}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors duration-200 ${
                        dragActive
                          ? "border-brand-verde bg-brand-verde/5"
                          : "border-gray-300 dark:border-gray-750 hover:border-brand-verde bg-gray-50 dark:bg-gray-850"
                      }`}
                    >
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      {selectedFile ? (
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-gray-900 dark:text-white">
                            Archivo seleccionado:
                          </p>
                          <p className="text-xs text-brand-verde font-medium truncate max-w-[250px] mx-auto">
                            {selectedFile.name}
                          </p>
                          <p className="text-[10px] text-gray-400">
                            {(selectedFile.size / 1024).toFixed(1)} KB
                          </p>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedFile(null);
                            }}
                            className="text-xs text-red-500 hover:underline mt-2 cursor-pointer"
                          >
                            Quitar archivo
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2 text-gray-500 dark:text-gray-400">
                          <svg
                            className="mx-auto h-8 w-8 text-gray-400"
                            stroke="currentColor"
                            fill="none"
                            viewBox="0 0 48 48"
                          >
                            <path
                              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                              strokeWidth={2}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                          <p className="text-xs font-medium">
                            Arrastra tu archivo aquí o haz clic para examinar
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        if (!selectedFile) {
                          setError("Por favor, selecciona o arrastra un archivo de evidencia.");
                          return;
                        }
                        executeDrawerAction("SUBMIT_WITH_FILE", { file: selectedFile, note });
                      }}
                      disabled={isSubmittingAction}
                      className="w-full inline-flex justify-center items-center rounded-xl bg-brand-verde hover:bg-brand-verde-oscuro px-4 py-3 text-sm font-bold text-white shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {isSubmittingAction ? "Entregando..." : "Entregar con Evidencia"}
                    </button>

                    <button
                      type="button"
                      onClick={() => executeDrawerAction("SUBMIT", { note })}
                      disabled={isSubmittingAction}
                      className="w-full inline-flex justify-center items-center text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors py-2 cursor-pointer"
                    >
                      Entregar sin archivo
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Comments Thread Section */}
            <div className="border-t border-gray-100 dark:border-gray-800 pt-6 flex flex-col space-y-4">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span>Comentarios de la Tarea</span>
                <span className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs px-2 py-0.5 rounded-full">
                  {renderedComments.length}
                </span>
              </h3>

              {/* Scrollable comments container */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[260px] border border-gray-150 dark:border-gray-800 rounded-xl p-3 bg-gray-50/50 dark:bg-gray-950/40">
                {isLoadingComments ? (
                  <p className="text-center text-xs text-gray-400 py-4">Cargando comentarios...</p>
                ) : renderedComments.length === 0 ? (
                  <p className="text-center text-xs text-gray-400 py-6">No hay comentarios. Escribe el primero.</p>
                ) : (
                  renderedComments.map((comment) => {
                    const isAuthorMe = comment.authorId === userId;
                    return (
                      <div
                        key={comment.id}
                        className={`flex flex-col ${isAuthorMe ? "items-end" : "items-start"}`}
                      >
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-[10px] font-semibold text-gray-600 dark:text-gray-400">
                            {comment.authorName}
                          </span>
                          <span className="text-[9px] text-gray-400">
                            {format(new Date(comment.createdAt), "HH:mm", { locale: es })}
                          </span>
                        </div>
                        <div
                          className={`rounded-lg px-3 py-2 text-xs max-w-[85%] break-words ${
                            isAuthorMe
                              ? "bg-brand-verde text-white"
                              : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-250 border border-gray-100 dark:border-gray-800"
                          }`}
                        >
                          {comment.content}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={commentsEndRef} />
              </div>

              {/* Comment submission form */}
              <form onSubmit={handleSendComment} className="flex gap-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Escribe un comentario..."
                  disabled={isPending}
                  className="flex-1 text-sm rounded-xl border-gray-300 dark:border-gray-750 dark:bg-gray-800 dark:text-white shadow-sm focus:border-brand-verde focus:ring-brand-verde"
                />
                <button
                  type="submit"
                  disabled={!commentText.trim() || isPending}
                  className="inline-flex justify-center items-center rounded-xl bg-brand-verde hover:bg-brand-verde-oscuro text-white px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Enviar
                </button>
              </form>
            </div>
          </div>
        </RightSidePanel>
      );
    }
