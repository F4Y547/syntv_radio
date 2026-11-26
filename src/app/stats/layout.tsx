import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Listening Stats",
  description:
    "View your local SYNTV RADIO listening stats, including favorites, recently played stations, listening time, and top countries and genres.",
  alternates: {
    canonical: "/stats",
  },
  openGraph: {
    title: "Listening Stats | SYNTV RADIO",
    description:
      "Track your local listening activity on SYNTV RADIO, including favorites, recents, and top genres.",
    url: "/stats",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "SYNTV RADIO Stats" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Listening Stats | SYNTV RADIO",
    description:
      "Track your local listening activity on SYNTV RADIO.",
    images: ["/opengraph-image"],
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function StatsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
