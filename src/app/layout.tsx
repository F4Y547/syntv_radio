import type { Metadata, Viewport } from "next";
import { Manrope, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/layout/app-shell";
import { AdsProvider } from "@/components/ads/ads-provider";
import { getAdsConfig } from "@/lib/ads/config";

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

const googleVerification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION;
const bingVerification = process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "SYNTV RADIO — Listen to Live Online Radio Stations Worldwide",
    template: "%s | SYNTV RADIO",
  },
  description:
    "Discover and listen to live online radio stations from around the world. Explore radio stations by country, music genre, and category on SYNTV RADIO.",
  applicationName: "SYNTV RADIO",
  other: {
    "google-adsense-account": "ca-pub-6652257842391620",
  },
  keywords: [
    "SYNTV RADIO",
    "online radio",
    "live radio stations",
    "listen to radio online",
    "internet radio directory",
    "radio stations by country",
    "radio stations by genre",
    "international radio stations",
    "free radio",
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
    title: "SYNTV RADIO — Listen to Live Online Radio Stations Worldwide",
    description:
      "Discover and listen to live online radio stations from around the world. Explore stations by country, genre, and category.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "SYNTV RADIO — Listen to Live Online Radio Stations Worldwide",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SYNTV RADIO — Listen to Live Online Radio Stations Worldwide",
    description:
      "Discover and listen to live online radio stations from around the world on SYNTV RADIO.",
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
  verification: {
    ...(googleVerification ? { google: googleVerification } : {}),
    ...(bingVerification ? { other: { "msvalidate.01": bingVerification } } : {}),
  },
  icons: {
    icon: [
      { url: "/favicon.ico", type: "image/x-icon", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/icons/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    shortcut: ["/favicon.ico"],
    apple: [{ url: "/icons/apple-icon-180.png", sizes: "180x180", type: "image/png" }],
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
  logo: `${siteUrl}/icons/icon-512.png`,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const ads = getAdsConfig();
  return (
    <html
      lang="en"
      className={`${manrope.variable} ${spaceGrotesk.variable} h-full`}
      suppressHydrationWarning
    >
      <head>
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6652257842391620"
          crossOrigin="anonymous"
        ></script>
      </head>
      <body className="min-h-full bg-background text-foreground antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <AdsProvider
          value={{
            enabled: ads.enabled,
            clientId: ads.clientId,
            slots: ads.slots,
          }}
        >
          <AppShell>{children}</AppShell>
        </AdsProvider>
      </body>
    </html>
  );
}
