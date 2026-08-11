"use client";

import { useState } from "react";

export default function ThemeToggle({ initialIsDark }: { initialIsDark: boolean }) {
  const [isDark, setIsDark] = useState(initialIsDark);

  function toggle() {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    // Cookie (not localStorage) so the server can render the right class
    // from the start on every request — including the client-side layout
    // re-render a locale switch triggers, which would otherwise reset any
    // class that only exists imperatively in the DOM.
    document.cookie = `theme=${next ? "dark" : "light"}; path=/; max-age=31536000; samesite=lax`;
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle dark mode"
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-foreground/70 hover:bg-muted"
    >
      {isDark ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
          <circle cx="12" cy="12" r="4.2" />
          <path
            strokeLinecap="round"
            d="M12 2.5v2M12 19.5v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2.5 12h2M19.5 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"
          />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
          <path d="M20.6 15.3A8.5 8.5 0 1 1 8.7 3.4a7 7 0 0 0 11.9 11.9Z" />
        </svg>
      )}
    </button>
  );
}
