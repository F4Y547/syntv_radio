import { NextResponse } from "next/server";
import { searchStations } from "@/lib/api/radio-browser";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  try {
    const orderParam = searchParams.get("order");
    const order =
      orderParam === "name" || orderParam === "votes" || orderParam === "clicktrend" || orderParam === "clickcount"
        ? orderParam
        : undefined;
    const reverseParam = searchParams.get("reverse");
    const stations = await searchStations({
      search: searchParams.get("search") || undefined,
      country: searchParams.get("country") || undefined,
      tag: searchParams.get("tag") || undefined,
      language: searchParams.get("language") || undefined,
      limit: Math.min(100, Math.max(1, Number(searchParams.get("limit") || 24))),
      offset: Math.max(0, Number(searchParams.get("offset") || 0)),
      order,
      reverse: reverseParam === "false" ? false : reverseParam === "true" ? true : undefined,
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
