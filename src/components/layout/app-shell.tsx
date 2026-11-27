"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Compass, Search, ListMusic, Globe2, Menu, X, Radio } from "lucide-react";
import { PlayerProvider } from "@/components/player/player-provider";
import { PlayerBar } from "@/components/player/player-bar";
import { ListenerCountsProvider } from "@/components/listeners/listener-counts-provider";
import { ThemeToggle } from "./theme-toggle";
import { CommandPalette } from "./command-palette";
import { KeyboardShortcuts } from "@/components/player/keyboard-shortcuts";
import { PwaRegister } from "./pwa-register";
import { InstallPrompt } from "./install-prompt";
import { LocaleProvider, useI18n } from "@/lib/i18n";
import { LanguageToggle } from "./language-toggle";
import { ConsentProvider, useConsent } from "@/lib/consent";
import { ConsentManager } from "@/components/consent/consent-manager";
import { AdSenseScript } from "@/components/ads/adsense-script";

const navItems = [
  { href: "/", icon: Compass, key: "discover" },
  { href: "/stations", icon: Radio, key: "stations" },
  { href: "/explore", icon: Globe2, key: "explore" },
  { href: "/#favorites", icon: Heart, key: "favorites" },
  { href: "/collections", icon: ListMusic, key: "collections" },
] as const;

function ShellContent({ children }: { children: React.ReactNode }) {
  const { t } = useI18n();
  const { openPreferences } = useConsent();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [menuPathname, setMenuPathname] = useState(pathname);
  const [copyrightYear, setCopyrightYear] = useState("");

  useEffect(() => {
    /* eslint-disable-next-line react-hooks/set-state-in-effect -- set the client-side copyright year after hydration */
    setCopyrightYear(String(new Date().getFullYear()));
  }, []);

  if (menuPathname !== pathname) {
    setMenuPathname(pathname);
    setMobileMenuOpen(false);
  }

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileMenuOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  const openSearch = () => document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true }));

  return (
      <div className="relative min-h-screen overflow-x-hidden pb-[calc(var(--player-height)+env(safe-area-inset-bottom,0px)+1rem)]">
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,color-mix(in_srgb,var(--color-primary)_14%,transparent),transparent_60%),radial-gradient(ellipse_50%_40%_at_85%_0%,color-mix(in_srgb,var(--color-live)_8%,transparent),transparent_55%)]"
        />
        <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 opacity-[0.35] [background-image:linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] [background-size:64px_64px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,black,transparent_70%)]" />
        <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-2xl supports-[backdrop-filter]:bg-background/55">
          <div className="container-page flex h-16 items-center justify-between gap-3">
            <Link href="/" className="group inline-flex w-fit shrink-0 items-center transition-opacity hover:opacity-95" aria-label="SYNTV RADIO home">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/syntv-radio-logo.svg?v=7"
                alt="SYNTV RADIO"
                className="block h-10 w-auto max-w-[160px] sm:h-12 sm:max-w-none [.light_&]:hidden"
                width="1140"
                height="395"
                decoding="async"
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/syntv-radio-logo-light.svg?v=7"
                alt=""
                aria-hidden="true"
                className="hidden h-10 w-auto max-w-[160px] sm:h-12 sm:max-w-none [.light_&]:block"
                width="1140"
                height="395"
                decoding="async"
              />
            </Link>

            <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
              {navItems.map(({ href, icon: Icon, key }) => (
                <Link
                  key={key}
                  href={href}
                  className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-foreground-muted transition hover:bg-foreground/[0.05] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Icon size={16} aria-hidden="true" />
                  <span>{t(key)}</span>
                </Link>
              ))}
              <button
                type="button"
                onClick={openSearch}
                className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-foreground-muted transition hover:bg-foreground/[0.05] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={t("openSearch")}
              >
                <Search size={16} aria-hidden="true" />
                <span className="hidden lg:inline">{t("search")}</span>
                <kbd className="hidden rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground xl:inline">Ctrl K</kbd>
              </button>
              <LanguageToggle />
              <ThemeToggle />
            </nav>

            <div className="flex items-center gap-1 md:hidden">
              <button
                type="button"
                onClick={openSearch}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full text-foreground-muted transition hover:bg-foreground/[0.05] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={t("openSearch")}
              >
                <Search size={18} aria-hidden="true" />
              </button>
              <ThemeToggle />
              <button
                type="button"
                onClick={() => setMobileMenuOpen((v) => !v)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-foreground/[0.03] text-foreground transition hover:bg-foreground/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
                aria-expanded={mobileMenuOpen}
                aria-controls="mobile-nav"
              >
                {mobileMenuOpen ? <X size={18} aria-hidden="true" /> : <Menu size={18} aria-hidden="true" />}
              </button>
            </div>
          </div>

          {mobileMenuOpen && (
            <div id="mobile-nav" className="border-t border-border/60 bg-background/95 backdrop-blur-2xl md:hidden">
              <nav aria-label="Mobile primary" className="container-page flex flex-col gap-1 py-3">
                {navItems.map(({ href, icon: Icon, key }) => (
                  <Link
                    key={key}
                    href={href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="inline-flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-foreground-muted transition hover:bg-foreground/[0.05] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Icon size={18} aria-hidden="true" />
                    <span>{t(key)}</span>
                  </Link>
                ))}
                <div className="mt-2 flex flex-col gap-1 border-t border-border/60 px-3 pt-3">
                  <p className="px-0 pb-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Information</p>
                  <Link
                    href="/about"
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-xl px-3 py-2.5 text-sm font-medium text-foreground-muted transition hover:bg-foreground/[0.05] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    About
                  </Link>
                  <Link
                    href="/faq"
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-xl px-3 py-2.5 text-sm font-medium text-foreground-muted transition hover:bg-foreground/[0.05] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    FAQ
                  </Link>
                  <Link
                    href="/contact"
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-xl px-3 py-2.5 text-sm font-medium text-foreground-muted transition hover:bg-foreground/[0.05] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    Contact
                  </Link>
                </div>
                <div className="mt-2 flex items-center justify-between border-t border-border/60 px-3 pt-3">
                  <span className="text-sm text-muted-foreground">{t("language")}</span>
                  <LanguageToggle />
                </div>
              </nav>
            </div>
          )}
        </header>
        <main className="container-page py-8 sm:py-10">{children}</main>
        <footer className="border-t border-border/60 py-10 text-sm text-muted-foreground">
          <div className="container-page grid gap-8 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
            <div>
              <p className="font-display text-base font-semibold text-foreground">SYNTV RADIO</p>
              <p className="mt-2 max-w-xs leading-relaxed">
                An independent directory and web player for live online radio. Discover stations by country, genre,
                language, and name. We do not operate the stations or host their streams.
              </p>
              <p className="mt-3 text-xs">
                <Link href="/about" className="text-primary hover:underline">About the project</Link>
              </p>
            </div>
            <div>
              <p className="font-semibold text-foreground">Explore</p>
              <ul className="mt-2 space-y-1.5">
                <li><Link href="/stations" className="hover:text-foreground">Station directory</Link></li>
                <li><Link href="/countries" className="hover:text-foreground">Countries</Link></li>
                <li><Link href="/genres" className="hover:text-foreground">Genres</Link></li>
                <li><Link href="/trending" className="hover:text-foreground">Trending</Link></li>
                <li><Link href="/explore" className="hover:text-foreground">World globe</Link></li>
                <li><Link href="/collections" className="hover:text-foreground">Collections</Link></li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-foreground">Information</p>
              <ul className="mt-2 space-y-1.5">
                <li><Link href="/about" className="hover:text-foreground">About</Link></li>
                <li><Link href="/faq" className="hover:text-foreground">FAQ</Link></li>
                <li><Link href="/contact" className="hover:text-foreground">Contact</Link></li>
                <li><Link href="/stats" className="hover:text-foreground">Your listening stats</Link></li>
                <li><Link href="/#favorites" className="hover:text-foreground">Favorites</Link></li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-foreground">Legal</p>
              <ul className="mt-2 space-y-1.5">
                <li><Link href="/privacy-policy" className="hover:text-foreground">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-foreground">Terms &amp; Conditions</Link></li>
                <li><Link href="/disclaimer" className="hover:text-foreground">Disclaimer</Link></li>
                <li>
                  <button
                    type="button"
                    onClick={openPreferences}
                    className="text-left hover:text-foreground focus-visible:outline-none focus-visible:underline"
                  >
                    Cookie preferences
                  </button>
                </li>
              </ul>
            </div>
          </div>
          <div className="container-page mt-8 flex flex-col gap-2 border-t border-border/50 pt-5 text-xs sm:flex-row sm:items-center sm:justify-between">
            <p>© {copyrightYear ? `${copyrightYear} ` : ""}SYNTV RADIO. All original site content is provided for radio discovery.</p>
            <p>
              Station names, logos, and streams belong to their respective owners.{" "}
              <Link href="/disclaimer" className="text-primary hover:underline">Read the disclaimer</Link>.
            </p>
          </div>
        </footer>
        <PlayerBar />
        <AdSenseScript />
        <ConsentManager />
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
      <ConsentProvider>
        <PlayerProvider>
          <ListenerCountsProvider>
            <ShellContent>{children}</ShellContent>
          </ListenerCountsProvider>
        </PlayerProvider>
      </ConsentProvider>
    </LocaleProvider>
  );
}
