"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";

interface EditableFieldProps {
  value: string;
  onSave: (newValue: string) => Promise<void>;
  placeholder?: string;
  multiline?: boolean;
  /** Additional className for the display/edit element */
  className?: string;
  /** If true, empty values are not allowed (will revert on blur if empty) */
  required?: boolean;
  /** Element tag/style to use in display mode */
  as?: "h1" | "h2" | "p" | "span";
}

export function EditableField({
  value,
  onSave,
  placeholder = "Haz clic para editar...",
  multiline = false,
  className = "",
  required = false,
  as = "p",
}: EditableFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  // Keep editValue in sync with prop when not editing
  useEffect(() => {
    if (!isEditing) {
      setEditValue(value);
    }
  }, [value, isEditing]);

  // Auto-focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      // Place cursor at end
      const len = inputRef.current.value.length;
      inputRef.current.setSelectionRange(len, len);
    }
  }, [isEditing]);

  const handleSave = useCallback(async () => {
    const trimmed = editValue.trim();

    // If required and empty, revert
    if (required && !trimmed) {
      setEditValue(value);
      setIsEditing(false);
      return;
    }

    // If value hasn't changed, just exit edit mode
    if (trimmed === value) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      await onSave(trimmed);
    } catch {
      // Revert on error
      setEditValue(value);
    } finally {
      setIsSaving(false);
      setIsEditing(false);
    }
  }, [editValue, value, required, onSave]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setEditValue(value);
      setIsEditing(false);
    }
    // For single-line fields, Enter saves
    if (!multiline && e.key === "Enter") {
      e.preventDefault();
      handleSave();
    }
    // For multiline, Cmd/Ctrl + Enter saves
    if (multiline && e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSave();
    }
  };

  const displayEmpty = !value || !value.trim();

  if (isEditing) {
    const sharedInputClasses = `w-full bg-white dark:bg-gray-800 border border-blue-400 dark:border-blue-500 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all ${className}`;

    if (multiline) {
      return (
        <div className="relative">
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isSaving}
            rows={3}
            className={`${sharedInputClasses} min-h-[80px] resize-y scrollbar-thin`}
          />
          {isSaving && (
            <div className="absolute top-2 right-2">
              <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="relative">
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isSaving}
          className={sharedInputClasses}
        />
        {isSaving && (
          <div className="absolute top-1/2 right-3 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
          </div>
        )}
      </div>
    );
  }

  // Display mode — render as the specified element with hover effects
  const DisplayTag = as;

  return (
    <DisplayTag
      onClick={() => setIsEditing(true)}
      className={`cursor-pointer rounded-lg px-3 py-1.5 -mx-3 -my-1.5 transition-all duration-150 hover:bg-gray-100 dark:hover:bg-gray-800 group/editable ${className} ${
        displayEmpty ? "text-gray-400 dark:text-gray-500 italic" : ""
      }`}
      title="Clic para editar"
    >
      {displayEmpty ? placeholder : value}
      <svg
        className="inline-block w-3.5 h-3.5 ml-2 opacity-0 group-hover/editable:opacity-50 transition-opacity text-gray-400 align-middle"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
        />
      </svg>
    </DisplayTag>
  );
}
