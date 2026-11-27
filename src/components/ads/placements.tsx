"use client";

import { AdSlot, type AdSlotProps } from "./ad-slot";

export type PlacementProps = Omit<AdSlotProps, "placement" | "slotId">;

/** Homepage placement. Renders nothing until its real slot ID is configured. */
export function HomeAd(props: PlacementProps) {
  return <AdSlot placement="home" {...props} />;
}

/** Station listing placement (`/stations`, `/explore`). */
export function ListingAd(props: PlacementProps) {
  return <AdSlot placement="listing" {...props} />;
}

/** Country landing pages share the configured listing slot. */
export function CountryAd({ label = "Advertisement — country stations", ...props }: PlacementProps) {
  return <AdSlot placement="listing" label={label} {...props} />;
}

/** Genre landing pages share the configured listing slot. */
export function GenreAd({ label = "Advertisement — genre stations", ...props }: PlacementProps) {
  return <AdSlot placement="listing" label={label} {...props} />;
}

/** Station detail placement. */
export function DetailAd({ label = "Advertisement — station", ...props }: PlacementProps) {
  return <AdSlot placement="detail" label={label} {...props} />;
}
