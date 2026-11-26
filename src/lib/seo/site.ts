export const siteUrl = "https://syntv.online";
export const siteName = "SYNTV RADIO";
export const siteDescription =
  "Discover and listen to live online radio stations from around the world. Explore radio stations by country, music genre, and category on SYNTV RADIO.";
export const defaultOgImage = "/opengraph-image";

export function absoluteUrl(path: string) {
  if (path.startsWith("http")) return path;
  return `${siteUrl}${path.startsWith("/") ? path : `/${path}`}`;
}
