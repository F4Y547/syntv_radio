"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Compass,
  Ellipsis,
  Globe2,
  Heart,
  House,
  Info,
  ListMusic,
  Mail,
  Radio,
  Search,
  Shield,
  FileText,
  BookOpen,
  Send,
  Clock3,
  X,
  ChevronRight,
} from "lucide-react";
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
import { useFocusTrap } from "@/lib/use-focus-trap";

const desktopNavItems = [
  { href: "/", icon: Compass, key: "discover" },
  { href: "/stations", icon: Radio, key: "stations" },
  { href: "/explore", icon: Globe2, key: "explore" },
  { href: "/#favorites", icon: Heart, key: "favorites" },
  { href: "/collections", icon: ListMusic, key: "collections" },
] as const;

const mobileNavItems = [
  { href: "/", icon: House, label: "Home" },
  { href: "/explore", icon: Compass, label: "Explore" },
  { href: "/stations", icon: Radio, label: "Stations" },
  { href: "/#favorites", icon: Heart, label: "Favorites" },
  { href: "#more", icon: Ellipsis, label: "More" },
] as const;

const moreLinks = [
  { href: "/countries", icon: Globe2, label: "Countries" },
  { href: "/genres", icon: ListMusic, label: "Genres" },
  { href: "/#recents", icon: Clock3, label: "Recently played" },
  { href: "/contact", icon: Mail, label: "Contact" },
  { href: "/guides", icon: BookOpen, label: "Radio guides" },
  { href: "/submit", icon: Send, label: "Submit a station" },
  { href: "/about", icon: Info, label: "About" },
  { href: "/privacy-policy", icon: Shield, label: "Privacy policy" },
  { href: "/terms", icon: FileText, label: "Terms and conditions" },
];

function isNavActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href.startsWith("/#")) return pathname === "/" && false;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function ShellContent({
  children,
  publicContactEmail,
}: {
  children: React.ReactNode;
  publicContactEmail: string | null;
}) {
  const { t } = useI18n();
  const { openPreferences } = useConsent();
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const [morePathname, setMorePathname] = useState(pathname);
  const [hash, setHash] = useState("");
  const [copyrightYear, setCopyrightYear] = useState("");
  const moreRef = useRef<HTMLDivElement | null>(null);
  useFocusTrap(moreOpen, moreRef);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- set the client-side copyright year after hydration
    setCopyrightYear(String(new Date().getFullYear()));
  }, []);

  useEffect(() => {
    const syncHash = () => setHash(window.location.hash);
     
    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, []);

  useEffect(() => {
    const syncHash = () => setHash(window.location.hash);
     
    syncHash();
  }, [pathname]);

  if (morePathname !== pathname) {
    setMorePathname(pathname);
    setMoreOpen(false);
  }

  useEffect(() => {
    if (!moreOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMoreOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = window.setTimeout(() => moreRef.current?.querySelector<HTMLElement>('button[aria-label="Close menu"]')?.focus(), 0);
    return () => {
      window.clearTimeout(t);
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prev;
    };
  }, [moreOpen]);

  const openSearch = () => document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true }));

  const mobileActive = (href: string) => {
    if (href === "#more") return moreOpen;
    if (href === "/#favorites") return pathname === "/" && hash === "#favorites";
    return isNavActive(pathname, href);
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden pb-[calc(var(--player-height)+var(--mobile-nav-height)+env(safe-area-inset-bottom,0px)+0.75rem)]">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary-foreground focus:outline-none"
      >
        Skip to content
      </a>
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,color-mix(in_srgb,var(--color-primary)_14%,transparent),transparent_60%),radial-gradient(ellipse_50%_40%_at_85%_0%,color-mix(in_srgb,var(--color-live)_8%,transparent),transparent_55%)]"
      />
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 opacity-[0.35] [background-image:linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] [background-size:64px_64px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,black,transparent_70%)]" />

      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-2xl supports-[backdrop-filter]:bg-background/55">
        <div className="container-page flex h-14 items-center justify-between gap-3 sm:h-16">
          <Link href="/" className="group inline-flex w-fit shrink-0 items-center transition-opacity hover:opacity-95" aria-label="SYNTV RADIO home">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/syntv-radio-logo.svg?v=7"
              alt="SYNTV RADIO"
              className="block h-9 w-auto max-w-[140px] sm:h-12 sm:max-w-none [.light_&]:hidden"
              width="1140"
              height="395"
              decoding="async"
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/syntv-radio-logo-light.svg?v=7"
              alt=""
              aria-hidden="true"
              className="hidden h-9 w-auto max-w-[140px] sm:h-12 sm:max-w-none [.light_&]:block"
              width="1140"
              height="395"
              decoding="async"
            />
          </Link>

          <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
            {desktopNavItems.map(({ href, icon: Icon, key }) => (
              <Link
                key={key}
                href={href}
                className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition hover:bg-foreground/[0.05] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${isNavActive(pathname, href) ? "bg-primary-soft text-primary" : "text-foreground-muted"}`}
              >
                <Icon size={16} aria-hidden="true" />
                <span>{t(key)}</span>
              </Link>
            ))}
            <button
              type="button"
              onClick={openSearch}
              className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-foreground-muted transition hover:bg-foreground/[0.05] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
              className="inline-flex h-11 w-11 items-center justify-center rounded-full text-foreground-muted transition hover:bg-foreground/[0.05] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={t("openSearch")}
            >
              <Search size={20} aria-hidden="true" />
            </button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main id="main-content" tabIndex={-1} className="container-page py-6 sm:py-8 lg:py-10">{children}</main>

      <footer className="border-t border-border/60 py-10 pb-[calc(2.5rem+var(--mobile-nav-height))] text-sm text-muted-foreground md:pb-10">
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
              <li><Link href="/guides" className="hover:text-foreground">Radio guides</Link></li>
              <li><Link href="/faq" className="hover:text-foreground">FAQ</Link></li>
              <li><Link href="/submit" className="hover:text-foreground">Submit a station</Link></li>
              <li><Link href="/contact" className="hover:text-foreground">Contact</Link></li>
              {publicContactEmail ? (
                <li>
                  <a href={`mailto:${publicContactEmail}`} className="hover:text-foreground">{publicContactEmail}</a>
                </li>
              ) : null}
              <li><Link href="/stats" className="hover:text-foreground">Your listening stats</Link></li>
              <li><Link href="/#favorites" className="hover:text-foreground">Favorites</Link></li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-foreground">Legal</p>
            <ul className="mt-2 space-y-1.5">
              <li><Link href="/privacy" className="hover:text-foreground">Privacy</Link></li>
              <li><Link href="/privacy-policy" className="hover:text-foreground">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-foreground">Terms &amp; DMCA</Link></li>
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

      {/* Mobile bottom navigation */}
      <nav
        aria-label="Mobile navigation"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-background/85 pb-[env(safe-area-inset-bottom,0px)] backdrop-blur-2xl supports-[backdrop-filter]:bg-background/75 md:hidden"
      >
        <div className="mx-auto grid h-[var(--mobile-nav-height)] max-w-lg grid-cols-5 px-2">
          {mobileNavItems.map(({ href, icon: Icon, label }) => {
            const active = mobileActive(href);
            const commonClass = `relative flex min-h-[44px] flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-[11px] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${active ? "text-primary" : "text-muted-foreground hover:text-foreground"}`;
            const iconWrap = `inline-flex h-8 w-12 items-center justify-center rounded-full transition ${active ? "bg-primary-soft shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-primary)_20%,transparent)]" : ""}`;
            if (href === "#more") {
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => setMoreOpen((v) => !v)}
                  className={commonClass}
                  aria-label="More navigation options"
                  aria-expanded={moreOpen}
                  aria-haspopup="dialog"
                >
                  <span className={iconWrap}><Icon size={20} aria-hidden="true" /></span>
                  <span>{label}</span>
                </button>
              );
            }
            return (
              <Link key={label} href={href} className={commonClass} aria-current={active ? "page" : undefined}>
                <span className={iconWrap}><Icon size={20} aria-hidden="true" /></span>
                <span>{label}</span>
                {active && <span className="absolute top-1 h-1 w-1 rounded-full bg-primary" aria-hidden="true" />}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* More drawer */}
      {moreOpen && (
        <div className="fixed inset-0 z-[60] md:hidden" role="dialog" aria-modal="true" aria-label="More navigation">
          <button
            type="button"
            className="absolute inset-0 bg-black/45 backdrop-blur-sm"
            aria-label="Close menu"
            onClick={() => setMoreOpen(false)}
          />
          <div ref={moreRef} className="absolute inset-x-0 bottom-0 max-h-[min(80vh,36rem)] overflow-y-auto rounded-t-[1.75rem] border-t border-border/70 bg-background/95 pb-[calc(env(safe-area-inset-bottom,0px)+1rem)] shadow-[var(--shadow-lg)] backdrop-blur-2xl animate-player-rise">
            <div className="sticky top-0 z-10 bg-background/95 px-5 pb-3 pt-3 backdrop-blur-2xl">
              <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-foreground/20" aria-hidden="true" />
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-display text-lg font-semibold text-foreground">More</p>
                  <p className="text-sm text-muted-foreground">Browse and manage SYNTV RADIO</p>
                </div>
                <button
                  type="button"
                  onClick={() => setMoreOpen(false)}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-foreground/[0.03] text-foreground-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Close menu"
                >
                  <X size={20} aria-hidden="true" />
                </button>
              </div>
            </div>
            <div className="space-y-1 px-4 pb-2">
              {moreLinks.map(({ href, icon: Icon, label }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMoreOpen(false)}
                  className="flex min-h-[48px] items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-foreground-muted transition hover:bg-foreground/[0.05] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border/70 bg-foreground/[0.03] text-primary">
                    <Icon size={18} aria-hidden="true" />
                  </span>
                  <span className="flex-1">{label}</span>
                  <ChevronRight size={16} className="text-muted-foreground" aria-hidden="true" />
                </Link>
              ))}
              <button
                type="button"
                onClick={() => { setMoreOpen(false); openPreferences(); }}
                className="flex min-h-[48px] w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-foreground-muted transition hover:bg-foreground/[0.05] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border/70 bg-foreground/[0.03] text-primary">
                  <Shield size={18} aria-hidden="true" />
                </span>
                <span className="flex-1">Cookie preferences</span>
                <ChevronRight size={16} className="text-muted-foreground" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      )}

      <AdSenseScript />
      <ConsentManager />
      <CommandPalette />
      <KeyboardShortcuts />
      <PwaRegister />
      <InstallPrompt />
    </div>
  );
}

export function AppShell({
  children,
  publicContactEmail = null,
}: {
  children: React.ReactNode;
  publicContactEmail?: string | null;
}) {
  return (
    <LocaleProvider>
      <ConsentProvider>
        <PlayerProvider>
          <ListenerCountsProvider>
            <ShellContent publicContactEmail={publicContactEmail}>{children}</ShellContent>
          </ListenerCountsProvider>
        </PlayerProvider>
      </ConsentProvider>
    </LocaleProvider>
  );
}