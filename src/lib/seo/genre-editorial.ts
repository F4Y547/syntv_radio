import { genreSlug } from "./slugs";

export interface GenreEditorial {
  /** Original explanatory copy shown above the station sample. */
  summary: string;
  /** Broad or non-genre source labels stay browsable but are kept out of the index. */
  indexable?: boolean;
}

/**
 * Hand-written context for community tags that are broad, ambiguous, or not
 * musical genres. The text explains the directory label itself; it does not
 * invent facts about any station or its programming.
 */
const EDITORIAL: Record<string, GenreEditorial> = {
  music: {
    summary:
      "“Music” is a broad community tag, not one sound. Treat this page as a starting point, then narrow your listening with a format or language tag such as pop, jazz, rock, classical, or música en español.",
  },
  radio: {
    summary:
      "“Radio” is a catch-all label in the source directory rather than a musical genre. It is useful for a wide browse, but country and format pages are better when you want something specific.",
    indexable: false,
  },
  estacion: {
    summary:
      "“Estación” is a Spanish catch-all label in the source directory. It groups generically tagged stations and is not a musical style; use a country or language page for a narrower browse.",
    indexable: false,
  },
  fm: {
    summary:
      "“FM” describes a broadcast band in community metadata. It does not tell you a stream's bitrate, codec, or online availability, so check the stream information on each listing.",
    indexable: false,
  },
  america: {
    summary:
      "“America” is a regional label in community tags, not a music genre. For precise location browsing use the country directory; the stations below are grouped only because the source directory used this broad label.",
    indexable: false,
  },
  norteamerica: {
    summary:
      "“Norteamérica” is a regional community label, not a music genre. Use the country directory when you need a specific country rather than a broad regional grouping.",
    indexable: false,
  },
  latinoamerica: {
    summary:
      "“Latinoamérica” is a regional community label, not a music genre. It is retained here for browsing; country and language pages provide a more precise way to explore.",
    indexable: false,
  },
  "moi-merino": {
    summary:
      "This label appears in the source directory's community tags. It is not a standardized music genre, so this page is kept for browsing but is not presented as a curated genre guide.",
    indexable: false,
  },
  information: {
    summary:
      "“Information” is a content-type label used by community contributors. Stations tagged this way may cover news, talk, or public information; the tag is not a music format.",
  },
  "news-talk": {
    summary:
      "“News talk” combines two content types in community tagging. This page is a mixed sample of stations labelled for news or spoken-word programming rather than a single music style.",
  },
  local: {
    summary:
      "“Local” is a descriptive source tag rather than a genre. It can refer to community or regional broadcasters; see each listing for its own metadata.",
  },
  "local-radio": {
    summary:
      "“Local radio” is a descriptive community tag for stations that identify with a local area. It is not a music genre, and the sample below reflects the source directory's labelling.",
  },
  "local-news": {
    summary:
      "“Local news” is a content-type label, not a music genre. Use it to browse stations tagged for local reporting, then check the individual listing for location and language.",
  },
  "community-radio": {
    summary:
      "“Community radio” describes how a station identifies itself in source metadata. It is not a musical format; the stations below share that label, not necessarily a sound.",
  },
  "public-radio": {
    summary:
      "“Public radio” is a source-directory label for public-service broadcasters. It is not a music genre, and public-service status is reported by the directory rather than assessed by SYNTV RADIO.",
  },
  regional: {
    summary:
      "“Regional” is a broad descriptive tag in community metadata. It usually indicates a regional focus rather than one specific musical style, so use related tags for a narrower listen.",
  },
  variety: {
    summary:
      "“Variety” is a community tag for stations that describe a mixed format. It does not promise a particular playlist, and the station's own details remain the best guide.",
  },
  country: {
    summary:
      "“Country” can be used for country music or as a geographic description in community tags. This page follows the source directory's label; check individual listings to see how each station is described.",
  },
  hits: {
    summary:
      "“Hits” is a broad playlist label used by community contributors. It is not a formal genre and can cover several popular-music styles.",
  },
  "top-40": {
    summary:
      "“Top 40” is a chart-format label in community tags. It describes a programming style rather than a single sound, and station charts are not published by SYNTV RADIO.",
  },
  entretenimiento: {
    summary:
      "“Entretenimiento” is a Spanish community tag for general entertainment programming. It is not a music genre; check each listing for its own tags and language.",
  },
  espanol: {
    summary:
      "“Español” is a language label in the source directory. It groups stations by the language reported in community metadata, not by a single musical style.",
  },
  musica: {
    summary:
      "“Música” is the Spanish equivalent of the broad “music” tag. Use it as a starting point for Spanish-labelled listings, then try a more specific language or format page.",
  },
  noticias: {
    summary:
      "“Noticias” is a Spanish content tag for news programming. It is not a musical genre; the listings below are grouped by the source directory's label.",
  },
};

export function getGenreEditorial(name: string): GenreEditorial | undefined {
  return EDITORIAL[genreSlug(name)];
}

export function isIndexableGenre(name: string): boolean {
  return getGenreEditorial(name)?.indexable !== false;
}
