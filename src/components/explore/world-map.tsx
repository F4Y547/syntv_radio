"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";

interface Country { name: string; code: string; stationCount: number }

// Approximate [lat, lng] for common country codes; fallback places near center.
const COORDS: Record<string, [number, number]> = {
  US: [39, -98], GB: [54, -2], DE: [51, 10], FR: [46, 2], ES: [40, -4], IT: [42, 12], BR: [-14, -52],
  CA: [56, -106], AU: [-25, 133], RU: [61, 105], CN: [35, 105], JP: [36, 138], IN: [21, 79], MX: [23, -102],
  AR: [-38, -64], ZA: [-30, 25], NG: [10, 8], EG: [26, 30], TR: [39, 35], NL: [52, 5], SE: [62, 15],
  NO: [64, 8], PL: [52, 20], UA: [49, 32], GR: [39, 22], PT: [39, -8], CH: [47, 8], AT: [47, 13],
  BE: [50, 4], IE: [53, -8], DK: [56, 10], FI: [64, 26], CZ: [50, 15], RO: [46, 25], HU: [47, 20],
  CL: [-35, -71], CO: [4, -72], PE: [-10, -76], KR: [36, 128], TH: [15, 101], ID: [-5, 120], PH: [13, 122],
  MY: [4, 112], SG: [1.3, 103.8], NZ: [-41, 174], IL: [31, 35], SA: [24, 45], AE: [24, 54], PK: [30, 70],
  BD: [24, 90], VN: [16, 108], KE: [0, 38], MA: [32, -6], DZ: [28, 2], HR: [45, 16], RS: [44, 21],
};

function project(lat: number, lng: number, w: number, h: number) {
  const x = ((lng + 180) / 360) * w;
  const y = ((90 - lat) / 180) * h;
  return [x, y] as const;
}

export function WorldMap({ countries }: { countries: Country[] }) {
  const { t } = useI18n();
  const w = 1000;
  const h = 500;
  const max = Math.max(1, ...countries.map((c) => c.stationCount));

  return (
    <div className="rounded-2xl border border-border bg-surface/30 p-4">
      <svg viewBox={`0 0 ${w} ${h}`} className="h-auto w-full" role="img" aria-label="World station map">
        <rect x="0" y="0" width={w} height={h} fill="transparent" />
        {[...Array(7)].map((_, i) => (
          <line key={`h${i}`} x1="0" y1={(i * h) / 6} x2={w} y2={(i * h) / 6} stroke="var(--color-border)" />
        ))}
        {[...Array(13)].map((_, i) => (
          <line key={`v${i}`} x1={(i * w) / 12} y1="0" x2={(i * w) / 12} y2={h} stroke="var(--color-border)" />
        ))}
        {countries.slice(0, 80).map((c) => {
          const [lat, lng] = COORDS[c.code.toUpperCase()] ?? [20, 0];
          const [x, y] = project(lat, lng, w, h);
          const r = 4 + Math.sqrt(c.stationCount / max) * 18;
          return (
            <Link key={c.code} href={`/?country=${encodeURIComponent(c.code)}`}>
              <g className="cursor-pointer">
                <circle cx={x} cy={y} r={r} fill="rgba(34,211,238,0.18)" stroke="rgba(34,211,238,0.75)" />
                <title>{`${c.name}: ${c.stationCount.toLocaleString()} stations`}</title>
              </g>
            </Link>
          );
        })}
      </svg>
      <p className="mt-2 text-xs text-muted-foreground">{t("mapCaption")}</p>
    </div>
  );
}
