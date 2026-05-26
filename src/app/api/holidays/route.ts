import { NextResponse } from "next/server";
import { getPublicHolidayMap } from "@/lib/holidays";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const yearRaw = searchParams.get("year");
  const country = searchParams.get("country") || undefined;

  const nowYear = new Date().getFullYear();
  const year = Number(yearRaw || nowYear);
  if (!Number.isFinite(year) || year < 1900 || year > 2100) {
    return NextResponse.json({ error: "Invalid year" }, { status: 400 });
  }

  const holidays = await getPublicHolidayMap(year, country);
  return NextResponse.json({ year, country: (country || process.env.HOLIDAY_COUNTRY_CODE || "US").toUpperCase(), holidays });
}
