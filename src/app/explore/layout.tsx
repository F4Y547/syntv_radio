import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Explore World Radio by Country",
  description:
    "Explore live radio stations by country on SYNTV RADIO. Use the interactive 3D globe to discover stations around the world and start listening instantly.",
  alternates: {
    canonical: "/explore",
  },
  openGraph: {
    title: "Explore World Radio by Country | SYNTV RADIO",
    description:
      "Browse live radio stations by country with an interactive 3D globe on SYNTV RADIO.",
    url: "/explore",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "SYNTV RADIO Explore" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Explore World Radio by Country | SYNTV RADIO",
    description:
      "Browse live radio stations by country with an interactive 3D globe on SYNTV RADIO.",
    images: ["/opengraph-image"],
  },
};

export default function ExploreLayout({ children }: { children: React.ReactNode }) {
  return children;
}
