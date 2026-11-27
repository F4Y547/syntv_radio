"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Cookie, ShieldCheck, X } from "lucide-react";
import { useConsent, type ConsentChoices } from "@/lib/consent";

function Toggle({
  id,
  label,
  checked,
  onChange,
  disabled = false,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-label={label}
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
        checked
          ? "border-primary/60 bg-primary"
          : "border-border bg-foreground/[0.08]"
      } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
    >
      <span
        aria-hidden="true"
        className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

export function ConsentManager() {
  const {
    consent,
    ready,
    decided,
    preferencesOpen,
    privacySignal,
    saveConsent,
    openPreferences,
    closePreferences,
  } = useConsent();
  const [draft, setDraft] = useState<ConsentChoices>({
    analytics: false,
    advertising: false,
  });
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!preferencesOpen) return;
    /* eslint-disable-next-line react-hooks/set-state-in-effect -- sync the editor with the saved choice */
    setDraft({
      analytics: privacySignal ? false : (consent?.analytics ?? false),
      advertising: privacySignal ? false : (consent?.advertising ?? false),
    });
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closePreferences();
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [preferencesOpen, consent, privacySignal, closePreferences]);

  if (!ready) return null;

  if (!decided && !preferencesOpen) {
    return (
      <section
        data-testid="consent-banner"
        aria-labelledby="consent-banner-title"
        className="fixed inset-x-0 bottom-[calc(var(--player-height)+var(--mobile-nav-height)+env(safe-area-inset-bottom,0px)+0.75rem)] z-[55] px-3 md:bottom-[calc(var(--player-height)+env(safe-area-inset-bottom,0px)+0.75rem)]"
      >
        <div className="container-page">
          <div className="mx-auto max-w-3xl rounded-2xl border border-border/80 bg-surface-elevated/95 p-4 shadow-[var(--shadow-lg)] backdrop-blur-xl sm:p-5">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-primary/25 bg-primary-soft text-primary">
                <Cookie size={17} aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 id="consent-banner-title" className="font-display text-base font-semibold text-foreground">
                  Your privacy choices
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-foreground-muted">
                  We use essential browser storage to remember player settings. Optional analytics and advertising are
                  off by default and are not currently active on SYNTV RADIO.
                </p>
                {privacySignal && (
                  <p className="mt-2 rounded-lg border border-primary/20 bg-primary-soft/60 px-2.5 py-1.5 text-xs text-foreground-muted">
                    Your browser is sending a privacy signal, so optional analytics and advertising will remain off.
                  </p>
                )}
                <p className="mt-2 text-xs text-muted-foreground">
                  Read our{" "}
                  <Link href="/privacy-policy" className="text-primary hover:underline">
                    Privacy Policy
                  </Link>
                  . You can change your choice at any time from the footer.
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {!privacySignal && (
                    <button
                      type="button"
                      onClick={() => saveConsent({ analytics: true, advertising: true }, "accept-all")}
                      className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      Accept all
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => saveConsent({ analytics: false, advertising: false }, "essential-only")}
                    className="rounded-full border border-border bg-foreground/[0.03] px-4 py-2 text-sm font-medium text-foreground transition hover:bg-foreground/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    Essential only
                  </button>
                  <button
                    type="button"
                    onClick={openPreferences}
                    className="rounded-full px-3 py-2 text-sm font-medium text-foreground-muted transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    Customize
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!preferencesOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/55 p-3 backdrop-blur-sm sm:items-center sm:p-6">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="consent-preferences-title"
        aria-describedby="consent-preferences-description"
        className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border/80 bg-surface-elevated p-5 shadow-[var(--shadow-lg)] sm:p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">
              <ShieldCheck size={14} aria-hidden="true" /> Privacy controls
            </p>
            <h2 id="consent-preferences-title" className="mt-2 font-display text-2xl font-bold text-foreground">
              Privacy choices
            </h2>
            <p id="consent-preferences-description" className="mt-2 text-sm leading-relaxed text-foreground-muted">
              Choose which optional technologies SYNTV RADIO may use. Necessary storage is always active because it
              keeps the player and your saved preferences working.
            </p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={closePreferences}
            aria-label="Close privacy choices"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border text-foreground-muted transition hover:bg-foreground/[0.06] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X size={17} aria-hidden="true" />
          </button>
        </div>

        <div className="mt-5 space-y-3">
          <div className="rounded-xl border border-border/70 bg-background/35 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Necessary</h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Player volume, favorites, collections, theme, language, consent choice, and anonymous playback
                  session data needed to show live listener counts.
                </p>
              </div>
              <span className="rounded-full border border-border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Always on
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-border/70 bg-background/35 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Analytics</h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Would allow optional usage measurement. SYNTV RADIO does not currently run third-party analytics;
                  this choice applies if analytics are added later.
                </p>
              </div>
              <Toggle
                id="consent-analytics"
                label="Allow optional analytics"
                checked={privacySignal ? false : draft.analytics}
                disabled={privacySignal}
                onChange={(analytics) => setDraft((current) => ({ ...current, analytics }))}
              />
            </div>
          </div>

          <div className="rounded-xl border border-border/70 bg-background/35 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Advertising</h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Would allow advertising technologies, including cookies used by Google AdSense and its partners.
                  Advertising is not currently active; if enabled, this setting controls whether ad-related storage
                  may be used.
                </p>
              </div>
              <Toggle
                id="consent-advertising"
                label="Allow optional advertising"
                checked={privacySignal ? false : draft.advertising}
                disabled={privacySignal}
                onChange={(advertising) => setDraft((current) => ({ ...current, advertising }))}
              />
            </div>
          </div>
        </div>

        {privacySignal && (
          <p className="mt-4 rounded-xl border border-primary/20 bg-primary-soft/60 px-3 py-2 text-xs leading-relaxed text-foreground-muted">
            A browser privacy signal was detected. Optional analytics and advertising cannot be enabled from this
            browser.
          </p>
        )}

        <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
          For visitors in regions that require a Google-certified consent management platform for advertising, the
          site owner must configure that platform before ads are enabled. See our{" "}
          <Link href="/privacy-policy" className="text-primary hover:underline">
            Privacy Policy
          </Link>{" "}
          for details.
        </p>

        <div className="mt-5 flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={closePreferences}
            className="rounded-full border border-border bg-foreground/[0.03] px-4 py-2 text-sm font-medium text-foreground transition hover:bg-foreground/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => saveConsent(draft, "custom")}
            className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Save choices
          </button>
        </div>
      </div>
    </div>
  );
}
