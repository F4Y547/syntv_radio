import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Collections",
  description:
    "Create and manage custom radio station collections on SYNTV RADIO. Save, organize, export, and share your favorite stations locally.",
  alternates: {
    canonical: "/collections",
  },
  openGraph: {
    title: "Collections | SYNTV RADIO",
    description:
      "Build and manage custom radio station collections on SYNTV RADIO.",
    url: "/collections",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "SYNTV RADIO Collections" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Collections | SYNTV RADIO",
    description:
      "Build and manage custom radio station collections on SYNTV RADIO.",
    images: ["/opengraph-image"],
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function CollectionsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
