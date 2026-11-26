import { NextResponse } from "next/server";
import { getCountries, getTags } from "@/lib/api/radio-browser";

export async function GET() {
  try {
    const [countries, tags] = await Promise.all([getCountries(), getTags()]);
    return NextResponse.json({
      countries: countries.slice(0, 120),
      tags: tags.slice(0, 60),
    });
  } catch (error) {
    console.error("Filters API error", error);
    return NextResponse.json({ error: "Failed to load filters" }, { status: 502 });
  }
}
