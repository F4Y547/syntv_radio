import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Offline",
  description: "SYNTV RADIO needs an internet connection to load live radio streams.",
  alternates: {
    canonical: "/offline",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function OfflineLayout({ children }: { children: React.ReactNode }) {
  return children;
}
