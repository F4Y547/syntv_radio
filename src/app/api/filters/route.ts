import { NextResponse } from "next/server";
import { getCountries, getLanguages, getTags } from "@/lib/api/radio-browser";

export async function GET() {
  try {
    const [countries, tags, languages] = await Promise.all([getCountries(), getTags(), getLanguages()]);
    return NextResponse.json({
      countries: countries.slice(0, 120),
      tags: tags.slice(0, 60),
      languages: languages.slice(0, 80),
    });
  } catch (error) {
    console.error("Filters API error", error);
    return NextResponse.json({ error: "Failed to load filters" }, { status: 502 });
  }
}
