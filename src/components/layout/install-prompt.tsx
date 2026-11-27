"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setPromptEvent(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!promptEvent || hidden) return null;

  return (
    <div className="fixed bottom-[calc(var(--player-height)+var(--mobile-nav-height)+env(safe-area-inset-bottom,0px)+1rem)] right-4 z-[45] rounded-xl border border-border bg-surface-elevated p-4 shadow-[var(--shadow-lg)] md:bottom-[calc(var(--player-height)+1rem)]">
      <p className="text-sm font-medium text-foreground">Install SYNTV RADIO</p>
      <p className="mt-1 text-xs text-muted-foreground">Get quick access from your device.</p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={async () => { await promptEvent.prompt(); await promptEvent.userChoice; setHidden(true); }}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
        >
          <Download size={14} aria-hidden="true" /> Install
        </button>
        <button type="button" onClick={() => setHidden(true)} className="rounded-full px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground">Not now</button>
      </div>
    </div>
  );
}
