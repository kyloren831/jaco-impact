import React from "react";

interface ModalProps {
  onClose: () => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: string;
  headerIcon?: React.ReactNode;
}

export default function Modal({
  onClose,
  title,
  description,
  children,
  maxWidth = "max-w-lg",
  headerIcon,
}: ModalProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={`bg-white dark:bg-gray-900 rounded-3xl w-full ${maxWidth} shadow-2xl overflow-hidden scale-in-center animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col`}
      >
        <div className="p-8 border-b border-gray-100 dark:border-gray-800 bg-[#F9F8F6] dark:bg-gray-800 sticky top-0 z-10 shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {headerIcon && (
              <div className="shrink-0">
                {headerIcon}
              </div>
            )}
            <div>
              <h2 id="modal-title" className="font-headline text-2xl font-bold text-black dark:text-white">{title}</h2>
              {description && (
                <p className="font-body text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {description}
                </p>
              )}
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 dark:text-gray-500 hover:text-black dark:hover:text-white bg-gray-50 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
            title="Cerrar"
            type="button"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto scrollbar-hide flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}
