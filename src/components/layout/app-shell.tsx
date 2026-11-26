"use client";

import Link from "next/link";
import { Heart, Compass, Search, BarChart3, ListMusic, Globe2 } from "lucide-react";
import { PlayerProvider } from "@/components/player/player-provider";
import { PlayerBar } from "@/components/player/player-bar";
import { ThemeToggle } from "./theme-toggle";
import { CommandPalette } from "./command-palette";
import { KeyboardShortcuts } from "@/components/player/keyboard-shortcuts";
import { PwaRegister } from "./pwa-register";
import { InstallPrompt } from "./install-prompt";
import { LocaleProvider, useI18n } from "@/lib/i18n";
import { LanguageToggle } from "./language-toggle";

function ShellContent({ children }: { children: React.ReactNode }) {
  const { t } = useI18n();
  return (
      <div className="relative min-h-screen overflow-x-hidden pb-[calc(var(--player-height)+1.5rem)]">
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,color-mix(in_srgb,var(--color-primary)_14%,transparent),transparent_60%),radial-gradient(ellipse_50%_40%_at_85%_0%,color-mix(in_srgb,var(--color-live)_8%,transparent),transparent_55%)]"
        />
        <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 opacity-[0.35] [background-image:linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] [background-size:64px_64px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,black,transparent_70%)]" />
        <header className="sticky top-0 z-40 border-b border-border/60 bg-background/60 backdrop-blur-2xl supports-[backdrop-filter]:bg-background/50">
          <div className="container-page flex h-16 items-center justify-between gap-4">
            <Link href="/" className="group inline-flex items-center transition-opacity hover:opacity-95" aria-label="SYNTV RADIO home">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/syntv-radio-logo.svg"
                alt="SYNTV RADIO"
                className="block h-10 w-auto sm:h-11 [.light_&]:hidden"
                width="760"
                height="180"
                decoding="async"
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/syntv-radio-logo-light.svg"
                alt=""
                aria-hidden="true"
                className="hidden h-10 w-auto sm:h-11 [.light_&]:block"
                width="760"
                height="180"
                decoding="async"
              />
            </Link>
            <nav aria-label="Primary" className="flex items-center gap-1 sm:gap-2">
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-foreground-muted transition hover:bg-foreground/[0.05] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Compass size={16} aria-hidden="true" />
                <span className="hidden sm:inline">{t("discover")}</span>
              </Link>
              <Link
                href="/#favorites"
                className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-foreground-muted transition hover:bg-foreground/[0.05] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Heart size={16} aria-hidden="true" />
                <span className="hidden sm:inline">{t("favorites")}</span>
              </Link>
              <Link
                href="/stats"
                className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-foreground-muted transition hover:bg-foreground/[0.05] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <BarChart3 size={16} aria-hidden="true" />
                <span className="hidden sm:inline">{t("stats")}</span>
              </Link>
              <Link
                href="/collections"
                className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-foreground-muted transition hover:bg-foreground/[0.05] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <ListMusic size={16} aria-hidden="true" />
                <span className="hidden sm:inline">{t("collections")}</span>
              </Link>
              <Link
                href="/explore"
                className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-foreground-muted transition hover:bg-foreground/[0.05] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Globe2 size={16} aria-hidden="true" />
                <span className="hidden sm:inline">{t("explore")}</span>
              </Link>
              <button
                type="button"
                onClick={() => document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true }))}
                className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-foreground-muted transition hover:bg-foreground/[0.05] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={t("openSearch")}
              >
                <Search size={16} aria-hidden="true" />
                <span className="hidden md:inline">{t("search")}</span>
                <kbd className="hidden rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground lg:inline">Ctrl K</kbd>
              </button>
              <LanguageToggle />
              <ThemeToggle />
            </nav>
          </div>
        </header>
        <main className="container-page py-8 sm:py-10">{children}</main>
        <PlayerBar />
        <CommandPalette />
        <KeyboardShortcuts />
        <PwaRegister />
        <InstallPrompt />
      </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <LocaleProvider>
      <PlayerProvider>
        <ShellContent>{children}</ShellContent>
      </PlayerProvider>
    </LocaleProvider>
  );
}
