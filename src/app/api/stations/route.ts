import { NextResponse } from "next/server";
import { searchStations } from "@/lib/api/radio-browser";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  try {
    const stations = await searchStations({
      search: searchParams.get("search") || undefined,
      country: searchParams.get("country") || undefined,
      tag: searchParams.get("tag") || undefined,
      limit: Number(searchParams.get("limit") || 24),
      offset: Number(searchParams.get("offset") || 0),
    });
    return NextResponse.json({ stations });
  } catch (error) {
    console.error("Stations API error", error);
    return NextResponse.json(
      { error: "Failed to load stations" },
      { status: 502 },
    );
  }
}
