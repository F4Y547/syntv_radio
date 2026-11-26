import type { Metadata, Viewport } from "next";
import { Manrope, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/layout/app-shell";

const siteUrl = "https://syntv.online";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#080D13" },
    { media: "(prefers-color-scheme: light)", color: "#F5F7FA" },
  ],
  colorScheme: "dark light",
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "SYNTV RADIO — Free World Radio",
    template: "%s | SYNTV RADIO",
  },
  description:
    "Listen to free live radio stations from around the world on SYNTV RADIO. Discover global music, news, and talk with fast search, favorites, 3D globe exploration, and resilient playback.",
  applicationName: "SYNTV RADIO",
  keywords: [
    "SYNTV RADIO",
    "world radio",
    "online radio",
    "live radio",
    "free radio stations",
    "internet radio",
    "global radio",
    "listen to radio online",
    "radio by country",
    "radio by genre",
  ],
  authors: [{ name: "SYNTV RADIO", url: siteUrl }],
  creator: "SYNTV RADIO",
  publisher: "SYNTV RADIO",
  category: "music",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "SYNTV RADIO",
    title: "SYNTV RADIO — Free World Radio",
    description:
      "Discover and listen to free live radio stations from around the world. Search by country, genre, and name with a premium 3D globe experience.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "SYNTV RADIO — Free World Radio",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SYNTV RADIO — Free World Radio",
    description:
      "Listen to free live radio stations worldwide. Search, explore by country, save favorites, and play instantly.",
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    shortcut: ["/icon.svg"],
    apple: [{ url: "/icon.svg", type: "image/svg+xml" }],
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "SYNTV RADIO",
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
  },
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "SYNTV RADIO",
  alternateName: "SYNTV",
  url: siteUrl,
  description:
    "Listen to free live radio stations from around the world with search, favorites, collections, and 3D globe exploration.",
  inLanguage: ["en", "es"],
  potentialAction: {
    "@type": "SearchAction",
    target: `${siteUrl}/?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "SYNTV RADIO",
  url: siteUrl,
  logo: `${siteUrl}/icon.svg`,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${manrope.variable} ${spaceGrotesk.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="min-h-full bg-background text-foreground antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
