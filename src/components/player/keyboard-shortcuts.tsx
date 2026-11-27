"use client";

import { useEffect } from "react";
import { usePlayer } from "./player-provider";

export function KeyboardShortcuts() {
  const { togglePlay, toggleMute, currentStation } = usePlayer();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select" || target?.isContentEditable) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.code === "Space" && currentStation) {
        e.preventDefault();
        void togglePlay();
      }
      if (e.key.toLowerCase() === "m") {
        e.preventDefault();
        toggleMute();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [togglePlay, toggleMute, currentStation]);

  return null;
}
