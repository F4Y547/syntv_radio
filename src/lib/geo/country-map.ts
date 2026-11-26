export interface CountryStat {
  name: string;
  code: string;
  stationCount: number;
}

export interface CountryFeatureProperties {
  ISO_A2?: string;
  ISO_A2_EH?: string;
  ADMIN?: string;
  NAME?: string;
  [key: string]: unknown;
}

export interface CountryFeature {
  type: "Feature";
  properties: CountryFeatureProperties;
  geometry: unknown;
}

export interface CountryFeatureCollection {
  type: "FeatureCollection";
  features: CountryFeature[];
}

const CODE_OVERRIDES: Record<string, string> = {
  "FRANCE": "FR",
  "NORWAY": "NO",
  "KOSOVO": "XK",
};

export function getFeatureCode(feature: CountryFeature): string {
  const p = feature.properties || {};
  let code = String(p.ISO_A2_EH || p.ISO_A2 || "").toUpperCase();
  if (!code || code === "-99") {
    const name = String(p.ADMIN || p.NAME || "").toUpperCase();
    code = CODE_OVERRIDES[name] || "";
  }
  return code;
}

export function joinCountriesToFeatures(
  features: CountryFeature[],
  countries: CountryStat[],
) {
  const byCode = new Map(countries.map((c) => [c.code.toUpperCase(), c]));
  return features.map((f) => {
    const code = getFeatureCode(f);
    const stat = code ? byCode.get(code) : undefined;
    return {
      ...f,
      properties: {
        ...f.properties,
        __code: code,
        __name: stat?.name || f.properties.ADMIN || f.properties.NAME || code,
        __stationCount: stat?.stationCount ?? 0,
        __hasStations: Boolean(stat && stat.stationCount > 0),
      },
    };
  });
}
