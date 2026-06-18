import React from "react";

interface ModuleHeaderProps {
  title: string;
  description: string;
  searchPlaceholder?: string;
  searchTerm?: string;
  onSearchChange?: (value: string) => void;
  actionLabel?: string;
  onActionClick?: () => void;
}

export default function ModuleHeader({
  title,
  description,
  searchPlaceholder = "Buscar...",
  searchTerm,
  onSearchChange,
  actionLabel,
  onActionClick,
}: ModuleHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
      <div>
        <h1 className="font-headline text-4xl font-black text-black dark:text-white">{title}</h1>
        <p className="font-body text-gray-500 dark:text-gray-400 mt-2 font-medium">{description}</p>
      </div>

      <div className="w-full md:w-auto flex flex-col sm:flex-row items-center gap-4">
        {onSearchChange && (
          <div className="w-full sm:w-auto flex items-center bg-white dark:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-700 px-4 py-2 shadow-sm focus-within:ring-2 focus-within:ring-brand-verde/50 transition-all">
            <svg className="w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder={searchPlaceholder}
              className="font-body bg-transparent border-none focus:outline-none ml-3 w-full sm:w-64 text-sm font-medium text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
              value={searchTerm || ""}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        )}

        {onActionClick && actionLabel && (
          <button
            onClick={onActionClick}
            className="w-full sm:w-auto px-6 py-2 rounded-full font-body font-bold text-white dark:text-black bg-black dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors shadow-lg flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}
