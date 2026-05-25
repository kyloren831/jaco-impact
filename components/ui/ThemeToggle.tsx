"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button className="flex items-center w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-brand-verde/10 hover:text-brand-verde transition-colors">
        <span className="mr-2">🌙</span> Modo Oscuro
      </button>
    );
  }

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <button
      onClick={toggleTheme}
      className="flex items-center w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-brand-verde/10 hover:text-brand-verde transition-colors"
    >
      <span className="mr-2">{theme === "dark" ? "☀️" : "🌙"}</span>
      {theme === "dark" ? "Modo Claro" : "Modo Oscuro"}
    </button>
  );
}
