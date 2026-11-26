import type { Metadata } from "next";
import Link from "next/link";
import { Radio } from "lucide-react";

export const metadata: Metadata = {
  title: "Page Not Found",
  robots: {
    index: false,
    follow: false,
  },
};

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-soft text-primary">
        <Radio size={30} aria-hidden="true" />
      </div>
      <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">404</p>
      <h1 className="mt-2 font-display text-3xl font-bold text-foreground">Page not found</h1>
      <p className="mt-3 max-w-md text-foreground-muted">
        The page you’re looking for doesn’t exist or has moved. Explore live radio stations from around the world on SYNTV RADIO.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex rounded-full bg-primary px-5 py-3 font-semibold text-primary-foreground hover:bg-primary-hover"
      >
        Go to Discover
      </Link>
    </div>
  );
}
