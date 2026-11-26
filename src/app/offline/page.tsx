"use client";

import Link from "next/link";
import { WifiOff } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export default function OfflinePage() {
  const { t } = useI18n();
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-soft text-primary">
        <WifiOff size={30} aria-hidden="true" />
      </div>
      <h1 className="mt-6 font-display text-3xl font-bold text-foreground">{t("youreOffline")}</h1>
      <p className="mt-3 max-w-md text-foreground-muted">{t("offlineDesc")}</p>
      <Link href="/" className="mt-6 inline-flex rounded-full bg-primary px-5 py-3 font-semibold text-primary-foreground hover:bg-primary-hover">
        {t("goToDiscover")}
      </Link>
    </div>
  );
}
