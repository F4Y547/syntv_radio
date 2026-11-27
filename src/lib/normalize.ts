/**
 * Shared normalization helpers for public directory data.
 *
 * Radio Browser is community-maintained: country names can be verbose
 * ("The United Kingdom Of Great Britain And Northern Ireland") and tags can be
 * duplicated, generic, or concatenated ("entretenimientoradio"). Normalizing
 * at the data boundary keeps pages, URLs, and player labels consistent.
 */

const regionDisplayNames: Intl.DisplayNames | null = (() => {
  try {
    if (typeof Intl.DisplayNames === "function") {
      return new Intl.DisplayNames(["en"], { type: "region" });
    }
  } catch {
    // Older runtimes may not ship the Intl.DisplayNames API.
  }
  return null;
})();

const VERBOSE_COUNTRIES: ReadonlyArray<readonly [RegExp, string]> = [
  [/united kingdom of great britain and northern ireland/i, "United Kingdom"],
  [/russian federation/i, "Russia"],
  [/united states of america/i, "United States"],
  [/bolivarian republic of venezuela|venezuela, bolivarian republic of/i, "Venezuela"],
  [/plurinational state of bolivia|bolivia, plurinational state of/i, "Bolivia"],
  [/islamic republic of iran|iran, islamic republic of/i, "Iran"],
  [/democratic people.s republic of korea/i, "North Korea"],
  [/republic of korea|korea, republic of/i, "South Korea"],
  [/syrian arab republic/i, "Syria"],
  [/viet nam/i, "Vietnam"],
  [/united republic of tanzania|tanzania, united republic of/i, "Tanzania"],
  [/republic of moldova|moldova, republic of/i, "Moldova"],
  [/the democratic republic of the congo|congo, the democratic republic of the/i, "Congo (DRC)"],
];

const GENERIC_TAGS = new Set([
  "music",
  "musica",
  "musik",
  "radio",
  "radioonline",
  "onlineradio",
  "internetradio",
  "station",
  "radiostation",
  "estacion",
  "estacionderadio",
  "general",
  "various",
  "other",
  "mix",
  "online",
  "internet",
  "fm",
  "am",
]);

/** Community tags that are meaningful but need a stable English display form. */
const TAG_ALIASES: Record<string, string> = {
  entretenimiento: "Entertainment",
  entretenimientoradio: "Entertainment",
  entertainmentradio: "Entertainment",
  noticias: "News",
  informacion: "Information",
  informação: "Information",
  musicaenespanol: "Spanish Music",
  musicaespanola: "Spanish Music",
  hablada: "Talk",
  deportes: "Sports",
  deportivo: "Sports",
  clasica: "Classical",
  electronica: "Electronic",
  electronico: "Electronic",
  contemporanea: "Contemporary",
  jazzradio: "Jazz",
  rockradio: "Rock",
  popradio: "Pop",
  newstalk: "News Talk",
  newsradio: "News",
  top40: "Top 40",
};

/** Words that should not be capitalized in a multi-word label. */
const LOWERCASE_WORDS = new Set(["and", "of", "the", "de", "en", "y", "la", "el"]);

/** Tokens that are conventionally written with capitals. */
const ACRONYMS: Record<string, string> = {
  rb: "R&B",
  rnb: "R&B",
  kpop: "K-Pop",
  hiphop: "Hip Hop",
  npr: "NPR",
  bbc: "BBC",
  abc: "ABC",
  cnn: "CNN",
  hitz: "Hitz",
};

const COMPOUND_SUFFIXES = [
  "radio",
  "music",
  "musica",
  "station",
  "news",
  "talk",
  "hits",
  "online",
  "entertainment",
  "entretenimiento",
] as const;

function titleCase(value: string): string {
  const words = value.trim().split(/\s+/).filter(Boolean);
  return words
    .map((word, index) => {
      const key = word.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (ACRONYMS[key]) return ACRONYMS[key];
      if (index > 0 && LOWERCASE_WORDS.has(key)) return key;
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}

function splitTagParts(raw: string): string[] {
  const spaced = raw
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z])([A-Z][a-z])/g, "$1 $2")
    .replace(/[_\/|,;:.]+/g, " ")
    .trim();

  const parts: string[] = [];
  for (const word of spaced.split(/\s+/).filter(Boolean)) {
    const compact = word.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (!compact) continue;

    let matched = false;
    for (const suffix of COMPOUND_SUFFIXES) {
      if (
        compact.length > suffix.length + 3 &&
        compact.endsWith(suffix)
      ) {
        parts.push(compact.slice(0, -suffix.length));
        parts.push(suffix);
        matched = true;
        break;
      }
    }
    if (!matched) parts.push(compact);
  }
  return parts;
}

/** Returns a clean, human-readable country name for a directory record. */
export function normalizeCountryName(name: string, code?: string): string {
  const trimmed = String(name ?? "").trim();
  const upperCode = String(code ?? "").trim().toUpperCase();
  if (!trimmed && !upperCode) return "";

  if (/^[A-Z]{2}$/.test(upperCode) && regionDisplayNames) {
    try {
      const resolved = regionDisplayNames.of(upperCode);
      if (resolved && resolved !== upperCode && !/^\d+$/.test(resolved)) {
        return resolved;
      }
    } catch {
      // Fall through to the string-based normalization below.
    }
  }

  for (const [pattern, replacement] of VERBOSE_COUNTRIES) {
    if (pattern.test(trimmed)) return replacement;
  }

  const withoutArticle = trimmed.replace(/^the\s+/i, "");
  const withoutVerboseSuffix = withoutArticle.replace(/\s+of\s+(great|the|northern|america).*$/i, "");
  const cleaned = withoutVerboseSuffix.replace(/[,]+/g, " ").replace(/\s+/g, " ").trim();
  return titleCase(cleaned || trimmed || upperCode || "Unknown");
}

/**
 * Returns a clean tag label, or `null` when the tag is generic/noisy.
 * Ambiguous compound tags are split and each meaningful part is kept.
 */
export function normalizeTag(raw: string): string | null {
  const trimmed = String(raw ?? "").trim();
  if (!trimmed) return null;

  const parts = splitTagParts(trimmed);
  const labels: string[] = [];
  for (const part of parts) {
    const key = part.toLowerCase().replace(/[^a-z0-9]/g, "");
    const alias = TAG_ALIASES[key];
    const label = alias ?? titleCase(part);
    if (!label || GENERIC_TAGS.has(key)) continue;
    if (label.length > 40) continue;
    if (!labels.some((existing) => existing.toLowerCase() === label.toLowerCase())) {
      labels.push(label);
    }
  }
  return labels.length > 0 ? labels.join(" ") : null;
}

/** Deduplicates tags case-insensitively after normalizing each label. */
export function normalizeTags(tags: Iterable<string | null | undefined>): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const tag of tags) {
    const label = normalizeTag(tag ?? "");
    if (!label) continue;
    const key = label.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(label);
  }
  return result;
}

/** Normalizes country records and merges duplicates from the source directory. */
export function normalizeCountries<T extends { name: string; code: string; stationCount: number }>(
  countries: Iterable<T>,
): T[] {
  const byCode = new Map<string, T>();
  for (const country of countries) {
    const code = String(country.code ?? "").trim().toUpperCase();
    const name = normalizeCountryName(country.name, code);
    const key = code || name.toLowerCase();
    const existing = byCode.get(key);
    if (existing) {
      existing.stationCount += country.stationCount;
      continue;
    }
    byCode.set(key, { ...country, code, name });
  }
  return [...byCode.values()];
}

/** Normalizes tag/count records, merging case variants from community data. */
export function normalizeTagCounts<T extends { name: string; stationCount: number }>(
  tags: Iterable<T>,
): T[] {
  const byName = new Map<string, T>();
  for (const tag of tags) {
    const name = normalizeTag(tag.name);
    if (!name) continue;
    const key = name.toLowerCase();
    const existing = byName.get(key);
    if (existing) {
      existing.stationCount += tag.stationCount;
      continue;
    }
    byName.set(key, { ...tag, name });
  }
  return [...byName.values()];
}

/** Safe display helper for tags that may still be raw in cached snapshots. */
export function displayTag(raw: string): string {
  return normalizeTag(raw) ?? titleCase(String(raw ?? "")) ?? "";
}
