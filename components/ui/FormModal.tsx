import React from "react";
import Modal from "./Modal";

interface FormModalProps {
  // Modal Props
  onClose: () => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  maxWidth?: string;
  headerIcon?: React.ReactNode;

  // Form Props
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  loading?: boolean;
  error?: string;
  submitLabel: string;
  cancelLabel?: string;
  submitColor?: string; // Optional dynamic color, e.g., "#45B85A"
  
  children: React.ReactNode;
}

export default function FormModal({
  onClose,
  title,
  description,
  maxWidth,
  headerIcon,
  onSubmit,
  loading = false,
  error,
  submitLabel,
  cancelLabel = "Cancelar",
  submitColor,
  children,
}: FormModalProps) {
  // If a custom color is provided, we use style={{ backgroundColor: submitColor }}.
  // Otherwise, we default to the Pillars module base black button classes.
  const buttonStyle = submitColor ? { backgroundColor: submitColor } : {};
  const buttonClasses = submitColor
    ? "px-6 py-2.5 rounded-full font-body font-bold text-white shadow-lg disabled:opacity-50 flex items-center gap-2 hover:brightness-90 transition-all"
    : "px-6 py-2.5 rounded-full font-body font-bold text-white bg-black hover:bg-gray-800 shadow-lg disabled:opacity-50 flex items-center gap-2 transition-colors";

  return (
    <Modal
      onClose={onClose}
      title={title}
      description={description}
      maxWidth={maxWidth}
      headerIcon={headerIcon}
    >
      <form onSubmit={onSubmit} className="p-8 space-y-5">
        {error && (
          <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-body font-medium border border-red-100 flex items-center gap-3">
            <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

        <div className="space-y-5">
          {children}
        </div>

        <div className="pt-4 border-t border-gray-100 flex justify-end gap-4 mt-8">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-full font-body font-semibold text-gray-600 hover:bg-gray-200 transition-colors"
            disabled={loading}
          >
            {cancelLabel}
          </button>
          <button
            type="submit"
            disabled={loading}
            className={buttonClasses}
            style={buttonStyle}
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Procesando...
              </>
            ) : (
              submitLabel
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
