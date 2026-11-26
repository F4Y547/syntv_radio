import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "SYNTV RADIO — Free World Radio",
    short_name: "SYNTV RADIO",
    description:
      "Listen to free live radio stations from around the world. Search by country, genre, and name with a premium 3D globe experience.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#080D13",
    theme_color: "#080D13",
    lang: "en",
    dir: "ltr",
    categories: ["music", "entertainment", "news"],
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
