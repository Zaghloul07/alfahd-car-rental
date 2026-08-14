"use client";

import { useEffect } from "react";

export default function HighlightTarget() {
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (!hash) return;
    const el = document.getElementById(hash);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.add("ring-2", "ring-brand", "ring-offset-2");
    const timer = setTimeout(() => el.classList.remove("ring-2", "ring-brand", "ring-offset-2"), 2500);
    return () => clearTimeout(timer);
  }, []);

  return null;
}
