"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export const CONSENT_STORAGE_KEY = "syntv-radio:consent:v1";

export type ConsentMethod = "accept-all" | "essential-only" | "custom" | "privacy-signal";

export interface ConsentChoices {
  analytics: boolean;
  advertising: boolean;
}

export interface ConsentRecord extends ConsentChoices {
  version: 1;
  necessary: true;
  method: ConsentMethod;
  updatedAt: string;
}

interface ConsentContextValue {
  consent: ConsentRecord | null;
  ready: boolean;
  decided: boolean;
  preferencesOpen: boolean;
  privacySignal: boolean;
  saveConsent: (choices: ConsentChoices, method: Exclude<ConsentMethod, "privacy-signal">) => void;
  openPreferences: () => void;
  closePreferences: () => void;
  hasConsent: (category: keyof ConsentChoices) => boolean;
}

const ConsentContext = createContext<ConsentContextValue | null>(null);

function readPrivacySignal() {
  if (typeof navigator === "undefined") return false;
  const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
  const win = window as Window & { doNotTrack?: string };
  return nav.globalPrivacyControl === true || win.doNotTrack === "1";
}

function parseConsent(value: string | null): ConsentRecord | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as Partial<ConsentRecord>;
    if (parsed.version !== 1) return null;
    if (parsed.necessary !== true) return null;
    if (typeof parsed.analytics !== "boolean" || typeof parsed.advertising !== "boolean") return null;
    if (typeof parsed.updatedAt !== "string") return null;
    if (
      parsed.method !== "accept-all" &&
      parsed.method !== "essential-only" &&
      parsed.method !== "custom" &&
      parsed.method !== "privacy-signal"
    ) {
      return null;
    }
    return {
      version: 1,
      necessary: true,
      analytics: parsed.analytics,
      advertising: parsed.advertising,
      method: parsed.method,
      updatedAt: parsed.updatedAt,
    };
  } catch {
    return null;
  }
}

export function ConsentProvider({ children }: { children: React.ReactNode }) {
  const [consent, setConsent] = useState<ConsentRecord | null>(null);
  const [ready, setReady] = useState(false);
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [privacySignal, setPrivacySignal] = useState(false);

  useEffect(() => {
    const signal = readPrivacySignal();
    let stored: ConsentRecord | null = null;
    try {
      stored = parseConsent(localStorage.getItem(CONSENT_STORAGE_KEY));
    } catch {
      stored = null;
    }

    /* eslint-disable react-hooks/set-state-in-effect -- hydrate consent after mount */
    setPrivacySignal(signal);
    if (stored && signal && (stored.analytics || stored.advertising)) {
      const restricted: ConsentRecord = {
        ...stored,
        analytics: false,
        advertising: false,
        method: "privacy-signal",
        updatedAt: new Date().toISOString(),
      };
      try {
        localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(restricted));
      } catch {
        // Storage may be unavailable; the in-memory choice still respects the signal.
      }
      setConsent(restricted);
    } else {
      setConsent(stored);
    }
    setReady(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const saveConsent = useCallback(
    (choices: ConsentChoices, method: Exclude<ConsentMethod, "privacy-signal">) => {
      const next: ConsentRecord = {
        version: 1,
        necessary: true,
        analytics: privacySignal ? false : Boolean(choices.analytics),
        advertising: privacySignal ? false : Boolean(choices.advertising),
        method: privacySignal ? "privacy-signal" : method,
        updatedAt: new Date().toISOString(),
      };
      try {
        localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // The choice still applies for this page view.
      }
      setConsent(next);
      setPreferencesOpen(false);
    },
    [privacySignal],
  );

  const value = useMemo<ConsentContextValue>(
    () => ({
      consent,
      ready,
      decided: consent !== null,
      preferencesOpen,
      privacySignal,
      saveConsent,
      openPreferences: () => setPreferencesOpen(true),
      closePreferences: () => setPreferencesOpen(false),
      hasConsent: (category) => consent?.[category] === true,
    }),
    [consent, ready, preferencesOpen, privacySignal, saveConsent],
  );

  return <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>;
}

export function useConsent() {
  const context = useContext(ConsentContext);
  if (!context) throw new Error("useConsent must be used within ConsentProvider");
  return context;
}
