"use client";

import { Languages } from "lucide-react";
import { useI18n, type Locale } from "@/lib/i18n";

const labels: Record<Locale, string> = { en: "EN", es: "ES" };

export function LanguageToggle() {
  const { locale, setLocale, t } = useI18n();
  const next: Locale = locale === "en" ? "es" : "en";

  return (
    <button
      type="button"
      onClick={() => setLocale(next)}
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-foreground-muted transition hover:bg-foreground/[0.05] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      aria-label={`${t("language")}: ${labels[locale]}`}
      title={t("language")}
    >
      <Languages size={16} aria-hidden="true" />
      <span className="hidden sm:inline">{labels[locale]}</span>
    </button>
  );
}
