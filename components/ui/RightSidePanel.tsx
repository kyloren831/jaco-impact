import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface RightSidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  width?: string;
}

export function RightSidePanel({
  isOpen,
  onClose,
  title,
  children,
  width = "w-full sm:w-[400px] md:w-[500px]",
}: RightSidePanelProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!mounted) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Slide Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Panel lateral"
        className={`fixed inset-y-0 right-0 z-[100] ${width} bg-white dark:bg-gray-900 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out transform ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800 bg-[#F9F8F6] dark:bg-gray-800 shrink-0">
          {title ? (
            <h2 className="font-headline text-xl font-bold text-gray-900 dark:text-gray-100">{title}</h2>
          ) : (
            <div></div> // empty div to push close button to the right if no title
          )}
          <button
            onClick={onClose}
            className="p-2 text-gray-400 dark:text-gray-500 hover:text-black dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
            title="Cerrar panel"
            type="button"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200">
          {children}
        </div>
      </div>
    </>,
    document.body
  );
}
