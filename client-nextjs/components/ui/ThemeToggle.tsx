"use client";

import { useTheme } from "@/contexts/ThemeContext";
import { HiSun, HiMoon } from "react-icons/hi";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="rounded-lg bg-secondary p-2 text-secondary-foreground transition-colors hover:bg-secondary/80"
      aria-label="Toggle dark mode"
    >
      {theme === "dark" ? (
        <HiSun className="h-5 w-5" />
      ) : (
        <HiMoon className="h-5 w-5" />
      )}
    </button>
  );
}
